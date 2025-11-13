// lib/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect, describe, test, beforeEach } from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${id}`,
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: config.tags
    }
  })),

  NetworkConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    publicSubnets: config.publicSubnetCidrs.map((cidr: string, i: number) => ({
      id: `public-subnet-${i}`,
      cidrBlock: cidr,
      availabilityZone: config.availabilityZones[i],
      vpcId: config.vpcId,
      mapPublicIpOnLaunch: true
    })),
    privateSubnets: config.privateSubnetCidrs.map((cidr: string, i: number) => ({
      id: `private-subnet-${i}`,
      cidrBlock: cidr,
      availabilityZone: config.availabilityZones[i],
      vpcId: config.vpcId
    })),
    natGateways: config.publicSubnetCidrs.map((cidr: string, i: number) => ({
      id: `nat-gateway-${i}`,
      allocationId: `eip-nat-${i}`,
      subnetId: `public-subnet-${i}`
    }))
  })),

  SecurityGroupConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    securityGroup: {
      id: `sg-${id}`,
      name: config.name,
      vpcId: config.vpcId,
      description: `Security group for ${config.name}`,
      tags: config.tags
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

jest.mock("@cdktf/provider-aws/lib/data-aws-availability-zones", () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation((scope: any, id: string, config?: any) => ({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
    zoneIds: ['use1-az1', 'use1-az2', 'use1-az3', 'use1-az4']
  }))
}));

// Mock TerraformOutput, S3Backend, and Fn
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    TerraformStack: actual.TerraformStack,
    Fn: {
      element: jest.fn((list: any, index: number) => {
        if (Array.isArray(list)) {
          return list[index];
        }
        // For mocked data sources
        return ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'][index];
      })
    }
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
    VpcConstruct,
    NetworkConstruct,
    SecurityGroupConstruct
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend, Fn } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { DataAwsAvailabilityZones } = require("@cdktf/provider-aws/lib/data-aws-availability-zones");

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
          defaultTags: []
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

    test("should fetch current AWS account identity", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'current',
        {}
      );
    });

    test("should fetch available availability zones", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsAvailabilityZones).toHaveBeenCalledWith(
        expect.anything(),
        'azs',
        expect.objectContaining({
          state: 'available'
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

    test("should enable S3 state locking with escape hatch", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
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
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should create VPC with correct CIDR block", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;
      
      expect(vpcModule.vpc).toBeDefined();
      expect(vpcModule.vpc.cidrBlock).toBe('10.0.0.0/16');
      expect(vpcModule.vpc.enableDnsHostnames).toBe(true);
      expect(vpcModule.vpc.enableDnsSupport).toBe(true);
    });

    test("should pass correct environment tags to VPC", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging'
          })
        })
      );
    });
  });

  describe("Network Module Tests", () => {
    test("should create NetworkConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;

      expect(NetworkConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-network',
        expect.objectContaining({
          vpcId: vpcModule.vpc.id,
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should create correct number of subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkConstruct.mock.results[0].value;
      
      expect(networkModule.publicSubnets).toHaveLength(2);
      expect(networkModule.privateSubnets).toHaveLength(2);
      expect(networkModule.natGateways).toHaveLength(2);
    });

    test("should use Fn.element to select availability zones", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(Fn.element).toHaveBeenCalledTimes(2);
      expect(Fn.element).toHaveBeenCalledWith(expect.anything(), 0);
      expect(Fn.element).toHaveBeenCalledWith(expect.anything(), 1);
    });

    test("should configure public subnets correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkConstruct.mock.results[0].value;
      
      networkModule.publicSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.cidrBlock).toBe(['10.0.1.0/24', '10.0.2.0/24'][index]);
        expect(subnet.mapPublicIpOnLaunch).toBe(true);
      });
    });

    test("should configure private subnets correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkConstruct.mock.results[0].value;
      
      networkModule.privateSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.cidrBlock).toBe(['10.0.10.0/24', '10.0.11.0/24'][index]);
      });
    });
  });

  describe("Security Group Module Tests", () => {
    test("should create application security group with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;

      expect(SecurityGroupConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'app-sg',
        expect.objectContaining({
          name: 'TestStack-app-security-group',
          vpcId: vpcModule.vpc.id,
          ingressRules: [
            {
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
              description: 'Allow HTTPS from anywhere'
            },
            {
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
              description: 'Allow HTTP from anywhere'
            }
          ],
          egressRules: [
            {
              fromPort: 0,
              toPort: 65535,
              protocol: '-1',
              cidrBlocks: ['0.0.0.0/0'],
              description: 'Allow all outbound traffic'
            }
          ],
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Stack: 'TestStack'
          })
        })
      );
    });

    test("should create database security group with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;

      const dbSgCall = SecurityGroupConstruct.mock.calls.find(
        (call: any) => call[1] === 'db-sg'
      );

      expect(dbSgCall[2]).toEqual(expect.objectContaining({
        name: 'TestStack-db-security-group',
        vpcId: vpcModule.vpc.id,
        ingressRules: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow MySQL from VPC'
          }
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic'
          }
        ],
        tags: expect.objectContaining({
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Stack: 'TestStack'
        })
      }));
    });

    test("should create exactly two security groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SecurityGroupConstruct).toHaveBeenCalledTimes(2);
    });

    test("should use stack ID in security group names", () => {
      const app = new App();
      new TapStack(app, "MyStack");

      const appSgCall = SecurityGroupConstruct.mock.calls[0];
      expect(appSgCall[2].name).toBe('MyStack-app-security-group');

      const dbSgCall = SecurityGroupConstruct.mock.calls[1];
      expect(dbSgCall[2].name).toBe('MyStack-db-security-group');
    });
  });

  describe("Terraform Outputs", () => {
    test("should create exactly 10 terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      expect(TerraformOutput).toHaveBeenCalledTimes(10);
    });

    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('vpc-cidr-block');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('nat-gateway-ids');
      expect(outputIds).toContain('app-security-group-id');
      expect(outputIds).toContain('db-security-group-id');
      expect(outputIds).toContain('availability-zones');
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('aws-region');
    });

    test("should create VPC outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;
      
      const vpcIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      expect(vpcIdOutput[2].value).toBe(vpcModule.vpc.id);
      expect(vpcIdOutput[2].description).toBe('VPC ID');

      const vpcCidrOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-cidr-block'
      );
      expect(vpcCidrOutput[2].value).toBe('10.0.0.0/16');
      expect(vpcCidrOutput[2].description).toBe('VPC CIDR block');
    });

    test("should create subnet outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkConstruct.mock.results[0].value;
      
      const publicSubnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      expect(publicSubnetOutput[2].value).toEqual(['public-subnet-0', 'public-subnet-1']);
      expect(publicSubnetOutput[2].description).toBe('Public subnet IDs');
      
      const privateSubnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );
      expect(privateSubnetOutput[2].value).toEqual(['private-subnet-0', 'private-subnet-1']);
      expect(privateSubnetOutput[2].description).toBe('Private subnet IDs');
    });

    test("should create NAT gateway outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModule = NetworkConstruct.mock.results[0].value;
      
      const natGatewayOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'nat-gateway-ids'
      );
      expect(natGatewayOutput[2].value).toEqual(['nat-gateway-0', 'nat-gateway-1']);
      expect(natGatewayOutput[2].description).toBe('NAT Gateway IDs');
    });

    test("should create security group outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const appSg = SecurityGroupConstruct.mock.results[0].value;
      const dbSg = SecurityGroupConstruct.mock.results[1].value;
      
      const appSgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'app-security-group-id'
      );
      expect(appSgOutput[2].value).toBe(appSg.securityGroup.id);
      expect(appSgOutput[2].description).toBe('Application Security Group ID');
      
      const dbSgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'db-security-group-id'
      );
      expect(dbSgOutput[2].value).toBe(dbSg.securityGroup.id);
      expect(dbSgOutput[2].description).toBe('Database Security Group ID');
    });

    test("should create data source outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const azOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'availability-zones'
      );
      expect(azOutput[2].description).toBe('Available AZs in the region');

      const accountOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );
      expect(accountOutput[2].value).toBe('123456789012');
      expect(accountOutput[2].description).toBe('Current AWS Account ID');

      const regionOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-region'
      );
      expect(regionOutput[2].value).toBe('us-east-1');
      expect(regionOutput[2].description).toBe('AWS Region');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC ID to Network module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;
      const networkCall = NetworkConstruct.mock.calls[0];
      
      expect(networkCall[2].vpcId).toBe(vpcModule.vpc.id);
    });

    test("should pass VPC ID to Security Groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcConstruct.mock.results[0].value;
      const appSgCall = SecurityGroupConstruct.mock.calls[0];
      const dbSgCall = SecurityGroupConstruct.mock.calls[1];
      
      expect(appSgCall[2].vpcId).toBe(vpcModule.vpc.id);
      expect(dbSgCall[2].vpcId).toBe(vpcModule.vpc.id);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const vpcCallOrder = VpcConstruct.mock.invocationCallOrder[0];
      const networkCallOrder = NetworkConstruct.mock.invocationCallOrder[0];
      const appSgCallOrder = SecurityGroupConstruct.mock.invocationCallOrder[0];
      const dbSgCallOrder = SecurityGroupConstruct.mock.invocationCallOrder[1];
      
      // VPC should be created first
      expect(vpcCallOrder).toBeLessThan(networkCallOrder);
      expect(vpcCallOrder).toBeLessThan(appSgCallOrder);
      
      // Network should be created after VPC
      expect(networkCallOrder).toBeGreaterThan(vpcCallOrder);
      
      // Security groups should be created after VPC
      expect(appSgCallOrder).toBeGreaterThan(vpcCallOrder);
      expect(dbSgCallOrder).toBeGreaterThan(vpcCallOrder);
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

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev'
          })
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

      const expectedTags = {
        Environment: 'staging',
        ManagedBy: 'Terraform',
        Stack: 'TestStack'
      };

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({ tags: expectedTags })
      );

      expect(NetworkConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-network',
        expect.objectContaining({ tags: expectedTags })
      );

      expect(SecurityGroupConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'app-sg',
        expect.objectContaining({ tags: expectedTags })
      );
    });

    test("should handle production environment settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const expectedTags = {
        Environment: 'prod',
        ManagedBy: 'Terraform',
        Stack: 'TestStack'
      };

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({ tags: expectedTags })
      );

      expect(NetworkConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-network',
        expect.objectContaining({ tags: expectedTags })
      );

      SecurityGroupConstruct.mock.calls.forEach((call: any) => {
        expect(call[2].tags).toEqual(expectedTags);
      });
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
          cidrBlock: '10.0.0.0/16',
          tags: expect.objectContaining({
            Environment: 'dev'
          })
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
          defaultTags: []
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

        const regionOutput = TerraformOutput.mock.calls.find(
          (call: any) => call[1] === 'aws-region'
        );
        expect(regionOutput[2].value).toBe(region);
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

    test("should use correct region in output", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-south-1'
      });

      const regionOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-region'
      );
      expect(regionOutput[2].value).toBe('ap-south-1');
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

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          tags: expect.objectContaining({
            Stack: 'MyCustomStack'
          })
        })
      );
    });

    test("should include stack ID in security group names", () => {
      const app = new App();
      new TapStack(app, "ProductionStack");

      const appSgCall = SecurityGroupConstruct.mock.calls[0];
      expect(appSgCall[2].name).toBe('ProductionStack-app-security-group');

      const dbSgCall = SecurityGroupConstruct.mock.calls[1];
      expect(dbSgCall[2].name).toBe('ProductionStack-db-security-group');
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
        ManagedBy: 'Terraform',
        Stack: 'TestStack'
      };

      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(NetworkConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-network',
        expect.objectContaining({
          tags: expectedTags
        })
      );

      SecurityGroupConstruct.mock.calls.forEach((call: any) => {
        expect(call[2].tags).toEqual(expectedTags);
      });
    });

    test("should consistently apply ManagedBy tag", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcCall = VpcConstruct.mock.calls[0];
      expect(vpcCall[2].tags.ManagedBy).toBe('Terraform');

      const networkCall = NetworkConstruct.mock.calls[0];
      expect(networkCall[2].tags.ManagedBy).toBe('Terraform');

      const appSgCall = SecurityGroupConstruct.mock.calls[0];
      expect(appSgCall[2].tags.ManagedBy).toBe('Terraform');
    });
  });

  describe("Security Group Rules", () => {
    test("should configure app security group with HTTP and HTTPS ingress", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const appSgCall = SecurityGroupConstruct.mock.calls[0];
      const ingressRules = appSgCall[2].ingressRules;

      expect(ingressRules).toHaveLength(2);
      expect(ingressRules).toContainEqual({
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS from anywhere'
      });
      expect(ingressRules).toContainEqual({
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP from anywhere'
      });
    });

    test("should configure database security group with MySQL ingress", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const dbSgCall = SecurityGroupConstruct.mock.calls[1];
      const ingressRules = dbSgCall[2].ingressRules;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0]).toEqual({
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow MySQL from VPC'
      });
    });

    test("should configure egress rules for all security groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      SecurityGroupConstruct.mock.calls.forEach((call: any) => {
        const egressRules = call[2].egressRules;
        expect(egressRules).toHaveLength(1);
        expect(egressRules[0]).toEqual({
          fromPort: 0,
          toPort: 65535,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic'
        });
      });
    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(VpcConstruct).toHaveBeenCalledTimes(1);
      expect(NetworkConstruct).toHaveBeenCalledTimes(1);
      expect(SecurityGroupConstruct).toHaveBeenCalledTimes(2);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(DataAwsAvailabilityZones).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
    });

    test("should create resources with consistent naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'test'
      });

      const appSgCall = SecurityGroupConstruct.mock.calls[0];
      expect(appSgCall[2].name).toBe('TestStack-app-security-group');

      const dbSgCall = SecurityGroupConstruct.mock.calls[1];
      expect(dbSgCall[2].name).toBe('TestStack-db-security-group');

      const networkCall = NetworkConstruct.mock.calls[0];
      expect(networkCall[2].tags.Environment).toBe('test');
    });

    test("should create exactly 10 outputs for complete stack", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(10);
    });
  });

  describe("Subnet Configuration", () => {
    test("should configure correct CIDR blocks for subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkCall = NetworkConstruct.mock.calls[0];
      
      expect(networkCall[2].publicSubnetCidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
      expect(networkCall[2].privateSubnetCidrs).toEqual(['10.0.10.0/24', '10.0.11.0/24']);
    });

    test("should assign subnets to different availability zones", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkCall = NetworkConstruct.mock.calls[0];
      expect(networkCall[2].availabilityZones).toEqual(['us-east-1a', 'us-east-1b']);
    });
  });

  describe("Module IDs", () => {
    test("should use correct module IDs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Check module IDs
      expect(VpcConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.anything()
      );

      expect(NetworkConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-network',
        expect.anything()
      );

      const sgCalls = SecurityGroupConstruct.mock.calls;
      expect(sgCalls[0][1]).toBe('app-sg');
      expect(sgCalls[1][1]).toBe('db-sg');
    });
  });
});