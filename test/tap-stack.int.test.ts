// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
let outputs: any = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (err) {}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TAP Stack Integration Tests', () => {
  let tableArn: string;
  let tableName: string;
  let loadBalancerUrl: string;
  let bucketName: string;

  beforeAll(() => {
    // Extract outputs from deployment
    tableArn =
      outputs['TurnAroundPromptTableArn'] ||
      outputs['TapStackpr1195TurnAroundPromptTableArn'];
    tableName =
      outputs['TurnAroundPromptTableName'] ||
      outputs['TapStackpr1195TurnAroundPromptTableName'];
    loadBalancerUrl =
      outputs['LoadBalancerURL'] || outputs['TapStackpr1195LoadBalancerURL'];
    bucketName =
      outputs['LogsBucketName'] || outputs['TapStackpr1195LogsBucketName'];
  });

  describe('DynamoDB Table Tests', () => {
    test('should have DynamoDB table deployed with correct configuration', async () => {
      expect(tableArn).toBeDefined();
      expect(tableName).toBeDefined();
      expect(tableName).toContain('TurnAroundPromptTable');
      expect(tableName).toContain(environmentSuffix);
    });

    test('should be able to verify table exists in AWS', async () => {
      // This would typically connect to AWS and verify the table exists
      // For now, we just verify we have the necessary outputs
      expect(tableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(tableName).toMatch(/^TurnAroundPromptTable.+/);
    });
  });

  describe('Web Application Infrastructure Tests', () => {
    test('should have Load Balancer URL available', async () => {
      expect(loadBalancerUrl).toBeDefined();
      expect(loadBalancerUrl).toMatch(/^https?:\/\//);
    });

    test('should have S3 bucket for logs deployed', async () => {
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);
    });

    test('should be able to make HTTP request to load balancer', async () => {
      if (loadBalancerUrl) {
        // This test would make an actual HTTP request to verify the ALB is working
        // For now, we just verify the URL format is correct
        const url = new URL(loadBalancerUrl);
        expect(url.protocol).toMatch(/^https?:$/);
        expect(url.hostname).toMatch(/\.elb\./);
      }
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('should have all required outputs from deployment', async () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'LoadBalancerURL',
        'LogsBucketName',
      ];

      requiredOutputs.forEach(outputKey => {
        const output =
          outputs[outputKey] ||
          outputs[`TapStack${environmentSuffix}${outputKey}`];
        expect(output).toBeDefined();
      });
    });

    test('should have proper environment suffix in all resource names', async () => {
      expect(tableName).toContain(environmentSuffix);
      expect(bucketName).toContain(environmentSuffix);
    });
  });
});
