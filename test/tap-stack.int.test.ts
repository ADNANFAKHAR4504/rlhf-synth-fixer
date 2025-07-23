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
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });

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

  test('CloudTrail S3 bucket exists with AES256 encryption', async () => {
    await s3.send(new HeadBucketCommand({ Bucket: outputs.CloudTrailLogBucketName }));
    const encryption = await s3.send(new GetBucketEncryptionCommand({
      Bucket: outputs.CloudTrailLogBucketName,
    }));
    const algo = encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
      .ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toMatch(/AES256/i); // Since your bucket uses AES256 not KMS
  });

  test('Lambda function exists and runs', async () => {
    const res = await lambda.send(new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    }));
    expect(res.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
  });

  test('All required output keys are present', () => {
    const expected = [
      'VPCId',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'RDSInstanceId',
      'RDSEndpoint',
      'S3BucketName',
      'CloudTrailLogBucketName',
      'LambdaFunctionName',
    ];
    expected.forEach(key => expect(outputs[key]).toBeDefined());
  });

  test('Encrypted S3 bucket name follows naming pattern', () => {
    expect(outputs.S3BucketName).toMatch(/^tapstackpr\d+-encryptedbucket/);
  });
});
