// test/terraform.int.test.ts
import fs from "fs";
import path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const outputs = JSON.parse(fs.readFileSync(p, "utf-8"));

// Map TF region keys to AWS SDK region names
const REGION_MAP: Record<string, string> = {
  us_east_2: "us-east-2",
  us_west_1: "us-west-1"
};

describe("Terraform stack integration tests (read-only AWS checks)", () => {
  it("should have valid basic metadata", () => {
    expect(outputs.project_name.value).toBe("tap-stack");
    expect(outputs.environment.value).toMatch(/dev|staging|prod/);
    expect(outputs.iam_role_arn.value).toMatch(/^arn:aws:iam::\d{12}:role\//);
  });

  Object.entries(REGION_MAP).forEach(([tfRegionKey, awsRegion]) => {
    describe(`Region: ${awsRegion}`, () => {
      const ec2 = new EC2Client({ region: awsRegion });
      const rds = new RDSClient({ region: awsRegion });
      const s3 = new S3Client({ region: awsRegion });
      const iam = new IAMClient({ region: awsRegion });
      const kms = new KMSClient({ region: awsRegion });

      it("VPC should exist", async () => {
        const vpcId = outputs.vpc_ids.value[tfRegionKey];
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

        const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(res.Vpcs?.[0]?.VpcId).toBe(vpcId);
      });

      it("Public and private subnets should exist", async () => {
        const pubSubnet = outputs.public_subnet_ids.value[tfRegionKey];
        const privSubnets = outputs.private_subnet_ids.value[tfRegionKey];
        expect(pubSubnet).toMatch(/^subnet-[a-f0-9]+$/);
        privSubnets.forEach(s => expect(s).toMatch(/^subnet-[a-f0-9]+$/));

        const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [pubSubnet, ...privSubnets] }));
        expect(res.Subnets?.length).toBeGreaterThanOrEqual(3);
      });

      it("Security groups should exist", async () => {
        const sgKey = tfRegionKey === "us_east_2" ? "ec2_east" : "ec2_west";
        const sgId = outputs.security_group_ids.value[sgKey];
        expect(sgId).toMatch(/^sg-[a-f0-9]+$/);

        const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
        expect(res.SecurityGroups?.[0]?.GroupId).toBe(sgId);
      });

      it("EC2 instance should be running", async () => {
        const instanceId = outputs.ec2_instance_ids.value[tfRegionKey];
        expect(instanceId).toMatch(/^i-[a-f0-9]+$/);

        const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const state = res.Reservations?.[0]?.Instances?.[0]?.State?.Name;
        expect(["running", "stopped"]).toContain(state);
      });

      it("RDS instance should be available", async () => {
        const rdsId = outputs.rds_instance_ids.value[tfRegionKey];
        expect(rdsId).toMatch(/^db-[A-Z0-9]+$/);

        const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsId }));
        const status = res.DBInstances?.[0]?.DBInstanceStatus;
        expect(status).toBeDefined();
      });
    });
  });

  it("S3 bucket should exist", async () => {
    const s3Client = new S3Client({ region: "us-east-1" }); // Global S3
    const bucket = outputs.s3_bucket_name.value;
    expect(bucket).toMatch(/^tap-stack-bucket/);

    await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucket }))).resolves.toBeDefined();
  });

  it("IAM Role should exist", async () => {
    const iamClient = new IAMClient({ region: "us-east-1" });
    const roleName = outputs.iam_role_arn.value.split("/").pop()!;
    const res = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(res.Role?.RoleName).toBe(roleName);
  });

  it("KMS keys should exist", async () => {
    const kmsClient = new KMSClient({ region: "us-east-1" });
    const s3Key = outputs.kms_key_ids.value["s3_key"];
    const res = await kmsClient.send(new DescribeKeyCommand({ KeyId: s3Key }));
    expect(res.KeyMetadata?.KeyId).toBe(s3Key);
  });
});
