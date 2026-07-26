import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import type { Request } from "express";
import { verifyScsToken } from "./scs-token.js";

interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Verifies the `Authorization: Bearer <scs-token>` header and attaches the
 * resolved `userId` to the request. Rejects missing or invalid tokens.
 */
@Injectable()
export class ScsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }
    try {
      req.userId = await verifyScsToken(token);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
    return true;
  }
}

/** Injects the authenticated `userId` resolved by {@link ScsAuthGuard}. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.userId) {
      throw new UnauthorizedException("Not authenticated");
    }
    return req.userId;
  },
);
