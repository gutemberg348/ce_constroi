import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsRepository } from "./repositories/projects.repository";
import { ProjectsService } from "./projects.service";

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
  exports: [ProjectsRepository, ProjectsService]
})
export class ProjectsModule {}
