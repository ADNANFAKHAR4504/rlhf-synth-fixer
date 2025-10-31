// Unit tests for Terraform VPC infrastructure
// Tests the structure and configuration without executing Terraform commands

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform VPC Infrastructure Unit Tests', () => {
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;
  let vpcModuleContent: string;
  let vpcModuleVariables: string;
  let vpcModuleOutputs: string;

  beforeAll(() => {
    // Read all necessary files
    mainTfContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    variablesTfContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    outputsTfContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    providerTfContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
    vpcModuleContent = fs.readFileSync(path.join(LIB_DIR, 'modules/vpc/main.tf'), 'utf8');
    vpcModuleVariables = fs.readFileSync(path.join(LIB_DIR, 'modules/vpc/variables.tf'), 'utf8');
    vpcModuleOutputs = fs.readFileSync(path.join(LIB_DIR, 'modules/vpc/outputs.tf'), 'utf8');
  });

  describe('File Structure and Existence', () => {
    test('main.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
    });

    test('variables.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('outputs.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('provider.tf file exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
    });

    test('VPC module exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'modules/vpc/main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, 'modules/vpc/variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, 'modules/vpc/outputs.tf'))).toBe(true);
    });

    test('Route53 Resolver module exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'modules/route53-resolver/main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, 'modules/route53-resolver/variables.tf'))).toBe(true);
      expect(fs.existsSync(path.join(LIB_DIR, 'modules/route53-resolver/outputs.tf'))).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider blocks are only in provider.tf', () => {
      expect(mainTfContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('terraform block is only in provider.tf', () => {
      expect(mainTfContent).not.toMatch(/^\s*terraform\s*{/m);
      expect(providerTfContent).toMatch(/terraform\s*{/);
    });

    test('provider.tf contains required provider aliases', () => {
      expect(providerTfContent).toMatch(/alias\s*=\s*"us-east-1"/);
      expect(providerTfContent).toMatch(/alias\s*=\s*"us-west-2"/);
      expect(providerTfContent).toMatch(/alias\s*=\s*"eu-central-1"/);
    });

    test('provider.tf contains default_tags', () => {
      expect(providerTfContent).toMatch(/default_tags\s*{/);
      expect(providerTfContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test('provider.tf contains S3 backend configuration', () => {
      expect(providerTfContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test('terraform version constraint is correct', () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.0\.0"/);
    });
  });

  describe('Required Variables', () => {
    test('aws_region variable exists', () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('environment variable exists with validation', () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment"\s*{/);
      expect(variablesTfContent).toMatch(/validation\s*{/);
    });

    test('regions variable exists', () => {
      expect(variablesTfContent).toMatch(/variable\s+"regions"\s*{/);
      expect(variablesTfContent).toMatch(/list\(string\)/);
    });

    test('nat_gateway_regions variable exists', () => {
      expect(variablesTfContent).toMatch(/variable\s+"nat_gateway_regions"\s*{/);
    });

    test('base_cidr_block variable exists with validation', () => {
      expect(variablesTfContent).toMatch(/variable\s+"base_cidr_block"\s*{/);
      expect(variablesTfContent).toMatch(/validation\s*{/);
    });

    test('project_name variable exists', () => {
      expect(variablesTfContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test('cost_center variable exists', () => {
      expect(variablesTfContent).toMatch(/variable\s+"cost_center"\s*{/);
    });

    test('enable_flow_logs variable exists', () => {
      expect(variablesTfContent).toMatch(/variable\s+"enable_flow_logs"\s*{/);
    });

    test('enable_route53_resolver variable exists with default false', () => {
      expect(variablesTfContent).toMatch(/variable\s+"enable_route53_resolver"\s*{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*false/);
    });

    test('environment_suffix variable exists for resource isolation', () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });
  });

  describe('CIDR Calculation with cidrsubnet()', () => {
    test('main.tf uses cidrsubnet function for CIDR allocation', () => {
      expect(mainTfContent).toMatch(/cidrsubnet\s*\(/);
    });

    test('CIDR blocks are dynamically calculated per region', () => {
      expect(mainTfContent).toMatch(/vpc_cidr\s*=\s*cidrsubnet/);
    });

    test('no hardcoded CIDR blocks in main.tf', () => {
      // Should not have direct CIDR assignments like "10.0.0.0/16"
      const hardcodedCidrPattern = /cidr_block\s*=\s*"10\.\d+\.\d+\.\d+\/\d+"/;
      expect(mainTfContent).not.toMatch(hardcodedCidrPattern);
    });

    test('public and private subnet CIDRs are calculated using cidrsubnet', () => {
      expect(mainTfContent).toMatch(/public_subnet_cidrs\s*=.*cidrsubnet/s);
      expect(mainTfContent).toMatch(/private_subnet_cidrs\s*=.*cidrsubnet/s);
    });
  });

  describe('Module Usage and for_each', () => {
    test('VPC modules are called for each region', () => {
      expect(mainTfContent).toMatch(/module\s+"vpc_us_east_1"/);
      expect(mainTfContent).toMatch(/module\s+"vpc_us_west_2"/);
      expect(mainTfContent).toMatch(/module\s+"vpc_eu_central_1"/);
    });

    test('modules use provider aliases correctly', () => {
      expect(mainTfContent).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.us-east-1/);
      expect(mainTfContent).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.us-west-2/);
      expect(mainTfContent).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.eu-central-1/);
    });

    test('no count parameter used (must use for_each)', () => {
      // Check that count is not used for resource iteration
      expect(mainTfContent).not.toMatch(/count\s*=\s*length\(/);
      expect(vpcModuleContent).not.toMatch(/count\s*=\s*length\(/);
    });

    test('for_each is used in VPC module for resources', () => {
      expect(vpcModuleContent).toMatch(/for_each\s*=/);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateway is conditional based on nat_gateway_regions', () => {
      expect(mainTfContent).toMatch(/enable_nat_gateway\s*=\s*contains\(var\.nat_gateway_regions/);
    });

    test('VPC module supports enable_nat_gateway variable', () => {
      expect(vpcModuleVariables).toMatch(/variable\s+"enable_nat_gateway"\s*{/);
    });

    test('VPC module supports single_nat_gateway variable', () => {
      expect(vpcModuleVariables).toMatch(/variable\s+"single_nat_gateway"\s*{/);
    });

    test('NAT Gateway resources are conditional in VPC module', () => {
      expect(vpcModuleContent).toMatch(/var\.enable_nat_gateway\s*\?/);
    });
  });

  describe('VPC Peering Configuration', () => {
    test('VPC peering connections are defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc_peering_connection"/);
    });

    test('VPC peering accepter resources are defined', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc_peering_connection_accepter"/);
    });

    test('peering connections use correct provider aliases', () => {
      expect(mainTfContent).toMatch(/provider\s*=\s*aws\.us-east-1/);
      expect(mainTfContent).toMatch(/provider\s*=\s*aws\.us-west-2/);
      expect(mainTfContent).toMatch(/provider\s*=\s*aws\.eu-central-1/);
    });

    test('peering routes are configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route"/);
      expect(mainTfContent).toMatch(/vpc_peering_connection_id/);
      expect(mainTfContent).toMatch(/private_route_table_ids/);
    });
  });

  describe('Route53 Resolver (Optional)', () => {
    test('Route53 Resolver module is conditional', () => {
      expect(mainTfContent).toMatch(/count\s*=\s*var\.enable_route53_resolver\s*\?\s*1\s*:\s*0/);
    });

    test('Route53 Resolver module calls are defined', () => {
      expect(mainTfContent).toMatch(/module\s+"route53_resolver_/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources follow {environment}-{region}-{resource-type}-{index} naming', () => {
      expect(vpcModuleContent).toMatch(/\$\{local\.name_prefix\}-vpc/);
      expect(vpcModuleContent).toMatch(/\$\{local\.name_prefix\}-igw/);
      expect(vpcModuleContent).toMatch(/\$\{local\.name_prefix\}-public-subnet/);
      expect(vpcModuleContent).toMatch(/\$\{local\.name_prefix\}-private-subnet/);
      expect(vpcModuleContent).toMatch(/\$\{local\.name_prefix\}-nat/);
    });

    test('name_prefix includes environment, region, and environment_suffix', () => {
      expect(vpcModuleContent).toMatch(/name_prefix\s*=\s*"\$\{var\.environment\}-\$\{var\.region\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Lifecycle Rules', () => {
    test('NO prevent_destroy lifecycle rules in VPC resource', () => {
      expect(vpcModuleContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('NO prevent_destroy lifecycle rules in Internet Gateway', () => {
      const igwPattern = /resource\s+"aws_internet_gateway"[\s\S]*?prevent_destroy\s*=\s*true/;
      expect(vpcModuleContent).not.toMatch(igwPattern);
    });
  });

  describe('Tagging Strategy', () => {
    test('common_tags are defined in provider.tf locals', () => {
      expect(providerTfContent).toMatch(/locals\s*{\s*common_tags/);
      expect(providerTfContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(providerTfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(providerTfContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(providerTfContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
    });

    test('VPC module uses merge function for tags', () => {
      expect(vpcModuleContent).toMatch(/merge\s*\(/);
    });
  });

  describe('Outputs', () => {
    test('VPC IDs are output for all regions', () => {
      expect(outputsTfContent).toMatch(/output\s+"vpc_ids"\s*{/);
      expect(outputsTfContent).toMatch(/vpc_us_east_1\.vpc_id/);
      expect(outputsTfContent).toMatch(/vpc_us_west_2\.vpc_id/);
      expect(outputsTfContent).toMatch(/vpc_eu_central_1\.vpc_id/);
    });

    test('CIDR blocks are output for all regions', () => {
      expect(outputsTfContent).toMatch(/output\s+"vpc_cidr_blocks"\s*{/);
    });

    test('subnet IDs are output', () => {
      expect(outputsTfContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test('NAT Gateway IDs are output', () => {
      expect(outputsTfContent).toMatch(/output\s+"nat_gateway_ids"\s*{/);
    });

    test('VPC peering connection info is output', () => {
      expect(outputsTfContent).toMatch(/output\s+"vpc_peering_connections"\s*{/);
    });

    test('cost optimization metrics are output', () => {
      expect(outputsTfContent).toMatch(/output\s+"nat_gateway_count"\s*{/);
      expect(outputsTfContent).toMatch(/output\s+"estimated_monthly_nat_cost"\s*{/);
    });
  });

  describe('Security and Best Practices', () => {
    test('DNS support is enabled in VPC', () => {
      expect(vpcModuleContent).toMatch(/enable_dns_support\s*=\s*var\.enable_dns_support/);
    });

    test('DNS hostnames are enabled in VPC', () => {
      expect(vpcModuleContent).toMatch(/enable_dns_hostnames\s*=\s*var\.enable_dns_hostnames/);
    });

    test('default security group has restrictive rules', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_default_security_group"/);
      expect(vpcModuleContent).toMatch(/ingress\s*=\s*\[\]/);
      expect(vpcModuleContent).toMatch(/egress\s*=\s*\[\]/);
    });

    test('VPC Flow Logs can be enabled', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_flow_log"/);
      expect(vpcModuleContent).toMatch(/count\s*=\s*var\.enable_flow_logs/);
    });

    test('IAM role for Flow Logs follows least privilege', () => {
      expect(vpcModuleContent).toMatch(/logs:CreateLogGroup/);
      expect(vpcModuleContent).toMatch(/logs:CreateLogStream/);
      expect(vpcModuleContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('Module Structure', () => {
    test('VPC module has required outputs', () => {
      expect(vpcModuleOutputs).toMatch(/output\s+"vpc_id"\s*{/);
      expect(vpcModuleOutputs).toMatch(/output\s+"vpc_cidr_block"\s*{/);
      expect(vpcModuleOutputs).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(vpcModuleOutputs).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(vpcModuleOutputs).toMatch(/output\s+"nat_gateway_ids"\s*{/);
      expect(vpcModuleOutputs).toMatch(/output\s+"private_route_table_ids"\s*{/);
    });

    test('VPC module has required variables', () => {
      expect(vpcModuleVariables).toMatch(/variable\s+"region"\s*{/);
      expect(vpcModuleVariables).toMatch(/variable\s+"environment"\s*{/);
      expect(vpcModuleVariables).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(vpcModuleVariables).toMatch(/variable\s+"availability_zones"\s*{/);
      expect(vpcModuleVariables).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(vpcModuleVariables).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    });
  });

  describe('Data Sources', () => {
    test('availability zones are fetched using data sources', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"/);
    });

    test('data sources filter for available AZs', () => {
      expect(mainTfContent).toMatch(/state\s*=\s*"available"/);
    });

    test('data sources filter for opt-in-not-required', () => {
      expect(mainTfContent).toMatch(/opt-in-not-required/);
    });
  });

  describe('Network Architecture', () => {
    test('public subnets are created', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('private subnets are created', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('internet gateway is created', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('public route table has internet gateway route', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_route"\s+"public_internet"/);
      expect(vpcModuleContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway/);
    });

    test('private subnets have route tables', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('NAT Gateway routes are conditional', () => {
      expect(vpcModuleContent).toMatch(/resource\s+"aws_route"\s+"private_nat"/);
    });
  });

  describe('Dependencies', () => {
    test('NAT Gateway depends on Internet Gateway', () => {
      expect(vpcModuleContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Elastic IPs depend on Internet Gateway', () => {
      const eipSection = vpcModuleContent.match(/resource\s+"aws_eip"\s+"nat"[\s\S]*?(?=resource|$)/);
      expect(eipSection).toBeTruthy();
      if (eipSection) {
        expect(eipSection[0]).toMatch(/depends_on/);
      }
    });
  });
});
