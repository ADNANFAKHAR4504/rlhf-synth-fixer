// tests/terraform.int.test.ts
// LIVE integration tests (EC2/VPC/NAT/Routes/SG + PEM sanity) using Terraform structured outputs.
// No Terraform CLI. Requires AWS creds with READ permissions.
// Run: npx jest --runInBand --detectOpenHandles --testTimeout=180000
// Tip: You don't need to set AWS_REGION; tests auto-discover region from vpc_id.

import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  IpPermission,
  RouteTable,
  InternetGateway,
  NatGateway,
} from "@aws-sdk/client-ec2";

/* ----------------------------- Utilities ----------------------------- */

type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  bastion_private_key_pem?: TfOutputValue<string>;
  bastion_public_ip?: TfOutputValue<string>;
  private_instance_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  public_subnet_ids?: TfOutputValue<string[]>;
  vpc_id?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  const vpcId = out.vpc_id?.value;
  const bastionIp = out.bastion_public_ip?.value;
  const privateInstanceIds = out.private_instance_ids?.value || [];
  const publicSubnetIds = out.public_subnet_ids?.value || [];
  const privateSubnetIds = out.private_subnet_ids?.value || [];
  const bastionPrivateKeyPem = out.bastion_private_key_pem?.value;

  if (!vpcId) throw new Error("vpc_id.value missing in outputs");
  if (!bastionIp) throw new Error("bastion_public_ip.value missing in outputs");
  if (!publicSubnetIds.length) throw new Error("public_subnet_ids.value missing/empty");
  if (!privateSubnetIds.length) throw new Error("private_subnet_ids.value missing/empty");
  if (!privateInstanceIds.length) throw new Error("private_instance_ids.value missing/empty");
  if (!bastionPrivateKeyPem) throw new Error("bastion_private_key_pem.value missing");

  return { vpcId, bastionIp, privateInstanceIds, publicSubnetIds, privateSubnetIds, bastionPrivateKeyPem };
}

function sanitizeOutputsForLog(rawJson: string): string {
  // Redact the PEM body for safety while keeping headers/footers visible
  return rawJson.replace(
    /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
    "-----BEGIN RSA PRIVATE KEY-----\n***REDACTED***\n-----END RSA PRIVATE KEY-----"
  );
}

async function retry<T>(fn: () => Promise<T>, attempts = 12, baseMs = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.7, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function assertDefined<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

/* ----------------------------- Region autodiscovery ----------------------------- */

const o = readStructuredOutputs();
let REGION: string;               // discovered region for the given VPC
let ec2: EC2Client;               // single shared client

async function discoverRegionForVpc(vpcId: string): Promise<string> {
  // Candidate regions: env first (if set), then likely US regions (incl. us-west-2, which your TF defaults to)
  const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const candidates = Array.from(
    new Set(
      [
        envRegion,
        "us-west-2",
        "us-east-1",
        "us-east-2",
        "us-west-1",
        // Add more if you deploy elsewhere often:
        "eu-west-1",
        "eu-central-1",
      ].filter(Boolean) as string[]
    )
  );

  for (const r of candidates) {
    const probe = new EC2Client({ region: r });
    try {
      const v = await probe.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if ((v.Vpcs || []).length > 0) {
        probe.destroy();
        return r;
      }
    } catch (e: any) {
      // Ignore InvalidVpcID.NotFound / AuthZ issues and try next region
      // console.debug(`Region probe ${r} failed:`, e?.name || e?.Code || e?.message);
    } finally {
      // don't leak sockets
      try { probe.destroy(); } catch {}
    }
  }

  throw new Error(
    `Could not locate VPC ${vpcId} in candidate regions: ${candidates.join(", ")}. ` +
    `Set AWS_REGION or extend the candidates list.`
  );
}

/* ----------------------------- Helpers depending on EC2 client ----------------------------- */

function hasDefaultRouteToGateway(rt: RouteTable, gwType: "igw" | "nat") {
  for (const r of rt.Routes || []) {
    if (r.DestinationCidrBlock === "0.0.0.0/0") {
      if (gwType === "igw" && r.GatewayId && r.GatewayId.startsWith("igw-")) return true;
      if (gwType === "nat" && r.NatGatewayId && r.NatGatewayId.startsWith("nat-")) return true;
    }
  }
  return false;
}

function portRangeMatch(p: IpPermission, port: number) {
  return p.IpProtocol === "tcp" && p.FromPort === port && p.ToPort === port;
}

function pickFirstInstance(res: any) {
  for (const r of res.Reservations || []) {
    for (const i of r.Instances || []) return i;
  }
  return undefined;
}

/** Robust bastion discovery: try by public IP, then by tag+VPC (fallback). */
async function findBastionInstance() {
  // Strategy 1: by public IPv4
  const res1 = await retry(() =>
    ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "ip-address", Values: [o.bastionIp] }],
      })
    )
  );
  let inst = pickFirstInstance(res1);
  if (inst) return inst;

  // Strategy 2: by network-interface association public-ip
  const res2 = await retry(() =>
    ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "network-interface.addresses.association.public-ip", Values: [o.bastionIp] }],
      })
    )
  );
  inst = pickFirstInstance(res2);
  if (inst) return inst;

  // Strategy 3: by tag Name within the VPC
  const res3 = await retry(() =>
    ec2.send(
      new DescribeInstancesCommand({
        Filters: [
          { Name: "tag:Name", Values: ["project-bastion"] },
          { Name: "vpc-id", Values: [o.vpcId] },
        ],
      })
    )
  );
  inst = pickFirstInstance(res3);
  if (inst) return inst;

  throw new Error(
    `Bastion instance not found. Tried by public-ip=${o.bastionIp}, NI association, and tag:Name=project-bastion in VPC ${o.vpcId}. ` +
      `Resolved region is ${REGION}. Ensure instance is running and IP/VPC match.`
  );
}

/** Map subnetId -> route tables, and get VPC main table (for subnets without explicit assoc). */
function indexRouteTables(rtRes: { RouteTables?: RouteTable[] }) {
  const rtBySubnet: Record<string, RouteTable[]> = {};
  let mainRt: RouteTable | undefined;
  for (const rt of rtRes.RouteTables || []) {
    for (const assoc of rt.Associations || []) {
      if (assoc.Main) mainRt = rt;
      if (assoc.SubnetId) (rtBySubnet[assoc.SubnetId] ||= []).push(rt);
    }
  }
  return { rtBySubnet, mainRt };
}

/* ----------------------------- Tests ----------------------------- */

describe("LIVE: Terraform-provisioned network & compute (from structured outputs)", () => {
  const TEST_TIMEOUT = 120_000; // 120s per test

  beforeAll(async () => {
    // Debug stage: echo the outputs JSON (PEM redacted) so you can cross-check values
    const raw = fs.readFileSync(path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"), "utf8");
    console.info("\n--- Loaded cfn-outputs/all-outputs.json ---\n" + sanitizeOutputsForLog(raw) + "\n-------------------------------------------\n");

    // Autodiscover correct region from the VPC ID so we don't fail on env misconfig
    REGION = await discoverRegionForVpc(o.vpcId);
    ec2 = new EC2Client({ region: REGION });
    console.info(`Using region: ${REGION}`);
  });

  afterAll(async () => {
    try { ec2.destroy(); } catch {}
  });

  test(
    "Bastion instance exists by public IP (or tag fallback), is t3.micro, in public subnet, tagged",
    async () => {
      const inst = await findBastionInstance();

      const pubIp = assertDefined(inst.PublicIpAddress, `Bastion ${inst.InstanceId} has no PublicIpAddress`);
      expect(pubIp).toBe(o.bastionIp);

      expect(inst.InstanceType).toBe("t3.micro");
      expect((inst.SecurityGroups || []).length).toBeGreaterThan(0);
      expect(o.publicSubnetIds).toContain(inst.SubnetId);

      const tags: Record<string, string> = {};
      for (const t of inst.Tags || []) if (t.Key && typeof t.Value === "string") tags[t.Key] = t.Value;
      expect(tags["Name"]).toBe("project-bastion");
    },
    TEST_TIMEOUT
  );

  test(
    "Private instances exist, no public IPs, t3.micro, in private subnets, with name tags",
    async () => {
      const res = await retry(() =>
        ec2.send(new DescribeInstancesCommand({ InstanceIds: o.privateInstanceIds }))
      );

      const instances = (res.Reservations || []).flatMap((r) => r.Instances || []);
      expect(instances.length).toBe(o.privateInstanceIds.length);

      for (const i of instances) {
        expect(!!i.PublicIpAddress).toBe(false); // no public IP
        expect(i.InstanceType).toBe("t3.micro");
        expect(o.privateSubnetIds).toContain(i.SubnetId);

        const tags: Record<string, string> = {};
        for (const t of i.Tags || []) if (t.Key && typeof t.Value === "string") tags[t.Key] = t.Value;
        expect((tags["Name"] || "").startsWith("project-private-")).toBe(true);
      }
    },
    TEST_TIMEOUT
  );

  test(
    "VPC has IGW attached; NAT exists in first public subnet; routes are correct (public→IGW, private→NAT)",
    async () => {
      // IGW attached
      const igwRes = await retry(() =>
        ec2.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: "attachment.vpc-id", Values: [o.vpcId] }],
          })
        )
      );
      let igw: InternetGateway | undefined = (igwRes.InternetGateways || [])[0];

      if (!igw) {
        const igwResAll = await retry(() => ec2.send(new DescribeInternetGatewaysCommand({})));
        igw = (igwResAll.InternetGateways || []).find((g) =>
          (g.Attachments || []).some((a) => a.VpcId === o.vpcId)
        );
      }
      const igwChecked = assertDefined(
        igw,
        `No Internet Gateway attached to VPC ${o.vpcId} in region ${REGION}`
      );
      expect((igwChecked.Attachments || [])[0]?.VpcId).toBe(o.vpcId);

      // NAT in first public subnet
      const natRes = await retry(() =>
        ec2.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: "subnet-id", Values: [o.publicSubnetIds[0]] }],
          })
        )
      );
      const nat: NatGateway | undefined = (natRes.NatGateways || [])[0];
      const natChecked = assertDefined(
        nat,
        `NAT Gateway not found in public subnet ${o.publicSubnetIds[0]} (region ${REGION}). ` +
          `If NAT is elsewhere, check Terraform (aws_nat_gateway.subnet_id).`
      );
      expect(["available", "pending"]).toContain(natChecked.State);

      // Route tables
      const rtRes = await retry(() =>
        ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [o.vpcId] }] }))
      );
      const { rtBySubnet, mainRt } = indexRouteTables(rtRes);

      // Public subnets: default route to IGW (associated or main RT)
      for (const sid of o.publicSubnetIds) {
        const rts = rtBySubnet[sid] && rtBySubnet[sid].length ? rtBySubnet[sid] : mainRt ? [mainRt] : [];
        if (rts.length === 0) {
          throw new Error(`No route table association for public subnet ${sid}, and no VPC main table.`);
        }
        const hasIGW = rts.some((rt) => hasDefaultRouteToGateway(rt, "igw"));
        expect(hasIGW).toBe(true);
      }

      // Private subnets: default route to NAT (associated or main RT)
      for (const sid of o.privateSubnetIds) {
        const rts = rtBySubnet[sid] && rtBySubnet[sid].length ? rtBySubnet[sid] : mainRt ? [mainRt] : [];
        if (rts.length === 0) {
          throw new Error(`No route table association for private subnet ${sid}, and no VPC main table.`);
        }
        const hasNAT = rts.some((rt) => hasDefaultRouteToGateway(rt, "nat"));
        expect(hasNAT).toBe(true);
      }

      // Subnets belong to the VPC
      const subRes = await retry(() =>
        ec2.send(
          new DescribeSubnetsCommand({
            SubnetIds: [...o.publicSubnetIds, ...o.privateSubnetIds],
          })
        )
      );
      for (const s of subRes.Subnets || []) {
        expect(s.VpcId).toBe(o.vpcId);
      }
    },
    TEST_TIMEOUT
  );

  test(
    "Security groups: bastion (22 open to world), private (22 from bastion SG only), both full egress",
    async () => {
      // Bastion SG
      const bastion = await findBastionInstance();
      const bastionSgId = assertDefined(
        bastion.SecurityGroups?.[0]?.GroupId,
        `Bastion instance ${bastion.InstanceId} has no attached security group.`
      );

      const bastionSgRes = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId] }))
      );
      const bastionSg = assertDefined(
        bastionSgRes.SecurityGroups?.[0],
        `Security group ${bastionSgId} not found`
      );

      // Name check is nice-to-have (don't fail if name drifted)
      if (bastionSg.GroupName) expect(bastionSg.GroupName).toBe("project-bastion-sg");

      const bastionIngress = bastionSg.IpPermissions || [];
      const bastionSSH = bastionIngress.find((p) => portRangeMatch(p, 22));
      expect(bastionSSH).toBeTruthy();

      const v4Open = (bastionSSH!.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0");
      const v6Open = (bastionSSH!.Ipv6Ranges || []).some((r) => r.CidrIpv6 === "::/0");
      expect(v4Open).toBe(true);
      expect(v6Open).toBe(true);

      const bastionEgress = bastionSg.IpPermissionsEgress || [];
      expect(bastionEgress.some((p) => p.IpProtocol === "-1")).toBe(true);

      // Private SG from a real private instance
      const privRes = await retry(() =>
        ec2.send(new DescribeInstancesCommand({ InstanceIds: [o.privateInstanceIds[0]] }))
      );
      const firstPriv = assertDefined(
        (privRes.Reservations || []).flatMap((r) => r.Instances || [])[0],
        `Private instance ${o.privateInstanceIds[0]} not found`
      );
      const privateSgId = assertDefined(
        firstPriv.SecurityGroups?.[0]?.GroupId,
        `Private instance ${firstPriv.InstanceId} has no security group`
      );

      const privateSgRes = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [privateSgId] }))
      );
      const privateSg = assertDefined(
        privateSgRes.SecurityGroups?.[0],
        `Security group ${privateSgId} not found`
      );

      if (privateSg.GroupName) expect(privateSg.GroupName).toBe("project-private-sg");

      const privIngress = privateSg.IpPermissions || [];
      const privSSH = privIngress.find((p) => portRangeMatch(p, 22));
      expect(privSSH).toBeTruthy();

      const fromGroups = privSSH!.UserIdGroupPairs || [];
      const allowsFromBastion = fromGroups.some((g) => g.GroupId === bastionSgId);
      expect(allowsFromBastion).toBe(true);

      const privEgress = privateSg.IpPermissionsEgress || [];
      expect(privEgress.some((p) => p.IpProtocol === "-1")).toBe(true);
    },
    TEST_TIMEOUT
  );

  test(
    "Bastion private key PEM has RSA header/footer and plausible length",
    () => {
      const pem = o.bastionPrivateKeyPem;
      expect(pem.startsWith("-----BEGIN RSA PRIVATE KEY-----")).toBe(true);
      expect(pem.trim().endsWith("-----END RSA PRIVATE KEY-----")).toBe(true);
      expect(Buffer.from(pem, "utf8").length).toBeGreaterThan(1200);
    },
    10_000
  );
});
