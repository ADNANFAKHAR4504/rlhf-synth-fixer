import * as fs from 'fs';
import * as path from 'path';

describe('Terraform HTTP/HTTPS Security Group Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const mainTfPath = path.join(libPath, 'main.tf');
  let mainTfContent = '';

  beforeAll(() => {
    expect(fs.existsSync(mainTfPath)).toBe(true);
    mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
  });

  describe('Provider Configuration', () => {
    test('should have required providers configured', () => {
      expect(mainTfContent).toMatch(/terraform\s*{[\s\S]*required_providers\s*{[\s\S]*aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/);
      expect(mainTfContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('should have minimum Terraform version requirement', () => {
      expect(mainTfContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test('should have random provider configured', () => {
      expect(mainTfContent).toMatch(/random\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/random"[\s\S]*version\s*=\s*"~>\s*3\.1"/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable with default us-west-2', () => {
      expect(mainTfContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?default\s*=\s*"us-west-2"/);
      expect(mainTfContent).toMatch(/description\s*=\s*"AWS region where resources will be deployed/);
    });

    test('should define vpc_id variable with empty string default (not null)', () => {
      const vpcVarMatch = mainTfContent.match(/variable\s+"vpc_id"\s*{[\s\S]*?}/);
      expect(vpcVarMatch).toBeTruthy();
      expect(vpcVarMatch![0]).toMatch(/default\s*=\s*""/);
      expect(vpcVarMatch![0]).toMatch(/validation\s*{[\s\S]*vpc-\[a-z0-9\]/);
    });

    test('should define VPC and subnet CIDR variables', () => {
      expect(mainTfContent).toMatch(/variable\s+"vpc_cidr"\s*{[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should define IPv4 CIDR variable with world-open default', () => {
      expect(mainTfContent).toMatch(/variable\s+"allowed_ipv4_cidrs"\s*{[\s\S]*?default\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
      expect(mainTfContent).toMatch(/validation\s*{[\s\S]*length\(var\.allowed_ipv4_cidrs\)\s*>\s*0/);
    });

    test('should define IPv6 CIDR variable with empty default', () => {
      expect(mainTfContent).toMatch(/variable\s+"allowed_ipv6_cidrs"\s*{[\s\S]*?default\s*=\s*\[\]/);
    });

    test('should define security group configuration variables', () => {
      expect(mainTfContent).toMatch(/variable\s+"allow_all_outbound"\s*{[\s\S]*?default\s*=\s*true/);
      expect(mainTfContent).toMatch(/variable\s+"security_group_name_prefix"\s*{[\s\S]*?default\s*=\s*"app-http-https-sg"/);
      expect(mainTfContent).toMatch(/variable\s+"security_group_description"/);
    });

    test('should define tags variable with comprehensive defaults', () => {
      const tagsVar = mainTfContent.match(/variable\s+"tags"\s*{[\s\S]*?}/);
      expect(tagsVar).toBeTruthy();
      expect(tagsVar![0]).toMatch(/Owner\s*=\s*"devops"/);
      expect(tagsVar![0]).toMatch(/Environment\s*=\s*"dev"/);
      expect(tagsVar![0]).toMatch(/Project\s*=\s*"iac-test-automations"/);
      expect(tagsVar![0]).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe('Random Resources and Locals', () => {
    test('should create random_id for unique naming', () => {
      expect(mainTfContent).toMatch(/resource\s+"random_id"\s+"suffix"\s*{[\s\S]*byte_length\s*=\s*4/);
    });

    test('should define locals with VPC creation logic', () => {
      expect(mainTfContent).toMatch(/locals\s*{[\s\S]*should_create_vpc\s*=\s*var\.vpc_id\s*==\s*""/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*local\.should_create_vpc\s*\?\s*aws_vpc\.main\[0\]\.id\s*:\s*var\.vpc_id/);
      expect(mainTfContent).toMatch(/security_group_name\s*=\s*"\$\{var\.security_group_name_prefix\}-\$\{random_id\.suffix\.hex\}"/);
    });

    test('should have CIDR validation logic', () => {
      expect(mainTfContent).toMatch(/has_cidrs\s*=\s*length\(var\.allowed_ipv4_cidrs\)\s*>\s*0\s*\|\|\s*length\(var\.allowed_ipv6_cidrs\)\s*>\s*0/);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should create VPC conditionally', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*count\s*=\s*local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should create Internet Gateway conditionally', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*count\s*=\s*local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\[0\]\.id/);
    });

    test('should create route table and subnet', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"main"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test('should have data sources for availability zones and existing VPC', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(mainTfContent).toMatch(/data\s+"aws_vpc"\s+"selected"\s*{[\s\S]*count\s*=\s*local\.should_create_vpc\s*\?\s*0\s*:\s*1/);
    });
  });

  describe('CIDR Validation Logic', () => {
    test('should have null_resource for CIDR validation', () => {
      expect(mainTfContent).toMatch(/resource\s+"null_resource"\s+"validate_cidrs"/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.has_cidrs\s*\?\s*0\s*:\s*1/);
      expect(mainTfContent).toMatch(/precondition\s*{[\s\S]*condition\s*=\s*local\.has_cidrs/);
      expect(mainTfContent).toMatch(/error_message\s*=\s*"ERROR:.*both.*empty/i);
    });
  });

  describe('Security Group Configuration', () => {
    test('should create security group with proper configuration', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"app_sg"/);
      expect(mainTfContent).toMatch(/name\s*=\s*local\.security_group_name/);
      expect(mainTfContent).toMatch(/description\s*=\s*var\.security_group_description/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*local\.vpc_id/);
      expect(mainTfContent).toMatch(/tags\s*=\s*merge\(var\.tags/);
    });

    test('should have HTTP ingress rules for IPv4', () => {
      const httpV4 = mainTfContent.match(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*var\.allowed_ipv4_cidrs[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?cidr_blocks\s*=\s*\[ingress\.value\]/);
      expect(httpV4).toBeTruthy();
    });

    test('should have HTTPS ingress rules for IPv4', () => {
      const httpsV4 = mainTfContent.match(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*var\.allowed_ipv4_cidrs[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?cidr_blocks\s*=\s*\[ingress\.value\]/);
      expect(httpsV4).toBeTruthy();
    });

    test('should have HTTP and HTTPS ingress rules for IPv6', () => {
      expect(mainTfContent).toMatch(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*var\.allowed_ipv6_cidrs[\s\S]*?from_port\s*=\s*80[\s\S]*?ipv6_cidr_blocks\s*=\s*\[ingress\.value\]/);
      expect(mainTfContent).toMatch(/dynamic\s+"ingress"\s*{[\s\S]*?for_each\s*=\s*var\.allowed_ipv6_cidrs[\s\S]*?from_port\s*=\s*443[\s\S]*?ipv6_cidr_blocks\s*=\s*\[ingress\.value\]/);
    });

    test('should have configurable egress rules', () => {
      // All outbound when allow_all_outbound = true
      expect(mainTfContent).toMatch(/dynamic\s+"egress"\s*{[\s\S]*?for_each\s*=\s*var\.allow_all_outbound\s*\?\s*\[1\]\s*:\s*\[\][\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/);
      
      // Restricted outbound when allow_all_outbound = false
      expect(mainTfContent).toMatch(/dynamic\s+"egress"\s*{[\s\S]*?for_each\s*=\s*var\.allow_all_outbound\s*\?\s*\[\]\s*:\s*\[1\][\s\S]*?from_port\s*=\s*443/);
      expect(mainTfContent).toMatch(/dynamic\s+"egress"\s*{[\s\S]*?for_each\s*=\s*var\.allow_all_outbound\s*\?\s*\[\]\s*:\s*\[1\][\s\S]*?from_port\s*=\s*80/);
      expect(mainTfContent).toMatch(/dynamic\s+"egress"\s*{[\s\S]*?for_each\s*=\s*var\.allow_all_outbound\s*\?\s*\[\]\s*:\s*\[1\][\s\S]*?from_port\s*=\s*53/);
    });

    test('should depend on CIDR validation', () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[\s*null_resource\.validate_cidrs\s*\]/);
    });
  });

  describe('Outputs Configuration', () => {
    test('should output VPC and networking information', () => {
      expect(mainTfContent).toMatch(/output\s+"vpc_id"\s*{[\s\S]*?value\s*=\s*local\.vpc_id/);
      expect(mainTfContent).toMatch(/output\s+"vpc_cidr_block"/);
      expect(mainTfContent).toMatch(/output\s+"vpc_created"\s*{[\s\S]*?value\s*=\s*local\.should_create_vpc/);
      expect(mainTfContent).toMatch(/output\s+"internet_gateway_id"/);
      expect(mainTfContent).toMatch(/output\s+"public_subnet_id"/);
    });

    test('should output security group information', () => {
      expect(mainTfContent).toMatch(/output\s+"security_group_id"\s*{[\s\S]*?value\s*=\s*aws_security_group\.app_sg\.id/);
      expect(mainTfContent).toMatch(/output\s+"security_group_arn"\s*{[\s\S]*?value\s*=\s*aws_security_group\.app_sg\.arn/);
      expect(mainTfContent).toMatch(/output\s+"security_group_name"\s*{[\s\S]*?value\s*=\s*aws_security_group\.app_sg\.name/);
    });

    test('should output ingress rules summary', () => {
      expect(mainTfContent).toMatch(/output\s+"ingress_rules_summary"\s*{[\s\S]*?value\s*=\s*{[\s\S]*?total_rules\s*=\s*length\(aws_security_group\.app_sg\.ingress\)/);
      expect(mainTfContent).toMatch(/for\s+rule\s+in\s+aws_security_group\.app_sg\.ingress/);
    });

    test('should output aws_region and random_suffix', () => {
      expect(mainTfContent).toMatch(/output\s+"aws_region"\s*{[\s\S]*?value\s*=\s*var\.aws_region/);
      expect(mainTfContent).toMatch(/output\s+"random_suffix"\s*{[\s\S]*?value\s*=\s*random_id\.suffix\.hex/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use proper naming with random suffix', () => {
      expect(mainTfContent).toMatch(/Name\s*=\s*"vpc-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"igw-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"rt-main-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"subnet-public-\$\{random_id\.suffix\.hex\}"/);
    });

    test('security group should use prefix with random suffix', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*local\.security_group_name/);
      expect(mainTfContent).toMatch(/security_group_name\s*=\s*"\$\{var\.security_group_name_prefix\}-\$\{random_id\.suffix\.hex\}"/);
    });
  });

  describe('High Availability and Architecture', () => {
    test('should support conditional VPC creation', () => {
      expect(mainTfContent).toMatch(/should_create_vpc\s*=\s*var\.vpc_id\s*==\s*""/);
      expect(mainTfContent).toMatch(/count\s*=\s*local\.should_create_vpc\s*\?\s*1\s*:\s*0/);
    });

    test('should use availability zones data source', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{[\s\S]*state\s*=\s*"available"/);
      expect(mainTfContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
    });
  });

  describe('Security Best Practices', () => {
    test('should only allow HTTP and HTTPS inbound traffic', () => {
      const ingressRules = mainTfContent.match(/dynamic\s+"ingress"/g) || [];
      expect(ingressRules.length).toBe(4); // 2 for IPv4 (80,443), 2 for IPv6 (80,443)
      
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*22/); // No SSH
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*3389/); // No RDP
      expect(mainTfContent).not.toMatch(/from_port\s*=\s*0[\s\S]*?to_port\s*=\s*65535/); // No wide port ranges in ingress
    });

    test('should have proper DNS and internet access configuration', () => {
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*gateway_id/);
    });

    test('should use secure defaults with override capability', () => {
      // World-open default for testing but clearly marked for production override
      expect(mainTfContent).toMatch(/default\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\][\s\S]*Default for testing - override in production/);
      expect(mainTfContent).toMatch(/allow_all_outbound[\s\S]*recommended for production/);
    });
  });

  describe('Tagging Compliance', () => {
    test('all resources should use merge with var.tags', () => {
      const merges = mainTfContent.match(/tags\s*=\s*merge\(var\.tags/g) || [];
      expect(merges.length).toBeGreaterThan(5); // VPC, IGW, RT, Subnet, SG
    });

    test('should use consistent tagging strategy with metadata', () => {
      expect(mainTfContent).toMatch(/CreatedBy\s*=\s*"terraform-\$\{random_id\.suffix\.hex\}"/);
      expect(mainTfContent).toMatch(/Purpose\s*=\s*"Created for security group testing"/);
    });
  });

  describe('Infrastructure Requirements Compliance', () => {
    test('should have proper file structure with provider requirements', () => {
      expect(mainTfContent).toMatch(/terraform\s*{[\s\S]*required_version/);
      expect(mainTfContent).toMatch(/required_providers[\s\S]*aws[\s\S]*random/);
    });

    test('should include comprehensive validation', () => {
      const validations = mainTfContent.match(/validation\s*{/g) || [];
      expect(validations.length).toBeGreaterThanOrEqual(6); // aws_region, vpc_id, vpc_cidr, ipv4_cidrs, ipv6_cidrs, sg_name_prefix, sg_description
    });

    test('should support both new VPC creation and existing VPC usage', () => {
      expect(mainTfContent).toMatch(/Leave empty to create a new VPC/);
      expect(mainTfContent).toMatch(/only used when creating a new VPC/);
      expect(mainTfContent).toMatch(/local\.should_create_vpc\s*\?\s*aws_vpc\.main\[0\]\.id\s*:\s*var\.vpc_id/);
    });
  });

  describe('Dynamic Configuration Support', () => {
    test('should support dynamic ingress based on CIDR lists', () => {
      expect(mainTfContent).toMatch(/for_each\s*=\s*var\.allowed_ipv4_cidrs/);
      expect(mainTfContent).toMatch(/for_each\s*=\s*var\.allowed_ipv6_cidrs/);
    });

    test('should support configurable egress policies', () => {
      expect(mainTfContent).toMatch(/for_each\s*=\s*var\.allow_all_outbound\s*\?\s*\[1\]\s*:\s*\[\]/);
      expect(mainTfContent).toMatch(/for_each\s*=\s*var\.allow_all_outbound\s*\?\s*\[\]\s*:\s*\[1\]/);
    });

    test('should handle conditional resource creation properly', () => {
      const conditionalResources = ['aws_vpc', 'aws_internet_gateway', 'aws_route_table', 'aws_subnet', 'aws_route_table_association'];
      conditionalResources.forEach(resource => {
        expect(mainTfContent).toMatch(new RegExp(`resource\\s+"${resource}"[\\s\\S]*count\\s*=\\s*local\\.should_create_vpc\\s*\\?\\s*1\\s*:\\s*0`));
      });
    });
  });
});