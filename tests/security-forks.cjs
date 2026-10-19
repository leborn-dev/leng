'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const {test} = require('node:test');
const fork = (name) => path.resolve(__dirname, '../vendor/security', name);
const braces = require(fork('braces'));
for (const api of ['parse', 'compile', 'expand', 'stringify']) {
  test(`braces ${api} rejects hostile nesting before recursive work`, () => {
    assert.throws(() => braces[api]('{'.repeat(4000) + 'a,b' + '}'.repeat(4000)), {code: 'ERR_BRACES_LIMIT'});
  });
}
for (const api of ['compile', 'expand', 'stringify']) {
  test(`braces ${api} rejects a cyclic supplied AST`, () => {
    const ast = {type: 'root', nodes: []}; ast.nodes.push(ast);
    assert.throws(() => braces[api](ast), {code: 'ERR_BRACES_LIMIT'});
  });
}
test('braces normal public API remains compatible', () => {
  assert.deepEqual(braces.expand('a/{b,c}/{1..3}'), ['a/b/1','a/b/2','a/b/3','a/c/1','a/c/2','a/c/3']);
  assert.equal(braces.stringify(braces.parse('a/{b,c}/d')), 'a/{b,c}/d');
  assert.equal(braces.compile('a/{b,c}/d'), 'a/(b|c)/d');
  assert.deepEqual(braces(['{a,b}', '{x,y}'], {expand:true}), ['a','b','x','y']);
});
test('braces bounds Cartesian products, reverse ranges and repeated AST nodes', () => {
  for (const pattern of ['{a,b}'.repeat(18), '{1000000000..1}', '{1..1000000000}']) {
    assert.throws(() => braces.expand(pattern, {rangeLimit:false}), {code:'ERR_BRACES_LIMIT'});
  }
  const ast = {type:'root', nodes: new Array(100001).fill({type:'text',value:'x'})};
  assert.throws(() => braces.compile(ast), {code:'ERR_BRACES_LIMIT'});
});
test('validate email and URL reject adversarial input promptly, retaining validation', () => {
  const child = spawnSync(process.execPath, ['-e', `const assert=require('node:assert/strict'); const v=require(${JSON.stringify(fork('validate.js'))});
    assert.equal(v.single('valid.name+tag@example.com', {email:true}), undefined);
    assert.ok(v.single('name@[192.168.168.1:80'+'\\\\a'.repeat(80), {email:true}));
    assert.equal(v.single('https://example.com/path?a=1', {url:true}), undefined);
    assert.ok(v.single('http://'+'a'.repeat(80)+'!', {url:true}));
    assert.ok(v.single('http://'+'a-'.repeat(10000)+'!', {url:true}));
    assert.equal(v.single('http://localhost', {url:{allowLocal:true}}), undefined);
    assert.ok(v.single('http://127.0.0.1', {url:true}));
    assert.equal(v.single('http://127.0.0.1', {url:{allowLocal:true}}), undefined);`], {timeout:1500, encoding:'utf8'});
  assert.equal(child.error, undefined, 'URL validation must finish within its resource budget');
  assert.equal(child.status, 0, child.stderr);
});
test('sprintf numeric precision is bounded without a native conversion exception', () => {
  const {sprintf,vsprintf} = require(fork('sprintf-js'));
  for (const spec of ['f','e','g']) {
    assert.doesNotThrow(() => sprintf('%.1000000'+spec, 1.234));
    assert.ok(sprintf('%.1000000'+spec, 1.234).length < 110);
  }
  assert.equal(sprintf('%.0f', 1.6), '2');
  assert.equal(sprintf('%.0g', 1.6), '2');
  assert.equal(vsprintf('%04d %s', [7,'ok']), '0007 ok');
  assert.throws(() => sprintf('%1000000000s','a'), SyntaxError);
});
test('direct braces helper entrypoints enforce the same bounded contract within a time budget', () => {
  const child = spawnSync(process.execPath, ['-e', `const assert=require('node:assert/strict');const p=${JSON.stringify(fork('braces'))};
    const parse=require(p+'/lib/parse');
    for (const value of ['{'.repeat(4000)+'a,b'+'}'.repeat(4000),'('.repeat(4000)+'x'+')'.repeat(4000),'{'.repeat(4000)]) assert.throws(()=>parse(value), {code:'ERR_BRACES_LIMIT'});
    for(const name of ['compile','expand','stringify']){const fn=require(p+'/lib/'+name);const ast={type:'root',nodes:[]};ast.nodes.push(ast);assert.throws(()=>fn(ast),{code:'ERR_BRACES_LIMIT'});}
    const braces=require(p);assert.throws(()=>braces.expand('{a,b}'.repeat(20)),{code:'ERR_BRACES_LIMIT'});
    assert.deepEqual(braces.expand('{5..1}'),['5','4','3','2','1']);`], {timeout:1500, encoding:'utf8'});
  assert.equal(child.error,undefined,'direct helpers must terminate promptly');assert.equal(child.status,0,child.stderr);
});
test('minified validate and sprintf browser entrypoints carry the same security patches', () => {
  const {sprintf}=require(fork('sprintf-js')+'/dist/sprintf.min.js');
  assert.doesNotThrow(()=>sprintf('%.1000000f',1.2));assert.equal(sprintf('%.0g',1.6),'2');
  const child=spawnSync(process.execPath,['-e',`const assert=require('node:assert/strict');const v=require(${JSON.stringify(fork('validate.js')+'/validate.min.js')});assert.ok(v.single('name@[192.168.168.1:80'+'\\\\a'.repeat(80),{email:true}));`],{timeout:1500,encoding:'utf8'});
  assert.equal(child.error,undefined);assert.equal(child.status,0,child.stderr);
});
test('braces rejects non-string AST values before flattening or string conversion', () => {
  const value=[];value.push(value);
  for(const name of ['compile','expand','stringify'])assert.throws(()=>braces[name]({type:'root',nodes:[{type:'text',value}]}),{code:'ERR_BRACES_LIMIT'});
});
