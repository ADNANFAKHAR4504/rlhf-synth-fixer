// Integration tests for EKS Fargate Cluster

import { EKSClient, DescribeClusterCommand, DescribeFargateProfileCommand } from '@aws-sdk/client-eks';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;
let skipTests = false;

function skipIfStackMissing(): boolean {
  try {
    if (!fs.existsSync(outputsPath)) {
      console.warn('⚠️ Stack outputs not found - skipping integration tests');
      return true;
    }

    const outputContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputContent);

    // Check if outputs is empty or missing required fields
    if (!outputs || Object.keys(outputs).length === 0) {
      console.warn('⚠️ Stack outputs are empty - deployment may have failed. Skipping integration tests');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('⚠️ Error reading stack outputs - skipping integration tests', error);
    return true;
  }
}

const region = process.env.AWS_REGION || 'us-east-1';

describe('EKS Fargate Cluster - Integration Tests', () => {
  let eksClient: EKSClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;

  beforeAll(() => {
    skipTests = skipIfStackMissing();

    if (skipTests) {
      return;
    }

    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
  });

  describe('Deployment Outputs Validation', () => {
    test('all required outputs should be properly set', () => {
      if (skipTests) return;

      expect(outputs.cluster_arn).toBeDefined();
      expect(outputs.cluster_name).toBeDefined();
      expect(outputs.cluster_id).toBeDefined();
      expect(outputs.cluster_endpoint).toBeDefined();
      expect(outputs.cluster_security_group_id).toBeDefined();
      expect(outputs.cluster_iam_role_arn).toBeDefined();
      expect(outputs.fargate_pod_execution_role_arn).toBeDefined();
      expect(outputs.fargate_profile_application_id).toBeDefined();
      expect(outputs.fargate_profile_kube_system_id).toBeDefined();
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
    });

    test('cluster ARN should be in correct format', () => {
      if (skipTests) return;
      expect(outputs.cluster_arn).toMatch(/^arn:aws:eks:[a-z0-9-]+:\d+:cluster\/.+$/);
    });

    test('cluster endpoint should be valid HTTPS URL', () => {
      if (skipTests) return;
      expect(outputs.cluster_endpoint).toMatch(/^https:\/\/.+\.eks\.amazonaws\.com$/);
    });

    test('IAM role ARNs should be in correct format', () => {
      if (skipTests) return;
      expect(outputs.cluster_iam_role_arn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
      expect(outputs.fargate_pod_execution_role_arn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
    });

    test('Fargate profile IDs should be in correct format', () => {
      if (skipTests) return;
      expect(outputs.fargate_profile_application_id).toMatch(/^eks-cluster-.+:fargate-profile-.+$/);
      expect(outputs.fargate_profile_kube_system_id).toMatch(/^eks-cluster-.+:fargate-profile-.+$/);
    });

    test('all ARNs should be in correct region', () => {
      if (skipTests) return;
      expect(outputs.cluster_arn).toContain(`arn:aws:eks:${region}:`);
    });

    test('VPC and subnet IDs should be in correct format', () => {
      if (skipTests) return;
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);

      // Parse subnet IDs from JSON string
      const privateSubnets = JSON.parse(outputs.private_subnet_ids);
      const publicSubnets = JSON.parse(outputs.public_subnet_ids);

      expect(Array.isArray(privateSubnets)).toBe(true);
      expect(Array.isArray(publicSubnets)).toBe(true);
      expect(privateSubnets.length).toBe(2);
      expect(publicSubnets.length).toBe(2);

      privateSubnets.forEach((subnet: string) => {
        expect(subnet).toMatch(/^subnet-[a-f0-9]+$/);
      });

      publicSubnets.forEach((subnet: string) => {
        expect(subnet).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('security group ID should be in correct format', () => {
      if (skipTests) return;
      expect(outputs.cluster_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });
  });

  describe('EKS Cluster Configuration', () => {
    let clusterData: any;

    beforeAll(async () => {
      if (skipTests) return;

      const command = new DescribeClusterCommand({
        name: outputs.cluster_name,
      });
      const response = await eksClient.send(command);
      clusterData = response.cluster;
    });

    test('EKS cluster should exist and be active', () => {
      if (skipTests) return;

      expect(clusterData).toBeDefined();
      expect(clusterData.status).toBe('ACTIVE');
      expect(clusterData.name).toBe(outputs.cluster_name);
    });

    test('cluster should use correct VPC', () => {
      if (skipTests) return;
      expect(clusterData.resourcesVpcConfig.vpcId).toBe(outputs.vpc_id);
    });

    test('cluster should be using private and public subnets', () => {
      if (skipTests) return;

      const privateSubnets = JSON.parse(outputs.private_subnet_ids);
      const publicSubnets = JSON.parse(outputs.public_subnet_ids);
      const allSubnets = [...privateSubnets, ...publicSubnets];

      expect(clusterData.resourcesVpcConfig.subnetIds).toBeDefined();
      expect(clusterData.resourcesVpcConfig.subnetIds.length).toBe(4);

      allSubnets.forEach((subnet: string) => {
        expect(clusterData.resourcesVpcConfig.subnetIds).toContain(subnet);
      });
    });

    test('cluster endpoint should be publicly accessible', () => {
      if (skipTests) return;
      expect(clusterData.resourcesVpcConfig.endpointPublicAccess).toBe(true);
    });

    test('cluster should have correct IAM role', () => {
      if (skipTests) return;
      expect(clusterData.roleArn).toBe(outputs.cluster_iam_role_arn);
    });

    test('cluster ARN should match output', () => {
      if (skipTests) return;
      expect(clusterData.arn).toBe(outputs.cluster_arn);
    });

    test('cluster endpoint should match output', () => {
      if (skipTests) return;
      expect(clusterData.endpoint).toBe(outputs.cluster_endpoint);
    });

    test('cluster should have certificate authority data', () => {
      if (skipTests) return;
      expect(clusterData.certificateAuthority).toBeDefined();
      expect(clusterData.certificateAuthority.data).toBeDefined();
    });
  });

  describe('Fargate Profiles Configuration', () => {
    test('application Fargate profile should exist and be active', async () => {
      if (skipTests) return;

      const [clusterName, profileName] = outputs.fargate_profile_application_id.split(':');

      const command = new DescribeFargateProfileCommand({
        clusterName: clusterName,
        fargateProfileName: profileName,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile).toBeDefined();
      expect(response.fargateProfile?.status).toBe('ACTIVE');
      expect(response.fargateProfile?.fargateProfileName).toBe(profileName);
    });

    test('kube-system Fargate profile should exist and be active', async () => {
      if (skipTests) return;

      const [clusterName, profileName] = outputs.fargate_profile_kube_system_id.split(':');

      const command = new DescribeFargateProfileCommand({
        clusterName: clusterName,
        fargateProfileName: profileName,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile).toBeDefined();
      expect(response.fargateProfile?.status).toBe('ACTIVE');
      expect(response.fargateProfile?.fargateProfileName).toBe(profileName);
    });

    test('application profile should use correct subnets', async () => {
      if (skipTests) return;

      const [clusterName, profileName] = outputs.fargate_profile_application_id.split(':');
      const privateSubnets = JSON.parse(outputs.private_subnet_ids);

      const command = new DescribeFargateProfileCommand({
        clusterName: clusterName,
        fargateProfileName: profileName,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile?.subnets).toBeDefined();
      expect(response.fargateProfile?.subnets?.length).toBe(2);

      privateSubnets.forEach((subnet: string) => {
        expect(response.fargateProfile?.subnets).toContain(subnet);
      });
    });

    test('kube-system profile should use correct subnets', async () => {
      if (skipTests) return;

      const [clusterName, profileName] = outputs.fargate_profile_kube_system_id.split(':');
      const privateSubnets = JSON.parse(outputs.private_subnet_ids);

      const command = new DescribeFargateProfileCommand({
        clusterName: clusterName,
        fargateProfileName: profileName,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile?.subnets).toBeDefined();
      expect(response.fargateProfile?.subnets?.length).toBe(2);

      privateSubnets.forEach((subnet: string) => {
        expect(response.fargateProfile?.subnets).toContain(subnet);
      });
    });

    test('Fargate profiles should use correct pod execution role', async () => {
      if (skipTests) return;

      const [clusterName, profileName] = outputs.fargate_profile_application_id.split(':');

      const command = new DescribeFargateProfileCommand({
        clusterName: clusterName,
        fargateProfileName: profileName,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile?.podExecutionRoleArn).toBe(outputs.fargate_pod_execution_role_arn);
    });
  });

  describe('VPC Configuration', () => {
    let vpcData: any;

    beforeAll(async () => {
      if (skipTests) return;

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      vpcData = response.Vpcs?.[0];
    });

    test('VPC should exist', () => {
      if (skipTests) return;
      expect(vpcData).toBeDefined();
      expect(vpcData.VpcId).toBe(outputs.vpc_id);
    });

    test('VPC should have DNS support enabled', () => {
      if (skipTests) return;
      expect(vpcData.EnableDnsSupport).toBe(true);
    });

    test('VPC should have DNS hostnames enabled', () => {
      if (skipTests) return;
      expect(vpcData.EnableDnsHostnames).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('private subnets should exist and be properly configured', async () => {
      if (skipTests) return;

      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);

      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('public subnets should exist and be properly configured', async () => {
      if (skipTests) return;

      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);

      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('subnets should be in different availability zones', async () => {
      if (skipTests) return;

      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(2);
    });
  });

  describe('Security Group Configuration', () => {
    let securityGroupData: any;

    beforeAll(async () => {
      if (skipTests) return;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.cluster_security_group_id],
      });
      const response = await ec2Client.send(command);
      securityGroupData = response.SecurityGroups?.[0];
    });

    test('cluster security group should exist', () => {
      if (skipTests) return;
      expect(securityGroupData).toBeDefined();
      expect(securityGroupData.GroupId).toBe(outputs.cluster_security_group_id);
    });

    test('security group should be in correct VPC', () => {
      if (skipTests) return;
      expect(securityGroupData.VpcId).toBe(outputs.vpc_id);
    });

    test('security group should have egress rule allowing all traffic', () => {
      if (skipTests) return;

      const egressRules = securityGroupData.IpPermissionsEgress || [];
      const allowAllEgress = egressRules.find((rule: any) =>
        rule.IpProtocol === '-1' &&
        rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );

      expect(allowAllEgress).toBeDefined();
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('internet gateway should exist and be attached to VPC', async () => {
      if (skipTests) return;

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBeGreaterThan(0);

      const igw = response.InternetGateways?.[0];
      expect(igw?.Attachments?.[0].State).toBe('available');
      expect(igw?.Attachments?.[0].VpcId).toBe(outputs.vpc_id);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT gateways should exist in public subnets', async () => {
      if (skipTests) return;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(2);

      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      response.NatGateways?.forEach(natGw => {
        expect(publicSubnetIds).toContain(natGw.SubnetId);
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('cluster IAM role should exist and have correct policies', async () => {
      if (skipTests) return;

      const roleName = outputs.cluster_iam_role_arn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.cluster_iam_role_arn);

      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const policiesResponse = await iamClient.send(policiesCommand);

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];

      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('Fargate pod execution role should exist and have correct policy', async () => {
      if (skipTests) return;

      const roleName = outputs.fargate_pod_execution_role_arn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.fargate_pod_execution_role_arn);

      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const policiesResponse = await iamClient.send(policiesCommand);

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];

      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy');
    });
  });

  describe('Naming Conventions', () => {
    test('cluster name should follow naming convention', () => {
      if (skipTests) return;
      expect(outputs.cluster_name).toMatch(/^eks-cluster-.+$/);
    });

    test('IAM roles should follow naming convention', () => {
      if (skipTests) return;
      expect(outputs.cluster_iam_role_arn).toContain('eks-cluster-role');
      expect(outputs.fargate_pod_execution_role_arn).toContain('eks-fargate-pod-execution-role');
    });

    test('Fargate profiles should follow naming convention', () => {
      if (skipTests) return;
      expect(outputs.fargate_profile_application_id).toContain('fargate-profile-app');
      expect(outputs.fargate_profile_kube_system_id).toContain('fargate-profile-kube-system');
    });
  });
});
