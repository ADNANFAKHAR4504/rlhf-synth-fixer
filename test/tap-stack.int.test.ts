import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

// Initialize AWS EC2 Client. The region is determined from environment variables.
const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region: awsRegion });

describe('TapStack AWS Infrastructure Integration Tests', () => {
  // Variables to hold resource IDs fetched from Terraform outputs
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let securityGroupId: string;
  let instanceId: string;

  // Before running any tests, read the deployed stack's outputs from a JSON file.
  beforeAll(() => {
    // Determine the environment suffix to find the correct stack outputs
    const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`Integration test output file not found at ${outputFilePath}. Please run 'cdktf output -json > cfn-outputs/flat-outputs.json' first.`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    
    // FIX: The lookup for the stack key was hardcoded to 'teststack', which is brittle.
    // This is changed to use the environment suffix, which is more robust in a CI/CD environment
    // where stack names are often dynamic and environment-specific.
    const stackKey = Object.keys(outputs).find(k => k.toLowerCase().includes(suffix.toLowerCase()));
    if (!stackKey) {
      // FIX: Updated the error message to be more descriptive and aid in debugging.
      throw new Error(`No output found for a stack key including the suffix '${suffix}' in ${outputFilePath}`);
    }

    const stackOutputs = outputs[stackKey];

    // Assign the output values to our variables
    vpcId = stackOutputs['vpcId'];
    // The subnet outputs are comma-separated strings, so we split them into an array
    publicSubnetIds = stackOutputs['publicSubnetIds']?.split(', ') || [];
    privateSubnetIds = stackOutputs['privateSubnetIds']?.split(', ') || [];
    securityGroupId = stackOutputs['securityGroupId'];
    instanceId = stackOutputs['instanceId'];

    // Validate that all necessary IDs were found
    if (!vpcId || publicSubnetIds.length === 0 || privateSubnetIds.length === 0 || !securityGroupId || !instanceId) {
      throw new Error('Missing one or more required stack outputs in the JSON file.');
    }
  });

  // ===================================
  // VPC and Networking Tests
  // ===================================
  describe('VPC and Subnet Configuration', () => {
    test(`VPC "${vpcId}" should exist and be available`, async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
      expect(Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('should have the correct number of public and private subnets in the VPC', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
      // Expecting 2 public and 2 private subnets
      expect(Subnets).toHaveLength(4);

      const deployedSubnetIds = Subnets?.map(s => s.SubnetId);
      // Verify all created subnet IDs are present in the VPC
      expect(deployedSubnetIds).toEqual(expect.arrayContaining([...publicSubnetIds, ...privateSubnetIds]));
    }, 30000);
  });

  // ===================================
  // Security Group Tests
  // ===================================
  describe('EC2 Security Group Configuration', () => {
    test(`Security Group "${securityGroupId}" should exist in the VPC and have correct rules`, async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      const sg = SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.GroupId).toBe(securityGroupId);
      expect(sg?.VpcId).toBe(vpcId);

      // Verify Ingress (inbound) rules
      const sshRule = sg?.IpPermissions?.find(p => p.FromPort === 22);
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');

      const httpRule = sg?.IpPermissions?.find(p => p.FromPort === 80);
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

      const httpsRule = sg?.IpPermissions?.find(p => p.FromPort === 443);
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

      // Verify Egress (outbound) rule
      const egressRule = sg?.IpPermissionsEgress?.[0];
      expect(egressRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    }, 30000);
  });

  // ===================================
  // EC2 Instance Tests
  // ===================================
  describe('EC2 Instance Configuration', () => {
    test(`EC2 Instance "${instanceId}" should be running and correctly configured`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = Reservations?.[0]?.Instances?.[0];

      expect(instance).toBeDefined();
      expect(instance?.InstanceId).toBe(instanceId);
      // The instance should be in a stable, running state
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.VpcId).toBe(vpcId);
      // The instance should be in one of the public subnets
      expect(publicSubnetIds).toContain(instance?.SubnetId);
      // Check for the correct security group
      expect(instance?.SecurityGroups?.[0].GroupId).toBe(securityGroupId);
      // Check for the correct instance type and key pair
      expect(instance?.InstanceType).toBe('t2.micro');
      expect(instance?.KeyName).toBe('my-dev-keypair');
    }, 30000);
  });
});
