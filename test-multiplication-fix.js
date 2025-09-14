// Test script to verify the multiplication fix in ReportPad model
// This tests that normalizeForParser correctly handles LaTeX symbols

import { lex, parseExpr, evalExpr, makeQuantity } from './src/frames/ReportPad/model.js';
import { normalizeForParser } from './src/lib/text/normalize.js';

console.log('Testing multiplication fix...');

// Test 1: Basic LaTeX cdot conversion
console.log('\n1. Testing LaTeX \\cdot conversion:');
const input1 = 'L \\cdot W';
const normalized1 = normalizeForParser(input1);
console.log(`Input: "${input1}"`);
console.log(`Normalized: "${normalized1}"`);
console.log(`Expected: "L * W"`);
console.log(`✓ Test 1 ${normalized1 === 'L * W' ? 'PASSED' : 'FAILED'}`);

// Test 2: Test lexer with LaTeX symbols
console.log('\n2. Testing lexer with LaTeX symbols:');
try {
  const tokens1 = lex('5 \\cdot 3');
  console.log(`Tokens for "5 \\cdot 3":`, tokens1);
  console.log(`✓ Test 2 PASSED - Lexer handles \\cdot`);
} catch (e) {
  console.log(`✗ Test 2 FAILED - Lexer error:`, e.message);
}

// Test 3: Test various multiplication symbols
console.log('\n3. Testing various multiplication symbols:');
const testCases = [
  'a * b',
  'a \\cdot b', 
  'a \\times b',
  'a · b',
  'a × b'
];

testCases.forEach((testCase, i) => {
  try {
    const tokens = lex(testCase);
    const hasMultiply = tokens.some(t => t.t === 'OP' && t.v === '*');
    console.log(`"${testCase}" → ${hasMultiply ? '✓ PASSED' : '✗ FAILED'} (has multiply operator)`);
  } catch (e) {
    console.log(`"${testCase}" → ✗ FAILED (${e.message})`);
  }
});

// Test 4: Complete expression parsing
console.log('\n4. Testing complete expression parsing:');
try {
  const tokens = lex('L \\cdot W + 5');
  const ast = parseExpr(tokens);
  console.log(`AST for "L \\cdot W + 5":`, JSON.stringify(ast, null, 2));
  console.log(`✓ Test 4 PASSED - Complete expression parsing works`);
} catch (e) {
  console.log(`✗ Test 4 FAILED - Parse error:`, e.message);
}

console.log('\n✅ Multiplication fix testing completed!');