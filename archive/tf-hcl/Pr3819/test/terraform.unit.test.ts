import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Feedback Processing System Unit Tests', () => {
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
    variablesTfContent = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
    outputsTfContent = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
    providerTfContent = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
  });

  describe('File Structure', () => {
    test('main.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
    });

    test('lambda_function.py exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'lambda_function.py'))).toBe(true);
    });

    test('lambda_function.zip exists', () => {
      expect(fs.existsSync(path.join(LIB_DIR, 'lambda_function.zip'))).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('declares AWS provider with proper configuration', () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s+{/);
      expect(providerTfContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('specifies required Terraform version', () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
    });

    test('declares required AWS provider version', () => {
      expect(providerTfContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerTfContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });
  });

  describe('Variables', () => {
    test('declares aws_region variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"\s+{/);
    });

    test('declares environment_suffix variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"\s+{/);
    });

    test('declares project_name variable', () => {
      expect(variablesTfContent).toMatch(/variable\s+"project_name"\s+{/);
    });

    test('declares lambda configuration variables', () => {
      expect(variablesTfContent).toMatch(/variable\s+"lambda_timeout"\s+{/);
      expect(variablesTfContent).toMatch(/variable\s+"lambda_memory_size"\s+{/);
    });
  });

  describe('S3 Resources', () => {
    test('declares feedback data lake S3 bucket with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"feedback_data_lake"/);
      expect(mainTfContent).toMatch(/bucket\s*=\s*"feedback-data-lake-\${var\.environment_suffix}/);
    });

    test('declares Athena results S3 bucket with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"/);
      expect(mainTfContent).toMatch(/bucket\s*=\s*"feedback-athena-results-\${var\.environment_suffix}/);
    });

    test('configures S3 bucket versioning for data lake', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"feedback_data_lake"/);
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures S3 lifecycle policy for Athena results', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"athena_results"/);
      expect(mainTfContent).toMatch(/expiration\s*{[\s\S]*?days\s*=\s*30/);
    });

    test('S3 buckets have proper tags', () => {
      expect(mainTfContent).toMatch(/Name\s*=\s*"Feedback Data Lake"/);
      expect(mainTfContent).toMatch(/Environment\s*=\s*"production"/);
    });
  });

  describe('DynamoDB Resources', () => {
    test('declares DynamoDB table with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"feedback"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"customer-feedback-\${var\.environment_suffix}"/);
    });

    test('configures pay-per-request billing mode', () => {
      expect(mainTfContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('defines hash_key as feedbackId', () => {
      expect(mainTfContent).toMatch(/hash_key\s*=\s*"feedbackId"/);
    });

    test('defines range_key as timestamp', () => {
      expect(mainTfContent).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test('enables point-in-time recovery', () => {
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test('defines feedbackId attribute as String', () => {
      expect(mainTfContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"feedbackId"[\s\S]*?type\s*=\s*"S"/);
    });

    test('defines timestamp attribute as Number', () => {
      expect(mainTfContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"timestamp"[\s\S]*?type\s*=\s*"N"/);
    });
  });

  describe('Lambda Resources', () => {
    test('declares Lambda function with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"feedback_processor"/);
      expect(mainTfContent).toMatch(/function_name\s*=\s*"feedback-processor-\${var\.environment_suffix}"/);
    });

    test('configures Python 3.11 runtime', () => {
      expect(mainTfContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('sets proper handler', () => {
      expect(mainTfContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test('configures memory and timeout', () => {
      expect(mainTfContent).toMatch(/memory_size\s*=\s*512/);
      expect(mainTfContent).toMatch(/timeout\s*=\s*30/);
    });

    test('defines environment variables', () => {
      expect(mainTfContent).toMatch(/environment\s*{[\s\S]*?variables\s*=/);
      expect(mainTfContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.feedback\.name/);
      expect(mainTfContent).toMatch(/S3_BUCKET\s*=\s*aws_s3_bucket\.feedback_data_lake\.id/);
    });

    test('declares Lambda IAM role with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_feedback_processor"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"lambda-feedback-processor-role-\${var\.environment_suffix}"/);
    });

    test('Lambda role has assume role policy for Lambda service', () => {
      expect(mainTfContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
      expect(mainTfContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test('declares Lambda IAM policy with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_feedback_processor"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"lambda-feedback-processor-policy-\${var\.environment_suffix}"/);
    });

    test('Lambda policy grants Comprehend permissions', () => {
      expect(mainTfContent).toMatch(/comprehend:DetectSentiment/);
    });

    test('Lambda policy grants DynamoDB permissions', () => {
      expect(mainTfContent).toMatch(/dynamodb:PutItem/);
      expect(mainTfContent).toMatch(/dynamodb:UpdateItem/);
    });

    test('Lambda policy grants S3 permissions', () => {
      expect(mainTfContent).toMatch(/s3:PutObject/);
    });

    test('Lambda policy grants CloudWatch permissions', () => {
      expect(mainTfContent).toMatch(/cloudwatch:PutMetricData/);
      expect(mainTfContent).toMatch(/logs:CreateLogGroup/);
      expect(mainTfContent).toMatch(/logs:CreateLogStream/);
      expect(mainTfContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('API Gateway Resources', () => {
    test('declares REST API with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"feedback_api"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"feedback-submission-api-\${var\.environment_suffix}"/);
    });

    test('configures REGIONAL endpoint', () => {
      expect(mainTfContent).toMatch(/endpoint_configuration\s*{[\s\S]*?types\s*=\s*\[\s*"REGIONAL"\s*\]/);
    });

    test('declares feedback resource path', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"feedback"/);
      expect(mainTfContent).toMatch(/path_part\s*=\s*"feedback"/);
    });

    test('declares POST method', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"feedback_post"/);
      expect(mainTfContent).toMatch(/http_method\s*=\s*"POST"/);
    });

    test('configures Lambda integration', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"feedback_lambda"/);
      expect(mainTfContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(mainTfContent).toMatch(/integration_http_method\s*=\s*"POST"/);
    });

    test('declares deployment', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"feedback_api"/);
    });

    test('declares production stage', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"prod"/);
      expect(mainTfContent).toMatch(/stage_name\s*=\s*"prod"/);
    });

    test('grants API Gateway permission to invoke Lambda', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"/);
      expect(mainTfContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  describe('Glue Resources', () => {
    test('declares Glue database with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_glue_catalog_database"\s+"feedback_db"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"feedback_database_\${var\.environment_suffix}"/);
    });

    test('declares Glue crawler with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_glue_crawler"\s+"feedback_crawler"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"feedback-crawler-\${var\.environment_suffix}"/);
    });

    test('configures daily midnight schedule', () => {
      expect(mainTfContent).toMatch(/schedule\s*=\s*"cron\(0\s+0\s+\*\s+\*\s+\?\s+\*\)"/);
    });

    test('configures S3 target path', () => {
      expect(mainTfContent).toMatch(/s3_target\s*{[\s\S]*?path\s*=/);
    });

    test('configures schema change policy', () => {
      expect(mainTfContent).toMatch(/schema_change_policy\s*{/);
      expect(mainTfContent).toMatch(/update_behavior\s*=\s*"UPDATE_IN_DATABASE"/);
      expect(mainTfContent).toMatch(/delete_behavior\s*=\s*"LOG"/);
    });

    test('declares Glue IAM role with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"glue_crawler"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"glue-crawler-feedback-role-\${var\.environment_suffix}"/);
    });

    test('Glue role has assume role policy for Glue service', () => {
      expect(mainTfContent).toMatch(/Service\s*=\s*"glue\.amazonaws\.com"/);
    });

    test('Glue policy grants S3 permissions', () => {
      expect(mainTfContent).toMatch(/s3:GetObject/);
      expect(mainTfContent).toMatch(/s3:ListBucket/);
    });

    test('Glue policy grants Glue permissions', () => {
      expect(mainTfContent).toMatch(/glue:\*/);
    });
  });

  describe('Athena Resources', () => {
    test('declares Athena workgroup with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_athena_workgroup"\s+"feedback_analytics"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"feedback-analytics-\${var\.environment_suffix}"/);
    });

    test('enforces workgroup configuration', () => {
      expect(mainTfContent).toMatch(/enforce_workgroup_configuration\s*=\s*true/);
    });

    test('enables CloudWatch metrics', () => {
      expect(mainTfContent).toMatch(/publish_cloudwatch_metrics_enabled\s*=\s*true/);
    });

    test('configures result location', () => {
      expect(mainTfContent).toMatch(/result_configuration\s*{/);
      expect(mainTfContent).toMatch(/output_location\s*=/);
    });

    test('enables SSE-S3 encryption', () => {
      expect(mainTfContent).toMatch(/encryption_configuration\s*{/);
      expect(mainTfContent).toMatch(/encryption_option\s*=\s*"SSE_S3"/);
    });
  });

  describe('CloudWatch Resources', () => {
    test('declares CloudWatch log group', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"feedback_processor"/);
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*14/);
    });

    test('declares Lambda error alarm with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(mainTfContent).toMatch(/alarm_name\s*=\s*"feedback-processor-errors-\${var\.environment_suffix}"/);
    });

    test('Lambda error alarm monitors Errors metric', () => {
      expect(mainTfContent).toMatch(/metric_name\s*=\s*"Errors"/);
      expect(mainTfContent).toMatch(/namespace\s*=\s*"AWS\/Lambda"/);
    });

    test('declares DynamoDB throttle alarm with environment_suffix', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"/);
      expect(mainTfContent).toMatch(/alarm_name\s*=\s*"feedback-table-throttles-\${var\.environment_suffix}"/);
    });

    test('DynamoDB alarm monitors UserErrors metric', () => {
      expect(mainTfContent).toMatch(/metric_name\s*=\s*"UserErrors"/);
      expect(mainTfContent).toMatch(/namespace\s*=\s*"AWS\/DynamoDB"/);
    });
  });

  describe('Outputs', () => {
    test('exports API endpoint', () => {
      expect(outputsTfContent).toMatch(/output\s+"api_endpoint"/);
    });

    test('exports Lambda function name', () => {
      expect(outputsTfContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test('exports DynamoDB table name', () => {
      expect(outputsTfContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test('exports S3 data lake bucket', () => {
      expect(outputsTfContent).toMatch(/output\s+"s3_data_lake_bucket"/);
    });

    test('exports Glue database name', () => {
      expect(outputsTfContent).toMatch(/output\s+"glue_database_name"/);
    });

    test('exports Athena workgroup name', () => {
      expect(outputsTfContent).toMatch(/output\s+"athena_workgroup_name"/);
    });
  });

  describe('Lambda Function Python Code', () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(path.join(LIB_DIR, 'lambda_function.py'), 'utf8');
    });

    test('imports required modules', () => {
      expect(lambdaContent).toMatch(/import\s+json/);
      expect(lambdaContent).toMatch(/import\s+boto3/);
      expect(lambdaContent).toMatch(/from\s+datetime\s+import\s+datetime/);
      expect(lambdaContent).toMatch(/from\s+decimal\s+import\s+Decimal/);
    });

    test('initializes AWS clients', () => {
      expect(lambdaContent).toMatch(/comprehend\s*=\s*boto3\.client\('comprehend'/);
      expect(lambdaContent).toMatch(/dynamodb\s*=\s*boto3\.resource\('dynamodb'/);
      expect(lambdaContent).toMatch(/s3\s*=\s*boto3\.client\('s3'/);
      expect(lambdaContent).toMatch(/cloudwatch\s*=\s*boto3\.client\('cloudwatch'/);
    });

    test('defines lambda_handler function', () => {
      expect(lambdaContent).toMatch(/def\s+lambda_handler\s*\(\s*event\s*,\s*context\s*\)/);
    });

    test('parses request body', () => {
      expect(lambdaContent).toMatch(/json\.loads\s*\(\s*event\s*\[\s*['"]body['"]\s*\]\s*\)/);
    });

    test('calls Comprehend DetectSentiment', () => {
      expect(lambdaContent).toMatch(/comprehend\.detect_sentiment/);
    });

    test('stores data in DynamoDB', () => {
      expect(lambdaContent).toMatch(/table\.put_item/);
    });

    test('exports to S3 with year/month/day partitioning', () => {
      expect(lambdaContent).toMatch(/s3\.put_object/);
      expect(lambdaContent).toMatch(/year=/);
      expect(lambdaContent).toMatch(/month=/);
      expect(lambdaContent).toMatch(/day=/);
    });

    test('publishes CloudWatch metrics', () => {
      expect(lambdaContent).toMatch(/cloudwatch\.put_metric_data/);
    });

    test('handles errors gracefully', () => {
      expect(lambdaContent).toMatch(/except\s+Exception/);
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resources use environment_suffix variable', () => {
      const resourcesWithSuffix = [
        'feedback-data-lake',
        'feedback-athena-results',
        'customer-feedback',
        'lambda-feedback-processor-role',
        'lambda-feedback-processor-policy',
        'feedback-processor',
        'feedback-submission-api',
        'glue-crawler-feedback-role',
        'glue-crawler-policy',
        'feedback-crawler',
        'feedback-analytics',
        'feedback-processor-errors',
        'feedback-table-throttles',
      ];

      resourcesWithSuffix.forEach((resource) => {
        expect(mainTfContent).toMatch(new RegExp(`${resource}-?\\$\\{var\\.environment_suffix\\}`));
      });

      // Special case for database with underscore
      expect(mainTfContent).toMatch(/feedback_database_\${var\.environment_suffix}/);
    });
  });

  describe('AWS Caller Identity Data Source', () => {
    test('declares aws_caller_identity data source', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });
});
