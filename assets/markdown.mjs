// A small, HTML-escaping renderer shared by the build and the writing preview.
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function safeUrl(value, image = false) {
  const url = String(value).trim();
  if (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || (!image && /^#[\w-]+$/.test(url))) return escapeHtml(url);
  return '';
}
export function plainText(text) {
  return String(text).replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^\[\^[^\]]+\]:.*$/gm, '').replace(/\[\^[^\]]+\]/g, '').replace(/^[#>\-*\d.)\s]+/gm, '').replace(/[*`_]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
}
export function excerpt(text, length = 112) {
  const lines = String(text).split('\n').map(s => s.trim()).filter(s => s && !/^#|^---$|^\*$|^https?:|^\[\^/.test(s));
  const p = plainText(lines.filter((s,i) => !(i < 3 && s.length <= 4 && !/[。！？，,.!?]/.test(s))).map(s=>s.replace(/^>\s?/, '').replace(/^[-*]\s+/, '')).join(' '));
  return p.length > length ? p.slice(0,length).replace(/[，、；\s]+$/, '') + '…' : p;
}
export function renderMarkdown(text) {
  const notes = new Map();
  const body = String(text || '').replace(/^\[\^([\w-]+)\]:\s*(.*)$/gm, (_, id, content) => {notes.set(id,content);return '';});
  const refs = [];
  function inline(source) {
    const tokens = [];
    const token = html => {const key='\u0000'+tokens.length+'\u0000';tokens.push(html);return key;};
    let s = String(source).replace(/\u0000/g, '');
    s = s.replace(/`([^`]+)`/g, (_, c) => token('<code>'+escapeHtml(c)+'</code>'));
    s = s.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, caption) => {
      const href=safeUrl(url,true); if(!href)return escapeHtml(alt);
      return token('<span class="inline-image"><img loading="lazy" src="'+href+'" alt="'+escapeHtml(alt)+'">'+(caption?'<span class="image-caption">'+escapeHtml(caption)+'</span>':'')+'</span>');
    });
    s = s.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_, label, url) => {const href=safeUrl(url);return token(href?'<a href="'+href+'"'+(/^https?:/.test(url)?' target="_blank" rel="noopener noreferrer"':'')+'>'+escapeHtml(label)+'</a>':escapeHtml(label));});
    s = s.replace(/\[\^([\w-]+)\]/g, (_, id) => {if(!notes.has(id))return _;if(!refs.includes(id))refs.push(id);return token('<sup id="ref-'+id+'"><a href="#note-'+id+'" aria-label="脚注 '+(refs.indexOf(id)+1)+'">'+(refs.indexOf(id)+1)+'</a></sup>');});
    s = s.replace(/https?:\/\/[^\s<>\u0000]+/g, url => {
      const clean=url.replace(/[。；，、）)]+$/,'');
      return token('<a href="'+safeUrl(clean)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(clean)+'</a>')+url.slice(clean.length);
    });
    s=escapeHtml(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>');
    return s.replace(/\u0000(\d+)\u0000/g,(_, n)=>tokens[Number(n)]);
  }
  const lines=body.split(/\r?\n/), headings=[];
  let html='', para=[], list='', quote=[], code=null;
  function flushPara(){if(para.length){html+='<p>'+inline(para.join(' '))+'</p>';para=[];}}
  function flushList(){if(list){html+='</'+list+'>';list='';}}
  function flushQuote(){if(quote.length){html+='<blockquote>'+quote.map(s=>'<p>'+inline(s)+'</p>').join('')+'</blockquote>';quote=[];}}
  for(const raw of lines){
    const line=raw.trim();
    if(/^```/.test(line)){flushPara();flushList();flushQuote();if(code!==null){html+='<pre><code>'+escapeHtml(code.join('\n'))+'</code></pre>';code=null;}else code=[];continue;}
    if(code!==null){code.push(raw);continue;}
    if(!line){flushPara();flushList();flushQuote();continue;}
    if(/^>\s?/.test(line)){flushPara();flushList();quote.push(line.replace(/^>\s?/,''));continue;}
    flushQuote();
    const h=line.match(/^(#{1,4})\s+(.+)$/);
    if(h){flushPara();flushList();const id='section-'+(headings.length+1);const level=Math.max(2,h[1].length);headings.push({id,text:plainText(h[2]),level});html+='<h'+level+' id="'+id+'" tabindex="-1">'+inline(h[2])+'</h'+level+'>';continue;}
    if(/^(---+|\*|\* \* \*)$/.test(line)){flushPara();flushList();html+='<div class="divider" aria-hidden="true">· · ·</div>';continue;}
    const li=line.match(/^(?:([-*])\s+|\d+[.)]\s+)(.+)$/);
    if(li){flushPara();const type=li[1]?'ul':'ol';if(list!==type){flushList();html+='<'+type+'>';list=type;}html+='<li>'+inline(li[2])+'</li>';continue;}
    flushList();para.push(line);
  }
  flushPara();flushList();flushQuote();if(code!==null)html+='<pre><code>'+escapeHtml(code.join('\n'))+'</code></pre>';
  if(refs.length)html+='<section class="footnotes" aria-label="脚注"><h2>注释</h2><ol>'+refs.map(id=>'<li id="note-'+id+'">'+inline(notes.get(id))+' <a href="#ref-'+id+'" aria-label="返回正文">↩</a></li>').join('')+'</ol></section>';
  return {html,headings};
}
