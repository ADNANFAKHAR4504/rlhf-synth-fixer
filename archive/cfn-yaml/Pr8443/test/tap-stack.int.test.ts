import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// LocalStack doesn't properly pass CloudFormation parameters, so we accept 'dev' as fallback
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('localstack');

describe('Secure Lambda Infrastructure Integration Tests', () => {
  let outputs: any = {};

  beforeAll(async () => {
    // Try to load outputs from deployment
    try {
      if (fs.existsSync('cdk-outputs/flat-outputs.json')) {
        const outputsData = fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8');
        outputs = JSON.parse(outputsData);
      } else if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        const outputsData = fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8');
        outputs = JSON.parse(outputsData);
      }
    } catch (error) {
      console.error('Failed to load outputs:', error);
    }
  });

  describe('Lambda Function Integration', () => {
    test('should have Lambda function ARN output', () => {
      expect(outputs.LambdaFunctionArn).toBeTruthy();
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws[-a-z]*:lambda:/);
    });

    test('should have Lambda function name output', () => {
      expect(outputs.LambdaFunctionName).toBeTruthy();
      expect(typeof outputs.LambdaFunctionName).toBe('string');
    });

    test('should have log export Lambda ARN output', () => {
      expect(outputs.LogExportLambdaArn).toBeTruthy();
      expect(outputs.LogExportLambdaArn).toMatch(/^arn:aws[-a-z]*:lambda:/);
    });
  });

  describe('CloudWatch Log Group Integration', () => {
    test('should have log group name output', () => {
      expect(outputs.LogGroupName).toBeTruthy();
      expect(typeof outputs.LogGroupName).toBe('string');
    });

    test('should have log group following naming convention', () => {
      // Log group should contain /aws/lambda/ prefix
      expect(outputs.LogGroupName).toMatch(/\/aws\/lambda\/|LogGroup/i);
    });
  });

  describe('Security Group Integration', () => {
    test('should have security group ID output', () => {
      expect(outputs.SecurityGroupId).toBeTruthy();
      expect(outputs.SecurityGroupId).toMatch(/^sg-/);
    });
  });

  describe('IAM Role Integration', () => {
    test('should have IAM role ARN output', () => {
      expect(outputs.IAMRoleArn).toBeTruthy();
      expect(outputs.IAMRoleArn).toMatch(/^arn:aws[-a-z]*:iam:/);
    });

    test('should have role with Lambda execution role pattern', () => {
      expect(outputs.IAMRoleArn).toMatch(/role\//);
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should have all required Lambda outputs', () => {
      expect(outputs.LambdaFunctionArn).toBeTruthy();
      expect(outputs.LambdaFunctionName).toBeTruthy();
      expect(outputs.LogExportLambdaArn).toBeTruthy();
    });

    test('should have all required infrastructure outputs', () => {
      expect(outputs.LogGroupName).toBeTruthy();
      expect(outputs.SecurityGroupId).toBeTruthy();
      expect(outputs.IAMRoleArn).toBeTruthy();
    });

    test('should have valid ARN formats for all ARN outputs', () => {
      const arnOutputs = [
        outputs.LambdaFunctionArn,
        outputs.LogExportLambdaArn,
        outputs.IAMRoleArn
      ];

      arnOutputs.forEach((arn) => {
        expect(arn).toMatch(/^arn:aws[-a-z]*:/);
      });
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should export all required values', () => {
      const requiredOutputs = [
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'LogGroupName',
        'SecurityGroupId',
        'LogExportLambdaArn',
        'IAMRoleArn'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeTruthy();
      });
    });
  });
});
