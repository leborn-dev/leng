const assert = require('node:assert/strict');
// The application supplies an override after the updated renderer's regression is reproduced.
const factory = process.env.TEST_UPSTREAM_MARKDOWN
  ? require('dgeni-packages/nunjucks/services/renderMarkdown')
  : require('../docs/config/services/renderMarkdown');
const render = factory(text => text);
const result = render('## `$event`\n\n### `ngAttr` for binding to arbitrary attributes\n\n> ## `ngModel`\n');
assert.ok(result.includes('id="-event-"'), 'preserve published event anchor');
assert.ok(result.includes('id="-ngattr-for-binding-to-arbitrary-attributes"'), 'preserve published ngAttr anchor');
assert.ok(result.includes('id="-ngmodel-"'), 'preserve quoted heading anchor');
assert.ok(result.includes('<code>$event</code>'), 'preserve rendered Markdown');
const untrustedHeading = render('## `\" onmouseover=\"alert(1)`');
assert.ok(!/<h[1-6][^>]*\sonmouseover=/.test(untrustedHeading), 'heading IDs cannot inject attributes');
console.log('Published Markdown code-heading anchors and body formatting preserved');
