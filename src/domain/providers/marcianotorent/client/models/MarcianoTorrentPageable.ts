export type MarcianoTorrentPageableMeta = {
  page: number;
  size: number;
  hasNext: boolean;
};

export type MarcianoTorrentPageable<T> = {
  items: T[];
  meta: MarcianoTorrentPageableMeta;
};
