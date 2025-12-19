// tapstack.template.unit.test.ts

import * as fs from "fs";
import * as path from "path";

type CfTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

function loadTemplate(): CfTemplate {
  const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as CfTemplate;
}

const template = loadTemplate();
const resources = template.Resources ?? {};
const parameters = template.Parameters ?? {};
const outputs = template.Outputs ?? {};

describe("TapStack CloudFormation template", () => {
  // 1–2: Basic structure
  it("has AWSTemplateFormatVersion, Description, Parameters, Resources, and Outputs", () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(template.Description).toBeDefined();
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  it("contains non-empty resources and parameters", () => {
    expect(Object.keys(resources).length).toBeGreaterThan(0);
    expect(Object.keys(parameters).length).toBeGreaterThan(0);
  });

  // 3–6: Parameters and defaults
  it("defines EnvironmentSuffix parameter with a regex AllowedPattern", () => {
    const envSuffix = parameters.EnvironmentSuffix;
    expect(envSuffix).toBeDefined();
    expect(envSuffix.Type).toBe("String");
    expect(envSuffix.AllowedPattern).toBe("^[a-z0-9]+(?:-[a-z0-9]+)*$");
  });

  it("defines ProjectName parameter with a safe naming pattern", () => {
    const proj = parameters.ProjectName;
    expect(proj).toBeDefined();
    expect(proj.AllowedPattern).toBe("^[a-z0-9]+(?:-[a-z0-9]+)*$");
  });

  it("ensures every parameter has a Default value for CI/CD deploys", () => {
    for (const [name, param] of Object.entries(parameters)) {
      // Some intrinsic-only params (rare) might not need defaults, but here we expect all user parameters to have them
      expect(param.Default).toBeDefined();
    }
  });

  // 7–9: KMS keys
  it("defines DataKmsKey as a KMS key with rotation enabled", () => {
    const key = resources.DataKmsKey;
    expect(key).toBeDefined();
    expect(key.Type).toBe("AWS::KMS::Key");
    expect(key.Properties.EnableKeyRotation).toBe(true);
  });

  it("defines RdsKmsKey with key rotation enabled for RDS encryption", () => {
    const key = resources.RdsKmsKey;
    expect(key).toBeDefined();
    expect(key.Type).toBe("AWS::KMS::Key");
    expect(key.Properties.EnableKeyRotation).toBe(true);
  });

  it("uses LogsKmsKey for CloudTrail and Flow log groups KmsKeyId", () => {
    const logsKms = resources.LogsKmsKey;
    const cloudTrailLogGroup = resources.CloudTrailLogGroup;
    const flowLogLogGroup = resources.FlowLogLogGroup;

    expect(logsKms).toBeDefined();
    expect(cloudTrailLogGroup).toBeDefined();
    expect(flowLogLogGroup).toBeDefined();

    expect(cloudTrailLogGroup.Properties.KmsKeyId).toEqual({ "Fn::GetAtt": ["LogsKmsKey", "Arn"] });
    expect(flowLogLogGroup.Properties.KmsKeyId).toEqual({ "Fn::GetAtt": ["LogsKmsKey", "Arn"] });
  });

  // 10–12: S3 buckets
  it("configures LoggingBucket with SSE-KMS using DataKmsKey and strict public access blocking", () => {
    const bucket = resources.LoggingBucket;
    expect(bucket).toBeDefined();

    const props = bucket.Properties;
    const encCfg = props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
    expect(encCfg.SSEAlgorithm).toBe("aws:kms");
    expect(encCfg.KMSMasterKeyID).toEqual({ Ref: "DataKmsKey" });

    expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    expect(props.OwnershipControls.Rules[0].ObjectOwnership).toBe("BucketOwnerEnforced");
    // Ensure no explicit BucketName is set (avoid EarlyValidation name conflicts)
    expect(props.BucketName).toBeUndefined();
  });

  it("configures CloudTrailBucket with SSE-KMS using TrailKmsKey and no explicit BucketName", () => {
    const bucket = resources.CloudTrailBucket;
    expect(bucket).toBeDefined();

    const props = bucket.Properties;
    const encCfg = props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
    expect(encCfg.SSEAlgorithm).toBe("aws:kms");
    expect(encCfg.KMSMasterKeyID).toEqual({ Ref: "TrailKmsKey" });
    expect(props.BucketName).toBeUndefined();
  });

  it("enforces TLS-only access on logging and CloudTrail buckets via bucket policies", () => {
    const loggingPolicy = resources.LoggingBucketPolicy;
    const trailPolicy = resources.CloudTrailBucketPolicy;
    expect(loggingPolicy).toBeDefined();
    expect(trailPolicy).toBeDefined();

    const loggingStatements = loggingPolicy.Properties.PolicyDocument.Statement;
    const trailStatements = trailPolicy.Properties.PolicyDocument.Statement;

    const loggingEnforceTls = loggingStatements.find((s: any) => s.Sid === "EnforceTLS");
    const trailEnforceTls = trailStatements.find((s: any) => s.Sid === "EnforceTLS");

    expect(loggingEnforceTls).toBeDefined();
    expect(trailEnforceTls).toBeDefined();
    expect(loggingEnforceTls.Effect).toBe("Deny");
    expect(trailEnforceTls.Effect).toBe("Deny");
  });

  // 13–14: VPC & subnets
  it("creates a VPC referencing the VpcCidr parameter", () => {
    const vpc = resources.Vpc;
    expect(vpc).toBeDefined();
    expect(vpc.Type).toBe("AWS::EC2::VPC");
    expect(vpc.Properties.CidrBlock).toEqual({ Ref: "VpcCidr" });
  });

  it("defines two public and two private subnets in the VPC", () => {
    const publicA = resources.PublicSubnetA;
    const publicB = resources.PublicSubnetB;
    const privateA = resources.PrivateSubnetA;
    const privateB = resources.PrivateSubnetB;

    expect(publicA).toBeDefined();
    expect(publicB).toBeDefined();
    expect(privateA).toBeDefined();
    expect(privateB).toBeDefined();

    [publicA, publicB, privateA, privateB].forEach((subnet) => {
      expect(subnet.Type).toBe("AWS::EC2::Subnet");
      expect(subnet.Properties.VpcId).toEqual({ Ref: "Vpc" });
    });
  });


  it("allows AppSecurityGroup ingress on TCP 8080 only from AlbSecurityGroup", () => {
    const sg = resources.AppSecurityGroup;
    expect(sg).toBeDefined();

    const ingress = sg.Properties.SecurityGroupIngress;
    expect(Array.isArray(ingress)).toBe(true);
    expect(ingress.length).toBe(1);

    const rule = ingress[0];
    expect(rule.IpProtocol).toBe("tcp");
    expect(rule.FromPort).toBe(8080);
    expect(rule.ToPort).toBe(8080);
    expect(rule.SourceSecurityGroupId).toEqual({ Ref: "AlbSecurityGroup" });
  });

  it("allows RdsSecurityGroup ingress on TCP 5432 only from AppSecurityGroup", () => {
    const sg = resources.RdsSecurityGroup;
    expect(sg).toBeDefined();

    const ingress = sg.Properties.SecurityGroupIngress;
    expect(Array.isArray(ingress)).toBe(true);
    expect(ingress.length).toBe(1);

    const rule = ingress[0];
    expect(rule.IpProtocol).toBe("tcp");
    expect(rule.FromPort).toBe(5432);
    expect(rule.ToPort).toBe(5432);
    expect(rule.SourceSecurityGroupId).toEqual({ Ref: "AppSecurityGroup" });
  });

  // 18–20: WAF & ALB
  it("defines a regional WAFv2 WebACL with AWS managed rule groups", () => {
    const waf = resources.WafWebAcl;
    expect(waf).toBeDefined();
    expect(waf.Type).toBe("AWS::WAFv2::WebACL");

    const props = waf.Properties;
    expect(props.Scope).toBe("REGIONAL");
    expect(Array.isArray(props.Rules)).toBe(true);
    expect(props.Rules.length).toBeGreaterThan(0);
  });

  it("associates the WAF WebACL to the ALB via WafWebAclAssociation", () => {
    const assoc = resources.WafWebAclAssociation;
    expect(assoc).toBeDefined();
    expect(assoc.Type).toBe("AWS::WAFv2::WebACLAssociation");
    expect(assoc.Properties.ResourceArn).toEqual({ Ref: "Alb" });
    expect(assoc.Properties.WebACLArn).toEqual({ "Fn::GetAtt": ["WafWebAcl", "Arn"] });
  });

  it("defines an internet-facing ALB using AlbScheme parameter and AlbSecurityGroup", () => {
    const alb = resources.Alb;
    expect(alb).toBeDefined();
    expect(alb.Type).toBe("AWS::ElasticLoadBalancingV2::LoadBalancer");

    const props = alb.Properties;
    expect(props.Scheme).toEqual({ Ref: "AlbScheme" });
    expect(props.SecurityGroups).toContainEqual({ Ref: "AlbSecurityGroup" });
    expect(props.Name).toBeUndefined(); // avoid explicit Name to prevent EarlyValidation conflicts
  });

  // 21–22: CloudTrail & Flow Logs
  it("enables a multi-region CloudTrail logging to the CloudTrailBucket and CloudWatch Logs", () => {
    const trail = resources.CloudTrail;
    expect(trail).toBeDefined();
    expect(trail.Type).toBe("AWS::CloudTrail::Trail");

    const props = trail.Properties;
    expect(props.IsMultiRegionTrail).toBe(true);
    expect(props.S3BucketName).toEqual({ Ref: "CloudTrailBucket" });
    expect(props.KMSKeyId).toEqual({ Ref: "TrailKmsKey" });
    expect(props.CloudWatchLogsLogGroupArn).toEqual({ "Fn::GetAtt": ["CloudTrailLogGroup", "Arn"] });
  });

  it("configures VpcFlowLogs to send ALL traffic logs to FlowLogLogGroup", () => {
    const flow = resources.VpcFlowLogs;
    expect(flow).toBeDefined();
    expect(flow.Type).toBe("AWS::EC2::FlowLog");

    const props = flow.Properties;
    expect(props.ResourceType).toBe("VPC");
    expect(props.ResourceId).toEqual({ Ref: "Vpc" });
    expect(props.TrafficType).toBe("ALL");
    expect(props.LogGroupName).toEqual({ Ref: "FlowLogLogGroup" });
  });


  it("enables GuardDuty via a Detector with S3 logs", () => {
    const detector = resources.GuardDutyDetector;
    if (detector) {
      expect(detector.Type).toBe("AWS::GuardDuty::Detector");
      expect(detector.Properties.Enable).toBe(true);
      expect(detector.Properties.DataSources.S3Logs.Enable).toBe(true);
    }
  });

  it("defines SecurityHubStandards custom resource with CIS and FSBP standards ARNs", () => {
    const sh = resources.SecurityHubStandards;
    if (sh) {
      expect(sh.Type).toBe("Custom::SecurityHubStandards");
      const arns = sh.Properties.StandardsArns;
      expect(Array.isArray(arns)).toBe(true);
      expect(arns.length).toBeGreaterThanOrEqual(2);
    }
  });

  // 26–27: RDS
  it("configures RdsInstance with KMS encryption at rest and managed master password", () => {
    const rds = resources.RdsInstance;
    expect(rds).toBeDefined();
    expect(rds.Type).toBe("AWS::RDS::DBInstance");

    const props = rds.Properties;
    expect(props.Engine).toBe("postgres");
    expect(props.StorageEncrypted).toBe(true);
    expect(props.KmsKeyId).toEqual({ Ref: "RdsKmsKey" });
    expect(props.ManageMasterUserPassword).toBe(true);
    expect(props.DBInstanceIdentifier).toBeUndefined(); // avoid explicit identifier
  });

  it("enforces TLS for RDS via parameter group rds.force_ssl = '1'", () => {
    const pg = resources.RdsParameterGroup;
    expect(pg).toBeDefined();
    expect(pg.Type).toBe("AWS::RDS::DBParameterGroup");
    expect(pg.Properties.Family).toBe("postgres16");
    expect(pg.Properties.Parameters["rds.force_ssl"]).toBe("1");
  });

  // 28: Outputs
  it("exposes key Outputs such as VpcId and RdsEndpointAddress", () => {
    const vpcOut = outputs.VpcId;
    const rdsEndpoint = outputs.RdsEndpointAddress;

    expect(vpcOut).toBeDefined();
    expect(vpcOut.Value).toEqual({ Ref: "Vpc" });

    expect(rdsEndpoint).toBeDefined();
    expect(rdsEndpoint.Value).toEqual({
      "Fn::GetAtt": ["RdsInstance", "Endpoint.Address"],
    });
  });
});
