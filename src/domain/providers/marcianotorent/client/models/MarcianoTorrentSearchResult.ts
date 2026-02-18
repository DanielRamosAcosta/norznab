export class MarcianoTorrentSearchResult {
  readonly title: string;
  readonly quality: string;
  readonly href: string;

  constructor(title: string, quality: string, href: string) {
    this.title = title;
    this.quality = quality;
    this.href = href;
  }
}
