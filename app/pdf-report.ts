import type { DashboardExport } from "./xlsx-report";

const PAGE_WIDTH=842;
const PAGE_HEIGHT=595;
const GREEN="0.000 0.384 0.255";
const INK="0.090 0.137 0.118";
const MUTED="0.390 0.465 0.430";
const LINE="0.835 0.882 0.858";
const GOLD="0.780 0.510 0.090";

const pct=(value:number|null)=>value===null?"—":`${(value*100).toFixed(1)}%`;
const plain=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g," ");
const escape=(value:string)=>plain(value).replace(/[\\()]/g,"\\$&");
const bytes=(value:string)=>Uint8Array.from(value,character=>character.charCodeAt(0)&255);
const short=(value:string,length=42)=>plain(value).length>length?`${plain(value).slice(0,length-1)}…`:plain(value);

function text(x:number,y:number,size:number,value:string,bold=false,color=INK){return `BT /${bold?"F2":"F1"} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${escape(value)}) Tj ET\n`;}
function rect(x:number,y:number,width:number,height:number,color:string,stroke?:string){return `${color} rg ${x} ${y} ${width} ${height} re f\n${stroke?`${stroke} RG 0.6 w ${x} ${y} ${width} ${height} re S\n`:""}`;}
function line(x1:number,y1:number,x2:number,y2:number,color=LINE,dash=""){return `${dash}${color} RG 0.8 w ${x1} ${y1} m ${x2} ${y2} l S\n${dash?"[] 0 d\n":""}`;}
function circle(x:number,y:number,r:number,stroke=GREEN,fill?:string){const c=r*.55228475;return `${fill?`${fill} rg `:""}${stroke} RG 1.8 w ${x+r} ${y} m ${x+r} ${y+c} ${x+c} ${y+r} ${x} ${y+r} c ${x-c} ${y+r} ${x-r} ${y+c} ${x-r} ${y} c ${x-r} ${y-c} ${x-c} ${y-r} ${x} ${y-r} c ${x+c} ${y-r} ${x+r} ${y-c} ${x+r} ${y} c ${fill?"B":"S"}\n`;}

function chart(report:DashboardExport,x:number,y:number,width:number,height:number){
  const points=report.trend.slice(-12);
  if(!points.length)return text(x+width/2-42,y+height/2,11,"Sin tendencia disponible",true,MUTED);
  const values=points.map(point=>point.ratio),min=Math.max(0,Math.min(...values,report.target)*.72),max=Math.min(1,Math.max(...values,report.target)*1.2),plotLeft=x+38,plotRight=x+width-16,plotBottom=y+28,plotTop=y+height-26;
  const scaleY=(value:number)=>plotBottom+(value-min)*(plotTop-plotBottom)/(max-min||1),scaleX=(index:number)=>points.length===1?(plotLeft+plotRight)/2:plotLeft+index*(plotRight-plotLeft)/(points.length-1);
  let output="";
  [min,(min+max)/2,max].forEach(value=>{const yy=scaleY(value);output+=line(plotLeft,yy,plotRight,yy)+text(x,yy-3,7,pct(value),false,MUTED);});
  const targetY=scaleY(report.target);output+=`${GOLD} RG [4 3] 0 d 1 w ${plotLeft} ${targetY.toFixed(1)} m ${plotRight} ${targetY.toFixed(1)} l S\n[] 0 d\n`+text(plotRight-52,targetY+5,7,"Objetivo 10%",true,GOLD);
  output+=`${GREEN} RG 2.2 w ${points.map((point,index)=>`${index?"l":"m"} ${scaleX(index).toFixed(1)} ${scaleY(point.ratio).toFixed(1)}`).join(" ")} S\n`;
  points.forEach((point,index)=>{const px=scaleX(index),py=scaleY(point.ratio);output+=circle(px,py,3.4,GREEN,"1 1 1")+text(px-12,plotBottom-18,7,short(point.label,7),false,MUTED);});
  return output;
}

function ranking(report:DashboardExport,x:number,y:number,width:number,height:number){
  const items=[...report.results].sort((a,b)=>b.ratio-a.ratio);
  const rowHeight=Math.max(13,Math.min(22,(height-30)/Math.max(1,items.length)));
  const detail=Math.max(5,Math.min(6,rowHeight*.45));
  let output="";
  items.forEach((item,index)=>{const rowY=y+height-29-index*rowHeight,barWidth=Math.min(56,Math.max(4,item.ratio/.2*56));output+=line(x,rowY-5,x+width,rowY-5)+text(x,rowY,8,`${index+1}`,true,GREEN)+text(x+17,rowY,8,short(item.label,rowHeight<16?27:24),true,INK)+text(x+17,rowY-detail-1,detail,short(item.detail,rowHeight<16?34:28),false,MUTED)+rect(x+width-76,rowY-2,barWidth,3,GREEN)+text(x+width-14,rowY,8,pct(item.ratio),true,INK);});
  return output;
}

function createPdf(report:DashboardExport){
  const rankingItems=[...report.results].sort((a,b)=>b.ratio-a.ratio);
  const leader=rankingItems[0],focus=[...rankingItems].reverse()[0];
  let content="q\n";
  content+=rect(0,555,PAGE_WIDTH,40,GREEN)+text(30,570,16,"FHW",true,"1 1 1")+text(72,570,8,"CADA TAZA CUENTA",true,"1 1 1");
  content+=text(28,522,8,report.scope.toUpperCase(),true,GREEN)+text(28,490,26,"Cada Taza Cuenta",true,INK)+text(28,472,10,`${report.period} · ${report.metric}`,false,MUTED);
  content+=circle(626,493,28,GREEN)+text(614,488,16,pct(report.score),true,INK)+text(618,476,6,"PROMEDIO CTC",true,MUTED);
  const movement=report.movement===null?"—":`${report.movement>=0?"+":""}${pct(report.movement)}`;
  content+=line(676,464,676,518)+text(690,510,7,"MOVIMIENTO",true,MUTED)+text(690,485,13,movement,true,INK)+line(758,464,758,518)+text(772,510,7,"SOBRE META",true,MUTED)+text(772,485,13,`${rankingItems.filter(item=>item.ratio>report.target).length}/${rankingItems.length}`,true,INK);
  content+=line(28,444,814,444)+text(28,426,8,"LECTURA DEL CORTE",true,GREEN)+text(28,406,14,report.storyTitle,true,INK)+text(260,408,8,short(report.storyText,96),false,MUTED)+line(610,398,610,430)+text(626,426,7,"LIDER",true,MUTED)+text(626,411,9,short(leader?.label??"Sin dato",26),true,INK)+line(714,398,714,430)+text(730,426,7,"SIGUIENTE FOCO",true,MUTED)+text(730,411,9,short(focus?.label??"Sin dato",18),true,INK);
  content+=line(516,82,516,384)+text(28,369,8,`TENDENCIA · ${report.period.toUpperCase()}`,true,GREEN)+text(28,348,14,report.metric,true,INK)+chart(report,28,94,462,225);
  content+=text(536,369,8,`LISTADO · ${report.level.toUpperCase()}`,true,GREEN)+text(536,348,14,"Resultado del periodo",true,INK)+ranking(report,536,90,270,232);
  content+=line(24,56,818,56)+text(24,39,8,"FHW · Cada Taza Cuenta",true,GREEN)+text(516,39,7,"Informacion propiedad de la marca. Prohibida su divulgacion.",false,MUTED)+"Q\n";
  const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>",`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,`<< /Length ${bytes(content).length} >>\nstream\n${content}endstream`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`];
  let source="%PDF-1.4\n%âãÏÓ\n";const offsets=[0];
  objects.forEach((object,index)=>{offsets[index+1]=bytes(source).length;source+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref=bytes(source).length;source+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([bytes(source)],{type:"application/pdf"});
}

export function downloadDashboardPdf(report:DashboardExport,filename:string){
  const url=URL.createObjectURL(createPdf(report)),anchor=document.createElement("a");
  anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);
}
