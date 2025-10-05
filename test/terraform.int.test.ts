// test/tap_stack.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// -----------------------------
// Extract outputs
// -----------------------------
const {
  primary_alb_arn,
  primary_alb_dns,
  primary_alb_security_group_id,
  primary_target_group_arn,
  primary_rds_instance_id,
  primary_rds_endpoint,
  primary_secret_arn,
  primary_vpc_id,
  primary_vpc_cidr,
  primary_public_subnet_ids,
  primary_private_subnet_ids,
  primary_nat_gateway_ids,
  primary_s3_bucket_name,
  secondary_alb_arn,
  secondary_alb_dns,
  secondary_alb_security_group_id,
  secondary_target_group_arn,
  secondary_rds_instance_id,
  secondary_rds_endpoint,
  secondary_secret_arn,
  secondary_vpc_id,
  secondary_vpc_cidr,
  secondary_public_subnet_ids,
  secondary_private_subnet_ids,
  secondary_s3_bucket_name
} = terraformOutput;

// Parse subnet arrays
const primaryPublicSubnets = JSON.parse(primary_public_subnet_ids);
const primaryPrivateSubnets = JSON.parse(primary_private_subnet_ids);
const secondaryPublicSubnets = JSON.parse(secondary_public_subnet_ids);
const secondaryPrivateSubnets = JSON.parse(secondary_private_subnet_ids);
const primaryNATs = JSON.parse(primary_nat_gateway_ids);

// -----------------------------
// AWS SDK clients
// -----------------------------
const ec2 = new AWS.EC2({ region: 'us-west-2' });
const rds = new AWS.RDS({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });
const iam = new AWS.IAM({ region: 'us-west-2' });
const elbv2 = new AWS.ELBv2({ region: 'us-west-2' });
const secretsmanager = new AWS.SecretsManager({ region: 'us-west-2' });

// -----------------------------
// Integration Tests
// -----------------------------
describe('TAP Stack Full Live Integration Tests', () => {

  // -----------------------------
  // ALB Tests
  // -----------------------------
  describe('Application Load Balancers', () => {
    it('Primary ALB DNS resolves', async () => {
      if (!primary_alb_dns) return console.warn('Primary ALB DNS missing.');
      const addrs = await dns.lookup(primary_alb_dns);
      expect(addrs.address).toBeDefined();
    });

    it('Secondary ALB DNS resolves', async () => {
      if (!secondary_alb_dns) return console.warn('Secondary ALB DNS missing.');
      const addrs = await dns.lookup(secondary_alb_dns);
      expect(addrs.address).toBeDefined();
    });

    it('Primary ALB security group exists', async () => {
      expect(primary_alb_security_group_id).toMatch(/^sg-/);
    });

    it('Secondary ALB security group exists', async () => {
      expect(secondary_alb_security_group_id).toMatch(/^sg-/);
    });

    it('Primary ALB target group is healthy', async () => {
      if (!primary_target_group_arn) return console.warn('Primary target group missing.');
      const health = await elbv2.describeTargetHealth({ TargetGroupArn: primary_target_group_arn }).promise();
      const targets = health.TargetHealthDescriptions ?? [];
      if (targets.length === 0) console.warn('No targets registered in primary TG');
      else expect(targets.every(t => t.TargetHealth?.State === 'healthy')).toBe(true);
    });

    it('Secondary ALB target group is healthy', async () => {
      if (!secondary_target_group_arn) return console.warn('Secondary target group missing.');
      const health = await elbv2.describeTargetHealth({ TargetGroupArn: secondary_target_group_arn }).promise();
      const targets = health.TargetHealthDescriptions ?? [];
      if (targets.length === 0) console.warn('No targets registered in secondary TG');
      else expect(targets.every(t => t.TargetHealth?.State === 'healthy')).toBe(true);
    });
  });

  // -----------------------------
  // RDS Tests
  // -----------------------------
  describe('RDS Databases', () => {
    const testRDSConnection = async (endpoint: string, secretArn: string) => {
      if (!endpoint || !secretArn) return console.warn('RDS endpoint or secret missing.');
      const secretValue = await secretsmanager.getSecretValue({ SecretId: secretArn }).promise();
      if (!secretValue.SecretString) return console.warn('Secret string missing.');
      const credentials = JSON.parse(secretValue.SecretString);

      const [host, port] = endpoint.split(':');
      const connection = await mysql.createConnection({
        host,
        port: Number(port),
        user: credentials.username,
        password: credentials.password,
        database: credentials.dbname || 'mysql',
        connectTimeout: 5000
      });

      const [rows] = await connection.query('SELECT 1 AS result;') as [Array<{ result: number }>, any];
      expect(rows[0].result).toBe(1);
      await connection.end();
    };

    it('Primary RDS instance exists', async () => {
      const db = await rds.describeDBInstances({ DBInstanceIdentifier: primary_rds_instance_id }).promise();
      expect(db.DBInstances?.[0].DBInstanceIdentifier).toBe(primary_rds_instance_id);
    });

    it('Secondary RDS instance exists', async () => {
      const db = await rds.describeDBInstances({ DBInstanceIdentifier: secondary_rds_instance_id }).promise();
      expect(db.DBInstances?.[0].DBInstanceIdentifier).toBe(secondary_rds_instance_id);
    });

    it('Can connect to primary RDS', async () => testRDSConnection(primary_rds_endpoint, primary_secret_arn));
    it('Can connect to secondary RDS', async () => testRDSConnection(secondary_rds_endpoint, secondary_secret_arn));
  });

  // -----------------------------
  // VPC & Networking Tests
  // -----------------------------
  describe('VPC and Networking', () => {
    it('Primary VPC exists', async () => {
      const vpc = await ec2.describeVpcs({ VpcIds: [primary_vpc_id] }).promise();
      expect(vpc.Vpcs?.[0].VpcId).toBe(primary_vpc_id);
      expect(vpc.Vpcs?.[0].CidrBlock).toBe(primary_vpc_cidr);
    });

    it('Secondary VPC exists', async () => {
      const vpc = await ec2.describeVpcs({ VpcIds: [secondary_vpc_id] }).promise();
      expect(vpc.Vpcs?.[0].VpcId).toBe(secondary_vpc_id);
      expect(vpc.Vpcs?.[0].CidrBlock).toBe(secondary_vpc_cidr);
    });

    it('Primary public subnets exist', async () => {
      const subnets = await ec2.describeSubnets({ SubnetIds: primaryPublicSubnets }).promise();
      expect(subnets.Subnets?.length).toBe(primaryPublicSubnets.length);
    });

    it('Primary private subnets exist', async () => {
      const subnets = await ec2.describeSubnets({ SubnetIds: primaryPrivateSubnets }).promise();
      expect(subnets.Subnets?.length).toBe(primaryPrivateSubnets.length);
    });

    it('Primary NAT Gateways exist', async () => {
      const natResult = await ec2.describeNatGateways({ NatGatewayIds: primaryNATs }).promise();
      expect(natResult.NatGateways?.length).toBe(primaryNATs.length);
    });
  });

  // -----------------------------
  // S3 Buckets
  // -----------------------------
  describe('S3 Buckets', () => {
    const checkPublicAccess = async (bucketName: string) => {
      const access = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(access.PublicAccessBlockConfiguration).toBeDefined();
    };

    it('Primary S3 bucket exists', async () => {
      await s3.headBucket({ Bucket: primary_s3_bucket_name }).promise();
    });

    it('Secondary S3 bucket exists', async () => {
      await s3.headBucket({ Bucket: secondary_s3_bucket_name }).promise();
    });

    it('Primary S3 bucket has public access block', async () => {
      await checkPublicAccess(primary_s3_bucket_name);
    });

    it('Secondary S3 bucket has public access block', async () => {
      await checkPublicAccess(secondary_s3_bucket_name);
    });
  });

  // -----------------------------
  // IAM & EC2 Resources
  // -----------------------------
  describe('EC2 & IAM', () => {
    it('Primary EC2 launch template exists', async () => {
      const lt = await ec2.describeLaunchTemplates({ LaunchTemplateIds: [terraformOutput.primary_launch_template_id] }).promise();
      expect(lt.LaunchTemplates?.length).toBe(1);
    });

    it('Secondary EC2 launch template exists', async () => {
      const lt = await ec2.describeLaunchTemplates({ LaunchTemplateIds: [terraformOutput.secondary_launch_template_id] }).promise();
      expect(lt.LaunchTemplates?.length).toBe(1);
    });
  });
});
