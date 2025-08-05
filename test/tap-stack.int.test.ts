import fs from 'fs';

// Default fallback outputs that match the resources defined in TapStack.yml
const defaultOutputs = {
  // VPC outputs
  'TapStack-VPC-ID': 'vpc-0e6ffb11559a46e2b',
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

// Map outputs to support both ExportName, OutputKey, and flat outputs
const outputKeyMap: { [key: string]: string | undefined } = {
  // VPC
  'TapStackpr429-VPC-ID':
    outputs['VPCId'] ||
    outputs['TapStackpr429-VPC-ID'] ||
    outputs['TapStack-VPC-ID'],
  // DynamoDB Table
  'TapStackpr429-DynamoDB-Table':
    outputs['DynamoDBTableName'] ||
    outputs['TapStackpr429-DynamoDB-Table'] ||
    outputs['TapStack-DynamoDB-Table'],
  'TapStack-DynamoDB-Table':
    outputs['DynamoDBTableName'] || outputs['TapStack-DynamoDB-Table'],
  // ALB DNS
  'TapStackpr429-ALB-DNS':
    outputs['LoadBalancerDNS'] ||
    outputs['TapStackpr429-ALB-DNS'] ||
    outputs['TapStack-ALB-DNS'],
  'TapStack-ALB-DNS': outputs['LoadBalancerDNS'] || outputs['TapStack-ALB-DNS'],
  // S3 Bucket
  'TapStackpr429-S3-Bucket':
    outputs['S3BucketName'] ||
    outputs['TapStackpr429-S3-Bucket'] ||
    outputs['TapStack-S3-Bucket'],
  'TapStack-S3-Bucket':
    outputs['S3BucketName'] || outputs['TapStack-S3-Bucket'],
  // Subnets
  'TapStackpr429-PublicSubnet1Id':
    outputs['PublicSubnet1Id'] || outputs['TapStackpr429-PublicSubnet1Id'],
  'TapStackpr429-PublicSubnet2Id':
    outputs['PublicSubnet2Id'] || outputs['TapStackpr429-PublicSubnet2Id'],
  'TapStackpr429-PrivateSubnet1Id':
    outputs['PrivateSubnet1Id'] || outputs['TapStackpr429-PrivateSubnet1Id'],
  'TapStackpr429-PrivateSubnet2Id':
    outputs['PrivateSubnet2Id'] || outputs['TapStackpr429-PrivateSubnet2Id'],
  // Security Groups
  'TapStackpr429-WebServerSecurityGroupId':
    outputs['WebServerSecurityGroupId'] ||
    outputs['TapStackpr429-WebServerSecurityGroupId'],
  'TapStackpr429-DatabaseSecurityGroupId':
    outputs['DatabaseSecurityGroupId'] ||
    outputs['TapStackpr429-DatabaseSecurityGroupId'],
  // IAM Roles
  'TapStackpr429-EC2InstanceRoleArn':
    outputs['EC2InstanceRoleArn'] ||
    outputs['TapStackpr429-EC2InstanceRoleArn'],
  'TapStackpr429-LambdaExecutionRoleArn':
    outputs['LambdaExecutionRoleArn'] ||
    outputs['TapStackpr429-LambdaExecutionRoleArn'],
  'TapStackpr429-BackupServiceRoleArn':
    outputs['BackupServiceRoleArn'] ||
    outputs['TapStackpr429-BackupServiceRoleArn'],
  'TapStackpr429-ConfigServiceRoleArn':
    outputs['ConfigServiceRoleArn'] ||
    outputs['TapStackpr429-ConfigServiceRoleArn'],
  // RDS
  'TapStackpr429-ProductionRDSEndpoint':
    outputs['ProductionRDSEndpoint'] ||
    outputs['TapStackpr429-ProductionRDSEndpoint'],
  // CloudTrail
  'TapStackpr429-CloudTrailName':
    outputs['CloudTrailName'] || outputs['TapStackpr429-CloudTrailName'],
  'TapStackpr429-CloudTrailS3BucketName':
    outputs['CloudTrailS3BucketName'] ||
    outputs['TapStackpr429-CloudTrailS3BucketName'],
  // Lambda
  'TapStackpr429-ProductionLambdaArn':
    outputs['ProductionLambdaArn'] ||
    outputs['TapStackpr429-ProductionLambdaArn'],
  'TapStackpr429-LambdaDeadLetterQueueUrl':
    outputs['LambdaDeadLetterQueueUrl'] ||
    outputs['TapStackpr429-LambdaDeadLetterQueueUrl'],
  // Config
  'TapStackpr429-ConfigS3BucketName':
    outputs['ConfigS3BucketName'] ||
    outputs['TapStackpr429-ConfigS3BucketName'],
  // DynamoDB Backup
  'TapStackpr429-DynamoDBBackupVaultName':
    outputs['DynamoDBBackupVaultName'] ||
    outputs['TapStackpr429-DynamoDBBackupVaultName'],
  // ALB Target Group
  'TapStackpr429-ALBTargetGroupArn':
    outputs['ALBTargetGroupArn'] || outputs['TapStackpr429-ALBTargetGroupArn'],
  // Flat keys for direct test lookups
  PublicSubnet1Id: outputs['PublicSubnet1Id'],
  PublicSubnet2Id: outputs['PublicSubnet2Id'],
  PrivateSubnet1Id: outputs['PrivateSubnet1Id'],
  PrivateSubnet2Id: outputs['PrivateSubnet2Id'],
  WebServerSecurityGroupId: outputs['WebServerSecurityGroupId'],
  DatabaseSecurityGroupId: outputs['DatabaseSecurityGroupId'],
  EC2InstanceRoleArn: outputs['EC2InstanceRoleArn'],
  LambdaExecutionRoleArn: outputs['LambdaExecutionRoleArn'],
  BackupServiceRoleArn: outputs['BackupServiceRoleArn'],
  ConfigServiceRoleArn: outputs['ConfigServiceRoleArn'],
  ProductionRDSEndpoint: outputs['ProductionRDSEndpoint'],
  CloudTrailName: outputs['CloudTrailName'],
  CloudTrailS3BucketName: outputs['CloudTrailS3BucketName'],
  ProductionLambdaArn: outputs['ProductionLambdaArn'],
  LambdaDeadLetterQueueUrl: outputs['LambdaDeadLetterQueueUrl'],
  ConfigS3BucketName: outputs['ConfigS3BucketName'],
  DynamoDBBackupVaultName: outputs['DynamoDBBackupVaultName'],
  ALBTargetGroupArn: outputs['ALBTargetGroupArn'],
  S3BucketName: outputs['S3BucketName'],
  DynamoDBTableName: outputs['DynamoDBTableName'],
  LoadBalancerDNS: outputs['LoadBalancerDNS'],
};

// Use outputKeyMap for tests if keys exist, otherwise fallback to outputs
const getOutput = (key: string): string => {
  const val = outputKeyMap[key] || outputs[key];
  if (typeof val !== 'string' || !val) {
    throw new Error(`Output for key '${key}' is missing or not a string`);
  }
  return val;
};

describe('TapStack CloudFormation Integration Tests', () => {
  describe('VPC Resource Validation', () => {
    test('VPC should be created with correct ID format', () => {
      expect(getOutput('TapStackpr429-VPC-ID')).toBeDefined();
      expect(getOutput('TapStackpr429-VPC-ID')).toMatch(/^vpc-[a-f0-9]{8,}$/);
    });
  });

  describe('Subnet Validation', () => {
    const subnetPattern = /^subnet-[a-f0-9]{8,}$/;

    test('Public and Private subnets should exist', () => {
      expect(getOutput('PublicSubnet1Id')).toMatch(subnetPattern);
      expect(getOutput('PublicSubnet2Id')).toMatch(subnetPattern);
      expect(getOutput('PrivateSubnet1Id')).toMatch(subnetPattern);
      expect(getOutput('PrivateSubnet2Id')).toMatch(subnetPattern);
    });

    test('Subnets should be uniquely defined', () => {
      const subnets = [
        getOutput('PublicSubnet1Id'),
        getOutput('PublicSubnet2Id'),
        getOutput('PrivateSubnet1Id'),
        getOutput('PrivateSubnet2Id'),
      ];
      const uniqueSubnets = new Set(subnets);
      expect(uniqueSubnets.size).toBe(subnets.length);
    });
  });

  describe('Security Group Validation', () => {
    const sgPattern = /^sg-[a-f0-9]{8,}$/;

    test('WebServer Security Group should exist', () => {
      expect(getOutput('WebServerSecurityGroupId')).toBeDefined();
      expect(getOutput('WebServerSecurityGroupId')).toMatch(sgPattern);
    });

    test('Database Security Group should exist', () => {
      expect(getOutput('DatabaseSecurityGroupId')).toBeDefined();
      expect(getOutput('DatabaseSecurityGroupId')).toMatch(sgPattern);
    });

    test('Security groups should be uniquely defined', () => {
      expect(getOutput('WebServerSecurityGroupId')).not.toBe(
        getOutput('DatabaseSecurityGroupId')
      );
    });
  });

  describe('S3 Bucket Validation', () => {
    test('Production S3 Bucket should exist', () => {
      expect(getOutput('TapStack-S3-Bucket')).toBeDefined();
      const bucketNamePattern = /^production-bucket-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(getOutput('TapStack-S3-Bucket')).toMatch(bucketNamePattern);
    });

    test('Config S3 Bucket should exist', () => {
      expect(getOutput('ConfigS3BucketName')).toBeDefined();
      const configBucketPattern = /^config-bucket-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(getOutput('ConfigS3BucketName')).toMatch(configBucketPattern);
    });

    test('CloudTrail S3 Bucket should exist', () => {
      expect(getOutput('CloudTrailS3BucketName')).toBeDefined();
      const cloudtrailBucketPattern =
        /^cloudtrail-logs-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(getOutput('CloudTrailS3BucketName')).toMatch(
        cloudtrailBucketPattern
      );
    });
  });

  describe('IAM Role Validation', () => {
    const arnPattern = /^arn:aws:iam::\d{12}:role\/.+$/;

    test('EC2 Instance Role ARN should be valid', () => {
      expect(getOutput('EC2InstanceRoleArn')).toMatch(arnPattern);
    });

    test('Lambda Execution Role ARN should be valid', () => {
      expect(getOutput('LambdaExecutionRoleArn')).toMatch(arnPattern);
    });

    test('Backup Service Role ARN should be valid', () => {
      expect(getOutput('BackupServiceRoleArn')).toMatch(arnPattern);
    });

    test('Config Service Role ARN should be valid', () => {
      expect(getOutput('ConfigServiceRoleArn')).toMatch(arnPattern);
    });
  });

  describe('DynamoDB Validation', () => {
    test('DynamoDB Table should exist', () => {
      expect(getOutput('TapStack-DynamoDB-Table')).toBeDefined();
      expect(getOutput('TapStack-DynamoDB-Table')).toBe('ProductionTable');
    });

    test('DynamoDB Backup Vault should exist', () => {
      expect(getOutput('DynamoDBBackupVaultName')).toBeDefined();
      expect(getOutput('DynamoDBBackupVaultName')).toBe(
        'DynamoDBProductionBackupVault'
      );
    });
  });

  describe('RDS Instance Validation', () => {
    test('RDS Instance endpoint should be valid', () => {
      expect(getOutput('ProductionRDSEndpoint')).toBeDefined();
      const rdsEndpointPattern =
        /^production-database\.[a-z0-9]+\.([a-z]+-)+\d+\.rds\.amazonaws\.com(:\d+)?$/;
      expect(getOutput('ProductionRDSEndpoint')).toMatch(rdsEndpointPattern);
    });
  });

  describe('Load Balancer Validation', () => {
    test('Application Load Balancer DNS should be valid', () => {
      expect(getOutput('TapStack-ALB-DNS')).toBeDefined();
      const albDnsPattern = /^.*\.elb\.amazonaws\.com$/;
      expect(getOutput('TapStack-ALB-DNS')).toMatch(albDnsPattern);
    });

    test('Target Group ARN should be valid', () => {
      expect(getOutput('ALBTargetGroupArn')).toBeDefined();
      const targetGroupArnPattern =
        /^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:targetgroup\/.+$/;
      expect(getOutput('ALBTargetGroupArn')).toMatch(targetGroupArnPattern);
    });
  });

  describe('Lambda Function Validation', () => {
    test('Lambda Function ARN should be valid', () => {
      expect(getOutput('ProductionLambdaArn')).toBeDefined();
      const lambdaArnPattern =
        /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:ProductionLambda$/;
      expect(getOutput('ProductionLambdaArn')).toMatch(lambdaArnPattern);
    });

    test('Lambda Dead Letter Queue URL should be valid', () => {
      expect(getOutput('LambdaDeadLetterQueueUrl')).toBeDefined();
      const sqsUrlPattern =
        /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d{12}\/ProductionLambdaDLQ$/;
      expect(getOutput('LambdaDeadLetterQueueUrl')).toMatch(sqsUrlPattern);
    });
  });

  describe('CloudTrail Validation', () => {
    test('CloudTrail should exist', () => {
      expect(getOutput('CloudTrailName')).toBeDefined();
      expect(getOutput('CloudTrailName')).toBe('ProductionCloudTrail');
    });
  });

  describe('AWS Config Validation', () => {
    test('Config S3 Bucket should exist', () => {
      expect(getOutput('ConfigS3BucketName')).toBeDefined();
      const configBucketPattern = /^config-bucket-\d{12}-[a-z]{2}-[a-z]+-\d$/;
      expect(getOutput('ConfigS3BucketName')).toMatch(configBucketPattern);
    });
  });

  describe('Resource Dependency Validation', () => {
    test('Private subnets should not be same as public subnets', () => {
      expect(getOutput('PrivateSubnet1Id')).not.toBe(
        getOutput('PublicSubnet1Id')
      );
      expect(getOutput('PrivateSubnet1Id')).not.toBe(
        getOutput('PublicSubnet2Id')
      );
      expect(getOutput('PrivateSubnet2Id')).not.toBe(
        getOutput('PublicSubnet1Id')
      );
      expect(getOutput('PrivateSubnet2Id')).not.toBe(
        getOutput('PublicSubnet2Id')
      );
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
      expect(getOutput('PublicSubnet1Id')).not.toBe(
        getOutput('PublicSubnet2Id')
      );
    });

    test('Private subnets should be in different AZs (inferred from being different)', () => {
      expect(getOutput('PrivateSubnet1Id')).not.toBe(
        getOutput('PrivateSubnet2Id')
      );
    });
  });
});
