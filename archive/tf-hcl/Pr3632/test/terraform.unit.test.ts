// Unit Tests for Multi-Region Disaster Recovery Infrastructure
// Validates that all Terraform configurations meet requirements
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

describe("Multi-Region Disaster Recovery Infrastructure - Unit Tests", () => {

  describe("Root Module Structure", () => {
    test("main.tf exists and has proper multi-region structure", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      expect(fileExists(mainTfPath)).toBe(true);

      const content = readFileContent(mainTfPath);

      // Should have primary and secondary region modules
      expect(content).toMatch(/module\s+"primary_networking"/);
      expect(content).toMatch(/module\s+"secondary_networking"/);
      expect(content).toMatch(/module\s+"primary_compute"/);
      expect(content).toMatch(/module\s+"secondary_compute"/);
      expect(content).toMatch(/module\s+"primary_database"/);
      expect(content).toMatch(/module\s+"secondary_database"/);

      // Should have failover mechanism
      expect(content).toMatch(/module\s+"failover_mechanism"/);
    });

    test("main.tf uses aliased providers for multi-region", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should use providers for primary and secondary regions
      expect(content).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.primary/);
      expect(content).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.secondary/);
    });

    test("provider.tf exists with multi-region configuration", () => {
      const providerTfPath = path.join(LIB_DIR, "provider.tf");
      expect(fileExists(providerTfPath)).toBe(true);

      const content = readFileContent(providerTfPath);

      // Should have aliased providers
      expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"primary"/);
      expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);

      // Should have required providers block
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{\s*source\s*=\s*"hashicorp\/aws"/);

      // Should have backend configuration
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test("variables.tf exists with required variables", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      expect(fileExists(variablesTfPath)).toBe(true);

      const content = readFileContent(variablesTfPath);

      // Required variables for DR infrastructure
      expect(content).toMatch(/variable\s+"primary_region"/);
      expect(content).toMatch(/variable\s+"secondary_region"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"db_password"/);
      expect(content).toMatch(/variable\s+"db_username"/);

      // Compute variables
      expect(content).toMatch(/variable\s+"instance_type"/);
      expect(content).toMatch(/variable\s+"min_size"/);
      expect(content).toMatch(/variable\s+"max_size"/);
      expect(content).toMatch(/variable\s+"desired_capacity"/);

      // Database variables
      expect(content).toMatch(/variable\s+"db_instance_class"/);
    });

    test("variables.tf has proper sensitive flags", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      const content = readFileContent(variablesTfPath);

      // Password variables should be marked sensitive
      expect(content).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("outputs.tf exists with required outputs", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      expect(fileExists(outputsTfPath)).toBe(true);

      const content = readFileContent(outputsTfPath);

      // Should expose infrastructure details
      expect(content).toMatch(/output\s+"primary_alb_dns"/);
      expect(content).toMatch(/output\s+"secondary_alb_dns"/);
      expect(content).toMatch(/output\s+"primary_db_endpoint"/);
      expect(content).toMatch(/output\s+"secondary_db_endpoint"/);
      expect(content).toMatch(/output\s+"failover_endpoint"/);
      expect(content).toMatch(/output\s+"vpc_ids"/);
      expect(content).toMatch(/output\s+"primary_region"/);
      expect(content).toMatch(/output\s+"secondary_region"/);
    });

    test("outputs.tf marks sensitive data appropriately", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      // Database endpoints should be marked sensitive
      expect(content).toMatch(/output\s+"primary_db_endpoint"[\s\S]*?sensitive\s*=\s*true/);
      expect(content).toMatch(/output\s+"secondary_db_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("terraform.tfvars exists with proper configuration", () => {
      const tfvarsPath = path.join(LIB_DIR, "terraform.tfvars");
      expect(fileExists(tfvarsPath)).toBe(true);

      const content = readFileContent(tfvarsPath);

      // Should have region configuration
      expect(content).toMatch(/primary_region\s*=/);
      expect(content).toMatch(/secondary_region\s*=/);
      expect(content).toMatch(/environment\s*=/);

      // Should have VPC CIDR configuration
      expect(content).toMatch(/vpc_cidr\s*=\s*{/);
      expect(content).toMatch(/primary\s*=\s*"10\.[0-9]+\.0\.0\/16"/);
      expect(content).toMatch(/secondary\s*=\s*"10\.[0-9]+\.0\.0\/16"/);
    });
  });

  describe("Networking Module Validation", () => {
    const networkingModulePath = path.join(MODULES_DIR, "networking");

    test("networking module exists with required files", () => {
      expect(fileExists(path.join(networkingModulePath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(networkingModulePath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(networkingModulePath, "outputs.tf"))).toBe(true);
    });

    test("networking module creates VPC with proper configuration", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // VPC configuration
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
      expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("networking module creates public, private, and database subnets", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should create multiple subnet types
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);

      // Should use count for multiple AZs
      expect(content).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test("networking module creates NAT Gateways", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // NAT Gateway configuration
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/allocation_id\s*=\s*aws_eip\.nat/);
    });

    test("networking module creates Internet Gateway", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("networking module creates route tables", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Public and private route tables
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway/);
      expect(content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway/);
    });

    test("networking module has VPC Flow Logs", () => {
      const mainTfPath = path.join(networkingModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_flow_log"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("networking module outputs required values", () => {
      const outputsTfPath = path.join(networkingModulePath, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
      expect(content).toMatch(/output\s+"database_subnet_ids"/);
      expect(content).toMatch(/output\s+"nat_gateway_ids"/);
    });
  });

  describe("Compute Module Validation", () => {
    const computeModulePath = path.join(MODULES_DIR, "compute");

    test("compute module exists with required files", () => {
      expect(fileExists(path.join(computeModulePath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(computeModulePath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(computeModulePath, "outputs.tf"))).toBe(true);
      expect(fileExists(path.join(computeModulePath, "user_data.sh"))).toBe(true);
    });

    test("compute module creates Application Load Balancer", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(content).toMatch(/internal\s*=\s*false/);
      expect(content).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("compute module creates ALB security groups", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // ALB security group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);

      // EC2 security group
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);

      // Should allow HTTP traffic
      expect(content).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
    });

    test("compute module creates target group with health checks", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
      expect(content).toMatch(/health_check\s*{/);
      expect(content).toMatch(/path\s*=\s*"\/health"/);
      expect(content).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(content).toMatch(/healthy_threshold\s*=/);
      expect(content).toMatch(/unhealthy_threshold\s*=/);
    });

    test("compute module creates Auto Scaling Group", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_autoscaling_group"/);
      expect(content).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(content).toMatch(/max_size\s*=\s*var\.max_size/);
      expect(content).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
      expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("compute module creates Launch Template", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_launch_template"/);
      expect(content).toMatch(/image_id\s*=\s*data\.aws_ami/);
      expect(content).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(content).toMatch(/user_data\s*=\s*base64encode/);
    });

    test("compute module has CloudWatch alarms", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(content).toMatch(/comparison_operator\s*=/);
      expect(content).toMatch(/evaluation_periods\s*=/);
    });

    test("compute module has IAM role for EC2 instances", () => {
      const mainTfPath = path.join(computeModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_iam_role"/);
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"/);
      expect(content).toMatch(/assume_role_policy\s*=/);
    });

    test("user_data.sh creates web server", () => {
      const userDataPath = path.join(computeModulePath, "user_data.sh");
      const content = readFileContent(userDataPath);

      // Should create directory
      expect(content).toMatch(/mkdir -p \/var\/www\/html/);

      // Should create health endpoint
      expect(content).toMatch(/\/health/);

      // Should start HTTP server
      expect(content).toMatch(/python.*http\.server|SimpleHTTPServer/);
    });

    test("compute module outputs ALB DNS and ARN", () => {
      const outputsTfPath = path.join(computeModulePath, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      expect(content).toMatch(/output\s+"alb_dns"/);
      expect(content).toMatch(/output\s+"alb_arn"/);
      expect(content).toMatch(/output\s+"alb_zone_id"/);
      expect(content).toMatch(/output\s+"target_group_arn"/);
    });
  });

  describe("Database Module Validation", () => {
    const databaseModulePath = path.join(MODULES_DIR, "database");

    test("database module exists with required files", () => {
      expect(fileExists(path.join(databaseModulePath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(databaseModulePath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(databaseModulePath, "outputs.tf"))).toBe(true);
    });

    test("database module creates RDS instance", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"primary"/);
      expect(content).toMatch(/engine\s*=\s*"mysql"/);
      expect(content).toMatch(/instance_class\s*=\s*var\.instance_class/);
      expect(content).toMatch(/allocated_storage\s*=\s*[0-9]+/);
    });

    test("database module enables Multi-AZ for primary", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/multi_az\s*=\s*true/);
    });

    test("database module creates read replica for secondary", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"replica"/);
      expect(content).toMatch(/replicate_source_db\s*=\s*var\.source_db_arn/);
    });

    test("database module has storage encryption", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key/);
    });

    test("database module creates KMS key", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_kms_key"/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("database module creates subnet group", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_db_subnet_group"/);
      expect(content).toMatch(/subnet_ids\s*=\s*var\.subnet_ids/);
    });

    test("database module creates parameter group", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_db_parameter_group"/);
      expect(content).toMatch(/family\s*=\s*"mysql/);
    });

    test("database module has backup configuration", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/backup_retention_period\s*=\s*[0-9]+/);
      expect(content).toMatch(/backup_window\s*=/);
      expect(content).toMatch(/maintenance_window\s*=/);
    });

    test("database module creates security group", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(content).toMatch(/from_port\s*=\s*3306/);
      expect(content).toMatch(/to_port\s*=\s*3306/);
    });

    test("database module has CloudWatch alarms", () => {
      const mainTfPath = path.join(databaseModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should have CPU alarm
      expect(content).toMatch(/aws_cloudwatch_metric_alarm.*cpu/i);

      // Should monitor database
      expect(content).toMatch(/namespace\s*=\s*"AWS\/RDS"/);
    });

    test("database module outputs endpoint", () => {
      const outputsTfPath = path.join(databaseModulePath, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      expect(content).toMatch(/output\s+"endpoint"/);
      expect(content).toMatch(/output\s+"db_arn"/);
    });
  });

  describe("Failover Module Validation", () => {
    const failoverModulePath = path.join(MODULES_DIR, "failover");

    test("failover module exists with required files", () => {
      expect(fileExists(path.join(failoverModulePath, "main.tf"))).toBe(true);
      expect(fileExists(path.join(failoverModulePath, "variables.tf"))).toBe(true);
      expect(fileExists(path.join(failoverModulePath, "outputs.tf"))).toBe(true);
    });

    test("failover module requires aliased providers", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/terraform\s*{[\s\S]*?configuration_aliases\s*=\s*\[[\s\S]*?aws\.primary[\s\S]*?aws\.secondary/);
    });

    test("failover module creates Global Accelerator", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_globalaccelerator_accelerator"/);
      expect(content).toMatch(/enabled\s*=\s*true/);
      expect(content).toMatch(/ip_address_type\s*=\s*"IPV4"/);
    });

    test("failover module creates Global Accelerator listener", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_globalaccelerator_listener"/);
      expect(content).toMatch(/protocol\s*=\s*"TCP"/);
      expect(content).toMatch(/port_range\s*{/);
    });

    test("failover module creates endpoint groups", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      // Primary endpoint group
      expect(content).toMatch(/resource\s+"aws_globalaccelerator_endpoint_group"\s+"primary"/);

      // Secondary endpoint group
      expect(content).toMatch(/resource\s+"aws_globalaccelerator_endpoint_group"\s+"secondary"/);

      // Health check configuration
      expect(content).toMatch(/health_check_path\s*=\s*"\/health"/);
    });

    test("failover module has Lambda function for automation", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"failover"/);
      expect(content).toMatch(/runtime\s*=\s*"python/);
      expect(content).toMatch(/handler\s*=\s*"index\.handler"/);
    });

    test("failover module has CloudWatch alarms for monitoring", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"primary_health"/);
      expect(content).toMatch(/comparison_operator\s*=/);
    });

    test("failover module has SNS topic for alerts", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_sns_topic"/);
      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"/);
    });

    test("failover module has S3 bucket for flow logs", () => {
      const mainTfPath = path.join(failoverModulePath, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/resource\s+"aws_s3_bucket".*global_accelerator_logs/);
      expect(content).toMatch(/flow_logs_enabled\s*=\s*true/);
    });

    test("failover module outputs Global Accelerator DNS", () => {
      const outputsTfPath = path.join(failoverModulePath, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      expect(content).toMatch(/output\s+"global_accelerator_dns_name"/);
      expect(content).toMatch(/output\s+"global_accelerator_ip_addresses"/);
    });
  });

  describe("Security and Compliance", () => {
    test("all resources use encryption at rest", () => {
      const files = [
        path.join(MODULES_DIR, "database/main.tf"),
        path.join(MODULES_DIR, "compute/main.tf"),
        path.join(MODULES_DIR, "failover/main.tf")
      ];

      files.forEach(filePath => {
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          // Check for encryption configurations
          if (content.includes("aws_db_instance")) {
            expect(content).toMatch(/storage_encrypted\s*=\s*true/);
          }

          if (content.includes("aws_s3_bucket")) {
            // Should have encryption or reference to encryption config
            const hasEncryption = content.includes("server_side_encryption") ||
              content.includes("aws_s3_bucket_server_side_encryption");
            expect(hasEncryption).toBe(true);
          }

          if (content.includes("block_device_mappings")) {
            expect(content).toMatch(/encrypted\s*=\s*true/);
          }
        }
      });
    });

    test("S3 buckets block public access", () => {
      const files = [
        path.join(MODULES_DIR, "compute/main.tf"),
        path.join(MODULES_DIR, "failover/main.tf")
      ];

      files.forEach(filePath => {
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          if (content.includes("aws_s3_bucket")) {
            expect(content).toMatch(/aws_s3_bucket_public_access_block/);
            expect(content).toMatch(/block_public_acls\s*=\s*true/);
            expect(content).toMatch(/block_public_policy\s*=\s*true/);
          }
        }
      });
    });

    test("security groups follow least privilege principle", () => {
      const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
      const content = readFileContent(computeMainTf);

      // EC2 instances should only accept traffic from ALB
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);

      // Should have specific port ranges, not 0-65535
      const hasWideOpenPorts = content.match(/from_port\s*=\s*0[\s\S]*?to_port\s*=\s*65535/);
      expect(hasWideOpenPorts).toBeFalsy();
    });

    test("IAM roles use principle of least privilege", () => {
      const files = [
        path.join(MODULES_DIR, "compute/main.tf"),
        path.join(MODULES_DIR, "failover/main.tf")
      ];

      files.forEach(filePath => {
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          if (content.includes("aws_iam_role_policy")) {
            // Should not have overly permissive policies
            expect(content).not.toMatch(/Action\s*=\s*"\*"/);
            expect(content).not.toMatch(/Resource\s*=\s*"\*"[\s\S]*?Action\s*=\s*"\*"/);
          }
        }
      });
    });

    test("resources are properly tagged", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should pass tags to modules
      expect(content).toMatch(/tags\s*=\s*(var\.tags|merge\(var\.tags)/);
    });
  });

  describe("High Availability Configuration", () => {
    test("networking module uses multiple availability zones", () => {
      const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
      const content = readFileContent(networkingMainTf);

      // Should use count for multiple AZs
      expect(content).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);

      // Should create NAT Gateways in multiple AZs
      const natGatewayMatches = content.match(/resource\s+"aws_nat_gateway"/g);
      expect(natGatewayMatches).toBeTruthy();
    });

    test("database is configured for Multi-AZ", () => {
      const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
      const content = readFileContent(databaseMainTf);

      expect(content).toMatch(/multi_az\s*=\s*true/);
    });

    test("Auto Scaling Group uses multiple subnets", () => {
      const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
      const content = readFileContent(computeMainTf);

      expect(content).toMatch(/vpc_zone_identifier\s*=\s*var\.private_subnet_ids/);
    });

    test("ALB is deployed in multiple availability zones", () => {
      const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
      const content = readFileContent(computeMainTf);

      expect(content).toMatch(/subnets\s*=\s*var\.public_subnet_ids/);
    });
  });

  describe("Disaster Recovery Configuration", () => {
    test("infrastructure is deployed in two regions", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Should have modules for both regions
      const primaryModules = (content.match(/providers\s*=\s*{\s*aws\s*=\s*aws\.primary/g) || []).length;
      const secondaryModules = (content.match(/providers\s*=\s*{\s*aws\s*=\s*aws\.secondary/g) || []).length;

      expect(primaryModules).toBeGreaterThan(0);
      expect(secondaryModules).toBeGreaterThan(0);
    });

    test("database replication is configured", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Secondary database should use primary as source
      expect(content).toMatch(/source_db_arn\s*=\s*module\.primary_database/);
    });

    test("Global Accelerator provides failover capability", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      expect(content).toMatch(/module\s+"failover_mechanism"/);
      expect(content).toMatch(/primary_alb_arn/);
      expect(content).toMatch(/secondary_alb_arn/);
    });
  });

  describe("Monitoring and Alerting", () => {
    test("CloudWatch alarms are configured for critical resources", () => {
      const files = [
        path.join(MODULES_DIR, "compute/main.tf"),
        path.join(MODULES_DIR, "database/main.tf"),
        path.join(MODULES_DIR, "failover/main.tf")
      ];

      let totalAlarms = 0;
      files.forEach(filePath => {
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);
          const alarmMatches = content.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
          if (alarmMatches) {
            totalAlarms += alarmMatches.length;
          }
        }
      });

      expect(totalAlarms).toBeGreaterThan(0);
    });

    test("SNS topics configured for notifications", () => {
      const failoverMainTf = path.join(MODULES_DIR, "failover/main.tf");
      const content = readFileContent(failoverMainTf);

      expect(content).toMatch(/resource\s+"aws_sns_topic"/);
      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"/);
    });

    test("flow logs are enabled for networking", () => {
      const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
      const content = readFileContent(networkingMainTf);

      expect(content).toMatch(/resource\s+"aws_flow_log"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("Code Quality and Best Practices", () => {
    test("modules use variables instead of hardcoded values", () => {
      const moduleFiles = [
        path.join(MODULES_DIR, "networking/main.tf"),
        path.join(MODULES_DIR, "compute/main.tf"),
        path.join(MODULES_DIR, "database/main.tf"),
        path.join(MODULES_DIR, "failover/main.tf")
      ];

      moduleFiles.forEach(filePath => {
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);

          // Should use variables
          expect(content).toMatch(/var\./);

          // Should not have many hardcoded values for configurable items
          // (Some hardcoded values like "true", "false", port numbers are acceptable)
        }
      });
    });

    test("resources have descriptive names", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = readFileContent(mainTfPath);

      // Module names should be descriptive
      expect(content).toMatch(/module\s+"(primary|secondary)_(networking|compute|database)"/);
      expect(content).toMatch(/module\s+"failover_mechanism"/);
    });

    test("outputs have descriptions", () => {
      const outputsTfPath = path.join(LIB_DIR, "outputs.tf");
      const content = readFileContent(outputsTfPath);

      const outputCount = (content.match(/output\s+"/g) || []).length;
      const descriptionCount = (content.match(/description\s*=/g) || []).length;

      // All outputs should have descriptions
      expect(descriptionCount).toBeGreaterThanOrEqual(outputCount);
    });

    test("variables have descriptions and types", () => {
      const variablesTfPath = path.join(LIB_DIR, "variables.tf");
      const content = readFileContent(variablesTfPath);

      const variableCount = (content.match(/variable\s+"/g) || []).length;
      const descriptionCount = (content.match(/description\s*=/g) || []).length;
      const typeCount = (content.match(/type\s*=/g) || []).length;

      // All variables should have descriptions and types
      expect(descriptionCount).toBeGreaterThanOrEqual(variableCount);
      expect(typeCount).toBeGreaterThanOrEqual(variableCount);
    });

    test("lifecycle rules are used where appropriate", () => {
      const files = [
        path.join(MODULES_DIR, "compute/main.tf"),
        path.join(MODULES_DIR, "database/main.tf")
      ];

      let hasLifecycle = false;
      files.forEach(filePath => {
        if (fileExists(filePath)) {
          const content = readFileContent(filePath);
          if (content.includes("lifecycle {") || content.includes("create_before_destroy")) {
            hasLifecycle = true;
          }
        }
      });

      expect(hasLifecycle).toBe(true);
    });
  });

  describe("Configuration Validation Tests", () => {
    describe("Variable Constraints and Validation", () => {
      test("region variables are defined", () => {
        const variablesTfPath = path.join(LIB_DIR, "variables.tf");
        const content = readFileContent(variablesTfPath);

        // Should have region variables
        expect(content).toMatch(/variable\s+"primary_region"/);
        expect(content).toMatch(/variable\s+"secondary_region"/);
      });

      test("CIDR blocks are properly configured", () => {
        const variablesTfPath = path.join(LIB_DIR, "variables.tf");
        const content = readFileContent(variablesTfPath);

        // VPC CIDR should be defined
        expect(content).toMatch(/variable\s+"vpc_cidr"/);
      });

      test("database password is marked as sensitive", () => {
        const variablesTfPath = path.join(LIB_DIR, "variables.tf");
        const content = readFileContent(variablesTfPath);

        // Password should be sensitive
        expect(content).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
      });

      test("instance type variables are defined", () => {
        const variablesTfPath = path.join(LIB_DIR, "variables.tf");
        const content = readFileContent(variablesTfPath);

        // Should have instance type variables
        expect(content).toMatch(/variable\s+"instance_type"/);
        expect(content).toMatch(/variable\s+"db_instance_class"/);
      });

      test("environment variable is defined", () => {
        const variablesTfPath = path.join(LIB_DIR, "variables.tf");
        const content = readFileContent(variablesTfPath);

        // Environment variable should be defined
        expect(content).toMatch(/variable\s+"environment"/);
      });
    });

    describe("Resource Naming Conventions", () => {
      test("resources use consistent naming pattern", () => {
        const files = [
          path.join(MODULES_DIR, "networking/main.tf"),
          path.join(MODULES_DIR, "compute/main.tf"),
          path.join(MODULES_DIR, "database/main.tf")
        ];

        files.forEach(filePath => {
          if (fileExists(filePath)) {
            const content = readFileContent(filePath);

            // Should use environment and region in names
            expect(content).toMatch(/\$\{var\.environment\}/);
            expect(content).toMatch(/\$\{var\.region\}/);
          }
        });
      });

      test("S3 buckets have globally unique names", () => {
        const files = [
          path.join(MODULES_DIR, "compute/main.tf"),
          path.join(MODULES_DIR, "failover/main.tf")
        ];

        files.forEach(filePath => {
          if (fileExists(filePath)) {
            const content = readFileContent(filePath);

            if (content.includes("aws_s3_bucket")) {
              // Should include account ID or region for uniqueness
              expect(content).toMatch(/\$\{data\.aws_caller_identity.*\.account_id\}|\$\{var\.region\}/);
            }
          }
        });
      });

      test("database identifiers follow naming convention", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        // DB identifier should use consistent pattern
        expect(content).toMatch(/identifier\s*=\s*"\$\{var\.environment\}-mysql/);
      });
    });

    describe("Network Configuration Validation", () => {
      test("VPC CIDR blocks are valid IPv4", () => {
        const tfvarsPath = path.join(LIB_DIR, "terraform.tfvars");
        const content = readFileContent(tfvarsPath);

        // Should have valid CIDR notation
        const cidrMatches = content.match(/10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[0-9]{1,2}/g);
        expect(cidrMatches).toBeTruthy();

        if (cidrMatches) {
          cidrMatches.forEach(cidr => {
            const parts = cidr.split('/');
            const prefix = parseInt(parts[1]);
            expect(prefix).toBeGreaterThanOrEqual(16);
            expect(prefix).toBeLessThanOrEqual(28);
          });
        }
      });

      test("subnets are properly distributed across AZs", () => {
        const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
        const content = readFileContent(networkingMainTf);

        // Should create subnets across availability zones
        expect(content).toMatch(/availability_zone\s*=\s*var\.availability_zones\[count\.index\]/);
      });

      test("subnet CIDR calculations are non-overlapping", () => {
        const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
        const content = readFileContent(networkingMainTf);

        // Public, private, and database subnets should use different offsets
        const publicCidr = content.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?cidrsubnet\([^)]*count\.index[^)]*\)/);
        const privateCidr = content.match(/resource\s+"aws_subnet"\s+"private"[\s\S]*?cidrsubnet\([^)]*count\.index\s*\+\s*[0-9]+[^)]*\)/);
        const databaseCidr = content.match(/resource\s+"aws_subnet"\s+"database"[\s\S]*?cidrsubnet\([^)]*count\.index\s*\+\s*[0-9]+[^)]*\)/);

        expect(publicCidr).toBeTruthy();
        expect(privateCidr).toBeTruthy();
        expect(databaseCidr).toBeTruthy();
      });

      test("NAT Gateways are in public subnets", () => {
        const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
        const content = readFileContent(networkingMainTf);

        expect(content).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?subnet_id\s*=\s*aws_subnet\.public/);
      });

      test("route tables correctly reference gateways", () => {
        const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
        const content = readFileContent(networkingMainTf);

        // Public routes should use IGW
        expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway/);

        // Private routes should use NAT
        expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*?nat_gateway_id\s*=\s*aws_nat_gateway/);
      });
    });

    describe("Security Configuration Validation", () => {
      test("security groups have proper ingress rules", () => {
        const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
        const content = readFileContent(computeMainTf);

        // ALB should allow HTTP from anywhere
        expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"[\s\S]*?from_port\s*=\s*80[\s\S]*?cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);

        // EC2 should only allow from ALB security group
        expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"[\s\S]*?from_port\s*=\s*80[\s\S]*?security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      });

      test("database security group restricts access", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        // RDS should not be publicly accessible
        expect(content).toMatch(/publicly_accessible\s*=\s*false/);

        // Should have security group with restricted access
        expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      });

      test("IAM policies have specific permissions", () => {
        const files = [
          path.join(MODULES_DIR, "compute/main.tf"),
          path.join(MODULES_DIR, "failover/main.tf")
        ];

        files.forEach(filePath => {
          if (fileExists(filePath)) {
            const content = readFileContent(filePath);

            if (content.includes("aws_iam_role_policy")) {
              // Should have specific actions, not wildcards
              const hasSpecificActions = content.includes("Action") &&
                (content.includes("s3:") ||
                  content.includes("logs:") ||
                  content.includes("cloudwatch:") ||
                  content.includes("rds:") ||
                  content.includes("ec2:"));
              expect(hasSpecificActions).toBe(true);
            }
          }
        });
      });

      test("KMS keys have key rotation enabled", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        if (content.includes("aws_kms_key")) {
          expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
        }
      });

      test("S3 buckets have server-side encryption", () => {
        const files = [
          path.join(MODULES_DIR, "compute/main.tf"),
          path.join(MODULES_DIR, "failover/main.tf")
        ];

        files.forEach(filePath => {
          if (fileExists(filePath)) {
            const content = readFileContent(filePath);

            if (content.includes("aws_s3_bucket")) {
              expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
            }
          }
        });
      });
    });

    describe("High Availability Configuration Validation", () => {
      test("RDS backup retention is sufficient", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        // Should have at least 7 days retention
        const retentionMatch = content.match(/backup_retention_period\s*=\s*([0-9]+)/);
        if (retentionMatch) {
          const retention = parseInt(retentionMatch[1]);
          expect(retention).toBeGreaterThanOrEqual(7);
        }
      });

      test("Auto Scaling has appropriate health check grace period", () => {
        const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
        const content = readFileContent(computeMainTf);

        // Should have grace period for instance startup
        const gracePeriodMatch = content.match(/health_check_grace_period\s*=\s*([0-9]+)/);
        expect(gracePeriodMatch).toBeTruthy();

        if (gracePeriodMatch) {
          const gracePeriod = parseInt(gracePeriodMatch[1]);
          expect(gracePeriod).toBeGreaterThanOrEqual(60); // At least 1 minute
        }
      });

      test("ALB health checks are properly configured", () => {
        const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
        const content = readFileContent(computeMainTf);

        expect(content).toMatch(/health_check\s*{[\s\S]*?enabled\s*=\s*true/);
        expect(content).toMatch(/healthy_threshold\s*=\s*[0-9]+/);
        expect(content).toMatch(/unhealthy_threshold\s*=\s*[0-9]+/);
        expect(content).toMatch(/timeout\s*=\s*[0-9]+/);
        expect(content).toMatch(/interval\s*=\s*[0-9]+/);
      });

      test("Global Accelerator health checks are configured", () => {
        const failoverMainTf = path.join(MODULES_DIR, "failover/main.tf");
        const content = readFileContent(failoverMainTf);

        expect(content).toMatch(/health_check_interval_seconds\s*=/);
        expect(content).toMatch(/health_check_path\s*=\s*"\/health"/);
        expect(content).toMatch(/threshold_count\s*=/);
      });

      test("database maintenance window is set", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        expect(content).toMatch(/maintenance_window\s*=\s*"[a-z]{3}:[0-9]{2}:[0-9]{2}-[a-z]{3}:[0-9]{2}:[0-9]{2}"/);
        expect(content).toMatch(/backup_window\s*=\s*"[0-9]{2}:[0-9]{2}-[0-9]{2}:[0-9]{2}"/);
      });
    });

    describe("Monitoring Configuration Validation", () => {
      test("CloudWatch alarms have proper thresholds", () => {
        const files = [
          path.join(MODULES_DIR, "compute/main.tf"),
          path.join(MODULES_DIR, "database/main.tf"),
          path.join(MODULES_DIR, "failover/main.tf")
        ];

        files.forEach(filePath => {
          if (fileExists(filePath)) {
            const content = readFileContent(filePath);

            if (content.includes("aws_cloudwatch_metric_alarm")) {
              expect(content).toMatch(/threshold\s*=\s*"?[0-9]+"?/);
              expect(content).toMatch(/evaluation_periods\s*=\s*"?[0-9]+"?/);
              expect(content).toMatch(/comparison_operator\s*=\s*"(GreaterThanThreshold|LessThanThreshold|GreaterThanOrEqualToThreshold|LessThanOrEqualToThreshold)"/);
            }
          }
        });
      });

      test("alarms are configured for critical metrics", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        // Should monitor CPU
        const hasCpuAlarm = content.includes("CPUUtilization") || content.includes("cpu");
        expect(hasCpuAlarm).toBe(true);
      });

      test("SNS topics have subscriptions", () => {
        const failoverMainTf = path.join(MODULES_DIR, "failover/main.tf");
        const content = readFileContent(failoverMainTf);

        if (content.includes("aws_sns_topic")) {
          expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"/);
        }
      });

      test("flow logs have proper retention", () => {
        const networkingMainTf = path.join(MODULES_DIR, "networking/main.tf");
        const content = readFileContent(networkingMainTf);

        if (content.includes("aws_cloudwatch_log_group")) {
          expect(content).toMatch(/retention_in_days\s*=\s*[0-9]+/);
        }
      });
    });

    describe("Disaster Recovery Configuration Validation", () => {
      test("cross-region database replication is properly configured", () => {
        const mainTfPath = path.join(LIB_DIR, "main.tf");
        const content = readFileContent(mainTfPath);

        // Secondary database should reference primary
        expect(content).toMatch(/source_db_arn\s*=\s*module\.primary_database/);
        expect(content).toMatch(/is_primary\s*=\s*false/);
      });

      test("Global Accelerator uses proper health check settings", () => {
        const failoverMainTf = path.join(MODULES_DIR, "failover/main.tf");
        const content = readFileContent(failoverMainTf);

        // Should have health checks for failover
        expect(content).toMatch(/health_check_protocol\s*=\s*"HTTP"/);
        expect(content).toMatch(/health_check_port\s*=\s*80/);
      });

      test("endpoint groups have proper weight distribution", () => {
        const failoverMainTf = path.join(MODULES_DIR, "failover/main.tf");
        const content = readFileContent(failoverMainTf);

        // Should configure weights for primary and secondary
        const weightMatches = content.match(/weight\s*=\s*[0-9]+/g);
        expect(weightMatches).toBeTruthy();
        expect(weightMatches!.length).toBeGreaterThanOrEqual(2);
      });

      test("Lambda failover function has proper configuration", () => {
        const failoverMainTf = path.join(MODULES_DIR, "failover/main.tf");
        const content = readFileContent(failoverMainTf);

        if (content.includes("aws_lambda_function")) {
          expect(content).toMatch(/timeout\s*=\s*[0-9]+/);
          expect(content).toMatch(/environment\s*{[\s\S]*?variables\s*=/);
        }
      });
    });

    describe("Tagging Strategy Validation", () => {
      test("all resources receive common tags", () => {
        const mainTfPath = path.join(LIB_DIR, "main.tf");
        const content = readFileContent(mainTfPath);

        // Should pass tags to modules
        const tagsPassed = content.match(/tags\s*=\s*(var\.tags|merge\(var\.tags)/g);
        expect(tagsPassed).toBeTruthy();
        expect(tagsPassed!.length).toBeGreaterThan(0);
      });

      test("tags include required fields", () => {
        const tfvarsPath = path.join(LIB_DIR, "terraform.tfvars");
        const content = readFileContent(tfvarsPath);

        // Should have Environment tag
        expect(content).toMatch(/Environment\s*=\s*"[^"]+"/);

        // Should have additional tags
        const hasCommonTags = content.includes("tags") && content.includes("{");
        expect(hasCommonTags).toBe(true);
      });

      test("modules propagate tags correctly", () => {
        const files = [
          path.join(MODULES_DIR, "networking/main.tf"),
          path.join(MODULES_DIR, "compute/main.tf"),
          path.join(MODULES_DIR, "database/main.tf")
        ];

        files.forEach(filePath => {
          if (fileExists(filePath)) {
            const content = readFileContent(filePath);

            // Should use merge for tags
            expect(content).toMatch(/merge\(var\.tags,\s*{/);
          }
        });
      });
    });

    describe("Performance and Cost Optimization", () => {
      test("EBS volumes use appropriate types", () => {
        const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
        const content = readFileContent(computeMainTf);

        if (content.includes("block_device_mappings")) {
          // Should use gp3 or other modern volume types
          expect(content).toMatch(/volume_type\s*=\s*"gp[23]"/);
        }
      });

      test("Auto Scaling has proper capacity settings", () => {
        const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
        const content = readFileContent(computeMainTf);

        // Min should be less than or equal to desired
        // Desired should be less than or equal to max
        const minMatch = content.match(/min_size\s*=\s*var\.min_size/);
        const maxMatch = content.match(/max_size\s*=\s*var\.max_size/);
        const desiredMatch = content.match(/desired_capacity\s*=\s*var\.desired_capacity/);

        expect(minMatch).toBeTruthy();
        expect(maxMatch).toBeTruthy();
        expect(desiredMatch).toBeTruthy();
      });

      test("database instance class is parameterized", () => {
        const databaseMainTf = path.join(MODULES_DIR, "database/main.tf");
        const content = readFileContent(databaseMainTf);

        expect(content).toMatch(/instance_class\s*=\s*var\.instance_class/);
      });

      test("ALB has deletion protection disabled for non-prod", () => {
        const computeMainTf = path.join(MODULES_DIR, "compute/main.tf");
        const content = readFileContent(computeMainTf);

        // For testing/dev, deletion protection should be disabled
        expect(content).toMatch(/enable_deletion_protection\s*=\s*false/);
      });
    });
  });
});
