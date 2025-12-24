// test/tap-stack.unit.test.ts
// Static/unit tests that validate the CloudFormation YAML structure without touching AWS.

import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import yaml, { Type } from "js-yaml";
import path from "path";

// --- Minimal CFN tag handlers used by your template ---
const CFN_TAGS: Type[] = [
  new Type("!Ref", {
    kind: "scalar",
    construct: (d: any) => ({ Ref: d }),
  }),
  new Type("!GetAtt", {
    kind: "scalar",
    // supports "!GetAtt LogicalId.Attribute"
    construct: (d: any) =>
      ({ "Fn::GetAtt": typeof d === "string" ? d.split(".") : d }),
  }),
  new Type("!Sub", {
    // allow scalar and sequence forms
    kind: "scalar",
    construct: (d: any) => ({ "Fn::Sub": d }),
  }),
  new Type("!Equals", {
    kind: "sequence",
    construct: (d: any) => ({ "Fn::Equals": d }),
  }),
];

// Use DEFAULT_SCHEMA and extend with our CFN tags
const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(CFN_TAGS);

// Load template
const templatePath = path.resolve(process.cwd(), "lib", "TapStack.yml");
const raw = fs.readFileSync(templatePath, "utf-8");
const doc: any = yaml.load(raw, { schema: CFN_SCHEMA });

describe("TapStack Template - Unit Tests", () => {
  it("has required top-level sections", () => {
    expect(doc.AWSTemplateFormatVersion).toBe("2010-09-09");
    expect(typeof doc.Description).toBe("string");
    expect(doc.Parameters).toBeTruthy();
    expect(doc.Resources).toBeTruthy();
    expect(doc.Outputs).toBeTruthy();
    expect(doc.Rules?.MustBeUsEast1).toBeTruthy();
  });

  it("enforces us-east-1 via Rules", () => {
    const asserts = doc.Rules?.MustBeUsEast1?.Assertions;
    expect(Array.isArray(asserts)).toBe(true);
    const hasEq = JSON.stringify(asserts).includes("us-east-1");
    expect(hasEq).toBe(true);
  });

  it("defines required Parameters with correct types/defaults", () => {
    const p = doc.Parameters || {};

    // VPC CIDR parameter
    expect(p.VpcCidr?.Type).toBe("String");
    expect(p.VpcCidr?.Default).toBe("10.0.0.0/16");

    // Subnet CIDR parameter
    expect(p.SubnetCidr?.Type).toBe("String");
    expect(p.SubnetCidr?.Default).toBe("10.0.1.0/24");

    expect(p.LatestAmiId?.Type).toBe(
      "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>"
    );
    expect(
      String(p.LatestAmiId?.Default || "").includes(
        "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
      )
    ).toBe(true);

    // defined & used (echo output)
    expect(p.EnvironmentSuffix?.Type).toBe("String");
  });

  it("does not create IAM roles/users (no AWS::IAM::* resources)", () => {
    const resources = doc.Resources || {};
    const iamish = Object.values<any>(resources).filter(
      (r) => typeof r?.Type === "string" && r.Type.startsWith("AWS::IAM::")
    );
    expect(iamish.length).toBe(0);
  });

  it("creates a VPC resource", () => {
    const vpc = doc.Resources?.AppVpc;
    expect(vpc).toBeTruthy();
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties?.CidrBlock).toBeTruthy();
    expect(vpc.Properties?.EnableDnsHostnames).toBe(true);
    expect(vpc.Properties?.EnableDnsSupport).toBe(true);

    const envTag = (vpc.Properties?.Tags || []).find((t: any) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });

  it("creates SG with only SSH/HTTPS inbound and allow-all egress", () => {
    const sg = doc.Resources?.AppSecurityGroup?.Properties;
    expect(sg?.VpcId).toBeTruthy();

    const ingress = sg?.SecurityGroupIngress;
    expect(Array.isArray(ingress)).toBe(true);
    const ports = new Set(ingress.map((r: any) => Number(r.FromPort)));
    expect(ports.has(22)).toBe(true);
    expect(ports.has(443)).toBe(true);
    expect(ingress.length).toBe(2);

    const egress = sg?.SecurityGroupEgress;
    expect(Array.isArray(egress)).toBe(true);
    const allowAll = egress.find(
      (r: any) => String(r.IpProtocol) === "-1" && r.CidrIp === "0.0.0.0/0"
    );
    expect(allowAll).toBeTruthy();

    const envTag = (sg?.Tags || []).find((t: any) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });

  it("S3 bucket has AES256 SSE and public access blocks", () => {
    const bkt = doc.Resources?.AppBucket?.Properties;
    const sseRules =
      bkt?.BucketEncryption?.ServerSideEncryptionConfiguration || [];
    const hasAES256 = sseRules.some(
      (r: any) => r.ServerSideEncryptionByDefault?.SSEAlgorithm === "AES256"
    );
    expect(hasAES256).toBe(true);

    const pab = bkt?.PublicAccessBlockConfiguration || {};
    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
    expect(pab.IgnorePublicAcls).toBe(true);
    expect(pab.RestrictPublicBuckets).toBe(true);

    const envTag = (bkt?.Tags || []).find((t: any) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });

  it("EC2 instance uses LatestAmiId parameter and is tagged", () => {
    const inst = doc.Resources?.AppInstance?.Properties;
    const img = inst?.ImageId;
    const refStr = typeof img === "string" ? img : JSON.stringify(img);
    expect(refStr).toContain("LatestAmiId");

    const envTag = (inst?.Tags || []).find((t: any) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });

  it("Subnet references the created VPC and is tagged", () => {
    const sub = doc.Resources?.AppSubnet?.Properties;
    expect(sub?.VpcId).toBeTruthy();
    const vpcRef = JSON.stringify(sub?.VpcId);
    expect(vpcRef).toContain("AppVpc");
    expect(sub?.CidrBlock).toBeTruthy();
    const envTag = (sub?.Tags || []).find((t: any) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });

  it("creates Internet Gateway and Route Table for public connectivity", () => {
    // Internet Gateway
    const igw = doc.Resources?.InternetGateway;
    expect(igw).toBeTruthy();
    expect(igw.Type).toBe("AWS::EC2::InternetGateway");

    // VPC Gateway Attachment
    const attach = doc.Resources?.VpcGatewayAttachment;
    expect(attach).toBeTruthy();
    expect(attach.Type).toBe("AWS::EC2::VPCGatewayAttachment");

    // Route Table
    const rt = doc.Resources?.RouteTable;
    expect(rt).toBeTruthy();
    expect(rt.Type).toBe("AWS::EC2::RouteTable");

    // Public Route
    const route = doc.Resources?.PublicRoute;
    expect(route).toBeTruthy();
    expect(route.Type).toBe("AWS::EC2::Route");
    expect(route.Properties?.DestinationCidrBlock).toBe("0.0.0.0/0");
  });

  it("Outputs include VpcId, SecurityGroupId, InstanceId, InstancePublicIp, BucketName, EnvironmentSuffixEcho", () => {
    const o = doc.Outputs || {};
    [
      "VpcId",
      "SecurityGroupId",
      "InstanceId",
      "InstancePublicIp",
      "BucketName",
      "EnvironmentSuffixEcho",
    ].forEach((k) => expect(o[k]).toBeTruthy());

    // Ensure EnvironmentSuffix is actually referenced (avoids W2001)
    const echoVal = JSON.stringify(o.EnvironmentSuffixEcho?.Value ?? "");
    expect(echoVal).toContain("EnvironmentSuffix");
  });
});
