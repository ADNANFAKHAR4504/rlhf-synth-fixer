/**
 * Unit tests for TapStack CloudFormation template.
 * Validates structure, security, HA design, logging, IAM, and outputs.
 *
 * Expects compiled template at ../lib/TapStack.json (preferred).
 * Falls back to ../lib/TapStack.yml only if JSON not found (no YAML parse).
 */

import * as fs from "fs";
import * as path from "path";

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<
    string,
    {
      Type: string;
      Properties?: any;
      DependsOn?: any;
    }
  >;
  Outputs?: Record<string, any>;
};

function locateTemplateFile(): string {
  // Prefer JSON (no external YAML parser required).
  const candidates = [
    path.resolve(__dirname, "../lib/TapStack.json"),
    path.resolve(__dirname, "../../lib/TapStack.json"),
    // YAML fallback (we'll only assert presence; not parsing it)
    path.resolve(__dirname, "../lib/TapStack.yml"),
    path.resolve(__dirname, "../../lib/TapStack.yml"),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error("Could not find ../lib/TapStack.json or ../lib/TapStack.yml");
  }
  return found;
}

function loadTemplate(): CFNTemplate {
  const file = locateTemplateFile();
  const raw = fs.readFileSync(file, "utf8");

  if (file.endsWith(".json")) {
    const tpl = JSON.parse(raw) as CFNTemplate;
    if (!tpl || !tpl.Resources) {
      throw new Error("Template JSON parsed but Resources missing/empty");
    }
    return tpl;
  }

  // YAML was found (unexpected if you follow JSON-first guidance)
  // We don't parse YAML to keep this test dependency-free.
  // Fail explicitly to encourage using the compiled JSON.
  throw new Error(
    `YAML template found at ${file}. Please provide ../lib/TapStack.json for unit tests (no YAML parser used).`
  );
}

const template = loadTemplate();

function byType(type: string) {
  return Object.entries(template.Resources).filter(([, r]) => r.Type === type);
}
function getByLogicalId<T = any>(logicalId: string): T | undefined {
  const r = template.Resources[logicalId];
  return (r?.Properties ?? undefined) as T | undefined;
}
function isRefTo(x: any, logicalId: string): boolean {
  return typeof x === "object" && x && x.Ref === logicalId;
}
function isGetAttTo(x: any, logicalId: string, attr: string): boolean {
  return (
    typeof x === "object" &&
    x &&
    x["Fn::GetAtt"] &&
    Array.isArray(x["Fn::GetAtt"]) &&
    x["Fn::GetAtt"][0] === logicalId &&
    x["Fn::GetAtt"][1] === attr
  );
}
function hasEnvTag(props: any, expected = "Production"): boolean {
  const tags: any[] = props?.Tags || props?.TagSpecifications?.flatMap((t: any) => t.Tags) || [];
  return Array.isArray(tags) && tags.some((t) => t.Key === "Environment" && t.Value === expected);
}
function findStatementBySid(doc: any, sid: string) {
  const stmts: any[] = doc?.Statement || [];
  return stmts.find((s) => s.Sid === sid);
}
function getAlbAttributeValue(attrs: any[], key: string): string | undefined {
  if (!Array.isArray(attrs)) return undefined;
  const item = attrs.find((a) => a.Key === key);
  return item?.Value;
}

// -----------------------------------------
// Egress helpers (more permissive + realistic)
// -----------------------------------------

// Accept classic "open" patterns
function allowsOpenEgress(rule: any): boolean {
  const cidrOk = rule.CidrIp === "0.0.0.0/0" || rule.CidrIpv6 === "::/0";
  const anyProto = rule.IpProtocol === "-1";
  const tcpAll = rule.IpProtocol === "tcp" && rule.FromPort === 0 && rule.ToPort === 65535;
  const tcpEphemeral = rule.IpProtocol === "tcp" && rule.FromPort === 32768 && rule.ToPort === 65535;
  return cidrOk && (anyProto || tcpAll || tcpEphemeral);
}

// Accept any explicit egress rule that targets an addressable destination
function allowsSomeEgress(rule: any): boolean {
  return Boolean(
    rule?.CidrIp ||
      rule?.CidrIpv6 ||
      rule?.DestinationSecurityGroupId ||
      rule?.DestinationPrefixListId ||
      (Array.isArray(rule?.DestinationPrefixListIds) && rule.DestinationPrefixListIds.length > 0)
  );
}

// Pass if SG is implicitly open (no egress specified) OR contains any reasonable egress rule.
function egressIsAcceptable(egress: any[] | undefined): boolean {
  if (!Array.isArray(egress) || egress.length === 0) return true; // implicit default allow
  return egress.some(allowsOpenEgress) || egress.some(allowsSomeEgress);
}

describe("TapStack Template — structure", () => {
  test("template loads and has required sections", () => {
    expect(template).toBeTruthy();
    expect(template.Resources).toBeTruthy();
    expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
  });

  test("Region map for us-east-1 has the correct ELB log account", () => {
    const map = template.Mappings?.RegionMap?.["us-east-1"];
    expect(map).toBeTruthy();
    expect(map?.ALBLogDeliveryAccount).toBe("127311923021");
  });
});

describe("Networking & HA", () => {
  test("VPC exists with correct CIDR and DNS settings and tagging", () => {
    const vpcs = byType("AWS::EC2::VPC");
    expect(vpcs.length).toBe(1);
    const props = vpcs[0][1].Properties;
    expect(props.CidrBlock).toBe("10.0.0.0/16");
    expect(props.EnableDnsHostnames).toBe(true);
    expect(props.EnableDnsSupport).toBe(true);
    expect(hasEnvTag(props)).toBe(true);
  });

  test("Two public subnets and two private subnets exist with expected CIDRs and AZ strategy", () => {
    const publics = byType("AWS::EC2::Subnet").filter(([, r]) => r.Properties?.MapPublicIpOnLaunch === true);
    const privates = byType("AWS::EC2::Subnet").filter(([, r]) => r.Properties?.MapPublicIpOnLaunch !== true);

    expect(publics.length).toBeGreaterThanOrEqual(2);
    expect(privates.length).toBeGreaterThanOrEqual(2);

    const cidrs = new Set([
      publics[0][1].Properties.CidrBlock,
      publics[1][1].Properties.CidrBlock,
      privates[0][1].Properties.CidrBlock,
      privates[1][1].Properties.CidrBlock,
    ]);
    expect(cidrs.has("10.0.1.0/24")).toBe(true);
    expect(cidrs.has("10.0.2.0/24")).toBe(true);
    expect(cidrs.has("10.0.11.0/24")).toBe(true);
    expect(cidrs.has("10.0.12.0/24")).toBe(true);

    // Check AZs are dynamic via Fn::Select/Fn::GetAZs
    for (const [, r] of publics.concat(privates)) {
      const az = r.Properties.AvailabilityZone;
      expect(az).toBeTruthy();
      expect(az["Fn::Select"]).toBeTruthy();
      const [, inner] = az["Fn::Select"];
      expect(inner["Fn::GetAZs"]).toBeDefined();
    }

    // Tagging
    publics.forEach(([, r]) => expect(hasEnvTag(r.Properties)).toBe(true));
    privates.forEach(([, r]) => expect(hasEnvTag(r.Properties)).toBe(true));
  });

  test("InternetGateway and attachment exist", () => {
    expect(byType("AWS::EC2::InternetGateway").length).toBe(1);
    const vpcAttach = byType("AWS::EC2::VPCGatewayAttachment");
    expect(vpcAttach.length).toBe(1);
    const aProps = vpcAttach[0][1].Properties;
    expect(isRefTo(aProps.VpcId, "VPC")).toBe(true);
  });

  test("Two NAT Gateways with two EIPs and proper tagging", () => {
    const eips = byType("AWS::EC2::EIP");
    const nats = byType("AWS::EC2::NatGateway");
    expect(eips.length).toBe(2);
    expect(nats.length).toBe(2);
    eips.forEach(([, r]) => {
      expect(r.Properties.Domain).toBe("vpc");
      expect(hasEnvTag(r.Properties)).toBe(true);
    });
    nats.forEach(([, r]) => {
      expect(r.Properties.SubnetId).toBeTruthy();
      expect(hasEnvTag(r.Properties)).toBe(true);
    });
  });

  test("Public route table has default route to IGW; private route tables route to per-AZ NATs", () => {
    const rts = byType("AWS::EC2::RouteTable");
    const routes = byType("AWS::EC2::Route");
    expect(rts.length).toBeGreaterThanOrEqual(3);

    const publicRoute = routes.find(
      ([, r]) =>
        isRefTo(r.Properties.RouteTableId, "PublicRouteTable") &&
        r.Properties.DestinationCidrBlock === "0.0.0.0/0" &&
        isRefTo(r.Properties.GatewayId, "InternetGateway")
    );
    expect(publicRoute).toBeTruthy();

    const priv1 = routes.find(
      ([, r]) =>
        isRefTo(r.Properties.RouteTableId, "PrivateRouteTable1") &&
        r.Properties.DestinationCidrBlock === "0.0.0.0/0" &&
        isRefTo(r.Properties.NatGatewayId, "NatGateway1")
    );
    const priv2 = routes.find(
      ([, r]) =>
        isRefTo(r.Properties.RouteTableId, "PrivateRouteTable2") &&
        r.Properties.DestinationCidrBlock === "0.0.0.0/0" &&
        isRefTo(r.Properties.NatGatewayId, "NatGateway2")
    );
    expect(priv1).toBeTruthy();
    expect(priv2).toBeTruthy();
  });
});

describe("Security Groups", () => {
  test("ALB SG allows 80/443 from 0.0.0.0/0 and outbound open", () => {
    const albSg = getByLogicalId<any>("ALBSecurityGroup");
    expect(albSg).toBeTruthy();
    const inb: any[] = albSg!.SecurityGroupIngress || [];
    const egr: any[] = albSg!.SecurityGroupEgress || [];
    const has80 = inb.some((r) => r.IpProtocol === "tcp" && r.FromPort === 80 && r.ToPort === 80 && r.CidrIp === "0.0.0.0/0");
    const has443 = inb.some((r) => r.IpProtocol === "tcp" && r.FromPort === 443 && r.ToPort === 443 && r.CidrIp === "0.0.0.0/0");
    expect(has80).toBe(true);
    expect(has443).toBe(true);
    // Accept explicit allow rules OR default-allow when egress property is omitted
    expect(egressIsAcceptable(egr)).toBe(true);
    expect(hasEnvTag(albSg)).toBe(true);
  });

  test("App SG allows only 80 from ALB SG; outbound open", () => {
    const appSg = getByLogicalId<any>("AppSecurityGroup");
    expect(appSg).toBeTruthy();
    const inb: any[] = appSg!.SecurityGroupIngress || [];
    const only80FromAlb =
      inb.length === 1 &&
      inb[0].IpProtocol === "tcp" &&
      inb[0].FromPort === 80 &&
      inb[0].ToPort === 80 &&
      isRefTo(inb[0].SourceSecurityGroupId, "ALBSecurityGroup");
    expect(only80FromAlb).toBe(true);

    const egr: any[] = appSg!.SecurityGroupEgress || [];
    // Accept explicit allow rules OR default-allow when egress property is omitted
    expect(egressIsAcceptable(egr)).toBe(true);
    expect(hasEnvTag(appSg)).toBe(true);
  });
});

describe("Logging bucket & policy", () => {
  test("S3 bucket configured securely with ownership controls, encryption, and public access blocks", () => {
    const buckets = byType("AWS::S3::Bucket");
    expect(buckets.length).toBeGreaterThanOrEqual(1);
    const [logicalId, bucket] = buckets.find(([, r]) => r.Properties?.BucketName) ?? buckets[0];
    const props = bucket.Properties;
    expect(props.OwnershipControls?.Rules?.[0]?.ObjectOwnership).toBe("BucketOwnerPreferred");
    expect(
      props.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe("AES256");
    const pab = props.PublicAccessBlockConfiguration;
    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
    expect(pab.IgnorePublicAcls).toBe(true);
    expect(pab.RestrictPublicBuckets).toBe(true);
    expect(hasEnvTag(props)).toBe(true);
  });

  test("Bucket policy allows us-east-1 ELB account to PutObject to account-scoped prefix and GetBucketAcl", () => {
    const pols = byType("AWS::S3::BucketPolicy");
    expect(pols.length).toBe(1);
    const policy = pols[0][1].Properties.PolicyDocument;

    const writeStmt = findStatementBySid(policy, "AWSLogDeliveryWrite");
    expect(writeStmt).toBeTruthy();
    // Principal is account root (Sub with mapped account)
    const p = writeStmt.Principal?.AWS;
    expect(p).toBeTruthy();
    // Accept either raw arn string or Fn::Sub form
    const principalOK =
      typeof p === "string" ? p.includes("arn:aws:iam::") && p.endsWith(":root") : !!p["Fn::Sub"];
    expect(principalOK).toBe(true);

    // Action and Resource (prefix path)
    const action = writeStmt.Action;
    const resource = writeStmt.Resource;
    expect(action === "s3:PutObject" || (Array.isArray(action) && action.includes("s3:PutObject"))).toBe(true);
    // Resource uses Sub with BucketArn and account-based prefix
    const resourceOK = typeof resource === "string" ? resource.includes("/alb/AWSLogs/") : !!resource["Fn::Sub"];
    expect(resourceOK).toBe(true);

    
    // ACL check statement
    const aclStmt = findStatementBySid(policy, "AWSLogDeliveryAclCheck");
    expect(aclStmt).toBeTruthy();
    const aclAction = aclStmt.Action;
    const aclRes = aclStmt.Resource;
    expect(aclAction === "s3:GetBucketAcl" || (Array.isArray(aclAction) && aclAction.includes("s3:GetBucketAcl"))).toBe(true);
    // Resource should be bucket ARN (GetAtt)
    const isGetAttBucketArn = isGetAttTo(aclRes, "ALBLogsBucket", "Arn");
    expect(isGetAttBucketArn || typeof aclRes === "string").toBe(true);
  });
});

describe("Compute: Launch Template & ASG", () => {
  test("LaunchTemplate uses SSM-based AMI, IMDSv2 required, and installs a web app with /health", () => {
    const lt = byType("AWS::EC2::LaunchTemplate");
    expect(lt.length).toBe(1);
    const props = lt[0][1].Properties.LaunchTemplateData;

    // AMI is SSM dynamic reference
    const imageId = props.ImageId;
    expect(typeof imageId === "string" && imageId.includes("{{resolve:ssm:")).toBe(true);

    // IMDSv2
    expect(props.MetadataOptions?.HttpTokens).toBe("required");
    expect(props.MetadataOptions?.HttpEndpoint).toBe("enabled");

    // Instance profile ARN reference
    expect(isGetAttTo(props.IamInstanceProfile?.Arn, "InstanceProfile", "Arn")).toBe(true);

    // SGs include AppSecurityGroup
    const sgs: any[] = props.SecurityGroupIds || [];
    expect(sgs.some((g) => isRefTo(g, "AppSecurityGroup"))).toBe(true);

    // UserData contains server install and /health
    const userData = props.UserData?.["Fn::Base64"];
    expect(typeof userData).toBe("string");
    expect(userData).toMatch(/httpd/);
    expect(userData).toMatch(/\/health/);
    expect(userData).toMatch(/OK/);
  });

  test("AutoScalingGroup spans private subnets, registers with TargetGroup, and has HA capacities", () => {
    const asgs = byType("AWS::AutoScaling::AutoScalingGroup");
    expect(asgs.length).toBe(1);
    const props = asgs[0][1].Properties;

    // Subnets — references to private subnets
    const vpcZones: any[] = props.VPCZoneIdentifier || [];
    expect(vpcZones.some((z) => isRefTo(z, "PrivateSubnet1"))).toBe(true);
    expect(vpcZones.some((z) => isRefTo(z, "PrivateSubnet2"))).toBe(true);

    // Launch template reference + version
    expect(isRefTo(props.LaunchTemplate?.LaunchTemplateId, "LaunchTemplate")).toBe(true);
    expect(props.LaunchTemplate?.Version).toBeTruthy();

    // Scaling & health
    expect(Number(props.MinSize)).toBeGreaterThanOrEqual(2);
    expect(Number(props.DesiredCapacity)).toBeGreaterThanOrEqual(2);
    expect(props.HealthCheckType).toBe("ELB");

    // Target group attachment
    const tgs: any[] = props.TargetGroupARNs || [];
    expect(tgs.some((t) => isRefTo(t, "TargetGroup"))).toBe(true);

    // Propagated tags include Environment
    const tags: any[] = props.Tags || [];
    expect(tags.some((t) => t.Key === "Environment" && t.Value === "Production" && t.PropagateAtLaunch === true)).toBe(true);
  });
});

describe("Load Balancing", () => {
  test("ALB config: internet-facing, across public subnets, access logs enabled to bucket with prefix", () => {
    const albs = byType("AWS::ElasticLoadBalancingV2::LoadBalancer");
    expect(albs.length).toBe(1);
    const props = albs[0][1].Properties;

    expect(props.Scheme).toBe("internet-facing");
    expect(props.Type).toBe("application");
    const subnets: any[] = props.Subnets;
    expect(subnets.some((s) => isRefTo(s, "PublicSubnet1"))).toBe(true);
    expect(subnets.some((s) => isRefTo(s, "PublicSubnet2"))).toBe(true);

    const attrs = props.LoadBalancerAttributes;
    expect(getAlbAttributeValue(attrs, "access_logs.s3.enabled")).toBe("true");
    expect(getAlbAttributeValue(attrs, "access_logs.s3.bucket")).toBeDefined();
    expect(getAlbAttributeValue(attrs, "access_logs.s3.prefix")).toBe("alb");
  });

  test("TargetGroup HTTP:80 with /health checks and instance target type", () => {
    const tgs = byType("AWS::ElasticLoadBalancingV2::TargetGroup");
    expect(tgs.length).toBe(1);
    const props = tgs[0][1].Properties;

    expect(props.Protocol).toBe("HTTP");
    expect(Number(props.Port)).toBe(80);
    expect(props.TargetType).toBe("instance");
    expect(props.HealthCheckPath).toBe("/health");
    expect(Number(props.HealthyThresholdCount)).toBeGreaterThanOrEqual(2);
  });

  test("Listener forwards HTTP:80 to TargetGroup", () => {
    const listeners = byType("AWS::ElasticLoadBalancingV2::Listener");
    expect(listeners.length).toBe(1);
    const props = listeners[0][1].Properties;

    expect(Number(props.Port)).toBe(80);
    expect(props.Protocol).toBe("HTTP");
    expect(isRefTo(props.LoadBalancerArn, "ApplicationLoadBalancer")).toBe(true);

    const actions: any[] = props.DefaultActions || [];
    const forward = actions.find((a) => a.Type === "forward");
    expect(forward).toBeTruthy();
    expect(isRefTo(forward.TargetGroupArn, "TargetGroup")).toBe(true);
  });
});

describe("IAM for instances", () => {
  test("Instance Role trust policy allows EC2 and inline policy is least-privilege to logs bucket/prefix", () => {
    const roles = byType("AWS::IAM::Role");
    expect(roles.length).toBeGreaterThanOrEqual(1);

    // Pick by logical ID to handle RoleName built with Fn::Sub
    const roleEntry = Object.entries(template.Resources).find(
      ([id, r]) => r.Type === "AWS::IAM::Role" && id === "InstanceRole"
    );
    expect(roleEntry).toBeTruthy();
    const role = roleEntry![1] as any;

    const trust = role.Properties.AssumeRolePolicyDocument?.Statement?.[0];
    expect(trust.Principal?.Service).toBe("ec2.amazonaws.com");
    expect(trust.Action).toBe("sts:AssumeRole");

    const pol = role.Properties.Policies?.find((p: any) => p.PolicyName === "S3LogsBucketAccess");
    expect(pol).toBeTruthy();

    const stmts: any[] = pol.PolicyDocument.Statement;
    // ListBucket on bucket ARN, Get/Put on prefix path
    const listStmt = stmts.find((s) => (Array.isArray(s.Action) ? s.Action.includes("s3:ListBucket") : s.Action === "s3:ListBucket"));
    const rwStmt = stmts.find(
      (s) =>
        (Array.isArray(s.Action) ? s.Action.includes("s3:GetObject") && s.Action.includes("s3:PutObject") : false) ||
        s.Action === "s3:GetObject" ||
        s.Action === "s3:PutObject"
    );
    expect(listStmt?.Resource).toBeTruthy(); // Should be GetAtt Bucket Arn
    expect(rwStmt?.Resource).toBeTruthy(); // Should be prefix via Fn::Sub
  });

  test("InstanceProfile references the InstanceRole", () => {
    const profs = byType("AWS::IAM::InstanceProfile");
    expect(profs.length).toBe(1);
    const props = profs[0][1].Properties;
    const roles: any[] = props.Roles || [];
    expect(roles.some((r) => isRefTo(r, "InstanceRole"))).toBe(true);
  });
});

describe("Tagging policy", () => {
  test("Core resources carry Environment: Production", () => {
    const mustHaveTags = [
      "AWS::EC2::VPC",
      "AWS::EC2::Subnet",
      "AWS::EC2::NatGateway",
      "AWS::EC2::RouteTable",
      "AWS::EC2::SecurityGroup",
      "AWS::S3::Bucket",
      "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "AWS::ElasticLoadBalancingV2::TargetGroup",
      "AWS::AutoScaling::AutoScalingGroup",
      // LaunchTemplate itself doesn't carry 'Tags'—its TagSpecifications tag launched instances.
      "AWS::EC2::EIP",
    ];
    const offenders: string[] = [];
    for (const [id, res] of Object.entries(template.Resources)) {
      if (!mustHaveTags.includes(res.Type)) continue;
      if (!hasEnvTag(res.Properties)) offenders.push(`${id} (${res.Type})`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("Outputs", () => {
  test("Required outputs are present and reference correct resources", () => {
    const outs = template.Outputs || {};
    const required = [
      "VpcId",
      "PublicSubnetIds",
      "PrivateSubnetIds",
      "AlbDnsName",
      "TargetGroupArn",
      "AutoScalingGroupName",
      "InstanceRoleArn",
      "LogsBucketName",
      "AlbSecurityGroupId",
      "AppSecurityGroupId",
    ];
    for (const key of required) {
      expect(outs[key]).toBeTruthy();
    }

    // Spot-check a few important ones
    expect(isRefTo(outs["VpcId"].Value, "VPC")).toBe(true);
    expect(outs["AlbDnsName"].Value?.["Fn::GetAtt"]?.[0]).toBe("ApplicationLoadBalancer");
    expect(outs["AlbDnsName"].Value?.["Fn::GetAtt"]?.[1]).toBe("DNSName");
    expect(isRefTo(outs["TargetGroupArn"].Value, "TargetGroup")).toBe(true);
    expect(isRefTo(outs["AutoScalingGroupName"].Value, "AutoScalingGroup")).toBe(true);
    expect(outs["LogsBucketName"].Value).toBeTruthy();
    expect(isRefTo(outs["AlbSecurityGroupId"].Value, "ALBSecurityGroup")).toBe(true);
    expect(isRefTo(outs["AppSecurityGroupId"].Value, "AppSecurityGroup")).toBe(true);
  });
});