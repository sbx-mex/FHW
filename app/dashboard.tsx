/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type View = "region" | "dm" | "store";
type Row = { year:number; week:number; month:string; ceco:string; store:string; dm:string; region:string; fhw:number|null; lobby:number|null; ratio:number; source:string };
type HistoricalDm = { year:number; week:number; dm:string; ratio:number };
type Organization = { regions:number; dms:number; stores:number; hierarchy:Array<{name:string;dms:Array<{name:string;stores:Array<{ceco:string;name:string;applies?:boolean}>}>}> };
type Coverage = { week:number; publishedStores:number };
type Payload = { meta:{ title:string; version:string; target:number; latestCompleteWeek:number; weeks:number[]; months:string[]; monthWeeks:Record<string,number[]>; historyFiles:Record<string,string>; organization:Organization; coverageByWeek:Coverage[] }; records:Row[]; historicalDm:HistoricalDm[] };
type Resource = { id:string; category:string; title:string; description:string; file:string; action:string };
type ResourceConfig = { resources:Resource[] };
type Result = { id:string; label:string; detail:string; ratio:number; stores:number };
type TrendPoint = { key:string; label:string; ratio:number; direct:boolean };

const pct = new Intl.NumberFormat("es-MX", { style:"percent", minimumFractionDigits:1, maximumFractionDigits:1 });
const LEVELS:View[] = ["region","dm","store"];
const labelView = (view:View) => view === "region" ? "Región" : view === "dm" ? "DM" : "Tienda";
const pluralView = (view:View) => view === "region" ? "Regiones" : view === "dm" ? "DMs" : "Tiendas";
const displayDm = (value:string) => value.toLocaleLowerCase("es-MX") === "vacante" ? "DM por asignar" : value;

function weighted(rows:Row[]) {
  const valid=rows.filter((row)=>row.fhw!==null&&row.lobby!==null&&row.lobby>0);
  const fhw=valid.reduce((sum,row)=>sum+(row.fhw??0),0),lobby=valid.reduce((sum,row)=>sum+(row.lobby??0),0);
  return {ratio:lobby?fhw/lobby:null,stores:new Set(valid.map((row)=>row.ceco)).size};
}

function groupLive(rows:Row[],view:View):Result[] {
  const groups=new Map<string,Row[]>();
  rows.forEach((row)=>{const id=view==="store"?row.ceco:view==="dm"?row.dm:row.region;groups.set(id,[...(groups.get(id)??[]),row]);});
  return [...groups.entries()].map(([id,items])=>{const first=items[0],stores=new Set(items.map((item)=>item.ceco)).size;return{id,label:view==="store"?`${first.store} · ${first.ceco}`:view==="dm"?displayDm(id):id,detail:view==="store"?`${displayDm(first.dm)} · ${first.region}`:view==="dm"?`${first.region} · ${stores} tiendas`:`${stores} tiendas`,ratio:weighted(items).ratio??0,stores};});
}

function PeriodSelect<T extends string|number>({label,options,selected,onChange,render,allLabel}:{label:string;options:T[];selected:T[];onChange:(items:T[])=>void;render:(item:T)=>string;allLabel:string}) {
  const summary=selected.length===0?allLabel:selected.length===1?render(selected[0]):`${selected.length} seleccionados`;
  function toggle(item:T){onChange(selected.includes(item)?selected.filter((value)=>value!==item):[...selected,item]);}
  return <details className="period-select"><summary><span>{label}</span><strong>{summary}</strong><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg></summary><div className="period-options"><label className="option-all"><input type="checkbox" checked={selected.length===0} onChange={()=>onChange([])}/><span>{allLabel}</span></label>{options.map((item)=><label key={String(item)}><input type="checkbox" checked={selected.includes(item)} onChange={()=>toggle(item)}/><span>{render(item)}</span></label>)}</div></details>;
}

function ScoreRing({value,target}:{value:number|null;target:number}) {
  const progress=value===null?0:Math.min(value/target,1);
  return <div className="score-ring"><svg viewBox="0 0 120 120" role="img" aria-label={value===null?"Sin resultado":pct.format(value)}><circle className="ring-track" cx="60" cy="60" r="48"/><circle className="ring-value" cx="60" cy="60" r="48" pathLength="1" strokeDasharray={`${progress} 1`}/></svg><span><strong>{value===null?"—":pct.format(value)}</strong><small>meta &gt; 10%</small></span></div>;
}

function TrendChart({points,target}:{points:TrendPoint[];target:number}) {
  if(!points.length)return <div className="empty"><strong>Sin tendencia ponderable</strong><span>Elige semanas 30 a 34 o un DM histórico.</span></div>;
  const width=820,height=250,left=50,right=24,top=24,bottom=44,max=Math.max(target*1.3,...points.map((point)=>point.ratio*1.14),.02),min=Math.max(0,Math.min(...points.map((point)=>point.ratio),target)*.72),step=Math.max(1,Math.ceil(points.length/10));
  const x=(index:number)=>points.length===1?width/2:left+index*((width-left-right)/(points.length-1)),y=(value:number)=>top+(max-value)*((height-top-bottom)/(max-min));
  return <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendencia de Cada Taza Cuenta">{[min,(min+max)/2,max].map((value)=><g key={value}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} className="chart-grid"/><text x={left-10} y={y(value)+4} textAnchor="end">{pct.format(value)}</text></g>)}<line x1={left} x2={width-right} y1={y(target)} y2={y(target)} className="chart-target"/><text x={width-right} y={y(target)-8} textAnchor="end" className="target-copy">Objetivo 10%</text><polyline points={points.map((point,index)=>`${x(index)},${y(point.ratio)}`).join(" ")} className="chart-line"/>{points.map((point,index)=><g className="chart-point" key={point.key}><circle cx={x(index)} cy={y(point.ratio)} r={points.length>16?4:6} className={point.ratio>target?"is-good":""}/>{(index%step===0||index===points.length-1)&&<text x={x(index)} y={height-17} textAnchor="middle">{point.label}</text>}<title>{`${point.label}: ${pct.format(point.ratio)}`}</title></g>)}</svg>;
}

function Ranking({items,target,onSelect}:{items:Result[];target:number;onSelect:(item:Result)=>void}) {
  const max=Math.max(...items.map((item)=>item.ratio),target,.01);
  return <div className="ranking-list">{items.map((item,index)=><button key={item.id} onClick={()=>onSelect(item)}><span className="rank-number">{index+1}</span><span className="rank-name"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="rank-line"><i className={item.ratio>target?"is-good":""} style={{width:`${Math.max(3,item.ratio/max*100)}%`}}/></span><strong className="rank-score">{pct.format(item.ratio)}</strong></button>)}</div>;
}

export default function Dashboard(){
  const [data,setData]=useState<Payload|null>(null),[resources,setResources]=useState<ResourceConfig>({resources:[]}),[error,setError]=useState("");
  const [view,setView]=useState<View>("region"),[monthsSelected,setMonthsSelected]=useState<string[]>([]),[weeksSelected,setWeeksSelected]=useState<number[]>([]),[region,setRegion]=useState(""),[dm,setDm]=useState("");
  const [trendMode,setTrendMode]=useState<"week"|"month">("week"),[rankingMode,setRankingMode]=useState<"top"|"bottom">("top");
  const [historyRows,setHistoryRows]=useState<Row[]>([]),[historyDm,setHistoryDm]=useState<HistoricalDm[]>([]),[historyLoading,setHistoryLoading]=useState(false),[historyError,setHistoryError]=useState("");
  const historyRequested=useRef(new Set<string>()),urlReady=useRef(false);

  useEffect(()=>{Promise.all([fetch("data/fhw-dashboard.json").then((response)=>{if(!response.ok)throw new Error("No se pudo leer la base");return response.json();}),fetch("data/resources.json").then((response)=>response.json())]).then(([payload,resourcePayload]:[Payload,ResourceConfig])=>{setData(payload);setResources(resourcePayload);const params=new URLSearchParams(location.search),latest=payload.meta.latestCompleteWeek,latestMonth=payload.records.find((row)=>row.week===latest)?.month??payload.meta.months.at(-1)??"",requestedMonths=(params.get("meses")??params.get("mes")??"").split("|").filter((item)=>payload.meta.months.includes(item)),requestedWeeks=(params.get("semanas")??params.get("semana")??"").split("|").map(Number).filter((item)=>payload.meta.weeks.includes(item)),requestedView=params.get("vista") as View|null;setMonthsSelected(requestedMonths.length?requestedMonths:[latestMonth]);setWeeksSelected(requestedWeeks);setView(requestedView&&LEVELS.includes(requestedView)?requestedView:"region");setRegion(params.get("region")??"");setDm(params.get("dm")??"");setTrendMode(params.get("tendencia")==="month"?"month":"week");urlReady.current=true;}).catch((reason)=>setError(reason instanceof Error?reason.message:"No se pudo cargar el tablero"));},[]);
  useEffect(()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>undefined);},[]);
  useEffect(()=>{if(!data)return;const targets=monthsSelected.length?monthsSelected:data.meta.months,pending=targets.filter((item)=>data.meta.historyFiles[item]&&!historyRequested.current.has(item));if(!pending.length)return;pending.forEach((item)=>historyRequested.current.add(item));queueMicrotask(()=>setHistoryLoading(true));Promise.all(pending.map(async(item)=>{const response=await fetch(data.meta.historyFiles[item]);if(!response.ok)throw new Error(`No se pudo leer ${item}`);return response.json() as Promise<{records:Row[];historicalDm:HistoricalDm[]}>;})).then((items)=>{setHistoryRows((current)=>[...current,...items.flatMap((item)=>item.records)]);setHistoryDm((current)=>[...current,...items.flatMap((item)=>item.historicalDm)]);setHistoryError("");}).catch((reason)=>{pending.forEach((item)=>historyRequested.current.delete(item));setHistoryError(reason instanceof Error?reason.message:"Histórico parcial");}).finally(()=>setHistoryLoading(false));},[data,monthsSelected]);
  useEffect(()=>{if(!data||!urlReady.current)return;const params=new URLSearchParams({vista:view});if(monthsSelected.length)params.set("meses",monthsSelected.join("|"));if(weeksSelected.length)params.set("semanas",weeksSelected.join("|"));if(region)params.set("region",region);if(dm)params.set("dm",dm);if(trendMode==="month")params.set("tendencia","month");history.replaceState(null,"",`${location.pathname}?${params}`);},[data,view,monthsSelected,weeksSelected,region,dm,trendMode]);

  const allRows=useMemo(()=>[...(data?.records??[]),...historyRows],[data,historyRows]),allHistoricalDm=useMemo(()=>[...(data?.historicalDm??[]),...historyDm],[data,historyDm]);
  const regionOptions=useMemo(()=>data?.meta.organization.hierarchy.map((item)=>item.name)??[],[data]);
  const dmOptions=useMemo(()=>{const hierarchy=data?.meta.organization.hierarchy??[],scope=region?hierarchy.filter((item)=>item.name===region):hierarchy;return [...new Set(scope.flatMap((item)=>item.dms.map((district)=>district.name)))].sort((a,b)=>displayDm(a).localeCompare(displayDm(b),"es"));},[data,region]);
  const availableWeeks=useMemo(()=>{if(!data)return[];const months=monthsSelected.length?monthsSelected:data.meta.months;return [...new Set(months.flatMap((item)=>data.meta.monthWeeks[item]??[]))].sort((a,b)=>a-b);},[data,monthsSelected]);
  const activeWeeks=useMemo(()=>weeksSelected.length?weeksSelected.filter((item)=>availableWeeks.includes(item)):availableWeeks,[weeksSelected,availableWeeks]);
  const latestCutWeek=activeWeeks.at(-1)??data?.meta.latestCompleteWeek??0;
  const scopeRows=useMemo(()=>allRows.filter((row)=>(!region||row.region===region)&&(!dm||row.dm===dm)),[allRows,region,dm]);
  const selectedRows=useMemo(()=>scopeRows.filter((row)=>activeWeeks.includes(row.week)),[scopeRows,activeWeeks]);
  const liveRows=selectedRows.filter((row)=>row.fhw!==null&&row.lobby!==null),latestRows=scopeRows.filter((row)=>row.week===latestCutWeek);
  const results:Result[]=(()=>{if(!data)return[];if(liveRows.length)return groupLive(liveRows,view);if(view==="store")return latestRows.map((row)=>({id:row.ceco,label:`${row.store} · ${row.ceco}`,detail:`${displayDm(row.dm)} · ${row.region}`,ratio:row.ratio,stores:1}));if(view==="dm"){const allowed=new Set(latestRows.map((row)=>row.dm));return allHistoricalDm.filter((item)=>item.week===latestCutWeek&&allowed.has(item.dm)&&(!dm||item.dm===dm)).map((item)=>({id:item.dm,label:displayDm(item.dm),detail:region||"Cierre histórico",ratio:item.ratio,stores:0}));}return[];})();
  const score=weighted(liveRows).ratio??(results.length===1?results[0].ratio:null),atTarget=results.filter((item)=>item.ratio>(data?.meta.target??.1)).length,coverage=data?.meta.coverageByWeek.find((item)=>item.week===latestCutWeek);
  const ranked=[...results].sort((a,b)=>rankingMode==="top"?b.ratio-a.ratio:a.ratio-b.ratio).slice(0,view==="region"?11:10);

  const trend:TrendPoint[]=(()=>{if(!data)return[];if(trendMode==="week")return activeWeeks.map((item)=>{const rows=scopeRows.filter((row)=>row.week===item),live=weighted(rows);if(live.ratio!==null)return{key:`w${item}`,label:`S${item}`,ratio:live.ratio,direct:false};if(view==="dm"&&dm){const direct=allHistoricalDm.find((row)=>row.week===item&&row.dm===dm);if(direct)return{key:`w${item}`,label:`S${item}`,ratio:direct.ratio,direct:true};}return null;}).filter((item):item is TrendPoint=>item!==null);const months=monthsSelected.length?monthsSelected:data.meta.months;return months.map((item)=>{const weeks=(data.meta.monthWeeks[item]??[]).filter((week)=>activeWeeks.includes(week)),rows=scopeRows.filter((row)=>weeks.includes(row.week)),live=weighted(rows);if(live.ratio!==null)return{key:item,label:item,ratio:live.ratio,direct:false};if(view==="dm"&&dm){const direct=allHistoricalDm.filter((row)=>weeks.includes(row.week)&&row.dm===dm).sort((a,b)=>b.week-a.week)[0];if(direct)return{key:item,label:item,ratio:direct.ratio,direct:true};}return null;}).filter((item):item is TrendPoint=>item!==null);})();
  const currentPoint=trend.at(-1),previous=trend.at(-2),delta=currentPoint&&previous?currentPoint.ratio-previous.ratio:null,priority=[...results].sort((a,b)=>a.ratio-b.ratio)[0],scopeLabel=dm?displayDm(dm):region||"Nacional",periodLabel=activeWeeks.length===1?`Semana ${activeWeeks[0]}`:`${activeWeeks.length} semanas`;
  const storyTitle=score===null?"Selecciona un corte ponderable":score>data.meta.target?"El alcance supera el objetivo":"La oportunidad está identificada";
  const storyText=score===null?"La tendencia conserva el histórico disponible.":`${atTarget} de ${results.length} ${pluralView(view).toLocaleLowerCase("es-MX")} están sobre 10%.${priority?` ${priority.label} marca el siguiente foco.`:""}`;

  function selectMonths(items:string[]){setMonthsSelected(items);const months=items.length?items:data?.meta.months??[],allowed=new Set(months.flatMap((item)=>data?.meta.monthWeeks[item]??[]));setWeeksSelected((current)=>current.filter((item)=>allowed.has(item)));}
  function selectRegion(value:string){setRegion(value);setDm("");setView(value?"dm":"region");setRankingMode("top");}
  function selectDm(value:string){setDm(value);setView(value?"store":"dm");setRankingMode("top");}
  function changeLevel(level:View){setView(level);setRankingMode("top");if(level==="region"){setRegion("");setDm("");}else if(level==="dm")setDm("");}
  function drillDown(item:Result){if(view==="region")selectRegion(item.id);else if(view==="dm")selectDm(item.id);document.querySelector(".story-card-v2")?.scrollIntoView({behavior:"smooth",block:"center"});}
  function reset(){setRegion("");setDm("");setView("region");setRankingMode("top");}
  function exportPdf(){const previous=document.title,scope=scopeLabel.replaceAll(" ","_"),period=activeWeeks.join("-");document.title=`FHW_${pluralView(view)}_${scope}_S${period}`;document.body.dataset.exporting="true";const restore=()=>{document.title=previous;delete document.body.dataset.exporting;};window.addEventListener("afterprint",restore,{once:true});requestAnimationFrame(()=>window.print());window.setTimeout(restore,4000);}

  if(error)return <main className="state-screen"><img src="assets/logo-cada-taza-cuenta.webp" alt="FHW"/><h1>No pudimos abrir el tablero</h1><p>{error}</p><button onClick={()=>location.reload()}>Reintentar</button></main>;
  if(!data)return <main className="state-screen"><div className="loader"/><h1>Preparando Cada Taza Cuenta</h1><p>Validando el corte…</p></main>;

  const resource=resources.resources[0];
  return <div className="app-shell"><header className="topbar"><a className="brand" href="#inicio"><img src="assets/logo-cada-taza-cuenta.webp" alt="FHW"/><span><strong>FHW</strong><small>Cada Taza Cuenta</small></span></a><div className="header-actions"><span className="status-dot">Datos validados · S{data.meta.latestCompleteWeek}</span><button className="button export" onClick={exportPdf}>PDF · {pluralView(view)}</button></div></header>
    <main id="inicio"><section className="overview-card"><div className="overview-title"><h1>Cada Taza Cuenta</h1><p>{scopeLabel} · {periodLabel}</p></div><ScoreRing value={score} target={data.meta.target}/><div className="overview-facts"><span><small>Movimiento</small><strong className={delta!==null&&delta>=0?"positive":""}>{delta===null?"—":`${delta>=0?"+":""}${pct.format(delta)}`}</strong></span><span><small>Cobertura</small><strong>{coverage?pct.format(coverage.publishedStores/data.meta.organization.stores):"—"}</strong></span><span><small>Sobre meta</small><strong>{atTarget} / {results.length}</strong></span></div></section>
      <section className="filter-card"><div className="level-tabs" role="tablist" aria-label="Nivel de análisis">{LEVELS.map((item)=><button key={item} role="tab" aria-selected={view===item} className={view===item?"active":""} onClick={()=>changeLevel(item)}>{labelView(item)}</button>)}</div><div className="filter-grid"><PeriodSelect label="Mes" options={data.meta.months} selected={monthsSelected} onChange={selectMonths} render={(item)=>item} allLabel="Todo 2026"/><PeriodSelect label="Semana" options={availableWeeks} selected={weeksSelected} onChange={setWeeksSelected} render={(item)=>`S${item}`} allLabel="Todas"/><label className="native-filter"><span>Región</span><select value={region} onChange={(event)=>selectRegion(event.target.value)}><option value="">Todas las regiones</option>{regionOptions.map((item)=><option key={item}>{item}</option>)}</select></label><label className="native-filter"><span>DM</span><select value={dm} onChange={(event)=>selectDm(event.target.value)} disabled={!region&&view==="region"}><option value="">Todos los DMs</option>{dmOptions.map((item)=><option key={item} value={item}>{displayDm(item)}</option>)}</select></label></div><div className="scope-row"><span>Nacional</span>{region&&<><span>›</span><span>{region}</span></>}{dm&&<><span>›</span><strong>{displayDm(dm)}</strong></>}{(region||dm)&&<button onClick={reset}>Limpiar</button>}</div></section>
      <section className="story-card-v2"><span className={score!==null&&score>data.meta.target?"story-signal good":"story-signal"}/><div><small>LECTURA DEL CORTE</small><h2>{storyTitle}</h2><p>{storyText}</p></div><div className="story-focus"><small>Siguiente foco</small><strong>{priority?.label??"Sin dato"}</strong><span>{priority?pct.format(priority.ratio):"—"}</span></div></section>
      <section className="dashboard-grid"><article className="panel trend-panel"><div className="panel-head"><div><small>TENDENCIA</small><h2>{trendMode==="week"?"Semana a semana":"Evolución mensual"}</h2></div><div className="toggle"><button className={trendMode==="week"?"active":""} onClick={()=>setTrendMode("week")}>Semanas</button><button className={trendMode==="month"?"active":""} onClick={()=>setTrendMode("month")}>Meses</button></div></div><TrendChart points={trend} target={data.meta.target}/>{historyLoading&&<span className="chart-note">Cargando historia…</span>}{historyError&&<span className="chart-note error">{historyError}</span>}<div className="chart-legend"><span><i/>Ponderado</span><span><i className="direct"/>Histórico directo</span></div></article><article className="panel ranking-panel"><div className="panel-head"><div><small>RANKING · {pluralView(view).toUpperCase()}</small><h2>{rankingMode==="top"?"Mayor desempeño":"Mayor oportunidad"}</h2></div><div className="toggle"><button className={rankingMode==="top"?"active":""} onClick={()=>setRankingMode("top")}>Top</button><button className={rankingMode==="bottom"?"active":""} onClick={()=>setRankingMode("bottom")}>Bottom</button></div></div>{ranked.length?<Ranking items={ranked} target={data.meta.target} onSelect={drillDown}/>:<div className="empty"><strong>Sin corte ponderable</strong><span>Elige semanas 30 a 34.</span></div>}</article></section>
      {resource&&<section className="resource-card"><div className="resource-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Zm8 0v4h4M9 12h6M9 16h6"/></svg></div><div><small>{resource.category}</small><h2>{resource.title}</h2><p>{resource.description}</p></div><a className="button solid" href={resource.file} download>{resource.action}</a></section>}
    </main><footer><div><strong>FHW · Cada Taza Cuenta</strong><span>Jesus Alfredo Lopez Ramirez · Especialista de Sustentabilidad &amp; Enrique César Flores · Gerente de Distrito</span></div><div><span>Información propiedad de la marca. Prohibida su divulgación.</span><a href="https://wa.me/message/ENKDSAHYHIGAN1" target="_blank" rel="noreferrer">Comentarios y/o Sugerencias</a></div></footer></div>;
}
