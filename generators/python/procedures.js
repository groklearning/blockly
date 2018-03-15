/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Python for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Python.procedures');

goog.require('Blockly.Python');


Blockly.Python['procedures_defreturn'] = function(block, options={}) {
  // Specify noHoist = true to avoid hoisting the code block up into the definitions scope.
  var noHoist = options.noHoist || false;
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  var globals = [];
  var variables = block.workspace.getAllVariables();
  for (var i = 0, varName; varName = variables[i]; i++) {
    if (block.arguments_.indexOf(varName) == -1) {
      globals.push(Blockly.Python.variableDB_.getName(varName.name,
          Blockly.Variables.NAME_TYPE));
    }
  }
  globals = globals.length ? '  global ' + globals.join(', ') + '\n' : '';
  var funcName = Blockly.Python.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Python.statementToCode(block, 'STACK');
  if (Blockly.Python.STATEMENT_PREFIX) {
    branch = Blockly.Python.prefixLines(
        Blockly.Python.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), Blockly.Python.INDENT) + branch;
  }
  if (Blockly.Python.INFINITE_LOOP_TRAP) {
    branch = Blockly.Python.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + block.id + '"') + branch;
  }
  var returnValue = Blockly.Python.valueToCode(block, 'RETURN',
      Blockly.Python.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + '\n';
  } else if (!branch) {
    branch = Blockly.Python.PASS;
  }
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Python.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'def ' + funcName + '(' + args.join(', ') + '):\n' +
      globals + branch + returnValue;
  if (noHoist) {
    return code;
  }
  code = Blockly.Python.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.Python.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Python['procedures_defnoreturn'] =
    Blockly.Python['procedures_defreturn'];

// The event handler block here will not be hoisted up out of the scope it appears in.
Blockly.Python['procedures_def_nesting_event_handler'] = (block) => {
    return Blockly.Python['procedures_defreturn'](block, {noHoist: true});
}

// Define a procedure that takes no arguments and with no return value.
Blockly.Python['procedures_def_noargs_noreturn'] = Blockly.Python['procedures_defnoreturn'];

Blockly.Python['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.Python.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Python.valueToCode(block, 'ARG' + i,
        Blockly.Python.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Python.ORDER_FUNCTION_CALL];
};

// Setting an event handler -- onclick="doFoo()" -- is just like calling a function.
// This block does not make a lot of sense for python, but can be used just like a regular call-function block.
Blockly.Python['procedures_set_event_handler'] =
    Blockly.Python['procedures_callreturn'];

Blockly.Python['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.Python.variableDB_.getName(block.getFieldValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Python.valueToCode(block, 'ARG' + i,
        Blockly.Python.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')\n';
  return code;
};

Blockly.Python['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.Python.valueToCode(block, 'CONDITION',
      Blockly.Python.ORDER_NONE) || 'False';
  var code = 'if ' + condition + ':\n';
  if (block.hasReturnValue_) {
    var value = Blockly.Python.valueToCode(block, 'VALUE',
        Blockly.Python.ORDER_NONE) || 'None';
    code += '  return ' + value + '\n';
  } else {
    code += '  return\n';
  }
  return code;
};
