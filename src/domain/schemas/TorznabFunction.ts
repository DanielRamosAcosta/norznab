export const TorznabFunction = {
  CAPS: "caps",
  SEARCH: "search",
  TV_SEARCH: "tvsearch",
  MOVIE: "movie",
} as const;

export type TorznabFunctionValue =
  (typeof TorznabFunction)[keyof typeof TorznabFunction];
