// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform configuration in ../lib/tap_stack.tf
// No Terraform or AWS commands are executed - pure static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Configuration", () => {
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

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      if (!exists) {
        console.error(`[unit] Expected provider config at: ${providerPath}`);
      }
      expect(exists).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf declares S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("provider.tf declares required providers", () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/random\s*=\s*{/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Required Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares environment_suffix variable for resource naming", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });
  });

  describe("Security Requirements (from PROMPT.md)", () => {
    describe("VPC Foundation", () => {
      test("declares VPC resource", () => {
        expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      });

      test("declares private subnets", () => {
        expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      });

      test("declares public subnets", () => {
        expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      });

      test("EC2 instances are deployed in private subnets", () => {
        expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web_servers"\s*{/);
        // Check that EC2 instances reference private subnets
        const ec2Block = stackContent.match(/resource\s+"aws_instance"\s+"web_servers"\s*{[^}]*subnet_id[^}]*}/s);
        expect(ec2Block?.[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.private/);
      });
    });

    describe("Default-Deny Security Groups", () => {
      test("declares web tier security group", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_tier"\s*{/);
      });

      test("declares ALB security group", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      });

      test("declares database security group", () => {
        expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
      });

      test("web tier security group has explicit ingress rules only", () => {
        const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"web_tier"\s*{[\s\S]*?^\}/m);
        expect(sgBlock?.[0]).toMatch(/ingress\s*{/);
        expect(sgBlock?.[0]).toMatch(/description\s*=\s*".*from ALB"/i);
      });

      test("database security group restricts access to web tier only", () => {
        const sgBlock = stackContent.match(/resource\s+"aws_security_group"\s+"database"\s*{[\s\S]*?^\}/m);
        expect(sgBlock?.[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.web_tier\.id\]/);
      });
    });

    describe("Encryption at Rest", () => {
      test("S3 buckets have AES-256 encryption", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
        expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      });

      test("RDS instance has storage encryption enabled", () => {
        const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^\}/m);
        expect(rdsBlock?.[0]).toMatch(/storage_encrypted\s*=\s*true/);
      });

      test("RDS uses customer-managed KMS key", () => {
        expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds_encryption"\s*{/);
        const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^\}/m);
        expect(rdsBlock?.[0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds_encryption/);
      });

      test("KMS key has rotation enabled", () => {
        const kmsBlock = stackContent.match(/resource\s+"aws_kms_key"\s+"rds_encryption"\s*{[^}]*}/s);
        expect(kmsBlock?.[0]).toMatch(/enable_key_rotation\s*=\s*true/);
      });
    });

    describe("IAM with MFA Enforcement", () => {
      test("declares IAM roles for EC2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      });

      test("IAM policy enforces MFA for critical actions", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_ssm_policy"\s*{/);
        // Check for MFA condition in policy
        expect(stackContent).toMatch(/"aws:MultiFactorAuthPresent"/);
      });
    });

    describe("Comprehensive Logging", () => {
      test("API Gateway has CloudWatch log group", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"\s*{/);
      });

      test("API Gateway stage has access logging enabled", () => {
        expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"prod"\s*{/);
        expect(stackContent).toMatch(/access_log_settings\s*{/);
      });

      test("ALB has access logs configured", () => {
        const albBlock = stackContent.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^\}/m);
        expect(albBlock).toBeTruthy();
        expect(albBlock?.[0]).toMatch(/access_logs\s*{/);
        expect(albBlock?.[0]).toMatch(/enabled\s*=\s*true/);
      });
    });

    describe("Vulnerability Management", () => {
      test("SSM Patch Manager baseline is configured", () => {
        expect(stackContent).toMatch(/resource\s+"aws_ssm_patch_baseline"\s+"security_patches"\s*{/);
      });

      test("SSM Maintenance Window is configured", () => {
        expect(stackContent).toMatch(/resource\s+"aws_ssm_maintenance_window"\s+"patch_window"\s*{/);
      });

      test("SSM Patch Group is configured", () => {
        expect(stackContent).toMatch(/resource\s+"aws_ssm_patch_group"\s+"web_servers"\s*{/);
      });

      test("EC2 instances have SSM agent in user data", () => {
        const ec2Block = stackContent.match(/resource\s+"aws_instance"\s+"web_servers"\s*{[^}]*user_data[^}]*}/s);
        expect(ec2Block?.[0]).toMatch(/amazon-ssm-agent/);
      });
    });
  });

  describe("Resource Naming and Environment Suffix", () => {
    test("uses resource_prefix local for consistent naming", () => {
      expect(stackContent).toMatch(/resource_prefix\s*=.*environment_suffix/);
    });

    test("resources use environment suffix in names", () => {
      // Check that resources use local.resource_prefix
      expect(stackContent).toMatch(/name.*\$\{local\.resource_prefix\}/i);
    });
  });

  describe("Resource Destruction Safety", () => {
    test("RDS instance has skip_final_snapshot enabled", () => {
      const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^\}/m);
      expect(rdsBlock?.[0]).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS instance has deletion_protection disabled", () => {
      const rdsBlock = stackContent.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^\}/m);
      expect(rdsBlock?.[0]).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("ALB has deletion_protection disabled", () => {
      const albBlock = stackContent.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^\}/m);
      expect(albBlock?.[0]).toMatch(/enable_deletion_protection\s*=\s*false/);
    });
  });

  describe("Outputs", () => {
    test("declares VPC ID output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares ALB DNS name output", () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    });

    test("declares RDS endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
    });

    test("RDS endpoint output is marked as sensitive", () => {
      const outputBlock = stackContent.match(/output\s+"rds_endpoint"\s*{[^}]*}/s);
      expect(outputBlock?.[0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("declares S3 bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
    });

    test("declares API Gateway URL output", () => {
      expect(stackContent).toMatch(/output\s+"api_gateway_url"\s*{/);
    });
  });

  describe("Best Practices", () => {
    test("uses data sources for AMI selection", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
    });

    test("uses random provider for unique resource naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"/);
    });

    test("uses lifecycle rules where appropriate", () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
    });

    test("resources have consistent tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test("uses locals for reusable values", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags/);
    });
  });

  describe("Critical Security Enhancements", () => {
    describe("CloudTrail Configuration", () => {
      test("declares CloudTrail resource", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      });

      test("CloudTrail has S3 bucket for logs", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
        expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail_logs\.bucket/);
      });

      test("CloudTrail has CloudWatch logs configured", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
        expect(stackContent).toMatch(/cloud_watch_logs_group_arn/);
      });
    });

    describe("WAF Protection", () => {
      test("declares WAFv2 Web ACL", () => {
        expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      });

      test("WAF includes OWASP Common Rule Set", () => {
        expect(stackContent).toMatch(/AWSManagedRulesCommonRuleSet/);
      });

      test("WAF includes SQLi protection", () => {
        expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
      });

      test("WAF is associated with ALB", () => {
        expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
        expect(stackContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
      });
    });

    describe("HTTPS/TLS Configuration", () => {
      test("declares ACM certificate", () => {
        expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
        expect(stackContent).toMatch(/validation_method\s*=\s*"DNS"/);
      });

      test("has HTTPS ALB listener", () => {
        expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web_https"/);
        expect(stackContent).toMatch(/port\s*=\s*"443"/);
        expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      });

      test("has HTTP to HTTPS redirect", () => {
        expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web_http"/);
        expect(stackContent).toMatch(/type\s*=\s*"redirect"/);
        expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      });
    });

    describe("AWS Secrets Manager Integration", () => {
      test("declares Secrets Manager secret for database", () => {
        expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
      });

      test("RDS uses managed master user password", () => {
        expect(stackContent).toMatch(/manage_master_user_password\s*=\s*true/);
        expect(stackContent).toMatch(/master_user_secret_kms_key_id\s*=\s*aws_kms_key\.rds_encryption\.arn/);
      });
    });

    describe("Network ACLs", () => {
      test("declares private network ACL", () => {
        expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
      });

      test("declares public network ACL", () => {
        expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
      });

      test("associates NACLs with subnets", () => {
        expect(stackContent).toMatch(/resource\s+"aws_network_acl_association"\s+"private"/);
        expect(stackContent).toMatch(/resource\s+"aws_network_acl_association"\s+"public"/);
      });
    });

    describe("CloudWatch Monitoring", () => {
      test("declares CloudWatch alarms for EC2 CPU", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
        expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
        expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
      });

      test("declares CloudWatch alarms for RDS CPU", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
        expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
      });

      test("declares SNS topic for alerts", () => {
        expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      });

      test("alarms are configured to send notifications", () => {
        expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/);
      });
    });

    describe("Enhanced Outputs", () => {
      test("declares CloudTrail ARN output", () => {
        expect(stackContent).toMatch(/output\s+"cloudtrail_arn"/);
        expect(stackContent).toMatch(/value\s*=\s*var\.enable_cloudtrail.*aws_cloudtrail\.main/);
      });

      test("declares WAF Web ACL ARN output", () => {
        expect(stackContent).toMatch(/output\s+"waf_web_acl_arn"/);
        expect(stackContent).toMatch(/value\s*=\s*aws_wafv2_web_acl\.main\.arn/);
      });

      test("declares Secrets Manager ARN output", () => {
        expect(stackContent).toMatch(/output\s+"secrets_manager_arn"/);
        expect(stackContent).toMatch(/value\s*=\s*aws_secretsmanager_secret\.db_credentials\.arn/);
        expect(stackContent).toMatch(/sensitive\s*=\s*true/);
      });

      test("declares SNS topic ARN output", () => {
        expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
        expect(stackContent).toMatch(/value\s*=\s*aws_sns_topic\.alerts\.arn/);
      });
    });
  });

  describe("Multi-Region Deployment", () => {
    describe("Provider Configuration", () => {
      test("declares multiple AWS providers with aliases", () => {
        const providerContent = fs.readFileSync(path.join(__dirname, '../lib/provider.tf'), 'utf8');
        expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*[^}]*alias\s*=\s*"east"/);
        expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*[^}]*alias\s*=\s*"west"/);
      });

      test("west provider uses us-west-2 region", () => {
        const providerContent = fs.readFileSync(path.join(__dirname, '../lib/provider.tf'), 'utf8');
        expect(providerContent).toMatch(/alias\s*=\s*"west"[\s\S]*?region\s*=\s*"us-west-2"/);
      });
    });

    describe("Cross-Region S3 Replication", () => {
      test("declares S3 replica buckets in us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data_replica"/);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.west/);
      });

      test("configures S3 replication for app data", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"app_data"/);
        expect(stackContent).toMatch(/destination\s*{\s*bucket\s*=\s*aws_s3_bucket\.app_data_replica\.arn/);
      });

      test("configures S3 replication for CloudTrail logs", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"cloudtrail_logs"/);
        expect(stackContent).toMatch(/aws_s3_bucket\.cloudtrail_logs_replica\.arn/);
      });

      test("declares IAM role for S3 replication", () => {
        expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
        expect(stackContent).toMatch(/s3:ReplicateObject/);
      });

      test("enables versioning on source buckets for replication", () => {
        expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"/);
        expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
      });
    });

    describe("RDS Multi-Region Setup", () => {
      test("declares RDS read replica in us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main_replica"/);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.west/);
      });

      test("RDS replica references source database", () => {
        expect(stackContent).toMatch(/replicate_source_db\s*=\s*.*aws_db_instance\.main\.identifier/);
      });

      test("RDS replica uses KMS encryption in us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds_encryption_west"/);
        expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds_encryption_west\.arn/);
      });

      test("declares KMS alias for us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds_encryption_west"/);
        expect(stackContent).toMatch(/rds-encryption-west/);
      });
    });

    describe("Multi-Region CloudTrail", () => {
      test("declares CloudTrail in us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"west"/);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.west/);
      });

      test("CloudTrail west uses replica bucket", () => {
        expect(stackContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail_logs_replica\.bucket/);
      });

      test("declares CloudWatch log group for west region", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail_west"/);
        expect(stackContent).toMatch(/cloudtrail-log-group-west/);
      });
    });

    describe("Multi-Region Monitoring", () => {
      test("declares SNS topic in us-west-2", () => {
        expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts_west"/);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.west/);
      });

      test("declares CloudWatch alarms for RDS replica", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_replica_cpu"/);
        expect(stackContent).toMatch(/provider\s*=\s*aws\.west/);
      });

      test("declares replica lag monitoring", () => {
        expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_replica_lag"/);
        expect(stackContent).toMatch(/metric_name\s*=\s*"ReplicaLag"/);
      });

      test("west region alarms use west SNS topic", () => {
        expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts_west\.arn\]/);
      });
    });

    describe("Multi-Region Outputs", () => {
      test("declares replica bucket outputs", () => {
        expect(stackContent).toMatch(/output\s+"app_data_replica_bucket_name"/);
        expect(stackContent).toMatch(/output\s+"cloudtrail_replica_bucket_name"/);
      });

      test("declares RDS replica endpoint output", () => {
        expect(stackContent).toMatch(/output\s+"rds_replica_endpoint"/);
        expect(stackContent).toMatch(/value\s*=\s*var\.enable_rds_replica.*aws_db_instance\.main_replica/);
        expect(stackContent).toMatch(/sensitive\s*=\s*true/);
      });

      test("declares west region resource outputs", () => {
        expect(stackContent).toMatch(/output\s+"cloudtrail_west_arn"/);
        expect(stackContent).toMatch(/output\s+"sns_topic_west_arn"/);
        expect(stackContent).toMatch(/output\s+"kms_key_west_arn"/);
      });
    });

    describe("Resource Tagging for Multi-Region", () => {
      test("west region resources have region tags", () => {
        expect(stackContent).toMatch(/Region\s*=\s*"us-west-2"/);
      });

      test("resources maintain consistent naming across regions", () => {
        expect(stackContent).toMatch(/app-data-replica/);
        expect(stackContent).toMatch(/cloudtrail-logs-replica/);
        expect(stackContent).toMatch(/database-replica/);
      });
    });
  });
});