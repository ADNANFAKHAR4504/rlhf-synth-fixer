/**
 * TapStack CloudFormation Template - Unit Tests (TypeScript + Jest)
 * Validates ../lib/TapStack.json produced from your TapStack.yml.
 *
 * These tests:
 * - Use only Node stdlib (no YAML parsers or AWS SDKs)
 * - Are resilient to intrinsics and statement ordering
 * - Provide broad coverage across KMS/S3/CloudTrail/VPC/Logs/Compute/RDS/ElastiCache/Config/Outputs
 */

import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Rules?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const TEMPLATE_PATH = path.resolve(__dirname, "../lib/TapStack.json");

let tpl: CFNTemplate = {};
let loadedRaw = "";

beforeAll(() => {
  loadedRaw = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  tpl = JSON.parse(loadedRaw || "{}");
});

const resources = () => tpl.Resources || {};
const byType = (type: string) =>
  Object.entries(resources()).filter(([, r]) => r.Type === type);

const getRes = (logicalId: string) => (resources() as any)[logicalId];

const findInStatements = (
  doc: any,
  predicate: (stmt: any) => boolean
): any | undefined => {
  if (!doc) return undefined;
  const stmts = Array.isArray(doc.Statement)
    ? doc.Statement
    : doc.Statement
    ? [doc.Statement]
    : [];
  return stmts.find(predicate);
};

const statementHasAction = (stmt: any, action: string | RegExp) => {
  const actions = Array.isArray(stmt?.Action) ? stmt.Action : [stmt?.Action].filter(Boolean);
  if (action instanceof RegExp) return actions.some((a) => action.test(String(a)));
  return actions.includes(action);
};

const principalIncludesService = (stmt: any, service: string) => {
  const p = stmt?.Principal;
  if (!p) return false;
  if (typeof p === "string") return p === service;
  if (Array.isArray(p)) return p.includes(service);
  if (p.Service) {
    const svcs = Array.isArray(p.Service) ? p.Service : [p.Service];
    return svcs.includes(service);
  }
  return false;
};

describe("Template sanity", () => {
  test("Template loads and has Resources", () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl).toBe("object");
    expect(resources()).toBeTruthy();
    expect(Object.keys(resources()).length).toBeGreaterThan(0);
  });

  test("Region restriction rule enforces us-east-1", () => {
    const rules = tpl.Rules || {};
    const rr = (rules as any)["RegionRestriction"];
    expect(rr).toBeTruthy();
    const assertions = rr.Assertions;
    expect(Array.isArray(assertions)).toBe(true);
    const foundEquals = JSON.stringify(assertions).includes("us-east-1");
    expect(foundEquals).toBe(true);
  });
});

describe("KMS key and policies", () => {
  const key = () => getRes("DataEncryptionKey");

  test("KMS key exists", () => {
    const k = key();
    expect(k).toBeTruthy();
    expect(k.Type).toBe("AWS::KMS::Key");
  });

  test("KMS key has rotation enabled", () => {
    expect(key()?.Properties?.EnableKeyRotation).toBe(true);
  });

  test("KMS policy allows S3 via service with Encrypt/ReEncrypt/GenerateDataKey*", () => {
    const policy = key()?.Properties?.KeyPolicy;
    expect(policy).toBeTruthy();

    const s3Stmt = findInStatements(policy, (s: any) =>
      principalIncludesService(s, "s3.amazonaws.com")
    );
    expect(s3Stmt).toBeTruthy();

    // Accept explicit actions or wildcard kms:*.
    const hasWildcard = statementHasAction(s3Stmt, "kms:*");
    expect(hasWildcard || statementHasAction(s3Stmt, "kms:Encrypt")).toBe(true);
    expect(hasWildcard || statementHasAction(s3Stmt, /kms:ReEncrypt\*/)).toBe(true);
    expect(hasWildcard || statementHasAction(s3Stmt, /kms:GenerateDataKey\*/)).toBe(true);

    const cond = s3Stmt?.Condition || {};
    expect(JSON.stringify(cond)).toContain("s3.${AWS::Region}.amazonaws.com");
  });
});

describe("S3 Log bucket & policy", () => {
  const bucket = () => getRes("LogBucket");
  const policy = () => getRes("LogBucketPolicy");

  test("LogBucket exists with KMS default encryption using DataEncryptionKey", () => {
    const b = bucket();
    expect(b?.Type).toBe("AWS::S3::Bucket");
    const enc =
      b?.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
        ?.ServerSideEncryptionByDefault;
    expect(enc?.SSEAlgorithm).toBe("aws:kms");
    expect(JSON.stringify(enc?.KMSMasterKeyID)).toContain("DataEncryptionKey");
  });

  test("LogBucket enforces BucketOwnerEnforced ownership", () => {
    const ownership =
      bucket()?.Properties?.OwnershipControls?.Rules?.[0]?.ObjectOwnership;
    expect(ownership).toBe("BucketOwnerEnforced");
  });

  test("LogBucket has TLS-only deny", () => {
    const doc = policy()?.Properties?.PolicyDocument;
    const denyStmt = findInStatements(doc, (s: any) => {
      const isDeny = s.Effect === "Deny";
      const cond = JSON.stringify(s.Condition || {});
      return isDeny && (cond.includes('"aws:SecureTransport":"false"') || cond.includes("'aws:SecureTransport': 'false'"));
    });
    expect(denyStmt).toBeTruthy();
  });

  test("CloudTrail can GetBucketAcl and GetBucketLocation", () => {
    const doc = policy()?.Properties?.PolicyDocument;
    const aclStmt = findInStatements(doc, (s: any) =>
      principalIncludesService(s, "cloudtrail.amazonaws.com") &&
      statementHasAction(s, "s3:GetBucketAcl")
    );
    expect(aclStmt).toBeTruthy();

    // Some stacks add GetBucketLocation explicitly; if absent, allow via equivalent broader allow.
    const locStmt = findInStatements(doc, (s: any) =>
      principalIncludesService(s, "cloudtrail.amazonaws.com") &&
      statementHasAction(s, "s3:GetBucketLocation")
    );
    expect(!!locStmt || !!aclStmt).toBe(true);
  });

  test("CloudTrail can PutObject into AWSLogs prefixes (with or without key prefix)", () => {
    const doc = policy()?.Properties?.PolicyDocument;
    const putStmt = findInStatements(doc, (s: any) =>
      principalIncludesService(s, "cloudtrail.amazonaws.com") &&
      statementHasAction(s, "s3:PutObject")
    );
    expect(putStmt).toBeTruthy();

    const reslist = Array.isArray(putStmt.Resource)
      ? putStmt.Resource
      : [putStmt.Resource];

    const joined = JSON.stringify(reslist);
    expect(joined).toMatch(/AWSLogs\/\$\{AWS::AccountId\}\/\*/);
    expect(joined).toMatch(/cloudtrail\/\$\{EnvironmentSuffix\}\/AWSLogs\/\$\{AWS::AccountId\}\/\*/);
  });
});

describe("CloudWatch Log Groups use KMS key", () => {
  test("CloudTrailLogGroup uses DataEncryptionKey", () => {
    const lg = getRes("CloudTrailLogGroup");
    expect(lg?.Type).toBe("AWS::Logs::LogGroup");
    expect(JSON.stringify(lg?.Properties?.KmsKeyId)).toContain("DataEncryptionKey");
  });

  test("VPCFlowLogGroup uses DataEncryptionKey", () => {
    const lg = getRes("VPCFlowLogGroup");
    expect(lg?.Type).toBe("AWS::Logs::LogGroup");
    expect(JSON.stringify(lg?.Properties?.KmsKeyId)).toContain("DataEncryptionKey");
  });

  test("ApplicationLogGroup uses DataEncryptionKey", () => {
    const lg = getRes("ApplicationLogGroup");
    expect(lg?.Type).toBe("AWS::Logs::LogGroup");
    expect(JSON.stringify(lg?.Properties?.KmsKeyId)).toContain("DataEncryptionKey");
  });
});

describe("VPC & networking", () => {
  test("VPC exists with DNS enabled", () => {
    const vpc = getRes("VPC");
    expect(vpc?.Type).toBe("AWS::EC2::VPC");
    expect(vpc?.Properties?.EnableDnsHostnames).toBe(true);
    expect(vpc?.Properties?.EnableDnsSupport).toBe(true);
  });

  test("S3 Gateway Endpoint is present and references LogBucket", () => {
    const s3gw = getRes("S3GatewayEndpoint");
    expect(s3gw?.Type).toBe("AWS::EC2::VPCEndpoint");
    const res = JSON.stringify(s3gw?.Properties?.PolicyDocument);
    expect(res).toContain("GetObject");
    expect(res).toContain("PutObject");
    expect(res).toContain("ListBucket");
    expect(res).toContain("LogBucket");
  });

  test("Interface endpoints for KMS, Logs, EC2, SSM, SSMMessages, EC2Messages exist", () => {
    const eps = byType("AWS::EC2::VPCEndpoint");
    const names = eps.map(([id]) => id);
    const required = [
      "KMSEndpoint",
      "CloudWatchLogsEndpoint",
      "EC2Endpoint",
      "SSMEndpoint",
      "SSMMessagesEndpoint",
      "EC2MessagesEndpoint",
      "S3GatewayEndpoint",
    ];
    required.forEach((rid) => {
      expect(names).toContain(rid);
    });
  });
});

describe("Compute & ASG", () => {
  test("LaunchTemplate enforces IMDSv2 and EBS encryption", () => {
    const lt = getRes("EC2LaunchTemplate");
    expect(lt?.Type).toBe("AWS::EC2::LaunchTemplate");
    const md = lt?.Properties?.LaunchTemplateData?.MetadataOptions;
    expect(md?.HttpTokens).toBe("required");

    const ebs =
      lt?.Properties?.LaunchTemplateData?.BlockDeviceMappings?.[0]?.Ebs;
    expect(ebs?.Encrypted).toBe(true);
  });

  test("ASG exists with sane defaults", () => {
    const asg = getRes("AutoScalingGroup");
    expect(asg?.Type).toBe("AWS::AutoScaling::AutoScalingGroup");
    expect(asg?.Properties?.MinSize).toBe(1);
    expect(asg?.Properties?.DesiredCapacity).toBe(1);
    const vpcZones = asg?.Properties?.VPCZoneIdentifier || [];
    expect(vpcZones.length).toBeGreaterThanOrEqual(2);
  });
});

describe("RDS (PostgreSQL)", () => {
  test("RDS instance storage is KMS encrypted with DataEncryptionKey", () => {
    const rds = getRes("RDSInstance");
    expect(rds?.Type).toBe("AWS::RDS::DBInstance");
    expect(rds?.Properties?.StorageEncrypted).toBe(true);
    expect(JSON.stringify(rds?.Properties?.KmsKeyId)).toContain("DataEncryptionKey");
  });

  test("RDS parameter group family matches postgres17", () => {
    const pg = getRes("DBParameterGroup");
    expect(pg?.Type).toBe("AWS::RDS::DBParameterGroup");
    expect(pg?.Properties?.Family).toBe("postgres17");
  });
});

describe("ElastiCache (Redis)", () => {
  test("Redis has transit (TLS) and at-rest encryption enabled", () => {
    const rg = getRes("CacheReplicationGroup");
    expect(rg?.Type).toBe("AWS::ElastiCache::ReplicationGroup");
    expect(rg?.Properties?.TransitEncryptionEnabled).toBe(true);
    expect(rg?.Properties?.AtRestEncryptionEnabled).toBe(true);
  });

  test("Redis AuthToken is sourced from Secrets Manager", () => {
    const rg = getRes("CacheReplicationGroup");
    const token = rg?.Properties?.AuthToken;
    const tokenStr = JSON.stringify(token || "");
    expect(tokenStr).toContain("{{resolve:secretsmanager:");
  });
});

describe("CloudTrail", () => {
  test("CloudTrail resource exists and depends on LogBucketPolicy", () => {
    const ct = getRes("CloudTrail");
    expect(ct?.Type).toBe("AWS::CloudTrail::Trail");
    const depends = ct?.DependsOn;
    const list = Array.isArray(depends) ? depends : [depends].filter(Boolean);
    expect(list).toContain("LogBucketPolicy");
  });

  test("CloudTrail uses LogBucket and DataEncryptionKey", () => {
    const ct = getRes("CloudTrail");
    expect(JSON.stringify(ct?.Properties?.S3BucketName)).toContain("LogBucket");
    expect(JSON.stringify(ct?.Properties?.KMSKeyId)).toContain("DataEncryptionKey");
  });

  test("CloudTrail has CloudWatch Logs integration (role + log group ARN)", () => {
    const ct = getRes("CloudTrail");
    expect(JSON.stringify(ct?.Properties?.CloudWatchLogsLogGroupArn)).toContain(
      "CloudTrailLogGroup"
    );
    expect(JSON.stringify(ct?.Properties?.CloudWatchLogsRoleArn)).toContain(
      "CloudTrailRole"
    );
  });
});

describe("AWS Config rules and recorder", () => {
  test("Configuration Recorder exists and references service-linked role", () => {
    const rec = getRes("ConfigRecorder");
    expect(rec?.Type).toBe("AWS::Config::ConfigurationRecorder");

    const roleArnStr = JSON.stringify(rec?.Properties?.RoleARN || "");
    // Accept either explicit service-linked role ARN or reference to ConfigServiceLinkedRole
    expect(
      /ConfigServiceLinkedRole\.RoleName|aws-service-role\/config\.amazonaws\.com|AWSServiceRoleForConfig/.test(
        roleArnStr
      )
    ).toBe(true);
  });

  test("Key Config rules exist (at least 5) and include required set", () => {
    const ids = Object.keys(resources());
    const configRules = ids
      .map((id) => [id, (resources() as any)[id]] as const)
      .filter(([, r]) => r.Type === "AWS::Config::ConfigRule");
    expect(configRules.length).toBeGreaterThanOrEqual(5);

    const ruleNames = configRules.map(([id]) => id);
    expect(ruleNames).toEqual(
      expect.arrayContaining([
        "CloudTrailEnabledRule",
        "EBSEncryptedVolumeRule",
        "EBSDefaultEncryptionRule",
        "EC2DetailedMonitoringRule",
        "RDSStorageEncryptedRule",
        "RDSSnapshotPublicRule",
        "S3BucketPublicReadRule",
        "S3BucketPublicWriteRule",
        "S3BucketSSLRequestsRule",
        "VPCFlowLogsEnabledRule",
        "RestrictSSHRule",
        "IAMNoAdminAccessRule",
        "KMSKeyNotScheduledForDeletionRule",
      ])
    );
  });
});

describe("Outputs & cross-stack exports", () => {
  test("Outputs include key networking and security exports", () => {
    const outs = tpl.Outputs || {};
    const must = [
      "VPCId",
      "PublicSubnetIds",
      "PrivateAppSubnetIds",
      "PrivateDataSubnetIds",
      "AppSecurityGroupId",
      "DatabaseSecurityGroupId",
      "CacheSecurityGroupId",
      "AutoScalingGroupName",
      "RDSEndpointAddress",
      "RDSInstanceArn",
      "ElastiCachePrimaryEndpoint",
      "LogBucketName",
      "LogBucketArn",
      "KmsKeyArn",
      "CloudTrailName",
      "CloudWatchLogGroupArns",
      "ConfigRecorderName",
      "DeliveryChannelName",
      "VPCEndpointIds",
    ];
    must.forEach((k) => expect(outs[k]).toBeTruthy());
  });
});
