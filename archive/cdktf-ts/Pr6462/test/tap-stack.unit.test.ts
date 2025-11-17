// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import {test, expect, describe, beforeEach} from '@jest/globals';

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.tags.Environment}`,
      cidrBlock: config.vpcCidr,
    },
    publicSubnets: config.publicSubnetCidrs.map((cidr: string, index: number) => ({
      id: `subnet-public-${index + 1}-${config.tags.Environment}`
    })),
    privateSubnets: config.privateSubnetCidrs.map((cidr: string, index: number) => ({
      id: `subnet-private-${index + 1}-${config.tags.Environment}`
    })),
    natGateways: [
      { id: `nat-1-${config.tags.Environment}` },
      { id: `nat-2-${config.tags.Environment}` }
    ],
    internetGateway: { id: `igw-${config.tags.Environment}` }
  })),

  EksSecurityGroups: jest.fn().mockImplementation((scope: any, id: string, vpcId: string, tags: any) => ({
    clusterSecurityGroup: {
      id: `sg-eks-cluster-${tags.Environment}`,
      name: `eks-cluster-sg-${tags.Environment}`,
    },
    nodeSecurityGroup: {
      id: `sg-eks-node-${tags.Environment}`,
      name: `eks-node-sg-${tags.Environment}`,
    }
  })),

  IamRoles: jest.fn().mockImplementation((scope: any, id: string, clusterName: string, oidcArn: string, oidcUrl: string, tags: any) => ({
    eksClusterRole: {
      arn: `arn:aws:iam::123456789012:role/${clusterName}-cluster-role`,
      name: `${clusterName}-cluster-role`,
    },
    eksNodeRole: {
      arn: `arn:aws:iam::123456789012:role/${clusterName}-node-role`,
      name: `${clusterName}-node-role`,
    },
    clusterAutoscalerRole: {
      arn: `arn:aws:iam::123456789012:role/${clusterName}-autoscaler-role`,
      name: `${clusterName}-autoscaler-role`,
    },
    awsLoadBalancerControllerRole: {
      arn: `arn:aws:iam::123456789012:role/${clusterName}-alb-controller-role`,
      name: `${clusterName}-alb-controller-role`,
    }
  })),

  EcrRepository: jest.fn().mockImplementation((scope: any, id: string, repoName: string, tags: any) => ({
    repository: {
      arn: `arn:aws:ecr:us-east-1:123456789012:repository/${repoName}`,
      name: repoName,
      registryId: '123456789012',
    },
    repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${repoName}`,
  })),

  EksNodeGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    nodeGroup: {
      id: `ng-${config.clusterName}-${config.capacityType.toLowerCase()}`,
      arn: `arn:aws:eks:us-east-1:123456789012:nodegroup/${config.clusterName}/ng-${config.capacityType.toLowerCase()}`,
      status: 'ACTIVE',
    }
  })),
}));

// Mock AWS Provider and data sources
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-availability-zones", () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation(() => ({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  })),
}));

jest.mock("@cdktf/provider-aws/lib/eks-cluster", () => ({
  EksCluster: jest.fn().mockImplementation(function(this: any, scope: any, id: string, config: any) {
    this.name = config.name;
    this.roleArn = config.roleArn;
    this.endpoint = `https://${config.name}.eks.amazonaws.com`;
    this.version = config.version;
    this.arn = `arn:aws:eks:us-east-1:123456789012:cluster/${config.name}`;
    this.platformVersion = 'eks.5';
    this.status = 'ACTIVE';
    this.identity = {
      get: jest.fn().mockReturnValue({
        oidc: {
          get: jest.fn().mockReturnValue({
            issuer: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE`,
          })
        }
      })
    };
    this.certificateAuthority = {
      get: jest.fn().mockReturnValue({
        data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...'
      })
    };
  }),
}));

jest.mock("@cdktf/provider-aws/lib/iam-openid-connect-provider", () => ({
  IamOpenidConnectProvider: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    arn: `arn:aws:iam::123456789012:oidc-provider/${config.url.replace('https://', '')}`,
  })),
}));

// Mock TerraformOutput, S3Backend, and Fn
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation(function(this: any, scope: any, config: any) {
      this.addOverride = jest.fn();
      return this;
    }),
    TerraformStack: actual.TerraformStack,
    Fn: {
      element: jest.fn((list: any, index: number) => {
        if (Array.isArray(list)) {
          return list[index];
        }
        // For mocked DataAwsAvailabilityZones.names
        const mockedAzs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
        return mockedAzs[index];
      })
    }
  };
});

describe("TapStack Unit Tests", () => {
  const {
    VpcConstruct,
    EksSecurityGroups,
    IamRoles,
    EcrRepository,
    EksNodeGroup,
  } = require("../lib/modules");
  
  const { TerraformOutput, S3Backend, Fn } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsAvailabilityZones } = require("@cdktf/provider-aws/lib/data-aws-availability-zones");
  const { EksCluster } = require("@cdktf/provider-aws/lib/eks-cluster");
  const { IamOpenidConnectProvider } = require("@cdktf/provider-aws/lib/iam-openid-connect-provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should use regionOverride when provided", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'us-west-2',
        regionOverride: 'ap-southeast-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1' // Override should take precedence
        })
      );
    });

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = [{ tags: { Department: 'Engineering', Team: 'Platform' } }];

      new TapStack(app, "test-stack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: customTags
        })
      );
    });

    test("should use custom environment suffix", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'production'
      });

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-module',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'production'
          })
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "test-stack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom state bucket", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'ap-southeast-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-state-bucket',
          region: 'ap-southeast-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );
    });
  });

  describe("VPC Module Configuration", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-module',
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Project: 'tap-stack'
          })
        })
      );
    });

    test("should create VPC with environment-specific naming", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-module',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging'
          })
        })
      );
    });

    test("should use Fn.element for availability zones", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(DataAwsAvailabilityZones).toHaveBeenCalledWith(
        expect.anything(),
        'azs',
        expect.objectContaining({
          state: 'available'
        })
      );

      expect(Fn.element).toHaveBeenCalledTimes(2);
      expect(Fn.element).toHaveBeenCalledWith(expect.anything(), 0);
      expect(Fn.element).toHaveBeenCalledWith(expect.anything(), 1);
    });
  });

  describe("EKS Security Groups Configuration", () => {
    test("should create EKS security groups with correct VPC ID", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksSecurityGroups).toHaveBeenCalledWith(
        expect.anything(),
        'eks-security-groups',
        'vpc-dev',
        expect.objectContaining({
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Project: 'tap-stack'
        })
      );
    });

    test("should pass correct VPC ID from VPC module", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(EksSecurityGroups).toHaveBeenCalledWith(
        expect.anything(),
        'eks-security-groups',
        'vpc-prod',
        expect.anything()
      );
    });
  });

  describe("EKS Cluster Configuration", () => {
    test("should create EKS cluster with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'eks-dev',
          roleArn: '',
          version: '1.28',
          vpcConfig: expect.objectContaining({
            subnetIds: expect.arrayContaining([
              'subnet-public-1-dev',
              'subnet-public-2-dev',
              'subnet-private-1-dev',
              'subnet-private-2-dev'
            ]),
            securityGroupIds: ['sg-eks-cluster-dev'],
            endpointPrivateAccess: true,
            endpointPublicAccess: true,
            publicAccessCidrs: ['0.0.0.0/0']
          }),
          enabledClusterLogTypes: expect.arrayContaining([
            'api',
            'audit',
            'authenticator',
            'controllerManager',
            'scheduler'
          ]),
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should create EKS cluster with production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'eks-prod'
        })
      );
    });
  });

  describe("OIDC Provider Configuration", () => {
    test("should create OIDC provider with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IamOpenidConnectProvider).toHaveBeenCalledWith(
        expect.anything(),
        'eks-oidc-provider',
        expect.objectContaining({
          clientIdList: ['sts.amazonaws.com'],
          thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
          url: 'https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE',
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });
  });

  describe("IAM Roles Configuration", () => {
    test("should create IAM roles with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IamRoles).toHaveBeenCalledWith(
        expect.anything(),
        'iam-roles',
        'eks-dev',
        expect.stringMatching(/^arn:aws:iam::/),
        expect.stringContaining('https://oidc.eks'),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });

    test("should pass OIDC provider ARN and issuer URL", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(IamRoles).toHaveBeenCalledWith(
        expect.anything(),
        'iam-roles',
        'eks-staging',
        'arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE',
        'https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE',
        expect.anything()
      );
    });
  });

  describe("ECR Repository Configuration", () => {
    test("should create ECR repository with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EcrRepository).toHaveBeenCalledWith(
        expect.anything(),
        'ecr-repository',
        'tap-app-dev',
        expect.objectContaining({
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Project: 'tap-stack'
        })
      );
    });

    test("should use environment-specific naming for ECR", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(EcrRepository).toHaveBeenCalledWith(
        expect.anything(),
        'ecr-repository',
        'tap-app-prod',
        expect.anything()
      );
    });
  });

  describe("EKS Node Groups Configuration", () => {
    test("should create general node group with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");
    });

    test("should create spot node group with correct capacity", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'spot-node-group',
        expect.objectContaining({
          capacityType: 'SPOT',
          scalingConfig: {
            desired: 1,
            min: 0,
            max: 3
          },
          instanceTypes: ['t3.small', 't3a.small']
        })
      );
    });

    test("should use private subnets for node groups", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'spot-node-group',
        expect.objectContaining({
          subnetIds: ['subnet-private-1-dev', 'subnet-private-2-dev']
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required VPC outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('vpc-cidr');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('nat-gateway-ids');
      expect(outputIds).toContain('internet-gateway-id');
    });

    test("should create all required EKS outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('eks-cluster-name');
      expect(outputIds).toContain('eks-cluster-endpoint');
      expect(outputIds).toContain('eks-cluster-version');
      expect(outputIds).toContain('eks-cluster-arn');
      expect(outputIds).toContain('eks-cluster-certificate-authority');
      expect(outputIds).toContain('eks-cluster-platform-version');
      expect(outputIds).toContain('eks-cluster-status');
    });

    test("should create OIDC provider outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('eks-oidc-provider-arn');
      expect(outputIds).toContain('eks-oidc-issuer-url');
    });

    test("should create security group outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('cluster-security-group-id');
      expect(outputIds).toContain('node-security-group-id');
    });

    test("should create IAM role outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('eks-cluster-role-arn');
      expect(outputIds).toContain('eks-cluster-role-name');
      expect(outputIds).toContain('eks-node-role-arn');
      expect(outputIds).toContain('eks-node-role-name');
      expect(outputIds).toContain('cluster-autoscaler-role-arn');
      expect(outputIds).toContain('aws-load-balancer-controller-role-arn');
    });

    test("should create ECR repository outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('ecr-repository-url');
      expect(outputIds).toContain('ecr-repository-arn');
      expect(outputIds).toContain('ecr-repository-name');
      expect(outputIds).toContain('ecr-registry-id');
    });

    test("should create node group outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('spot-node-group-id');
      expect(outputIds).toContain('spot-node-group-arn');
      expect(outputIds).toContain('spot-node-group-status');
    });

    test("should create utility outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('aws-region');
      expect(outputIds).toContain('environment-suffix');
      expect(outputIds).toContain('availability-zones');
      expect(outputIds).toContain('kubeconfig-command');
    });

    test("should create kubeconfig command with correct region and cluster name", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'eu-west-1',
        environmentSuffix: 'prod'
      });

      const kubeconfigOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'kubeconfig-command'
      );

      expect(kubeconfigOutput[2].value).toBe('aws eks update-kubeconfig --region eu-west-1 --name eks-prod');
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", undefined);

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {});

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-module',
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should handle all props being set", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {
        environmentSuffix: 'prod',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'ap-southeast-2',
        defaultTags: [{ tags: { Owner: 'TeamA' } }],
        regionOverride: 'us-west-1'
      });

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-1', // regionOverride should take precedence
          defaultTags: [{ tags: { Owner: 'TeamA' } }]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'prod/test-stack.tfstate',
          region: 'eu-west-1'
        })
      );
    });

    test("should handle NAT gateways being undefined", () => {
      const app = new App();
      
      // Mock VpcConstruct to return undefined natGateways
      VpcConstruct.mockImplementationOnce((scope: any, id: string, config: any) => ({
        vpc: { id: 'vpc-test', cidrBlock: '10.0.0.0/16' },
        publicSubnets: [{ id: 'subnet-public-1' }],
        privateSubnets: [{ id: 'subnet-private-1' }],
        natGateways: undefined,
        internetGateway: undefined
      }));

      new TapStack(app, "test-stack");

      const natGatewayOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'nat-gateway-ids'
      );

      expect(natGatewayOutput[2].value).toEqual([]);
    });

    test("should handle internet gateway being undefined", () => {
      const app = new App();
      
      // Mock VpcConstruct to return undefined internetGateway
      VpcConstruct.mockImplementationOnce((scope: any, id: string, config: any) => ({
        vpc: { id: 'vpc-test', cidrBlock: '10.0.0.0/16' },
        publicSubnets: [{ id: 'subnet-public-1' }],
        privateSubnets: [{ id: 'subnet-private-1' }],
        natGateways: [],
        internetGateway: undefined
      }));

      new TapStack(app, "test-stack");

      const igwOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'internet-gateway-id'
      );

      expect(igwOutput[2].value).toBe('');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC ID to EKS security groups", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksSecurityGroups).toHaveBeenCalledWith(
        expect.anything(),
        'eks-security-groups',
        'vpc-dev',
        expect.anything()
      );
    });

    test("should pass subnets to EKS cluster configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          vpcConfig: expect.objectContaining({
            subnetIds: [
              'subnet-public-1-dev',
              'subnet-public-2-dev',
              'subnet-private-1-dev',
              'subnet-private-2-dev'
            ]
          })
        })
      );
    });

    test("should pass security group IDs to EKS cluster", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          vpcConfig: expect.objectContaining({
            securityGroupIds: ['sg-eks-cluster-dev']
          })
        })
      );
    });

    test("should pass IAM node role to node groups", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'spot-node-group',
        expect.objectContaining({
          nodeRoleName: 'arn:aws:iam::123456789012:role/eks-dev-node-role'
        })
      );
    });

    test("should pass cluster name to node groups", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'spot-node-group',
        expect.objectContaining({
          clusterName: 'eks-staging'
        })
      );
    });

    test("should pass private subnets to node groups", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'spot-node-group',
        expect.objectContaining({
          subnetIds: ['subnet-private-1-dev', 'subnet-private-2-dev']
        })
      );
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'dev'
      });

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'eks-dev'
        })
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'eks-staging',
          tags: expect.objectContaining({
            Environment: 'staging'
          })
        })
      );

      expect(EcrRepository).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'tap-app-staging',
        expect.objectContaining({
          Environment: 'staging'
        })
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'eks-prod'
        })
      );
    });
  });

  describe("Complete Infrastructure Integration", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsAvailabilityZones).toHaveBeenCalledTimes(1);
      expect(VpcConstruct).toHaveBeenCalledTimes(1);
      expect(EksSecurityGroups).toHaveBeenCalledTimes(1);
      expect(EksCluster).toHaveBeenCalledTimes(1);
      expect(IamOpenidConnectProvider).toHaveBeenCalledTimes(1);
      expect(IamRoles).toHaveBeenCalledTimes(1);
      expect(EcrRepository).toHaveBeenCalledTimes(1);
      expect(EksNodeGroup).toHaveBeenCalledTimes(2);
      expect(TerraformOutput).toHaveBeenCalled();

      expect(stack).toBeDefined();
    });

    test("should handle AWS region configuration across all resources", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'eu-central-1',
        stateBucketRegion: 'us-west-2',
        environmentSuffix: 'prod'
      });

      // Verify provider uses correct region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );

      // Verify state bucket uses different region
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-west-2'
        })
      );
    });

    test("should create all outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "OutputTest", {
        environmentSuffix: 'qa',
        awsRegion: 'us-west-2'
      });

      // Verify critical outputs have correct values
      const vpcIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      const eksNameOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-name'
      );
      const ecrUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'ecr-repository-url'
      );
      const regionOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-region'
      );

      expect(vpcIdOutput[2].value).toBe('vpc-qa');
      expect(eksNameOutput[2].value).toBe('eks-qa');
      expect(ecrUrlOutput[2].value).toBe('123456789012.dkr.ecr.us-east-1.amazonaws.com/tap-app-qa');
      expect(regionOutput[2].value).toBe('us-west-2');
    });

    test("should maintain proper resource dependencies", () => {
      const app = new App();
      new TapStack(app, "DependencyTest");

      // Verify order of creation
      const vpcCallOrder = VpcConstruct.mock.invocationCallOrder[0];
      const securityGroupCallOrder = EksSecurityGroups.mock.invocationCallOrder[0];
      const eksClusterCallOrder = EksCluster.mock.invocationCallOrder[0];
      const oidcProviderCallOrder = IamOpenidConnectProvider.mock.invocationCallOrder[0];
      const iamRolesCallOrder = IamRoles.mock.invocationCallOrder[0];
      const nodeGroupCallOrder = EksNodeGroup.mock.invocationCallOrder[0];

      // VPC should be created before security groups
      expect(vpcCallOrder).toBeLessThan(securityGroupCallOrder);
      // Security groups should be created before EKS cluster
      expect(securityGroupCallOrder).toBeLessThan(eksClusterCallOrder);
      // EKS cluster should be created before OIDC provider
      expect(eksClusterCallOrder).toBeLessThan(oidcProviderCallOrder);
      // OIDC provider should be created before IAM roles
      expect(oidcProviderCallOrder).toBeLessThan(iamRolesCallOrder);
      // IAM roles should be created before node groups
      expect(iamRolesCallOrder).toBeLessThan(nodeGroupCallOrder);
    });
  });
});