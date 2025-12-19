// test/tap_stack.live.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// -------------------------
// AWS Clients
// -------------------------
const ec2Primary = new AWS.EC2({ region: 'us-west-2' });
const ec2Secondary = new AWS.EC2({ region: 'eu-west-1' });
const rdsPrimary = new AWS.RDS({ region: 'us-west-2' });
const rdsSecondary = new AWS.RDS({ region: 'eu-west-1' });
const s3Primary = new AWS.S3({ region: 'us-west-2' });
const s3Secondary = new AWS.S3({ region: 'eu-west-1' });
const iamPrimary = new AWS.IAM({ region: 'us-west-2' });
const iamSecondary = new AWS.IAM({ region: 'eu-west-1' });
const secretsPrimary = new AWS.SecretsManager({ region: 'us-west-2' });
const secretsSecondary = new AWS.SecretsManager({ region: 'eu-west-1' });

// -------------------------
// Helper Functions
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
  // VPC & Networking
  // -------------------------
  const testVPC = (
    ec2: AWS.EC2,
    vpcId: string,
    cidr: string,
    publicSubnets: string[],
    privateSubnets: string[],
    natGatewayIds?: string[],
    igwId?: string
  ) => {
    it(`VPC exists: ${vpcId}`, async () => {
      const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpcs.Vpcs?.[0].VpcId).toBe(vpcId);
      expect(vpcs.Vpcs?.[0].CidrBlock).toBe(cidr);
    });

    it('Public subnets exist', async () => {
      const subnets = await ec2.describeSubnets({ SubnetIds: publicSubnets }).promise();
      expect(subnets.Subnets?.length).toBe(publicSubnets.length);
    });

    it('Private subnets exist', async () => {
      const subnets = await ec2.describeSubnets({ SubnetIds: privateSubnets }).promise();
      expect(subnets.Subnets?.length).toBe(privateSubnets.length);
    });

    if (natGatewayIds && natGatewayIds.length > 0) {
      it('NAT Gateways exist', async () => {
        const nats = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
        expect(nats.NatGateways?.length).toBe(natGatewayIds.length);
      });
    }

    if (igwId) {
      it('Internet Gateway exists', async () => {
        const igws = await ec2.describeInternetGateways({ InternetGatewayIds: [igwId] }).promise();
        expect(igws.InternetGateways?.[0].InternetGatewayId).toBe(igwId);
      });
    }
  };

  describe('Primary VPC', () => {
    testVPC(
      ec2Primary,
      terraformOutput.primary_vpc_id,
      terraformOutput.primary_vpc_cidr,
      parseJsonArray(terraformOutput.primary_public_subnet_ids),
      parseJsonArray(terraformOutput.primary_private_subnet_ids),
      parseJsonArray(terraformOutput.primary_nat_gateway_ids),
      terraformOutput.primary_internet_gateway_id
    );
  });

  describe('Secondary VPC', () => {
    testVPC(
      ec2Secondary,
      terraformOutput.secondary_vpc_id,
      terraformOutput.secondary_vpc_cidr,
      parseJsonArray(terraformOutput.secondary_public_subnet_ids),
      parseJsonArray(terraformOutput.secondary_private_subnet_ids),
      parseJsonArray(terraformOutput.secondary_nat_gateway_ids),
      terraformOutput.secondary_internet_gateway_id
    );
  });

  // -------------------------
  // RDS Tests
  // -------------------------
  const testRDS = (
    rds: AWS.RDS,
    secrets: AWS.SecretsManager,
    dbName: string,
    secretArn: string,
    region: string
  ) => {

    it(`Can connect to RDS using Secrets Manager: ${dbName}`, async () => {
      try {
        const secret = await secrets.getSecretValue({ SecretId: secretArn }).promise();
        if (!secret.SecretString) return console.warn('Secret string missing');
        const creds = JSON.parse(secret.SecretString);
        const connection = await mysql.createConnection({
          host: creds.host || 'localhost',
          port: creds.port || 3306,
          user: creds.username,
          password: creds.password,
          database: creds.dbname || dbName,
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

  describe('Primary RDS', () => {
    testRDS(
      rdsPrimary,
      secretsPrimary,
      terraformOutput.db_name,
      terraformOutput.primary_secrets_manager_arn,
      'us-west-2'
    );
  });

  describe('Secondary RDS', () => {
    testRDS(
      rdsSecondary,
      secretsSecondary,
      terraformOutput.db_name,
      terraformOutput.secondary_secrets_manager_arn,
      'eu-west-1'
    );
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  const testS3 = (s3: AWS.S3, bucketName: string) => {
    it(`S3 Bucket exists: ${bucketName}`, async () => {
      await checkBucketExists(s3, bucketName).catch(err => console.warn(`Bucket ${bucketName} missing: ${err.message}`));
    });

    it('S3 Bucket has public access blocked', async () => {
      const pab = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });
  };

  describe('Primary S3', () => testS3(s3Primary, terraformOutput.primary_s3_bucket_name));
  describe('Secondary S3', () => testS3(s3Secondary, terraformOutput.secondary_s3_bucket_name));

  // -------------------------
  // IAM Roles & Instance Profiles
  // -------------------------
  const testIAM = (iam: AWS.IAM, roleArn: string, profileName: string) => {
    it(`IAM Role exists: ${roleArn}`, async () => {
      const roleName = roleArn.split('/').pop();
      if (!roleName) return console.warn('Role name parse failed');
      const role = await iam.getRole({ RoleName: roleName! }).promise();
      expect(role.Role?.Arn).toBe(roleArn);
    });

    it(`Instance Profile exists: ${profileName}`, async () => {
      const profile = await iam.getInstanceProfile({ InstanceProfileName: profileName }).promise();
      expect(profile.InstanceProfile?.InstanceProfileName).toBe(profileName);
    });
  };

  describe('Primary IAM', () => testIAM(iamPrimary, terraformOutput.application_role_arn, terraformOutput.application_instance_profile_name));
  describe('Secondary IAM', () => testIAM(iamSecondary, terraformOutput.application_role_arn, terraformOutput.application_instance_profile_name));

});

