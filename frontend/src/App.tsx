import * as React from "react";
const { useEffect, useState } = React;

type HealthResponse = { status: string };
type DbHealthResponse = { db: number };

export function App() {
  const [api, setApi] = useState<string>("Đang kiểm tra API...");
  const [db, setDb] = useState<string>("Đang kiểm tra DB...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/health", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = (await res.json()) as HealthResponse;
        if (!cancelled) setApi(`API: ${json.status}`);
      } catch (e) {
        if (!cancelled) setApi(`API: lỗi (${(e as Error).message})`);
      }

      try {
        const res = await fetch("/api/db-health", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = (await res.json()) as DbHealthResponse;
        if (!cancelled) setDb(`DB: ok (${json.db})`);
      } catch (e) {
        if (!cancelled) setDb(`DB: lỗi (${(e as Error).message})`);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container">
      <h1>Court Management</h1>
      <p>{api}</p>
      <p>{db}</p>
      <div className="links">
        <a href="/docs" target="_blank" rel="noreferrer">
          Swagger (/docs)
        </a>
      </div>
    </main>
  );
}
