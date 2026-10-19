/* global $, jQuery, jasmine, describe, it, expect */
'use strict';
describe('patched legacy jQuery and Bootstrap contracts', function() {
  it('does not pollute Object.prototype through deep extend', function() {
    var payload = JSON.parse('{"__proto__":{"lengPolluted":true}}');
    try {
      $.extend(true, {}, payload);
      expect({}.lengPolluted).toBeUndefined();
    } finally { delete Object.prototype.lengPolluted; }
  });
  it('keeps event/delegation/data and does not rewrite self-closing HTML', function() {
    var el = $('<div><button>x</button></div>'), hits = 0;
    el.on('click', 'button', function() { hits++; }).data('contract', 42);
    el.find('button').trigger('click');
    expect(hits).toBe(1); expect(el.data('contract')).toBe(42);
    expect($('<div/>').length).toBe(1);
    if ($.htmlPrefilter) expect($.htmlPrefilter('<style/><img>')).toBe('<style/><img>');
  });
  it('does not execute a failed script response', function(done) {
    window.lengScriptExecuted = false;
    $.ajax({url:'/security-script-failure',dataType:'script'}).always(function() {
      expect(window.lengScriptExecuted).toBe(false); done();
    });
  });
  it('does not auto-evaluate cross-domain JavaScript content', function(done) {
    window.lengScriptExecuted = false;
    $.ajax({url:'/security-script-success',crossDomain:true}).always(function() {
      expect(window.lengScriptExecuted).toBe(false); done();
    });
  });
  it('renders loading data as text and restores the original button label', function(done) {
    var el = $('<button>Initial <b>label</b></button>').attr('data-loading-text','<img src=x onerror="window.lengButtonXss=true">');
    $('body').append(el); el.button('loading');
    setTimeout(function() {
      expect(el.find('img').length).toBe(0);
      expect(el.text()).toContain('<img');
      el.button('reset');
      setTimeout(function() { expect(el.html()).toBe('Initial <b>label</b>'); el.remove(); done(); }, 5);
    }, 5);
  });
  it('sanitizes popover HTML even with a clobbered document.implementation', function() {
    var original = Object.getOwnPropertyDescriptor(document, 'implementation');
    var called = false;
    Object.defineProperty(document, 'implementation', {configurable:true,value:{createHTMLDocument:function() {called=true;throw new Error('clobbered');}}});
    var el = $('<button title="hello">Test</button>').appendTo('body');
    try {
      expect(function() { el.popover({html:true,content:'<img src=x onerror="window.lengPopoverXss=true"><b>safe</b>'}); }).not.toThrow();
      var popover=el.data('bs.popover');
      expect(function() { popover.setContent(); }).not.toThrow();
      expect(called).toBe(false);
      expect(popover.tip().find('[onerror]').length).toBe(0);
      expect(popover.tip().find('b').text()).toBe('safe');
    } finally {
      el.remove(); if(original)Object.defineProperty(document,'implementation',original);else delete document.implementation;
    }
  });
});
