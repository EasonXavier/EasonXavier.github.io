(function(root){
'use strict';
const KEY='server-cashflow-plans-v1';
function create(storage,data,makeId=()=>crypto.randomUUID()){
 function read(){
  const raw=storage.getItem(KEY);if(!raw)return {version:1,activeId:null,items:[]};
  let db;try{db=JSON.parse(raw);if(db.version!==1||!Array.isArray(db.items)||db.items.length>100)throw Error();const seen=new Set();db.items.forEach(p=>{if(typeof p.id!=='string'||!p.id||seen.has(p.id))throw Error();seen.add(p.id);data.parse(p.data);if(!p.data.tradeName)throw Error();});}catch{throw new Error('暂存数据无法读取，原记录已保留；请先导出当前 JSON 备份。');}return db;
 }
 function write(db){try{storage.setItem(KEY,JSON.stringify(db));}catch{throw new Error('浏览器暂存不可用或空间不足，当前修改尚未保存；请导出 JSON。');}}
 function save(s,id=null){
  if(!s.tradeName?.trim())throw new Error('请先填写贸易条件名称');
  const clean=data.serialize(s),db=read();let p=id?db.items.find(p=>p.id===id):null;
  if(id&&!p)throw new Error('当前暂存记录已不存在，请另存新方案');
  if(!p){if(db.items.length>=100)throw new Error('已达到 100 份暂存上限，请导出 JSON 备份');p={id:makeId()};db.items.push(p);}
  p.data=clean;p.updatedAt=new Date().toISOString();db.activeId=p.id;write(db);return p;
 }
 function select(id){const db=read(),p=db.items.find(p=>p.id===id);if(!p)throw new Error('未找到该贸易条件');const parsed=data.parse(p.data);db.activeId=id;write(db);return parsed.state;}
 return {read,save,select};
}
const api={create,KEY};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradePlans=api;
})(typeof globalThis==='undefined'?this:globalThis);
