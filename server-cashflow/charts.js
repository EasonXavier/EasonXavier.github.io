(function(root){
'use strict';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const amount=n=>n.toLocaleString('zh-CN',{maximumFractionDigits:6});
function render(r,mode='balance',selected=-1){
 const events=r.events,n=events.length,w=Math.max(760,n*65+90),h=300,left=72,right=25,top=25,bottom=42,plotH=h-top-bottom;
 const vals=mode==='balance'?[0,...events.map(e=>e.balance)]:[0,...events.flatMap(e=>[e.inflow,-e.upstream-e.rebate])];
 let low=Math.min(...vals),high=Math.max(...vals);const span=high-low||1;low=low<0?low-span*.13:0;high=high>0?high+span*.13:span*.1;
 const y=v=>top+(high-v)/(high-low)*plotH,x=i=>left+(w-left-right)*(i+.5)/Math.max(1,n),zero=y(0),grid=[];
 for(let i=0;i<5;i++){let v=high-(high-low)*i/4,yy=y(v);grid.push(`<line class="chart-grid" x1="${left}" y1="${yy}" x2="${w-right}" y2="${yy}"/><text class="axis-text" x="${left-10}" y="${yy+4}" text-anchor="end">${safe(v.toLocaleString('zh-CN',{maximumFractionDigits:0}))}</text>`);}
 let body='';
 if(mode==='balance'){
  let path=`M ${left} ${zero}`;events.forEach((e,i)=>{path+=` H ${x(i)} V ${y(e.balance)}`;});path+=` H ${w-right}`;
  const area=path+` L ${w-right} ${zero} L ${left} ${zero} Z`;
  body=`<defs><clipPath id="positive-clip"><rect x="${left}" y="0" width="${w-left}" height="${zero}"/></clipPath><clipPath id="negative-clip"><rect x="${left}" y="${zero}" width="${w-left}" height="${h-zero}"/></clipPath></defs><path d="${area}" class="balance-fill"/><path d="${path}" class="balance-line" clip-path="url(#positive-clip)"/><path d="${path}" class="balance-line negative-line" clip-path="url(#negative-clip)"/>`;
 }else{
  const bar=Math.min(23,(w-left-right)/Math.max(n,1)/3);
  events.forEach((e,i)=>{body+=`<rect class="inflow-bar" x="${x(i)-bar-2}" y="${y(e.inflow)}" width="${bar}" height="${Math.max(0,zero-y(e.inflow))}" rx="2"/><rect class="upstream-bar" x="${x(i)+2}" y="${zero}" width="${bar}" height="${Math.max(0,y(-e.upstream)-zero)}" rx="2"/><rect class="rebate-bar" x="${x(i)+2}" y="${y(-e.upstream)}" width="${bar}" height="${Math.max(0,y(-e.upstream-e.rebate)-y(-e.upstream))}" rx="2"/>`;});
 }
 const targets=events.map((e,i)=>`<g role="button" tabindex="0" class="chart-target ${selected===i?'selected':''}" data-event="${i}" aria-label="节点 ${e.node}，${safe(e.label)}，净现金流 ${amount(e.net)} 万元，余额 ${amount(e.balance)} 万元"><title>${safe(e.label)}：余额 ${amount(e.balance)} 万元</title><rect class="event-hit" x="${x(i)-Math.min(26,(w-left-right)/Math.max(n,1)/2)}" y="${top}" width="${Math.min(52,(w-left-right)/Math.max(n,1))}" height="${plotH}" rx="5"/>${mode==='balance'?`<circle class="chart-dot ${e.balance<0?'deficit-dot':''}" cx="${x(i)}" cy="${y(e.balance)}" r="${selected===i?6:4}"/>`:''}<text class="axis-text" x="${x(i)}" y="${h-17}" text-anchor="middle">N${e.node}·${i+1}</text></g>`).join('');
 const deficit=low<0?`<rect class="deficit-area" x="${left}" y="${zero}" width="${w-left-right}" height="${Math.max(0,h-bottom-zero)}"/>`:'';
 return `<div class="chart-scroll"><svg style="min-width:${w}px" viewBox="0 0 ${w} ${h}" role="group" aria-label="${mode==='balance'?'累计现金余额':'各节点现金收支'}，单位万元">${deficit}${grid.join('')}<line class="zero-line" x1="${left}" y1="${zero}" x2="${w-right}" y2="${zero}"/>${body}${targets}</svg></div>`;
}
const api={render};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradeCharts=api;
})(typeof globalThis==='undefined'?this:globalThis);
