import type { TorznabItemBase } from "./TorznabItemBase.ts";

/**
 * Torznab item for movie releases.
 *
 * @example
 * const movieItem: TorznabItemMovie = {
 *   size: "4500000000",
 *   category: "2000",
 *   imdbtitle: "The Matrix",
 *   imdb: "0133093",
 *   imdbscore: "8.7/10",
 *   video: "x264",
 *   audio: "AC3 5.1 @ 640 kbs"
 * };
 */
export type TorznabItemMovie = TorznabItemBase & {
  type: "movie";

  /**
   * Video codec.
   * @example "x264"
   */
  video?: string;

  /**
   * Audio codec.
   * @example "AC3 5.1 @ 640 kbs"
   */
  audio?: string;

  /**
   * Video resolution.
   * @example "1920x1080 16:9"
   */
  resolution?: string;

  /**
   * Video framerate in fps.
   * @example "23.976 fps"
   */
  framerate?: string;

  /**
   * Natural language(s).
   * @example "English"
   */
  language?: string;

  /**
   * Subtitles.
   * @example "English, Spanish, French"
   */
  subs?: string;

  /**
   * Genre.
   * @example "Sci-Fi, Action"
   */
  genre?: string;

  /**
   * IMDb ID.
   * @example "0104409"
   */
  imdb?: string;

  /**
   * IMDb score.
   * @example "8.7/10"
   */
  imdbscore?: string;

  /**
   * IMDb title.
   * @example "The Matrix"
   */
  imdbtitle?: string;

  /**
   * IMDb tagline.
   * @example "Welcome to the Real World"
   */
  imdbtagline?: string;

  /**
   * IMDb plot summary.
   * @example "A computer programmer learns about the true nature of reality."
   */
  imdbplot?: string;

  /**
   * IMDb release year.
   * @example "1999"
   */
  imdbyear?: string;

  /**
   * IMDb director.
   * @example "Lana Wachowski, Lilly Wachowski"
   */
  imdbdirector?: string;

  /**
   * IMDb actors.
   * @example "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss"
   */
  imdbactors?: string;

  /**
   * URL to cover image.
   * @example "http://servername.com/covers/movies/12345.jpg"
   */
  coverurl?: string;

  /**
   * URL to backdrop image.
   * @example "http://servername.com/covers/movies/12345-backdrop.jpg"
   */
  backdropcoverurl?: string;

  /**
   * Critics review.
   * @example "A groundbreaking sci-fi masterpiece"
   */
  review?: string;
};
