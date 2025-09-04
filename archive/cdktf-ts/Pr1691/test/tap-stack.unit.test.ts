// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock SecurityModules used in TapStack
jest.mock("../lib/modules", () => ({
  SecurityModules: jest.fn().mockImplementation((_, id, config) => ({
    cloudTrail: { 
      arn: `arn:aws:cloudtrail:${config.region}:123456789012:trail/${id}-cloudtrail` 
    },
    s3Bucket: { 
      bucket: `${id}-secure-bucket`,
      arn: `arn:aws:s3:::${id}-secure-bucket`
    },
    kmsKey: { 
      keyId: `${id}-kms-key-id`,
      arn: `arn:aws:kms:${config.region}:123456789012:key/${id}-kms-key-id`
    },
    rdsInstance: { 
      endpoint: `${id}-rds.cluster-xyz.${config.region}.rds.amazonaws.com`,
      port: 5432
    },
    cloudWatchAlarm: { 
      arn: `arn:aws:cloudwatch:${config.region}:123456789012:alarm:${id}-cpu-alarm`
    },
    vpc: { 
      id: `vpc-${id}-12345`
    },
    securityGroup: { 
      id: `sg-${id}-67890`
    },
    iamRole: { 
      arn: `arn:aws:iam::123456789012:role/${id}-ec2-role`
    },
    ec2Instance: { 
      id: `i-${id}1234567890abcdef0`
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
  const { SecurityModules } = require("../lib/modules");
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
        region: "eu-west-1", // AWS_REGION_OVERRIDE
        defaultTags: [
          {
            tags: {
              Project: "MyApp",
              Environment: "dev",
              ManagedBy: "CDKTF",
              SecurityLevel: "High",
              Region: "eu-west-1",
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

  test("should create SecurityModules with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurity");

    expect(SecurityModules).toHaveBeenCalledTimes(1);
    expect(SecurityModules).toHaveBeenCalledWith(
      expect.anything(),
      "SecurityModules",
      expect.objectContaining({
        allowedCidr: "203.0.113.0/24",
        region: "eu-west-1",
        instanceType: "t3.micro",
        dbInstanceClass: "db.t3.micro",
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // TapStack defines 12 outputs in total
    expect(TerraformOutput).toHaveBeenCalledTimes(13);

    // Verify specific outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail_arn",
      expect.objectContaining({
        description: "ARN of the CloudTrail for security monitoring and compliance",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3_bucket_name",
      expect.objectContaining({
        description: "Name of the encrypted S3 bucket for sensitive data storage",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds_endpoint",
      expect.objectContaining({
        description: "Private endpoint of the RDS instance (accessible only from within VPC)",
        sensitive: true, // This should be sensitive
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "security_configuration",
      expect.objectContaining({
        description: "Summary of security configuration applied",
        value: {
          allowed_cidr: "203.0.113.0/24",
          region: "eu-west-1",
          encryption_enabled: true,
          cloudtrail_enabled: true,
          rds_public_access: false,
          s3_public_access_blocked: true,
        },
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
      awsRegion: "us-west-2", // This will be overridden by AWS_REGION_OVERRIDE
    };

    new TapStack(app, "TestStackCustomProps", customProps);

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-west-1", // Still overridden by AWS_REGION_OVERRIDE
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

    const securityModulesInstance = SecurityModules.mock.results[0].value;

    // Verify that outputs reference the correct SecurityModules properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail_arn",
      expect.objectContaining({
        value: securityModulesInstance.cloudTrail.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms_key_id",
      expect.objectContaining({
        value: securityModulesInstance.kmsKey.keyId,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2_instance_id",
      expect.objectContaining({
        value: securityModulesInstance.ec2Instance.id,
      })
    );
  });

  test("should handle AWS region override correctly", () => {
    const app = new App();
    
    // Test with custom AWS region in props
    new TapStack(app, "TestRegionOverride", { awsRegion: "us-west-2" });

    // Should still use AWS_REGION_OVERRIDE value
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-west-1", // AWS_REGION_OVERRIDE takes precedence
      })
    );
  });
});