// __tests__/tap-stack.unit.test.ts
import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all module classes from modules.ts
jest.mock("../lib/modules", () => {
  return {
    NetworkingModule: jest.fn(() => ({
      vpc: { id: "mock-vpc-id" },
      publicSubnets: [{ id: "mock-public-subnet-1" }, { id: "mock-public-subnet-2" }],
      privateSubnets: [{ id: "mock-private-subnet-1" }, { id: "mock-private-subnet-2" }],
      internetGateway: { id: "mock-igw-id" },
      availabilityZones: { names: ["us-east-1a", "us-east-1b", "us-east-1c"] }
    })),
    S3Module: jest.fn(() => ({
      bucket: {
        bucket: "mock-logs-bucket",
        arn: "mock-s3-arn",
        bucketDomainName: "mock-s3-domain"
      }
    })),
    IamModule: jest.fn(() => ({
      ec2Role: { arn: "mock-ec2-role-arn" },
      instanceProfile: { name: "mock-ec2-profile" }
    })),
    RdsModule: jest.fn(() => ({
      dbInstance: {
        endpoint: "mock-db-endpoint",
        port: 3306,
        dbName: "mock-db-name"
      },
      dbSubnetGroup: { name: "mock-db-subnet-group" },
      securityGroup: { id: "mock-rds-sg" }
    })),
    SecurityGroupsModule: jest.fn(() => ({
      webSecurityGroup: { id: "mock-web-sg" },
      appSecurityGroup: { id: "mock-app-sg" }
    })),
  };
});

describe("TapStack Unit Tests", () => {
  const {
    NetworkingModule,
    S3Module,
    IamModule,
    RdsModule,
    SecurityGroupsModule
  } = require("../lib/modules");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should instantiate all modules with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStack");

    expect(NetworkingModule).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
    expect(RdsModule).toHaveBeenCalledTimes(1);
  });

  test("should create correct Terraform outputs", () => {
    const app = new App();
    const stack = new TapStack(app, "TestOutputs");
    const synthesized = Testing.synth(stack);
    const outputs = JSON.parse(synthesized).output;

    // Networking outputs
    expect(outputs["vpc-id"].value).toBe("mock-vpc-id");
    expect(outputs["public-subnet-ids"].value).toEqual([
      "mock-public-subnet-1", "mock-public-subnet-2"
    ]);
    expect(outputs["private-subnet-ids"].value).toEqual([
      "mock-private-subnet-1", "mock-private-subnet-2"
    ]);
    expect(outputs["availability-zones"].value).toEqual([
      "us-east-1a", "us-east-1b", "us-east-1c"
    ]);

    // S3 outputs
    expect(outputs["s3-bucket-name"].value).toBe("mock-logs-bucket");
    expect(outputs["s3-bucket-arn"].value).toBe("mock-s3-arn");
    expect(outputs["s3-bucket-domain-name"].value).toBe("mock-s3-domain");

    // IAM outputs
    expect(outputs["ec2-role-arn"].value).toBe("mock-ec2-role-arn");
    expect(outputs["ec2-instance-profile-name"].value).toBe("mock-ec2-profile");

    // Security Groups
    expect(outputs["web-security-group-id"].value).toBe("mock-web-sg");
    expect(outputs["app-security-group-id"].value).toBe("mock-app-sg");

    // RDS outputs
    expect(outputs["rds-endpoint"].value).toBe("mock-db-endpoint");
    expect(outputs["rds-port"].value).toBe(3306);
    expect(outputs["rds-db-name"].value).toBe("mock-db-name");
    expect(outputs["rds-security-group-id"].value).toBe("mock-rds-sg");

    // Other outputs
    expect(outputs["region"].value).toBe("us-east-1");
    expect(outputs["environment"].value).toBe("dev");
  });

  test("should pass environment and config correctly to modules", () => {
    const app = new App();
    new TapStack(app, "TestConfig", {
      environmentSuffix: "stage",
      awsRegion: "ap-south-1",
    });

    // Networking module first call config
    expect((NetworkingModule as jest.Mock).mock.calls[0][2]).toEqual(
      expect.objectContaining({
        vpcCidr: "10.0.0.0/16",
        publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
        privateSubnetCidrs: ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"],
        tags: expect.objectContaining({
          Environment: "stage",
          Owner: "DevOps Team",
          Project: "RLHF",
        }),
      })
    );
  });
});
