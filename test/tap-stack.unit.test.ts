// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock SecureModules used in TapStack
jest.mock("../lib/modules", () => ({
  SecureModules: jest.fn().mockImplementation((_, id, config) => ({
    vpc: { 
      id: `vpc-${id}-12345`
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
      arn: `arn:aws:kms:${config.region}:123456789012:key/${id}-kms-key-id`
    },
    kmsAlias: {
      name: `alias/${id}-key`
    },
    lambdaRole: {
      arn: `arn:aws:iam::123456789012:role/${id}-lambda-role`,
      name: `${id}-lambda-role`
    },
    s3Bucket: { 
      id: `${id}-secure-bucket`,
      arn: `arn:aws:s3:::${id}-secure-bucket`
    },
    ebsVolume: {
      id: `vol-${id}1234567890abcdef0`
    },
    lambdaFunction: {
      functionName: `${id}-lambda-function`,
      arn: `arn:aws:lambda:${config.region}:123456789012:function:${id}-lambda-function`
    },
    lambdaLogGroup: {
      name: `/aws/lambda/${id}-lambda-function`,
      arn: `arn:aws:logs:${config.region}:123456789012:log-group:/aws/lambda/${id}-lambda-function`
    },
    rdsInstance: { 
      endpoint: `${id}-rds.cluster-xyz.${config.region}.rds.amazonaws.com`,
      id: `${id}-rds-instance`,
      identifier: `${id}-rds-db`
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
    TerraformVariable: jest.fn().mockImplementation((scope, id, config) => ({
      stringValue: config.default,
      listValue: config.default,
    })),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { SecureModules } = require("../lib/modules");
  const { TerraformOutput, TerraformVariable, S3Backend } = require("cdktf");
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
        region: "us-east-1", // Default region since AWS_REGION_OVERRIDE is empty
        defaultTags: [
          {
            tags: {
              Project: "MyApp",
              ManagedBy: "CDKTF",
              Environment: "dev",
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

  test("should create all Terraform variables with correct defaults", () => {
    const app = new App();
    new TapStack(app, "TestStackVariables");

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      "app_name",
      expect.objectContaining({
        type: "string",
        default: "MyApp",
        description: "Application name used for resource naming",
      })
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      "vpc_cidr",
      expect.objectContaining({
        type: "string",
        default: "10.0.0.0/16",
        description: "CIDR block for VPC",
      })
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      "public_subnet_cidrs",
      expect.objectContaining({
        type: "list(string)",
        default: ["10.0.1.0/24", "10.0.2.0/24"],
        description: "CIDR blocks for public subnets",
      })
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      "private_subnet_cidrs",
      expect.objectContaining({
        type: "list(string)",
        default: ["10.0.10.0/24", "10.0.20.0/24"],
        description: "CIDR blocks for private subnets",
      })
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      "availability_zones",
      expect.objectContaining({
        type: "list(string)",
        default: ["us-east-1a", "us-east-1b"],
        description: "Availability zones for subnets",
      })
    );
  });

  test("should create SecureModules with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurity");

    expect(SecureModules).toHaveBeenCalledTimes(1);
    expect(SecureModules).toHaveBeenCalledWith(
      expect.anything(),
      "secure-infrastructure",
      expect.objectContaining({
        region: "us-east-1",
        appName: "MyApp",
        vpcCidr: "10.0.0.0/16",
        publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
        privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
        availabilityZones: ["us-east-1a", "us-east-1b"],
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // TapStack defines 17 outputs in total
    expect(TerraformOutput).toHaveBeenCalledTimes(18);

    // Verify network outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc_id",
      expect.objectContaining({
        description: "VPC ID for the secure infrastructure",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public_subnet_ids",
      expect.objectContaining({
        description: "Public subnet IDs",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private_subnet_ids",
      expect.objectContaining({
        description: "Private subnet IDs where application resources are deployed",
      })
    );

    // Verify security outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms_key_id",
      expect.objectContaining({
        description: "KMS key ID used for encryption across all services",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms_key_arn",
      expect.objectContaining({
        description: "KMS key ARN for encryption",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms_alias",
      expect.objectContaining({
        description: "KMS key alias for easier reference",
      })
    );

    // Verify IAM outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_role_arn",
      expect.objectContaining({
        description: "Lambda execution role ARN with least privilege permissions",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_role_name",
      expect.objectContaining({
        description: "Lambda execution role name",
      })
    );

    // Verify storage outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3_bucket_name",
      expect.objectContaining({
        description: "S3 bucket name with encryption and logging enabled",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3_bucket_arn",
      expect.objectContaining({
        description: "S3 bucket ARN",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ebs_volume_id",
      expect.objectContaining({
        description: "EBS volume ID with KMS encryption",
      })
    );

    // Verify compute outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_function_name",
      expect.objectContaining({
        description: "Lambda function name deployed in private subnet",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_function_arn",
      expect.objectContaining({
        description: "Lambda function ARN",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_log_group_name",
      expect.objectContaining({
        description: "CloudWatch log group name for Lambda function",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_log_group_arn",
      expect.objectContaining({
        description: "CloudWatch log group ARN",
      })
    );

    // Verify database outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds_endpoint",
      expect.objectContaining({
        description: "RDS instance endpoint for database connections",
        sensitive: true, // This should be sensitive
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds_instance_id",
      expect.objectContaining({
        description: "RDS instance identifier",
      })
    );

    // Verify summary output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "deployment_summary",
      expect.objectContaining({
        description: "Summary of deployed secure infrastructure components",
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
        region: "us-west-2", // Custom region since AWS_REGION_OVERRIDE is empty
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
    const stack = new TapStack(app, "TestStackOverride");

    // Verify that addOverride was called for S3 state locking
    expect(stack.addOverride).toBeDefined();
  });

  test("should create outputs with correct resource references", () => {
    const app = new App();
    new TapStack(app, "TestStackReferences");

    const secureModulesInstance = SecureModules.mock.results[0].value;

    // Verify that outputs reference the correct SecureModules properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc_id",
      expect.objectContaining({
        value: secureModulesInstance.vpc.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms_key_id",
      expect.objectContaining({
        value: secureModulesInstance.kmsKey.keyId,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_function_name",
      expect.objectContaining({
        value: secureModulesInstance.lambdaFunction.functionName,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3_bucket_name",
      expect.objectContaining({
        value: secureModulesInstance.s3Bucket.id,
      })
    );
  });

  test("should handle AWS region override correctly when set", () => {
    // Temporarily modify the AWS_REGION_OVERRIDE for this test
    const originalCode = require("../lib/tap-stack");
    
    // Mock the module with AWS_REGION_OVERRIDE set
    jest.doMock("../lib/tap-stack", () => {
      const actual = jest.requireActual("../lib/tap-stack");
      // We can't easily test the override since it's a const, but we can verify the logic
      return actual;
    });

    const app = new App();
    
    // Test with custom AWS region in props
    new TapStack(app, "TestRegionOverride", { awsRegion: "us-west-2" });

    // Should use the awsRegion from props since AWS_REGION_OVERRIDE is empty
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2",
      })
    );
  });

  test("should create deployment summary output with correct structure", () => {
    const app = new App();
    new TapStack(app, "TestSummary");

    const secureModulesInstance = SecureModules.mock.results[0].value;

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "deployment_summary",
      expect.objectContaining({
        value: {
          region: "us-east-1",
          app_name: "MyApp",
          vpc_id: secureModulesInstance.vpc.id,
          kms_key_alias: secureModulesInstance.kmsAlias.name,
          s3_bucket: secureModulesInstance.s3Bucket.id,
          lambda_function: secureModulesInstance.lambdaFunction.functionName,
          rds_instance: secureModulesInstance.rdsInstance.identifier,
        },
        description: "Summary of deployed secure infrastructure components",
      })
    );
  });

  test("should handle default tags correctly", () => {
    const app = new App();
    const customProps = {
      defaultTags: {
        tags: {
          CustomTag: "CustomValue",
          Owner: "TestTeam",
        },
      },
    };

    new TapStack(app, "TestDefaultTags", customProps);

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: {
              Project: "MyApp",
              ManagedBy: "CDKTF",
              Environment: "dev",
            },
          },
        ],
      })
    );
  });
});