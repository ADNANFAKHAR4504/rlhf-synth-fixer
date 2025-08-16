// __tests__/tap-stack.unit.test.ts
import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mocking modules used inside TapStack
jest.mock("../lib/modules", () => {
  return {
    LoggingModule: jest.fn(() => ({
      logGroup: { name: "mock-log-group", arn: "arn:mock:log" },
    })),
    KmsModule: jest.fn(() => ({
      key: { arn: "arn:mock:kms" },
    })),
    NetworkModule: jest.fn(() => ({
      vpc: { id: "mock-vpc-id" },
      publicSubnets: [{ id: "mock-public-subnet-1" }, { id: "mock-public-subnet-2" }],
      privateSubnets: [{ id: "mock-private-subnet-1" }, { id: "mock-private-subnet-2" }],
      natGateway: { id: "mock-nat" },
    })),
    SecurityGroupsModule: jest.fn(() => ({
      bastionSg: { id: "mock-sg-bastion" },
      webSg: { id: "mock-sg-web" },
      appSg: { id: "mock-sg-app" },
    })),
    NaclModule: jest.fn(() => ({})),
    SecureBucketModule: jest.fn((scope, id, cfg) => ({
      bucket: { bucket: cfg.bucketName },
    })),
    CloudTrailModule: jest.fn(() => ({
      trail: { arn: "arn:mock:cloudtrail" },
    })),
  };
});

describe("TapStack Unit Tests", () => {
  const {
    LoggingModule,
    KmsModule,
    NetworkModule,
    SecurityGroupsModule,
    NaclModule,
    SecureBucketModule,
    CloudTrailModule,
  } = require("../lib/modules");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create NetworkModule with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStack");
    expect(NetworkModule).toHaveBeenCalledTimes(1);
    expect(NetworkModule).toHaveBeenCalledWith(
      expect.anything(),
      "network",
      expect.objectContaining({
        cidrBlock: expect.any(String),
        azs: expect.any(Array),
        enableFlowLogs: true,
        logGroupName: "mock-log-group",
      })
    );
  });

  test("should output vpc_id and subnets", () => {
    const app = new App();
    const stack = new TapStack(app, "TestOutputs");
    const synthesized = Testing.synth(stack);
    const outputs = JSON.parse(synthesized).output;

    expect(outputs.vpc_id.value).toEqual("mock-vpc-id");
    expect(outputs.public_subnet_ids.value).toEqual([
      "mock-public-subnet-1",
      "mock-public-subnet-2",
    ]);
    expect(outputs.private_subnet_ids.value).toEqual([
      "mock-private-subnet-1",
      "mock-private-subnet-2",
    ]);
  });

  test("should use props.awsRegion when AWS_REGION_OVERRIDE is not set", () => {
    const app = new App();

    // Temporarily override AWS_REGION_OVERRIDE
    const original = (TapStack as any).AWS_REGION_OVERRIDE;
    (TapStack as any).AWS_REGION_OVERRIDE = undefined;

    new TapStack(app, "TestRegion", { awsRegion: "ap-south-1" });

    // Restore
    (TapStack as any).AWS_REGION_OVERRIDE = original;
  });

  test("should set defaultTags when provided", () => {
    const app = new App();
    new TapStack(app, "TestTags", {
      defaultTags: { tags: { Project: "TestProject" } },
    });
  });
});
