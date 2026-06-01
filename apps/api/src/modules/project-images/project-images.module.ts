import { Module } from "@nestjs/common";
import { ProjectImagesController } from "./project-images.controller";
import { ProjectImagesService } from "./project-images.service";

@Module({
  controllers: [ProjectImagesController],
  providers: [ProjectImagesService]
})
export class ProjectImagesModule {}
