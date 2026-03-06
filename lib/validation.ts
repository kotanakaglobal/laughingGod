import { z } from "zod";

export const createSessionSchema = z.object({
  date: z.string().min(1, "日付は必須です"),
  firstPost: z.string().trim().min(1, "おもしろシーンは必須です"),
});

export const postSchema = z.object({
  sessionId: z.string().min(1),
  text: z.string().trim().min(1, "おもしろシーンは必須です"),
});

export const voteSchema = z.object({
  sessionId: z.string().min(1),
  postId: z.string().min(1),
});

export const closeSchema = z.object({
  sessionId: z.string().min(1),
});
