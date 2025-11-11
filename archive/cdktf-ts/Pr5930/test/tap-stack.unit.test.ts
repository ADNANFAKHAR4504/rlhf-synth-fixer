import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { describe, test, expect }from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    vpc: {
      id: 'vpc-tap-infrastructure',
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    publicSubnets: [
      { id: 'public-subnet-0', cidrBlock: '10.0.1.0/24', availabilityZone: `${props.region}a` },
      { id: 'public-subnet-1', cidrBlock: '10.0.2.0/24', availabilityZone: `${props.region}b` }
    ],
    privateSubnets: [
      { id: 'private-subnet-0', cidrBlock: '10.0.10.0/24', availabilityZone: `${props.region}a` },
      { id: 'private-subnet-1', cidrBlock: '10.0.20.0/24', availabilityZone: `${props.region}b` }
    ],
    internetGateway: { id: 'igw-tap', vpcId: 'vpc-tap-infrastructure' },
    natGateways: [
      { id: 'nat-0', allocationId: 'eip-nat-0', subnetId: 'public-subnet-0' },
      { id: 'nat-1', allocationId: 'eip-nat-1', subnetId: 'public-subnet-1' }
    ]
  })),

  SecurityGroupModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    securityGroup: {
      id: `sg-${props.name}`,
      name: props.name,
      vpcId: props.vpcId,
      arn: `arn:aws:ec2:us-east-1:123456789012:security-group/sg-${props.name}`
    }
  })),

  Ec2Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    instances: props.subnetIds.map((subnetId: string, index: number) => ({
      id: `i-${props.name}-${index}`,
      instanceType: props.instanceType,
      subnetId: subnetId,
      arn: `arn:aws:ec2:us-east-1:123456789012:instance/i-${props.name}-${index}`
    }))
  })),

  RdsModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    instance: {
      id: props.identifier,
      identifier: props.identifier,
      endpoint: `${props.identifier}.cluster-xyz.us-east-1.rds.amazonaws.com:3306`,
      address: `${props.identifier}.cluster-xyz.us-east-1.rds.amazonaws.com`,
      port: 3306,
      dbName: props.dbName
    },
    subnetGroup: {
      id: `${props.identifier}-subnet-group`,
      name: `${props.identifier}-subnet-group`
    }
  })),

  AlbModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    alb: {
      id: props.name,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${props.name}/50dc6c495c0c9188`,
      dnsName: `${props.name}-123456789.us-east-1.elb.amazonaws.com`,
      name: props.name,
      arnSuffix: `app/${props.name}/50dc6c495c0c9188`
    },
    targetGroup: {
      id: `${props.name}-tg`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${props.name}-tg/50dc6c495c0c9188`,
      name: `${props.name}-tg`
    },
    listener: {
      id: 'https-listener',
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${props.name}/50dc6c495c0c9188/f2f7dc8efc522ab2`,
      port: 443,
      protocol: 'HTTPS'
    }
  })),

  LambdaSecurityModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    function: {
      id: 'security-lambda-function',
      functionName: 'tap-security-checks',
      arn: 'arn:aws:lambda:us-east-1:123456789012:function:tap-security-checks'
    },
    logGroup: {
      id: 'security-lambda-log-group',
      name: '/aws/lambda/tap-security-checks'
    }
  })),

  SecurityServicesModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    securityHub: {
      id: 'security-hub',
      arn: 'arn:aws:securityhub:us-east-1:123456789012:hub/default'
    },
    config: {
      id: 'config-recorder',
      name: 'tap-config-recorder'
    },
    waf: {
      id: 'waf-web-acl',
      arn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/tap-web-acl/a1b2c3d4'
    },
    cloudTrail: {
      id: 'cloudtrail',
      name: 'tap-cloudtrail',
      arn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/tap-cloudtrail'
    },
    snsTopic: {
      id: 'security-alerts-topic',
      arn: 'arn:aws:sns:us-east-1:123456789012:tap-security-alerts',
      name: 'tap-security-alerts'
    }
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    dashboard: {
      id: 'cloudwatch-dashboard',
      dashboardName: 'tap-monitoring',
      dashboardArn: 'arn:aws:cloudwatch::123456789012:dashboard/tap-monitoring'
    },
    alarms: {
      cpu: { id: 'cpu-alarm', alarmName: 'tap-high-cpu', arn: 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:tap-high-cpu' },
      memory: { id: 'memory-alarm', alarmName: 'tap-high-memory', arn: 'arn:aws:cloudwatch:us-east-1:123456789012:alarm:tap-high-memory' }
    }
  }))
}));

// Mock TerraformOutput, S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({})),
    TerraformStack: actual.TerraformStack
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock AWS resources and data sources
jest.mock("@cdktf/provider-aws", () => ({
  dataAwsRegion: {
    DataAwsRegion: jest.fn().mockImplementation(() => ({
      id: 'us-east-1',
      name: 'us-east-1'
    }))
  },
  dataAwsCallerIdentity: {
    DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
      accountId: '123456789012',
      arn: 'arn:aws:iam::123456789012:root'
    }))
  },
  s3Bucket: {
    S3Bucket: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
      id: props.bucket,
      bucket: props.bucket,
      arn: `arn:aws:s3:::${props.bucket}`
    }))
  },
  secretsmanagerSecret: {
    SecretsmanagerSecret: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
      id: props.name,
      name: props.name,
      arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${props.name}-abcdef`
    }))
  },
  secretsmanagerSecretVersion: {
    SecretsmanagerSecretVersion: jest.fn().mockImplementation(() => ({ id: 'secret-version' }))
  },
  dynamodbTable: {
    DynamodbTable: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
      id: props.name,
      name: props.name,
      arn: `arn:aws:dynamodb:us-east-1:123456789012:table/${props.name}`
    }))
  },
  s3BucketServerSideEncryptionConfiguration: {
    S3BucketServerSideEncryptionConfigurationA: jest.fn().mockImplementation(() => ({ id: 'encryption-config' }))
  },
  s3BucketPublicAccessBlock: {
    S3BucketPublicAccessBlock: jest.fn().mockImplementation(() => ({ id: 'public-access-block' }))
  },
  ebsEncryptionByDefault: {
    EbsEncryptionByDefault: jest.fn().mockImplementation(() => ({ id: 'ebs-encryption', enabled: true }))
  },
  iamAccountPasswordPolicy: {
    IamAccountPasswordPolicy: jest.fn().mockImplementation(() => ({ id: 'password-policy' }))
  },
  snsTopicSubscription: {
    SnsTopicSubscription: jest.fn().mockImplementation(() => ({ id: 'sns-subscription' }))
  },
  cloudwatchLogMetricFilter: {
    CloudwatchLogMetricFilter: jest.fn().mockImplementation(() => ({ id: 'log-metric-filter' }))
  }
}));

// Override the prototype method
const mockAddOverride = jest.fn();
TapStack.prototype.addOverride = mockAddOverride;

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule,
    SecurityGroupModule,
    Ec2Module,
    RdsModule,
    AlbModule,
    LambdaSecurityModule,
    SecurityServicesModule,
    MonitoringModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const aws = require("@cdktf/provider-aws");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [{
            tags: {
              ManagedBy: 'CDKTF',
              Project: 'SecureInfrastructure',
              CostCenter: 'Engineering'
            }
          }]
        })
      );
    });

    test("should create TapStack with custom aws region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
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

    test("should create data sources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.dataAwsRegion.DataAwsRegion).toHaveBeenCalledTimes(1);
      expect(aws.dataAwsCallerIdentity.DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );
    });

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'my-custom-bucket',
        stateBucketRegion: 'ap-south-1',
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'ap-south-1',
          encrypt: true
        })
      );
    });
  });

  describe("VPC and Networking", () => {
    test("should create VpcModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          name: 'tap-vpc',
          cidr: '10.0.0.0/16',
          azCount: 2,
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
          region: 'us-east-1',
          tags: expect.objectContaining({
            Environment: 'production',
            Owner: 'platform-team',
            Project: 'tap-infrastructure',
            Compliance: 'required'
          })
        })
      );
    });

    test("should pass correct region to VPC", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-central-1'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );
    });
  });

  describe("Security Groups", () => {
    test("should create ALB security group with HTTPS ingress", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albSgCall = SecurityGroupModule.mock.calls.find(
        (call: any) => call[1] === 'alb-sg'
      );

      expect(albSgCall).toBeDefined();
      expect(albSgCall[2]).toEqual(expect.objectContaining({
        name: 'tap-alb-sg',
        ingressRules: [{
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        }]
      }));
    });

    test("should create EC2 security group with proper rules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2SgCall = SecurityGroupModule.mock.calls.find(
        (call: any) => call[1] === 'ec2-sg'
      );

      expect(ec2SgCall).toBeDefined();
      expect(ec2SgCall[2].ingressRules).toHaveLength(2);
      expect(ec2SgCall[2].ingressRules[0]).toEqual(expect.objectContaining({
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        securityGroups: expect.arrayContaining(['sg-tap-alb-sg'])
      }));
    });

    test("should create RDS security group allowing MySQL from EC2", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsSgCall = SecurityGroupModule.mock.calls.find(
        (call: any) => call[1] === 'rds-sg'
      );

      expect(rdsSgCall).toBeDefined();
      expect(rdsSgCall[2].ingressRules[0]).toEqual(expect.objectContaining({
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        securityGroups: expect.arrayContaining(['sg-tap-ec2-sg'])
      }));
    });

    test("should create Lambda security group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaSgCall = SecurityGroupModule.mock.calls.find(
        (call: any) => call[1] === 'lambda-sg'
      );

      expect(lambdaSgCall).toBeDefined();
      expect(lambdaSgCall[2]).toEqual(expect.objectContaining({
        name: 'tap-lambda-sg',
        ingressRules: []
      }));
    });
  });

  describe("EC2 Module", () => {
    test("should create EC2 instances in private subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'ec2',
        expect.objectContaining({
          name: 'tap-app-server',
          instanceType: 't3.medium',
          subnetIds: ['private-subnet-0', 'private-subnet-1'],
          securityGroupIds: ['sg-tap-ec2-sg'],
          userData: expect.stringContaining('nginx')
        })
      );
    });

    test("should configure EC2 with CloudWatch agent", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Call = Ec2Module.mock.calls[0];
      expect(ec2Call[2].userData).toContain('amazon-cloudwatch-agent');
    });
  });

  describe("RDS Module", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          identifier: 'tap-database',
          engine: 'mysql',
          instanceClass: 'db.t3.medium',
          allocatedStorage: 100,
          dbName: 'tapdb',
          masterUsername: 'admin',
          subnetIds: ['private-subnet-0', 'private-subnet-1'],
          securityGroupIds: ['sg-tap-rds-sg']
        })
      );
    });
  });

  describe("ALB Module", () => {
    test("should create ALB in public subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          name: 'tap-alb',
          vpcId: 'vpc-tap-infrastructure',
          subnetIds: ['public-subnet-0', 'public-subnet-1'],
          securityGroupIds: ['sg-tap-alb-sg'],
          targetGroupPort: 80,
          targetGroupProtocol: 'HTTP',
          targetInstances: ec2Module.instances.map((i: any) => i.id)
        })
      );
    });
  });

  describe("Lambda Security Module", () => {
    test("should create Lambda security module with VPC configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(LambdaSecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-lambda',
        expect.objectContaining({
          subnetIds: ['private-subnet-0', 'private-subnet-1'],
          securityGroupIds: ['sg-tap-lambda-sg']
        }),
        'tap-lambda-code-123456789012',
        'security-lambda.zip',
        expect.objectContaining({
          Environment: 'production',
          Owner: 'platform-team',
          Project: 'tap-infrastructure',
          Compliance: 'required'
        })
      );
    });

    test("should create S3 bucket for Lambda code", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.s3Bucket.S3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'lambda-code-bucket',
        expect.objectContaining({
          bucket: 'tap-lambda-code-123456789012'
        })
      );
    });
  });

  describe("Security Services", () => {
    test("should create security services with ALB ARN", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albModule = AlbModule.mock.results[0].value;

      expect(SecurityServicesModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-services',
        albModule.alb.arn,
        expect.objectContaining({
          Environment: 'production'
        })
      );
    });

    test("should create CloudTrail log metric filter", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilter).toHaveBeenCalledWith(
        expect.anything(),
        'unauthorized-api-calls',
        expect.objectContaining({
          name: 'UnauthorizedAPICalls',
          pattern: '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }',
          logGroupName: '/aws/cloudtrail/security-logs-production'
        })
      );
    });
  });

  describe("Secrets Management", () => {
    test("should create Secrets Manager secret for API keys", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.secretsmanagerSecret.SecretsmanagerSecret).toHaveBeenCalledWith(
        expect.anything(),
        'api-keys',
        expect.objectContaining({
          name: 'tap-api-keys-new-ts',
          description: 'API keys for external services',
          kmsKeyId: 'alias/aws/secretsmanager'
        })
      );

      expect(aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion).toHaveBeenCalled();
    });
  });

  describe("DynamoDB Table", () => {
    test("should create DynamoDB table with encryption and backup", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.dynamodbTable.DynamodbTable).toHaveBeenCalledWith(
        expect.anything(),
        'app-table',
        expect.objectContaining({
          name: 'tap-application-data',
          billingMode: 'PAY_PER_REQUEST',
          hashKey: 'id',
          rangeKey: 'timestamp',
          serverSideEncryption: { enabled: true },
          pointInTimeRecovery: { enabled: true }
        })
      );
    });
  });

  describe("S3 Buckets", () => {
    test("should create log bucket with encryption", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.s3Bucket.S3Bucket).toHaveBeenCalledWith(
        expect.anything(),
        'log-bucket',
        expect.objectContaining({
          bucket: 'tap-logs-123456789012'
        })
      );

      expect(aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA).toHaveBeenCalled();
      expect(aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock).toHaveBeenCalled();
    });
  });

  describe("Security Configurations", () => {
    test("should enable EBS default encryption", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.ebsEncryptionByDefault.EbsEncryptionByDefault).toHaveBeenCalledWith(
        expect.anything(),
        'ebs-encryption',
        expect.objectContaining({
          enabled: true
        })
      );
    });

    test("should configure IAM password policy", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.iamAccountPasswordPolicy.IamAccountPasswordPolicy).toHaveBeenCalledWith(
        expect.anything(),
        'password-policy',
        expect.objectContaining({
          minimumPasswordLength: 14,
          requireLowercaseCharacters: true,
          requireNumbers: true,
          requireUppercaseCharacters: true,
          requireSymbols: true,
          passwordReusePrevention: 24,
          maxPasswordAge: 90
        })
      );
    });

    test("should create SNS subscription for security alerts", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(aws.snsTopicSubscription.SnsTopicSubscription).toHaveBeenCalledWith(
        expect.anything(),
        'security-alert-email',
        expect.objectContaining({
          protocol: 'email',
          endpoint: 'security-team@example.com'
        })
      );
    });
  });

  describe("Monitoring", () => {
    test("should create monitoring module with all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albModule = AlbModule.mock.results[0].value;
      const ec2Module = Ec2Module.mock.results[0].value;
      const rdsModule = RdsModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          albName: albModule.alb.name,
          instanceIds: ec2Module.instances.map((i: any) => i.id),
          rdsIdentifier: rdsModule.instance.identifier
        }),
        expect.objectContaining({
          Environment: 'production'
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('alb-dns');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('lambda-s3-bucket');
      expect(outputIds).toContain('ec2-instance-ids');
      expect(outputIds).toContain('security-hub-arn');
      expect(outputIds).toContain('cloudtrail-arn');
      expect(outputIds).toContain('lambda-function-arn');
      expect(outputIds).toContain('sns-topic-arn');
      expect(outputIds).toContain('dashboard-url');
    });

    test("should create dashboard URL with correct region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      const dashboardOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'dashboard-url'
      );

      expect(dashboardOutput[2].value).toContain('https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=tap-monitoring');
      expect(dashboardOutput[2].value).toContain('tap-monitoring');
    });

    test("should output EC2 instance IDs as comma-separated string", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Output = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'ec2-instance-ids'
      );

      expect(ec2Output[2].value).toBe('i-tap-app-server-0,i-tap-app-server-1');
    });
  });

  describe("Module Creation Order", () => {
    test("should create modules in correct dependency order", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // VPC should be created before security groups
      const vpcCallIndex = VpcModule.mock.invocationCallOrder[0];
      const sgCallIndex = SecurityGroupModule.mock.invocationCallOrder[0];
      expect(vpcCallIndex).toBeLessThan(sgCallIndex);

      // Security groups should be created before EC2, RDS, and ALB
      const ec2CallIndex = Ec2Module.mock.invocationCallOrder[0];
      const rdsCallIndex = RdsModule.mock.invocationCallOrder[0];
      const albCallIndex = AlbModule.mock.invocationCallOrder[0];
      
      expect(sgCallIndex).toBeLessThan(ec2CallIndex);
      expect(sgCallIndex).toBeLessThan(rdsCallIndex);
      expect(sgCallIndex).toBeLessThan(albCallIndex);

      // ALB should be created after EC2 (for target instances)
      expect(ec2CallIndex).toBeLessThan(albCallIndex);

      // Security services should be created after ALB (needs ALB ARN)
      const securityCallIndex = SecurityServicesModule.mock.invocationCallOrder[0];
      expect(albCallIndex).toBeLessThan(securityCallIndex);

      // Monitoring should be created after other resources
      const monitoringCallIndex = MonitoringModule.mock.invocationCallOrder[0];
      expect(albCallIndex).toBeLessThan(monitoringCallIndex);
      expect(ec2CallIndex).toBeLessThan(monitoringCallIndex);
      expect(rdsCallIndex).toBeLessThan(monitoringCallIndex);
    });
  });

  describe("Edge Cases", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      
      // Should use default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

      // Should use 'dev' as default when empty
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });
  });

  describe("Resource Tags", () => {
    test("should apply common tags to all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        Environment: 'production',
        Owner: 'platform-team',
        Project: 'tap-infrastructure',
        Compliance: 'required'
      };

      // Check VPC tags
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      // Check EC2 tags
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      // Check RDS tags
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );
    });
  });
});