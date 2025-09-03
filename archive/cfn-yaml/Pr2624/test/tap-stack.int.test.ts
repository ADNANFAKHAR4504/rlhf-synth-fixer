import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeVpcAttributeCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketPolicyCommand,
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
  GetKeyRotationStatusCommand,
} from "@aws-sdk/client-kms";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import * as fs from "fs";
import * as path from "path";

// ---------- Helpers ----------
function readOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  if (Array.isArray(raw)) {
    return raw.reduce(
      (acc: any, cur: any) => ({ ...acc, [cur.OutputKey]: cur.OutputValue }),
      {}
    );
  }
  if (typeof raw === "object" && raw !== null) {
    if ("Outputs" in raw) return raw.Outputs;
    if (Object.values(raw)[0] && Array.isArray(Object.values(raw)[0])) {
      return (Object.values(raw)[0] as any[]).reduce(
        (acc: any, cur: any) => ({ ...acc, [cur.OutputKey]: cur.OutputValue }),
        {}
      );
    }
    return raw;
  }
  throw new Error("Unsupported outputs structure");
}

function expectArn(arn: string, service: string) {
  expect(arn).toContain(`arn:aws:${service}:`);
}

async function retry<T>(fn: () => Promise<T>, attempts = 6, baseMs = 600): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// ---------- Setup ----------
const outputs = readOutputs();

const ec2 = new EC2Client({ region: process.env.AWS_REGION || "us-east-1" });
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const kms = new KMSClient({ region: process.env.AWS_REGION || "us-east-1" });
const secrets = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
const cloudtrail = new CloudTrailClient({ region: process.env.AWS_REGION || "us-east-1" });

// ---------- Tests ----------
describe("Integration: TapStack deployed resources", () => {
  // --- VPCs ---
  test("VPCs should exist", async () => {
    for (const vpcId of [outputs.VpcAId, outputs.VpcBId]) {
      const res = await retry(() =>
        ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }))
      );
      expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
    }
  });

  test("VPCs should have DNS support and hostnames enabled", async () => {
    for (const vpcId of [outputs.VpcAId, outputs.VpcBId]) {
      const dnsSupport = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: "enableDnsSupport" })
      );
      const dnsHostnames = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: "enableDnsHostnames" })
      );
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    }
  });

  // --- Subnets ---
  test("Subnets should exist and match expected VPCs", async () => {
    const subnetChecks: Record<string, string> = {
      [outputs.VpcAPublicSubnet1Id]: outputs.VpcAId,
      [outputs.VpcAPrivateSubnet1Id]: outputs.VpcAId,
      [outputs.VpcBPublicSubnet1Id]: outputs.VpcBId,
      [outputs.VpcBPrivateSubnet1Id]: outputs.VpcBId,
    };
    for (const [subnetId, vpcId] of Object.entries(subnetChecks)) {
      const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
      expect(res.Subnets?.[0].VpcId).toBe(vpcId);
    }
  });

  // --- Security Groups ---
  test("BastionSecurityGroup should allow only TCP/22", async () => {
    const sgId = outputs.BastionSecurityGroupId;
    const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
    const sg = res.SecurityGroups?.[0];
    expect(sg?.IpPermissions?.[0].FromPort).toBe(22);
    expect(sg?.IpPermissions?.[0].ToPort).toBe(22);
  });

  // --- VPC Peering ---
  test("VPC Peering connection should exist and link VpcA and VpcB", async () => {
    const pcxId = outputs.VpcPeeringId;
    const res = await ec2.send(
      new DescribeVpcPeeringConnectionsCommand({ VpcPeeringConnectionIds: [pcxId] })
    );
    const pcx = res.VpcPeeringConnections?.[0];
    expect(pcx?.VpcPeeringConnectionId).toBe(pcxId);
    expect([outputs.VpcAId, outputs.VpcBId]).toContain(pcx?.RequesterVpcInfo?.VpcId);
    expect([outputs.VpcAId, outputs.VpcBId]).toContain(pcx?.AccepterVpcInfo?.VpcId);
  });

  // --- S3 CloudTrail bucket ---
  test("CloudTrail bucket should exist and be encrypted", async () => {
    const bucketName = outputs.CloudTrailBucketArn.split(":::")[1];
    await expect(
      retry(() => s3.send(new HeadBucketCommand({ Bucket: bucketName })))
    ).resolves.toBeTruthy();

    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    expect(
      enc.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault
        ?.SSEAlgorithm
    ).toBe("aws:kms");
  });

  test("CloudTrail bucket should enforce public access block", async () => {
    const bucketName = outputs.CloudTrailBucketArn.split(":::")[1];
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
  });

  test("CloudTrail bucket policy should exist", async () => {
    const bucketName = outputs.CloudTrailBucketArn.split(":::")[1];
    const policy = await s3.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
    expect(policy.Policy).toMatch(/cloudtrail/);
  });

  // --- KMS ---
  test("KMS Key should be enabled", async () => {
    const keyArn = outputs.KmsKeyArn;
    const res = await kms.send(new DescribeKeyCommand({ KeyId: keyArn }));
    expect(res.KeyMetadata?.Arn).toBe(keyArn);
    expect(res.KeyMetadata?.KeyState).toBe("Enabled");
  });

  test("KMS Key should have rotation enabled", async () => {
    const keyArn = outputs.KmsKeyArn;
    const rotation = await kms.send(new GetKeyRotationStatusCommand({ KeyId: keyArn }));
    expect(rotation.KeyRotationEnabled).toBe(true);
  });

  // --- Secrets Manager ---
  test("DbSecret should exist and match ARN/Name", async () => {
    const secretArn = outputs.DbSecretArn;
    const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretArn }));
    expect(res.ARN).toBe(secretArn);
    expect(res.Name).toBe(outputs.DbSecretName);
  });

  test("DbSecret should not be scheduled for deletion", async () => {
    const secretArn = outputs.DbSecretArn;
    const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretArn }));
    expect(res.DeletedDate).toBeUndefined();
  });

  // --- CloudTrail ---
  test("CloudTrail trail should exist and be logging", async () => {
    const trailNameOrArn = outputs.CloudTrailTrailArn;
    const res = await cloudtrail.send(
      new DescribeTrailsCommand({ trailNameList: [trailNameOrArn] })
    );
    const trail = res.trailList?.[0];
    expect(trail?.TrailARN || trail?.Name).toBeTruthy();

    const status = await cloudtrail.send(new GetTrailStatusCommand({ Name: trailNameOrArn }));
    expect(status.IsLogging).toBe(true);
  });

  // --- Outputs sanity ---
  test("All critical outputs should exist and not be empty", () => {
    const requiredKeys = [
      "VpcAId",
      "VpcBId",
      "VpcPeeringId",
      "VpcAPublicSubnet1Id",
      "VpcAPrivateSubnet1Id",
      "VpcBPublicSubnet1Id",
      "VpcBPrivateSubnet1Id",
      "BastionSecurityGroupId",
      "CloudTrailBucketArn",
      "CloudTrailTrailArn",
      "KmsKeyArn",
      "KmsAliasName",
      "DbSecretArn",
      "DbSecretName",
    ];
    for (const key of requiredKeys) {
      expect(outputs[key]).toBeDefined();
      expect(outputs[key]).not.toBe("");
    }
  });

  test("Optional outputs should only validate if present", () => {
    if (outputs.ConfigBucketArn) expectArn(outputs.ConfigBucketArn, "s3");
    if (outputs.ConfigRoleArn) expect(outputs.ConfigRoleArn).toMatch(/^arn:aws:iam::/);
    if (outputs.GuardDutyDetectorId) expect(outputs.GuardDutyDetectorId).toMatch(/^([\w-])+$/);
  });

  test("No outputs should be empty strings", () => {
    for (const [key, value] of Object.entries(outputs)) {
      expect(value).toBeTruthy();
    }
  });
});
