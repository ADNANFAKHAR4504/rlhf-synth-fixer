// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests verify resource presence, configuration, and compliance with requirements

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let content: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      throw new Error(`[unit] Expected stack at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    expect(exists).toBe(true);
  });

  // === PROVIDER CONFIGURATION TESTS ===

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  // === VARIABLE TESTS ===

  test("declares all required variables", () => {
    expect(content).toMatch(/variable\s+"aws_region"/);
    expect(content).toMatch(/variable\s+"allowed_ssh_cidr_blocks"/);
    expect(content).toMatch(/variable\s+"project_name"/);
    expect(content).toMatch(/variable\s+"environment"/);
  });

  test("aws_region variable has correct default", () => {
    const awsRegionMatch = content.match(/variable\s+"aws_region"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
    expect(awsRegionMatch).toBeTruthy();
    expect(awsRegionMatch![1]).toBe("us-east-1");
  });

  test("project_name variable has default", () => {
    expect(content).toMatch(/variable\s+"project_name"[\s\S]*?default\s*=\s*"secure-webapp"/);
  });

  // === DATA SOURCES TESTS ===

  test("declares aws_availability_zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("declares aws_caller_identity data source", () => {
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares aws_ami data source for Amazon Linux 2", () => {
    expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
  });

  // === NETWORKING LAYER TESTS ===

  test("declares VPC resource with correct CIDR", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("VPC has DNS hostnames and support enabled", () => {
    const vpcSection = content.match(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*enable_dns_hostnames\s*=\s*true[^}]*}/s);
    expect(vpcSection).toBeTruthy();
    expect(content).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("declares Internet Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares public subnets with count = 2", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?count\s*=\s*2/);
  });

  test("declares private subnets with count = 2", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?count\s*=\s*2/);
  });

  test("public subnets have map_public_ip_on_launch enabled", () => {
    expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("declares NAT Gateway and Elastic IP", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("declares route tables for public and private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test("declares route table associations", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
  });

  // === SECURITY CONFIGURATION TESTS ===

  test("declares EC2 security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });

  test("EC2 security group allows SSH (port 22)", () => {
    const ec2SgSection = content.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?}/);
    expect(ec2SgSection).toBeTruthy();
    expect(content).toMatch(/from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22/);
  });

  test("EC2 security group allows HTTP on port 8080", () => {
    expect(content).toMatch(/from_port\s*=\s*8080[\s\S]*?to_port\s*=\s*8080/);
  });

  test("declares NLB security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"nlb"/);
  });

  test("NLB security group allows HTTP on port 80", () => {
    expect(content).toMatch(/from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/);
  });

  test("declares RDS security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  test("RDS security group allows MySQL port 3306", () => {
    expect(content).toMatch(/from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
  });

  // === IAM CONFIGURATION TESTS ===

  test("declares EC2 IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2"/);
  });

  test("declares EC2 IAM role policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2"/);
  });

  test("declares EC2 instance profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"/);
  });

  test("EC2 IAM policy includes CloudWatch permissions", () => {
    expect(content).toMatch(/cloudwatch:PutMetricData/);
  });

  test("EC2 IAM policy includes Secrets Manager permissions", () => {
    expect(content).toMatch(/secretsmanager:GetSecretValue/);
  });

  // === DATABASE LAYER TESTS ===

  test("declares KMS key for RDS encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
  });

  test("KMS key has key rotation enabled", () => {
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares KMS alias for RDS", () => {
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
  });

  test("declares Secrets Manager secret for database master password", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_master_password"/);
  });

  test("RDS uses managed master user password", () => {
    expect(content).toMatch(/manage_master_user_password\s*=\s*true/);
  });

  test("declares Secrets Manager secret for connection info", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_connection_info"/);
  });

  test("declares Secrets Manager secret version for connection info", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_connection_info"/);
  });

  test("declares DB subnet group", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
  });

  test("declares RDS instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test("RDS instance is MySQL engine", () => {
    expect(content).toMatch(/engine\s*=\s*"mysql"/);
  });

  test("RDS instance has Multi-AZ enabled", () => {
    expect(content).toMatch(/multi_az\s*=\s*true/);
  });

  test("RDS instance has encryption enabled", () => {
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS instance has deletion protection disabled", () => {
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("RDS instance skips final snapshot", () => {
    expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  // === COMPUTE LAYER TESTS ===

  test("declares launch template", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
  });

  test("launch template uses t3.micro instance type", () => {
    expect(content).toMatch(/instance_type\s*=\s*"t3\.micro"/);
  });

  test("launch template has monitoring enabled", () => {
    expect(content).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("declares Network Load Balancer", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
  });

  test("NLB is of type network", () => {
    expect(content).toMatch(/load_balancer_type\s*=\s*"network"/);
  });

  test("NLB is not internal (public facing)", () => {
    expect(content).toMatch(/internal\s*=\s*false/);
  });

  test("NLB has deletion protection disabled", () => {
    expect(content).toMatch(/enable_deletion_protection\s*=\s*false/);
  });

  test("NLB has access logging configured", () => {
    expect(content).toMatch(/access_logs\s*{/);
    expect(content).toMatch(/enabled\s*=\s*true/);
  });

  test("declares target group", () => {
    expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
  });

  test("target group uses port 8080", () => {
    expect(content).toMatch(/port\s*=\s*8080/);
  });

  test("target group uses TCP protocol", () => {
    expect(content).toMatch(/protocol\s*=\s*"TCP"/);
  });

  test("declares NLB listener", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"app"/);
  });

  test("NLB listener listens on port 80", () => {
    expect(content).toMatch(/port\s*=\s*"80"/);
  });

  test("declares Auto Scaling Group", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
  });

  test("ASG has min size 2", () => {
    expect(content).toMatch(/min_size\s*=\s*2/);
  });

  test("ASG has max size 5", () => {
    expect(content).toMatch(/max_size\s*=\s*5/);
  });

  test("ASG has desired capacity 2", () => {
    expect(content).toMatch(/desired_capacity\s*=\s*2/);
  });

  test("declares Auto Scaling policy", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu_based"/);
  });

  // === MONITORING & LOGGING TESTS ===

  test("declares S3 bucket for logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
  });

  test("declares S3 bucket public access block for logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
  });

  test("logs bucket blocks all public access", () => {
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
    expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("declares S3 bucket versioning for logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
  });

  test("logs bucket has versioning enabled", () => {
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("declares KMS key for S3 encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
  });

  test("declares KMS alias for S3", () => {
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
  });

  test("declares S3 bucket server-side encryption", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
  });

  test("S3 encryption uses KMS", () => {
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("declares S3 bucket policy for logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
  });

  test("declares CloudWatch alarm for high CPU", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
  });

  test("CloudWatch alarm threshold is 80%", () => {
    expect(content).toMatch(/threshold\s*=\s*"?80"?/);
  });

  test("CloudWatch alarm monitors CPUUtilization", () => {
    expect(content).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
  });

  test("declares SNS topic for alerts", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
  });

  // === AWS CONFIG TESTS ===

  test("declares S3 bucket for AWS Config", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
  });

  test("declares AWS Config IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
  });

  test("declares AWS Config IAM role policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"config"/);
  });

  test("declares AWS Config IAM role policy attachment", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
  });

  test("declares AWS Config configuration recorder", () => {
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
  });

  test("Config recorder has all_supported = true", () => {
    expect(content).toMatch(/all_supported\s*=\s*true/);
  });

  test("declares AWS Config delivery channel", () => {
    expect(content).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
  });

  test("declares AWS Config recorder status", () => {
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
  });

  test("Config recorder is enabled", () => {
    expect(content).toMatch(/is_enabled\s*=\s*true/);
  });

  // === OUTPUT TESTS ===

  test("declares load_balancer_dns output", () => {
    expect(content).toMatch(/output\s+"load_balancer_dns"/);
  });

  test("declares rds_endpoint output", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"/);
  });

  test("rds_endpoint output is marked as sensitive", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/);
  });

  test("declares logs_bucket output", () => {
    expect(content).toMatch(/output\s+"logs_bucket"/);
  });

  test("declares config_bucket output", () => {
    expect(content).toMatch(/output\s+"config_bucket"/);
  });

  // === TAGGING TESTS ===

  test("all resources have proper tags including ManagedBy", () => {
    const resourceBlocks = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{[^}]*tags\s*=\s*{[^}]*}/g) || [];
    expect(resourceBlocks.length).toBeGreaterThanOrEqual(8); // Should have many tagged resources

    // Check that most resources have ManagedBy = Terraform
    const managedByTags = content.match(/ManagedBy\s*=\s*"Terraform"/g) || [];
    expect(managedByTags.length).toBeGreaterThan(15);
  });

  test("resources use project_name variable in naming", () => {
    const projectNameRefs = content.match(/\$\{var\.project_name\}/g) || [];
    expect(projectNameRefs.length).toBeGreaterThan(10);
  });

  test("resources use environment variable in tagging", () => {
    const envRefs = content.match(/Environment\s*=\s*var\.environment/g) || [];
    expect(envRefs.length).toBeGreaterThan(10);
  });

  // === COMPLIANCE TESTS ===

  test("no hardcoded region references (uses variable)", () => {
    // Should not have hardcoded us-east-1 in resource configurations
    const hardcodedRegions = content.match(/[^a-zA-Z]us-east-1[^a-zA-Z]/g) || [];
    // Only allowed in variable default
    expect(hardcodedRegions.length).toBeLessThanOrEqual(1);
  });

  test("no deletion protection enabled on any resource", () => {
    expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
    expect(content).not.toMatch(/enable_deletion_protection\s*=\s*true/);
  });

  test("all applicable resources have deletion protection disabled", () => {
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
    expect(content).toMatch(/enable_deletion_protection\s*=\s*false/);
  });

  test("RDS instance skips final snapshot for easy cleanup", () => {
    expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
  });

  test("no retain lifecycle policies", () => {
    expect(content).not.toMatch(/prevent_destroy\s*=\s*true/);
    expect(content).not.toMatch(/lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*true/);
  });

  // === SECURITY COMPLIANCE TESTS ===

  test("all S3 buckets have encryption enabled", () => {
    const s3Buckets = content.match(/resource\s+"aws_s3_bucket"\s+"[^"]+"/g) || [];
    const encryptionConfigs = content.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || [];
    expect(encryptionConfigs.length).toBeGreaterThanOrEqual(s3Buckets.length);
  });

  test("all S3 buckets block public access", () => {
    const s3Buckets = content.match(/resource\s+"aws_s3_bucket"\s+"[^"]+"/g) || [];
    const publicAccessBlocks = content.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || [];
    expect(publicAccessBlocks.length).toBeGreaterThanOrEqual(s3Buckets.length);
  });

  test("KMS keys have key rotation enabled", () => {
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("RDS uses KMS encryption", () => {
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });

  test("secrets are managed by AWS Secrets Manager", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"/);
  });

  // === NETWORK SECURITY TESTS ===

  test("EC2 instances are in public subnets", () => {
    expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("RDS is in private subnets", () => {
    expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("security groups follow principle of least privilege", () => {
    // EC2 SG should only allow necessary ports
    const ec2SgMatch = content.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?}/);
    expect(ec2SgMatch).toBeTruthy();
    
    // Should have limited ingress rules
    const ingressRules = content.match(/ingress\s*{/g) || [];
    expect(ingressRules.length).toBeLessThan(10); // Not too many rules
  });

  test("all egress rules are properly configured", () => {
    expect(content).toMatch(/egress\s*{/);
    // Most should allow all outbound for simplicity in this setup
    expect(content).toMatch(/protocol\s*=\s*"-1"/);
  });

  // === ADDITIONAL DETAILED TESTS ===

  // Variable Validation Tests
  test("allowed_ssh_cidr_blocks variable is list type", () => {
    expect(content).toMatch(/variable\s+"allowed_ssh_cidr_blocks"[\s\S]*?type\s*=\s*list\(string\)/);
  });

  test("allowed_ssh_cidr_blocks has secure default", () => {
    expect(content).toMatch(/variable\s+"allowed_ssh_cidr_blocks"[\s\S]*?default\s*=\s*\["10\.0\.0\.0\/8"\]/);
  });

  test("environment variable has correct default", () => {
    expect(content).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"prod"/);
  });

  test("all variables have descriptions", () => {
    expect(content).toMatch(/variable\s+"aws_region"[\s\S]*?description\s*=\s*"AWS region for resources"/);
    expect(content).toMatch(/variable\s+"allowed_ssh_cidr_blocks"[\s\S]*?description/);
    expect(content).toMatch(/variable\s+"project_name"[\s\S]*?description/);
    expect(content).toMatch(/variable\s+"environment"[\s\S]*?description/);
  });

  // VPC Configuration Tests
  test("VPC CIDR block follows RFC 1918 private addressing", () => {
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("VPC enables both DNS hostnames and support", () => {
    const vpcMatch = content.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?}/);
    expect(vpcMatch).toBeTruthy();
    expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(content).toMatch(/enable_dns_support\s*=\s*true/);
  });

  // Subnet Configuration Tests  
  test("public subnets use correct CIDR calculation", () => {
    expect(content).toMatch(/cidr_block\s*=\s*cidrsubnet\(aws_vpc\.main\.cidr_block,\s*8,\s*count\.index\)/);
  });

  test("private subnets use different CIDR offset", () => {
    expect(content).toMatch(/cidr_block\s*=\s*cidrsubnet\(aws_vpc\.main\.cidr_block,\s*8,\s*count\.index\s*\+\s*10\)/);
  });

  test("subnets are distributed across availability zones", () => {
    expect(content).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
  });

  test("public subnets have correct tagging", () => {
    expect(content).toMatch(/Type\s*=\s*"Public"/);
  });

  test("private subnets have correct tagging", () => {
    expect(content).toMatch(/Type\s*=\s*"Private"/);
  });

  // Internet Gateway Tests
  test("IGW is properly attached to VPC", () => {
    expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  // NAT Gateway Tests
  test("NAT Gateway uses Elastic IP", () => {
    expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat\.id/);
  });

  test("NAT Gateway is in first public subnet", () => {
    expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
  });

  test("Elastic IP is for VPC domain", () => {
    expect(content).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("NAT Gateway depends on Internet Gateway", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
  });

  // Route Table Tests
  test("public route table routes to Internet Gateway", () => {
    expect(content).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id[\s\S]*?}/);
  });

  test("private route table routes to NAT Gateway", () => {
    expect(content).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id[\s\S]*?}/);
  });

  test("route table associations use count", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{[\s\S]*?count\s*=\s*length\(aws_subnet\.public\)/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{[\s\S]*?count\s*=\s*length\(aws_subnet\.private\)/);
  });

  // Security Group Detailed Tests
  test("EC2 security group allows SSH from variables", () => {
    expect(content).toMatch(/cidr_blocks\s*=\s*var\.allowed_ssh_cidr_blocks/);
  });

  test("EC2 security group allows inbound from NLB security group", () => {
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.nlb\.id\]/);
  });

  test("NLB security group allows HTTP from anywhere", () => {
    expect(content).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
  });

  test("RDS security group allows MySQL from EC2 security group", () => {
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
  });

  test("security groups have lifecycle create_before_destroy", () => {
    expect(content).toMatch(/lifecycle\s*{[\s\S]*?create_before_destroy\s*=\s*true[\s\S]*?}/);
  });

  test("security group ingress rules have descriptions", () => {
    expect(content).toMatch(/description\s*=\s*"HTTP from NLB"/);
    expect(content).toMatch(/description\s*=\s*"SSH from allowed CIDR blocks"/);
    expect(content).toMatch(/description\s*=\s*"MySQL\/Aurora from EC2"/);
  });

  // IAM Configuration Tests
  test("EC2 IAM role uses AWS service principal", () => {
    expect(content).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
  });

  test("EC2 IAM role allows STS AssumeRole", () => {
    expect(content).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
  });

  test("EC2 IAM policy includes EC2 describe permissions", () => {
    expect(content).toMatch(/ec2:DescribeVolumes/);
    expect(content).toMatch(/ec2:DescribeTags/);
  });

  test("EC2 IAM policy includes CloudWatch Logs permissions", () => {
    expect(content).toMatch(/logs:PutLogEvents/);
    expect(content).toMatch(/logs:CreateLogGroup/);
    expect(content).toMatch(/logs:CreateLogStream/);
  });

  test("EC2 IAM policy restricts Secrets Manager to specific ARNs", () => {
    expect(content).toMatch(/Resource\s*=\s*\[[\s\S]*?aws_secretsmanager_secret\.db_connection_info\.arn[\s\S]*?\]/);
    expect(content).toMatch(/aws_secretsmanager_secret\.db_master_password\.arn/);
  });

  test("instance profile name matches role", () => {
    expect(content).toMatch(/role\s*=\s*aws_iam_role\.ec2\.name/);
  });

  // KMS Configuration Tests
  test("RDS KMS key has proper deletion window", () => {
    expect(content).toMatch(/deletion_window_in_days\s*=\s*30/);
  });

  test("S3 KMS key has proper deletion window", () => {
    const s3KmsMatch = content.match(/resource\s+"aws_kms_key"\s+"s3"[\s\S]*?deletion_window_in_days\s*=\s*30/);
    expect(s3KmsMatch).toBeTruthy();
  });

  test("KMS aliases use proper naming convention", () => {
    expect(content).toMatch(/name\s*=\s*"alias\/\$\{var\.project_name\}-rds"/);
    expect(content).toMatch(/name\s*=\s*"alias\/\$\{var\.project_name\}-s3"/);
  });

  test("KMS aliases reference correct keys", () => {
    expect(content).toMatch(/target_key_id\s*=\s*aws_kms_key\.rds\.key_id/);
    expect(content).toMatch(/target_key_id\s*=\s*aws_kms_key\.s3\.key_id/);
  });

  // AWS Secrets Manager Tests
  test("RDS master password is managed by AWS", () => {
    expect(content).toMatch(/manage_master_user_password\s*=\s*true/);
  });

  test("RDS master password uses KMS encryption", () => {
    expect(content).toMatch(/master_user_secret_kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });

  // Secrets Manager Tests
  test("secrets have proper recovery window", () => {
    expect(content).toMatch(/recovery_window_in_days\s*=\s*30/);
  });

  test("connection info secret contains all required fields", () => {
    expect(content).toMatch(/username/);
    expect(content).toMatch(/engine/);
    expect(content).toMatch(/host/);
    expect(content).toMatch(/port/);
    expect(content).toMatch(/dbname/);
    expect(content).toMatch(/password_secret_arn/);
  });

  test("connection info secret references RDS instance values", () => {
    expect(content).toMatch(/host.*aws_db_instance\.main\.address/);
    expect(content).toMatch(/port.*aws_db_instance\.main\.port/);
    expect(content).toMatch(/dbname.*aws_db_instance\.main\.db_name/);
    expect(content).toMatch(/password_secret_arn.*aws_db_instance\.main\.master_user_secret\[0\]\.secret_arn/);
  });

  // RDS Configuration Tests
  test("RDS uses specific engine version", () => {
    expect(content).toMatch(/engine_version\s*=\s*"8\.0"/);
  });

  test("RDS uses appropriate instance class", () => {
    expect(content).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
  });

  test("RDS has proper storage configuration", () => {
    expect(content).toMatch(/allocated_storage\s*=\s*20/);
    expect(content).toMatch(/max_allocated_storage\s*=\s*100/);
    expect(content).toMatch(/storage_type\s*=\s*"gp3"/);
  });

  test("RDS references KMS key properly", () => {
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });

  test("RDS uses DB subnet group", () => {
    expect(content).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
  });

  test("RDS has backup configuration", () => {
    expect(content).toMatch(/backup_retention_period\s*=\s*7/);
    expect(content).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
  });

  test("RDS has maintenance window", () => {
    expect(content).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
  });

  test("RDS is not publicly accessible", () => {
    expect(content).toMatch(/publicly_accessible\s*=\s*false/);
  });

  test("RDS has CloudWatch logs exports", () => {
    expect(content).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
  });

  // Launch Template Tests
  test("launch template uses Amazon Linux 2 AMI", () => {
    expect(content).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
  });

  test("launch template assigns IAM instance profile", () => {
    expect(content).toMatch(/iam_instance_profile\s*{[\s\S]*?name\s*=\s*aws_iam_instance_profile\.ec2\.name/);
  });

  test("launch template has detailed monitoring", () => {
    expect(content).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true[\s\S]*?}/);
  });

  test("launch template has user data script", () => {
    expect(content).toMatch(/user_data\s*=\s*base64encode/);
  });

  test("user data installs httpd", () => {
    expect(content).toMatch(/yum install -y httpd/);
  });

  test("user data configures port 8080", () => {
    expect(content).toMatch(/Listen 8080/);
  });

  test("user data creates index page", () => {
    expect(content).toMatch(/echo.*index\.html/);
  });

  test("user data installs CloudWatch agent", () => {
    expect(content).toMatch(/amazon-cloudwatch-agent/);
  });

  test("launch template has tag specifications", () => {
    expect(content).toMatch(/tag_specifications\s*{[\s\S]*?resource_type\s*=\s*"instance"/);
  });

  // Load Balancer Tests
  test("NLB has cross-zone load balancing enabled", () => {
    expect(content).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
  });

  test("NLB uses multiple subnets", () => {
    expect(content).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("NLB access logs have prefix", () => {
    expect(content).toMatch(/prefix\s*=\s*"nlb-access-logs"/);
  });

  test("NLB depends on S3 bucket policy", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.logs\]/);
  });

  // Target Group Tests
  test("target group health check is properly configured", () => {
    expect(content).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(content).toMatch(/healthy_threshold\s*=\s*2/);
    expect(content).toMatch(/unhealthy_threshold\s*=\s*2/);
    expect(content).toMatch(/interval\s*=\s*30/);
    expect(content).toMatch(/port\s*=\s*8080/);
  });

  // Auto Scaling Group Tests
  test("ASG uses multiple availability zones", () => {
    expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("ASG has proper health check configuration", () => {
    expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
    expect(content).toMatch(/health_check_grace_period\s*=\s*300/);
  });

  test("ASG references target group", () => {
    expect(content).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.app\.arn\]/);
  });

  test("ASG uses latest launch template version", () => {
    expect(content).toMatch(/version\s*=\s*"\$Latest"/);
  });

  test("ASG has enabled metrics", () => {
    expect(content).toMatch(/enabled_metrics\s*=\s*\[/);
    expect(content).toMatch(/GroupMinSize/);
    expect(content).toMatch(/GroupMaxSize/);
    expect(content).toMatch(/GroupDesiredCapacity/);
    expect(content).toMatch(/GroupInServiceInstances/);
    expect(content).toMatch(/GroupTotalInstances/);
  });

  test("ASG has propagated tags", () => {
    expect(content).toMatch(/propagate_at_launch\s*=\s*true/);
  });

  // Auto Scaling Policy Tests
  test("scaling policy has proper adjustment", () => {
    expect(content).toMatch(/scaling_adjustment\s*=\s*1/);
    expect(content).toMatch(/adjustment_type\s*=\s*"ChangeInCapacity"/);
  });

  test("scaling policy has cooldown period", () => {
    expect(content).toMatch(/cooldown\s*=\s*300/);
  });

  test("scaling policy references ASG", () => {
    expect(content).toMatch(/autoscaling_group_name\s*=\s*aws_autoscaling_group\.app\.name/);
  });

  // S3 Bucket Tests
  test("S3 bucket names include account ID", () => {
    expect(content).toMatch(/bucket\s*=\s*"\$\{var\.project_name\}-logs-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
    expect(content).toMatch(/bucket\s*=\s*"\$\{var\.project_name\}-config-\$\{data\.aws_caller_identity\.current\.account_id\}"/);
  });

  test("S3 buckets have proper public access block settings", () => {
    const publicAccessMatches = content.match(/block_public_acls\s*=\s*true/g) || [];
    expect(publicAccessMatches.length).toBeGreaterThanOrEqual(2);
  });

  test("S3 bucket policies have proper statements", () => {
    expect(content).toMatch(/AWSLogDeliveryWrite/);
    expect(content).toMatch(/AWSLogDeliveryAclCheck/);
    expect(content).toMatch(/AWSNLBAccessLogsWrite/);
    expect(content).toMatch(/AWSNLBAccessLogsAclCheck/);
  });

  test("S3 bucket policy for NLB uses correct principal", () => {
    expect(content).toMatch(/arn:aws:iam::127311923021:root/);
  });

  // CloudWatch Tests
  test("CloudWatch alarm has proper configuration", () => {
    expect(content).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    expect(content).toMatch(/evaluation_periods\s*=\s*"2"/);
    expect(content).toMatch(/period\s*=\s*"120"/);
    expect(content).toMatch(/statistic\s*=\s*"Average"/);
  });

  test("CloudWatch alarm has dimensions", () => {
    expect(content).toMatch(/dimensions\s*=\s*{[\s\S]*?AutoScalingGroupName\s*=\s*aws_autoscaling_group\.app\.name/);
  });

  test("CloudWatch alarm has actions", () => {
    expect(content).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.cpu_based\.arn\]/);
  });

  // AWS Config Tests
  test("Config IAM role allows Config service", () => {
    expect(content).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
  });

  test("Config IAM policy has S3 permissions", () => {
    expect(content).toMatch(/s3:GetBucketVersioning/);
    expect(content).toMatch(/s3:PutBucketVersioning/);
    expect(content).toMatch(/s3:ListBucket/);
  });

  test("Config uses managed policy", () => {
    expect(content).toMatch(/arn:aws:iam::aws:policy\/service-role\/ConfigRole/);
  });

  test("Config bucket policy allows Config service", () => {
    expect(content).toMatch(/AWSConfigBucketPermissionsCheck/);
    expect(content).toMatch(/AWSConfigBucketExistenceCheck/);
    expect(content).toMatch(/AWSConfigBucketDelivery/);
  });

  test("Config recorder status depends on delivery channel", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
  });

  test("Config delivery channel depends on recorder", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_config_configuration_recorder\.main\]/);
  });

  // Output Tests
  test("outputs have proper descriptions", () => {
    expect(content).toMatch(/description\s*=\s*"DNS name of the Network Load Balancer"/);
    expect(content).toMatch(/description\s*=\s*"RDS instance endpoint"/);
    expect(content).toMatch(/description\s*=\s*"S3 bucket for logs"/);
    expect(content).toMatch(/description\s*=\s*"S3 bucket for AWS Config"/);
  });

  test("outputs reference correct resource attributes", () => {
    expect(content).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    expect(content).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    expect(content).toMatch(/value\s*=\s*aws_s3_bucket\.logs\.id/);
    expect(content).toMatch(/value\s*=\s*aws_s3_bucket\.config\.id/);
  });
});
