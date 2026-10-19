'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),docsDir=path.join(root,'scripts/docs.angularjs.org-firebase/functions'),codeDir=path.join(root,'scripts/code.angularjs.org-firebase/functions');
process.env.GCLOUD_PROJECT='local-security-test';process.env.FIREBASE_CONFIG=JSON.stringify({projectId:'local-security-test',storageBucket:'local-security-test.appspot.com'});
async function response(server,requestPath){return new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port:server.address().port,path:requestPath},res=>{let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,body}));}).on('error',reject);});}
async function serve(handler){const express=createRequire(path.join(docsDir,'package.json'))('express');const app=express();app.use(handler);const server=http.createServer(app);await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;}
async function main(){
 const docs=require(path.join(docsDir,'index.js'));const cwd=process.cwd();process.chdir(docsDir);
 const outside=path.join(docsDir,'content/__outside_security__.html');fs.mkdirSync(path.join(docsDir,'content/partials'),{recursive:true});assert.ok(!fs.existsSync(outside));fs.writeFileSync(outside,'outside-must-not-leak');
 let server=await serve(docs.sendFile);
 try {for(const pathname of ['/../__outside_security__','/%2e%2e/__outside_security__','/%2e%2e%2f__outside_security__']){const res=await response(server,pathname+'?_escaped_fragment_=1');assert.equal(res.status,404,'snapshot path must stay inside partials: '+pathname);assert.ok(!res.body.includes('outside-must-not-leak'));}}
 finally {await new Promise(r=>server.close(r));fs.unlinkSync(outside);process.chdir(cwd);}
 const {Storage}=createRequire(path.join(codeDir,'package.json'))('@google-cloud/storage');const original=Storage.prototype.bucket;
 Storage.prototype.bucket=function(){return {getFiles:async()=>[[{metadata:{name:'<img src=x onerror=alert(1)>.html'}}],null,{prefixes:['<svg onload=alert(1)>/']}],file:()=>({getMetadata:async()=>{throw {code:404};}})};};
 try {const code=require(path.join(codeDir,'index.js'));server=await serve(code.sendStoredFile);
  try {
   const res=await response(server,'/?q="%3E%3Cscript%3Ealert(1)%3C/script%3E');assert.equal(res.status,200);
   assert.ok(!res.body.includes('<img src=x'),'object names are HTML-escaped');assert.ok(!res.body.includes('<svg onload='),'prefix labels are HTML-escaped');
   assert.ok(res.body.includes('%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E.html'),'file links URI-encode each object name');assert.ok(res.body.includes('&lt;img src=x onerror=alert(1)&gt;.html'));
   assert.ok(res.body.includes('<base href="/">'),'query text must not enter the base URL');
   assert.equal((await response(server,'/%not-valid')).status,400,'malformed path encoding returns a controlled client error');
  } finally {await new Promise(r=>server.close(r));}
 } finally {Storage.prototype.bucket=original;}
 console.log('Actual Firebase HTTP handlers enforce snapshot confinement, escaped listing labels/links, canonical bases and malformed-path errors');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
