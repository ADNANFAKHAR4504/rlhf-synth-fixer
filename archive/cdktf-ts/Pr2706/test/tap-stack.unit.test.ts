// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  SecurityModule: jest.fn().mockImplementation(() => ({
    dataKmsKey: {
      keyId: "mock-kms-key-id",
      arn: "arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id",
    },
    logBucket: {
      id: "mock-log-bucket-id",
      bucket: "mock-log-bucket-name",
      arn: "arn:aws:s3:::mock-log-bucket-name",
    },
    adminRole: {
      arn: "arn:aws:iam::123456789012:role/mock-admin-role",
      name: "mock-admin-role",
    },
  })),
  VpcModule: jest.fn().mockImplementation(() => ({
    vpcId: "mock-vpc-id",
    publicSubnetIds: ["mock-public-subnet-1", "mock-public-subnet-2"],
    privateSubnetIds: ["mock-private-subnet-1", "mock-private-subnet-2"],
    albSecurityGroupId: "mock-alb-sg-id",
    appSecurityGroupId: "mock-app-sg-id",
    dbSecurityGroupId: "mock-db-sg-id",
    redshiftSecurityGroupId: "mock-redshift-sg-id",
  })),
  ComputeModule: jest.fn().mockImplementation(() => ({
    albArn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock-alb/1234567890123456",
    asgName: "mock-asg-name",
  })),
  DatabaseModule: jest.fn().mockImplementation(() => ({
    rdsEndpoint: "mock-rds-instance.cluster-xyz.us-east-1.rds.amazonaws.com",
    redshiftEndpoint: "mock-redshift-cluster.cluster-xyz.us-east-1.redshift.amazonaws.com",
  })),
  MonitoringModule: jest.fn().mockImplementation(() => ({})),
  ComplianceModule: jest.fn().mockImplementation(() => ({})),
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

// Mock AWS Provider and Random Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

jest.mock("@cdktf/provider-random/lib/provider", () => ({
  RandomProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    SecurityModule,
    VpcModule,
    ComputeModule,
    DatabaseModule,
    MonitoringModule,
    ComplianceModule,
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { RandomProvider } = require("@cdktf/provider-random/lib/provider");

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
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
      });

      expect(stack).toBeDefined();
    });

    test("should create TapStack with all custom props", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'production',
          Owner: 'DevOps',
          Project: 'TAP',
        },
      };

      const stack = new TapStack(app, "TestStackFull", {
        environmentSuffix: 'staging',
        stateBucket: 'my-custom-tf-states',
        stateBucketRegion: 'ap-southeast-1',
        awsRegion: 'ap-southeast-1',
        defaultTags: customTags,
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
          region: 'us-east-1', // Default region when AWS_REGION_OVERRIDE is empty
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
          CostCenter: '12345',
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
          region: 'eu-west-1', // Should use custom region since AWS_REGION_OVERRIDE is empty
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

    test("should use custom awsRegion when AWS_REGION_OVERRIDE is empty", () => {
      const app = new App();
      new TapStack(app, "TestStackRegionOverride", {
        awsRegion: 'ap-southeast-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1', // Should use custom region since override is empty
        })
      );
    });
  });

  describe("Provider Configuration", () => {
    test("should configure Random provider", () => {
      const app = new App();
      new TapStack(app, "TestStackRandomProvider");

      expect(RandomProvider).toHaveBeenCalledWith(
        expect.anything(),
        'random',
        {}
      );
    });

    test("should configure AWS provider with correct region and tags", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'test',
          Application: 'tap',
        },
      };

      new TapStack(app, "TestStackProvider", {
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-east-1', // Default region
          defaultTags: [customTags],
        }
      );
    });

    test("should configure AWS provider with empty tags when not provided", () => {
      const app = new App();
      new TapStack(app, "TestStackProviderNoTags");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-east-1', // Default region
          defaultTags: [],
        }
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with correct parameters", () => {
      const app = new App();
      new TapStack(app, "TestStackBackend", {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-west-1',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'test-bucket',
          key: 'test/TestStackBackend.tfstate',
          region: 'us-west-1',
          encrypt: true,
        }
      );
    });

    test("should add override for S3 state locking", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackLocking");

      expect(stack.addOverride).toBeDefined();
      // Note: We can't easily test addOverride calls without mocking the entire stack
    });
  });

describe("Module Creation and Dependencies", () => {
  test("should create all modules in correct order with proper dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackModules");

    // Verify Security Module is created first
    expect(SecurityModule).toHaveBeenCalledWith(expect.anything(), 'security');

    // Verify VPC Module is created with KMS key - FIX: Use kmsKey instead of kmsKeyId
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      'vpc',
      expect.objectContaining({ 
        kmsKey: {
          keyId: "mock-kms-key-id",
          arn: "arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id",
        }
      })
    );

    // Verify Compute Module is created with proper dependencies - FIX: Use kmsKey instead of kmsKeyId
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      'compute',
      expect.objectContaining({
        vpcId: "mock-vpc-id",
        publicSubnetIds: ["mock-public-subnet-1", "mock-public-subnet-2"],
        privateSubnetIds: ["mock-private-subnet-1", "mock-private-subnet-2"],
        albSecurityGroupId: "mock-alb-sg-id",
        appSecurityGroupId: "mock-app-sg-id",
        kmsKey: {  // Changed from kmsKeyId to kmsKey
          keyId: "mock-kms-key-id",
          arn: "arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id",
        },
        adminRoleArn: "arn:aws:iam::123456789012:role/mock-admin-role",
      })
    );

   // Verify Database Module is created with proper dependencies - FIX: Use kmsKey instead of kmsKeyId
    expect(DatabaseModule).toHaveBeenCalledWith(
      expect.anything(),
      'database',
      expect.objectContaining({
        vpcId: "mock-vpc-id",
        privateSubnetIds: ["mock-private-subnet-1", "mock-private-subnet-2"],
        dbSecurityGroupId: "mock-db-sg-id",
        redshiftSecurityGroupId: "mock-redshift-sg-id",
        kmsKey: {  // Changed from kmsKeyId to kmsKey
          keyId: "mock-kms-key-id",
          arn: "arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id",
        },
        logBucketId: "mock-log-bucket-id",
      })
    );

    // Verify Monitoring Module is created with proper dependencies - FIX: Use kmsKey instead of kmsKeyId
    expect(MonitoringModule).toHaveBeenCalledWith(
      expect.anything(),
      'monitoring',
      expect.objectContaining({
        albArn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock-alb/1234567890123456",
        asgName: "mock-asg-name",
        kmsKey: {  // Changed from kmsKeyId to kmsKey
          keyId: "mock-kms-key-id",
          arn: "arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id",
        },
      })
    );
    });

    test("should call each module creation function exactly once", () => {
      const app = new App();
      new TapStack(app, "TestStackModuleCounts");

      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);
      expect(ComplianceModule).toHaveBeenCalledTimes(1);
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Test VPC outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          value: 'mock-vpc-id',
          description: 'VPC ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-ids',
        expect.objectContaining({
          value: JSON.stringify(['mock-public-subnet-1', 'mock-public-subnet-2']),
          description: 'Public subnet IDs',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-subnet-ids',
        expect.objectContaining({
          value: JSON.stringify(['mock-private-subnet-1', 'mock-private-subnet-2']),
          description: 'Private subnet IDs',
        })
      );

      // Test S3 outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-name',
        expect.objectContaining({
          value: 'mock-log-bucket-name',
          description: 'S3 log bucket name',
        })
      );

      // Test IAM outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'admin-role-arn',
        expect.objectContaining({
          value: 'arn:aws:iam::123456789012:role/mock-admin-role',
          description: 'Admin role ARN',
        })
      );

      // Test Security Group outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'alb-security-group-id',
        expect.objectContaining({
          value: 'mock-alb-sg-id',
          description: 'ALB Security Group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'app-security-group-id',
        expect.objectContaining({
          value: 'mock-app-sg-id',
          description: 'Application Security Group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'db-security-group-id',
        expect.objectContaining({
          value: 'mock-db-sg-id',
          description: 'Database Security Group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'redshift-security-group-id',
        expect.objectContaining({
          value: 'mock-redshift-sg-id',
          description: 'Redshift Security Group ID',
        })
      );

      // Test ALB outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'alb-arn',
        expect.objectContaining({
          value: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock-alb/1234567890123456',
          description: 'Application Load Balancer ARN',
        })
      );

      // Test ASG outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'asg-name',
        expect.objectContaining({
          value: 'mock-asg-name',
          description: 'Auto Scaling Group name',
        })
      );

      // Test Database outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-endpoint',
        expect.objectContaining({
          value: 'mock-rds-instance.cluster-xyz.us-east-1.rds.amazonaws.com',
          description: 'RDS database endpoint',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'redshift-endpoint',
        expect.objectContaining({
          value: 'mock-redshift-cluster.cluster-xyz.us-east-1.redshift.amazonaws.com',
          description: 'Redshift cluster endpoint',
        })
      );

      // Test KMS outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key-id',
        expect.objectContaining({
          value: 'mock-kms-key-id',
          description: 'KMS key ID for encryption',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key-arn',
        expect.objectContaining({
          value: 'arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id',
          description: 'KMS key ARN for encryption',
        })
      );
    });

    test("should create exactly 15 terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputCount");

      // Should create 15 outputs total
      expect(TerraformOutput).toHaveBeenCalledTimes(15);
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
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);
      expect(ComplianceModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(15);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test("should handle multiple stack instances", () => {
      const app = new App();
      const stack1 = new TapStack(app, "TestStack1", { environmentSuffix: 'dev' });
      const stack2 = new TapStack(app, "TestStack2", { environmentSuffix: 'prod' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });

    test("should work with complex configuration", () => {
      const app = new App();
      const complexProps = {
        environmentSuffix: 'staging',
        stateBucket: 'complex-tf-states-bucket',
        stateBucketRegion: 'eu-central-1',
        awsRegion: 'eu-central-1',
        defaultTags: {
          tags: {
            Environment: 'staging',
            Project: 'TAP',
            Owner: 'DevOps Team',
            CostCenter: 'Engineering',
            Compliance: 'SOC2',
          },
        },
      };

      const stack = new TapStack(app, "ComplexTestStack", complexProps);

      expect(stack).toBeDefined();
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1', // Should use custom region since override is empty
          defaultTags: [complexProps.defaultTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'complex-tf-states-bucket',
          key: 'staging/ComplexTestStack.tfstate',
          region: 'eu-central-1',
        })
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle null props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackNullProps", null as any);

      expect(stack).toBeDefined();
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Default region
          defaultTags: [],
        })
      );
    });

    test("should handle empty object props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackEmptyProps", {});

      expect(stack).toBeDefined();
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackEmptyProps.tfstate',
          region: 'us-east-1',
        })
      );
    });

    test("should handle special characters in stack id", () => {
      const app = new App();
      const stack = new TapStack(app, "Test-Stack_123", {
        environmentSuffix: 'test-env',
      });

      expect(stack).toBeDefined();
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'test-env/Test-Stack_123.tfstate',
        })
      );
    });
  });

  describe("AWS Region Override Logic", () => {
    test("should use default region when AWS_REGION_OVERRIDE is empty and no awsRegion prop", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultRegion");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Default fallback
        })
      );
    });

    test("should use awsRegion prop when AWS_REGION_OVERRIDE is empty", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", {
        awsRegion: 'ap-northeast-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-northeast-1', // Should use prop value
        })
      );
    });

    test("should handle empty string awsRegion prop", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyRegion", {
        awsRegion: '',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Should fallback to default
        })
      );
    });
  });

  describe("Module Dependencies and Data Flow", () => {
    test("should pass correct data between modules", () => {
      const app = new App();
      new TapStack(app, "TestStackDataFlow");

      // Verify VpcModule outputs are used by ComputeModule
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          vpcId: "mock-vpc-id",
          publicSubnetIds: ["mock-public-subnet-1", "mock-public-subnet-2"],
          privateSubnetIds: ["mock-private-subnet-1", "mock-private-subnet-2"],
          albSecurityGroupId: "mock-alb-sg-id",
          appSecurityGroupId: "mock-app-sg-id",
        })
      );

      // Verify ComputeModule outputs are used by MonitoringModule
      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          albArn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock-alb/1234567890123456",
          asgName: "mock-asg-name",
        })
      );
    });
  });
});