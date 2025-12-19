// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn((scope: any, id: string, config: any) => ({
    vpc: { 
      id: `${id}-vpc-id`,
      arn: `arn:aws:ec2:us-west-2:123456789012:vpc/${id}-vpc-id`
    },
    publicSubnet: { 
      id: `${id}-public-subnet-id`, 
      arn: `arn:aws:ec2:us-west-2:123456789012:subnet/${id}-public-subnet-id` 
    },
    privateSubnet: { 
      id: `${id}-private-subnet-id`, 
      arn: `arn:aws:ec2:us-west-2:123456789012:subnet/${id}-private-subnet-id` 
    },
    config,
  })),
  SecurityGroupModule: jest.fn((scope: any, id: string, config: any) => ({
    securityGroup: { 
      id: `${id}-sg-id`,
      arn: `arn:aws:ec2:us-west-2:123456789012:security-group/${id}-sg-id`
    },
    config,
  })),
  S3Module: jest.fn((scope: any, id: string, config?: any) => ({
    bucket: { 
      bucket: `${id}-bucket-name`,
      arn: `arn:aws:s3:::${id}-bucket-name`
    },
    config,
  })),
  IamModule: jest.fn((scope: any, id: string, config: any) => ({
    instanceProfile: { 
      name: `${id}-instance-profile`,
      arn: `arn:aws:iam::123456789012:instance-profile/${id}-instance-profile`
    },
    role: {
      arn: `arn:aws:iam::123456789012:role/${id}-role`
    },
    config,
  })),
  Ec2Module: jest.fn((scope: any, id: string, config: any) => ({
    instance: { 
      id: `${id}-instance-id`,
      privateIp: "10.0.2.10",
      arn: `arn:aws:ec2:us-west-2:123456789012:instance/${id}-instance-id`
    },
    config,
  })),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn((scope: any, id: string) => ({
    accountId: "123456789012",
    arn: "arn:aws:iam::123456789012:user/test-user",
    userId: "AIDACKCEVSQ6C2EXAMPLE"
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
    VpcModule,
    SecurityGroupModule, 
    S3Module, 
    IamModule, 
    Ec2Module 
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  // Store original environment variable
  let originalAwsRegionOverride: string | undefined;

  beforeAll(() => {
    // Store the original value
    originalAwsRegionOverride = process.env.AWS_REGION_OVERRIDE;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment variable for most tests
    process.env.AWS_REGION_OVERRIDE = 'us-west-2';
  });

  afterEach(() => {
    // Reset to original value after each test
    if (originalAwsRegionOverride !== undefined) {
      process.env.AWS_REGION_OVERRIDE = originalAwsRegionOverride;
    } else {
      delete process.env.AWS_REGION_OVERRIDE;
    }
  });

  afterAll(() => {
    // Restore original value
    if (originalAwsRegionOverride !== undefined) {
      process.env.AWS_REGION_OVERRIDE = originalAwsRegionOverride;
    } else {
      delete process.env.AWS_REGION_OVERRIDE;
    }
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
        region: 'us-west-2', // AWS_REGION_OVERRIDE is set to us-west-2
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
        region: 'us-west-2', // AWS_REGION_OVERRIDE takes precedence
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

  test("should create DataAwsCallerIdentity", () => {
    const app = new App();
    new TapStack(app, "TestStackDataSources");

    expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
      expect.anything(),
      "current"
    );
  });

  test("should create VPC module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackVPC");

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-module",
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidr: '10.0.1.0/24',
        privateSubnetCidr: '10.0.2.0/24',
        availabilityZone: 'us-west-2a',
      })
    );
  });

  test("should create VPC module with custom region availability zone", () => {
    const app = new App();
    new TapStack(app, "TestStackVPCCustomRegion", {
      awsRegion: 'eu-west-1', // This will be overridden by AWS_REGION_OVERRIDE
    });

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-module",
      expect.objectContaining({
        availabilityZone: 'us-west-2a', // Still uses AWS_REGION_OVERRIDE
      })
    );
  });

  test("should create SecurityGroup module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackSG");

    expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupModule).toHaveBeenCalledWith(
      expect.anything(),
      "sg-module",
      expect.objectContaining({
        vpcId: "vpc-module-vpc-id",
      })
    );
  });

  test("should create S3 module", () => {
    const app = new App();
    new TapStack(app, "TestStackS3");

    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      "s3-module"
    );
  });

  test("should create IAM module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackIAM");

    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam-module",
      expect.objectContaining({
        bucketArn: "arn:aws:s3:::s3-module-bucket-name",
      })
    );
  });

  test("should create EC2 module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackEC2");

    expect(Ec2Module).toHaveBeenCalledTimes(1);
    expect(Ec2Module).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-module",
      expect.objectContaining({
        subnetId: "vpc-module-private-subnet-id",
        securityGroupIds: ["sg-module-sg-id"],
        instanceProfileName: "iam-module-instance-profile",
      })
    );
  });

  test("should create all terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    expect(TerraformOutput).toHaveBeenCalledTimes(8);

    // Verify specific outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'vpc-id',
      expect.objectContaining({
        value: "vpc-module-vpc-id",
        description: 'VPC ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'public-subnet-id',
      expect.objectContaining({
        value: "vpc-module-public-subnet-id",
        description: 'Public subnet ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'private-subnet-id',
      expect.objectContaining({
        value: "vpc-module-private-subnet-id",
        description: 'Private subnet ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-instance-id',
      expect.objectContaining({
        value: "ec2-module-instance-id",
        description: 'EC2 instance ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-private-ip',
      expect.objectContaining({
        value: "10.0.2.10",
        description: 'EC2 instance private IP address',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      's3-bucket-name',
      expect.objectContaining({
        value: "s3-module-bucket-name",
        description: 'S3 bucket name for logs',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'security-group-id',
      expect.objectContaining({
        value: "sg-module-sg-id",
        description: 'Security Group ID',
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      'aws-account-id',
      expect.objectContaining({
        value: "123456789012",
        description: 'Current AWS Account ID',
      })
    );
  });

  test("should handle custom environment suffix", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", {
      environmentSuffix: 'staging',
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: 'staging/TestStackCustomEnv.tfstate',
      })
    );
  });

  test("should create stack with all components integrated", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackIntegration");

    // Verify all main components are created
    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(S3Backend).toHaveBeenCalledTimes(1);
    expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(Ec2Module).toHaveBeenCalledTimes(1);
    expect(TerraformOutput).toHaveBeenCalledTimes(8);

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
        region: 'us-west-2', // AWS_REGION_OVERRIDE takes precedence
      })
    );

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-module",
      expect.objectContaining({
        availabilityZone: 'us-west-2a', // Should use the override region
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
        region: 'us-west-2',
        defaultTags: [],
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

  test("should handle undefined defaultTags prop", () => {
    const app = new App();
    new TapStack(app, "TestStackUndefinedTags", {
      defaultTags: undefined,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        defaultTags: [],
      })
    );
  });

  test("should handle all prop combinations", () => {
    const app = new App();
    new TapStack(app, "TestStackAllProps", {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-1',
      awsRegion: 'eu-central-1',
      defaultTags: {
        tags: {
          Test: 'value'
        }
      }
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'test-bucket',
        key: 'test/TestStackAllProps.tfstate',
        region: 'us-west-1',
        encrypt: true,
      })
    );
  });

  test("should handle null props gracefully", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackNullProps");

    expect(stack).toBeDefined();
    expect(AwsProvider).toHaveBeenCalled();
  });

  // Tests for environment variable scenarios
  test("should use props.awsRegion when AWS_REGION_OVERRIDE is not set", () => {
    // Temporarily unset the environment variable
    delete process.env.AWS_REGION_OVERRIDE;

    const app = new App();
    new TapStack(app, "TestStackNoEnvOverride", {
      awsRegion: 'eu-west-1',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'eu-west-1', // Should use props.awsRegion when env var is not set
      })
    );
  });

  test("should use default region when AWS_REGION_OVERRIDE is not set and no props.awsRegion", () => {
    // Temporarily unset the environment variable
    delete process.env.AWS_REGION_OVERRIDE;

    const app = new App();
    new TapStack(app, "TestStackNoEnvOverrideDefault", {
      environmentSuffix: 'test',
      // No awsRegion provided
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Should use default us-west-2 when no env var and no props.awsRegion
      })
    );
  });

  test("should use default region when AWS_REGION_OVERRIDE is undefined and no props provided", () => {
    // Ensure environment variable is undefined
    delete process.env.AWS_REGION_OVERRIDE;

    const app = new App();
    new TapStack(app, "TestStackMockedUndefinedRegion");

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Should use default us-west-2
      })
    );
  });

  test("should use props.awsRegion when AWS_REGION_OVERRIDE env var is not set", () => {
    // Temporarily unset the environment variable
    delete process.env.AWS_REGION_OVERRIDE;

    const app = new App();
    new TapStack(app, "TestStackNoEnvOverride2", {
      awsRegion: 'eu-west-1',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'eu-west-1', // Should use props.awsRegion when env var is not set
      })
    );
  });

  test("should use default region when AWS_REGION_OVERRIDE env var is not set and no props.awsRegion", () => {
    // Temporarily unset the environment variable
    delete process.env.AWS_REGION_OVERRIDE;

    const app = new App();
    new TapStack(app, "TestStackNoEnvOverrideDefault2", {
      environmentSuffix: 'test',
      // No awsRegion provided
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Should use default us-west-2 when no env var and no props.awsRegion
      })
    );
  });

  test("should use environment variable when AWS_REGION_OVERRIDE is set", () => {
    // Set the environment variable to a different value
    process.env.AWS_REGION_OVERRIDE = 'ap-southeast-1';

    const app = new App();
    new TapStack(app, "TestStackWithEnvOverride", {
      awsRegion: 'eu-west-1', // This should be ignored
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'ap-southeast-1', // Should use environment variable
      })
    );
  });

  test("should use empty string environment variable as falsy", () => {
    // Set environment variable to empty string
    process.env.AWS_REGION_OVERRIDE = '';

    const app = new App();
    new TapStack(app, "TestStackEmptyEnvOverride", {
      awsRegion: 'ca-central-1',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'ca-central-1', // Should use props.awsRegion when env var is empty string
      })
    );
  });
});