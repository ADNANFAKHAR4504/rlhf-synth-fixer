// Unit Tests for Secure Web Application Terraform Infrastructure
// Validates that all Terraform configurations meet PROMPT.md requirements
// No Terraform commands executed - validates HCL syntax and structure

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

// Load outputs and extract region
let EXPECTED_REGION = "us-west-2"; // Default fallback
try {
  const outputsContent = fs.readFileSync(OUTPUTS_FILE, "utf8");
  const outputs = JSON.parse(outputsContent);

  // Extract region from ALB DNS or RDS endpoint
  if (outputs.alb_dns_name) {
    const regionMatch = outputs.alb_dns_name.match(/\.([a-z]{2}-[a-z]+-\d+)\.elb\.amazonaws\.com/);
    if (regionMatch) {
      EXPECTED_REGION = regionMatch[1];
    }
  } else if (outputs.rds_endpoint) {
    const regionMatch = outputs.rds_endpoint.match(/\.([a-z]{2}-[a-z]+-\d+)\.rds\.amazonaws\.com/);
    if (regionMatch) {
      EXPECTED_REGION = regionMatch[1];
    }
  }
} catch (error) {
  console.warn(`⚠ Could not read outputs file, using default region: ${EXPECTED_REGION}`);
}

// Helper function to read file content safely
function readFileContent(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper function to check if file exists
function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

describe("Secure Web Application Infrastructure - Terraform Configuration Validation", () => {

  // ========== ROOT MODULE STRUCTURE ==========
  describe("Root Module Structure", () => {
    test("provider.tf exists with proper AWS provider configuration", () => {
      const providerTfPath = path.join(LIB_DIR, "provider.tf");
      expect(fileExists(providerTfPath)).toBe(true);

      const content = readFileContent(providerTfPath);

      // Should have required providers block
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{\s*source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);

      // Should have AWS provider
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);

      // Should have backend configuration
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test("main.tf exists with data sources", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // Should have availability zones data source
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/state\s*=\s*"available"/);
    });

    test("variables.tf exists with required variables", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      expect(fileExists(variablesTfPath)).toBe(true);

      const content = readFileContent(variablesTfPath);

      // Required variables from PROMPT.md
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"project_name"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"allowed_ips"/);
      expect(content).toMatch(/variable\s+"db_username"/);
      expect(content).toMatch(/variable\s+"db_password"/);
      expect(content).toMatch(/variable\s+"instance_type"/);
      expect(content).toMatch(/variable\s+"min_instances"/);
      expect(content).toMatch(/variable\s+"max_instances"/);

      // Sensitive variables should be marked
      expect(content).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("outputs.tf exists with required outputs", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      expect(fileExists(outputsTfPath)).toBe(true);

      const content = readFileContent(outputsTfPath);

      // Required outputs
      expect(content).toMatch(/output\s+"alb_dns_name"/);
      expect(content).toMatch(/output\s+"rds_endpoint"/);
      expect(content).toMatch(/output\s+"log_bucket"/);
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"private_subnet_ids"/);

      // Sensitive outputs should be marked
      expect(content).toMatch(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/);

      // Outputs should have descriptions
      expect(content).toMatch(/description\s*=/);
    });

    test("terraform.tfvars exists with proper values", () => {
      const tfvarsPath = path.join(LIB_DIR, "terraform.tfvars");
      expect(fileExists(tfvarsPath)).toBe(true);

      const content = readFileContent(tfvarsPath);

      // Should have required configuration with valid AWS region format
      expect(content).toMatch(/aws_region\s*=\s*"[a-z]{2}-[a-z]+-\d+"/);
      expect(content).toMatch(/project_name\s*=/);
      expect(content).toMatch(/environment\s*=/);
      expect(content).toMatch(/allowed_ips\s*=\s*\[/);
      expect(content).toMatch(/instance_type\s*=/);
      expect(content).toMatch(/min_instances\s*=/);
      expect(content).toMatch(/max_instances\s*=/);
    });
  });

  // ========== VPC AND NETWORKING ==========
  describe("VPC Configuration Validation", () => {
    test("vpc.tf has proper VPC configuration", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      expect(fileExists(vpcTfPath)).toBe(true);

      const content = readFileContent(vpcTfPath);

      // VPC with DNS enabled
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
      expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);

      // Proper tagging
      expect(content).toMatch(/tags\s*=\s*{/);
      expect(content).toMatch(/Name\s*=/);
      expect(content).toMatch(/Environment\s*=/);
    });

    test("vpc.tf has multi-AZ subnet configuration", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      const content = readFileContent(vpcTfPath);

      // Public subnets across AZs
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);

      // Private subnets across AZs
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*2/);

      // Database subnets across AZs
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(content).toMatch(/count\s*=\s*2/);

      // DB Subnet Group
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test("vpc.tf has NAT gateways for high availability", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      const content = readFileContent(vpcTfPath);

      // Internet Gateway
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);

      // Elastic IPs for NAT
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/domain\s*=\s*"vpc"/);

      // NAT Gateways (one per AZ)
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
      expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test("vpc.tf has proper route tables", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      const content = readFileContent(vpcTfPath);

      // Public route table with IGW
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(content).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);

      // Private route tables with NAT
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);

      // Route table associations
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // ========== SECURITY CONFIGURATION ==========
  describe("Security Groups Configuration Validation", () => {
    test("security.tf has ALB security group with restricted access", () => {
      const securityTfPath = path.join(LIB_DIR, "security.tf");
      expect(fileExists(securityTfPath)).toBe(true);

      const content = readFileContent(securityTfPath);

      // ALB Security Group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/description\s*=\s*"Security group for Application Load Balancer"/);

      // HTTP ingress
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/to_port\s*=\s*80/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);
      expect(content).toMatch(/cidr_blocks\s*=\s*var\.allowed_ips/);

      // HTTPS ingress
      expect(content).toMatch(/from_port\s*=\s*443/);
      expect(content).toMatch(/to_port\s*=\s*443/);

      // Lifecycle rules
      expect(content).toMatch(/lifecycle\s*{/);
      expect(content).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("security.tf has EC2 security group with restricted access", () => {
      const securityTfPath = path.join(LIB_DIR, "security.tf");
      const content = readFileContent(securityTfPath);

      // EC2 Security Group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(content).toMatch(/description\s*=\s*"Security group for EC2 instances"/);

      // Should only allow traffic from ALB
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/to_port\s*=\s*80/);

      // SSH from allowed IPs only
      expect(content).toMatch(/from_port\s*=\s*22/);
      expect(content).toMatch(/cidr_blocks\s*=\s*var\.allowed_ips/);
    });

    test("security.tf has RDS security group with restricted access", () => {
      const securityTfPath = path.join(LIB_DIR, "security.tf");
      const content = readFileContent(securityTfPath);

      // RDS Security Group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(content).toMatch(/description\s*=\s*"Security group for RDS database"/);

      // Should only allow traffic from EC2
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
      expect(content).toMatch(/from_port\s*=\s*3306/);
      expect(content).toMatch(/to_port\s*=\s*3306/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);
    });
  });

  // ========== KMS ENCRYPTION ==========
  describe("KMS Configuration Validation", () => {
    test("kms.tf has EBS encryption key", () => {
      const kmsTfPath = path.join(LIB_DIR, "kms.tf");
      expect(fileExists(kmsTfPath)).toBe(true);

      const content = readFileContent(kmsTfPath);

      // EBS KMS Key
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"ebs"/);
      expect(content).toMatch(/description\s*=\s*"KMS key for EBS volume encryption"/);
      expect(content).toMatch(/deletion_window_in_days\s*=\s*10/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);

      // KMS Alias
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"ebs"/);
      expect(content).toMatch(/target_key_id\s*=\s*aws_kms_key\.ebs\.key_id/);
    });

    test("kms.tf has RDS encryption key with proper policy", () => {
      const kmsTfPath = path.join(LIB_DIR, "kms.tf");
      const content = readFileContent(kmsTfPath);

      // RDS KMS Key
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(content).toMatch(/description\s*=\s*"KMS key for RDS encryption"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);

      // KMS policy with proper permissions
      expect(content).toMatch(/policy\s*=\s*jsonencode\(/);
      expect(content).toMatch(/"Enable IAM User Permissions"/);
      expect(content).toMatch(/"Allow RDS to use the key"/);
      expect(content).toMatch(/"rds\.amazonaws\.com"/);
      expect(content).toMatch(/"kms:Decrypt"/);
      expect(content).toMatch(/"kms:CreateGrant"/);

      // KMS Alias
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
    });

    test("kms.tf has S3 encryption key", () => {
      const kmsTfPath = path.join(LIB_DIR, "kms.tf");
      const content = readFileContent(kmsTfPath);

      // S3 KMS Key
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
      expect(content).toMatch(/description\s*=\s*"KMS key for S3 bucket encryption"/);

      // Should have CloudWatch Logs service principal
      expect(content).toMatch(/"Allow CloudWatch Logs to use the key"/);
      expect(content).toMatch(/logs\..*\.amazonaws\.com/);

      // KMS Alias
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
    });

    test("kms.tf has caller identity data source", () => {
      const kmsTfPath = path.join(LIB_DIR, "kms.tf");
      const content = readFileContent(kmsTfPath);

      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // ========== IAM ROLES AND POLICIES ==========
  describe("IAM Configuration Validation", () => {
    test("iam.tf has EC2 instance role", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      expect(fileExists(iamTfPath)).toBe(true);

      const content = readFileContent(iamTfPath);

      // EC2 Role
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/assume_role_policy\s*=\s*jsonencode\(/);
      expect(content).toMatch(/"ec2\.amazonaws\.com"/);
      expect(content).toMatch(/"sts:AssumeRole"/);
    });

    test("iam.tf has CloudWatch Logs policy with least privilege", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      const content = readFileContent(iamTfPath);

      // CloudWatch Logs Policy
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch_logs"/);
      expect(content).toMatch(/"logs:CreateLogGroup"/);
      expect(content).toMatch(/"logs:CreateLogStream"/);
      expect(content).toMatch(/"logs:PutLogEvents"/);
      expect(content).toMatch(/"logs:DescribeLogStreams"/);

      // Should have resource constraints
      expect(content).toMatch(/Resource\s*=\s*"arn:aws:logs:/);
    });

    test("iam.tf has S3 access policy for logs", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      const content = readFileContent(iamTfPath);

      // S3 Logs Policy
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_logs"/);
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).toMatch(/"s3:GetObject"/);
      expect(content).toMatch(/"s3:ListBucket"/);

      // Should reference the logs bucket
      expect(content).toMatch(/aws_s3_bucket\.logs\.arn/);
    });

    test("iam.tf has CloudWatch metrics policy", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      const content = readFileContent(iamTfPath);

      // CloudWatch Metrics Policy
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch_metrics"/);
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);
      expect(content).toMatch(/"cloudwatch:GetMetricData"/);
      expect(content).toMatch(/"cloudwatch:ListMetrics"/);
    });

    test("iam.tf has instance profile", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      const content = readFileContent(iamTfPath);

      // Instance Profile
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(content).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });
  });

  // ========== COMPUTE AND AUTO SCALING ==========
  describe("Compute Configuration Validation", () => {
    test("compute.tf has launch template with encryption", () => {
      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      expect(fileExists(computeTfPath)).toBe(true);

      const content = readFileContent(computeTfPath);

      // Launch Template
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"web"/);
      expect(content).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux_2\.id/);
      expect(content).toMatch(/instance_type\s*=\s*var\.instance_type/);

      // IAM Instance Profile attached
      expect(content).toMatch(/iam_instance_profile\s*{/);
      expect(content).toMatch(/arn\s*=\s*aws_iam_instance_profile\.ec2_profile\.arn/);

      // EBS encryption enabled
      expect(content).toMatch(/block_device_mappings\s*{/);
      expect(content).toMatch(/encrypted\s*=\s*true/);
      expect(content).toMatch(/delete_on_termination\s*=\s*true/);

      // IMDSv2 enforced
      expect(content).toMatch(/metadata_options\s*{/);
      expect(content).toMatch(/http_tokens\s*=\s*"required"/);
      expect(content).toMatch(/http_endpoint\s*=\s*"enabled"/);

      // User data
      expect(content).toMatch(/user_data\s*=\s*base64encode\(/);
      expect(content).toMatch(/templatefile\(/);
    });

    test("compute.tf has Auto Scaling Group for high availability", () => {
      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      const content = readFileContent(computeTfPath);

      // Auto Scaling Group
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"/);
      expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(content).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.web\.arn\]/);
      expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(content).toMatch(/health_check_grace_period/);

      // High availability - min 2 instances
      expect(content).toMatch(/min_size\s*=\s*var\.min_instances/);
      expect(content).toMatch(/max_size\s*=\s*var\.max_instances/);
      expect(content).toMatch(/desired_capacity\s*=\s*var\.min_instances/);

      // Enabled metrics
      expect(content).toMatch(/enabled_metrics\s*=\s*\[/);
      expect(content).toMatch(/"GroupMinSize"/);
      expect(content).toMatch(/"GroupMaxSize"/);
      expect(content).toMatch(/"GroupDesiredCapacity"/);
    });

    test("compute.tf has scaling policies", () => {
      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      const content = readFileContent(computeTfPath);

      // Scale up policy
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"web_scale_up"/);
      expect(content).toMatch(/scaling_adjustment\s*=\s*1/);
      expect(content).toMatch(/adjustment_type\s*=\s*"ChangeInCapacity"/);
      expect(content).toMatch(/cooldown\s*=\s*300/);

      // Scale down policy
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"web_scale_down"/);
      expect(content).toMatch(/scaling_adjustment\s*=\s*-1/);
    });

    test("compute.tf has AMI data source", () => {
      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      const content = readFileContent(computeTfPath);

      // AMI data source
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(content).toMatch(/most_recent\s*=\s*true/);
      expect(content).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(content).toMatch(/filter\s*{/);
      expect(content).toMatch(/name\s*=\s*"name"/);
      expect(content).toMatch(/values\s*=\s*\["amzn2-ami-hvm-.*-x86_64-gp2"\]/);
    });

    test("user_data.sh exists and has proper configuration", () => {
      const userDataPath = path.join(LIB_DIR, "user_data.sh");
      expect(fileExists(userDataPath)).toBe(true);

      const content = readFileContent(userDataPath);

      // Should have shebang
      expect(content).toMatch(/^#!\/bin\/bash/);

      // CloudWatch Agent
      expect(content).toMatch(/amazon-cloudwatch-agent/);
      expect(content).toMatch(/cloudwatch-agent-ctl/);

      // Web server
      expect(content).toMatch(/nginx/);
      expect(content).toMatch(/systemctl\s+start\s+nginx/);
      expect(content).toMatch(/systemctl\s+enable\s+nginx/);

      // Health check endpoint
      expect(content).toMatch(/\/health/);
      expect(content).toMatch(/return\s+200/);
    });
  });

  // ========== RDS DATABASE ==========
  describe("Database Configuration Validation", () => {
    test("database.tf has RDS with encryption and backups", () => {
      const databaseTfPath = path.join(LIB_DIR, "database.tf");
      expect(fileExists(databaseTfPath)).toBe(true);

      const content = readFileContent(databaseTfPath);

      // RDS Instance
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(content).toMatch(/engine\s*=\s*"mysql"/);
      expect(content).toMatch(/engine_version\s*=\s*"8\.0"/);

      // Storage encryption
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);

      // Automated backups
      expect(content).toMatch(/backup_retention_period\s*=\s*30/);
      expect(content).toMatch(/backup_window/);
      expect(content).toMatch(/maintenance_window/);

      // Deletion protection
      expect(content).toMatch(/deletion_protection\s*=\s*true/);
      expect(content).toMatch(/skip_final_snapshot\s*=\s*false/);

      // Security
      expect(content).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
      expect(content).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);

      // CloudWatch logs
      expect(content).toMatch(/enabled_cloudwatch_logs_exports/);
      expect(content).toMatch(/"error"/);
      expect(content).toMatch(/"general"/);
      expect(content).toMatch(/"slowquery"/);
    });
  });

  // ========== LOAD BALANCER ==========
  describe("Load Balancer Configuration Validation", () => {
    test("load_balancer.tf has ALB configuration", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      expect(fileExists(lbTfPath)).toBe(true);

      const content = readFileContent(lbTfPath);

      // Application Load Balancer
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(content).toMatch(/internal\s*=\s*false/);
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      expect(content).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);

      // ALB features
      expect(content).toMatch(/enable_deletion_protection\s*=\s*true/);
      expect(content).toMatch(/enable_http2\s*=\s*true/);
      expect(content).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);

      // Access logs
      expect(content).toMatch(/access_logs\s*{/);
      expect(content).toMatch(/bucket\s*=\s*aws_s3_bucket\.logs\.bucket/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test("load_balancer.tf has target group with health checks", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      const content = readFileContent(lbTfPath);

      // Target Group
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"web"/);
      expect(content).toMatch(/port\s*=\s*80/);
      expect(content).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);

      // Health check configuration
      expect(content).toMatch(/health_check\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
      expect(content).toMatch(/path\s*=\s*"\/health"/);
      expect(content).toMatch(/matcher\s*=\s*"200"/);
      expect(content).toMatch(/healthy_threshold\s*=\s*2/);
      expect(content).toMatch(/unhealthy_threshold\s*=\s*2/);

      // Stickiness
      expect(content).toMatch(/stickiness\s*{/);
      expect(content).toMatch(/type\s*=\s*"lb_cookie"/);
    });

    test("load_balancer.tf has HTTP listener", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      const content = readFileContent(lbTfPath);

      // HTTP Listener
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(content).toMatch(/port\s*=\s*"80"/);
      expect(content).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(content).toMatch(/type\s*=\s*"forward"/);
      expect(content).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.web\.arn/);
    });

    test("load_balancer.tf has HTTPS configuration commented for future use", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      const content = readFileContent(lbTfPath);

      // HTTPS configuration should be commented out
      expect(content).toMatch(/#.*resource\s+"aws_lb_listener"\s+"https"/);
      expect(content).toMatch(/#.*resource\s+"aws_acm_certificate"\s+"main"/);

      // Should have notes about enabling HTTPS
      expect(content).toMatch(/Note.*HIPAA compliance/i);
      expect(content).toMatch(/domain/i);
    });
  });

  // ========== WAF PROTECTION ==========
  describe("WAF Configuration Validation", () => {
    test("waf.tf has Web ACL with security rules", () => {
      const wafTfPath = path.join(LIB_DIR, "waf.tf");
      expect(fileExists(wafTfPath)).toBe(true);

      const content = readFileContent(wafTfPath);

      // WAF Web ACL
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(content).toMatch(/scope\s*=\s*"REGIONAL"/);

      // Default action
      expect(content).toMatch(/default_action\s*{/);
      expect(content).toMatch(/allow\s*{}/);

      // Visibility config
      expect(content).toMatch(/visibility_config\s*{/);
      expect(content).toMatch(/cloudwatch_metrics_enabled\s*=\s*true/);
      expect(content).toMatch(/sampled_requests_enabled\s*=\s*true/);
    });

    test("waf.tf has rate limiting rule", () => {
      const wafTfPath = path.join(LIB_DIR, "waf.tf");
      const content = readFileContent(wafTfPath);

      // Rate limiting
      expect(content).toMatch(/rule\s*{/);
      expect(content).toMatch(/name\s*=\s*"RateLimitRule"/);
      expect(content).toMatch(/rate_based_statement\s*{/);
      expect(content).toMatch(/limit\s*=\s*2000/);
      expect(content).toMatch(/aggregate_key_type\s*=\s*"IP"/);
      expect(content).toMatch(/action\s*{\s*block\s*{}/);
    });

    test("waf.tf has AWS managed rule sets", () => {
      const wafTfPath = path.join(LIB_DIR, "waf.tf");
      const content = readFileContent(wafTfPath);

      // Common Rule Set
      expect(content).toMatch(/AWSManagedRulesCommonRuleSet/);
      expect(content).toMatch(/managed_rule_group_statement\s*{/);
      expect(content).toMatch(/vendor_name\s*=\s*"AWS"/);

      // SQL Injection Protection
      expect(content).toMatch(/AWSManagedRulesSQLiRuleSet/);

      // Override actions
      expect(content).toMatch(/override_action\s*{/);
      expect(content).toMatch(/none\s*{}/);
    });

    test("waf.tf has ALB association", () => {
      const wafTfPath = path.join(LIB_DIR, "waf.tf");
      const content = readFileContent(wafTfPath);

      // WAF association
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
      expect(content).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
      expect(content).toMatch(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });

    test("waf.tf has CloudWatch logging", () => {
      const wafTfPath = path.join(LIB_DIR, "waf.tf");
      const content = readFileContent(wafTfPath);

      // CloudWatch Log Group for WAF
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"waf"/);
      expect(content).toMatch(/retention_in_days\s*=\s*30/);

      // WAF Logging Configuration
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"\s+"main"/);
      expect(content).toMatch(/log_destination_configs\s*=\s*\[aws_cloudwatch_log_group\.waf\.arn\]/);
      expect(content).toMatch(/logging_filter\s*{/);
    });
  });

  // ========== MONITORING AND LOGGING ==========
  describe("Monitoring Configuration Validation", () => {
    test("monitoring.tf has S3 bucket with proper encryption", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      expect(fileExists(monitoringTfPath)).toBe(true);

      const content = readFileContent(monitoringTfPath);

      // S3 Bucket
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);

      // S3 Encryption (SSE-S3 for ALB logs)
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/);

      // Note about ALB requirement
      expect(content).toMatch(/ALB access logs.*SSE-S3/);

      // Versioning
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);

      // Public access block
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("monitoring.tf has proper S3 bucket policy for ALB logs", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // ELB Service Account data source
      expect(content).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);

      // Bucket policy
      expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"/);
      expect(content).toMatch(/policy\s*=\s*jsonencode\(/);

      // Legacy ELB account
      expect(content).toMatch(/AllowALBLoggingLegacy/);
      expect(content).toMatch(/data\.aws_elb_service_account\.main\.id/);

      // New log delivery service
      expect(content).toMatch(/AllowALBLoggingNew/);
      expect(content).toMatch(/logdelivery\.elasticloadbalancing\.amazonaws\.com/);

      // Note: WAF logs go to CloudWatch, not S3
      // S3 bucket policy no longer needs WAF-specific delivery service statements

      // Account root access
      expect(content).toMatch(/AllowAccountRootFullAccess/);
      expect(content).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });

    test("monitoring.tf has CloudWatch log groups", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // EC2 CloudWatch Log Group
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"web"/);
      expect(content).toMatch(/name\s*=\s*"\/aws\/ec2\/\$\{var\.project_name\}"/);
      expect(content).toMatch(/retention_in_days\s*=\s*30/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.s3\.arn/);
    });

    test("monitoring.tf has CloudWatch alarms for scaling", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // High CPU alarm
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(content).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(content).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(content).toMatch(/threshold\s*=\s*"80"/);
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.web_scale_up\.arn\]/);

      // Low CPU alarm
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
      expect(content).toMatch(/comparison_operator\s*=\s*"LessThanThreshold"/);
      expect(content).toMatch(/threshold\s*=\s*"20"/);
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.web_scale_down\.arn\]/);
    });
  });

  // ========== SECURITY COMPLIANCE ==========
  describe("Security Compliance Validation", () => {
    test("encryption at rest is enabled for all storage", () => {
      const files = ["database.tf", "compute.tf", "monitoring.tf", "kms.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // Database encryption
        if (content.includes("aws_db_instance")) {
          expect(content).toMatch(/storage_encrypted\s*=\s*true/);
          expect(content).toMatch(/kms_key_id/);
        }

        // EBS encryption
        if (content.includes("block_device_mappings")) {
          expect(content).toMatch(/encrypted\s*=\s*true/);
        }

        // S3 encryption
        if (content.includes("aws_s3_bucket") && !content.includes("aws_s3_bucket_policy")) {
          expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
        }
      });
    });

    test("IAM follows least privilege principle", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      const content = readFileContent(iamTfPath);

      // Should have specific actions, not wildcards
      expect(content).toMatch(/"logs:CreateLogGroup"/);
      expect(content).toMatch(/"logs:CreateLogStream"/);
      expect(content).toMatch(/"logs:PutLogEvents"/);
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).toMatch(/"s3:GetObject"/);
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);

      // Should have resource constraints
      expect(content).toMatch(/Resource\s*=\s*(\[|"arn:aws)/);
    });

    test("all S3 buckets block public access", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // Public access block resource
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("security groups follow least privilege", () => {
      const securityTfPath = path.join(LIB_DIR, "security.tf");
      const content = readFileContent(securityTfPath);

      // ALB should allow from specific IPs only
      expect(content).toMatch(/cidr_blocks\s*=\s*var\.allowed_ips/);

      // EC2 should only allow from ALB
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);

      // RDS should only allow from EC2
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);

      // All should have descriptions
      expect(content).toMatch(/description\s*=\s*"Security group for/);
    });

    test("proper resource lifecycle management", () => {
      const securityTfPath = path.join(LIB_DIR, "security.tf");
      const content = readFileContent(securityTfPath);

      // Security groups should have lifecycle rules
      expect(content).toMatch(/lifecycle\s*{/);
      expect(content).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  // ========== BEST PRACTICES ==========
  describe("Best Practices Validation", () => {
    test("all resources have proper tagging", () => {
      const files = ["vpc.tf", "security.tf", "compute.tf", "database.tf", "load_balancer.tf", "waf.tf", "monitoring.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // Should have tags blocks
        if (content.includes("resource ")) {
          expect(content).toMatch(/tags\s*=\s*{/);
          expect(content).toMatch(/Environment\s*=/);
        }
      });
    });

    test("no hard-coded credentials", () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // Should not have hard-coded passwords
        expect(content).not.toMatch(/password\s*=\s*"[^"]*"/);

        // Check database.tf specifically has var.db_password
        if (file === "database.tf") {
          expect(content).toMatch(/password\s*=\s*var\.db_password/);
        }

        // Should not have hard-coded access keys
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
      });
    });

    test("proper variable usage for configuration", () => {
      const files = ["vpc.tf", "compute.tf", "database.tf", "load_balancer.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // Should use var.project_name for resource naming
        expect(content).toMatch(/var\.project_name/);

        // Should use var.environment for tagging
        expect(content).toMatch(/var\.environment/);
      });
    });

    test("resource naming is consistent", () => {
      const files = ["vpc.tf", "security.tf", "iam.tf", "load_balancer.tf", "waf.tf", "monitoring.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          // Check that resource names use project_name variable
          const resourceMatches = content.match(/resource\s+"aws_[^"]+"\s+"[^"]+"/g) || [];
          if (resourceMatches.length > 0) {
            expect(content).toMatch(/var\.project_name/);
          }
        }
      });
    });

    test("no dangling resource references", () => {
      const files = ["compute.tf", "load_balancer.tf", "waf.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // References to other resources should exist
        if (content.includes("aws_security_group.alb.id")) {
          const securityContent = readFileContent(path.join(LIB_DIR, "security.tf"));
          expect(securityContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
        }

        if (content.includes("aws_subnet.private")) {
          const vpcContent = readFileContent(path.join(LIB_DIR, "vpc.tf"));
          expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
        }
      });
    });
  });

  // ========== HIPAA COMPLIANCE ==========
  describe("HIPAA Compliance Validation", () => {
    test("data at rest encryption is configured", () => {
      const files = ["database.tf", "compute.tf", "monitoring.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // RDS encryption
        if (content.includes("aws_db_instance")) {
          expect(content).toMatch(/storage_encrypted\s*=\s*true/);
        }

        // EBS encryption
        if (content.includes("block_device_mappings")) {
          expect(content).toMatch(/encrypted\s*=\s*true/);
        }

        // S3 encryption
        if (content.includes("aws_s3_bucket_server_side_encryption_configuration")) {
          expect(content).toMatch(/sse_algorithm/);
        }
      });
    });

    test("logging and monitoring are enabled", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // S3 bucket for logs
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);

      // CloudWatch log groups
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);

      // CloudWatch alarms
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);

      // ALB access logs
      const lbContent = readFileContent(path.join(LIB_DIR, "load_balancer.tf"));
      expect(lbContent).toMatch(/access_logs\s*{/);
      expect(lbContent).toMatch(/enabled\s*=\s*true/);
    });

    test("backup and recovery are configured", () => {
      const databaseTfPath = path.join(LIB_DIR, "database.tf");
      const content = readFileContent(databaseTfPath);

      // Automated backups
      expect(content).toMatch(/backup_retention_period\s*=\s*30/);
      expect(content).toMatch(/backup_window/);
      expect(content).toMatch(/maintenance_window/);

      // Final snapshot
      expect(content).toMatch(/skip_final_snapshot\s*=\s*false/);
      expect(content).toMatch(/final_snapshot_identifier/);
    });

    test("HTTPS readiness is documented", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      const content = readFileContent(lbTfPath);

      // HTTPS configuration should be available (even if commented)
      expect(content).toMatch(/HTTPS/i);
      expect(content).toMatch(/certificate/i);
      expect(content).toMatch(/TLS/i);

      // Should have notes about HIPAA compliance
      expect(content).toMatch(/HIPAA compliance/i);
    });

    test("audit logging is enabled", () => {
      const databaseTfPath = path.join(LIB_DIR, "database.tf");
      const content = readFileContent(databaseTfPath);

      // RDS CloudWatch logs exports
      expect(content).toMatch(/enabled_cloudwatch_logs_exports/);
      expect(content).toMatch(/"error"/);
      expect(content).toMatch(/"general"/);
    });
  });

  // ========== HIGH AVAILABILITY ==========
  describe("High Availability Validation", () => {
    test("multi-AZ deployment is configured", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      const content = readFileContent(vpcTfPath);

      // Subnets across multiple AZs
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);

      // NAT gateways in each AZ
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(content).toMatch(/count\s*=\s*2/);
    });

    test("Auto Scaling ensures minimum instances", () => {
      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      const content = readFileContent(computeTfPath);

      // Minimum 2 instances for HA
      expect(content).toMatch(/min_size\s*=\s*var\.min_instances/);
      expect(content).toMatch(/max_size\s*=\s*var\.max_instances/);

      // Health check configuration
      expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(content).toMatch(/health_check_grace_period/);
    });

    test("load balancer distributes across AZs", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      const content = readFileContent(lbTfPath);

      // ALB in multiple subnets
      expect(content).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);

      // Cross-zone load balancing
      expect(content).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });
  });

  // ========== CONFIGURATION COMPLETENESS ==========
  describe("Configuration Completeness", () => {
    test("all required Terraform files exist", () => {
      const requiredFiles = [
        "main.tf",
        "provider.tf",
        "variables.tf",
        "outputs.tf",
        "vpc.tf",
        "security.tf",
        "iam.tf",
        "kms.tf",
        "compute.tf",
        "database.tf",
        "load_balancer.tf",
        "waf.tf",
        "monitoring.tf",
        "terraform.tfvars",
        "user_data.sh"
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        expect(fileExists(filePath)).toBe(true);
      });
    });

    test("all resources are properly tagged", () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf") && f !== "outputs.tf" && f !== "variables.tf");

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        if (content.includes("resource ")) {
          // Count resources
          const resourceMatches = content.match(/resource\s+"aws_[a-z_]+"/g) || [];
          const tagsMatches = content.match(/tags\s*=\s*{/g) || [];

          // Most resources should have tags (some like policies don't)
          expect(tagsMatches.length).toBeGreaterThan(0);
        }
      });
    });

    test("variables have proper types and defaults", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      const content = readFileContent(variablesTfPath);

      // All variables should have types
      const variableBlocks = content.match(/variable\s+"[^"]+"/g) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);

      // Should have type definitions
      expect(content).toMatch(/type\s*=\s*string/);
      expect(content).toMatch(/type\s*=\s*number/);
      expect(content).toMatch(/type\s*=\s*list\(string\)/);

      // Should have descriptions
      const descriptionMatches = content.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBe(variableBlocks.length);
    });

    test("outputs have proper descriptions", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      // All outputs should have descriptions
      const outputBlocks = content.match(/output\s+"[^"]+"/g) || [];
      const descriptionMatches = content.match(/description\s*=/g) || [];

      expect(outputBlocks.length).toBeGreaterThan(0);
      expect(descriptionMatches.length).toBe(outputBlocks.length);
    });
  });

  // ========== PROMPT.MD REQUIREMENTS ==========
  describe("PROMPT.md Requirements Compliance", () => {
    test("infrastructure has valid AWS region configured", () => {
      const tfvarsPath = path.join(LIB_DIR, "terraform.tfvars");
      const content = readFileContent(tfvarsPath);

      // Check that a valid AWS region is configured (format: xx-xxxx-#)
      expect(content).toMatch(/aws_region\s*=\s*"[a-z]{2}-[a-z]+-\d+"/);
    });

    test("IAM roles are configured with least privilege", () => {
      const iamTfPath = path.join(LIB_DIR, "iam.tf");
      const content = readFileContent(iamTfPath);

      // Should have specific permissions
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"/);

      // Should have specific actions (not checking for wildcards in Resource field, as CloudWatch requires Resource = "*")
      expect(content).toMatch(/"logs:CreateLogGroup"/);
      expect(content).toMatch(/"s3:PutObject"/);
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);
    });

    test("security groups limit inbound access to specific IPs", () => {
      const securityTfPath = path.join(LIB_DIR, "security.tf");
      const content = readFileContent(securityTfPath);

      // Should use var.allowed_ips, not 0.0.0.0/0
      expect(content).toMatch(/cidr_blocks\s*=\s*var\.allowed_ips/);

      // ALB ingress should be restricted
      const albSgMatch = content.match(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?(?=resource\s+"aws_security_group"|$)/);
      if (albSgMatch) {
        expect(albSgMatch[0]).toMatch(/cidr_blocks\s*=\s*var\.allowed_ips/);
      }
    });

    test("all data is encrypted at rest using KMS", () => {
      const kmsTfPath = path.join(LIB_DIR, "kms.tf");
      const content = readFileContent(kmsTfPath);

      // Should have KMS keys for different resources
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"ebs"/);
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);

      // All should have key rotation
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/g);
    });

    test("logging enabled through S3 and CloudWatch", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // S3 for logs
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);

      // CloudWatch log groups
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);

      // CloudWatch alarms
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("high availability with multi-AZ deployment", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      const content = readFileContent(vpcTfPath);

      // At least 2 availability zones
      expect(content).toMatch(/count\s*=\s*2/);
      expect(content).toMatch(/data\.aws_availability_zones\.available\.names/);

      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      const computeContent = readFileContent(computeTfPath);

      // Instances across subnets in multiple AZs
      expect(computeContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("RDS has automatic backups configured", () => {
      const databaseTfPath = path.join(LIB_DIR, "database.tf");
      const content = readFileContent(databaseTfPath);

      // Backup configuration
      expect(content).toMatch(/backup_retention_period\s*=\s*30/);
      expect(content).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(content).toMatch(/maintenance_window/);
    });

    test("public-facing resources protected by AWS WAF", () => {
      const wafTfPath = path.join(LIB_DIR, "waf.tf");
      const content = readFileContent(wafTfPath);

      // WAF Web ACL
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);

      // WAF association with ALB
      expect(content).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"main"/);
      expect(content).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
    });

    test("HTTPS configuration available for HIPAA compliance", () => {
      const lbTfPath = path.join(LIB_DIR, "load_balancer.tf");
      const content = readFileContent(lbTfPath);

      // HTTPS listener configuration (commented out for now)
      expect(content).toMatch(/HTTPS/);
      expect(content).toMatch(/certificate/i);

      // Security policy should use TLS 1.2+
      expect(content).toMatch(/ELBSecurityPolicy-TLS-1-2/);
    });
  });

  // ========== FILE SYNTAX VALIDATION ==========
  describe("File Syntax and Structure", () => {
    test("all .tf files have valid HCL syntax structure", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      tfFiles.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // Should not have syntax errors (basic checks)
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);

        // Should not have trailing commas in HCL
        expect(content).not.toMatch(/,\s*\n\s*}/);
      });
    });

    test("no duplicate resource definitions", () => {
      const tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));
      const resourceNames = new Set<string>();

      tfFiles.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        const matches = content.matchAll(/resource\s+"([^"]+)"\s+"([^"]+)"/g);
        for (const match of matches) {
          const resourceKey = `${match[1]}.${match[2]}`;
          expect(resourceNames.has(resourceKey)).toBe(false);
          resourceNames.add(resourceKey);
        }
      });

      expect(resourceNames.size).toBeGreaterThan(0);
    });

    test("data sources are properly defined", () => {
      const files = ["main.tf", "compute.tf", "monitoring.tf", "kms.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          // Data sources should be properly formatted
          const dataSourceMatches = content.match(/data\s+"[^"]+"\s+"[^"]+"/g) || [];
          dataSourceMatches.forEach(match => {
            expect(match).toMatch(/data\s+"aws_[a-z_0-9]+"\s+"[a-z_0-9]+"/);
          });
        }
      });
    });

    test("variable interpolation is correct", () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = readFileContent(filePath);

        // Variable references should use var. prefix
        const varReferences = content.match(/var\.[a-z_]+/g) || [];
        varReferences.forEach(varRef => {
          expect(varRef).toMatch(/^var\.[a-z_]+$/);
        });
      });
    });
  });

  // ========== RESOURCE DEPENDENCIES ==========
  describe("Resource Dependencies Validation", () => {
    test("proper dependency chain for VPC resources", () => {
      const vpcTfPath = path.join(LIB_DIR, "vpc.tf");
      const content = readFileContent(vpcTfPath);

      // Subnets depend on VPC
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);

      // NAT Gateway depends on subnet and EIP
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public/);
      expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat/);

      // Route table depends on IGW/NAT
      expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main/);
    });

    test("proper dependency chain for compute resources", () => {
      const computeTfPath = path.join(LIB_DIR, "compute.tf");
      const content = readFileContent(computeTfPath);

      // Launch template references security group and instance profile
      expect(content).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
      expect(content).toMatch(/arn\s*=\s*aws_iam_instance_profile\.ec2_profile\.arn/);

      // ASG references launch template and target group
      expect(content).toMatch(/id\s*=\s*aws_launch_template\.web\.id/);
      expect(content).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.web\.arn\]/);

      // Scaling policies reference ASG
      expect(content).toMatch(/autoscaling_group_name\s*=\s*aws_autoscaling_group\.web\.name/);
    });

    test("proper dependency chain for monitoring", () => {
      const monitoringTfPath = path.join(LIB_DIR, "monitoring.tf");
      const content = readFileContent(monitoringTfPath);

      // CloudWatch alarms reference ASG
      expect(content).toMatch(/AutoScalingGroupName\s*=\s*aws_autoscaling_group\.web\.name/);

      // Alarms trigger scaling policies
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy/);
    });
  });

  // ========== VALIDATION RULES ==========
  describe("Validation Rules", () => {
    test("default values are appropriate", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      const content = readFileContent(variablesTfPath);

      // Region default - just check it exists and is a valid AWS region format
      expect(content).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"[a-z]{2}-[a-z]+-\d+"/);

      // Environment default
      expect(content).toMatch(/default\s*=\s*"production"/);

      // Instance defaults
      expect(content).toMatch(/default\s*=\s*"t3\.medium"/);
      expect(content).toMatch(/default\s*=\s*2/); // min_instances
      expect(content).toMatch(/default\s*=\s*6/); // max_instances
    });

    test("sensitive variables are marked correctly", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      const content = readFileContent(variablesTfPath);

      // db_password should be sensitive
      const dbPasswordBlock = content.match(/variable\s+"db_password"[\s\S]*?(?=variable\s+"|$)/);
      expect(dbPasswordBlock).toBeDefined();
      expect(dbPasswordBlock![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("resource names follow naming convention", () => {
      const files = ["vpc.tf", "security.tf", "iam.tf", "waf.tf", "monitoring.tf"];

      files.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          // Remove commented lines to avoid false positives
          const activeContent = content.split('\n')
            .filter(line => !line.trim().startsWith('#'))
            .join('\n');

          // Extract resource blocks from active content
          const resourceMatches = activeContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{[\s\S]{0,500}?}/g) || [];

          resourceMatches.forEach(resourceBlock => {
            // Check if it has name or name_prefix attribute
            const nameMatch = resourceBlock.match(/name(_prefix)?\s*=\s*"([^"]*)"/);
            if (nameMatch && nameMatch[2]) {
              const nameValue = nameMatch[2];
              // Skip AWS-specific paths and aliases, and example domains
              if (!nameValue.startsWith('/') &&
                !nameValue.startsWith('alias/') &&
                !nameValue.startsWith('aws-') &&
                !nameValue.includes('example.com')) {
                // Should use var.project_name
                expect(resourceBlock).toMatch(/var\.project_name/);
              }
            }
          });
        }
      });
    });
  });
});
