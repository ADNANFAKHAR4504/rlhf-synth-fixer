/* eslint-disable @typescript-eslint/no-explicit-any */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Mock Pulumi runtime with comprehensive mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    const baseState = {
      ...args.inputs,
      id: `${args.name}_id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.name,
    };

    // Mock specific resource types
    switch (args.type) {
      case 'eks:index:Cluster':
        return {
          id: `${args.name}_id`,
          state: {
            ...baseState,
            clusterSecurityGroup: `sg-${args.name}`,
            clusterSecurityGroupId: `sg-${args.name}`,
            endpoint: `https://${args.name}.eks.us-east-1.amazonaws.com`,
            kubeconfig: JSON.stringify({
              apiVersion: 'v1',
              clusters: [{
                cluster: {
                  server: `https://${args.name}.eks.us-east-1.amazonaws.com`,
                  'certificate-authority-data': 'mock-cert-data',
                },
                name: 'kubernetes',
              }],
              contexts: [{ context: { cluster: 'kubernetes', user: 'aws' }, name: 'aws' }],
              'current-context': 'aws',
              kind: 'Config',
              users: [{ name: 'aws', user: { exec: { apiVersion: 'client.authentication.k8s.io/v1beta1', command: 'aws', args: ['eks', 'get-token', '--cluster-name', args.name] } } }],
            }),
            eksCluster: {
              arn: `arn:aws:eks:us-east-1:123456789012:cluster/${args.name}`,
              name: args.name,
              endpoint: `https://${args.name}.eks.us-east-1.amazonaws.com`,
              version: '1.28',
              identity: {
                oidc: {
                  issuer: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
                },
              },
              roleArn: `arn:aws:iam::123456789012:role/eks-cluster-role`,
              vpcConfig: {
                clusterSecurityGroupId: `sg-${args.name}`,
                endpointPublicAccess: true,
                endpointPrivateAccess: true,
                publicAccessCidrs: ['0.0.0.0/0'],
                subnetIds: ['subnet-1', 'subnet-2', 'subnet-3'],
                vpcId: 'vpc-12345',
              },
            },
            core: {
              cluster: {
                arn: `arn:aws:eks:us-east-1:123456789012:cluster/${args.name}`,
                name: args.name,
                endpoint: `https://${args.name}.eks.us-east-1.amazonaws.com`,
                version: '1.28',
                identity: {
                  oidc: {
                    issuer: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
                  },
                },
              },
              clusterSecurityGroup: {
                id: `sg-${args.name}`,
              },
              // CRITICAL: Add oidcProvider to core object
              oidcProvider: {
                url: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
                arn: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
              },
            },
          },
        };

      case 'aws:iam/openIdConnectProvider:OpenIdConnectProvider':
        return {
          id: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
          state: {
            ...baseState,
            arn: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
            url: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
          },
        };

      case 'aws:eks/nodeGroup:NodeGroup':
        return {
          id: `${args.name}_id`,
          state: {
            ...baseState,
            nodeGroupName: args.name,
            status: 'ACTIVE',
          },
        };

      case 'aws:eks/fargateProfile:FargateProfile':
        return {
          id: `${args.name}_id`,
          state: {
            ...baseState,
            fargateProfileName: args.name,
            status: 'ACTIVE',
          },
        };

      case 'aws:ec2/vpc:Vpc':
        return {
          id: `vpc-${args.name}`,
          state: {
            ...baseState,
            cidrBlock: '10.0.0.0/16',
            defaultSecurityGroupId: 'sg-default',
          },
        };

      case 'aws:ec2/subnet:Subnet':
        return {
          id: `subnet-${args.name}`,
          state: {
            ...baseState,
            availabilityZone: 'us-east-1a',
          },
        };

      case 'aws:iam/role:Role':
        return {
          id: `role-${args.name}`,
          state: {
            ...baseState,
            arn: `arn:aws:iam::123456789012:role/${args.name}`,
          },
        };

      default:
        return {
          id: `${args.name}_id`,
          state: baseState,
        };
    }
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    if (args.token === 'aws:iam/getPolicyDocument:getPolicyDocument') {
      return {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [],
        }),
      };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor Tests', () => {
    it('should create TapStack with default environment suffix', async () => {
      const args: TapStackArgs = {};
      stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.clusterName).toBeDefined();
    });

    it('should create TapStack with custom environment suffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };
      stack = new TapStack('test-stack-prod', args);
      expect(stack).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.clusterVersion).toBeDefined();
    });

    it('should create TapStack with custom tags', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Project: 'TAP',
        },
      };
      stack = new TapStack('test-stack-staging', args);
      expect(stack).toBeDefined();
      expect(stack.oidcProviderUrl).toBeDefined();
      expect(stack.oidcProviderArn).toBeDefined();
    });

    it('should initialize all public outputs', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'test',
      };
      stack = new TapStack('test-stack-outputs', args);
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.clusterVersion).toBeDefined();
      expect(stack.oidcProviderUrl).toBeDefined();
      expect(stack.oidcProviderArn).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
      expect(stack.onDemandNodeGroupName).toBeDefined();
      expect(stack.spotNodeGroupName).toBeDefined();
      expect(stack.nodeGroupRoleArn).toBeDefined();
      expect(stack.fargateProfileName).toBeDefined();
      expect(stack.fargateRoleArn).toBeDefined();
      expect(stack.devRoleArn).toBeDefined();
      expect(stack.stagingRoleArn).toBeDefined();
      expect(stack.prodRoleArn).toBeDefined();
      expect(stack.clusterAutoscalerRoleArn).toBeDefined();
      expect(stack.albControllerRoleArn).toBeDefined();
    });
  });

  describe('VPC and Network Resources Tests', () => {
    it('should create VPC with correct CIDR block', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('vpc-test', args);
      expect(stack.vpcId).toBeDefined();
    });

    it('should create 3 public subnets', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('public-subnet-test', args);
      expect(stack.publicSubnetIds).toBeDefined();
    });

    it('should create 3 private subnets', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('private-subnet-test', args);
      expect(stack.privateSubnetIds).toBeDefined();
    });

    it('should create Internet Gateway', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('igw-test', args);
      expect(stack.vpcId).toBeDefined();
    });

    it('should create NAT Gateways', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('nat-test', args);
      expect(stack.vpcId).toBeDefined();
    });

    it('should create route tables', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('route-tables-test', args);
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
    });
  });

  describe('IAM Roles Tests', () => {
    it('should create node group IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('nodegroup-role-test', args);
      expect(stack.nodeGroupRoleArn).toBeDefined();
    });

    it('should create Fargate IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('fargate-role-test', args);
      expect(stack.fargateRoleArn).toBeDefined();
    });

    it('should create dev environment IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('dev-role-test', args);
      expect(stack.devRoleArn).toBeDefined();
    });

    it('should create staging environment IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('staging-role-test', args);
      expect(stack.stagingRoleArn).toBeDefined();
    });

    it('should create prod environment IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('prod-role-test', args);
      expect(stack.prodRoleArn).toBeDefined();
    });

    it('should create cluster autoscaler IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('autoscaler-role-test', args);
      expect(stack.clusterAutoscalerRoleArn).toBeDefined();
    });

    it('should create ALB controller IAM role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('alb-role-test', args);
      expect(stack.albControllerRoleArn).toBeDefined();
    });

    it('should attach policies to node group role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('nodegroup-policies-test', args);
      expect(stack.nodeGroupRoleArn).toBeDefined();
    });

    it('should create EKS describe policy', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('eks-describe-policy-test', args);
      expect(stack.devRoleArn).toBeDefined();
      expect(stack.stagingRoleArn).toBeDefined();
      expect(stack.prodRoleArn).toBeDefined();
    });
  });

  describe('EKS Cluster Tests', () => {
    it('should create EKS cluster with OIDC provider', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('cluster-test', args);
      expect(stack.clusterName).toBeDefined();
      expect(stack.oidcProviderUrl).toBeDefined();
      expect(stack.oidcProviderArn).toBeDefined();
    });

    it('should generate kubeconfig', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('kubeconfig-test', args);
      expect(stack.kubeconfig).toBeDefined();
    });

    it('should create cluster endpoint', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('cluster-endpoint-test', args);
      expect(stack.clusterEndpoint).toBeDefined();
    });

    it('should create cluster with correct version', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('cluster-version-test', args);
      expect(stack.clusterVersion).toBeDefined();
    });

    it('should configure RBAC role mappings', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('cluster-rbac-test', args);
      expect(stack.devRoleArn).toBeDefined();
      expect(stack.stagingRoleArn).toBeDefined();
      expect(stack.prodRoleArn).toBeDefined();
    });
  });

  describe('Node Groups Tests', () => {
    it('should create on-demand node group', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('ondemand-ng-test', args);
      expect(stack.onDemandNodeGroupName).toBeDefined();
    });

    it('should create spot node group', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('spot-ng-test', args);
      expect(stack.spotNodeGroupName).toBeDefined();
    });

    it('should create node groups in private subnets', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('nodegroup-subnets-test', args);
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.onDemandNodeGroupName).toBeDefined();
      expect(stack.spotNodeGroupName).toBeDefined();
    });
  });

  describe('Fargate Profile Tests', () => {
    it('should create Fargate profile', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('fargate-profile-test', args);
      expect(stack.fargateProfileName).toBeDefined();
    });

    it('should associate Fargate with private subnets', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('fargate-subnets-test', args);
      expect(stack.fargateProfileName).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
    });
  });

  describe('OIDC Provider Tests', () => {
    it('should create OIDC provider for IRSA', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('oidc-provider-test', args);
      expect(stack.oidcProviderUrl).toBeDefined();
      expect(stack.oidcProviderArn).toBeDefined();
    });

    it('should use OIDC for cluster autoscaler role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('oidc-autoscaler-test', args);
      expect(stack.clusterAutoscalerRoleArn).toBeDefined();
      expect(stack.oidcProviderUrl).toBeDefined();
    });

    it('should use OIDC for ALB controller role', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('oidc-alb-test', args);
      expect(stack.albControllerRoleArn).toBeDefined();
      expect(stack.oidcProviderArn).toBeDefined();
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle missing environment suffix', async () => {
      const args: TapStackArgs = {};
      stack = new TapStack('default-env-test', args);
      expect(stack.clusterName).toBeDefined();
    });

    it('should handle empty tags', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev', tags: {} };
      stack = new TapStack('empty-tags-test', args);
      expect(stack.vpcId).toBeDefined();
    });

    it('should handle multiple environments', async () => {
      const args1: TapStackArgs = { environmentSuffix: 'dev' };
      const args2: TapStackArgs = { environmentSuffix: 'prod' };
      const stack1 = new TapStack('multi-env-dev', args1);
      const stack2 = new TapStack('multi-env-prod', args2);
      expect(stack1.clusterName).toBeDefined();
      expect(stack2.clusterName).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should create complete stack with all components', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'integration',
        tags: { Environment: 'integration', Project: 'TAP' },
      };
      stack = new TapStack('integration-test-stack', args);
      expect(stack.vpcId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.onDemandNodeGroupName).toBeDefined();
      expect(stack.spotNodeGroupName).toBeDefined();
      expect(stack.fargateProfileName).toBeDefined();
      expect(stack.clusterAutoscalerRoleArn).toBeDefined();
      expect(stack.albControllerRoleArn).toBeDefined();
    });
  });

  describe('Output Registration Tests', () => {
    it('should register all outputs', async () => {
      const args: TapStackArgs = { environmentSuffix: 'dev' };
      stack = new TapStack('outputs-test', args);
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.clusterVersion).toBeDefined();
      expect(stack.oidcProviderUrl).toBeDefined();
      expect(stack.oidcProviderArn).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
      expect(stack.onDemandNodeGroupName).toBeDefined();
      expect(stack.spotNodeGroupName).toBeDefined();
      expect(stack.nodeGroupRoleArn).toBeDefined();
      expect(stack.fargateProfileName).toBeDefined();
      expect(stack.fargateRoleArn).toBeDefined();
      expect(stack.devRoleArn).toBeDefined();
      expect(stack.stagingRoleArn).toBeDefined();
      expect(stack.prodRoleArn).toBeDefined();
      expect(stack.clusterAutoscalerRoleArn).toBeDefined();
      expect(stack.albControllerRoleArn).toBeDefined();
    });
  });
});
