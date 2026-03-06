"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Post = {
  id: string;
  text: string;
  createdAt: string;
  _count?: { votes: number };
};

type Session = {
  id: string;
  date: string;
  status: "open" | "closed";
  createdAt: string;
  posts: Post[];
};

type RankedPost = {
  id: string;
  sessionId: string;
  text: string;
  date: string;
  createdAt: string;
  votes: number;
  status: "open" | "closed";
};

const STORAGE_KEY = "laughing-god-liked-post-ids";

export default function HomePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [firstPost, setFirstPost] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [voteLoadingId, setVoteLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLikedPostIds(parsed.filter((v) => typeof v === "string"));
      }
    } catch {
      // ignore
    }
  }, []);

  function saveLikedPostIds(nextIds: string[]) {
    setLikedPostIds(nextIds);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
  }

  async function loadSessions() {
    const res = await fetch("/api/sessions", { cache: "no-store" });
    const data = await res.json();
    setSessions(data.sessions ?? []);
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          firstPost,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "投稿に失敗しました");
      }

      setFirstPost("");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(sessionId: string, postId: string) {
    if (likedPostIds.includes(postId)) {
      return;
    }

    setVoteLoadingId(postId);
    setError("");

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          postId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "いいねに失敗しました");
      }

      saveLikedPostIds([...likedPostIds, postId]);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "いいねに失敗しました");
    } finally {
      setVoteLoadingId(null);
    }
  }

  const rankedPosts = useMemo<RankedPost[]>(() => {
    return sessions
      .flatMap((session) =>
        session.posts.map((post) => ({
          id: post.id,
          sessionId: session.id,
          text: post.text,
          date: session.date,
          createdAt: post.createdAt,
          votes: post._count?.votes ?? 0,
          status: session.status,
        })),
      )
      .sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        if (new Date(b.date).getTime() !== new Date(a.date).getTime()) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [sessions]);

  return (
    <main style={{ padding: 16, background: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          Laughing God
        </h1>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
            新規投稿
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
              >
                おもしろシーン
              </label>
              <textarea
                value={firstPost}
                onChange={(e) => setFirstPost(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  border: "1px solid #9ca3af",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
              >
                日付
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #9ca3af",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </div>

            {error ? (
              <p style={{ color: "#dc2626", marginBottom: 12 }}>{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 16px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "投稿中..." : "投稿する"}
            </button>
          </form>
        </section>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
            おもしろ名場面記録
          </h2>

          {rankedPosts.length === 0 ? (
            <p>まだ投稿はありません。</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {rankedPosts.map((post, index) => {
                const alreadyLiked = likedPostIds.includes(post.id);

                return (
                  <div
                    key={post.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 16,
                      background: "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 8,
                      }}
                    >
                      #{index + 1} ・ {new Date(post.date).toLocaleDateString("ja-JP")}
                    </div>

                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        marginBottom: 12,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {post.text}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>👍 {post.votes}</div>

                      <button
                        type="button"
                        disabled={
                          voteLoadingId === post.id ||
                          post.status !== "open" ||
                          alreadyLiked
                        }
                        onClick={() => handleLike(post.sessionId, post.id)}
                        style={{
                          background:
                            post.status !== "open"
                              ? "#9ca3af"
                              : alreadyLiked
                                ? "#6b7280"
                                : "#111827",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontWeight: 700,
                          cursor:
                            post.status !== "open" || alreadyLiked
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {post.status !== "open"
                          ? "締切"
                          : alreadyLiked
                            ? "いいね済み"
                            : voteLoadingId === post.id
                              ? "送信中..."
                              : "いいね"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
