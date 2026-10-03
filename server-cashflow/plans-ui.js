'use strict';
let planStore=null,activePlanId=null,planBaseline='',planTimer=null,loadingPlan=false;
function planMessage(text,error=false){$('plan-status').textContent=text;$('plan-status').classList.toggle('negative',error);}
function planFingerprint(){return JSON.stringify(state());}
function refreshPlanList(){const db=planStore.read();$('plan-list').innerHTML=db.items.map(p=>`<button type="button" class="plan-chip" data-plan-id="${esc(p.id)}" aria-pressed="${p.id===activePlanId}"><span>${esc(p.data.tradeName)}</span><small>${p.data.procurement.quantity} 台 · ${p.data.customers.length} 位客户</small></button>`).join('');$('save-plan').textContent=activePlanId?'更新暂存':'暂存当前';}
function savePlan(copy=false){
 clearTimeout(planTimer);if(!planStore){planMessage('浏览器暂存不可用，请导出 JSON 保存',true);return false;}
 try{const s=state();if(copy&&activePlanId){const names=planStore.read().items.map(p=>p.data.tradeName);let base=s.tradeName.slice(0,50),name=base,i=2;while(names.includes(name))name=base+' ('+i+++')';s.tradeName=name;}
 const p=planStore.save(s,copy?null:activePlanId);activePlanId=p.id;$('trade-name').value=s.tradeName;planBaseline=planFingerprint();refreshPlanList();planMessage('已暂存「'+p.data.tradeName+'」· 修改会自动保存');return true;
 }catch(e){planMessage(e.message,true);return false;}
}
function preparePlanSwitch(){clearTimeout(planTimer);return planFingerprint()===planBaseline||savePlan();}
function planChanged(){if(loadingPlan)return;clearTimeout(planTimer);if(planFingerprint()===planBaseline)return;planMessage(activePlanId?'正在保存修改…':'尚未暂存 · 填写名称后点“暂存当前”');if(activePlanId)planTimer=setTimeout(()=>savePlan(),450);}
$('save-plan').addEventListener('click',()=>savePlan());
$('copy-plan').addEventListener('click',()=>savePlan(true));
$('trade-name').addEventListener('input',planChanged);
$('plan-list').addEventListener('click',e=>{const b=e.target.closest('[data-plan-id]');if(!b||b.dataset.planId===activePlanId)return;if(!preparePlanSwitch())return;try{const s=planStore.select(b.dataset.planId);loadingPlan=true;activePlanId=b.dataset.planId;applyState(s);loadingPlan=false;planBaseline=planFingerprint();refreshPlanList();planMessage('已切换到「'+s.tradeName+'」');}catch(error){loadingPlan=false;planMessage(error.message,true);}});
document.addEventListener('trade-changed',planChanged);
document.addEventListener('trade-importing',()=>{clearTimeout(planTimer);activePlanId=null;planBaseline='';try{if(planStore)refreshPlanList();}catch(e){planMessage(e.message,true);}});
window.addEventListener('pagehide',()=>{if(activePlanId&&planFingerprint()!==planBaseline)savePlan();});
try{planStore=TradePlans.create(localStorage,TradeData);const db=planStore.read(),last=db.items.find(p=>p.id===db.activeId);if(last){loadingPlan=true;activePlanId=last.id;applyState(TradeData.parse(last.data).state);loadingPlan=false;planMessage('已恢复「'+last.data.tradeName+'」· 修改会自动保存');}else planMessage('尚未暂存 · 填写名称后点“暂存当前”');planBaseline=planFingerprint();refreshPlanList();}catch(e){loadingPlan=false;planMessage(e.message,true);}
