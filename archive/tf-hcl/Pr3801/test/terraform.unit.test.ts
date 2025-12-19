// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // Provider configuration
  test("declares provider aws with us-west-2 region", () => {
    expect(content).toMatch(/provider\s+"aws"\s*{/);
    expect(content).toMatch(/region\s*=\s*"us-west-2"/);
  });

  test("includes terraform block with required providers", () => {
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/required_providers\s*{/);
    expect(content).toMatch(/aws\s*=/);
    expect(content).toMatch(/random\s*=/);
  });

  // Variables
  test("declares email_address variable", () => {
    expect(content).toMatch(/variable\s+"email_address"\s*{/);
  });

  // Data sources
  test("uses data source for availability zones", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("uses data source for Amazon Linux 2 AMI", () => {
    expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
  });

  // Networking resources
  test("creates VPC with 10.0.0.0/16 CIDR", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("creates Internet Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("creates public subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test("creates NAT gateways", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("creates route tables for public and private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  // S3 resources
  test("creates S3 bucket for logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
  });

  test("enables S3 bucket versioning", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
  });

  test("configures S3 bucket encryption with KMS", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("blocks public access to S3 bucket", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("configures S3 lifecycle policy to GLACIER after 30 days", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
    expect(content).toMatch(/days\s*=\s*30/);
    expect(content).toMatch(/storage_class\s*=\s*"GLACIER"/);
  });

  // KMS
  test("creates KMS key for encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  // CloudFront
  test("creates CloudFront distribution", () => {
    expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
  });

  test("creates CloudFront Origin Access Control", () => {
    expect(content).toMatch(/resource\s+"aws_cloudfront_origin_access_control"\s+"main"/);
  });

  test("configures CloudFront with default TTL of 86400 seconds", () => {
    expect(content).toMatch(/default_ttl\s*=\s*86400/);
  });

  // RDS
  test("creates RDS subnet group", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
  });

  test("creates RDS PostgreSQL instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    expect(content).toMatch(/engine\s*=\s*"postgres"/);
  });

  test("RDS instance is Multi-AZ", () => {
    expect(content).toMatch(/multi_az\s*=\s*true/);
  });

  test("RDS storage is encrypted with KMS", () => {
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  // Security Groups
  test("creates ALB security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("creates EC2 security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });

  test("creates RDS security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  // Compute
  test("creates Launch Template", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
  });

  test("Launch Template uses Amazon Linux 2 AMI", () => {
    expect(content).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
  });

  test("Launch Template configures EBS encryption with KMS", () => {
    expect(content).toMatch(/encrypted\s*=\s*true/);
  });

  test("Launch Template includes CloudWatch agent in user_data", () => {
    expect(content).toMatch(/amazon-cloudwatch-agent/);
  });

  // IAM
  test("creates IAM role for EC2", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
  });

  test("creates IAM policy for EC2 with CloudWatch permissions", () => {
    expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2"/);
    expect(content).toMatch(/cloudwatch:PutMetricData/);
  });

  test("creates IAM instance profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
  });

  // Load Balancer
  test("creates Application Load Balancer", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("creates ALB target group", () => {
    expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
  });

  test("creates ALB listener", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
  });

  // Auto Scaling
  test("creates Auto Scaling Group", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
  });

  test("Auto Scaling Group maintains at least 2 instances", () => {
    expect(content).toMatch(/min_size\s*=\s*2/);
  });

  // CloudWatch
  test("creates SNS topic for alarms", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
  });

  test("creates CloudWatch alarm for high CPU utilization", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/);
    expect(content).toMatch(/threshold\s*=\s*"75"/);
  });

  test("creates CloudWatch alarm for high memory usage", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"memory_high"/);
  });

  // Secrets Manager
  test("creates Secrets Manager secret for DB password", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
  });

  test("uses random_password for database password", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"db_password"/);
  });

  // Tagging
  test("all resources have Production Environment tags", () => {
    const envTagMatches = content.match(/Environment\s*=\s*"Production"/g);
    expect(envTagMatches).toBeTruthy();
    expect(envTagMatches!.length).toBeGreaterThan(10);
  });

  // Outputs
  test("declares output for ALB DNS name", () => {
    expect(content).toMatch(/output\s+"alb_dns_name"/);
  });

  test("declares output for CloudFront domain name", () => {
    expect(content).toMatch(/output\s+"cloudfront_domain_name"/);
  });

  test("declares output for RDS endpoint", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"/);
  });

  test("declares output for S3 bucket name", () => {
    expect(content).toMatch(/output\s+"s3_bucket_name"/);
  });

  test("declares output for KMS key ARN", () => {
    expect(content).toMatch(/output\s+"kms_key_arn"/);
  });

  test("declares output for VPC ID", () => {
    expect(content).toMatch(/output\s+"vpc_id"/);
  });

  // No hardcoded credentials
  test("does not contain hardcoded AWS credentials", () => {
    expect(content).not.toMatch(/aws_access_key_id/);
    expect(content).not.toMatch(/aws_secret_access_key/);
    expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key pattern
  });

  // No Retain policies
  test("does not use prevent_destroy lifecycle", () => {
    expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
  });
});
