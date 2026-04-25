async function updateText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

async function check(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

async function main() {
  try {
    const health = await check("/api/health");
    await updateText("apiStatus", `API: ${health.status}`);
  } catch (e) {
    await updateText("apiStatus", `API: lỗi (${e.message})`);
  }

  try {
    const db = await check("/api/db-health");
    await updateText("dbStatus", `DB: ok (${db.db})`);
  } catch (e) {
    await updateText("dbStatus", `DB: lỗi (${e.message})`);
  }
}

main();
