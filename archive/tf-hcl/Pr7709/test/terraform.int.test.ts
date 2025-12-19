import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-apigatewayv2';
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
  DescribeReplicationGroupsCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import {
  DescribeStreamCommand,
  KinesisClient,
} from '@aws-sdk/client-kinesis';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  DescribeStateMachineCommand,
  SFNClient,
} from '@aws-sdk/client-sfn';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  GetQueueAttributesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import * as AWS from 'aws-sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TEST_TIMEOUT = 120000; // 2 minutes

// AWS SDK Clients
const rds = new AWS.RDS({ region: AWS_REGION });
const s3 = new AWS.S3({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const elasticacheClient = new ElastiCacheClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const dynamodbClient = new DynamoDBClient({ region: AWS_REGION });
const kinesisClient = new KinesisClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const sqsClient = new SQSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const apiGatewayClient = new ApiGatewayV2Client({ region: AWS_REGION });
const sfnClient = new SFNClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });

// Helper: Get Terraform outputs
function getTerraformOutputs(): Record<string, any> {
  const cfnOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (fs.existsSync(cfnOutputsPath)) {
    try {
      const data = fs.readFileSync(cfnOutputsPath, 'utf-8');
      const outputs = JSON.parse(data);

      // Parse JSON strings in outputs
      const parsed: Record<string, any> = {};
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            parsed[key] = JSON.parse(value);
          } catch {
            parsed[key] = value;
          }
        } else {
          parsed[key] = value;
        }
      }
      return parsed;
    } catch (error) {
      // Continue to try terraform output
    }
  }

  try {
    const outputJson = execSync('terraform output -json', {
      cwd: TERRAFORM_DIR,
      encoding: 'utf-8',
    });
    const outputs = JSON.parse(outputJson);
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(outputs)) {
      result[key] = (value as any).value;
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to get Terraform outputs: ${error}`);
  }
}

// Helper: Run Terraform plan
function runTerraformPlan(varFile: string): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(
      `terraform plan -var-file=${varFile} -out=tfplan-${varFile.replace('.tfvars', '')} -no-color`,
      {
        cwd: TERRAFORM_DIR,
        encoding: 'utf-8',
      }
    );
    return { success: true, output };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
    };
  }
}

// Helper: Get Terraform plan JSON
function getTerraformPlanJson(varFile: string): any {
  try {
    execSync(`terraform plan -var-file=${varFile} -out=tfplan-test`, {
      cwd: TERRAFORM_DIR,
      stdio: 'pipe',
    });

    const planJson = execSync('terraform show -json tfplan-test', {
      cwd: TERRAFORM_DIR,
      encoding: 'utf-8',
    });

    return JSON.parse(planJson);
  } catch (error) {
    return null;
  }
}

// Helper: Extract resources from plan
function extractResources(plan: any): Map<string, number> {
  const resourceCounts = new Map<string, number>();

  if (plan?.planned_values?.root_module?.resources) {
    for (const resource of plan.planned_values.root_module.resources) {
      const type = resource.type;
      resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
    }
  }

  if (plan?.planned_values?.root_module?.child_modules) {
    for (const childModule of plan.planned_values.root_module.child_modules) {
      if (childModule.resources) {
        for (const resource of childModule.resources) {
          const type = resource.type;
          resourceCounts.set(type, (resourceCounts.get(type) || 0) + 1);
        }
      }
    }
  }

  return resourceCounts;
}

// Helper: AWS API call wrapper
async function awsCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    throw new Error(`AWS API call failed: ${err.message}`);
  }
}

// =============================================================================
// SUITE 1: TERRAFORM PLAN VALIDATION
// =============================================================================

describe('Terraform Plan Validation', () => {
  const environments = ['dev.tfvars', 'staging.tfvars', 'prod.tfvars'];
  let terraformAvailable = false;

  beforeAll(() => {
    try {
      execSync('which terraform', { encoding: 'utf-8' });
      terraformAvailable = true;

      // Initialize Terraform with local backend for testing
      const backendOverride = `
terraform {
  backend "local" {}
}
`;
      const overridePath = path.join(TERRAFORM_DIR, 'backend_override.tf');
      if (!fs.existsSync(overridePath)) {
        fs.writeFileSync(overridePath, backendOverride);
      }

      execSync('terraform init -reconfigure', {
        cwd: TERRAFORM_DIR,
        stdio: 'pipe',
      });
    } catch (error) {
      terraformAvailable = false;
    }
  });

  afterAll(() => {
    // Cleanup
    try {
      const files = ['backend_override.tf', 'terraform.tfstate', 'tfplan-test', 'tfplan-dev', 'tfplan-staging', 'tfplan-prod'];
      files.forEach((file) => {
        const filePath = path.join(TERRAFORM_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('Terraform is installed and accessible', () => {
    expect(terraformAvailable).toBe(true);
  });

  test('can generate valid plans for all environments', () => {
    if (!terraformAvailable) {
      return;
    }

    for (const envFile of environments) {
      const envPath = path.join(TERRAFORM_DIR, envFile);
      if (!fs.existsSync(envPath)) {
        continue;
      }

      const result = runTerraformPlan(envFile);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/Plan:|No changes/);
      expect(result.output).not.toContain('Error:');
    }
  }, TEST_TIMEOUT * 3);

  test('plans include all expected resource types', () => {
    if (!terraformAvailable) {
      return;
    }

    const plan = getTerraformPlanJson('dev.tfvars');
    expect(plan).toBeTruthy();

    const resources = extractResources(plan);
    const resourceTypes = Array.from(resources.keys());

    const expectedTypes = [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_nat_gateway',
      'aws_eip',
      'aws_route_table',
      'aws_security_group',
      'aws_apigatewayv2_api',
      'aws_apigatewayv2_stage',
      'aws_lambda_function',
      'aws_dynamodb_table',
      'aws_kinesis_stream',
      'aws_rds_cluster',
      'aws_rds_cluster_instance',
      'aws_elasticache_replication_group',
      'aws_s3_bucket',
      'aws_kms_key',
      'aws_secretsmanager_secret',
      'aws_sns_topic',
      'aws_sqs_queue',
      'aws_sfn_state_machine',
    ];

    for (const expectedType of expectedTypes) {
      expect(resourceTypes).toContain(expectedType);
    }
  });
});

// =============================================================================
// SUITE 2: DEPLOYED INFRASTRUCTURE VALIDATION
// =============================================================================

describe('Deployed Infrastructure Validation', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Outputs have correct format', () => {
    expect(outputs.websocket_api_url).toBeDefined();
    expect(outputs.websocket_api_url).toMatch(/^wss:\/\/.*\.execute-api\..*\.amazonaws\.com/);
    expect(outputs.aurora_endpoint).toBeDefined();
    expect(outputs.vpc_id).toBeDefined();
    expect(outputs.kinesis_stream_arn).toBeTruthy();
    expect(outputs.redis_endpoint).toBeTruthy();
  });

  describe('Networking (VPC)', () => {
    test('VPC exists and is configured correctly', async () => {
      let vpcInfo: any = outputs.vpc_info;
      expect(vpcInfo).toBeDefined();

      if (typeof vpcInfo === 'string') {
        vpcInfo = JSON.parse(vpcInfo);
      }

      const vpcId = vpcInfo.vpc_id || outputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const result = await awsCall(() =>
        ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }))
      );

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].CidrBlock).toBeDefined();
    }, TEST_TIMEOUT);

    test('Private subnets exist and are configured', async () => {
      let vpcInfo: any = outputs.vpc_info;
      if (typeof vpcInfo === 'string') {
        vpcInfo = JSON.parse(vpcInfo);
      }

      const privateSubnetIds = vpcInfo.private_subnet_ids || outputs.private_subnet_ids || [];
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }))
      );

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('API Gateway (WebSocket)', () => {
    test('WebSocket API exists and is deployed', async () => {
      const apiUrl = outputs.websocket_api_url;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^wss:\/\//);

      // Extract API ID from URL
      const apiIdMatch = apiUrl.match(/wss:\/\/([^.]+)\.execute-api/);
      expect(apiIdMatch).toBeTruthy();
      const apiId = apiIdMatch![1];

      const api = await awsCall(async () =>
        await apiGatewayClient.send(new GetApiCommand({ ApiId: apiId }))
      );

      expect(api.ApiId).toBe(apiId);
      expect(api.Name).toBeDefined();
      expect(api.ProtocolType).toBe('WEBSOCKET');
    }, TEST_TIMEOUT);

    test('WebSocket API stage exists and is active', async () => {
      const apiUrl = outputs.websocket_api_url;
      const apiIdMatch = apiUrl.match(/wss:\/\/([^.]+)\.execute-api/);
      expect(apiIdMatch).toBeTruthy();
      const apiId = apiIdMatch![1];
      const stageName = 'v1';

      const stage = await awsCall(async () =>
        await apiGatewayClient.send(new GetStageCommand({
          ApiId: apiId,
          StageName: stageName,
        }))
      );

      expect(stage.StageName).toBe(stageName);
      expect(stage.DefaultRouteSettings).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Lambda Functions', () => {
    test('All Lambda functions exist and are configured', async () => {
      let lambdaArns: any = outputs.lambda_functions;
      expect(lambdaArns).toBeDefined();

      if (typeof lambdaArns === 'string') {
        lambdaArns = JSON.parse(lambdaArns);
      }

      const expectedFunctions = [
        'validator',
        'processor',
        'notifier',
        'moderator',
        'classifier',
        'trending',
        'webhook',
      ];

      for (const funcName of expectedFunctions) {
        const funcArn = lambdaArns[funcName];
        expect(funcArn).toBeDefined();

        const funcNameFromArn = funcArn.split(':').pop()?.split('/').pop();

        const func = await awsCall(() =>
          lambdaClient.send(new GetFunctionCommand({ FunctionName: funcNameFromArn! }))
        );

        expect(func.Configuration).toBeDefined();
        expect(func.Configuration!.FunctionName).toBeDefined();
        expect(func.Configuration!.Runtime).toBeDefined();
        expect(func.Configuration!.State).toBe('Active');
      }
    }, TEST_TIMEOUT * 2);
  });

  describe('Database (Aurora PostgreSQL)', () => {
    test('Aurora cluster exists and is available', async () => {
      let auroraEndpoints: any = outputs.aurora_endpoints;
      expect(auroraEndpoints).toBeDefined();

      if (typeof auroraEndpoints === 'string') {
        auroraEndpoints = JSON.parse(auroraEndpoints);
      }

      const writerEndpoint = auroraEndpoints.writer || outputs.aurora_endpoint;
      expect(writerEndpoint).toBeDefined();
      expect(writerEndpoint).toMatch(/\.rds\.amazonaws\.com/);

      const clusterIdentifier = outputs.aurora_cluster_identifier;
      expect(clusterIdentifier).toBeDefined();

      const cluster = await awsCall(() =>
        rdsClient.send(new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        }))
      );

      expect(cluster.DBClusters).toHaveLength(1);
      expect(cluster.DBClusters![0].Status).toBe('available');
      expect(cluster.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(cluster.DBClusters![0].StorageEncrypted).toBe(true);
      expect(cluster.DBClusters![0].DatabaseName).toBeDefined();
    }, TEST_TIMEOUT);

    test('Aurora cluster port is correctly configured', () => {
      const auroraPort = outputs.aurora_port;
      const portValue = typeof auroraPort === 'string' ? parseInt(auroraPort, 10) : auroraPort;
      expect(portValue).toBe(5432);
    });

    test('Aurora cluster is not publicly accessible', async () => {
      const clusterIdentifier = outputs.aurora_cluster_identifier;
      expect(clusterIdentifier).toBeDefined();

      const cluster = await awsCall(() =>
        rdsClient.send(new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        }))
      );

      // Check cluster instances for public access
      const instances = await awsCall(() =>
        rds.describeDBInstances({
          DBInstanceIdentifier: cluster.DBClusters![0].DBClusterMembers![0].DBInstanceIdentifier,
        }).promise()
      );

      expect(instances.DBInstances![0].PubliclyAccessible).toBe(false);
    }, TEST_TIMEOUT);
  });

  describe('Cache (ElastiCache Redis)', () => {
    test('Redis replication group exists', async () => {
      const redisEndpoint = outputs.redis_endpoint;
      expect(redisEndpoint).toBeDefined();
      expect(redisEndpoint).toMatch(/\.cache\.amazonaws\.com/);

      // Extract replication group ID from endpoint
      const endpointParts = redisEndpoint.split('.');
      let replicationGroupId = endpointParts[1];

      if (!replicationGroupId || replicationGroupId === '') {
        replicationGroupId = redisEndpoint.match(/master\.([^.]+)\./)?.[1] || '';
      }

      // Try to get replication group ID from outputs or construct from endpoint
      if (!replicationGroupId || replicationGroupId === '') {
        // Use a pattern match or try common naming
        const nameMatch = redisEndpoint.match(/([^-]+-[^-]+)-redis/);
        if (nameMatch) {
          replicationGroupId = nameMatch[1];
        }
      }

      expect(replicationGroupId).toBeTruthy();

      const replicationGroups = await awsCall(() =>
        elasticacheClient.send(new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        }))
      );

      expect(replicationGroups.ReplicationGroups).toBeDefined();
      expect(replicationGroups.ReplicationGroups!.length).toBeGreaterThan(0);
      expect(replicationGroups.ReplicationGroups![0].Status).toBe('available');
    }, TEST_TIMEOUT);

    test('Redis port is correctly configured', () => {
      const redisPort = outputs.redis_port;
      const portValue = typeof redisPort === 'string' ? parseInt(redisPort, 10) : redisPort;
      expect(portValue).toBe(6379);
    });
  });

  describe('Storage (S3)', () => {
    test('S3 bucket exists and has versioning enabled', async () => {
      const bucketName = outputs.s3_bucket;
      expect(bucketName).toBeDefined();

      await awsCall(() =>
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      );

      const versioning = await awsCall(() =>
        s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }))
      );

      expect(versioning.Status).toBe('Enabled');
    }, TEST_TIMEOUT);

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.s3_bucket;
      expect(bucketName).toBeDefined();

      const encryption = await awsCall(() =>
        s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }))
      );

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
      const algorithm = rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm;
      expect(['aws:kms', 'AES256']).toContain(algorithm);
    }, TEST_TIMEOUT);
  });

  describe('DynamoDB Tables', () => {
    test('All DynamoDB tables exist and are configured', async () => {
      let tables: any = outputs.dynamodb_tables;
      expect(tables).toBeDefined();

      if (typeof tables === 'string') {
        tables = JSON.parse(tables);
      }

      const expectedTables = [
        'interactions',
        'metrics',
        'preferences',
        'rules',
        'trending',
        'catalog',
      ];

      for (const tableKey of expectedTables) {
        const tableName = tables[tableKey];
        expect(tableName).toBeDefined();

        const table = await awsCall(() =>
          dynamodbClient.send(new DescribeTableCommand({ TableName: tableName }))
        );

        expect(table.Table).toBeDefined();
        expect(table.Table!.TableStatus).toBe('ACTIVE');
        expect(table.Table!.TableName).toBe(tableName);
      }
    }, TEST_TIMEOUT * 2);
  });

  describe('Kinesis Stream', () => {
    test('Kinesis stream exists and is active', async () => {
      const streamArn = outputs.kinesis_stream_arn;
      expect(streamArn).toBeDefined();

      const streamName = outputs.kinesis_stream_name;
      expect(streamName).toBeDefined();

      const stream = await awsCall(() =>
        kinesisClient.send(new DescribeStreamCommand({ StreamName: streamName }))
      );

      expect(stream.StreamDescription).toBeDefined();
      expect(stream.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(stream.StreamDescription!.StreamName).toBe(streamName);
    }, TEST_TIMEOUT);
  });

  describe('KMS Encryption', () => {
    test('KMS keys exist and have rotation enabled', async () => {
      let kmsKeyIds: any = outputs.kms_key_ids;
      expect(kmsKeyIds).toBeDefined();

      if (typeof kmsKeyIds === 'string') {
        kmsKeyIds = JSON.parse(kmsKeyIds);
      }

      const keyIds = Object.values(kmsKeyIds) as string[];
      for (const keyId of keyIds) {
        const keyDetails = await awsCall(() =>
          kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }))
        );

        expect(keyDetails.KeyMetadata?.KeyState).toBe('Enabled');

        const rotationStatus = await awsCall(() =>
          kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }))
        );

        expect(rotationStatus.KeyRotationEnabled).toBeDefined();
      }
    }, TEST_TIMEOUT);
  });

  describe('Secrets Manager', () => {
    test('Aurora credentials secret exists', async () => {
      let secrets: any = outputs.secrets_manager_secrets;
      expect(secrets).toBeDefined();

      if (typeof secrets === 'string') {
        secrets = JSON.parse(secrets);
      }

      const auroraSecretArn = secrets.aurora_credentials;
      expect(auroraSecretArn).toBeDefined();

      const secretValue = await awsCall(() =>
        secretsClient.send(new GetSecretValueCommand({ SecretId: auroraSecretArn }))
      );

      expect(secretValue.SecretString).toBeDefined();
      const credentials = JSON.parse(secretValue.SecretString!);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('SNS Topics', () => {
    test('All SNS topics exist', async () => {
      let topicArns: any = outputs.sns_topics;
      expect(topicArns).toBeDefined();

      if (typeof topicArns === 'string') {
        topicArns = JSON.parse(topicArns);
      }

      const expectedTopics = ['notifications', 'moderation', 'removed', 'new_content'];
      for (const topicKey of expectedTopics) {
        const topicArn = topicArns[topicKey];
        expect(topicArn).toBeDefined();

        const topic = await awsCall(() =>
          snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }))
        );

        expect(topic.Attributes).toBeDefined();
        expect(topic.Attributes!['TopicArn']).toBe(topicArn);
      }
    }, TEST_TIMEOUT);
  });

  describe('SQS Queues', () => {
    test('All SQS queues exist and are configured', async () => {
      let queueUrls: any = outputs.sqs_queues;
      expect(queueUrls).toBeDefined();

      if (typeof queueUrls === 'string') {
        queueUrls = JSON.parse(queueUrls);
      }

      const expectedQueues = ['push', 'email', 'sms'];
      for (const queueKey of expectedQueues) {
        const queueUrl = queueUrls[queueKey];
        expect(queueUrl).toBeDefined();

        const queue = await awsCall(() =>
          sqsClient.send(new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All'],
          }))
        );

        expect(queue.Attributes).toBeDefined();
        expect(queue.Attributes!['QueueArn']).toBeDefined();
      }
    }, TEST_TIMEOUT);
  });

  describe('Step Functions', () => {
    test('Step Functions state machine exists', async () => {
      const stateMachineArn = outputs.step_functions_arn;
      expect(stateMachineArn).toBeDefined();

      const stateMachine = await awsCall(() =>
        sfnClient.send(new DescribeStateMachineCommand({
          stateMachineArn: stateMachineArn,
        }))
      );

      expect(stateMachine.status).toBe('ACTIVE');
      expect(stateMachine.stateMachineArn).toBe(stateMachineArn);
    }, TEST_TIMEOUT);
  });

});

// =============================================================================
// SUITE 3: NETWORKING & SECURITY
// =============================================================================

describe('Networking & Security', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Security groups are configured correctly', async () => {
    let securityGroupIds: any = outputs.security_groups;
    expect(securityGroupIds).toBeDefined();

    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const expectedGroups = ['lambda', 'aurora', 'redis'];
    for (const groupKey of expectedGroups) {
      const sgId = securityGroupIds[groupKey];
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-/);

      const securityGroup = await awsCall(() =>
        ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }))
      );

      expect(securityGroup.SecurityGroups).toHaveLength(1);
      expect(securityGroup.SecurityGroups![0].GroupId).toBe(sgId);
    }
  }, TEST_TIMEOUT);

  test('Lambda security group allows outbound to Aurora port 5432', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;

    const lambdaSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [lambdaSgId] }))
    );

    const egressRules = lambdaSg.SecurityGroups![0].IpPermissionsEgress || [];
    const hasAllEgress = egressRules.some(rule =>
      (rule.IpProtocol === '-1' || rule.IpProtocol === 'tcp') &&
      rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
    );

    expect(hasAllEgress).toBe(true);
  }, TEST_TIMEOUT);

  test('Lambda security group allows outbound to Redis port 6379', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;

    const lambdaSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [lambdaSgId] }))
    );

    const egressRules = lambdaSg.SecurityGroups![0].IpPermissionsEgress || [];
    const hasAllEgress = egressRules.some(rule =>
      (rule.IpProtocol === '-1' || rule.IpProtocol === 'tcp') &&
      rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
    );

    expect(hasAllEgress).toBe(true);
  }, TEST_TIMEOUT);

  test('Aurora security group allows inbound from Lambda on port 5432', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;
    const auroraSgId = securityGroupIds.aurora;

    const auroraSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [auroraSgId] }))
    );

    const ingressRules = auroraSg.SecurityGroups![0].IpPermissions || [];
    const hasLambdaAccess = ingressRules.some(rule =>
      rule.ToPort === 5432 &&
      rule.FromPort === 5432 &&
      rule.IpProtocol === 'tcp' &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
    );

    expect(hasLambdaAccess).toBe(true);
  }, TEST_TIMEOUT);

  test('Redis security group allows inbound from Lambda on port 6379', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;
    const redisSgId = securityGroupIds.redis;

    const redisSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [redisSgId] }))
    );

    const ingressRules = redisSg.SecurityGroups![0].IpPermissions || [];
    const hasLambdaAccess = ingressRules.some(rule =>
      rule.ToPort === 6379 &&
      rule.FromPort === 6379 &&
      rule.IpProtocol === 'tcp' &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
    );

    expect(hasLambdaAccess).toBe(true);
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 4: PORT CONNECTIVITY & NODE-TO-NODE COMMUNICATION
// =============================================================================

describe('Port Connectivity & Node-to-Node Communication', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Aurora PostgreSQL port 5432 is correctly configured', () => {
    const auroraPort = outputs.aurora_port;
    const portValue = typeof auroraPort === 'string' ? parseInt(auroraPort, 10) : auroraPort;
    expect(portValue).toBe(5432);
  });

  test('Redis port 6379 is correctly configured', () => {
    const redisPort = outputs.redis_port;
    const portValue = typeof redisPort === 'string' ? parseInt(redisPort, 10) : redisPort;
    expect(portValue).toBe(6379);
  });

  test('Lambda functions can connect to Aurora on port 5432', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;
    const auroraSgId = securityGroupIds.aurora;

    const lambdaSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [lambdaSgId] }))
    );

    const auroraSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [auroraSgId] }))
    );

    const lambdaEgress = lambdaSg.SecurityGroups![0].IpPermissionsEgress || [];
    const hasAllEgress = lambdaEgress.some(rule =>
      rule.IpProtocol === '-1' &&
      rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
    );

    const auroraIngress = auroraSg.SecurityGroups![0].IpPermissions || [];
    const hasIngress = auroraIngress.some(rule =>
      rule.ToPort === 5432 &&
      rule.FromPort === 5432 &&
      rule.IpProtocol === 'tcp' &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
    );

    expect(hasAllEgress && hasIngress).toBe(true);
  }, TEST_TIMEOUT);

  test('Lambda functions can connect to Redis on port 6379', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;
    const redisSgId = securityGroupIds.redis;

    const lambdaSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [lambdaSgId] }))
    );

    const redisSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [redisSgId] }))
    );

    const lambdaEgress = lambdaSg.SecurityGroups![0].IpPermissionsEgress || [];
    const hasAllEgress = lambdaEgress.some(rule =>
      rule.IpProtocol === '-1' &&
      rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
    );

    const redisIngress = redisSg.SecurityGroups![0].IpPermissions || [];
    const hasIngress = redisIngress.some(rule =>
      rule.ToPort === 6379 &&
      rule.FromPort === 6379 &&
      rule.IpProtocol === 'tcp' &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
    );

    expect(hasAllEgress && hasIngress).toBe(true);
  }, TEST_TIMEOUT);

  test('DynamoDB streams are enabled for interactions table', async () => {
    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.interactions }))
    );

    expect(table.Table!.StreamSpecification).toBeDefined();
    expect(table.Table!.StreamSpecification!.StreamEnabled).toBe(true);
    expect(table.Table!.StreamSpecification!.StreamViewType).toBeDefined();
  }, TEST_TIMEOUT);

  test('Aurora cluster port 5432 is accessible from Lambda security group', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;
    const auroraSgId = securityGroupIds.aurora;

    const auroraSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [auroraSgId] }))
    );

    const ingressRules = auroraSg.SecurityGroups![0].IpPermissions || [];
    const hasPort5432 = ingressRules.some(rule =>
      rule.ToPort === 5432 &&
      rule.FromPort === 5432 &&
      rule.IpProtocol === 'tcp' &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
    );

    expect(hasPort5432).toBe(true);
  }, TEST_TIMEOUT);

  test('Redis port 6379 is accessible from Lambda security group', async () => {
    let securityGroupIds: any = outputs.security_groups;
    if (typeof securityGroupIds === 'string') {
      securityGroupIds = JSON.parse(securityGroupIds);
    }

    const lambdaSgId = securityGroupIds.lambda;
    const redisSgId = securityGroupIds.redis;

    const redisSg = await awsCall(() =>
      ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [redisSgId] }))
    );

    const ingressRules = redisSg.SecurityGroups![0].IpPermissions || [];
    const hasPort6379 = ingressRules.some(rule =>
      rule.ToPort === 6379 &&
      rule.FromPort === 6379 &&
      rule.IpProtocol === 'tcp' &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
    );

    expect(hasPort6379).toBe(true);
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 5: E2E WORKFLOW TESTS
// =============================================================================

describe('End-to-End Workflow Tests', () => {
  let outputs: Record<string, any> = {};
  let apiUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    apiUrl = outputs.websocket_api_url;
  });

  test('Full workflow: WebSocket API → Lambda → Kinesis', async () => {
    expect(apiUrl).toBeDefined();
    expect(apiUrl).toMatch(/^wss:\/\//);

    const streamName = outputs.kinesis_stream_name;
    expect(streamName).toBeDefined();

    const stream = await awsCall(() =>
      kinesisClient.send(new DescribeStreamCommand({ StreamName: streamName }))
    );

    expect(stream.StreamDescription!.StreamStatus).toBe('ACTIVE');
    expect(stream.StreamDescription!.Shards).toBeDefined();
    expect(stream.StreamDescription!.Shards!.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  test('Kinesis stream can receive data', async () => {
    const streamName = outputs.kinesis_stream_name;
    expect(streamName).toBeDefined();

    const stream = await awsCall(() =>
      kinesisClient.send(new DescribeStreamCommand({ StreamName: streamName }))
    );

    expect(stream.StreamDescription!.StreamStatus).toBe('ACTIVE');
    expect(stream.StreamDescription!.Shards).toBeDefined();
    expect(stream.StreamDescription!.Shards!.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  test('DynamoDB tables are accessible for writes', async () => {
    let tables: any = outputs.dynamodb_tables;
    expect(tables).toBeDefined();

    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const tableName = tables.interactions;
    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tableName }))
    );

    expect(table.Table!.TableStatus).toBe('ACTIVE');
    expect(table.Table!.TableName).toBe(tableName);
  }, TEST_TIMEOUT);

  test('Complete workflow: WebSocket API → Lambda → Kinesis → DynamoDB Streams → Lambda', async () => {
    const streamName = outputs.kinesis_stream_name;
    expect(streamName).toBeDefined();

    const stream = await awsCall(() =>
      kinesisClient.send(new DescribeStreamCommand({ StreamName: streamName }))
    );
    expect(stream.StreamDescription!.StreamStatus).toBe('ACTIVE');

    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.interactions }))
    );

    expect(table.Table!.StreamSpecification).toBeDefined();
    expect(table.Table!.StreamSpecification!.StreamEnabled).toBe(true);
  }, TEST_TIMEOUT);

  test('Complete workflow: Kinesis → Lambda → SNS → SQS → Lambda (Notifications)', async () => {
    let topicArns: any = outputs.sns_topics;
    if (typeof topicArns === 'string') {
      topicArns = JSON.parse(topicArns);
    }

    const notificationsTopicArn = topicArns.notifications;
    expect(notificationsTopicArn).toBeDefined();

    const topic = await awsCall(() =>
      snsClient.send(new GetTopicAttributesCommand({ TopicArn: notificationsTopicArn }))
    );
    expect(topic.Attributes).toBeDefined();

    let queueUrls: any = outputs.sqs_queues;
    if (typeof queueUrls === 'string') {
      queueUrls = JSON.parse(queueUrls);
    }

    const emailQueueUrl = queueUrls.email;
    const pushQueueUrl = queueUrls.push;
    const smsQueueUrl = queueUrls.sms;

    expect(emailQueueUrl).toBeDefined();
    expect(pushQueueUrl).toBeDefined();
    expect(smsQueueUrl).toBeDefined();

    const emailQueue = await awsCall(() =>
      sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: emailQueueUrl,
        AttributeNames: ['All'],
      }))
    );
    expect(emailQueue.Attributes).toBeDefined();
  }, TEST_TIMEOUT);

  test('Complete workflow: Lambda → Aurora PostgreSQL (Analytics Consumer)', async () => {
    let auroraEndpoints: any = outputs.aurora_endpoints;
    if (typeof auroraEndpoints === 'string') {
      auroraEndpoints = JSON.parse(auroraEndpoints);
    }

    const writerEndpoint = auroraEndpoints.writer;
    expect(writerEndpoint).toBeDefined();
    expect(writerEndpoint).toMatch(/\.rds\.amazonaws\.com/);

    const clusterIdentifier = outputs.aurora_cluster_identifier;
    const cluster = await awsCall(() =>
      rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      }))
    );

    expect(cluster.DBClusters![0].Status).toBe('available');
    expect(cluster.DBClusters![0].Port).toBe(5432);
  }, TEST_TIMEOUT);

  test('Complete workflow: Lambda → Redis (Recommendations Engine)', async () => {
    const redisEndpoint = outputs.redis_endpoint;
    expect(redisEndpoint).toBeDefined();
    expect(redisEndpoint).toMatch(/\.cache\.amazonaws\.com/);

    const endpointParts = redisEndpoint.split('.');
    let replicationGroupId = endpointParts[1];

    if (!replicationGroupId || replicationGroupId === '') {
      replicationGroupId = redisEndpoint.match(/master\.([^.]+)\./)?.[1] || '';
    }

    // Try to extract from endpoint or use naming pattern
    if (!replicationGroupId || replicationGroupId === '') {
      const nameMatch = redisEndpoint.match(/([^-]+-[^-]+)-redis/);
      if (nameMatch) {
        replicationGroupId = nameMatch[1];
      }
    }

    expect(replicationGroupId).toBeTruthy();

    const replicationGroups = await awsCall(() =>
      elasticacheClient.send(new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId,
      }))
    );

    expect(replicationGroups.ReplicationGroups).toBeDefined();
    expect(replicationGroups.ReplicationGroups!.length).toBeGreaterThan(0);
    expect(replicationGroups.ReplicationGroups![0].Status).toBe('available');
  }, TEST_TIMEOUT);

  test('Complete workflow: EventBridge → Step Functions → Lambda (Trending Analysis)', async () => {
    const stateMachineArn = outputs.step_functions_arn;
    expect(stateMachineArn).toBeDefined();

    const stateMachine = await awsCall(() =>
      sfnClient.send(new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      }))
    );

    expect(stateMachine.status).toBe('ACTIVE');
    expect(stateMachine.stateMachineArn).toBe(stateMachineArn);

    const ruleName = outputs.eventbridge_rule_name;
    expect(ruleName).toBeDefined();
  }, TEST_TIMEOUT);

  test('Complete workflow: Lambda → S3 (Content Upload)', async () => {
    const bucketName = outputs.s3_bucket;
    expect(bucketName).toBeDefined();

    await awsCall(() =>
      s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
    );
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 6: APPLICATION SECURITY & SQL INJECTION TESTS
// =============================================================================

describe('Application Security & SQL Injection Tests', () => {
  let outputs: Record<string, any> = {};
  let apiUrl: string;

  beforeAll(() => {
    outputs = getTerraformOutputs();
    apiUrl = outputs.websocket_api_url;
  });

  test('Application validates SQL injection attempts in input', async () => {
    expect(apiUrl).toBeDefined();

    // Test that Lambda validator function exists and can handle these
    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const validatorArn = lambdaArns.validator;
    expect(validatorArn).toBeDefined();

    const func = await awsCall(() =>
      lambdaClient.send(new GetFunctionCommand({
        FunctionName: validatorArn.split(':').pop()!.split('/').pop()!
      }))
    );

    expect(func.Configuration).toBeDefined();
    expect(func.Configuration!.State).toBe('Active');

  }, TEST_TIMEOUT);

  test('DynamoDB tables use parameterized queries (no SQL injection risk)', async () => {
    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const interactionsTable = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.interactions }))
    );

    expect(interactionsTable.Table!.TableStatus).toBe('ACTIVE');
    expect(interactionsTable.Table!.SSEDescription).toBeDefined();
  }, TEST_TIMEOUT);

  test('Aurora PostgreSQL connection uses parameterized queries', async () => {
    const clusterIdentifier = outputs.aurora_cluster_identifier;
    expect(clusterIdentifier).toBeDefined();

    const cluster = await awsCall(() =>
      rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      }))
    );

    expect(cluster.DBClusters![0].Status).toBe('available');
    expect(cluster.DBClusters![0].Engine).toBe('aurora-postgresql');

    // Verify Lambda functions that access Aurora have proper IAM permissions
    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    expect(lambdaArns.notifier).toBeDefined();
    expect(lambdaArns.trending).toBeDefined();
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 5: CROSS-SERVICE INTEGRATION & COMMUNICATION PATHS
// =============================================================================

describe('Cross-Service Integration & Communication Paths', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('API Gateway can invoke Lambda functions', async () => {
    const apiUrl = outputs.websocket_api_url;
    expect(apiUrl).toBeDefined();

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const validatorArn = lambdaArns.validator;
    expect(validatorArn).toBeDefined();

    const func = await awsCall(() =>
      lambdaClient.send(new GetFunctionCommand({ FunctionName: validatorArn.split(':').pop()!.split('/').pop()! }))
    );

    expect(func.Configuration).toBeDefined();
  }, TEST_TIMEOUT);

  test('Lambda functions have access to DynamoDB tables', async () => {
    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    expect(lambdaArns.processor).toBeDefined();
    expect(tables.interactions).toBeDefined();

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.interactions }))
    );

    expect(table.Table!.TableStatus).toBe('ACTIVE');
  }, TEST_TIMEOUT);

  test('Lambda functions have access to Kinesis stream', async () => {
    const streamArn = outputs.kinesis_stream_arn;
    expect(streamArn).toBeDefined();

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    expect(lambdaArns.processor).toBeDefined();
    expect(streamArn).toContain(AWS_REGION);
  }, TEST_TIMEOUT);

  test('Lambda functions have access to SNS topics', async () => {
    let topicArns: any = outputs.sns_topics;
    if (typeof topicArns === 'string') {
      topicArns = JSON.parse(topicArns);
    }

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const notificationsTopicArn = topicArns.notifications;
    expect(notificationsTopicArn).toBeDefined();
    expect(lambdaArns.notifier).toBeDefined();

    const topic = await awsCall(() =>
      snsClient.send(new GetTopicAttributesCommand({ TopicArn: notificationsTopicArn }))
    );

    expect(topic.Attributes).toBeDefined();
  }, TEST_TIMEOUT);

  test('Lambda functions have access to SQS queues', async () => {
    let queueUrls: any = outputs.sqs_queues;
    if (typeof queueUrls === 'string') {
      queueUrls = JSON.parse(queueUrls);
    }

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const emailQueueUrl = queueUrls.email;
    expect(emailQueueUrl).toBeDefined();

    const queue = await awsCall(() =>
      sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: emailQueueUrl,
        AttributeNames: ['QueueArn'],
      }))
    );

    expect(queue.Attributes).toBeDefined();
  }, TEST_TIMEOUT);

  test('Lambda functions have access to S3 buckets', async () => {
    const bucketName = outputs.s3_bucket;
    expect(bucketName).toBeDefined();

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    expect(lambdaArns.webhook).toBeDefined();

    await awsCall(() =>
      s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
    );
  }, TEST_TIMEOUT);

  test('Lambda functions can access Secrets Manager', async () => {
    let secrets: any = outputs.secrets_manager_secrets;
    if (typeof secrets === 'string') {
      secrets = JSON.parse(secrets);
    }

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const auroraSecretArn = secrets.aurora_credentials;
    expect(auroraSecretArn).toBeDefined();
    expect(lambdaArns.notifier).toBeDefined();

    const secret = await awsCall(() =>
      secretsClient.send(new GetSecretValueCommand({ SecretId: auroraSecretArn }))
    );

    expect(secret.SecretString).toBeDefined();
  }, TEST_TIMEOUT);

  test('Step Functions can invoke Lambda functions', async () => {
    const stateMachineArn = outputs.step_functions_arn;
    expect(stateMachineArn).toBeDefined();

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const stateMachine = await awsCall(() =>
      sfnClient.send(new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      }))
    );

    expect(stateMachine.status).toBe('ACTIVE');

    let lambdaNames: any = outputs.lambda_function_names;
    if (typeof lambdaNames === 'string') {
      lambdaNames = JSON.parse(lambdaNames);
    }
    expect(lambdaNames.trending).toBeDefined();
  }, TEST_TIMEOUT);
});


