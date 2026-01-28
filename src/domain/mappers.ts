import { toXML } from "jstoxml";
import type { TorznabItem } from "./models/TorznabItem.ts";

function toAttribute<T = unknown>(name: string, value: T | undefined) {
  if (value == null) {
    return [];
  }

  return [
    {
      "torznab:attr": {
        _attrs: {
          name: name,
          value: value,
        },
      },
    },
  ];
}

function mapAttributes(item: TorznabItem) {
  return [
    ...toAttribute("category", item.category),
    ...toAttribute("size", item.size),
    ...(item.type === "tv" && item.season
      ? [
          {
            "torznab:attr": {
              _attrs: {
                name: "season",
                value: item.season,
              },
            },
          },
        ]
      : []),
    ...(item.type === "tv" && item.episode
      ? [
          {
            "torznab:attr": {
              _attrs: {
                name: "episode",
                value: item.episode,
              },
            },
          },
        ]
      : []),
    ...toAttribute("comments", item.comments),
    ...toAttribute("grabs", item.grabs),
    ...toAttribute("usenetdate", item.usenetdate),
  ];
}

export const getTorznabRssXml = (items: TorznabItem[] = []): string => {
  const itemsXml = items.map((item) => {
    return {
      item: [
        { title: item.title },
        { guid: item.link },
        { link: item.link },
        ...(item.pubDate ? [{ pubDate: item.pubDate }] : []),
        ...(item.description ? [{ description: item.description }] : []),
        {
          enclosure: {
            _attrs: {
              url: item.link,
              length: item.size ?? 0,
              type: "application/x-bittorrent",
            },
          },
        },
        ...mapAttributes(item),
      ],
    };
  });

  return toXML(
    {
      rss: {
        _attrs: {
          version: "2.0",
          "xmlns:torznab": "http://torznab.com/schemas/2.0",
        },
        channel: [
          { title: "Norznab API" },
          { link: "http://localhost:3000" },
          { description: "Torznab-compatible API" },
          { language: "en-us" },
          ...itemsXml,
        ],
      },
    },
    {
      header: true,
      indent: "  ",
    },
  );
};
