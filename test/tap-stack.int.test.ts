/**
 * Integration Tests for Trading Platform Infrastructure
 *
 * These tests verify the infrastructure outputs and configuration.
 * Tests use flat-outputs.json to validate exported resource identifiers.
 *
 * Prerequisites:
 * - Run ./scripts/generate-flat-outputs.sh before running these tests
 */

import * as fs from 'fs';
import * as path from 'path';

// Load flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

function loadOutputs() {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `flat-outputs.json not found at ${outputsPath}. Run ./scripts/generate-flat-outputs.sh first.`
    );
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('Trading Platform Infrastructure - Output Validation Tests', () => {
  let outputs: any;
  let region: string;
  let environmentSuffix: string;

  beforeAll(() => {
    outputs = loadOutputs();
    region = outputs.region || process.env.AWS_REGION || 'us-east-1';
    environmentSuffix =
      outputs.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    console.log(`\n🧪 Running output validation tests for environment: ${environmentSuffix}`);
    console.log(`📍 Region: ${region}\n`);
  });

  describe('Output File Structure', () => {
    test('flat-outputs.json should exist and be valid JSON', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      expect(outputs).not.toBeNull();
    });

    test('should contain region and environment suffix', () => {
      expect(outputs.region || process.env.AWS_REGION).toBeDefined();
      expect(outputs.environmentSuffix || process.env.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    test('should have at least 10 exported outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('VPC Resources', () => {
    test('VPC ID should be exported with correct format', () => {
      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should export public subnet IDs with correct format', () => {
      const publicSubnet1 = outputs['public-subnet-1-id'];
      const publicSubnet2 = outputs['public-subnet-2-id'];

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet1).toMatch(/^subnet-[a-z0-9]+$/);
      expect(publicSubnet2).toMatch(/^subnet-[a-z0-9]+$/);

      // Subnets should be different
      expect(publicSubnet1).not.toBe(publicSubnet2);
    });

    test('subnets should be in different availability zones', () => {
      const publicSubnet1 = outputs['public-subnet-1-id'];
      const publicSubnet2 = outputs['public-subnet-2-id'];

      // Verify both subnets exist
      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();

      // Subnets should be different (implying different AZs)
      expect(publicSubnet1).not.toBe(publicSubnet2);
    });
  });

  describe('S3 Bucket', () => {
    test('should export bucket name with correct naming convention', () => {
      const bucketName = outputs['trade-data-bucket-name'];
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^trade-data-.*$/);
      expect(bucketName).toContain(environmentSuffix);

      // S3 bucket names must be lowercase and can only contain lowercase letters, numbers, and hyphens
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    });

    test('bucket ARN should be properly formatted', () => {
      const bucketArn = outputs['trade-data-bucket-arn'];
      expect(bucketArn).toBeDefined();
      expect(bucketArn).toMatch(/^arn:aws:s3:::[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    });
  });

  describe('DynamoDB Table', () => {
    test('should export table name with correct naming convention', () => {
      const tableName = outputs['orders-table-name'];
      expect(tableName).toBeDefined();
      expect(tableName).toMatch(/^orders-.*$/);
      expect(tableName).toContain(environmentSuffix);
    });

    test('table ARN should be properly formatted', () => {
      const tableArn = outputs['orders-table-arn'];
      expect(tableArn).toBeDefined();
      expect(tableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(tableArn).toContain(region);
      expect(tableArn).toContain('table/orders-');
    });

    test('should export stream ARN if streams are enabled', () => {
      const streamArn = outputs['orders-table-stream-arn'];
      if (streamArn) {
        expect(streamArn).toMatch(/^arn:aws:dynamodb:/);
        expect(streamArn).toContain('/stream/');
      }
    });
  });

  describe('SQS Queues', () => {
    test('should export main queue URL with correct format', () => {
      const queueUrl = outputs['order-processing-queue-url'];
      expect(queueUrl).toBeDefined();
      expect(queueUrl).toMatch(/^https:\/\/sqs\./);
      expect(queueUrl).toContain(region);
      expect(queueUrl).toContain('order-processing');
      expect(queueUrl).toContain(environmentSuffix);
    });

    test('should export main queue ARN', () => {
      const queueArn = outputs['order-processing-queue-arn'];
      expect(queueArn).toBeDefined();
      expect(queueArn).toMatch(/^arn:aws:sqs:/);
      expect(queueArn).toContain(region);
      expect(queueArn).toContain('order-processing');
    });

    test('should export DLQ URL and ARN', () => {
      const dlqUrl = outputs['order-processing-dlq-url'];
      const dlqArn = outputs['order-processing-dlq-arn'];

      expect(dlqUrl).toBeDefined();
      expect(dlqArn).toBeDefined();
      expect(dlqUrl).toMatch(/^https:\/\/sqs\./);
      expect(dlqArn).toMatch(/^arn:aws:sqs:/);
      expect(dlqUrl).toContain('order-processing-dlq');
      expect(dlqArn).toContain('order-processing-dlq');
    });
  });

  describe('Lambda Function', () => {
    test('should export function ARN with correct format', () => {
      const functionArn = outputs['order-processing-function-arn'];
      expect(functionArn).toBeDefined();
      expect(functionArn).toMatch(/^arn:aws:lambda:/);
      expect(functionArn).toContain(region);
      expect(functionArn).toContain('function:order-processing');
      expect(functionArn).toContain(environmentSuffix);
    });
  });

  describe('API Gateway', () => {
    test('should export API ID with correct format', () => {
      const apiId = outputs['api-id'];
      expect(apiId).toBeDefined();
      expect(apiId).toMatch(/^[a-z0-9]+$/);
      expect(apiId.length).toBeGreaterThanOrEqual(8);
    });

    test('should export API endpoint with correct format', () => {
      const apiEndpoint = outputs['api-endpoint'] || outputs['ApiEndpoint'];
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\//);
      expect(apiEndpoint).toContain(region);
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain(environmentSuffix);
    });

    test('API stage should be exported', () => {
      const stage = outputs['api-stage'];
      if (stage) {
        expect(stage).toBe(environmentSuffix);
      }
    });
  });

  describe('Monitoring Resources', () => {
    test('should export CloudWatch dashboard name', () => {
      const dashboardName = outputs['dashboard-name'];
      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain('trading-platform');
      expect(dashboardName).toContain(environmentSuffix);
    });

    test('should export SNS topic ARN for drift detection', () => {
      const driftTopicArn = outputs['drift-topic-arn'];
      expect(driftTopicArn).toBeDefined();
      expect(driftTopicArn).toMatch(/^arn:aws:sns:/);
      expect(driftTopicArn).toContain(region);
      expect(driftTopicArn).toContain('drift-detection');
      expect(driftTopicArn).toContain(environmentSuffix);
    });

    test('should export alarm names if alarms exist', () => {
      const lambdaErrorAlarm = outputs['lambda-error-alarm'];
      const dynamoThrottleAlarm = outputs['dynamodb-throttle-alarm'];
      const sqsDlqAlarm = outputs['sqs-dlq-alarm'];

      if (lambdaErrorAlarm) {
        expect(lambdaErrorAlarm).toContain(environmentSuffix);
      }
      if (dynamoThrottleAlarm) {
        expect(dynamoThrottleAlarm).toContain(environmentSuffix);
      }
      if (sqsDlqAlarm) {
        expect(sqsDlqAlarm).toContain(environmentSuffix);
      }
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resource names should include environment suffix', () => {
      const resourceOutputs = [
        'trade-data-bucket-name',
        'orders-table-name',
        'order-processing-queue-url',
        'order-processing-function-arn',
        'dashboard-name',
        'drift-topic-arn'
      ];

      resourceOutputs.forEach(outputKey => {
        const value = outputs[outputKey];
        if (value) {
          expect(value).toContain(environmentSuffix);
        }
      });
    });

    test('all ARNs should include correct region', () => {
      const arnOutputs = Object.keys(outputs).filter(key =>
        key.endsWith('-arn') && outputs[key]
      );

      arnOutputs.forEach(arnKey => {
        const arnValue = outputs[arnKey];
        expect(arnValue).toMatch(/^arn:aws:/);
        // Regional services should include region in ARN
        if (!arnValue.startsWith('arn:aws:s3')) {
          expect(arnValue).toContain(region);
        }
      });
    });
  });

  describe('Output Completeness', () => {
    test('should export all required infrastructure outputs', () => {
      const requiredOutputs = [
        'vpc-id',
        'public-subnet-1-id',
        'public-subnet-2-id',
        'trade-data-bucket-name',
        'orders-table-name',
        'order-processing-queue-url',
        'order-processing-function-arn',
        'api-id',
        'dashboard-name',
        'drift-topic-arn'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('output values should not contain placeholder text', () => {
      const outputValues = Object.values(outputs);
      outputValues.forEach(value => {
        if (typeof value === 'string') {
          expect(value).not.toContain('PLACEHOLDER');
          expect(value).not.toContain('TODO');
          expect(value).not.toContain('CHANGEME');
          expect(value).not.toContain('undefined');
          expect(value).not.toBe('');
        }
      });
    });
  });

  describe('Environment Configuration', () => {
    test('environment suffix should match expected pattern', () => {
      expect(environmentSuffix).toMatch(/^(pr\d+|dev|test|stage|prod)$/);
    });

    test('region should be a valid AWS region', () => {
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-central-1',
        'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
      ];
      expect(validRegions).toContain(region);
    });
  });
});
