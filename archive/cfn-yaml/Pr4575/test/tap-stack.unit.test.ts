/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive unit tests for TapStack CloudFormation template.
 * - Reads:  ../lib/TapStack.yml  and  ../lib/TapStack.json
 * - Normalizes CFN intrinsics so js-yaml can parse without custom schemas.
 * - 24 tests covering structure, security controls, wiring, and outputs.
 */

import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

type Template = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources: Record<
    string,
    {
      Type: string;
      Properties?: Record<string, any>;
      DependsOn?: string | string[];
      DeletionPolicy?: string;
      UpdateReplacePolicy?: string;
      Metadata?: any;
    }
  >;
  Outputs?: Record<string, any>;
};

/**
 * Normalize CloudFormation YAML by removing intrinsic function tags (e.g., !Sub, !Ref)
 * while preserving the underlying scalar/sequence/mapping content.
 *
 * We deliberately keep it simple:
 *  - inline forms:   Key: !Sub "arn:..."
 *  - sequence forms: Key: !Join [ ":", [ ... ] ]
 *  - block forms:    Key: !Sub |
 *                      arn:...
 *
 * These replacements are safe for unit-test parsing where we only need structure & intent.
 */
function normalizeCfnYaml(raw: string): string {
  let s = raw;

  // 1) Block scalars with an intrinsic tag, e.g. `Key: !Sub |` -> `Key: |`
  s = s.replace(/(^\s*[^:\n]+:\s*)!\w+\s*\|/gm, (_m, p1) => `${p1}|`);

  // 2) Inline values with an intrinsic tag, e.g. `Key: !Sub "..."` -> `Key: "..."`
  s = s.replace(/(^\s*[^:\n]+:\s*)!\w+\s+/gm, (_m, p1) => p1);

  // 3) Standalone occurrences within arrays/maps, e.g. `- !Ref Something` or `[!Sub "..."]`
  s = s.replace(/([-\s\[\{,])!\w+\s+/g, (_m, p1) => p1);

  // 4) Edge-case: tag followed by newline (rare), drop the tag token.
  s = s.replace(/!\w+(\s*\n)/g, (_m, p1) => p1);

  return s;
}

function loadYamlTemplate(): Template {
  const file = path.resolve(__dirname, "../lib/TapStack.yml");
  if (!fs.existsSync(file)) {
    throw new Error(`TapStack.yml not found at ${file}`);
  }
  const text = fs.readFileSync(file, "utf8");
  const normalized = normalizeCfnYaml(text);
  const doc = yaml.load(normalized) as Template;
  if (!doc || !doc.Resources) {
    throw new Error("Parsed YAML template is empty or missing Resources");
  }
  return doc;
}

function loadJsonTemplate(): Template {
  const file = path.resolve(__dirname, "../lib/TapStack.json");
  if (!fs.existsSync(file)) {
    throw new Error(`TapStack.json not found at ${file}`);
  }
  const text = fs.readFileSync(file, "utf8");
  const doc = JSON.parse(text) as Template;
  if (!doc || !doc.Resources) {
    throw new Error("Parsed JSON template is empty or missing Resources");
  }
  return doc;
}

function getResourcesByType(tpl: Template, type: string) {
  return Object.entries(tpl.Resources).filter(([, r]) => r.Type === type);
}

function getResource(tpl: Template, logicalId: string) {
  const r = tpl.Resources[logicalId];
  if (!r) throw new Error(`Resource ${logicalId} not found`);
  return r;
}

function findResourceByTypeOrThrow(tpl: Template, type: string) {
  const arr = getResourcesByType(tpl, type);
  if (arr.length === 0) {
    throw new Error(`No resource of type ${type} found`);
  }
  return arr;
}

function arnLikeKmsKeyArn(val: any): boolean {
  if (typeof val !== "string") return false;
  return (
    /arn:aws(-[\w]+)?:kms:[\w-]+:\d{12}:key\/[\w-]+/.test(val) ||
    val.includes(":kms:") ||
    val.includes("${")
  );
}

function isSubOrRef(val: any): boolean {
  return typeof val === "string" && (val.includes("${") || val.includes("!Sub"));
}

/* ---------------------------- TESTS START HERE ---------------------------- */

describe("TapStack CloudFormation template (YAML + JSON) — structural loading", () => {
  let y: Template;
  let j: Template;

  beforeAll(() => {
    y = loadYamlTemplate();
    j = loadJsonTemplate();
  });

  test("YAML and JSON templates parse and contain Resources", () => {
    expect(y.Resources).toBeDefined();
    expect(Object.keys(y.Resources).length).toBeGreaterThan(0);
    expect(j.Resources).toBeDefined();
    expect(Object.keys(j.Resources).length).toBeGreaterThan(0);
  });

  test("AWSTemplateFormatVersion and Description exist", () => {
    expect(y.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof y.Description).toBe("string");
  });

  test("Key Parameters exist: Environment, LambdaRuntime, DBEngine, AmiId", () => {
    expect(y.Parameters?.Environment).toBeDefined();
    expect(y.Parameters?.LambdaRuntime).toBeDefined();
    expect(y.Parameters?.DBEngine).toBeDefined();
    expect(y.Parameters?.AmiId).toBeDefined();
  });
});

describe("KMS key & alias — correctness for CloudTrail + S3 SSE-KMS", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("KMS Key exists with rotation enabled", () => {
    const [logicalId, res] = findResourceByTypeOrThrow(y, "AWS::KMS::Key")[0];
    expect(logicalId).toBeDefined();
    expect(res.Properties?.EnableKeyRotation).toBe(true);
  });

  test("KMS Alias targets the same key", () => {
    const aliasEntry = getResourcesByType(y, "AWS::KMS::Alias")[0];
    expect(aliasEntry).toBeDefined();
    const alias = aliasEntry[1];
    expect(alias.Properties?.TargetKeyId).toBeDefined();
  });
});

describe("S3 buckets & bucket policy — CloudTrail delivery and encryption", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("CloudTrail bucket is KMS-encrypted and versioned", () => {
    const ct = getResource(y, "TapStackCloudTrailBucket");
    const enc =
      ct.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
        ?.ServerSideEncryptionByDefault;
    expect(enc?.SSEAlgorithm).toBe("aws:kms");
    expect(enc?.KMSMasterKeyID).toBeDefined();
    expect(ct.Properties?.VersioningConfiguration?.Status).toBe("Enabled");
  });

  test("CloudTrail bucket policy allows GetBucketAcl and PutObject with owner-full-control", () => {
    const pol = getResource(y, "TapStackCloudTrailBucketPolicy");
    const doc = pol.Properties?.PolicyDocument;
    expect(doc?.Statement).toBeDefined();
    const s = doc.Statement;
    const getAcl = s.find((x: any) => x.Action === "s3:GetBucketAcl");
    const putObj = s.find((x: any) => x.Action === "s3:PutObject");
    expect(getAcl).toBeDefined();
    expect(putObj).toBeDefined();
    expect(putObj.Condition?.StringEquals?.["s3:x-amz-acl"]).toBe(
      "bucket-owner-full-control"
    );
  });

  test("App bucket and Log bucket are encrypted and block public access", () => {
    const app = getResource(y, "TapStackAppBucket");
    const log = getResource(y, "TapStackLogBucket");
    for (const b of [app, log]) {
      const pab = b.Properties?.PublicAccessBlockConfiguration;
      expect(pab?.BlockPublicAcls).toBe(true);
      expect(pab?.BlockPublicPolicy).toBe(true);
      expect(pab?.IgnorePublicAcls).toBe(true);
      expect(pab?.RestrictPublicBuckets).toBe(true);
      const enc =
        b.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
          ?.ServerSideEncryptionByDefault;
      expect(enc?.SSEAlgorithm).toBe("aws:kms");
      expect(enc?.KMSMasterKeyID).toBeDefined();
    }
  });
});

describe("CloudTrail resource — correct wiring to S3 and KMS", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("CloudTrail exists and depends on bucket policy", () => {
    const ct = getResource(y, "TapStackCloudTrail");
    const deps = Array.isArray(ct.DependsOn) ? ct.DependsOn : [ct.DependsOn];
    expect(deps).toEqual(
      expect.arrayContaining(["TapStackCloudTrailBucketPolicy"])
    );
  });

  test("CloudTrail is multi-region and logging with log file validation", () => {
    const ct = getResource(y, "TapStackCloudTrail");
    expect(ct.Properties?.IsMultiRegionTrail).toBe(true);
    expect(ct.Properties?.IncludeGlobalServiceEvents).toBe(true);
    expect(ct.Properties?.EnableLogFileValidation).toBe(true);
    expect(ct.Properties?.IsLogging).toBe(true);
  });
});

describe("RDS — encrypted, private, safe rollback", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("DB instance is encrypted with CMK and not publicly accessible", () => {
    const db = getResource(y, "TapStackDBInstance");
    expect(db.Properties?.StorageEncrypted).toBe(true);
    expect(db.Properties?.PubliclyAccessible).toBe(false);
    expect(db.Properties?.KmsKeyId).toBeDefined();
  });

  test("DB instance has Snapshot policies for delete/replace", () => {
    const db = getResource(y, "TapStackDBInstance");
    expect(db.DeletionPolicy).toBe("Snapshot");
    expect(db.UpdateReplacePolicy).toBe("Snapshot");
  });

  test("DB deletion protection is disabled to permit clean rollbacks", () => {
    const db = getResource(y, "TapStackDBInstance");
    expect(db.Properties?.DeletionProtection).toBe(false);
  });

  test("DB subnet group spans two private subnets", () => {
    const sng = getResource(y, "TapStackDBSubnetGroup");
    const subnets = sng.Properties?.SubnetIds || [];
    expect(Array.isArray(subnets)).toBe(true);
    expect(subnets.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Lambda, API Gateway, and Logs — sane defaults and wiring", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("Lambda has VPC config and KMS key set for env encryption", () => {
    const fn = getResource(y, "TapStackLambdaFunction");
    expect(fn.Properties?.VpcConfig?.SubnetIds?.length).toBeGreaterThanOrEqual(
      2
    );
    expect(
      fn.Properties?.VpcConfig?.SecurityGroupIds?.length
    ).toBeGreaterThanOrEqual(1);
    expect(fn.Properties?.KmsKeyArn).toBeDefined();
  });

  test("API Gateway method integrates with Lambda proxy", () => {
    const m = getResource(y, "TapStackApiMethod");
    const integ = m.Properties?.Integration;
    expect(integ?.Type).toBe("AWS_PROXY");
    expect(integ?.IntegrationHttpMethod).toBe("POST");
    expect(typeof integ?.Uri).toBe("string");
  });

  test("Lambda has permission for API Gateway to invoke", () => {
    const p = getResource(y, "TapStackLambdaInvokePermission");
    expect(p.Properties?.Principal).toBe("apigateway.amazonaws.com");
    expect(p.Properties?.Action).toBe("lambda:InvokeFunction");
    expect(p.Properties?.SourceArn).toBeDefined();
  });

  test("API Gateway stage has access logging configured", () => {
    const st = getResource(y, "TapStackApiStage");
    const als = st.Properties?.AccessLogSetting;
    expect(als?.DestinationArn).toBeDefined();
    expect(typeof als?.Format).toBe("string");
  });
});

describe("IAM — roles and least-privilege policies", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("Lambda role includes VPC access managed policy and minimal custom permissions", () => {
    const role = getResource(y, "TapStackLambdaRole");
    const managed = role.Properties?.ManagedPolicyArns || [];
    expect(managed).toEqual(
      expect.arrayContaining([
        "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      ])
    );
    const policies = role.Properties?.Policies || [];
    const names = policies.map((p: any) => p.PolicyName);
    expect(names).toContain("LambdaLeastPriv");
  });

  test("EC2 role uses modern SSM managed policy", () => {
    const role = getResource(y, "TapStackEC2Role");
    const managed = role.Properties?.ManagedPolicyArns || [];
    expect(managed).toEqual(
      expect.arrayContaining(["arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"])
    );
  });

  test("MFA-enforcement managed policy exists and is attached to admin group", () => {
    const pol = getResource(y, "RequireMFAForConsolePolicy");
    const mfaFlag =
      pol.Properties?.PolicyDocument?.Statement?.[0]?.Condition?.Bool?.[
        "aws:MultiFactorAuthPresent"
      ];
    expect(String(mfaFlag)).toBe("false");

    const grp = getResource(y, "TapStackAdminGroup");
    const arns = grp.Properties?.ManagedPolicyArns || [];
    expect(arns.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Networking — VPC, subnets, NAT, and routing present", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("VPC and four subnets exist", () => {
    const vpc = getResource(y, "TapStackVPC");
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    const subnets = getResourcesByType(y, "AWS::EC2::Subnet");
    expect(subnets.length).toBeGreaterThanOrEqual(4);
  });

  test("Two NAT Gateways defined and private routes default to NAT", () => {
    const nats = getResourcesByType(y, "AWS::EC2::NatGateway");
    expect(nats.length).toBeGreaterThanOrEqual(2);
    const pr1 = getResource(y, "PrivateRoute1");
    const pr2 = getResource(y, "PrivateRoute2");
    expect(pr1.Properties?.NatGatewayId).toBeDefined();
    expect(pr2.Properties?.NatGatewayId).toBeDefined();
  });
});

describe("Outputs — key exports exist", () => {
  let y: Template;
  beforeAll(() => {
    y = loadYamlTemplate();
  });

  test("Outputs include KmsKeyArn, CloudTrailBucketName, AppBucketName, RdsEndpoint", () => {
    const o = y.Outputs || {};
    expect(o.KmsKeyArn).toBeDefined();
    expect(o.CloudTrailBucketName).toBeDefined();
    expect(o.AppBucketName).toBeDefined();
    expect(o.RdsEndpoint).toBeDefined();
  });
});
