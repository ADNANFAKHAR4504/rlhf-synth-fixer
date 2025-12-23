// test/terraform.unit.test.ts
// Unit tests for 3-Tier VPC Architecture
// Tests Terraform file structure and configuration without deployment

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('3-Tier VPC Architecture - Unit Tests', () => {
  describe('File Structure', () => {
    test('main.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'main.tf'));
      expect(exists).toBe(true);
    });

    test('variables.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'variables.tf'));
      expect(exists).toBe(true);
    });

    test('outputs.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'outputs.tf'));
      expect(exists).toBe(true);
    });

    test('provider.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'provider.tf'));
      expect(exists).toBe(true);
    });

    test('security_groups.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'security_groups.tf'));
      expect(exists).toBe(true);
    });

    test('network_acls.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'network_acls.tf'));
      expect(exists).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toMatch(/provider\s+"aws"/);
    });

    test('Terraform version is specified', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toMatch(/required_version/);
    });

    test('AWS provider version is specified', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toMatch(/hashicorp\/aws/);
    });
  });

  describe('VPC Resources', () => {
    test('VPC resource is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('VPC has DNS support enabled', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('VPC has DNS hostnames enabled', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('Internet Gateway is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('Public subnets are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('Private subnets are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('Isolated subnets are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"isolated"/);
    });

    test('NAT Gateways are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('Elastic IPs for NAT gateways are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_eip"/);
    });

    test('Route tables are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_route_table"/);
    });

    test('Route table associations are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test('Routes are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_route"/);
    });
  });

  describe('Security Groups', () => {
    test('security_groups.tf contains security group resources', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_security_group"/);
    });

    test('Web tier security group is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');
      expect(content).toMatch(/web/i);
    });

    test('App tier security group is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');
      expect(content).toMatch(/app/i);
    });

    test('Data tier security group is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');
      expect(content).toMatch(/data/i);
    });
  });

  describe('Network ACLs', () => {
    test('network_acls.tf contains ACL resources', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'network_acls.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_network_acl"/);
    });

    test('Public network ACL is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'network_acls.tf'), 'utf8');
      expect(content).toMatch(/public/i);
    });

    test('Private network ACL is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'network_acls.tf'), 'utf8');
      expect(content).toMatch(/private/i);
    });

    test('Isolated network ACL is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'network_acls.tf'), 'utf8');
      expect(content).toMatch(/isolated/i);
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC Flow Log is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_flow_log"/);
    });

    test('CloudWatch Log Group for flow logs is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test('IAM role for flow logs is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_iam_role"/);
    });
  });

  describe('Outputs', () => {
    test('VPC ID output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"vpc_id"/);
    });

    test('Public subnet IDs output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
    });

    test('Private subnet IDs output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('Isolated subnet IDs output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"isolated_subnet_ids"/);
    });

    test('NAT Gateway IDs output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"nat_gateway_ids"/);
    });

    test('Internet Gateway ID output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"internet_gateway_id"/);
    });

    test('Security group outputs are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"security_group_web_id"/);
      expect(content).toMatch(/output\s+"security_group_app_id"/);
      expect(content).toMatch(/output\s+"security_group_data_id"/);
    });

    test('Route table IDs outputs are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"public_route_table_id"/);
      expect(content).toMatch(/output\s+"private_route_table_ids"/);
      expect(content).toMatch(/output\s+"isolated_route_table_ids"/);
    });

    test('VPC flow log outputs are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"vpc_flow_log_id"/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources use environment suffix in naming', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      const matches = mainContent.match(/var\.environment/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(3);
    });
  });

  describe('Syntax Validation', () => {
    test('main.tf has balanced braces', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('security_groups.tf has balanced braces', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'security_groups.tf'), 'utf8');
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('network_acls.tf has balanced braces', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'network_acls.tf'), 'utf8');
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });
});
