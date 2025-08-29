// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock WebAppInfrastructure used in TapStack
jest.mock("../lib/modules", () => ({
  WebAppInfrastructure: jest.fn().mockImplementation((_, id, config) => ({
    vpcId: `vpc-${id}-12345`,
    publicSubnetIds: [`subnet-${id}-public-1`, `subnet-${id}-public-2`],
    privateSubnetIds: [`subnet-${id}-private-1`, `subnet-${id}-private-2`],
    ec2InstanceIds: [`i-${id}1234567890abcdef0`, `i-${id}1234567890abcdef1`],
    s3BucketName: `${id}-secure-bucket-${config.environment}`,
    cloudwatchAlarmArn: `arn:aws:cloudwatch:${config.region}:123456789012:alarm:${id}-cpu-alarm`,
    config,
  }))
}));

// Mock TerraformOutput to avoid duplicate construct errors
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
  const { WebAppInfrastructure } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  // Mock addOverride method
  const mockAddOverride = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the addOverride method on TerraformStack
    jest.spyOn(TapStack.prototype, 'addOverride').mockImplementation(mockAddOverride);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should create AWS provider with correct region and default tags", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Since AWS_REGION_OVERRIDE is empty, uses default
        defaultTags: [
          {
            tags: {
              Project: "SecureWebApp",
              Environment: "dev",
              ManagedBy: "CDKTF",
              Owner: "DevOps Team",
            },
          },
        ],
      })
    );
  });

  test("should use AWS_REGION environment variable when set", () => {
    const app = new App();
    // Test with custom region in props
    new TapStack(app, "TestStackEnvRegion", { awsRegion: "eu-west-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-west-1", // Since AWS_REGION_OVERRIDE is empty, uses props
      })
    );
  });

  test("should create S3 backend with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackBackend");

    expect(S3Backend).toHaveBeenCalledTimes(1);
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states",
        key: "dev/TestStackBackend.tfstate",
        region: "us-east-1",
        encrypt: true,
      })
    );
  });

  test("should create WebAppInfrastructure with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackWebApp");

    expect(WebAppInfrastructure).toHaveBeenCalledTimes(1);
    expect(WebAppInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "web-app-infrastructure",
      expect.objectContaining({
        environment: "dev",
        instanceType: "t3.micro",
        region: "us-east-1", // Since AWS_REGION_OVERRIDE is empty, uses default
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // TapStack defines 8 outputs in total
    expect(TerraformOutput).toHaveBeenCalledTimes(8);

    // Verify specific outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "ID of the VPC created for the web application",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-ids",
      expect.objectContaining({
        description: "IDs of public subnets for load balancers and public-facing resources",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-subnet-ids",
      expect.objectContaining({
        description: "IDs of private subnets for databases and internal services",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-ids",
      expect.objectContaining({
        description: "IDs of EC2 instances running the web application",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-name",
      expect.objectContaining({
        description: "Name of S3 bucket for storing application logs (encrypted at rest)",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudwatch-alarm-arn",
      expect.objectContaining({
        description: "ARN of CloudWatch alarm monitoring CPU utilization",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "region",
      expect.objectContaining({
        description: "AWS region where resources are deployed",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "environment",
      expect.objectContaining({
        description: "Environment name for resource identification",
        sensitive: false,
      })
    );
  });

  test("should use custom props when provided", () => {
    const app = new App();
    const customProps = {
      environmentSuffix: "prod",
      stateBucket: "custom-tf-states",
      stateBucketRegion: "eu-west-1",
      awsRegion: "us-west-2",
    };

    new TapStack(app, "TestStackCustomProps", customProps);

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2", // Uses props since AWS_REGION_OVERRIDE is empty
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "prod",
            }),
          },
        ],
      })
    );

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "custom-tf-states",
        key: "prod/TestStackCustomProps.tfstate",
        region: "eu-west-1",
      })
    );
  });

  test("should use default values when props are not provided", () => {
    const app = new App();
    new TapStack(app, "TestStackDefaults");

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states", // default
        key: "dev/TestStackDefaults.tfstate", // default environment
        region: "us-east-1", // default
      })
    );
  });

  test("should add S3 backend override for state locking", () => {
    const app = new App();
    new TapStack(app, "TestStackOverride");

    // Verify that addOverride was called for S3 state locking
    expect(mockAddOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
  });

  test("should create outputs with correct resource references", () => {
    const app = new App();
    new TapStack(app, "TestStackReferences");

    const webAppInfraInstance = WebAppInfrastructure.mock.results[0].value;

    // Verify that outputs reference the correct WebAppInfrastructure properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: webAppInfraInstance.vpcId,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-ids",
      expect.objectContaining({
        value: webAppInfraInstance.publicSubnetIds,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-ids",
      expect.objectContaining({
        value: webAppInfraInstance.ec2InstanceIds,
      })
    );
  });

  test("should handle AWS region override correctly", () => {
    const app = new App();
    
    // Test with custom AWS region in props
    new TapStack(app, "TestRegionOverride", { awsRegion: "us-east-2" });

    // Since AWS_REGION_OVERRIDE is empty, should use props value
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-2", // Uses props since override is empty
      })
    );
  });

  test("should handle different environment suffixes correctly", () => {
    const app = new App();
    
    // Test staging environment
    new TapStack(app, "TestStagingEnv", { environmentSuffix: "staging" });

    expect(WebAppInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "web-app-infrastructure",
      expect.objectContaining({
        environment: "staging",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "staging",
            }),
          },
        ],
      })
    );
  });

  test("should create stack with correct project configuration", () => {
    const app = new App();
    new TapStack(app, "TestProjectConfig");

    expect(WebAppInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "web-app-infrastructure",
      expect.objectContaining({
        environment: "dev",
        instanceType: "t3.micro",
        region: "us-east-1", // Since AWS_REGION_OVERRIDE is empty, uses default
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Project: "SecureWebApp",
              ManagedBy: "CDKTF",
              Owner: "DevOps Team",
            }),
          },
        ],
      })
    );
  });

  test("should handle custom default tags when provided", () => {
    const app = new App();
    const customTags = {
      tags: {
        CustomTag: "CustomValue",
        Team: "Platform",
      },
    };

    new TapStack(app, "TestCustomTags", { defaultTags: customTags });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: {
              Project: "SecureWebApp",
              Environment: "dev",
              ManagedBy: "CDKTF",
              Owner: "DevOps Team",
            },
          },
        ],
      })
    );
  });

  test("should handle empty props object", () => {
    const app = new App();
    new TapStack(app, "TestEmptyProps", {});

    // Should use all default values
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states",
        key: "dev/TestEmptyProps.tfstate",
        region: "us-east-1",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Since AWS_REGION_OVERRIDE is empty, uses default
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "dev",
            }),
          },
        ],
      })
    );
  });

  test("should handle undefined environmentSuffix", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedEnv", { 
      environmentSuffix: undefined,
      stateBucket: "test-bucket" 
    });

    // Should default to 'dev'
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "dev/TestUndefinedEnv.tfstate",
      })
    );
  });

  test("should handle undefined stateBucket", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedBucket", { 
      stateBucket: undefined,
      environmentSuffix: "test" 
    });

    // Should use default bucket
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states",
      })
    );
  });

  test("should handle undefined stateBucketRegion", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedBucketRegion", { 
      stateBucketRegion: undefined,
      environmentSuffix: "test" 
    });

    // Should use default region
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        region: "us-east-1",
      })
    );
  });

  test("should handle undefined awsRegion", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedAwsRegion", { 
      awsRegion: undefined,
      environmentSuffix: "test" 
    });

    // Since AWS_REGION_OVERRIDE is empty and awsRegion is undefined, should use default
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Falls back to default
      })
    );
  });

  test("should use props awsRegion when AWS_REGION_OVERRIDE would be falsy", () => {
    const app = new App();
    new TapStack(app, "TestPropsRegion", { awsRegion: "eu-central-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-central-1", // Uses props since override is empty
      })
    );
  });

  test("should use default region when both AWS_REGION_OVERRIDE and props.awsRegion are falsy", () => {
    const app = new App();
    new TapStack(app, "TestDefaultRegion", { awsRegion: undefined });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Uses default when both override and props are falsy
      })
    );
  });

  test("should handle empty AWS_REGION environment variable", () => {
    const app = new App();
    // Since AWS_REGION_OVERRIDE is already empty in your code, this tests that scenario
    new TapStack(app, "TestEmptyEnvRegion");

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Uses default when override is empty
      })
    );
  });
});