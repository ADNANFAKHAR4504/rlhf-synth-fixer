/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Minimal Node globals for TS projects without @types/node
declare var require: any;
declare var __dirname: string;
declare var process: any;

const fs = require("fs");
const path = require("path");

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, { Type: string; Properties?: Record<string, any> }>;
  Outputs?: Record<string, any>;
};

// ---------- helpers ----------
function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function tryLoadYaml(yamlPath: string): CFNTemplate | null {
  try {
    const yaml = require("js-yaml");
    const text = fs.readFileSync(yamlPath, "utf8");
    const obj = yaml.load(text);
    return (obj || {}) as CFNTemplate;
  } catch {
    return null;
  }
}

function loadTemplate(): { tpl: CFNTemplate; source: string } {
  const candidatesJSON = [
    path.resolve(__dirname, "../lib/TapStack.json"),
    path.resolve(process.cwd(), "../lib/TapStack.json"),
    path.resolve(process.cwd(), "lib/TapStack.json"),
  ];
  const candidatesYAML = [
    path.resolve(__dirname, "../lib/TapStack.yml"),
    path.resolve(process.cwd(), "../lib/TapStack.yml"),
    path.resolve(process.cwd(), "lib/TapStack.yml"),
  ];

  for (const p of candidatesJSON) {
    if (fileExists(p)) {
      const text = fs.readFileSync(p, "utf8");
      const tpl = JSON.parse(text) as CFNTemplate;
      return { tpl, source: p };
    }
  }

  for (const p of candidatesYAML) {
    if (fileExists(p)) {
      const tpl = tryLoadYaml(p);
      if (tpl) return { tpl, source: p };
    }
  }

  throw new Error(
    "Could not find ../lib/TapStack.json or ../lib/TapStack.yml. Ensure one of them exists relative to the test file."
  );
}

function resourcesByType(tpl: CFNTemplate, type: string) {
  const out: Array<{ id: string; r: any }> = [];
  const res = tpl.Resources || {};
  for (const [id, r] of Object.entries(res)) {
    if ((r as any).Type === type) out.push({ id, r });
  }
  return out;
}

function firstResourceOfType(tpl: CFNTemplate, type: string) {
  const list = resourcesByType(tpl, type);
  return list.length ? list[0] : undefined;
}

function getAllBucketPolicies(tpl: CFNTemplate) {
  return resourcesByType(tpl, "AWS::S3::BucketPolicy");
}

function findStatement(policyDoc: any, predicate: (stmt: any) => boolean) {
  const stmts = policyDoc?.Statement;
  if (!Array.isArray(stmts)) return undefined;
  return stmts.find(predicate);
}

// Intrinsic-aware guards
function isIntrinsic(val: any): boolean {
  if (!val || typeof val !== "object") return false;
  const keys = Object.keys(val);
  return keys.some((k) =>
    [
      "Ref",
      "Fn::Sub",
      "Fn::Join",
      "Fn::Select",
      "Fn::GetAtt",
      "Fn::If",
      "Fn::FindInMap",
      "Fn::ImportValue",
      "Fn::Equals",
      "Fn::Split",
      "Fn::SubString",
    ].includes(k)
  );
}
function isStringOrIntrinsic(val: any): boolean {
  return typeof val === "string" || isIntrinsic(val);
}
function containsSubstring(val: any, needle: string): boolean {
  if (typeof val === "string") return val.includes(needle);
  if (isIntrinsic(val)) return JSON.stringify(val).includes(needle);
  return false;
}

function extractAzIndex(azVal: any): string | null {
  // Detect patterns like: { "Fn::Select": [ 0, { "Fn::GetAZs": "" } ] }
  if (isIntrinsic(azVal) && azVal["Fn::Select"]) {
    const sel = azVal["Fn::Select"];
    if (Array.isArray(sel) && sel.length >= 1) {
      const idx = sel[0];
      if (typeof idx === "number" || typeof idx === "string") {
        return String(idx);
      }
    }
  }
  return null;
}

function cidrRegex(): RegExp {
  // IPv4 CIDR: a.b.c.d/0-32
  return new RegExp(
    "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(0|[1-9]|[12][0-9]|3[0-2]))$"
  );
}

// ---------- tests ----------
describe("TapStack - Unit Tests (Template-level validation)", () => {
  const { tpl, source } = loadTemplate();

  test("Template loads and has core sections", () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl.Description).toBe("string");
    expect(tpl.Resources && typeof tpl.Resources).toBe("object");
  });

  test("Parameters include safe defaults and required constraints", () => {
    const p = tpl.Parameters || {};
    expect(p).toBeTruthy();

    // Required params exist
    expect(p.ProjectName).toBeTruthy();
    expect(p.Environment).toBeTruthy();
    expect(p.Owner).toBeTruthy();
    expect(p.VpcCidr).toBeTruthy();
    expect(p.PublicSubnetCidrs).toBeTruthy();
    expect(p.PrivateSubnetCidrs).toBeTruthy();
    expect(p.AllowedSshCidr).toBeTruthy();

    // AllowedSshCidr default exists and matches CIDR
    const sshDef = p.AllowedSshCidr?.Default;
    expect(typeof sshDef).toBe("string");
    expect(cidrRegex().test(sshDef)).toBe(true);

    // VPC default CIDR looks sane
    const vpcDef = p.VpcCidr?.Default;
    expect(typeof vpcDef).toBe("string");
    expect(/^10\./.test(vpcDef)).toBe(true);
  });

  test("VPC exists with DNS support/hostnames enabled", () => {
    const vpc = firstResourceOfType(tpl, "AWS::EC2::VPC");
    expect(vpc).toBeTruthy();
    const props = vpc?.r?.Properties || {};
    expect(props.EnableDnsHostnames).toBe(true);
    expect(props.EnableDnsSupport).toBe(true);
    // Allow string or intrinsic (Ref/Sub/…)
    expect(isStringOrIntrinsic(props.CidrBlock)).toBe(true);
  });

  test("Subnets: at least 2 public and 2 private across AZs", () => {
    const subs = resourcesByType(tpl, "AWS::EC2::Subnet");
    expect(subs.length).toBeGreaterThanOrEqual(4);

    const publicSubs = subs.filter(
      ({ r }) => r?.Properties?.MapPublicIpOnLaunch === true
    );
    const privateSubs = subs.filter(
      ({ r }) => r?.Properties?.MapPublicIpOnLaunch !== true
    );

    expect(publicSubs.length).toBeGreaterThanOrEqual(2);
    expect(privateSubs.length).toBeGreaterThanOrEqual(2);

    // Distinct AZs among at least two subnets; accept string AZs or Fn::Select index (0/1/…)
    const azTokens = new Set<string>();
    subs.forEach(({ r }) => {
      const az = r?.Properties?.AvailabilityZone;
      if (!az) return;
      if (typeof az === "string") {
        azTokens.add(az);
      } else {
        const idx = extractAzIndex(az);
        if (idx !== null) azTokens.add(`idx-${idx}`);
      }
    });
    expect(azTokens.size).toBeGreaterThanOrEqual(2);
  });

  test("InternetGateway and NAT Gateways configured correctly", () => {
    expect(firstResourceOfType(tpl, "AWS::EC2::InternetGateway")).toBeTruthy();

    const eips = resourcesByType(tpl, "AWS::EC2::EIP");
    expect(eips.length).toBeGreaterThanOrEqual(2);
    eips.forEach(({ r }) => {
      expect(r?.Properties?.Domain).toBe("vpc");
    });

    const nats = resourcesByType(tpl, "AWS::EC2::NatGateway");
    expect(nats.length).toBeGreaterThanOrEqual(2);
  });

  test("Route tables and routes present (public => IGW, private => NAT)", () => {
    const rts = resourcesByType(tpl, "AWS::EC2::RouteTable");
    expect(rts.length).toBeGreaterThanOrEqual(3);

    const routes = resourcesByType(tpl, "AWS::EC2::Route");
    expect(routes.length).toBeGreaterThanOrEqual(3);

    const hasIGWDefault = routes.some(
      ({ r }) =>
        r?.Properties?.DestinationCidrBlock === "0.0.0.0/0" &&
        !!r?.Properties?.GatewayId
    );
    const hasNATDefault = routes.filter(
      ({ r }) =>
        r?.Properties?.DestinationCidrBlock === "0.0.0.0/0" &&
        !!r?.Properties?.NatGatewayId
    );
    expect(hasIGWDefault).toBe(true);
    expect(hasNATDefault.length).toBeGreaterThanOrEqual(2);
  });

  test("Security Groups: bastion restricts SSH by CIDR; private allows SSH only from bastion", () => {
    const sgs = resourcesByType(tpl, "AWS::EC2::SecurityGroup");
    expect(sgs.length).toBeGreaterThanOrEqual(2);

    const sshIngress = (sg: any) =>
      (sg?.r?.Properties?.SecurityGroupIngress || []).filter((ru: any) => {
        return (
          ru?.IpProtocol === "tcp" &&
          ru?.FromPort === 22 &&
          ru?.ToPort === 22
        );
      });

    // Bastion: SSH from CIDR (string or intrinsic)
    const bastionCandidate = sgs.find(({ r }) => {
      const ingress = sshIngress({ r });
      return ingress.some(
        (ru: any) =>
          isStringOrIntrinsic(ru?.CidrIp) || isStringOrIntrinsic(ru?.CidrIpv6)
      );
    });
    expect(bastionCandidate).toBeTruthy();

    // Private: SSH from SourceSecurityGroupId (bastion)
    const privateCandidate = sgs.find(({ r }) => {
      const ingress = sshIngress({ r });
      return ingress.some((ru: any) => !!ru?.SourceSecurityGroupId);
    });
    expect(privateCandidate).toBeTruthy();
  });

  test("KMS CMK and Alias exist", () => {
    expect(firstResourceOfType(tpl, "AWS::KMS::Key")).toBeTruthy();
    expect(firstResourceOfType(tpl, "AWS::KMS::Alias")).toBeTruthy();
  });

  test("S3 buckets: app + logs with SSE-KMS and strong public access block", () => {
    const buckets = resourcesByType(tpl, "AWS::S3::Bucket");
    expect(buckets.length).toBeGreaterThanOrEqual(2);

    let withSSE = 0;
    let withPAB = 0;
    let withVersioning = 0;

    for (const { r } of buckets) {
      const p = r?.Properties || {};
      if (p.BucketEncryption?.ServerSideEncryptionConfiguration) withSSE++;
      const pab = p.PublicAccessBlockConfiguration;
      if (
        pab?.BlockPublicAcls === true &&
        pab?.BlockPublicPolicy === true &&
        pab?.IgnorePublicAcls === true &&
        pab?.RestrictPublicBuckets === true
      )
        withPAB++;
      if (p.VersioningConfiguration?.Status === "Enabled") withVersioning++;
    }
    expect(withSSE).toBeGreaterThanOrEqual(2);
    expect(withPAB).toBeGreaterThanOrEqual(2);
    expect(withVersioning).toBeGreaterThanOrEqual(1); // at least logs bucket
  });

  test("S3 BucketPolicies enforce HTTPS and SSE-KMS with the right key", () => {
    const bps = getAllBucketPolicies(tpl);
    expect(bps.length).toBeGreaterThanOrEqual(2);

    const hasSecureTransportDeny = bps.some(({ r }) => {
      const stmt = findStatement(r?.Properties?.PolicyDocument, (s) => {
        const cond = s?.Condition?.Bool || s?.Condition?.BoolIfExists;
        return (
          s?.Effect === "Deny" &&
          cond &&
          (cond["aws:SecureTransport"] === "false" ||
            cond["aws:SecureTransport"] === false)
        );
      });
      return !!stmt;
    });
    expect(hasSecureTransportDeny).toBe(true);

    const hasSseKmsEnforce = bps.some(({ r }) => {
      const hasEnc = findStatement(r?.Properties?.PolicyDocument, (s) => {
        const sn = s?.Condition?.StringNotEquals;
        return (
          s?.Effect === "Deny" &&
          s?.Action === "s3:PutObject" &&
          sn &&
          (sn["s3:x-amz-server-side-encryption"] === "aws:kms" ||
            isIntrinsic(sn["s3:x-amz-server-side-encryption"]))
        );
      });
      const hasKeyId = findStatement(r?.Properties?.PolicyDocument, (s) => {
        const sn = s?.Condition?.StringNotEquals;
        return (
          s?.Effect === "Deny" &&
          s?.Action === "s3:PutObject" &&
          sn &&
          "s3:x-amz-server-side-encryption-aws-kms-key-id" in sn
        );
      });
      return !!hasEnc && !!hasKeyId;
    });
    expect(hasSseKmsEnforce).toBe(true);
  });

  test("CloudTrail enabled, KMS-encrypted, logging to S3, with IsLogging=true", () => {
    const trail = firstResourceOfType(tpl, "AWS::CloudTrail::Trail");
    expect(trail).toBeTruthy();
    const p = trail?.r?.Properties || {};
    expect(p.IsMultiRegionTrail).toBe(true);
    expect(p.EnableLogFileValidation).toBe(true);
    expect(p.IsLogging).toBe(true);
    expect(p.S3BucketName).toBeTruthy();
    expect(p.KMSKeyId).toBeTruthy();
  });

  test("VPC endpoints: gateway S3 (scoped policy) + interface SSM/* with PrivateDns", () => {
    const endpoints = resourcesByType(tpl, "AWS::EC2::VPCEndpoint");
    expect(endpoints.length).toBeGreaterThanOrEqual(4);

    const s3gw = endpoints.find(
      ({ r }) =>
        r?.Properties?.VpcEndpointType === "Gateway" &&
        containsSubstring(r?.Properties?.ServiceName, ".s3")
    );
    expect(s3gw).toBeTruthy();

    // Policy should scope to specific bucket ARNs (no Resource: "*")
    const s3PolicyRes = s3gw?.r?.Properties?.PolicyDocument?.Statement;
    if (Array.isArray(s3PolicyRes)) {
      const hasStar = JSON.stringify(s3PolicyRes).includes('"Resource":"*"');
      expect(hasStar).toBe(false);
    }

    const iface = endpoints.filter(
      ({ r }) => r?.Properties?.VpcEndpointType === "Interface"
    );
    expect(iface.length).toBeGreaterThanOrEqual(3);

    iface.forEach(({ r }) => {
      expect(r?.Properties?.PrivateDnsEnabled).toBe(true);
      const svc = r?.Properties?.ServiceName;
      expect(
        containsSubstring(svc, ".ssm") ||
          containsSubstring(svc, ".ec2messages") ||
          containsSubstring(svc, ".ssmmessages")
      ).toBe(true);
    });
  });

  test("IAM: Managed policies exist (AppDataAccess, MFA enforcement, Lambda cleanup)", () => {
    const mps = resourcesByType(tpl, "AWS::IAM::ManagedPolicy");
    expect(mps.length).toBeGreaterThanOrEqual(3);

    const hasAppDataAccess = mps.find(({ r }) => {
      const doc = r?.Properties?.PolicyDocument;
      const txt = JSON.stringify(doc || {});
      return (
        txt.includes("s3:ListBucket") &&
        txt.includes("s3:GetObject") &&
        txt.includes("kms:Decrypt")
      );
    });
    expect(hasAppDataAccess).toBeTruthy();

    const hasMfaDeny = mps.find(({ r }) => {
      const doc = r?.Properties?.PolicyDocument;
      const txt = JSON.stringify(doc || {});
      return (
        txt.includes('"Effect":"Deny"') &&
        txt.includes("iam:") &&
        (txt.includes("aws:MultiFactorAuthPresent") ||
          txt.includes("MultiFactorAuthPresent"))
      );
    });
    expect(hasMfaDeny).toBeTruthy();

    const hasLambdaCleanup = mps.find(({ r }) => {
      const txt = JSON.stringify(r?.Properties?.PolicyDocument || {});
      return txt.includes("ec2:DescribeVolumes") && txt.includes("ec2:DeleteVolume");
    });
    expect(hasLambdaCleanup).toBeTruthy();
  });

  test("IAM: Roles, Instance Profiles, and Group wiring present", () => {
    const roles = resourcesByType(tpl, "AWS::IAM::Role");
    expect(roles.length).toBeGreaterThanOrEqual(3);

    const bastionRole = roles.find(({ r }) =>
      JSON.stringify(r).includes("AmazonSSMManagedInstanceCore")
    );
    const privateRole = roles.find(({ r }) =>
      JSON.stringify(r).includes("AmazonSSMManagedInstanceCore")
    );
    expect(bastionRole).toBeTruthy();
    expect(privateRole).toBeTruthy();

    const ips = resourcesByType(tpl, "AWS::IAM::InstanceProfile");
    expect(ips.length).toBeGreaterThanOrEqual(2);

    const group = firstResourceOfType(tpl, "AWS::IAM::Group");
    expect(group).toBeTruthy();
    const gArns = group?.r?.Properties?.ManagedPolicyArns || [];
    expect(Array.isArray(gArns)).toBe(true);
    expect(gArns.length).toBeGreaterThanOrEqual(1);
  });

  test("Compute: Bastion EC2 + Private ASG via LaunchTemplate", () => {
    expect(firstResourceOfType(tpl, "AWS::EC2::Instance")).toBeTruthy();
    expect(firstResourceOfType(tpl, "AWS::EC2::LaunchTemplate")).toBeTruthy();
    const asg = firstResourceOfType(tpl, "AWS::AutoScaling::AutoScalingGroup");
    expect(asg).toBeTruthy();
    const vpcZones = asg?.r?.Properties?.VPCZoneIdentifier || [];
    expect(Array.isArray(vpcZones)).toBe(true);
    expect(vpcZones.length).toBeGreaterThanOrEqual(2);
  });

  test("Automation: EBS cleanup Lambda + schedule + permission are wired", () => {
    const lambda = firstResourceOfType(tpl, "AWS::Lambda::Function");
    expect(lambda).toBeTruthy();
    const env = lambda?.r?.Properties?.Environment?.Variables || {};
    expect(env.RETENTION_HOURS).toBeTruthy();
    expect(env.REQUIRE_TAG).toBeTruthy();

    const rule = firstResourceOfType(tpl, "AWS::Events::Rule");
    expect(rule).toBeTruthy();
    const targets = rule?.r?.Properties?.Targets || [];
    expect(Array.isArray(targets) && targets.length >= 1).toBe(true);

    const perm = firstResourceOfType(tpl, "AWS::Lambda::Permission");
    expect(perm).toBeTruthy();
    expect(perm?.r?.Properties?.Principal).toBe("events.amazonaws.com");
  });

  test("No hardcoded AWS credentials or private keys present", () => {
    const raw = fs.readFileSync(source, "utf8");
    const forbidden = [
      "AKIA", // access key prefix
      "aws_access_key_id",
      "aws_secret_access_key",
      "BEGIN PRIVATE KEY",
    ];
    const hit = forbidden.find((s) => raw.includes(s));
    expect(hit).toBeUndefined();
  });

  test("Outputs cover core identifiers/ARNs for consumers", () => {
    const o = tpl.Outputs || {};
    const needed = [
      "VpcId",
      "PublicSubnetIds",
      "PrivateSubnetIds",
      "NatGatewayIds",
      "InternetGatewayId",
      "S3AppBucketName",
      "S3LogsBucketName",
      "KmsKeyArn",
      "KmsAliasName",
      "CloudTrailArn",
      "TrailS3LogPrefix",
      "BastionInstanceId",
      "BastionPublicIp",
      "PrivateInstanceProfileName",
      "PrivateInstanceRoleName",
      "EbsCleanupLambdaArn",
      "EbsCleanupRuleName",
      "BastionSecurityGroupId",
      "PrivateSecurityGroupId",
      "ConsoleUsersGroupName",
    ];
    needed.forEach((k) => {
      expect(o[k]).toBeTruthy();
      expect(o[k].Value).toBeTruthy();
    });
  });
});
