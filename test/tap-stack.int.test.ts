import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
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
  S3Client,
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

describe('Secure Infrastructure Stack Integration Tests', () => {
  test('VPC should exist', async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test('Private subnets should exist and be in the correct VPC', async () => {
    const res = await ec2.send(new DescribeSubnetsCommand({
      SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
    }));
    expect(res.Subnets?.length).toBe(2);
    res.Subnets?.forEach(s => {
      expect(s.VpcId).toBe(outputs.VPCId);
    });
  });

  test('RDS instance is available and encrypted', async () => {
    const res = await rds.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: outputs.RDSInstanceId,
    }));
    const rdsInstance = res.DBInstances?.[0];
    expect(rdsInstance?.DBInstanceStatus).toBe('available');
    expect(rdsInstance?.MultiAZ).toBe(true);
    expect(rdsInstance?.StorageEncrypted).toBe(true);
  });

  test('Main encrypted S3 bucket exists with encryption enabled', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName }));
    const encryption = await s3.send(new GetBucketEncryptionCommand({
      Bucket: outputs.S3BucketName,
    }));
    expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
  });

  test('CloudTrail S3 bucket exists with SSE-KMS enabled', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: outputs.CloudTrailLogBucketName }));
    const encryption = await s3.send(new GetBucketEncryptionCommand({
      Bucket: outputs.CloudTrailLogBucketName,
    }));
    const algo = encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
      .ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toMatch(/kms/i);
  });

  test('DynamoDB table exists and encryption is enabled', async () => {
    const res = await dynamodb.send(new DescribeTableCommand({
      TableName: outputs.FinancialDynamoDBName,
    }));
    expect(res.Table?.SSEDescription?.Status).toBe('ENABLED');
  });

  test('Lambda function exists and is attached to VPC', async () => {
    const res = await lambda.send(new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    }));
    expect(res.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
    expect(res.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
  });

  test('WAF WebACL exists and allows traffic by default', async () => {
    const res = await waf.send(new GetWebACLCommand({
      Id: outputs.WebACLId,
      Name: 'securewebacl', // Update if named differently in your template
      Scope: 'REGIONAL',
    }));
    expect(res.WebACL?.ARN).toBe(outputs.WebACLArn);
    expect(res.WebACL?.DefaultAction).toHaveProperty('Allow');
  });

  test('All critical output keys are present in flat-outputs.json', () => {
    const expected = [
      'VPCId',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'RDSInstanceId',
      'S3BucketName',
      'CloudTrailLogBucketName',
      'FinancialDynamoDBName',
      'LambdaFunctionName',
      'WebACLId',
      'WebACLArn',
    ];
    expected.forEach(key => expect(outputs[key]).toBeDefined());
  });

  test('Encrypted S3 bucket name follows naming pattern', () => {
    expect(outputs.S3BucketName).toMatch(/^tapstackpr\d+-encryptedbucket/);
  });
});
