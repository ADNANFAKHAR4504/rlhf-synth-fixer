// __tests__/tap-stack.unit.test.ts
import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all modules
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn(() => ({
    vpc: { id: "mock-vpc-id" },
    publicSubnets: [{ id: "mock-public-subnet-1" }, { id: "mock-public-subnet-2" }],
    privateSubnets: [{ id: "mock-private-subnet-1" }, { id: "mock-private-subnet-2" }],
    internetGateway: { id: "mock-igw-id" },
    natGateway: { id: "mock-nat-id" },
  })),
  SecurityGroupModule: jest.fn((_, id, config) => ({
    securityGroup: { id: `${id}-sg-id` },
    config,
  })),
  NetworkAclModule: jest.fn(),
  KmsModule: jest.fn((_, id) => ({
    key: { keyId: `${id}-key-id`, arn: `${id}-key-arn` },
  })),
  S3Module: jest.fn((_, id, config) => ({
    bucket: { id: `${id}-bucket`, arn: `${id}-bucket-arn` },
    config,
  })),
  IamModule: jest.fn((_, id, config) => ({
    role: { arn: `${id}-role-arn` },
    config,
  })),
  CloudWatchModule: jest.fn((_, id) => ({
    logGroup: { name: `${id}-log-group` },
  })),
}));

describe("TapStack Unit Tests", () => {
  const { VpcModule, SecurityGroupModule, KmsModule, S3Module, IamModule, CloudWatchModule, NetworkAclModule } = require("../lib/modules");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create VpcModule with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStack");

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expect.objectContaining({
        vpcCidr: expect.any(String),
        publicSubnetCidrs: expect.any(Array),
        privateSubnetCidrs: expect.any(Array),
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: expect.objectContaining({ Environment: expect.any(String) }),
      })
    );
  });

  test("should create KMS, SecurityGroups, S3, IAM, CloudWatch modules", () => {
    const app = new App();
    new TapStack(app, "TestStack");

    expect(KmsModule).toHaveBeenCalledTimes(2); // s3-kms, logs-kms
    expect(SecurityGroupModule).toHaveBeenCalledTimes(2); // web-sg, db-sg
    expect(S3Module).toHaveBeenCalledTimes(2); // data-bucket, logs-bucket
    expect(IamModule).toHaveBeenCalledTimes(2); // ec2-role, lambda-role
    expect(CloudWatchModule).toHaveBeenCalledTimes(2); // app-logs, system-logs
    expect(NetworkAclModule).toHaveBeenCalledTimes(2); // public, private NACLs
  });

  test("should define Terraform outputs correctly", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStack");

    const synthesized = Testing.synth(stack);
    const outputs = JSON.parse(synthesized).output;

    // Check a few key outputs
    expect(outputs["vpc-id"].value).toEqual("mock-vpc-id");
    expect(outputs["public-subnet-ids"].value).toEqual([
      "mock-public-subnet-1",
      "mock-public-subnet-2",
    ]);
    expect(outputs["private-subnet-ids"].value).toEqual([
      "mock-private-subnet-1",
      "mock-private-subnet-2",
    ]);
    expect(outputs["web-security-group-id"].value).toEqual("web-sg-sg-id");
    expect(outputs["db-security-group-id"].value).toEqual("db-sg-sg-id");
    expect(outputs["data-bucket-name"].value).toEqual("data-bucket-bucket");
    expect(outputs["logs-bucket-name"].value).toEqual("logs-bucket-bucket");
    expect(outputs["s3-kms-key-id"].value).toEqual("s3-kms-key-id");
    expect(outputs["logs-kms-key-id"].value).toEqual("logs-kms-key-id");
    expect(outputs["ec2-role-arn"].value).toEqual("ec2-role-role-arn");
    expect(outputs["lambda-role-arn"].value).toEqual("lambda-role-role-arn");
    expect(outputs["app-log-group-name"].value).toEqual("app-logs-log-group");
    expect(outputs["system-log-group-name"].value).toEqual("system-logs-log-group");
    expect(outputs["nat-gateway-id"].value).toEqual("mock-nat-id");
    expect(outputs["internet-gateway-id"].value).toEqual("mock-igw-id");
  });
});
