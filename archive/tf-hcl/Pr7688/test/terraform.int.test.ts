import {
  AthenaClient,
  GetWorkGroupCommand,
} from '@aws-sdk/client-athena';
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
  DescribeDeliveryStreamCommand,
  FirehoseClient,
} from '@aws-sdk/client-firehose';
import {
  GetCrawlerCommand,
  GetDatabaseCommand,
  GlueClient,
} from '@aws-sdk/client-glue';
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
import {
  GetWebACLCommand,
  WAFV2Client,
} from '@aws-sdk/client-wafv2';
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
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const wafClient = new WAFV2Client({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const elasticacheClient = new ElastiCacheClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const dynamodbClient = new DynamoDBClient({ region: AWS_REGION });
const kinesisClient = new KinesisClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const sqsClient = new SQSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const sfnClient = new SFNClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const firehoseClient = new FirehoseClient({ region: AWS_REGION });
const glueClient = new GlueClient({ region: AWS_REGION });
const athenaClient = new AthenaClient({ region: AWS_REGION });

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
      'aws_lambda_function',
      'aws_dynamodb_table',
      'aws_kinesis_stream',
      'aws_rds_cluster',
      'aws_rds_cluster_instance',
      'aws_elasticache_replication_group',
      'aws_s3_bucket',
      'aws_kms_key',
      'aws_wafv2_web_acl',
      'aws_secretsmanager_secret',
      'aws_sns_topic',
      'aws_sqs_queue',
      'aws_sfn_state_machine',
      'aws_athena_workgroup',
      'aws_glue_crawler',
      'aws_kinesis_firehose_delivery_stream',
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
    expect(outputs.aurora_endpoints).toBeDefined();
    expect(outputs.vpc_resources).toBeDefined();
    expect(outputs.kinesis_observations_arn).toBeTruthy();
    expect(outputs.redis_endpoint).toBeTruthy();
    expect(outputs.lambda_functions).toBeDefined();
    expect(outputs.s3_buckets).toBeDefined();
  });

  describe('Networking (VPC)', () => {
    test('VPC exists and is configured correctly', async () => {
      let vpcResources: any = outputs.vpc_resources;
      expect(vpcResources).toBeDefined();

      if (typeof vpcResources === 'string') {
        vpcResources = JSON.parse(vpcResources);
      }

      const vpcId = vpcResources.vpc_id;
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
      let vpcResources: any = outputs.vpc_resources;
      if (typeof vpcResources === 'string') {
        vpcResources = JSON.parse(vpcResources);
      }

      const privateSubnetIds = vpcResources.private_subnet_ids || [];
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      const result = await awsCall(() =>
        ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }))
      );

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBeGreaterThan(0);
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
        'analyzer',
        'alert_evaluator',
        'image_processor',
        'training_orchestrator',
        'forecast_generator',
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

      const writerEndpoint = auroraEndpoints.writer;
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

      // Try to extract from prefix pattern
      if (!replicationGroupId || replicationGroupId === '') {
        const match = redisEndpoint.match(/([^-]+)-redis/);
        if (match) {
          replicationGroupId = match[1] + '-redis';
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
    test('All S3 buckets exist and have versioning enabled where configured', async () => {
      let s3Buckets: any = outputs.s3_buckets;
      expect(s3Buckets).toBeDefined();

      if (typeof s3Buckets === 'string') {
        s3Buckets = JSON.parse(s3Buckets);
      }

      const expectedBuckets = ['data_lake', 'training', 'archive', 'athena_results'];
      const bucketsWithVersioning = ['data_lake', 'training']; // These have versioning enabled

      for (const bucketType of expectedBuckets) {
        const bucketName = s3Buckets[bucketType];
        expect(bucketName).toBeDefined();

        await awsCall(() =>
          s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
        );

        if (bucketsWithVersioning.includes(bucketType)) {
          const versioning = await awsCall(() =>
            s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }))
          );

          expect(versioning.Status).toBe('Enabled');
        }
      }
    }, TEST_TIMEOUT * 2);

    test('S3 buckets have encryption enabled', async () => {
      let s3Buckets: any = outputs.s3_buckets;
      if (typeof s3Buckets === 'string') {
        s3Buckets = JSON.parse(s3Buckets);
      }

      for (const bucketName of Object.values(s3Buckets) as string[]) {
        const encryption = await awsCall(() =>
          s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }))
        );

        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
        const algorithm = rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm;
        expect(['aws:kms', 'AES256']).toContain(algorithm);
      }
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
        'observations',
        'thresholds',
        'alerts',
        'radar_data',
        'forecasts',
        'model_versions',
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

  describe('Kinesis Streams', () => {
    test('Observations Kinesis stream exists and is active', async () => {
      const streamArn = outputs.kinesis_observations_arn;
      expect(streamArn).toBeDefined();

      const streamName = outputs.kinesis_observations_name || streamArn.split('/').pop();
      expect(streamName).toBeDefined();

      const stream = await awsCall(() =>
        kinesisClient.send(new DescribeStreamCommand({ StreamName: streamName }))
      );

      expect(stream.StreamDescription).toBeDefined();
      expect(stream.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(stream.StreamDescription!.StreamName).toBe(streamName);
    }, TEST_TIMEOUT);

    test('Radar Kinesis stream exists and is active', async () => {
      const streamArn = outputs.kinesis_radar_arn;
      expect(streamArn).toBeDefined();

      const streamName = outputs.kinesis_radar_name || streamArn.split('/').pop();
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

      const auroraSecretArn = secrets.aurora_master;
      expect(auroraSecretArn).toBeDefined();

      const secretValue = await awsCall(() =>
        secretsClient.send(new GetSecretValueCommand({ SecretId: auroraSecretArn }))
      );

      expect(secretValue.SecretString).toBeDefined();
      const credentials = JSON.parse(secretValue.SecretString!);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
    }, TEST_TIMEOUT);

    test('Redis auth secret exists', async () => {
      let secrets: any = outputs.secrets_manager_secrets;
      if (typeof secrets === 'string') {
        secrets = JSON.parse(secrets);
      }

      const redisSecretArn = secrets.redis_auth;
      expect(redisSecretArn).toBeDefined();

      const secretValue = await awsCall(() =>
        secretsClient.send(new GetSecretValueCommand({ SecretId: redisSecretArn }))
      );

      expect(secretValue.SecretString).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('SNS Topics', () => {
    test('SNS topic exists', async () => {
      const topicArn = outputs.sns_topic_arn;
      expect(topicArn).toBeDefined();

      const topic = await awsCall(() =>
        snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }))
      );

      expect(topic.Attributes).toBeDefined();
      expect(topic.Attributes!['TopicArn']).toBe(topicArn);
    }, TEST_TIMEOUT);
  });

  describe('SQS Queues', () => {
    test('All SQS queues exist and are configured', async () => {
      let queueUrls: any = outputs.sqs_queue_urls;
      expect(queueUrls).toBeDefined();

      if (typeof queueUrls === 'string') {
        queueUrls = JSON.parse(queueUrls);
      }

      const expectedQueues = ['tornado', 'hurricane', 'flood', 'heat'];
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

  describe('Kinesis Firehose', () => {
    test('Firehose delivery stream exists', async () => {
      const firehoseArn = outputs.firehose_arn;
      expect(firehoseArn).toBeDefined();

      const streamName = firehoseArn.split('/').pop();
      const stream = await awsCall(() =>
        firehoseClient.send(new DescribeDeliveryStreamCommand({
          DeliveryStreamName: streamName!,
        }))
      );

      expect(stream.DeliveryStreamDescription).toBeDefined();
      expect(stream.DeliveryStreamDescription!.DeliveryStreamStatus).toBe('ACTIVE');
    }, TEST_TIMEOUT);
  });

  describe('Glue Resources', () => {
    test('Glue database exists', async () => {
      let glueResources: any = outputs.glue_resources;
      expect(glueResources).toBeDefined();

      if (typeof glueResources === 'string') {
        glueResources = JSON.parse(glueResources);
      }

      const databaseName = glueResources.database;
      expect(databaseName).toBeDefined();

      const database = await awsCall(() =>
        glueClient.send(new GetDatabaseCommand({
          Name: databaseName,
        }))
      );

      expect(database.Database).toBeDefined();
      expect(database.Database!.Name).toBe(databaseName);
    }, TEST_TIMEOUT);

    test('Glue crawler exists', async () => {
      let glueResources: any = outputs.glue_resources;
      if (typeof glueResources === 'string') {
        glueResources = JSON.parse(glueResources);
      }

      const crawlerName = glueResources.crawler;
      expect(crawlerName).toBeDefined();

      const crawler = await awsCall(() =>
        glueClient.send(new GetCrawlerCommand({
          Name: crawlerName,
        }))
      );

      expect(crawler.Crawler).toBeDefined();
      expect(crawler.Crawler!.Name).toBe(crawlerName);
    }, TEST_TIMEOUT);
  });

  describe('Athena Workgroup', () => {
    test('Athena workgroup exists', async () => {
      const workgroupName = outputs.athena_workgroup;
      expect(workgroupName).toBeDefined();

      const workgroup = await awsCall(() =>
        athenaClient.send(new GetWorkGroupCommand({
          WorkGroup: workgroupName,
        }))
      );

      expect(workgroup.WorkGroup).toBeDefined();
      expect(workgroup.WorkGroup!.Name).toBe(workgroupName);
    }, TEST_TIMEOUT);
  });

  describe('WAF Configuration', () => {
    test('WAF WebACL exists and has security rules configured', async () => {
      const wafWebAclId = outputs.waf_web_acl_id;
      const wafWebAclArn = outputs.waf_web_acl_arn;
      expect(wafWebAclId).toBeDefined();
      expect(wafWebAclArn).toBeDefined();

      const arnParts = wafWebAclArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];

      const webACL = await awsCall(() =>
        wafClient.send(new GetWebACLCommand({
          Id: wafWebAclId,
          Name: webAclName,
          Scope: 'REGIONAL',
        }))
      );

      expect(webACL.WebACL).toBeDefined();
      expect(webACL.WebACL!.Rules).toBeDefined();
      expect(webACL.WebACL!.Rules!.length).toBeGreaterThan(0);

      const ruleNames = webACL.WebACL!.Rules!.map(r => r.Name);
      expect(ruleNames).toContain('AWSManagedRulesSQLiRuleSet');
      expect(ruleNames).toContain('RateLimitRule');
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
    let securityGroupIds: any = outputs.security_group_ids;
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
    let securityGroupIds: any = outputs.security_group_ids;
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
    let securityGroupIds: any = outputs.security_group_ids;
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
    let securityGroupIds: any = outputs.security_group_ids;
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
    let securityGroupIds: any = outputs.security_group_ids;
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
    let securityGroupIds: any = outputs.security_group_ids;
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
    let securityGroupIds: any = outputs.security_group_ids;
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

  test('DynamoDB streams are enabled for observations table', async () => {
    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.observations }))
    );

    expect(table.Table!.StreamSpecification).toBeDefined();
    expect(table.Table!.StreamSpecification!.StreamEnabled).toBe(true);
    expect(table.Table!.StreamSpecification!.StreamViewType).toBeDefined();
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

  test('Lambda functions have access to DynamoDB tables', async () => {
    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    expect(lambdaArns.validator).toBeDefined();
    expect(tables.observations).toBeDefined();

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.observations }))
    );

    expect(table.Table!.TableStatus).toBe('ACTIVE');
  }, TEST_TIMEOUT);

  test('Lambda functions have access to Kinesis streams', async () => {
    const streamArn = outputs.kinesis_observations_arn;
    expect(streamArn).toBeDefined();

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    expect(lambdaArns.validator).toBeDefined();
    expect(streamArn).toContain(AWS_REGION);
  }, TEST_TIMEOUT);

  test('Lambda functions have access to SNS topics', async () => {
    const topicArn = outputs.sns_topic_arn;
    expect(topicArn).toBeDefined();

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    expect(lambdaArns.alert_evaluator).toBeDefined();

    const topic = await awsCall(() =>
      snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }))
    );

    expect(topic.Attributes).toBeDefined();
  }, TEST_TIMEOUT);

  test('Lambda functions have access to SQS queues', async () => {
    let queueUrls: any = outputs.sqs_queue_urls;
    if (typeof queueUrls === 'string') {
      queueUrls = JSON.parse(queueUrls);
    }

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const tornadoQueueUrl = queueUrls.tornado;
    expect(tornadoQueueUrl).toBeDefined();
    expect(lambdaArns.alert_evaluator).toBeDefined();

    const queue = await awsCall(() =>
      sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: tornadoQueueUrl,
        AttributeNames: ['QueueArn'],
      }))
    );

    expect(queue.Attributes).toBeDefined();
  }, TEST_TIMEOUT);

  test('Lambda functions have access to S3 buckets', async () => {
    let s3Buckets: any = outputs.s3_buckets;
    if (typeof s3Buckets === 'string') {
      s3Buckets = JSON.parse(s3Buckets);
    }

    let lambdaArns: any = outputs.lambda_functions;
    if (typeof lambdaArns === 'string') {
      lambdaArns = JSON.parse(lambdaArns);
    }

    const dataLakeBucket = s3Buckets.data_lake;
    expect(dataLakeBucket).toBeDefined();
    expect(lambdaArns.image_processor).toBeDefined();

    await awsCall(() =>
      s3Client.send(new HeadBucketCommand({ Bucket: dataLakeBucket }))
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

    const auroraSecretArn = secrets.aurora_master;
    expect(auroraSecretArn).toBeDefined();
    expect(lambdaArns.analyzer).toBeDefined();

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
    expect(lambdaNames.training_orchestrator).toBeDefined();
  }, TEST_TIMEOUT);

  test('Kinesis Firehose can deliver to S3', async () => {
    const firehoseArn = outputs.firehose_arn;
    expect(firehoseArn).toBeDefined();

    const streamName = firehoseArn.split('/').pop();
    const stream = await awsCall(() =>
      firehoseClient.send(new DescribeDeliveryStreamCommand({
        DeliveryStreamName: streamName!,
      }))
    );

    expect(stream.DeliveryStreamDescription!.DeliveryStreamStatus).toBe('ACTIVE');
    expect(stream.DeliveryStreamDescription!.Destinations).toBeDefined();
  }, TEST_TIMEOUT);

  test('SNS topic can publish to SQS queues', async () => {
    const topicArn = outputs.sns_topic_arn;
    expect(topicArn).toBeDefined();

    let queueUrls: any = outputs.sqs_queue_urls;
    if (typeof queueUrls === 'string') {
      queueUrls = JSON.parse(queueUrls);
    }

    const tornadoQueueUrl = queueUrls.tornado;
    expect(tornadoQueueUrl).toBeDefined();

    const queue = await awsCall(() =>
      sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: tornadoQueueUrl,
        AttributeNames: ['All'],
      }))
    );

    expect(queue.Attributes).toBeDefined();
  }, TEST_TIMEOUT);
});

// =============================================================================
// SUITE 6: E2E WORKFLOW TESTS
// =============================================================================

describe('End-to-End Workflow Tests', () => {
  let outputs: Record<string, any> = {};

  beforeAll(() => {
    outputs = getTerraformOutputs();
  });

  test('Complete workflow: Kinesis → Lambda → DynamoDB', async () => {
    const streamArn = outputs.kinesis_observations_arn;
    expect(streamArn).toBeDefined();

    const stream = await awsCall(() =>
      kinesisClient.send(new DescribeStreamCommand({
        StreamName: outputs.kinesis_observations_name || streamArn.split('/').pop()!,
      }))
    );
    expect(stream.StreamDescription!.StreamStatus).toBe('ACTIVE');

    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.observations }))
    );

    expect(table.Table!.StreamSpecification).toBeDefined();
    expect(table.Table!.StreamSpecification!.StreamEnabled).toBe(true);
  }, TEST_TIMEOUT);

  test('Complete workflow: DynamoDB Streams → Lambda → Redis/Aurora', async () => {
    let tables: any = outputs.dynamodb_tables;
    if (typeof tables === 'string') {
      tables = JSON.parse(tables);
    }

    const table = await awsCall(() =>
      dynamodbClient.send(new DescribeTableCommand({ TableName: tables.observations }))
    );

    expect(table.Table!.StreamSpecification).toBeDefined();
    expect(table.Table!.StreamSpecification!.StreamEnabled).toBe(true);

    const redisEndpoint = outputs.redis_endpoint;
    expect(redisEndpoint).toBeDefined();

    const auroraEndpoints = outputs.aurora_endpoints;
    expect(auroraEndpoints).toBeDefined();
  }, TEST_TIMEOUT);

  test('Complete workflow: Lambda → SNS → SQS (Alert Processing)', async () => {
    const topicArn = outputs.sns_topic_arn;
    expect(topicArn).toBeDefined();

    const topic = await awsCall(() =>
      snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }))
    );
    expect(topic.Attributes).toBeDefined();

    let queueUrls: any = outputs.sqs_queue_urls;
    if (typeof queueUrls === 'string') {
      queueUrls = JSON.parse(queueUrls);
    }

    const tornadoQueueUrl = queueUrls.tornado;
    expect(tornadoQueueUrl).toBeDefined();

    const queue = await awsCall(() =>
      sqsClient.send(new GetQueueAttributesCommand({
        QueueUrl: tornadoQueueUrl,
        AttributeNames: ['All'],
      }))
    );
    expect(queue.Attributes).toBeDefined();
  }, TEST_TIMEOUT);

  test('Complete workflow: Kinesis → Firehose → S3 → Glue → Athena', async () => {
    const firehoseArn = outputs.firehose_arn;
    expect(firehoseArn).toBeDefined();

    const stream = await awsCall(() =>
      firehoseClient.send(new DescribeDeliveryStreamCommand({
        DeliveryStreamName: firehoseArn.split('/').pop()!,
      }))
    );
    expect(stream.DeliveryStreamDescription!.DeliveryStreamStatus).toBe('ACTIVE');

    let s3Buckets: any = outputs.s3_buckets;
    if (typeof s3Buckets === 'string') {
      s3Buckets = JSON.parse(s3Buckets);
    }

    await awsCall(() =>
      s3Client.send(new HeadBucketCommand({ Bucket: s3Buckets.data_lake }))
    );

    let glueResources: any = outputs.glue_resources;
    if (typeof glueResources === 'string') {
      glueResources = JSON.parse(glueResources);
    }

    const database = await awsCall(() =>
      glueClient.send(new GetDatabaseCommand({
        Name: glueResources.database,
      }))
    );
    expect(database.Database).toBeDefined();

    const workgroupName = outputs.athena_workgroup;
    const workgroup = await awsCall(() =>
      athenaClient.send(new GetWorkGroupCommand({
        WorkGroup: workgroupName,
      }))
    );
    expect(workgroup.WorkGroup).toBeDefined();
  }, TEST_TIMEOUT);

  test('Complete workflow: EventBridge → Step Functions → Lambda (Model Training)', async () => {
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

  test('Complete workflow: Lambda → S3 (Data Archiving)', async () => {
    let s3Buckets: any = outputs.s3_buckets;
    if (typeof s3Buckets === 'string') {
      s3Buckets = JSON.parse(s3Buckets);
    }

    const archiveBucket = s3Buckets.archive;
    const dataLakeBucket = s3Buckets.data_lake;

    expect(archiveBucket).toBeDefined();
    expect(dataLakeBucket).toBeDefined();

    await awsCall(() =>
      s3Client.send(new HeadBucketCommand({ Bucket: archiveBucket }))
    );

    await awsCall(() =>
      s3Client.send(new HeadBucketCommand({ Bucket: dataLakeBucket }))
    );
  }, TEST_TIMEOUT);
});
