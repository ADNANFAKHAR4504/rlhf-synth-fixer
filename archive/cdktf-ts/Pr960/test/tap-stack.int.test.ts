import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe('TapStack AWS Infrastructure', () => {
  let vpcId: string;
  let ec2SgId: string;
  let instanceId: string;
  let kmsKeyArn: string;
  let instancePublicIp: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs['VpcId'];
    ec2SgId = stackOutputs['Ec2SecurityGroupId'];
    instanceId = stackOutputs['InstanceId'];
    kmsKeyArn = stackOutputs['KmsKeyArn'];
    instancePublicIp = stackOutputs['InstancePublicIp'];

    if (!vpcId || !ec2SgId || !instanceId || !kmsKeyArn || !instancePublicIp) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // VPC Test
  describe('VPC Configuration', () => {
    test(`should have VPC "${vpcId}" present in AWS`, async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 20000);
  });

  // Security Group Test
  describe('EC2 Security Group', () => {
    test(`should have EC2 SG "${ec2SgId}" in the VPC`, async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [ec2SgId] }));
      expect(SecurityGroups?.[0].GroupId).toBe(ec2SgId);
      expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
    }, 20000);
  });

  // EC2 Instance Test
  describe('EC2 Instance', () => {
    test(`should have EC2 Instance "${instanceId}" running in the VPC`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(instanceId);
      expect(instance?.VpcId).toBe(vpcId);
      expect(['pending', 'running', 'stopping', 'stopped']).toContain(instance?.State?.Name);
    }, 20000);

    test(`should have Public IP "${instancePublicIp}" assigned`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.PublicIpAddress).toBe(instancePublicIp);
    }, 20000);
  });

  // KMS Key Test
  describe('KMS Key for EC2 EBS Encryption', () => {
    test(`should have KMS Key "${kmsKeyArn}" enabled`, async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyArn }));
      expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(KeyMetadata?.Enabled).toBe(true);
    }, 20000);
  });
});
