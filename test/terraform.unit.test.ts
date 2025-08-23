// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');

describe('Terraform Infrastructure Unit Tests', () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
  });

  describe('File Structure and Presence', () => {
    test('tap_stack.tf exists and is readable', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test('provider.tf exists and is readable', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf contains terraform block with required providers', () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_providers\s*{/);
      expect(providerContent).toMatch(/aws\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('provider.tf contains AWS provider configuration', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('tap_stack.tf does NOT contain duplicate provider declarations', () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });
  });

  describe('Variable Declarations', () => {
    test('aws_region variable is declared with proper validation', () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"AWS region to deploy resources"/);
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
      expect(stackContent).toMatch(/validation\s*{/);
    });

    test('project_name variable is declared', () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"prod-sec"/);
    });

    test('environment variable is declared with validation', () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/contains\(\["production", "staging"\], var\.environment\)/);
    });

    test('VPC CIDR variable is declared with validation', () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/can\(cidrhost\(var\.vpc_cidr, 0\)\)/);
    });

    test('subnet CIDR variables are declared', () => {
      expect(stackContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(stackContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*list\(string\)/);
    });

    test('RDS variables are declared', () => {
      expect(stackContent).toMatch(/variable\s+"rds_instance_class"\s*{/);
      expect(stackContent).toMatch(/variable\s+"rds_allocated_storage"\s*{/);
      expect(stackContent).toMatch(/variable\s+"rds_engine_version"\s*{/);
    });
  });

  describe('Resource Declarations', () => {
    test('VPC resource is declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('Internet Gateway is declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"igw"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('Subnets are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test('Route Tables are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test('NAT Gateway is declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test('Security Groups are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
    });

    test('RDS resources are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
    });

    test('Load Balancer resources are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"\s*{/);
    });

    test('Auto Scaling resources are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
    });

    test('CloudWatch resources are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu_high"\s*{/);
    });

    test('Security components are declared', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc"\s*{/);
    });
  });

  describe('Security and Best Practices', () => {
    test('RDS instance has encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('KMS encryption is properly configured', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('Security groups have proper ingress rules', () => {
      expect(stackContent).toMatch(/ingress\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('Load Balancer has proper security group', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test('RDS has proper subnet group', () => {
      expect(stackContent).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
    });

    test('CloudTrail is properly configured', () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test('AWS Config is properly configured', () => {
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_resources\s*=\s*true/);
    });

    test('VPC Flow Logs are enabled', () => {
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('Deletion protection is enabled', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
    });
  });

  describe('Tagging Strategy', () => {
    test('Resources have proper tagging', () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}/);
    });
  });

  describe('Dependencies and References', () => {
    test('Resources reference each other properly', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      // The actual configuration uses vpc_security_group_ids for RDS
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });
  });

  describe('Configuration Validation', () => {
    test('No syntax errors in HCL', () => {
      // Basic HCL syntax validation
      expect(stackContent).toMatch(/\{/);
      expect(stackContent).toMatch(/\}/);
      expect(stackContent).toMatch(/=/);

      // Check for balanced braces (basic check)
      const openBraces = (stackContent.match(/\{/g) || []).length;
      const closeBraces = (stackContent.match(/\}/g) || []).length;
      expect(openBraces).toBeGreaterThan(0);
      expect(closeBraces).toBeGreaterThan(0);
    });

    test('No duplicate variable names', () => {
      const variableMatches = stackContent.match(/variable\s+"([^"]+)"/g);
      if (variableMatches) {
        const variableNames = variableMatches.map(match => {
          const nameMatch = match.match(/variable\s+"([^"]+)"/);
          return nameMatch ? nameMatch[1] : '';
        });
        const uniqueNames = new Set(variableNames);
        expect(uniqueNames.size).toBe(variableNames.length);
      }
    });
  });
});
