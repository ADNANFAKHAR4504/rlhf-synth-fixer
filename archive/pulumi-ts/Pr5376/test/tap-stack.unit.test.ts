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
        tags: {
          Environment: "Production",
          ManagedBy: "Pulumi"
        }
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackDefault", {});
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });
  });
});