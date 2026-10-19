/* global angular, module, inject, beforeEach, describe, it, expect */
'use strict';
describe('generated Angular security contracts', function() {
  beforeEach(module('ngSanitize', 'ngResource'));
  beforeEach(module(function($sceDelegateProvider, $compileProvider, $sanitizeProvider) {
    $sceDelegateProvider.trustedResourceUrlList([/https:\/\/better\.test\/.*|https:\/\/good\.test\/.*/]);
    $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/good\.test\/|^data:image\/png;/);
    $sanitizeProvider.enableSvg(true);
  }));
  it('rejects a partial SCE alternative while accepting trusted templates', inject(function($sce) {
    expect($sce.getTrustedResourceUrl('https://good.test/view')).toBe('https://good.test/view');
    expect(function() { $sce.getTrustedResourceUrl('https://evil.test/script#https://good.test/'); }).toThrow();
  }));
  it('sanitizes image/source srcset through every binding entry', inject(function($rootScope, $compile) {
    $rootScope.urls = 'https://good.test/a xyz,https://evil.test/b';
    angular.forEach(['img', 'source'], function(tag) {
      angular.forEach(['ng-srcset="{{urls}}"', 'ng-attr-srcset="{{urls}}"', 'srcset="{{urls}}"', 'ng-prop-srcset="urls"'], function(binding) {
        var el = $compile('<' + tag + ' ' + binding + '>')($rootScope); $rootScope.$digest();
        expect(el.attr('srcset')).toContain('unsafe:https://evil.test/b');
      });
    });
  }));
  it('keeps comma-containing URLs, data images and normal descriptors', inject(function($rootScope, $compile) {
    $rootScope.urls = 'https://good.test/a?x=a,b 1.5x,data:image/png;base64,AAAA 2x,https://good.test/c 640w';
    var el = $compile('<img ng-srcset="{{urls}}">')($rootScope); $rootScope.$digest();
    expect(el.attr('srcset')).toBe($rootScope.urls);
  }));
  it('enforces SVG image media policy in binding and sanitization', inject(function($rootScope, $compile, $sanitize) {
    $rootScope.url = 'https://evil.test/image';
    var el = $compile('<svg><image href="{{url}}"></image></svg>')($rootScope); $rootScope.$digest();
    expect(el[0].firstChild.getAttribute('href')).toBe('unsafe:https://evil.test/image');
    expect($sanitize('<svg><image href="https://evil.test/a"></image><image xlink:href="https://evil.test/b"></image></svg>')).not.toContain('https://evil.test');
    expect($sanitize('<svg><image href="https://good.test/a"></image></svg>')).toContain('href="https://good.test/a"');
    expect($sanitize('<a href="https://evil.test/page">link</a>')).toContain('href="https://evil.test/page"');
  }));
  it('copies real RegExp flags/lastIndex and preserves ordinary textarea templates', inject(function($rootScope, $compile) {
    var original = /test/gim; original.lastIndex = 3;
    var copied = angular.copy(original); expect(copied.toString()).toBe(original.toString()); expect(copied.lastIndex).toBe(3);
    $rootScope.label = 'normal';
    var el = $compile('<textarea>{{label}}</textarea>')($rootScope); $rootScope.$digest(); expect(el.val()).toBe('normal');
  }));
  it('validates public URL models and preserves resource slash semantics', inject(function($rootScope, $compile, $resource, $httpBackend) {
    var el = $compile('<form name="f"><input type="url" name="url" ng-model="url"></form>')($rootScope);
    $rootScope.url = 'https://user:password@good.test:443/path?q=1#fragment'; $rootScope.$digest(); expect($rootScope.f.url.$valid).toBe(true);
    $rootScope.url = 'http://' + new Array(5001).join('/'); $rootScope.$digest(); expect($rootScope.f.url.$error.url).toBe(true);
    $httpBackend.expectGET('/resource/path').respond({ok:true});
    var result = $resource('/resource/path///').get(); $httpBackend.flush(); expect(result.ok).toBe(true);
    expect(el.find('input').length).toBe(1);
  }));
});
