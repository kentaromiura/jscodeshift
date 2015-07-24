/*
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

jest.autoMockOff();

var babel = require('babel');
var recast = require('recast');

describe('Module', function() {
  var nodes;
  var Collection;
  var Module;

  beforeEach(function() {
    Collection = require('../../Collection');
    Module = require('../Module');
    Module.register();

    nodes = [recast.parse([
      'var foo = 42;',
      'var bar = require("module");',
      'var baz = require("module2");',
      'var y;',
      'function func() {',
      '  y = require("module3");',
      '  var x = bar;',
      '  bar.someMethod();',
      '  func1(bar);',
      '}',
      'function func1(bar) {',
      '  var bar = 21;',
      '}',
      'foo.bar();',
      'foo[bar]();',
      'bar.foo();'
    ].join('\n'), {esprima: babel}).program];
  });

  describe('Filters', function() {
    it('finds module imports (require)', function() {
      var statements = Collection.fromNodes(nodes)
        .findRequireModule()
        .filter(Module.filters.requiresModule());

      expect(statements.size()).toBe(3);
    });

    it('finds module imports (require) by module name', function() {
      var statements = Collection.fromNodes(nodes)
        .findRequireModule()
        .filter(Module.filters.requiresModule('module'));

      expect(statements.size()).toBe(1);
    });

    it('accepts multiple module names', function() {
      var statements = Collection.fromNodes(nodes)
        .findRequireModule()
        .filter(Module.filters.requiresModule(
          ['module', 'module3']
        ));

      expect(statements.size()).toBe(2);
    });
  });

});
