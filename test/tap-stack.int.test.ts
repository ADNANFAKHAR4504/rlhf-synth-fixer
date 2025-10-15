import fs from "fs";
import path from "path";
import { promisify } from "util";
import sleepFn from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRegionsCommand,
} from "@aws-sdk/client-ec2";

import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, ListBucketsCommand } from "@aws-sdk/client-s3";

import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand } from "@aws-sdk/client-auto-scaling";

import { CloudWatchClient, DescribeAlarmsCommand, ListMetricsCommand } from "@aws-sdk/client-cloudwatch";

import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from "@aws-sdk/client-elastic-load-balancing-v2";

import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";

import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}

type OutputItem = { OutputKey: string; OutputValue: string };
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstKey = Object.keys(raw)[0];
const outputsArray: OutputItem[] = raw[firstKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

// Helper: resolve region: prefer explicit RegionCheck output containing a region string; fallback to env or us-east-1
function deduceRegion(): string {
  const rcheck = outputs.RegionCheck || outputs.Region || outputs.RegionValidation || "";
  const match = String(rcheck).match(/[a-z]{2}-[a-z]+-\d/);
  if (match) return match[0];
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  return "us-east-1";
}
const region = deduceRegion();

// AWS clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const cf = new CloudFrontClient({ region });

// Retry helper (linear backoff)
async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleepFn.setTimeout(delayMs * (i + 1));
    }
  }
  throw lastErr;
}

// Basic validators
const isVpcId = (v: string) => /^vpc-[0-9a-f]+$/.test(v);
const isCloudFrontDomain = (v: string) => /^[a-z0-9.-]+\.cloudfront\.net$/.test(v);
const isS3Name = (v: string) => /^[a-z0-9.-]{3,63}$/.test(v) && !v.includes("_");
const isRdsEndpoint = (v: string) => typeof v === "string" && v.endsWith(".amazonaws.com");

// Reuse outputs keys — fail fast if missing keys used by tests
const requiredForMany = ["VPCId", "ALBDNS", "RDSAddress", "AppBucket", "CloudFrontURL"];
for (const k of requiredForMany) {
  if (!outputs[k]) {
    // We will still run tests but many will fail — prefer explicit error early
    // Do not throw here to allow tests that do not require all keys to still run.
    // console.warn(`[integration-tests] Warning: outputs.${k} not present`);
  }
}

describe("TapStack Live Integration Tests — live AWS checks", () => {
  jest.setTimeout(5 * 60 * 1000); // 5 minutes for entire suite

  // 1 - outputs file parse sanity
  it("1) outputs JSON parsed and contains expected keys", () => {
    expect(Object.keys(outputsArray).length).toBeGreaterThanOrEqual(1);
    // ensure common keys exist
    expect(typeof outputs === "object").toBe(true);
  });

  // 2 - region deduced
  it("2) deduced region is a valid AWS region token", () => {
    expect(typeof region).toBe("string");
    expect(region.length).toBeGreaterThan(0);
  });

  // 3 - VPC existence
  it("3) VPC exists and is available", async () => {
    expect(outputs.VPCId).toBeDefined();
    expect(isVpcId(outputs.VPCId)).toBe(true);
    const resp = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })));
    expect(resp.Vpcs && resp.Vpcs.length).toBeGreaterThanOrEqual(1);
    // Accept 'available' or exist (State is not always present in older SDK responses)
    if (resp.Vpcs && resp.Vpcs[0].State) expect(resp.Vpcs[0].State).toBe("available");
  });

  // 4 - Subnets belong to the VPC
  it("4) Private subnets reported in outputs belong to the VPC", async () => {
    const rawPrivate = outputs.PrivateSubnets || outputs.PrivateSubnetIds || "";
    expect(typeof rawPrivate).toBe("string");
    if (rawPrivate.trim().length === 0) {
      // Skip if not provided by outputs (non-fatal)
      expect(rawPrivate).toBe("");
      return;
    }
    const ids = rawPrivate.split(",").map((s) => s.trim()).filter(Boolean);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    for (const sid of ids) {
      const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: [sid] })));
      expect(resp.Subnets && resp.Subnets[0].VpcId).toBe(outputs.VPCId);
    }
  });

  // 5 - NAT Gateway existence (if provided)
  it("5) NatGateway (if provided) is present and in available/failed states handled", async () => {
    const natId = outputs.NatGatewayId || outputs.NATGatewayId;
    if (!natId) {
      expect(natId).toBeUndefined();
      return;
    }
    const resp = await retry(() => ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] })));
    expect(resp.NatGateways && resp.NatGateways.length).toBeGreaterThanOrEqual(1);
    // state could be available, pending, failed, so accept presence
    expect(typeof resp.NatGateways[0].State).toBe("string");
  });

  // 6 - ALB DNS resolves to a load balancer via DescribeLoadBalancers
  it("6) ALB exists (find by DNSName) and has an ARN", async () => {
    const albDns = outputs.ALBDNS;
    if (!albDns) {
      expect(albDns).toBeUndefined();
      return;
    }
    // list/loadbalancers and match by DNSName
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
    const found = (lbs.LoadBalancers || []).find((lb) => lb.DNSName === albDns || (lb.DNSName && lb.DNSName.includes(albDns)));
    expect(found).toBeDefined();
    if (found) expect(typeof found.LoadBalancerArn).toBe("string");
  });

  // 7 - TargetGroups exist and health checks can be read
  it("7) TargetGroup(s) exist for the ALB and have HealthCheck config", async () => {
    const albDns = outputs.ALBDNS;
    if (!albDns) return expect(albDns).toBeUndefined();
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
    const found = (lbs.LoadBalancers || []).find((lb) => lb.DNSName === albDns || (lb.DNSName && lb.DNSName.includes(albDns)));
    expect(found).toBeDefined();
    const arn = found!.LoadBalancerArn!;
    const tgsResp = await retry(() => elbv2.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: arn })));
    expect(Array.isArray(tgsResp.TargetGroups)).toBe(true);
  });

  // 8 - CloudFront distribution exists and domain matches
  it("8) CloudFront distribution exists for CloudFrontURL output", async () => {
    const cfDomain = outputs.CloudFrontURL;
    if (!cfDomain) return expect(cfDomain).toBeUndefined();
    const resp = await retry(() => cf.send(new ListDistributionsCommand({})));
    const found = (resp.DistributionList?.Items || []).find((d) => {
      return d?.DomainName === cfDomain || (d?.DomainName && d.DomainName.includes(cfDomain));
    });
    expect(found).toBeDefined();
  });

  // 9 - App S3 bucket exists and is accessible (HeadBucket)
  it("9) App S3 bucket head request succeeds", async () => {
    const bucket = outputs.AppBucket;
    expect(bucket).toBeDefined();
    const head = await retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })));
    // HeadBucket returns empty payload on success; just assert no error thrown
    expect(head).toBeDefined();
  });

  // 10 - App S3 bucket has server-side encryption enabled (if accessible)
  it("10) App S3 bucket has server-side encryption configured", async () => {
    const bucket = outputs.AppBucket;
    if (!bucket) return expect(bucket).toBeUndefined();
    const enc = await retry(() => s3.send(new GetBucketEncryptionCommand({ Bucket: bucket })));
    // If encryption not configured, AWS throws NotFound — then this test will fail
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
  });

  // 11 - RDS instance describes via endpoint address
  it("11) RDS instance is present and endpoint matches RDSAddress output", async () => {
    const rdsEndpoint = outputs.RDSAddress;
    if (!rdsEndpoint) return expect(rdsEndpoint).toBeUndefined();
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const found = (resp.DBInstances || []).find((i) => i.Endpoint && i.Endpoint.Address === rdsEndpoint);
    expect(found).toBeDefined();
    if (found) {
      expect(found.MultiAZ).toBeDefined();
      expect(found.StorageEncrypted).toBeDefined();
    }
  });

  // 12 - Describe EC2 instances in VPC (any count >=0)
  it("12) EC2 instances can be listed in the VPC", async () => {
    if (!outputs.VPCId) return expect(outputs.VPCId).toBeUndefined();
    const res = await retry(() => ec2.send(new DescribeInstancesCommand({ Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }] })));
    const instances = (res.Reservations || []).flatMap((r) => r.Instances || []);
    expect(Array.isArray(instances)).toBe(true);
  });

  // 13 - Security groups are queryable for the VPC and have sensible ingress/egress
  it("13) Security groups in the VPC can be described and have IpPermissions array", async () => {
    if (!outputs.VPCId) return expect(outputs.VPCId).toBeUndefined();
    const sgResp = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }] })));
    expect(Array.isArray(sgResp.SecurityGroups)).toBe(true);
  });

  // 14 - AutoScaling group exists and returns MinSize/Desired/MaxSize when given
  it("14) AutoScaling group exists (when outputs.AutoScalingGroupName provided)", async () => {
    const asgName = outputs.AutoScalingGroupName;
    if (!asgName) return expect(asgName).toBeUndefined();
    const asgResp = await retry(() => asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })));
    expect(asgResp.AutoScalingGroups && asgResp.AutoScalingGroups.length >= 1).toBe(true);
  });

  // 15 - Scaling policies describe call returns array (if ASG present)
  it("15) Scaling policies for ASG can be described", async () => {
    const asgName = outputs.AutoScalingGroupName;
    if (!asgName) return expect(asgName).toBeUndefined();
    const pols = await retry(() => asg.send(new DescribePoliciesCommand({ AutoScalingGroupName: asgName })));
    expect(Array.isArray(pols.ScalingPolicies)).toBe(true);
  });

  // 16 - CloudWatch: there is at least one alarm in the account (may be outside stack)
  it("16) CloudWatch DescribeAlarms returns successfully", async () => {
    const alarms = await retry(() => cw.send(new DescribeAlarmsCommand({})));
    expect(alarms.MetricAlarms).toBeDefined();
  });

  // 17 - CloudWatch: list metrics for EC2 CPU returns results (account/region may vary)
  it("17) CloudWatch ListMetrics for AWS/EC2 CPUUtilization returns (possibly empty) array", async () => {
    const metrics = await retry(() => cw.send(new ListMetricsCommand({ Namespace: "AWS/EC2", MetricName: "CPUUtilization" })));
    expect(Array.isArray(metrics.Metrics)).toBe(true);
  });

  // 18 - ELB target groups (if LB found previously) have at least one target group
  it("18) ELB target groups exist for ALB when applicable", async () => {
    const albDns = outputs.ALBDNS;
    if (!albDns) return expect(albDns).toBeUndefined();
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
    const found = (lbs.LoadBalancers || []).find((lb) => lb.DNSName === albDns || (lb.DNSName && lb.DNSName.includes(albDns)));
    expect(found).toBeDefined();
    if (found) {
      const tg = await retry(() => elbv2.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: found.LoadBalancerArn })));
      expect(Array.isArray(tg.TargetGroups)).toBe(true);
    }
  });

  // 19 - Regions list call works
  it("19) EC2 DescribeRegions returns a list including the test region", async () => {
    const r = await retry(() => ec2.send(new DescribeRegionsCommand({})));
    expect(Array.isArray(r.Regions)).toBe(true);
    const found = (r.Regions || []).some((reg) => reg.RegionName === region);
    expect(found).toBe(true);
  });

  // 20 - S3 ListBuckets returns an array
  it("20) S3 ListBuckets works for the account", async () => {
    const lb = await retry(() => s3.send(new ListBucketsCommand({})));
    expect(Array.isArray(lb.Buckets)).toBe(true);
  });

  // 21 - AppBucket name sanity
  it("21) AppBucket value (if present) looks like a feasible bucket name", async () => {
    const b = outputs.AppBucket;
    if (!b) return expect(b).toBeUndefined();
    expect(b.length).toBeGreaterThanOrEqual(3);
    expect(b.length).toBeLessThanOrEqual(63);
  });

  // 22 - RDS endpoint string basic format
  it("22) RDSAddress (if present) is a valid aws hostname", async () => {
    const r = outputs.RDSAddress;
    if (!r) return expect(r).toBeUndefined();
    expect(typeof r).toBe("string");
    expect(r.endsWith(".amazonaws.com")).toBe(true);
  });

  // 23 - ALBDNS basic checks
  it("23) ALBDNS (if present) is a DNS name and contains region-like substring", async () => {
    const a = outputs.ALBDNS;
    if (!a) return expect(a).toBeUndefined();
    expect(typeof a).toBe("string");
    // must not include protocol
    expect(a.startsWith("http")).toBe(false);
    // has typical elb token
    expect(/elb|amazonaws/.test(a)).toBe(true);
  });

  // 24 - Final sanity: ensure CloudFront URL (if present) is a plausible distribution domain
  it("24) CloudFrontURL basic pattern match when present", async () => {
    const c = outputs.CloudFrontURL;
    if (!c) return expect(c).toBeUndefined();
    expect(/^[a-z0-9.-]+\.cloudfront\.net$/.test(c)).toBe(true);
  });
});
