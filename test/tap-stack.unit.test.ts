import { App, Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

describe("TapStack Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("TapStack instantiates successfully with props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestTapStackWithProps", {
      environmentSuffix: "prod",
      stateBucket: "test-bucket",
      stateBucketRegion: "us-west-2",
      awsRegion: "us-west-2",
      defaultTags: {
        tags: {
          Environment: "prod",
          Owner: "team",
          Service: "core",
        },
      },
    });

    const synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test("TapStack instantiates with default props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestTapStackDefault");
    const synthesized = Testing.synth(stack);
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test("VPC resources created correctly", () => {
    const app = new App();
    const stack = new TapStack(app, "VpcTest");
    const resources = Testing.synth(stack).resources;

    const vpcs = resources.filter((r) => r.type === "aws_vpc");
    const igw = resources.find((r) => r.type === "aws_internet_gateway");
    const subnets = resources.filter((r) => r.type === "aws_subnet");
    const natGws = resources.filter((r) => r.type === "aws_nat_gateway");
    const flowLogs = resources.filter((r) => r.type === "aws_flow_log");

    expect(vpcs.length).toBe(1);
    expect(igw).toBeDefined();
    expect(subnets.length).toBeGreaterThanOrEqual(6);
    expect(natGws.length).toBeGreaterThanOrEqual(1);
    expect(flowLogs.length).toBe(1);
  });

  test("IAM roles and profiles created", () => {
    const app = new App();
    const stack = new TapStack(app, "IamTest");
    const resources = Testing.synth(stack).resources;

    expect(resources.find((r) => r.type === "aws_iam_role")).toBeDefined();
    expect(resources.find((r) => r.type === "aws_iam_instance_profile")).toBeDefined();
  });

  test("EC2 instance and SG created", () => {
    const app = new App();
    const stack = new TapStack(app, "Ec2Test");
    const resources = Testing.synth(stack).resources;

    expect(resources.find((r) => r.type === "aws_instance")).toBeDefined();
    expect(resources.find((r) => r.type === "aws_security_group")).toBeDefined();
  });

  test("S3 buckets and encryption config created", () => {
    const app = new App();
    const stack = new TapStack(app, "S3Test");
    const resources = Testing.synth(stack).resources;

    const s3Buckets = resources.filter((r) => r.type === "aws_s3_bucket");
    const encryption = resources.filter(
      (r) => r.type === "aws_s3_bucket_server_side_encryption_configuration"
    );

    expect(s3Buckets.length).toBeGreaterThanOrEqual(2);
    expect(encryption.length).toBeGreaterThanOrEqual(2);
  });

  test("CloudWatch alarms and dashboard created", () => {
    const app = new App();
    const stack = new TapStack(app, "CloudwatchTest");
    const resources = Testing.synth(stack).resources;

    expect(resources.find((r) => r.type === "aws_cloudwatch_dashboard")).toBeDefined();
    expect(resources.find((r) => r.type === "aws_cloudwatch_metric_alarm")).toBeDefined();
    expect(resources.find((r) => r.type === "aws_sns_topic")).toBeDefined();
  });
});
