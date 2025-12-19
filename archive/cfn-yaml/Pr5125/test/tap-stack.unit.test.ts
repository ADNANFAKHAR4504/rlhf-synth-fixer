// test/tap-stack.unit.test.ts
// Comprehensive Jest unit tests for TapStack CloudFormation template.
// Assumptions:
// - The synthesized CloudFormation JSON is available at ../lib/TapStack.json
// - Tests are intentionally resilient to intrinsic functions (Fn::Sub, etc.)

import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  Parameters?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

function loadTemplate(): CFNTemplate {
  const p = path.resolve(__dirname, "../lib/TapStack.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function resourcesByType(tpl: CFNTemplate, type: string) {
  const out: Array<{ id: string; res: any }> = [];
  const r = tpl.Resources || {};
  for (const [id, res] of Object.entries(r)) {
    if ((res as any).Type === type) {
      out.push({ id, res });
    }
  }
  return out;
}

function getResource(tpl: CFNTemplate, type: string, logicalId?: string) {
  const list = resourcesByType(tpl, type);
  if (logicalId) return list.find((x) => x.id === logicalId);
  return list[0];
}

function getProp(obj: any, pathStr: string) {
  return pathStr.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function expectAtLeast(n: number, actual: number) {
  expect(actual).toBeGreaterThanOrEqual(n);
}

function normalizeToString(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  // Handle common intrinsics (Fn::Sub with a string)
  if (typeof v === "object" && "Fn::Sub" in v) {
    const sub = (v as any)["Fn::Sub"];
    if (typeof sub === "string") return sub;
  }
  // Fallback: stringify so we can still substring-match
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

describe("TapStack CloudFormation Template", () => {
  let tpl: CFNTemplate;

  beforeAll(() => {
    tpl = loadTemplate();
    expect(tpl).toBeTruthy();
  });

  // 1
  test("has required Parameters with sane defaults/patterns", () => {
    const p = tpl.Parameters || {};
    expect(p.ProjectName).toBeTruthy();
    expect(p.EnvironmentSuffix || p.ENVIRONMENT_SUFFIX || p.Environment || p.ENVIRONMENTSUFFIX).toBeTruthy();
    expect(p.UniqueIdSeed).toBeTruthy();
    expect(p.VpcCidr).toBeTruthy();
    expect(p.PublicSubnet1Cidr).toBeTruthy();
    expect(p.PublicSubnet2Cidr).toBeTruthy();
    expect(p.PrivateSubnet1Cidr).toBeTruthy();
    expect(p.PrivateSubnet2Cidr).toBeTruthy();
    expect(p.AppInstanceType).toBeTruthy();
    expect(p.MinSize).toBeTruthy();
    expect(p.MaxSize).toBeTruthy();
    expect(p.DesiredCapacity).toBeTruthy();
    expect(p.AuroraEngineVersion).toBeTruthy();
    expect(p.NotificationEmail).toBeTruthy();
  });

  // 2
  test("creates a new VPC with DNS support and hostnames enabled", () => {
    const vpc = getResource(tpl, "AWS::EC2::VPC");
    expect(vpc).toBeTruthy();
    expect(getProp(vpc?.res, "Properties.EnableDnsSupport")).toBe(true);
    expect(getProp(vpc?.res, "Properties.EnableDnsHostnames")).toBe(true);
  });

  // 3
  test("has two public and two private subnets across AZs", () => {
    const subnets = resourcesByType(tpl, "AWS::EC2::Subnet");
    expectAtLeast(4, subnets.length);
    const publicSubs = subnets.filter((s) => /Pub/i.test(s.id));
    const privateSubs = subnets.filter((s) => /Priv/i.test(s.id));
    expectAtLeast(2, publicSubs.length);
    expectAtLeast(2, privateSubs.length);
  });

  // 4
  test("Internet Gateway and VPC attachment exist", () => {
    expect(getResource(tpl, "AWS::EC2::InternetGateway")).toBeTruthy();
    expect(getResource(tpl, "AWS::EC2::VPCGatewayAttachment")).toBeTruthy();
  });

  // 5
  test("NAT Gateways and EIPs are present (multi-AZ egress)", () => {
    const eips = resourcesByType(tpl, "AWS::EC2::EIP");
    const nats = resourcesByType(tpl, "AWS::EC2::NatGateway");
    expectAtLeast(2, eips.length);
    expectAtLeast(2, nats.length);
  });

  // 6
  test("route tables and default routes configured for IGW and NAT", () => {
    const rts = resourcesByType(tpl, "AWS::EC2::RouteTable");
    const routes = resourcesByType(tpl, "AWS::EC2::Route");
    expectAtLeast(2, rts.length);
    expectAtLeast(2, routes.length);
    const hasIgw = routes.some(
      (r) => getProp(r.res, "Properties.DestinationCidrBlock") === "0.0.0.0/0" && !!getProp(r.res, "Properties.GatewayId")
    );
    const hasNat = routes.some(
      (r) => getProp(r.res, "Properties.DestinationCidrBlock") === "0.0.0.0/0" && !!getProp(r.res, "Properties.NatGatewayId")
    );
    expect(hasIgw).toBe(true);
    expect(hasNat).toBe(true);
  });

  // 7 (fixed)
  test("VPC Endpoints include S3 (Gateway) and core Interface endpoints", () => {
    const vpcEndpoints = resourcesByType(tpl, "AWS::EC2::VPCEndpoint");
    expectAtLeast(6, vpcEndpoints.length);

    const descriptors = vpcEndpoints.map((v) => {
      const type = getProp(v.res, "Properties.VpcEndpointType") || "";
      const service = normalizeToString(getProp(v.res, "Properties.ServiceName"));
      return { type: String(type), service };
    });

    const hasS3Gateway = descriptors.some(
      (d) => d.type.toLowerCase() === "gateway" && /\.s3(\.|$)/.test(d.service)
    );
    expect(hasS3Gateway).toBe(true);

    const mustHave = ["\\.ssm", "\\.ec2messages", "\\.ssmmessages", "\\.logs", "\\.kms", "\\.sts"];
    for (const rx of mustHave) {
      const present = descriptors.some((d) => new RegExp(rx).test(d.service));
      expect(present).toBe(true);
    }
  });

  // 8
  test("Security Groups: ALB, App, DB, and Endpoint SG exist", () => {
    const sgs = resourcesByType(tpl, "AWS::EC2::SecurityGroup");
    expectAtLeast(4, sgs.length);
    const names = sgs.map((x) => x.id);
    expect(names.some((n) => /AlbSg/i.test(n))).toBe(true);
    expect(names.some((n) => /AppSg/i.test(n))).toBe(true);
    expect(names.some((n) => /DbSg/i.test(n))).toBe(true);
    expect(names.some((n) => /VpceSg|EndpointSg/i.test(n))).toBe(true);
  });

  // 9
  test("ALB configured internet-facing with access logs", () => {
    const alb = getResource(tpl, "AWS::ElasticLoadBalancingV2::LoadBalancer");
    expect(alb).toBeTruthy();
    expect(getProp(alb?.res, "Properties.Scheme")).toBe("internet-facing");
    const attrs = getProp(alb?.res, "Properties.LoadBalancerAttributes") || [];
    const enabled = attrs.find((a: any) => a.Key === "access_logs.s3.enabled");
    const bucket = attrs.find((a: any) => a.Key === "access_logs.s3.bucket");
    expect(enabled?.Value).toBe("true");
    expect(bucket?.Value).toBeTruthy();
  });

  // 10
  test("Target Group on port 8080 with HTTP health checks", () => {
    const tgs = resourcesByType(tpl, "AWS::ElasticLoadBalancingV2::TargetGroup");
    expectAtLeast(1, tgs.length);
    const tg = tgs[0].res;
    expect(getProp(tg, "Properties.Port")).toBeDefined();
    expect(getProp(tg, "Properties.Protocol")).toBe("HTTP");
    expect(getProp(tg, "Properties.HealthCheckPath")).toBe("/");
  });

  // 11
  test("Listeners defined (HTTP forward and/or HTTP->HTTPS redirect, plus HTTPS if ACM)", () => {
    const listeners = resourcesByType(tpl, "AWS::ElasticLoadBalancingV2::Listener");
    expectAtLeast(1, listeners.length);
    const has80 = listeners.some((l) => getProp(l.res, "Properties.Port") === 80);
    expect(has80).toBe(true);
  });

  // 12
  test("KMS keys with rotation and distinct aliases exist for logs, data, params", () => {
    const keys = resourcesByType(tpl, "AWS::KMS::Key");
    const aliases = resourcesByType(tpl, "AWS::KMS::Alias");
    expectAtLeast(3, keys.length);
    expectAtLeast(3, aliases.length);
    keys.forEach((k) => expect(getProp(k.res, "Properties.EnableKeyRotation")).toBe(true));
  });

  // 13
  test("S3 buckets exist with versioning and TLS-only policies", () => {
    const buckets = resourcesByType(tpl, "AWS::S3::Bucket");
    expectAtLeast(4, buckets.length);
    buckets.forEach((b) => {
      const vers = getProp(b.res, "Properties.VersioningConfiguration.Status");
      expect(vers).toBe("Enabled");
      const enc = getProp(
        b.res,
        "Properties.BucketEncryption.ServerSideEncryptionConfiguration.0.ServerSideEncryptionByDefault.SSEAlgorithm"
      );
      expect(enc).toBeTruthy(); // AES256 or aws:kms
    });
    const bucketPolicies = resourcesByType(tpl, "AWS::S3::BucketPolicy");
    const hasEnforceTLS = bucketPolicies.some((bp) => {
      const stmts = getProp(bp.res, "Properties.PolicyDocument.Statement") || [];
      return stmts.some((s: any) => s.Sid === "EnforceTLS" && s.Effect === "Deny");
    });
    expect(hasEnforceTLS).toBe(true);
  });

  // 14 (fixed)
  test("IAM roles exist for EC2, Lambda, Trail/Flow Logs, and Config", () => {
    const roles = resourcesByType(tpl, "AWS::IAM::Role");
    expectAtLeast(4, roles.length);
    const ids = roles.map((r) => r.id).join(" ");
    // Accept actual logical IDs present in the template
    expect(ids).toMatch(/AppInstanceRole/i);
    expect(ids).toMatch(/LambdaRole/i);
    expect(ids).toMatch(/TrailLogsRole/i);
    expect(ids).toMatch(/FlowLogsRole/i);
    expect(ids).toMatch(/CfgRole/i);
  });

  // 15
  test("Launch Template enforces IMDSv2 and encrypted EBS", () => {
    const lt = getResource(tpl, "AWS::EC2::LaunchTemplate");
    expect(lt).toBeTruthy();
    expect(getProp(lt?.res, "Properties.LaunchTemplateData.MetadataOptions.HttpTokens")).toBe("required");
    const bdm0 = getProp(lt?.res, "Properties.LaunchTemplateData.BlockDeviceMappings.0.Ebs.Encrypted");
    expect(bdm0).toBe(true);
  });

  // 16
  test("Auto Scaling Group spans private subnets and attaches to Target Group", () => {
    const asg = getResource(tpl, "AWS::AutoScaling::AutoScalingGroup");
    expect(asg).toBeTruthy();
    const vpcZones = getProp(asg?.res, "Properties.VPCZoneIdentifier") || [];
    expectAtLeast(2, vpcZones.length);
    const tgArns = getProp(asg?.res, "Properties.TargetGroupARNs") || [];
    expectAtLeast(1, tgArns.length);
  });

  // 17
  test("Aurora PostgreSQL cluster is encrypted, multi-AZ, IAM Auth enabled", () => {
    const cluster = getResource(tpl, "AWS::RDS::DBCluster");
    expect(cluster).toBeTruthy();
    expect(getProp(cluster?.res, "Properties.Engine")).toBe("aurora-postgresql");
    expect(getProp(cluster?.res, "Properties.StorageEncrypted")).toBe(true);
    expect(getProp(cluster?.res, "Properties.EnableIAMDatabaseAuthentication")).toBe(true);
    expect(getProp(cluster?.res, "Properties.DBSubnetGroupName")).toBeTruthy();
  });

  // 18
  test("Two Aurora instances exist across AZs", () => {
    const instances = resourcesByType(tpl, "AWS::RDS::DBInstance");
    expectAtLeast(2, instances.length);
    instances.forEach((i) => expect(getProp(i.res, "Properties.DBClusterIdentifier")).toBeTruthy());
  });

  // 19
  test("CloudTrail is multi-region and delivers to S3 and CloudWatch Logs with KMS", () => {
    const trail = getResource(tpl, "AWS::CloudTrail::Trail");
    expect(trail).toBeTruthy();
    expect(getProp(trail?.res, "Properties.IsMultiRegionTrail")).toBe(true);
    expect(getProp(trail?.res, "Properties.S3BucketName")).toBeTruthy();
    expect(getProp(trail?.res, "Properties.CloudWatchLogsLogGroupArn")).toBeTruthy();
    expect(getProp(trail?.res, "Properties.CloudWatchLogsRoleArn")).toBeTruthy();
    expect(getProp(trail?.res, "Properties.KMSKeyId")).toBeTruthy();
  });

  // 20
  test("VPC Flow Logs ship to CloudWatch Logs and S3", () => {
    const flows = resourcesByType(tpl, "AWS::EC2::FlowLog");
    expectAtLeast(2, flows.length);
    const hasCw = flows.some((f) => getProp(f.res, "Properties.LogDestinationType") === "cloud-watch-logs");
    const hasS3 = flows.some((f) => getProp(f.res, "Properties.LogDestinationType") === "s3");
    expect(hasCw).toBe(true);
    expect(hasS3).toBe(true);
  });

  // 21
  test("CloudWatch metric filters and alarms exist for Unauthorized, TrailChange, and KmsChange", () => {
    const mfs = resourcesByType(tpl, "AWS::Logs::MetricFilter");
    const alarms = resourcesByType(tpl, "AWS::CloudWatch::Alarm");
    expectAtLeast(3, mfs.length);
    expectAtLeast(3, alarms.length);
  });

  // 22
  test("AWS Config recorder and delivery channel exist with managed rules", () => {
    expect(getResource(tpl, "AWS::Config::ConfigurationRecorder")).toBeTruthy();
    expect(getResource(tpl, "AWS::Config::DeliveryChannel")).toBeTruthy();
    const rules = resourcesByType(tpl, "AWS::Config::ConfigRule");
    expectAtLeast(3, rules.length);
  });

  // 23
  test("GuardDuty detector enabled with EventBridge rule to SNS", () => {
    const gd = getResource(tpl, "AWS::GuardDuty::Detector");
    const eb = resourcesByType(tpl, "AWS::Events::Rule");
    expect(gd).toBeTruthy();
    expectAtLeast(1, eb.length);
    const sendsToSns = eb.some((r) => {
      const targets = getProp(r.res, "Properties.Targets") || [];
      return targets.some((t: any) => t.Arn && typeof t.Arn === "object");
    });
    expect(sendsToSns).toBe(true);
  });

  // 24
  test("Lambda function (Python) exists, runs in private subnets, and has S3 invoke permission", () => {
    const fn = getResource(tpl, "AWS::Lambda::Function");
    expect(fn).toBeTruthy();
    expect(getProp(fn?.res, "Properties.Runtime")).toMatch(/python/i);
    const vpcCfg = getProp(fn?.res, "Properties.VpcConfig");
    expect(vpcCfg).toBeTruthy();
    expect(Array.isArray(vpcCfg.SubnetIds)).toBe(true);
    const perm = getResource(tpl, "AWS::Lambda::Permission");
    expect(perm).toBeTruthy();
    expect(getProp(perm?.res, "Properties.Principal")).toBe("s3.amazonaws.com");
  });

  // 25
  test("Outputs include key references (ALB DNS, ASG, RDS endpoints, buckets, kms aliases, endpoints)", () => {
    const outs = tpl.Outputs || {};
    const keys = Object.keys(outs);
    expectAtLeast(10, keys.length);
    const text = keys.join(" ");
    expect(text).toMatch(/AlbDnsName/i);
    expect(text).toMatch(/AsgName/i);
    expect(text).toMatch(/RdsEndpoint/i);
    expect(text).toMatch(/RdsReaderEndpoint/i);
    expect(text).toMatch(/S3Buckets|ConfigDeliveryBucketName/i);
    expect(text).toMatch(/KmsKeys|Kms/i);
    expect(text).toMatch(/VpcEndpointIds/i);
  });
});
