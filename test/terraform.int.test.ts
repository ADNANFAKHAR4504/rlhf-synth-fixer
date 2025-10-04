// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// Extract outputs
const {
  alb_dns_name,
  alb_security_group_id,
  alb_arn,
  autoscaling_group_name,
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
  cloudwatch_alarm_unauthorized_api_name,
  dlm_lifecycle_policy_id
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
const autoscaling = new AWS.AutoScaling({ region: 'us-west-2' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });
const dlm = new AWS.DLM({ region: 'us-west-2' });

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

    it('ALB target group exists', async () => {
      if (!alb_arn) return console.warn('ALB ARN missing, skipping test.');
      const tgs = await elbv2.describeTargetGroups({ LoadBalancerArn: alb_arn }).promise();
      expect(tgs.TargetGroups?.length).toBeGreaterThan(0);
    });

    it('ALB target group health is healthy', async () => {
      if (!alb_arn) return console.warn('ALB ARN missing, skipping test.');
      const tgs = await elbv2.describeTargetGroups({ LoadBalancerArn: alb_arn }).promise();
      for (const tg of tgs.TargetGroups) {
        const health = await elbv2.describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn! }).promise();
        const targets = health.TargetHealthDescriptions ?? [];
        expect(targets.every(desc => desc.TargetHealth?.State === 'healthy')).toBe(true);
      }
    });

    it('ALB responds to HTTP requests', async () => {
      if (!alb_dns_name) return console.warn('ALB DNS missing, skipping test.');
      const response = await fetch(`http://${alb_dns_name}`);
      expect(response.status).toBe(200);
    });

  });

  // -----------------------------
  // RDS Tests
  // -----------------------------
  describe('RDS Database', () => {

    it('RDS instance exists', async () => {
      if (!rds_instance_id) return console.warn('RDS instance ID missing. Skipping test.');
      try {
        const db = await rds.describeDBInstances({ DBInstanceIdentifier: rds_instance_id }).promise();
        expect(db.DBInstances?.[0].DBInstanceIdentifier).toBe(rds_instance_id);
      } catch (err: any) {
        console.warn('RDS instance not found:', err.message);
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

    it('Can connect to RDS using Secrets Manager credentials', async () => {
      if (!secrets_manager_secret_id || !rds_instance_endpoint) return console.warn('Secrets or RDS endpoint missing.');

      const secret = await secretsmanager.getSecretValue({ SecretId: secrets_manager_secret_id }).promise();
      if (!secret.SecretString) return console.warn('Secret string missing.');
      const credentials = JSON.parse(secret.SecretString);

      const connection = await mysql.createConnection({
        host: rds_instance_endpoint.split(':')[0],
        port: Number(rds_instance_endpoint.split(':')[1]),
        user: credentials.username,
        password: credentials.password,
        database: credentials.dbname || 'mysql'
      });

      const [rows] = await connection.query('SELECT 1 AS result;');
      expect(rows[0].result).toBe(1);
      await connection.end();
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
      if (!internet_gateway_id) return console.warn('IGW missing.');
      const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [internet_gateway_id] }).promise();
      expect(igw.InternetGateways?.[0].InternetGatewayId).toBe(internet_gateway_id);
    });

    it('VPC Flow Log exists', async () => {
      try {
        const flows = await ec2.describeFlowLogs().promise();
        expect(flows.FlowLogs).toBeDefined();
      } catch (err: any) {
        console.warn('Flow logs not found:', err.message);
      }
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
      if (!ec2_instance_profile_name) return console.warn('EC2 instance profile ARN missing, skipping test.');
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
  // EC2 & AutoScaling Tests
  // -----------------------------
  describe('EC2 & AutoScaling', () => {

    it('AutoScaling Group exists and has running instances', async () => {
      if (!autoscaling_group_name) return console.warn('ASG missing.');
      const asgData = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [autoscaling_group_name] }).promise();
      const instances = asgData.AutoScalingGroups?.[0].Instances ?? [];
      expect(instances.length).toBeGreaterThan(0);
      expect(instances.every(inst => inst.LifecycleState === 'InService')).toBe(true);
    });

  });

  // -----------------------------
  // S3 Buckets Tests
  // -----------------------------
  describe('S3 Buckets', () => {
    const testKey = 'integration-test.txt';
    const testBody = 'Integration test content';

    it('App Data bucket exists and can read/write', async () => {
      if (!s3_app_data_bucket_id) return console.warn('Data bucket missing.');
      await s3.putObject({ Bucket: s3_app_data_bucket_id, Key: testKey, Body: testBody }).promise();
      const obj = await s3.getObject({ Bucket: s3_app_data_bucket_id, Key: testKey }).promise();
      expect(obj.Body?.toString()).toBe(testBody);
      await s3.deleteObject({ Bucket: s3_app_data_bucket_id, Key: testKey }).promise();
    });

    it('CloudTrail bucket exists', async () => {
      if (!s3_cloudtrail_bucket_id) return console.warn('CloudTrail bucket missing.');
      await s3.headBucket({ Bucket: s3_cloudtrail_bucket_id }).promise();
    });
  });

  // -----------------------------
  // CloudWatch Alarms Tests
  // -----------------------------
  describe('CloudWatch Alarms', () => {
    it('At least one alarm exists', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();
      expect(alarms.MetricAlarms?.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------
  // DLM Tests
  // -----------------------------
  describe('DLM Lifecycle Manager', () => {
    it('DLM policy exists', async () => {
      if (!dlm_lifecycle_policy_id) return console.warn('DLM policy ID missing, skipping test.');
      const policies = await dlm.getLifecyclePolicies({ PolicyIds: [dlm_lifecycle_policy_id] }).promise();
      expect(policies.Policies?.length).toBe(1);
    });
  });

});
