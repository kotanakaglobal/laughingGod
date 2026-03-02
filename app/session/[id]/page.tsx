"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Post = {
  id: string;
  authorNameRaw: string;
  text: string;
  createdAt: string;
  _count: { votes: number };
};

type SessionDetail = {
  id: string;
  title: string;
  date: string;
  status: "open" | "closed";
  posts: Post[];
};

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [text, setText] = useState("");

  const [voterName, setVoterName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const [pin, setPin] = useState("");

  const totalVotesLabel = useMemo(() => `${selected.length}/2`, [selected.length]);

  async function load() {
    const res = await fetch(`/api/sessions/${params.id}`);
    const data = await res.json();
    if (res.ok) setSession(data.session);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function submitPost(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: params.id, authorName, text }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "投稿に失敗しました");
    setAuthorName("");
    setText("");
    await load();
  }

  async function submitVotes(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: params.id, voterName, postIds: selected }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "投票に失敗しました");
    setSelected([]);
    await load();
  }

  async function closeSession(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/sessions/${params.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "締切に失敗しました");
    setPin("");
    await load();
  }

  function togglePost(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  if (!session) return <p>Loading...</p>;

  const sortedResult = [...session.posts].sort((a, b) => {
    if (b._count.votes !== a._count.votes) return b._count.votes - a._count.votes;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div>
      <section className="card">
        <h2>{session.title}</h2>
        <p>{new Date(session.date).toLocaleDateString("ja-JP")}</p>
        <span className="badge">{session.status}</span>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>投稿一覧</h3>
        <div className="list">
          {session.posts.map((post) => (
            <label key={post.id} className="card">
              {session.status === "open" && (
                <input
                  type="checkbox"
                  checked={selected.includes(post.id)}
                  onChange={() => togglePost(post.id)}
                  disabled={session.status !== "open"}
                />
              )}
              <div>{post.text}</div>
              <div className="small">by {post.authorNameRaw}</div>
              <div className="small">{new Date(post.createdAt).toLocaleTimeString("ja-JP")}</div>
              {session.status === "closed" && <div>得票: {post._count.votes}</div>}
            </label>
          ))}
        </div>
      </section>

      {session.status === "open" && (
        <>
          <section className="card">
            <h3>投稿する</h3>
            <form onSubmit={submitPost}>
              <label>投稿者名</label>
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
              <label>内容</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} required />
              <button type="submit">投稿</button>
            </form>
          </section>

          <section className="card">
            <h3>投票する</h3>
            <form onSubmit={submitVotes}>
              <label>投票者名</label>
              <input value={voterName} onChange={(e) => setVoterName(e.target.value)} required />
              <p className="small">選択数: {totalVotesLabel}</p>
              <button type="submit" disabled={selected.length === 0}>投票する</button>
            </form>
          </section>

          <section className="card">
            <h3>締切</h3>
            <form onSubmit={closeSession}>
              <label>PIN</label>
              <input value={pin} onChange={(e) => setPin(e.target.value)} pattern="\\d{4}" required />
              <button type="submit">締切する</button>
            </form>
          </section>
        </>
      )}

      {session.status === "closed" && (
        <section className="card">
          <h3>結果</h3>
          {sortedResult.map((post, idx) => (
            <div key={post.id} className="card">
              <div>#{idx + 1} {post.text}</div>
              <div className="small">{post.authorNameRaw} / {post._count.votes} pt</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
