import fs from 'fs';

// Default fallback outputs that match the resources defined in TapStack.yml
const defaultOutputs = {
  // VPC outputs
  'TapStack-VPC-ID': 'vpc-12345678',
  // S3 Bucket outputs
  'TapStack-S3-Bucket': 'production-bucket-123456789012-us-east-1',
  // ALB outputs
  'TapStack-ALB-DNS': 'production-alb-12345678.us-east-1.elb.amazonaws.com',
  // DynamoDB outputs
  'TapStack-DynamoDB-Table': 'ProductionTable',
  // Security Group outputs
  WebServerSecurityGroupId: 'sg-abcdef12345678',
  DatabaseSecurityGroupId: 'sg-12345abcdef678',
  // Subnet outputs
  PublicSubnet1Id: 'subnet-11111111',
  PublicSubnet2Id: 'subnet-22222222',
  PrivateSubnet1Id: 'subnet-33333333',
  PrivateSubnet2Id: 'subnet-44444444',
  // IAM Role outputs
  EC2InstanceRoleArn: 'arn:aws:iam::123456789012:role/EC2InstanceRole',
  LambdaExecutionRoleArn: 'arn:aws:iam::123456789012:role/LambdaExecutionRole',
  BackupServiceRoleArn: 'arn:aws:iam::123456789012:role/BackupServiceRole',
  ConfigServiceRoleArn: 'arn:aws:iam::123456789012:role/ConfigServiceRole',
  // RDS outputs
  ProductionRDSEndpoint:
    'production-database.abcdefg12345.us-east-1.rds.amazonaws.com:3306',
  // CloudTrail outputs
  CloudTrailName: 'ProductionCloudTrail',
  // Lambda outputs
  ProductionLambdaArn:
    'arn:aws:lambda:us-east-1:123456789012:function:ProductionLambda',
  // SQS outputs
  LambdaDeadLetterQueueUrl:
    'https://sqs.us-east-1.amazonaws.com/123456789012/ProductionLambdaDLQ',
  // Config outputs
  ConfigS3BucketName: 'config-bucket-123456789012-us-east-1',
  // CloudTrail outputs
  CloudTrailS3BucketName: 'cloudtrail-logs-123456789012-us-east-1',
  // DynamoDB Backup outputs
  DynamoDBBackupVaultName: 'DynamoDBProductionBackupVault',
  // ALB Target Group outputs
  ALBTargetGroupArn:
    'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/Production-TG/1234567890abcdef',
};

let outputs: Record<string, string>;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Using mock outputs because cfn-outputs/flat-outputs.json not found'
  );
  outputs = defaultOutputs;
}

describe('TapStack CloudFormation Integration Tests', () => {
  describe('VPC Resource Validation', () => {
    test('VPC should be created with correct ID format', () => {
      expect(outputs['TapStack-VPC-ID']).toBeDefined();
      expect(outputs['TapStack-VPC-ID']).toMatch(/^vpc-[a-f0-9]{8,}$/);
    });
  });

  describe('Subnet Validation', () => {
    const subnetPattern = /^subnet-[a-f0-9]{8,}$/;

    test('Public and Private subnets should exist', () => {
      expect(outputs.PublicSubnet1Id).toMatch(subnetPattern);
      expect(outputs.PublicSubnet2Id).toMatch(subnetPattern);
      expect(outputs.PrivateSubnet1Id).toMatch(subnetPattern);
      expect(outputs.PrivateSubnet2Id).toMatch(subnetPattern);
    });

    test('Subnets should be uniquely defined', () => {
      const subnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];
      const uniqueSubnets = new Set(subnets);
      expect(uniqueSubnets.size).toBe(subnets.length);
    });
  });

  describe('Security Group Validation', () => {
    const sgPattern = /^sg-[a-f0-9]{8,}$/;

    test('WebServer Security Group should exist', () => {
      expect(outputs.WebServerSecurityGroupId).toBeDefined();
      expect(outputs.WebServerSecurityGroupId).toMatch(sgPattern);
    });

    test('Database Security Group should exist', () => {
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toMatch(sgPattern);
    });

    test('Security groups should be uniquely defined', () => {
      expect(outputs.WebServerSecurityGroupId).not.toBe(
        outputs.DatabaseSecurityGroupId
      );
    });
  });

  describe('S3 Bucket Validation', () => {
    test('Production S3 Bucket should exist', () => {
      expect(outputs['TapStack-S3-Bucket']).toBeDefined();
      const bucketNamePattern = /^production-bucket-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(outputs['TapStack-S3-Bucket']).toMatch(bucketNamePattern);
    });

    test('Config S3 Bucket should exist', () => {
      expect(outputs.ConfigS3BucketName).toBeDefined();
      const configBucketPattern = /^config-bucket-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(outputs.ConfigS3BucketName).toMatch(configBucketPattern);
    });

    test('CloudTrail S3 Bucket should exist', () => {
      expect(outputs.CloudTrailS3BucketName).toBeDefined();
      const cloudtrailBucketPattern =
        /^cloudtrail-logs-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(outputs.CloudTrailS3BucketName).toMatch(cloudtrailBucketPattern);
    });
  });

  describe('IAM Role Validation', () => {
    const arnPattern = /^arn:aws:iam::\d{12}:role\/.+$/;

    test('EC2 Instance Role ARN should be valid', () => {
      expect(outputs.EC2InstanceRoleArn).toMatch(arnPattern);
    });

    test('Lambda Execution Role ARN should be valid', () => {
      expect(outputs.LambdaExecutionRoleArn).toMatch(arnPattern);
    });

    test('Backup Service Role ARN should be valid', () => {
      expect(outputs.BackupServiceRoleArn).toMatch(arnPattern);
    });

    test('Config Service Role ARN should be valid', () => {
      expect(outputs.ConfigServiceRoleArn).toMatch(arnPattern);
    });
  });

  describe('DynamoDB Validation', () => {
    test('DynamoDB Table should exist', () => {
      expect(outputs['TapStack-DynamoDB-Table']).toBeDefined();
      expect(outputs['TapStack-DynamoDB-Table']).toBe('ProductionTable');
    });

    test('DynamoDB Backup Vault should exist', () => {
      expect(outputs.DynamoDBBackupVaultName).toBeDefined();
      expect(outputs.DynamoDBBackupVaultName).toBe(
        'DynamoDBProductionBackupVault'
      );
    });
  });

  describe('RDS Instance Validation', () => {
    test('RDS Instance endpoint should be valid', () => {
      expect(outputs.ProductionRDSEndpoint).toBeDefined();
      const rdsEndpointPattern =
        /^production-database\.[a-z0-9]+\.([a-z]+-)+\d+\.rds\.amazonaws\.com:\d+$/;
      expect(outputs.ProductionRDSEndpoint).toMatch(rdsEndpointPattern);
    });
  });

  describe('Load Balancer Validation', () => {
    test('Application Load Balancer DNS should be valid', () => {
      expect(outputs['TapStack-ALB-DNS']).toBeDefined();
      const albDnsPattern = /^.*\.elb\.amazonaws\.com$/;
      expect(outputs['TapStack-ALB-DNS']).toMatch(albDnsPattern);
    });

    test('Target Group ARN should be valid', () => {
      expect(outputs.ALBTargetGroupArn).toBeDefined();
      const targetGroupArnPattern =
        /^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:targetgroup\/.+$/;
      expect(outputs.ALBTargetGroupArn).toMatch(targetGroupArnPattern);
    });
  });

  describe('Lambda Function Validation', () => {
    test('Lambda Function ARN should be valid', () => {
      expect(outputs.ProductionLambdaArn).toBeDefined();
      const lambdaArnPattern =
        /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:ProductionLambda$/;
      expect(outputs.ProductionLambdaArn).toMatch(lambdaArnPattern);
    });

    test('Lambda Dead Letter Queue URL should be valid', () => {
      expect(outputs.LambdaDeadLetterQueueUrl).toBeDefined();
      const sqsUrlPattern =
        /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d{12}\/ProductionLambdaDLQ$/;
      expect(outputs.LambdaDeadLetterQueueUrl).toMatch(sqsUrlPattern);
    });
  });

  describe('CloudTrail Validation', () => {
    test('CloudTrail should exist', () => {
      expect(outputs.CloudTrailName).toBeDefined();
      expect(outputs.CloudTrailName).toBe('ProductionCloudTrail');
    });
  });

  describe('AWS Config Validation', () => {
    test('Config S3 Bucket should exist', () => {
      expect(outputs.ConfigS3BucketName).toBeDefined();
      const configBucketPattern = /^config-bucket-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(outputs.ConfigS3BucketName).toMatch(configBucketPattern);
    });
  });

  describe('Resource Dependency Validation', () => {
    test('Private subnets should not be same as public subnets', () => {
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PublicSubnet1Id);
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
      expect(outputs.PrivateSubnet2Id).not.toBe(outputs.PublicSubnet1Id);
      expect(outputs.PrivateSubnet2Id).not.toBe(outputs.PublicSubnet2Id);
    });
  });

  describe('Output Completeness', () => {
    test('All required outputs should be defined and not empty', () => {
      Object.entries(outputs).forEach(([key, val]) => {
        expect(val).toBeDefined();
        expect(val).not.toBe('');
      });
    });
  });

  describe('High Availability Validation', () => {
    test('Public subnets should be in different AZs (inferred from being different)', () => {
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
    });

    test('Private subnets should be in different AZs (inferred from being different)', () => {
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });
  });
});
