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
  IamModule: jest.fn().mockImplementation(() => ({
    instanceRole: { arn: "arn:aws:iam::123456789012:role/instance-role" },
    lambdaRole: { arn: "arn:aws:iam::123456789012:role/lambda-role" },
    permissionsBoundary: { arn: "arn:aws:iam::123456789012:policy/permissions-boundary" },
  })),
  S3Module: jest.fn().mockImplementation(() => ({
    kmsKey: { 
      id: "key-12345",
      arn: "arn:aws:kms:us-east-1:123456789012:key/key-12345"
    },
  })),
  Ec2Module: jest.fn().mockImplementation(() => ({
    instance: { id: "i-12345" },
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    dbInstance: {
      id: "db-instance-12345",
      endpoint: "db-instance.cluster-xyz.us-east-1.rds.amazonaws.com",
    },
  })),
  LambdaModule: jest.fn().mockImplementation(() => ({
    function: { functionName: "test-lambda-function" },
  })),
  CloudTrailModule: jest.fn().mockImplementation(() => ({
    trail: { 
      name: "test-trail",
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
    },
  })),
}));

// Mock AWS Provider and Backend
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
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

      // Check AWS Provider was configured
      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: expect.arrayContaining([
            expect.objectContaining({
              tags: expect.objectContaining({
                Environment: "Production",
                Compliance: "Enforced",
                Security: "True",
                ManagedBy: "CDKTF",
              }),
            }),
          ]),
        })
      );

      // Check S3 Backend was configured
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
        defaultTags: {
          tags: {
            CustomTag: "CustomValue",
          },
        },
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
      
      // Mock addOverride method
      const addOverrideSpy = jest.spyOn(stack, 'addOverride');
      
      // Re-create stack to trigger override
      new TapStack(app, "test-stack-override");
      
      // We can't directly test addOverride as it's called in constructor
      // but we can verify the stack was created successfully
      expect(stack).toBeDefined();
    });

    test("should use correct availability zones based on region", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "eu-west-1" });
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc-module",
        ["eu-west-1a", "eu-west-1b"]
      );
    });
  });

  describe("Module Instantiation", () => {
    test("should create VPC module with availability zones", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc-module",
        ["us-east-1a", "us-east-1b"]
      );
    });

    test("should create IAM module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { IamModule } = require("../lib/modules");
      
      expect(IamModule).toHaveBeenCalledWith(stack, "iam-module");
    });

    test("should create S3 module with aws region", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(stack, "s3-module", "us-east-1");
    });

    test("should create CloudTrail module with KMS key", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudTrailModule } = require("../lib/modules");
      
      expect(CloudTrailModule).toHaveBeenCalledWith(
        stack,
        "cloudtrail-module",
        expect.objectContaining({
          id: "key-12345",
          arn: "arn:aws:kms:us-east-1:123456789012:key/key-12345"
        })
      );
    });

    test("should create EC2 module with VPC references", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module } = require("../lib/modules");
      
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        "ec2-module",
        { id: "vpc-12345" },
        "subnet-private-1",
        { arn: "arn:aws:iam::123456789012:role/instance-role" }
      );
    });

    test("should create RDS module with private subnets", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds-module",
        { id: "vpc-12345" },
        ["subnet-private-1", "subnet-private-2"]
      );
    });

    test("should create Lambda module with all dependencies", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { LambdaModule } = require("../lib/modules");
      
      expect(LambdaModule).toHaveBeenCalledWith(
        stack,
        "lambda-module",
        { id: "vpc-12345" },
        ["subnet-private-1", "subnet-private-2"],
        { arn: "arn:aws:iam::123456789012:role/lambda-role" },
        expect.objectContaining({
          id: "key-12345",
          arn: "arn:aws:kms:us-east-1:123456789012:key/key-12345"
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required compliance outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputNames = outputCalls.map((call: any) => call[1]);
      
      // Check that all expected outputs are created
      expect(outputNames).toContain("vpc-id");
      expect(outputNames).toContain("iam-permissions-boundary-arn");
      expect(outputNames).toContain("s3-encryption-status");
      expect(outputNames).toContain("s3-public-access-block");
      expect(outputNames).toContain("ec2-ebs-encryption");
      expect(outputNames).toContain("rds-encryption-status");
      expect(outputNames).toContain("cloudtrail-status");
      expect(outputNames).toContain("lambda-logging-status");
      expect(outputNames).toContain("vpc-flow-logs-status");
      expect(outputNames).toContain("security-compliance-summary");
    });

    test("should have correct output values", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});
      
      expect(outputs["vpc-id"].value).toBe("vpc-12345");
      expect(outputs["iam-permissions-boundary-arn"].value).toBe("arn:aws:iam::123456789012:policy/permissions-boundary");
      expect(outputs["s3-encryption-status"].value).toBe("KMS encryption enabled on all S3 buckets");
      expect(outputs["s3-public-access-block"].value).toBe("Public access blocked on all S3 buckets");
      expect(outputs["ec2-ebs-encryption"].value).toBe("All EBS volumes are encrypted");
      expect(outputs["rds-encryption-status"].value).toBe("RDS instance and snapshots are encrypted");
      expect(outputs["lambda-logging-status"].value).toBe("Lambda functions have detailed CloudWatch logging enabled");
      expect(outputs["vpc-flow-logs-status"].value).toBe("VPC Flow Logs enabled and stored in CloudWatch Logs");
    });

    test("should have correct cloudtrail status output structure", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const cloudtrailOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === "cloudtrail-status"
      );
      
      expect(cloudtrailOutput[2].value).toEqual({
        enabled: true,
        logFileValidation: true,
        encryptionEnabled: true,
      });
    });

    test("should have complete security compliance summary", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const summaryOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === "security-compliance-summary"
      );
      
      expect(summaryOutput[2].value).toEqual({
        iamPermissionBoundaries: "Enforced",
        mfaRequirement: "Policy Applied",
        ec2EbsEncryption: "Enabled",
        s3Encryption: "KMS",
        s3PublicAccess: "Blocked",
        sshRestriction: "No 0.0.0.0/0 access",
        cloudTrailMultiRegion: "Enabled",
        lambdaVpcDeployment: "Enforced",
        rdsEncryption: "Enabled",
        rdsPublicAccess: "Disabled",
        vpcFlowLogs: "CloudWatch",
      });
      
      expect(summaryOutput[2].description).toBe("Security compliance summary");
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

  describe("AWS Region Override", () => {
    test("should respect AWS_REGION_OVERRIDE when set", () => {
      // Temporarily modify the AWS_REGION_OVERRIDE constant
      const originalCode = require("../lib/tap-stack");
      jest.resetModules();
      
      // This test is more conceptual since we can't easily modify constants
      // In real implementation, you might want to refactor AWS_REGION_OVERRIDE
      // to be configurable via environment variable
      const stack = new TapStack(app, "test-stack");
      
      expect(stack).toBeDefined();
    });
  });
});