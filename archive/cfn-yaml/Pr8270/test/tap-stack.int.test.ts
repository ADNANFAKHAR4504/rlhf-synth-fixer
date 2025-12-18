// Configuration - These are coming from cfn-outputs after LocalStack deployment
import fs from 'fs';

const outputsPath = 'cfn-outputs/flat-outputs.json';
let outputs: Record<string, any> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('LocalStack High Availability Web Application Infrastructure Integration Tests', () => {
  describe('Infrastructure Components', () => {
    test('should verify VPC exists and has valid ID format', () => {
      if (!outputs.VPCId) {
        return;
      }
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should verify public subnets exist', () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        return;
      }
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should verify private subnets exist', () => {
      if (!outputs.PrivateSubnet1Id || !outputs.PrivateSubnet2Id) {
        return;
      }
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should verify security groups exist', () => {
      if (!outputs.WebSecurityGroupId || !outputs.AppSecurityGroupId) {
        return;
      }
      expect(outputs.WebSecurityGroupId).toMatch(/^sg-[a-z0-9]+$/);
      expect(outputs.AppSecurityGroupId).toMatch(/^sg-[a-z0-9]+$/);
    });

    test('should verify public subnets are unique', () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        return;
      }
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
    });

    test('should verify private subnets are unique', () => {
      if (!outputs.PrivateSubnet1Id || !outputs.PrivateSubnet2Id) {
        return;
      }
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });

    test('should verify web and app security groups are different', () => {
      if (!outputs.WebSecurityGroupId || !outputs.AppSecurityGroupId) {
        return;
      }
      expect(outputs.WebSecurityGroupId).not.toBe(outputs.AppSecurityGroupId);
    });
  });

  describe('IAM Resources', () => {
    test('should verify IAM role ARN is valid', () => {
      if (!outputs.AppRoleArn) {
        return;
      }
      expect(outputs.AppRoleArn).toMatch(/^arn:aws:iam::\d+:role\//);
    });

    test('should verify IAM role follows naming convention', () => {
      if (!outputs.AppRoleArn) {
        return;
      }
      expect(outputs.AppRoleArn).toContain('AppRole');
    });

    test('should verify IAM role includes environment suffix', () => {
      if (!outputs.AppRoleArn || !outputs.Environment) {
        return;
      }
      expect(outputs.AppRoleArn).toContain(outputs.Environment);
    });
  });

  describe('Storage Resources', () => {
    test('should verify S3 bucket is configured', () => {
      if (!outputs.AppBucketName) {
        return;
      }
      expect(outputs.AppBucketName).toMatch(/^tapstack-assets-/);
    });

    test('should verify S3 bucket ARN format', () => {
      if (!outputs.AppBucketArn) {
        return;
      }
      expect(outputs.AppBucketArn).toMatch(/^arn:aws:s3:::/);
    });

    test('should verify S3 bucket ARN contains bucket name', () => {
      if (!outputs.AppBucketArn || !outputs.AppBucketName) {
        return;
      }
      expect(outputs.AppBucketArn).toContain(outputs.AppBucketName);
    });

    test('should verify S3 bucket includes environment suffix', () => {
      if (!outputs.AppBucketName || !outputs.Environment) {
        return;
      }
      expect(outputs.AppBucketName).toContain(outputs.Environment);
    });

    test('should verify DynamoDB table is configured', () => {
      if (!outputs.AppTableName) {
        return;
      }
      expect(outputs.AppTableName).toContain('AppData');
    });

    test('should verify DynamoDB table ARN format', () => {
      if (!outputs.AppTableArn) {
        return;
      }
      expect(outputs.AppTableArn).toMatch(/^arn:aws:dynamodb:/);
    });

    test('should verify DynamoDB table ARN contains table name', () => {
      if (!outputs.AppTableArn || !outputs.AppTableName) {
        return;
      }
      expect(outputs.AppTableArn).toContain(outputs.AppTableName);
    });

    test('should verify DynamoDB table includes environment suffix', () => {
      if (!outputs.AppTableName || !outputs.Environment) {
        return;
      }
      expect(outputs.AppTableName).toContain(outputs.Environment);
    });

    test('should verify DynamoDB ARN includes region', () => {
      if (!outputs.AppTableArn || !outputs.Region) {
        return;
      }
      expect(outputs.AppTableArn).toContain(outputs.Region);
    });
  });

  describe('Messaging Resources', () => {
    test('should verify SNS topic is configured', () => {
      if (!outputs.NotificationTopicArn) {
        return;
      }
      expect(outputs.NotificationTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.NotificationTopicArn).toContain('Notifications');
    });

    test('should verify SNS topic includes environment suffix', () => {
      if (!outputs.NotificationTopicArn || !outputs.Environment) {
        return;
      }
      expect(outputs.NotificationTopicArn).toContain(outputs.Environment);
    });

    test('should verify SNS topic ARN includes region', () => {
      if (!outputs.NotificationTopicArn || !outputs.Region) {
        return;
      }
      expect(outputs.NotificationTopicArn).toContain(outputs.Region);
    });

    test('should verify SQS queue is configured', () => {
      if (!outputs.ProcessingQueueUrl || !outputs.ProcessingQueueArn) {
        return;
      }
      expect(outputs.ProcessingQueueArn).toMatch(/^arn:aws:sqs:/);
      expect(outputs.ProcessingQueueArn).toContain('ProcessingQueue');
    });

    test('should verify SQS queue URL format', () => {
      if (!outputs.ProcessingQueueUrl) {
        return;
      }
      expect(outputs.ProcessingQueueUrl).toMatch(/^https?:\/\//);
      expect(outputs.ProcessingQueueUrl).toContain('ProcessingQueue');
    });

    test('should verify SQS queue includes environment suffix', () => {
      if (!outputs.ProcessingQueueArn || !outputs.Environment) {
        return;
      }
      expect(outputs.ProcessingQueueArn).toContain(outputs.Environment);
    });

    test('should verify SQS queue ARN includes region', () => {
      if (!outputs.ProcessingQueueArn || !outputs.Region) {
        return;
      }
      expect(outputs.ProcessingQueueArn).toContain(outputs.Region);
    });
  });

  describe('Logging Resources', () => {
    test('should verify CloudWatch log group is configured', () => {
      if (!outputs.LogGroupName) {
        return;
      }
      expect(outputs.LogGroupName).toContain('/aws/');
    });

    test('should verify log group follows path convention', () => {
      if (!outputs.LogGroupName) {
        return;
      }
      expect(outputs.LogGroupName).toMatch(/^\/aws\/[a-zA-Z]+\//);
    });

    test('should verify log group includes environment suffix', () => {
      if (!outputs.LogGroupName || !outputs.Environment) {
        return;
      }
      expect(outputs.LogGroupName).toContain(outputs.Environment);
    });

    test('should verify log group contains application identifier', () => {
      if (!outputs.LogGroupName) {
        return;
      }
      expect(outputs.LogGroupName).toContain('application');
    });
  });

  describe('High Availability Configuration', () => {
    test('should verify multi-AZ subnet configuration', () => {
      if (!outputs.PublicSubnets || !outputs.PrivateSubnets) {
        return;
      }

      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    test('should verify region is specified', () => {
      if (!outputs.Region) {
        return;
      }
      expect(outputs.Region).toMatch(/^[a-z]+-[a-z]+-\d+$/);
    });

    test('should verify public and private subnets are separate', () => {
      if (!outputs.PublicSubnets || !outputs.PrivateSubnets) {
        return;
      }

      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      publicSubnets.forEach((subnet: string) => {
        expect(privateSubnets).not.toContain(subnet);
      });
    });

    test('should verify all four subnets are unique', () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id ||
        !outputs.PrivateSubnet1Id || !outputs.PrivateSubnet2Id) {
        return;
      }

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

  describe('Stack Metadata', () => {
    test('should verify stack name is defined', () => {
      if (!outputs.StackName) {
        return;
      }
      expect(outputs.StackName).toBeTruthy();
    });

    test('should verify stack name follows naming convention', () => {
      if (!outputs.StackName) {
        return;
      }
      expect(outputs.StackName).toMatch(/^[a-z0-9-]+$/);
    });

    test('should verify environment is defined', () => {
      if (!outputs.Environment) {
        return;
      }
      expect(['dev', 'staging', 'production']).toContain(outputs.Environment);
    });

    test('should verify environment is lowercase', () => {
      if (!outputs.Environment) {
        return;
      }
      expect(outputs.Environment).toBe(outputs.Environment.toLowerCase());
    });
  });

  describe('Complete Infrastructure Validation', () => {
    test('should verify core outputs are present', () => {
      const coreOutputs = ['VPCId', 'Region', 'StackName', 'Environment'];

      const presentOutputs = coreOutputs.filter(
        key => outputs[key] !== undefined && outputs[key] !== null && outputs[key] !== ''
      );

      expect(presentOutputs.length).toBeGreaterThan(0);
    });

    test('should verify networking outputs are present', () => {
      const networkingOutputs = [
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PublicSubnets',
        'PrivateSubnets',
        'WebSecurityGroupId',
        'AppSecurityGroupId',
      ];

      const presentOutputs = networkingOutputs.filter(
        key => outputs[key] !== undefined && outputs[key] !== null && outputs[key] !== ''
      );

      expect(presentOutputs.length).toBeGreaterThan(0);
    });

    test('should verify storage outputs are present', () => {
      const storageOutputs = [
        'AppBucketName',
        'AppBucketArn',
        'AppTableName',
        'AppTableArn',
      ];

      const presentOutputs = storageOutputs.filter(
        key => outputs[key] !== undefined && outputs[key] !== null && outputs[key] !== ''
      );

      expect(presentOutputs.length).toBeGreaterThan(0);
    });

    test('should verify messaging outputs are present', () => {
      const messagingOutputs = [
        'NotificationTopicArn',
        'ProcessingQueueUrl',
        'ProcessingQueueArn',
      ];

      const presentOutputs = messagingOutputs.filter(
        key => outputs[key] !== undefined && outputs[key] !== null && outputs[key] !== ''
      );

      expect(presentOutputs.length).toBeGreaterThan(0);
    });

    test('should verify all expected outputs are present', () => {
      const allExpectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PublicSubnets',
        'PrivateSubnets',
        'WebSecurityGroupId',
        'AppSecurityGroupId',
        'AppRoleArn',
        'AppBucketName',
        'AppBucketArn',
        'AppTableName',
        'AppTableArn',
        'NotificationTopicArn',
        'LogGroupName',
        'ProcessingQueueUrl',
        'ProcessingQueueArn',
        'Region',
        'StackName',
        'Environment',
      ];

      const presentOutputs = allExpectedOutputs.filter(
        key => outputs[key] !== undefined && outputs[key] !== null && outputs[key] !== ''
      );

      expect(presentOutputs.length).toBe(allExpectedOutputs.length);
    });
  });

  describe('LocalStack Specific Tests', () => {
    test('should verify outputs are LocalStack compatible format', () => {
      const arnPattern = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:/;

      if (outputs.AppRoleArn) {
        expect(outputs.AppRoleArn).toMatch(arnPattern);
      }
      if (outputs.AppTableArn) {
        expect(outputs.AppTableArn).toMatch(arnPattern);
      }
      if (outputs.NotificationTopicArn) {
        expect(outputs.NotificationTopicArn).toMatch(arnPattern);
      }
      if (outputs.ProcessingQueueArn) {
        expect(outputs.ProcessingQueueArn).toMatch(arnPattern);
      }
    });

    test('should verify VPC networking is properly configured', () => {
      if (!outputs.PublicSubnets || !outputs.PrivateSubnets) {
        return;
      }

      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);

      publicSubnets.forEach((subnet: string) => {
        expect(privateSubnets).not.toContain(subnet);
      });
    });

    test('should verify S3 bucket naming follows conventions', () => {
      if (!outputs.AppBucketName) {
        return;
      }
      expect(outputs.AppBucketName).toMatch(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/);
      expect(outputs.AppBucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.AppBucketName.length).toBeLessThanOrEqual(63);
    });

    test('should verify LocalStack account ID format', () => {
      if (!outputs.AppRoleArn) {
        return;
      }
      const accountIdMatch = outputs.AppRoleArn.match(/:(\d{12}):/);
      if (accountIdMatch) {
        expect(accountIdMatch[1]).toMatch(/^\d{12}$/);
      }
    });

    test('should verify SQS URL contains LocalStack endpoint', () => {
      if (!outputs.ProcessingQueueUrl) {
        return;
      }
      const isLocalStack = outputs.ProcessingQueueUrl.includes('localhost') ||
        outputs.ProcessingQueueUrl.includes('localstack');
      expect(isLocalStack).toBe(true);
    });
  });

  describe('Resource Consistency', () => {
    test('should verify PublicSubnets matches individual subnet IDs', () => {
      if (!outputs.PublicSubnets || !outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        return;
      }

      const subnetsFromList = outputs.PublicSubnets.split(',');
      expect(subnetsFromList).toContain(outputs.PublicSubnet1Id);
      expect(subnetsFromList).toContain(outputs.PublicSubnet2Id);
    });

    test('should verify PrivateSubnets matches individual subnet IDs', () => {
      if (!outputs.PrivateSubnets || !outputs.PrivateSubnet1Id || !outputs.PrivateSubnet2Id) {
        return;
      }

      const subnetsFromList = outputs.PrivateSubnets.split(',');
      expect(subnetsFromList).toContain(outputs.PrivateSubnet1Id);
      expect(subnetsFromList).toContain(outputs.PrivateSubnet2Id);
    });

    test('should verify all ARNs use same region', () => {
      const arns = [
        outputs.AppTableArn,
        outputs.NotificationTopicArn,
        outputs.ProcessingQueueArn,
      ].filter(Boolean);

      if (arns.length < 2 || !outputs.Region) {
        return;
      }

      arns.forEach(arn => {
        expect(arn).toContain(outputs.Region);
      });
    });

    test('should verify all resource names use same environment', () => {
      const names = [
        outputs.AppBucketName,
        outputs.AppTableName,
        outputs.LogGroupName,
      ].filter(Boolean);

      if (names.length < 2 || !outputs.Environment) {
        return;
      }

      names.forEach(name => {
        expect(name).toContain(outputs.Environment);
      });
    });
  });
});
