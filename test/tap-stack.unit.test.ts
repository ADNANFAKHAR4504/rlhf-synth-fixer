// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.projectName}-${config.environment}`,
      cidrBlock: config.vpcCidr,
    },
    publicSubnets: config.publicSubnetCidrs.map((cidr: string, index: number) => ({
      id: `subnet-public-${index + 1}-${config.projectName}`
    })),
    privateSubnets: config.privateSubnetCidrs.map((cidr: string, index: number) => ({
      id: `subnet-private-${index + 1}-${config.projectName}`
    }))
  })),

  SecurityGroupsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    albSecurityGroup: {
      id: `sg-alb-${config.projectName}-${config.environment}`,
      name: `alb-sg-${config.projectName}`,
    },
    ec2SecurityGroup: {
      id: `sg-ec2-${config.projectName}-${config.environment}`,
      name: `ec2-sg-${config.projectName}`,
    },
    rdsSecurityGroup: {
      id: `sg-rds-${config.projectName}-${config.environment}`,
      name: `rds-sg-${config.projectName}`,
    }
  })),

  AlbModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    alb: {
      id: `alb-${config.projectName}-${config.environment}`,
      dnsName: `${config.projectName}-${config.environment}.elb.amazonaws.com`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${config.projectName}`,
    },
    targetGroup: {
      id: `tg-${config.projectName}-${config.environment}`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${config.projectName}`,
    }
  })),

  IamModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    instanceProfile: {
      arn: `arn:aws:iam::123456789012:instance-profile/${config.projectName}-${config.environment}`,
      name: `${config.projectName}-${config.environment}-profile`,
    },
    role: {
      arn: `arn:aws:iam::123456789012:role/${config.projectName}-${config.environment}-role`,
      name: `${config.projectName}-${config.environment}-role`,
    }
  })),

  AsgModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    autoScalingGroup: {
      id: `asg-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-${config.environment}-asg`,
      arn: `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:${config.projectName}`,
    },
    launchTemplate: {
      id: `lt-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-${config.environment}-lt`,
    }
  })),

  RdsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dbInstance: {
      id: `db-${config.projectName}-${config.environment}`,
      endpoint: `${config.projectName}-${config.environment}.cluster-123456789012.us-east-1.rds.amazonaws.com:5432`,
      dbName: config.dbName || 'appdb',
      arn: `arn:aws:rds:us-east-1:123456789012:db:${config.projectName}-${config.environment}`,
    },
    subnetGroup: {
      name: `db-subnet-${config.projectName}-${config.environment}`,
    }
  })),

  CloudWatchModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    logGroup: {
      name: `/aws/${config.projectName}/${config.environment}`,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/${config.projectName}/${config.environment}`,
    },
    dashboard: {
      name: `${config.projectName}-${config.environment}-dashboard`,
    }
  })),

  SsmParameterModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => {
    const params: any = {};
    Object.keys(config.parameters).forEach(key => {
      params[key] = {
        name: `/${config.projectName}/${config.environment}/${key}`,
        value: config.parameters[key],
        arn: `arn:aws:ssm:us-east-1:123456789012:parameter/${config.projectName}/${config.environment}/${key}`,
      };
    });
    return { parameters: params };
  }),
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
    VpcModule,
    SecurityGroupsModule,
    AlbModule,
    IamModule,
    AsgModule,
    RdsModule,
    CloudWatchModule,
    SsmParameterModule,
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

    test("should use custom project name", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        projectName: 'my-custom-project'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'my-custom-project'
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

  describe("VPC Module Configuration", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          enableNatGatewayPerAz: false,
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev',
            ManagedBy: 'Terraform',
            CreatedBy: 'CDKTF'
          })
        })
      );
    });

    test("should create VPC with environment-specific naming", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging',
        projectName: 'my-app'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'my-app',
          environment: 'staging',
        })
      );
    });

    test("should configure availability zones based on region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'eu-west-1'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['eu-west-1a', 'eu-west-1b']
        })
      );
    });
  });

  describe("Security Groups Module Configuration", () => {
    test("should create security groups with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          vpcId: expect.stringMatching(/^vpc-/),
          albAllowedCidr: '0.0.0.0/0',
          applicationPort: 8080,
          databasePort: 5432,
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should pass correct VPC ID to security groups", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        projectName: 'test-app'
      });

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        expect.objectContaining({
          vpcId: 'vpc-test-app-dev'
        })
      );
    });
  });

  describe("IAM Module Configuration", () => {
    test("should create IAM module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          enableSsmAccess: true,
          additionalPolicies: [
            'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
          ],
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should configure IAM with custom project name", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        projectName: 'custom-app',
        environmentSuffix: 'prod'
      });

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          projectName: 'custom-app',
          environment: 'prod'
        })
      );
    });
  });

  describe("ALB Module Configuration", () => {
    test("should create ALB with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          vpcId: expect.stringMatching(/^vpc-/),
          publicSubnetIds: expect.arrayContaining([
            expect.stringMatching(/^subnet-public-/)
          ]),
          securityGroupId: expect.stringMatching(/^sg-alb-/),
          targetType: 'instance',
          healthCheckPath: '/health',
          applicationPort: 8080,
          enableAccessLogs: false,
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should use correct public subnets for ALB", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          publicSubnetIds: [
            'subnet-public-1-tap-project',
            'subnet-public-2-tap-project'
          ]
        })
      );
    });
  });

  describe("Auto Scaling Group Module Configuration", () => {
    test("should create ASG with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          customAmiId: 'ami-0c02fb55956c7d316',
          instanceType: 't3.medium',
          keyName: undefined,
          instanceProfileArn: expect.stringMatching(/^arn:aws:iam::/),
          securityGroupIds: [expect.stringMatching(/^sg-ec2-/)],
          subnetIds: expect.arrayContaining([
            expect.stringMatching(/^subnet-private-/)
          ]),
          targetGroupArns: [expect.stringMatching(/^arn:aws:elasticloadbalancing:/)],
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 2,
          userData: expect.stringContaining('#!/bin/bash'),
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should use custom AMI ID when provided", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        customAmiId: 'ami-custom12345'
      });

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({
          customAmiId: 'ami-custom12345'
        })
      );
    });

    test("should use key name when provided", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        keyName: 'my-ec2-key'
      });

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({
          keyName: 'my-ec2-key'
        })
      );
    });

    test("should configure ASG with proper user data", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({
          userData: expect.stringContaining('yum update -y'),
        })
      );
    });
  });

  describe("RDS Module Configuration", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          instanceClass: 'db.t3.medium',
          allocatedStorage: 100,
          storageType: 'gp3',
          storageEncrypted: true,
          engine: 'postgres',
          parameterGroupFamily: 'postgres17',
          dbName: 'appdb',
          masterUsername: 'dbadmin',
          masterPassword: undefined,
          backupRetentionPeriod: 7,
          multiAz: true,
          subnetIds: expect.arrayContaining([
            expect.stringMatching(/^subnet-private-/)
          ]),
          securityGroupIds: [expect.stringMatching(/^sg-rds-/)],
          deletionProtection: false,
          applyImmediately: false,
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should enable deletion protection for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          deletionProtection: true
        })
      );
    });

    test("should use custom database password when provided", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        dbPassword: 'SuperSecurePassword123!'
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          masterPassword: 'SuperSecurePassword123!'
        })
      );
    });

    test("should use private subnets for RDS", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          subnetIds: [
            'subnet-private-1-tap-project',
            'subnet-private-2-tap-project'
          ]
        })
      );
    });
  });

  describe("CloudWatch Module Configuration", () => {
    test("should create CloudWatch module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        'cloudwatch',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          logRetentionDays: 7,
          alarmEmail: undefined,
          asgName: 'tap-project-dev-asg',
          dbInstanceId: 'db-tap-project-dev',
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should configure alarm email when provided", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        alarmEmail: 'alerts@example.com'
      });

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        'cloudwatch',
        expect.objectContaining({
          alarmEmail: 'alerts@example.com'
        })
      );
    });
  });

  describe("SSM Parameters Module Configuration", () => {
    test("should create SSM parameters with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SsmParameterModule).toHaveBeenCalledWith(
        expect.anything(),
        'ssm-parameters',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          parameters: {
            'app/database-endpoint': expect.stringMatching(/\.rds\.amazonaws\.com/),
            'app/database-name': 'appdb',
            'app/alb-dns': expect.stringMatching(/\.elb\.amazonaws\.com/)
          },
          tags: expect.objectContaining({
            Project: 'tap-project',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create SSM parameters with environment-specific values", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging',
        projectName: 'my-app'
      });

      expect(SsmParameterModule).toHaveBeenCalledWith(
        expect.anything(),
        'ssm-parameters',
        expect.objectContaining({
          projectName: 'my-app',
          environment: 'staging',
          parameters: {
            'app/database-endpoint': 'my-app-staging.cluster-123456789012.us-east-1.rds.amazonaws.com:5432',
            'app/database-name': 'appdb',
            'app/alb-dns': 'my-app-staging.elb.amazonaws.com'
          }
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(TerraformOutput).toHaveBeenCalled();

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
      expect(outputIds).toContain('aws-account-id');
    });

    test("should output VPC and subnet information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );

      expect(vpcOutput).toBeDefined();
      expect(vpcOutput[2]).toHaveProperty('value');
      expect(vpcOutput[2]).toHaveProperty('description', 'VPC ID');
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

      expect(albDnsOutput).toBeDefined();
      expect(albDnsOutput[2]).toHaveProperty('description', 'ALB DNS name');
      
      expect(albArnOutput).toBeDefined();
      expect(albArnOutput[2]).toHaveProperty('description', 'ALB ARN');
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

      expect(rdsEndpointOutput[2]).toHaveProperty('description', 'RDS instance endpoint');
      expect(rdsIdOutput[2]).toHaveProperty('description', 'RDS instance ID');
    });

    test("should output ASG information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const asgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'asg-name'
      );

      expect(asgOutput).toBeDefined();
      expect(asgOutput[2]).toHaveProperty('description', 'Auto Scaling Group name');
    });

    test("should output AWS account ID", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const accountOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );

      expect(accountOutput).toBeDefined();
      expect(accountOutput[2]).toHaveProperty('value', '123456789012');
      expect(accountOutput[2]).toHaveProperty('description', 'Current AWS Account ID');
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'dev'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'dev'
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          deletionProtection: false
        })
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'staging'
        })
      );

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'staging'
        })
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          deletionProtection: true,
          environment: 'prod'
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC ID to dependent modules", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const vpcId = 'vpc-tap-project-dev';

      // Security groups should use VPC ID
      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          vpcId: vpcId
        })
      );

      // ALB should use VPC ID
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          vpcId: vpcId
        })
      );
    });

    test("should pass subnet IDs to dependent modules", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // ALB should use public subnets
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          publicSubnetIds: expect.arrayContaining([
            'subnet-public-1-tap-project',
            'subnet-public-2-tap-project'
          ])
        })
      );

      // ASG should use private subnets
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          subnetIds: expect.arrayContaining([
            'subnet-private-1-tap-project',
            'subnet-private-2-tap-project'
          ])
        })
      );

      // RDS should use private subnets
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          subnetIds: expect.arrayContaining([
            'subnet-private-1-tap-project',
            'subnet-private-2-tap-project'
          ])
        })
      );
    });

    test("should pass security group IDs to dependent modules", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // ALB should use ALB security group
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          securityGroupId: 'sg-alb-tap-project-dev'
        })
      );

      // ASG should use EC2 security group
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          securityGroupIds: ['sg-ec2-tap-project-dev']
        })
      );

      // RDS should use RDS security group
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          securityGroupIds: ['sg-rds-tap-project-dev']
        })
      );
    });

    test("should pass IAM instance profile to ASG", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          instanceProfileArn: expect.stringMatching(/^arn:aws:iam::.*:instance-profile\//)
        })
      );
    });

    test("should pass target group ARN from ALB to ASG", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          targetGroupArns: [expect.stringMatching(/^arn:aws:elasticloadbalancing:.*:targetgroup\//)]
        })
      );
    });

    test("should pass ASG and RDS names to CloudWatch", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          asgName: 'tap-project-dev-asg',
          dbInstanceId: 'db-tap-project-dev'
        })
      );
    });

    test("should pass resource endpoints to SSM parameters", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SsmParameterModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          parameters: expect.objectContaining({
            'app/database-endpoint': 'tap-project-dev.cluster-123456789012.us-east-1.rds.amazonaws.com:5432',
            'app/alb-dns': 'tap-project-dev.elb.amazonaws.com'
          })
        })
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
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev'
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
        defaultTags: { tags: { Owner: 'TeamA' } },
        projectName: 'my-project',
        customAmiId: 'ami-12345',
        dbPassword: 'SecurePass123',
        alarmEmail: 'team@example.com',
        keyName: 'prod-key'
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

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          customAmiId: 'ami-12345',
          keyName: 'prod-key'
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          masterPassword: 'SecurePass123'
        })
      );

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          alarmEmail: 'team@example.com'
        })
      );
    });
  });

  describe("Resource Naming Conventions", () => {
    test("should follow consistent naming pattern for all resources", () => {
      const app = new App();
      new TapStack(app, "my-app-stack", {
        environmentSuffix: 'test',
        projectName: 'my-project'
      });

      // Check module naming patterns
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-project',
          environment: 'test'
        })
      );

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-project',
          environment: 'test'
        })
      );

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-project',
          environment: 'test'
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-project',
          environment: 'test'
        })
      );
    });

    test("should maintain naming consistency in tags", () => {
      const app = new App();
      new TapStack(app, "test-app", {
        environmentSuffix: 'staging',
        projectName: 'awesome-app'
      });

      const expectedTags = {
        Project: 'awesome-app',
        Environment: 'staging',
        ManagedBy: 'Terraform',
        CreatedBy: 'CDKTF'
      };

      // Verify tags are consistently applied to all modules
      const modules = [
        VpcModule,
        SecurityGroupsModule,
        IamModule,
        AlbModule,
        AsgModule,
        RdsModule,
        CloudWatchModule,
        SsmParameterModule
      ];

      modules.forEach(module => {
        expect(module).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            tags: expectedTags
          })
        );
      });
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
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(AlbModule).toHaveBeenCalledTimes(1);
      expect(AsgModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(CloudWatchModule).toHaveBeenCalledTimes(1);
      expect(SsmParameterModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalled();

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

      // Verify availability zones match the region
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          availabilityZones: ['eu-central-1a', 'eu-central-1b']
        })
      );
    });

    test("should create all outputs with correct descriptions", () => {
      const app = new App();
      new TapStack(app, "OutputTest", {
        environmentSuffix: 'qa'
      });

      // Verify critical outputs have descriptions
      const vpcIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      const albDnsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      const rdsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      const asgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'asg-name'
      );

      expect(vpcIdOutput[2].description).toBe('VPC ID');
      expect(albDnsOutput[2].description).toBe('ALB DNS name');
      expect(rdsOutput[2].description).toBe('RDS instance endpoint');
      expect(asgOutput[2].description).toBe('Auto Scaling Group name');
    });

    test("should properly configure multi-AZ resources", () => {
      const app = new App();
      new TapStack(app, "MultiAzTest", {
        awsRegion: 'us-west-2'
      });

      // VPC should span multiple AZs
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          availabilityZones: ['us-west-2a', 'us-west-2b']
        })
      );

      // RDS should be multi-AZ
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          multiAz: true
        })
      );
    });
  });
});