/**
 * This test file specifically covers the direct execution block in tap-stack.ts
 * Lines 741-742 can only be covered when require.main === module
 */

import { execSync } from 'child_process';
import * as path from 'path';

describe('TapStack Direct Execution', () => {
  test('Direct execution block runs without errors', () => {
    const stackPath = path.join(__dirname, '../lib/tap-stack.ts');
    
    // Execute the TypeScript file directly using ts-node
    // This will trigger the if (require.main === module) block
    expect(() => {
      execSync(`npx ts-node --transpile-only "${stackPath}"`, {
        cwd: path.join(__dirname, '..'),
        timeout: 30000,
        stdio: 'pipe', // Suppress output to avoid cluttering test results
        env: {
          ...process.env,
          ENVIRONMENT_SUFFIX: 'test'
        }
      });
    }).not.toThrow();
  });
});