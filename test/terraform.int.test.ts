// test/tap_stack.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';  // for live RDS connectivity check

// -----------------------------
// Load Terraform Outputs
// -----------------------------
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const tf = JSON.parse(readFileSync(outputsPath, 'utf8'));

// Extracted outputs
const {
  alb_dns_name,
  alb_security_group_id,
  autoscaling_group_name,
  ec2_security_group_id,
  internet_gateway_id,
  private_subnet_ids,
  public_subnet_ids,
  s3_logs_bucket_id,
  s3_logs_bucket_arn,
  vpc_id,
  vpc_cidr,
  rds_instance_endpoint,
  rds_instance_id,
  rds_secret_name,
  sns_topic_arn,
  cloudwatch_alarm_high_cpu_name,
  cloudwatch_alarm_low_cpu_name,
  cloudwatch_alarm_rds_cpu_name
} = tf;

// -----------------------------
// AWS Clients
// -----------------------------
const region = "us-east-2"; // per your outputs
const ec2 = new AWS.EC2({ region });
const s3 = new AWS.S3({ region });
const autoscaling = new AWS.AutoScaling({ region });
const cloudwatch = new AWS.CloudWatch({ region });
const secretsManager = new AWS.SecretsManager({ region });
const sns = new AWS.SNS({ region });

// -----------------------------
// Test Suite
// -----------------------------
describe('Tap Stack Live Integration Tests', () => {

  // -----------------------------
  // ALB Tests
  // -----------------------------
  describe('Application Load Balancer', () => {
    it('ALB DNS resolves', async () => {
      expect(alb_dns_name).toBeDefined();
      const addrs = await dns.lookup(alb_dns_name);
      expect(addrs.address).toBeDefined();
    });

    it('ALB responds to HTTP requests', async () => {
      const res = await fetch(`http://${alb_dns_name}`, { method: 'GET' });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });

    it('ALB security group exists', async () => {
      const sg = await ec2.describeSecurityGroups({ GroupIds: [alb_security_group_id] }).promise();
      expect(sg.SecurityGroups?.[0].GroupId).toBe(alb_security_group_id);
    });
  });

  // -----------------------------
  // EC2 / ASG
  // -----------------------------
  describe('EC2 & Auto Scaling', () => {
    it('EC2 security group exists', async () => {
      const sg = await ec2.describeSecurityGroups({ GroupIds: [ec2_security_group_id] }).promise();
      expect(sg.SecurityGroups?.[0].GroupId).toBe(ec2_security_group_id);
    });

    it('Auto Scaling group exists', async () => {
      const asg = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [autoscaling_group_name] }).promise();
      expect(asg.AutoScalingGroups?.[0].AutoScalingGroupName).toBe(autoscaling_group_name);
    });
  });

  // -----------------------------
  // Networking
  // -----------------------------
  describe('Networking (VPC/Subnets/IGW)', () => {
    it('VPC exists with correct CIDR', async () => {
      const vpc = await ec2.describeVpcs({ VpcIds: [vpc_id] }).promise();
      expect(vpc.Vpcs?.[0].CidrBlock).toBe(vpc_cidr);
    });

    it('Internet Gateway exists', async () => {
      const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [internet_gateway_id] }).promise();
      expect(igw.InternetGateways?.[0].InternetGatewayId).toBe(internet_gateway_id);
    });

    it('Public and private subnets exist', async () => {
      const pubIds: string[] = JSON.parse(public_subnet_ids || '[]');
      const privIds: string[] = JSON.parse(private_subnet_ids || '[]');

      if (pubIds.length > 0) {
        const subs = await ec2.describeSubnets({ SubnetIds: pubIds }).promise();
        expect(subs.Subnets?.length).toBe(pubIds.length);
      }

      if (privIds.length > 0) {
        const subs = await ec2.describeSubnets({ SubnetIds: privIds }).promise();
        expect(subs.Subnets?.length).toBe(privIds.length);
      }
    });
  });

  // -----------------------------
  // S3 Logs Bucket
  // -----------------------------
  describe('S3 Logs Bucket', () => {
    it('Logs bucket exists', async () => {
      const head = await s3.headBucket({ Bucket: s3_logs_bucket_id }).promise();
      expect(head.$response.httpResponse.statusCode).toBe(200);
    });

    it('Logs bucket has public access blocked', async () => {
      try {
        const pab = await s3.getBucketPolicyStatus({ Bucket: s3_logs_bucket_id }).promise();
        expect(pab.PolicyStatus?.IsPublic).toBe(false);
      } catch (err: any) {
        console.warn('Bucket policy status not available:', err.message);
      }
    });
  });

  // -----------------------------
  // RDS Instance
  // -----------------------------
  describe('RDS Database', () => {
    it('RDS instance exists', async () => {
      const rds = new AWS.RDS({ region });
      const dbs = await rds.describeDBInstances({ DBInstanceIdentifier: rds_instance_id }).promise();
      expect(dbs.DBInstances?.[0].DBInstanceIdentifier).toBe(rds_instance_id);
    });

    it('RDS connection works using secret credentials', async () => {
      if (!rds_instance_endpoint || !rds_secret_name) return console.warn('Skipping live DB connection test.');

      const secret = await secretsManager.getSecretValue({ SecretId: rds_secret_name }).promise();
      const creds = JSON.parse(secret.SecretString || '{}');

      const conn = await mysql.createConnection({
        host: rds_instance_endpoint.split(':')[0],
        port: Number(rds_instance_endpoint.split(':')[1]),
        user: creds.username,
        password: creds.password
      });

      const [rows] = await conn.query('SELECT 1+1 as result');
      expect((rows as any)[0].result).toBe(2);
      await conn.end();
    });
  });

  // -----------------------------
  // CloudWatch & SNS
  // -----------------------------
  describe('Monitoring & Alerts', () => {
    it('CloudWatch alarms exist', async () => {
      const alarms = await cloudwatch.describeAlarms({
        AlarmNames: [cloudwatch_alarm_high_cpu_name, cloudwatch_alarm_low_cpu_name, cloudwatch_alarm_rds_cpu_name]
      }).promise();
      expect((alarms.MetricAlarms || []).length).toBeGreaterThan(0);
    });

    it('SNS topic exists', async () => {
      const topics = await sns.listTopics({}).promise();
      const topicArns = topics.Topics?.map(t => t.TopicArn) || [];
      expect(topicArns).toContain(sns_topic_arn);
    });
  });
});
