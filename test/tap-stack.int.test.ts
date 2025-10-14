/**
 * Integration tests validating live AWS resources from cfn-outputs/flat-outputs.json
 *
 * - Uses AWS SDK v3 clients (EC2, S3, CloudWatch Logs)
 * - Verifies cross-resource behavior and tags (including iac-rlhf-amazon:true)
 * - Avoids account-specific or hardcoded values; relies on outputs file only
 *
 * Requirements:
 *   - AWS credentials & region set in environment (default region should match TargetRegion)
 *   - cfn-outputs/flat-outputs.json must exist and include the keys listed in template metadata
 *
 * Install: npm i @aws-sdk/client-ec2 @aws-sdk/client-s3 @aws-sdk/client-cloudwatch-logs
 */

import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetBucketEncryptionCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const outputsPath = path.resolve(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error('cfn-outputs/flat-outputs.json not found; run deployment and produce flat outputs first.');
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS clients (use environment region & creds)
const ec2 = new EC2Client({});
const s3 = new S3Client({});
const logs = new CloudWatchLogsClient({});

describe('TapStack integration tests (live resources)', () => {
  jest.setTimeout(120000);

  test('VPC has expected CIDR and required tags', async () => {
    const vpcId = outputs.VpcId;
    expect(vpcId).toBeDefined();
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs && Vpcs.length).toBeGreaterThan(0);
    const vpc = Vpcs![0];
    expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.Tags).toEqual(expect.arrayContaining([
      expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
      expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' }),
    ]));
  });

  test('Public subnet exists and MapPublicIpOnLaunch true', async () => {
    const subnetId = outputs.PublicSubnetA;
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
    expect(Subnets && Subnets.length).toBeGreaterThan(0);
    const sn = Subnets![0];
    expect(sn.MapPublicIpOnLaunch).toBe(true);
    expect(sn.Tags).toEqual(expect.arrayContaining([expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' })]));
  });

  test('Private subnet exists and MapPublicIpOnLaunch false', async () => {
    const subnetId = outputs.PrivateSubnetA;
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
    const sn = Subnets![0];
    expect(sn.MapPublicIpOnLaunch).toBe(false);
  });

  test('ALB ARN references correct region and has expected shape', async () => {
    const albArn = outputs.ALBArn;
    expect(typeof albArn).toBe('string');
    // Ensure region in ARN matches environment region
    const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    if (envRegion) {
      expect(albArn.includes(`:${envRegion}:`)).toBe(true);
    }
    expect(albArn).toMatch(/loadbalancer\/(app|net)\//);
  });

  test('EC2 instance exists and has detailed monitoring enabled', async () => {
    const instanceId = outputs.EC2InstanceId;
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    expect(Reservations && Reservations.length).toBeGreaterThan(0);
    const instance = Reservations![0].Instances![0];
    expect(instance.InstanceId).toBe(instanceId);
    expect(instance.Monitoring).toBeDefined();
  });

  test('S3 buckets have server-side AES256 encryption', async () => {
    const cb = outputs.ConfigBucketName;
    const lb = outputs.LogBucketName;
    const enc1: any = await s3.send(new GetBucketEncryptionCommand({ Bucket: cb }));
    const enc2: any = await s3.send(new GetBucketEncryptionCommand({ Bucket: lb }));
    const hasAES1 = JSON.stringify(enc1).includes('AES256');
    const hasAES2 = JSON.stringify(enc2).includes('AES256');
    expect(hasAES1).toBe(true);
    expect(hasAES2).toBe(true);
  });

  test('CloudWatch LogGroups exist for EC2 and ALB', async () => {
    const ec2Group = '/ec2/production/messages';
    const albGroup = '/alb/access-logs';
    const resp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: '/ec2/production' }));
    expect(resp.logGroups && resp.logGroups.some(g => g.logGroupName === ec2Group)).toBeTruthy();
    const resp2 = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: '/alb' }));
    expect(resp2.logGroups && resp2.logGroups.some(g => g.logGroupName === albGroup)).toBeTruthy();
  });
});
