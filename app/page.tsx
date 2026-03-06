"use client";

import { FormEvent, useEffect, useState } from "react";

type Post = {
  id: string;
  text: string;
  authorNameRaw: string;
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

export default function HomePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [authorName, setAuthorName] = useState("");
  const [firstPost, setFirstPost] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          authorName,
          firstPost,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "作成に失敗しました");
      }

      setAuthorName("");
      setFirstPost("");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 16, background: "#f3f4f6", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
        Laughing God
      </h1>

      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
            最初の投稿を作成
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: "block", fontSize: 16, fontWeight: 600, marginBottom: 8 }}
              >
                おもしろかったこと
              </label>
              <textarea
                value={firstPost}
                onChange={(e) => setFirstPost(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  border: "1px solid #9ca3af",
                  borderRadius: 4,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: "block", fontSize: 16, fontWeight: 600, marginBottom: 8 }}
              >
                名前
              </label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #9ca3af",
                  borderRadius: 4,
                  padding: 12,
                  fontSize: 16,
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: "block", fontSize: 16, fontWeight: 600, marginBottom: 8 }}
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
                  borderRadius: 4,
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
                background: "#000",
                color: "#fff",
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 18,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              {loading ? "作成中..." : "投稿する"}
            </button>
          </form>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
            セッション一覧
          </h2>

          {sessions.length === 0 ? (
            <p>まだセッションはありません。</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ marginBottom: 10, fontWeight: 700 }}>
                    日付: {new Date(session.date).toLocaleDateString("ja-JP")}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    状態: {session.status === "open" ? "受付中" : "締切"}
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {session.posts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          {post.authorNameRaw}
                        </div>
                        <div style={{ marginBottom: 6 }}>{post.text}</div>
                        <div style={{ fontSize: 14, color: "#6b7280" }}>
                          票数: {post._count?.votes ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
