import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import { IAMClient, GetGroupCommand } from '@aws-sdk/client-iam';
import { KMSClient, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import {
  WAFV2Client,
  GetWebACLForResourceCommand,
} from '@aws-sdk/client-wafv2';
import axios from 'axios';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const wafv2Client = new WAFV2Client({ region });

describe('TAP Stack Integration Tests', () => {
  // Test VPC
  test('VPC should be created with correct tags', async () => {
    const vpcId = outputs.VpcId;
    const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
    const response = await ec2Client.send(command);
    expect(response.Vpcs).toHaveLength(1);
    const vpc = response.Vpcs?.[0];
    expect(vpc?.Tags).toEqual(
      expect.arrayContaining([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'tap' },
        { Key: 'Owner', Value: 'platform-team' },
      ])
    );
  });

  // Test S3 Bucket
  test('S3 Bucket should have versioning and encryption enabled, and block public access', async () => {
    const bucketName = outputs.BucketName;

    // Check encryption
    const encryptionCommand = new GetBucketEncryptionCommand({
      Bucket: bucketName,
    });
    const encryptionResponse = await s3Client.send(encryptionCommand);
    expect(
      encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe('AES256');

    // Check versioning
    const versioningCommand = new GetBucketVersioningCommand({
      Bucket: bucketName,
    });
    const versioningResponse = await s3Client.send(versioningCommand);
    expect(versioningResponse.Status).toBe('Enabled');

    // Check public access block
    const publicAccessBlockCommand = new GetPublicAccessBlockCommand({
      Bucket: bucketName,
    });
    const publicAccessBlockResponse = await s3Client.send(
      publicAccessBlockCommand
    );
    expect(
      publicAccessBlockResponse.PublicAccessBlockConfiguration
    ).toEqual({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });
  });

  // Test RDS Instance
  test('RDS instance should be encrypted and have deletion protection', async () => {
    const dbInstanceIdentifier = outputs.DatabaseIdentifier;
    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
    });
    const response = await rdsClient.send(command);
    expect(response.DBInstances).toHaveLength(1);
    const dbInstance = response.DBInstances?.[0];
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.DeletionProtection).toBe(true);
  });

  // Test EC2 Instance
  test('EC2 instance should be t3.micro', async () => {
    const instanceId = outputs.InstanceId;
    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });
    const response = await ec2Client.send(command);
    expect(response.Reservations?.[0]?.Instances).toHaveLength(1);
    const instance = response.Reservations?.[0]?.Instances?.[0];
    expect(instance?.InstanceType).toBe('t3.micro');
  });

  // Test API Gateway and WAF
  test('API Gateway should return 200 and be protected by WAF', async () => {
    const apiUrl = outputs.ApiGatewayUrl;
    const apiResourceArn = outputs.ApiGatewayResourceArn;

    // Check API Gateway endpoint
    const response = await axios.get(`${apiUrl}hello`);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ message: 'hello world' });

    // Check WAF association
    const wafCommand = new GetWebACLForResourceCommand({
      ResourceArn: apiResourceArn,
    });
    const wafResponse = await wafv2Client.send(wafCommand);
    expect(wafResponse.WebACL).toBeDefined();
  });

  // Test IAM Groups
  test('IAM groups should be created', async () => {
    const adminGroupCommand = new GetGroupCommand({ GroupName: 'TapAdmins' });
    const readOnlyGroupCommand = new GetGroupCommand({ GroupName: 'TapReadOnly' });

    const adminGroupResponse = await iamClient.send(adminGroupCommand);
    expect(adminGroupResponse.Group?.GroupName).toBe('TapAdmins');

    const readOnlyGroupResponse = await iamClient.send(readOnlyGroupCommand);
    expect(readOnlyGroupResponse.Group?.GroupName).toBe('TapReadOnly');
  });

  // Test KMS Key
  test('KMS key should have rotation enabled', async () => {
    const keyId = outputs.KmsKeyId;
    const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
    const response = await kmsClient.send(command);
    expect(response.KeyRotationEnabled).toBe(true);
  });
});
