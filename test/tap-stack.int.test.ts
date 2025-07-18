import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

const REGION = 'us-east-1'; // Adjust if needed
const STACK_NAME = 'TapStackpr60';
const OUTPUT_FILE = path.join(__dirname, 'cdk-outputs/flat-outputs.json');

const client = new EC2Client({ region: REGION });

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    if (!fs.existsSync(OUTPUT_FILE)) {
      throw new Error(`❌ Output file not found at: ${OUTPUT_FILE}`);
    }

    const raw = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed[STACK_NAME]) {
      throw new Error(`❌ Stack outputs for '${STACK_NAME}' not found in ${OUTPUT_FILE}`);
    }

    outputs = parsed[STACK_NAME].reduce((acc: Record<string, string>, curr: any) => {
      if (curr.OutputKey && curr.OutputValue) {
        acc[curr.OutputKey] = curr.OutputValue;
      }
      return acc;
    }, {});
  });

  const getOutputValue = (key: string): string => {
    const value = outputs[key];
    if (!value) throw new Error(`❌ Missing output for key: ${key}`);
    return value;
  };

  test('✅ VPC should exist', async () => {
    const vpcId = getOutputValue('VPCId');
    const cmd = new DescribeVpcsCommand({ VpcIds: [vpcId] });
    const result = await client.send(cmd);

    expect(result.Vpcs?.length).toBeGreaterThan(0);
    expect(result.Vpcs?.[0].VpcId).toBe(vpcId);
  });

  test('✅ Public Subnet should exist and belong to the VPC', async () => {
    const vpcId = getOutputValue('VPCId');
    const subnetId = getOutputValue('PublicSubnetId');

    const cmd = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
    const result = await client.send(cmd);

    expect(result.Subnets?.[0].SubnetId).toBe(subnetId);
    expect(result.Subnets?.[0].VpcId).toBe(vpcId);
  });

  test('✅ Web Security Group should exist and belong to the VPC', async () => {
    const vpcId = getOutputValue('VPCId');
    const sgId = getOutputValue('WebSecurityGroupId');

    const cmd = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
    const result = await client.send(cmd);

    expect(result.SecurityGroups?.[0].GroupId).toBe(sgId);
    expect(result.SecurityGroups?.[0].VpcId).toBe(vpcId);
  });
});
