import { Injectable, NotFoundException } from "@nestjs/common";
import { getPagination, PaginationQueryDto } from "@/common/pagination/pagination.dto";
import { UsersRepository } from "./repositories/users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findMe(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.toPublicUser(user);
  }

  async findAll(query: PaginationQueryDto) {
    const pagination = getPagination(query);
    const [items, total] = await this.usersRepository.findMany({
      skip: pagination.skip,
      take: pagination.take,
      search: query.search
    });

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  private toPublicUser(user: Awaited<ReturnType<UsersRepository["findById"]>>) {
    if (!user) {
      return null;
    }

    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }
}
