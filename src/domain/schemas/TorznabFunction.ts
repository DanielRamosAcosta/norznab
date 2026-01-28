export const TorznabFunction = {
  CAPS: "caps",
  TV_SEARCH: "tvsearch",
  MOVIE: "movie",
} as const;

export type TorznabFunctionValue =
  (typeof TorznabFunction)[keyof typeof TorznabFunction];
