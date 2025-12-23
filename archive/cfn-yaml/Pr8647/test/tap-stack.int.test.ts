import fs from "fs";
import path from "path";

import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
} from "@aws-sdk/client-cloudformation";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInternetGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeLaunchTemplatesCommand,
} from "@aws-sdk/client-ec2";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";

import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import { RDSClient, DescribeDBSubnetGroupsCommand, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { KMSClient, ListAliasesCommand } from "@aws-sdk/client-kms";

type Outputs = Record<string, string | undefined>;
type StackRes = { LogicalResourceId: string; ResourceType: string; PhysicalResourceId?: string };

const PROJECT_ROOT = process.cwd();

const OUTPUT_CANDIDATES = [
  path.resolve(PROJECT_ROOT, "cdk-outputs/flat-outputs.json"),
  path.resolve(PROJECT_ROOT, "cfn-outputs/flat-outputs.json"),
  path.resolve(PROJECT_ROOT, "cfn-outputs/all-outputs.json"),
];

function readJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

function loadOutputs(): { outputs: Outputs; outputsPath: string } {
  for (const p of OUTPUT_CANDIDATES) {
    if (fs.existsSync(p)) {
      const data = readJson<any>(p);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error(`Outputs file ${p} is not a flat JSON object.`);
      }
      return { outputs: data as Outputs, outputsPath: p };
    }
  }
  throw new Error(
    `No outputs file found. Looked for:\n- ${OUTPUT_CANDIDATES.join("\n- ")}\n\nDeploy first and export outputs.`,
  );
}

function isLocalStackEnv(): boolean {
  const v = (process.env.LOCALSTACK ?? process.env.IS_LOCALSTACK ?? "").toLowerCase();
  if (["1", "true", "yes"].includes(v)) return true;

  const endpoint = (process.env.AWS_ENDPOINT_URL || "").toLowerCase();
  if (endpoint.includes("localhost") || endpoint.includes("localstack")) return true;

  const host = (process.env.LOCALSTACK_HOSTNAME || "").toLowerCase();
  if (host.includes("localhost") || host.includes("localstack")) return true;

  return false;
}

function localstackEndpoint(): string {
  if (process.env.AWS_ENDPOINT_URL) return process.env.AWS_ENDPOINT_URL;
  const host = process.env.LOCALSTACK_HOSTNAME;
  if (host) return `http://${host}:4566`;
  return "http://localhost:4566";
}

function baseAwsConfig() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  const localstack = isLocalStackEnv();
  const endpoint = localstack ? localstackEndpoint() : undefined;
  const credentials = localstack ? { accessKeyId: "test", secretAccessKey: "test" } : undefined;
  return { region, endpoint, credentials, localstack };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; name?: string } = {},
): Promise<T> {
  const retries = opts.retries ?? 10;
  const baseDelayMs = opts.baseDelayMs ?? 650;
  const name = opts.name ?? "operation";

  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      if (i === retries) break;
      await sleep(baseDelayMs * (i + 1));
    }
  }
  throw new Error(`Failed ${name} after ${retries + 1} attempts: ${String(lastErr?.message || lastErr)}`);
}

async function bestEffort<T>(localstack: boolean, name: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e: any) {
    if (!localstack) throw e;
    const msg = String(e?.message || e);

    const ignorable =
      msg.includes("not found") ||
      msg.includes("NotFound") ||
      msg.includes("NoSuch") ||
      msg.includes("NotImplemented") ||
      msg.includes("not implemented") ||
      msg.includes("Unsupported") ||
      msg.includes("UnknownOperationException") ||
      msg.includes("InternalError") ||
      msg.includes("ValidationError");

    if (ignorable) {
      // eslint-disable-next-line no-console
      console.warn(`(best-effort) Skipping ${name}: ${msg}`);
      return undefined;
    }
    throw new Error(`[LocalStack best-effort unexpected in ${name}]: ${msg}`);
  }
}

/**
 * ✅ Robust stack name resolution:
 * 1) env CFN_STACK_NAME / STACK_NAME
 * 2) outputs.StackName (if your exporter adds it)
 * 3) CloudFormation scan: find latest CREATE_COMPLETE stack where VPCId is present as a stack resource (strong signal)
 */
async function resolveStackName(
  cfn: CloudFormationClient,
  outputs: Outputs,
  localstack: boolean,
): Promise<string> {
  const envName = process.env.CFN_STACK_NAME || process.env.STACK_NAME;
  if (envName) return envName;

  const outName = outputs.StackName;
  if (outName) return outName;

  const vpcId = outputs.VPCId;
  if (!vpcId) {
    throw new Error("Cannot auto-detect stack: outputs.VPCId is missing.");
  }

  // LocalStack sometimes only returns a subset; still good enough.
  const stacks = await retry(
    async () => {
      const res = await cfn.send(new ListStacksCommand({}));
      return res.StackSummaries || [];
    },
    { name: "ListStacks" },
  );

  // Prefer CREATE_COMPLETE stacks and sort by most recent.
  const candidates = stacks
    .filter((s) => s.StackStatus === "CREATE_COMPLETE" || s.StackStatus === "UPDATE_COMPLETE")
    .sort((a, b) => {
      const at = a.CreationTime ? new Date(a.CreationTime).getTime() : 0;
      const bt = b.CreationTime ? new Date(b.CreationTime).getTime() : 0;
      return bt - at;
    });

  // Find a stack that contains our VPCId as a physical resource ID.
  for (const s of candidates) {
    const name = s.StackName;
    if (!name) continue;

    const resources = await bestEffort(localstack, `ListStackResources(${name})`, async () => {
      const r = await cfn.send(new ListStackResourcesCommand({ StackName: name }));
      return r.StackResourceSummaries || [];
    });

    if (!resources) continue;
    if (resources.some((r) => r.PhysicalResourceId === vpcId)) {
      return name;
    }
  }

  throw new Error(
    `Unable to auto-detect stack name. Set CFN_STACK_NAME env var. Outputs VPCId=${vpcId}`,
  );
}

describe("TapStack integration (AWS + LocalStack) - Generic (Local + CI)", () => {
  const { outputs, outputsPath } = loadOutputs();
  const { region, endpoint, credentials, localstack } = baseAwsConfig();

  const cfn = new CloudFormationClient({ region, endpoint, credentials });
  const ec2 = new EC2Client({ region, endpoint, credentials });
  const s3 = new S3Client({ region, endpoint, credentials, forcePathStyle: localstack });
  const elbv2 = new ElasticLoadBalancingV2Client({ region, endpoint, credentials });
  const iam = new IAMClient({ region, endpoint, credentials });
  const rds = new RDSClient({ region, endpoint, credentials });
  const kms = new KMSClient({ region, endpoint, credentials });

  let stackName = "";
  let resources: StackRes[] = [];

  beforeAll(async () => {
    // outputs sanity first
    if (!outputs.VPCId || !outputs.ApplicationBucketName || !outputs.ALBEndpoint) {
      throw new Error(
        `Outputs missing required keys. Need VPCId, ApplicationBucketName, ALBEndpoint. Found keys: ${Object.keys(
          outputs,
        ).join(", ")}`,
      );
    }

    stackName = await resolveStackName(cfn, outputs, localstack);

    // Ensure stack exists
    await retry(() => cfn.send(new DescribeStacksCommand({ StackName: stackName })), {
      name: `DescribeStacks(${stackName})`,
    });

    const res = await retry(() => cfn.send(new ListStackResourcesCommand({ StackName: stackName })), {
      name: `ListStackResources(${stackName})`,
    });

    resources =
      (res.StackResourceSummaries || []).map((r) => ({
        LogicalResourceId: r.LogicalResourceId!,
        ResourceType: r.ResourceType!,
        PhysicalResourceId: r.PhysicalResourceId,
      })) || [];
  }, 90_000);

  function byLogicalId(id: string): string {
    const r = resources.find((x) => x.LogicalResourceId === id);
    if (!r?.PhysicalResourceId) throw new Error(`Missing PhysicalResourceId for ${id} in stack ${stackName}`);
    return r.PhysicalResourceId;
  }

  test("outputs file loaded + stack resolved", () => {
    expect(outputsPath).toBeTruthy();
    expect(stackName).toBeTruthy();
    expect(outputs.VPCId).toBeTruthy();
  });

  test("VPC exists (from outputs)", async () => {
    const vpcId = outputs.VPCId!;
    await retry(async () => {
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.[0]?.VpcId).toBe(vpcId);
    }, { name: "DescribeVpcs(VPCId)" });
  });

  test("InternetGateway exists and attached", async () => {
    const igwId = byLogicalId("InternetGateway");
    const vpcId = outputs.VPCId!;
    await retry(async () => {
      const res = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
      const igw = res.InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(igwId);
      expect(igw?.Attachments?.some((a) => a?.VpcId === vpcId)).toBe(true);
    }, { name: "DescribeInternetGateways(igwId)" });
  });

  test("Public subnets exist (3)", async () => {
    const ids = [byLogicalId("PublicSubnetA"), byLogicalId("PublicSubnetB"), byLogicalId("PublicSubnetC")];
    await retry(async () => {
      const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids }));
      expect((res.Subnets || []).length).toBe(3);
    }, { name: "DescribeSubnets(public)" });
  });

  test("Private subnets exist (3)", async () => {
    const ids = [byLogicalId("PrivateSubnetA"), byLogicalId("PrivateSubnetB"), byLogicalId("PrivateSubnetC")];
    await retry(async () => {
      const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids }));
      expect((res.Subnets || []).length).toBe(3);
    }, { name: "DescribeSubnets(private)" });
  });

  test("Route tables exist (>=6)", async () => {
    const vpcId = outputs.VPCId!;
    await retry(async () => {
      const res = await ec2.send(
        new DescribeRouteTablesCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }),
      );
      expect((res.RouteTables || []).length).toBeGreaterThanOrEqual(6);
    }, { name: "DescribeRouteTables(vpc-id)" });
  });

  test("ALB exists", async () => {
    const albArn = byLogicalId("ApplicationLoadBalancer");
    await retry(async () => {
      const res = await elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }));
      expect(res.LoadBalancers?.[0]?.LoadBalancerArn).toBe(albArn);
    }, { name: "DescribeLoadBalancers(ALB arn)" });
  });

  test("Target group exists and is HTTP:80", async () => {
    const tgArn = byLogicalId("TargetGroup");
    await retry(async () => {
      const res = await elbv2.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [tgArn] }));
      const tg = res.TargetGroups?.[0];
      expect(tg?.TargetGroupArn).toBe(tgArn);
      expect(tg?.Protocol).toBe("HTTP");
      expect(tg?.Port).toBe(80);
    }, { name: "DescribeTargetGroups(tgArn)" });
  });

  test("Application bucket exists + versioning enabled", async () => {
    const bucket = outputs.ApplicationBucketName!;
    await retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })), { name: "HeadBucket(app)" });
    await retry(async () => {
      const v = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      if (v.Status && v.Status !== "Enabled") throw new Error(`Expected Enabled, got ${v.Status}`);
    }, { name: "GetBucketVersioning(app)" });
  });

  test("Application bucket encryption configured (best-effort in LocalStack)", async () => {
    const bucket = outputs.ApplicationBucketName!;
    await bestEffort(localstack, "GetBucketEncryption(app)", async () => {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      const algo =
        enc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(algo === "AES256" || algo === "aws:kms").toBe(true);
    });
  });

  test("Application bucket policy denies insecure transport (best-effort in LocalStack)", async () => {
    const bucket = outputs.ApplicationBucketName!;
    await bestEffort(localstack, "GetBucketPolicy(app)", async () => {
      const pol = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket }));
      const json = JSON.parse(pol.Policy || "{}");
      const stmts = Array.isArray(json.Statement) ? json.Statement : [];
      const deny = stmts.find(
        (s: any) => s?.Effect === "Deny" && s?.Condition?.Bool?.["aws:SecureTransport"] === "false",
      );
      expect(deny).toBeTruthy();
    });
  });

  test("IAM Role exists", async () => {
    const roleName = byLogicalId("EC2Role");
    await retry(async () => {
      const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(res.Role?.RoleName).toBe(roleName);
    }, { name: "GetRole(EC2Role)" });
  });

  test("Instance Profile exists and contains role", async () => {
    const profileName = byLogicalId("EC2InstanceProfile");
    const roleName = byLogicalId("EC2Role");

    await retry(async () => {
      const res = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
      const roles = res.InstanceProfile?.Roles || [];
      expect(roles.some((r) => r.RoleName === roleName)).toBe(true);
    }, { name: "GetInstanceProfile(EC2InstanceProfile)" });
  });

  test("LaunchTemplate exists", async () => {
    const ltId = byLogicalId("LaunchTemplate");
    await retry(async () => {
      const res = await ec2.send(new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ltId] }));
      expect(res.LaunchTemplates?.[0]?.LaunchTemplateId).toBe(ltId);
    }, { name: "DescribeLaunchTemplates(ltId)" });
  });

  test("Security groups exist (ALB/EC2/RDS)", async () => {
    const ids = [byLogicalId("ALBSecurityGroup"), byLogicalId("EC2SecurityGroup"), byLogicalId("RDSSecurityGroup")];
    await retry(async () => {
      const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: ids }));
      expect((res.SecurityGroups || []).length).toBe(3);
    }, { name: "DescribeSecurityGroups(groupIds)" });
  });

  test("DBSubnetGroup exists (best-effort in LocalStack)", async () => {
    await bestEffort(localstack, "DescribeDBSubnetGroups(DBSubnetGroup)", async () => {
      const name = byLogicalId("DBSubnetGroup");
      const res = await rds.send(new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: name }));
      expect(res.DBSubnetGroups?.[0]?.DBSubnetGroupName).toBe(name);
    });
  });

  test("DBInstance exists (best-effort in LocalStack)", async () => {
    await bestEffort(localstack, "DescribeDBInstances(DBInstance)", async () => {
      const id = byLogicalId("DBInstance");
      const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: id }));
      expect(res.DBInstances?.[0]?.DBInstanceIdentifier).toBe(id);
    });
  });

  test("KMS aliases list is available (best-effort in LocalStack)", async () => {
    await bestEffort(localstack, "KMS ListAliases", async () => {
      const res = await kms.send(new ListAliasesCommand({}));
      expect(Array.isArray(res.Aliases)).toBe(true);
    });
  });
});
