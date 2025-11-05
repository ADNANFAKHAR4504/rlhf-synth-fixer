import * as pulumi from "@pulumi/pulumi";
import { TapStack, TapStackArgs } from "../lib/tap-stack";

// Mock Pulumi runtime
jest.mock("@pulumi/pulumi", () => {
  const actual = jest.requireActual("@pulumi/pulumi");

  class MockComponentResource {
    constructor(
      public readonly __pulumiType: string,
      public readonly __name: string,
      public readonly __args: any,
      public readonly __opts?: any
    ) {}

    registerOutputs(outputs: any) {
      return outputs;
    }
  }

  return {
    ...actual,
    ComponentResource: MockComponentResource,
    output: (val: any) => val,
    Output: {
      create: (val: any) => val,
    },
  };
});

describe("TapStack Structure", () => {
  describe("with custom environment suffix", () => {
    let stack: TapStack;
    const args: TapStackArgs = {
      environmentSuffix: "prod",
      tags: { Environment: "production", CostCenter: "finance" },
    };

    beforeEach(() => {
      stack = new TapStack("TestTapStackWithProps", args);
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it("has correct Pulumi resource type", () => {
      expect((stack as any).__pulumiType).toBe("tap:stack:TapStack");
    });

    it("has correct resource name", () => {
      expect((stack as any).__name).toBe("TestTapStackWithProps");
    });

    it("accepts environment suffix argument", () => {
      expect((stack as any).__args.environmentSuffix).toBe("prod");
    });

    it("accepts tags argument", () => {
      expect((stack as any).__args.tags).toEqual({
        Environment: "production",
        CostCenter: "finance",
      });
    });
  });

  describe("with default values", () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack("TestTapStackDefault", {});
    });

    it("instantiates successfully with empty args", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it("has correct Pulumi resource type", () => {
      expect((stack as any).__pulumiType).toBe("tap:stack:TapStack");
    });

    it("has correct resource name", () => {
      expect((stack as any).__name).toBe("TestTapStackDefault");
    });
  });

  describe("component structure", () => {
    it("is a Pulumi ComponentResource", () => {
      const stack = new TapStack("TestComponentType", {
        environmentSuffix: "test",
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it("supports optional environmentSuffix", () => {
      const stackWithSuffix = new TapStack("StackWithSuffix", {
        environmentSuffix: "dev",
      });
      const stackWithoutSuffix = new TapStack("StackWithoutSuffix", {});

      expect(stackWithSuffix).toBeDefined();
      expect(stackWithoutSuffix).toBeDefined();
    });

    it("supports optional tags", () => {
      const stackWithTags = new TapStack("StackWithTags", {
        tags: { Project: "TAP", Owner: "DevOps" },
      });
      const stackWithoutTags = new TapStack("StackWithoutTags", {});

      expect(stackWithTags).toBeDefined();
      expect(stackWithoutTags).toBeDefined();
    });

    it("can be instantiated multiple times", () => {
      const stack1 = new TapStack("Stack1", { environmentSuffix: "env1" });
      const stack2 = new TapStack("Stack2", { environmentSuffix: "env2" });
      const stack3 = new TapStack("Stack3", { environmentSuffix: "env3" });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
      expect((stack1 as any).__args.environmentSuffix).toBe("env1");
      expect((stack2 as any).__args.environmentSuffix).toBe("env2");
      expect((stack3 as any).__args.environmentSuffix).toBe("env3");
    });
  });
});
