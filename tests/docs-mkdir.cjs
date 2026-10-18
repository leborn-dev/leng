const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createRequire} = require('node:module');
const fromDgeni = createRequire(require.resolve('dgeni-packages/package.json'));
const mkdir = fromDgeni('mkdirp-promise');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leng-docs-mkdir-'));
  try {
    const nested = path.join(dir, 'nested', 'docs');
    await mkdir(nested);
    assert.ok(fs.statSync(nested).isDirectory());
    await mkdir(nested);
    console.log('Dgeni callback mkdirp adapter creates nested directories and accepts existing paths');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
})().catch(error => { console.error(error); process.exitCode = 1; });
