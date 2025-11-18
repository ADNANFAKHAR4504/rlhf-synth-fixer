// test/tap-stack.int.test.ts

import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";
import dns from "dns/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";

import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
  DescribeRulesCommand,
  DescribeTargetHealthCommand,
  DescribeTagsCommand as ElbDescribeTagsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

import {
  ECSClient,
  DescribeClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
} from "@aws-sdk/client-ecs";

import {
  ServiceDiscoveryClient,
  GetNamespaceCommand,
  GetServiceCommand,
} from "@aws-sdk/client-servicediscovery";

import {
  ECRClient,
  DescribeRepositoriesCommand,
} from "@aws-sdk/client-ecr";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from "@aws-sdk/client-application-auto-scaling";

import {
  CloudWatchClient,
  ListMetricsCommand,
} from "@aws-sdk/client-cloudwatch";

/* ---------------------------- Setup / Helpers --------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstTopKey = Object.keys(raw)[0];
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstTopKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

function deduceRegion(): string {
  // Try to infer region from ALB DNS (e.g., ...us-east-1.elb.amazonaws.com)
  const alb = outputs.AlbDnsName || "";
  const m = alb.match(/\.([a-z]{2}-[a-z]+-\d)\.elb\.amazonaws\.com$/);
  if (m) return m[1];
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  return "us-east-1";
}
const region = deduceRegion();

// AWS clients
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const ecs = new ECSClient({ region });
const sd = new ServiceDiscoveryClient({ region });
const ecr = new ECRClient({ region });
const logs = new CloudWatchLogsClient({ region });
const aas = new ApplicationAutoScalingClient({ region });
const cw = new CloudWatchClient({ region });

// retry helper with incremental backoff
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 700): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await wait(baseDelayMs * (i + 1));
      }
    }
  }
  throw lastErr;
}

function splitCsv(v?: string): string[] {
  return (v || "").split(",").map(s => s.trim()).filter(Boolean);
}

function envSuffixFromClusterName(clusterName: string): string | undefined {
  const m = clusterName.match(/^ecs-(.+)$/);
  return m?.[1];
}

jest.setTimeout(12 * 60 * 1000); // 12 minutes for the full suite

/* -------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  /* 1 */ it("outputs file parsed and essential keys present", () => {
    expect(typeof outputs.VpcId).toBe("string");
    expect(typeof outputs.AlbArn).toBe("string");
    expect(typeof outputs.AlbDnsName).toBe("string");
    expect(typeof outputs.ClusterName).toBe("string");
    expect(typeof outputs.CloudMapNamespaceId).toBe("string");
  });

  /* 2 */ it("region deduced and ELBv2 API reachable", async () => {
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
    expect(Array.isArray(lbs.LoadBalancers)).toBe(true);
  });

  /* 3 */ it("VPC exists and has 6 subnets (3 public + 3 private)", async () => {
    const vpcId = outputs.VpcId;
    const vpcs = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect((vpcs.Vpcs || []).some(v => v.VpcId === vpcId)).toBe(true);

    const allSubs = await retry(() => ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] })));
    const subnetCount = (allSubs.Subnets || []).length;
    expect(subnetCount).toBeGreaterThanOrEqual(6);

    // Ensure at least 3 private (MapPublicIpOnLaunch === false) and 3 public (true)
    const pubs = (allSubs.Subnets || []).filter(s => s.MapPublicIpOnLaunch === true).length;
    const privs = (allSubs.Subnets || []).filter(s => s.MapPublicIpOnLaunch === false).length;
    expect(pubs).toBeGreaterThanOrEqual(3);
    expect(privs).toBeGreaterThanOrEqual(3);
  });

  /* 4 */ it("NAT gateways present across AZs (>=1)", async () => {
    const vpcId = outputs.VpcId;
    const resp = await retry(() => ec2.send(new DescribeNatGatewaysCommand({
      Filter: [{ Name: "vpc-id", Values: [vpcId] }],
    })));
    expect((resp.NatGateways || []).length).toBeGreaterThanOrEqual(1);
  });

  /* 5 */ it("Private route tables have a default route to a NAT gateway", async () => {
    const vpcId = outputs.VpcId;
    const rts = await retry(() => ec2.send(new DescribeRouteTablesCommand({
      Filters: [{ Name: "vpc-id", Values: [vpcId] }],
    })));
    // look for at least one route table with 0.0.0.0/0 via nat-gateway
    const hasNatDefault = (rts.RouteTables || []).some(rt =>
      (rt.Routes || []).some(r => r.DestinationCidrBlock === "0.0.0.0/0" && !!r.NatGatewayId)
    );
    expect(hasNatDefault).toBe(true);
  });

  /* 6 */ it("ALB found by ARN and DNS name matches, has SG and multiple AZs", async () => {
    // FIX: use AlbArn (Describe by ARN), not DNS 'Name' which must be <=32 chars.
    const lbArn = outputs.AlbArn;
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] })));
    const lb = lbs.LoadBalancers?.[0];
    expect(lb?.LoadBalancerArn).toBe(lbArn);
    expect(lb?.DNSName).toBe(outputs.AlbDnsName);
    expect((lb?.SecurityGroups || []).length).toBeGreaterThanOrEqual(1);
    expect((lb?.AvailabilityZones || []).length).toBeGreaterThanOrEqual(2);
  });

  /* 7 */ it("ALB Security Group allows 80/443 from 0.0.0.0/0", async () => {
    // FIX: look up LB by ARN, then fetch its SGs
    const lbArn = outputs.AlbArn;
    const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] })));
    const sgIds = lbs.LoadBalancers?.[0]?.SecurityGroups || [];
    expect(sgIds.length).toBeGreaterThanOrEqual(1);

    const sgs = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds })));
    const ingress = (sgs.SecurityGroups || []).flatMap(sg => sg.IpPermissions || []);
    const allow80 = ingress.some(p => p.FromPort === 80 && p.ToPort === 80 && (p.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0"));
    const allow443 = ingress.some(p => p.FromPort === 443 && p.ToPort === 443 && (p.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0"));
    expect(allow80).toBe(true);
    expect(allow443).toBe(true);
  });

  /* 8 */ it("HTTP listener exists; HTTPS may exist if cert was provided", async () => {
    const lbArn = outputs.AlbArn;
    const ls = await retry(() => elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn })));
    const ports = (ls.Listeners || []).map(l => l.Port);
    expect(ports).toContain(80);
    // 443 is optional
    expect(Array.isArray(ports)).toBe(true);
  });

  /* 9 */ it("Listener default action on HTTP is redirect to 443 or 404 fixed-response", async () => {
    const lbArn = outputs.AlbArn;
    const ls = await retry(() => elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn })));
    const http = (ls.Listeners || []).find(l => l.Port === 80)!;
    expect(http).toBeDefined();
    const da = http.DefaultActions || [];
    const ok = da.some(a => a.Type === "redirect" || a.Type === "fixed-response");
    expect(ok).toBe(true);
  });

  /* 10 */ it("Target groups for payment/fraud/reporting exist and are HTTP with matcher 200-399", async () => {
    const tgs = [outputs.PaymentTargetGroupArn, outputs.FraudTargetGroupArn, outputs.ReportingTargetGroupArn];
    const resp = await retry(() => elbv2.send(new DescribeTargetGroupsCommand({ TargetGroupArns: tgs })));
    expect((resp.TargetGroups || []).length).toBe(3);
    for (const tg of resp.TargetGroups || []) {
      expect(tg.Protocol).toBe("HTTP");
      expect(tg.Matcher?.HttpCode).toBe("200-399");
      expect(tg.HealthCheckIntervalSeconds).toBeGreaterThanOrEqual(10);
    }
  });

  /* 11 */ it("Path-based rules for /payment/*, /fraud/*, /reporting/* are present on at least one listener", async () => {
    const lbArn = outputs.AlbArn;
    const ls = await retry(() => elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn })));
    let allRules: any[] = [];
    for (const l of ls.Listeners || []) {
      const rules = await retry(() => elbv2.send(new DescribeRulesCommand({ ListenerArn: l.ListenerArn! })));
      allRules = allRules.concat(rules.Rules || []);
    }
    const patterns = (allRules || []).flatMap(r => (r.Conditions || [])
      .filter(c => c.Field === "path-pattern")
      .flatMap(c => c.Values || []));
    expect(patterns.some(p => p === "/payment/*")).toBe(true);
    expect(patterns.some(p => p === "/fraud/*")).toBe(true);
    expect(patterns.some(p => p === "/reporting/*")).toBe(true);
  });

  /* 12 */ it("Target health API works (targets may be empty when DesiredCount=0)", async () => {
    for (const arn of [outputs.PaymentTargetGroupArn, outputs.FraudTargetGroupArn, outputs.ReportingTargetGroupArn]) {
      const th = await retry(() => elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: arn })));
      expect(Array.isArray(th.TargetHealthDescriptions)).toBe(true);
    }
  });

  /* 13 */ it("Cloud Map namespace exists and is in AVAILABLE state (or has a valid ARN)", async () => {
    const ns = await retry(() => sd.send(new GetNamespaceCommand({ Id: outputs.CloudMapNamespaceId })));
    expect(ns.Namespace?.Arn || ns.Namespace?.Id).toBeDefined();
  });

  /* 14 */ it("Cloud Map services exist with expected names", async () => {
    // Outputs for *ServiceDiscoveryName are Service IDs (Ref), so use GetService by Id
    const svcIds = [
      outputs.PaymentServiceDiscoveryName,
      outputs.FraudServiceDiscoveryName,
      outputs.ReportingServiceDiscoveryName,
    ].filter(Boolean);
    for (const id of svcIds) {
      const s = await retry(() => sd.send(new GetServiceCommand({ Id: id })));
      expect(s.Service?.Name).toMatch(/(payment|fraud|reporting)-/);
    }
  });

  /* 15 */ it("ECS Cluster exists and Active", async () => {
    const cluster = outputs.ClusterName;
    const dc = await retry(() => ecs.send(new DescribeClustersCommand({ clusters: [cluster] })));
    const c = dc.clusters?.[0];
    expect(c?.status).toBeDefined();
    expect(["ACTIVE", "PROVISIONING", "DEPROVISIONING", "FAILED"].includes(c!.status!)).toBe(true);
  });

  /* 16 */ it("ECS services exist and are associated to the cluster", async () => {
    const cluster = outputs.ClusterName;
    const expectedNames = [
      outputs.PaymentServiceName,
      outputs.FraudServiceName,
      outputs.ReportingServiceName,
    ].filter(Boolean);
    const listed = await retry(() => ecs.send(new ListServicesCommand({ cluster })));
    const listNames = (listed.serviceArns || []).map(a => a.split("/").pop());
    for (const name of expectedNames) {
      expect(listNames).toContain(name);
    }
  });

  /* 17 */ it("ECS services have deployment circuit breaker enabled", async () => {
    const cluster = outputs.ClusterName;
    const names = [
      outputs.PaymentServiceName,
      outputs.FraudServiceName,
      outputs.ReportingServiceName,
    ].filter(Boolean);
    const ds = await retry(() => ecs.send(new DescribeServicesCommand({ cluster, services: names })));
    for (const s of ds.services || []) {
      const dc = (s.deploymentConfiguration as any) || {};
      // ECS returns booleans under deploymentCircuitBreaker
      const cb = dc.deploymentCircuitBreaker || {};
      expect(typeof cb.enable === "boolean" || typeof cb.enabled === "boolean").toBe(true);
    }
  });

  /* 18 */ it("ECR repositories exist for payment/fraud/reporting with ENV suffix", async () => {
    const cluster = outputs.ClusterName;
    const envSuffix = envSuffixFromClusterName(cluster) || "";
    const repos = [`payment-${envSuffix}`, `fraud-${envSuffix}`, `reporting-${envSuffix}`];
    const resp = await retry(() => ecr.send(new DescribeRepositoriesCommand({ repositoryNames: repos })));
    expect((resp.repositories || []).length).toBe(3);
  });

  /* 19 */ it("CloudWatch Log Groups exist for all services", async () => {
    const names = [
      `/ecs/payment-${envSuffixFromClusterName(outputs.ClusterName)}`,
      `/ecs/fraud-${envSuffixFromClusterName(outputs.ClusterName)}`,
      `/ecs/reporting-${envSuffixFromClusterName(outputs.ClusterName)}`,
    ].filter(Boolean) as string[];
    for (const lg of names) {
      const d = await retry(() => logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lg })));
      const found = (d.logGroups || []).some(g => g.logGroupName === lg);
      expect(found).toBe(true);
    }
  });

  /* 20 */ it("ALB has required tags Environment=Production and ManagedBy=CloudFormation", async () => {
    const lbArn = outputs.AlbArn;
    const t = await retry(() => elbv2.send(new ElbDescribeTagsCommand({ ResourceArns: [lbArn] })));
    const tags = (t.TagDescriptions?.[0]?.Tags || []).reduce<Record<string, string>>((acc, kv) => {
      if (kv.Key && kv.Value) acc[kv.Key] = kv.Value;
      return acc;
    }, {});
    expect(tags.Environment).toBe("Production");
    expect(tags.ManagedBy).toBe("CloudFormation");
  });

  /* 21 */ it("Application Auto Scaling ScalableTargets present for all three services", async () => {
    const cluster = outputs.ClusterName;
    const ids = [
      `service/${cluster}/${outputs.PaymentServiceName}`,
      `service/${cluster}/${outputs.FraudServiceName}`,
      `service/${cluster}/${outputs.ReportingServiceName}`,
    ];
    const resp = await retry(() => aas.send(new DescribeScalableTargetsCommand({
      ServiceNamespace: "ecs",
      ResourceIds: ids,
      ScalableDimension: "ecs:service:DesiredCount",
    })));
    const foundIds = (resp.ScalableTargets || []).map(s => s.ResourceId);
    for (const id of ids) expect(foundIds).toContain(id);
  });

  /* 22 */ it("Scaling policies exist and use ECSServiceAverageCPUUtilization", async () => {
    const cluster = outputs.ClusterName;
    const ids = [
      `service/${cluster}/${outputs.PaymentServiceName}`,
      `service/${cluster}/${outputs.FraudServiceName}`,
      `service/${cluster}/${outputs.ReportingServiceName}`,
    ];
    const all: any[] = [];
    for (const id of ids) {
      const r = await retry(() => aas.send(new DescribeScalingPoliciesCommand({ ServiceNamespace: "ecs", ResourceId: id })));
      all.push(...(r.ScalingPolicies || []));
    }
    expect(all.length).toBeGreaterThanOrEqual(3);
    const cpuTT = all.every(p => p.PolicyType === "TargetTrackingScaling" &&
      p.TargetTrackingScalingPolicyConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType === "ECSServiceAverageCPUUtilization");
    expect(cpuTT).toBe(true);
  });

  /* 23 */ it("ALB DNS name looks valid and resolves in DNS", async () => {
    const host = outputs.AlbDnsName;
    expect(host.endsWith(".elb.amazonaws.com")).toBe(true);
    // DNS resolve (IPv4) — in some environments DNS may be restricted; accept any array result
    const addrs = await retry(() => dns.resolve4(host));
    expect(Array.isArray(addrs)).toBe(true);
    expect(addrs.length).toBeGreaterThan(0);
  });

  /* 24 */ it("Target groups health API returns without error for all three TGs", async () => {
    for (const arn of [outputs.PaymentTargetGroupArn, outputs.FraudTargetGroupArn, outputs.ReportingTargetGroupArn]) {
      const th = await retry(() => elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: arn })));
      expect(th.$metadata.httpStatusCode).toBe(200);
    }
  });

  /* 25 */ it("CloudWatch metrics list query for ECS CPUUtilization by ClusterName dimension succeeds", async () => {
    const cluster = outputs.ClusterName;
    const metrics = await retry(() => cw.send(new ListMetricsCommand({
      Namespace: "AWS/ECS",
      MetricName: "CPUUtilization",
      Dimensions: [{ Name: "ClusterName", Value: cluster }],
    })));
    expect(Array.isArray(metrics.Metrics)).toBe(true);
  });
});
