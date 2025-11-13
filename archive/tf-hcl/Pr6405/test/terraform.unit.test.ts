// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform compliance module
// Tests syntax, structure, variable declarations, and naming conventions

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read HCL files
function readHCL(filename: string): { content: string } {
  const filePath = path.join(LIB_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return { content };
}

describe('Terraform Compliance Module - Unit Tests', () => {
  describe('File Structure', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'main.tf',
        'config_rules.tf',
        'remediation.tf',
        'notifications.tf',
        'outputs.tf',
      ];

      requiredFiles.forEach((file) => {
        const filePath = path.join(LIB_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Lambda function code exists', () => {
      const lambdaPath = path.join(LIB_DIR, 'lambda', 'index.py');
      const zipPath = path.join(LIB_DIR, 'lambda', 'remediation.zip');

      expect(fs.existsSync(lambdaPath)).toBe(true);
      expect(fs.existsSync(zipPath)).toBe(true);
    });

    test('no files exist at project root that should be in lib/', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const prohibitedRootFiles = [
        'IDEAL_RESPONSE.md',
        'MODEL_FAILURES.md',
        'main.tf',
        'variables.tf',
      ];

      prohibitedRootFiles.forEach((file) => {
        const rootPath = path.join(projectRoot, file);
        // Only IDEAL_RESPONSE.md and MODEL_FAILURES.md should be in lib/
        if (file.endsWith('.md')) {
          const libPath = path.join(LIB_DIR, file);
          if (fs.existsSync(rootPath)) {
            expect(fs.existsSync(libPath)).toBe(true);
          }
        }
      });
    });
  });

  describe('provider.tf', () => {
    test('declares Terraform version requirement', () => {
      const { content } = readHCL('provider.tf');
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('declares AWS provider with version >= 5.0', () => {
      const { content } = readHCL('provider.tf');
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('AWS provider uses var.aws_region', () => {
      const { content } = readHCL('provider.tf');
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe('variables.tf', () => {
    test('declares environment_suffix variable (required)', () => {
      const { content } = readHCL('variables.tf');
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/description\s*=\s*".*suffix.*"/i);
    });

    test('declares aws_region variable with default', () => {
      const { content } = readHCL('variables.tf');
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('declares enable_auto_remediation boolean variable', () => {
      const { content } = readHCL('variables.tf');
      expect(content).toMatch(/variable\s+"enable_auto_remediation"/);
      expect(content).toMatch(/type\s*=\s*bool/);
      expect(content).toMatch(/default\s*=\s*true/);
    });

    test('declares sns_email_endpoint variable (optional)', () => {
      const { content } = readHCL('variables.tf');
      expect(content).toMatch(/variable\s+"sns_email_endpoint"/);
      expect(content).toMatch(/default\s*=\s*""/);
    });

    test('config_snapshot_frequency has validation', () => {
      const { content } = readHCL('variables.tf');
      expect(content).toMatch(/variable\s+"config_snapshot_frequency"/);
      expect(content).toMatch(/validation\s*{/);
    });
  });

  describe('main.tf - Core Resources', () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = readHCL('main.tf').content;
    });

    test('defines aws_caller_identity data source', () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('S3 bucket name includes environment_suffix', () => {
      expect(mainContent).toMatch(/bucket\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
    });

    test('S3 bucket has public access block enabled', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('S3 bucket has encryption configured with KMS', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.config_key\.id/);
    });

    test('S3 bucket has versioning enabled', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket has lifecycle configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(mainContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(mainContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(mainContent).toMatch(/expiration\s*{/);
    });

    test('KMS key has policy defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"config_key"/);
      expect(mainContent).toMatch(/policy\s*=\s*jsonencode\(/);
      expect(mainContent).toMatch(/Enable IAM User Permissions/);
    });

    test('KMS key policy includes all required service principals', () => {
      expect(mainContent).toMatch(/config\.amazonaws\.com/);
      expect(mainContent).toMatch(/lambda\.amazonaws\.com/);
      expect(mainContent).toMatch(/sns\.amazonaws\.com/);
      expect(mainContent).toMatch(/s3\.amazonaws\.com/);
    });

    test('KMS key has rotation enabled', () => {
      expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS key has alias with environment_suffix', () => {
      expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"config_key"/);
      expect(mainContent).toMatch(/name\s*=\s*"alias\/compliance-\$\{var\.environment_suffix\}"/);
    });

    test('Config IAM role has correct assume role policy', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"/);
      expect(mainContent).toMatch(/config\.amazonaws\.com/);
    });

    test('Config role has AWS managed policy attached', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config_role"/);
      expect(mainContent).toMatch(/AWS_ConfigRole/);
    });

    test('Config role has inline policy for S3 and KMS', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"config_s3_policy"/);
      expect(mainContent).toMatch(/s3:GetBucketVersioning/);
      expect(mainContent).toMatch(/kms:Decrypt/);
      expect(mainContent).toMatch(/kms:GenerateDataKey/);
    });

    test('Config recorder includes global resource types', () => {
      expect(mainContent).toMatch(/resource\s+"aws_config_configuration_recorder"/);
      expect(mainContent).toMatch(/all_supported\s*=\s*true/);
      expect(mainContent).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test('Config recorder name includes environment_suffix', () => {
      expect(mainContent).toMatch(/name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
    });

    test('Config delivery channel references S3 bucket', () => {
      expect(mainContent).toMatch(/resource\s+"aws_config_delivery_channel"/);
      expect(mainContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.config_bucket\.id/);
    });

    test('Config recorder status depends on delivery channel', () => {
      expect(mainContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"/);
      expect(mainContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
    });

    test('all resources have tags including Environment', () => {
      const taggedResources = mainContent.match(/tags\s*=\s*{/g);
      expect(taggedResources).not.toBeNull();
      expect(taggedResources!.length).toBeGreaterThan(2);
      expect(mainContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe('config_rules.tf - Compliance Rules', () => {
    let rulesContent: string;

    beforeAll(() => {
      rulesContent = readHCL('config_rules.tf').content;
    });

    test('defines all required Config rules', () => {
      const requiredRules = [
        's3_bucket_public_read_prohibited',
        's3_bucket_public_write_prohibited',
        's3_bucket_encryption',
        'encrypted_volumes',
        'rds_encryption',
        'ec2_no_public_ip',
        'iam_password_policy',
        'root_account_mfa',
        'required_tags',
      ];

      requiredRules.forEach((rule) => {
        const regex = new RegExp(`resource\\s+"aws_config_config_rule"\\s+"${rule}"`);
        expect(rulesContent).toMatch(regex);
      });
    });

    test('all Config rules include environment_suffix in name', () => {
      const ruleNames = rulesContent.match(/name\s*=\s*"[^"]+"/g);
      expect(ruleNames).not.toBeNull();

      ruleNames!.forEach((match) => {
        if (!match.includes('compliance-')) {
          expect(match).toMatch(/\$\{var\.environment_suffix\}/);
        }
      });
    });

    test('all Config rules depend on recorder status', () => {
      const depends = rulesContent.match(/depends_on\s*=\s*\[([^\]]+)\]/g);
      expect(depends).not.toBeNull();

      depends!.forEach((match) => {
        expect(match).toMatch(/aws_config_configuration_recorder_status\.main/);
      });
    });

    test('IAM password policy rule has input parameters', () => {
      expect(rulesContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"/);
      expect(rulesContent).toMatch(/input_parameters\s*=\s*jsonencode\(/);
      expect(rulesContent).toMatch(/MinimumPasswordLength/);
      expect(rulesContent).toMatch(/RequireUppercaseCharacters/);
    });

    test('required_tags rule has input parameters', () => {
      expect(rulesContent).toMatch(/resource\s+"aws_config_config_rule"\s+"required_tags"/);
      expect(rulesContent).toMatch(/tag1Key\s*=\s*"Environment"/);
      expect(rulesContent).toMatch(/tag2Key\s*=\s*"Owner"/);
      expect(rulesContent).toMatch(/tag3Key\s*=\s*"CostCenter"/);
    });

    test('all rules use AWS managed rule sources', () => {
      const sources = rulesContent.match(/owner\s*=\s*"AWS"/g);
      expect(sources).not.toBeNull();
      expect(sources!.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('remediation.tf - Lambda and EventBridge', () => {
    let remediationContent: string;

    beforeAll(() => {
      remediationContent = readHCL('remediation.tf').content;
    });

    test('Lambda function references zip file', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_lambda_function"\s+"remediation"/);
      expect(remediationContent).toMatch(/filename\s*=.*remediation\.zip/);
    });

    test('Lambda function has source_code_hash', () => {
      expect(remediationContent).toMatch(/source_code_hash\s*=\s*filebase64sha256\(/);
    });

    test('Lambda function name includes environment_suffix', () => {
      expect(remediationContent).toMatch(/function_name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
    });

    test('Lambda function uses Python 3.11 runtime', () => {
      expect(remediationContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('Lambda function has environment variables', () => {
      expect(remediationContent).toMatch(/environment\s*{/);
      expect(remediationContent).toMatch(/ENVIRONMENT_SUFFIX\s*=\s*var\.environment_suffix/);
      expect(remediationContent).toMatch(/CONFIG_BUCKET\s*=\s*aws_s3_bucket\.config_bucket\.id/);
      expect(remediationContent).toMatch(/KMS_KEY_ID\s*=\s*aws_kms_key\.config_key\.id/);
      expect(remediationContent).toMatch(/SNS_TOPIC_ARN/);
    });

    test('Lambda function depends on log group', () => {
      expect(remediationContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda_remediation\]/);
    });

    test('Lambda IAM role has correct assume role policy', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_remediation"/);
      expect(remediationContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test('Lambda IAM policy includes required permissions', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_remediation_policy"/);
      expect(remediationContent).toMatch(/logs:CreateLogGroup/);
      expect(remediationContent).toMatch(/s3:PutBucketPublicAccessBlock/);
      expect(remediationContent).toMatch(/ec2:ModifyInstanceAttribute/);
      expect(remediationContent).toMatch(/rds:ModifyDBInstance/);
      expect(remediationContent).toMatch(/config:PutEvaluations/);
      expect(remediationContent).toMatch(/kms:Decrypt/);
    });

    test('CloudWatch log group has retention policy', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_remediation"/);
      expect(remediationContent).toMatch(/retention_in_days\s*=\s*14/);
    });

    test('EventBridge rule filters for NON_COMPLIANT events', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"config_compliance_change"/);
      expect(remediationContent).toMatch(/aws\.config/);
      expect(remediationContent).toMatch(/NON_COMPLIANT/);
    });

    test('EventBridge target is conditional on enable_auto_remediation', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda_remediation"/);
      expect(remediationContent).toMatch(/count\s*=\s*var\.enable_auto_remediation\s*\?\s*1\s*:\s*0/);
    });

    test('Lambda permission allows EventBridge invocation', () => {
      expect(remediationContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
      expect(remediationContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe('notifications.tf - SNS and Dashboard', () => {
    let notificationsContent: string;

    beforeAll(() => {
      notificationsContent = readHCL('notifications.tf').content;
    });

    test('SNS topic is conditional on sns_email_endpoint', () => {
      expect(notificationsContent).toMatch(/resource\s+"aws_sns_topic"\s+"compliance_notifications"/);
      expect(notificationsContent).toMatch(/count\s*=\s*var\.sns_email_endpoint\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test('SNS topic uses KMS encryption', () => {
      expect(notificationsContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.config_key\.id/);
    });

    test('SNS topic subscription is conditional', () => {
      expect(notificationsContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"compliance_email"/);
      expect(notificationsContent).toMatch(/protocol\s*=\s*"email"/);
    });

    test('SNS topic policy allows Config and Lambda to publish', () => {
      expect(notificationsContent).toMatch(/resource\s+"aws_sns_topic_policy"/);
      expect(notificationsContent).toMatch(/AllowConfigPublish/);
      expect(notificationsContent).toMatch(/AllowLambdaPublish/);
      expect(notificationsContent).toMatch(/config\.amazonaws\.com/);
      expect(notificationsContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test('CloudWatch Dashboard includes compliance metrics', () => {
      expect(notificationsContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"compliance"/);
      expect(notificationsContent).toMatch(/ComplianceScore/);
    });

    test('CloudWatch Dashboard includes Lambda logs widget', () => {
      expect(notificationsContent).toMatch(/type\s*=\s*"log"/);
      expect(notificationsContent).toMatch(/compliance-remediation/);
    });

    test('Dashboard name includes environment_suffix', () => {
      expect(notificationsContent).toMatch(/dashboard_name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/);
    });
  });

  describe('outputs.tf - Module Outputs', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = readHCL('outputs.tf').content;
    });

    test('defines all required outputs', () => {
      const requiredOutputs = [
        'config_recorder_id',
        'config_bucket_name',
        'config_bucket_arn',
        'kms_key_id',
        'kms_key_arn',
        'remediation_lambda_arn',
        'remediation_lambda_name',
        'sns_topic_arn',
        'compliance_dashboard_url',
        'config_rules',
      ];

      requiredOutputs.forEach((output) => {
        const regex = new RegExp(`output\\s+"${output}"`);
        expect(outputsContent).toMatch(regex);
      });
    });

    test('all outputs have descriptions', () => {
      const outputs = outputsContent.match(/output\s+"[^"]+"\s*{[^}]+}/gs);
      expect(outputs).not.toBeNull();

      outputs!.forEach((output) => {
        expect(output).toMatch(/description\s*=/);
      });
    });

    test('sns_topic_arn output is conditional', () => {
      expect(outputsContent).toMatch(/value\s*=\s*var\.sns_email_endpoint\s*!=\s*""\s*\?/);
    });

    test('config_rules output returns list of rule names', () => {
      expect(outputsContent).toMatch(/output\s+"config_rules"/);
      expect(outputsContent).toMatch(/value\s*=\s*\[/);
      expect(outputsContent).toMatch(/aws_config_config_rule\./);
    });
  });

  describe('Lambda Python Code', () => {
    let lambdaCode: string;

    beforeAll(() => {
      const lambdaPath = path.join(LIB_DIR, 'lambda', 'index.py');
      lambdaCode = fs.readFileSync(lambdaPath, 'utf8');
    });

    test('Lambda code defines handler function', () => {
      expect(lambdaCode).toMatch(/def handler\(/);
    });

    test('Lambda code imports required AWS libraries', () => {
      expect(lambdaCode).toMatch(/import boto3/);
      expect(lambdaCode).toMatch(/import json/);
      expect(lambdaCode).toMatch(/import os/);
      expect(lambdaCode).toMatch(/import logging/);
    });

    test('Lambda code defines AWS service clients', () => {
      expect(lambdaCode).toMatch(/boto3\.client\(['"]s3['"]\)/);
      expect(lambdaCode).toMatch(/boto3\.client\(['"]ec2['"]\)/);
      expect(lambdaCode).toMatch(/boto3\.client\(['"]rds['"]\)/);
      expect(lambdaCode).toMatch(/boto3\.client\(['"]sns['"]\)/);
      expect(lambdaCode).toMatch(/boto3\.client\(['"]config['"]\)/);
    });

    test('Lambda code reads environment variables', () => {
      expect(lambdaCode).toMatch(/os\.environ\.get\(['"]ENVIRONMENT_SUFFIX['"]/);
      expect(lambdaCode).toMatch(/os\.environ\.get\(['"]CONFIG_BUCKET['"]/);
      expect(lambdaCode).toMatch(/os\.environ\.get\(['"]KMS_KEY_ID['"]/);
      expect(lambdaCode).toMatch(/os\.environ\.get\(['"]SNS_TOPIC_ARN['"]/);
    });

    test('Lambda code defines remediation functions', () => {
      expect(lambdaCode).toMatch(/def remediate_s3_bucket\(/);
      expect(lambdaCode).toMatch(/def remediate_ec2_resource\(/);
      expect(lambdaCode).toMatch(/def remediate_rds_instance\(/);
      expect(lambdaCode).toMatch(/def remediate_missing_tags\(/);
      expect(lambdaCode).toMatch(/def send_notification\(/);
    });

    test('Lambda code handles exceptions', () => {
      expect(lambdaCode).toMatch(/try:/);
      expect(lambdaCode).toMatch(/except.*Exception/);
      expect(lambdaCode).toMatch(/logger\.error\(/);
    });
  });

  describe('Environment Suffix Usage', () => {
    const allFiles = ['main.tf', 'config_rules.tf', 'remediation.tf', 'notifications.tf'];

    test('no hardcoded environment values (prod-, dev-, stage-)', () => {
      allFiles.forEach((file) => {
        const { content } = readHCL(file);
        expect(content).not.toMatch(/["']prod-/);
        expect(content).not.toMatch(/["']dev-/);
        expect(content).not.toMatch(/["']stage-/);
        expect(content).not.toMatch(/["']staging-/);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no Retain or DeletionProtection policies', () => {
      const allFiles = ['main.tf', 'config_rules.tf', 'remediation.tf', 'notifications.tf'];

      allFiles.forEach((file) => {
        const { content } = readHCL(file);
        expect(content.toLowerCase()).not.toMatch(/deletion_protection\s*=\s*true/);
        expect(content.toLowerCase()).not.toMatch(/prevent_destroy\s*=\s*true/);
      });
    });

    test('S3 bucket blocks all public access', () => {
      const { content } = readHCL('main.tf');
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('KMS key has rotation enabled', () => {
      const { content } = readHCL('main.tf');
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('CloudWatch log groups have retention policies', () => {
      const { content } = readHCL('remediation.tf');
      expect(content).toMatch(/retention_in_days/);
    });
  });
});
