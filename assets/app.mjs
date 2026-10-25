import {escapeHtml as e} from './markdown.mjs';

// Old links remain useful after moving to independent article pages.
const legacy=location.hash.match(/^#\/post\/([a-z0-9-]+)$/);
if(legacy)location.replace('/essays/'+legacy[1]+'/');
else if(location.hash==='#/about')location.replace('/about/');
else if(location.hash==='#/')history.replaceState(null,'',location.pathname);

const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const themeButton=document.getElementById('theme-toggle');
function isDark(){return document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;}
function syncTheme(){const dark=isDark();themeButton.textContent=dark?'☾':'◐';themeButton.setAttribute('aria-label',dark?'切换浅色模式':'切换深色模式');themeButton.title=themeButton.getAttribute('aria-label');}
themeButton.addEventListener('click',()=>{const next=isDark()?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('theme',next);}catch{}syncTheme();});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',syncTheme);syncTheme();

// Preserve the homepage's exact location, including the explicit return links.
if(document.body.dataset.page==='home'){
  function storeIndex(){try{sessionStorage.setItem('cz-index-y',String(window.scrollY));}catch{}}
  let returnHere=false;try{returnHere=sessionStorage.getItem('cz-return-index')==='yes';sessionStorage.removeItem('cz-return-index');}catch{}
  if(returnHere){let y=0;try{y=Number(sessionStorage.getItem('cz-index-y'))||0;}catch{}requestAnimationFrame(()=>window.scrollTo(0,y));}
  addEventListener('pagehide',storeIndex);
  document.addEventListener('click',event=>{if(event.target.closest('a[href^="/essays/"]'))storeIndex();});
}
document.querySelectorAll('[data-return-index]').forEach(link=>link.addEventListener('click',()=>{try{sessionStorage.setItem('cz-return-index','yes');}catch{}}));

// Search is loaded only when needed; every result keeps the publication order.
const dialog=document.getElementById('search-dialog'),input=document.getElementById('search-input'),results=document.getElementById('search-results'),status=document.getElementById('search-status');
let searchData=null,searchLoading=null;
async function openSearch(){
  if(!dialog.open)dialog.showModal();input.focus();
  if(!searchData){status.textContent='正在读取文章…';try{if(!searchLoading)searchLoading=fetch('/search.json').then(r=>{if(!r.ok)throw Error();return r.json();});searchData=await searchLoading;}catch{searchLoading=null;status.textContent='文章暂时没能读取，请稍后重新打开搜索。';return;}}
  renderResults();
}
function highlighted(text,terms){
  const intervals=[];for(const term of terms){let i=0,lower=text.toLocaleLowerCase();while((i=lower.indexOf(term,i))!==-1){intervals.push([i,i+term.length]);i+=term.length;}}
  intervals.sort((a,b)=>a[0]-b[0]);const merged=[];for(const x of intervals){const last=merged.at(-1);if(last&&x[0]<=last[1])last[1]=Math.max(last[1],x[1]);else merged.push(x);}
  let html='',end=0;for(const [a,b] of merged){html+=e(text.slice(end,a))+'<mark>'+e(text.slice(a,b))+'</mark>';end=b;}return html+e(text.slice(end));
}
function renderResults(){
  if(!searchData)return;const query=input.value.trim().toLocaleLowerCase();
  if(!query){results.innerHTML='';status.textContent='搜索标题和正文，结果按时间排列。';return;}
  const terms=query.split(/\s+/).filter(Boolean).slice(0,8);
  const matches=searchData.filter(p=>{const text=(p.title+' '+p.text).toLocaleLowerCase();return terms.every(t=>text.includes(t));});
  status.textContent=matches.length?'找到 '+matches.length+' 篇文章':'没有找到匹配的文章，可以换一个词试试。';
  results.innerHTML=matches.map(p=>{const lower=p.text.toLocaleLowerCase();const positions=terms.map(t=>lower.indexOf(t)).filter(n=>n>=0);const start=Math.max(0,(positions.length?Math.min(...positions):0)-32);const snippet=(start?'…':'')+p.text.slice(start,start+130)+(p.text.length>start+130?'…':'');return '<a class="search-result" href="'+e(p.url)+'"><time>'+e(p.date)+'</time><h3>'+highlighted(p.title,terms)+'</h3><p>'+highlighted(snippet,terms)+'</p></a>';}).join('');
}
document.querySelectorAll('[data-open-search]').forEach(b=>b.addEventListener('click',openSearch));
document.querySelector('[data-close-search]').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
input.addEventListener('input',renderResults);
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}});

// Reading conveniences operate locally and do not require an account.
const article=document.querySelector('[data-post-id]'),progress=document.getElementById('progress');
if(article){
  const body=article.querySelector('.doc-body'),id=article.dataset.postId,key='cz-reading-'+id;
  let stored=read(key),canSave=false,pending=0;
  const resume=document.getElementById('resume-prompt');
  if(stored&&Number.isFinite(stored.ratio)&&stored.ratio>.02&&stored.ratio<.98)resume.hidden=false;
  else stored=null;
  function geometry(){const start=body.getBoundingClientRect().top+scrollY;const distance=Math.max(1,body.offsetHeight-innerHeight*.55);return {start,distance};}
  function progressNow(){const {start,distance}=geometry();return Math.max(0,Math.min(1,(scrollY-start)/distance));}
  function saveReading(){if(!canSave)return;const ratio=progressNow();if(ratio>=.98){try{localStorage.removeItem(key);}catch{}}else if(ratio>.02)write(key,{ratio,time:Date.now()});}
  function update(){const ratio=progressNow();progress.style.width=(ratio*100)+'%';if(scrollY>geometry().start+60){canSave=true;clearTimeout(pending);pending=setTimeout(saveReading,180);}}
  document.querySelector('[data-resume]').addEventListener('click',()=>{resume.hidden=true;requestAnimationFrame(()=>{const {start,distance}=geometry();scrollTo(0,start+Math.min(.97,stored.ratio)*distance);canSave=true;update();});});
  document.querySelector('[data-start-over]').addEventListener('click',()=>{resume.hidden=true;try{localStorage.removeItem(key);}catch{}canSave=false;scrollTo(0,0);progress.style.width='0%';});
  const sizeButton=document.querySelector('[data-text-size]');
  function syncSize(){const large=document.documentElement.dataset.textSize==='large';sizeButton.textContent=large?'标准字号':'加大字号';sizeButton.setAttribute('aria-pressed',String(large));}
  syncSize();sizeButton.addEventListener('click',()=>{const large=document.documentElement.dataset.textSize!=='large';document.documentElement.dataset.textSize=large?'large':'standard';try{localStorage.setItem('cz-font-size',large?'large':'standard');}catch{}syncSize();update();});
  const copy=document.querySelector('[data-copy-link]'),copyStatus=document.querySelector('.copy-status');
  copy.addEventListener('click',async()=>{const url=document.querySelector('link[rel=canonical]').href;try{await navigator.clipboard.writeText(url);copyStatus.textContent='链接已复制';}catch{copyStatus.textContent='请选择下方链接复制';let field=article.querySelector('.share-fallback');if(!field){field=document.createElement('input');field.className='share-fallback';field.readOnly=true;field.setAttribute('aria-label','文章链接');copy.closest('.reader-tools').append(field);}field.value=url;field.focus();field.select();}});
  article.querySelectorAll('.toc a').forEach(link=>link.addEventListener('click',()=>{const heading=document.getElementById(link.hash.slice(1));if(heading)requestAnimationFrame(()=>heading.focus({preventScroll:true}));}));
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update);addEventListener('pagehide',saveReading);update();
}
