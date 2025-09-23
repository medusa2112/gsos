import { z } from 'zod';

export const SchoolId = z.string().min(1);
export const School = z.object({ id: SchoolId, name: z.string() });
export type School = z.infer<typeof School>;
