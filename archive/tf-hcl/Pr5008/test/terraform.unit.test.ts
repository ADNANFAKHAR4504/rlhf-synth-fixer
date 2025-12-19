// Terraform Unit Tests for tap_stack.tf
// Validates infrastructure configuration without deployment

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Configuration", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(100);
    });
  });

  describe("Provider Configuration", () => {
    test("provider block is NOT in tap_stack.tf (should be in provider.tf)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("terraform block is NOT in tap_stack.tf (should be in provider.tf)", () => {
      expect(stackContent).not.toMatch(/\bterraform\s*{/);
    });

    test("provider.tf contains AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf contains random provider in required_providers", () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable with default us-west-2", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("declares project variable", () => {
      expect(stackContent).toMatch(/variable\s+"project"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares owner variable", () => {
      expect(stackContent).toMatch(/variable\s+"owner"\s*{/);
    });

    test("declares instance_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
    });

    test("declares db_username variable", () => {
      expect(stackContent).toMatch(/variable\s+"db_username"\s*{/);
    });

    test("does NOT declare db_password variable (using Secrets Manager)", () => {
      expect(stackContent).not.toMatch(/variable\s+"db_password"\s*{/);
    });

    test("declares autoscaling_min_size variable", () => {
      expect(stackContent).toMatch(/variable\s+"autoscaling_min_size"\s*{/);
    });

    test("declares autoscaling_max_size variable", () => {
      expect(stackContent).toMatch(/variable\s+"autoscaling_max_size"\s*{/);
    });

    test("declares s3_bucket_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"s3_bucket_name"\s*{/);
    });
  });

  describe("VPC and Networking Resources", () => {
    test("creates VPC with CIDR 10.0.0.0/16", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS support and hostnames on VPC", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates public subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets (count = 2 for Multi-AZ)", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("creates public route table with IGW route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates route table association for public subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("creates DB subnet group with private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe("Security Groups", () => {
    test("creates web security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    });

    test("web security group allows HTTP (port 80)", () => {
      const webSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"web"[\s\S]*?(?=resource\s+"aws_security_group"|resource\s+"aws_iam)/);
      expect(webSgMatch).toBeTruthy();
      expect(webSgMatch![0]).toMatch(/from_port\s*=\s*80/);
      expect(webSgMatch![0]).toMatch(/to_port\s*=\s*80/);
    });

    test("web security group allows HTTPS (port 443)", () => {
      const webSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"web"[\s\S]*?(?=resource\s+"aws_security_group"|resource\s+"aws_iam)/);
      expect(webSgMatch).toBeTruthy();
      expect(webSgMatch![0]).toMatch(/from_port\s*=\s*443/);
      expect(webSgMatch![0]).toMatch(/to_port\s*=\s*443/);
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("RDS security group only allows MySQL (3306) from web SG", () => {
      const rdsSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?(?=resource\s+"aws_iam"|^resource\s+"aws_\w+"\s+"(?!rds))/m);
      expect(rdsSgMatch).toBeTruthy();
      expect(rdsSgMatch![0]).toMatch(/from_port\s*=\s*3306/);
      expect(rdsSgMatch![0]).toMatch(/to_port\s*=\s*3306/);
      expect(rdsSgMatch![0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.web\.id\]/);
    });

    test("creates ALB security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test("EC2 role has assume role policy for EC2 service", () => {
      expect(stackContent).toMatch(/Service.*=.*"ec2\.amazonaws\.com"/);
    });

    test("attaches SSM managed policy for Session Manager", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/);
      expect(stackContent).toMatch(/AmazonSSMManagedInstanceCore/);
    });

    test("creates CloudWatch Logs policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates S3 read policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_read"/);
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:ListBucket/);
    });

    test("creates Secrets Manager read policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_secrets_read"/);
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
    });

    test("creates IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });
  });

  describe("KMS Encryption", () => {
    test("creates KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("KMS key has rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*\d+/);
    });

    test("creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });
  });

  describe("Secrets Manager for RDS Password", () => {
    test("generates random password", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
    });

    test("random password has sufficient length (>= 16)", () => {
      const passwordMatch = stackContent.match(/resource\s+"random_password"\s+"db_password"[\s\S]*?length\s*=\s*(\d+)/);
      expect(passwordMatch).toBeTruthy();
      const length = parseInt(passwordMatch![1]);
      expect(length).toBeGreaterThanOrEqual(16);
    });

    test("creates Secrets Manager secret", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
    });

    test("secret is encrypted with KMS", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("creates secret version with credentials", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/);
    });

    test("secret contains username, password, and connection details", () => {
      const secretMatch = stackContent.match(/resource\s+"aws_secretsmanager_secret_version"[\s\S]*?secret_string\s*=\s*jsonencode\(([\s\S]*?)\)/);
      expect(secretMatch).toBeTruthy();
      expect(secretMatch![0]).toMatch(/username/);
      expect(secretMatch![0]).toMatch(/password/);
      expect(secretMatch![0]).toMatch(/engine/);
    });
  });

  describe("RDS Database", () => {
    test("creates RDS MySQL instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("RDS is Multi-AZ", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS storage is encrypted", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS uses KMS key for encryption", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=^resource\s+"\w+)/m);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS is NOT publicly accessible", () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has automated backups enabled (retention >= 7 days)", () => {
      const rdsMatch = stackContent.match(/backup_retention_period\s*=\s*(\d+)/);
      expect(rdsMatch).toBeTruthy();
      const retention = parseInt(rdsMatch![1]);
      expect(retention).toBeGreaterThanOrEqual(7);
    });

    test("RDS password uses random_password resource (not hardcoded)", () => {
      const rdsMatch = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?password\s*=\s*([^\s]+)/);
      expect(rdsMatch).toBeTruthy();
      expect(rdsMatch![1]).toMatch(/random_password\.db_password\.result/);
    });

    test("RDS skip_final_snapshot is true (for QA cleanup)", () => {
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS deletion_protection is false (for QA cleanup)", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("RDS CloudWatch logs are enabled", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
    });
  });

  describe("EC2 Auto Scaling", () => {
    test("creates launch template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"web"/);
    });

    test("launch template uses latest Amazon Linux 2 AMI", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test("launch template has IAM instance profile", () => {
      const ltMatch = stackContent.match(/resource\s+"aws_launch_template"\s+"web"[\s\S]*?(?=^resource\s+"\w+)/m);
      expect(ltMatch).toBeTruthy();
      expect(ltMatch![0]).toMatch(/iam_instance_profile/);
    });

    test("creates Auto Scaling Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"/);
    });

    test("ASG has target_group_arns for ALB integration", () => {
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.web\.arn\]/);
    });

    test("ASG health check type is ELB", () => {
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("creates scale out policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_out"/);
    });

    test("creates scale in policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_in"/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"web"/);
    });

    test("ALB is application type", () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB is internet-facing", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB deletion protection is disabled (for QA cleanup)", () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("creates target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"web"/);
    });

    test("target group has health check configured", () => {
      const tgMatch = stackContent.match(/resource\s+"aws_lb_target_group"\s+"web"[\s\S]*?health_check\s*{[\s\S]*?}/);
      expect(tgMatch).toBeTruthy();
      expect(tgMatch![0]).toMatch(/enabled\s*=\s*true/);
    });

    test("creates ALB listener on port 80", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web"/);
      expect(stackContent).toMatch(/port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates EC2 log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ec2"/);
    });

    test("creates RDS log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds"/);
    });

    test("log groups have retention period set", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });

    test("log groups are encrypted with KMS", () => {
      const logGroupMatches = stackContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/g);
      expect(logGroupMatches).toBeTruthy();
      expect(logGroupMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("creates high CPU alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    });

    test("creates low CPU alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
    });

    test("creates RDS storage alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
    });

    test("creates SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("SNS topic is encrypted with KMS", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });
  });

  describe("S3 Bucket", () => {
    test("creates S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cf_templates"/);
    });

    test("enables bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cf_templates"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures server-side encryption with KMS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cf_templates"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks all public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cf_templates"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("Resource Tagging", () => {
    test("defines common_tags local variable", () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*?common_tags\s*=/);
    });

    test("common_tags includes required tags", () => {
      const localsMatch = stackContent.match(/locals\s*{([\s\S]*?)}/);
      expect(localsMatch).toBeTruthy();
      expect(localsMatch![0]).toMatch(/Project/);
      expect(localsMatch![0]).toMatch(/Environment/);
      expect(localsMatch![0]).toMatch(/Owner/);
      expect(localsMatch![0]).toMatch(/CostCenter/);
    });

    test("resources use merge() for tagging", () => {
      const mergeMatches = stackContent.match(/merge\(local\.common_tags/g);
      expect(mergeMatches).toBeTruthy();
      expect(mergeMatches!.length).toBeGreaterThan(10);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("outputs public subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
    });

    test("outputs private subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test("outputs ASG name", () => {
      expect(stackContent).toMatch(/output\s+"ec2_asg_name"\s*{/);
    });

    test("outputs ALB DNS name", () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    });

    test("outputs RDS endpoint (marked sensitive)", () => {
      const rdsOutputMatch = stackContent.match(/output\s+"rds_endpoint"\s*{[\s\S]*?}/);
      expect(rdsOutputMatch).toBeTruthy();
      expect(rdsOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("outputs S3 bucket name", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
    });

    test("outputs SNS topic ARN", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("outputs KMS key ID and ARN", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test("outputs Secrets Manager secret ARN", () => {
      expect(stackContent).toMatch(/output\s+"db_secret_arn"\s*{/);
    });

    test("outputs CloudWatch log groups", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_ec2"\s*{/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_rds"\s*{/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded passwords in configuration", () => {
      // Should not find direct password values
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]*[A-Za-z0-9!@#$%^&*]{8,}"/);
    });

    test("no Retain policies (for QA cleanup)", () => {
      expect(stackContent.toLowerCase()).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(stackContent.toLowerCase()).not.toMatch(/lifecycle.*retain/);
    });

    test("uses data source for AMI (not hardcoded)", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"/);
    });

    test("all sensitive outputs are marked as sensitive", () => {
      // RDS endpoint should be sensitive
      const rdsOutput = stackContent.match(/output\s+"rds_endpoint"[\s\S]*?}/);
      expect(rdsOutput).toBeTruthy();
      expect(rdsOutput![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Data Sources", () => {
    test("uses aws_caller_identity for account ID", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses aws_availability_zones for AZ discovery", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("uses aws_ami for latest Amazon Linux 2", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
    });
  });
});
