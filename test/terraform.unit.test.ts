// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Configuration Files", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Existence and Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(100);
    });

    test("provider.tf is not empty", () => {
      expect(providerContent.length).toBeGreaterThan(50);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+/);
    });

    test("provider.tf contains aws provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider.tf includes random provider", () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });

    test("provider.tf includes tls provider", () => {
      expect(providerContent).toMatch(/tls\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/tls"/);
    });

    test("provider.tf has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test("tap_stack.tf does NOT declare provider block", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform block", () => {
      expect(stackContent).not.toMatch(/terraform\s*{\s*required_version/);
    });
  });

  describe("Variable Configuration", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region has us-west-1 as default", () => {
      expect(stackContent).toMatch(/default\s*=\s*"us-west-1"/);
    });

    test("aws_region has string type", () => {
      expect(stackContent).toMatch(/type\s*=\s*string/);
    });

    test("aws_region has description", () => {
      expect(stackContent).toMatch(/description\s*=\s*"[^"]+"/);
    });
  });

  describe("Local Variables", () => {
    test("defines common_tags", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
    });

    test("common_tags includes Environment", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*"prod"/);
    });

    test("common_tags includes Owner", () => {
      expect(stackContent).toMatch(/Owner\s*=\s*"/);
    });

    test("common_tags includes ManagedBy", () => {
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("defines name_prefix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"prod"/);
    });

    test("defines vpc_id", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*"vpc-123456"/);
    });

    test("defines availability zones", () => {
      expect(stackContent).toMatch(/azs\s*=\s*\[/);
      expect(stackContent).toMatch(/us-west-1a/);
      expect(stackContent).toMatch(/us-west-1b/);
    });

    test("defines public subnet CIDRs", () => {
      expect(stackContent).toMatch(/public_subnet_cidrs\s*=\s*\[/);
    });

    test("defines private subnet CIDRs", () => {
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=\s*\[/);
    });

    test("defines allowed IP CIDR", () => {
      expect(stackContent).toMatch(/allowed_ip_cidr\s*=\s*"203\.0\.113\.0\/24"/);
    });
  });

  describe("VPC and Networking", () => {
    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test("public subnets use for_each", () => {
      const publicSubnet = stackContent.match(/resource\s+"aws_subnet"\s+"public"[\s\S]{0,500}/);
      expect(publicSubnet?.[0]).toMatch(/for_each/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("private subnets use for_each", () => {
      const privateSubnet = stackContent.match(/resource\s+"aws_subnet"\s+"private"[\s\S]{0,500}/);
      expect(privateSubnet?.[0]).toMatch(/for_each/);
    });

    test("creates Elastic IPs for NAT", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("EIPs use vpc domain", () => {
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("NAT Gateway depends on Internet Gateway", () => {
      const natGw = stackContent.match(/resource\s+"aws_nat_gateway"[\s\S]{0,500}/);
      expect(natGw?.[0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("creates public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("public route table has IGW route", () => {
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates private route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("private route tables have NAT gateway routes", () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main/);
    });

    test("creates route table associations for public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("creates route table associations for private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("KMS and Encryption", () => {
    test("creates KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("KMS key has rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("creates KMS key alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("KMS alias references the key", () => {
      expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  describe("S3 Buckets", () => {
    test("creates ALB logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);
    });

    test("creates audit logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs"/);
    });

    test("creates Config bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });

    test("creates CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("enables versioning for buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables server-side encryption for buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks public access on all buckets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("S3 buckets use account ID for uniqueness", () => {
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });

    test("creates bucket policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test("ALB SG allows HTTPS from allowed IP", () => {
      const albSg = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]{0,500}/);
      expect(albSg?.[0]).toMatch(/from_port\s*=\s*443/);
      expect(albSg?.[0]).toMatch(/to_port\s*=\s*443/);
    });

    test("ALB SG allows HTTP for redirect", () => {
      const albSg = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]{0,500}/);
      expect(albSg?.[0]).toMatch(/from_port\s*=\s*80/);
    });

    test("creates EC2 security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test("EC2 SG allows traffic from ALB", () => {
      const ec2Sg = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"[\s\S]{0,500}/);
      expect(ec2Sg?.[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("RDS SG allows traffic from EC2", () => {
      const rdsSg = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]{0,500}/);
      expect(rdsSg?.[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("RDS SG uses MySQL port", () => {
      const rdsSg = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]{0,500}/);
      expect(rdsSg?.[0]).toMatch(/from_port\s*=\s*3306/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
    });

    test("creates EC2 IAM policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"ec2"/);
    });

    test("EC2 policy allows CloudWatch Logs", () => {
      const ec2Policy = stackContent.match(/resource\s+"aws_iam_policy"\s+"ec2"[\s\S]{0,1500}/);
      expect(ec2Policy?.[0]).toMatch(/logs:CreateLogGroup/);
      expect(ec2Policy?.[0]).toMatch(/logs:PutLogEvents/);
    });

    test("EC2 policy does not use wildcard actions", () => {
      const ec2Policy = stackContent.match(/resource\s+"aws_iam_policy"\s+"ec2"[\s\S]{0,1500}/);
      expect(ec2Policy?.[0]).not.toMatch(/"Action"\s*:\s*"\*"/);
    });

    test("creates IAM instance profile for EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
    });

    test("creates Config IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
    });

    test("creates CloudTrail IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail"/);
    });

    test("attaches policies to roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    });

    test("uses AWS managed ConfigRole policy", () => {
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/ConfigRole/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("ALB is application type", () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB is internet-facing", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB has deletion protection", () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*true/);
    });

    test("ALB enables HTTP/2", () => {
      expect(stackContent).toMatch(/enable_http2\s*=\s*true/);
    });

    test("ALB has access logs enabled", () => {
      const alb = stackContent.match(/resource\s+"aws_lb"\s+"main"[\s\S]{0,700}/);
      expect(alb?.[0]).toMatch(/access_logs\s*{/);
    });

    test("creates target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });

    test("target group has health check", () => {
      const tg = stackContent.match(/resource\s+"aws_lb_target_group"[\s\S]{0,700}/);
      expect(tg?.[0]).toMatch(/health_check\s*{/);
    });

    test("target group health check path is /health", () => {
      expect(stackContent).toMatch(/path\s*=\s*"\/health"/);
    });

    test("target group has stickiness", () => {
      const tg = stackContent.match(/resource\s+"aws_lb_target_group"[\s\S]{0,700}/);
      expect(tg?.[0]).toMatch(/stickiness\s*{/);
    });

    test("creates HTTPS listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(stackContent).toMatch(/port\s*=\s*"443"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test("HTTPS listener uses TLS 1.3 policy", () => {
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS13/);
    });

    test("creates HTTP listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
    });

    test("HTTP listener redirects to HTTPS", () => {
      const httpListener = stackContent.match(/resource\s+"aws_lb_listener"\s+"http"[\s\S]{0,400}/);
      expect(httpListener?.[0]).toMatch(/type\s*=\s*"redirect"/);
      expect(httpListener?.[0]).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(httpListener?.[0]).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });
  });

  describe("TLS Certificate", () => {
    test("creates TLS private key", () => {
      expect(stackContent).toMatch(/resource\s+"tls_private_key"\s+"main"/);
    });

    test("TLS key uses RSA algorithm", () => {
      expect(stackContent).toMatch(/algorithm\s*=\s*"RSA"/);
    });

    test("TLS key has 2048 bits", () => {
      expect(stackContent).toMatch(/rsa_bits\s*=\s*2048/);
    });

    test("creates self-signed certificate", () => {
      expect(stackContent).toMatch(/resource\s+"tls_self_signed_cert"\s+"main"/);
    });

    test("certificate has validity period", () => {
      expect(stackContent).toMatch(/validity_period_hours\s*=\s*8760/);
    });

    test("imports certificate to ACM", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
    });
  });

  describe("RDS Database", () => {
    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("DB subnet group uses private subnets", () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*\[for\s+subnet\s+in\s+aws_subnet\.private/);
    });

    test("creates RDS instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test("RDS uses MySQL engine", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("RDS has encryption enabled", () => {
      const rds = stackContent.match(/resource\s+"aws_db_instance"[\s\S]{0,1500}/);
      expect(rds?.[0]).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS uses KMS encryption", () => {
      const rds = stackContent.match(/resource\s+"aws_db_instance"[\s\S]{0,1500}/);
      expect(rds?.[0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("RDS is not publicly accessible", () => {
      const rds = stackContent.match(/resource\s+"aws_db_instance"[\s\S]{0,1500}/);
      expect(rds?.[0]).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS has deletion protection", () => {
      const rds = stackContent.match(/resource\s+"aws_db_instance"[\s\S]{0,1500}/);
      expect(rds?.[0]).toMatch(/deletion_protection\s*=\s*true/);
    });

    test("RDS has backup retention", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*30/);
    });

    test("RDS has CloudWatch logs", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
    });

    test("creates random password for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds"/);
    });

    test("random password has proper length", () => {
      expect(stackContent).toMatch(/length\s*=\s*32/);
    });

    test("random password includes special chars", () => {
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });

    test("stores password in Secrets Manager", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_password"/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"rds_password"/);
    });
  });

  describe("AWS Config", () => {
    test("creates Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test("Config tracks all resources", () => {
      const config = stackContent.match(/resource\s+"aws_config_configuration_recorder"[\s\S]{0,500}/);
      expect(config?.[0]).toMatch(/all_supported\s*=\s*true/);
    });

    test("Config includes global resources", () => {
      const config = stackContent.match(/resource\s+"aws_config_configuration_recorder"[\s\S]{0,500}/);
      expect(config?.[0]).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("creates Config delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("Config delivers daily snapshots", () => {
      expect(stackContent).toMatch(/delivery_frequency\s*=\s*"TwentyFour_Hours"/);
    });

    test("enables Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(stackContent).toMatch(/is_enabled\s*=\s*true/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"main"/);
    });

    test("log group has retention", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });

    test("log group uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main/);
    });

    test("creates SNS topic for alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
    });

    test("SNS topic uses KMS encryption", () => {
      const sns = stackContent.match(/resource\s+"aws_sns_topic"\s+"alarms"[\s\S]{0,300}/);
      expect(sns?.[0]).toMatch(/kms_master_key_id/);
    });

    test("creates SNS subscription", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"/);
    });

    test("creates alarm for SG changes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"security_group_changes"/);
    });

    test("creates alarm for IAM changes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"iam_policy_changes"/);
    });

    test("creates metric filter for SG changes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"security_group_changes"/);
    });

    test("creates metric filter for IAM changes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"iam_changes"/);
    });

    test("metric filters use CloudTrailMetrics namespace", () => {
      expect(stackContent).toMatch(/namespace\s*=\s*"CloudTrailMetrics"/);
    });
  });

  describe("CloudTrail", () => {
    test("creates CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("CloudTrail logging is enabled", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/enable_logging\s*=\s*true/);
    });

    test("CloudTrail is multi-region", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("CloudTrail has log validation", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail uses KMS encryption", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/kms_key_id/);
    });

    test("CloudTrail logs to CloudWatch", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/cloud_watch_logs_group_arn/);
    });

    test("CloudTrail includes global events", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("CloudTrail has event selectors", () => {
      const trail = stackContent.match(/resource\s+"aws_cloudtrail"[\s\S]{0,1500}/);
      expect(trail?.[0]).toMatch(/event_selector\s*{/);
    });
  });

  describe("Data Sources", () => {
    test("uses aws_caller_identity", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses aws_vpc data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_vpc"\s+"existing"/);
    });

    test("uses aws_elb_service_account", () => {
      expect(stackContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);
    });
  });

  describe("Outputs", () => {
    test("defines ALB DNS name output", () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test("defines RDS endpoint output", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("defines Config recorder output", () => {
      expect(stackContent).toMatch(/output\s+"config_recorder_name"/);
    });

    test("defines SNS topic output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test("outputs have descriptions", () => {
      const outputs = stackContent.match(/output\s+"[\w_]+"\s*{[\s\S]{0,200}description/g);
      expect(outputs).toBeTruthy();
      expect(outputs!.length).toBeGreaterThan(0);
    });
  });

  describe("Tagging", () => {
    test("uses merge function for tags", () => {
      const mergeCount = (stackContent.match(/merge\s*\(/g) || []).length;
      expect(mergeCount).toBeGreaterThan(20);
    });

    test("resources have Name tags", () => {
      const nameTagCount = (stackContent.match(/Name\s*=\s*"\$\{local\.name_prefix\}/g) || []).length;
      expect(nameTagCount).toBeGreaterThan(10);
    });

    test("all major resources are tagged", () => {
      const taggedResources = (stackContent.match(/tags\s*=\s*merge/g) || []).length;
      expect(taggedResources).toBeGreaterThan(15);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded passwords", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[a-zA-Z0-9]{8,}"/);
    });

    test("uses random_password for secrets", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"/);
    });

    test("all S3 buckets have encryption", () => {
      const buckets = (stackContent.match(/resource\s+"aws_s3_bucket"\s+"\w+"/g) || []).length;
      const encryption = (stackContent.match(/aws_s3_bucket_server_side_encryption_configuration/g) || []).length;
      expect(encryption).toBeGreaterThanOrEqual(buckets);
    });

    test("all S3 buckets block public access", () => {
      const buckets = (stackContent.match(/resource\s+"aws_s3_bucket"\s+"\w+"/g) || []).length;
      const blocks = (stackContent.match(/aws_s3_bucket_public_access_block/g) || []).length;
      expect(blocks).toBeGreaterThanOrEqual(buckets);
    });

    test("RDS final snapshot is enabled", () => {
      expect(stackContent).not.toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("deletion protection is enabled", () => {
      const protectionCount = (stackContent.match(/deletion_protection\s*=\s*true/g) || []).length;
      expect(protectionCount).toBeGreaterThan(1);
    });
  });

  describe("Resource Naming", () => {
    test("resources use name_prefix for naming", () => {
      const prefixUsage = (stackContent.match(/\$\{local\.name_prefix\}/g) || []).length;
      expect(prefixUsage).toBeGreaterThan(30);
    });

    test("S3 bucket names are properly formatted", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"/);
      const bucketCount = (stackContent.match(/resource\s+"aws_s3_bucket"\s+"\w+"/g) || []).length;
      expect(bucketCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("High Availability", () => {
    test("resources deployed across multiple AZs", () => {
      expect(stackContent).toMatch(/us-west-1a/);
      expect(stackContent).toMatch(/us-west-1b/);
    });

    test("uses for_each for multi-AZ resources", () => {
      const forEachCount = (stackContent.match(/for_each\s*=/g) || []).length;
      expect(forEachCount).toBeGreaterThan(5);
    });
  });

  describe("Compliance", () => {
    test("CloudWatch log retention is configured", () => {
      expect(stackContent).toMatch(/retention_in_days/);
    });

    test("backup retention is configured", () => {
      expect(stackContent).toMatch(/backup_retention_period/);
    });

    test("audit logging is enabled", () => {
      expect(stackContent).toMatch(/aws_cloudtrail/);
      expect(stackContent).toMatch(/aws_config_configuration_recorder/);
    });
  });

  describe("Code Quality", () => {
    test("uses locals for DRY principle", () => {
      expect(stackContent).toMatch(/locals\s*{/);
    });

    test("uses for expressions", () => {
      expect(stackContent).toMatch(/\[for\s+\w+\s+in\s+/);
    });

    test("file has proper header", () => {
      expect(stackContent).toMatch(/^#.*tap_stack/);
    });

    test("has sufficient resource count", () => {
      const resourceCount = (stackContent.match(/^resource\s+"/gm) || []).length;
      expect(resourceCount).toBeGreaterThan(40);
    });
  });
});
