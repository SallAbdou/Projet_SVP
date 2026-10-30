(function(){var tpl=document.getElementById('tpl').textContent;var c=new Component({});try{var l=localStorage.getItem('pq-lang');if(l==='fr'||l==='en')c.state.lang=l}catch(e){}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function get(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
window.__render=function(){var v=c.renderVals();var h={};
var s=tpl.replace(/<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g,function(m,list,as,inner){return (get(v,list)||[]).map(function(it){var sc={};sc[as]=it;return inner.replace(/\{\{([\w.]+)\}\}/g,function(mm,p){return p.split('.')[0]===as?esc(get(sc,p)):mm})}).join('')});
s=s.replace(/on([A-Z][a-z]+)="\{\{(\w+)\}\}"/g,function(m,ev,fn){return 'data-ev="'+ev.toLowerCase()+':'+fn+'"'});
s=s.replace(/\{\{([\w.]+)\}\}/g,function(m,p){return esc(get(v,p))});
var root=document.getElementById('root');var ae=document.activeElement&&document.activeElement.textContent;root.innerHTML=s;
root.querySelectorAll('[data-ev]').forEach(function(el){var x=el.getAttribute('data-ev').split(':');el.addEventListener(x[0],function(e){if(x[0]==='submit')e.preventDefault();v[x[1]](e)})});
document.documentElement.lang=c.state.lang||'fr';};window.__render();})();
