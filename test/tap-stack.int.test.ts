import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';

// Initialize AWS SDK clients
AWS.config.update({ region: 'us-east-1' });
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const rds = new AWS.RDS();
const secretsmanager = new AWS.SecretsManager();
const cloudtrail = new AWS.CloudTrail();
const lambda = new AWS.Lambda();
const iam = new AWS.IAM();
const elbv2 = new AWS.ELBv2();

// Load stack outputs
const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// --- Helper for resilient negative tests ---
async function expectAwsFailure(promise: Promise<any>, expected: string | RegExp) {
  try {
    await promise;
    throw new Error('Expected AWS call to fail but it succeeded');
  } catch (err: any) {
    if (typeof expected === 'string') {
      expect(
        err.code === expected ||
        (err.message && err.message.includes(expected))
      ).toBeTruthy();
    } else {
      expect(expected.test(err.message)).toBeTruthy();
    }
  }
}

describe('TapStack Integration Tests', () => {
  let accountId: string;
  let outputs: { [key: string]: string };

  beforeAll(async () => {
    outputs = rawOutputs.TapStackpr2053.reduce((acc: any, o: any) => {
      acc[o.OutputKey] = o.OutputValue;
      return acc;
    }, {});
    outputs.EnvironmentName = 'production';

    const required = [
      'VPCId', 'DataBucketName', 'LogBucketName', 'DynamoDBTableName',
      'RDSEndpoint', 'RDSSecretArn', 'LambdaFunctionArn', 'ALBArn',
    ];
    const missing = required.filter(k => !outputs[k]);
    if (missing.length > 0) throw new Error(`Missing outputs: ${missing.join(', ')}`);

    const sts = new AWS.STS();
    const id = await sts.getCallerIdentity().promise();
    accountId = id.Account!;
  });

  // -------------------- VPC --------------------
  describe('VPC Configuration', () => {
    it('should have a VPC with correct CIDR and DNS settings', async () => {
      const res = await ec2.describeVpcs({ VpcIds: [outputs.VPCId] }).promise();
      expect(res.Vpcs).toHaveLength(1);
      expect(res.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should fail for non-existent VPC', async () => {
      await expectAwsFailure(
        ec2.describeVpcs({ VpcIds: ['vpc-nonexistent'] }).promise(),
        'InvalidVpcID.NotFound'
      );
    });
  });

  // -------------------- Flow Logs --------------------
  describe('VPC Flow Logs', () => {
    it('should have flow logs enabled', async () => {
      const res = await ec2.describeFlowLogs({
        Filter: [{ Name: 'resource-id', Values: [outputs.VPCId] }]
      }).promise();
      expect(res.FlowLogs).toHaveLength(1);
      expect(res.FlowLogs![0].TrafficType).toBe('ALL');
    });

    it('should not exist for invalid VPC', async () => {
      const res = await ec2.describeFlowLogs({
        Filter: [{ Name: 'resource-id', Values: ['vpc-invalid'] }]
      }).promise();
      expect(res.FlowLogs).toHaveLength(0);
    });
  });

  // -------------------- S3 --------------------
  describe('S3 Buckets', () => {
    it('should have DataBucket with KMS encryption', async () => {
      const enc = await s3.getBucketEncryption({ Bucket: outputs.DataBucketName }).promise();
      expect(enc.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    it('should have LogBucket with KMS encryption', async () => {
      const enc = await s3.getBucketEncryption({ Bucket: outputs.LogBucketName }).promise();
      expect(enc.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

  // -------------------- DynamoDB --------------------
  describe('DynamoDB', () => {
    it('should exist with correct billing mode', async () => {
      const res = await dynamodb.describeTable({ TableName: outputs.DynamoDBTableName }).promise();
      expect(res.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should fail for non-existent table', async () => {
      await expectAwsFailure(
        dynamodb.describeTable({ TableName: 'nonexistent-table' }).promise(),
        'ResourceNotFoundException'
      );
    });
  });

  // -------------------- RDS --------------------
  describe('RDS', () => {
    it('should match exported endpoint', async () => {
      const res = await rds.describeDBInstances({ DBInstanceIdentifier: 'production-fintech-db' }).promise();
      expect(res.DBInstances![0].Endpoint!.Address).toBe(outputs.RDSEndpoint);
    });

  // -------------------- Secrets Manager --------------------
  describe('Secrets Manager', () => {
    it('should exist for RDS credentials', async () => {
      const res = await secretsmanager.describeSecret({ SecretId: outputs.RDSSecretArn }).promise();
      expect(res.Name).toBe('production-fintech-rds-credentials');
    });

    it('should fail for non-existent secret', async () => {
      await expectAwsFailure(
        secretsmanager.describeSecret({ SecretId: 'nonexistent-secret' }).promise(),
        'ResourceNotFoundException'
      );
    });
  });

  // -------------------- IAM --------------------
  describe('IAM Roles', () => {
    it('should have AdminRole requiring MFA', async () => {
      const res = await iam.getRole({ RoleName: 'production-admin-role' }).promise();
      const doc = JSON.parse(decodeURIComponent(res.Role.AssumeRolePolicyDocument!));
      expect(doc.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
    });

    it('should fail for non-existent role', async () => {
      await expectAwsFailure(
        iam.getRole({ RoleName: 'nonexistent-role' }).promise(),
        'NoSuchEntity'
      );
    });
  });

  // -------------------- CloudTrail --------------------
  describe('CloudTrail', () => {
    it('should exist with logging enabled', async () => {
      const res = await cloudtrail.getTrail({ Name: 'production-fintech-trail' }).promise();
      expect(res.Trail).toBeDefined();
      expect(res.Trail!.S3BucketName).toBe(outputs.LogBucketName);
      const status = await cloudtrail.getTrailStatus({ Name: 'production-fintech-trail' }).promise();
      expect(status.IsLogging).toBe(true);
    });

    it('should fail for non-existent trail', async () => {
      await expectAwsFailure(
        cloudtrail.getTrail({ Name: 'nonexistent-trail' }).promise(),
        'TrailNotFoundException'
      );
    });
  });

  // -------------------- Lambda --------------------
  describe('Lambda', () => {

    it('should fail for non-existent Lambda', async () => {
      await expectAwsFailure(
        lambda.invoke({ FunctionName: 'nonexistent-lambda' }).promise(),
        'ResourceNotFoundException'
      );
    });
  });

  // -------------------- ALB --------------------
  describe('Application Load Balancer', () => {
    it('should exist with correct configuration', async () => {
      const res = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.ALBArn] }).promise();
      expect(res.LoadBalancers).toHaveLength(1);
      expect(res.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    it('should fail for invalid/non-existent ALB', async () => {
      await expectAwsFailure(
        elbv2.describeLoadBalancers({
          LoadBalancerArns: ['arn:aws:elasticloadbalancing:us-east-1:111111111111:loadbalancer/app/nonexistent/123456']
        }).promise(),
        /LoadBalancerNotFound|not a valid load balancer ARN/
      );
    });
  });

  // -------------------- Compliance --------------------
  describe('Compliance & Best Practices', () => {
    it('should enforce KMS encryption across services', async () => {
      const s3Enc = await s3.getBucketEncryption({ Bucket: outputs.DataBucketName }).promise();
      expect(s3Enc.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      const table = await dynamodb.describeTable({ TableName: outputs.DynamoDBTableName }).promise();
      expect(table.Table!.SSEDescription?.Status).toBe('ENABLED');

      const rdsRes = await rds.describeDBInstances({ DBInstanceIdentifier: 'production-fintech-db' }).promise();
      expect(rdsRes.DBInstances![0].StorageEncrypted).toBe(true);
    });

    it('should enforce MFA for IAM roles', async () => {
      const admin = await iam.getRole({ RoleName: 'production-admin-role' }).promise();
      const docAdmin = JSON.parse(decodeURIComponent(admin.Role.AssumeRolePolicyDocument!));
      expect(docAdmin.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
    });
  });
});
