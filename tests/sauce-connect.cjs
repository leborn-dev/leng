'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const test=require('node:test');
const adapterPath=path.resolve(__dirname,'../vendor/security/sauce-connect/adapter.cjs');
test('Sauce Connect 5 adapter preserves legacy tunnel settings and keeps the key out of argv',()=>{
 const {translateLegacy,verifyArchive}=require(adapterPath);
 const x=translateLegacy(['--no-ssl-bump-domains','all','--logfile','logs','--pidfile','pid','--readyfile','ready','--tunnel-identifier','test-tunnel','--user','test-user','--api-key','test-only-placeholder','--tunnel-domains','example.test']);
 assert.deepEqual(x.args,['run','--tls-passthrough-domains','.*','--log-file','logs','--tunnel-name','test-tunnel','--username','test-user','--tunnel-domains','^example\\.test$','--region','us-west']);
 assert.equal(x.env.SAUCE_ACCESS_KEY,'test-only-placeholder'); assert.ok(!x.args.includes('test-only-placeholder'));
 assert.equal(x.pidfile,'pid');assert.equal(x.readyfile,'ready');
 assert.throws(()=>verifyArchive(Buffer.from('tampered'),'0'.repeat(64)),/checksum/);
});
test('adapter creates legacy readiness/PID files and forwards termination to SC5',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'leng-sauce-test-'));
 const fake=path.join(dir,'fake-sc'); const marker=path.join(dir,'terminated');
 fs.writeFileSync(fake,`#!/usr/bin/env node\nconst http=require('node:http'),fs=require('node:fs');const a=process.argv;const port=a[a.indexOf('--api-address')+1].split(':').pop();const s=http.createServer((q,r)=>{r.end('ready');}).listen(+port,'127.0.0.1');process.on('SIGTERM',()=>{fs.writeFileSync(${JSON.stringify(marker)},'yes');s.close(()=>process.exit(0));});\n`); fs.chmodSync(fake,0o700);
 const pidfile=path.join(dir,'pid'),readyfile=path.join(dir,'ready');
 const child=cp.spawn(process.execPath,[path.resolve(__dirname,'../vendor/security/sauce-connect/bin/sc'),'--pidfile',pidfile,'--readyfile',readyfile,'--tunnel-identifier','fixture'],{env:{...process.env,LENG_SAUCE_BINARY:fake},stdio:['ignore','pipe','pipe']});
 let output='';child.stderr.on('data',x=>output+=x);
 try {
  const end=Date.now()+5000;while(!fs.existsSync(readyfile)&&Date.now()<end)await new Promise(r=>setTimeout(r,25));
  assert.ok(fs.existsSync(readyfile),output);assert.equal(fs.readFileSync(pidfile,'utf8'),String(child.pid));
  const closed=new Promise(r=>child.on('close',r));child.kill('SIGTERM');await closed;
  assert.ok(fs.existsSync(marker));assert.ok(!fs.existsSync(readyfile));assert.ok(!fs.existsSync(pidfile));
 } finally {child.kill('SIGKILL');fs.rmSync(dir,{recursive:true,force:true});}
});
