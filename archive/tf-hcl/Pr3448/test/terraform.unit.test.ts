// Unit Tests for Multi-Region Terraform Infrastructure
// Validates that all Terraform configurations meet PROMPT.md requirements
// No Terraform commands executed - validates HCL syntax and structure

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const MODULES_DIR = path.resolve(LIB_DIR, "modules");

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

describe("Multi-Region Infrastructure - Terraform Configuration Validation", () => {
  describe("Root Module Structure", () => {
    test("main.tf exists and has proper structure", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // Should have multi-region module structure
      expect(content).toMatch(/module\s+"kms_r[0-2]"/);
      expect(content).toMatch(/module\s+"networking_r[0-2]"/);
      expect(content).toMatch(/module\s+"compute_r[0-2]"/);
      expect(content).toMatch(/module\s+"database_r[0-2]"/);
      expect(content).toMatch(/module\s+"monitoring_r[0-2]"/);

      // Should use providers for multi-region
      expect(content).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.r[0-2]\s*}/);
    });

    test("provider.tf exists with multi-region configuration", () => {
      const providerTfPath = path.join(LIB_DIR, "provider.tf");
      expect(fileExists(providerTfPath)).toBe(true);

      const content = readFileContent(providerTfPath);

      // Should have aliased providers for multi-region support
      expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"r0"/);
      expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"r1"/);
      expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"r2"/);

      // Should have required providers block
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{\s*source\s*=\s*"hashicorp\/aws"/);

      // Should have backend configuration
      expect(content).toMatch(/backend\s+"(s3|local)"/);
    });

    test("variables.tf exists with required variables", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      expect(fileExists(variablesTfPath)).toBe(true);

      const content = readFileContent(variablesTfPath);

      // Required variables from PROMPT.md
      expect(content).toMatch(/variable\s+"regions"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"vpc_cidrs"/);
      expect(content).toMatch(/variable\s+"aws_region"/);

      // Validation rules should be present
      expect(content).toMatch(/validation\s*{/);
      expect(content).toMatch(/condition\s*=\s*length\(var\.regions\)\s*>\s*0/);
      expect(content).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test("outputs.tf exists with required outputs", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      expect(fileExists(outputsTfPath)).toBe(true);

      const content = readFileContent(outputsTfPath);

      // Should expose infrastructure details per region
      expect(content).toMatch(/output\s+"region_infrastructure"/);
      expect(content).toMatch(/vpc_id\s*=/);
      expect(content).toMatch(/alb_dns\s*=/);
      expect(content).toMatch(/rds_endpoint\s*=/);
      expect(content).toMatch(/dynamodb_table_name\s*=/);
      expect(content).toMatch(/cloudtrail_bucket\s*=/);

      // Should expose KMS keys
      expect(content).toMatch(/output\s+"kms_keys"/);
      expect(content).toMatch(/sensitive\s*=\s*true/);
    });

    test("locals.tf exists with proper calculations", () => {
      const localsTfPath = path.join(LIB_DIR, "locals.tf");
      expect(fileExists(localsTfPath)).toBe(true);

      const content = readFileContent(localsTfPath);

      // Should have common tags
      expect(content).toMatch(/common_tags\s*=/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);

      // Should have name prefix with random suffix
      expect(content).toMatch(/name_prefix\s*=/);
      expect(content).toMatch(/random_string\.suffix\.result/);

      // Should have region padding logic
      expect(content).toMatch(/regions_padded\s*=/);
      expect(content).toMatch(/region0\s*=/);
      expect(content).toMatch(/region1\s*=/);
      expect(content).toMatch(/region2\s*=/);

      // Should have subnet CIDR calculations
      expect(content).toMatch(/subnet_cidrs\s*=/);
      expect(content).toMatch(/cidrsubnet\(/);
    });

    test("terraform.tfvars.example exists with proper values", () => {
      const tfvarsPath = path.join(LIB_DIR, "terraform.tfvars");
      expect(fileExists(tfvarsPath)).toBe(true);

      const content = readFileContent(tfvarsPath);

      // Should have multi-region configuration
      expect(content).toMatch(/regions\s*=\s*\[/);
      expect(content).toMatch(/vpc_cidrs\s*=\s*{/);
      expect(content).toMatch(/environment\s*=/);

      // Should have proper CIDR blocks (non-overlapping)
      expect(content).toMatch(/10\.[0-9]+\.0\.0\/16/);
    });
  });

  describe("Security Module Validation", () => {
    const securityModulePath = path.join(MODULES_DIR, "security");

    test("security module exists with KMS configuration", () => {
      const mainTfPath = path.join(securityModulePath, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // KMS key with proper configuration
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(content).toMatch(/deletion_window_in_days\s*=\s*30/);

      // KMS key policy with proper permissions
      expect(content).toMatch(/policy\s*=\s*jsonencode\(/);
      expect(content).toMatch(/"kms:\*"/);
      expect(content).toMatch(/"ec2\.amazonaws\.com"/);
      expect(content).toMatch(/"autoscaling\.amazonaws\.com"/);

      // KMS alias
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("security module has IAM configuration", () => {
      const mainTfPath = path.join(securityModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // IAM role for instances
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"instance"/);
      expect(content).toMatch(/assume_role_policy\s*=\s*jsonencode\(/);
      expect(content).toMatch(/"ec2\.amazonaws\.com"/);

      // IAM role policy with least privilege
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"instance"/);
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);
      expect(content).toMatch(/"logs:CreateLogGroup"/);
      expect(content).toMatch(/"s3:GetObject"/);
      expect(content).toMatch(/"kms:Decrypt"/);

      // IAM instance profile
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"instance"/);
    });

    test("security module has S3 bucket with encryption", () => {
      const mainTfPath = path.join(securityModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // S3 bucket for application data
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_data"/);

      // S3 encryption with KMS
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);

      // S3 versioning
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);

      // S3 public access block
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);

      // S3 lifecycle configuration
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });
  });

  describe("Networking Module Validation", () => {
    const networkingModulePath = path.join(MODULES_DIR, "networking");

    test("networking module has VPC configuration", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // VPC with proper configuration
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);

      // VPC Flow Logs
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);

      // CloudWatch Log Group for Flow Logs
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"/);
      expect(content).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("networking module has multi-AZ subnet configuration", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Public subnets
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);

      // Private subnets
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones/);

      // Database subnets
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones/);
    });

    test("networking module has NAT gateways and route tables", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Internet Gateway
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);

      // Elastic IPs for NAT
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones/);

      // NAT Gateways
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones/);

      // Route tables
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones/);

      // Routes
      expect(content).toMatch(/resource\s+"aws_route"\s+"public_internet"/);
      expect(content).toMatch(/resource\s+"aws_route"\s+"private_nat"/);

      // Route table associations
      expect(content).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test("networking module has Network ACLs", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Network ACL for public subnets
      expect(content).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
      expect(content).toMatch(/ingress\s*{/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/from_port\s*=\s*443/);

      // Network ACL for private subnets
      expect(content).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
    });
  });

  describe("Compute Module Validation", () => {
    const computeModulePath = path.join(MODULES_DIR, "compute");

    test("compute module has ALB configuration", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // Application Load Balancer
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(content).toMatch(/internal\s*=\s*false/);
      expect(content).toMatch(/enable_http2\s*=\s*true/);
      expect(content).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);

      // Target Group
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
      expect(content).toMatch(/target_type\s*=\s*"instance"/);
      expect(content).toMatch(/health_check\s*{/);
      expect(content).toMatch(/path\s*=\s*"\/health"/);

      // Listeners
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });

    test("compute module has Auto Scaling Group", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Launch Template
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(content).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(content).toMatch(/metadata_options\s*{/);
      expect(content).toMatch(/http_tokens\s*=\s*"required"/);
      expect(content).toMatch(/block_device_mappings\s*{/);
      expect(content).toMatch(/encrypted\s*=\s*true/);
      // kms_key_id may be omitted to use AWS-managed EBS key (aws/ebs)

      // Auto Scaling Group
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(content).toMatch(/health_check_grace_period/);
      expect(content).toMatch(/target_group_arns/);

      // Enabled metrics
      expect(content).toMatch(/enabled_metrics\s*=\s*\[/);
      expect(content).toMatch(/"GroupMinSize"/);
      expect(content).toMatch(/"GroupMaxSize"/);
      expect(content).toMatch(/"GroupDesiredCapacity"/);
    });

    test("compute module has security groups", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // ALB Security Group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/from_port\s*=\s*443/);
      expect(content).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);

      // Application Security Group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);

      // Lifecycle rules
      expect(content).toMatch(/lifecycle\s*{/);
      expect(content).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("compute module has S3 bucket for ALB logs", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // S3 bucket for ALB logs
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"/);

      // S3 encryption
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*var\.kms_key_id/);

      // S3 public access block
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);

      // S3 bucket policy for ALB
      expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs"/);
      expect(content).toMatch(/data\s+"aws_elb_service_account"\s+"main"/);
    });

    test("compute module has user data script", () => {
      const userDataPath = path.join(computeModulePath, "user_data.sh");
      expect(fileExists(userDataPath)).toBe(true);

      const content = readFileContent(userDataPath);

      // Should install and configure services
      expect(content).toMatch(/yum\s+install\s+-y\s+httpd/);
      expect(content).toMatch(/systemctl\s+enable\s+httpd/);
      expect(content).toMatch(/systemctl\s+start\s+httpd/);

      // Should create health check endpoint
      expect(content).toMatch(/\/health/);
      expect(content).toMatch(/health\s+check/);

      // Should install monitoring agents
      expect(content).toMatch(/amazon-cloudwatch-agent/);
      expect(content).toMatch(/amazon-ssm-agent/);
    });
  });

  describe("Database Module Validation", () => {
    const databaseModulePath = path.join(MODULES_DIR, "database");

    test("database module has RDS Multi-AZ configuration", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // DB Subnet Group
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);

      // RDS Instance with Multi-AZ
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(content).toMatch(/multi_az\s*=\s*true/);
      expect(content).toMatch(/backup_retention_period/);
      expect(content).toMatch(/backup_window/);
      expect(content).toMatch(/maintenance_window/);
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
      expect(content).toMatch(/kms_key_id\s*=\s*var\.kms_key_id/);

      // CloudWatch Logs Export
      expect(content).toMatch(/enabled_cloudwatch_logs_exports/);
    });

    test("database module has DynamoDB configuration", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // DynamoDB Table
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"main"/);
      expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(content).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/);

      // Key schema
      expect(content).toMatch(/hash_key\s*=\s*"id"/);
      expect(content).toMatch(/attribute\s*{/);
      expect(content).toMatch(/name\s*=\s*"id"/);
      expect(content).toMatch(/type\s*=\s*"S"/);

      // Server-side encryption
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
      expect(content).toMatch(/kms_key_id\s*=\s*var\.kms_key_id/);
    });

    test("database module has security groups", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // RDS Security Group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(content).toMatch(/from_port\s*=\s*3306/);
      expect(content).toMatch(/to_port\s*=\s*3306/);
      expect(content).toMatch(/security_groups\s*=\s*\[var\.security_group_id\]/);

      // Lifecycle rules
      expect(content).toMatch(/lifecycle\s*{/);
      expect(content).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("database module has AWS Backup configuration", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // AWS Backup resources
      expect(content).toMatch(/resource\s+"aws_backup_plan"/);
      expect(content).toMatch(/resource\s+"aws_backup_vault"/);
      expect(content).toMatch(/resource\s+"aws_backup_selection"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"backup"/);
    });
  });

  describe("Monitoring Module Validation", () => {
    const monitoringModulePath = path.join(MODULES_DIR, "monitoring");

    test("monitoring module has CloudTrail configuration", () => {
      const mainTfPath = path.join(monitoringModulePath, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // CloudTrail S3 bucket
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);

      // CloudTrail S3 encryption
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*var\.kms_key_id/);

      // CloudTrail S3 public access block
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);

      // CloudTrail S3 lifecycle
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail"/);

      // CloudTrail S3 bucket policy
      expect(content).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(content).toMatch(/"AWS:SourceArn"/);

      // CloudTrail
      expect(content).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(content).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
      expect(content).toMatch(/include_global_service_events\s*=\s*true/);
      expect(content).toMatch(/enable_logging\s*=\s*true/);
      expect(content).toMatch(/event_selector\s*{/);
      expect(content).toMatch(/data_resource\s*{/);
    });

    test("monitoring module has CloudWatch alarms", () => {
      const mainTfPath = path.join(monitoringModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // CloudWatch alarms for different services
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_unhealthy_hosts"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_storage"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"/);

      // Alarm configurations
      expect(content).toMatch(/comparison_operator/);
      expect(content).toMatch(/evaluation_periods/);
      expect(content).toMatch(/threshold/);
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alarms\.arn\]/);
    });

    test("monitoring module has SNS notifications", () => {
      const mainTfPath = path.join(monitoringModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // SNS Topic
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
      expect(content).toMatch(/kms_master_key_id\s*=\s*var\.kms_key_id/);

      // SNS Topic Subscription
      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"/);
      expect(content).toMatch(/protocol\s*=\s*"email"/);
      expect(content).toMatch(/endpoint\s*=\s*var\.alarm_email/);
    });

    test("monitoring module has CloudWatch dashboard", () => {
      const mainTfPath = path.join(monitoringModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // CloudWatch Dashboard
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      expect(content).toMatch(/dashboard_body\s*=\s*jsonencode\(/);
      expect(content).toMatch(/widgets\s*=\s*\[/);
      expect(content).toMatch(/type\s*=\s*"metric"/);
      expect(content).toMatch(/AWS\/ApplicationELB/);
      expect(content).toMatch(/AWS\/EC2/);
      expect(content).toMatch(/AWS\/RDS/);
    });
  });

  describe("Module Structure Validation", () => {
    const modules = ["security", "networking", "compute", "database", "monitoring"];

    modules.forEach(moduleName => {
      describe(`${moduleName} module structure`, () => {
        const modulePath = path.join(MODULES_DIR, moduleName);

        test(`${moduleName} module has required files`, () => {
          expect(fileExists(path.join(modulePath, "main.tf"))).toBe(true);
          expect(fileExists(path.join(modulePath, "variables.tf"))).toBe(true);
          expect(fileExists(path.join(modulePath, "outputs.tf"))).toBe(true);
          expect(fileExists(path.join(modulePath, "versions.tf"))).toBe(true);
        });

        test(`${moduleName} module variables.tf has proper structure`, () => {
          const variablesTfPath = path.join(modulePath, "variables.tf");
          const content = readFileContent(variablesTfPath);

          // Should have common variables
          expect(content).toMatch(/variable\s+"environment"/);
          expect(content).toMatch(/variable\s+"region"/);
          expect(content).toMatch(/variable\s+"name_prefix"/);

          // Should have proper descriptions
          expect(content).toMatch(/description\s*=/);
          expect(content).toMatch(/type\s*=/);
        });

        test(`${moduleName} module outputs.tf has proper structure`, () => {
          const outputsTfPath = path.join(modulePath, "outputs.tf");
          const content = readFileContent(outputsTfPath);

          // Should have proper output structure
          expect(content).toMatch(/output\s+"/);
          expect(content).toMatch(/value\s*=/);
        });

        test(`${moduleName} module versions.tf has proper structure`, () => {
          const versionsTfPath = path.join(modulePath, "versions.tf");
          const content = readFileContent(versionsTfPath);

          // Should have required providers
          expect(content).toMatch(/required_providers\s*{/);
          expect(content).toMatch(/aws\s*=\s*{/);
          expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
        });
      });
    });
  });

  describe("Best Practices Validation", () => {
    test("all resources have proper tagging", () => {
      const localsTfPath = path.join(LIB_DIR, "locals.tf");
      const content = readFileContent(localsTfPath);

      // Should define common tags
      expect(content).toMatch(/common_tags\s*=/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("no hard-coded resource names", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should use name_prefix for resource naming
      expect(content).toMatch(/name_prefix\s*=\s*local\.name_prefix/);

      // Should not have hard-coded names
      expect(content).not.toMatch(/"my-app-"/);
      expect(content).not.toMatch(/"production-"/);
      expect(content).not.toMatch(/"staging-"/);
    });

    test("proper dependency management", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should have explicit dependencies
      expect(content).toMatch(/depends_on\s*=\s*\[/);
      expect(content).toMatch(/module\.networking_r[0-2]\[0\]/);
    });

    test("proper resource references", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should reference module outputs properly
      expect(content).toMatch(/module\.kms_r[0-2]\[0\]\.kms_key_id/);
      expect(content).toMatch(/module\.networking_r[0-2]\[0\]\.vpc_id/);
      expect(content).toMatch(/module\.networking_r[0-2]\[0\]\.private_subnet_ids/);
    });

    test("idempotent configuration", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should use count for conditional resources
      expect(content).toMatch(/count\s*=\s*local\.region[0-2]\s*!=\s*null\s*\?\s*1\s*:\s*0/);

      // Should use proper conditionals
      expect(content).toMatch(/local\.region[0-2]\s*!=\s*null\s*\?/);
    });
  });

  describe("Security Compliance Validation", () => {
    test("encryption at rest is enabled", () => {
      // Check all modules for encryption
      const modules = ["security", "networking", "compute", "database", "monitoring"];

      modules.forEach(moduleName => {
        const mainTfPath = path.join(MODULES_DIR, moduleName, "main.tf");
        const content = readFileContent(mainTfPath);

        // Should have KMS encryption for storage resources
        if (content.includes("aws_s3_bucket") || content.includes("aws_db_instance") || content.includes("aws_dynamodb_table")) {
          expect(content).toMatch(/kms_master_key_id|kms_key_id/);
          if (content.includes("aws_db_instance") || content.includes("aws_dynamodb_table")) {
            expect(content).toMatch(/encrypted\s*=\s*true/);
          }
        }
      });
    });

    test("proper IAM least privilege", () => {
      const securityMainTfPath = path.join(MODULES_DIR, "security", "main.tf");
      const content = readFileContent(securityMainTfPath);

      // Should have specific permissions, not all wildcards
      expect(content).toMatch(/"cloudwatch:PutMetricData"/);
      expect(content).toMatch(/"logs:CreateLogGroup"/);
      expect(content).toMatch(/"s3:GetObject"/);
      // Allow kms:* for KMS key policy but not for IAM policies
      if (content.includes("aws_iam_role_policy")) {
        expect(content).not.toMatch(/"s3:\*"/);
        expect(content).not.toMatch(/"logs:\*"/);
      }
    });

    test("network security groups are restrictive", () => {
      const computeMainTfPath = path.join(MODULES_DIR, "compute", "main.tf");
      const content = readFileContent(computeMainTfPath);

      // ALB should only allow HTTP/HTTPS
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/from_port\s*=\s*443/);
      expect(content).toMatch(/protocol\s*=\s*"tcp"/);

      // App security group should only allow from ALB
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("public access is blocked", () => {
      // Check S3 buckets for public access blocks
      const modules = ["security", "compute", "monitoring"];

      modules.forEach(moduleName => {
        const mainTfPath = path.join(MODULES_DIR, moduleName, "main.tf");
        const content = readFileContent(mainTfPath);

        if (content.includes("aws_s3_bucket")) {
          expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
          expect(content).toMatch(/block_public_acls\s*=\s*true/);
          expect(content).toMatch(/block_public_policy\s*=\s*true/);
          expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
          expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
        }
      });
    });
  });
});
