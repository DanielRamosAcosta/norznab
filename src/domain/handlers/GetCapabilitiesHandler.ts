import { toXML } from "jstoxml";

export class GetCapabilitiesHandler {
  handle() {
    return toXML(
      {
        caps: [
          {
            searching: [
              {
                search: {
                  _attrs: { available: "yes", supportedParams: "q" },
                },
              },
              {
                "tv-search": {
                  _attrs: {
                    available: "yes",
                    supportedParams: "q,tmdbid,rid,tvdbid,tvmazeid,season,ep",
                  },
                },
              },
              {
                "movie-search": {
                  _attrs: { available: "yes", supportedParams: "tmdbid" },
                },
              },
            ],
          },
          {
            categories: [
              {
                category: {
                  _attrs: { id: "2000", name: "Movies" },
                },
              },
              {
                category: {
                  _attrs: { id: "5000", name: "TV" },
                },
              },
            ],
          },
        ],
      },
      {
        header: true,
        indent: "  ",
      },
    );
  }
}
