(function(root){
'use strict';
const money=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
const sum=a=>money(a.reduce((s,n)=>s+n,0));
function calculate(s){
 const errors=[]; const warnings=[];
 const num=(n,name,min=0,max=1e9,integer=false)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))errors.push(name+'输入无效');};
 num(s.p,'采购单价',0.000001);num(s.q,'采购数量',1,1000000,true);num(s.x,'上游预付款比例',0,100);num(s.y,'保函比例',0,1000);
 num(s.upDeposit,'上游预付款节点',1,999,true);num(s.upTail,'上游尾款节点',1,999,true);num(s.gNode,'保函节点',1,999,true);
 if(s.upTail<s.upDeposit)errors.push('上游尾款节点不能早于预付款节点');
 if(!['quantity','manual'].includes(s.allocation))errors.push('保函分配方式无效');
 if(!Array.isArray(s.clients))return {errors:['客户数据无效'],warnings:[]};
 s.clients.forEach((c,i)=>{const k='客户'+(i+1)+'：';num(c.p,k+'销售单价',0.000001);num(c.q,k+'数量',1,1000000,true);num(c.x,k+'预付款比例',0,100);num(c.b,k+'返点');num(c.deposit,k+'收预付款节点',1,999,true);num(c.tail,k+'收尾款节点',1,999,true);if(s.allocation==='manual')num(c.guarantee,k+'保函额度');if(c.tail<c.deposit)errors.push(k+'尾款节点不能早于预付款节点');});
 if(errors.length)return {errors,warnings};
 const cost=money(s.p*s.q), soldQ=sum(s.clients.map(c=>c.q)), guarantee=money(cost*s.y/100);
 if(cost>1e9||sum(s.clients.map(c=>c.p*c.q))>1e9||guarantee>1e9){return {errors:['交易金额超出支持范围（总额上限 10 亿万元）'],warnings};}
 if(soldQ>s.q)errors.push('销售数量超过采购数量 '+(soldQ-s.q)+' 台，请调整数量');
 let allocated=0;
 const clients=s.clients.map((c,i)=>{
  const sales=money(c.p*c.q),purchase=money(s.p*c.q),profit=money(sales-purchase-c.b),depositCash=money(sales*c.x/100),depositRebate=money(c.b*c.x/100);
  let g=s.allocation==='manual'?money(c.guarantee):money(guarantee*c.q/s.q);
  if(s.allocation==='quantity'&&soldQ===s.q&&i===s.clients.length-1)g=money(guarantee-allocated);
  allocated=money(allocated+g);
  return {...c,name:(c.name||'客户 '+(i+1)).trim()||'客户 '+(i+1),sales,purchase,profit,depositCash,depositRebate,tailCash:money(sales-depositCash),tailRebate:money(c.b-depositRebate),g,coverage:depositCash?g/depositCash*100:null,margin:sales?profit/sales*100:null};
 });
 if(allocated-guarantee>0.0000005)errors.push('分配保函超过上游总额度 '+money(allocated-guarantee)+' 万元');
 if(errors.length)return {errors,warnings};
 const sales=sum(clients.map(c=>c.sales)),rebates=sum(clients.map(c=>c.b)),profit=sum(clients.map(c=>c.profit)),inventory=money((s.q-soldQ)*s.p),upfront=money(cost*s.x/100);
 const events=[];const sequenceErrors=[];
 function push(e){if(e.inflow||e.upstream||e.rebate)events.push(e);}
 push({node:s.upDeposit,priority:0,label:'付上游预付款',inflow:0,upstream:upfront,rebate:0,contribution:0});
 push({node:s.upTail,priority:1,label:'付上游尾款',inflow:0,upstream:money(cost-upfront),rebate:0,contribution:0});
 clients.forEach(c=>{
  const depProfit=money(c.profit*c.x/100);
  push({node:c.deposit,priority:2,label:'收 '+c.name+' 预付款',inflow:c.depositCash,upstream:0,rebate:c.depositRebate,contribution:depProfit});
  push({node:c.tail,priority:3,label:'收 '+c.name+' 尾款',inflow:c.tailCash,upstream:0,rebate:c.tailRebate,contribution:money(c.profit-depProfit)});
 });
 if(guarantee>0){
  if(events.some(e=>e.node<s.gNode))sequenceErrors.push('存在付款早于保函生效并送达下游，请先交付保函再付款');
  events.push({node:s.gNode,priority:-1,label:'保函生效并送达下游',inflow:0,upstream:0,rebate:0,contribution:0,isGuarantee:true});
 }
 events.sort((a,b)=>a.node-b.node||a.priority-b.priority);
 let balance=0,minBalance=0,realized=0,firstGap=null,cumulativeIn=0,cumulativeRebates=0;
 events.forEach((e,i)=>{e.net=money(e.inflow-e.upstream-e.rebate);balance=money(balance+e.net);realized=money(realized+e.contribution);cumulativeIn=money(cumulativeIn+e.inflow);cumulativeRebates=money(cumulativeRebates+e.rebate);e.balance=balance;e.realized=realized;e.index=i+1;e.cumulativeIn=cumulativeIn;e.cumulativeRebates=cumulativeRebates;minBalance=Math.min(minBalance,balance);if(balance<0&&!firstGap)firstGap=e;});
 const depositNet=money(sum(clients.map(c=>c.depositCash-c.depositRebate))-upfront);
 if(soldQ<s.q)warnings.push('尚有 '+(s.q-soldQ)+' 台未出售，采购款仍按全部 '+s.q+' 台支付。');
 const under=clients.filter(c=>c.coverage!==null&&c.coverage<100-1e-8);if(under.length)warnings.push(under.map(c=>c.name).join('、')+' 的保函额度低于其预付款。');
 if(clients.some(c=>c.profit<0))warnings.push('存在扣除返点后亏损的客户合同。');
 return {errors,warnings,sequenceErrors,clients,cost,soldQ,guarantee,allocated,unallocated:money(guarantee-allocated),sales,rebates,profit,inventory,upfront,depositNet,events,finalCash:balance,minBalance,gap:money(-minBalance),firstGap,feasible:minBalance>=0&&sequenceErrors.length===0,margin:sales?profit/sales*100:null};
}
const api={calculate,money};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradeModel=api;
})(typeof globalThis==='undefined'?this:globalThis);
