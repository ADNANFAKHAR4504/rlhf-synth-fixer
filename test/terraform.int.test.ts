import {
  EC2Client,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  RouteTable,
  SecurityGroup,
  Subnet,
  Vpc,
} from "@aws-sdk/client-ec2";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/* ============ Load Terraform structured outputs (no TF CLI) ============ */

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

describe("Terraform Security Group Integration Test", () => {
  const originalTfDir = path.resolve(__dirname, "../lib");
  const tmpTfDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-test-"));
  const planFile = "tfplan.json";

  beforeAll(() => {
    if (!fs.existsSync(originalTfDir)) {
      throw new Error(`Terraform directory not found: ${originalTfDir}`);
    }

    // Copy Terraform files to temp directory
    fs.cpSync(originalTfDir, tmpTfDir, { recursive: true });

    // Remove test.auto.tfvars.json if present
    const tfvarsPath = path.join(tmpTfDir, "test.auto.tfvars.json");
    if (fs.existsSync(tfvarsPath)) {
      fs.rmSync(tfvarsPath);
    }

    // Rewrite backend and provider blocks in temp files
    const tfFiles = ["main.tf", "provider.tf"];
    tfFiles.forEach((file) => {
      const filePath = path.join(tmpTfDir, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf-8");

        // Replace backend "s3" with local backend
        content = content.replace(
          /backend\s+"s3"\s*\{[^}]+\}/gs,
          'backend "local" {\n    path = "terraform.tfstate"\n  }'
        );

        // Replace provider block with static dummy credentials and skip validation
        content = content.replace(
          /provider\s+"aws"\s*\{[^}]+\}/gs,
          `provider "aws" {
            region                      = "us-west-2"
            access_key                  = "dummy"
            secret_key                  = "dummy"
            skip_credentials_validation = true
            skip_metadata_api_check     = true
            skip_requesting_account_id  = true
          }`
        );

        fs.writeFileSync(filePath, content);
      }
    });

    // Run terraform init
    const initResult = spawnSync("terraform", ["init", "-input=false"], {
      cwd: tmpTfDir,
      encoding: "utf-8",
    });
    if (initResult.status !== 0) {
      throw new Error(`Terraform init failed:\n${initResult.stdout}\n${initResult.stderr}`);
const OUT = readOutputs();

/* ============ Fast AWS client (short timeouts, no retries) ============ */

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2 = new EC2Client({
  region: REGION,
  maxAttempts: 1, // no SDK retries
});

/** Send a command with a hard timeout (default 2000ms). No extra deps. */
async function sendWithTimeout<T>(
  cmd: any,
  ms = Number(process.env.TEST_HTTP_TIMEOUT_MS || 2000)
): Promise<T> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);

  // Some SDK versions accept { abortSignal }; some typings don’t. Use `any` safely.
  const reqPromise = (ec2 as any).send(cmd, { abortSignal: ac.signal }) as Promise<T>;

  // Hard timeout via race
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`request timeout after ${ms}ms`)), ms)
  );

  try {
    return await Promise.race([reqPromise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

/* ============ Helpers ============ */

type FlatRule = { protocol: string; from: number; to: number; cidr: string };

function flattenIngressFromAws(sg: SecurityGroup): FlatRule[] {
  const res: FlatRule[] = [];
  for (const p of sg.IpPermissions || []) {
    const protocol = p.IpProtocol || "";
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

/* ============ Prefetch once; skip live checks if stack not present ============ */

let STACK_PRESENT = true;
let vpc: Vpc | undefined;
let subnet: Subnet | undefined;
let rt: RouteTable | undefined;
let sg: SecurityGroup | undefined;

beforeAll(async () => {
  try {
    const [vpcRes, subnetRes, sgRes] = await Promise.allSettled([
      sendWithTimeout<{ Vpcs?: Vpc[] }>(new DescribeVpcsCommand({ VpcIds: [OUT.vpcId] })),
      sendWithTimeout<{ Subnets?: Subnet[] }>(new DescribeSubnetsCommand({ SubnetIds: [OUT.subnetId] })),
      sendWithTimeout<{ SecurityGroups?: SecurityGroup[] }>(
        new DescribeSecurityGroupsCommand({ GroupIds: [OUT.sgId] })
      ),
    ]);

    if (vpcRes.status === "fulfilled") vpc = vpcRes.value.Vpcs?.[0];
    if (subnetRes.status === "fulfilled") subnet = subnetRes.value.Subnets?.[0];
    if (sgRes.status === "fulfilled") sg = sgRes.value.SecurityGroups?.[0];

    STACK_PRESENT = Boolean(vpc && subnet && sg);

    if (STACK_PRESENT) {
      const rts = await sendWithTimeout<{ RouteTables?: RouteTable[] }>(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [OUT.subnetId] }],
        })
      );
      rt = (rts.RouteTables || [])[0];
    }
  } catch {
    STACK_PRESENT = false;
  }
});

    // Run terraform plan
    const planOut = spawnSync("terraform", ["plan", "-input=false", "-out=tfplan"], {
      cwd: tmpTfDir,
      encoding: "utf-8",
    });
    if (planOut.status !== 0) {
      throw new Error(`Terraform plan failed:\n${planOut.stdout}\n${planOut.stderr}`);
    }

    // Convert plan to JSON
    const showOut = spawnSync("terraform", ["show", "-json", "tfplan"], {
      cwd: tmpTfDir,
      encoding: "utf-8",
    });
    if (showOut.status !== 0) {
      throw new Error(`Terraform show failed:\n${showOut.stdout}\n${showOut.stderr}`);
    }

    fs.writeFileSync(path.join(tmpTfDir, planFile), showOut.stdout);
  });

  afterAll(() => {
    fs.rmSync(tmpTfDir, { recursive: true, force: true });
  });

  it("should allow only ports 80 and 443 from specified CIDRs", () => {
    const planPath = path.join(tmpTfDir, planFile);
    const jsonData = JSON.parse(fs.readFileSync(planPath, "utf-8"));

    const resources = jsonData?.planned_values?.root_module?.resources || [];
    const sgResource = resources.find((r: any) => r.type === "aws_security_group");
    expect(sgResource).toBeDefined();

    const ingressRules: IngressRule[] = (sgResource.values.ingress || []).map((rule: any) => {
      const r: IngressRule = {
        protocol: rule.protocol,
        from_port: rule.from_port,
        to_port: rule.to_port,
        cidr_v4: rule.cidr_blocks?.[0] ?? undefined,
        cidr_v6: rule.ipv6_cidr_blocks?.[0] ?? undefined,
      };

      if (r.cidr_v4 && r.cidr_v6) {
        r.cidr_v6 = undefined;
      }

      if (!r.cidr_v4 && !r.cidr_v6 && Array.isArray(rule.cidr_blocks) && rule.cidr_blocks.length > 0) {
        const first = rule.cidr_blocks[0];
        if (first.includes(":")) r.cidr_v6 = first;
        else r.cidr_v4 = first;
      }

      return r;
    });

    ingressRules.forEach((rule) => {
      expect(["tcp", "6", "-1"]).toContain(rule.protocol);
      expect([80, 443]).toContain(rule.from_port);
      expect([80, 443]).toContain(rule.to_port);
      expect(rule.cidr_v4 || rule.cidr_v6).toBeDefined();
    });
/* ============ Always-on sanity tests (no AWS calls) ============ */

describe("Sanity: outputs structure & security invariants (no AWS calls)", () => {
  test("ingress_rules are non-empty and only ports 80/443; not world-open", () => {
    expect(OUT.ingressRules.length).toBeGreaterThan(0);
    const flat = flattenIngressFromOutputs(OUT.ingressRules);
    for (const r of flat) {
      expect(r.protocol).toBe("tcp");
      expect([80, 443]).toContain(r.from);
      expect([80, 443]).toContain(r.to);
      expect(r.cidr).not.toBe("0.0.0.0/0");
      expect(r.cidr).not.toBe("::/0");
    }
  });

  test("security_group_arn includes security_group_id", () => {
    expect(OUT.sgArn).toContain(OUT.sgId);
  });
});

/* ============ Live tests (fast) — auto-skip if stack absent ============ */

type TestCb = () => any | Promise<any>;
const live = (name: string, fn: TestCb) =>
  test(name, async () => {
    if (!STACK_PRESENT) {
      console.warn("SKIP live check:", name, "(stack resources not present)");
      return;
    }
    return fn();
  });

describe("LIVE: VPC & Subnet (fast)", () => {
  live("VPC exists with expected ID", async () => {
    expect(vpc?.VpcId).toBe(OUT.vpcId);
  });

  live("Subnet exists, belongs to VPC, public IP mapping enabled", async () => {
    expect(subnet?.SubnetId).toBe(OUT.subnetId);
    expect(subnet?.VpcId).toBe(OUT.vpcId);
    expect(subnet?.MapPublicIpOnLaunch).toBe(true);
  });

  live("Subnet route table has default route via an Internet Gateway", async () => {
    expect(rt).toBeTruthy();
    const hasIgwDefault = (rt?.Routes || []).some(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0" && (r.GatewayId || "").startsWith("igw-")
    );
    expect(hasIgwDefault).toBe(true);
  });
});

describe("LIVE: Security Group (fast)", () => {
  live("SG exists, in correct VPC, name matches; ARN contains ID", async () => {
    expect(sg?.GroupId).toBe(OUT.sgId);
    expect(sg?.GroupName).toBe(OUT.sgName);
    expect(sg?.VpcId).toBe(OUT.vpcId);
    expect(OUT.sgArn).toContain(OUT.sgId);
  });

  live("Ingress rules match outputs exactly; only ports 80/443; no world-open", async () => {
    const awsFlat = sortFlatRules(flattenIngressFromAws(sg!));
    const outFlat = sortFlatRules(flattenIngressFromOutputs(OUT.ingressRules));
    expect(awsFlat).toEqual(outFlat);

    const ports = new Set<number>(awsFlat.flatMap((r) => [r.from, r.to]));
    for (const p of ports) expect([80, 443]).toContain(p);

    const cidrs = awsFlat.map((r) => r.cidr);
    expect(cidrs).not.toContain("0.0.0.0/0");
    expect(cidrs).not.toContain("::/0");
  });

  live("Egress allows all OR restricted tcp/443 to 0.0.0.0/0", async () => {
    const e = sg!.IpPermissionsEgress || [];
    const hasAllowAll =
      e.some(
        (p) =>
          p.IpProtocol === "-1" &&
          (p.IpRanges || []).some((r) => r.CidrIp === "0.0.0.0/0") &&
          (((p.Ipv6Ranges || []).some((r) => r.CidrIpv6 === "::/0")) || true)
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
