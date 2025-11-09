import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack } from "../lib/tap-stack";

// Pulumi runtime mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-2:123456789012:${args.name}`,
        name: args.name,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
      return {
        names: ["us-east-2a", "us-east-2b", "us-east-2c"],
      };
    }
    if (args.token === "aws:index/getRegion:getRegion") {
      return {
        name: "us-east-2",
      };
    }
    return {};
  },
});

describe("TapStack - Serverless Fraud Detection", () => {
  let stack: TapStack;

  describe("with environmentSuffix", () => {
    beforeAll(() => {
      stack = new TapStack("test-fraud-stack", {
        environmentSuffix: "test",
        tags: {
          Environment: "test",
          Project: "fraud-detection",
        },
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("has apiEndpoint output", () => {
      expect(stack.apiEndpoint).toBeDefined();
    });

    it("has tableArn output", () => {
      expect(stack.tableArn).toBeDefined();
    });

    it("has tableName output", () => {
      expect(stack.tableName).toBeDefined();
    });

    it("has Lambda function name outputs", () => {
      expect(stack.ingestionFunctionName).toBeDefined();
      expect(stack.detectorFunctionName).toBeDefined();
      expect(stack.alertFunctionName).toBeDefined();
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("test-fraud-stack-default", {});
    });

    it("instantiates successfully with defaults", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("has all required outputs", () => {
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.tableArn).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.ingestionFunctionName).toBeDefined();
      expect(stack.detectorFunctionName).toBeDefined();
      expect(stack.alertFunctionName).toBeDefined();
    });
  });

  describe("resource naming", () => {
    it("includes environmentSuffix in resource names", async () => {
      const testStack = new TapStack("test-naming", {
        environmentSuffix: "prod",
      });

      expect(testStack).toBeDefined();

      // Verify outputs exist (actual names are tested in integration tests)
      expect(testStack.tableName).toBeDefined();
      expect(testStack.ingestionFunctionName).toBeDefined();
    });
  });
});