const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createRequire} = require('node:module');
const root = path.join(__dirname, '..');
process.env.GCLOUD_PROJECT = 'local-security-test';
process.env.FIREBASE_CONFIG = JSON.stringify({projectId: 'local-security-test', storageBucket: 'local-security-test.appspot.com'});
const docsDir = path.join(root, 'scripts/docs.angularjs.org-firebase/functions');
const codeDir = path.join(root, 'scripts/code.angularjs.org-firebase/functions');

async function test() {
  const docs = require(path.join(docsDir, 'index.js'));
  const code = require(path.join(codeDir, 'index.js'));
  assert.equal(typeof docs.sendFile, 'function');
  assert.equal(typeof code.sendStoredFile, 'function');
  assert.equal(typeof code.deleteOldSnapshotZip, 'function');
  assert.equal(code.deleteOldSnapshotZip.__trigger.eventTrigger.eventType, 'google.storage.object.finalize');
  const express = createRequire(path.join(docsDir, 'package.json'))('express');
  const originalCwd = process.cwd();
  process.chdir(docsDir);
  const app = express(); app.use(docs.sendFile);
  const server = http.createServer(app);
  const partialDir = path.join(docsDir, 'content/partials');
  const fixture = path.join(partialDir, '__security_test__.html');
  assert.ok(!fs.existsSync(fixture), 'fixture path must be unused');
  fs.mkdirSync(partialDir, {recursive: true});
  fs.writeFileSync(fixture, '<h1>local snapshot</h1>');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    let response = await fetch(url + '/__security_test__?_escaped_fragment_=1');
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('cache-control').includes('max-age=3600'));
    assert.ok((await response.text()).includes('<h1>local snapshot</h1>'));
    response = await fetch(url + '/__missing_security_test__?_escaped_fragment_=1');
    assert.equal(response.status, 404);
    await response.text();
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.unlinkSync(fixture);
    process.chdir(originalCwd);
  }
  console.log('Firebase v1 exports, storage trigger metadata, HTTP snapshot/cache and 404 passed locally');
}
test().catch(error => { console.error(error); process.exitCode = 1; });
