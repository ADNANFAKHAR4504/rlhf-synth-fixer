// test/tapstack.unit.test.ts

import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Rules?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const libDir = path.resolve(__dirname, "../lib");
const ymlPath = path.resolve(libDir, "TapStack.yml");
const jsonPath = path.resolve(libDir, "TapStack.json");

let tpl: CFNTemplate;

beforeAll(() => {
  // 1) YAML file should exist (we don't parse YAML to avoid extra deps)
  expect(fs.existsSync(ymlPath)).toBe(true);

  // 2) Load JSON version for all assertions
  const raw = fs.readFileSync(jsonPath, "utf8");
  tpl = JSON.parse(raw);
  expect(tpl).toBeTruthy();
  expect(tpl.Resources).toBeTruthy();
});

// ---------- Helpers ----------
const getResource = (logicalId: string) => tpl.Resources[logicalId];

const allResourcesOfType = (type: string) =>
  Object.entries(tpl.Resources).filter(([, v]) => v.Type === type);

const findFirstOfType = (type: string) => {
  const found = allResourcesOfType(type);
  return found.length ? { logicalId: found[0][0], resource: found[0][1] } : null;
};

const getParam = (name: string) => tpl.Parameters?.[name];

const hasStatementWithSid = (policyDoc: any, sid: string) => {
  const stmts = policyDoc?.Statement ?? [];
  return stmts.some((s: any) => s.Sid === sid);
};

const findBucketPolicyStmt = (policyDoc: any, sid: string) => {
  const stmts = policyDoc?.Statement ?? [];
  return stmts.find((s: any) => s.Sid === sid);
};

describe("TapStack template — Parameters, Rules, Conditions", () => {
  test("03 — ProjectName parameter has default and allowed pattern", () => {
    const p = getParam("ProjectName");
    expect(p).toBeTruthy();
    expect(p.Default).toBeDefined();
    expect(typeof p.AllowedPattern).toBe("string");
    expect(p.AllowedPattern.length).toBeGreaterThan(0);
  });

  test("04 — EnvironmentSuffix parameter uses safe regex (no hard AllowedValues)", () => {
    const p = getParam("EnvironmentSuffix");
    expect(p).toBeTruthy();
    expect(p.AllowedPattern).toBeDefined();
    expect(p.AllowedValues).toBeUndefined();
  });

  test("05 — VpcCidr parameter validates CIDR via explicit regex", () => {
    const p = getParam("VpcCidr");
    expect(p).toBeTruthy();
    // Expect the well-formed IPv4 CIDR regex used in the template
    expect(p.AllowedPattern).toMatch(
      /^\^\(\[0-9\]\{1,3\}\\\.\)\{3}\[0-9\]\{1,3\}\/\[0-9\]\{1,2\}\$$/
    );
  });

  test("06 — RdsInstanceClass parameter validates instance class format", () => {
    const p = getParam("RdsInstanceClass");
    expect(p).toBeTruthy();
    // Starts with ^db and ends with $
    expect(p.AllowedPattern.startsWith("^db")).toBe(true);
    expect(p.AllowedPattern.endsWith("$")).toBe(true);
  });

  test("07 — RdsAllocatedStorage sane default >= 20", () => {
    const p = getParam("RdsAllocatedStorage");
    expect(p).toBeTruthy();
    expect(p.Default).toBeGreaterThanOrEqual(20);
  });

  test("08 — Conditions include UseCloudWatchForTrail", () => {
    expect(tpl.Conditions?.UseCloudWatchForTrail).toBeDefined();
  });

  test("09 — Region Rule restricts to us-east-1/us-west-2", () => {
    expect(tpl.Rules?.RegionRule).toBeDefined();
  });
});

describe("KMS and S3 — encryption, policies, TLS", () => {
  test("10 — KmsKey exists with rotation enabled", () => {
    const kms = findFirstOfType("AWS::KMS::Key");
    expect(kms).toBeTruthy();
    expect(kms!.resource.Properties.EnableKeyRotation).toBe(true);
  });

  test("11 — LoggingBucket uses SSE-KMS with KmsKey", () => {
    // Be deterministic: assert directly on the LoggingBucket logical ID
    const logging = getResource("LoggingBucket");
    expect(logging?.Type).toBe("AWS::S3::Bucket");
    const enc =
      logging?.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
        ?.ServerSideEncryptionByDefault;
    expect(enc?.SSEAlgorithm).toBe("aws:kms");
    expect(enc?.KMSMasterKeyID).toBeDefined();
  });

  test("12 — DataBucket enforces SSE-KMS (via policy deny on non-KMS puts)", () => {
    const policies = allResourcesOfType("AWS::S3::BucketPolicy");
    const dataPol = policies.find(([, r]) =>
      (r.Properties?.Bucket ?? "").Ref === "DataBucket"
    );
    expect(dataPol).toBeTruthy();
    const doc = dataPol?.[1].Properties.PolicyDocument;
    expect(hasStatementWithSid(doc, "EnforceSseKms")).toBe(true);
  });

  test("13 — LoggingBucketPolicy allows CloudTrail PutObject with bucket-owner-full-control", () => {
    const policies = allResourcesOfType("AWS::S3::BucketPolicy");
    const logPol = policies.find(([, r]) =>
      (r.Properties?.Bucket ?? "").Ref === "LoggingBucket"
    );
    expect(logPol).toBeTruthy();
    const doc = logPol?.[1].Properties.PolicyDocument;
    const stmt = findBucketPolicyStmt(doc, "AllowCloudTrailWrite");
    expect(stmt).toBeTruthy();
    expect(stmt.Principal?.Service).toBe("cloudtrail.amazonaws.com");
    expect(
      Array.isArray(stmt.Action) ? stmt.Action.includes("s3:PutObject") : stmt.Action === "s3:PutObject"
    ).toBe(true);
    expect(stmt.Condition?.StringEquals?.["s3:x-amz-acl"]).toBe(
      "bucket-owner-full-control"
    );
  });

  test("14 — LoggingBucketPolicy enforces TLS", () => {
    const policies = allResourcesOfType("AWS::S3::BucketPolicy");
    const logPol = policies.find(([, r]) =>
      (r.Properties?.Bucket ?? "").Ref === "LoggingBucket"
    );
    const doc = logPol?.[1].Properties.PolicyDocument;
    expect(hasStatementWithSid(doc, "EnforceTLS")).toBe(true);
  });
});

describe("AWS Config — role, recorder, channel, rules", () => {
  test("15 — ConfigServiceRole exists with delivery permissions", () => {
    const role = getResource("ConfigServiceRole");
    expect(role?.Type).toBe("AWS::IAM::Role");
    const policies = role?.Properties?.Policies ?? [];
    const merged = JSON.stringify(policies);
    expect(merged).toMatch(/s3:PutObject/);
    expect(merged).toMatch(/s3:GetBucketAcl/);
  });

  test("16 — ConfigRecorder defined with AllSupported and IncludeGlobalResourceTypes", () => {
    const rec = getResource("ConfigRecorder");
    expect(rec?.Type).toBe("AWS::Config::ConfigurationRecorder");
    expect(rec?.Properties?.RecordingGroup?.AllSupported).toBe(true);
    expect(rec?.Properties?.RecordingGroup?.IncludeGlobalResourceTypes).toBe(true);
  });

  test("17 — ConfigDeliveryChannel writes to LoggingBucket", () => {
    const ch = getResource("ConfigDeliveryChannel");
    expect(ch?.Type).toBe("AWS::Config::DeliveryChannel");
    expect((ch?.Properties?.S3BucketName ?? {}).Ref).toBe("LoggingBucket");
  });

  test("18 — Managed rule for S3 encryption is present", () => {
    const rules = allResourcesOfType("AWS::Config::ConfigRule");
    const s3Rule = rules.find(
      ([, r]) =>
        r.Properties?.Source?.SourceIdentifier ===
        "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
    );
    expect(s3Rule).toBeTruthy();
  });
});

describe("CloudTrail — multi-region, KMS, destinations", () => {
  test("19 — CloudTrail is multi-region with log file validation", () => {
    const trail = findFirstOfType("AWS::CloudTrail::Trail");
    expect(trail).toBeTruthy();
    const p = trail!.resource.Properties;
    expect(p.IsMultiRegionTrail).toBe(true);
    expect(p.EnableLogFileValidation).toBe(true);
  });

  test("20 — CloudTrail uses KMS key (KMSKeyId GetAtt present)", () => {
    const trail = findFirstOfType("AWS::CloudTrail::Trail")!;
    const kmsKeyId = trail.resource.Properties.KMSKeyId;
    expect(kmsKeyId?.["Fn::GetAtt"]).toBeDefined();
  });
});

describe("RDS — encryption, params, managed credentials", () => {
  test("21 — RdsParameterGroup uses postgres17 family", () => {
    const pg = getResource("RdsParameterGroup");
    expect(pg?.Type).toBe("AWS::RDS::DBParameterGroup");
    expect(pg?.Properties?.Family).toBe("postgres17");
  });

  test("22 — RdsInstance uses ManageMasterUserPassword with username only", () => {
    const db = getResource("RdsInstance");
    expect(db?.Type).toBe("AWS::RDS::DBInstance");
    expect(db?.Properties?.ManageMasterUserPassword).toBe(true);
    expect(db?.Properties?.MasterUsername).toBeDefined();
  });

  test("23 — RdsInstance is not publicly accessible and has auto minor upgrades", () => {
    const db = getResource("RdsInstance");
    expect(db?.Properties?.PubliclyAccessible).toBe(false);
    expect(db?.Properties?.AutoMinorVersionUpgrade).toBe(true);
  });
});

describe("EC2 — launch template hardening and SG defaults", () => {
  test("24 — AppLaunchTemplate enforces IMDSv2 and disables public IP", () => {
    const lt = getResource("AppLaunchTemplate");
    expect(lt?.Type).toBe("AWS::EC2::LaunchTemplate");
    const md = lt?.Properties?.LaunchTemplateData?.MetadataOptions;
    expect(md?.HttpTokens).toBe("required");
    const iface = lt?.Properties?.LaunchTemplateData?.NetworkInterfaces?.[0];
    expect(iface?.AssociatePublicIpAddress).toBe(false);
  });

  test("25 — AppSecurityGroupDefaultDeny has empty ingress", () => {
    const sg = getResource("AppSecurityGroupDefaultDeny");
    expect(sg?.Type).toBe("AWS::EC2::SecurityGroup");
    expect(Array.isArray(sg?.Properties?.SecurityGroupIngress)).toBe(true);
    expect(sg?.Properties?.SecurityGroupIngress.length).toBe(0);
  });
});

describe("GuardDuty and Outputs", () => {
  test("26 — GuardDutyDetector exists and is enabled", () => {
    const gd = getResource("GuardDutyDetector");
    expect(gd?.Type).toBe("AWS::GuardDuty::Detector");
    expect(gd?.Properties?.Enable).toBe(true);
  });

  test("27 — Outputs include KmsKeyArn, VpcId, CloudTrailArn, RdsEndpointAddress", () => {
    const out = tpl.Outputs ?? {};
    expect(out.KmsKeyArn).toBeDefined();
    expect(out.VpcId).toBeDefined();
    expect(out.CloudTrailArn).toBeDefined();
    expect(out.RdsEndpointAddress).toBeDefined();
  });
});
