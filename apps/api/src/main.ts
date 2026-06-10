import "reflect-metadata";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false
  });

  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const port = config.get<number>("API_PORT", 3333);
  const bodyLimit = config.get<string>("API_BODY_LIMIT", "25mb");

  app.setGlobalPrefix("api/v1");
  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors({
    origin: config.get<string>("WEB_PUBLIC_URL", "http://localhost:3000"),
    credentials: true
  });
  app.use(helmet());
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new LoggingInterceptor(),
    new ResponseTransformInterceptor()
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Anselmo Marketplace API")
    .setDescription("API para marketplace de terrenos, projetos, simulacoes, pagamentos e paineis.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true }
  });

  await app.listen(port);
}

void bootstrap();
