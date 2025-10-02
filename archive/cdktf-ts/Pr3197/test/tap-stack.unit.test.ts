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
      jsonencode: jest.fn((value: any) => JSON.stringify(value)),
      conditional: jest.fn((condition: any, trueValue: any, falseValue: any) => {
        // Properly handle the condition check
        const conditionResult = condition !== undefined && condition !== false && condition !== null;
        return conditionResult ? trueValue : falseValue;
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

  describe("Stack Construction and Resource Creation", () => {
    test("should create TapStack with all required resources", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      
      // Verify all resources are created
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
    });

    test("should create AWS Provider with correct configuration", () => {
      const app = new App();
      const customTags = {
        tags: {
          Department: 'Engineering',
          CostCenter: '12345',
        },
      };

      new TapStack(app, "TestProvider", {
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'eu-west-1',
          defaultTags: [customTags],
        }
      );
    });

    test("should create S3 Backend with state locking enabled", () => {
      const app = new App();
      const stack = new TapStack(app, "TestBackend", {
        environmentSuffix: 'staging',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-central-1',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'my-state-bucket',
          key: 'staging/TestBackend.tfstate',
          region: 'eu-central-1',
          encrypt: true,
        }
      );

      // Verify state locking is enabled via escape hatch
      expect(stack.addOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create NetworkingModule with correct parameters", () => {
      const app = new App();
      new TapStack(app, "TestNetworking", {
        awsRegion: 'us-east-1',
        environmentSuffix: 'prod',
      });

      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        {
          region: 'us-east-1',
          standardTags: {
            Environment: 'prod',
            Project: 'TAP',
            ManagedBy: 'Terraform',
            CreatedBy: 'CDKTF',
          }
        }
      );
    });

    test("should create SecurityGroupsModule with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestSecurityGroups");

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-groups",
        {
          vpcId: "networking-vpc-id",
          standardTags: expect.objectContaining({
            Environment: 'dev',
            Project: 'TAP',
          })
        }
      );
    });

    test("should create IamModule with environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestIam", {
        environmentSuffix: 'qa',
      });

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        "iam",
        {
          standardTags: expect.any(Object),
          environmentSuffix: 'qa',
        }
      );
    });

    test("should create LoadBalancerModule with ALB security group and public subnets", () => {
      const app = new App();
      new TapStack(app, "TestLoadBalancer");

      expect(LoadBalancerModule).toHaveBeenCalledWith(
        expect.anything(),
        "load-balancer",
        {
          subnetIds: ["networking-public-subnet-1", "networking-public-subnet-2"],
          securityGroupId: "security-groups-alb-sg-id",
          vpcId: "networking-vpc-id",
          standardTags: expect.any(Object)
        }
      );
    });

    test("should create AutoScalingModule with all required dependencies", () => {
      const app = new App();
      new TapStack(app, "TestAutoScaling");

      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.anything(),
        "auto-scaling",
        {
          subnetIds: ["networking-public-subnet-1", "networking-public-subnet-2"],
          securityGroupId: "security-groups-ec2-sg-id",
          instanceProfileName: "iam-instance-profile-name",
          targetGroupArn: "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/load-balancer-tg/1234567890123456",
          standardTags: expect.any(Object)
        }
      );
    });

    test("should create CloudWatchModule with AutoScaling and SNS dependencies", () => {
      const app = new App();
      new TapStack(app, "TestCloudWatch");

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudwatch",
        {
          autoScalingGroupName: "auto-scaling-asg-name",
          scaleUpPolicyArn: "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:auto-scaling-scale-up",
          scaleDownPolicyArn: "arn:aws:autoscaling:us-west-2:123456789012:scalingPolicy:auto-scaling-scale-down",
          snsTopicArn: "arn:aws:sns:us-west-2:123456789012:sns-alerts-topic",
          standardTags: expect.any(Object)
        }
      );
    });

    test("should create RdsModule with private subnets when available", () => {
      // Mock NetworkingModule with private subnets
      NetworkingModule.mockImplementationOnce((scope: any, id: string) => ({
        vpc: { id: `${id}-vpc-id` },
        publicSubnetIds: [`${id}-public-subnet-1`, `${id}-public-subnet-2`],
        privateSubnetIds: [`${id}-private-subnet-1`, `${id}-private-subnet-2`],
      }));

      const app = new App();
      new TapStack(app, "TestRdsPrivate");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        {
          subnetIds: ["networking-private-subnet-1", "networking-private-subnet-2"],
          securityGroupId: "security-groups-rds-sg-id",
          standardTags: expect.any(Object)
        }
      );
    });

    test("should create RdsModule with public subnets when private subnets are empty", () => {
      const app = new App();
      new TapStack(app, "TestRdsPublic");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        {
          subnetIds: ["networking-public-subnet-1", "networking-public-subnet-2"],
          securityGroupId: "security-groups-rds-sg-id",
          standardTags: expect.any(Object)
        }
      );
    });

    test("should create SnsModule with notification email", () => {
      const app = new App();
      new TapStack(app, "TestSns", {
        notificationEmail: 'alerts@company.com',
      });

      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        {
          email: 'alerts@company.com',
          standardTags: expect.any(Object)
        }
      );
    });

    test("should create S3Module with standard tags", () => {
      const app = new App();
      new TapStack(app, "TestS3");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        {
          standardTags: expect.objectContaining({
            Environment: 'dev',
            Project: 'TAP',
            ManagedBy: 'Terraform',
            CreatedBy: 'CDKTF',
          })
        }
      );
    });
  });

  describe("Props Handling and Defaults", () => {
    test("should use all default values when no props provided", () => {
      const app = new App();
      new TapStack(app, "TestDefaults");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-west-2',
          defaultTags: [],
        }
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestDefaults.tfstate',
          region: 'us-east-1',
          encrypt: true,
        }
      );

      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        expect.objectContaining({
          email: 'admin@example.com',
        })
      );
    });

    test("should handle overrideRegion precedence over awsRegion", () => {
      const app = new App();
      new TapStack(app, "TestOverrideRegion", {
        awsRegion: 'ap-southeast-1',
        overrideRegion: 'us-east-2',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-east-2',
          defaultTags: [],
        }
      );
    });

    test("should use awsRegion when overrideRegion not provided", () => {
      const app = new App();
      new TapStack(app, "TestAwsRegion", {
        awsRegion: 'ap-southeast-2',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'ap-southeast-2',
          defaultTags: [],
        }
      );
    });

    test("should handle empty string props and use defaults", () => {
      const app = new App();
      new TapStack(app, "TestEmptyStrings", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
        awsRegion: '',
        notificationEmail: '',
        overrideRegion: ''
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-west-2',
          defaultTags: [],
        }
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestEmptyStrings.tfstate',
          region: 'us-east-1',
          encrypt: true,
        }
      );
    });

    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestUndefined", undefined);

      expect(stack).toBeDefined();
      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          region: 'us-west-2',
        })
      );
    });

    test("should handle null defaultTags", () => {
      const app = new App();
      new TapStack(app, "TestNullTags", {
        defaultTags: null as any,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-west-2',
          defaultTags: [],
        }
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required outputs", () => {
      const app = new App();
      new TapStack(app, "TestOutputs");

      // Verify all 10 outputs are created
      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      // Verify specific outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        {
          value: 'networking-vpc-id',
          description: 'VPC ID',
        }
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'load-balancer-dns-name',
        {
          value: 'load-balancer-alb-123456789.us-west-2.elb.amazonaws.com',
          description: 'Load balancer DNS name',
        }
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-endpoint',
        {
          value: 'rds-db.cluster-xyz.us-west-2.rds.amazonaws.com:3306',
          description: 'RDS instance endpoint',
        }
      );
    });

    test("should jsonencode public subnet IDs", () => {
      const app = new App();
      new TapStack(app, "TestJsonOutput");

      expect(Fn.jsonencode).toHaveBeenCalledWith([
        "networking-public-subnet-1", 
        "networking-public-subnet-2"
      ]);

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-ids',
        {
          value: JSON.stringify(["networking-public-subnet-1", "networking-public-subnet-2"]),
          description: 'Public subnet IDs as JSON',
        }
      );
    });


    test("should create outputs for all security groups", () => {
      const app = new App();
      new TapStack(app, "TestSecurityGroupOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-security-group-id',
        {
          value: 'security-groups-ec2-sg-id',
          description: 'EC2 security group ID',
        }
      );
    });

    test("should create outputs for monitoring resources", () => {
      const app = new App();
      new TapStack(app, "TestMonitoringOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        's3-bucket-name',
        {
          value: 's3-logs-bucket-123456',
          description: 'S3 bucket name for logs',
        }
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'sns-topic-arn',
        {
          value: 'arn:aws:sns:us-west-2:123456789012:sns-alerts-topic',
          description: 'SNS topic ARN for alerts',
        }
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle all props with custom values", () => {
      const app = new App();
      const customTags = {
        tags: {
          Team: 'Platform',
          Environment: 'production',
        },
      };

      new TapStack(app, "TestAllCustom", {
        environmentSuffix: 'production',
        stateBucket: 'prod-terraform-state',
        stateBucketRegion: 'eu-west-2',
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
        notificationEmail: 'platform@company.com',
        overrideRegion: 'us-west-1'
      });

      // Verify override region takes precedence
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-west-1',
          defaultTags: [customTags],
        }
      );

      // Verify custom state bucket configuration
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'prod-terraform-state',
          key: 'production/TestAllCustom.tfstate',
          region: 'eu-west-2',
          encrypt: true,
        }
      );

      // Verify custom notification email
      expect(SnsModule).toHaveBeenCalledWith(
        expect.anything(),
        "sns",
        expect.objectContaining({
          email: 'platform@company.com',
        })
      );

      // Verify standard tags use custom environment
      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          standardTags: expect.objectContaining({
            Environment: 'production',
          })
        })
      );
    });

    test("should handle falsy values for all optional props", () => {
      const app = new App();
      new TapStack(app, "TestFalsyValues", {
        environmentSuffix: null as any,
        stateBucket: undefined,
        stateBucketRegion: false as any,
        awsRegion: 0 as any,
        defaultTags: undefined,
        notificationEmail: null as any,
        overrideRegion: false as any
      });

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-west-2',
          defaultTags: [],
        }
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestFalsyValues.tfstate',
          region: 'us-east-1',
          encrypt: true,
        }
      );
    });

    test("should handle empty arrays from NetworkingModule", () => {
      NetworkingModule.mockImplementationOnce((scope: any, id: string) => ({
        vpc: { id: `${id}-vpc-id` },
        publicSubnetIds: [],
        privateSubnetIds: [],
      }));

      const app = new App();
      new TapStack(app, "TestEmptySubnets");

      // Should still create modules with empty arrays
      expect(LoadBalancerModule).toHaveBeenCalledWith(
        expect.anything(),
        "load-balancer",
        expect.objectContaining({
          subnetIds: [],
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.objectContaining({
          subnetIds: [],
        })
      );
    });
  });

  describe("Standard Tags Creation", () => {
    test("should create correct standard tags for all environments", () => {
      const environments = ['dev', 'staging', 'production', 'qa', 'test'];

      environments.forEach(env => {
        jest.clearAllMocks();
        
        const app = new App();
        new TapStack(app, `Test${env}Stack`, {
          environmentSuffix: env,
        });

        expect(NetworkingModule).toHaveBeenCalledWith(
          expect.anything(),
          "networking",
          {
            region: 'us-west-2',
            standardTags: {
              Environment: env,
              Project: 'TAP',
              ManagedBy: 'Terraform',
              CreatedBy: 'CDKTF',
            }
          }
        );
      });
    });

    test("should pass standard tags to all modules", () => {
      const app = new App();
      new TapStack(app, "TestTagsPropagation", {
        environmentSuffix: 'staging',
      });

      const expectedTags = {
        Environment: 'staging',
        Project: 'TAP',
        ManagedBy: 'Terraform',
        CreatedBy: 'CDKTF',
      };

      // Verify all modules receive standard tags
      [
        NetworkingModule,
        SecurityGroupsModule,
        IamModule,
        S3Module,
        SnsModule,
        LoadBalancerModule,
        AutoScalingModule,
        CloudWatchModule,
        RdsModule
      ].forEach(Module => {
        expect(Module).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(String),
          expect.objectContaining({
            standardTags: expectedTags
          })
        );
      });
    });
  });
});