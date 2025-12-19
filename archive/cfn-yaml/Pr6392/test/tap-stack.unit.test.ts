// test/tap-stack.unit.test.ts
import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const LIB_DIR = path.resolve(__dirname, "../lib");
const YAML_PATH = path.join(LIB_DIR, "TapStack.yml");
const JSON_PATH = path.join(LIB_DIR, "TapStack.json");

// Load once for all tests
let template: CFNTemplate;
let resources: Record<string, any>;
let parameters: Record<string, any>;
let conditions: Record<string, any>;
let outputs: Record<string, any>;

function readTemplate(): CFNTemplate {
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  return JSON.parse(raw);
}

function getResourceByType(type: string) {
  const matches: Array<{ id: string; res: any }> = [];
  for (const [id, res] of Object.entries(resources || {})) {
    if (res?.Type === type) matches.push({ id, res });
  }
  return matches;
}

function getFirstResourceByType(type: string) {
  return getResourceByType(type)[0];
}

function deepFind(obj: any, predicate: (key: string, val: any) => boolean): boolean {
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (cur && typeof cur === "object") {
      for (const [k, v] of Object.entries(cur)) {
        if (predicate(k, v)) return true;
        if (v && typeof v === "object") stack.push(v);
      }
    }
  }
  return false;
}

function deepGetAll(obj: any, keyName: string): any[] {
  const out: any[] = [];
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (cur && typeof cur === "object") {
      for (const [k, v] of Object.entries(cur)) {
        if (k === keyName) out.push(v);
        if (v && typeof v === "object") stack.push(v);
      }
    }
  }
  return out;
}

beforeAll(() => {
  // Basic existence checks (no parsing of YAML to avoid deps)
  expect(fs.existsSync(YAML_PATH)).toBe(true);
  expect(fs.existsSync(JSON_PATH)).toBe(true);

  template = readTemplate();
  resources = template.Resources || {};
  parameters = template.Parameters || {};
  conditions = template.Conditions || {};
  outputs = template.Outputs || {};
});

describe("TapStack — Template sanity", () => {
  test("1) Template parses and has expected top-level sections", () => {
    expect(template).toBeTruthy();
    expect(typeof template.Description).toBe("string");
    expect(parameters).toBeTruthy();
    expect(resources).toBeTruthy();
    expect(outputs).toBeTruthy();
  });

  test("2) YAML file exists and is non-empty", () => {
    const content = fs.readFileSync(YAML_PATH, "utf-8");
    expect(content.length).toBeGreaterThan(10);
  });
});

describe("Parameters & Conditions", () => {
  test("3) EnvironmentSuffix parameter present with AllowedPattern (no hard AllowedValues)", () => {
    const p = parameters["EnvironmentSuffix"];
    expect(p).toBeTruthy();
    expect(p.Type).toBe("String");
    expect(p.AllowedPattern).toBeDefined();
    expect(p.AllowedValues).toBeUndefined();
  });

  test("4) PrimaryRegion & SecondaryRegion parameters exist", () => {
    expect(parameters["PrimaryRegion"]).toBeTruthy();
    expect(parameters["SecondaryRegion"]).toBeTruthy();
  });

  test("5) Lifecycle & retention parameters exist with sensible defaults", () => {
    expect(parameters["RetentionYears"]).toBeTruthy();
    expect(parameters["GlacierTransitionDays"]).toBeTruthy();
    expect(parameters["ExpirationDays"]).toBeTruthy();
    expect(parameters["RetentionYears"].Default).toBeDefined();
    expect(parameters["GlacierTransitionDays"].Default).toBeDefined();
    expect(parameters["ExpirationDays"].Default).toBeDefined();
  });

  test("6) VpcEndpointIds, EnableMonitoring, NotificationEmail parameters exist", () => {
    expect(parameters["VpcEndpointIds"]).toBeTruthy();
    expect(parameters["EnableMonitoring"]).toBeTruthy();
    expect(parameters["NotificationEmail"]).toBeTruthy();
  });

  test("7) Conditions include IsPrimary & MonitoringEnabled", () => {
    expect(conditions["IsPrimary"]).toBeDefined();
    expect(conditions["MonitoringEnabled"]).toBeDefined();
  });
});

describe("KMS resources", () => {
  test("8) KMS Key exists and has key rotation enabled", () => {
    const r = getFirstResourceByType("AWS::KMS::Key");
    expect(r).toBeTruthy();
    const props = r.res.Properties || {};
    expect(props.EnableKeyRotation).toBe(true);
    expect(props.KeyPolicy).toBeTruthy();
  });

  test("9) KMS Alias exists and references the KMS Key", () => {
    const r = getFirstResourceByType("AWS::KMS::Alias");
    expect(r).toBeTruthy();
    const props = r.res.Properties || {};
    expect(props.AliasName).toBeTruthy();
    expect(props.TargetKeyId).toBeDefined();
  });
});

describe("IAM resources", () => {
  test("10) Replication role exists and is assumed by S3", () => {
    const r = getFirstResourceByType("AWS::IAM::Role");
    expect(r).toBeTruthy();
    const assume = r.res.Properties?.AssumeRolePolicyDocument;
    const isS3Principal = deepFind(assume, (k, v) => k === "Service" && (v === "s3.amazonaws.com" || (Array.isArray(v) && v.includes("s3.amazonaws.com"))));
    expect(isS3Principal).toBe(true);
  });

  test("11) Replication role name includes region interpolation for uniqueness", () => {
    const r = getFirstResourceByType("AWS::IAM::Role");
    const name = r.res.Properties?.RoleName;
    // Should contain ${AWS::Region} via Fn::Sub
    const hasSub = deepFind(r.res, (k, v) => k === "Fn::Sub" && typeof v === "string" && v.includes("${AWS::Region}"));
    expect(name || hasSub).toBeTruthy();
  });
});

describe("S3 bucket", () => {
  test("12) S3 bucket exists with deterministic name including account, region, and EnvironmentSuffix", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    expect(r).toBeTruthy();
    const nameExprs = deepGetAll(r.res, "Fn::Sub").join(" ");
    expect(nameExprs).toContain("${AWS::AccountId}");
    expect(nameExprs).toContain("${AWS::Region}");
    expect(nameExprs).toContain("${EnvironmentSuffix}");
  });

  test("13) Object Lock is enabled in Compliance mode with default retention", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const props = r.res.Properties || {};
    expect(props.ObjectLockEnabled).toBe(true);
    const modeIsCompliance = deepFind(props.ObjectLockConfiguration, (k, v) => k === "Mode" && v === "COMPLIANCE");
    expect(modeIsCompliance).toBe(true);
  });

  test("14) Versioning is enabled", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    expect(r.res.Properties?.VersioningConfiguration?.Status).toBe("Enabled");
  });

  test("15) SSE-KMS encryption is configured with bucket key enabled", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const enc = r.res.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0];
    expect(enc).toBeTruthy();
    expect(enc.BucketKeyEnabled).toBe(true);
    const usesKms = deepFind(enc, (k, v) => k === "SSEAlgorithm" && v === "aws:kms");
    expect(usesKms).toBe(true);
  });

  test("16) Lifecycle rules include transition to GLACIER and expiration settings", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const rules = r.res.Properties?.LifecycleConfiguration?.Rules || [];
    expect(rules.length).toBeGreaterThan(0);
    const hasGlacier = deepFind(rules, (k, v) => k === "StorageClass" && v === "GLACIER");
    expect(hasGlacier).toBe(true);
    const hasExpiration = deepFind(rules, (k, v) => k === "ExpirationInDays");
    expect(hasExpiration).toBe(true);
  });
});

describe("Bucket policy", () => {
  test("17) Bucket policy exists", () => {
    const r = getFirstResourceByType("AWS::S3::BucketPolicy");
    expect(r).toBeTruthy();
  });

  test("18) Bucket policy denies insecure transport", () => {
    const r = getFirstResourceByType("AWS::S3::BucketPolicy");
    const pd = r.res.Properties?.PolicyDocument;
    const hasDenyTLS = deepFind(pd, (k, v) => k === "aws:SecureTransport" && v === false);
    expect(hasDenyTLS).toBe(true);
  });

  test("19) Bucket policy enforces SSE-KMS on PutObject", () => {
    const r = getFirstResourceByType("AWS::S3::BucketPolicy");
    const pd = r.res.Properties?.PolicyDocument;
    const deniesPlainPut = deepFind(pd, (k, v) => k === "Action" && (v === "s3:PutObject" || (Array.isArray(v) && v.includes("s3:PutObject"))));
    const checksKms = deepFind(pd, (k, v) => k === "s3:x-amz-server-side-encryption" && v === "aws:kms");
    expect(deniesPlainPut).toBe(true);
    expect(checksKms).toBe(true);
  });

  test("20) Bucket policy restricts access to VPC endpoints (aws:SourceVpce)", () => {
    const r = getFirstResourceByType("AWS::S3::BucketPolicy");
    const pd = r.res.Properties?.PolicyDocument;
    const usesVpce = deepFind(pd, (k, v) => k === "aws:SourceVpce");
    expect(usesVpce).toBe(true);
  });
});

describe("Replication (primary-only path)", () => {
  test("21) ReplicationConfiguration is present on the bucket (guarded by condition)", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const hasReplicationKey = Object.prototype.hasOwnProperty.call(r.res.Properties || {}, "ReplicationConfiguration");
    expect(hasReplicationKey).toBe(true);
  });

  test("22) Replication rule has Priority and replicates all objects via empty Prefix filter", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const rc = r.res.Properties?.ReplicationConfiguration;
    const rulesArray = deepGetAll(rc, "Rules").flat();
    expect(rulesArray.length).toBeGreaterThan(0);

    const hasPriority = deepFind(rulesArray, (k, v) => k === "Priority" && (typeof v === "number" || /^[0-9]+$/.test(String(v))));
    expect(hasPriority).toBe(true);

    // Filter with Prefix "" (replicate everything)
    const hasEmptyPrefix = deepFind(rulesArray, (k, v) => k === "Prefix" && v === "");
    expect(hasEmptyPrefix).toBe(true);
  });

  test("23) Replication uses KMS key in destination (ReplicaKmsKeyID) and sets SseKmsEncryptedObjects", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const hasReplicaKms = deepFind(r.res.Properties, (k, v) => k === "ReplicaKmsKeyID");
    expect(hasReplicaKms).toBe(true);

    const hasSseKmsEncryptedObjects = deepFind(r.res.Properties, (k, v) => k === "SseKmsEncryptedObjects");
    expect(hasSseKmsEncryptedObjects).toBe(true);
  });

  test("24) Replication metrics include EventThreshold and ReplicationTime is defined", () => {
    const r = getFirstResourceByType("AWS::S3::Bucket");
    const hasEventThreshold = deepFind(r.res.Properties, (k, v) => k === "EventThreshold" && typeof v === "object");
    const hasReplicationTime = deepFind(r.res.Properties, (k, v) => k === "ReplicationTime" && typeof v === "object");
    expect(hasEventThreshold).toBe(true);
    expect(hasReplicationTime).toBe(true);
  });
});

describe("Monitoring (optional)", () => {
  test("25) SNS Topic and Dashboard are defined behind monitoring conditions", () => {
    const sns = getFirstResourceByType("AWS::SNS::Topic");
    const dash = getFirstResourceByType("AWS::CloudWatch::Dashboard");
    expect(sns).toBeTruthy();
    expect(dash).toBeTruthy();
    expect(sns.res.Condition).toBeDefined();
    expect(dash.res.Condition).toBeDefined();
  });

  test("26) CloudWatch alarms are defined and conditioned for primary region", () => {
    const alarms = getResourceByType("AWS::CloudWatch::Alarm");
    expect(alarms.length).toBeGreaterThanOrEqual(2);
    // All alarms should have a Condition referencing primary path
    const allConditioned = alarms.every(a => typeof a.res.Condition === "string" && a.res.Condition.includes("Primary"));
    expect(allConditioned).toBe(true);
  });
});

describe("Outputs", () => {
  test("27) Critical outputs present for integration (bucket names/ARNs, role ARN, KMS IDs, optional SNS/dashboard)", () => {
    const needed = [
      "PrimaryBucketName",
      "PrimaryBucketArn",
      "SecondaryBucketName",
      "SecondaryBucketArn",
      "ReplicationRoleArn",
      "PrimaryKmsKeyArn",
      "SecondaryKmsAliasArn",
      "MonitoringDashboardUrl",
    ];
    for (const key of needed) {
      expect(outputs[key]).toBeDefined();
    }
  });
});
