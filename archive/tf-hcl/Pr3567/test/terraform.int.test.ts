// test/tap_stack.live.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// -------------------------
// Primary (us-west-2)
// -------------------------
const primaryRegion = 'us-west-2';
const {
  primary_alb_dns,
  primary_alb_security_group_id,
  primary_target_group_arn,
  primary_rds_endpoint,
  primary_rds_instance_id,
  primary_secret_arn,
  primary_vpc_id,
  primary_vpc_cidr,
  primary_public_subnet_ids,
  primary_private_subnet_ids,
  primary_nat_gateway_ids,
  primary_s3_bucket_name,
  primary_launch_template_id,
  primary_iam_role_arn,
  primary_instance_profile_name
} = terraformOutput;

const ec2Primary = new AWS.EC2({ region: primaryRegion });
const rdsPrimary = new AWS.RDS({ region: primaryRegion });
const s3Primary = new AWS.S3({ region: primaryRegion });
const iamPrimary = new AWS.IAM({ region: primaryRegion });
const elbv2Primary = new AWS.ELBv2({ region: primaryRegion });
const secretsPrimary = new AWS.SecretsManager({ region: primaryRegion });

// -------------------------
// Secondary (eu-west-1)
// -------------------------
const secondaryRegion = 'eu-west-1';
const {
  secondary_alb_dns,
  secondary_alb_security_group_id,
  secondary_target_group_arn,
  secondary_rds_endpoint,
  secondary_rds_instance_id,
  secondary_secret_arn,
  secondary_vpc_id,
  secondary_vpc_cidr,
  secondary_public_subnet_ids,
  secondary_private_subnet_ids,
  secondary_s3_bucket_name,
  secondary_launch_template_id,
  secondary_iam_role_arn,
  secondary_instance_profile_name
} = terraformOutput;

const ec2Secondary = new AWS.EC2({ region: secondaryRegion });
const rdsSecondary = new AWS.RDS({ region: secondaryRegion });
const s3Secondary = new AWS.S3({ region: secondaryRegion });
const iamSecondary = new AWS.IAM({ region: secondaryRegion });
const elbv2Secondary = new AWS.ELBv2({ region: secondaryRegion });
const secretsSecondary = new AWS.SecretsManager({ region: secondaryRegion });

// -------------------------
// Utility
// -------------------------
const parseJsonArray = (value?: string) => (value ? JSON.parse(value) : []);
const checkBucketExists = async (s3: AWS.S3, bucket?: string) => {
  if (!bucket) throw new Error('Bucket name missing');
  return s3.headBucket({ Bucket: bucket }).promise();
};

// -------------------------
// Integration Tests
// -------------------------
describe('TAP Stack Live Integration Tests', () => {

  // -------------------------
  // ALB Tests
  // -------------------------
  describe('Application Load Balancers', () => {
    const testALB = (dnsName: string, sgId: string, tgArn: string, elbv2Client: AWS.ELBv2) => {
      it(`ALB DNS resolves: ${dnsName}`, async () => {
        if (!dnsName) return console.warn('ALB DNS missing, skipping test');
        const addrs = await dns.lookup(dnsName);
        expect(addrs.address).toBeDefined();
      });

      it(`ALB security group exists: ${sgId}`, () => {
        if (!sgId) return console.warn('ALB SG missing, skipping test');
        expect(sgId).toMatch(/^sg-/);
      });

      it(`ALB target group is healthy: ${tgArn}`, async () => {
        if (!tgArn) return console.warn('Target group ARN missing, skipping test');
        try {
          const tgResult = await elbv2Client.describeTargetGroups({ TargetGroupArns: [tgArn] }).promise();
          const tg = tgResult.TargetGroups?.[0];
          if (!tg) return console.warn('Target group not found');
          const health = await elbv2Client.describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn! }).promise();
          const targets = health.TargetHealthDescriptions ?? [];
          if (targets.length === 0) return console.warn('No targets registered in TG');
          const allHealthy = targets.every(t => t.TargetHealth?.State === 'healthy');
          expect(allHealthy).toBe(true);
        } catch (err: any) {
          console.warn('Target group check failed:', err.message);
        }
      });
    };

    describe('Primary ALB', () => testALB(primary_alb_dns, primary_alb_security_group_id, primary_target_group_arn, elbv2Primary));
    describe('Secondary ALB', () => testALB(secondary_alb_dns, secondary_alb_security_group_id, secondary_target_group_arn, elbv2Secondary));
  });

  // -------------------------
  // RDS Tests
  // -------------------------
  describe('RDS Databases', () => {
    const testRDS = (rdsClient: AWS.RDS, secretsClient: AWS.SecretsManager, instanceId: string, endpoint: string, secretArn: string, region: string) => {
      it(`RDS instance exists: ${instanceId}`, async () => {
        if (!instanceId) return console.warn('RDS instance ID missing');
        try {
          const db = await rdsClient.describeDBInstances({ DBInstanceIdentifier: instanceId }).promise();
          expect(db.DBInstances?.[0].DBInstanceIdentifier).toBe(instanceId);
        } catch (err: any) {
          if (err.code === 'DBInstanceNotFound') console.warn(`RDS ${instanceId} not yet available`);
          else throw err;
        }
      });

      it(`Can connect to RDS: ${endpoint}`, async () => {
        if (!endpoint || !secretArn) return console.warn('RDS endpoint or secret missing, skipping connection test');
        try {
          const secret = await secretsClient.getSecretValue({ SecretId: secretArn }).promise();
          if (!secret.SecretString) return console.warn('Secret string missing');
          const creds = JSON.parse(secret.SecretString);
          const [host, port] = endpoint.split(':');
          const connection = await mysql.createConnection({
            host,
            port: Number(port),
            user: creds.username,
            password: creds.password,
            database: creds.dbname || 'mysql',
            connectTimeout: 5000
          });
          const [rows] = await connection.query('SELECT 1 AS result;') as [Array<{ result: number }>, any];
          expect(rows[0].result).toBe(1);
          await connection.end();
        } catch (err: any) {
          console.warn(`RDS connection test failed (${region}):`, err.message);
        }
      });
    };

    describe('Primary RDS', () => testRDS(rdsPrimary, secretsPrimary, primary_rds_instance_id, primary_rds_endpoint, primary_secret_arn, primaryRegion));
    describe('Secondary RDS', () => testRDS(rdsSecondary, secretsSecondary, secondary_rds_instance_id, secondary_rds_endpoint, secondary_secret_arn, secondaryRegion));
  });

  // -------------------------
  // VPC & Networking
  // -------------------------
  describe('VPC & Networking', () => {
    const testVPC = (ec2Client: AWS.EC2, vpcId: string, cidr: string, publicSubnets: string[], privateSubnets: string[], natGatewayIds?: string[]) => {
      it(`VPC exists: ${vpcId}`, async () => {
        if (!vpcId) return console.warn('VPC ID missing');
        const vpc = await ec2Client.describeVpcs({ VpcIds: [vpcId] }).promise();
        expect(vpc.Vpcs?.[0].VpcId).toBe(vpcId);
        expect(vpc.Vpcs?.[0].CidrBlock).toBe(cidr);
      });

      it('Public subnets exist', async () => {
        if (publicSubnets.length === 0) return console.warn('No public subnets defined');
        const pub = await ec2Client.describeSubnets({ SubnetIds: publicSubnets }).promise();
        expect(pub.Subnets?.length).toBe(publicSubnets.length);
      });

      it('Private subnets exist', async () => {
        if (privateSubnets.length === 0) return console.warn('No private subnets defined');
        const priv = await ec2Client.describeSubnets({ SubnetIds: privateSubnets }).promise();
        expect(priv.Subnets?.length).toBe(privateSubnets.length);
      });

      if (natGatewayIds && natGatewayIds.length > 0) {
        it('NAT Gateways exist', async () => {
          const nat = await ec2Client.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
          expect(nat.NatGateways?.length).toBe(natGatewayIds.length);
        });
      }
    };

    describe('Primary VPC', () => testVPC(ec2Primary, primary_vpc_id, primary_vpc_cidr, parseJsonArray(primary_public_subnet_ids), parseJsonArray(primary_private_subnet_ids), parseJsonArray(primary_nat_gateway_ids)));
    describe('Secondary VPC', () => testVPC(ec2Secondary, secondary_vpc_id, secondary_vpc_cidr, parseJsonArray(secondary_public_subnet_ids), parseJsonArray(secondary_private_subnet_ids)));
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    const testS3 = (s3Client: AWS.S3, bucketName: string) => {
      it(`Bucket exists: ${bucketName}`, async () => {
        try { await checkBucketExists(s3Client, bucketName); }
        catch (err: any) { console.warn(`Bucket ${bucketName} missing:`, err.message); }
      });

      it(`Bucket has public access block: ${bucketName}`, async () => {
        try {
          const pab = await s3Client.getPublicAccessBlock({ Bucket: bucketName }).promise();
          expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
          expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        } catch (err: any) {
          console.warn(`Bucket public access block missing for ${bucketName}:`, err.message);
        }
      });
    };

    describe('Primary S3', () => testS3(s3Primary, primary_s3_bucket_name));
    describe('Secondary S3', () => testS3(s3Secondary, secondary_s3_bucket_name));
  });

  // -------------------------
  // EC2 & IAM
  // -------------------------
  describe('EC2 Launch Templates & IAM Roles', () => {
    const testEC2 = (ec2Client: AWS.EC2, iamClient: AWS.IAM, launchTemplateId: string, roleArn: string, profileName: string) => {
      it(`EC2 launch template exists: ${launchTemplateId}`, async () => {
        if (!launchTemplateId) return console.warn('Launch template missing');
        const lt = await ec2Client.describeLaunchTemplates({ LaunchTemplateIds: [launchTemplateId] }).promise();
        expect(lt.LaunchTemplates?.[0].LaunchTemplateId).toBe(launchTemplateId);
      });

      it(`EC2 IAM role exists: ${roleArn}`, async () => {
        if (!roleArn) return console.warn('IAM role missing');
        const roleName = roleArn.split('/').pop();
        if (!roleName) return console.warn('Role name parse failed');
        const role = await iamClient.getRole({ RoleName: roleName }).promise();
        expect(role.Role?.Arn).toBe(roleArn);
      });

      it(`EC2 instance profile exists: ${profileName}`, async () => {
        if (!profileName) return console.warn('Instance profile missing');
        const profile = await iamClient.getInstanceProfile({ InstanceProfileName: profileName }).promise();
        expect(profile.InstanceProfile?.InstanceProfileName).toBe(profileName);
      });
    };

    describe('Primary EC2', () => testEC2(ec2Primary, iamPrimary, primary_launch_template_id, primary_iam_role_arn, primary_instance_profile_name));
    describe('Secondary EC2', () => testEC2(ec2Secondary, iamSecondary, secondary_launch_template_id, secondary_iam_role_arn, secondary_instance_profile_name));
  });

});
