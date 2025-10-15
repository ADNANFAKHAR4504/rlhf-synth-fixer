// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let content: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      throw new Error(`Stack file not found at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  describe("File and Basic Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(content.length).toBeGreaterThan(1000);
    });

    test("contains terraform configuration block", () => {
      expect(content).toMatch(/terraform\s*\{/);
      expect(content).toMatch(/required_version/);
      expect(content).toMatch(/required_providers/);
    });

    test("declares provider in tap_stack.tf with us-west-2 region", () => {
      expect(content).toMatch(/provider\s+"aws"\s*\{/);
      expect(content).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("has default tags in provider", () => {
      expect(content).toMatch(/default_tags/);
      expect(content).toMatch(/Project\s*=\s*"SecureApp"/);
      expect(content).toMatch(/Environment\s*=\s*"Production"/);
    });
  });

  describe("KMS Encryption", () => {
    test("creates KMS key", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("enables key rotation", () => {
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS alias", () => {
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("KMS key has policy", () => {
      expect(content).toMatch(/policy\s*=\s*jsonencode/);
    });
  });

  describe("VPC and Networking", () => {
    test("creates VPC with correct CIDR", () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS support and hostnames", () => {
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates VPC flow logs", () => {
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test("creates public subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("creates database subnets", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test("creates Internet Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates NAT Gateway with EIP", () => {
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("creates route tables", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("creates Network ACL", () => {
      expect(content).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test("creates EC2 security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test("creates RDS security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("security groups have lifecycle rules", () => {
      expect(content).toMatch(/lifecycle\s*\{/);
      expect(content).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  describe("S3 Storage", () => {
    test("creates S3 bucket for logs", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    });

    test("enables versioning", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
    });

    test("configures encryption with KMS", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks all public access", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("has lifecycle configuration", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"/);
    });

    test("has bucket policy", () => {
      expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
    });
  });

  describe("CloudTrail", () => {
    test("creates CloudTrail", () => {
      expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("enables log file validation", () => {
      expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("is multi-region trail", () => {
      expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("uses KMS encryption", () => {
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates EC2 IAM role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test("creates EC2 instance profile", () => {
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test("creates flow log IAM role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"flow_log"/);
    });

    test("creates Config IAM role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
    });

    test("EC2 role has SSM policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_ssm"/);
    });

    test("EC2 role has Secrets Manager policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_secrets"/);
    });

    test("EC2 role has CloudWatch policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch"/);
    });
  });

  describe("RDS Database", () => {
    test("creates RDS instance", () => {
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test("creates DB subnet group", () => {
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("creates DB parameter group", () => {
      expect(content).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
    });

    test("enables storage encryption", () => {
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("not publicly accessible", () => {
      expect(content).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("enables multi-AZ", () => {
      expect(content).toMatch(/multi_az\s*=\s*true/);
    });

    test("enables Performance Insights", () => {
      expect(content).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test("requires secure transport", () => {
      expect(content).toMatch(/require_secure_transport/);
    });
  });

  describe("Secrets Manager", () => {
    test("creates secret for RDS password", () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password"/);
    });

    test("creates secret version", () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password"/);
    });

    test("secret uses KMS encryption", () => {
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.id/);
    });
  });

  describe("ACM Certificate", () => {
    test("creates ACM certificate", () => {
      expect(content).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
    });

    test("uses DNS validation", () => {
      expect(content).toMatch(/validation_method\s*=\s*"DNS"/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB", () => {
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("creates target group", () => {
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });

    test("creates HTTPS listener", () => {
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    });

    test("creates HTTP listener with redirect", () => {
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(content).toMatch(/type\s*=\s*"redirect"/);
    });

    test("enables deletion protection", () => {
      expect(content).toMatch(/enable_deletion_protection\s*=\s*true/);
    });
  });

  describe("Auto Scaling", () => {
    test("creates launch template", () => {
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });

    test("creates Auto Scaling Group", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test("launch template has encrypted EBS", () => {
      expect(content).toMatch(/encrypted\s*=\s*true/);
    });

    test("enforces IMDSv2", () => {
      expect(content).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test("creates scaling policies", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates CloudWatch log groups", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test("creates CPU alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
    });

    test("creates RDS CPU alarm", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    });

    test("creates root account alarm", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"/);
    });
  });

  describe("WAF Configuration", () => {
    test("creates WAF Web ACL", () => {
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test("has rate limiting rule", () => {
      expect(content).toMatch(/rate_based_statement/);
    });

    test("uses AWS managed rules", () => {
      expect(content).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(content).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test("associates WAF with ALB", () => {
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
    });
  });

  describe("CloudFront Distribution", () => {
    test("creates CloudFront distribution", () => {
      expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test("creates Origin Access Identity", () => {
      expect(content).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"\s+"main"/);
    });

    test("enforces HTTPS", () => {
      expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("uses TLS 1.2+", () => {
      expect(content).toMatch(/TLSv1\.2/);
    });
  });

  describe("SNS Notifications", () => {
    test("creates SNS topic", () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("SNS uses KMS encryption", () => {
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
    });

    test("creates SNS subscription", () => {
      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alert_email"/);
    });
  });

  describe("AWS Config", () => {
    test("creates Config recorder", () => {
      expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test("creates Config delivery channel", () => {
      expect(content).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("has S3 encryption rule", () => {
      expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"/);
    });

    test("has RDS encryption rule", () => {
      expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encryption_enabled"/);
    });

    test("has MFA rule", () => {
      expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"mfa_enabled_for_iam_console_access"/);
    });
  });

  describe("Systems Manager", () => {
    test("creates SSM document", () => {
      expect(content).toMatch(/resource\s+"aws_ssm_document"\s+"session_manager_prefs"/);
    });

    test("SSM sessions are encrypted", () => {
      expect(content).toMatch(/s3EncryptionEnabled/);
      expect(content).toMatch(/cloudWatchEncryptionEnabled/);
    });
  });

  describe("MFA Policy", () => {
    test("creates MFA enforcement policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"enforce_mfa"/);
    });
  });

  describe("Outputs", () => {
    test("exports VPC ID", () => {
      expect(content).toMatch(/output\s+"vpc_id"/);
    });

    test("exports ALB DNS name", () => {
      expect(content).toMatch(/output\s+"alb_dns_name"/);
    });

    test("exports CloudFront domain", () => {
      expect(content).toMatch(/output\s+"cloudfront_distribution_domain"/);
    });

    test("exports RDS endpoint as sensitive", () => {
      expect(content).toMatch(/output\s+"rds_endpoint"/);
      expect(content).toMatch(/sensitive\s*=\s*true/);
    });

    test("exports S3 logs bucket", () => {
      expect(content).toMatch(/output\s+"s3_logs_bucket"/);
    });
  });

  describe("Security Best Practices", () => {
    test("uses encryption at rest", () => {
      const matches = content.match(/encrypted\s*=\s*true/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test("uses KMS for encryption", () => {
      const matches = content.match(/kms_key_id|kms_master_key_id/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(3);
    });

    test("enforces HTTPS/TLS", () => {
      expect(content).toMatch(/https/i);
      expect(content).toMatch(/require_secure_transport/);
    });

    test("no hardcoded credentials", () => {
      expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(content).not.toMatch(/aws_access_key_id/);
      expect(content).not.toMatch(/aws_secret_access_key/);
    });
  });
});
