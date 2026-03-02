"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ArchiveSession = {
  id: string;
  title: string;
  date: string;
};

type RankingItem = {
  postId: string;
  sessionId: string;
  sessionTitle: string;
  text: string;
  authorName: string;
  points: number;
  createdAt: string;
};

export default function ArchivePage({ params }: { params: { month: string } }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ArchiveSession[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [sessionFilter, setSessionFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/month/${params.month}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setRanking(data.ranking ?? []);
      });
  }, [params.month]);

  const filtered = useMemo(() => {
    if (sessionFilter === "all") return ranking;
    return ranking.filter((r) => r.sessionId === sessionFilter);
  }, [ranking, sessionFilter]);

  return (
    <div>
      <section className="card">
        <h2>月間アーカイブ</h2>
        <label>月を選択</label>
        <input
          type="month"
          value={params.month}
          onChange={(e) => router.push(`/archive/${e.target.value}`)}
        />
        <label>セッションで絞り込み（任意）</label>
        <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
          <option value="all">全セッション</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </section>

      <section className="card">
        <h3>{params.month} のセッション</h3>
        {sessions.map((s) => (
          <div key={s.id} className="card">
            {s.title} ({new Date(s.date).toLocaleDateString("ja-JP")})
          </div>
        ))}
      </section>

      <section className="card">
        <h3>月間ランキング</h3>
        {filtered.map((item, i) => (
          <div key={item.postId} className="card">
            <div>#{i + 1} {item.text}</div>
            <div className="small">{item.authorName} / {item.points} pt / {item.sessionTitle}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
