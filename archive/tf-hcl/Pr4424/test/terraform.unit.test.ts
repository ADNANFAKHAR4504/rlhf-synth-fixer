import fs from 'fs';
import path from 'path';

const STACK_PATH = path.resolve(__dirname, '../lib/tap_stack.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const PROVIDER_PATH = path.resolve(__dirname, '../lib/provider.tf');
const IAM_POLICIES_PATH = path.resolve(__dirname, '../lib/iam-policies.json');

describe('Terraform Credential Rotation Infrastructure - Unit Tests', () => {
  let stackContent: string;
  let variablesContent: string;
  let providerContent: string;
  let iamPoliciesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, 'utf8');
    variablesContent = fs.readFileSync(VARIABLES_PATH, 'utf8');
    providerContent = fs.readFileSync(PROVIDER_PATH, 'utf8');
    iamPoliciesContent = fs.readFileSync(IAM_POLICIES_PATH, 'utf8');
  });

  describe('File Existence', () => {
    test('tap_stack.tf exists', () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test('iam-policies.json exists', () => {
      expect(fs.existsSync(IAM_POLICIES_PATH)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf does not declare provider in tap_stack.tf', () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/\bprovider\s+"random"\s*{/);
    });

    test('provider.tf includes AWS provider', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
    });

    test('provider.tf includes random provider in required_providers', () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
    });

    test('provider.tf includes archive provider in required_providers', () => {
      expect(providerContent).toMatch(/archive\s*=\s*{/);
    });
  });

  describe('KMS Resources', () => {
    test('declares KMS key with encryption', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"secrets_key"/);
    });

    test('KMS key has rotation enabled', () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS key has proper policy for CloudWatch Logs', () => {
      expect(stackContent).toMatch(/Allow CloudWatch Logs/);
    });

    test('KMS key has proper policy for CloudTrail', () => {
      expect(stackContent).toMatch(/Allow CloudTrail/);
    });

    test('KMS key has proper policy for Secrets Manager', () => {
      expect(stackContent).toMatch(/Allow Secrets Manager/);
    });

    test('declares KMS alias', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"secrets_key_alias"/);
    });
  });

  describe('RDS Resources', () => {
    test('declares RDS instance', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('RDS has IAM authentication enabled', () => {
      expect(stackContent).toMatch(/iam_database_authentication_enabled\s*=\s*true/);
    });

    test('RDS has encryption enabled', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('RDS uses KMS key for encryption', () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.secrets_key\.arn/);
    });

    test('RDS has deletion protection', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test('RDS has backup retention of 30 days', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*30/);
    });

    test('RDS has CloudWatch logs exports enabled', () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
      expect(stackContent).toMatch(/"audit"/);
      expect(stackContent).toMatch(/"error"/);
      expect(stackContent).toMatch(/"general"/);
      expect(stackContent).toMatch(/"slowquery"/);
    });

    test('RDS parameter group requires secure transport', () => {
      expect(stackContent).toMatch(/require_secure_transport/);
      expect(stackContent).toMatch(/"ON"/);
    });

    test('declares RDS subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test('declares RDS parameter group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"mysql"/);
    });

    test('declares CloudWatch log group for RDS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds_logs"/);
    });

    test('RDS has lifecycle ignore_changes for password and final_snapshot_identifier', () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
      expect(stackContent).toMatch(/ignore_changes/);
      expect(stackContent).toMatch(/password/);
      expect(stackContent).toMatch(/final_snapshot_identifier/);
    });
  });

  describe('Security Groups', () => {
    test('declares RDS security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test('declares Lambda security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
    });

    test('declares VPC endpoints security group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
    });

    test('has security group rules for RDS from Lambda', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"rds_from_lambda"/);
    });

    test('has security group egress rules for Lambda to RDS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"lambda_to_rds"/);
    });

    test('has security group egress rules for Lambda to HTTPS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"lambda_to_https"/);
    });
  });

  describe('Secrets Manager Resources', () => {
    test('declares master password secret', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"rds_master_password"/);
    });

    test('declares user credential template secret', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"user_credential_template"/);
    });

    test('user credential template has proper recovery window (not 0)', () => {
      const match = stackContent.match(/resource\s+"aws_secretsmanager_secret"\s+"user_credential_template"[\s\S]*?recovery_window_in_days\s*=\s*(\d+)/);
      expect(match).not.toBeNull();
      if (match) {
        const recoveryDays = parseInt(match[1], 10);
        expect(recoveryDays).toBeGreaterThan(0);
      }
    });

    test('declares secret rotation configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_rotation"\s+"user_credential_template"/);
    });

    test('secret rotation uses Lambda function', () => {
      expect(stackContent).toMatch(/rotation_lambda_arn\s*=\s*aws_lambda_function\.rotation\.arn/);
    });

    test('declares random password resource', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"rds_master_password"/);
    });
  });

  describe('Lambda Resources', () => {
    test('declares Lambda function', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"rotation"/);
    });

    test('declares Lambda IAM role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_rotation"/);
    });

    test('declares Lambda IAM policy', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_rotation"/);
    });

    test('Lambda has VPC configuration', () => {
      expect(stackContent).toMatch(/vpc_config\s*{/);
    });

    test('Lambda has dead letter queue configuration', () => {
      expect(stackContent).toMatch(/dead_letter_config\s*{/);
    });

    test('Lambda has X-Ray tracing enabled', () => {
      expect(stackContent).toMatch(/tracing_config\s*{/);
      expect(stackContent).toMatch(/mode\s*=\s*"Active"/);
    });

    test('declares CloudWatch log group for Lambda', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_rotation"/);
    });

    test('declares archive_file data source for Lambda', () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_rotation"/);
    });

    test('Lambda permission for Secrets Manager', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"rotation"/);
      expect(stackContent).toMatch(/principal\s*=\s*"secretsmanager\.amazonaws\.com"/);
    });

    test('Lambda has proper environment variables', () => {
      expect(stackContent).toMatch(/RDS_ENDPOINT/);
      expect(stackContent).toMatch(/RDS_DATABASE/);
      expect(stackContent).toMatch(/MASTER_SECRET_ARN/);
      expect(stackContent).toMatch(/KMS_KEY_ID/);
    });
  });

  describe('VPC Endpoints', () => {
    test('declares VPC endpoint for Secrets Manager', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"secretsmanager"/);
    });

    test('declares VPC endpoint for KMS', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kms"/);
    });

    test('VPC endpoints have private DNS enabled', () => {
      const matches = stackContent.match(/private_dns_enabled\s*=\s*true/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('EventBridge Resources', () => {
    test('declares EventBridge rule for rotation monitoring', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"rotation_events"/);
    });

    test('declares EventBridge scheduled rule', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"rotation_schedule"/);
    });

    test('declares EventBridge target for monitoring', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"rotation_logs"/);
    });

    test('declares EventBridge target for scheduled rotation', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"rotation_schedule"/);
    });

    test('declares Lambda permission for EventBridge', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"eventbridge"/);
    });

    test('EventBridge log group exists before target', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rotation_events"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.rotation_events\]/);
    });

    test('declares CloudWatch log resource policy for EventBridge', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_resource_policy"\s+"eventbridge_logs"/);
    });
  });

  describe('CloudTrail Resources', () => {
    test('declares CloudTrail (conditional)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.enable_cloudtrail/);
    });

    test('CloudTrail has inline comment about trail limit', () => {
      expect(stackContent).toMatch(/trail limit/i);
      expect(stackContent).toMatch(/max 5 trails/i);
    });

    test('CloudTrail is multi-region when enabled', () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('CloudTrail has KMS encryption when enabled', () => {
      const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
      expect(cloudtrailSection).not.toBeNull();
      expect(cloudtrailSection![0]).toMatch(/kms_key_id/);
    });

    test('CloudTrail captures management events including Secrets Manager', () => {
      // Secrets Manager API calls are captured via management events
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('CloudTrail depends on S3 bucket policy', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_s3_bucket_policy\.cloudtrail/);
    });

    test('declares S3 bucket for CloudTrail (conditional)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/count\s*=\s*var\.enable_cloudtrail/);
    });

    test('S3 bucket has encryption (conditional)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/);
    });

    test('S3 bucket has versioning enabled (conditional)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 bucket has public access blocked (conditional)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('S3 bucket has lifecycle policy (conditional)', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail"/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('declares CloudWatch alarm for rotation failures', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rotation_failures"/);
    });

    test('declares CloudWatch alarm for rotation duration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rotation_duration"/);
    });

    test('declares CloudWatch alarm for DLQ messages', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_messages"/);
    });

    test('declares CloudWatch dashboard', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"rotation"/);
    });

    test('CloudWatch alarms have SNS actions', () => {
      const matches = stackContent.match(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SNS Resources', () => {
    test('declares SNS topic for alerts', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test('SNS topic has KMS encryption', () => {
      const snsSection = stackContent.match(/resource\s+"aws_sns_topic"\s+"alerts"[\s\S]*?(?=resource\s+"|$)/);
      expect(snsSection).not.toBeNull();
      expect(snsSection![0]).toMatch(/kms_master_key_id/);
    });

    test('declares SNS topic subscription', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_alerts"/);
    });
  });

  describe('SQS Resources', () => {
    test('declares SQS dead letter queue', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
    });

    test('DLQ has KMS encryption', () => {
      const dlqSection = stackContent.match(/resource\s+"aws_sqs_queue"\s+"dlq"[\s\S]*?(?=resource\s+"|$)/);
      expect(dlqSection).not.toBeNull();
      expect(dlqSection![0]).toMatch(/kms_master_key_id/);
    });
  });

  describe('Data Sources', () => {
    test('declares data source for AWS account ID', () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('declares data source for AWS region', () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe('Outputs', () => {
    test('outputs secrets manager template ARN', () => {
      expect(stackContent).toMatch(/output\s+"secrets_manager_template_arn"/);
    });

    test('outputs Lambda function name', () => {
      expect(stackContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test('outputs RDS endpoint', () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test('outputs CloudWatch dashboard URL', () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_dashboard_url"/);
    });

    test('outputs KMS key ID', () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
    });

    test('outputs CloudTrail name', () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_name"/);
    });

    test('outputs SNS topic ARN', () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
    });
  });

  describe('Variables', () => {
    test('declares aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    });

    test('declares project_name variable', () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"/);
    });

    test('declares vpc_id variable', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_id"/);
    });

    test('declares private_subnet_ids variable', () => {
      expect(variablesContent).toMatch(/variable\s+"private_subnet_ids"/);
    });

    test('declares mysql_version variable', () => {
      expect(variablesContent).toMatch(/variable\s+"mysql_version"/);
    });

    test('declares rotation_days variable', () => {
      expect(variablesContent).toMatch(/variable\s+"rotation_days"/);
    });

    test('declares enable_performance_insights variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_performance_insights"/);
    });

    test('declares enable_rotation variable', () => {
      expect(variablesContent).toMatch(/variable\s+"enable_rotation"/);
    });

    test('declares lambda_runtime variable', () => {
      expect(variablesContent).toMatch(/variable\s+"lambda_runtime"/);
    });

    test('declares rotation_check_frequency_hours variable', () => {
      expect(variablesContent).toMatch(/variable\s+"rotation_check_frequency_hours"/);
    });
  });

  describe('IAM Policies - Least Privilege', () => {
    test('IAM policies file is valid JSON', () => {
      expect(() => JSON.parse(iamPoliciesContent)).not.toThrow();
    });

    test('IAM policies use placeholders for dynamic values', () => {
      expect(iamPoliciesContent).toMatch(/\$\{region\}/);
      expect(iamPoliciesContent).toMatch(/\$\{account_id\}/);
      expect(iamPoliciesContent).toMatch(/\$\{project_name\}/);
      expect(iamPoliciesContent).toMatch(/\$\{kms_key_arn\}/);
    });

    test('IAM policies scoped to specific resources for Secrets Manager', () => {
      expect(iamPoliciesContent).toMatch(/secretsmanager:.*\$\{project_name\}/);
    });

    test('IAM policies scoped for CloudWatch with namespace condition', () => {
      expect(iamPoliciesContent).toMatch(/cloudwatch:namespace/);
    });

    test('IAM policies have CloudWatch Logs permissions', () => {
      expect(iamPoliciesContent).toMatch(/logs:CreateLogStream/);
      expect(iamPoliciesContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('Compliance and Security', () => {
    test('all data stores use encryption at rest', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/kms_master_key_id/);
    });

    test('no hardcoded credentials in stack', () => {
      // Should use random_password for actual credentials
      expect(stackContent).toMatch(/random_password/);
      // RDS password should reference secret manager
      expect(stackContent).toMatch(/password\s*=\s*aws_secretsmanager_secret_version\.rds_master_password\.secret_string/);
      // Should not have inline password strings in RDS resource
      const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
      expect(rdsSection).not.toBeNull();
      expect(rdsSection![0]).not.toMatch(/password\s*=\s*"[a-zA-Z0-9]+"/);
    });

    test('RDS requires secure transport', () => {
      expect(stackContent).toMatch(/require_secure_transport/);
    });

    test('deletion protection enabled for critical resources', () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*true/);
    });

    test('backup retention meets compliance (30 days)', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*30/);
    });

    test('multi-region audit trail for compliance', () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('log retention configured for compliance', () => {
      const matches = stackContent.match(/retention_in_days\s*=\s*90/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Dependencies and Relationships', () => {
    test('Lambda depends on CloudWatch log group', () => {
      const lambdaSection = stackContent.match(/resource\s+"aws_lambda_function"\s+"rotation"[\s\S]*?(?=resource\s+"|$)/);
      expect(lambdaSection).not.toBeNull();
      expect(lambdaSection![0]).toMatch(/depends_on/);
      expect(lambdaSection![0]).toMatch(/aws_cloudwatch_log_group\.lambda_rotation/);
    });

    test('RDS depends on CloudWatch log group', () => {
      const rdsSection = stackContent.match(/resource\s+"aws_db_instance"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
      expect(rdsSection).not.toBeNull();
      expect(rdsSection![0]).toMatch(/depends_on/);
      expect(rdsSection![0]).toMatch(/aws_cloudwatch_log_group\.rds_logs/);
    });

    test('secret rotation depends on Lambda permission', () => {
      const rotationSection = stackContent.match(/resource\s+"aws_secretsmanager_secret_rotation"[\s\S]*?(?=resource\s+"|$)/);
      expect(rotationSection).not.toBeNull();
      expect(rotationSection![0]).toMatch(/depends_on/);
      expect(rotationSection![0]).toMatch(/aws_lambda_permission\.rotation/);
    });

    test('CloudTrail depends on S3 bucket policy', () => {
      const cloudtrailSection = stackContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?(?=resource\s+"|$)/);
      expect(cloudtrailSection).not.toBeNull();
      expect(cloudtrailSection![0]).toMatch(/depends_on/);
      expect(cloudtrailSection![0]).toMatch(/aws_s3_bucket_policy\.cloudtrail/);
    });

    test('EventBridge target depends on CloudWatch log group', () => {
      const targetSection = stackContent.match(/resource\s+"aws_cloudwatch_event_target"\s+"rotation_logs"[\s\S]*?(?=resource\s+"|$)/);
      expect(targetSection).not.toBeNull();
      expect(targetSection![0]).toMatch(/depends_on/);
    });
  });

  describe('Banking Compliance Standards', () => {
    test('all resources have environment tags', () => {
      const tagMatches = stackContent.match(/Environment\s*=/g);
      expect(tagMatches).not.toBeNull();
      expect(tagMatches!.length).toBeGreaterThan(10);
    });

    test('KMS keys have banking compliance tags', () => {
      const kmsSection = stackContent.match(/resource\s+"aws_kms_key"\s+"secrets_key"[\s\S]*?(?=resource\s+"|$)/);
      expect(kmsSection).not.toBeNull();
      expect(kmsSection![0]).toMatch(/Compliance\s*=\s*"Banking"/);
    });

    test('comprehensive audit logging configured', () => {
      // CloudTrail captures Secrets Manager events via management events
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
      expect(stackContent).toMatch(/AWS::Lambda::Function/);
      expect(stackContent).toMatch(/CloudTrail/);
    });

    test('monitoring and alerting configured', () => {
      expect(stackContent).toMatch(/rotation_failures/);
      expect(stackContent).toMatch(/rotation_duration/);
      expect(stackContent).toMatch(/dlq_messages/);
    });
  });
});
