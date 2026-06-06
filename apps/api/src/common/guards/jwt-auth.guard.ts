import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
      return request.headers.authorization ? super.canActivate(context) : true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(
    error: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext
  ): TUser | null {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return user ?? null;
    }

    if (error instanceof Error) {
      throw error;
    }

    if (error || !user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
