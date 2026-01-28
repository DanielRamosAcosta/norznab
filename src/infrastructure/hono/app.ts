import { Hono } from "hono";
import { ZodError } from "zod";
import { toXML } from "jstoxml";
import { pinoLogger } from "hono-pino";
import {
  TorznabErrorCode,
  type TorznabErrorCodeValue,
} from "../../domain/models/TorznabErrorCode.ts";
import { ApiError } from "../../domain/models/ApiError.ts";
import { QuerySchema } from "../../domain/schemas/QuerySchema.ts";
import { container } from "../container.ts";
import { containerMiddleware } from "./middlewares/ContainerMiddleware.ts";
import { Token } from "../../domain/Token.ts";
import type { RequestHandler } from "../../domain/services/RequestHandler.ts";

export const app = new Hono()
  .use(containerMiddleware(container))
  .use(
    pinoLogger({
      pino: {
        level: process.env.NODE_ENV === "test" ? "silent" : "debug",
      },
    }),
  )
  .get("/api", async (c) => {
    c.var.logger.debug({ message: "Incoming request", query: c.req.query() });
    const params = QuerySchema.parse(c.req.query());

    const requestHandler = await c.var.container.getAsync<RequestHandler>(
      Token.REQUEST_HANDLER,
    );

    const xml = await requestHandler.handle(params);

    return c.text(xml, 200, {
      "Content-Type": "application/xml; charset=UTF-8",
    });
  })
  .onError((error, c) => {
    c.var.logger.error(error);
    let code: TorznabErrorCodeValue = TorznabErrorCode.UNKNOWN_ERROR;
    let description = "Unknown error ocurred";

    if (error instanceof ZodError) {
      code = TorznabErrorCode.INCORRECT_PARAMETER;
      description =
        "Invalid parameters provided: " + error.issues.flatMap((i) => i.path);
    }

    if (error instanceof ApiError) {
      code = error.code;
      description = error.message;
    }

    return c.text(
      toXML(
        {
          error: {
            _attrs: {
              code,
              description,
            },
          },
        },
        {
          header: true,
          indent: "  ",
        },
      ),
      200,
      {
        "Content-Type": "application/xml; charset=UTF-8",
      },
    );
  });
