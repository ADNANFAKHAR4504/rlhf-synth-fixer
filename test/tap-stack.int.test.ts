import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetWebACLCommand,
  WAFV2Client,
} from '@aws-sdk/client-wafv2';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const dynamodb = new DynamoDBClient({ region });
const lambda = new LambdaClient({ region });
const waf = new WAFV2Client({ region });

describe('Financial Stack Integration Tests', () => {
  test('VPC should exist', async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test('Private subnets should be available and in correct VPC', async () => {
    const res = await ec2.send(new DescribeSubnetsCommand({
      SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
    }));
    expect(res.Subnets?.length).toBe(2);
    res.Subnets?.forEach(s => {
      expect(s.VpcId).toBe(outputs.VPCId);
      expect(s.State).toBe('available');
    });
  });

  test('RDS instance should be available', async () => {
    const res = await rds.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: outputs.RDSInstanceId,
    }));
    const db = res.DBInstances?.[0];
    expect(db?.DBInstanceStatus).toBe('available');
    expect(db?.PubliclyAccessible).toBe(false);
    expect(db?.StorageEncrypted).toBe(true);
  });

  test('Secure S3 bucket should exist with encryption', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName }));
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
  });

  test('CloudTrail S3 bucket should exist with encryption', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: outputs.CloudTrailLogBucketName }));
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.CloudTrailLogBucketName }));
    expect(enc.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toMatch(/kms/i);
  });

  test('DynamoDB table should be created and encrypted', async () => {
    const res = await dynamodb.send(new DescribeTableCommand({
      TableName: outputs.FinancialDynamoDBName,
    }));
    expect(res.Table?.SSEDescription?.Status).toBe('ENABLED');
  });

  test('Lambda function should exist', async () => {
    const res = await lambda.send(new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    }));
    expect(res.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
    expect(res.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
  });

  test('WAF WebACL should exist', async () => {
    const res = await waf.send(new GetWebACLCommand({
      Id: outputs.WebACLId,
      Name: 'financialwebacl',
      Scope: 'REGIONAL',
    }));
    expect(res.WebACL?.ARN).toBe(outputs.WebACLArn);
    expect(res.WebACL?.DefaultAction).toHaveProperty('Allow');
  });
});
