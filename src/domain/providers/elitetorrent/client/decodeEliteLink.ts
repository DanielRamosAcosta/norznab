/**
 * EliteTorrent hides its download URLs behind an `acortame-esto.com/s.php?i=<token>`
 * ad-gate, but the token is not a server-side lookup: it is the real target
 * (a `.torrent` path on elitetorrent.com, or a `magnet:` URI) obfuscated purely
 * client-side. Peeling it lets us skip the ad-gate entirely.
 *
 * The obfuscation is several rounds of base64 wrapping a final ROT13 layer:
 * `base64(base64(…(rot13(target))))`. We peel base64 while the payload still
 * looks like base64, then ROT13 the result.
 */
export function decodeEliteLink(token: string): string {
  let payload = token.trim();

  for (let i = 0; i < 12 && isBase64(payload); i++) {
    const decoded = Buffer.from(payload, "base64").toString("utf8");
    if (!decoded || decoded === payload) break;
    payload = decoded;
  }

  return rot13(payload);
}

function isBase64(value: string): boolean {
  return (
    value.length >= 4 &&
    value.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}

function rot13(value: string): string {
  return value.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}
