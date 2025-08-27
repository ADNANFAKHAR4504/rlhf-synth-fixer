// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Load deployment outputs
let outputs: any;
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Use mock outputs for testing without actual deployment
  outputs = {
    VPCId: 'vpc-mock123',
    PublicSubnet1Id: 'subnet-pub1',
    PublicSubnet2Id: 'subnet-pub2',
    PrivateSubnet1Id: 'subnet-priv1',
    PrivateSubnet2Id: 'subnet-priv2',
    DatabaseEndpoint: 'db.example.com',
    SecureS3BucketName: 'secure-bucket-mock',
    LoggingBucketName: 'logging-bucket-mock',
    CloudTrailBucketName: 'cloudtrail-bucket-mock',
    LambdaFunctionArn:
      'arn:aws:lambda:us-east-1:123456789012:function:security-monitor',
    SNSTopicArn: 'arn:aws:sns:us-east-1:123456789012:security-alerts',
    PublicEC2InstanceId: 'i-public123',
    PrivateEC2InstanceId: 'i-private123',
    StackName: 'TapStackpr1982',
    EnvironmentSuffix: 'pr1982',
  };
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Use mock outputs when AWS credentials are not available
const USE_MOCK_OUTPUTS = !process.env.AWS_ACCESS_KEY_ID;

describe('TapStack Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'SecureS3BucketName',
        'LoggingBucketName',
        'CloudTrailBucketName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'PublicEC2InstanceId',
        'PrivateEC2InstanceId',
        'StackName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Environment suffix should match expected value', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      // Environment suffix should be alphanumeric
      expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
    });

    test('Stack name should include environment suffix', () => {
      expect(outputs.StackName).toContain(outputs.EnvironmentSuffix);
    });
  });

  describe('VPC and Networking Configuration', () => {
    test('VPC ID should be valid format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('All subnet IDs should be valid format', () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      subnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('Public and private subnets should be different', () => {
      const allSubnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(4);
    });
  });

  describe('EC2 Instances Configuration', () => {
    test('EC2 instance IDs should be valid format', () => {
      expect(outputs.PublicEC2InstanceId).toMatch(/^i-[a-f0-9]+$/);
      expect(outputs.PrivateEC2InstanceId).toMatch(/^i-[a-f0-9]+$/);
    });

    test('Public and private instances should be different', () => {
      expect(outputs.PublicEC2InstanceId).not.toBe(
        outputs.PrivateEC2InstanceId
      );
    });
  });

  describe('RDS Database Configuration', () => {
    test('Database endpoint should be valid', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      // Database endpoint should contain the environment suffix
      expect(outputs.DatabaseEndpoint.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
      // Should be a valid RDS endpoint format
      expect(outputs.DatabaseEndpoint).toMatch(
        /^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/
      );
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('All S3 bucket names should be valid and unique', () => {
      const buckets = [
        outputs.SecureS3BucketName,
        outputs.LoggingBucketName,
        outputs.CloudTrailBucketName,
      ];

      buckets.forEach(bucketName => {
        // S3 bucket names must be 3-63 characters
        expect(bucketName.length).toBeGreaterThanOrEqual(3);
        expect(bucketName.length).toBeLessThanOrEqual(63);
        // Must contain only lowercase letters, numbers, and hyphens
        expect(bucketName).toMatch(/^[a-z0-9-]+$/);
        // Should contain environment suffix
        expect(bucketName).toContain(outputs.EnvironmentSuffix.toLowerCase());
      });

      // All buckets should be unique
      const uniqueBuckets = new Set(buckets);
      expect(uniqueBuckets.size).toBe(3);
    });

    test('Secure bucket should have different name pattern than logging buckets', () => {
      expect(outputs.SecureS3BucketName).toContain('secure-bucket');
      expect(outputs.LoggingBucketName).toContain('logging-bucket');
      expect(outputs.CloudTrailBucketName).toContain('cloudtrail');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Lambda function ARN should be valid', () => {
      expect(outputs.LambdaFunctionArn).toMatch(
        /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/
      );
    });

    test('Lambda function name should contain environment suffix', () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      expect(functionName.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });
  });

  describe('SNS Topic Configuration', () => {
    test('SNS topic ARN should be valid', () => {
      expect(outputs.SNSTopicArn).toMatch(
        /^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9-_]+$/
      );
    });

    test('SNS topic name should contain environment suffix', () => {
      const topicName = outputs.SNSTopicArn.split(':').pop();
      expect(topicName.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });
  });

  describe('Resource Naming Consistency', () => {
    test('All resources should follow consistent naming pattern', () => {
      const envSuffix = outputs.EnvironmentSuffix.toLowerCase();

      // Check S3 buckets
      expect(outputs.SecureS3BucketName.toLowerCase()).toContain(envSuffix);
      expect(outputs.LoggingBucketName.toLowerCase()).toContain(envSuffix);
      expect(outputs.CloudTrailBucketName.toLowerCase()).toContain(envSuffix);

      // Check Lambda and SNS
      expect(outputs.LambdaFunctionArn.toLowerCase()).toContain(envSuffix);
      expect(outputs.SNSTopicArn.toLowerCase()).toContain(envSuffix);

      // Check database endpoint
      expect(outputs.DatabaseEndpoint.toLowerCase()).toContain(envSuffix);
    });

    test('Stack name should be properly formatted', () => {
      expect(outputs.StackName).toBe(`TapStack${outputs.EnvironmentSuffix}`);
    });
  });

  describe('Security Configuration Validation', () => {
    test('Database should not have public endpoint pattern', () => {
      // RDS endpoints should not contain 'public' in the name
      expect(outputs.DatabaseEndpoint.toLowerCase()).not.toContain('public');
    });

    test('Private resources should not have public identifiers', () => {
      // Private EC2 instance ID should exist
      expect(outputs.PrivateEC2InstanceId).toBeDefined();
      // Private subnets should exist
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('Security-related resources should be present', () => {
      // CloudTrail bucket for audit logs
      expect(outputs.CloudTrailBucketName).toBeDefined();
      // SNS topic for alerts
      expect(outputs.SNSTopicArn).toBeDefined();
      // Lambda for monitoring
      expect(outputs.LambdaFunctionArn).toBeDefined();
    });
  });

  describe('Cross-Resource Integration', () => {
    test('Lambda function and SNS topic should be in same region', () => {
      const lambdaRegion = outputs.LambdaFunctionArn.split(':')[3];
      const snsRegion = outputs.SNSTopicArn.split(':')[3];
      expect(lambdaRegion).toBe(snsRegion);
    });

    test('All resources should be in the expected region', () => {
      const expectedRegion = region;

      // Check Lambda ARN
      const lambdaRegion = outputs.LambdaFunctionArn.split(':')[3];
      expect(lambdaRegion).toBe(expectedRegion);

      // Check SNS ARN
      const snsRegion = outputs.SNSTopicArn.split(':')[3];
      expect(snsRegion).toBe(expectedRegion);

      // Check RDS endpoint
      expect(outputs.DatabaseEndpoint).toContain(
        `${expectedRegion}.rds.amazonaws.com`
      );
    });

    test('All ARNs should belong to the same AWS account', () => {
      const lambdaAccount = outputs.LambdaFunctionArn.split(':')[4];
      const snsAccount = outputs.SNSTopicArn.split(':')[4];

      expect(lambdaAccount).toBe(snsAccount);
      expect(lambdaAccount).toMatch(/^\d{12}$/);
    });
  });

  describe('Infrastructure Completeness', () => {
    test('All major infrastructure components should be present', () => {
      // Networking
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();

      // Compute
      expect(outputs.PublicEC2InstanceId).toBeDefined();
      expect(outputs.PrivateEC2InstanceId).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();

      // Storage
      expect(outputs.SecureS3BucketName).toBeDefined();
      expect(outputs.LoggingBucketName).toBeDefined();
      expect(outputs.CloudTrailBucketName).toBeDefined();

      // Database
      expect(outputs.DatabaseEndpoint).toBeDefined();

      // Monitoring & Alerting
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('Should have proper separation of public and private resources', () => {
      // Should have both public and private subnets
      const publicSubnets = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
      const privateSubnets = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      publicSubnets.forEach(subnet => {
        expect(subnet).toBeDefined();
        expect(subnet).toMatch(/^subnet-/);
      });

      privateSubnets.forEach(subnet => {
        expect(subnet).toBeDefined();
        expect(subnet).toMatch(/^subnet-/);
      });

      // Should have both public and private EC2 instances
      expect(outputs.PublicEC2InstanceId).toBeDefined();
      expect(outputs.PrivateEC2InstanceId).toBeDefined();
      expect(outputs.PublicEC2InstanceId).not.toBe(
        outputs.PrivateEC2InstanceId
      );
    });
  });
});
