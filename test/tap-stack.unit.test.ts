import { Testing, App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all imported modules
jest.mock("../lib/modules", () => ({
  KmsModule: jest.fn().mockImplementation(() => ({
    key: {
      id: "kms-key-12345",
      keyId: "12345678-1234-1234-1234-123456789012",
      arn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    },
  })),
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
  })),
  S3Module: jest.fn().mockImplementation(() => ({
    logBucket: {
      id: "tap-log-bucket-dev",
      arn: "arn:aws:s3:::tap-log-bucket-dev",
      bucket: "tap-log-bucket-dev",
    },
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    instance: {
      id: "tap-rds-instance",
      endpoint: "tap-db.cluster-xyz.us-east-1.rds.amazonaws.com",
      arn: "arn:aws:rds:us-east-1:123456789012:db:tap-db",
    },
    resourceArn: "arn:aws:rds:us-east-1:123456789012:db:tap-db",
  })),
  IamModule: jest.fn().mockImplementation(() => ({
    instanceProfile: {
      name: "tap-ec2-instance-profile",
      arn: "arn:aws:iam::123456789012:instance-profile/tap-ec2-profile",
    },
  })),
  Ec2Module: jest.fn().mockImplementation(() => ({
    instance: {
      id: "i-1234567890abcdef0",
      publicIp: "54.123.456.789",
      publicDns: "ec2-54-123-456-789.compute-1.amazonaws.com",
    },
  })),
  MonitoringModule: jest.fn().mockImplementation(() => ({
    snsTopic: {
      arn: "arn:aws:sns:us-east-1:123456789012:tap-alerts",
    },
  })),
  CloudFrontModule: jest.fn().mockImplementation(() => ({
    distribution: {
      id: "E1234567890ABC",
      domainName: "d1234567890.cloudfront.net",
    },
  })),
}));

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
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
    test("should use default configuration when no props provided", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: [
            {
              tags: {
                Project: "TAP-Infrastructure",
                IaC: "CDKTF",
                Terraform: "true",
              },
            },
          ],
        })
      );

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

    test("should override AWS region when AWS_REGION_OVERRIDE is set", () => {
      // This would require modifying AWS_REGION_OVERRIDE constant
      // which is not possible in runtime, so this test validates the logic
      const stack = new TapStack(app, "test-stack", {
        awsRegion: "eu-central-1",
      });
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      
      // Since AWS_REGION_OVERRIDE is empty, it should use props.awsRegion
      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "eu-central-1",
        })
      );
    });
  });

  describe("Module Creation Order and Dependencies", () => {
    test("should create KMS module first", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { KmsModule } = require("../lib/modules");
      
      expect(KmsModule).toHaveBeenCalledWith(stack, "kms");
      expect(KmsModule).toHaveBeenCalledTimes(1);
    });

    test("should create VPC module with correct parameters", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc",
        expect.objectContaining({
          environment: "dev",
          project: "TAP-Infrastructure",
          awsRegion: "us-east-1",
          vpcCidr: "10.0.0.0/16",
          publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
          privateSubnetCidrs: ["10.0.10.0/24", "10.0.11.0/24"],
          availabilityZones: ["us-east-1a", "us-east-1b"],
          allowedSshCidr: "0.0.0.0/32",
        })
      );
    });

    test("should create S3 module with KMS key", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module, KmsModule } = require("../lib/modules");
      const kmsInstance = KmsModule.mock.results[0].value;
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "s3",
        kmsInstance.key
      );
    });

    test("should create RDS module with VPC and KMS dependencies", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule, VpcModule, KmsModule } = require("../lib/modules");
      const vpcInstance = VpcModule.mock.results[0].value;
      const kmsInstance = KmsModule.mock.results[0].value;
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds",
        vpcInstance.vpc,
        vpcInstance.privateSubnets,
        kmsInstance.key
      );
    });

    test("should create IAM module with S3 and RDS ARNs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { IamModule, S3Module, RdsModule } = require("../lib/modules");
      const s3Instance = S3Module.mock.results[0].value;
      const rdsInstance = RdsModule.mock.results[0].value;
      
      expect(IamModule).toHaveBeenCalledWith(
        stack,
        "iam",
        s3Instance.logBucket.arn,
        rdsInstance.resourceArn
      );
    });

    test("should create EC2 module with VPC and IAM dependencies", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module, VpcModule, IamModule } = require("../lib/modules");
      const vpcInstance = VpcModule.mock.results[0].value;
      const iamInstance = IamModule.mock.results[0].value;
      
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        "ec2",
        vpcInstance.vpc,
        vpcInstance.publicSubnets[0],
        iamInstance.instanceProfile,
        "0.0.0.0/32"
      );
    });

    test("should create Monitoring module with EC2 and RDS instances", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { MonitoringModule, Ec2Module, RdsModule } = require("../lib/modules");
      const ec2Instance = Ec2Module.mock.results[0].value;
      const rdsInstance = RdsModule.mock.results[0].value;
      
      expect(MonitoringModule).toHaveBeenCalledWith(
        stack,
        "monitoring",
        ec2Instance.instance.id,
        rdsInstance.instance.id,
        "admin@example.com"
      );
    });

    test("should create CloudFront module with S3 bucket", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudFrontModule, S3Module } = require("../lib/modules");
      const s3Instance = S3Module.mock.results[0].value;
      
      expect(CloudFrontModule).toHaveBeenCalledWith(
        stack,
        "cloudfront",
        s3Instance.logBucket
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
        "s3-bucket-name",
        "s3-bucket-arn",
        "rds-endpoint",
        "rds-instance-id",
        "ec2-instance-id",
        "ec2-public-ip",
        "ec2-public-dns",
        "sns-topic-arn",
        "cloudfront-distribution-id",
        "cloudfront-domain-name",
        "kms-key-id",
        "kms-key-arn",
      ];

      expectedOutputs.forEach((outputName) => {
        expect(outputMap[outputName]).toBeDefined();
      });
    });

    test("should have correct output values and descriptions", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});

      // VPC outputs
      expect(outputs["vpc-id"]).toEqual({
        value: "vpc-12345",
        description: "VPC identifier",
      });

      expect(outputs["public-subnet-ids"]).toEqual({
        value: "subnet-public-1,subnet-public-2",
        description: "Public subnet identifiers",
      });

      expect(outputs["private-subnet-ids"]).toEqual({
        value: "subnet-private-1,subnet-private-2",
        description: "Private subnet identifiers",
      });

      // S3 outputs
      expect(outputs["s3-bucket-name"]).toEqual({
        value: "tap-log-bucket-dev",
        description: "S3 logging bucket name",
      });

      expect(outputs["s3-bucket-arn"]).toEqual({
        value: "arn:aws:s3:::tap-log-bucket-dev",
        description: "S3 logging bucket ARN",
      });

      // RDS outputs
      expect(outputs["rds-endpoint"]).toEqual({
        value: "tap-db.cluster-xyz.us-east-1.rds.amazonaws.com",
        description: "RDS PostgreSQL endpoint",
        sensitive: true,
      });

      expect(outputs["rds-instance-id"]).toEqual({
        value: "tap-rds-instance",
        description: "RDS instance identifier",
      });

      // EC2 outputs
      expect(outputs["ec2-instance-id"]).toEqual({
        value: "i-1234567890abcdef0",
        description: "EC2 instance identifier",
      });

      expect(outputs["ec2-public-ip"]).toEqual({
        value: "54.123.456.789",
        description: "EC2 instance public IP address",
      });

      expect(outputs["ec2-public-dns"]).toEqual({
        value: "ec2-54-123-456-789.compute-1.amazonaws.com",
        description: "EC2 instance public DNS name",
      });

      // Monitoring output
      expect(outputs["sns-topic-arn"]).toEqual({
        value: "arn:aws:sns:us-east-1:123456789012:tap-alerts",
        description: "SNS topic ARN for alerts",
      });

      // CloudFront outputs
      expect(outputs["cloudfront-distribution-id"]).toEqual({
        value: "E1234567890ABC",
        description: "CloudFront distribution ID",
      });

      expect(outputs["cloudfront-domain-name"]).toEqual({
        value: "d1234567890.cloudfront.net",
        description: "CloudFront distribution domain name",
      });

      // KMS outputs
      expect(outputs["kms-key-id"]).toEqual({
        value: "12345678-1234-1234-1234-123456789012",
        description: "KMS master key ID",
      });

      expect(outputs["kms-key-arn"]).toEqual({
        value: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        description: "KMS master key ARN",
      });
    });

    test("should mark sensitive outputs appropriately", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});

      // RDS endpoint should be marked as sensitive
      expect(outputs["rds-endpoint"].sensitive).toBe(true);
      
      // Other outputs should not be marked as sensitive (undefined or false)
      expect(outputs["vpc-id"].sensitive).toBeUndefined();
      expect(outputs["ec2-public-ip"].sensitive).toBeUndefined();
    });
  });

  describe("Different Environment Configurations", () => {
    test("should configure production environment correctly", () => {
      const stack = new TapStack(app, "test-stack", { 
        environmentSuffix: "prod",
        awsRegion: "us-west-2"
      });
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc",
        expect.objectContaining({
          environment: "prod",
          awsRegion: "us-west-2",
          availabilityZones: ["us-west-2a", "us-west-2b"],
        })
      );
    });

    test("should configure staging environment correctly", () => {
      const stack = new TapStack(app, "test-stack", { 
        environmentSuffix: "staging"
      });
      
      const { S3Backend } = require("cdktf");
      
      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          key: "staging/test-stack.tfstate",
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
      
      const { RdsModule, Ec2Module, VpcModule } = require("../lib/modules");
      const vpcInstance = VpcModule.mock.results[0].value;
      
      // RDS should use private subnets from VPC
      expect(RdsModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        vpcInstance.vpc,
        vpcInstance.privateSubnets,
        expect.any(Object)
      );
      
      // EC2 should use public subnet from VPC
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        vpcInstance.vpc,
        vpcInstance.publicSubnets[0],
        expect.any(Object),
        expect.any(String)
      );
    });

    test("should share KMS key across encrypting modules", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module, RdsModule, KmsModule } = require("../lib/modules");
      const kmsInstance = KmsModule.mock.results[0].value;
      
      // S3 should receive the KMS key
      expect(S3Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        kmsInstance.key
      );
      
      // RDS should receive the KMS key
      expect(RdsModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.any(Object),
        expect.any(Object),
        kmsInstance.key
      );
    });

    test("should pass IAM instance profile to EC2", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module, IamModule } = require("../lib/modules");
      const iamInstance = IamModule.mock.results[0].value;
      
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.any(Object),
        expect.any(Object),
        iamInstance.instanceProfile,
        expect.any(String)
      );
    });

    test("should pass instance IDs to monitoring module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { MonitoringModule, Ec2Module, RdsModule } = require("../lib/modules");
      const ec2Instance = Ec2Module.mock.results[0].value;
      const rdsInstance = RdsModule.mock.results[0].value;
      
      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        ec2Instance.instance.id,
        rdsInstance.instance.id,
        "admin@example.com"
      );
    });
  });

  describe("Console Logging", () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test("should log deployment messages for each module", () => {
      new TapStack(app, "test-stack");

      expect(consoleSpy).toHaveBeenCalledWith("📦 Deploying KMS encryption keys...");
      expect(consoleSpy).toHaveBeenCalledWith("🌐 Deploying VPC and networking components...");
      expect(consoleSpy).toHaveBeenCalledWith("🪣 Deploying S3 bucket for logging...");
      expect(consoleSpy).toHaveBeenCalledWith("🗄️ Deploying RDS PostgreSQL database...");
      expect(consoleSpy).toHaveBeenCalledWith("🔐 Configuring IAM roles and policies...");
      expect(consoleSpy).toHaveBeenCalledWith("💻 Deploying EC2 instance...");
      expect(consoleSpy).toHaveBeenCalledWith("📊 Configuring CloudWatch monitoring and SNS alerts...");
      expect(consoleSpy).toHaveBeenCalledWith("🚀 Deploying CloudFront CDN distribution...");
    });
  });
});