import { Testing, App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all imported modules
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation(() => ({
    vpc: { id: "vpc-12345" },
    publicSubnets: [
      { id: "subnet-public-1" },
      { id: "subnet-public-2" },
    ],
    privateSubnets: [
      { id: "subnet-private-1" },
      { id: "subnet-private-2" },
    ],
    securityGroupWeb: { id: "sg-web-12345" },
    securityGroupSsh: { id: "sg-ssh-12345" },
  })),
  IamModule: jest.fn().mockImplementation(() => ({
    ec2Role: {
      name: "tap-ec2-role",
      arn: "arn:aws:iam::123456789012:role/tap-ec2-role",
    },
    lambdaRole: {
      arn: "arn:aws:iam::123456789012:role/tap-lambda-role",
    },
    adminRole: {
      arn: "arn:aws:iam::123456789012:role/tap-admin-role",
    },
  })),
  SecretsModule: jest.fn().mockImplementation(() => ({
    databaseSecret: {
      arn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret-12345",
    },
    configSecret: {
      arn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:config-secret-12345",
    },
  })),
  S3Module: jest.fn().mockImplementation(() => ({
    bucket: {
      id: "tap-app-bucket-dev",
      arn: "arn:aws:s3:::tap-app-bucket-dev",
      bucketRegionalDomainName: "tap-app-bucket-dev.s3.amazonaws.com",
    },
  })),
  CloudFrontModule: jest.fn().mockImplementation(() => ({
    distribution: {
      id: "E1234567890ABC",
      domainName: "d1234567890.cloudfront.net",
    },
  })),
  Ec2Module: jest.fn().mockImplementation(() => ({
    instances: [
      {
        id: "i-1234567890abcdef0",
        publicIp: "54.123.456.789",
      },
      {
        id: "i-0987654321fedcba0",
        publicIp: "54.987.654.321",
      },
    ],
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    dbInstance: {
      id: "db-instance-12345",
      endpoint: "tap-db.cluster-xyz.us-east-1.rds.amazonaws.com",
      arn: "arn:aws:rds:us-east-1:123456789012:db:tap-db",
    },
  })),
  CloudWatchModule: jest.fn().mockImplementation(() => ({
    snsTopic: {
      arn: "arn:aws:sns:us-east-1:123456789012:tap-alarms",
    },
    ec2CpuAlarms: [
      { arn: "arn:aws:cloudwatch:us-east-1:123456789012:alarm:ec2-cpu-1" },
      { arn: "arn:aws:cloudwatch:us-east-1:123456789012:alarm:ec2-cpu-2" },
    ],
    rdsCpuAlarm: {
      arn: "arn:aws:cloudwatch:us-east-1:123456789012:alarm:rds-cpu",
    },
  })),
  OpenSearchModule: jest.fn().mockImplementation(() => ({
    domain: {
      endpoint: "vpc-tap-opensearch-abc123.us-east-1.es.amazonaws.com",
      arn: "arn:aws:opensearch:us-east-1:123456789012:domain/tap-opensearch",
    },
  })),
}));

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

// Mock AWS resources
jest.mock("@cdktf/provider-aws", () => ({
  kmsKey: {
    KmsKey: jest.fn().mockImplementation(() => ({
      id: "kms-key-12345",
      arn: "arn:aws:kms:us-east-1:123456789012:key/kms-key-12345",
    })),
  },
  kmsAlias: {
    KmsAlias: jest.fn(),
  },
  s3Bucket: {
    S3Bucket: jest.fn().mockImplementation(() => ({
      id: "cloudtrail-bucket-12345",
      bucket: "dev-audit-cloudtrail",
      arn: "arn:aws:s3:::dev-audit-cloudtrail",
    })),
  },
  s3BucketPublicAccessBlock: {
    S3BucketPublicAccessBlock: jest.fn(),
  },
  s3BucketPolicy: {
    S3BucketPolicy: jest.fn(),
  },
  cloudtrail: {
    Cloudtrail: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:cloudtrail:us-east-1:123456789012:trail/dev-audit-trail",
    })),
  },
}));

// Mock Random Provider
jest.mock("@cdktf/provider-random", () => ({
  provider: {
    RandomProvider: jest.fn(),
  },
}));

// Mock CDKTF components
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

    test("should apply environment suffix to tags and resources", () => {
      const stack = new TapStack(app, "test-stack", { 
        environmentSuffix: "staging" 
      });
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      
      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          defaultTags: expect.arrayContaining([
            expect.objectContaining({
              tags: expect.objectContaining({
                Environment: "staging",
              }),
            }),
          ]),
        })
      );
    });
  });

  describe("Provider Configuration", () => {
    test("should create Random Provider", () => {
      const stack = new TapStack(app, "test-stack");
      
      const random = require("@cdktf/provider-random");
      
      expect(random.provider.RandomProvider).toHaveBeenCalledWith(
        stack,
        "random"
      );
    });
  });

  describe("KMS Configuration", () => {
    test("should create KMS key with proper configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.kmsKey.KmsKey).toHaveBeenCalledWith(
        stack,
        "main-kms-key",
        expect.objectContaining({
          description: "KMS key for dev environment",
          enableKeyRotation: true,
          tags: expect.objectContaining({
            Project: "CloudFormationSetup",
            Environment: "dev",
            Name: "dev-security-kms-key",
          }),
        })
      );
    });

    test("should create KMS alias", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.kmsAlias.KmsAlias).toHaveBeenCalledWith(
        stack,
        "kms-alias",
        expect.objectContaining({
          name: "alias/dev-main-key",
          targetKeyId: "kms-key-12345",
        })
      );
    });
  });

  describe("Module Creation Order and Dependencies", () => {
    test("should create VPC module with correct parameters", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          vpcCidr: "10.0.0.0/16",
          publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
          privateSubnetCidrs: ["10.0.10.0/24", "10.0.11.0/24"],
          availabilityZones: ["us-east-1a", "us-east-1b"],
          allowedSshCidr: "0.0.0.0/32",
        })
      );
    });

    test("should create Secrets module before RDS", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { SecretsModule } = require("../lib/modules");
      
      expect(SecretsModule).toHaveBeenCalledWith(
        stack,
        "secrets",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          kmsKeyId: "kms-key-12345",
        })
      );
    });

    test("should create S3 module with KMS key", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "s3",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          kmsKeyId: "kms-key-12345",
        })
      );
    });

    test("should create IAM module with S3 bucket ARN", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { IamModule } = require("../lib/modules");
      
      expect(IamModule).toHaveBeenCalledWith(
        stack,
        "iam",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          s3BucketArn: "arn:aws:s3:::tap-app-bucket-dev",
        })
      );
    });

    test("should create CloudFront module with S3 configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudFrontModule } = require("../lib/modules");
      
      expect(CloudFrontModule).toHaveBeenCalledWith(
        stack,
        "cloudfront",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          s3BucketDomainName: "tap-app-bucket-dev.s3.amazonaws.com",
          s3BucketArn: "arn:aws:s3:::tap-app-bucket-dev",
          s3BucketName: "tap-app-bucket-dev",
        })
      );
    });

    test("should create RDS module with VPC and security group configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          vpcId: "vpc-12345",
          subnetIds: ["subnet-private-1", "subnet-private-2"],
          kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/kms-key-12345",
          secretArn: "",
          allowedSecurityGroupId: "sg-web-12345",
        })
      );
    });

    test("should create EC2 module with correct security groups and subnets", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module } = require("../lib/modules");
      
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        "ec2",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          vpcId: "vpc-12345",
          subnetIds: ["subnet-public-1", "subnet-public-2"],
          securityGroupIds: ["sg-web-12345", "sg-ssh-12345"],
          instanceType: "t3.micro",
          iamInstanceProfile: "tap-ec2-role",
          keyName: "tap-ssh-key",
        })
      );
    });

    test("should create CloudWatch module with EC2 and RDS monitoring", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudWatchModule } = require("../lib/modules");
      
      expect(CloudWatchModule).toHaveBeenCalledWith(
        stack,
        "cloudwatch",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          ec2InstanceIds: ["i-1234567890abcdef0", "i-0987654321fedcba0"],
          rdsInstanceId: "db-instance-12345",
          snsTopicArn: "",
        })
      );
    });

    test("should create OpenSearch module with KMS key", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { OpenSearchModule } = require("../lib/modules");
      
      expect(OpenSearchModule).toHaveBeenCalledWith(
        stack,
        "opensearch",
        expect.objectContaining({
          environment: "dev",
          project: "CloudFormationSetup",
          region: "us-east-1",
          kmsKeyId: "kms-key-12345",
        })
      );
    });
  });

  describe("CloudTrail Configuration", () => {
    test("should create CloudTrail bucket with proper settings", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.s3Bucket.S3Bucket).toHaveBeenCalledWith(
        stack,
        "cloudtrail-bucket",
        expect.objectContaining({
          bucket: "dev-audit-cloudtrail",
          tags: expect.objectContaining({
            Project: "CloudFormationSetup",
            Environment: "dev",
          }),
        })
      );

      expect(aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock).toHaveBeenCalledWith(
        stack,
        "cloudtrail-bucket-pab",
        expect.objectContaining({
          bucket: "cloudtrail-bucket-12345",
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        })
      );
    });

    test("should create CloudTrail with proper configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.cloudtrail.Cloudtrail).toHaveBeenCalledWith(
        stack,
        "cloudtrail",
        expect.objectContaining({
          name: "dev-audit-trail",
          s3BucketName: "dev-audit-cloudtrail",
          enableLogging: true,
          enableLogFileValidation: true,
          includeGlobalServiceEvents: true,
          tags: expect.objectContaining({
            Project: "CloudFormationSetup",
            Environment: "dev",
          }),
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required infrastructure outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputMap = outputCalls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});

      // Verify all outputs exist
      const expectedOutputs = [
        "vpc-id",
        "public-subnet-ids",
        "private-subnet-ids",
        "ec2-instance-ids",
        "ec2-public-ips",
        "rds-endpoint",
        "rds-arn",
        "s3-bucket-name",
        "s3-bucket-arn",
        "cloudfront-domain-name",
        "cloudfront-distribution-id",
        "ec2-role-arn",
        "lambda-role-arn",
        "admin-role-arn",
        "database-secret-arn",
        "config-secret-arn",
        "opensearch-endpoint",
        "opensearch-arn",
        "cloudtrail-arn",
        "sns-topic-arn",
        "ec2-cpu-alarm-arns",
        "rds-cpu-alarm-arn",
        "kms-key-id",
      ];

      expectedOutputs.forEach((outputName) => {
        expect(outputMap[outputName]).toBeDefined();
      });
    });

    test("should have correct output values", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});

      // Check specific output values
      expect(outputs["vpc-id"].value).toBe("vpc-12345");
      expect(outputs["vpc-id"].description).toBe("VPC ID");

      expect(outputs["public-subnet-ids"].value).toBe("subnet-public-1,subnet-public-2");
      expect(outputs["public-subnet-ids"].description).toBe("Public Subnet IDs");

      expect(outputs["private-subnet-ids"].value).toBe("subnet-private-1,subnet-private-2");
      expect(outputs["private-subnet-ids"].description).toBe("Private Subnet IDs");

      expect(outputs["ec2-instance-ids"].value).toBe("i-1234567890abcdef0,i-0987654321fedcba0");
      expect(outputs["ec2-instance-ids"].description).toBe("EC2 Instance IDs");

      expect(outputs["ec2-public-ips"].value).toBe("54.123.456.789,54.987.654.321");
      expect(outputs["ec2-public-ips"].description).toBe("EC2 Public IP Addresses");

      expect(outputs["rds-endpoint"].value).toBe("tap-db.cluster-xyz.us-east-1.rds.amazonaws.com");
      expect(outputs["rds-endpoint"].description).toBe("RDS Database Endpoint");

      expect(outputs["s3-bucket-name"].value).toBe("tap-app-bucket-dev");
      expect(outputs["s3-bucket-name"].description).toBe("S3 Bucket Name");

      expect(outputs["cloudfront-domain-name"].value).toBe("d1234567890.cloudfront.net");
      expect(outputs["cloudfront-domain-name"].description).toBe("CloudFront Distribution Domain Name");

      expect(outputs["opensearch-endpoint"].value).toBe("vpc-tap-opensearch-abc123.us-east-1.es.amazonaws.com");
      expect(outputs["opensearch-endpoint"].description).toBe("OpenSearch Domain Endpoint");

      expect(outputs["kms-key-id"].value).toBe("kms-key-12345");
      expect(outputs["kms-key-id"].description).toBe("KMS Key ID");
    });
  });

  describe("Different Environment Configurations", () => {
    test("should configure production environment correctly", () => {
      const stack = new TapStack(app, "test-stack", { 
        environmentSuffix: "prod",
        awsRegion: "us-west-2"
      });
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.kmsAlias.KmsAlias).toHaveBeenCalledWith(
        stack,
        "kms-alias",
        expect.objectContaining({
          name: "alias/prod-main-key",
        })
      );

      expect(aws.s3Bucket.S3Bucket).toHaveBeenCalledWith(
        stack,
        "cloudtrail-bucket",
        expect.objectContaining({
          bucket: "prod-audit-cloudtrail",
        })
      );
    });
  });

  describe("Edge Cases", () => {
    test("should handle missing props gracefully", () => {
      expect(() => {
        new TapStack(app, "test-stack");
      }).not.toThrow();
    });

    test("should handle undefined environment suffix", () => {
      const stack = new TapStack(app, "test-stack", {});
      
      const { S3Backend } = require("cdktf");
      
      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          key: "dev/test-stack.tfstate",
        })
      );
    });

    test("should handle partial props correctly", () => {
      const partialProps = {
        environmentSuffix: "qa",
        stateBucket: "qa-states",
        // Other props missing
      };

      const stack = new TapStack(app, "test-stack", partialProps);
      
      const { S3Backend } = require("cdktf");
      
      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: "qa-states",
          key: "qa/test-stack.tfstate",
          region: "us-east-1", // Should use default
        })
      );
    });
  });

  describe("Module Integration", () => {
    test("should pass VPC resources to dependent modules", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule, Ec2Module } = require("../lib/modules");
      
      // RDS should use private subnets from VPC
      expect(RdsModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          vpcId: "vpc-12345",
          subnetIds: ["subnet-private-1", "subnet-private-2"],
        })
      );
      
      // EC2 should use public subnets from VPC
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          vpcId: "vpc-12345",
          subnetIds: ["subnet-public-1", "subnet-public-2"],
        })
      );
    });

    test("should share KMS key across all encrypting modules", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { SecretsModule, S3Module, OpenSearchModule, RdsModule } = require("../lib/modules");
      
      // All modules should receive the same KMS key
      expect(SecretsModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: "kms-key-12345",
        })
      );
      
      expect(S3Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: "kms-key-12345",
        })
      );
      
      expect(OpenSearchModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: "kms-key-12345",
        })
      );
      
      expect(RdsModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/kms-key-12345",
        })
      );
    });

    test("should pass security groups between modules correctly", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule, Ec2Module } = require("../lib/modules");
      
      // RDS should receive web security group for allowed access
      expect(RdsModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          allowedSecurityGroupId: "sg-web-12345",
        })
      );
      
      // EC2 should receive both web and SSH security groups
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          securityGroupIds: ["sg-web-12345", "sg-ssh-12345"],
        })
      );
    });

    test("should pass IAM roles to dependent modules", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module } = require("../lib/modules");
      
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          iamInstanceProfile: "tap-ec2-role",
        })
      );
    });
  });
});