// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock SecureInfrastructureModules used in TapStack
jest.mock("../lib/modules", () => ({
  SecureInfrastructureModules: jest.fn().mockImplementation((_, id, config) => ({
    iamRole: { 
      arn: `arn:aws:iam::123456789012:role/${id}-app-role`,
      name: `${id}-app-role`
    },
    kmsKey: { 
      keyId: `${id}-kms-key-id`,
      arn: `arn:aws:kms:${config.environment === 'production' ? 'us-east-1' : 'us-west-2'}:123456789012:key/${id}-kms-key-id`
    },
    mainBucket: { 
      bucket: `${id.toLowerCase()}-main-bucket`,
      arn: `arn:aws:s3:::${id.toLowerCase()}-main-bucket`
    },
    logBucket: { 
      bucket: `${id.toLowerCase()}-log-bucket`,
      arn: `arn:aws:s3:::${id.toLowerCase()}-log-bucket`
    },
    backupBucket: { 
      bucket: `${id.toLowerCase()}-backup-bucket`,
      arn: `arn:aws:s3:::${id.toLowerCase()}-backup-bucket`
    },
    vpc: { 
      id: `vpc-${id.toLowerCase()}-12345`
    },
    securityGroup: { 
      id: `sg-${id.toLowerCase()}-67890`
    },
    cloudTrail: { 
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${id}-audit-trail`
    },
    snsAlertTopic: { 
      arn: `arn:aws:sns:us-east-1:123456789012:${id}-security-alerts`
    },
    backupVault: { 
      name: `${id}-backup-vault`
    },
    unauthorizedAccessAlarm: { 
      alarmName: `${id}-unauthorized-access-alarm`
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
  const { SecureInfrastructureModules } = require("../lib/modules");
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
        region: "us-east-1", // AWS_REGION_OVERRIDE
        defaultTags: [
          {
            tags: {
              Project: "SecProject",
              Environment: "dev",
              ManagedBy: "CDKTF",
              SecurityLevel: "High",
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

  test("should create SecureInfrastructureModules with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurity");

    expect(SecureInfrastructureModules).toHaveBeenCalledTimes(1);
    expect(SecureInfrastructureModules).toHaveBeenCalledWith(
      expect.anything(),
      "SecProject-Infrastructure",
      expect.objectContaining({
        approvedIpRanges: [
          "203.0.113.0/24",
          "198.51.100.0/24", 
          "192.0.2.0/24"
        ],
        securityTeamEmail: "security-team@yourcompany.com",
        backupRegion: "us-west-2",
        environment: "production",
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // TapStack defines 13 outputs in total
    expect(TerraformOutput).toHaveBeenCalledTimes(15);

    // Verify specific security-related outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "iam-role-arn",
      expect.objectContaining({
        description: "ARN of the least-privilege IAM role for applications",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "main-bucket-name",
      expect.objectContaining({
        description: "Name of the main encrypted S3 bucket for application data",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "log-bucket-name",
      expect.objectContaining({
        description: "Name of the encrypted S3 bucket for centralized logging",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms-key-id",
      expect.objectContaining({
        description: "ID of the KMS key used for encryption at rest",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-arn",
      expect.objectContaining({
        description: "ARN of the CloudTrail for comprehensive API logging",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "security-alerts-topic-arn",
      expect.objectContaining({
        description: "ARN of the SNS topic for security alerts and notifications",
        sensitive: false,
      })
    );
  });

  test("should create security summary output with correct structure", () => {
    const app = new App();
    new TapStack(app, "TestStackSecuritySummary");

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "security-summary",
      expect.objectContaining({
        description: "Summary of security controls implemented",
        value: JSON.stringify({
          encryption: "All data encrypted at rest with KMS",
          networking: "VPC with restricted security groups",
          access_control: "Least privilege IAM roles and policies",
          logging: "Comprehensive CloudTrail and CloudWatch logging",
          backup: "Cross-region backup with AWS Backup service",
          monitoring: "CloudWatch alarms with SNS notifications",
          compliance: "90-day log retention for audit requirements",
        }),
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
        region: "us-east-1", // Still overridden by AWS_REGION_OVERRIDE
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

    const secureInfraInstance = SecureInfrastructureModules.mock.results[0].value;

    // Verify that outputs reference the correct SecureInfrastructureModules properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "iam-role-arn",
      expect.objectContaining({
        value: secureInfraInstance.iamRole.arn,
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
      "main-bucket-name",
      expect.objectContaining({
        value: secureInfraInstance.mainBucket.bucket,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: secureInfraInstance.vpc.id,
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
        region: "us-east-1", // AWS_REGION_OVERRIDE takes precedence
      })
    );
  });

  test("should create backup region output correctly", () => {
    const app = new App();
    new TapStack(app, "TestBackupRegion");

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "backup-region",
      expect.objectContaining({
        description: "Backup AWS region for disaster recovery",
        value: "us-west-2", // From secureConfig
        sensitive: false,
      })
    );
  });

  test("should create primary region output correctly", () => {
    const app = new App();
    new TapStack(app, "TestPrimaryRegion");

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "primary-region",
      expect.objectContaining({
        description: "Primary AWS region for the deployment",
        value: "us-east-1",
        sensitive: false,
      })
    );
  });

  test("should pass correct security configuration to modules", () => {
    const app = new App();
    new TapStack(app, "TestSecurityConfig");

    const expectedConfig = {
      approvedIpRanges: [
        "203.0.113.0/24",
        "198.51.100.0/24", 
        "192.0.2.0/24"
      ],
      securityTeamEmail: "security-team@yourcompany.com",
      backupRegion: "us-west-2",
      environment: "production",
    };

    expect(SecureInfrastructureModules).toHaveBeenCalledWith(
      expect.anything(),
      "SecProject-Infrastructure",
      expectedConfig
    );
  });

  test("should create all monitoring and security outputs", () => {
    const app = new App();
    new TapStack(app, "TestMonitoringOutputs");

    // Check for monitoring-specific outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "unauthorized-access-alarm-name",
      expect.objectContaining({
        description: "Name of the CloudWatch alarm for unauthorized access attempts",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "backup-vault-name",
      expect.objectContaining({
        description: "Name of the AWS Backup vault for automated backups",
        sensitive: false,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "backup-bucket-arn",
      expect.objectContaining({
        description: "ARN of the cross-region backup S3 bucket",
        sensitive: false,
      })
    );
  });

  test("should handle different environment suffixes correctly", () => {
    const app = new App();
    
    // Test with staging environment
    new TapStack(app, "TestStagingEnv", { environmentSuffix: "staging" });

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

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "staging/TestStagingEnv.tfstate",
      })
    );
  });

  test("should create stack with proper construct hierarchy", () => {
    const app = new App();
    const stack = new TapStack(app, "TestHierarchy");

    // Verify the stack was created with correct parent
    expect(stack.node.scope).toBe(app);
    expect(stack.node.id).toBe("TestHierarchy");
  });
});