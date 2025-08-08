import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack } from "../lib/tap-stack";

// Enable Pulumi mocking
jest.mock("@pulumi/pulumi");
jest.mock("@pulumi/aws");

describe("TapStack Structure", () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock Pulumi runtime behavior
    (pulumi as any).all = jest.fn().mockImplementation((values) => Promise.resolve(values));
    (pulumi as any).Output = jest.fn().mockImplementation((value) => ({ 
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value)
    }));
  });

  describe("with props", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackWithProps", {
        environmentSuffix: "prod",
        stateBucket: "custom-state-bucket",
        stateBucketRegion: "us-west-2",
        awsRegion: "us-west-2",
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("creates AWS provider with correct region", async () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        "aws",
        expect.objectContaining({
          region: "us-west-2"
        })
      );
    });

    it("uses custom state bucket name", async () => {
      expect(pulumi.Config).toHaveBeenCalledWith("tapstack");
      // Add assertions for your state bucket configuration
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackDefault");
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("uses default AWS region", async () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        "aws",
        expect.objectContaining({
          region: expect.any(String) // Your default region
        })
      );
    });
  });
});