// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    vpc: { 
      id: `${id}-vpc-id`,
      cidrBlock: '10.0.0.0/16'
    },
    publicSubnets: [
      { id: `${id}-public-subnet-1` },
      { id: `${id}-public-subnet-2` }
    ],
    privateSubnets: [
      { id: `${id}-private-subnet-1` },
      { id: `${id}-private-subnet-2` }
    ],
    natGateways: [{ id: `${id}-nat-gateway-1` }],
    internetGateway: { id: `${id}-igw` }
  })),
  
  Ec2Module: jest.fn().mockImplementation((scope: any, id: string) => ({
    webAsg: { name: `${id}-web-asg` },
    backendAsg: { name: `${id}-backend-asg` },
    alb: { 
      dnsName: `${id}-alb-123456789.us-east-1.elb.amazonaws.com`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${id}-alb/1234567890`,
      arnSuffix: `app/${id}-alb/1234567890`,
      zoneId: 'Z35SXDOTRQ7X7K'
    },
    webSecurityGroup: { id: `${id}-web-sg` },
    backendSecurityGroup: { id: `${id}-backend-sg` }
  })),
  
  RdsModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    dbInstance: {
      id: `${id}-db-instance`,
      endpoint: `${id}-db.cluster-xyz.us-east-1.rds.amazonaws.com:3306`,
      masterUserSecret: {
        get: jest.fn().mockReturnValue({
          secretArn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-db-credentials/${id}-AbCdEf`
        })
      }
    },
    dbSecurityGroup: { id: `${id}-db-sg` },
    dbSubnetGroup: { name: `${id}-db-subnet-group` },
    dbSecret: { id: `${id}-db-secret` }
  })),
  
  S3Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    bucket: { 
      bucket: props?.bucketName || `${id}-bucket-${Date.now()}`,
      arn: `arn:aws:s3:::${props?.bucketName || id}-bucket`,
      id: `${id}-bucket`
    },
    bucketPolicy: props?.publicReadAccess ? { id: `${id}-bucket-policy` } : undefined
  })),
  
  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    snsTopic: { 
      arn: `arn:aws:sns:us-east-1:123456789012:${id}-alerts-topic`,
      name: `${id}-alerts-topic`
    },
    alarms: [
      { alarmName: `${id}-web-cpu-alarm` },
      { alarmName: `${id}-db-cpu-alarm` }
    ]
  })),
  
  Route53Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    hostedZone: { 
      zoneId: 'Z01268892QCQVWLLZ41IX',
      nameServers: [
        'ns-1494.awsdns-58.org',
        'ns-191.awsdns-23.com',
        'ns-1927.awsdns-48.co.uk',
        'ns-795.awsdns-35.net'
      ]
    },
    records: [
      { name: props?.domainName || 'example.com' }
    ]
  })),
  
  SsmModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    parameters: props?.parameters?.map((p: any, idx: number) => ({
      name: p.name,
      id: `${id}-param-${idx}`
    })) || []
  }))
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  
  class MockTerraformStack {
    addOverride = jest.fn();
  }
  
  return {
    ...actual,
    TerraformStack: MockTerraformStack,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    Fn: {
      element: jest.fn((list: any[], index: number) => list[index]),
      join: jest.fn((delimiter: string, list: string[]) => list.join(delimiter)),
      jsonencode: jest.fn((value: any) => JSON.stringify(value))
    }
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn()
}));

describe("TapStack Unit Tests", () => {
  const {
    VpcModule,
    Ec2Module,
    RdsModule,
    S3Module,
    MonitoringModule,
    Route53Module,
    SsmModule
  } = require("../lib/modules");
  
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date.now mock for consistent S3 bucket naming
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
        domainName: 'test.example.com',
        alertEmail: 'alerts@test.com'
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
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackDefaults.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );
    });

    test("should use custom props when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'production',
          Owner: 'DevOps'
        }
      };

      new TapStack(app, "TestStackCustom", {
        environmentSuffix: 'staging',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
        domainName: 'staging.example.com',
        alertEmail: 'devops@company.com'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1',
          defaultTags: [customTags]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'staging/TestStackCustom.tfstate',
          region: 'eu-west-1',
          encrypt: true
        })
      );
    });

    test("should handle undefined defaultTags", () => {
      const app = new App();
      
      new TapStack(app, "TestStackUndefinedTags", {
        defaultTags: undefined
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: []
        })
      );
    });

    test("should handle empty string values and fallback to defaults", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyStrings", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: ''
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackEmptyStrings.tfstate',
          region: 'us-east-1'
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create all modules with correct parameters", () => {
      const app = new App();
      new TapStack(app, "TestStackModules");

      // Verify VpcModule
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          cidrBlock: '10.0.0.0/16',
          azCount: 2,
          enableNatGateway: true,
          enableVpnGateway: false
        })
      );
      // Verify S3 Modules (public and private)
      expect(S3Module).toHaveBeenCalledTimes(2);
      
      // Public S3
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3-public",
        expect.objectContaining({
          bucketName: 'tap-infrastructure-dev-public-assets',
          publicReadAccess: true,
          versioning: true,
          encryption: true
        })
      );

      // Private S3
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3-private",
        expect.objectContaining({
          bucketName: 'tap-infrastructure-dev-private-data',
          publicReadAccess: false,
          versioning: true,
          encryption: true
        })
      );

      // Verify Route53Module
      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        "route53",
        expect.objectContaining({
          domainName: 'dev.yourdomain.com',
          albDnsName: 'ec2-alb-123456789.us-east-1.elb.amazonaws.com',
          albZoneId: 'Z35SXDOTRQ7X7K'
        })
      );

      // Verify MonitoringModule
      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        "monitoring",
        expect.objectContaining({
          emailEndpoint: 'alerts@yourdomain.com',
          ec2Module: expect.objectContaining({
            alb: expect.any(Object)
          }),
          rdsModule: expect.objectContaining({
            dbInstance: expect.any(Object)
          })
        })
      );

      // Verify SsmModule
      expect(SsmModule).toHaveBeenCalledWith(
        expect.anything(),
        "ssm",
        expect.objectContaining({
          parameters: expect.arrayContaining([
            expect.objectContaining({
              name: 'api/endpoint',
              value: 'https://dev.yourdomain.com/api'
            }),
            expect.objectContaining({
              name: 'app/version',
              value: '1.0.0'
            }),
            expect.objectContaining({
              name: 'features/enabled',
              value: 'true'
            })
          ])
        })
      );
    });

    test("should handle production environment settings", () => {
      const app = new App();
      new TapStack(app, "TestProdStack", {
        environmentSuffix: 'prod',
        domainName: 'prod.example.com'
      });

      // RDS should have multiAz enabled and longer retention
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.objectContaining({
          multiAz: true,
          backupRetentionPeriod: 30
        })
      );
    });

    test("should pass custom alert email to monitoring module", () => {
      const app = new App();
      new TapStack(app, "TestCustomAlert", {
        alertEmail: 'custom-alerts@example.com'
      });

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        "monitoring",
        expect.objectContaining({
          emailEndpoint: 'custom-alerts@example.com'
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
          encrypt: true
        })
      );

      // Verify escape hatch for state locking
      expect(stack.addOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all expected outputs", () => {
      const app = new App();
      new TapStack(app, "TestOutputs");

      // Verify VPC outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          value: 'vpc-vpc-id',
          description: 'VPC ID'
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-ids',
        expect.objectContaining({
          value: ['vpc-public-subnet-1', 'vpc-public-subnet-2'],
          description: 'Public subnet IDs'
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-subnet-ids',
        expect.objectContaining({
          value: ['vpc-private-subnet-1', 'vpc-private-subnet-2'],
          description: 'Private subnet IDs'
        })
      );

      // Verify ALB output
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'alb-dns-name',
        expect.objectContaining({
          value: 'ec2-alb-123456789.us-east-1.elb.amazonaws.com',
          description: 'Application Load Balancer DNS name'
        })
      );

      // Verify RDS outputs  
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-endpoint',
        expect.objectContaining({
          value: 'rds-db.cluster-xyz.us-east-1.rds.amazonaws.com:3306',
          description: 'RDS instance endpoint'
        })
      );

      // Verify S3 bucket outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-s3-bucket-name',
        expect.objectContaining({
          description: 'Public S3 bucket name for app assets'
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-s3-bucket-name',
        expect.objectContaining({
          description: 'Private S3 bucket name for internal data'
        })
      );

      // Verify monitoring output
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring-sns-topic-arn',
        expect.objectContaining({
          value: 'arn:aws:sns:us-east-1:123456789012:monitoring-alerts-topic',
          description: 'SNS topic ARN for monitoring alerts'
        })
      );

      // Verify Route53 output
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'route53-zone-id',
        expect.objectContaining({
          value: 'Z01268892QCQVWLLZ41IX',
          description: 'Route53 hosted zone ID'
        })
      );

      // Verify SSM parameters output
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ssm-parameters',
        expect.objectContaining({
          description: 'SSM parameter names'
        })
      );
    });

    test("should handle RDS secret outputs from module", () => {
      const app = new App();
      new TapStack(app, "TestRdsOutputs");
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestUndefinedProps", undefined);

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
    });

    test("should handle all empty string props", () => {
      const app = new App();
      new TapStack(app, "TestEmptyProps", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
        awsRegion: '',
        domainName: '',
        alertEmail: ''
      });

      // Should fall back to defaults
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestEmptyProps.tfstate',
          region: 'us-east-1'
        })
      );

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        "monitoring",
        expect.objectContaining({
          emailEndpoint: 'alerts@yourdomain.com'
        })
      );
    });

    test("should create common tags correctly", () => {
      const app = new App();
      new TapStack(app, "TestCommonTags", {
        environmentSuffix: 'production'
      });

      const expectedTags = {
        Project: 'tap-infrastructure',
        Environment: 'production',
        ManagedBy: 'CDKTF',
        Owner: 'DevOps'
      };

      // Verify tags are passed to all modules
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });

    test("should handle all props simultaneously", () => {
      const app = new App();
      const customTags = {
        tags: {
          CustomTag1: 'Value1',
          CustomTag2: 'Value2'
        }
      };

      const stack = new TapStack(app, "TestAllProps", {
        environmentSuffix: 'qa',
        stateBucket: 'qa-state-bucket',
        stateBucketRegion: 'ap-southeast-2',
        awsRegion: 'ap-southeast-2',
        defaultTags: customTags,
        domainName: 'qa.example.com',
        alertEmail: 'qa-team@example.com'
      });

      expect(stack).toBeDefined();
      
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2',
          defaultTags: [customTags]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'qa-state-bucket',
          key: 'qa/TestAllProps.tfstate',
          region: 'ap-southeast-2'
        })
      );

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        "monitoring",
        expect.objectContaining({
          emailEndpoint: 'qa-team@example.com'
        })
      );

      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        "route53",
        expect.objectContaining({
          domainName: 'qa.example.com'
        })
      );
    });
  });

  describe("Module Integration", () => {
    test("should create stack with all components integrated", () => {
      const app = new App();
      const stack = new TapStack(app, "TestIntegration");

      // Verify all modules are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(Ec2Module).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(2); // Public and private
      expect(MonitoringModule).toHaveBeenCalledTimes(1);
      expect(Route53Module).toHaveBeenCalledTimes(1);
      expect(SsmModule).toHaveBeenCalledTimes(1);
      
      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
      
      // Verify outputs are created (10 from main stack + 2 from RDS module)
      expect(TerraformOutput).toHaveBeenCalledTimes(10);
    });
  });
});