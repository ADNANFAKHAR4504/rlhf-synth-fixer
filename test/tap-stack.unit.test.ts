import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect } from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${id}`,
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: config.enableDnsHostnames,
      enableDnsSupport: config.enableDnsSupport
    },
    publicSubnets: [0, 1, 2].map(i => ({
      id: `public-subnet-${i}`,
      cidrBlock: `10.0.${i * 2}.0/24`,
      availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`
    })),
    privateSubnets: [0, 1, 2].map(i => ({
      id: `private-subnet-${i}`,
      cidrBlock: `10.0.${i * 2 + 1}.0/24`,
      availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`
    })),
    natGateways: [0, 1, 2].map(i => ({
      id: `nat-gateway-${i}`,
      allocationId: `eip-nat-${i}`,
      subnetId: `public-subnet-${i}`
    })),
    internetGateway: {
      id: 'igw-main',
      vpcId: `vpc-${id}`
    }
  })),

  SecurityGroupConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    securityGroup: {
      id: `sg-${id}`,
      name: config.name,
      vpcId: config.vpcId,
      description: config.description
    }
  })),

  EksClusterConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    cluster: {
      id: `eks-${id}`,
      name: config.name,
      version: config.version,
      endpoint: `https://eks-${config.name}.amazonaws.com`,
      arn: `arn:aws:eks:us-east-1:123456789012:cluster/${config.name}`
    },
    clusterRole: {
      id: `${config.name}-cluster-role`,
      arn: `arn:aws:iam::123456789012:role/${config.name}-cluster-role`,
      name: `${config.name}-cluster-role`
    },
    nodeRole: {
      id: `${config.name}-node-role`,
      arn: `arn:aws:iam::123456789012:role/${config.name}-node-role`,
      name: `${config.name}-node-role`
    },
    oidcProvider: {
      id: 'oidc-provider',
      arn: `arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
      url: 'https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E'
    }
  })),

  AlbConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    alb: {
      id: `alb-${id}`,
      name: config.name,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${config.name}/50dc6c495c0c9188`,
      dnsName: `${config.name}-123456789.us-east-1.elb.amazonaws.com`,
      arnSuffix: `app/${config.name}/50dc6c495c0c9188`
    },
    targetGroup: {
      id: `${config.name}-tg`,
      name: `${config.name}-tg`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${config.name}-tg/50dc6c495c0c9188`
    },
    listener: {
      id: 'http-listener',
      port: 80,
      protocol: 'HTTP',
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${config.name}/50dc6c495c0c9188/f2f7dc8efc522ab2`
    }
  })),

  IrsaRoleConstruct: jest.fn().mockImplementation((scope: any, id: string, 
    clusterName: string, oidcProviderArn: string, namespace: string, 
    serviceAccount: string, policyArns: string[], tags?: any) => ({
    role: {
      id: `irsa-${id}`,
      name: `${clusterName}-${namespace}-${serviceAccount}-role`,
      arn: `arn:aws:iam::123456789012:role/${clusterName}-${namespace}-${serviceAccount}-role`
    }
  })),

  ManagedNodeGroupConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    nodeGroup: {
      id: `node-group-${id}`,
      nodeGroupName: config.nodeGroupName,
      clusterName: config.clusterName,
      nodeRoleArn: config.nodeRoleArn,
      amiType: config.architecture === 'arm64' ? 'AL2_ARM_64' : 'AL2_x86_64'
    }
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
}));

// Add this to properly mock the addOverride method
const mockAddOverride = jest.fn();
TapStack.prototype.addOverride = mockAddOverride;

describe("TapStack Unit Tests", () => {
  const { 
    VpcConstruct,
    SecurityGroupConstruct,
    EksClusterConstruct,
    AlbConstruct,
    IrsaRoleConstruct,
    ManagedNodeGroupConstruct
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

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

    test("should create TapStack with custom aws region from props", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1'
        })
      );
    });

    test("should apply custom default tags when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Team: 'Platform',
          CostCenter: 'Engineering'
        }
      };

      new TapStack(app, "TestStack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
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
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-central-1',
        environmentSuffix: 'production'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-state-bucket',
          key: 'production/TestStack.tfstate',
          region: 'eu-central-1',
          encrypt: true
        })
      );
    });
  });

  describe("VPC Module Tests", () => {
    test("should create VpcConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should create VpcConstruct with custom CIDR", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        vpcCidr: '172.16.0.0/16'
      });

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          cidrBlock: '172.16.0.0/16'
        })
      );
    });

    test("should create VPC with correct subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcConstruct = VpcConstruct.mock.results[0].value;
      expect(vpcConstruct.publicSubnets).toHaveLength(3);
      expect(vpcConstruct.privateSubnets).toHaveLength(3);
      expect(vpcConstruct.natGateways).toHaveLength(3);
      expect(vpcConstruct.internetGateway).toBeDefined();
    });
  });

  describe("Security Group Tests", () => {
    test("should create EKS cluster security group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // First call should be for EKS cluster security group
      expect(SecurityGroupConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster-sg',
        expect.objectContaining({
          name: 'dev-eks-cluster-sg',
          description: 'Security group for EKS cluster',
          ingressRules: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        })
      );
    });

    test("should create ALB security group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Second call should be for ALB security group
      const albSgCall = SecurityGroupConstruct.mock.calls[1];
      expect(albSgCall[1]).toBe('alb-sg');
      expect(albSgCall[2]).toMatchObject({
        name: 'dev-alb-sg',
        description: 'Security group for Application Load Balancer',
        ingressRules: expect.arrayContaining([
          expect.objectContaining({
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp'
          }),
          expect.objectContaining({
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp'
          })
        ])
      });
    });
  });

  describe("EKS Cluster Tests", () => {
    test("should create EksClusterConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcConstruct = VpcConstruct.mock.results[0].value;

      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'dev-cluster',
          version: '1.28',
          subnetIds: expect.arrayContaining([
            'private-subnet-0',
            'private-subnet-1',
            'private-subnet-2'
          ])
        })
      );
    });

    test("should create EKS cluster with custom version", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        eksVersion: '1.29'
      });

      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          version: '1.29'
        })
      );
    });

    test("should use security group for EKS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksSecurityGroup = SecurityGroupConstruct.mock.results[0].value;
      
      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          securityGroupIds: [eksSecurityGroup.securityGroup.id]
        })
      );
    });
  });

  describe("ALB Module Tests", () => {
    test("should create AlbConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcConstruct = VpcConstruct.mock.results[0].value;
      const albSecurityGroup = SecurityGroupConstruct.mock.results[1].value;

      expect(AlbConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-alb',
        expect.objectContaining({
          name: 'dev-alb',
          vpcId: vpcConstruct.vpc.id,
          subnetIds: ['public-subnet-0', 'public-subnet-1', 'public-subnet-2'],
          securityGroupId: albSecurityGroup.securityGroup.id
        })
      );
    });

    test("should create ALB with environment-specific name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(AlbConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-alb',
        expect.objectContaining({
          name: 'production-alb'
        })
      );
    });
  });

  describe("IRSA Role Tests", () => {
    test("should create ALB Controller IRSA role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCluster = EksClusterConstruct.mock.results[0].value;
      
      // First IRSA role should be for ALB Controller
      expect(IrsaRoleConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'alb-controller-irsa',
        'dev-cluster',
        eksCluster.oidcProvider.arn,
        'kube-system',
        'aws-load-balancer-controller',
        ['arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess'],
        expect.objectContaining({
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Stack: 'TestStack'
        })
      );
    });

    test("should create EBS CSI Driver IRSA role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCluster = EksClusterConstruct.mock.results[0].value;
      
      // Second IRSA role should be for EBS CSI Driver
      const ebsCsiCall = IrsaRoleConstruct.mock.calls[1];
      expect(ebsCsiCall[1]).toBe('ebs-csi-driver-irsa');
      expect(ebsCsiCall[2]).toBe('dev-cluster');
      expect(ebsCsiCall[3]).toBe(eksCluster.oidcProvider.arn);
      expect(ebsCsiCall[4]).toBe('kube-system');
      expect(ebsCsiCall[5]).toBe('ebs-csi-controller-sa');
      expect(ebsCsiCall[6]).toEqual(['arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy']);
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      // VPC outputs
      expect(outputIds).toContain('vpc-id');
      
      // EKS outputs
      expect(outputIds).toContain('eks-cluster-name');
      expect(outputIds).toContain('eks-cluster-endpoint');
      
      // ALB outputs
      expect(outputIds).toContain('alb-dns-name');
      
      // IRSA outputs
      expect(outputIds).toContain('alb-controller-role-arn');
      expect(outputIds).toContain('ebs-csi-driver-role-arn');
    });

    test("should create VPC output with correct value", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcConstruct = VpcConstruct.mock.results[0].value;
      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      
      expect(vpcOutput[2].value).toBe(vpcConstruct.vpc.id);
      expect(vpcOutput[2].description).toBe('VPC ID');
    });

    test("should create EKS outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCluster = EksClusterConstruct.mock.results[0].value;
      
      const nameOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-name'
      );
      expect(nameOutput[2].value).toBe(eksCluster.cluster.name);
      
      const endpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'eks-cluster-endpoint'
      );
      expect(endpointOutput[2].value).toBe(eksCluster.cluster.endpoint);
    });

    test("should create ALB DNS output", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albConstruct = AlbConstruct.mock.results[0].value;
      const albOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      
      expect(albOutput[2].value).toBe(albConstruct.alb.dnsName);
      expect(albOutput[2].description).toBe('ALB DNS Name');
    });

    test("should create IRSA role ARN outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albControllerRole = IrsaRoleConstruct.mock.results[0].value;
      const ebsCsiDriverRole = IrsaRoleConstruct.mock.results[1].value;
      
      const albRoleOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-controller-role-arn'
      );
      expect(albRoleOutput[2].value).toBe(albControllerRole.role.arn);
      
      const ebsRoleOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'ebs-csi-driver-role-arn'
      );
      expect(ebsRoleOutput[2].value).toBe(ebsCsiDriverRole.role.arn);
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcConstruct = VpcConstruct.mock.results[0].value;
      
      // Check SecurityGroupConstruct received VPC ID
      const sgCalls = SecurityGroupConstruct.mock.calls;
      sgCalls.forEach(call => {
        expect(call[2].vpcId).toBe(vpcConstruct.vpc.id);
      });

      // Check AlbConstruct received VPC
      const albCall = AlbConstruct.mock.calls[0];
      expect(albCall[2].vpcId).toBe(vpcConstruct.vpc.id);
      expect(albCall[2].subnetIds).toEqual(vpcConstruct.publicSubnets.map((s: any) => s.id));
    });

    test("should pass subnets to EKS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcConstruct = VpcConstruct.mock.results[0].value;
      const eksCall = EksClusterConstruct.mock.calls[0];
      
      expect(eksCall[2].subnetIds).toEqual(
        vpcConstruct.privateSubnets.map((s: any) => s.id)
      );
    });

    test("should pass OIDC provider to IRSA roles", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksCluster = EksClusterConstruct.mock.results[0].value;
      
      IrsaRoleConstruct.mock.calls.forEach(call => {
        expect(call[3]).toBe(eksCluster.oidcProvider.arn);
      });
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const vpcCallIndex = VpcConstruct.mock.invocationCallOrder[0];
      const sgCallIndex = SecurityGroupConstruct.mock.invocationCallOrder[0];
      const eksCallIndex = EksClusterConstruct.mock.invocationCallOrder[0];
      const albCallIndex = AlbConstruct.mock.invocationCallOrder[0];
      const irsaCallIndex = IrsaRoleConstruct.mock.invocationCallOrder[0];
      
      // VPC should be created first
      expect(vpcCallIndex).toBeLessThan(sgCallIndex);
      expect(vpcCallIndex).toBeLessThan(eksCallIndex);
      expect(vpcCallIndex).toBeLessThan(albCallIndex);
      
      // Security groups should be created before EKS and ALB
      expect(sgCallIndex).toBeLessThan(eksCallIndex);
      expect(sgCallIndex).toBeLessThan(albCallIndex);
      
      // EKS should be created before IRSA roles
      expect(eksCallIndex).toBeLessThan(irsaCallIndex);
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

      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'dev-cluster'
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

      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'staging-cluster'
        })
      );

      expect(AlbConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-alb',
        expect.objectContaining({
          name: 'staging-alb'
        })
      );
    });

    test("should handle production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      const commonTags = {
        Environment: 'production',
        ManagedBy: 'Terraform',
        Stack: 'TestStack'
      };

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          tags: commonTags
        })
      );

      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          name: 'production-cluster',
          tags: commonTags
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

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16'
        })
      );

      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'eks-cluster',
        expect.objectContaining({
          version: '1.28'
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

    test("should handle custom node group config", () => {
      const app = new App();
      const nodeGroupConfig = {
        minSize: 2,
        maxSize: 10,
        desiredSize: 4,
        instanceTypes: ['t3.medium', 't3.large']
      };

      new TapStack(app, "TestStack", {
        nodeGroupConfig
      });

      // The stack should be created successfully
      expect(VpcConstruct).toHaveBeenCalled();
      expect(EksClusterConstruct).toHaveBeenCalled();
    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all constructs are created
      expect(VpcConstruct).toHaveBeenCalledTimes(1);
      expect(SecurityGroupConstruct).toHaveBeenCalledTimes(2); // EKS and ALB
      expect(EksClusterConstruct).toHaveBeenCalledTimes(1);
      expect(AlbConstruct).toHaveBeenCalledTimes(1);
      expect(IrsaRoleConstruct).toHaveBeenCalledTimes(2); // ALB Controller and EBS CSI

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);

    });

    test("should maintain proper construct relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Get construct instances
      const vpcConstruct = VpcConstruct.mock.results[0].value;
      const eksSecurityGroup = SecurityGroupConstruct.mock.results[0].value;
      const albSecurityGroup = SecurityGroupConstruct.mock.results[1].value;
      const eksCluster = EksClusterConstruct.mock.results[0].value;
      const albConstruct = AlbConstruct.mock.results[0].value;
      const albControllerRole = IrsaRoleConstruct.mock.results[0].value;
      const ebsCsiDriverRole = IrsaRoleConstruct.mock.results[1].value;

      // Verify all constructs are defined
      expect(vpcConstruct).toBeDefined();
      expect(eksSecurityGroup).toBeDefined();
      expect(albSecurityGroup).toBeDefined();
      expect(eksCluster).toBeDefined();
      expect(albConstruct).toBeDefined();
      expect(albControllerRole).toBeDefined();
      expect(ebsCsiDriverRole).toBeDefined();
    });

    test("should create resources with consistent naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const eksCluster = EksClusterConstruct.mock.results[0].value;
      expect(eksCluster.cluster.name).toBe('prod-cluster');

      const albConstruct = AlbConstruct.mock.results[0].value;
      expect(albConstruct.alb.name).toBe('prod-alb');

      const albControllerRole = IrsaRoleConstruct.mock.results[0].value;
      expect(albControllerRole.role.name).toBe('prod-cluster-kube-system-aws-load-balancer-controller-role');
    });
  });

  describe("Region-specific Configuration", () => {
    test("should configure resources for us-west-2", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2'
        })
      );
    });

    test("should configure resources for eu-west-1", () => {
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

    test("should handle state bucket in different region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2',
        stateBucketRegion: 'us-east-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2'
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

  describe("Tag Management", () => {
    test("should apply common tags to all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'qa'
      });

      const expectedTags = {
        Environment: 'qa',
        ManagedBy: 'Terraform',
        Stack: 'TestStack'
      };

      // Verify VPC has tags
      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      // Verify EKS cluster has tags
      expect(EksClusterConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      // Verify ALB has tags
      expect(AlbConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });
  });

  describe("Security Group Configuration", () => {
    test("should configure EKS security group with HTTPS ingress", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const eksSecurityGroupCall = SecurityGroupConstruct.mock.calls[0];
      const ingressRules = eksSecurityGroupCall[2].ingressRules;
      
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0]).toMatchObject({
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS traffic'
      });
    });

    test("should configure ALB security group with HTTP and HTTPS ingress", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albSecurityGroupCall = SecurityGroupConstruct.mock.calls[1];
      const ingressRules = albSecurityGroupCall[2].ingressRules;
      
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules).toContainEqual(
        expect.objectContaining({
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        })
      );
      expect(ingressRules).toContainEqual(
        expect.objectContaining({
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        })
      );
    });

  });

  describe("Stack ID and Naming", () => {
    test("should use stack ID in resource naming", () => {
      const app = new App();
      new TapStack(app, "MyCustomStack", {
        environmentSuffix: 'test'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'test/MyCustomStack.tfstate'
        })
      );

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Stack: 'MyCustomStack'
          })
        })
      );
    });
  });
});