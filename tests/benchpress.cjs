'use strict';
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'leng-benchpress-'));
async function main(){
 const fixtures=path.join(temp,'benchmarks'),build=path.join(temp,'build');fs.mkdirSync(path.join(fixtures,'fixture'),{recursive:true});
 fs.writeFileSync(path.join(fixtures,'fixture','bp.conf.js'),"module.exports=function(config){config.set({scripts:[],modules:[]});};\n");fs.writeFileSync(path.join(fixtures,'fixture','main.html'),'<p>benchmark fixture</p>');
 const cli=require('angular-benchpress/lib/cli');
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('benchmark build timed out')),15000);cli.build({buildPath:build,benchmarksPath:fixtures},()=>{clearTimeout(timeout);resolve();});});
 for(const name of ['bp.js','auto-bp.js','bootstrap.min.css','underscore-min.js','index.html','index-auto.html'])assert.ok(fs.statSync(path.join(build,'fixture',name)).size>100,name);
 assert.ok(fs.readFileSync(path.join(build,'fixture','index.html'),'utf8').includes('benchmark fixture'));
 for(const name of ['bp.js','auto-bp.js']) require('acorn').parse(fs.readFileSync(path.join(build,'fixture',name),'utf8'),{ecmaVersion:5});
 const http=require('node:http'),{spawn}=require('node:child_process');
 for(const mode of ['index.html','index-auto.html']) {
  const file=path.join(build,'fixture',mode);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('<head>','<head><script>window.addEventListener("error",function(e){document.documentElement.setAttribute("data-bp-error",(document.documentElement.getAttribute("data-bp-error")||"")+"|"+e.message);});</script>').replace('</body>','<script>document.body.setAttribute("data-bp-initialized", window.bp && window.bp.runner && window.bp.variables ? "ok" : "failed");</script></body>'));
 }
 const server=http.createServer((req,res)=>{
  const file=path.resolve(build,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(build+path.sep)){res.statusCode=403;return res.end();}
  try{if(file.endsWith('.js'))res.setHeader('Content-Type','text/javascript');else if(file.endsWith('.css'))res.setHeader('Content-Type','text/css');else if(file.endsWith('.html'))res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(file));}catch(_){res.statusCode=404;res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  for(const mode of ['index.html','index-auto.html']) {
   const executable=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
   const output=await new Promise((resolve,reject)=>{
    const child=spawn(executable,['--headless','--disable-gpu','--no-first-run','--user-data-dir='+path.join(temp,'chrome-'+mode),'--virtual-time-budget=1000','--dump-dom','http://127.0.0.1:'+server.address().port+'/fixture/'+mode]);
    let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Chrome benchmark check timed out'));},15000);
    child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(new Error(stderr));});
   });
   assert.ok(!output.includes('data-bp-error='), 'benchmark page must not throw: '+output.slice(0,1000));
   assert.ok(output.includes('data-bp-initialized="ok"'),mode+' initializes actual DI/Rx facade in Chrome: '+output.slice(0,800));
  }
 } finally {await new Promise(resolve=>server.close(resolve));}
 console.log('Benchpress builds normal/automatic benchmark pages and initializes its DI/Rx browser facade');
}
main().finally(()=>fs.rmSync(temp,{recursive:true,force:true})).catch(error=>{console.error(error);process.exitCode=1;});
