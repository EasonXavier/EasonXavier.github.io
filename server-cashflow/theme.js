(function(){
'use strict';
let theme='dark';try{const saved=localStorage.getItem('server-cashflow-theme');if(saved==='dark'||saved==='light')theme=saved;}catch{}
document.documentElement.dataset.theme=theme;
function labels(){document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.textContent=theme==='dark'?'浅色模式':'深色模式';b.setAttribute('aria-label','切换为'+(theme==='dark'?'浅色':'深色')+'模式');});}
document.addEventListener('DOMContentLoaded',labels);
document.addEventListener('click',e=>{if(!e.target.closest('[data-theme-toggle]'))return;theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('server-cashflow-theme',theme);}catch{}labels();});
})();
