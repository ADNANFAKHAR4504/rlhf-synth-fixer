// CI trigger - no functional change
import { App, Testing, TerraformStack } from "cdktf";
import { TapStack } from "../lib/tap-stack";
import { VpcStack } from "../lib/vpc-stack";
import { IamStack } from "../lib/iam-stack";
import { Ec2Stack } from "../lib/ec2-stack";
import { S3Stack } from "../lib/s3-stack";
import { CloudwatchStack } from "../lib/cloudwatch-stack";

/* ----------------- helpers ----------------- */

function parseSynth(stack: TerraformStack): any {
  const out = Testing.synth(stack);
  const jsonStr = Array.isArray(out) ? out[0] : out;
  return JSON.parse(jsonStr);
}

function resourceBlock(parsed: any): Record<string, Record<string, any>> {
  return (parsed && parsed.resource) || {};
}

function resourcesByType(
  rb: Record<string, Record<string, any>>,
  type: string
): any[] {
  const obj = rb[type] || {};
  return Object.values(obj);
}

function typesFlat(rb: Record<string, Record<string, any>>): string[] {
  const acc: string[] = [];
  Object.entries(rb).forEach(([t, inst]) => {
    if (inst && typeof inst === "object") {
      Object.keys(inst).forEach(() => acc.push(t));
    }
  });
  return acc;
}

function num(val: any): number | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "number") return val;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

function get(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
  }
  return undefined;
}

/* Ensure a consistent region for stacks that read from env */
beforeAll(() => {
  process.env.AWS_REGION = "us-west-2";
});

/* ----------------- tests ----------------- */

describe("TapStack constructor (coverage only)", () => {
  it("constructs with production env/props", () => {
    process.env.ENVIRONMENT = "production";
    const app = new App();
    const ts = new TapStack(app, "TapProd", {
      awsRegion: "us-west-2",
      environmentSuffix: "prod",
      defaultTags: { tags: { Owner: "x", Service: "y" } },
    });
    expect(ts).toBeDefined();
  });

  it("constructs with defaults when no env set", () => {
    delete process.env.ENVIRONMENT;
    const app = new App();
    const ts = new TapStack(app, "TapDev");
    expect(ts).toBeDefined();
  });
});

describe("VpcStack", () => {
  it("creates VPC, subnets, IGW, NAT, FlowLogs (prod path)", () => {
    const app = new App();
    const vpc = new VpcStack(app, "Vpc", {
      environment: "production",
      region: "us-west-2",
      vpcCidr: "10.0.0.0/16",
      azs: ["us-west-2a", "us-west-2b", "us-west-2c"],
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
      privateSubnetCidrs: ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"],
      databaseSubnetCidrs: ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"],
      commonTags: { Env: "prod" },
    });

    const rb = resourceBlock(parseSynth(vpc));
    const t = typesFlat(rb);
    const has = (s: string) => t.some((x) => x.includes(s));

    expect(has("aws_vpc")).toBeTruthy();
    expect(t.filter((x) => x.includes("aws_subnet")).length).toBeGreaterThanOrEqual(9);
    expect(has("aws_internet_gateway")).toBeTruthy();
    expect(has("aws_nat_gateway")).toBeTruthy();
    expect(has("aws_flow_log")).toBeTruthy();

    // flow log retention 365 in prod
    const logs = resourcesByType(rb, "aws_cloudwatch_log_group");
    expect(
      logs.some((lg) => num(get(lg, "retention_in_days", "retentionInDays")) === 365)
    ).toBeTruthy();
  });
});

describe("IamStack", () => {
  it("creates IAM roles, instance profile, and inline policy", () => {
    const app = new App();
    const iam = new IamStack(app, "Iam", {
      environment: "dev",
      commonTags: { Team: "infra" },
    });

    const rb = resourceBlock(parseSynth(iam));
    expect(resourcesByType(rb, "aws_iam_role").length).toBeGreaterThanOrEqual(3);
    expect(resourcesByType(rb, "aws_iam_instance_profile").length).toBeGreaterThanOrEqual(1);
    expect(resourcesByType(rb, "aws_iam_role_policy").length).toBeGreaterThanOrEqual(1);
  });
});

describe("Ec2Stack", () => {
  it("dev path: EC2 + SG, volume 10, log retention 30", () => {
    const app = new App();
    const ec2 = new Ec2Stack(app, "Ec2Dev", {
      environment: "development",
      vpcId: "vpc-123",
      subnetId: "subnet-abc",
      instanceType: "t3.micro",
      iamInstanceProfile: "ec2-profile",
      allowedCidrBlocks: ["0.0.0.0/0"],
      commonTags: { Env: "dev" },
    });

    const rb = resourceBlock(parseSynth(ec2));
    expect(resourcesByType(rb, "aws_instance").length).toBeGreaterThanOrEqual(1);
    expect(resourcesByType(rb, "aws_security_group").length).toBeGreaterThanOrEqual(1);

    const inst = resourcesByType(rb, "aws_instance")[0];
    const rbd = (get(inst, "root_block_device") || get(inst, "rootBlockDevice")) as any;
    const first = Array.isArray(rbd) ? rbd[0] : rbd;
    expect(num(get(first, "volume_size", "volumeSize"))).toBe(10);

    const logs = resourcesByType(rb, "aws_cloudwatch_log_group");
    expect(
      logs.some((lg) => num(get(lg, "retention_in_days", "retentionInDays")) === 30)
    ).toBeTruthy();
  });

  it("prod path: volume 20, log retention 365", () => {
    const app = new App();
    const ec2 = new Ec2Stack(app, "Ec2Prod", {
      environment: "production",
      vpcId: "vpc-123",
      subnetId: "subnet-abc",
      instanceType: "t3.micro",
      iamInstanceProfile: "ec2-profile",
      allowedCidrBlocks: ["1.2.3.4/32"],
      commonTags: { Env: "prod" },
    });

    const rb = resourceBlock(parseSynth(ec2));
    const inst = resourcesByType(rb, "aws_instance")[0];
    const rbd = (get(inst, "root_block_device") || get(inst, "rootBlockDevice")) as any;
    const first = Array.isArray(rbd) ? rbd[0] : rbd;
    expect(num(get(first, "volume_size", "volumeSize"))).toBe(20);

    const logs = resourcesByType(rb, "aws_cloudwatch_log_group");
    expect(
      logs.some((lg) => num(get(lg, "retention_in_days", "retentionInDays")) === 365)
    ).toBeTruthy();
  });
});

describe("S3Stack", () => {
  it("dev path: buckets + encryption + logging + lifecycle", () => {
    const app = new App();
    const s3 = new S3Stack(app, "S3Dev", {
      environment: "development",
      bucketName: "dev-assets-bucket",
      enableVersioning: true,
      lifecycleRules: [
        {
          id: "expire-old-objects",
          status: "Enabled",
          expiration: { days: 30 },
          noncurrent_version_expiration: { noncurrent_days: 15 },
        },
      ],
      commonTags: { Env: "dev" },
    });

    const rb = resourceBlock(parseSynth(s3));
    expect(resourcesByType(rb, "aws_s3_bucket").length).toBeGreaterThanOrEqual(2);
    expect(
      resourcesByType(rb, "aws_s3_bucket_server_side_encryption_configuration").length
    ).toBeGreaterThanOrEqual(2);
    expect(resourcesByType(rb, "aws_s3_bucket_logging").length).toBeGreaterThanOrEqual(1);
    expect(
      resourcesByType(rb, "aws_s3_bucket_lifecycle_configuration").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("prod path: lifecycle absent", () => {
    const app = new App();
    const s3 = new S3Stack(app, "S3Prod", {
      environment: "production",
      bucketName: "prod-assets-bucket",
      enableVersioning: true,
      lifecycleRules: [], // prod path
      commonTags: { Env: "prod" },
    });

    const rb = resourceBlock(parseSynth(s3));
    expect(resourcesByType(rb, "aws_s3_bucket").length).toBeGreaterThanOrEqual(2);
    expect(resourcesByType(rb, "aws_s3_bucket_lifecycle_configuration").length).toBe(0);
  });
});

describe("CloudwatchStack", () => {
  it("dev path: dashboard + alarms + topic, threshold 90, retention 30", () => {
    const app = new App();
    const cw = new CloudwatchStack(app, "CWDev", {
      environment: "development",
      instanceId: "i-abc",
      commonTags: { Env: "dev" },
    });

    const rb = resourceBlock(parseSynth(cw));
    expect(resourcesByType(rb, "aws_cloudwatch_dashboard").length).toBe(1);
    expect(resourcesByType(rb, "aws_sns_topic").length).toBe(1);

    const alarms = resourcesByType(rb, "aws_cloudwatch_metric_alarm");
    expect(alarms.length).toBeGreaterThanOrEqual(2);
    const highCpu = alarms.find((a) =>
      String(get(a, "alarm_name", "alarmName")).includes("high-cpu-utilization")
    );
    expect(highCpu).toBeDefined();
    expect(num(get(highCpu, "threshold"))).toBe(90);

    const logs = resourcesByType(rb, "aws_cloudwatch_log_group");
    expect(
      logs.some((lg) => num(get(lg, "retention_in_days", "retentionInDays")) === 30)
    ).toBeTruthy();
  });

  it("prod path: threshold 80, retention 365", () => {
    const app = new App();
    const cw = new CloudwatchStack(app, "CWProd", {
      environment: "production",
      instanceId: "i-def",
      commonTags: { Env: "prod" },
    });

    const rb = resourceBlock(parseSynth(cw));
    const alarms = resourcesByType(rb, "aws_cloudwatch_metric_alarm");
    const highCpu = alarms.find((a) =>
      String(get(a, "alarm_name", "alarmName")).includes("high-cpu-utilization")
    );
    expect(highCpu).toBeDefined();
    expect(num(get(highCpu, "threshold"))).toBe(80);

    const logs = resourcesByType(rb, "aws_cloudwatch_log_group");
    expect(
      logs.some((lg) => num(get(lg, "retention_in_days", "retentionInDays")) === 365)
    ).toBeTruthy();
  });
});
// pipeline trigger 1754612779
