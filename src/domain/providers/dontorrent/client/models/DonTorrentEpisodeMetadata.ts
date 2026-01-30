export class DonTorrentEpisodeMetadata {
  readonly contentId: number;
  readonly table: string;
  readonly title: string;
  readonly date: string;

  constructor(params: {
    contentId: number;
    table: string;
    title: string;
    date: string;
  }) {
    this.contentId = params.contentId;
    this.table = params.table;
    this.title = params.title;
    this.date = params.date;
  }

  toUTCDate(): string {
    const date = new Date(this.date);
    return date.toUTCString();
  }
}
