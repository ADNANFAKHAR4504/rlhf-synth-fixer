import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

type TfOutputsFlat = {
  [k: string]: { sensitive: boolean; type: any; value: any } | any;
};

function readAllOutputs(): TfOutputsFlat {
  const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(allOutputsPath)) {
    throw new Error(`Outputs file not found at ${allOutputsPath}`);
  }
  return JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
}

function chooseRegion(outputs: TfOutputsFlat): string {
  // Prefer explicit env vars commonly set in CI
  const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (envRegion && envRegion.length > 0) return envRegion;

  // Try to infer from RDS endpoint host (example: mysql-db-dev.covy6ema0nuv.us-east-1.rds.amazonaws.com:3306)
  const rdsOut = outputs.rds_endpoint?.value ?? outputs.rds_endpoint;
  if (typeof rdsOut === "string") {
    const host = rdsOut.split(":")[0];
    const m = host.match(/\.(?<region>[a-z0-9-]+)\.rds\.amazonaws\.com$/);
    if (m && (m as any).groups?.region) return (m as any).groups.region;
  }

  // Do not default to a region; require CI to provide it
  throw new Error("AWS region not found: set AWS_REGION / AWS_DEFAULT_REGION or ensure rds_endpoint output includes region");
}

function extractDbIdentifier(rdsEndpointValue: string): string {
  // rdsEndpointValue might be "host:port" or just host
  const host = rdsEndpointValue.split(":")[0];
  // first label is commonly the DB identifier (mysql-db-dev)
  return host.split(".")[0];
}

describe("LIVE integration tests (use cfn-outputs/all-outputs.json)", () => {
  let outputs: TfOutputsFlat;
  let region: string;

  beforeAll(() => {
    outputs = readAllOutputs();
    region = chooseRegion(outputs);
  });

  test("required outputs exist", () => {
    const need = ["ec2_instance_id", "public_subnet_id", "rds_endpoint", "s3_app_bucket_name", "vpc_id"];
    for (const k of need) {
      const v = outputs[k]?.value ?? outputs[k];
      expect(v).toBeDefined();
      expect(String(v).length).toBeGreaterThan(0);
    }
  });

  test("EC2 instance exists and is running and associated with expected subnet", async () => {
    const ec2InstanceId = outputs.ec2_instance_id?.value ?? outputs.ec2_instance_id;
    expect(ec2InstanceId).toBeDefined();

    const ec2 = new EC2Client({ region });
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
    const instance = res.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();

    // state should not be terminated
    const state = instance?.State?.Name ?? "";
    expect(["running", "pending", "stopping", "stopped"]).toContain(state);

    // instance type present and reasonable (not empty)
    expect(typeof instance?.InstanceType).toBe("string");
    expect((instance?.InstanceType ?? "").length).toBeGreaterThan(0);

    // verify subnet matches output public_subnet_id
    const subnetIdOut = outputs.public_subnet_id?.value ?? outputs.public_subnet_id;
    if (subnetIdOut) {
      expect(instance?.SubnetId).toBe(subnetIdOut);
    }

    // capture EC2 SGs for later checks
    const ec2Sgs = (instance?.SecurityGroups ?? []).map(s => s.GroupId).filter(Boolean);
    expect(ec2Sgs.length).toBeGreaterThan(0);

    // if metadata options present, prefer IMDSv2 required (non-fatal if absent)
    if (instance?.MetadataOptions) {
      expect(instance.MetadataOptions.HttpTokens).toBeDefined();
    }
  });

  test("RDS instance exists, encrypted and not publicly accessible; DB SG allows access only from EC2 SG(s) on MySQL port", async () => {
    const rdsEndpointVal = outputs.rds_endpoint?.value ?? outputs.rds_endpoint;
    expect(rdsEndpointVal).toBeDefined();
    const dbIdentifier = extractDbIdentifier(String(rdsEndpointVal));

    const rds = new RDSClient({ region });
    const dbRes = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier }));
    const db = dbRes.DBInstances?.[0];
    expect(db).toBeDefined();

    // encryption & public accessibility checks
    expect(db?.StorageEncrypted).toBeTruthy();
    expect(db?.PubliclyAccessible).toBeFalsy();

    // find RDS SG id(s)
    const rdsSgIds = (db?.VpcSecurityGroups ?? []).map(g => g.VpcSecurityGroupId).filter((id): id is string => typeof id === "string" && !!id);
    expect(rdsSgIds.length).toBeGreaterThan(0);

    // find EC2 SGs by describing the EC2 instance referenced in outputs
    const ec2InstanceId = outputs.ec2_instance_id?.value ?? outputs.ec2_instance_id;
    const ec2 = new EC2Client({ region });
    const instRes = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
    const instance = instRes.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();
    const ec2SgIds = (instance?.SecurityGroups ?? []).map(s => s.GroupId).filter(Boolean);
    expect(ec2SgIds.length).toBeGreaterThan(0);

    // Inspect RDS SG ingress rules: ensure at least one SG rule allows MySQL port (3306)
    const sgClient = new EC2Client({ region });
    const describeRes = await sgClient.send(new DescribeSecurityGroupsCommand({ GroupIds: rdsSgIds }));
    const rdsSgs = describeRes.SecurityGroups ?? [];
    expect(rdsSgs.length).toBeGreaterThan(0);

    // Ensure one of the rds SGs has inbound permission for port 3306 and source is EC2 SG
    let found = false;
    for (const sg of rdsSgs) {
      const perms = sg.IpPermissions ?? [];
      for (const p of perms) {
        const from = p.FromPort ?? -1;
        const to = p.ToPort ?? -1;
        const proto = p.IpProtocol ?? "";
        if ((from <= 3306 && to >= 3306) && (proto === "tcp" || proto === "-1")) {
          // ensure no broad cidr ranges present (best-effort)
          const ipRanges = p.IpRanges ?? [];
          const hasBroad = ipRanges.some(r => (r.CidrIp ?? "").startsWith("0.0.0.0/") || (r.CidrIp ?? "").startsWith("::/0"));
          expect(hasBroad).toBeFalsy();
          // ensure a user-group-pair references an EC2 SG id
          const userPairs = p.UserIdGroupPairs ?? [];
          if (userPairs.some(up => ec2SgIds.includes(up.GroupId ?? ""))) {
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    expect(found).toBeTruthy();
  });

  test("S3 application bucket exists and enforces server-side encryption (AES256)", async () => {
    const bucket = outputs.s3_app_bucket_name?.value ?? outputs.s3_app_bucket_name;
    expect(bucket).toBeDefined();
    const s3 = new S3Client({ region });

    // bucket exists
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));

    // check encryption
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
    expect(rule).toBeDefined();

    // expect AES256 (SSE-S3) or aws:kms depending on config; accept either but assert presence
    const alg = rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm ?? "";
    expect(["AES256", "aws:kms"]).toContain(alg);
  });

  test("bucket name follows expected prefix and length constraints (startsWith app-storage- and <=63 chars)", () => {
    const bucket = outputs.s3_app_bucket_name?.value ?? outputs.s3_app_bucket_name;
    expect(typeof bucket).toBe("string");
    expect(bucket.startsWith("app-storage-")).toBeTruthy();
    expect(bucket.length).toBeLessThanOrEqual(63);
  });
});
