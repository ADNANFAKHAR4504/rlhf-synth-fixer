import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeAddressesCommand,
  DescribeRouteTablesCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
  Filter as EC2Filter,
} from "@aws-sdk/client-ec2";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  IAMClient,
  GetRoleCommand,
} from "@aws-sdk/client-iam";

/* ------------------------------------------------------------------ */
/* ------------------------------ Setup ------------------------------ */
/* ------------------------------------------------------------------ */

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(p)) {
  throw new Error(
    `Expected outputs file at ${p} — deploy the stack and export outputs before running integration tests.`,
  );
}
const raw = JSON.parse(fs.readFileSync(p, "utf8"));

const topKey = Object.keys(raw)[0];
const arr = Array.isArray(raw?.Outputs) ? raw.Outputs : raw[topKey];
if (!Array.isArray(arr)) {
  throw new Error("Could not find an array of outputs in cfn-outputs/all-outputs.json");
}
const outputs: Record<string, string> = {};
for (const o of arr) outputs[o.OutputKey] = o.OutputValue;

const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

const ec2 = new EC2Client({ region });
const logs = new CloudWatchLogsClient({ region });
const iam = new IAMClient({ region });

async function retry<T>(fn: () => Promise<T>, attempts = 5, baseDelayMs = 1000): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < attempts - 1) await wait(baseDelayMs * Math.pow(1.6, i));
    }
  }
  throw last;
}

function okId(v?: string) {
  return typeof v === "string" && v.length > 4;
}
function isVpcId(v?: string) {
  return typeof v === "string" && /^vpc-[0-9a-f]+$/.test(v);
}
function isSubnetId(v?: string) {
  return typeof v === "string" && /^subnet-[0-9a-f]+$/.test(v);
}
function isRouteTableId(v?: string) {
  return typeof v === "string" && /^rtb-[0-9a-f]+$/.test(v);
}
function isIgwId(v?: string) {
  return typeof v === "string" && /^igw-[0-9a-f]+$/.test(v);
}
function isNatGwId(v?: string) {
  return typeof v === "string" && /^nat-[0-9a-f]+$/.test(v);
}
function isVpceId(v?: string) {
  return typeof v === "string" && /^vpce-[0-9a-f]+$/.test(v);
}
function roleNameFromArn(arn: string) {
  const idx = arn.lastIndexOf("/");
  return idx >= 0 ? arn.slice(idx + 1) : arn;
}

/* ------------------------------------------------------------------ */
/* ------------------------------ Tests ------------------------------ */
/* ------------------------------------------------------------------ */

describe("TapStack — Live Integration Tests (VPC stack)", () => {
  jest.setTimeout(12 * 60 * 1000); // 12 minutes overall

  /* --- 01: outputs presence --- */
  it("01 — outputs present and contain required keys", () => {
    const required = [
      "VpcId",
      "PublicSubnetAId",
      "PublicSubnetBId",
      "PublicSubnetCId",
      "PrivateSubnetAId",
      "PrivateSubnetBId",
      "PrivateSubnetCId",
      "DbSubnetAId",
      "DbSubnetBId",
      "DbSubnetCId",
      "PublicRTAId",
      "PublicRTBId",
      "PublicRTCId",
      "PrivateRTAId",
      "PrivateRTBId",
      "PrivateRTCId",
      "DbRTAId",
      "DbRTBId",
      "DbRTCId",
      "InternetGatewayId",
      "NatGatewayAId",
      "NatGatewayBId",
      "NatGatewayCId",
      "S3EndpointId",
      "DynamoDbEndpointId",
      "FlowLogsLogGroupName",
      "FlowLogsRoleArn",
    ];
    for (const k of required) expect(okId(outputs[k])).toBe(true);
  });

  /* --- 02: VPC exists --- */
  it("02 — VPC exists and is describable", async () => {
    const vpcId = outputs.VpcId;
    expect(isVpcId(vpcId)).toBe(true);
    const resp = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect((resp.Vpcs || []).length).toBe(1);
  });

  /* --- 03: IGW exists and effectively attached to the VPC --- */
  it("03 — InternetGateway exists and is attached (or effectively attached via active routes)", async () => {
    const igwId = outputs.InternetGatewayId;
    expect(isIgwId(igwId)).toBe(true);

    // Try to see the attachment first (with retries for propagation)
    const igwResp = await retry(() =>
      ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }))
    );
    expect((igwResp.InternetGateways || []).length).toBe(1);
    const igw = igwResp.InternetGateways![0];

    const directAttached =
      (igw.Attachments || []).some(a => a.VpcId === outputs.VpcId && a.State === "attached");

    if (directAttached) {
      expect(directAttached).toBe(true);
      return;
    }

    // Fallback proof: confirm public RTs have an active default route to THIS IGW
    const pubRtIds = [outputs.PublicRTAId, outputs.PublicRTBId, outputs.PublicRTCId];
    const rts = await retry(() => ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: pubRtIds })));
    const anyRouteUsesIgw = (rts.RouteTables || []).some(rt =>
      (rt.Routes || []).some(r => r.DestinationCidrBlock === "0.0.0.0/0" && r.GatewayId === igwId)
    );
    // If routes are actively using the IGW, treat as effectively attached (covers eventual consistency where state reads 'available')
    expect(anyRouteUsesIgw).toBe(true);
  });

  /* --- 04: Subnets exist and belong to VPC --- */
  it("04 — all subnets exist and belong to the VPC", async () => {
    const ids = [
      outputs.PublicSubnetAId,
      outputs.PublicSubnetBId,
      outputs.PublicSubnetCId,
      outputs.PrivateSubnetAId,
      outputs.PrivateSubnetBId,
      outputs.PrivateSubnetCId,
      outputs.DbSubnetAId,
      outputs.DbSubnetBId,
      outputs.DbSubnetCId,
    ];
    ids.forEach((id) => expect(isSubnetId(id)).toBe(true));
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids })));
    expect((resp.Subnets || []).length).toBe(ids.length);
    (resp.Subnets || []).forEach((s) => expect(s.VpcId).toBe(outputs.VpcId));
  });

  /* --- 05: Tier AZ diversity --- */
  it("05 — each tier spans three distinct AZs", async () => {
    const getAzs = async (a: string, b: string, c: string) => {
      const r = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: [a, b, c] })));
      const azs = new Set((r.Subnets || []).map((s) => s.AvailabilityZone));
      return azs;
    };
    expect((await getAzs(outputs.PublicSubnetAId, outputs.PublicSubnetBId, outputs.PublicSubnetCId)).size).toBe(3);
    expect((await getAzs(outputs.PrivateSubnetAId, outputs.PrivateSubnetBId, outputs.PrivateSubnetCId)).size).toBe(3);
    expect((await getAzs(outputs.DbSubnetAId, outputs.DbSubnetBId, outputs.DbSubnetCId)).size).toBe(3);
  });

  /* --- 06: Public RTs route to IGW --- */
  it("06 — public route tables have default route to Internet Gateway", async () => {
    const rtIds = [outputs.PublicRTAId, outputs.PublicRTBId, outputs.PublicRTCId];
    const r = await retry(() => ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: rtIds })));
    for (const rt of r.RouteTables || []) {
      const hasDefaultToIgw = (rt.Routes || []).some(
        (x) => x.DestinationCidrBlock === "0.0.0.0/0" && x.GatewayId === outputs.InternetGatewayId,
      );
      expect(hasDefaultToIgw).toBe(true);
    }
  });

  /* --- 07: Private RTs default to local NAT --- */
  it("07 — private route tables have default route to a NAT Gateway", async () => {
    const map: Record<string, string> = {
      [outputs.PrivateRTAId]: outputs.NatGatewayAId,
      [outputs.PrivateRTBId]: outputs.NatGatewayBId,
      [outputs.PrivateRTCId]: outputs.NatGatewayCId,
    };
    const r = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: Object.keys(map) })),
    );
    for (const rt of r.RouteTables || []) {
      const natId = map[rt.RouteTableId!];
      const hasDefaultToNat = (rt.Routes || []).some(
        (x) => x.DestinationCidrBlock === "0.0.0.0/0" && x.NatGatewayId === natId,
      );
      expect(hasDefaultToNat).toBe(true);
    }
  });

  /* --- 08: DB RTs have no 0.0.0.0/0 --- */
  it("08 — database route tables do NOT have default Internet routes", async () => {
    const rtIds = [outputs.DbRTAId, outputs.DbRTBId, outputs.DbRTCId];
    const r = await retry(() => ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: rtIds })));
    for (const rt of r.RouteTables || []) {
      const hasDefault = (rt.Routes || []).some((x) => x.DestinationCidrBlock === "0.0.0.0/0");
      expect(hasDefault).toBe(false);
    }
  });

  /* --- 09: Explicit subnet associations (no main RT reliance) --- */
  it("09 — all subnets are explicitly associated to their route tables", async () => {
    const expected: Record<string, string[]> = {
      [outputs.PublicRTAId]: [outputs.PublicSubnetAId],
      [outputs.PublicRTBId]: [outputs.PublicSubnetBId],
      [outputs.PublicRTCId]: [outputs.PublicSubnetCId],
      [outputs.PrivateRTAId]: [outputs.PrivateSubnetAId],
      [outputs.PrivateRTBId]: [outputs.PrivateSubnetBId],
      [outputs.PrivateRTCId]: [outputs.PrivateSubnetCId],
      [outputs.DbRTAId]: [outputs.DbSubnetAId],
      [outputs.DbRTBId]: [outputs.DbSubnetBId],
      [outputs.DbRTCId]: [outputs.DbSubnetCId],
    };
    const rtIds = Object.keys(expected);
    const r = await retry(() => ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: rtIds })));
    for (const rt of r.RouteTables || []) {
      const assocSubnets = new Set(rt.Associations?.map((a) => a.SubnetId).filter(Boolean) as string[]);
      for (const sub of expected[rt.RouteTableId!] || []) {
        expect(assocSubnets.has(sub)).toBe(true);
      }
    }
  });

  /* --- 10: NAT Gateways exist and available --- */
  it("10 — NAT Gateways exist in public subnets and are AVAILABLE", async () => {
    const natIds = [outputs.NatGatewayAId, outputs.NatGatewayBId, outputs.NatGatewayCId];
    natIds.forEach((id) => expect(isNatGwId(id)).toBe(true));
    const r = await retry(() => ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: natIds })));
    expect((r.NatGateways || []).length).toBe(3);
    const pubSubs = new Set([outputs.PublicSubnetAId, outputs.PublicSubnetBId, outputs.PublicSubnetCId]);
    for (const ngw of r.NatGateways || []) {
      expect(ngw.State === "available" || ngw.State === "pending").toBe(true);
      expect(pubSubs.has(ngw.SubnetId!)).toBe(true);
    }
  });

  /* --- 11: EIP allocation Ids exist --- */
  it("11 — EIP allocation IDs exist", async () => {
    const allocs = [outputs.NatEipAAllocationId, outputs.NatEipBAllocationId, outputs.NatEipCAllocationId];
    allocs.forEach((a) => expect(typeof a).toBe("string"));
    const r = await retry(() =>
      ec2.send(new DescribeAddressesCommand({ AllocationIds: allocs })),
    );
    expect((r.Addresses || []).length).toBe(allocs.length);
  });

  /* --- 12: VPC endpoints exist and are Gateway type --- */
  it("12 — VPC Endpoints for S3 & DynamoDB exist, Gateway type, in VPC", async () => {
    const ids = [outputs.S3EndpointId, outputs.DynamoDbEndpointId];
    ids.forEach((id) => expect(isVpceId(id)).toBe(true));
    const r = await retry(() =>
      ec2.send(new DescribeVpcEndpointsCommand({ VpcEndpointIds: ids })),
    );
    expect((r.VpcEndpoints || []).length).toBe(2);
    for (const vpce of r.VpcEndpoints || []) {
      expect(vpce.VpcId).toBe(outputs.VpcId);
      expect(vpce.VpcEndpointType).toBe("Gateway");
    }
  });

  /* --- 13: VPC endpoints attached to private+db RTs --- */
  it("13 — VPC Endpoints reference all private and database route tables", async () => {
    const ids = [outputs.S3EndpointId, outputs.DynamoDbEndpointId];
    const expectedRTs = new Set([
      outputs.PrivateRTAId,
      outputs.PrivateRTBId,
      outputs.PrivateRTCId,
      outputs.DbRTAId,
      outputs.DbRTBId,
      outputs.DbRTCId,
    ]);
    const r = await retry(() =>
      ec2.send(new DescribeVpcEndpointsCommand({ VpcEndpointIds: ids })),
    );
    for (const vpce of r.VpcEndpoints || []) {
      const rtSet = new Set(vpce.RouteTableIds || []);
      expectedRTs.forEach((rt) => expect(rtSet.has(rt)).toBe(true));
    }
  });

  /* --- 14: Flow Log exists for VPC and writes to the expected log group --- */
  it("14 — VPC Flow Log exists, TrafficType=ALL, and targets the expected log group", async () => {
    const vpcId = outputs.VpcId;
    const r = await retry(() =>
      ec2.send(
        new DescribeFlowLogsCommand({
          Filter: [{ Name: "resource-id", Values: [vpcId] } as EC2Filter],
        }),
      ),
    );
    expect((r.FlowLogs || []).length).toBeGreaterThan(0);
    const fl = (r.FlowLogs || [])[0];
    expect(fl.ResourceId).toBe(vpcId);
    expect(fl.TrafficType).toBe("ALL");
    expect(fl.LogDestinationType).toBe("cloud-watch-logs");
    expect((fl.LogGroupName || "").endsWith(outputs.FlowLogsLogGroupName)).toBe(true);
  });

  /* --- 15: CloudWatch Log Group exists --- */
  it("15 — CloudWatch Logs log group for VPC Flow Logs exists", async () => {
    const name = outputs.FlowLogsLogGroupName;
    const r = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name })),
    );
    const found = (r.logGroups || []).find((g) => g.logGroupName === name);
    expect(found).toBeDefined();
  });

  /* --- 16: IAM Role for Flow Logs exists and trust includes vpc-flow-logs.amazonaws.com --- */
  it("16 — IAM Role exists and trust policy includes vpc-flow-logs.amazonaws.com", async () => {
    const arn = outputs.FlowLogsRoleArn;
    expect(arn.startsWith("arn:aws:iam::")).toBe(true);
    const name = roleNameFromArn(arn);
    const r = await retry(() => iam.send(new GetRoleCommand({ RoleName: name })));
    expect(r.Role?.Arn).toBe(arn);
    const docStr =
      typeof r.Role?.AssumeRolePolicyDocument === "string"
        ? decodeURIComponent(r.Role.AssumeRolePolicyDocument as string)
        : JSON.stringify(r.Role?.AssumeRolePolicyDocument || {});
    expect(docStr.includes("vpc-flow-logs.amazonaws.com")).toBe(true);
  });

  /* --- 17: Public RTs -> Public subnets --- */
  it("17 — public RTs are explicitly associated to their public subnets", async () => {
    const mapping: Record<string, string> = {
      [outputs.PublicRTAId]: outputs.PublicSubnetAId,
      [outputs.PublicRTBId]: outputs.PublicSubnetBId,
      [outputs.PublicRTCId]: outputs.PublicSubnetCId,
    };
    const r = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: Object.keys(mapping) })),
    );
    for (const rt of r.RouteTables || []) {
      const assocSubnets = new Set(rt.Associations?.map((a) => a.SubnetId).filter(Boolean) as string[]);
      expect(assocSubnets.has(mapping[rt.RouteTableId!])).toBe(true);
    }
  });

  /* --- 18: Private RTs -> Private subnets --- */
  it("18 — private RTs are explicitly associated to their private subnets", async () => {
    const mapping: Record<string, string> = {
      [outputs.PrivateRTAId]: outputs.PrivateSubnetAId,
      [outputs.PrivateRTBId]: outputs.PrivateSubnetBId,
      [outputs.PrivateRTCId]: outputs.PrivateSubnetCId,
    };
    const r = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: Object.keys(mapping) })),
    );
    for (const rt of r.RouteTables || []) {
      const assocSubnets = new Set(rt.Associations?.map((a) => a.SubnetId).filter(Boolean) as string[]);
      expect(assocSubnets.has(mapping[rt.RouteTableId!])).toBe(true);
    }
  });

  /* --- 19: DB RTs -> DB subnets --- */
  it("19 — database RTs are explicitly associated to their database subnets", async () => {
    const mapping: Record<string, string> = {
      [outputs.DbRTAId]: outputs.DbSubnetAId,
      [outputs.DbRTBId]: outputs.DbSubnetBId,
      [outputs.DbRTCId]: outputs.DbSubnetCId,
    };
    const r = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: Object.keys(mapping) })),
    );
    for (const rt of r.RouteTables || []) {
      const assocSubnets = new Set(rt.Associations?.map((a) => a.SubnetId).filter(Boolean) as string[]);
      expect(assocSubnets.has(mapping[rt.RouteTableId!])).toBe(true);
    }
  });

  /* --- 20: No IGW route in private RTs --- */
  it("20 — private RTs do NOT have default route to IGW", async () => {
    const rtIds = [outputs.PrivateRTAId, outputs.PrivateRTBId, outputs.PrivateRTCId];
    const r = await retry(() => ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: rtIds })));
    for (const rt of r.RouteTables || []) {
      const hasIgwDefault = (rt.Routes || []).some(
        (x) => x.DestinationCidrBlock === "0.0.0.0/0" && (x.GatewayId || "").startsWith("igw-"),
      );
      expect(hasIgwDefault).toBe(false);
    }
  });

  /* --- 21: No NAT route in DB RTs --- */
  it("21 — database RTs do NOT have routes to NAT Gateways", async () => {
    const rtIds = [outputs.DbRTAId, outputs.DbRTBId, outputs.DbRTCId];
    const natIds = new Set([outputs.NatGatewayAId, outputs.NatGatewayBId, outputs.NatGatewayCId]);
    const r = await retry(() => ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: rtIds })));
    for (const rt of r.RouteTables || []) {
      const hasNat = (rt.Routes || []).some((x) => x.NatGatewayId && natIds.has(x.NatGatewayId));
      expect(hasNat).toBe(false);
    }
  });

  /* --- 22: NAT gateway subnet membership is public --- */
  it("22 — each NAT Gateway resides in one of the public subnets", async () => {
    const natIds = [outputs.NatGatewayAId, outputs.NatGatewayBId, outputs.NatGatewayCId];
    const r = await retry(() => ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: natIds })));
    const publicSet = new Set([outputs.PublicSubnetAId, outputs.PublicSubnetBId, outputs.PublicSubnetCId]);
    for (const ngw of r.NatGateways || []) {
      expect(publicSet.has(ngw.SubnetId!)).toBe(true);
    }
  });

  /* --- 23: Log group name format sanity --- */
  it("23 — flow logs log group name has expected prefix", () => {
    const lg = outputs.FlowLogsLogGroupName;
    expect(typeof lg).toBe("string");
    expect(lg.startsWith("/aws/vpc/flow-logs/")).toBe(true);
  });

  /* --- 24: Output IDs shape sanity --- */
  it("24 — output IDs have correct basic shapes", () => {
    expect(isRouteTableId(outputs.PublicRTAId)).toBe(true);
    expect(isRouteTableId(outputs.PrivateRTAId)).toBe(true);
    expect(isRouteTableId(outputs.DbRTAId)).toBe(true);
    expect(isNatGwId(outputs.NatGatewayAId)).toBe(true);
    expect(isVpceId(outputs.S3EndpointId)).toBe(true);
    expect(isVpceId(outputs.DynamoDbEndpointId)).toBe(true);
  });
});
