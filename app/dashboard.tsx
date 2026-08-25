/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type View = "store" | "dm" | "region";
type Row = {
  year: number; week: number; month: string; ceco: string; store: string;
  dm: string; region: string; fhw: number | null; lobby: number | null;
  ratio: number; source: string;
};
type HistoricalDm = { year: number; week: number; dm: string; ratio: number };
type Organization = { regions: number; dms: number; stores: number; hierarchy: Array<{ name: string; dms: Array<{ name: string; stores: Array<{ ceco: string; name: string }> }> }> };
type Coverage = { week: number; fhwStores: number; lobbyStores: number; matchedStores: number; publishedStores: number };
type Payload = {
  meta: { title: string; version: string; generatedAt: string; target: number; latestCompleteWeek: number; formula: string; weeks: number[]; months: string[]; monthWeeks: Record<string, number[]>; historyFiles: Record<string, string>; latestStores: number; organization: Organization; coverageByWeek: Coverage[] };
  records: Row[];
  historicalDm: HistoricalDm[];
};
type Inspiration = { eyebrow: string; title: string; message: string; closing: string; badge: string };
type Result = { id: string; label: string; detail: string; ratio: number; fhw: number | null; lobby: number | null; stores: number; direct: boolean };
type TrendPoint = { week: number; ratio: number; direct: boolean };

const pct = new Intl.NumberFormat("es-MX", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const int = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });

function weighted(rows: Row[]) {
  const valid = rows.filter((row) => row.fhw !== null && row.lobby !== null && row.lobby > 0);
  const fhw = valid.reduce((sum, row) => sum + (row.fhw ?? 0), 0);
  const lobby = valid.reduce((sum, row) => sum + (row.lobby ?? 0), 0);
  return { fhw, lobby, ratio: lobby ? fhw / lobby : null };
}

function groupLive(rows: Row[], view: View): Result[] {
  const groups = new Map<string, Row[]>();
  rows.forEach((row) => {
    const id = view === "store" ? row.ceco : view === "dm" ? row.dm : row.region;
    const group = groups.get(id);
    if (group) group.push(row);
    else groups.set(id, [row]);
  });
  return [...groups.entries()].map(([id, items]) => {
    const score = weighted(items);
    const first = items[0];
    return {
      id,
      label: view === "store" ? first.store : id,
      detail: view === "store" ? `${first.dm} · ${first.region}` : view === "dm" ? `${first.region} · ${new Set(items.map((item) => item.ceco)).size} tiendas` : `${new Set(items.map((item) => item.ceco)).size} tiendas`,
      ratio: score.ratio ?? 0,
      fhw: score.fhw,
      lobby: score.lobby,
      stores: new Set(items.map((item) => item.ceco)).size,
      direct: false,
    };
  });
}

function TrendChart({ points, target }: { points: TrendPoint[]; target: number }) {
  if (!points.length) return <div className="empty-chart"><strong>Sin consolidado ponderable</strong><span>Ponderación exacta disponible desde S30.</span></div>;
  const width = 760, height = 250, left = 46, right = 24, top = 24, bottom = 38;
  const max = Math.max(target * 1.35, ...points.map((point) => point.ratio * 1.18), 0.02);
  const x = (index: number) => points.length === 1 ? width / 2 : left + index * ((width - left - right) / (points.length - 1));
  const y = (value: number) => top + (max - value) * ((height - top - bottom) / max);
  const line = points.map((point, index) => `${x(index)},${y(point.ratio)}`).join(" ");
  const labelEvery = points.length > 20 ? 4 : points.length > 10 ? 2 : 1;
  return <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendencia semanal de Cada Taza Cuenta">
    {[0, .5, 1].map((fraction) => <g key={fraction}><line x1={left} x2={width - right} y1={y(max * fraction)} y2={y(max * fraction)} className="grid-line"/><text x={left - 9} y={y(max * fraction) + 4} textAnchor="end" className="axis-label">{pct.format(max * fraction)}</text></g>)}
    <line x1={left} x2={width - right} y1={y(target)} y2={y(target)} className="target-line"/>
    <text x={width - right} y={Math.max(12, y(target) - 7)} textAnchor="end" className="target-label">Objetivo &gt; {pct.format(target)}</text>
    <polyline points={line} className="trend-line"/>
    {points.map((point, index) => <g key={point.week}>
      <circle cx={x(index)} cy={y(point.ratio)} r="5" className={`${point.ratio > target ? "point is-good" : "point"}${point.direct ? " is-direct" : ""}`}/>
      {(index % labelEvery === 0 || index === points.length - 1) && <text x={x(index)} y={height - 14} textAnchor="middle" className="axis-label">S{point.week}</text>}
      <title>{`Semana ${point.week}: ${pct.format(point.ratio)}`}</title>
    </g>)}
  </svg>;
}

function Bars({ items, target, onSelect }: { items: Result[]; target: number; onSelect: (item: Result) => void }) {
  const max = Math.max(target, ...items.map((item) => item.ratio), .01);
  return <div className="bar-list">
    {items.map((item, index) => <button type="button" className="bar-row" key={item.id} onClick={() => onSelect(item)}>
      <span className="bar-rank">{index + 1}</span>
      <div className="bar-copy"><strong>{item.label}</strong><small>{item.detail}</small></div>
      <div className="bar-track"><span className={item.ratio > target ? "bar-fill is-good" : "bar-fill"} style={{ width: `${Math.max(2, item.ratio / max * 100)}%` }}/></div>
      <strong className={item.ratio > target ? "bar-value is-good" : "bar-value"}>{pct.format(item.ratio)}</strong>
    </button>)}
  </div>;
}

function Kpi({ label, value, note, tone = "default" }: { label: string; value: string; note: string; tone?: "default" | "good" | "alert" }) {
  return <article className={`kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

export default function Dashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("store");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState(0);
  const [region, setRegion] = useState("Todas");
  const [dm, setDm] = useState("Todos");
  const [query, setQuery] = useState("");
  const [rankingMode, setRankingMode] = useState<"top" | "bottom">("top");
  const [trendRange, setTrendRange] = useState<"month" | "year">("month");
  const [sortMode, setSortMode] = useState<"ratio-desc" | "ratio-asc" | "name">("ratio-desc");
  const [historyRows, setHistoryRows] = useState<Row[]>([]);
  const [historyDm, setHistoryDm] = useState<HistoricalDm[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const historyRequested = useRef(new Set<string>());

  useEffect(() => {
    Promise.all([
      fetch("data/fhw-dashboard.json").then((response) => { if (!response.ok) throw new Error("No se pudo leer la base"); return response.json(); }),
      fetch("data/juntemonos-mas.json").then((response) => response.json()),
    ]).then(([payload, message]) => {
      setData(payload); setInspiration(message);
      const latest = payload.meta.latestCompleteWeek;
      const latestMonth = payload.records.find((row: Row) => row.week === latest)?.month ?? payload.meta.months.at(-1);
      setMonth(latestMonth); setWeek(latest);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar el tablero"));
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!data || !month) return;
    const targets = trendRange === "year" ? Object.keys(data.meta.historyFiles) : [month];
    const pending = targets.filter((item) => data.meta.historyFiles[item] && !historyRequested.current.has(item));
    if (!pending.length) return;
    pending.forEach((item) => historyRequested.current.add(item));
    queueMicrotask(() => setHistoryLoading(true));
    Promise.all(pending.map(async (item) => {
      const response = await fetch(data.meta.historyFiles[item]);
      if (!response.ok) throw new Error(`No se pudo leer ${item}`);
      return response.json() as Promise<{ records: Row[]; historicalDm: HistoricalDm[] }>;
    })).then((histories) => {
      setHistoryRows((current) => [...current, ...histories.flatMap((item) => item.records)]);
      setHistoryDm((current) => [...current, ...histories.flatMap((item) => item.historicalDm)]);
      setHistoryError("");
    }).catch((reason) => {
      pending.forEach((item) => historyRequested.current.delete(item));
      setHistoryError(reason instanceof Error ? reason.message : "Histórico parcial");
    }).finally(() => setHistoryLoading(false));
  }, [data, month, trendRange]);

  const baseRows = useMemo(() => [...(data?.records ?? []), ...historyRows], [data, historyRows]);
  const allHistoricalDm = useMemo(() => [...(data?.historicalDm ?? []), ...historyDm], [data, historyDm]);
  const regions = useMemo(() => data?.meta.organization.hierarchy.map((item) => item.name) ?? [], [data]);
  const dms = useMemo(() => {
    const hierarchy = data?.meta.organization.hierarchy ?? [];
    const scoped = region === "Todas" ? hierarchy : hierarchy.filter((item) => item.name === region);
    return [...new Set(scoped.flatMap((item) => item.dms.map((district) => district.name)))].sort((a, b) => a.localeCompare(b, "es"));
  }, [data, region]);
  const monthWeeks = useMemo(() => data?.meta.monthWeeks[month] ?? [], [data, month]);

  function changeMonth(value: string) {
    const weeks = data?.meta.monthWeeks[value] ?? [];
    setMonth(value);
    setWeek(weeks.at(-1) ?? 0);
  }

  function changeRegion(value: string) {
    setRegion(value);
    setDm("Todos");
    setQuery("");
    if (value !== "Todas") setView("dm");
  }

  function changeDm(value: string) {
    setDm(value);
    setQuery("");
    if (value !== "Todos") setView("store");
  }

  function resetScope() {
    setRegion("Todas");
    setDm("Todos");
    setQuery("");
    setView("region");
  }

  function drillDown(item: Result) {
    if (view === "region") changeRegion(item.id);
    else if (view === "dm") changeDm(item.id);
    else setQuery(item.label);
    document.querySelector(".kpi-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function exportPdf() {
    const previousTitle = document.title;
    document.title = `FHW_${view}_S${week}`;
    document.body.dataset.exporting = "true";
    const restore = () => { document.title = previousTitle; delete document.body.dataset.exporting; };
    window.addEventListener("afterprint", restore, { once: true });
    requestAnimationFrame(() => window.print());
    window.setTimeout(restore, 4000);
  }

  const hierarchyRows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es-MX");
    return baseRows.filter((row) =>
      (region === "Todas" || row.region === region) && (dm === "Todos" || row.dm === dm)
      && (!term || row.store.toLocaleLowerCase("es-MX").includes(term) || row.ceco.includes(term))
    );
  }, [baseRows, region, dm, query]);
  const scopeRows = useMemo(() => hierarchyRows.filter((row) => row.month === month), [hierarchyRows, month]);
  const trendRows = trendRange === "year" ? hierarchyRows : scopeRows;
  const selectedRows = useMemo(() => scopeRows.filter((row) => row.week === week), [scopeRows, week]);
  const hasLive = selectedRows.some((row) => row.fhw !== null && row.lobby !== null);

  const results = useMemo<Result[]>(() => {
    if (!data) return [];
    if (hasLive) return groupLive(selectedRows.filter((row) => row.fhw !== null && row.lobby !== null), view);
    if (view === "store") return selectedRows.map((row) => ({ id: row.ceco, label: row.store, detail: `${row.dm} · ${row.region}`, ratio: row.ratio, fhw: null, lobby: null, stores: 1, direct: true }));
    if (view === "dm") {
      const allowed = new Set(selectedRows.map((row) => row.dm));
      return allHistoricalDm.filter((item) => item.week === week && allowed.has(item.dm)).map((item) => ({ id: item.dm, label: item.dm, detail: "Histórico directo", ratio: item.ratio, fhw: null, lobby: null, stores: 0, direct: true }));
    }
    return [];
  }, [data, hasLive, selectedRows, view, week, allHistoricalDm]);

  const ranking = useMemo(() => [...results].sort((a, b) => rankingMode === "top" ? b.ratio - a.ratio : a.ratio - b.ratio).slice(0, 7), [results, rankingMode]);
  const sortedResults = useMemo(() => [...results].sort((a, b) => {
    if (sortMode === "name") return a.label.localeCompare(b.label, "es");
    return sortMode === "ratio-desc" ? b.ratio - a.ratio : a.ratio - b.ratio;
  }), [results, sortMode]);
  const score = useMemo(() => hasLive ? weighted(selectedRows) : { fhw: 0, lobby: 0, ratio: null }, [hasLive, selectedRows]);
  const atTarget = results.filter((item) => item.ratio > (data?.meta.target ?? .1)).length;
  const coverage = data?.meta.coverageByWeek.find((item) => item.week === week);

  const trend = useMemo<TrendPoint[]>(() => {
    if (!data) return [];
    const weeks = [...new Set(trendRows.map((row) => row.week))].sort((a, b) => a - b);
    const oneStore = new Set(trendRows.map((row) => row.ceco)).size === 1;
    if (view === "store" && oneStore) return weeks.map((item) => {
      const row = trendRows.find((candidate) => candidate.week === item)!;
      return { week: item, ratio: row.ratio, direct: row.fhw === null };
    });
    if (view === "dm" && dm !== "Todos") return weeks.map((item) => {
      const live = weighted(trendRows.filter((row) => row.week === item));
      if (live.ratio !== null) return { week: item, ratio: live.ratio, direct: false };
      const direct = allHistoricalDm.find((candidate) => candidate.week === item && candidate.dm === dm);
      return direct ? { week: item, ratio: direct.ratio, direct: true } : null;
    }).filter((item): item is TrendPoint => item !== null);
    return weeks.map((item) => {
      const live = weighted(trendRows.filter((row) => row.week === item));
      return live.ratio === null ? null : { week: item, ratio: live.ratio, direct: false };
    }).filter((item): item is TrendPoint => item !== null);
  }, [data, trendRows, view, dm, allHistoricalDm]);

  const previous = trend.filter((point) => point.week < week).at(-1);
  const currentRatio = score.ratio ?? (results.length === 1 ? results[0].ratio : null);
  const delta = currentRatio !== null && previous ? currentRatio - previous.ratio : null;
  const gap = currentRatio === null ? null : Math.max(0, (data?.meta.target ?? .1) - currentRatio);
  const leader = [...results].sort((a, b) => b.ratio - a.ratio)[0];
  const story = historyLoading ? "Cargando el histórico…" : currentRatio === null
    ? "Histórico disponible por tienda y distrito."
    : currentRatio > (data?.meta.target ?? .1)
      ? `El alcance supera la meta por ${pct.format(currentRatio - (data?.meta.target ?? .1))}. ${leader ? `${leader.label} lidera con ${pct.format(leader.ratio)}.` : ""}`
      : `La brecha es ${pct.format(gap ?? 0)}. ${leader ? `${leader.label} marca la referencia con ${pct.format(leader.ratio)}.` : ""}`;

  if (error) return <main className="state-screen"><img src="assets/logo-cada-taza-cuenta.webp" alt="FHW"/><h1>No pudimos abrir el tablero</h1><p>{error}</p><button onClick={() => location.reload()}>Reintentar</button></main>;
  if (!data) return <main className="state-screen"><div className="loader"/><h1>Preparando Cada Taza Cuenta</h1><p>Validando el último corte disponible…</p></main>;

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#inicio" aria-label="Inicio FHW"><img src="assets/logo-cada-taza-cuenta.webp" alt="Logotipo FHW"/><span><strong>FHW</strong><small>Cada Taza Cuenta</small></span></a>
      <div className="header-actions"><span className="status-dot">Validado · S{data.meta.latestCompleteWeek}</span><button className="button ghost" onClick={exportPdf}>Descargar PDF</button></div>
    </header>

    <main id="inicio">
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">VAJILLA · BEBIDAS EN TIENDA</p><h1>Más experiencias.<br/>Menos desechables.</h1><p>Avance de bebidas Lobby servidas con vajilla reutilizable.</p></div>
        <div className="hero-goal"><span>Objetivo</span><strong>&gt;10%</strong><small>FHW / Bebidas Lobby</small></div>
      </section>

      <section className="toolbar" aria-label="Filtros del tablero">
        <div className="view-tabs" role="tablist" aria-label="Nivel de análisis">
          {(["store", "dm", "region"] as View[]).map((item) => <button key={item} role="tab" aria-selected={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "store" ? "Tienda" : item === "dm" ? "DM" : "Región"}</button>)}
        </div>
        <div className="filters">
          <label>Mes<select value={month} onChange={(event) => changeMonth(event.target.value)}>{data.meta.months.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Semana<select value={week} onChange={(event) => setWeek(Number(event.target.value))}>{monthWeeks.map((item) => <option key={item} value={item}>S{item}</option>)}</select></label>
          <label>Región<select value={region} onChange={(event) => changeRegion(event.target.value)}><option>Todas</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>DM<select value={dm} onChange={(event) => changeDm(event.target.value)}><option>Todos</option>{dms.map((item) => <option key={item}>{item}</option>)}</select></label>
          {view === "store" && <label className="search-label">Tienda o CeCo<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o número" inputMode="search"/></label>}
        </div>
        <nav className="scope-nav" aria-label="Alcance activo">
          <button onClick={resetScope}>Nacional</button><span>›</span>
          <button onClick={() => { setDm("Todos"); setView("dm"); }}>{region === "Todas" ? `${data.meta.organization.regions} regiones` : region}</button><span>›</span>
          <button onClick={() => setView("store")}>{dm === "Todos" ? `${dms.length} DMs` : dm}</button>
          {(region !== "Todas" || dm !== "Todos" || query) && <button className="scope-clear" onClick={resetScope}>Restablecer</button>}
        </nav>
      </section>

      <section className="kpi-grid">
        <Kpi label="Cada Taza Cuenta" value={currentRatio === null ? "—" : pct.format(currentRatio)} note={currentRatio === null ? "Sin base ponderable" : `S${week} · ${score.lobby ? int.format(score.lobby) + " bebidas" : "dato directo"}`} tone={currentRatio !== null && currentRatio > data.meta.target ? "good" : "alert"}/>
        <Kpi label="FHW" value={score.fhw ? int.format(score.fhw) : "—"} note="Vajilla reutilizable"/>
        <Kpi label="Bebidas Lobby" value={score.lobby ? int.format(score.lobby) : "—"} note="Base de ponderación"/>
        <Kpi label="Sobre objetivo" value={`${atTarget} de ${results.length}`} note={coverage ? `${coverage.publishedStores} tiendas con cruce` : view === "store" ? "tiendas" : view === "dm" ? "distritos" : "regiones"} tone={atTarget ? "good" : "default"}/>
      </section>

      <section className="story-card">
        <div><p className="eyebrow">LECTURA EJECUTIVA</p><h2>{delta === null ? "Corte listo para decidir" : delta >= 0 ? `Avance de ${pct.format(delta)}` : `Retroceso de ${pct.format(Math.abs(delta))}`}</h2><p>{story}</p></div>
        <div className="story-number"><span>Brecha</span><strong>{gap === null ? "—" : pct.format(gap)}</strong><small>vs objetivo</small></div>
      </section>

      <section className="dashboard-grid">
        <article className="panel trend-panel"><div className="panel-head"><div><p className="eyebrow">TENDENCIA</p><h2>{trendRange === "year" ? "Historia 2026" : `Ritmo de ${month}`}</h2></div><div className="panel-actions"><span className="formula-chip">Σ FHW / Σ Lobby</span><div className="toggle"><button className={trendRange === "month" ? "active" : ""} onClick={() => setTrendRange("month")}>Mes</button><button className={trendRange === "year" ? "active" : ""} onClick={() => setTrendRange("year")}>Año</button></div></div></div><TrendChart points={trend} target={data.meta.target}/>{historyError && <small className="trend-status">{historyError}</small>}<div className="trend-legend"><span><i className="legend-live"/>Ponderado</span><span><i className="legend-direct"/>Histórico directo</span></div></article>
        <article className="panel ranking-panel"><div className="panel-head"><div><p className="eyebrow">ENFOQUE</p><h2>{rankingMode === "top" ? "Top desempeño" : "Bottom oportunidad"}</h2></div><div className="toggle"><button className={rankingMode === "top" ? "active" : ""} onClick={() => setRankingMode("top")}>Top</button><button className={rankingMode === "bottom" ? "active" : ""} onClick={() => setRankingMode("bottom")}>Bottom</button></div></div>{ranking.length ? <Bars items={ranking} target={data.meta.target} onSelect={drillDown}/> : <div className="empty-chart"><strong>Sin datos</strong><span>Cambia el corte.</span></div>}</article>
      </section>

      <section className="panel table-panel"><div className="panel-head"><div><p className="eyebrow">DETALLE</p><h2>{view === "store" ? "Tiendas" : view === "dm" ? "Distritos" : "Regiones"} · Semana {week}</h2></div><div className="table-actions"><span>{Math.min(results.length, 100)} de {results.length}</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)} aria-label="Ordenar detalle"><option value="ratio-desc">Mayor desempeño</option><option value="ratio-asc">Mayor oportunidad</option><option value="name">Nombre A–Z</option></select></div></div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Alcance</th><th>FHW</th><th>Bebidas Lobby</th><th>Cada Taza Cuenta</th><th>Estado</th></tr></thead><tbody>{sortedResults.slice(0, 100).map((item) => <tr key={item.id}><td><strong>{item.label}</strong><small>{item.detail}</small></td><td>{item.stores || "Directo"}</td><td>{item.fhw === null ? "—" : int.format(item.fhw)}</td><td>{item.lobby === null ? "—" : int.format(item.lobby)}</td><td><strong>{pct.format(item.ratio)}</strong></td><td><span className={item.ratio > data.meta.target ? "status good" : "status opportunity"}>{item.ratio > data.meta.target ? "Sobre meta" : "Oportunidad"}</span></td></tr>)}</tbody></table></div></section>

      <section className="resource-grid">
        <article className="toolkit-card"><div><p className="eyebrow">KIT DE ACCIÓN</p><h2>Toolkit Cada Taza Cuenta</h2><p>Ideas listas para llevar a tienda.</p></div><a className="button solid" href="Toolkit_Cada_Taza_Cuenta.pdf" download>Descargar toolkit</a></article>
        {inspiration && <article className="inspiration-card"><img src="assets/juntemonos-mas.png" alt="Juntémonos más"/><div><p className="eyebrow">{inspiration.eyebrow}</p><h2>{inspiration.title}</h2><p>{inspiration.message}</p><small>{inspiration.closing}</small></div></article>}
      </section>
    </main>

    <footer><div><strong>FHW · Cada Taza Cuenta</strong><span>Diseñado por Jesus Alfredo Lopez Ramirez · Especialista de Sustentabilidad &amp; Enrique César Flores · Gerente de Distrito</span></div><div><span>La información publicada es propiedad de la marca y está prohibida su divulgación.</span><a href="https://wa.me/message/ENKDSAHYHIGAN1" target="_blank" rel="noreferrer">Comentarios y/o Sugerencias</a></div></footer>
  </div>;
}
