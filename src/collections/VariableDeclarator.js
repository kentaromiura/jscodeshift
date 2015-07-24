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

const b = recast.types.builders;
const {
  Identifier,
  MemberExpression,
  VariableDeclarator,
} = recast.types.namedTypes;

const globalMethods = {
  /**
   * Finds all variable declarators, optionally filtered by name.
   *
   * @param {string} name
   * @return {Collection}
   */
  findVariableDeclarators(name) {
    const filter = name ? {id: {name: name}} : null;
    return this.find(VariableDeclarator, filter);
  }
};

const transformMethods = {
  /**
   * Renames a variable and all its occurrences.
   *
   * @param {string} newName
   * @return {Collection}
   */
  renameTo(newName) {
    // TODO: Include JSXElements
    return this.forEach(path => {
      const node = path.value;
      const oldName = node.id.name;
      const rootScope = path.scope;
      const rootPath = rootScope.path;
      Collection.fromPaths([rootPath])
        .find(Identifier, {name: oldName})
        // ignore properties in MemberExpressions
        .filter(path => {
          const node = path.parent.node;
          return (
            !MemberExpression.check(node) ||
            node.property !== path.node ||
            !node.computed
          );
        })
        .forEach(path => {
          var {scope} = path;
          while (scope && scope !== rootScope) {
            if (scope.declares(oldName)) {
              return;
            }
            scope = scope.parent;
          }
          if (scope) { // identifier must refer to declared variable
            path.get('name').replace(newName);
          }
        });
    });
  }
};

function register() {
  Node.register();
  Collection.registerMethods(globalMethods);
  Collection.registerMethods(transformMethods, VariableDeclarator);
}

exports.register = _.once(register);
