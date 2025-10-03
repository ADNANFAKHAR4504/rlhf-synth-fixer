// test/terraform.integration.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';

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
  ami_id,
  autoscaling_group_name,
  cloudtrail_name,
  cloudtrail_s3_bucket_id,
  config_recorder_name,
  config_s3_bucket_id,
  ec2_iam_role_arn,
  ec2_instance_profile_name,
  ec2_security_group_id,
  internet_gateway_id,
  kms_key_arn,
  kms_key_id,
  launch_template_id,
  mfa_enforcement_policy_arn,
  private_subnet_ids,
  public_subnet_ids,
  rds_endpoint,
  rds_instance_id,
  rds_port,
  rds_security_group_id,
  s3_bucket_arn,
  s3_bucket_id,
  vpc_cidr,
  vpc_flow_logs_group_name,
  vpc_id,
  waf_web_acl_arn,
  waf_web_acl_id
} = terraformOutput;

// Parse subnet arrays
const publicSubnets = parseJsonArray(public_subnet_ids);
const privateSubnets = parseJsonArray(private_subnet_ids);

// -------------------------------
// Integration Test Suite
// -------------------------------
describe('TAP Stack Integration Tests', () => {
  // Networking
  describe('Networking', () => {
    test('VPC exists and CIDR is correct', () => {
      expect(vpc_id).toMatch(/^vpc-/);
      expect(vpc_cidr).toBe('10.0.0.0/16');
    });

    test('Internet Gateway is valid', () => {
      expect(internet_gateway_id).toMatch(/^igw-/);
    });

    test('Public and private subnets are valid', () => {
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
      publicSubnets.forEach(id => expect(id).toMatch(/^subnet-/));
      privateSubnets.forEach(id => expect(id).toMatch(/^subnet-/));
    });
  });

  // Security & IAM
  describe('Security & IAM', () => {
    test('EC2 Security Group is valid', () => {
      expect(ec2_security_group_id).toMatch(/^sg-/);
    });

    test('RDS Security Group is valid', () => {
      expect(rds_security_group_id).toMatch(/^sg-/);
    });

    test('IAM Role and Instance Profile are valid', () => {
      expect(ec2_iam_role_arn).toContain(':role/');
      expect(ec2_instance_profile_name).toContain('ec2');
    });

    test('KMS key is valid', () => {
      expect(kms_key_arn).toContain(':key/');
      expect(kms_key_id).toBeDefined();
    });
  });
  // EC2 & AutoScaling
  describe('EC2 & AutoScaling', () => {
    test('AMI ID is valid', () => {
      expect(ami_id).toMatch(/^ami-/);
    });

    test('Launch Template ID is valid', () => {
      expect(launch_template_id).toMatch(/^lt-/);
    });

    test('AutoScaling Group name is valid', () => {
      expect(autoscaling_group_name).toContain('asg');
    });
  });

  // RDS
  describe('RDS Database', () => {
    test('RDS endpoint is valid', () => {
      expect(rds_endpoint).toMatch(/rds\.amazonaws\.com/);
      expect(rds_instance_id).toBeDefined();
      expect(rds_port).toBe('3306');
    });
  });

  // S3 Buckets
  describe('S3 Buckets', () => {
    test('Primary S3 bucket is valid', () => {
      expect(s3_bucket_arn).toContain(':s3:::');
      expect(s3_bucket_id).toContain('tap-stack');
    });

    test('CloudTrail S3 bucket exists', () => {
      expect(cloudtrail_s3_bucket_id).toContain('tap-stack');
    });

    test('Config Recorder bucket exists', () => {
      expect(config_s3_bucket_id).toContain('tap-stack');
    });
  });

  // CloudTrail
  describe('CloudTrail', () => {
    test('CloudTrail outputs are valid', () => {
      expect(cloudtrail_name).toContain('trail');
    });

    test('Config Recorder exists', () => {
      expect(config_recorder_name).toContain('recorder');
    });
  });

  // MFA Enforcement Policy
  describe('MFA Enforcement', () => {
    test('MFA Enforcement Policy ARN is valid', () => {
      expect(mfa_enforcement_policy_arn).toContain(':policy/');
    });
  });

  // VPC Flow Logs
  describe('VPC Flow Logs', () => {
    test('Flow log group is defined', () => {
      expect(vpc_flow_logs_group_name).toContain('/aws/vpc/');
    });
  });
});
