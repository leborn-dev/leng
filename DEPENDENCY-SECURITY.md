# Dependency security maintenance (2026-10-18)

All three Yarn lockfiles (root and both Firebase functions folders) are updated.
Angular library source and browser APIs are unchanged. Development `.nvmrc` now
selects Node22; the root package's consumer engine range is retained.

Firebase functions declare Node22, firebase-functions7.4+, firebase-admin14.5+
and (for code.angularjs.org) Google Cloud Storage7.19+. Both entry points
explicitly import `firebase-functions/v1`, preserving the existing first-
generation HTTP/storage trigger definitions. Firebase Admin is a required SDK
peer. Root Firebase CLI15.34.0 replaces CLI9, whose actual runtime selector
rejects Node22. Both firebase.json files explicitly declare the functions source
for the current CLI. Its runtime selector/config parser, version and deploy-help
commands are tested locally with isolated CLI profile directories. These are dependency/runtime changes, not a production deployment;
deploying requires selecting Node22 and testing real cloud integrations.

The root Jasmine runner is pinned to2.0.0: the next patch2.0.1 uses an obsolete
git:// reporter URL, and Jasmine3 failed the existing toThrowError matcher test
while baseline2.0.0 passed. It remains an old development runner with inherited
findings, not a security-clean replacement.

## Three narrow dependency compatibility/security choices

1. `dgeni-packages/mkdirp-promise/mkdirp:0.5.6`: the promise adapter calls the old
   callback API but declares mkdirp `*`, otherwise selecting major3's object
   export and failing `mkdirp is not a function`. The original lock used
   mkdirp0.5.1/minimist0.0.8; the scoped version uses callback-compatible
   mkdirp0.5.6 and minimist1.2.8. The create-existing-directory regression fails
   before this resolution and passes afterward.
2. Marked is4.3.0 at the root and via `dgeni-packages/marked`. Its actual CJS
   export supports lexer/parser/Renderer; this removes the old Marked XSS/ReDoS
   advisories, including the0.3.19 email ReDoS that an ordinary minor refresh
   would introduce. Marked4 has a changed heading API and nested lexer tokens.
   A local renderMarkdown service preserves published heading IDs from source
   tokens, including code delimiters, and retains upstream code indentation.
   IDs contain only word characters/hyphens. Regression tests cover `$event`,
   ngAttr, quoted headings and attribute-injection resistance. Browser debug,
   jQuery and test deployments use the current UMD asset path.
3. `protractor/webdriver-manager/adm-zip:0.6.1`: old versions retain ZIP
   traversal/DoS findings. This targeted dependency passes the real manager's
   normal archive extraction API and a destination-symlink regression that
   fails on0.5.18. It does not update the entire Protractor browser stack.

These resolutions do not suppress audit findings. The updated renderer avoids
downgrading Marked or disabling the documentation's anchor validation. A
complete package build passes all documentation link checks.

## Validation

- Node22 clean frozen function installs and actual v1 export loading passed.
- Existing i18n tests:18+9 tests, zero failures.
- Actual Firebase HTTP export: localhost snapshot/cache-header/404 passed.
  Storage trigger type/export metadata is preserved; real cloud storage,
  deletion, authentication and deployment were not exercised.
- Docs callback adapter, Markdown anchors/escaping and webdriver ZIP roundtrip/
  destination-symlink protection passed.
- Full `CI=1 yarn grunt package` passed in an isolated Node22 container with
  Java: Angular bundle generation/minification, documentation link validation,
  and compression of3296 files. Remote version metadata lookup was used.
- Real Chromium loaded generated build/angular.js and verified two-way input
  binding and click counter0->1. All Angular browser/unit/e2e matrices are not
  claimed. Native/dependency install scripts were disabled during the recorded
  frozen installs; explicit build/test steps were run separately.

## Audit scope and residuals

Yarn audit counts advisories per resolution path, unlike GitHub alert counts.
The root tree drops1065->200 paths (remaining critical19/high110/moderate63/
low8). These root dependencies are development build/test/deployment tools;
the AngularJS framework source itself is outside dependency-graph coverage.
The unchanged old browser runtime is not certified safe by this audit.

code.angularjs.org functions drop140->3 paths (all moderate, UUID through Google
Cloud Storage/gaxios); docs.angularjs.org functions drop180->2 (all moderate,
sprintf-js through development ESLint). Both have zero high/critical findings.
Neither function tree introduces a new advisory ID.

The root retains Grunt/Gulp/Karma/Protractor/Firebase CLI/benchmark stacks and
patchless node-forge/xmldom/request/ip/elliptic/other utilities. Large tooling or
framework migrations are not included. No force, audit suppression or alert
dismissal is used.

One new root advisory ID remains versus the original lock:
GHSA-q58r-hwc8-rm9j on angular-benchpress's Bootstrap3.4.1 (popover/tooltip XSS,
no patched Bootstrap3 version). That CLI copies only dist/css/bootstrap.min.css;
its generated template loads the CSS, not Bootstrap JavaScript. This reachability
boundary is recorded, not treated as removal of the vulnerable npm package.
The root's separate pre-existing Bootstrap3.1.1 findings also remain. Removing or
replacing the legacy benchmark/tooling stack needs a separate compatibility
migration; no Bootstrap5 rewrite is included.

Sources:
- https://github.com/advisories/GHSA-5v2h-r2cx-5xgj
- https://github.com/cthackers/adm-zip/releases/tag/v0.6.1
