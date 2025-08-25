// __tests__/tap-stack.unit.test.ts
import { App, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all modules used in TapStack
jest.mock("../lib/modules", () => ({
  LambdaModule: jest.fn((_, id, config) => ({
    function: { arn: `${id}-function-arn`, functionName: `${id}-function-name` },
    role: { arn: `${id}-role-arn` },
    logGroup: { name: `${id}-log-group` },
    config,
  })),
  S3Module: jest.fn((_, id, config) => ({
    bucket: { bucket: `${id}-bucket`, arn: `${id}-bucket-arn` },
    config,
  })),
  CloudWatchModule: jest.fn((_, id) => ({
    logGroup: { name: `${id}-log-group` },
  })),
}));

// Mock TerraformOutput to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
  };
});

describe("TapStack Unit Tests", () => {
  const { LambdaModule, S3Module, CloudWatchModule } = require("../lib/modules");
  const { TerraformOutput } = require("cdktf");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create LambdaModule with correct props", () => {
    const app = new App();
    new TapStack(app, "TestStackLambda");

    expect(LambdaModule).toHaveBeenCalledTimes(1);
    expect(LambdaModule).toHaveBeenCalledWith(
      expect.anything(),
      "image-processor-lambda",
      expect.objectContaining({
        functionName: expect.any(String),
        s3BucketName: expect.any(String),
        vpcId: expect.any(String),
        runtime: "python3.9",
        timeout: expect.any(Number),
        memorySize: expect.any(Number),
        environment: expect.objectContaining({ ENVIRONMENT: "production" }),
      })
    );

    // Confirm TerraformOutput was called
    expect(TerraformOutput).toHaveBeenCalled();
  });

  test("should define Terraform outputs correctly", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    expect(TerraformOutput).toHaveBeenCalledTimes(7); // number of outputs in TapStack
  });
});
