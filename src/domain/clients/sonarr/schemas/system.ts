import { z } from "zod";

export const SystemSchema = z.object({
  appName: z.string().nullable().optional(),
  instanceName: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  buildNumber: z.number().optional(),
  sqliteVersion: z.string().nullable().optional(),
  isMonoRuntime: z.boolean().optional(),
  isLinux: z.boolean().optional(),
  isOsx: z.boolean().optional(),
  isWindows: z.boolean().optional(),
  isDocker: z.boolean().optional(),
  branch: z.string().nullable().optional(),
  authentication: z.string().nullable().optional(),
  startupPath: z.string().nullable().optional(),
  appData: z.string().nullable().optional(),
  osVersion: z.string().nullable().optional(),
  isAdmin: z.boolean().optional(),
  databaseType: z.string().nullable().optional(),
  databaseVersion: z.string().nullable().optional(),
}).strict();

export type System = z.infer<typeof SystemSchema>;
