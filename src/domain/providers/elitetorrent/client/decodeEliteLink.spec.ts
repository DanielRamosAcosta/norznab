import { describe, it, expect } from "vitest";
import { decodeEliteLink } from "./decodeEliteLink.ts";

// Real-shaped tokens: base64 x5 wrapping a ROT13 payload, as EliteTorrent emits
// in its `acortame-esto.com/s.php?i=<token>` ad-gate links.
const MAGNET_TOKEN =
  "VjJ4amQwMVZNVWRpUm14VVlsUldVVmxYY0hObFZtUjFZak5vYVUxWVFsbFZiRkpoWVZVeGRGVlliR0ZTYkVveldrWmtTbVZzUm5WaFIzQnBZWHBGZWxaR1dsTlRiVlp5VGxWV1YxWkZjRkJhVnpGcVRWWk9kRTFFUms5aVIzY3lXa1ZvYjFkc1drVlNiV2hhWWxSR2NsbHJaRk5rUjAxNlUydDBWMUpYYzNkV2JYaGhVakZLZEZWdVVsVldNMmhQV1ZjeE1HVldUbk5WYTNCUFVteGFNVmxyVWt0WlZUQjNZMFZzV0ZaNlJsaFphMlJQWkVaS2RFNVZNV2xXVm04eFZqSTFjMVp0VmxaUFZrcFJWa1JCT1E9PQ==";
const TORRENT_TOKEN =
  "VmtWU1MyUXlSbkpsUm14U1lsZDRZVlpxU2xOT1ZtUlhXa2R3YTJKVldrbFdSM0JYVjIxS1ZWWnFVbGhpVjNNeFdsY3hVMlJYU2tsaVIwWm9Wa2R6ZVZkWE1IaGhNa3BJVlc1U2FrMHhTbkpXTUZaaFl6RndTRTFWTld0V2JUazFWVEl4TkZsV1pFWmpSemxZWW0xTk5WVkdSVGxRVVQwOQ==";

describe("decodeEliteLink", () => {
  it("peels the base64 layers and ROT13 down to the magnet", () => {
    expect(decodeEliteLink(MAGNET_TOKEN)).toBe(
      "magnet:?xt=urn:btih:abcdef0123456789&amp;dn=Matrix+%28HDRip%29+%28EliteTorrent.net%29",
    );
  });

  it("decodes to the on-site .torrent path", () => {
    expect(decodeEliteLink(TORRENT_TOKEN)).toBe(
      "/wp-content/uploads/files/matrix-hdrip.torrent",
    );
  });
});
