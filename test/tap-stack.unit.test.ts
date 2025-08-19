// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  KmsModule: jest.fn((_, id, config) => ({
    kmsKey: { 
      keyId: `${id}-key-id`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${id}-key-id`
    },
    config,
  })),
  SecurityGroupModule: jest.fn((_, id, config) => ({
    securityGroup: { 
      id: `${id}-sg-id`,
      arn: `arn:aws:ec2:us-east-1:123456789012:security-group/${id}-sg-id`
    },
    config,
  })),
  S3Module: jest.fn((_, id, config) => ({
    bucket: { 
      bucket: `${id}-bucket-name`,
      arn: `arn:aws:s3:::${id}-bucket-name`
    },
    config,
  })),
  RdsModule: jest.fn((_, id, config) => ({
    dbInstance: { 
      id: `${id}-db-id`,
      endpoint: `${id}-db.cluster-xyz.us-east-1.rds.amazonaws.com:3306`,
      arn: `arn:aws:rds:us-east-1:123456789012:db:${id}-db-id`
    },
    config,
  })),
  Ec2Module: jest.fn((_, id, config) => ({
    instance: { 
      id: `${id}-instance-id`,
      privateIp: "10.0.1.10",
      arn: `arn:aws:ec2:us-east-1:123456789012:instance/${id}-instance-id`
    },
    config,
  })),
  AlbModule: jest.fn((_, id, config) => ({
    alb: { 
      id: `${id}-alb-id`,
      dnsName: `${id}-alb-123456789.us-east-1.elb.amazonaws.com`,
      zoneId: "Z35SXDOTRQ7X7K",
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${id}-alb/1234567890123456`
    },
    attachTarget: jest.fn(),
    config,
  })),
  CloudTrailModule: jest.fn((_, id, config) => ({
    cloudTrail: { 
      id: `${id}-cloudtrail-id`,
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${id}-cloudtrail`
    },
    config,
  })),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn((_, id) => ({
    accountId: "123456789012",
    arn: "arn:aws:iam::123456789012:user/test-user",
    userId: "AIDACKCEVSQ6C2EXAMPLE"
  })),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-vpc", () => ({
  DataAwsVpc: jest.fn((_, id, config) => ({
    id: config.id || "vpc-12345678",
    cidrBlock: "10.0.0.0/16",
    arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${config.id || "vpc-12345678"}`
  })),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-subnets", () => ({
  DataAwsSubnets: jest.fn((_, id, config) => {
    const isPrivate = config.filter?.some((f: any) => 
      f.name === "tag:Type" && f.values.includes("Private")
    );
    return {
      ids: isPrivate 
        ? ["subnet-private-1", "subnet-private-2"]
        : ["subnet-public-1", "subnet-public-2"]
    };
  }),
}));

// Mock TerraformOutput to prevent duplicate construct errors
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
    SecurityGroupModule, 
    S3Module, 
    RdsModule, 
    Ec2Module, 
    AlbModule, 
    CloudTrailModule 
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { DataAwsVpc } = require("@cdktf/provider-aws/lib/data-aws-vpc");
  const { DataAwsSubnets } = require("@cdktf/provider-aws/lib/data-aws-subnets");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create TapStack with default props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStack");

    expect(stack).toBeDefined();
  });

  test("should create AWS Provider with correct default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-east-1',
        defaultTags: [],
      })
    );
  });

  test("should create AWS Provider with custom props", () => {
    const app = new App();
    const customTags = {
      tags: {
        Environment: 'prod',
        Owner: 'DevOps Team',
        Project: 'SecureApp',
      },
    };

    new TapStack(app, "TestStackCustom", {
      environmentSuffix: 'prod',
      awsRegion: 'us-west-2',
      defaultTags: customTags,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2',
        defaultTags: [customTags],
      })
    );
  });

  test("should create S3Backend with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackBackend", {
      environmentSuffix: 'staging',
      stateBucket: 'custom-tf-states',
      stateBucketRegion: 'us-west-1',
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'custom-tf-states',
        key: 'staging/TestStackBackend.tfstate',
        region: 'us-west-1',
        encrypt: true,
      })
    );
  });

  test("should create all AWS data sources", () => {
    const app = new App();
    new TapStack(app, "TestStackDataSources");

    expect(DataAwsVpc).toHaveBeenCalledTimes(1);
    expect(DataAwsSubnets).toHaveBeenCalledTimes(2); // private and public subnets
  });

  test("should create KMS module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackKMS");

    expect(KmsModule).toHaveBeenCalledTimes(1);
    expect(KmsModule).toHaveBeenCalledWith(
      expect.anything(),
      "app-kms-module",
      expect.objectContaining({
        name: "app-kms-key",
        description: "KMS key for application encryption with automatic rotation",
        enableKeyRotation: true,
      })
    );
  });

  test("should create S3 modules with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackS3");

    expect(S3Module).toHaveBeenCalledTimes(2);
    
    // CloudTrail S3 bucket
    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-s3-module",
      expect.objectContaining({
        bucketName: "secure-app-cloudtrail-logs-${random_id.bucket_suffix.hex}",
        enableVersioning: true,
        kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/app-kms-module-key-id",
      })
    );

    // Application S3 bucket
    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      "app-s3-module",
      expect.objectContaining({
        bucketName: "secure-app-data-${random_id.bucket_suffix.hex}",
        enableVersioning: true,
        kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/app-kms-module-key-id",
      })
    );
  });


  test("should create RDS module with correct configuration", () => {
    const app = new App();
    
    new TapStack(app, "TestStackRDS");

    expect(RdsModule).toHaveBeenCalledTimes(1);
    expect(RdsModule).toHaveBeenCalledWith(
      expect.anything(),
      "rds-module",
      expect.objectContaining({
        identifier: "secure-app-db",
        engine: "mysql",
        engineVersion: "8.0",
        instanceClass: "db.t3.micro",
        allocatedStorage: 20,
        dbName: "secureappdb",
        username: "admin",
        storageEncrypted: true,
        backupRetentionPeriod: 7,
      }),
      ["subnet-private-1", "subnet-private-2"]
    );
  });

  test("should create EC2 modules for private subnets", () => {
    const app = new App();
    new TapStack(app, "TestStackEC2");

    expect(Ec2Module).toHaveBeenCalledTimes(2);
    
    expect(Ec2Module).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-module-0",
      expect.objectContaining({
        name: "secure-app-instance-1",
        instanceType: "t3.micro",
        subnetId: "subnet-private-1",
        keyName: "my-key-pair",
      })
    );

    expect(Ec2Module).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-module-1",
      expect.objectContaining({
        name: "secure-app-instance-2",
        instanceType: "t3.micro",
        subnetId: "subnet-private-2",
        keyName: "my-key-pair",
      })
    );
  });


  test("should attach EC2 instances to ALB target group", () => {
    const app = new App();
    new TapStack(app, "TestStackALBTargets");

    const albModuleInstance = AlbModule.mock.results[0].value;
    expect(albModuleInstance.attachTarget).toHaveBeenCalledTimes(2);
    expect(albModuleInstance.attachTarget).toHaveBeenCalledWith("ec2-module-0-instance-id", 80);
    expect(albModuleInstance.attachTarget).toHaveBeenCalledWith("ec2-module-1-instance-id", 80);
  });

  test("should create CloudTrail module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackCloudTrail");

    expect(CloudTrailModule).toHaveBeenCalledTimes(1);
    expect(CloudTrailModule).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-module",
      expect.objectContaining({
        name: "secure-app-cloudtrail",
        s3BucketName: "cloudtrail-s3-module-bucket-name",
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
      })
    );
  });

  test("should handle custom environment suffix and state bucket", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomConfig", {
      environmentSuffix: 'staging',
      stateBucket: 'custom-tf-states',
      stateBucketRegion: 'us-west-1',
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'custom-tf-states',
        key: 'staging/TestStackCustomConfig.tfstate',
        region: 'us-west-1',
      })
    );
  });

  test("should create stack with all components integrated", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackIntegration");

    // Verify all main components are created
    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(DataAwsVpc).toHaveBeenCalledTimes(1);
    expect(DataAwsSubnets).toHaveBeenCalledTimes(2);
    expect(KmsModule).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledTimes(2);
    expect(SecurityGroupModule).toHaveBeenCalledTimes(3);
    expect(RdsModule).toHaveBeenCalledTimes(1);
    expect(Ec2Module).toHaveBeenCalledTimes(2);
    expect(AlbModule).toHaveBeenCalledTimes(1);
    expect(CloudTrailModule).toHaveBeenCalledTimes(1);
    expect(TerraformOutput).toHaveBeenCalledTimes(13);
    
    // Verify the stack is properly constructed
    expect(stack).toBeDefined();
  });

  test("should use correct VPC ID in data source lookup", () => {
    const app = new App();
    new TapStack(app, "TestStackVPC");

    expect(DataAwsVpc).toHaveBeenCalledWith(
      expect.anything(),
      "secure-app-vpc",
      expect.objectContaining({
        id: "vpc-048096a18345d83ac"
      })
    );
  });

  test("should filter subnets correctly", () => {
    const app = new App();
    new TapStack(app, "TestStackSubnets");

    // Check private subnets filter
    expect(DataAwsSubnets).toHaveBeenCalledWith(
      expect.anything(),
      "private-subnets",
      expect.objectContaining({
        filter: expect.arrayContaining([
          expect.objectContaining({
            name: "tag:Type",
            values: ["Private"]
          })
        ])
      })
    );

    // Check public subnets filter
    expect(DataAwsSubnets).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnets",
      expect.objectContaining({
        filter: expect.arrayContaining([
          expect.objectContaining({
            name: "tag:Type",
            values: ["Public"]
          })
        ])
      })
    );
  });
});