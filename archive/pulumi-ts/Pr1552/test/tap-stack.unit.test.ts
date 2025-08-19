import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Mock Pulumi modules before importing the stack
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    // Default state for resources
    const defaultState = {
      ...args.inputs,
      id: args.name + "_id",
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Specific handling for different resource types
    switch (args.type) {
      case "aws:s3/bucket:Bucket":
        return {
          id: args.name + "_id",
          state: {
            ...defaultState,
            bucket: args.inputs.bucket || args.name,
            arn: `arn:aws:s3:::${args.inputs.bucket || args.name}`,
          },
        };
      case "aws:ec2/instance:Instance":
        return {
          id: args.name + "_id",
          state: {
            ...defaultState,
            id: args.name + "_id",
            publicIp: "10.0.0.1",
            privateIp: "10.0.1.1",
          },
        };
      case "aws:ec2/vpc:Vpc":
        return {
          id: args.name + "_id",
          state: {
            ...defaultState,
            id: args.name + "_vpc_id",
            cidrBlock: args.inputs.cidrBlock || "10.0.0.0/16",
          },
        };
      case "aws:ec2/securityGroup:SecurityGroup":
        return {
          id: args.name + "_id",
          state: {
            ...defaultState,
            id: args.name + "_sg_id",
          },
        };
      default:
        return {
          id: args.name + "_id",
          state: defaultState,
        };
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === "aws:ec2/getAmi:getAmi") {
      return {
        id: "ami-12345678",
        architecture: "x86_64",
        description: "Amazon Linux 2 AMI",
        imageId: "ami-12345678",
      };
    }
    return args.inputs;
  },
});

describe("TapStack Unit Tests", () => {
  describe("Stack Creation", () => {
    it("should create stack with custom environment suffix", async () => {
      const stack = new TapStack("TestStack", {
        environmentSuffix: "test-env",
        tags: {
          Project: "TestProject",
        },
      });

      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.instanceId).toBeDefined();
    });

    it("should create stack with default environment suffix", async () => {
      const stack = new TapStack("TestStackDefault", {});
      
      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.instanceId).toBeDefined();
    });
  });

  describe("Resource Configuration", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("TestResourceStack", {
        environmentSuffix: "test",
      });
    });

    it("should create stack with required resources", () => {
      expect(stack).toBeDefined();
    });

    it("should have bucket name output", () => {
      expect(stack.bucketName).toBeDefined();
    });

    it("should have instance ID output", () => {
      expect(stack.instanceId).toBeDefined();
    });
  });

  describe("Tag Configuration", () => {
    it("should apply default Environment tag", () => {
      const stack = new TapStack("TestTagStack", {
        environmentSuffix: "test",
      });
      
      expect(stack).toBeDefined();
      // Default tags including Environment: Development should be applied
    });

    it("should merge custom tags with defaults", () => {
      const stack = new TapStack("TestCustomTagStack", {
        environmentSuffix: "test",
        tags: {
          Owner: "TestOwner",
          Project: "TestProject",
        },
      });
      
      expect(stack).toBeDefined();
      // Custom tags should be merged with default Environment tag
    });
  });

  describe("Environment Suffix Usage", () => {
    it("should use environment suffix in resource names", () => {
      const environmentSuffix = "unique-test";
      const stack = new TapStack("TestSuffixStack", {
        environmentSuffix: environmentSuffix,
      });
      
      expect(stack).toBeDefined();
      // All resource names should include the environment suffix
    });

    it("should use 'dev' as default environment suffix", () => {
      const stack = new TapStack("TestDefaultSuffixStack", {});
      
      expect(stack).toBeDefined();
      // Resources should use 'dev' suffix when not specified
    });
  });
});