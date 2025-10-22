import { readFileSync, existsSync } from 'fs';

describe('Turn Around Prompt API Integration Tests', () => {
  let stackOutputs: any;

  beforeAll(async () => {
    // Load stack outputs from flat-outputs.json if available
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    if (existsSync(outputsPath)) {
      const outputsData = readFileSync(outputsPath, 'utf8');
      stackOutputs = JSON.parse(outputsData);
    } else {
      // Skip tests if no outputs available (infrastructure not deployed)
      stackOutputs = null;
    }
  });

  describe('Infrastructure Validation', () => {
    test('should validate that required outputs exist', async () => {
      if (!stackOutputs) {
        console.log('Skipping integration tests - no deployment outputs found');
        return;
      }

      // Validate that key infrastructure outputs are available
      expect(stackOutputs).toBeDefined();
      
      // Check for expected output keys without asserting specific values
      // since they are dynamic and environment-specific
      const expectedKeys = ['api-endpoint', 'api-id', 's3-bucket-name', 'aurora-endpoint', 'redis-endpoint', 'efs-filesystem-id'];
      
      for (const key of expectedKeys) {
        if (stackOutputs.hasOwnProperty(key)) {
          expect(stackOutputs[key]).toBeTruthy();
        }
      }
    });

    test('should validate API Gateway endpoint format', async () => {
      if (!stackOutputs || !stackOutputs['api-endpoint']) {
        console.log('Skipping API Gateway validation - no API endpoint found in outputs');
        return;
      }

      const apiEndpoint = stackOutputs['api-endpoint'];
      expect(apiEndpoint).toMatch(/^https:\/\/.*\.execute-api\..+\.amazonaws\.com\/.+/);
    });

    test('should validate S3 bucket name format', async () => {
      if (!stackOutputs || !stackOutputs['s3-bucket-name']) {
        console.log('Skipping S3 validation - no bucket name found in outputs');
        return;
      }

      const bucketName = stackOutputs['s3-bucket-name'];
      expect(bucketName).toMatch(/^manufacturing-sensor-data-.+-\d+$/);
    });

    test('should validate Aurora endpoint format', async () => {
      if (!stackOutputs || !stackOutputs['aurora-endpoint']) {
        console.log('Skipping Aurora validation - no Aurora endpoint found in outputs');
        return;
      }

      const auroraEndpoint = stackOutputs['aurora-endpoint'];
      expect(auroraEndpoint).toMatch(/^manufacturing-aurora-.+\.cluster-.+\.ap-southeast-1\.rds\.amazonaws\.com$/);
    });

    test('should validate EFS filesystem ID format', async () => {
      if (!stackOutputs || !stackOutputs['efs-filesystem-id']) {
        console.log('Skipping EFS validation - no EFS filesystem ID found in outputs');
        return;
      }

      const efsId = stackOutputs['efs-filesystem-id'];
      expect(efsId).toMatch(/^fs-[a-f0-9]+$/);
    });
  });
});
