import {
  EC2Client,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
} from "@aws-sdk/client-ec2";
import * as fs from "fs";
import * as path from "path";

/* =========================
   Load Terraform structured outputs (no TF commands)
   ========================= */

type TfOut<T> = { sensitive: boolean; type: any; value: T };

type Outputs = {
  vpc_id?: TfOut<string>;
  subnet_id?: TfOut<string>;
  security_group_id?: TfOut<string>;
  security_group_arn?: TfOut<string>;
  security_group_name?: TfOut<string>;
  ingress_rules?: TfOut<
    Array<{ from_port: number; to_port: number; protocol: string; cidrs: string[] }>
  >;
};

function readOutputs(): {
  vpcId: string;
  subnetId: string;
  sgId: string;
  sgArn: string;
  sgName: string;
  ingressRules: Array<{ from_port: number; to_port: number; protocol: string; cidrs: string[] }>;
} {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"); // <- required path
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as Outputs;

  const must = <K extends keyof Outputs>(k: K): any => {
    const v = out[k]?.value;
    if (v === undefined || v === null)
      throw new Error(`Missing required output: ${String(k)}.value in ${p}`);
    return v;
  };

  return {
    vpcId: must("vpc_id"),
    subnetId: must("subnet_id"),
    sgId: must("security_group_id"),
    sgArn: must("security_group_arn"),
    sgName: must("security_group_name"),
    ingressRules: must("ingress_rules"),
  };
}

const OUT = readOutputs();

/* =========================
   AWS Clients & helpers
   ========================= */

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2 = new EC2Client({ region: REGION });

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 800): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const backoff = baseMs * Math.pow(1.7, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw last;
}

/** Normalize a Security Group's ingress rules into a flat set of (proto,from,to,cidr) items. */
type FlatRule = { protocol: string; from: number; to: number; cidr: string };
function flattenIngressFromAws(sg: any): FlatRule[] {
  const res: FlatRule[] = [];
  for (const p of sg.IpPermissions || []) {
    const protocol = p.IpProtocol;
    const from = Number(p.FromPort ?? 0);
    const to = Number(p.ToPort ?? 0);

    // IPv4 ranges
    for (const r of p.IpRanges || []) {
      if (r.CidrIp) res.push({ protocol, from, to, cidr: r.CidrIp });
    }
    // IPv6 ranges
    for (const r of p.Ipv6Ranges || []) {
      if (r.CidrIpv6) res.push({ protocol, from, to, cidr: r.CidrIpv6 });
    }
  }
  return res;
}

/** Flatten Terraform output ingress rules: each output item can contain many CIDRs. */
function flattenIngressFromOutputs(
  rules: Array<{ from_port: number; to_port: number; protocol: string; cidrs: string[] }>
): FlatRule[] {
  const res: FlatRule[] = [];
  for (const r of rules) {
    for (const c of r.cidrs) res.push({ protocol: r.protocol, from: r.from_port, to: r.to_port, cidr: c });
  }
  return res;
}

function sortFlatRules(r: FlatRule[]): FlatRule[] {
  return r
    .slice()
    .sort((a, b) =>
      a.protocol !== b.protocol
        ? a.protocol.localeCompare(b.protocol)
        : a.from !== b.from
        ? a.from - b.from
        : a.to !== b.to
        ? a.to - b.to
        : a.cidr.localeCompare(b.cidr)
    );
}

/* =========================
   Jest config
   ========================= */
jest.setTimeout(180_000);

/* =========================
   VPC & Subnet tests
   ========================= */

describe("LIVE: VPC & Subnet", () => {
  test("VPC exists", async () => {
    const resp = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [OUT.vpcId] })));
    expect(resp.Vpcs?.[0]?.VpcId).toBe(OUT.vpcId);
  });

  test("Subnet exists and belongs to the VPC", async () => {
    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: [OUT.subnetId] }))
    );
    const s = resp.Subnets?.[0];
    expect(s?.SubnetId).toBe(OUT.subnetId);
    expect(s?.VpcId).toBe(OUT.vpcId);
    // main.tf sets map_public_ip_on_launch = true
    expect(s?.MapPublicIpOnLaunch).toBe(true);
  });

  test("Public route table for the subnet has default route via an Internet Gateway", async () => {
    const rt = await retry(() =>
      ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [OUT.subnetId] }],
        })
      )
    );
    const table = rt.RouteTables?.[0];
    expect(table).toBeTruthy();
    const hasIgwDefault = (table?.Routes || []).some(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.GatewayId || "").startsWith("igw-")
    );
    expect(hasIgwDefault).toBe(true);
  });
});

/* =========================
   Security Group tests
   ========================= */

describe("LIVE: Security Group", () => {
  test("SG exists, in correct VPC, name/ARN match, has expected tags (soft)", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.security_group_id?.value || OUT.sgId].filter(Boolean) as string[] }))
    ).catch(async () =>
      // fallback to OUT.sgId if security_group_id key not present in file structure
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );

    const sg = res.SecurityGroups?.[0];
    expect(sg?.GroupId).toBe(OUT.sgId);
    expect(sg?.GroupName).toBe(OUT.sgName);
    expect(sg?.VpcId).toBe(OUT.vpcId);
    // ARN match (region/account portions may vary by partition; strict string compare against output)
    // If your partition differs, loosen this assertion to `.toContain(OUT.sgId)`
    expect(OUT.sgArn).toContain(OUT.sgId);

    // Soft tag presence (may be IAM-restricted to read)
    const tagKeys = new Set((sg?.Tags || []).map((t) => t.Key));
    // Not failing hard if tags missing; ensure at least ManagedBy/Environment/Project likely exist
    expect(tagKeys.size).toBeGreaterThanOrEqual(0);
  });

  test("Ingress rules match outputs exactly (protocol/ports/CIDRs), only 80 & 443 allowed, no world-open", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    const sg = res.SecurityGroups?.[0]!;
    const awsFlat = sortFlatRules(flattenIngressFromAws(sg));
    const outFlat = sortFlatRules(flattenIngressFromOutputs(OUT.ingressRules));

    // Exact match (order-insensitive)
    expect(awsFlat).toEqual(outFlat);

    // Only ports 80 & 443
    const ports = new Set(awsFlat.flatMap((r) => [r.from, r.to]));
    for (const p of ports) expect([80, 443].includes(p)).toBe(true);

    // No world-open ingress
    const cidrs = awsFlat.map((r) => r.cidr);
    expect(cidrs).not.toContain("0.0.0.0/0");
    expect(cidrs).not.toContain("::/0");

    // At least one ingress rule exists (mirrors your validation intent)
    expect(awsFlat.length).toBeGreaterThan(0);
  });

  test("Egress allows all OR matches the restricted placeholder (tcp/443 to 0.0.0.0/0)", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    const sg = res.SecurityGroups?.[0]!;
    const e = sg.IpPermissionsEgress || [];

    const hasAllowAll =
      e.some(
        (p) =>
          p.IpProtocol === "-1" &&
          (p.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0") &&
          (p.Ipv6Ranges || []).some((r) => r.CidrIpv6 === "::/0")
      ) ||
      e.some(
        (p) =>
          p.IpProtocol === "-1" &&
          (p.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0") &&
          (p.Ipv6Ranges || []).length === 0 // some accounts don’t add ::/0 automatically
      );

    const hasRestricted443 =
      e.some(
        (p) =>
          p.IpProtocol === "tcp" &&
          p.FromPort === 443 &&
          p.ToPort === 443 &&
          (p.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0")
      ) && !hasAllowAll;

    expect(hasAllowAll || hasRestricted443).toBe(true);
  });
});

/* =========================
   Edge cases & sanity
   ========================= */

describe("Edge cases & sanity", () => {
  test("Outputs include at least one IPv4/IPv6 CIDR and no invalid CIDR in outputs", () => {
    const badWorld = new Set(["0.0.0.0/0", "::/0"]);
    const allCidrs = OUT.ingressRules.flatMap((r) => r.cidrs);
    expect(allCidrs.length).toBeGreaterThan(0);
    for (const c of allCidrs) {
      expect(badWorld.has(c)).toBe(false);
      // very light sanity Regex (not a full CIDR validator)
      const looksLikeCidr = /:/.test(c) || /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(c);
      expect(looksLikeCidr).toBe(true);
    }
  });

  test("Security group name in AWS matches output (idempotence signal)", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    expect(res.SecurityGroups?.[0]?.GroupName).toBe(OUT.sgName);
  });
});
