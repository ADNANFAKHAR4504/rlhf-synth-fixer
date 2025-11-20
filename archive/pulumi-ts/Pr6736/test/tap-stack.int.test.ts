/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration Tests for TapStack Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * No AWS login required - tests run against the deployment output file
 *
 * Test Coverage:
 * - VPC and networking resources
 * - EKS cluster configuration
 * - IAM roles and policies
 * - Node groups (on-demand and spot)
 * - Fargate profiles
 * - OIDC provider configuration
 * - Kubeconfig structure and validity
 * - ARN format validation
 * - Resource naming conventions
 */

describe('TapStack Deployment Integration Tests', () => {
  let deploymentOutputs: any;
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at: ${outputsPath}\n` +
        'Please ensure the stack has been deployed and outputs are available.'
      );
    }

    const fileContent = fs.readFileSync(outputsPath, 'utf-8');
    deploymentOutputs = JSON.parse(fileContent);
  });

  describe('Deployment Outputs File', () => {
    it('should exist and be readable', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    it('should contain valid JSON', () => {
      expect(deploymentOutputs).toBeDefined();
      expect(typeof deploymentOutputs).toBe('object');
    });

    it('should not be empty', () => {
      expect(Object.keys(deploymentOutputs).length).toBeGreaterThan(0);
    });

    it('should have all required output fields', () => {
      const requiredFields = [
        'vpcId',
        'publicSubnetIds',
        'privateSubnetIds',
        'clusterName',
        'clusterEndpoint',
        'clusterVersion',
        'oidcProviderUrl',
        'oidcProviderArn',
        'kubeconfig',
        'onDemandNodeGroupName',
        'spotNodeGroupName',
        'nodeGroupRoleArn',
        'fargateProfileName',
        'fargateRoleArn',
        'devRoleArn',
        'stagingRoleArn',
        'prodRoleArn',
        'clusterAutoscalerRoleArn',
        'albControllerRoleArn',
      ];

      requiredFields.forEach(field => {
        expect(deploymentOutputs).toHaveProperty(field);
        expect(deploymentOutputs[field]).toBeDefined();
        expect(deploymentOutputs[field]).not.toBe('');
      });
    });
  });

  describe('VPC Configuration', () => {
    it('should have valid VPC ID format', () => {
      expect(deploymentOutputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    it('should have VPC ID value', () => {
      expect(deploymentOutputs.vpcId).toBeTruthy();
      expect(deploymentOutputs.vpcId.length).toBeGreaterThan(0);
    });
  });

  describe('Subnet Configuration', () => {
    let publicSubnets: string[];
    let privateSubnets: string[];

    beforeAll(() => {
      publicSubnets = JSON.parse(deploymentOutputs.publicSubnetIds);
      privateSubnets = JSON.parse(deploymentOutputs.privateSubnetIds);
    });

    it('should have public subnet IDs as valid JSON array', () => {
      expect(() => JSON.parse(deploymentOutputs.publicSubnetIds)).not.toThrow();
      expect(Array.isArray(publicSubnets)).toBe(true);
    });

    it('should have exactly 3 public subnets', () => {
      expect(publicSubnets).toHaveLength(3);
    });

    it('should have valid public subnet ID format', () => {
      publicSubnets.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    it('should have unique public subnet IDs', () => {
      const uniqueSubnets = new Set(publicSubnets);
      expect(uniqueSubnets.size).toBe(publicSubnets.length);
    });

    it('should have private subnet IDs as valid JSON array', () => {
      expect(() => JSON.parse(deploymentOutputs.privateSubnetIds)).not.toThrow();
      expect(Array.isArray(privateSubnets)).toBe(true);
    });

    it('should have exactly 3 private subnets', () => {
      expect(privateSubnets).toHaveLength(3);
    });

    it('should have valid private subnet ID format', () => {
      privateSubnets.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      });
    });

    it('should have unique private subnet IDs', () => {
      const uniqueSubnets = new Set(privateSubnets);
      expect(uniqueSubnets.size).toBe(privateSubnets.length);
    });

    it('should have different public and private subnet IDs', () => {
      const allSubnets = [...publicSubnets, ...privateSubnets];
      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(6); // 3 public + 3 private
    });
  });

  describe('EKS Cluster Configuration', () => {
    it('should have valid cluster name', () => {
      expect(deploymentOutputs.clusterName).toBeTruthy();
      expect(deploymentOutputs.clusterName.length).toBeGreaterThan(0);
      expect(deploymentOutputs.clusterName).toMatch(/^eks-cluster-/);
    });

    it('should have valid cluster endpoint URL', () => {
      expect(deploymentOutputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(deploymentOutputs.clusterEndpoint).toContain('.eks.amazonaws.com');
    });

    it('should have valid cluster endpoint format', () => {
      expect(() => new URL(deploymentOutputs.clusterEndpoint)).not.toThrow();
    });

    it('should have cluster version 1.28', () => {
      expect(deploymentOutputs.clusterVersion).toBe('1.28');
    });

    it('should have cluster version in valid format', () => {
      expect(deploymentOutputs.clusterVersion).toMatch(/^\d+\.\d+$/);
    });

    it('should have cluster endpoint using secure HTTPS', () => {
      const url = new URL(deploymentOutputs.clusterEndpoint);
      expect(url.protocol).toBe('https:');
    });

    it('should have cluster endpoint in us-east-1 region', () => {
      expect(deploymentOutputs.clusterEndpoint).toContain('us-east-1');
    });
  });

  describe('OIDC Provider Configuration', () => {
    it('should have valid OIDC provider URL', () => {
      expect(deploymentOutputs.oidcProviderUrl).toBeTruthy();
      expect(deploymentOutputs.oidcProviderUrl).toContain('oidc.eks.');
      expect(deploymentOutputs.oidcProviderUrl).toContain('.amazonaws.com/id/');
    });

    it('should have valid OIDC provider ARN format', () => {
      expect(deploymentOutputs.oidcProviderArn).toMatch(
        /^arn:aws:iam::\d{12}:oidc-provider\/oidc\.eks\.[a-z0-9-]+\.amazonaws\.com\/id\/[A-F0-9]+$/
      );
    });

    it('should have OIDC provider ARN with correct account ID', () => {
      const arnParts = deploymentOutputs.oidcProviderArn.split(':');
      expect(arnParts[4]).toMatch(/^\d{12}$/);
    });

    it('should have matching OIDC URL in provider ARN', () => {
      expect(deploymentOutputs.oidcProviderArn).toContain(deploymentOutputs.oidcProviderUrl);
    });

    it('should have OIDC provider in us-east-1 region', () => {
      expect(deploymentOutputs.oidcProviderUrl).toContain('us-east-1');
    });

    it('should have OIDC provider ID matching cluster endpoint', () => {
      const endpointId = deploymentOutputs.clusterEndpoint.split('.')[0].replace('https://', '');
      expect(deploymentOutputs.oidcProviderUrl).toContain(endpointId);
    });
  });

  describe('Kubeconfig Configuration', () => {
    let kubeconfig: any;

    beforeAll(() => {
      kubeconfig = JSON.parse(deploymentOutputs.kubeconfig);
    });

    it('should have valid kubeconfig JSON', () => {
      expect(() => JSON.parse(deploymentOutputs.kubeconfig)).not.toThrow();
      expect(kubeconfig).toBeDefined();
    });

    it('should have apiVersion v1', () => {
      expect(kubeconfig.apiVersion).toBe('v1');
    });

    it('should have kind Config', () => {
      expect(kubeconfig.kind).toBe('Config');
    });

    it('should have clusters array', () => {
      expect(kubeconfig.clusters).toBeDefined();
      expect(Array.isArray(kubeconfig.clusters)).toBe(true);
      expect(kubeconfig.clusters.length).toBeGreaterThan(0);
    });

    it('should have cluster with correct server endpoint', () => {
      const cluster = kubeconfig.clusters[0];
      expect(cluster.cluster.server).toBe(deploymentOutputs.clusterEndpoint);
    });

    it('should have cluster with certificate authority data', () => {
      const cluster = kubeconfig.clusters[0];
      expect(cluster.cluster['certificate-authority-data']).toBeDefined();
      expect(cluster.cluster['certificate-authority-data'].length).toBeGreaterThan(0);
    });

    it('should have valid base64 encoded certificate', () => {
      const cluster = kubeconfig.clusters[0];
      const certData = cluster.cluster['certificate-authority-data'];
      expect(certData).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should have contexts array', () => {
      expect(kubeconfig.contexts).toBeDefined();
      expect(Array.isArray(kubeconfig.contexts)).toBe(true);
      expect(kubeconfig.contexts.length).toBeGreaterThan(0);
    });

    it('should have current-context set', () => {
      expect(kubeconfig['current-context']).toBeDefined();
      expect(kubeconfig['current-context']).toBe('aws');
    });

    it('should have users array with AWS exec configuration', () => {
      expect(kubeconfig.users).toBeDefined();
      expect(Array.isArray(kubeconfig.users)).toBe(true);
      expect(kubeconfig.users.length).toBeGreaterThan(0);

      const user = kubeconfig.users[0];
      expect(user.user.exec).toBeDefined();
      expect(user.user.exec.command).toBe('aws');
    });

    it('should have AWS CLI exec args for EKS token', () => {
      const user = kubeconfig.users[0];
      expect(user.user.exec.args).toContain('eks');
      expect(user.user.exec.args).toContain('get-token');
      expect(user.user.exec.args).toContain('--cluster-name');
      expect(user.user.exec.args).toContain(deploymentOutputs.clusterName);
    });

    it('should have correct AWS region in exec args', () => {
      const user = kubeconfig.users[0];
      expect(user.user.exec.args).toContain('--region');
      expect(user.user.exec.args).toContain('us-east-1');
    });
  });

  describe('IAM Roles - Node Groups', () => {
    it('should have valid node group role ARN format', () => {
      expect(deploymentOutputs.nodeGroupRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-nodegroup-role-.+$/
      );
    });

    it('should have node group role ARN with correct naming', () => {
      expect(deploymentOutputs.nodeGroupRoleArn).toContain('eks-nodegroup-role-');
    });
  });

  describe('IAM Roles - Fargate', () => {
    it('should have valid Fargate role ARN format', () => {
      expect(deploymentOutputs.fargateRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-fargate-role-.+$/
      );
    });

    it('should have Fargate role ARN with correct naming', () => {
      expect(deploymentOutputs.fargateRoleArn).toContain('eks-fargate-role-');
    });
  });

  describe('IAM Roles - Environment Roles', () => {
    it('should have valid dev role ARN format', () => {
      expect(deploymentOutputs.devRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-dev-role-.+$/
      );
    });

    it('should have valid staging role ARN format', () => {
      expect(deploymentOutputs.stagingRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-staging-role-.+$/
      );
    });

    it('should have valid prod role ARN format', () => {
      expect(deploymentOutputs.prodRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-prod-role-.+$/
      );
    });

    it('should have unique role ARNs for each environment', () => {
      const roles = [
        deploymentOutputs.devRoleArn,
        deploymentOutputs.stagingRoleArn,
        deploymentOutputs.prodRoleArn,
      ];
      const uniqueRoles = new Set(roles);
      expect(uniqueRoles.size).toBe(3);
    });

    it('should have all environment roles in same AWS account', () => {
      const getAccountId = (arn: string) => arn.split(':')[4];

      const devAccount = getAccountId(deploymentOutputs.devRoleArn);
      const stagingAccount = getAccountId(deploymentOutputs.stagingRoleArn);
      const prodAccount = getAccountId(deploymentOutputs.prodRoleArn);

      expect(devAccount).toBe(stagingAccount);
      expect(stagingAccount).toBe(prodAccount);
    });
  });

  describe('IAM Roles - IRSA (IAM Roles for Service Accounts)', () => {
    it('should have valid cluster autoscaler role ARN format', () => {
      expect(deploymentOutputs.clusterAutoscalerRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-cluster-autoscaler-role-.+$/
      );
    });

    it('should have cluster autoscaler role ARN with correct naming', () => {
      expect(deploymentOutputs.clusterAutoscalerRoleArn).toContain('eks-cluster-autoscaler-role-');
    });

    it('should have valid ALB controller role ARN format', () => {
      expect(deploymentOutputs.albControllerRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/eks-alb-controller-role-.+$/
      );
    });

    it('should have ALB controller role ARN with correct naming', () => {
      expect(deploymentOutputs.albControllerRoleArn).toContain('eks-alb-controller-role-');
    });

    it('should have unique IRSA role ARNs', () => {
      expect(deploymentOutputs.clusterAutoscalerRoleArn).not.toBe(
        deploymentOutputs.albControllerRoleArn
      );
    });
  });

  describe('Node Groups Configuration', () => {
    it('should have valid on-demand node group name', () => {
      expect(deploymentOutputs.onDemandNodeGroupName).toBeTruthy();
      expect(deploymentOutputs.onDemandNodeGroupName).toContain('ondemand-ng-');
    });

    it('should have valid spot node group name', () => {
      expect(deploymentOutputs.spotNodeGroupName).toBeTruthy();
      expect(deploymentOutputs.spotNodeGroupName).toContain('spot-ng-');
    });

    it('should have different names for on-demand and spot node groups', () => {
      expect(deploymentOutputs.onDemandNodeGroupName).not.toBe(
        deploymentOutputs.spotNodeGroupName
      );
    });

    it('should have consistent environment suffix in node group names', () => {
      const onDemandSuffix = deploymentOutputs.onDemandNodeGroupName.split('-').pop();
      const spotSuffix = deploymentOutputs.spotNodeGroupName.split('-').pop();
      expect(onDemandSuffix).toBe(spotSuffix);
    });
  });

  describe('Fargate Profile Configuration', () => {
    it('should have valid Fargate profile name', () => {
      expect(deploymentOutputs.fargateProfileName).toBeTruthy();
      expect(deploymentOutputs.fargateProfileName).toContain('kube-system-');
    });

    it('should indicate Fargate profile is for kube-system namespace', () => {
      expect(deploymentOutputs.fargateProfileName).toMatch(/^kube-system-.+$/);
    });
  });

  describe('Resource Naming Consistency', () => {
    let environmentSuffix: string;

    beforeAll(() => {
      // Extract environment suffix from one of the resources
      const vpcIdMatch = deploymentOutputs.clusterName.match(/eks-cluster-(.+?)-/);
      environmentSuffix = vpcIdMatch ? vpcIdMatch[1] : '';
    });

    it('should have consistent environment suffix across all resources', () => {
      expect(environmentSuffix).toBeTruthy();

      // Check if environment suffix appears in various resources
      expect(deploymentOutputs.onDemandNodeGroupName).toContain(environmentSuffix);
      expect(deploymentOutputs.spotNodeGroupName).toContain(environmentSuffix);
      expect(deploymentOutputs.fargateProfileName).toContain(environmentSuffix);
    });

    it('should have consistent naming pattern for IAM roles', () => {
      const roleNames = [
        deploymentOutputs.nodeGroupRoleArn,
        deploymentOutputs.fargateRoleArn,
        deploymentOutputs.devRoleArn,
        deploymentOutputs.stagingRoleArn,
        deploymentOutputs.prodRoleArn,
        deploymentOutputs.clusterAutoscalerRoleArn,
        deploymentOutputs.albControllerRoleArn,
      ];

      roleNames.forEach(arn => {
        // All roles should have the environment suffix
        expect(arn).toContain(environmentSuffix);
      });
    });
  });

  describe('AWS Account Consistency', () => {
    let accountId: string;

    beforeAll(() => {
      // Extract account ID from one of the ARNs
      const arnParts = deploymentOutputs.nodeGroupRoleArn.split(':');
      accountId = arnParts[4];
    });

    it('should have valid AWS account ID format', () => {
      expect(accountId).toMatch(/^\d{12}$/);
    });

    it('should use same AWS account for all IAM roles', () => {
      const roles = [
        deploymentOutputs.nodeGroupRoleArn,
        deploymentOutputs.fargateRoleArn,
        deploymentOutputs.devRoleArn,
        deploymentOutputs.stagingRoleArn,
        deploymentOutputs.prodRoleArn,
        deploymentOutputs.clusterAutoscalerRoleArn,
        deploymentOutputs.albControllerRoleArn,
      ];

      roles.forEach(arn => {
        const arnAccountId = arn.split(':')[4];
        expect(arnAccountId).toBe(accountId);
      });
    });

    it('should use same AWS account for OIDC provider', () => {
      const oidcAccountId = deploymentOutputs.oidcProviderArn.split(':')[4];
      expect(oidcAccountId).toBe(accountId);
    });
  });

  describe('AWS Region Consistency', () => {
    it('should deploy all resources in us-east-1 region', () => {
      // Check cluster endpoint
      expect(deploymentOutputs.clusterEndpoint).toContain('us-east-1');

      // Check OIDC provider URL
      expect(deploymentOutputs.oidcProviderUrl).toContain('us-east-1');

      // Check kubeconfig
      const kubeconfig = JSON.parse(deploymentOutputs.kubeconfig);
      const user = kubeconfig.users[0];
      expect(user.user.exec.args).toContain('us-east-1');
    });
  });

  describe('ARN Format Validation', () => {
    it('should have all IAM role ARNs in correct AWS ARN format', () => {
      const roleArns = [
        deploymentOutputs.nodeGroupRoleArn,
        deploymentOutputs.fargateRoleArn,
        deploymentOutputs.devRoleArn,
        deploymentOutputs.stagingRoleArn,
        deploymentOutputs.prodRoleArn,
        deploymentOutputs.clusterAutoscalerRoleArn,
        deploymentOutputs.albControllerRoleArn,
      ];

      roleArns.forEach(arn => {
        // ARN format: arn:partition:service:region:account-id:resource-type/resource-id
        expect(arn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);

        const parts = arn.split(':');
        expect(parts[0]).toBe('arn');
        expect(parts[1]).toBe('aws');
        expect(parts[2]).toBe('iam');
        expect(parts[3]).toBe(''); // IAM is global, no region
        expect(parts[4]).toMatch(/^\d{12}$/);
        expect(parts[5]).toContain('role/');
      });
    });

    it('should have OIDC provider ARN in correct format', () => {
      const arn = deploymentOutputs.oidcProviderArn;
      expect(arn).toMatch(/^arn:aws:iam::\d{12}:oidc-provider\/.+$/);

      const parts = arn.split(':');
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('iam');
      expect(parts[3]).toBe(''); // IAM is global
      expect(parts[4]).toMatch(/^\d{12}$/);
      expect(parts[5]).toContain('oidc-provider/');
    });
  });

  describe('Output Data Types', () => {
    it('should have string type for all outputs', () => {
      // All outputs should be strings (including JSON stringified arrays)
      Object.keys(deploymentOutputs).forEach(key => {
        expect(typeof deploymentOutputs[key]).toBe('string');
      });
    });

    it('should have non-empty values for all outputs', () => {
      Object.entries(deploymentOutputs).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect((value as string).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Deployment Completeness', () => {

    it('should not have any null or undefined values', () => {
      Object.values(deploymentOutputs).forEach(value => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });

    it('should have valid JSON structure', () => {
      expect(() => JSON.stringify(deploymentOutputs)).not.toThrow();
    });
  });

  describe('Integration Validation', () => {
    it('should have cluster name matching kubeconfig cluster name', () => {
      const kubeconfig = JSON.parse(deploymentOutputs.kubeconfig);
      const user = kubeconfig.users[0];
      const clusterNameInKubeconfig = user.user.exec.args[user.user.exec.args.indexOf('--cluster-name') + 1];
      expect(clusterNameInKubeconfig).toBe(deploymentOutputs.clusterName);
    });

    it('should have cluster endpoint matching kubeconfig server', () => {
      const kubeconfig = JSON.parse(deploymentOutputs.kubeconfig);
      const cluster = kubeconfig.clusters[0];
      expect(cluster.cluster.server).toBe(deploymentOutputs.clusterEndpoint);
    });

    it('should have OIDC provider URL without https prefix', () => {
      expect(deploymentOutputs.oidcProviderUrl).not.toContain('https://');
      expect(deploymentOutputs.oidcProviderUrl).toContain('oidc.eks.');
    });

    it('should have OIDC provider ARN containing the provider URL', () => {
      expect(deploymentOutputs.oidcProviderArn).toContain(deploymentOutputs.oidcProviderUrl);
    });
  });
});
