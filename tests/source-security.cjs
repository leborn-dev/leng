'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const test=require('node:test');
function definition(file,name){const source=fs.readFileSync(file,'utf8');const start=source.indexOf('function '+name+'(');assert.ok(start>=0);const end=source.indexOf('\n}',start);return source.slice(start,end+2);}
test('Angular shallow/deep extend cannot set the destination prototype',()=>{
 const context={isObject:x=>x!==null&&typeof x==='object',isFunction:x=>typeof x==='function',isDate:x=>x instanceof Date,isRegExp:x=>x instanceof RegExp,isElement:()=>false,isArray:Array.isArray,setHashKey:()=>{}};
 vm.runInNewContext(definition('src/Angular.js','baseExtend')+';this.extend=baseExtend',context);
 for(const deep of [false,true]){const target={};context.extend(target,[JSON.parse('{"__proto__":{"polluted":true},"normal":42}')],deep);assert.equal(target.polluted,undefined);assert.equal(Object.getPrototypeOf(target),Object.prototype);assert.equal(target.normal,42);}
 const data={};context.extend(data,[{constructor:{prototype:{userField:3}}}],true);assert.equal(data.constructor.prototype.userField,3);assert.equal({}.userField,undefined);
});
test('route regex treats a backslash in a literal URL path literally',()=>{
 const c={};vm.runInNewContext(fs.readFileSync('src/routeToRegExp.js','utf8')+';this.route=routeToRegExp',c);
 const result=c.route('/files/\\d+',{});assert.equal(result.regexp.test('/files/123'),false);assert.equal(result.regexp.test('/files/\\ddd'),true);
 assert.ok(c.route('/items/:id',{}).regexp.test('/items/abc'));assert.ok(c.route('/items/:id?',{}).regexp.test('/items'));
});
test('version discovery passes the repository URL as one argument without a shell',()=>{
 const source=fs.readFileSync('lib/versions/version-info.js','utf8');
 const realRequire=require;const calls=[];const packageData=JSON.parse(fs.readFileSync('package.json','utf8'));
 packageData.repository.url='https://github.com/owner/repo.git; touch injected;#.git';
 const context={exports:{},console:{log(){}},process:{env:{}},require(name){
  if(name==='fs')return {existsSync:()=>true,readFileSync:()=>JSON.stringify(packageData)};
  if(name==='shelljs')return {exec(command){calls.push({command,shell:true});return {code:1,stdout:''};}};
  if(name==='node:child_process'||name==='child_process')return {spawnSync(command,args,options){calls.push({command,args,options});return {status:1,stdout:'',stderr:''};}};
  if(name==='process')return context.process;
  return realRequire(name);
 }};
 vm.runInNewContext(source,context);
 const remote=calls.find(call=>call.args&&call.args[0]==='ls-remote');
 assert.ok(remote,'git must receive an argv array');assert.equal(remote.command,'git');assert.equal(remote.args.at(-1),packageData.repository.url);assert.equal(remote.options.shell,false);
});
test('legacy XHTML conversion keeps attributes and raw-text content intact',()=>{
 const c={};vm.runInNewContext(definition('src/jqLite.js','jqLiteExpandXHTML')+';this.expand=jqLiteExpandXHTML',c);
 assert.equal(c.expand('<div/><span/>'),'<div></div><span></span>');
 assert.equal(c.expand('<a title="<div />"><span/></a>'),'<a title="<div />"><span></span></a>');
 for(const tag of ['style','script','textarea','title','svg','math']){
  const input='<'+tag+'/><img src=x onerror="alert(1)">';assert.equal(c.expand(input),input);
 }
 assert.equal(c.expand('<!-- <div/> --> <br/><div/>'),'<!-- <div/> --> <br/><div></div>');
});
test('legacy raw-text conversion requires a complete matching closing tag',()=>{
 const c={};vm.runInNewContext(definition('src/jqLite.js','jqLiteExpandXHTML')+';this.expand=jqLiteExpandXHTML',c);
 assert.equal(c.expand('<style>literal</stylex><div/></style><span/>'),'<style>literal</stylex><div/></style><span></span>');
 assert.equal(c.expand('<svg/><div/>'),'<svg/><div></div>');
 assert.equal(c.expand('<plaintext>literal</plaintext><div/>'),'<plaintext>literal</plaintext><div/>');
});
