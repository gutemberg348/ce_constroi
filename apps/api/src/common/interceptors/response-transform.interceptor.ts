import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

type DecimalLike = Record<string, unknown> & {
  s: number;
  e: number;
  d: unknown[];
  toString: () => string;
};

function isDecimalLike(value: Record<string, unknown>): value is DecimalLike {
  return (
    typeof value.s === "number" &&
    typeof value.e === "number" &&
    Array.isArray(value.d) &&
    typeof value.toString === "function"
  );
}

function normalizeResponseData(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeResponseData(item));
  }

  if (typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;

  if (isDecimalLike(record)) {
    const parsed = Number(record.toString());
    return Number.isFinite(parsed) ? parsed : record.toString();
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, normalizeResponseData(item)])
  );
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ requestId?: string }>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        requestId: request.requestId,
        data: normalizeResponseData(data)
      }))
    );
  }
}
