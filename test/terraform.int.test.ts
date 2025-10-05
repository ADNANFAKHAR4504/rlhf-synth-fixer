import { readFileSync } from "fs";
import { join } from "path";
import dns from "dns/promises";
import https from "https";
import AWS from "aws-sdk";

const outputsPath = join(__dirname, "../cfn-outputs/flat-outputs.json");
const terraformOutput = JSON.parse(readFileSync(outputsPath, "utf-8"));

const regionPrimary = "us-west-2";
const regionSecondary = "eu-west-1";

const ec2Primary = new AWS.EC2({ region: regionPrimary });
const ec2Secondary = new AWS.EC2({ region: regionSecondary });
const rdsPrimary = new AWS.RDS({ region: regionPrimary });
const rdsSecondary = new AWS.RDS({ region: regionSecondary });
const s3Primary = new AWS.S3({ region: regionPrimary });
const s3Secondary = new AWS.S3({ region: regionSecondary });
const secretsPrimary = new AWS.SecretsManager({ region: regionPrimary });
const secretsSecondary = new AWS.SecretsManager({ region: regionSecondary });
const asgPrimary = new AWS.AutoScaling({ region: regionPrimary });
const asgSecondary = new AWS.AutoScaling({ region: regionSecondary });
const elbv2Primary = new AWS.ELBv2({ region: regionPrimary });
const elbv2Secondary = new AWS.ELBv2({ region: regionSecondary });
const iam = new AWS.IAM();

describe("TAP Stack Extended Live Integration Tests", () => {
  // -----------------------------
  // VPC & Networking
  // -----------------------------
  it("Primary VPC CIDR matches expected", async () => {
    const vpcId = terraformOutput.primary_vpc_id;
    const res = await ec2Primary.describeVpcs({ VpcIds: [vpcId] }).promise();
    expect(res.Vpcs?.[0]?.CidrBlock).toBe(terraformOutput.primary_vpc_cidr);
  });

  it("Secondary VPC CIDR matches expected", async () => {
    const vpcId = terraformOutput.secondary_vpc_id;
    const res = await ec2Secondary.describeVpcs({ VpcIds: [vpcId] }).promise();
    expect(res.Vpcs?.[0]?.CidrBlock).toBe(terraformOutput.secondary_vpc_cidr);
  });

  it("Primary NAT Gateways exist and are available", async () => {
    const ids = JSON.parse(terraformOutput.primary_nat_gateway_ids);
    const res = await ec2Primary.describeNatGateways({ NatGatewayIds: ids }).promise();
    res.NatGateways?.forEach(gw => {
      expect(gw.State).toBe("available");
    });
  });

  // -----------------------------
  // ALB & Target Groups
  // -----------------------------
  it("Primary ALB DNS resolves & serves HTTPS", async () => {
    const albDns = terraformOutput.primary_alb_dns;
    const addrs = await dns.lookup(albDns);
    expect(addrs.address).toBeDefined();

    await new Promise<void>((resolve, reject) => {
      https.get(`https://${albDns}`, (res) => {
        if (res.statusCode && res.statusCode < 500) resolve();
        else reject(new Error(`Unexpected status: ${res.statusCode}`));
      }).on("error", reject);
    });
  });

  it("Primary Target Group has healthy targets", async () => {
    const tgArn = terraformOutput.primary_target_group_arn;
    const res = await elbv2Primary.describeTargetHealth({ TargetGroupArn: tgArn }).promise();
    const healthy = res.TargetHealthDescriptions?.filter(t => t.TargetHealth?.State === "healthy");
    expect(healthy?.length).toBeGreaterThan(0);
  });

  it("Secondary Target Group has healthy targets", async () => {
    const tgArn = terraformOutput.secondary_target_group_arn;
    const res = await elbv2Secondary.describeTargetHealth({ TargetGroupArn: tgArn }).promise();
    const healthy = res.TargetHealthDescriptions?.filter(t => t.TargetHealth?.State === "healthy");
    expect(healthy?.length).toBeGreaterThan(0);
  });

  // -----------------------------
  // RDS
  // -----------------------------
  it("Primary RDS has backups enabled & encrypted", async () => {
    const dbId = terraformOutput.primary_rds_instance_id;
    const res = await rdsPrimary.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
    const instance = res.DBInstances?.[0];
    expect(instance?.BackupRetentionPeriod).toBeGreaterThan(0);
    expect(instance?.StorageEncrypted).toBe(true);
  });

  it("Secondary RDS has backups enabled & encrypted", async () => {
    const dbId = terraformOutput.secondary_rds_instance_id;
    const res = await rdsSecondary.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
    const instance = res.DBInstances?.[0];
    expect(instance?.BackupRetentionPeriod).toBeGreaterThan(0);
    expect(instance?.StorageEncrypted).toBe(true);
  });

  // -----------------------------
  // S3 Buckets
  // -----------------------------
  it("Primary & Secondary S3 block public access", async () => {
    for (const [bucket, client] of [
      [terraformOutput.primary_s3_bucket_name, s3Primary],
      [terraformOutput.secondary_s3_bucket_name, s3Secondary],
    ] as const) {
      const pubBlock = await client.getBucketPublicAccessBlock({ Bucket: bucket }).promise();
      expect(pubBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pubBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    }
  });

  // -----------------------------
  // Auto Scaling Groups
  // -----------------------------
  it("ASGs in both regions have ≥2 instances in service", async () => {
    for (const [asgName, client] of [
      [terraformOutput.primary_asg_name, asgPrimary],
      [terraformOutput.secondary_asg_name, asgSecondary],
    ] as const) {
      const res = await client.describeAutoScalingGroups({ AutoScalingGroupNames: [asgName] }).promise();
      const group = res.AutoScalingGroups?.[0];
      const inService = (group?.Instances || []).filter(i => i.LifecycleState === "InService");
      expect(inService.length).toBeGreaterThanOrEqual(2);
    }
  });

  // -----------------------------
  // IAM Roles & Instance Profiles
  // -----------------------------
  it("Primary & Secondary IAM roles exist", async () => {
    for (const arn of [terraformOutput.primary_iam_role_arn, terraformOutput.secondary_iam_role_arn]) {
      const name = arn.split("/").pop();
      const res = await iam.getRole({ RoleName: name! }).promise();
      expect(res.Role?.Arn).toBe(arn);
    }
  });

  it("Primary & Secondary Instance Profiles exist", async () => {
    for (const name of [terraformOutput.primary_instance_profile_name, terraformOutput.secondary_instance_profile_name]) {
      const res = await iam.getInstanceProfile({ InstanceProfileName: name }).promise();
      expect(res.InstanceProfile?.InstanceProfileName).toBe(name);
    }
  });

  // -----------------------------
  // EC2 Launch Templates
  // -----------------------------
  it("Launch templates reference correct AMIs", async () => {
    for (const [ltId, ami, client] of [
      [terraformOutput.primary_launch_template_id, terraformOutput.primary_ami_id, ec2Primary],
      [terraformOutput.secondary_launch_template_id, terraformOutput.secondary_ami_id, ec2Secondary],
    ] as const) {
      const res = await client.describeLaunchTemplates({ LaunchTemplateIds: [ltId] }).promise();
      expect(res.LaunchTemplates?.[0]).toBeDefined();
      // Spot check AMI via versions
      const versions = await client.describeLaunchTemplateVersions({ LaunchTemplateId: ltId }).promise();
      const imageIds = versions.LaunchTemplateVersions?.map(v => v.LaunchTemplateData?.ImageId);
      expect(imageIds).toContain(ami);
    }
  });

  // -----------------------------
  // Secrets Manager
  // -----------------------------
  it("Secrets Manager has rotation enabled for RDS secrets", async () => {
    for (const [secretArn, client] of [
      [terraformOutput.primary_secret_arn, secretsPrimary],
      [terraformOutput.secondary_secret_arn, secretsSecondary],
    ] as const) {
      const res = await client.describeSecret({ SecretId: secretArn }).promise();
      expect(res.RotationEnabled).toBe(true);
    }
  });
});
