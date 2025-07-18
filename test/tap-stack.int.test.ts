import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

const REGION = 'us-east-1'; // Adjust if needed
const client = new EC2Client({ region: REGION });

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    const outputPath = path.join(__dirname, '../cdk-outputs/flat-outputs.json');
    const raw = fs.readFileSync(outputPath, 'utf8');
    outputs = JSON.parse(raw)['TapStackpr60'];
  });

  const getOutputValue = (key: string): string => {
    const item = outputs.find((o: any) => o.OutputKey === key);
    if (!item) throw new Error(`Missing output for ${key}`);
    return item.OutputValue;
  };

  test('VPC should exist', async () => {
    const vpcId = getOutputValue('VPCId');
    const cmd = new DescribeVpcsCommand({ VpcIds: [vpcId] });
    const result = await client.send(cmd);

    expect(result.Vpcs).toBeDefined();
    expect(result.Vpcs?.[0].VpcId).toBe(vpcId);
  });

  test('Public Subnet should exist and belong to the VPC', async () => {
    const vpcId = getOutputValue('VPCId');
    const subnetId = getOutputValue('PublicSubnetId');

    const cmd = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
    const result = await client.send(cmd);

    expect(result.Subnets?.[0].SubnetId).toBe(subnetId);
    expect(result.Subnets?.[0].VpcId).toBe(vpcId);
  });

  test('Web Security Group should exist and belong to the VPC', async () => {
    const vpcId = getOutputValue('VPCId');
    const sgId = getOutputValue('WebSecurityGroupId');

    const cmd = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
    const result = await client.send(cmd);

    expect(result.SecurityGroups?.[0].GroupId).toBe(sgId);
    expect(result.SecurityGroups?.[0].VpcId).toBe(vpcId);
  });
});
