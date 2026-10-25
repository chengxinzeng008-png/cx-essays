import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {escapeHtml as e,renderMarkdown,excerpt,plainText} from '../assets/markdown.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const origin='https://cx-essays.netlify.app';
export function parseArticle(source,filename){
  const match=source.replace(/^\uFEFF/,'').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if(!match)throw Error(filename+': missing article metadata');
  const meta={};for(const line of match[1].split(/\r?\n/)){const m=line.match(/^([\w]+):\s*(.*)$/);if(!m)continue;try{meta[m[1]]=JSON.parse(m[2]);}catch{meta[m[1]]=m[2];}}
  meta.id=String(meta.id||filename.replace(/\.md$/,''));
  if(!/^[a-z0-9][a-z0-9-]*$/.test(meta.id))throw Error(filename+': invalid article id');
  if(!meta.title||!/^\d{4}-\d{2}(-\d{2})?$/.test(meta.date||''))throw Error(filename+': title and date are required');
  const dateParts=meta.date.split('-').map(Number);const parsed=new Date(Date.UTC(dateParts[0],dateParts[1]-1,dateParts[2]||1));
  if(parsed.getUTCFullYear()!==dateParts[0]||parsed.getUTCMonth()!==dateParts[1]-1||parsed.getUTCDate()!==(dateParts[2]||1))throw Error(filename+': invalid calendar date');
  return {...meta,content:match[2].replace(/^\r?\n/,'').replace(/\r?\n$/,''),sort:Number(String(meta.dateSort||meta.date.replaceAll('-','').padEnd(8,'0'))),url:'/essays/'+meta.id+'/'};
}
export async function readArticles(){const files=(await fs.readdir(path.join(root,'posts'))).filter(f=>f.endsWith('.md'));const posts=await Promise.all(files.map(async f=>parseArticle(await fs.readFile(path.join(root,'posts',f),'utf8'),f)));if(new Set(posts.map(p=>p.id)).size!==posts.length)throw Error('Duplicate article IDs');return posts.sort((a,b)=>b.sort-a.sort||Number(b.order||0)-Number(a.order||0)||b.id.localeCompare(a.id));}
function dateLabel(p,full=false){if(full&&p.dateLabel)return p.dateLabel;const [y,m,d]=p.date.split('-');return y+'年'+Number(m)+'月'+(d?Number(d)+'日':'');}
function shortDate(p){const [y,m,d]=p.date.split('-');return Number(m)+'月'+(d?Number(d)+'日':'');}
function page({title='Chengxin Zeng',description='Chengxin Zeng 的个人文章与思辨。按时间留下写作与想法。',url='/',body,type='website',kind='home',extra='',lang='zh-CN'}){
 return `<!doctype html>
<html lang="${e(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${origin+url}"><meta property="og:type" content="${type}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${origin+url}"><meta property="og:site_name" content="Chengxin Zeng"><meta name="twitter:card" content="summary"><meta name="theme-color" content="#f3eee2"><link rel="alternate" type="application/rss+xml" title="Chengxin Zeng · 文章与思辨" href="/feed.xml"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><script>try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;var s=localStorage.getItem('cz-font-size');if(s==='large')document.documentElement.dataset.textSize='large'}catch(e){}</script><link rel="stylesheet" href="/assets/style.css"><script type="module" src="/assets/app.mjs"></script>${extra}</head>
<body data-page="${kind}"><a class="skip-link" href="#main">跳到正文</a><div class="reading-progress" aria-hidden="true"><span id="progress"></span></div>
<header class="site-header"><a class="brand" href="/"><span class="brand-name">Chengxin Zeng</span><span class="brand-sub">文章与思辨</span></a><nav aria-label="主导航"><a href="/"${kind==='home'?' aria-current="page"':''}>文章</a><button type="button" data-open-search aria-haspopup="dialog">搜索</button><a href="/about/"${kind==='about'?' aria-current="page"':''}>关于</a><button class="theme-toggle" type="button" id="theme-toggle" aria-label="切换深色模式" title="切换深色模式">◐</button></nav></header>
<main id="main">${body}</main><footer class="site-footer"><span>Chengxin Zeng</span><nav aria-label="页脚导航"><a href="/feed.xml">RSS 订阅</a><a href="/write/">写作</a></nav></footer>
<dialog id="search-dialog" aria-labelledby="search-heading"><div class="search-head"><h2 id="search-heading">查找文章</h2><button type="button" data-close-search aria-label="关闭搜索">关闭</button></div><label class="sr-only" for="search-input">搜索标题或正文</label><input type="search" id="search-input" placeholder="搜一个词，找回一篇文章" autocomplete="off"><p class="search-status" id="search-status" role="status">搜索标题和正文，结果按时间排列。</p><div id="search-results"></div></dialog>
</body></html>`;
}
function row(p){return `<article class="post-row"><time datetime="${e(p.date)}">${e(shortDate(p))}</time><h2><a href="${p.url}">${e(p.title)}</a></h2><p class="post-excerpt" lang="${p.lang==='en'?'en':'zh-CN'}">${e(p.summary||excerpt(p.content))}</p></article>`;}
function writeForm(){return `<section class="write-page"><a class="back-link" href="/">← 返回文章</a><div class="write-head"><h1>写一篇</h1><p>标题、日期、正文。写好就留下来。</p></div><div class="editor-layout"><form id="write-form"><label for="write-title">标题</label><input id="write-title" name="title" required maxlength="240" placeholder="这篇文章叫什么"><label for="write-date">写作日期</label><input id="write-date" name="date" type="date" required><label for="write-content">正文</label><textarea id="write-content" name="content" required placeholder="从这里开始写。支持 Markdown、图片、引用和脚注。"></textarea><div class="editor-actions"><button type="button" id="preview-button">预览</button><button type="button" id="export-button">导出文章</button><button type="submit" class="primary-button">准备发布</button></div><p class="helper" role="status" id="draft-status">草稿仅保存在当前浏览器。</p><details class="writing-help"><summary>格式与发布说明</summary><p>用 ## 写小标题，**文字** 加粗，&gt; 写引用，![说明](图片地址) 放图片，用 [^1] 与 [^1]: 内容 写脚注。</p><p>“准备发布”会下载文章文件，然后显示 GitHub 上传入口。将文件上传到你的仓库并提交，网站会自动更新。只有仓库拥有者可以完成发布。</p><p>继续修改旧文时，保留原文件名和写作日期，可增加 updated: "2026-10-25" 记录修改日期。</p></details></form><section id="write-preview" class="preview-pane" aria-label="文章预览" hidden><div class="preview-bar"><span>预览</span><button type="button" id="close-preview">继续编辑</button></div><h1 id="preview-title"></h1><p id="preview-date" class="doc-meta"></p><div id="preview-body" class="doc-body"></div></section></div><section id="publish-guide" class="publish-guide" hidden><h2>文章文件已准备好</h2><p>将刚下载的文件上传，在 GitHub 点击“Commit changes”提交后，网站会自动更新。当前草稿会继续保留。</p><a class="primary-button" href="https://github.com/chengxinzeng008-png/cx-essays/upload/main/posts" target="_blank" rel="noopener">打开 GitHub 上传页 ↗</a><p class="helper">只有完成上传和提交，文章才会公开。</p></section></section>`;}
export async function build(){
 const posts=await readArticles(),out=path.resolve(root,'dist');if(path.dirname(out)!==root)throw Error('Invalid build directory');await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});await fs.cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
 async function put(name,content){const dest=path.join(out,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,content);}
 const groups=new Map();for(const p of posts){const year=p.date.slice(0,4);if(!groups.has(year))groups.set(year,[]);groups.get(year).push(p);}
 const home=`<section class="index-page"><h1 class="sr-only">文章</h1>${groups.size>1?'<nav class="year-nav" aria-label="按年份翻阅">'+[...groups.keys()].map(y=>`<a href="#year-${y}">${y}</a>`).join('')+'</nav>':''}${[...groups.entries()].map(([year,list])=>`<section class="year-section" id="year-${year}" aria-labelledby="heading-${year}"><div class="year-heading"><h2 id="heading-${year}">${year}</h2><span>${list.length} 篇 · 由近到远</span></div>${list.map(row).join('')}</section>`).join('')}</section>`;
 await put('index.html',page({body:home}));
 const search=[];
 for(let i=0;i<posts.length;i++){
  const p=posts[i],rendered=renderMarkdown(p.content);const newer=posts[i-1],older=posts[i+1];
  const toc=rendered.headings.length>=2?`<details class="toc"><summary>文章目录 · ${rendered.headings.length} 节</summary><ol>${rendered.headings.map(h=>`<li><a href="#${h.id}">${e(h.text)}</a></li>`).join('')}</ol></details>`:'';
  const body=`<article class="post-doc" data-post-id="${p.id}"><a class="back-link" href="/" data-return-index>← 返回目录</a><header class="doc-head"><h1>${e(p.title)}</h1><div class="doc-meta"><time datetime="${p.date}">${e(dateLabel(p,true))}</time>${p.updated?`<span>更新于 ${e(p.updated)}</span>`:''}</div><div class="reader-tools"><button type="button" data-copy-link>复制链接</button><button type="button" data-text-size aria-pressed="false">加大字号</button><span class="copy-status" role="status"></span></div></header><aside class="resume-prompt" id="resume-prompt" hidden><span>上次读到这里，还要接着读吗？</span><div><button type="button" data-resume>继续阅读</button><button type="button" data-start-over>从头开始</button></div></aside>${toc}<div class="doc-body" lang="${p.lang==='en'?'en':'zh-CN'}">${rendered.html}</div><nav class="post-end" aria-label="按时间继续阅读">${newer?`<a href="${newer.url}" class="newer"><span>← 较新一篇</span><strong>${e(newer.title)}</strong></a>`:'<span></span>'}${older?`<a href="${older.url}" class="older"><span>较早一篇 →</span><strong>${e(older.title)}</strong></a>`:'<span></span>'}<a href="/" class="end-index" data-return-index>返回目录</a></nav></article>`;
  await put('essays/'+p.id+'/index.html',page({title:p.title+' — Chengxin Zeng',description:p.summary||excerpt(p.content,155),url:p.url,body,type:'article',kind:'article',extra:`<meta property="article:published_time" content="${p.date}">`}));
  search.push({id:p.id,title:p.title,date:dateLabel(p),url:p.url,text:plainText(p.content)});
 }
 const about=await fs.readFile(path.join(root,'about.md'),'utf8');
 await put('about/index.html',page({title:'关于 — Chengxin Zeng',url:'/about/',kind:'about',body:'<article class="about-doc"><header class="doc-head"><p class="eyebrow">关于</p><h1>写在前面</h1></header><div class="doc-body">'+renderMarkdown(about).html+'</div></article>'}));
 await put('write/index.html',page({title:'写一篇 — Chengxin Zeng',url:'/write/',kind:'write',extra:'<meta name="robots" content="noindex,nofollow"><script type="module" src="/assets/editor.mjs"></script>',body:writeForm()}));
 await put('404.html',page({title:'没有找到这页 — Chengxin Zeng',kind:'404',body:'<section class="empty-state"><h1>这页暂时找不到了。</h1><p>可以回到文章目录，或用搜索找一找。</p><a href="/">返回文章目录 →</a></section>'}));
 await put('search.json',JSON.stringify(search));
 const stamp=d=>new Date(d.length===7?d+'-01T00:00:00+08:00':d+'T00:00:00+08:00').toUTCString();
 await put('feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Chengxin Zeng · 文章与思辨</title><link>${origin}/</link><description>按时间留下写作与想法。</description><language>zh-CN</language><atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>${posts.map(p=>`<item><title>${e(p.title)}</title><link>${origin+p.url}</link><guid isPermaLink="true">${origin+p.url}</guid>${p.date.length===10?'<pubDate>'+stamp(p.date)+'</pubDate>':''}<description>${e(p.summary||excerpt(p.content,320))}</description></item>`).join('')}</channel></rss>`);
 await put('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/about/',...posts.map(p=>p.url)].map(u=>'<url><loc>'+origin+u+'</loc></url>').join('')}</urlset>`);
 await put('robots.txt','User-agent: *\nAllow: /\nDisallow: /write/\nSitemap: '+origin+'/sitemap.xml\n');
 await put('_redirects','/rss.xml /feed.xml 301\n');
 await put('version.json',JSON.stringify({version:'time-essays-1',articles:posts.length}));
 console.log('Built '+posts.length+' articles, homepage, writer, search index and RSS.');return posts;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await build();
