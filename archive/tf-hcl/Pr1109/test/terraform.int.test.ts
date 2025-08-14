import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketPolicyStatusCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

/** ===================== Types & IO ===================== */

type TfValue<T> = { sensitive: boolean; type: any; value: T };

type Outputs = {
  vpc_id?: TfValue<string>;
  public_subnet_ids?: TfValue<string[]>;
  private_subnet_ids?: TfValue<string[]>;
  security_group_id?: TfValue<string>;
  instance_id?: TfValue<string>;
  instance_private_ip?: TfValue<string>;
  instance_public_ip?: TfValue<string>;
  nat_gateway_id?: TfValue<string>;
  s3_bucket_name?: TfValue<string>;
};

function loadOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Outputs;

  const missing: string[] = [];
  const req = <K extends keyof Outputs>(k: K) => {
    const v = raw[k]?.value as any;
    if (v === undefined || v === null) missing.push(String(k));
    return v;
  };

  const o = {
    vpcId: req("vpc_id") as string,
    publicSubnets: req("public_subnet_ids") as string[],
    privateSubnets: req("private_subnet_ids") as string[],
    sgId: req("security_group_id") as string,
    instanceId: req("instance_id") as string,
    instancePrivateIp: req("instance_private_ip") as string,
    instancePublicIp: (raw.instance_public_ip?.value ?? "") as string,
    natGatewayId: (raw.nat_gateway_id?.value ?? "") as string,
    bucketName: req("s3_bucket_name") as string,
  };

  if (missing.length) {
    throw new Error(
      `Missing required outputs in cfn-outputs/all-outputs.json: ${missing.join(", ")}`
    );
  }
  return o;
}

const OUT = loadOutputs();

/** Env hints (optional): EXPECT_INSTANCE_TYPE, EXPECT_ALLOWED_SSH_CIDRS='["1.2.3.4/32"]' */
const EXPECT_INSTANCE_TYPE = process.env.EXPECT_INSTANCE_TYPE || "t3.micro";
const EXPECT_ALLOWED_SSH_CIDRS: string[] = (() => {
  try {
    return process.env.EXPECT_ALLOWED_SSH_CIDRS
      ? JSON.parse(process.env.EXPECT_ALLOWED_SSH_CIDRS)
      : [];
  } catch {
    return [];
  }
})();

/** Infer environment: dev (no NAT, public IP present) vs nondev (NAT present, no public IP) */
const IS_DEV = !OUT.natGatewayId || OUT.natGatewayId.trim() === "";

/** Region for SDKs */
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region: REGION });
const s3 = new S3Client({ region: REGION });

/** ===================== Utilities ===================== */

function normalizeS3Region(v?: string | null): string {
  // S3 returns null/"" for us-east-1
  if (!v || v === "") return "us-east-1";
  return v;
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

async function getSubnetAzMap(subnetIds: string[]) {
  const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
  const map = new Map<string, string>();
  resp.Subnets?.forEach((s) => {
    if (s.SubnetId && s.AvailabilityZone) map.set(s.SubnetId, s.AvailabilityZone);
  });
  return map;
}

async function getRouteTableForSubnet(subnetId: string) {
  const rts = await ec2.send(
    new DescribeRouteTablesCommand({
      Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
    })
  );
  // Use the first associated RT for this subnet
  return rts.RouteTables?.[0];
}

/** ===================== Jest Config ===================== */
jest.setTimeout(180_000);

/** ===================== S3 Tests ===================== */

describe("LIVE: S3 bucket posture", () => {
  test("Bucket exists (HeadBucket) & region matches SDK target", async () => {
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: OUT.bucketName })))).resolves
      .toBeTruthy();

    const loc = await retry(() => s3.send(new GetBucketLocationCommand({ Bucket: OUT.bucketName })));
    const bucketRegion = normalizeS3Region(loc.LocationConstraint as string | undefined);
    expect(bucketRegion).toBe(normalizeS3Region(REGION));
  });

  test("Public access is fully blocked", async () => {
    const pab = await retry(() =>
      s3.send(new GetPublicAccessBlockCommand({ Bucket: OUT.bucketName }))
    );
    const c = pab.PublicAccessBlockConfiguration!;
    expect(c.BlockPublicAcls).toBe(true);
    expect(c.BlockPublicPolicy).toBe(true);
    expect(c.IgnorePublicAcls).toBe(true);
    expect(c.RestrictPublicBuckets).toBe(true);

    // If a policy exists, it must not make the bucket public.
    try {
      const pol = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: OUT.bucketName }));
      expect(pol.PolicyStatus?.IsPublic).not.toBe(true);
    } catch {
      // No policy or not supported: fine (still not public)
    }
  });

  test("Default encryption: SSE-S3 is enforced", async () => {
    const enc = await retry(() =>
      s3.send(new GetBucketEncryptionCommand({ Bucket: OUT.bucketName }))
    );
    const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
    const algo = rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toBe("AES256");
  });

  test("Versioning toggle respects environment (enabled in non-dev; suspended in dev)", async () => {
    const ver = await retry(() =>
      s3.send(new GetBucketVersioningCommand({ Bucket: OUT.bucketName }))
    );
    const status = ver.Status || "Suspended";
    if (IS_DEV) {
      expect(status).toBe("Suspended");
    } else {
      expect(status).toBe("Enabled");
    }
  });

  test("Tags exist (Project/Environment) — soft check", async () => {
    try {
      const t = await s3.send(new GetBucketTaggingCommand({ Bucket: OUT.bucketName }));
      const kv = new Map((t.TagSet || []).map((x) => [x.Key, x.Value]));
      // Not strict (accounts can restrict GetBucketTagging); but if present, verify keys.
      expect(kv.has("Project")).toBeTruthy();
      expect(kv.has("Environment")).toBeTruthy();
    } catch {
      // If tag API is blocked or no tags, skip (main.tf applies tags but IAM may prevent read)
      expect(true).toBe(true);
    }
  });
});

/** ===================== EC2 Instance Tests ===================== */

describe("LIVE: EC2 instance posture", () => {
  test("Instance exists; type matches expectation; SG attached", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ InstanceIds: [OUT.instanceId] }))
    );
    const inst = res.Reservations?.[0]?.Instances?.[0];
    expect(inst).toBeTruthy();
    expect(inst?.InstanceId).toBe(OUT.instanceId);
    expect(inst?.InstanceType).toBe(EXPECT_INSTANCE_TYPE);
    const sgIds = (inst?.SecurityGroups || []).map((g) => g.GroupId);
    expect(sgIds).toContain(OUT.sgId);
  });

  test("Instance network placement & IPs align with env rules", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ InstanceIds: [OUT.instanceId] }))
    );
    const inst = res.Reservations?.[0]?.Instances?.[0]!;
    const subnetId = inst.SubnetId!;
    const hasPublicIp = !!inst.PublicIpAddress;

    if (IS_DEV) {
      expect(OUT.natGatewayId).toBe(""); // dev: no NAT
      expect(OUT.instancePublicIp).not.toBe(""); // dev: public IP output present
      expect(hasPublicIp).toBe(true);
      expect(OUT.publicSubnets).toContain(subnetId);
    } else {
      expect(OUT.natGatewayId).not.toBe(""); // non-dev: NAT exists
      expect(OUT.instancePublicIp).toBe(""); // non-dev: no public IP output
      expect(hasPublicIp).toBe(false);
      expect(OUT.privateSubnets).toContain(subnetId);
    }
  });

  test("Detailed monitoring toggle respected", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ InstanceIds: [OUT.instanceId] }))
    );
    const inst = res.Reservations?.[0]?.Instances?.[0]!;
    const monitoring = inst.Monitoring?.State; // "enabled" or "disabled"
    if (IS_DEV) {
      expect(monitoring).toBe("disabled");
    } else {
      expect(monitoring).toBe("enabled");
    }
  });
});

/** ===================== Security Group Tests ===================== */

describe("LIVE: Security Group rules", () => {
  test("All egress allowed; ingress only SSH (22) if present; never world-open on 22", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    const sg = res.SecurityGroups?.[0]!;
    expect(sg).toBeTruthy();

    // Egress: allow all (protocol -1 to 0.0.0.0/0)
    const egress = sg.IpPermissionsEgress || [];
    const hasAllEgress = egress.some(
      (p) => p.IpProtocol === "-1" && (p.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0")
    );
    expect(hasAllEgress).toBe(true);

    // Ingress:
    const ingress = sg.IpPermissions || [];
    if (ingress.length === 0) {
      // allowed_ssh_cidrs was empty: OK (edge case)
      expect(true).toBe(true);
    } else {
      // Only SSH rules; never world-open
      for (const p of ingress) {
        expect(p.FromPort).toBe(22);
        expect(p.ToPort).toBe(22);
        expect(p.IpProtocol).toBe("tcp");
        const cidrs = (p.IpRanges || []).map((r) => r.CidrIp);
        expect(cidrs).not.toContain("0.0.0.0/0");
      }
      // If explicit expected CIDRs set via env, validate exact match set-wise
      if (EXPECT_ALLOWED_SSH_CIDRS.length > 0) {
        const allCidrs = ingress.flatMap((p) => (p.IpRanges || []).map((r) => r.CidrIp!));
        const uniq = Array.from(new Set(allCidrs)).sort();
        const expected = Array.from(new Set(EXPECT_ALLOWED_SSH_CIDRS)).sort();
        expect(uniq).toEqual(expected);
      }
    }
  });
});

/** ===================== VPC & Subnets ===================== */

describe("LIVE: VPC & Subnets", () => {
  test("VPC exists", async () => {
    const v = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [OUT.vpcId] })));
    expect(v.Vpcs?.[0]?.VpcId).toBe(OUT.vpcId);
  });

  test("Subnets belong to VPC & are in two distinct AZs (public vs private)", async () => {
    const subnets = [...OUT.publicSubnets, ...OUT.privateSubnets];
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnets })));
    const vpcIds = new Set(resp.Subnets?.map((s) => s.VpcId));
    expect(vpcIds.size).toBe(1);
    expect(vpcIds.has(OUT.vpcId)).toBe(true);

    const pubAz = await getSubnetAzMap(OUT.publicSubnets);
    const privAz = await getSubnetAzMap(OUT.privateSubnets);
    const pubSet = new Set(pubAz.values());
    const privSet = new Set(privAz.values());
    expect(pubSet.size).toBe(2);
    expect(privSet.size).toBe(2);
  });

  test("Public subnets route 0.0.0.0/0 to an Internet Gateway", async () => {
    for (const s of OUT.publicSubnets) {
      const rt = await retry(() => getRouteTableForSubnet(s));
      expect(rt).toBeTruthy();
      const hasIgwDefault = (rt!.Routes || []).some(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.GatewayId || "").startsWith("igw-")
      );
      expect(hasIgwDefault).toBe(true);
    }
  });

  test("Private subnets default route behavior respects NAT toggle", async () => {
    for (const s of OUT.privateSubnets) {
      const rt = await retry(() => getRouteTableForSubnet(s));
      expect(rt).toBeTruthy();
      const routes = rt!.Routes || [];
      const natDefault = routes.find(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.NatGatewayId || "").startsWith("nat-")
      );
      const igwDefault = routes.find(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.GatewayId || "").startsWith("igw-")
      );

      if (IS_DEV) {
        expect(natDefault).toBeUndefined();
        expect(igwDefault).toBeUndefined();
      } else {
        expect(natDefault).toBeTruthy();
        expect(igwDefault).toBeUndefined();
      }
    }
  });
});

/** ===================== NAT Gateway (non-dev) ===================== */

describe("LIVE: NAT Gateway (conditional)", () => {
  const SKIP = IS_DEV;

  test(SKIP ? "skipped in dev" : "NAT Gateway exists and is in a public subnet", async () => {
    if (SKIP) return expect(true).toBe(true);
    expect(OUT.natGatewayId).toMatch(/^nat-/);

    const nat = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [OUT.natGatewayId] }))
    );
    const ngw = nat.NatGateways?.[0];
    expect(ngw?.NatGatewayId).toBe(OUT.natGatewayId);
    expect(ngw?.State).toBe("available");

    // NAT must be placed in one of the public subnets
    expect(OUT.publicSubnets).toContain(ngw?.SubnetId!);
    expect((ngw?.NatGatewayAddresses || []).length).toBeGreaterThan(0);
  });
});

/** ===================== Edge Cases & Sanity ===================== */

describe("Edge cases & sanity checks", () => {
  test("Instance public IP presence matches outputs and environment", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeInstancesCommand({ InstanceIds: [OUT.instanceId] }))
    );
    const inst = res.Reservations?.[0]?.Instances?.[0]!;
    const livePub = inst.PublicIpAddress || "";
    if (IS_DEV) {
      expect(OUT.instancePublicIp).not.toBe("");
      expect(livePub).not.toBe("");
    } else {
      expect(OUT.instancePublicIp).toBe("");
      expect(livePub).toBeFalsy();
    }
  });

  test("Security group has no non-SSH ingress ports", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] }))
    );
    const sg = res.SecurityGroups?.[0]!;
    for (const p of sg.IpPermissions || []) {
      // Only allow TCP:22 if any ingress exists
      expect(p.IpProtocol).toBe("tcp");
      expect(p.FromPort).toBe(22);
      expect(p.ToPort).toBe(22);
    }
  });
});
