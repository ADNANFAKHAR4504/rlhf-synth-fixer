// test/terraform.int.test.full.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

const {
  alb_dns_name,
  alb_security_group_id,
  target_group_arn,
  ec2_iam_role_arn,
  ec2_instance_profile_arn,
  launch_template_id,
  autoscaling_group_name,
  ec2_security_group_id,
  rds_endpoint,
  rds_instance_id,
  rds_port,
  secrets_manager_secret_name,
  s3_bucket_name,
  s3_logs_bucket_name,
  cloudtrail_bucket_name,
  cloudtrail_iam_role_arn,
  vpc_id,
  vpc_cidr,
  public_subnet_ids,
  private_subnet_ids,
  internet_gateway_id,
  nat_gateway_ids,
  flow_log_id,
  dlm_lifecycle_policy_id
} = terraformOutput;

const s3 = new AWS.S3({ region: 'us-west-2' });
const rds = new AWS.RDS({ region: 'us-west-2' });
const ec2 = new AWS.EC2({ region: 'us-west-2' });
const elbv2 = new AWS.ELBv2({ region: 'us-west-2' });
const iam = new AWS.IAM({ region: 'us-west-2' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });
const secretsManager = new AWS.SecretsManager({ region: 'us-west-2' });

// Helper to parse JSON arrays
const parseJsonArray = (str?: string) => {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
};

const publicSubnets = parseJsonArray(public_subnet_ids);
const privateSubnets = parseJsonArray(private_subnet_ids);

// -------------------------------
// Integration Test Suite
// -------------------------------
describe('TAP Stack Full Live Integration Tests', () => {

  // -------------------------------
  // ALB Tests
  // -------------------------------
  describe('Application Load Balancer', () => {
    it('ALB DNS resolves', async () => {
      const addrs = await dns.lookup(alb_dns_name);
      expect(addrs.address).toBeDefined();
    });

    it('ALB security group exists', async () => {
      expect(alb_security_group_id).toMatch(/^sg-/);
    });

    it('ALB target group exists', async () => {
      const tg = await elbv2.describeTargetGroups({ TargetGroupArns: [target_group_arn] }).promise();
      expect(tg.TargetGroups.length).toBe(1);
    });

    it('ALB target group health is healthy', async () => {
      const health = await elbv2.describeTargetHealth({ TargetGroupArn: target_group_arn }).promise();
      health.TargetHealthDescriptions.forEach(desc => {
        expect(['healthy','initial']).toContain(desc.TargetHealth.State);
      });
    });
  });

  // -------------------------------
  // RDS Tests
  // -------------------------------
  describe('RDS Database', () => {
    it('RDS instance exists', async () => {
      const db = await rds.describeDBInstances({ DBInstanceIdentifier: rds_instance_id }).promise();
      expect(db.DBInstances.length).toBe(1);
      expect(db.DBInstances[0].Endpoint.Port).toBe(Number(rds_port));
    });

    it('RDS endpoint valid', () => {
      expect(rds_endpoint).toMatch(/rds\.amazonaws\.com/);
    });

    it('Secrets Manager secret exists', async () => {
      const secret = await secretsManager.describeSecret({ SecretId: secrets_manager_secret_name }).promise();
      expect(secret.Name).toBe(secrets_manager_secret_name);
    });
  });

  // -------------------------------
  // Networking Tests
  // -------------------------------
  describe('Networking', () => {
    it('VPC exists and CIDR correct', async () => {
      const vpc = await ec2.describeVpcs({ VpcIds: [vpc_id] }).promise();
      expect(vpc.Vpcs[0].CidrBlock).toBe(vpc_cidr);
    });

    it('Public and private subnets exist', async () => {
      const pub = await ec2.describeSubnets({ SubnetIds: publicSubnets }).promise();
      const priv = await ec2.describeSubnets({ SubnetIds: privateSubnets }).promise();
      expect(pub.Subnets.length).toBe(publicSubnets.length);
      expect(priv.Subnets.length).toBe(privateSubnets.length);
    });

    it('Internet Gateway exists', async () => {
      const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [internet_gateway_id] }).promise();
      expect(igw.InternetGateways.length).toBe(1);
    });

    it('NAT Gateways exist', async () => {
      const natIds = parseJsonArray(nat_gateway_ids);
      const nat = await ec2.describeNatGateways({ NatGatewayIds: natIds }).promise();
      expect(nat.NatGateways.length).toBe(natIds.length);
    });

    it('VPC Flow Log exists', async () => {
      const flows = await ec2.describeFlowLogs({ FlowLogIds: [flow_log_id] }).promise();
      expect(flows.FlowLogs.length).toBe(1);
    });
  });

  // -------------------------------
  // IAM Tests
  // -------------------------------
  describe('IAM Roles & Instance Profiles', () => {
    it('EC2 role exists', async () => {
      const role = await iam.getRole({ RoleName: ec2_iam_role_arn.split('/').pop()! }).promise();
      expect(role.Role.Arn).toBe(ec2_iam_role_arn);
    });

    it('EC2 instance profile exists', async () => {
      const profile = await iam.getInstanceProfile({ InstanceProfileName: ec2_instance_profile_arn.split('/').pop()! }).promise();
      expect(profile.InstanceProfile.Arn).toBe(ec2_instance_profile_arn);
    });

    it('CloudTrail IAM role exists', async () => {
      const role = await iam.getRole({ RoleName: cloudtrail_iam_role_arn.split('/').pop()! }).promise();
      expect(role.Role.Arn).toBe(cloudtrail_iam_role_arn);
    });
  });

  // -------------------------------
  // EC2 & AutoScaling Tests
  // -------------------------------
  describe('EC2 & AutoScaling', () => {
    it('Launch template exists', async () => {
      const lt = await ec2.describeLaunchTemplates({ LaunchTemplateIds: [launch_template_id] }).promise();
      expect(lt.LaunchTemplates.length).toBe(1);
    });

    it('AutoScaling Group exists', async () => {
      const asg = new AWS.AutoScaling({ region: 'us-west-2' });
      const groups = await asg.describeAutoScalingGroups({ AutoScalingGroupNames: [autoscaling_group_name] }).promise();
      expect(groups.AutoScalingGroups.length).toBe(1);
    });
  });

  // -------------------------------
  // S3 Buckets Tests
  // -------------------------------
  describe('S3 Buckets', () => {
    const checkBucketExists = async (bucket: string) => {
      if (!bucket) throw new Error(`Bucket name is undefined`);
      return s3.headBucket({ Bucket: bucket }).promise();
    };

    it('Data bucket exists', async () => {
      const data = await checkBucketExists(s3_bucket_name);
      expect(data).toBeDefined();
    });

    it('Logs bucket exists', async () => {
      const logs = await checkBucketExists(s3_logs_bucket_name);
      expect(logs).toBeDefined();
    });

    it('CloudTrail bucket exists', async () => {
      const trail = await checkBucketExists(cloudtrail_bucket_name);
      expect(trail).toBeDefined();
    });
  });

  // -------------------------------
  // CloudWatch Alarms
  // -------------------------------
  describe('CloudWatch Alarms', () => {
    it('At least one alarm exists', async () => {
      const alarms = await cloudwatch.describeAlarms({}).promise();
      expect(alarms.MetricAlarms.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------
  // DLM Lifecycle Policy
  // -------------------------------
  describe('DLM Lifecycle Manager', () => {
    it('DLM policy exists', async () => {
      const dlm = new AWS.DLM({ region: 'us-west-2' });
      const policies = await dlm.getLifecyclePolicies({ PolicyIds: [dlm_lifecycle_policy_id] }).promise();
      expect(policies.Policies.length).toBe(1);
    });
  });

});
