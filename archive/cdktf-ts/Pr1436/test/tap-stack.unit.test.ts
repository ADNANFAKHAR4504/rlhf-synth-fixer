// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn((_, id, config) => ({
    vpc: { id: `${id}-vpc-id` },
    publicSubnets: [{ id: `${id}-public-subnet-1` }, { id: `${id}-public-subnet-2` }],
    privateSubnets: [{ id: `${id}-private-subnet-1` }, { id: `${id}-private-subnet-2` }],
    config,
  })),
  SecurityGroupModule: jest.fn((_, id, config) => ({
    ec2SecurityGroup: { id: `${id}-ec2-sg-id` },
    rdsSecurityGroup: { id: `${id}-rds-sg-id` },
    config,
  })),
  IamModule: jest.fn((_, id, config) => ({
    ec2InstanceProfile: { name: `${id}-instance-profile` },
    ec2Role: { arn: `${id}-role-arn` },
    config,
  })),
  Ec2Module: jest.fn((_, id, config) => ({
    instances: [
      { id: `${id}-instance-1`, privateIp: "10.0.1.10" },
      { id: `${id}-instance-2`, privateIp: "10.0.2.10" },
    ],
    config,
  })),
  S3Module: jest.fn((_, id, config) => ({
    buckets: [
      { bucket: "app-data" },
      { bucket: "backups" },
      { bucket: "logs" },
    ],
    cloudtrailBucket: { bucket: "cloudtrail-logs" },
    config,
  })),
  RdsModule: jest.fn((_, id, config) => ({
    dbInstance: { endpoint: "rds.endpoint.aws" },
    config,
  })),
  CloudTrailModule: jest.fn((_, id, config) => ({
    trail: { name: `${id}-trail` },
    config,
  })),
  CloudWatchModule: jest.fn((_, id, config) => ({
    snsTopic: { arn: `${id}-sns-arn` },
    config,
  })),
}));

// Mock TerraformOutput to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
  };
});

describe("TapStack Unit Tests", () => {
  const {
    VpcModule,
    SecurityGroupModule,
    IamModule,
    Ec2Module,
    S3Module,
    RdsModule,
    CloudTrailModule,
    CloudWatchModule,
  } = require("../lib/modules");
  const { TerraformOutput } = require("cdktf");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create VpcModule with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStackVpc");

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "main-vpc",
      expect.objectContaining({
        cidrBlock: "10.0.0.0/16",
        publicSubnetCount: 2,
        privateSubnetCount: 2,
        enableNatGateway: true,
      })
    );
  });

  test("should create EC2 module and RDS with dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackCompute");

    expect(Ec2Module).toHaveBeenCalledTimes(1);
    expect(RdsModule).toHaveBeenCalledTimes(1);

    expect(Ec2Module).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.objectContaining({
        instanceType: "m5.large",
        iamInstanceProfile: expect.stringContaining("instance-profile"),
        keyName: "corp-keypair",
      })
    );

    expect(RdsModule).toHaveBeenCalledWith(
      expect.anything(),
      "database",
      expect.objectContaining({
        dbName: "corpdb",
        username: "admin",
        instanceClass: "db.t3.medium",
      })
    );
  });

  test("should create CloudTrail and CloudWatch modules", () => {
    const app = new App();
    new TapStack(app, "TestStackAudit");

    expect(CloudTrailModule).toHaveBeenCalledTimes(1);
    expect(CloudWatchModule).toHaveBeenCalledTimes(1);
  });

  test("should define Terraform outputs correctly", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Count how many outputs TapStack defines
    expect(TerraformOutput).toHaveBeenCalledTimes(12);
  });
});
