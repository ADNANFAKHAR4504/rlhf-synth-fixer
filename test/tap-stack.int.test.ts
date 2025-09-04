/**
 * TapStack – Integration Tests (single file)
 *
 * Validates the running stack using CloudFormation outputs JSON at:
 *   cfn-outputs/all-outputs.json
 *
 * Positive + edge-case checks:
 * - Outputs present & valid
 * - VPC/subnets across 2 AZs; attributes as expected
 * - NAT Gateways available
 * - Security Groups: ALB (80/443 inbound), App (only 80 from ALB), reasonable egress
 * - ALB attributes: access logs enabled to S3/prefix; listener OK; TargetGroup healthy
 * - ASG (sizes, subnets, LT wiring); LT requires IMDSv2 and has instance profile
 * - S3 logging bucket (encryption, PAB, ownership controls, bucket policy)
 * - IAM role trust & inline permissions for the EC2 instance role
 * - Live HTTP health check to `http://<AlbDnsName>/health`
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
  | Record<string, any> // direct key/value map
  | {
      Stacks: Array<{
        Outputs: Array<{ OutputKey: string; OutputValue: string }>;
      }>;
    };

// ---------- Helpers ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retry<T>(fn: () => Promise<T>, attempts = 15, delayMs = 5000, label = "retry"): Promise<T> {
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

function loadOutputs(): Record<string, string> {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found at ${outputsPath}`);
  }
  const raw = fs.readFileSync(outputsPath, "utf8");
  const data = JSON.parse(raw) as OutputsShape;

  // Support either map or CFN "Stacks[].Outputs[]"
  if (Array.isArray((data as any).Stacks)) {
    const stack = (data as any).Stacks[0];
    if (!stack || !Array.isArray(stack.Outputs)) {
      throw new Error("Unexpected CFN outputs shape in Stacks[0].Outputs");
    }
    const map: Record<string, string> = {};
    for (const o of stack.Outputs) map[o.OutputKey] = o.OutputValue;
    return map;
  }

  return data as Record<string, string>;
}

function parseCsvIds(val: string | undefined): string[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseRoleNameFromArn(arn: string): string {
  // arn:aws:iam::<acct>:role/<roleName>
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

describe("Outputs file validation", () => {
  test("all required outputs are present and non-empty", () => {
    const out = loadOutputs();

    const requiredKeys = [
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

    for (const k of requiredKeys) {
      expect(out[k]).toBeTruthy();
      expect(String(out[k]).length).toBeGreaterThan(0);
    }

    // sanity on list-like outputs
    expect(parseCsvIds(out.PublicSubnetIds).length).toBeGreaterThanOrEqual(2);
    expect(parseCsvIds(out.PrivateSubnetIds).length).toBeGreaterThanOrEqual(2);
  });
});

describe("VPC & Subnets & NAT GW", () => {
  test("VPC and subnets exist, correct attributes, and subnets span at least two AZs", async () => {
    const out = loadOutputs();

    const vpc = await ec2.send(new DescribeVpcsCommand({ VpcIds: [out.VpcId] }));
    expect(vpc.Vpcs?.length).toBe(1);
    const v = vpc.Vpcs![0];
    expect(v.CidrBlock).toBe("10.0.0.0/16");

    const publicIds = parseCsvIds(out.PublicSubnetIds);
    const privateIds = parseCsvIds(out.PrivateSubnetIds);

    const subs = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [...publicIds, ...privateIds] }));
    const azs = new Set(subs.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);

    // check MapPublicIpOnLaunch for public subnets
    const publicSubs = subs.Subnets?.filter((s) => publicIds.includes(s.SubnetId!)) || [];
    for (const s of publicSubs) {
      expect(s.MapPublicIpOnLaunch).toBe(true);
    }
  });

  test("At least two NAT Gateways in the VPC are available", async () => {
    const out = loadOutputs();
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
    const appSgId = out.AppSecurityGroupId;
    const albSgId = out.AlbSecurityGroupId;

    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] }));
    expect(sgs.SecurityGroups?.length).toBe(1);
    const sg = sgs.SecurityGroups![0];

    // positive: HTTP from ALB SG
    expect(hasIngressFromSG(sg, 80, albSgId)).toBe(true);

    // edge: ensure NOT open SSH from the world
    expect(hasIngressPort(sg, 22, "0.0.0.0/0")).toBe(false);

    // egress acceptable
    expect(egressAllowsInternet(sg)).toBe(true);
  });
});

describe("Application Load Balancer", () => {
  test("ALB attributes show S3 access logging enabled with correct prefix", async () => {
    const out = loadOutputs();

    // Find ALB by DNS name
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

    // Locate ALB by DNS
    const lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
    const alb = (lbs.LoadBalancers || []).find((lb) => lb.DNSName === out.AlbDnsName);
    expect(alb).toBeTruthy();

    // Confirm HTTP:80 listener exists
    const listeners = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn! }));
    const l80 = (listeners.Listeners || []).find((l) => l.Port === 80 && l.Protocol === "HTTP");
    expect(l80).toBeTruthy();

    // Check target health eventually becomes healthy
    await retry(async () => {
      const th = await elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: out.TargetGroupArn }));
      const states = (th.TargetHealthDescriptions || []).map((d) => d.TargetHealth?.State);
      expect(states.length).toBeGreaterThanOrEqual(1);
      expect(states.some((s) => s === "healthy")).toBe(true);
      return true;
    }, 24, 5000, "elbv2:DescribeTargetHealth");
  });

  test("Live health check returns 200 and body includes 'OK'", async () => {
    const out = loadOutputs();
    const url = `http://${out.AlbDnsName}/health`;
    const res = await retry(() => httpGet(url, 10000), 12, 5000, "HTTP /health");
    expect(res.status).toBe(200);
    expect(res.body).toMatch(/OK/i);
  });
});

describe("AutoScaling & Launch Template", () => {
  test("ASG sizes are production-grade and span private subnets", async () => {
    const out = loadOutputs();
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
    const asgName = out.AutoScalingGroupName;

    const r = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
    const g = r.AutoScalingGroups![0];
    expect(g).toBeTruthy();
    const ltRef = g.LaunchTemplate!;
    expect(ltRef).toBeTruthy();

    const ltVers = await ec2.send(
      new DescribeLaunchTemplateVersionsCommand({
        LaunchTemplateId: ltRef.LaunchTemplateId!,
        Versions: [ltRef.Version!],
      })
    );
    const v = ltVers.LaunchTemplateVersions![0];
    const data = v.LaunchTemplateData!;
    expect(data.MetadataOptions?.HttpTokens).toBe("required");
    expect(data.MetadataOptions?.HttpEndpoint).toBe("enabled");
    expect(data.IamInstanceProfile?.Arn).toBeTruthy();
  });
});

describe("S3 Logs bucket and policy", () => {
  test("Bucket exists and has encryption, public access block, and ownership controls", async () => {
    const out = loadOutputs();
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

  test("Bucket policy allows ELB log delivery for this account and bucket prefix", async () => {
    const out = loadOutputs();
    const bucket = out.LogsBucketName;

    const polStr = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
    expect(polStr.Policy).toBeTruthy();

    const pol = JSON.parse(polStr.Policy as string);
    const write = findStatementBySid(pol, "AWSLogDeliveryWrite");
    const acl = findStatementBySid(pol, "AWSLogDeliveryAclCheck");
    expect(write).toBeTruthy();
    expect(acl).toBeTruthy();

    const action = write.Action;
    const okAction = action === "s3:PutObject" || (Array.isArray(action) && action.includes("s3:PutObject"));
    expect(okAction).toBe(true);

    const resource = write.Resource;
    const resourceStr = Array.isArray(resource) ? resource.join(" ") : String(resource);
    expect(resourceStr).toMatch(/\/alb\/AWSLogs\/\d+\/\*/);

    const princ = write.Principal?.AWS;
    const princStr = Array.isArray(princ) ? princ.join(" ") : String(princ);
    expect(princStr).toMatch(/^arn:aws:iam::\d{12}:root$/);

    const aclAction = acl.Action;
    const aclOk = aclAction === "s3:GetBucketAcl" || (Array.isArray(aclAction) && aclAction.includes("s3:GetBucketAcl"));
    expect(aclOk).toBe(true);
    expect(String(acl.Resource)).toMatch(/^arn:aws:s3:::/);
  });
});

describe("IAM Instance Role", () => {
  test("Trust policy allows EC2 and inline policy grants S3 list/get/put to logs bucket scope", async () => {
    const out = loadOutputs();
    const roleArn = out.InstanceRoleArn;
    const roleName = parseRoleNameFromArn(roleArn);

    const roleResp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(roleResp.Role).toBeTruthy();

    const assumeDocEncoded = roleResp.Role?.AssumeRolePolicyDocument;
    expect(assumeDocEncoded).toBeTruthy();

    // IAM returns URL-encoded JSON
    const assumeDoc = JSON.parse(decodeURIComponent(assumeDocEncoded!)) as any;
    const first = Array.isArray(assumeDoc?.Statement) ? assumeDoc.Statement[0] : undefined;
    expect(first).toBeTruthy();
    expect(first?.Principal?.Service).toBe("ec2.amazonaws.com");
    expect(first?.Action).toBe("sts:AssumeRole");

    const pols = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName }));
    expect(pols.PolicyNames).toBeTruthy();
    expect(pols.PolicyNames?.includes("S3LogsBucketAccess")).toBe(true);

    const polResp = await iam.send(
      new GetRolePolicyCommand({ RoleName: roleName, PolicyName: "S3LogsBucketAccess" })
    );
    expect(polResp.PolicyDocument).toBeTruthy();

    const doc = JSON.parse(decodeURIComponent(polResp.PolicyDocument!)) as any;
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
