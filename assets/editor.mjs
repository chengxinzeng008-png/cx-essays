import {renderMarkdown} from './markdown.mjs';
const form=document.getElementById('write-form'),title=document.getElementById('write-title'),date=document.getElementById('write-date'),content=document.getElementById('write-content'),status=document.getElementById('draft-status');
const draftKey='cz-writing-draft-v1';
const today=new Date();const localDate=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
let draft={id:'entry-'+Date.now().toString(36)+'-'+crypto.randomUUID().slice(0,6),title:'',date:localDate,content:''};
try{const saved=JSON.parse(localStorage.getItem(draftKey));if(saved&&typeof saved.title==='string'&&typeof saved.content==='string'&&/^[a-z0-9-]+$/.test(saved.id)&&/^\d{4}-\d{2}-\d{2}$/.test(saved.date))draft=saved;}catch{}
title.value=draft.title;date.value=draft.date;content.value=draft.content;
if(draft.title||draft.content)status.textContent='已恢复本机草稿，继续写就好。';
function save(){draft={...draft,title:title.value,date:date.value,content:content.value};try{localStorage.setItem(draftKey,JSON.stringify(draft));status.textContent='草稿已保存在本机 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});}catch{status.textContent='当前浏览器无法保存草稿，请及时导出文章。';}if(!document.getElementById('write-preview').hidden)preview(false);}
form.addEventListener('input',save);
function preview(scroll=true){document.getElementById('preview-title').textContent=title.value||'无题';document.getElementById('preview-date').textContent=date.value;document.getElementById('preview-body').innerHTML=renderMarkdown(content.value).html;document.getElementById('write-preview').hidden=false;if(scroll&&matchMedia('(max-width:640px)').matches)document.getElementById('write-preview').scrollIntoView({block:'start'});}
document.getElementById('preview-button').addEventListener('click',()=>preview());
document.getElementById('close-preview').addEventListener('click',()=>{document.getElementById('write-preview').hidden=true;content.focus();});
function exportArticle(){if(!form.reportValidity())return false;save();const meta={id:draft.id,title:title.value.trim(),date:date.value,lang:/[\u4e00-\u9fff]/.test(content.value)?'zh':'en'};if(!meta.title||!content.value.trim()){status.textContent='请填写标题和正文。';return false;}const source='---\n'+Object.entries(meta).map(([k,v])=>k+': '+JSON.stringify(v)).join('\n')+'\n---\n\n'+content.value.trim()+'\n';const blob=new Blob([source],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=draft.id+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}
document.getElementById('export-button').addEventListener('click',exportArticle);
form.addEventListener('submit',event=>{event.preventDefault();if(exportArticle()){document.getElementById('publish-guide').hidden=false;document.getElementById('publish-guide').scrollIntoView({block:'nearest'});status.textContent='文章文件已导出，完成上传并提交后即可公开。';}});
