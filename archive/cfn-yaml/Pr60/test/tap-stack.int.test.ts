import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

// Setup AWS EC2 client
const REGION = 'us-east-1';
const client = new EC2Client({ region: REGION });

// ✅ Load outputs at module level so tests don't run if loading fails
const outputsFilePath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
let outputs: { [key: string]: string }; // Explicitly type outputs as a key-value object

try {
  // Directly parse the flat JSON object
  outputs = JSON.parse(fs.readFileSync(outputsFilePath, 'utf8'));
  console.log(`✅ Successfully loaded outputs from: ${outputsFilePath}`);
} catch (error) {
  console.error(`❌ Error reading or parsing outputs file: ${outputsFilePath}`);
  console.error(`Please ensure 'cdk-outputs/flat-outputs.json' exists and is valid JSON.`);
  console.error(`Error details:`, error);
  process.exit(1); // Prevent test run if outputs are invalid or missing
}

// Modify getOutputValue to directly access the property
const getOutputValue = (key: string): string => {
  const value = outputs[key]; // Access directly by key
  if (value === undefined) throw new Error(`Missing output for ${key}`);
  return value;
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
