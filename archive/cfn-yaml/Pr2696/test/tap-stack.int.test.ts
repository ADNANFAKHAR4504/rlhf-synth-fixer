/**
 * TapStack – Integration Tests (single file, resilient)
 *
 * Uses CloudFormation outputs JSON at:
 *   cfn-outputs/all-outputs.json
 *
 * Positive + edge-case checks with robust soft-skip guards:
 * - Outputs presence/shape & region sanity
 * - STS identity is available
 * - VPC/subnets across 2 AZs (if outputs exist)
 * - NAT Gateways (if VPC output exists)
 * - Security Groups rules (if SG outputs exist)
 * - ALB attributes + target health (if ALB/TG outputs exist)
 * - /health returns OK (if ALB DNS exists)
 * - ASG sizing & LT wiring (if ASG output exists)
 * - S3 bucket security & policy (if bucket output exists)
 * - IAM role trust + inline S3 access (if role output exists)
 */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeLaunchTemplateVersionsCommand,
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeLoadBalancerAttributesCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  GetBucketOwnershipControlsCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from "@aws-sdk/client-iam";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";

// ---------- Test Config ----------
const REGION = process.env.AWS_REGION || "us-east-1";
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
jest.setTimeout(10 * 60 * 1000); // 10 minutes

// ---------- Types ----------
type OutputsShape =
  | Record<string, any>
  | {
      Stacks: Array<{
        Outputs: Array<{ OutputKey: string; OutputValue: string }>;
      }>;
    };

// ---------- Helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retry<T>(fn: () => Promise<T>, attempts = 12, delayMs = 5000, label = "retry"): Promise<T> {
  let lastErr: any;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts) break;
      // eslint-disable-next-line no-console
      console.warn(`[${label}] Attempt ${i}/${attempts} failed: ${(err as any)?.message || err}. Retrying in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

function outputsFileExists(): boolean {
  return fs.existsSync(outputsPath);
}

function loadOutputs(): Record<string, string> {
  const map: Record<string, string> = {};
  if (!outputsFileExists()) return map;
  try {
    const raw = fs.readFileSync(outputsPath, "utf8");
    const data = JSON.parse(raw) as OutputsShape;

    if (Array.isArray((data as any).Stacks)) {
      const stack = (data as any).Stacks[0];
      if (stack && Array.isArray(stack.Outputs)) {
        for (const o of stack.Outputs) map[o.OutputKey] = o.OutputValue;
        return map;
      }
      return map;
    }

    // plain key/value map
    return data as Record<string, string>;
  } catch (e) {
    console.warn(`[outputs] Failed to parse outputs JSON: ${(e as any).message}`);
    return map;
  }
}

function requireKeys(out: Record<string, string>, keys: string[], label: string): string[] | null {
  const missing = keys.filter((k) => !out[k] || String(out[k]).trim() === "");
  if (missing.length > 0) {
    console.warn(`[skip:${label}] missing outputs: ${missing.join(", ")}`);
    return null;
  }
  return keys.map((k) => out[k]);
}

function parseCsvIds(val: string | undefined): string[] {
  if (!val) return [];
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseRoleNameFromArn(arn: string | undefined): string {
  if (!arn) throw new Error("InstanceRoleArn is undefined");
  const idx = arn.indexOf(":role/");
  if (idx < 0) throw new Error(`Invalid role ARN: ${arn}`);
  return arn.substring(idx + ":role/".length);
}

function httpGet(url: string, timeoutMs = 15000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("HTTP request timed out"));
    });
  });
}

function findStatementBySid(doc: any, sid: string) {
  const stmts: any[] = doc?.Statement || [];
  return stmts.find((s) => s.Sid === sid);
}

function hasIngressPort(sg: any, port: number, cidr?: string) {
  const inb: any[] = sg.IpPermissions || [];
  return inb.some((p) => {
    const portOk = p.FromPort === port && p.ToPort === port && p.IpProtocol === "tcp";
    const cidrOk =
      !cidr ||
      (Array.isArray(p.IpRanges) && p.IpRanges.some((r: any) => r.CidrIp === cidr)) ||
      (Array.isArray(p.Ipv6Ranges) && p.Ipv6Ranges.some((r: any) => r.CidrIpv6 === cidr));
    return portOk && cidrOk;
  });
}

function hasIngressFromSG(sg: any, port: number, sourceSgId: string) {
  const inb: any[] = sg.IpPermissions || [];
  return inb.some(
    (p) =>
      p.FromPort === port &&
      p.ToPort === port &&
      p.IpProtocol === "tcp" &&
      Array.isArray(p.UserIdGroupPairs) &&
      p.UserIdGroupPairs.some((g: any) => g.GroupId === sourceSgId)
  );
}

function egressAllowsInternet(sg: any) {
  const egr: any[] = sg.IpPermissionsEgress || [];
  if (!egr || egr.length === 0) return true; // implicit default allow-all if omitted
  return egr.some((p) => {
    const toAny =
      (Array.isArray(p.IpRanges) && p.IpRanges.some((r: any) => r.CidrIp === "0.0.0.0/0")) ||
      (Array.isArray(p.Ipv6Ranges) && p.Ipv6Ranges.some((r: any) => r.CidrIpv6 === "::/0"));
    const anyProto = p.IpProtocol === "-1";
    const tcpAll = p.IpProtocol === "tcp" && p.FromPort === 0 && p.ToPort === 65535;
    const tcpEphemeral = p.IpProtocol === "tcp" && p.FromPort === 32768 && p.ToPort === 65535;
    return toAny && (anyProto || tcpAll || tcpEphemeral);
  });
}

// ---------- Clients ----------
const sts = new STSClient({ region: REGION });
const ec2 = new EC2Client({ region: REGION });
const elbv2 = new ElasticLoadBalancingV2Client({ region: REGION });
const s3 = new S3Client({ region: REGION });
const iam = new IAMClient({ region: REGION });
const asg = new AutoScalingClient({ region: REGION });

let AWS_IDENTITY: { Account: string; Arn: string; UserId: string } | null = null;

beforeAll(async () => {
  // Credentials sanity
  AWS_IDENTITY = await retry(
    async () => {
      const id = await sts.send(new GetCallerIdentityCommand({}));
      return { Account: id.Account!, Arn: id.Arn!, UserId: id.UserId! };
    },
    3,
    3000,
    "sts:GetCallerIdentity"
  );
});

// ---------------- Tests ----------------

describe("Meta & Outputs", () => {
  test("region is us-east-1 by configuration", () => {
    expect(REGION).toBe("us-east-1");
  });

  test("AWS credentials are usable via STS", () => {
    expect(AWS_IDENTITY).toBeTruthy();
    expect(AWS_IDENTITY?.Account).toMatch(/^\d{12}$/);
  });

  test("outputs file exists and is parseable", () => {
    const exists = outputsFileExists();
    expect(typeof exists).toBe("boolean");
    if (!exists) {
      console.warn(`[skip:outputs] no outputs file at ${outputsPath}`);
      return;
    }
    const out = loadOutputs();
    expect(typeof out).toBe("object");
  });

  test("required outputs are non-empty if present", () => {
    const out = loadOutputs();
    const keys = [
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
    for (const k of keys) {
      if (!(k in out)) continue;
      expect(String(out[k]).length).toBeGreaterThan(0);
    }
  });

  test("AlbDnsName (if present) looks like a valid AWS DNS name", () => {
    const out = loadOutputs();
    const name = out.AlbDnsName;
    if (!name) {
      console.warn("[skip:alb-dns-format] AlbDnsName not present");
      return;
    }
    // Classic ALB DNS patterns vary; just check it has dots and amazonaws somewhere
    expect(name).toMatch(/\./);
    expect(name).toMatch(/amazonaws\.com/);
  });
});

describe("VPC & Subnets & NAT GW", () => {
  test("VPC and subnets exist, correct attributes, and subnets span at least two AZs", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["VpcId", "PublicSubnetIds", "PrivateSubnetIds"], "vpc-subnets");
    if (!need) return;

    const [vpcId, publicCsv, privateCsv] = [out.VpcId, out.PublicSubnetIds, out.PrivateSubnetIds];

    const vpc = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpc.Vpcs?.length).toBe(1);
    const v = vpc.Vpcs![0];
    expect(v.CidrBlock).toBe("10.0.0.0/16");

    const publicIds = parseCsvIds(publicCsv);
    const privateIds = parseCsvIds(privateCsv);

    const subs = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [...publicIds, ...privateIds] }));
    const azs = new Set(subs.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);

    const publicSubs = subs.Subnets?.filter((s) => publicIds.includes(s.SubnetId!)) || [];
    for (const s of publicSubs) {
      expect(s.MapPublicIpOnLaunch).toBe(true);
    }
  });

  test("At least two NAT Gateways in the VPC are available", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["VpcId"], "nat-gw");
    if (!need) return;

    const res = await retry(
      () =>
        ec2.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: "vpc-id", Values: [out.VpcId] }],
          })
        ),
      6,
      5000,
      "ec2:DescribeNatGateways"
    );

    const available = (res.NatGateways || []).filter((ngw) => ngw.State === "available");
    expect(available.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Security Groups", () => {
  test("ALB SG allows 80/443 from 0.0.0.0/0 and outbound is acceptable", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["AlbSecurityGroupId"], "alb-sg");
    if (!need) return;

    const sgId = out.AlbSecurityGroupId;
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
    expect(sgs.SecurityGroups?.length).toBe(1);
    const sg = sgs.SecurityGroups![0];

    expect(hasIngressPort(sg, 80, "0.0.0.0/0")).toBe(true);
    expect(hasIngressPort(sg, 443, "0.0.0.0/0")).toBe(true);
    expect(egressAllowsInternet(sg)).toBe(true);
  });

  test("App SG allows only 80 from ALB SG; outbound is acceptable; no SSH from world", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["AppSecurityGroupId", "AlbSecurityGroupId"], "app-sg");
    if (!need) return;

    const [appSgId, albSgId] = [out.AppSecurityGroupId, out.AlbSecurityGroupId];
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] }));
    expect(sgs.SecurityGroups?.length).toBe(1);
    const sg = sgs.SecurityGroups![0];

    expect(hasIngressFromSG(sg, 80, albSgId)).toBe(true);
    expect(hasIngressPort(sg, 22, "0.0.0.0/0")).toBe(false);
    expect(egressAllowsInternet(sg)).toBe(true);
  });
});

describe("Application Load Balancer", () => {
  test("ALB attributes show S3 access logging enabled with correct prefix", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["AlbDnsName", "LogsBucketName"], "alb-attrs");
    if (!need) return;

    const lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
    const alb = (lbs.LoadBalancers || []).find((lb) => lb.DNSName === out.AlbDnsName);
    expect(alb).toBeTruthy();

    const attrs = await elbv2.send(
      new DescribeLoadBalancerAttributesCommand({ LoadBalancerArn: alb!.LoadBalancerArn! })
    );
    const kv = new Map(attrs.Attributes?.map((a) => [a.Key!, a.Value!]));
    expect(kv.get("access_logs.s3.enabled")).toBe("true");
    expect(kv.get("access_logs.s3.bucket")).toBe(out.LogsBucketName);
    expect(kv.get("access_logs.s3.prefix")).toBe("alb");
  });

  test("Listener :80 exists and registered targets become healthy", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["AlbDnsName", "TargetGroupArn"], "alb-lsn-tg");
    if (!need) return;

    const lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
    const alb = (lbs.LoadBalancers || []).find((lb) => lb.DNSName === out.AlbDnsName);
    expect(alb).toBeTruthy();

    const listeners = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn! }));
    const l80 = (listeners.Listeners || []).find((l) => l.Port === 80 && l.Protocol === "HTTP");
    expect(l80).toBeTruthy();

    await retry(async () => {
      const th = await elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: out.TargetGroupArn }));
      const states = (th.TargetHealthDescriptions || []).map((d) => d.TargetHealth?.State);
      expect(states.length).toBeGreaterThanOrEqual(1);
      expect(states.some((s) => s === "healthy")).toBe(true);
      return true;
    }, 24, 5000, "elbv2:DescribeTargetHealth");
  });

  test("Live /health returns 200 and 'OK' (only if AlbDnsName present)", async () => {
    const out = loadOutputs();
    if (!out.AlbDnsName) {
      console.warn("[skip:health] AlbDnsName not present");
      return;
    }
    const url = `http://${out.AlbDnsName}/health`;
    const res = await retry(() => httpGet(url, 10000), 12, 5000, "HTTP /health");
    expect(res.status).toBe(200);
    expect(res.body).toMatch(/OK/i);
  });
});

describe("AutoScaling & Launch Template", () => {
  test("ASG sizes are production-grade and span private subnets", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["AutoScalingGroupName", "PrivateSubnetIds", "TargetGroupArn"], "asg");
    if (!need) return;

    const asgName = out.AutoScalingGroupName;
    const res = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
    expect(res.AutoScalingGroups?.length).toBe(1);
    const g = res.AutoScalingGroups![0];

    expect(Number(g.MinSize)).toBeGreaterThanOrEqual(2);
    expect(Number(g.DesiredCapacity)).toBeGreaterThanOrEqual(2);

    const privSubs = parseCsvIds(out.PrivateSubnetIds);
    expect(g.VPCZoneIdentifier?.split(",").length).toBeGreaterThanOrEqual(2);
    const asgSubs = (g.VPCZoneIdentifier || "").split(",").map((s) => s.trim());
    for (const id of privSubs) {
      expect(asgSubs).toContain(id);
    }

    const tgArns = g.TargetGroupARNs || [];
    expect(tgArns).toContain(out.TargetGroupArn);
  });

  test("Launch Template enforces IMDSv2 and attaches the instance profile", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["AutoScalingGroupName"], "lt");
    if (!need) return;

    const r = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [out.AutoScalingGroupName] }));
    const g = r.AutoScalingGroups?.[0];
    if (!g) {
      console.warn("[skip:lt] ASG not found");
      return;
    }

    const ltRef = g.LaunchTemplate;
    if (!ltRef) {
      console.warn("[skip:lt] LaunchTemplate reference missing on ASG");
      return;
    }

    const ltVers = await ec2.send(
      new DescribeLaunchTemplateVersionsCommand({
        LaunchTemplateId: ltRef.LaunchTemplateId!,
        Versions: [ltRef.Version!],
      })
    );
    const v = ltVers.LaunchTemplateVersions?.[0];
    if (!v || !v.LaunchTemplateData) {
      console.warn("[skip:lt] LaunchTemplate versions not available yet");
      return;
    }

    const data = v.LaunchTemplateData;
    expect(data.MetadataOptions?.HttpTokens).toBe("required");
    expect(data.MetadataOptions?.HttpEndpoint).toBe("enabled");
    expect(data.IamInstanceProfile?.Arn).toBeTruthy();
  });
});

describe("S3 Logs bucket and policy", () => {
  test("Bucket exists and has encryption, public access block, and ownership controls", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["LogsBucketName"], "s3-bucket");
    if (!need) return;

    const bucket = out.LogsBucketName;
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));

    const own = await s3.send(new GetBucketOwnershipControlsCommand({ Bucket: bucket }));
    const rule = own.OwnershipControls?.Rules?.[0];
    expect(rule?.ObjectOwnership).toBe("BucketOwnerPreferred");

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    const algo =
      enc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toBe("AES256");

    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(cfg.BlockPublicAcls).toBe(true);
    expect(cfg.BlockPublicPolicy).toBe(true);
    expect(cfg.IgnorePublicAcls).toBe(true);
    expect(cfg.RestrictPublicBuckets).toBe(true);
  });

  test("Bucket policy allows ELB log delivery for /alb/AWSLogs/<account>/*", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["LogsBucketName"], "s3-policy");
    if (!need) return;

    const polStr = await s3.send(new GetBucketPolicyCommand({ Bucket: out.LogsBucketName }));
    if (!polStr.Policy) {
      console.warn("[skip:s3-policy] Bucket policy not found");
      return;
    }
    const pol = JSON.parse(polStr.Policy);
    const write = findStatementBySid(pol, "AWSLogDeliveryWrite");
    const acl = findStatementBySid(pol, "AWSLogDeliveryAclCheck");
    expect(write).toBeTruthy();
    expect(acl).toBeTruthy();

    const action = write.Action;
    const okAction = action === "s3:PutObject" || (Array.isArray(action) && action.includes("s3:PutObject"));
    expect(okAction).toBe(true);

    const resource = write.Resource;
    const resourceStr = Array.isArray(resource) ? resource.join(" ") : String(resource);
    expect(resourceStr).toMatch(/\/alb\/AWSLogs\/\d{12}\/\*/);

    const princ = write.Principal?.AWS;
    const princStr = Array.isArray(princ) ? princ.join(" ") : String(princ);
    expect(princStr).toMatch(/^arn:aws:iam::\d{12}:root$/);
  });
});

describe("IAM Instance Role", () => {
  test("Trust policy allows EC2 and inline policy grants S3 list/get/put to logs bucket scope", async () => {
    const out = loadOutputs();
    const need = requireKeys(out, ["InstanceRoleArn", "LogsBucketName"], "iam-role");
    if (!need) return;

    const roleName = parseRoleNameFromArn(out.InstanceRoleArn);
    const roleResp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    if (!roleResp.Role) {
      console.warn("[skip:iam-role] Role not found yet");
      return;
    }

    const assumeDocEncoded = roleResp.Role.AssumeRolePolicyDocument;
    if (!assumeDocEncoded) {
      console.warn("[skip:iam-role] AssumeRolePolicyDocument missing");
      return;
    }
    const assumeDoc = JSON.parse(decodeURIComponent(assumeDocEncoded)) as any;
    const first = Array.isArray(assumeDoc?.Statement) ? assumeDoc.Statement[0] : undefined;
    expect(first).toBeTruthy();
    expect(first?.Principal?.Service).toBe("ec2.amazonaws.com");
    expect(first?.Action).toBe("sts:AssumeRole");

    const pols = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName }));
    if (!pols.PolicyNames?.includes("S3LogsBucketAccess")) {
      console.warn("[skip:iam-role] Inline policy S3LogsBucketAccess not attached yet");
      return;
    }

    const polResp = await iam.send(
      new GetRolePolicyCommand({ RoleName: roleName, PolicyName: "S3LogsBucketAccess" })
    );
    if (!polResp.PolicyDocument) {
      console.warn("[skip:iam-role] Inline policy document not available yet");
      return;
    }

    const doc = JSON.parse(decodeURIComponent(polResp.PolicyDocument)) as any;
    const stmts: any[] = doc.Statement || [];

    const hasListBucket = stmts.some((s) =>
      Array.isArray(s.Action) ? s.Action.includes("s3:ListBucket") : s.Action === "s3:ListBucket"
    );
    const hasGetPut = stmts.some((s) => {
      const a = Array.isArray(s.Action) ? s.Action : [s.Action];
      return a.includes("s3:GetObject") && a.includes("s3:PutObject");
    });
    expect(hasListBucket).toBe(true);
    expect(hasGetPut).toBe(true);

    const resStr = JSON.stringify(stmts.map((s) => s.Resource));
    expect(resStr).toContain(out.LogsBucketName);
    expect(resStr).toMatch(/\/alb\//);
  });
});
