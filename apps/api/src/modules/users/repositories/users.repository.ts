import { Injectable } from "@nestjs/common";
import { UserRole } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  companyName?: string;
  cauNumber?: string;
  bio?: string;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { architectProfile: true }
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { architectProfile: true }
    });
  }

  async create(input: CreateUserInput) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          role: input.role,
          phone: input.phone
        }
      });

      if (input.role === UserRole.ARCHITECT) {
        await tx.architect.create({
          data: {
            userId: user.id,
            companyName: input.companyName || input.name,
            cauNumber: input.cauNumber || undefined,
            bio: input.bio || "Cadastro enviado pelo formulario publico."
          }
        });
      }

      return user;
    });
  }

  updateRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }

  findMany(params: { skip: number; take: number; search?: string }) {
    const where = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { email: { contains: params.search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.user.count({ where })
    ]);
  }
}
