/* global $, describe, it, expect */
'use strict';
describe('jQuery 2.1 owner cache identity', function() {
  function expando(owner) { return Object.getOwnPropertyNames(owner).filter(function(key) { return key.indexOf($.expando) === 0; })[0]; }
  it('keeps public data isolated from inherited/malformed metadata', function() {
    var parent = {}; $.data(parent, 'normal', 1); var key = expando(parent);
    var inherited = Object.create(parent); expect($.hasData(inherited)).toBe(false);
    $.data(inherited, 'normal', 2); expect($.data(parent, 'normal')).toBe(1); expect($.data(inherited, 'normal')).toBe(2);
    ['__proto__', 'constructor', 'toString', 0, -1, 1.5, Infinity, 1000000000].forEach(function(value) {
      var owner = {}; owner[key] = value; $.data(owner, 'normal', 42);
      expect($.data(owner, 'normal')).toBe(42); $.removeData(owner, 'normal'); expect($.hasData(owner)).toBe(false);
    });
    $.removeData(parent); $.removeData(inherited);
  });
  it('keeps plain-owner on/off and trigger isolated from forged metadata', function() {
    var probe = {}, owner = {}, hits = 0; $(probe).on('probe', function() {}); owner[expando(probe)] = '__proto__'; $(probe).off('probe');
    $(owner).on('normal.ns', function() { hits++; }); $(owner).triggerHandler('normal'); expect(hits).toBe(1);
    expect(Object.prototype.events).toBeUndefined(); expect(Object.prototype.handle).toBeUndefined();
    $(owner).off('.ns'); $(owner).triggerHandler('normal'); expect(hits).toBe(1); expect($.hasData(owner)).toBe(false);
  });
  it('preserves data attributes, clone(true), delegation and cleanup/reuse', function() {
    var hits = 0, host = $('<div data-count="7"><button>child</button></div>').appendTo('body');
    expect(host.data('count')).toBe(7); host.data('camel-key', 42).on('click.ns', 'button', function() { hits++; });
    var clone = host.clone(true).appendTo('body'); expect(clone.data('camel-key')).toBe(42); clone.find('button').trigger('click'); expect(hits).toBe(1);
    host.find('button').trigger('click'); expect(hits).toBe(2); host.off('.ns'); host.find('button').trigger('click'); expect(hits).toBe(2);
    var node = host[0]; host.remove(); expect($.hasData(node)).toBe(false); $.data(node, 'reused', 5); expect($.data(node, 'reused')).toBe(5); $.removeData(node); clone.remove();
  });
  it('does not attach orphan native listeners when a forged private expando is immutable', function() {
    var probe = {}, node = document.createElement('div'), calls = 0;
    $(probe).on('probe', function() {}); var key = expando(probe); $(probe).off('probe');
    Object.defineProperty(node, key, {value: '__proto__'});
    var original = node.addEventListener; node.addEventListener = function() { calls++; };
    try { $(node).on('normal', function() {}); $(node).off('normal'); expect(calls).toBe(0); expect($.hasData(node)).toBe(false); }
    finally { node.addEventListener = original; }
  });
});
