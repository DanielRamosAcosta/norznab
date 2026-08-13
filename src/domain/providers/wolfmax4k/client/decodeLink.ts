import crypto from "node:crypto";

/**
 * Decrypts a CryptoJS / GibberishAES "Salted__" payload (AES-256-CBC with the
 * OpenSSL EVP_BytesToKey MD5 key derivation).
 *
 * enlacito.com embeds the real torrent URL as such a payload (`var link_out`)
 * encrypted with a static passphrase; decrypting it locally avoids the ad-gate.
 *
 * @param payload base64 string, optionally double base64-encoded (the raw bytes
 *   themselves are base64 of `Salted__` + 8-byte salt + ciphertext).
 * @param passphrase the shared static key.
 */
export function decodeLink(payload: string, passphrase: string): string {
  let blob = Buffer.from(payload, "base64");

  // The payload is frequently base64("U2FsdGVk...") i.e. base64 of the base64
  // OpenSSL envelope. Unwrap the extra layer when present.
  if (blob.subarray(0, 8).toString("latin1") === "U2FsdGVk") {
    blob = Buffer.from(blob.toString("latin1"), "base64");
  }

  if (blob.subarray(0, 8).toString("latin1") !== "Salted__") {
    throw new Error("Invalid Salted__ payload");
  }

  const salt = blob.subarray(8, 16);
  const ciphertext = blob.subarray(16);

  const { key, iv } = deriveKeyAndIv(passphrase, salt);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/** OpenSSL EVP_BytesToKey with MD5: 32-byte key + 16-byte IV. */
function deriveKeyAndIv(
  passphrase: string,
  salt: Buffer,
): { key: Buffer; iv: Buffer } {
  const password = Buffer.from(passphrase, "latin1");
  let derived = Buffer.alloc(0);
  let block = Buffer.alloc(0);
  while (derived.length < 48) {
    block = crypto
      .createHash("md5")
      .update(Buffer.concat([block, password, salt]))
      .digest();
    derived = Buffer.concat([derived, block]);
  }
  return { key: derived.subarray(0, 32), iv: derived.subarray(32, 48) };
}
