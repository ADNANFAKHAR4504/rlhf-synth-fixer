// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates the presence and configuration of all security and infrastructure resources

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure - File Structure", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("tap_stack.tf does NOT declare provider (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("provider.tf contains AWS provider configuration", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });
});

describe("Terraform Variables", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
  });

  test("declares owner_email variable", () => {
    expect(stackContent).toMatch(/variable\s+"owner_email"\s*{/);
  });

  test("declares allowed_ip_ranges variable", () => {
    expect(stackContent).toMatch(/variable\s+"allowed_ip_ranges"\s*{/);
  });

  test("declares alarm_email variable", () => {
    expect(stackContent).toMatch(/variable\s+"alarm_email"\s*{/);
  });
});

describe("Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("declares aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    expect(stackContent).toMatch(/state\s*=\s*"available"/);
  });
});

describe("KMS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares KMS key with rotation enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"master_key"\s*{/);
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("KMS key has deletion window configured", () => {
    expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*\d+/);
  });

  test("declares KMS key alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"master_key_alias"\s*{/);
    expect(stackContent).toMatch(/alias\/financial-app-master-key/);
  });

  test("KMS key policy allows required services", () => {
    expect(stackContent).toMatch(/s3\.amazonaws\.com/);
    expect(stackContent).toMatch(/logs\.amazonaws\.com/);
    expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
    expect(stackContent).toMatch(/config\.amazonaws\.com/);
  });
});

describe("VPC and Networking Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares VPC with DNS support", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("VPC has appropriate CIDR block", () => {
    expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("declares Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("declares public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*2/);
  });

  test("declares private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
  });

  test("public subnets do not auto-assign public IPs", () => {
    const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
    if (publicSubnetMatch) {
      expect(publicSubnetMatch[0]).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    }
  });

  test("declares Elastic IPs for NAT Gateways", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("declares NAT Gateways", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
  });

  test("declares route tables for public and private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });

  test("declares route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
  });

  test("declares VPC Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
    expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
  });
});

describe("Security Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ALB security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    expect(stackContent).toMatch(/financial-app-alb-sg/);
  });

  test("ALB security group allows HTTPS only", () => {
    const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource\s+"aws_security_group")/);
    if (albSgMatch) {
      expect(albSgMatch[0]).toMatch(/from_port\s*=\s*443/);
      expect(albSgMatch[0]).toMatch(/to_port\s*=\s*443/);
    }
  });

  test("declares application security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
    expect(stackContent).toMatch(/financial-app-instance-sg/);
  });

  test("declares database security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
    expect(stackContent).toMatch(/financial-app-database-sg/);
  });

  test("database security group allows PostgreSQL port 5432", () => {
    const dbSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"database"\s*{[\s\S]*?(?=resource\s+"aws_iam_role")/);
    if (dbSgMatch) {
      expect(dbSgMatch[0]).toMatch(/from_port\s*=\s*5432/);
      expect(dbSgMatch[0]).toMatch(/to_port\s*=\s*5432/);
    }
  });
});

describe("IAM Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares IAM role for application instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"app_instance"\s*{/);
    expect(stackContent).toMatch(/financial-app-instance-role/);
  });

  test("declares IAM role policy for application instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"app_instance"\s*{/);
  });

  test("application role policy includes KMS permissions", () => {
    expect(stackContent).toMatch(/kms:Decrypt/);
    expect(stackContent).toMatch(/kms:DescribeKey/);
  });

  test("declares IAM instance profile", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"app_instance"\s*{/);
  });

  test("declares IAM role for VPC Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_log"\s*{/);
  });

  test("declares IAM role for AWS Config", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"\s*{/);
  });

  test("declares IAM user for deployment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_user"\s+"app_deploy"\s*{/);
    expect(stackContent).toMatch(/financial-app-deploy/);
  });

  test("declares MFA enforcement policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"enforce_mfa"\s*{/);
    expect(stackContent).toMatch(/financial-app-enforce-mfa/);
  });

  test("MFA policy denies actions without MFA", () => {
    expect(stackContent).toMatch(/DenyAllExceptListedIfNoMFA/);
    expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
  });
});

describe("S3 Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares S3 bucket for application data", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"\s*{/);
    expect(stackContent).toMatch(/financial-app-data/);
  });

  test("app data bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"app_data"\s*{/);
    expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("app data bucket has server-side encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_data"\s*{/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("app data bucket blocks all public access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_data"\s*{/);
    const appDataBlockMatch = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_data"\s*{[\s\S]*?^}/m);
    if (appDataBlockMatch) {
      expect(appDataBlockMatch[0]).toMatch(/block_public_acls\s*=\s*true/);
      expect(appDataBlockMatch[0]).toMatch(/block_public_policy\s*=\s*true/);
      expect(appDataBlockMatch[0]).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(appDataBlockMatch[0]).toMatch(/restrict_public_buckets\s*=\s*true/);
    }
  });

  test("app data bucket policy enforces encryption", () => {
    expect(stackContent).toMatch(/DenyUnencryptedObjectUploads/);
    expect(stackContent).toMatch(/DenyInsecureConnections/);
  });

  test("declares S3 bucket for logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
    expect(stackContent).toMatch(/financial-app-logs/);
  });

  test("logs bucket has versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"\s*{/);
  });

  test("logs bucket has lifecycle policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"\s*{/);
    expect(stackContent).toMatch(/STANDARD_IA/);
    expect(stackContent).toMatch(/GLACIER/);
  });

  test("logs bucket policy allows CloudTrail access", () => {
    expect(stackContent).toMatch(/AWSCloudTrailAclCheck/);
    expect(stackContent).toMatch(/AWSCloudTrailWrite/);
  });

  test("logs bucket policy allows Config access", () => {
    expect(stackContent).toMatch(/AWSConfigBucketPermissionsCheck/);
    expect(stackContent).toMatch(/AWSConfigBucketWrite/);
  });
});

describe("CloudTrail Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CloudTrail", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
    expect(stackContent).toMatch(/financial-app-trail/);
  });

  test("CloudTrail is multi-region", () => {
    expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("CloudTrail has log file validation enabled", () => {
    expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("CloudTrail includes global service events", () => {
    expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
  });

  test("CloudTrail has event selectors for S3", () => {
    expect(stackContent).toMatch(/event_selector\s*{/);
    expect(stackContent).toMatch(/AWS::S3::Object/);
  });
});

describe("AWS Config Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares Config recorder", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
    expect(stackContent).toMatch(/financial-app-recorder/);
  });

  test("Config recorder includes all supported resources", () => {
    expect(stackContent).toMatch(/all_supported\s*=\s*true/);
    expect(stackContent).toMatch(/include_global_resource_types\s*=\s*true/);
  });

  test("declares Config delivery channel", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*{/);
  });

  test("Config delivery channel has snapshot frequency", () => {
    expect(stackContent).toMatch(/delivery_frequency\s*=\s*"TwentyFour_Hours"/);
  });

  test("declares Config recorder status", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"\s*{/);
    expect(stackContent).toMatch(/is_enabled\s*=\s*true/);
  });

  test("declares Config rule for S3 public read prohibition", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"\s*{/);
    expect(stackContent).toMatch(/S3_BUCKET_PUBLIC_READ_PROHIBITED/);
  });

  test("declares Config rule for encrypted volumes", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"\s*{/);
    expect(stackContent).toMatch(/ENCRYPTED_VOLUMES/);
  });

  test("declares Config rule for IAM password policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"\s*{/);
    expect(stackContent).toMatch(/IAM_PASSWORD_POLICY/);
  });

  test("IAM password policy has strong requirements", () => {
    const passwordPolicyMatch = stackContent.match(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"\s*{[\s\S]*?^}/m);
    if (passwordPolicyMatch) {
      expect(passwordPolicyMatch[0]).toMatch(/RequireUppercaseCharacters/);
      expect(passwordPolicyMatch[0]).toMatch(/RequireLowercaseCharacters/);
      expect(passwordPolicyMatch[0]).toMatch(/RequireNumbers/);
      expect(passwordPolicyMatch[0]).toMatch(/RequireSymbols/);
      expect(passwordPolicyMatch[0]).toMatch(/MinimumPasswordLength/);
    }
  });
});

describe("CloudWatch Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares SNS topic for security alerts", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{/);
    expect(stackContent).toMatch(/financial-app-security-alerts/);
  });

  test("SNS topic is encrypted with KMS", () => {
    const snsMatch = stackContent.match(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{[\s\S]*?^}/m);
    if (snsMatch) {
      expect(snsMatch[0]).toMatch(/kms_master_key_id/);
    }
  });

  test("declares SNS topic subscription", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"security_alerts_email"\s*{/);
    expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
  });

  test("declares CloudWatch log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"\s*{/);
    expect(stackContent).toMatch(/\/aws\/financial-app\/application/);
  });

  test("CloudWatch log group has retention policy", () => {
    expect(stackContent).toMatch(/retention_in_days\s*=\s*90/);
  });

  test("declares metric filter for unauthorized API calls", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"\s*{/);
    expect(stackContent).toMatch(/UnauthorizedAPICalls/);
  });

  test("declares alarm for unauthorized API calls", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"\s*{/);
  });

  test("declares metric filter for failed logins", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"failed_logins"\s*{/);
    expect(stackContent).toMatch(/FailedConsoleLogins/);
  });

  test("declares alarm for failed logins", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_logins"\s*{/);
  });

  test("declares metric filter for root account usage", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"root_account_usage"\s*{/);
    expect(stackContent).toMatch(/RootAccountUsage/);
  });

  test("declares alarm for root account usage", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"\s*{/);
  });

  test("root account alarm threshold is zero tolerance", () => {
    const rootAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"\s*{[\s\S]*?^}/m);
    if (rootAlarmMatch) {
      expect(rootAlarmMatch[0]).toMatch(/threshold\s*=\s*"?0"?/);
    }
  });
});

describe("Load Balancer Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares Application Load Balancer", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    expect(stackContent).toMatch(/financial-app-alb/);
  });

  test("ALB has HTTP/2 enabled", () => {
    expect(stackContent).toMatch(/enable_http2\s*=\s*true/);
  });

  test("ALB drops invalid headers", () => {
    expect(stackContent).toMatch(/drop_invalid_header_fields\s*=\s*true/);
  });

  test("ALB has access logs enabled", () => {
    expect(stackContent).toMatch(/access_logs\s*{/);
    expect(stackContent).toMatch(/enabled\s*=\s*true/);
  });

  test("ALB deletion protection is properly configured", () => {
    expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
  });
});

describe("WAF Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares WAF Web ACL", () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
    expect(stackContent).toMatch(/financial-app-web-acl/);
  });

  test("WAF includes AWS Managed Core Rule Set", () => {
    expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
  });

  test("WAF includes Known Bad Inputs Rule Set", () => {
    expect(stackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
  });

  test("WAF includes SQL injection protection", () => {
    expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
  });

  test("WAF includes rate limiting rule", () => {
    expect(stackContent).toMatch(/rate_based_statement\s*{/);
    expect(stackContent).toMatch(/limit\s*=/);
  });

  test("declares WAF Web ACL association", () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"\s*{/);
  });
});

describe("RDS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares RDS subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    expect(stackContent).toMatch(/financial-app-db-subnet-group/);
  });

  test("declares RDS database instance", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
    expect(stackContent).toMatch(/financial-app-db/);
  });

  test("RDS uses PostgreSQL engine", () => {
    expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
  });

  test("RDS has storage encryption enabled", () => {
    expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS has backup retention configured", () => {
    expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
  });

  test("RDS has CloudWatch logs exports enabled", () => {
    expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql"\]/);
  });

  test("RDS deletion protection is properly configured", () => {
    expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("declares random password for database", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
  });

  test("random password has sufficient length", () => {
    expect(stackContent).toMatch(/length\s*=\s*(3[2-9]|[4-9]\d|\d{3,})/);
  });

  test("declares Secrets Manager secret for database password", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
    expect(stackContent).toMatch(/financial-app-db-password/);
  });

  test("declares Secrets Manager secret version", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"\s*{/);
  });
});

describe("EC2 Launch Template", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares launch template", () => {
    expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
  });

  test("launch template has IAM instance profile", () => {
    expect(stackContent).toMatch(/iam_instance_profile\s*{/);
  });

  test("launch template has encrypted EBS volumes", () => {
    const launchTemplateMatch = stackContent.match(/resource\s+"aws_launch_template"\s+"app"\s*{[\s\S]*?(?=^resource\s+|^output\s+)/m);
    if (launchTemplateMatch) {
      expect(launchTemplateMatch[0]).toMatch(/encrypted\s*=\s*true/);
    }
  });

  test("launch template requires IMDSv2", () => {
    expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
  });

  test("launch template has monitoring enabled", () => {
    expect(stackContent).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("launch template includes security hardening user data", () => {
    const launchTemplateMatch = stackContent.match(/resource\s+"aws_launch_template"\s+"app"\s*{[\s\S]*?(?=^resource\s+|^output\s+)/m);
    if (launchTemplateMatch) {
      expect(launchTemplateMatch[0]).toMatch(/user_data/);
      expect(launchTemplateMatch[0]).toMatch(/fail2ban/);
    }
  });
});

describe("Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("declares vpc_id output", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test("declares alb_dns_name output", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
  });

  test("declares cloudtrail_s3_bucket output", () => {
    expect(stackContent).toMatch(/output\s+"cloudtrail_s3_bucket"\s*{/);
  });

  test("declares kms_key_id output", () => {
    expect(stackContent).toMatch(/output\s+"kms_key_id"\s*{/);
  });
});

describe("Security Best Practices", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("no hardcoded credentials in the file", () => {
    expect(stackContent).not.toMatch(/password\s*=\s*"[^r]/); // Except random_password reference
    expect(stackContent).not.toMatch(/access_key\s*=\s*"/);
    expect(stackContent).not.toMatch(/secret_key\s*=\s*"/);
  });

  test("encryption is used for sensitive data", () => {
    expect(stackContent).toMatch(/kms_key_id|kms_master_key_id/);
    expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("no resources have retain lifecycle policy", () => {
    expect(stackContent).not.toMatch(/prevent_destroy\s*=\s*true/);
  });

  test("secure transport is enforced for S3 buckets", () => {
    expect(stackContent).toMatch(/aws:SecureTransport/);
  });

  test("MFA requirements are enforced", () => {
    expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
  });
});

describe("KMS Key Configuration Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("KMS key has proper description", () => {
    expect(stackContent).toMatch(/description\s*=\s*"Master KMS key for financial application encryption"/);
  });

  test("KMS key deletion window is set to 10 days", () => {
    expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
  });

  test("KMS key policy allows root account permissions", () => {
    expect(stackContent).toMatch(/Enable IAM User Permissions/);
    expect(stackContent).toMatch(/arn:aws:iam::.*:root/);
  });

  test("KMS key policy has service-specific permissions", () => {
    expect(stackContent).toMatch(/Allow services to use the key/);
  });
});

describe("VPC Configuration Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("VPC has proper name tag", () => {
    expect(stackContent).toMatch(/Name\s*=\s*"financial-app-vpc"/);
  });

  test("public subnets use proper CIDR calculation", () => {
    expect(stackContent).toMatch(/cidrsubnet\(aws_vpc\.main\.cidr_block,\s*8,\s*count\.index\)/);
  });

  test("private subnets use offset CIDR calculation", () => {
    expect(stackContent).toMatch(/cidrsubnet\(aws_vpc\.main\.cidr_block,\s*8,\s*count\.index\s*\+\s*10\)/);
  });

  test("subnets are distributed across availability zones", () => {
    expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
  });

  test("Internet Gateway has proper name tag", () => {
    expect(stackContent).toMatch(/Name\s*=\s*"financial-app-igw"/);
  });

  test("public subnets have Type tag", () => {
    const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
    if (publicSubnetMatch) {
      expect(publicSubnetMatch[0]).toMatch(/Type\s*=\s*"Public"/);
    }
  });

  test("private subnets have Type tag", () => {
    const privateSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
    if (privateSubnetMatch) {
      expect(privateSubnetMatch[0]).toMatch(/Type\s*=\s*"Private"/);
    }
  });
});

describe("NAT Gateway Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("NAT Gateway depends on Internet Gateway", () => {
    expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
  });

  test("NAT Gateways are deployed in public subnets", () => {
    expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
  });

  test("each NAT Gateway has unique name tag", () => {
    expect(stackContent).toMatch(/Name\s*=\s*"financial-app-nat-\$\{count\.index \+ 1\}"/);
  });
});

describe("Security Group Rules Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("ALB security group has proper description", () => {
    expect(stackContent).toMatch(/description\s*=\s*"Security group for application load balancer"/);
  });

  test("ALB ingress rule has description", () => {
    const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource\s+"aws_security_group")/);
    if (albSgMatch) {
      expect(albSgMatch[0]).toMatch(/description\s*=\s*"HTTPS from approved IPs"/);
    }
  });

  test("ALB security group uses TCP protocol", () => {
    const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?(?=resource\s+"aws_security_group")/);
    if (albSgMatch) {
      expect(albSgMatch[0]).toMatch(/protocol\s*=\s*"tcp"/);
    }
  });

  test("app security group has proper description", () => {
    expect(stackContent).toMatch(/description\s*=\s*"Security group for application instances"/);
  });

  test("app security group allows traffic only from ALB", () => {
    const appSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"app"\s*{[\s\S]*?(?=resource\s+"aws_security_group")/);
    if (appSgMatch) {
      expect(appSgMatch[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    }
  });

  test("database security group has no outbound traffic", () => {
    const dbSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"database"\s*{[\s\S]*?(?=resource\s+"aws_iam_role")/);
    if (dbSgMatch) {
      expect(dbSgMatch[0]).toMatch(/cidr_blocks\s*=\s*\[\]/);
    }
  });

  test("database security group restricts to application layer", () => {
    const dbSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"database"\s*{[\s\S]*?(?=resource\s+"aws_iam_role")/);
    if (dbSgMatch) {
      expect(dbSgMatch[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    }
  });
});

describe("IAM Role Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("app instance role has proper assume role policy", () => {
    const appRoleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"app_instance"\s*{[\s\S]*?^}/m);
    if (appRoleMatch) {
      expect(appRoleMatch[0]).toMatch(/Service.*ec2\.amazonaws\.com/);
    }
  });

  test("app instance policy allows S3 GetObject", () => {
    expect(stackContent).toMatch(/s3:GetObject/);
  });

  test("app instance policy allows S3 PutObject", () => {
    expect(stackContent).toMatch(/s3:PutObject/);
  });

  test("app instance policy allows CloudWatch log operations", () => {
    expect(stackContent).toMatch(/logs:CreateLogGroup/);
    expect(stackContent).toMatch(/logs:CreateLogStream/);
    expect(stackContent).toMatch(/logs:PutLogEvents/);
  });

  test("VPC Flow Log role trusts vpc-flow-logs service", () => {
    const flowLogRoleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"vpc_flow_log"\s*{[\s\S]*?^}/m);
    if (flowLogRoleMatch) {
      expect(flowLogRoleMatch[0]).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    }
  });

  test("Config role trusts config service", () => {
    const configRoleMatch = stackContent.match(/resource\s+"aws_iam_role"\s+"config"\s*{[\s\S]*?^}/m);
    if (configRoleMatch) {
      expect(configRoleMatch[0]).toMatch(/config\.amazonaws\.com/);
    }
  });

  test("Config role has AWS managed policy attached", () => {
    expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/ConfigRole"/);
  });
});

describe("S3 Bucket Configuration Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("app data bucket uses account ID in name", () => {
    expect(stackContent).toMatch(/bucket\s*=\s*"financial-app-data-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
  });

  test("logs bucket uses account ID in name", () => {
    expect(stackContent).toMatch(/bucket\s*=\s*"financial-app-logs-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
  });

  test("app data bucket has DataType tag", () => {
    const appDataMatch = stackContent.match(/resource\s+"aws_s3_bucket"\s+"app_data"\s*{[\s\S]*?^}/m);
    if (appDataMatch) {
      expect(appDataMatch[0]).toMatch(/DataType\s*=\s*"Application"/);
    }
  });

  test("logs bucket has DataType tag", () => {
    const logsMatch = stackContent.match(/resource\s+"aws_s3_bucket"\s+"logs"\s*{[\s\S]*?^}/m);
    if (logsMatch) {
      expect(logsMatch[0]).toMatch(/DataType\s*=\s*"Logs"/);
    }
  });

  test("lifecycle policy transitions to STANDARD_IA at 30 days", () => {
    expect(stackContent).toMatch(/days\s*=\s*30[\s\S]*?storage_class\s*=\s*"STANDARD_IA"/);
  });

  test("lifecycle policy transitions to GLACIER at 90 days", () => {
    expect(stackContent).toMatch(/days\s*=\s*90[\s\S]*?storage_class\s*=\s*"GLACIER"/);
  });

  test("lifecycle policy expires objects at 365 days", () => {
    expect(stackContent).toMatch(/expiration\s*{[\s\S]*?days\s*=\s*365/);
  });

  test("lifecycle rule has ID", () => {
    expect(stackContent).toMatch(/id\s*=\s*"archive-old-logs"/);
  });

  test("lifecycle rule is enabled", () => {
    const lifecycleMatch = stackContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logs"\s*{[\s\S]*?^}/m);
    if (lifecycleMatch) {
      expect(lifecycleMatch[0]).toMatch(/status\s*=\s*"Enabled"/);
    }
  });
});

describe("CloudTrail Configuration Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("CloudTrail has proper S3 key prefix", () => {
    expect(stackContent).toMatch(/s3_key_prefix\s*=\s*"cloudtrail"/);
  });

  test("CloudTrail uses KMS encryption", () => {
    const cloudtrailMatch = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?^}/m);
    if (cloudtrailMatch) {
      expect(cloudtrailMatch[0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master_key\.arn/);
    }
  });

  test("CloudTrail event selector captures all events", () => {
    expect(stackContent).toMatch(/read_write_type\s*=\s*"All"/);
  });

  test("CloudTrail includes management events", () => {
    expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
  });

  test("CloudTrail monitors all S3 objects", () => {
    expect(stackContent).toMatch(/values\s*=\s*\["arn:aws:s3:::\*\/\*"\]/);
  });

  test("CloudTrail depends on logs bucket policy", () => {
    expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.logs\]/);
  });
});

describe("AWS Config Rules Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("S3 public read rule uses AWS managed rule", () => {
    const s3RuleMatch = stackContent.match(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"\s*{[\s\S]*?^}/m);
    if (s3RuleMatch) {
      expect(s3RuleMatch[0]).toMatch(/owner\s*=\s*"AWS"/);
    }
  });

  test("encrypted volumes rule uses correct identifier", () => {
    expect(stackContent).toMatch(/source_identifier\s*=\s*"ENCRYPTED_VOLUMES"/);
  });

  test("IAM password policy requires uppercase", () => {
    expect(stackContent).toMatch(/RequireUppercaseCharacters.*true/);
  });

  test("IAM password policy requires lowercase", () => {
    expect(stackContent).toMatch(/RequireLowercaseCharacters.*true/);
  });

  test("IAM password policy requires numbers", () => {
    expect(stackContent).toMatch(/RequireNumbers.*true/);
  });

  test("IAM password policy requires symbols", () => {
    expect(stackContent).toMatch(/RequireSymbols.*true/);
  });

  test("IAM password policy minimum length is 14", () => {
    expect(stackContent).toMatch(/MinimumPasswordLength.*14/);
  });

  test("IAM password policy has max age of 90 days", () => {
    expect(stackContent).toMatch(/MaxPasswordAge.*90/);
  });
});

describe("CloudWatch Monitoring Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("unauthorized API calls metric filter has proper pattern", () => {
    expect(stackContent).toMatch(/UnauthorizedOperation.*AccessDenied/);
  });

  test("unauthorized API calls alarm has 5 minute period", () => {
    const unauthorizedAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"\s*{[\s\S]*?^}/m);
    if (unauthorizedAlarmMatch) {
      expect(unauthorizedAlarmMatch[0]).toMatch(/period\s*=\s*"300"/);
    }
  });

  test("unauthorized API calls threshold is 5", () => {
    const unauthorizedAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"\s*{[\s\S]*?^}/m);
    if (unauthorizedAlarmMatch) {
      expect(unauthorizedAlarmMatch[0]).toMatch(/threshold\s*=\s*"5"/);
    }
  });

  test("failed logins metric filter pattern is correct", () => {
    expect(stackContent).toMatch(/ConsoleLogin.*Failed authentication/);
  });

  test("failed logins threshold is 3", () => {
    const failedLoginsAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_logins"\s*{[\s\S]*?^}/m);
    if (failedLoginsAlarmMatch) {
      expect(failedLoginsAlarmMatch[0]).toMatch(/threshold\s*=\s*"3"/);
    }
  });

  test("root account usage has 1 minute period", () => {
    const rootAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"\s*{[\s\S]*?^}/m);
    if (rootAlarmMatch) {
      expect(rootAlarmMatch[0]).toMatch(/period\s*=\s*"60"/);
    }
  });

  test("all alarms use Sum statistic", () => {
    expect(stackContent).toMatch(/statistic\s*=\s*"Sum"/);
  });

  test("all alarms have GreaterThanThreshold comparison", () => {
    expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
  });

  test("all alarms publish to SNS topic", () => {
    expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.security_alerts\.arn\]/);
  });
});

describe("WAF Rules Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("WAF is scoped to REGIONAL", () => {
    expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
  });

  test("WAF default action is allow", () => {
    const wafMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?(?=resource\s+"aws_wafv2_web_acl_association")/);
    if (wafMatch) {
      expect(wafMatch[0]).toMatch(/default_action\s*{[\s\S]*?allow\s*{}/);
    }
  });

  test("Core Rule Set has priority 1", () => {
    expect(stackContent).toMatch(/AWS-AWSManagedRulesCommonRuleSet[\s\S]*?priority\s*=\s*1/);
  });

  test("Known Bad Inputs has priority 2", () => {
    expect(stackContent).toMatch(/AWS-AWSManagedRulesKnownBadInputsRuleSet[\s\S]*?priority\s*=\s*2/);
  });

  test("SQLi Rule Set has priority 3", () => {
    expect(stackContent).toMatch(/AWS-AWSManagedRulesSQLiRuleSet[\s\S]*?priority\s*=\s*3/);
  });

  test("Rate limit rule has priority 4", () => {
    expect(stackContent).toMatch(/RateLimitRule[\s\S]*?priority\s*=\s*4/);
  });

  test("rate limit is set to 2000 requests", () => {
    expect(stackContent).toMatch(/limit\s*=\s*2000/);
  });

  test("rate limiting uses IP as aggregate key", () => {
    expect(stackContent).toMatch(/aggregate_key_type\s*=\s*"IP"/);
  });

  test("all WAF rules have visibility config", () => {
    const wafMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?(?=resource\s+"aws_wafv2_web_acl_association")/);
    if (wafMatch) {
      const visibilityCount = (wafMatch[0].match(/visibility_config/g) || []).length;
      expect(visibilityCount).toBeGreaterThanOrEqual(5); // At least 4 rules + 1 ACL
    }
  });

  test("all WAF rules have CloudWatch metrics enabled", () => {
    expect(stackContent).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
  });

  test("all WAF rules have sampled requests enabled", () => {
    expect(stackContent).toMatch(/sampled_requests_enabled\s*=\s*true/);
  });
});

describe("RDS Configuration Details", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("RDS uses PostgreSQL version 14.9", () => {
    expect(stackContent).toMatch(/engine_version\s*=\s*"14\.9"/);
  });

  test("RDS uses db.t3.medium instance class", () => {
    expect(stackContent).toMatch(/instance_class\s*=\s*"db\.t3\.medium"/);
  });

  test("RDS has 100 GB initial storage", () => {
    expect(stackContent).toMatch(/allocated_storage\s*=\s*100/);
  });

  test("RDS max storage is 1000 GB", () => {
    expect(stackContent).toMatch(/max_allocated_storage\s*=\s*1000/);
  });

  test("RDS uses gp3 storage type", () => {
    expect(stackContent).toMatch(/storage_type\s*=\s*"gp3"/);
  });

  test("RDS database name is financialapp", () => {
    expect(stackContent).toMatch(/db_name\s*=\s*"financialapp"/);
  });

  test("RDS username is dbadmin", () => {
    expect(stackContent).toMatch(/username\s*=\s*"dbadmin"/);
  });

  test("RDS password uses random password", () => {
    expect(stackContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
  });

  test("RDS has 30 day backup retention", () => {
    expect(stackContent).toMatch(/backup_retention_period\s*=\s*30/);
  });

  test("RDS backup window is during off-hours", () => {
    expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
  });

  test("RDS maintenance window is scheduled", () => {
    expect(stackContent).toMatch(/maintenance_window\s*=\s*"Mon:04:00-Mon:05:00"/);
  });

  test("RDS skips final snapshot for testing", () => {
    expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  test("random password includes special characters", () => {
    expect(stackContent).toMatch(/special\s*=\s*true/);
  });

  test("Secrets Manager secret has zero recovery window", () => {
    expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*0/);
  });
});

describe("Launch Template Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  test("launch template uses name prefix", () => {
    expect(stackContent).toMatch(/name_prefix\s*=\s*"financial-app-"/);
  });

  test("launch template uses t3.medium instance type", () => {
    const launchTemplateMatch = stackContent.match(/resource\s+"aws_launch_template"\s+"app"\s*{[\s\S]*?(?=^resource\s+|^output\s+)/m);
    if (launchTemplateMatch) {
      expect(launchTemplateMatch[0]).toMatch(/instance_type\s*=\s*"t3\.medium"/);
    }
  });

  test("EBS volume is 100 GB", () => {
    expect(stackContent).toMatch(/volume_size\s*=\s*100/);
  });

  test("EBS volume uses gp3", () => {
    expect(stackContent).toMatch(/volume_type\s*=\s*"gp3"/);
  });

  test("EBS volume deletes on termination", () => {
    expect(stackContent).toMatch(/delete_on_termination\s*=\s*true/);
  });

  test("metadata HTTP endpoint is enabled", () => {
    expect(stackContent).toMatch(/http_endpoint\s*=\s*"enabled"/);
  });

  test("metadata hop limit is 1", () => {
    expect(stackContent).toMatch(/http_put_response_hop_limit\s*=\s*1/);
  });

  test("instance metadata tags are enabled", () => {
    expect(stackContent).toMatch(/instance_metadata_tags\s*=\s*"enabled"/);
  });

  test("user data includes CloudWatch agent installation", () => {
    expect(stackContent).toMatch(/amazon-cloudwatch-agent/);
  });

  test("user data includes fail2ban configuration", () => {
    expect(stackContent).toMatch(/fail2ban/);
  });

  test("user data includes automatic updates", () => {
    expect(stackContent).toMatch(/yum-cron/);
  });

  test("user data is base64 encoded", () => {
    expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
  });
});
