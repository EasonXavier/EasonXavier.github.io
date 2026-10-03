(function(root){
'use strict';
const VERSION='2.0';
const LIMIT=2097152;
function fail(message){throw new Error(message);}
function object(v,keys,path){if(!v||typeof v!=='object'||Array.isArray(v))fail(path+'必须为对象');for(const key of Object.keys(v))if(!keys.includes(key))fail(path+'包含未知字段：'+key);}
function number(v,path,min,max,integer=false){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))fail(path+'必须为'+(integer?'整数':'数值')+'，范围 '+min+'–'+max);return v;}
function parse(input){
 let data=input;
 if(typeof input==='string'){if(new TextEncoder().encode(input).length>LIMIT)fail('JSON 文件不能超过 2 MB');try{data=JSON.parse(input.replace(/^\uFEFF/,''));}catch(e){fail('JSON 格式错误，请检查引号、逗号和括号');}}
 object(data,['schemaVersion','currency','amountUnit','procurement','guaranteeAllocation','customers','intermediaries','advanceMarginPoints','calculation'],'根对象');
 if(data.schemaVersion!==VERSION)fail('schemaVersion 必须为 "2.0"；旧版按客户返点，请改用新版居间方每台返点模板');if(data.currency!=='CNY')fail('currency 必须为 "CNY"');if(data.amountUnit!=='CNY_10K')fail('amountUnit 必须为 "CNY_10K"（万元）');
 const p=data.procurement;object(p,['unitPrice','quantity','advanceRate','guaranteeRate','guaranteeNode','advanceNode','balanceNode','guaranteeBasePrice','guaranteeBaseMode'],'procurement');
 const s={p:number(p.unitPrice,'采购单价',.000001,1e9),q:number(p.quantity,'采购数量',1,1e6,true),x:number(p.advanceRate,'上游预付款比例',0,100),y:number(p.guaranteeRate,'保函比例',0,1000),gNode:number(p.guaranteeNode,'保函节点',1,999,true),upDeposit:number(p.advanceNode,'上游预付款节点',1,999,true),upTail:number(p.balanceNode,'上游尾款节点',1,999,true),advanceMargin:Object.hasOwn(data,'advanceMarginPoints')?number(data.advanceMarginPoints,'advanceMarginPoints',0,100):3,allocation:data.guaranteeAllocation,clients:[],intermediaries:[]};
 s.bMode=p.guaranteeBaseMode||(Object.hasOwn(p,'guaranteeBasePrice')?'manual':'follow');
 if(!['follow','manual'].includes(s.bMode))fail('guaranteeBaseMode 必须为 follow 或 manual');
 if(s.bMode==='manual'&&!Object.hasOwn(p,'guaranteeBasePrice'))fail('手动保函基数需要 guaranteeBasePrice');
 s.b=Object.hasOwn(p,'guaranteeBasePrice')?number(p.guaranteeBasePrice,'保函基数',.000001,1e9):s.p;
 if(s.bMode==='follow')s.b=s.p;
 if(!['quantity','manual'].includes(s.allocation))fail('guaranteeAllocation 必须为 "quantity" 或 "manual"');
 if(!Array.isArray(data.customers)||data.customers.length>200)fail('customers 必须为数组，最多 200 位客户');
 data.customers.forEach((c,i)=>{let prefix='customers['+i+']';object(c,['name','unitPrice','quantity','advanceRate','advanceMode','advanceNode','balanceNode','guaranteeAmount'],prefix);if(typeof c.name!=='string'||!c.name.trim()||c.name.trim().length>40)fail(prefix+'.name 必须为 1–40 个字符');if(s.allocation==='manual'&&!Object.hasOwn(c,'guaranteeAmount'))fail(prefix+'.guaranteeAmount 为手动分配时的必填项');if(Object.hasOwn(c,'advanceMode')&&!['auto','manual'].includes(c.advanceMode))fail(prefix+'.advanceMode 必须为 auto 或 manual');s.clients.push({advanceMode:c.advanceMode||'manual',id:i+1,name:c.name.trim(),p:number(c.unitPrice,prefix+'.unitPrice',.000001,1e9),q:number(c.quantity,prefix+'.quantity',1,1e6,true),x:number(c.advanceRate,prefix+'.advanceRate',0,100),deposit:number(c.advanceNode,prefix+'.advanceNode',1,999,true),tail:number(c.balanceNode,prefix+'.balanceNode',1,999,true),guarantee:Object.hasOwn(c,'guaranteeAmount')?number(c.guaranteeAmount,prefix+'.guaranteeAmount',0,1e9):0});});
 if(!Array.isArray(data.intermediaries)||data.intermediaries.length>20)fail('intermediaries 必须为数组，最多 20 位居间方；无返点时填空数组');
 data.intermediaries.forEach((b,i)=>{const prefix='intermediaries['+i+']';object(b,['name','rebatePerUnit'],prefix);if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>40)fail(prefix+'.name 必须为 1–40 个字符');s.intermediaries.push({id:i+1,name:b.name.trim(),rate:number(b.rebatePerUnit,prefix+'.rebatePerUnit',0,1e9)});});
 const model=typeof module!=='undefined'&&module.exports?require('./model.js'):root.TradeModel;
 const result=model.calculate(s);if(result.errors.length)fail(result.errors.join('；'));
 s.clients.forEach((c,i)=>{c.x=result.clients[i].x;});
 return {state:s,result};
}
function serialize(s){
 const model=typeof module!=='undefined'&&module.exports?require('./model.js'):root.TradeModel;const result=model.calculate(s);if(result.errors.length)fail(result.errors.join('；'));
 const data={schemaVersion:VERSION,currency:'CNY',amountUnit:'CNY_10K',procurement:{unitPrice:s.p,guaranteeBasePrice:result.guaranteeBase,guaranteeBaseMode:s.bMode||(s.b===undefined?'follow':'manual'),quantity:s.q,advanceRate:s.x,guaranteeRate:s.y,guaranteeNode:s.gNode,advanceNode:s.upDeposit,balanceNode:s.upTail},guaranteeAllocation:s.allocation,advanceMarginPoints:s.advanceMargin===undefined?3:s.advanceMargin,intermediaries:s.intermediaries.map(b=>({name:b.name,rebatePerUnit:b.rate})),customers:result.clients.map(c=>({name:c.name,unitPrice:c.p,quantity:c.q,advanceRate:c.x,advanceMode:c.advanceMode||'manual',advanceNode:c.deposit,balanceNode:c.tail,...(s.allocation==='manual'?{guaranteeAmount:c.guarantee}:{})}))};
 parse(data);return data;
}
function snapshot(s){const data=serialize(s);const model=typeof module!=='undefined'&&module.exports?require('./model.js'):root.TradeModel;return {...data,calculation:model.calculate(parse(data).state)};}
const api={parse,serialize,snapshot,LIMIT};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradeData=api;
})(typeof globalThis==='undefined'?this:globalThis);
