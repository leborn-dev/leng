# Root package and generated module advisory coverage

Dependency audits do not audit the root package itself. The local `1.8.4-local`
banner is a build label, not evidence of an upstream security release. These 11
reviewed advisories were checked against source at `3eeb755887f8e859d934117d17cfc31d1ec83d89`
and their remaining vulnerable paths were reproduced and patched in this PR follow-up.
The generated angular-sanitize module is included even though it is not an installed
dependency of the root package.

| Reviewed advisory | Patched source | Defense and regression |
| --- | --- | --- |
| [CVE-2026-11998](https://github.com/advisories/GHSA-7x27-g8rg-x87w) / GHSA-7x27-g8rg-x87w | [src/ng/sce.js:51](src/ng/sce.js) | Group each complete RegExp before adding whole-URL anchors; retain strings, wildcards and flag-reset behavior. SCE alternate trusted templates; reject evil URL fragment and data-script suffix bypass. |
| [CVE-2025-0716](https://github.com/advisories/GHSA-j58c-ww9w-pwp5) / GHSA-j58c-ww9w-pwp5 | [src/ng/compile.js:3815](src/ng/compile.js) | Apply MEDIA_URL to SVG image href/ngHref and the property context; retain existing xlinkHref protection. Allowed/disallowed SVG href/ng-href and existing xlink/normal SVG suite. |
| [CVE-2024-8373](https://github.com/advisories/GHSA-mqm9-c95h-x2p6) / GHSA-mqm9-c95h-x2p6 | [src/ng/compile.js:2266](src/ng/compile.js) | Sanitize source[srcset] candidates just like img[srcset]. ng-srcset/ng-attr-srcset/srcset/ng-prop-srcset for source and img. |
| [CVE-2024-8372](https://github.com/advisories/GHSA-m9gf-397r-hwpg) / GHSA-m9gf-397r-hwpg | [src/ng/compile.js:2082](src/ng/compile.js) | Tokenize candidate URLs/descriptors; discard invalid descriptors and sanitize every candidate. Trusted URL + malformed xyz descriptor + untrusted next URL; all four binding entries. |
| [CVE-2024-21490](https://github.com/advisories/GHSA-4w4v-5hc9-xrr2) / GHSA-4w4v-5hc9-xrr2 | [src/ng/compile.js:2082](src/ng/compile.js) | Replace overlapping whitespace split regex with one-pass candidate scanning. 300k embedded spaces in timed subprocess; URL commas/data URLs/fractional+exponent density/width and old srcset suite. |
| [CVE-2023-26116](https://github.com/advisories/GHSA-2vrf-hf26-jrp5) / GHSA-2vrf-hf26-jrp5 | [src/Angular.js:1003](src/Angular.js) | Get RegExp flags by slicing after last slash in linear time, retaining IE compatibility without requiring RegExp.flags. 300k-character RegExp source in timed subprocess; flags+lastIndex and complete copy suite. |
| [CVE-2023-26117](https://github.com/advisories/GHSA-2qqx-w9hr-q5gx) / GHSA-2qqx-w9hr-q5gx | [src/ngResource/resource.js:654](src/ngResource/resource.js) | Scan trailing slashes backward once; preserve default slash normalization and opt-out. 300k internal slash run + suffix in timed subprocess; normal resource request and full ngResource suite. |
| [CVE-2023-26118](https://github.com/advisories/GHSA-qwqh-hm9m-p5hr) / GHSA-qwqh-hm9m-p5hr | [src/ng/directive/input.js:15](src/ng/directive/input.js) | Partition scheme/slash prefix/userinfo from the URL body so no slash-prefix backtracking occurs. 300k slash URL in timed subprocess; full legacy URL cases and public URL model; 100k deterministic short-string equivalence samples. |
| [CVE-2022-25869](https://github.com/advisories/GHSA-prc3-vjfx-vhm9) / GHSA-prc3-vjfx-vhm9 | [src/ng/compile.js:2551](src/ng/compile.js) | Do not interpolate IE textarea child data restored by browser history; preserve explicit ng-bind/ng-model and other browsers. Emulated IE-restored payload is not executed; explicit textarea binding/editing and non-IE interpolation remain functional. Actual IE history run unavailable. |
| [CVE-2022-25844](https://github.com/advisories/GHSA-m2h2-264f-f486) / GHSA-m2h2-264f-f486 | [src/ng/filter/filters.js:76](src/ng/filter/filters.js) | Trim whitespace only next to actual currency markers using forward/backward scans. 300k custom locale prefix without marker in timed subprocess; normal marker/symbol handling and currency suite. |
| [CVE-2025-2336](https://github.com/advisories/GHSA-4p4w-6hg8-63wx) / GHSA-4p4w-6hg8-63wx | [src/ngSanitize/sanitize.js:602](src/ngSanitize/sanitize.js) | Recognize SVG image href/xlink:href as image URLs in the HTML sanitizer. Restrictive image policy blocks both SVG href forms, retains trusted SVG and ordinary anchor links; full sanitizer suite. |

## Reference sources and adaptation

[Debian angular.js 1.8.3-1+deb12u1 patches](https://sources.debian.org/patches/angular.js/1.8.3-1+deb12u1/)
provide public backport references for eight CVEs, including the shared srcset
fix. Exact reference patches, original author/origin headers, SHA256 provenance
and Debian copyright/license text are retained in [security/angularjs](security/angularjs).
Debian records the general code and its packaging as MIT; the sanitizer retains
its original Apache-2.0/MPL-1.1/GPL-2+ alternative notice. Existing repository
license notices remain intact.

The changes are adapted rather than applied verbatim: ES5 syntax and old-browser
RegExp behavior are retained; the srcset scanner preserves commas within URLs,
data URLs and normal width/density descriptors instead of blindly splitting on
commas. Historical compact comma-separated candidates and existing formatting
expectations remain covered. Malformed descriptors cannot carry unsanitized
candidates into output. The URL validator retains the old permissive grammar
through fixed partitions; the original URL case table still passes.

The five ReDoS probes run in separate subprocesses with 300,000-character hostile
inputs and a 2.5-second deadline per process (`tests/angular-advisory-redos.cjs`).
All five timed out before the fixes; all finish promptly afterward. Browser
regressions cover actual compilation/SCE/sanitization, not just regular-expression
shape. `tests/angular-dist-security.cjs` checks generated full and minified
framework/module distributions through their public APIs. Existing Angular suites
continue to run without exclusion.

## Internet Explorer textarea compatibility

Internet Explorer may restore user-entered textarea text into its child DOM nodes
on history navigation. Those nodes cannot safely be distinguished from trusted
template expressions. This fork therefore disables **implicit child-text
interpolation inside textarea on IE only**. Explicit `ng-model`, explicit `ng-bind`,
and interpolation on other browsers remain available and are tested. Replace:

```html
<textarea>{{ message }}</textarea>
```

with the explicit trusted template expression:

```html
<textarea ng-bind="message"></textarea>
```

Use `ng-model` for editable values. This limited security compatibility change
matches the documented [official NES mitigation](https://support.herodevs.com/hc/en-us/articles/23980428800141-AngularJS-1-5-X-NES-Release-Notes).
The [published reproduction](https://neverendingsupport.github.io/angularjs-poc-cve-2022-25869/)
explains the browser-history path. The regression reconstructs restored DOM text
with IE detection enabled and confirms it is never evaluated. Actual IE history
navigation was not executed on this Mac; that platform limit is not presented as
a successful IE run.

## Future updates

Compare each advisory's vulnerable path with the maintained source, rerun both
negative probes and normal compatibility cases, regenerate full/minified builds,
and run the standard Angular suite plus all dependency audits. A new version
label or a zero dependency audit alone does not resolve these source advisories.
