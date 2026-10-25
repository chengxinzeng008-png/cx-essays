import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const parsed=new URL(req.url,'http://localhost');const url=decodeURIComponent(parsed.pathname);const target=path.resolve(root,'.'+url);if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}let dest=target;try{if((await fs.stat(dest)).isDirectory())dest=path.join(dest,'index.html');}catch{}try{const data=await fs.readFile(dest);res.writeHead(200,{'Content-Type':mime[path.extname(dest)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await fs.readFile(path.join(root,'404.html')));}}catch{res.writeHead(400);res.end();}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
