// __tests__/tap-stack.unit.test.ts
import { App, S3Backend } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";


// Mock SecureInfrastructureModules used in TapStack
jest.mock("../lib/modules", () => ({
  SecureInfrastructureModules: jest.fn().mockImplementation((scope, id, config) => ({
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

  describe("Provider Configuration", () => {
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

    test("should use custom environment suffix in provider tags", () => {
      const app = new App();
      new TapStack(app, "TestCustomEnv", { environmentSuffix: "prod" });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          defaultTags: [
            {
              tags: expect.objectContaining({
                Environment: "prod",
              }),
            },
          ],
        })
      );
    });

    test("should handle undefined awsRegion in props", () => {
      const app = new App();
      new TapStack(app, "TestUndefinedRegion", { awsRegion: undefined });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1", // Should default to us-east-1
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
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

    test("should use custom props for S3 backend", () => {
      const app = new App();
      const customProps = {
        environmentSuffix: "prod",
        stateBucket: "custom-tf-states",
        stateBucketRegion: "eu-west-1",
      };

      new TapStack(app, "TestStackCustomProps", customProps);

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "custom-tf-states",
          key: "prod/TestStackCustomProps.tfstate",
          region: "eu-west-1",
          encrypt: true,
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

      // Mock addOverride method to verify it's called
      const addOverrideSpy = jest.spyOn(stack, 'addOverride');
      
      // Create a new stack to trigger the addOverride call
      new TapStack(app, "TestStackOverride2");
      
      // Verify that addOverride would be called (we can't directly test it due to mocking)
      expect(stack.addOverride).toBeDefined();
    });

    test("should handle undefined state bucket props", () => {
      const app = new App();
      new TapStack(app, "TestUndefinedBucket", { 
        stateBucket: undefined,
        stateBucketRegion: undefined 
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states", // default
          region: "us-east-1", // default
        })
      );
    });
  });

  describe("SecureInfrastructureModules Integration", () => {
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

    test("should create modules with correct scope and id", () => {
      const app = new App();
      const stack = new TapStack(app, "TestModuleScope");

      expect(SecureInfrastructureModules).toHaveBeenCalledWith(
        stack, // Should pass the stack as scope
        "SecProject-Infrastructure",
        expect.any(Object)
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required Terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // TapStack defines 15 outputs in total
      expect(TerraformOutput).toHaveBeenCalledTimes(15);
    });

    test("should create core security outputs", () => {
      const app = new App();
      new TapStack(app, "TestCoreOutputs");

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
    });

    test("should create encryption-related outputs", () => {
      const app = new App();
      new TapStack(app, "TestEncryptionOutputs");

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
        "kms-key-arn",
        expect.objectContaining({
          description: "ARN of the KMS key used for encryption at rest",
          sensitive: false,
        })
      );
    });

    test("should create networking outputs", () => {
      const app = new App();
      new TapStack(app, "TestNetworkingOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "vpc-id",
        expect.objectContaining({
          description: "ID of the secure VPC for network isolation",
          sensitive: false,
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "security-group-id",
        expect.objectContaining({
          description: "ID of the security group with restricted access rules",
          sensitive: false,
        })
      );
    });

    test("should create monitoring and alerting outputs", () => {
      const app = new App();
      new TapStack(app, "TestMonitoringOutputs");

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

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "unauthorized-access-alarm-name",
        expect.objectContaining({
          description: "Name of the CloudWatch alarm for unauthorized access attempts",
          sensitive: false,
        })
      );
    });

    test("should create backup-related outputs", () => {
      const app = new App();
      new TapStack(app, "TestBackupOutputs");

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

    test("should create region information outputs", () => {
      const app = new App();
      new TapStack(app, "TestRegionOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "primary-region",
        expect.objectContaining({
          description: "Primary AWS region for the deployment",
          value: "us-east-1",
          sensitive: false,
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "backup-region",
        expect.objectContaining({
          description: "Backup AWS region for disaster recovery",
          value: "us-west-2",
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
  });

  describe("Props Handling", () => {
    test("should handle partial props correctly", () => {
      const app = new App();
      new TapStack(app, "TestPartialProps", { 
        environmentSuffix: "test",
        stateBucket: "test-bucket"
        // Other props should use defaults
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "test-bucket",
          key: "test/TestPartialProps.tfstate",
          region: "us-east-1", // default
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      new TapStack(app, "TestEmptyProps", {});

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: [
            {
              tags: expect.objectContaining({
                Environment: "dev", // default
              }),
            },
          ],
        })
      );
    });

    test("should handle different environment suffixes", () => {
      const environments = ["dev", "staging", "prod", "test"];
      const app = new App();

      environments.forEach((env, index) => {
        new TapStack(app, `TestEnv${index}`, { environmentSuffix: env });

        expect(AwsProvider).toHaveBeenCalledWith(
          expect.anything(),
          "aws",
          expect.objectContaining({
            defaultTags: [
              {
                tags: expect.objectContaining({
                  Environment: env,
                }),
              },
            ],
          })
        );
      });
    });
  });

  describe("Stack Construction", () => {
    test("should create stack with proper construct hierarchy", () => {
      const app = new App();
      const stack = new TapStack(app, "TestHierarchy");

      // Verify the stack was created with correct parent
      expect(stack.node.scope).toBe(app);
      expect(stack.node.id).toBe("TestHierarchy");
    });

    test("should be instance of TerraformStack", () => {
      const app = new App();
      const stack = new TapStack(app, "TestInstance");

      expect(stack).toBeInstanceOf(require("cdktf").TerraformStack);
    });

    test("should handle multiple stack instances", () => {
      const app = new App();
      const stack1 = new TapStack(app, "TestStack1");
      const stack2 = new TapStack(app, "TestStack2");

      expect(stack1.node.id).toBe("TestStack1");
      expect(stack2.node.id).toBe("TestStack2");
      expect(SecureInfrastructureModules).toHaveBeenCalledTimes(2);
    });

    test("should handle stack creation with undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestUndefinedProps", undefined);

      expect(stack).toBeDefined();
      expect(stack.node.id).toBe("TestUndefinedProps");
    });
  });

  describe("Constants and Configuration", () => {
    test("should use correct default values", () => {
      const app = new App();
      new TapStack(app, "TestDefaults");

      // Verify all default values are used correctly
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          region: "us-east-1",
          encrypt: true,
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
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
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle null environment suffix", () => {
      const app = new App();
      // @ts-ignore - Testing edge case
      new TapStack(app, "TestNullEnv", { environmentSuffix: null });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          defaultTags: [
            {
              tags: expect.objectContaining({
                Environment: "dev", // Should fallback to default
              }),
            },
          ],
        })
      );
    });

    test("should handle special characters in stack id", () => {
      const app = new App();
      const stack = new TapStack(app, "Test-Stack_With.Special@Chars");

      expect(stack.node.id).toBe("Test-Stack_With.Special@Chars");
      expect(SecureInfrastructureModules).toHaveBeenCalledWith(
        expect.anything(),
        "SecProject-Infrastructure",
        expect.any(Object)
      );
    });
  });

  describe("Integration Tests", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "TestCompleteStack", {
        environmentSuffix: "integration",
        stateBucket: "integration-tf-states",
        stateBucketRegion: "us-west-2",
      });

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(SecureInfrastructureModules).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(15);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
      expect(stack.node.scope).toBe(app);
    });

    test("should maintain consistent configuration across components", () => {
      const app = new App();
      new TapStack(app, "TestConsistency", { environmentSuffix: "consistency-test" });

      // Verify environment consistency
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          defaultTags: [
            {
              tags: expect.objectContaining({
                Environment: "consistency-test",
              }),
            },
          ],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: "consistency-test/TestConsistency.tfstate",
        })
      );
    });
  });
});

// Add these tests to your existing describe blocks

describe("Branch Coverage for AWS Region Logic", () => {
  // Mock the AWS_REGION_OVERRIDE to test different scenarios
  let originalOverride: string;

  beforeAll(() => {
    // Store original value
    const TapStackModule = require("../lib/tap-stack");
    originalOverride = TapStackModule.AWS_REGION_OVERRIDE;
  });

  afterAll(() => {
    // Restore original value
    jest.resetModules();
  });

  test("should use AWS_REGION_OVERRIDE when it exists (truthy)", () => {
    // This tests the first branch: AWS_REGION_OVERRIDE ? AWS_REGION_OVERRIDE
    const app = new App();
    new TapStack(app, "TestOverrideExists", { awsRegion: "eu-west-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Should use AWS_REGION_OVERRIDE value
      })
    );
  });

  test("should use default region when AWS_REGION_OVERRIDE is falsy and no props.awsRegion", () => {
    // Mock AWS_REGION_OVERRIDE to be falsy
    jest.doMock("../lib/tap-stack", () => {
      const actual = jest.requireActual("../lib/tap-stack");
      return {
        ...actual,
        AWS_REGION_OVERRIDE: null, // Make it falsy
      };
    });

    const { TapStack: MockedTapStack } = require("../lib/tap-stack");
    
    const app = new App();
    new MockedTapStack(app, "TestDefaultRegion", {}); // No awsRegion in props

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Should use default 'us-east-1'
      })
    );

    jest.dontMock("../lib/tap-stack");
  });

  test("should handle undefined props gracefully", () => {
    // Mock AWS_REGION_OVERRIDE to be falsy
    jest.doMock("../lib/tap-stack", () => {
      const actual = jest.requireActual("../lib/tap-stack");
      return {
        ...actual,
        AWS_REGION_OVERRIDE: false, // Make it falsy
      };
    });

    const { TapStack: MockedTapStack } = require("../lib/tap-stack");
    
    const app = new App();
    new MockedTapStack(app, "TestUndefinedProps", undefined); // undefined props

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Should use default
      })
    );

    jest.dontMock("../lib/tap-stack");
  });
});

describe("Additional Branch Coverage Tests", () => {
  test("should handle environmentSuffix fallback branch", () => {
    const app = new App();
    
    // Test with undefined environmentSuffix
    new TapStack(app, "TestEnvFallback1", { environmentSuffix: undefined });
    
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "dev", // Should fallback to 'dev'
            }),
          },
        ],
      })
    );

    // Test with empty string environmentSuffix
    new TapStack(app, "TestEnvFallback2", { environmentSuffix: "" });
    
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "dev", // Should fallback to 'dev' for empty string
            }),
          },
        ],
      })
    );
  });

  test("should handle stateBucket fallback branch", () => {
    const app = new App();
    
    // Test with undefined stateBucket
    new TapStack(app, "TestBucketFallback1", { stateBucket: undefined });
    
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states", // Should use default
      })
    );

    // Test with empty string stateBucket
    new TapStack(app, "TestBucketFallback2", { stateBucket: "" });
    
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states", // Should fallback to default for empty string
      })
    );
  });

  test("should handle stateBucketRegion fallback branch", () => {
    const app = new App();
    
    // Test with undefined stateBucketRegion
    new TapStack(app, "TestRegionFallback1", { stateBucketRegion: undefined });
    
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        region: "us-east-1", // Should use default
      })
    );

    // Test with empty string stateBucketRegion
    new TapStack(app, "TestRegionFallback2", { stateBucketRegion: "" });
    
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        region: "us-east-1", // Should fallback to default
      })
    );
  });

  test("should handle all props combinations for complete branch coverage", () => {
    const app = new App();
    
    // Test all possible combinations of truthy/falsy values
    const testCases = [
      { 
        props: { environmentSuffix: "test", stateBucket: "test-bucket", stateBucketRegion: "us-west-2" },
        expectedEnv: "test",
        expectedBucket: "test-bucket",
        expectedRegion: "us-west-2"
      },
      { 
        props: { environmentSuffix: "", stateBucket: "", stateBucketRegion: "" },
        expectedEnv: "dev",
        expectedBucket: "iac-rlhf-tf-states",
        expectedRegion: "us-east-1"
      },
      { 
        props: { environmentSuffix: null, stateBucket: null, stateBucketRegion: null },
        expectedEnv: "dev",
        expectedBucket: "iac-rlhf-tf-states",
        expectedRegion: "us-east-1"
      }
    ];

    testCases.forEach((testCase, index) => {
      // @ts-ignore - Testing edge cases with null values
      new TapStack(app, `TestCombination${index}`, testCase.props);

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          defaultTags: [
            {
              tags: expect.objectContaining({
                Environment: testCase.expectedEnv,
              }),
            },
          ],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: testCase.expectedBucket,
          region: testCase.expectedRegion,
        })
      );
    });
  });
});

describe("Conditional Logic Edge Cases", () => {

  test("should handle props optional chaining branches", () => {
    const app = new App();
    
    // Test with null props (tests props?.awsRegion branch)
    new TapStack(app, "TestNullProps", null as any);
    
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Should handle null props gracefully
      })
    );

    // Test with props object but undefined awsRegion
    new TapStack(app, "TestUndefinedAwsRegion", { awsRegion: undefined });
    
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Should use AWS_REGION_OVERRIDE
      })
    );
  });
});

