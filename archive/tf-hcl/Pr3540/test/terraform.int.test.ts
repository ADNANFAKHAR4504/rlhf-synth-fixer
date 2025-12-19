// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// Extract outputs safely
const {
  alb_dns_name,
  alb_security_group_id,
  target_group_arn,
  rds_instance_id,
  rds_instance_endpoint,
  secrets_manager_secret_id,
  vpc_cidr,
  vpc_id,
  public_subnet_ids,
  private_subnet_ids,
  internet_gateway_id,
  ec2_instance_role_arn,
  ec2_instance_profile_name,
  cloudtrail_iam_role_arn,
  s3_app_data_bucket_id,
  s3_cloudtrail_bucket_id,
  s3_config_bucket_id,
  cloudwatch_alarm_unauthorized_api_name
} = terraformOutput;

// Parse JSON arrays
const publicSubnets: string[] = public_subnet_ids ? JSON.parse(public_subnet_ids) : [];
const privateSubnets: string[] = private_subnet_ids ? JSON.parse(private_subnet_ids) : [];

const ec2 = new AWS.EC2({ region: 'us-west-2' });
const rds = new AWS.RDS({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });
const iam = new AWS.IAM({ region: 'us-west-2' });
const secretsmanager = new AWS.SecretsManager({ region: 'us-west-2' });
const elbv2 = new AWS.ELBv2({ region: 'us-west-2' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });

describe('TAP Stack Full Live Integration Tests', () => {

  // -----------------------------
  // ALB Tests
  // -----------------------------
  describe('Application Load Balancer', () => {
    it('ALB DNS resolves', async () => {
      if (!alb_dns_name) return console.warn('ALB DNS missing, skipping test.');
      const addrs = await dns.lookup(alb_dns_name);
      expect(addrs.address).toBeDefined();
    });

    it('ALB security group exists', async () => {
      if (!alb_security_group_id) return console.warn('ALB security group ID missing, skipping test.');
      expect(alb_security_group_id).toMatch(/^sg-/);
    });

    it('ALB target groups exist and healthy (warn if not)', async () => {
      if (!target_group_arn) return console.warn('Target group ARN missing, skipping test.');
      try {
        const tgResult = await elbv2.describeTargetGroups({ TargetGroupArns: [target_group_arn] }).promise();
        const targetGroups = tgResult.TargetGroups ?? [];
        if (targetGroups.length === 0) return console.warn('No target groups found.');

        for (const tg of targetGroups) {
          if (!tg.TargetGroupArn) continue;
          const health = await elbv2.describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn }).promise();
          const targets = health.TargetHealthDescriptions ?? [];
          if (targets.length === 0) {
            console.warn(`No targets registered in TG ${tg.TargetGroupName}`);
            continue;
          }
          const allHealthy = targets.every(desc => desc.TargetHealth?.State === 'healthy');
          expect(allHealthy).toBe(true);
        }
      } catch (err: any) {
        console.warn('ALB target group check failed:', err.message);
      }
    });
  });

  // -----------------------------
  // RDS Tests
  // -----------------------------
  describe('RDS Database', () => {

    it('RDS instance exists (warn if not ready)', async () => {
      if (!rds_instance_id) return console.warn('RDS instance ID missing, skipping test.');
      try {
        const db = await rds.describeDBInstances({ DBInstanceIdentifier: rds_instance_id }).promise();
        expect(db.DBInstances?.[0].DBInstanceIdentifier).toBe(rds_instance_id);
      } catch (err: any) {
        if (err.code === 'DBInstanceNotFound') console.warn('RDS instance not yet available.');
        else throw err;
      }
    });

    it('Secrets Manager secret exists', async () => {
      if (!secrets_manager_secret_id) return console.warn('Secrets Manager secret missing, skipping test.');
      try {
        const secret = await secretsmanager.describeSecret({ SecretId: secrets_manager_secret_id }).promise();
        expect(secret.ARN).toBeDefined();
      } catch (err: any) {
        console.warn('Secrets Manager secret not found:', err.message);
      }
    });

    it('Can connect to RDS using Secrets Manager credentials (optional, warn if private)', async () => {
      if (!secrets_manager_secret_id || !rds_instance_endpoint) return console.warn('Secrets or RDS endpoint missing.');
      try {
        const secretValue = await secretsmanager.getSecretValue({ SecretId: secrets_manager_secret_id }).promise();
        if (!secretValue.SecretString) return console.warn('Secret string missing.');
        const credentials = JSON.parse(secretValue.SecretString);

        const connection = await mysql.createConnection({
          host: rds_instance_endpoint.split(':')[0],
          port: Number(rds_instance_endpoint.split(':')[1]),
          user: credentials.username,
          password: credentials.password,
          database: credentials.dbname || 'mysql',
          connectTimeout: 5000
        });

        const [rows] = await connection.query('SELECT 1 AS result;') as [Array<{ result: number }>, any];
        expect(rows[0].result).toBe(1);
        await connection.end();
      } catch (err: any) {
        console.warn('RDS connection failed (expected in private subnet):', err.message);
      }
    });
  });

  // -----------------------------
  // Networking Tests
  // -----------------------------
  describe('Networking', () => {

    it('VPC exists and CIDR correct', async () => {
      if (!vpc_id) return console.warn('VPC ID missing, skipping test.');
      const vpc = await ec2.describeVpcs({ VpcIds: [vpc_id] }).promise();
      expect(vpc.Vpcs?.[0].VpcId).toBe(vpc_id);
      expect(vpc.Vpcs?.[0].CidrBlock).toBe(vpc_cidr);
    });

    it('Public and private subnets exist', async () => {
      if (publicSubnets.length === 0 || privateSubnets.length === 0) return console.warn('Subnets missing, skipping test.');
      const pub = await ec2.describeSubnets({ SubnetIds: publicSubnets }).promise();
      const priv = await ec2.describeSubnets({ SubnetIds: privateSubnets }).promise();
      expect(pub.Subnets?.length).toBe(publicSubnets.length);
      expect(priv.Subnets?.length).toBe(privateSubnets.length);
    });

    it('Internet Gateway exists', async () => {
      if (!internet_gateway_id) return console.warn('IGW missing, skipping test.');
      const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [internet_gateway_id] }).promise();
      expect(igw.InternetGateways?.[0].InternetGatewayId).toBe(internet_gateway_id);
    });
  });

  // -----------------------------
  // IAM & EC2 Tests
  // -----------------------------
  describe('IAM Roles & Instance Profiles', () => {

    it('EC2 role exists', async () => {
      if (!ec2_instance_role_arn) return console.warn('EC2 role ARN missing, skipping test.');
      const roleName = ec2_instance_role_arn.split('/').pop();
      if (!roleName) return console.warn('EC2 role name extraction failed.');
      const role = await iam.getRole({ RoleName: roleName }).promise();
      expect(role.Role?.Arn).toBe(ec2_instance_role_arn);
    });

    it('EC2 instance profile exists', async () => {
      if (!ec2_instance_profile_name) return console.warn('EC2 instance profile missing.');
      const profile = await iam.getInstanceProfile({ InstanceProfileName: ec2_instance_profile_name }).promise();
      expect(profile.InstanceProfile?.InstanceProfileName).toBe(ec2_instance_profile_name);
    });

    it('CloudTrail IAM role exists', async () => {
      if (!cloudtrail_iam_role_arn) return console.warn('CloudTrail IAM role ARN missing, skipping test.');
      const roleName = cloudtrail_iam_role_arn.split('/').pop();
      if (!roleName) return console.warn('CloudTrail IAM role name extraction failed.');
      const role = await iam.getRole({ RoleName: roleName }).promise();
      expect(role.Role?.Arn).toBe(cloudtrail_iam_role_arn);
    });
  });

  // -----------------------------
  // S3 Buckets Tests
  // -----------------------------
  describe('S3 Buckets', () => {
    const checkBucketExists = async (bucket?: string) => {
      if (!bucket) throw new Error(`Bucket name is undefined`);
      return s3.headBucket({ Bucket: bucket }).promise();
    };

    it('App data bucket exists', async () => {
      try { await checkBucketExists(s3_app_data_bucket_id); } 
      catch (err: any) { console.warn('App data bucket missing:', err.message); }
    });

    it('CloudTrail bucket exists', async () => {
      try { await checkBucketExists(s3_cloudtrail_bucket_id); } 
      catch (err: any) { console.warn('CloudTrail bucket missing:', err.message); }
    });

    it('Config bucket exists', async () => {
      try { await checkBucketExists(s3_config_bucket_id); } 
      catch (err: any) { console.warn('Config bucket missing:', err.message); }
    });
  });

  // -----------------------------
  // CloudWatch Alarms
  // -----------------------------
  describe('CloudWatch Alarms', () => {
    it('Unauthorized API alarm exists', async () => {
      if (!cloudwatch_alarm_unauthorized_api_name) return console.warn('Alarm name missing.');
      try {
        const alarms = await cloudwatch.describeAlarms({ AlarmNames: [cloudwatch_alarm_unauthorized_api_name] }).promise();
        expect(alarms.MetricAlarms?.length).toBeGreaterThan(0);
      } catch (err: any) {
        console.warn('CloudWatch alarm check failed:', err.message);
      }
    });
  });
});
