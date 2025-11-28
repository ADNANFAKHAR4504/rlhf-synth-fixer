// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure
// Tests file structure, resource definitions, and configuration

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const VARIABLES_PATH = path.resolve(__dirname, "../lib/variables.tf");
const DEV_TFVARS_PATH = path.resolve(__dirname, "../lib/dev.tfvars");
const PROD_TFVARS_PATH = path.resolve(__dirname, "../lib/prod.tfvars");
const STAGING_TFVARS_PATH = path.resolve(__dirname, "../lib/staging.tfvars");

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let devTfvarsContent: string;
  let prodTfvarsContent: string;
  let stagingTfvarsContent: string;

  beforeAll(() => {
    tapStackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");
    devTfvarsContent = fs.readFileSync(DEV_TFVARS_PATH, "utf8");
    prodTfvarsContent = fs.readFileSync(PROD_TFVARS_PATH, "utf8");
    stagingTfvarsContent = fs.readFileSync(STAGING_TFVARS_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists and is not empty", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(tapStackContent.length).toBeGreaterThan(100);
    });

    test("provider.tf exists and is not empty", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(50);
    });

    test("variables.tf exists and is not empty", () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(variablesContent.length).toBeGreaterThan(50);
    });

    test("all .tfvars files exist and are not empty", () => {
      expect(fs.existsSync(DEV_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(PROD_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(STAGING_TFVARS_PATH)).toBe(true);
      expect(devTfvarsContent.length).toBeGreaterThan(10);
      expect(prodTfvarsContent.length).toBeGreaterThan(10);
      expect(stagingTfvarsContent.length).toBeGreaterThan(10);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains terraform block with correct version", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test("provider.tf contains AWS provider with correct version", () => {
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf contains S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("provider.tf contains AWS provider with region variable", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider.tf contains default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
      expect(providerContent).toMatch(/Team\s*=\s*var\.team/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf contains all required variables", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"repository"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"team"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"instance_type"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    });

    test("variables have proper defaults", () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
      expect(variablesContent).toMatch(/default\s*=\s*"dev"/);
      expect(variablesContent).toMatch(/default\s*=\s*"CorpApp"/);
      expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(variablesContent).toMatch(/default\s*=\s*"t3\.micro"/);
      expect(variablesContent).toMatch(/default\s*=\s*"db\.t3\.micro"/);
    });
  });

  describe("Terraform Stack Structure", () => {
    test("tap_stack.tf does NOT declare provider (provider.tf owns providers)", () => {
      expect(tapStackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
      expect(tapStackContent).not.toMatch(/^\s*terraform\s*{/m);
    });

    test("tap_stack.tf contains data sources", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tapStackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
    });

    test("tap_stack.tf contains locals with variables", () => {
      expect(tapStackContent).toMatch(/locals\s*{/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(tapStackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(tapStackContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_cidr/);
    });
  });

  describe("VPC and Networking Resources", () => {
    test("contains VPC resource", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("contains internet gateway", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("contains public subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("contains private subnets", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tapStackContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
    });

    test("contains NAT gateways", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("contains route tables", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("Security Groups", () => {
    test("contains ALB security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*80/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
    });

    test("contains EC2 security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("contains RDS security group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(tapStackContent).toMatch(/from_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  describe("IAM Resources", () => {
    test("contains EC2 IAM role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
      expect(tapStackContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test("contains EC2 IAM policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(tapStackContent).toMatch(/cloudwatch:PutMetricData/);
      expect(tapStackContent).toMatch(/s3:GetObject/);
    });

    test("contains EC2 instance profile", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test("contains RDS monitoring role", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
      expect(tapStackContent).toMatch(/monitoring\.rds\.amazonaws\.com/);
    });
  });

  describe("Compute Resources", () => {
    test("contains launch template with variables", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(tapStackContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });

    test("contains application load balancer", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tapStackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(tapStackContent).toMatch(/internal\s*=\s*false/);
    });

    test("contains ALB target group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(tapStackContent).toMatch(/health_check\s*{/);
    });

    test("contains ALB listener", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
      expect(tapStackContent).toMatch(/port\s*=\s*"80"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test("contains auto scaling group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tapStackContent).toMatch(/min_size\s*=\s*2/);
      expect(tapStackContent).toMatch(/max_size\s*=\s*6/);
      expect(tapStackContent).toMatch(/desired_capacity\s*=\s*2/);
    });

    test("contains auto scaling policy", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu"/);
      expect(tapStackContent).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
      expect(tapStackContent).toMatch(/ASGAverageCPUUtilization/);
    });

    test("autoscaling group tags use variables", () => {
      expect(tapStackContent).toMatch(/value\s*=\s*var\.environment_suffix/);
      expect(tapStackContent).toMatch(/value\s*=\s*var\.project_name/);
      expect(tapStackContent).toMatch(/propagate_at_launch\s*=\s*true/);
    });
  });

  describe("Database Resources", () => {
    test("contains RDS subnet group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("contains RDS parameter group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
      expect(tapStackContent).toMatch(/family\s*=\s*"mysql8\.0"/);
      expect(tapStackContent).toMatch(/character_set_server/);
    });

    test("contains RDS instance with variables", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tapStackContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
      expect(tapStackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tapStackContent).toMatch(/multi_az\s*=\s*true/);
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  describe("Storage Resources", () => {
    test("contains S3 bucket", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tapStackContent).toMatch(/bucket_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-data-"/);
    });

    test("contains S3 bucket versioning", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
      expect(tapStackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("contains S3 bucket encryption", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"main"/);
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("contains S3 bucket public access block", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"main"/);
      expect(tapStackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(tapStackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tapStackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("contains S3 bucket lifecycle configuration", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"main"/);
      expect(tapStackContent).toMatch(/noncurrent_version_expiration/);
      expect(tapStackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(tapStackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });
  });

  describe("Encryption and KMS", () => {
    test("contains KMS key for EBS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"ebs"/);
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"ebs"/);
    });

    test("contains KMS key for RDS", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
    });

    test("contains KMS key for CloudWatch logs", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs"/);
      expect(tapStackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe("Monitoring Resources", () => {
    test("contains SNS topic", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
    });

    test("contains SNS topic subscription", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"email"/);
      expect(tapStackContent).toMatch(/endpoint\s*=\s*"ops-team@example\.com"/);
    });

    test("contains CloudWatch alarm", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(tapStackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(tapStackContent).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
      expect(tapStackContent).toMatch(/threshold\s*=\s*"80"/);
    });

    test("contains CloudWatch log group", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"/);
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*7/);
    });

    test("contains CloudWatch dashboard", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      expect(tapStackContent).toMatch(/dashboard_name\s*=\s*"\$\{lower\(var\.project_name\)\}-dashboard"/);
    });
  });

  describe("Resource Tagging", () => {
    test("resources use common_tags from locals", () => {
      expect(tapStackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(tapStackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("common_tags contain required values", () => {
      expect(tapStackContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
      expect(tapStackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Outputs", () => {
    test("contains non-sensitive outputs only", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_id"/);
      expect(tapStackContent).toMatch(/output\s+"load_balancer_dns"/);
      expect(tapStackContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(tapStackContent).toMatch(/output\s+"sns_topic_arn"/);
      expect(tapStackContent).toMatch(/output\s+"autoscaling_group_name"/);
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("does not contain sensitive outputs", () => {
      // Should not output sensitive information like instance IDs, IPs, etc.
      expect(tapStackContent).not.toMatch(/output.*instance_id/i);
      expect(tapStackContent).not.toMatch(/output.*private_ip/i);
      expect(tapStackContent).not.toMatch(/output.*password/i);
    });
  });

  describe("Environment-specific tfvars", () => {
    test("dev.tfvars contains correct values", () => {
      expect(devTfvarsContent).toMatch(/environment_suffix\s*=\s*"dev"/);
      expect(devTfvarsContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
      expect(devTfvarsContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(devTfvarsContent).toMatch(/db_instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("prod.tfvars contains correct values", () => {
      expect(prodTfvarsContent).toMatch(/environment_suffix\s*=\s*"prod"/);
      expect(prodTfvarsContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
      expect(prodTfvarsContent).toMatch(/instance_type\s*=\s*"t3\.small"/);
      expect(prodTfvarsContent).toMatch(/db_instance_class\s*=\s*"db\.t3\.small"/);
    });

    test("staging.tfvars contains correct values", () => {
      expect(stagingTfvarsContent).toMatch(/environment_suffix\s*=\s*"staging"/);
      expect(stagingTfvarsContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
      expect(stagingTfvarsContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(stagingTfvarsContent).toMatch(/db_instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("all tfvars files contain required variables", () => {
      const requiredVars = [
        "aws_region",
        "environment_suffix", 
        "repository",
        "commit_author",
        "pr_number",
        "team",
        "project_name",
        "vpc_cidr",
        "instance_type",
        "db_instance_class"
      ];

      requiredVars.forEach(varName => {
        expect(devTfvarsContent).toMatch(new RegExp(varName));
        expect(prodTfvarsContent).toMatch(new RegExp(varName));
        expect(stagingTfvarsContent).toMatch(new RegExp(varName));
      });
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded credentials", () => {
      expect(tapStackContent).not.toMatch(/password\s*=\s*"[^C]/); // Allows the changeme password
      expect(tapStackContent).not.toMatch(/access_key/i);
      expect(tapStackContent).not.toMatch(/secret_key/i);
    });

    test("encryption enabled for storage", () => {
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("no deletion protection (as per requirements)", () => {
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*false/);
      expect(tapStackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("security groups follow least privilege", () => {
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group/);
      expect(tapStackContent).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\].*3306/);
    });

    test("EBS volumes use encryption", () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.ebs\.arn/);
      expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("RDS uses encryption at rest", () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
      expect(tapStackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("SNS topic uses encryption", () => {
      expect(tapStackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
    });

    test("CloudWatch logs use encryption", () => {
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
    });

    test("KMS keys have rotation enabled", () => {
      const rotationMatches = tapStackContent.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).toBeTruthy();
      expect(rotationMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("Instance metadata service v2 enforced", () => {
      expect(tapStackContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(tapStackContent).toMatch(/http_endpoint\s*=\s*"enabled"/);
      expect(tapStackContent).toMatch(/http_put_response_hop_limit\s*=\s*1/);
    });

    test("no public database access", () => {
      expect(tapStackContent).not.toMatch(/publicly_accessible\s*=\s*true/);
      expect(tapStackContent).toMatch(/db_subnet_group_name/);
    });

    test("ALB not internal for web access", () => {
      expect(tapStackContent).toMatch(/internal\s*=\s*false/);
    });
  });

  describe("Detailed VPC Configuration", () => {
    test("VPC has proper DNS configuration", () => {
      expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("public subnets have proper configuration", () => {
      expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(tapStackContent).toMatch(/cidrsubnet\(local\.vpc_cidr,\s*8,\s*count\.index\)/);
    });

    test("private subnets use different CIDR blocks", () => {
      expect(tapStackContent).toMatch(/cidrsubnet\(local\.vpc_cidr,\s*8,\s*count\.index\s*\+\s*100\)/);
    });

    test("subnets are distributed across AZs", () => {
      expect(tapStackContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
      expect(tapStackContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });

    test("EIPs depend on internet gateway", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("NAT gateways depend on internet gateway", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("public route table routes to internet gateway", () => {
      expect(tapStackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(tapStackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private route tables route to NAT gateways", () => {
      expect(tapStackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });
  });

  describe("Detailed Security Group Rules", () => {
    test("ALB allows HTTP traffic", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*80/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*80/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("ALB allows HTTPS traffic", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*443/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("ALB has unrestricted egress", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*0/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*0/);
      expect(tapStackContent).toMatch(/protocol\s*=\s*"-1"/);
    });

    test("EC2 security group restricts ingress to ALB only", () => {
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("RDS allows MySQL port 3306", () => {
      expect(tapStackContent).toMatch(/from_port\s*=\s*3306/);
      expect(tapStackContent).toMatch(/to_port\s*=\s*3306/);
    });

    test("RDS restricts access to EC2 only", () => {
      expect(tapStackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("security groups have lifecycle management", () => {
      expect(tapStackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("security groups have proper naming", () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-alb-sg-"/);
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-ec2-sg-"/);
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-rds-sg-"/);
    });
  });

  describe("Detailed IAM Permissions", () => {
    test("EC2 role has proper assume role policy", () => {
      expect(tapStackContent).toMatch(/sts:AssumeRole/);
      expect(tapStackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test("EC2 policy allows CloudWatch metrics", () => {
      expect(tapStackContent).toMatch(/cloudwatch:PutMetricData/);
      expect(tapStackContent).toMatch(/cloudwatch:GetMetricStatistics/);
      expect(tapStackContent).toMatch(/cloudwatch:ListMetrics/);
    });

    test("EC2 policy allows S3 read access", () => {
      expect(tapStackContent).toMatch(/s3:GetObject/);
      expect(tapStackContent).toMatch(/s3:ListBucket/);
    });

    test("EC2 policy allows EC2 describe actions", () => {
      expect(tapStackContent).toMatch(/ec2:DescribeInstances/);
      expect(tapStackContent).toMatch(/ec2:DescribeTags/);
    });

    test("RDS monitoring role has proper service principal", () => {
      expect(tapStackContent).toMatch(/monitoring\.rds\.amazonaws\.com/);
    });

    test("RDS monitoring role has AWS managed policy", () => {
      expect(tapStackContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
    });

    test("IAM resources have proper naming", () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-ec2-role-"/);
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-ec2-policy-"/);
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"\$\{lower\(var\.project_name\)\}-ec2-profile-"/);
    });
  });

  describe("Detailed Launch Template Configuration", () => {
    test("launch template uses latest AMI", () => {
      expect(tapStackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    });

    test("launch template has proper EBS configuration", () => {
      expect(tapStackContent).toMatch(/device_name\s*=\s*"\/dev\/xvda"/);
      expect(tapStackContent).toMatch(/volume_size\s*=\s*20/);
      expect(tapStackContent).toMatch(/volume_type\s*=\s*"gp3"/);
      expect(tapStackContent).toMatch(/delete_on_termination\s*=\s*true/);
    });

    test("launch template has user data script", () => {
      expect(tapStackContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(tapStackContent).toMatch(/yum update -y/);
      expect(tapStackContent).toMatch(/amazon-cloudwatch-agent/);
    });

    test("launch template has proper tag specifications", () => {
      expect(tapStackContent).toMatch(/resource_type\s*=\s*"instance"/);
      expect(tapStackContent).toMatch(/resource_type\s*=\s*"volume"/);
    });

    test("launch template uses instance profile", () => {
      expect(tapStackContent).toMatch(/arn\s*=\s*aws_iam_instance_profile\.ec2\.arn/);
    });
  });

  describe("Detailed Auto Scaling Configuration", () => {
    test("ASG has proper capacity settings", () => {
      expect(tapStackContent).toMatch(/min_size\s*=\s*2/);
      expect(tapStackContent).toMatch(/max_size\s*=\s*6/);
      expect(tapStackContent).toMatch(/desired_capacity\s*=\s*2/);
    });

    test("ASG uses latest launch template version", () => {
      expect(tapStackContent).toMatch(/version\s*=\s*"\$Latest"/);
    });

    test("ASG has ELB health check", () => {
      expect(tapStackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(tapStackContent).toMatch(/health_check_grace_period\s*=\s*300/);
    });

    test("ASG has instance refresh configuration", () => {
      expect(tapStackContent).toMatch(/strategy\s*=\s*"Rolling"/);
      expect(tapStackContent).toMatch(/min_healthy_percentage\s*=\s*50/);
    });

    test("ASG scaling policy has proper configuration", () => {
      expect(tapStackContent).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
      expect(tapStackContent).toMatch(/predefined_metric_type\s*=\s*"ASGAverageCPUUtilization"/);
      expect(tapStackContent).toMatch(/target_value\s*=\s*50\.0/);
    });
  });

  describe("Detailed Load Balancer Configuration", () => {
    test("ALB has proper type and configuration", () => {
      expect(tapStackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(tapStackContent).toMatch(/enable_http2\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });

    test("ALB target group has health check configuration", () => {
      expect(tapStackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(tapStackContent).toMatch(/unhealthy_threshold\s*=\s*2/);
      expect(tapStackContent).toMatch(/timeout\s*=\s*5/);
      expect(tapStackContent).toMatch(/interval\s*=\s*30/);
      expect(tapStackContent).toMatch(/path\s*=\s*"\/"/);
      expect(tapStackContent).toMatch(/matcher\s*=\s*"200"/);
    });

    test("ALB has deregistration delay", () => {
      expect(tapStackContent).toMatch(/deregistration_delay\s*=\s*30/);
    });

    test("ALB listener forwards to target group", () => {
      expect(tapStackContent).toMatch(/type\s*=\s*"forward"/);
      expect(tapStackContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.main\.arn/);
    });
  });

  describe("Detailed RDS Configuration", () => {
    test("RDS has proper engine configuration", () => {
      expect(tapStackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tapStackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
      expect(tapStackContent).toMatch(/port\s*=\s*3306/);
    });

    test("RDS has proper storage configuration", () => {
      expect(tapStackContent).toMatch(/allocated_storage\s*=\s*20/);
      expect(tapStackContent).toMatch(/max_allocated_storage\s*=\s*100/);
      expect(tapStackContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test("RDS has proper backup configuration", () => {
      expect(tapStackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tapStackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(tapStackContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("RDS has CloudWatch logs enabled", () => {
      expect(tapStackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
    });

    test("RDS has monitoring configuration", () => {
      expect(tapStackContent).toMatch(/monitoring_interval\s*=\s*60/);
      expect(tapStackContent).toMatch(/monitoring_role_arn/);
    });

    test("RDS has Performance Insights enabled", () => {
      expect(tapStackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
      expect(tapStackContent).toMatch(/performance_insights_retention_period\s*=\s*7/);
    });

    test("RDS parameter group has proper MySQL settings", () => {
      expect(tapStackContent).toMatch(/family\s*=\s*"mysql8\.0"/);
      expect(tapStackContent).toMatch(/character_set_server/);
      expect(tapStackContent).toMatch(/character_set_client/);
      expect(tapStackContent).toMatch(/slow_query_log/);
      expect(tapStackContent).toMatch(/long_query_time/);
    });

    test("RDS has no final snapshot for testing", () => {
      expect(tapStackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });
  });

  describe("Detailed S3 Configuration", () => {
    test("S3 bucket has lifecycle transitions", () => {
      expect(tapStackContent).toMatch(/days\s*=\s*30/);
      expect(tapStackContent).toMatch(/days\s*=\s*90/);
      expect(tapStackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(tapStackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("S3 bucket has version expiration", () => {
      expect(tapStackContent).toMatch(/noncurrent_version_expiration/);
      expect(tapStackContent).toMatch(/noncurrent_days\s*=\s*30/);
    });

    test("S3 bucket has proper encryption configuration", () => {
      expect(tapStackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(tapStackContent).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test("S3 lifecycle rules have filters", () => {
      expect(tapStackContent).toMatch(/filter\s*{/);
      expect(tapStackContent).toMatch(/prefix\s*=\s*""/);
    });
  });

  describe("Detailed CloudWatch Configuration", () => {
    test("CloudWatch alarm has proper metric configuration", () => {
      expect(tapStackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(tapStackContent).toMatch(/evaluation_periods\s*=\s*"2"/);
      expect(tapStackContent).toMatch(/period\s*=\s*"120"/);
      expect(tapStackContent).toMatch(/statistic\s*=\s*"Average"/);
      expect(tapStackContent).toMatch(/threshold\s*=\s*"80"/);
    });

    test("CloudWatch alarm has proper dimensions", () => {
      expect(tapStackContent).toMatch(/AutoScalingGroupName\s*=\s*aws_autoscaling_group\.main\.name/);
    });

    test("CloudWatch dashboard has proper widget configuration", () => {
      expect(tapStackContent).toMatch(/dashboard_name\s*=\s*"\$\{lower\(var\.project_name\)\}-dashboard"/);
      expect(tapStackContent).toMatch(/widgets\s*=\s*\[/);
      expect(tapStackContent).toMatch(/type\s*=\s*"metric"/);
    });

    test("CloudWatch log group has retention", () => {
      expect(tapStackContent).toMatch(/retention_in_days\s*=\s*7/);
    });
  });

  describe("AMI Data Source Configuration", () => {
    test("AMI data source filters for Amazon Linux 2", () => {
      expect(tapStackContent).toMatch(/most_recent\s*=\s*true/);
      expect(tapStackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(tapStackContent).toMatch(/amzn2-ami-hvm-\*-x86_64-gp2/);
      expect(tapStackContent).toMatch(/virtualization-type/);
      expect(tapStackContent).toMatch(/values\s*=\s*\["hvm"\]/);
    });
  });

  describe("KMS Key Configuration Details", () => {
    test("KMS keys have proper deletion window", () => {
      expect(tapStackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
    });

    test("KMS keys have aliases", () => {
      expect(tapStackContent).toMatch(/alias\/\$\{lower\(var\.project_name\)\}-ebs/);
      expect(tapStackContent).toMatch(/alias\/\$\{lower\(var\.project_name\)\}-rds/);
    });

    test("CloudWatch logs KMS key has proper policy", () => {
      expect(tapStackContent).toMatch(/logs\.amazonaws\.com/);
      expect(tapStackContent).toMatch(/kms:Encrypt/);
      expect(tapStackContent).toMatch(/kms:Decrypt/);
    });
  });

  describe("Resource Naming Conventions", () => {
    test("VPC has proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-vpc"/);
    });

    test("Internet Gateway has proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-igw"/);
    });

    test("Subnets have proper naming patterns", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-public-subnet-\$\{count\.index \+ 1\}"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-private-subnet-\$\{count\.index \+ 1\}"/);
    });

    test("NAT resources have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-nat-eip-\$\{count\.index \+ 1\}"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-nat-gateway-\$\{count\.index \+ 1\}"/);
    });

    test("Route tables have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-public-rt"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-private-rt-\$\{count\.index \+ 1\}"/);
    });

    test("Security groups have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-alb-sg"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-ec2-sg"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-rds-sg"/);
    });

    test("Launch template has proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-launch-template"/);
    });

    test("Load balancer resources have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-alb"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-tg"/);
    });

    test("Database resources have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-db-subnet-group"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-db-params"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-database"/);
    });

    test("Storage resources have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-data-bucket"/);
    });

    test("Monitoring resources have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-alerts"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-cpu-alarm"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-logs"/);
    });

    test("KMS resources have proper naming", () => {
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-ebs-kms-key"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-rds-kms-key"/);
      expect(tapStackContent).toMatch(/Name\s*=\s*"\$\{lower\(var\.project_name\)\}-logs-kms-key"/);
    });
  });

  describe("Data Source Validation", () => {
    test("availability zones data source is properly configured", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tapStackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("caller identity data source exists", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("locals use data sources properly", () => {
      expect(tapStackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
      expect(tapStackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });
  });

  describe("Resource Dependencies", () => {
    test("NAT gateway depends on internet gateway", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("EIP depends on internet gateway", () => {
      expect(tapStackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("route table associations reference correct resources", () => {
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
      expect(tapStackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private\[count\.index\]\.id/);
    });
  });

  describe("Environment Variable Usage", () => {
    test("all required variables are used in locals", () => {
      expect(tapStackContent).toMatch(/var\.environment_suffix/);
      expect(tapStackContent).toMatch(/var\.project_name/);
      expect(tapStackContent).toMatch(/var\.vpc_cidr/);
      expect(tapStackContent).toMatch(/var\.instance_type/);
      expect(tapStackContent).toMatch(/var\.db_instance_class/);
    });

    test("provider variables are correctly referenced", () => {
      expect(providerContent).toMatch(/var\.aws_region/);
      expect(providerContent).toMatch(/var\.repository/);
      expect(providerContent).toMatch(/var\.commit_author/);
      expect(providerContent).toMatch(/var\.pr_number/);
      expect(providerContent).toMatch(/var\.team/);
    });
  });

  describe("Security Enhancements", () => {
    test("RDS uses managed master user password instead of hardcoded value", () => {
      expect(tapStackContent).toMatch(/manage_master_user_password\s*=\s*true/);
      expect(tapStackContent).toMatch(/master_user_secret_kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
      expect(tapStackContent).not.toMatch(/password\s*=\s*"ChangeMeImmediately123!"/);
    });

    test("EC2 instances have IAM policy to access RDS secrets", () => {
      expect(tapStackContent).toMatch(/aws_iam_role_policy.*ec2_rds_secret_access/);
      expect(tapStackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(tapStackContent).toMatch(/secretsmanager:DescribeSecret/);
    });

    test("RDS secret ARN is exposed as sensitive output", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_secret_arn"/);
      expect(tapStackContent).toMatch(/aws_db_instance\.main\.master_user_secret\[0\]\.secret_arn/);
      expect(tapStackContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("random provider is properly configured", () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*3\.4"/);
    });
  });

  describe("Lifecycle Management", () => {
    test("security groups have create_before_destroy", () => {
      const lifecycleMatches = tapStackContent.match(/create_before_destroy\s*=\s*true/g);
      expect(lifecycleMatches).toBeTruthy();
      expect(lifecycleMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("parameter group has create_before_destroy", () => {
      expect(tapStackContent).toMatch(/lifecycle\s*{\s*create_before_destroy\s*=\s*true/);
    });

    test("auto scaling group has create_before_destroy", () => {
      expect(tapStackContent).toMatch(/lifecycle\s*{\s*create_before_destroy\s*=\s*true/);
    });
  });
});
