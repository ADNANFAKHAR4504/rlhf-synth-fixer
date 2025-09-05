/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";
import * as path from "path";

/**
 * Integration test source:
 * We expect a file at cfn-outputs/all-outputs.json that contains the
 * CloudFormation outputs after a successful stack deploy.
 *
 * Supported JSON shapes:
 *  1) { "VPCId": "vpc-123", "AlbDnsName": "..." }                // flat map
 *  2) [{ "OutputKey":"VPCId", "OutputValue":"..."}, ...]         // array of outputs
 *  3) { "Stacks":[{"Outputs":[{OutputKey,OutputValue}, ...]}] }  // describe-stacks format
 */
function loadOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(
      `Outputs file not found at ${p}. Please export your CFN stack outputs to this path.`
    );
  }
  const raw = fs.readFileSync(p, "utf8").trim();
  if (!raw) throw new Error("Outputs file is empty");
  const data = JSON.parse(raw);

  // If it's already a flat map of key -> value
  if (data && typeof data === "object" && !Array.isArray(data)) {
    // Detect "Stacks" format
    if (Array.isArray(data.Stacks) && data.Stacks[0]?.Outputs) {
      const map: Record<string, string> = {};
      for (const o of data.Stacks[0].Outputs) {
        if (o?.OutputKey) map[o.OutputKey] = o.OutputValue ?? "";
      }
      return map;
    }
    // Detect { Outputs: [...] }
    if (Array.isArray(data.Outputs)) {
      const map: Record<string, string> = {};
      for (const o of data.Outputs) {
        if (o?.OutputKey) map[o.OutputKey] = o.OutputValue ?? "";
      }
      return map;
    }
    // Assume it's already a flat object of key/value strings
    // (If values are nested, coerce to string)
    const map: Record<string, string> = {};
    for (const [k, v] of Object.entries<any>(data)) {
      map[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    return map;
  }

  // If it's an array of output objects
  if (Array.isArray(data)) {
    const map: Record<string, string> = {};
    for (const o of data) {
      if (o?.OutputKey) map[o.OutputKey] = o.OutputValue ?? "";
    }
    if (Object.keys(map).length > 0) return map;
  }

  throw new Error("Unrecognized outputs JSON shape.");
}

/** Small helpers */
function req(outputs: Record<string, string>, key: string): string {
  const val = outputs[key];
  if (typeof val !== "string") {
    throw new Error(`Missing or non-string Output: ${key}`);
  }
  return val.trim();
}
function splitCsvIds(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}
function isLowercaseBucketName(name: string): boolean {
  // S3 bucket name rules are many; we enforce simple & safe checks:
  // - lowercase only
  // - 3..63 chars
  // - allowed chars: a-z, 0-9, ., -
  return (
    name.length >= 3 &&
    name.length <= 63 &&
    name.toLowerCase() === name &&
    /^[a-z0-9.-]+$/.test(name) &&
    !name.startsWith(".") &&
    !name.endsWith(".") &&
    !name.includes("..")
  );
}
function extractArnParts(arn: string): { partition: string; service: string; region: string; account: string; rest: string } | null {
  // arn:partition:service:region:account:resource
  const m = /^arn:(aws[a-z-]*)?:([^:]+):([^:]*):([^:]*):(.+)$/.exec(arn);
  if (!m) return null;
  return {
    partition: m[1] || "aws",
    service: m[2],
    region: m[3],
    account: m[4],
    rest: m[5],
  };
}

describe("TapStack – Integration tests using cfn-outputs/all-outputs.json", () => {
  const outputs = loadOutputs();

  // ---- Presence & non-empty ----
  const expectedKeys = [
    "VPCId",
    "PublicSubnetIds",
    "PrivateAppSubnetIds",
    "PrivateDbSubnetIds",
    "AlbArn",
    "AlbDnsName",
    "TargetGroupArn",
    "AutoScalingGroupName",
    "LaunchTemplateId",
    "InstanceRoleArn",
    "InstanceProfileName",
    "LogsBucketName",
    "RdsEndpointAddress",
    "RdsArn",
    "DbSubnetGroupName",
  ];

  test("1) All expected outputs exist and are non-empty strings", () => {
    for (const k of expectedKeys) {
      expect(typeof outputs[k]).toBe("string");
      const v = outputs[k].trim();
      expect(v.length).toBeGreaterThan(0);
      // No accidental 'undefined' / 'null' text
      expect(v.toLowerCase()).not.toContain("undefined");
      expect(v.toLowerCase()).not.toContain("null");
    }
  });

  test("2) VPCId format looks valid", () => {
    const vpc = req(outputs, "VPCId");
    expect(/^vpc-[0-9a-f]+$/.test(vpc)).toBe(true);
  });

  test("3) PublicSubnetIds and Private* subnet lists contain exactly 2 valid subnet IDs each", () => {
    const pub = splitCsvIds(req(outputs, "PublicSubnetIds"));
    const app = splitCsvIds(req(outputs, "PrivateAppSubnetIds"));
    const db  = splitCsvIds(req(outputs, "PrivateDbSubnetIds"));

    expect(pub.length).toBe(2);
    expect(app.length).toBe(2);
    expect(db.length).toBe(2);

    const subnetRe = /^subnet-[0-9a-f]+$/;
    for (const s of [...pub, ...app, ...db]) {
      expect(subnetRe.test(s)).toBe(true);
    }
  });

  test("4) No duplicate subnets across all subnet outputs", () => {
    const all = [
      ...splitCsvIds(req(outputs, "PublicSubnetIds")),
      ...splitCsvIds(req(outputs, "PrivateAppSubnetIds")),
      ...splitCsvIds(req(outputs, "PrivateDbSubnetIds")),
    ];
    const set = new Set(all);
    expect(set.size).toBe(all.length);
  });

  test("5) ALB ARN is well-formed and in us-east-1", () => {
    const arn = req(outputs, "AlbArn");
    const parts = extractArnParts(arn);
    expect(parts).not.toBeNull();
    expect(parts!.service).toBe("elasticloadbalancing");
    expect(parts!.region).toBe("us-east-1");
    // minimal shape loadbalancer/app/<name>/<id>
    expect(/^loadbalancer\/[a-z]+\/[A-Za-z0-9-]+\/[A-Za-z0-9]+$/i.test(parts!.rest)).toBe(true);
  });

  test("6) ALB DNS name looks like an AWS ELB DNS and has no protocol prefix", () => {
    const dns = req(outputs, "AlbDnsName");
    expect(dns.startsWith("http://") || dns.startsWith("https://")).toBe(false);
    // ELB DNS generally ends with elb.amazonaws.com (or .com.cn)
    expect(/\.elb\.amazonaws\.com(\.cn)?$/.test(dns)).toBe(true);
    // No spaces
    expect(/\s/.test(dns)).toBe(false);
  });

  test("7) TargetGroup ARN is well-formed and in us-east-1", () => {
    const arn = req(outputs, "TargetGroupArn");
    const parts = extractArnParts(arn);
    expect(parts).not.toBeNull();
    expect(parts!.service).toBe("elasticloadbalancing");
    expect(parts!.region).toBe("us-east-1");
    // targetgroup/<name>/<id-hex>
    expect(/^targetgroup\/[A-Za-z0-9-]+\/[0-9a-f]+$/.test(parts!.rest)).toBe(true);
  });

  test("8) AutoScalingGroupName is non-empty and reasonable", () => {
    const asg = req(outputs, "AutoScalingGroupName");
    expect(asg.length).toBeGreaterThan(0);
    expect(asg.length).toBeLessThanOrEqual(255);
    // valid-ish name chars
    expect(/^[A-Za-z0-9\-]+$/.test(asg)).toBe(true);
  });

  test("9) LaunchTemplateId has 'lt-' prefix and a numeric version suffix", () => {
    const lt = req(outputs, "LaunchTemplateId");
    // lt-<hex> : <number>
    const m = /^lt-[0-9a-fA-F]+:(\d+)$/.exec(lt);
    expect(m).not.toBeNull();
    const version = m ? parseInt(m[1], 10) : 0;
    expect(version).toBeGreaterThanOrEqual(1);
  });

  test("10) InstanceRoleArn is a valid IAM role ARN in us-east-1 account", () => {
    const arn = req(outputs, "InstanceRoleArn");
    const parts = extractArnParts(arn);
    expect(parts).not.toBeNull();
    expect(parts!.service).toBe("iam");
    expect(/^\d{12}$/.test(parts!.account)).toBe(true);
    // role/...
    expect(/^role\/.+$/.test(parts!.rest)).toBe(true);
  });

  test("11) InstanceProfileName is present and not just whitespace", () => {
    const ip = req(outputs, "InstanceProfileName");
    expect(ip.length).toBeGreaterThan(0);
    expect(/\s/.test(ip)).toBe(false);
  });

  test("12) LogsBucketName looks like a valid S3 bucket name", () => {
    const bucket = req(outputs, "LogsBucketName");
    expect(isLowercaseBucketName(bucket)).toBe(true);
  });

  test("13) RdsEndpointAddress looks like an AWS RDS endpoint (no port, no protocol)", () => {
    const ep = req(outputs, "RdsEndpointAddress");
    // No protocol, no spaces
    expect(ep.startsWith("http://") || ep.startsWith("https://")).toBe(false);
    expect(/\s/.test(ep)).toBe(false);
    // ends with rds.amazonaws.com (global) or .com.cn variants
    expect(/\.rds\.amazonaws\.com(\.cn)?$/.test(ep)).toBe(true);
    // contains at least one dot
    expect(ep.includes(".")).toBe(true);
  });

  test("14) RdsArn is a valid DB ARN in us-east-1", () => {
    const arn = req(outputs, "RdsArn");
    const parts = extractArnParts(arn);
    expect(parts).not.toBeNull();
    expect(parts!.service).toBe("rds");
    expect(parts!.region).toBe("us-east-1");
    // db:<identifier>
    expect(/^db:.+/.test(parts!.rest)).toBe(true);
  });

  test("15) DbSubnetGroupName exists, no whitespace", () => {
    const name = req(outputs, "DbSubnetGroupName");
    expect(name.length).toBeGreaterThan(0);
    expect(/\s/.test(name)).toBe(false);
  });

  test("16) Cross-ARN consistency: ALB/TargetGroup/RDS share same account and region", () => {
    const alb = extractArnParts(req(outputs, "AlbArn"))!;
    const tg  = extractArnParts(req(outputs, "TargetGroupArn"))!;
    const rds = extractArnParts(req(outputs, "RdsArn"))!;
    expect(alb.region).toBe("us-east-1");
    expect(tg.region).toBe("us-east-1");
    expect(rds.region).toBe("us-east-1");
    expect(alb.account).toBe(tg.account);
    expect(tg.account).toBe(rds.account);
  });

  test("17) CSV outputs contain no extra whitespace and no empty items", () => {
    const fields = ["PublicSubnetIds", "PrivateAppSubnetIds", "PrivateDbSubnetIds"];
    for (const f of fields) {
      const raw = outputs[f];
      // should not have leading/trailing spaces overall
      expect(raw).toBe(raw.trim());
      // split & ensure each has no spaces and not empty
      for (const item of splitCsvIds(raw)) {
        expect(item).toBe(item.trim());
        expect(item.length).toBeGreaterThan(0);
      }
    }
  });

  test("18) AlbDnsName and RdsEndpointAddress do not contain uppercase characters (DNS-safe)", () => {
    const alb = req(outputs, "AlbDnsName");
    const rds = req(outputs, "RdsEndpointAddress");
    expect(alb).toBe(alb.toLowerCase());
    expect(rds).toBe(rds.toLowerCase());
  });

  test("19) TargetGroupArn and AlbArn reference ELBv2 service", () => {
    const tg = extractArnParts(req(outputs, "TargetGroupArn"))!;
    const alb = extractArnParts(req(outputs, "AlbArn"))!;
    expect(tg.service).toBe("elasticloadbalancing");
    expect(alb.service).toBe("elasticloadbalancing");
    // Ensure expected resource prefixes
    expect(tg.rest.startsWith("targetgroup/")).toBe(true);
    expect(alb.rest.startsWith("loadbalancer/")).toBe(true);
  });

  test("20) LaunchTemplateId version part is numeric and reasonably small (edge sanity)", () => {
    const lt = req(outputs, "LaunchTemplateId");
    const m = /^lt-[0-9a-fA-F]+:(\d+)$/.exec(lt);
    expect(m).not.toBeNull();
    const version = m ? parseInt(m[1], 10) : 0;
    // should not be absurdly large
    expect(version).toBeLessThan(1000);
  });
});
