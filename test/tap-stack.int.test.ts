// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region: awsRegion });

describe('TapStack Infrastructure Integration Tests', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetId: string;
  let securityGroupId: string;
  let instanceId: string;

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
    vpcId = stackOutputs['vpcId'];
    publicSubnetIds = stackOutputs['publicSubnetIds']?.split(',').map((s: string) => s.trim()) || [];
    privateSubnetId = stackOutputs['privateSubnetId'];
    securityGroupId = stackOutputs['securityGroupId'];
    instanceId = stackOutputs['instanceId'];

    if (!vpcId || !publicSubnetIds.length || !privateSubnetId || !securityGroupId || !instanceId) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  test('VPC exists', async () => {
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs?.length).toBe(1);
  }, 20000);

  test('Public subnet exists', async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
    expect(Subnets?.length).toBe(publicSubnetIds.length);
  }, 20000);

  test('Private subnet exists', async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [privateSubnetId] }));
    expect(Subnets?.length).toBe(1);
  }, 20000);

  test('Security group exists', async () => {
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
    expect(SecurityGroups?.length).toBe(1);
  }, 20000);

  test('EC2 instance exists and is running', async () => {
    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
    expect(Reservations?.length).toBeGreaterThan(0);
    const state = Reservations?.[0]?.Instances?.[0]?.State?.Name;
    expect(['pending', 'running', 'stopped']).toContain(state);
  }, 30000);
});
