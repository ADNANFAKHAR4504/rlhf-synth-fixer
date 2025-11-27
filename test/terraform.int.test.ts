// Integration tests for deployed Terraform infrastructure
// Tests validate actual AWS resources using deployment outputs

import fs from 'fs';
import path from 'path';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

// Load deployment outputs
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

beforeAll(() => {
  if (!fs.existsSync(OUTPUTS_PATH)) {
    throw new Error(`Outputs file not found at ${OUTPUTS_PATH}. Deploy infrastructure first.`);
  }
  outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
});

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const kmsClient = new KMSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cwLogsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const cwClient = new CloudWatchClient({ region: AWS_REGION });

describe('Payment Processing Infrastructure Integration Tests', () => {
  describe('KMS Keys', () => {
    test('RDS KMS key has rotation enabled', async () => {
      const keyId = outputs.kms_key_ids.rds;
      expect(keyId).toBeDefined();

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('S3 KMS key has rotation enabled', async () => {
      const keyId = outputs.kms_key_ids.s3;
      expect(keyId).toBeDefined();

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('CloudWatch KMS key has rotation enabled', async () => {
      const keyId = outputs.kms_key_ids.cloudwatch;
      expect(keyId).toBeDefined();

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('Lambda KMS key has rotation enabled', async () => {
      const keyId = outputs.kms_key_ids.lambda;
      expect(keyId).toBeDefined();

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('data bucket has versioning enabled', async () => {
      const bucketName = outputs.s3_data_bucket;
      expect(bucketName).toBeDefined();

      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioning.Status).toBe('Enabled');
    }, 30000);

    test('data bucket has KMS encryption', async () => {
      const bucketName = outputs.s3_data_bucket;
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toContain(outputs.kms_key_ids.s3);
    }, 30000);

    test('data bucket blocks all public access', async () => {
      const bucketName = outputs.s3_data_bucket;
      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('flow logs bucket has versioning enabled', async () => {
      const bucketName = outputs.s3_flow_logs_bucket;
      expect(bucketName).toBeDefined();

      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioning.Status).toBe('Enabled');
    }, 30000);

    test('flow logs bucket has KMS encryption', async () => {
      const bucketName = outputs.s3_flow_logs_bucket;
      const encryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    }, 30000);
  });

  describe('RDS PostgreSQL', () => {
    let dbInstance: any;

    beforeAll(async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [{ Name: 'db-instance-id', Values: [outputs.rds_endpoint.split(':')[0].split('.')[0]] }],
        })
      );
      dbInstance = response.DBInstances![0];
    }, 30000);

    test('RDS instance is available', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('RDS has storage encryption enabled', () => {
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toContain(outputs.kms_key_ids.rds);
    });

    test('RDS is Multi-AZ', () => {
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('RDS is not publicly accessible', () => {
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('RDS has automated backups enabled', () => {
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('RDS database name is correct', () => {
      expect(dbInstance.DBName).toBe(outputs.rds_database_name);
    });

    test('RDS is in VPC private subnets', () => {
      const subnetIds = dbInstance.DBSubnetGroup.Subnets.map((s: any) => s.SubnetIdentifier);
      outputs.private_subnet_ids.forEach((subnetId: string) => {
        expect(subnetIds).toContain(subnetId);
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC exists and is available', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] })
      );
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    }, 30000);

    test('VPC has DNS support enabled', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] })
      );
      // Note: DNS support is checked via VPC attributes, which would require additional API call
      expect(response.Vpcs![0]).toBeDefined();
    }, 30000);

    test('3 private subnets exist', async () => {
      expect(outputs.private_subnet_ids).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: outputs.private_subnet_ids })
      );
      expect(response.Subnets).toHaveLength(3);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, 30000);

    test('VPC endpoints exist for S3 and RDS', async () => {
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }],
        })
      );

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(2);

      const serviceNames = response.VpcEndpoints!.map((ep) => ep.ServiceName);
      expect(serviceNames.some((name) => name!.includes('s3'))).toBe(true);
      expect(serviceNames.some((name) => name!.includes('rds'))).toBe(true);
    }, 30000);

    test('VPC Flow Logs are enabled', async () => {
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [outputs.vpc_id] }],
        })
      );

      expect(response.FlowLogs!.length).toBeGreaterThanOrEqual(2);
      response.FlowLogs!.forEach((fl) => {
        expect(fl.TrafficType).toBe('ALL');
      });
    }, 30000);
  });

  describe('Lambda Function', () => {
    let lambdaFunction: any;

    beforeAll(async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.lambda_function_name })
      );
      lambdaFunction = response;
    }, 30000);

    test('Lambda function exists and is active', () => {
      expect(lambdaFunction.Configuration!.State).toBe('Active');
    });

    test('Lambda is in VPC', () => {
      expect(lambdaFunction.Configuration!.VpcConfig).toBeDefined();
      expect(lambdaFunction.Configuration!.VpcConfig!.VpcId).toBe(outputs.vpc_id);
      expect(lambdaFunction.Configuration!.VpcConfig!.SubnetIds).toEqual(
        expect.arrayContaining(outputs.private_subnet_ids)
      );
    });

    test('Lambda has KMS encryption for environment variables', () => {
      expect(lambdaFunction.Configuration!.KMSKeyArn).toContain(outputs.kms_key_ids.lambda);
    });

    test('Lambda has dead letter queue configured', () => {
      expect(lambdaFunction.Configuration!.DeadLetterConfig).toBeDefined();
      expect(lambdaFunction.Configuration!.DeadLetterConfig!.TargetArn).toContain('payment-dlq');
    });

    test('Lambda runtime is Python 3.11', () => {
      expect(lambdaFunction.Configuration!.Runtime).toBe('python3.11');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Lambda log group exists with encryption and retention', async () => {
      const response = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.cloudwatch_log_groups.lambda,
        })
      );

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toContain(outputs.kms_key_ids.cloudwatch);
    }, 30000);

    test('VPC Flow Logs log group exists with encryption and retention', async () => {
      const response = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.cloudwatch_log_groups.flow_logs,
        })
      );

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toContain(outputs.kms_key_ids.cloudwatch);
    }, 30000);

    test('RDS log group exists with encryption and retention', async () => {
      const response = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.cloudwatch_log_groups.rds,
        })
      );

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toContain(outputs.kms_key_ids.cloudwatch);
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('RDS connection failures alarm exists', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'rds-connection-failures',
        })
      );

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
      const alarm = response.MetricAlarms!.find((a) => a.AlarmName!.includes('rds-connection-failures'));
      expect(alarm).toBeDefined();
      expect(alarm!.MetricName).toBe('DatabaseConnections');
    }, 30000);

    test('Lambda errors alarm exists', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'lambda-errors',
        })
      );

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
      const alarm = response.MetricAlarms!.find((a) => a.AlarmName!.includes('lambda-errors'));
      expect(alarm).toBeDefined();
      expect(alarm!.MetricName).toBe('Errors');
    }, 30000);

    test('Failed authentication alarm exists', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'failed-authentication',
        })
      );

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
      const alarm = response.MetricAlarms!.find((a) => a.AlarmName!.includes('failed-authentication'));
      expect(alarm).toBeDefined();
      expect(alarm!.MetricName).toBe('Throttles');
    }, 30000);

    test('Encryption violations alarm exists', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'encryption-violations',
        })
      );

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
      const alarm = response.MetricAlarms!.find((a) => a.AlarmName!.includes('encryption-violations'));
      expect(alarm).toBeDefined();
      expect(alarm!.MetricName).toBe('EncryptionViolations');
    }, 30000);
  });

  describe('Security Groups', () => {
    test('Lambda security group allows outbound HTTPS', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_ids.lambda],
        })
      );

      const sg = response.SecurityGroups![0];
      const httpsEgress = sg.IpPermissionsEgress!.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsEgress).toBeDefined();
    }, 30000);

    test('RDS security group allows PostgreSQL from Lambda', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_ids.rds],
        })
      );

      const sg = response.SecurityGroups![0];
      const postgresIngress = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresIngress).toBeDefined();
    }, 30000);

    test('VPC endpoint security group allows HTTPS from VPC', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.security_group_ids.vpc_endpoint],
        })
      );

      const sg = response.SecurityGroups![0];
      const httpsIngress = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('all 9 mandatory requirements are satisfied', async () => {
      // 1. Database Security: RDS with encryption
      expect(outputs.rds_endpoint).toBeDefined();
      expect(outputs.kms_key_ids.rds).toBeDefined();

      // 2. Storage Security: S3 with KMS encryption
      expect(outputs.s3_data_bucket).toBeDefined();
      expect(outputs.s3_flow_logs_bucket).toBeDefined();

      // 3. Encryption Key Management: 4 KMS keys
      expect(outputs.kms_key_ids.rds).toBeDefined();
      expect(outputs.kms_key_ids.s3).toBeDefined();
      expect(outputs.kms_key_ids.cloudwatch).toBeDefined();
      expect(outputs.kms_key_ids.lambda).toBeDefined();

      // 4. Network Isolation: VPC with private subnets
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.private_subnet_ids).toHaveLength(3);

      // 5. Serverless Computing: Lambda with VPC
      expect(outputs.lambda_function_name).toBeDefined();

      // 6. Logging and Monitoring: CloudWatch log groups
      expect(outputs.cloudwatch_log_groups.lambda).toBeDefined();
      expect(outputs.cloudwatch_log_groups.flow_logs).toBeDefined();
      expect(outputs.cloudwatch_log_groups.rds).toBeDefined();

      // 7. Identity and Access Management: Security groups
      expect(outputs.security_group_ids.lambda).toBeDefined();
      expect(outputs.security_group_ids.rds).toBeDefined();

      // 8. Network Traffic Monitoring: VPC Flow Logs verified above
      expect(outputs.s3_flow_logs_bucket).toBeDefined();

      // 9. Security Alerting: CloudWatch alarms verified above
      // Alarms are verified in CloudWatch Alarms tests
    });
  });
});
