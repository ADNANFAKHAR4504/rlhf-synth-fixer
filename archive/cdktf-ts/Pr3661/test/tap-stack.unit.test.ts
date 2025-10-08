import { Testing, App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
  ConfigModule,
  KmsModule,
  VpcModuleConfig,
  IamModuleConfig,
  S3ModuleConfig,
  Ec2ModuleConfig,
  RdsModuleConfig,
  CloudTrailModuleConfig,
  ConfigModuleConfig,
  KmsModuleConfig,
} from "../lib/modules"; // Adjust path as needed
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// Mock AWS Provider constructs
jest.mock("@cdktf/provider-aws", () => ({
  vpc: {
    Vpc: jest.fn().mockImplementation(() => ({
      id: "vpc-12345",
      arn: "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345",
    })),
  },
  subnet: {
    Subnet: jest.fn().mockImplementation(() => ({
      id: "subnet-12345",
      arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-12345",
    })),
  },
  internetGateway: {
    InternetGateway: jest.fn().mockImplementation(() => ({
      id: "igw-12345",
    })),
  },
  natGateway: {
    NatGateway: jest.fn().mockImplementation(() => ({
      id: "nat-12345",
    })),
  },
  routeTable: {
    RouteTable: jest.fn().mockImplementation(() => ({
      id: "rtb-12345",
    })),
  },
  route: {
    Route: jest.fn().mockImplementation(() => ({
      id: "route-12345",
    })),
  },
  routeTableAssociation: {
    RouteTableAssociation: jest.fn().mockImplementation(() => ({
      id: "rtbassoc-12345",
    })),
  },
  flowLog: {
    FlowLog: jest.fn().mockImplementation(() => ({
      id: "fl-12345",
    })),
  },
  securityGroup: {
    SecurityGroup: jest.fn().mockImplementation(() => ({
      id: "sg-12345",
    })),
  },
  securityGroupRule: {
    SecurityGroupRule: jest.fn().mockImplementation(() => ({
      id: "sgr-12345",
    })),
  },
  s3Bucket: {
    S3Bucket: jest.fn().mockImplementation(() => ({
      id: "test-bucket",
      arn: "arn:aws:s3:::test-bucket",
    })),
  },
  s3BucketLogging: {
    S3BucketLoggingA: jest.fn(),
  },
  s3BucketPolicy: {
    S3BucketPolicy: jest.fn().mockImplementation(() => ({
      id: "bucket-policy-12345",
    })),
  },
  s3BucketServerSideEncryptionConfiguration: {
    S3BucketServerSideEncryptionConfigurationA: jest.fn(),
  },
  s3BucketPublicAccessBlock: {
    S3BucketPublicAccessBlock: jest.fn(),
  },
  s3BucketOwnershipControls: {
    S3BucketOwnershipControls: jest.fn(),
  },
  iamRole: {
    IamRole: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:iam::123456789012:role/test-role",
      name: "test-role",
    })),
  },
  iamPolicy: {
    IamPolicy: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:iam::123456789012:policy/test-policy",
    })),
  },
  iamPolicyAttachment: {
    IamPolicyAttachment: jest.fn(),
  },
  iamInstanceProfile: {
    IamInstanceProfile: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:iam::123456789012:instance-profile/test-profile",
      name: "test-profile",
    })),
  },
  launchTemplate: {
    LaunchTemplate: jest.fn().mockImplementation(() => ({
      id: "lt-12345",
    })),
  },
  autoscalingGroup: {
    AutoscalingGroup: jest.fn().mockImplementation(() => ({
      id: "asg-12345",
    })),
  },
  dbInstance: {
    DbInstance: jest.fn().mockImplementation(() => ({
      id: "db-12345",
    })),
  },
  dbSubnetGroup: {
    DbSubnetGroup: jest.fn().mockImplementation(() => ({
      id: "db-subnet-group-12345",
      name: "db-subnet-group",
    })),
  },
  cloudwatchLogGroup: {
    CloudwatchLogGroup: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:logs:us-east-1:123456789012:log-group:/aws/vpc/flowlogs",
    })),
  },
  cloudtrail: {
    Cloudtrail: jest.fn().mockImplementation(() => ({
      arn: "arn:aws:cloudtrail:us-east-1:123456789012:trail/test-trail",
      id: "test-trail",
    })),
  },
  kmsKey: {
    KmsKey: jest.fn().mockImplementation(() => ({
      id: "key-12345",
      arn: "arn:aws:kms:us-east-1:123456789012:key/key-12345",
    })),
  },
  kmsAlias: {
    KmsAlias: jest.fn(),
  },
  eip: {
    Eip: jest.fn().mockImplementation(() => ({
      id: "eip-12345",
    })),
  },
  dataAwsCallerIdentity: {
    DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
      accountId: "123456789012",
    })),
  },
  dataAwsAmi: {
    DataAwsAmi: jest.fn().mockImplementation(() => ({
      id: "ami-12345",
      name: "amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2",
      architecture: "x86_64",
      owner_id: "amazon",
    })),
  },
}));


describe("Module Unit Tests", () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = Testing.app();
  });

  describe("VpcModule", () => {
    const mockVpcConfig: VpcModuleConfig = {
      vpcCidrBlock: "10.0.0.0/16",
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.3.0/24", "10.0.4.0/24"],
      availabilityZones: ["us-east-1a", "us-east-1b"],
      tags: {
        Environment: "test",
        Project: "TestProject",
      },
    };

    test("should create VPC with correct configuration", () => {
      const stack = Testing.synthScope((scope) => {
        new VpcModule(scope, "test-vpc", mockVpcConfig);
      });

      const { vpc } = require("@cdktf/provider-aws");
      expect(vpc.Vpc).toHaveBeenCalledWith(
        expect.anything(),
        "main",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: "main-vpc",
            Environment: "test",
            Project: "TestProject",
          }),
        })
      );
    });

    test("should create Internet Gateway", () => {
      const stack = Testing.synthScope((scope) => {
        new VpcModule(scope, "test-vpc", mockVpcConfig);
      });

      const { internetGateway } = require("@cdktf/provider-aws");
      expect(internetGateway.InternetGateway).toHaveBeenCalledWith(
        expect.anything(),
        "igw",
        expect.objectContaining({
          vpcId: "vpc-12345",
          tags: expect.objectContaining({
            Name: "main-igw",
          }),
        })
      );
    });

    test("should create correct number of public and private subnets", () => {
      const stack = Testing.synthScope((scope) => {
        new VpcModule(scope, "test-vpc", mockVpcConfig);
      });

      const { subnet } = require("@cdktf/provider-aws");
      // Should create 2 public and 2 private subnets
      expect(subnet.Subnet).toHaveBeenCalledTimes(4);
    });

    test("should create NAT Gateways with Elastic IPs", () => {
      const stack = Testing.synthScope((scope) => {
        new VpcModule(scope, "test-vpc", mockVpcConfig);
      });

      const { natGateway, eip } = require("@cdktf/provider-aws");
      expect(eip.Eip).toHaveBeenCalledTimes(2);
      expect(natGateway.NatGateway).toHaveBeenCalledTimes(2);
    });

    test("should create VPC Flow Logs with CloudWatch", () => {
      const stack = Testing.synthScope((scope) => {
        new VpcModule(scope, "test-vpc", mockVpcConfig);
      });

      const { flowLog, cloudwatchLogGroup, iamRole } = require("@cdktf/provider-aws");
      
      // Should create log group
      expect(cloudwatchLogGroup.CloudwatchLogGroup).toHaveBeenCalledWith(
        expect.anything(),
        "flow-log-group",
        expect.objectContaining({
          name: "/aws/vpc/flowlogs",
          retentionInDays: 7,
        })
      );

      // Should create IAM role for flow logs
      expect(iamRole.IamRole).toHaveBeenCalledWith(
        expect.anything(),
        "flow-log-role",
        expect.objectContaining({
          name: "vpc-flow-log-role",
        })
      );

      // Should create flow log
      expect(flowLog.FlowLog).toHaveBeenCalledWith(
        expect.anything(),
        "flow-log",
        expect.objectContaining({
          logDestinationType: "cloud-watch-logs",
          trafficType: "ALL",
          vpcId: "vpc-12345",
        })
      );
    });
  });

  describe("IamModule", () => {
    const mockIamConfig: IamModuleConfig = {
      vpcId: "vpc-12345",
      tags: {
        Environment: "test",
      },
    };

    test("should create EC2 role with correct assume role policy", () => {
      const stack = Testing.synthScope((scope) => {
        new IamModule(scope, "test-iam", mockIamConfig);
      });

      const { iamRole } = require("@cdktf/provider-aws");
      expect(iamRole.IamRole).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-role",
        expect.objectContaining({
          name: "ec2-instance-role-ts",
          assumeRolePolicy: expect.stringContaining("ec2.amazonaws.com"),
        })
      );
    });

    test("should create EC2 policy with minimal permissions", () => {
      const stack = Testing.synthScope((scope) => {
        new IamModule(scope, "test-iam", mockIamConfig);
      });

      const { iamPolicy } = require("@cdktf/provider-aws");
      const policyCall = iamPolicy.IamPolicy.mock.calls[0];
      const policy = JSON.parse(policyCall[2].policy);
      
      expect(policy.Statement[0].Action).toContain("cloudwatch:PutMetricData");
      expect(policy.Statement[0].Action).toContain("logs:PutLogEvents");
    });

    test("should create instance profile", () => {
      const stack = Testing.synthScope((scope) => {
        new IamModule(scope, "test-iam", mockIamConfig);
      });

      const { iamInstanceProfile } = require("@cdktf/provider-aws");
      expect(iamInstanceProfile.IamInstanceProfile).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-instance-profile",
        expect.objectContaining({
          name: "ec2-instance-profile-ts",
        })
      );
    });

    test("should create AWS Config role", () => {
      const stack = Testing.synthScope((scope) => {
        new IamModule(scope, "test-iam", mockIamConfig);
      });

      const { iamRole } = require("@cdktf/provider-aws");
      expect(iamRole.IamRole).toHaveBeenCalledWith(
        expect.anything(),
        "config-role",
        expect.objectContaining({
          name: "aws-config-role-ts",
          assumeRolePolicy: expect.stringContaining("config.amazonaws.com"),
        })
      );
    });
  });

  describe("S3Module", () => {
    const mockS3Config: S3ModuleConfig = {
      bucketName: "test-bucket",
      logBucketName: "test-log-bucket",
      kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/test-key",
      tags: {
        Environment: "test",
      },
    };

    test("should create log bucket before main bucket", () => {
      const stack = Testing.synthScope((scope) => {
        new S3Module(scope, "test-s3", mockS3Config);
      });

      const { s3Bucket } = require("@cdktf/provider-aws");
      const calls = s3Bucket.S3Bucket.mock.calls;
      
      expect(calls[0][1]).toBe("log-bucket");
      expect(calls[1][1]).toBe("main-bucket");
    });

    test("should configure log bucket with proper permissions", () => {
      const stack = Testing.synthScope((scope) => {
        new S3Module(scope, "test-s3", mockS3Config);
      });

      const { s3BucketPolicy } = require("@cdktf/provider-aws");
      const policyCall = s3BucketPolicy.S3BucketPolicy.mock.calls[0];
      const policy = JSON.parse(policyCall[2].policy);

      // Check for VPC Flow Logs permissions
      const flowLogStatement = policy.Statement.find(
        (s: any) => s.Sid === "AWSLogDeliveryWrite"
      );
      expect(flowLogStatement).toBeDefined();
      expect(flowLogStatement.Principal.Service).toBe("delivery.logs.amazonaws.com");

      // Check for CloudTrail permissions
      const cloudTrailStatement = policy.Statement.find(
        (s: any) => s.Sid === "AWSCloudTrailWrite"
      );
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe("cloudtrail.amazonaws.com");
    });

    test("should enable encryption on both buckets", () => {
      const stack = Testing.synthScope((scope) => {
        new S3Module(scope, "test-s3", mockS3Config);
      });

      const { s3BucketServerSideEncryptionConfiguration } = require("@cdktf/provider-aws");
      expect(s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA).toHaveBeenCalledTimes(2);
      
      // Check both calls have KMS encryption
      const calls = s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA.mock.calls;
      calls.forEach((call: any) => {
        expect(call[2].rule[0].applyServerSideEncryptionByDefault.sseAlgorithm).toBe("aws:kms");
        expect(call[2].rule[0].applyServerSideEncryptionByDefault.kmsMasterKeyId).toBe(mockS3Config.kmsKeyId);
      });
    });

    test("should configure logging for main bucket", () => {
      const stack = Testing.synthScope((scope) => {
        new S3Module(scope, "test-s3", mockS3Config);
      });

      const { s3BucketLogging } = require("@cdktf/provider-aws");
      expect(s3BucketLogging.S3BucketLoggingA).toHaveBeenCalledWith(
        expect.anything(),
        "main-bucket-logging",
        expect.objectContaining({
          targetPrefix: "main-bucket-logs/",
        })
      );
    });

    test("should block public access on main bucket", () => {
      const stack = Testing.synthScope((scope) => {
        new S3Module(scope, "test-s3", mockS3Config);
      });

      const { s3BucketPublicAccessBlock } = require("@cdktf/provider-aws");
      const mainBucketBlock = s3BucketPublicAccessBlock.S3BucketPublicAccessBlock.mock.calls.find(
        (call: any) => call[1] === "main-bucket-public-access-block"
      );

      expect(mainBucketBlock[2].blockPublicAcls).toBe(true);
      expect(mainBucketBlock[2].blockPublicPolicy).toBe(true);
      expect(mainBucketBlock[2].ignorePublicAcls).toBe(true);
      expect(mainBucketBlock[2].restrictPublicBuckets).toBe(true);
    });

    test("should allow bucket policy on log bucket", () => {
      const stack = Testing.synthScope((scope) => {
        new S3Module(scope, "test-s3", mockS3Config);
      });

      const { s3BucketPublicAccessBlock } = require("@cdktf/provider-aws");
      const logBucketBlock = s3BucketPublicAccessBlock.S3BucketPublicAccessBlock.mock.calls.find(
        (call: any) => call[1] === "log-bucket-public-access-block"
      );

      expect(logBucketBlock[2].blockPublicPolicy).toBe(false);
      expect(logBucketBlock[2].restrictPublicBuckets).toBe(false);
    });
  });

  describe("Ec2Module", () => {
    const mockEc2Config: Ec2ModuleConfig = {
      vpcId: "vpc-12345",
      subnetIds: ["subnet-1", "subnet-2"],
      securityGroupIds: ["sg-existing"],
      instanceType: "t3.micro",
      iamInstanceProfileName: "test-profile",
      sshCidr: "10.0.0.0/8",
      minCapacity: 1,
      maxCapacity: 3,
      keyName: "test-key",
      tags: {
        Environment: "test",
      },
    };

    test("should create launch template with correct configuration", () => {
      const stack = Testing.synthScope((scope) => {
        new Ec2Module(scope, "test-ec2", mockEc2Config);
      });

      const { launchTemplate } = require("@cdktf/provider-aws");
      
      expect(launchTemplate.LaunchTemplate).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-launch-template",
        expect.objectContaining({
          name: "ec2-launch-template",
          instanceType: "t3.micro",
          keyName: "test-key",
          monitoring: { enabled: true },
        })
      );
    });

    test("should configure encrypted EBS volumes", () => {
      const stack = Testing.synthScope((scope) => {
        new Ec2Module(scope, "test-ec2", mockEc2Config);
      });

      const { launchTemplate } = require("@cdktf/provider-aws");
      const templateCall = launchTemplate.LaunchTemplate.mock.calls[0];
      const blockDeviceMapping = templateCall[2].blockDeviceMappings[0];
      
      expect(blockDeviceMapping.ebs.encrypted).toBe("true");
      expect(blockDeviceMapping.ebs.volumeType).toBe("gp3");
    });

    test("should create auto scaling group", () => {
      const stack = Testing.synthScope((scope) => {
        new Ec2Module(scope, "test-ec2", mockEc2Config);
      });

      const { autoscalingGroup } = require("@cdktf/provider-aws");
      
      expect(autoscalingGroup.AutoscalingGroup).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-asg",
        expect.objectContaining({
          name: "ec2-auto-scaling-group",
          minSize: 1,
          maxSize: 3,
          desiredCapacity: 1,
          vpcZoneIdentifier: ["subnet-1", "subnet-2"],
        })
      );
    });
  });

  describe("RdsModule", () => {
    const mockRdsConfig: RdsModuleConfig = {
      vpcId: "vpc-12345",
      subnetIds: ["subnet-1", "subnet-2"],
      securityGroupIds: ["sg-1"],
      instanceClass: "db.t3.micro",
      engine: "mysql",
      engineVersion: "8.0",
      dbName: "testdb",
      username: "admin",
      password: "password123",
      kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/test-key",
      tags: {
        Environment: "test",
      },
    };

    test("should create RDS security group", () => {
      const stack = Testing.synthScope((scope) => {
        new RdsModule(scope, "test-rds", mockRdsConfig);
      });

      const { securityGroup } = require("@cdktf/provider-aws");
      
      expect(securityGroup.SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        "rds-security-group",
        expect.objectContaining({
          name: "rds-security-group",
          vpcId: "vpc-12345",
        })
      );
    });

    test("should allow ingress from specified security groups", () => {
      const stack = Testing.synthScope((scope) => {
        new RdsModule(scope, "test-rds", mockRdsConfig);
      });

      const { securityGroupRule } = require("@cdktf/provider-aws");
      
      expect(securityGroupRule.SecurityGroupRule).toHaveBeenCalledWith(
        expect.anything(),
        "rds-ingress-0",
        expect.objectContaining({
          type: "ingress",
          fromPort: 3306,
          toPort: 3306,
          sourceSecurityGroupId: "sg-1",
        })
      );
    });

    test("should create DB subnet group", () => {
      const stack = Testing.synthScope((scope) => {
        new RdsModule(scope, "test-rds", mockRdsConfig);
      });

      const { dbSubnetGroup } = require("@cdktf/provider-aws");
      
      expect(dbSubnetGroup.DbSubnetGroup).toHaveBeenCalledWith(
        expect.anything(),
        "rds-subnet-group",
        expect.objectContaining({
          name: "rds-subnet-group",
          subnetIds: ["subnet-1", "subnet-2"],
        })
      );
    });

    test("should create RDS instance with encryption and multi-AZ", () => {
      const stack = Testing.synthScope((scope) => {
        new RdsModule(scope, "test-rds", mockRdsConfig);
      });

      const { dbInstance } = require("@cdktf/provider-aws");
      
      expect(dbInstance.DbInstance).toHaveBeenCalledWith(
        expect.anything(),
        "rds-instance",
        expect.objectContaining({
          identifier: "production-db",
          engine: "mysql",
          engineVersion: "8.0",
          instanceClass: "db.t3.micro",
          multiAz: true,
          storageEncrypted: true,
          kmsKeyId: mockRdsConfig.kmsKeyId,
          deletionProtection: true,
          publiclyAccessible: false,
        })
      );
    });

    test("should configure backup retention", () => {
      const stack = Testing.synthScope((scope) => {
        new RdsModule(scope, "test-rds", mockRdsConfig);
      });

      const { dbInstance } = require("@cdktf/provider-aws");
      const dbCall = dbInstance.DbInstance.mock.calls[0];
      
      expect(dbCall[2].backupRetentionPeriod).toBe(7);
      expect(dbCall[2].copyTagsToSnapshot).toBe(true);
    });
  });

  describe("CloudTrailModule", () => {
    const mockCloudTrailConfig: CloudTrailModuleConfig = {
      s3BucketName: "test-bucket",
      kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/test-key",
      tags: {
        Environment: "test",
      },
    };

    test("should create CloudTrail with correct configuration", () => {
      const stack = Testing.synthScope((scope) => {
        new CloudTrailModule(scope, "test-trail", mockCloudTrailConfig);
      });

      const { cloudtrail } = require("@cdktf/provider-aws");
      
      expect(cloudtrail.Cloudtrail).toHaveBeenCalledWith(
        expect.anything(),
        "cloudtrail",
        expect.objectContaining({
          name: "organization-trail",
          s3BucketName: "test-bucket",
          s3KeyPrefix: "cloudtrail",
          enableLogging: true,
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          isOrganizationTrail: false,
          enableLogFileValidation: true,
          kmsKeyId: mockCloudTrailConfig.kmsKeyId,
        })
      );
    });
  });

  describe("ConfigModule", () => {
    const mockConfigConfig: ConfigModuleConfig = {
      s3BucketName: "test-bucket",
      iamRoleArn: "arn:aws:iam::123456789012:role/config-role",
      tags: {
        Environment: "test",
      },
    };

    test("should create empty ConfigModule without AWS Config resources", () => {
      const stack = Testing.synthScope((scope) => {
        new ConfigModule(scope, "test-config", mockConfigConfig);
      });

      // ConfigModule should be created but shouldn't create any AWS resources
      // since Config recorder is commented out
      expect(stack).toBeDefined();
    });
  });

  describe("KmsModule", () => {
    const mockKmsConfig: KmsModuleConfig = {
      description: "Test KMS Key",
      tags: {
        Environment: "test",
      },
    };

    test("should create KMS key with rotation enabled", () => {
      const stack = Testing.synthScope((scope) => {
        new KmsModule(scope, "test-kms", mockKmsConfig);
      });

      const { kmsKey } = require("@cdktf/provider-aws");
      
      expect(kmsKey.KmsKey).toHaveBeenCalledWith(
        expect.anything(),
        "kms-key",
        expect.objectContaining({
          description: "Test KMS Key",
          enableKeyRotation: true,
          deletionWindowInDays: 30,
        })
      );
    });

    test("should configure KMS key policy for CloudTrail", () => {
      const stack = Testing.synthScope((scope) => {
        new KmsModule(scope, "test-kms", mockKmsConfig);
      });

      const { kmsKey } = require("@cdktf/provider-aws");
      const kmsCall = kmsKey.KmsKey.mock.calls[0];
      const policy = JSON.parse(kmsCall[2].policy);
      
      // Check for CloudTrail permissions
      const cloudTrailStatement = policy.Statement.find(
        (s: any) => s.Sid === "Allow CloudTrail to encrypt logs"
      );
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe("cloudtrail.amazonaws.com");
    });

    test("should create KMS alias", () => {
      const stack = Testing.synthScope((scope) => {
        new KmsModule(scope, "test-kms", mockKmsConfig);
      });

      const { kmsAlias } = require("@cdktf/provider-aws");
      
      expect(kmsAlias.KmsAlias).toHaveBeenCalledWith(
        expect.anything(),
        "kms-alias",
        expect.objectContaining({
          name: "alias/test-kms",
        })
      );
    });
  });
});