// terraform.unit.test.ts
// Comprehensive unit tests for Multi-Region VPC Terraform Infrastructure
// Tests configuration structure, syntax, and compliance without deployment
// Region/account agnostic with no hardcoded values

import fs from 'fs';
import path from 'path';

// File paths
const LIB_DIR = path.resolve(__dirname, '../lib');
const FILES = {
  provider: path.join(LIB_DIR, 'provider.tf'),
  variables: path.join(LIB_DIR, 'variables.tf'),
  locals: path.join(LIB_DIR, 'locals.tf'),
  data: path.join(LIB_DIR, 'data.tf'),
  vpc: path.join(LIB_DIR, 'vpc.tf'),
  subnets: path.join(LIB_DIR, 'subnets.tf'),
  routing: path.join(LIB_DIR, 'routing.tf'),
  monitoring: path.join(LIB_DIR, 'monitoring.tf'),
  outputs: path.join(LIB_DIR, 'outputs.tf'),
};

// Content cache for performance
let fileContents: { [key: string]: string } = {};

beforeAll(() => {
  // Pre-load all file contents
  Object.entries(FILES).forEach(([name, filePath]) => {
    if (fs.existsSync(filePath)) {
      fileContents[name] = fs.readFileSync(filePath, 'utf8');
    }
  });
});

describe('Multi-Region VPC Terraform Infrastructure Unit Tests', () => {
  // ============================================================================
  // FILE STRUCTURE AND EXISTENCE TESTS
  // ============================================================================

  describe('File Structure and Organization', () => {
    test('all required Terraform files exist', () => {
      Object.entries(FILES).forEach(([name, filePath]) => {
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fileContents[name]).toBeDefined();
        expect(fileContents[name].length).toBeGreaterThan(0);
      });
    });

    test('files follow modular organization pattern', () => {
      const expectedFiles = [
        'provider.tf', 'variables.tf', 'locals.tf', 'data.tf',
        'vpc.tf', 'subnets.tf', 'routing.tf', 'monitoring.tf', 'outputs.tf'
      ];

      expectedFiles.forEach(fileName => {
        const filePath = path.join(LIB_DIR, fileName);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('files contain valid Terraform syntax', () => {
      Object.entries(fileContents).forEach(([name, content]) => {
        // Check for basic HCL structure - must contain at least one block
        expect(content).toMatch(/(resource|variable|output|data|locals|terraform|provider)\s+/); // Contains HCL blocks
        // No obvious syntax errors - allow empty backend blocks (common pattern)
        expect(content).not.toMatch(/resource\s+"\w+"\s+"\w+"\s*\{\s*\}/); // No empty resource blocks
        expect(content).not.toMatch(/\$\{[^}]*\$\{/); // No nested interpolations
      });
    });
  });

  // ============================================================================
  // VARIABLES CONFIGURATION TESTS
  // ============================================================================

  describe('Variables Configuration', () => {
    const variablesContent = () => fileContents.variables;

    test('defines all required variables', () => {
      const requiredVariables = [
        'aws_region', 'environment', 'project_name', 'vpc_cidr',
        'availability_zones_count', 'enable_nat_gateway', 'single_nat_gateway',
        'enable_dns_hostnames', 'enable_dns_support', 'custom_dns_servers',
        'enable_vpc_flow_logs', 'flow_logs_retention_days'
      ];

      requiredVariables.forEach(varName => {
        expect(variablesContent()).toMatch(new RegExp(`variable\\s+"${varName}"`, 'g'));
      });
    });

    test('aws_region variable has validation', () => {
      const content = variablesContent();
      expect(content).toMatch(/variable\s+"aws_region"[\s\S]*validation\s*{/);
      expect(content).toMatch(/condition\s*=/);
      expect(content).toMatch(/error_message\s*=/);
    });

    test('vpc_cidr variable enforces /20 requirement', () => {
      const content = variablesContent();
      expect(content).toMatch(/variable\s+"vpc_cidr"[\s\S]*validation\s*{/);
      expect(content).toMatch(/\/20/); // Mentions /20 requirement
    });

    test('availability_zones_count must be exactly 3', () => {
      const content = variablesContent();
      expect(content).toMatch(/variable\s+"availability_zones_count"/);
      expect(content).toMatch(/default\s*=\s*3/);
      expect(content).toMatch(/validation[\s\S]*==\s*3/); // Must equal 3
    });

    test('custom_dns_servers defaults to Google DNS', () => {
      const content = variablesContent();
      expect(content).toMatch(/variable\s+"custom_dns_servers"/);
      expect(content).toMatch(/8\.8\.8\.8/);
      expect(content).toMatch(/8\.8\.4\.4/);
    });

    test('flow_logs_retention_days has CloudWatch validation', () => {
      const content = variablesContent();
      expect(content).toMatch(/variable\s+"flow_logs_retention_days"/);
      expect(content).toMatch(/validation\s*{/);
      expect(content).toMatch(/contains\s*\(/); // Uses contains function for validation
    });

    test('all variables have descriptions', () => {
      const content = variablesContent();
      const variableBlocks = content.match(/variable\s+"[^"]+"\s*{[^}]+}/g) || [];

      expect(variableBlocks.length).toBeGreaterThan(10);
      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('boolean variables have correct defaults', () => {
      const content = variablesContent();
      expect(content).toMatch(/variable\s+"enable_nat_gateway"[\s\S]*default\s*=\s*true/);
      expect(content).toMatch(/variable\s+"single_nat_gateway"[\s\S]*default\s*=\s*true/);
      expect(content).toMatch(/variable\s+"enable_dns_hostnames"[\s\S]*default\s*=\s*true/);
      expect(content).toMatch(/variable\s+"enable_vpc_flow_logs"[\s\S]*default\s*=\s*true/);
    });
  });

  // ============================================================================
  // LOCALS CONFIGURATION TESTS  
  // ============================================================================

  describe('Locals Configuration', () => {
    const localsContent = () => fileContents.locals;

    test('defines naming convention with region suffix', () => {
      const content = localsContent();
      expect(content).toMatch(/locals\s*{/);
      expect(content).toMatch(/name_prefix\s*=.*project_name.*environment.*aws_region/);
    });

    test('defines common tags structure', () => {
      const content = localsContent();
      expect(content).toMatch(/common_tags\s*=/);
      expect(content).toMatch(/Environment\s*=/);
      expect(content).toMatch(/Project\s*=/);
      expect(content).toMatch(/Region\s*=/);
      expect(content).toMatch(/ManagedBy\s*=/);
    });

    test('calculates CIDR blocks correctly', () => {
      const content = localsContent();
      expect(content).toMatch(/public_subnet_cidrs\s*=/);
      expect(content).toMatch(/private_subnet_cidrs\s*=/);
      expect(content).toMatch(/cidrsubnet\(/g); // Uses cidrsubnet function
    });

    test('defines resource naming patterns', () => {
      const content = localsContent();
      const namingVariables = [
        'vpc_name', 'igw_name', 'nat_gateway_name', 'dhcp_options_name',
        'flow_logs_name', 'public_route_table_name'
      ];

      namingVariables.forEach(variable => {
        expect(content).toMatch(new RegExp(`${variable}\\s*=`));
        expect(content).toMatch(new RegExp(`${variable}.*name_prefix`));
      });
    });

    test('VPC Flow Logs configuration is comprehensive', () => {
      const content = localsContent();
      expect(content).toMatch(/flow_logs_log_group_name/);
      expect(content).toMatch(/flow_logs_role_name/);
      expect(content).toMatch(/flow_logs_policy_name/);
    });
  });

  // ============================================================================
  // DATA SOURCES TESTS
  // ============================================================================

  describe('Data Sources Configuration', () => {
    const dataContent = () => fileContents.data;

    test('dynamically selects availability zones', () => {
      const content = dataContent();
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(content).toMatch(/state\s*=\s*"available"/);
    });

    test('filters AZs for opt-in-not-required', () => {
      const content = dataContent();
      expect(content).toMatch(/filter\s*{[\s\S]*name\s*=\s*"opt-in-status"/);
      expect(content).toMatch(/opt-in-not-required/);
    });

    test('validates AZ count requirement', () => {
      const content = dataContent();
      expect(content).toMatch(/selected_azs\s*=/);
      expect(content).toMatch(/slice\(/);
      expect(content).toMatch(/availability_zones_count/);
    });

    test('includes caller identity and region data sources', () => {
      const content = dataContent();
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(content).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  // ============================================================================
  // VPC CONFIGURATION TESTS
  // ============================================================================

  describe('VPC Configuration', () => {
    const vpcContent = () => fileContents.vpc;

    test('creates VPC with required configuration', () => {
      const content = vpcContent();
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*var\.enable_dns_hostnames/);
      expect(content).toMatch(/enable_dns_support\s*=\s*var\.enable_dns_support/);
    });

    test('creates Internet Gateway with proper tagging', () => {
      const content = vpcContent();
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    });

    test('configures DHCP options with custom DNS', () => {
      const content = vpcContent();
      expect(content).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"main"/);
      expect(content).toMatch(/domain_name_servers\s*=\s*var\.custom_dns_servers/);
      expect(content).toMatch(/domain_name\s*=/);
    });

    test('associates DHCP options with VPC', () => {
      const content = vpcContent();
      expect(content).toMatch(/resource\s+"aws_vpc_dhcp_options_association"\s+"main"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(content).toMatch(/dhcp_options_id\s*=\s*aws_vpc_dhcp_options\.main\.id/);
    });

    test('uses consistent tagging pattern', () => {
      const content = vpcContent();
      expect(content).toMatch(/tags\s*=\s*merge\(local\.common_tags/g);
    });
  });

  // ============================================================================
  // SUBNETS CONFIGURATION TESTS
  // ============================================================================

  describe('Subnets Configuration', () => {
    const subnetsContent = () => fileContents.subnets;

    test('creates exactly 3 public subnets', () => {
      const content = subnetsContent();
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones_count/);
    });

    test('creates exactly 3 private subnets', () => {
      const content = subnetsContent();
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones_count/);
    });

    test('public subnets use correct CIDR and AZ assignments', () => {
      const content = subnetsContent();
      expect(content).toMatch(/cidr_block\s*=\s*local\.public_subnet_cidrs\[count\.index\]/);
      expect(content).toMatch(/availability_zone\s*=\s*local\.selected_azs\[count\.index\]/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*var\.map_public_ip_on_launch/);
    });

    test('private subnets use correct CIDR and AZ assignments', () => {
      const content = subnetsContent();
      expect(content).toMatch(/cidr_block\s*=\s*local\.private_subnet_cidrs\[count\.index\]/);
      expect(content).toMatch(/availability_zone\s*=\s*local\.selected_azs\[count\.index\]/);
    });

    test('subnets have proper tagging with tier identification', () => {
      const content = subnetsContent();
      expect(content).toMatch(/Tier\s*=\s*"public"/);
      expect(content).toMatch(/Tier\s*=\s*"private"/);
      expect(content).toMatch(/AZ\s*=\s*local\.selected_azs/);
    });

    test('subnets depend on VPC creation', () => {
      const content = subnetsContent();
      expect(content).toMatch(/depends_on\s*=\s*\[aws_vpc\.main\]/g);
    });
  });

  // ============================================================================
  // ROUTING CONFIGURATION TESTS
  // ============================================================================

  describe('Routing Configuration', () => {
    const routingContent = () => fileContents.routing;

    test('creates NAT Gateway with cost optimization', () => {
      const content = routingContent();
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(content).toMatch(/count\s*=.*single_nat_gateway/);
      expect(content).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/); // First AZ only
    });

    test('creates Elastic IP for NAT Gateway', () => {
      const content = routingContent();
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(content).toMatch(/domain\s*=\s*"vpc"/);
      expect(content).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('creates shared public route table', () => {
      const content = routingContent();
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(content).toMatch(/route\s*{[\s\S]*cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('creates separate route tables for each private subnet', () => {
      const content = routingContent();
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(content).toMatch(/count\s*=\s*var\.availability_zones_count/);
    });

    test('private route tables use dynamic routing to NAT Gateway', () => {
      const content = routingContent();
      expect(content).toMatch(/dynamic\s+"route"/);
      expect(content).toMatch(/for_each\s*=.*enable_nat_gateway.*single_nat_gateway/);
      expect(content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[0\]\.id/);
    });

    test('associates subnets with correct route tables', () => {
      const content = routingContent();
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });

    test('prevents cross-AZ private subnet communication', () => {
      const content = routingContent();
      // Each private subnet has its own route table (count = 3)
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*?count\s*=\s*var\.availability_zones_count/);
      // Each association uses its own route table
      expect(content).toMatch(/route_table_id\s*=\s*aws_route_table\.private\[count\.index\]\.id/);
    });
  });

  // ============================================================================
  // MONITORING CONFIGURATION TESTS
  // ============================================================================

  describe('Monitoring Configuration', () => {
    const monitoringContent = () => fileContents.monitoring;

    test('creates CloudWatch Log Group for VPC Flow Logs', () => {
      const content = monitoringContent();
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
      expect(content).toMatch(/count\s*=\s*var\.enable_vpc_flow_logs/);
      expect(content).toMatch(/retention_in_days\s*=\s*var\.flow_logs_retention_days/);
    });

    test('creates IAM role for VPC Flow Logs', () => {
      const content = monitoringContent();
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
      expect(content).toMatch(/Service.*vpc-flow-logs\.amazonaws\.com/);
    });

    test('creates IAM policy for CloudWatch Logs access', () => {
      const content = monitoringContent();
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
      expect(content).toMatch(/logs:CreateLogGroup/);
      expect(content).toMatch(/logs:CreateLogStream/);
      expect(content).toMatch(/logs:PutLogEvents/);
    });

    test('enables VPC Flow Logs with proper configuration', () => {
      const content = monitoringContent();
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs"/);
      expect(content).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('Flow Logs use CloudWatch destination', () => {
      const content = monitoringContent();
      expect(content).toMatch(/log_destination\s*=\s*aws_cloudwatch_log_group\.vpc_flow_logs/);
      expect(content).toMatch(/iam_role_arn\s*=\s*aws_iam_role\.vpc_flow_logs/);
    });
  });

  // ============================================================================
  // OUTPUTS CONFIGURATION TESTS
  // ============================================================================

  describe('Outputs Configuration', () => {
    const outputsContent = () => fileContents.outputs;

    test('outputs all VPC information', () => {
      const content = outputsContent();
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"vpc_arn"/);
      expect(content).toMatch(/output\s+"vpc_cidr_block"/);
    });

    test('outputs subnet information', () => {
      const content = outputsContent();
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
      expect(content).toMatch(/output\s+"public_subnet_cidr_blocks"/);
      expect(content).toMatch(/output\s+"private_subnet_cidr_blocks"/);
    });

    test('outputs routing information', () => {
      const content = outputsContent();
      expect(content).toMatch(/output\s+"public_route_table_id"/);
      expect(content).toMatch(/output\s+"private_route_table_ids"/);
      expect(content).toMatch(/output\s+"nat_gateway_id"/);
      expect(content).toMatch(/output\s+"internet_gateway_id"/);
    });

    test('outputs monitoring information', () => {
      const content = outputsContent();
      expect(content).toMatch(/output\s+"vpc_flow_logs_id"/);
      expect(content).toMatch(/output\s+"vpc_flow_logs_log_group_name"/);
    });

    test('outputs regional and naming information', () => {
      const content = outputsContent();
      expect(content).toMatch(/output\s+"availability_zones"/);
      expect(content).toMatch(/output\s+"name_prefix"/);
      expect(content).toMatch(/output\s+"region"/);
      expect(content).toMatch(/output\s+"account_id"/);
    });

    test('all outputs have descriptions', () => {
      const content = outputsContent();
      const outputBlocks = content.match(/output\s+"[^"]+"\s*{[^}]+}/g) || [];

      expect(outputBlocks.length).toBeGreaterThan(15);
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('conditional outputs handle disabled features', () => {
      const content = outputsContent();
      expect(content).toMatch(/var\.enable_vpc_flow_logs\s*\?\s*.*\s*:\s*null/);
      expect(content).toMatch(/var\.enable_nat_gateway.*single_nat_gateway.*null/);
    });
  });

  // ============================================================================
  // PROVIDER CONFIGURATION TESTS
  // ============================================================================

  describe('Provider Configuration', () => {
    const providerContent = () => fileContents.provider;

    test('defines Terraform version requirement', () => {
      const content = providerContent();
      expect(content).toMatch(/terraform\s*{/);
      expect(content).toMatch(/required_version\s*=.*1\./); // Version 1.x
    });

    test('defines AWS provider requirement', () => {
      const content = providerContent();
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{/);
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/version\s*=.*5\./); // Version 5.x
    });

    test('configures S3 backend', () => {
      const content = providerContent();
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test('configures AWS provider with region variable', () => {
      const content = providerContent();
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  // ============================================================================
  // COMPLIANCE AND BEST PRACTICES TESTS
  // ============================================================================

  describe('Compliance and Best Practices', () => {
    test('no hardcoded values (region/account agnostic)', () => {
      Object.entries(fileContents).forEach(([name, content]) => {
        // Should not contain hardcoded AWS regions except in validation, defaults, and AWS domain logic
        // Skip variable definitions and AWS-specific conditional logic for DHCP options
        if (!['variables', 'vpc'].includes(name)) {
          expect(content).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
        }
        // Should not contain hardcoded account IDs
        expect(content).not.toMatch(/\b\d{12}\b/); // 12-digit account IDs
        // Should not contain hardcoded public IP addresses except for DNS and CIDR blocks
        // Only flag IPs that are not followed by /subnet_mask and not in allowed ranges
        const hardcodedIpPattern = /(?!10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.|192\.168\.|8\.8\.8\.8|8\.8\.4\.4|0\.0\.0\.0)\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b(?!\/[0-9]+)/g;
        expect(content).not.toMatch(hardcodedIpPattern);
      });
    });

    test('uses variables instead of hardcoded values', () => {
      const nonVariableFiles = ['locals', 'data', 'outputs'];
      Object.entries(fileContents).forEach(([name, content]) => {
        if (!nonVariableFiles.includes(name)) {
          // Should use var. references for configuration
          expect(content).toMatch(/var\.\w+/);
        }
      });
    });

    test('consistent resource naming patterns', () => {
      const resourceFiles = ['vpc', 'subnets', 'routing', 'monitoring'];
      resourceFiles.forEach(file => {
        const content = fileContents[file];
        if (content) {
          // Should use local.name_prefix or similar for naming
          expect(content).toMatch(/local\.\w+.*name/i);
          // Should have consistent tag structure
          expect(content).toMatch(/tags\s*=\s*merge\(local\.common_tags/g);
        }
      });
    });

    test('proper resource dependencies', () => {
      const routingContent = fileContents.routing;
      expect(routingContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main/);

      const subnetsContent = fileContents.subnets;
      expect(subnetsContent).toMatch(/depends_on\s*=\s*\[aws_vpc\.main/);

      const monitoringContent = fileContents.monitoring;
      expect(monitoringContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_vpc\.main/);
    });

    test('security best practices', () => {
      // VPC Flow Logs enabled by default
      const variablesContent = fileContents.variables;
      expect(variablesContent).toMatch(/enable_vpc_flow_logs[\s\S]*default\s*=\s*true/);

      // DNS enabled by default
      expect(variablesContent).toMatch(/enable_dns_hostnames[\s\S]*default\s*=\s*true/);
      expect(variablesContent).toMatch(/enable_dns_support[\s\S]*default\s*=\s*true/);
    });

    test('cost optimization practices', () => {
      const variablesContent = fileContents.variables;
      // Single NAT Gateway enabled by default for cost savings
      expect(variablesContent).toMatch(/single_nat_gateway[\s\S]*default\s*=\s*true/);

      const routingContent = fileContents.routing;
      // NAT Gateway only created when conditions are met
      expect(routingContent).toMatch(/count\s*=.*enable_nat_gateway.*single_nat_gateway/);
    });

    test('multi-region compatibility', () => {
      const vpcContent = fileContents.vpc;
      // Domain name adjusts based on region
      expect(vpcContent).toMatch(/domain_name\s*=.*aws_region.*us-east-1.*ec2\.internal/);

      const localsContent = fileContents.locals;
      // Naming includes region
      expect(localsContent).toMatch(/name_prefix.*aws_region/);
    });

    test('proper validation and error handling', () => {
      const variablesContent = fileContents.variables;

      // Critical variables have validation blocks
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*validation/);
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*validation/);
      expect(variablesContent).toMatch(/variable\s+"availability_zones_count"[\s\S]*validation/);

      // Error messages provide helpful feedback
      expect(variablesContent).toMatch(/error_message\s*=.*must be/i);
    });
  });

  // ============================================================================
  // INTEGRATION READINESS TESTS
  // ============================================================================

  describe('Integration Readiness', () => {
    test('module can be consumed by other Terraform configurations', () => {
      const outputsContent = fileContents.outputs;

      // Essential outputs for integration
      const requiredOutputs = [
        'vpc_id', 'public_subnet_ids', 'private_subnet_ids',
        'public_route_table_id', 'private_route_table_ids'
      ];

      requiredOutputs.forEach(output => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });

    test('supports multiple deployment environments', () => {
      const variablesContent = fileContents.variables;
      expect(variablesContent).toMatch(/variable\s+"environment"/);

      const localsContent = fileContents.locals;
      expect(localsContent).toMatch(/Environment\s*=\s*var\.environment/);
    });

    test('provides comprehensive metadata outputs', () => {
      const outputsContent = fileContents.outputs;

      // Metadata for other systems
      expect(outputsContent).toMatch(/output\s+"region"/);
      expect(outputsContent).toMatch(/output\s+"account_id"/);
      expect(outputsContent).toMatch(/output\s+"availability_zones"/);
      expect(outputsContent).toMatch(/output\s+"common_tags"/);
    });
  });

  // ============================================================================
  // PERFORMANCE AND MAINTAINABILITY TESTS
  // ============================================================================

  describe('Performance and Maintainability', () => {
    test('efficient resource creation patterns', () => {
      const subnetsContent = fileContents.subnets;
      // Uses count for resource creation efficiency
      expect(subnetsContent).toMatch(/count\s*=\s*var\.availability_zones_count/g);

      const routingContent = fileContents.routing;
      // Uses conditional creation to avoid unnecessary resources
      expect(routingContent).toMatch(/count\s*=.*\?\s*1\s*:\s*0/g);
    });

    test('readable and maintainable code structure', () => {
      Object.entries(fileContents).forEach(([name, content]) => {
        // Has comments explaining complex logic
        expect(content).toMatch(/#.*[A-Za-z]/); // Contains meaningful comments

        // Proper code structure - no excessive blank lines
        expect(content).not.toMatch(/\n\n\n\n/); // No more than 3 consecutive blank lines
        // No trailing whitespace
        expect(content).not.toMatch(/[ \t]+$/m);
      });
    });

    test('follows Terraform naming conventions', () => {
      Object.entries(fileContents).forEach(([name, content]) => {
        // Resource names use underscores, not hyphens
        const resources = content.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];
        resources.forEach(resource => {
          expect(resource).toMatch(/resource\s+"[\w_-]+"\s+"[\w_]+"/);
        });

        // Variable names use underscores
        const variables = content.match(/variable\s+"[^"]+"/g) || [];
        variables.forEach(variable => {
          expect(variable).toMatch(/variable\s+"[\w_]+"/);
        });
      });
    });
  });
});