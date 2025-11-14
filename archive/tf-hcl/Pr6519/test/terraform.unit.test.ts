import * as fs from 'fs';
import * as path from 'path';
import { TerraformConfigValidator } from '../lib/terraform-validator';

const LIB_DIR = path.resolve(__dirname, '../lib');
const validator = new TerraformConfigValidator(LIB_DIR);

describe('Terraform VPC Infrastructure Unit Tests', () => {

  describe('File Structure', () => {
    test('all required Terraform files exist', () => {
      const result = validator.validateRequiredFiles();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('can read all Terraform files', () => {
      const files = ['provider.tf', 'variables.tf', 'vpc.tf', 'network_acl.tf', 'flow_logs.tf', 'outputs.tf'];
      files.forEach(file => {
        const tfFile = validator.readTerraformFile(file);
        expect(tfFile.name).toBe(file);
        expect(tfFile.content).toBeTruthy();
        expect(tfFile.content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('provider.tf', () => {
    const providerPath = path.join(LIB_DIR, 'provider.tf');
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(providerPath, 'utf8');
    });

    test('declares AWS provider with region variable', () => {
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('uses default tags from variables', () => {
      expect(content).toMatch(/default_tags\s*{/);
      expect(content).toMatch(/tags\s*=\s*var\.common_tags/);
    });

    test('requires Terraform version >= 1.0', () => {
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test('specifies AWS provider version ~> 5.0', () => {
      expect(content).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });
  });

  describe('variables.tf', () => {
    test('has all required variables', () => {
      const result = validator.validateVariables();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('declares environment_suffix variable', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('declares aws_region variable with us-east-1 default', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(varsFile.content).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('declares vpc_cidr variable with 10.0.0.0/16 default', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(varsFile.content).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('declares availability_zones with 3 AZs', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"availability_zones"\s*{/);
      expect(varsFile.content).toMatch(/us-east-1a/);
      expect(varsFile.content).toMatch(/us-east-1b/);
      expect(varsFile.content).toMatch(/us-east-1c/);
    });

    test('declares public_subnet_cidrs with correct ranges', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(varsFile.content).toMatch(/10\.0\.1\.0\/24/);
      expect(varsFile.content).toMatch(/10\.0\.2\.0\/24/);
      expect(varsFile.content).toMatch(/10\.0\.3\.0\/24/);
    });

    test('declares private_subnet_cidrs with correct ranges', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
      expect(varsFile.content).toMatch(/10\.0\.11\.0\/24/);
      expect(varsFile.content).toMatch(/10\.0\.12\.0\/24/);
      expect(varsFile.content).toMatch(/10\.0\.13\.0\/24/);
    });

    test('declares common_tags with Environment and CostCenter', () => {
      const varsFile = validator.readTerraformFile('variables.tf');
      expect(varsFile.content).toMatch(/variable\s+"common_tags"\s*{/);
      expect(varsFile.content).toMatch(/Environment\s*=\s*"production"/);
      expect(varsFile.content).toMatch(/CostCenter\s*=\s*"banking"/);
    });
  });

  describe('vpc.tf', () => {
    test('VPC configuration is valid', () => {
      const result = validator.validateVPC();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('declares VPC resource with DNS support', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(vpcFile.content).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpcFile.content).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC uses environment_suffix in name tag', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/Name\s*=\s*"vpc-\$\{var\.environment_suffix\}"/);
    });

    test('declares Internet Gateway', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(vpcFile.content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('declares 3 public subnets with count', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{\s*count\s*=\s*3/);
      expect(vpcFile.content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('declares 3 private subnets with count', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{\s*count\s*=\s*3/);
    });

    test('declares 3 Elastic IPs for NAT Gateways', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{\s*count\s*=\s*3/);
      expect(vpcFile.content).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('declares 3 NAT Gateways with count', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{\s*count\s*=\s*3/);
    });

    test('NAT Gateways depend on Internet Gateway', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('declares public route table with IGW route', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(vpcFile.content).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(vpcFile.content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('declares 3 private route tables with NAT routes', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{\s*count\s*=\s*3/);
      expect(vpcFile.content).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('all resources use environment_suffix in naming', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      const namePatterns = [
        'vpc-${var.environment_suffix}',
        'igw-${var.environment_suffix}',
        'public-subnet-',
        'private-subnet-',
        'eip-nat-',
        'nat-',
        'public-rt-${var.environment_suffix}',
        'private-rt-'
      ];

      namePatterns.forEach(pattern => {
        expect(vpcFile.content).toContain(pattern);
      });
    });

    test('no prevent_destroy lifecycle rules', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).not.toMatch(/prevent_destroy\s*=\s*true/);
    });
  });

  describe('network_acl.tf', () => {
    test('Network ACL configuration is valid', () => {
      const result = validator.validateNetworkACL();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('declares Network ACL for public subnets', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/resource\s+"aws_network_acl"\s+"public"\s*{/);
      expect(naclFile.content).toMatch(/subnet_ids\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('allows inbound HTTP (port 80)', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*80/);
      expect(naclFile.content).toMatch(/to_port\s*=\s*80/);
      expect(naclFile.content).toMatch(/action\s*=\s*"allow"/);
    });

    test('allows inbound HTTPS (port 443)', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*443/);
      expect(naclFile.content).toMatch(/to_port\s*=\s*443/);
      expect(naclFile.content).toMatch(/action\s*=\s*"allow"/);
    });

    test('allows ephemeral ports (1024-65535)', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*1024/);
      expect(naclFile.content).toMatch(/to_port\s*=\s*65535/);
    });

    test('allows all outbound traffic', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/egress\s*{/);
      expect(naclFile.content).toMatch(/protocol\s*=\s*"-1"/);
      expect(naclFile.content).toMatch(/from_port\s*=\s*0/);
      expect(naclFile.content).toMatch(/to_port\s*=\s*0/);
    });
  });

  describe('flow_logs.tf', () => {
    test('Flow Logs configuration is valid', () => {
      const result = validator.validateFlowLogs();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('declares CloudWatch Log Group with 7-day retention', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"\s*{/);
      expect(flowLogsFile.content).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('declares IAM role for VPC Flow Logs', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"\s*{/);
      expect(flowLogsFile.content).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test('IAM role has correct assume role policy', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(flowLogsFile.content).toMatch(/sts:AssumeRole/);
    });

    test('declares IAM role policy with CloudWatch Logs permissions', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"\s*{/);
      expect(flowLogsFile.content).toMatch(/logs:CreateLogGroup/);
      expect(flowLogsFile.content).toMatch(/logs:CreateLogStream/);
      expect(flowLogsFile.content).toMatch(/logs:PutLogEvents/);
    });

    test('declares VPC Flow Log resource', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
      expect(flowLogsFile.content).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('Flow Logs use environment_suffix in naming', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/flow-logs-\$\{var\.environment_suffix\}/);
      expect(flowLogsFile.content).toMatch(/vpc-flow-logs-role-\$\{var\.environment_suffix\}/);
    });
  });

  describe('outputs.tf', () => {
    test('has all required outputs', () => {
      const result = validator.validateOutputs();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('outputs VPC ID', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"vpc_id"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test('outputs VPC CIDR block', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"vpc_cidr_block"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_vpc\.main\.cidr_block/);
    });

    test('outputs public subnet IDs', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('outputs private subnet IDs', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('outputs Internet Gateway ID', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"internet_gateway_id"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('outputs NAT Gateway IDs', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"nat_gateway_ids"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_nat_gateway\.main\[\*\]\.id/);
    });

    test('outputs route table IDs', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"public_route_table_id"\s*{/);
      expect(outputsFile.content).toMatch(/output\s+"private_route_table_ids"\s*{/);
    });

    test('outputs Flow Log information', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"flow_log_id"\s*{/);
      expect(outputsFile.content).toMatch(/output\s+"flow_log_cloudwatch_log_group"\s*{/);
    });

    test('outputs Network ACL ID', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"network_acl_id"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_network_acl\.public\.id/);
    });

    test('outputs Elastic IP addresses', () => {
      const outputsFile = validator.readTerraformFile('outputs.tf');
      expect(outputsFile.content).toMatch(/output\s+"elastic_ip_addresses"\s*{/);
      expect(outputsFile.content).toMatch(/value\s*=\s*aws_eip\.nat\[\*\]\.public_ip/);
    });
  });

  describe('Comprehensive Validation', () => {
    test('all validations pass', () => {
      const result = validator.validateAll();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      if (result.warnings.length > 0) {
        console.log('Warnings:', result.warnings);
      }
    });
  });

  describe('Resource Configuration Compliance', () => {
    test('no hardcoded AWS region in resource definitions', () => {
      const files = ['vpc.tf', 'network_acl.tf', 'flow_logs.tf'];

      files.forEach(file => {
        const tfFile = validator.readTerraformFile(file);
        expect(tfFile.content).not.toMatch(/region\s*=\s*"us-east-/);
      });
    });

    test('all resources properly reference VPC', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('subnets properly reference availability zones from variables', () => {
      const vpcFile = validator.readTerraformFile('vpc.tf');
      expect(vpcFile.content).toMatch(/availability_zone\s*=\s*var\.availability_zones\[count\.index\]/);
    });
  });

  describe('Security and Best Practices', () => {
    test('no sensitive data hardcoded', () => {
      const files = ['vpc.tf', 'network_acl.tf', 'flow_logs.tf', 'variables.tf', 'outputs.tf'];

      files.forEach(file => {
        const tfFile = validator.readTerraformFile(file);
        expect(tfFile.content).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS Access Key
        expect(tfFile.content).not.toMatch(/[0-9]{12}/); // AWS Account ID pattern
        expect(tfFile.content).not.toMatch(/password\s*=\s*"/i);
        expect(tfFile.content).not.toMatch(/secret\s*=\s*"/i);
      });
    });

    test('IAM role uses least privilege principle', () => {
      const flowLogsFile = validator.readTerraformFile('flow_logs.tf');
      expect(flowLogsFile.content).toMatch(/logs:CreateLogGroup/);
      expect(flowLogsFile.content).toMatch(/logs:CreateLogStream/);
      expect(flowLogsFile.content).toMatch(/logs:PutLogEvents/);
      expect(flowLogsFile.content).toMatch(/logs:DescribeLogGroups/);
      expect(flowLogsFile.content).toMatch(/logs:DescribeLogStreams/);
    });

    test('Network ACL follows security requirements', () => {
      const naclFile = validator.readTerraformFile('network_acl.tf');
      expect(naclFile.content).toMatch(/from_port\s*=\s*80/);
      expect(naclFile.content).toMatch(/from_port\s*=\s*443/);
    });
  });
});
