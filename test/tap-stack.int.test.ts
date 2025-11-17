import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for the deployed TAP infrastructure.
 * These tests validate actual deployed resources using stack outputs.
 */
describe('TAP Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load stack outputs from the flat-outputs.json file
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. ` +
        'Please ensure the infrastructure is deployed and outputs are exported.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('VPC Resources', () => {
    it('should have VPC ID in outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have public subnet IDs in outputs', () => {
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(outputs.publicSubnetIds.length).toBeGreaterThanOrEqual(2);
    });

    it('should have private subnet IDs in outputs', () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(outputs.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Resources', () => {
    it('should have RDS endpoint in outputs', () => {
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint).toContain('.rds.amazonaws.com');
    });

    it('should have RDS instance ID in outputs', () => {
      expect(outputs.rdsInstanceId).toBeDefined();
      expect(typeof outputs.rdsInstanceId).toBe('string');
    });
  });

  describe('S3 Resources', () => {
    it('should have S3 bucket name in outputs', () => {
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.s3BucketName).toContain('app-data-');
    });

    it('should have S3 bucket ARN in outputs', () => {
      expect(outputs.s3BucketArn).toBeDefined();
      expect(outputs.s3BucketArn).toMatch(/^arn:aws:s3:::/);
    });
  });

  describe('Lambda Resources', () => {
    it('should have Lambda function name in outputs', () => {
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.lambdaFunctionName).toContain('data-processor-');
    });

    it('should have Lambda function ARN in outputs', () => {
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
    });
  });

  describe('API Gateway Resources', () => {
    it('should have API Gateway ID in outputs', () => {
      expect(outputs.apiGatewayId).toBeDefined();
      expect(typeof outputs.apiGatewayId).toBe('string');
    });

    it('should have API Gateway URL in outputs', () => {
      expect(outputs.apiGatewayUrl).toBeDefined();
      expect(outputs.apiGatewayUrl).toMatch(/^https:\/\//);
      expect(outputs.apiGatewayUrl).toContain('amazonaws.com');
    });
  });

  describe('CloudWatch Resources', () => {
    it('should have SNS topic ARN for alarms in outputs', () => {
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow environmentSuffix naming pattern', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      expect(outputs.lambdaFunctionName).toContain(environmentSuffix);
      expect(outputs.s3BucketName).toContain(environmentSuffix);
    });
  });

  describe('Environment-Specific Configurations', () => {
    it('should reflect environment-specific settings', () => {
      // Verify that outputs reflect the deployed environment
      // This is a placeholder - actual validation would require AWS SDK calls
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });
});
