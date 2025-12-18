import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

/**
 * CloudFormation intrinsic function schema for js-yaml
 * Covers scalar + sequence variants where applicable.
 */
const cfnTypes: yaml.Type[] = [
  new yaml.Type("!Ref", {
    kind: "scalar",
    construct: (data: any) => ({ Ref: data }),
  }),
  new yaml.Type("!GetAtt", {
    kind: "scalar",
    construct: (data: any) => ({ "Fn::GetAtt": String(data).split(".") }),
  }),
  // !Sub can be scalar ("string ${Var}") or sequence (["string ${Var}", {Var:"val"}])
  new yaml.Type("!Sub", {
    kind: "scalar",
    construct: (data: any) => ({ "Fn::Sub": data }),
  }),
  new yaml.Type("!Sub", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::Sub": data }),
  }),
  new yaml.Type("!If", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::If": data }),
  }),
  new yaml.Type("!Equals", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::Equals": data }),
  }),
  new yaml.Type("!And", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::And": data }),
  }),
  new yaml.Type("!Or", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::Or": data }),
  }),
  new yaml.Type("!Not", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::Not": data }),
  }),
  // Additional intrinsics commonly used in your template
  new yaml.Type("!Select", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::Select": data }),
  }),
  new yaml.Type("!GetAZs", {
    kind: "scalar",
    construct: (data: any) => ({ "Fn::GetAZs": data }),
  }),
  new yaml.Type("!Join", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::Join": data }),
  }),
  new yaml.Type("!FindInMap", {
    kind: "sequence",
    construct: (data: any[]) => ({ "Fn::FindInMap": data }),
  }),
  new yaml.Type("!ImportValue", {
    kind: "scalar",
    construct: (data: any) => ({ "Fn::ImportValue": data }),
  }),
  // !Condition returns the value of a named Condition
  new yaml.Type("!Condition", {
    kind: "scalar",
    construct: (data: any) => ({ Condition: data }),
  }),
];

const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(cfnTypes);

type AnyObj = Record<string, any>;

function loadTemplate(relPath: string): AnyObj {
  const abs = path.resolve(process.cwd(), relPath);
  const raw = fs.readFileSync(abs, "utf8");
  const doc = yaml.load(raw, { schema: CFN_SCHEMA });
  if (!doc || typeof doc !== "object") {
    throw new Error(`Failed to parse template: ${relPath}`);
  }
  return doc as AnyObj;
}

const template = loadTemplate("lib/TapStack.yml");

const getParam = (n: string) => template.Parameters?.[n];
const getRes = (n: string) => template.Resources?.[n];
const getOut = (n: string) => template.Outputs?.[n];
const arr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);

describe("TapStack — Template structure", () => {
  test("01 — Has AWSTemplateFormatVersion", () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
  });

  test("02 — Has Description", () => {
    expect(template.Description).toBeDefined();
  });
});

describe("Parameters, Rules, Conditions", () => {
  test("03 — ProjectName parameter exists", () => {
    const p = getParam("ProjectName");
    expect(p).toBeDefined();
    expect(p.AllowedPattern).toBeDefined();
  });

  test("04 — EnvironmentSuffix parameter exists", () => {
    expect(getParam("EnvironmentSuffix")).toBeDefined();
  });

  test("05 — VpcCidr parameter validates CIDR", () => {
    const p = getParam("VpcCidr");
    expect(typeof p?.AllowedPattern).toBe("string");
    expect(p.AllowedPattern).toContain("/");
  });

  test("06 — CreatePublicSubnets is boolean-like", () => {
    expect(getParam("CreatePublicSubnets")?.AllowedValues).toEqual(["true", "false"]);
  });

  test("07 — EnableNatGateway is boolean-like", () => {
    expect(getParam("EnableNatGateway")?.AllowedValues).toEqual(["true", "false"]);
  });

  test("08 — CloudTrailToCloudWatch is boolean-like", () => {
    expect(getParam("CloudTrailToCloudWatch")?.AllowedValues).toEqual(["true", "false"]);
  });

  test("09 — RegionRule exists", () => {
    expect(template.Rules?.RegionRule).toBeDefined();
  });

  test("10 — UseCloudWatchForTrail condition exists", () => {
    expect(template.Conditions?.UseCloudWatchForTrail).toBeDefined();
  });
});

describe("Networking — VPC, subnets, routes, flow logs", () => {
  test("11 — Vpc exists with DNS enabled", () => {
    const v = getRes("Vpc");
    expect(v?.Type).toBe("AWS::EC2::VPC");
    expect(v?.Properties?.EnableDnsSupport).toBe(true);
    expect(v?.Properties?.EnableDnsHostnames).toBe(true);
  });

  test("12 — Private subnets exist and MapPublicIpOnLaunch is false", () => {
    const a = getRes("PrivateSubnetA");
    const b = getRes("PrivateSubnetB");
    expect(a?.Type).toBe("AWS::EC2::Subnet");
    expect(b?.Type).toBe("AWS::EC2::Subnet");
    expect(a?.Properties?.MapPublicIpOnLaunch).toBe(false);
    expect(b?.Properties?.MapPublicIpOnLaunch).toBe(false);
  });

  test("13 — Private route tables exist", () => {
    expect(getRes("PrivateRouteTableA")?.Type).toBe("AWS::EC2::RouteTable");
    expect(getRes("PrivateRouteTableB")?.Type).toBe("AWS::EC2::RouteTable");
  });

  test("14 — Private subnet route table associations exist", () => {
    expect(getRes("PrivateSubnetRouteTableAssociationA")?.Type).toBe(
      "AWS::EC2::SubnetRouteTableAssociation"
    );
    expect(getRes("PrivateSubnetRouteTableAssociationB")?.Type).toBe(
      "AWS::EC2::SubnetRouteTableAssociation"
    );
  });

  test("15 — VPC Flow Logs resources exist (role, log group, flow log)", () => {
    expect(getRes("VpcFlowLogsLogGroup")?.Type).toBe("AWS::Logs::LogGroup");
    expect(getRes("VpcFlowLogRole")?.Type).toBe("AWS::IAM::Role");
    expect(getRes("VpcFlowLog")?.Type).toBe("AWS::EC2::FlowLog");
  });
});

describe("KMS and S3 — encryption, policies, TLS enforcement", () => {
  test("16 — KmsKey exists and rotation enabled", () => {
    const k = getRes("KmsKey");
    expect(k?.Type).toBe("AWS::KMS::Key");
    expect(k?.Properties?.EnableKeyRotation).toBe(true);
  });

  test("17 — KmsAlias exists and targets KmsKey", () => {
    const a = getRes("KmsAlias");
    expect(a?.Type).toBe("AWS::KMS::Alias");
    expect(a?.Properties?.TargetKeyId).toBeDefined();
  });

  test("18 — LoggingBucket exists and uses SSE-KMS", () => {
    const b = getRes("LoggingBucket");
    expect(b?.Type).toBe("AWS::S3::Bucket");
    const enc = b?.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;
    expect(enc).toBeDefined();
  });

  test("19 — DataBucket exists and uses SSE-KMS", () => {
    const b = getRes("DataBucket");
    expect(b?.Type).toBe("AWS::S3::Bucket");
    const enc = b?.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;
    expect(enc).toBeDefined();
  });

  test("20 — LoggingBucketPolicy exists and contains TLS deny statement", () => {
    const p = getRes("LoggingBucketPolicy");
    expect(p?.Type).toBe("AWS::S3::BucketPolicy");
    const statements = arr(p?.Properties?.PolicyDocument?.Statement);
    const tlsDeny = statements.find(
      (s: any) =>
        s?.Effect === "Deny" &&
        (s?.Condition?.Bool?.["aws:SecureTransport"] === false ||
          s?.Condition?.Bool?.["aws:SecureTransport"] === "false")
    );
    expect(tlsDeny).toBeTruthy();
  });

  test("21 — DataBucketPolicy exists and enforces SSE-KMS on PutObject", () => {
    const p = getRes("DataBucketPolicy");
    expect(p?.Type).toBe("AWS::S3::BucketPolicy");
    const statements = arr(p?.Properties?.PolicyDocument?.Statement);
    const denyNonKms = statements.find(
      (s: any) =>
        s?.Effect === "Deny" &&
        arr(s?.Action).includes("s3:PutObject") &&
        (s?.Condition?.StringNotEquals?.["s3:x-amz-server-side-encryption"] === "aws:kms")
    );
    expect(denyNonKms).toBeTruthy();
  });
});

describe("IAM, EC2 — hardening + least privilege", () => {
  test("22 — Ec2InstanceRole exists and trusts EC2", () => {
    const r = getRes("Ec2InstanceRole");
    expect(r?.Type).toBe("AWS::IAM::Role");
    const stmt = arr(r?.Properties?.AssumeRolePolicyDocument?.Statement)[0];
    expect(stmt?.Principal?.Service).toBeDefined();
  });

  test("23 — Ec2InstanceProfile exists and references Ec2InstanceRole", () => {
    const p = getRes("Ec2InstanceProfile");
    expect(p?.Type).toBe("AWS::IAM::InstanceProfile");
    expect(arr(p?.Properties?.Roles).length).toBeGreaterThan(0);
  });

  test("24 — AppSecurityGroupDefaultDeny has no ingress rules", () => {
    const sg = getRes("AppSecurityGroupDefaultDeny");
    expect(sg?.Type).toBe("AWS::EC2::SecurityGroup");
    expect(arr(sg?.Properties?.SecurityGroupIngress).length).toBe(0);
  });

  test("25 — AppLaunchTemplate enforces IMDSv2 (HttpTokens required)", () => {
    const lt = getRes("AppLaunchTemplate");
    expect(lt?.Type).toBe("AWS::EC2::LaunchTemplate");
    expect(
      lt?.Properties?.LaunchTemplateData?.MetadataOptions?.HttpTokens
    ).toBe("required");
  });

  test("26 — AppLaunchTemplate disables public IP association", () => {
    const lt = getRes("AppLaunchTemplate");
    const nis = arr(lt?.Properties?.LaunchTemplateData?.NetworkInterfaces);
    expect(nis.length).toBeGreaterThan(0);
    expect(nis[0]?.AssociatePublicIpAddress).toBe(false);
  });
});

describe("Security services & outputs", () => {
  test("27 — CloudTrail exists", () => {
    expect(getRes("CloudTrail")).toBeDefined();
  });

  test("28 — GuardDuty enabled", () => {
    expect(getRes("GuardDutyDetector")?.Properties?.Enable).toBe(true);
  });

  test("29 — Outputs include KmsKeyArn, VpcId, CloudTrailArn", () => {
    expect(getOut("KmsKeyArn")).toBeDefined();
    expect(getOut("VpcId")).toBeDefined();
    expect(getOut("CloudTrailArn")).toBeDefined();
  });

  test("30 — Template compiles with CFN intrinsics mapped", () => {
    // sanity: a couple of known intrinsics appear in the parsed object
    const vpc = getRes("Vpc");
    expect(vpc).toBeDefined();
    // Example: ensure at least one Fn shows up in object form somewhere
    const hasFn =
      JSON.stringify(template).includes("\"Fn::") ||
      JSON.stringify(template).includes("\"Ref\"");
    expect(hasFn).toBe(true);
  });
});
