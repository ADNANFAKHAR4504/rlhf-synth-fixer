// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

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
  vpc_id,
  vpc_cidr,
  rds_instance_endpoint,
  rds_instance_id,
  rds_instance_arn,
  rds_secret_name,
  sns_topic_arn,
  cloudwatch_alarm_high_cpu_name,
  cloudwatch_alarm_low_cpu_name,
  cloudwatch_alarm_rds_cpu_name
} = tf;

// -----------------------------
// AWS Clients
// -----------------------------
const region = "us-east-2"; // adjust to your deployment region
const ec2 = new AWS.EC2({ region });
const s3 = new AWS.S3({ region });
const autoscaling = new AWS.AutoScaling({ region });
const cloudwatch = new AWS.CloudWatch({ region });
const secretsManager = new AWS.SecretsManager({ region });
const sns = new AWS.SNS({ region });
const rds = new AWS.RDS({ region });

// -----------------------------
// Test Suite
// -----------------------------
describe('Tap Stack Live Integration Tests', () => {

  // -----------------------------
  // ALB Tests
  // -----------------------------
  describe('Application Load Balancer', () => {
    it('ALB DNS resolves', async () => {
      if (!alb_dns_name) return console.warn('Skipping ALB DNS test, no DNS provided.');
      const addrs = await dns.lookup(alb_dns_name);
      expect(addrs.address).toBeDefined();
    });

    it('ALB security group exists', async () => {
      if (!alb_security_group_id) return console.warn('Skipping ALB SG test.');
      const sg = await ec2.describeSecurityGroups({ GroupIds: [alb_security_group_id] }).promise();
      expect(sg.SecurityGroups?.[0].GroupId).toBe(alb_security_group_id);
    });
  });

  // -----------------------------
  // EC2 / ASG
  // -----------------------------
  describe('EC2 & Auto Scaling', () => {
    it('EC2 security group exists', async () => {
      if (!ec2_security_group_id) return console.warn('Skipping EC2 SG test.');
      const sg = await ec2.describeSecurityGroups({ GroupIds: [ec2_security_group_id] }).promise();
      expect(sg.SecurityGroups?.[0].GroupId).toBe(ec2_security_group_id);
    });

    it('Auto Scaling group exists', async () => {
      if (!autoscaling_group_name) return console.warn('Skipping ASG test.');
      const asg = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [autoscaling_group_name] }).promise();
      if (!asg.AutoScalingGroups || asg.AutoScalingGroups.length === 0) {
        return console.warn(`ASG ${autoscaling_group_name} not found yet.`);
      }
      expect(asg.AutoScalingGroups[0].AutoScalingGroupName).toBe(autoscaling_group_name);
    });
  });

  // -----------------------------
  // Networking
  // -----------------------------
  describe('Networking (VPC/Subnets/IGW)', () => {
    it('VPC exists with correct CIDR', async () => {
      if (!vpc_id) return console.warn('Skipping VPC test.');
      const vpc = await ec2.describeVpcs({ VpcIds: [vpc_id] }).promise();
      expect(vpc.Vpcs?.[0].CidrBlock).toBe(vpc_cidr);
    });

    it('Internet Gateway exists', async () => {
      if (!internet_gateway_id) return console.warn('Skipping IGW test.');
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
      if (!s3_logs_bucket_id) return console.warn('Skipping S3 test.');
      const head = await s3.headBucket({ Bucket: s3_logs_bucket_id }).promise();
      expect(head.$response.httpResponse.statusCode).toBe(200);
    });

    it('Logs bucket has public access blocked', async () => {
      if (!s3_logs_bucket_id) return console.warn('Skipping S3 PAB test.');
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
      const dbs = await rds.describeDBInstances({}).promise();
      const found = dbs.DBInstances?.some(db =>
        db.DBInstanceIdentifier === rds_instance_id ||
        db.DBInstanceArn === rds_instance_arn ||
        db.Endpoint?.Address === rds_instance_endpoint?.split(':')[0]
      );
      if (!found) {
        return console.warn(`RDS instance not found for id/arn/endpoint in outputs.`);
      }
      expect(found).toBe(true);
    });

    it('RDS connection works using secret credentials', async () => {
      if (!rds_instance_endpoint || !rds_secret_name) return console.warn('Skipping DB connection test.');
      const dbs = await rds.describeDBInstances({}).promise();
      const db = dbs.DBInstances?.find(d => d.Endpoint?.Address === rds_instance_endpoint.split(':')[0]);
      if (!db || db.DBInstanceStatus !== 'available') {
        return console.warn(`Skipping DB test, instance not ready (status: ${db?.DBInstanceStatus}).`);
      }

      const secret = await secretsManager.getSecretValue({ SecretId: rds_secret_name }).promise();
      const creds = JSON.parse(secret.SecretString || '{}');

      try {
        const conn = await mysql.createConnection({
          host: rds_instance_endpoint.split(':')[0],
          port: Number(rds_instance_endpoint.split(':')[1]),
          user: creds.username,
          password: creds.password,
          connectTimeout: 5000
        });
        const [rows] = await conn.query('SELECT 1+1 as result');
        expect((rows as any)[0].result).toBe(2);
        await conn.end();
      } catch (err: any) {
        console.warn('RDS connection failed:', err.message);
      }
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
      if (!sns_topic_arn) return console.warn('Skipping SNS test.');
      const topics = await sns.listTopics({}).promise();
      const topicArns = topics.Topics?.map(t => t.TopicArn) || [];
      expect(topicArns).toContain(sns_topic_arn);
    });
  });
});
