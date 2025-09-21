import z from "zod";

export type User = {
  id: string;
  email: string;
  username: string;
  name: string;
  image: string | null;
  description: string | null;
  role: string;
};

export const settingsSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores (no spaces)"
    ),
  name: z.string().min(1, "Name is required").max(30, "Name too long"),
  description: z.string().max(200, "Description too long").optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
});