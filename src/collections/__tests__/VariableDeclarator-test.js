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
var types = recast.types.namedTypes;
var b = recast.types.builders;


describe('VariableDeclarators', function() {
  var nodes;
  var Collection;
  var Module;
  var VariableDeclaratorCollection;

  beforeEach(function() {
    Collection = require('../../Collection');
    Module = require('../Module');
    VariableDeclaratorCollection = require('../VariableDeclarator');
    VariableDeclaratorCollection.register();

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

  describe('Traversal', function() {
    it('adds a root method to find variable declarators', function() {
      expect(Collection.fromNodes([]).findVariableDeclarators).toBeDefined();
    });

    it('finds all variable declarators', function() {
      var declarators = Collection.fromNodes(nodes).findVariableDeclarators();
      expect(declarators.getTypes()).toContain('VariableDeclarator');
      expect(declarators.size()).toBe(6);
    });

    it('finds variable declarators by name', function() {
      var declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators('bar');
      expect(declarators.size()).toBe(2);
    });
  });

  describe('Transform', function() {
    it('renames variable declarations considering scope', function() {
      var declarators = Collection.fromNodes(nodes)
        .findVariableDeclarators()
        .filter(Module.filters.requiresModule('module'))
        .renameTo('xyz');

      var identifiers =
        Collection.fromNodes(nodes)
        .find(types.Identifier, {name: 'xyz'});

      expect(identifiers.size()).toBe(6);
    });
  });

});
