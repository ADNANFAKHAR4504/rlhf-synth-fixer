/**
 * Unit Tests for Terraform Infrastructure Drift Detection System
 *
 * Tests validate:
 * - Terraform configuration structure and syntax
 * - Resource definitions and attributes
 * - Variable declarations and defaults
 * - Output definitions
 * - Naming conventions with environment_suffix
 * - Security configurations
 * - Lambda function code structure
 */

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Drift Detection System - Unit Tests', () => {

  // Test data loaded once
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;
  let lambdaCode: string;

  beforeAll(() => {
    // Read all Terraform files
    mainTfContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf-8');
    variablesTfContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf-8');
    outputsTfContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf-8');
    providerTfContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf-8');
    lambdaCode = fs.readFileSync(path.join(LIB_DIR, 'lambda/drift_detector.py'), 'utf-8');
  });

  describe('File Structure', () => {
    test('main.tf exists and is not empty', () => {
      expect(mainTfContent).toBeTruthy();
      expect(mainTfContent.length).toBeGreaterThan(100);
    });

    test('variables.tf exists and is not empty', () => {
      expect(variablesTfContent).toBeTruthy();
      expect(variablesTfContent.length).toBeGreaterThan(50);
    });

    test('outputs.tf exists and is not empty', () => {
      expect(outputsTfContent).toBeTruthy();
      expect(outputsTfContent.length).toBeGreaterThan(50);
    });

    test('provider.tf exists and is not empty', () => {
      expect(providerTfContent).toBeTruthy();
      expect(providerTfContent.length).toBeGreaterThan(50);
    });

    test('Lambda function drift_detector.py exists', () => {
      expect(lambdaCode).toBeTruthy();
      expect(lambdaCode.length).toBeGreaterThan(100);
    });

    test('Lambda deployment package drift_detector.zip exists', () => {
      const zipPath = path.join(LIB_DIR, 'lambda/drift_detector.zip');
      expect(fs.existsSync(zipPath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf declares AWS provider', () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf specifies required Terraform version', () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test('provider.tf specifies required AWS provider version', () => {
      expect(providerTfContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerTfContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('provider uses region from variable', () => {
      expect(providerTfContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('provider sets default tags', () => {
      expect(providerTfContent).toMatch(/default_tags/);
      expect(providerTfContent).toMatch(/Environment/);
      expect(providerTfContent).toMatch(/var\.environment_suffix/);
    });
  });

  describe('Variables', () => {
    test('declares aws_region variable with default us-east-1', () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('declares environment_suffix variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesTfContent).toMatch(/type\s*=\s*string/);
    });

    test('declares notification_email variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"notification_email"/);
    });

    test('declares repository variable for tagging', () => {
      expect(variablesTfContent).toMatch(/variable\s+"repository"/);
    });

    test('declares team variable for tagging', () => {
      expect(variablesTfContent).toMatch(/variable\s+"team"/);
    });

    test('all variables have descriptions', () => {
      const variableBlocks = variablesTfContent.match(/variable\s+"[^"]+"\s*{[^}]+}/gs) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);

      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe('S3 Bucket - Drift Reports', () => {
    test('declares aws_s3_bucket resource for drift reports', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"drift_reports"/);
    });

    test('drift reports bucket name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/bucket\s*=\s*"drift-detection-reports-\$\{var\.environment_suffix\}"/);
    });

    test('enables versioning on drift reports bucket', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"drift_reports"/);
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures server-side encryption for drift reports bucket', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"drift_reports"/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('blocks public access for drift reports bucket', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"drift_reports"/);
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainTfContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('configures lifecycle policies for drift reports bucket', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"drift_reports"/);
      expect(mainTfContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(mainTfContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
      expect(mainTfContent).toMatch(/days\s*=\s*30/);
      expect(mainTfContent).toMatch(/days\s*=\s*90/);
      expect(mainTfContent).toMatch(/expiration/);
      expect(mainTfContent).toMatch(/days\s*=\s*365/);
    });
  });

  describe('S3 Bucket - AWS Config', () => {
    test('declares aws_s3_bucket resource for config', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });

    test('config bucket name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/bucket\s*=\s*"drift-detection-config-\$\{var\.environment_suffix\}"/);
    });

    test('blocks public access for config bucket', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"config"/);
    });

    test('configures bucket policy for AWS Config service', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
      expect(mainTfContent).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
      expect(mainTfContent).toMatch(/s3:GetBucketAcl/);
      expect(mainTfContent).toMatch(/s3:PutObject/);
    });
  });

  describe('DynamoDB Table', () => {
    test('declares aws_dynamodb_table resource for state locking', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"state_lock"/);
    });

    test('table name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"drift-detection-state-lock-\$\{var\.environment_suffix\}"/);
    });

    test('uses PAY_PER_REQUEST billing mode', () => {
      expect(mainTfContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('has LockID as hash key', () => {
      expect(mainTfContent).toMatch(/hash_key\s*=\s*"LockID"/);
    });

    test('enables point-in-time recovery', () => {
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*{/);
      expect(mainTfContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('AWS Config Resources', () => {
    test('declares IAM role for AWS Config', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"drift-detection-config-role-\$\{var\.environment_suffix\}"/);
    });

    test('IAM role has correct assume role policy for config service', () => {
      expect(mainTfContent).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
      expect(mainTfContent).toMatch(/sts:AssumeRole/);
    });

    test('attaches AWS managed policy to config role', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
      expect(mainTfContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole/);
    });

    test('declares AWS Config recorder', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"drift-detection-recorder-\$\{var\.environment_suffix\}"/);
    });

    test('config recorder monitors specific resource types', () => {
      expect(mainTfContent).toMatch(/AWS::EC2::Instance/);
      expect(mainTfContent).toMatch(/AWS::RDS::DBInstance/);
      expect(mainTfContent).toMatch(/AWS::S3::Bucket/);
    });

    test('declares AWS Config delivery channel', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test('declares AWS Config recorder status', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(mainTfContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test('declares AWS Config rules for monitoring', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"ec2_monitoring"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encryption"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_versioning"/);
    });
  });

  describe('Lambda Function', () => {
    test('declares CloudWatch log group for Lambda', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"drift_detector"/);
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*7/);
    });

    test('declares IAM role for Lambda', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"drift_detector"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"drift-detector-lambda-role-\$\{var\.environment_suffix\}"/);
    });

    test('Lambda IAM role has correct assume role policy', () => {
      expect(mainTfContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test('Lambda IAM policy includes required permissions', () => {
      expect(mainTfContent).toMatch(/logs:CreateLogGroup/);
      expect(mainTfContent).toMatch(/logs:PutLogEvents/);
      expect(mainTfContent).toMatch(/s3:PutObject/);
      expect(mainTfContent).toMatch(/s3:GetObject/);
      expect(mainTfContent).toMatch(/dynamodb:GetItem/);
      expect(mainTfContent).toMatch(/sns:Publish/);
      expect(mainTfContent).toMatch(/cloudwatch:PutMetricData/);
      expect(mainTfContent).toMatch(/config:GetResourceConfigHistory/);
    });

    test('declares Lambda function resource', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"drift_detector"/);
    });

    test('Lambda function uses Python 3.11 runtime', () => {
      expect(mainTfContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('Lambda function name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/function_name\s*=\s*"drift-detector-\$\{var\.environment_suffix\}"/);
    });

    test('Lambda function has appropriate timeout', () => {
      expect(mainTfContent).toMatch(/timeout\s*=\s*300/);
    });

    test('Lambda function has appropriate memory', () => {
      expect(mainTfContent).toMatch(/memory_size\s*=\s*512/);
    });

    test('Lambda function sets required environment variables', () => {
      expect(mainTfContent).toMatch(/DRIFT_REPORTS_BUCKET/);
      expect(mainTfContent).toMatch(/SNS_TOPIC_ARN/);
      expect(mainTfContent).toMatch(/ENVIRONMENT_SUFFIX/);
      expect(mainTfContent).toMatch(/STATE_LOCK_TABLE/);
    });
  });

  describe('SNS Topic', () => {
    test('declares SNS topic for drift alerts', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"drift_alerts"/);
    });

    test('SNS topic name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"drift-detection-alerts-\$\{var\.environment_suffix\}"/);
    });

    test('declares SNS topic subscription', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"drift_email"/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"email"/);
      expect(mainTfContent).toMatch(/endpoint\s*=\s*var\.notification_email/);
    });
  });

  describe('EventBridge Scheduling', () => {
    test('declares EventBridge rule for scheduling', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"drift_detection_schedule"/);
    });

    test('EventBridge rule name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"drift-detection-schedule-\$\{var\.environment_suffix\}"/);
    });

    test('EventBridge rule runs every 6 hours', () => {
      expect(mainTfContent).toMatch(/schedule_expression\s*=\s*"rate\(6 hours\)"/);
    });

    test('declares EventBridge target for Lambda', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"drift_detector"/);
    });

    test('declares Lambda permission for EventBridge', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
      expect(mainTfContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('declares CloudWatch dashboard', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"drift_monitoring"/);
    });

    test('dashboard name includes environment_suffix', () => {
      expect(mainTfContent).toMatch(/dashboard_name\s*=\s*"drift-detection-dashboard-\$\{var\.environment_suffix\}"/);
    });

    test('dashboard includes Lambda metrics widgets', () => {
      expect(mainTfContent).toMatch(/Invocations/);
      expect(mainTfContent).toMatch(/Errors/);
      expect(mainTfContent).toMatch(/Duration/);
    });

    test('dashboard includes drift detection metrics', () => {
      expect(mainTfContent).toMatch(/DriftDetection.*DriftDetected/);
      expect(mainTfContent).toMatch(/CriticalDrift/);
    });
  });

  describe('Outputs', () => {
    test('outputs drift_reports_bucket', () => {
      expect(outputsTfContent).toMatch(/output\s+"drift_reports_bucket"/);
    });

    test('outputs config_bucket', () => {
      expect(outputsTfContent).toMatch(/output\s+"config_bucket"/);
    });

    test('outputs state_lock_table', () => {
      expect(outputsTfContent).toMatch(/output\s+"state_lock_table"/);
    });

    test('outputs sns_topic_arn', () => {
      expect(outputsTfContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('outputs lambda_function_name', () => {
      expect(outputsTfContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test('outputs lambda_function_arn', () => {
      expect(outputsTfContent).toMatch(/output\s+"lambda_function_arn"/);
    });

    test('outputs cloudwatch_log_group', () => {
      expect(outputsTfContent).toMatch(/output\s+"cloudwatch_log_group"/);
    });

    test('outputs eventbridge_rule_name', () => {
      expect(outputsTfContent).toMatch(/output\s+"eventbridge_rule_name"/);
    });

    test('outputs dashboard_name', () => {
      expect(outputsTfContent).toMatch(/output\s+"dashboard_name"/);
    });

    test('outputs config_recorder_name', () => {
      expect(outputsTfContent).toMatch(/output\s+"config_recorder_name"/);
    });

    test('all outputs have descriptions', () => {
      const outputBlocks = outputsTfContent.match(/output\s+"[^"]+"\s*{[^}]+}/gs) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);

      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe('Lambda Function Code', () => {
    test('imports required boto3 clients', () => {
      expect(lambdaCode).toMatch(/import boto3/);
      expect(lambdaCode).toMatch(/s3_client\s*=\s*boto3\.client\('s3'\)/);
      expect(lambdaCode).toMatch(/sns_client\s*=\s*boto3\.client\('sns'\)/);
      expect(lambdaCode).toMatch(/config_client\s*=\s*boto3\.client\('config'\)/);
      expect(lambdaCode).toMatch(/cloudwatch_client\s*=\s*boto3\.client\('cloudwatch'\)/);
    });

    test('reads environment variables', () => {
      expect(lambdaCode).toMatch(/DRIFT_REPORTS_BUCKET\s*=\s*os\.environ\['DRIFT_REPORTS_BUCKET'\]/);
      expect(lambdaCode).toMatch(/SNS_TOPIC_ARN\s*=\s*os\.environ\['SNS_TOPIC_ARN'\]/);
      expect(lambdaCode).toMatch(/ENVIRONMENT_SUFFIX\s*=\s*os\.environ\['ENVIRONMENT_SUFFIX'\]/);
    });

    test('defines lambda_handler function', () => {
      expect(lambdaCode).toMatch(/def lambda_handler\(event,\s*context\)/);
    });

    test('defines detect_drift function', () => {
      expect(lambdaCode).toMatch(/def detect_drift\(\)/);
    });

    test('defines analyze_drift function', () => {
      expect(lambdaCode).toMatch(/def analyze_drift\(/);
    });

    test('defines determine_severity function', () => {
      expect(lambdaCode).toMatch(/def determine_severity\(/);
    });

    test('defines generate_remediation function', () => {
      expect(lambdaCode).toMatch(/def generate_remediation\(/);
    });

    test('defines generate_drift_report function', () => {
      expect(lambdaCode).toMatch(/def generate_drift_report\(/);
    });

    test('defines store_report function', () => {
      expect(lambdaCode).toMatch(/def store_report\(/);
    });

    test('defines publish_metrics function', () => {
      expect(lambdaCode).toMatch(/def publish_metrics\(/);
    });

    test('defines send_notification function', () => {
      expect(lambdaCode).toMatch(/def send_notification\(/);
    });

    test('defines send_error_notification function', () => {
      expect(lambdaCode).toMatch(/def send_error_notification\(/);
    });

    test('has error handling in lambda_handler', () => {
      expect(lambdaCode).toMatch(/try:/);
      expect(lambdaCode).toMatch(/except Exception as e:/);
    });

    test('returns proper response structure', () => {
      expect(lambdaCode).toMatch(/statusCode/);
      expect(lambdaCode).toMatch(/return\s*{/);
    });

    test('monitors EC2, RDS, and S3 resources', () => {
      expect(lambdaCode).toMatch(/AWS::EC2::Instance/);
      expect(lambdaCode).toMatch(/AWS::RDS::DBInstance/);
      expect(lambdaCode).toMatch(/AWS::S3::Bucket/);
    });

    test('generates JSON reports with timestamps', () => {
      expect(lambdaCode).toMatch(/json\.dumps/);
      expect(lambdaCode).toMatch(/datetime/);
      expect(lambdaCode).toMatch(/isoformat/);
    });

    test('includes severity levels', () => {
      expect(lambdaCode).toMatch(/CRITICAL/);
      expect(lambdaCode).toMatch(/HIGH/);
      expect(lambdaCode).toMatch(/MEDIUM/);
      expect(lambdaCode).toMatch(/LOW/);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resource names include environment_suffix', () => {
      const resourceNames = [
        'drift-detection-reports',
        'drift-detection-config',
        'drift-detection-state-lock',
        'drift-detection-config-role',
        'drift-detection-recorder',
        'drift-detection-alerts',
        'drift-detector',
        'drift-detection-schedule',
        'drift-detection-dashboard'
      ];

      resourceNames.forEach(name => {
        const pattern = new RegExp(`${name}-\\$\\{var\\.environment_suffix\\}`);
        expect(mainTfContent).toMatch(pattern);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets have encryption enabled', () => {
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('S3 buckets block public access', () => {
      const publicAccessBlocks = mainTfContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || [];
      expect(publicAccessBlocks.length).toBeGreaterThanOrEqual(2);
    });

    test('DynamoDB has point-in-time recovery enabled', () => {
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*true/);
    });

    test('IAM policies follow least privilege', () => {
      expect(mainTfContent).toMatch(/aws_s3_bucket\.drift_reports\.arn/);
      expect(mainTfContent).toMatch(/aws_dynamodb_table\.state_lock\.arn/);
      expect(mainTfContent).toMatch(/aws_sns_topic\.drift_alerts\.arn/);
    });

    test('no hardcoded credentials in code', () => {
      expect(lambdaCode).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(lambdaCode).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
    });
  });

  describe('Dependencies and References', () => {
    test('Lambda depends on CloudWatch log group', () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.drift_detector\]/);
    });

    test('Config delivery channel depends on recorder', () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_config_configuration_recorder\.main\]/);
    });

    test('Config recorder status depends on delivery channel', () => {
      expect(mainTfContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
    });

    test('Config rules depend on recorder', () => {
      const configRules = mainTfContent.match(/resource\s+"aws_config_config_rule"/g) || [];
      expect(configRules.length).toBeGreaterThan(0);
    });
  });

  describe('Data Sources', () => {
    test('uses data source for current AWS account', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('uses data source for current region', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });
});
