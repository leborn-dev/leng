'use strict';

var marked = require('marked');

// Keep published heading URLs while retaining the updated Markdown parser.
// Newer Marked passes plain inline text to heading(), whereas the original
// renderer generated IDs from the source token (including code delimiters).
module.exports = function renderMarkdown(trimIndentation) {
  return function(content) {
    var tokens = marked.lexer(content);
    var headings = [];
    function collectHeadings(items) {
      items.forEach(function(token) {
        if (token.type === 'heading') headings.push(token.text);
        if (token.tokens) collectHeadings(token.tokens);
        if (token.items) token.items.forEach(function(item) { collectHeadings(item.tokens); });
      });
    }
    collectHeadings(tokens);
    var renderer = new marked.Renderer();
    renderer.heading = function(text, level) {
      var id = headings.shift().toLowerCase().replace(/[^\w]+/g, '-');
      return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>\n';
    };
    renderer.code = function(code, language, escaped) {
      var result = marked.Renderer.prototype.code.call(this, trimIndentation(code), language, escaped);
      return /\n$/.test(result) ? result : result + '\n';
    };
    return marked.parser(tokens, Object.assign({}, marked.defaults, {renderer: renderer}));
  };
};
