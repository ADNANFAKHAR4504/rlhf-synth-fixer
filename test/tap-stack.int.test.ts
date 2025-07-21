import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

// Setup AWS EC2 client
const REGION = 'us-east-2';
const client = new EC2Client({ region: REGION });

// ✅ Load outputs at module level so tests don't run if loading fails
const outputsFilePath = path.join(process.cwd(), 'cdk-outputs', 'flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'))['TapStackpr60'];
  console.log(`✅ Successfully loaded outputs from: ${outputsFilePath}`);
} catch (error) {
  console.error(`❌ Error reading or parsing outputs file: ${outputsFilePath}`);
  console.error(`Please ensure 'cdk-outputs/flat-outputs.json' exists and is valid JSON.`);
  console.error(`Error details:`, error);
  process.exit(1); // Prevent test run if outputs are invalid or missing
}

const getOutputValue = (key: string): string => {
  const item = outputs.find((o: any) => o.OutputKey === key);
  if (!item) throw new Error(`Missing output for ${key}`);
  return item.OutputValue;
};

describe('CloudFormation Stack Integration Tests', () => {
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
