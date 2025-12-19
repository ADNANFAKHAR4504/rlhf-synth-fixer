// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests multi-region secure AWS infrastructure with high availability
// No Terraform commands are executed - these are static file validation tests

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Multi-Region Security Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    if (!fs.existsSync(STACK_PATH)) {
      throw new Error(`Stack file not found at: ${STACK_PATH}`);
    }
    if (!fs.existsSync(PROVIDER_PATH)) {
      throw new Error(`Provider file not found at: ${PROVIDER_PATH}`);
    }
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  // ==================== File Structure Tests ====================
  describe("File Structure and Organization", () => {
    test("tap_stack.tf exists and is not empty", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(100);
    });

    test("provider.tf exists and is not empty", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("provider.tf contains terraform configuration block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version/);
      expect(providerContent).toMatch(/required_providers/);
    });

    test("provider.tf declares aws_region variable", () => {
      expect(providerContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("provider.tf has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  // ==================== Multi-Region Provider Tests ====================
  describe("Multi-Region Provider Configuration", () => {
    test("declares aliased provider for us-west-1", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_west_1"/);
      expect(stackContent).toMatch(/region\s*=\s*"us-west-1"/);
    });

    test("declares aliased provider for us-east-1", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_east_1"/);
      expect(stackContent).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test("providers have default_tags configured", () => {
      const westProvider = stackContent.match(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_west_1"[^}]+default_tags/s);
      const eastProvider = stackContent.match(/provider\s+"aws"\s*{\s*alias\s*=\s*"us_east_1"[^}]+default_tags/s);
      expect(westProvider).toBeTruthy();
      expect(eastProvider).toBeTruthy();
    });
  });

  // ==================== Variable Declarations ====================
  describe("Variable Declarations", () => {
    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"production"/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"secure-infra"/);
    });

    test("declares allowed_admin_ips variable", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_admin_ips"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*list\(string\)/);
    });
  });

  // ==================== Local Variables ====================
  describe("Local Variables Configuration", () => {
    test("defines common_tags locals", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/Environment\s*=/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Compliance\s*=\s*"Required"/);
    });

    test("defines VPC CIDR blocks for both regions", () => {
      expect(stackContent).toMatch(/vpc_cidr_west\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/vpc_cidr_east\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test("defines availability zones for both regions", () => {
      expect(stackContent).toMatch(/azs_west\s*=\s*\[/);
      expect(stackContent).toMatch(/azs_east\s*=\s*\[/);
      expect(stackContent).toMatch(/"us-west-1a"/);
      expect(stackContent).toMatch(/"us-east-1a"/);
    });
  });

  // ==================== KMS Encryption ====================
  describe("KMS Encryption Configuration", () => {
    test("creates KMS key for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"west"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
    });

    test("creates KMS key for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"east"\s*{/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("KMS keys have rotation enabled", () => {
      const kmsKeyBlocks = stackContent.match(/resource\s+"aws_kms_key"[^}]+enable_key_rotation\s*=\s*true/gs);
      expect(kmsKeyBlocks).toBeTruthy();
      expect(kmsKeyBlocks!.length).toBeGreaterThanOrEqual(2);
    });

    test("KMS keys have deletion window configured", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("creates KMS aliases for both regions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"west"/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"east"/);
    });
  });

  // ==================== IAM Security ====================
  describe("IAM Security Configuration", () => {
    test("creates IAM password policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
      expect(stackContent).toMatch(/minimum_password_length\s*=\s*14/);
      expect(stackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_numbers\s*=\s*true/);
      expect(stackContent).toMatch(/require_symbols\s*=\s*true/);
    });

    test("creates MFA enforcement policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"enforce_mfa"/);
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("creates EC2 IAM role with least privilege", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(stackContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test("creates EC2 IAM role policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
      expect(stackContent).toMatch(/cloudwatch:PutMetricData/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates EC2 instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });
  });

  // ==================== CloudTrail Auditing ====================
  describe("CloudTrail Auditing Configuration", () => {
    test("creates S3 bucket for CloudTrail logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/cloudtrail-logs/);
    });

    test("enables versioning on CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables encryption on CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("blocks public access to CloudTrail bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("creates CloudTrail bucket policy denying insecure transport", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/DenyInsecureTransport/);
      expect(stackContent).toMatch(/aws:SecureTransport.*false/);
    });

    test("creates multi-region CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });
  });

  // ==================== VPC US-WEST-1 ====================
  describe("VPC Configuration for us-west-1", () => {
    test("creates VPC in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"west"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr_west/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"west"/);
    });

    test("creates public subnets in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"west_public"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"west_private"/);
    });

    test("creates Elastic IPs for NAT Gateways in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"west_nat"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates NAT Gateways in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"west"/);
    });

    test("creates route tables in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"west_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"west_private"/);
    });

    test("creates route table associations in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"west_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"west_private"/);
    });
  });

  // ==================== VPC US-EAST-1 ====================
  describe("VPC Configuration for us-east-1", () => {
    test("creates VPC in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"east"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.vpc_cidr_east/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"east"/);
    });

    test("creates public subnets in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"east_public"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"east_private"/);
    });

    test("creates Elastic IPs for NAT Gateways in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"east_nat"/);
    });

    test("creates NAT Gateways in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"east"/);
    });

    test("creates route tables in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"east_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"east_private"/);
    });

    test("creates route table associations in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"east_public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"east_private"/);
    });
  });

  // ==================== Security Groups ====================
  describe("Security Group Configuration", () => {
    test("creates ALB security group for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"west_alb"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
    });

    test("ALB security group allows HTTPS inbound", () => {
      const westAlbSg = stackContent.match(/resource\s+"aws_security_group"\s+"west_alb"\s*{[\s\S]*?^}/m);
      expect(westAlbSg).toBeTruthy();
      expect(westAlbSg![0]).toMatch(/from_port\s*=\s*443/);
      expect(westAlbSg![0]).toMatch(/to_port\s*=\s*443/);
    });

    test("creates EC2 security group for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"west_ec2"/);
    });

    test("EC2 security group allows SSH from specific IPs only", () => {
      const westEc2Sg = stackContent.match(/resource\s+"aws_security_group"\s+"west_ec2"\s*{[\s\S]*?(?=resource\s+"aws_security_group"|$)/);
      expect(westEc2Sg).toBeTruthy();
      expect(westEc2Sg![0]).toMatch(/from_port\s*=\s*22/);
      expect(westEc2Sg![0]).toMatch(/cidr_blocks\s*=\s*var\.allowed_admin_ips/);
    });

    test("creates ALB security group for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"east_alb"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("creates EC2 security group for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"east_ec2"/);
    });
  });

  // ==================== S3 Buckets with Security ====================
  describe("S3 Bucket Security Configuration", () => {
    test("creates S3 data bucket for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"west_data"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
    });

    test("enables versioning on west data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"west_data"/);
    });

    test("enables KMS encryption on west data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"west_data"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.west\.arn/);
    });

    test("blocks public access to west data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"west_data"/);
    });

    test("creates VPC endpoint for S3 in us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"west_s3"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.us-west-1\.s3"/);
    });

    test("west data bucket policy denies insecure transport", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"west_data"/);
      const westPolicy = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"west_data"[\s\S]*?(?=resource\s+"|$)/);
      expect(westPolicy![0]).toMatch(/DenyInsecureTransport/);
      expect(westPolicy![0]).toMatch(/aws:SecureTransport.*false/);
    });

    test("west data bucket policy denies unencrypted uploads", () => {
      const westPolicy = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"west_data"[\s\S]*?(?=resource\s+"|$)/);
      expect(westPolicy![0]).toMatch(/DenyUnencryptedObjectUploads/);
    });

    test("west data bucket policy restricts to VPC endpoint", () => {
      const westPolicy = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"west_data"[\s\S]*?(?=resource\s+"|$)/);
      expect(westPolicy![0]).toMatch(/RestrictToVPCEndpoint/);
      expect(westPolicy![0]).toMatch(/aws:SourceVpce/);
    });

    test("creates S3 data bucket for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"east_data"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("enables versioning on east data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"east_data"/);
    });

    test("enables KMS encryption on east data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"east_data"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.east\.arn/);
    });

    test("creates VPC endpoint for S3 in us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"east_s3"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.us-east-1\.s3"/);
    });
  });

  // ==================== Launch Templates ====================
  describe("Launch Template Configuration", () => {
    test("creates launch template for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"west"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
    });

    test("west launch template uses encrypted EBS volumes", () => {
      const westLt = stackContent.match(/resource\s+"aws_launch_template"\s+"west"[\s\S]*?(?=resource\s+"aws_launch_template"\s+"east"|$)/);
      expect(westLt![0]).toMatch(/encrypted\s*=\s*true/);
      expect(westLt![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.west\.arn/);
    });

    test("west launch template uses IMDSv2", () => {
      const westLt = stackContent.match(/resource\s+"aws_launch_template"\s+"west"[\s\S]*?(?=resource\s+"aws_launch_template"\s+"east"|$)/);
      expect(westLt![0]).toMatch(/http_tokens\s*=\s*"required"/);
      expect(westLt![0]).toMatch(/metadata_options/);
    });

    test("west launch template has user data script", () => {
      const westLt = stackContent.match(/resource\s+"aws_launch_template"\s+"west"[\s\S]*?(?=resource\s+"aws_launch_template"\s+"east"|$)/);
      expect(westLt![0]).toMatch(/user_data\s*=/);
      expect(westLt![0]).toMatch(/base64encode/);
    });

    test("creates launch template for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"east"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("east launch template uses encrypted EBS volumes", () => {
      const eastLt = stackContent.match(/resource\s+"aws_launch_template"\s+"east"[\s\S]*?(?=resource\s+"aws_lb"|$)/);
      expect(eastLt![0]).toMatch(/encrypted\s*=\s*true/);
      expect(eastLt![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.east\.arn/);
    });

    test("east launch template uses IMDSv2", () => {
      const eastLt = stackContent.match(/resource\s+"aws_launch_template"\s+"east"[\s\S]*?(?=resource\s+"aws_lb"|$)/);
      expect(eastLt![0]).toMatch(/http_tokens\s*=\s*"required"/);
    });
  });

  // ==================== Application Load Balancers ====================
  describe("Application Load Balancer Configuration", () => {
    test("creates ALB for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"west"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("west ALB has security settings enabled", () => {
      const westAlb = stackContent.match(/resource\s+"aws_lb"\s+"west"[\s\S]*?(?=resource\s+"aws_lb_target_group"\s+"west"|$)/);
      expect(westAlb![0]).toMatch(/drop_invalid_header_fields\s*=\s*true/);
      expect(westAlb![0]).toMatch(/enable_http2\s*=\s*true/);
    });

    test("creates target group for west ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"west"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test("west target group has health checks configured", () => {
      const westTg = stackContent.match(/resource\s+"aws_lb_target_group"\s+"west"[\s\S]*?(?=resource\s+"aws_lb_listener"|$)/);
      expect(westTg![0]).toMatch(/health_check\s*{/);
      expect(westTg![0]).toMatch(/protocol\s*=\s*"HTTPS"/);
    });

    test("creates HTTPS listener for west ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"west_https"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    });

    test("creates ALB for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"east"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("creates target group for east ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"east"/);
    });

    test("creates HTTPS listener for east ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"east_https"/);
      expect(stackContent).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    });
  });

  // ==================== Auto Scaling Groups ====================
  describe("Auto Scaling Group Configuration", () => {
    test("creates ASG for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"west"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
    });

    test("west ASG has min, max, and desired capacity configured", () => {
      const westAsg = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"west"[\s\S]*?(?=resource\s+"aws_autoscaling_policy"\s+"west_cpu"|$)/);
      expect(westAsg![0]).toMatch(/min_size\s*=\s*2/);
      expect(westAsg![0]).toMatch(/max_size\s*=\s*6/);
      expect(westAsg![0]).toMatch(/desired_capacity\s*=\s*2/);
    });

    test("west ASG has ELB health check configured", () => {
      const westAsg = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"west"[\s\S]*?(?=resource\s+"aws_autoscaling_policy"\s+"west_cpu"|$)/);
      expect(westAsg![0]).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(westAsg![0]).toMatch(/health_check_grace_period/);
    });

    test("west ASG has CloudWatch metrics enabled", () => {
      const westAsg = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"west"[\s\S]*?(?=resource\s+"aws_autoscaling_policy"\s+"west_cpu"|$)/);
      expect(westAsg![0]).toMatch(/enabled_metrics\s*=/);
    });

    test("creates scaling policy for west ASG", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"west_cpu"/);
      expect(stackContent).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
    });

    test("creates ASG for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"east"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("east ASG has high availability configuration", () => {
      const eastAsg = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"east"[\s\S]*?(?=resource\s+"aws_autoscaling_policy"\s+"east_cpu"|$)/);
      expect(eastAsg![0]).toMatch(/min_size\s*=\s*2/);
      expect(eastAsg![0]).toMatch(/max_size\s*=\s*6/);
    });

    test("creates scaling policy for east ASG", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"east_cpu"/);
    });
  });

  // ==================== CloudWatch Logging ====================
  describe("CloudWatch Log Group Configuration", () => {
    test("creates log group for us-west-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"west_app"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_west_1/);
    });

    test("west log group has encryption enabled", () => {
      const westLog = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"west_app"[\s\S]*?(?=resource\s+"aws_cloudwatch_log_group"\s+"east_app"|$)/);
      expect(westLog![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.west\.arn/);
    });

    test("west log group has retention configured", () => {
      const westLog = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"west_app"[\s\S]*?(?=resource\s+"aws_cloudwatch_log_group"\s+"east_app"|$)/);
      expect(westLog![0]).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("creates log group for us-east-1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"east_app"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.us_east_1/);
    });

    test("east log group has encryption enabled", () => {
      const eastLog = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"east_app"[\s\S]*?(?=output|$)/);
      expect(eastLog![0]).toMatch(/kms_key_id\s*=\s*aws_kms_key\.east\.arn/);
    });
  });

  // ==================== Outputs ====================
  describe("Output Configuration", () => {
    test("declares output for west ALB DNS", () => {
      expect(stackContent).toMatch(/output\s+"west_alb_dns"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lb\.west\.dns_name/);
    });

    test("declares output for east ALB DNS", () => {
      expect(stackContent).toMatch(/output\s+"east_alb_dns"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lb\.east\.dns_name/);
    });

    test("declares output for west VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"west_vpc_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.west\.id/);
    });

    test("declares output for east VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"east_vpc_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.east\.id/);
    });

    test("declares output for CloudTrail bucket", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_bucket"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
    });

    test("declares output for KMS key IDs", () => {
      expect(stackContent).toMatch(/output\s+"west_kms_key_id"/);
      expect(stackContent).toMatch(/output\s+"east_kms_key_id"/);
    });
  });

  // ==================== Security Best Practices ====================
  describe("Security Best Practices Validation", () => {
    test("no hardcoded secrets or credentials", () => {
      // Check for common patterns that might indicate hardcoded secrets
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"(?!.*var\.)/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"(?!.*var\.)/i);
      expect(stackContent).not.toMatch(/api[_-]?key\s*=\s*"[^"]+"(?!.*var\.)/i);
    });

    test("encryption is enforced for data at rest", () => {
      // Verify KMS encryption is used
      const kmsReferences = stackContent.match(/kms_key_id|kms_master_key_id/g);
      expect(kmsReferences).toBeTruthy();
      expect(kmsReferences!.length).toBeGreaterThan(5);
    });

    test("encryption is enforced for data in transit", () => {
      // Verify HTTPS/TLS is enforced
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/ssl_policy/);
      expect(stackContent).toMatch(/aws:SecureTransport/);
    });

    test("all S3 buckets block public access", () => {
      const s3Buckets = stackContent.match(/resource\s+"aws_s3_bucket"/g);
      const publicAccessBlocks = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g);
      
      expect(s3Buckets).toBeTruthy();
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(3); // cloudtrail, west_data, east_data
    });

    test("IAM follows least privilege principle", () => {
      expect(stackContent).toMatch(/ec2:DescribeVolumes/);
      expect(stackContent).toMatch(/cloudwatch:PutMetricData/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
      // Should not have wildcard permissions
      const iamPolicies = stackContent.match(/Action.*\*/);
      // Some wildcards are okay in specific contexts, but verify they're limited
      expect(stackContent).not.toMatch(/Action.*=.*\["?\*"?\]/);
    });

    test("resources are properly tagged", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      const tagMerges = stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(tagMerges).toBeTruthy();
      expect(tagMerges!.length).toBeGreaterThan(10);
    });

    test("multi-region deployment for high availability", () => {
      // Verify resources in both regions
      const westResources = stackContent.match(/provider\s*=\s*aws\.us_west_1/g);
      const eastResources = stackContent.match(/provider\s*=\s*aws\.us_east_1/g);
      
      expect(westResources).toBeTruthy();
      expect(eastResources).toBeTruthy();
      expect(westResources!.length).toBeGreaterThan(10);
      expect(eastResources!.length).toBeGreaterThan(10);
    });

    test("NAT Gateways for private subnet internet access", () => {
      const natGateways = stackContent.match(/resource\s+"aws_nat_gateway"/g);
      expect(natGateways).toBeTruthy();
      expect(natGateways!.length).toBeGreaterThanOrEqual(2); // At least one per region
    });

    test("ALB uses TLS 1.2 or higher", () => {
      expect(stackContent).toMatch(/ELBSecurityPolicy-TLS-1-2-2017-01/);
    });

    test("IMDSv2 is required for EC2 instances", () => {
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
    });
  });

  // ==================== Compliance and Governance ====================
  describe("Compliance and Governance", () => {
    test("CloudTrail logs all API activities", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("log file validation is enabled", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("S3 versioning is enabled for compliance", () => {
      const versioningResources = stackContent.match(/resource\s+"aws_s3_bucket_versioning"/g);
      expect(versioningResources).toBeTruthy();
      expect(versioningResources!.length).toBeGreaterThanOrEqual(3);
    });

    test("password policy meets compliance requirements", () => {
      expect(stackContent).toMatch(/minimum_password_length\s*=\s*14/);
      expect(stackContent).toMatch(/password_reuse_prevention/);
      expect(stackContent).toMatch(/max_password_age/);
    });

    test("MFA is enforced for console access", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
      expect(stackContent).toMatch(/enforce_mfa/);
    });
  });
});

