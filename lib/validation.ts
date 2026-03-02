import { z } from "zod";

export const sessionSchema = z.object({
  title: z.string().trim().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pin: z.string().regex(/^\d{4}$/),
});

export const postSchema = z.object({
  sessionId: z.string().uuid(),
  authorName: z.string().trim().min(1).max(40),
  text: z.string().trim().min(1).max(280),
});

export const voteSchema = z.object({
  sessionId: z.string().uuid(),
  voterName: z.string().trim().min(1).max(40),
  postIds: z.array(z.string().uuid()).min(1).max(2),
});

export const closeSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
});
