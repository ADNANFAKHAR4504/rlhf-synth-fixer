// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure components
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const STACK_FILE = path.join(LIB_DIR, "tap_stack.tf");
const PROVIDER_FILE = path.join(LIB_DIR, "provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure Validation", () => {
  test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_FILE)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_FILE)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(PROVIDER_FILE, "utf8");
    });

    test("declares AWS provider with correct version", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.29\.0"/);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("sets default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Project\s*=\s*"X"/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Variable Validation", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares allowed_ssh_cidr variable with validation", () => {
      expect(stackContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*{/);
      expect(stackContent).toMatch(/cidrhost\(var\.allowed_ssh_cidr,\s*0\)/);
    });

    test("declares sns_https_endpoint variable with HTTPS validation", () => {
      expect(stackContent).toMatch(/variable\s+"sns_https_endpoint"\s*{/);
      expect(stackContent).toMatch(/https:\/\/.*var\.sns_https_endpoint/);
    });

    test("declares instance_type variable with t2.micro restriction", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
      expect(stackContent).toMatch(/var\.instance_type\s*==\s*"t2\.micro"/);
    });

    test("declares sensitive database variables", () => {
      expect(stackContent).toMatch(/variable\s+"db_username"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_password"\s*{/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Data Sources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("declares AMI data source for Amazon Linux", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
      expect(stackContent).toMatch(/amzn2-ami-hvm-.*-x86_64-gp2/);
    });

    test("declares caller identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });

  describe("Networking Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares VPC with correct CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("declares internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("declares route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });
  });

  describe("Security Groups", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares web security group with SSH and HTTP access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
    });

    test("declares database security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
    });

    test("uses lifecycle rules for security groups", () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  describe("IAM Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      expect(stackContent).toMatch(/ec2\.amazonaws\.com/);
    });

    test("declares MFA enforcement policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_required"\s*{/);
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("declares Lambda execution role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_shutdown_role"\s*{/);
      expect(stackContent).toMatch(/lambda\.amazonaws\.com/);
    });
  });

  describe("S3 Storage", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares S3 bucket for frontend", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"frontend"\s*{/);
    });

    test("enables versioning on S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"frontend"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures S3 encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"frontend"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("configures S3 website hosting", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_website_configuration"\s+"frontend"\s*{/);
      expect(stackContent).toMatch(/index_document\s*{/);
      expect(stackContent).toMatch(/suffix\s*=\s*"index\.html"/);
    });

  });

  describe("EC2 Compute", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares key pair", () => {
      expect(stackContent).toMatch(/resource\s+"aws_key_pair"\s+"main"\s*{/);
    });

    test("declares EC2 instance with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web"\s*{/);
      expect(stackContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
    });

    test("configures root block device with encryption", () => {
      expect(stackContent).toMatch(/root_block_device\s*{/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/volume_type\s*=\s*"gp3"/);
    });

    test("includes user data script", () => {
      expect(stackContent).toMatch(/user_data_base64\s*=\s*base64encode/);
      expect(stackContent).toMatch(/yum install -y httpd/);
    });
  });

  describe("RDS Database", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    });

    test("declares RDS instance with MySQL", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("configures storage encryption", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("configures backup settings", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"ec2_httpd_access"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_shutdown"\s*{/);
    });

    test("declares SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"\s*{/);
    });

    test("declares CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ec2_cpu"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{/);
    });

    test("configures alarm thresholds correctly", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*"80"/);
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    });
  });

  describe("Lambda Function", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares Lambda function for shutdown", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"shutdown"\s*{/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
    });

    test("declares EventBridge rule for scheduling", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"shutdown_schedule"\s*{/);
      expect(stackContent).toMatch(/cron\(30 14 \* \* \? \*\)/);
    });

    test("includes Lambda source code", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"shutdown_lambda"\s*{/);
      expect(stackContent).toMatch(/boto3\.client\('ec2'/);
    });
  });

  describe("Outputs", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("declares website URL output", () => {
      expect(stackContent).toMatch(/output\s+"website_url"\s*{/);
      expect(stackContent).toMatch(/aws_s3_bucket_website_configuration\.frontend\.website_endpoint/);
    });

    test("declares web server public IP output", () => {
      expect(stackContent).toMatch(/output\s+"web_server_public_ip"\s*{/);
      expect(stackContent).toMatch(/aws_instance\.web\.public_ip/);
    });

    test("declares database endpoint as sensitive", () => {
      expect(stackContent).toMatch(/output\s+"database_endpoint"\s*{/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Resource Tagging", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("uses terraform.workspace in resource names", () => {
      expect(stackContent).toMatch(/\$\{terraform\.workspace\}/);
    });

    test("includes proper tag structures", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{terraform\.workspace\}/);
    });
  });

  describe("Security Best Practices", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(STACK_FILE, "utf8");
    });

    test("uses least privilege IAM policies", () => {
      expect(stackContent).toMatch(/Effect\s*=\s*"Allow"/);
      expect(stackContent).toMatch(/Action\s*=\s*\[/);
    });

    test("implements proper security group rules", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\]/);
    });

    test("enables encryption at rest", () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });
  });
});
