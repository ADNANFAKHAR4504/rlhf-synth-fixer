import { App, Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

/**
 * Parse the actual cdk.tf.json string emitted by CDKTF synth.
 * Works across CDKTF versions and avoids flaky fullSynth shapes.
 */
function parseSynth(stack: any): any {
  const out = Testing.synth(stack);
  const jsonStr = Array.isArray(out) ? out[0] : out;
  return JSON.parse(jsonStr);
}

function resourceMap(parsed: any): Record<string, Record<string, any>> {
  return (parsed && parsed.resource) || {};
}

function flattenTypes(resBlock: Record<string, Record<string, any>>): string[] {
  const types: string[] = [];
  Object.entries(resBlock).forEach(([type, instances]) => {
    if (instances && typeof instances === "object") {
      Object.keys(instances).forEach(() => types.push(type));
    }
  });
  return types;
}

function hasType(types: string[], needle: string): boolean {
  return types.some((t) => t.includes(needle));
}

describe("TapStack (unit)", () => {
  afterEach(() => {
    // clean env between tests so branches execute as intended
    delete process.env.AWS_REGION;
    delete process.env.ENVIRONMENT;
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  it("synthesizes and contains core resources (dev path)", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.ENVIRONMENT = "dev";
    process.env.ENVIRONMENT_SUFFIX = "devtest";

    const app = new App();
    const stack = new TapStack(app, "TestStackDev");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // minimal, stable checks
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_iam_instance_profile")).toBeTruthy();

    expect(hasType(types, "aws_instance")).toBeTruthy();
    expect(hasType(types, "aws_security_group")).toBeTruthy();

    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_s3_bucket_server_side_encryption_configuration")).toBeTruthy();

    expect(hasType(types, "aws_cloudwatch_dashboard")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_metric_alarm")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_log_group")).toBeTruthy();
    expect(hasType(types, "aws_sns_topic")).toBeTruthy();
  });

  it("synthesizes and contains core resources (production path)", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.ENVIRONMENT = "production";
    process.env.ENVIRONMENT_SUFFIX = "prodtest";

    const app = new App();
    const stack = new TapStack(app, "TestStackProd");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // same minimal checks as dev
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_iam_instance_profile")).toBeTruthy();

    expect(hasType(types, "aws_instance")).toBeTruthy();
    expect(hasType(types, "aws_security_group")).toBeTruthy();

    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_s3_bucket_server_side_encryption_configuration")).toBeTruthy();

    expect(hasType(types, "aws_cloudwatch_dashboard")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_metric_alarm")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_log_group")).toBeTruthy();
    expect(hasType(types, "aws_sns_topic")).toBeTruthy();
  });

  it("synthesizes with defaults when no env vars are set (default branch path)", () => {
    // intentionally leave AWS_REGION / ENVIRONMENT / ENVIRONMENT_SUFFIX undefined
    const app = new App();
    const stack = new TapStack(app, "TestStackDefault");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // minimal checks to assert resources exist on the default path
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    // a couple of core services to keep it stable
    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_log_group")).toBeTruthy();
  });

  it("synthesizes for a non-standard env (staging) to hit else branches", () => {
    process.env.AWS_REGION = "us-east-1";
    process.env.ENVIRONMENT = "staging"; // exercise non-dev/non-production branch
    process.env.ENVIRONMENT_SUFFIX = "stagetest";

    const app = new App();
    const stack = new TapStack(app, "TestStackStaging");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // same minimal existence checks
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_iam_instance_profile")).toBeTruthy();

    expect(hasType(types, "aws_instance")).toBeTruthy();
    expect(hasType(types, "aws_security_group")).toBeTruthy();

    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_dashboard")).toBeTruthy();
  });
});