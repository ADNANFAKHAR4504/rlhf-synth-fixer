// File: test/tap-stack.unit.test.ts
// Jest + TypeScript unit tests validating ../lib/TapStack.yml (light checks) and ../lib/TapStack.json (deep checks).
// No external CFN YAML parsers required—JSON is used for structural validation to avoid intrinsic-tag parsing issues.
//
// Dev deps suggested: jest, ts-jest, @types/jest
// Configure your Jest testPathPattern to include *.unit.test.ts

import * as fs from "fs";
import * as path from "path";

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<
    string,
    {
      Type: string;
      Condition?: string;
      Properties?: Record<string, any>;
    }
  >;
  Outputs?: Record<string, any>;
};

function readYamlText(): string {
  const p = path.resolve(__dirname, "../lib/TapStack.yml");
  const content = fs.readFileSync(p, "utf8");
  if (!content || content.length < 10) throw new Error("YAML: empty or missing content");
  return content;
}

function loadJsonTemplate(): CfnTemplate {
  const p = path.resolve(__dirname, "../lib/TapStack.json");
  const content = fs.readFileSync(p, "utf8");
  const doc = JSON.parse(content) as CfnTemplate;
  if (!doc || !doc.Resources) throw new Error("JSON: invalid or missing Resources");
  return doc;
}

function findResourcesByType(tpl: CfnTemplate, type: string) {
  return Object.entries(tpl.Resources).filter(([, r]) => r.Type === type);
}

function getResource(tpl: CfnTemplate, logicalId: string) {
  const r = tpl.Resources[logicalId];
  if (!r) throw new Error(`Resource not found: ${logicalId}`);
  return r;
}

function hasAllTags(props: any) {
  const tags: Array<{ Key: string; Value: any }> = props?.Tags || [];
  const keys = new Set(tags.map((t) => t.Key));
  return keys.has("Environment") && keys.has("Project") && keys.has("Owner");
}

describe("TapStack CloudFormation template (YAML presence & JSON structure)", () => {
  const ymlText = readYamlText(); // light checks only (no YAML parsing to avoid !Ref tag issues)
  const json = loadJsonTemplate();

  // 1
  it("has a non-empty YAML file and includes key top-level sections", () => {
    expect(ymlText.includes("AWSTemplateFormatVersion:")).toBe(true);
    expect(ymlText.includes("Resources:")).toBe(true);
    expect(ymlText.includes("Parameters:")).toBe(true);
    expect(ymlText.includes("Outputs:")).toBe(true);
  });

  // 2
  it("YAML declares certificate Conditions (HasCertificate / NoCertificate)", () => {
    expect(ymlText).toContain("HasCertificate:");
    expect(ymlText).toContain("NoCertificate:");
  });

  // 3
  it("JSON template loads successfully with Resources present", () => {
    expect(json.AWSTemplateFormatVersion).toBeDefined();
    expect(Object.keys(json.Resources).length).toBeGreaterThan(0);
  });

  // 4
  it("defines required Parameters in JSON", () => {
    const req = [
      "Project",
      "Environment",
      "Owner",
      "VpcCidr",
      "PublicSubnet1Cidr",
      "PublicSubnet2Cidr",
      "PrivateSubnet1Cidr",
      "PrivateSubnet2Cidr",
      "AppPort",
      "AcmCertificateArn",
    ];
    for (const p of req) {
      expect(json.Parameters?.[p]).toBeDefined();
    }
  });

  // 5
  it("declares Conditions for certificate-based branching in JSON", () => {
    expect(json.Conditions?.HasCertificate).toBeDefined();
    expect(json.Conditions?.NoCertificate).toBeDefined();
  });

  // 6
  it("creates a VPC with DNS support enabled and proper tagging", () => {
    const vpc = getResource(json, "VPC");
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties?.EnableDnsHostnames).toBe(true);
    expect(vpc.Properties?.EnableDnsSupport).toBe(true);
    expect(hasAllTags(vpc.Properties)).toBe(true);
  });

  // 7
  it("creates two public and two private subnets with correct flags", () => {
    const pub = [getResource(json, "PublicSubnet1"), getResource(json, "PublicSubnet2")];
    const prv = [getResource(json, "PrivateSubnet1"), getResource(json, "PrivateSubnet2")];
    for (const s of pub) {
      expect(s.Type).toBe("AWS::EC2::Subnet");
      expect(s.Properties?.MapPublicIpOnLaunch).toBe(true);
      expect(hasAllTags(s.Properties)).toBe(true);
    }
    for (const s of prv) {
      expect(s.Type).toBe("AWS::EC2::Subnet");
      expect(s.Properties?.MapPublicIpOnLaunch).toBe(false);
      expect(hasAllTags(s.Properties)).toBe(true);
    }
  });

  // 8
  it("attaches an InternetGateway to the VPC", () => {
    const igw = getResource(json, "InternetGateway");
    const att = getResource(json, "VPCGatewayAttachment");
    expect(igw.Type).toBe("AWS::EC2::InternetGateway");
    expect(att.Type).toBe("AWS::EC2::VPCGatewayAttachment");
    expect(att.Properties?.VpcId).toBeDefined();
    expect(att.Properties?.InternetGatewayId).toBeDefined();
  });

  // 9
  it("configures NAT Gateway and Elastic IP for private egress", () => {
    const eip = getResource(json, "NatEip");
    const nat = getResource(json, "NatGateway");
    expect(eip.Type).toBe("AWS::EC2::EIP");
    expect(eip.Properties?.Domain).toBe("vpc");
    expect(nat.Type).toBe("AWS::EC2::NatGateway");
    expect(nat.Properties?.AllocationId).toBeDefined();
  });

  // 10
  it("routes public subnets to Internet and private subnets to NAT", () => {
    const pubRoute = getResource(json, "PublicRoute");
    const privRoute = getResource(json, "PrivateDefaultRoute");
    expect(pubRoute.Type).toBe("AWS::EC2::Route");
    expect(pubRoute.Properties?.DestinationCidrBlock).toBe("0.0.0.0/0");
    expect(pubRoute.Properties?.GatewayId).toBeDefined();
    expect(privRoute.Type).toBe("AWS::EC2::Route");
    expect(privRoute.Properties?.DestinationCidrBlock).toBe("0.0.0.0/0");
    expect(privRoute.Properties?.NatGatewayId).toBeDefined();
  });

  // 11
  it("ALB SecurityGroup uses conditional 443/80; no arbitrary ports exposed", () => {
    const sg = getResource(json, "AlbSecurityGroup");
    const ingress = sg.Properties?.SecurityGroupIngress || [];
    expect(ingress.length).toBeGreaterThanOrEqual(2);
    const bad = ingress.find(
      (r: any) => [22, 8080].includes(r?.FromPort) || [22, 8080].includes(r?.ToPort)
    );
    expect(bad).toBeUndefined();
  });

  // 12
  it("AppSecurityGroup allows only ALB->AppPort traffic", () => {
    const sg = getResource(json, "AppSecurityGroup");
    const ing = sg.Properties?.SecurityGroupIngress || [];
    expect(ing.length).toBeGreaterThan(0);
    const onlyFromAlb = ing.every((r: any) => r.SourceSecurityGroupId && r.IpProtocol === "tcp");
    expect(onlyFromAlb).toBe(true);
  });

  // 13
  it("Logs S3 bucket: versioning, encryption, PABCs, ownership controls", () => {
    const b = getResource(json, "LogsBucket");
    expect(b.Type).toBe("AWS::S3::Bucket");
    expect(b.Properties?.VersioningConfiguration?.Status).toBe("Enabled");
    expect(
      b.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault
        ?.SSEAlgorithm
    ).toBe("AES256");
    expect(b.Properties?.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(b.Properties?.OwnershipControls?.Rules?.[0]?.ObjectOwnership).toBe("BucketOwnerPreferred");
  });

  // 14
  it("Application S3 bucket: versioning, encryption, logging to LogsBucket, PABCs", () => {
    const b = getResource(json, "ApplicationBucket");
    expect(b.Type).toBe("AWS::S3::Bucket");
    expect(b.Properties?.VersioningConfiguration?.Status).toBe("Enabled");
    expect(
      b.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault
        ?.SSEAlgorithm
    ).toBe("AES256");
    expect(b.Properties?.LoggingConfiguration?.DestinationBucketName).toBeDefined();
    expect(b.Properties?.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
  });

  // 15
  it("LogsBucketPolicy includes required ALB principals and ACL condition", () => {
    const lbp = getResource(json, "LogsBucketPolicy").Properties?.PolicyDocument;
    const putStmt = lbp.Statement.find((s: any) => s.Sid === "ALBLogDeliveryPutWithPrefix");
    expect(putStmt.Principal.Service).toEqual(
      expect.arrayContaining(["delivery.logs.amazonaws.com", "logdelivery.elasticloadbalancing.amazonaws.com"])
    );
    expect(putStmt.Condition?.StringEquals?.["s3:x-amz-acl"]).toBe("bucket-owner-full-control");
  });

  // 16
  it("ApplicationBucketPolicy enforces TLS-only and allows minimal role access", () => {
    const bp = getResource(json, "ApplicationBucketPolicy").Properties?.PolicyDocument;
    const denyTls = bp.Statement.find((s: any) => s.Sid === "DenyInsecureTransport");
    expect(denyTls).toBeDefined();
    expect(denyTls.Effect).toBe("Deny");
    const allowList = bp.Statement.find((s: any) => s.Sid === "AllowRoleList");
    const allowObj = bp.Statement.find((s: any) => s.Sid === "AllowRoleObjects");
    expect(allowList.Action).toBe("s3:ListBucket");
    expect(allowObj.Action).toEqual(expect.arrayContaining(["s3:GetObject", "s3:PutObject"]));
  });

  // 17
  it("IAM Role for EC2 uses ec2.amazonaws.com trust and <= 6 policy statements", () => {
    const role = getResource(json, "AppEc2Role");
    const trust = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0];
    expect(trust?.Principal?.Service).toBe("ec2.amazonaws.com");
    const policies = role.Properties?.Policies || [];
    let stmtCount = 0;
    for (const p of policies) stmtCount += (p.PolicyDocument?.Statement || []).length;
    expect(stmtCount).toBeLessThanOrEqual(6);
  });

  // 18
  it("ALB exists in public subnets with logging enabled", () => {
    const alb = getResource(json, "ApplicationLoadBalancer");
    expect(alb.Type).toBe("AWS::ElasticLoadBalancingV2::LoadBalancer");
    const attrs = alb.Properties?.LoadBalancerAttributes || [];
    expect(attrs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: "access_logs.s3.enabled", Value: "true" }),
        expect.objectContaining({ Key: "access_logs.s3.bucket" }),
      ])
    );
    expect(alb.Properties?.Subnets?.length).toBeGreaterThanOrEqual(2);
  });

  // 19
  it("Target Group configured with instance targets and health checks", () => {
    const tg = getResource(json, "AppTargetGroup");
    expect(tg.Type).toBe("AWS::ElasticLoadBalancingV2::TargetGroup");
    expect(tg.Properties?.TargetType).toBe("instance");
    expect(tg.Properties?.HealthCheckPath).toBe("/");
    expect(tg.Properties?.Matcher?.HttpCode).toBe("200-399");
  });

  // 20
  it("Conditional listeners are present with correct protocols and ports", () => {
    const https = getResource(json, "HttpsListener");
    const http = getResource(json, "HttpListener");
    expect(https.Type).toBe("AWS::ElasticLoadBalancingV2::Listener");
    expect(https.Condition).toBe("HasCertificate");
    expect(https.Properties?.Port).toBe(443);
    expect(https.Properties?.Protocol).toBe("HTTPS");
    expect(http.Type).toBe("AWS::ElasticLoadBalancingV2::Listener");
    expect(http.Condition).toBe("NoCertificate");
    expect(http.Properties?.Port).toBe(80);
    expect(http.Properties?.Protocol).toBe("HTTP");
  });

  // 21
  it("CloudTrail trail is multi-region and includes S3 data events", () => {
    const ct = getResource(json, "CloudTrailTrail");
    expect(ct.Type).toBe("AWS::CloudTrail::Trail");
    expect(ct.Properties?.IsMultiRegionTrail).toBe(true);
    const selectors = ct.Properties?.EventSelectors || [];
    const hasS3Data = selectors.some((sel: any) =>
      (sel.DataResources || []).some((dr: any) => dr.Type === "AWS::S3::Object")
    );
    expect(hasS3Data).toBe(true);
  });

  // 22
  it("Key resources have Environment/Project/Owner tags", () => {
    const ids = ["VPC", "PublicSubnet1", "PrivateSubnet1", "ApplicationLoadBalancer", "LogsBucket", "ApplicationBucket"];
    for (const id of ids) {
      const r = getResource(json, id);
      expect(hasAllTags(r.Properties)).toBe(true);
    }
  });

  // 23
  it("Outputs include critical identifiers and ARNs", () => {
    const outs = json.Outputs || {};
    const required = [
      "ApplicationBucketArn",
      "LogsBucketArn",
      "AlbDnsName",
      "AlbArn",
      "AppEc2RoleArn",
      "VpcId",
      "PrivateSubnetIds",
      "PublicSubnetIds",
    ];
    for (const o of required) {
      expect(outs[o]).toBeDefined();
      expect(outs[o].Value).toBeDefined();
    }
  });

  // 24
  it("Logs bucket policy includes CloudTrail delivery permissions", () => {
    const lbp = getResource(json, "LogsBucketPolicy").Properties?.PolicyDocument;
    const write = lbp.Statement.find((s: any) => s.Sid === "CloudTrailWrite");
    const acl = lbp.Statement.find((s: any) => s.Sid === "CloudTrailAclCheck");
    expect(write).toBeDefined();
    expect(acl).toBeDefined();
    expect(write.Principal?.Service).toBe("cloudtrail.amazonaws.com");
    expect(acl.Principal?.Service).toBe("cloudtrail.amazonaws.com");
  });
});
