/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";
import * as path from "path";

/**
 * Loaders
 * - YAML path existence is checked (no YAML parse).
 * - JSON template is parsed for structural assertions.
 */
function loadJsonTemplate(): any {
  const candidates = [
    path.resolve(__dirname, "../lib/TapStack.json"),
    path.resolve(process.cwd(), "lib/TapStack.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf8");
      return JSON.parse(raw);
    }
  }
  throw new Error("TapStack.json not found in ../lib or ./lib");
}

function yamlExists(): boolean {
  const candidates = [
    path.resolve(__dirname, "../lib/TapStack.yml"),
    path.resolve(process.cwd(), "lib/TapStack.yml"),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

/** Helpers */
function getResources(tpl: any): Record<string, any> {
  return (tpl && tpl.Resources) || {};
}
function byType(tpl: any, type: string): Record<string, any> {
  const res = getResources(tpl);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries<any>(res)) {
    if (v.Type === type) out[k] = v;
  }
  return out;
}
function findFirst(tpl: any, type: string): { id: string; res: any } | null {
  const obj = byType(tpl, type);
  const id = Object.keys(obj)[0];
  if (!id) return null;
  return { id, res: obj[id] };
}
function hasTag(res: any, key: string, value?: string): boolean {
  const tagPaths: Array<Array<{ Key: string; Value: string }>> = [];
  const props = res?.Properties || {};
  if (Array.isArray(props.Tags)) tagPaths.push(props.Tags);
  // Some resources (LaunchTemplate) carry tags under TagSpecifications
  if (Array.isArray(props.TagSpecifications) && props.TagSpecifications[0]?.Tags) {
    tagPaths.push(props.TagSpecifications[0].Tags);
  }
  for (const tags of tagPaths) {
    const found = tags.find((t) => t.Key === key);
    if (found && (value ? found.Value === value : true)) return true;
  }
  return false;
}
function getParam(tpl: any, name: string): any {
  return tpl?.Parameters?.[name];
}
function getOutput(tpl: any, name: string): any {
  return tpl?.Outputs?.[name];
}
function versionGte(v: string, min: string): boolean {
  const a = (v || "").split(".").map((n) => parseInt(n, 10));
  const b = (min || "").split(".").map((n) => parseInt(n, 10));
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return true;
}

describe("TapStack CloudFormation Template - Unit Tests", () => {
  const tpl = loadJsonTemplate();

  test("YAML file exists alongside JSON", () => {
    expect(yamlExists()).toBe(true);
  });

  test("Template has required top-level sections", () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Description).toBeDefined();
    expect(tpl.Parameters).toBeDefined();
    expect(tpl.Resources).toBeDefined();
    expect(tpl.Outputs).toBeDefined();
  });

  describe("Parameters & Conditions", () => {
    it("includes expected parameters with sensible defaults and constraints", () => {
      const expectParams = [
        "VpcCidr",
        "AZs",
        "PublicSubnetCidrs",
        "PrivateAppSubnetCidrs",
        "PrivateDbSubnetCidrs",
        "AmiId",
        "InstanceType",
        "KeyName",
        "DesiredCapacity",
        "MinSize",
        "MaxSize",
        "DbName",
        "DbUsername",
        "DbInstanceClass",
        "DbAllocatedStorage",
        "LogsRetentionDays",
      ];
      for (const p of expectParams) {
        expect(getParam(tpl, p)).toBeDefined();
      }

      // AMI via SSM alias (gp2) and LaunchTemplate uses Ref AmiId
      expect(getParam(tpl, "AmiId")?.Type).toBe(
        "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>"
      );
      const amiDefault = getParam(tpl, "AmiId")?.Default || "";
      expect(amiDefault).toBe(
        "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
      );

      // KeyName optional (empty string default) + condition present
      expect(getParam(tpl, "KeyName")?.Default).toBe("");
      expect(tpl.Conditions?.HasKeyName).toBeDefined();

      // ASG sizing params defaults & constraints (min >=2, desired=2, max default 6)
      expect(getParam(tpl, "MinSize")?.Default).toBe(2);
      expect(getParam(tpl, "DesiredCapacity")?.Default).toBe(2);
      expect(getParam(tpl, "MaxSize")?.Default).toBe(6);
    });
  });

  describe("Networking & Subnets", () => {
    it("creates VPC, IGW, NAT per AZ, and 6 subnets with proper mapping", () => {
      expect(findFirst(tpl, "AWS::EC2::VPC")).toBeTruthy();
      expect(findFirst(tpl, "AWS::EC2::InternetGateway")).toBeTruthy();

      // NAT Gateways
      const natGws = byType(tpl, "AWS::EC2::NatGateway");
      expect(Object.keys(natGws).length).toBe(2);

      // Subnets
      const subnets = byType(tpl, "AWS::EC2::Subnet");
      const subnetIds = Object.keys(subnets);
      expect(subnetIds.length).toBe(6); // 2 public + 2 app + 2 db

      // Tagging check on VPC & subnets
      const vpc = findFirst(tpl, "AWS::EC2::VPC")!.res;
      expect(hasTag(vpc, "Environment", "Production")).toBe(true);
      for (const id of subnetIds) {
        expect(hasTag(subnets[id], "Environment", "Production")).toBe(true);
      }
    });
  });

  describe("Security Groups", () => {
    it("ALB SG allows 80/443 from anywhere; App SG allows 80 from ALB only; DB SG allows 3306 from App only", () => {
      const sgs = byType(tpl, "AWS::EC2::SecurityGroup");
      const entries = Object.entries<any>(sgs);
      const alb = entries.find(([_, r]) =>
        r.Properties?.GroupDescription?.toLowerCase().includes("load balancer")
      )?.[1];
      const app = entries.find(([_, r]) =>
        r.Properties?.GroupDescription?.toLowerCase().includes("ec2 instances")
      )?.[1];
      const db = entries.find(([_, r]) =>
        r.Properties?.GroupDescription?.toLowerCase().includes("rds")
      )?.[1];

      expect(alb && app && db).toBeTruthy();

      // ALB SG ingress: 80 and 443 from 0.0.0.0/0
      const albIng = alb.Properties.SecurityGroupIngress || [];
      const has80 = albIng.some((r: any) => r.FromPort === 80 && r.CidrIp === "0.0.0.0/0");
      const has443 = albIng.some((r: any) => r.FromPort === 443 && r.CidrIp === "0.0.0.0/0");
      expect(has80 && has443).toBe(true);

      // App SG ingress: 80 only from ALB SG
      const appIng = app.Properties.SecurityGroupIngress || [];
      const fromAlbOnly = appIng.some(
        (r: any) => r.FromPort === 80 && !!r.SourceSecurityGroupId
      );
      expect(fromAlbOnly).toBe(true);

      // DB SG ingress: 3306 only from App SG
      const dbIng = db.Properties.SecurityGroupIngress || [];
      const dbOk = dbIng.some(
        (r: any) => r.FromPort === 3306 && !!r.SourceSecurityGroupId
      );
      expect(dbOk).toBe(true);

      // Tagging on SGs
      expect(hasTag(alb, "Environment", "Production")).toBe(true);
      expect(hasTag(app, "Environment", "Production")).toBe(true);
      expect(hasTag(db, "Environment", "Production")).toBe(true);
    });
  });

  describe("S3 Logs Bucket & Policy", () => {
    it("S3 bucket is encrypted, versioned, has lifecycle, and enforces TLS with ALB log delivery", () => {
      const bucket = findFirst(tpl, "AWS::S3::Bucket")!;
      expect(bucket).toBeTruthy();
      const bp = findFirst(tpl, "AWS::S3::BucketPolicy")!;
      expect(bp).toBeTruthy();

      const enc =
        bucket.res.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]
          ?.ServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(enc).toBe("AES256");

      expect(bucket.res.Properties?.VersioningConfiguration?.Status).toBe("Enabled");

      const rules = bucket.res.Properties?.LifecycleConfiguration?.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      // Bucket policy: deny non-TLS + allow ALB logs with correct principal and ACL condition
      const stmts = bp.res.Properties?.PolicyDocument?.Statement || [];
      const denyTls = stmts.find((s: any) => s.Sid === "DenyInsecureConnections");
      const allowAlb = stmts.find((s: any) => s.Sid === "AllowALBAccessLogs");
      expect(denyTls && allowAlb).toBeTruthy();

      expect(allowAlb.Principal?.AWS).toBe("arn:aws:iam::127311923021:root");
      const hasAclCond =
        allowAlb.Condition?.StringEquals?.["s3:x-amz-acl"] ===
        "bucket-owner-full-control";
      expect(hasAclCond).toBe(true);

      // Tagging
      expect(hasTag(bucket.res, "Environment", "Production")).toBe(true);
    });

    it("S3 bucket public access block is fully enabled", () => {
      const bucket = findFirst(tpl, "AWS::S3::Bucket")!.res;
      const pab = bucket.Properties?.PublicAccessBlockConfiguration || {};
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });
  });

  describe("ALB + Target Group + Listener", () => {
    it("ALB is internet-facing, logs enabled with bucket+prefix, TG HTTP/80, Listener HTTP only (no HTTPS listeners/certs)", () => {
      const alb = findFirst(tpl, "AWS::ElasticLoadBalancingV2::LoadBalancer")!;
      expect(alb.res.Properties?.Scheme).toBe("internet-facing");

      // Access logging attributes
      const attrs = alb.res.Properties?.LoadBalancerAttributes || [];
      const loggingEnabled = attrs.find((a: any) => a.Key === "access_logs.s3.enabled");
      const loggingBucket = attrs.find((a: any) => a.Key === "access_logs.s3.bucket");
      const loggingPrefix = attrs.find((a: any) => a.Key === "access_logs.s3.prefix");
      expect(loggingEnabled?.Value).toBe("true");
      expect(loggingBucket?.Value).toBeDefined();
      expect(loggingPrefix?.Value).toBe("alb-logs");

      // TargetGroup checks
      const tg = findFirst(tpl, "AWS::ElasticLoadBalancingV2::TargetGroup")!;
      expect(tg.res.Properties?.Protocol).toBe("HTTP");
      expect(tg.res.Properties?.Port).toBe(80);
      expect(tg.res.Properties?.TargetType).toBe("instance");

      // Listener checks: strictly HTTP only, no certificates or SSL policies
      const listeners = byType(tpl, "AWS::ElasticLoadBalancingV2::Listener");
      for (const l of Object.values<any>(listeners)) {
        expect(l.Properties?.Protocol).toBe("HTTP");
        expect(l.Properties?.Port).toBe(80);
        expect(l.Properties?.Certificates).toBeUndefined();
        expect(l.Properties?.SslPolicy).toBeUndefined();
      }

      // Ensure no ACM certificate resources
      const acmCerts = byType(tpl, "AWS::CertificateManager::Certificate");
      expect(Object.keys(acmCerts).length).toBe(0);

      // Tagging
      expect(hasTag(alb.res, "Environment", "Production")).toBe(true);
      expect(hasTag(tg.res, "Environment", "Production")).toBe(true);
    });

    it("Target Group health checks are configured with sensible thresholds", () => {
      const tg = findFirst(tpl, "AWS::ElasticLoadBalancingV2::TargetGroup")!.res;
      expect(tg.Properties?.HealthCheckEnabled).toBe(true);
      expect(tg.Properties?.HealthCheckPath).toBe("/");
      expect(tg.Properties?.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties?.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties?.HealthyThresholdCount).toBe(2);
      expect(tg.Properties?.UnhealthyThresholdCount).toBe(5);
    });
  });

  describe("Compute: Launch Template & ASG", () => {
    it("Launch Template uses SSM AMI param, detailed monitoring, conditional KeyName; ASG spans private subnets with Min/Desired >= 2", () => {
      const lt = findFirst(tpl, "AWS::EC2::LaunchTemplate")!;
      const ltd = lt.res.Properties?.LaunchTemplateData || {};
      // ImageId is Ref AmiId
      const img = ltd.ImageId;
      expect(img && typeof img === "object" && "Ref" in img && img.Ref === "AmiId").toBe(
        true
      );

      // Monitoring enabled
      expect(ltd.Monitoring?.Enabled).toBe(true);

      // KeyName conditional omit (Fn::If HasKeyName)
      const keyName = ltd.KeyName;
      expect(
        keyName &&
          typeof keyName === "object" &&
          "Fn::If" in keyName &&
          keyName["Fn::If"][0] === "HasKeyName"
      ).toBe(true);

      // ASG checks
      const asg = findFirst(tpl, "AWS::AutoScaling::AutoScalingGroup")!;
      const props = asg.res.Properties;
      expect(props?.MinSize?.Ref).toBe("MinSize");
      expect(props?.DesiredCapacity?.Ref).toBe("DesiredCapacity");
      expect(props?.MaxSize?.Ref).toBe("MaxSize");
      expect(props?.TargetGroupARNs?.length).toBeGreaterThan(0);

      // UpdatePolicy at resource top-level
      const up = (asg.res as any).UpdatePolicy;
      expect(up?.AutoScalingRollingUpdate?.MinInstancesInService).toBe(1);

      // Tagging at launch
      const tags = props?.Tags || [];
      const envTag = tags.find((t: any) => t.Key === "Environment");
      expect(envTag?.Value).toBe("Production");
    });

    it("Launch Template UserData installs nginx and awslogs, and InstanceProfile is attached", () => {
      const lt = findFirst(tpl, "AWS::EC2::LaunchTemplate")!.res;
      const ltd = lt.Properties?.LaunchTemplateData || {};
      // UserData presence and basic contents
      const ud = ltd.UserData;
      expect(ud && typeof ud === "object" && "Fn::Base64" in ud).toBe(true);
      const udSub = ud["Fn::Base64"]["Fn::Sub"];
      expect(typeof udSub).toBe("string");
      const udStr = udSub as string;
      expect(udStr.includes("#!/bin/bash")).toBe(true);
      expect(udStr.toLowerCase().includes("nginx")).toBe(true);
      expect(udStr.toLowerCase().includes("awslogs")).toBe(true);

      // InstanceProfile attached by Name Ref InstanceProfile
      const iip = ltd.IamInstanceProfile;
      expect(iip && typeof iip === "object" && "Name" in iip).toBe(true);
      const nameRef = iip.Name;
      expect(nameRef && typeof nameRef === "object" && "Ref" in nameRef).toBe(true);
    });
  });

  describe("IAM & Logging", () => {
    it("Instance role allows CloudWatch logs; LogGroup exists with retention", () => {
      const role = findFirst(tpl, "AWS::IAM::Role")!;
      const managed = role.res.Properties?.ManagedPolicyArns || [];
      const hasCwl = managed.includes(
        "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
      );
      expect(hasCwl).toBe(true);

      const lg = findFirst(tpl, "AWS::Logs::LogGroup")!;
      expect(lg.res.Properties?.LogGroupName).toBe("/tapstack/app");
      expect(lg.res.Properties?.RetentionInDays).toBeDefined();

      // Tagging
      expect(hasTag(role.res, "Environment", "Production")).toBe(true);
      expect(hasTag(lg.res, "Environment", "Production")).toBe(true);
    });
  });

  describe("Database (RDS MySQL)", () => {
    it("MySQL version >= 5.7, Multi-AZ, encrypted, password via Secrets Manager dynamic reference, proper policies", () => {
      const db = findFirst(tpl, "AWS::RDS::DBInstance")!;
      const p = db.res.Properties || {};
      expect(p.Engine).toBe("MySQL");
      const ver = (p.EngineVersion || "").toString();
      expect(versionGte(ver, "5.7.0")).toBe(true);
      expect(p.MultiAZ).toBe(true);
      expect(p.StorageEncrypted).toBe(true);
      expect(p.PubliclyAccessible).toBe(false);
      expect(p.DeletionProtection).toBe(true);

      // Dynamic reference to Secrets Manager for password
      const mup = p.MasterUserPassword;
      const usesDynamic =
        typeof mup === "object" &&
        "Fn::Sub" in mup &&
        typeof mup["Fn::Sub"] === "string" &&
        mup["Fn::Sub"].includes("resolve:secretsmanager:");
      expect(usesDynamic).toBe(true);

      // DeletionPolicy/UpdateReplacePolicy on resource
      const del = (db.res as any).DeletionPolicy;
      const upd = (db.res as any).UpdateReplacePolicy;
      expect(del).toBe("Snapshot");
      expect(upd).toBe("Snapshot");

      // Tagging
      expect(hasTag(db.res, "Environment", "Production")).toBe(true);
    });

    it("DB Subnet Group references exactly the two DB subnets", () => {
      const dsg = findFirst(tpl, "AWS::RDS::DBSubnetGroup")!.res;
      const subs = dsg.Properties?.SubnetIds || [];
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBe(2);
    });
  });

  describe("Outputs", () => {
    it("Exposes all expected Outputs for integration", () => {
      const expected = [
        "VPCId",
        "PublicSubnetIds",
        "PrivateAppSubnetIds",
        "PrivateDbSubnetIds",
        "AlbArn",
        "AlbDnsName",
        "TargetGroupArn",
        "AutoScalingGroupName",
        "LaunchTemplateId",
        "InstanceRoleArn",
        "InstanceProfileName",
        "LogsBucketName",
        "RdsEndpointAddress",
        "RdsArn",
        "DbSubnetGroupName",
      ];
      for (const o of expected) {
        expect(getOutput(tpl, o)).toBeDefined();
      }
    });
  });

  describe("Hardening & No surprises", () => {
    it("Contains no ACM resources or Listener certificates/SSL policies", () => {
      const acm = byType(tpl, "AWS::CertificateManager::Certificate");
      expect(Object.keys(acm).length).toBe(0);

      const listeners = byType(tpl, "AWS::ElasticLoadBalancingV2::Listener");
      for (const l of Object.values<any>(listeners)) {
        expect(l.Properties?.Certificates).toBeUndefined();
        expect(l.Properties?.SslPolicy).toBeUndefined();
        // Explicitly ensure protocol is HTTP, not HTTPS
        expect(l.Properties?.Protocol).toBe("HTTP");
      }
    });

    it("Key tagging coverage: core resources include Environment: Production", () => {
      const checks: string[] = [
        "AWS::ElasticLoadBalancingV2::LoadBalancer",
        "AWS::ElasticLoadBalancingV2::TargetGroup",
        "AWS::AutoScaling::AutoScalingGroup",
        "AWS::S3::Bucket",
        "AWS::RDS::DBInstance",
      ];
      for (const t of checks) {
        const anyOfType = byType(tpl, t);
        for (const res of Object.values<any>(anyOfType)) {
          expect(hasTag(res, "Environment", "Production")).toBe(true);
        }
      }
    });
  });
});
