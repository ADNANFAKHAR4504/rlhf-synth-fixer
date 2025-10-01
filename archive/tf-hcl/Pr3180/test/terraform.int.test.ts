import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
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
  alb_dns_name,
  alb_security_group_id,
  alb_zone_id,
  ami_id,
  autoscaling_group_name,
  cloudtrail_bucket_name,
  cloudtrail_iam_role_arn,
  cloudtrail_name,
  dlm_lifecycle_policy_id,
  ec2_iam_role_arn,
  ec2_iam_role_name,
  ec2_security_group_id,
  internet_gateway_id,
  launch_template_id,
  private_subnet_ids,
  public_subnet_ids,
  rds_database_name,
  rds_endpoint,
  rds_password_parameter,
  rds_security_group_id,
  rds_username_parameter,
  s3_bucket_arn,
  s3_bucket_name,
  s3_logs_bucket_name,
  target_group_arn,
  vpc_cidr,
  vpc_id
} = terraformOutput;

// Parse JSON arrays
const publicSubnets = parseJsonArray(public_subnet_ids);
const privateSubnets = parseJsonArray(private_subnet_ids);

// -------------------------------
// Test Suite
// -------------------------------
describe('TAP Stack Integration Tests', () => {
  // ALB Reachability
  describe('Application Load Balancer', () => {
    test('ALB DNS resolves', async () => {
      const addrs = await dns.lookup(alb_dns_name);
      expect(addrs.address).toBeDefined();
    });

    test('ALB outputs valid', () => {
      expect(alb_zone_id).toMatch(/^Z[A-Z0-9]+/);
      expect(alb_security_group_id).toMatch(/^sg-/);
    });
  });

  // RDS
  describe('RDS Database', () => {
    test('RDS endpoint valid', () => {
      expect(rds_endpoint).toMatch(/rds\.amazonaws\.com/);
      expect(rds_database_name).toBeDefined();
    });

    test('RDS security & params valid', () => {
      expect(rds_security_group_id).toMatch(/^sg-/);
      expect(rds_username_parameter).toContain('/tap-production/rds/username');
      expect(rds_password_parameter).toContain('/tap-production/rds/password');
    });
  });

  // Networking
  describe('Networking', () => {
    test('VPC & CIDR valid', () => {
      expect(vpc_id).toMatch(/^vpc-/);
      expect(vpc_cidr).toBe('10.0.0.0/16');
    });

    test('Subnets present', () => {
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
      publicSubnets.forEach(id => expect(id).toMatch(/^subnet-/));
      privateSubnets.forEach(id => expect(id).toMatch(/^subnet-/));
    });

    test('Internet Gateway valid', () => {
      expect(internet_gateway_id).toMatch(/^igw-/);
    });
  });

  // Security & IAM
  describe('Security & IAM', () => {
    test('Security groups valid', () => {
      expect(ec2_security_group_id).toMatch(/^sg-/);
      expect(rds_security_group_id).toMatch(/^sg-/);
      expect(alb_security_group_id).toMatch(/^sg-/);
    });

    test('IAM roles valid', () => {
      expect(ec2_iam_role_arn).toContain(':role/');
      expect(ec2_iam_role_name).toContain('ec2-role');
      expect(cloudtrail_iam_role_arn).toContain(':role/');
    });
  });

  // EC2 & AutoScaling
  describe('EC2 & AutoScaling', () => {
    test('AMI outputs valid', () => {
      expect(ami_id).toMatch(/^ami-/);
    });

    test('Launch template valid', () => {
      expect(launch_template_id).toMatch(/^lt-/);
    });

    test('ASG outputs valid', () => {
      expect(autoscaling_group_name).toContain('asg');
    });
  });

  // S3
  describe('S3 Buckets', () => {
    test('Data bucket valid', () => {
      expect(s3_bucket_arn).toContain(':s3:::');
      expect(s3_bucket_name).toContain('tap-production-data');
    });

    test('Logs bucket valid', () => {
      expect(s3_logs_bucket_name).toContain('tap-production-logs');
    });

    test('CloudTrail bucket valid', () => {
      expect(cloudtrail_bucket_name).toContain('cloudtrail');
    });
  });

  // CloudTrail
  describe('CloudTrail', () => {
    test('CloudTrail outputs valid', () => {
      expect(cloudtrail_name).toContain('trail');
      expect(cloudtrail_bucket_name).toContain('cloudtrail');
    });
  });

  // Target Group
  describe('Target Group', () => {
    test('Target group ARN valid', () => {
      expect(target_group_arn).toContain('targetgroup');
    });
  });

  // DLM
  describe('DLM Lifecycle Manager', () => {
    test('DLM lifecycle policy valid', () => {
      expect(dlm_lifecycle_policy_id).toMatch(/^policy-/);
    });
  });
});
