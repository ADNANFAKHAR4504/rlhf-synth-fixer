// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  asset: {
    AssetArchive: jest.fn(),
    StringAsset: jest.fn()
  },
  interpolate: jest.fn(),
  output: jest.fn((val) => val)
}));

jest.mock("@pulumi/aws", () => ({
  kms: {
    Key: jest.fn().mockImplementation(() => ({ 
      keyId: "mock-kms-key-id",
      arn: "arn:aws:kms:us-east-1:123456789012:key/mock-key-id"
    })),
    Alias: jest.fn().mockImplementation(() => ({ id: "alias/mock-key" }))
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: "mock-bucket-id-12345",
      arn: {
        apply: jest.fn((fn) => fn("arn:aws:s3:::mock-bucket-id-12345"))
      }
    })),
    BucketPublicAccessBlock: jest.fn(),
    BucketVersioningV2: jest.fn(),
    BucketServerSideEncryptionConfigurationV2: jest.fn(),
    BucketLoggingV2: jest.fn(),
    BucketPolicy: jest.fn()
  },
  iam: {
    AccountPasswordPolicy: jest.fn(),
    Role: jest.fn().mockImplementation(() => ({
      name: "mock-role-name",
      arn: "arn:aws:iam::123456789012:role/mock-role"
    })),
    Policy: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:iam::123456789012:policy/mock-policy"
    })),
    RolePolicyAttachment: jest.fn()
  },
  cloudwatch: {
    LogGroup: jest.fn(),
    MetricAlarm: jest.fn()
  },
  lambda: {
    Function: jest.fn().mockImplementation(() => ({
      name: "mock-lambda-function",
      arn: "arn:aws:lambda:us-east-1:123456789012:function:mock-function"
    }))
  },
  securityhub: {
    Account: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:securityhub:us-east-1:123456789012:hub/default"
    }))
  }
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";

describe("Secure TapStack Implementation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Math.random to have predictable bucket names in tests
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    Math.random.mockRestore();
  });

  describe("Stack Instantiation", () => {
    it("should instantiate TapStack successfully", () => {
      const stack = new TapStack("TestSecureStack", {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should use prod environment by default", () => {
      new TapStack("TestDefaultEnv", {});
      
      // Verify KMS key creation with prod environment
      expect(aws.kms.Key).toHaveBeenCalledWith(
        "myproject-prod-kms-key",
        expect.objectContaining({
          description: 'KMS key for securing data encryption',
          enableKeyRotation: true
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it("should use custom environment suffix", () => {
      new TapStack("TestCustomEnv", { environmentSuffix: "dev" });
      
      expect(aws.kms.Key).toHaveBeenCalledWith(
        "myproject-dev-kms-key",
        expect.objectContaining({
          description: 'KMS key for securing data encryption'
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it("should merge custom tags with defaults", () => {
      new TapStack("TestCustomTags", {
        environmentSuffix: "test",
        tags: { CustomTag: "CustomValue" }
      });
      
      expect(aws.kms.Key).toHaveBeenCalledWith(
        "myproject-test-kms-key",
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: "test",
            Project: "myproject",
            SecurityCompliance: "true",
            ManagedBy: "Pulumi",
            CustomTag: "CustomValue",
            Name: "myproject-test-kms-key"
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("KMS Security Configuration", () => {
    it("should create KMS key with security best practices", () => {
      new TapStack("TestKMSKey", {});
      
      expect(aws.kms.Key).toHaveBeenCalledWith(
        "myproject-prod-kms-key",
        expect.objectContaining({
          description: 'KMS key for securing data encryption',
          keyUsage: 'ENCRYPT_DECRYPT',
          keySpec: 'SYMMETRIC_DEFAULT',
          enableKeyRotation: true
        }),
        expect.any(Object)
      );
    });

    it("should create KMS key alias", () => {
      new TapStack("TestKMSAlias", {});
      
      expect(aws.kms.Alias).toHaveBeenCalledWith(
        "myproject-prod-kms-alias",
        expect.objectContaining({
          name: "alias/myproject-prod-key"
        }),
        expect.any(Object)
      );
    });
  });

  describe("S3 Security Configuration", () => {
    it("should create access logs bucket with security controls", () => {
      new TapStack("TestAccessLogs", {});
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "myproject-prod-s3-logs",
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: "myproject-prod-s3-logs",
            Purpose: "AccessLogs"
          })
        }),
        expect.any(Object)
      );
    });

    it("should create multiple data buckets", () => {
      new TapStack("TestDataBuckets", {});
      
      // Should create 4 buckets total (3 data + 1 logging)
      expect(aws.s3.Bucket).toHaveBeenCalledTimes(4);
      
      // Check for each data bucket type
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "myproject-prod-s3-data",
        expect.any(Object),
        expect.any(Object)
      );
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "myproject-prod-s3-backups",
        expect.any(Object),
        expect.any(Object)
      );
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "myproject-prod-s3-artifacts",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should enable public access block for all buckets", () => {
      new TapStack("TestPublicAccessBlock", {});
      
      // Should create public access blocks for all 4 buckets
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledTimes(4);
      
      // Verify security settings
      const publicAccessBlockCalls = aws.s3.BucketPublicAccessBlock.mock.calls;
      publicAccessBlockCalls.forEach(call => {
        expect(call[1]).toEqual(expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true
        }));
      });
    });

    it("should enable versioning on all buckets", () => {
      new TapStack("TestVersioning", {});

      // Should enable versioning for all 4 buckets
      expect(aws.s3.BucketVersioningV2).toHaveBeenCalledTimes(4);

      const versioningCalls = aws.s3.BucketVersioningV2.mock.calls;
      versioningCalls.forEach(call => {
        expect(call[1]).toEqual(expect.objectContaining({
          versioningConfiguration: {
            status: 'Enabled'
          }
        }));
      });
    });

    it("should configure encryption for all buckets", () => {
      new TapStack("TestEncryption", {});

      // Should configure encryption for all 4 buckets
      expect(aws.s3.BucketServerSideEncryptionConfigurationV2).toHaveBeenCalledTimes(4);
    });

    it("should create bucket policies to deny insecure transport", () => {
      new TapStack("TestBucketPolicies", {});
      
      // Should create policies for 3 data buckets (not logging bucket)
      expect(aws.s3.BucketPolicy).toHaveBeenCalledTimes(3);
    });
  });

  describe("IAM Security Configuration", () => {
    it("should create strong password policy", () => {
      new TapStack("TestPasswordPolicy", {});
      
      expect(aws.iam.AccountPasswordPolicy).toHaveBeenCalledWith(
        "myproject-prod-password-policy",
        expect.objectContaining({
          minimumPasswordLength: 12,
          requireLowercaseCharacters: true,
          requireUppercaseCharacters: true,
          requireNumbers: true,
          requireSymbols: true,
          maxPasswordAge: 90,
          passwordReusePrevention: 12,
          hardExpiry: true,
          allowUsersToChangePassword: true
        }),
        expect.any(Object)
      );
    });

    it("should create Lambda execution role with least privilege", () => {
      new TapStack("TestLambdaRole", {});
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        "myproject-prod-lambda-role",
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('lambda.amazonaws.com')
        }),
        expect.any(Object)
      );
    });

    it("should create Lambda policy with minimal permissions", () => {
      new TapStack("TestLambdaPolicy", {});
      
      expect(aws.iam.Policy).toHaveBeenCalledWith(
        "myproject-prod-lambda-policy",
        expect.objectContaining({
          description: 'Minimal permissions for secure Lambda function'
        }),
        expect.any(Object)
      );
    });

    it("should attach policy to role", () => {
      new TapStack("TestPolicyAttachment", {});
      
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        "myproject-prod-lambda-policy-attachment",
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Lambda Security Configuration", () => {
    it("should create CloudWatch log group with encryption", () => {
      new TapStack("TestLogGroup", {});
      
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        "myproject-prod-lambda-logs",
        expect.objectContaining({
          name: "/aws/lambda/myproject-prod-secure-processor",
          retentionInDays: 14
        }),
        expect.any(Object)
      );
    });

    it("should create Lambda function with secure configuration", () => {
      new TapStack("TestLambdaFunction", {});
      
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        "myproject-prod-lambda-processor",
        expect.objectContaining({
          name: "myproject-prod-secure-processor",
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          timeout: 30,
          memorySize: 128
        }),
        expect.any(Object)
      );
    });

    it("should include secure Lambda code that protects sensitive variables", () => {
      new TapStack("TestLambdaCode", {});
      
      // Verify StringAsset was called (contains the Lambda code)
      expect(pulumi.asset.StringAsset).toHaveBeenCalled();
      
      const lambdaCode = pulumi.asset.StringAsset.mock.calls[0][0];
      expect(lambdaCode).toContain('AWS_ACCESS_KEY_ID');
      expect(lambdaCode).toContain('AWS_SECRET_ACCESS_KEY');
      expect(lambdaCode).toContain('[REDACTED]');
      expect(lambdaCode).toContain('logSafeEnvironmentInfo');
    });
  });

  describe("Security Monitoring Configuration", () => {
    it("should handle Security Hub when already enabled", () => {
      new TapStack("TestSecurityHub", {});
      
      // Security Hub is commented out due to it being a singleton resource
      // that may already be enabled at the account level
      expect(aws.securityhub.Account).not.toHaveBeenCalled();
    });

    it("should create CloudWatch alarms for monitoring", () => {
      new TapStack("TestCloudWatchAlarms", {});
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        "myproject-prod-bucket-size-alarm",
        expect.objectContaining({
          name: "myproject-prod-bucket-size-high",
          metricName: "BucketSizeBytes",
          namespace: "AWS/S3",
          threshold: 10737418240 // 10GB
        }),
        expect.any(Object)
      );
    });
  });

  describe("Output Registration", () => {
    it("should register all required outputs", () => {
      const stack = new TapStack("TestOutputs", {});
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          dataBucketName: expect.any(String),
          backupsBucketName: expect.any(String),
          artifactsBucketName: expect.any(String),
          accessLogsBucketName: expect.any(String),
          lambdaFunctionName: expect.any(String),
          lambdaFunctionArn: expect.any(String),
          kmsKeyId: expect.any(String),
          kmsKeyArn: expect.any(String),
          securityHubArn: expect.any(String)
        })
      );
    });

    it("should expose resource references", () => {
      const stack = new TapStack("TestResourceReferences", {});
      
      expect(stack.buckets).toBeDefined();
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.kmsKey).toBeDefined();
      expect(stack.securityHub).toBeDefined();
    });
  });

  describe("Security Compliance", () => {
    it("should apply comprehensive security tagging", () => {
      new TapStack("TestSecurityTags", { environmentSuffix: "compliance" });
      
      // Check that resources are created with security compliance tags
      const kmsKeyCall = aws.kms.Key.mock.calls[0];
      expect(kmsKeyCall[1].tags).toEqual(expect.objectContaining({
        SecurityCompliance: "true",
        ManagedBy: "Pulumi",
        Environment: "compliance",
        Project: "myproject"
      }));
    });

    it("should follow myproject-prod naming convention", () => {
      new TapStack("TestNamingConvention", {});
      
      // Verify naming convention across resources
      expect(aws.kms.Key).toHaveBeenCalledWith(
        expect.stringMatching(/^myproject-prod-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringMatching(/^myproject-prod-/),
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringMatching(/^myproject-prod-/),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle undefined environment suffix gracefully", () => {
      expect(() => {
        new TapStack("TestUndefinedEnv", { environmentSuffix: undefined });
      }).not.toThrow();
    });

    it("should handle empty tags object", () => {
      expect(() => {
        new TapStack("TestEmptyTags", { tags: {} });
      }).not.toThrow();
    });

    it("should handle null args", () => {
      expect(() => {
        new TapStack("TestNullArgs", null);
      }).not.toThrow();
    });
  });
});