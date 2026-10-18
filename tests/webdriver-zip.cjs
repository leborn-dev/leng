const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createRequire} = require('node:module');
const fromProtractor = createRequire(require.resolve('protractor/package.json'));
const fromManager = createRequire(fromProtractor.resolve('webdriver-manager/package.json'));
const AdmZip = require(process.env.TEST_ADMZIP_MODULE || fromManager.resolve('adm-zip'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'leng-driver-zip-'));
try {
  const archive = new AdmZip();
  archive.addFile('driver/chromedriver', Buffer.from('local driver fixture'));
  const zipFile = path.join(temp, 'driver.zip');
  archive.writeZip(zipFile);
  const output = path.join(temp, 'normal');
  new AdmZip(zipFile).extractAllTo(output, true);
  assert.equal(fs.readFileSync(path.join(output, 'driver/chromedriver'), 'utf8'), 'local driver fixture');
  const outside = path.join(temp, 'outside');
  const destination = path.join(temp, 'destination');
  fs.mkdirSync(outside); fs.mkdirSync(destination);
  fs.symlinkSync(outside, path.join(destination, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
  const malicious = new AdmZip(); malicious.addFile('link/escaped.txt', Buffer.from('must stay inside'));
  try { malicious.extractAllTo(destination, true); } catch (expected) {}
  assert.ok(!fs.existsSync(path.join(outside, 'escaped.txt')), 'extraction must not follow a destination symlink');
  console.log('Actual webdriver-manager ZIP dependency: archive roundtrip and destination-symlink protection passed');
} finally { fs.rmSync(temp, {recursive: true, force: true}); }
