import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const awsRegion = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe('TAP Stack AWS Infrastructure Integration Tests', () => {
  let vpcId: string;
  let instanceId: string;
  let securityGroupId: string;
  let kmsKeyArn: string;

  // Read outputs from the deployed stack before running tests
  beforeAll(() => {
    // This assumes you have a script that runs `cdktf output -json` and saves it
    const outputFilePath = path.join(__dirname, '..', 'cdktf.out', 'stacks', 'Test-Stack', 'output.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`Terraform output file not found at ${outputFilePath}. Please run 'cdktf deploy' first.`);
    }
    
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    vpcId = outputs.VpcId.value;
    instanceId = outputs.InstanceId.value;
    securityGroupId = outputs.Ec2SecurityGroupId.value;
    kmsKeyArn = outputs.KmsKeyArn.value;

    if (!vpcId || !instanceId || !securityGroupId || !kmsKeyArn) {
      throw new Error('Missing one or more required stack outputs for testing.');
    }
  });

  // --- VPC Test ---
  describe('VPC Configuration', () => {
    test(`VPC (${vpcId}) should be available`, async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs?.[0].VpcId).toBe(vpcId);
      expect(Vpcs?.[0].State).toBe('available');
    }, 30000); // 30-second timeout for AWS API calls
  });

  // --- EC2 Instance Test ---
  describe('EC2 Instance Configuration', () => {
    test(`EC2 Instance (${instanceId}) should be running and correctly configured`, async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = Reservations?.[0]?.Instances?.[0];
      
      expect(instance).toBeDefined();
      expect(instance?.InstanceId).toBe(instanceId);
      expect(instance?.InstanceType).toBe('t2.micro');
      expect(instance?.VpcId).toBe(vpcId);
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.PublicIpAddress).toBeDefined();
    }, 30000);
  });

  // --- Security Group Test ---
  describe('Security Group Configuration', () => {
    test(`Security Group (${securityGroupId}) should have correct inbound rules`, async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      const sg = SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.GroupId).toBe(securityGroupId);
      expect(sg?.VpcId).toBe(vpcId);

      // Check for HTTP rule
      const httpRule = sg?.IpPermissions?.find(p => p.FromPort === 80 && p.ToPort === 80 && p.IpProtocol === 'tcp');
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      
      // Check for SSH rule
      const sshRule = sg?.IpPermissions?.find(p => p.FromPort === 22 && p.ToPort === 22 && p.IpProtocol === 'tcp');
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('YOUR_IP_HERE/32');
    }, 30000);
  });

  // --- KMS Key Test ---
  describe('KMS Key Configuration', () => {
    test(`KMS Key (${kmsKeyArn}) should be enabled`, async () => {
      const keyId = kmsKeyArn.split('/').pop(); // Extract Key ID from ARN
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));

      expect(KeyMetadata).toBeDefined();
      expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(KeyMetadata?.Enabled).toBe(true);
    }, 30000);
  });
});
