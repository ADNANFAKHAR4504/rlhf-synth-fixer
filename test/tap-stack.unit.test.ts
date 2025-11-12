import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect, describe, test, beforeEach } from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${id}`,
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    publicSubnets: [0, 1, 2].slice(0, config.azCount).map(i => ({
      id: `public-subnet-${i}`,
      cidrBlock: `10.0.${i}.0/24`,
      availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`
    })),
    privateSubnets: [0, 1, 2].slice(0, config.azCount).map(i => ({
      id: `private-subnet-${i}`,
      cidrBlock: `10.0.${i + 10}.0/24`,
      availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`
    })),
    natGateways: [0, 1, 2].slice(0, config.azCount).map(i => ({
      id: `nat-gateway-${i}`,
      allocationId: `eip-nat-${i}`,
      subnetId: `public-subnet-${i}`
    })),
    internetGateway: {
      id: 'igw-main',
      vpcId: `vpc-${id}`
    }
  })),

  IamModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    eksClusterRole: {
      id: `${config.clusterName}-cluster-role`,
      name: `${config.clusterName}-cluster-role`,
      arn: `arn:aws:iam::123456789012:role/${config.clusterName}-cluster-role`
    },
    eksNodeRole: {
      id: `${config.clusterName}-node-role`,
      name: `${config.clusterName}-node-role`,
      arn: `arn:aws:iam::123456789012:role/${config.clusterName}-node-role`
    },
    oidcProvider: {
      id: 'oidc-provider',
      arn: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
      url: 'https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E'
    },
    setupOidcProvider: jest.fn()
  })),

  IrsaRoleModule: jest.fn().mockImplementation((scope: any, id: string, name: string, namespace: string, serviceAccount: string, oidcProviderArn: string, oidcProviderUrl: string, policyDocument: string, tags: any) => ({
    role: {
      id: `${name}-role`,
      name: name,
      arn: `arn:aws:iam::123456789012:role/${name}`
    }
  })),

  WorkloadRoleModule: jest.fn().mockImplementation((scope: any, id: string, name: string, namespace: string, oidcProviderArn: string, oidcProviderUrl: string, policies: any, tags: any) => ({
    role: {
      id: `${name}-role`,
      name: name,
      arn: `arn:aws:iam::123456789012:role/${name}`
    }
  })),

  VpcConfig: {},
  EksConfig: {},
  NodeGroupConfig: {}
}));

// Mock AWS provider modules
jest.mock("@cdktf/provider-aws/lib/eks-cluster", () => ({
  EksCluster: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `eks-${config.name}`,
    name: config.name,
    arn: `arn:aws:eks:us-east-1:123456789012:cluster/${config.name}`,
    endpoint: `https://${config.name}.eks.amazonaws.com`,
    certificateAuthority: {
      get: jest.fn().mockReturnValue({
        data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...'
      })
    },
    identity: {
      get: jest.fn().mockReturnValue({
        oidc: {
          get: jest.fn().mockReturnValue({
            issuer: 'https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E'
          })
        }
      })
    },
    tags: config.tags,
    version: config.version
  }))
}));

jest.mock("@cdktf/provider-aws/lib/eks-node-group", () => ({
  EksNodeGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `node-group-${config.nodeGroupName}`,
    nodeGroupName: config.nodeGroupName,
    clusterName: config.clusterName,
    status: 'ACTIVE',
    resources: {
      autoScalingGroups: [{
        name: `eks-node-group-${config.nodeGroupName}`
      }]
    }
  }))
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string, config?: any) => ({
    accountId: '123456789012',
    arn: 'arn:aws:iam::123456789012:root',
    userId: 'AIDACKCEVSQ6C2EXAMPLE'
  }))
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    TerraformStack: actual.TerraformStack,
    Fn: actual.Fn
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: {}
}));

// Mock TLS Provider
jest.mock("@cdktf/provider-tls/lib/provider", () => ({
  TlsProvider: jest.fn()
}));

// Mock the addOverride method
const mockAddOverride = jest.fn();
TapStack.prototype.addOverride = mockAddOverride;

describe("TapStack Unit Tests", () => {
  const { 
    NetworkModule,
    IamModule,
    IrsaRoleModule,
    WorkloadRoleModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { TlsProvider } = require("@cdktf/provider-tls/lib/provider");
  const { EksCluster } = require("@cdktf/provider-aws/lib/eks-cluster");
  const { EksNodeGroup } = require("@cdktf/provider-aws/lib/eks-node-group");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: undefined
        })
      );

      expect(TlsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'tls',
        {}
      );
    });

    test("should create TapStack with custom aws region from props", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
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

    test("should apply custom default tags when provided", () => {
      const app = new App();
      const customTags = [{
        tags: {
          Team: 'DevOps',
          CostCenter: 'Engineering'
        }
      }];

      new TapStack(app, "TestStack", {
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

    test("should get current AWS account identity", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'current',
        {}
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );
    });

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'my-custom-bucket',
        stateBucketRegion: 'ap-south-1',
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'ap-south-1',
          encrypt: true
        })
      );
    });
  });

  describe("Network Module Tests", () => {
    test("should create NetworkModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          azCount: 3,
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'terraform-cdktf',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should create VPC with correct resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      expect(networkModule.vpc).toBeDefined();
      expect(networkModule.vpc.id).toBe('vpc-network');
      expect(networkModule.publicSubnets).toHaveLength(3);
      expect(networkModule.privateSubnets).toHaveLength(3);
      expect(networkModule.natGateways).toHaveLength(3);
    });

    test("should pass correct environment to Network module", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging'
          })
        })
      );
    });
  });

  describe("IAM Module Tests", () => {
    test("should create IamModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          clusterName: 'dev-eks-cluster',
          kubernetesVersion: '1.28',
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'terraform-cdktf',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should use environment suffix in cluster name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          clusterName: 'prod-eks-cluster'
        })
      );
    });

    test("should create IAM roles for EKS", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      expect(iamModule.eksClusterRole).toBeDefined();
      expect(iamModule.eksClusterRole.name).toBe('dev-eks-cluster-cluster-role');
      
      expect(iamModule.eksNodeRole).toBeDefined();
      expect(iamModule.eksNodeRole.name).toBe('dev-eks-cluster-node-role');
    });
  });

  describe("EKS Cluster Tests", () => {
    test("should create EksCluster with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      const iamModule = IamModule.mock.results[0].value;

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'dev-eks-cluster',
          version: '1.28',
          roleArn: iamModule.eksClusterRole.arn,
          vpcConfig: expect.objectContaining({
            subnetIds: ['private-subnet-0', 'private-subnet-1', 'private-subnet-2'],
            endpointPrivateAccess: true,
            endpointPublicAccess: true,
            publicAccessCidrs: ['0.0.0.0/0']
          }),
          enabledClusterLogTypes: [
            'api',
            'audit',
            'authenticator',
            'controllerManager',
            'scheduler'
          ],
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'terraform-cdktf',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should use private subnets for EKS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCall = EksCluster.mock.calls[0];
      const subnetIds = eksCall[2].vpcConfig.subnetIds;
      
      expect(subnetIds).toEqual(['private-subnet-0', 'private-subnet-1', 'private-subnet-2']);
    });

    test("should setup OIDC provider after cluster creation", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      const eksCluster = EksCluster.mock.results[0].value;
      
      expect(iamModule.setupOidcProvider).toHaveBeenCalledWith(eksCluster);
    });
  });

  describe("Node Group Tests", () => {
    test("should create EksNodeGroup with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      const eksCluster = EksCluster.mock.results[0].value;
      const networkModule = NetworkModule.mock.results[0].value;

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'node-group-general',
        expect.objectContaining({
          clusterName: eksCluster.name,
          nodeGroupName: 'dev-general',
          nodeRoleArn: iamModule.eksNodeRole.arn,
          subnetIds: ['private-subnet-0', 'private-subnet-1', 'private-subnet-2'],
          scalingConfig: {
            minSize: 2,
            maxSize: 10,
            desiredSize: 3
          },
          instanceTypes: ['t3.medium'],
          diskSize: 20,
          labels: {
            role: 'general'
          },
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'terraform-cdktf',
            Stack: 'TestStack'
          }),
          dependsOn: [eksCluster]
        })
      );
    });

    test("should use environment suffix in node group name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].nodeGroupName).toBe('prod-general');
    });

    test("should use private subnets for node groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].subnetIds).toEqual([
        'private-subnet-0',
        'private-subnet-1',
        'private-subnet-2'
      ]);
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('eks-cluster-name');
      expect(outputIds).toContain('eks-cluster-endpoint');
      expect(outputIds).toContain('eks-cluster-certificate-authority-data');
      expect(outputIds).toContain('eks-oidc-provider-arn');
      expect(outputIds).toContain('eks-oidc-provider-url');
      expect(outputIds).toContain('node-group-id');
      expect(outputIds).toContain('aws-account-id');
    });

    test("should create VPC outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      expect(vpcOutput[2].value).toBe(networkModule.vpc.id);
      expect(vpcOutput[2].description).toBe('VPC ID');

      const publicSubnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      expect(publicSubnetOutput[2].value).toEqual(['public-subnet-0', 'public-subnet-1', 'public-subnet-2']);
      
      const privateSubnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );
      expect(privateSubnetOutput[2].value).toEqual(['private-subnet-0', 'private-subnet-1', 'private-subnet-2']);
    });

    test("should create EKS outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCluster = EksCluster.mock.results[0].value;
      
      const nameOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-name'
      );
      expect(nameOutput[2].value).toBe(eksCluster.name);
      
      const endpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-endpoint'
      );
      expect(endpointOutput[2].value).toBe(eksCluster.endpoint);

      const certOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-certificate-authority-data'
      );
    });

    test("should create OIDC outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      const eksCluster = EksCluster.mock.results[0].value;
      
      const oidcArnOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-oidc-provider-arn'
      );
      expect(oidcArnOutput[2].value).toBe(iamModule.oidcProvider.arn);
      
      const oidcUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-oidc-provider-url'
      );
      expect(oidcUrlOutput[2].value).toBe('https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E');
    });

    test("should create account ID output", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const current = DataAwsCallerIdentity.mock.results[0].value;
      const accountOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );
      
      expect(accountOutput[2].value).toBe(current.accountId);
      expect(accountOutput[2].description).toBe('Current AWS Account ID');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC subnets to EKS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      const eksCall = EksCluster.mock.calls[0];
      
      expect(eksCall[2].vpcConfig.subnetIds).toEqual(
        networkModule.privateSubnets.map((s: any) => s.id)
      );
    });

    test("should pass IAM roles to EKS resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      const eksCall = EksCluster.mock.calls[0];
      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      
      expect(eksCall[2].roleArn).toBe(iamModule.eksClusterRole.arn);
      expect(nodeGroupCall[2].nodeRoleArn).toBe(iamModule.eksNodeRole.arn);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const networkCallOrder = NetworkModule.mock.invocationCallOrder[0];
      const iamCallOrder = IamModule.mock.invocationCallOrder[0];
      const eksCallOrder = EksCluster.mock.invocationCallOrder[0];
      const nodeGroupCallOrder = EksNodeGroup.mock.invocationCallOrder[0];
      
      // Network should be created first
      expect(networkCallOrder).toBeLessThan(eksCallOrder);
      
      // IAM should be created before EKS
      expect(iamCallOrder).toBeLessThan(eksCallOrder);
      
      // EKS cluster should be created before node groups
      expect(eksCallOrder).toBeLessThan(nodeGroupCallOrder);
    });

    test("should set node group dependency on cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCluster = EksCluster.mock.results[0].value;
      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      
      expect(nodeGroupCall[2].dependsOn).toContain(eksCluster);
    });
  });

  describe("Environment Configuration", () => {
    test("should use dev as default environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'dev-eks-cluster'
        })
      );

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'node-group-general',
        expect.objectContaining({
          nodeGroupName: 'dev-general'
        })
      );
    });

    test("should use provided environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'staging/TestStack.tfstate'
        })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          clusterName: 'staging-eks-cluster'
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'staging-eks-cluster'
        })
      );
    });

    test("should handle production environment settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      // Check production-specific settings
      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          clusterName: 'prod-eks-cluster',
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'prod-eks-cluster',
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        })
      );

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'node-group-general',
        expect.objectContaining({
          nodeGroupName: 'prod-general',
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      
      // Should use default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          azCount: 3,
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

      // Should use 'dev' as fallback
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });
  });

  describe("Region-specific Configuration", () => {
    test("should configure resources for different regions", () => {
      const regions = ['us-west-2', 'eu-central-1', 'ap-northeast-1'];
      
      regions.forEach(region => {
        jest.clearAllMocks();
        const app = new App();
        
        new TapStack(app, "TestStack", {
          awsRegion: region
        });

        expect(AwsProvider).toHaveBeenCalledWith(
          expect.anything(),
          'aws',
          expect.objectContaining({
            region: region
          })
        );
      });
    });

    test("should handle state bucket in different region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1',
        stateBucketRegion: 'us-east-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-east-1'
        })
      );
    });
  });

  describe("Stack ID and Naming", () => {
    test("should use stack ID in resource naming and tags", () => {
      const app = new App();
      new TapStack(app, "MyCustomStack", {
        environmentSuffix: 'dev'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/MyCustomStack.tfstate'
        })
      );

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          tags: expect.objectContaining({
            Stack: 'MyCustomStack'
          })
        })
      );
    });
  });

  describe("Common Tags", () => {
    test("should apply common tags to all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'qa'
      });

      const expectedTags = {
        Environment: 'qa',
        ManagedBy: 'terraform-cdktf',
        Stack: 'TestStack'
      };

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(EksNodeGroup).toHaveBeenCalledWith(
        expect.anything(),
        'node-group-general',
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });
  });

  describe("Node Group Configuration", () => {
    test("should configure node group with correct instance types", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].instanceTypes).toEqual(['t3.medium']);
    });

    test("should configure node group with correct scaling settings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].scalingConfig).toEqual({
        minSize: 2,
        maxSize: 10,
        desiredSize: 3
      });
    });

    test("should configure node group with labels", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].labels).toEqual({
        role: 'general'
      });
    });

    test("should configure node group with disk size", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].diskSize).toBe(20);
    });
  });

  describe("EKS Cluster Logging", () => {
    test("should enable all cluster log types", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCall = EksCluster.mock.calls[0];
      expect(eksCall[2].enabledClusterLogTypes).toEqual([
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler'
      ]);
    });
  });

  describe("EKS Cluster Networking", () => {
    test("should configure cluster endpoints correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCall = EksCluster.mock.calls[0];
      expect(eksCall[2].vpcConfig.endpointPrivateAccess).toBe(true);
      expect(eksCall[2].vpcConfig.endpointPublicAccess).toBe(true);
      expect(eksCall[2].vpcConfig.publicAccessCidrs).toEqual(['0.0.0.0/0']);
    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(EksCluster).toHaveBeenCalledTimes(1);
      expect(EksNodeGroup).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(TlsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
    });

    test("should create resources with consistent naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'test'
      });

      const eksCall = EksCluster.mock.calls[0];
      expect(eksCall[2].name).toBe('test-eks-cluster');

      const nodeGroupCall = EksNodeGroup.mock.calls[0];
      expect(nodeGroupCall[2].nodeGroupName).toBe('test-general');

      const iamCall = IamModule.mock.calls[0];
      expect(iamCall[2].clusterName).toBe('test-eks-cluster');
    });
  });
});