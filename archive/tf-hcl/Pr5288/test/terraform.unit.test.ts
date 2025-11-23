// terraform.unit.test.ts
// Comprehensive unit tests for Healthcare Infrastructure Terraform Stack
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const OUTPUTS_PATH = path.resolve(__dirname, '../lib/outputs.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');

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

const hasEnvironmentSpecificConfig = (content: string): boolean => {
  return /locals\s*{[\s\S]*environment_config\s*=/.test(content);
};

describe('Healthcare Infrastructure Terraform Stack - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = readFileContent(STACK_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providerContent = readFileContent(PROVIDER_PATH);
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('tap_stack.tf is sufficiently comprehensive', () => {
      expect(stackContent.length).toBeGreaterThan(15000); // Ensure substantial infrastructure definition
    });

    test('variables.tf contains comprehensive variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(3000);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(3000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version >= 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4/);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*version\s*=\s*">=\s*5\.0/);
    });

    test('uses variable for AWS region (region-agnostic)', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('provider configuration is separate from main stack', () => {
      expect(stackContent).not.toMatch(/terraform\s*{[\s\S]*required_providers/);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'project_name', 
      'environment',
      'owner',
      'vpc_cidr',
      'availability_zones',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'database_subnet_cidrs',
      'instance_type',
      'min_size',
      'max_size',
      'desired_capacity',
      'db_engine',
      'db_engine_version',
      'db_instance_class',
      'db_allocated_storage',
      'db_max_allocated_storage',
      'db_backup_retention_period',
      'db_backup_window',
      'db_maintenance_window',
      'enable_deletion_protection',
      'allowed_cidr_blocks',
      'enable_vpc_flow_logs',
      'log_retention_days'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('environment variable has validation', () => {
      expect(variablesContent).toMatch(/validation\s*{[\s\S]*condition[\s\S]*contains.*dev.*staging.*prod/s);
    });

    test('variables use dynamic defaults (no hardcoded regions)', () => {
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/); // Only as default example
      expect(variablesContent).not.toMatch(/"us-east-1"|"eu-west-1"/); // No other hardcoded regions
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
      expect(stackContent).toMatch(/filter\s*{[\s\S]*name\s*=\s*"name"[\s\S]*values\s*=\s*\["al2023-ami-\*-x86_64"\]/s);
    });

    test('declares IAM policy documents', () => {
      expect(hasDataSource(stackContent, 'aws_iam_policy_document', 'ec2_assume_role')).toBe(true);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('declares locals block with environment_config', () => {
      expect(hasEnvironmentSpecificConfig(stackContent)).toBe(true);
    });

    test('defines non-overlapping CIDR blocks for environments', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*vpc_cidr\s*=\s*"10\.3\.0\.0\/16"/s);
    });

    test('defines environment-specific instance types', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*instance_type\s*=\s*"t3\.micro"/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*instance_type\s*=\s*"t3\.small"/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*instance_type\s*=\s*"t3\.medium"/s);
    });

    test('defines environment-specific backup retention', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*backup_retention\s*=\s*1/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*backup_retention\s*=\s*3/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*backup_retention\s*=\s*7/s);
    });

    test('defines environment-specific deletion protection', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*deletion_protection\s*=\s*false/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*deletion_protection\s*=\s*false/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*deletion_protection\s*=\s*true/s);
    });

    test('defines current_config reference', () => {
      expect(stackContent).toMatch(/current_config\s*=\s*local\.environment_config\[var\.environment\]/);
    });

    test('defines common_tags in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*Project[\s\S]*Environment[\s\S]*Owner/s);
    });

    test('defines name_prefix in locals', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${var\.project_name}-\${var\.environment}"/);
    });
  });

  describe('KMS Encryption Resources', () => {
    test('declares KMS key for RDS encryption', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'rds_encryption')).toBe(true);
    });

    test('declares KMS alias for RDS encryption', () => {
      expect(hasResource(stackContent, 'aws_kms_alias', 'rds_encryption')).toBe(true);
    });

    test('KMS key has appropriate deletion window', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'rds_encryption', 'deletion_window_in_days')).toBe(true);
    });

    test('KMS resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_kms_key', 'rds_encryption')).toBe(true);
    });
  });

  describe('Networking Resources', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('VPC uses dynamic CIDR from locals', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'cidr_block')).toBe(true);
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.current_config\.vpc_cidr/);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
    });

    test('declares Internet Gateway', () => {
      expect(hasResource(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('declares public subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*public.*count\s*=\s*length\(local\.current_config\.public_subnet_cidrs\)/s);
    });

    test('declares private subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*private.*count\s*=\s*length\(local\.current_config\.private_subnet_cidrs\)/s);
    });

    test('declares database subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'database')).toBe(true);
      expect(stackContent).toMatch(/aws_subnet.*database.*count\s*=\s*length\(local\.current_config\.database_subnet_cidrs\)/s);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      expect(stackContent).toMatch(/aws_subnet.*public[\s\S]*map_public_ip_on_launch\s*=\s*true/s);
    });

    test('subnets use dynamic availability zones', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('declares NAT gateways with count', () => {
      expect(hasResource(stackContent, 'aws_nat_gateway', 'main')).toBe(true);
      expect(stackContent).toMatch(/aws_nat_gateway.*main.*count\s*=\s*length\(aws_subnet\.public\)/s);
    });

    test('declares EIP for NAT gateways', () => {
      expect(hasResource(stackContent, 'aws_eip', 'nat')).toBe(true);
    });

    test('declares route tables', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table', 'private')).toBe(true);
    });

    test('declares route table associations', () => {
      expect(hasResource(stackContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    const securityGroups = ['alb', 'ec2', 'rds'];
    
    test.each(securityGroups)('declares %s security group', (sgName) => {
      expect(hasResource(stackContent, 'aws_security_group', sgName)).toBe(true);
    });

    test('ALB security group allows HTTP and HTTPS', () => {
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*ingress[\s\S]*from_port\s*=\s*80/s);
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*ingress[\s\S]*from_port\s*=\s*443/s);
    });

    test('EC2 security group only allows traffic from ALB', () => {
      expect(stackContent).toMatch(/aws_security_group.*ec2[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id\]/s);
    });

    test('RDS security group only allows traffic from EC2', () => {
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/s);
    });

    test('RDS security group uses PostgreSQL port 5432', () => {
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*from_port\s*=\s*5432[\s\S]*to_port\s*=\s*5432/s);
    });

    test('security groups are properly tagged', () => {
      securityGroups.forEach(sg => {
        expect(hasTagging(stackContent, 'aws_security_group', sg)).toBe(true);
      });
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('declares Application Load Balancer', () => {
      expect(hasResource(stackContent, 'aws_lb', 'main')).toBe(true);
    });

    test('ALB is external (not internal)', () => {
      expect(hasResourceAttribute(stackContent, 'aws_lb', 'main', 'internal')).toBe(true);
      expect(stackContent).toMatch(/aws_lb.*main[\s\S]*internal\s*=\s*false/s);
    });

    test('ALB uses application load balancer type', () => {
      expect(stackContent).toMatch(/aws_lb.*main[\s\S]*load_balancer_type\s*=\s*"application"/s);
    });

    test('ALB deletion protection is environment-specific', () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test('declares target group', () => {
      expect(hasResource(stackContent, 'aws_lb_target_group', 'main')).toBe(true);
    });

    test('target group has health check configuration', () => {
      expect(stackContent).toMatch(/aws_lb_target_group.*main[\s\S]*health_check\s*{/s);
    });

    test('declares load balancer listener', () => {
      expect(hasResource(stackContent, 'aws_lb_listener', 'main')).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('declares EC2 IAM role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'ec2')).toBe(true);
    });

    test('declares EC2 IAM instance profile', () => {
      expect(hasResource(stackContent, 'aws_iam_instance_profile', 'ec2')).toBe(true);
    });

    test('attaches SSM managed policy to EC2 role', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'ec2_ssm')).toBe(true);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/);
    });

    test('declares flow log IAM role (conditional)', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'flow_log')).toBe(true);
      expect(stackContent).toMatch(/aws_iam_role.*flow_log.*count\s*=\s*var\.enable_vpc_flow_logs/s);
    });

    test('declares flow log IAM policy (conditional)', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'flow_log')).toBe(true);
    });
  });

  describe('Compute Resources', () => {
    test('declares launch template', () => {
      expect(hasResource(stackContent, 'aws_launch_template', 'main')).toBe(true);
    });

    test('launch template uses dynamic AMI', () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
    });

    test('launch template uses environment-specific instance type', () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*local\.current_config\.instance_type/);
    });

    test('launch template includes user data', () => {
      expect(hasResourceAttribute(stackContent, 'aws_launch_template', 'main', 'user_data')).toBe(true);
    });

    test('declares Auto Scaling Group', () => {
      expect(hasResource(stackContent, 'aws_autoscaling_group', 'main')).toBe(true);
    });

    test('ASG uses private subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('ASG uses target group for health checks', () => {
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test('ASG has dynamic tags', () => {
      expect(stackContent).toMatch(/dynamic\s+"tag"\s*{[\s\S]*for_each\s*=\s*local\.common_tags/s);
    });
  });

  describe('Database Resources', () => {
    test('declares RDS subnet group', () => {
      expect(hasResource(stackContent, 'aws_db_subnet_group', 'main')).toBe(true);
    });

    test('RDS subnet group uses database subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test('declares random password for database', () => {
      expect(hasResource(stackContent, 'random_password', 'db_password')).toBe(true);
    });

    test('declares RDS instance', () => {
      expect(hasResource(stackContent, 'aws_db_instance', 'main')).toBe(true);
    });

    test('RDS instance uses PostgreSQL engine', () => {
      expect(hasResourceAttribute(stackContent, 'aws_db_instance', 'main', 'engine')).toBe(true);
      expect(stackContent).toMatch(/engine\s*=\s*var\.db_engine/);
    });

    test('RDS instance has encryption enabled', () => {
      expect(stackContent).toMatch(/aws_db_instance.*main[\s\S]*storage_encrypted\s*=\s*true/s);
    });

    test('RDS instance uses customer-managed KMS key', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds_encryption\.arn/);
    });

    test('RDS instance uses environment-specific backup retention', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*local\.current_config\.backup_retention/);
    });

    test('RDS instance uses environment-specific deletion protection', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*local\.current_config\.deletion_protection/);
    });

    test('RDS instance enables Multi-AZ for production only', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*true\s*:\s*false/);
    });

    test('RDS instance has Performance Insights enabled', () => {
      expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
    });

    test('RDS instance skips final snapshot for non-production', () => {
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*var\.environment\s*!=\s*"prod"/);
    });
  });

  describe('Monitoring and Logging', () => {
    test('declares CloudWatch log group for applications', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'app_logs')).toBe(true);
    });

    test('declares VPC Flow Logs (conditional)', () => {
      expect(hasResource(stackContent, 'aws_flow_log', 'vpc_flow_log')).toBe(true);
      expect(stackContent).toMatch(/aws_flow_log.*vpc_flow_log.*count\s*=\s*var\.enable_vpc_flow_logs/s);
    });

    test('declares CloudWatch log group for VPC Flow Logs (conditional)', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'vpc_flow_log')).toBe(true);
      expect(stackContent).toMatch(/aws_cloudwatch_log_group.*vpc_flow_log.*count\s*=\s*var\.enable_vpc_flow_logs/s);
    });

    test('log groups use dynamic retention period', () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });
  });

  describe('Resource Tagging', () => {
    const taggedResources = [
      ['aws_vpc', 'main'],
      ['aws_internet_gateway', 'main'],
      ['aws_subnet', 'public'],
      ['aws_subnet', 'private'],
      ['aws_subnet', 'database'],
      ['aws_security_group', 'alb'],
      ['aws_security_group', 'ec2'],
      ['aws_security_group', 'rds'],
      ['aws_lb', 'main'],
      ['aws_lb_target_group', 'main'],
      ['aws_kms_key', 'rds_encryption'],
      ['aws_db_instance', 'main'],
      ['aws_cloudwatch_log_group', 'app_logs']
    ];

    test.each(taggedResources)('resource %s.%s has proper tagging', (resourceType, resourceName) => {
      expect(hasTagging(stackContent, resourceType, resourceName)).toBe(true);
    });

    test('resources use merge function for common tags', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags,/);
    });

    test('common tags include required fields', () => {
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Workspace\s*=\s*terraform\.workspace/);
    });
  });

  describe('Output Definitions', () => {
    const expectedOutputs = [
      'vpc_id',
      'vpc_cidr_block',
      'availability_zones',
      'public_subnet_ids',
      'private_subnet_ids',
      'database_subnet_ids',
      'alb_dns_name',
      'alb_zone_id',
      'alb_arn',
      'target_group_arn',
      'application_url',
      'rds_endpoint',
      'rds_port',
      'database_name',
      'database_username',
      'alb_security_group_id',
      'ec2_security_group_id',
      'rds_security_group_id',
      'autoscaling_group_name',
      'launch_template_id',
      'kms_key_id',
      'kms_key_arn',
      'cloudwatch_log_group_name',
      'environment_config'
    ];

    test.each(expectedOutputs)('exports output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('sensitive outputs are marked as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"rds_endpoint"[\s\S]*sensitive\s*=\s*true/s);
      expect(outputsContent).toMatch(/output\s+"database_username"[\s\S]*sensitive\s*=\s*true/s);
      expect(outputsContent).toMatch(/output\s+"kms_key_id"[\s\S]*sensitive\s*=\s*true/s);
      expect(outputsContent).toMatch(/output\s+"kms_key_arn"[\s\S]*sensitive\s*=\s*true/s);
    });

    test('environment_config output includes workspace information', () => {
      expect(outputsContent).toMatch(/workspace\s*=\s*terraform\.workspace/);
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded secrets or passwords', () => {
      const forbiddenPatterns = [
        /password\s*=\s*"[^$]/i,
        /secret\s*=\s*"[^$]/i,
        /api_key\s*=\s*"[^$]/i,
        /access_key\s*=\s*"AKIA/i
      ];
      forbiddenPatterns.forEach(pattern => {
        expect(pattern.test(stackContent)).toBe(false);
      });
    });

    test('RDS password uses random_password resource', () => {
      expect(stackContent).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test('no overly permissive security group rules', () => {
      // Should not have 0.0.0.0/0 for database access
      expect(stackContent).not.toMatch(/aws_security_group.*rds[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/s);
    });

    test('production-specific safeguards are conditional', () => {
      expect(stackContent).toMatch(/var\.environment\s*==\s*"prod"/);
    });
  });

  describe('Dynamic and Region-Agnostic Configuration', () => {
    test('no hardcoded region references in resources', () => {
      const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1'];
      regions.forEach(region => {
        // Allow in comments or variable defaults only
        const resourceRegionRegex = new RegExp(`resource[\\s\\S]*"${region}"`, 'g');
        expect(resourceRegionRegex.test(stackContent)).toBe(false);
      });
    });

    test('uses dynamic availability zones from data source', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });

    test('uses variables for all configurable parameters', () => {
      expect(stackContent).toMatch(/var\./);
      expect(stackContent).not.toMatch(/[^a-zA-Z_]10\.0\.0\.0\/16[^a-zA-Z_]/); // No hardcoded VPC CIDR in resources
    });

    test('environment-specific configurations are in locals only', () => {
      // CIDR blocks should only appear in locals, not hardcoded in resources
      const hardcodedCidrInResources = /resource[\s\S]*cidr_block\s*=\s*"10\.\d+\.\d+\.\d+\/\d+"/;
      expect(hardcodedCidrInResources.test(stackContent)).toBe(false);
    });

    test('count parameters use dynamic length functions', () => {
      expect(stackContent).toMatch(/count\s*=\s*length\(/);
      expect(stackContent).not.toMatch(/count\s*=\s*\d+[^.]*/); // No hardcoded count values
    });
  });

  describe('Resource Dependencies and References', () => {
    test('subnets reference VPC ID dynamically', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('security groups reference each other properly', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
    });

    test('ALB references public subnets', () => {
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test('ASG references private subnets', () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test('RDS uses database subnets', () => {
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.database\[\*\]\.id/);
    });

    test('proper depends_on usage where needed', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  describe('Best Practices Compliance', () => {
    test('uses lifecycle rules where appropriate', () => {
      expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*create_before_destroy/s);
    });

    test('resource names use consistent naming convention', () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.name_prefix}-/);
    });

    test('uses name_prefix for resources that support it', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${local\.name_prefix}-/);
    });

    test('count is used appropriately for multi-AZ resources', () => {
      expect(countResourceOccurrences(stackContent, 'aws_subnet')).toBeGreaterThanOrEqual(3); // public, private, database
      expect(countResourceOccurrences(stackContent, 'aws_nat_gateway')).toBeGreaterThanOrEqual(1);
    });
  });
});