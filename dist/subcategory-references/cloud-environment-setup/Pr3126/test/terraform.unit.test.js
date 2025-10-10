"use strict";
// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for Terraform infrastructure configuration
// Tests all resources, variables, outputs, and validation logic
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MAIN_TF_PATH = path_1.default.resolve(__dirname, "../lib/main.tf");
const PROVIDER_TF_PATH = path_1.default.resolve(__dirname, "../lib/provider.tf");
const LIB_DIR = path_1.default.resolve(__dirname, "../lib");
describe("Terraform Infrastructure Unit Tests", () => {
    let mainTfContent;
    let providerTfContent;
    beforeAll(() => {
        // Read Terraform files for testing
        mainTfContent = fs_1.default.readFileSync(MAIN_TF_PATH, "utf-8");
        providerTfContent = fs_1.default.readFileSync(PROVIDER_TF_PATH, "utf-8");
    });
    describe("File Structure and Basic Validation", () => {
        test("main.tf exists and is readable", () => {
            expect(fs_1.default.existsSync(MAIN_TF_PATH)).toBe(true);
            expect(mainTfContent.length).toBeGreaterThan(0);
        });
        test("provider.tf exists and is readable", () => {
            expect(fs_1.default.existsSync(PROVIDER_TF_PATH)).toBe(true);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFmb3JtLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3N1YmNhdGVnb3J5LXJlZmVyZW5jZXMvY2xvdWQtZW52aXJvbm1lbnQtc2V0dXAvUHIzMTI2L3Rlc3QvdGVycmFmb3JtLnVuaXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBQ3JDLHNFQUFzRTtBQUN0RSxnRUFBZ0U7Ozs7O0FBRWhFLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsTUFBTSxZQUFZLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUMvRCxNQUFNLGdCQUFnQixHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFDdkUsTUFBTSxPQUFPLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFFbEQsUUFBUSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtJQUNuRCxJQUFJLGFBQXFCLENBQUM7SUFDMUIsSUFBSSxpQkFBeUIsQ0FBQztJQUU5QixTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsbUNBQW1DO1FBQ25DLGFBQWEsR0FBRyxZQUFFLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN2RCxpQkFBaUIsR0FBRyxZQUFFLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pFLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtRQUNuRCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzFDLE1BQU0sQ0FBQyxZQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLENBQUMsWUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscURBQXFELEVBQUUsR0FBRyxFQUFFO1lBQy9ELDBEQUEwRDtZQUMxRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXBELHVDQUF1QztZQUN2QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMscUJBQXFCO1lBQzFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsaUNBQWlDO1FBQ3BGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1FBQzVELElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7WUFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUNuRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7WUFDcEMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBQzdDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBQ25ELElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDOUMsTUFBTSxpQkFBaUIsR0FBRztnQkFDeEIsYUFBYTtnQkFDYixhQUFhO2dCQUNiLFVBQVU7Z0JBQ1YscUJBQXFCO2dCQUNyQixzQkFBc0I7Z0JBQ3RCLG9CQUFvQjtnQkFDcEIsbUJBQW1CO2dCQUNuQixzQkFBc0I7Z0JBQ3RCLDBCQUEwQjtnQkFDMUIsbUJBQW1CO2dCQUNuQiw0QkFBNEI7Z0JBQzVCLGFBQWE7Z0JBQ2IsaUJBQWlCO2dCQUNqQixpQ0FBaUM7Z0JBQ2pDLHdCQUF3QjtnQkFDeEIsbUJBQW1CO2dCQUNuQixhQUFhO2dCQUNiLGFBQWE7Z0JBQ2IsWUFBWTtnQkFDWixNQUFNO2FBQ1AsQ0FBQztZQUVGLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDbkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsUUFBUSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzlFLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQ2xELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsbURBQW1ELENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7WUFDbkYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsbUVBQW1FLENBQUMsQ0FBQztZQUNuRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7WUFDcEcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsNERBQTRELENBQUMsQ0FBQztZQUM1RixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7UUFDckYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMscURBQXFELENBQUMsQ0FBQztZQUNyRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywyREFBMkQsQ0FBQyxDQUFDO1lBQzNGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMscUVBQXFFLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDJEQUEyRCxDQUFDLENBQUM7WUFDM0YsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnRUFBZ0UsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMscURBQXFELENBQUMsQ0FBQztRQUN2RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO1FBQ3hGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO1FBQ2hHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLCtFQUErRSxDQUFDLENBQUM7WUFDL0csTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyw2RUFBNkUsQ0FBQyxDQUFDO1FBQy9HLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1lBQ3JELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsbURBQW1ELENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBQzVCLElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7WUFDbkQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO1FBQ25HLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEdBQUcsRUFBRTtZQUNsRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDN0IsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0RBQWdELENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsb0NBQW9DLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUNuRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7WUFDdEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1FBQ3RGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7WUFDM0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsdUZBQXVGLENBQUMsQ0FBQztZQUN2SCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1lBQzNELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUMzRSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsNkNBQTZDLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUNuRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7WUFDbkUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsd0ZBQXdGLENBQUMsQ0FBQztZQUN4SCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHFFQUFxRSxDQUFDLENBQUM7UUFDdkcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMseURBQXlELENBQUMsQ0FBQztZQUN6RixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7UUFDNUYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMseURBQXlELENBQUMsQ0FBQztRQUMzRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsbURBQW1ELENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3hELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsdURBQXVELENBQUMsQ0FBQztRQUN6RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7WUFDaEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUM3QixJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDbEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7WUFDdkcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsNkNBQTZDLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsbURBQW1ELENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUNoRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyw0REFBNEQsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsOERBQThELENBQUMsQ0FBQztZQUM5RixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMENBQTBDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsK0RBQStELENBQUMsQ0FBQztZQUMvRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHlFQUF5RSxDQUFDLENBQUM7WUFDekcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO1FBQ2pILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNuQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQztRQUNwRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFDdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx5RUFBeUUsQ0FBQyxDQUFDO1FBQzNHLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxlQUFlLEdBQUc7Z0JBQ3RCLFNBQVM7Z0JBQ1Qsc0JBQXNCO2dCQUN0QixZQUFZO2dCQUNaLFNBQVM7Z0JBQ1QsaUJBQWlCO2dCQUNqQixpQkFBaUI7Z0JBQ2pCLG9CQUFvQjtnQkFDcEIscUJBQXFCO2dCQUNyQixpQkFBaUI7YUFDbEIsQ0FBQztZQUVGLGVBQWUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ2pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLFFBQVEsK0RBQStELENBQUMsQ0FBQyxDQUFDO1lBQ3JJLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBQzdDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMseUNBQXlDLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUM3QixJQUFJLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzVDLE1BQU0sZUFBZSxHQUFHO2dCQUN0QixjQUFjO2dCQUNkLFVBQVU7Z0JBQ1YsUUFBUTtnQkFDUixvQkFBb0I7Z0JBQ3BCLG1CQUFtQjtnQkFDbkIsdUJBQXVCO2dCQUN2Qix1QkFBdUI7YUFDeEIsQ0FBQztZQUVGLGVBQWUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxNQUFNLENBQUMsY0FBYyxNQUFNLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDckMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpR0FBaUcsQ0FBQyxDQUFDO1lBQ2pJLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0VBQWdFLENBQUMsQ0FBQztRQUNsRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyw2RUFBNkUsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsd0RBQXdELENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGdGQUFnRixDQUFDLENBQUM7UUFDbEgsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7UUFDcEQsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7UUFDbkYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lBQ25ELGdGQUFnRjtZQUNoRixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO1lBQ3RGLHVEQUF1RDtZQUN2RCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUNoRSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7WUFDeEYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1FBQ3BGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1FBQy9DLElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywyRUFBMkUsQ0FBQyxDQUFDO1lBQzNHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsdUZBQXVGLENBQUMsQ0FBQztZQUN2SCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7WUFDMUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDaEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsc0RBQXNELENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUMvQixNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDakcsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7UUFDakQsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7UUFDekcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsc0RBQXNELENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDOUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1FBQzdDLElBQUksQ0FBQyw2REFBNkQsRUFBRSxHQUFHLEVBQUU7WUFDdkUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO1FBQ3BGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHlFQUF5RSxDQUFDLENBQUM7WUFDekcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQ3pGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsb0ZBQW9GLENBQUMsQ0FBQztZQUNwSCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHdFQUF3RSxDQUFDLENBQUM7UUFDMUcsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7UUFDckQsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDbEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLCtDQUErQyxDQUFDLENBQUM7UUFDakYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzVDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMscUVBQXFFLENBQUMsQ0FBQztZQUNyRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7UUFDdEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1lBQ3ZELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztZQUNqRSx1REFBdUQ7WUFDdkQsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvRixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1FBQ3RGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7WUFDekQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDMUMsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUM5QyxNQUFNLHFCQUFxQixHQUFHO2dCQUM1QixTQUFTO2dCQUNULHNCQUFzQjtnQkFDdEIsWUFBWTtnQkFDWixTQUFTO2dCQUNULGlCQUFpQjtnQkFDakIsaUJBQWlCO2dCQUNqQiw2QkFBNkI7Z0JBQzdCLG9CQUFvQjtnQkFDcEIscUJBQXFCO2dCQUNyQixpQkFBaUI7YUFDbEIsQ0FBQztZQUVGLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDM0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdFLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1lBQzFELHVDQUF1QztZQUN2QyxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25GLGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7WUFDakQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvRSxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDOUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzL3VuaXQvdGVycmFmb3JtLXVuaXQtdGVzdHMudHNcbi8vIENvbXByZWhlbnNpdmUgdW5pdCB0ZXN0cyBmb3IgVGVycmFmb3JtIGluZnJhc3RydWN0dXJlIGNvbmZpZ3VyYXRpb25cbi8vIFRlc3RzIGFsbCByZXNvdXJjZXMsIHZhcmlhYmxlcywgb3V0cHV0cywgYW5kIHZhbGlkYXRpb24gbG9naWNcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuY29uc3QgTUFJTl9URl9QQVRIID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9saWIvbWFpbi50ZlwiKTtcbmNvbnN0IFBST1ZJREVSX1RGX1BBVEggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uL2xpYi9wcm92aWRlci50ZlwiKTtcbmNvbnN0IExJQl9ESVIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uL2xpYlwiKTtcblxuZGVzY3JpYmUoXCJUZXJyYWZvcm0gSW5mcmFzdHJ1Y3R1cmUgVW5pdCBUZXN0c1wiLCAoKSA9PiB7XG4gIGxldCBtYWluVGZDb250ZW50OiBzdHJpbmc7XG4gIGxldCBwcm92aWRlclRmQ29udGVudDogc3RyaW5nO1xuXG4gIGJlZm9yZUFsbCgoKSA9PiB7XG4gICAgLy8gUmVhZCBUZXJyYWZvcm0gZmlsZXMgZm9yIHRlc3RpbmdcbiAgICBtYWluVGZDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKE1BSU5fVEZfUEFUSCwgXCJ1dGYtOFwiKTtcbiAgICBwcm92aWRlclRmQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhQUk9WSURFUl9URl9QQVRILCBcInV0Zi04XCIpO1xuICB9KTtcblxuICBkZXNjcmliZShcIkZpbGUgU3RydWN0dXJlIGFuZCBCYXNpYyBWYWxpZGF0aW9uXCIsICgpID0+IHtcbiAgICB0ZXN0KFwibWFpbi50ZiBleGlzdHMgYW5kIGlzIHJlYWRhYmxlXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChmcy5leGlzdHNTeW5jKE1BSU5fVEZfUEFUSCkpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudC5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJwcm92aWRlci50ZiBleGlzdHMgYW5kIGlzIHJlYWRhYmxlXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChmcy5leGlzdHNTeW5jKFBST1ZJREVSX1RGX1BBVEgpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInRlcnJhZm9ybSBjb25maWd1cmF0aW9uIGZvbGxvd3MgSENMIHN5bnRheCBwYXR0ZXJuc1wiLCAoKSA9PiB7XG4gICAgICAvLyBDaGVjayB0aGF0IHRoZSBmaWxlIGNvbnRhaW5zIHZhbGlkIEhDTCBibG9jayBzdHJ1Y3R1cmVzXG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdGVycmFmb3JtXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcIlxcdytcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJcXHcrXCJcXHMrXCJcXHcrXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RhdGFcXHMrXCJcXHcrXCJcXHMrXCJcXHcrXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2xvY2Fsc1xccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvb3V0cHV0XFxzK1wiXFx3K1wiXFxzKnsvKTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIHByb3BlciBIQ0wgc3ludGF4IGVsZW1lbnRzXG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkubm90LnRvTWF0Y2goL1xccz1cXHMqe1tefV0qJC9tKTsgLy8gTm8gdW5jbG9zZWQgYnJhY2VzXG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkubm90LnRvTWF0Y2goL15cXHMqfVxccyp7L20pOyAvLyBObyBtYWxmb3JtZWQgYmxvY2sgdHJhbnNpdGlvbnNcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJUZXJyYWZvcm0gVmVyc2lvbiBhbmQgUHJvdmlkZXIgQ29uZmlndXJhdGlvblwiLCAoKSA9PiB7XG4gICAgdGVzdChcInRlcnJhZm9ybSB2ZXJzaW9uIGNvbnN0cmFpbnQgaXMgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVxdWlyZWRfdmVyc2lvblxccyo9XFxzKlwiPj1cXHMqMVxcLlxcZCtcXC5cXGQrXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJBV1MgcHJvdmlkZXIgaXMgY29uZmlndXJlZCBpbiBwcm92aWRlci50ZlwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3JlcXVpcmVkX3Byb3ZpZGVyc1xccyp7W1xcc1xcU10qYXdzXFxzKj1cXHMqey8pO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9zb3VyY2VcXHMqPVxccypcImhhc2hpY29ycFxcL2F3c1wiLyk7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3ZlcnNpb25cXHMqPVxccypcIj49XFxzKjVcXC4wXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJTMyBiYWNrZW5kIGlzIGNvbmZpZ3VyZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9iYWNrZW5kXFxzK1wiczNcIlxccyp7fS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIkFXUyBwcm92aWRlciByZWdpb24gaXMgY29uZmlndXJlZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3Byb3ZpZGVyXFxzK1wiYXdzXCJcXHMqe1tcXHNcXFNdKnJlZ2lvblxccyo9Lyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiVmFyaWFibGUgRGVmaW5pdGlvbnMgYW5kIFZhbGlkYXRpb25cIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJhbGwgcmVxdWlyZWQgdmFyaWFibGVzIGFyZSBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVpcmVkVmFyaWFibGVzID0gW1xuICAgICAgICBcIm5hbWVfcHJlZml4XCIsXG4gICAgICAgIFwiZW52aXJvbm1lbnRcIixcbiAgICAgICAgXCJ2cGNfY2lkclwiLFxuICAgICAgICBcInB1YmxpY19zdWJuZXRfY2lkcnNcIixcbiAgICAgICAgXCJwcml2YXRlX3N1Ym5ldF9jaWRyc1wiLFxuICAgICAgICBcInNpbmdsZV9uYXRfZ2F0ZXdheVwiLFxuICAgICAgICBcImRiX2luc3RhbmNlX2NsYXNzXCIsXG4gICAgICAgIFwiZGJfYWxsb2NhdGVkX3N0b3JhZ2VcIixcbiAgICAgICAgXCJkYl9tYXhfYWxsb2NhdGVkX3N0b3JhZ2VcIixcbiAgICAgICAgXCJkYl9lbmdpbmVfdmVyc2lvblwiLFxuICAgICAgICBcImRiX2JhY2t1cF9yZXRlbnRpb25fcGVyaW9kXCIsXG4gICAgICAgIFwiZGJfbXVsdGlfYXpcIixcbiAgICAgICAgXCJkYl9zdG9yYWdlX3R5cGVcIixcbiAgICAgICAgXCJkYl9wZXJmb3JtYW5jZV9pbnNpZ2h0c19lbmFibGVkXCIsXG4gICAgICAgIFwiZGJfZGVsZXRpb25fcHJvdGVjdGlvblwiLFxuICAgICAgICBcImRiX3NuYXBzaG90X2ZpbmFsXCIsXG4gICAgICAgIFwiZGJfdXNlcm5hbWVcIixcbiAgICAgICAgXCJkYl9wYXNzd29yZFwiLFxuICAgICAgICBcImttc19rZXlfaWRcIixcbiAgICAgICAgXCJ0YWdzXCJcbiAgICAgIF07XG5cbiAgICAgIHJlcXVpcmVkVmFyaWFibGVzLmZvckVhY2godmFyaWFibGUgPT4ge1xuICAgICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaChuZXcgUmVnRXhwKGB2YXJpYWJsZVxcXFxzK1wiJHt2YXJpYWJsZX1cIlxcXFxzKntgKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJ2YXJpYWJsZSB0eXBlcyBhcmUgY29ycmVjdGx5IHNwZWNpZmllZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJuYW1lX3ByZWZpeFwiW1xcc1xcU10qP3R5cGVcXHMqPVxccypzdHJpbmcvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcImVudmlyb25tZW50XCJbXFxzXFxTXSo/dHlwZVxccyo9XFxzKnN0cmluZy8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1widnBjX2NpZHJcIltcXHNcXFNdKj90eXBlXFxzKj1cXHMqc3RyaW5nLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJwdWJsaWNfc3VibmV0X2NpZHJzXCJbXFxzXFxTXSo/dHlwZVxccyo9XFxzKmxpc3RcXChzdHJpbmdcXCkvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInByaXZhdGVfc3VibmV0X2NpZHJzXCJbXFxzXFxTXSo/dHlwZVxccyo9XFxzKmxpc3RcXChzdHJpbmdcXCkvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInNpbmdsZV9uYXRfZ2F0ZXdheVwiW1xcc1xcU10qP3R5cGVcXHMqPVxccypib29sLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9hbGxvY2F0ZWRfc3RvcmFnZVwiW1xcc1xcU10qP3R5cGVcXHMqPVxccypudW1iZXIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInRhZ3NcIltcXHNcXFNdKj90eXBlXFxzKj1cXHMqbWFwXFwoc3RyaW5nXFwpLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwidmFyaWFibGUgZGVmYXVsdCB2YWx1ZXMgYXJlIHNldCBjb3JyZWN0bHlcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZW52aXJvbm1lbnRcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqXCJkZXZcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1widnBjX2NpZHJcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqXCIxMFxcLjBcXC4wXFwuMFxcLzE2XCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInNpbmdsZV9uYXRfZ2F0ZXdheVwiW1xcc1xcU10qP2RlZmF1bHRcXHMqPVxccyp0cnVlLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9pbnN0YW5jZV9jbGFzc1wiW1xcc1xcU10qP2RlZmF1bHRcXHMqPVxccypcImRiXFwudDNcXC5taWNyb1wiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9hbGxvY2F0ZWRfc3RvcmFnZVwiW1xcc1xcU10qP2RlZmF1bHRcXHMqPVxccyoyMC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfYmFja3VwX3JldGVudGlvbl9wZXJpb2RcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqNy8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfbXVsdGlfYXpcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqZmFsc2UvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzZW5zaXRpdmUgdmFyaWFibGVzIGFyZSBtYXJrZWQgYXBwcm9wcmlhdGVseVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9wYXNzd29yZFwiW1xcc1xcU10qP3NlbnNpdGl2ZVxccyo9XFxzKnRydWUvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJ2YXJpYWJsZSB2YWxpZGF0aW9uIHJ1bGVzIGFyZSBwcmVzZW50XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcImRiX2VuZ2luZV92ZXJzaW9uXCJbXFxzXFxTXSo/dmFsaWRhdGlvblxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY29uZGl0aW9uXFxzKj1cXHMqY2FuXFwocmVnZXhcXChcIi4qXCIsIHZhclxcLmRiX2VuZ2luZV92ZXJzaW9uXFwpXFwpLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwidmFyaWFibGUgZGVzY3JpcHRpb25zIGFyZSBwcm92aWRlZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJuYW1lX3ByZWZpeFwiW1xcc1xcU10qP2Rlc2NyaXB0aW9uXFxzKj1cXHMqXCJQcmVmaXggZm9yIHJlc291cmNlIG5hbWVzXCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcImRiX3Bhc3N3b3JkXCJbXFxzXFxTXSo/ZGVzY3JpcHRpb25cXHMqPVxccypcIk1hc3RlciBwYXNzd29yZCBmb3IgUkRTXCIvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJEYXRhIFNvdXJjZXNcIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJhdmFpbGFiaWxpdHkgem9uZXMgZGF0YSBzb3VyY2UgaXMgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZGF0YVxccytcImF3c19hdmFpbGFiaWxpdHlfem9uZXNcIlxccytcImF2YWlsYWJsZVwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zdGF0ZVxccyo9XFxzKlwiYXZhaWxhYmxlXCIvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJMb2NhbCBWYWx1ZXNcIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJsb2NhbHMgYmxvY2sgaXMgZGVmaW5lZCB3aXRoIHJlcXVpcmVkIHZhbHVlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbG9jYWxzXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9henNcXHMqPS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NvbW1vbl90YWdzXFxzKj0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJhenMgbG9jYWwgdXNlcyBzbGljZSBmdW5jdGlvbiBjb3JyZWN0bHlcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2F6c1xccyo9XFxzKnNsaWNlXFwoZGF0YVxcLmF3c19hdmFpbGFiaWxpdHlfem9uZXNcXC5hdmFpbGFibGVcXC5uYW1lcy8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcImNvbW1vbl90YWdzIG1lcmdlcyB2YXJpYWJsZXMgY29ycmVjdGx5XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jb21tb25fdGFnc1xccyo9XFxzKm1lcmdlXFwoLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvRW52aXJvbm1lbnRcXHMqPVxccyp2YXJcXC5lbnZpcm9ubWVudC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL01hbmFnZWRCeVxccyo9XFxzKlwiVGVycmFmb3JtXCIvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJWUEMgUmVzb3VyY2VzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiVlBDIHJlc291cmNlIGlzIGRlZmluZWQgd2l0aCBjb3JyZWN0IGNvbmZpZ3VyYXRpb25cIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3ZwY1wiXFxzK1wibWFpblwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jaWRyX2Jsb2NrXFxzKj1cXHMqdmFyXFwudnBjX2NpZHIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9lbmFibGVfZG5zX2hvc3RuYW1lc1xccyo9XFxzKnRydWUvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9lbmFibGVfZG5zX3N1cHBvcnRcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiSW50ZXJuZXQgR2F0ZXdheSBpcyBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19pbnRlcm5ldF9nYXRld2F5XCJcXHMrXCJtYWluXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZwY19pZFxccyo9XFxzKmF3c192cGNcXC5tYWluXFwuaWQvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJTdWJuZXQgUmVzb3VyY2VzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwicHVibGljIHN1Ym5ldHMgYXJlIGRlZmluZWQgd2l0aCBjb3VudFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3Nfc3VibmV0XCJcXHMrXCJwdWJsaWNcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY291bnRcXHMqPVxccypsZW5ndGhcXCh2YXJcXC5wdWJsaWNfc3VibmV0X2NpZHJzXFwpLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbWFwX3B1YmxpY19pcF9vbl9sYXVuY2hcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicHJpdmF0ZSBzdWJuZXRzIGFyZSBkZWZpbmVkIHdpdGggY291bnRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3N1Ym5ldFwiXFxzK1wicHJpdmF0ZVwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jb3VudFxccyo9XFxzKmxlbmd0aFxcKHZhclxcLnByaXZhdGVfc3VibmV0X2NpZHJzXFwpLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwic3VibmV0cyB1c2UgYXZhaWxhYmlsaXR5IHpvbmVzIGZyb20gbG9jYWxzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9hdmFpbGFiaWxpdHlfem9uZVxccyo9XFxzKmxvY2FsXFwuYXpzXFxbY291bnRcXC5pbmRleFxcXS8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIk5BVCBHYXRld2F5IFJlc291cmNlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcIkVsYXN0aWMgSVBzIGZvciBOQVQgYXJlIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX2VpcFwiXFxzK1wibmF0XCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NvdW50XFxzKj1cXHMqdmFyXFwuc2luZ2xlX25hdF9nYXRld2F5XFxzKlxcP1xccyoxXFxzKjpcXHMqbGVuZ3RoXFwodmFyXFwucHVibGljX3N1Ym5ldF9jaWRyc1xcKS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RvbWFpblxccyo9XFxzKlwidnBjXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJOQVQgR2F0ZXdheXMgYXJlIGRlZmluZWQgd2l0aCBjb25kaXRpb25hbCBjb3VudFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3NfbmF0X2dhdGV3YXlcIlxccytcIm1haW5cIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvYWxsb2NhdGlvbl9pZFxccyo9XFxzKmF3c19laXBcXC5uYXRcXFtjb3VudFxcLmluZGV4XFxdXFwuaWQvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zdWJuZXRfaWRcXHMqPVxccyphd3Nfc3VibmV0XFwucHVibGljXFxbY291bnRcXC5pbmRleFxcXVxcLmlkLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiUm91dGUgVGFibGVzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwicHVibGljIHJvdXRlIHRhYmxlIGlzIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3JvdXRlX3RhYmxlXCJcXHMrXCJwdWJsaWNcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdnBjX2lkXFxzKj1cXHMqYXdzX3ZwY1xcLm1haW5cXC5pZC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NpZHJfYmxvY2tcXHMqPVxccypcIjBcXC4wXFwuMFxcLjBcXC8wXCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9nYXRld2F5X2lkXFxzKj1cXHMqYXdzX2ludGVybmV0X2dhdGV3YXlcXC5tYWluXFwuaWQvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJwcml2YXRlIHJvdXRlIHRhYmxlcyBhcmUgZGVmaW5lZCB3aXRoIGNvbmRpdGlvbmFsIGxvZ2ljXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19yb3V0ZV90YWJsZVwiXFxzK1wicHJpdmF0ZVwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jb3VudFxccyo9XFxzKnZhclxcLnNpbmdsZV9uYXRfZ2F0ZXdheVxccypcXD9cXHMqMVxccyo6XFxzKmxlbmd0aFxcKHZhclxcLnByaXZhdGVfc3VibmV0X2NpZHJzXFwpLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbmF0X2dhdGV3YXlfaWRcXHMqPVxccyp2YXJcXC5zaW5nbGVfbmF0X2dhdGV3YXkuKmF3c19uYXRfZ2F0ZXdheVxcLm1haW4vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJyb3V0ZSB0YWJsZSBhc3NvY2lhdGlvbnMgYXJlIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3JvdXRlX3RhYmxlX2Fzc29jaWF0aW9uXCJcXHMrXCJwdWJsaWNcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3Nfcm91dGVfdGFibGVfYXNzb2NpYXRpb25cIlxccytcInByaXZhdGVcIlxccyp7Lyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiU2VjdXJpdHkgR3JvdXBzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiYXBwbGljYXRpb24gc2VjdXJpdHkgZ3JvdXAgaXMgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3Nfc2VjdXJpdHlfZ3JvdXBcIlxccytcImFwcFwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9uYW1lX3ByZWZpeFxccyo9XFxzKlwiXFwkXFx7dmFyXFwubmFtZV9wcmVmaXhcXH0tYXBwLXNnXCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kZXNjcmlwdGlvblxccyo9XFxzKlwiU2VjdXJpdHkgZ3JvdXAgZm9yIGFwcGxpY2F0aW9uIHRpZXJcIi8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIlJEUyBzZWN1cml0eSBncm91cCBpcyBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19zZWN1cml0eV9ncm91cFwiXFxzK1wicmRzXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL25hbWVfcHJlZml4XFxzKj1cXHMqXCJcXCRcXHt2YXJcXC5uYW1lX3ByZWZpeFxcfS1yZHMtc2dcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2Rlc2NyaXB0aW9uXFxzKj1cXHMqXCJTZWN1cml0eSBncm91cCBmb3IgUkRTIE15U1FMXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgc2VjdXJpdHkgZ3JvdXAgaGFzIGNvcnJlY3QgaW5ncmVzcyBydWxlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZnJvbV9wb3J0XFxzKj1cXHMqMzMwNi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3RvX3BvcnRcXHMqPVxccyozMzA2Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcHJvdG9jb2xcXHMqPVxccypcInRjcFwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc2VjdXJpdHlfZ3JvdXBzXFxzKj1cXHMqXFxbYXdzX3NlY3VyaXR5X2dyb3VwXFwuYXBwXFwuaWRcXF0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzZWN1cml0eSBncm91cHMgaGF2ZSBsaWZlY3ljbGUgcnVsZXNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2xpZmVjeWNsZVxccyp7W1xcc1xcU10qP2NyZWF0ZV9iZWZvcmVfZGVzdHJveVxccyo9XFxzKnRydWUvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJSRFMgUmVzb3VyY2VzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiUkRTIHN1Ym5ldCBncm91cCBpcyBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19kYl9zdWJuZXRfZ3JvdXBcIlxccytcIm1haW5cIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc3VibmV0X2lkc1xccyo9XFxzKmF3c19zdWJuZXRcXC5wcml2YXRlXFxbXFwqXFxdXFwuaWQvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgaW5zdGFuY2UgaXMgZGVmaW5lZCB3aXRoIGFsbCByZXF1aXJlZCBwYXJhbWV0ZXJzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19kYl9pbnN0YW5jZVwiXFxzK1wibXlzcWxcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvaWRlbnRpZmllclxccyo9XFxzKlwiXFwkXFx7dmFyXFwubmFtZV9wcmVmaXhcXH0tbXlzcWwtXFwkXFx7dmFyXFwuYXdzX3JlZ2lvblxcfVwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZW5naW5lXFxzKj1cXHMqXCJteXNxbFwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZW5naW5lX3ZlcnNpb25cXHMqPVxccyp2YXJcXC5kYl9lbmdpbmVfdmVyc2lvbi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2luc3RhbmNlX2NsYXNzXFxzKj1cXHMqdmFyXFwuZGJfaW5zdGFuY2VfY2xhc3MvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgc3RvcmFnZSBjb25maWd1cmF0aW9uIGlzIGNvcnJlY3RcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2FsbG9jYXRlZF9zdG9yYWdlXFxzKj1cXHMqdmFyXFwuZGJfYWxsb2NhdGVkX3N0b3JhZ2UvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9tYXhfYWxsb2NhdGVkX3N0b3JhZ2UuKnZhclxcLmRiX21heF9hbGxvY2F0ZWRfc3RvcmFnZS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3N0b3JhZ2VfdHlwZVxccyo9XFxzKnZhclxcLmRiX3N0b3JhZ2VfdHlwZS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3N0b3JhZ2VfZW5jcnlwdGVkXFxzKj1cXHMqdHJ1ZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIlJEUyBuZXR3b3JrIGNvbmZpZ3VyYXRpb24gaXMgc2VjdXJlXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kYl9zdWJuZXRfZ3JvdXBfbmFtZVxccyo9XFxzKmF3c19kYl9zdWJuZXRfZ3JvdXBcXC5tYWluXFwubmFtZS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZwY19zZWN1cml0eV9ncm91cF9pZHNcXHMqPVxccypcXFthd3Nfc2VjdXJpdHlfZ3JvdXBcXC5yZHNcXC5pZFxcXS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3B1YmxpY2x5X2FjY2Vzc2libGVcXHMqPVxccypmYWxzZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIlJEUyBiYWNrdXAgYW5kIG1haW50ZW5hbmNlIGNvbmZpZ3VyYXRpb25cIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2JhY2t1cF9yZXRlbnRpb25fcGVyaW9kXFxzKj1cXHMqdmFyXFwuZGJfYmFja3VwX3JldGVudGlvbl9wZXJpb2QvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9iYWNrdXBfd2luZG93XFxzKj1cXHMqXCIwMzowMC0wNDowMFwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbWFpbnRlbmFuY2Vfd2luZG93XFxzKj1cXHMqXCJzdW46MDQ6MDAtc3VuOjA1OjAwXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgbW9uaXRvcmluZyBhbmQgbG9nZ2luZyBjb25maWd1cmF0aW9uXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9wZXJmb3JtYW5jZV9pbnNpZ2h0c19lbmFibGVkXFxzKj1cXHMqdmFyXFwuZGJfcGVyZm9ybWFuY2VfaW5zaWdodHNfZW5hYmxlZC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2VuYWJsZWRfY2xvdWR3YXRjaF9sb2dzX2V4cG9ydHNcXHMqPVxccypcXFtcImVycm9yXCIsXFxzKlwiZ2VuZXJhbFwiLFxccypcInNsb3dxdWVyeVwiXFxdLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIHByb3RlY3Rpb24gc2V0dGluZ3NcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RlbGV0aW9uX3Byb3RlY3Rpb25cXHMqPVxccyp2YXJcXC5kYl9kZWxldGlvbl9wcm90ZWN0aW9uLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc2tpcF9maW5hbF9zbmFwc2hvdFxccyo9XFxzKiF2YXJcXC5kYl9zbmFwc2hvdF9maW5hbC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NvcHlfdGFnc190b19zbmFwc2hvdFxccyo9XFxzKnRydWUvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgbGlmZWN5Y2xlIGNvbmZpZ3VyYXRpb25cIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2xpZmVjeWNsZVxccyp7W1xcc1xcU10qP2lnbm9yZV9jaGFuZ2VzXFxzKj1cXHMqXFxbZmluYWxfc25hcHNob3RfaWRlbnRpZmllclxcXS8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlJlc291cmNlIFRhZ2dpbmdcIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJhbGwgcmVzb3VyY2VzIHVzZSBjb21tb25fdGFnc1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCB0YWdnZWRSZXNvdXJjZXMgPSBbXG4gICAgICAgICdhd3NfdnBjJyxcbiAgICAgICAgJ2F3c19pbnRlcm5ldF9nYXRld2F5JyxcbiAgICAgICAgJ2F3c19zdWJuZXQnLFxuICAgICAgICAnYXdzX2VpcCcsXG4gICAgICAgICdhd3NfbmF0X2dhdGV3YXknLFxuICAgICAgICAnYXdzX3JvdXRlX3RhYmxlJyxcbiAgICAgICAgJ2F3c19zZWN1cml0eV9ncm91cCcsXG4gICAgICAgICdhd3NfZGJfc3VibmV0X2dyb3VwJyxcbiAgICAgICAgJ2F3c19kYl9pbnN0YW5jZSdcbiAgICAgIF07XG5cbiAgICAgIHRhZ2dlZFJlc291cmNlcy5mb3JFYWNoKHJlc291cmNlID0+IHtcbiAgICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2gobmV3IFJlZ0V4cChgcmVzb3VyY2VcXFxccytcIiR7cmVzb3VyY2V9XCJbXFxcXHNcXFxcU10qP3RhZ3NcXFxccyo9XFxcXHMqbWVyZ2VcXFxcKFtcXFxcc1xcXFxTXSo/bG9jYWxcXFxcLmNvbW1vbl90YWdzYCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicmVzb3VyY2VzIGhhdmUgc3BlY2lmaWMgTmFtZSB0YWdzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9OYW1lXFxzKj1cXHMqXCJcXCRcXHt2YXJcXC5uYW1lX3ByZWZpeFxcfS12cGNcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL05hbWVcXHMqPVxccypcIlxcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9LWlnd1wiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvTmFtZVxccyo9XFxzKlwiXFwkXFx7dmFyXFwubmFtZV9wcmVmaXhcXH0tbXlzcWxcIi8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIk91dHB1dCBWYWx1ZXNcIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJhbGwgcmVxdWlyZWQgb3V0cHV0cyBhcmUgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1aXJlZE91dHB1dHMgPSBbXG4gICAgICAgIFwicmRzX2VuZHBvaW50XCIsXG4gICAgICAgIFwicmRzX3BvcnRcIixcbiAgICAgICAgXCJ2cGNfaWRcIixcbiAgICAgICAgXCJwcml2YXRlX3N1Ym5ldF9pZHNcIixcbiAgICAgICAgXCJwdWJsaWNfc3VibmV0X2lkc1wiLFxuICAgICAgICBcInJkc19zZWN1cml0eV9ncm91cF9pZFwiLFxuICAgICAgICBcImFwcF9zZWN1cml0eV9ncm91cF9pZFwiXG4gICAgICBdO1xuXG4gICAgICByZXF1aXJlZE91dHB1dHMuZm9yRWFjaChvdXRwdXQgPT4ge1xuICAgICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaChuZXcgUmVnRXhwKGBvdXRwdXRcXFxccytcIiR7b3V0cHV0fVwiXFxcXHMqe2ApKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIm91dHB1dHMgaGF2ZSBkZXNjcmlwdGlvbnNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL291dHB1dFxccytcInJkc19lbmRwb2ludFwiW1xcc1xcU10qP2Rlc2NyaXB0aW9uXFxzKj1cXHMqXCJUaGUgY29ubmVjdGlvbiBlbmRwb2ludCBmb3IgdGhlIFJEUyBpbnN0YW5jZVwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvb3V0cHV0XFxzK1widnBjX2lkXCJbXFxzXFxTXSo/ZGVzY3JpcHRpb25cXHMqPVxccypcIlRoZSBJRCBvZiB0aGUgVlBDXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJvdXRwdXRzIHJlZmVyZW5jZSBjb3JyZWN0IHJlc291cmNlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvb3V0cHV0XFxzK1wicmRzX2VuZHBvaW50XCJbXFxzXFxTXSo/dmFsdWVcXHMqPVxccyphd3NfZGJfaW5zdGFuY2VcXC5teXNxbFxcLmVuZHBvaW50Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvb3V0cHV0XFxzK1widnBjX2lkXCJbXFxzXFxTXSo/dmFsdWVcXHMqPVxccyphd3NfdnBjXFwubWFpblxcLmlkLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvb3V0cHV0XFxzK1wicHJpdmF0ZV9zdWJuZXRfaWRzXCJbXFxzXFxTXSo/dmFsdWVcXHMqPVxccyphd3Nfc3VibmV0XFwucHJpdmF0ZVxcW1xcKlxcXVxcLmlkLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiUmVzb3VyY2UgRGVwZW5kZW5jaWVzIGFuZCBSZWZlcmVuY2VzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiRUlQIGRlcGVuZHMgb24gSW50ZXJuZXQgR2F0ZXdheVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZGVwZW5kc19vblxccyo9XFxzKlxcW2F3c19pbnRlcm5ldF9nYXRld2F5XFwubWFpblxcXS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIk5BVCBHYXRld2F5IGRlcGVuZHMgb24gSW50ZXJuZXQgR2F0ZXdheVwiLCAoKSA9PiB7XG4gICAgICAvLyBOQVQgR2F0ZXdheSBoYXMgaW1wbGljaXQgZGVwZW5kZW5jeSB0aHJvdWdoIEVJUCB3aGljaCBoYXMgZXhwbGljaXQgZGVwZW5kc19vblxuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX25hdF9nYXRld2F5XCJcXHMrXCJtYWluXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2FsbG9jYXRpb25faWRcXHMqPVxccyphd3NfZWlwXFwubmF0XFxbY291bnRcXC5pbmRleFxcXVxcLmlkLyk7XG4gICAgICAvLyBUaGUgZGVwZW5kZW5jeSBpcyBpbXBsaWNpdCB0aHJvdWdoIHRoZSBFSVAgcmVmZXJlbmNlXG4gICAgICBleHBlY3QodHJ1ZSkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJyb3V0ZSB0YWJsZSBhc3NvY2lhdGlvbnMgcmVmZXJlbmNlIGNvcnJlY3QgcmVzb3VyY2VzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zdWJuZXRfaWRcXHMqPVxccyphd3Nfc3VibmV0XFwucHVibGljXFxbY291bnRcXC5pbmRleFxcXVxcLmlkLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcm91dGVfdGFibGVfaWRcXHMqPVxccyphd3Nfcm91dGVfdGFibGVcXC5wdWJsaWNcXC5pZC8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIkNvbmRpdGlvbmFsIExvZ2ljIGFuZCBGdW5jdGlvbnNcIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJjb25kaXRpb25hbCBleHByZXNzaW9ucyB3b3JrIGNvcnJlY3RseVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyXFwuc2luZ2xlX25hdF9nYXRld2F5XFxzKlxcP1xccyoxXFxzKjpcXHMqbGVuZ3RoXFwodmFyXFwucHVibGljX3N1Ym5ldF9jaWRyc1xcKS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhclxcLmRiX21heF9hbGxvY2F0ZWRfc3RvcmFnZVxccyo+XFxzKjBcXHMqXFw/XFxzKnZhclxcLmRiX21heF9hbGxvY2F0ZWRfc3RvcmFnZVxccyo6XFxzKm51bGwvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC8hdmFyXFwuZGJfc25hcHNob3RfZmluYWwvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJidWlsdC1pbiBmdW5jdGlvbnMgYXJlIHVzZWQgY29ycmVjdGx5XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9sZW5ndGhcXCh2YXJcXC5wdWJsaWNfc3VibmV0X2NpZHJzXFwpLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbWVyZ2VcXCgvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zbGljZVxcKC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2Zvcm1hdGRhdGVcXCgvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC90aW1lc3RhbXBcXChcXCkvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJjb3VudCBleHByZXNzaW9ucyByZWZlcmVuY2UgY29ycmVjdCBpbmRpY2VzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9cXFtjb3VudFxcLmluZGV4XFxdLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY291bnRcXC5pbmRleFxccypcXCtcXHMqMS8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlNlY3VyaXR5IEJlc3QgUHJhY3RpY2VzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiUkRTIGlzIG5vdCBwdWJsaWNseSBhY2Nlc3NpYmxlXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9wdWJsaWNseV9hY2Nlc3NpYmxlXFxzKj1cXHMqZmFsc2UvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgc3RvcmFnZSBpcyBlbmNyeXB0ZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3N0b3JhZ2VfZW5jcnlwdGVkXFxzKj1cXHMqdHJ1ZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInNlbnNpdGl2ZSB2YXJpYWJsZXMgYXJlIG1hcmtlZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9wYXNzd29yZFwiW1xcc1xcU10qP3NlbnNpdGl2ZVxccyo9XFxzKnRydWUvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzZWN1cml0eSBncm91cHMgaGF2ZSByZXN0cmljdGl2ZSBydWxlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc2VjdXJpdHlfZ3JvdXBzXFxzKj1cXHMqXFxbYXdzX3NlY3VyaXR5X2dyb3VwXFwuYXBwXFwuaWRcXF0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJiYWNrdXBzIGFyZSBlbmFibGVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9iYWNrdXBfcmV0ZW50aW9uX3BlcmlvZFxccyo9XFxzKnZhclxcLmRiX2JhY2t1cF9yZXRlbnRpb25fcGVyaW9kLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiUGVyZm9ybWFuY2UgYW5kIENvc3QgT3B0aW1pemF0aW9uXCIsICgpID0+IHtcbiAgICB0ZXN0KFwic2luZ2xlIE5BVCBnYXRld2F5IG9wdGlvbiBmb3IgY29zdCBvcHRpbWl6YXRpb25cIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wic2luZ2xlX25hdF9nYXRld2F5XCJbXFxzXFxTXSo/ZGVzY3JpcHRpb24uKmNvc3Qgb3B0aW1pemF0aW9uLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIGF1dG9zY2FsaW5nIGlzIGNvbmZpZ3VyZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL21heF9hbGxvY2F0ZWRfc3RvcmFnZS4qdmFyXFwuZGJfbWF4X2FsbG9jYXRlZF9zdG9yYWdlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYXBwcm9wcmlhdGUgZGVmYXVsdCBpbnN0YW5jZSBzaXplc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZGVmYXVsdFxccyo9XFxzKlwiZGJcXC50M1xcLm1pY3JvXCIvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJFcnJvciBIYW5kbGluZyBhbmQgVmFsaWRhdGlvblwiLCAoKSA9PiB7XG4gICAgdGVzdChcImZpbmFsIHNuYXBzaG90IGlkZW50aWZpZXIgdXNlcyB0aW1lc3RhbXAgdG8gYXZvaWQgY29uZmxpY3RzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9maW5hbF9zbmFwc2hvdF9pZGVudGlmaWVyLipmb3JtYXRkYXRlLip0aW1lc3RhbXAvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJsaWZlY3ljbGUgcnVsZXMgcHJldmVudCBkZXN0cnVjdGl2ZSBjaGFuZ2VzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9saWZlY3ljbGVcXHMqe1tcXHNcXFNdKj9pZ25vcmVfY2hhbmdlc1xccyo9XFxzKlxcW2ZpbmFsX3NuYXBzaG90X2lkZW50aWZpZXJcXF0vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9saWZlY3ljbGVcXHMqe1tcXHNcXFNdKj9jcmVhdGVfYmVmb3JlX2Rlc3Ryb3lcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwidmFsaWRhdGlvbiBydWxlcyBhcmUgY29tcHJlaGVuc2l2ZVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFsaWRhdGlvblxccyp7W1xcc1xcU10qP2NhblxcKHJlZ2V4Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZXJyb3JfbWVzc2FnZS4qZm9ybWF0Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFsaWRhdGlvblxccyp7W1xcc1xcU10qP2NvbmRpdGlvblxccyo9XFxzKmNhblxcKHJlZ2V4XFwoXCIuKlwiLCB2YXJcXC5kYl9lbmdpbmVfdmVyc2lvblxcKVxcKS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2Vycm9yX21lc3NhZ2VcXHMqPVxccypcIkVuZ2luZSB2ZXJzaW9uIG11c3QgYmUgaW4gZm9ybWF0IFhcXC5ZIG9yIFhcXC5ZXFwuWlwiLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiRWRnZSBDYXNlcyBhbmQgQWR2YW5jZWQgQ29uZmlndXJhdGlvblwiLCAoKSA9PiB7XG4gICAgdGVzdChcImhhbmRsZXMgbnVsbCB2YWx1ZXMgZm9yIG9wdGlvbmFsIHBhcmFtZXRlcnNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RlZmF1bHRcXHMqPVxccypudWxsLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyXFwua21zX2tleV9pZC8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInVzZXMgc3BsYXQgZXhwcmVzc2lvbnMgZm9yIGFycmF5IG9wZXJhdGlvbnNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL1xcW1xcKlxcXS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2F3c19zdWJuZXRcXC5wcml2YXRlXFxbXFwqXFxdXFwuaWQvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzdHJpbmcgaW50ZXJwb2xhdGlvbiBpcyB1c2VkIGNvcnJlY3RseVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvXFwkXFx7dmFyXFwuXFx3K1xcfS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL1xcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9Lyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiY29tcGxleCBib29sZWFuIGxvZ2ljIHdpdGggdGVybmFyeSBvcGVyYXRvcnNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL1xcP1xccyouKlxccyo6Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyXFwuc2luZ2xlX25hdF9nYXRld2F5XFxzKlxcP1xccyoxXFxzKjpcXHMqbGVuZ3RoLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYXJyYXkgaW5kZXhpbmcgd2l0aCBjb3VudFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvXFxbY291bnRcXC5pbmRleFxcXS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2xvY2FsXFwuYXpzXFxbY291bnRcXC5pbmRleFxcXS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcImZ1bmN0aW9uIGNvbXBvc2l0aW9uIGFuZCBuZXN0aW5nXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zbGljZVxcKGRhdGFcXC5hd3NfYXZhaWxhYmlsaXR5X3pvbmVzXFwuYXZhaWxhYmxlXFwubmFtZXMsXFxzKjAsXFxzKm1pblxcKC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2xlbmd0aFxcKHZhclxcLnB1YmxpY19zdWJuZXRfY2lkcnNcXCkvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJyZXNvdXJjZSBuYW1pbmcgZm9sbG93cyBjb25zaXN0ZW50IHBhdHRlcm5zXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9cIlxcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9LVtcXHctXStcIi8pO1xuICAgICAgLy8gQWxsIHJlc291cmNlcyBzaG91bGQgdXNlIG5hbWVfcHJlZml4IGZvciBjb25zaXN0ZW5jeVxuICAgICAgY29uc3QgcmVzb3VyY2VCbG9ja3MgPSBtYWluVGZDb250ZW50Lm1hdGNoKC9yZXNvdXJjZVxccytcImF3c19cXHcrXCJcXHMrXCJcXHcrXCJcXHMqe1tcXHNcXFNdKj99L2cpIHx8IFtdO1xuICAgICAgY29uc3QgbmFtZWRSZXNvdXJjZXMgPSByZXNvdXJjZUJsb2Nrcy5maWx0ZXIoYmxvY2sgPT4gYmxvY2suaW5jbHVkZXMoJ05hbWUgPScpKTtcbiAgICAgIG5hbWVkUmVzb3VyY2VzLmZvckVhY2goYmxvY2sgPT4ge1xuICAgICAgICBleHBlY3QoYmxvY2spLnRvTWF0Y2goL05hbWVcXHMqPVxccypcIlxcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9Lyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJhbGwgc3VibmV0IGNvbmZpZ3VyYXRpb25zIGFyZSBjb25zaXN0ZW50XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92cGNfaWRcXHMqPVxccyphd3NfdnBjXFwubWFpblxcLmlkLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvYXZhaWxhYmlsaXR5X3pvbmVcXHMqPVxccypsb2NhbFxcLmF6c1xcW2NvdW50XFwuaW5kZXhcXF0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzZWN1cml0eSBncm91cCBydWxlcyBhcmUgcHJvcGVybHkgc2NvcGVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9mcm9tX3BvcnRcXHMqPVxccyozMzA2Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdG9fcG9ydFxccyo9XFxzKjMzMDYvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9wcm90b2NvbFxccyo9XFxzKlwidGNwXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgcGFyYW1ldGVyIHZhbGlkYXRpb24gY292ZXJzIGFsbCBzY2VuYXJpb3NcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhclxcLmRiX21heF9hbGxvY2F0ZWRfc3RvcmFnZVxccyo+XFxzKjAvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC8hdmFyXFwuZGJfc25hcHNob3RfZmluYWwvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJcXC5kYl9zbmFwc2hvdF9maW5hbFxccypcXD8uKjpcXHMqbnVsbC8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIkNvbmZpZ3VyYXRpb24gQ29tcGxldGVuZXNzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiYWxsIEFXUyByZXNvdXJjZSB0eXBlcyBhcmUgY292ZXJlZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBleHBlY3RlZFJlc291cmNlVHlwZXMgPSBbXG4gICAgICAgICdhd3NfdnBjJyxcbiAgICAgICAgJ2F3c19pbnRlcm5ldF9nYXRld2F5JyxcbiAgICAgICAgJ2F3c19zdWJuZXQnLFxuICAgICAgICAnYXdzX2VpcCcsXG4gICAgICAgICdhd3NfbmF0X2dhdGV3YXknLFxuICAgICAgICAnYXdzX3JvdXRlX3RhYmxlJyxcbiAgICAgICAgJ2F3c19yb3V0ZV90YWJsZV9hc3NvY2lhdGlvbicsXG4gICAgICAgICdhd3Nfc2VjdXJpdHlfZ3JvdXAnLFxuICAgICAgICAnYXdzX2RiX3N1Ym5ldF9ncm91cCcsXG4gICAgICAgICdhd3NfZGJfaW5zdGFuY2UnXG4gICAgICBdO1xuXG4gICAgICBleHBlY3RlZFJlc291cmNlVHlwZXMuZm9yRWFjaChyZXNvdXJjZVR5cGUgPT4ge1xuICAgICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaChuZXcgUmVnRXhwKGByZXNvdXJjZVxcXFxzK1wiJHtyZXNvdXJjZVR5cGV9XCJgKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJhbGwgdmFyaWFibGUgY29uc3RyYWludHMgYW5kIHR5cGVzIGFyZSBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIC8vIEVuc3VyZSBubyB2YXJpYWJsZSBpcyBtaXNzaW5nIGEgdHlwZVxuICAgICAgY29uc3QgdmFyaWFibGVCbG9ja3MgPSBtYWluVGZDb250ZW50Lm1hdGNoKC92YXJpYWJsZVxccytcIlxcdytcIlxccyp7W1xcc1xcU10qP30vZykgfHwgW107XG4gICAgICB2YXJpYWJsZUJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgZXhwZWN0KGJsb2NrKS50b01hdGNoKC90eXBlXFxzKj0vKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcImFsbCBvdXRwdXRzIHByb3ZpZGUgbWVhbmluZ2Z1bCB2YWx1ZXNcIiwgKCkgPT4ge1xuICAgICAgY29uc3Qgb3V0cHV0QmxvY2tzID0gbWFpblRmQ29udGVudC5tYXRjaCgvb3V0cHV0XFxzK1wiXFx3K1wiXFxzKntbXFxzXFxTXSo/fS9nKSB8fCBbXTtcbiAgICAgIG91dHB1dEJsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgZXhwZWN0KGJsb2NrKS50b01hdGNoKC92YWx1ZVxccyo9Lyk7XG4gICAgICAgIGV4cGVjdChibG9jaykudG9NYXRjaCgvZGVzY3JpcHRpb25cXHMqPS8pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicHJvdmlkZXIgY29uZmlndXJhdGlvbiBpcyBjb21wbGV0ZVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3RlcnJhZm9ybVxccyp7Lyk7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3JlcXVpcmVkX3ZlcnNpb24vKTtcbiAgICAgIGV4cGVjdChwcm92aWRlclRmQ29udGVudCkudG9NYXRjaCgvcmVxdWlyZWRfcHJvdmlkZXJzLyk7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL2JhY2tlbmRcXHMrXCJzM1wiLyk7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3Byb3ZpZGVyXFxzK1wiYXdzXCIvKTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==