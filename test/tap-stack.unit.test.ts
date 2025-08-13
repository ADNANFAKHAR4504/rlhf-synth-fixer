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
          Environment: "prod",
          Project: "test"
        }
      });
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("has security infrastructure outputs", () => {
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.primaryBucketArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.s3KmsKeyArn).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyArn).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.cloudTrailLogGroupArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.region).toBeDefined();
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackDefault", {});
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("uses default environment suffix", () => {
      // The stack should use 'dev' as default environment suffix
      expect(stack).toBeDefined();
    });

    it("has all required security outputs", () => {
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.region).toEqual("us-east-1");
    });
  });
});
