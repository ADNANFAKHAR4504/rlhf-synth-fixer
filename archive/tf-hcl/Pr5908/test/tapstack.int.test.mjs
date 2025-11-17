/**
 * Integration Tests for EKS Fargate Terraform Infrastructure
 * Tests actual deployed AWS resources using real deployment outputs
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EKSClient, DescribeClusterCommand, ListFargateProfilesCommand } from '@aws-sdk/client-eks';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand, GetPolicyCommand } from '@aws-sdk/client-iam';

describe('EKS Fargate Stack - Integration Tests', () => {
  let outputs;
  let eksClient;
  let ec2Client;
  let iamClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    outputs = JSON.parse(readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    const region = outputs.region;
    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.cluster_name).toBeDefined();
      expect(outputs.cluster_endpoint).toBeDefined();
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.region).toBe('ap-southeast-1');
    });

    it('should have cluster name with environment suffix', () => {
      expect(outputs.cluster_name).toMatch(/eks-fargate-synth3whjk/);
    });

    it('should have cluster endpoint URL', () => {
      expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
      expect(outputs.cluster_endpoint).toContain('.eks.ap-southeast-1.amazonaws.com');
    });

    it('should have VPC ID', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have 3 private subnet IDs', () => {
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(outputs.private_subnet_ids.length).toBe(3);
      outputs.private_subnet_ids.forEach(id => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    it('should have 3 public subnet IDs', () => {
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBe(3);
      outputs.public_subnet_ids.forEach(id => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    it('should have all Fargate profile IDs', () => {
      expect(outputs.fargate_profile_kube_system_id).toContain('kube-system');
      expect(outputs.fargate_profile_application_id).toContain('application');
      expect(outputs.fargate_profile_dev_id).toContain('dev');
      expect(outputs.fargate_profile_prod_id).toContain('prod');
    });

    it('should have OIDC provider ARN', () => {
      expect(outputs.oidc_provider_arn).toMatch(/^arn:aws:iam::\d+:oidc-provider/);
      expect(outputs.oidc_provider_arn).toContain('oidc.eks.ap-southeast-1.amazonaws.com');
    });

    it('should have Load Balancer Controller role ARN', () => {
      expect(outputs.load_balancer_controller_role_arn).toMatch(/^arn:aws:iam::\d+:role\/aws-load-balancer-controller/);
    });
  });

  describe('EKS Cluster Validation', () => {
    let clusterInfo;

    beforeAll(async () => {
      const command = new DescribeClusterCommand({ name: outputs.cluster_name });
      const response = await eksClient.send(command);
      clusterInfo = response.cluster;
    });

    it('should have EKS cluster deployed and ACTIVE', async () => {
      expect(clusterInfo).toBeDefined();
      expect(clusterInfo.status).toBe('ACTIVE');
    });

    it('should be version 1.28', async () => {
      expect(clusterInfo.version).toBe('1.28');
    });

    it('should have private and public endpoint access enabled', async () => {
      expect(clusterInfo.resourcesVpcConfig.endpointPrivateAccess).toBe(true);
      expect(clusterInfo.resourcesVpcConfig.endpointPublicAccess).toBe(true);
    });

    it('should have control plane logging enabled', async () => {
      const logging = clusterInfo.logging.clusterLogging[0];
      expect(logging.enabled).toBe(true);
      expect(logging.types).toContain('api');
      expect(logging.types).toContain('audit');
      expect(logging.types).toContain('authenticator');
    });

    it('should be deployed in correct VPC', async () => {
      expect(clusterInfo.resourcesVpcConfig.vpcId).toBe(outputs.vpc_id);
    });

    it('should use private subnets', async () => {
      const clusterSubnets = clusterInfo.resourcesVpcConfig.subnetIds;
      outputs.private_subnet_ids.forEach(subnetId => {
        expect(clusterSubnets).toContain(subnetId);
      });
    });

    it('should have OIDC provider configured', async () => {
      expect(clusterInfo.identity.oidc).toBeDefined();
      expect(clusterInfo.identity.oidc.issuer).toContain('oidc.eks.ap-southeast-1.amazonaws.com');
    });

    it('should have proper tags', async () => {
      expect(clusterInfo.tags).toBeDefined();
      expect(clusterInfo.tags.Environment).toBe('synth3whjk');
      expect(clusterInfo.tags.ManagedBy).toBe('Terraform');
      expect(clusterInfo.tags.Project).toBe('EKSFargate');
    });
  });

  describe('Fargate Profiles Validation', () => {
    let fargateProfiles;

    beforeAll(async () => {
      const command = new ListFargateProfilesCommand({ clusterName: outputs.cluster_name });
      const response = await eksClient.send(command);
      fargateProfiles = response.fargateProfileNames;
    });

    it('should have 4 Fargate profiles', async () => {
      expect(fargateProfiles.length).toBe(4);
    });

    it('should have kube-system Fargate profile', async () => {
      const kubeSystemProfile = fargateProfiles.find(p => p.includes('kube-system'));
      expect(kubeSystemProfile).toBeDefined();
      expect(kubeSystemProfile).toContain('synth3whjk');
    });

    it('should have application Fargate profile', async () => {
      const appProfile = fargateProfiles.find(p => p.includes('application'));
      expect(appProfile).toBeDefined();
      expect(appProfile).toContain('synth3whjk');
    });

    it('should have dev Fargate profile', async () => {
      const devProfile = fargateProfiles.find(p => p.includes('dev'));
      expect(devProfile).toBeDefined();
      expect(devProfile).toContain('synth3whjk');
    });

    it('should have prod Fargate profile', async () => {
      const prodProfile = fargateProfiles.find(p => p.includes('prod'));
      expect(prodProfile).toBeDefined();
      expect(prodProfile).toContain('synth3whjk');
    });
  });

  describe('VPC and Networking Validation', () => {
    let vpcInfo;
    let privateSubnets;
    let publicSubnets;

    beforeAll(async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      vpcInfo = vpcResponse.Vpcs[0];

      const privateSubnetCommand = new DescribeSubnetsCommand({ SubnetIds: outputs.private_subnet_ids });
      const privateResponse = await ec2Client.send(privateSubnetCommand);
      privateSubnets = privateResponse.Subnets;

      const publicSubnetCommand = new DescribeSubnetsCommand({ SubnetIds: outputs.public_subnet_ids });
      const publicResponse = await ec2Client.send(publicSubnetCommand);
      publicSubnets = publicResponse.Subnets;
    });

    it('should have VPC with DNS support enabled', async () => {
      expect(vpcInfo.EnableDnsSupport).toBe(true);
      expect(vpcInfo.EnableDnsHostnames).toBe(true);
    });

    it('should have VPC with correct CIDR block', async () => {
      expect(vpcInfo.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have 3 private subnets in different AZs', async () => {
      expect(privateSubnets.length).toBe(3);
      const azs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // 3 unique AZs
    });

    it('should have 3 public subnets in different AZs', async () => {
      expect(publicSubnets.length).toBe(3);
      const azs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // 3 unique AZs
    });

    it('should have private subnets without auto-assign public IP', async () => {
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should have public subnets with auto-assign public IP', async () => {
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have Kubernetes tags on subnets', async () => {
      privateSubnets.forEach(subnet => {
        const tags = subnet.Tags.reduce((acc, tag) => ({ ...acc, [tag.Key]: tag.Value }), {});
        expect(tags['kubernetes.io/role/internal-elb']).toBe('1');
      });

      publicSubnets.forEach(subnet => {
        const tags = subnet.Tags.reduce((acc, tag) => ({ ...acc, [tag.Key]: tag.Value }), {});
        expect(tags['kubernetes.io/role/elb']).toBe('1');
      });
    });
  });

  describe('IAM Resources Validation', () => {
    it('should have Load Balancer Controller role', async () => {
      const roleName = outputs.load_balancer_controller_role_arn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toContain('aws-load-balancer-controller');
      expect(response.Role.RoleName).toContain('synth3whjk');
    });

    it('should have OIDC trust policy for Load Balancer Controller', async () => {
      const roleName = outputs.load_balancer_controller_role_arn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRoleWithWebIdentity');
      expect(trustPolicy.Statement[0].Principal.Federated).toContain('oidc-provider/oidc.eks.ap-southeast-1.amazonaws.com');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use environment suffix in all resource names', () => {
      expect(outputs.cluster_name).toContain('synth3whjk');
      expect(outputs.load_balancer_controller_role_arn).toContain('synth3whjk');
      expect(outputs.fargate_profile_kube_system_id).toContain('synth3whjk');
      expect(outputs.fargate_profile_application_id).toContain('synth3whjk');
      expect(outputs.fargate_profile_dev_id).toContain('synth3whjk');
      expect(outputs.fargate_profile_prod_id).toContain('synth3whjk');
    });

    it('should not have hardcoded environment names in infrastructure', () => {
      // Allow dev/prod in namespace names but not in infrastructure naming
      expect(outputs.cluster_name).not.toMatch(/-prod-|-dev-|-stage-/);
      expect(outputs.load_balancer_controller_role_arn).not.toMatch(/-prod-|-dev-|-stage-/);
    });
  });
});
