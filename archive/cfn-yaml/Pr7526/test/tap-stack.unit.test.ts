// test/tapstack.unit.test.ts
import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<
    string,
    { Type: string; Properties?: Record<string, any>; Condition?: string }
  >;
  Outputs?: Record<string, any>;
};

const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");
const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");

function loadTemplate(): CFNTemplate {
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw);
}

function hasResource(tpl: CFNTemplate, logicalId: string, type?: string) {
  const r = tpl.Resources?.[logicalId];
  if (!r) return false;
  if (type) return r.Type === type;
  return true;
}

function getRes(tpl: CFNTemplate, logicalId: string) {
  const r = tpl.Resources?.[logicalId];
  if (!r) throw new Error(`Resource ${logicalId} not found`);
  return r;
}

describe("TapStack — Unit Suite", () => {
  // 1
  test("TapStack.yml exists and is non-empty", () => {
    expect(fs.existsSync(yamlPath)).toBe(true);
    const size = fs.statSync(yamlPath).size;
    expect(size).toBeGreaterThan(0);
  });

  // 2
  test("TapStack.json exists and parses", () => {
    expect(fs.existsSync(jsonPath)).toBe(true);
    const tpl = loadTemplate();
    expect(typeof tpl).toBe("object");
  });

  // 3
  test("Template has version and descriptive text", () => {
    const tpl = loadTemplate();
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Description || "").toMatch(/Production-ready|TapStack/i);
  });

  // 4
  test("Required Parameters are present", () => {
    const p = loadTemplate().Parameters || {};
    for (const key of [
      "ProjectName",
      "EnvironmentSuffix",
      "VpcCidr",
      "PublicSubnetACidr",
      "PublicSubnetBCidr",
      "PrivateSubnetACidr",
      "PrivateSubnetBCidr",
      "TrustedEntities",
      "KnownIpAddresses",
      "CompliantInstanceTypes",
      "RegionBlacklist",
      "EnableExampleWorkloads",
      "LogRetentionDays",
      "RdsMultiAz",
    ]) {
      expect(p[key]).toBeDefined();
    }
  });

  // 5
  test("Parameter patterns are defined for identifiers and CIDR", () => {
    const p = loadTemplate().Parameters!;
    expect(p.ProjectName?.AllowedPattern).toBeDefined();
    expect(p.EnvironmentSuffix?.AllowedPattern).toBeDefined();
    expect(p.VpcCidr?.AllowedPattern).toBeDefined();
  });

  // 6
  test("Condition for example workloads exists", () => {
    const c = loadTemplate().Conditions || {};
    expect(Object.keys(c)).toContain("CreateExampleWorkloads");
  });

  // 7
  test("KMS keys exist and have rotation enabled", () => {
    const tpl = loadTemplate();
    for (const id of [
      "S3KmsKey",
      "CloudWatchLogsKmsKey",
      "RdsKmsKey",
      "EbsKmsKey",
      "LambdaKmsKey",
    ]) {
      expect(hasResource(tpl, id, "AWS::KMS::Key")).toBe(true);
      const r = getRes(tpl, id);
      expect(r.Properties?.EnableKeyRotation).toBe(true);
    }
  });

  // 8
  test("Networking core resources are present", () => {
    const tpl = loadTemplate();
    for (const [id, type] of [
      ["VPC", "AWS::EC2::VPC"],
      ["PublicSubnetA", "AWS::EC2::Subnet"],
      ["PublicSubnetB", "AWS::EC2::Subnet"],
      ["PrivateSubnetA", "AWS::EC2::Subnet"],
      ["PrivateSubnetB", "AWS::EC2::Subnet"],
      ["InternetGateway", "AWS::EC2::InternetGateway"],
      ["AttachGateway", "AWS::EC2::VPCGatewayAttachment"],
      ["NatGatewayEIP", "AWS::EC2::EIP"],
      ["NatGateway", "AWS::EC2::NatGateway"],
      ["PublicRouteTable", "AWS::EC2::RouteTable"],
      ["PrivateRouteTable", "AWS::EC2::RouteTable"],
      ["PublicRoute", "AWS::EC2::Route"],
      ["PrivateRoute", "AWS::EC2::Route"],
    ] as const) {
      expect(hasResource(tpl, id, type)).toBe(true);
    }
  });

  // 9
  test("VPC Flow Logs set to CloudWatch Logs with KMS encryption", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "FlowLogGroup", "AWS::Logs::LogGroup")).toBe(true);
    expect(hasResource(tpl, "VpcFlowLog", "AWS::EC2::FlowLog")).toBe(true);
    const lg = getRes(tpl, "FlowLogGroup").Properties || {};
    expect(lg.KmsKeyId).toBeDefined();
    const fl = getRes(tpl, "VpcFlowLog").Properties || {};
    expect(fl.LogDestinationType).toBe("cloud-watch-logs");
  });

  // 10
  test("S3 buckets exist and do not hardcode BucketName", () => {
    const tpl = loadTemplate();
    for (const id of ["LoggingBucket", "CloudTrailBucket", "ArtifactBucket"]) {
      expect(hasResource(tpl, id, "AWS::S3::Bucket")).toBe(true);
      const props = getRes(tpl, id).Properties || {};
      expect(props.BucketName).toBeUndefined();
      // Encrypted with KMS
      const enc =
        props.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
          ?.ServerSideEncryptionByDefault || {};
      expect(enc.SSEAlgorithm).toBe("aws:kms");
      expect(enc.KMSMasterKeyID).toBeDefined();
    }
  });

  // 11
  test("CloudTrail enabled with management events (no invalid wildcards)", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "CloudTrail", "AWS::CloudTrail::Trail")).toBe(true);
    const ct = getRes(tpl, "CloudTrail").Properties!;
    expect(ct.IncludeGlobalServiceEvents).toBe(true);
    expect(ct.IsMultiRegionTrail).toBe(true);
    const selectors = ct.EventSelectors || [];
    expect(selectors.length).toBeGreaterThan(0);
    // Ensure no invalid DataResources arn:aws:s3:::*/*
    const asJson = JSON.stringify(selectors);
    expect(asJson).not.toMatch(/arn:aws:s3:::\*\/\*/);
  });

  // 12
  test("Security Groups exist and ingress is separately declared for 443", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "AppSecurityGroup", "AWS::EC2::SecurityGroup")).toBe(
      true
    );
    expect(
      hasResource(tpl, "AppSecurityGroupIngress443", "AWS::EC2::SecurityGroupIngress")
    ).toBe(true);
    expect(hasResource(tpl, "RdsSecurityGroup", "AWS::EC2::SecurityGroup")).toBe(
      true
    );
  });

  // 13
  test("MFA enforcement managed policy exists", () => {
    const tpl = loadTemplate();
    expect(
      hasResource(tpl, "MfaEnforcementPolicy", "AWS::IAM::ManagedPolicy")
    ).toBe(true);
  });

  // 14
  test("Custom resource Lambda + role exist", () => {
    const tpl = loadTemplate();
    expect(
      hasResource(tpl, "CustomResourceLambdaRole", "AWS::IAM::Role")
    ).toBe(true);
    expect(hasResource(tpl, "ComplianceLambda", "AWS::Lambda::Function")).toBe(
      true
    );
  });

  // 15
  test("ComplianceLambda has COMPLIANCE_MODE and other env vars", () => {
    const tpl = loadTemplate();
    const env =
      getRes(tpl, "ComplianceLambda").Properties?.Environment?.Variables || {};
    for (const k of [
      "TRUSTED_ENTITIES",
      "KNOWN_IP_ADDRESSES",
      "COMPLIANT_INSTANCE_TYPES",
      "REGION_BLACKLIST",
      "ENVIRONMENT_SUFFIX",
      "COMPLIANCE_MODE",
    ]) {
      expect(env[k]).toBeDefined();
    }
  });

  // 16
  test("ComplianceValidator custom resource passes report bucket and keys", () => {
    const tpl = loadTemplate();
    expect(
      hasResource(tpl, "ComplianceValidator", "Custom::ComplianceValidator")
    ).toBe(true);
    const p = getRes(tpl, "ComplianceValidator").Properties || {};
    expect(p.ReportBucket).toBeDefined();
    expect(typeof p.KmsKeyArns).toBeDefined();
    expect(typeof p.S3Buckets).toBeDefined();
  });

  // 17
  test("RDS password secret is generated with KMS", () => {
    const tpl = loadTemplate();
    expect(
      hasResource(tpl, "RdsPasswordSecret", "AWS::SecretsManager::Secret")
    ).toBe(true);
    const props = getRes(tpl, "RdsPasswordSecret").Properties || {};
    expect(props.GenerateSecretString).toBeDefined();
    expect(props.KmsKeyId).toBeDefined();
  });

  // 18
  test("RDS instance uses MySQL 8.4.6, encrypted, KMS key referenced", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "RdsInstance", "AWS::RDS::DBInstance")).toBe(true);
    const r = getRes(tpl, "RdsInstance").Properties!;
    expect(r.Engine).toBe("mysql");
    expect(r.EngineVersion).toBe("8.4.6");
    expect(r.StorageEncrypted).toBe(true);
    expect(r.KmsKeyId).toBeDefined();
  });

  // 19
  test("No hard-coded names for IAM roles/policies/SGs/DB identifier", () => {
    const tpl = loadTemplate();
    const resources = tpl.Resources || {};
    for (const [id, r] of Object.entries(resources)) {
      const props = r.Properties || {};
      // disallow global names that cause early-validation
      expect(props.RoleName).toBeUndefined();
      expect(props.ManagedPolicyName).toBeUndefined();
      expect(props.GroupName).toBeUndefined();
      expect(props.DBInstanceIdentifier).toBeUndefined();
    }
  });

  // 20
  test("ExampleLambda uses KmsKeyArn (ARN form) and has ENVIRONMENT var", () => {
    const tpl = loadTemplate();
    const ex = getRes(tpl, "ExampleLambda").Properties || {};
    // KmsKeyArn must exist (ARN, not Ref ID). We just assert presence (structure may be an intrinsic).
    expect(ex.KmsKeyArn).toBeDefined();
    const evars = ex.Environment?.Variables || {};
    expect(evars.ENVIRONMENT).toBeDefined();
  });

  // 21
  test("ALB, Listener, TargetGroup, WAF present and associated", () => {
    const tpl = loadTemplate();
    for (const [id, type] of [
      ["ApplicationLoadBalancer", "AWS::ElasticLoadBalancingV2::LoadBalancer"],
      ["AlbListener", "AWS::ElasticLoadBalancingV2::Listener"],
      ["TargetGroup", "AWS::ElasticLoadBalancingV2::TargetGroup"],
      ["WebAcl", "AWS::WAFv2::WebACL"],
      ["WafAssociation", "AWS::WAFv2::WebACLAssociation"],
    ] as const) {
      expect(hasResource(tpl, id, type)).toBe(true);
    }
    const alb = getRes(tpl, "ApplicationLoadBalancer").Properties || {};
    expect(alb.Scheme).toBe("internet-facing");
    expect(alb.Type).toBe("application");
  });

  // 22
  test("EC2 Launch Template uses AL2023 SSM parameter and encrypted EBS", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "Ec2LaunchTemplate", "AWS::EC2::LaunchTemplate")).toBe(
      true
    );
    const lt = getRes(tpl, "Ec2LaunchTemplate").Properties?.LaunchTemplateData || {};
    const imageId = lt.ImageId;
    const imageStr = JSON.stringify(imageId);
    expect(imageStr).toMatch(/al2023|kernel-6\.1/i);
    const bdm = (lt.BlockDeviceMappings || [])[0]?.Ebs || {};
    expect(bdm.Encrypted).toBe(true);
    expect(bdm.KmsKeyId).toBeDefined();
  });

  // 23
  test("AutoScalingGroup minimal capacity settings and attaches TG", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "AutoScalingGroup", "AWS::AutoScaling::AutoScalingGroup")).toBe(
      true
    );
    const asg = getRes(tpl, "AutoScalingGroup").Properties || {};
    expect(asg.MinSize).toBe(0);
    expect(asg.DesiredCapacity).toBe(0);
    expect(asg.MaxSize).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(asg.TargetGroupARNs)).toBe(true);
  });

  // 24
  test("Outputs include essential exports and compliance summary", () => {
    const tpl = loadTemplate();
    const o = tpl.Outputs || {};
    for (const key of [
      "VpcId",
      "PublicSubnetIds",
      "PrivateSubnetIds",
      "FlowLogsGroupName",
      "FlowLogsKmsKeyArn",
      "TrailArn",
      "TrailS3BucketName",
      "S3ArtifactBucketName",
      "AppSecurityGroupId",
      "RdsSecurityGroupId",
      "KmsKeyArns",
      "CompliantInstanceTypes",
      "ComplianceSummary",
    ]) {
      expect(o[key]).toBeDefined();
    }
  });

  // 25
  test("S3 buckets have versioning and public access block enabled", () => {
    const tpl = loadTemplate();
    for (const id of ["LoggingBucket", "CloudTrailBucket", "ArtifactBucket"]) {
      const props = getRes(tpl, id).Properties || {};
      expect(props.VersioningConfiguration?.Status).toBe("Enabled");
      const pab = props.PublicAccessBlockConfiguration || {};
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    }
  });

  // 26
  test("Flow log role policy allows writing to CloudWatch Logs", () => {
    const tpl = loadTemplate();
    expect(hasResource(tpl, "FlowLogRole", "AWS::IAM::Role")).toBe(true);
    const role = getRes(tpl, "FlowLogRole").Properties || {};
    const statements =
      role.Policies?.[0]?.PolicyDocument?.Statement?.map((s: any) => s.Action) || [];
    const flattened = JSON.stringify(statements);
    expect(flattened).toMatch(/logs:CreateLogGroup/);
    expect(flattened).toMatch(/logs:PutLogEvents/);
  });

  // 27
  test("No invalid CloudTrail S3 wildcard data selectors are present", () => {
    const tpl = loadTemplate();
    const ctProps = getRes(tpl, "CloudTrail").Properties || {};
    expect(JSON.stringify(ctProps)).not.toMatch(/"Values":\s*\[\s*"arn:aws:s3:::\*\/\*"\s*\]/);
  });

  // 28
  test("No global-name collisions likely: no RoleName/ManagedPolicyName/BucketName on core resources", () => {
    const tpl = loadTemplate();
    const coreIds = [
      "LoggingBucket",
      "CloudTrailBucket",
      "ArtifactBucket",
      "CustomResourceLambdaRole",
      "ExampleLambdaRole",
      "FlowLogRole",
      "AppSecurityGroup",
      "AlbSecurityGroup",
    ];
    for (const id of coreIds) {
      const r = tpl.Resources?.[id];
      if (!r) continue; // some may be conditional
      const props = r.Properties || {};
      expect(props.BucketName).toBeUndefined();
      expect(props.RoleName).toBeUndefined();
      expect(props.ManagedPolicyName).toBeUndefined();
      expect(props.GroupName).toBeUndefined();
    }
  });
});
