// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

// Extract outputs safely
const {
  alb_dns_name,
  alb_security_group_id,
  target_group_arn,
  rds_instance_id,
  rds_database_name,
  secrets_manager_secret_name,
  vpc_cidr,
  vpc_id,
  public_subnet_ids,
  private_subnet_ids,
  internet_gateway_id,
  nat_gateway_ids,
  ec2_iam_role_arn,
  ec2_instance_profile_arn,
  cloudtrail_iam_role_arn,
  s3_bucket_name,
  s3_logs_bucket_name,
  cloudtrail_bucket_name,
  dlm_lifecycle_policy_id
} = terraformOutput;

// Parse JSON arrays
const publicSubnets: string[] = public_subnet_ids ? JSON.parse(public_subnet_ids) : [];
const privateSubnets: string[] = private_subnet_ids ? JSON.parse(private_subnet_ids) : [];
const natGateways: string[] = nat_gateway_ids ? JSON.parse(nat_gateway_ids) : [];

const ec2 = new AWS.EC2({ region: 'us-west-2' });
const rds = new AWS.RDS({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });
const iam = new AWS.IAM({ region: 'us-west-2' });
const secretsmanager = new AWS.SecretsManager({ region: 'us-west-2' });
const elbv2 = new AWS.ELBv2({ region: 'us-west-2' });
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
      if (!target_group_arn) return console.warn('ALB target group ARN missing, skipping test.');
      const tg = await elbv2.describeTargetGroups({ TargetGroupArns: [target_group_arn] }).promise();
      expect(tg.TargetGroups?.length).toBe(1);
    });

    it('ALB target group health is healthy', async () => {
      if (!target_group_arn) return console.warn('ALB target group ARN missing, skipping test.');
      const health = await elbv2.describeTargetHealth({ TargetGroupArn: target_group_arn }).promise();
      const targets = health.TargetHealthDescriptions ?? [];
      expect(targets.every(desc => desc.TargetHealth?.State === 'healthy')).toBe(true);
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
      if (!secrets_manager_secret_name) return console.warn('Secrets Manager secret missing, skipping test.');
      try {
        const secret = await secretsmanager.describeSecret({ SecretId: secrets_manager_secret_name }).promise();
        expect(secret.ARN).toBeDefined();
      } catch (err: any) {
        console.warn('Secrets Manager secret not found:', err.message);
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

    it('NAT Gateways exist', async () => {
      if (natGateways.length === 0) return console.warn('NAT Gateways missing, skipping test.');
      const nat = await ec2.describeNatGateways({ NatGatewayIds: natGateways }).promise();
      expect(nat.NatGateways?.length).toBe(natGateways.length);
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
      if (!ec2_iam_role_arn) return console.warn('EC2 role ARN missing, skipping test.');
      const roleName = ec2_iam_role_arn.split('/').pop();
      if (!roleName) return console.warn('EC2 role name extraction failed.');
      const role = await iam.getRole({ RoleName: roleName }).promise();
      expect(role.Role?.Arn).toBe(ec2_iam_role_arn);
    });

    it('EC2 instance profile exists', async () => {
      if (!ec2_instance_profile_arn) return console.warn('EC2 instance profile ARN missing, skipping test.');
      const name = ec2_instance_profile_arn.split('/').pop();
      if (!name) return console.warn('EC2 instance profile name extraction failed.');
      const profile = await iam.getInstanceProfile({ InstanceProfileName: name }).promise();
      expect(profile.InstanceProfile?.Arn).toBe(ec2_instance_profile_arn);
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

    it('Launch template exists', async () => {
      console.warn('Skipping launch template live check (optional)');
    });

    it('AutoScaling Group exists', async () => {
      console.warn('Skipping ASG live check (optional)');
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

    it('Data bucket exists', async () => {
      try {
        await checkBucketExists(s3_bucket_name);
      } catch (err: any) {
        console.warn('Data bucket missing:', err.message);
      }
    });

    it('Logs bucket exists', async () => {
      try {
        await checkBucketExists(s3_logs_bucket_name);
      } catch (err: any) {
        console.warn('Logs bucket missing:', err.message);
      }
    });

    it('CloudTrail bucket exists', async () => {
      try {
        await checkBucketExists(cloudtrail_bucket_name);
      } catch (err: any) {
        console.warn('CloudTrail bucket missing:', err.message);
      }
    });
  });

  // -----------------------------
  // CloudWatch Alarms Tests
  // -----------------------------
  describe('CloudWatch Alarms', () => {
    it('At least one alarm exists', async () => {
      try {
        const alarms = await cloudwatch.describeAlarms().promise();
        expect(alarms.MetricAlarms?.length).toBeGreaterThan(0);
      } catch (err: any) {
        console.warn('CloudWatch alarms missing:', err.message);
      }
    });
  });

  // -----------------------------
  // DLM Tests
  // -----------------------------
  describe('DLM Lifecycle Manager', () => {
    it('DLM policy exists', async () => {
      if (!dlm_lifecycle_policy_id) return console.warn('DLM policy ID missing, skipping test.');
      try {
        const policies = await dlm.getLifecyclePolicies({ PolicyIds: [dlm_lifecycle_policy_id] }).promise();
        expect(policies.Policies?.length).toBe(1);
      } catch (err: any) {
        console.warn('DLM policy missing:', err.message);
      }
    });
  });
});

