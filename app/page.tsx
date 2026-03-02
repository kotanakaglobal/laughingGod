"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Session = {
  id: string;
  title: string;
  date: string;
  status: "open" | "closed";
};

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [pin, setPin] = useState("");

  async function load() {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(data.sessions);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, pin }),
    });

    if (!res.ok) {
      setError("作成に失敗しました。入力を確認してください。");
      return;
    }

    setTitle("");
    setPin("");
    await load();
  }

  return (
    <div>
      <section className="card">
        <h2>セッション作成</h2>
        <form onSubmit={onSubmit}>
          <label>タイトル</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label>日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <label>4桁PIN（締切用）</label>
          <input value={pin} onChange={(e) => setPin(e.target.value)} pattern="\\d{4}" required />
          {error && <p className="error">{error}</p>}
          <button type="submit">作成</button>
        </form>
      </section>

      <section className="card">
        <h2>セッション一覧</h2>
        <div className="list">
          {sessions.map((s) => (
            <Link key={s.id} href={`/session/${s.id}`} className="card">
              <div>{s.title}</div>
              <div className="small">{new Date(s.date).toLocaleDateString("ja-JP")}</div>
              <span className="badge">{s.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
