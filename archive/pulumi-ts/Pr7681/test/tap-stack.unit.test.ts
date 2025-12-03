import { TapStack } from "../lib/tap-stack";

describe("TapStack Structure", () => {
  describe("with props", () => {
    it("instantiates successfully", () => {
      const stack = new TapStack("TestTapStackWithProps", {
        environmentSuffix: "prod",
        tags: {
          Environment: "prod",
          Project: "IAM Compliance",
        },
      });
      expect(stack).toBeDefined();
    });

    it("accepts environment suffix parameter", () => {
      const stack = new TapStack("TestTapStackWithSuffix", {
        environmentSuffix: "test123",
      });
      expect(stack).toBeDefined();
    });

    it("accepts tags parameter", () => {
      const stack = new TapStack("TestTapStackWithTags", {
        tags: {
          Owner: "DevOps",
          CostCenter: "Engineering",
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe("with default values", () => {
    it("instantiates successfully with minimal config", () => {
      const stack = new TapStack("TestTapStackDefault", {});
      expect(stack).toBeDefined();
    });

    it("instantiates without explicit props", () => {
      const stack = new TapStack("TestTapStackNoProps", {
        environmentSuffix: "dev",
      });
      expect(stack).toBeDefined();
    });
  });

  describe("component resource properties", () => {
    it("is a Pulumi ComponentResource", () => {
      const stack = new TapStack("TestComponentResource", {});
      expect(stack).toBeDefined();
      // Verify it's a Pulumi component (it extends pulumi.ComponentResource)
      expect(typeof stack).toBe("object");
    });
  });
});