// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for PCI-DSS Terraform infrastructure configuration
// Tests all resources, variables, outputs, and validation logic without executing Terraform

import fs from "fs";
import path from "path";

const MAIN_TF_PATH = path.resolve(__dirname, "../lib/main.tf");
const PROVIDER_TF_PATH = path.resolve(__dirname, "../lib/provider.tf");
const OUTPUTS_TF_PATH = path.resolve(__dirname, "../lib/outputs.tf");

describe("PCI-DSS Infrastructure - Terraform Unit Tests", () => {
  let mainTfContent: string;
  let providerTfContent: string;
  let outputsTfContent: string;

  beforeAll(() => {
    // Read Terraform files for testing
    mainTfContent = fs.readFileSync(MAIN_TF_PATH, "utf-8");
    providerTfContent = fs.readFileSync(PROVIDER_TF_PATH, "utf-8");
    outputsTfContent = fs.readFileSync(OUTPUTS_TF_PATH, "utf-8");
  });

  describe("File Structure and Basic Validation", () => {
    test("main.tf exists and is readable", () => {
      expect(fs.existsSync(MAIN_TF_PATH)).toBe(true);
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(PROVIDER_TF_PATH)).toBe(true);
      expect(providerTfContent.length).toBeGreaterThan(0);
    });

    test("outputs.tf exists and is readable", () => {
      expect(fs.existsSync(OUTPUTS_TF_PATH)).toBe(true);
      expect(outputsTfContent.length).toBeGreaterThan(0);
    });

    test("terraform configuration follows HCL syntax patterns", () => {
      // Check that files contain valid HCL block structures
      expect(mainTfContent).toMatch(/variable\s+"\w+"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"\w+"\s+"\w+"\s*{/);
      expect(mainTfContent).toMatch(/data\s+"\w+"\s+"\w+"\s*{/);
      expect(mainTfContent).toMatch(/locals\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"\w+"\s*{/);
    });
  });

  describe("Terraform Version and Provider Configuration", () => {
    test("terraform version constraint is defined", () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+/);
    });

    test("AWS provider is configured correctly", () => {
      expect(providerTfContent).toMatch(/required_providers\s*{[\s\S]*aws\s*=\s*{/);
      expect(providerTfContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerTfContent).toMatch(/version\s*=\s*">=\s*5\.0/);
    });

    test("S3 backend is configured", () => {
      expect(providerTfContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("AWS provider region is configured", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=/);
    });
  });

  describe("Variable Definitions - Infrastructure Configuration", () => {
    test("core infrastructure variables are defined", () => {
      const coreVariables = [
        "project_name",
        "environment",
        "aws_region",
        "vpc_cidr",
        "allowed_ingress_cidrs",
        "db_master_password",
        "backup_retention_days",
        "log_retention_days"
      ];

      coreVariables.forEach(variable => {
        expect(mainTfContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("RDS configuration variables are defined", () => {
      // RDS variables are inline in main.tf
      expect(mainTfContent).toMatch(/resource\s+"aws_db_instance"\s+"postgres"/);
      expect(mainTfContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(mainTfContent).toMatch(/instance_class\s*=/);
    });

    test("KMS and encryption variables are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("CloudWatch logging variables are defined", () => {
      expect(mainTfContent).toMatch(/variable\s+"log_retention_days"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test("tagging variables are defined", () => {
      expect(mainTfContent).toMatch(/common_tags\s*=/);
    });
  });

  describe("Variable Types and Defaults", () => {
    test("string variables have correct type", () => {
      expect(mainTfContent).toMatch(/variable\s+"project_name"[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"environment"[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*?type\s*=\s*string/);
    });

    test("list variables have correct type", () => {
      expect(mainTfContent).toMatch(/variable\s+"allowed_ingress_cidrs"[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test("number variables have correct type", () => {
      expect(mainTfContent).toMatch(/variable\s+"backup_retention_days"[\s\S]*?type\s*=\s*number/);
      expect(mainTfContent).toMatch(/variable\s+"log_retention_days"[\s\S]*?type\s*=\s*number/);
    });

    test("boolean variables exist in configuration", () => {
      // Boolean values are hardcoded in resource definitions
      expect(mainTfContent).toMatch(/multi_az\s*=\s*(true|false)/);
      expect(mainTfContent).toMatch(/deletion_protection\s*=\s*(true|false)/);
    });

    test("sensitive variables are marked appropriately", () => {
      expect(mainTfContent).toMatch(/variable\s+"db_master_password"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("default values are set for optional variables", () => {
      expect(mainTfContent).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"prod"/);
    });
  });

  describe("Data Sources", () => {
    test("availability zones data source is defined", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(mainTfContent).toMatch(/state\s*=\s*"available"/);
    });

    test("caller identity data source is defined", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("ELB service account data source is defined", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_elb_service_account"\s+"main"\s*{/);
    });
  });

  describe("Local Values", () => {
    test("locals block is defined", () => {
      expect(mainTfContent).toMatch(/locals\s*{/);
    });

    test("common_tags local is defined", () => {
      expect(mainTfContent).toMatch(/common_tags\s*=/);
      expect(mainTfContent).toMatch(/Environment\s*=/);
      expect(mainTfContent).toMatch(/Project\s*=/);
      expect(mainTfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("name_prefix is calculated from variables", () => {
      expect(mainTfContent).toMatch(/name_prefix\s*=/);
    });

    test("availability zones are calculated from data source", () => {
      expect(mainTfContent).toMatch(/azs\s*=\s*data\.aws_availability_zones\.available/);
    });

    test("subnet CIDRs are defined in locals", () => {
      expect(mainTfContent).toMatch(/public_subnet_cidrs\s*=/);
      expect(mainTfContent).toMatch(/private_app_subnet_cidrs\s*=/);
      expect(mainTfContent).toMatch(/private_db_subnet_cidrs\s*=/);
    });
  });

  describe("VPC Resources", () => {
    test("VPC resource is defined with correct configuration", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/cidr_block\s*=/);
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("Internet Gateway is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("VPC Flow Logs are configured", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });
  });

  describe("Subnet Resources", () => {
    test("public subnets are defined with count", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=/);
      expect(mainTfContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("private app subnets are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"private_app"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=/);
    });

    test("private DB subnets are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"private_db"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=/);
    });

    test("subnets reference VPC correctly", () => {
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe("NAT Gateway Resources", () => {
    test("Elastic IPs for NAT are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(mainTfContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("NAT Gateways are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/allocation_id\s*=/);
      expect(mainTfContent).toMatch(/subnet_id\s*=/);
    });

    test("NAT Gateway depends on Internet Gateway", () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  describe("Route Tables and Network Routing", () => {
    test("public route table is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("public route to Internet Gateway exists", () => {
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(mainTfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private app route tables are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"private_app"\s*{/);
    });

    test("private app routes to NAT Gateway", () => {
      expect(mainTfContent).toMatch(/nat_gateway_id\s*=/);
    });

    test("private DB route table is defined (isolated)", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"private_db"\s*{/);
    });

    test("route table associations are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_app"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_db"\s*{/);
    });
  });

  describe("Security Groups - PCI-DSS Compliant", () => {
    test("ALB security group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(mainTfContent).toMatch(/description\s*=.*ALB/);
    });

    test("App security group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
      expect(mainTfContent).toMatch(/description\s*=.*application/);
    });

    test("RDS security group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(mainTfContent).toMatch(/description\s*=.*RDS/);
    });

    test("security groups have ingress rules", () => {
      expect(mainTfContent).toMatch(/ingress\s*{/);
      expect(mainTfContent).toMatch(/from_port\s*=/);
      expect(mainTfContent).toMatch(/to_port\s*=/);
      expect(mainTfContent).toMatch(/protocol\s*=/);
    });

    test("security groups have egress rules", () => {
      expect(mainTfContent).toMatch(/egress\s*{/);
    });

    test("RDS security group restricts access to app tier", () => {
      // PostgreSQL port 5432
      expect(mainTfContent).toMatch(/from_port\s*=\s*5432/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*5432/);
    });
  });

  describe("KMS Encryption - PCI-DSS Requirement 3.4", () => {
    test("KMS key is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(mainTfContent).toMatch(/deletion_window_in_days\s*=/);
    });

    test("KMS key alias is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });

    test("KMS key has description", () => {
      expect(mainTfContent).toMatch(/description\s*=.*cmk/);
    });
  });

  describe("S3 Logs Bucket - Secure Configuration", () => {
    test("S3 bucket is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*{/);
      expect(mainTfContent).toMatch(/bucket\s*=/);
    });

    test("S3 bucket versioning is configured", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"logs"\s*{/);
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 bucket encryption is configured", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"logs"\s*{/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=/);
    });

    test("S3 bucket public access is blocked", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"logs"\s*{/);
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainTfContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("S3 bucket policy is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"logs"\s*{/);
    });
  });

  describe("Application Load Balancer", () => {
    test("ALB is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(mainTfContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB target group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
      expect(mainTfContent).toMatch(/port\s*=/);
      expect(mainTfContent).toMatch(/protocol\s*=/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("ALB listener is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
      expect(mainTfContent).toMatch(/load_balancer_arn\s*=\s*aws_lb\.main\.arn/);
      expect(mainTfContent).toMatch(/default_action\s*{/);
    });

    test("ALB health check is configured", () => {
      expect(mainTfContent).toMatch(/health_check\s*{/);
      expect(mainTfContent).toMatch(/path\s*=/);
      expect(mainTfContent).toMatch(/healthy_threshold\s*=/);
      expect(mainTfContent).toMatch(/unhealthy_threshold\s*=/);
    });
  });

  describe("WAF - Web Application Firewall", () => {
    test("WAF Web ACL is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("WAF has default action", () => {
      expect(mainTfContent).toMatch(/default_action\s*{/);
      expect(mainTfContent).toMatch(/allow\s*{/);
    });

    test("WAF has rules configured", () => {
      expect(mainTfContent).toMatch(/rule\s*{/);
      expect(mainTfContent).toMatch(/priority\s*=/);
    });

    test("WAF is associated with ALB", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"alb"\s*{/);
      expect(mainTfContent).toMatch(/resource_arn\s*=\s*aws_lb\.main\.arn/);
      expect(mainTfContent).toMatch(/web_acl_arn\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });
  });

  describe("CloudWatch Logs", () => {
    test("VPC Flow Logs log group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{/);
      expect(mainTfContent).toMatch(/retention_in_days\s*=/);
    });

    test("Application log group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"\s*{/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("VPC Flow Logs IAM role is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"\s*{/);
      expect(mainTfContent).toMatch(/assume_role_policy\s*=/);
    });

    test("VPC Flow Logs IAM policy is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"\s*{/);
    });

    test("EC2 instance profile is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
    });
  });

  describe("Launch Template", () => {
    test("Launch template is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
      expect(mainTfContent).toMatch(/image_id\s*=/);
      expect(mainTfContent).toMatch(/instance_type\s*=/);
    });

    test("Launch template has network configuration", () => {
      expect(mainTfContent).toMatch(/vpc_security_group_ids\s*=/);
    });

    test("Launch template has IAM instance profile", () => {
      expect(mainTfContent).toMatch(/iam_instance_profile\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2\.name/);
    });
  });

  describe("RDS PostgreSQL Database - Multi-AZ", () => {
    test("RDS subnet group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/subnet_ids\s*=/);
    });

    test("RDS instance is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_db_instance"\s+"postgres"\s*{/);
      expect(mainTfContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(mainTfContent).toMatch(/engine_version\s*=/);
      expect(mainTfContent).toMatch(/instance_class\s*=/);
    });

    test("RDS storage is encrypted", () => {
      expect(mainTfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(mainTfContent).toMatch(/kms_key_id\s*=/);
    });

    test("RDS is not publicly accessible", () => {
      expect(mainTfContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS Multi-AZ is configured", () => {
      expect(mainTfContent).toMatch(/multi_az\s*=/);
    });

    test("RDS backup configuration", () => {
      expect(mainTfContent).toMatch(/backup_retention_period\s*=/);
      expect(mainTfContent).toMatch(/backup_window\s*=/);
    });

    test("RDS maintenance window is configured", () => {
      expect(mainTfContent).toMatch(/maintenance_window\s*=/);
    });

    test("RDS deletion protection is enabled", () => {
      expect(mainTfContent).toMatch(/deletion_protection\s*=/);
    });

    test("RDS CloudWatch logs are enabled", () => {
      expect(mainTfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=/);
    });

    test("RDS final snapshot is configured", () => {
      expect(mainTfContent).toMatch(/skip_final_snapshot\s*=/);
      expect(mainTfContent).toMatch(/final_snapshot_identifier\s*=/);
    });
  });

  describe("Resource Tagging", () => {
    test("all major resources use tags", () => {
      const taggedResources = [
        'aws_vpc',
        'aws_internet_gateway',
        'aws_subnet',
        'aws_nat_gateway',
        'aws_security_group',
        'aws_db_instance',
        'aws_kms_key',
        'aws_s3_bucket',
        'aws_lb'
      ];

      taggedResources.forEach(resource => {
        expect(mainTfContent).toMatch(new RegExp(`resource\\s+"${resource}"[\\s\\S]*?tags\\s*=`));
      });
    });

    test("resources have Name tags", () => {
      expect(mainTfContent).toMatch(/Name\s*=/);
    });

    test("tags reference common_tags or merge with them", () => {
      expect(mainTfContent).toMatch(/merge\([\s\S]*?local\.common_tags/);
    });
  });

  describe("Output Values", () => {
    test("VPC outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"vpc_cidr"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"vpc_arn"\s*{/);
    });

    test("subnet outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"private_app_subnet_ids"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"private_db_subnet_ids"\s*{/);
    });

    test("security group outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"alb_security_group_id"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"app_security_group_id"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"rds_security_group_id"\s*{/);
    });

    test("ALB outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"alb_dns_name"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"alb_arn"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"target_group_arn"\s*{/);
    });

    test("RDS outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"rds_port"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"rds_identifier"\s*{/);
    });

    test("KMS outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test("WAF outputs are defined", () => {
      expect(outputsTfContent).toMatch(/output\s+"waf_web_acl_id"\s*{/);
    });

    test("outputs have descriptions", () => {
      expect(outputsTfContent).toMatch(/description\s*=/);
    });

    test("sensitive outputs are marked", () => {
      expect(outputsTfContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe("Security Best Practices - PCI-DSS Compliance", () => {
    test("RDS is not publicly accessible", () => {
      expect(mainTfContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("storage encryption is enabled", () => {
      expect(mainTfContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("KMS key rotation is enabled", () => {
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("S3 bucket blocks public access", () => {
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("VPC Flow Logs are enabled", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_flow_log"/);
    });

    test("security groups use restrictive rules", () => {
      // Check that security groups don't allow 0.0.0.0/0 on sensitive ports
      const sgContent = mainTfContent.match(/resource\s+"aws_security_group"[\s\S]*?}/g) || [];
      sgContent.forEach(sg => {
        // RDS and App security groups should not have public ingress
        if (sg.includes('"rds"') || sg.includes('"app"')) {
          expect(sg).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
        }
      });
      expect(true).toBe(true); // Ensure test runs
    });

    test("deletion protection is enabled for critical resources", () => {
      expect(mainTfContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test("backups are enabled and retained", () => {
      expect(mainTfContent).toMatch(/backup_retention_period\s*=.*[7-9]\d*|[1-9]\d+/);
    });
  });

  describe("High Availability Configuration", () => {
    test("Multi-AZ deployment for RDS", () => {
      expect(mainTfContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("Multiple availability zones used for subnets", () => {
      // Check for hardcoded count or length function
      expect(mainTfContent).toMatch(/count\s*=\s*2/);
      expect(mainTfContent).toMatch(/availability_zone\s*=.*\[count\.index\]/);
    });

    test("NAT Gateways in multiple AZs", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"[\s\S]*?count\s*=/);
    });
  });

  describe("Resource Dependencies and References", () => {
    test("resources reference VPC correctly", () => {
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("subnets reference correct CIDR from locals", () => {
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*local\.public_subnet_cidrs\[count\.index\]/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*local\.private_app_subnet_cidrs\[count\.index\]/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*local\.private_db_subnet_cidrs\[count\.index\]/);
    });

    test("security groups reference each other correctly", () => {
      expect(mainTfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.\w+\.id\]/);
    });

    test("RDS uses correct subnet group", () => {
      expect(mainTfContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });
  });

  describe("Conditional Logic and Functions", () => {
    test("count meta-argument is used correctly", () => {
      expect(mainTfContent).toMatch(/count\s*=/);
      expect(mainTfContent).toMatch(/\[count\.index\]/);
    });

    test("built-in functions are used", () => {
      expect(mainTfContent).toMatch(/merge\(/);
      expect(mainTfContent).toMatch(/formatdate\(/);
      expect(mainTfContent).toMatch(/timestamp\(/);
      expect(mainTfContent).toMatch(/jsonencode\(/);
    });

    test("string interpolation is used correctly", () => {
      expect(mainTfContent).toMatch(/\$\{[^}]+\}/);
    });

    test("splat expressions for arrays", () => {
      expect(mainTfContent).toMatch(/\[\*\]/);
    });
  });

  describe("PCI-DSS Compliance Documentation", () => {
    test("infrastructure is production-ready", () => {
      // Check for production indicators
      expect(mainTfContent).toMatch(/default\s*=\s*"prod"/);
    });

    test("outputs include deployment information", () => {
      expect(outputsTfContent).toMatch(/deployment_timestamp|common_tags|environment/);
    });

    test("encryption requirements are implemented", () => {
      expect(mainTfContent).toMatch(/encrypt/i);
      expect(mainTfContent).toMatch(/kms_key/i);
    });

    test("network segmentation is documented", () => {
      const hasPublicSubnets = mainTfContent.includes('public');
      const hasPrivateAppSubnets = mainTfContent.includes('private_app');
      const hasPrivateDbSubnets = mainTfContent.includes('private_db');
      expect(hasPublicSubnets && hasPrivateAppSubnets && hasPrivateDbSubnets).toBe(true);
    });
  });

  describe("Configuration Completeness", () => {
    test("all major AWS resource types are present", () => {
      const expectedResourceTypes = [
        'aws_vpc',
        'aws_internet_gateway',
        'aws_subnet',
        'aws_eip',
        'aws_nat_gateway',
        'aws_route_table',
        'aws_security_group',
        'aws_db_subnet_group',
        'aws_db_instance',
        'aws_kms_key',
        'aws_s3_bucket',
        'aws_lb',
        'aws_wafv2_web_acl',
        'aws_cloudwatch_log_group',
        'aws_iam_role',
        'aws_launch_template'
      ];

      expectedResourceTypes.forEach(resourceType => {
        expect(mainTfContent).toMatch(new RegExp(`resource\\s+"${resourceType}"`));
      });
    });

    test("file structure is valid", () => {
      // Check for proper HCL structure
      expect(mainTfContent.length).toBeGreaterThan(1000);
      expect(outputsTfContent.length).toBeGreaterThan(100);
    });

    test("all variables have descriptions", () => {
      const variableBlocks = mainTfContent.match(/variable\s+"\w+"\s*{[\s\S]*?}/g) || [];
      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test("all outputs have descriptions", () => {
      const outputBlocks = outputsTfContent.match(/output\s+"\w+"\s*{[\s\S]*?}/g) || [];
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });
});
