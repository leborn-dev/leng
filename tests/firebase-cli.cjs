const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
// Keep CLI usage/config state separate from the user's global Firebase profile.
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'leng-cli-profile-'));
process.env.XDG_CONFIG_HOME = profile;
try {
  const {getRuntimeChoice} = require('firebase-tools/lib/deploy/functions/runtimes/node/parseRuntimeAndValidateSDK');
  const {Config} = require('firebase-tools/lib/config');
  for (const name of ['code.angularjs.org-firebase', 'docs.angularjs.org-firebase']) {
    const dir = path.join(__dirname, '../scripts', name);
    assert.equal(getRuntimeChoice(path.join(dir, 'functions')), 'nodejs22', 'CLI must accept function Node22 engine');
    const config = new Config(JSON.parse(fs.readFileSync(path.join(dir, 'firebase.json'), 'utf8')), {projectDir: dir});
    assert.ok(config.get('hosting.rewrites').length > 0, 'hosting rewrite configuration loads');
    assert.equal(config.get('functions.source'), 'functions', 'existing functions directory is detected');
  }
  console.log('Actual Firebase CLI accepts both Node22 runtimes and parses existing hosting/function configs locally');
} finally { fs.rmSync(profile, {recursive: true, force: true}); }
