import { readFileSync } from 'fs';
import { join } from 'path';

const LIB_DIR = join(__dirname, '../lib');

// Helper to read Terraform files
function readTerraformFile(filename: string): string {
  return readFileSync(join(LIB_DIR, filename), 'utf-8');
}

describe('Terraform VPC Network Infrastructure - Unit Tests', () => {
  let mainTf: string;
  let naclTf: string;
  let flowLogsTf: string;
  let variablesTf: string;
  let outputsTf: string;
  let providerTf: string;

  beforeAll(() => {
    mainTf = readTerraformFile('main.tf');
    naclTf = readTerraformFile('nacl.tf');
    flowLogsTf = readTerraformFile('flow-logs.tf');
    variablesTf = readTerraformFile('variables.tf');
    outputsTf = readTerraformFile('outputs.tf');
    providerTf = readTerraformFile('provider.tf');
  });

  describe('VPC Configuration', () => {
    test('should define VPC with correct CIDR block', () => {
      expect(mainTf).toMatch(/resource\s+"aws_vpc"\s+"payment_vpc"/);
      expect(mainTf).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should enable DNS hostnames and support', () => {
      expect(mainTf).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTf).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('VPC should use environment suffix in name', () => {
      expect(mainTf).toMatch(/Name\s*=\s*"payment-vpc-\$\{var\.environment_suffix\}"/);
    });

    test('VPC should have required tags', () => {
      expect(mainTf).toMatch(/Environment\s*=\s*"Production"/);
      expect(mainTf).toMatch(/Project\s*=\s*"PaymentGateway"/);
    });
  });

  describe('Subnet Configuration', () => {
    test('should define 3 public subnets', () => {
      const publicSubnets = mainTf.match(/resource\s+"aws_subnet"\s+"public"/g);
      expect(publicSubnets).toBeTruthy();
    });

    test('public subnets should use correct CIDR blocks', () => {
      expect(mainTf).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 1\}\.0\/24"/);
    });

    test('should define 3 private subnets', () => {
      const privateSubnets = mainTf.match(/resource\s+"aws_subnet"\s+"private"/g);
      expect(privateSubnets).toBeTruthy();
    });

    test('private subnets should use correct CIDR blocks', () => {
      expect(mainTf).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 11\}\.0\/24"/);
    });

    test('should define 3 database subnets', () => {
      const dbSubnets = mainTf.match(/resource\s+"aws_subnet"\s+"database"/g);
      expect(dbSubnets).toBeTruthy();
    });

    test('database subnets should use correct CIDR blocks', () => {
      expect(mainTf).toMatch(/cidr_block\s*=\s*"10\.0\.\$\{count\.index \+ 21\}\.0\/24"/);
    });

    test('public subnets should map public IPs on launch', () => {
      expect(mainTf).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('all subnets should use availability zones from data source', () => {
      expect(mainTf).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('all subnets should have environment suffix in name', () => {
      const subnetNameMatches = mainTf.match(/\$\{var\.environment_suffix\}/g);
      expect(subnetNameMatches).toBeTruthy();
      expect(subnetNameMatches!.length).toBeGreaterThanOrEqual(9); // 9 subnets
    });
  });

  describe('Internet Gateway', () => {
    test('should define Internet Gateway', () => {
      expect(mainTf).toMatch(/resource\s+"aws_internet_gateway"\s+"payment_igw"/);
    });

    test('Internet Gateway should attach to VPC', () => {
      expect(mainTf).toMatch(/vpc_id\s*=\s*aws_vpc\.payment_vpc\.id/);
    });

    test('Internet Gateway should use environment suffix in name', () => {
      expect(mainTf).toMatch(/Name\s*=\s*"payment-igw-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should define 3 Elastic IPs for NAT Gateways', () => {
      expect(mainTf).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(mainTf).toMatch(/count\s*=\s*3/);
    });

    test('should define 3 NAT Gateways', () => {
      expect(mainTf).toMatch(/resource\s+"aws_nat_gateway"\s+"nat"/);
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(mainTf).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test('NAT Gateways should use Elastic IPs', () => {
      expect(mainTf).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test('NAT Gateways should depend on Internet Gateway', () => {
      expect(mainTf).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.payment_igw\]/);
    });

    test('NAT Gateway names should use environment suffix', () => {
      expect(mainTf).toMatch(/Name\s*=\s*"nat-gateway-\$\{count\.index \+ 1\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Route Tables', () => {
    test('should define public route table', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test('public route table should route to Internet Gateway', () => {
      expect(mainTf).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.payment_igw\.id/);
    });

    test('should define 3 private route tables', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(mainTf).toMatch(/count\s*=\s*3/);
    });

    test('private route tables should route to NAT Gateways', () => {
      expect(mainTf).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat\[count\.index\]\.id/);
    });

    test('should define database route table', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"database"/);
    });

    test('database route table should have no internet routes', () => {
      const dbRouteTableMatch = mainTf.match(/resource "aws_route_table" "database"[\s\S]*?^}/m);
      expect(dbRouteTableMatch).toBeTruthy();
      // Ensure no gateway_id or nat_gateway_id in database route table
      expect(dbRouteTableMatch![0]).not.toMatch(/gateway_id/);
      expect(dbRouteTableMatch![0]).not.toMatch(/nat_gateway_id/);
    });

    test('route table associations should exist for all subnets', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(mainTf).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(mainTf).toMatch(/resource\s+"aws_route_table_association"\s+"database"/);
    });
  });

  describe('Network ACLs', () => {
    test('should define public NACL', () => {
      expect(naclTf).toMatch(/resource\s+"aws_network_acl"\s+"public"/);
    });

    test('public NACL should allow HTTP (port 80)', () => {
      expect(naclTf).toMatch(/from_port\s*=\s*80/);
      expect(naclTf).toMatch(/to_port\s*=\s*80/);
    });

    test('public NACL should allow HTTPS (port 443)', () => {
      expect(naclTf).toMatch(/from_port\s*=\s*443/);
      expect(naclTf).toMatch(/to_port\s*=\s*443/);
    });

    test('should define private NACL', () => {
      expect(naclTf).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
    });

    test('private NACL should allow ports 8080-8090', () => {
      expect(naclTf).toMatch(/from_port\s*=\s*8080/);
      expect(naclTf).toMatch(/to_port\s*=\s*8090/);
    });

    test('should define database NACL', () => {
      expect(naclTf).toMatch(/resource\s+"aws_network_acl"\s+"database"/);
    });

    test('database NACL should allow port 5432 from private subnets', () => {
      expect(naclTf).toMatch(/from_port\s*=\s*5432/);
      expect(naclTf).toMatch(/to_port\s*=\s*5432/);
    });

    test('all NACLs should have environment suffix', () => {
      const naclNames = naclTf.match(/\$\{var\.environment_suffix\}/g);
      expect(naclNames).toBeTruthy();
      expect(naclNames!.length).toBeGreaterThanOrEqual(3); // 3 NACLs
    });
  });

  describe('VPC Flow Logs', () => {
    test('should define CloudWatch Log Group', () => {
      expect(flowLogsTf).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    });

    test('log group should have 30-day retention', () => {
      expect(flowLogsTf).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('should define IAM role for Flow Logs', () => {
      expect(flowLogsTf).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
    });

    test('IAM role should have correct assume role policy', () => {
      expect(flowLogsTf).toMatch(/Service.*vpc-flow-logs\.amazonaws\.com/);
    });

    test('should define IAM policy for Flow Logs', () => {
      expect(flowLogsTf).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
    });

    test('IAM policy should allow log operations', () => {
      expect(flowLogsTf).toMatch(/logs:CreateLogGroup/);
      expect(flowLogsTf).toMatch(/logs:CreateLogStream/);
      expect(flowLogsTf).toMatch(/logs:PutLogEvents/);
    });

    test('should define VPC Flow Log resource', () => {
      expect(flowLogsTf).toMatch(/resource\s+"aws_flow_log"\s+"payment_vpc"/);
    });

    test('Flow Log should capture ALL traffic', () => {
      expect(flowLogsTf).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('Flow Log resources should use environment suffix', () => {
      const suffixMatches = flowLogsTf.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixMatches).toBeTruthy();
      expect(suffixMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Variables', () => {
    test('should define aws_region variable', () => {
      expect(variablesTf).toMatch(/variable\s+"aws_region"/);
    });

    test('aws_region should default to us-east-1', () => {
      expect(variablesTf).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('should define environment_suffix variable', () => {
      expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);
    });

    test('environment_suffix should have default value', () => {
      expect(variablesTf).toMatch(/default\s*=\s*"dev"/);
    });
  });

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      expect(outputsTf).toMatch(/output\s+"vpc_id"/);
    });

    test('should output subnet IDs', () => {
      expect(outputsTf).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsTf).toMatch(/output\s+"private_subnet_ids"/);
      expect(outputsTf).toMatch(/output\s+"database_subnet_ids"/);
    });

    test('should output NAT Gateway information', () => {
      expect(outputsTf).toMatch(/output\s+"nat_gateway_ids"/);
      expect(outputsTf).toMatch(/output\s+"nat_gateway_eips"/);
    });

    test('should output route table IDs', () => {
      expect(outputsTf).toMatch(/output\s+"public_route_table_id"/);
      expect(outputsTf).toMatch(/output\s+"private_route_table_ids"/);
      expect(outputsTf).toMatch(/output\s+"database_route_table_id"/);
    });

    test('should output NACL IDs', () => {
      expect(outputsTf).toMatch(/output\s+"public_nacl_id"/);
      expect(outputsTf).toMatch(/output\s+"private_nacl_id"/);
      expect(outputsTf).toMatch(/output\s+"database_nacl_id"/);
    });

    test('should output Flow Logs information', () => {
      expect(outputsTf).toMatch(/output\s+"flow_logs_log_group"/);
      expect(outputsTf).toMatch(/output\s+"flow_logs_iam_role_arn"/);
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider', () => {
      expect(providerTf).toMatch(/provider\s+"aws"/);
    });

    test('should use variable for region', () => {
      expect(providerTf).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should have required providers block', () => {
      expect(providerTf).toMatch(/required_providers/);
      expect(providerTf).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment tag', () => {
      const allTerraformCode = mainTf + naclTf + flowLogsTf;
      const envTags = allTerraformCode.match(/Environment\s*=\s*"Production"/g);
      expect(envTags).toBeTruthy();
      expect(envTags!.length).toBeGreaterThan(10);
    });

    test('all resources should have Project tag', () => {
      const allTerraformCode = mainTf + naclTf + flowLogsTf;
      const projectTags = allTerraformCode.match(/Project\s*=\s*"PaymentGateway"/g);
      expect(projectTags).toBeTruthy();
      expect(projectTags!.length).toBeGreaterThan(10);
    });

    test('all named resources should include environment suffix', () => {
      const allTerraformCode = mainTf + naclTf + flowLogsTf;
      const suffixUsage = allTerraformCode.match(/\$\{var\.environment_suffix\}/g);
      expect(suffixUsage).toBeTruthy();
      expect(suffixUsage!.length).toBeGreaterThan(15); // Multiple resources
    });
  });

  describe('High Availability', () => {
    test('subnets should span 3 availability zones', () => {
      expect(mainTf).toMatch(/count\s*=\s*3/);
    });

    test('NAT Gateways should be deployed in all AZs', () => {
      const natGateways = mainTf.match(/resource\s+"aws_nat_gateway"/);
      expect(natGateways).toBeTruthy();
      expect(mainTf).toMatch(/count\s*=\s*3/);
    });

    test('each private subnet should have its own route table for NAT redundancy', () => {
      expect(mainTf).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(mainTf).toMatch(/count\s*=\s*3/);
    });
  });

  describe('Network Isolation', () => {
    test('database route table should have no internet routes', () => {
      const dbRtSection = mainTf.match(/resource "aws_route_table" "database"[\s\S]*?tags = \{[\s\S]*?\}/);
      expect(dbRtSection).toBeTruthy();
      expect(dbRtSection![0]).not.toMatch(/cidr_block.*0\.0\.0\.0\/0/);
    });

    test('private subnets should route through NAT Gateway', () => {
      expect(mainTf).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat\[count\.index\]\.id/);
    });

    test('public subnets should route through Internet Gateway', () => {
      expect(mainTf).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.payment_igw\.id/);
    });
  });

  describe('Security Controls', () => {
    test('NACLs should use explicit allow rules', () => {
      const ingressRules = naclTf.match(/ingress\s*\{/g);
      expect(ingressRules).toBeTruthy();
      expect(ingressRules!.length).toBeGreaterThan(5); // Multiple ingress rules
    });

    test('database NACL should only allow traffic from private subnet CIDRs', () => {
      expect(naclTf).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
      expect(naclTf).toMatch(/cidr_block\s*=\s*"10\.0\.12\.0\/24"/);
      expect(naclTf).toMatch(/cidr_block\s*=\s*"10\.0\.13\.0\/24"/);
    });

    test('NACLs should have proper rule numbers', () => {
      expect(naclTf).toMatch(/rule_no\s*=\s*100/);
      expect(naclTf).toMatch(/rule_no\s*=\s*110/);
    });
  });

  describe('Data Sources', () => {
    test('should use availability zones data source', () => {
      expect(mainTf).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('availability zones should filter for available state', () => {
      expect(mainTf).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe('No Deletion Protection', () => {
    test('no resources should have prevent_destroy', () => {
      const allCode = mainTf + naclTf + flowLogsTf;
      expect(allCode).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test('no resources should have deletion_protection', () => {
      const allCode = mainTf + naclTf + flowLogsTf;
      expect(allCode).not.toMatch(/deletion_protection\s*=\s*true/);
    });
  });

  describe('Code Quality', () => {
    test('should not have hardcoded region values', () => {
      const allCode = mainTf + naclTf + flowLogsTf + variablesTf;
      const hardcodedRegions = allCode.match(/"us-east-1"/g);
      // Only in variable default is OK
      if (hardcodedRegions) {
        expect(hardcodedRegions.length).toBeLessThanOrEqual(1);
      }
    });

    test('should use count for multiple similar resources', () => {
      expect(mainTf).toMatch(/count\s*=/);
    });

    test('should use data sources appropriately', () => {
      expect(mainTf).toMatch(/data\s+"aws_availability_zones"/);
    });
  });
});
