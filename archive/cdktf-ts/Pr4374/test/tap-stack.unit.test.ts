// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  CommonTags: {},
  VPCConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${id}`,
      cidrBlock: config.cidrBlock,
    },
    publicSubnets: [
      { id: `subnet-public-1-${id}` },
      { id: `subnet-public-2-${id}` }
    ],
    privateSubnets: [
      { id: `subnet-private-1-${id}` },
      { id: `subnet-private-2-${id}` }
    ],
    natGateways: [
      { id: `nat-1-${id}` },
      { id: `nat-2-${id}` }
    ]
  })),

  SecurityGroupsConstruct: jest.fn().mockImplementation((scope: any, id: string, vpcId: string, tags: any) => ({
    albSg: {
      id: `sg-alb-${id}`,
      name: `alb-security-group`,
    },
    ec2Sg: {
      id: `sg-ec2-${id}`,
      name: `ec2-security-group`,
    },
    rdsSg: {
      id: `sg-rds-${id}`,
      name: `rds-security-group`,
    }
  })),

  IAMConstruct: jest.fn().mockImplementation((scope: any, id: string, tags: any) => ({
    ec2Role: {
      arn: `arn:aws:iam::123456789012:role/ec2-${id}`,
      name: `ec2-role-${id}`,
    },
    ec2InstanceProfile: {
      name: `ec2-instance-profile-${id}`,
      arn: `arn:aws:iam::123456789012:instance-profile/ec2-${id}`,
    }
  })),

  RDSConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any, subnetIds: string[], securityGroupIds: string[]) => ({
    instance: {
      endpoint: `rds-${id}.cluster-123456789012.us-east-1.rds.amazonaws.com:5432`,
      id: `rds-${id}`,
      arn: `arn:aws:rds:us-east-1:123456789012:db:rds-${id}`,
    },
    subnetGroup: {
      id: `db-subnet-group-${id}`,
      name: `db-subnet-group-${id}`,
    }
  })),

  ALBConstruct: jest.fn().mockImplementation((scope: any, id: string, vpcId: string, subnetIds: string[], securityGroupIds: string[], tags: any) => ({
    alb: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-${id}/1234567890abcdef`,
      dnsName: `alb-${id}-1234567890.us-east-1.elb.amazonaws.com`,
      id: `alb-${id}`,
    },
    targetGroup: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-${id}/1234567890abcdef`,
      id: `tg-${id}`,
      name: `tg-${id}`,
    },
    listener: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/alb-${id}/1234567890abcdef`,
      id: `listener-${id}`,
    }
  })),

  ASGConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any, subnetIds: string[], securityGroupIds: string[], targetGroupArns: string[], instanceProfileName: string) => ({
    asg: {
      name: `asg-${id}`,
      id: `asg-${id}`,
      arn: `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:12345678-1234-1234-1234-123456789012:autoScalingGroupName/asg-${id}`,
    },
    launchTemplate: {
      id: `lt-${id}`,
      name: `launch-template-${id}`,
    }
  })),

  MonitoringConstruct: jest.fn().mockImplementation((scope: any, id: string, tags: any, albArn: string, asgName: string, rdsId: string) => ({
    snsTopic: {
      arn: `arn:aws:sns:us-east-1:123456789012:monitoring-${id}`,
      name: `monitoring-topic-${id}`,
    },
    logGroup: {
      name: `/aws/application/${id}`,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/application/${id}`,
    },
    cloudTrail: {
      name: `cloudtrail-${id}`,
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/cloudtrail-${id}`,
    },
    alarms: [
      { name: `alarm-cpu-${id}` },
      { name: `alarm-memory-${id}` },
      { name: `alarm-disk-${id}` }
    ]
  })),

  SSMHelpers: {
    createCloudWatchAgentConfig: jest.fn(),
    createParameter: jest.fn(),
  },

  VPCConfig: {},
  RDSConfig: {},
  ASGConfig: {},
}));

// Mock AWS Provider and related data sources
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: "123456789012",
    arn: "arn:aws:iam::123456789012:root",
    userId: "AIDACKCEVSQ6C2EXAMPLE",
  })),
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack,
  };
});

describe("TapStack Unit Tests", () => {
  const {
    VPCConstruct,
    SecurityGroupsConstruct,
    IAMConstruct,
    RDSConstruct,
    ALBConstruct,
    ASGConstruct,
    MonitoringConstruct,
    SSMHelpers,
  } = require("../lib/modules");
  
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      // Verify DataAwsCallerIdentity is created
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = { tags: { Department: 'Engineering', Team: 'Platform' } };

      new TapStack(app, "test-stack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "test-stack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom state bucket", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'ap-southeast-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-state-bucket',
          region: 'ap-southeast-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );
    });
  });

  describe("VPC Configuration", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          natGatewayCount: 2,
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev',
            Owner: 'platform-team'
          })
        })
      );
    });

    test("should create VPC with environment-specific tags", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        })
      );
    });
  });

  describe("Security Groups Configuration", () => {
    test("should create security groups with VPC ID", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        'vpc-vpc',
        expect.objectContaining({
          Project: 'tap-project',
          Environment: 'dev',
          Owner: 'platform-team',
          ManagedBy: 'terraform-cdktf',
          CostCenter: 'engineering'
        })
      );
    });
  });

  describe("IAM Configuration", () => {
    test("should create IAM roles and policies", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IAMConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          Project: 'tap-project',
          Environment: 'dev'
        })
      );
    });
  });

  describe("RDS Configuration", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          maxAllocatedStorage: 100,
          engine: 'postgres',
          username: 'dbadmin',
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
          tags: expect.objectContaining({
            Project: 'tap-project'
          })
        }),
        expect.arrayContaining(['subnet-private-1-vpc', 'subnet-private-2-vpc']),
        ['sg-rds-security-groups']
      );
    });

    test("should pass correct subnet IDs to RDS", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const rdsCall = RDSConstruct.mock.calls[0];
      const subnetIds = rdsCall[3];
      
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds).toEqual(expect.arrayContaining([
        'subnet-private-1-vpc',
        'subnet-private-2-vpc'
      ]));
    });
  });

  describe("ALB Configuration", () => {
    test("should create Application Load Balancer with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(ALBConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        'vpc-vpc',
        expect.arrayContaining(['subnet-public-1-vpc', 'subnet-public-2-vpc']),
        ['sg-alb-security-groups'],
        expect.objectContaining({
          Project: 'tap-project',
          Environment: 'dev'
        })
      );
    });

    test("should use public subnets for ALB", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const albCall = ALBConstruct.mock.calls[0];
      const subnetIds = albCall[3];
      
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds[0]).toMatch(/subnet-public-/);
      expect(subnetIds[1]).toMatch(/subnet-public-/);
    });
  });

  describe("Auto Scaling Group Configuration", () => {
    test("should create ASG with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(ASGConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 2,
          instanceType: 't3.micro',
          tags: expect.objectContaining({
            Project: 'tap-project'
          })
        }),
        expect.arrayContaining(['subnet-private-1-vpc', 'subnet-private-2-vpc']),
        ['sg-ec2-security-groups'],
        ['arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-alb/1234567890abcdef'],
        'ec2-instance-profile-iam'
      );
    });

    test("should use private subnets for ASG instances", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const asgCall = ASGConstruct.mock.calls[0];
      const subnetIds = asgCall[3];
      
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds[0]).toMatch(/subnet-private-/);
      expect(subnetIds[1]).toMatch(/subnet-private-/);
    });
  });

  describe("Monitoring Configuration", () => {
    test("should create monitoring resources with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(MonitoringConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          Project: 'tap-project',
          Environment: 'dev'
        }),
        'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-alb/1234567890abcdef',
        'asg-asg',
        'rds-rds'
      );
    });

    test("should pass correct resource identifiers to monitoring", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const monitoringCall = MonitoringConstruct.mock.calls[0];
      
      expect(monitoringCall[3]).toContain('alb-alb');
      expect(monitoringCall[4]).toBe('asg-asg');
      expect(monitoringCall[5]).toBe('rds-rds');
    });
  });

  describe("SSM Parameter Store Configuration", () => {
    test("should create CloudWatch agent configuration in SSM", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SSMHelpers.createCloudWatchAgentConfig).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Project: 'tap-project',
          Environment: 'dev'
        })
      );
    });

    test("should store ALB DNS name in SSM", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SSMHelpers.createParameter).toHaveBeenCalledWith(
        expect.anything(),
        'alb/dns-name',
        'alb-alb-1234567890.us-east-1.elb.amazonaws.com',
        'ALB DNS name for application access',
        expect.objectContaining({
          Project: 'tap-project',
          Environment: 'dev'
        }),
        false
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('alb-arn');
      expect(outputIds).toContain('asg-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('rds-instance-id');
      expect(outputIds).toContain('sns-topic-arn');
      expect(outputIds).toContain('cloudwatch-log-group');
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('aws-region');
    });

    test("should output VPC information with correct descriptions", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );

      expect(vpcOutput).toBeDefined();
      expect(vpcOutput[2]).toHaveProperty('value', 'vpc-vpc');
      expect(vpcOutput[2]).toHaveProperty('description', 'VPC ID');
    });

    test("should output subnet arrays", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const publicSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      const privateSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );

      expect(publicSubnetsOutput[2].value).toEqual(['subnet-public-1-vpc', 'subnet-public-2-vpc']);
      expect(publicSubnetsOutput[2].description).toBe('Public subnet IDs');

      expect(privateSubnetsOutput[2].value).toEqual(['subnet-private-1-vpc', 'subnet-private-2-vpc']);
      expect(privateSubnetsOutput[2].description).toBe('Private subnet IDs');
    });

    test("should output ALB information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const albDnsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      const albArnOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-arn'
      );

      expect(albDnsOutput[2].value).toContain('elb.amazonaws.com');
      expect(albDnsOutput[2].description).toBe('Application Load Balancer DNS name');

      expect(albArnOutput[2].value).toContain('arn:aws:elasticloadbalancing');
      expect(albArnOutput[2].description).toBe('Application Load Balancer ARN');
    });

    test("should output RDS information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const rdsEndpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      const rdsIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-instance-id'
      );

      expect(rdsEndpointOutput[2].value).toContain('rds.amazonaws.com');
      expect(rdsEndpointOutput[2].description).toBe('RDS PostgreSQL instance endpoint');

      expect(rdsIdOutput[2].value).toBe('rds-rds');
      expect(rdsIdOutput[2].description).toBe('RDS instance identifier');
    });

    test("should output monitoring resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const snsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'sns-topic-arn'
      );
      const logGroupOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'cloudwatch-log-group'
      );

      expect(snsOutput[2].value).toContain('arn:aws:sns');
      expect(snsOutput[2].description).toBe('SNS topic ARN for alerts');

      expect(logGroupOutput[2].value).toContain('/aws/application/');
      expect(logGroupOutput[2].description).toBe('CloudWatch log group for application logs');
    });

    test("should output AWS account information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const accountIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );
      const regionOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-region'
      );

      expect(accountIdOutput[2].value).toBe('123456789012');
      expect(accountIdOutput[2].description).toBe('Current AWS Account ID');

      expect(regionOutput[2].value).toBe('us-east-1');
      expect(regionOutput[2].description).toBe('AWS Region where resources are deployed');
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'dev'
      });

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );

      expect(MonitoringConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          Environment: 'dev'
        }),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        }),
        expect.anything(),
        expect.anything()
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(ASGConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging'
          })
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );

      expect(IAMConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          Environment: 'staging'
        })
      );
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC ID to security groups", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        'vpc-vpc',
        expect.anything()
      );
    });

    test("should pass security group IDs to dependent resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // RDS should use RDS security group
      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        ['sg-rds-security-groups']
      );

      // ALB should use ALB security group
      expect(ALBConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        ['sg-alb-security-groups'],
        expect.anything()
      );

      // ASG should use EC2 security group
      expect(ASGConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        ['sg-ec2-security-groups'],
        expect.anything(),
        expect.anything()
      );
    });

    test("should pass subnet IDs to dependent resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // ALB should use public subnets
      const albCall = ALBConstruct.mock.calls[0];
      expect(albCall[3]).toEqual(['subnet-public-1-vpc', 'subnet-public-2-vpc']);

      // RDS should use private subnets
      const rdsCall = RDSConstruct.mock.calls[0];
      expect(rdsCall[3]).toEqual(['subnet-private-1-vpc', 'subnet-private-2-vpc']);

      // ASG should use private subnets
      const asgCall = ASGConstruct.mock.calls[0];
      expect(asgCall[3]).toEqual(['subnet-private-1-vpc', 'subnet-private-2-vpc']);
    });

    test("should pass IAM instance profile to ASG", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(ASGConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'ec2-instance-profile-iam'
      );
    });

    test("should pass target group ARN from ALB to ASG", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const asgCall = ASGConstruct.mock.calls[0];
      const targetGroupArns = asgCall[5];
      
      expect(targetGroupArns).toEqual(['arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-alb/1234567890abcdef']);
    });

    test("should pass resource identifiers to monitoring construct", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(MonitoringConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.stringContaining('alb-alb'),
        'asg-asg',
        'rds-rds'
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", undefined);

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {});

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          natGatewayCount: 2
        })
      );
    });

    test("should handle all props being set", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {
        environmentSuffix: 'prod',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'ap-southeast-2',
        defaultTags: { tags: { Owner: 'TeamA' } }
      });

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2',
          defaultTags: [{ tags: { Owner: 'TeamA' } }]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'prod/test-stack.tfstate',
          region: 'eu-west-1'
        })
      );
    });
  });

  describe("Common Tags Configuration", () => {
    test("should apply common tags to all resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const expectedTags = {
        Project: 'tap-project',
        Environment: 'dev',
        Owner: 'platform-team',
        ManagedBy: 'terraform-cdktf',
        CostCenter: 'engineering'
      };

      // Verify tags are applied to all major constructs
      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expectedTags
      );

      expect(IAMConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expectedTags
      );

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        }),
        expect.anything(),
        expect.anything()
      );

      expect(ALBConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expectedTags
      );

      expect(ASGConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      );

      expect(MonitoringConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expectedTags,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    test("should update common tags based on environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'production'
      });

      const expectedTags = {
        Project: 'tap-project',
        Environment: 'production',
        Owner: 'platform-team',
        ManagedBy: 'terraform-cdktf',
        CostCenter: 'engineering'
      };

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });
  });

  describe("Complete Infrastructure Integration", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(VPCConstruct).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsConstruct).toHaveBeenCalledTimes(1);
      expect(IAMConstruct).toHaveBeenCalledTimes(1);
      expect(RDSConstruct).toHaveBeenCalledTimes(1);
      expect(ALBConstruct).toHaveBeenCalledTimes(1);
      expect(ASGConstruct).toHaveBeenCalledTimes(1);
      expect(MonitoringConstruct).toHaveBeenCalledTimes(1);
      expect(SSMHelpers.createCloudWatchAgentConfig).toHaveBeenCalledTimes(1);
      expect(SSMHelpers.createParameter).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(12);

      expect(stack).toBeDefined();
    });

    test("should handle AWS region configuration across all resources", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'eu-central-1',
        stateBucketRegion: 'us-west-2',
        environmentSuffix: 'prod'
      });

      // Verify provider uses correct region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );

      // Verify state bucket uses different region
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-west-2'
        })
      );

      // Verify outputs include correct region
      const regionOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-region'
      );
      expect(regionOutput[2].value).toBe('eu-central-1');
    });
  });

  describe("Resource Creation Order", () => {
    test("should create resources in correct dependency order", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const callOrder: string[] = [];
      
      // Track the order of construct calls
      VPCConstruct.mock.calls.forEach(() => callOrder.push('VPC'));
      SecurityGroupsConstruct.mock.calls.forEach(() => callOrder.push('SecurityGroups'));
      IAMConstruct.mock.calls.forEach(() => callOrder.push('IAM'));
      RDSConstruct.mock.calls.forEach(() => callOrder.push('RDS'));
      ALBConstruct.mock.calls.forEach(() => callOrder.push('ALB'));
      ASGConstruct.mock.calls.forEach(() => callOrder.push('ASG'));
      MonitoringConstruct.mock.calls.forEach(() => callOrder.push('Monitoring'));

      // Verify order: VPC -> Security Groups -> IAM -> RDS -> ALB -> ASG -> Monitoring
      expect(callOrder).toEqual(['VPC', 'SecurityGroups', 'IAM', 'RDS', 'ALB', 'ASG', 'Monitoring']);
    });
  });
});