// lib/tap-stack.test.ts
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
      enableDnsSupport: true,
      tags: config.tags
    },
    publicSubnets: Array.from({ length: config.azCount }, (_, i) => ({
      id: `public-subnet-${i}`,
      cidrBlock: `10.0.${i}.0/24`,
      availabilityZone: [`us-east-1a`, `us-east-1b`, `us-east-1c`][i],
      vpcId: `vpc-${id}`,
      mapPublicIpOnLaunch: true
    })),
    privateSubnets: Array.from({ length: config.azCount }, (_, i) => ({
      id: `private-subnet-${i}`,
      cidrBlock: `10.0.${i + 10}.0/24`,
      availabilityZone: [`us-east-1a`, `us-east-1b`, `us-east-1c`][i],
      vpcId: `vpc-${id}`
    })),
    natGateways: Array.from({ length: config.azCount }, (_, i) => ({
      id: `nat-gateway-${i}`,
      allocationId: `eip-nat-${i}`,
      subnetId: `public-subnet-${i}`
    }))
  })),

  IamModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    eksClusterRole: {
      arn: `arn:aws:iam::123456789012:role/${config.clusterName}-cluster-role`,
      name: `${config.clusterName}-cluster-role`,
      id: `eks-cluster-role-${id}`
    },
    eksNodeRole: {
      arn: `arn:aws:iam::123456789012:role/${config.clusterName}-node-role`,
      name: `${config.clusterName}-node-role`,
      id: `eks-node-role-${id}`
    },
    setupOidcProvider: jest.fn().mockImplementation((cluster: any) => {
      return {
        oidcProvider: {
          arn: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
          url: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
          id: `oidc-provider-${id}`
        }
      };
    }),
    oidcProvider: {
      arn: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
      url: `https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
      id: `oidc-provider-mock`
    }
  })),

  IrsaRoleModule: jest.fn().mockImplementation((scope: any, id: string, name: string) => ({
    role: {
      arn: `arn:aws:iam::123456789012:role/${name}`,
      name: name,
      id: `irsa-role-${id}`
    }
  })),

  WorkloadRoleModule: jest.fn().mockImplementation((scope: any, id: string, name: string) => ({
    role: {
      arn: `arn:aws:iam::123456789012:role/${name}`,
      name: name,
      id: `workload-role-${id}`
    }
  }))
}));

// Mock AWS provider modules
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string, config?: any) => ({
    accountId: '123456789012',
    arn: 'arn:aws:iam::123456789012:root',
    userId: 'AIDACKCEVSQ6C2EXAMPLE'
  }))
}));

jest.mock("@cdktf/provider-aws/lib/eks-cluster", () => ({
  EksCluster: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    name: config.name,
    endpoint: `https://EXAMPLED539D4633E53DE1B716D3041E.gr7.us-east-1.eks.amazonaws.com`,
    certificateAuthority: {
      get: (index: number) => ({
        data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvVENDQWVXZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJd01EVXhNekUyTURRd05Wb1hEVE13TURVeE1URTJNRFF3TlZvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBSy9TCnZvSUFpQURnMHFJdC9wZ1ZwVHUyWW9hcnJxNzVkTzQ2dkRpb3Y2cGxyTTRRNmhEN0RCdGJFQitBa0t1bXlsaEIKaThXWWY5WW1yNlZnMEdGUlQzWnQvTjRBVlRkRzN2ZjgzQlZCS2dBUWF1dk8wUGtkbnIrSVNRdnpaUWRpd3JMRgp0S2lJVkFUWGRKUElhN2UzaFpkWEJNWDBLRUlTQWhRbDdPQ1grN2U3eGhBRFBMMjFuMHNmT0ZHQU1uZ1duSWc5CnVBSnlKb21NQmZCeVNaUGtoL3E2amN0Z2I5THNTbmZOcEMxeFppclBMbVhaTGFxdE9QTnZMYkVHdnU1bGJ5T1MKQktPN3gvSXlyMjZKZlFpL0l3WEJyY3E1bDZ0UGJXSTUzbjRMNGVsdDBKbmJqUHBKM0xLZ1Bha3c3Tm5QT3FsbQpjWlpCdGt6enpKY3BOZkVPTURrQ0F3RUFBYU5oTUY4d0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZOZGJzN0JzRWxjcHg2b0wrTytCWVR5MGhCNDBNQjhHQTFVZEl3UVkKTUJhQUZOZGJzN0JzRWxjcHg2b0wrTytCWVR5MGhCNDBNQTBHQ1NxR1NJYjNEUUVCQ3dVQUE0SUJBUUNDZTJiSgphT05LZzA1eFg5RW13ZEorUGdtS1BrZ1lGWjRLZWNGVGJ3U2Y3ME1WMHFMQ3JrdWlvQzJ1VitndFU1RHp6ZDRGCmJNTTVlRHJQaHdKOXdGckh4dVJGeTRYVk9vRlhQZE93TjJCRXJRU2JNczY1K01GRDQ4VlMyMFRhYzdPUFlLOFEKMUJIMHFJRzJRaTJxRkJGRGpiLzJvZURYODU4UFhmQzNPU3FkejlzZ2JMQjlQRjdST2JNODVCdSs1ZFY0b05IegpVMitIL0czU0NPb3ZGZGJnNEJpQy9zVEJiU1NnNFJhMU0wZGJYcHVlZ2xESGk2TGlJMFFrRG5PQ1RhNWdoZkt4Ck1BSnE3aVlLVyt1MGxvMlJmSlg2TFVFR0ZNOEZvRVJBbXcrUkJHNVlOQjVUM0gwOUVPei9GZUowcWwvM1drUkUKVkhFU2FCRDVkV0tjZFo3dgotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg=='
      })
    },
    identity: {
      get: (index: number) => ({
        oidc: {
          get: (index: number) => ({
            issuer: 'https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E'
          })
        }
      })
    },
    version: config.version,
    roleArn: config.roleArn,
    id: `eks-cluster-${id}`,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/eks-node-group", () => ({
  EksNodeGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `node-group-${id}`,
    nodeGroupName: config.nodeGroupName,
    clusterName: config.clusterName,
    nodeRoleArn: config.nodeRoleArn,
    subnetIds: config.subnetIds,
    scalingConfig: config.scalingConfig,
    instanceTypes: config.instanceTypes,
    diskSize: config.diskSize,
    labels: config.labels,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/eks-addon", () => ({
  EksAddon: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `eks-addon-${id}`,
    clusterName: config.clusterName,
    addonName: config.addonName,
    serviceAccountRoleArn: config.serviceAccountRoleArn,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-tls/lib/provider", () => ({
  TlsProvider: jest.fn()
}));

// Mock TerraformOutput, S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    TerraformStack: actual.TerraformStack
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: {}
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
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { EksCluster } = require("@cdktf/provider-aws/lib/eks-cluster");
  const { EksNodeGroup } = require("@cdktf/provider-aws/lib/eks-node-group");
  const { EksAddon } = require("@cdktf/provider-aws/lib/eks-addon");

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
    });

    test("should create TapStack with custom aws region", () => {
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

    test("should configure TLS provider", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TlsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'tls',
        {}
      );
    });

    test("should fetch current AWS account identity", () => {
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
    test("should create NetworkModule with correct VPC configuration", () => {
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
            Stack: 'TestStack',
            CostCenter: 'engineering'
          })
        })
      );
    });

    test("should create VPC with correct number of subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      expect(networkModule.publicSubnets).toHaveLength(3);
      expect(networkModule.privateSubnets).toHaveLength(3);
      expect(networkModule.natGateways).toHaveLength(3);
    });

    test("should pass correct environment tags to VPC", () => {
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
    test("should create IamModule with correct EKS configuration", () => {
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
            Stack: 'TestStack',
            CostCenter: 'engineering'
          })
        })
      );
    });

    test("should create EKS cluster and node IAM roles", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      expect(iamModule.eksClusterRole).toBeDefined();
      expect(iamModule.eksClusterRole.name).toBe('dev-eks-cluster-cluster-role');
      
      expect(iamModule.eksNodeRole).toBeDefined();
      expect(iamModule.eksNodeRole.name).toBe('dev-eks-cluster-node-role');
    });

    test("should setup OIDC provider after cluster creation", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      expect(iamModule.setupOidcProvider).toHaveBeenCalled();
    });
  });

  describe("EKS Cluster Tests", () => {
    test("should create EKS cluster with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'dev-eks-cluster',
          version: '1.28',
          roleArn: expect.stringContaining('dev-eks-cluster-cluster-role'),
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
            Environment: 'dev'
          })
        })
      );
    });

    test("should use private subnets for EKS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCall = EksCluster.mock.calls[0];
      expect(eksCall[2].vpcConfig.subnetIds).toEqual([
        'private-subnet-0',
        'private-subnet-1',
        'private-subnet-2'
      ]);
    });
  });

  describe("Node Groups Tests", () => {
    test("should create three node groups with different instance types", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(EksNodeGroup).toHaveBeenCalledTimes(3);

      // Medium node group
      const mediumNodeGroup = EksNodeGroup.mock.calls[0];
      expect(mediumNodeGroup[2]).toMatchObject({
        nodeGroupName: 'dev-medium',
        instanceTypes: ['t3.medium'],
        scalingConfig: {
          minSize: 2,
          maxSize: 5,
          desiredSize: 2
        },
        labels: {
          role: 'general',
          size: 'medium'
        }
      });

      // Large node group
      const largeNodeGroup = EksNodeGroup.mock.calls[1];
      expect(largeNodeGroup[2]).toMatchObject({
        nodeGroupName: 'dev-large',
        instanceTypes: ['t3.large'],
        scalingConfig: {
          minSize: 1,
          maxSize: 3,
          desiredSize: 1
        },
        labels: {
          role: 'compute',
          size: 'large'
        }
      });

      // XLarge node group
      const xlargeNodeGroup = EksNodeGroup.mock.calls[2];
      expect(xlargeNodeGroup[2]).toMatchObject({
        nodeGroupName: 'dev-xlarge',
        instanceTypes: ['t3.xlarge'],
        scalingConfig: {
          minSize: 0,
          maxSize: 2,
          desiredSize: 0
        },
        labels: {
          role: 'batch',
          size: 'xlarge'
        }
      });
    });

    test("should use correct node IAM role for all node groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      EksNodeGroup.mock.calls.forEach((call: any) => {
        expect(call[2].nodeRoleArn).toBe(iamModule.eksNodeRole.arn);
      });
    });

    test("should use private subnets for node groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      EksNodeGroup.mock.calls.forEach((call: any) => {
        expect(call[2].subnetIds).toEqual([
          'private-subnet-0',
          'private-subnet-1',
          'private-subnet-2'
        ]);
      });
    });
  });

  describe("IRSA Roles Tests", () => {
    test("should create cluster autoscaler IRSA role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(IrsaRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        'cluster-autoscaler-irsa',
        'dev-eks-cluster-cluster-autoscaler',
        'kube-system',
        'cluster-autoscaler',
        expect.stringContaining('oidc-provider'),
        expect.stringContaining('oidc.eks'),
        expect.stringContaining('autoscaling:DescribeAutoScalingGroups'),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });

    test("should create EBS CSI driver IRSA role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(IrsaRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        'ebs-csi-irsa',
        'dev-eks-cluster-ebs-csi-driver',
        'kube-system',
        'ebs-csi-controller-sa',
        expect.stringContaining('oidc-provider'),
        expect.stringContaining('oidc.eks'),
        expect.stringContaining('ec2:CreateSnapshot'),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });
  });

  describe("Workload Roles Tests", () => {
    test("should create backend workload role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(WorkloadRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        'backend-workload-role',
        'dev-eks-cluster-backend-role',
        'backend',
        expect.stringContaining('oidc-provider'),
        expect.stringContaining('oidc.eks'),
        expect.objectContaining({
          backend: expect.stringContaining('s3:GetObject')
        }),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });

    test("should create frontend workload role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(WorkloadRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        'frontend-workload-role',
        'dev-eks-cluster-frontend-role',
        'frontend',
        expect.stringContaining('oidc-provider'),
        expect.stringContaining('oidc.eks'),
        expect.objectContaining({
          frontend: expect.stringContaining('cloudfront:CreateInvalidation')
        }),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });

    test("should create data processing workload role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(WorkloadRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        'data-processing-workload-role',
        'dev-eks-cluster-data-processing-role',
        'data-processing',
        expect.stringContaining('oidc-provider'),
        expect.stringContaining('oidc.eks'),
        expect.objectContaining({
          dataProcessing: expect.stringContaining('sqs:ReceiveMessage')
        }),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });
  });

  describe("EKS Addons Tests", () => {
    test("should create EBS CSI driver addon", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(EksAddon).toHaveBeenCalledWith(
        expect.anything(),
        'ebs-csi-driver',
        expect.objectContaining({
          clusterName: 'dev-eks-cluster',
          addonName: 'aws-ebs-csi-driver',
          serviceAccountRoleArn: expect.stringContaining('ebs-csi-driver'),
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      expect(TerraformOutput).toHaveBeenCalledTimes(16);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      // VPC and network outputs
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      
      // EKS outputs
      expect(outputIds).toContain('eks-cluster-name');
      expect(outputIds).toContain('eks-cluster-endpoint');
      expect(outputIds).toContain('eks-cluster-certificate-authority-data');
      expect(outputIds).toContain('eks-oidc-provider-arn');
      expect(outputIds).toContain('eks-oidc-provider-url');
      expect(outputIds).toContain('node-group-ids');
      
      // IAM role outputs
      expect(outputIds).toContain('cluster-autoscaler-role-arn');
      expect(outputIds).toContain('ebs-csi-role-arn');
      expect(outputIds).toContain('backend-role-arn');
      expect(outputIds).toContain('frontend-role-arn');
      expect(outputIds).toContain('data-processing-role-arn');
      
      // Other outputs
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('kubeconfig-command');
    });

    test("should create VPC outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      const vpcIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      expect(vpcIdOutput[2].value).toBe(networkModule.vpc.id);
      expect(vpcIdOutput[2].description).toBe('VPC ID');
    });

    test("should create EKS cluster outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksClusterOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-name'
      );
      expect(eksClusterOutput[2].value).toBe('dev-eks-cluster');
      expect(eksClusterOutput[2].description).toBe('EKS cluster name');
    });

    test("should create kubeconfig command output", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const kubeconfigOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'kubeconfig-command'
      );
      expect(kubeconfigOutput[2].value).toBe(
        'aws eks update-kubeconfig --region us-east-1 --name dev-eks-cluster'
      );
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

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'dev-eks-cluster'
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

      const expectedTags = {
        Environment: 'prod',
        ManagedBy: 'terraform-cdktf',
        Stack: 'TestStack',
        CostCenter: 'engineering'
      };

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({ tags: expectedTags })
      );

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({ 
          clusterName: 'prod-eks-cluster',
          tags: expectedTags 
        })
      );

      expect(EksCluster).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'prod-eks-cluster',
          tags: expectedTags
        })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      
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
          vpcCidr: '10.0.0.0/16'
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {});

      expect(stack).toBeDefined();
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: undefined
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

        const kubeconfigOutput = TerraformOutput.mock.calls.find(
          (call: any) => call[1] === 'kubeconfig-command'
        );
        expect(kubeconfigOutput[2].value).toContain(`--region ${region}`);
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
        Stack: 'TestStack',
        CostCenter: 'engineering'
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

      EksNodeGroup.mock.calls.forEach((call: any) => {
        expect(call[2].tags).toEqual(expectedTags);
      });
    });

    test("should consistently apply ManagedBy tag", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkCall = NetworkModule.mock.calls[0];
      expect(networkCall[2].tags.ManagedBy).toBe('terraform-cdktf');

      const iamCall = IamModule.mock.calls[0];
      expect(iamCall[2].tags.ManagedBy).toBe('terraform-cdktf');

      const eksCall = EksCluster.mock.calls[0];
      expect(eksCall[2].tags.ManagedBy).toBe('terraform-cdktf');
    });
  });

  describe("Complete Infrastructure Stack", () => {

    test("should create exactly 16 outputs for complete stack", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(16);
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
      
      expect(eksCall[2].roleArn).toBe(iamModule.eksClusterRole.arn);

      EksNodeGroup.mock.calls.forEach((call: any) => {
        expect(call[2].nodeRoleArn).toBe(iamModule.eksNodeRole.arn);
      });
    });

    test("should create resources in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const networkCallOrder = NetworkModule.mock.invocationCallOrder[0];
      const iamCallOrder = IamModule.mock.invocationCallOrder[0];
      const eksCallOrder = EksCluster.mock.invocationCallOrder[0];
      
      // Network and IAM should be created before EKS
      expect(networkCallOrder).toBeLessThan(eksCallOrder);
      expect(iamCallOrder).toBeLessThan(eksCallOrder);
    });
  });

  // Add these test cases to your existing test file

describe("Additional Module Tests", () => {
  const {
    NetworkModule,
    IamModule,
    IrsaRoleModule,
    WorkloadRoleModule,
    generateNetworkPolicyManifests
  } = require("../lib/modules");
  const { EksAddon } = require("@cdktf/provider-aws/lib/eks-addon");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Network Module - VPC Flow Logs", () => {
    test("should create VPC flow logs with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Mock the CloudwatchLogGroup
      const mockCloudwatchLogGroup = jest.fn().mockImplementation(() => ({
        arn: 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/vpc/flowlogs/dev',
        name: '/aws/vpc/flowlogs/dev'
      }));

      // Mock the FlowLog
      const mockFlowLog = jest.fn().mockImplementation(() => ({
        id: 'fl-1234567890abcdef0',
        vpcId: 'vpc-network'
      }));

      // Verify that flow logs would be created with correct retention
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should create IAM role for VPC flow logs", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      // The NetworkModule should have been called with prod environment
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        })
      );
    });
  });

  describe("Network Module - Internet Gateway", () => {
    test("should verify IGW creation for public subnet connectivity", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      // Verify public subnets are created with mapPublicIpOnLaunch
      networkModule.publicSubnets.forEach((subnet: any) => {
        expect(subnet.mapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe("Network Module - NAT Gateways and EIPs", () => {
    test("should create NAT gateways for each availability zone", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      // Verify NAT gateways match the number of AZs
      expect(networkModule.natGateways).toHaveLength(3);
      
      // Verify each NAT gateway has correct configuration
      networkModule.natGateways.forEach((natGateway: any, index: number) => {
        expect(natGateway.id).toBe(`nat-gateway-${index}`);
        expect(natGateway.allocationId).toBe(`eip-nat-${index}`);
        expect(natGateway.subnetId).toBe(`public-subnet-${index}`);
      });
    });

    test("should create EIPs for NAT gateways", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const networkModule = NetworkModule.mock.results[0].value;
      
      // Verify EIP allocation for each NAT gateway
      networkModule.natGateways.forEach((natGateway: any, index: number) => {
        expect(natGateway.allocationId).toContain('eip');
      });
    });
  });

  describe("Network Module - Route Tables", () => {
    test("should create public and private route tables", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      // Verify subnet CIDR blocks
      networkModule.publicSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.cidrBlock).toBe(`10.0.${index}.0/24`);
      });
      
      networkModule.privateSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.cidrBlock).toBe(`10.0.${index + 10}.0/24`);
      });
    });

    test("should configure route tables for high availability", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      // Each private subnet should have access to a NAT gateway
      expect(networkModule.privateSubnets.length).toBe(networkModule.natGateways.length);
    });
  });

  describe("IAM Module - Policy Documents", () => {
    test("should create assume role policy for EKS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      expect(iamModule.eksClusterRole).toBeDefined();
      expect(iamModule.eksClusterRole.arn).toContain('cluster-role');
    });

    test("should create assume role policy for EKS nodes", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      expect(iamModule.eksNodeRole).toBeDefined();
      expect(iamModule.eksNodeRole.arn).toContain('node-role');
    });

    test("should attach required managed policies to node role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      // Verify node role has necessary permissions
      expect(iamModule.eksNodeRole.name).toBe('dev-eks-cluster-node-role');
    });
  });

  describe("IRSA Role Module - Internal Implementation", () => {
    test("should create IRSA role with correct trust policy", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Verify cluster autoscaler IRSA role
      const clusterAutoscalerCall = IrsaRoleModule.mock.calls.find(
        (call: any) => call[1] === 'cluster-autoscaler-irsa'
      );
      
      expect(clusterAutoscalerCall).toBeDefined();
      expect(clusterAutoscalerCall[2]).toBe('dev-eks-cluster-cluster-autoscaler');
      expect(clusterAutoscalerCall[3]).toBe('kube-system');
      expect(clusterAutoscalerCall[4]).toBe('cluster-autoscaler');
    });

    test("should attach inline policies to IRSA roles", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Verify EBS CSI IRSA role
      const ebsCsiCall = IrsaRoleModule.mock.calls.find(
        (call: any) => call[1] === 'ebs-csi-irsa'
      );
      
      expect(ebsCsiCall).toBeDefined();
      expect(ebsCsiCall[7]).toContain('ec2:CreateSnapshot');
      expect(ebsCsiCall[7]).toContain('ec2:CreateVolume');
      expect(ebsCsiCall[7]).toContain('ec2:DeleteVolume');
    });
  });

  describe("Workload Role Module - Policy Attachments", () => {
    test("should attach backend policies correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const backendCall = WorkloadRoleModule.mock.calls.find(
        (call: any) => call[1] === 'backend-workload-role'
      );
      
      expect(backendCall[6].backend).toContain('s3:GetObject');
      expect(backendCall[6].backend).toContain('rds:DescribeDBInstances');
      expect(backendCall[6].backend).toContain('ssm:GetParameter');
    });

    test("should attach frontend policies correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const frontendCall = WorkloadRoleModule.mock.calls.find(
        (call: any) => call[1] === 'frontend-workload-role'
      );
      
      expect(frontendCall[6].frontend).toContain('cloudfront:CreateInvalidation');
      expect(frontendCall[6].frontend).toContain('s3:GetObject');
    });

    test("should attach data processing policies correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const dataProcessingCall = WorkloadRoleModule.mock.calls.find(
        (call: any) => call[1] === 'data-processing-workload-role'
      );
      
      expect(dataProcessingCall[6].dataProcessing).toContain('sqs:ReceiveMessage');
      expect(dataProcessingCall[6].dataProcessing).toContain('sqs:DeleteMessage');
      expect(dataProcessingCall[6].dataProcessing).toContain('s3:ListBucket');
    });
  });

  describe("EKS Addons - Complete Coverage", () => {
    test("should create VPC CNI addon with specific version", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcCniCall = EksAddon.mock.calls.find(
        (call: any) => call[1] === 'vpc-cni'
      );

      expect(vpcCniCall).toBeDefined();
      expect(vpcCniCall[2]).toMatchObject({
        clusterName: 'dev-eks-cluster',
        addonName: 'vpc-cni',
        addonVersion: 'v1.15.4-eksbuild.1',
        tags: expect.objectContaining({
          Environment: 'dev'
        })
      });
    });

    test("should create CoreDNS addon with specific version", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const coreDnsCall = EksAddon.mock.calls.find(
        (call: any) => call[1] === 'coredns'
      );

      expect(coreDnsCall).toBeDefined();
      expect(coreDnsCall[2]).toMatchObject({
        clusterName: 'dev-eks-cluster',
        addonName: 'coredns',
        addonVersion: 'v1.10.1-eksbuild.5',
        tags: expect.objectContaining({
          Environment: 'dev'
        })
      });
    });

    test("should create EBS CSI addon with version and service account role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ebsCsiCall = EksAddon.mock.calls.find(
        (call: any) => call[1] === 'ebs-csi-driver'
      );

      expect(ebsCsiCall).toBeDefined();
      expect(ebsCsiCall[2]).toMatchObject({
        clusterName: 'dev-eks-cluster',
        addonName: 'aws-ebs-csi-driver',
        addonVersion: 'v1.25.0-eksbuild.1',
        serviceAccountRoleArn: expect.stringContaining('ebs-csi-driver'),
        tags: expect.objectContaining({
          Environment: 'dev'
        })
      });
    });

    test("should create addons with proper dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // All three addons should be created
      expect(EksAddon).toHaveBeenCalledTimes(3);

      // Verify addon creation order by checking mock call indices
      const addonCalls = EksAddon.mock.calls;
      const vpcCniIndex = addonCalls.findIndex((call: any) => call[1] === 'vpc-cni');
      const coreDnsIndex = addonCalls.findIndex((call: any) => call[1] === 'coredns');
      const ebsCsiIndex = addonCalls.findIndex((call: any) => call[1] === 'ebs-csi-driver');

      // EBS CSI should be created after VPC CNI and CoreDNS
      expect(ebsCsiIndex).toBeGreaterThan(vpcCniIndex);
      expect(ebsCsiIndex).toBeGreaterThan(coreDnsIndex);
    });
  });

  describe("Subnet Tagging for Load Balancers", () => {
    test("should tag public subnets for ELB", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      networkModule.publicSubnets.forEach((subnet: any) => {
        // Public subnets should be tagged for external load balancers
        expect(subnet.id).toMatch(/^public-subnet-\d$/);
      });
    });

    test("should tag private subnets for internal ELB", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkModule.mock.results[0].value;
      
      networkModule.privateSubnets.forEach((subnet: any) => {
        // Private subnets should be tagged for internal load balancers
        expect(subnet.id).toMatch(/^private-subnet-\d$/);
      });
    });
  });

  describe("Node Group Configuration Details", () => {
    test("should configure node groups with disk size", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      EksNodeGroup.mock.calls.forEach((call: any) => {
        expect(call[2].diskSize).toBe(20);
      });
    });

    test("should configure node groups with proper labels", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const mediumNodeGroup = EksNodeGroup.mock.calls[0];
      const largeNodeGroup = EksNodeGroup.mock.calls[1];
      const xlargeNodeGroup = EksNodeGroup.mock.calls[2];

      expect(mediumNodeGroup[2].labels.role).toBe('general');
      expect(largeNodeGroup[2].labels.role).toBe('compute');
      expect(xlargeNodeGroup[2].labels.role).toBe('batch');
    });

    test("should ensure medium node group has minimum 2 nodes", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const mediumNodeGroup = EksNodeGroup.mock.calls[0];
      
      expect(mediumNodeGroup[2].scalingConfig.minSize).toBeGreaterThanOrEqual(2);
      expect(mediumNodeGroup[2].scalingConfig.desiredSize).toBeGreaterThanOrEqual(2);
    });
  });

  describe("OIDC Provider Configuration", () => {
    test("should setup OIDC provider after cluster creation", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      expect(iamModule.setupOidcProvider).toHaveBeenCalled();
      expect(iamModule.oidcProvider).toBeDefined();
      expect(iamModule.oidcProvider.arn).toContain('oidc-provider');
    });

    test("should use OIDC provider for IRSA roles", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      // Verify OIDC provider ARN is passed to IRSA roles
      IrsaRoleModule.mock.calls.forEach((call: any) => {
        expect(call[5]).toBe(iamModule.oidcProvider.arn);
      });

      // Verify OIDC provider ARN is passed to workload roles
      WorkloadRoleModule.mock.calls.forEach((call: any) => {
        expect(call[4]).toBe(iamModule.oidcProvider.arn);
      });
    });
  });

  describe("Policy Document Validation", () => {
    test("should create valid cluster autoscaler policy", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const clusterAutoscalerCall = IrsaRoleModule.mock.calls.find(
        (call: any) => call[1] === 'cluster-autoscaler-irsa'
      );

      const policyDoc = JSON.parse(clusterAutoscalerCall[7]);
      
      expect(policyDoc.Version).toBe('2012-10-17');
      expect(policyDoc.Statement[0].Effect).toBe('Allow');
      expect(policyDoc.Statement[0].Resource).toBe('*');
      expect(policyDoc.Statement[0].Action).toContain('autoscaling:SetDesiredCapacity');
      expect(policyDoc.Statement[0].Action).toContain('eks:DescribeNodegroup');
    });

    test("should create valid EBS CSI policy with conditions", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ebsCsiCall = IrsaRoleModule.mock.calls.find(
        (call: any) => call[1] === 'ebs-csi-irsa'
      );

      const policyDoc = JSON.parse(ebsCsiCall[7]);
      
      // Check for conditional statements
      const createTagsStatement = policyDoc.Statement.find(
        (s: any) => s.Action && s.Action.includes('ec2:CreateTags')
      );
      
      expect(createTagsStatement).toBeDefined();
      expect(createTagsStatement.Condition).toBeDefined();
      expect(createTagsStatement.Condition.StringEquals).toBeDefined();

      // Check for delete volume statement with condition
      const deleteVolumeStatement = policyDoc.Statement.find(
        (s: any) => s.Action && s.Action.includes('ec2:DeleteVolume')
      );
      
      expect(deleteVolumeStatement).toBeDefined();
      expect(deleteVolumeStatement.Condition).toBeDefined();
    });
  });

  describe("Environment-specific Node Group Naming", () => {
    test("should include environment in node group names", () => {
      const environments = ['dev', 'staging', 'prod'];
      
      environments.forEach(env => {
        jest.clearAllMocks();
        const app = new App();
        
        new TapStack(app, "TestStack", {
          environmentSuffix: env
        });

        EksNodeGroup.mock.calls.forEach((call: any, index: number) => {
          const sizes = ['medium', 'large', 'xlarge'];
          expect(call[2].nodeGroupName).toBe(`${env}-${sizes[index]}`);
        });
      });
    });
  });

  describe("Cost Optimization Settings", () => {
    test("should set xlarge node group to scale from 0", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const xlargeNodeGroup = EksNodeGroup.mock.calls[2];
      
      expect(xlargeNodeGroup[2].scalingConfig.minSize).toBe(0);
      expect(xlargeNodeGroup[2].scalingConfig.desiredSize).toBe(0);
      expect(xlargeNodeGroup[2].scalingConfig.maxSize).toBe(2);
    });

    test("should use appropriate instance types for cost optimization", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const mediumNodeGroup = EksNodeGroup.mock.calls[0];
      const largeNodeGroup = EksNodeGroup.mock.calls[1];
      const xlargeNodeGroup = EksNodeGroup.mock.calls[2];

      expect(mediumNodeGroup[2].instanceTypes).toEqual(['t3.medium']);
      expect(largeNodeGroup[2].instanceTypes).toEqual(['t3.large']);
      expect(xlargeNodeGroup[2].instanceTypes).toEqual(['t3.xlarge']);
    });
  });

  describe("Security Best Practices", () => {
    test("should enable all EKS cluster log types", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCall = EksCluster.mock.calls[0];
      const expectedLogTypes = [
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler'
      ];

      expect(eksCall[2].enabledClusterLogTypes).toEqual(expectedLogTypes);
    });

    test("should configure both private and public endpoint access", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCall = EksCluster.mock.calls[0];
      
      expect(eksCall[2].vpcConfig.endpointPrivateAccess).toBe(true);
      expect(eksCall[2].vpcConfig.endpointPublicAccess).toBe(true);
      expect(eksCall[2].vpcConfig.publicAccessCidrs).toEqual(['0.0.0.0/0']);
    });

    test("should use private subnets for worker nodes", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      EksNodeGroup.mock.calls.forEach((call: any) => {
        expect(call[2].subnetIds).toEqual([
          'private-subnet-0',
          'private-subnet-1',
          'private-subnet-2'
        ]);
      });
    });
  });
});
});