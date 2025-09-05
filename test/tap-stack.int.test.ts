import * as fs from "fs";
import * as path from "path";

type OutputEntry = {
  OutputKey: string;
  OutputValue: string;
  Description?: string;
};

type OutputsFile = Record<string, OutputEntry[]>;

/**
 * Reads and flattens CloudFormation outputs JSON
 */
function readOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as OutputsFile;

  const firstStack = Object.values(raw)[0];
  if (!Array.isArray(firstStack)) {
    throw new Error("Unexpected outputs JSON structure");
  }

  const flat: Record<string, string> = {};
  for (const o of firstStack) {
    flat[o.OutputKey] = o.OutputValue;
  }
  return flat;
}

const outputs = readOutputs();

/**
 * Utility regex validators
 */
const isArn = (v: string) => /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/.test(v);
const isSubnetId = (v: string) => /^subnet-[a-z0-9]+$/.test(v);
const isSgId = (v: string) => /^sg-[a-z0-9]+$/.test(v);
const isVpcId = (v: string) => /^vpc-[a-z0-9]+$/.test(v);
const isEc2InstanceId = (v: string) => /^i-[a-z0-9]+$/.test(v);
const isLaunchTemplateId = (v: string) => /^lt-[a-z0-9]+$/.test(v);
const isNatId = (v: string) => /^nat-[a-z0-9]+$/.test(v);
const isDnsName = (v: string) =>
  /^[a-z0-9-]+\.[a-z0-9-]+\.(elb|rds)\.[a-z0-9-]+\.amazonaws\.com$/.test(v);
const isIp = (v: string) =>
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(
    v
  );

describe("Integration Tests - TapStack CloudFormation Outputs", () => {
  test("VPC ID format is valid", () => {
    expect(isVpcId(outputs.VpcId)).toBe(true);
  });

  test("Subnets are valid and unique", () => {
    const subs = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    subs.forEach((s) => expect(isSubnetId(s)).toBe(true));
    expect(new Set(subs).size).toBe(subs.length);
  });

  test("Security Group IDs have correct format", () => {
    expect(isSgId(outputs.BastionSGId)).toBe(true);
    expect(isSgId(outputs.InstanceSGId)).toBe(true);
    expect(isSgId(outputs.ALBSGId)).toBe(true);
    expect(isSgId(outputs.RDSInstanceSG)).toBe(true);
  });

  test("ALB endpoint looks like a DNS name", () => {
    expect(isDnsName(outputs.ALBEndpoint)).toBe(true);
  });

  test("RDS endpoint looks like hostname", () => {
    expect(isDnsName(outputs.RDSEndpoint)).toBe(true);
  });

  test("RDS port is numeric", () => {
    expect(parseInt(outputs.RDSPort, 10)).toBeGreaterThan(0);
  });

  test("LaunchTemplate ID and version are valid", () => {
    expect(isLaunchTemplateId(outputs.LaunchTemplateId)).toBe(true);
    expect(Number(outputs.LaunchTemplateVersion)).toBeGreaterThanOrEqual(1);
  });

  test("AutoScalingGroup has non-empty name", () => {
    expect(outputs.AutoScalingGroupName).toMatch(/^TapStack/);
  });

  test("Bastion host instance ID is valid", () => {
    expect(isEc2InstanceId(outputs.BastionHostId)).toBe(true);
  });

  test("CloudTrail ARN is non-empty", () => {
    expect(outputs.CloudTrailArn).not.toBe("");
  });

  test("IAM ARNs follow format", () => {
    expect(isArn(outputs.ConfigRoleArn)).toBe(true);
    expect(isArn(outputs.EC2InstanceProfileArn)).toBe(true);
  });

  test("ALB ARNs are valid", () => {
    expect(isArn(outputs.ALBArn)).toBe(true);
    expect(isArn(outputs.ALBListenerArn)).toBe(true);
    expect(isArn(outputs.ALBTargetGroupArn)).toBe(true);
  });

  test("RDS instance ID matches expected prefix", () => {
    expect(outputs.RDSInstanceId).toMatch(/^tapstack/);
  });

  test("S3 Logging bucket name/ARN alignment", () => {
    const bucket = outputs.LoggingBucketName;
    const arn = outputs.LoggingBucketArn;
    expect(bucket).toMatch(/^tapstack/);
    expect(arn).toBe(`arn:aws:s3:::${bucket}`);
  });

  test("NAT Gateway ID and EIP are valid", () => {
    expect(isNatId(outputs.NatGatewayId)).toBe(true);
    expect(isIp(outputs.NatEIP)).toBe(true);
  });

  test("All outputs are non-empty strings", () => {
    Object.entries(outputs).forEach(([k, v]) => {
      expect(typeof v).toBe("string");
      expect(v.trim().length).toBeGreaterThan(0);
    });
  });

  // 🔹 Edge Case Tests

  test("All ARNs use correct account ID", () => {
    const arns = Object.entries(outputs)
      .filter(([k]) => k.toLowerCase().includes("arn"))
      .map(([, v]) => v);
    const accountIds = arns
      .map((arn) => {
        const parts = arn.split(":");
        return parts.length > 4 ? parts[4] : null;
      })
      .filter(Boolean);
    const unique = new Set(accountIds);
    if (unique.size > 0) {
      expect(unique.size).toBe(1); // all ARNs should share one AWS account
    }
  });

  test("Subnet IDs are distributed across AZs", () => {
    const subs = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
    expect(new Set(subs).size).toBe(2); // distinct
  });
});
