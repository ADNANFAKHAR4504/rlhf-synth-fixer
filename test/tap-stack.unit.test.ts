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
    
    // Mock Pulumi Config
    (pulumi as any).Config = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue("dev"),
      getObject: jest.fn().mockReturnValue(["203.26.56.90/32"]),
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

    it("has required outputs", () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.internetGatewayId).toBeDefined();
      expect(stack.securityGroupId).toBeDefined();
      expect(stack.ec2InstanceId).toBeDefined();
      expect(stack.ec2InstancePublicIp).toBeDefined();
      expect(stack.ec2InstancePublicDns).toBeDefined();
    });
  });

  describe("with default values", () => {
    beforeAll(() => {
      stack = new TapStack("TestTapStackDefault", {});
    });

    it("instantiates successfully", () => {
      expect(stack).toBeDefined();
    });

    it("has all required infrastructure outputs", () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.internetGatewayId).toBeDefined();
      expect(stack.securityGroupId).toBeDefined();
      expect(stack.ec2InstanceId).toBeDefined();
      expect(stack.ec2InstancePublicIp).toBeDefined();
      expect(stack.ec2InstancePublicDns).toBeDefined();
    });
  });
});