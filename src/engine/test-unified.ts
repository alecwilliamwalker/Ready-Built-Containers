// Quick test to verify unified system works
import { evaluateExpression } from './unified-integration';

console.log("Testing unified parser:");

try {
  console.log("L*W test:", evaluateExpression("5*4"));
  console.log("L*W with units:", evaluateExpression("5 ft * 4 ft"));
  console.log("LaTeX conversion test:", evaluateExpression("5 \\cdot 4"));
} catch (error) {
  console.error("Test failed:", error);
}