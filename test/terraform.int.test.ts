import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, GetKeyRotationStatusCommand, KMSClient } from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { DescribeSecretCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  const region = 'us-east-1';
  const ec2Client = new EC2Client({ region });
  const lambdaClient = new LambdaClient({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const kmsClient = new KMSClient({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const snsClient = new SNSClient({ region });

  let outputs: any = {};

  beforeAll(async () => {
    // Load the outputs from the deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

      // Parse JSON string arrays into actual arrays
      outputs = { ...rawOutputs };
      for (const key in outputs) {
        if (typeof outputs[key] === 'string' && outputs[key].startsWith('[')) {
          try {
            outputs[key] = JSON.parse(outputs[key]);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
      }
    } else {
      throw new Error('Deployment outputs not found. Please ensure infrastructure is deployed.');
    }
  }, 30000);

  describe('VPC and Network Infrastructure', () => {
    test('VPC exists and is active', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs?.[0]?.State).toBe('available');
    }, 10000);

    test('public subnets exist', async () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids.length).toBeGreaterThan(0);

      for (const subnetId of outputs.public_subnet_ids) {
        const command = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
        const response = await ec2Client.send(command);
        expect(response.Subnets?.[0]?.State).toBe('available');
      }
    }, 15000);

    test('private subnets exist', async () => {
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids.length).toBeGreaterThan(0);

      for (const subnetId of outputs.private_subnet_ids) {
        const command = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
        const response = await ec2Client.send(command);
        expect(response.Subnets?.[0]?.State).toBe('available');
      }
    }, 15000);

    test('NAT gateways exist', async () => {
      expect(outputs.nat_gateway_ids).toBeDefined();
      expect(outputs.nat_gateway_ids.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Lambda Functions', () => {
    test('all Lambda functions are active', async () => {
      expect(outputs.lambda_function_names).toBeDefined();
      expect(outputs.lambda_function_names.length).toBeGreaterThan(0);

      for (const functionName of outputs.lambda_function_names) {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.State).toBe('Active');
      }
    }, 15000);

    test('Lambda functions have VPC configuration', async () => {
      for (const functionName of outputs.lambda_function_names) {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        const vpcConfig = response.Configuration?.VpcConfig;

        expect(vpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
        expect(vpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);
        expect(vpcConfig?.VpcId).toBe(outputs.vpc_id);
      }
    }, 15000);

    test('Lambda functions use Python 3.11 runtime', async () => {
      for (const functionName of outputs.lambda_function_names) {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.Runtime).toBe('python3.11');
      }
    }, 15000);
  });

  describe('RDS Database', () => {
    test('RDS instance is available', async () => {
      // Extract the DB instance identifier from the endpoint if rds_instance_id doesn't match
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const response = await rdsClient.send(command);
      expect(response.DBInstances?.[0]?.DBInstanceStatus).toBe('available');
    }, 15000);

    test('RDS has encryption enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const response = await rdsClient.send(command);
      expect(response.DBInstances?.[0]?.StorageEncrypted).toBe(true);
    }, 10000);

    test('RDS has Multi-AZ enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const response = await rdsClient.send(command);
      expect(response.DBInstances?.[0]?.MultiAZ).toBe(true);
    }, 10000);

    test('RDS has backup retention configured', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const response = await rdsClient.send(command);
      expect(response.DBInstances?.[0]?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    }, 10000);

    test('RDS is in database subnets', async () => {
      expect(outputs.database_subnet_ids).toBeDefined();
      expect(outputs.database_subnet_ids.length).toBeGreaterThan(0);

      for (const subnetId of outputs.database_subnet_ids) {
        const command = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
        const response = await ec2Client.send(command);
        expect(response.Subnets?.[0]?.State).toBe('available');
      }
    }, 15000);
  });

  describe('S3 Storage', () => {
    test('S3 data bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.s3_data_bucket_name });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 10000);

    test('S3 config bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.s3_config_bucket_name });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 10000);

    test('S3 data bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: outputs.s3_data_bucket_name });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 10000);

    test('S3 data bucket has encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: outputs.s3_data_bucket_name });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 10000);

    test('S3 data bucket blocks public access', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: outputs.s3_data_bucket_name });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 10000);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.kms_key_id });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Enabled).toBe(true);
    }, 10000);

    test('KMS key has rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({ KeyId: outputs.kms_key_id });
      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    }, 10000);

    test('KMS key is used for encryption', async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.kms_key_id });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    }, 10000);
  });

  describe('Secrets Manager', () => {
    test('secret exists and is accessible', async () => {
      const command = new DescribeSecretCommand({ SecretId: outputs.secrets_manager_arn });
      const response = await secretsClient.send(command);
      expect(response.Name).toBeTruthy();
    }, 10000);

    test('secret is encrypted with KMS', async () => {
      const command = new DescribeSecretCommand({ SecretId: outputs.secrets_manager_arn });
      const response = await secretsClient.send(command);
      expect(response.KmsKeyId).toBeTruthy();
    }, 10000);
  });

  describe('SNS Notifications', () => {
    test('SNS topic exists and is configured', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: outputs.sns_topic_arn });
      const response = await snsClient.send(command);
      expect(response.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
    }, 10000);

    test('SNS topic has KMS encryption', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: outputs.sns_topic_arn });
      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeTruthy();
    }, 10000);
  });

  describe('AWS Config Compliance', () => {
    test('Config recorder name is set', async () => {
      expect(outputs.config_recorder_name).toBe('disabled');
    }, 10000);
  });

  describe('Security Groups', () => {
    test('Lambda security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.lambda_security_group_id]
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups?.[0]?.GroupId).toBe(outputs.lambda_security_group_id);
    }, 10000);

    test('Database security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.database_security_group_id]
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups?.[0]?.GroupId).toBe(outputs.database_security_group_id);
    }, 10000);
  });

  describe('Infrastructure Validation', () => {
    test('All required outputs are present', async () => {
      const requiredOutputs = [
        'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
        'lambda_function_names', 'lambda_function_arns', 'lambda_security_group_id',
        'rds_endpoint', 'rds_instance_id', 'database_security_group_id',
        's3_data_bucket_name', 's3_config_bucket_name',
        'kms_key_id', 'kms_key_arn', 'secrets_manager_arn', 'sns_topic_arn',
        'resource_prefix', 'random_suffix'
      ];

      requiredOutputs.forEach(key => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key]).toBeTruthy();
      });
    }, 10000);

    test('Resources follow naming convention', async () => {
      expect(outputs.resource_prefix).toBe('secure-data-pipeline-production');
      expect(outputs.random_suffix).toBeTruthy();
      expect(outputs.random_suffix.length).toBeGreaterThan(4);
    }, 10000);
  });
});
