import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

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

const albDnsName = terraformOutput.alb_dns_name;
const albSg = terraformOutput.alb_security_group_id;

const vpcId = terraformOutput.vpc_id;
const vpcCidr = terraformOutput.vpc_cidr;
const privateSubnets = parseJsonArray(terraformOutput.private_subnet_ids);
const publicSubnets = parseJsonArray(terraformOutput.public_subnet_ids);
const igwId = terraformOutput.internet_gateway_id;
const natGws = parseJsonArray(terraformOutput.nat_gateway_ids);
const eips = parseJsonArray(terraformOutput.elastic_ip_addresses);

const rdsEndpoint = terraformOutput.rds_endpoint;
const rdsUser = terraformOutput.rds_username;
const rdsDbName = terraformOutput.rds_database_name;
const rdsSg = terraformOutput.rds_security_group_id;

const ec2Sg = terraformOutput.ec2_security_group_id;
const amiId = terraformOutput.ami_id;
const launchTemplateId = terraformOutput.launch_template_id;
const asgName = terraformOutput.autoscaling_group_name;
const ec2RoleArn = terraformOutput.ec2_iam_role_arn;
const instanceProfile = terraformOutput.instance_profile_name;

const staticBucket = terraformOutput.static_s3_bucket_name;
const staticBucketArn = terraformOutput.static_s3_bucket_arn;

const trailName = terraformOutput.cloudtrail_name;
const trailRoleArn = terraformOutput.cloudtrail_iam_role_arn;
const trailBucket = terraformOutput.cloudtrail_s3_bucket_name;
const logGroupApp = terraformOutput.cloudwatch_log_group_app;
const logGroupTrail = terraformOutput.cloudwatch_log_group_cloudtrail;
const dashboard = terraformOutput.cloudwatch_dashboard_name;

const domain = terraformOutput.route53_domain_name;
const zoneId = terraformOutput.route53_zone_id;
const nsRecords = parseJsonArray(terraformOutput.route53_name_servers);
const wwwRecord = terraformOutput.route53_www_record;
const healthCheckId = terraformOutput.route53_health_check_id;

// -------------------------------
// Test Suite
// -------------------------------
describe('TAP Stack Integration Tests', () => {
  // Application
  describe('Application Reachability', () => {
    test('ALB root returns HTTP 200 (HTML)', async () => {
      expect(albDnsName).toBeDefined();
      const res = await fetch(`http://${albDnsName}/`, { signal: AbortSignal.timeout(8000) });
      expect(res.status).toBe(200);
    }, 30000);
  });

  // Database outputs only (skip CLI checks)
  describe('Database Outputs', () => {
    test('RDS endpoint and credentials output present', () => {
      expect(rdsEndpoint).toMatch(/rds\.amazonaws\.com/);
      expect(rdsUser).toBeDefined();
      expect(rdsDbName).toBeDefined();
      expect(rdsSg).toMatch(/^sg-/);
    });
  });

  // Networking
  describe('Networking', () => {
    test('VPC and CIDR are valid', () => {
      expect(vpcId).toMatch(/^vpc-/);
      expect(vpcCidr).toBe('10.0.0.0/16');
    });

    test('Public and private subnets exist', () => {
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('Internet Gateway and NAT GWs exist', () => {
      expect(igwId).toMatch(/^igw-/);
      expect(natGws.length).toBeGreaterThan(0);
    });

    test('Elastic IPs allocated', () => {
      expect(eips.length).toBeGreaterThan(0);
    });
  });

  // Security
  describe('Security Groups & IAM', () => {
    test('ALB, RDS, EC2 SGs valid', () => {
      expect(albSg).toMatch(/^sg-/);
      expect(rdsSg).toMatch(/^sg-/);
      expect(ec2Sg).toMatch(/^sg-/);
    });

    test('IAM roles and instance profile exist', () => {
      expect(ec2RoleArn).toContain(':role/');
      expect(instanceProfile).toContain('tap-stack');
    });
  });

  // EC2
  describe('EC2 & AutoScaling', () => {
    test('AMI, Launch Template, and ASG outputs present', () => {
      expect(amiId).toMatch(/^ami-/);
      expect(launchTemplateId).toMatch(/^lt-/);
      expect(asgName).toContain('tap-stack-asg');
    });
  });

  // S3
  describe('S3 Buckets', () => {
    test('Static bucket valid', () => {
      expect(staticBucketArn).toContain(staticBucket);
    });

    test('CloudTrail bucket valid', () => {
      expect(trailBucket).toContain('cloudtrail');
    });
  });

  // CloudTrail & CloudWatch
  describe('CloudTrail & CloudWatch', () => {
    test('CloudTrail trail and role defined', () => {
      expect(trailName).toContain('trail');
      expect(trailRoleArn).toContain(':role/');
    });

    test('CloudWatch dashboard and log groups defined', () => {
      expect(dashboard).toContain('dashboard');
      expect(logGroupApp).toContain('/aws/ec2');
      expect(logGroupTrail).toContain('/aws/cloudtrail');
    });
  });

  // Route53
  describe('Route53', () => {
    test('Hosted zone and NS records valid', () => {
      expect(zoneId).toMatch(/^Z/);
      expect(nsRecords.length).toBe(4);
    });

    test('Domain and record set outputs present', () => {
      expect(domain).toContain('.');
      expect(wwwRecord).toContain('www.');
    });

    test('Health check ID output present', () => {
      expect(healthCheckId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });
});
