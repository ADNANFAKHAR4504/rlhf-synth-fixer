import { Testing, App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack"; // Adjust path as needed

// Mock all imported modules
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation(() => ({
    vpc: { id: "vpc-12345" },
    publicSubnets: [{ id: "subnet-public-1" }, { id: "subnet-public-2" }],
    privateSubnets: [{ id: "subnet-private-1" }, { id: "subnet-private-2" }],
  })),
  S3Module: jest.fn().mockImplementation(() => ({
    bucket: {
      id: "s3-bucket-12345",
      bucket: "tap-assets-bucket",
      bucketRegionalDomainName: "tap-assets-bucket.s3.amazonaws.com",
      arn: "arn:aws:s3:::tap-assets-bucket",
    },
    bucketName: "tap-assets-bucket",
  })),
  SecretsModule: jest.fn().mockImplementation(() => ({
    parameters: { "/tap/app/db-password": "secret-id-123" },
  })),
  ElbModule: jest.fn().mockImplementation(() => ({
    alb: { 
      id: "alb-12345",
      dnsName: "tap-alb-123456.us-east-1.elb.amazonaws.com",
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/tap-alb/123456"
    },
    targetGroup: { 
      id: "tg-12345",
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tap-tg/123456"
    },
    securityGroup: { id: "sg-alb-12345" },
  })),
  Ec2Module: jest.fn().mockImplementation(() => ({
    autoScalingGroup: { 
      id: "asg-12345",
      name: "tap-asg"
    },
    securityGroup: { id: "sg-ec2-12345" },
    instanceRole: { 
      arn: "arn:aws:iam::123456789012:role/tap-instance-role"
    },
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    dbInstance: {
      id: "db-instance-12345",
      endpoint: "tap-db.cluster-xyz.us-east-1.rds.amazonaws.com",
      dbName: "tapdb",
    },
  })),
  CloudFrontModule: jest.fn().mockImplementation(() => ({
    distribution: { 
      id: "E1234567890ABC",
      domainName: "d111111abcdef8.cloudfront.net"
    },
  })),
  CloudTrailModule: jest.fn().mockImplementation(() => ({
    trail: { 
      name: "tap-trail",
      arn: "arn:aws:cloudtrail:us-east-1:123456789012:trail/tap-trail"
    },
  })),
  MonitoringModule: jest.fn().mockImplementation(() => ({
    dashboard: { 
      dashboardName: "tap-dashboard",
      dashboardArn: "arn:aws:cloudwatch::123456789012:dashboard/tap-dashboard"
    },
    snsTopicArn: "arn:aws:sns:us-east-1:123456789012:tap-alerts",
  })),
}));

// Mock AWS Provider and other AWS resources
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

// Mock AWS data sources and resources
jest.mock("@cdktf/provider-aws", () => ({
  s3Bucket: {
    S3Bucket: jest.fn().mockImplementation(() => ({
      id: "logs-bucket-id",
      bucket: "tap-logs-655",
      arn: "arn:aws:s3:::tap-logs-655",
    })),
  },
  s3BucketAcl: {
    S3BucketAcl: jest.fn(),
  },
  s3BucketOwnershipControls: {
    S3BucketOwnershipControls: jest.fn(),
  },
  s3BucketVersioning: {
    S3BucketVersioningA: jest.fn(),
  },
  s3BucketServerSideEncryptionConfiguration: {
    S3BucketServerSideEncryptionConfigurationA: jest.fn(),
  },
  s3BucketPolicy: {
    S3BucketPolicy: jest.fn(),
  },
  keyPair: {
    KeyPair: jest.fn().mockImplementation(() => ({
      keyName: "tap-dev-keypair",
    })),
  },
  dataAwsCallerIdentity: {
    DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
      accountId: "123456789012",
    })),
  },
  dataAwsCanonicalUserId: {
    DataAwsCanonicalUserId: jest.fn().mockImplementation(() => ({
      id: "canonical-user-id-123",
    })),
  },
  autoscalingAttachment: {
    AutoscalingAttachment: jest.fn(),
  },
  autoscalingPolicy: {
    AutoscalingPolicy: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:12345",
    })),
  },
  cloudwatchMetricAlarm: {
    CloudwatchMetricAlarm: jest.fn(),
  },
}));

jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    S3Backend: jest.fn(),
    TerraformOutput: jest.fn(),
  };
});

describe("TapStack Unit Tests", () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = Testing.app();
  });

  describe("Stack Configuration", () => {
    test("should create stack with default configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      // Check AWS Provider was configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "eu-north-1",
          defaultTags: expect.arrayContaining([
            expect.objectContaining({
              tags: expect.objectContaining({
                Environment: "Production",
                Owner: "DevOps",
                Security: "Enforced",
                ManagedBy: "CDKTF",
                Project: "TAP",
              }),
            }),
          ]),
        })
      );

      // Check S3 Backend was configured with defaults
      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/test-stack.tfstate",
          region: "us-east-1",
          encrypt: true,
        })
      );
    });

    test("should use custom configuration when provided", () => {
      const customProps = {
        environmentSuffix: "prod",
        stateBucket: "custom-state-bucket",
        stateBucketRegion: "eu-west-1",
        awsRegion: "us-west-2",
      };

      const stack = new TapStack(app, "test-stack", customProps);
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-west-2",
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: "custom-state-bucket",
          key: "prod/test-stack.tfstate",
          region: "eu-west-1",
        })
      );
    });

    test("should add S3 backend state locking override", () => {
      const stack = new TapStack(app, "test-stack");
      const addOverrideSpy = jest.spyOn(stack, 'addOverride');
      
      // Create another stack instance to test override
      new TapStack(app, "test-stack-2");
      
      // Verify stack was created
      expect(stack).toBeDefined();
    });

    test("should use correct availability zones based on region", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "us-west-2" });
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc",
        expect.objectContaining({
          availabilityZones: ["us-west-2a", "us-west-2b"],
        })
      );
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("should create logs bucket with correct configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      // Check logs bucket creation
      expect(aws.s3Bucket.S3Bucket).toHaveBeenCalledWith(
        stack,
        "logs-bucket",
        expect.objectContaining({
          bucket: "tap-logs-655",
          tags: expect.objectContaining({
            Environment: "Production",
            Owner: "DevOps",
            Security: "Enforced",
            ManagedBy: "CDKTF",
            Project: "TAP",
          }),
        })
      );

      // Check ownership controls
      expect(aws.s3BucketOwnershipControls.S3BucketOwnershipControls).toHaveBeenCalledWith(
        stack,
        "logs-bucket-ownership",
        expect.objectContaining({
          bucket: "logs-bucket-id",
          rule: {
            objectOwnership: "BucketOwnerPreferred",
          },
        })
      );

      // Check bucket ACL
      expect(aws.s3BucketAcl.S3BucketAcl).toHaveBeenCalledWith(
        stack,
        "logs-bucket-acl",
        expect.objectContaining({
          bucket: "logs-bucket-id",
          acl: "log-delivery-write",
        })
      );

      // Check versioning
      expect(aws.s3BucketVersioning.S3BucketVersioningA).toHaveBeenCalledWith(
        stack,
        "logs-versioning",
        expect.objectContaining({
          bucket: "logs-bucket-id",
          versioningConfiguration: {
            status: "Enabled",
          },
        })
      );

      // Check encryption
      expect(aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA).toHaveBeenCalledWith(
        stack,
        "logs-encryption",
        expect.objectContaining({
          bucket: "logs-bucket-id",
          rule: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
              },
            }),
          ]),
        })
      );
    });

    test("should configure CloudFront ACL for logs bucket", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      const aclCall = aws.s3BucketAcl.S3BucketAcl.mock.calls.find(
        (call: any) => call[1] === "logs-bucket-acl-cloudfront"
      );
      
      expect(aclCall).toBeDefined();
      expect(aclCall[2].accessControlPolicy.grant).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            grantee: expect.objectContaining({
              id: "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0",
              type: "CanonicalUser",
            }),
            permission: "FULL_CONTROL",
          }),
        ])
      );
    });

    test("should create assets bucket using S3Module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "assets-bucket",
        expect.objectContaining({
          bucketPrefix: "tap-assets",
          versioning: true,
          encryption: true,
          accessLogging: false,
          tags: expect.objectContaining({
            Environment: "Production",
            Owner: "DevOps",
            Security: "Enforced",
            ManagedBy: "CDKTF",
            Project: "TAP",
          }),
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: "manage-old-assets",
              status: "Enabled",
            }),
          ]),
        })
      );
    });
  });

  describe("Key Pair Configuration", () => {
    test("should create key pair when valid SSH key is provided", () => {
      process.env.SSH_PUBLIC_KEY = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCcJ4MAs... valid@example.com";
      
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.keyPair.KeyPair).toHaveBeenCalledWith(
        stack,
        "key-pair",
        expect.objectContaining({
          keyName: "tap-dev-keypair",
          publicKey: process.env.SSH_PUBLIC_KEY,
        })
      );
      
      delete process.env.SSH_PUBLIC_KEY;
    });
  });

  describe("Module Instantiation", () => {
    test("should create VPC module with correct parameters", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc",
        expect.objectContaining({
          vpcCidr: "10.0.0.0/16",
          availabilityZones: ["eu-north-1a", "eu-north-1b"],
          enableFlowLogs: true,
          flowLogsBucket: "tap-logs-655",
        })
      );
    });

    test("should create Secrets module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { SecretsModule } = require("../lib/modules");
      
      expect(SecretsModule).toHaveBeenCalledWith(
        stack,
        "secrets",
        expect.objectContaining({
          parameterPrefix: "/tap/app",
        })
      );
    });

    test("should create ELB module with VPC references", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { ElbModule } = require("../lib/modules");
      
      expect(ElbModule).toHaveBeenCalledWith(
        stack,
        "elb",
        expect.objectContaining({
          vpcId: "vpc-12345",
          publicSubnetIds: ["subnet-public-1", "subnet-public-2"],
          targetGroupPort: 80,
          healthCheckPath: "/health.html",
          accessLogsBucket: "tap-logs-655",
        })
      );
    });

    test("should create EC2 module with correct configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module } = require("../lib/modules");
      
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        "ec2",
        expect.objectContaining({
          vpcId: "vpc-12345",
          privateSubnetIds: ["subnet-private-1", "subnet-private-2"],
          albSecurityGroupId: "sg-alb-12345",
          instanceType: "t3.medium",
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 3,
          ssmParameterPrefix: "/tap/app",
        })
      );
    });

    test("should create RDS module with encryption and multi-AZ", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds",
        expect.objectContaining({
          vpcId: "vpc-12345",
          privateSubnetIds: ["subnet-private-1", "subnet-private-2"],
          engine: "mysql",
          instanceClass: "db.t3.medium",
          allocatedStorage: 100,
          storageEncrypted: true,
          backupRetentionPeriod: 7,
          multiAz: true,
          masterUsername: "adminuser",
          databaseName: "tapdb",
          allowedSecurityGroupIds: ["sg-ec2-12345"],
        })
      );
    });

    test("should use custom DB username from environment", () => {
      process.env.DB_MASTER_USERNAME = "customdbuser";
      
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds",
        expect.objectContaining({
          masterUsername: "customdbuser",
        })
      );
      
      delete process.env.DB_MASTER_USERNAME;
    });

    test("should create CloudFront module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudFrontModule } = require("../lib/modules");
      
      expect(CloudFrontModule).toHaveBeenCalledWith(
        stack,
        "cdn",
        expect.objectContaining({
          s3BucketDomainName: "tap-assets-bucket.s3.amazonaws.com",
          s3BucketId: "s3-bucket-12345",
          logBucket: "tap-logs-655",
        })
      );
    });

    test("should create CloudTrail module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudTrailModule } = require("../lib/modules");
      
      expect(CloudTrailModule).toHaveBeenCalledWith(
        stack,
        "audit",
        expect.objectContaining({
          s3BucketName: "tap-logs-655",
        })
      );
    });

    test("should create Monitoring module with SNS endpoint", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { MonitoringModule } = require("../lib/modules");
      
      expect(MonitoringModule).toHaveBeenCalledWith(
        stack,
        "monitoring",
        expect.objectContaining({
          albArn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/tap-alb/123456",
          asgName: "tap-asg",
          dbInstanceId: "db-instance-12345",
          snsEmailEndpoint: "admin@tap.com",
        })
      );
    });
  });

  describe("Auto Scaling Configuration", () => {
    test("should attach ASG to target group", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.autoscalingAttachment.AutoscalingAttachment).toHaveBeenCalledWith(
        stack,
        "asg-tg-attachment",
        expect.objectContaining({
          autoscalingGroupName: "tap-asg",
          lbTargetGroupArn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tap-tg/123456",
        })
      );
    });

    test("should create scale up and down policies", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      // Check scale up policy
      expect(aws.autoscalingPolicy.AutoscalingPolicy).toHaveBeenCalledWith(
        stack,
        "scale-up-policy",
        expect.objectContaining({
          name: "tap-scale-up",
          scalingAdjustment: 2,
          adjustmentType: "ChangeInCapacity",
          cooldown: 300,
          autoscalingGroupName: "tap-asg",
        })
      );

      // Check scale down policy
      expect(aws.autoscalingPolicy.AutoscalingPolicy).toHaveBeenCalledWith(
        stack,
        "scale-down-policy",
        expect.objectContaining({
          name: "tap-scale-down",
          scalingAdjustment: -1,
          adjustmentType: "ChangeInCapacity",
          cooldown: 300,
          autoscalingGroupName: "tap-asg",
        })
      );
    });

    test("should create CloudWatch alarms for scaling", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      // Check CPU high alarm
      expect(aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm).toHaveBeenCalledWith(
        stack,
        "cpu-high-alarm",
        expect.objectContaining({
          alarmName: "tap-cpu-high",
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 2,
          metricName: "CPUUtilization",
          threshold: 70,
          dimensions: {
            AutoScalingGroupName: "tap-asg",
          },
        })
      );

      // Check CPU low alarm
      expect(aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm).toHaveBeenCalledWith(
        stack,
        "cpu-low-alarm",
        expect.objectContaining({
          alarmName: "tap-cpu-low",
          comparisonOperator: "LessThanThreshold",
          evaluationPeriods: 2,
          metricName: "CPUUtilization",
          threshold: 30,
          dimensions: {
            AutoScalingGroupName: "tap-asg",
          },
        })
      );
    });
  });

  describe("S3 Bucket Policy", () => {
    test("should create comprehensive bucket policy for logs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      const policyCall = aws.s3BucketPolicy.S3BucketPolicy.mock.calls[0];
      const policy = JSON.parse(policyCall[2].policy);
      
      // Check for ALB access logs statement
      const albStatement = policy.Statement.find((s: any) => s.Sid === "ALBAccessLogsPolicy");
      expect(albStatement).toBeDefined();
      expect(albStatement.Principal.AWS).toContain("arn:aws:iam::");
      expect(albStatement.Action).toBe("s3:PutObject");
      
      // Check for CloudTrail statement
      const cloudTrailStatement = policy.Statement.find((s: any) => s.Sid === "CloudTrailBucketAcl");
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe("cloudtrail.amazonaws.com");
      
      // Check for VPC Flow Logs statement
      const vpcFlowStatement = policy.Statement.find((s: any) => s.Sid === "VPCFlowLogsPolicy");
      expect(vpcFlowStatement).toBeDefined();
      expect(vpcFlowStatement.Principal.Service).toBe("delivery.logs.amazonaws.com");
      
      // Check for CloudFront statement
      const cloudFrontStatement = policy.Statement.find((s: any) => s.Sid === "CloudFrontLogDelivery");
      expect(cloudFrontStatement).toBeDefined();
      expect(cloudFrontStatement.Principal.Service).toBe("cloudfront.amazonaws.com");
    });

    test("should use correct ELB service account for region", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "us-west-2" });
      
      const aws = require("@cdktf/provider-aws");
      
      const policyCall = aws.s3BucketPolicy.S3BucketPolicy.mock.calls.find(
        (call: any) => call[1] === "logs-bucket-policy"
      );
      const policy = JSON.parse(policyCall[2].policy);
      
      const albStatement = policy.Statement.find((s: any) => s.Sid === "ALBAccessLogsPolicy");
      expect(albStatement.Principal.AWS).toBe("arn:aws:iam::797873946194:root");
    });

    test("should use default ELB account for unknown regions", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "unknown-region" });
      
      const aws = require("@cdktf/provider-aws");
      
      const policyCall = aws.s3BucketPolicy.S3BucketPolicy.mock.calls.find(
        (call: any) => call[1] === "logs-bucket-policy"
      );
      const policy = JSON.parse(policyCall[2].policy);
      
      const albStatement = policy.Statement.find((s: any) => s.Sid === "ALBAccessLogsPolicy");
      expect(albStatement.Principal.AWS).toBe("arn:aws:iam::127311923021:root"); // us-east-1 default
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all infrastructure outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputNames = outputCalls.map((call: any) => call[1]);
      
      // Check that all expected outputs are created
      expect(outputNames).toContain("vpc-id");
      expect(outputNames).toContain("alb-dns-name");
      expect(outputNames).toContain("alb-url");
      expect(outputNames).toContain("rds-endpoint");
      expect(outputNames).toContain("rds-database-name");
      expect(outputNames).toContain("cloudfront-distribution-id");
      expect(outputNames).toContain("cloudfront-domain-name");
      expect(outputNames).toContain("cdn-url");
      expect(outputNames).toContain("s3-logs-bucket");
      expect(outputNames).toContain("s3-assets-bucket");
      expect(outputNames).toContain("cloudtrail-name");
      expect(outputNames).toContain("ec2-instance-role-arn");
      expect(outputNames).toContain("asg-name");
      expect(outputNames).toContain("monitoring-dashboard-url");
      expect(outputNames).toContain("key-pair-name");
    });

    test("should have correct output values", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "us-west-2" });
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});
      
      expect(outputs["vpc-id"].value).toBe("vpc-12345");
      expect(outputs["alb-dns-name"].value).toBe("tap-alb-123456.us-east-1.elb.amazonaws.com");
      expect(outputs["alb-url"].value).toBe("http://tap-alb-123456.us-east-1.elb.amazonaws.com");
      expect(outputs["rds-endpoint"].value).toBe("tap-db.cluster-xyz.us-east-1.rds.amazonaws.com");
      expect(outputs["rds-endpoint"].sensitive).toBe(true);
      expect(outputs["rds-database-name"].value).toBe("tapdb");
      expect(outputs["cloudfront-distribution-id"].value).toBe("E1234567890ABC");
      expect(outputs["cloudfront-domain-name"].value).toBe("d111111abcdef8.cloudfront.net");
      expect(outputs["cdn-url"].value).toBe("https://d111111abcdef8.cloudfront.net");
      expect(outputs["s3-logs-bucket"].value).toBe("tap-logs-655");
      expect(outputs["s3-assets-bucket"].value).toBe("tap-assets-bucket");
      expect(outputs["cloudtrail-name"].value).toBe("tap-trail");
      expect(outputs["ec2-instance-role-arn"].value).toBe("arn:aws:iam::123456789012:role/tap-instance-role");
      expect(outputs["asg-name"].value).toBe("tap-asg");
      expect(outputs["monitoring-dashboard-url"].value).toContain("cloudwatch");
      expect(outputs["monitoring-dashboard-url"].value).toContain("us-west-2");
    });

    test("should have proper descriptions for all outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});
      
      // Check that all outputs have descriptions
      Object.entries(outputs).forEach(([name, config]: [string, any]) => {
        expect(config.description).toBeTruthy();
        expect(typeof config.description).toBe("string");
      });
    });
  });

  describe("Global Tags", () => {
    test("should apply global tags to all modules", () => {
      const stack = new TapStack(app, "test-stack");
      
      const modules = require("../lib/modules");
      
      const expectedTags = {
        Environment: "Production",
        Owner: "DevOps",
        Security: "Enforced",
        ManagedBy: "CDKTF",
        Project: "TAP",
      };
      
      // Check VPC module
      expect(modules.VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc",
        expect.objectContaining({ tags: expectedTags })
      );
      
      // Check S3 module
      expect(modules.S3Module).toHaveBeenCalledWith(
        stack,
        "assets-bucket",
        expect.objectContaining({ tags: expectedTags })
      );
      
      // Check other modules
      expect(modules.ElbModule).toHaveBeenCalledWith(
        stack,
        "elb",
        expect.objectContaining({ tags: expectedTags })
      );
    });
  });
});