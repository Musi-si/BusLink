import { z } from 'zod';

// A generic schema for inviting any user that requires these basic fields.
export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required')
  }),
});