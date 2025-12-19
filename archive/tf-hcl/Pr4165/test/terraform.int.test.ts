import { readFileSync } from "fs";
import { join } from "path";
import AWS from "aws-sdk";
import mysql from "mysql2/promise";


// Load Terraform flat outputs JSON
const outputsPath = join(__dirname, "../cfn-outputs/flat-outputs.json");
const flat = JSON.parse(readFileSync(outputsPath, "utf8"));


// Dynamically determine AWS region from outputs
const region = flat.region || "us-west-2";


// Initialize AWS SDK clients with the dynamic region
const ec2 = new AWS.EC2({ region });
const s3 = new AWS.S3({ region });
const iam = new AWS.IAM({ region });
const lambda = new AWS.Lambda({ region });
const secrets = new AWS.SecretsManager({ region });
const logs = new AWS.CloudWatchLogs({ region });
const sns = new AWS.SNS({ region });
const waf = new AWS.WAFV2({ region });
const rds = new AWS.RDS({ region });
const config = new AWS.ConfigService({ region });
const cloudwatch = new AWS.CloudWatch({ region });


// Utility to parse JSON string arrays in outputs
const parseJsonArray = (value?: string) => (value ? JSON.parse(value) : []);


// -----------------
// VPC & Networking Tests
// -----------------
describe("VPC & Networking", () => {
  it("should confirm VPC exists and has the correct CIDR block", async () => {
    if (!flat.vpc_id) return console.warn("VPC ID missing in outputs, skipping test");
    const vpcs = await ec2.describeVpcs({ VpcIds: [flat.vpc_id] }).promise();
    expect(vpcs.Vpcs?.[0]?.CidrBlock).toBe(flat.vpc_cidr);
  });
});


// -----------------
// IAM Role Validation
// -----------------
describe("IAM Roles", () => {
  it("should validate Lambda IAM role exists", async () => {
    const roleName = flat.iam_role_lambda_arn.split("/").pop();
    if (!roleName) return console.warn("Lambda IAM role name missing, skipping test");
    const role = await iam.getRole({ RoleName: roleName }).promise();
    expect(role.Role?.Arn).toBe(flat.iam_role_lambda_arn);
  });


  it("should validate EC2 IAM role exists", async () => {
    const roleName = flat.iam_role_ec2_arn.split("/").pop();
    if (!roleName) return console.warn("EC2 IAM role name missing, skipping test");
    const role = await iam.getRole({ RoleName: roleName }).promise();
    expect(role.Role?.Arn).toBe(flat.iam_role_ec2_arn);
  });


  it("should validate AWS Config IAM role exists", async () => {
    const roleName = flat.iam_role_config_arn.split("/").pop();
    if (!roleName) return console.warn("Config IAM role name missing, skipping test");
    const role = await iam.getRole({ RoleName: roleName }).promise();
    expect(role.Role?.Arn).toBe(flat.iam_role_config_arn);
  });
});


// -----------------
// S3 Bucket Tests
// -----------------
describe("S3 Bucket", () => {
  it("bucket should exist", async () => {
    if (!flat.s3_bucket_id) return console.warn("S3 bucket ID missing, skipping test");
    await s3.headBucket({ Bucket: flat.s3_bucket_id }).promise();
  });


  it("should have server-side encryption with AES256", async () => {
    if (!flat.s3_bucket_id) return console.warn("S3 bucket ID missing, skipping test");
    const enc = await s3.getBucketEncryption({ Bucket: flat.s3_bucket_id }).promise();
    expect(enc.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
  });


  it("should have public access block fully enabled", async () => {
    if (!flat.s3_bucket_id) return console.warn("S3 bucket ID missing, skipping test");
    const pab = await s3.getPublicAccessBlock({ Bucket: flat.s3_bucket_id }).promise();
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });
});




// -----------------
// SNS Topic Tests
// -----------------
describe("SNS Topic", () => {
  it("should confirm SNS topic exists", async () => {
    if (!flat.sns_topic_arn) return console.warn("SNS topic ARN missing, skipping test");
    const topics = await sns.listTopics({}).promise();
    expect(topics.Topics?.some(t => t.TopicArn === flat.sns_topic_arn)).toBe(true);
  });
});

// -----------------
// RDS Multi-AZ Tests
// -----------------
describe("RDS Database", () => {
  it("should confirm RDS instance exists with Multi-AZ enabled", async () => {
    if (!flat.rds_instance_endpoint) return console.warn("RDS endpoint missing, skipping test");
    // Extract DBInstanceIdentifier from endpoint (typically the subdomain part before first dot)
    const dbInstanceId = flat.rds_instance_endpoint.split('.')[0];
    const instances = await rds.describeDBInstances({ DBInstanceIdentifier: dbInstanceId }).promise();
    const instance = instances.DBInstances?.[0];
    expect(instance).toBeDefined();
    expect(instance.MultiAZ).toBe(true);
    expect(instance.StorageEncrypted).toBe(true);
    expect(instance.DBInstanceStatus).toMatch(/available|backing-up/);
  });
});
// -----------------
// Secrets Manager Tests
// -----------------
describe("Secrets Manager", () => {
  it("should confirm RDS secret exists and contains required keys", async () => {
    if (!flat.rds_secret_arn) return console.warn("RDS secret ARN missing, skipping test");
    const secret = await secrets.getSecretValue({ SecretId: flat.rds_secret_arn }).promise();
    const secretString = secret.SecretString || "{}";
    const secretJson = JSON.parse(secretString);
    expect(secretJson).toHaveProperty("username");
    expect(secretJson).toHaveProperty("password");
    expect(secretJson).toHaveProperty("engine");
    expect(secretJson).toHaveProperty("host");
    expect(secretJson).toHaveProperty("port");
  });
});

// -----------------
// AWS Config Tests
// -----------------
describe("AWS Config", () => {
  it("should confirm Config recorder is enabled", async () => {
    if (!flat.config_recorder_name) return console.warn("Config recorder name missing, skipping test");
    const status = await config.describeConfigurationRecorderStatus({ ConfigurationRecorderNames: [flat.config_recorder_name] }).promise();
    const recorderStatus = status.ConfigurationRecordersStatus?.[0];
    expect(recorderStatus).toBeDefined();
    expect(recorderStatus.recording).toBe(true);
  });

  it("should confirm Config delivery channel exists", async () => {
    if (!flat.config_bucket_id) return console.warn("Config bucket ID missing, skipping test");
    const channels = await config.describeDeliveryChannels({}).promise();
    const channel = channels.DeliveryChannels?.find(dc => dc.s3BucketName === flat.config_bucket_id);
    expect(channel).toBeDefined();
  });

  it("should confirm critical Config rules exist", async () => {
    const rules = await config.describeConfigRules({}).promise();
    const ruleNames = rules.ConfigRules?.map(r => r.ConfigRuleName) || [];
    expect(ruleNames.some(name => name.includes("s3-public-read-prohibited"))).toBe(true);
    expect(ruleNames.some(name => name.includes("rds-encryption-enabled"))).toBe(true);
    expect(ruleNames.some(name => name.includes("ec2-ssm-managed"))).toBe(true);
  });
});
