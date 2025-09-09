import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
} from "@aws-sdk/client-s3";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import * as fs from "fs";
import * as path from "path";

// -------------------------------
// Helpers
// -------------------------------
function readOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8"));
  return (
    out["TapStackpr2870"]?.reduce(
      (acc: Record<string, string>, cur: any) => {
        acc[cur.OutputKey] = cur.OutputValue;
        return acc;
      },
      {}
    ) ?? out
  );
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

const outputs = readOutputs();
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

// Clients
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const rds = new RDSClient({ region });
const secrets = new SecretsManagerClient({ region });
const iam = new IAMClient({ region });
const autoscaling = new AutoScalingClient({ region });

// -------------------------------
// Integration Tests
// -------------------------------
describe("LIVE Integration Tests - TapStack", () => {
  // VPC & Networking
  test("VPC exists", async () => {
    const vpcId = outputs["VPCId"];
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
    expect(res.Vpcs?.[0].State).toBe("available");
  });

  test("Subnets exist and are unique", async () => {
    const subnets = [
      outputs["PublicSubnet1Id"],
      outputs["PublicSubnet2Id"],
      outputs["PrivateSubnet1Id"],
      outputs["PrivateSubnet2Id"],
    ];
    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnets }));
    expect(res.Subnets?.length).toBe(4);
    const ids = res.Subnets?.map((s) => s.SubnetId);
    expect(new Set(ids).size).toBe(4);
  });

  test("Internet Gateway exists and is attached", async () => {
    const igwId = outputs["InternetGatewayId"];
    const res = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
    expect(res.InternetGateways?.[0].InternetGatewayId).toBe(igwId);
  });

  test("Public Route Table exists", async () => {
    const rtbId = outputs["PublicRouteTableId"];
    const res = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [rtbId] }));
    expect(res.RouteTables?.[0].Associations?.length).toBeGreaterThan(0);
  });

  // Security Groups
  test("Security Groups exist", async () => {
    const sgs = [outputs["PublicSecurityGroupId"], outputs["PrivateSecurityGroupId"]];
    const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgs }));
    expect(res.SecurityGroups?.length).toBe(2);
  });

  // IAM
  test("IAM Role exists", async () => {
    const roleArn = outputs["EC2RoleArn"];
    const roleName = outputs["EC2RoleName"];
    const res = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(res.Role?.Arn).toBe(roleArn);
  });

  test("IAM Instance Profile exists", async () => {
    const profileName = outputs["EC2InstanceProfileName"];
    const res = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
    expect(res.InstanceProfile?.InstanceProfileName).toBe(profileName);
  });

  // S3 Logs Bucket
  test("Logs bucket exists", async () => {
    const bucket = outputs["LogsBucketName"];
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();
  });

  test("Logs bucket has versioning enabled", async () => {
    const bucket = outputs["LogsBucketName"];
    const res = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
    expect(res.Status).toBe("Enabled");
  });

  test("Logs bucket lifecycle rule exists", async () => {
    const bucket = outputs["LogsBucketName"];
    const res = await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
    expect(res.Rules?.some((r) => r.Expiration?.Days === 30)).toBe(true);
  });

  test("Logs bucket has Environment=Prod tag", async () => {
    const bucket = outputs["LogsBucketName"];
    const res = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
    expect(res.TagSet).toEqual(expect.arrayContaining([{ Key: "Environment", Value: "Prod" }]));
  });

  // Secrets Manager
  test("RDS Secret exists", async () => {
    const secretName = outputs["RDSSecretName"];
    const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
    expect(res.Name).toContain("myapp/rds/master");
  });

  // RDS
  test("RDS instance exists and is available", async () => {
    const dbId = outputs["RDSInstanceId"];
    const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbId }));
    expect(res.DBInstances?.[0].DBInstanceIdentifier).toBe(dbId);
    expect(res.DBInstances?.[0].DBInstanceStatus).toBe("available");
    expect(res.DBInstances?.[0].StorageEncrypted).toBe(true);
  });

  test("RDS subnet group exists", async () => {
    const group = outputs["RDSSubnetGroup"];
    const res = await rds.send(new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: group }));
    expect(res.DBSubnetGroups?.[0].DBSubnetGroupName).toBe(group);
  });

  // Launch Template & Auto Scaling
  test("Launch Template exists", async () => {
    const ltId = outputs["LaunchTemplateId"];
    const res = await ec2.send(new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [ltId] }));
    expect(res.LaunchTemplates?.[0].LaunchTemplateId).toBe(ltId);
  });

  test("AutoScaling Group exists", async () => {
    const asgName = outputs["AutoScalingGroupName"];
    const res = await autoscaling.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
    expect(res.AutoScalingGroups?.[0].AutoScalingGroupName).toBe(asgName);
    expect(res.AutoScalingGroups?.[0].MinSize).toBe(2);
    expect(res.AutoScalingGroups?.[0].MaxSize).toBe(6);
  });

  // Edge cases
  test("All outputs should be non-empty strings", () => {
    Object.values(outputs).forEach((val) => {
      expect(typeof val).toBe("string");
      expect((val as string).trim().length).toBeGreaterThan(0);
    });
  });

  test("All ARNs should start with arn:aws:", () => {
    const arnKeys = ["LogsBucketArn", "EC2RoleArn", "RDSSecretName"];
    arnKeys.forEach((key) => {
      const arn = outputs[key];
      expect(arn).toMatch(/^arn:aws:/);
    });
  });

  test("RDS port should be numeric string", () => {
    expect(outputs["RDSInstancePort"]).toMatch(/^\d+$/);
  });
});
