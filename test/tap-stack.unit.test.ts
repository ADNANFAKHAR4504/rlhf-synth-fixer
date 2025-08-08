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
  it("synthesizes and contains core resources (dev path)", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.ENVIRONMENT = "dev";
    process.env.ENVIRONMENT_SUFFIX = "devtest";

    const app = new App();
    const stack = new TapStack(app, "TestStackDev");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    // quick debug print if needed
    // console.log("Resource types (dev):", Array.from(new Set(types)).sort());

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

    // console.log("Resource types (prod):", Array.from(new Set(types)).sort());

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
});
