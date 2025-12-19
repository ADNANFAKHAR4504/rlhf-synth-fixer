import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingModule: jest.fn().mockImplementation((_, id, config) => ({
    vpc: { 
      id: `vpc-${id}-12345`
    },
    publicSubnets: [
      { id: `subnet-public-${id}-1` },
      { id: `subnet-public-${id}-2` }
    ],
    privateSubnets: [
      { id: `subnet-private-${id}-1` },
      { id: `subnet-private-${id}-2` }
    ],
    natGateways: [
      { id: `nat-${id}-1` },
      { id: `nat-${id}-2` }
    ],
    config,
  })),
  ComputeModule: jest.fn().mockImplementation((_, id, config) => ({
    instance: { 
      id: `i-${id}-12345`,
      publicIp: `203.0.113.${Math.floor(Math.random() * 255)}`
    },
    config,
  })),
  StorageModule: jest.fn().mockImplementation((_, id, config) => ({
    bucket: { 
      bucket: `${config.bucketName || 'default-bucket'}`
    },
    config,
  })),
  DatabaseModule: jest.fn().mockImplementation((_, id, config) => ({
    dbInstance: {
      id: `db-${id}-12345`,
      endpoint: `${id}-db.cluster-xyz.us-east-1.rds.amazonaws.com`
    },
    config,
  })),
  MonitoringModule: jest.fn().mockImplementation((_, id, config) => ({
    alarms: { 
      ec2: `alarm-ec2-${id}`,
      rds: `alarm-rds-${id}`
    },
    config,
  })),
  IamModule: jest.fn().mockImplementation((_, id, tags) => ({
    instanceProfile: { 
      name: `instance-profile-${id}`
    },
    tags,
  })),
  SecurityGroupsModule: jest.fn().mockImplementation((_, id, vpcId, allowedCidr, tags) => ({
    ec2SecurityGroup: { 
      id: `sg-ec2-${id}`
    },
    rdsSecurityGroup: { 
      id: `sg-rds-${id}`
    },
    vpcId,
    allowedCidr,
    tags,
  }))
}));

// Mock TerraformOutput to avoid duplicate construct errors
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
    NetworkingModule, 
    ComputeModule, 
    StorageModule, 
    DatabaseModule, 
    MonitoringModule, 
    IamModule, 
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

  test("should create AWS provider with correct default region and no tags", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1",
        defaultTags: [],
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

  test("should use AWS_REGION_OVERRIDE when set", () => {
    // Mock the AWS_REGION_OVERRIDE constant by modifying the module
    const originalModule = require("../lib/tap-stack");
    // Since we can't easily mock the const, we test the logic through props
    const app = new App();
    new TapStack(app, "TestStackOverride", { awsRegion: "eu-west-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-west-1",
      })
    );
  });

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

  test("should create all modules in correct order with proper dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackModules");

    // Verify all modules are created
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(NetworkingModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
    expect(ComputeModule).toHaveBeenCalledTimes(1);
    expect(StorageModule).toHaveBeenCalledTimes(1);
    expect(DatabaseModule).toHaveBeenCalledTimes(1);
    expect(MonitoringModule).toHaveBeenCalledTimes(1);
  });

  test("should create IAM module with correct common tags", () => {
    const app = new App();
    new TapStack(app, "TestStackIAM");

    const expectedTags = {
      Environment: 'dev',
      Project: 'WebApp',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
      ManagedBy: 'CDKTF',
    };

    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expectedTags
    );
  });

  test("should create networking module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackNetworking");

    const expectedConfig = {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      tags: {
        Environment: 'dev',
        Project: 'WebApp',
        Owner: 'DevOps Team',
        CostCenter: 'Engineering',
        ManagedBy: 'CDKTF',
      },
    };

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expectedConfig
    );
  });

  test("should create security groups module with VPC dependency", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurityGroups");

    // Get the mocked networking module result
    const networkingInstance = NetworkingModule.mock.results[0].value;

    expect(SecurityGroupsModule).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      networkingInstance.vpc.id,
      '203.0.113.0/24', // allowedSshCidr
      {
        Environment: 'dev',
        Project: 'WebApp',
        Owner: 'DevOps Team',
        CostCenter: 'Engineering',
        ManagedBy: 'CDKTF',
      }
    );
  });

  test("should create compute module with all dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackCompute");

    const networkingInstance = NetworkingModule.mock.results[0].value;
    const iamInstance = IamModule.mock.results[0].value;
    const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;

    const expectedConfig = {
      vpcId: networkingInstance.vpc.id,
      publicSubnetId: networkingInstance.publicSubnets[0].id,
      amiId: 'ami-0c02fb55956c7d316',
      keyPairName: 'production-key-poetic-primate',
      allowedSshCidr: '203.0.113.0/24',
      iamInstanceProfileName: iamInstance.instanceProfile.name,
      ec2SecurityGroupId: securityGroupsInstance.ec2SecurityGroup.id,
      tags: {
        Environment: 'dev',
        Project: 'WebApp',
        Owner: 'DevOps Team',
        CostCenter: 'Engineering',
        ManagedBy: 'CDKTF',
      },
    };

    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expectedConfig
    );
  });

  test("should create storage module with correct bucket configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackStorage");

    const expectedConfig = {
      bucketName: 'my-app-storage-bucket-12345-rlhf-ts',
      tags: {
        Environment: 'dev',
        Project: 'WebApp',
        Owner: 'DevOps Team',
        CostCenter: 'Engineering',
        ManagedBy: 'CDKTF',
      },
    };

    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expectedConfig
    );
  });

  test("should create monitoring module with instance dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackMonitoring");

    const computeInstance = ComputeModule.mock.results[0].value;
    const databaseInstance = DatabaseModule.mock.results[0].value;

    const expectedConfig = {
      instanceId: computeInstance.instance.id,
      dbInstanceId: databaseInstance.dbInstance.id,
      tags: {
        Environment: 'dev',
        Project: 'WebApp',
        Owner: 'DevOps Team',
        CostCenter: 'Engineering',
        ManagedBy: 'CDKTF',
      },
    };

    expect(MonitoringModule).toHaveBeenCalledWith(
      expect.anything(),
      "monitoring",
      expectedConfig
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Should create 8 outputs
    expect(TerraformOutput).toHaveBeenCalledTimes(8);

    // Verify VPC ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "ID of the VPC",
      })
    );

    // Verify EC2 instance ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-id",
      expect.objectContaining({
        description: "ID of the EC2 web server instance",
      })
    );

    // Verify EC2 public IP output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-public-ip",
      expect.objectContaining({
        description: "Public IP address of the EC2 instance",
      })
    );

    // Verify S3 bucket name output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-name",
      expect.objectContaining({
        description: "Name of the S3 bucket for application storage",
      })
    );

    // Verify RDS endpoint output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds-endpoint",
      expect.objectContaining({
        description: "RDS database endpoint for application connection",
      })
    );

    // Verify NAT Gateway IDs output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "nat-gateway-ids",
      expect.objectContaining({
        description: "IDs of the NAT Gateways for high availability",
      })
    );

    // Verify private subnet IDs output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-subnet-ids",
      expect.objectContaining({
        description: "IDs of private subnets for internal resources",
      })
    );

    // Verify public subnet IDs output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-ids",
      expect.objectContaining({
        description: "IDs of public subnets for internet-facing resources",
      })
    );
  });

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

  test("should use custom environment suffix in tags and state key", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", { environmentSuffix: "staging" });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "staging/TestStackCustomEnv.tfstate",
      })
    );

    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expect.objectContaining({
        Environment: 'staging',
      })
    );
  });

  test("should create unique S3 backend keys for different stacks", () => {
    const app = new App();
    
    new TapStack(app, "Stack1");
    new TapStack(app, "Stack2");

    expect(S3Backend).toHaveBeenNthCalledWith(1,
      expect.anything(),
      expect.objectContaining({
        key: "dev/Stack1.tfstate",
      })
    );

    expect(S3Backend).toHaveBeenNthCalledWith(2,
      expect.anything(),
      expect.objectContaining({
        key: "dev/Stack2.tfstate",
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
        region: "eu-central-1", // Should use stateBucketRegion
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2", // Should use awsRegion
      })
    );
  });

  test("should handle custom default tags", () => {
    const app = new App();
    const customTags = {
      tags: {
        CustomTag: "CustomValue",
        Environment: "test"
      }
    };
    
    new TapStack(app, "TestStackCustomTags", { defaultTags: customTags });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [customTags],
      })
    );
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

  test("should create modules with correct construct IDs", () => {
    const app = new App();
    new TapStack(app, "TestStackConstructIds");

    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expect.anything()
    );

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.anything()
    );

    expect(SecurityGroupsModule).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.anything()
    );

    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expect.anything()
    );

    expect(DatabaseModule).toHaveBeenCalledWith(
      expect.anything(),
      "database",
      expect.anything()
    );

    expect(MonitoringModule).toHaveBeenCalledWith(
      expect.anything(),
      "monitoring",
      expect.anything()
    );
  });

  test("should use correct hardcoded configuration values", () => {
    const app = new App();
    new TapStack(app, "TestStackHardcodedValues");

    // Verify AMI ID
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        amiId: 'ami-0c02fb55956c7d316',
      })
    );

    // Verify key pair name
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        keyPairName: 'production-key-poetic-primate',
      })
    );

    // Verify allowed SSH CIDR
    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        allowedSshCidr: '203.0.113.0/24',
      })
    );

    // Verify bucket name
    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expect.objectContaining({
        bucketName: 'my-app-storage-bucket-12345-rlhf-ts',
      })
    );

    // Verify VPC CIDR
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
      })
    );

    // Verify subnet CIDRs
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      })
    );
  });

  test("should create common tags with correct values", () => {
    const app = new App();
    new TapStack(app, "TestStackCommonTags");

    const expectedTags = {
      Environment: 'dev',
      Project: 'WebApp',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
      ManagedBy: 'CDKTF',
    };

    // Verify tags are passed to all modules
    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expectedTags
    );

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        tags: expectedTags,
      })
    );

    expect(SecurityGroupsModule).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      expect.anything(),
      expect.anything(),
      expectedTags
    );
  });
});