// tests/terraform.int.test.ts
// Integration tests for your Terraform infra (VPC, subnets, EC2, SGs, NAT, Secrets Manager)
// Run with: npx jest --runInBand --detectOpenHandles --testTimeout=180000

import * as fs from "fs";
import * as path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  RouteTable,
  InternetGateway,
  NatGateway,
  IpPermission,
} from "@aws-sdk/client-ec2";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

/* ---------------- Utilities ---------------- */
type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  bastion_host_public_ip?: TfOutputValue<string>;
  private_instance_ids?: TfOutputValue<string[]>;
  iam_role_name?: TfOutputValue<string>;
  secrets_manager_secret_arn?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "tf-outputs/all-outputs.json");
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  const vpcId = out.vpc_id?.value;
  const bastionIp = out.bastion_host_public_ip?.value;
  const privateInstanceIds = out.private_instance_ids?.value || [];
  const publicSubnetIds = out.public_subnet_ids?.value || [];
  const privateSubnetIds = out.private_subnet_ids?.value || [];
  const roleName = out.iam_role_name?.value;
  const secretArn = out.secrets_manager_secret_arn?.value;

  if (!vpcId) throw new Error("vpc_id missing");
  if (!bastionIp) throw new Error("bastion_host_public_ip missing");
  if (!publicSubnetIds.length) throw new Error("public_subnet_ids missing");
  if (!privateSubnetIds.length) throw new Error("private_subnet_ids missing");
  if (!privateInstanceIds.length) throw new Error("private_instance_ids missing");
  if (!roleName) throw new Error("iam_role_name missing");
  if (!secretArn) throw new Error("secrets_manager_secret_arn missing");

  return { vpcId, bastionIp, privateInstanceIds, publicSubnetIds, privateSubnetIds, roleName, secretArn };
}

async function retry<T>(fn: () => Promise<T>, attempts = 10, baseMs = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, baseMs * (i + 1)));
    }
  }
  throw lastErr;
}

function hasDefaultRouteToGateway(rt: RouteTable, gwType: "igw" | "nat") {
  return (rt.Routes || []).some((r) => {
    if (r.DestinationCidrBlock !== "0.0.0.0/0") return false;
    if (gwType === "igw") return !!r.GatewayId?.startsWith("igw-");
    if (gwType === "nat") return !!r.NatGatewayId?.startsWith("nat-");
    return false;
  });
}

function portRangeMatch(p: IpPermission, port: number) {
  return p.IpProtocol === "tcp" && p.FromPort === port && p.ToPort === port;
}

/* ---------------- Region autodiscovery ---------------- */
async function discoverRegionForVpc(vpcId: string): Promise<string> {
  const candidates = [
    process.env.AWS_REGION,
    "us-east-1", "us-east-2", "us-west-2", "us-west-1",
    "eu-west-1", "eu-central-1",
  ].filter(Boolean) as string[];

  for (const r of candidates) {
    const client = new EC2Client({ region: r });
    try {
      const res = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if ((res.Vpcs || []).length > 0) {
        await client.destroy();
        return r;
      }
    } catch {}
    await client.destroy();
  }
  throw new Error(`VPC ${vpcId} not found in candidate regions`);
}

/* ---------------- Tests ---------------- */
describe("LIVE: Terraform infra checks", () => {
  let REGION: string;
  let ec2: EC2Client;
  let sm: SecretsManagerClient;
  const o = readStructuredOutputs();

  beforeAll(async () => {
    REGION = await discoverRegionForVpc(o.vpcId);
    ec2 = new EC2Client({ region: REGION });
    sm = new SecretsManagerClient({ region: REGION });
  });

  afterAll(async () => {
    await ec2.destroy();
    await sm.destroy();
  });

  test("VPC exists", async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [o.vpcId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test("Bastion instance exists in public subnet, t3.micro", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ Filters: [{ Name: "ip-address", Values: [o.bastionIp] }] }))
    );
    const inst = res.Reservations?.[0]?.Instances?.[0];
    expect(inst).toBeTruthy();
    expect(inst?.InstanceType).toBe("t3.micro");
    expect(o.publicSubnetIds).toContain(inst?.SubnetId);
  });

  test("Private instances have no public IP and are in private subnets", async () => {
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: o.privateInstanceIds }));
    for (const r of res.Reservations || []) {
      for (const i of r.Instances || []) {
        expect(i.PublicIpAddress).toBeFalsy();
        expect(o.privateSubnetIds).toContain(i.SubnetId);
      }
    }
  });

  test("Public subnets route to IGW, private subnets route to NAT", async () => {
    const igwRes = await ec2.send(new DescribeInternetGatewaysCommand({ Filters: [{ Name: "attachment.vpc-id", Values: [o.vpcId] }] }));
    expect(igwRes.InternetGateways?.length).toBeGreaterThan(0);

    const natRes = await ec2.send(new DescribeNatGatewaysCommand({ Filter: [{ Name: "subnet-id", Values: [o.publicSubnetIds[0]] }] }));
    expect(natRes.NatGateways?.length).toBeGreaterThan(0);

    const rtRes = await ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [o.vpcId] }] }));
    for (const sid of o.publicSubnetIds) {
      expect(rtRes.RouteTables?.some((rt) => hasDefaultRouteToGateway(rt, "igw"))).toBe(true);
    }
    for (const sid of o.privateSubnetIds) {
      expect(rtRes.RouteTables?.some((rt) => hasDefaultRouteToGateway(rt, "nat"))).toBe(true);
    }
  });

  test("Security groups: bastion 22 open to world, private allows 22 from bastion SG", async () => {
    const bastionRes = await ec2.send(new DescribeInstancesCommand({ Filters: [{ Name: "ip-address", Values: [o.bastionIp] }] }));
    const bastionSgId = bastionRes.Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.[0]?.GroupId;
    expect(bastionSgId).toBeTruthy();

    const bastionSgRes = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId!] }));
    const sshRule = bastionSgRes.SecurityGroups?.[0]?.IpPermissions?.find((p) => portRangeMatch(p, 22));
    expect(sshRule?.IpRanges?.some((r) => r.CidrIp === "0.0.0.0/0")).toBe(true);

    const privRes = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [o.privateInstanceIds[0]] }));
    const privSgId = privRes.Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.[0]?.GroupId;
    const privSgRes = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [privSgId!] }));
    const privSSH = privSgRes.SecurityGroups?.[0]?.IpPermissions?.find((p) => portRangeMatch(p, 22));
    expect(privSSH?.UserIdGroupPairs?.some((g) => g.GroupId === bastionSgId)).toBe(true);
  });

  test("Secrets Manager secret exists", async () => {
    const res = await sm.send(new DescribeSecretCommand({ SecretId: o.secrets_manager_secret_arn }));
    expect(res.ARN).toBe(o.secrets_manager_secret_arn);
  });
});
