import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
const fs = require('fs');
const path = require('path');

// Mocking VpcModule and other modules to return the full expected object structure.
jest.mock("../lib/modules", () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: {
        id: "mock-vpc-id",
      },
      // Correcting the mock to return arrays of subnets instead of single objects
      publicSubnets: [
        { id: "mock-public-subnet-1-id" },
        { id: "mock-public-subnet-2-id" },
      ],
      privateSubnets: [
        { id: "mock-private-subnet-1-id" },
        { id: "mock-private-subnet-2-id" },
      ],
      // Correcting the mock to include natGateway and internetGateway
      natGateway: { id: "mock-nat-gateway-id" },
      internetGateway: { id: "mock-internet-gateway-id" },
      // Mocking the attributes needed for the `availability_zones_used` output
      publicAz: "us-west-2a",
      privateAz: "us-west-2b",
    })),
    SecurityGroupModule: jest.fn(() => ({
      securityGroup: {
        id: "mock-sg-id",
      },
    })),
    NetworkAclModule: jest.fn(() => ({
      networkAcl: {
        id: "mock-acl-id",
      },
    })),
    KmsModule: jest.fn(() => ({
      key: {
        keyId: "mock-kms-key-id",
        arn: "mock-kms-key-arn",
      },
    })),
    S3Module: jest.fn(() => ({
      bucket: {
        bucket: "mock-s3-bucket",
      },
    })),
    IamModule: jest.fn(() => ({
      role: {
        arn: "mock-iam-role-arn",
      },
    })),
    CloudWatchModule: jest.fn(() => ({
      logGroup: {
        name: "mock-log-group-name",
      },
    })),
  };
});

describe("TapStack Unit Tests", () => {
  const { VpcModule } = require("../lib/modules");

  // Clear all mocks before each test to ensure a clean slate
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test to ensure the entire synthesized stack snapshot matches the expected output.
  // This is a powerful integration test for your stack's plan.
  test('synthesizes to a consistent Terraform plan', () => {
    const app = new App();
    const stack = new TapStack(app, "test-stack");
    expect(Testing.fullSynth(stack)).toMatchSnapshot();
  });

  // This test verifies that the VpcModule is called with the correct properties.
  test("should create VpcModule with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStack");
    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      // The VpcModule is instantiated with the ID "vpc" in the application code
      "vpc",
      expect.objectContaining({
        vpcCidr: "10.0.0.0/16",
        // Removed `availabilityZones` from the expectation as it's not a direct prop
      })
    );
  });

  // New test to ensure the VpcModule mock returns the correct structure
  test("should ensure the VpcModule mock has the correct structure", () => {
    // Instantiate the mocked module directly to test its shape
    const vpcModuleMock = VpcModule();
    expect(vpcModuleMock).toHaveProperty('vpc.id');
    expect(vpcModuleMock.vpc.id).toEqual('mock-vpc-id');
  });
});
