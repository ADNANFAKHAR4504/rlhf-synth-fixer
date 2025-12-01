// terraform.unit.test.ts
// Comprehensive unit tests for Multi-Environment Payment Platform Infrastructure
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const OUTPUTS_PATH = path.resolve(__dirname, '../lib/outputs.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');
const DEV_TFVARS_PATH = path.resolve(__dirname, '../lib/dev.tfvars');
const STAGING_TFVARS_PATH = path.resolve(__dirname, '../lib/staging.tfvars');
const PROD_TFVARS_PATH = path.resolve(__dirname, '../lib/prod.tfvars');

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
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
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

const hasValidationRule = (content: string, variableName: string): boolean => {
  const validationRegex = new RegExp(`variable\\s+"${variableName}"[\\s\\S]*?validation\\s*{`, 's');
  return validationRegex.test(content);
};

describe('Multi-Environment Payment Platform Infrastructure - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providerContent: string;
  let devTfvarsContent: string;
  let stagingTfvarsContent: string;
  let prodTfvarsContent: string;

  beforeAll(() => {
    stackContent = readFileContent(STACK_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providerContent = readFileContent(PROVIDER_PATH);
    devTfvarsContent = readFileContent(DEV_TFVARS_PATH);
    stagingTfvarsContent = readFileContent(STAGING_TFVARS_PATH);
    prodTfvarsContent = readFileContent(PROD_TFVARS_PATH);
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('all environment tfvars files exist', () => {
      expect(fs.existsSync(DEV_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(STAGING_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(PROD_TFVARS_PATH)).toBe(true);
    });

    test('tap_stack.tf is comprehensive infrastructure definition', () => {
      expect(stackContent.length).toBeGreaterThan(17000);
    });

    test('variables.tf contains comprehensive variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(1700);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(2500);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version greater than or equal to 1.4.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4/);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"[\s\S]*version\s*=\s*">=\s*5\.0"/);
    });

    test('uses variable for AWS region', () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures S3 backend', () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test('includes default tags configuration', () => {
      expect(providerContent).toMatch(/default_tags\s*{[\s\S]*tags\s*=/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'aws_region',
      'environment_suffix',
      'project_name',
      'repository',
      'commit_author',
      'pr_number',
      'team',
      'db_engine',
      'db_engine_version',
      'db_instance_class',
      'db_allocated_storage',
      'allowed_cidr_blocks'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('environment_suffix variable has validation for allowed values', () => {
      expect(hasValidationRule(variablesContent, 'environment_suffix')).toBe(true);
      expect(variablesContent).toMatch(/validation[\s\S]*contains\(\["dev",\s*"staging",\s*"prod"\]/s);
    });

    test('variables have appropriate descriptions', () => {
      expect(variablesContent).toMatch(/description\s*=\s*"AWS region for resources"/);
      expect(variablesContent).toMatch(/description\s*=\s*"Environment suffix for resource naming"/);
      expect(variablesContent).toMatch(/description\s*=\s*"Name of the project for resource naming"/);
    });

    test('database variables have appropriate defaults', () => {
      expect(variablesContent).toMatch(/db_engine[\s\S]*default\s*=\s*"postgres"/s);
      expect(variablesContent).toMatch(/db_engine_version[\s\S]*default\s*=\s*"15\.10"/s);
      expect(variablesContent).toMatch(/db_instance_class[\s\S]*default\s*=\s*"db\.t3\.micro"/s);
    });
  });

  describe('Data Sources', () => {
    test('declares availability zones data source for dynamic region support', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test('declares VPC data source for existing VPC discovery', () => {
      expect(hasDataSource(stackContent, 'aws_vpcs', 'existing')).toBe(true);
    });

    test('VPC data source filters by environment and project tags', () => {
      expect(stackContent).toMatch(/filter[\s\S]*name\s*=\s*"tag:Environment"[\s\S]*values\s*=\s*\[var\.environment_suffix\]/s);
      expect(stackContent).toMatch(/filter[\s\S]*name\s*=\s*"tag:Project"[\s\S]*values\s*=\s*\[var\.project_name\]/s);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('declares locals block with environment_config', () => {
      expect(hasEnvironmentSpecificConfig(stackContent)).toBe(true);
    });

    test('defines region-specific configuration for each environment', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*region\s*=\s*"eu-west-1"/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*region\s*=\s*"us-west-2"/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*region\s*=\s*"us-east-1"/s);
    });

    test('defines non-overlapping CIDR blocks for environments', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*vpc_cidr\s*=\s*"10\.3\.0\.0\/16"/s);
    });

    test('defines environment-specific RDS backup retention periods', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*db_backup_retention_period\s*=\s*7/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*db_backup_retention_period\s*=\s*14/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*db_backup_retention_period\s*=\s*30/s);
    });

    test('defines environment-specific ALB instance counts', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*alb_instance_count\s*=\s*1/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*alb_instance_count\s*=\s*2/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*alb_instance_count\s*=\s*3/s);
    });

    test('defines environment-specific S3 archive days', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*s3_archive_days\s*=\s*30/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*s3_archive_days\s*=\s*60/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*s3_archive_days\s*=\s*90/s);
    });

    test('defines environment-specific Multi-AZ configuration', () => {
      expect(stackContent).toMatch(/dev\s*=\s*{[\s\S]*db_multi_az\s*=\s*false/s);
      expect(stackContent).toMatch(/staging\s*=\s*{[\s\S]*db_multi_az\s*=\s*false/s);
      expect(stackContent).toMatch(/prod\s*=\s*{[\s\S]*db_multi_az\s*=\s*true/s);
    });

    test('defines current_config reference', () => {
      expect(stackContent).toMatch(/current_config\s*=\s*local\.environment_config\[var\.environment_suffix\]/);
    });

    test('defines common_tags in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*Project[\s\S]*Environment[\s\S]*Repository/s);
    });

    test('defines name_prefix with environment prefix pattern', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${var\.environment_suffix}-\${var\.project_name}"/);
    });
  });

  describe('KMS Encryption Resources', () => {
    test('declares KMS key for RDS encryption', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'rds_encryption')).toBe(true);
    });

    test('declares KMS key for S3 encryption', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 's3_encryption')).toBe(true);
    });

    test('declares KMS aliases for encryption keys', () => {
      expect(hasResource(stackContent, 'aws_kms_alias', 'rds_encryption')).toBe(true);
      expect(hasResource(stackContent, 'aws_kms_alias', 's3_encryption')).toBe(true);
    });

    test('KMS keys have environment-specific deletion window', () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*var\.environment_suffix\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
    });

    test('KMS resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_kms_key', 'rds_encryption')).toBe(true);
      expect(hasTagging(stackContent, 'aws_kms_key', 's3_encryption')).toBe(true);
    });
  });

  describe('Networking Resources', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('VPC uses dynamic CIDR from environment config', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*local\.current_config\.vpc_cidr/);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
    });

    test('declares Internet Gateway', () => {
      expect(hasResource(stackContent, 'aws_internet_gateway', 'main')).toBe(true);
    });

    test('declares dynamic subnets with count for all types', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(hasResource(stackContent, 'aws_subnet', 'database')).toBe(true);
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.current_config\.public_subnet_cidrs\)/);
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.current_config\.private_subnet_cidrs\)/);
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.current_config\.database_subnet_cidrs\)/);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      expect(stackContent).toMatch(/aws_subnet.*public[\s\S]*map_public_ip_on_launch\s*=\s*true/s);
    });

    test('subnets use dynamic availability zones from environment config', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*local\.current_config\.availability_zones\[count\.index\]/);
    });

    test('declares NAT gateways with dynamic count', () => {
      expect(hasResource(stackContent, 'aws_nat_gateway', 'main')).toBe(true);
      expect(hasResource(stackContent, 'aws_eip', 'nat')).toBe(true);
      expect(stackContent).toMatch(/count\s*=\s*length\(aws_subnet\.public\)/);
    });

    test('declares route tables and associations', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table', 'private')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'public')).toBe(true);
      expect(hasResource(stackContent, 'aws_route_table_association', 'private')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    const securityGroups = ['alb', 'application', 'rds'];

    test.each(securityGroups)('declares %s security group', (sgName) => {
      expect(hasResource(stackContent, 'aws_security_group', sgName)).toBe(true);
    });

    test('ALB security group allows HTTP and HTTPS from internet', () => {
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/s);
      expect(stackContent).toMatch(/aws_security_group.*alb[\s\S]*from_port\s*=\s*443[\s\S]*to_port\s*=\s*443/s);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('application security group only allows traffic from ALB', () => {
      expect(stackContent).toMatch(/aws_security_group.*application[\s\S]*security_groups\s*=\s*\[aws_security_group\.alb\.id\]/s);
    });

    test('RDS security group only allows traffic from application subnets', () => {
      expect(stackContent).toMatch(/aws_security_group.*rds[\s\S]*security_groups\s*=\s*\[aws_security_group\.application\.id\]/s);
      expect(stackContent).toMatch(/from_port\s*=\s*5432[\s\S]*to_port\s*=\s*5432/s);
    });

    test('RDS security group uses dynamic ingress for private subnets', () => {
      expect(stackContent).toMatch(/dynamic\s+"ingress"[\s\S]*for_each\s*=\s*local\.current_config\.private_subnet_cidrs/s);
    });

    test('security groups have lifecycle management', () => {
      expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*create_before_destroy\s*=\s*true/s);
    });

    test('security groups are properly tagged', () => {
      securityGroups.forEach(sg => {
        expect(hasTagging(stackContent, 'aws_security_group', sg)).toBe(true);
      });
    });
  });

  describe('RDS Database Resources', () => {
    test('declares RDS subnet group', () => {
      expect(hasResource(stackContent, 'aws_db_subnet_group', 'main')).toBe(true);
    });

    test('declares RDS PostgreSQL instance', () => {
      expect(hasResource(stackContent, 'aws_db_instance', 'main')).toBe(true);
    });

    test('RDS instance uses environment-specific configuration', () => {
      expect(stackContent).toMatch(/instance_class\s*=\s*local\.current_config\.db_instance_class/);
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*local\.current_config\.db_backup_retention_period/);
      expect(stackContent).toMatch(/multi_az\s*=\s*local\.current_config\.db_multi_az/);
    });

    test('RDS instance uses KMS encryption', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds_encryption\.arn/);
    });

    test('RDS instance has environment-specific deletion protection', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*var\.environment_suffix\s*==\s*"prod"/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*var\.environment_suffix\s*!=\s*"prod"/);
    });

    test('RDS instance is not publicly accessible', () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('declares Application Load Balancer', () => {
      expect(hasResource(stackContent, 'aws_lb', 'main')).toBe(true);
    });

    test('ALB is external facing', () => {
      expect(stackContent).toMatch(/aws_lb.*main[\s\S]*internal\s*=\s*false/s);
    });

    test('ALB uses application load balancer type', () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test('ALB deletion protection is environment-specific', () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*var\.environment_suffix\s*==\s*"prod"/);
    });

    test('declares target group with health checks', () => {
      expect(hasResource(stackContent, 'aws_lb_target_group', 'app')).toBe(true);
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/path\s*=\s*"\/health"/);
    });

    test('declares load balancer listener', () => {
      expect(hasResource(stackContent, 'aws_lb_listener', 'app')).toBe(true);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });
  });

  describe('S3 Storage Resources', () => {
    test('declares S3 bucket with unique naming', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'assets')).toBe(true);
      expect(hasResource(stackContent, 'random_id', 'bucket_suffix')).toBe(true);
    });

    test('declares S3 bucket versioning', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_versioning', 'assets')).toBe(true);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('declares S3 bucket encryption with KMS', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', 'assets')).toBe(true);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3_encryption\.arn/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('declares S3 bucket public access block', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_public_access_block', 'assets')).toBe(true);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('declares S3 bucket lifecycle configuration', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_lifecycle_configuration', 'assets')).toBe(true);
      expect(stackContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"DEEP_ARCHIVE"/);
    });

    test('S3 lifecycle uses environment-specific archive days', () => {
      expect(stackContent).toMatch(/days\s*=\s*local\.current_config\.s3_archive_days/);
    });

    test('S3 lifecycle transitions have proper intervals', () => {
      expect(stackContent).toMatch(/days\s*=\s*local\.current_config\.s3_archive_days\s*\+\s*30/);
      expect(stackContent).toMatch(/days\s*=\s*local\.current_config\.s3_archive_days\s*\+\s*120/);
    });
  });

  describe('IAM Resources', () => {
    test('declares IAM role for application', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'app_role')).toBe(true);
    });

    test('declares IAM instance profile', () => {
      expect(hasResource(stackContent, 'aws_iam_instance_profile', 'app_profile')).toBe(true);
    });

    test('declares IAM policy for S3 access', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'app_s3_policy')).toBe(true);
    });

    test('IAM role has EC2 assume role policy', () => {
      expect(stackContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test('S3 policy grants appropriate permissions', () => {
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"s3:ListBucket"/);
    });
  });

  describe('Resource Tagging', () => {
    const taggedResources = [
      ['aws_kms_key', 'rds_encryption'],
      ['aws_kms_key', 's3_encryption'],
      ['aws_vpc', 'main'],
      ['aws_subnet', 'public'],
      ['aws_security_group', 'alb'],
      ['aws_db_instance', 'main'],
      ['aws_lb', 'main'],
      ['aws_s3_bucket', 'assets']
    ];

    test.each(taggedResources)('resource %s.%s is properly tagged', (resourceType, resourceName) => {
      expect(hasTagging(stackContent, resourceType, resourceName)).toBe(true);
    });

    test('tags use common_tags merge pattern', () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe('Output Values', () => {
    const requiredOutputs = [
      'rds_endpoint',
      'alb_dns_name',
      's3_bucket_name',
      'environment_summary',
      'security_group_ids',
      'kms_key_arns'
    ];

    test.each(requiredOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('outputs have proper descriptions', () => {
      expect(outputsContent).toMatch(/description\s*=\s*"RDS instance endpoint"/);
      expect(outputsContent).toMatch(/description\s*=\s*"DNS name of the Application Load Balancer"/);
      expect(outputsContent).toMatch(/description\s*=\s*"Name of the S3 bucket for application assets"/);
    });

    test('environment summary output includes all key information', () => {
      expect(outputsContent).toMatch(/environment_summary[\s\S]*environment[\s\S]*project_name[\s\S]*region/s);
      expect(outputsContent).toMatch(/database_endpoint[\s\S]*alb_dns_name[\s\S]*s3_bucket_name/s);
    });
  });

  describe('Environment Configuration Files', () => {
    test('dev.tfvars has correct region and configuration', () => {
      expect(devTfvarsContent).toMatch(/aws_region\s*=\s*"eu-west-1"/);
      expect(devTfvarsContent).toMatch(/environment_suffix\s*=\s*"dev"/);
      expect(devTfvarsContent).toMatch(/db_engine_version\s*=\s*"15\.10"/);
    });

    test('staging.tfvars has correct region and configuration', () => {
      expect(stagingTfvarsContent).toMatch(/aws_region\s*=\s*"us-west-2"/);
      expect(stagingTfvarsContent).toMatch(/environment_suffix\s*=\s*"staging"/);
      expect(stagingTfvarsContent).toMatch(/db_engine_version\s*=\s*"15\.10"/);
    });

    test('prod.tfvars has correct region and configuration', () => {
      expect(prodTfvarsContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
      expect(prodTfvarsContent).toMatch(/environment_suffix\s*=\s*"prod"/);
      expect(prodTfvarsContent).toMatch(/db_engine_version\s*=\s*"15\.10"/);
    });

    test('environment files use consistent project naming', () => {
      expect(devTfvarsContent).toMatch(/project_name\s*=\s*"payment-platform"/);
      expect(stagingTfvarsContent).toMatch(/project_name\s*=\s*"payment-platform"/);
      expect(prodTfvarsContent).toMatch(/project_name\s*=\s*"payment-platform"/);
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded secrets or sensitive values', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^T][^e][^m][^p]/); // Only temp passwords allowed
      expect(stackContent).not.toMatch(/access_key|secret_key/);
    });

    test('encryption is enabled for all storage resources', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test('resources follow least privilege security model', () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('backup and retention policies are configured', () => {
      expect(stackContent).toMatch(/backup_retention_period/);
      expect(stackContent).toMatch(/backup_window/);
      expect(stackContent).toMatch(/maintenance_window/);
    });
  });
});