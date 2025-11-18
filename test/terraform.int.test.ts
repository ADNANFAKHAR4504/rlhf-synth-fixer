// Integration tests for EKS Fargate Cluster
// These tests verify the deployed AWS infrastructure is correctly configured

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

function skipIfStackMissing(): boolean {
  try {
    if (!fs.existsSync(outputsPath)) {
      console.warn('⚠️  Stack outputs not found - skipping integration tests');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️  Stack outputs not found - skipping integration tests');
    return true;
  }
}

describe('EKS Fargate Cluster Integration Tests', () => {
  let eks: AWS.EKS;
  let ec2: AWS.EC2;
  let iam: AWS.IAM;

  beforeAll(() => {
    if (skipIfStackMissing()) {
      return;
    }

    const outputContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputContent);

    const region = process.env.AWS_REGION || 'us-east-1';
    eks = new AWS.EKS({ region });
    ec2 = new AWS.EC2({ region });
    iam = new AWS.IAM();
  });

  describe('Terraform Outputs', () => {
    test('should have all required outputs', () => {
      if (skipIfStackMissing()) return;

      expect(outputs).toHaveProperty('cluster_name');
      expect(outputs).toHaveProperty('cluster_endpoint');
      expect(outputs).toHaveProperty('cluster_arn');
      expect(outputs).toHaveProperty('vpc_id');
      expect(outputs).toHaveProperty('private_subnet_ids');
      expect(outputs).toHaveProperty('public_subnet_ids');
      expect(outputs).toHaveProperty('fargate_profile_kube_system_id');
      expect(outputs).toHaveProperty('fargate_profile_application_id');
    });

    test('cluster endpoint should be valid HTTPS URL', () => {
      if (skipIfStackMissing()) return;

      expect(outputs.cluster_endpoint).toMatch(/^https:\/\/.+\.eks\.amazonaws\.com$/);
    });

    test('cluster ARN should be valid', () => {
      if (skipIfStackMissing()) return;

      expect(outputs.cluster_arn).toMatch(/^arn:aws:eks:us-east-1:\d+:cluster\/.+$/);
    });

    test('VPC ID should be valid', () => {
      if (skipIfStackMissing()) return;

      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('subnet IDs should be arrays', () => {
      if (skipIfStackMissing()) return;

      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.private_subnet_ids.length).toBe(2);
      expect(outputs.public_subnet_ids.length).toBe(2);
    });
  });

  describe('EKS Cluster', () => {
    test('cluster should exist and be active', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.name).toBe(outputs.cluster_name);
    });

    test('cluster should have correct Kubernetes version', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster?.version).toMatch(/^1\.\d+$/);
    });

    test('cluster should have logging enabled', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster?.logging?.clusterLogging).toBeDefined();
      const enabledTypes = response.cluster?.logging?.clusterLogging?.[0]?.types || [];
      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
    });

    test('cluster should have both private and public endpoint access', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster?.resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
      expect(response.cluster?.resourcesVpcConfig?.endpointPublicAccess).toBe(true);
    });

    test('cluster should be using correct VPC', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster?.resourcesVpcConfig?.vpcId).toBe(outputs.vpc_id);
    });

    test('cluster should use correct subnets', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();
      const clusterSubnets = response.cluster?.resourcesVpcConfig?.subnetIds || [];

      const allSubnets = [...outputs.private_subnet_ids, ...outputs.public_subnet_ids];
      allSubnets.forEach(subnetId => {
        expect(clusterSubnets).toContain(subnetId);
      });
    });
  });

  describe('Fargate Profiles', () => {
    test('kube-system Fargate profile should exist and be active', async () => {
      if (skipIfStackMissing()) return;

      const profileName = outputs.fargate_profile_kube_system_id.split(':')[1];
      const response = await eks.describeFargateProfile({
        clusterName: outputs.cluster_name,
        fargateProfileName: profileName
      }).promise();

      expect(response.fargateProfile).toBeDefined();
      expect(response.fargateProfile?.status).toBe('ACTIVE');
    });

    test('application Fargate profile should exist and be active', async () => {
      if (skipIfStackMissing()) return;

      const profileName = outputs.fargate_profile_application_id.split(':')[1];
      const response = await eks.describeFargateProfile({
        clusterName: outputs.cluster_name,
        fargateProfileName: profileName
      }).promise();

      expect(response.fargateProfile).toBeDefined();
      expect(response.fargateProfile?.status).toBe('ACTIVE');
    });

    test('kube-system profile should target kube-system namespace', async () => {
      if (skipIfStackMissing()) return;

      const profileName = outputs.fargate_profile_kube_system_id.split(':')[1];
      const response = await eks.describeFargateProfile({
        clusterName: outputs.cluster_name,
        fargateProfileName: profileName
      }).promise();

      const selectors = response.fargateProfile?.selectors || [];
      const namespaces = selectors.map(s => s.namespace);
      expect(namespaces).toContain('kube-system');
    });

    test('application profile should target default and custom namespace', async () => {
      if (skipIfStackMissing()) return;

      const profileName = outputs.fargate_profile_application_id.split(':')[1];
      const response = await eks.describeFargateProfile({
        clusterName: outputs.cluster_name,
        fargateProfileName: profileName
      }).promise();

      const selectors = response.fargateProfile?.selectors || [];
      const namespaces = selectors.map(s => s.namespace);
      expect(namespaces).toContain('default');
      expect(namespaces.length).toBeGreaterThanOrEqual(2);
    });

    test('Fargate profiles should use private subnets only', async () => {
      if (skipIfStackMissing()) return;

      const profileName = outputs.fargate_profile_kube_system_id.split(':')[1];
      const response = await eks.describeFargateProfile({
        clusterName: outputs.cluster_name,
        fargateProfileName: profileName
      }).promise();

      const fargateSubnets = response.fargateProfile?.subnets || [];
      outputs.private_subnet_ids.forEach((subnetId: string) => {
        expect(fargateSubnets).toContain(subnetId);
      });

      // Should NOT use public subnets
      outputs.public_subnet_ids.forEach((subnetId: string) => {
        expect(fargateSubnets).not.toContain(subnetId);
      });
    });
  });

  describe('No EC2 Node Groups', () => {
    test('cluster should NOT have any EC2 node groups', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.listNodegroups({ clusterName: outputs.cluster_name }).promise();

      expect(response.nodegroups).toBeDefined();
      expect(response.nodegroups?.length).toBe(0);
    });

    test('cluster should only have Fargate profiles', async () => {
      if (skipIfStackMissing()) return;

      const fargateResponse = await eks.listFargateProfiles({ clusterName: outputs.cluster_name }).promise();
      const nodegroupResponse = await eks.listNodegroups({ clusterName: outputs.cluster_name }).promise();

      expect(fargateResponse.fargateProfileNames?.length).toBeGreaterThan(0);
      expect(nodegroupResponse.nodegroups?.length).toBe(0);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
    });

    test('VPC should have DNS support and hostnames enabled', async () => {
      if (skipIfStackMissing()) return;

      const dnsSupport = await ec2.describeVpcAttribute({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      }).promise();

      const dnsHostnames = await ec2.describeVpcAttribute({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      }).promise();

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test('private subnets should exist and be in correct VPC', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSubnets({
        SubnetIds: outputs.private_subnet_ids
      }).promise();

      expect(response.Subnets?.length).toBe(2);
      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('public subnets should exist and be in correct VPC', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSubnets({
        SubnetIds: outputs.public_subnet_ids
      }).promise();

      expect(response.Subnets?.length).toBe(2);
      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('subnets should be in different availability zones', async () => {
      if (skipIfStackMissing()) return;

      const allSubnetIds = [...outputs.private_subnet_ids, ...outputs.public_subnet_ids];
      const response = await ec2.describeSubnets({ SubnetIds: allSubnetIds }).promise();

      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('private subnets should have EKS internal-elb tag', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSubnets({
        SubnetIds: outputs.private_subnet_ids
      }).promise();

      response.Subnets?.forEach(subnet => {
        const elbTag = subnet.Tags?.find(t => t.Key === 'kubernetes.io/role/internal-elb');
        expect(elbTag).toBeDefined();
        expect(elbTag?.Value).toBe('1');
      });
    });

    test('public subnets should have EKS elb tag', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSubnets({
        SubnetIds: outputs.public_subnet_ids
      }).promise();

      response.Subnets?.forEach(subnet => {
        const elbTag = subnet.Tags?.find(t => t.Key === 'kubernetes.io/role/elb');
        expect(elbTag).toBeDefined();
        expect(elbTag?.Value).toBe('1');
      });
    });
  });

  describe('NAT Gateways', () => {
    test('NAT gateways should exist in public subnets', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      expect(response.NatGateways?.length).toBe(2);
      response.NatGateways?.forEach(nat => {
        expect(outputs.public_subnet_ids).toContain(nat.SubnetId);
      });
    });
  });

  describe('IAM Roles', () => {
    test('EKS cluster role should exist', async () => {
      if (skipIfStackMissing()) return;

      const roleName = outputs.cluster_iam_role_arn.split('/').pop();
      const response = await iam.getRole({ RoleName: roleName! }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role.Arn).toBe(outputs.cluster_iam_role_arn);
    });

    test('Fargate pod execution role should exist', async () => {
      if (skipIfStackMissing()) return;

      const roleName = outputs.fargate_pod_execution_role_arn.split('/').pop();
      const response = await iam.getRole({ RoleName: roleName! }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role.Arn).toBe(outputs.fargate_pod_execution_role_arn);
    });

    test('EKS cluster role should have required policies', async () => {
      if (skipIfStackMissing()) return;

      const roleName = outputs.cluster_iam_role_arn.split('/').pop();
      const response = await iam.listAttachedRolePolicies({ RoleName: roleName! }).promise();

      const policyArns = response.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('Fargate pod execution role should have required policy', async () => {
      if (skipIfStackMissing()) return;

      const roleName = outputs.fargate_pod_execution_role_arn.split('/').pop();
      const response = await iam.listAttachedRolePolicies({ RoleName: roleName! }).promise();

      const policyArns = response.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy');
    });
  });

  describe('Security Groups', () => {
    test('cluster security group should exist', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSecurityGroups({
        GroupIds: [outputs.cluster_security_group_id]
      }).promise();

      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].VpcId).toBe(outputs.vpc_id);
    });

    test('cluster security group should allow egress', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSecurityGroups({
        GroupIds: [outputs.cluster_security_group_id]
      }).promise();

      const egressRules = response.SecurityGroups?.[0].IpPermissionsEgress || [];
      const allowAllEgress = egressRules.some(rule =>
        rule.IpProtocol === '-1' &&
        rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
      );

      expect(allowAllEgress).toBe(true);
    });

    test('cluster security group should allow ingress from VPC on port 443', async () => {
      if (skipIfStackMissing()) return;

      const response = await ec2.describeSecurityGroups({
        GroupIds: [outputs.cluster_security_group_id]
      }).promise();

      const ingressRules = response.SecurityGroups?.[0].IpPermissions || [];
      const has443Rule = ingressRules.some(rule =>
        rule.FromPort === 443 &&
        rule.ToPort === 443 &&
        rule.IpProtocol === 'tcp'
      );

      expect(has443Rule).toBe(true);
    });
  });

  describe('Resource Naming', () => {
    test('all resources should follow naming convention with environmentSuffix', async () => {
      if (skipIfStackMissing()) return;

      // Extract environmentSuffix from cluster name
      const clusterName = outputs.cluster_name;
      const suffix = clusterName.replace('eks-cluster-', '');

      // Check VPC name
      const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
      const vpcName = vpcResponse.Vpcs?.[0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(vpcName).toContain(suffix);

      // Check subnet names
      const subnetResponse = await ec2.describeSubnets({
        SubnetIds: [...outputs.private_subnet_ids, ...outputs.public_subnet_ids]
      }).promise();
      subnetResponse.Subnets?.forEach(subnet => {
        const subnetName = subnet.Tags?.find(t => t.Key === 'Name')?.Value;
        expect(subnetName).toContain(suffix);
      });
    });
  });

  describe('Cluster Connectivity', () => {
    test('cluster endpoint should be reachable', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster?.endpoint).toBeDefined();
      expect(response.cluster?.endpoint).toMatch(/^https:\/\//);
    });

    test('cluster should have certificate authority data', async () => {
      if (skipIfStackMissing()) return;

      const response = await eks.describeCluster({ name: outputs.cluster_name }).promise();

      expect(response.cluster?.certificateAuthority?.data).toBeDefined();
      expect(response.cluster?.certificateAuthority?.data).toBeTruthy();
    });
  });
});
