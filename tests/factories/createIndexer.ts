export function createIndexer(port: number) {
  return {
    name: "Norznab",
    implementation: "Torznab",
    configContract: "TorznabSettings",
    enableAutomaticSearch: true,
    priority: 25,
    fields: [
      {
        name: "baseUrl",
        value: `http://host.testcontainers.internal:${port}`,
      },
    ],
  };
}
