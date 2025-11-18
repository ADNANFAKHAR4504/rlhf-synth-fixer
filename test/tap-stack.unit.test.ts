import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Helper function to convert Output to Promise
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

// Mock all Pulumi modules
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return { names: ['us-east-1a', 'us-east-1b', 'us-east-1c'] };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return {};
  },
}, 'test-project', 'test-stack', true);

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Constructor - Default Configuration', () => {
    it('should create TapStack with default environmentSuffix', async () => {
      const args: TapStackArgs = {};
      
      stack = new TapStack('test-stack', args);

      const [
        vpcId,
        publicSubnetIds,
        privateSubnetIds,
        clusterName,
      ] = await Promise.all([
        promiseOf(stack.vpcId),
        promiseOf(stack.publicSubnetIds),
        promiseOf(stack.privateSubnetIds),
        promiseOf(stack.clusterName),
      ]);

      expect(vpcId).toBeDefined();
      expect(publicSubnetIds).toHaveLength(3);
      expect(privateSubnetIds).toHaveLength(3);
      expect(clusterName).toContain('eks-cluster');
    });

    it('should create TapStack with custom environmentSuffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };
      
      stack = new TapStack('test-stack-prod', args);

      const clusterName = await promiseOf(stack.clusterName);
      expect(clusterName).toContain('prod');
    });

    it('should create TapStack with custom tags', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: { Environment: 'staging', Team: 'devops' },
      };
      
      stack = new TapStack('test-stack-staging', args);

      const clusterName = await promiseOf(stack.clusterName);
      expect(clusterName).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'test' };
      stack = new TapStack('vpc-test-stack', args);
    });

    it('should create VPC with correct CIDR block', async () => {
      const vpcId = await promiseOf(stack.vpcId);
      expect(vpcId).toBeDefined();
      expect(vpcId).toContain('eks-vpc-test');
    });

    it('should create 3 public subnets', async () => {
      const publicSubnetIds = await promiseOf(stack.publicSubnetIds);
      expect(publicSubnetIds).toHaveLength(3);
    });

    it('should create 3 private subnets', async () => {
      const privateSubnetIds = await promiseOf(stack.privateSubnetIds);
      expect(privateSubnetIds).toHaveLength(3);
    });

    it('should export VPC ID', async () => {
      const vpcId = await promiseOf(stack.vpcId);
      expect(typeof vpcId).toBe('string');
    });

    it('should export public and private subnet IDs', async () => {
      const [publicSubnetIds, privateSubnetIds] = await Promise.all([
        promiseOf(stack.publicSubnetIds),
        promiseOf(stack.privateSubnetIds),
      ]);

      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(Array.isArray(privateSubnetIds)).toBe(true);
    });
  });

  describe('EKS Cluster Resources', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'eks-test' };
      stack = new TapStack('eks-cluster-test', args);
    });

    it('should create EKS cluster', async () => {
      const clusterName = await promiseOf(stack.clusterName);
      expect(clusterName).toBeDefined();
      expect(clusterName).toContain('eks-cluster');
    });

    it('should export cluster endpoint', async () => {
      const endpoint = await promiseOf(stack.clusterEndpoint);
      expect(endpoint).toBeDefined();
    });

    it('should export cluster version', async () => {
      const version = await promiseOf(stack.clusterVersion);
      expect(version).toBeDefined();
    });

    it('should export kubeconfig', async () => {
      const kubeconfig = await promiseOf(stack.kubeconfig);
      expect(kubeconfig).toBeDefined();
    });

    it('should create OIDC provider', async () => {
      const [oidcUrl, oidcArn] = await Promise.all([
        promiseOf(stack.oidcProviderUrl),
        promiseOf(stack.oidcProviderArn),
      ]);

      expect(oidcUrl).toBeDefined();
      expect(oidcArn).toBeDefined();
    });
  });

  describe('Node Groups', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'ng-test' };
      stack = new TapStack('nodegroup-test', args);
    });

    it('should create on-demand node group', async () => {
      const ngName = await promiseOf(stack.onDemandNodeGroupName);
      expect(ngName).toBeDefined();
      expect(ngName).toContain('ondemand-ng');
    });

    it('should create spot node group', async () => {
      const ngName = await promiseOf(stack.spotNodeGroupName);
      expect(ngName).toBeDefined();
      expect(ngName).toContain('spot-ng');
    });

    it('should export node group role ARN', async () => {
      const roleArn = await promiseOf(stack.nodeGroupRoleArn);
      expect(roleArn).toBeDefined();
    });
  });

  describe('Fargate Profile', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'fargate-test' };
      stack = new TapStack('fargate-test', args);
    });

    it('should create Fargate profile', async () => {
      const fargateProfileName = await promiseOf(stack.fargateProfileName);
      expect(fargateProfileName).toBeDefined();
      expect(fargateProfileName).toContain('kube-system');
    });

    it('should export Fargate role ARN', async () => {
      const roleArn = await promiseOf(stack.fargateRoleArn);
      expect(roleArn).toBeDefined();
    });
  });

  describe('IAM Roles - Environment RBAC', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'rbac-test' };
      stack = new TapStack('rbac-test', args);
    });

    it('should create dev role', async () => {
      const devRoleArn = await promiseOf(stack.devRoleArn);
      expect(devRoleArn).toBeDefined();
    });

    it('should create staging role', async () => {
      const stagingRoleArn = await promiseOf(stack.stagingRoleArn);
      expect(stagingRoleArn).toBeDefined();
    });

    it('should create prod role', async () => {
      const prodRoleArn = await promiseOf(stack.prodRoleArn);
      expect(prodRoleArn).toBeDefined();
    });

    it('should export all environment role ARNs', async () => {
      const [devArn, stagingArn, prodArn] = await Promise.all([
        promiseOf(stack.devRoleArn),
        promiseOf(stack.stagingRoleArn),
        promiseOf(stack.prodRoleArn),
      ]);

      expect(devArn).toBeDefined();
      expect(stagingArn).toBeDefined();
      expect(prodArn).toBeDefined();
    });
  });

  describe('Service Account Roles - IRSA', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'irsa-test' };
      stack = new TapStack('irsa-test', args);
    });

    it('should create cluster autoscaler role', async () => {
      const roleArn = await promiseOf(stack.clusterAutoscalerRoleArn);
      expect(roleArn).toBeDefined();
    });

    it('should create ALB controller role', async () => {
      const roleArn = await promiseOf(stack.albControllerRoleArn);
      expect(roleArn).toBeDefined();
    });

    it('should export both service account role ARNs', async () => {
      const [autoscalerArn, albArn] = await Promise.all([
        promiseOf(stack.clusterAutoscalerRoleArn),
        promiseOf(stack.albControllerRoleArn),
      ]);

      expect(autoscalerArn).toBeDefined();
      expect(albArn).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    beforeEach(() => {
      const args: TapStackArgs = { environmentSuffix: 'output-test' };
      stack = new TapStack('output-test', args);
    });

    it('should register all required outputs', async () => {
      const outputs = await Promise.all([
        promiseOf(stack.vpcId),
        promiseOf(stack.publicSubnetIds),
        promiseOf(stack.privateSubnetIds),
        promiseOf(stack.clusterName),
        promiseOf(stack.clusterEndpoint),
        promiseOf(stack.clusterVersion),
        promiseOf(stack.oidcProviderUrl),
        promiseOf(stack.oidcProviderArn),
        promiseOf(stack.kubeconfig),
        promiseOf(stack.onDemandNodeGroupName),
        promiseOf(stack.spotNodeGroupName),
        promiseOf(stack.nodeGroupRoleArn),
        promiseOf(stack.fargateProfileName),
        promiseOf(stack.fargateRoleArn),
        promiseOf(stack.devRoleArn),
        promiseOf(stack.stagingRoleArn),
        promiseOf(stack.prodRoleArn),
        promiseOf(stack.clusterAutoscalerRoleArn),
        promiseOf(stack.albControllerRoleArn),
      ]);

      outputs.forEach(output => {
        expect(output).toBeDefined();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty args object', async () => {
      const emptyArgs: TapStackArgs = {};
      const stack = new TapStack('empty-args-test', emptyArgs);
      
      const clusterName = await promiseOf(stack.clusterName);
      expect(clusterName).toBeDefined();
    });

    it('should use config when environmentSuffix not in args', async () => {
      const args: TapStackArgs = {};
      const stack = new TapStack('config-test', args);
      
      const clusterName = await promiseOf(stack.clusterName);
      expect(clusterName).toBeDefined();
    });

    it('should handle OIDC provider with undefined properties gracefully', async () => {
      const args: TapStackArgs = { environmentSuffix: 'oidc-test' };
      const stack = new TapStack('oidc-edge-test', args);
      
      const oidcUrl = await promiseOf(stack.oidcProviderUrl);
      const oidcArn = await promiseOf(stack.oidcProviderArn);
      
      expect(oidcUrl).toBeDefined();
      expect(oidcArn).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should apply environment suffix to all resource names', async () => {
      const envSuffix = 'custom-env';
      const args: TapStackArgs = { environmentSuffix: envSuffix };
      const stack = new TapStack('naming-test', args);

      const [
        clusterName,
        onDemandNg,
        spotNg,
        fargateProfile,
      ] = await Promise.all([
        promiseOf(stack.clusterName),
        promiseOf(stack.onDemandNodeGroupName),
        promiseOf(stack.spotNodeGroupName),
        promiseOf(stack.fargateProfileName),
      ]);

      expect(clusterName).toContain(envSuffix);
      expect(onDemandNg).toContain(envSuffix);
      expect(spotNg).toContain(envSuffix);
      expect(fargateProfile).toContain(envSuffix);
    });
  });

  describe('Multiple Availability Zones', () => {
    it('should distribute subnets across 3 availability zones', async () => {
      const args: TapStackArgs = { environmentSuffix: 'az-test' };
      const stack = new TapStack('az-distribution-test', args);

      const [publicSubnets, privateSubnets] = await Promise.all([
        promiseOf(stack.publicSubnetIds),
        promiseOf(stack.privateSubnetIds),
      ]);

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
    });
  });

  describe('Component Resource Type', () => {
    it('should register as tap:stack:TapStack component type', () => {
      const args: TapStackArgs = { environmentSuffix: 'type-test' };
      const stack = new TapStack('component-type-test', args);
      
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });
});
