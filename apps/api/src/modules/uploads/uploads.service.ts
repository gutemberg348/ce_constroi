import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PresignUploadDto } from "./dto/presign-upload.dto";

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  presign(dto: PresignUploadDto) {
    const bucket = this.config.get<string>("S3_BUCKET", "anselmo-marketplace-dev");
    const publicUrl = this.config.get<string>("S3_PUBLIC_URL", "https://cdn.example.test");
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9_.-]+/g, "-");
    const key = `${dto.kind.toLowerCase()}/${randomUUID()}-${safeName}`;

    return {
      provider: this.config.get<string>("STORAGE_PROVIDER", "s3"),
      bucket,
      key,
      uploadUrl: `https://storage.example.test/${bucket}/${key}?signature=dev-placeholder`,
      publicUrl: `${publicUrl}/${key}`,
      headers: {
        "content-type": dto.contentType
      }
    };
  }
}
