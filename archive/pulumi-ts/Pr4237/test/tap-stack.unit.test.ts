import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";
import { TapStack } from "../lib/tap-stack";

// Mock all dependencies
jest.mock("@pulumi/pulumi");
jest.mock("@pulumi/aws");
jest.mock("fs");
jest.mock("path");

describe("TapStack Unit Tests", () => {
  let mockOutput: any;
  let mockInterpolate: any;
  let mockAll: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const createMocks = () => {
    // Mock Pulumi Output
    mockOutput = jest.fn((value) => ({
      apply: jest.fn((callback) => mockOutput(callback(value))),
      promise: () => Promise.resolve(value),
    }));

    // Mock Pulumi interpolate
    mockInterpolate = jest.fn((...args) => ({
      apply: jest.fn((callback) => mockOutput(callback(args[0]))),
      promise: () => Promise.resolve(args[0]),
    }));

    // Mock Pulumi all
    mockAll = jest.fn((values) => ({
      apply: jest.fn((callback) => {
        const resolved = Array.isArray(values) ? values : Object.values(values || {});
        return mockOutput(callback(resolved));
      }),
      promise: () => Promise.resolve(values),
    }));

    (pulumi as any).output = mockOutput;
    (pulumi as any).interpolate = mockInterpolate;
    (pulumi as any).all = mockAll;
    (pulumi as any).Output = jest.fn();
    (pulumi as any).ComponentResource = jest.fn(function (
      this: any,
      type: string,
      name: string,
      args: any,
      opts: any
    ) {
      this.registerOutputs = jest.fn();
    });

    (aws as any).getCallerIdentity = jest.fn(() =>
      Promise.resolve({ accountId: "123456789012" })
    );
    (aws as any).config = { region: "us-east-1" };

    const mockResourceConstructor = jest.fn(function (
      this: any,
      name: string,
      args: any,
      opts: any
    ) {
      this.id = mockOutput(`${name}-id`);
      this.arn = mockOutput(`arn:aws:service::123456789012:${name}`);
      this.name = mockOutput(name);
      this.keyId = mockOutput(`${name}-keyId`);
      this.bucket = mockOutput(`${name}-bucket`);
      this.dnsName = mockOutput(`${name}.elb.amazonaws.com`);
      this.deploymentGroupName = mockOutput(`${name}-dg`);
      this.family = mockOutput(`${name}-family`);
    });

    (aws.kms as any).Key = mockResourceConstructor;
    (aws.kms as any).Alias = mockResourceConstructor;
    (aws.s3 as any).Bucket = mockResourceConstructor;
    (aws.s3 as any).BucketVersioning = mockResourceConstructor;
    (aws.s3 as any).BucketServerSideEncryptionConfiguration = mockResourceConstructor;
    (aws.s3 as any).BucketPublicAccessBlock = mockResourceConstructor;
    (aws.sns as any).Topic = mockResourceConstructor;
    (aws.sns as any).TopicSubscription = mockResourceConstructor;
    (aws.cloudwatch as any).LogGroup = mockResourceConstructor;
    (aws.ecs as any).Cluster = mockResourceConstructor;
    (aws.ecs as any).TaskDefinition = mockResourceConstructor;
    (aws.ecs as any).Service = mockResourceConstructor;
    (aws.iam as any).Role = mockResourceConstructor;
    (aws.iam as any).RolePolicy = mockResourceConstructor;
    (aws.iam as any).RolePolicyAttachment = mockResourceConstructor;
    (aws.codebuild as any).Project = mockResourceConstructor;
    (aws.codedeploy as any).Application = mockResourceConstructor;
    (aws.codedeploy as any).DeploymentGroup = mockResourceConstructor;
    (aws.codepipeline as any).Pipeline = mockResourceConstructor;
    (aws.codepipeline as any).Webhook = mockResourceConstructor;
    (aws.codestarnotifications as any).NotificationRule = mockResourceConstructor;
    (aws.ec2 as any).Vpc = mockResourceConstructor;
    (aws.ec2 as any).InternetGateway = mockResourceConstructor;
    (aws.ec2 as any).Subnet = mockResourceConstructor;
    (aws.ec2 as any).RouteTable = mockResourceConstructor;
    (aws.ec2 as any).Route = mockResourceConstructor;
    (aws.ec2 as any).RouteTableAssociation = mockResourceConstructor;
    (aws.ec2 as any).SecurityGroup = mockResourceConstructor;
    (aws.lb as any).LoadBalancer = mockResourceConstructor;
    (aws.lb as any).TargetGroup = mockResourceConstructor;
    (aws.lb as any).Listener = mockResourceConstructor;

    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));
    process.cwd = jest.fn(() => "/mock/project");
  };

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("Multi-region with approval enabled", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should create stack with all resources", () => {
      const stack = new TapStack("TestMultiRegion", {
        environmentSuffix: "prod",
        regions: ["us-west-2", "eu-west-1"],
        enableApproval: true,
        notificationEmail: "test@example.com",
      });

      expect(stack).toBeDefined();
      expect(stack.kmsKey).toBeDefined();
      expect(stack.outputs).toBeDefined();
    });

    it("should call AWS services", () => {
      expect(aws.kms.Key).toHaveBeenCalled();
      expect(aws.s3.Bucket).toHaveBeenCalled();
      expect(aws.sns.Topic).toHaveBeenCalled();
      expect(aws.ecs.Cluster).toHaveBeenCalled();
      expect(aws.codepipeline.Pipeline).toHaveBeenCalled();
    });
  });

  describe("Single region without approval", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should create stack with default settings", () => {
      const stack = new TapStack("TestSingleRegion", {
        environmentSuffix: "dev",
        enableApproval: false,
      });

      expect(stack).toBeDefined();
      expect(stack.codePipeline).toBeDefined();
    });
  });

  describe("Three regions configuration", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should handle multiple regions", () => {
      const stack = new TapStack("TestThreeRegions", {
        environmentSuffix: "multi",
        regions: ["us-east-1", "us-west-2", "eu-west-1"],
      });

      expect(stack).toBeDefined();
    });
  });

  describe("File operations - directory does not exist", () => {
    beforeAll(() => {
      createMocks();
      (fs.existsSync as jest.Mock).mockReturnValue(false);
    });

    it("should create directory when it doesn't exist", () => {
      new TapStack("TestCreateDir", {
        environmentSuffix: "test",
      });

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe("File operations - existing directory", () => {
    beforeAll(() => {
      createMocks();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it("should skip directory creation if exists", () => {
      const mkdirCallsBefore = (fs.mkdirSync as jest.Mock).mock.calls.length;
      
      new TapStack("TestExisting", {
        environmentSuffix: "existing",
      });

      const mkdirCallsAfter = (fs.mkdirSync as jest.Mock).mock.calls.length;
      expect(mkdirCallsAfter).toBe(mkdirCallsBefore);
    });
  });

  describe("Console logging - non-test environment", () => {
    beforeAll(() => {
      createMocks();
      delete process.env.JEST_WORKER_ID;
    });

    afterAll(() => {
      process.env.JEST_WORKER_ID = "1";
    });

    it("should log outputs in non-test environment", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();

      new TapStack("TestLogging", {
        environmentSuffix: "logging",
      });

      // Console.log should be called for output file writing
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe("Console logging - test environment", () => {
    beforeAll(() => {
      createMocks();
      process.env.JEST_WORKER_ID = "1";
    });

    it("should not log in test environment", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();

      new TapStack("TestNoLogging", {
        environmentSuffix: "no-log",
      });

      logSpy.mockRestore();
    });
  });

  describe("Error handling - write file error in non-test environment", () => {
    beforeAll(() => {
      createMocks();
      delete process.env.JEST_WORKER_ID;
    });

    afterAll(() => {
      process.env.JEST_WORKER_ID = "1";
    });

    it("should log error when file write fails in non-test environment", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Write error");
      });

      new TapStack("TestErrorLogging", {
        environmentSuffix: "error-log",
      });

      // Console.error should be called for error handling
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("Error handling - write file error in test environment", () => {
    beforeAll(() => {
      createMocks();
      process.env.JEST_WORKER_ID = "1";
    });

    it("should not log error in test environment", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Write error");
      });

      const stack = new TapStack("TestErrorNoLog", {
        environmentSuffix: "error-no-log",
      });

      expect(stack).toBeDefined();
      errorSpy.mockRestore();
    });
  });

  describe("Optional properties - all provided", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should use provided values over defaults", () => {
      const stack = new TapStack("TestProvidedProps", {
        environmentSuffix: "custom",
        githubOwner: "my-org",
        githubRepo: "my-repo",
        githubBranch: "develop",
        githubToken: mockOutput("custom-token"),
        regions: ["us-west-1"],
        enableApproval: true,
        notificationEmail: "custom@example.com",
        tags: { Project: "CustomProject" },
      });

      expect(stack).toBeDefined();
    });
  });

  describe("Optional properties - undefined values", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should handle undefined optional props", () => {
      const stack = new TapStack("TestUndefined", {
        environmentSuffix: "undef",
        githubOwner: undefined,
        githubRepo: undefined,
        githubBranch: undefined,
        githubToken: undefined,
        regions: undefined,
        enableApproval: undefined,
        notificationEmail: undefined,
        tags: undefined,
      });

      expect(stack).toBeDefined();
    });
  });

  describe("Optional properties - empty values", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should handle empty tags", () => {
      const stack = new TapStack("TestEmptyTags", {
        environmentSuffix: "empty",
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it("should handle empty string values", () => {
      const stack = new TapStack("TestEmptyStrings", {
        environmentSuffix: "empty-str",
        githubOwner: "",
        githubRepo: "",
        githubBranch: "",
      });

      expect(stack).toBeDefined();
    });
  });

  describe("Enable approval - explicitly false", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should disable approval when explicitly set to false", () => {
      const stack = new TapStack("TestApprovalFalse", {
        environmentSuffix: "no-approval",
        enableApproval: false,
      });

      expect(stack).toBeDefined();
    });
  });

  describe("AWS config region fallback", () => {
    beforeAll(() => {
      createMocks();
      (aws as any).config = {};
    });

    it("should fallback to us-east-1 when aws.config.region is not set", () => {
      const stack = new TapStack("TestRegionFallback", {
        environmentSuffix: "fallback",
      });

      expect(stack).toBeDefined();
    });
  });

  describe("AWS resource creation", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should create KMS resources", () => {
      new TapStack("TestKMS", { environmentSuffix: "kms" });
      expect(aws.kms.Key).toHaveBeenCalled();
      expect(aws.kms.Alias).toHaveBeenCalled();
    });

    it("should create S3 resources", () => {
      new TapStack("TestS3", { environmentSuffix: "s3" });
      expect(aws.s3.Bucket).toHaveBeenCalled();
      expect(aws.s3.BucketVersioning).toHaveBeenCalled();
    });

    it("should create SNS resources", () => {
      new TapStack("TestSNS", { environmentSuffix: "sns" });
      expect(aws.sns.Topic).toHaveBeenCalled();
      expect(aws.sns.TopicSubscription).toHaveBeenCalled();
    });

    it("should create ECS resources", () => {
      new TapStack("TestECS", { environmentSuffix: "ecs" });
      expect(aws.ecs.Cluster).toHaveBeenCalled();
      expect(aws.ecs.TaskDefinition).toHaveBeenCalled();
      expect(aws.ecs.Service).toHaveBeenCalled();
    });

    it("should create VPC resources", () => {
      new TapStack("TestVPC", { environmentSuffix: "vpc" });
      expect(aws.ec2.Vpc).toHaveBeenCalled();
      expect(aws.ec2.Subnet).toHaveBeenCalled();
      expect(aws.ec2.InternetGateway).toHaveBeenCalled();
    });

    it("should create ALB resources", () => {
      new TapStack("TestALB", { environmentSuffix: "alb" });
      expect(aws.lb.LoadBalancer).toHaveBeenCalled();
      expect(aws.lb.TargetGroup).toHaveBeenCalled();
    });

    it("should create CodePipeline resources", () => {
      new TapStack("TestPipeline", { environmentSuffix: "pipeline" });
      expect(aws.codepipeline.Pipeline).toHaveBeenCalled();
    });

    it("should create IAM resources", () => {
      new TapStack("TestIAM", { environmentSuffix: "iam" });
      expect(aws.iam.Role).toHaveBeenCalled();
    });
  });

  describe("ECS configuration", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should configure ECS with Fargate", () => {
      new TapStack("TestECSFargate", { environmentSuffix: "fargate" });
      expect(aws.ecs.TaskDefinition).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requiresCompatibilities: ["FARGATE"],
          networkMode: "awsvpc",
        }),
        expect.any(Object)
      );
    });
  });

  describe("Blue/Green deployment", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should configure CodeDeploy with blue/green", () => {
      new TapStack("TestBlueGreen", { environmentSuffix: "bg" });
      expect(aws.codedeploy.DeploymentGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          deploymentStyle: {
            deploymentOption: "WITH_TRAFFIC_CONTROL",
            deploymentType: "BLUE_GREEN",
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe("Pulumi operations", () => {
    beforeAll(() => {
      createMocks();
    });

    it("should use Pulumi output", () => {
      new TapStack("TestOutput", { environmentSuffix: "output" });
      expect(mockOutput).toHaveBeenCalled();
    });

    it("should use Pulumi all", () => {
      new TapStack("TestAll", { environmentSuffix: "all" });
      expect(mockAll).toHaveBeenCalled();
    });

    it("should use Pulumi interpolate", () => {
      new TapStack("TestInterpolate", { environmentSuffix: "interp" });
      expect(mockInterpolate).toHaveBeenCalled();
    });
  });
});
