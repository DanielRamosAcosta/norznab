import ky, { type KyInstance } from "ky";
import { z } from "zod";
import { IndexerSchema, type Indexer } from "./schemas/indexer.ts";
import { MovieSchema, type Movie } from "./schemas/movie.ts";
import { CommandSchema, type Command } from "./schemas/command.ts";
import { QueueSchema, type Queue } from "./schemas/queue.ts";

/**
 * Radarr API client using ky for HTTP requests and Zod for validation
 *
 * Usage:
 *   const radarr = new Radarr({
 *     baseUrl: 'http://localhost:7878',
 *     apiKey: '...'
 *   });
 *   const movies = await radarr.getMovies();
 */
export class Radarr {
  private client: KyInstance;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.client = ky.create({
      prefixUrl: config.baseUrl,
      headers: {
        "X-Api-Key": config.apiKey,
      },
      retry: 0,
    });
  }

  /**
   * Helper to make GET requests with Zod validation
   */
  private async get<T>(endpoint: string, schema: z.ZodSchema<T>): Promise<T> {
    const response = await this.client.get(endpoint).json();
    return schema.parse(response);
  }

  /**
   * Helper to make POST requests with Zod validation
   */
  private async post<T>(
    endpoint: string,
    body: unknown,
    schema: z.ZodSchema<T>,
  ): Promise<T> {
    const response = await this.client.post(endpoint, { json: body }).json();
    return schema.parse(response);
  }

  /**
   * Helper to make PUT requests with Zod validation
   */
  private async put<T>(
    endpoint: string,
    body: unknown,
    schema: z.ZodSchema<T>,
  ): Promise<T> {
    const response = await this.client.put(endpoint, { json: body }).json();
    return schema.parse(response);
  }

  /**
   * Helper to make DELETE requests
   */
  private async delete(endpoint: string): Promise<void> {
    await this.client.delete(endpoint);
  }

  // Indexer Methods

  async getIndexers(): Promise<Indexer[]> {
    return this.get("api/v3/indexer", z.array(IndexerSchema));
  }

  async getIndexer(id: number): Promise<Indexer> {
    return this.get(`api/v3/indexer/${id}`, IndexerSchema);
  }

  async addIndexer(indexer: Partial<Indexer>): Promise<Indexer> {
    return this.post("api/v3/indexer", indexer, IndexerSchema);
  }

  async updateIndexer(id: number, indexer: Partial<Indexer>): Promise<Indexer> {
    return this.put(`api/v3/indexer/${id}`, indexer, IndexerSchema);
  }

  async deleteIndexer(id: number): Promise<void> {
    return this.delete(`api/v3/indexer/${id}`);
  }

  async testIndexer(indexer: Partial<Indexer>): Promise<void> {
    await this.post("api/v3/indexer/test", indexer, z.unknown());
  }

  async getIndexerSchema(): Promise<Indexer[]> {
    return this.get("api/v3/indexer/schema", z.array(IndexerSchema));
  }

  async deleteAllIndexers(): Promise<void> {
    const indexers = await this.getIndexers();
    await Promise.all(
      indexers.map((indexer) => this.deleteIndexer(indexer.id!)),
    );
  }

  // Movie Methods

  async getMovies(): Promise<Movie[]> {
    return this.get("api/v3/movie", z.array(MovieSchema));
  }

  async getMovieById(id: number): Promise<Movie> {
    return this.get(`api/v3/movie/${id}`, MovieSchema);
  }

  async addMovie(movie: Partial<Movie>): Promise<Movie> {
    return this.post("api/v3/movie", movie, MovieSchema);
  }

  async updateMovie(id: string | number, movie: Partial<Movie>): Promise<Movie> {
    return this.put(`api/v3/movie/${id}`, movie, MovieSchema);
  }

  async deleteMovie(id: number, deleteFiles?: boolean): Promise<void> {
    const params = new URLSearchParams();
    if (deleteFiles !== undefined) {
      params.set("deleteFiles", String(deleteFiles));
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `api/v3/movie/${id}?${queryString}`
      : `api/v3/movie/${id}`;
    return this.delete(endpoint);
  }

  async searchMovie(term: string): Promise<Movie[]> {
    const params = new URLSearchParams({ term });
    return this.get(`api/v3/movie/lookup?${params}`, z.array(MovieSchema));
  }

  async deleteAllMovies(deleteFiles?: boolean): Promise<void> {
    const movies = await this.getMovies();
    await Promise.all(movies.map((m) => this.deleteMovie(m.id!, deleteFiles)));
  }

  // Command Methods

  async runCommand(command: Partial<Command>): Promise<Command> {
    return this.post("api/v3/command", command, CommandSchema);
  }

  // Queue Methods

  async getQueue(): Promise<Queue> {
    return this.get("api/v3/queue", QueueSchema);
  }

  async deleteQueueItem(id: number): Promise<void> {
    await this.delete(`api/v3/queue/${id}`);
  }

  async flushQueue(): Promise<void> {
    const queue = await this.getQueue();
    if (queue.records) {
      for (const item of queue.records) {
        if (item.id) {
          await this.deleteQueueItem(item.id);
        }
      }
    }
  }
}
