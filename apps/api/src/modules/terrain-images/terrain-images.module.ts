import { Module } from "@nestjs/common";
import { TerrainImagesController } from "./terrain-images.controller";
import { TerrainImagesService } from "./terrain-images.service";

@Module({
  controllers: [TerrainImagesController],
  providers: [TerrainImagesService]
})
export class TerrainImagesModule {}
