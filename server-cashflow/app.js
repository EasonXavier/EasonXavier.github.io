'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:6});
const pct=n=>n===null?'—':n.toLocaleString('zh-CN',{maximumFractionDigits:2})+'%';
const signed=n=>(n>0?'+':'')+fmt(n);
const color=n=>n<0?'negative':n>0?'positive':'';
let nextId=2,nextBrokerId=2,result=null;
let intermediaries=[{id:1,name:'居间 A',rate:85}];
let clients=[{id:1,name:'下游 A',p:1500,q:128,x:29.4,deposit:2,tail:4,guarantee:62272}];
const upstreamKeys=['p','q','x','y','upDeposit','upTail','gNode'];
function state(){return {...Object.fromEntries(upstreamKeys.map(k=>[k,$(k).value===''?NaN:Number($(k).value)])),allocation:$('allocation').value,intermediaries:intermediaries.map(b=>({...b})),clients:clients.map(c=>({...c}))};}
function adjustButtons(scope,id,step,label){return `<span class="adjust-buttons"><button type="button" data-adjust="${scope}" data-id="${id}" data-delta="-${step}" aria-label="${esc(label)}减少 ${step} 万元">−${step}</button><button type="button" data-adjust="${scope}" data-id="${id}" data-delta="${step}" aria-label="${esc(label)}增加 ${step} 万元">+${step}</button></span>`;}
function parameterButtons(scope,id,key,label){const quantity=key==='q';return `<span class="adjust-buttons">${(quantity?[.5,2]:[-.1,.1]).map(n=>`<button type="button" data-adjust="${scope}" data-id="${id}" data-adjust-key="${key}" ${quantity?`data-factor="${n}"`:`data-delta="${n}"`} aria-label="${esc(label)}${quantity?(n===2?'乘以 2':'除以 2'):(n>0?'增加 0.1 个百分点':'减少 0.1 个百分点')}"${quantity&&n===.5?' title="数量须为偶数，除以 2 后至少为 1 台"':''}>${quantity?(n===2?'×2':'÷2'):(n>0?'+0.1':'−0.1')}</button>`).join('')}</span>`;}
function adjustment(button){
 const scope=button.dataset.adjust,id=Number(button.dataset.id),key=button.dataset.adjustKey||(scope==='broker'?'rate':'p');
 const item=scope==='client'?clients.find(c=>c.id===id):scope==='broker'?intermediaries.find(b=>b.id===id):null;
 const raw=scope==='procurement'?$(key).value:item?.[key],current=raw===''?NaN:Number(raw);
 let next=button.dataset.factor?current*Number(button.dataset.factor):current+Number(button.dataset.delta);
 next=key==='x'?Math.round(next*10)/10:TradeModel.money(next);
 const min=key==='p'?.000001:key==='q'?1:0,max=key==='x'?100:key==='q'?1000000:1e9;
 const valid=Number.isFinite(current)&&Number.isFinite(next)&&next>=min&&next<=max&&(key!=='q'||(Number.isInteger(current)&&Number.isInteger(next)));
 return {scope,key,item,next,valid,id};
}
function field(c,key,label,unit='',min=0,max=null,step='any'){return `<label>${esc(label)}<span class="${['p','q','x'].includes(key)?'price-control':''}"><span class="input-unit"><input aria-label="${esc(c.name+' '+label)}" data-client="${c.id}" data-key="${key}" type="number" min="${min}" ${max===null?'':`max="${max}"`} step="${step}" value="${Number.isFinite(c[key])?c[key]:''}">${unit?`<span>${unit}</span>`:''}</span>${key==='p'?adjustButtons('client',c.id,5,c.name+' 销售单价'):['q','x'].includes(key)?parameterButtons('client',c.id,key,c.name+' '+label):''}</span></label>`;}
function renderBrokers(){
 $('intermediaries').innerHTML=intermediaries.map((b,i)=>`<article class="broker"><div class="client-head"><input class="client-name" aria-label="居间方 ${i+1} 名称" data-broker="${b.id}" data-key="name" maxlength="40" value="${esc(b.name)}"><button class="remove" data-remove-broker="${b.id}" aria-label="删除${esc(b.name)}">移除</button></div><label>每台返点<span class="price-control"><span class="input-unit"><input type="number" aria-label="${esc(b.name)} 每台返点" data-broker="${b.id}" data-key="rate" value="${Number.isFinite(b.rate)?b.rate:''}" min="0" max="1000000000" step="any"><span>万元/台</span></span>${adjustButtons('broker',b.id,1,b.name+' 每台返点')}</span></label><div class="summary-lines" id="broker-summary-${b.id}"></div></article>`).join('')||'<p class="hint">未设置居间方，返点为 0。</p>';
 $('add-broker').disabled=intermediaries.length>=20;
}
function syncSteppers(){document.querySelectorAll('[data-adjust]').forEach(button=>{button.disabled=!adjustment(button).valid;});}
function renderClients(){
 $('clients').innerHTML=clients.length?clients.map((c,i)=>`<article class="client" data-id="${c.id}"><div class="client-head"><div class="client-identity"><span class="client-badge">${String(i+1).padStart(2,'0')}</span><input class="client-name" aria-label="客户 ${i+1} 名称" data-client="${c.id}" data-key="name" maxlength="40" value="${esc(c.name)}"></div><button class="remove" data-remove="${c.id}" aria-label="删除${esc(c.name)}">移除</button></div><div class="client-fields">${field(c,'p','销售单价 Pd','',0.000001)}${field(c,'q','数量 Qd','台',1,1000000,1)}${field(c,'x','预付款 xd','%',0,100,.1)}${field(c,'deposit','收预付款节点','',1,999,1)}${field(c,'tail','收尾款节点','',1,999,1)}</div><div class="client-meta" id="client-meta-${c.id}"></div></article>`).join(''):'<div class="empty">暂无下游客户，点击“添加客户”开始分配销售数量。</div>';
 renderGuaranteeInputs();
}
function renderGuaranteeInputs(){
 $('guarantee-inputs').innerHTML=$('allocation').value==='manual'?clients.map(c=>field(c,'guarantee',c.name+' · 分配额度','万元')).join(''):'';
}
function metric(label,value,note,featured=false,bad=false){return `<div class="metric ${featured?'featured':''} ${bad?'bad':''}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></div>`;}
function line(a,b){return `<div><span>${a}</span><strong>${b}</strong></div>`;}
function clearResults(errors){
 $('metrics').innerHTML=metric('方案状态','待修正输入','修正后自动重新计算',true,true)+metric('已售合同利润','—','万元')+metric('期末现金结余','—','万元')+metric('最大垫资缺口','—','不允许垫资');
 $('alerts').innerHTML=`<div class="alert danger" role="alert"><ul>${errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`;
 ['event-detail','chart','cash-summary','reconcile','upstream-summary','guarantee-summary','quantity-summary','broker-total'].forEach(id=>$(id).innerHTML='');document.querySelectorAll('.client-meta, .broker .summary-lines').forEach(e=>e.textContent='');$('timeline').querySelector('tbody').innerHTML='';$('profit').querySelector('tbody').innerHTML='';$('guarantee-table').querySelector('tbody').innerHTML='';result=null;setRiskTone(false,true);
}
let chartMode='balance',selectedEvent=-1,pendingImport=null;
function drawChart(r){
 if(selectedEvent>=r.events.length)selectedEvent=-1;
 $('chart').innerHTML=TradeCharts.render(r,chartMode,selectedEvent);
 $('chart-legend').innerHTML=chartMode==='balance'?'<span><i class="legend-dot balance"></i>余额</span><span><i class="legend-dot deficit"></i>资金缺口</span>':'<span><i class="legend-dot balance"></i>收款</span><span><i class="legend-dot upstream"></i>付上游</span><span><i class="legend-dot rebate"></i>返点</span>';
 document.querySelectorAll('[data-chart-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chartMode===chartMode)));
 showEventDetail(r);
}
function showEventDetail(r){
 let e=r.events[selectedEvent];
 $('event-detail').innerHTML=e?`<div><strong>节点 ${e.node} · ${esc(e.label)}</strong><span>第 ${selectedEvent+1} 笔事项</span></div><dl><div><dt>收款</dt><dd>${fmt(e.inflow)}</dd></div><div><dt>付上游</dt><dd>${fmt(e.upstream)}</dd></div><div><dt>返点</dt><dd>${fmt(e.rebate)}</dd></div><div><dt>净现金流</dt><dd class="${color(e.net)}">${signed(e.net)}</dd></div><div><dt>累计余额</dt><dd class="${color(e.balance)}">${fmt(e.balance)}</dd></div></dl>`:'<p>点击图中节点查看收支明细。相同节点按表内顺序结算，虚线表示零余额。</p>';
}

function setRiskTone(deficit,invalid=false){$('app-shell').classList.toggle('funding-risk',deficit);$('cash-visual').classList.toggle('has-deficit',deficit);$('cash-visual').classList.toggle('has-invalid',invalid);}
function render(){
 syncSteppers();
 const s=state(),r=TradeModel.calculate(s);result=r;
 if(r.errors.length){clearResults(r.errors);return;}
 setRiskTone(r.gap>0,r.sequenceErrors.length>0);
 let status=r.gap>0?'需要垫资':r.sequenceErrors.length?'顺序待调整':'满足零垫资';
 $('metrics').innerHTML=metric('方案状态',status,r.gap>0?'方案不可执行 · 请调整收付款条件':r.sequenceErrors.length?'先保函，后付款':'按当前节点顺序测算',true,!r.feasible)+metric('已售合同交易利润',`${fmt(r.profit)}<small>万元</small>`,`利润率 ${pct(r.margin)} · 已扣返点`)+metric('期末现金结余',`${fmt(r.finalCash)}<small>万元</small>`,'全部收付款结束 · 期初为 0')+metric('最大垫资缺口',`${fmt(r.gap)}<small>万元</small>`,r.gap>0?`首次缺口：节点 ${r.firstGap.node}`:'全程现金余额不低于 0');
 const alerts=[];
 if(r.gap>0)alerts.push(`<div class="alert danger"><span><strong>不满足零垫资：</strong>节点 ${r.firstGap.node}「${esc(r.firstGap.label)}」后首次缺口 ${fmt(-r.firstGap.balance)} 万元，最大缺口 ${fmt(r.gap)} 万元。</span></div>`);
 if(r.sequenceErrors.length)alerts.push(`<div class="alert danger">${esc(r.sequenceErrors.join('；'))}</div>`);
 if(r.warnings.length)alerts.push(`<div class="alert"><ul>${r.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`);
 $('alerts').innerHTML=alerts.join('');
 $('upstream-summary').innerHTML=line('采购总额',fmt(r.cost))+line('应付预付款',fmt(r.upfront))+line('应付尾款',fmt(TradeModel.money(r.cost-r.upfront)));
 $('guarantee-summary').innerHTML=line('保函总额度',fmt(r.guarantee))+line('已分配额度',fmt(r.allocated))+line('保留额度',fmt(r.unallocated));
 $('quantity-summary').textContent=`已分配 ${r.soldQ} / ${s.q} 台 · ${clients.length} 位客户`;
 r.clients.forEach(c=>{$('client-meta-'+c.id).innerHTML=`<span>销售额 <strong>${fmt(c.sales)}</strong></span><span>预付款 <strong>${fmt(c.depositCash)}</strong></span><span>首期返点 <strong>${fmt(c.depositRebate)}</strong></span><span class="guarantee-result">分配保函 <strong>${fmt(c.g)} 万元</strong></span><span class="guarantee-result" title="分配保函金额 ÷ 本客户销售合同金额">实际保函比例 <strong>${pct(c.guaranteeSalesRate)}</strong></span>`;});
 $('cash-summary').innerHTML=`<span>预付款阶段合计净流入<strong class="${color(r.depositNet)}">${signed(r.depositNet)}</strong></span><span>最低累计余额<strong class="${color(r.minBalance)}">${fmt(r.minBalance)}</strong></span><span>单位：万元</span>`;
 drawChart(r);
 $('timeline').querySelector('tbody').innerHTML=r.events.map(e=>`<tr class="${e.balance<0?'zero-row':''}"><td><strong>${esc(e.label)}</strong><small>节点 ${e.node}${e.isGuarantee?' · 不发生现金收付':''}</small></td><td class="${color(e.inflow)}">${fmt(e.inflow)}</td><td>${fmt(e.upstream)}</td><td>${fmt(e.rebate)}</td><td class="${color(e.net)}">${signed(e.net)}</td><td class="${color(e.balance)}">${fmt(e.balance)}</td><td class="${color(e.realized)}">${fmt(e.realized)}</td></tr>`).join('');
 $('profit').querySelector('tbody').innerHTML=r.clients.map(c=>`<tr><td>${esc(c.name)}</td><td>${fmt(c.sales)}</td><td>${fmt(c.purchase)}</td><td>${fmt(c.b)}</td><td class="${color(c.profit)}">${fmt(c.profit)}</td><td>${pct(c.margin)}</td></tr>`).join('')+`<tr><td><strong>合计</strong></td><td>${fmt(r.sales)}</td><td>${fmt(TradeModel.money(r.cost-r.inventory))}</td><td>${fmt(r.rebates)}</td><td class="${color(r.profit)}">${fmt(r.profit)}</td><td>${pct(r.margin)}</td></tr>`;
 $('guarantee-table').querySelector('tbody').innerHTML=r.clients.map(c=>`<tr><td>${esc(c.name)}</td><td>${fmt(c.sales)}</td><td>${fmt(c.g)}</td><td>${pct(c.guaranteeSalesRate)}</td><td>${fmt(c.depositCash)}</td><td class="${c.coverage!==null&&c.coverage<100?'negative':''}">${pct(c.coverage)}</td></tr>`).join('')+`<tr><td>已分配合计</td><td>${fmt(r.sales)}</td><td>${fmt(r.allocated)}</td><td>${pct(r.sales?r.allocated/r.sales*100:null)}</td><td colspan="2">保留额度 ${fmt(r.unallocated)} 万元</td></tr>`;
 r.intermediaries.forEach(b=>{$('broker-summary-'+b.id).innerHTML=line('计费台数',r.soldQ+' 台')+line('返点总额',fmt(b.total))+line('随预付款支付',fmt(b.deposit))+line('随尾款支付',fmt(b.tail));});
 $('broker-total').textContent=`共 ${r.intermediaries.length} 位居间方 · 已售 ${r.soldQ} 台 · 返点合计 ${fmt(r.rebates)} 万元`;
 $('reconcile').innerHTML=`<span>期末现金 <strong>${fmt(r.finalCash)}</strong></span><span>＝</span><span>已售合同利润 <strong>${fmt(r.profit)}</strong></span><span>−</span><span>未售库存成本 <strong>${fmt(r.inventory)}</strong></span>`;
}
function applyPreset(value){if(value==='custom')return;$('gNode').value=1;$('upDeposit').value=value==='receive'?3:2;$('upTail').value=value==='receive'?5:4;clients.forEach(c=>{c.deposit=value==='receive'?2:3;c.tail=value==='receive'?4:5;});renderClients();render();}
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.broker){const b=intermediaries.find(b=>b.id===Number(el.dataset.broker));b[el.dataset.key]=el.dataset.key==='name'?el.value:el.value===''?NaN:Number(el.value);render();}else if(el.dataset.client){const c=clients.find(c=>c.id===Number(el.dataset.client));c[el.dataset.key]=el.dataset.key==='name'?el.value:el.value===''?NaN:Number(el.value);if(el.dataset.key==='name')renderGuaranteeInputs();if(['deposit','tail'].includes(el.dataset.key))$('preset').value='custom';render();}else if(upstreamKeys.includes(el.id)){if(['upDeposit','upTail','gNode'].includes(el.id))$('preset').value='custom';render();}});
document.addEventListener('change',e=>{if(e.target.matches('#app-shell input')){render();}});
document.addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');if(remove){clients=clients.filter(c=>c.id!==Number(remove.dataset.remove));renderClients();render();}});
$('add-client').addEventListener('click',()=>{const q=Math.max(1,Number($('q').value)-clients.reduce((s,c)=>s+(Number.isFinite(c.q)?c.q:0),0));clients.push({id:nextId++,name:'下游 '+String.fromCharCode(65+clients.length%26),p:Number($('p').value)||100,q,x:35,deposit:2,tail:4,guarantee:0});$('preset').value='custom';renderClients();render();});
$('allocation').addEventListener('change',()=>{if($('allocation').value==='manual'&&result&&!result.errors.length){result.clients.forEach(rc=>{clients.find(c=>c.id===rc.id).guarantee=rc.g;});}renderClients();render();});
$('preset').addEventListener('change',e=>applyPreset(e.target.value));
renderClients();renderBrokers();render();

function status(message,isError=false){$('data-status').textContent=message;$('data-status').classList.toggle('negative',isError);}
function resetImport(){pendingImport=null;$('apply-json').disabled=true;$('import-preview').textContent='';$('import-error').textContent='';}
function checkImport(){resetImport();try{const parsed=TradeData.parse($('json-text').value);pendingImport=parsed;$('apply-json').disabled=false;const r=parsed.result;$('import-preview').textContent=`${r.clients.length} 位客户 · 采购 ${fmt(r.cost)} 万元 · 销售 ${fmt(r.sales)} 万元 · 利润 ${fmt(r.profit)} 万元`+(r.feasible?' · 满足零垫资':r.gap>0?` · 最大垫资缺口 ${fmt(r.gap)} 万元`:' · 保函与付款顺序待调整');}catch(e){$('import-error').textContent=e.message;}}
$('open-import').addEventListener('click',()=>{resetImport();$('json-text').value='';$('json-file').value='';$('import-dialog').showModal();});
$('close-import').addEventListener('click',()=>$('import-dialog').close());
$('json-text').addEventListener('input',resetImport);
$('json-file').addEventListener('change',async e=>{resetImport();const file=e.target.files[0];if(!file)return;if(file.size>TradeData.LIMIT){$('import-error').textContent='JSON 文件不能超过 512 KB';return;}try{$('json-text').value=await file.text();checkImport();}catch{$('import-error').textContent='无法读取文件';}});
$('validate-json').addEventListener('click',checkImport);
$('apply-json').addEventListener('click',()=>{if(!pendingImport)return;let verified;try{verified=TradeData.parse($('json-text').value);}catch(e){resetImport();$('import-error').textContent=e.message;return;}const s=verified.state;upstreamKeys.forEach(k=>$(k).value=s[k]);$('allocation').value=s.allocation;clients=s.clients;intermediaries=s.intermediaries;nextId=clients.length+1;nextBrokerId=intermediaries.length+1;selectedEvent=-1;$('preset').value='custom';$('import-dialog').close();pendingImport=null;renderClients();renderBrokers();render();status('已导入 '+clients.length+' 位客户的交易数据');});
$('export-json').addEventListener('click',()=>{try{const data=TradeData.serialize(state()),blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='server-trade.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status('交易数据已导出');}catch(e){status('无法导出：'+e.message,true);}});
document.addEventListener('click',e=>{const mode=e.target.closest('[data-chart-mode]');if(mode){chartMode=mode.dataset.chartMode;if(result&&!result.errors.length)drawChart(result);}const point=e.target.closest('[data-event]');if(point&&result&&!result.errors.length){selectedEvent=Number(point.dataset.event);showEventDetail(result);$('chart').querySelectorAll('.chart-target').forEach(g=>g.classList.toggle('selected',Number(g.dataset.event)===selectedEvent));}});
$('chart').addEventListener('keydown',e=>{const point=e.target.closest('[data-event]');if(point&&(e.key==='Enter'||e.key===' ')){e.preventDefault();point.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('trade-locked',()=>{resetImport();$('json-text').value='';$('json-file').value='';});

$('add-broker').addEventListener('click',()=>{if(intermediaries.length>=20)return;intermediaries.push({id:nextBrokerId++,name:'居间 '+String.fromCharCode(65+intermediaries.length),rate:0});renderBrokers();render();});
document.addEventListener('click',e=>{
 const remove=e.target.closest('[data-remove-broker]');if(remove){intermediaries=intermediaries.filter(b=>b.id!==Number(remove.dataset.removeBroker));renderBrokers();render();}
 const button=e.target.closest('[data-adjust]');if(!button)return;
 const {scope,key,item,next,valid,id}=adjustment(button);if(!valid)return;
 if(scope==='procurement')$(key).value=next;
 else {item[key]=next;const input=document.querySelector(scope==='broker'?`[data-broker="${id}"][data-key="${key}"]`:`[data-client="${id}"][data-key="${key}"]`);if(input)input.value=next;}
 render();
});
