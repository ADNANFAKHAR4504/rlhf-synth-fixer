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

function readOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Outputs;

  const need = <K extends keyof Outputs>(k: K) => {
    const v = raw[k]?.value;
    if (v === undefined || v === null)
      throw new Error(`Missing required output: ${String(k)}.value in ${p}`);
    return v;
  };

  return {
    vpcId: need("vpc_id") as string,
    subnetId: need("subnet_id") as string,
    sgId: need("security_group_id") as string,
    sgArn: need("security_group_arn") as string,
    sgName: need("security_group_name") as string,
    ingressRules: need("ingress_rules") as Array<{
      from_port: number;
      to_port: number;
      protocol: string;
      cidrs: string[];
    }>,
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

/** Normalize SG ingress into flat (proto,from,to,cidr) items. */
type FlatRule = { protocol: string; from: number; to: number; cidr: string };
function flattenIngressFromAws(sg: any): FlatRule[] {
  const res: FlatRule[] = [];
  for (const p of sg.IpPermissions || []) {
    const protocol = p.IpProtocol;
    const from = Number(p.FromPort ?? 0);
    const to = Number(p.ToPort ?? 0);
    for (const r of p.IpRanges || []) if (r.CidrIp) res.push({ protocol, from, to, cidr: r.CidrIp });
    for (const r of p.Ipv6Ranges || []) if (r.CidrIpv6) res.push({ protocol, from, to, cidr: r.CidrIpv6 });
  }
  return res;
}
function flattenIngressFromOutputs(
  rules: Array<{ from_port: number; to_port: number; protocol: string; cidrs: string[] }>
): FlatRule[] {
  const res: FlatRule[] = [];
  for (const r of rules) for (const c of r.cidrs)
    res.push({ protocol: r.protocol, from: r.from_port, to: r.to_port, cidr: c });
  return res;
}
function sortFlatRules(r: FlatRule[]): FlatRule[] {
  return r.slice().sort((a, b) =>
    a.protocol !== b.protocol ? a.protocol.localeCompare(b.protocol)
    : a.from !== b.from ? a.from - b.from
    : a.to !== b.to ? a.to - b.to
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

  test("Subnet exists and belongs to the VPC (public subnet)", async () => {
    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: [OUT.subnetId] }))
    );
    const s = resp.Subnets?.[0];
    expect(s?.SubnetId).toBe(OUT.subnetId);
    expect(s?.VpcId).toBe(OUT.vpcId);
    // In your main.tf: map_public_ip_on_launch = true
    expect(s?.MapPublicIpOnLaunch).toBe(true);
  });

  test("Subnet's route table has 0.0.0.0/0 via an Internet Gateway", async () => {
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
  test("SG exists, in correct VPC, name/ARN consistent", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    const sg = res.SecurityGroups?.[0];
    expect(sg?.GroupId).toBe(OUT.sgId);
    expect(sg?.GroupName).toBe(OUT.sgName);
    expect(sg?.VpcId).toBe(OUT.vpcId);
    // Partitions/accounts vary; require ARN to contain the ID
    expect(OUT.sgArn).toContain(OUT.sgId);
  });

  test("Ingress rules match outputs exactly, only ports 80 & 443, not world-open", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    const sg = res.SecurityGroups?.[0]!;
    const awsFlat = sortFlatRules(flattenIngressFromAws(sg));
    const outFlat = sortFlatRules(flattenIngressFromOutputs(OUT.ingressRules));

    // Exact match (order-insensitive)
    expect(awsFlat).toEqual(outFlat);

    // Only 80 and 443
    const allPorts = new Set<number>(awsFlat.flatMap((r) => [r.from, r.to]));
    for (const p of allPorts) expect([80, 443]).toContain(p);

    // No world-open ingress
    const cidrs = awsFlat.map((r) => r.cidr);
    expect(cidrs).not.toContain("0.0.0.0/0");
    expect(cidrs).not.toContain("::/0");
  });

  test("Egress allows all OR matches restricted placeholder (tcp/443 to 0.0.0.0/0)", async () => {
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
          ((p.Ipv6Ranges || []).some((r) => r.CidrIpv6 === "::/0") || true)
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
  test("Outputs ingress_rules contain at least one CIDR and none are world-open", () => {
    const allCidrs = OUT.ingressRules.flatMap((r) => r.cidrs);
    expect(allCidrs.length).toBeGreaterThan(0);
    for (const c of allCidrs) {
      expect(c).not.toBe("0.0.0.0/0");
      expect(c).not.toBe("::/0");
      // light sanity check: IPv4 CIDR or IPv6 look
      const looksLike =
        /:/.test(c) || /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(c);
      expect(looksLike).toBe(true);
    }
  });
});
