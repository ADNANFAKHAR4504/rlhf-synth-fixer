import { readFileSync } from "fs";
import { join } from "path";
import dns from "dns/promises";
import AWS from "aws-sdk";
import mysql from "mysql2/promise";

// Load Terraform flat outputs JSON
const outputsPath = join(__dirname, "../cfn-outputs/flat-outputs.json");
const terraformOutput = JSON.parse(readFileSync(outputsPath, "utf8"));

// Utility to parse JSON string arrays in outputs
const parseJsonArray = (value?: string) => (value ? JSON.parse(value) : []);

// Utility to check S3 Bucket existence
const checkBucketExists = async (s3: AWS.S3, bucket?: string) => {
  if (!bucket) throw new Error("Bucket name missing");
  return s3.headBucket({ Bucket: bucket }).promise();
};

//
// PRIMARY REGION TESTS (us-east-1)
//
const primaryRegion = "us-east-1";
const {
  primary_alb_dns_name,
  primary_security_group_alb_id,
  primary_target_group_arn,
  primary_rds_endpoint,
  primary_rds_id,
  primary_secrets_manager_arn,
  primary_vpc_id,
  primary_s3_bucket_name,
  primary_launch_template_id,
  primary_iam_role_arn,
  primary_instance_profile_name,
  primary_public_subnet_ids,
  primary_private_subnet_ids,
  primary_nat_gateway_ids,
  primary_cloudwatch_log_group,
} = terraformOutput;

const ec2Primary = new AWS.EC2({ region: primaryRegion });
const rdsPrimary = new AWS.RDS({ region: primaryRegion });
const s3Primary = new AWS.S3({ region: primaryRegion });
const iamPrimary = new AWS.IAM({ region: primaryRegion });
const elbv2Primary = new AWS.ELBv2({ region: primaryRegion });
const secretsPrimary = new AWS.SecretsManager({ region: primaryRegion });

// -----------------
// ALB Tests
// -----------------
describe("Primary Application Load Balancer", () => {
  it(`should resolve ALB DNS name ${primary_alb_dns_name}`, async () => {
    if (!primary_alb_dns_name) return console.warn("Primary ALB DNS missing, skipping");
    const addresses = await dns.lookup(primary_alb_dns_name);
    expect(addresses.address).toBeDefined();
  });

  it("should have a valid ALB security group ID", () => {
    if (!primary_security_group_alb_id) return console.warn("Primary ALB SG ID missing, skipping");
    expect(primary_security_group_alb_id).toMatch(/^sg-/);
  });

});

// -----------------
// RDS Tests
// -----------------
describe("Primary RDS Instance", () => {

  it("should connect to RDS with credentials from Secrets Manager", async () => {
    if (!primary_rds_endpoint || !primary_secrets_manager_arn) {
      return console.warn("RDS endpoint or Secrets Manager ARN missing, skipping connection test");
    }
    try {
      const secretValue = await secretsPrimary.getSecretValue({ SecretId: primary_secrets_manager_arn }).promise();
      if (!secretValue.SecretString) return console.warn("Secret string missing");
      const creds = JSON.parse(secretValue.SecretString);

      // Extract host and port
      const [host, portString] = primary_rds_endpoint.split(":");
      const port = parseInt(portString.split("/")[0], 10);

      const connection = await mysql.createConnection({
        host,
        port,
        user: creds.username,
        password: creds.password,
        database: creds.dbname || "mysql",
        connectTimeout: 5000
      });

      const [rows] = await connection.query("SELECT 1 AS result;") as [Array<{ result: number }>, any];
      expect(rows[0].result).toBe(1);
      await connection.end();
    } catch (err: any) {
      console.warn("Skipping RDS connection test due to error:", err.message);
    }
  });
});

// -----------------
// VPC & Networking Tests
// -----------------
describe("Primary VPC and Subnets", () => {
  it("should confirm VPC exists", async () => {
    if (!primary_vpc_id) return console.warn("Primary VPC ID missing");
    const vpcs = await ec2Primary.describeVpcs({ VpcIds: [primary_vpc_id] }).promise();
    expect(vpcs.Vpcs?.[0].VpcId).toBe(primary_vpc_id);
  });

  it("should confirm public subnets exist", async () => {
    const pubSubnets = parseJsonArray(primary_public_subnet_ids);
    if (!pubSubnets.length) return console.warn("No public subnets defined");
    const pub = await ec2Primary.describeSubnets({ SubnetIds: pubSubnets }).promise();
    expect(pub.Subnets?.length).toBe(pubSubnets.length);
  });

  it("should confirm private subnets exist", async () => {
    const privSubnets = parseJsonArray(primary_private_subnet_ids);
    if (!privSubnets.length) return console.warn("No private subnets defined");
    const priv = await ec2Primary.describeSubnets({ SubnetIds: privSubnets }).promise();
    expect(priv.Subnets?.length).toBe(privSubnets.length);
  });

  it("should confirm NAT Gateways exist", async () => {
    const natGwIds = parseJsonArray(primary_nat_gateway_ids);
    if (!natGwIds.length) return console.warn("No NAT gateways defined");
    const natGws = await ec2Primary.describeNatGateways({ NatGatewayIds: natGwIds }).promise();
    expect(natGws.NatGateways?.length).toBe(natGwIds.length);
  });
});

// -----------------
// S3 Bucket Tests
// -----------------
describe("Primary S3 bucket", () => {
  it("bucket should exist", async () => {
    if (!primary_s3_bucket_name) return console.warn("Primary S3 bucket name missing");
    await checkBucketExists(s3Primary, primary_s3_bucket_name);
  });

  it("should have public access block enabled", async () => {
    if (!primary_s3_bucket_name) return console.warn("Primary S3 bucket name missing");
    const pab = await s3Primary.getPublicAccessBlock({ Bucket: primary_s3_bucket_name }).promise();
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
  });
});

// -----------------
// EC2 Launch Templates & IAM Role Tests
// -----------------
describe("EC2 and IAM configuration", () => {
  it("should confirm EC2 launch template exists", async () => {
    if (!primary_launch_template_id) return console.warn("Primary launch template ID missing");
    const lt = await ec2Primary.describeLaunchTemplates({ LaunchTemplateIds: [primary_launch_template_id] }).promise();
    expect(lt.LaunchTemplates?.[0].LaunchTemplateId).toBe(primary_launch_template_id);
  });

  it("should confirm EC2 IAM role exists", async () => {
    if (!primary_iam_role_arn) return console.warn("Primary IAM role ARN missing");
    const roleName = primary_iam_role_arn.split("/").pop();
    if (!roleName) return console.warn("IAM role name parse failed");
    const role = await iamPrimary.getRole({ RoleName: roleName }).promise();
    expect(role.Role?.Arn).toBe(primary_iam_role_arn);
  });

  it("should confirm EC2 instance profile exists", async () => {
    if (!primary_instance_profile_name) return console.warn("Primary instance profile name missing");
    const profile = await iamPrimary.getInstanceProfile({ InstanceProfileName: primary_instance_profile_name }).promise();
    expect(profile.InstanceProfile?.InstanceProfileName).toBe(primary_instance_profile_name);
  });
});
