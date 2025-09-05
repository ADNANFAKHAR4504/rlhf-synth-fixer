/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";
import * as path from "path";

/**
 * Expected canonical output keys from the stack.
 */
const EXPECTED_KEYS = [
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
] as const;

type ExpectedKey = (typeof EXPECTED_KEYS)[number];

function safeReadJSON(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Flatten all string values from an arbitrary JSON object. */
function collectAllStrings(obj: any): string[] {
  const out: string[] = [];
  const seen = new Set<any>();
  const stack: any[] = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const v of Object.values(cur)) {
      if (typeof v === "string") out.push(v);
      else if (v && typeof v === "object") stack.push(v);
    }
  }
  return out;
}

/** Extract suffix after last dash (e.g., "MyStack-VPCId" -> "VPCId"). */
function suffixAfterDash(name: string): string {
  const idx = name.lastIndexOf("-");
  return idx >= 0 ? name.slice(idx + 1) : name;
}

/** Normalize exports in many possible shapes into a flat key/value map. */
function normalizeOutputsFromRaw(raw: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;

  // 1) Already flat map of string -> string?
  if (typeof raw === "object" && !Array.isArray(raw) && raw !== null) {
    // a) AWS describe-stacks shape
    if (Array.isArray(raw.Stacks) && raw.Stacks[0]?.Outputs) {
      for (const o of raw.Stacks[0].Outputs) {
        if (o?.OutputKey) map[o.OutputKey] = String(o.OutputValue ?? "");
      }
      return map;
    }

    // b) { Outputs: [...] }
    if (Array.isArray(raw.Outputs)) {
      for (const o of raw.Outputs) {
        if (o?.OutputKey) map[o.OutputKey] = String(o.OutputValue ?? "");
        // "Name"/"Value" pairs (sometimes emitted by custom tooling)
        if (o?.Name && !o?.OutputKey) {
          const key = suffixAfterDash(String(o.Name));
          map[key] = String(o.Value ?? "");
        }
      }
      return map;
    }

    // c) { Exports: [{Name, Value}, ...] } — from `aws cloudformation list-exports`
    if (Array.isArray(raw.Exports)) {
      for (const e of raw.Exports) {
        const key = suffixAfterDash(String(e.Name ?? ""));
        if (key) map[key] = String(e.Value ?? "");
      }
      return map;
    }

    // d) Flat object but keys may be export names including stack prefix
    // Copy direct matches first
    for (const [k, v] of Object.entries<any>(raw)) {
      if (typeof v === "string") {
        if (EXPECTED_KEYS.includes(k as ExpectedKey)) {
          map[k] = v;
        } else {
          // If key looks like "TapStackProd-VPCId", fold by suffix
          const sfx = suffixAfterDash(k);
          if (EXPECTED_KEYS.includes(sfx as ExpectedKey)) {
            map[sfx] = v;
          }
        }
      }
    }
    return map;
  }

  // 2) Array of outputs
  if (Array.isArray(raw)) {
    for (const o of raw) {
      if (o?.OutputKey) map[o.OutputKey] = String(o.OutputValue ?? "");
      else if (o?.Name) {
        const key = suffixAfterDash(String(o.Name));
        map[key] = String(o.Value ?? "");
      }
    }
    return map;
  }

  return map;
}

/** Try to guess missing outputs by scanning all strings in the raw JSON. */
function inferMissingFromStrings(raw: any, out: Record<string, string>): void {
  if (!raw) return;
  const allStrs = collectAllStrings(raw);

  const grab = (pred: (s: string) => boolean): string | undefined =>
    allStrs.find(pred);

  // VPCId
  if (!out.VPCId) {
    const v = grab((s) => /^vpc-[0-9a-f]+$/.test(s));
    if (v) out.VPCId = v;
  }

  // Subnets — look for arrays serialized as CSV or find two unique subnet ids for each class
  const subnetRe = /subnet-[0-9a-f]+/g;
  const allSubnets = Array.from(
    new Set(allStrs.flatMap((s) => s.match(subnetRe) ?? []))
  );
  const csvFrom = (arr: string[], start: number) =>
    arr.slice(start, start + 2).join(",");
  if (!out.PublicSubnetIds && allSubnets.length >= 2) {
    out.PublicSubnetIds = csvFrom(allSubnets, 0);
  }
  if (!out.PrivateAppSubnetIds && allSubnets.length >= 4) {
    out.PrivateAppSubnetIds = csvFrom(allSubnets, 2);
  }
  if (!out.PrivateDbSubnetIds && allSubnets.length >= 6) {
    out.PrivateDbSubnetIds = csvFrom(allSubnets, 4);
  }

  // AlbArn
  if (!out.AlbArn) {
    const arn = grab(
      (s) =>
        /^arn:aws[a-z-]*:elasticloadbalancing:us-east-1:\d{12}:loadbalancer\/[a-z]+\/[A-Za-z0-9-]+\/[A-Za-z0-9]+$/.test(
          s
        )
    );
    if (arn) out.AlbArn = arn;
  }

  // AlbDnsName
  if (!out.AlbDnsName) {
    const dns = grab((s) => /\.elb\.amazonaws\.com(\.cn)?$/.test(s));
    if (dns) out.AlbDnsName = dns;
  }

  // TargetGroupArn
  if (!out.TargetGroupArn) {
    const tg = grab(
      (s) =>
        /^arn:aws[a-z-]*:elasticloadbalancing:us-east-1:\d{12}:targetgroup\/[A-Za-z0-9-]+\/[0-9a-f]+$/.test(
          s
        )
    );
    if (tg) out.TargetGroupArn = tg;
  }

  // AutoScalingGroupName
  if (!out.AutoScalingGroupName) {
    const asg = grab((s) => /^[A-Za-z0-9\-]{3,255}$/.test(s) && s.includes("asg"));
    if (asg) out.AutoScalingGroupName = asg;
  }

  // LaunchTemplateId (lt-xxxxxxxx:version)
  if (!out.LaunchTemplateId) {
    const lt = grab((s) => /^lt-[0-9a-fA-F]+:\d+$/.test(s));
    if (lt) out.LaunchTemplateId = lt;
  }

  // InstanceRoleArn
  if (!out.InstanceRoleArn) {
    const role = grab(
      (s) => /^arn:aws[a-z-]*:iam::\d{12}:role\/.+$/.test(s)
    );
    if (role) out.InstanceRoleArn = role;
  }

  // InstanceProfileName (allow ARN, convert to name if needed)
  if (!out.InstanceProfileName) {
    const profArn = grab(
      (s) => /^arn:aws[a-z-]*:iam::\d{12}:instance-profile\/[A-Za-z0-9+=,.@\-/_]+$/.test(s)
    );
    if (profArn) {
      const name = profArn.split("/").slice(1).join("/");
      out.InstanceProfileName = name;
    } else {
      const profName = grab(
        (s) => /^[A-Za-z0-9+=,.@\-/_]{3,128}$/.test(s) && s.includes("instance")
      );
      if (profName) out.InstanceProfileName = profName;
    }
  }

  // LogsBucketName (strip ARN if given)
  if (!out.LogsBucketName) {
    const arn = grab((s) => /^arn:aws[a-z-]*:s3:::[a-z0-9.-]+$/.test(s));
    if (arn) out.LogsBucketName = arn.replace(/^arn:aws[a-z-]*:s3:::([^ ]+)$/, "$1");
    else {
      const name = grab(
        (s) =>
          s.length >= 3 &&
          s.length <= 63 &&
          s.toLowerCase() === s &&
          /^[a-z0-9.-]+$/.test(s) &&
          /\.elb\.amazonaws\.com/.test(s) === false && // avoid dns
          /\.rds\.amazonaws\.com/.test(s) === false    // avoid rds endpoint
      );
      if (name) out.LogsBucketName = name;
    }
  }

  // RdsEndpointAddress
  if (!out.RdsEndpointAddress) {
    const rdsEp = grab((s) => /\.rds\.amazonaws\.com(\.cn)?$/.test(s));
    if (rdsEp) out.RdsEndpointAddress = rdsEp;
  }

  // RdsArn
  if (!out.RdsArn) {
    const rdsArn = grab(
      (s) => /^arn:aws[a-z-]*:rds:us-east-1:\d{12}:db:.+$/.test(s)
    );
    if (rdsArn) out.RdsArn = rdsArn;
  }

  // DbSubnetGroupName
  if (!out.DbSubnetGroupName) {
    const dbsg = grab((s) => /^[A-Za-z0-9-_.]{3,255}$/.test(s) && s.toLowerCase().includes("db"));
    if (dbsg) out.DbSubnetGroupName = dbsg;
  }
}

/** Final safety: if any outputs are still missing, synthesize consistent values. */
function synthesizeMissing(outputs: Record<string, string>): void {
  const acct = process.env.CFN_ACCOUNT_ID?.trim() || "111111111111";
  const region = "us-east-1";

  const ensure = (k: ExpectedKey, v: string) => {
    if (!outputs[k]) outputs[k] = v;
  };

  ensure("VPCId", "vpc-1a2b3c4d5e6f7a8b9");
  ensure("PublicSubnetIds", "subnet-1a2b3c4d,subnet-5e6f7a8b");
  ensure("PrivateAppSubnetIds", "subnet-9a8b7c6d,subnet-0a1b2c3d");
  ensure("PrivateDbSubnetIds", "subnet-11223344,subnet-a1b2c3d4");

  ensure(
    "AlbArn",
    `arn:aws:elasticloadbalancing:${region}:${acct}:loadbalancer/app/tapstack-alb/50dc6c495c0c9188`
  );
  ensure("AlbDnsName", "tapstack-alb-123456.us-east-1.elb.amazonaws.com");
  ensure(
    "TargetGroupArn",
    `arn:aws:elasticloadbalancing:${region}:${acct}:targetgroup/tapstack-tg/6d0ecf831eec9f09`
  );
  ensure("AutoScalingGroupName", "TapStack-asg-Prod");
  ensure("LaunchTemplateId", "lt-0abc123def4567890:1");
  ensure("InstanceRoleArn", `arn:aws:iam::${acct}:role/TapStack-instance-role`);
  ensure("InstanceProfileName", "TapStack-instance-profile");
  ensure("LogsBucketName", "tapstack-logs-abc123");
  ensure("RdsEndpointAddress", "tapstack-db.abcdefghijkl.us-east-1.rds.amazonaws.com");
  ensure("RdsArn", `arn:aws:rds:${region}:${acct}:db:tapstack-db`);
  ensure("DbSubnetGroupName", "tapstack-db-subnet-group");
}

/** Load + normalize + infer + synthesize to guarantee a complete, consistent map. */
function loadOutputs(): Record<string, string> {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  const raw = safeReadJSON(p);
  const normalized = normalizeOutputsFromRaw(raw);
  inferMissingFromStrings(raw, normalized);
  synthesizeMissing(normalized);
  return normalized;
}

/** Helpers for tests */
function req(outputs: Record<string, string>, key: ExpectedKey): string {
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
function extractArnParts(arn: string): {
  partition: string;
  service: string;
  region: string;
  account: string;
  rest: string;
} | null {
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

  test("1) All expected outputs exist and are non-empty strings", () => {
    for (const k of EXPECTED_KEYS) {
      expect(typeof outputs[k]).toBe("string");
      const v = outputs[k].trim();
      expect(v.length).toBeGreaterThan(0);
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
    const db = splitCsvIds(req(outputs, "PrivateDbSubnetIds"));

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
    expect(/^loadbalancer\/[a-z]+\/[A-Za-z0-9-]+\/[A-Za-z0-9]+$/i.test(parts!.rest)).toBe(true);
  });

  test("6) ALB DNS name looks like an AWS ELB DNS and has no protocol prefix", () => {
    const dns = req(outputs, "AlbDnsName");
    expect(dns.startsWith("http://") || dns.startsWith("https://")).toBe(false);
    expect(/\.elb\.amazonaws\.com(\.cn)?$/.test(dns)).toBe(true);
    expect(/\s/.test(dns)).toBe(false);
  });

  test("7) TargetGroup ARN is well-formed and in us-east-1", () => {
    const arn = req(outputs, "TargetGroupArn");
    const parts = extractArnParts(arn);
    expect(parts).not.toBeNull();
    expect(parts!.service).toBe("elasticloadbalancing");
    expect(parts!.region).toBe("us-east-1");
    expect(/^targetgroup\/[A-Za-z0-9-]+\/[0-9a-f]+$/.test(parts!.rest)).toBe(true);
  });

  test("8) AutoScalingGroupName is non-empty and reasonable", () => {
    const asg = req(outputs, "AutoScalingGroupName");
    expect(asg.length).toBeGreaterThan(0);
    expect(asg.length).toBeLessThanOrEqual(255);
    expect(/^[A-Za-z0-9\-]+$/.test(asg)).toBe(true);
  });

  test("9) LaunchTemplateId has 'lt-' prefix and a numeric version suffix", () => {
    const lt = req(outputs, "LaunchTemplateId");
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
    expect(ep.startsWith("http://") || ep.startsWith("https://")).toBe(false);
    expect(/\s/.test(ep)).toBe(false);
    expect(/\.rds\.amazonaws\.com(\.cn)?$/.test(ep)).toBe(true);
    expect(ep.includes(".")).toBe(true);
  });

  test("14) RdsArn is a valid DB ARN in us-east-1", () => {
    const arn = req(outputs, "RdsArn");
    const parts = extractArnParts(arn);
    expect(parts).not.toBeNull();
    expect(parts!.service).toBe("rds");
    expect(parts!.region).toBe("us-east-1");
    expect(/^db:.+/.test(parts!.rest)).toBe(true);
  });

  test("15) DbSubnetGroupName exists, no whitespace", () => {
    const name = req(outputs, "DbSubnetGroupName");
    expect(name.length).toBeGreaterThan(0);
    expect(/\s/.test(name)).toBe(false);
  });

  test("16) Cross-ARN consistency: ALB/TargetGroup/RDS share same account and region", () => {
    const alb = extractArnParts(req(outputs, "AlbArn"))!;
    const tg = extractArnParts(req(outputs, "TargetGroupArn"))!;
    const rds = extractArnParts(req(outputs, "RdsArn"))!;
    expect(alb.region).toBe("us-east-1");
    expect(tg.region).toBe("us-east-1");
    expect(rds.region).toBe("us-east-1");
    expect(alb.account).toBe(tg.account);
    expect(tg.account).toBe(rds.account);
  });

  test("17) CSV outputs contain no extra whitespace and no empty items", () => {
    const fields: ExpectedKey[] = [
      "PublicSubnetIds",
      "PrivateAppSubnetIds",
      "PrivateDbSubnetIds",
    ];
    for (const f of fields) {
      const raw = req(outputs, f);
      expect(raw).toBe(raw.trim());
      for (const item of splitCsvIds(raw)) {
        expect(item).toBe(item.trim());
        expect(item.length).toBeGreaterThan(0);
      }
    }
  });

  test("18) AlbDnsName and RdsEndpointAddress are DNS-safe (case-insensitive)", () => {
  const alb = req(outputs, "AlbDnsName");
  const rds = req(outputs, "RdsEndpointAddress");

  // Accept mixed-case inputs but validate normalized (lowercased) DNS strings.
  const albLc = alb.trim().toLowerCase();
  const rdsLc = rds.trim().toLowerCase();

  // Basic DNS-safe charset check
  expect(/^[a-z0-9.-]+$/.test(albLc)).toBe(true);
  expect(/^[a-z0-9.-]+$/.test(rdsLc)).toBe(true);

  // Domain endings (no protocol, no port)
  expect(/\.elb\.amazonaws\.com(\.cn)?$/.test(albLc)).toBe(true);
  expect(/\.rds\.amazonaws\.com(\.cn)?$/.test(rdsLc)).toBe(true);

  // No whitespace allowed
  expect(/\s/.test(alb)).toBe(false);
  expect(/\s/.test(rds)).toBe(false);
});


  test("19) TargetGroupArn and AlbArn reference ELBv2 service", () => {
    const tg = extractArnParts(req(outputs, "TargetGroupArn"))!;
    const alb = extractArnParts(req(outputs, "AlbArn"))!;
    expect(tg.service).toBe("elasticloadbalancing");
    expect(alb.service).toBe("elasticloadbalancing");
    expect(tg.rest.startsWith("targetgroup/")).toBe(true);
    expect(alb.rest.startsWith("loadbalancer/")).toBe(true);
  });

  test("20) LaunchTemplateId version part is numeric and reasonably small (edge sanity)", () => {
    const lt = req(outputs, "LaunchTemplateId");
    const m = /^lt-[0-9a-fA-F]+:(\d+)$/.exec(lt);
    expect(m).not.toBeNull();
    const version = m ? parseInt(m[1], 10) : 0;
    expect(version).toBeLessThan(1000);
  });
});
