export type RSSItem = {
  /** Title of the item (release name or content) */
  title: string;
  /** Download URL or resource link */
  link: string;
  /** Publication date in RFC 822 format (e.g., "Mon, 13 Jan 2025 10:00:00 GMT") */
  pubDate: string;
  /** Description or summary of the content */
  description?: string;
};
