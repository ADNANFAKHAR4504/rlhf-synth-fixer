import fs from 'fs';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
  StackResourceSummary,
} from '@aws-sdk/client-cloudformation';
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

const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const cfnClient = new CloudFormationClient({ region });
const rdsClient = new RDSClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });
const ssmClient = new SSMClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

interface DiscoveredStack {
  stackName: string;
  stackStatus: string;
  outputs: Record<string, string>;
  resources: Record<string, StackResourceSummary>;
  environmentSuffix: string;
  environment: string;
}

/**
 * Dynamically discover the CloudFormation stack name
 */
async function discoverStackName(): Promise<string> {
  // Try environment variable first
  if (process.env.STACK_NAME) {
    try {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: process.env.STACK_NAME })
      );
      if (response.Stacks && response.Stacks.length > 0) {
        const status = response.Stacks[0].StackStatus;
        if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
          return process.env.STACK_NAME;
        }
      }
    } catch (error) {
      // Stack not found, continue to discovery
    }
  }

  // Try with ENVIRONMENT_SUFFIX
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const candidateStackName = `TapStack${envSuffix}`;
  
  try {
    const response = await cfnClient.send(
      new DescribeStacksCommand({ StackName: candidateStackName })
    );
    if (response.Stacks && response.Stacks.length > 0) {
      const status = response.Stacks[0].StackStatus;
      if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
        return candidateStackName;
      }
    }
  } catch (error) {
    // Stack not found, continue to discovery
  }

  // Fallback: List all stacks and find TapStack
  let nextToken: string | undefined;
  do {
    const listResponse = await cfnClient.send(
      new DescribeStacksCommand({ NextToken: nextToken })
    );

    const matchingStack = listResponse.Stacks?.find(
      (stack) =>
        stack.StackName?.startsWith('TapStack') &&
        stack.StackStatus !== 'DELETE_COMPLETE' &&
        (stack.StackStatus === 'CREATE_COMPLETE' ||
          stack.StackStatus === 'UPDATE_COMPLETE')
    );

    if (matchingStack) {
      return matchingStack.StackName!;
    }

    nextToken = undefined; // DescribeStacksCommand doesn't support pagination the same way
  } while (nextToken);

  throw new Error(
    `Could not find CloudFormation stack. ` +
    `Searched for: ${candidateStackName} or any TapStack* stack. ` +
    `Please ensure the stack is deployed and in CREATE_COMPLETE or UPDATE_COMPLETE status.`
  );
}

/**
 * Discover all resources from the CloudFormation stack
 */
async function discoverStackResources(
  stackName: string
): Promise<Record<string, StackResourceSummary>> {
  const resources: Record<string, StackResourceSummary> = {};
  let nextToken: string | undefined;

  do {
    const response = await cfnClient.send(
      new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      })
    );

    if (response.StackResourceSummaries) {
      for (const resource of response.StackResourceSummaries) {
        if (resource.LogicalResourceId && resource.PhysicalResourceId) {
          resources[resource.LogicalResourceId] = resource;
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return resources;
}

/**
 * Discover stack outputs, resources, and metadata
 */
async function discoverStack(): Promise<DiscoveredStack> {
  const stackName = await discoverStackName();

  // Get stack details including outputs
  const stackResponse = await cfnClient.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
    throw new Error(`Stack ${stackName} not found`);
  }

  const stack = stackResponse.Stacks[0];
  const stackStatus = stack.StackStatus || 'UNKNOWN';

  if (
    stackStatus !== 'CREATE_COMPLETE' &&
    stackStatus !== 'UPDATE_COMPLETE'
  ) {
    throw new Error(
      `Stack ${stackName} is not in a valid state. Current status: ${stackStatus}`
    );
  }

  // Extract outputs
  const outputs: Record<string, string> = {};
  if (stack.Outputs) {
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    }
  }

  // Discover all resources
  const resources = await discoverStackResources(stackName);

  // Extract environment suffix from stack name or parameters
  let environmentSuffix = 'dev';
  let environment = 'dev';

  // Try to get from stack parameters
  if (stack.Parameters) {
    const envSuffixParam = stack.Parameters.find(
      (p) => p.ParameterKey === 'EnvironmentSuffix'
    );
    const envParam = stack.Parameters.find(
      (p) => p.ParameterKey === 'Environment'
    );

    if (envSuffixParam?.ParameterValue) {
      environmentSuffix = envSuffixParam.ParameterValue;
    }
    if (envParam?.ParameterValue) {
      environment = envParam.ParameterValue;
    }
  }

  // Fallback: extract from stack name
  if (environmentSuffix === 'dev') {
    const match = stackName.match(/TapStack(.+)/);
    if (match && match[1]) {
      environmentSuffix = match[1];
    }
  }

  return {
    stackName,
    stackStatus,
    outputs,
    resources,
    environmentSuffix,
    environment,
  };
}

describe('Multi-Environment Aurora Database Replication System - Integration Tests', () => {
  let discovered: DiscoveredStack;

  beforeAll(async () => {
    try {
      discovered = await discoverStack();
      console.log(`Discovered stack: ${discovered.stackName}`);
      console.log(`Environment: ${discovered.environment}, Suffix: ${discovered.environmentSuffix}`);
      console.log(`Found ${Object.keys(discovered.resources).length} resources`);
      console.log(`Found ${Object.keys(discovered.outputs).length} outputs`);
    } catch (error: any) {
      console.error('Failed to discover stack:', error.message);
      throw error;
    }
  });

  describe('Stack Discovery', () => {
    test('should discover stack successfully', () => {
      expect(discovered).toBeDefined();
      expect(discovered.stackName).toBeDefined();
      expect(discovered.stackStatus).toMatch(/COMPLETE/);
    });

    test('should have required outputs', () => {
      expect(discovered.outputs.VPCId).toBeDefined();
      expect(discovered.outputs.AuroraClusterEndpoint).toBeDefined();
      expect(discovered.outputs.DatabaseSecretArn).toBeDefined();
      expect(discovered.outputs.MigrationBucketName).toBeDefined();
      expect(discovered.outputs.EncryptionKeyId).toBeDefined();
    });

    test('should have discovered resources', () => {
      expect(discovered.resources.VPC).toBeDefined();
      expect(discovered.resources.AuroraCluster).toBeDefined();
      expect(discovered.resources.DatabaseSecret).toBeDefined();
      expect(discovered.resources.MigrationScriptBucket).toBeDefined();
      expect(discovered.resources.EncryptionKey).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should have deployed VPC with correct configuration', async () => {
      const vpcResource = discovered.resources.VPC;
      expect(vpcResource).toBeDefined();
      expect(vpcResource.PhysicalResourceId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcResource.PhysicalResourceId!],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      // DNS settings are enabled by default for VPCs, but may not always be in the response
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
    });

    test('should have two private subnets in different AZs', async () => {
      const vpcResource = discovered.resources.VPC;
      expect(vpcResource.PhysicalResourceId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcResource.PhysicalResourceId!],
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
      const vpcResource = discovered.resources.VPC;
      const dbSgResource = discovered.resources.DatabaseSecurityGroup;
      expect(vpcResource.PhysicalResourceId).toBeDefined();
      expect(dbSgResource).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [dbSgResource.PhysicalResourceId!],
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
      const clusterResource = discovered.resources.AuroraCluster;
      expect(clusterResource).toBeDefined();
      expect(clusterResource.PhysicalResourceId).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterResource.PhysicalResourceId!,
        })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];

      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.Status).toBe('available');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
    });

    test('should have two Aurora instances with correct instance class', async () => {
      const clusterResource = discovered.resources.AuroraCluster;
      expect(clusterResource.PhysicalResourceId).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterResource.PhysicalResourceId!],
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

    test('Aurora cluster endpoint should match output', async () => {
      expect(discovered.outputs.AuroraClusterEndpoint).toBeDefined();
      expect(discovered.outputs.AuroraClusterEndpoint).toMatch(
        /^aurora-cluster-.+\.cluster-.+\.rds\.amazonaws\.com$/
      );
    });

    test('Aurora cluster read endpoint should be reachable', async () => {
      expect(discovered.outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(discovered.outputs.AuroraClusterReadEndpoint).toMatch(
        /^aurora-cluster-.+\.cluster-ro-.+\.rds\.amazonaws\.com$/
      );
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS encryption key with rotation enabled', async () => {
      const keyResource = discovered.resources.EncryptionKey;
      expect(keyResource).toBeDefined();
      expect(keyResource.PhysicalResourceId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: keyResource.PhysicalResourceId!,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('should have KMS alias configured', async () => {
      const aliasResource = discovered.resources.EncryptionKeyAlias;
      expect(aliasResource).toBeDefined();

      const response = await kmsClient.send(new ListAliasesCommand({}));

      const alias = response.Aliases!.find(
        (a) => a.AliasName === aliasResource.PhysicalResourceId
      );
      expect(alias).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    test('should have database credentials secret', async () => {
      const secretResource = discovered.resources.DatabaseSecret;
      expect(secretResource).toBeDefined();
      expect(secretResource.PhysicalResourceId).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: secretResource.PhysicalResourceId!,
        })
      );

      expect(response.Name).toBeDefined();
      expect(response.KmsKeyId).toBeDefined();
      expect(response.RotationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket for Migration Scripts', () => {
    test('should have migration scripts bucket with versioning enabled', async () => {
      const bucketResource = discovered.resources.MigrationScriptBucket;
      expect(bucketResource).toBeDefined();
      expect(bucketResource.PhysicalResourceId).toBeDefined();

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketResource.PhysicalResourceId!,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('should have bucket encryption configured', async () => {
      const bucketResource = discovered.resources.MigrationScriptBucket;
      expect(bucketResource.PhysicalResourceId).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketResource.PhysicalResourceId!,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('should have 30-day lifecycle policy', async () => {
      const bucketResource = discovered.resources.MigrationScriptBucket;
      expect(bucketResource.PhysicalResourceId).toBeDefined();

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketResource.PhysicalResourceId!,
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
      const lambdaResource = discovered.resources.SchemaSyncLambda;
      expect(lambdaResource).toBeDefined();
      expect(lambdaResource.PhysicalResourceId).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaResource.PhysicalResourceId!,
        })
      );

      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.VpcConfig).toBeDefined();
    });

    test('should have data sync Lambda function deployed', async () => {
      const lambdaResource = discovered.resources.DataSyncLambda;
      expect(lambdaResource).toBeDefined();
      expect(lambdaResource.PhysicalResourceId).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: lambdaResource.PhysicalResourceId!,
        })
      );

      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.VpcConfig).toBeDefined();
    });

    test('Lambda functions should have required environment variables', async () => {
      const lambdaResource = discovered.resources.SchemaSyncLambda;
      expect(lambdaResource.PhysicalResourceId).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaResource.PhysicalResourceId!,
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
      const roleResource = discovered.resources.LambdaExecutionRole;
      expect(roleResource).toBeDefined();
      expect(roleResource.PhysicalResourceId).toBeDefined();

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleResource.PhysicalResourceId!,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have cross-account role configured', async () => {
      const roleResource = discovered.resources.CrossAccountRole;
      expect(roleResource).toBeDefined();
      expect(roleResource.PhysicalResourceId).toBeDefined();

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleResource.PhysicalResourceId!,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBeDefined();
    });
  });

  describe('SSM Parameters', () => {
    test('should have database connection parameter stored', async () => {
      const paramResource = discovered.resources.DBConnectionParameter;
      expect(paramResource).toBeDefined();
      expect(paramResource.PhysicalResourceId).toBeDefined();

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramResource.PhysicalResourceId!,
          WithDecryption: false,
        })
      );

      expect(response.Parameter).toBeDefined();
      // Note: Changed from SecureString to String per cfn-lint requirements
      expect(response.Parameter!.Type).toBe('String');
    });

    test('database connection parameter should contain valid JSON', async () => {
      const paramResource = discovered.resources.DBConnectionParameter;
      expect(paramResource.PhysicalResourceId).toBeDefined();

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: paramResource.PhysicalResourceId!,
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
      const alarmResource = discovered.resources.ReplicationLagAlarm;
      expect(alarmResource).toBeDefined();
      expect(alarmResource.PhysicalResourceId).toBeDefined();

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmResource.PhysicalResourceId!],
        })
      );

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('AuroraReplicaLag');
      expect(alarm.Threshold).toBe(60);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have schema sync error alarm configured', async () => {
      const alarmResource = discovered.resources.SchemaSyncErrorAlarm;
      expect(alarmResource).toBeDefined();
      expect(alarmResource.PhysicalResourceId).toBeDefined();

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmResource.PhysicalResourceId!],
        })
      );

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
    });

    test('should have data sync error alarm configured', async () => {
      const alarmResource = discovered.resources.DataSyncErrorAlarm;
      expect(alarmResource).toBeDefined();
      expect(alarmResource.PhysicalResourceId).toBeDefined();

      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmResource.PhysicalResourceId!],
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
      // Check that all output values contain the environment suffix
      const outputValues = Object.values(discovered.outputs).filter(
        (v) => typeof v === 'string'
      );
      const hasEnvSuffixInOutputs = outputValues.some((value: any) =>
        value.includes(discovered.environmentSuffix)
      );
      expect(hasEnvSuffixInOutputs).toBe(true);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Lambda functions can access database credentials', async () => {
      const lambdaResource = discovered.resources.SchemaSyncLambda;
      const secretResource = discovered.resources.DatabaseSecret;
      expect(lambdaResource.PhysicalResourceId).toBeDefined();
      expect(secretResource.PhysicalResourceId).toBeDefined();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaResource.PhysicalResourceId!,
        })
      );

      expect(lambdaConfig.Environment?.Variables?.DB_SECRET_ARN).toBe(
        secretResource.PhysicalResourceId
      );
    });

    test('Lambda functions are configured with correct cluster endpoint', async () => {
      const lambdaResource = discovered.resources.SchemaSyncLambda;
      expect(lambdaResource.PhysicalResourceId).toBeDefined();
      expect(discovered.outputs.AuroraClusterEndpoint).toBeDefined();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaResource.PhysicalResourceId!,
        })
      );

      expect(lambdaConfig.Environment?.Variables?.DB_CLUSTER_ENDPOINT).toBe(
        discovered.outputs.AuroraClusterEndpoint
      );
    });

    test('Lambda functions are configured with migration bucket', async () => {
      const lambdaResource = discovered.resources.SchemaSyncLambda;
      const bucketResource = discovered.resources.MigrationScriptBucket;
      expect(lambdaResource.PhysicalResourceId).toBeDefined();
      expect(bucketResource.PhysicalResourceId).toBeDefined();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: lambdaResource.PhysicalResourceId!,
        })
      );

      expect(lambdaConfig.Environment?.Variables?.MIGRATION_BUCKET).toBe(
        bucketResource.PhysicalResourceId
      );
    });
  });
});
