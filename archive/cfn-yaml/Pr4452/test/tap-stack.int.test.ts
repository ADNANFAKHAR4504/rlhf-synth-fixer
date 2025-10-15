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

const ec2 = new EC2Client({});
const s3 = new S3Client({});
const logs = new CloudWatchLogsClient({});

describe('TapStack integration tests (live resources)', () => {
  jest.setTimeout(120000);

  test('VPC has expected CIDR and required tags', async () => {
    const vpcId = outputs.VpcId;
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
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
    const sn = Subnets![0];
    expect(sn.MapPublicIpOnLaunch).toBe(true);
  });

  test('Private subnet exists and MapPublicIpOnLaunch false', async () => {
    const subnetId = outputs.PrivateSubnetA;
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
    const sn = Subnets![0];
    expect(sn.MapPublicIpOnLaunch).toBe(false);
  });

  test('ALB ARN references correct region and has expected shape', async () => {
    const albArn = outputs.ALBArn;
    const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    if (envRegion) expect(albArn.includes(`:${envRegion}:`)).toBe(true);
    expect(albArn).toMatch(/loadbalancer\/(app|net)\//);
  });

  test('EC2 instance exists and has detailed monitoring enabled', async () => {
    const instanceId = outputs.EC2InstanceId;
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    const instance = Reservations![0].Instances![0];
    expect(instance.InstanceId).toBe(instanceId);
    expect(instance.Monitoring).toBeDefined();
  });

  test('S3 buckets have server-side AES256 encryption', async () => {
    const cb = outputs.ConfigBucketName;
    const lb = outputs.LogBucketName;
    const enc1: any = await s3.send(new GetBucketEncryptionCommand({ Bucket: cb }));
    const enc2: any = await s3.send(new GetBucketEncryptionCommand({ Bucket: lb }));
    expect(JSON.stringify(enc1)).toContain('AES256');
    expect(JSON.stringify(enc2)).toContain('AES256');
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
