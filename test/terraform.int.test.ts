// tests/int-tests.ts
// LIVE integration tests (EC2/VPC/NAT/Routes/SG + PEM sanity) using Terraform structured outputs.
// NO Terraform CLI usage. Requires AWS creds with READ permissions.
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
  IpPermission,
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

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 800): Promise<T> {
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

function hasDefaultRouteToGateway(rt: any, gwType: "igw" | "nat") {
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

/* ----------------------------- Tests ----------------------------- */

describe("LIVE: Terraform-provisioned network & compute (from structured outputs)", () => {
  /* Bastion EC2 */
  test("Bastion instance exists by public IP, is t3.micro, in public subnet, tagged", async () => {
    const res = await retry(() =>
      ec2.send(
        new DescribeInstancesCommand({
          Filters: [{ Name: "network-interface.addresses.association.public-ip", Values: [o.bastionIp] }],
        })
      )
    );
    const inst = pickFirstInstance(res);
    expect(inst).toBeTruthy();

    expect(inst!.PublicIpAddress).toBe(o.bastionIp);
    expect(inst!.InstanceType).toBe("t3.micro");
    expect((inst!.SecurityGroups || []).length).toBeGreaterThan(0);
    expect(o.publicSubnetIds).toContain(inst!.SubnetId);

    const tags: Record<string, string> = {};
    for (const t of inst!.Tags || []) if (t.Key && typeof t.Value === "string") tags[t.Key] = t.Value;
    expect(tags["Name"]).toBe("project-bastion");
  });

  /* Private EC2 */
  test("Private instances exist, no public IPs, t3.micro, in private subnets, with name tags", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ InstanceIds: o.privateInstanceIds }))
    );
    const instances = (res.Reservations || []).flatMap((r) => r.Instances || []);
    expect(instances.length).toBe(o.privateInstanceIds.length);

    for (const i of instances) {
      expect(i.PublicIpAddress || "").toBe(""); // no public IP
      expect(i.InstanceType).toBe("t3.micro");
      expect(o.privateSubnetIds).toContain(i.SubnetId);

      const tags: Record<string, string> = {};
      for (const t of i.Tags || []) if (t.Key && typeof t.Value === "string") tags[t.Key] = t.Value;
      expect((tags["Name"] || "").startsWith("project-private-")).toBe(true);
    }
  });

  /* VPC, IGW, NAT, Routes, Subnets */
  test("VPC has IGW attached; NAT exists in first public subnet; routes are correct", async () => {
    // IGW attached
    const igwRes = await retry(() =>
      ec2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [o.vpcId] }],
        })
      )
    );
    const igw = (igwRes.InternetGateways || [])[0];
    expect(igw).toBeTruthy();
    expect((igw.Attachments || [])[0]?.VpcId).toBe(o.vpcId);

    // NAT in first public subnet
    const natRes = await retry(() =>
      ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "subnet-id", Values: [o.publicSubnetIds[0]] }], // <-- singular Filter here
        })
      )
    );
    const nat = (natRes.NatGateways || [])[0];
    expect(nat).toBeTruthy();
    expect(nat.SubnetId).toBe(o.publicSubnetIds[0]);
    expect(["available", "pending"]).toContain(nat.State);

    // Route tables: public -> IGW ; private -> NAT
    const rtRes = await retry(() =>
      ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [o.vpcId] }] }))
    );

    const rtBySubnet: Record<string, any[]> = {};
    for (const rt of rtRes.RouteTables || []) {
      for (const assoc of rt.Associations || []) {
        if (assoc.SubnetId) (rtBySubnet[assoc.SubnetId] ||= []).push(rt);
      }
    }

    // Public subnets: default route to IGW
    for (const sid of o.publicSubnetIds) {
      const rts = rtBySubnet[sid] || [];
      expect(rts.length).toBeGreaterThan(0);
      const hasIGW = rts.some((rt) => hasDefaultRouteToGateway(rt, "igw"));
      expect(hasIGW).toBe(true);
    }

    // Private subnets: default route to NAT
    for (const sid of o.privateSubnetIds) {
      const rts = rtBySubnet[sid] || [];
      expect(rts.length).toBeGreaterThan(0);
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
  });

  /* Security Groups */
  test("Security groups: bastion (22 open to world), private (22 from bastion SG only), both full egress", async () => {
    // Discover bastion SG from bastion instance
    const bastionRes = await retry(() =>
      ec2.send(
        new DescribeInstancesCommand({
          Filters: [{ Name: "network-interface.addresses.association.public-ip", Values: [o.bastionIp] }],
        })
      )
    );
    const bastionInst = (bastionRes.Reservations || []).flatMap((r) => r.Instances || [])[0];
    expect(bastionInst).toBeTruthy();
    const bastionSgId = bastionInst.SecurityGroups?.[0]?.GroupId!;
    expect(bastionSgId).toBeTruthy();

    // Bastion SG rules
    const bastionSgRes = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId] }))
    );
    const bastionSg = bastionSgRes.SecurityGroups?.[0]!;
    expect(bastionSg.GroupName).toBe("project-bastion-sg");

    const bastionIngress = bastionSg.IpPermissions || [];
    const bastionSSH = bastionIngress.find((p) => portRangeMatch(p, 22));
    expect(bastionSSH).toBeTruthy();
    const v4Open = (bastionSSH!.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0");
    const v6Open = (bastionSSH!.Ipv6Ranges || []).some((r) => r.CidrIpv6 === "::/0");
    expect(v4Open).toBe(true);
    expect(v6Open).toBe(true);
    const bastionEgress = bastionSg.IpPermissionsEgress || [];
    expect(bastionEgress.some((p) => p.IpProtocol === "-1")).toBe(true);

    // Private SG: locate by name in VPC
    const privateSgRes = await retry(() =>
      ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "group-name", Values: ["project-private-sg"] },
            { Name: "vpc-id", Values: [o.vpcId] },
          ],
        })
      )
    );
    const privateSg = privateSgRes.SecurityGroups?.[0]!;
    expect(privateSg).toBeTruthy();

    const privIngress = privateSg.IpPermissions || [];
    const privSSH = privIngress.find((p) => portRangeMatch(p, 22));
    expect(privSSH).toBeTruthy();
    const fromGroups = privSSH!.UserIdGroupPairs || [];
    const allowsFromBastion = fromGroups.some((g) => g.GroupId === bastionSgId);
    expect(allowsFromBastion).toBe(true);

    const privEgress = privateSg.IpPermissionsEgress || [];
    expect(privEgress.some((p) => p.IpProtocol === "-1")).toBe(true);
  });

  /* PEM sanity */
  test("Bastion private key PEM has RSA header/footer and plausible length", () => {
    const pem = o.bastionPrivateKeyPem;
    expect(pem.startsWith("-----BEGIN RSA PRIVATE KEY-----")).toBe(true);
    expect(pem.trim().endsWith("-----END RSA PRIVATE KEY-----")).toBe(true);
    expect(Buffer.from(pem, "utf8").length).toBeGreaterThan(1200);
  });
});
