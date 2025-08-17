// integration_test.ts
// Live integration tests for the deployed TapStack stack.
// Reads cfn-outputs/flat-outputs.json (same pattern as your Python snippet) and
// verifies real AWS resources in us-east-1 using AWS SDK v3.

import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { beforeAll, describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";

// ---- flat outputs loader (keep format compatible with your pipeline) ----
const baseDir = path.dirname(__filename);
const flatOutputsPath = path.resolve(baseDir, "..", "..", "cfn-outputs", "flat-outputs.json");
const flatOutputs = fs.existsSync(flatOutputsPath)
  ? JSON.parse(fs.readFileSync(flatOutputsPath, "utf-8"))
  : {};

// Helper: resolve a value from flat outputs by suffix or exact key.
function getOutput(key: string): string | undefined {
  if (flatOutputs[key]) return String(flatOutputs[key]);

  // Common patterns: "<StackName>.<OutputKey>" or just "<OutputKey>"
  const entries = Object.entries(flatOutputs) as [string, unknown][];
  const bySuffix = entries.find(([k]) => k.endsWith(`.${key}`));
  if (bySuffix) return String(bySuffix[1]);

  // Last resort: contains (more permissive but helpful in CI)
  const byContains = entries.find(([k]) => k.includes(key));
  return byContains ? String(byContains[1]) : undefined;
}

// ---- expected outputs from your template ----
const SECURITY_GROUP_ID = getOutput("SecurityGroupId");
const INSTANCE_ID = getOutput("InstanceId");
const BUCKET_NAME = getOutput("BucketName");

// Region is fixed by template rule
const REGION = process.env.AWS_REGION || "us-east-1";

// ---- AWS clients (read-only) ----
const ec2 = new EC2Client({ region: REGION });
const s3 = new S3Client({ region: REGION });

describe("TapStack Integration Tests (live)", () => {
  beforeAll(() => {
    // Basic sanity so tests fail with clear messages if outputs are missing
    expect(SECURITY_GROUP_ID).toBeTruthy();
    expect(INSTANCE_ID).toBeTruthy();
    expect(BUCKET_NAME).toBeTruthy();
  });

  it("Security Group allows only SSH(22) and HTTPS(443) inbound, and allow-all egress", async () => {
    const sgId = SECURITY_GROUP_ID!;
    const { SecurityGroups } = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
    );
    expect(SecurityGroups && SecurityGroups.length).toBe(1);
    const sg = SecurityGroups![0];

    // Inbound: exactly two rules, ports 22 and 443 (tcp)
    const ingress = (sg.IpPermissions ?? []).flatMap((p) =>
      (p.IpRanges ?? []).map((r) => ({
        ipProtocol: p.IpProtocol,
        from: p.FromPort,
        to: p.ToPort,
        cidr: r.CidrIp,
      }))
    );

    const ingressPorts = ingress.map((r) => r.from);
    expect(ingress.length).toBe(2);
    expect(ingressPorts.sort()).toEqual([22, 443]);

    // Ensure protocols are TCP and CIDR exists (default is 0.0.0.0/0 per template)
    ingress.forEach((r) => {
      expect(r.ipProtocol).toBe("tcp");
      expect(typeof r.cidr).toBe("string");
    });

    // Egress: allow-all (protocol -1 to 0.0.0.0/0)
    const egress = (sg.IpPermissionsEgress ?? []).flatMap((p) =>
      (p.IpRanges ?? []).map((r) => ({
        ipProtocol: p.IpProtocol,
        cidr: r.CidrIp,
      }))
    );
    const hasAllowAll = egress.some((r) => r.ipProtocol === "-1" && r.cidr === "0.0.0.0/0");
    expect(hasAllowAll).toBe(true);

    // Tag check
    const envTag = (sg.Tags ?? []).find((t) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });

  it("EC2 Instance exists, is attached to the SG, and tagged Environment=Production", async () => {
    const instanceId = INSTANCE_ID!;
    const { Reservations } = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );
    const instance = Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeTruthy();

    // SG association
    const sgIds = (instance!.SecurityGroups ?? []).map((g) => g.GroupId);
    expect(sgIds).toContain(SECURITY_GROUP_ID);

    // Tag check
    const envTag = (instance!.Tags ?? []).find((t) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");

    // Basic platform sanity: Linux/UNIX (Amazon Linux 2)
    // (We won't hard-assert AL2 name here to avoid regional catalog drift)
    expect(instance!.PlatformDetails || "Linux/UNIX").toContain("Linux");
  });

  it("S3 bucket has server-side encryption (AES256) and public access blocks enabled", async () => {
    const bucket = BUCKET_NAME!;

    // SSE check
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
    const rules = enc.ServerSideEncryptionConfiguration?.Rules ?? [];
    const hasAES256 = rules.some(
      (r) => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256"
    );
    expect(hasAES256).toBe(true);

    // Public access block check
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
    const cfg = pab.PublicAccessBlockConfiguration;
    expect(cfg?.BlockPublicAcls).toBe(true);
    expect(cfg?.BlockPublicPolicy).toBe(true);
    expect(cfg?.IgnorePublicAcls).toBe(true);
    expect(cfg?.RestrictPublicBuckets).toBe(true);

    // Tag check
    const tagging = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
    const envTag = (tagging.TagSet ?? []).find((t) => t.Key === "Environment");
    expect(envTag?.Value).toBe("Production");
  });
});
