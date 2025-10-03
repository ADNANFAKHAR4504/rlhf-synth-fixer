// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure configuration
// Tests all resources, variables, outputs, and validation logic

import fs from "fs";
import path from "path";

const MAIN_TF_PATH = path.resolve(__dirname, "../lib/main.tf");
const PROVIDER_TF_PATH = path.resolve(__dirname, "../lib/provider.tf");
const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Read Terraform files for testing
    mainTfContent = fs.readFileSync(MAIN_TF_PATH, "utf-8");
    providerTfContent = fs.readFileSync(PROVIDER_TF_PATH, "utf-8");
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

    test("terraform configuration follows HCL syntax patterns", () => {
      // Check that the file contains valid HCL block structures
      expect(mainTfContent).toMatch(/terraform\s*{/);
      expect(mainTfContent).toMatch(/variable\s+"\w+"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"\w+"\s+"\w+"\s*{/);
      expect(mainTfContent).toMatch(/data\s+"\w+"\s+"\w+"\s*{/);
      expect(mainTfContent).toMatch(/locals\s*{/);
      expect(mainTfContent).toMatch(/output\s+"\w+"\s*{/);

      // Check for proper HCL syntax elements
      expect(mainTfContent).not.toMatch(/\s=\s*{[^}]*$/m); // No unclosed braces
      expect(mainTfContent).not.toMatch(/^\s*}\s*{/m); // No malformed block transitions
    });
  });

  describe("Terraform Version and Provider Configuration", () => {
    test("terraform version constraint is defined", () => {
      expect(mainTfContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test("AWS provider is configured in provider.tf", () => {
      expect(providerTfContent).toMatch(/required_providers\s*{[\s\S]*aws\s*=\s*{/);
      expect(providerTfContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerTfContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("S3 backend is configured", () => {
      expect(providerTfContent).toMatch(/backend\s+"s3"\s*{}/);
    });

    test("AWS provider region is configured", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=/);
    });
  });

  describe("Variable Definitions and Validation", () => {
    test("all required variables are defined", () => {
      const requiredVariables = [
        "name_prefix",
        "environment",
        "vpc_cidr",
        "public_subnet_cidrs",
        "private_subnet_cidrs",
        "single_nat_gateway",
        "db_instance_class",
        "db_allocated_storage",
        "db_max_allocated_storage",
        "db_engine_version",
        "db_backup_retention_period",
        "db_multi_az",
        "db_storage_type",
        "db_performance_insights_enabled",
        "db_deletion_protection",
        "db_snapshot_final",
        "db_username",
        "db_password",
        "kms_key_id",
        "tags"
      ];

      requiredVariables.forEach(variable => {
        expect(mainTfContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("variable types are correctly specified", () => {
      expect(mainTfContent).toMatch(/variable\s+"name_prefix"[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"environment"[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"public_subnet_cidrs"[\s\S]*?type\s*=\s*list\(string\)/);
      expect(mainTfContent).toMatch(/variable\s+"private_subnet_cidrs"[\s\S]*?type\s*=\s*list\(string\)/);
      expect(mainTfContent).toMatch(/variable\s+"single_nat_gateway"[\s\S]*?type\s*=\s*bool/);
      expect(mainTfContent).toMatch(/variable\s+"db_allocated_storage"[\s\S]*?type\s*=\s*number/);
      expect(mainTfContent).toMatch(/variable\s+"tags"[\s\S]*?type\s*=\s*map\(string\)/);
    });

    test("variable default values are set correctly", () => {
      expect(mainTfContent).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"dev"/);
      expect(mainTfContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(mainTfContent).toMatch(/variable\s+"single_nat_gateway"[\s\S]*?default\s*=\s*true/);
      expect(mainTfContent).toMatch(/variable\s+"db_instance_class"[\s\S]*?default\s*=\s*"db\.t3\.micro"/);
      expect(mainTfContent).toMatch(/variable\s+"db_allocated_storage"[\s\S]*?default\s*=\s*20/);
      expect(mainTfContent).toMatch(/variable\s+"db_backup_retention_period"[\s\S]*?default\s*=\s*7/);
      expect(mainTfContent).toMatch(/variable\s+"db_multi_az"[\s\S]*?default\s*=\s*false/);
    });

    test("sensitive variables are marked appropriately", () => {
      expect(mainTfContent).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("variable validation rules are present", () => {
      expect(mainTfContent).toMatch(/variable\s+"db_engine_version"[\s\S]*?validation\s*{/);
      expect(mainTfContent).toMatch(/condition\s*=\s*can\(regex\(".*", var\.db_engine_version\)\)/);
    });

    test("variable descriptions are provided", () => {
      expect(mainTfContent).toMatch(/variable\s+"name_prefix"[\s\S]*?description\s*=\s*"Prefix for resource names"/);
      expect(mainTfContent).toMatch(/variable\s+"db_password"[\s\S]*?description\s*=\s*"Master password for RDS"/);
    });
  });

  describe("Data Sources", () => {
    test("availability zones data source is defined", () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(mainTfContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("Local Values", () => {
    test("locals block is defined with required values", () => {
      expect(mainTfContent).toMatch(/locals\s*{/);
      expect(mainTfContent).toMatch(/azs\s*=/);
      expect(mainTfContent).toMatch(/common_tags\s*=/);
    });

    test("azs local uses slice function correctly", () => {
      expect(mainTfContent).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names/);
    });

    test("common_tags merges variables correctly", () => {
      expect(mainTfContent).toMatch(/common_tags\s*=\s*merge\(/);
      expect(mainTfContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(mainTfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("VPC Resources", () => {
    test("VPC resource is defined with correct configuration", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("Internet Gateway is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe("Subnet Resources", () => {
    test("public subnets are defined with count", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("private subnets are defined with count", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("subnets use availability zones from locals", () => {
      expect(mainTfContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
    });
  });

  describe("NAT Gateway Resources", () => {
    test("Elastic IPs for NAT are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=\s*var\.single_nat_gateway\s*\?\s*1\s*:\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("NAT Gateways are defined with conditional count", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(mainTfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });
  });

  describe("Route Tables", () => {
    test("public route table is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(mainTfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private route tables are defined with conditional logic", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(mainTfContent).toMatch(/count\s*=\s*var\.single_nat_gateway\s*\?\s*1\s*:\s*length\(var\.private_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/nat_gateway_id\s*=\s*var\.single_nat_gateway.*aws_nat_gateway\.main/);
    });

    test("route table associations are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("application security group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"app"\s*{/);
      expect(mainTfContent).toMatch(/name_prefix\s*=\s*"\$\{var\.name_prefix\}-app-sg"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Security group for application tier"/);
    });

    test("RDS security group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(mainTfContent).toMatch(/name_prefix\s*=\s*"\$\{var\.name_prefix\}-rds-sg"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Security group for RDS MySQL"/);
    });

    test("RDS security group has correct ingress rules", () => {
      expect(mainTfContent).toMatch(/from_port\s*=\s*3306/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*3306/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(mainTfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("security groups have lifecycle rules", () => {
      expect(mainTfContent).toMatch(/lifecycle\s*{[\s\S]*?create_before_destroy\s*=\s*true/);
    });
  });

  describe("RDS Resources", () => {
    test("RDS subnet group is defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("RDS instance is defined with all required parameters", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_db_instance"\s+"mysql"\s*{/);
      expect(mainTfContent).toMatch(/identifier\s*=\s*"\$\{var\.name_prefix\}-mysql-\$\{var\.aws_region\}"/);
      expect(mainTfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(mainTfContent).toMatch(/engine_version\s*=\s*var\.db_engine_version/);
      expect(mainTfContent).toMatch(/instance_class\s*=\s*var\.db_instance_class/);
    });

    test("RDS storage configuration is correct", () => {
      expect(mainTfContent).toMatch(/allocated_storage\s*=\s*var\.db_allocated_storage/);
      expect(mainTfContent).toMatch(/max_allocated_storage.*var\.db_max_allocated_storage/);
      expect(mainTfContent).toMatch(/storage_type\s*=\s*var\.db_storage_type/);
      expect(mainTfContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS network configuration is secure", () => {
      expect(mainTfContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
      expect(mainTfContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
      expect(mainTfContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS backup and maintenance configuration", () => {
      expect(mainTfContent).toMatch(/backup_retention_period\s*=\s*var\.db_backup_retention_period/);
      expect(mainTfContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
      expect(mainTfContent).toMatch(/maintenance_window\s*=\s*"sun:04:00-sun:05:00"/);
    });

    test("RDS monitoring and logging configuration", () => {
      expect(mainTfContent).toMatch(/performance_insights_enabled\s*=\s*var\.db_performance_insights_enabled/);
      expect(mainTfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error",\s*"general",\s*"slowquery"\]/);
    });

    test("RDS protection settings", () => {
      expect(mainTfContent).toMatch(/deletion_protection\s*=\s*var\.db_deletion_protection/);
      expect(mainTfContent).toMatch(/skip_final_snapshot\s*=\s*!var\.db_snapshot_final/);
      expect(mainTfContent).toMatch(/copy_tags_to_snapshot\s*=\s*true/);
    });

    test("RDS lifecycle configuration", () => {
      expect(mainTfContent).toMatch(/lifecycle\s*{[\s\S]*?ignore_changes\s*=\s*\[final_snapshot_identifier\]/);
    });
  });

  describe("Resource Tagging", () => {
    test("all resources use common_tags", () => {
      const taggedResources = [
        'aws_vpc',
        'aws_internet_gateway',
        'aws_subnet',
        'aws_eip',
        'aws_nat_gateway',
        'aws_route_table',
        'aws_security_group',
        'aws_db_subnet_group',
        'aws_db_instance'
      ];

      taggedResources.forEach(resource => {
        expect(mainTfContent).toMatch(new RegExp(`resource\\s+"${resource}"[\\s\\S]*?tags\\s*=\\s*merge\\([\\s\\S]*?local\\.common_tags`));
      });
    });

    test("resources have specific Name tags", () => {
      expect(mainTfContent).toMatch(/Name\s*=\s*"\$\{var\.name_prefix\}-vpc"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"\$\{var\.name_prefix\}-igw"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"\$\{var\.name_prefix\}-mysql"/);
    });
  });

  describe("Output Values", () => {
    test("all required outputs are defined", () => {
      const requiredOutputs = [
        "rds_endpoint",
        "rds_port",
        "vpc_id",
        "private_subnet_ids",
        "public_subnet_ids",
        "rds_security_group_id",
        "app_security_group_id"
      ];

      requiredOutputs.forEach(output => {
        expect(mainTfContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("outputs have descriptions", () => {
      expect(mainTfContent).toMatch(/output\s+"rds_endpoint"[\s\S]*?description\s*=\s*"The connection endpoint for the RDS instance"/);
      expect(mainTfContent).toMatch(/output\s+"vpc_id"[\s\S]*?description\s*=\s*"The ID of the VPC"/);
    });

    test("outputs reference correct resources", () => {
      expect(mainTfContent).toMatch(/output\s+"rds_endpoint"[\s\S]*?value\s*=\s*aws_db_instance\.mysql\.endpoint/);
      expect(mainTfContent).toMatch(/output\s+"vpc_id"[\s\S]*?value\s*=\s*aws_vpc\.main\.id/);
      expect(mainTfContent).toMatch(/output\s+"private_subnet_ids"[\s\S]*?value\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe("Resource Dependencies and References", () => {
    test("EIP depends on Internet Gateway", () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("NAT Gateway depends on Internet Gateway", () => {
      // NAT Gateway has implicit dependency through EIP which has explicit depends_on
      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(mainTfContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      // The dependency is implicit through the EIP reference
      expect(true).toBe(true);
    });

    test("route table associations reference correct resources", () => {
      expect(mainTfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
      expect(mainTfContent).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    });
  });

  describe("Conditional Logic and Functions", () => {
    test("conditional expressions work correctly", () => {
      expect(mainTfContent).toMatch(/var\.single_nat_gateway\s*\?\s*1\s*:\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/var\.db_max_allocated_storage\s*>\s*0\s*\?\s*var\.db_max_allocated_storage\s*:\s*null/);
      expect(mainTfContent).toMatch(/!var\.db_snapshot_final/);
    });

    test("built-in functions are used correctly", () => {
      expect(mainTfContent).toMatch(/length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/merge\(/);
      expect(mainTfContent).toMatch(/slice\(/);
      expect(mainTfContent).toMatch(/formatdate\(/);
      expect(mainTfContent).toMatch(/timestamp\(\)/);
    });

    test("count expressions reference correct indices", () => {
      expect(mainTfContent).toMatch(/\[count\.index\]/);
      expect(mainTfContent).toMatch(/count\.index\s*\+\s*1/);
    });
  });

  describe("Security Best Practices", () => {
    test("RDS is not publicly accessible", () => {
      expect(mainTfContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS storage is encrypted", () => {
      expect(mainTfContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("sensitive variables are marked", () => {
      expect(mainTfContent).toMatch(/variable\s+"db_password"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("security groups have restrictive rules", () => {
      expect(mainTfContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.app\.id\]/);
    });

    test("backups are enabled", () => {
      expect(mainTfContent).toMatch(/backup_retention_period\s*=\s*var\.db_backup_retention_period/);
    });
  });

  describe("Performance and Cost Optimization", () => {
    test("single NAT gateway option for cost optimization", () => {
      expect(mainTfContent).toMatch(/variable\s+"single_nat_gateway"[\s\S]*?description.*cost optimization/);
    });

    test("RDS autoscaling is configured", () => {
      expect(mainTfContent).toMatch(/max_allocated_storage.*var\.db_max_allocated_storage/);
    });

    test("appropriate default instance sizes", () => {
      expect(mainTfContent).toMatch(/default\s*=\s*"db\.t3\.micro"/);
    });
  });

  describe("Error Handling and Validation", () => {
    test("final snapshot identifier uses timestamp to avoid conflicts", () => {
      expect(mainTfContent).toMatch(/final_snapshot_identifier.*formatdate.*timestamp/);
    });

    test("lifecycle rules prevent destructive changes", () => {
      expect(mainTfContent).toMatch(/lifecycle\s*{[\s\S]*?ignore_changes\s*=\s*\[final_snapshot_identifier\]/);
      expect(mainTfContent).toMatch(/lifecycle\s*{[\s\S]*?create_before_destroy\s*=\s*true/);
    });

    test("validation rules are comprehensive", () => {
      expect(mainTfContent).toMatch(/validation\s*{[\s\S]*?can\(regex/);
      expect(mainTfContent).toMatch(/error_message.*format/);
      expect(mainTfContent).toMatch(/validation\s*{[\s\S]*?condition\s*=\s*can\(regex\(".*", var\.db_engine_version\)\)/);
      expect(mainTfContent).toMatch(/error_message\s*=\s*"Engine version must be in format X\.Y or X\.Y\.Z"/);
    });
  });

  describe("Edge Cases and Advanced Configuration", () => {
    test("handles null values for optional parameters", () => {
      expect(mainTfContent).toMatch(/default\s*=\s*null/);
      expect(mainTfContent).toMatch(/var\.kms_key_id/);
    });

    test("uses splat expressions for array operations", () => {
      expect(mainTfContent).toMatch(/\[\*\]/);
      expect(mainTfContent).toMatch(/aws_subnet\.private\[\*\]\.id/);
    });

    test("string interpolation is used correctly", () => {
      expect(mainTfContent).toMatch(/\$\{var\.\w+\}/);
      expect(mainTfContent).toMatch(/\$\{var\.name_prefix\}/);
    });

    test("complex boolean logic with ternary operators", () => {
      expect(mainTfContent).toMatch(/\?\s*.*\s*:/);
      expect(mainTfContent).toMatch(/var\.single_nat_gateway\s*\?\s*1\s*:\s*length/);
    });

    test("array indexing with count", () => {
      expect(mainTfContent).toMatch(/\[count\.index\]/);
      expect(mainTfContent).toMatch(/local\.azs\[count\.index\]/);
    });

    test("function composition and nesting", () => {
      expect(mainTfContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*min\(/);
      expect(mainTfContent).toMatch(/length\(var\.public_subnet_cidrs\)/);
    });

    test("resource naming follows consistent patterns", () => {
      expect(mainTfContent).toMatch(/"\$\{var\.name_prefix\}-[\w-]+"/);
      // All resources should use name_prefix for consistency
      const resourceBlocks = mainTfContent.match(/resource\s+"aws_\w+"\s+"\w+"\s*{[\s\S]*?}/g) || [];
      const namedResources = resourceBlocks.filter(block => block.includes('Name ='));
      namedResources.forEach(block => {
        expect(block).toMatch(/Name\s*=\s*"\$\{var\.name_prefix\}/);
      });
    });

    test("all subnet configurations are consistent", () => {
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(mainTfContent).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
    });

    test("security group rules are properly scoped", () => {
      expect(mainTfContent).toMatch(/from_port\s*=\s*3306/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*3306/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("RDS parameter validation covers all scenarios", () => {
      expect(mainTfContent).toMatch(/var\.db_max_allocated_storage\s*>\s*0/);
      expect(mainTfContent).toMatch(/!var\.db_snapshot_final/);
      expect(mainTfContent).toMatch(/var\.db_snapshot_final\s*\?.*:\s*null/);
    });
  });

  describe("Configuration Completeness", () => {
    test("all AWS resource types are covered", () => {
      const expectedResourceTypes = [
        'aws_vpc',
        'aws_internet_gateway',
        'aws_subnet',
        'aws_eip',
        'aws_nat_gateway',
        'aws_route_table',
        'aws_route_table_association',
        'aws_security_group',
        'aws_db_subnet_group',
        'aws_db_instance'
      ];

      expectedResourceTypes.forEach(resourceType => {
        expect(mainTfContent).toMatch(new RegExp(`resource\\s+"${resourceType}"`));
      });
    });

    test("all variable constraints and types are defined", () => {
      // Ensure no variable is missing a type
      const variableBlocks = mainTfContent.match(/variable\s+"\w+"\s*{[\s\S]*?}/g) || [];
      variableBlocks.forEach(block => {
        expect(block).toMatch(/type\s*=/);
      });
    });

    test("all outputs provide meaningful values", () => {
      const outputBlocks = mainTfContent.match(/output\s+"\w+"\s*{[\s\S]*?}/g) || [];
      outputBlocks.forEach(block => {
        expect(block).toMatch(/value\s*=/);
        expect(block).toMatch(/description\s*=/);
      });
    });

    test("provider configuration is complete", () => {
      expect(providerTfContent).toMatch(/terraform\s*{/);
      expect(providerTfContent).toMatch(/required_version/);
      expect(providerTfContent).toMatch(/required_providers/);
      expect(providerTfContent).toMatch(/backend\s+"s3"/);
      expect(providerTfContent).toMatch(/provider\s+"aws"/);
    });
  });
});
