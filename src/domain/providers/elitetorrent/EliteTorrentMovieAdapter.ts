import type { ResolutionContext } from "inversify";
import { Token } from "../../Token.ts";
import { filterEmpty } from "../../utils/filterNull.ts";
import { mapLimit } from "../../utils/mapLimit.ts";
import type { MovieAdapter } from "../MovieAdapter.ts";
import { ProviderSource } from "../ProviderSource.ts";
import type { TorznabItemMovie } from "../../models/TorznabItemMovie.ts";
import type { EliteTorrent } from "./client/EliteTorrent.ts";
import type { Logger } from "../../services/Logger.ts";
import { LoggerNoop } from "../../services/LoggerNoop.ts";

const RESOLVE_CONCURRENCY = 6;

export class EliteTorrentMovieAdapter implements MovieAdapter {
  readonly source = ProviderSource.ELITETORRENT;

  private readonly eliteTorrent: EliteTorrent;
  private readonly logger: Logger;

  public static async create(context: ResolutionContext) {
    const [scrapper, logger] = await Promise.all([
      context.getAsync<EliteTorrent>(Token.ELITETORRENT_SCRAPPER),
      context.getAsync<Logger>(Token.LOGGER),
    ]);
    return new EliteTorrentMovieAdapter(scrapper, logger);
  }

  constructor(eliteTorrent: EliteTorrent, logger: Logger = new LoggerNoop()) {
    this.eliteTorrent = eliteTorrent;
    this.logger = logger.forClass(EliteTorrentMovieAdapter.name);
  }

  async findMovie(movieName: string): Promise<TorznabItemMovie[]> {
    const results = await this.eliteTorrent.search(movieName);
    this.logger.debug("findMovie resolving", {
      movieName,
      hits: results.length,
    });

    const items = await mapLimit(
      results,
      RESOLVE_CONCURRENCY,
      async (result): Promise<TorznabItemMovie | null> => {
        const release = await this.eliteTorrent
          .getRelease(result.path)
          .catch((error) => {
            this.logger.error("EliteTorrent release failed", {
              path: result.path,
              err: error,
            });
            return null;
          });
        if (!release) return null;

        return {
          type: "movie",
          // The magnet's own display name is the real release name so Radarr
          // parses the actual release (title + quality); fall back to the
          // results-grid title when the magnet carries no name.
          title: release.name || result.title,
          link: release.magnet,
          size: release.size,
          category: 2000,
          pubDate: release.pubDate,
        };
      },
    );

    return filterEmpty(items);
  }
}
