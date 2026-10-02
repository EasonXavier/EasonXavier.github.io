'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:6});
const pct=n=>n===null?'—':n.toLocaleString('zh-CN',{maximumFractionDigits:2})+'%';
const signed=n=>(n>0?'+':'')+fmt(n);
const color=n=>n<0?'negative':n>0?'positive':'';
let nextId=3,lastDialogKey='',result=null,warningTimer=null;
let clients=[{id:1,name:'下游 A',p:110,q:6,x:35,b:6,deposit:2,tail:4,guarantee:192},{id:2,name:'下游 B',p:112,q:4,x:35,b:4,deposit:2,tail:4,guarantee:128}];
const upstreamKeys=['p','q','x','y','upDeposit','upTail','gNode'];
function state(){return {...Object.fromEntries(upstreamKeys.map(k=>[k,$(k).value===''?NaN:Number($(k).value)])),allocation:$('allocation').value,clients:clients.map(c=>({...c}))};}
function field(c,key,label,unit='',min=0,max=null,step='any'){return `<label>${label}<span class="input-unit"><input aria-label="${esc(c.name+' '+label)}" data-client="${c.id}" data-key="${key}" type="number" min="${min}" ${max===null?'':`max="${max}"`} step="${step}" value="${Number.isFinite(c[key])?c[key]:''}">${unit?`<span>${unit}</span>`:''}</span></label>`;}
function renderClients(){
 $('clients').innerHTML=clients.length?clients.map((c,i)=>`<article class="client" data-id="${c.id}"><div class="client-head"><div class="client-identity"><span class="client-badge">${String(i+1).padStart(2,'0')}</span><input class="client-name" aria-label="客户 ${i+1} 名称" data-client="${c.id}" data-key="name" maxlength="40" value="${esc(c.name)}"></div><button class="remove" data-remove="${c.id}" aria-label="删除${esc(c.name)}">移除</button></div><div class="client-fields">${field(c,'p','销售单价 Pd','',0.000001)}${field(c,'q','数量 Qd','台',1,1000000,1)}${field(c,'x','预付款 xd','%',0,100)}${field(c,'b','返点总额 Bd')}${field(c,'deposit','收预付款节点','',1,999,1)}${field(c,'tail','收尾款节点','',1,999,1)}</div>${$('allocation').value==='manual'?`<div class="manual-g">${field(c,'guarantee','分配保函额度','')}</div>`:''}<div class="client-meta" id="client-meta-${c.id}"></div></article>`).join(''):'<div class="empty">暂无下游客户，点击“添加客户”开始分配销售数量。</div>';
}
function metric(label,value,note,featured=false,bad=false){return `<div class="metric ${featured?'featured':''} ${bad?'bad':''}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>`;}
function line(a,b){return `<div><span>${a}</span><strong>${b}</strong></div>`;}
function clearResults(errors){
 $('metrics').innerHTML=metric('方案状态','待修正输入','修正后自动重新计算',true,true)+metric('已售合同利润','—','万元')+metric('期末现金结余','—','万元')+metric('最大垫资缺口','—','不允许垫资');
 $('alerts').innerHTML=`<div class="alert danger" role="alert"><ul>${errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`;
 ['chart','cash-summary','reconcile','upstream-summary','guarantee-summary','quantity-summary'].forEach(id=>$(id).innerHTML='');document.querySelectorAll('.client-meta').forEach(e=>e.textContent='');$('timeline').querySelector('tbody').innerHTML='';$('profit').querySelector('tbody').innerHTML='';result=null;if($('funding-dialog').open)$('funding-dialog').close();lastDialogKey='';
}
function drawChart(r){
 const values=[0,...r.events.map(e=>e.balance)],width=960,height=210,padL=75,padR=20,padT=20,padB=33;
 let lo=Math.min(...values),hi=Math.max(...values);if(lo===hi){lo=-1;hi=1;}else{const span=hi-lo;hi+=span*.1;lo-=span*.1;}
 const x=i=>padL+(width-padL-padR)*i/Math.max(1,values.length-1),y=v=>padT+(hi-v)/(hi-lo)*(height-padT-padB);
 const points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' '),zero=y(0),path=`M ${x(0)} ${zero} L ${points.replace(/ /g,' L ')} L ${x(values.length-1)} ${zero} Z`;
 let grid='';for(let i=0;i<4;i++){let v=hi-(hi-lo)*i/3,yy=y(v);grid+=`<line x1="${padL}" y1="${yy}" x2="${width-padR}" y2="${yy}" stroke="#e9eff3"/><text x="${padL-12}" y="${yy+4}" text-anchor="end" fill="#8b9ba6" font-size="12">${Math.abs(v)>=10000?(v/10000).toFixed(1)+'万':v.toLocaleString('zh-CN',{maximumFractionDigits:0})}</text>`;}
 const ticks=values.map((v,i)=>{let e=r.events[i-1],label=i===0?'起点':`N${e.node}`,show=values.length<=12||i===0||i===values.length-1||i%Math.ceil(values.length/9)===0;return `<circle cx="${x(i)}" cy="${y(v)}" r="${v<0?4:3}" fill="${v<0?'#c24b61':'#20866e'}"><title>${esc(e?e.label:'起点')}：${fmt(v)} 万元</title></circle>${show?`<text x="${x(i)}" y="${height-5}" text-anchor="middle" fill="#8b9ba6" font-size="12">${label}</text>`:''}`;}).join('');
 $('chart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="累计现金余额走势，最低 ${fmt(r.minBalance)} 万元，期末 ${fmt(r.finalCash)} 万元"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#238b73" stop-opacity=".13"/><stop offset="100%" stop-color="#238b73" stop-opacity=".015"/></linearGradient></defs>${grid}<line x1="${padL}" y1="${zero}" x2="${width-padR}" y2="${zero}" stroke="#a7b8c3" stroke-dasharray="4 4"/><path d="${path}" fill="url(#fill)"/><polyline points="${points}" fill="none" stroke="#238b73" stroke-width="2.5" stroke-linejoin="round"/>${ticks}</svg>`;
}
function render(){
 const s=state(),r=TradeModel.calculate(s);result=r;
 if(r.errors.length){clearResults(r.errors);return;}
 let status=r.gap>0?'需要垫资':r.sequenceErrors.length?'顺序待调整':'满足零垫资';
 $('metrics').innerHTML=metric('方案状态',status,r.gap>0?'方案不可执行 · 请调整收付款条件':r.sequenceErrors.length?'先保函，后付款':'按当前节点顺序测算',true,!r.feasible)+metric('已售合同交易利润',`${fmt(r.profit)}<small>万元</small>`,`利润率 ${pct(r.margin)} · 已扣返点`)+metric('期末现金结余',`${fmt(r.finalCash)}<small>万元</small>`,'全部收付款结束 · 期初为 0')+metric('最大垫资缺口',`${fmt(r.gap)}<small>万元</small>`,r.gap>0?`首次缺口：节点 ${r.firstGap.node}`:'全程现金余额不低于 0');
 const alerts=[];
 if(r.gap>0)alerts.push(`<div class="alert danger" role="alert"><span><strong>不允许垫资：</strong>节点 ${r.firstGap.node}「${esc(r.firstGap.label)}」后首次缺口 ${fmt(-r.firstGap.balance)} 万元，最大缺口 ${fmt(r.gap)} 万元。</span><button id="show-gap">查看提示</button></div>`);
 if(r.sequenceErrors.length)alerts.push(`<div class="alert danger" role="alert">${esc(r.sequenceErrors.join('；'))}</div>`);
 if(r.warnings.length)alerts.push(`<div class="alert"><ul>${r.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`);
 $('alerts').innerHTML=alerts.join('');
 $('upstream-summary').innerHTML=line('采购总额',fmt(r.cost))+line('应付预付款',fmt(r.upfront))+line('应付尾款',fmt(TradeModel.money(r.cost-r.upfront)));
 $('guarantee-summary').innerHTML=line('保函总额度',fmt(r.guarantee))+line('已分配额度',fmt(r.allocated))+line('保留额度',fmt(r.unallocated));
 $('quantity-summary').textContent=`已分配 ${r.soldQ} / ${s.q} 台 · ${clients.length} 位客户`;
 r.clients.forEach(c=>{$('client-meta-'+c.id).innerHTML=`<span>销售额 <strong>${fmt(c.sales)}</strong></span><span>预付款 <strong>${fmt(c.depositCash)}</strong></span><span>首期返点 <strong>${fmt(c.depositRebate)}</strong></span><span>保函 <strong>${fmt(c.g)}</strong></span>`;});
 $('cash-summary').innerHTML=`<span>预付款阶段合计净流入<strong class="${color(r.depositNet)}">${signed(r.depositNet)}</strong></span><span>最低累计余额<strong class="${color(r.minBalance)}">${fmt(r.minBalance)}</strong></span><span>单位：万元</span>`;
 drawChart(r);
 $('timeline').querySelector('tbody').innerHTML=r.events.map(e=>`<tr class="${e.balance<0?'zero-row':''}"><td><strong>${esc(e.label)}</strong><small>节点 ${e.node}${e.isGuarantee?' · 不发生现金收付':''}</small></td><td class="${color(e.inflow)}">${fmt(e.inflow)}</td><td>${fmt(e.upstream)}</td><td>${fmt(e.rebate)}</td><td class="${color(e.net)}">${signed(e.net)}</td><td class="${color(e.balance)}">${fmt(e.balance)}</td><td class="${color(e.realized)}">${fmt(e.realized)}</td></tr>`).join('');
 $('profit').querySelector('tbody').innerHTML=r.clients.map(c=>`<tr><td>${esc(c.name)}</td><td>${fmt(c.sales)}</td><td>${fmt(c.purchase)}</td><td>${fmt(c.b)}</td><td class="${color(c.profit)}">${fmt(c.profit)}</td><td>${pct(c.margin)}</td><td>${fmt(c.g)}</td><td class="${c.coverage!==null&&c.coverage<100?'negative':''}">${pct(c.coverage)}</td></tr>`).join('')+`<tr><td><strong>合计</strong></td><td>${fmt(r.sales)}</td><td>${fmt(TradeModel.money(r.cost-r.inventory))}</td><td>${fmt(r.rebates)}</td><td class="${color(r.profit)}">${fmt(r.profit)}</td><td>${pct(r.margin)}</td><td>${fmt(r.allocated)}</td><td>—</td></tr>`;
 $('reconcile').innerHTML=`<span>期末现金 <strong>${fmt(r.finalCash)}</strong></span><span>＝</span><span>已售合同利润 <strong>${fmt(r.profit)}</strong></span><span>−</span><span>未售库存成本 <strong>${fmt(r.inventory)}</strong></span>`;
 if(r.feasible){lastDialogKey='';if($('funding-dialog').open)$('funding-dialog').close();}
}
function showWarning(force=false){
 const r=result;if(!r||r.errors.length||r.feasible)return;
 const key=JSON.stringify([r.gap,r.firstGap?.node,r.firstGap?.label,r.sequenceErrors]);if(!force&&key===lastDialogKey)return;lastDialogKey=key;
 $('dialog-title').textContent=r.gap>0?'不满足零垫资条件':'先保函，后付款';
 $('dialog-description').textContent=r.gap>0?`节点 ${r.firstGap.node}「${r.firstGap.label}」后现金首次为负，缺口 ${fmt(-r.firstGap.balance)} 万元。${r.sequenceErrors.join('；')}`:r.sequenceErrors.join('；');
 $('dialog-amount').textContent=r.gap>0?`最大缺口 ${fmt(r.gap)} 万元`:'请将保函交付安排在付款之前';
 if(!$('funding-dialog').open)$('funding-dialog').showModal();
}
function applyPreset(value){if(value==='custom')return;$('gNode').value=1;$('upDeposit').value=value==='receive'?3:2;$('upTail').value=value==='receive'?5:4;clients.forEach(c=>{c.deposit=value==='receive'?2:3;c.tail=value==='receive'?4:5;});renderClients();render();showWarning();}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.client){const c=clients.find(c=>c.id===Number(el.dataset.client));c[el.dataset.key]=el.dataset.key==='name'?el.value:el.value===''?NaN:Number(el.value);if(['deposit','tail'].includes(el.dataset.key))$('preset').value='custom';render();}else if(upstreamKeys.includes(el.id)){if(['upDeposit','upTail','gNode'].includes(el.id))$('preset').value='custom';render();}});
document.addEventListener('input',e=>{if(e.target.matches('input')){clearTimeout(warningTimer);warningTimer=setTimeout(()=>showWarning(),700);}});
document.addEventListener('change',e=>{if(e.target.matches('input')){clearTimeout(warningTimer);render();showWarning();}});
document.addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(remove){clients=clients.filter(c=>c.id!==Number(remove.dataset.remove));renderClients();render();showWarning();}if(e.target.id==='show-gap')showWarning(true);});
$('add-client').addEventListener('click',()=>{const q=Math.max(1,Number($('q').value)-clients.reduce((s,c)=>s+(Number.isFinite(c.q)?c.q:0),0));clients.push({id:nextId++,name:'下游 '+String.fromCharCode(65+clients.length%26),p:Number($('p').value)||100,q,x:35,b:0,deposit:2,tail:4,guarantee:0});$('preset').value='custom';renderClients();render();showWarning();});
$('allocation').addEventListener('change',()=>{if($('allocation').value==='manual'&&result&&!result.errors.length){result.clients.forEach(rc=>{clients.find(c=>c.id===rc.id).guarantee=rc.g;});}renderClients();render();showWarning();});
$('preset').addEventListener('change',e=>applyPreset(e.target.value));$('close-dialog').addEventListener('click',()=>$('funding-dialog').close());
renderClients();render();
