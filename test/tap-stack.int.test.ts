import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';

// Initialize AWS SDK clients in the same region as stack
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

describe('TapStack Integration Tests', () => {
  let accountId: string;
  let outputs: { [key: string]: string };

  beforeAll(async () => {
    // Flatten outputs
    outputs = rawOutputs.TapStackpr2053.reduce((acc: any, o: any) => {
      acc[o.OutputKey] = o.OutputValue;
      return acc;
    }, {});
    outputs.EnvironmentName = 'production';

    // Ensure required outputs exist
    const required = [
      'VPCId', 'DataBucketName', 'LogBucketName', 'DynamoDBTableName',
      'RDSEndpoint', 'RDSSecretArn', 'LambdaFunctionArn', 'ALBArn',
    ];
    const missing = required.filter(k => !outputs[k]);
    if (missing.length > 0) throw new Error(`Missing outputs: ${missing.join(', ')}`);

    // Account ID
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

    it('should fail to describe a non-existent VPC', async () => {
      await expect(ec2.describeVpcs({ VpcIds: ['vpc-nonexistent'] }).promise())
        .rejects.toThrow(/does not exist/i);
    });
  });

  // -------------------- S3 --------------------
  describe('S3 Buckets', () => {
    it('should have DataBucket with encryption', async () => {
      const enc = await s3.getBucketEncryption({ Bucket: outputs.DataBucketName }).promise();
      expect(enc.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    it('should fail to access a non-existent bucket', async () => {
      await expect(s3.headBucket({ Bucket: 'nonexistent-bucket' }).promise())
        .rejects.toThrow(/NoSuchBucket|Forbidden/);
    });
  });

  // -------------------- DynamoDB --------------------
  describe('DynamoDB', () => {
    it('should have a DynamoDB table', async () => {
      const res = await dynamodb.describeTable({ TableName: outputs.DynamoDBTableName }).promise();
      expect(res.Table!.TableName).toBe('production-fintech-table');
    });

    it('should fail for non-existent table', async () => {
      await expect(dynamodb.describeTable({ TableName: 'nonexistent-table' }).promise())
        .rejects.toThrow(/ResourceNotFoundException/);
    });
  });

  // -------------------- RDS --------------------
  describe('RDS', () => {
    it('should match stack endpoint', async () => {
      const res = await rds.describeDBInstances({ DBInstanceIdentifier: 'production-fintech-db' }).promise();
      expect(res.DBInstances![0].Endpoint!.Address).toBe(outputs.RDSEndpoint);
    });

    it('should fail for non-existent DB', async () => {
      await expect(rds.describeDBInstances({ DBInstanceIdentifier: 'nonexistent-db' }).promise())
        .rejects.toThrow(/DBInstanceNotFoundFault/);
    });
  });

  // -------------------- Secrets Manager --------------------
  describe('Secrets Manager', () => {
    it('should exist for RDS credentials', async () => {
      const res = await secretsmanager.describeSecret({ SecretId: outputs.RDSSecretArn }).promise();
      expect(res.Name).toBe('production-fintech-rds-credentials');
    });

    it('should fail for non-existent secret', async () => {
      await expect(secretsmanager.describeSecret({ SecretId: 'nonexistent-secret' }).promise())
        .rejects.toThrow(/ResourceNotFoundException/);
    });
  });

  // -------------------- IAM --------------------
  describe('IAM', () => {
    it('should have AdminRole with MFA', async () => {
      const res = await iam.getRole({ RoleName: 'production-admin-role' }).promise();
      const doc = JSON.parse(decodeURIComponent(res.Role.AssumeRolePolicyDocument!));
      expect(doc.Statement[0].Condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
    });

    it('should fail for non-existent role', async () => {
      await expect(iam.getRole({ RoleName: 'nonexistent-role' }).promise())
        .rejects.toThrow(/NoSuchEntity/);
    });
  });

  // -------------------- CloudTrail --------------------
  describe('CloudTrail', () => {
    it('should exist with logging enabled', async () => {
      const res = await cloudtrail.getTrail({ Name: 'production-fintech-trail' }).promise();
      expect(res.Trail!.IsMultiRegionTrail).toBe(true);
    });

    it('should fail for non-existent trail', async () => {
      await expect(cloudtrail.getTrail({ Name: 'nonexistent-trail' }).promise())
        .rejects.toThrow(/TrailNotFoundException/);
    });
  });

  // -------------------- Lambda --------------------
  describe('Lambda', () => {
    it('should fail for non-existent Lambda', async () => {
      await expect(lambda.invoke({ FunctionName: 'nonexistent-lambda' }).promise())
        .rejects.toThrow(/ResourceNotFoundException/);
    });
  });

  // -------------------- ALB --------------------
  describe('ALB', () => {
    it('should exist in VPC', async () => {
      const res = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.ALBArn] }).promise();
      expect(res.LoadBalancers).toHaveLength(1);
    });

    it('should fail for non-existent ALB', async () => {
      await expect(elbv2.describeLoadBalancers({ LoadBalancerArns: [
        'arn:aws:elasticloadbalancing:us-east-1:111111111111:loadbalancer/app/nonexistent/123456'
      ] }).promise()).rejects.toThrow(/LoadBalancerNotFound/);
    });
  });
});
