(function(root){
'use strict';
const SALT='659b291eece9e951525770c4c8234518',DIGEST='b3cd512f7a8e1fa444a43ee5fd8c29512ad3c5a338c485d199e32dc1bdfcc147';
async function verifyPassword(password){if(typeof password!=='string'||!root.crypto?.subtle)throw new Error('当前浏览器不支持密码校验，请使用 HTTPS 打开页面');const bytes=new TextEncoder().encode(password);const key=await root.crypto.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveBits']);const salt=Uint8Array.from(SALT.match(/../g),x=>parseInt(x,16));const derived=await root.crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:210000},key,256);const hash=Array.from(new Uint8Array(derived),b=>b.toString(16).padStart(2,'0')).join('');return hash===DIGEST;}
if(typeof module!=='undefined'&&module.exports){module.exports={verifyPassword};return;}
const gate=document.getElementById('access-gate'),shell=document.getElementById('app-shell'),form=document.getElementById('access-form'),password=document.getElementById('access-password'),error=document.getElementById('access-error'),submit=document.getElementById('unlock');
form.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';submit.disabled=true;try{const valid=await verifyPassword(password.value);password.value='';if(valid){gate.hidden=true;shell.hidden=false;shell.inert=false;document.getElementById('open-import').focus();}else{error.textContent='密码不正确';password.focus();}}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}});
document.getElementById('lock-page').addEventListener('click',()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());shell.hidden=true;shell.inert=true;gate.hidden=false;error.textContent='';password.value='';document.dispatchEvent(new Event('trade-locked'));password.focus();});
})(globalThis);

