import type { ResolutionContext } from "inversify";
import { type TorznabRequest } from "../schemas/QuerySchema.ts";
import { GetCapabilitiesHandler } from "./GetCapabilitiesHandler.ts";
import { PerformTVSearchHandler } from "./PerformTVSearchHandler.ts";
import { PerformMovieSearchHandler } from "./PerformMovieSearchHandler.ts";
import { isCapabilitiesRequest } from "../schemas/CapabilitiesRequestSchema.ts";
import { isTVSearchRequest } from "../schemas/TVSearchRequestSchema.ts";

export class RequestHandler {
  private readonly capsHandler: GetCapabilitiesHandler;
  private readonly tvSearchHandler: PerformTVSearchHandler;
  private readonly movieSearchHandler: PerformMovieSearchHandler;

  public static async create(context: ResolutionContext) {
    const [tvSearchHandler, movieSearchHandler] = await Promise.all([
      PerformTVSearchHandler.create(context),
      PerformMovieSearchHandler.create(context),
    ]);

    return new RequestHandler(
      new GetCapabilitiesHandler(),
      tvSearchHandler,
      movieSearchHandler,
    );
  }

  constructor(
    capsHandler: GetCapabilitiesHandler,
    tvSearchHandler: PerformTVSearchHandler,
    movieSearchHandler: PerformMovieSearchHandler,
  ) {
    this.capsHandler = capsHandler;
    this.tvSearchHandler = tvSearchHandler;
    this.movieSearchHandler = movieSearchHandler;
  }

  async handle(request: TorznabRequest) {
    if (isCapabilitiesRequest(request)) {
      return this.capsHandler.handle();
    }

    if (isTVSearchRequest(request)) {
      return this.tvSearchHandler.handle(request);
    }

    return this.movieSearchHandler.handle(request);
  }
}
