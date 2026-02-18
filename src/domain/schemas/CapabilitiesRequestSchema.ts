import { z } from "zod";
import { TorznabFunction } from "./TorznabFunction.ts";

export const CapsRequestSchema = z
  .object({
    t: z.literal(TorznabFunction.CAPS),
    apikey: z.string().optional(),
  })
  .strict();

export type CapabilitiesRequest = z.infer<typeof CapsRequestSchema>;

export function isCapabilitiesRequest(req: {
  t: string;
}): req is CapabilitiesRequest {
  return req.t === TorznabFunction.CAPS;
}
