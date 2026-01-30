import ky, { type KyInstance } from "ky";
import { z } from "zod";
import { IndexerSchema, type Indexer } from "./schemas/indexer.ts";
import { SeriesSchema, type Series } from "./schemas/series.ts";
import { EpisodeSchema, type Episode } from "./schemas/episode.ts";
import { CommandSchema, type Command } from "./schemas/command.ts";
import { HistoryPagingSchema, type HistoryPaging } from "./schemas/history.ts";
import {
  QualityProfileSchema,
  type QualityProfile,
} from "./schemas/quality-profile.ts";
import { SystemSchema, type System } from "./schemas/system.ts";
import { HealthSchema, type Health } from "./schemas/health.ts";
import {
  DownloadClientSchema,
  type DownloadClient,
} from "./schemas/download-client.ts";
import { TagSchema, type Tag } from "./schemas/tag.ts";
import { QueueSchema, type Queue } from "./schemas/queue.ts";

/**
 * Sonarr API client using ky for HTTP requests and Zod for validation
 *
 * Usage:
 *   const sonarr = new Sonarr({
 *     baseUrl: 'http://localhost:8989',
 *     apiKey: '...'
 *   });
 *   const indexers = await sonarr.getIndexers();
 */
export class Sonarr {
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

  // Series Methods

  async getSeries(): Promise<Series[]> {
    return this.get("api/v3/series", z.array(SeriesSchema));
  }

  async getSeriesById(id: number): Promise<Series> {
    return this.get(`api/v3/series/${id}`, SeriesSchema);
  }

  async addSeries(series: Partial<Series>): Promise<Series> {
    return this.post("api/v3/series", series, SeriesSchema);
  }

  async updateSeries(
    id: string | number,
    series: Partial<Series>,
  ): Promise<Series> {
    return this.put(`api/v3/series/${id}`, series, SeriesSchema);
  }

  async deleteSeries(id: number, deleteFiles?: boolean): Promise<void> {
    const params = new URLSearchParams();
    if (deleteFiles !== undefined) {
      params.set("deleteFiles", String(deleteFiles));
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `api/v3/series/${id}?${queryString}`
      : `api/v3/series/${id}`;
    return this.delete(endpoint);
  }

  async searchSeries(term: string): Promise<Series[]> {
    const params = new URLSearchParams({ term });
    return this.get(`api/v3/series/lookup?${params}`, z.array(SeriesSchema));
  }

  async deleteAllSeries(deleteFiles?: boolean): Promise<void> {
    const series = await this.getSeries();
    await Promise.all(series.map((s) => this.deleteSeries(s.id!, deleteFiles)));
  }

  // Episode Methods

  async getEpisodes(seriesId?: number): Promise<Episode[]> {
    let endpoint = "api/v3/episode";
    if (seriesId) {
      endpoint += `?seriesId=${seriesId}`;
    }
    return this.get(endpoint, z.array(EpisodeSchema));
  }

  async getEpisode(id: number): Promise<Episode> {
    return this.get(`api/v3/episode/${id}`, EpisodeSchema);
  }

  async updateEpisode(id: number, episode: Partial<Episode>): Promise<Episode> {
    return this.put(`api/v3/episode/${id}`, episode, EpisodeSchema);
  }

  // Command Methods

  async runCommand(command: Partial<Command>): Promise<Command> {
    return this.post("api/v3/command", command, CommandSchema);
  }

  // History Methods

  async getHistory(page?: number, pageSize?: number): Promise<HistoryPaging> {
    const params = new URLSearchParams();
    if (page !== undefined) params.set("page", String(page));
    if (pageSize !== undefined) params.set("pageSize", String(pageSize));
    const queryString = params.toString();
    const endpoint = queryString
      ? `api/v3/history?${queryString}`
      : "api/v3/history";
    return this.get(endpoint, HistoryPagingSchema);
  }

  // Quality Profile Methods

  async getQualityProfiles(): Promise<QualityProfile[]> {
    return this.get("api/v3/qualityprofile", z.array(QualityProfileSchema));
  }

  async getQualityProfile(id: number): Promise<QualityProfile> {
    return this.get(`api/v3/qualityprofile/${id}`, QualityProfileSchema);
  }

  async addQualityProfile(
    profile: Partial<QualityProfile>,
  ): Promise<QualityProfile> {
    return this.post("api/v3/qualityprofile", profile, QualityProfileSchema);
  }

  // System Methods

  async getSystemStatus(): Promise<System> {
    return this.get("api/v3/system/status", SystemSchema);
  }

  async getHealth(): Promise<Health[]> {
    return this.get("api/v3/health", z.array(HealthSchema));
  }

  // Download Client Methods

  async getDownloadClients(): Promise<DownloadClient[]> {
    return this.get("api/v3/downloadclient", z.array(DownloadClientSchema));
  }

  // Tag Methods

  async getTags(): Promise<Tag[]> {
    return this.get("api/v3/tag", z.array(TagSchema));
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
    let records = queue.records ?? [];

    while (records.length > 1) {
      const id = records[0].id;
      id && (await this.deleteQueueItem(id));

      const queue = await this.getQueue();
      records = queue.records ?? [];
    }
  }
}
