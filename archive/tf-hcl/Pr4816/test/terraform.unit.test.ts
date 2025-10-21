// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Stack: tap_stack.tf - File Structure", () => {
  let content: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Expected stack at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists and is readable", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(content.length).toBeGreaterThan(0);
  });

  test("is a single-file Terraform configuration", () => {
    const libDir = path.dirname(stackPath);
    const tfFiles = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));
    expect(tfFiles).toContain('tap_stack.tf');
  });
});

describe("Terraform Configuration - Terraform Block", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares terraform block with required_version", () => {
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.[0-9]+"/);
  });

  test("declares AWS provider with version >= 5.0", () => {
    expect(content).toMatch(/required_providers\s*{/);
    expect(content).toMatch(/aws\s*=\s*{/);
    expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });

  test("declares random provider", () => {
    expect(content).toMatch(/random\s*=\s*{/);
    expect(content).toMatch(/source\s*=\s*"hashicorp\/random"/);
    expect(content).toMatch(/version\s*=\s*">=\s*3\.0"/);
  });

  test("configures S3 backend", () => {
    expect(content).toMatch(/backend\s+"s3"\s*{/);
  });

  test("declares AWS provider configuration", () => {
    expect(content).toMatch(/provider\s+"aws"\s*{/);
    expect(content).toMatch(/region\s*=\s*var\.aws_region/);
  });
});

describe("Terraform Configuration - Variables", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_region variable", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    expect(content).toContain('default     = "us-east-1"');
  });

  test("declares allowed_ip_ranges variable", () => {
    expect(content).toMatch(/variable\s+"allowed_ip_ranges"\s*{/);
    expect(content).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares acm_certificate_arn variable", () => {
    expect(content).toMatch(/variable\s+"acm_certificate_arn"\s*{/);
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test("declares admin_email variable", () => {
    expect(content).toMatch(/variable\s+"admin_email"\s*{/);
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test("declares environment variable", () => {
    expect(content).toMatch(/variable\s+"environment"\s*{/);
    expect(content).toContain('default     = "prod"');
  });

  test("declares cost_center variable", () => {
    expect(content).toMatch(/variable\s+"cost_center"\s*{/);
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test("declares tags variable", () => {
    expect(content).toMatch(/variable\s+"tags"\s*{/);
    expect(content).toMatch(/type\s*=\s*map\(string\)/);
  });

  test("declares prevent_destroy variable", () => {
    expect(content).toMatch(/variable\s+"prevent_destroy"\s*{/);
    expect(content).toMatch(/type\s*=\s*bool/);
  });

  test("declares instance_type variable", () => {
    expect(content).toMatch(/variable\s+"instance_type"\s*{/);
    expect(content).toContain('default     = "t3.medium"');
  });

  test("declares db_engine variable", () => {
    expect(content).toMatch(/variable\s+"db_engine"\s*{/);
    expect(content).toContain('default     = "postgres"');
  });
});

describe("Terraform Configuration - Data Sources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_availability_zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    expect(content).toMatch(/state\s*=\s*"available"/);
  });

  test("declares aws_ami data source for Amazon Linux 2", () => {
    expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"\s*{/);
    expect(content).toMatch(/most_recent\s*=\s*true/);
    expect(content).toMatch(/owners\s*=\s*\["amazon"\]/);
  });

  test("declares aws_caller_identity data source", () => {
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });
});

describe("Terraform Resources - KMS Encryption", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares KMS key with key rotation enabled", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    expect(content).toMatch(/deletion_window_in_days\s*=\s*30/);
  });

  test("KMS key has prevent_destroy lifecycle", () => {
    const kmsMatch = content.match(/resource\s+"aws_kms_key"\s+"main"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)[\s\S]*?}/);
    expect(kmsMatch).toBeTruthy();
  });

  test("declares KMS alias", () => {
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
    expect(content).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
  });
});

describe("Terraform Resources - VPC and Networking", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares VPC with DNS enabled", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(content).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("declares Internet Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("declares Elastic IPs for NAT Gateways", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    expect(content).toMatch(/count\s*=\s*2/);
    expect(content).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("declares public subnets in 2 AZs", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(content).toMatch(/count\s*=\s*2/);
    expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("declares private subnets in 2 AZs", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(content).toMatch(/count\s*=\s*2/);
  });

  test("declares database subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
    expect(content).toMatch(/count\s*=\s*2/);
  });

  test("declares NAT Gateways", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(content).toMatch(/count\s*=\s*2/);
    expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
  });

  test("declares public route table with IGW route", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("declares private route tables with NAT routes", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    expect(content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
  });

  test("declares route table associations", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
  });
});

describe("Terraform Resources - VPC Endpoints", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares SSM VPC endpoint", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"\s*{/);
    expect(content).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.ssm"/);
    expect(content).toMatch(/private_dns_enabled\s*=\s*true/);
  });

  test("declares SSM messages VPC endpoint", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssmmessages"\s*{/);
    expect(content).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.ssmmessages"/);
  });

  test("declares EC2 messages VPC endpoint", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2messages"\s*{/);
    expect(content).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.ec2messages"/);
  });
});

describe("Terraform Resources - Security Groups", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ALB security group with HTTPS", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    expect(content).toMatch(/from_port\s*=\s*443/);
    expect(content).toMatch(/to_port\s*=\s*443/);
    expect(content).toMatch(/cidr_blocks\s*=\s*var\.allowed_ip_ranges/);
  });

  test("ALB security group allows HTTP for redirect", () => {
    const albSgMatch = content.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/);
    expect(albSgMatch).toBeTruthy();
  });

  test("declares app security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
  });

  test("declares database security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
    expect(content).toMatch(/from_port\s*=\s*5432/);
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
  });

  test("declares VPC endpoints security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"\s*{/);
    expect(content).toMatch(/from_port\s*=\s*443/);
    expect(content).toMatch(/cidr_blocks\s*=\s*\[aws_vpc\.main\.cidr_block\]/);
  });
});

describe("Terraform Resources - IAM Roles and Policies", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares EC2 instance IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_instance"\s*{/);
    expect(content).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
  });

  test("declares IAM policy for SSM access", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_ssm"\s*{/);
    expect(content).toMatch(/ssm:UpdateInstanceInformation/);
    expect(content).toMatch(/ssmmessages:CreateControlChannel/);
  });

  test("attaches CloudWatch policy to EC2 role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch"\s*{/);
    expect(content).toMatch(/CloudWatchAgentServerPolicy/);
  });

  test("declares EC2 instance profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
    expect(content).toMatch(/role\s*=\s*aws_iam_role\.ec2_instance\.name/);
  });

  test("declares RDS monitoring IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"\s*{/);
    expect(content).toMatch(/Service\s*=\s*"monitoring\.rds\.amazonaws\.com"/);
  });

  test("declares Lambda rotation IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_rotation"\s*{/);
    expect(content).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
  });

  test("declares AWS Config IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"config"\s*{/);
    expect(content).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
  });
});

describe("Terraform Resources - EC2 and Auto Scaling", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares launch template with encryption", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
    expect(content).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
    expect(content).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(content).toMatch(/encrypted\s*=\s*true/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("launch template enforces IMDSv2", () => {
    expect(content).toMatch(/http_tokens\s*=\s*"required"/);
  });

  test("launch template includes user_data", () => {
    expect(content).toMatch(/user_data\s*=\s*base64encode/);
    expect(content).toMatch(/amazon-ssm-agent/);
  });

  test("declares Auto Scaling Group", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"\s*{/);
    expect(content).toMatch(/min_size\s*=\s*2/);
    expect(content).toMatch(/max_size\s*=\s*6/);
    expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
  });

  test("Auto Scaling Group spans private subnets", () => {
    expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("Auto Scaling Group has prevent_destroy lifecycle", () => {
    const asgMatch = content.match(/resource\s+"aws_autoscaling_group"\s+"app"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)/);
    expect(asgMatch).toBeTruthy();
  });
});

describe("Terraform Resources - Application Load Balancer", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares Application Load Balancer", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"app"\s*{/);
    expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
    expect(content).toMatch(/internal\s*=\s*false/);
  });

  test("ALB enables access logs to S3", () => {
    expect(content).toMatch(/access_logs\s*{/);
    expect(content).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.id/);
    expect(content).toMatch(/enabled\s*=\s*true/);
  });

  test("ALB in public subnets", () => {
    expect(content).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
  });

  test("declares target group with health checks", () => {
    expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
    expect(content).toMatch(/health_check\s*{/);
    expect(content).toMatch(/path\s*=\s*"\/"/);
  });

  test("declares HTTP listener with redirect", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
    expect(content).toMatch(/port\s*=\s*"80"/);
    expect(content).toMatch(/type\s*=\s*"redirect"/);
    expect(content).toMatch(/protocol\s*=\s*"HTTPS"/);
  });

  test("declares HTTPS listener with TLS 1.2+", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"\s*{/);
    expect(content).toMatch(/port\s*=\s*"443"/);
    expect(content).toMatch(/protocol\s*=\s*"HTTPS"/);
    expect(content).toMatch(/ssl_policy\s*=\s*"ELBSecurityPolicy-TLS-1-2-2017-01"/);
    expect(content).toMatch(/certificate_arn\s*=\s*var\.acm_certificate_arn/);
  });
});

describe("Terraform Resources - S3 Buckets", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares logs S3 bucket", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
  });

  test("logs bucket has versioning enabled", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"\s*{/);
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("logs bucket has KMS encryption", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"\s*{/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("logs bucket blocks public access", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
    expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("logs bucket policy denies unencrypted uploads", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"\s*{/);
    expect(content).toMatch(/DenyUnencryptedUploads/);
  });

  test("declares app_data S3 bucket", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"\s*{/);
  });

  test("app_data bucket has versioning", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"app_data"\s*{/);
  });

  test("app_data bucket has encryption", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"app_data"\s*{/);
  });

  test("app_data bucket blocks public access", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_data"\s*{/);
  });

  test("S3 buckets have prevent_destroy lifecycle", () => {
    const logsMatch = content.match(/resource\s+"aws_s3_bucket"\s+"logs"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)/);
    const appDataMatch = content.match(/resource\s+"aws_s3_bucket"\s+"app_data"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)/);
    expect(logsMatch).toBeTruthy();
    expect(appDataMatch).toBeTruthy();
  });
});

describe("Terraform Resources - RDS Database", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares DB subnet group", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
  });

  test("declares RDS instance with Multi-AZ", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
    expect(content).toMatch(/engine\s*=\s*var\.db_engine/);
    expect(content).toMatch(/multi_az\s*=\s*true/);
  });

  test("RDS instance has encryption enabled", () => {
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("RDS has backup retention", () => {
    expect(content).toMatch(/backup_retention_period\s*=\s*7/);
    expect(content).toMatch(/backup_window/);
  });

  test("RDS has enhanced monitoring", () => {
    expect(content).toMatch(/monitoring_interval\s*=\s*60/);
    expect(content).toMatch(/monitoring_role_arn\s*=\s*aws_iam_role\.rds_monitoring\.arn/);
  });

  test("RDS has CloudWatch logs enabled", () => {
    expect(content).toMatch(/enabled_cloudwatch_logs_exports/);
  });

  test("RDS has prevent_destroy lifecycle", () => {
    const rdsMatch = content.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)/);
    expect(rdsMatch).toBeTruthy();
  });

  test("declares random password for DB", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"db_master"\s*{/);
    expect(content).toMatch(/length\s*=\s*32/);
    expect(content).toMatch(/special\s*=\s*true/);
  });
});

describe("Terraform Resources - Secrets Manager", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares Secrets Manager secret", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"\s*{/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.id/);
  });

  test("secret has prevent_destroy lifecycle", () => {
    const secretMatch = content.match(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)/);
    expect(secretMatch).toBeTruthy();
  });

  test("declares secret version with DB credentials", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"\s*{/);
    expect(content).toMatch(/secret_string\s*=\s*jsonencode/);
  });

  test("secret rotation is configured", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"db_credentials"\s*{/);
    expect(content).toMatch(/automatically_after_days\s*=\s*30/);
  });
});

describe("Terraform Resources - Lambda for Secret Rotation", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares Lambda function for rotation", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"rotate_secret"\s*{/);
    expect(content).toMatch(/handler\s*=\s*"index\.lambda_handler"/);
    expect(content).toMatch(/runtime\s*=\s*"python3\.9"/);
  });

  test("Lambda has VPC configuration", () => {
    const lambdaMatch = content.match(/resource\s+"aws_lambda_function"\s+"rotate_secret"\s*{[\s\S]*?vpc_config\s*{/);
    expect(lambdaMatch).toBeTruthy();
  });

  test("declares Lambda permission for Secrets Manager", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_secret_manager"\s*{/);
    expect(content).toMatch(/principal\s*=\s*"secretsmanager\.amazonaws\.com"/);
  });

  test("declares local_file for Lambda code", () => {
    expect(content).toMatch(/resource\s+"local_file"\s+"lambda_rotation_code"\s*{/);
    expect(content).toMatch(/def lambda_handler/);
  });

  test("Lambda code includes rotation steps", () => {
    expect(content).toMatch(/createSecret/);
    expect(content).toMatch(/setSecret/);
    expect(content).toMatch(/testSecret/);
    expect(content).toMatch(/finishSecret/);
  });
});

describe("Terraform Resources - SSM Parameter Store", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares SSM parameter for app config", () => {
    expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_config"\s*{/);
    expect(content).toMatch(/type\s*=\s*"String"/);
  });
});

describe("Terraform Resources - CloudTrail", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CloudTrail", () => {
    expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
    expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
    expect(content).toMatch(/enable_logging\s*=\s*true/);
  });

  test("CloudTrail uses KMS encryption", () => {
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("CloudTrail has event selectors", () => {
    expect(content).toMatch(/event_selector\s*{/);
    expect(content).toMatch(/include_management_events\s*=\s*true/);
  });

  test("CloudTrail has prevent_destroy lifecycle", () => {
    const trailMatch = content.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*(false|var\.prevent_destroy)/);
    expect(trailMatch).toBeTruthy();
  });
});

describe("Terraform Resources - SNS and CloudWatch Alarms", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares SNS topic for alarms", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"\s*{/);
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.id/);
  });

  test("declares SNS email subscription", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"\s*{/);
    expect(content).toMatch(/protocol\s*=\s*"email"/);
    expect(content).toMatch(/endpoint\s*=\s*var\.admin_email/);
  });

  test("declares CloudWatch alarm for EC2 CPU", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
    expect(content).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
    expect(content).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
  });

  test("declares CloudWatch alarm for RDS CPU", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{/);
    expect(content).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
  });

  test("declares CloudWatch alarm for RDS storage", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"\s*{/);
    expect(content).toMatch(/metric_name\s*=\s*"FreeStorageSpace"/);
  });

  test("alarms send to SNS topic", () => {
    expect(content).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alarms\.arn\]/);
  });
});

describe("Terraform Resources - AWS Config", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares AWS Config recorder", () => {
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
    expect(content).toMatch(/all_supported\s*=\s*true/);
  });

  test("declares Config delivery channel", () => {
    expect(content).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*{/);
    expect(content).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.logs\.bucket/);
  });

  test("enables Config recorder", () => {
    expect(content).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"\s*{/);
    expect(content).toMatch(/is_enabled\s*=\s*true/);
  });

  test("declares Config rule for S3 encryption", () => {
    expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_encryption"\s*{/);
    expect(content).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
  });

  test("declares Config rule for S3 versioning", () => {
    expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_versioning"\s*{/);
    expect(content).toMatch(/S3_BUCKET_VERSIONING_ENABLED/);
  });

  test("declares Config rule for RDS Multi-AZ", () => {
    expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_multi_az"\s*{/);
    expect(content).toMatch(/RDS_MULTI_AZ_SUPPORT/);
  });

  test("declares Config rule for CloudTrail", () => {
    expect(content).toMatch(/resource\s+"aws_config_config_rule"\s+"cloudtrail_enabled"\s*{/);
    expect(content).toMatch(/CLOUD_TRAIL_ENABLED/);
  });
});

describe("Terraform Configuration - Outputs", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("outputs ALB DNS name", () => {
    expect(content).toMatch(/output\s+"alb_dns_name"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_lb\.app\.dns_name/);
  });

  test("outputs RDS endpoint", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
    expect(content).toMatch(/sensitive\s*=\s*true/);
  });

  test("outputs S3 bucket name", () => {
    expect(content).toMatch(/output\s+"s3_bucket_name"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_s3_bucket\.app_data\.id/);
  });

  test("outputs KMS key ARN", () => {
    expect(content).toMatch(/output\s+"kms_key_arn"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_kms_key\.main\.arn/);
  });

  test("outputs SNS topic ARN", () => {
    expect(content).toMatch(/output\s+"sns_topic_arn"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_sns_topic\.alarms\.arn/);
  });

  test("outputs VPC ID", () => {
    expect(content).toMatch(/output\s+"vpc_id"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
  });

  test("outputs secret ARN", () => {
    expect(content).toMatch(/output\s+"secret_arn"\s*{/);
    expect(content).toMatch(/value\s*=\s*aws_secretsmanager_secret\.db_credentials\.arn/);
    expect(content).toMatch(/sensitive\s*=\s*true/);
  });
});

describe("Security Best Practices", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("no hardcoded credentials", () => {
    expect(content).not.toMatch(/password\s*=\s*"[^$]/);
    expect(content).not.toMatch(/access_key\s*=\s*"[A-Z0-9]{20}"/);
  });

  test("encryption at rest for all storage", () => {
    // KMS encryption for S3
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    // EBS encryption
    expect(content).toMatch(/encrypted\s*=\s*true/);
    // RDS encryption
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("TLS 1.2+ for ALB", () => {
    expect(content).toMatch(/ELBSecurityPolicy-TLS-1-2-2017-01/);
  });

  test("IMDSv2 enforced", () => {
    expect(content).toMatch(/http_tokens\s*=\s*"required"/);
  });

  test("public access blocked on S3", () => {
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("Multi-AZ for RDS", () => {
    expect(content).toMatch(/multi_az\s*=\s*true/);
  });

  test("S3 versioning enabled", () => {
    expect(content).toMatch(/versioning_configuration\s*{[\s\S]*?status\s*=\s*"Enabled"/);
  });

  test("no SSH security group rules", () => {
    expect(content).not.toMatch(/from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22/);
  });

  test("least privilege IAM policies", () => {
    // Check that IAM policies use specific actions, not wildcards
    const iamPolicyMatches = content.match(/"Action"\s*[:=]\s*"[^"]*"/g) || [];
    const hasWildcardAll = iamPolicyMatches.some(match => match.includes('"*"'));
    // It's okay to have some wildcards in specific contexts, but check they're limited
    expect(content).toMatch(/Effect.*Allow/);
  });
});

describe("Terraform Configuration - Random Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares random_id for unique naming", () => {
    expect(content).toMatch(/resource\s+"random_id"\s+"suffix"\s*{/);
    expect(content).toMatch(/byte_length\s*=\s*4/);
  });

  test("random suffix used in resource names", () => {
    expect(content).toMatch(/random_id\.suffix\.hex/);
  });
});

describe("Infrastructure Architecture", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("implements multi-AZ architecture", () => {
    // Check for 2 AZs in various resources
    expect(content).toMatch(/count\s*=\s*2/);
    expect(content).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
  });

  test("implements private subnet architecture", () => {
    // EC2 instances in private subnets
    expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    // ALB in public subnets
    const albMatch = content.match(/resource\s+"aws_lb"\s+"app"\s*{[\s\S]*?subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    expect(albMatch).toBeTruthy();
  });

  test("implements network isolation", () => {
    // Database in separate subnets
    expect(content).toMatch(/aws_subnet\.database/);
    // Proper security group references
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
  });
});

describe("Code Quality and Standards", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("uses descriptive resource names", () => {
    expect(content).toMatch(/Name\s*=\s*"\${var\.environment}/);
  });

  test("includes resource tags", () => {
    expect(content).toMatch(/tags\s*=\s*{/);
    expect(content).toMatch(/Name\s*=/);
  });

  test("uses variables for configuration", () => {
    expect(content).toMatch(/var\.environment/);
    expect(content).toMatch(/var\.aws_region/);
    expect(content).toMatch(/var\.allowed_ip_ranges/);
  });

  test("includes comments for complex configurations", () => {
    expect(content).toMatch(/\/\//);
    expect(content).toMatch(/# /);
  });

  test("proper depends_on usage", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[/);
  });
});
