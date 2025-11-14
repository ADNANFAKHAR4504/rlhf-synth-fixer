// terraform.unit.test.ts
// Comprehensive unit tests for Zero-Trust Security Infrastructure Terraform Stack
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
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const hasTagging = (content: string, resourceType: string, resourceName: string): boolean => {
  const tagsRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?tags\\s*=`, 's');
  return tagsRegex.test(content);
};

const hasLocalBlock = (content: string): boolean => {
  return /locals\s*{/.test(content);
};

const extractResourceBlock = (content: string, resourceType: string, resourceName: string): string => {
  const startRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`);
  const startMatch = content.search(startRegex);

  if (startMatch === -1) return '';

  let braceCount = 0;
  let i = startMatch;
  let inString = false;
  let escaped = false;

  while (i < content.length) {
    const char = content[i];

    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"' && !escaped) {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return content.substring(startMatch, i + 1);
        }
      }
    }
    i++;
  }

  return '';
};

describe('Zero-Trust Security Infrastructure Terraform Stack - Unit Tests', () => {
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

    test('tap_stack.tf is comprehensive infrastructure definition', () => {
      expect(stackContent.length).toBeGreaterThan(10000);
    });

    test('variables.tf contains variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(1000);
    });

    test('outputs.tf contains output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(1000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=.*1\./);
    });

    test('configures AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/aws\s*=\s*{[\s\S]*version\s*=\s*">=\s*[45]\./);
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
      'environment',
      'project_name',
      'owner',
      'vpc_cidr',
      'private_subnet_cidrs',
      'log_retention_days',
      'kms_key_rotation_days',
      'iam_session_duration_hours',
      'allowed_cidr_blocks',
      'enable_fips_endpoints',
      'application_bucket_name',
      'audit_bucket_name'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });

    test('aws_region variable has proper default', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"[^"]+"/);
    });

    test('environment variable has default value', () => {
      expect(variablesContent).toMatch(/variable\s+"environment"[\s\S]*?default\s*=\s*"dev"/);
    });

    test('variables use descriptive defaults (region-agnostic)', () => {
      expect(variablesContent).not.toMatch(/"us-east-1"/);
      expect(variablesContent).not.toMatch(/"eu-west-1"/);
    });

    test('vpc_cidr has valid RFC 1918 default', () => {
      expect(variablesContent).toMatch(/vpc_cidr[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('private_subnet_cidrs uses list of strings', () => {
      expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"[\s\S]*?type\s*=\s*list\(string\)/);
    });

    test('kms_key_rotation_days has security-compliant default', () => {
      expect(variablesContent).toMatch(/kms_key_rotation_days[\s\S]*?default\s*=\s*90/);
    });

    test('log_retention_days has compliance-friendly default', () => {
      expect(variablesContent).toMatch(/log_retention_days[\s\S]*?default\s*=\s*90/);
    });
  });

  describe('Data Sources', () => {
    test('declares availability zones data source', () => {
      expect(hasDataSource(stackContent, 'aws_availability_zones', 'available')).toBe(true);
    });

    test('availability zones data source filters available zones', () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"[\s\S]*?state\s*=\s*"available"/);
    });

    test('declares AWS caller identity data source', () => {
      expect(hasDataSource(stackContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('data sources use region-agnostic configuration', () => {
      expect(stackContent).not.toMatch(/data.*aws_availability_zones.*names.*=.*\["us-/);
    });
  });

  describe('Locals Configuration', () => {
    test('declares locals block', () => {
      expect(hasLocalBlock(stackContent)).toBe(true);
    });

    test('defines name_prefix in locals', () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${var\.project_name}-\${var\.environment}"/);
    });

    test('defines common_tags in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*Project[\s\S]*Environment[\s\S]*Owner/);
    });

    test('defines account_id reference in locals', () => {
      expect(stackContent).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
    });

    test('defines bucket names with account ID prefix', () => {
      expect(stackContent).toMatch(/app_bucket_name\s*=.*account_id.*app-data/);
      expect(stackContent).toMatch(/audit_bucket_name\s*=.*account_id.*audit-logs/);
    });

    test('bucket names use conditional logic for custom naming', () => {
      expect(stackContent).toMatch(/var\.application_bucket_name\s*!=\s*""\s*\?/);
      expect(stackContent).toMatch(/var\.audit_bucket_name\s*!=\s*""\s*\?/);
    });
  });

  describe('KMS Encryption Resources', () => {
    test('declares customer-managed KMS key', () => {
      expect(hasResource(stackContent, 'aws_kms_key', 'main')).toBe(true);
    });

    test('declares KMS alias', () => {
      expect(hasResource(stackContent, 'aws_kms_alias', 'main')).toBe(true);
    });

    test('KMS key has appropriate deletion window', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'main', 'deletion_window_in_days')).toBe(true);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*10/);
    });

    test('KMS key has encryption and decryption usage', () => {
      expect(stackContent).toMatch(/key_usage\s*=\s*"ENCRYPT_DECRYPT"/);
    });

    test('KMS key uses symmetric encryption', () => {
      expect(stackContent).toMatch(/customer_master_key_spec\s*=\s*"SYMMETRIC_DEFAULT"/);
    });

    test('KMS key has rotation enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'main', 'enable_key_rotation')).toBe(true);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS key uses variable for rotation period', () => {
      expect(stackContent).toMatch(/rotation_period_in_days\s*=\s*var\.kms_key_rotation_days/);
    });

    test('KMS key has comprehensive IAM policy', () => {
      expect(hasResourceAttribute(stackContent, 'aws_kms_key', 'main', 'policy')).toBe(true);
    });

    test('KMS policy allows root account permissions', () => {
      expect(stackContent).toMatch(/Principal[\s\S]*AWS.*arn:aws:iam.*:root/);
    });

    test('KMS policy allows CloudWatch Logs service', () => {
      expect(stackContent).toMatch(/Principal[\s\S]*Service.*logs\.\${var\.aws_region}\.amazonaws\.com/);
    });

    test('KMS policy allows S3 service', () => {
      expect(stackContent).toMatch(/Principal[\s\S]*Service.*s3\.amazonaws\.com/);
    });

    test('KMS resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_kms_key', 'main')).toBe(true);
    });

    test('KMS alias uses dynamic naming', () => {
      expect(stackContent).toMatch(/name\s*=\s*"alias\/\${local\.name_prefix}-main-key"/);
    });
  });

  describe('Networking Resources', () => {
    test('declares VPC resource', () => {
      expect(hasResource(stackContent, 'aws_vpc', 'main')).toBe(true);
    });

    test('VPC uses variable for CIDR block', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'cidr_block')).toBe(true);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('VPC has DNS support enabled', () => {
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_hostnames')).toBe(true);
      expect(hasResourceAttribute(stackContent, 'aws_vpc', 'main', 'enable_dns_support')).toBe(true);
    });

    test('declares private subnets with count', () => {
      expect(hasResource(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(stackContent).toMatch(/count\s*=\s*min\(length\(data\.aws_availability_zones\.available\.names\)/);
    });

    test('private subnets use dynamic CIDR blocks', () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidrs\[count\.index\]/);
    });

    test('private subnets use dynamic availability zones', () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test('declares private route table', () => {
      expect(hasResource(stackContent, 'aws_route_table', 'private')).toBe(true);
    });

    test('declares route table associations for private subnets', () => {
      expect(hasResource(stackContent, 'aws_route_table_association', 'private')).toBe(true);
    });

    test('networking resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_vpc', 'main')).toBe(true);
      expect(hasTagging(stackContent, 'aws_subnet', 'private')).toBe(true);
      expect(hasTagging(stackContent, 'aws_route_table', 'private')).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('declares HTTPS-only security group', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'https_only')).toBe(true);
    });

    test('declares VPC endpoints security group', () => {
      expect(hasResource(stackContent, 'aws_security_group', 'vpc_endpoints')).toBe(true);
    });

    test('HTTPS security group allows only HTTPS traffic', () => {
      const sgBlock = extractResourceBlock(stackContent, 'aws_security_group', 'https_only');
      expect(sgBlock).toMatch(/from_port\s*=\s*443/);
      expect(sgBlock).toMatch(/to_port\s*=\s*443/);
      expect(sgBlock).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test('HTTPS security group uses allowed CIDR blocks', () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*var\.allowed_cidr_blocks/);
    });

    test('VPC endpoints security group allows HTTPS from VPC', () => {
      const sgBlock = extractResourceBlock(stackContent, 'aws_security_group', 'vpc_endpoints');
      expect(sgBlock).toMatch(/from_port\s*=\s*443/);
      expect(sgBlock).toMatch(/to_port\s*=\s*443/);
    });

    test('security groups are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_security_group', 'https_only')).toBe(true);
      expect(hasTagging(stackContent, 'aws_security_group', 'vpc_endpoints')).toBe(true);
    });

    test('security groups reference VPC ID dynamically', () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe('VPC Endpoints', () => {
    const vpcEndpoints = ['s3', 'ec2', 'ssm', 'logs'];

    test.each(vpcEndpoints)('declares %s VPC endpoint', (endpoint) => {
      expect(hasResource(stackContent, 'aws_vpc_endpoint', endpoint)).toBe(true);
    });

    test('S3 VPC endpoint is gateway type', () => {
      const s3Block = extractResourceBlock(stackContent, 'aws_vpc_endpoint', 's3');
      expect(s3Block).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
    });

    test('S3 VPC endpoint has proper service name', () => {
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.s3"/);
    });

    test('interface endpoints use proper service names', () => {
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.ec2"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.ssm"/);
      expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.logs"/);
    });

    test('interface endpoints are Interface type', () => {
      const interfaceEndpoints = ['ec2', 'ssm', 'logs'];
      interfaceEndpoints.forEach(endpoint => {
        const block = extractResourceBlock(stackContent, 'aws_vpc_endpoint', endpoint);
        expect(block).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
      });
    });

    test('interface endpoints reference private subnets', () => {
      const interfaceEndpoints = ['ec2', 'ssm', 'logs'];
      interfaceEndpoints.forEach(endpoint => {
        const block = extractResourceBlock(stackContent, 'aws_vpc_endpoint', endpoint);
        expect(block).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      });
    });

    test('interface endpoints use VPC endpoints security group', () => {
      const interfaceEndpoints = ['ec2', 'ssm', 'logs'];
      interfaceEndpoints.forEach(endpoint => {
        const block = extractResourceBlock(stackContent, 'aws_vpc_endpoint', endpoint);
        expect(block).toMatch(/security_group_ids\s*=\s*\[aws_security_group\.vpc_endpoints\.id\]/);
      });
    });

    test('VPC endpoints enable private DNS (where applicable)', () => {
      const interfaceEndpoints = ['ec2', 'ssm', 'logs'];
      interfaceEndpoints.forEach(endpoint => {
        const block = extractResourceBlock(stackContent, 'aws_vpc_endpoint', endpoint);
        expect(block).toMatch(/private_dns_enabled\s*=\s*true/);
      });
    });

    test('VPC endpoints have proper policies', () => {
      vpcEndpoints.forEach(endpoint => {
        expect(hasResourceAttribute(stackContent, 'aws_vpc_endpoint', endpoint, 'policy')).toBe(true);
      });
    });

    test('VPC endpoints are properly tagged', () => {
      vpcEndpoints.forEach(endpoint => {
        expect(hasTagging(stackContent, 'aws_vpc_endpoint', endpoint)).toBe(true);
      });
    });
  });

  describe('S3 Bucket Resources', () => {
    const buckets = ['application_data', 'audit_logs'];

    test.each(buckets)('declares %s S3 bucket', (bucket) => {
      expect(hasResource(stackContent, 'aws_s3_bucket', bucket)).toBe(true);
    });

    test.each(buckets)('declares %s bucket encryption configuration', (bucket) => {
      expect(hasResource(stackContent, 'aws_s3_bucket_server_side_encryption_configuration', bucket)).toBe(true);
    });

    test.each(buckets)('declares %s bucket versioning', (bucket) => {
      expect(hasResource(stackContent, 'aws_s3_bucket_versioning', bucket)).toBe(true);
    });

    test.each(buckets)('declares %s bucket public access block', (bucket) => {
      expect(hasResource(stackContent, 'aws_s3_bucket_public_access_block', bucket)).toBe(true);
    });

    test('declares config S3 bucket', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'config')).toBe(true);
    });

    test('buckets use dynamic naming from locals', () => {
      expect(stackContent).toMatch(/bucket\s*=\s*local\.app_bucket_name/);
      expect(stackContent).toMatch(/bucket\s*=\s*local\.audit_bucket_name/);
    });

    test('buckets use customer-managed KMS encryption', () => {
      const encryptionBlocks = stackContent.match(/aws_s3_bucket_server_side_encryption_configuration[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/g);
      expect(encryptionBlocks).toHaveLength(3); // application_data, audit_logs, and config buckets
    });

    test('buckets have versioning enabled', () => {
      buckets.forEach(bucket => {
        const versionBlock = extractResourceBlock(stackContent, 'aws_s3_bucket_versioning', bucket);
        expect(versionBlock).toMatch(/status\s*=\s*"Enabled"/);
      });
    });

    test('buckets block all public access', () => {
      buckets.forEach(bucket => {
        const publicBlock = extractResourceBlock(stackContent, 'aws_s3_bucket_public_access_block', bucket);
        expect(publicBlock).toMatch(/block_public_acls\s*=\s*true/);
        expect(publicBlock).toMatch(/block_public_policy\s*=\s*true/);
        expect(publicBlock).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(publicBlock).toMatch(/restrict_public_buckets\s*=\s*true/);
      });
    });

    test('application data bucket has access logging', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_logging', 'application_data')).toBe(true);
    });

    test('application bucket logs to audit bucket', () => {
      const loggingBlock = extractResourceBlock(stackContent, 'aws_s3_bucket_logging', 'application_data');
      expect(loggingBlock).toMatch(/target_bucket\s*=\s*aws_s3_bucket\.audit_logs\.id/);
    });

    test('audit logs bucket has lifecycle configuration', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_lifecycle_configuration', 'audit_logs')).toBe(true);
    });

    test('lifecycle policy uses variable for retention period', () => {
      const lifecycleBlock = extractResourceBlock(stackContent, 'aws_s3_bucket_lifecycle_configuration', 'audit_logs');
      expect(lifecycleBlock).toMatch(/days\s*=\s*var\.log_retention_days/);
    });

    test('buckets are properly tagged', () => {
      buckets.forEach(bucket => {
        expect(hasTagging(stackContent, 'aws_s3_bucket', bucket)).toBe(true);
      });
      expect(hasTagging(stackContent, 'aws_s3_bucket', 'config')).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('declares IAM permission boundary policy', () => {
      expect(hasResource(stackContent, 'aws_iam_policy', 'permission_boundary')).toBe(true);
    });

    test('declares IAM application role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'application_role')).toBe(true);
    });

    test('declares IAM config role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'config')).toBe(true);
    });

    test('declares IAM role policy for application', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy', 'application_role')).toBe(true);
    });

    test('declares IAM role policy attachment for config', () => {
      expect(hasResource(stackContent, 'aws_iam_role_policy_attachment', 'config')).toBe(true);
    });

    test('IAM application role uses variable for session duration', () => {
      const roleBlock = extractResourceBlock(stackContent, 'aws_iam_role', 'application_role');
      expect(roleBlock).toMatch(/max_session_duration\s*=\s*var\.iam_session_duration_hours\s*\*\s*3600/);
    });

    test('IAM application role has permission boundary', () => {
      const roleBlock = extractResourceBlock(stackContent, 'aws_iam_role', 'application_role');
      expect(roleBlock).toMatch(/permissions_boundary\s*=\s*aws_iam_policy\.permission_boundary\.arn/);
    });

    test('IAM policies use least privilege principle', () => {
      const policyBlock = extractResourceBlock(stackContent, 'aws_iam_role_policy', 'application_role');
      expect(policyBlock).toMatch(/s3:GetObject/);
      expect(policyBlock).toMatch(/s3:PutObject/);
      expect(policyBlock).not.toMatch(/s3:\*/);
    });

    test('IAM permission boundary limits scope', () => {
      const boundaryBlock = extractResourceBlock(stackContent, 'aws_iam_policy', 'permission_boundary');
      expect(boundaryBlock).toMatch(/s3:GetObject/);
      expect(boundaryBlock).toMatch(/s3:PutObject/);
      expect(boundaryBlock).toMatch(/kms:Encrypt/);
      expect(boundaryBlock).toMatch(/logs:CreateLogGroup/);
    });

    test('IAM resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_iam_policy', 'permission_boundary')).toBe(true);
      expect(hasTagging(stackContent, 'aws_iam_role', 'application_role')).toBe(true);
      expect(hasTagging(stackContent, 'aws_iam_role', 'config')).toBe(true);
    });
  });

  describe('CloudWatch Resources', () => {
    test('declares CloudWatch audit trail log group', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'audit_trail')).toBe(true);
    });

    test('declares CloudWatch application log group', () => {
      expect(hasResource(stackContent, 'aws_cloudwatch_log_group', 'application_logs')).toBe(true);
    });

    test('log groups use KMS encryption', () => {
      const auditLogBlock = extractResourceBlock(stackContent, 'aws_cloudwatch_log_group', 'audit_trail');
      const appLogBlock = extractResourceBlock(stackContent, 'aws_cloudwatch_log_group', 'application_logs');
      expect(auditLogBlock).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(appLogBlock).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('log groups use variable for retention period', () => {
      const auditLogBlock = extractResourceBlock(stackContent, 'aws_cloudwatch_log_group', 'audit_trail');
      const appLogBlock = extractResourceBlock(stackContent, 'aws_cloudwatch_log_group', 'application_logs');
      expect(auditLogBlock).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
      expect(appLogBlock).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test('log groups use dynamic naming patterns', () => {
      const auditLogBlock = extractResourceBlock(stackContent, 'aws_cloudwatch_log_group', 'audit_trail');
      const appLogBlock = extractResourceBlock(stackContent, 'aws_cloudwatch_log_group', 'application_logs');
      expect(auditLogBlock).toMatch(/name\s*=\s*"\/aws\/\${var\.project_name}\/audit-trail"/);
      expect(appLogBlock).toMatch(/name\s*=\s*"\/aws\/\${var\.project_name}\/application"/);
    });

    test('log groups are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_cloudwatch_log_group', 'audit_trail')).toBe(true);
      expect(hasTagging(stackContent, 'aws_cloudwatch_log_group', 'application_logs')).toBe(true);
    });
  });

  describe('AWS Config Resources', () => {
    test('declares AWS Config bucket', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket', 'config')).toBe(true);
    });

    test('declares AWS Config bucket policy', () => {
      expect(hasResource(stackContent, 'aws_s3_bucket_policy', 'config')).toBe(true);
    });

    test('declares AWS Config IAM role', () => {
      expect(hasResource(stackContent, 'aws_iam_role', 'config')).toBe(true);
    });

    test('declares AWS Config delivery channel', () => {
      expect(hasResource(stackContent, 'aws_config_delivery_channel', 'main')).toBe(true);
    });

    test('declares AWS Config configuration recorder', () => {
      expect(hasResource(stackContent, 'aws_config_configuration_recorder', 'main')).toBe(true);
    });

    test('declares AWS Config rules for compliance', () => {
      expect(hasResource(stackContent, 'aws_config_config_rule', 's3_bucket_server_side_encryption_enabled')).toBe(true);
      expect(hasResource(stackContent, 'aws_config_config_rule', 'iam_password_policy')).toBe(true);
      expect(hasResource(stackContent, 'aws_config_config_rule', 'access_keys_rotated')).toBe(true);
    });

    test('Config bucket uses dynamic naming', () => {
      const configBucket = extractResourceBlock(stackContent, 'aws_s3_bucket', 'config');
      expect(configBucket).toMatch(/bucket\s*=\s*"\${local\.account_id}-\${local\.name_prefix}-aws-config"/);
    });

    test('Config recorder enables all resources', () => {
      const recorder = extractResourceBlock(stackContent, 'aws_config_configuration_recorder', 'main');
      expect(recorder).toMatch(/all_supported\s*=\s*true/);
      expect(recorder).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test('Config rules have proper compliance settings', () => {
      // Password policy rule
      const passwordRule = extractResourceBlock(stackContent, 'aws_config_config_rule', 'iam_password_policy');
      expect(passwordRule).toMatch(/RequireUppercaseCharacters.*true/);
      expect(passwordRule).toMatch(/MinimumPasswordLength.*14/);

      // Access keys rotation rule
      const accessKeysRule = extractResourceBlock(stackContent, 'aws_config_config_rule', 'access_keys_rotated');
      expect(accessKeysRule).toMatch(/maxAccessKeyAge.*90/);
    });

    test('Config resources are properly tagged', () => {
      expect(hasTagging(stackContent, 'aws_s3_bucket', 'config')).toBe(true);
      expect(hasTagging(stackContent, 'aws_iam_role', 'config')).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    const taggedResourceTypes = [
      'aws_kms_key',
      'aws_vpc',
      'aws_subnet',
      'aws_security_group',
      'aws_vpc_endpoint',
      'aws_s3_bucket',
      'aws_iam_policy',
      'aws_iam_role'
    ];

    test('all major resources use common_tags pattern', () => {
      taggedResourceTypes.forEach(resourceType => {
        const resourceMatches = stackContent.match(new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g'));
        if (resourceMatches) {
          expect(stackContent).toMatch(new RegExp(`${resourceType}.*tags\\s*=\\s*merge\\(local\\.common_tags`, 's'));
        }
      });
    });

    test('common_tags includes required fields', () => {
      expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/Owner\s*=\s*var\.owner/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(stackContent).toMatch(/Purpose\s*=\s*"Zero-Trust Security Infrastructure"/);
    });

    test('resources have descriptive Name tags', () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${local\.name_prefix}-[^"]+"/);
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded sensitive values', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
      expect(stackContent).not.toMatch(/key\s*=\s*"AKIA[^"]+"/);
    });

    test('encryption is enabled for all applicable resources', () => {
      // KMS key exists
      expect(hasResource(stackContent, 'aws_kms_key', 'main')).toBe(true);

      // S3 buckets use encryption
      expect(countResourceOccurrences(stackContent, 'aws_s3_bucket_server_side_encryption_configuration')).toBeGreaterThanOrEqual(2);
    });

    test('public access is blocked on S3 buckets', () => {
      expect(countResourceOccurrences(stackContent, 'aws_s3_bucket_public_access_block')).toBeGreaterThanOrEqual(2);
    });

    test('VPC endpoints reduce internet dependency', () => {
      expect(countResourceOccurrences(stackContent, 'aws_vpc_endpoint')).toBeGreaterThanOrEqual(4);
    });

    test('security groups follow least privilege', () => {
      // HTTPS-only security group exists
      expect(hasResource(stackContent, 'aws_security_group', 'https_only')).toBe(true);

      // No overly permissive rules (allow some specific cases for VPC endpoints)
      expect(stackContent).not.toMatch(/from_port\s*=\s*0[\s\S]*to_port\s*=\s*65535/);
    });

    test('IAM policies use resource-specific permissions', () => {
      // Check for S3 bucket ARN patterns in IAM policies
      expect(stackContent).toMatch(/aws_s3_bucket\.application_data\.arn/);
      expect(stackContent).toMatch(/aws_s3_bucket\.audit_logs\.arn/);
      // Check that wildcard permissions are not used inappropriately
      const iamBlocks = stackContent.match(/aws_iam_role_policy[\s\S]*?Resource.*\*/g);
      if (iamBlocks) {
        // Only allow specific cases like KMS or CloudWatch permissions
        iamBlocks.forEach(block => {
          expect(block).toMatch(/(kms|logs|config)/);
        });
      }
    });

    test('permission boundaries are implemented', () => {
      expect(hasResource(stackContent, 'aws_iam_policy', 'permission_boundary')).toBe(true);
      expect(stackContent).toMatch(/permissions_boundary\s*=\s*aws_iam_policy\.permission_boundary\.arn/);
    });
  });

  describe('Region Agnostic Configuration', () => {
    test('uses variables for region-specific values', () => {
      expect(stackContent).toMatch(/\${var\.aws_region}/);
      expect(stackContent).not.toMatch(/us-east-1/);
      expect(stackContent).not.toMatch(/us-west-2/);
      expect(stackContent).not.toMatch(/eu-west-1/);
    });

    test('availability zones are dynamically determined', () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available\.names/);
    });

    test('service names use region variables', () => {
      expect(stackContent).toMatch(/com\.amazonaws\.\${var\.aws_region}/);
    });

    test('account ID is dynamically resolved', () => {
      expect(stackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    });
  });

  describe('Output Validation', () => {
    const expectedOutputs = [
      'kms_key_arn',
      'kms_key_id',
      'kms_alias_name',
      'vpc_id',
      'vpc_cidr_block',
      'private_subnet_ids',
      'vpc_endpoint_s3_id',
      'vpc_endpoint_ec2_id',
      'vpc_endpoint_ssm_id',
      'vpc_endpoint_logs_id',
      'vpc_endpoint_ids',
      'application_data_bucket_name',
      'application_data_bucket_arn',
      'audit_logs_bucket_name',
      'audit_logs_bucket_arn',
      'config_bucket_name',
      'application_role_arn',
      'application_role_name',
      'config_role_arn',
      'permission_boundary_arn',
      'https_security_group_id',
      'vpc_endpoints_security_group_id',
      'audit_trail_log_group_name',
      'audit_trail_log_group_arn',
      'application_log_group_name',
      'application_log_group_arn',
      'config_recorder_name',
      'config_delivery_channel_name',
      'config_rule_arns',
      'infrastructure_summary'
    ];

    test.each(expectedOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('outputs have proper descriptions', () => {
      expectedOutputs.forEach(outputName => {
        const outputRegex = new RegExp(`output\\s+"${outputName}"[\\s\\S]*?description\\s*=`, 's');
        expect(outputsContent).toMatch(outputRegex);
      });
    });

    test('outputs reference created resources', () => {
      expect(outputsContent).toMatch(/value\s*=\s*aws_kms_key\.main\.arn/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.application_data/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_iam_role\.application_role/);
    });

    test('composite outputs aggregate related resources', () => {
      expect(outputsContent).toMatch(/vpc_endpoint_ids[\s\S]*s3[\s\S]*ec2[\s\S]*ssm[\s\S]*logs/);
      expect(outputsContent).toMatch(/config_rule_arns[\s\S]*s3_encryption_rule[\s\S]*iam_password_policy[\s\S]*access_keys_rotated/);
      expect(outputsContent).toMatch(/infrastructure_summary[\s\S]*vpc_id[\s\S]*kms_key_arn[\s\S]*deployment_region/);
    });

    test('infrastructure summary includes key metrics', () => {
      expect(outputsContent).toMatch(/vpc_endpoint_count\s*=\s*4/);
      expect(outputsContent).toMatch(/s3_buckets_count\s*=\s*3/);
      expect(outputsContent).toMatch(/iam_roles_count\s*=\s*2/);
      expect(outputsContent).toMatch(/config_rules_count\s*=\s*3/);
      expect(outputsContent).toMatch(/log_groups_count\s*=\s*2/);
    });

    test('outputs do not expose sensitive values directly', () => {
      // Check that no outputs expose raw credentials or keys
      expect(outputsContent).not.toMatch(/value\s*=\s*"[A-Za-z0-9+\/=]{40,}"/); // Base64 encoded secrets
      expect(outputsContent).not.toMatch(/\bpassword\s*=\s*"[^"]+"/); // Direct password assignments
      expect(outputsContent).not.toMatch(/\bsecret\s*=\s*"[^"]+"/); // Direct secret assignments
    });
  });
});
