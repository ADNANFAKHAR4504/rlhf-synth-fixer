// terraform.unit.test.ts
// Comprehensive unit tests for Payment Processing Platform Terraform Stack
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const OUTPUTS_PATH = path.resolve(__dirname, '../lib/outputs.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');
const NAT_USERDATA_PATH = path.resolve(__dirname, '../lib/nat_instance_userdata.sh');

// Helper functions
const readFileContent = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const hasResource = (content: string, resourceType: string, resourceName: string): boolean => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`);
  return regex.test(content);
};

const hasDataSource = (content: string, dataType: string, dataName: string): boolean => {
  const regex = new RegExp(`data\\s+"${dataType}"\\s+"${dataName}"`);
  return regex.test(content);
};

const hasVariable = (content: string, variableName: string): boolean => {
  const regex = new RegExp(`variable\\s+"${variableName}"`);
  return regex.test(content);
};

const hasOutput = (content: string, outputName: string): boolean => {
  const regex = new RegExp(`output\\s+"${outputName}"`);
  return regex.test(content);
};

const hasResourceAttribute = (content: string, resourceType: string, resourceName: string, attribute: string): boolean => {
  const resourceRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?${attribute}\\s*=`, 's');
  return resourceRegex.test(content);
};

const countResourceOccurrences = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`,'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const hasTagging = (content: string, resourceType: string, resourceName: string): boolean => {
  const tagsRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?tags\\s*=`, 's');
  return tagsRegex.test(content);
};

const hasLocalsBlock = (content: string): boolean => {
  return /locals\s*{/.test(content);
};

const extractAttributeValue = (content: string, resourceType: string, resourceName: string, attribute: string): string | null => {
  const resourceRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{([\\s\\S]*?)}`, 's');
  const resourceMatch = content.match(resourceRegex);
  if (!resourceMatch) return null;
  
  const attributeRegex = new RegExp(`${attribute}\\s*=\\s*([^\\n]+)`);
  const attributeMatch = resourceMatch[1].match(attributeRegex);
  return attributeMatch ? attributeMatch[1].trim() : null;
};

describe('Payment Processing Platform Infrastructure - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;
  let natUserdataContent: string;

  beforeAll(() => {
    stackContent = readFileContent(STACK_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providerContent = readFileContent(PROVIDER_PATH);
    natUserdataContent = readFileContent(NAT_USERDATA_PATH);
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(fs.existsSync(NAT_USERDATA_PATH)).toBe(true);
    });

    test('tap_stack.tf is comprehensive for payment platform', () => {
      expect(stackContent.length).toBeGreaterThan(15000);
    });

    test('variables.tf contains required variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(500);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(2000);
    });

    test('NAT instance userdata script exists', () => {
      expect(natUserdataContent.length).toBeGreaterThan(500);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+/);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*?version\s*=\s*">=\s*5\.0/s);
    });

    test('uses variable for AWS region (region-agnostic)', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('has S3 backend configuration', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('includes default tags configuration', () => {
      expect(providerContent).toMatch(/default_tags\s*{[\s\S]*?tags\s*=\s*{/s);
    });

    test('provider configuration is separate from main stack', () => {
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*?required_providers/s);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'environment_suffix',
      'repository',
      'commit_author',
      'pr_number',
      'team'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('aws_region variable defaults to eu-central-1', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"eu-central-1"/s);
    });

    test('variables have proper descriptions', () => {
      expect(variablesContent).toMatch(/description\s*=\s*"AWS region for resources"/);
      expect(variablesContent).toMatch(/description\s*=\s*"Environment suffix for resource naming"/);
    });

    test('variables use string type declarations', () => {
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('no hardcoded regional values in variables', () => {
      expect(variablesContent).not.toMatch(/"us-east-1"|"us-west-1"|"eu-west-1"/);
    });
  });

  describe('Data Sources', () => {
    test('declares availability zones data source', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('declares Amazon Linux AMI data source', () => {
      expect(hasDataSource(stackContent, 'aws_ami', 'amazon_linux')).toBe(true);
    });

    test('AMI data source uses dynamic filters (region-agnostic)', () => {
      expect(stackContent).toMatch(/filter\s*{[\s\S]*?name\s*=\s*"name"[\s\S]*?values\s*=\s*\["al2023-ami-\*-x86_64"\]/s);
    });

    test('AMI data source filters for HVM virtualization', () => {
      expect(stackContent).toMatch(/filter\s*{[\s\S]*?name\s*=\s*"virtualization-type"[\s\S]*?values\s*=\s*\["hvm"\]/s);
    });

    test('AMI data source uses most recent', () => {
      expect(stackContent).toMatch(/aws_ami.*amazon_linux[\s\S]*?most_recent\s*=\s*true/s);
    });
  });

  describe('Locals Configuration', () => {
    test('declares locals block', () => {
      expect(hasLocalsBlock(stackContent)).toBe(true);
    });

    test('defines VPC CIDR as specified (10.0.0.0/16)', () => {
      expect(stackContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('defines public subnet CIDRs as specified', () => {
      expect(stackContent).toMatch(/public_subnet_cidrs\s*=\s*\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24"\]/);
    });

    test('defines private app subnet CIDRs as specified', () => {
      expect(stackContent).toMatch(/private_app_cidrs\s*=\s*\["10\.0\.11\.0\/24",\s*"10\.0\.12\.0\/24"\]/);
    });

    test('defines private DB subnet CIDRs as specified', () => {
      expect(stackContent).toMatch(/private_db_cidrs\s*=\s*\["10\.0\.21\.0\/24",\s*"10\.0\.22\.0\/24"\]/);
    });

    test('defines on-premises CIDR (10.100.0.0/16)', () => {
      expect(stackContent).toMatch(/onprem_cidr\s*=\s*"10\.100\.0\.0\/16"/);
    });

    test('defines blocked CIDR ranges for NACLs', () => {
      expect(stackContent).toMatch(/blocked_cidrs\s*=\s*\["192\.168\.0\.0\/16",\s*"172\.16\.0\.0\/12"\]/);
    });

    test('defines resource naming using variables', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"payment-platform-\${var\.environment_suffix}"/);
    });

    test('defines bucket suffix using timestamp function', () => {
      expect(stackContent).toMatch(/bucket_suffix\s*=\s*formatdate\(/);
    });

    test('defines common tags with required values', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*?Environment\s*=\s*"Production"/s);
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*?Project\s*=\s*"PaymentPlatform"/s);
    });

    test('common tags use variables for repository info', () => {
      expect(stackContent).toMatch(/Repository\s*=\s*var\.repository/);
      expect(stackContent).toMatch(/Author\s*=\s*var\.commit_author/);
      expect(stackContent).toMatch(/PRNumber\s*=\s*var\.pr_number/);
      expect(stackContent).toMatch(/Team\s*=\s*var\.team/);
    });
  });

  describe('VPC and Core Networking', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('VPC uses dynamic CIDR from locals', () => {
      expect(stackContent).toMatch(/aws_vpc.*main[\s\S]*?cidr_block\s*=\s*local\.vpc_cidr/s);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('declares Internet Gateway', () => {
      expect(hasResource(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('Internet Gateway is attached to VPC', () => {
      expect(stackContent).toMatch(/aws_internet_gateway.*main[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/s);
    });

    test('VPC is properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_vpc', 'main')).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('declares public subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*public[\s\S]*?count\s*=\s*length\(local\.public_subnet_cidrs\)/s);
    });

    test('declares private app subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private_app')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*private_app[\s\S]*?count\s*=\s*length\(local\.private_app_cidrs\)/s);
    });

    test('declares private DB subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private_db')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*private_db[\s\S]*?count\s*=\s*length\(local\.private_db_cidrs\)/s);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      expect(stackContent).toMatch(/aws_subnet.*public[\s\S]*?map_public_ip_on_launch\s*=\s*true/s);
    });

    test('subnets use dynamic availability zones', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('subnets use dynamic CIDR blocks from locals', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.public_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.private_app_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.private_db_cidrs\[count\.index\]/);
    });

    test('all subnets are properly tagged with tier information', () => {
      expect(hasTagging(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(hasTagging(stackContent, 'aws_subnet', 'private_app')).toBe(true);
      expect(hasTagging(stackContent, 'aws_subnet', 'private_db')).toBe(true);
      expect(stackContent).toMatch(/Tier\s*=\s*"Public"/);
      expect(stackContent).toMatch(/Tier\s*=\s*"Application"/);
      expect(stackContent).toMatch(/Tier\s*=\s*"Database"/);
    });
  });

  describe('NAT Instance Configuration', () => {
    test('declares IAM role for NAT instance', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'nat_instance')).toBe(true);
    });

    test('declares IAM policy for NAT instance', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'nat_instance')).toBe(true);
    });

    test('declares IAM instance profile for NAT instance', () => {
      expect(hasResource(stackContent, 'aws_iam_instance_profile', 'nat_instance')).toBe(true);
    });

    test('declares security group for NAT instance', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'nat_instance')).toBe(true);
    });

    test('declares Elastic IP for NAT instance', () => {
      expect(hasResource(stackContent, 'aws_eip', 'nat_instance')).toBe(true);
    });

    test('declares NAT instance with t3.micro', () => {
      expect(hasResource(stackContent, 'aws_instance', 'nat_instance')).toBe(true);
      expect(stackContent).toMatch(/aws_instance.*nat_instance[\s\S]*?instance_type\s*=\s*"t3\.micro"/s);
    });

    test('NAT instance uses dynamic AMI', () => {
      expect(stackContent).toMatch(/aws_instance.*nat_instance[\s\S]*?ami\s*=\s*data\.aws_ami\.amazon_linux\.id/s);
    });

    test('NAT instance is in first public subnet', () => {
      expect(stackContent).toMatch(/aws_instance.*nat_instance[\s\S]*?subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/s);
    });

    test('NAT instance has source_dest_check disabled', () => {
      expect(stackContent).toMatch(/aws_instance.*nat_instance[\s\S]*?source_dest_check\s*=\s*false/s);
    });

    test('NAT instance uses IAM instance profile', () => {
      expect(stackContent).toMatch(/aws_instance.*nat_instance[\s\S]*?iam_instance_profile\s*=\s*aws_iam_instance_profile\.nat_instance\.name/s);
    });

    test('declares EIP association for NAT instance', () => {
      expect(hasResource(stackContent, 'aws_eip_association', 'nat_instance')).toBe(true);
    });

    test('NAT instance userdata script configures iptables', () => {
      expect(natUserdataContent).toMatch(/iptables.*MASQUERADE/);
      expect(natUserdataContent).toMatch(/net\.ipv4\.ip_forward\s*=\s*1/);
      expect(natUserdataContent).toMatch(/sysctl -p/);
    });

    test('NAT instance userdata script uses template variables', () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode\(templatefile\(/);
      expect(stackContent).toMatch(/eip_allocation_id\s*=\s*aws_eip\.nat_instance\.allocation_id/);
      expect(stackContent).toMatch(/aws_region\s*=\s*var\.aws_region/);
    });
  });

  describe('Route Tables and Routing', () => {
    test('declares public route table', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'public')).toBe(true);
    });

    test('declares private app route table', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'private_app')).toBe(true);
    });

    test('declares private DB route table', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'private_db')).toBe(true);
    });

    test('public route table has internet gateway route', () => {
      expect(stackContent).toMatch(/aws_route_table.*public[\s\S]*?route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/s);
    });

    test('public route table has transit gateway route for on-premises', () => {
      expect(stackContent).toMatch(/aws_route_table.*public[\s\S]*?route\s*{[\s\S]*?cidr_block\s*=\s*local\.onprem_cidr[\s\S]*?transit_gateway_id\s*=\s*aws_ec2_transit_gateway\.main\.id/s);
    });

    test('private route tables route through NAT instance', () => {
      expect(stackContent).toMatch(/aws_route_table.*private_app[\s\S]*?network_interface_id\s*=\s*aws_instance\.nat_instance\.primary_network_interface_id/s);
      expect(stackContent).toMatch(/aws_route_table.*private_db[\s\S]*?network_interface_id\s*=\s*aws_instance\.nat_instance\.primary_network_interface_id/s);
    });

    test('declares route table associations', () => {
      expect(hasResource(stackContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private_app')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private_db')).toBe(true);
    });

    test('route table associations use count for multiple subnets', () => {
      expect(stackContent).toMatch(/aws_route_table_association.*public[\s\S]*?count\s*=\s*length\(aws_subnet\.public\)/s);
      expect(stackContent).toMatch(/aws_route_table_association.*private_app[\s\S]*?count\s*=\s*length\(aws_subnet\.private_app\)/s);
      expect(stackContent).toMatch(/aws_route_table_association.*private_db[\s\S]*?count\s*=\s*length\(aws_subnet\.private_db\)/s);
    });
  });

  describe('Network ACLs Security', () => {
    test('declares Network ACLs for all subnet tiers', () => {
      expect(hasResource(stackContent, 'aws_network_acl', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_network_acl', 'private_app')).toBe(true);
      expect(hasResource(stackContent, 'aws_network_acl', 'private_db')).toBe(true);
    });

    test('Network ACLs are associated with correct subnets', () => {
      expect(stackContent).toMatch(/aws_network_acl.*public[\s\S]*?subnet_ids\s*=\s*aws_subnet\.public\[\*\]\.id/s);
      expect(stackContent).toMatch(/aws_network_acl.*private_app[\s\S]*?subnet_ids\s*=\s*aws_subnet\.private_app\[\*\]\.id/s);
      expect(stackContent).toMatch(/aws_network_acl.*private_db[\s\S]*?subnet_ids\s*=\s*aws_subnet\.private_db\[\*\]\.id/s);
    });

    test('Network ACLs use dynamic blocks to deny blocked CIDRs', () => {
      expect(stackContent).toMatch(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*local\.blocked_cidrs/s);
      expect(stackContent).toMatch(/dynamic\s+"egress"\s*{[\s\S]*?for_each\s*=\s*local\.blocked_cidrs/s);
    });

    test('Network ACLs use correct rule numbering', () => {
      expect(stackContent).toMatch(/rule_no\s*=\s*100\s*\+\s*index\(local\.blocked_cidrs/);
      expect(stackContent).toMatch(/rule_no\s*=\s*200/);
    });

    test('Network ACLs block specified CIDR ranges', () => {
      expect(stackContent).toMatch(/action\s*=\s*"deny"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*ingress\.value/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*egress\.value/);
    });

    test('Network ACLs allow other traffic with rule 200', () => {
      expect(stackContent).toMatch(/rule_no\s*=\s*200[\s\S]*?action\s*=\s*"allow"/s);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });
  });

  describe('VPC Flow Logs and S3', () => {
    test('declares S3 bucket for VPC Flow Logs', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'vpc_flow_logs')).toBe(true);
    });

    test('S3 bucket uses dynamic naming with timestamp', () => {
      expect(stackContent).toMatch(/aws_s3_bucket.*vpc_flow_logs[\s\S]*?bucket\s*=\s*"fintech-vpc-flow-logs-\${local\.bucket_suffix}"/s);
    });

    test('declares S3 bucket encryption configuration', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', 'vpc_flow_logs')).toBe(true);
    });

    test('S3 bucket encryption uses AES256', () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('declares S3 bucket public access block', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_public_access_block', 'vpc_flow_logs')).toBe(true);
    });

    test('S3 bucket blocks all public access', () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('declares VPC Flow Logs resource', () => {
      expect(hasResource(stackContent, 'aws_flow_log', 'vpc')).toBe(true);
    });

    test('VPC Flow Logs configured for S3 destination', () => {
      expect(stackContent).toMatch(/aws_flow_log.*vpc[\s\S]*?log_destination_type\s*=\s*"s3"/s);
      expect(stackContent).toMatch(/log_destination\s*=\s*aws_s3_bucket\.vpc_flow_logs\.arn/);
    });

    test('VPC Flow Logs captures ALL traffic', () => {
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('VPC Flow Logs attached to main VPC', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe('Transit Gateway Configuration', () => {
    test('declares Transit Gateway', () => {
      expect(hasResource(stackContent, 'aws_ec2_transit_gateway', 'main')).toBe(true);
    });

    test('declares Transit Gateway VPC attachment', () => {
      expect(hasResource(stackContent, 'aws_ec2_transit_gateway_vpc_attachment', 'main')).toBe(true);
    });

    test('declares Transit Gateway route table', () => {
      expect(hasResource(stackContent, 'aws_ec2_transit_gateway_route_table', 'main')).toBe(true);
    });

    test('declares Transit Gateway route for on-premises', () => {
      expect(hasResource(stackContent, 'aws_ec2_transit_gateway_route', 'onprem')).toBe(true);
    });

    test('Transit Gateway has route table association and propagation enabled', () => {
      expect(stackContent).toMatch(/default_route_table_association\s*=\s*"enable"/);
      expect(stackContent).toMatch(/default_route_table_propagation\s*=\s*"enable"/);
    });

    test('Transit Gateway VPC attachment uses private app subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_app\[\*\]\.id/);
    });

    test('Transit Gateway route points to on-premises CIDR', () => {
      expect(stackContent).toMatch(/destination_cidr_block\s*=\s*local\.onprem_cidr/);
    });

    test('Transit Gateway is properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_ec2_transit_gateway', 'main')).toBe(true);
    });
  });

  describe('Resource Tagging and Naming', () => {
    const taggedResources = [
      ['aws_vpc', 'main'],
      ['aws_internet_gateway', 'main'],
      ['aws_subnet', 'public'],
      ['aws_subnet', 'private_app'],
      ['aws_subnet', 'private_db'],
      ['aws_instance', 'nat_instance'],
      ['aws_eip', 'nat_instance'],
      ['aws_security_group', 'nat_instance'],
      ['aws_s3_bucket', 'vpc_flow_logs'],
      ['aws_ec2_transit_gateway', 'main']
    ];

    test.each(taggedResources)('resource %s %s has proper tagging', (resourceType, resourceName) => {
      expect(hasTagging(stackContent, resourceType, resourceName)).toBe(true);
    });

    test('resources use merge function for common tags', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('resources have descriptive names using name_prefix', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${local\.name_prefix}-[^"]+"/);
    });

    test('no hardcoded resource names in stack', () => {
      expect(stackContent).not.toMatch(/"payment-platform-dev"|"payment-platform-prod"/);
    });
  });

  describe('Required Outputs', () => {
    const requiredOutputs = [
      'vpc_id',
      'public_subnet_ids',
      'private_app_subnet_ids',
      'private_db_subnet_ids',
      'nat_instance_id',
      'transit_gateway_id',
      'transit_gateway_attachment_id',
      'vpc_flow_logs_s3_bucket',
      'integration_summary'
    ];

    test.each(requiredOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('outputs are grouped by function', () => {
      expect(outputsContent).toMatch(/VPC OUTPUTS/);
      expect(outputsContent).toMatch(/SUBNET OUTPUTS.*GROUPED BY TIER/);
      expect(outputsContent).toMatch(/NAT INSTANCE OUTPUTS/);
      expect(outputsContent).toMatch(/TRANSIT GATEWAY OUTPUTS/);
    });

    test('outputs have proper descriptions', () => {
      expect(outputsContent).toMatch(/description\s*=\s*"[^"]+"/);
    });

    test('subnet outputs grouped by tier', () => {
      expect(outputsContent).toMatch(/all_subnet_ids_by_tier[\s\S]*?public\s*=\s*aws_subnet\.public\[\*\]\.id/s);
      expect(outputsContent).toMatch(/application\s*=\s*aws_subnet\.private_app\[\*\]\.id/);
      expect(outputsContent).toMatch(/database\s*=\s*aws_subnet\.private_db\[\*\]\.id/);
    });

    test('integration summary provides comprehensive resource info', () => {
      expect(outputsContent).toMatch(/integration_summary[\s\S]*?vpc_id\s*=\s*aws_vpc\.main\.id/s);
      expect(outputsContent).toMatch(/nat_instance_id\s*=\s*aws_instance\.nat_instance\.id/);
      expect(outputsContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('Security and Compliance', () => {
    test('NAT instance security group allows traffic from private subnets only', () => {
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?cidr_blocks\s*=\s*\[local\.private_app_cidrs\[0\][\s\S]*?local\.private_db_cidrs\[1\]\]/s);
    });

    test('NAT instance security group allows HTTP and HTTPS', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80/s);
      expect(stackContent).toMatch(/from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/s);
    });

    test('NAT instance security group allows SSH from VPC', () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22[\s\S]*?cidr_blocks\s*=\s*\[local\.vpc_cidr\]/s);
    });

    test('IAM role follows least privilege principle', () => {
      expect(stackContent).toMatch(/ec2:AssociateAddress.*ec2:ModifyInstanceAttribute.*ec2:DescribeAddresses.*ec2:DescribeInstances/s);
    });

    test('S3 bucket has encryption enabled', () => {
      expect(stackContent).toMatch(/apply_server_side_encryption_by_default\s*{[\s\S]*?sse_algorithm\s*=\s*"AES256"/s);
    });

    test('all network tiers have dedicated Network ACLs', () => {
      expect(countResourceOccurrences(stackContent, 'aws_network_acl')).toBe(3);
    });
  });

  describe('Regional Independence', () => {
    test('uses data source for availability zones', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });

    test('no hardcoded availability zone references', () => {
      expect(stackContent).not.toMatch(/"eu-central-1a"|"us-east-1a"|"us-west-2a"/);
    });

    test('AMI selection is region-agnostic', () => {
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
    });

    test('resource naming uses variables not hardcoded regions', () => {
      expect(stackContent).toMatch(/var\.aws_region/);
      expect(stackContent).not.toMatch(/"eu-central-1"|"us-east-1"/);
    });
  });
});