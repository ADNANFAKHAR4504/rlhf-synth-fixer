import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });

describe('TAP Stack Core AWS Infrastructure', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetId: string;
  let ec2SecurityGroupId: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(
        `flat-outputs.json not found at ${outputFilePath}`
      );
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs['vpcId'];
    publicSubnetIds = stackOutputs['publicSubnetIds']
  ? (stackOutputs['publicSubnetIds'] as string)
      .split(',')
      .map((s: string) => s.trim())
  : [];

    privateSubnetId = stackOutputs['privateSubnetId'];
    ec2SecurityGroupId = stackOutputs['ec2SecurityGroupId'];

    if (!vpcId || !publicSubnetIds.length || !privateSubnetId || !ec2SecurityGroupId) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // --- VPC Test ---
  describe('VPC Configuration', () => {
    test(`should have VPC "${vpcId}" present in AWS`, async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 20000);
  });

  // --- Subnets Test ---
  describe('Subnets Configuration', () => {
    test(`should have public subnets present in VPC "${vpcId}"`, async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(publicSubnetIds.length);
      Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    }, 20000);

    test(`should have private subnet "${privateSubnetId}" in VPC "${vpcId}"`, async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetId] })
      );
      expect(Subnets?.length).toBe(1);
      expect(Subnets?.[0].VpcId).toBe(vpcId);
      expect(Subnets?.[0].MapPublicIpOnLaunch).toBe(false);
    }, 20000);
  });

  // --- Security Group Test ---
  describe('EC2 Security Group', () => {
    test(`should have EC2 SG "${ec2SecurityGroupId}" in VPC "${vpcId}"`, async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);
      expect(SecurityGroups?.[0].VpcId).toBe(vpcId);
    }, 20000);
  });
});
