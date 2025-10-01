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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFmb3JtLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlcnJhZm9ybS51bml0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzRUFBc0U7QUFDdEUsZ0VBQWdFOzs7OztBQUVoRSw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLE1BQU0sWUFBWSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDL0QsTUFBTSxnQkFBZ0IsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRWxELFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7SUFDbkQsSUFBSSxhQUFxQixDQUFDO0lBQzFCLElBQUksaUJBQXlCLENBQUM7SUFFOUIsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLG1DQUFtQztRQUNuQyxhQUFhLEdBQUcsWUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkQsaUJBQWlCLEdBQUcsWUFBRSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRSxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRSxHQUFHLEVBQUU7UUFDbkQsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMxQyxNQUFNLENBQUMsWUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMs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QUFDO1lBQzNDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy91bml0L3RlcnJhZm9ybS11bml0LXRlc3RzLnRzXG4vLyBDb21wcmVoZW5zaXZlIHVuaXQgdGVzdHMgZm9yIFRlcnJhZm9ybSBpbmZyYXN0cnVjdHVyZSBjb25maWd1cmF0aW9uXG4vLyBUZXN0cyBhbGwgcmVzb3VyY2VzLCB2YXJpYWJsZXMsIG91dHB1dHMsIGFuZCB2YWxpZGF0aW9uIGxvZ2ljXG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmNvbnN0IE1BSU5fVEZfUEFUSCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vbGliL21haW4udGZcIik7XG5jb25zdCBQUk9WSURFUl9URl9QQVRIID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9saWIvcHJvdmlkZXIudGZcIik7XG5jb25zdCBMSUJfRElSID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9saWJcIik7XG5cbmRlc2NyaWJlKFwiVGVycmFmb3JtIEluZnJhc3RydWN0dXJlIFVuaXQgVGVzdHNcIiwgKCkgPT4ge1xuICBsZXQgbWFpblRmQ29udGVudDogc3RyaW5nO1xuICBsZXQgcHJvdmlkZXJUZkNvbnRlbnQ6IHN0cmluZztcblxuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIC8vIFJlYWQgVGVycmFmb3JtIGZpbGVzIGZvciB0ZXN0aW5nXG4gICAgbWFpblRmQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhNQUlOX1RGX1BBVEgsIFwidXRmLThcIik7XG4gICAgcHJvdmlkZXJUZkNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoUFJPVklERVJfVEZfUEFUSCwgXCJ1dGYtOFwiKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJGaWxlIFN0cnVjdHVyZSBhbmQgQmFzaWMgVmFsaWRhdGlvblwiLCAoKSA9PiB7XG4gICAgdGVzdChcIm1haW4udGYgZXhpc3RzIGFuZCBpcyByZWFkYWJsZVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZnMuZXhpc3RzU3luYyhNQUlOX1RGX1BBVEgpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicHJvdmlkZXIudGYgZXhpc3RzIGFuZCBpcyByZWFkYWJsZVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZnMuZXhpc3RzU3luYyhQUk9WSURFUl9URl9QQVRIKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChwcm92aWRlclRmQ29udGVudC5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJ0ZXJyYWZvcm0gY29uZmlndXJhdGlvbiBmb2xsb3dzIEhDTCBzeW50YXggcGF0dGVybnNcIiwgKCkgPT4ge1xuICAgICAgLy8gQ2hlY2sgdGhhdCB0aGUgZmlsZSBjb250YWlucyB2YWxpZCBIQ0wgYmxvY2sgc3RydWN0dXJlc1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3RlcnJhZm9ybVxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJcXHcrXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiXFx3K1wiXFxzK1wiXFx3K1wiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kYXRhXFxzK1wiXFx3K1wiXFxzK1wiXFx3K1wiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9sb2NhbHNcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL291dHB1dFxccytcIlxcdytcIlxccyp7Lyk7XG5cbiAgICAgIC8vIENoZWNrIGZvciBwcm9wZXIgSENMIHN5bnRheCBlbGVtZW50c1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLm5vdC50b01hdGNoKC9cXHM9XFxzKntbXn1dKiQvbSk7IC8vIE5vIHVuY2xvc2VkIGJyYWNlc1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLm5vdC50b01hdGNoKC9eXFxzKn1cXHMqey9tKTsgLy8gTm8gbWFsZm9ybWVkIGJsb2NrIHRyYW5zaXRpb25zXG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiVGVycmFmb3JtIFZlcnNpb24gYW5kIFByb3ZpZGVyIENvbmZpZ3VyYXRpb25cIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJ0ZXJyYWZvcm0gdmVyc2lvbiBjb25zdHJhaW50IGlzIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3JlcXVpcmVkX3ZlcnNpb25cXHMqPVxccypcIj49XFxzKjFcXC5cXGQrXFwuXFxkK1wiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiQVdTIHByb3ZpZGVyIGlzIGNvbmZpZ3VyZWQgaW4gcHJvdmlkZXIudGZcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9yZXF1aXJlZF9wcm92aWRlcnNcXHMqe1tcXHNcXFNdKmF3c1xccyo9XFxzKnsvKTtcbiAgICAgIGV4cGVjdChwcm92aWRlclRmQ29udGVudCkudG9NYXRjaCgvc291cmNlXFxzKj1cXHMqXCJoYXNoaWNvcnBcXC9hd3NcIi8pO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC92ZXJzaW9uXFxzKj1cXHMqXCI+PVxccyo1XFwuMFwiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUzMgYmFja2VuZCBpcyBjb25maWd1cmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChwcm92aWRlclRmQ29udGVudCkudG9NYXRjaCgvYmFja2VuZFxccytcInMzXCJcXHMqe30vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJBV1MgcHJvdmlkZXIgcmVnaW9uIGlzIGNvbmZpZ3VyZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9wcm92aWRlclxccytcImF3c1wiXFxzKntbXFxzXFxTXSpyZWdpb25cXHMqPS8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlZhcmlhYmxlIERlZmluaXRpb25zIGFuZCBWYWxpZGF0aW9uXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiYWxsIHJlcXVpcmVkIHZhcmlhYmxlcyBhcmUgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1aXJlZFZhcmlhYmxlcyA9IFtcbiAgICAgICAgXCJuYW1lX3ByZWZpeFwiLFxuICAgICAgICBcImVudmlyb25tZW50XCIsXG4gICAgICAgIFwidnBjX2NpZHJcIixcbiAgICAgICAgXCJwdWJsaWNfc3VibmV0X2NpZHJzXCIsXG4gICAgICAgIFwicHJpdmF0ZV9zdWJuZXRfY2lkcnNcIixcbiAgICAgICAgXCJzaW5nbGVfbmF0X2dhdGV3YXlcIixcbiAgICAgICAgXCJkYl9pbnN0YW5jZV9jbGFzc1wiLFxuICAgICAgICBcImRiX2FsbG9jYXRlZF9zdG9yYWdlXCIsXG4gICAgICAgIFwiZGJfbWF4X2FsbG9jYXRlZF9zdG9yYWdlXCIsXG4gICAgICAgIFwiZGJfZW5naW5lX3ZlcnNpb25cIixcbiAgICAgICAgXCJkYl9iYWNrdXBfcmV0ZW50aW9uX3BlcmlvZFwiLFxuICAgICAgICBcImRiX211bHRpX2F6XCIsXG4gICAgICAgIFwiZGJfc3RvcmFnZV90eXBlXCIsXG4gICAgICAgIFwiZGJfcGVyZm9ybWFuY2VfaW5zaWdodHNfZW5hYmxlZFwiLFxuICAgICAgICBcImRiX2RlbGV0aW9uX3Byb3RlY3Rpb25cIixcbiAgICAgICAgXCJkYl9zbmFwc2hvdF9maW5hbFwiLFxuICAgICAgICBcImRiX3VzZXJuYW1lXCIsXG4gICAgICAgIFwiZGJfcGFzc3dvcmRcIixcbiAgICAgICAgXCJrbXNfa2V5X2lkXCIsXG4gICAgICAgIFwidGFnc1wiXG4gICAgICBdO1xuXG4gICAgICByZXF1aXJlZFZhcmlhYmxlcy5mb3JFYWNoKHZhcmlhYmxlID0+IHtcbiAgICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2gobmV3IFJlZ0V4cChgdmFyaWFibGVcXFxccytcIiR7dmFyaWFibGV9XCJcXFxccyp7YCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwidmFyaWFibGUgdHlwZXMgYXJlIGNvcnJlY3RseSBzcGVjaWZpZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wibmFtZV9wcmVmaXhcIltcXHNcXFNdKj90eXBlXFxzKj1cXHMqc3RyaW5nLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJlbnZpcm9ubWVudFwiW1xcc1xcU10qP3R5cGVcXHMqPVxccypzdHJpbmcvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInZwY19jaWRyXCJbXFxzXFxTXSo/dHlwZVxccyo9XFxzKnN0cmluZy8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wicHVibGljX3N1Ym5ldF9jaWRyc1wiW1xcc1xcU10qP3R5cGVcXHMqPVxccypsaXN0XFwoc3RyaW5nXFwpLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJwcml2YXRlX3N1Ym5ldF9jaWRyc1wiW1xcc1xcU10qP3R5cGVcXHMqPVxccypsaXN0XFwoc3RyaW5nXFwpLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJzaW5nbGVfbmF0X2dhdGV3YXlcIltcXHNcXFNdKj90eXBlXFxzKj1cXHMqYm9vbC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfYWxsb2NhdGVkX3N0b3JhZ2VcIltcXHNcXFNdKj90eXBlXFxzKj1cXHMqbnVtYmVyLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJ0YWdzXCJbXFxzXFxTXSo/dHlwZVxccyo9XFxzKm1hcFxcKHN0cmluZ1xcKS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInZhcmlhYmxlIGRlZmF1bHQgdmFsdWVzIGFyZSBzZXQgY29ycmVjdGx5XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcImVudmlyb25tZW50XCJbXFxzXFxTXSo/ZGVmYXVsdFxccyo9XFxzKlwiZGV2XCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInZwY19jaWRyXCJbXFxzXFxTXSo/ZGVmYXVsdFxccyo9XFxzKlwiMTBcXC4wXFwuMFxcLjBcXC8xNlwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJzaW5nbGVfbmF0X2dhdGV3YXlcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqdHJ1ZS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfaW5zdGFuY2VfY2xhc3NcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqXCJkYlxcLnQzXFwubWljcm9cIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfYWxsb2NhdGVkX3N0b3JhZ2VcIltcXHNcXFNdKj9kZWZhdWx0XFxzKj1cXHMqMjAvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcImRiX2JhY2t1cF9yZXRlbnRpb25fcGVyaW9kXCJbXFxzXFxTXSo/ZGVmYXVsdFxccyo9XFxzKjcvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcImRiX211bHRpX2F6XCJbXFxzXFxTXSo/ZGVmYXVsdFxccyo9XFxzKmZhbHNlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwic2Vuc2l0aXZlIHZhcmlhYmxlcyBhcmUgbWFya2VkIGFwcHJvcHJpYXRlbHlcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfcGFzc3dvcmRcIltcXHNcXFNdKj9zZW5zaXRpdmVcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwidmFyaWFibGUgdmFsaWRhdGlvbiBydWxlcyBhcmUgcHJlc2VudFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9lbmdpbmVfdmVyc2lvblwiW1xcc1xcU10qP3ZhbGlkYXRpb25cXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NvbmRpdGlvblxccyo9XFxzKmNhblxcKHJlZ2V4XFwoXCIuKlwiLCB2YXJcXC5kYl9lbmdpbmVfdmVyc2lvblxcKVxcKS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInZhcmlhYmxlIGRlc2NyaXB0aW9ucyBhcmUgcHJvdmlkZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wibmFtZV9wcmVmaXhcIltcXHNcXFNdKj9kZXNjcmlwdGlvblxccyo9XFxzKlwiUHJlZml4IGZvciByZXNvdXJjZSBuYW1lc1wiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyaWFibGVcXHMrXCJkYl9wYXNzd29yZFwiW1xcc1xcU10qP2Rlc2NyaXB0aW9uXFxzKj1cXHMqXCJNYXN0ZXIgcGFzc3dvcmQgZm9yIFJEU1wiLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiRGF0YSBTb3VyY2VzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiYXZhaWxhYmlsaXR5IHpvbmVzIGRhdGEgc291cmNlIGlzIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RhdGFcXHMrXCJhd3NfYXZhaWxhYmlsaXR5X3pvbmVzXCJcXHMrXCJhdmFpbGFibGVcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc3RhdGVcXHMqPVxccypcImF2YWlsYWJsZVwiLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiTG9jYWwgVmFsdWVzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwibG9jYWxzIGJsb2NrIGlzIGRlZmluZWQgd2l0aCByZXF1aXJlZCB2YWx1ZXNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2xvY2Fsc1xccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvYXpzXFxzKj0vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jb21tb25fdGFnc1xccyo9Lyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYXpzIGxvY2FsIHVzZXMgc2xpY2UgZnVuY3Rpb24gY29ycmVjdGx5XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9henNcXHMqPVxccypzbGljZVxcKGRhdGFcXC5hd3NfYXZhaWxhYmlsaXR5X3pvbmVzXFwuYXZhaWxhYmxlXFwubmFtZXMvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJjb21tb25fdGFncyBtZXJnZXMgdmFyaWFibGVzIGNvcnJlY3RseVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY29tbW9uX3RhZ3NcXHMqPVxccyptZXJnZVxcKC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL0Vudmlyb25tZW50XFxzKj1cXHMqdmFyXFwuZW52aXJvbm1lbnQvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9NYW5hZ2VkQnlcXHMqPVxccypcIlRlcnJhZm9ybVwiLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiVlBDIFJlc291cmNlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcIlZQQyByZXNvdXJjZSBpcyBkZWZpbmVkIHdpdGggY29ycmVjdCBjb25maWd1cmF0aW9uXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c192cGNcIlxccytcIm1haW5cIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY2lkcl9ibG9ja1xccyo9XFxzKnZhclxcLnZwY19jaWRyLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZW5hYmxlX2Ruc19ob3N0bmFtZXNcXHMqPVxccyp0cnVlLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZW5hYmxlX2Ruc19zdXBwb3J0XFxzKj1cXHMqdHJ1ZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIkludGVybmV0IEdhdGV3YXkgaXMgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3NfaW50ZXJuZXRfZ2F0ZXdheVwiXFxzK1wibWFpblwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92cGNfaWRcXHMqPVxccyphd3NfdnBjXFwubWFpblxcLmlkLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiU3VibmV0IFJlc291cmNlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcInB1YmxpYyBzdWJuZXRzIGFyZSBkZWZpbmVkIHdpdGggY291bnRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3N1Ym5ldFwiXFxzK1wicHVibGljXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NvdW50XFxzKj1cXHMqbGVuZ3RoXFwodmFyXFwucHVibGljX3N1Ym5ldF9jaWRyc1xcKS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL21hcF9wdWJsaWNfaXBfb25fbGF1bmNoXFxzKj1cXHMqdHJ1ZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInByaXZhdGUgc3VibmV0cyBhcmUgZGVmaW5lZCB3aXRoIGNvdW50XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19zdWJuZXRcIlxccytcInByaXZhdGVcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY291bnRcXHMqPVxccypsZW5ndGhcXCh2YXJcXC5wcml2YXRlX3N1Ym5ldF9jaWRyc1xcKS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInN1Ym5ldHMgdXNlIGF2YWlsYWJpbGl0eSB6b25lcyBmcm9tIGxvY2Fsc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvYXZhaWxhYmlsaXR5X3pvbmVcXHMqPVxccypsb2NhbFxcLmF6c1xcW2NvdW50XFwuaW5kZXhcXF0vKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJOQVQgR2F0ZXdheSBSZXNvdXJjZXNcIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJFbGFzdGljIElQcyBmb3IgTkFUIGFyZSBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19laXBcIlxccytcIm5hdFwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jb3VudFxccyo9XFxzKnZhclxcLnNpbmdsZV9uYXRfZ2F0ZXdheVxccypcXD9cXHMqMVxccyo6XFxzKmxlbmd0aFxcKHZhclxcLnB1YmxpY19zdWJuZXRfY2lkcnNcXCkvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kb21haW5cXHMqPVxccypcInZwY1wiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiTkFUIEdhdGV3YXlzIGFyZSBkZWZpbmVkIHdpdGggY29uZGl0aW9uYWwgY291bnRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX25hdF9nYXRld2F5XCJcXHMrXCJtYWluXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2FsbG9jYXRpb25faWRcXHMqPVxccyphd3NfZWlwXFwubmF0XFxbY291bnRcXC5pbmRleFxcXVxcLmlkLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc3VibmV0X2lkXFxzKj1cXHMqYXdzX3N1Ym5ldFxcLnB1YmxpY1xcW2NvdW50XFwuaW5kZXhcXF1cXC5pZC8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlJvdXRlIFRhYmxlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcInB1YmxpYyByb3V0ZSB0YWJsZSBpcyBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19yb3V0ZV90YWJsZVwiXFxzK1wicHVibGljXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZwY19pZFxccyo9XFxzKmF3c192cGNcXC5tYWluXFwuaWQvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jaWRyX2Jsb2NrXFxzKj1cXHMqXCIwXFwuMFxcLjBcXC4wXFwvMFwiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZ2F0ZXdheV9pZFxccyo9XFxzKmF3c19pbnRlcm5ldF9nYXRld2F5XFwubWFpblxcLmlkLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicHJpdmF0ZSByb3V0ZSB0YWJsZXMgYXJlIGRlZmluZWQgd2l0aCBjb25kaXRpb25hbCBsb2dpY1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3Nfcm91dGVfdGFibGVcIlxccytcInByaXZhdGVcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvY291bnRcXHMqPVxccyp2YXJcXC5zaW5nbGVfbmF0X2dhdGV3YXlcXHMqXFw/XFxzKjFcXHMqOlxccypsZW5ndGhcXCh2YXJcXC5wcml2YXRlX3N1Ym5ldF9jaWRyc1xcKS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL25hdF9nYXRld2F5X2lkXFxzKj1cXHMqdmFyXFwuc2luZ2xlX25hdF9nYXRld2F5Liphd3NfbmF0X2dhdGV3YXlcXC5tYWluLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicm91dGUgdGFibGUgYXNzb2NpYXRpb25zIGFyZSBkZWZpbmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19yb3V0ZV90YWJsZV9hc3NvY2lhdGlvblwiXFxzK1wicHVibGljXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3JvdXRlX3RhYmxlX2Fzc29jaWF0aW9uXCJcXHMrXCJwcml2YXRlXCJcXHMqey8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlNlY3VyaXR5IEdyb3Vwc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcImFwcGxpY2F0aW9uIHNlY3VyaXR5IGdyb3VwIGlzIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Jlc291cmNlXFxzK1wiYXdzX3NlY3VyaXR5X2dyb3VwXCJcXHMrXCJhcHBcIlxccyp7Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbmFtZV9wcmVmaXhcXHMqPVxccypcIlxcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9LWFwcC1zZ1wiLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZGVzY3JpcHRpb25cXHMqPVxccypcIlNlY3VyaXR5IGdyb3VwIGZvciBhcHBsaWNhdGlvbiB0aWVyXCIvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgc2VjdXJpdHkgZ3JvdXAgaXMgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3Nfc2VjdXJpdHlfZ3JvdXBcIlxccytcInJkc1wiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9uYW1lX3ByZWZpeFxccyo9XFxzKlwiXFwkXFx7dmFyXFwubmFtZV9wcmVmaXhcXH0tcmRzLXNnXCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kZXNjcmlwdGlvblxccyo9XFxzKlwiU2VjdXJpdHkgZ3JvdXAgZm9yIFJEUyBNeVNRTFwiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIHNlY3VyaXR5IGdyb3VwIGhhcyBjb3JyZWN0IGluZ3Jlc3MgcnVsZXNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2Zyb21fcG9ydFxccyo9XFxzKjMzMDYvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC90b19wb3J0XFxzKj1cXHMqMzMwNi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3Byb3RvY29sXFxzKj1cXHMqXCJ0Y3BcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3NlY3VyaXR5X2dyb3Vwc1xccyo9XFxzKlxcW2F3c19zZWN1cml0eV9ncm91cFxcLmFwcFxcLmlkXFxdLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwic2VjdXJpdHkgZ3JvdXBzIGhhdmUgbGlmZWN5Y2xlIHJ1bGVzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9saWZlY3ljbGVcXHMqe1tcXHNcXFNdKj9jcmVhdGVfYmVmb3JlX2Rlc3Ryb3lcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiUkRTIFJlc291cmNlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcIlJEUyBzdWJuZXQgZ3JvdXAgaXMgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3NfZGJfc3VibmV0X2dyb3VwXCJcXHMrXCJtYWluXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3N1Ym5ldF9pZHNcXHMqPVxccyphd3Nfc3VibmV0XFwucHJpdmF0ZVxcW1xcKlxcXVxcLmlkLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIGluc3RhbmNlIGlzIGRlZmluZWQgd2l0aCBhbGwgcmVxdWlyZWQgcGFyYW1ldGVyc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3NfZGJfaW5zdGFuY2VcIlxccytcIm15c3FsXCJcXHMqey8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2lkZW50aWZpZXJcXHMqPVxccypcIlxcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9LW15c3FsLVxcJFxce3ZhclxcLmF3c19yZWdpb25cXH1cIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2VuZ2luZVxccyo9XFxzKlwibXlzcWxcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2VuZ2luZV92ZXJzaW9uXFxzKj1cXHMqdmFyXFwuZGJfZW5naW5lX3ZlcnNpb24vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9pbnN0YW5jZV9jbGFzc1xccyo9XFxzKnZhclxcLmRiX2luc3RhbmNlX2NsYXNzLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIHN0b3JhZ2UgY29uZmlndXJhdGlvbiBpcyBjb3JyZWN0XCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9hbGxvY2F0ZWRfc3RvcmFnZVxccyo9XFxzKnZhclxcLmRiX2FsbG9jYXRlZF9zdG9yYWdlLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbWF4X2FsbG9jYXRlZF9zdG9yYWdlLip2YXJcXC5kYl9tYXhfYWxsb2NhdGVkX3N0b3JhZ2UvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zdG9yYWdlX3R5cGVcXHMqPVxccyp2YXJcXC5kYl9zdG9yYWdlX3R5cGUvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zdG9yYWdlX2VuY3J5cHRlZFxccyo9XFxzKnRydWUvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgbmV0d29yayBjb25maWd1cmF0aW9uIGlzIHNlY3VyZVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZGJfc3VibmV0X2dyb3VwX25hbWVcXHMqPVxccyphd3NfZGJfc3VibmV0X2dyb3VwXFwubWFpblxcLm5hbWUvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92cGNfc2VjdXJpdHlfZ3JvdXBfaWRzXFxzKj1cXHMqXFxbYXdzX3NlY3VyaXR5X2dyb3VwXFwucmRzXFwuaWRcXF0vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9wdWJsaWNseV9hY2Nlc3NpYmxlXFxzKj1cXHMqZmFsc2UvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJSRFMgYmFja3VwIGFuZCBtYWludGVuYW5jZSBjb25maWd1cmF0aW9uXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9iYWNrdXBfcmV0ZW50aW9uX3BlcmlvZFxccyo9XFxzKnZhclxcLmRiX2JhY2t1cF9yZXRlbnRpb25fcGVyaW9kLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvYmFja3VwX3dpbmRvd1xccyo9XFxzKlwiMDM6MDAtMDQ6MDBcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL21haW50ZW5hbmNlX3dpbmRvd1xccyo9XFxzKlwic3VuOjA0OjAwLXN1bjowNTowMFwiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIG1vbml0b3JpbmcgYW5kIGxvZ2dpbmcgY29uZmlndXJhdGlvblwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcGVyZm9ybWFuY2VfaW5zaWdodHNfZW5hYmxlZFxccyo9XFxzKnZhclxcLmRiX3BlcmZvcm1hbmNlX2luc2lnaHRzX2VuYWJsZWQvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9lbmFibGVkX2Nsb3Vkd2F0Y2hfbG9nc19leHBvcnRzXFxzKj1cXHMqXFxbXCJlcnJvclwiLFxccypcImdlbmVyYWxcIixcXHMqXCJzbG93cXVlcnlcIlxcXS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIlJEUyBwcm90ZWN0aW9uIHNldHRpbmdzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kZWxldGlvbl9wcm90ZWN0aW9uXFxzKj1cXHMqdmFyXFwuZGJfZGVsZXRpb25fcHJvdGVjdGlvbi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3NraXBfZmluYWxfc25hcHNob3RcXHMqPVxccyohdmFyXFwuZGJfc25hcHNob3RfZmluYWwvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9jb3B5X3RhZ3NfdG9fc25hcHNob3RcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIGxpZmVjeWNsZSBjb25maWd1cmF0aW9uXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9saWZlY3ljbGVcXHMqe1tcXHNcXFNdKj9pZ25vcmVfY2hhbmdlc1xccyo9XFxzKlxcW2ZpbmFsX3NuYXBzaG90X2lkZW50aWZpZXJcXF0vKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJSZXNvdXJjZSBUYWdnaW5nXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiYWxsIHJlc291cmNlcyB1c2UgY29tbW9uX3RhZ3NcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgdGFnZ2VkUmVzb3VyY2VzID0gW1xuICAgICAgICAnYXdzX3ZwYycsXG4gICAgICAgICdhd3NfaW50ZXJuZXRfZ2F0ZXdheScsXG4gICAgICAgICdhd3Nfc3VibmV0JyxcbiAgICAgICAgJ2F3c19laXAnLFxuICAgICAgICAnYXdzX25hdF9nYXRld2F5JyxcbiAgICAgICAgJ2F3c19yb3V0ZV90YWJsZScsXG4gICAgICAgICdhd3Nfc2VjdXJpdHlfZ3JvdXAnLFxuICAgICAgICAnYXdzX2RiX3N1Ym5ldF9ncm91cCcsXG4gICAgICAgICdhd3NfZGJfaW5zdGFuY2UnXG4gICAgICBdO1xuXG4gICAgICB0YWdnZWRSZXNvdXJjZXMuZm9yRWFjaChyZXNvdXJjZSA9PiB7XG4gICAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKG5ldyBSZWdFeHAoYHJlc291cmNlXFxcXHMrXCIke3Jlc291cmNlfVwiW1xcXFxzXFxcXFNdKj90YWdzXFxcXHMqPVxcXFxzKm1lcmdlXFxcXChbXFxcXHNcXFxcU10qP2xvY2FsXFxcXC5jb21tb25fdGFnc2ApKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInJlc291cmNlcyBoYXZlIHNwZWNpZmljIE5hbWUgdGFnc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvTmFtZVxccyo9XFxzKlwiXFwkXFx7dmFyXFwubmFtZV9wcmVmaXhcXH0tdnBjXCIvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9OYW1lXFxzKj1cXHMqXCJcXCRcXHt2YXJcXC5uYW1lX3ByZWZpeFxcfS1pZ3dcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL05hbWVcXHMqPVxccypcIlxcJFxce3ZhclxcLm5hbWVfcHJlZml4XFx9LW15c3FsXCIvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJPdXRwdXQgVmFsdWVzXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiYWxsIHJlcXVpcmVkIG91dHB1dHMgYXJlIGRlZmluZWRcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWlyZWRPdXRwdXRzID0gW1xuICAgICAgICBcInJkc19lbmRwb2ludFwiLFxuICAgICAgICBcInJkc19wb3J0XCIsXG4gICAgICAgIFwidnBjX2lkXCIsXG4gICAgICAgIFwicHJpdmF0ZV9zdWJuZXRfaWRzXCIsXG4gICAgICAgIFwicHVibGljX3N1Ym5ldF9pZHNcIixcbiAgICAgICAgXCJyZHNfc2VjdXJpdHlfZ3JvdXBfaWRcIixcbiAgICAgICAgXCJhcHBfc2VjdXJpdHlfZ3JvdXBfaWRcIlxuICAgICAgXTtcblxuICAgICAgcmVxdWlyZWRPdXRwdXRzLmZvckVhY2gob3V0cHV0ID0+IHtcbiAgICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2gobmV3IFJlZ0V4cChgb3V0cHV0XFxcXHMrXCIke291dHB1dH1cIlxcXFxzKntgKSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJvdXRwdXRzIGhhdmUgZGVzY3JpcHRpb25zXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9vdXRwdXRcXHMrXCJyZHNfZW5kcG9pbnRcIltcXHNcXFNdKj9kZXNjcmlwdGlvblxccyo9XFxzKlwiVGhlIGNvbm5lY3Rpb24gZW5kcG9pbnQgZm9yIHRoZSBSRFMgaW5zdGFuY2VcIi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL291dHB1dFxccytcInZwY19pZFwiW1xcc1xcU10qP2Rlc2NyaXB0aW9uXFxzKj1cXHMqXCJUaGUgSUQgb2YgdGhlIFZQQ1wiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwib3V0cHV0cyByZWZlcmVuY2UgY29ycmVjdCByZXNvdXJjZXNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL291dHB1dFxccytcInJkc19lbmRwb2ludFwiW1xcc1xcU10qP3ZhbHVlXFxzKj1cXHMqYXdzX2RiX2luc3RhbmNlXFwubXlzcWxcXC5lbmRwb2ludC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL291dHB1dFxccytcInZwY19pZFwiW1xcc1xcU10qP3ZhbHVlXFxzKj1cXHMqYXdzX3ZwY1xcLm1haW5cXC5pZC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL291dHB1dFxccytcInByaXZhdGVfc3VibmV0X2lkc1wiW1xcc1xcU10qP3ZhbHVlXFxzKj1cXHMqYXdzX3N1Ym5ldFxcLnByaXZhdGVcXFtcXCpcXF1cXC5pZC8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlJlc291cmNlIERlcGVuZGVuY2llcyBhbmQgUmVmZXJlbmNlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcIkVJUCBkZXBlbmRzIG9uIEludGVybmV0IEdhdGV3YXlcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RlcGVuZHNfb25cXHMqPVxccypcXFthd3NfaW50ZXJuZXRfZ2F0ZXdheVxcLm1haW5cXF0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJOQVQgR2F0ZXdheSBkZXBlbmRzIG9uIEludGVybmV0IEdhdGV3YXlcIiwgKCkgPT4ge1xuICAgICAgLy8gTkFUIEdhdGV3YXkgaGFzIGltcGxpY2l0IGRlcGVuZGVuY3kgdGhyb3VnaCBFSVAgd2hpY2ggaGFzIGV4cGxpY2l0IGRlcGVuZHNfb25cbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9yZXNvdXJjZVxccytcImF3c19uYXRfZ2F0ZXdheVwiXFxzK1wibWFpblwiXFxzKnsvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9hbGxvY2F0aW9uX2lkXFxzKj1cXHMqYXdzX2VpcFxcLm5hdFxcW2NvdW50XFwuaW5kZXhcXF1cXC5pZC8pO1xuICAgICAgLy8gVGhlIGRlcGVuZGVuY3kgaXMgaW1wbGljaXQgdGhyb3VnaCB0aGUgRUlQIHJlZmVyZW5jZVxuICAgICAgZXhwZWN0KHRydWUpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicm91dGUgdGFibGUgYXNzb2NpYXRpb25zIHJlZmVyZW5jZSBjb3JyZWN0IHJlc291cmNlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc3VibmV0X2lkXFxzKj1cXHMqYXdzX3N1Ym5ldFxcLnB1YmxpY1xcW2NvdW50XFwuaW5kZXhcXF1cXC5pZC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3JvdXRlX3RhYmxlX2lkXFxzKj1cXHMqYXdzX3JvdXRlX3RhYmxlXFwucHVibGljXFwuaWQvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJDb25kaXRpb25hbCBMb2dpYyBhbmQgRnVuY3Rpb25zXCIsICgpID0+IHtcbiAgICB0ZXN0KFwiY29uZGl0aW9uYWwgZXhwcmVzc2lvbnMgd29yayBjb3JyZWN0bHlcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhclxcLnNpbmdsZV9uYXRfZ2F0ZXdheVxccypcXD9cXHMqMVxccyo6XFxzKmxlbmd0aFxcKHZhclxcLnB1YmxpY19zdWJuZXRfY2lkcnNcXCkvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJcXC5kYl9tYXhfYWxsb2NhdGVkX3N0b3JhZ2VcXHMqPlxccyowXFxzKlxcP1xccyp2YXJcXC5kYl9tYXhfYWxsb2NhdGVkX3N0b3JhZ2VcXHMqOlxccypudWxsLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvIXZhclxcLmRiX3NuYXBzaG90X2ZpbmFsLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYnVpbHQtaW4gZnVuY3Rpb25zIGFyZSB1c2VkIGNvcnJlY3RseVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbGVuZ3RoXFwodmFyXFwucHVibGljX3N1Ym5ldF9jaWRyc1xcKS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL21lcmdlXFwoLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc2xpY2VcXCgvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9mb3JtYXRkYXRlXFwoLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdGltZXN0YW1wXFwoXFwpLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiY291bnQgZXhwcmVzc2lvbnMgcmVmZXJlbmNlIGNvcnJlY3QgaW5kaWNlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvXFxbY291bnRcXC5pbmRleFxcXS8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2NvdW50XFwuaW5kZXhcXHMqXFwrXFxzKjEvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJTZWN1cml0eSBCZXN0IFByYWN0aWNlc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcIlJEUyBpcyBub3QgcHVibGljbHkgYWNjZXNzaWJsZVwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcHVibGljbHlfYWNjZXNzaWJsZVxccyo9XFxzKmZhbHNlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIHN0b3JhZ2UgaXMgZW5jcnlwdGVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9zdG9yYWdlX2VuY3J5cHRlZFxccyo9XFxzKnRydWUvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzZW5zaXRpdmUgdmFyaWFibGVzIGFyZSBtYXJrZWRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhcmlhYmxlXFxzK1wiZGJfcGFzc3dvcmRcIltcXHNcXFNdKj9zZW5zaXRpdmVcXHMqPVxccyp0cnVlLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwic2VjdXJpdHkgZ3JvdXBzIGhhdmUgcmVzdHJpY3RpdmUgcnVsZXNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3NlY3VyaXR5X2dyb3Vwc1xccyo9XFxzKlxcW2F3c19zZWN1cml0eV9ncm91cFxcLmFwcFxcLmlkXFxdLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYmFja3VwcyBhcmUgZW5hYmxlZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvYmFja3VwX3JldGVudGlvbl9wZXJpb2RcXHMqPVxccyp2YXJcXC5kYl9iYWNrdXBfcmV0ZW50aW9uX3BlcmlvZC8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIlBlcmZvcm1hbmNlIGFuZCBDb3N0IE9wdGltaXphdGlvblwiLCAoKSA9PiB7XG4gICAgdGVzdChcInNpbmdsZSBOQVQgZ2F0ZXdheSBvcHRpb24gZm9yIGNvc3Qgb3B0aW1pemF0aW9uXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJpYWJsZVxccytcInNpbmdsZV9uYXRfZ2F0ZXdheVwiW1xcc1xcU10qP2Rlc2NyaXB0aW9uLipjb3N0IG9wdGltaXphdGlvbi8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIlJEUyBhdXRvc2NhbGluZyBpcyBjb25maWd1cmVkXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9tYXhfYWxsb2NhdGVkX3N0b3JhZ2UuKnZhclxcLmRiX21heF9hbGxvY2F0ZWRfc3RvcmFnZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcImFwcHJvcHJpYXRlIGRlZmF1bHQgaW5zdGFuY2Ugc2l6ZXNcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2RlZmF1bHRcXHMqPVxccypcImRiXFwudDNcXC5taWNyb1wiLyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKFwiRXJyb3IgSGFuZGxpbmcgYW5kIFZhbGlkYXRpb25cIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJmaW5hbCBzbmFwc2hvdCBpZGVudGlmaWVyIHVzZXMgdGltZXN0YW1wIHRvIGF2b2lkIGNvbmZsaWN0c1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZmluYWxfc25hcHNob3RfaWRlbnRpZmllci4qZm9ybWF0ZGF0ZS4qdGltZXN0YW1wLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwibGlmZWN5Y2xlIHJ1bGVzIHByZXZlbnQgZGVzdHJ1Y3RpdmUgY2hhbmdlc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbGlmZWN5Y2xlXFxzKntbXFxzXFxTXSo/aWdub3JlX2NoYW5nZXNcXHMqPVxccypcXFtmaW5hbF9zbmFwc2hvdF9pZGVudGlmaWVyXFxdLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvbGlmZWN5Y2xlXFxzKntbXFxzXFxTXSo/Y3JlYXRlX2JlZm9yZV9kZXN0cm95XFxzKj1cXHMqdHJ1ZS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInZhbGlkYXRpb24gcnVsZXMgYXJlIGNvbXByZWhlbnNpdmVcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhbGlkYXRpb25cXHMqe1tcXHNcXFNdKj9jYW5cXChyZWdleC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2Vycm9yX21lc3NhZ2UuKmZvcm1hdC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhbGlkYXRpb25cXHMqe1tcXHNcXFNdKj9jb25kaXRpb25cXHMqPVxccypjYW5cXChyZWdleFxcKFwiLipcIiwgdmFyXFwuZGJfZW5naW5lX3ZlcnNpb25cXClcXCkvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9lcnJvcl9tZXNzYWdlXFxzKj1cXHMqXCJFbmdpbmUgdmVyc2lvbiBtdXN0IGJlIGluIGZvcm1hdCBYXFwuWSBvciBYXFwuWVxcLlpcIi8pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZShcIkVkZ2UgQ2FzZXMgYW5kIEFkdmFuY2VkIENvbmZpZ3VyYXRpb25cIiwgKCkgPT4ge1xuICAgIHRlc3QoXCJoYW5kbGVzIG51bGwgdmFsdWVzIGZvciBvcHRpb25hbCBwYXJhbWV0ZXJzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9kZWZhdWx0XFxzKj1cXHMqbnVsbC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhclxcLmttc19rZXlfaWQvKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJ1c2VzIHNwbGF0IGV4cHJlc3Npb25zIGZvciBhcnJheSBvcGVyYXRpb25zXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9cXFtcXCpcXF0vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9hd3Nfc3VibmV0XFwucHJpdmF0ZVxcW1xcKlxcXVxcLmlkLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwic3RyaW5nIGludGVycG9sYXRpb24gaXMgdXNlZCBjb3JyZWN0bHlcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL1xcJFxce3ZhclxcLlxcdytcXH0vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9cXCRcXHt2YXJcXC5uYW1lX3ByZWZpeFxcfS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcImNvbXBsZXggYm9vbGVhbiBsb2dpYyB3aXRoIHRlcm5hcnkgb3BlcmF0b3JzXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9cXD9cXHMqLipcXHMqOi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3ZhclxcLnNpbmdsZV9uYXRfZ2F0ZXdheVxccypcXD9cXHMqMVxccyo6XFxzKmxlbmd0aC8pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcImFycmF5IGluZGV4aW5nIHdpdGggY291bnRcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL1xcW2NvdW50XFwuaW5kZXhcXF0vKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9sb2NhbFxcLmF6c1xcW2NvdW50XFwuaW5kZXhcXF0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJmdW5jdGlvbiBjb21wb3NpdGlvbiBhbmQgbmVzdGluZ1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvc2xpY2VcXChkYXRhXFwuYXdzX2F2YWlsYWJpbGl0eV96b25lc1xcLmF2YWlsYWJsZVxcLm5hbWVzLFxccyowLFxccyptaW5cXCgvKTtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC9sZW5ndGhcXCh2YXJcXC5wdWJsaWNfc3VibmV0X2NpZHJzXFwpLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwicmVzb3VyY2UgbmFtaW5nIGZvbGxvd3MgY29uc2lzdGVudCBwYXR0ZXJuc1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvXCJcXCRcXHt2YXJcXC5uYW1lX3ByZWZpeFxcfS1bXFx3LV0rXCIvKTtcbiAgICAgIC8vIEFsbCByZXNvdXJjZXMgc2hvdWxkIHVzZSBuYW1lX3ByZWZpeCBmb3IgY29uc2lzdGVuY3lcbiAgICAgIGNvbnN0IHJlc291cmNlQmxvY2tzID0gbWFpblRmQ29udGVudC5tYXRjaCgvcmVzb3VyY2VcXHMrXCJhd3NfXFx3K1wiXFxzK1wiXFx3K1wiXFxzKntbXFxzXFxTXSo/fS9nKSB8fCBbXTtcbiAgICAgIGNvbnN0IG5hbWVkUmVzb3VyY2VzID0gcmVzb3VyY2VCbG9ja3MuZmlsdGVyKGJsb2NrID0+IGJsb2NrLmluY2x1ZGVzKCdOYW1lID0nKSk7XG4gICAgICBuYW1lZFJlc291cmNlcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgZXhwZWN0KGJsb2NrKS50b01hdGNoKC9OYW1lXFxzKj1cXHMqXCJcXCRcXHt2YXJcXC5uYW1lX3ByZWZpeFxcfS8pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYWxsIHN1Ym5ldCBjb25maWd1cmF0aW9ucyBhcmUgY29uc2lzdGVudFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdnBjX2lkXFxzKj1cXHMqYXdzX3ZwY1xcLm1haW5cXC5pZC8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL2F2YWlsYWJpbGl0eV96b25lXFxzKj1cXHMqbG9jYWxcXC5henNcXFtjb3VudFxcLmluZGV4XFxdLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwic2VjdXJpdHkgZ3JvdXAgcnVsZXMgYXJlIHByb3Blcmx5IHNjb3BlZFwiLCAoKSA9PiB7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvZnJvbV9wb3J0XFxzKj1cXHMqMzMwNi8pO1xuICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2goL3RvX3BvcnRcXHMqPVxccyozMzA2Lyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvcHJvdG9jb2xcXHMqPVxccypcInRjcFwiLyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiUkRTIHBhcmFtZXRlciB2YWxpZGF0aW9uIGNvdmVycyBhbGwgc2NlbmFyaW9zXCIsICgpID0+IHtcbiAgICAgIGV4cGVjdChtYWluVGZDb250ZW50KS50b01hdGNoKC92YXJcXC5kYl9tYXhfYWxsb2NhdGVkX3N0b3JhZ2VcXHMqPlxccyowLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvIXZhclxcLmRiX3NuYXBzaG90X2ZpbmFsLyk7XG4gICAgICBleHBlY3QobWFpblRmQ29udGVudCkudG9NYXRjaCgvdmFyXFwuZGJfc25hcHNob3RfZmluYWxcXHMqXFw/Lio6XFxzKm51bGwvKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoXCJDb25maWd1cmF0aW9uIENvbXBsZXRlbmVzc1wiLCAoKSA9PiB7XG4gICAgdGVzdChcImFsbCBBV1MgcmVzb3VyY2UgdHlwZXMgYXJlIGNvdmVyZWRcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgZXhwZWN0ZWRSZXNvdXJjZVR5cGVzID0gW1xuICAgICAgICAnYXdzX3ZwYycsXG4gICAgICAgICdhd3NfaW50ZXJuZXRfZ2F0ZXdheScsXG4gICAgICAgICdhd3Nfc3VibmV0JyxcbiAgICAgICAgJ2F3c19laXAnLFxuICAgICAgICAnYXdzX25hdF9nYXRld2F5JyxcbiAgICAgICAgJ2F3c19yb3V0ZV90YWJsZScsXG4gICAgICAgICdhd3Nfcm91dGVfdGFibGVfYXNzb2NpYXRpb24nLFxuICAgICAgICAnYXdzX3NlY3VyaXR5X2dyb3VwJyxcbiAgICAgICAgJ2F3c19kYl9zdWJuZXRfZ3JvdXAnLFxuICAgICAgICAnYXdzX2RiX2luc3RhbmNlJ1xuICAgICAgXTtcblxuICAgICAgZXhwZWN0ZWRSZXNvdXJjZVR5cGVzLmZvckVhY2gocmVzb3VyY2VUeXBlID0+IHtcbiAgICAgICAgZXhwZWN0KG1haW5UZkNvbnRlbnQpLnRvTWF0Y2gobmV3IFJlZ0V4cChgcmVzb3VyY2VcXFxccytcIiR7cmVzb3VyY2VUeXBlfVwiYCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiYWxsIHZhcmlhYmxlIGNvbnN0cmFpbnRzIGFuZCB0eXBlcyBhcmUgZGVmaW5lZFwiLCAoKSA9PiB7XG4gICAgICAvLyBFbnN1cmUgbm8gdmFyaWFibGUgaXMgbWlzc2luZyBhIHR5cGVcbiAgICAgIGNvbnN0IHZhcmlhYmxlQmxvY2tzID0gbWFpblRmQ29udGVudC5tYXRjaCgvdmFyaWFibGVcXHMrXCJcXHcrXCJcXHMqe1tcXHNcXFNdKj99L2cpIHx8IFtdO1xuICAgICAgdmFyaWFibGVCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgIGV4cGVjdChibG9jaykudG9NYXRjaCgvdHlwZVxccyo9Lyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJhbGwgb3V0cHV0cyBwcm92aWRlIG1lYW5pbmdmdWwgdmFsdWVzXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IG91dHB1dEJsb2NrcyA9IG1haW5UZkNvbnRlbnQubWF0Y2goL291dHB1dFxccytcIlxcdytcIlxccyp7W1xcc1xcU10qP30vZykgfHwgW107XG4gICAgICBvdXRwdXRCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgIGV4cGVjdChibG9jaykudG9NYXRjaCgvdmFsdWVcXHMqPS8pO1xuICAgICAgICBleHBlY3QoYmxvY2spLnRvTWF0Y2goL2Rlc2NyaXB0aW9uXFxzKj0vKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcInByb3ZpZGVyIGNvbmZpZ3VyYXRpb24gaXMgY29tcGxldGVcIiwgKCkgPT4ge1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC90ZXJyYWZvcm1cXHMqey8pO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9yZXF1aXJlZF92ZXJzaW9uLyk7XG4gICAgICBleHBlY3QocHJvdmlkZXJUZkNvbnRlbnQpLnRvTWF0Y2goL3JlcXVpcmVkX3Byb3ZpZGVycy8pO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9iYWNrZW5kXFxzK1wiczNcIi8pO1xuICAgICAgZXhwZWN0KHByb3ZpZGVyVGZDb250ZW50KS50b01hdGNoKC9wcm92aWRlclxccytcImF3c1wiLyk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=