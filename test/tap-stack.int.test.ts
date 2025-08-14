// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeLaunchTemplatesCommand,
} from '@aws-sdk/client-ec2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand as ASGDescribeCommand } from '@aws-sdk/client-auto-scaling';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const asgClient = new AutoScalingClient({ region: awsRegion });

describe('TapStack Infrastructure Integration Tests', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let securityGroupId: string;
  let launchTemplateId: string;
  let asgName: string;

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
    vpcId = stackOutputs['vpc_id'];
    publicSubnetIds = stackOutputs['public_subnet_ids']?.split(',').map((s: string) => s.trim()) || [];
    securityGroupId = stackOutputs['ec2_security_group_id'];
    launchTemplateId = stackOutputs['launch_template_id']; // If you output this
    asgName = stackOutputs['asg_name']; // If you output this

    if (!vpcId || !publicSubnetIds.length || !securityGroupId) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  test('VPC exists', async () => {
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs?.length).toBe(1);
  }, 20000);

  test('Public subnets exist', async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
    expect(Subnets?.length).toBe(publicSubnetIds.length);
  }, 20000);

  test('Security group exists', async () => {
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
    expect(SecurityGroups?.length).toBe(1);
  }, 20000);

  test('Launch template exists', async () => {
    if (!launchTemplateId) {
      return console.warn('No launch template ID output — skipping test.');
    }
    const { LaunchTemplates } = await ec2Client.send(new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [launchTemplateId] }));
    expect(LaunchTemplates?.length).toBe(1);
  }, 20000);

  test('Auto Scaling Group exists', async () => {
    if (!asgName) {
      return console.warn('No ASG name output — skipping test.');
    }
    const { AutoScalingGroups } = await asgClient.send(new ASGDescribeCommand({ AutoScalingGroupNames: [asgName] }));
    expect(AutoScalingGroups?.length).toBe(1);
  }, 30000);
});
