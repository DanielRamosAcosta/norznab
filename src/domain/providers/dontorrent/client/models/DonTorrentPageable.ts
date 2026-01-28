export type DonTorrentPageableMeta = {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type DonTorrentPageable<T> = {
  items: T[];
  meta: DonTorrentPageableMeta;
};
