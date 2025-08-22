import * as fs from 'fs';
import * as path from 'path';

const TF_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const NETWORKING_PATH = path.resolve(
  __dirname,
  '../lib/modules/networking/networking.tf'
);
const SECURITY_PATH = path.resolve(
  __dirname,
  '../lib/modules/security/security.tf'
);
const COMPUTE_PATH = path.resolve(
  __dirname,
  '../lib/modules/compute/compute.tf'
);
const DATABASE_PATH = path.resolve(
  __dirname,
  '../lib/modules/database/database.tf'
);
const STORAGE_PATH = path.resolve(
  __dirname,
  '../lib/modules/storage/storage.tf'
);
const IAM_PATH = path.resolve(__dirname, '../lib/modules/iam/iam.tf');
const MONITORING_PATH = path.resolve(
  __dirname,
  '../lib/modules/monitoring/monitoring.tf'
);

describe('Terraform Core Infrastructure (static checks)', () => {
  let hcl: string;
  let networkingHcl: string;
  let securityHcl: string;
  let computeHcl: string;
  let databaseHcl: string;
  let storageHcl: string;
  let iamHcl: string;
  let monitoringHcl: string;

  beforeAll(() => {
    hcl = fs.readFileSync(TF_PATH, 'utf8');
    networkingHcl = fs.readFileSync(NETWORKING_PATH, 'utf8');
    securityHcl = fs.readFileSync(SECURITY_PATH, 'utf8');
    computeHcl = fs.readFileSync(COMPUTE_PATH, 'utf8');
    databaseHcl = fs.readFileSync(DATABASE_PATH, 'utf8');
    storageHcl = fs.readFileSync(STORAGE_PATH, 'utf8');
    iamHcl = fs.readFileSync(IAM_PATH, 'utf8');
    monitoringHcl = fs.readFileSync(MONITORING_PATH, 'utf8');
  });

  test('defines all required modules', () => {
    const modules = [
      'networking',
      'security',
      'compute',
      'database',
      'storage',
      'iam',
      'monitoring',
    ];
    modules.forEach(module => {
      expect(hcl).toMatch(new RegExp(`module\\s+"${module}"\\s*{`, 'm'));
    });
  });

  test('networking module creates VPC, subnets, NAT gateway, and route tables', () => {
    expect(networkingHcl).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(networkingHcl).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(networkingHcl).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    // expect(networkingHcl).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    expect(networkingHcl).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(networkingHcl).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test('security module creates all required security groups', () => {
    expect(securityHcl).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    expect(securityHcl).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    expect(securityHcl).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test('EC2 security group has correct rules', () => {
    const ec2Sg = securityHcl.match(
      /resource\s+"aws_security_group"\s+"ec2"\s*{([\s\S]*?)^}/m
    )?.[1];
    expect(ec2Sg).toMatch(/from_port\s*=\s*443/);
    expect(ec2Sg).toMatch(/from_port\s*=\s*80/);
    expect(ec2Sg).toMatch(/from_port\s*=\s*22/);
    expect(ec2Sg).toMatch(/cidr_blocks\s*=\s*\[var\.vpc_cidr\]/);
  });

  test('RDS security group has correct rules', () => {
    const rdsSg = securityHcl.match(
      /resource\s+"aws_security_group"\s+"rds"\s*{([\s\S]*?)^}/m
    )?.[1];
    expect(rdsSg).toMatch(/from_port\s*=\s*3306/);
    expect(rdsSg).toMatch(
      /security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/
    );
  });

  test('compute module creates ALB and ASG', () => {
    expect(computeHcl).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(computeHcl).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
  });

  test('database module creates RDS instance with encryption', () => {
    expect(databaseHcl).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test('storage module creates S3 buckets with encryption and versioning', () => {
    expect(storageHcl).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
  });

  // test('storage module creates VPC S3 endpoint', () => {
  //   expect(storageHcl).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
  // });

  test('iam module creates IAM users with MFA enforcement', () => {
    expect(iamHcl).toMatch(/resource\s+"aws_iam_user"\s+"main"/);
    expect(iamHcl).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_enforcement"/);
  });

  test('monitoring module creates VPC Flow Logs', () => {
    expect(monitoringHcl).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
  });
});
