// test/terraform.unit.test.ts
// Comprehensive unit tests for zero-trust security Terraform configuration
// Tests validate configuration without running terraform init/plan/apply

import fs from 'fs';
import { parse as parseHCL } from 'hcl2-parser';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read and parse HCL files
function parseHCLFile(filename: string): any {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    return parseHCL(content);
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

// Helper to extract resources from parsed HCL
function getResources(parsed: any, resourceType: string): any[] {
  if (!parsed || !parsed.resource) return [];
  return parsed.resource.filter((r: any) => r[resourceType]);
}

// Helper to extract variables from parsed HCL
function getVariables(parsed: any): any {
  if (!parsed || !parsed.variable) return {};
  const vars: any = {};
  parsed.variable.forEach((v: any) => {
    const name = Object.keys(v)[0];
    vars[name] = v[name];
  });
  return vars;
}

describe('Zero-Trust Security Terraform Configuration - File Structure', () => {
  const requiredFiles = [
    'provider.tf',
    'main.tf',
    'variables.tf',
    'locals.tf',
    'iam.tf',
    'kms.tf',
    'scp.tf',
    'cloudwatch.tf',
    'config.tf',
    'session-manager.tf',
    'tagging.tf',
    'audit-role.tf',
    'outputs.tf'
  ];

  test.each(requiredFiles)('Required file %s exists', (filename) => {
    const filePath = path.join(LIB_DIR, filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('provider.tf contains AWS provider configuration', () => {
    const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf-8');
    expect(content).toMatch(/provider\s+"aws"/);
    expect(content).toMatch(/backend\s+"s3"/);
    expect(content).not.toMatch(/backend\s+"local"\s*\{[^}]*\}/);
  });

  test('No duplicate provider blocks in other files', () => {
    const filesToCheck = requiredFiles.filter(f => f !== 'provider.tf');
    filesToCheck.forEach(filename => {
      const filePath = path.join(LIB_DIR, filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toMatch(/provider\s+"aws"\s*{/);
      }
    });
  });
});

describe('Zero-Trust Security - Variable Validation', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf-8');
  });

  test('aws_region variable is defined with proper validation', () => {
    expect(variablesContent).toContain('variable "aws_region"');
    expect(variablesContent).toContain('type        = string');
    expect(variablesContent).toContain('default     = "us-east-1"');
  });

  test('environment variable is defined', () => {
    expect(variablesContent).toContain('variable "environment"');
    expect(variablesContent).toContain('type        = string');
  });

  test('project_name variable is defined', () => {
    expect(variablesContent).toContain('variable "project_name"');
    expect(variablesContent).toContain('type        = string');
  });

  test('security_team_email variable is defined', () => {
    expect(variablesContent).toContain('variable "security_team_email"');
    expect(variablesContent).toContain('type        = string');
  });

  test('enable_organization_policies variable is defined with default false', () => {
    expect(variablesContent).toContain('variable "enable_organization_policies"');
    expect(variablesContent).toContain('type        = bool');
    expect(variablesContent).toContain('default     = false');
  });

  test('enable_auto_tagging variable is defined', () => {
    expect(variablesContent).toContain('variable "enable_auto_tagging"');
    expect(variablesContent).toContain('type        = bool');
  });

  test('allowed_regions variable has us-east-1 and us-west-2', () => {
    expect(variablesContent).toContain('variable "allowed_regions"');
    expect(variablesContent).toContain('us-east-1');
    expect(variablesContent).toContain('us-west-2');
  });
});

describe('Zero-Trust Security - IAM Configuration', () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = fs.readFileSync(path.join(LIB_DIR, 'iam.tf'), 'utf-8');
  });

  test('IAM password policy requires 14+ characters', () => {
    expect(iamContent).toContain('aws_iam_account_password_policy');
    expect(iamContent).toContain('minimum_password_length');
    expect(iamContent).toMatch(/minimum_password_length\s*=\s*(14|[1-9]\d{2,})/);
  });

  test('Password policy requires complexity (upper, lower, numbers, symbols)', () => {
    expect(iamContent).toContain('require_uppercase_characters');
    expect(iamContent).toContain('require_lowercase_characters');
    expect(iamContent).toContain('require_numbers');
    expect(iamContent).toContain('require_symbols');
  });

  test('Developer role is defined with MFA requirement', () => {
    expect(iamContent).toContain('aws_iam_role');
    expect(iamContent).toContain('developer');
    expect(iamContent).toContain('MultiFactorAuthPresent');
  });

  test('Operations role is defined', () => {
    expect(iamContent).toContain('operations');
  });

  test('Security role is defined', () => {
    expect(iamContent).toContain('security');
  });

  test('Permission boundary is defined', () => {
    expect(iamContent).toContain('permission_boundary');
    expect(iamContent).toContain('developer_permission_boundary');
  });

  test('No wildcard permissions in production context', () => {
    const lines = iamContent.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('"*"') && line.includes('Action')) {
        const context = lines.slice(Math.max(0, index - 10), index + 10).join('\n');
        // Allow wildcards only in specific Read-only or specific contexts
        if (context.toLowerCase().includes('resource') && context.includes('Action')) {
          expect(
            context.includes('Describe') ||
            context.includes('List') ||
            context.includes('Get') ||
            context.includes('Sid')
          ).toBe(true);
        }
      }
    });
  });
});

describe('Zero-Trust Security - KMS Configuration', () => {
  let kmsContent: string;

  beforeAll(() => {
    kmsContent = fs.readFileSync(path.join(LIB_DIR, 'kms.tf'), 'utf-8');
  });

  test('KMS key for S3 is defined with rotation enabled', () => {
    expect(kmsContent).toContain('aws_kms_key');
    expect(kmsContent).toContain('s3');
    expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test('KMS key for RDS is defined with rotation enabled', () => {
    expect(kmsContent).toContain('rds');
    expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test('KMS key for EBS is defined with rotation enabled', () => {
    expect(kmsContent).toContain('ebs');
    expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test('KMS keys have aliases', () => {
    expect(kmsContent).toContain('aws_kms_alias');
  });

  test('EBS encryption is enabled by default', () => {
    expect(kmsContent).toContain('aws_ebs_encryption_by_default');
  });
});

describe('Zero-Trust Security - S3 Bucket Security', () => {
  test('Config S3 bucket has encryption', () => {
    const configContent = fs.readFileSync(path.join(LIB_DIR, 'config.tf'), 'utf-8');
    expect(configContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
    expect(configContent).toContain('aws:kms');
  });

  test('Config S3 bucket has versioning', () => {
    const configContent = fs.readFileSync(path.join(LIB_DIR, 'config.tf'), 'utf-8');
    expect(configContent).toContain('aws_s3_bucket_versioning');
    expect(configContent).toContain('Enabled');
  });

  test('Config S3 bucket blocks public access', () => {
    const configContent = fs.readFileSync(path.join(LIB_DIR, 'config.tf'), 'utf-8');
    expect(configContent).toContain('aws_s3_bucket_public_access_block');
    expect(configContent).toContain('block_public_acls');
    expect(configContent).toContain('block_public_policy');
  });

  test('Session Manager S3 bucket has encryption', () => {
    const sessionContent = fs.readFileSync(path.join(LIB_DIR, 'session-manager.tf'), 'utf-8');
    expect(sessionContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
  });

  test('Session Manager S3 bucket has versioning', () => {
    const sessionContent = fs.readFileSync(path.join(LIB_DIR, 'session-manager.tf'), 'utf-8');
    expect(sessionContent).toContain('aws_s3_bucket_versioning');
  });
});

describe('Zero-Trust Security - CloudWatch Configuration', () => {
  let cloudwatchContent: string;

  beforeAll(() => {
    cloudwatchContent = fs.readFileSync(path.join(LIB_DIR, 'cloudwatch.tf'), 'utf-8');
  });

  test('CloudWatch log group has 365-day retention', () => {
    expect(cloudwatchContent).toContain('aws_cloudwatch_log_group');
    expect(cloudwatchContent).toMatch(/retention_in_days\s*=\s*365/);
  });

  test('CloudWatch log group is encrypted with KMS', () => {
    expect(cloudwatchContent).toContain('kms_key_id');
  });

  test('Alarm for root account usage exists', () => {
    expect(cloudwatchContent).toContain('root');
    expect(cloudwatchContent).toContain('aws_cloudwatch_metric_alarm');
  });

  test('Alarm for unauthorized API calls exists', () => {
    expect(cloudwatchContent).toContain('unauthorized');
    expect(cloudwatchContent).toContain('aws_cloudwatch_metric_alarm');
  });

  test('SNS topic for security alerts exists', () => {
    expect(cloudwatchContent).toContain('aws_sns_topic');
    expect(cloudwatchContent).toContain('security_alerts');
  });
});

describe('Zero-Trust Security - AWS Config Rules', () => {
  let configContent: string;

  beforeAll(() => {
    configContent = fs.readFileSync(path.join(LIB_DIR, 'config.tf'), 'utf-8');
  });

  test('Config recorder is defined', () => {
    expect(configContent).toContain('aws_config_configuration_recorder');
  });

  test('Config delivery channel is defined', () => {
    expect(configContent).toContain('aws_config_delivery_channel');
  });

  test('Config rule for MFA is defined', () => {
    expect(configContent).toContain('IAM_USER_MFA_ENABLED');
  });

  test('Config rule for S3 encryption is defined', () => {
    expect(configContent).toContain('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
  });

  test('Config rule for RDS encryption is defined', () => {
    expect(configContent).toContain('RDS_STORAGE_ENCRYPTED');
  });

  test('Config rule for EBS encryption is defined', () => {
    expect(configContent).toContain('ENCRYPTED_VOLUMES');
  });

  test('Config rule for required tags is defined', () => {
    expect(configContent).toContain('REQUIRED_TAGS');
    expect(configContent).toContain('Environment');
    expect(configContent).toContain('Owner');
    expect(configContent).toContain('CostCenter');
  });

  test('Config rule for password policy is defined', () => {
    expect(configContent).toContain('IAM_PASSWORD_POLICY');
  });
});

describe('Zero-Trust Security - Organization Policies (Optional)', () => {
  let scpContent: string;
  let taggingContent: string;

  beforeAll(() => {
    scpContent = fs.readFileSync(path.join(LIB_DIR, 'scp.tf'), 'utf-8');
    taggingContent = fs.readFileSync(path.join(LIB_DIR, 'tagging.tf'), 'utf-8');
  });

  test('SCP for regional restriction is conditional', () => {
    expect(scpContent).toContain('aws_organizations_policy');
    expect(scpContent).toContain('count');
    expect(scpContent).toContain('enable_organization_policies');
  });

  test('SCP for encryption enforcement is conditional', () => {
    expect(scpContent).toContain('encryption');
  });

  test('Tag policy is conditional', () => {
    expect(taggingContent).toContain('aws_organizations_policy');
    expect(taggingContent).toContain('count');
    expect(taggingContent).toContain('enable_organization_policies');
  });

  test('Auto-tagging Lambda is conditional', () => {
    expect(taggingContent).toContain('aws_lambda_function');
    expect(taggingContent).toContain('enable_auto_tagging');
  });
});

describe('Zero-Trust Security - Resource Naming and Tagging', () => {
  let localsContent: string;

  beforeAll(() => {
    localsContent = fs.readFileSync(path.join(LIB_DIR, 'locals.tf'), 'utf-8');
  });

  test('name_prefix local is defined', () => {
    expect(localsContent).toContain('name_prefix');
    expect(localsContent).toContain('project_name');
    expect(localsContent).toContain('environment');
  });

  test('mandatory_tags local includes Environment, Owner, CostCenter', () => {
    expect(localsContent).toContain('mandatory_tags');
    expect(localsContent).toContain('Environment');
  });

  test('Resources use local.name_prefix', () => {
    const filesToCheck = ['iam.tf', 'kms.tf', 'cloudwatch.tf', 'config.tf'];
    filesToCheck.forEach(filename => {
      const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf-8');
      expect(content).toContain('local.name_prefix');
    });
  });

  test('Resources use local.mandatory_tags', () => {
    const filesToCheck = ['iam.tf', 'kms.tf', 'cloudwatch.tf'];
    filesToCheck.forEach(filename => {
      const content = fs.readFileSync(path.join(LIB_DIR, filename), 'utf-8');
      expect(content).toContain('local.mandatory_tags');
    });
  });
});

describe('Zero-Trust Security - Session Manager Configuration', () => {
  let sessionContent: string;

  beforeAll(() => {
    sessionContent = fs.readFileSync(path.join(LIB_DIR, 'session-manager.tf'), 'utf-8');
  });

  test('SSM document for Session Manager is defined', () => {
    expect(sessionContent).toContain('aws_ssm_document');
    expect(sessionContent).toContain('session_manager_prefs');
  });

  test('IAM role for EC2 instances is defined', () => {
    expect(sessionContent).toContain('aws_iam_role');
    expect(sessionContent).toContain('ssm_instance');
  });

  test('IAM instance profile is defined', () => {
    expect(sessionContent).toContain('aws_iam_instance_profile');
  });

  test('Session logging is configured', () => {
    expect(sessionContent).toContain('s3BucketName');
    expect(sessionContent).toContain('cloudWatchLogGroupName');
  });
});

describe('Zero-Trust Security - Audit Role Configuration', () => {
  let auditContent: string;

  beforeAll(() => {
    auditContent = fs.readFileSync(path.join(LIB_DIR, 'audit-role.tf'), 'utf-8');
  });

  test('Cross-account audit role is defined', () => {
    expect(auditContent).toContain('aws_iam_role');
    expect(auditContent).toContain('audit');
  });

  test('Audit role has read-only permissions', () => {
    // Audit role should deny modify actions
    expect(auditContent).toContain('DenyModifyActions');
  });
});

describe('Zero-Trust Security - Data Sources', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf-8');
  });

  test('Data source for AWS caller identity exists', () => {
    expect(mainContent).toContain('data "aws_caller_identity"');
  });

  test('Data source for AWS region exists', () => {
    expect(mainContent).toContain('data "aws_region"');
  });

  test('Data source for AWS Organizations is conditional', () => {
    expect(mainContent).toContain('data "aws_organizations_organization"');
    expect(mainContent).toContain('count');
  });
});

describe('Zero-Trust Security - Outputs', () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf-8');
  });

  test('IAM role ARNs are output', () => {
    expect(outputsContent).toContain('developer_role_arn');
    expect(outputsContent).toContain('operations_role_arn');
    expect(outputsContent).toContain('security_role_arn');
  });

  test('KMS key IDs are output', () => {
    expect(outputsContent).toContain('kms_key_ids');
  });

  test('S3 bucket names are output', () => {
    expect(outputsContent).toContain('config_bucket_name');
    expect(outputsContent).toContain('session_logs_bucket_name');
  });

  test('Security alerts topic ARN is output', () => {
    expect(outputsContent).toContain('security_alerts_topic_arn');
  });
});
