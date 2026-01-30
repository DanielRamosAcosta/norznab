import type { ResolutionContext } from "inversify";
import { type TorznabRequest } from "../schemas/QuerySchema.ts";
import { GetCapabilitiesHandler } from "./GetCapabilitiesHandler.ts";
import { PerformTVSearchHandler } from "./PerformTVSearchHandler.ts";
import { PerformMovieSearchHandler } from "./PerformMovieSearchHandler.ts";
import { isCapabilitiesRequest } from "../schemas/CapabilitiesRequestSchema.ts";
import { isTVSearchRequest } from "../schemas/TVSearchRequestSchema.ts";
import { getTorznabRssXml } from "../mappers.ts";
import type { Logger } from "testcontainers/build/common/logger.js";
import { Token } from "../Token.ts";

export class RequestHandler {
  private readonly capsHandler: GetCapabilitiesHandler;
  private readonly tvSearchHandler: PerformTVSearchHandler;
  private readonly movieSearchHandler: PerformMovieSearchHandler;
  private readonly logger: Logger;

  public static async create(context: ResolutionContext) {
    const [tvSearchHandler, movieSearchHandler, logger] = await Promise.all([
      PerformTVSearchHandler.create(context),
      PerformMovieSearchHandler.create(context),
      context.getAsync<Logger>(Token.LOGGER),
    ]);

    return new RequestHandler(
      new GetCapabilitiesHandler(),
      tvSearchHandler,
      movieSearchHandler,
      logger,
    );
  }

  constructor(
    capsHandler: GetCapabilitiesHandler,
    tvSearchHandler: PerformTVSearchHandler,
    movieSearchHandler: PerformMovieSearchHandler,
    logger: Logger,
  ) {
    this.capsHandler = capsHandler;
    this.tvSearchHandler = tvSearchHandler;
    this.movieSearchHandler = movieSearchHandler;
    this.logger = logger;
  }

  async handle(request: TorznabRequest): Promise<string> {
    if (isCapabilitiesRequest(request)) {
      return this.capsHandler.handle();
    }

    if (isTVSearchRequest(request)) {
      const results = await this.tvSearchHandler.handle(request);
      this.logger.info(`TVSearch results: ${JSON.stringify(results)}`);
      return getTorznabRssXml(results);
    }

    const results = await this.movieSearchHandler.handle(request);
    this.logger.info(`MovieSearch results: ${JSON.stringify(results)}`);
    return getTorznabRssXml(results);
  }
}
