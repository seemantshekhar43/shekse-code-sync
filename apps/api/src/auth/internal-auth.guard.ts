import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/**
 * Verifies the `X-Internal-Secret` header against `INTERNAL_API_SECRET`. This
 * guards the `/internal/*` routes `web`'s server-side code calls directly -
 * a separate trust boundary from `ScsAuthGuard` (end-user bearer tokens), and
 * a secret that is never shared with the extension or the browser.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret) {
      throw new UnauthorizedException("INTERNAL_API_SECRET is not set");
    }
    if (req.headers["x-internal-secret"] !== secret) {
      throw new UnauthorizedException("Invalid internal secret");
    }
    return true;
  }
}
