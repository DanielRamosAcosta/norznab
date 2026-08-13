import { describe, it, expect } from "vitest";
import { decodeLink } from "./decodeLink.ts";

// Real `var link_out` payload captured from enlacito.com for movie/250811,
// together with the static passphrase and the URL it must decrypt to.
const LINK_OUT =
  "VTJGc2RHVmtYMSs2WUxBUG94dit2VjVJT1l2T2ROQnNEeHZLbUJCRndQTzh2NkNYU3YrNHA1WVhUNVg2MFM0UDlYY1ZQamp6T2g1eDVVdDFBT2ZhYytycDVFSE9uVlhSUnVPaGJZTEtmK1NHU09WQXFKQStSMWdJL2FERXpqd25VaVBhaExzWTA4N3N0US92UHUzeVAzZklaS0pzVWp4cjZoQnBvL1Z3dzd1TG9ia2w4RG1adlFJVjJWQ1R4dEttK2NjSEJsbVBPVFZuMDdLM3RCVGdDdz09";
const PASSPHRASE = "fee631d2cffda38a78b96ee6d2dfb43a";
const EXPECTED =
  "https://wolfmax4k.com/assets/u/t/temp/16082025/250811/superman--2025---BLuRayRip_17_1225.torrent?md5=axfiOt8sij5cVSreAm0Uxw&expires=1786884525";

describe("decodeLink", () => {
  it("decrypts a GibberishAES Salted__ payload to the signed torrent URL", () => {
    expect(decodeLink(LINK_OUT, PASSPHRASE)).toBe(EXPECTED);
  });

  it("throws on a non-Salted payload", () => {
    const notSalted = Buffer.from("hello world").toString("base64");
    expect(() => decodeLink(notSalted, PASSPHRASE)).toThrow();
  });
});
