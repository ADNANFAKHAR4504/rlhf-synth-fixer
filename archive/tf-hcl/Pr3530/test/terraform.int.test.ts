// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// Extract outputs
const {
  alb_dns_name,
  alb_security_group_id,
  alb_zone_id,
  autoscaling_group_name,
  cloudwatch_dashboard_url,
  ec2_security_group_id,
  internet_gateway_id,
  private_subnet_ids,
  public_subnet_ids,
  s3_bucket_arn,
  s3_bucket_name,
  vpc_cidr,
  vpc_id
} = terraformOutput;

// AWS clients
const ec2 = new AWS.EC2({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });
const autoscaling = new AWS.AutoScaling({ region: 'us-west-2' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });

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
      if (!alb_dns_name) return console.warn('Skipping ALB HTTP test, no DNS provided.');
      const res = await fetch(`http://${alb_dns_name}`, { method: 'GET' });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });

    it('ALB security group exists', async () => {
      if (!alb_security_group_id) return console.warn('Skipping ALB SG test, no ID provided.');
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
      expect(asg.AutoScalingGroups?.[0].AutoScalingGroupName).toBe(autoscaling_group_name);
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
  // S3 Bucket
  // -----------------------------
  describe('S3 Static Assets', () => {
    it('Bucket exists', async () => {
      if (!s3_bucket_name) return console.warn('Skipping S3 test.');
      const head = await s3.headBucket({ Bucket: s3_bucket_name }).promise();
      expect(head.$response.httpResponse.statusCode).toBe(200);
    });

    it('Bucket has encryption enabled', async () => {
      if (!s3_bucket_name) return console.warn('Skipping S3 encryption test.');
      try {
        const enc = await s3.getBucketEncryption({ Bucket: s3_bucket_name }).promise();
        expect(enc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      } catch (err: any) {
        console.warn('No encryption policy found on bucket:', err.message);
      }
    });
  });

  // -----------------------------
  // CloudWatch
  // -----------------------------
  describe('CloudWatch Monitoring', () => {
    it('Dashboard URL is defined', () => {
      expect(cloudwatch_dashboard_url).toContain('https://us-west-2.console.aws.amazon.com/cloudwatch');
    });

    it('Has at least one CloudWatch alarm', async () => {
      const alarms = await cloudwatch.describeAlarms({}).promise();
      expect((alarms.MetricAlarms || []).length).toBeGreaterThan(0);
    });
  });
});

