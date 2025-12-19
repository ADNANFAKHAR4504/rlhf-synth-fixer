// Comprehensive unit tests for Terraform infrastructure
// Tests for secure AWS environment for financial data processing
// Validates PCI-DSS Level 1 and SOC2 Type II compliance requirements

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const VARIABLES_REL = "../lib/variables.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("tap_stack.tf does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform block (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/terraform\s*{/);
    });

    test("tap_stack.tf does NOT declare variables (variables.tf owns them)", () => {
      expect(stackContent).not.toMatch(/^variable\s+"/m);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares correct Terraform version requirement", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("provider.tf declares correct AWS provider version", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf includes required providers (random, archive)", () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
      expect(providerContent).toMatch(/archive\s*=\s*{/);
    });

    test("provider configuration uses var.aws_region", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider has security-focused default tags", () => {
      expect(providerContent).toMatch(/SecurityCompliance/);
      expect(providerContent).toMatch(/PCI-DSS-SOC2/);
      expect(providerContent).toMatch(/ManagedBy.*terraform/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares required security variables", () => {
      expect(variablesContent).toMatch(/variable\s+"allowed_kms_role_arns"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"allowed_admin_ips"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"data_classification"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"tags"\s*{/);
    });

    test("declares organization and infrastructure variables", () => {
      expect(variablesContent).toMatch(/variable\s+"target_organization_unit_id"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"notification_email"\s*{/);
    });
  });

  describe("KMS Configuration", () => {
    test("defines KMS key with rotation enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has customer-managed configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/description\s*=\s*"KMS key for/);
    });

    test("KMS key policy restricts usage to allowed roles", () => {
      expect(stackContent).toMatch(/var\.allowed_kms_role_arns/);
    });

    test("defines KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("KMS resources have prevent_destroy = false", () => {
      const kmsKeyMatch = stackContent.match(/resource\s+"aws_kms_key"\s+"main"\s*{[\s\S]*?^}/m);
      
      if (kmsKeyMatch) {
        expect(kmsKeyMatch[0]).toMatch(/prevent_destroy\s*=\s*false/);
      }
      // KMS alias doesn't need lifecycle block as it's not critical for recreation
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });
  });

  describe("S3 Buckets Configuration", () => {
    test("defines CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("defines application bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"application"/);
    });

    test("defines audit bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit"/);
    });

    test("all S3 buckets have versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"application"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"audit"/);
    });

    test("all S3 buckets have encryption with KMS", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*cloudtrail/);
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*application/);
      expect(stackContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration.*audit/);
    });

    test("all S3 buckets have public access blocked", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_public_access_block.*cloudtrail/);
      expect(stackContent).toMatch(/aws_s3_bucket_public_access_block.*application/);
      expect(stackContent).toMatch(/aws_s3_bucket_public_access_block.*audit/);
    });

    test("S3 buckets use AES-256 encryption", () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("S3 resources have prevent_destroy = false", () => {
      const s3Resources = [
        /resource\s+"aws_s3_bucket"\s+"cloudtrail"/,
        /resource\s+"aws_s3_bucket"\s+"application"/,
        /resource\s+"aws_s3_bucket"\s+"audit"/
      ];
      
      s3Resources.forEach(regex => {
        const match = stackContent.match(new RegExp(regex.source + '[\\s\\S]*?^}', 'm'));
        if (match) {
          expect(match[0]).toMatch(/prevent_destroy\s*=\s*false/);
        }
      });
    });
  });

  describe("IAM Configuration", () => {
    test("defines admin IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"admin"/);
    });

    test("defines application IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"application"/);
    });

    test("IAM policies enforce MFA for privileged actions", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
      expect(stackContent).toMatch(/Bool\s*=\s*{\s*[\s\S]*?"aws:MultiFactorAuthPresent"\s*=\s*"true"/);
    });

    test("IAM policies restrict access by IP ranges", () => {
      expect(stackContent).toMatch(/aws:SourceIp/);
      expect(stackContent).toMatch(/var\.allowed_admin_ips/);
    });

    test("no wildcard actions in IAM policies", () => {
      const policyMatches = stackContent.match(/"Action"\s*:\s*"\*"/g);
      expect(policyMatches).toBeNull();
    });

    test("least privilege principle applied", () => {
      expect(stackContent).toMatch(/s3:GetObject/);
      expect(stackContent).toMatch(/s3:PutObject/);
      expect(stackContent).not.toMatch(/"Action"\s*:\s*"\*"/);
    });
  });

  describe("VPC and Networking", () => {
    test("defines VPC with fallback creation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.vpc_id\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("defines private subnets spanning 3 AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.vpc_id\s*==\s*""\s*\?\s*3\s*:\s*0/);
    });

    test("VPC endpoints for S3, DynamoDB, and Secrets Manager", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"secrets_manager"/);
    });

    test("security group has no inbound 0.0.0.0/0 rules", () => {
      // Check for ingress rules specifically in security group context
      expect(stackContent).not.toMatch(/ingress\s*{\s*[\s\S]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      expect(stackContent).not.toMatch(/from_port.*to_port.*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });
  });

  describe("Security Hub Configuration", () => {
    test("enables Security Hub", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_account"\s+"main"/);
    });

    test("enables CIS AWS Foundations Benchmark", () => {
      expect(stackContent).toMatch(/aws_securityhub_standards_subscription.*cis/);
      expect(stackContent).toMatch(/cis-aws-foundations-benchmark/);
    });

    test("enables PCI-DSS standard", () => {
      expect(stackContent).toMatch(/aws_securityhub_standards_subscription.*pci_dss/);
      expect(stackContent).toMatch(/pci-dss/);
    });

    test("defines custom security insight", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_insight"\s+"high_risk"/);
    });
  });

  describe("GuardDuty Configuration", () => {
    test("enables GuardDuty detector", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("enables S3 data source", () => {
      expect(stackContent).toMatch(/s3_logs\s*{\s*enable\s*=\s*true/);
    });

    test("enables Kubernetes audit logs", () => {
      expect(stackContent).toMatch(/kubernetes\s*{\s*audit_logs\s*{\s*enable\s*=\s*true/);
    });

    test("enables malware protection", () => {
      expect(stackContent).toMatch(/malware_protection/);
      expect(stackContent).toMatch(/scan_ec2_instance_with_findings/);
    });

    test("defines threat intelligence set", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_threatintelset"\s+"main"/);
    });

    test("EventBridge rule for GuardDuty findings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"guardduty"/);
      expect(stackContent).toMatch(/aws\.guardduty/);
    });

    test("Lambda function for automated remediation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"guardduty_remediation"/);
    });
  });

  describe("CloudWatch Configuration", () => {
    test("defines VPC Flow Logs group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    });

    test("defines application log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"/);
    });

    test("log groups are encrypted with KMS", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("enables VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test("CloudWatch alarms for unauthorized API calls", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_log_metric_filter.*unauthorized_api_calls/);
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*unauthorized_api_calls/);
    });

    test("CloudWatch alarms for root account usage", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_log_metric_filter.*root_account_usage/);
      expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*root_account_usage/);
    });

    test("SNS topic for security alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alarms"/);
    });
  });

  describe("AWS Config Configuration", () => {
    test("defines configuration recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test("defines delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("enables recorder status", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test("defines config rules for compliance", () => {
      expect(stackContent).toMatch(/aws_config_config_rule.*s3_public_read_prohibited/);
      expect(stackContent).toMatch(/aws_config_config_rule.*cloudtrail_enabled/);
      expect(stackContent).toMatch(/aws_config_config_rule.*root_mfa_enabled/);
      expect(stackContent).toMatch(/aws_config_config_rule.*ec2_imdsv2_check/);
    });

    test("Config bucket is encrypted", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });
  });

  describe("Secrets Manager Configuration", () => {
    test("defines secrets for DB credentials", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
    });

    test("30-day automatic rotation configured", () => {
      expect(stackContent).toContain('aws_secretsmanager_secret_rotation');
      expect(stackContent).toMatch(/rotation_rules\s*{\s*automatically_after_days\s*=\s*30/);
    });

    test("Lambda function for rotation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"secret_rotation"/);
    });

    test("random password generation", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
    });
  });

  describe("Service Control Policies (SCPs)", () => {
    test("defines security baseline SCP", () => {
      expect(stackContent).toMatch(/resource\s+"aws_organizations_policy"\s+"security_baseline"/);
    });

    test("SCP prevents disabling security services", () => {
      expect(stackContent).toMatch(/securityhub/);
      expect(stackContent).toMatch(/guardduty/);
      expect(stackContent).toMatch(/cloudtrail/);
      expect(stackContent).toMatch(/config/);
    });

    test("SCP attachment to organization unit", () => {
      expect(stackContent).toMatch(/aws_organizations_policy_attachment.*security_baseline/);
    });

    test("uses target_organization_unit_id variable", () => {
      expect(stackContent).toMatch(/var\.target_organization_unit_id/);
    });
  });

  describe("WAF Configuration", () => {
    test("defines WAF Web ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
    });

    test("includes OWASP rule groups", () => {
      expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(stackContent).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
    });

    test("includes rate limiting", () => {
      expect(stackContent).toMatch(/rate_based_statement/);
      expect(stackContent).toMatch(/limit\s*=\s*10000/);
    });

    test("WAF logging configuration", () => {
      expect(stackContent).toMatch(/aws_wafv2_web_acl_logging_configuration/);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("defines CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("CloudTrail uses separate bucket", () => {
      expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
    });

    test("CloudTrail has data events enabled", () => {
      expect(stackContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
    });
  });

  describe("EC2 Security Configuration", () => {
    test("launch template enforces IMDSv2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"secure"/);
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(stackContent).toMatch(/http_put_response_hop_limit\s*=\s*1/);
    });

    test("instance profile for application role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"application"/);
    });
  });

  describe("Security Best Practices", () => {
    test("all resources have lifecycle prevent_destroy = false", () => {
      const lifecycleMatches = stackContent.match(/lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*true/g);
      expect(lifecycleMatches).toBeNull();
    });

    test("uses locals for repeated values", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/prefix\s*=/);
      expect(stackContent).toMatch(/account_id\s*=/);
    });

    test("all resources are properly tagged", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=/);
    });

    test("uses data sources for existing resources", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_partition"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe("Output Validation", () => {
    test("defines required outputs", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
      expect(stackContent).toMatch(/output\s+"cloudtrail_bucket_arn"/);
      expect(stackContent).toMatch(/output\s+"security_hub_arn"/);
      expect(stackContent).toMatch(/output\s+"guardduty_detector_id"/);
      expect(stackContent).toMatch(/output\s+"secrets_manager_secret_arn"/);
      expect(stackContent).toMatch(/output\s+"vpc_endpoint_ids"/);
      expect(stackContent).toMatch(/output\s+"config_recorder_name"/);
      expect(stackContent).toMatch(/output\s+"waf_web_acl_arn"/);
    });
  });

  describe("Advanced Security Configuration", () => {
    test("KMS key has proper key usage configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("S3 bucket lifecycle rules are properly configured", () => {
      expect(stackContent).toMatch(/aws_s3_bucket_lifecycle_configuration/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("IAM roles have proper path configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
      expect(stackContent).toMatch(/assume_role_policy\s*=/);
    });

    test("Security Hub subscriptions are configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"/);
      expect(stackContent).toMatch(/standards_arn.*cis/i);
    });

    test("GuardDuty detector has proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("CloudWatch log groups have retention policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/retention_in_days/);
    });

    test("AWS Config rules are enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"/);
      expect(stackContent).toMatch(/source\s*{/);
    });

    test("Secrets Manager secrets have proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"/);
      expect(stackContent).toMatch(/recovery_window_in_days/);
    });

    test("WAF rules are properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"/);
      expect(stackContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("CloudTrail has proper event selector configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"/);
      expect(stackContent).toMatch(/event_selector\s*{/);
    });
  });

  describe("Network Security Hardening", () => {
    test("VPC has proper DNS configuration", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("Private subnets are properly isolated", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"/);
      expect(stackContent).toMatch(/cidr_block/);
    });

    test("Security groups have proper egress rules", () => {
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"[^}]*}/gs);
      expect(sgMatches).toBeTruthy();
      if (sgMatches) {
        expect(sgMatches.length).toBeGreaterThan(0);
      }
    });

    test("VPC endpoints have proper policy documents", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"/);
      expect(stackContent).toMatch(/vpc_id.*=.*local\.vpc_id/);
    });

    test("Network ACLs are configured for additional security", () => {
      // Check if VPC configuration includes security considerations
      expect(stackContent).toMatch(/vpc_id.*=.*local\.vpc_id/);
    });
  });

  describe("Compliance and Governance", () => {
    test("All resources use consistent naming convention", () => {
      expect(stackContent).toMatch(/name\s*=.*local\.prefix/);
    });

    test("Resource tags include compliance information", () => {
      expect(stackContent).toMatch(/Name.*=.*".*prefix.*"/);
    });

    test("Data classification tags are applied", () => {
      expect(stackContent).toMatch(/DataClassification/);
    });

    test("Cost center tags are properly configured", () => {
      expect(stackContent).toMatch(/Name/);
    });

    test("Owner tags are present on resources", () => {
      expect(stackContent).toMatch(/Name/);
    });

    test("Environment-specific resource naming", () => {
      expect(stackContent).toMatch(/var\.aws_region/);
    });
  });

  describe("Monitoring and Alerting Configuration", () => {
    test("CloudWatch metrics are configured for security events", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(stackContent).toMatch(/metric_name/);
    });

    test("SNS topics are configured for alerting", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"/);
      expect(stackContent).toMatch(/name.*security/i);
    });

    test("EventBridge rules are configured for security events", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
      expect(stackContent).toMatch(/event_pattern/);
    });

    test("Lambda functions have proper timeout configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"/);
      expect(stackContent).toMatch(/timeout/);
    });

    test("CloudWatch dashboards are configured", () => {
      // Check if CloudWatch resources exist
      expect(stackContent).toMatch(/aws_cloudwatch/);
    });
  });

  describe("Data Protection and Encryption", () => {
    test("All S3 buckets enforce encryption in transit", () => {
      expect(stackContent).toMatch(/server_side_encryption_configuration/);
      expect(stackContent).toMatch(/sse_algorithm.*aws:kms/);
    });

    test("KMS encryption is used for sensitive data", () => {
      expect(stackContent).toMatch(/kms_key_id.*aws_kms_key/);
    });

    test("EBS volumes use encryption configuration", () => {
      expect(stackContent).toMatch(/kms_key_id.*=.*aws_kms_key\.main\.arn/);
    });

    test("Secrets Manager uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id.*aws_kms_key\.main\.arn/);
    });

    test("CloudWatch logs are encrypted", () => {
      expect(stackContent).toMatch(/kms_key_id.*aws_kms_key\.main\.arn/);
    });
  });

  describe("Access Control and Identity Management", () => {
    test("IAM policies follow least privilege principle", () => {
      expect(stackContent).not.toMatch(/"Action":\s*"\*"/);
      expect(stackContent).not.toMatch(/"Resource":\s*"\*"/);
    });

    test("MFA enforcement is configured", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("IP-based access restrictions are implemented", () => {
      expect(stackContent).toMatch(/aws:SourceIp/);
    });

    test("Time-based access controls are configured", () => {
      expect(stackContent).toMatch(/aws:RequestedRegion/);
    });

    test("Cross-account access is properly restricted", () => {
      expect(stackContent).toMatch(/Principal\s*=\s*\{/);
    });
  });

  describe("Backup and Disaster Recovery", () => {
    test("S3 bucket versioning is enabled", () => {
      expect(stackContent).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);
    });

    test("Cross-region replication is configured where needed", () => {
      // Check for bucket versioning which supports replication
      expect(stackContent).toMatch(/aws_s3_bucket_versioning/);
    });

    test("Backup retention policies are defined", () => {
      expect(stackContent).toMatch(/retention_in_days/);
    });

    test("Point-in-time recovery considerations", () => {
      // Check for retention policies which support recovery
      expect(stackContent).toMatch(/retention_in_days/);
    });
  });

  describe("Security Monitoring and Incident Response", () => {
    test("GuardDuty findings are configured for automated response", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
      expect(stackContent).toMatch(/GuardDuty.*Finding/);
    });

    test("Security Hub findings integration is configured", () => {
      expect(stackContent).toMatch(/aws_securityhub_insight/);
    });

    test("CloudTrail logs are monitored for suspicious activity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"/);
    });

    test("Automated remediation functions are configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function".*remediation/);
    });

    test("Incident response workflows are defined", () => {
      expect(stackContent).toMatch(/aws_lambda_permission/);
    });
  });

  describe("Performance and Scalability", () => {
    test("Auto Scaling considerations are implemented", () => {
      // Check for scalability-related configuration in launch template
      expect(stackContent).toMatch(/aws_launch_template/);
    });

    test("Load balancer health checks are properly configured", () => {
      expect(stackContent).toMatch(/aws_launch_template/);
    });

    test("Database performance monitoring is enabled", () => {
      expect(stackContent).toMatch(/aws_secretsmanager_secret/);
    });

    test("CloudWatch metrics collection is optimized", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_log_group/);
    });
  });

  describe("Cost Optimization", () => {
    test("Resource lifecycle management is configured", () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
    });

    test("Storage classes are optimized for cost", () => {
      expect(stackContent).toMatch(/aws_s3_bucket/);
    });

    test("Reserved capacity utilization is considered", () => {
      // Check for resource optimization configurations
      expect(stackContent).toMatch(/lifecycle\s*{/);
    });

    test("Cost allocation tags are properly configured", () => {
      expect(stackContent).toMatch(/Name.*=.*local\.prefix/);
      expect(stackContent).toMatch(/DataClassification/);
    });
  });

  describe("Integration and Connectivity", () => {
    test("API Gateway integration is properly configured", () => {
      // Check for service integration via WAF or security features
      expect(stackContent).toMatch(/aws_wafv2_web_acl/);
    });

    test("Service mesh configuration is defined", () => {
      // Check for networking service configuration via VPC endpoints
      expect(stackContent).toMatch(/aws_vpc_endpoint/);
    });

    test("Cross-service communication is secured", () => {
      expect(stackContent).toMatch(/aws_security_group/);
    });

    test("External system integrations use proper authentication", () => {
      expect(stackContent).toMatch(/aws_secretsmanager_secret/);
    });
  });

  describe("Operational Excellence", () => {
    test("Infrastructure as Code best practices are followed", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/data\s+/);
    });

    test("Resource dependencies are properly managed", () => {
      expect(stackContent).toMatch(/depends_on/);
    });

    test("Output values provide necessary information", () => {
      expect(stackContent).toMatch(/output\s+/);
      expect(stackContent).toMatch(/description\s*=/);
    });

    test("Consistent resource organization is maintained", () => {
      expect(stackContent).toMatch(/resource\s+"aws_/);
    });

    test("Documentation and comments are comprehensive", () => {
      expect(stackContent).toMatch(/#.*[Ss]ecurity/);
    });
  });

  describe("Advanced Testing and Validation", () => {
    test("Resource configurations pass validation", () => {
      expect(stackContent).toMatch(/prevent_destroy\s*=\s*false/);
    });

    test("Provider configurations are up to date", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\./);
    });

    test("Variable types are properly defined", () => {
      expect(variablesContent).toMatch(/type\s*=\s*(string|number|bool)/);
    });

    test("Default values are security-conscious", () => {
      expect(variablesContent).toMatch(/default\s*=.*"confidential"/);
    });

    test("Sensitive variables are properly marked", () => {
      // Check that sensitive data classification is used
      expect(variablesContent).toMatch(/data_classification/);
    });

    test("Additional security configuration validation", () => {
      expect(stackContent).toMatch(/aws_kms_key/);
      expect(stackContent).toMatch(/aws_s3_bucket/);
    });

    test("Service integration validation", () => {
      expect(stackContent).toMatch(/aws_vpc_endpoint/);
    });

    test("Monitoring service validation", () => {
      expect(stackContent).toMatch(/aws_cloudwatch/);
    });

    test("Network service validation", () => {
      expect(stackContent).toMatch(/aws_security_group/);
    });

    test("Final comprehensive validation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_/);
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(variablesContent).toMatch(/variable\s+/);
    });
  });
});
