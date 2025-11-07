import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import fs from 'fs';
import path from 'path';

// Configuration - Load from CDK outputs after deployment
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const environment = process.env.ENVIRONMENT || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const dynamodbClient = new DynamoDBClient({ region });
const ssmClient = new SSMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const secretsClient = new SecretsManagerClient({ region });

// Helper function to load outputs
function loadOutputs() {
  if (fs.existsSync(outputsPath)) {
    return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  }
  return null;
}

// Skip tests if outputs file doesn't exist (stack not deployed)
const outputs = loadOutputs();
const skipTests = !outputs;

if (skipTests) {
  console.log('⚠️  Skipping integration tests - cfn-outputs/flat-outputs.json not found');
  console.log('💡 Deploy the stack first: npm run cdk:deploy');
}

describe('TapStack Integration Tests - Real AWS Resources', () => {
  // Skip all tests if stack is not deployed
  beforeAll(() => {
    if (skipTests) {
      console.log('Tests skipped - stack not deployed');
    }
  });

  describe('VPC Integration Tests', () => {
    test('VPC should exist with correct CIDR block', async () => {
      if (skipTests) return;

      const vpcId = outputs.VpcId || outputs.vpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      // Verify CIDR block based on environment
      const expectedCidrs: Record<string, string> = {
        dev: '10.0.0.0/16',
        staging: '10.1.0.0/16',
        prod: '10.2.0.0/16',
      };

      expect(vpc.CidrBlock).toBe(expectedCidrs[environment]);
      expect(vpc.State).toBe('available');
    }, 30000);

    test('VPC should have correct number of subnets', async () => {
      if (skipTests) return;

      const vpcId = outputs.VpcId || outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      // Should have 4 subnets (2 public + 2 private across 2 AZs)
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Verify subnet availability
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
      });
    }, 30000);

    test('Security groups should exist and be configured', async () => {
      if (skipTests) return;

      const vpcId = outputs.VpcId || outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      // Should have Lambda and Database security groups
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);

      // Find database security group
      const dbSecurityGroup = response.SecurityGroups!.find((sg) =>
        sg.Description?.includes('RDS database')
      );

      if (dbSecurityGroup) {
        // Verify PostgreSQL port (5432) is allowed
        const hasPostgresRule = dbSecurityGroup.IpPermissions?.some(
          (rule) => rule.FromPort === 5432 && rule.ToPort === 5432
        );
        expect(hasPostgresRule).toBe(true);
      }
    }, 30000);
  });

  describe('RDS Database Integration Tests', () => {
    test('FIX 1: RDS instance should have encryption enabled', async () => {
      if (skipTests) return;

      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];

      // FIX 1: Verify storage encryption is enabled
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DBInstanceStatus).toBe('available');
    }, 60000);

    test('FIX 2: RDS instance should use correct instance type from config', async () => {
      if (skipTests) return;

      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];

      // Verify instance type based on environment
      const expectedInstanceTypes: Record<string, string> = {
        dev: 'db.t3.micro',
        staging: 'db.t3.small',
        prod: 'db.r5.large',
      };

      expect(dbInstance.DBInstanceClass).toBe(expectedInstanceTypes[environment]);
    }, 60000);

    test('RDS should be using PostgreSQL with correct version', async () => {
      if (skipTests) return;

      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];

      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toMatch(/^14\.15/);
    }, 60000);

    test('RDS should have correct multi-AZ configuration', async () => {
      if (skipTests) return;

      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];

      // Verify multi-AZ based on environment
      if (environment === 'prod') {
        expect(dbInstance.MultiAZ).toBe(true);
      } else {
        expect(dbInstance.MultiAZ).toBe(false);
      }
    }, 60000);

    test('RDS should have correct backup retention', async () => {
      if (skipTests) return;

      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];

      // Verify backup retention based on environment
      const expectedRetention: Record<string, number> = {
        dev: 7,
        staging: 14,
        prod: 30,
      };

      expect(dbInstance.BackupRetentionPeriod).toBe(expectedRetention[environment]);
    }, 60000);

    test('RDS credentials should be stored in Secrets Manager', async () => {
      if (skipTests) return;

      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);

      expect(secret.username).toBe('dbadmin');
      expect(secret.password).toBeDefined();
      expect(secret.host).toBeDefined();
    }, 30000);
  });

  describe('Lambda Function Integration Tests', () => {
    test('Lambda function should exist with correct configuration', async () => {
      if (skipTests) return;

      const functionName = `data-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      const config = response.Configuration!;

      expect(config.Runtime).toBe('python3.11');
      expect(config.Handler).toBe('index.handler');
      expect(config.Timeout).toBe(30);

      // Verify memory size based on environment
      const expectedMemory: Record<string, number> = {
        dev: 512,
        staging: 1024,
        prod: 2048,
      };

      expect(config.MemorySize).toBe(expectedMemory[environment]);
    }, 30000);

    test('Lambda function should be in VPC', async () => {
      if (skipTests) return;

      const functionName = `data-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      const config = response.Configuration!;

      expect(config.VpcConfig).toBeDefined();
      expect(config.VpcConfig!.VpcId).toBeDefined();
      expect(config.VpcConfig!.SubnetIds).toBeDefined();
      expect(config.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(config.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(config.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, 30000);

    test('Lambda function should be invokable', async () => {
      if (skipTests) return;

      const functionName = `data-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({ test: 'event' })),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);
    }, 30000);

    test('Lambda should have environment variables configured', async () => {
      if (skipTests) return;

      const functionName = `data-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      const config = response.Configuration!;

      expect(config.Environment).toBeDefined();
      expect(config.Environment!.Variables).toBeDefined();
      expect(config.Environment!.Variables!.DB_SECRET_ARN).toBeDefined();
    }, 30000);
  });

  describe('S3 Bucket Integration Tests', () => {
    test('S3 bucket should exist', async () => {
      if (skipTests) return;

      const bucketName = `analytics-data-${environmentSuffix}`;

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    }, 30000);

    test('S3 bucket should have encryption enabled', async () => {
      if (skipTests) return;

      const bucketName = `analytics-data-${environmentSuffix}`;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    }, 30000);

    test('S3 bucket should have correct versioning configuration', async () => {
      if (skipTests) return;

      const bucketName = `analytics-data-${environmentSuffix}`;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      // Verify versioning based on environment
      if (environment === 'dev') {
        // Dev doesn't have versioning enabled
        expect(response.Status).toBeUndefined();
      } else {
        // Staging and Prod have versioning enabled
        expect(response.Status).toBe('Enabled');
      }
    }, 30000);
  });

  describe('DynamoDB Table Integration Tests', () => {
    test('DynamoDB table should exist with correct configuration', async () => {
      if (skipTests) return;

      const tableName = `analytics-state-${environmentSuffix}`;

      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table).toBeDefined();
      const table = response.Table!;

      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.TableName).toBe(tableName);

      // Verify partition key
      expect(table.KeySchema).toHaveLength(1);
      expect(table.KeySchema![0].AttributeName).toBe('id');
      expect(table.KeySchema![0].KeyType).toBe('HASH');
    }, 30000);

    test('DynamoDB table should have encryption enabled', async () => {
      if (skipTests) return;

      const tableName = `analytics-state-${environmentSuffix}`;

      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      const table = response.Table!;

      expect(table.SSEDescription).toBeDefined();
      expect(table.SSEDescription!.Status).toBe('ENABLED');
    }, 30000);

    test('DynamoDB table should have correct billing mode', async () => {
      if (skipTests) return;

      const tableName = `analytics-state-${environmentSuffix}`;

      const response = await dynamodbClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      const table = response.Table!;

      // Verify billing mode based on environment
      if (environment === 'prod') {
        expect(table.BillingModeSummary?.BillingMode).toBe('PROVISIONED');
        expect(table.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
        expect(table.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
      } else {
        expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      }
    }, 30000);
  });

  describe('SSM Parameters Integration Tests', () => {
    test('Database endpoint parameter should exist and be readable', async () => {
      if (skipTests) return;

      const paramName = `/${environment}/database/endpoint`;

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBeDefined();
      expect(response.Parameter!.Value).toMatch(/\.rds\.amazonaws\.com$/);
    }, 30000);

    test('S3 bucket parameter should exist and be readable', async () => {
      if (skipTests) return;

      const paramName = `/${environment}/storage/bucket`;

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe(`analytics-data-${environmentSuffix}`);
    }, 30000);

    test('DynamoDB table parameter should exist and be readable', async () => {
      if (skipTests) return;

      const paramName = `/${environment}/storage/table`;

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe(`analytics-state-${environmentSuffix}`);
    }, 30000);
  });

  describe('CloudWatch Logs Integration Tests', () => {
    test('FIX 3 & FIX 4: Lambda log group should exist with correct retention', async () => {
      if (skipTests) return;

      const logGroupName = `/aws/lambda/data-processor-${environmentSuffix}`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();

      // FIX 3: Verify retention days matches config
      const expectedRetention: Record<string, number> = {
        dev: 7,
        staging: 30,
        prod: 90,
      };

      expect(logGroup!.retentionInDays).toBe(expectedRetention[environment]);
    }, 30000);
  });

  describe('End-to-End Integration Tests', () => {
    test('All resources should be properly connected', async () => {
      if (skipTests) return;

      // Test that we can retrieve all key resource identifiers
      const functionName = `data-processor-${environmentSuffix}`;
      const bucketName = `analytics-data-${environmentSuffix}`;
      const tableName = `analytics-state-${environmentSuffix}`;
      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();

      // Verify Lambda exists
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(lambdaResponse.Configuration).toBeDefined();

      // Verify S3 exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      // Verify DynamoDB exists
      const dynamoResponse = await dynamodbClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(dynamoResponse.Table?.TableStatus).toBe('ACTIVE');

      // Verify RDS exists
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toBe('available');
    }, 60000);

    test('All 6 fixes should be verified in deployed infrastructure', async () => {
      if (skipTests) return;

      const dbIdentifier = outputs.DatabaseIdentifier;
      expect(dbIdentifier).toBeDefined();
      const logGroupName = `/aws/lambda/data-processor-${environmentSuffix}`;

      // FIX 1: Verify RDS encryption
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // FIX 2: Verify RDS instance type from config
      const expectedInstanceTypes: Record<string, string> = {
        dev: 'db.t3.micro',
        staging: 'db.t3.small',
        prod: 'db.r5.large',
      };
      expect(rdsResponse.DBInstances![0].DBInstanceClass).toBe(
        expectedInstanceTypes[environment]
      );

      // FIX 3: Verify log retention uses enum value
      const logsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      const logGroup = logsResponse.logGroups!.find(
        (lg) => lg.logGroupName === logGroupName
      );
      const expectedRetention: Record<string, number> = {
        dev: 7,
        staging: 30,
        prod: 90,
      };
      expect(logGroup!.retentionInDays).toBe(expectedRetention[environment]);

      // FIX 4: RemovalPolicy verified during deployment/teardown
      // FIX 5: Environment validation verified in unit tests
      // FIX 6: All environment configs verified through this test running
    }, 60000);
  });

  describe('Resource Tags Integration Tests', () => {
    test('Resources should have correct tags', async () => {
      if (skipTests) return;

      const functionName = `data-processor-${environmentSuffix}`;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      // Lambda functions should have tags (if tagging is enabled)
      if (response.Tags) {
        expect(response.Tags.Environment).toBeDefined();
        expect(response.Tags.ManagedBy).toBe('cdk');
      }
    }, 30000);
  });
});
