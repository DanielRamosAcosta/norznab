import { z } from "zod";
import {
  CommandStatusSchema,
  CommandResultSchema,
  CommandPrioritySchema,
  CommandTriggerSchema,
} from "./common.ts";

export const CommandSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable().optional(),
  commandName: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  body: z.unknown().optional(),
  priority: CommandPrioritySchema.optional(),
  status: CommandStatusSchema.optional(),
  result: CommandResultSchema.optional(),
  queued: z.string().nullable().optional(),
  started: z.string().nullable().optional(),
  ended: z.string().nullable().optional(),
  stateChangeTime: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  trigger: CommandTriggerSchema.optional(),
  sendUpdatesToClient: z.boolean().optional(),
  updateScheduledTask: z.boolean().optional(),
  isLongRunning: z.boolean().optional(),
  name2: z.string().nullable().optional(),
  lastExecution: z.string().nullable().optional(),
  lastDuration: z.string().nullable().optional(),
  nextExecution: z.string().nullable().optional(),
  episodeIds: z.array(z.number()).nullable().optional(),
}).strict();

export type Command = z.infer<typeof CommandSchema>;
