// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform configuration
// Validates structure, syntax, and compliance with requirements

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Configuration - File Structure", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf declares random provider in required_providers", () => {
    expect(providerContent).toMatch(/random\s*=\s*{/);
  });
});

describe("Terraform Configuration - Region Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("uses us-west-1 region as default", () => {
    expect(stackContent).toMatch(/default\s*=\s*"us-west-1"/);
  });

  test("availability zones data source is declared", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });
});

describe("Terraform Configuration - IAM Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares IAM role for EC2 instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
  });

  test("declares IAM instance profile for EC2", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
  });

  test("IAM role has minimal permissions policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
  });

  test("IAM role for AWS Config is declared", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
  });

  test("IAM role for SSM maintenance is declared", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ssm_maintenance"/);
  });
});

describe("Terraform Configuration - Sensitive Data Management", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares SSM parameter for database password", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
  });

  test("database password uses SecureString type", () => {
    const dbPasswordMatch = stackContent.match(/resource\s+"aws_ssm_parameter"\s+"db_password"[\s\S]*?type\s*=\s*"(\w+)"/);
    expect(dbPasswordMatch).toBeTruthy();
    expect(dbPasswordMatch?.[1]).toBe("SecureString");
  });

  test("declares SSM parameter for database username", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_username"/);
  });

  test("generates random password for database", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
  });

  test("random password has appropriate length", () => {
    const passwordMatch = stackContent.match(/resource\s+"random_password"\s+"db_password"[\s\S]*?length\s*=\s*(\d+)/);
    expect(passwordMatch).toBeTruthy();
    const length = parseInt(passwordMatch?.[1] || "0");
    expect(length).toBeGreaterThanOrEqual(16);
  });
});

describe("Terraform Configuration - S3 Buckets", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares S3 bucket for logging", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logging"/);
  });

  test("declares S3 bucket for application", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"application"/);
  });

  test("logging bucket has public access blocked", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"/);
  });

  test("application bucket has public access blocked", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"application"/);
  });

  test("buckets have versioning enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logging"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"application"/);
  });

  test("buckets have encryption enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logging"/);
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"application"/);
  });

  test("application bucket has access logging configured", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"application"/);
  });

  test("S3 buckets have force_destroy enabled for QA pipeline", () => {
    const loggingBucketSection = stackContent.match(/resource\s+"aws_s3_bucket"\s+"logging"[\s\S]*?(?=resource\s+"|$)/);
    const applicationBucketSection = stackContent.match(/resource\s+"aws_s3_bucket"\s+"application"[\s\S]*?(?=resource\s+"|$)/);
    
    expect(loggingBucketSection?.[0]).toMatch(/force_destroy\s*=\s*true/);
    expect(applicationBucketSection?.[0]).toMatch(/force_destroy\s*=\s*true/);
  });
});

describe("Terraform Configuration - CloudTrail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares CloudTrail resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test("CloudTrail logging is enabled", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/enable_logging\s*=\s*true/);
  });

  test("CloudTrail log file validation is enabled", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("S3 bucket policy allows CloudTrail writes", () => {
    expect(stackContent).toMatch(/AWSCloudTrailWrite/);
  });

  test("lifecycle rule for CloudTrail logs is at least 90 days", () => {
    const lifecycleMatch = stackContent.match(/expiration\s*{[\s\S]*?days\s*=\s*(\d+)/);
    if (lifecycleMatch) {
      const retentionDays = parseInt(lifecycleMatch[1]);
      expect(retentionDays).toBeGreaterThanOrEqual(90);
    }
  });
});

describe("Terraform Configuration - VPC and Networking", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares VPC resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("VPC has DNS hostnames enabled", () => {
    const vpcSection = stackContent.match(/resource\s+"aws_vpc"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(vpcSection?.[0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("declares Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares public subnets (at least 2 for HA)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    const publicSubnetMatch = stackContent.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*(\d+)/);
    expect(publicSubnetMatch).toBeTruthy();
    const count = parseInt(publicSubnetMatch?.[1] || "0");
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("declares private subnets for application tier", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test("declares database subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
  });

  test("declares NAT Gateways (at least 2 for HA)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    const natGatewayMatch = stackContent.match(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?count\s*=\s*(\d+)/);
    expect(natGatewayMatch).toBeTruthy();
    const count = parseInt(natGatewayMatch?.[1] || "0");
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("declares Elastic IPs for NAT Gateways", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
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

describe("Terraform Configuration - Security Groups", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares security group for ALB", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("declares security group for EC2 instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });

  test("declares security group for RDS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  test("ALB security group allows HTTPS traffic", () => {
    const albSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSgSection?.[0]).toMatch(/from_port\s*=\s*443/);
  });

  test("RDS security group restricts access to EC2 instances only", () => {
    const rdsSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSgSection?.[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
  });
});

describe("Terraform Configuration - Application Load Balancer", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares Application Load Balancer", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"app"/);
  });

  test("ALB is not internal (public-facing)", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSection?.[0]).toMatch(/internal\s*=\s*false/);
  });

  test("declares target group for ALB", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
  });

  test("declares HTTPS listener with SSL termination", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
  });

  test("declares HTTP listener for redirect", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
  });

  test("ALB has access logs enabled", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSection?.[0]).toMatch(/access_logs\s*{/);
  });

  test("ACM certificate is declared for SSL", () => {
    expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
  });
});

describe("Terraform Configuration - EC2 Instances", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares launch template for EC2", () => {
    expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
  });

  test("declares Auto Scaling Group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
  });

  test("EC2 instances have detailed monitoring enabled", () => {
    const launchTemplateSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(launchTemplateSection?.[0]).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("EBS volumes are encrypted", () => {
    const launchTemplateSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(launchTemplateSection?.[0]).toMatch(/encrypted\s*=\s*true/);
  });

  test("declares KMS key for EBS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"ebs"/);
  });

  test("KMS key has rotation enabled", () => {
    const kmsEbsSection = stackContent.match(/resource\s+"aws_kms_key"\s+"ebs"[\s\S]*?(?=resource\s+"|$)/);
    expect(kmsEbsSection?.[0]).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("EC2 instances use IAM instance profile", () => {
    const launchTemplateSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(launchTemplateSection?.[0]).toMatch(/iam_instance_profile/);
  });

  test("AMI data source is declared", () => {
    expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
  });
});

describe("Terraform Configuration - RDS PostgreSQL", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares RDS instance", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test("RDS uses PostgreSQL engine", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/engine\s*=\s*"postgres"/);
  });

  test("RDS storage is encrypted", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS has automatic backups enabled", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    const backupRetentionMatch = rdsSection?.[0].match(/backup_retention_period\s*=\s*(\d+)/);
    expect(backupRetentionMatch).toBeTruthy();
    const retentionDays = parseInt(backupRetentionMatch?.[1] || "0");
    expect(retentionDays).toBeGreaterThan(0);
  });

  test("declares KMS key for RDS encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
  });

  test("declares DB subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
  });

  test("RDS credentials reference SSM parameters", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/aws_ssm_parameter\.db/);
  });

  test("RDS deletion protection is disabled for QA pipeline", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("RDS skip_final_snapshot is enabled for cleanup", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/skip_final_snapshot\s*=\s*true/);
  });
});

describe("Terraform Configuration - AWS Config", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares AWS Config recorder", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
  });

  test("declares AWS Config delivery channel", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
  });

  test("AWS Config recorder is enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
  });

  test("declares AWS Config rules for compliance", () => {
    expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"/);
  });

  test("Config rule for S3 public read prohibition exists", () => {
    expect(stackContent).toMatch(/s3-bucket-public-read-prohibited|S3_BUCKET_PUBLIC_READ_PROHIBITED/);
  });

  test("Config rule for encrypted volumes exists", () => {
    expect(stackContent).toMatch(/encrypted-volumes|ENCRYPTED_VOLUMES/);
  });

  test("Config rule for RDS encryption exists", () => {
    expect(stackContent).toMatch(/rds-storage-encrypted|RDS_STORAGE_ENCRYPTED/);
  });
});

describe("Terraform Configuration - Systems Manager", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares Systems Manager Maintenance Window", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_maintenance_window"\s+"patching"/);
  });

  test("declares Maintenance Window Target", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_maintenance_window_target"\s+"patching"/);
  });

  test("declares Maintenance Window Task", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"/);
  });

  test("maintenance window task uses patch baseline", () => {
    const taskSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(taskSection?.[0]).toMatch(/AWS-RunPatchBaseline/);
  });
});

describe("Terraform Configuration - Tagging", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  test("default tags include environment = production in provider", () => {
    expect(providerContent).toMatch(/environment\s*=\s*"production"/);
  });

  test("resources have environment tag", () => {
    const tagMatches = stackContent.match(/environment\s*=\s*"production"/g);
    expect(tagMatches).toBeTruthy();
    expect(tagMatches!.length).toBeGreaterThan(5);
  });
});

describe("Terraform Configuration - Outputs", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares output for VPC ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"/);
  });

  test("declares output for ALB DNS name", () => {
    expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
  });

  test("declares output for RDS endpoint", () => {
    expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
  });

  test("declares output for CloudTrail name", () => {
    expect(stackContent).toMatch(/output\s+"cloudtrail_name"/);
  });

  test("declares output for S3 buckets", () => {
    expect(stackContent).toMatch(/output\s+"s3_logging_bucket"/);
    expect(stackContent).toMatch(/output\s+"s3_application_bucket"/);
  });

  test("RDS endpoint output is marked as sensitive", () => {
    const rdsOutputSection = stackContent.match(/output\s+"rds_endpoint"[\s\S]*?(?=output\s+"|$)/);
    expect(rdsOutputSection?.[0]).toMatch(/sensitive\s*=\s*true/);
  });
});

describe("Terraform Configuration - CloudWatch", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("declares CloudWatch Log Group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
  });

  test("CloudWatch logs have retention configured", () => {
    const logGroupSection = stackContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?(?=resource\s+"|$)/);
    expect(logGroupSection?.[0]).toMatch(/retention_in_days/);
  });
});

describe("Terraform Configuration - VPC CIDR and Subnets Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("VPC uses RFC 1918 private address space", () => {
    const vpcSection = stackContent.match(/resource\s+"aws_vpc"\s+"main"[\s\S]*?cidr_block\s*=\s*"([^"]+)"/);
    expect(vpcSection).toBeTruthy();
    const cidr = vpcSection?.[1];
    expect(cidr).toMatch(/^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./);
  });

  test("VPC enables DNS support", () => {
    const vpcSection = stackContent.match(/resource\s+"aws_vpc"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(vpcSection?.[0]).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("public subnets have map_public_ip_on_launch enabled", () => {
    const publicSubnetSection = stackContent.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?(?=resource\s+"|$)/);
    expect(publicSubnetSection?.[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("subnets span multiple availability zones", () => {
    expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names/);
  });

  test("database subnets are in separate CIDR range", () => {
    const dbSubnetSection = stackContent.match(/resource\s+"aws_subnet"\s+"database"[\s\S]*?cidr_block\s*=\s*"[^"]+"/);
    expect(dbSubnetSection).toBeTruthy();
  });

  test("private subnets use NAT gateway for internet access", () => {
    const privateRtSection = stackContent.match(/resource\s+"aws_route_table"\s+"private"[\s\S]*?(?=resource\s+"|$)/);
    expect(privateRtSection?.[0]).toMatch(/nat_gateway_id/);
  });

  test("public route table routes to internet gateway", () => {
    const publicRtSection = stackContent.match(/resource\s+"aws_route_table"\s+"public"[\s\S]*?(?=resource\s+"|$)/);
    expect(publicRtSection?.[0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });
});

describe("Terraform Configuration - S3 Bucket Policies and Permissions", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("S3 bucket policy is declared for logging bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logging"/);
  });

  test("bucket policy allows CloudTrail ACL check", () => {
    expect(stackContent).toMatch(/AWSCloudTrailAclCheck/);
  });

  test("bucket policy allows Config service access", () => {
    expect(stackContent).toMatch(/AWSConfigBucketPermissionsCheck/);
  });

  test("bucket policy allows Config delivery", () => {
    expect(stackContent).toMatch(/AWSConfigBucketDelivery/);
  });

  test("bucket policy allows ALB access logs", () => {
    expect(stackContent).toMatch(/AWSALBAccessLogs|ALB.*[Ll]og/);
  });

  test("logging bucket blocks all public ACLs", () => {
    const loggingBlockSection = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"[\s\S]*?(?=resource\s+"|$)/);
    expect(loggingBlockSection?.[0]).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("logging bucket blocks all public policies", () => {
    const loggingBlockSection = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"[\s\S]*?(?=resource\s+"|$)/);
    expect(loggingBlockSection?.[0]).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("logging bucket ignores public ACLs", () => {
    const loggingBlockSection = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"[\s\S]*?(?=resource\s+"|$)/);
    expect(loggingBlockSection?.[0]).toMatch(/ignore_public_acls\s*=\s*true/);
  });

  test("logging bucket restricts public buckets", () => {
    const loggingBlockSection = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"logging"[\s\S]*?(?=resource\s+"|$)/);
    expect(loggingBlockSection?.[0]).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("application bucket has all public access blocks", () => {
    const appBlockSection = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"application"[\s\S]*?(?=resource\s+"|$)/);
    expect(appBlockSection?.[0]).toMatch(/block_public_acls\s*=\s*true/);
    expect(appBlockSection?.[0]).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("bucket versioning is enabled for logging", () => {
    const versioningSection = stackContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"logging"[\s\S]*?(?=resource\s+"|$)/);
    expect(versioningSection?.[0]).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("bucket versioning is enabled for application", () => {
    const versioningSection = stackContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"application"[\s\S]*?(?=resource\s+"|$)/);
    expect(versioningSection?.[0]).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("encryption uses AES256 algorithm", () => {
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("lifecycle configuration exists for log retention", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"logging"/);
  });

  test("bucket policy depends on public access block", () => {
    const policySection = stackContent.match(/resource\s+"aws_s3_bucket_policy"\s+"logging"[\s\S]*?(?=^})/m);
    expect(policySection?.[0]).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_public_access_block\.logging\]/);
  });
});

describe("Terraform Configuration - IAM Roles and Policies Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("EC2 role allows SSM access", () => {
    const ec2PolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2PolicySection?.[0]).toMatch(/ssm:UpdateInstanceInformation|ssmmessages/);
  });

  test("EC2 role allows CloudWatch metrics", () => {
    const ec2PolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2PolicySection?.[0]).toMatch(/cloudwatch:PutMetricData/);
  });

  test("EC2 role allows CloudWatch logs", () => {
    const ec2PolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2PolicySection?.[0]).toMatch(/logs:PutLogEvents|logs:CreateLogStream/);
  });

  test("EC2 role can read SSM parameters", () => {
    const ec2PolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2PolicySection?.[0]).toMatch(/ssm:GetParameter/);
  });

  test("SSM managed instance core policy is attached", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed_instance_core"/);
  });

  test("Config role can write to S3", () => {
    const configPolicySection = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"config"[\s\S]*?(?=resource\s+"|$)/);
    expect(configPolicySection?.[0]).toMatch(/s3:PutObject/);
  });

  test("Config service role policy is attached", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
  });

  test("SSM maintenance role uses correct service principal", () => {
    const ssmMaintenanceRoleSection = stackContent.match(/resource\s+"aws_iam_role"\s+"ssm_maintenance"[\s\S]*?(?=resource\s+"|$)/);
    expect(ssmMaintenanceRoleSection?.[0]).toMatch(/Service.*ssm\.amazonaws\.com/);
  });

  test("SSM maintenance role has maintenance window policy", () => {
    expect(stackContent).toMatch(/AmazonSSMMaintenanceWindowRole/);
  });

  test("EC2 instance profile references EC2 role", () => {
    const profileSection = stackContent.match(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"[\s\S]*?(?=resource\s+"|$)/);
    expect(profileSection?.[0]).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
  });
});

describe("Terraform Configuration - Security Group Rules Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("ALB security group allows HTTP port 80", () => {
    const albSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSgSection?.[0]).toMatch(/from_port\s*=\s*80/);
  });

  test("ALB security group allows HTTPS port 443", () => {
    const albSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSgSection?.[0]).toMatch(/from_port\s*=\s*443/);
  });

  test("ALB security group allows traffic from internet", () => {
    const albSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSgSection?.[0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
  });

  test("EC2 security group restricts inbound to ALB only", () => {
    const ec2SgSection = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2SgSection?.[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("EC2 security group allows outbound HTTPS", () => {
    const ec2SgSection = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2SgSection?.[0]).toMatch(/egress[\s\S]*?from_port\s*=\s*443/);
  });

  test("EC2 security group allows outbound HTTP", () => {
    const ec2SgSection = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2SgSection?.[0]).toMatch(/egress[\s\S]*?from_port\s*=\s*80/);
  });

  test("EC2 security group allows outbound to RDS PostgreSQL", () => {
    const ec2SgSection = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?(?=resource\s+"|$)/);
    expect(ec2SgSection?.[0]).toMatch(/from_port\s*=\s*5432/);
  });

  test("RDS security group allows PostgreSQL port 5432", () => {
    const rdsSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSgSection?.[0]).toMatch(/from_port\s*=\s*5432/);
  });

  test("RDS security group uses TCP protocol", () => {
    const rdsSgSection = stackContent.match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSgSection?.[0]).toMatch(/protocol\s*=\s*"tcp"/);
  });

  test("security groups have descriptions", () => {
    const sgMatches = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?description\s*=/g);
    expect(sgMatches).toBeTruthy();
    expect(sgMatches!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Terraform Configuration - Load Balancer Configuration Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("ALB is application type", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSection?.[0]).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("ALB has HTTP2 enabled", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSection?.[0]).toMatch(/enable_http2\s*=\s*true/);
  });

  test("ALB has cross-zone load balancing enabled", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSection?.[0]).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
  });

  test("ALB deletion protection is disabled for QA", () => {
    const albSection = stackContent.match(/resource\s+"aws_lb"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(albSection?.[0]).toMatch(/enable_deletion_protection\s*=\s*false/);
  });

  test("target group uses HTTP protocol", () => {
    const tgSection = stackContent.match(/resource\s+"aws_lb_target_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(tgSection?.[0]).toMatch(/protocol\s*=\s*"HTTP"/);
  });

  test("target group health check is configured", () => {
    const tgSection = stackContent.match(/resource\s+"aws_lb_target_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(tgSection?.[0]).toMatch(/health_check\s*{/);
  });

  test("health check has appropriate thresholds", () => {
    const tgSection = stackContent.match(/resource\s+"aws_lb_target_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(tgSection?.[0]).toMatch(/healthy_threshold/);
    expect(tgSection?.[0]).toMatch(/unhealthy_threshold/);
  });

  test("HTTPS listener uses TLS 1.2 policy", () => {
    const httpsListenerSection = stackContent.match(/resource\s+"aws_lb_listener"\s+"https"[\s\S]*?(?=resource\s+"|$)/);
    expect(httpsListenerSection?.[0]).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2/);
  });

  test("HTTP listener redirects to HTTPS", () => {
    const httpListenerSection = stackContent.match(/resource\s+"aws_lb_listener"\s+"http"[\s\S]*?(?=resource\s+"|$)/);
    expect(httpListenerSection?.[0]).toMatch(/type\s*=\s*"redirect"/);
  });

  test("HTTP to HTTPS redirect uses 301 status", () => {
    const httpListenerSection = stackContent.match(/resource\s+"aws_lb_listener"\s+"http"[\s\S]*?(?=resource\s+"|$)/);
    expect(httpListenerSection?.[0]).toMatch(/status_code\s*=\s*"HTTP_301"/);
  });

  test("ACM certificate uses DNS validation", () => {
    const certSection = stackContent.match(/resource\s+"aws_acm_certificate"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(certSection?.[0]).toMatch(/validation_method\s*=\s*"DNS"/);
  });
});

describe("Terraform Configuration - Auto Scaling Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("ASG has minimum capacity of at least 2", () => {
    const asgSection = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    const minSizeMatch = asgSection?.[0].match(/min_size\s*=\s*(\d+)/);
    expect(minSizeMatch).toBeTruthy();
    const minSize = parseInt(minSizeMatch?.[1] || "0");
    expect(minSize).toBeGreaterThanOrEqual(2);
  });

  test("ASG spans multiple availability zones", () => {
    const asgSection = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(asgSection?.[0]).toMatch(/vpc_zone_identifier/);
  });

  test("ASG uses ELB health check", () => {
    const asgSection = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(asgSection?.[0]).toMatch(/health_check_type\s*=\s*"ELB"/);
  });

  test("ASG has health check grace period", () => {
    const asgSection = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(asgSection?.[0]).toMatch(/health_check_grace_period/);
  });

  test("ASG is integrated with target group", () => {
    const asgSection = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(asgSection?.[0]).toMatch(/target_group_arns/);
  });

  test("launch template uses latest version", () => {
    const asgSection = stackContent.match(/resource\s+"aws_autoscaling_group"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(asgSection?.[0]).toMatch(/version\s*=\s*"\$Latest"/);
  });
});

describe("Terraform Configuration - EC2 Launch Template Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("launch template uses appropriate instance type", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(ltSection?.[0]).toMatch(/instance_type\s*=\s*"t[23]\./);
  });

  test("launch template specifies AMI", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(ltSection?.[0]).toMatch(/image_id\s*=\s*data\.aws_ami/);
  });

  test("launch template has user data", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(ltSection?.[0]).toMatch(/user_data\s*=/);
  });

  test("EBS volume uses gp3 type", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(ltSection?.[0]).toMatch(/volume_type\s*=\s*"gp3"/);
  });

  test("EBS volume has appropriate size", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    const volumeSizeMatch = ltSection?.[0].match(/volume_size\s*=\s*(\d+)/);
    expect(volumeSizeMatch).toBeTruthy();
    const size = parseInt(volumeSizeMatch?.[1] || "0");
    expect(size).toBeGreaterThan(0);
  });

  test("EBS volume is deleted on termination", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(ltSection?.[0]).toMatch(/delete_on_termination\s*=\s*true/);
  });

  test("launch template has tag specifications", () => {
    const ltSection = stackContent.match(/resource\s+"aws_launch_template"\s+"app"[\s\S]*?(?=resource\s+"|$)/);
    expect(ltSection?.[0]).toMatch(/tag_specifications/);
  });

  test("AMI filter for Amazon Linux 2", () => {
    const amiSection = stackContent.match(/data\s+"aws_ami"\s+"amazon_linux_2"[\s\S]*?(?=data\s+"|resource\s+"|$)/);
    expect(amiSection?.[0]).toMatch(/amzn2-ami-hvm/);
  });

  test("AMI uses HVM virtualization", () => {
    const amiSection = stackContent.match(/data\s+"aws_ami"\s+"amazon_linux_2"[\s\S]*?(?=data\s+"|resource\s+"|$)/);
    expect(amiSection?.[0]).toMatch(/virtualization-type/);
    expect(amiSection?.[0]).toMatch(/values\s*=\s*\["hvm"\]/);
  });
});

describe("Terraform Configuration - RDS Configuration Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("RDS has appropriate instance class", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/instance_class\s*=\s*"db\./);
  });

  test("RDS storage is at least 20GB", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    const storageMatch = rdsSection?.[0].match(/allocated_storage\s*=\s*(\d+)/);
    expect(storageMatch).toBeTruthy();
    const storage = parseInt(storageMatch?.[1] || "0");
    expect(storage).toBeGreaterThanOrEqual(20);
  });

  test("RDS uses gp3 storage type", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/storage_type\s*=\s*"gp3"/);
  });

  test("RDS has backup window configured", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/backup_window/);
  });

  test("RDS has maintenance window configured", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/maintenance_window/);
  });

  test("RDS auto minor version upgrade is enabled", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/auto_minor_version_upgrade\s*=\s*true/);
  });

  test("RDS CloudWatch logs are enabled", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/enabled_cloudwatch_logs_exports/);
  });

  test("RDS PostgreSQL version is specified", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/engine_version\s*=\s*"[0-9]+/);
  });

  test("RDS database name is specified", () => {
    const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(rdsSection?.[0]).toMatch(/db_name\s*=/);
  });

  test("DB subnet group spans multiple subnets", () => {
    const dbSubnetGroupSection = stackContent.match(/resource\s+"aws_db_subnet_group"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(dbSubnetGroupSection?.[0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
  });
});

describe("Terraform Configuration - KMS Encryption Keys", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("KMS key for EBS has appropriate deletion window", () => {
    const kmsEbsSection = stackContent.match(/resource\s+"aws_kms_key"\s+"ebs"[\s\S]*?(?=resource\s+"|$)/);
    const deletionWindowMatch = kmsEbsSection?.[0].match(/deletion_window_in_days\s*=\s*(\d+)/);
    expect(deletionWindowMatch).toBeTruthy();
    const days = parseInt(deletionWindowMatch?.[1] || "0");
    expect(days).toBeGreaterThanOrEqual(7);
  });

  test("KMS key for RDS has appropriate deletion window", () => {
    const kmsRdsSection = stackContent.match(/resource\s+"aws_kms_key"\s+"rds"[\s\S]*?(?=resource\s+"|$)/);
    const deletionWindowMatch = kmsRdsSection?.[0].match(/deletion_window_in_days\s*=\s*(\d+)/);
    expect(deletionWindowMatch).toBeTruthy();
    const days = parseInt(deletionWindowMatch?.[1] || "0");
    expect(days).toBeGreaterThanOrEqual(7);
  });

  test("KMS keys have aliases", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"ebs"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
  });

  test("KMS alias for EBS uses correct naming", () => {
    const aliasSection = stackContent.match(/resource\s+"aws_kms_alias"\s+"ebs"[\s\S]*?(?=resource\s+"|$)/);
    expect(aliasSection?.[0]).toMatch(/name\s*=\s*"alias\//);
  });

  test("KMS RDS key rotation is enabled", () => {
    const kmsRdsSection = stackContent.match(/resource\s+"aws_kms_key"\s+"rds"[\s\S]*?(?=resource\s+"|$)/);
    expect(kmsRdsSection?.[0]).toMatch(/enable_key_rotation\s*=\s*true/);
  });
});

describe("Terraform Configuration - Systems Manager Maintenance Window Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("maintenance window has cron schedule", () => {
    const mwSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(mwSection?.[0]).toMatch(/schedule\s*=\s*"cron\(/);
  });

  test("maintenance window has appropriate duration", () => {
    const mwSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    const durationMatch = mwSection?.[0].match(/duration\s*=\s*(\d+)/);
    expect(durationMatch).toBeTruthy();
    const duration = parseInt(durationMatch?.[1] || "0");
    expect(duration).toBeGreaterThan(0);
  });

  test("maintenance window has cutoff time", () => {
    const mwSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(mwSection?.[0]).toMatch(/cutoff\s*=\s*\d+/);
  });

  test("maintenance window target uses tag-based filtering", () => {
    const targetSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_target"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(targetSection?.[0]).toMatch(/targets\s*{/);
  });

  test("maintenance window task has priority", () => {
    const taskSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(taskSection?.[0]).toMatch(/priority\s*=/);
  });

  test("maintenance window task has max concurrency", () => {
    const taskSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(taskSection?.[0]).toMatch(/max_concurrency/);
  });

  test("maintenance window task has max errors", () => {
    const taskSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(taskSection?.[0]).toMatch(/max_errors/);
  });

  test("maintenance window task uses service role", () => {
    const taskSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(taskSection?.[0]).toMatch(/service_role_arn/);
  });

  test("patch task installs patches", () => {
    const taskSection = stackContent.match(/resource\s+"aws_ssm_maintenance_window_task"\s+"patching"[\s\S]*?(?=resource\s+"|$)/);
    expect(taskSection?.[0]).toMatch(/name\s*=\s*"Operation"/);
    expect(taskSection?.[0]).toMatch(/values\s*=\s*\["Install"\]/);
  });
});

describe("Terraform Configuration - AWS Config Rules Detail", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("Config recorder records all resources", () => {
    const recorderSection = stackContent.match(/resource\s+"aws_config_configuration_recorder"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(recorderSection?.[0]).toMatch(/all_supported\s*=\s*true/);
  });

  test("Config recorder includes global resources", () => {
    const recorderSection = stackContent.match(/resource\s+"aws_config_configuration_recorder"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(recorderSection?.[0]).toMatch(/include_global_resource_types\s*=\s*true/);
  });

  test("Config delivery channel uses S3", () => {
    const deliverySection = stackContent.match(/resource\s+"aws_config_delivery_channel"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(deliverySection?.[0]).toMatch(/s3_bucket_name/);
  });

  test("Config status is enabled", () => {
    const statusSection = stackContent.match(/resource\s+"aws_config_configuration_recorder_status"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(statusSection?.[0]).toMatch(/is_enabled\s*=\s*true/);
  });

  test("Config rules use AWS managed rules", () => {
    const rulesSection = stackContent.match(/resource\s+"aws_config_config_rule"[\s\S]*?source\s*{[\s\S]*?}/g);
    expect(rulesSection).toBeTruthy();
    rulesSection?.forEach(rule => {
      expect(rule).toMatch(/owner\s*=\s*"AWS"/);
    });
  });

  test("Config rules have proper dependencies", () => {
    const rulesSection = stackContent.match(/resource\s+"aws_config_config_rule"[\s\S]*?depends_on/);
    expect(rulesSection).toBeTruthy();
  });
});

describe("Terraform Configuration - Resource Naming and Identifiers", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("resources use consistent naming convention", () => {
    const nameMatches = stackContent.match(/name\s*=\s*"production-/g);
    expect(nameMatches).toBeTruthy();
    expect(nameMatches!.length).toBeGreaterThan(10);
  });

  test("S3 buckets use random suffix for uniqueness", () => {
    expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
  });

  test("random suffix uses appropriate byte length", () => {
    const randomIdSection = stackContent.match(/resource\s+"random_id"\s+"bucket_suffix"[\s\S]*?(?=resource\s+"|$)/);
    expect(randomIdSection?.[0]).toMatch(/byte_length\s*=\s*\d+/);
  });

  test("resources reference VPC ID correctly", () => {
    const vpcRefMatches = stackContent.match(/vpc_id\s*=\s*aws_vpc\.main\.id/g);
    expect(vpcRefMatches).toBeTruthy();
    expect(vpcRefMatches!.length).toBeGreaterThan(5);
  });
});

describe("Terraform Configuration - CloudTrail Event Selector", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  test("CloudTrail has event selector", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/event_selector\s*{/);
  });

  test("CloudTrail event selector includes management events", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/include_management_events\s*=\s*true/);
  });

  test("CloudTrail is multi-region", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("CloudTrail includes global service events", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/include_global_service_events\s*=\s*true/);
  });

  test("CloudTrail logs S3 data events", () => {
    const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
    expect(cloudtrailSection?.[0]).toMatch(/data_resource/);
  });
});
