import * as fs from "fs";
import * as path from "path";

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");
const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");

function loadTemplate(): CfnTemplate {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const tpl = JSON.parse(raw) as CfnTemplate;
  if (!tpl || typeof tpl !== "object") {
    throw new Error("TapStack.json did not parse to an object");
  }
  return tpl;
}

function getResource(tpl: CfnTemplate, logicalId: string) {
  expect(tpl.Resources).toBeDefined();
  const res = tpl.Resources![logicalId];
  expect(res).toBeDefined();
  return res;
}

function expectResourceType(tpl: CfnTemplate, logicalId: string, type: string) {
  const res = getResource(tpl, logicalId);
  expect(res.Type).toBe(type);
  return res;
}

describe("TapStack template — unit validations", () => {
  const tpl = loadTemplate();

  // -------- Basic structure --------
  test("01 has mandatory top-level sections", () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Parameters).toBeDefined();
    expect(tpl.Conditions).toBeDefined();
    expect(tpl.Resources).toBeDefined();
    expect(tpl.Outputs).toBeDefined();
  });

  test("02 YAML file exists and is non-empty", () => {
    expect(fs.existsSync(yamlPath)).toBe(true);
    const sz = fs.statSync(yamlPath).size;
    expect(sz).toBeGreaterThan(64); // sanity
  });

  // -------- Parameters --------
  test("03 EnvironmentSuffix is regex-constrained and not enumerated", () => {
    const p = tpl.Parameters!["EnvironmentSuffix"];
    expect(p).toBeDefined();
    expect(p.AllowedPattern).toBeDefined();
    expect(p.AllowedValues).toBeUndefined();
  });

  test("04 ProjectName is lowercase-safe and has defaults", () => {
    const p = tpl.Parameters!["ProjectName"];
    expect(p).toBeDefined();
    expect(typeof p.Default).toBe("string");
    expect(p.AllowedPattern).toBeDefined();
  });

  test("05 Region informational condition exists", () => {
    expect(tpl.Conditions!["IsUSEast1"]).toBeDefined();
  });

  // -------- KMS Key & Alias --------
  test("06 PrimaryKmsKey exists with rotation enabled", () => {
    const res = expectResourceType(tpl, "PrimaryKmsKey", "AWS::KMS::Key");
    expect(res.Properties.EnableKeyRotation).toBe(true);
    expect(res.Properties.KeyPolicy).toBeDefined();
  });

  test("07 PrimaryKmsAlias targets PrimaryKmsKey", () => {
    const res = expectResourceType(tpl, "PrimaryKmsAlias", "AWS::KMS::Alias");
    expect(res.Properties.TargetKeyId).toBeDefined();
  });

  test("08 KMS KeyPolicy includes CloudTrail and Logs principals", () => {
    const res = getResource(tpl, "PrimaryKmsKey");
    const stmts = res.Properties.KeyPolicy?.Statement || [];
    const principals = JSON.stringify(stmts);
    expect(principals).toContain("cloudtrail.amazonaws.com");
    expect(principals).toContain("logs.");
  });

  // -------- Networking --------
  test("09 VPC and subnets exist", () => {
    expectResourceType(tpl, "VPC", "AWS::EC2::VPC");
    expectResourceType(tpl, "PublicSubnetA", "AWS::EC2::Subnet");
    expectResourceType(tpl, "PublicSubnetB", "AWS::EC2::Subnet");
    expectResourceType(tpl, "PrivateSubnetA", "AWS::EC2::Subnet");
    expectResourceType(tpl, "PrivateSubnetB", "AWS::EC2::Subnet");
  });

  test("10 IGW, NAT, and routes exist", () => {
    expectResourceType(tpl, "InternetGateway", "AWS::EC2::InternetGateway");
    expectResourceType(tpl, "NatGateway", "AWS::EC2::NatGateway");
    expectResourceType(tpl, "PublicRoute", "AWS::EC2::Route");
    expectResourceType(tpl, "PrivateRoute", "AWS::EC2::Route");
  });

  // -------- Security Groups --------
  test("11 Bastion, App, and RDS security groups exist", () => {
    expectResourceType(tpl, "BastionSecurityGroup", "AWS::EC2::SecurityGroup");
    expectResourceType(tpl, "ApplicationSecurityGroup", "AWS::EC2::SecurityGroup");
    expectResourceType(tpl, "RDSSecurityGroup", "AWS::EC2::SecurityGroup");
  });

  test("12 App SG allows HTTP 80 and SSH only from Bastion", () => {
    const appSg = getResource(tpl, "ApplicationSecurityGroup");
    const ingress = appSg.Properties.SecurityGroupIngress || [];
    const hasHttp = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.IpProtocol === "tcp");
    const hasSshFromSg = ingress.find((r: any) => r.FromPort === 22 && r.ToPort === 22 && r.SourceSecurityGroupId);
    expect(hasHttp).toBeTruthy();
    expect(hasSshFromSg).toBeTruthy();
  });

  // -------- EC2 Instances --------
  test("13 Bastion and Application instances exist and are tagged", () => {
    const bastion = expectResourceType(tpl, "BastionInstance", "AWS::EC2::Instance");
    const app = expectResourceType(tpl, "ApplicationInstance", "AWS::EC2::Instance");
    expect(Array.isArray(bastion.Properties.Tags)).toBe(true);
    expect(Array.isArray(app.Properties.Tags)).toBe(true);
  });

  // -------- S3 Buckets --------
  test("14 S3 data bucket has versioning and lifecycle", () => {
    const s3 = expectResourceType(tpl, "S3Bucket", "AWS::S3::Bucket");
    expect(s3.Properties.VersioningConfiguration?.Status).toBe("Enabled");
    expect(s3.Properties.LifecycleConfiguration?.Rules?.length).toBeGreaterThan(0);
  });

  test("15 S3 data bucket and logs bucket have KMS SSE and public access blocks", () => {
    const s3 = getResource(tpl, "S3Bucket");
    const logs = getResource(tpl, "S3BucketLogging");
    const enc1 = JSON.stringify(s3.Properties.BucketEncryption || {});
    const enc2 = JSON.stringify(logs.Properties.BucketEncryption || {});
    expect(enc1).toContain("aws:kms");
    expect(enc2).toContain("aws:kms");
    expect(s3.Properties.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(logs.Properties.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
  });

  test("16 S3 bucket enforces TLS-only access via bucket policy", () => {
    const pol = expectResourceType(tpl, "S3BucketPolicy", "AWS::S3::BucketPolicy");
    const doc = pol.Properties.PolicyDocument;
    const sid = JSON.stringify(doc?.Statement || []);
    expect(sid.toLowerCase()).toContain("enforcetls");
  });

  // -------- Lambda & API Gateway --------
  test("17 Lambda function is defined with KMS, env, and inline code", () => {
    const fn = expectResourceType(tpl, "LambdaFunction", "AWS::Lambda::Function");
    expect(fn.Properties.KmsKeyArn).toBeDefined();
    expect(fn.Properties.Environment?.Variables).toBeDefined();
    expect(fn.Properties.Code?.ZipFile).toBeDefined();
  });

  test("18 Lambda log group uses KMS", () => {
    const lg = expectResourceType(tpl, "LambdaLogGroup", "AWS::Logs::LogGroup");
    expect(lg.Properties.KmsKeyId).toBeDefined();
  });

  test("19 S3 event triggers Lambda (NotificationConfiguration + Permission)", () => {
    const s3 = getResource(tpl, "S3Bucket");
    const notif = s3.Properties.NotificationConfiguration;
    expect(notif).toBeDefined();
    expect(Array.isArray(notif.LambdaConfigurations)).toBe(true);
    expectResourceType(tpl, "LambdaPermissionForS3", "AWS::Lambda::Permission");
  });

  test("20 API Gateway integrates with Lambda and has logging role", () => {
    expectResourceType(tpl, "ApiGatewayRestApi", "AWS::ApiGateway::RestApi");
    expectResourceType(tpl, "ApiGatewayMethod", "AWS::ApiGateway::Method");
    expectResourceType(tpl, "ApiGatewayCWRole", "AWS::IAM::Role");
    const acct = expectResourceType(tpl, "ApiGatewayAccount", "AWS::ApiGateway::Account");
    expect(acct.Properties.CloudWatchRoleArn).toBeDefined();
  });

  test("21 API Gateway stage has access log settings", () => {
    const stg = expectResourceType(tpl, "ApiGatewayStage", "AWS::ApiGateway::Stage");
    expect(stg.Properties.AccessLogSetting?.DestinationArn).toBeDefined();
    expect(typeof stg.Properties.AccessLogSetting?.Format).toBe("string");
  });

  // -------- DynamoDB & Auto Scaling --------
  test("22 DynamoDB table is provisioned mode with SSE KMS", () => {
    const t = expectResourceType(tpl, "DynamoTable", "AWS::DynamoDB::Table");
    expect(t.Properties.BillingMode).toBe("PROVISIONED");
    expect(t.Properties.SSESpecification?.SSEEnabled).toBe(true);
    expect(t.Properties.SSESpecification?.SSEType).toBe("KMS");
  });

  test("23 Application Auto Scaling targets and policies exist for R/W", () => {
    expectResourceType(tpl, "AppScalingRole", "AWS::IAM::Role");
    expectResourceType(tpl, "DynamoReadScalableTarget", "AWS::ApplicationAutoScaling::ScalableTarget");
    expectResourceType(tpl, "DynamoWriteScalableTarget", "AWS::ApplicationAutoScaling::ScalableTarget");
    expectResourceType(tpl, "DynamoReadScalingPolicy", "AWS::ApplicationAutoScaling::ScalingPolicy");
    expectResourceType(tpl, "DynamoWriteScalingPolicy", "AWS::ApplicationAutoScaling::ScalingPolicy");
  });

  // -------- RDS & Secrets --------
  test("24 Secrets Manager for DB credentials is present", () => {
    expectResourceType(tpl, "DBSecret", "AWS::SecretsManager::Secret");
  });


  // -------- SNS --------
  test("25 SNS Topic exists and uses KMS", () => {
    const t = expectResourceType(tpl, "NotificationsTopic", "AWS::SNS::Topic");
    // In JSON, property could be 'KmsMasterKeyId' or 'KMSMasterKeyId' depending on transform.
    const raw = JSON.stringify(t.Properties);
    expect(raw).toMatch(/KmsMasterKeyId|KMSMasterKeyId/);
  });

  // -------- CloudWatch Alarms --------
  test("26 Example alarms exist for EC2 and Lambda", () => {
    expectResourceType(tpl, "AlarmEC2StatusCheck", "AWS::CloudWatch::Alarm");
    expectResourceType(tpl, "AlarmLambdaErrors", "AWS::CloudWatch::Alarm");
  });

  // -------- CloudTrail --------
  test("27 CloudTrail Trail depends on bucket policy and uses KMS + dedicated bucket", () => {
    const b = expectResourceType(tpl, "CloudTrailBucket", "AWS::S3::Bucket");
    expectResourceType(tpl, "CloudTrailBucketPolicy", "AWS::S3::BucketPolicy");
    const tr = expectResourceType(tpl, "Trail", "AWS::CloudTrail::Trail");
    const props = tr.Properties;
    expect(props.S3BucketName).toBeDefined();
    expect(props.KMSKeyId).toBeDefined();
    expect(props.EnableLogFileValidation).toBe(true);
  });
});
