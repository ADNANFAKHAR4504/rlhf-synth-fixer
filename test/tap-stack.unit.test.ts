// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    vpc: { id: `${id}-vpc-id` },
    publicSubnetIds: [`${id}-public-subnet-1`, `${id}-public-subnet-2`],
    privateSubnetIds: [], // Default to empty array
  })),
  SecurityGroupsModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    albSecurityGroup: { id: `${id}-alb-sg-id` },
    ec2SecurityGroup: { id: `${id}-ec2-sg-id` },
    rdsSecurityGroup: { id: `${id}-rds-sg-id` },
  })),
  IamModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    instanceProfile: { name: `${id}-instance-profile-name` },
  })),
  AutoScalingModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    autoScalingGroup: { name: `${id}-asg-name` },
    scaleUpPolicy: { arn: `arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:${id}-scale-up` },
    scaleDownPolicy: { arn: `arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:${id}-scale-down` },
  })),
  LoadBalancerModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    loadBalancer: { dnsName: `${id}-alb-123456789.us-west-2.elb.amazonaws.com` },
    targetGroup: { arn: `arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/${id}-tg/1234567890123456` },
  })),
  CloudWatchModule: jest.fn().mockImplementation((scope: any, id: string) => ({})),
  RdsModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    dbInstance: { 
      endpoint: `${id}-db.cluster-xyz.us-west-2.rds.amazonaws.com:3306`,
      masterUserSecret: {
        get: jest.fn().mockReturnValue({
          secretArn: `arn:aws:secretsmanager:us-west-2:123456789012:secret:rds-db-credentials/${id}-AbCdEf`
        })
      }
    },
  })),
  S3Module: jest.fn().mockImplementation((scope: any, id: string) => ({
    bucket: { bucket: `${id}-logs-bucket-123456` },
  })),
  SnsModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    topic: { arn: `arn:aws:sns:us-west-2:123456789012:${id}-alerts-topic` },
  })),
  StandardTags: {},
}));

// Mock TerraformOutput, S3Backend, and Fn to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  
  // Create a mock TerraformStack that includes addOverride method
  class MockTerraformStack {
    addOverride = jest.fn();
  }
  
  return {
    ...actual,
    TerraformStack: MockTerraformStack,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation(function(this: any) {
      // Make sure the mock has access to the stack's addOverride method
      return {};
    }),
    Fn: {
      join: jest.fn((delimiter: string, list: string[]) => list.join(delimiter)),
      conditional: jest.fn((condition: any, trueValue: any, falseValue: any) => {
        return condition !== undefined ? trueValue : falseValue;
      }),
      lookup: jest.fn(),
    },
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    NetworkingModule,
    SecurityGroupsModule,
    IamModule,
    AutoScalingModule,
    LoadBalancerModule,
    CloudWatchModule,
    RdsModule,
    S3Module,
    SnsModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend, Fn } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

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
        notificationEmail: 'test@example.com'
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
          region: 'us-west-2', // Default region
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
        environmentSuffix: 'staging',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
        notificationEmail: 'devops@company.com'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1', // Custom region
          defaultTags: [customTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'staging/TestStackCustom.tfstate',
          region: 'eu-west-1',
          encrypt: true,
        })
      );
    });

    test("should handle undefined and null defaultTags", () => {
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

    test("should handle empty string values and fallback to defaults", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyStrings", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
        notificationEmail: ''
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

    test("should use overrideRegion when provided", () => {
      const app = new App();
      new TapStack(app, "TestStackRegionOverride", {
        awsRegion: 'ap-southeast-1',
        overrideRegion: 'us-east-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // overrideRegion should take precedence
        })
      );
    });

    test("should use awsRegion when no overrideRegion is provided", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", {
        awsRegion: 'ap-southeast-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1', // awsRegion should be used
        })
      );
    });

    test("should use default region when neither overrideRegion nor awsRegion is provided", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultRegion");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2', // Default region
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create all modules with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackModules");

      // Verify NetworkingModule is created
      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          region: 'us-west-2',
          standardTags: expect.objectContaining({
            Environment: 'dev',
            Project: 'TAP',
            ManagedBy: 'Terraform',
            CreatedBy: 'CDKTF',
          })
        })
      );

      // Verify SecurityGroupsModule gets VPC ID
      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-groups",
        expect.objectContaining({
          vpcId: "networking-vpc-id",
          standardTags: expect.any(Object)
        })
      );

      // Verify IamModule is created
      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        "iam",
        expect.objectContaining({
          standardTags: expect.any(Object)
        })
      );

      // Verify S3Module is created
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        expect.objectContaining({
          standardTags: expect.any(Object)
        })
      );

      // Verify SnsModule is created with notification email
      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        expect.objectContaining({
          email: 'admin@example.com',
          standardTags: expect.any(Object)
        })
      );
    });

    test("should create modules with proper dependencies chain", () => {
      const app = new App();
      new TapStack(app, "TestDependencies");

      // Verify LoadBalancerModule gets correct dependencies
      expect(LoadBalancerModule).toHaveBeenCalledWith(
        expect.anything(),
        "load-balancer",
        expect.objectContaining({
          subnetIds: ["networking-public-subnet-1", "networking-public-subnet-2"],
          securityGroupId: "security-groups-alb-sg-id",
          vpcId: "networking-vpc-id",
          standardTags: expect.any(Object)
        })
      );

      // Verify AutoScalingModule gets correct dependencies
      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.anything(),
        "auto-scaling",
        expect.objectContaining({
          subnetIds: ["networking-public-subnet-1", "networking-public-subnet-2"],
          securityGroupId: "security-groups-ec2-sg-id",
          instanceProfileName: "iam-instance-profile-name",
          targetGroupArn: "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/load-balancer-tg/1234567890123456",
          standardTags: expect.any(Object)
        })
      );

      // Verify CloudWatchModule gets correct dependencies
      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudwatch",
        expect.objectContaining({
          autoScalingGroupName: "auto-scaling-asg-name",
          scaleUpPolicyArn: "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:auto-scaling-scale-up",
          scaleDownPolicyArn: "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:auto-scaling-scale-down",
          snsTopicArn: "arn:aws:sns:us-west-2:123456789012:sns-alerts-topic",
          standardTags: expect.any(Object)
        })
      );

      // Verify RdsModule gets correct dependencies - should use public subnets when private is empty
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.objectContaining({
          subnetIds: ["networking-public-subnet-1", "networking-public-subnet-2"],
          securityGroupId: "security-groups-rds-sg-id",
          standardTags: expect.any(Object)
        })
      );
    });

    test("should use private subnets for RDS when available", () => {
      // Mock NetworkingModule with private subnets
      NetworkingModule.mockImplementationOnce((scope: any, id: string) => ({
        vpc: { id: `${id}-vpc-id` },
        publicSubnetIds: [`${id}-public-subnet-1`, `${id}-public-subnet-2`],
        privateSubnetIds: [`${id}-private-subnet-1`, `${id}-private-subnet-2`],
      }));

      const app = new App();
      new TapStack(app, "TestPrivateSubnets");

      // Verify RdsModule uses private subnets when available
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.objectContaining({
          subnetIds: ["networking-private-subnet-1", "networking-private-subnet-2"],
          securityGroupId: "security-groups-rds-sg-id",
          standardTags: expect.any(Object)
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with state locking", () => {
      const app = new App();
      const stack = new TapStack(app, "TestBackend");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestBackend.tfstate',
          region: 'us-east-1',
          encrypt: true,
        })
      );

      // Verify the escape hatch for state locking is set
      expect(stack.addOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all expected outputs", () => {
      const app = new App();
      new TapStack(app, "TestOutputs");

      // Should create 10 outputs total
      expect(TerraformOutput).toHaveBeenCalledTimes(10);
      
      // Verify Fn.join is called for public subnet IDs
      expect(Fn.join).toHaveBeenCalledWith(',', ["networking-public-subnet-1", "networking-public-subnet-2"]);
      
      // Verify Fn.conditional is called for RDS secret ARN
      expect(Fn.conditional).toHaveBeenCalled();
    });

    test("should handle missing RDS masterUserSecret gracefully", () => {
      // Mock RdsModule to return dbInstance without masterUserSecret
      const { RdsModule } = require("../lib/modules");
      RdsModule.mockImplementationOnce((scope: any, id: string) => ({
        dbInstance: { 
          endpoint: `${id}-db.cluster-xyz.us-west-2.rds.amazonaws.com:3306`,
          masterUserSecret: undefined
        },
      }));

      const app = new App();
      new TapStack(app, "TestMissingSecret");

      // Verify Fn.conditional handles undefined masterUserSecret
      expect(Fn.conditional).toHaveBeenCalledWith(
        false, // undefined !== undefined is false
        'Secret ARN available in AWS Secrets Manager',
        'managed-by-aws'
      );
    });
  });

  describe("Integration Tests", () => {
    test("should create stack with all components integrated", () => {
      const app = new App();
      const stack = new TapStack(app, "TestIntegration");

      // Verify all main components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(NetworkingModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(SnsModule).toHaveBeenCalledTimes(1);
      expect(LoadBalancerModule).toHaveBeenCalledTimes(1);
      expect(AutoScalingModule).toHaveBeenCalledTimes(1);
      expect(CloudWatchModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
      expect(TerraformOutput).toHaveBeenCalledTimes(10); // All 10 outputs
    });

    test("should handle custom notification email", () => {
      const app = new App();
      new TapStack(app, "TestCustomEmail", {
        notificationEmail: 'custom@test.com'
      });

      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        expect.objectContaining({
          email: 'custom@test.com',
        })
      );
    });

    test("should create standard tags correctly", () => {
      const app = new App();
      new TapStack(app, "TestStandardTags", {
        environmentSuffix: 'production'
      });

      const expectedStandardTags = {
        Environment: 'production',
        Project: 'TAP',
        ManagedBy: 'Terraform',
        CreatedBy: 'CDKTF',
      };

      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          standardTags: expectedStandardTags
        })
      );
    });

    test("should handle all props simultaneously", () => {
      const app = new App();
      const customTags = {
        tags: {
          CustomTag1: 'Value1',
          CustomTag2: 'Value2',
        },
      };

      const stack = new TapStack(app, "TestAllProps", {
        environmentSuffix: 'qa',
        stateBucket: 'qa-state-bucket',
        stateBucketRegion: 'ap-southeast-2',
        awsRegion: 'ap-southeast-2',
        defaultTags: customTags,
        notificationEmail: 'qa-team@example.com',
        overrideRegion: 'eu-central-1'
      });

      expect(stack).toBeDefined();
      
      // Verify overrideRegion takes precedence
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1',
          defaultTags: [customTags],
        })
      );

      // Verify S3 backend configuration
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'qa-state-bucket',
          key: 'qa/TestAllProps.tfstate',
          region: 'ap-southeast-2',
          encrypt: true,
        })
      );

      // Verify notification email
      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        expect.objectContaining({
          email: 'qa-team@example.com',
        })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle falsy environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestFalsyEnv", {
        environmentSuffix: null as any
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestFalsyEnv.tfstate', // Should use default 'dev'
        })
      );
    });

    test("should handle all empty string props", () => {
      const app = new App();
      new TapStack(app, "TestEmptyProps", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
        awsRegion: '',
        notificationEmail: '',
        overrideRegion: ''
      });

      // Should fall back to all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-west-2', // Default region
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestEmptyProps.tfstate',
          region: 'us-east-1',
        })
      );

      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        expect.objectContaining({
          email: 'admin@example.com', // Default email
        })
      );
    });
  });
});