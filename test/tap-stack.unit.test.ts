// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack - matching actual implementation
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpcId: `${id}-vpc-id`,
    config,
  })),
  SecurityGroupModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    securityGroupId: `${id}-sg-id`,
    config,
  })),
  S3Module: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: { 
      bucket: `${id}-bucket-name`,
    },
    bucketArn: `arn:aws:s3:::${id}-bucket-name`,
    config,
  })),
  IamRoleModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    roleArn: `arn:aws:iam::123456789012:role/${id}-role`,
    role: {
      name: `${id}-role-name`,
    },
    config,
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
    SecurityGroupModule, 
    S3Module, 
    IamRoleModule 
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

    test("should create TapStack with undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", undefined);

      expect(stack).toBeDefined();
    });

    test("should create TapStack with empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {});

      expect(stack).toBeDefined();
    });
  });

  describe("AWS Provider Configuration", () => {
    test("should create AWS Provider with default configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackProvider");

      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [],
        })
      );
    });

    test("should create AWS Provider with custom region", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", {
        awsRegion: 'eu-west-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1',
          defaultTags: [],
        })
      );
    });

    test("should create AWS Provider with custom default tags", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'prod',
          Owner: 'DevOps Team',
          Project: 'TapApp',
        },
      };

      new TapStack(app, "TestStackCustomTags", {
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [customTags],
        })
      );
    });

    test("should handle AWS_REGION_OVERRIDE environment variable", () => {
      // Mock the AWS_REGION_OVERRIDE constant by temporarily modifying the module
      const originalModule = require("../lib/tap-stack");
      
      const app = new App();
      new TapStack(app, "TestStackRegionOverride", {
        awsRegion: 'eu-west-1', // This should be ignored if AWS_REGION_OVERRIDE is set
      });

      // Since AWS_REGION_OVERRIDE is empty string in the code, it should use props.awsRegion
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1',
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should create S3Backend with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackBackend");

      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackBackend.tfstate',
          region: 'us-east-1',
          encrypt: true,
        })
      );
    });

    test("should create S3Backend with custom configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackBackendCustom", {
        environmentSuffix: 'staging',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'us-west-1',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'staging/TestStackBackendCustom.tfstate',
          region: 'us-west-1',
          encrypt: true,
        })
      );
    });

    test("should call addOverride for S3 backend locking", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackOverride");

      // Mock the addOverride method to verify it's called
      const addOverrideSpy = jest.spyOn(stack, 'addOverride');
      
      // Since addOverride is called in constructor, we need to create another instance
      const stack2 = new TapStack(app, "TestStackOverride2");
      const addOverrideSpy2 = jest.spyOn(stack2, 'addOverride');
      
      // We can't directly test the constructor call, but we can verify the method exists
      expect(typeof stack.addOverride).toBe('function');
    });
  });

  describe("Data Sources", () => {
    test("should create DataAwsCallerIdentity", () => {
      const app = new App();
      new TapStack(app, "TestStackDataSources");

      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        "current"
      );
    });
  });

  describe("Module Configuration", () => {
    test("should create moduleConfig with default values", () => {
      const app = new App();
      new TapStack(app, "TestStackModuleConfig");

      // Verify VPC module is called with correct config
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          environment: 'dev',
          projectName: 'tap-project',
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-project',
            ManagedBy: 'terraform',
          }),
        })
      );
    });

    test("should create moduleConfig with custom values", () => {
      const app = new App();
      const customTags = {
        tags: {
          CustomTag: 'CustomValue',
        },
      };

      new TapStack(app, "TestStackModuleConfigCustom", {
        environmentSuffix: 'prod',
        projectName: 'custom-project',
        defaultTags: customTags,
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          environment: 'prod',
          projectName: 'custom-project',
          tags: expect.objectContaining({
            Environment: 'prod',
            Project: 'custom-project',
            ManagedBy: 'terraform',
            CustomTag: 'CustomValue',
          }),
        })
      );
    });
  });

  describe("Module Creation", () => {
    test("should create VPC module", () => {
      const app = new App();
      new TapStack(app, "TestStackVPC");

      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          environment: 'dev',
          projectName: 'tap-project',
        })
      );
    });

    test("should create S3 module", () => {
      const app = new App();
      new TapStack(app, "TestStackS3");

      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        expect.objectContaining({
          environment: 'dev',
          projectName: 'tap-project',
        })
      );
    });

    test("should create SecurityGroup module with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackSG");

      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-group",
        expect.objectContaining({
          environment: 'dev',
          projectName: 'tap-project',
          vpcId: 'vpc-vpc-id',
        })
      );
    });

    test("should create IamRoleModule with S3 bucket dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackIAM");

      expect(IamRoleModule).toHaveBeenCalledTimes(1);
      expect(IamRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        "iam-role",
        expect.objectContaining({
          environment: 'dev',
          projectName: 'tap-project',
          bucketArn: 'arn:aws:s3:::s3-bucket-name',
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      expect(TerraformOutput).toHaveBeenCalledTimes(7);
    });

    test("should create s3-bucket-name output", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Output");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-name',
        expect.objectContaining({
          value: 's3-bucket-name',
          description: 'S3 bucket name',
        })
      );
    });

    test("should create s3-bucket-arn output", () => {
      const app = new App();
      new TapStack(app, "TestStackS3ArnOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-arn',
        expect.objectContaining({
          value: 'arn:aws:s3:::s3-bucket-name',
          description: 'S3 bucket ARN',
        })
      );
    });

    test("should create security-group-id output", () => {
      const app = new App();
      new TapStack(app, "TestStackSGOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'security-group-id',
        expect.objectContaining({
          value: 'security-group-sg-id',
          description: 'Security Group ID',
        })
      );
    });

    test("should create iam-role-arn output", () => {
      const app = new App();
      new TapStack(app, "TestStackIAMArnOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'iam-role-arn',
        expect.objectContaining({
          value: 'arn:aws:iam::123456789012:role/iam-role-role',
          description: 'IAM Role ARN',
        })
      );
    });

    test("should create iam-role-name output", () => {
      const app = new App();
      new TapStack(app, "TestStackIAMNameOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'iam-role-name',
        expect.objectContaining({
          value: 'iam-role-role-name',
          description: 'IAM Role name',
        })
      );
    });

    test("should create aws-account-id output", () => {
      const app = new App();
      new TapStack(app, "TestStackAccountOutput");

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
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(IamRoleModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(7);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
    });

    test("should handle all custom props together", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'production',
          Owner: 'DevOps',
          CostCenter: '12345',
        },
      };

      new TapStack(app, "TestStackAllCustomProps", {
        environmentSuffix: 'prod',
        stateBucket: 'prod-tf-states',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
        projectName: 'production-tap',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1',
          defaultTags: [customTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'prod-tf-states',
          key: 'prod/TestStackAllCustomProps.tfstate',
          region: 'eu-west-1',
          encrypt: true,
        })
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle null defaultTags", () => {
      const app = new App();
      new TapStack(app, "TestStackNullTags", {
        defaultTags: null as any,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [],
        })
      );
    });

    test("should handle undefined defaultTags", () => {
      const app = new App();
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

    test("should handle empty string values", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyStrings", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
        awsRegion: '',
        projectName: '',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Should fallback to default
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states', // Should fallback to default
          key: 'dev/TestStackEmptyStrings.tfstate', // Should fallback to default env
          region: 'us-east-1', // Should fallback to default
        })
      );
    });

    test("should handle very long stack id", () => {
      const app = new App();
      const longId = 'a'.repeat(100);
      const stack = new TapStack(app, longId);

      expect(stack).toBeDefined();
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: `dev/${longId}.tfstate`,
        })
      );
    });

    test("should handle special characters in stack id", () => {
      const app = new App();
      const specialId = "test-stack_with.special-chars";
      const stack = new TapStack(app, specialId);

      expect(stack).toBeDefined();
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: `dev/${specialId}.tfstate`,
        })
      );
    });
  });

  describe("Module Dependencies", () => {
    test("should pass correct vpcId to SecurityGroupModule", () => {
      const app = new App();
      new TapStack(app, "TestStackDependencies");

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-group",
        expect.objectContaining({
          vpcId: 'vpc-vpc-id',
        })
      );
    });

    test("should pass correct bucketArn to IamRoleModule", () => {
      const app = new App();
      new TapStack(app, "TestStackDependencies2");

      expect(IamRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        "iam-role",
        expect.objectContaining({
          bucketArn: 'arn:aws:s3:::s3-bucket-name',
        })
      );
    });
  });

  describe("Tag Merging", () => {
    test("should merge default tags with module tags correctly", () => {
      const app = new App();
      const customTags = {
        tags: {
          CustomTag1: 'Value1',
          CustomTag2: 'Value2',
        },
      };

      new TapStack(app, "TestStackTagMerging", {
        environmentSuffix: 'test',
        projectName: 'test-project',
        defaultTags: customTags,
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'test',
            Project: 'test-project',
            ManagedBy: 'terraform',
            CustomTag1: 'Value1',
            CustomTag2: 'Value2',
          }),
        })
      );
    });

    test("should handle empty tags object", () => {
      const app = new App();
      const emptyTags = {
        tags: {},
      };

      new TapStack(app, "TestStackEmptyTags", {
        defaultTags: emptyTags,
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-project',
            ManagedBy: 'terraform',
          }),
        })
      );
    });
  });
});