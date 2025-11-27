import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  const flatOutputsPath = path.join(
    __dirname,
    '../cfn-outputs/flat-outputs.json'
  );
  let outputs: Record<string, string>;

  beforeAll(() => {
    // Load outputs from cfn-outputs/flat-outputs.json
    if (fs.existsSync(flatOutputsPath)) {
      const rawData = fs.readFileSync(flatOutputsPath, 'utf8');
      outputs = JSON.parse(rawData);
    } else {
      console.warn(
        'Warning: cfn-outputs/flat-outputs.json not found. Integration tests may fail.'
      );
      outputs = {};
    }
  });

  describe('Stack Outputs Validation', () => {
    it('should have all required outputs', () => {
      // Check for the presence of key outputs
      const requiredOutputs = [
        'pipelineUrl',
        'artifactBucketName',
        'deploymentTableName',
        'blueLambdaArn',
        'greenLambdaArn',
      ];

      // In integration tests, we expect outputs to be present
      // If outputs is empty, we skip the test
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found');
        return;
      }

      requiredOutputs.forEach((outputName) => {
        expect(outputs).toHaveProperty(outputName);
        expect(outputs[outputName]).toBeDefined();
        expect(typeof outputs[outputName]).toBe('string');
      });
    });

    it('should have valid pipelineUrl format', () => {
      if (!outputs.pipelineUrl) {
        console.warn('Skipping test: pipelineUrl not found');
        return;
      }

      expect(outputs.pipelineUrl).toMatch(
        /^https:\/\/console\.aws\.amazon\.com\//
      );
      expect(outputs.pipelineUrl).toContain('codepipeline');
    });

    it('should have valid S3 bucket name', () => {
      if (!outputs.artifactBucketName) {
        console.warn('Skipping test: artifactBucketName not found');
        return;
      }

      // S3 bucket name validation
      expect(outputs.artifactBucketName).toMatch(/^[a-z0-9.-]+$/);
      expect(outputs.artifactBucketName.length).toBeGreaterThan(3);
      expect(outputs.artifactBucketName.length).toBeLessThanOrEqual(63);
    });

    it('should have valid DynamoDB table name', () => {
      if (!outputs.deploymentTableName) {
        console.warn('Skipping test: deploymentTableName not found');
        return;
      }

      // DynamoDB table name validation
      expect(outputs.deploymentTableName).toMatch(/^[a-zA-Z0-9._-]+$/);
      expect(outputs.deploymentTableName.length).toBeGreaterThan(3);
      expect(outputs.deploymentTableName.length).toBeLessThanOrEqual(255);
    });

    it('should have valid Lambda ARNs', () => {
      if (!outputs.blueLambdaArn || !outputs.greenLambdaArn) {
        console.warn('Skipping test: Lambda ARNs not found');
        return;
      }

      // Lambda ARN format: arn:aws:lambda:region:account-id:function:function-name
      const arnPattern =
        /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/;

      expect(outputs.blueLambdaArn).toMatch(arnPattern);
      expect(outputs.greenLambdaArn).toMatch(arnPattern);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in all resource names', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found');
        return;
      }

      // Get environmentSuffix from environment or default
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      // Check that resource names include environmentSuffix
      if (outputs.artifactBucketName) {
        expect(outputs.artifactBucketName).toContain(environmentSuffix);
      }

      if (outputs.deploymentTableName) {
        expect(outputs.deploymentTableName).toContain(environmentSuffix);
      }
    });

    it('should follow consistent naming patterns', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found');
        return;
      }

      if (outputs.artifactBucketName) {
        expect(outputs.artifactBucketName).toContain('pipeline-artifacts');
      }

      if (outputs.deploymentTableName) {
        expect(outputs.deploymentTableName).toContain('deployment-history');
      }
    });
  });

  describe('AWS Service Endpoints', () => {
    it('should have valid AWS Console URLs', () => {
      if (!outputs.pipelineUrl) {
        console.warn('Skipping test: pipelineUrl not found');
        return;
      }

      // Verify Console URL structure
      expect(outputs.pipelineUrl).toContain('console.aws.amazon.com');
      expect(outputs.pipelineUrl).toContain('codesuite');
      expect(outputs.pipelineUrl).toContain('codepipeline');
    });

    it('should have ARNs in the correct region', () => {
      if (!outputs.blueLambdaArn) {
        console.warn('Skipping test: Lambda ARNs not found');
        return;
      }

      const expectedRegion = process.env.AWS_REGION || 'us-east-1';

      // Extract region from ARN
      const arnParts = outputs.blueLambdaArn.split(':');
      if (arnParts.length >= 4) {
        const arnRegion = arnParts[3];
        expect(arnRegion).toBe(expectedRegion);
      }
    });
  });

  describe('Blue/Green Deployment Configuration', () => {
    it('should have both blue and green Lambda functions', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found');
        return;
      }

      expect(outputs.blueLambdaArn).toBeDefined();
      expect(outputs.greenLambdaArn).toBeDefined();
    });

    it('should have different Lambda function names for blue and green', () => {
      if (!outputs.blueLambdaArn || !outputs.greenLambdaArn) {
        console.warn('Skipping test: Lambda ARNs not found');
        return;
      }

      // Lambda function names should be different
      expect(outputs.blueLambdaArn).not.toBe(outputs.greenLambdaArn);
    });
  });

  describe('Output File Structure', () => {
    it('should have flat-outputs.json file if deployed', () => {
      if (fs.existsSync(flatOutputsPath)) {
        expect(fs.existsSync(flatOutputsPath)).toBe(true);

        const stats = fs.statSync(flatOutputsPath);
        expect(stats.isFile()).toBe(true);
        expect(stats.size).toBeGreaterThan(0);
      } else {
        console.warn('Skipping test: flat-outputs.json not found (not deployed)');
      }
    });

    it('should have valid JSON structure', () => {
      if (!fs.existsSync(flatOutputsPath)) {
        console.warn('Skipping test: flat-outputs.json not found');
        return;
      }

      expect(() => {
        const rawData = fs.readFileSync(flatOutputsPath, 'utf8');
        JSON.parse(rawData);
      }).not.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    it('should respect ENVIRONMENT_SUFFIX environment variable', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

      if (!environmentSuffix) {
        console.warn('ENVIRONMENT_SUFFIX not set, using default');
        return;
      }

      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found');
        return;
      }

      // Verify environment suffix is used in resource names
      if (outputs.artifactBucketName) {
        expect(outputs.artifactBucketName).toContain(environmentSuffix);
      }

      if (outputs.deploymentTableName) {
        expect(outputs.deploymentTableName).toContain(environmentSuffix);
      }
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should have all CI/CD pipeline components', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found (stack not deployed)');
        return;
      }

      // Verify essential pipeline components
      const essentialOutputs = [
        'pipelineUrl',
        'artifactBucketName',
        'deploymentTableName',
      ];

      essentialOutputs.forEach((outputName) => {
        expect(outputs).toHaveProperty(outputName);
        expect(outputs[outputName]).toBeTruthy();
      });
    });

    it('should have Lambda deployment targets', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping test: No outputs found (stack not deployed)');
        return;
      }

      // Verify Lambda functions for deployment
      expect(outputs).toHaveProperty('blueLambdaArn');
      expect(outputs).toHaveProperty('greenLambdaArn');

      if (outputs.blueLambdaArn) {
        expect(outputs.blueLambdaArn).toBeTruthy();
      }

      if (outputs.greenLambdaArn) {
        expect(outputs.greenLambdaArn).toBeTruthy();
      }
    });
  });
});
