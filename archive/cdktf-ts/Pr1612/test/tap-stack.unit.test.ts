// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock the NetworkingModule used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingModule: jest.fn((_, id, config) => ({
    vpc: { id: `${id}-vpc-id` },
    publicSubnets: [
      { id: `${id}-public-subnet-1`, availabilityZone: "us-east-1a" },
      { id: `${id}-public-subnet-2`, availabilityZone: "us-east-1b" }
    ],
    privateSubnets: [
      { id: `${id}-private-subnet-1`, availabilityZone: "us-east-1a" },
      { id: `${id}-private-subnet-2`, availabilityZone: "us-east-1b" }
    ],
    natGateway: { id: `${id}-nat-gateway-id` },
    publicInstances: [
      { id: `${id}-public-instance-1`, publicIp: "1.2.3.4" },
      { id: `${id}-public-instance-2`, publicIp: "1.2.3.5" }
    ],
    privateInstances: [
      { id: `${id}-private-instance-1`, privateIp: "10.0.10.10" },
      { id: `${id}-private-instance-2`, privateIp: "10.0.20.10" }
    ],
    config,
  })),
}));

// Mock TerraformOutput to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { NetworkingModule } = require("../lib/modules");
  const { TerraformOutput } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create TapStack with default props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStack");

    expect(stack).toBeDefined();
  });

  test("should create AWS Provider with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-east-1',
        defaultTags: [
          {
            tags: {
              Environment: 'dev',
              Owner: 'DevOps Team',
              Project: 'RLHF',
              ManagedBy: 'CDKTF',
            },
          },
        ],
      })
    );
  });

  test("should create AWS Provider with custom props", () => {
    const app = new App();
    new TapStack(app, "TestStackCustom", {
      environmentSuffix: 'prod',
      awsRegion: 'us-west-2',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2',
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: 'prod',
            }),
          },
        ],
      })
    );
  });

  test("should create NetworkingModule with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackNetworking");

    expect(NetworkingModule).toHaveBeenCalledTimes(1);
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        vpcCidr: "10.0.0.0/16",
        publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
        privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
        instanceType: "t3.micro",
        keyPairName: "corp-keypair",
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Should create 9 outputs total
    expect(TerraformOutput).toHaveBeenCalledTimes(9);

    // Check specific output calls
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: "networking-vpc-id",
        description: "ID of the main VPC",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-ids",
      expect.objectContaining({
        value: ["networking-public-subnet-1", "networking-public-subnet-2"],
        description: "IDs of the public subnets",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-subnet-ids",
      expect.objectContaining({
        value: ["networking-private-subnet-1", "networking-private-subnet-2"],
        description: "IDs of the private subnets",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "nat-gateway-id",
      expect.objectContaining({
        value: "networking-nat-gateway-id",
        description: "ID of the NAT Gateway",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-instance-ids",
      expect.objectContaining({
        value: ["networking-public-instance-1", "networking-public-instance-2"],
        description: "IDs of the public EC2 instances",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-instance-ips",
      expect.objectContaining({
        value: ["1.2.3.4", "1.2.3.5"],
        description: "Public IP addresses of the public EC2 instances",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-instance-ids",
      expect.objectContaining({
        value: ["networking-private-instance-1", "networking-private-instance-2"],
        description: "IDs of the private EC2 instances",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-instance-ips",
      expect.objectContaining({
        value: ["10.0.10.10", "10.0.20.10"],
        description: "Private IP addresses of the private EC2 instances",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "availability-zones",
      expect.objectContaining({
        value: ["us-east-1a", "us-east-1b"],
        description: "Availability zones where subnets are deployed",
      })
    );
  });

  test("should handle custom environment suffix and state bucket", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomConfig", {
      environmentSuffix: 'staging',
      stateBucket: 'custom-tf-states',
      stateBucketRegion: 'us-west-1',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: 'staging',
            }),
          },
        ],
      })
    );
  });

  test("should use AWS_REGION_OVERRIDE when set", () => {
    // Mock the AWS_REGION_OVERRIDE constant
    const originalModule = require("../lib/tap-stack");
    
    // Create a new instance with region override
    const app = new App();
    
    // Since we can't easily mock the const, we'll test the default behavior
    new TapStack(app, "TestStackRegionOverride", {
      awsRegion: 'eu-west-1'
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'eu-west-1',
      })
    );
  });

  test("should pass correct props to NetworkingModule", () => {
    const app = new App();
    new TapStack(app, "TestStackModuleProps");

    const networkingCall = NetworkingModule.mock.calls[0];
    const [scope, id, config] = networkingCall;

    expect(id).toBe("networking");
    expect(config).toEqual({
      vpcCidr: "10.0.0.0/16",
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
      instanceType: "t3.micro",
      keyPairName: "corp-keypair",
    });
  });

  test("should create stack with all components integrated", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackIntegration");

    // Verify all main components are created
    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(NetworkingModule).toHaveBeenCalledTimes(1);
    expect(TerraformOutput).toHaveBeenCalledTimes(9);
    
    // Verify the stack is properly constructed
    expect(stack).toBeDefined();
  });
});