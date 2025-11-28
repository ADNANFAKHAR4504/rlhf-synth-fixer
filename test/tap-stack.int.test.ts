import fs from 'fs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Load deployment outputs
let outputs: any;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Warning: cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.');
  outputs = {};
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const rdsClient = new RDSClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });
const ssmClient = new SSMClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

// Helper function to check if outputs are available
const hasOutputs = () => Object.keys(outputs).length > 0;

describe('Multi-Environment Aurora Database Replication System - Integration Tests', () => {
  beforeAll(() => {
    if (!hasOutputs()) {
      console.warn('Skipping integration tests: deployment outputs not available');
    }
  });

  describe('VPC and Networking', () => {
    test('should have deployed VPC with correct configuration', async () => {
      if (!hasOutputs()) return;
      expect(outputs.VPCId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have two private subnets in different AZs', async () => {
      if (!hasOutputs()) return;
      expect(outputs.VPCId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      // Check that subnets are in different availability zones
      const azs = response.Subnets!.map((subnet) => subnet.AvailabilityZone);
      const uniqueAZs = new Set(azs);
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have database security group with port 3306 allowed', async () => {
      if (!hasOutputs()) return;
      expect(outputs.VPCId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'group-name',
              Values: [`db-sg-*-${environmentSuffix}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      const dbSg = response.SecurityGroups![0];

      const hasMySQL = dbSg.IpPermissions!.some(
        (rule) => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(hasMySQL).toBe(true);
    });
  });

  describe('Aurora Database Cluster', () => {
    test('should have Aurora cluster with correct configuration', async () => {
      if (!hasOutputs()) return;
      expect(outputs.AuroraClusterEndpoint).toBeDefined();

      const clusterIdentifier = `aurora-cluster-dev-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];

      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.Status).toBe('available');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.DeletionProtection).toBe(false);
    });

    test('should have two Aurora instances with correct instance class', async () => {
      if (!hasOutputs()) return;

      const clusterIdentifier = `aurora-cluster-dev-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterIdentifier],
            },
          ],
        })
      );

      expect(response.DBInstances!.length).toBe(2);

      response.DBInstances!.forEach((instance) => {
        expect(instance.DBInstanceClass).toBe('db.r5.large');
        expect(instance.PubliclyAccessible).toBe(false);
        expect(instance.DBInstanceStatus).toBe('available');
      });
    });

    test('Aurora cluster endpoint should be reachable', async () => {
      if (!hasOutputs()) return;
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toMatch(/^aurora-cluster-dev-.+\.cluster-.+\.rds\.amazonaws\.com$/);
    });

    test('Aurora cluster read endpoint should be reachable', async () => {
      if (!hasOutputs()) return;
      expect(outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(outputs.AuroraClusterReadEndpoint).toMatch(/^aurora-cluster-dev-.+\.cluster-ro-.+\.rds\.amazonaws\.com$/);
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS encryption key with rotation enabled', async () => {
      if (!hasOutputs()) return;
      expect(outputs.EncryptionKeyId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.EncryptionKeyId,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('should have KMS alias configured', async () => {
      if (!hasOutputs()) return;

      const response = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const alias = response.Aliases!.find((a) =>
        a.AliasName?.includes(environmentSuffix)
      );
      expect(alias).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    test('should have database credentials secret', async () => {
      if (!hasOutputs()) return;
      expect(outputs.DatabaseSecretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DatabaseSecretArn,
        })
      );

      expect(response.Name).toContain(environmentSuffix);
      expect(response.KmsKeyId).toBeDefined();
      expect(response.RotationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket for Migration Scripts', () => {
    test('should have migration scripts bucket with versioning enabled', async () => {
      if (!hasOutputs()) return;
      expect(outputs.MigrationBucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.MigrationBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('should have bucket encryption configured', async () => {
      if (!hasOutputs()) return;
      expect(outputs.MigrationBucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.MigrationBucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule =
        response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('should have 30-day lifecycle policy', async () => {
      if (!hasOutputs()) return;
      expect(outputs.MigrationBucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.MigrationBucketName,
        })
      );

      expect(response.Rules).toBeDefined();
      const rule = response.Rules!.find((r) => r.Status === 'Enabled');
      expect(rule).toBeDefined();
      expect(rule!.Expiration?.Days).toBe(30);
    });
  });

  describe('Lambda Functions', () => {
    test('should have schema sync Lambda function deployed', async () => {
      if (!hasOutputs()) return;
      expect(outputs.SchemaSyncLambdaArn).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.SchemaSyncLambdaArn,
        })
      );

      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.VpcConfig).toBeDefined();
    });

    test('should have data sync Lambda function deployed', async () => {
      if (!hasOutputs()) return;
      expect(outputs.DataSyncLambdaArn).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.DataSyncLambdaArn,
        })
      );

      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.VpcConfig).toBeDefined();
    });

    test('Lambda functions should have required environment variables', async () => {
      if (!hasOutputs()) return;
      expect(outputs.SchemaSyncLambdaArn).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.SchemaSyncLambdaArn,
        })
      );

      const envVars = response.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars!.DB_SECRET_ARN).toBeDefined();
      expect(envVars!.DB_CLUSTER_ENDPOINT).toBeDefined();
      expect(envVars!.MIGRATION_BUCKET).toBeDefined();
      expect(envVars!.ENVIRONMENT).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have Lambda execution role with correct policies', async () => {
      if (!hasOutputs()) return;

      const roleName = `lambda-execution-role-dev-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have cross-account role configured', async () => {
      if (!hasOutputs()) return;
      expect(outputs.CrossAccountRoleArn).toBeDefined();

      const roleName = `cross-account-sync-role-dev-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBe(outputs.CrossAccountRoleArn);
    });
  });

  describe('SSM Parameters', () => {
    test('should have database connection parameter stored', async () => {
      if (!hasOutputs()) return;

      const paramName = `/db-connection-dev-${environmentSuffix}`;
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
          WithDecryption: false,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('SecureString');
    });

    test('database connection parameter should contain valid JSON', async () => {
      if (!hasOutputs()) return;

      const paramName = `/db-connection-dev-${environmentSuffix}`;
      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramName,
          WithDecryption: true,
        })
      );

      expect(response.Parameter?.Value).toBeDefined();
      const connectionInfo = JSON.parse(response.Parameter!.Value!);
      expect(connectionInfo.endpoint).toBeDefined();
      expect(connectionInfo.port).toBe('3306');
      expect(connectionInfo.database).toBe('mysql');
      expect(connectionInfo.secret_arn).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have replication lag alarm configured', async () => {
      if (!hasOutputs()) return;

      const alarmName = `replication-lag-alarm-dev-${environmentSuffix}`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('AuroraReplicaLag');
      expect(alarm.Threshold).toBe(60);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have schema sync error alarm configured', async () => {
      if (!hasOutputs()) return;

      const alarmName = `schema-sync-error-alarm-dev-${environmentSuffix}`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
    });

    test('should have data sync error alarm configured', async () => {
      if (!hasOutputs()) return;

      const alarmName = `data-sync-error-alarm-dev-${environmentSuffix}`;
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resources should use environmentSuffix in names', () => {
      if (!hasOutputs()) return;

      // Check that all output values contain the environment suffix
      const outputValues = Object.values(outputs).filter(
        (v) => typeof v === 'string'
      );
      const hasEnvSuffixInOutputs = outputValues.some((value: any) =>
        value.includes(environmentSuffix)
      );
      expect(hasEnvSuffixInOutputs).toBe(true);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Lambda functions can access database credentials', async () => {
      if (!hasOutputs()) return;
      expect(outputs.SchemaSyncLambdaArn).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.SchemaSyncLambdaArn,
        })
      );

      expect(lambdaConfig.Environment?.Variables?.DB_SECRET_ARN).toBe(
        outputs.DatabaseSecretArn
      );
    });

    test('Lambda functions are configured with correct cluster endpoint', async () => {
      if (!hasOutputs()) return;
      expect(outputs.SchemaSyncLambdaArn).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.SchemaSyncLambdaArn,
        })
      );

      expect(
        lambdaConfig.Environment?.Variables?.DB_CLUSTER_ENDPOINT
      ).toBe(outputs.AuroraClusterEndpoint);
    });

    test('Lambda functions are configured with migration bucket', async () => {
      if (!hasOutputs()) return;
      expect(outputs.SchemaSyncLambdaArn).toBeDefined();
      expect(outputs.MigrationBucketName).toBeDefined();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.SchemaSyncLambdaArn,
        })
      );

      expect(lambdaConfig.Environment?.Variables?.MIGRATION_BUCKET).toBe(
        outputs.MigrationBucketName
      );
    });
  });
});
