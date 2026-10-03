(function(root){
'use strict';
function build(s,index){
 const model=typeof module!=='undefined'&&module.exports?require('./model.js'):root.TradeModel;
 const r=model.calculate(s);if(r.errors.length)throw new Error(r.errors.join('；'));
 const c=r.clients[index];if(!c)throw new Error('请选择下游客户');
 return {tradeName:s.tradeName||'',name:c.name,unitPrice:c.p,quantity:c.q,sales:c.sales,guarantee:c.g,guaranteeRate:c.guaranteeSalesRate,guaranteeNode:s.gNode,advanceRate:c.x,advance:c.depositCash,balance:c.tailCash,advanceNode:c.deposit,balanceNode:c.tail,rebate:c.b,advanceRebate:c.depositRebate,balanceRebate:c.tailRebate,intermediaries:r.intermediaries.map(b=>({name:b.name,perUnit:b.rate,...b.allocations[index]}))};
}
function canvas(q){
 const width=960,pad=60,body=width-pad*2,scale=2;
 const measure=document.createElement('canvas').getContext('2d');
 const font='"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
 const rows=[];let y=55;
 const amount=n=>n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:6});
 const rate=n=>n.toLocaleString('zh-CN',{maximumFractionDigits:4})+'%';
 function text(value,size=22,color='#20392f',weight=400,x=pad,maxWidth=body){
  measure.font=`${weight} ${size}px ${font}`;let line='';
  for(const ch of String(value)){if(line&&measure.measureText(line+ch).width>maxWidth){rows.push({kind:'text',value:line,x,y,size,color,weight});y+=size*1.5;line='';}line+=ch;}
  rows.push({kind:'text',value:line,x,y,size,color,weight});y+=size*1.5;
 }
 function line(){y+=13;rows.push({kind:'line',y});y+=24;}
 function section(title){line();text(title,23,'#244c3e',650);y+=8;}
 function pair(label,value){rows.push({kind:'pair',label,value,y});y+=43;}
 text('交易条件确认',16,'#637b71',600);y+=10;text('成交与付款说明',38,'#193a2d',650);y+=18;
 if(q.tradeName){text(q.tradeName,21,'#637b71',500);y+=8;}
 text(q.name,26,'#193a2d',600);y+=12;
 pair('成交单价',amount(q.unitPrice)+' 万元 / 台');pair('成交数量',q.quantity.toLocaleString('zh-CN')+' 台');pair('销售合同总额',amount(q.sales)+' 万元');
 section('01  保函安排');pair('分配保函金额',amount(q.guarantee)+' 万元');pair('占销售合同总额',rate(q.guaranteeRate));pair('保函生效并送达',`节点 ${q.guaranteeNode}`);
 section('02  客户支付货款');pair(`第 1 期 · 预付款（节点 ${q.advanceNode}）`,amount(q.advance)+' 万元');pair('预付款占合同金额',rate(q.advanceRate));y+=8;pair(`第 2 期 · 尾款（节点 ${q.balanceNode}）`,amount(q.balance)+' 万元');pair('尾款占合同金额',rate(100-q.advanceRate));
 section('03  居间费用');text('卖方按该客户每次回款比例支付，以下费用不另加到客户货款。',18,'#637b71');y+=12;
 if(!q.intermediaries.length)text('无居间费用',22);
 q.intermediaries.forEach(b=>{text(b.name,22,'#244c3e',600);pair('每台费用 / 该客户费用合计',amount(b.perUnit)+' / '+amount(b.total)+' 万元');pair('第 1 期 · 收到预付款时支付',amount(b.deposit)+' 万元');pair('第 2 期 · 收到尾款时支付',amount(b.tail)+' 万元');y+=14;});
 line();pair('居间费用合计',amount(q.rebate)+' 万元');pair('第 1 期 / 第 2 期支付合计',amount(q.advanceRebate)+' / '+amount(q.balanceRebate)+' 万元');
 line();text('币种：人民币 · 金额单位：万元',17,'#637b71');text('货款与居间费各分两期结算；节点编号仅表示先后顺序。',17,'#637b71');text('本页按当前成交条件列示，具体履约安排以双方确认的合同为准。',17,'#637b71');
 const el=document.createElement('canvas');el.width=width*scale;el.height=Math.ceil(y+40)*scale;el.setAttribute('role','img');el.setAttribute('aria-label',`${q.name}：单价 ${amount(q.unitPrice)} 万元，${q.quantity} 台，保函 ${amount(q.guarantee)} 万元；两期货款 ${amount(q.advance)}、${amount(q.balance)} 万元；居间费两期 ${amount(q.advanceRebate)}、${amount(q.balanceRebate)} 万元。`);
 const ctx=el.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#f7f8f4';ctx.fillRect(0,0,width,el.height/scale);ctx.fillStyle='#244c3e';ctx.fillRect(0,0,width,8);ctx.textBaseline='top';
 for(const row of rows){if(row.kind==='line'){ctx.strokeStyle='#d8e1d8';ctx.beginPath();ctx.moveTo(pad,row.y);ctx.lineTo(width-pad,row.y);ctx.stroke();}else if(row.kind==='text'){ctx.fillStyle=row.color;ctx.font=`${row.weight} ${row.size}px ${font}`;ctx.textAlign='left';ctx.fillText(row.value,row.x,row.y);}else{ctx.font=`400 20px ${font}`;ctx.fillStyle='#637b71';ctx.textAlign='left';ctx.fillText(row.label,pad,row.y);let size=23;ctx.font=`600 ${size}px ${font}`;while(ctx.measureText(row.value).width>body*.57&&size>14){size--;ctx.font=`600 ${size}px ${font}`;}ctx.fillStyle='#20392f';ctx.textAlign='right';ctx.fillText(row.value,width-pad,row.y);}}
 return el;
}
const api={build,canvas};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradeQuote=api;
})(typeof globalThis==='undefined'?this:globalThis);
