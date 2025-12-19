import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  KmsModule: jest.fn().mockImplementation((scope, id, props) => ({
    keyId: `kms-key-${id}-12345`,
    keyArn: `arn:aws:kms:us-east-1:123456789012:key/kms-key-${id}-12345`
  })),
  VpcModule: jest.fn().mockImplementation((scope, id, props) => ({
    vpcId: `vpc-${id}-12345`,
    publicSubnetIds: ["subnet-public-1", "subnet-public-2"],
    privateSubnetIds: ["subnet-private-1", "subnet-private-2"]
  })),
  IamRoleModule: jest.fn().mockImplementation((scope, id, props) => ({
    roleArn: `arn:aws:iam::123456789012:role/${props.roleName}`,
    roleName: props.roleName
  })),
  S3BucketModule: jest.fn().mockImplementation((scope, id, props) => ({
    bucketName: props.bucketName,
    bucketArn: `arn:aws:s3:::${props.bucketName}`
  })),
  CloudTrailModule: jest.fn().mockImplementation((scope, id, props) => ({
    trailArn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${props.trailName}`,
    trailName: props.trailName
  })),
  AwsConfigModule: jest.fn().mockImplementation((scope, id, props) => ({
    recorderName: `config-recorder-${id}`
  })),
  SecurityGroupsModule: jest.fn().mockImplementation((scope, id, props) => ({
    webSgId: `sg-web-${id}-12345`,
    appSgId: `sg-app-${id}-12345`,
    dbSgId: `sg-db-${id}-12345`
  }))
}));

// Mock CDKTF constructs to avoid duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    KmsModule,
    VpcModule,
    IamRoleModule,
    S3BucketModule,
    CloudTrailModule,
    AwsConfigModule,
    SecurityGroupsModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  // Mock addOverride method
  const mockAddOverride = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the addOverride method on TerraformStack
    jest.spyOn(TapStack.prototype, 'addOverride').mockImplementation(mockAddOverride);
    
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("AWS Provider Configuration", () => {
    test("should create AWS provider with correct default configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackProvider");

      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: []
        })
      );
    });

    test("should use custom AWS region when provided in props", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", { awsRegion: "us-west-2" });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-west-2",
        })
      );
    });

    test("should use custom default tags when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Project: "CustomProject",
          Environment: "Production"
        }
      };
      
      new TapStack(app, "TestStackCustomTags", { 
        defaultTags: customTags 
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should create S3 backend with correct default configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackBackend");

      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/TestStackBackend.tfstate",
          region: "us-east-1",
          encrypt: true,
        })
      );
    });

    test("should create S3 backend with custom configuration", () => {
      const app = new App();
      const customProps = {
        environmentSuffix: "prod",
        stateBucket: "custom-tf-states",
        stateBucketRegion: "eu-west-1",
      };

      new TapStack(app, "TestStackCustomBackend", customProps);

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "custom-tf-states",
          key: "prod/TestStackCustomBackend.tfstate",
          region: "eu-west-1",
          encrypt: true,
        })
      );
    });

    test("should add S3 backend override for state locking", () => {
      const app = new App();
      new TapStack(app, "TestStackOverride");

      expect(mockAddOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });

    test("should ensure S3 backend encryption is enabled", () => {
      const app = new App();
      new TapStack(app, "TestStackEncryption");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          encrypt: true,
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create all modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStackModules");

      // Verify all modules are created with correct call counts
      expect(KmsModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(IamRoleModule).toHaveBeenCalledTimes(1);
      expect(S3BucketModule).toHaveBeenCalledTimes(2); // log bucket and secure bucket
      expect(CloudTrailModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
    });

    test("should create KMS module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackKms");

      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        "kms",
        expect.objectContaining({
          keyName: "tap-encryption-key",
          description: "KMS key for TAP secure environment",
          enableKeyRotation: true,
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });

    test("should create VPC module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackVpc");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
          privateSubnetCidrs: ["10.0.3.0/24", "10.0.4.0/24"],
          availabilityZones: ["us-east-2a", "us-east-2b"],
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });

    test("should create IAM Role module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackIam");

      const kmsInstance = KmsModule.mock.results[0].value;

      expect(IamRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        "s3-access-role",
        expect.objectContaining({
          roleName: "tap-s3-access-role",
          assumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "ec2.amazonaws.com",
                },
                Action: "sts:AssumeRole",
              },
            ],
          },
          inlinePolicies: {
            's3-access': {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                  Resource: [
                    'arn:aws:s3:::tap-secure-bucket',
                    'arn:aws:s3:::tap-secure-bucket/*',
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: kmsInstance.keyArn,
                },
              ],
            },
          },
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });

    test("should create S3 log bucket with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Log");

      const kmsInstance = KmsModule.mock.results[0].value;

      expect(S3BucketModule).toHaveBeenNthCalledWith(1,
        expect.anything(),
        "log-bucket",
        expect.objectContaining({
          bucketName: "tap-logs-bucket",
          allowCloudTrailAccess: true,
          kmsKeyId: kmsInstance.keyId,
          cloudTrailPrefix: "cloudtrail-logs/",
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });

    test("should create S3 secure bucket with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Secure");

      const kmsInstance = KmsModule.mock.results[0].value;
      const iamInstance = IamRoleModule.mock.results[0].value;
      const logBucketInstance = S3BucketModule.mock.results[0].value;

      expect(S3BucketModule).toHaveBeenNthCalledWith(2,
        expect.anything(),
        "secure-bucket",
        expect.objectContaining({
          bucketName: "tap-secure-bucket",
          kmsKeyId: kmsInstance.keyId,
          accessRoleArn: iamInstance.roleArn,
          loggingBucket: logBucketInstance.bucketName,
          loggingPrefix: "secure-bucket-logs/",
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });

    test("should create CloudTrail module with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackCloudTrail");

      const kmsInstance = KmsModule.mock.results[0].value;
      const logBucketInstance = S3BucketModule.mock.results[0].value;

      expect(CloudTrailModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudtrail",
        expect.objectContaining({
          trailName: "tap-cloudtrail",
          s3BucketName: logBucketInstance.bucketName,
          s3KeyPrefix: "cloudtrail-logs/",
          kmsKeyId: kmsInstance.keyArn,
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });

    test("should create Security Groups module with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackSecurityGroups");

      const vpcInstance = VpcModule.mock.results[0].value;

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-groups",
        expect.objectContaining({
          vpcId: vpcInstance.vpcId,
          allowedHttpCidrs: ['10.0.0.0/8'],
          allowedSshCidrs: ['10.0.0.0/8'],
          tags: {
            Environment: "SecureApp",
            CreatedBy: "CDKTF",
            Project: "TAP",
          }
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required Terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Should create 9 outputs based on the actual code (not counting commented out config output)
      expect(TerraformOutput).toHaveBeenCalledTimes(9);
    });

    test("should create VPC outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackVpcOutput");

      const vpcInstance = VpcModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "vpc_id",
        expect.objectContaining({
          value: vpcInstance.vpcId,
          description: "VPC ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "public_subnet_ids",
        expect.objectContaining({
          value: vpcInstance.publicSubnetIds,
          description: "Public Subnet IDs",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "private_subnet_ids",
        expect.objectContaining({
          value: vpcInstance.privateSubnetIds,
          description: "Private Subnet IDs",
        })
      );
    });

    test("should create KMS output", () => {
      const app = new App();
      new TapStack(app, "TestStackKmsOutput");

      const kmsInstance = KmsModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "kms_key_arn",
        expect.objectContaining({
          value: kmsInstance.keyArn,
          description: "KMS Key ARN",
        })
      );
    });

    test("should create S3 bucket outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Output");

      const [logBucketInstance, secureBucketInstance] = S3BucketModule.mock.results.map((r: jest.MockResult<any>) => r.value);

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "secure_bucket_name",
        expect.objectContaining({
          value: secureBucketInstance.bucketName,
          description: "Secure S3 Bucket Name",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "log_bucket_name",
        expect.objectContaining({
          value: logBucketInstance.bucketName,
          description: "Log S3 Bucket Name",
        })
      );
    });

    test("should create IAM role output", () => {
      const app = new App();
      new TapStack(app, "TestStackIamOutput");

      const iamInstance = IamRoleModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "s3_access_role_arn",
        expect.objectContaining({
          value: iamInstance.roleArn,
          description: "IAM Role ARN for S3 Access",
        })
      );
    });

    test("should create CloudTrail output", () => {
      const app = new App();
      new TapStack(app, "TestStackCloudTrailOutput");

      const cloudTrailInstance = CloudTrailModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "cloudtrail_arn",
        expect.objectContaining({
          value: cloudTrailInstance.trailArn,
          description: "CloudTrail ARN",
        })
      );
    });

    test("should create Security Group output", () => {
      const app = new App();
      new TapStack(app, "TestStackSecurityGroupOutput");

      const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "web_security_group_id",
        expect.objectContaining({
          value: securityGroupsInstance.webSgId,
          description: "Web Security Group ID",
        })
      );
    });
  });

  describe("Props Handling", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      
      expect(() => {
        new TapStack(app, "TestStackUndefinedProps", undefined);
      }).not.toThrow();

      // Should use all default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/TestStackUndefinedProps.tfstate",
          region: "us-east-1",
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyProps", {});

      // Should use all default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/TestStackEmptyProps.tfstate",
          region: "us-east-1",
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
        })
      );
    });

    test("should use different regions for state bucket and AWS provider", () => {
      const app = new App();
      new TapStack(app, "TestStackDifferentRegions", { 
        stateBucketRegion: "eu-central-1",
        awsRegion: "us-west-2"
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: "eu-central-1",
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-west-2",
        })
      );
    });
  });

  describe("Module Construction with Correct IDs", () => {
    test("should create modules with correct construct IDs", () => {
      const app = new App();
      new TapStack(app, "TestStackConstructIds");

      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        "kms",
        expect.anything()
      );

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.anything()
      );

      expect(IamRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        "s3-access-role",
        expect.anything()
      );

      expect(S3BucketModule).toHaveBeenNthCalledWith(1,
        expect.anything(),
        "log-bucket",
        expect.anything()
      );

      expect(S3BucketModule).toHaveBeenNthCalledWith(2,
        expect.anything(),
        "secure-bucket",
        expect.anything()
      );

      expect(CloudTrailModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudtrail",
        expect.anything()
      );

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-groups",
        expect.anything()
      );
    });
  });

  describe("Constants and Tags", () => {
    test("should use correct hardcoded tags", () => {
      const app = new App();
      new TapStack(app, "TestStackTags");

      const expectedTags = {
        Environment: "SecureApp",
        CreatedBy: "CDKTF",
        Project: "TAP",
      };

      // Verify tags are passed to all modules
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(IamRoleModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });

    test("should use correct availability zones for VPC", () => {
      const app = new App();
      new TapStack(app, "TestStackAZs");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          availabilityZones: ["us-east-2a", "us-east-2b"],
        })
      );
    });
  });

  describe("AWS Config Module (Commented Out)", () => {
    test("should not create AWS Config module when commented out", () => {
      const app = new App();
      new TapStack(app, "TestStackNoConfig");

      expect(AwsConfigModule).not.toHaveBeenCalled();
    });
  });
});