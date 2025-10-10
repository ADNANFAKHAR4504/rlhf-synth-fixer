// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform configuration files
// No Terraform or CDKTF commands are executed.
import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Configuration Files", () => {
  describe("File Existence", () => {
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
        console.error(`[unit] Expected provider at: ${providerPath}`);
      }
      expect(exists).toBe(true);
    });
  });

  describe("provider.tf Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("declares required Terraform version", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("declares AWS provider with correct version", () => {
      expect(providerContent).toMatch(/aws\s*=\s*{\s*source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("declares random provider with correct version", () => {
      expect(providerContent).toMatch(/random\s*=\s*{\s*source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*3\.0"/);
    });

    test("declares AWS provider configuration", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("includes default_tags configuration", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });
  });

  describe("tap_stack.tf Variables", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares all required variables", () => {
      const requiredVariables = [
        "aws_region",
        "vpc_cidr",
        "public_subnet_cidrs",
        "private_subnet_cidrs",
        "allowed_ssh_ips",
        "ec2_instance_type",
        "environment",
        "owner",
        "cost_center",
        "project_prefix",
        "domain_name"
      ];

      requiredVariables.forEach(variable => {
        expect(stackContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("aws_region variable has correct default", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{[^}]*default\s*=\s*"us-east-1"/);
    });

    test("vpc_cidr variable has correct default", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{[^}]*default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("ec2_instance_type variable has correct default", () => {
      expect(stackContent).toMatch(/variable\s+"ec2_instance_type"\s*{[^}]*default\s*=\s*"t3\.micro"/);
    });

    test("environment variable has correct default", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{[^}]*default\s*=\s*"Production"/);
    });
  });

  describe("tap_stack.tf Data Sources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares required data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(stackContent).toMatch(/data\s+"aws_organizations_organization"\s+"current"/);
    });

    test("aws_ami data source has correct filters", () => {
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(stackContent).toMatch(/name\s*=\s*"name"/);
      expect(stackContent).toMatch(/values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/);
    });
  });

  describe("tap_stack.tf Locals", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares locals block", () => {
      expect(stackContent).toMatch(/locals\s*{/);
    });

    test("declares common_tags", () => {
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_prefix/);
    });

    test("declares availability zones", () => {
      expect(stackContent).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });

    test("declares S3 bucket names", () => {
      expect(stackContent).toMatch(/s3_logging_bucket\s*=/);
      expect(stackContent).toMatch(/s3_app_bucket\s*=/);
    });

    test("declares CloudTrail name", () => {
      expect(stackContent).toMatch(/cloudtrail_name\s*=/);
    });
  });

  describe("tap_stack.tf Core Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("declares internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("declares NAT gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("declares route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("declares route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("tap_stack.tf Security Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares security groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_instances"/);
    });

    test("declares IAM roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
    });

    test("declares IAM policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"/);
    });

    test("declares IAM role policy attachments", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    });

    test("declares instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"/);
    });
  });

  describe("tap_stack.tf KMS Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares KMS keys", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"ebs_encryption"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_encryption"/);
    });

    test("declares KMS aliases", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"ebs_encryption"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_encryption"/);
    });

    test("KMS keys have proper configuration", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe("tap_stack.tf S3 Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares S3 buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logging"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"application"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudfront_logs"/);
    });

    test("declares S3 bucket configurations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
    });

    test("declares S3 bucket lifecycle", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test("declares S3 bucket ACL and ownership", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_acl"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_ownership_controls"/);
    });
  });

  describe("tap_stack.tf Compute Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares launch template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app_servers"/);
    });

    test("declares auto scaling group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app_servers"/);
    });

    test("launch template has proper configuration", () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(stackContent).toMatch(/instance_type\s*=\s*var\.ec2_instance_type/);
      expect(stackContent).toMatch(/vpc_security_group_ids/);
      expect(stackContent).toMatch(/iam_instance_profile/);
    });

    test("auto scaling group has proper configuration", () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private/);
      expect(stackContent).toMatch(/min_size\s*=\s*1/);
      expect(stackContent).toMatch(/max_size\s*=\s*3/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*2/);
    });
  });

  describe("tap_stack.tf Monitoring and Logging", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares VPC flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs"/);
    });

    test("declares CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("declares CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test("declares AWS Config resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"/);
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"/);
    });
  });

  describe("tap_stack.tf CDN and WAF", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares CloudFront distribution", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test("declares CloudFront origin access identity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"/);
    });

    test("declares WAF web ACL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"/);
    });
  });

  describe("tap_stack.tf Backup and Recovery", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares AWS Backup resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_backup_vault"/);
      expect(stackContent).toMatch(/resource\s+"aws_backup_plan"/);
      expect(stackContent).toMatch(/resource\s+"aws_backup_selection"/);
    });

    test("declares IAM role for AWS Backup", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"backup_service"/);
    });
  });

  describe("tap_stack.tf API Gateway", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares API Gateway REST API", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"/);
    });

    test("declares API Gateway resource policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api_policy"/);
    });
  });

  describe("tap_stack.tf SNS Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("declares SNS topic policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"alerts"/);
    });

    test("SNS topic has KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
    });
  });

  describe("tap_stack.tf CloudWatch Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares CloudWatch metric filters", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"/);
    });

    test("declares CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("has alarm for unauthorized API calls", () => {
      expect(stackContent).toMatch(/UnauthorizedAPICalls/);
    });

    test("has alarm for root account usage", () => {
      expect(stackContent).toMatch(/RootAccountUsage/);
    });
  });

  describe("tap_stack.tf IAM Password Policy", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares IAM password policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"/);
    });

    test("password policy has strong requirements", () => {
      expect(stackContent).toMatch(/minimum_password_length\s*=\s*14/);
      expect(stackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_numbers\s*=\s*true/);
      expect(stackContent).toMatch(/require_symbols\s*=\s*true/);
      expect(stackContent).toMatch(/max_password_age\s*=\s*90/);
      expect(stackContent).toMatch(/password_reuse_prevention\s*=\s*5/);
    });
  });

  describe("tap_stack.tf Service Control Policy", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares Organizations SCP for MFA enforcement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_organizations_policy"\s+"require_mfa"/);
    });

    test("SCP is conditionally created for Production environment", () => {
      expect(stackContent).toMatch(/count\s*=\s*var\.environment\s*==\s*"Production"\s*\?\s*1\s*:\s*0/);
    });

    test("SCP enforces MFA requirement", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });
  });

  describe("tap_stack.tf Outputs", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("declares required outputs", () => {
      const requiredOutputs = [
        "vpc_id",
        "private_subnet_ids",
        "public_subnet_ids",
        "cloudfront_distribution_domain",
        "sns_topic_arn",
        "logging_bucket",
        "backup_vault_name"
      ];

      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("outputs have descriptions", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{\s*description/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{\s*description/);
    });
  });

  describe("tap_stack.tf Validation Rules", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("does NOT declare terraform block in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/^terraform\s*{/m);
    });

    test("uses proper resource naming convention", () => {
      // Check that resources use descriptive names with project prefix
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.project_prefix}-/);
    });

    test("uses proper tagging strategy", () => {
      // Check that resources use merge(local.common_tags, ...) pattern
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test("has proper encryption configuration", () => {
      // Check that EBS volumes are encrypted
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      // Check that S3 buckets have encryption
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("has proper security configurations", () => {
      // Check that public access is blocked on some S3 buckets
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      // Check that instances have proper metadata options
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test("CloudTrail has multi-region enabled", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail has log file validation", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("VPC Flow Logs use Parquet format", () => {
      expect(stackContent).toMatch(/file_format\s*=\s*"parquet"/);
    });

    test("VPC Flow Logs have hourly partitions", () => {
      expect(stackContent).toMatch(/per_hour_partition\s*=\s*true/);
    });

    test("Auto Scaling Group has health check grace period", () => {
      expect(stackContent).toMatch(/health_check_grace_period\s*=\s*300/);
    });

    test("Launch template has detailed monitoring", () => {
      expect(stackContent).toMatch(/monitoring\s*{\s*enabled\s*=\s*true/);
    });

    test("CloudFront has WAF associated", () => {
      expect(stackContent).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });

    test("CloudFront enforces HTTPS", () => {
      expect(stackContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test("WAF has rate limiting rule", () => {
      expect(stackContent).toMatch(/rate_based_statement\s*{\s*limit\s*=\s*2000/);
    });

    test("S3 lifecycle has proper transitions", () => {
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("AWS Config tracks all resources", () => {
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("KMS keys have rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("S3 buckets have versioning enabled", () => {
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });
  });

  describe("tap_stack.tf Resource Dependencies", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("VPC resources depend on VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("subnets depend on VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("NAT gateway depends on EIP", () => {
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test("route table associations depend on subnets", () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\./);
    });

    test("instances depend on security groups", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\./);
    });

    test("S3 bucket policies depend on buckets", () => {
      expect(stackContent).toMatch(/bucket\s*=\s*aws_s3_bucket\./);
    });
  });
});
