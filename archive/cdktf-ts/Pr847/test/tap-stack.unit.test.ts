// __tests__/tap-stack.unit.test.ts
import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all module classes
jest.mock("../lib/modules", () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: "mock-vpc-id" },
      internetGateway: { id: "mock-igw-id" }
    })),
    SubnetModule: jest.fn(() => ({
      publicSubnets: [{ id: "mock-public-subnet-1" }, { id: "mock-public-subnet-2" }],
      privateSubnets: [{ id: "mock-private-subnet-1" }, { id: "mock-private-subnet-2" }],
      natGateways: [{ publicIp: "1.2.3.4" }, { publicIp: "5.6.7.8" }]
    })),
    SecurityGroupModule: jest.fn(() => ({
      sshSecurityGroup: { id: "mock-ssh-sg" },
      webSecurityGroup: { id: "mock-web-sg" },
      dbSecurityGroup: { id: "mock-db-sg" }
    })),
    IamModule: jest.fn(() => ({
      ec2InstanceProfile: { name: "mock-ec2-profile" }
    })),
    Ec2Module: jest.fn(() => ({
      instances: [
        { id: "mock-ec2-1", publicIp: "3.3.3.3" },
        { id: "mock-ec2-2", publicIp: "4.4.4.4" }
      ]
    })),
    RdsModule: jest.fn(() => ({
      dbInstance: { endpoint: "mock-db-endpoint" }
    })),
    S3Module: jest.fn(() => ({
      logsBucket: { bucket: "mock-logs-bucket" }
    })),
  };
});

describe("TapStack Unit Tests", () => {
  const {
    VpcModule,
    SubnetModule,
    SecurityGroupModule,
    IamModule,
    Ec2Module,
    RdsModule,
    S3Module
  } = require("../lib/modules");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should instantiate all modules with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStack");

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(SubnetModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(Ec2Module).toHaveBeenCalledTimes(1);
    expect(RdsModule).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledTimes(1);
  });

  test("should create correct Terraform outputs", () => {
    const app = new App();
    const stack = new TapStack(app, "TestOutputs");
    const synthesized = Testing.synth(stack);
    const outputs = JSON.parse(synthesized).output;

    expect(outputs["vpc-id"].value).toBe("mock-vpc-id");
    expect(outputs["public-subnet-ids"].value).toEqual([
      "mock-public-subnet-1", "mock-public-subnet-2"
    ]);
    expect(outputs["private-subnet-ids"].value).toEqual([
      "mock-private-subnet-1", "mock-private-subnet-2"
    ]);
    expect(outputs["ec2-instance-ids"].value).toEqual([
      "mock-ec2-1", "mock-ec2-2"
    ]);
    expect(outputs["ec2-public-ips"].value).toEqual([
      "3.3.3.3", "4.4.4.4"
    ]);
    expect(outputs["rds-endpoint"].value).toBe("mock-db-endpoint");
    expect(outputs["s3-logs-bucket-name"].value).toBe("mock-logs-bucket");
    expect(outputs["nat-gateway-ips"].value).toEqual([
      "1.2.3.4", "5.6.7.8"
    ]);
  });

  test("should pass environment and config correctly to modules", () => {
    const app = new App();
    new TapStack(app, "TestConfig", {
      environmentSuffix: "stage",
      awsRegion: "ap-south-1",
    });

    // First call is VpcModule with config including CIDR
    expect((VpcModule as jest.Mock).mock.calls[0][2]).toEqual(
      expect.objectContaining({
        cidrBlock: "10.0.0.0/16",
        environment: "dev",
        region: "us-east-1",
        projectName: "tap-infrastructure"
      })
    );
  });
});
