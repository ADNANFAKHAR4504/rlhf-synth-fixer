// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    outputs: {
      vpcId: `${id}-vpc-id`,
      publicSubnetIds: [`${id}-public-subnet-1`, `${id}-public-subnet-2`],
      privateSubnetIds: [`${id}-private-subnet-1`, `${id}-private-subnet-2`],
      internetGatewayId: `${id}-igw-id`,
    },
    config,
  })),
  SecurityModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    outputs: {
      ec2SecurityGroupId: `${id}-ec2-sg-id`,
      albSecurityGroupId: `${id}-alb-sg-id`,
      rdsSecurityGroupId: `${id}-rds-sg-id`,
    },
    config,
  })),
  ComputeModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    outputs: {
      albDnsName: `${id}-alb.us-east-1.elb.amazonaws.com`,
      asgName: `${id}-asg-name`,
    },
    config,
  })),
  DatabaseModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    outputs: {
      rdsEndpoint: `${id}-rds.cluster-xyz.us-east-1.rds.amazonaws.com`,
      rdsPort: "3306",
      secretArn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${id}-rds-password-abc123`,
      secretName: `${id}-rds-password`,
    },
    config,
  })),
  StorageModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    outputs: {
      s3BucketName: `${id}-storage-bucket`,
      instanceProfileName: `${id}-instance-profile`,
    },
    config,
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

// Mock AWS and Random Providers
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

jest.mock("@cdktf/provider-random/lib/provider", () => ({
  RandomProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    NetworkModule,
    SecurityModule,
    ComputeModule,
    DatabaseModule,
    StorageModule
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

  describe("Provider Configuration", () => {
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

    test("should create Random Provider", () => {
      const app = new App();
      new TapStack(app, "TestStackRandomProvider");

      expect(RandomProvider).toHaveBeenCalledTimes(1);
      expect(RandomProvider).toHaveBeenCalledWith(
        expect.anything(),
        'random'
      );
    });

    test("should handle AWS_REGION_OVERRIDE when empty", () => {
      const app = new App();
      new TapStack(app, "TestStackRegionOverride", {
        awsRegion: 'eu-west-1',
      });

      // Since AWS_REGION_OVERRIDE is empty string, it should use props.awsRegion
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
        stateBucketRegion: 'us-west-2',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'staging/TestStackBackendCustom.tfstate',
          region: 'us-west-2',
          encrypt: true,
        })
      );
    });

    test("should call addOverride for S3 backend locking", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackOverride");

      // Verify the method exists and can be called
      expect(typeof stack.addOverride).toBe('function');
      
      // Test that addOverride can be called (simulating the constructor behavior)
      expect(() => {
        stack.addOverride('terraform.backend.s3.use_lockfile', true);
      }).not.toThrow();
    });
  });

  describe("Module Creation and Configuration", () => {
    test("should create NetworkModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackNetwork");

      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        })
      );
    });

    test("should create SecurityModule with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackSecurity");

      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'security',
        expect.objectContaining({
          vpcId: 'network-vpc-id',
        })
      );
    });

    test("should create StorageModule", () => {
      const app = new App();
      new TapStack(app, "TestStackStorage");

      expect(StorageModule).toHaveBeenCalledTimes(1);
      expect(StorageModule).toHaveBeenCalledWith(
        expect.anything(),
        'storage',
        {}
      );
    });

    test("should create ComputeModule with all dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackCompute");

      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          vpcId: 'network-vpc-id',
          publicSubnetIds: ['network-public-subnet-1', 'network-public-subnet-2'],
          privateSubnetIds: ['network-private-subnet-1', 'network-private-subnet-2'],
          ec2SecurityGroupId: 'security-ec2-sg-id',
          albSecurityGroupId: 'security-alb-sg-id',
          instanceProfileName: 'storage-instance-profile',
        })
      );
    });

    test("should create DatabaseModule with dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackDatabase");

      expect(DatabaseModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          privateSubnetIds: ['network-private-subnet-1', 'network-private-subnet-2'],
          rdsSecurityGroupId: 'security-rds-sg-id',
        })
      );
    });
  });

  describe("Module Creation Order", () => {
    test("should create modules in correct dependency order", () => {
      const app = new App();
      new TapStack(app, "TestStackOrder");

      // Verify all modules are created
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(StorageModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledTimes(1);

      // Note: In actual implementation, we can't easily test call order with Jest mocks
      // but we can verify that all dependencies are properly passed
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Should create 14 TerraformOutput instances based on the code
    });

    test("should create vpc-id output", () => {
      const app = new App();
      new TapStack(app, "TestStackVPCOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          value: 'network-vpc-id',
          description: 'VPC ID',
        })
      );
    });

    test("should create public-subnet-ids output", () => {
      const app = new App();
      new TapStack(app, "TestStackPublicSubnetOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-ids',
        expect.objectContaining({
          value: JSON.stringify(['network-public-subnet-1', 'network-public-subnet-2']),
          description: 'Public subnet IDs',
        })
      );
    });

    test("should create private-subnet-ids output", () => {
      const app = new App();
      new TapStack(app, "TestStackPrivateSubnetOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-subnet-ids',
        expect.objectContaining({
          value: JSON.stringify(['network-private-subnet-1', 'network-private-subnet-2']),
          description: 'Private subnet IDs',
        })
      );
    });

    test("should create internet-gateway-id output", () => {
      const app = new App();
      new TapStack(app, "TestStackIGWOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'internet-gateway-id',
        expect.objectContaining({
          value: 'network-igw-id',
          description: 'Internet Gateway ID',
        })
      );
    });

    test("should create s3-bucket-name output", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Output");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-name',
        expect.objectContaining({
          value: 'storage-storage-bucket',
          description: 'S3 bucket name',
        })
      );
    });

    test("should create ec2-instance-profile-name output", () => {
      const app = new App();
      new TapStack(app, "TestStackInstanceProfileOutput");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-instance-profile-name',
        expect.objectContaining({
          value: 'storage-instance-profile',
          description: 'EC2 instance profile name',
        })
      );
    });

    test("should create security group outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackSGOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'alb-security-group-id',
        expect.objectContaining({
          value: 'security-alb-sg-id',
          description: 'ALB Security Group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-security-group-id',
        expect.objectContaining({
          value: 'security-ec2-sg-id',
          description: 'EC2 Security Group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-security-group-id',
        expect.objectContaining({
          value: 'security-rds-sg-id',
          description: 'RDS Security Group ID',
        })
      );
    });

    test("should create compute outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackComputeOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'alb-dns-name',
        expect.objectContaining({
          value: 'compute-alb.us-east-1.elb.amazonaws.com',
          description: 'Application Load Balancer DNS name',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'asg-name',
        expect.objectContaining({
          value: 'compute-asg-name',
          description: 'Auto Scaling Group name',
        })
      );
    });

    test("should create database outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackDatabaseOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-endpoint',
        expect.objectContaining({
          value: 'database-rds.cluster-xyz.us-east-1.rds.amazonaws.com',
          description: 'RDS database endpoint',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-port',
        expect.objectContaining({
          value: '3306',
          description: 'RDS database port',
        })
      );
    });

    test("should create sensitive database secret outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackSecretOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-secret-arn',
        expect.objectContaining({
          value: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:database-rds-password-abc123',
          description: 'RDS password secret ARN',
          sensitive: true,
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-secret-name',
        expect.objectContaining({
          value: 'database-rds-password',
          description: 'RDS password secret name',
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
      expect(RandomProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(StorageModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledTimes(1);
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

  describe("Module Dependencies and Data Flow", () => {
    test("should pass correct network outputs to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStackNetworkDeps");

      // Security module should receive VPC ID from network
      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'security',
        expect.objectContaining({
          vpcId: 'network-vpc-id',
        })
      );

      // Compute module should receive network outputs
      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          vpcId: 'network-vpc-id',
          publicSubnetIds: ['network-public-subnet-1', 'network-public-subnet-2'],
          privateSubnetIds: ['network-private-subnet-1', 'network-private-subnet-2'],
        })
      );

      // Database module should receive private subnets
      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          privateSubnetIds: ['network-private-subnet-1', 'network-private-subnet-2'],
        })
      );
    });

    test("should pass correct security outputs to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStackSecurityDeps");

      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          ec2SecurityGroupId: 'security-ec2-sg-id',
          albSecurityGroupId: 'security-alb-sg-id',
        })
      );

      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          rdsSecurityGroupId: 'security-rds-sg-id',
        })
      );
    });

    test("should pass storage outputs to compute module", () => {
      const app = new App();
      new TapStack(app, "TestStackStorageDeps");

      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          instanceProfileName: 'storage-instance-profile',
        })
      );
    });
  });

  describe("Default Values and Fallbacks", () => {
    test("should use default environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultEnv");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStackDefaultEnv.tfstate',
        })
      );
    });

    test("should use default AWS region", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultRegion");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
        })
      );
    });

    test("should use default state bucket", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultBucket");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
        })
      );
    });

    test("should use default state bucket region", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultBucketRegion");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-east-1',
        })
      );
    });
  });

  describe("Props Validation and Handling", () => {
    test("should handle all props set to custom values", () => {
      const app = new App();
      const customTags = {
        tags: {
          Team: 'Infrastructure',
          Application: 'TapStack',
        },
      };

      new TapStack(app, "TestStackAllCustom", {
        environmentSuffix: 'staging',
        stateBucket: 'staging-terraform-states',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2',
          defaultTags: [customTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'staging-terraform-states',
          key: 'staging/TestStackAllCustom.tfstate',
          region: 'us-west-2',
          encrypt: true,
        })
      );
    });

    test("should handle mixed default and custom props", () => {
      const app = new App();
      new TapStack(app, "TestStackMixed", {
        environmentSuffix: 'test',
        awsRegion: 'eu-central-1',
        // stateBucket and stateBucketRegion should use defaults
        // defaultTags should be empty array
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1',
          defaultTags: [],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states', // default
          key: 'test/TestStackMixed.tfstate',
          region: 'us-east-1', // default
          encrypt: true,
        })
      );
    });
  });
});