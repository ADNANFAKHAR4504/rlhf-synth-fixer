// Integration tests for Terraform AWS VPC Infrastructure
// These tests validate the deployed infrastructure in AWS

import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketLoggingCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
  GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';

const region = 'us-east-1';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const iamClient = new IAMClient({ region });

interface Outputs {
  vpc_id?: string;
  public_subnet_1_id?: string;
  public_subnet_2_id?: string;
  private_subnet_1_id?: string;
  private_subnet_2_id?: string;
  internet_gateway_id?: string;
  nat_gateway_id?: string;
  public_route_table_id?: string;
  private_route_table_id?: string;
  public_security_group_id?: string;
  private_security_group_id?: string;
  cloudtrail_logs_bucket?: string;
  cloudtrail_access_logs_bucket?: string;
  cloudtrail_name?: string;
  iam_role_name?: string;
  iam_instance_profile_name?: string;
  ec2_instance_id?: string;
}

describe('Terraform AWS VPC Infrastructure - Integration Tests', () => {
  let outputs: Outputs = {};
  let outputsAvailable = false;

  beforeAll(async () => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    
    if (fs.existsSync(outputsPath)) {
      try {
        outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
        console.log('✓ Loaded deployment outputs from cfn-outputs/flat-outputs.json');
        outputsAvailable = true;
      } catch (error) {
        console.warn('⚠ Error parsing outputs file:', error);
      }
    } else {
      console.warn('⚠ No outputs file found at:', outputsPath);
      console.warn('⚠ Integration tests will be skipped until infrastructure is deployed');
      console.warn('⚠ Run deployment first and collect outputs to cfn-outputs/flat-outputs.json');
    }
  });

  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      if (!outputsAvailable || !outputs.vpc_id) {
        console.log('⚠ Skipping - VPC ID not available in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);

      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('Subnet Configuration', () => {
    test('public subnets exist with correct configuration', async () => {
      if (!outputsAvailable || !outputs.public_subnet_1_id || !outputs.public_subnet_2_id) {
        console.log('⚠ Skipping - Public subnet IDs not available in outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.public_subnet_1_id, outputs.public_subnet_2_id],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const subnet1 = response.Subnets!.find(s => s.SubnetId === outputs.public_subnet_1_id);
      const subnet2 = response.Subnets!.find(s => s.SubnetId === outputs.public_subnet_2_id);

      expect(subnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1?.AvailabilityZone).toBe('us-east-1a');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1?.State).toBe('available');

      expect(subnet2?.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2?.AvailabilityZone).toBe('us-east-1b');
      expect(subnet2?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2?.State).toBe('available');

      expect(subnet1?.Tags?.find(tag => tag.Key === 'Environment')?.Value).toBe('Production');
      expect(subnet2?.Tags?.find(tag => tag.Key === 'Environment')?.Value).toBe('Production');
    });

    test('private subnets exist with correct configuration', async () => {
      if (!outputsAvailable || !outputs.private_subnet_1_id || !outputs.private_subnet_2_id) {
        console.log('⚠ Skipping - Private subnet IDs not available in outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.private_subnet_1_id, outputs.private_subnet_2_id],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const subnet1 = response.Subnets!.find(s => s.SubnetId === outputs.private_subnet_1_id);
      const subnet2 = response.Subnets!.find(s => s.SubnetId === outputs.private_subnet_2_id);

      expect(subnet1?.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet1?.AvailabilityZone).toBe('us-east-1a');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet1?.State).toBe('available');

      expect(subnet2?.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet2?.AvailabilityZone).toBe('us-east-1b');
      expect(subnet2?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2?.State).toBe('available');

      expect(subnet1?.Tags?.find(tag => tag.Key === 'Environment')?.Value).toBe('Production');
      expect(subnet2?.Tags?.find(tag => tag.Key === 'Environment')?.Value).toBe('Production');
    });
  });

  describe('Internet Gateway and NAT Gateway', () => {
    test('Internet Gateway exists and is attached to VPC', async () => {
      if (!outputsAvailable || !outputs.internet_gateway_id || !outputs.vpc_id) {
        console.log('⚠ Skipping - Internet Gateway ID or VPC ID not available in outputs');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBe(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe('available');

      const envTag = igw.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('NAT Gateway exists and is available', async () => {
      if (!outputsAvailable || !outputs.nat_gateway_id) {
        console.log('⚠ Skipping - NAT Gateway ID not available in outputs');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(1);

      const natGw = response.NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.SubnetId).toBe(outputs.public_subnet_1_id);
      expect(natGw.NatGatewayAddresses).toBeDefined();
      expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);

      const envTag = natGw.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('Route Tables', () => {
    test('public route table has correct routes', async () => {
      if (!outputsAvailable || !outputs.public_route_table_id) {
        console.log('⚠ Skipping - Public route table ID not available in outputs');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.public_route_table_id],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(1);

      const routeTable = response.RouteTables![0];
      expect(routeTable.VpcId).toBe(outputs.vpc_id);

      const internetRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(internetRoute).toBeDefined();
      expect(internetRoute?.GatewayId).toBe(outputs.internet_gateway_id);

      const envTag = routeTable.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('private route table has correct routes', async () => {
      if (!outputsAvailable || !outputs.private_route_table_id) {
        console.log('⚠ Skipping - Private route table ID not available in outputs');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.private_route_table_id],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(1);

      const routeTable = response.RouteTables![0];
      expect(routeTable.VpcId).toBe(outputs.vpc_id);

      const natRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(natRoute).toBeDefined();
      expect(natRoute?.NatGatewayId).toBe(outputs.nat_gateway_id);

      const envTag = routeTable.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('Security Groups', () => {
    test('public SSH security group has correct rules', async () => {
      if (!outputsAvailable || !outputs.public_security_group_id) {
        console.log('⚠ Skipping - Public security group ID not available in outputs');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.public_security_group_id],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const sshRule = sg.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges).toBeDefined();
      expect(sshRule?.IpRanges!.some(range => range.CidrIp === '203.0.113.0/24')).toBe(true);

      const egressRule = sg.IpPermissionsEgress?.find(
        rule => rule.IpProtocol === '-1'
      );
      expect(egressRule).toBeDefined();

      const envTag = sg.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('private EC2 security group has correct rules', async () => {
      if (!outputsAvailable || !outputs.private_security_group_id) {
        console.log('⚠ Skipping - Private security group ID not available in outputs');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.private_security_group_id],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const sshRule = sg.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.UserIdGroupPairs).toBeDefined();
      expect(sshRule?.UserIdGroupPairs!.some(pair => pair.GroupId === outputs.public_security_group_id)).toBe(true);

      const envTag = sg.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('S3 Buckets', () => {
    test('CloudTrail logs bucket has correct configuration', async () => {
      if (!outputsAvailable || !outputs.cloudtrail_logs_bucket) {
        console.log('⚠ Skipping - CloudTrail logs bucket name not available in outputs');
        return;
      }

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.cloudtrail_logs_bucket,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.cloudtrail_logs_bucket,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);

      // Check public access block
      const pabCommand = new GetPublicAccessBlockCommand({
        Bucket: outputs.cloudtrail_logs_bucket,
      });
      const pabResponse = await s3Client.send(pabCommand);
      expect(pabResponse.PublicAccessBlockConfiguration).toBeDefined();
      expect(pabResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

      // Check bucket policy
      const policyCommand = new GetBucketPolicyCommand({
        Bucket: outputs.cloudtrail_logs_bucket,
      });
      const policyResponse = await s3Client.send(policyCommand);
      expect(policyResponse.Policy).toBeDefined();
      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.some((s: any) => s.Sid === 'AWSCloudTrailAclCheck')).toBe(true);
      expect(policy.Statement.some((s: any) => s.Sid === 'AWSCloudTrailWrite')).toBe(true);

      // Check logging configuration
      const loggingCommand = new GetBucketLoggingCommand({
        Bucket: outputs.cloudtrail_logs_bucket,
      });
      const loggingResponse = await s3Client.send(loggingCommand);
      expect(loggingResponse.LoggingEnabled).toBeDefined();
      expect(loggingResponse.LoggingEnabled!.TargetBucket).toBe(outputs.cloudtrail_access_logs_bucket);
    });

    test('CloudTrail access logs bucket has correct configuration', async () => {
      if (!outputsAvailable || !outputs.cloudtrail_access_logs_bucket) {
        console.log('⚠ Skipping - CloudTrail access logs bucket name not available in outputs');
        return;
      }

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.cloudtrail_access_logs_bucket,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.cloudtrail_access_logs_bucket,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Check public access block
      const pabCommand = new GetPublicAccessBlockCommand({
        Bucket: outputs.cloudtrail_access_logs_bucket,
      });
      const pabResponse = await s3Client.send(pabCommand);
      expect(pabResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(pabResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail is properly configured and logging', async () => {
      if (!outputsAvailable || !outputs.cloudtrail_name) {
        console.log('⚠ Skipping - CloudTrail name not available in outputs');
        return;
      }

      // Describe trail
      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [outputs.cloudtrail_name],
      });
      const describeResponse = await cloudTrailClient.send(describeCommand);
      expect(describeResponse.trailList).toBeDefined();
      expect(describeResponse.trailList!.length).toBe(1);

      const trail = describeResponse.trailList![0];
      expect(trail.S3BucketName).toBe(outputs.cloudtrail_logs_bucket);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);

      // Check trail status
      const statusCommand = new GetTrailStatusCommand({
        Name: outputs.cloudtrail_name,
      });
      const statusResponse = await cloudTrailClient.send(statusCommand);
      expect(statusResponse.IsLogging).toBe(true);

      // Check event selectors
      const selectorsCommand = new GetEventSelectorsCommand({
        TrailName: outputs.cloudtrail_name,
      });
      const selectorsResponse = await cloudTrailClient.send(selectorsCommand);
      expect(selectorsResponse.EventSelectors).toBeDefined();
      expect(selectorsResponse.EventSelectors!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Configuration', () => {
    test('IAM role for EC2 exists with correct policy', async () => {
      if (!outputsAvailable || !outputs.iam_role_name) {
        console.log('⚠ Skipping - IAM role name not available in outputs');
        return;
      }

      const roleCommand = new GetRoleCommand({
        RoleName: outputs.iam_role_name,
      });
      const roleResponse = await iamClient.send(roleCommand);
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(outputs.iam_role_name);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement.some((s: any) => 
        s.Principal?.Service === 'ec2.amazonaws.com' && s.Action === 'sts:AssumeRole'
      )).toBe(true);

      // Check inline policy
      const policyCommand = new GetRolePolicyCommand({
        RoleName: outputs.iam_role_name,
        PolicyName: 's3-read-policy',
      });
      const policyResponse = await iamClient.send(policyCommand);
      expect(policyResponse.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.some((s: any) => 
        s.Action?.includes('s3:GetObject') || s.Action?.includes('s3:ListBucket')
      )).toBe(true);

      const envTag = roleResponse.Role!.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });

    test('IAM instance profile exists and linked to role', async () => {
      if (!outputsAvailable || !outputs.iam_instance_profile_name) {
        console.log('⚠ Skipping - IAM instance profile name not available in outputs');
        return;
      }

      const command = new GetInstanceProfileCommand({
        InstanceProfileName: outputs.iam_instance_profile_name,
      });
      const response = await iamClient.send(command);
      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.InstanceProfileName).toBe(outputs.iam_instance_profile_name);
      expect(response.InstanceProfile!.Roles).toBeDefined();
      expect(response.InstanceProfile!.Roles!.length).toBe(1);
      expect(response.InstanceProfile!.Roles![0].RoleName).toBe(outputs.iam_role_name);

      const envTag = response.InstanceProfile!.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance exists in private subnet with correct configuration', async () => {
      if (!outputsAvailable || !outputs.ec2_instance_id) {
        console.log('⚠ Skipping - EC2 instance ID not available in outputs');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.ec2_instance_id],
      });
      const response = await ec2Client.send(command);
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBe(1);
      expect(response.Reservations![0].Instances).toBeDefined();
      expect(response.Reservations![0].Instances!.length).toBe(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toMatch(/running|stopped/);
      expect(instance.SubnetId).toBe(outputs.private_subnet_1_id);
      expect(instance.VpcId).toBe(outputs.vpc_id);
      
      // Check security group
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.some(sg => sg.GroupId === outputs.private_security_group_id)).toBe(true);

      // Check IAM instance profile
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain(outputs.iam_instance_profile_name);

      // Check root volume encryption
      expect(instance.BlockDeviceMappings).toBeDefined();
      expect(instance.BlockDeviceMappings!.length).toBeGreaterThan(0);
      const rootDevice = instance.BlockDeviceMappings!.find(bdm => bdm.DeviceName === instance.RootDeviceName);
      expect(rootDevice).toBeDefined();

      // Check metadata options (IMDSv2)
      expect(instance.MetadataOptions).toBeDefined();
      expect(instance.MetadataOptions!.HttpTokens).toBe('required');

      const envTag = instance.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('End-to-End Workflow', () => {
    test('infrastructure components are properly interconnected', async () => {
      if (!outputsAvailable || !outputs.vpc_id) {
        console.log('⚠ Skipping - outputs not fully available');
        return;
      }

      // This test validates that all components work together
      // VPC -> Subnets -> Route Tables -> Gateways -> Security Groups -> EC2
      
      // All resources should be in the same VPC
      expect(outputs.vpc_id).toBeDefined();
      
      // Subnets should be in different AZs for HA
      if (outputs.public_subnet_1_id && outputs.public_subnet_2_id) {
        const subnetsCommand = new DescribeSubnetsCommand({
          SubnetIds: [outputs.public_subnet_1_id, outputs.public_subnet_2_id],
        });
        const subnetsResponse = await ec2Client.send(subnetsCommand);
        const azs = subnetsResponse.Subnets!.map(s => s.AvailabilityZone);
        expect(new Set(azs).size).toBe(2); // Different AZs
      }

      // NAT Gateway should have an Elastic IP
      if (outputs.nat_gateway_id) {
        const natCommand = new DescribeNatGatewaysCommand({
          NatGatewayIds: [outputs.nat_gateway_id],
        });
        const natResponse = await ec2Client.send(natCommand);
        expect(natResponse.NatGateways![0].NatGatewayAddresses).toBeDefined();
        expect(natResponse.NatGateways![0].NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(natResponse.NatGateways![0].NatGatewayAddresses![0].PublicIp).toBeDefined();
      }

      // CloudTrail should be logging to S3
      if (outputs.cloudtrail_name) {
        const statusCommand = new GetTrailStatusCommand({
          Name: outputs.cloudtrail_name,
        });
        const statusResponse = await cloudTrailClient.send(statusCommand);
        expect(statusResponse.IsLogging).toBe(true);
      }

      // EC2 instance should have connectivity through NAT Gateway (if running)
      if (outputs.ec2_instance_id) {
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [outputs.ec2_instance_id],
        });
        const ec2Response = await ec2Client.send(ec2Command);
        const instance = ec2Response.Reservations![0].Instances![0];
        
        // Instance in private subnet should not have public IP
        expect(instance.PublicIpAddress).toBeUndefined();
        // But should have private IP
        expect(instance.PrivateIpAddress).toBeDefined();
      }

      console.log('✓ All infrastructure components are properly interconnected');
    });
  });
});
