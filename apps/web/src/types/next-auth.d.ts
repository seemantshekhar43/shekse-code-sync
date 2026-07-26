import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** Our persistent User.id (cuid), resolved on sign-in. */
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
