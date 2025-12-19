// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  SecureVpc: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.name}`,
      cidrBlock: config.cidr,
    },
    publicSubnets: [
      { id: `subnet-public-1-${config.name}` },
      { id: `subnet-public-2-${config.name}` }
    ],
    privateSubnets: [
      { id: `subnet-private-1-${config.name}` },
      { id: `subnet-private-2-${config.name}` }
    ],
    dbSubnetGroup: {
      name: `db-subnet-group-${config.name}`,
    }
  })),

  KmsKeyConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    keyArn: `arn:aws:kms:us-east-1:123456789012:key/${config.name}`,
    keyId: `key-${config.name}`,
    key: {
      arn: `arn:aws:kms:us-east-1:123456789012:key/${config.name}`,
      keyId: `key-${config.name}`,
    }
  })),

  EncryptedS3Bucket: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: {
      bucket: config.name,
      arn: `arn:aws:s3:::${config.name}`,
      id: config.name,
    },
    bucketArn: `arn:aws:s3:::${config.name}`,
  })),

  SecureRdsInstance: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    instance: {
      endpoint: `${config.name}.cluster-123456789012.us-east-1.rds.amazonaws.com:3306`,
      id: `rds-${config.name}`,
      arn: `arn:aws:rds:us-east-1:123456789012:db:${config.name}`,
    }
  })),

  CloudWatchLogGroup: jest.fn().mockImplementation((scope: any, id: string, name: string) => ({
    name: name,
    arn: `arn:aws:logs:us-east-1:123456789012:log-group:${name}`,
  })),

  CloudWatchAlarm: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    name: config.name,
    arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${config.name}`,
  })),

  NotificationTopic: jest.fn().mockImplementation((scope: any, id: string, name: string) => ({
    topic: {
      arn: `arn:aws:sns:us-east-1:123456789012:${name}`,
      name: name,
    }
  })),

  CostBudget: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    name: config.name,
    budget: {
      name: config.name,
    }
  })),

  IamRoleConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    role: {
      arn: `arn:aws:iam::123456789012:role/${config.name}`,
      name: config.name,
    },
    instanceProfile: config.createInstanceProfile ? {
      name: `instance-profile-${config.name}`,
      arn: `arn:aws:iam::123456789012:instance-profile/${config.name}`,
    } : undefined
  })),

  MfaEnforcementPolicy: jest.fn().mockImplementation((scope: any, id: string) => ({
    policyId: `mfa-policy-${id}`,
  })),

  CommonTags: jest.fn(),
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

jest.mock("@cdktf/provider-aws/lib/data-aws-ami", () => ({
  DataAwsAmi: jest.fn().mockImplementation(() => ({
    id: "ami-0c55b159cbfafe1f0",
    imageId: "ami-0c55b159cbfafe1f0",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/instance", () => ({
  Instance: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `i-${id}`,
    publicIp: config.associatePublicIpAddress ? `54.123.45.${Math.floor(Math.random() * 255)}` : undefined,
    privateIp: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  })),
}));

jest.mock("@cdktf/provider-aws/lib/security-group", () => ({
  SecurityGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `sg-${id}`,
    name: config.name,
  })),
}));

jest.mock("@cdktf/provider-aws/lib/security-group-rule", () => ({
  SecurityGroupRule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `sgr-${id}`,
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
    SecureVpc,
    KmsKeyConstruct,
    EncryptedS3Bucket,
    SecureRdsInstance,
    CloudWatchLogGroup,
    CloudWatchAlarm,
    NotificationTopic,
    CostBudget,
    IamRoleConstruct,
    MfaEnforcementPolicy,
  } = require("../lib/modules");
  
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { DataAwsAmi } = require("@cdktf/provider-aws/lib/data-aws-ami");
  const { Instance } = require("@cdktf/provider-aws/lib/instance");
  const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");
  const { SecurityGroupRule } = require("@cdktf/provider-aws/lib/security-group-rule");

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

  describe("KMS Key Configuration", () => {
    test("should create KMS key with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(KmsKeyConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-kms',
        expect.objectContaining({
          name: 'test-stack-dev-main',
          description: 'Main KMS key for test-stack dev environment',
          enableKeyRotation: true,
          accountId: '123456789012',
          tags: expect.objectContaining({
            Project: 'test-stack',
            Environment: 'dev',
            Owner: 'infrastructure-team',
            CostCenter: 'engineering'
          })
        })
      );
    });

    test("should create KMS key with environment-specific naming", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(KmsKeyConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'main-kms',
        expect.objectContaining({
          name: 'test-stack-staging-main',
          description: 'Main KMS key for test-stack staging environment'
        })
      );
    });
  });

  describe("VPC Configuration", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecureVpc).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          name: 'test-stack-dev-vpc',
          cidr: '10.0.0.0/16',
          azCount: 2,
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
          enableNat: true
        })
      );
    });

    test("should create VPC with environment-specific naming", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(SecureVpc).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          name: 'test-stack-prod-vpc'
        })
      );
    });
  });

  describe("Security Groups Configuration", () => {
    test("should create all required security groups", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // Public security group
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'public-sg',
        expect.objectContaining({
          name: 'test-stack-dev-public-sg',
          description: 'Security group for public instances'
        })
      );

      // Private security group
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'private-sg',
        expect.objectContaining({
          name: 'test-stack-dev-private-sg',
          description: 'Security group for private instances'
        })
      );

      // RDS security group
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'rds-sg',
        expect.objectContaining({
          name: 'test-stack-dev-rds-sg',
          description: 'Security group for RDS instances'
        })
      );
    });

    test("should create security group rules with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // HTTP rule
      expect(SecurityGroupRule).toHaveBeenCalledWith(
        expect.anything(),
        'public-sg-http',
        expect.objectContaining({
          type: 'ingress',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        })
      );

      // HTTPS rule
      expect(SecurityGroupRule).toHaveBeenCalledWith(
        expect.anything(),
        'public-sg-https',
        expect.objectContaining({
          type: 'ingress',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        })
      );

      // SSH rule
      expect(SecurityGroupRule).toHaveBeenCalledWith(
        expect.anything(),
        'public-sg-ssh',
        expect.objectContaining({
          type: 'ingress',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16']
        })
      );

      // RDS ingress rule
      expect(SecurityGroupRule).toHaveBeenCalledWith(
        expect.anything(),
        'rds-sg-ingress',
        expect.objectContaining({
          type: 'ingress',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp'
        })
      );
    });
  });

  describe("EC2 Instances Configuration", () => {
    test("should create public EC2 instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(Instance).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2',
        expect.objectContaining({
          instanceType: 't3.micro',
          associatePublicIpAddress: true,
          rootBlockDevice: {
            encrypted: true,
            volumeType: 'gp3',
            volumeSize: 20
          },
          tags: expect.objectContaining({
            Name: 'test-stack-dev-public-ec2'
          })
        })
      );
    });

    test("should create private EC2 instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(Instance).toHaveBeenCalledWith(
        expect.anything(),
        'private-ec2',
        expect.objectContaining({
          instanceType: 't3.micro',
          rootBlockDevice: {
            encrypted: true,
            volumeType: 'gp3',
            volumeSize: 20
          },
          tags: expect.objectContaining({
            Name: 'test-stack-dev-private-ec2'
          })
        })
      );
    });

    test("should use latest Amazon Linux 2 AMI", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(DataAwsAmi).toHaveBeenCalledWith(
        expect.anything(),
        'amazon-linux-2',
        expect.objectContaining({
          mostRecent: true,
          owners: ['amazon'],
          filter: [
            {
              name: 'name',
              values: ['amzn2-ami-hvm-*-x86_64-gp2']
            }
          ]
        })
      );
    });
  });

  describe("IAM Role Configuration", () => {
    test("should create EC2 IAM role with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IamRoleConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-role',
        expect.objectContaining({
          name: 'test-stack-dev-ec2-role',
          createInstanceProfile: true,
          assumeRolePolicy: expect.objectContaining({
            Version: '2012-10-17',
            Statement: expect.arrayContaining([
              expect.objectContaining({
                Effect: 'Allow',
                Principal: { Service: 'ec2.amazonaws.com' },
                Action: 'sts:AssumeRole'
              })
            ])
          }),
          inlinePolicies: expect.objectContaining({
            's3-access': expect.objectContaining({
              Statement: expect.arrayContaining([
                expect.objectContaining({
                  Effect: 'Allow',
                  Action: expect.arrayContaining([
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket'
                  ])
                })
              ])
            })
          })
        })
      );
    });
  });

  describe("S3 Buckets Configuration", () => {
    test("should create public S3 bucket with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EncryptedS3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'public-s3',
        expect.objectContaining({
          name: 'test-stack-dev-public-assets',
          versioning: true,
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: 'expire-old-versions',
              status: 'Enabled'
            })
          ])
        })
      );
    });

    test("should create private S3 bucket with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(EncryptedS3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'private-s3',
        expect.objectContaining({
          name: 'test-stack-dev-private-data',
          versioning: true,
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
              transition: expect.arrayContaining([
                expect.objectContaining({
                  days: 30,
                  storageClass: 'STANDARD_IA'
                }),
                expect.objectContaining({
                  days: 90,
                  storageClass: 'GLACIER'
                })
              ])
            })
          ])
        })
      );
    });
  });

  describe("RDS Configuration", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecureRdsInstance).toHaveBeenCalledWith(
        expect.anything(),
        'main-rds',
        expect.objectContaining({
          name: 'db-test-stack-dev',
          engine: 'mysql',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          username: 'admin',
          backupRetentionPeriod: 7,
          deletionProtection: false,
          enabledCloudwatchLogsExports: ['error', 'general', 'slowquery']
        })
      );
    });

    test("should enable deletion protection for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(SecureRdsInstance).toHaveBeenCalledWith(
        expect.anything(),
        'main-rds',
        expect.objectContaining({
          deletionProtection: true
        })
      );
    });
  });

  describe("CloudWatch Configuration", () => {
    test("should create CloudWatch log group", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(CloudWatchLogGroup).toHaveBeenCalledWith(
        expect.anything(),
        'app-logs',
        '/aws/application/test-stack-dev',
        30,
        expect.objectContaining({
          Project: 'test-stack',
          Environment: 'dev'
        })
      );
    });

    test("should create CloudWatch alarm for high CPU", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(CloudWatchAlarm).toHaveBeenCalledWith(
        expect.anything(),
        'high-cpu-alarm',
        expect.objectContaining({
          name: 'test-stack-dev-high-cpu',
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          statistic: 'Average',
          period: 300,
          evaluationPeriods: 2,
          threshold: 80,
          comparisonOperator: 'GreaterThanThreshold'
        })
      );
    });
  });

  describe("Notification and Monitoring", () => {
    test("should create SNS notification topic", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(NotificationTopic).toHaveBeenCalledWith(
        expect.anything(),
        'notification-topic',
        'test-stack-dev-alerts',
        expect.objectContaining({
          Project: 'test-stack',
          Environment: 'dev'
        })
      );
    });

    test("should create cost budget with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(CostBudget).toHaveBeenCalledWith(
        expect.anything(),
        'cost-budget',
        expect.objectContaining({
          name: 'test-stack-dev-monthly-budget',
          limitAmount: '100',
          limitUnit: 'USD',
          timeUnit: 'MONTHLY',
          thresholds: [80, 100]
        })
      );
    });

    test("should create MFA enforcement policy", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(MfaEnforcementPolicy).toHaveBeenCalledWith(
        expect.anything(),
        'mfa-policy',
        expect.objectContaining({
          Project: 'test-stack',
          Environment: 'dev'
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
      expect(outputIds).toContain('public-ec2-instance-id');
      expect(outputIds).toContain('public-ec2-public-ip');
      expect(outputIds).toContain('private-ec2-instance-id');
      expect(outputIds).toContain('private-ec2-private-ip');
      expect(outputIds).toContain('public-s3-bucket-name');
      expect(outputIds).toContain('private-s3-bucket-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('kms-key-id');
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('sns-topic-arn');
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

    test("should output EC2 instance information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const publicEc2Output = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-ec2-instance-id'
      );
      const publicIpOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-ec2-public-ip'
      );

      expect(publicEc2Output).toBeDefined();
      expect(publicEc2Output[2]).toHaveProperty('description', 'Public EC2 instance ID');
      
      expect(publicIpOutput).toBeDefined();
      expect(publicIpOutput[2]).toHaveProperty('description', 'Public EC2 instance public IP address');
    });

    test("should output S3 bucket names", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const publicBucketOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-s3-bucket-name'
      );
      const privateBucketOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-s3-bucket-name'
      );

      expect(publicBucketOutput[2]).toHaveProperty('description', 'Public S3 bucket name for app assets');
      expect(privateBucketOutput[2]).toHaveProperty('description', 'Private S3 bucket name for internal data');
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'dev'
      });

      expect(SecureVpc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'test-stack-dev-vpc'
        })
      );

      expect(NotificationTopic).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'test-stack-dev-alerts',
        expect.anything()
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(KmsKeyConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'test-stack-staging-main'
        })
      );

      expect(CostBudget).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'test-stack-staging-monthly-budget'
        })
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(SecureRdsInstance).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          deletionProtection: true,
          name: 'db-test-stack-prod'
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
    test("should pass KMS key ARN to dependent resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const kmsKeyArn = `arn:aws:kms:us-east-1:123456789012:key/test-stack-dev-main`;

      // S3 buckets should use KMS key
      expect(EncryptedS3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'public-s3',
        expect.objectContaining({
          kmsKeyArn: kmsKeyArn
        })
      );

      expect(EncryptedS3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'private-s3',
        expect.objectContaining({
          kmsKeyArn: kmsKeyArn
        })
      );

      // RDS should use KMS key
      expect(SecureRdsInstance).toHaveBeenCalledWith(
        expect.anything(),
        'main-rds',
        expect.objectContaining({
          kmsKeyId: kmsKeyArn
        })
      );
    });

    test("should pass VPC configuration to dependent resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // Security groups should be created with VPC ID
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          vpcId: expect.stringMatching(/^vpc-/)
        })
      );

      // EC2 instances should use VPC subnets
      expect(Instance).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2',
        expect.objectContaining({
          subnetId: expect.stringMatching(/^subnet-public-/)
        })
      );

      expect(Instance).toHaveBeenCalledWith(
        expect.anything(),
        'private-ec2',
        expect.objectContaining({
          subnetId: expect.stringMatching(/^subnet-private-/)
        })
      );
    });

    test("should pass IAM instance profile to EC2 instances", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // Both EC2 instances should use the instance profile
      expect(Instance).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2',
        expect.objectContaining({
          iamInstanceProfile: expect.stringMatching(/^instance-profile-/)
        })
      );

      expect(Instance).toHaveBeenCalledWith(
        expect.anything(),
        'private-ec2',
        expect.objectContaining({
          iamInstanceProfile: expect.stringMatching(/^instance-profile-/)
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
      expect(SecureVpc).toHaveBeenCalledWith(
        expect.anything(),
        'main-vpc',
        expect.objectContaining({
          name: 'test-stack-dev-vpc'
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

  describe("Resource Naming Conventions", () => {
    test("should follow consistent naming pattern for all resources", () => {
      const app = new App();
      new TapStack(app, "my-project", {
        environmentSuffix: 'test'
      });

      // Check VPC naming
      expect(SecureVpc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'my-project-test-vpc'
        })
      );

      // Check S3 bucket naming (should be lowercase)
      expect(EncryptedS3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'public-s3',
        expect.objectContaining({
          name: 'my-project-test-public-assets'
        })
      );

      // Check RDS naming
      expect(SecureRdsInstance).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          name: 'db-my-project-test'
        })
      );

      // Check Security Group naming
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'public-sg',
        expect.objectContaining({
          name: 'my-project-test-public-sg'
        })
      );
    });

    test("should maintain naming consistency in tags", () => {
      const app = new App();
      new TapStack(app, "test-app", {
        environmentSuffix: 'staging'
      });

      const expectedTags = {
        Project: 'test-app',
        Environment: 'staging',
        Owner: 'infrastructure-team',
        CostCenter: 'engineering'
      };

      // Verify tags are consistently applied
      expect(KmsKeyConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(SecureVpc).toHaveBeenCalledWith(
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
      expect(DataAwsAmi).toHaveBeenCalledTimes(1);
      expect(KmsKeyConstruct).toHaveBeenCalledTimes(1);
      expect(SecureVpc).toHaveBeenCalledTimes(1);
      expect(NotificationTopic).toHaveBeenCalledTimes(1);
      expect(SecurityGroup).toHaveBeenCalledTimes(3); // public, private, rds
      expect(IamRoleConstruct).toHaveBeenCalledTimes(1);
      expect(Instance).toHaveBeenCalledTimes(2); // public and private
      expect(EncryptedS3Bucket).toHaveBeenCalledTimes(2); // public and private
      expect(SecureRdsInstance).toHaveBeenCalledTimes(1);
      expect(CloudWatchLogGroup).toHaveBeenCalledTimes(1);
      expect(CloudWatchAlarm).toHaveBeenCalledTimes(1);
      expect(CostBudget).toHaveBeenCalledTimes(1);
      expect(MfaEnforcementPolicy).toHaveBeenCalledTimes(1);
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
    });

    test("should use AWS region override when provided", () => {
  const app = new App();
  new TapStack(app, "test-stack", {
    awsRegion: 'eu-west-1',
    awsRegionOverride: 'ap-southeast-1' // This takes precedence
  });

  expect(AwsProvider).toHaveBeenCalledWith(
    expect.anything(),
    'aws',
    expect.objectContaining({
      region: 'ap-southeast-1' // Override value
    })
  );
});

test("should use props.awsRegion when no override is set", () => {
  const app = new App();
  new TapStack(app, "test-stack", {
    awsRegion: 'eu-west-1',
    awsRegionOverride: '' // Empty override
  });

  expect(AwsProvider).toHaveBeenCalledWith(
    expect.anything(),
    'aws',
    expect.objectContaining({
      region: 'eu-west-1'
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
      const rdsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      const snsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'sns-topic-arn'
      );

      expect(vpcIdOutput[2].description).toBe('VPC ID');
      expect(rdsOutput[2].description).toBe('RDS instance endpoint');
      expect(snsOutput[2].description).toBe('SNS topic ARN for notifications');
    });
  });
});