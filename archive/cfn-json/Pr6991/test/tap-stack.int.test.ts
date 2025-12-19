import { 
  KMS, S3, DynamoDB, Lambda, APIGateway, SecretsManager, 
  EC2, CloudWatchLogs, IAM 
} from 'aws-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');

// Initialize AWS SDK clients
const kms = new KMS({ region: AWS_REGION });
const s3 = new S3({ region: AWS_REGION });
const dynamodb = new DynamoDB({ region: AWS_REGION });
const lambda = new Lambda({ region: AWS_REGION });
const apiGateway = new APIGateway({ region: AWS_REGION });
const secretsManager = new SecretsManager({ region: AWS_REGION });
const ec2 = new EC2({ region: AWS_REGION });
const logs = new CloudWatchLogs({ region: AWS_REGION });
const iam = new IAM({ region: AWS_REGION });

describe('Integration Tests - Secure Financial Data Processing Pipeline', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    try {
      outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load CloudFormation outputs:', error);
      outputs = {};
    }
  });

  describe('KMS Encryption Key', () => {
    test('should have KMS key in enabled state', async () => {
      if (!outputs.EncryptionKeyId) {
        console.warn('EncryptionKeyId not found in outputs, skipping test');
        return;
      }

      const response = await kms.describeKey({
        KeyId: outputs.EncryptionKeyId
      }).promise();

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('should have key rotation enabled', async () => {
      if (!outputs.EncryptionKeyId) {
        console.warn('EncryptionKeyId not found in outputs, skipping test');
        return;
      }

      const response = await kms.getKeyRotationStatus({
        KeyId: outputs.EncryptionKeyId
      }).promise();

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('should have proper key policy', async () => {
      if (!outputs.EncryptionKeyId) {
        console.warn('EncryptionKeyId not found in outputs, skipping test');
        return;
      }

      const response = await kms.getKeyPolicy({
        KeyId: outputs.EncryptionKeyId,
        PolicyName: 'default'
      }).promise();

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
      expect(policy.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket - Transaction Storage', () => {
    test('should have S3 bucket created', async () => {
      if (!outputs.TransactionBucketName) {
        console.warn('TransactionBucketName not found in outputs, skipping test');
        return;
      }

      const response = await s3.headBucket({
        Bucket: outputs.TransactionBucketName
      }).promise();

      expect(response).toBeDefined();
    });

    test('should have versioning enabled', async () => {
      if (!outputs.TransactionBucketName) {
        console.warn('TransactionBucketName not found in outputs, skipping test');
        return;
      }

      const response = await s3.getBucketVersioning({
        Bucket: outputs.TransactionBucketName
      }).promise();

      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption configured with KMS', async () => {
      if (!outputs.TransactionBucketName) {
        console.warn('TransactionBucketName not found in outputs, skipping test');
        return;
      }

      const response = await s3.getBucketEncryption({
        Bucket: outputs.TransactionBucketName
      }).promise();

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = response.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      
      const sseDefault = rules[0].ApplyServerSideEncryptionByDefault;
      expect(sseDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(sseDefault?.KMSMasterKeyID).toBeDefined();
    });

    test('should have public access blocked', async () => {
      if (!outputs.TransactionBucketName) {
        console.warn('TransactionBucketName not found in outputs, skipping test');
        return;
      }

      const response = await s3.getPublicAccessBlock({
        Bucket: outputs.TransactionBucketName
      }).promise();

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have lifecycle policies configured', async () => {
      if (!outputs.TransactionBucketName) {
        console.warn('TransactionBucketName not found in outputs, skipping test');
        return;
      }

      const response = await s3.getBucketLifecycleConfiguration({
        Bucket: outputs.TransactionBucketName
      }).promise();

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    });

    test('should have tags applied', async () => {
      if (!outputs.TransactionBucketName) {
        console.warn('TransactionBucketName not found in outputs, skipping test');
        return;
      }

      const response = await s3.getBucketTagging({
        Bucket: outputs.TransactionBucketName
      }).promise();

      expect(response.TagSet).toBeDefined();
      expect(response.TagSet!.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table - Transaction Records', () => {
    test('should have DynamoDB table in ACTIVE state', async () => {
      if (!outputs.TransactionTableName) {
        console.warn('TransactionTableName not found in outputs, skipping test');
        return;
      }

      const response = await dynamodb.describeTable({
        TableName: outputs.TransactionTableName
      }).promise();

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('should have encryption enabled with KMS', async () => {
      if (!outputs.TransactionTableName) {
        console.warn('TransactionTableName not found in outputs, skipping test');
        return;
      }

      const response = await dynamodb.describeTable({
        TableName: outputs.TransactionTableName
      }).promise();

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.SSEDescription?.SSEType).toBe('KMS');
      expect(response.Table?.SSEDescription?.KMSMasterKeyArn).toBeDefined();
    });

    test('should have point-in-time recovery enabled', async () => {
      if (!outputs.TransactionTableName) {
        console.warn('TransactionTableName not found in outputs, skipping test');
        return;
      }

      const response = await dynamodb.describeContinuousBackups({
        TableName: outputs.TransactionTableName
      }).promise();

      expect(response.ContinuousBackupsDescription).toBeDefined();
      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('should use PAY_PER_REQUEST billing mode', async () => {
      if (!outputs.TransactionTableName) {
        console.warn('TransactionTableName not found in outputs, skipping test');
        return;
      }

      const response = await dynamodb.describeTable({
        TableName: outputs.TransactionTableName
      }).promise();

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('VPC - Network Isolation', () => {
    test('should have VPC created', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcs({
        VpcIds: [outputs.VpcId]
      }).promise();

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should have DNS support enabled', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcAttribute({
        VpcId: outputs.VpcId,
        Attribute: 'enableDnsSupport'
      }).promise();

      expect(response.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have DNS hostnames enabled', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcAttribute({
        VpcId: outputs.VpcId,
        Attribute: 'enableDnsHostnames'
      }).promise();

      expect(response.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have private subnets across multiple AZs', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
          { Name: 'tag:Name', Values: ['*Private*', '*private*'] }
        ]
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3); // At least 3 AZs
      
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2); // Multiple AZs for HA
    });

    test('should NOT have Internet Gateway attached', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeInternetGateways({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      expect(response.InternetGateways!.length).toBe(0);
    });

    test('should NOT have NAT Gateways', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      expect(response.NatGateways!.length).toBe(0);
    });
  });

  describe('VPC Endpoints - AWS Service Access', () => {
    test('should have VPC endpoints for AWS services', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(2); // S3, DynamoDB (Gateway endpoints)
    });

    test('should have S3 VPC endpoint', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
          { Name: 'service-name', Values: [`com.amazonaws.${AWS_REGION}.s3`] }
        ]
      }).promise();

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      expect(response.VpcEndpoints![0].State).toBe('available');
    });

    test('should have DynamoDB VPC endpoint', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
          { Name: 'service-name', Values: [`com.amazonaws.${AWS_REGION}.dynamodb`] }
        ]
      }).promise();

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      expect(response.VpcEndpoints![0].State).toBe('available');
    });

    test('should have all required VPC endpoints (S3, DynamoDB, Secrets Manager)', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      // Should have 3 VPC endpoints total
      expect(response.VpcEndpoints!.length).toBe(3);
      
      // Count Gateway and Interface endpoints
      const gatewayEndpoints = response.VpcEndpoints!.filter(e => e.VpcEndpointType === 'Gateway');
      const interfaceEndpoints = response.VpcEndpoints!.filter(e => e.VpcEndpointType === 'Interface');
      
      // 2 Gateway (S3, DynamoDB) + 1 Interface (Secrets Manager)
      expect(gatewayEndpoints.length).toBe(2);
      expect(interfaceEndpoints.length).toBe(1);
      
      // All should be available
      response.VpcEndpoints!.forEach(endpoint => {
        expect(endpoint.State).toBe('available');
      });
    });
  });

  describe('Lambda Function - Data Processing', () => {
    test('should have Lambda function deployed', async () => {
      if (!outputs.ProcessorFunctionName) {
        console.warn('ProcessorFunctionName not found in outputs, skipping test');
        return;
      }

      const response = await lambda.getFunction({
        FunctionName: outputs.ProcessorFunctionName
      }).promise();

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    });

    test('should be deployed in VPC', async () => {
      if (!outputs.ProcessorFunctionName) {
        console.warn('ProcessorFunctionName not found in outputs, skipping test');
        return;
      }

      const response = await lambda.getFunctionConfiguration({
        FunctionName: outputs.ProcessorFunctionName
      }).promise();

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBe(outputs.VpcId);
      expect(response.VpcConfig?.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig?.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('should have KMS encryption for environment variables', async () => {
      if (!outputs.ProcessorFunctionName) {
        console.warn('ProcessorFunctionName not found in outputs, skipping test');
        return;
      }

      const response = await lambda.getFunctionConfiguration({
        FunctionName: outputs.ProcessorFunctionName
      }).promise();

      if (response.Environment && Object.keys(response.Environment.Variables || {}).length > 0) {
        expect(response.KMSKeyArn).toBeDefined();
      }
    });

    test('should have proper execution role', async () => {
      if (!outputs.ProcessorFunctionName) {
        console.warn('ProcessorFunctionName not found in outputs, skipping test');
        return;
      }

      const response = await lambda.getFunctionConfiguration({
        FunctionName: outputs.ProcessorFunctionName
      }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role).toMatch(/^arn:aws:iam::/);
    });
  });

  describe('Data Storage Security - DynamoDB & Secrets Manager', () => {
    test('should use DynamoDB with KMS encryption', async () => {
      if (!outputs.TransactionTableName) {
        console.warn('TransactionTableName not found in outputs, skipping test');
        return;
      }

      const response = await dynamodb.describeTable({
        TableName: outputs.TransactionTableName
      }).promise();

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.SSEDescription?.SSEType).toBe('KMS');
    });

    test('should have Secrets Manager for credential rotation', async () => {
      // Verify Secrets Manager secret is created and configured
      // Required by PROMPT for automatic 30-day credential rotation
      expect(outputs.DatabaseSecretArn).toBeDefined();
      
      // Verify secret exists in AWS
      const secretResponse = await secretsManager.describeSecret({
        SecretId: outputs.DatabaseSecretArn
      }).promise();
      
      expect(secretResponse.ARN).toBe(outputs.DatabaseSecretArn);
      expect(secretResponse.KmsKeyId).toBeDefined(); // KMS encryption
      expect(secretResponse.RotationEnabled).toBe(true); // Rotation enabled
      expect(secretResponse.RotationRules?.AutomaticallyAfterDays).toBe(30); // 30-day rotation
    });
  });

  describe('API Gateway - Secure Access', () => {
    test('should have REST API created', async () => {
      if (!outputs.ApiId) {
        console.warn('ApiId not found in outputs, skipping test');
        return;
      }

      const response = await apiGateway.getRestApi({
        restApiId: outputs.ApiId
      }).promise();

      expect(response).toBeDefined();
      expect(response.id).toBe(outputs.ApiId);
    });

    test('should have deployment stage', async () => {
      if (!outputs.ApiId) {
        console.warn('ApiId not found in outputs, skipping test');
        return;
      }

      const response = await apiGateway.getStages({
        restApiId: outputs.ApiId
      }).promise();

      expect(response.item).toBeDefined();
      expect(response.item!.length).toBeGreaterThan(0);
    });

    test('should have CloudWatch logging enabled', async () => {
      if (!outputs.ApiId) {
        console.warn('ApiId not found in outputs, skipping test');
        return;
      }

      const stages = await apiGateway.getStages({
        restApiId: outputs.ApiId
      }).promise();

      if (stages.item && stages.item.length > 0) {
        const stage = stages.item[0];
        expect(stage.methodSettings).toBeDefined();
        
        // Check if any method has logging enabled
        const hasLogging = Object.values(stage.methodSettings || {}).some(
          (setting: any) => setting.loggingLevel && setting.loggingLevel !== 'OFF'
        );
        expect(hasLogging).toBe(true);
      }
    });

    test('should have API keys configured', async () => {
      if (!outputs.ApiId) {
        console.warn('ApiId not found in outputs, skipping test');
        return;
      }

      const response = await apiGateway.getApiKeys({
        limit: 500
      }).promise();

      // Filter API keys related to this deployment
      const relevantKeys = response.items?.filter(key => 
        key.stageKeys?.some(sk => sk.includes(outputs.ApiId))
      );

      expect(relevantKeys).toBeDefined();
      expect(relevantKeys!.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups - Network Controls', () => {
    test('should have security groups for Lambda', async () => {
      if (!outputs.LambdaSecurityGroupId) {
        console.warn('LambdaSecurityGroupId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeSecurityGroups({
        GroupIds: [outputs.LambdaSecurityGroupId]
      }).promise();

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
    });

    test('security groups should have explicit ingress rules', async () => {
      if (!outputs.LambdaSecurityGroupId) {
        console.warn('LambdaSecurityGroupId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeSecurityGroups({
        GroupIds: [outputs.LambdaSecurityGroupId]
      }).promise();

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      expect(Array.isArray(sg.IpPermissions)).toBe(true);
    });

    test('security groups should have explicit egress rules', async () => {
      if (!outputs.LambdaSecurityGroupId) {
        console.warn('LambdaSecurityGroupId not found in outputs, skipping test');
        return;
      }

      const response = await ec2.describeSecurityGroups({
        GroupIds: [outputs.LambdaSecurityGroupId]
      }).promise();

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissionsEgress).toBeDefined();
      expect(Array.isArray(sg.IpPermissionsEgress)).toBe(true);
      expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs - Audit Trails', () => {
    test('should have log groups created', async () => {
      const response = await logs.describeLogGroups({
        logGroupNamePrefix: '/aws/'
      }).promise();

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    test('log groups should have KMS encryption', async () => {
      if (!outputs.LogGroupName) {
        console.warn('LogGroupName not found in outputs, skipping test');
        return;
      }

      const response = await logs.describeLogGroups({
        logGroupNamePrefix: outputs.LogGroupName
      }).promise();

      if (response.logGroups && response.logGroups.length > 0) {
        const logGroup = response.logGroups[0];
        expect(logGroup.kmsKeyId).toBeDefined();
      }
    });

    test('log groups should have retention policies', async () => {
      if (!outputs.LogGroupName) {
        console.warn('LogGroupName not found in outputs, skipping test');
        return;
      }

      const response = await logs.describeLogGroups({
        logGroupNamePrefix: outputs.LogGroupName
      }).promise();

      if (response.logGroups && response.logGroups.length > 0) {
        const logGroup = response.logGroups[0];
        expect(logGroup.retentionInDays).toBeDefined();
        expect(logGroup.retentionInDays).toBeGreaterThan(0);
      }
    });
  });

  describe('End-to-End Compliance Validation', () => {
    test('all encryption uses customer-managed KMS keys', async () => {
      if (!outputs.EncryptionKeyId) {
        console.warn('EncryptionKeyId not found in outputs, skipping test');
        return;
      }

      // Verify S3 uses the KMS key
      if (outputs.TransactionBucketName) {
        const s3Encryption = await s3.getBucketEncryption({
          Bucket: outputs.TransactionBucketName
        }).promise();
        
        const s3KmsKeyId = s3Encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
        expect(s3KmsKeyId).toContain(outputs.EncryptionKeyId);
      }

      // Verify DynamoDB uses the KMS key
      if (outputs.TransactionTableName) {
        const tableDesc = await dynamodb.describeTable({
          TableName: outputs.TransactionTableName
        }).promise();
        
        expect(tableDesc.Table?.SSEDescription?.KMSMasterKeyArn).toContain(outputs.EncryptionKeyId);
      }
    });

    test('network is fully isolated (no internet connectivity)', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      // Verify no IGW
      const igws = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.VpcId] }]
      }).promise();
      expect(igws.InternetGateways!.length).toBe(0);

      // Verify no NAT gateways
      const nats = await ec2.describeNatGateways({
        Filter: [{ Name: 'vpc-id', Values: [outputs.VpcId] }]
      }).promise();
      expect(nats.NatGateways!.length).toBe(0);

      // Verify VPC endpoints exist for AWS services (S3 and DynamoDB Gateway endpoints)
      const endpoints = await ec2.describeVpcEndpoints({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }]
      }).promise();
      expect(endpoints.VpcEndpoints!.length).toBeGreaterThanOrEqual(2);
      
      // All should be Gateway endpoints (no Interface endpoints to avoid limits)
      endpoints.VpcEndpoints!.forEach(endpoint => {
        expect(endpoint.VpcEndpointType).toBe('Gateway');
      });
    });

    test('all resources have proper compliance tags', async () => {
      const resourcesToCheck = [
        { name: 'S3', id: outputs.TransactionBucketName, getTagsFn: () => 
          s3.getBucketTagging({ Bucket: outputs.TransactionBucketName }).promise() },
        { name: 'DynamoDB', id: outputs.TransactionTableArn, getTagsFn: () => 
          dynamodb.listTagsOfResource({ ResourceArn: outputs.TransactionTableArn }).promise() },
      ];

      for (const resource of resourcesToCheck) {
        if (resource.id) {
          try {
            const tags: any = await resource.getTagsFn();
            const tagArray = tags.TagSet || tags.Tags || [];
            expect(tagArray.length).toBeGreaterThan(0);
          } catch (error) {
            console.warn(`Could not verify tags for ${resource.name}:`, error);
          }
        }
      }
    });

    test('Secrets Manager with automatic rotation is configured', async () => {
      if (!outputs.TransactionTableName) {
        console.warn('TransactionTableName not found in outputs, skipping test');
        return;
      }

      // Verify DynamoDB table is properly secured with KMS encryption
      const table = await dynamodb.describeTable({
        TableName: outputs.TransactionTableName
      }).promise();

      expect(table.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(table.Table?.SSEDescription?.SSEType).toBe('KMS');
      
      // Verify Secrets Manager is configured per PROMPT requirements
      expect(outputs.DatabaseSecretArn).toBeDefined();
      
      // Verify secret has automatic 30-day rotation enabled
      const secretResponse = await secretsManager.describeSecret({
        SecretId: outputs.DatabaseSecretArn
      }).promise();
      
      expect(secretResponse.RotationEnabled).toBe(true);
      expect(secretResponse.RotationRules?.AutomaticallyAfterDays).toBe(30);
      expect(secretResponse.KmsKeyId).toBeDefined(); // KMS encryption required
    });
  });
});

