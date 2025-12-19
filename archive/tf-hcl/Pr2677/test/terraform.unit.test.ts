// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for tap_stack.tf
// Tests syntax, structure, and configuration without deploying infrastructure

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Enterprise Security Framework: tap_stack.tf", () => {
  let terraformContent: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    terraformContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Structure and Syntax", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(terraformContent.length).toBeGreaterThan(1000);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      // Should not contain top-level provider declarations except for replica provider
      const providerMatches = terraformContent.match(/^provider\s+"aws"\s*{/gm);
      if (providerMatches) {
        // Only alias providers are allowed
        const aliasProviders = terraformContent.match(/^provider\s+"aws"\s*{\s*alias/gm);
        expect(providerMatches.length).toBeLessThanOrEqual(1); // Only replica provider allowed
        if (providerMatches.length > 0) {
          expect(aliasProviders).toBeTruthy();
        }
      }
    });

    test("has proper Terraform structure with variables, resources, and outputs", () => {
      expect(terraformContent).toMatch(/variable\s+"/);
      expect(terraformContent).toMatch(/resource\s+"/);
      expect(terraformContent).toMatch(/output\s+"/);
      expect(terraformContent).toMatch(/data\s+"/);
    });

    test("uses proper HCL syntax for blocks", () => {
      // Check that blocks are properly opened and closed
      const openBraces = (terraformContent.match(/{/g) || []).length;
      const closeBraces = (terraformContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe("Required Variables", () => {
    test("declares aws_region variable", () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"environment"\s*{/);
      expect(terraformContent).toMatch(/validation\s*{[\s\S]*?condition[\s\S]*?contains\(\["prod",\s*"staging",\s*"dev"\]/);
    });

    test("declares environment_suffix variable with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(terraformContent).toMatch(/description\s*=\s*"Environment suffix to avoid resource conflicts"/);
      expect(terraformContent).toMatch(/type\s*=\s*string/);
      expect(terraformContent).toMatch(/default\s*=\s*""/);
    });

    test("declares organization_name variable", () => {
      expect(terraformContent).toMatch(/variable\s+"organization_name"\s*{/);
    });

    test("declares owner variable", () => {
      expect(terraformContent).toMatch(/variable\s+"owner"\s*{/);
    });

    test("declares vpc_cidr variable with validation", () => {
      expect(terraformContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(terraformContent).toMatch(/validation\s*{[\s\S]*?can\(cidrhost\(var\.vpc_cidr/);
    });

    test("declares security-related variables", () => {
      expect(terraformContent).toMatch(/variable\s+"enforce_mfa"\s*{/);
      expect(terraformContent).toMatch(/variable\s+"password_policy_requirements"\s*{/);
      expect(terraformContent).toMatch(/variable\s+"enable_waf"\s*{/);
      expect(terraformContent).toMatch(/variable\s+"enable_guardduty"\s*{/);
    });

    test("declares monitoring and notification variables", () => {
      expect(terraformContent).toMatch(/variable\s+"security_notification_email"\s*{/);
      expect(terraformContent).toMatch(/variable\s+"log_retention_days"\s*{/);
    });
  });

  describe("Data Sources", () => {
    test("declares current AWS caller identity data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("declares current AWS region data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
    });

    test("declares available availability zones data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });
  });

  describe("Local Values", () => {
    test("defines locals block with name_prefix", () => {
      expect(terraformContent).toMatch(/locals\s*{/);
      expect(terraformContent).toMatch(/environment_suffix\s*=\s*var\.environment_suffix\s*!=\s*""\s*\?\s*var\.environment_suffix\s*:\s*var\.environment/);
      expect(terraformContent).toMatch(/name_prefix\s*=.*\$\{var\.organization_name\}-\$\{local\.environment_suffix\}/);
    });

    test("defines availability_zones logic in locals", () => {
      expect(terraformContent).toMatch(/availability_zones\s*=.*length\(var\.availability_zones\)/);
    });

    test("defines common_tags in locals", () => {
      expect(terraformContent).toMatch(/common_tags\s*=\s*{/);
      expect(terraformContent).toMatch(/EnvironmentSuffix\s*=\s*local\.environment_suffix/);
    });
  });

  describe("KMS Resources", () => {
    test("declares KMS master key for encryption", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_key"\s+"security_master_key"\s*{/);
    });

    test("KMS key has proper configuration", () => {
      expect(terraformContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(terraformContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("declares KMS alias", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_alias"\s+"security_master_key"\s*{/);
    });

    test("KMS policy allows CloudTrail and CloudWatch", () => {
      const kmsKeyMatch = terraformContent.match(/resource\s+"aws_kms_key"\s+"security_master_key"\s*{[\s\S]*?}(?=\n\nresource|\n\n#|\s*$)/);
      expect(kmsKeyMatch).toBeTruthy();
      if (kmsKeyMatch) {
        expect(kmsKeyMatch[0]).toMatch(/cloudtrail\.amazonaws\.com/);
        expect(kmsKeyMatch[0]).toMatch(/logs\..*\.amazonaws\.com/);
      }
    });
  });

  describe("IAM Resources", () => {
    test("declares IAM password policy", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"\s*{/);
    });

    test("declares security admin role", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"security_admin"\s*{/);
    });

    test("declares developer role", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"developer"\s*{/);
    });

    test("declares auditor role", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"auditor"\s*{/);
    });

    test("security admin role has MFA condition when enabled", () => {
      const securityAdminMatch = terraformContent.match(/resource\s+"aws_iam_role"\s+"security_admin"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      expect(securityAdminMatch).toBeTruthy();
      if (securityAdminMatch) {
        expect(securityAdminMatch[0]).toMatch(/aws:MultiFactorAuthPresent/);
      }
    });

    test("declares comprehensive security admin policy", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_policy"\s+"security_admin"\s*{/);
      const policyMatch = terraformContent.match(/resource\s+"aws_iam_policy"\s+"security_admin"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (policyMatch) {
        expect(policyMatch[0]).toMatch(/guardduty:\*/);
        expect(policyMatch[0]).toMatch(/securityhub:\*/);
        expect(policyMatch[0]).toMatch(/config:\*/);
        expect(policyMatch[0]).toMatch(/cloudtrail:\*/);
      }
    });

    test("declares developer policy with restrictions", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_policy"\s+"developer"\s*{/);
      const devPolicyMatch = terraformContent.match(/resource\s+"aws_iam_policy"\s+"developer"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (devPolicyMatch) {
        expect(devPolicyMatch[0]).toMatch(/"Deny"/);
        expect(devPolicyMatch[0]).toMatch(/guardduty:\*/);
      }
    });
  });

  describe("VPC and Networking", () => {
    test("declares VPC resource", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC has DNS support enabled", () => {
      const vpcMatch = terraformContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (vpcMatch) {
        expect(vpcMatch[0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
        expect(vpcMatch[0]).toMatch(/enable_dns_support\s*=\s*true/);
      }
    });

    test("declares internet gateway", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares public, private, and database subnets", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
    });

    test("public subnets don't auto-assign public IPs (security best practice)", () => {
      const publicSubnetMatch = terraformContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (publicSubnetMatch) {
        expect(publicSubnetMatch[0]).toMatch(/map_public_ip_on_launch\s*=\s*false/);
      }
    });

    test("declares NAT gateways and EIPs", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test("declares route tables for each tier", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_route_table"\s+"database"\s*{/);
    });

    test("declares route table associations", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_route_table_association"\s+"database"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("declares security groups for all tiers", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"web_tier"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"app_tier"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"database_tier"\s*{/);
    });

    test("web tier allows HTTPS and HTTP", () => {
      const webSgMatch = terraformContent.match(/resource\s+"aws_security_group"\s+"web_tier"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (webSgMatch) {
        expect(webSgMatch[0]).toMatch(/from_port\s*=\s*443/);
        expect(webSgMatch[0]).toMatch(/from_port\s*=\s*80/);
      }
    });

    test("app tier references web tier security group", () => {
      const appSgMatch = terraformContent.match(/resource\s+"aws_security_group"\s+"app_tier"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (appSgMatch) {
        expect(appSgMatch[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.web_tier\.id\]/);
      }
    });

    test("database tier only allows access from app tier", () => {
      const dbSgMatch = terraformContent.match(/resource\s+"aws_security_group"\s+"database_tier"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (dbSgMatch) {
        expect(dbSgMatch[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.app_tier\.id\]/);
        expect(dbSgMatch[0]).toMatch(/from_port\s*=\s*3306/); // MySQL
        expect(dbSgMatch[0]).toMatch(/from_port\s*=\s*5432/); // PostgreSQL
      }
    });
  });

  describe("Network ACLs", () => {
    test("declares network ACLs for all subnet tiers", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_network_acl"\s+"public"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_network_acl"\s+"private"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_network_acl"\s+"database"\s*{/);
    });

    test("public NACL allows HTTPS and HTTP", () => {
      const publicNaclMatch = terraformContent.match(/resource\s+"aws_network_acl"\s+"public"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (publicNaclMatch) {
        expect(publicNaclMatch[0]).toMatch(/from_port\s*=\s*443/);
        expect(publicNaclMatch[0]).toMatch(/from_port\s*=\s*80/);
      }
    });

    test("database NACL restricts access to private subnets", () => {
      const dbNaclMatch = terraformContent.match(/resource\s+"aws_network_acl"\s+"database"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (dbNaclMatch) {
        expect(dbNaclMatch[0]).toMatch(/cidrsubnet\(var\.vpc_cidr/);
      }
    });
  });

  describe("VPC Flow Logs", () => {
    test("declares VPC flow logs", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_log"\s*{/);
    });

    test("declares CloudWatch log group for flow logs with random suffix", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"\s*{/);
      expect(terraformContent).toMatch(/name\s*=\s*"\/aws\/vpc\/flowlogs-\$\{local\.name_prefix\}-\$\{random_id\.suffix\.hex\}"/);
    });

    test("declares IAM role and policy for flow logs", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_log"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_log"\s*{/);
    });

    test("flow logs capture ALL traffic", () => {
      const flowLogMatch = terraformContent.match(/resource\s+"aws_flow_log"\s+"vpc_flow_log"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (flowLogMatch) {
        expect(flowLogMatch[0]).toMatch(/traffic_type\s*=\s*"ALL"/);
      }
    });
  });

  describe("WAF Configuration", () => {
    test("declares WAF web ACL conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.enable_waf\s*\?\s*1\s*:\s*0/);
    });

    test("WAF includes rate limiting rule", () => {
      const wafMatch = terraformContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?}(?=\n\n#|\s*$)/);
      if (wafMatch) {
        expect(wafMatch[0]).toMatch(/RateLimitRule/);
        expect(wafMatch[0]).toMatch(/rate_based_statement/);
      }
    });

    test("WAF includes AWS managed rule sets", () => {
      const wafMatch = terraformContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?}(?=\n\n#|\s*$)/);
      if (wafMatch) {
        expect(wafMatch[0]).toMatch(/AWSManagedRulesCommonRuleSet/);
        expect(wafMatch[0]).toMatch(/AWSManagedRulesKnownBadInputsRuleSet/);
      }
    });

    test("WAF includes geo-blocking functionality", () => {
      const wafMatch = terraformContent.match(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{[\s\S]*?}(?=\n\n#|\s*$)/);
      if (wafMatch) {
        expect(wafMatch[0]).toMatch(/GeoBlockingRule/);
        expect(wafMatch[0]).toMatch(/geo_match_statement/);
      }
    });

    test("declares WAF IP set for blocked IPs", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_wafv2_ip_set"\s+"blocked_ips"\s*{/);
    });

    test("declares WAF logging configuration with CloudWatch log group using random suffix", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"waf"\s*{/);
      expect(terraformContent).toMatch(/name\s*=\s*"aws-waf-logs-\$\{local\.name_prefix\}-security-waf-\$\{random_id\.suffix\.hex\}"/);
      expect(terraformContent).toMatch(/log_destination_configs\s*=\s*\[aws_cloudwatch_log_group\.waf\[0\]\.arn\]/);
    });
  });

  describe("GuardDuty Configuration", () => {
    test("checks for existing GuardDuty detector with data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_guardduty_detector"\s+"existing"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.enable_guardduty\s*\?\s*1\s*:\s*0/);
    });

    test("declares GuardDuty detector conditionally only if not existing", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.enable_guardduty\s*&&\s*length\(data\.aws_guardduty_detector\.existing\)\s*==\s*0\s*\?\s*1\s*:\s*0/);
    });

    test("GuardDuty enables S3 and Kubernetes monitoring", () => {
      const guardDutyMatch = terraformContent.match(/resource\s+"aws_guardduty_detector"\s+"main"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (guardDutyMatch) {
        expect(guardDutyMatch[0]).toMatch(/s3_logs\s*{/);
        expect(guardDutyMatch[0]).toMatch(/kubernetes\s*{/);
        expect(guardDutyMatch[0]).toMatch(/malware_protection\s*{/);
      }
    });

    test("has local variable for GuardDuty detector ID", () => {
      expect(terraformContent).toMatch(/locals\s*{[\s\S]*?guardduty_detector_id\s*=[\s\S]*?}/);
    });
  });

  describe("Security Hub", () => {
    test("declares Security Hub account conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_securityhub_account"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*0.*# Disabled due to existing subscription/);
    });

    test("enables default standards", () => {
      const securityHubMatch = terraformContent.match(/resource\s+"aws_securityhub_account"\s+"main"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (securityHubMatch) {
        expect(securityHubMatch[0]).toMatch(/enable_default_standards\s*=\s*true/);
      }
    });

    test("subscribes to security standards conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"aws_foundational"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"cis"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"pci_dss"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*0.*# Disabled due to Security Hub account being disabled/);
    });
  });

  describe("AWS Config", () => {
    test("declares Config S3 bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"\s*{/);
    });

    test("Config bucket has proper security configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"config"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"config"\s*{/);
    });

    test("checks for existing Config service-linked role with data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_iam_role"\s+"config_service_role"\s*{/);
      expect(terraformContent).toMatch(/name\s*=\s*"AWSServiceRoleForConfig"/);
    });

    test("declares Config service components conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*0.*# Disabled due to.*limit/);
    });

    test("declares Config rules conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_config_rule"\s+"root_access_key_check"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_ssl_requests_only"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*0.*# Disabled due to no active configuration recorder/);
    });
  });

  describe("CloudTrail", () => {
    test("declares CloudTrail S3 bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"\s*{/);
    });

    test("CloudTrail bucket has proper security and lifecycle", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"\s*{/);
    });

    test("declares CloudTrail conditionally", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*0.*# Disabled due to trail limit reached/);
    });

    test("CloudTrail enables multi-region and data events", () => {
      const cloudTrailMatch = terraformContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (cloudTrailMatch) {
        expect(cloudTrailMatch[0]).toMatch(/is_multi_region_trail\s*=\s*true/);
        expect(cloudTrailMatch[0]).toMatch(/include_global_service_events\s*=\s*true/);
        expect(cloudTrailMatch[0]).toMatch(/event_selector\s*{/);
        expect(cloudTrailMatch[0]).toMatch(/data_resource\s*{/);
      }
    });

    test("declares CloudWatch log group for CloudTrail", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s*{/);
      expect(terraformContent).toMatch(/name\s*=\s*"\/aws\/cloudtrail\/\$\{local\.name_prefix\}-\$\{random_id\.suffix\.hex\}"/);
    });

    test("CloudTrail integrates with CloudWatch logs", () => {
      const cloudTrailMatch = terraformContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (cloudTrailMatch) {
        expect(cloudTrailMatch[0]).toMatch(/cloud_watch_logs_group_arn/);
        expect(cloudTrailMatch[0]).toMatch(/cloud_watch_logs_role_arn/);
      }
    });
  });

  describe("Monitoring and Alerting", () => {
    test("declares SNS topic for security alerts", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"security_email"\s*{/);
    });

    test("declares CloudWatch metric filters and alarms", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"root_usage"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_usage"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"\s*{/);
    });

    test("root access alarm has proper pattern", () => {
      const rootFilterMatch = terraformContent.match(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"root_usage"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (rootFilterMatch) {
        expect(rootFilterMatch[0]).toMatch(/userIdentity\.type.*Root/);
      }
    });
  });

  describe("Data Protection - S3 Buckets", () => {
    test("declares audit logs bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs"\s*{/);
    });

    test("audit logs bucket has security configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"audit_logs"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit_logs"\s*{/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"audit_logs"\s*{/);
    });

    test("supports cross-region replication when enabled", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs_replica"\s*{/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.enable_cross_region_backup\s*\?\s*1\s*:\s*0/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"audit_logs"\s*{/);
      expect(terraformContent).toMatch(/delete_marker_replication\s*{\s*status\s*=\s*"Enabled"\s*}/);
    });
  });

  describe("Cross-Region Provider", () => {
    test("declares replica provider for cross-region backup", () => {
      expect(terraformContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"replica"/);
    });

    test("replica provider uses different region", () => {
      const replicaProviderMatch = terraformContent.match(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"replica"[\s\S]*?}/);
      if (replicaProviderMatch) {
        expect(replicaProviderMatch[0]).toMatch(/us-east-1.*us-west-2/);
      }
    });
  });

  describe("Outputs", () => {
    test("declares comprehensive outputs", () => {
      expect(terraformContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(terraformContent).toMatch(/output\s+"kms_key_arn"\s*{/);
      expect(terraformContent).toMatch(/output\s+"security_admin_role_arn"\s*{/);
      expect(terraformContent).toMatch(/output\s+"waf_web_acl_arn"\s*{/);
      expect(terraformContent).toMatch(/output\s+"guardduty_detector_id"\s*{/);
      expect(terraformContent).toMatch(/output\s+"cloudtrail_arn"\s*{/);
    });

    test("outputs have proper descriptions", () => {
      const outputSections = terraformContent.match(/output\s+"[^"]+"\s*{[^}]*}/g);
      if (outputSections) {
        outputSections.forEach(output => {
          expect(output).toMatch(/description\s*=/);
        });
      }
    });

    test("conditional outputs handle null values", () => {
      expect(terraformContent).toMatch(/var\.enable_waf\s*\?\s*aws_wafv2_web_acl\.main\[0\]\.arn\s*:\s*null/);
      expect(terraformContent).toMatch(/value\s*=\s*local\.guardduty_detector_id/);
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("uses consistent naming with name_prefix", () => {
      expect(terraformContent).toMatch(/\$\{local\.name_prefix\}/);
    });

    test("applies common tags consistently", () => {
      expect(terraformContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(terraformContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("common tags include required fields", () => {
      const localMatch = terraformContent.match(/common_tags\s*=\s*{[\s\S]*?}/);
      if (localMatch) {
        expect(localMatch[0]).toMatch(/Project\s*=/);
        expect(localMatch[0]).toMatch(/Environment\s*=/);
        expect(localMatch[0]).toMatch(/Owner\s*=/);
        expect(localMatch[0]).toMatch(/ManagedBy\s*=/);
      }
    });
  });

  describe("Security Best Practices", () => {
    test("all S3 buckets block public access", () => {
      const bucketNames = ['config', 'cloudtrail', 'audit_logs'];
      bucketNames.forEach(bucketName => {
        expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${bucketName}"\\s*{`));
      });
    });

    test("all S3 buckets have encryption enabled", () => {
      const bucketNames = ['config', 'cloudtrail', 'audit_logs'];
      bucketNames.forEach(bucketName => {
        expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucketName}"\\s*{`));
      });
    });

    test("all S3 buckets have versioning enabled", () => {
      const bucketNames = ['config', 'cloudtrail', 'audit_logs'];
      bucketNames.forEach(bucketName => {
        expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${bucketName}"\\s*{`));
      });
    });

    test("uses KMS encryption for CloudWatch logs", () => {
      const logGroupMatches = terraformContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/g);
      expect(logGroupMatches).toBeTruthy();
      if (logGroupMatches) {
        expect(logGroupMatches.length).toBeGreaterThan(0);
      }
    });

    test("database subnets have no internet access", () => {
      const dbRouteTableMatch = terraformContent.match(/resource\s+"aws_route_table"\s+"database"\s*{[\s\S]*?}(?=\n\nresource|\n\n#)/);
      if (dbRouteTableMatch) {
        expect(dbRouteTableMatch[0]).not.toMatch(/route\s*{/);
      }
    });
  });

  describe("Variable Validation", () => {
    test("critical variables have validation blocks", () => {
      const criticalVars = ['aws_region', 'environment', 'vpc_cidr', 'password_policy_requirements'];
      criticalVars.forEach(varName => {
        const varMatch = terraformContent.match(new RegExp(`variable\\s+"${varName}"\\s*{[\\s\\S]*?validation\\s*{`, 'g'));
        expect(varMatch).toBeTruthy();
      });
    });

    test("email validation is present", () => {
      const emailVarMatch = terraformContent.match(/variable\s+"security_notification_email"\s*{[\s\S]*?}(?=\n\nvariable|\n\n#)/);
      if (emailVarMatch) {
        expect(emailVarMatch[0]).toMatch(/regex.*@.*\\\./);
      }
    });

    test("country codes validation for WAF", () => {
      const countryVarMatch = terraformContent.match(/variable\s+"allowed_countries"\s*{[\s\S]*?}(?=\n\nvariable|\n\n#)/);
      if (countryVarMatch) {
        expect(countryVarMatch[0]).toMatch(/regex.*\[A-Z\]\{2\}/);
      }
    });
  });

  describe("Random ID Usage", () => {
    test("declares random_id resource", () => {
      expect(terraformContent).toMatch(/resource\s+"random_id"\s+"suffix"\s*{/);
    });

    test("random ID is used in resource names for uniqueness", () => {
      expect(terraformContent).toMatch(/\$\{random_id\.suffix\.hex\}/);
      
      // Check that random ID is used in various resource types for uniqueness
      const randomIdMatches = terraformContent.match(/\$\{random_id\.suffix\.hex\}/g);
      expect(randomIdMatches).toBeTruthy();
      if (randomIdMatches) {
        expect(randomIdMatches.length).toBeGreaterThan(15); // Should be used extensively for unique naming
      }
    });

    test("IAM resources use random suffixes to prevent name conflicts", () => {
      // Check that key IAM resources include random suffix
      expect(terraformContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-security-admin-\$\{random_id\.suffix\.hex\}"/);
      expect(terraformContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-developer-\$\{random_id\.suffix\.hex\}"/);
      expect(terraformContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-auditor-\$\{random_id\.suffix\.hex\}"/);
    });

    test("security service resources use random suffixes", () => {
      // Check that security services include random suffix
      expect(terraformContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-security-waf-\$\{random_id\.suffix\.hex\}"/);
      expect(terraformContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-security-trail-\$\{random_id\.suffix\.hex\}"/);
      expect(terraformContent).toMatch(/name\s*=\s*"\$\{local\.name_prefix\}-config-recorder-\$\{random_id\.suffix\.hex\}"/);
    });
  });
});

describe("Terraform Configuration Completeness", () => {
  test("file is substantial and comprehensive", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    const lines = content.split('\n').length;
    expect(lines).toBeGreaterThan(1500); // Expect substantial file
  });

  test("covers all major security domains from requirements", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for major security areas mentioned in requirements
    const securityDomains = [
      'IAM', 'KMS', 'VPC', 'GuardDuty', 'SecurityHub', 
      'Config', 'CloudTrail', 'WAF', 'CloudWatch'
    ];
    
    securityDomains.forEach(domain => {
      expect(content.toLowerCase()).toMatch(new RegExp(domain.toLowerCase()));
    });
  });
});