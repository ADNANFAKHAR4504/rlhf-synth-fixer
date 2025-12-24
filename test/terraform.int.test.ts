//int-tests.ts
import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  IpPermission,
} from "@aws-sdk/client-ec2";

/** ===================== Types & Outputs Loader ===================== */

type TFVal<T> = { sensitive: boolean; type: unknown; value: T };

type OutputsFile = {
  vpc_id: TFVal<string>;
  subnet_id: TFVal<string>;
  security_group_id: TFVal<string>;
  security_group_name?: TFVal<string>;
  security_group_arn?: TFVal<string>;
  ingress_rules?: TFVal<
    Array<{ cidrs: string[]; from_port: number; protocol: string; to_port: number }>
  >;
};

function loadOutputs() {
  const file =
    process.env.OUTPUTS_FILE ||
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(file)) throw new Error(`Outputs file not found at ${file}`);

  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as OutputsFile;

  const req = <K extends keyof OutputsFile>(k: K) => {
    const v = raw[k]?.value as any;
    if (v === undefined || v === null || v === "") {
      throw new Error(`Missing required output "${String(k)}" in ${file}`);
    }
    return v;
  };

  return {
    vpcId: req("vpc_id") as string,
    subnetId: req("subnet_id") as string,
    sgId: req("security_group_id") as string,
    sgName: (raw.security_group_name?.value ?? "") as string,
    sgArn: (raw.security_group_arn?.value ?? "") as string,
    declaredIngress:
      (raw.ingress_rules?.value ?? []) as Array<{
        cidrs: string[];
        from_port: number;
        protocol: string;
        to_port: number;
      }>,
  };
}

const OUT = loadOutputs();

/** ===================== AWS SDK Setup (LocalStack-aware) ===================== */

// LocalStack configuration
// Try to detect region from ARN in outputs, fallback to env var or us-west-2 (Terraform default)
const arnRegion = OUT.sgArn?.match(/:ec2:([a-z0-9-]+):/)?.[1];
const REGION = arnRegion || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ENDPOINT = process.env.AWS_ENDPOINT_URL || undefined;

const ec2Config: any = {
  region: REGION,
};

// Add LocalStack endpoint if running against LocalStack
if (ENDPOINT) {
  ec2Config.endpoint = ENDPOINT;
  ec2Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  };
}

const ec2 = new EC2Client(ec2Config);

/** ===================== Test Utilities ===================== */

jest.setTimeout(180_000);

async function retry<T>(fn: () => Promise<T>, attempts = 7, baseMs = 600): Promise<T> {
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

function hasWorldCidr(p: IpPermission, cidr = "0.0.0.0/0") {
  return (p.IpRanges || []).some((r) => r.CidrIp === cidr);
}
function portMatches(p: IpPermission, port: number) {
  if (p.FromPort === undefined || p.ToPort === undefined) return false;
  return p.FromPort <= port && port <= p.ToPort;
}
function isTcp(p: IpPermission) {
  return p.IpProtocol === "tcp";
}

async function getRouteTableForSubnet(subnetId: string) {
  const out = await ec2.send(
    new DescribeRouteTablesCommand({
      Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
    })
  );
  return out.RouteTables?.[0];
}

/** ===================== Tests ===================== */

describe("Region sanity", () => {
  test("Outputs align with expected region (if ARN present)", () => {
    const arnRegion = OUT.sgArn?.match(/:ec2:([a-z0-9-]+):/)?.[1];
    if (arnRegion) {
      // Accept either us-west-2 (real AWS) or us-east-1 (LocalStack)
      expect(["us-west-2", "us-east-1"]).toContain(arnRegion);
    }
  });
});

describe("LIVE: Outputs exist and basic shape is correct", () => {
  test("Non-empty IDs present", () => {
    expect(OUT.vpcId).toMatch(/^vpc-/);
    expect(OUT.subnetId).toMatch(/^subnet-/);
    expect(OUT.sgId).toMatch(/^sg-/);
  });
});

describe("LIVE: VPC & Subnet posture", () => {
  test("VPC exists and is available", async () => {
    const resp = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [OUT.vpcId] }))
    );
    expect(resp.Vpcs?.length).toBe(1);
    const v = resp.Vpcs![0]!;
    expect(v.VpcId).toBe(OUT.vpcId);
    if (v.State) expect(v.State).toBe("available");
  });

  test("Subnet exists, is in same VPC, and is available", async () => {
    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: [OUT.subnetId] }))
    );
    expect(resp.Subnets?.length).toBe(1);
    const s = resp.Subnets![0]!;
    expect(s.SubnetId).toBe(OUT.subnetId);
    expect(s.VpcId).toBe(OUT.vpcId);
    if (s.State) expect(s.State).toBe("available");
  });

  test("Subnet has a route table association (sanity)", async () => {
    const rt = await retry(() => getRouteTableForSubnet(OUT.subnetId));
    expect(rt?.RouteTableId).toBeDefined();

    // Optional: if a default route exists, ensure it points to IGW or NAT
    const defaultRoute = (rt?.Routes || []).find(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0"
    );
    if (defaultRoute) {
      const viaIgw = !!defaultRoute.GatewayId && defaultRoute.GatewayId.startsWith("igw-");
      const viaNat = !!defaultRoute.NatGatewayId && defaultRoute.NatGatewayId.startsWith("nat-");
      expect(viaIgw || viaNat).toBe(true);
    }
  });
});

describe("LIVE: Security Group posture", () => {
  let sg:
    | Awaited<ReturnType<typeof fetchSg>>
    | undefined;

  async function fetchSg() {
    const resp = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] })
    );
    return resp.SecurityGroups?.[0];
  }

  beforeAll(async () => {
    sg = await retry(fetchSg);
  });

  test("SG exists, in expected VPC, and ID matches", () => {
    expect(sg?.GroupId).toBe(OUT.sgId);
    expect(sg?.VpcId).toBe(OUT.vpcId);
  });

  test("SG name matches output when provided", () => {
    if (OUT.sgName) {
      expect(sg?.GroupName).toBe(OUT.sgName);
    } else {
      expect(sg?.GroupName).toBeTruthy();
    }
  });

  test("Ingress allows ports 80 and 443 from 0.0.0.0/0", () => {
    const perms = sg?.IpPermissions || [];
    const http = perms.find((p) => isTcp(p) && portMatches(p, 80) && hasWorldCidr(p));
    const https = perms.find((p) => isTcp(p) && portMatches(p, 443) && hasWorldCidr(p));
    expect(http).toBeTruthy();
    expect(https).toBeTruthy();
  });

  test("Ingress does NOT allow SSH (22) from 0.0.0.0/0", () => {
    const perms = sg?.IpPermissions || [];
    const openSshToWorld = perms.find(
      (p) => isTcp(p) && portMatches(p, 22) && hasWorldCidr(p)
    );
    expect(openSshToWorld).toBeUndefined();
  });

  test("Egress exists (common default is allow-all)", () => {
    const egress = sg?.IpPermissionsEgress || [];
    expect(egress.length).toBeGreaterThan(0);
    // If you require full egress, uncomment:
    // const openAll = egress.find((p) => (p.IpProtocol === "-1" || p.IpProtocol === "all") && hasWorldCidr(p));
    // expect(openAll).toBeTruthy();
  });

  test("Declared Terraform ingress_rules are reflected in AWS (if provided)", () => {
    const declared = OUT.declaredIngress || [];
    if (!declared.length) {
      expect(true).toBe(true);
      return;
    }
    const perms = sg?.IpPermissions || [];
    for (const rule of declared) {
      const hit = perms.find(
        (p) =>
          p.IpProtocol === rule.protocol &&
          p.FromPort === rule.from_port &&
          p.ToPort === rule.to_port &&
          (p.IpRanges || []).some((r) => rule.cidrs.includes(r.CidrIp || ""))
      );
      expect(hit).toBeTruthy();
    }
  });
});
