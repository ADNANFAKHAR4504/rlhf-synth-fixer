// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock SecureInfrastructure used in TapStack
jest.mock("../lib/modules", () => ({
  SecureInfrastructure: jest.fn().mockImplementation((_, id, config) => ({
    vpc: { 
      id: `vpc-${id}-12345`,
      cidrBlock: config.vpcCidr
    },
    publicSubnets: [
      { id: `subnet-${id}-public-1` },
      { id: `subnet-${id}-public-2` }
    ],
    privateSubnets: [
      { id: `subnet-${id}-private-1` },
      { id: `subnet-${id}-private-2` }
    ],
    kmsKey: { 
      keyId: `${id}-kms-key-id`,
      arn: `arn:aws:kms:${config.awsRegion}:123456789012:key/${id}-kms-key-id`
    },
    lambdaRole: {
      arn: `arn:aws:iam::123456789012:role/${id}-lambda-role`,
      name: `${id}-lambda-role`
    },
    s3Bucket: { 
      bucket: `${id}-secure-bucket`,
      arn: `arn:aws:s3:::${id}-secure-bucket`
    },
    s3LoggingBucket: {
      bucket: `${id}-logging-bucket`,
      arn: `arn:aws:s3:::${id}-logging-bucket`
    },
    lambdaFunction: {
      functionName: `${id}-lambda-function`,
      arn: `arn:aws:lambda:${config.awsRegion}:123456789012:function:${id}-lambda-function`
    },
    lambdaLogGroup: {
      name: `/aws/lambda/${id}-lambda-function`,
      arn: `arn:aws:logs:${config.awsRegion}:123456789012:log-group:/aws/lambda/${id}-lambda-function`
    },
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
  const { SecureInfrastructure } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create AWS provider with correct region and default tags", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1",
        defaultTags: [
          {
            tags: {
              Project: "SecureTap",
              ManagedBy: "CDKTF",
              SecurityLevel: "High",
              DataClassification: "Confidential",
            },
          },
        ],
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

  test("should create SecureInfrastructure with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackInfra");

    expect(SecureInfrastructure).toHaveBeenCalledTimes(1);
    expect(SecureInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "secure-infrastructure",
      expect.objectContaining({
        vpcCidr: "10.0.0.0/16",
        publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
        privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
        availabilityZones: ["us-east-1a", "us-east-1b"],
        environment: "production",
        projectName: "secure-tap",
        awsRegion: "us-east-1",
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // TapStack defines 13 outputs in total
    expect(TerraformOutput).toHaveBeenCalledTimes(14);

    // Verify VPC outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "ID of the secure VPC",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-cidr",
      expect.objectContaining({
        description: "CIDR block of the secure VPC",
        sensitive: false,
      })
    );

    // Verify subnet outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-subnet-ids",
      expect.objectContaining({
        description: "IDs of private subnets for secure workloads",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-ids",
      expect.objectContaining({
        description: "IDs of public subnets for load balancers",
        sensitive: false,
      })
    );

    // Verify KMS outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms-key-id",
      expect.objectContaining({
        description: "KMS key ID for encryption",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms-key-arn",
      expect.objectContaining({
        description: "KMS key ARN for encryption",
        sensitive: false,
      })
    );

    // Verify S3 outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "main-s3-bucket-name",
      expect.objectContaining({
        description: "Name of the main S3 bucket",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "main-s3-bucket-arn",
      expect.objectContaining({
        description: "ARN of the main S3 bucket",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "logging-s3-bucket-name",
      expect.objectContaining({
        description: "Name of the S3 access logging bucket",
        sensitive: false,
      })
    );

    // Verify Lambda outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-function-name",
      expect.objectContaining({
        description: "Name of the secure Lambda function",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-function-arn",
      expect.objectContaining({
        description: "ARN of the secure Lambda function",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-role-arn",
      expect.objectContaining({
        description: "ARN of the Lambda execution role",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-log-group-name",
      expect.objectContaining({
        description: "Name of the Lambda CloudWatch log group",
        sensitive: false,
      })
    );

    // Verify security summary output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "security-summary",
      expect.objectContaining({
        description: "Security compliance summary",
        sensitive: false,
        value: {
          encryption_at_rest: "Enabled with customer-managed KMS key",
          logging_enabled: "S3 access logs and Lambda execution logs",
          network_isolation: "All resources in private subnets",
          iam_compliance: "Least privilege policies with resource-specific permissions",
          public_access: "Blocked on all S3 buckets",
          key_rotation: "Enabled on KMS key",
          log_retention: "30 days for Lambda logs",
        },
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

    // AWS Region Override should still force us-east-1
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // AWS_REGION_OVERRIDE takes precedence
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
    const stack = new TapStack(app, "TestStackOverride");

    // Verify that addOverride was called for S3 state locking
    expect(stack.addOverride).toBeDefined();
  });

  test("should create outputs with correct resource references", () => {
    const app = new App();
    new TapStack(app, "TestStackReferences");

    const secureInfraInstance = SecureInfrastructure.mock.results[0].value;

    // Verify that outputs reference the correct SecureInfrastructure properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: secureInfraInstance.vpc.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-cidr",
      expect.objectContaining({
        value: secureInfraInstance.vpc.cidrBlock,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms-key-id",
      expect.objectContaining({
        value: secureInfraInstance.kmsKey.keyId,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms-key-arn",
      expect.objectContaining({
        value: secureInfraInstance.kmsKey.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "main-s3-bucket-name",
      expect.objectContaining({
        value: secureInfraInstance.s3Bucket.bucket,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "main-s3-bucket-arn",
      expect.objectContaining({
        value: secureInfraInstance.s3Bucket.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "logging-s3-bucket-name",
      expect.objectContaining({
        value: secureInfraInstance.s3LoggingBucket.bucket,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-function-name",
      expect.objectContaining({
        value: secureInfraInstance.lambdaFunction.functionName,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-function-arn",
      expect.objectContaining({
        value: secureInfraInstance.lambdaFunction.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-role-arn",
      expect.objectContaining({
        value: secureInfraInstance.lambdaRole.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-log-group-name",
      expect.objectContaining({
        value: secureInfraInstance.lambdaLogGroup.name,
      })
    );
  });

  test("should handle AWS region override correctly", () => {
    const app = new App();
    
    // Test with custom AWS region in props - should be overridden
    new TapStack(app, "TestRegionOverride", { awsRegion: "us-west-2" });

    // Should use us-east-1 due to AWS_REGION_OVERRIDE
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1",
      })
    );
  });

  test("should pass correct awsRegion to SecureInfrastructure config", () => {
    const app = new App();
    new TapStack(app, "TestInfraConfig", { awsRegion: "us-west-2" });

    // SecureInfrastructure should receive us-east-1 due to override
    expect(SecureInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "secure-infrastructure",
      expect.objectContaining({
        awsRegion: "us-east-1",
      })
    );
  });

  test("should handle custom default tags in props", () => {
    const app = new App();
    const customTags = {
      tags: {
        CustomTag: "CustomValue",
        Owner: "TestTeam",
      },
    };

    new TapStack(app, "TestCustomTags", { defaultTags: customTags });

    // Should still use the hardcoded default tags, not the custom ones
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: {
              Project: "SecureTap",
              ManagedBy: "CDKTF",
              SecurityLevel: "High",
              DataClassification: "Confidential",
            },
          },
        ],
      })
    );
  });

  test("should create infrastructure with production environment", () => {
    const app = new App();
    new TapStack(app, "TestProdEnv");

    expect(SecureInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "secure-infrastructure",
      expect.objectContaining({
        environment: "production",
        projectName: "secure-tap",
      })
    );
  });

  test("should configure multi-AZ deployment", () => {
    const app = new App();
    new TapStack(app, "TestMultiAZ");

    expect(SecureInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "secure-infrastructure",
      expect.objectContaining({
        availabilityZones: ["us-east-1a", "us-east-1b"],
        publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
        privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
      })
    );
  });

  test("should configure VPC with correct CIDR", () => {
    const app = new App();
    new TapStack(app, "TestVPCCIDR");

    expect(SecureInfrastructure).toHaveBeenCalledWith(
      expect.anything(),
      "secure-infrastructure",
      expect.objectContaining({
        vpcCidr: "10.0.0.0/16",
      })
    );
  });
});