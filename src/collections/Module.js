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

const _ = require('lodash');
const Collection = require('../Collection');
const Node = require('./Node');
const recast = require('recast');

const astNodesAreEquivalent = recast.types.astNodesAreEquivalent;
const b = recast.types.builders;
const {
  AssignmentExpression,
  CallExpression,
  VariableDeclarator,
} = recast.types.namedTypes;

const globalMethods = {
  /**
   * Finds all variable declarators or assignments that call `require`.
   *
   * @return {Collection}
   */
  findRequireModule() {
    const require = {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'require',
      },
    };
    return Collection.fromPaths([
      ...this.find(VariableDeclarator, {init: require}).paths(),
      ...this.find(AssignmentExpression, {right: require}).paths(),
    ]);
  }
};

const filterMethods = {
  /**
   * Returns a function that returns true if the provided path is a variable
   * declarator or assignment and requires one of the specified module names.
   *
   * @param {string|Array} names A module name or an array of module names
   * @return {Function}
   */
  requiresModule(names) {
    if (names && !Array.isArray(names)) {
      names = [names];
    }
    var requireIdentifier = b.identifier('require');
    return path => {
      var node = path.value;
      var call;
      if (VariableDeclarator.check(node)) {
        call = node.init;
      } else if (AssignmentExpression.check(node)) {
        call = node.right;
      }

      if (
        call &&
        CallExpression.check(call) &&
        astNodesAreEquivalent(call.callee, requireIdentifier)
      ) {
        return !names || names.some(
          n => astNodesAreEquivalent(call.arguments[0], b.literal(n))
        );
      }
      return false;
    };
  }
};


function register() {
  Node.register();
  Collection.registerMethods(globalMethods);
}

exports.register = _.once(register);
exports.filters = filterMethods;
