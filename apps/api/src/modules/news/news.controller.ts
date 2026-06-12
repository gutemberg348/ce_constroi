import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CreateNewsPostDto } from "./dto/create-news-post.dto";
import { ListNewsPostsDto } from "./dto/list-news-posts.dto";
import { UpdateNewsPostDto } from "./dto/update-news-post.dto";
import { NewsService } from "./news.service";

@ApiTags("news")
@Controller("news")
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Public()
  @Get()
  listPublished(@Query() query: ListNewsPostsDto) {
    return this.newsService.listPublished(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get("admin")
  listAdmin(@Query() query: ListNewsPostsDto) {
    return this.newsService.listAdmin(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateNewsPostDto) {
    return this.newsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateNewsPostDto) {
    return this.newsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.newsService.remove(id);
  }

  @Public()
  @Get(":slug")
  findPublished(@Param("slug") slug: string) {
    return this.newsService.findPublished(slug);
  }
}
