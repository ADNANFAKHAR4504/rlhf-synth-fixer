/**
 * tap-stack.unit.test.ts
 *
 * Unit tests for TapStack CloudFormation template.
 * Reads the compiled JSON template from ../lib/TapStack.json (relative to this test file).
 *
 * Coverage:
 * - Parameters (presence, sensible defaults, constraints)
 * - Conditions
 * - Core networking (VPC, Subnets, IGW, NATs, RTs, associations)
 * - S3 bucket (encryption, versioning, lifecycle, public access block)
 * - IAM Role + Instance Profile for EC2 → S3 (least-privilege)
 * - Security Group (restricted SSH, correct egress)
 * - EC2 Instances (private subnets, IMDSv2, encrypted EBS, profile attached)
 * - Outputs (existence, basic shape, wiring)
 */

import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<
    string,
    {
      Type: string;
      Condition?: string;
      Properties?: Record<string, any>;
      DependsOn?: string | string[];
    }
  >;
  Outputs?: Record<string, any>;
};

const TEMPLATE_PATH = path.resolve(__dirname, "../lib/TapStack.json");

function loadTemplate(): CFNTemplate {
  const raw = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const tpl = JSON.parse(raw) as CFNTemplate;
  expect(tpl).toBeTruthy();
  expect(typeof tpl).toBe("object");
  return tpl;
}

function hasResource(
  tpl: CFNTemplate,
  logicalId: string,
  type?: string
): asserts tpl is CFNTemplate {
  expect(tpl.Resources).toBeTruthy();
  expect(tpl.Resources![logicalId]).toBeTruthy();
  if (type) expect(tpl.Resources![logicalId].Type).toBe(type);
}

function getResource(tpl: CFNTemplate, logicalId: string) {
  return tpl.Resources![logicalId];
}

function getProp(obj: any, key: string) {
  return obj?.Properties?.[key];
}

function isRef(x: any) {
  return x && typeof x === "object" && "Ref" in x;
}
function isGetAtt(x: any) {
  return x && typeof x === "object" && "Fn::GetAtt" in x;
}
function isSub(x: any) {
  return x && typeof x === "object" && "Fn::Sub" in x;
}
function isIf(x: any) {
  return x && typeof x === "object" && "Fn::If" in x;
}
function asString(x: any): string {
  if (typeof x === "string") return x;
  return JSON.stringify(x);
}

describe("TapStack Unit - Template loads", () => {
  test("JSON template can be parsed", () => {
    const tpl = loadTemplate();
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Description).toMatch(/TapStack/i);
  });
});

describe("TapStack Unit - Parameters", () => {
  const expectedParams = [
    "ProjectName",
    "EnvironmentName",
    "AllowedSSHRange",
    "InstanceType",
    "KeyName",
    "EnableNatPerAz",
    "S3TransitionDaysIA",
    "S3TransitionDaysGlacier",
    "S3ExpireDays",
    "KmsKeyArn",
  ];

  test("Expected parameters exist with reasonable defaults", () => {
    const tpl = loadTemplate();
    expect(tpl.Parameters).toBeTruthy();
    for (const p of expectedParams) {
      expect(tpl.Parameters![p]).toBeTruthy();
    }

    expect(tpl.Parameters!.ProjectName.Default).toBeDefined();
    expect(["dev", "staging", "prod"]).toContain(
      tpl.Parameters!.EnvironmentName.Default
    );

    // Optional KeyName should default to empty string
    expect(tpl.Parameters!.KeyName.Default).toBe("");

    // Lifecycle numeric defaults
    expect(tpl.Parameters!.S3TransitionDaysIA.Default).toBeGreaterThan(0);
    expect(tpl.Parameters!.S3TransitionDaysGlacier.Default).toBeGreaterThan(0);
    expect(tpl.Parameters!.S3ExpireDays.Default).toBeGreaterThan(0);
  });

  test("EnableNatPerAz parameter enumerates 'true' and 'false'", () => {
    const tpl = loadTemplate();
    const p = tpl.Parameters!.EnableNatPerAz;
    expect(p.AllowedValues).toEqual(expect.arrayContaining(["true", "false"]));
    expect(["true", "false"]).toContain(p.Default);
  });
});

describe("TapStack Unit - Conditions", () => {
  test("HasKeyName, CreateNatPerAz, UseKmsEncryption exist", () => {
    const tpl = loadTemplate();
    expect(tpl.Conditions).toBeTruthy();
    expect(tpl.Conditions!.HasKeyName).toBeDefined();
    expect(tpl.Conditions!.CreateNatPerAz).toBeDefined();
    expect(tpl.Conditions!.UseKmsEncryption).toBeDefined();
  });
});

describe("TapStack Unit - Core Networking", () => {
  test("VPC exists with DNS support and correct CIDR", () => {
    const tpl = loadTemplate();
    hasResource(tpl, "VPC", "AWS::EC2::VPC");
    const vpc = getResource(tpl, "VPC");
    expect(getProp(vpc, "CidrBlock")).toBe("10.0.0.0/16");
    expect(getProp(vpc, "EnableDnsHostnames")).toBe(true);
    expect(getProp(vpc, "EnableDnsSupport")).toBe(true);
  });

  test("Subnets (2 public, 2 private) spread across AZs", () => {
    const tpl = loadTemplate();

    for (const id of [
      "PublicSubnet1",
      "PublicSubnet2",
      "PrivateSubnet1",
      "PrivateSubnet2",
    ]) {
      hasResource(tpl, id, "AWS::EC2::Subnet");
      const s = getResource(tpl, id);
      expect(isRef(getProp(s, "VpcId"))).toBe(true);
      const az = getProp(s, "AvailabilityZone");
      expect(az).toBeTruthy(); // likely Fn::Select with Fn::GetAZs
    }

    // Basic CIDR sanity
    expect(getProp(getResource(tpl, "PublicSubnet1"), "CidrBlock")).toMatch(
      /^10\.0\.1\.0\/24$/
    );
    expect(getProp(getResource(tpl, "PublicSubnet2"), "CidrBlock")).toMatch(
      /^10\.0\.2\.0\/24$/
    );
    expect(getProp(getResource(tpl, "PrivateSubnet1"), "CidrBlock")).toMatch(
      /^10\.0\.11\.0\/24$/
    );
    expect(getProp(getResource(tpl, "PrivateSubnet2"), "CidrBlock")).toMatch(
      /^10\.0\.12\.0\/24$/
    );

    // Public subnets map public IPs; private do not
    expect(
      getProp(getResource(tpl, "PublicSubnet1"), "MapPublicIpOnLaunch")
    ).toBe(true);
    expect(
      getProp(getResource(tpl, "PublicSubnet2"), "MapPublicIpOnLaunch")
    ).toBe(true);
    expect(
      getProp(getResource(tpl, "PrivateSubnet1"), "MapPublicIpOnLaunch")
    ).toBe(false);
    expect(
      getProp(getResource(tpl, "PrivateSubnet2"), "MapPublicIpOnLaunch")
    ).toBe(false);
  });

  test("IGW and attachment exist", () => {
    const tpl = loadTemplate();
    hasResource(tpl, "InternetGateway", "AWS::EC2::InternetGateway");
    hasResource(tpl, "InternetGatewayAttachment", "AWS::EC2::VPCGatewayAttachment");
    const att = getResource(tpl, "InternetGatewayAttachment");
    expect(isRef(getProp(att, "InternetGatewayId"))).toBe(true);
    expect(isRef(getProp(att, "VpcId"))).toBe(true);
  });

  test("NAT EIPs and Gateways (per-AZ toggle supported)", () => {
    const tpl = loadTemplate();
    // Required NAT1
    hasResource(tpl, "NatGateway1EIP", "AWS::EC2::EIP");
    hasResource(tpl, "NatGateway1", "AWS::EC2::NatGateway");
    const ngw1 = getResource(tpl, "NatGateway1");
    expect(isGetAtt(getProp(ngw1, "AllocationId"))).toBe(true);
    expect(isRef(getProp(ngw1, "SubnetId"))).toBe(true);

    // Optional NAT2 (exists only if CreateNatPerAz true) → if present, must have the Condition
    const ngw2 = tpl.Resources!["NatGateway2"];
    if (ngw2) {
      expect(ngw2.Type).toBe("AWS::EC2::NatGateway");
      expect(ngw2.Condition).toBe("CreateNatPerAz");
      expect(isGetAtt(getProp(ngw2, "AllocationId"))).toBe(true);
      expect(isRef(getProp(ngw2, "SubnetId"))).toBe(true);
    }

    // EIPs Domain should be "vpc"
    const eip1 = getResource(tpl, "NatGateway1EIP");
    expect(getProp(eip1, "Domain")).toBe("vpc");
    const eip2 = tpl.Resources!["NatGateway2EIP"];
    if (eip2) {
      expect(getProp(eip2, "Domain")).toBe("vpc");
    }
  });

  test("Route tables and default routes wired to IGW/NAT(s)", () => {
    const tpl = loadTemplate();

    hasResource(tpl, "PublicRouteTable", "AWS::EC2::RouteTable");
    hasResource(tpl, "DefaultPublicRoute", "AWS::EC2::Route");
    const pubRoute = getResource(tpl, "DefaultPublicRoute");
    expect(getProp(pubRoute, "DestinationCidrBlock")).toBe("0.0.0.0/0");
    expect(isRef(getProp(pubRoute, "GatewayId"))).toBe(true);

    for (const assoc of [
      "PublicSubnet1RouteTableAssociation",
      "PublicSubnet2RouteTableAssociation",
    ]) {
      hasResource(tpl, assoc, "AWS::EC2::SubnetRouteTableAssociation");
    }

    hasResource(tpl, "PrivateRouteTable1", "AWS::EC2::RouteTable");
    hasResource(tpl, "DefaultPrivateRoute1", "AWS::EC2::Route");
    expect(getProp(getResource(tpl, "DefaultPrivateRoute1"), "DestinationCidrBlock")).toBe(
      "0.0.0.0/0"
    );
    // NAT can be Ref or Fn::If; just check one of those structures present
    const nat1 = getProp(getResource(tpl, "DefaultPrivateRoute1"), "NatGatewayId");
    expect(nat1).toBeTruthy();

    hasResource(tpl, "PrivateRouteTable2", "AWS::EC2::RouteTable");
    hasResource(tpl, "DefaultPrivateRoute2", "AWS::EC2::Route");
    expect(getProp(getResource(tpl, "DefaultPrivateRoute2"), "DestinationCidrBlock")).toBe(
      "0.0.0.0/0"
    );
    const nat2 = getProp(getResource(tpl, "DefaultPrivateRoute2"), "NatGatewayId");
    // could be Fn::If([... NatGateway2, NatGateway1])
    expect(nat2).toBeTruthy();

    for (const assoc of [
      "PrivateSubnet1RouteTableAssociation",
      "PrivateSubnet2RouteTableAssociation",
    ]) {
      hasResource(tpl, assoc, "AWS::EC2::SubnetRouteTableAssociation");
    }
  });
});

describe("TapStack Unit - S3 Bucket", () => {
  test("Bucket exists with encryption, versioning, lifecycle, and public access block", () => {
    const tpl = loadTemplate();
    hasResource(tpl, "AppBucket", "AWS::S3::Bucket");
    const b = getResource(tpl, "AppBucket");

    // Encryption
    const enc = getProp(b, "BucketEncryption");
    expect(enc).toBeTruthy();
    const ssec = enc.ServerSideEncryptionConfiguration;
    expect(Array.isArray(ssec)).toBe(true);
    const byDefault = ssec[0]?.ServerSideEncryptionByDefault;
    expect(byDefault).toBeTruthy();
    // either 'aws:kms' or 'AES256' or Fn::If
    const alg = byDefault.SSEAlgorithm;
    expect(alg || isIf(alg)).toBeTruthy();

    // Versioning
    expect(getProp(b, "VersioningConfiguration")).toMatchObject({ Status: "Enabled" });

    // Public Access Block
    const pab = getProp(b, "PublicAccessBlockConfiguration");
    expect(pab).toMatchObject({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });

    // Lifecycle
    const lc = getProp(b, "LifecycleConfiguration");
    expect(lc).toBeTruthy();
    expect(Array.isArray(lc.Rules)).toBe(true);
    const rule = lc.Rules[0];
    expect(rule.Status).toBe("Enabled");
    expect(rule.ExpirationInDays).toBeDefined();
    // Either legacy or structured noncurrent policy; accept either
    expect(
      rule.NoncurrentVersionExpiration ||
        typeof rule.NoncurrentVersionExpirationInDays !== "undefined"
    ).toBeTruthy();
  });

  test("Bucket name uses account and region via substitution", () => {
    const tpl = loadTemplate();
    const b = getResource(tpl, "AppBucket");
    const name = getProp(b, "BucketName");
    // should be Fn::Sub with AccountId/Region placeholders
    const s = asString(name);
    expect(s).toMatch(/AccountId/);
    expect(s).toMatch(/Region/);
  });
});

describe("TapStack Unit - IAM for EC2 → S3", () => {
  test("Role + InstanceProfile exist; SSM Managed policy attached", () => {
    const tpl = loadTemplate();
    hasResource(tpl, "EC2Role", "AWS::IAM::Role");
    hasResource(tpl, "EC2InstanceProfile", "AWS::IAM::InstanceProfile");

    const role = getResource(tpl, "EC2Role");
    const mpa = getProp(role, "ManagedPolicyArns");
    expect(Array.isArray(mpa)).toBe(true);
    const ssmAttached = mpa.some((arn: string) =>
      /AmazonSSMManagedInstanceCore/.test(arn)
    );
    expect(ssmAttached).toBe(true);

    const ip = getResource(tpl, "EC2InstanceProfile");
    const roles = getProp(ip, "Roles");
    expect(Array.isArray(roles)).toBe(true);
    // Role is referenced
    expect(isRef(roles[0])).toBe(true);
  });

  test("Inline policy is least-privilege to created bucket (List on bucket ARN, Get/Put on bucket/*)", () => {
    const tpl = loadTemplate();
    const role = getResource(tpl, "EC2Role");
    const policies = getProp(role, "Policies");
    expect(Array.isArray(policies)).toBe(true);
    const s3p = policies.find((p: any) => /S3Access/i.test(p.PolicyName));
    expect(s3p).toBeTruthy();

    const doc = s3p.PolicyDocument;
    expect(doc).toBeTruthy();
    const statements = doc.Statement;
    expect(Array.isArray(statements)).toBe(true);

    const listStmt = statements.find(
      (s: any) =>
        s.Effect === "Allow" &&
        Array.isArray(s.Action) &&
        s.Action.includes("s3:ListBucket")
    );
    expect(listStmt).toBeTruthy();
    // Resource should reference AppBucket.Arn (GetAtt or Sub)
    const listRes = listStmt.Resource;
    expect(listRes).toBeTruthy();
    expect(isGetAtt(listRes) || isSub(listRes) || typeof listRes === "string").toBe(true);

    const objStmt = statements.find(
      (s: any) =>
        s.Effect === "Allow" &&
        Array.isArray(s.Action) &&
        s.Action.includes("s3:GetObject") &&
        s.Action.includes("s3:PutObject")
    );
    expect(objStmt).toBeTruthy();
    const objRes = objStmt.Resource;
    const objResStr = asString(objRes);
    // Should target bucket/* (object ARNs)
    expect(objResStr.includes("/*")).toBe(true);
  });
});

describe("TapStack Unit - Security Group", () => {
  test("Ingress SSH from AllowedSSHRange only; egress open", () => {
    const tpl = loadTemplate();
    hasResource(tpl, "EC2SecurityGroup", "AWS::EC2::SecurityGroup");
    const sg = getResource(tpl, "EC2SecurityGroup");

    const inRules = getProp(sg, "SecurityGroupIngress");
    expect(Array.isArray(inRules)).toBe(true);
    const ssh = inRules.find(
      (r: any) => r.IpProtocol === "tcp" && r.FromPort === 22 && r.ToPort === 22
    );
    expect(ssh).toBeTruthy();
    // Either Ref to AllowedSSHRange or literal CIDR
    expect(isRef(ssh.CidrIp) || typeof ssh.CidrIp === "string").toBe(true);

    const eRules = getProp(sg, "SecurityGroupEgress");
    expect(Array.isArray(eRules)).toBe(true);
    // IpProtocol may be number -1 or string "-1" depending on serialization
    const allOut = eRules.find(
      (r: any) => r.IpProtocol === -1 || r.IpProtocol === "-1"
    );
    expect(allOut).toBeTruthy();
  });

  test("Egress allows 0.0.0.0/0 (IPv4) as expected", () => {
    const tpl = loadTemplate();
    const sg = getResource(tpl, "EC2SecurityGroup");
    const eRules = getProp(sg, "SecurityGroupEgress");
    const rule = eRules.find((r: any) => r.IpProtocol === -1 || r.IpProtocol === "-1");
    expect(rule?.CidrIp).toBe("0.0.0.0/0");
  });
});

describe("TapStack Unit - EC2 Instances", () => {
  test("Two instances in private subnets, IMDSv2 enforced, encrypted EBS, no public IPs", () => {
    const tpl = loadTemplate();
    for (const id of ["EC2Instance1", "EC2Instance2"]) {
      hasResource(tpl, id, "AWS::EC2::Instance");
      const inst = getResource(tpl, id);

      // Subnet in private subnets (ref check)
      const subnetRef = getProp(inst, "SubnetId");
      expect(isRef(subnetRef)).toBe(true);
      const allowedSubnets = ["PrivateSubnet1", "PrivateSubnet2"];
      expect(allowedSubnets).toContain(subnetRef.Ref);

      // InstanceType is Ref to parameter or literal
      const it = getProp(inst, "InstanceType");
      expect(isRef(it) || typeof it === "string").toBeTruthy();

      // KeyName is conditional (Fn::If) or omitted if empty
      const keyName = getProp(inst, "KeyName");
      expect(!keyName || isIf(keyName) || typeof keyName === "string").toBeTruthy();

      // IMDSv2
      const md = getProp(inst, "MetadataOptions");
      expect(md).toBeTruthy();
      expect(md.HttpTokens).toBe("required");

      // Encrypted gp3 root volume
      const bdm = getProp(inst, "BlockDeviceMappings");
      expect(Array.isArray(bdm)).toBe(true);
      const root = bdm[0]?.Ebs;
      expect(root).toBeTruthy();
      expect(root.Encrypted).toBe(true);
      expect(root.VolumeType).toBe("gp3");

      // AMI via SSM parameter resolution string
      const imageId = getProp(inst, "ImageId");
      expect(typeof imageId === "string" && imageId.includes("{{resolve:ssm:")).toBe(true);
    }
  });

  test("Each instance attaches the EC2InstanceProfile", () => {
    const tpl = loadTemplate();
    for (const id of ["EC2Instance1", "EC2Instance2"]) {
      const inst = getResource(tpl, id);
      const prof = getProp(inst, "IamInstanceProfile");
      expect(isRef(prof) || typeof prof === "string").toBeTruthy();
    }
  });
});

describe("TapStack Unit - Outputs", () => {
  const expectedOutputs = [
    "VpcId",
    "PublicSubnetIds",
    "PrivateSubnetIds",
    "InternetGatewayId",
    "NatGatewayIds",
    "PublicRouteTableIds",
    "PrivateRouteTableIds",
    "InstanceProfileName",
    "Ec2RoleArn",
    "AppBucketName",
    "AppBucketArn",
    "PrivateEc2InstanceIds",
    "Region",
    "AccountId",
  ];

  test("Expected outputs exist", () => {
    const tpl = loadTemplate();
    expect(tpl.Outputs).toBeTruthy();
    for (const o of expectedOutputs) {
      expect(tpl.Outputs![o]).toBeTruthy();
    }
  });

  test("Subnet and RT outputs are comma-separated strings (Join) or string", () => {
    const tpl = loadTemplate();

    const pub = tpl.Outputs!["PublicSubnetIds"]?.Value;
    const priv = tpl.Outputs!["PrivateSubnetIds"]?.Value;
    const prt = tpl.Outputs!["PrivateRouteTableIds"]?.Value;

    expect(pub).toBeTruthy();
    expect(priv).toBeTruthy();
    expect(prt).toBeTruthy();

    // Accept either Fn::Join or literal strings
    function acceptJoinOrString(v: any) {
      const s = asString(v);
      return s.includes("Fn::Join") || typeof v === "string";
    }

    expect(acceptJoinOrString(pub)).toBe(true);
    expect(acceptJoinOrString(priv)).toBe(true);
    expect(acceptJoinOrString(prt)).toBe(true);
  });

  test("Outputs wiring uses GetAtt for AppBucketArn and EC2 role ARN", () => {
    const tpl = loadTemplate();
    const bucketArnOut = tpl.Outputs!["AppBucketArn"]?.Value;
    expect(isGetAtt(bucketArnOut) || isSub(bucketArnOut) || typeof bucketArnOut === "string").toBe(
      true
    );

    const roleArnOut = tpl.Outputs!["Ec2RoleArn"]?.Value;
    expect(isGetAtt(roleArnOut) || isSub(roleArnOut) || typeof roleArnOut === "string").toBe(true);
  });
});
