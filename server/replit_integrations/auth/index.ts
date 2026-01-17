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

export function getSession() {
  if (isReplitEnvironment) {
    return getReplitSession();
  } else {
    return getLocalSession();
  }
}
