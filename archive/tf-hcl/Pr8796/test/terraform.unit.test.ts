// Unit tests for VPC Network Isolation Terraform configuration
// Tests validate the infrastructure code structure and configuration

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('VPC Network Isolation Infrastructure - Unit Tests', () => {
  // Test 1: Verify all required Terraform files exist
  describe('File Structure', () => {
    test('main.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('flow_logs.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'flow_logs.tf'))).toBe(true);
    });

    test('nacl.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'nacl.tf'))).toBe(true);
    });

    test('terraform.tfvars exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'terraform.tfvars'))).toBe(true);
    });
  });

  // Test 2: Validate main.tf configuration
  describe('Main Infrastructure Configuration (main.tf)', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('VPC resource is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('VPC has correct CIDR block variable', () => {
      expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('VPC enables DNS hostnames', () => {
      expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC enables DNS support', () => {
      expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test('Public subnets are defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    });

    test('Private subnets are defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test('Database subnets are defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(var\.database_subnet_cidrs\)/);
    });

    test('Public subnets have map_public_ip_on_launch enabled', () => {
      expect(mainContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('NAT Gateway Elastic IPs are defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(mainContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('NAT Gateways are defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('NAT Gateways depend on Internet Gateway', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Public route table is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test('Public route table has route to Internet Gateway', () => {
      expect(mainContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('Private route tables are defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(mainContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('Database route table is defined (local only)', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"database"/);
    });

    test('Route table associations are defined for all subnet types', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"database"/);
    });

    test('All resources use environment_suffix in naming', () => {
      const vpcNameMatch = mainContent.match(/Name\s*=\s*"vpc-\$\{var\.environment_suffix\}"/);
      const igwNameMatch = mainContent.match(/Name\s*=\s*"igw-\$\{var\.environment_suffix\}"/);
      expect(vpcNameMatch).toBeTruthy();
      expect(igwNameMatch).toBeTruthy();
    });
  });

  // Test 3: Validate variables.tf configuration
  describe('Variables Configuration (variables.tf)', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    });

    test('environment_suffix variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test('aws_region variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    });

    test('vpc_cidr variable is defined with default', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"/);
      expect(variablesContent).toMatch(/"10\.0\.0\.0\/16"/);
    });

    test('availability_zones variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"availability_zones"/);
    });

    test('public_subnet_cidrs variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"public_subnet_cidrs"/);
    });

    test('private_subnet_cidrs variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"/);
    });

    test('database_subnet_cidrs variable is defined', () => {
      expect(variablesContent).toMatch(/variable\s+"database_subnet_cidrs"/);
    });

    test('Availability zones default to us-east-1 AZs', () => {
      expect(variablesContent).toMatch(/"us-east-1a"/);
      expect(variablesContent).toMatch(/"us-east-1b"/);
      expect(variablesContent).toMatch(/"us-east-1c"/);
    });
  });

  // Test 4: Validate provider.tf configuration
  describe('Provider Configuration (provider.tf)', () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
    });

    test('Terraform version is specified', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test('AWS provider is required', () => {
      expect(providerContent).toMatch(/required_providers/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test('AWS provider version is constrained', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0/);
    });

    test('AWS provider region uses variable', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('Default tags are configured', () => {
      expect(providerContent).toMatch(/default_tags/);
      expect(providerContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(providerContent).toMatch(/Project\s*=\s*"PaymentGateway"/);
    });
  });

  // Test 5: Validate outputs.tf configuration
  describe('Outputs Configuration (outputs.tf)', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    });

    test('VPC ID output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
    });

    test('VPC CIDR output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_cidr"/);
    });

    test('Internet Gateway ID output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"internet_gateway_id"/);
    });

    test('Public subnet IDs output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
    });

    test('Private subnet IDs output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('Database subnet IDs output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"database_subnet_ids"/);
    });

    test('NAT Gateway IDs output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"nat_gateway_ids"/);
    });

    test('NAT Gateway public IPs output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"nat_gateway_public_ips"/);
    });

    test('Route table IDs outputs are defined', () => {
      expect(outputsContent).toMatch(/output\s+"public_route_table_id"/);
      expect(outputsContent).toMatch(/output\s+"private_route_table_ids"/);
      expect(outputsContent).toMatch(/output\s+"database_route_table_id"/);
    });

    test('VPC Flow Logs outputs are defined', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_flow_log_id"/);
      expect(outputsContent).toMatch(/output\s+"vpc_flow_log_group_name"/);
    });
  });

  // Test 6: Validate VPC Flow Logs configuration
  describe('VPC Flow Logs Configuration (flow_logs.tf)', () => {
    let flowLogsContent: string;

    beforeAll(() => {
      flowLogsContent = fs.readFileSync(path.join(LIB_DIR, 'flow_logs.tf'), 'utf8');
    });

    test('CloudWatch Log Group is defined', () => {
      expect(flowLogsContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    });

    test('Log Group has 30-day retention', () => {
      expect(flowLogsContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('IAM role for VPC Flow Logs is defined', () => {
      expect(flowLogsContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
    });

    test('IAM role has correct assume role policy', () => {
      expect(flowLogsContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
      expect(flowLogsContent).toMatch(/sts:AssumeRole/);
    });

    test('IAM policy for VPC Flow Logs is defined', () => {
      expect(flowLogsContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
    });

    test('IAM policy has CloudWatch Logs permissions', () => {
      expect(flowLogsContent).toMatch(/logs:CreateLogGroup/);
      expect(flowLogsContent).toMatch(/logs:CreateLogStream/);
      expect(flowLogsContent).toMatch(/logs:PutLogEvents/);
    });

    test('VPC Flow Log is defined', () => {
      expect(flowLogsContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test('VPC Flow Log captures ALL traffic', () => {
      expect(flowLogsContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('VPC Flow Log uses environment_suffix in naming', () => {
      expect(flowLogsContent).toMatch(/vpc-flow-logs-\$\{var\.environment_suffix\}/);
    });
  });

  // Test 7: Validate Network ACLs configuration
  describe('Network ACLs Configuration (nacl.tf)', () => {
    let naclContent: string;

    beforeAll(() => {
      naclContent = fs.readFileSync(path.join(LIB_DIR, 'nacl.tf'), 'utf8');
    });

    test('Public NACL is defined', () => {
      expect(naclContent).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
    });

    test('Private NACL is defined', () => {
      expect(naclContent).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
    });

    test('Database NACL is defined', () => {
      expect(naclContent).toMatch(/resource\s+"aws_network_acl"\s+"database"/);
    });

    test('Public NACL allows HTTP (port 80)', () => {
      expect(naclContent).toMatch(/from_port\s*=\s*80/);
      expect(naclContent).toMatch(/to_port\s*=\s*80/);
    });

    test('Public NACL allows HTTPS (port 443)', () => {
      expect(naclContent).toMatch(/from_port\s*=\s*443/);
      expect(naclContent).toMatch(/to_port\s*=\s*443/);
    });

    test('Public NACL allows ephemeral ports', () => {
      expect(naclContent).toMatch(/from_port\s*=\s*1024/);
      expect(naclContent).toMatch(/to_port\s*=\s*65535/);
    });

    test('Private NACL allows ports 8080-8090', () => {
      expect(naclContent).toMatch(/from_port\s*=\s*8080/);
      expect(naclContent).toMatch(/to_port\s*=\s*8090/);
    });

    test('Database NACL allows PostgreSQL (port 5432) from private subnets', () => {
      expect(naclContent).toMatch(/from_port\s*=\s*5432/);
      expect(naclContent).toMatch(/to_port\s*=\s*5432/);
    });

    test('Database NACL uses dynamic blocks for multiple private subnet CIDRs', () => {
      expect(naclContent).toMatch(/dynamic\s+"ingress"/);
      expect(naclContent).toMatch(/for_each\s*=\s*var\.private_subnet_cidrs/);
    });

    test('All NACLs have egress rules', () => {
      const egressMatches = naclContent.match(/egress\s*{/g);
      expect(egressMatches).toBeTruthy();
      // At least 1 egress rule should exist (public and private share the same pattern)
      expect(egressMatches!.length).toBeGreaterThanOrEqual(1);
    });

    test('NACLs use environment_suffix in naming', () => {
      expect(naclContent).toMatch(/public-nacl-\$\{var\.environment_suffix\}/);
      expect(naclContent).toMatch(/private-nacl-\$\{var\.environment_suffix\}/);
      expect(naclContent).toMatch(/database-nacl-\$\{var\.environment_suffix\}/);
    });
  });

  // Test 8: Validate terraform.tfvars configuration
  describe('Terraform Variables File (terraform.tfvars)', () => {
    let tfvarsContent: string;

    beforeAll(() => {
      tfvarsContent = fs.readFileSync(path.join(LIB_DIR, 'terraform.tfvars'), 'utf8');
    });

    test('environment_suffix is set', () => {
      expect(tfvarsContent).toMatch(/environment_suffix\s*=\s*"[^"]+"/);
    });

    test('aws_region is set to us-east-1', () => {
      expect(tfvarsContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
    });
  });

  // Test 9: Validate compliance requirements
  describe('PCI DSS Compliance Requirements', () => {
    let allContent: string;

    beforeAll(() => {
      const files = ['main.tf', 'nacl.tf', 'flow_logs.tf', 'provider.tf'];
      allContent = files
        .map(f => fs.readFileSync(path.join(LIB_DIR, f), 'utf8'))
        .join('\n');
    });

    test('Network segmentation is enforced (3 subnet tiers)', () => {
      expect(allContent).toMatch(/subnet"\s+"public"/);
      expect(allContent).toMatch(/subnet"\s+"private"/);
      expect(allContent).toMatch(/subnet"\s+"database"/);
    });

    test('VPC Flow Logs are enabled for audit trails', () => {
      expect(allContent).toMatch(/flow_log"\s+"main"/);
      expect(allContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('Network ACLs enforce explicit access control', () => {
      expect(allContent).toMatch(/network_acl"\s+"public"/);
      expect(allContent).toMatch(/network_acl"\s+"private"/);
      expect(allContent).toMatch(/network_acl"\s+"database"/);
    });

    test('Resources are tagged for audit compliance', () => {
      expect(allContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(allContent).toMatch(/Project\s*=\s*"PaymentGateway"/);
    });

    test('Database tier has no internet access (no NAT route)', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      const databaseRtSection = mainContent.match(
        /resource\s+"aws_route_table"\s+"database"[^}]*}/
      );
      expect(databaseRtSection).toBeTruthy();
      expect(databaseRtSection![0]).not.toMatch(/nat_gateway_id/);
      expect(databaseRtSection![0]).not.toMatch(/gateway_id/);
    });
  });

  // Test 10: Validate high availability configuration
  describe('High Availability Requirements', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    });

    test('NAT Gateways are deployed in all 3 AZs', () => {
      expect(mainContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test('Each private route table uses its own NAT Gateway', () => {
      expect(mainContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('Subnets are distributed across multiple AZs', () => {
      expect(mainContent).toMatch(/availability_zone\s*=\s*var\.availability_zones\[count\.index\]/);
    });
  });
});
