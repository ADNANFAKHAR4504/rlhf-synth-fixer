// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  createKmsKey: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    key: { 
      keyId: `${id}-key-id`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${id}-key-id`,
      id: `${id}-key-id`
    },
    alias: { name: `alias/${id}` }
  })),
  createS3BucketWithKms: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: { 
      bucket: config.bucketName,
      arn: `arn:aws:s3:::${config.bucketName}`,
      id: config.bucketName
    },
    bucketPolicy: { id: `${id}-policy` },
    bucketVersioning: { id: `${id}-versioning` },
    bucketEncryption: { id: `${id}-encryption` }
  })),
  createSnsTopicWithPolicy: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    topic: { 
      arn: `arn:aws:sns:us-east-1:123456789012:${config.topicName}`,
      id: `${id}-topic-id`,
      name: config.topicName
    },
    topicPolicy: { id: `${id}-policy` }
  })),
  createSqsWithDlqAndKms: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    mainQueue: { 
      id: `https://sqs.us-east-1.amazonaws.com/123456789012/${config.queueName}`,
      arn: `arn:aws:sqs:us-east-1:123456789012:${config.queueName}`,
      name: config.queueName
    },
    dlq: { 
      id: `https://sqs.us-east-1.amazonaws.com/123456789012/${config.dlqName}`,
      arn: `arn:aws:sqs:us-east-1:123456789012:${config.dlqName}`,
      name: config.dlqName
    },
    queuePolicy: { id: `${id}-main-policy` },
    dlqPolicy: { id: `${id}-dlq-policy` }
  })),
  createLeastPrivilegeIamRoles: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    s3Role: { 
      arn: `arn:aws:iam::123456789012:role/${config.rolePrefix}-s3-role`,
      id: `${id}-s3-role-id`,
      name: `${config.rolePrefix}-s3-role`
    },
    sqsRole: { 
      arn: `arn:aws:iam::123456789012:role/${config.rolePrefix}-sqs-role`,
      id: `${id}-sqs-role-id`,
      name: `${config.rolePrefix}-sqs-role`
    },
    s3RolePolicy: { id: `${id}-s3-policy` },
    sqsRolePolicy: { id: `${id}-sqs-policy` }
  }))
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string) => ({
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
    createKmsKey,
    createS3BucketWithKms,
    createSnsTopicWithPolicy,
    createSqsWithDlqAndKms,
    createLeastPrivilegeIamRoles
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor and Basic Functionality", () => {
    test("should create TapStack with default props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test("should create TapStack with custom props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'prod',
        stateBucket: 'custom-bucket'
      });

      expect(stack).toBeDefined();
    });
  });

  describe("Props Handling and Default Values", () => {
    test("should use default values when props are not provided", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaults");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // default value
          defaultTags: [],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackDefaults.tfstate',
          region: 'us-east-1',
          encrypt: true,
        })
      );
    });

    test("should use custom props when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'production',
          Owner: 'DevOps',
        },
      };

      new TapStack(app, "TestStackCustom", {
        environmentSuffix: 'prod',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1', // custom region should be used
          defaultTags: [customTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'prod/TestStackCustom.tfstate',
          region: 'eu-west-1',
          encrypt: true,
        })
      );
    });

    test("should handle undefined and null defaultTags", () => {
      const app = new App();
      
      // Test undefined
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

    test("should handle empty string values and fallback to defaults", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyStrings", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states', // Should fallback to default
          key: 'dev/TestStackEmptyStrings.tfstate', // Should fallback to default env
          region: 'us-east-1', // Should fallback to default
        })
      );
    });

    test("should handle custom awsRegion properly", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", {
        awsRegion: 'ap-southeast-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1', // Custom region should be used
        })
      );
    });

    test("should handle AWS_REGION_OVERRIDE when set", () => {
      const app = new App();
      
      // Since AWS_REGION_OVERRIDE is empty in the source, it should use props.awsRegion
      new TapStack(app, "TestStackRegionOverride", {
        awsRegion: 'us-west-2',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2',
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create KMS key module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackKMS");

      expect(createKmsKey).toHaveBeenCalledWith(
        expect.anything(),
        "tap-kms-dev",
        expect.objectContaining({
          description: "TAP Stack KMS key for dev environment",
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-stack',
            ManagedBy: 'terraform',
          }),
          allowedPrincipals: ["arn:aws:iam::123456789012:root"],
          accountId: "123456789012"
        })
      );
    });

    test("should create S3 bucket module with KMS key dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackS3");

      expect(createS3BucketWithKms).toHaveBeenCalledWith(
        expect.anything(),
        "tap-s3-dev",
        expect.objectContaining({
          bucketName: "tap-data-bucket-tss-dev-123456789012",
          kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/tap-kms-dev-key-id",
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-stack',
            ManagedBy: 'terraform',
          }),
          accountId: "123456789012",
          enableBucketPolicy: false
        })
      );
    });

    test("should create SNS topic module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackSNS");

      expect(createSnsTopicWithPolicy).toHaveBeenCalledWith(
        expect.anything(),
        "tap-sns-dev",
        expect.objectContaining({
          topicName: "tap-notifications-dev",
          allowedAwsAccounts: ["123456789012"],
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-stack',
            ManagedBy: 'terraform',
          }),
          accountId: "123456789012"
        })
      );
    });

    test("should create SQS queues with DLQ and dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackSQS");

      expect(createSqsWithDlqAndKms).toHaveBeenCalledWith(
        expect.anything(),
        "tap-sqs-dev",
        expect.objectContaining({
          queueName: "tap-processing-queue-dev",
          dlqName: "tap-processing-dlq-dev",
          kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/tap-kms-dev-key-id",
          snsTopicArn: "arn:aws:sns:us-east-1:123456789012:tap-notifications-dev",
          maxReceiveCount: 3,
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-stack',
            ManagedBy: 'terraform',
          }),
        })
      );
    });

    test("should create IAM roles with least privilege", () => {
      const app = new App();
      new TapStack(app, "TestStackIAM");

      expect(createLeastPrivilegeIamRoles).toHaveBeenCalledWith(
        expect.anything(),
        "tap-iam-dev",
        expect.objectContaining({
          rolePrefix: "tap-dev",
          s3BucketArn: "arn:aws:s3:::tap-data-bucket-tss-dev-123456789012", // Updated bucket name format
          snsTopicArn: "arn:aws:sns:us-east-1:123456789012:tap-notifications-dev",
          sqsQueueArn: "arn:aws:sqs:us-east-1:123456789012:tap-processing-queue-dev",
          dlqArn: "arn:aws:sqs:us-east-1:123456789012:tap-processing-dlq-dev",
          kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/tap-kms-dev-key-id",
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-stack',
            ManagedBy: 'terraform',
          }),
        })
      );
    });

    test("should create all modules with custom environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomEnv", {
        environmentSuffix: 'staging'
      });

      expect(createKmsKey).toHaveBeenCalledWith(
        expect.anything(),
        "tap-kms-staging",
        expect.objectContaining({
          description: "TAP Stack KMS key for staging environment",
          tags: expect.objectContaining({
            Environment: 'staging',
          }),
        })
      );

      expect(createS3BucketWithKms).toHaveBeenCalledWith(
        expect.anything(),
        "tap-s3-staging",
        expect.objectContaining({
          bucketName: "tap-data-bucket-tss-staging-123456789012", // Updated bucket name format
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Verify that exactly 10 outputs are created
      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      // Test key outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key-id',
        expect.objectContaining({
          value: 'tap-kms-dev-key-id',
          description: 'KMS key ID for encryption',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key-arn',
        expect.objectContaining({
          value: 'arn:aws:kms:us-east-1:123456789012:key/tap-kms-dev-key-id',
          description: 'KMS key ARN for encryption',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-name',
        expect.objectContaining({
          value: 'tap-data-bucket-tss-dev-123456789012', // Updated bucket name format
          description: 'S3 bucket name for data storage',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-arn',
        expect.objectContaining({
          value: 'arn:aws:s3:::tap-data-bucket-tss-dev-123456789012', // Updated bucket name format
          description: 'S3 bucket ARN for data storage',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'sns-topic-arn',
        expect.objectContaining({
          value: 'arn:aws:sns:us-east-1:123456789012:tap-notifications-dev',
          description: 'SNS topic ARN for notifications',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'sqs-queue-url',
        expect.objectContaining({
          value: 'https://sqs.us-east-1.amazonaws.com/123456789012/tap-processing-queue-dev',
          description: 'SQS main queue URL for message processing',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'sqs-dlq-url',
        expect.objectContaining({
          value: 'https://sqs.us-east-1.amazonaws.com/123456789012/tap-processing-dlq-dev',
          description: 'SQS dead letter queue URL',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-iam-role-arn',
        expect.objectContaining({
          value: 'arn:aws:iam::123456789012:role/tap-dev-s3-role',
          description: 'IAM role ARN for S3 access',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'sqs-iam-role-arn',
        expect.objectContaining({
          value: 'arn:aws:iam::123456789012:role/tap-dev-sqs-role',
          description: 'IAM role ARN for SQS access',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'aws-account-id',
        expect.objectContaining({
          value: '123456789012',
          description: 'Current AWS Account ID',
        })
      );
    });
  });

  describe("Integration Tests", () => {
    test("should create stack with all components integrated", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackIntegration");

      // Verify all main components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(createKmsKey).toHaveBeenCalledTimes(1);
      expect(createS3BucketWithKms).toHaveBeenCalledTimes(1);
      expect(createSnsTopicWithPolicy).toHaveBeenCalledTimes(1);
      expect(createSqsWithDlqAndKms).toHaveBeenCalledTimes(1);
      expect(createLeastPrivilegeIamRoles).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
    });

    test("should handle complex production scenario", () => {
      const app = new App();
      const prodTags = {
        tags: {
          Environment: 'production',
          Owner: 'Platform-Team',
          CostCenter: 'Engineering',
        },
      };

      const stack = new TapStack(app, "TapStackProd", {
        environmentSuffix: 'prod',
        stateBucket: 'prod-tf-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: prodTags,
      });

      expect(stack).toBeDefined();

      // Verify production configuration is applied
      expect(createKmsKey).toHaveBeenCalledWith(
        expect.anything(),
        "tap-kms-prod",
        expect.objectContaining({
          description: "TAP Stack KMS key for prod environment",
          tags: expect.objectContaining({
            Environment: 'prod',
            Project: 'tap-stack',
            ManagedBy: 'terraform',
          }),
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2',
          defaultTags: [prodTags],
        })
      );
    });
  });
});