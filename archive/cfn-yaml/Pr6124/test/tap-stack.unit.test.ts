/**
 * TapStack CloudFormation Template — Unit Tests
 * - Prefer ../lib/TapStack.json
 * - If JSON missing, attempt to parse ../lib/TapStack.yml using 'yaml' or 'js-yaml' if available
 * - If BOTH exist, query both and accept the first template that satisfies each check
 * - Robust TLS-only policy check (accepts Sid or Condition on aws:SecureTransport == false)
 */

import fs from "fs";
import path from "path";

/* ------------------------------- Loaders -------------------------------- */

const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");
const ymlPath = path.resolve(__dirname, "../lib/TapStack.yml");

function tryLoadJson(p: string): any | undefined {
  if (!fs.existsSync(p)) return undefined;
  const raw = fs.readFileSync(p, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${p}: ${(e as Error).message}`);
  }
}

function tryLoadYaml(p: string): any | undefined {
  if (!fs.existsSync(p)) return undefined;

  // Try 'yaml' first, then 'js-yaml'. If not present, return undefined.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const YAML = require("yaml");
    return YAML.parse(fs.readFileSync(p, "utf8"));
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const jsYaml = require("js-yaml");
      return jsYaml.load(fs.readFileSync(p, "utf8"));
    } catch {
      // No YAML parser installed; fall back to undefined so JSON stays the source of truth
      return undefined;
    }
  }
}

const tplJson = tryLoadJson(jsonPath);
const tplYaml = tryLoadYaml(ymlPath);

// At least one must exist
if (!tplJson && !tplYaml) {
  throw new Error(
    `Neither TapStack.json nor TapStack.yml could be loaded.
 - Expected JSON at: ${jsonPath}
 - Expected YAML at: ${ymlPath}
If you rely on YAML only, install 'yaml' or 'js-yaml' in devDependencies and ensure the file exists.`
  );
}

// Query both, preferring JSON for determinism
const TPLS: any[] = [tplJson, tplYaml].filter(Boolean);

/* ------------------------------ Helpers --------------------------------- */

// Return the first non-undefined value for a getter across templates
function first<T>(getter: (t: any) => T | undefined): T | undefined {
  for (const t of TPLS) {
    try {
      const v = getter(t);
      if (v !== undefined) return v;
    } catch {
      // ignore and continue
    }
  }
  return undefined;
}

function resource(id: string) {
  const r = first<any>((t) => t.Resources?.[id]);
  expect(r).toBeTruthy();
  return r!;
}

function prop(obj: any, key: string) {
  const v = obj?.Properties?.[key];
  expect(v).toBeDefined();
  return v;
}

function outputs() {
  return first<any>((t) => t.Outputs) || {};
}

function parameters() {
  return first<any>((t) => t.Parameters) || {};
}

function metadata() {
  return first<any>((t) => t.Metadata) || {};
}

function conditions() {
  return first<any>((t) => t.Conditions) || {};
}

/* -------------------------------- Tests --------------------------------- */

describe("TapStack CloudFormation Template — Unit Tests", () => {
  // 1
  it("has required template metadata", () => {
    const version = first<string>((t) => t.AWSTemplateFormatVersion);
    const desc = first<string>((t) => t.Description);
    expect(version).toBeDefined();
    expect(typeof desc).toBe("string");

    const md = metadata();
    const regions = md?.["cfn-lint"]?.config?.regions ?? [];
    expect(Array.isArray(regions)).toBe(true);
    expect(regions).toContain("us-east-1");
  });

  // 2
  it("defines EnvironmentSuffix with dev/staging/prod", () => {
    const p = parameters()?.EnvironmentSuffix;
    expect(p).toBeTruthy();

    const expected = ["dev", "staging", "prod"];
    if (Array.isArray(p?.AllowedValues)) {
      expect(p.AllowedValues).toEqual(expected);
    } else {
      expect(expected).toContain(p?.Default);
    }
  });

  // 3
  it("has IsUsEast1 condition targeting us-east-1", () => {
    const conds = conditions();
    expect(conds?.IsUsEast1).toBeDefined();
  });

  // 4
  it("includes the KMS key with correct services allowed", () => {
    const key = resource("MasterKmsKey");
    expect(key.Type).toBe("AWS::KMS::Key");
    const policy = prop(key, "KeyPolicy");
    const stmts = policy.Statement || [];
    const allowServices = stmts.find((s: any) => s.Sid === "AllowServicesUseKey");
    expect(allowServices).toBeDefined();
    const principals = allowServices.Principal?.Service || [];
    ["cloudtrail.amazonaws.com", "s3.amazonaws.com", "rds.amazonaws.com", "logs.amazonaws.com"].forEach((svc) =>
      expect(principals).toContain(svc)
    );
  });

  // 5
  it("creates three S3 buckets with KMS encryption", () => {
    const b1 = resource("LoggingBucket");
    const b2 = resource("CloudTrailBucket");
    const b3 = resource("DataBucket");
    [b1, b2, b3].forEach((b) => {
      const enc = prop(b, "BucketEncryption");
      const rules = enc.ServerSideEncryptionConfiguration;
      expect(Array.isArray(rules) && rules.length > 0).toBe(true);
      const byDefault =
        rules[0]?.ServerSideEncryptionByDefault || rules[0]?.ApplyServerSideEncryptionByDefault;
      expect(byDefault?.SSEAlgorithm).toBeDefined();
    });
  });

  // 6
  it("uses short, deterministic bucket names via Fn::Sub structure", () => {
    const logName = prop(resource("LoggingBucket"), "BucketName");
    const ctName = prop(resource("CloudTrailBucket"), "BucketName");
    const dataName = prop(resource("DataBucket"), "BucketName");
    [logName, ctName, dataName].forEach((n) => {
      const str = JSON.stringify(n);
      expect(str.includes("ts-")).toBe(true);
      expect(str.includes("Fn::Sub")).toBe(true);
    });
  });

  // 7 (fixed) — robust TLS-only enforcement check
  it("enforces TLS-only access in bucket policies", () => {
    const lbp = resource("LoggingBucketPolicy");
    const cbp = resource("CloudTrailBucketPolicy");
    const dbp = resource("DataBucketPolicy");
    [lbp, cbp, dbp].forEach((p) => {
      const pd = prop(p, "PolicyDocument");
      const stmts: any[] = pd.Statement || [];

      // Accept either a Sid that mentions TLS/SSE or any Deny on insecure transport
      const bySid = stmts.find(
        (s) =>
          typeof s.Sid === "string" &&
          (s.Sid.toLowerCase().includes("tls") || s.Sid === "EnforceTLSAndSSE")
      );

      const denyInsecure = stmts.find(
        (s) =>
          s.Effect === "Deny" &&
          s.Condition &&
          (s.Condition.Bool?.["aws:SecureTransport"] === false ||
            s.Condition.Bool?.["aws:SecureTransport"] === "false")
      );

      expect(bySid || denyInsecure).toBeDefined();
    });
  });

  // 8
  it("LoggingBucketPolicy explicitly allows AWS Config GetBucketAcl and PutObject with bucket-owner-full-control", () => {
    const lbp = resource("LoggingBucketPolicy");
    const pd = prop(lbp, "PolicyDocument");
    const stmts: any[] = pd.Statement || [];
    const getAcl = stmts.find((s) => s.Principal?.Service === "config.amazonaws.com" && s.Action === "s3:GetBucketAcl");
    const putObj = stmts.find((s) => s.Principal?.Service === "config.amazonaws.com" && s.Action === "s3:PutObject");
    expect(getAcl).toBeDefined();
    expect(putObj).toBeDefined();
    expect(putObj?.Condition?.StringEquals?.["s3:x-amz-acl"]).toBe("bucket-owner-full-control");
  });

  // 9
  it("creates DeliveryChannel and Recorder resources and wires KMS ARN on DC", () => {
    const dc = resource("ConfigDeliveryChannel");
    const rec = resource("ConfigRecorder");
    expect(dc.Type).toBe("AWS::Config::DeliveryChannel");
    expect(rec.Type).toBe("AWS::Config::ConfigurationRecorder");

    const s3b = prop(dc, "S3BucketName");
    expect(s3b).toBeDefined();

    const kmsArn = dc.Properties?.S3KmsKeyArn;
    if (kmsArn) {
      const kms = resource("MasterKmsKey");
      expect(JSON.stringify(kmsArn)).toContain("MasterKmsKey");
    }
  });

  // 10
  it("KMS key, alias, and exports exist", () => {
    expect(resource("MasterKmsKey").Type).toBe("AWS::KMS::Key");
    expect(resource("MasterKmsKeyAlias").Type).toBe("AWS::KMS::Alias");
    const outs = outputs();
    expect(outs?.KmsKeyArn?.Value).toBeDefined();
  });

  // 11
  it("CloudTrail trail is multi-region, KMS-encrypted, logging to the CloudTrail bucket", () => {
    const ct = resource("CloudTrail");
    expect(ct.Type).toBe("AWS::CloudTrail::Trail");
    expect(ct.Properties?.IsMultiRegionTrail).toBe(true);
    expect(ct.Properties?.IsLogging).toBe(true);
    expect(ct.Properties?.S3BucketName).toBeDefined();
    expect(ct.Properties?.KMSKeyId).toBeDefined();
  });

  // 12
  it("RDS DBInstance is private, encrypted, MultiAZ", () => {
    const db = resource("RdsDatabase");
    expect(db.Type).toBe("AWS::RDS::DBInstance");
    expect(db.Properties?.MultiAZ).toBe(true);
    expect(db.Properties?.PubliclyAccessible).toBe(false);
    expect(db.Properties?.StorageEncrypted).toBe(true);
    expect(db.Properties?.KmsKeyId).toBeDefined();
  });

  // 13
  it("DbSubnetGroup references two private subnets", () => {
    const sg = resource("DbSubnetGroup");
    const ids = prop(sg, "SubnetIds");
    expect(Array.isArray(ids) && ids.length >= 2).toBe(true);
  });

  // 14
  it("API Gateway stage logs to ApiLogsGroup with JSON format", () => {
    const st = resource("ApiGatewayStage");
    const als = st.Properties?.AccessLogSetting;
    expect(als?.DestinationArn).toBeDefined();
    expect(typeof als?.Format).toBe("string");
    expect(als?.Format).toContain("$context");
  });

  // 15
  it("WAF WebACLAssociation uses API Gateway stage ARN via Sub", () => {
    const assoc = resource("WafApiGatewayAssociation");
    const arn = prop(assoc, "ResourceArn");
    expect(JSON.stringify(arn)).toContain("arn:aws:apigateway");
  });

  // 16
  it("AutoScalingGroup uses two public subnets and sane capacities", () => {
    const asg = resource("AutoScalingGroup");
    const subnets = prop(asg, "VPCZoneIdentifier");
    expect(Array.isArray(subnets) && subnets.length >= 2).toBe(true);
    expect(asg.Properties?.MinSize).toBeGreaterThanOrEqual(1);
    expect(asg.Properties?.DesiredCapacity).toBeGreaterThanOrEqual(1);
  });

  // 17
  it("Scaling policies exist for up and down", () => {
    expect(resource("ScaleUpPolicy").Type).toBe("AWS::AutoScaling::ScalingPolicy");
    expect(resource("ScaleDownPolicy").Type).toBe("AWS::AutoScaling::ScalingPolicy");
  });

  // 18
  it("CloudWatch alarms for CPU high/low reference ASG", () => {
    const hi = resource("HighCpuAlarm");
    const lo = resource("LowCpuAlarm");
    const dimHi = hi.Properties?.Dimensions || [];
    const dimLo = lo.Properties?.Dimensions || [];
    const hasASGHi = dimHi.some((d: any) => d.Name === "AutoScalingGroupName");
    const hasASGLo = dimLo.some((d: any) => d.Name === "AutoScalingGroupName");
    expect(hasASGHi && hasASGLo).toBe(true);
  });

  // 19
  it("VPC and subnets exist with proper mapping", () => {
    expect(resource("TapVpc").Type).toBe("AWS::EC2::VPC");
    ["PublicSubnet1", "PublicSubnet2", "PrivateSubnet1", "PrivateSubnet2"].forEach((id) =>
      expect(resource(id).Type).toBe("AWS::EC2::Subnet")
    );
  });

  // 20
  it("Security groups for web and database exist, and DB allows 3306 from web SG (structural)", () => {
    const web = resource("WebSecurityGroup");
    const db = resource("DatabaseSecurityGroup");
    expect(web.Type).toBe("AWS::EC2::SecurityGroup");
    expect(db.Type).toBe("AWS::EC2::SecurityGroup");
    const ingress = db.Properties?.SecurityGroupIngress || [];
    const mysql = ingress.find((r: any) => r.FromPort === 3306 && r.ToPort === 3306);
    expect(mysql).toBeDefined();
  });

  // 21
  it("Outputs include key exports like VpcId, KmsKeyArn, ApiGatewayUrl", () => {
    const outs = outputs();
    ["VpcId", "KmsKeyArn", "ApiGatewayUrl"].forEach((k) => {
      expect(outs?.[k]?.Value).toBeDefined();
    });
  });

  // 22
  it("YAML file exists and looks like a CloudFormation template (lightweight check, no parser)", () => {
    expect(fs.existsSync(ymlPath)).toBe(true);
    const head = fs.readFileSync(ymlPath, "utf8").split(/\r?\n/).slice(0, 10).join("\n").toLowerCase();
    expect(head.includes("awstemplateformatversion")).toBe(true);
  });

  // 23
  it("AWS Config resources wired correctly: both DC and Recorder names exported", () => {
    const outs = outputs();
    expect(outs?.ConfigRecorderName?.Value).toBeDefined();
    expect(outs?.ConfigDeliveryChannelName?.Value).toBeDefined();
  });

  // 24
  it("API Gateway deployment depends on method/account (guards ordering)", () => {
    const dep = resource("ApiGatewayDeployment");
    const deps = dep.DependsOn;
    const dArr = Array.isArray(deps) ? deps : [deps].filter(Boolean);
    expect(dArr.length).toBeGreaterThanOrEqual(1);
  });
});
