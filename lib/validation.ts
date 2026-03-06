import { z } from "zod";

export const createSessionSchema = z.object({
  date: z.string().min(1, "日付は必須です"),
  authorName: z.string().trim().min(1, "名前は必須です"),
  firstPost: z.string().trim().min(1, "おもしろかったことは必須です"),
});

export const voteSchema = z.object({
  sessionId: z.string().min(1),
  voterName: z.string().trim().min(1, "名前は必須です"),
  postIds: z.array(z.string().min(1)).min(1).max(2),
});

export const closeSchema = z.object({
  sessionId: z.string().min(1),
});
