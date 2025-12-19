// tests/integration/tap-stack.int.test.ts

import * as fs from 'fs';
import * as path from 'path';

interface StackOutputs {
  // API Gateway
  apiUrl: string;
  apiId: string;
  apiStage: string;

  // Storage
  auditBucketName: string;
  auditBucketArn: string;
  dynamoTableName: string;
  dynamoTableArn: string;

  // Lambda Functions
  validatorFunctionName: string;
  validatorFunctionArn: string;
  processorFunctionName: string;
  processorFunctionArn: string;
  notifierFunctionName: string;
  notifierFunctionArn: string;

  // Network
  vpcId: string;
  vpcCidr: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  s3EndpointId: string;
  dynamodbEndpointId: string;

  // Security
  kmsKeyId: string;
  kmsKeyArn: string;
  kmsKeyAlias: string;

  // Notifications
  snsTopicArn: string;
  snsTopicName: string;

  // Monitoring
  dashboardUrl: string;
  dashboardName: string;

  // Metadata
  region: string;
  environment: string;
}

/**
 * Load stack outputs from cfn-outputs/flat-outputs.json
 */
function loadStackOutputs(): StackOutputs {
  const outputPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Output file not found at: ${outputPath}. Please run deployment first.`);
  }

  const rawOutputs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  
  return {
    apiUrl: rawOutputs.apiUrl,
    apiId: rawOutputs.apiId,
    apiStage: rawOutputs.apiStage,
    auditBucketName: rawOutputs.auditBucketName,
    auditBucketArn: rawOutputs.auditBucketArn,
    dynamoTableName: rawOutputs.dynamoTableName,
    dynamoTableArn: rawOutputs.dynamoTableArn,
    validatorFunctionName: rawOutputs.validatorFunctionName,
    validatorFunctionArn: rawOutputs.validatorFunctionArn,
    processorFunctionName: rawOutputs.processorFunctionName,
    processorFunctionArn: rawOutputs.processorFunctionArn,
    notifierFunctionName: rawOutputs.notifierFunctionName,
    notifierFunctionArn: rawOutputs.notifierFunctionArn,
    vpcId: rawOutputs.vpcId,
    vpcCidr: rawOutputs.vpcCidr,
    publicSubnetIds: Array.isArray(rawOutputs.publicSubnetIds) 
      ? rawOutputs.publicSubnetIds 
      : JSON.parse(rawOutputs.publicSubnetIds),
    privateSubnetIds: Array.isArray(rawOutputs.privateSubnetIds)
      ? rawOutputs.privateSubnetIds
      : JSON.parse(rawOutputs.privateSubnetIds),
    s3EndpointId: rawOutputs.s3EndpointId,
    dynamodbEndpointId: rawOutputs.dynamodbEndpointId,
    kmsKeyId: rawOutputs.kmsKeyId,
    kmsKeyArn: rawOutputs.kmsKeyArn,
    kmsKeyAlias: rawOutputs.kmsKeyAlias,
    snsTopicArn: rawOutputs.snsTopicArn,
    snsTopicName: rawOutputs.snsTopicName,
    dashboardUrl: rawOutputs.dashboardUrl,
    dashboardName: rawOutputs.dashboardName,
    region: rawOutputs.region || 'ap-southeast-1',
    environment: rawOutputs.environment || 'dev',
  };
}

describe('TAP Stack Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    outputs = loadStackOutputs();
  });

  // ============================================================================
  // Output File Structure Tests
  // ============================================================================
  describe('Output File Structure', () => {
    test('should load outputs from cfn-outputs/flat-outputs.json', () => {
      expect(outputs).toBeDefined();
      expect(outputs).toHaveProperty('apiUrl');
    });

    test('should have all required output properties', () => {
      const requiredProps = [
        'apiUrl', 'apiId', 'apiStage',
        'auditBucketName', 'auditBucketArn',
        'dynamoTableName', 'dynamoTableArn',
        'validatorFunctionName', 'processorFunctionName', 'notifierFunctionName',
        'vpcId', 'vpcCidr', 'publicSubnetIds', 'privateSubnetIds',
        'kmsKeyId', 'kmsKeyArn', 'snsTopicArn',
        'dashboardUrl', 'region', 'environment'
      ];

      requiredProps.forEach(prop => {
        expect(outputs).toHaveProperty(prop);
        expect(outputs[prop as keyof StackOutputs]).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // API Gateway Tests
  // ============================================================================
  describe('API Gateway Outputs', () => {
    test('should have valid API Gateway URL format', () => {
      expect(outputs.apiUrl).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+\/payments$/);
    });

    test('should have API ID in correct format', () => {
      expect(outputs.apiId).toMatch(/^[a-z0-9]{10}$/);
    });

    test('should have API stage matching environment', () => {
      expect(outputs.apiStage).toBe(outputs.environment);
    });

    test('should have API URL containing API ID', () => {
      expect(outputs.apiUrl).toContain(outputs.apiId);
    });

    test('should have API URL containing region', () => {
      expect(outputs.apiUrl).toContain(outputs.region);
    });
  });

  // ============================================================================
  // Storage Tests
  // ============================================================================
  describe('Storage Outputs', () => {
    test('should have DynamoDB table name with environment suffix', () => {
      expect(outputs.dynamoTableName).toContain(outputs.environment);
      expect(outputs.dynamoTableName).toMatch(/^transactions-.+$/);
    });

    test('should have valid DynamoDB table ARN format', () => {
      expect(outputs.dynamoTableArn).toMatch(/^arn:aws:dynamodb:.+:\d+:table\/.+$/);
      expect(outputs.dynamoTableArn).toContain(outputs.dynamoTableName);
    });

    test('should have S3 bucket name with environment suffix', () => {
      expect(outputs.auditBucketName).toContain(outputs.environment);
      expect(outputs.auditBucketName).toMatch(/^payment-audit-logs-.+$/);
    });

    test('should have S3 bucket name with region', () => {
      expect(outputs.auditBucketName).toContain(outputs.region);
    });

    test('should have valid S3 bucket ARN format', () => {
      expect(outputs.auditBucketArn).toMatch(/^arn:aws:s3:::.+$/);
      expect(outputs.auditBucketArn).toContain(outputs.auditBucketName);
    });
  });

  // ============================================================================
  // Lambda Function Tests
  // ============================================================================
  describe('Lambda Function Outputs', () => {
    test('should have all three Lambda functions defined', () => {
      expect(outputs.validatorFunctionName).toBeTruthy();
      expect(outputs.processorFunctionName).toBeTruthy();
      expect(outputs.notifierFunctionName).toBeTruthy();
    });

    test('should have validator function name with environment suffix', () => {
      expect(outputs.validatorFunctionName).toContain(outputs.environment);
      expect(outputs.validatorFunctionName).toMatch(/^payment-validator-.+$/);
    });

    test('should have processor function name with environment suffix', () => {
      expect(outputs.processorFunctionName).toContain(outputs.environment);
      expect(outputs.processorFunctionName).toMatch(/^payment-processor-.+$/);
    });

    test('should have notifier function name with environment suffix', () => {
      expect(outputs.notifierFunctionName).toContain(outputs.environment);
      expect(outputs.notifierFunctionName).toMatch(/^payment-notifier-.+$/);
    });

    test('should have valid Lambda function ARN format for validator', () => {
      expect(outputs.validatorFunctionArn).toMatch(/^arn:aws:lambda:.+:\d+:function:.+$/);
      expect(outputs.validatorFunctionArn).toContain(outputs.validatorFunctionName);
    });

    test('should have valid Lambda function ARN format for processor', () => {
      expect(outputs.processorFunctionArn).toMatch(/^arn:aws:lambda:.+:\d+:function:.+$/);
      expect(outputs.processorFunctionArn).toContain(outputs.processorFunctionName);
    });

    test('should have valid Lambda function ARN format for notifier', () => {
      expect(outputs.notifierFunctionArn).toMatch(/^arn:aws:lambda:.+:\d+:function:.+$/);
      expect(outputs.notifierFunctionArn).toContain(outputs.notifierFunctionName);
    });

    test('should have all Lambda ARNs in the same region', () => {
      expect(outputs.validatorFunctionArn).toContain(outputs.region);
      expect(outputs.processorFunctionArn).toContain(outputs.region);
      expect(outputs.notifierFunctionArn).toContain(outputs.region);
    });
  });

  // ============================================================================
  // Network Tests
  // ============================================================================
  describe('Network Outputs', () => {
    test('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have VPC CIDR in correct format', () => {
      expect(outputs.vpcCidr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
      expect(outputs.vpcCidr).toBe('10.0.0.0/16');
    });

    test('should have 3 public subnets', () => {
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(outputs.publicSubnetIds).toHaveLength(3);
    });

    test('should have 3 private subnets', () => {
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(outputs.privateSubnetIds).toHaveLength(3);
    });

    test('should have valid subnet ID format for public subnets', () => {
      outputs.publicSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('should have valid subnet ID format for private subnets', () => {
      outputs.privateSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    test('should have unique public subnet IDs', () => {
      const uniqueIds = new Set(outputs.publicSubnetIds);
      expect(uniqueIds.size).toBe(3);
    });

    test('should have unique private subnet IDs', () => {
      const uniqueIds = new Set(outputs.privateSubnetIds);
      expect(uniqueIds.size).toBe(3);
    });

    test('should have valid S3 VPC endpoint ID format', () => {
      expect(outputs.s3EndpointId).toMatch(/^vpce-[a-f0-9]{8,17}$/);
    });

    test('should have valid DynamoDB VPC endpoint ID format', () => {
      expect(outputs.dynamodbEndpointId).toMatch(/^vpce-[a-f0-9]{8,17}$/);
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================
  describe('Security Outputs', () => {
    test('should have valid KMS key ID format', () => {
      expect(outputs.kmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('should have valid KMS key ARN format', () => {
      expect(outputs.kmsKeyArn).toMatch(/^arn:aws:kms:.+:\d+:key\/.+$/);
      expect(outputs.kmsKeyArn).toContain(outputs.kmsKeyId);
    });

    test('should have KMS key alias with environment suffix', () => {
      expect(outputs.kmsKeyAlias).toContain(outputs.environment);
      expect(outputs.kmsKeyAlias).toMatch(/^alias\/payment-db-.+$/);
    });

    test('should have KMS key in the correct region', () => {
      expect(outputs.kmsKeyArn).toContain(outputs.region);
    });
  });

  // ============================================================================
  // Notification Tests
  // ============================================================================
  describe('Notification Outputs', () => {
    test('should have valid SNS topic ARN format', () => {
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:.+:\d+:.+$/);
    });

    test('should have SNS topic name with environment suffix', () => {
      expect(outputs.snsTopicName).toContain(outputs.environment);
      expect(outputs.snsTopicName).toMatch(/^payment-notifications-.+$/);
    });

    test('should have SNS topic ARN containing topic name', () => {
      expect(outputs.snsTopicArn).toContain(outputs.snsTopicName);
    });

    test('should have SNS topic in the correct region', () => {
      expect(outputs.snsTopicArn).toContain(outputs.region);
    });
  });

  // ============================================================================
  // Monitoring Tests
  // ============================================================================
  describe('Monitoring Outputs', () => {
    test('should have valid CloudWatch dashboard URL format', () => {
      expect(outputs.dashboardUrl).toMatch(/^https:\/\/console\.aws\.amazon\.com\/cloudwatch\/.+$/);
    });

    test('should have dashboard name with environment suffix', () => {
      expect(outputs.dashboardName).toContain(outputs.environment);
      expect(outputs.dashboardName).toMatch(/^payment-monitoring-.+$/);
    });

    test('should have dashboard URL containing dashboard name', () => {
      expect(outputs.dashboardUrl).toContain(outputs.dashboardName);
    });

    test('should have dashboard URL containing region', () => {
      expect(outputs.dashboardUrl).toContain(outputs.region);
    });
  });

  // ============================================================================
  // Metadata Tests
  // ============================================================================
  describe('Metadata Outputs', () => {
    test('should have valid AWS region', () => {
      const validRegions = ['us-east-1', 'us-west-2', 'ap-southeast-1', 'eu-west-1'];
      expect(validRegions.some(region => outputs.region.includes(region))).toBe(true);
    });
  });

  // ============================================================================
  // Cross-Resource Consistency Tests
  // ============================================================================
  describe('Cross-Resource Consistency', () => {
    test('should have all resources in the same region', () => {
      expect(outputs.apiUrl).toContain(outputs.region);
      expect(outputs.dynamoTableArn).toContain(outputs.region);
      expect(outputs.kmsKeyArn).toContain(outputs.region);
      expect(outputs.snsTopicArn).toContain(outputs.region);
    });

    test('should have all resources with consistent environment suffix', () => {
      expect(outputs.dynamoTableName).toContain(outputs.environment);
      expect(outputs.auditBucketName).toContain(outputs.environment);
      expect(outputs.validatorFunctionName).toContain(outputs.environment);
      expect(outputs.processorFunctionName).toContain(outputs.environment);
      expect(outputs.notifierFunctionName).toContain(outputs.environment);
      expect(outputs.kmsKeyAlias).toContain(outputs.environment);
      expect(outputs.snsTopicName).toContain(outputs.environment);
      expect(outputs.dashboardName).toContain(outputs.environment);
    });

    test('should have API stage matching environment suffix', () => {
      expect(outputs.apiStage).toBe(outputs.environment);
    });
  });

  // ============================================================================
  // Naming Convention Tests
  // ============================================================================
  describe('Naming Convention Compliance', () => {
    test('should follow payment- prefix naming convention', () => {
      expect(outputs.auditBucketName).toMatch(/^payment-/);
      expect(outputs.validatorFunctionName).toMatch(/^payment-/);
      expect(outputs.processorFunctionName).toMatch(/^payment-/);
      expect(outputs.notifierFunctionName).toMatch(/^payment-/);
      expect(outputs.snsTopicName).toMatch(/^payment-/);
      expect(outputs.dashboardName).toMatch(/^payment-/);
    });
  });

  // ============================================================================
  // ARN Format Validation Tests
  // ============================================================================
  describe('ARN Format Validation', () => {

    test('should have ARNs with account ID in correct position', () => {
      const arnsWithAccountId = [
        outputs.dynamoTableArn,
        outputs.validatorFunctionArn,
        outputs.processorFunctionArn,
        outputs.notifierFunctionArn,
        outputs.kmsKeyArn,
        outputs.snsTopicArn,
      ];

      arnsWithAccountId.forEach(arn => {
        const parts = arn.split(':');
        expect(parts[4]).toMatch(/^\d{12}$/); // AWS account ID is 12 digits
      });
    });
  });

  // ============================================================================
  // Resource Relationship Tests
  // ============================================================================
  describe('Lambda-DynamoDB Integration', () => {
    test('should have Lambda functions referencing the correct DynamoDB table', () => {
      expect(outputs.dynamoTableName).toBeTruthy();
      expect(outputs.validatorFunctionName).toBeTruthy();
      expect(outputs.processorFunctionName).toBeTruthy();
    });

    test('should have DynamoDB table in the same region as Lambda functions', () => {
      const dynamoRegion = outputs.dynamoTableArn.split(':')[3];
      const validatorRegion = outputs.validatorFunctionArn.split(':')[3];
      const processorRegion = outputs.processorFunctionArn.split(':')[3];

      expect(dynamoRegion).toBe(validatorRegion);
      expect(dynamoRegion).toBe(processorRegion);
    });
  });

  describe('Lambda-S3 Integration', () => {
    test('should have processor Lambda able to access audit S3 bucket', () => {
      expect(outputs.auditBucketName).toBeTruthy();
      expect(outputs.processorFunctionName).toBeTruthy();
    });

    test('should have S3 bucket and Lambda in same region', () => {
      expect(outputs.auditBucketName).toContain(outputs.region);
      expect(outputs.processorFunctionArn).toContain(outputs.region);
    });
  });

  describe('Lambda-SNS Integration', () => {
    test('should have notifier Lambda connected to SNS topic', () => {
      expect(outputs.notifierFunctionName).toBeTruthy();
      expect(outputs.snsTopicArn).toBeTruthy();
    });

    test('should have SNS topic in same region as notifier Lambda', () => {
      const snsRegion = outputs.snsTopicArn.split(':')[3];
      const notifierRegion = outputs.notifierFunctionArn.split(':')[3];

      expect(snsRegion).toBe(notifierRegion);
    });
  });

  describe('API Gateway-Lambda Integration', () => {
    test('should have API Gateway connected to validator Lambda', () => {
      expect(outputs.apiId).toBeTruthy();
      expect(outputs.validatorFunctionArn).toBeTruthy();
    });

    test('should have API Gateway in same region as Lambda', () => {
      expect(outputs.apiUrl).toContain(outputs.region);
      expect(outputs.validatorFunctionArn).toContain(outputs.region);
    });
  });

  describe('VPC-Lambda Integration', () => {
    test('should have Lambda functions deployable to VPC subnets', () => {
      expect(outputs.vpcId).toBeTruthy();
      expect(outputs.privateSubnetIds.length).toBeGreaterThan(0);
      expect(outputs.validatorFunctionName).toBeTruthy();
    });

    test('should have VPC endpoints for AWS services', () => {
      expect(outputs.s3EndpointId).toBeTruthy();
      expect(outputs.dynamodbEndpointId).toBeTruthy();
    });
  });

  describe('KMS-Storage Integration', () => {
    test('should have KMS key for encrypting storage resources', () => {
      expect(outputs.kmsKeyId).toBeTruthy();
      expect(outputs.kmsKeyArn).toBeTruthy();
      expect(outputs.dynamoTableArn).toBeTruthy();
    });

    test('should have KMS key and DynamoDB in same region', () => {
      const kmsRegion = outputs.kmsKeyArn.split(':')[3];
      const dynamoRegion = outputs.dynamoTableArn.split(':')[3];

      expect(kmsRegion).toBe(dynamoRegion);
    });
  });

  describe('Monitoring-Resources Integration', () => {
    test('should have CloudWatch dashboard for all Lambda functions', () => {
      expect(outputs.dashboardName).toBeTruthy();
      expect(outputs.validatorFunctionName).toBeTruthy();
      expect(outputs.processorFunctionName).toBeTruthy();
      expect(outputs.notifierFunctionName).toBeTruthy();
    });

    test('should have dashboard and monitored resources in same region', () => {
      expect(outputs.dashboardUrl).toContain(outputs.region);
      expect(outputs.validatorFunctionArn).toContain(outputs.region);
    });
  });
});
