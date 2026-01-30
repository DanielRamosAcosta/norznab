export type DonTorrentPageableMeta = {
  page: number;
  size: number;
  hasNext: boolean;
};

export type DonTorrentPageable<T> = {
  items: T[];
  meta: DonTorrentPageableMeta;
};
