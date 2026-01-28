import { z } from "zod";

// Enums
export const MediaTypeSchema = z.enum(["movie", "tv", "person"]);

// Type exports
export type MediaType = z.infer<typeof MediaTypeSchema>;
