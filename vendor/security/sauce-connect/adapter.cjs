'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const net=require('node:net');
const releases={
 'linux-x64':['linux.x86_64.tar.gz','b3bd7fe840391fd4e9e45143419467a166b50d500b8549cb9e130e1103afa88b'],
 'linux-arm64':['linux.aarch64.tar.gz','559fa106899c1735ecfa227499d9ef007d4b048dd5e3decbf6a13c627fa32a92'],
 'darwin-x64':['darwin.all.zip','3b48b144a262c254cfb86483557d80474d696411563d69b2a90c4c12bed7e339'],
 'darwin-arm64':['darwin.all.zip','3b48b144a262c254cfb86483557d80474d696411563d69b2a90c4c12bed7e339'],
 'win32-x64':['windows.x86_64.zip','86b58a2ff46fe709ea1953f7ceca2d451744b723cf0d7eb92d323042290de88c'],
 'win32-arm64':['windows.aarch64.zip','a1c0217fb0592c2426357961c6aec40d97891e91bb521ef08bb661c9fbd74216']
};
function verifyArchive(bytes,expected) {
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw new Error('Sauce Connect archive checksum mismatch');
}
async function ensureBinary() {
 if(process.env.LENG_SAUCE_BINARY)return path.resolve(process.env.LENG_SAUCE_BINARY);
 const release=releases[process.platform+'-'+process.arch];if(!release)throw new Error('Unsupported Sauce Connect platform');
 const name=process.platform==='win32'?'sc.exe':'sc';const destination=path.join(__dirname,'bin/native',name);
 if(fs.existsSync(destination))return destination;
 const url='https://saucelabs.com/downloads/sauce-connect/5.5.3/sauce-connect-5.5.3_'+release[0];
 const response=await fetch(url,{signal:AbortSignal.timeout(300000)});
 if(!response.ok||new URL(response.url).protocol!=='https:')throw new Error('Secure Sauce Connect download failed');
 const bytes=Buffer.from(await response.arrayBuffer());verifyArchive(bytes,release[1]);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'leng-sauce-download-'));
 try {
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  let binary;
  if(release[0].endsWith('.zip')) {
   const AdmZip=require('adm-zip');const zip=new AdmZip(bytes);const entry=zip.getEntry(name);
   if(!entry||entry.isDirectory)throw new Error('Sauce Connect executable is absent from verified archive');
   binary=zip.readFile(entry);
  } else {
   const archive=path.join(temp,'release.tar.gz');fs.writeFileSync(archive,bytes,{mode:0o600});
   execFileSync('tar',['-xzf',archive,'-C',temp,name]);binary=fs.readFileSync(path.join(temp,name));
  }
  fs.writeFileSync(destination,binary,{mode:0o700});return destination;
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
function translateLegacy(input) {
 const args=['run'],env={};let pidfile,readyfile;
 const renamed={'--logfile':'--log-file','--tunnel-identifier':'--tunnel-name','--user':'--username'};
 for(let i=0;i<input.length;i++) {
  const key=input[i],value=input[i+1];
  if(key==='--pidfile'){pidfile=value;i++;}
  else if(key==='--readyfile'){readyfile=value;i++;}
  else if(key==='--api-key'){env.SAUCE_ACCESS_KEY=value;i++;}
  else if(key==='--no-ssl-bump-domains'){args.push('--tls-passthrough-domains',value==='all'?'.*':domainRegex(value));i++;}
  else if(key==='--tunnel-domains'){args.push(key,domainRegex(value));i++;}
  else if(renamed[key]){args.push(renamed[key],value);i++;}
  else args.push(key);
 }
 if(!args.includes('--region'))args.push('--region',process.env.SAUCE_REGION||'us-west');
 return {args,env,pidfile,readyfile};
}
function domainRegex(domains) {return domains.split(',').map(domain=>'^'+domain.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$').join(',');}
async function availablePort() {
 return new Promise((resolve,reject)=>{const server=net.createServer();server.on('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});
}
async function run(input) {
 const binary=await ensureBinary();
 if(input[0]==='--version'||input[0]==='--help'){const child=spawn(binary,input[0]==='--version'?['version']:input,{stdio:'inherit'});child.on('exit',code=>process.exitCode=code||0);return;}
 const translated=translateLegacy(input);const port=await availablePort();
 translated.args.push('--api-address','127.0.0.1:'+port);
 const child=spawn(binary,translated.args,{env:{...process.env,...translated.env},stdio:'inherit'});
 const cleanup=()=>{for(const file of [translated.readyfile,translated.pidfile])if(file)fs.rmSync(file,{force:true});};
 child.once('error',error=>{cleanup();console.error(error.message);process.exitCode=1;});
 if(translated.pidfile)fs.writeFileSync(translated.pidfile,String(process.pid),{mode:0o600});
 const timer=setInterval(async()=>{
  try {const response=await fetch('http://127.0.0.1:'+port+'/readyz',{signal:AbortSignal.timeout(1000)});
   if(response.ok){if(translated.readyfile)fs.writeFileSync(translated.readyfile,'ready',{mode:0o600});clearInterval(timer);}
  }catch(_){}
 },100);
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>child.kill(signal));
 child.once('exit',(code,signal)=>{clearInterval(timer);cleanup();process.exitCode=code===null?(signal?1:0):code;});
}
module.exports={run,ensureBinary,translateLegacy,verifyArchive,releases};
