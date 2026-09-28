/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const TYPES: Record<string, string> = {
  IRRIGATION: "TÆ°á»›i nÆ°á»›c",
  FERTILIZATION: "BÃ³n phÃ¢n",
  PESTICIDE: "Phun thuá»‘c",
  PRUNING: "Tá»‰a cÃ¢y",
  HARVEST: "Thu hoáº¡ch",
  INSPECTION: "Kiá»ƒm tra",
  SEEDING: "Gieo háº¡t",
  PLANTING: "Trá»“ng cÃ¢y",
  OTHER: "KhÃ¡c",
};

const TYPE_GLYPH: Record<string, string> = {
  IRRIGATION: "â†—",
  FERTILIZATION: "ï¼‹",
  PESTICIDE: "âœ¦",
  PRUNING: "âŒ",
  HARVEST: "â—’",
  INSPECTION: "â—‰",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(value));
}

async function api(path: string, token?: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", "Bearer " + token);
  const res = await fetch(API + path, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "KhÃ´ng thá»ƒ káº¿t ná»‘i mÃ¡y chá»§");
  return body;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={"badge badge-" + tone}>{children}</span>;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [view, setView] = useState("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [tree, setTree] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [trace, setTrace] = useState<any>(null);
  const [login, setLogin] = useState({ email: "demo@nonglac.vn", password: "nonglac123" });
  const [form, setForm] = useState<any>({
    type: "IRRIGATION", targetEntityId: "", seasonId: "",
    startedAt: new Date().toISOString().slice(0, 16),
    quantity: "", unit: "lÃ­t", notes: "", evidenceUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [showForm, setShowForm] = useState(false);

  const rootEntities = useMemo(
    () => tree.filter((x) => !x.parent_id),
    [tree]
  );

  useEffect(() => {
    const saved = window.localStorage.getItem("nonglac_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  async function load() {
    try {
      const me = await api("/api/v1/me", token);
      const farms = await api("/api/v1/farms", token);
      setUser(me.data);
      setFarm(farms.data?.[0] || null);
      if (farms.data?.[0]) await loadFarm(farms.data[0].id);
    } catch {
      logout();
    }
  }

  async function loadFarm(farmId: string) {
    const [d, t, s, a, al] = await Promise.all([
      api("/api/v1/farms/" + farmId + "/dashboard", token),
      api("/api/v1/farms/" + farmId + "/tree", token),
      api("/api/v1/farms/" + farmId + "/seasons", token),
      api("/api/v1/farms/" + farmId + "/activities?limit=100", token),
      api("/api/v1/farms/" + farmId + "/alerts", token),
    ]);
    setDashboard(d.data);
    setTree(t.data || []);
    setSeasons(s.data || []);
    setActivities(a.data || []);
    setAlerts(al.data || []);
    if (!form.targetEntityId && t.data?.length) {
      const first = t.data.find((x: any) => x.type === "BED") || t.data[0];
      setForm((f: any) => ({ ...f, targetEntityId: first.id }));
    }
    if (!form.seasonId && s.data?.length) {
      setForm((f: any) => ({ ...f, seasonId: s.data[0].id }));
    }
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api("/api/v1/auth/login", undefined, {
        method: "POST", body: JSON.stringify(login),
      });
      window.localStorage.setItem("nonglac_token", result.token);
      setToken(result.token);
      setUser(result.user);
      setFlash("ÄÃ£ Ä‘Äƒng nháº­p");
    } catch (e: any) {
      setFlash(e.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("nonglac_token");
    setToken("");
    setUser(null);
    setFarm(null);
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!farm) return;
    setBusy(true);
    try {
      const created = await api("/api/v1/farms/" + farm.id + "/activities", token, {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          targetEntityId: form.targetEntityId,
          seasonId: form.seasonId || null,
          startedAt: new Date(form.startedAt).toISOString(),
          quantity: form.quantity ? Number(form.quantity) : null,
          unit: form.unit || null,
          notes: form.notes,
          evidenceLevel: form.evidenceUrl ? "EVIDENCE_SUPPORTED" : "USER_REPORTED",
        }),
      });
      if (form.evidenceUrl) {
        await api("/api/v1/activities/" + created.data.id + "/evidence", token, {
          method: "POST",
          body: JSON.stringify({
            type: "PHOTO", mediaUrl: form.evidenceUrl,
            capturedAt: new Date(form.startedAt).toISOString(),
          }),
        });
      }
      setShowForm(false);
      setFlash("ÄÃ£ lÆ°u nháº­t kÃ½");
      await loadFarm(farm.id);
      setView("diary");
    } catch (e: any) {
      setFlash(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openActivity(id: string) {
    try {
      const r = await api("/api/v1/activities/" + id, token);
      setSelected(r.data);
    } catch (e: any) {
      setFlash(e.message);
    }
  }

  async function verifySelected() {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await api("/api/v1/activities/" + selected.id + "/verify", token, {
        method: "PATCH",
        body: JSON.stringify({ reason: "ÄÃ£ kiá»ƒm tra báº£n ghi vÃ  báº±ng chá»©ng" }),
      });
      setSelected(r.data);
      if (farm) await loadFarm(farm.id);
      setFlash("ÄÃ£ xÃ¡c minh");
    } catch (e: any) {
      setFlash(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadTrace() {
    const season = seasons[0];
    if (!season) return;
    try {
      const r = await api("/api/v1/public/trace/" + season.id);
      setTrace(r.data);
    } catch (e: any) {
      setFlash(e.message);
    }
  }

  async function resolveAlert(id: string) {
    if (!farm) return;
    await api("/api/v1/farms/" + farm.id + "/alerts/" + id + "/resolve", token, { method: "PATCH" });
    await loadFarm(farm.id);
  }

  if (!token) {
    return (
      <main className="auth-screen">
        <section className="auth-paper">
          <div className="brand-mark">NÃ”NG Láº C</div>
          <p className="eyebrow">DIGITAL FARM / 01</p>
          <h1>Sá»• canh tÃ¡c<br /><em>cÃ³ báº±ng chá»©ng.</em></h1>
          <p className="auth-copy">Ghi láº¡i tá»«ng thao tÃ¡c, tá»«ng khu vá»±c vÃ  tá»«ng báº±ng chá»©ng Ä‘á»ƒ táº¡o má»™t lá»‹ch sá»­ sáº£n xuáº¥t cÃ³ thá»ƒ kiá»ƒm chá»©ng.</p>
          <form onSubmit={submitLogin} className="auth-form">
            <label>Email<input value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></label>
            <label>Máº­t kháº©u<input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></label>
            <button className="primary-button" disabled={busy}>{busy ? "Äang vÃ o sá»•..." : "Má»Ÿ sá»• canh tÃ¡c"}</button>
          </form>
          <p className="demo-note">TÃ i khoáº£n demo: demo@nonglac.vn / nonglac123</p>
        </section>
        <aside className="auth-aside">
          <div className="aside-top"><span>Digital Farm Platform</span><span>ÄÃ  Láº¡t Â· LÃ¢m Äá»“ng</span></div>
          <div className="field-graphic">
            <div className="field-line one"></div><div className="field-line two"></div><div className="field-line three"></div>
            <div className="field-label">01 / CÃ  phÃª Arabica</div>
          </div>
          <p className="aside-quote">â€œMá»—i hoáº¡t Ä‘á»™ng lÃ  má»™t dáº¥u má»‘c cá»§a mÃ¹a vá»¥.â€</p>
        </aside>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="brand-mark">NÃ”NG Láº C</span><small>Digital Farm</small></div>
        <nav>
          {[
            ["overview", "Tá»•ng quan"], ["diary", "Nháº­t kÃ½"], ["structure", "Cáº¥u trÃºc vÆ°á»n"],
            ["alerts", "Cáº£nh bÃ¡o"], ["trace", "Truy xuáº¥t"],
          ].map(([id, label]) => (
            <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => { setView(id); if (id === "trace") loadTrace(); }}>
              <span className="nav-dot"></span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="connection"><span></span> MÃ¡y chá»§ Ä‘ang káº¿t ná»‘i</div>
          <button className="logout" onClick={logout}>ÄÄƒng xuáº¥t</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Sá»” CANH TÃC / 2026</p>
            <h2>{farm?.name || "NÃ´ng tráº¡i"}</h2>
          </div>
          <div className="top-actions">
            <span className="user-chip">{user?.full_name || "NgÆ°á»i quáº£n lÃ½"}</span>
            <button className="primary-button compact" onClick={() => setShowForm(true)}>ï¼‹ Ghi nháº­t kÃ½</button>
          </div>
        </header>

        {flash && <div className="flash" onClick={() => setFlash("")}>{flash}<span>Ã—</span></div>}

        {view === "overview" && (
          <section>
            <div className="hero-strip">
              <div>
                <p className="eyebrow">ÄANG THEO DÃ•I</p>
                <h1>{dashboard?.activeSeason?.crop_name || "ChÆ°a cÃ³ mÃ¹a vá»¥"} <em>{dashboard?.activeSeason?.variety || ""}</em></h1>
                <p>{dashboard?.activeSeason ? "Tá»« " + formatDateOnly(dashboard.activeSeason.start_date) + " Â· dá»± kiáº¿n thu hoáº¡ch " + formatDateOnly(dashboard.activeSeason.expected_harvest_date) : "Táº¡o mÃ¹a vá»¥ Ä‘á»ƒ báº¯t Ä‘áº§u ghi nháº­t kÃ½."}</p>
              </div>
              <div className="hero-index"><span>Äá»™ tin cáº­y</span><strong>{dashboard?.stats?.confidence || 0}%</strong><small>dá»±a trÃªn báº±ng chá»©ng hiá»‡n cÃ³</small></div>
            </div>
            <div className="metrics">
              <div className="metric"><span>HÃ´m nay</span><strong>{dashboard?.stats?.today_count || 0}</strong><small>hoáº¡t Ä‘á»™ng ghi nháº­n</small></div>
              <div className="metric"><span>Chá» xÃ¡c minh</span><strong>{dashboard?.stats?.pending_count || 0}</strong><small>báº£n ghi cáº§n kiá»ƒm tra</small></div>
              <div className="metric"><span>30 ngÃ y</span><strong>{dashboard?.stats?.month_count || 0}</strong><small>hoáº¡t Ä‘á»™ng</small></div>
              <div className="metric"><span>Cáº£nh bÃ¡o má»Ÿ</span><strong>{alerts.filter((a) => a.status === "OPEN").length}</strong><small>cáº§n xá»­ lÃ½</small></div>
            </div>
            <div className="content-grid">
              <section className="panel wide">
                <div className="panel-head"><div><p className="eyebrow">DÃ’NG THá»œI GIAN</p><h3>Hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y</h3></div><button className="text-button" onClick={() => setView("diary")}>Xem toÃ n bá»™ â†’</button></div>
                <ActivityList items={dashboard?.latestActivities || []} onOpen={openActivity} />
              </section>
              <section className="panel">
                <div className="panel-head"><div><p className="eyebrow">KIá»‚M SOÃT</p><h3>Cáº£nh bÃ¡o</h3></div></div>
                {alerts.filter((a) => a.status === "OPEN").length === 0 ? <Empty label="KhÃ´ng cÃ³ cáº£nh bÃ¡o má»Ÿ" /> :
                  alerts.filter((a) => a.status === "OPEN").slice(0, 4).map((a) => (
                    <div className="alert-row" key={a.id}><div><Badge tone={a.severity === "HIGH" ? "danger" : "warning"}>{a.severity}</Badge><p>{a.message}</p></div><button onClick={() => resolveAlert(a.id)}>Xá»­ lÃ½</button></div>
                  ))}
              </section>
            </div>
          </section>
        )}

        {view === "diary" && (
          <section>
            <div className="section-title"><div><p className="eyebrow">EVENT FIRST</p><h1>Nháº­t kÃ½ canh tÃ¡c</h1><p>Ai Â· lÃ m gÃ¬ Â· á»Ÿ Ä‘Ã¢u Â· khi nÃ o Â· bao nhiÃªu Â· báº±ng chá»©ng nÃ o.</p></div><button className="primary-button" onClick={() => setShowForm(true)}>ï¼‹ Ghi hoáº¡t Ä‘á»™ng</button></div>
            <div className="filter-line"><span>{activities.length} báº£n ghi</span><select onChange={async (e) => { if (!farm) return; const r = await api("/api/v1/farms/" + farm.id + "/activities?limit=100&type=" + e.target.value, token); setActivities(r.data || []); }}><option value="">Táº¥t cáº£ hoáº¡t Ä‘á»™ng</option>{Object.entries(TYPES).map(([k,v]) => <option value={k} key={k}>{v}</option>)}</select></div>
            <section className="panel diary-panel"><ActivityList items={activities} onOpen={openActivity} detailed /></section>
          </section>
        )}

        {view === "structure" && (
          <section>
            <div className="section-title"><div><p className="eyebrow">LOCATION FIRST</p><h1>Cáº¥u trÃºc vÆ°á»n</h1><p>Tá»« trang tráº¡i â†’ khu â†’ thá»­a â†’ luá»‘ng â†’ hÃ ng â†’ cÃ¢y.</p></div></div>
            <div className="tree-sheet">{rootEntities.map((r) => <TreeNode key={r.id} node={r} tree={tree} level={0} />)}</div>
            <div className="panel season-panel"><div className="panel-head"><div><p className="eyebrow">MÃ™A Vá»¤</p><h3>CÃ¡c mÃ¹a vá»¥</h3></div></div>{seasons.map((s) => <div className="season-row" key={s.id}><strong>{s.name}</strong><span>{s.crop_name} Â· {s.variety}</span><span>{formatDateOnly(s.start_date)} â†’ {s.expected_harvest_date ? formatDateOnly(s.expected_harvest_date) : "â€”"}</span><Badge tone="success">{s.status}</Badge></div>)}</div>
          </section>
        )}

        {view === "alerts" && (
          <section>
            <div className="section-title"><div><p className="eyebrow">EVIDENCE FIRST</p><h1>Cáº£nh bÃ¡o & kiá»ƒm soÃ¡t</h1><p>CÃ¡c báº¥t thÆ°á»ng do há»‡ thá»‘ng phÃ¡t hiá»‡n tá»« dá»¯ liá»‡u nháº­t kÃ½.</p></div></div>
            <section className="panel"><div className="alert-table">{alerts.map((a) => <div className="alert-row full" key={a.id}><div><Badge tone={a.severity === "HIGH" ? "danger" : a.severity === "MEDIUM" ? "warning" : "neutral"}>{a.severity}</Badge><p>{a.message}</p><small>{formatDate(a.created_at)}</small></div><div>{a.status === "OPEN" ? <button className="secondary-button" onClick={() => resolveAlert(a.id)}>ÄÃ¡nh dáº¥u Ä‘Ã£ xá»­ lÃ½</button> : <Badge tone="success">ÄÃ£ xá»­ lÃ½</Badge>}</div></div>)}</div></section>
          </section>
        )}

        {view === "trace" && (
          <section>
            <div className="section-title"><div><p className="eyebrow">PUBLIC TRACEABILITY</p><h1>Truy xuáº¥t mÃ¹a vá»¥</h1><p>Chá»‰ hiá»ƒn thá»‹ cÃ¡c hoáº¡t Ä‘á»™ng Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c minh.</p></div></div>
            {!trace ? <div className="panel trace-empty">Äang táº£i dá»¯ liá»‡u truy xuáº¥t...</div> :
              <div className="trace-layout"><section className="panel trace-cover"><p className="eyebrow">LÃ” Sáº¢N XUáº¤T</p><h2>{trace.season.crop_name}</h2><h3>{trace.season.farm_name}</h3><div className="trace-meta"><span>Giá»‘ng</span><strong>{trace.season.variety || "â€”"}</strong><span>NgÃ y báº¯t Ä‘áº§u</span><strong>{formatDateOnly(trace.season.start_date)}</strong><span>MÃ£ farm</span><strong>{trace.season.farm_code}</strong></div></section><section className="panel wide"><div className="panel-head"><div><p className="eyebrow">Lá»ŠCH Sá»¬ ÄÃƒ XÃC MINH</p><h3>{trace.activities.length} hoáº¡t Ä‘á»™ng</h3></div></div><ActivityList items={trace.activities} publicView /></section></div>}
          </section>
        )}
      </main>

      {showForm && <ActivityForm form={form} setForm={setForm} tree={tree} seasons={seasons} busy={busy} onClose={() => setShowForm(false)} onSubmit={addActivity} />}
      {selected && <ActivityDetail activity={selected} busy={busy} onClose={() => setSelected(null)} onVerify={verifySelected} />}
    </div>
  );
}

function ActivityList({ items, onOpen, detailed = false, publicView = false }: any) {
  if (!items?.length) return <Empty label="ChÆ°a cÃ³ báº£n ghi nÃ o" />;
  return <div className="activity-list">{items.map((item: any) => (
    <button className="activity-row" key={item.id} onClick={() => onOpen?.(item.id)}>
      <div className={"activity-glyph glyph-" + item.type}>{TYPE_GLYPH[item.type] || "Â·"}</div>
      <div className="activity-main"><strong>{TYPES[item.type] || item.type}</strong><span>{item.entity_name || item.entity_code || "Vá»‹ trÃ­ chÆ°a Ä‘áº·t tÃªn"}{item.season_name ? " Â· " + item.season_name : ""}</span><small>{item.notes || "KhÃ´ng cÃ³ ghi chÃº"}</small></div>
      <div className="activity-meta"><strong>{item.quantity != null ? Number(item.quantity).toLocaleString("vi-VN") + " " + (item.unit || "") : "â€”"}</strong><span>{item.started_at ? formatDate(item.started_at) : ""}</span>{!publicView && <Badge tone={item.verification_status === "VERIFIED" ? "success" : "warning"}>{item.verification_status === "VERIFIED" ? "ÄÃ£ xÃ¡c minh" : "Chá» xÃ¡c minh"}</Badge>}</div>
      {detailed && <span className="chevron">â†’</span>}
    </button>
  ))}</div>;
}

function TreeNode({ node, tree, level }: any) {
  const children = tree.filter((x: any) => x.parent_id === node.id);
  return <div className="tree-node" style={{ paddingLeft: level * 26 }}><div className="tree-line"><span className={"tree-kind kind-" + node.type}>{node.type}</span><strong>{node.name}</strong><span>{node.code}</span>{node.latitude && <small>{Number(node.latitude).toFixed(5)}, {Number(node.longitude).toFixed(5)}</small>}</div>{children.map((x: any) => <TreeNode key={x.id} node={x} tree={tree} level={level + 1} />)}</div>;
}

function ActivityForm({ form, setForm, tree, seasons, busy, onClose, onSubmit }: any) {
  return <div className="modal-backdrop"><form className="modal modal-large" onSubmit={onSubmit}><div className="modal-head"><div><p className="eyebrow">EVENT / NEW</p><h2>Ghi má»™t hoáº¡t Ä‘á»™ng</h2></div><button type="button" className="icon-button" onClick={onClose}>Ã—</button></div><div className="form-grid"><label>Hoáº¡t Ä‘á»™ng<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label><label>Vá»‹ trÃ­<select value={form.targetEntityId} onChange={(e) => setForm({ ...form, targetEntityId: e.target.value })}>{tree.map((x: any) => <option key={x.id} value={x.id}>{"Â· ".repeat(Math.max(0, x.depth - 1))}{x.code} â€” {x.name}</option>)}</select></label><label>MÃ¹a vá»¥<select value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })}><option value="">KhÃ´ng gáº¯n mÃ¹a vá»¥</option>{seasons.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Thá»i gian<input type="datetime-local" value={form.startedAt} onChange={(e) => setForm({ ...form, startedAt: e.target.value })} /></label><label>Sá»‘ lÆ°á»£ng<input inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="VÃ­ dá»¥: 25" /></label><label>ÄÆ¡n vá»‹<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg / lÃ­t / cÃ¢y..." /></label><label className="full">Ghi chÃº<textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ná»™i dung cÃ´ng viá»‡c, váº­t tÆ°, triá»‡u chá»©ng, káº¿t quáº£..." /></label><label className="full">Báº±ng chá»©ng hÃ¬nh áº£nh <input value={form.evidenceUrl} onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })} placeholder="DÃ¡n URL áº£nh thá»±c táº¿ (Cloud Storage / R2 / CDN)" /><small className="field-help">Báº£n MVP lÆ°u URL báº±ng chá»©ng; upload trá»±c tiáº¿p lÃªn object storage sáº½ gáº¯n á»Ÿ bÆ°á»›c káº¿ tiáº¿p.</small></label></div><div className="modal-foot"><button type="button" className="secondary-button" onClick={onClose}>Há»§y</button><button className="primary-button" disabled={busy}>{busy ? "Äang lÆ°u..." : "LÆ°u vÃ o nháº­t kÃ½"}</button></div></form></div>;
}

function ActivityDetail({ activity, busy, onClose, onVerify }: any) {
  return <div className="modal-backdrop"><aside className="drawer"><div className="modal-head"><div><p className="eyebrow">{TYPES[activity.type] || activity.type}</p><h2>{activity.entity_name}</h2></div><button className="icon-button" onClick={onClose}>Ã—</button></div><div className="drawer-body"><div className="detail-grid"><div><span>Thá»i gian</span><strong>{formatDate(activity.started_at)}</strong></div><div><span>NgÆ°á»i thá»±c hiá»‡n</span><strong>{activity.performer}</strong></div><div><span>Sá»‘ lÆ°á»£ng</span><strong>{activity.quantity != null ? Number(activity.quantity).toLocaleString("vi-VN") + " " + (activity.unit || "") : "â€”"}</strong></div><div><span>Tráº¡ng thÃ¡i</span><Badge tone={activity.verification_status === "VERIFIED" ? "success" : "warning"}>{activity.verification_status}</Badge></div></div><div className="detail-block"><p className="eyebrow">GHI CHÃš</p><p>{activity.notes || "KhÃ´ng cÃ³ ghi chÃº."}</p></div><div className="detail-block"><p className="eyebrow">Báº°NG CHá»¨NG</p>{activity.evidence?.length ? activity.evidence.map((e: any) => <a className="evidence-link" href={e.media_url || "#"} target="_blank" rel="noreferrer" key={e.id}><span>{e.type}</span>{e.media_url || "KhÃ´ng cÃ³ media URL"}<small>{e.latitude ? Number(e.latitude).toFixed(5) + ", " + Number(e.longitude).toFixed(5) : ""}</small></a>) : <Empty label="ChÆ°a cÃ³ báº±ng chá»©ng" />}</div></div><div className="drawer-foot">{activity.verification_status !== "VERIFIED" && <button className="primary-button" onClick={onVerify} disabled={busy}>{busy ? "Äang xÃ¡c minh..." : "âœ“ XÃ¡c minh nháº­t kÃ½"}</button>}</div></aside></div>;
}

function Empty({ label }: { label: string }) { return <div className="empty">{label}</div>; }



