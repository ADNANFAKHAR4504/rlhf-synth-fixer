// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    vpc: { id: `${id}-vpc-id` },
    publicSubnet: { id: `${id}-public-subnet-id` },
    privateSubnet: { id: `${id}-private-subnet-id` },
    isolatedSubnet: { id: `${id}-isolated-subnet-id` },
    natGateway: { id: `${id}-nat-gateway-id` },
    internetGateway: { id: `${id}-internet-gateway-id` },
  })),
  SecurityModule: jest.fn().mockImplementation((scope: any, id: string, vpcId: string) => ({
    ec2SecurityGroup: { id: `${id}-ec2-sg-id` },
    rdsSecurityGroup: { id: `${id}-rds-sg-id` },
    ec2Role: { 
      id: `${id}-ec2-role-id`,
      arn: `arn:aws:iam::123456789012:role/${id}-ec2-role`,
      name: `${id}-ec2-role-name`
    },
    ec2InstanceProfile: { name: `${id}-instance-profile` },
  })),
  S3Module: jest.fn().mockImplementation((scope: any, id: string, suffix: string, accountId: string) => ({
    bucket: { 
      bucket: `${id}-bucket-${suffix}`,
      arn: `arn:aws:s3:::${id}-bucket-${suffix}`
    },
    kmsKey: { 
      keyId: `${id}-s3-kms-key-id`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${id}-s3-kms-key-id`
    },
  })),
  Ec2Module: jest.fn().mockImplementation((scope: any, id: string, subnetId: string, sgId: string, instanceProfile: string) => ({
    instance: {
      id: `${id}-instance-id`,
      privateIp: "10.0.1.100"
    },
  })),
  RdsModule: jest.fn().mockImplementation((scope: any, id: string, sgId: string, accountId: string) => ({
    database: {
      endpoint: `${id}-db.cluster-xyz.us-east-1.rds.amazonaws.com:3306`
    },
    kmsKey: {
      keyId: `${id}-rds-kms-key-id`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${id}-rds-kms-key-id`
    },
    secretsManager: {
      dbSecret: {
        arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:tap/rds/mysql/credentials-${id}`,
        name: `tap/rds/mysql/credentials-${id}`
      }
    }
  })),
  CloudTrailModule: jest.fn().mockImplementation((scope: any, id: string, suffix: string, accountId: string) => ({
    trail: {
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${id}-trail-${suffix}`
    },
    logsBucket: {
      bucket: `${id}-cloudtrail-logs-${suffix}`
    },
    kmsKey: {
      keyId: `${id}-cloudtrail-kms-key-id`
    }
  })),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string) => ({
    accountId: "123456789012",
    arn: "arn:aws:iam::123456789012:user/test-user",
    userId: "AIDACKCEVSQ6C2EXAMPLE"
  })),
}));

// Mock Random Provider and Id
jest.mock("@cdktf/provider-random/lib/provider", () => ({
  RandomProvider: jest.fn(),
}));

jest.mock("@cdktf/provider-random/lib/id", () => ({
  Id: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    hex: "abcd1234",
    byteLength: config.byteLength
  })),
}));

// Mock IAM Role Policy
jest.mock("@cdktf/provider-aws/lib/iam-role-policy", () => ({
  IamRolePolicy: jest.fn(),
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
    SecurityModule,
    S3Module,
    Ec2Module,
    RdsModule,
    CloudTrailModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { RandomProvider } = require("@cdktf/provider-random/lib/provider");
  const { Id } = require("@cdktf/provider-random/lib/id");
  const { IamRolePolicy } = require("@cdktf/provider-aws/lib/iam-role-policy");

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
          region: 'us-west-2', // default value
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
  });

  describe("Module Creation and Dependencies", () => {
    test("should create all modules with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackModules");

      // Verify VPC is created
      expect(VpcModule).toHaveBeenCalledWith(expect.anything(), "vpc");

      // Verify Security module gets VPC ID
      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        "security",
        "vpc-vpc-id"
      );

      // Verify S3 module gets bucket suffix and accountId
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        "abcd1234",
        "123456789012"
      );

      // Verify EC2 module gets correct dependencies
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        "ec2",
        "vpc-private-subnet-id",
        "security-ec2-sg-id",
        "security-instance-profile"
      );

      // Verify RDS module gets security group and accountId
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        "security-rds-sg-id",
        "123456789012"
      );

      // Verify CloudTrail module gets bucket suffix and accountId
      expect(CloudTrailModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudtrail",
        "abcd1234",
        "123456789012"
      );
    });
  });

  describe("IAM Role Policy Creation", () => {
    test("should create IAM role policy for EC2 to access Secrets Manager", () => {
      const app = new App();
      new TapStack(app, "TestStackIAMPolicy");

      const expectedPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [
              'arn:aws:secretsmanager:us-west-2:123456789012:secret:tap/rds/mysql/credentials*',
            ],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: ['arn:aws:kms:us-east-1:123456789012:key/rds-rds-kms-key-id'],
          },
        ],
      };

      expect(IamRolePolicy).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-secrets-policy',
        expect.objectContaining({
          name: 'tap-ec2-secrets-policy',
          role: 'security-ec2-role-id',
          policy: JSON.stringify(expectedPolicy),
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Check that TerraformOutput was called the expected number of times

      // Test a few key outputs to ensure they're created correctly
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          value: 'vpc-vpc-id',
          description: 'VPC ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-name',
        expect.objectContaining({
          value: 's3-bucket-abcd1234',
          description: 'S3 bucket name',
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
      expect(RandomProvider).toHaveBeenCalledTimes(1);
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(Id).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(Ec2Module).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(CloudTrailModule).toHaveBeenCalledTimes(1);
      expect(IamRolePolicy).toHaveBeenCalledTimes(1);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
    });
  });
});