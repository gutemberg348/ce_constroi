import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { UsersRepository } from "../users/repositories/users.repository";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { AuthMailService } from "./mail.service";

type TokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: AuthMailService
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN || dto.role === UserRole.ARCHITECT) {
      throw new BadRequestException("Esse perfil deve ser criado pelo administrador.");
    }

    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException("Este e-mail já está cadastrado.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.CUSTOMER,
      phone: dto.phone,
      companyName: dto.companyName,
      cauNumber: dto.cauNumber,
      bio: dto.bio
    });

    return this.issueAndPersistTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Esta conta esta indisponivel. Fale com o atendimento.");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("E-mail ou senha inválidos.");
    }

    return this.issueAndPersistTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET")
      });
      const user = await this.usersRepository.findById(payload.sub);

      if (!user?.refreshTokenHash || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException("Sua sessão expirou. Entre novamente.");
      }

      const tokenMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);

      if (!tokenMatches) {
        throw new UnauthorizedException("Sua sessão expirou. Entre novamente.");
      }

      return this.issueAndPersistTokens({
        sub: user.id,
        email: user.email,
        role: user.role
      });
    } catch {
      throw new UnauthorizedException("Sua sessão expirou. Entre novamente.");
    }
  }

  async logout(userId: string) {
    await this.usersRepository.updateRefreshTokenHash(userId, null);
    return { loggedOut: true };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    this.mail.assertPasswordResetConfigured();

    const user = await this.usersRepository.findByEmail(dto.email);
    const response = {
      message: "Se existir uma conta com este e-mail, enviaremos um link para redefinir a senha."
    };

    if (!user || user.status !== UserStatus.ACTIVE) {
      return response;
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashResetToken(rawToken);
    const expiresInMinutes = this.config.get<number>("PASSWORD_RESET_TTL_MINUTES", 30);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
    });

    const resetUrl = new URL("/redefinir-senha", this.config.getOrThrow<string>("WEB_PUBLIC_URL"));
    resetUrl.searchParams.set("token", rawToken);

    await this.mail.sendPasswordReset({
      name: user.name,
      email: user.email,
      resetUrl: resetUrl.toString(),
      expiresInMinutes
    });

    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: this.hashResetToken(dto.token),
        usedAt: null,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null, status: UserStatus.ACTIVE }
      }
    });

    if (!token) {
      throw new BadRequestException("Este link e invalido ou expirou. Solicite uma nova troca de senha.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      const usedAt = new Date();
      const claim = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: usedAt } },
        data: { usedAt }
      });

      if (claim.count !== 1) {
        throw new BadRequestException("Este link e invalido ou expirou. Solicite uma nova troca de senha.");
      }

      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash, refreshTokenHash: null }
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId: token.userId, id: { not: token.id } }
      });
    });

    return { message: "Senha atualizada com sucesso. Entre com sua nova senha." };
  }

  async me(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado.");
    }

    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    void passwordHash;
    void refreshTokenHash;

    return safeUser;
  }

  private async issueAndPersistTokens(payload: TokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m") as JwtSignOptions["expiresIn"]
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "7d") as JwtSignOptions["expiresIn"]
      })
    ]);

    await this.usersRepository.updateRefreshTokenHash(payload.sub, await bcrypt.hash(refreshToken, 12));

    return {
      accessToken,
      refreshToken,
      user: await this.me(payload.sub)
    };
  }

  private hashResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
