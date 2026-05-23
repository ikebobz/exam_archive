import { setupAuth as setupReplitAuth, isAuthenticated as replitIsAuthenticated, getSession as getReplitSession } from "./replitAuth";
import { setupLocalAuth, isAuthenticated as localIsAuthenticated, getSession as getLocalSession, seedAdminUser } from "./localAuth";
import type { Express, RequestHandler } from "express";

export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";

const isReplitEnvironment = !!process.env.REPL_ID;

export async function setupAuth(app: Express) {
  if (isReplitEnvironment) {
    console.log("Using Replit Auth");
    return setupReplitAuth(app);
  } else {
    console.log("Using Local Auth (username/password)");
    await setupLocalAuth(app);
    await seedAdminUser();
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (isReplitEnvironment) {
    return replitIsAuthenticated(req, res, next);
  } else {
    return localIsAuthenticated(req, res, next);
  }
};

/** Session user id — works for local auth (`id`) and Replit OIDC (`claims.sub`). */
export function getRequestUserId(req: { user?: Express.User }): string | undefined {
  const user = req.user as { id?: string; claims?: { sub?: string } } | undefined;
  return user?.claims?.sub ?? user?.id;
}

export function getSession() {
  if (isReplitEnvironment) {
    return getReplitSession();
  } else {
    return getLocalSession();
  }
}
