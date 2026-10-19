# Security maintenance (2026-10-19)

The root and both Firebase function Yarn trees now have zero known audit
findings after clean frozen installs. Root audit covers 1,611 dependencies;
code.angularjs.org functions covers 246; docs.angularjs.org functions covers
330. This supersedes the residual findings recorded on 2026-10-18. Node
22.12+ and Yarn 1.22 are required for development; both functions retain their
Node 22 and `firebase-functions/v1` trigger contracts.

## Changes and compatibility

Gulp 5, Karma 6, Grunt 1.6/current plugins, Jasmine 5 for Node i18n tests,
current Google Cloud Storage and ESLint replace obsolete development/runtime
tools. Browser Jasmine remains compatible with the existing Angular suite.
Targeted transitive updates preserve the callback mkdirp and request contracts,
while removing the vulnerable legacy implementations. Full build, CLI, docs,
benchmark and browser entry points are exercised by regression tests.

Patchless dependencies use maintained local security forks, with the full
original functionality retained. [The fork record](vendor/security/README.md)
and each `UPSTREAM.json` identify original versions, official tarball integrity,
advisories, actual patches, limits, licenses and update procedures. Audit cannot
assess custom source code; the tests and source review are required alongside
all three audits. No audit suppression or alert dismissal is used.

Angular source now prevents prototype pollution through `__proto__` and
inherited deep-merge targets while preserving legitimate constructor/prototype
data. jqLite's optional XHTML expansion uses a token scanner that preserves
quoted attributes, comments, raw text and foreign content. Literal route/error
patterns are escaped fully; version tooling runs argument arrays without a
shell. Legacy jQuery 2.1/2.2 fixtures remain separate patched old APIs and load
local assets. Supporting tests no longer use unsafe partial sanitization.

Firebase HTTP handlers confine snapshot reads to `content/partials`, reject
malformed paths, HTML-escape storage listings, encode object-name links and
construct query-free same-origin bases. Real local HTTP requests exercise these
boundaries, with only the cloud Storage SDK stubbed.

The Sauce Connect adapter downloads official SC 5.5.3 archives over HTTPS,
checks pinned official SHA256 before extraction, and translates the previous
PID/readiness/tunnel interface. Credentials are passed by environment. Its
process lifecycle is tested, and the official Mac binary's version and supported
flags were verified. Starting an authenticated remote tunnel is outside local
verification. No production deployment was performed.

## Verification

- Three clean frozen installs and all three live Yarn audits: success, zero findings.
- Angular Chrome 155 matrix: 26,384 passing tests across jqLite, jQuery 3.7,
  patched jQuery 2.2/2.1, modules, ngAnimate and ngMock; docs: 15 passing.
- Promise/A+ conformance: 872 passing; Node i18n suites: 18 + 9 passing.
- `grunt ci-checks package`: success, full bundles/docs/link validation/archive.
- Security regressions cover braces public/direct AST APIs and resource bounds,
  validate.js ReDoS, sprintf precision/width, Angular source and Firebase HTTP.
- Full and minified jQuery 2.1/2.2/3 + Bootstrap: six security/compatibility
  cases per variant in actual Chrome. All shipped fork browser scripts and both
  benchmark bundles parse as ES5; normal and automatic benchmark pages initialize
  in actual Chrome. Installed fork entry points match reviewed vendor files.
- Existing markdown, filesystem, ZIP/symlink and Firebase CLI/export tests pass.

Chrome 155 natively normalizes datetime-local fractional seconds; four string
expectations now compare to a native input's normalized representation while
retaining the date/millisecond assertions. The same failures were reproduced
against the original source before changing those expectations. No browser
suite or test was excluded. Legacy IE/Safari and authenticated cloud/browser
service runs have not been performed. GitHub CodeQL must reanalyze the final PR;
local regressions cover the 17 initially reported source findings, but a clean
hosted analysis is a separate integration check.
