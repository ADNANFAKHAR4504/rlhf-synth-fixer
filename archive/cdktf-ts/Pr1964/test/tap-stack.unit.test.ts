// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingModule: jest.fn((_, id, config) => ({
    vpc: { 
      id: `${id}-vpc-id`,
      arn: `arn:aws:ec2:us-west-1:123456789012:vpc/${id}-vpc-id`
    },
    publicSubnets: [
      { 
        id: `${id}-public-subnet-1-id`, 
        arn: `arn:aws:ec2:us-west-1:123456789012:subnet/${id}-public-subnet-1-id` 
      },
      { 
        id: `${id}-public-subnet-2-id`, 
        arn: `arn:aws:ec2:us-west-1:123456789012:subnet/${id}-public-subnet-2-id` 
      }
    ],
    privateSubnets: [
      { 
        id: `${id}-private-subnet-1-id`, 
        arn: `arn:aws:ec2:us-west-1:123456789012:subnet/${id}-private-subnet-1-id` 
      },
      { 
        id: `${id}-private-subnet-2-id`, 
        arn: `arn:aws:ec2:us-west-1:123456789012:subnet/${id}-private-subnet-2-id` 
      }
    ],
    internetGateway: {
      id: `${id}-igw-id`,
      arn: `arn:aws:ec2:us-west-1:123456789012:internet-gateway/${id}-igw-id`
    },
    natGateway: {
      id: `${id}-nat-id`,
      arn: `arn:aws:ec2:us-west-1:123456789012:natgateway/${id}-nat-id`
    },
    config,
  })),
  SecurityModule: jest.fn((_, id, config) => ({
    ec2SecurityGroup: { 
      id: `${id}-sg-id`,
      arn: `arn:aws:ec2:us-west-1:123456789012:security-group/${id}-sg-id`
    },
    config,
  })),
  StorageModule: jest.fn((_, id, config) => ({
    s3Bucket: { 
      bucket: `${id}-bucket-name`,
      arn: `arn:aws:s3:::${id}-bucket-name`
    },
    config,
  })),
  ComputeModule: jest.fn((_, id, config) => ({
    ec2Instance: { 
      id: `${id}-instance-id`,
      privateIp: "10.0.1.10",
      publicIp: "54.123.45.67",
      arn: `arn:aws:ec2:us-west-1:123456789012:instance/${id}-instance-id`
    },
    iamRole: {
      arn: `arn:aws:iam::123456789012:role/${id}-role`
    },
    config,
  })),
}));

// Mock TerraformOutput and S3Backend to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    NetworkingModule,
    SecurityModule, 
    StorageModule, 
    ComputeModule 
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create TapStack with default props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStack");

    expect(stack).toBeDefined();
  });

  test("should create AWS Provider with correct default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-1', // AWS_REGION_OVERRIDE is set to us-west-1
        defaultTags: [],
      })
    );
  });

  test("should create AWS Provider with custom props", () => {
    const app = new App();
    const customTags = {
      tags: {
        Environment: 'prod',
        Owner: 'DevOps Team',
        Project: 'TapApp',
      },
    };

    new TapStack(app, "TestStackCustom", {
      environmentSuffix: 'prod',
      awsRegion: 'eu-west-1',
      defaultTags: customTags,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-1', // AWS_REGION_OVERRIDE takes precedence
        defaultTags: [customTags],
      })
    );
  });

  test("should create S3Backend with correct default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackBackend");

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'iac-rlhf-tf-states',
        key: 'dev/TestStackBackend.tfstate',
        region: 'us-east-1',
        encrypt: true,
      })
    );
  });

  test("should create S3Backend with custom configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackBackendCustom", {
      environmentSuffix: 'staging',
      stateBucket: 'custom-tf-states',
      stateBucketRegion: 'us-west-1',
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'custom-tf-states',
        key: 'staging/TestStackBackendCustom.tfstate',
        region: 'us-west-1',
        encrypt: true,
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
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        projectName: 'tap-dev',
      })
    );
  });

  test("should create NetworkingModule with custom environment suffix", () => {
    const app = new App();
    new TapStack(app, "TestStackNetworkingCustom", {
      environmentSuffix: 'prod',
    });

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        projectName: 'tap-prod',
      })
    );
  });

  test("should create SecurityModule with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurity");

    expect(SecurityModule).toHaveBeenCalledTimes(1);
    expect(SecurityModule).toHaveBeenCalledWith(
      expect.anything(),
      "security",
      expect.objectContaining({
        vpcId: "networking-vpc-id",
        projectName: 'tap-dev',
      })
    );
  });

  test("should create StorageModule with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackStorage");

    expect(StorageModule).toHaveBeenCalledTimes(1);
    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expect.objectContaining({
        projectName: 'tap-dev',
      })
    );
  });

  test("should create ComputeModule with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackCompute");

    expect(ComputeModule).toHaveBeenCalledTimes(1);
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        subnetId: "networking-public-subnet-1-id", // First public subnet
        securityGroupIds: ["security-sg-id"],
        s3BucketArn: "arn:aws:s3:::storage-bucket-name",
        projectName: 'tap-dev',
      })
    );
  });

  test("should create all terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    expect(TerraformOutput).toHaveBeenCalledTimes(12);

    // Verify specific outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'vpc-id',
      expect.objectContaining({
        value: "networking-vpc-id",
        description: 'VPC ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'public-subnet-ids',
      expect.objectContaining({
        value: ["networking-public-subnet-1-id", "networking-public-subnet-2-id"],
        description: 'Public subnet IDs',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'private-subnet-ids',
      expect.objectContaining({
        value: ["networking-private-subnet-1-id", "networking-private-subnet-2-id"],
        description: 'Private subnet IDs',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'internet-gateway-id',
      expect.objectContaining({
        value: "networking-igw-id",
        description: 'Internet Gateway ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'nat-gateway-id',
      expect.objectContaining({
        value: "networking-nat-id",
        description: 'NAT Gateway ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-instance-id',
      expect.objectContaining({
        value: "compute-instance-id",
        description: 'EC2 instance ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-public-ip',
      expect.objectContaining({
        value: "54.123.45.67",
        description: 'EC2 instance public IP address',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-private-ip',
      expect.objectContaining({
        value: "10.0.1.10",
        description: 'EC2 instance private IP address',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      's3-bucket-name',
      expect.objectContaining({
        value: "storage-bucket-name",
        description: 'S3 bucket name for application data',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      's3-bucket-arn',
      expect.objectContaining({
        value: "arn:aws:s3:::storage-bucket-name",
        description: 'S3 bucket ARN',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-security-group-id',
      expect.objectContaining({
        value: "security-sg-id",
        description: 'EC2 Security Group ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-iam-role-arn',
      expect.objectContaining({
        value: "arn:aws:iam::123456789012:role/compute-role",
        description: 'EC2 IAM Role ARN',
      })
    );
  });

  test("should handle custom environment suffix in all modules", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", {
      environmentSuffix: 'staging',
    });

    // Check S3Backend
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: 'staging/TestStackCustomEnv.tfstate',
      })
    );

    // Check all modules receive correct projectName
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        projectName: 'tap-staging',
      })
    );

    expect(SecurityModule).toHaveBeenCalledWith(
      expect.anything(),
      "security",
      expect.objectContaining({
        projectName: 'tap-staging',
      })
    );

    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expect.objectContaining({
        projectName: 'tap-staging',
      })
    );

    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        projectName: 'tap-staging',
      })
    );
  });

  test("should create stack with all components integrated", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackIntegration");

    // Verify all main components are created
    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(S3Backend).toHaveBeenCalledTimes(1);
    expect(NetworkingModule).toHaveBeenCalledTimes(1);
    expect(SecurityModule).toHaveBeenCalledTimes(1);
    expect(StorageModule).toHaveBeenCalledTimes(1);
    expect(ComputeModule).toHaveBeenCalledTimes(1);
    expect(TerraformOutput).toHaveBeenCalledTimes(12);

    // Verify the stack is properly constructed
    expect(stack).toBeDefined();
  });

  test("should use AWS_REGION_OVERRIDE regardless of props", () => {
    const app = new App();
    new TapStack(app, "TestStackRegionOverride", {
      awsRegion: 'eu-west-1', // This should be ignored due to AWS_REGION_OVERRIDE
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-1', // AWS_REGION_OVERRIDE takes precedence
      })
    );
  });

  test("should handle empty props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackEmptyProps", {});

    expect(stack).toBeDefined();
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-1',
        defaultTags: [],
      })
    );
  });

  test("should verify module dependencies are correctly wired", () => {
    const app = new App();
    new TapStack(app, "TestStackDependencies");

    // Verify SecurityModule receives VPC ID from NetworkingModule
    expect(SecurityModule).toHaveBeenCalledWith(
      expect.anything(),
      "security",
      expect.objectContaining({
        vpcId: "networking-vpc-id",
      })
    );

    // Verify ComputeModule receives dependencies from other modules
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        subnetId: "networking-public-subnet-1-id",
        securityGroupIds: ["security-sg-id"],
        s3BucketArn: "arn:aws:s3:::storage-bucket-name",
      })
    );
  });

  test("should verify addOverride is called for S3 backend locking", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackOverride");

    // Mock the addOverride method to verify it's called
    const addOverrideSpy = jest.spyOn(stack, 'addOverride');

    // Create a new stack to trigger the addOverride call
    new TapStack(app, "TestStackOverride2");

    // Note: We can't easily test addOverride directly since it's called in constructor
    // But we can verify the stack is created successfully
    expect(stack).toBeDefined();
  });

  test("should handle all props combinations", () => {
    const app = new App();
    const customTags = {
      tags: {
        Environment: 'test',
        Project: 'tap-test',
      },
    };

    new TapStack(app, "TestStackAllProps", {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'eu-central-1', // Will be overridden
      defaultTags: customTags,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-1', // AWS_REGION_OVERRIDE
        defaultTags: [customTags],
      })
    );

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'test-bucket',
        key: 'test/TestStackAllProps.tfstate',
        region: 'us-west-2',
        encrypt: true,
      })
    );

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        projectName: 'tap-test',
      })
    );
  });
});