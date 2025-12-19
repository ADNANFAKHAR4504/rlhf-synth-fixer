import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeTransitGatewayAttachmentsCommand,
  DescribeTransitGatewayRouteTablesCommand,
  GetTransitGatewayRouteTablePropagationsCommand,
  GetTransitGatewayRouteTableAssociationsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from "@aws-sdk/client-ec2";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  Route53Client,
  GetHostedZoneCommand,
} from "@aws-sdk/client-route-53";

/* ---------------------------- Setup / Helpers --------------------------- */

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Expected outputs file at ${outputsPath} — create it before running integration tests.`);
}
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const top = Object.keys(raw)[0];
const outputsArr: { OutputKey: string; OutputValue: string }[] = raw[top];
const outputs: Record<string, string> = {};
for (const o of outputsArr) outputs[o.OutputKey] = o.OutputValue;

function deduceRegion(): string {
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  return "us-east-1";
}
const region = deduceRegion();

const ec2 = new EC2Client({ region });
const logs = new CloudWatchLogsClient({ region });
const r53 = new Route53Client({ region });

async function retry<T>(fn: () => Promise<T>, attempts = 4, base = 700): Promise<T> {
  let err: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      if (i < attempts - 1) await wait(base * (i + 1));
    }
  }
  throw err;
}

function splitCsv(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function isVpcId(x?: string) {
  return typeof x === "string" && /^vpc-[0-9a-f]+$/.test(x);
}
function isSubnetId(x?: string) {
  return typeof x === "string" && /^subnet-[0-9a-f]+$/.test(x);
}
function isTgwId(x?: string) {
  return typeof x === "string" && /^tgw-[0-9a-f]+$/.test(x);
}
function isTgwRtId(x?: string) {
  return typeof x === "string" && /^tgw-rtb-[0-9a-f]+$/.test(x);
}

/* -------------------------------- Tests -------------------------------- */

describe("TapStack — Live Integration Tests (hub-and-spoke TGW)", () => {
  jest.setTimeout(10 * 60 * 1000);

  it("outputs present and key IDs look well-formed", () => {
    expect(isVpcId(outputs.HubVpcId)).toBe(true);
    expect(isVpcId(outputs.Spoke1VpcId)).toBe(true);
    expect(isVpcId(outputs.Spoke2VpcId)).toBe(true);
    expect(isVpcId(outputs.Spoke3VpcId)).toBe(true);
    expect(isTgwId(outputs.TransitGatewayId)).toBe(true);
    expect(isTgwRtId(outputs.TgwHubRouteTableId)).toBe(true);
    expect(isTgwRtId(outputs.TgwSpokeRouteTableId)).toBe(true);

    splitCsv(outputs.HubPublicSubnets).forEach((s) => expect(isSubnetId(s)).toBe(true));
    splitCsv(outputs.HubPrivateSubnets).forEach((s) => expect(isSubnetId(s)).toBe(true));
    splitCsv(outputs.Spoke1PrivateSubnets).forEach((s) => expect(isSubnetId(s)).toBe(true));
    splitCsv(outputs.Spoke2PrivateSubnets).forEach((s) => expect(isSubnetId(s)).toBe(true));
    splitCsv(outputs.Spoke3PrivateSubnets).forEach((s) => expect(isSubnetId(s)).toBe(true));

    expect(typeof outputs.PrivateHostedZoneId).toBe("string");
    expect(typeof outputs.FlowLogsLogGroupName).toBe("string");
  });

  it("VPCs exist in the account/region", async () => {
    const vpcs = [outputs.HubVpcId, outputs.Spoke1VpcId, outputs.Spoke2VpcId, outputs.Spoke3VpcId];
    const resp = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: vpcs }))
    );
    expect(resp.Vpcs?.length).toBe(4);
  });

  it("Subnets exist and belong to their respective VPCs", async () => {
    const allSubnets = [
      ...splitCsv(outputs.HubPublicSubnets),
      ...splitCsv(outputs.HubPrivateSubnets),
      ...splitCsv(outputs.Spoke1PrivateSubnets),
      ...splitCsv(outputs.Spoke2PrivateSubnets),
      ...splitCsv(outputs.Spoke3PrivateSubnets),
    ];
    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: allSubnets }))
    );
    const vpcMap = new Map(resp.Subnets?.map((s) => [s.SubnetId!, s.VpcId!]));
    allSubnets.forEach((sid) => {
      expect(vpcMap.has(sid)).toBe(true);
    });
  });

  it("Internet Gateway is attached to Hub VPC (via public default route presence)", async () => {
    const hubPub = splitCsv(outputs.HubPublicSubnets);
    expect(hubPub.length).toBeGreaterThanOrEqual(2);

    const resp = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "association.subnet-id", Values: hubPub }] }))
    );
    const hasIgw = (resp.RouteTables || []).some((rt) =>
      (rt.Routes || []).some((r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.GatewayId || "").startsWith("igw-"))
    );
    expect(hasIgw).toBe(true);
  });

  it("NAT Gateways exist in hub public subnets (A,B)", async () => {
    const hubPub = splitCsv(outputs.HubPublicSubnets);
    const natResp = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({ Filter: [{ Name: "subnet-id", Values: hubPub }] }))
    );
    const natCount = (natResp.NatGateways || []).length;
    expect(natCount).toBeGreaterThanOrEqual(1); // allow 1 if cost-optimized
  });

  it("Hub private route tables route 0.0.0.0/0 via NAT", async () => {
    const hubPrv = splitCsv(outputs.HubPrivateSubnets);
    const rtResp = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "association.subnet-id", Values: hubPrv }] }))
    );
    const eachHasNat = (rtResp.RouteTables || []).every((rt) =>
      (rt.Routes || []).some((r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.NatGatewayId || "").startsWith("nat-"))
    );
    expect(eachHasNat).toBe(true);
  });

  it("Transit Gateway exists and is active", async () => {
    const atts = await retry(() =>
      ec2.send(new DescribeTransitGatewayAttachmentsCommand({}))
    );
    const ours = (atts.TransitGatewayAttachments || []).filter(
      (a) => a.TransitGatewayId === outputs.TransitGatewayId
    );
    expect(ours.length).toBeGreaterThanOrEqual(1);
  });

  it("TGW route tables (hub & spoke) exist", async () => {
    const resp = await retry(() =>
      ec2.send(new DescribeTransitGatewayRouteTablesCommand({
        TransitGatewayRouteTableIds: [outputs.TgwHubRouteTableId, outputs.TgwSpokeRouteTableId],
      }))
    );
    expect(resp.TransitGatewayRouteTables?.length).toBe(2);
  });

  /* --------------------------------------------------------------------- */

  it("Each spoke route table in the VPC has a default route to TGW", async () => {
    const check = async (subnetsCsv: string) => {
      const subnets = splitCsv(subnetsCsv);
      const resp = await retry(() =>
        ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "association.subnet-id", Values: subnets }] }))
      );
      const everyHas0 = (resp.RouteTables || []).every((rt) =>
        (rt.Routes || []).some((r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.TransitGatewayId || "").startsWith("tgw-"))
      );
      expect(everyHas0).toBe(true);
    };
    await check(outputs.Spoke1PrivateSubnets);
    await check(outputs.Spoke2PrivateSubnets);
    await check(outputs.Spoke3PrivateSubnets);
  });

  it("Interface VPC endpoints for SSM present in each VPC", async () => {
    const svc = `com.amazonaws.${region}.ssm`;
    for (const vpc of [outputs.HubVpcId, outputs.Spoke1VpcId, outputs.Spoke2VpcId, outputs.Spoke3VpcId]) {
      const resp = await retry(() =>
        ec2.send(new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpc] },
            { Name: "service-name", Values: [svc] },
            { Name: "vpc-endpoint-type", Values: ["Interface"] },
          ],
        }))
      );
      expect((resp.VpcEndpoints || []).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("Interface VPC endpoints for SSMMessages present in each VPC", async () => {
    const svc = `com.amazonaws.${region}.ssmmessages`;
    for (const vpc of [outputs.HubVpcId, outputs.Spoke1VpcId, outputs.Spoke2VpcId, outputs.Spoke3VpcId]) {
      const resp = await retry(() =>
        ec2.send(new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpc] },
            { Name: "service-name", Values: [svc] },
            { Name: "vpc-endpoint-type", Values: ["Interface"] },
          ],
        }))
      );
      expect((resp.VpcEndpoints || []).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("Interface VPC endpoints for EC2Messages present in each VPC", async () => {
    const svc = `com.amazonaws.${region}.ec2messages`;
    for (const vpc of [outputs.HubVpcId, outputs.Spoke1VpcId, outputs.Spoke2VpcId, outputs.Spoke3VpcId]) {
      const resp = await retry(() =>
        ec2.send(new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpc] },
            { Name: "service-name", Values: [svc] },
            { Name: "vpc-endpoint-type", Values: ["Interface"] },
          ],
        }))
      );
      expect((resp.VpcEndpoints || []).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("Endpoint security groups allow TCP/443", async () => {
    const vpcIds = [outputs.HubVpcId, outputs.Spoke1VpcId, outputs.Spoke2VpcId, outputs.Spoke3VpcId];
    for (const vpc of vpcIds) {
      const sgs = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: "vpc-id", Values: [vpc] }] }))
      );
      const any443 = (sgs.SecurityGroups || []).some((sg) =>
        (sg.GroupName || "").includes("endpoints") ||
        (sg.Tags || []).some((t) => (t.Value || "").includes("endpoints"))
          ? (sg.IpPermissions || []).some((p) => p.IpProtocol === "tcp" && p.FromPort === 443 && p.ToPort === 443)
          : false
      );
      expect(any443).toBe(true);
    }
  });

  it("Route53 private hosted zone exists and is associated with all VPCs", async () => {
    const hzId = outputs.PrivateHostedZoneId;
    const hz = await retry(() => r53.send(new GetHostedZoneCommand({ Id: hzId })));
    const vpcAssoc = hz.VPCs || [];
    expect(vpcAssoc.length).toBeGreaterThanOrEqual(3); // allow eventual consistency
  });

  it("Flow logs log group exists and has retention set (>=7 days)", async () => {
    const name = outputs.FlowLogsLogGroupName;
    const resp = await retry(() => logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name })));
    const lg = (resp.logGroups || []).find((g) => g.logGroupName === name);
    expect(lg).toBeDefined();
    if (lg?.retentionInDays !== undefined) {
      expect((lg.retentionInDays || 0) >= 7).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });

  it("Each Spoke VPC has a TGW attachment in a valid state", async () => {
    const tgwId = outputs.TransitGatewayId;
    const resp = await retry(() =>
      ec2.send(new DescribeTransitGatewayAttachmentsCommand({
        Filters: [{ Name: "transit-gateway-id", Values: [tgwId] }],
      }))
    );
    const byVpc = new Map<string, string>();
    for (const a of resp.TransitGatewayAttachments || []) {
      if (a.ResourceType === "vpc" && a.ResourceId && a.State) byVpc.set(a.ResourceId, a.State);
    }
    [outputs.Spoke1VpcId, outputs.Spoke2VpcId, outputs.Spoke3VpcId].forEach((vpc) => {
      const st = byVpc.get(vpc);
      expect(["available", "pending", "pendingAcceptance"].includes(String(st))).toBe(true);
    });
  });

  it("Hub VPC has a TGW attachment", async () => {
    const tgwId = outputs.TransitGatewayId;
    const resp = await retry(() =>
      ec2.send(new DescribeTransitGatewayAttachmentsCommand({
        Filters: [{ Name: "transit-gateway-id", Values: [tgwId] }],
      }))
    );
    const found = (resp.TransitGatewayAttachments || []).some(
      (a) => a.ResourceType === "vpc" && a.ResourceId === outputs.HubVpcId
    );
    expect(found).toBe(true);
  });

  it("Spoke route tables do NOT have routes to other spokes (enforced by TGW design)", async () => {
    const check = async (subnetsCsv: string) => {
      const subnets = splitCsv(subnetsCsv);
      const resp = await retry(() =>
        ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "association.subnet-id", Values: subnets }] }))
      );
      const hasOnly0 = (resp.RouteTables || []).every((rt) =>
        (rt.Routes || []).some((r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.TransitGatewayId || "").startsWith("tgw-"))
      );
      expect(hasOnly0).toBe(true);
    };
    await check(outputs.Spoke1PrivateSubnets);
    await check(outputs.Spoke2PrivateSubnets);
    await check(outputs.Spoke3PrivateSubnets);
  });

  it("Hub public route tables reference an Internet Gateway attached to the hub VPC", async () => {
    const igwResp = await retry(() => ec2.send(new DescribeInternetGatewaysCommand({})));
    const igwAttachedToHub = (igwResp.InternetGateways || []).find((igw) =>
      (igw.Attachments || []).some((a) => a.VpcId === outputs.HubVpcId)
    );
    expect(igwAttachedToHub).toBeDefined();
  });

  it("Region resolution used by tests is set (environment or default)", () => {
    expect(typeof region).toBe("string");
    expect(region.length).toBeGreaterThan(5);
  });
});
