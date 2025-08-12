// tests/terraform.int.test.ts
// LIVE integration tests (EC2/VPC/NAT/Routes/SG + PEM sanity) using Terraform structured outputs.
// No Terraform CLI. Requires AWS creds with READ permissions for EC2/VPC/NAT/RouteTables/Subnets/SG.
// Run: AWS_REGION=us-west-2 npx jest --runInBand --detectOpenHandles

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
  Filter,
  IpPermission,
  RouteTable,
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

const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const o = readStructuredOutputs();
const ec2 = new EC2Client({ region: AWS_REGION });

function pickFirstInstance(res: any) {
  for (const r of res.Reservations || []) {
    for (const i of r.Instances || []) return i;
  }
  return undefined;
}

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

/** Robust bastion discovery: try by public IP, then by tag+VPC (fallback). */
async function findBastionInstance() {
  // Strategy 1: by public IPv4 (covers EIP association + standard public IP)
  const res1 = await retry(() =>
    ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "ip-address", Values: [o.bastionIp] }],
      })
    )
  );
  let inst = pickFirstInstance(res1);
  if (inst) return inst;

  // Strategy 2: by network-interface association public-ip (alternate indexer)
  const res2 = await retry(() =>
    ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "network-interface.addresses.association.public-ip", Values: [o.bastionIp] }],
      })
    )
  );
  inst = pickFirstInstance(res2);
  if (inst) return inst;

  // Strategy 3: by tag Name within the VPC (validate public IP afterward)
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
    `Bastion instance not found. Tried by public-ip=${o.bastionIp}, network-interface association, and tag:Name=project-bastion in VPC ${o.vpcId}. ` +
      `Check region (${AWS_REGION}) and that the instance is running.`
  );
}

/** Get route tables grouped by subnet, and the VPC main route table (for subnets without explicit assoc). */
function indexRouteTables(rtRes: { RouteTables?: RouteTable[] }) {
  const rtBySubnet: Record<string, RouteTable[]> = {};
  let mainRt: RouteTable | undefined;
  for (const rt of rtRes.RouteTables || []) {
    let hasExplicit = false;
    for (const assoc of rt.Associations || []) {
      if (assoc.Main) mainRt = rt;
      if (assoc.SubnetId) {
        hasExplicit = true;
        (rtBySubnet[assoc.SubnetId] ||= []).push(rt);
      }
    }
    // no-op if no explicit associations; main table handled separately
  }
  return { rtBySubnet, mainRt };
}

/* ----------------------------- Tests ----------------------------- */

describe("LIVE: Terraform-provisioned network & compute (from structured outputs)", () => {
  // Give each test ample time (AWS eventual consistency, NAT availability, etc.)
  const TEST_TIMEOUT = 120_000; // 120s per test
  afterAll(async () => {
    ec2.destroy();
  });

  test(
    "Bastion instance exists by public IP (or tag fallback), is t3.micro, in public subnet, tagged",
    async () => {
      const inst = await findBastionInstance();

      // If discovered by tag fallback, still assert the IP matches outputs (drift detector)
      if (inst.PublicIpAddress) {
        expect(inst.PublicIpAddress).toBe(o.bastionIp);
      } else {
        throw new Error(
          `Bastion discovered but has no PublicIpAddress. Expected ${o.bastionIp}. InstanceId=${inst.InstanceId}`
        );
      }

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
      // IGW attached (with fallback if filter yields nothing)
      let igwId: string | undefined;

      const igwTry: Filter[] = [{ Name: "attachment.vpc-id", Values: [o.vpcId] }];
      const igwRes = await retry(() =>
        ec2.send(new DescribeInternetGatewaysCommand({ Filters: igwTry }))
      );
      let igw = (igwRes.InternetGateways || [])[0];

      if (!igw) {
        const igwResAll = await retry(() => ec2.send(new DescribeInternetGatewaysCommand({})));
        igw = (igwResAll.InternetGateways || []).find((g) =>
          (g.Attachments || []).some((a) => a.VpcId === o.vpcId)
        );
      }
      expect(igw).toBeTruthy();
      igwId = igw!.InternetGatewayId;
      expect((igw!.Attachments || [])[0]?.VpcId).toBe(o.vpcId);

      // NAT gateway in first public subnet (as per Terraform code)
      const natRes = await retry(() =>
        ec2.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: "subnet-id", Values: [o.publicSubnetIds[0]] }],
          })
        )
      );
      const nat = (natRes.NatGateways || [])[0];
      if (!nat) {
        // Helpful diagnostic
        throw new Error(
          `NAT Gateway not found in public subnet ${o.publicSubnetIds[0]} (region ${AWS_REGION}). ` +
            `If NAT is in a different subnet, check Terraform config (aws_nat_gateway.subnet_id).`
        );
      }
      expect(["available", "pending"]).toContain(nat.State);

      // Route tables
      const rtRes = await retry(() =>
        ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [o.vpcId] }] }))
      );
      const { rtBySubnet, mainRt } = indexRouteTables(rtRes);
      if (!mainRt) {
        // In almost all VPCs there is one main route table. If not found, we'll still proceed with explicit ones.
        // Not a failure by itself.
      }

      // Public subnets: default route to IGW (in their associated RT or main RT if no explicit assoc)
      for (const sid of o.publicSubnetIds) {
        const rts = rtBySubnet[sid] && rtBySubnet[sid].length ? rtBySubnet[sid] : mainRt ? [mainRt] : [];
        if (rts.length === 0) {
          throw new Error(`No route table association found for public subnet ${sid}, and no VPC main table.`);
        }
        const hasIGW = rts.some((rt) => hasDefaultRouteToGateway(rt, "igw"));
        expect(hasIGW).toBe(true);
      }

      // Private subnets: default route to NAT
      for (const sid of o.privateSubnetIds) {
        const rts = rtBySubnet[sid] && rtBySubnet[sid].length ? rtBySubnet[sid] : mainRt ? [mainRt] : [];
        if (rts.length === 0) {
          throw new Error(`No route table association found for private subnet ${sid}, and no VPC main table.`);
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
      // Bastion SG from discovered bastion instance
      const bastion = await findBastionInstance();
      const bastionSgId = bastion.SecurityGroups?.[0]?.GroupId;
      if (!bastionSgId) {
        throw new Error(
          `Bastion instance ${bastion.InstanceId} has no attached security group.`
        );
      }

      // Bastion SG rules
      const bastionSgRes = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId] }))
      );
      const bastionSg = bastionSgRes.SecurityGroups?.[0]!;
      // Name assertion is nice-to-have; keep informative but not brittle
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

      // Private SG: take it from one of the private instances (actual attachment)
      const privRes = await retry(() =>
        ec2.send(new DescribeInstancesCommand({ InstanceIds: [o.privateInstanceIds[0]] }))
      );
      const firstPriv = (privRes.Reservations || []).flatMap((r) => r.Instances || [])[0];
      if (!firstPriv || !(firstPriv.SecurityGroups || []).length) {
        throw new Error(
          `Private instance ${o.privateInstanceIds[0]} not found or has no security group.`
        );
      }
      const privateSgId = firstPriv.SecurityGroups![0]!.GroupId!;

      const privateSgRes = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [privateSgId] }))
      );
      const privateSg = privateSgRes.SecurityGroups?.[0]!;
      // Optional name assertion
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
