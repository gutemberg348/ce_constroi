import * as bcrypt from "bcrypt";
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { UserRole } from "@/generated/prisma/enums";
import { UsersRepository } from "../users/repositories/users.repository";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";

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
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.ADMIN) {
      throw new BadRequestException("Admin users must be created by the platform owner");
    }

    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.CUSTOMER,
      phone: dto.phone
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
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
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

      if (!user?.refreshTokenHash) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const tokenMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);

      if (!tokenMatches) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.issueAndPersistTokens({
        sub: user.id,
        email: user.email,
        role: user.role
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string) {
    await this.usersRepository.updateRefreshTokenHash(userId, null);
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...safeUser } = user;
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
}
