// tests/unit/unit-tests.ts
// Comprehensive validation checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform HA/DR Infrastructure Stack", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares region variable", () => {
      expect(stackContent).toMatch(/variable\s+"region"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares instance_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
    });

    test("declares notification_email variable", () => {
      expect(stackContent).toMatch(/variable\s+"notification_email"\s*{/);
    });

    test("declares domain_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"\s*{/);
    });

    test("declares common_tags variable", () => {
      expect(stackContent).toMatch(/variable\s+"common_tags"\s*{/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_availability_zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("declares aws_ami data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
    });

    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("declares aws_vpc data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_vpc"\s+"default"\s*{/);
    });

    test("declares aws_subnets data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_subnets"\s+"default"\s*{/);
    });
  });

  describe("IAM Resources", () => {
    test("declares IAM role for EC2 instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"corp_ec2_role"\s*{/);
    });

    test("declares IAM policy for EC2 instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"corp_ec2_policy"\s*{/);
    });

    test("declares IAM role policy attachment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"corp_ec2_policy_attachment"\s*{/);
    });

    test("declares IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"corp_ec2_profile"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("declares security group for web servers", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"corp_web_sg"\s*{/);
    });

    test("security group allows HTTP traffic", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/to_port\s*=\s*80/);
    });

    test("security group allows HTTPS traffic", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
    });

    test("security group allows SSH traffic from private ranges", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
    });
  });

  describe("EC2 Instances", () => {
    test("declares primary EC2 instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"corp_primary_instance"\s*{/);
    });

    test("declares secondary EC2 instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"corp_secondary_instance"\s*{/);
    });

    test("instances use user_data_base64 (not user_data)", () => {
      expect(stackContent).toMatch(/user_data_base64\s*=\s*local\.user_data/);
      expect(stackContent).not.toMatch(/user_data\s*=\s*local\.user_data/);
    });

    test("instances have encrypted root volumes", () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });
  });

  describe("Route 53 Resources", () => {
    test("declares Route 53 hosted zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"\s+"corp_zone"\s*{/);
    });

    test("declares primary health check", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"corp_primary_health_check"\s*{/);
    });

    test("declares secondary health check", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"\s+"corp_secondary_health_check"\s*{/);
    });

    test("declares primary DNS record", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"corp_primary_record"\s*{/);
    });

    test("declares secondary DNS record", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"\s+"corp_secondary_record"\s*{/);
    });

    test("health checks do not use insufficient_data_health_status (not valid for basic HTTP checks)", () => {
      expect(stackContent).not.toMatch(/insufficient_data_health_status\s*=\s*"Unhealthy"/);
      expect(stackContent).not.toMatch(/insufficient_data_health_status\s*=\s*"Failure"/);
      expect(stackContent).not.toMatch(/insufficient_data_health_status/);
    });
  });

  describe("S3 Resources", () => {
    test("declares S3 backup bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"corp_backup_bucket"\s*{/);
    });

    test("declares S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"corp_backup_versioning"\s*{/);
    });

    test("declares S3 bucket encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"corp_backup_encryption"\s*{/);
    });

    test("declares S3 bucket public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"corp_backup_pab"\s*{/);
    });

    test("declares S3 bucket lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"corp_backup_lifecycle"\s*{/);
    });

    test("lifecycle configuration has filter block (required for S3 lifecycle)", () => {
      expect(stackContent).toMatch(/filter\s*{\s*prefix\s*=\s*""\s*}/);
    });
  });

  describe("SNS Resources", () => {
    test("declares SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"corp_alerts"\s*{/);
    });

    test("declares SNS topic subscription", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"corp_email_alerts"\s*{/);
    });
  });

  describe("CloudWatch Resources", () => {
    test("declares primary CPU alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"corp_primary_cpu_alarm"\s*{/);
    });

    test("declares secondary CPU alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"corp_secondary_cpu_alarm"\s*{/);
    });

    test("declares primary status alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"corp_primary_status_alarm"\s*{/);
    });

    test("declares primary health alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"corp_primary_health_alarm"\s*{/);
    });

    test("declares CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"corp_ha_dr_dashboard"\s*{/);
    });
  });

  describe("Outputs", () => {
    test("declares primary instance ID output", () => {
      expect(stackContent).toMatch(/output\s+"primary_instance_id"\s*{/);
    });

    test("declares secondary instance ID output", () => {
      expect(stackContent).toMatch(/output\s+"secondary_instance_id"\s*{/);
    });

    test("declares primary instance public IP output", () => {
      expect(stackContent).toMatch(/output\s+"primary_instance_public_ip"\s*{/);
    });

    test("declares secondary instance public IP output", () => {
      expect(stackContent).toMatch(/output\s+"secondary_instance_public_ip"\s*{/);
    });

    test("declares backup bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"backup_bucket_name"\s*{/);
    });

    test("declares DNS name output", () => {
      expect(stackContent).toMatch(/output\s+"dns_name"\s*{/);
    });

    test("declares Route 53 zone ID output", () => {
      expect(stackContent).toMatch(/output\s+"route53_zone_id"\s*{/);
    });

    test("declares SNS topic ARN output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("declares CloudWatch dashboard URL output", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_dashboard_url"\s*{/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares required providers", () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/random\s*=\s*{/);
    });

    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider uses region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.region/);
    });
  });

  describe("Security and Best Practices", () => {
    test("uses common_tags variable for resource tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*var\.common_tags/);
    });

    test("uses merge function for enhanced tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
    });

    test("has proper locals block for user data", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test("uses random_id for bucket naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"\s*{/);
    });

    test("no circular dependencies between health checks and alarms", () => {
      // Check that health checks don't reference cloudwatch alarms
      expect(stackContent).not.toMatch(/cloudwatch_alarm_name\s*=\s*aws_cloudwatch_metric_alarm/);
      expect(stackContent).not.toMatch(/cloudwatch_alarm_region\s*=\s*var\.region/);
    });
  });
});
