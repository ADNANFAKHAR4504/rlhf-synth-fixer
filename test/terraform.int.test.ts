// tests/integration/tap_stack.integration.test.ts
/**
 * TAP Stack – Integration Tests (read-only, no terraform commands)
 *
 * Assumptions:
 * - CI/CD stores a JSON outputs file at: cfn-outputs/all-outputs.json
 * - AWS credentials/role already available in the environment with read-only perms
 * - Outputs shape matches the Terraform outputs in tap_stack.tf
 */

import fs from "fs";
import path from "path";
import { strict as assert } from "assert";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  Filter as Ec2Filter,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
} from "@aws-sdk/client-s3";
import {
  KMSClient,
  DescribeKeyCommand,
} from "@aws-sdk/client-kms";

type Outputs = {
  vpc_ids: { us_east_2: string; us_west_1: string };
  public_subnet_ids: { us_east_2: string; us_west_1: string };
  private_subnet_ids: { us_east_2: string[]; us_west_1: string[] };
  ec2_instance_ids: { us_east_2: string; us_west_1: string };
  ec2_public_ips: { us_east_2: string; us_west_1: string };
  s3_bucket_name: string;
  s3_bucket_arn: string;
  rds_endpoints: { us_east_2: string; us_west_1: string };
  rds_instance_ids: { us_east_2: string; us_west_1: string };
  kms_key_ids: { s3_key: string; rds_key_east: string; rds_key_west: string };
  security_group_ids: {
    ec2_east: string;
    ec2_west: string;
    rds_east: string;
    rds_west: string;
  };
  iam_role_arn: string;
  environment: string;
  project_name: string;
};

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const REGION_KEYS = { us_east_2: "us-east-2", us_west_1: "us-west-1" } as const;

const idPatterns = {
  vpc: /^vpc-[0-9a-f]+$/,
  subnet: /^subnet-[0-9a-f]+$/,
  sg: /^sg-[0-9a-f]+$/,
  ec2: /^i-[0-9a-f]+$/,
  kmsKeyId: /^[0-9a-f-]{36}$/, // key-id (UUID-like) not ARN
  ip: /^(?:\d{1,3}\.){3}\d{1,3}$/,
  rdsEndpoint: /^[a-z0-9.-]+\.rds\.amazonaws\.com$/,
};

const clients = {
  ec2: (region: string) => new EC2Client({ region }),
  rds: (region: string) => new RDSClient({ region }),
  s3: (region: string) => new S3Client({ region }),
  kms: (region: string) => new KMSClient({ region }),
};

function requireKey<T extends object>(obj: T, key: keyof T, msg?: string) {
  assert.ok(obj[key] !== undefined, msg ?? `Missing key: ${String(key)}`);
}

function normalize<T>(v: T | undefined, msg: string): T {
  assert.ok(v !== undefined, msg);
  return v as T;
}

function arnIncludesKeyId(arnOrId: string | undefined, keyId: string) {
  if (!arnOrId) return false;
  return arnOrId === keyId || arnOrId.endsWith(`/${keyId}`) || arnOrId.includes(keyId);
}

describe("TAP Stack – Integration (read-only)", () => {
  let o: Outputs;

  beforeAll(() => {
    assert.ok(fs.existsSync(outputsPath), `Outputs file not found at ${outputsPath}`);
    o = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));

    // Presence of required top-level outputs
    [
      "vpc_ids",
      "public_subnet_ids",
      "private_subnet_ids",
      "ec2_instance_ids",
      "ec2_public_ips",
      "s3_bucket_name",
      "s3_bucket_arn",
      "rds_endpoints",
      "rds_instance_ids",
      "kms_key_ids",
      "security_group_ids",
      "iam_role_arn",
      "environment",
      "project_name",
    ].forEach((k) => requireKey(o as any, k as any));
  });

  describe("Static output shape & format validation", () => {
    test("IDs and formats", () => {
      // VPCs
      Object.values(o.vpc_ids).forEach((id) => assert.match(id, idPatterns.vpc, `Invalid VPC ID: ${id}`));

      // Subnets
      [o.public_subnet_ids.us_east_2, o.public_subnet_ids.us_west_1].forEach((id) =>
        assert.match(id, idPatterns.subnet, `Invalid public subnet ID: ${id}`)
      );
      [...o.private_subnet_ids.us_east_2, ...o.private_subnet_ids.us_west_1].forEach((id) =>
        assert.match(id, idPatterns.subnet, `Invalid private subnet ID: ${id}`)
      );

      // EC2
      Object.values(o.ec2_instance_ids).forEach((id) =>
        assert.match(id, idPatterns.ec2, `Invalid EC2 instance ID: ${id}`)
      );
      Object.values(o.ec2_public_ips).forEach((ip) =>
        assert.match(ip, idPatterns.ip, `Invalid public IP: ${ip}`)
      );

      // RDS
      Object.values(o.rds_endpoints).forEach((e) =>
        assert.match(e, idPatterns.rdsEndpoint, `Invalid RDS endpoint: ${e}`)
      );

      // SGs
      Object.values(o.security_group_ids).forEach((id) =>
        assert.match(id, idPatterns.sg, `Invalid Security Group ID: ${id}`)
      );

      // KMS key ids (key IDs, not ARNs)
      Object.values(o.kms_key_ids).forEach((id) =>
        assert.match(id, idPatterns.kmsKeyId, `Invalid KMS key id: ${id}`)
      );
    });
  });

  describe("VPC & Subnet checks (live)", () => {
    (Object.keys(REGION_KEYS) as Array<keyof typeof REGION_KEYS>).forEach((rid) => {
      const region = REGION_KEYS[rid];
      const ec2 = clients.ec2(region);
      const vpcId = o.vpc_ids[rid];
      const pubSubnet = o.public_subnet_ids[rid];
      const privSubnets = o.private_subnet_ids[rid];

      test(`[${region}] VPC exists`, async () => {
        const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        assert.ok(res.Vpcs && res.Vpcs[0], `VPC not found: ${vpcId}`);
        const tags = res.Vpcs![0].Tags || [];
        const tagMap = Object.fromEntries(tags.map(t => [t.Key!, t.Value!]));
        assert.equal(tagMap.ManagedBy, "Terraform", "VPC ManagedBy tag must be Terraform");
        assert.ok(tagMap.Project?.length, "VPC Project tag missing");
      });

      test(`[${region}] Subnets exist & public subnet maps public IPs; private subnets do not`, async () => {
        const subRes = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [pubSubnet, ...privSubnets] }));
        const subs = normalize(subRes.Subnets, "Subnets not returned");
        const byId = Object.fromEntries(subs.map(s => [s.SubnetId!, s]));
        assert.equal(byId[pubSubnet].MapPublicIpOnLaunch, true, "Public subnet should map public IP on launch");
        for (const sid of privSubnets) {
          assert.equal(byId[sid].MapPublicIpOnLaunch, false, `Private subnet ${sid} must NOT map public IPs`);
        }
        subs.forEach(s => assert.equal(s.VpcId, vpcId, `Subnet ${s.SubnetId} not in expected VPC ${vpcId}`));
      });

      test(`[${region}] Public route table allows 0.0.0.0/0 via IGW`, async () => {
        const rtRes = await ec2.send(new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [pubSubnet] }],
        }));
        const rts = rtRes.RouteTables || [];
        assert.ok(rts.length > 0, "No route table associated with public subnet");
        const hasDefaultRoute = rts.some(rt =>
          (rt.Routes || []).some(r => r.DestinationCidrBlock === "0.0.0.0/0" && !!r.GatewayId)
        );
        assert.ok(hasDefaultRoute, "Public subnet lacks default route to Internet Gateway");
      });
    });
  });

  describe("EC2 instance checks (live)", () => {
    (Object.keys(REGION_KEYS) as Array<keyof typeof REGION_KEYS>).forEach((rid) => {
      const region = REGION_KEYS[rid];
      const ec2 = clients.ec2(region);
      const instanceId = o.ec2_instance_ids[rid];
      const expectedSg =
        rid === "us_east_2" ? o.security_group_ids.ec2_east : o.security_group_ids.ec2_west;
      const expectedSubnet = o.public_subnet_ids[rid];
      const expectedIp = o.ec2_public_ips[rid];
      const project = o.project_name;

      test(`[${region}] EC2 instance is running, in correct subnet & SG, with expected public IP`, async () => {
        const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const inst = res.Reservations?.[0]?.Instances?.[0];
        assert.ok(inst, `EC2 instance not found: ${instanceId}`);
        assert.equal(inst.State?.Name, "running", "EC2 should be running");
        assert.equal(inst.SubnetId, expectedSubnet, "EC2 in unexpected subnet");
        const sgs = (inst.SecurityGroups || []).map(s => s.GroupId);
        assert.ok(sgs.includes(expectedSg), `EC2 missing expected SG ${expectedSg}`);
        assert.equal(inst.PublicIpAddress, expectedIp, "Instance Public IP does not match outputs");

        // Instance profile name convention contains "<project>-ec2-profile"
        const profileArn = inst.IamInstanceProfile?.Arn || "";
        assert.ok(
          profileArn.includes(`${project}-ec2-profile`),
          `Unexpected instance profile ARN: ${profileArn}`
        );
      });

      test(`[${region}] Root volume is gp3 and encrypted`, async () => {
        // Find volumes attached to the instance and pick the root by DeviceName
        const vols = await ec2.send(new DescribeVolumesCommand({
          Filters: [{ Name: "attachment.instance-id", Values: [instanceId] } as Ec2Filter],
        }));
        assert.ok(vols.Volumes && vols.Volumes.length > 0, "No volumes attached");
        const root = vols.Volumes!.find(v =>
          (v.Attachments || []).some(a => a.InstanceId === instanceId && (a.Device || "").startsWith("/dev/xvd"))
        ) || vols.Volumes![0];
        assert.equal(root.VolumeType, "gp3", "Root volume should be gp3");
        assert.equal(root.Encrypted, true, "Root volume must be encrypted");
      });
    });

    test("[SecurityGroups] EC2 SGs allow SSH:22 and HTTP:80 from 0.0.0.0/0 (as defined)", async () => {
      const east = await clients.ec2(REGION_KEYS.us_east_2).send(
        new DescribeSecurityGroupsCommand({ GroupIds: [o.security_group_ids.ec2_east] })
      );
      const west = await clients.ec2(REGION_KEYS.us_west_1).send(
        new DescribeSecurityGroupsCommand({ GroupIds: [o.security_group_ids.ec2_west] })
      );
      for (const sg of [east.SecurityGroups![0], west.SecurityGroups![0]]) {
        const ingress = sg.IpPermissions || [];
        const has22 = ingress.some(p => p.FromPort === 22 && p.ToPort === 22 &&
          (p.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0"));
        const has80 = ingress.some(p => p.FromPort === 80 && p.ToPort === 80 &&
          (p.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0"));
        assert.ok(has22, `EC2 SG ${sg.GroupId} must allow SSH 22 from 0.0.0.0/0 (per tf)`);
        assert.ok(has80, `EC2 SG ${sg.GroupId} must allow HTTP 80 from 0.0.0.0/0 (per tf)`);
      }
    });
  });

  describe("S3 bucket checks (live)", () => {
    const s3 = clients.s3(REGION_KEYS.us_east_2);
    const bucket = () => o.s3_bucket_name;

    test("Bucket exists", async () => {
      await s3.send(new HeadBucketCommand({ Bucket: bucket() }));
    });

    test("Versioning is enabled", async () => {
      const v = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket() }));
      assert.equal(v.Status, "Enabled", "S3 versioning must be Enabled");
    });

    test("Public access block is enforced", async () => {
      const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket() }));
      const c = pab.PublicAccessBlockConfiguration!;
      assert.equal(c.BlockPublicAcls, true);
      assert.equal(c.BlockPublicPolicy, true);
      assert.equal(c.IgnorePublicAcls, true);
      assert.equal(c.RestrictPublicBuckets, true);
    });

    test("SSE-KMS enforced with expected key", async () => {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket() }));
      const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
      const sse = rule?.ApplyServerSideEncryptionByDefault;
      assert.ok(sse?.SSEAlgorithm === "aws:kms", "S3 must enforce aws:kms");
      assert.ok(
        arnIncludesKeyId(sse?.KMSMasterKeyID, o.kms_key_ids.s3_key),
        `S3 SSE KMS key mismatch. Expected key id ${o.kms_key_ids.s3_key}, got ${sse?.KMSMasterKeyID}`
      );
    });

    test("Bucket policy grants EC2 role limited S3 access (Get/Put/Delete/List)", async () => {
      const pol = await s3.send(new GetBucketPolicyCommand({ Bucket: bucket() }));
      const doc = JSON.parse(pol.Policy || "{}");
      const stmts: any[] = doc.Statement || [];
      const hasObjectPerms = stmts.some(s =>
        s.Effect === "Allow" &&
        ((s.Principal?.AWS || "") === o.iam_role_arn) &&
        Array.isArray(s.Action) &&
        ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"].every(a => s.Action.includes(a))
      );
      const hasListPerm = stmts.some(s =>
        s.Effect === "Allow" &&
        ((s.Principal?.AWS || "") === o.iam_role_arn) &&
        s.Action === "s3:ListBucket"
      );
      assert.ok(hasObjectPerms, "Bucket policy lacks required object permissions for EC2 role");
      assert.ok(hasListPerm, "Bucket policy lacks required ListBucket for EC2 role");
    });

    test("Bucket is not public (policy status)", async () => {
      const st = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: bucket() }));
      assert.equal(st.PolicyStatus?.IsPublic, false, "Bucket must not be public");
    });
  });

  describe("RDS checks (live)", () => {
    (Object.keys(REGION_KEYS) as Array<keyof typeof REGION_KEYS>).forEach((rid) => {
      const region = REGION_KEYS[rid];
      const rds = clients.rds(region);
      const ec2 = clients.ec2(region);
      const dbId = o.rds_instance_ids[rid];
      const expectedSg =
        rid === "us_east_2" ? o.security_group_ids.rds_east : o.security_group_ids.rds_west;
      const expectedPrivSubnets = o.private_subnet_ids[rid];
      const expectedKeyId =
        rid === "us_east_2" ? o.kms_key_ids.rds_key_east : o.kms_key_ids.rds_key_west;

      test(`[${region}] DB instance available, encrypted with expected KMS key, Multi-AZ`, async () => {
        const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbId }));
        const db = res.DBInstances?.[0];
        assert.ok(db, `RDS instance not found: ${dbId}`);
        assert.equal(db.DBInstanceStatus, "available", "RDS must be available");
        assert.equal(db.Engine, "postgres", "Engine must be postgres");
        assert.equal(db.MultiAZ, true, "RDS must be Multi-AZ");
        assert.equal(db.StorageEncrypted, true, "RDS storage must be encrypted");
        assert.ok(
          arnIncludesKeyId(db.KmsKeyId!, expectedKeyId),
          `RDS KMS key mismatch. Expected ${expectedKeyId}, got ${db.KmsKeyId}`
        );
        // SG presence
        const vpcSgs = (db.VpcSecurityGroups || []).map(s => s.VpcSecurityGroupId);
        assert.ok(vpcSgs.includes(expectedSg), `RDS missing expected SG ${expectedSg}`);

        // Subnet group contains our two private subnets
        const subnetIds = (db.DBSubnetGroup?.Subnets || []).map(s => s.SubnetIdentifier!);
        for (const sid of expectedPrivSubnets) {
          assert.ok(subnetIds.includes(sid), `DB Subnet Group missing subnet ${sid}`);
        }
      });

      test(`[${region}] RDS SG allows 5432 from corresponding EC2 SG`, async () => {
        const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [expectedSg] }));
        const sg = sgs.SecurityGroups?.[0];
        assert.ok(sg, `RDS SG not found: ${expectedSg}`);
        const ingress = sg.IpPermissions || [];
        const ok5432 = ingress.some(p =>
          p.FromPort === 5432 &&
          p.ToPort === 5432 &&
          (p.UserIdGroupPairs || []).some(g => {
            const ec2Sg = rid === "us_east_2" ? o.security_group_ids.ec2_east : o.security_group_ids.ec2_west;
            return g.GroupId === ec2Sg;
          })
        );
        assert.ok(ok5432, "RDS SG must allow 5432 from the EC2 SG");
      });
    });
  });

  describe("KMS keys (live)", () => {
    test("KMS keys exist and are Enabled", async () => {
      const kms = clients.kms(REGION_KEYS.us_east_2);
      const east = await kms.send(new DescribeKeyCommand({ KeyId: o.kms_key_ids.s3_key }));
      assert.equal(east.KeyMetadata?.KeyState, "Enabled", "S3 KMS key must be Enabled");
      const rdsEast = await kms.send(new DescribeKeyCommand({ KeyId: o.kms_key_ids.rds_key_east }));
      assert.equal(rdsEast.KeyMetadata?.KeyState, "Enabled", "RDS East KMS key must be Enabled");

      const kmsW = clients.kms(REGION_KEYS.us_west_1);
      const rdsWest = await kmsW.send(new DescribeKeyCommand({ KeyId: o.kms_key_ids.rds_key_west }));
      assert.equal(rdsWest.KeyMetadata?.KeyState, "Enabled", "RDS West KMS key must be Enabled");
    });
  });

  describe("Tagging standards (live)", () => {
    test("[us-east-2] EC2/RDS carry standard tags", async () => {
      const ec2 = clients.ec2(REGION_KEYS.us_east_2);
      const rds = clients.rds(REGION_KEYS.us_east_2);

      const ec2Res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [o.ec2_instance_ids.us_east_2] }));
      const inst = ec2Res.Reservations?.[0]?.Instances?.[0];
      const ec2Tags = Object.fromEntries((inst?.Tags || []).map(t => [t.Key!, t.Value!]));
      assert.equal(ec2Tags.ManagedBy, "Terraform");
      assert.equal(ec2Tags.Environment, o.environment);
      assert.equal(ec2Tags.Project, o.project_name);

      const rdsRes = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: o.rds_instance_ids.us_east_2 }));
      const db = rdsRes.DBInstances?.[0];
      const rdsTags = Object.fromEntries((db?.TagList || []).map(t => [t.Key!, t.Value!]));
      assert.equal(rdsTags.ManagedBy, "Terraform");
      assert.equal(rdsTags.Environment, o.environment);
      assert.equal(rdsTags.Project, o.project_name);
    });

    test("[us-west-1] EC2/RDS carry standard tags", async () => {
      const ec2 = clients.ec2(REGION_KEYS.us_west_1);
      const rds = clients.rds(REGION_KEYS.us_west_1);

      const ec2Res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [o.ec2_instance_ids.us_west_1] }));
      const inst = ec2Res.Reservations?.[0]?.Instances?.[0];
      const ec2Tags = Object.fromEntries((inst?.Tags || []).map(t => [t.Key!, t.Value!]));
      assert.equal(ec2Tags.ManagedBy, "Terraform");
      assert.equal(ec2Tags.Environment, o.environment);
      assert.equal(ec2Tags.Project, o.project_name);

      const rdsRes = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: o.rds_instance_ids.us_west_1 }));
      const db = rdsRes.DBInstances?.[0];
      const rdsTags = Object.fromEntries((db?.TagList || []).map(t => [t.Key!, t.Value!]));
      assert.equal(rdsTags.ManagedBy, "Terraform");
      assert.equal(rdsTags.Environment, o.environment);
      assert.equal(rdsTags.Project, o.project_name);
    });
  });
});
