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
  acm_certificate_arn,
  acm_certificate_domain,
  alb_arn,
  alb_dns_name,
  alb_zone_id,
  ami_id,
  ami_name,
  api_gateway_execution_arn,
  api_gateway_id,
  api_gateway_invoke_url,
  autoscaling_group_arn,
  autoscaling_group_name,
  availability_zones,
  cloudfront_distribution_arn,
  cloudfront_distribution_id,
  cloudfront_domain_name,
  cloudwatch_log_group_api_gateway,
  cloudwatch_log_group_api_gateway_arn,
  db_subnet_group_name,
  elastic_ip_allocation_ids,
  elastic_ip_public_ips,
  iam_api_gateway_role_arn,
  iam_ec2_instance_profile_arn,
  iam_ec2_role_arn,
  internet_gateway_id,
  launch_template_id,
  launch_template_latest_version,
  nat_gateway_ids,
  private_subnet_ids,
  public_subnet_ids,
  rds_database_name,
  rds_endpoint,
  rds_instance_arn,
  rds_instance_id,
  rds_username,
  s3_bucket_arn,
  s3_bucket_domain_name,
  s3_bucket_name,
  secrets_manager_secret_arn,
  secrets_manager_secret_id,
  security_group_alb_id,
  security_group_ec2_id,
  security_group_rds_id,
  target_group_arn,
  vpc_cidr,
  vpc_id
} = terraformOutput;

// Parse JSON arrays
const azs = parseJsonArray(availability_zones);
const natGws = parseJsonArray(nat_gateway_ids);
const publicSubnets = parseJsonArray(public_subnet_ids);
const privateSubnets = parseJsonArray(private_subnet_ids);
const eipAllocations = parseJsonArray(elastic_ip_allocation_ids);
const eipPublicIps = parseJsonArray(elastic_ip_public_ips);

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
  }); 
  // API Gateway
  describe('API Gateway', () => {
    test('Invoke URL reachable', async () => {
      const res = await fetch(api_gateway_invoke_url, { signal: AbortSignal.timeout(8000) });
      expect([200, 403, 404]).toContain(res.status);
    }, 20000);

    test('Execution ARN & ID valid', () => {
      expect(api_gateway_execution_arn).toContain(':execute-api:');
      expect(api_gateway_id).toMatch(/^[a-z0-9]+$/);
    });
  });

  // CloudFront
  describe('CloudFront', () => {
    test('CloudFront distribution domain resolves', async () => {
      const addrs = await dns.lookup(cloudfront_domain_name);
      expect(addrs.address).toBeDefined();
    });

    test('CloudFront distribution outputs valid', () => {
      expect(cloudfront_distribution_arn).toContain('distribution');
      expect(cloudfront_distribution_id).toMatch(/^E[A-Z0-9]+/);
    });
  });

  // RDS
  describe('RDS Database', () => {
    test('RDS endpoint valid', () => {
      expect(rds_endpoint).toMatch(/rds\.amazonaws\.com/);
      expect(rds_username).toBeDefined();
      expect(rds_database_name).toBeDefined();
    });

    test('RDS identifiers valid', () => {
      expect(rds_instance_arn).toContain(':db:');
      expect(rds_instance_id).toContain('db-');
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
    });

    test('Internet Gateway & NAT GWs valid', () => {
      expect(internet_gateway_id).toMatch(/^igw-/);
      expect(natGws.length).toBeGreaterThan(0);
    });

    test('Elastic IPs allocated', () => {
      expect(eipAllocations.length).toBeGreaterThan(0);
      expect(eipPublicIps.length).toBeGreaterThan(0);
    });

    test('AZs present', () => {
      expect(azs.length).toBeGreaterThan(0);
    });
  });

  // Security
  describe('Security & IAM', () => {
    test('Security groups valid', () => {
      expect(security_group_alb_id).toMatch(/^sg-/);
      expect(security_group_ec2_id).toMatch(/^sg-/);
      expect(security_group_rds_id).toMatch(/^sg-/);
    });

    test('IAM roles valid', () => {
      expect(iam_ec2_role_arn).toContain(':role/');
      expect(iam_api_gateway_role_arn).toContain(':role/');
    });

    test('Instance profile valid', () => {
      expect(iam_ec2_instance_profile_arn).toContain(':instance-profile/');
    });
  });

  // EC2 & AutoScaling
  describe('EC2 & AutoScaling', () => {
    test('AMI outputs valid', () => {
      expect(ami_id).toMatch(/^ami-/);
      expect(ami_name).toContain('amzn2-ami');
    });

    test('Launch template valid', () => {
      expect(launch_template_id).toMatch(/^lt-/);
      expect(Number(launch_template_latest_version)).toBeGreaterThan(0);
    });

    test('ASG outputs valid', () => {
      expect(autoscaling_group_arn).toContain('autoScalingGroup');
      expect(autoscaling_group_name).toContain('asg');
    });
  });

  // S3
  describe('S3 Buckets', () => {
    test('Bucket outputs valid', () => {
      expect(s3_bucket_arn).toContain(':s3:::');
      expect(s3_bucket_name).toContain('tap');
      expect(s3_bucket_domain_name).toContain('.s3.amazonaws.com');
    });
  });

  // Secrets Manager
  describe('Secrets Manager', () => {
    test('Secret ARNs valid', () => {
      expect(secrets_manager_secret_arn).toContain(':secret:');
      expect(secrets_manager_secret_id).toContain(':secret:');
    });
  });

  // ACM
  describe('ACM Certificate', () => {
    test('Certificate outputs valid', () => {
      expect(acm_certificate_arn).toContain(':certificate/');
      expect(acm_certificate_domain).toContain('.');
    });
  });

  // Target Group
  describe('Target Group', () => {
    test('Target group ARN valid', () => {
      expect(target_group_arn).toContain('targetgroup');
    });
  });

  // CloudWatch
  describe('CloudWatch', () => {
    test('Log groups valid', () => {
      expect(cloudwatch_log_group_api_gateway).toContain('/aws/apigateway');
      expect(cloudwatch_log_group_api_gateway_arn).toContain(':log-group:');
    });
  });

  // DB Subnet Group
  describe('DB Subnet Group', () => {
    test('DB subnet group valid', () => {
      expect(db_subnet_group_name).toContain('db-subnet-group');
    });
  });
});

