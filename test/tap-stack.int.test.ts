import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load outputs:', error);
  outputs = {};
}

describe('TAP Stack Integration Tests', () => {
  describe('Deployment Verification', () => {
    it('should have deployment outputs available', () => {
      // Verify that deployment outputs exist
      // The actual functionality is tested in iam-compliance-analyzer-stack.int.test.ts
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    it('should have IAM compliance analyzer deployed', () => {
      // Verify key outputs from the IAM compliance analyzer
      expect(outputs.reportsBucketName).toBeDefined();
      expect(outputs.scannerLambdaArn).toBeDefined();
      expect(outputs.dashboardUrl).toBeDefined();
      expect(outputs.complianceNamespace).toBeDefined();
    });
  });
});
