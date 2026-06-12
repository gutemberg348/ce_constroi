import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { Request, Response } from "express";

const translatedMessages: Record<string, string> = {
  "Admin cannot remove itself": "O administrador não pode excluir a própria conta.",
  "Terrain image not found": "Imagem do terreno não encontrada.",
  "Project image not found": "Imagem do projeto não encontrada.",
  "Architect not found": "Arquiteto não encontrado.",
  "Architect profile not found": "Perfil de arquiteto não encontrado.",
  "Terrain not found": "Terreno não encontrado.",
  "User not found": "Usuário não encontrado.",
  "Project not found": "Projeto não encontrado.",
  "Simulation not found": "Simulação não encontrada.",
  "Order not found": "Pedido não encontrado.",
  "Notification not found": "Notificação não encontrada.",
  "Favorite not found": "Favorito não encontrado.",
  "Email already registered": "Este e-mail já está cadastrado.",
  "Invalid credentials": "E-mail ou senha inválidos.",
  "Invalid refresh token": "Sua sessão expirou. Entre novamente.",
  "You can only link your own projects to terrains": "Você só pode adequar aos terrenos os seus próprios projetos.",
  "Favorite requires exactly one target": "Selecione apenas um terreno ou projeto para favoritar.",
  "Order requires terrain, project or simulation": "O pedido precisa estar vinculado a um terreno, projeto ou simulação.",
  "projectId is required": "Selecione um projeto.",
  "terrainId is required": "Selecione um terreno.",
  "You can only add images to your own project": "Você só pode adicionar imagens aos seus próprios projetos.",
  "You can only remove images from your own project": "Você só pode remover imagens dos seus próprios projetos.",
  "Architect profile must be approved before changing project images":
    "Seu perfil precisa ser aprovado antes de alterar imagens de projetos.",
  "You can only update your own project": "Você só pode editar os seus próprios projetos.",
  "Architect profile required": "É necessário possuir um perfil de construtora/arquiteto.",
  "Architect profile must be approved by admin before publishing projects":
    "Seu perfil precisa ser aprovado pelo administrador antes de publicar projetos.",
  "You can only add images to your own terrain": "Você só pode adicionar imagens aos seus próprios terrenos.",
  "You can only remove images from your own terrain": "Você só pode remover imagens dos seus próprios terrenos.",
  "You can only update your own terrain": "Você só pode editar os seus próprios terrenos."
};

function translateMessage(message: string) {
  return translatedMessages[message] ?? message;
}

function translateExceptionResponse(value: string | object) {
  if (typeof value === "string") {
    return translateMessage(value);
  }

  if ("message" in value) {
    const response = value as { message?: unknown };
    const message = response.message;

    if (typeof message === "string") {
      return { ...value, message: translateMessage(message) };
    }

    if (Array.isArray(message)) {
      const messages = message.filter((item): item is string => typeof item === "string");

      return {
        ...value,
        message: messages.map(translateMessage)
      };
    }
  }

  return value;
}

function isUniqueConstraintError(exception: unknown) {
  return Boolean(
    exception &&
      typeof exception === "object" &&
      "code" in exception &&
      exception.code === "P2002"
  );
}

function uniqueConstraintMessage(exception: unknown) {
  if (!exception || typeof exception !== "object" || !("meta" in exception)) {
    return "Já existe um cadastro com essas informações.";
  }

  const meta = exception.meta;
  const target =
    meta && typeof meta === "object" && "target" in meta
      ? String(meta.target).toLowerCase()
      : "";

  if (target.includes("email")) {
    return "Este e-mail já está cadastrado.";
  }

  if (target.includes("cau")) {
    return "Este número de CAU já está cadastrado.";
  }

  return "Já existe um cadastro com essas informações.";
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { requestId?: string }>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : isUniqueConstraintError(exception)
        ? HttpStatus.CONFLICT
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? translateExceptionResponse(exception.getResponse())
      : isUniqueConstraintError(exception)
        ? uniqueConstraintMessage(exception)
        : "Não foi possível concluir a operação. Tente novamente.";

    if (!(exception instanceof HttpException) && !isUniqueConstraintError(exception)) {
      const message = exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : undefined;

      this.logger.error(`${request.method} ${request.url} ${request.requestId ?? ""} - ${message}`, stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      error: exceptionResponse
    });
  }
}
