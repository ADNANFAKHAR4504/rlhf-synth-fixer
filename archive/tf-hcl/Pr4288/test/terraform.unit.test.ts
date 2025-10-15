import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const VARIABLES_TF = path.join(LIB_DIR, 'variables.tf');
const OUTPUTS_TF = path.join(LIB_DIR, 'outputs.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

describe('Terraform Logging Analytics Infrastructure - Unit Tests', () => {
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    // Read all Terraform files
    mainTfContent = fs.readFileSync(MAIN_TF, 'utf8');
    variablesTfContent = fs.readFileSync(VARIABLES_TF, 'utf8');
    outputsTfContent = fs.readFileSync(OUTPUTS_TF, 'utf8');
    providerTfContent = fs.readFileSync(PROVIDER_TF, 'utf8');
  });

  describe('File Structure Validation', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
      expect(fs.existsSync(VARIABLES_TF)).toBe(true);
      expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    });

    test('main.tf does not contain provider configuration', () => {
      expect(mainTfContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test('provider.tf contains AWS provider configuration', () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test('files are properly formatted and syntactically valid', () => {
      // Basic syntax checks
      expect(mainTfContent).not.toContain('<<<<<<< HEAD'); // No merge conflicts
      expect(mainTfContent).not.toContain('>>>>>>> '); // No merge conflicts
      expect(providerTfContent).not.toContain('<<<<<<< HEAD');
      
      // Check for balanced braces (simple validation)
      const openBraces = (mainTfContent.match(/{/g) || []).length;
      const closeBraces = (mainTfContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe('Resource Naming and Suffix Strategy', () => {
    test('random_id resource exists for unique naming', () => {
      expect(mainTfContent).toMatch(/resource\s+"random_id"\s+"suffix"/);
    });

    test('locals block contains naming strategy', () => {
      expect(mainTfContent).toMatch(/locals\s*{/);
      expect(mainTfContent).toMatch(/name_suffix/);
      expect(mainTfContent).toMatch(/name_prefix/);
      expect(mainTfContent).toMatch(/full_prefix/);
    });

    test('resources use consistent naming with suffix', () => {
      // Check S3 bucket uses suffix
      expect(mainTfContent).toMatch(/bucket\s*=\s*.*name_suffix/);
      
      // Check IAM roles use full_prefix
      expect(mainTfContent).toMatch(/name\s*=\s*.*full_prefix.*firehose-role/);
      expect(mainTfContent).toMatch(/name\s*=\s*.*full_prefix.*lambda-role/);
    });
  });

  describe('S3 Storage Configuration', () => {
    test('S3 bucket is configured with security best practices', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"log_storage"/);
      expect(mainTfContent).toMatch(/bucket\s*=\s*.*var\.log_bucket_name/);
    });

    test('S3 bucket has lifecycle configuration', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"log_lifecycle"/);
      expect(mainTfContent).toMatch(/expiration\s*{/);
      expect(mainTfContent).toMatch(/days\s*=\s*var\.retention_days/);
    });

    test('S3 bucket has server-side encryption', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"log_encryption"/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('S3 bucket blocks public access', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"log_access_block"/);
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainTfContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('S3 bucket configuration allows proper cleanup', () => {
      // Verify that the bucket doesn't have prevent_destroy to allow CI/CD cleanup
      expect(mainTfContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });
  });

  describe('IAM Roles and Security Configuration', () => {
    test('Firehose IAM role has proper assume role policy', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"firehose_role"/);
      expect(mainTfContent).toMatch(/firehose\.amazonaws\.com/);
    });

    test('Lambda IAM role has proper assume role policy', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(mainTfContent).toMatch(/lambda\.amazonaws\.com/);
    });

    test('Glue IAM role has proper assume role policy', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"glue_role"/);
      expect(mainTfContent).toMatch(/glue\.amazonaws\.com/);
    });

    test('Athena IAM role has proper assume role policy', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"athena_role"/);
      expect(mainTfContent).toMatch(/athena\.amazonaws\.com/);
    });

    test('IAM policies follow least privilege principle', () => {
      // Firehose policy
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_policy"\s+"firehose_policy"/);
      expect(mainTfContent).toMatch(/"s3:PutObject"/);
      expect(mainTfContent).toMatch(/"lambda:InvokeFunction"/);
      
      // Lambda policy
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_policy"/);
      expect(mainTfContent).toMatch(/"logs:CreateLogGroup"/);
      expect(mainTfContent).toMatch(/"cloudwatch:PutMetricData"/);
    });

    test('IAM policy attachments are configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"firehose_policy_attachment"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_policy_attachment"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"glue_s3_policy_attachment"/);
    });
  });

  describe('Kinesis Firehose Configuration', () => {
    test('Firehose delivery streams are created for all log types', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kinesis_firehose_delivery_stream"\s+"log_delivery_stream"/);
      expect(mainTfContent).toMatch(/for_each\s*=\s*toset\(var\.log_types\)/);
      expect(mainTfContent).toMatch(/destination\s*=\s*"extended_s3"/);
    });

    test('Firehose has proper S3 configuration with partitioning', () => {
      expect(mainTfContent).toMatch(/extended_s3_configuration\s*{/);
      expect(mainTfContent).toMatch(/prefix\s*=.*logs.*year.*month.*day.*hour/);
      expect(mainTfContent).toMatch(/error_output_prefix\s*=.*errors/);
    });

    test('Firehose has Lambda processing enabled', () => {
      expect(mainTfContent).toMatch(/processing_configuration\s*{/);
      expect(mainTfContent).toMatch(/enabled\s*=\s*true/);
      expect(mainTfContent).toMatch(/type\s*=\s*"Lambda"/);
      expect(mainTfContent).toMatch(/parameter_name\s*=\s*"LambdaArn"/);
    });

    test('Firehose has data format conversion to Parquet', () => {
      expect(mainTfContent).toMatch(/data_format_conversion_configuration\s*{/);
      expect(mainTfContent).toMatch(/hive_json_ser_de\s*{}/);
      expect(mainTfContent).toMatch(/parquet_ser_de\s*{}/);
    });

    test('Firehose has CloudWatch logging enabled', () => {
      expect(mainTfContent).toMatch(/cloudwatch_logging_options\s*{/);
      expect(mainTfContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Lambda function is properly configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"log_processor"/);
      expect(mainTfContent).toMatch(/filename\s*=\s*"lambda_function\.zip"/);
      expect(mainTfContent).toMatch(/handler\s*=\s*"index\.handler"/);
      expect(mainTfContent).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
      expect(mainTfContent).toMatch(/role\s*=.*aws_iam_role\.lambda_role\.arn/);
    });

    test('Lambda has environment variables configured', () => {
      expect(mainTfContent).toMatch(/environment\s*{/);
      expect(mainTfContent).toMatch(/LOG_BUCKET/);
      expect(mainTfContent).toMatch(/METRIC_NAMESPACE/);
    });

    test('Lambda has CloudWatch log group', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_log_group"/);
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*30/);
    });
  });

  describe('Glue Data Catalog Configuration', () => {
    test('Glue database is configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_glue_catalog_database"\s+"logs_database"/);
      expect(mainTfContent).toMatch(/name\s*=\s*var\.glue_database_name/);
    });

    test('Glue tables are created for each log type', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_glue_catalog_table"\s+"logs_table"/);
      expect(mainTfContent).toMatch(/for_each\s*=\s*toset\(var\.log_types\)/);
      expect(mainTfContent).toMatch(/table_type\s*=\s*"EXTERNAL_TABLE"/);
    });

    test('Glue tables have proper schema columns', () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"timestamp"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"log_level"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"message"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"server_id"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"source"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"component"/);
    });

    test('Glue crawler is configured for schema discovery', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_glue_crawler"\s+"logs_crawler"/);
      expect(mainTfContent).toMatch(/s3_target\s*{/);
      expect(mainTfContent).toMatch(/schedule\s*=\s*"cron\(0 0 \* \* \? \*\)"/);
    });

    test('Glue crawler has schema change policy', () => {
      expect(mainTfContent).toMatch(/schema_change_policy\s*{/);
      expect(mainTfContent).toMatch(/delete_behavior\s*=\s*"LOG"/);
      expect(mainTfContent).toMatch(/update_behavior\s*=\s*"UPDATE_IN_DATABASE"/);
    });
  });

  describe('Athena Configuration', () => {
    test('Athena workgroup is configured with encryption', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_athena_workgroup"\s+"logs_analytics"/);
      expect(mainTfContent).toMatch(/enforce_workgroup_configuration\s*=\s*true/);
      expect(mainTfContent).toMatch(/publish_cloudwatch_metrics_enabled\s*=\s*true/);
      expect(mainTfContent).toMatch(/encryption_option\s*=\s*"SSE_S3"/);
    });

    test('Athena workgroup has result configuration', () => {
      expect(mainTfContent).toMatch(/result_configuration\s*{/);
      expect(mainTfContent).toMatch(/output_location\s*=.*athena-results/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarm for high error rate exists', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_error_rate"/);
      expect(mainTfContent).toMatch(/metric_name\s*=\s*"ErrorCount"/);
      expect(mainTfContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(mainTfContent).toMatch(/threshold\s*=\s*10/);
    });

    test('CloudWatch dashboard is configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"logs_dashboard"/);
      expect(mainTfContent).toMatch(/ProcessedLogCount/);
      expect(mainTfContent).toMatch(/ErrorCount/);
      expect(mainTfContent).toMatch(/DeliveryToS3\.Success/);
    });

    test('CloudWatch log groups have retention', () => {
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test('SNS topic and subscription are configured', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarm_notifications"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email_subscription"/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"email"/);
      expect(mainTfContent).toMatch(/endpoint\s*=\s*var\.alarm_email/);
    });
  });

  describe('Variables Configuration', () => {
    test('all required variables are defined with defaults', () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"us-east-2"/);
      
      expect(variablesTfContent).toMatch(/variable\s+"environment"/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"prod"/);
      
      expect(variablesTfContent).toMatch(/variable\s+"project"/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"logging-analytics"/);
      
      expect(variablesTfContent).toMatch(/variable\s+"log_types"/);
      expect(variablesTfContent).toMatch(/"application", "system", "security", "performance"/);
      
      expect(variablesTfContent).toMatch(/variable\s+"firehose_buffer_size"/);
      expect(variablesTfContent).toMatch(/default\s*=\s*64/);
      
      expect(variablesTfContent).toMatch(/variable\s+"retention_days"/);
      expect(variablesTfContent).toMatch(/default\s*=\s*365/);
    });

    test('variables have proper types and descriptions', () => {
      expect(variablesTfContent).toMatch(/type\s*=\s*string/);
      expect(variablesTfContent).toMatch(/type\s*=\s*list\(string\)/);
      expect(variablesTfContent).toMatch(/type\s*=\s*number/);
      expect(variablesTfContent).toMatch(/description\s*=.*AWS region/);
    });

    test('sensitive variables are properly configured', () => {
      expect(variablesTfContent).toMatch(/variable\s+"alarm_email"/);
      expect(variablesTfContent).toMatch(/govardhan\.y@turing\.com/);
    });
  });

  describe('Outputs Configuration', () => {
    test('all critical outputs are defined', () => {
      expect(outputsTfContent).toMatch(/output\s+"log_bucket_name"/);
      expect(outputsTfContent).toMatch(/output\s+"firehose_delivery_streams"/);
      expect(outputsTfContent).toMatch(/output\s+"lambda_function_name"/);
      expect(outputsTfContent).toMatch(/output\s+"glue_database_name"/);
      expect(outputsTfContent).toMatch(/output\s+"athena_workgroup_name"/);
      expect(outputsTfContent).toMatch(/output\s+"cloudwatch_dashboard_name"/);
      expect(outputsTfContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('outputs have descriptions', () => {
      expect(outputsTfContent).toMatch(/description\s*=.*S3 bucket/);
      expect(outputsTfContent).toMatch(/description\s*=.*Lambda function/);
      expect(outputsTfContent).toMatch(/description\s*=.*Glue database/);
    });

    test('outputs reference correct resources', () => {
      expect(outputsTfContent).toMatch(/aws_s3_bucket\.log_storage\.id/);
      expect(outputsTfContent).toMatch(/aws_lambda_function\.log_processor\.function_name/);
      expect(outputsTfContent).toMatch(/aws_glue_catalog_database\.logs_database\.name/);
    });
  });

  describe('Security and Compliance', () => {
    test('no hardcoded secrets or credentials in configuration', () => {
      const allContent = mainTfContent + variablesTfContent + outputsTfContent + providerTfContent;
      
      // Check for common patterns of hardcoded secrets
      expect(allContent).not.toMatch(/password\s*=\s*"[^$]/i);
      expect(allContent).not.toMatch(/secret\s*=\s*"[^$]/i);
      expect(allContent).not.toMatch(/key\s*=\s*"AKIA/i);
      expect(allContent).not.toMatch(/token\s*=\s*"[^$]/i);
    });

    test('resources are tagged appropriately', () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*{/);
      expect(mainTfContent).toMatch(/LogType\s*=\s*each\.value/);
    });

    test('encryption is configured where applicable', () => {
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(mainTfContent).toMatch(/encryption_option\s*=\s*"SSE_S3"/);
    });

    test('least privilege access patterns', () => {
      // Verify specific resource ARNs in policies, not wildcards
      expect(mainTfContent).toMatch(/aws_s3_bucket\.log_storage\.arn/);
      expect(mainTfContent).toMatch(/aws_lambda_function\.log_processor\.arn/);
    });
  });

  describe('Resource Dependencies and References', () => {
    test('Firehose references correct IAM role', () => {
      expect(mainTfContent).toMatch(/role_arn\s*=\s*aws_iam_role\.firehose_role\.arn/);
    });

    test('Lambda function references correct IAM role', () => {
      expect(mainTfContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_role\.arn/);
    });

    test('Firehose references correct S3 bucket', () => {
      expect(mainTfContent).toMatch(/bucket_arn\s*=\s*aws_s3_bucket\.log_storage\.arn/);
    });

    test('Glue tables reference correct database', () => {
      expect(mainTfContent).toMatch(/database_name\s*=\s*aws_glue_catalog_database\.logs_database\.name/);
    });

    test('CloudWatch alarms reference correct SNS topic', () => {
      expect(mainTfContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.alarm_notifications\.arn\]/);
    });
  });

  describe('Configuration Best Practices', () => {
    test('resources have consistent naming patterns', () => {
      // All resources should use the naming convention with suffixes
      const resourceMatches = mainTfContent.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];
      expect(resourceMatches.length).toBeGreaterThan(20); // Should have many resources
    });

    test('variables are properly documented', () => {
      const variableCount = (variablesTfContent.match(/variable\s+"/g) || []).length;
      const descriptionCount = (variablesTfContent.match(/description\s*=/g) || []).length;
      expect(descriptionCount).toBe(variableCount); // All variables should have descriptions
    });

    test('outputs are properly documented', () => {
      const outputCount = (outputsTfContent.match(/output\s+"/g) || []).length;
      const descriptionCount = (outputsTfContent.match(/description\s*=/g) || []).length;
      expect(descriptionCount).toBe(outputCount); // All outputs should have descriptions
    });

    test('configuration uses variables instead of hardcoded values', () => {
      // Should use variables for configurable values
      expect(mainTfContent).toMatch(/var\.retention_days/);
      expect(mainTfContent).toMatch(/var\.firehose_buffer_size/);
      expect(mainTfContent).toMatch(/var\.lambda_memory_size/);
      expect(mainTfContent).toMatch(/var\.alarm_email/);
    });
  });
});
