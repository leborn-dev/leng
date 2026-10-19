'use strict';
/* global msie: true */
describe('reviewed root-package advisories', function() {
  var savedMsie;
  beforeEach(function() { savedMsie = msie; });
  afterEach(function() { msie = savedMsie; });

  it('CVE-2026-11998 applies SCE alternatives to the whole resource URL', function() {
    module(function($sceDelegateProvider) {
      $sceDelegateProvider.trustedResourceUrlList([/https:\/\/better\.test\/.*|https:\/\/good\.test\/.*/]);
    });
    inject(function($sce) {
      expect($sce.getTrustedResourceUrl('https://good.test/template.html')).toBe('https://good.test/template.html');
      expect($sce.getTrustedResourceUrl('https://better.test/template.html')).toBe('https://better.test/template.html');
      expect(function() { $sce.getTrustedResourceUrl('https://evil.test/script.js#https://good.test/'); }).toThrow();
      expect(function() { $sce.getTrustedResourceUrl('data:text/javascript,alert(1)//https://good.test/'); }).toThrow();
    });
  });

  describe('media source policies', function() {
    beforeEach(module(function($compileProvider) {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^https:\/\/good\.test\//);
    }));
    it('CVE-2025-0716 sanitizes SVG image href and ng-href as media', inject(function($compile, $rootScope) {
      $rootScope.url = 'https://evil.test/image.svg';
      var svg = $compile('<svg><image href="{{url}}"></image><image ng-href="{{url}}"></image></svg>')($rootScope);
      $rootScope.$digest();
      expect(svg[0].children[0].getAttribute('href')).toBe('unsafe:https://evil.test/image.svg');
      expect(svg[0].children[1].getAttribute('xlink:href')).toBe('unsafe:https://evil.test/image.svg');
      $rootScope.url = 'https://good.test/image.svg'; $rootScope.$digest();
      expect(svg[0].children[0].getAttribute('href')).toBe($rootScope.url);
    }));
    it('CVE-2024-8373 sanitizes source ng-srcset candidate URLs', inject(function($compile, $rootScope) {
      $rootScope.urls = 'https://good.test/a.png 1x,https://evil.test/b.png 2x';
      forEach(['ng-srcset="{{urls}}"', 'ng-attr-srcset="{{urls}}"', 'srcset="{{urls}}"', 'ng-prop-srcset="urls"'], function(binding) {
        var source = $compile('<picture><source ' + binding + '></picture>')($rootScope);
        $rootScope.$digest();
        expect(source[0].firstChild.getAttribute('srcset')).toContain('unsafe:https://evil.test/b.png');
      });
    }));
    it('CVE-2024-8372 cannot smuggle a candidate after a malformed descriptor', inject(function($compile, $rootScope) {
      $rootScope.urls = 'https://good.test/a.png xyz,https://evil.test/b.png';
      forEach(['ng-srcset="{{urls}}"', 'ng-attr-srcset="{{urls}}"', 'srcset="{{urls}}"', 'ng-prop-srcset="urls"'], function(binding) {
        var image = $compile('<img ' + binding + '>')($rootScope);
        $rootScope.$digest();
        expect(image.attr('srcset')).toContain('unsafe:https://evil.test/b.png');
      });
    }));
    it('preserves URL commas, width and fractional density descriptors', inject(function($compile, $rootScope) {
      $rootScope.urls = 'https://good.test/a.png?x=a,b 1.5x,https://good.test/ima,ge.png 0640w,https://good.test/c.png 1e+1x';
      var image = $compile('<img ng-srcset="{{urls}}">')($rootScope);
      $rootScope.$digest();
      expect(image.attr('srcset')).toBe($rootScope.urls);
    }));
  });

  it('preserves a complete allowed data image URL in srcset', inject(function($compile, $rootScope) {
    $rootScope.urls = 'data:image/png;base64,AAAA';
    var image = $compile('<img ng-srcset="{{urls}}">')($rootScope); $rootScope.$digest();
    expect(image.attr('srcset')).toBe($rootScope.urls);
  }));
  it('CVE-2022-25869 does not compile IE-restored textarea text as a template', inject(function($compile, $rootScope) {
    msie = 11;
    var area = angular.element('<textarea></textarea>');
    area[0].textContent = '{{ marker() }}';
    $rootScope.marker = jasmine.createSpy('restored payload');
    $compile(area)($rootScope); $rootScope.$digest();
    expect($rootScope.marker).not.toHaveBeenCalled();
    expect(area.val()).toBe('{{ marker() }}');
  }));
  it('preserves explicit textarea ng-bind and ng-model on IE', inject(function($compile, $rootScope) {
    msie = 11; $rootScope.value = 'model text';
    var bound = $compile('<textarea ng-bind="value"></textarea>')($rootScope);
    var model = $compile('<textarea ng-model="value"></textarea>')($rootScope);
    $rootScope.$digest();
    expect(bound.val()).toBe('model text'); expect(model.val()).toBe('model text');
    model.val('edited'); model.triggerHandler('change');
    expect($rootScope.value).toBe('edited');
  }));
  it('preserves trusted textarea interpolation on other browsers', inject(function($compile, $rootScope) {
    msie = undefined; $rootScope.value = 'template text';
    var area = $compile('<textarea>{{value}}</textarea>')($rootScope); $rootScope.$digest();
    expect(area.val()).toBe('template text');
  }));
});
