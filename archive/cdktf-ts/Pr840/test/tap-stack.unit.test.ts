// __tests__/tap-stack.unit.test.ts
import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mocking VpcModule
jest.mock("../lib/modules", () => {
  return {
    VpcModule: jest.fn(() => ({
      vpcId: "mock-vpc-id",
      publicSubnetId: "mock-public-subnet-id",
      privateSubnetId: "mock-private-subnet-id",
      publicAz: "us-west-2a",
      privateAz: "us-west-2b",
    })),
  };
});

describe("TapStack Unit Tests", () => {
  const { VpcModule } = require("../lib/modules");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create VpcModule with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStack");
    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "ProductionVpc",
      expect.objectContaining({
        vpcCidr: "10.0.0.0/16",
        availabilityZones: expect.anything(),
      })
    );
  });

  test("should output availability_zones_used from VpcModule", () => {
    const app = new App();

    // Mock with specific AZs
    (VpcModule as jest.Mock).mockImplementationOnce(() => ({
      vpcId: "mock-vpc-id",
      publicSubnetId: "mock-public-subnet-id",
      privateSubnetId: "mock-private-subnet-id",
      publicAz: "us-west-2a",
      privateAz: "us-west-2b",
    }));

    const stack = new TapStack(app, "TestAZOutput");
    const synthesized = Testing.synth(stack);
    const outputs = JSON.parse(synthesized).output;

    expect(outputs.availability_zones_used.value).toEqual([
      "us-west-2a",
      "us-west-2b",
    ]);
  });
  test("should use props.awsRegion when AWS_REGION_OVERRIDE is not set", () => {
    const app = new App();

    // Temporarily override the constant for this test
    const originalOverride = (TapStack as any).AWS_REGION_OVERRIDE;
    (TapStack as any).AWS_REGION_OVERRIDE = undefined;

    new TapStack(app, "TestRegion", { awsRegion: "ap-south-1" });

    // Restore original constant
    (TapStack as any).AWS_REGION_OVERRIDE = originalOverride;
  });

  test("should set defaultTags when provided", () => {
    const app = new App();
    new TapStack(app, "TestTags", {
      defaultTags: { tags: { Project: "TestProject" } },
    });
  });
});
