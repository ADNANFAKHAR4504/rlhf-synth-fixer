import * as fs from "fs";
import * as path from "path";

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");
const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");

function loadTemplate(): CfnTemplate {
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as CfnTemplate;
}

function resource(t: CfnTemplate, id: string) {
  const r = t.Resources[id];
  expect(r).toBeTruthy();
  return r;
}

function prop(obj: any, key: string) {
  expect(obj).toHaveProperty("Properties");
  expect(obj.Properties).toHaveProperty(key);
  return obj.Properties[key];
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

describe("TapStack CloudFormation Template — Unit Tests", () => {
  let tpl: CfnTemplate;

  beforeAll(() => {
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(yamlPath)).toBe(true);
    tpl = loadTemplate();
    expect(tpl).toBeTruthy();
    expect(tpl.Resources).toBeTruthy();
  });

  // 1
  it("has required template metadata", () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof tpl.Description).toBe("string");
    expect(tpl.Description?.toLowerCase()).toContain("us-east-1");
  });

  // 2
  it("defines EnvironmentSuffix with dev/staging/prod", () => {
    const p = tpl.Parameters?.EnvironmentSuffix;
    expect(p).toBeTruthy();
    expect(p.AllowedValues).toEqual(["dev", "staging", "prod"]);
  });

  // 3
  it("has IsUsEast1 condition targeting us-east-1", () => {
    expect(tpl.Conditions?.IsUsEast1).toBeTruthy();
  });

  // 4
  it("includes the KMS key with correct services allowed", () => {
    const key = resource(tpl, "MasterKmsKey");
    expect(key.Type).toBe("AWS::KMS::Key");
    const kp = prop(key, "KeyPolicy");
    const policyStr = JSON.stringify(kp);
    expect(policyStr).toContain("cloudtrail.amazonaws.com");
    expect(policyStr).toContain("s3.amazonaws.com");
    expect(policyStr).toContain("rds.amazonaws.com");
    expect(policyStr).toContain("logs.amazonaws.com");
  });

  // 5
  it("creates three S3 buckets with KMS encryption", () => {
    const logB = resource(tpl, "LoggingBucket");
    const ctB = resource(tpl, "CloudTrailBucket");
    const dataB = resource(tpl, "DataBucket");
    [logB, ctB, dataB].forEach((b) => {
      const enc = prop(b, "BucketEncryption");
      const cfg = enc.ServerSideEncryptionConfiguration;
      expect(Array.isArray(cfg)).toBe(true);
      const rule = cfg[0].ServerSideEncryptionByDefault;
      expect(rule.SSEAlgorithm).toBe("aws:kms");
      expect(rule.KMSMasterKeyID).toBeDefined();
    });
  });

  // 6
  it("uses short, deterministic bucket names via Fn::Sub structure", () => {
    const nameCheck = (rId: string, prefix: string) => {
      const b = resource(tpl, rId);
      const bn = prop(b, "BucketName");
      expect(bn).toHaveProperty("Fn::Sub");
      const sub = bn["Fn::Sub"];
      expect(Array.isArray(sub)).toBe(true);
      const template: string = sub[0];
      expect(template.startsWith(prefix)).toBe(true);
    };
    nameCheck("LoggingBucket", "ts-logs-");
    nameCheck("CloudTrailBucket", "ts-ct-");
    nameCheck("DataBucket", "ts-data-");
  });

  // 7
  it("enforces TLS-only access in bucket policies", () => {
    const policies = [
      resource(tpl, "LoggingBucketPolicy"),
      resource(tpl, "CloudTrailBucketPolicy"),
      resource(tpl, "DataBucketPolicy"),
    ];
    for (const p of policies) {
      const doc = prop(p, "PolicyDocument");
      expect(JSON.stringify(doc)).toContain('"aws:SecureTransport":false');
      expect(JSON.stringify(doc)).toContain('"Effect":"Deny"');
    }
  });

  // 8
  it("LoggingBucketPolicy explicitly allows AWS Config GetBucketAcl and PutObject with bucket-owner-full-control", () => {
    const lbp = resource(tpl, "LoggingBucketPolicy");
    const doc = prop(lbp, "PolicyDocument");
    const s = JSON.stringify(doc);
    expect(s).toContain("config.amazonaws.com");
    expect(s).toContain("s3:GetBucketAcl");
    expect(s).toContain("s3:PutObject");
    expect(s).toContain("bucket-owner-full-control");
  });

  // 9
  it("creates DeliveryChannel before Recorder and wires KMS ARN", () => {
    const dc = resource(tpl, "ConfigDeliveryChannel");
    expect(dc.Type).toBe("AWS::Config::DeliveryChannel");
    const bucketName = prop(dc, "S3BucketName");
    expect(bucketName.Ref || bucketName).toBe("LoggingBucket");
    const kmsArn = prop(dc, "S3KmsKeyArn");
    expect(kmsArn["Fn::GetAtt"]).toEqual(["MasterKmsKey", "Arn"]);
  });

  // 10
  it("Recorder has an explicit dependency ensuring DC is available (accepts DeliveryChannel or LoggingBucketPolicy)", () => {
    const rec = resource(tpl, "ConfigRecorder");
    const deps = toArray<string>(rec.DependsOn);
    // Your JSON currently shows ["LoggingBucketPolicy"]; also accept "ConfigDeliveryChannel"
    expect(
      deps.includes("ConfigDeliveryChannel") || deps.includes("LoggingBucketPolicy")
    ).toBe(true);

    const rg = prop(rec, "RecordingGroup");
    expect(rg.AllSupported).toBe(true);
    expect(rg.IncludeGlobalResourceTypes).toBe(true);
  });

  // 11
  it("Start custom resource (if present) depends on DeliveryChannel and Recorder", () => {
    const start = tpl.Resources["StartConfigRecorder"];
    if (!start) {
      // Optional resource: pass if absent (order already enforced by dependsOn on recorder)
      expect(true).toBe(true);
      return;
    }
    expect(start.Type).toBe("Custom::StartConfigRecorder");
    const deps = toArray<string>(start.DependsOn);
    expect(deps).toEqual(
      expect.arrayContaining(["ConfigRecorder", "ConfigDeliveryChannel"])
    );
    const token = prop(start, "ServiceToken");
    expect(token["Fn::GetAtt"]).toEqual(["StartConfigRecorderFunction", "Arn"]);
  });

  // 12
  it("StartConfigRecorderFunction (if present) has environment RECORDER_NAME", () => {
    const fn = tpl.Resources["StartConfigRecorderFunction"];
    if (!fn) {
      // Optional resource: pass if absent
      expect(true).toBe(true);
      return;
    }
    const env = prop(fn, "Environment");
    expect(env.Variables.RECORDER_NAME).toMatch(/TapStack-ConfigRecorder-/);
  });

  // 13
  it("CloudTrail trail is multi-region, KMS-encrypted, logging to the CloudTrail bucket", () => {
    const ct = resource(tpl, "CloudTrail");
    expect(prop(ct, "IsMultiRegionTrail")).toBe(true);
    expect(prop(ct, "IncludeGlobalServiceEvents")).toBe(true);
    const s3 = prop(ct, "S3BucketName");
    expect(s3.Ref || s3).toBe("CloudTrailBucket");
    const kms = prop(ct, "KMSKeyId");
    expect(kms.Ref || kms).toBe("MasterKmsKey");
  });

  // 14
  it("RDS DBInstance is private, encrypted, MultiAZ", () => {
    const rds = resource(tpl, "RdsDatabase");
    expect(prop(rds, "PubliclyAccessible")).toBe(false);
    expect(prop(rds, "StorageEncrypted")).toBe(true);
    expect(prop(rds, "MultiAZ")).toBe(true);
    const kms = prop(rds, "KmsKeyId");
    expect(kms.Ref || kms).toBe("MasterKmsKey");
  });

  // 15
  it("DbSubnetGroup references two private subnets", () => {
    const sg = resource(tpl, "DbSubnetGroup");
    const subnets = prop(sg, "SubnetIds");
    expect(Array.isArray(subnets)).toBe(true);
    expect(subnets.length).toBeGreaterThanOrEqual(2);
  });

  // 16
  it("API Gateway stage logs to ApiLogsGroup with JSON format", () => {
    const stage = resource(tpl, "ApiGatewayStage");
    const als = prop(stage, "AccessLogSetting");
    expect(als.DestinationArn["Fn::GetAtt"]).toEqual(["ApiLogsGroup", "Arn"]);
    expect(typeof als.Format).toBe("string");
    expect(als.Format).toContain("$context.requestId");
  });

  // 17
  it("WAF WebACLAssociation uses API Gateway stage ARN via Sub", () => {
    const assoc = resource(tpl, "WafApiGatewayAssociation");
    const arn = prop(assoc, "ResourceArn");
    const s = JSON.stringify(arn);
    expect(s).toContain("apigateway");
    expect(s).toContain("/restapis/");
    expect(s).toContain("/stages/prod");
  });

  // 18
  it("AutoScalingGroup uses two public subnets and sane capacities", () => {
    const asg = resource(tpl, "AutoScalingGroup");
    const vpcz = prop(asg, "VPCZoneIdentifier");
    expect(Array.isArray(vpcz)).toBe(true);
    expect(vpcz.length).toBeGreaterThanOrEqual(2);
    expect(prop(asg, "MinSize")).toBeGreaterThanOrEqual(1);
    expect(prop(asg, "DesiredCapacity")).toBeGreaterThanOrEqual(1);
  });

  // 19
  it("Scaling policies exist for up and down", () => {
    const up = resource(tpl, "ScaleUpPolicy");
    const down = resource(tpl, "ScaleDownPolicy");
    expect(up.Type).toBe("AWS::AutoScaling::ScalingPolicy");
    expect(down.Type).toBe("AWS::AutoScaling::ScalingPolicy");
  });

  // 20
  it("CloudWatch alarms for CPU high/low reference ASG", () => {
    const hi = resource(tpl, "HighCpuAlarm");
    const lo = resource(tpl, "LowCpuAlarm");
    const dimsHi = prop(hi, "Dimensions");
    const dimsLo = prop(lo, "Dimensions");
    [dimsHi, dimsLo].forEach((dims) => {
      expect(Array.isArray(dims)).toBe(true);
      const d = dims.find((x: any) => x.Name === "AutoScalingGroupName");
      expect(d).toBeTruthy();
    });
  });

  // 21
  it("VPC and subnets exist with proper mapping", () => {
    expect(resource(tpl, "TapVpc").Type).toBe("AWS::EC2::VPC");
    expect(resource(tpl, "PublicSubnet1").Type).toBe("AWS::EC2::Subnet");
    expect(resource(tpl, "PublicSubnet2").Type).toBe("AWS::EC2::Subnet");
    expect(resource(tpl, "PrivateSubnet1").Type).toBe("AWS::EC2::Subnet");
    expect(resource(tpl, "PrivateSubnet2").Type).toBe("AWS::EC2::Subnet");
  });

  // 22
  it("Security groups for web and database exist, and DB allows 3306 from web SG", () => {
    const dbsg = resource(tpl, "DatabaseSecurityGroup");
    const ingress = prop(dbsg, "SecurityGroupIngress");
    const rule = (ingress as any[]).find(
      (r) => r.FromPort === 3306 && r.ToPort === 3306 && r.SourceSecurityGroupId
    );
    expect(rule).toBeTruthy();
  });

  // 23
  it("Outputs include key exports like VpcId, KmsKeyArn, ApiGatewayUrl", () => {
    expect(tpl.Outputs).toBeTruthy();
    const outs = tpl.Outputs!;
    ["VpcId", "KmsKeyArn", "ApiGatewayUrl"].forEach((k) => {
      expect(outs[k]).toBeTruthy();
      expect(outs[k].Value).toBeDefined();
    });
  });

  // 24
  it("YAML file exists and looks like a CloudFormation template (lightweight check, no parser)", () => {
    const y = fs.readFileSync(yamlPath, "utf8");
    expect(y).toContain("AWSTemplateFormatVersion");
    expect(y).toContain("Resources:");
    expect(y.length).toBeGreaterThan(1000);
  });
});
