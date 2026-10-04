const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'../server-cashflow');
function harness(){
 const elements=new Map(),listeners={};
 class Element{
  constructor(id){this.id=id;this.value='';this.innerHTML='';this.dataset={};this.listeners={};this.classList={toggle(){}};}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  querySelector(){return get(this.id+'-body');}
  querySelectorAll(){return [];}
  setAttribute(){} removeAttribute(){} replaceChildren(){} showModal(){} close(){}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)};
 const document={getElementById:get,addEventListener(type,fn){(listeners[type]??=[]).push(fn)},dispatchEvent(e){for(const fn of listeners[e.type]||[])fn(e)},querySelector(){return null},querySelectorAll(){return []}};
 Object.entries({p:1390,q:128,x:30,y:35,b:1390,bMode:'follow',gNode:1,upDeposit:3,upTail:5,advanceMargin:3,allocation:'quantity','trade-name':'默认交易条件'}).forEach(([k,v])=>get(k).value=String(v));
 const ctx=vm.createContext({document,Event:class{constructor(type){this.type=type}},TradeModel:require('../server-cashflow/model.js'),TradeData:require('../server-cashflow/data.js'),TradeCharts:{render:()=>'<svg></svg>'},TradeQuote:require('../server-cashflow/quote.js'),URL,Blob,setTimeout,clearTimeout});
 vm.runInContext(fs.readFileSync(path.join(dir,'app.js'),'utf8'),ctx);
 return {get,run:s=>vm.runInContext(s,ctx),change:dataset=>document.dispatchEvent({type:'change',target:{...dataset,matches:()=>false}}),click:(selector,dataset)=>document.dispatchEvent({type:'click',target:{closest:s=>s===selector?{dataset}:null}}),button:id=>get(id).listeners.click.forEach(fn=>fn())};
}
test('checkbox interaction recalculates totals, all-mode follows new clients, explicit bindings do not',()=>{
 const h=harness();h.run("clients[0].q=64;renderClients();renderBrokerBindings();render();");h.button('add-client');
 h.change({dataset:{bindBroker:'1',bindClient:'2'},checked:false});
 assert.equal(h.run('result.rebates'),5440);assert.equal(h.run('result.intermediaries[0].quantity'),64);
 assert.match(h.get('broker-summary-1').innerHTML,/64 台/);assert.equal(h.run('TradeQuote.build(state(),1).intermediaries.length'),0);
 h.run("clients[1].q=32;renderClients();render();");h.button('add-client');assert.equal(h.run('result.rebates'),5440);
 h.change({dataset:{bindAll:'1'},checked:true});assert.equal(h.run('result.rebates'),10880);
 h.change({dataset:{bindBroker:'1',bindClient:'1'},checked:false});h.change({dataset:{bindBroker:'1',bindClient:'2'},checked:false});h.change({dataset:{bindBroker:'1',bindClient:'3'},checked:false});assert.equal(h.run('result.rebates'),0);assert.match(h.get('alerts').innerHTML,/未绑定/);
});
test('delete removes references and reimport uses unique IDs instead of count-based IDs',()=>{
 const h=harness();h.run("clients[0].q=64;renderClients();render();");h.button('add-client');h.change({dataset:{bindBroker:'1',bindClient:'1'},checked:false});
 h.click('[data-remove]',{remove:'2'});assert.equal(h.run('JSON.stringify(intermediaries[0].customerIds)'), '[]');h.button('add-client');assert.equal(h.run('result.rebates'),0);
 h.run("clients[1].id=8;intermediaries[0].customerIds=[8];applyState(TradeData.parse(TradeData.serialize(state())).state);");h.button('add-client');assert.equal(h.run('new Set(clients.map(c=>c.id)).size'),3);assert.equal(h.run('clients[2].id'),9);assert.equal(h.run('JSON.stringify(intermediaries[0].customerIds)'), '[8]');
});
