import type { Container } from "inversify";
import { createMiddleware } from "hono/factory";

declare module "hono" {
  interface ContextVariableMap {
    container: Container;
  }
}

export function containerMiddleware(container: Container) {
  return createMiddleware(async (c, next) => {
    c.set("container", container);
    await next();
  });
}
