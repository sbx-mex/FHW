import type { DashboardExport } from "./xlsx-report";

const W=842,H=595;
const GREEN="0.000 0.384 0.255",INK="0.090 0.137 0.118",MUTED="0.390 0.465 0.430",LINE="0.835 0.882 0.858",GOLD="0.780 0.510 0.090";
const pct=(value:number|null)=>value===null?"—":`${(value*100).toFixed(1)}%`;
const plain=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g," ");
const escape=(value:string)=>plain(value).replace(/[\\()]/g,"\\$&");
const bytes=(value:string)=>Uint8Array.from(value,character=>character.charCodeAt(0)&255);
const short=(value:string,length=34)=>plain(value).length>length?`${plain(value).slice(0,length-1)}…`:plain(value);
function text(x:number,y:number,size:number,value:string,bold=false,color=INK){return `BT /${bold?"F2":"F1"} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${escape(value)}) Tj ET\n`;}
function rect(x:number,y:number,width:number,height:number,color:string){return `${color} rg ${x} ${y} ${width} ${height} re f\n`;}
function line(x1:number,y1:number,x2:number,y2:number,color=LINE,dash=""){return `${dash}${color} RG 0.8 w ${x1} ${y1} m ${x2} ${y2} l S\n${dash?"[] 0 d\n":""}`;}
function circle(x:number,y:number,r:number,stroke=GREEN,fill?:string){const c=r*.55228475;return `${fill?`${fill} rg `:""}${stroke} RG 1.8 w ${x+r} ${y} m ${x+r} ${y+c} ${x+c} ${y+r} ${x} ${y+r} c ${x-c} ${y+r} ${x-r} ${y+c} ${x-r} ${y} c ${x-r} ${y-c} ${x-c} ${y-r} ${x} ${y-r} c ${x+c} ${y-r} ${x+r} ${y-c} ${x+r} ${y} c ${fill?"B":"S"}\n`;}

function chart(report:DashboardExport,x:number,y:number,width:number,height:number){
  const points=report.trend;
  if(!points.length)return text(x+width/2-38,y+height/2,10,"Sin tendencia",true,MUTED);
  const values=points.map(point=>point.ratio),min=Math.max(0,Math.min(...values,report.target)*.72),max=Math.min(1,Math.max(...values,report.target)*1.18);
  const left=x+35,right=x+width-12,bottom=y+25,top=y+height-20,scaleX=(index:number)=>points.length===1?(left+right)/2:left+index*(right-left)/(points.length-1),scaleY=(value:number)=>bottom+(value-min)*(top-bottom)/(max-min||1);
  let output="";[min,(min+max)/2,max].forEach(value=>{const yy=scaleY(value);output+=line(left,yy,right,yy)+text(x,yy-3,7,pct(value),false,MUTED);});
  const targetY=scaleY(report.target);output+=`${GOLD} RG [4 3] 0 d 1 w ${left} ${targetY.toFixed(1)} m ${right} ${targetY.toFixed(1)} l S\n[] 0 d\n`+text(right-52,targetY+5,7,"Meta 10%",true,GOLD);
  output+=`${GREEN} RG 2.2 w ${points.map((point,index)=>`${index?"l":"m"} ${scaleX(index).toFixed(1)} ${scaleY(point.ratio).toFixed(1)}`).join(" ")} S\n`;
  const step=Math.max(1,Math.ceil((points.length-1)/6));
  points.forEach((point,index)=>{const px=scaleX(index),py=scaleY(point.ratio);output+=circle(px,py,2.8,GREEN,"1 1 1");if(index===0||index===points.length-1||index%step===0)output+=text(px-11,bottom-16,6,short(point.label,6),false,MUTED);});
  return output;
}

function list(report:DashboardExport,x:number,y:number,width:number,height:number){
  const items=[...report.results].sort((a,b)=>b.ratio-a.ratio),columns=items.length>7?2:1,rows=Math.ceil(items.length/columns),gap=14,columnWidth=(width-gap*(columns-1))/columns,rowHeight=Math.max(15,Math.min(23,(height-26)/Math.max(1,rows)));
  let output="";
  items.forEach((item,index)=>{const column=Math.floor(index/rows),row=index%rows,xx=x+column*(columnWidth+gap),yy=y+height-25-row*rowHeight,barWidth=Math.min(42,Math.max(3,item.ratio/.2*42));output+=line(xx,yy-5,xx+columnWidth,yy-5)+text(xx,yy,7,`${index+1}`,true,GREEN)+text(xx+14,yy,7,short(item.label,rowHeight<18?21:25),true,INK)+rect(xx+columnWidth-52,yy-2,barWidth,2.6,GREEN)+text(xx+columnWidth-12,yy,7,pct(item.ratio),true,INK);});
  return output;
}

function createPdf(report:DashboardExport){
  const sorted=[...report.results].sort((a,b)=>b.ratio-a.ratio),leader=sorted[0],focus=sorted.at(-1),movement=report.movement===null?"—":`${report.movement>=0?"+":""}${pct(report.movement)}`;
  const content=[
    "q\n",rect(0,555,W,40,GREEN),text(30,570,16,"FHW",true,"1 1 1"),text(72,570,8,"CADA TAZA CUENTA",true,"1 1 1"),
    text(30,525,8,report.scope.toUpperCase(),true,GREEN),text(30,495,27,"Cada Taza Cuenta",true,INK),text(30,476,10,report.period,false,MUTED),
    circle(505,499,29,GREEN),text(493,495,15,pct(report.score),true,INK),text(496,482,6,"PROMEDIO",true,MUTED),
    line(554,462,554,520),text(570,512,7,"MOVIMIENTO",true,MUTED),text(570,489,14,movement,true,INK),text(570,478,6,"vs. corte previo",false,MUTED),
    line(682,462,682,520),text(698,512,7,"SOBRE META",true,MUTED),text(698,489,14,`${sorted.filter(item=>item.ratio>report.target).length} / ${sorted.length}`,true,INK),text(698,478,6,"resultados",false,MUTED),
    line(30,445,812,445),text(30,428,8,"ENFOQUE",true,GREEN),text(30,409,14,short(report.storyTitle,48),true,INK),
    text(350,423,7,"LIDER",true,MUTED),text(350,409,9,short(leader?.label??"Sin dato",30),true,INK),text(350,396,7,pct(leader?.ratio??null),true,GOLD),
    line(554,392,554,430),text(570,423,7,"SIGUIENTE",true,MUTED),text(570,409,9,short(focus?.label??"Sin dato",30),true,INK),text(570,396,7,pct(focus?.ratio??null),true,GOLD),
    line(30,370,812,370),text(30,353,8,"TENDENCIA",true,GREEN),text(30,334,14,short(report.metric,42),true,INK),chart(report,30,87,468,220),
    line(522,84,522,365),text(542,353,8,`LISTADO · ${report.level.toUpperCase()}`,true,GREEN),text(542,334,14,`${sorted.length} resultados`,true,INK),list(report,542,90,264,214),
    line(24,55,818,55),text(24,39,8,"FHW · Cada Taza Cuenta",true,GREEN),text(514,39,7,"Informacion propiedad de la marca. Prohibida su divulgacion.",false,MUTED),"Q\n",
  ].join("");
  const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>",`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,`<< /Length ${bytes(content).length} >>\nstream\n${content}endstream`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`];
  let source="%PDF-1.4\n%âãÏÓ\n";const offsets=[0];objects.forEach((object,index)=>{offsets[index+1]=bytes(source).length;source+=`${index+1} 0 obj\n${object}\nendobj\n`;});const xref=bytes(source).length;source+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([bytes(source)],{type:"application/pdf"});
}

export function downloadDashboardPdf(report:DashboardExport,filename:string){const url=URL.createObjectURL(createPdf(report)),anchor=document.createElement("a");anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
