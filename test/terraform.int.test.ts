// test/terraform.integration.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const terraformOutput = JSON.parse(readFileSync(outputsPath, 'utf8'));

function parseJsonArray(str?: string): string[] {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

// Extract outputs
const {
  alb_dns_name,
  alb_security_group_id,
  alb_zone_id,
  ami_id,
  autoscaling_group_name,
  cloudwatch_alarm_alb_healthy_hosts_name,
  cloudwatch_alarm_high_cpu_name,
  cloudwatch_alarm_low_cpu_name,
  cloudwatch_alarm_rds_cpu_name,
  cloudwatch_log_group_name,
  db_subnet_group_name,
  ec2_iam_role_arn,
  ec2_instance_profile_arn,
  ec2_security_group_id,
  elastic_ip_addresses,
  flow_log_id,
  flow_logs_role_arn,
  internet_gateway_id,
  kms_key_arn,
  kms_key_id,
  launch_template_id,
  nat_gateway_ids,
  private_subnet_ids,
  public_subnet_ids,
  rds_address,
  rds_endpoint,
  rds_instance_id,
  rds_port,
  secrets_manager_secret_arn,
  secrets_manager_secret_name,
  security_group_alb_id,
  security_group_rds_id,
  ssm_parameter_name,
  target_group_arn,
  vpc_cidr,
  vpc_id,
  s3_bucket_name,
  s3_logs_bucket_name,
  cloudtrail_bucket_name
} = terraformOutput;

// Parse JSON arrays
const publicSubnets = parseJsonArray(public_subnet_ids);
const privateSubnets = parseJsonArray(private_subnet_ids);
const natGateways = parseJsonArray(nat_gateway_ids);
const eips = parseJsonArray(elastic_ip_addresses);

// AWS SDK Clients
const ec2 = new AWS.EC2({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });
const rds = new AWS.RDS({ region: 'us-west-2' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-west-2' });
const secretsManager = new AWS.SecretsManager({ region: 'us-west-2' });
const iam = new AWS.IAM({ region: 'us-west-2' });

describe('TAP Stack Live Integration Tests', () => {

  // ==========================
  // ALB Tests
  // ==========================
  describe('Application Load Balancer', () => {
    it('ALB DNS resolves', async () => {
      const addrs = await dns.lookup(alb_dns_name);
      expect(addrs.address).toBeDefined();
    });

    it('ALB security group and zone valid', () => {
      expect(alb_zone_id).toMatch(/^Z[A-Z0-9]+/);
      expect(alb_security_group_id).toMatch(/^sg-/);
    });
  });

  // ==========================
  // RDS Tests
  // ==========================
  describe('RDS Database', () => {
    it('RDS endpoint valid', () => {
      expect(rds_endpoint).toMatch(/rds\.amazonaws\.com/);
      expect(rds_address).toBeDefined();
      expect(rds_port).toBe('3306');
    });

    it('RDS instance exists', async () => {
      const data = await rds.describeDBInstances({ DBInstanceIdentifier: rds_instance_id }).promise();
      expect(data.DBInstances?.length).toBe(1);
      expect(data.DBInstances?.[0].DBInstanceIdentifier).toBe(rds_instance_id);
    });

    it('Secrets Manager secret exists', async () => {
      const secret = await secretsManager.describeSecret({ SecretId: secrets_manager_secret_name }).promise();
      expect(secret.ARN).toBe(secrets_manager_secret_arn);
    });
  });

  // ==========================
  // Networking Tests
  // ==========================
  describe('Networking', () => {
    it('VPC exists and CIDR correct', async () => {
      const data = await ec2.describeVpcs({ VpcIds: [vpc_id] }).promise();
      expect(data.Vpcs?.length).toBe(1);
      expect(data.Vpcs?.[0].CidrBlock).toBe(vpc_cidr);
    });

    it('Public and private subnets exist', async () => {
      const pubData = await ec2.describeSubnets({ SubnetIds: publicSubnets }).promise();
      const privData = await ec2.describeSubnets({ SubnetIds: privateSubnets }).promise();
      expect(pubData.Subnets?.length).toBe(publicSubnets.length);
      expect(privData.Subnets?.length).toBe(privateSubnets.length);
    });

    it('Internet Gateway exists', async () => {
      const igwData = await ec2.describeInternetGateways({ InternetGatewayIds: [internet_gateway_id] }).promise();
      expect(igwData.InternetGateways?.length).toBe(1);
    });

    it('NAT Gateways exist', async () => {
      const natData = await ec2.describeNatGateways({ NatGatewayIds: natGateways }).promise();
      expect(natData.NatGateways?.length).toBe(natGateways.length);
    });

    it('Elastic IPs assigned', async () => {
      const addresses = await ec2.describeAddresses({ PublicIps: eips }).promise();
      expect(addresses.Addresses?.length).toBe(eips.length);
    });
  });

  // ==========================
  // IAM Tests
  // ==========================
  describe('IAM Roles & Instance Profiles', () => {
    it('EC2 role exists', async () => {
      const role = await iam.getRole({ RoleName: ec2_iam_role_arn.split('/').pop()! }).promise();
      expect(role.Role.RoleName).toBe(ec2_iam_role_arn.split('/').pop());
    });

    it('EC2 instance profile exists', async () => {
      const profile = await iam.getInstanceProfile({ InstanceProfileName: ec2_instance_profile_arn.split('/').pop()! }).promise();
      expect(profile.InstanceProfile.InstanceProfileName).toBe(ec2_instance_profile_arn.split('/').pop());
    });
  });

  // ==========================
  // EC2 & AutoScaling
  // ==========================
  describe('EC2 Launch Template & AutoScaling', () => {
    it('Launch template exists', async () => {
      const ltData = await ec2.describeLaunchTemplates({ LaunchTemplateIds: [launch_template_id] }).promise();
      expect(ltData.LaunchTemplates?.length).toBe(1);
    });

    it('ASG name matches', () => {
      expect(autoscaling_group_name).toContain('asg');
    });
  });

  // ==========================
  // S3 Tests
  // ==========================
  describe('S3 Buckets', () => {
    it('Data bucket exists', async () => {
      const data = await s3.headBucket({ Bucket: s3_bucket_name }).promise();
      expect(data).toBeDefined();
    });

    it('Logs bucket exists', async () => {
      const logs = await s3.headBucket({ Bucket: s3_logs_bucket_name }).promise();
      expect(logs).toBeDefined();
    });

    it('CloudTrail bucket exists', async () => {
      const trail = await s3.headBucket({ Bucket: cloudtrail_bucket_name }).promise();
      expect(trail).toBeDefined();
    });
  });

  // ==========================
  // CloudWatch Alarms
  // ==========================
  describe('CloudWatch Alarms', () => {
    it('Alarms exist', async () => {
      const alarms = [
        cloudwatch_alarm_high_cpu_name,
        cloudwatch_alarm_low_cpu_name,
        cloudwatch_alarm_rds_cpu_name,
        cloudwatch_alarm_alb_healthy_hosts_name
      ];
      for (const name of alarms) {
        const data = await cloudwatch.describeAlarms({ AlarmNames: [name] }).promise();
        expect(data.MetricAlarms?.length).toBe(1);
      }
    });
  });

  // ==========================
  // Flow Logs
  // ==========================
  describe('VPC Flow Logs', () => {
    it('Flow log exists', async () => {
      const data = await ec2.describeFlowLogs({ FlowLogIds: [flow_log_id] }).promise();
      expect(data.FlowLogs?.length).toBe(1);
      expect(data.FlowLogs?.[0].FlowLogId).toBe(flow_log_id);
    });
  });

  // ==========================
  // Target Group
  // ==========================
  describe('Target Group', () => {
    it('Target group ARN valid', () => {
      expect(target_group_arn).toContain('targetgroup');
    });
  });

});
