// test/tap_stack.live.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import dns from 'dns/promises';
import mysql from 'mysql2/promise';

// -------------------------
// Load Terraform Outputs
// -------------------------
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const tfOutputs = JSON.parse(readFileSync(outputsPath, 'utf8'));

// -------------------------
// AWS Clients (region: us-west-2)
// -------------------------
const region = 'us-west-2';
const ec2 = new AWS.EC2({ region });
const s3 = new AWS.S3({ region });
const rds = new AWS.RDS({ region });
const iam = new AWS.IAM({ region });
const secrets = new AWS.SecretsManager({ region });
const acm = new AWS.ACM({ region });
const waf = new AWS.WAFV2({ region });
const sns = new AWS.SNS({ region });
const cloudwatch = new AWS.CloudWatch({ region });

// -------------------------
// Utility Helpers
// -------------------------
const parseArray = (value?: string) => (value ? JSON.parse(value) : []);
const checkBucketExists = async (bucket: string) => s3.headBucket({ Bucket: bucket }).promise();

// -------------------------
// Integration Tests
// -------------------------
describe('TAP Stack Live Integration Tests', () => {

  // -------------------------
  // Networking & VPC Tests
  // -------------------------
  describe('VPC & Networking', () => {
    const publicSubnets = parseArray(tfOutputs.public_subnet_ids);
    const privateSubnets = parseArray(tfOutputs.private_subnet_ids);

    it(`VPC exists with correct CIDR: ${tfOutputs.vpc_id}`, async () => {
      const vpcs = await ec2.describeVpcs({ VpcIds: [tfOutputs.vpc_id] }).promise();
      expect(vpcs.Vpcs?.[0].VpcId).toBe(tfOutputs.vpc_id);
      expect(vpcs.Vpcs?.[0].CidrBlock).toBe(tfOutputs.vpc_cidr);
    });

    it('Public and private subnets exist', async () => {
      const allSubnets = [...publicSubnets, ...privateSubnets];
      const subnets = await ec2.describeSubnets({ SubnetIds: allSubnets }).promise();
      expect(subnets.Subnets?.length).toBe(allSubnets.length);
    });

    it('Internet Gateway exists and attached', async () => {
      const igw = await ec2.describeInternetGateways({
        InternetGatewayIds: [tfOutputs.internet_gateway_id]
      }).promise();
      expect(igw.InternetGateways?.[0].InternetGatewayId).toBe(tfOutputs.internet_gateway_id);
      expect(igw.InternetGateways?.[0].Attachments?.[0].VpcId).toBe(tfOutputs.vpc_id);
    });
  });

  // -------------------------
  // S3 Tests
  // -------------------------
  describe('S3 Buckets', () => {
    const appBucket = tfOutputs.s3_app_bucket;
    const versionsBucket = tfOutputs.s3_eb_versions_bucket;

    it(`App bucket exists: ${appBucket}`, async () => {
      const res = await checkBucketExists(appBucket);
      expect(res).toBeDefined();
    });

    it('App bucket has public access blocked', async () => {
      const pab = await s3.getPublicAccessBlock({ Bucket: appBucket }).promise();
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });

    it('EB versions bucket exists', async () => {
      const res = await checkBucketExists(versionsBucket);
      expect(res).toBeDefined();
    });
  });

  // -------------------------
  // IAM Roles & Profiles
  // -------------------------
  describe('IAM Roles & Instance Profiles', () => {
    it('Elastic Beanstalk EC2 role exists', async () => {
      const roleName = tfOutputs.iam_role_eb_ec2_arn.split('/').pop();
      const role = await iam.getRole({ RoleName: roleName! }).promise();
      expect(role.Role?.Arn).toBe(tfOutputs.iam_role_eb_ec2_arn);
    });

    it('EB instance profile exists', async () => {
      const profile = await iam.getInstanceProfile({
        InstanceProfileName: tfOutputs.iam_instance_profile_name
      }).promise();
      expect(profile.InstanceProfile?.InstanceProfileName).toBe(tfOutputs.iam_instance_profile_name);
    });
  });

  // -------------------------
  // RDS Database
  // -------------------------
  describe('RDS Database', () => {
    it(`RDS instance exists: ${tfOutputs.rds_instance_id}`, async () => {
      const db = await rds.describeDBInstances({
        DBInstanceIdentifier: tfOutputs.rds_instance_id
      }).promise();
      expect(db.DBInstances?.[0].Endpoint?.Address).toContain('rds.amazonaws.com');
    });

    it('Can connect to RDS via Secrets Manager credentials', async () => {
      const secret = await secrets.getSecretValue({ SecretId: tfOutputs.rds_secret_arn }).promise();
      if (!secret.SecretString) throw new Error('RDS secret missing');
      const creds = JSON.parse(secret.SecretString);

      const connection = await mysql.createConnection({
        host: creds.host || tfOutputs.rds_endpoint.split(':')[0],
        port: creds.port || 3306,
        user: creds.username,
        password: creds.password,
        database: creds.dbname,
        connectTimeout: 5000
      });
      const [rows] = await connection.query('SELECT 1 AS result;') as [Array<{ result: number }>, any];
      expect(rows[0].result).toBe(1);
      await connection.end();
    });
  });

  // -------------------------
  // CloudFront, ACM, Route53
  // -------------------------
  describe('CloudFront, ACM, and DNS', () => {
    it('ACM certificate exists and is issued', async () => {
      const cert = await acm.describeCertificate({ CertificateArn: tfOutputs.acm_certificate_arn }).promise();
      expect(cert.Certificate?.Status).toBe('ISSUED');
    });

    it('DNS resolves to a valid IP', async () => {
      const url = new URL(tfOutputs.website_url);
      const result = await dns.lookup(url.hostname);
      expect(result.address).toMatch(/\d+\.\d+\.\d+\.\d+/);
    });
  });

  // -------------------------
  // WAF Tests
  // -------------------------
  describe('WAF Configuration', () => {
    it('WAF Web ACL exists', async () => {
      const wafResponse = await waf.getWebACL({
        Id: tfOutputs.waf_web_acl_id,
        Name: 'tap-stack-prod-waf-acl',
        Scope: 'CLOUDFRONT'
      }).promise();
      expect(wafResponse.WebACL?.ARN).toBe(tfOutputs.waf_web_acl_arn);
    });
  });

  // -------------------------
  // CloudWatch & SNS
  // -------------------------
  describe('Monitoring & Alerts', () => {
    it('CloudWatch dashboard exists', async () => {
      const dashboards = await cloudwatch.listDashboards().promise();
      const found = dashboards.DashboardEntries?.some(d => d.DashboardName === tfOutputs.cloudwatch_dashboard_name);
      expect(found).toBe(true);
    });

    it('SNS topic for alerts exists', async () => {
      const topicArn = tfOutputs.sns_topic_arn;
      const topics = await sns.listTopics().promise();
      const exists = topics.Topics?.some(t => t.TopicArn === topicArn);
      expect(exists).toBe(true);
    });
  });
});
