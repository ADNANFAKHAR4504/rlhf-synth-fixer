import * as fs from 'fs';
import * as path from 'path';

describe('Terraform HTTP/HTTPS Security Group Unit Tests - Extended', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const mainTfPath = path.join(libPath, 'main.tf');
  let mainTfContent = '';

  beforeAll(() => {
    expect(fs.existsSync(mainTfPath)).toBe(true);
    mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
  });

  describe('Terraform Configuration', () => {
    test('should have terraform block with required version', () => {
      expect(mainTfContent).toMatch(/terraform\s*{[\s\S]*?required_version\s*=\s*">=\s*1\.0"/);
    });

    test('should configure AWS provider with version constraint', () => {
      expect(mainTfContent).toMatch(/aws\s*=\s*{[\s\S]*?source\s*=\s*"hashicorp\/aws"[\s\S]*?version\s*=\s*"~>\s*5\.0"/);
    });

    test('should configure random provider for unique naming', () => {
      expect(mainTfContent).toMatch(/random\s*=\s*{[\s\S]*?source\s*=\s*"hashicorp\/random"[\s\S]*?version\s*=\s*"~>\s*3\.1"/);
    });

    test('should have comprehensive header comments', () => {
      expect(mainTfContent).toMatch(/Terraform stack: Secure HTTP\/HTTPS-only Security Group/);
      expect(mainTfContent).toMatch(/Creates VPC if not provided, uses existing VPC otherwise/);
      expect(mainTfContent).toMatch(/All variables, logic, and outputs in one file/);
    });
  });

  describe('Enhanced Variables Configuration', () => {
    test('should have enhanced aws_region variable with comprehensive description', () => {
      expect(mainTfContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?description\s*=\s*"AWS region where resources will be deployed\. Used by provider configuration\."/);
      expect(mainTfContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('should support optional VPC creation with vpc_id variable', () => {
      expect(mainTfContent).toMatch(/variable\s+"vpc_id"\s*{[\s\S]*?description.*Leave empty to create a new VPC/);
      expect(mainTfContent).toMatch(/default\s*=\s*""\s*#\s*Empty means create new VPC/);
      // Fixed regex pattern to match actual content
      expect(mainTfContent).toMatch(/var\.vpc_id\s*==\s*""\s*\|\|\s*can\(regex\(".*vpc-\[a-z0-9\].*", var\.vpc_id\)\)/);
    });

    test('should have vpc_cidr variable for new VPC creation', () => {
      expect(mainTfContent).toMatch(/variable\s+"vpc_cidr"\s*{[\s\S]*?description.*CIDR block for the VPC/);
      expect(mainTfContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(mainTfContent).toMatch(/can\(cidrhost\(var\.vpc_cidr, 0\)\)/);
    });

    test('should have enhanced IPv4 CIDR variable with production warnings', () => {
      expect(mainTfContent).toMatch(/variable\s+"allowed_ipv4_cidrs"\s*{[\s\S]*?description.*avoid 0\.0\.0\.0\/0 in production/);
      expect(mainTfContent).toMatch(/default\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]\s*#\s*Default for testing - override in production/);
      expect(mainTfContent).toMatch(/length\(var\.allowed_ipv4_cidrs\)\s*>\s*0\s*&&\s*alltrue/);
    });

    test('should have security_group_name_prefix instead of security_group_name', () => {
      expect(mainTfContent).toMatch(/variable\s+"security_group_name_prefix"/);
      expect(mainTfContent).toMatch(/default\s*=\s*"app-http-https-sg"/);
      expect(mainTfContent).toMatch(/length\(var\.security_group_name_prefix\)\s*<=\s*240/);
    });

    test('should have enhanced tags with project information', () => {
      expect(mainTfContent).toMatch(/Project\s*=\s*"iac-test-automations"/);
      expect(mainTfContent).toMatch(/Owner\s*=\s*"devops"/);
      expect(mainTfContent).toMatch(/Environment\s*=\s*"dev"/);
      expect(mainTfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test('should validate security group name prefix length for suffix accommodation', () => {
      expect(mainTfContent).toMatch(/length\(var\.security_group_name_prefix\)\s*>\s*0\s*&&\s*length\(var\.security_group_name_prefix\)\s*<=\s*240/);
      expect(mainTfContent).toMatch(/must be between 1 and 240 characters to allow for suffix/);
    });

    test('should have comprehensive error messages with examples', () => {
      expect(mainTfContent).toMatch(/VPC ID must be empty \(to create new VPC\) or a valid AWS VPC identifier \(vpc-xxxxxxxx\)/);
      expect(mainTfContent).toMatch(/At least one valid IPv4 CIDR must be provided \(e\.g\., 10\.0\.0\.0\/16, 192\.168\.1\.0\/24\)/);
      expect(mainTfContent).toMatch(/VPC CIDR must be a valid CIDR notation \(e\.g\., 10\.0\.0\.0\/16\)/);
    });

    test('should use proper variable types for all inputs', () => {
      expect(mainTfContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"vpc_id"\s*{[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"vpc_cidr"\s*{[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"allowed_ipv4_cidrs"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(mainTfContent).toMatch(/variable\s+"allowed_ipv6_cidrs"\s*{[\s\S]*?type\s*=\s*list\(string\)/);
      expect(mainTfContent).toMatch(/variable\s+"allow_all_outbound"\s*{[\s\S]*?type\s*=\s*bool/);
      expect(mainTfContent).toMatch(/variable\s+"security_group_name_prefix"\s*{[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"security_group_description"\s*{[\s\S]*?type\s*=\s*string/);
      expect(mainTfContent).toMatch(/variable\s+"tags"\s*{[\s\S]*?type\s*=\s*map\(string\)/);
    });

    test('should have IPv6 CIDR variable with proper validation', () => {
      expect(mainTfContent).toMatch(/variable\s+"allowed_ipv6_cidrs"\s*{[\s\S]*?description.*Use specific networks for security/);
      expect(mainTfContent).toMatch(/default\s*=\s*\[\]/);
      expect(mainTfContent).toMatch(/All IPv6 CIDRs must be valid CIDR notation \(e\.g\., 2001:db8::\/32\)/);
    });

    test('should have comprehensive AWS region validation', () => {
      expect(mainTfContent).toMatch(/can\(regex\(".*\[a-z\]\{2\}-\[a-z\]\+-\[0-9\].*", var\.aws_region\)\)/);
      expect(mainTfContent).toMatch(/AWS region must be in valid format \(e\.g\., us-west-2, eu-central-1\)/);
    });
  });

  describe('Random Resource for Unique Naming', () => {
    test('should create random_id resource for unique naming', () => {
      expect(mainTfContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
      expect(mainTfContent).toMatch(/byte_length\s*=\s*4/);
    });

    test('should have proper section comment for random resources', () => {
      expect(mainTfContent).toMatch(/# Random Resources for Unique Naming/);
    });

    test('should use appropriate byte length for sufficient uniqueness', () => {
      expect(mainTfContent).toMatch(/byte_length\s*=\s*4/);
      // 4 bytes = 8 hex characters, which provides good uniqueness
    });
  });

  describe('Enhanced Locals Configuration', () => {
    test('should determine VPC creation based on vpc_id input', () => {
      expect(mainTfContent).toMatch(/should_create_vpc\s*=\s*var\.vpc_id\s*==\s*""/);
    });

    test('should dynamically determine VPC ID', () => {
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*local\.should_create_vpc\s*\?\s*aws_vpc\.main\[0\]\.id\s*:\s*var\.vpc_id/);
    });

    test('should create dynamic security group name with random suffix', () => {
      expect(mainTfContent).toMatch(/security_group_name\s*=\s*"\$\{var\.security_group_name_prefix\}-\$\{random_id\.suffix\.hex\}"/);
    });

    test('should maintain CIDR validation logic', () => {
      expect(mainTfContent).toMatch(/has_cidrs\s*=\s*length\(var\.allowed_ipv4_cidrs\)\s*>\s*0\s*\|\|\s*length\(var\.allowed_ipv6_cidrs\)\s*>\s*0/);
    });

    test('should have proper commenting for all local values', () => {
      expect(mainTfContent).toMatch(/# Determine whether to create VPC \(when vpc_id is empty\)/);
      expect(mainTfContent).toMatch(/# Determine which VPC to use/);
      expect(mainTfContent).toMatch(/# Dynamic security group name with random suffix/);
      expect(mainTfContent).toMatch(/# Validation: fail if both IPv4 and IPv6 CIDR lists are empty/);
    });

    test('should use consistent variable naming conventions', () => {
      expect(mainTfContent).toMatch(/should_create_vpc/);
      expect(mainTfContent).toMatch(/security_group_name/);
      expect(mainTfContent).toMatch(/has_cidrs/);
    });
  });

  describe('VPC Creation Resources', () => {
    test('should conditionally create VPC with proper configuration', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?count\s*=\s*local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should create Internet Gateway with VPC dependency', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\[0\]\.id/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
    });

    test('should create route table with internet route', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"main"/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(mainTfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\[0\]\.id/);
    });

    test('should create public subnet with proper CIDR calculation', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*cidrsubnet\(var\.vpc_cidr, 8, 1\)/);
      expect(mainTfContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('should associate route table with subnet', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(mainTfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
      expect(mainTfContent).toMatch(/route_table_id\s*=\s*aws_route_table\.main\[0\]\.id/);
    });

    test('should use proper resource naming with random suffix', () => {
      expect(mainTfContent).toMatch(/Name\s*=\s*"vpc-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"igw-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"rt-main-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"subnet-public-\$\{random_id\.suffix\.hex\}"/);
    });

    test('should add descriptive tags to all VPC resources', () => {
      expect(mainTfContent).toMatch(/Purpose\s*=\s*"Created for security group testing"/);
      expect(mainTfContent).toMatch(/Purpose\s*=\s*"Internet access for VPC"/);
      expect(mainTfContent).toMatch(/Purpose\s*=\s*"Main route table with internet access"/);
      expect(mainTfContent).toMatch(/Type\s*=\s*"Public"/);
    });

    test('should use merge function for consistent tagging', () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*merge\(var\.tags, \{/);
      const mergeCount = (mainTfContent.match(/merge\(var\.tags, \{/g) || []).length;
      expect(mergeCount).toBeGreaterThanOrEqual(5); // VPC, IGW, Route Table, Subnet, Security Group
    });

    test('should have proper commenting for VPC resources', () => {
      expect(mainTfContent).toMatch(/# Create VPC when vpc_id is not provided/);
      expect(mainTfContent).toMatch(/# Internet Gateway for the VPC/);
      expect(mainTfContent).toMatch(/# Default route table with internet access/);
      expect(mainTfContent).toMatch(/# Public subnet \(optional, for completeness\)/);
      expect(mainTfContent).toMatch(/# Associate route table with subnet/);
    });

    test('should use consistent resource naming pattern', () => {
      expect(mainTfContent).toMatch(/aws_vpc.*main/);
      expect(mainTfContent).toMatch(/aws_internet_gateway.*main/);
      expect(mainTfContent).toMatch(/aws_route_table.*main/);
      expect(mainTfContent).toMatch(/aws_subnet.*public/);
      expect(mainTfContent).toMatch(/aws_route_table_association.*public/);
    });

    test('should enable DNS features for VPC', () => {
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should use availability zone data source for subnet placement', () => {
      expect(mainTfContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    });
  });

  describe('Data Sources', () => {
    test('should get availability zones for subnet placement', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(mainTfContent).toMatch(/state\s*=\s*"available"/);
      expect(mainTfContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    });

    test('should conditionally get existing VPC data', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_vpc"\s+"selected"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.should_create_vpc\s*\?\s*0\s*:\s*1/);
      expect(mainTfContent).toMatch(/id\s*=\s*var\.vpc_id/);
    });

    test('should have proper commenting for data sources', () => {
      expect(mainTfContent).toMatch(/# Get availability zones/);
      expect(mainTfContent).toMatch(/# Get existing VPC data when using provided VPC ID/);
    });

    test('should use appropriate data source names', () => {
      expect(mainTfContent).toMatch(/aws_availability_zones.*available/);
      expect(mainTfContent).toMatch(/aws_vpc.*selected/);
    });
  });

  describe('Enhanced Security Group Configuration', () => {
    test('should create security group with dynamic name and enhanced tags', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"app_sg"/);
      expect(mainTfContent).toMatch(/name\s*=\s*local\.security_group_name/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*local\.vpc_id/);
      expect(mainTfContent).toMatch(/CreatedBy\s*=\s*"terraform-\$\{random_id\.suffix\.hex\}"/);
    });

    test('should use merge function for tags', () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*merge\(var\.tags, \{/);
      expect(mainTfContent).toMatch(/Name\s*=\s*local\.security_group_name/);
    });

    test('should have detailed ingress rule descriptions with CIDR interpolation', () => {
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow HTTP from IPv4 \$\{ingress\.value\}"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow HTTPS from IPv4 \$\{ingress\.value\}"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow HTTP from IPv6 \$\{ingress\.value\}"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow HTTPS from IPv6 \$\{ingress\.value\}"/);
    });

    test('should have enhanced egress rule descriptions for restricted mode', () => {
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow HTTPS outbound for package updates and API calls"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow HTTP outbound for package repositories"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Allow DNS outbound for name resolution"/);
    });

    test('should properly comment egress rule sections', () => {
      expect(mainTfContent).toMatch(/# Egress rules - Allow all outbound/);
      expect(mainTfContent).toMatch(/# Restricted egress rules - Only HTTP\/HTTPS outbound for updates/);
      expect(mainTfContent).toMatch(/# DNS egress for name resolution \(required for most applications\)/);
    });

    test('should use dynamic blocks for all ingress rules', () => {
      const dynamicIngressBlocks = mainTfContent.match(/dynamic\s+"ingress"/g) || [];
      expect(dynamicIngressBlocks.length).toBe(4); // IPv4 HTTP, IPv4 HTTPS, IPv6 HTTP, IPv6 HTTPS
    });

    test('should use dynamic blocks for all egress rules', () => {
      const dynamicEgressBlocks = mainTfContent.match(/dynamic\s+"egress"/g) || [];
      expect(dynamicEgressBlocks.length).toBeGreaterThanOrEqual(4); // All outbound + restricted rules
    });

    test('should have proper port configurations', () => {
      expect(mainTfContent).toMatch(/from_port\s*=\s*80/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*80/);
      expect(mainTfContent).toMatch(/from_port\s*=\s*443/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*443/);
      expect(mainTfContent).toMatch(/from_port\s*=\s*53/);
      expect(mainTfContent).toMatch(/to_port\s*=\s*53/);
    });


    test('should have proper IPv4 and IPv6 CIDR block configurations', () => {
      expect(mainTfContent).toMatch(/cidr_blocks\s*=\s*\[ingress\.value\]/);
      expect(mainTfContent).toMatch(/ipv6_cidr_blocks\s*=\s*\[ingress\.value\]/);
    });

    test('should depend on CIDR validation resource', () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[\s*null_resource\.validate_cidrs\s*\]/);
    });
  });

  describe('Enhanced Outputs Configuration', () => {
    test('should output VPC-related information', () => {
      expect(mainTfContent).toMatch(/output\s+"vpc_id"\s*{[\s\S]*?value\s*=\s*local\.vpc_id/);
      expect(mainTfContent).toMatch(/output\s+"vpc_cidr_block"/);
      expect(mainTfContent).toMatch(/output\s+"vpc_created"/);
      expect(mainTfContent).toMatch(/output\s+"internet_gateway_id"/);
      expect(mainTfContent).toMatch(/output\s+"public_subnet_id"/);
    });

    test('should have conditional VPC CIDR output logic', () => {
      expect(mainTfContent).toMatch(/value\s*=\s*local\.should_create_vpc\s*\?\s*aws_vpc\.main\[0\]\.cidr_block\s*:\s*data\.aws_vpc\.selected\[0\]\.cidr_block/);
    });

    test('should output boolean flag for VPC creation', () => {
      expect(mainTfContent).toMatch(/value\s*=\s*local\.should_create_vpc/);
    });

    test('should output conditional Internet Gateway ID', () => {
      expect(mainTfContent).toMatch(/value\s*=\s*local\.should_create_vpc\s*\?\s*aws_internet_gateway\.main\[0\]\.id\s*:\s*null/);
    });

    test('should reference app_sg instead of http_https_sg', () => {
      expect(mainTfContent).toMatch(/value\s*=\s*aws_security_group\.app_sg\.id/);
      expect(mainTfContent).toMatch(/value\s*=\s*aws_security_group\.app_sg\.arn/);
      expect(mainTfContent).toMatch(/value\s*=\s*aws_security_group\.app_sg\.name/);
      expect(mainTfContent).toMatch(/length\(aws_security_group\.app_sg\.ingress\)/);
    });

    test('should output deployment metadata', () => {
      expect(mainTfContent).toMatch(/output\s+"aws_region"\s*{[\s\S]*?value\s*=\s*var\.aws_region/);
      expect(mainTfContent).toMatch(/output\s+"random_suffix"\s*{[\s\S]*?value\s*=\s*random_id\.suffix\.hex/);
    });

    test('should have descriptive output descriptions', () => {
      expect(mainTfContent).toMatch(/description\s*=\s*"The ID of the VPC where the security group was created"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Whether a new VPC was created by this module"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"Random suffix used for resource naming"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"AWS region where resources were deployed"/);
    });

    test('should have comprehensive ingress rules summary output', () => {
      expect(mainTfContent).toMatch(/output\s+"ingress_rules_summary"/);
      expect(mainTfContent).toMatch(/total_rules\s*=\s*length\(aws_security_group\.app_sg\.ingress\)/);
      expect(mainTfContent).toMatch(/for rule in aws_security_group\.app_sg\.ingress/);
      expect(mainTfContent).toMatch(/port\s*=\s*"\$\{rule\.from_port\}-\$\{rule\.to_port\}"/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*rule\.protocol/);
      expect(mainTfContent).toMatch(/description\s*=\s*rule\.description/);
      expect(mainTfContent).toMatch(/cidrs\s*=\s*coalescelist\(rule\.cidr_blocks, rule\.ipv6_cidr_blocks\)/);
    });

    test('should output all required security group attributes', () => {
      expect(mainTfContent).toMatch(/output\s+"security_group_id"/);
      expect(mainTfContent).toMatch(/output\s+"security_group_arn"/);
      expect(mainTfContent).toMatch(/output\s+"security_group_name"/);
    });

    test('should have proper null handling for conditional outputs', () => {
      expect(mainTfContent).toMatch(/:\s*null/); // For IGW and subnet IDs when VPC not created
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('should have proper dependency chain for VPC resources', () => {
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\[0\]\.id/); // IGW depends on VPC
      expect(mainTfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\[0\]\.id/); // Route depends on IGW
    });

    test('should use conditional count across all VPC resources', () => {
      const conditionalResources = ['aws_vpc', 'aws_internet_gateway', 'aws_route_table', 'aws_subnet', 'aws_route_table_association'];
      conditionalResources.forEach(resource => {
        expect(mainTfContent).toMatch(new RegExp(`resource\\s+"${resource}"[\\s\\S]*?count\\s*=\\s*local\\.should_create_vpc\\s*\\?\\s*1\\s*:\\s*0`));
      });
    });

    test('should reference random_id in multiple places', () => {
      expect(mainTfContent).toMatch(/random_id\.suffix\.hex/);
      const randomIdReferences = mainTfContent.match(/random_id\.suffix\.hex/g) || [];
      expect(randomIdReferences.length).toBeGreaterThan(5);
    });

    test('should maintain security group dependency on CIDR validation', () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[\s*null_resource\.validate_cidrs\s*\]/);
    });

    test('should use proper resource referencing syntax', () => {
      expect(mainTfContent).toMatch(/aws_vpc\.main\[0\]\.id/);
      expect(mainTfContent).toMatch(/aws_internet_gateway\.main\[0\]\.id/);
      expect(mainTfContent).toMatch(/aws_route_table\.main\[0\]\.id/);
      expect(mainTfContent).toMatch(/aws_subnet\.public\[0\]\.id/);
    });

    test('should have explicit dependency declarations where needed', () => {
      expect(mainTfContent).toMatch(/depends_on/);
    });
  });

  describe('Advanced Terraform Features', () => {
    test('should use cidrsubnet function for subnet calculation', () => {
      expect(mainTfContent).toMatch(/cidrsubnet\(var\.vpc_cidr, 8, 1\)/);
    });

    test('should use merge function for tag combination', () => {
      expect(mainTfContent).toMatch(/merge\(var\.tags, \{/);
    });

    test('should use coalescelist in ingress rules summary', () => {
      expect(mainTfContent).toMatch(/coalescelist\(rule\.cidr_blocks, rule\.ipv6_cidr_blocks\)/);
    });

    test('should use conditional expressions for resource creation', () => {
      expect(mainTfContent).toMatch(/local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
      expect(mainTfContent).toMatch(/local\.should_create_vpc\s*\?\s*0\s*:\s*1/);
      expect(mainTfContent).toMatch(/var\.allow_all_outbound\s*\?\s*\[1\]\s*:\s*\[\]/);
    });

    test('should use proper interpolation syntax', () => {
      expect(mainTfContent).toMatch(/\$\{var\.security_group_name_prefix\}-\$\{random_id\.suffix\.hex\}/);
      expect(mainTfContent).toMatch(/\$\{rule\.from_port\}-\$\{rule\.to_port\}/);
    });

    test('should use for expressions in validation and outputs', () => {
      expect(mainTfContent).toMatch(/for cidr in var\.allowed_ipv4_cidrs/);
      expect(mainTfContent).toMatch(/for cidr in var\.allowed_ipv6_cidrs/);
      expect(mainTfContent).toMatch(/for rule in aws_security_group\.app_sg\.ingress/);
    });

    test('should use alltrue function for list validation', () => {
      expect(mainTfContent).toMatch(/alltrue\(\[/);
    });

    test('should use can function for validation', () => {
      expect(mainTfContent).toMatch(/can\(regex\(/);
      expect(mainTfContent).toMatch(/can\(cidrhost\(/);
    });

    test('should use length function for validation and logic', () => {
      expect(mainTfContent).toMatch(/length\(var\.allowed_ipv4_cidrs\)/);
      expect(mainTfContent).toMatch(/length\(var\.allowed_ipv6_cidrs\)/);
      expect(mainTfContent).toMatch(/length\(var\.security_group_name_prefix\)/);
      expect(mainTfContent).toMatch(/length\(var\.security_group_description\)/);
    });
  });

  describe('Security and Compliance Enhanced', () => {
    test('should warn about production CIDR usage', () => {
      expect(mainTfContent).toMatch(/avoid 0\.0\.0\.0\/0 in production/);
      expect(mainTfContent).toMatch(/Default for testing - override in production/);
      expect(mainTfContent).toMatch(/recommended for production/);
    });

    test('should validate against empty VPC ID or valid format', () => {
      // Fixed regex pattern to match actual content without over-escaping
      expect(mainTfContent).toMatch(/var\.vpc_id\s*==\s*""\s*\|\|\s*can\(regex\(".*vpc-\[a-z0-9\].*", var\.vpc_id\)\)/);
    });

    test('should maintain restrictive egress options', () => {
      expect(mainTfContent).toMatch(/Set to false for restricted egress \(recommended for production\)/);
    });

    test('should enforce minimum CIDR requirements', () => {
      expect(mainTfContent).toMatch(/length\(var\.allowed_ipv4_cidrs\)\s*>\s*0/);
      expect(mainTfContent).toMatch(/At least one valid IPv4 CIDR must be provided/);
    });

    test('should not allow dangerous inbound ports by default', () => {
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*22/); // SSH
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*3389/); // RDP
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*21/); // FTP
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*23/); // Telnet
    });

    test('should use secure default configurations', () => {
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(mainTfContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });


    test('should have proper access control for egress traffic', () => {
      expect(mainTfContent).toMatch(/Allow all outbound traffic/);
      expect(mainTfContent).toMatch(/Allow HTTPS outbound for package updates and API calls/);
      expect(mainTfContent).toMatch(/Allow HTTP outbound for package repositories/);
      expect(mainTfContent).toMatch(/Allow DNS outbound for name resolution/);
    });
  });

  describe('Code Organization and Documentation', () => {
    test('should have proper section organization with enhanced comments', () => {
      const sections = [
        'Variables',
        'Random Resources for Unique Naming',
        'Locals and Validation',
        'VPC Creation \\(Optional\\)',
        'Data Sources',
        'Validation',
        'Security Groups',
        'Outputs'
      ];
      
      sections.forEach(section => {
        expect(mainTfContent).toMatch(new RegExp(`#\\s*${section}`));
      });
    });

    test('should have comprehensive inline comments', () => {
      expect(mainTfContent).toMatch(/# Empty means create new VPC/);
      expect(mainTfContent).toMatch(/# Default for testing - override in production/);
      expect(mainTfContent).toMatch(/# Determine whether to create VPC/);
      expect(mainTfContent).toMatch(/# Dynamic security group name with random suffix/);
    });

    test('should maintain consistent naming patterns', () => {
      expect(mainTfContent).toMatch(/vpc-\$\{random_id\.suffix\.hex\}/);
      expect(mainTfContent).toMatch(/igw-\$\{random_id\.suffix\.hex\}/);
      expect(mainTfContent).toMatch(/rt-main-\$\{random_id\.suffix\.hex\}/);
      expect(mainTfContent).toMatch(/subnet-public-\$\{random_id\.suffix\.hex\}/);
    });

    test('should use descriptive resource and variable names', () => {
      expect(mainTfContent).toMatch(/security_group_name_prefix/);
      expect(mainTfContent).toMatch(/should_create_vpc/);
      expect(mainTfContent).toMatch(/aws_availability_zones.*available/);
    });

    test('should have proper file structure with clear sections', () => {
      expect(mainTfContent).toMatch(/########################/);
      const sectionDividers = mainTfContent.match(/########################/g) || [];
      expect(sectionDividers.length).toBeGreaterThanOrEqual(6);
    });

    test('should have comprehensive file header', () => {
      expect(mainTfContent).toMatch(/###########################################################/);
      expect(mainTfContent).toMatch(/# main\.tf/);
      expect(mainTfContent).toMatch(/# Terraform stack: Secure HTTP\/HTTPS-only Security Group/);
    });

    test('should have consistent comment formatting', () => {
      expect(mainTfContent).toMatch(/# Variables/);
      expect(mainTfContent).toMatch(/# Locals and Validation/);
      expect(mainTfContent).toMatch(/# Security Groups/);
      expect(mainTfContent).toMatch(/# Outputs/);
    });
  });

  describe('Error Handling and Validation Enhanced', () => {
    test('should have comprehensive validation error messages', () => {
      expect(mainTfContent).toMatch(/AWS region must be in valid format \(e\.g\., us-west-2, eu-central-1\)/);
      expect(mainTfContent).toMatch(/VPC ID must be empty \(to create new VPC\) or a valid AWS VPC identifier/);
      expect(mainTfContent).toMatch(/Security group name prefix must be between 1 and 240 characters to allow for suffix/);
    });

    test('should validate VPC CIDR format', () => {
      expect(mainTfContent).toMatch(/VPC CIDR must be a valid CIDR notation/);
      expect(mainTfContent).toMatch(/can\(cidrhost\(var\.vpc_cidr, 0\)\)/);
    });

    test('should maintain CIDR validation with enhanced error messages', () => {
      expect(mainTfContent).toMatch(/At least one valid IPv4 CIDR must be provided/);
      expect(mainTfContent).toMatch(/All IPv6 CIDRs must be valid CIDR notation/);
    });

    test('should use lifecycle preconditions for runtime validation', () => {
      expect(mainTfContent).toMatch(/lifecycle\s*\{[\s\S]*?precondition/);
      expect(mainTfContent).toMatch(/condition\s*=\s*local\.has_cidrs/);
    });

    test('should have null_resource for custom validation', () => {
      expect(mainTfContent).toMatch(/resource\s+"null_resource"\s+"validate_cidrs"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.has_cidrs\s*\?\s*0\s*:\s*1/);
      expect(mainTfContent).toMatch(/ERROR: Both allowed_ipv4_cidrs and allowed_ipv6_cidrs are empty/);
    });

    test('should provide helpful validation examples', () => {
      expect(mainTfContent).toMatch(/e\.g\., us-west-2, eu-central-1/);
      expect(mainTfContent).toMatch(/vpc-xxxxxxxx/);
      expect(mainTfContent).toMatch(/10\.0\.0\.0\/16, 192\.168\.1\.0\/24/);
      expect(mainTfContent).toMatch(/2001:db8::\/32/);
    });

    test('should validate string lengths appropriately', () => {
      expect(mainTfContent).toMatch(/length\(var\.security_group_name_prefix\)\s*>\s*0/);
      expect(mainTfContent).toMatch(/length\(var\.security_group_name_prefix\)\s*<=\s*240/);
      expect(mainTfContent).toMatch(/length\(var\.security_group_description\)\s*>\s*0/);
      expect(mainTfContent).toMatch(/length\(var\.security_group_description\)\s*<=\s*255/);
    });
  });

  describe('Integration and Compatibility', () => {
    test('should support both new and existing VPC scenarios', () => {
      expect(mainTfContent).toMatch(/Create VPC when vpc_id is not provided/);
      expect(mainTfContent).toMatch(/Get existing VPC data when using provided VPC ID/);
    });

    test('should provide comprehensive output for integration', () => {
      const outputs = ['vpc_id', 'vpc_cidr_block', 'vpc_created', 'internet_gateway_id', 'public_subnet_id', 'security_group_id', 'security_group_arn', 'security_group_name', 'ingress_rules_summary', 'aws_region', 'random_suffix'];
      outputs.forEach(output => {
        expect(mainTfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });

    test('should maintain backward compatibility in core functionality', () => {
      // Core security group functionality should remain
      expect(mainTfContent).toMatch(/from_port\s*=\s*80/);
      expect(mainTfContent).toMatch(/from_port\s*=\s*443/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(mainTfContent).toMatch(/dynamic\s+"ingress"/);
      expect(mainTfContent).toMatch(/dynamic\s+"egress"/);
    });

    test('should support infrastructure scaling with unique naming', () => {
      expect(mainTfContent).toMatch(/random_id.*suffix/);
      expect(mainTfContent).toMatch(/byte_length\s*=\s*4/);
      expect(mainTfContent).toMatch(/terraform-\$\{random_id\.suffix\.hex\}/);
    });

    test('should be compatible with Terraform AWS provider v5.x', () => {
      expect(mainTfContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should support multi-region deployment through variables', () => {
      expect(mainTfContent).toMatch(/var\.aws_region/);
      expect(mainTfContent).toMatch(/AWS region where resources will be deployed/);
    });

    test('should enable easy module integration', () => {
      expect(mainTfContent).toMatch(/output.*vpc_id/);
      expect(mainTfContent).toMatch(/output.*security_group_id/);
      expect(mainTfContent).toMatch(/output.*security_group_arn/);
    });
  });

  describe('Performance and Best Practices', () => {
    test('should use efficient conditional resource creation', () => {
      expect(mainTfContent).toMatch(/count\s*=\s*local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.should_create_vpc\s*\?\s*0\s*:\s*1/);
    });

    test('should use dynamic blocks for rule management', () => {
      const dynamicBlocks = mainTfContent.match(/dynamic\s+"/g) || [];
      expect(dynamicBlocks.length).toBeGreaterThanOrEqual(8); // 4 ingress + 4+ egress
    });

    test('should minimize hardcoded values', () => {
      expect(mainTfContent).toMatch(/var\.vpc_cidr/);
      expect(mainTfContent).toMatch(/var\.security_group_name_prefix/);
      expect(mainTfContent).toMatch(/var\.security_group_description/);
      expect(mainTfContent).toMatch(/var\.tags/);
    });

    test('should use appropriate data sources to reduce API calls', () => {
      expect(mainTfContent).toMatch(/data.*aws_availability_zones/);
      expect(mainTfContent).toMatch(/data.*aws_vpc/);
    });

    test('should follow Terraform naming conventions', () => {
      expect(mainTfContent).toMatch(/aws_vpc.*main/);
      expect(mainTfContent).toMatch(/aws_security_group.*app_sg/);
      expect(mainTfContent).toMatch(/random_id.*suffix/);
    });

    test('should use locals to avoid repeated calculations', () => {
      expect(mainTfContent).toMatch(/locals\s*\{/);
      expect(mainTfContent).toMatch(/should_create_vpc/);
      expect(mainTfContent).toMatch(/security_group_name/);
      expect(mainTfContent).toMatch(/has_cidrs/);
    });
  });

  describe('Terraform State Management', () => {
    test('should use appropriate resource naming for state management', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"app_sg"/);
      expect(mainTfContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
    });

    test('should avoid resource name conflicts with unique suffixes', () => {
      expect(mainTfContent).toMatch(/random_id\.suffix\.hex/);
      expect(mainTfContent).toMatch(/\$\{var\.security_group_name_prefix\}-\$\{random_id\.suffix\.hex\}/);
    });

    test('should use count appropriately to manage resource lifecycle', () => {
      expect(mainTfContent).toMatch(/count\s*=\s*local\.should_create_vpc/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.has_cidrs/);
    });

    test('should reference resources consistently', () => {
      expect(mainTfContent).toMatch(/aws_vpc\.main\[0\]/);
      expect(mainTfContent).toMatch(/aws_security_group\.app_sg/);
      expect(mainTfContent).toMatch(/random_id\.suffix/);
    });
  });

  describe('Multi-Environment Support', () => {
    test('should support different environments through tags', () => {
      expect(mainTfContent).toMatch(/Environment\s*=\s*"dev"/);
      expect(mainTfContent).toMatch(/variable\s+"tags"/);
      expect(mainTfContent).toMatch(/merge\(var\.tags/);
    });

    test('should allow environment-specific configuration', () => {
      expect(mainTfContent).toMatch(/var\.allow_all_outbound/);
      expect(mainTfContent).toMatch(/var\.allowed_ipv4_cidrs/);
      expect(mainTfContent).toMatch(/var\.security_group_name_prefix/);
    });

    test('should provide flexibility for different deployment scenarios', () => {
      expect(mainTfContent).toMatch(/Leave empty to create a new VPC/);
      expect(mainTfContent).toMatch(/Set to false for restricted egress/);
      expect(mainTfContent).toMatch(/Default for testing - override in production/);
    });

    test('should support project identification through tags', () => {
      expect(mainTfContent).toMatch(/Project\s*=\s*"iac-test-automations"/);
      expect(mainTfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(mainTfContent).toMatch(/Owner\s*=\s*"devops"/);
    });
  });
});