// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure
// No Terraform commands are executed - only static file validation

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read file content
function readFile(filename: string): string {
  return fs.readFileSync(path.join(LIB_DIR, filename), 'utf8');
}

// Helper function to check if file exists
function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(LIB_DIR, filename));
}

describe('Terraform Infrastructure - Unit Tests', () => {
  describe('File Structure', () => {
    test('all required .tf files exist in lib/ folder', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'main.tf',
        'cognito.tf',
        'dynamodb.tf',
        'lambda.tf',
        'api_gateway.tf',
        'cloudfront.tf',
        'route53.tf',
        'iam.tf',
        'monitoring.tf',
        'outputs.tf',
      ];

      requiredFiles.forEach((file) => {
        expect(fileExists(file)).toBe(true);
      });
    });

    test('Lambda code exists in lib/lambda/ folder', () => {
      const lambdaDir = path.join(LIB_DIR, 'lambda');
      expect(fs.existsSync(lambdaDir)).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, 'lambda_function.py'))).toBe(true);
      expect(fs.existsSync(path.join(lambdaDir, 'requirements.txt'))).toBe(true);
    });

    test('no provider blocks in files except provider.tf', () => {
      const files = [
        'main.tf',
        'cognito.tf',
        'dynamodb.tf',
        'lambda.tf',
        'api_gateway.tf',
        'cloudfront.tf',
        'route53.tf',
        'iam.tf',
        'monitoring.tf',
        'outputs.tf',
      ];

      files.forEach((file) => {
        const content = readFile(file);
        expect(content).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
      });
    });

    test('provider.tf has both primary and secondary region providers', () => {
      const content = readFile('provider.tf');
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
    });
  });

  describe('Variables Configuration', () => {
    test('environment_suffix variable is declared', () => {
      const content = readFile('variables.tf');
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('primary_region and secondary_region variables declared', () => {
      const content = readFile('variables.tf');
      expect(content).toMatch(/variable\s+"primary_region"\s*{/);
      expect(content).toMatch(/variable\s+"secondary_region"\s*{/);
    });

    test('alarm_email has default value', () => {
      const content = readFile('variables.tf');
      expect(content).toMatch(/variable\s+"alarm_email"\s*{/);
      expect(content).toMatch(/default\s*=\s*"devang\.p@turing\.com"/);
    });

    test('enable_route53 has default false', () => {
      const content = readFile('variables.tf');
      expect(content).toMatch(/variable\s+"enable_route53"\s*{/);
      expect(content).toMatch(/default\s*=\s*false/);
    });

    test('all variables have proper descriptions', () => {
      const content = readFile('variables.tf');
      const variableBlocks = content.match(/variable\s+"[^"]+"\s*{[^}]*}/gs) || [];
      expect(variableBlocks.length).toBeGreaterThan(5);

      variableBlocks.forEach((block) => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe('Resource Naming with environment_suffix', () => {
    test('S3 bucket uses environment_suffix', () => {
      const content = readFile('main.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-lambda-deployments/);
    });

    test('Cognito User Pool uses environment_suffix', () => {
      const content = readFile('cognito.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-user-pool/);
    });

    test('DynamoDB table uses environment_suffix', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-user-profiles/);
    });

    test('Lambda function uses environment_suffix', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-api-handler/);
    });

    test('API Gateway uses environment_suffix', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-api/);
    });

    test('IAM roles use environment_suffix', () => {
      const content = readFile('iam.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-lambda-execution-role/);
    });

    test('SNS topic uses environment_suffix', () => {
      const content = readFile('monitoring.tf');
      expect(content).toMatch(/\$\{var\.environment_suffix\}-api-alarms/);
    });
  });

  describe('Cognito Configuration', () => {
    test('User Pool resource exists', () => {
      const content = readFile('cognito.tf');
      expect(content).toMatch(/resource\s+"aws_cognito_user_pool"\s+"main"/);
    });

    test('User Pool Client exists', () => {
      const content = readFile('cognito.tf');
      expect(content).toMatch(/resource\s+"aws_cognito_user_pool_client"/);
    });

    test('password policies are configured', () => {
      const content = readFile('cognito.tf');
      expect(content).toMatch(/password_policy\s*{/);
      expect(content).toMatch(/minimum_length\s*=\s*8/);
      expect(content).toMatch(/require_lowercase\s*=\s*true/);
      expect(content).toMatch(/require_uppercase\s*=\s*true/);
      expect(content).toMatch(/require_numbers\s*=\s*true/);
      expect(content).toMatch(/require_symbols\s*=\s*true/);
    });

    test('email verification is enabled', () => {
      const content = readFile('cognito.tf');
      expect(content).toMatch(/auto_verified_attributes\s*=\s*\["email"\]/);
    });
  });

  describe('DynamoDB Configuration', () => {
    test('table with userId primary key exists', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"user_profiles"/);
      expect(content).toMatch(/hash_key\s*=\s*"userId"/);
    });

    test('Global Secondary Index for email exists', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/global_secondary_index\s*{/);
      expect(content).toMatch(/name\s*=\s*"email-index"/);
      expect(content).toMatch(/hash_key\s*=\s*"email"/);
    });

    test('billing mode is PAY_PER_REQUEST', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test('does not use deprecated replica block', () => {
      const content = readFile('dynamodb.tf');
      // Replica block is deprecated - should use aws_dynamodb_table_replica resource instead
      expect(content).not.toMatch(/replica\s*{/);
    });

    test('point-in-time recovery is enabled', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/point_in_time_recovery\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test('encryption is enabled', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe('Lambda Configuration', () => {
    test('function uses python3.11 runtime', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/runtime\s*=\s*var\.lambda_runtime/);
      const varsContent = readFile('variables.tf');
      expect(varsContent).toMatch(/default\s*=\s*"python3\.11"/);
    });

    test('handler is lambda_function.lambda_handler', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test('X-Ray tracing is configured', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/tracing_config\s*{/);
      expect(content).toMatch(/mode\s*=\s*var\.enable_xray_tracing/);
    });

    test('environment variables include table name', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/environment\s*{/);
      expect(content).toMatch(/DYNAMODB_TABLE_NAME\s*=\s*aws_dynamodb_table\.user_profiles\.name/);
    });

    test('source code from S3', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/s3_bucket\s*=\s*aws_s3_bucket\.lambda_deployments\.id/);
      expect(content).toMatch(/s3_key\s*=\s*aws_s3_object\.lambda_package\.key/);
    });

    test('CloudWatch log group with retention exists', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(content).toMatch(/retention_in_days\s*=\s*var\.cloudwatch_retention_days/);
    });
  });

  describe('API Gateway Configuration', () => {
    test('REST API resource exists', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"/);
    });

    test('Cognito authorizer is configured', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/resource\s+"aws_api_gateway_authorizer"\s+"cognito"/);
      expect(content).toMatch(/type\s*=\s*"COGNITO_USER_POOLS"/);
      expect(content).toMatch(/provider_arns\s*=\s*\[aws_cognito_user_pool\.main\.arn\]/);
    });

    test('multiple resources and methods are defined', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"profiles"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"profile_by_id"/);
      expect(content).toMatch(/http_method\s*=\s*"GET"/);
      expect(content).toMatch(/http_method\s*=\s*"POST"/);
      expect(content).toMatch(/http_method\s*=\s*"PUT"/);
      expect(content).toMatch(/http_method\s*=\s*"DELETE"/);
    });

    test('Lambda integration on methods', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"/);
      expect(content).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(content).toMatch(/uri\s*=\s*aws_lambda_function\.api_handler\.invoke_arn/);
    });

    test('CORS configuration is present', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/http_method\s*=\s*"OPTIONS"/);
      expect(content).toMatch(/Access-Control-Allow/);
    });

    test('X-Ray is enabled', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/xray_tracing_enabled\s*=\s*var\.enable_xray_tracing/);
    });

    test('CloudWatch logging is enabled', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/access_log_settings\s*{/);
      expect(content).toMatch(/logging_level\s*=\s*"INFO"/);
    });
  });

  describe('CloudFront Configuration', () => {
    test('distribution exists', () => {
      const content = readFile('cloudfront.tf');
      expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    });

    test('origin is API Gateway', () => {
      const content = readFile('cloudfront.tf');
      expect(content).toMatch(/origin\s*{/);
      expect(content).toMatch(/aws_api_gateway_stage\.prod/);
    });

    test('HTTPS only configuration', () => {
      const content = readFile('cloudfront.tf');
      expect(content).toMatch(/origin_protocol_policy\s*=\s*"https-only"/);
      expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    });

    test('proper cache behavior for API', () => {
      const content = readFile('cloudfront.tf');
      expect(content).toMatch(/default_cache_behavior\s*{/);
      expect(content).toMatch(/allowed_methods\s*=\s*\["DELETE",\s*"GET",\s*"HEAD",\s*"OPTIONS",\s*"PATCH",\s*"POST",\s*"PUT"\]/);
    });
  });

  describe('Route53 Configuration', () => {
    test('resources are conditional based on variable', () => {
      const content = readFile('route53.tf');
      expect(content).toMatch(/count\s*=\s*var\.enable_route53\s*\?\s*1\s*:\s*0/);
    });

    test('proper comments about optional nature', () => {
      const content = readFile('route53.tf');
      expect(content).toMatch(/OPTIONAL/i);
      expect(content).toMatch(/disabled by default/i);
    });
  });

  describe('IAM Configuration', () => {
    test('Lambda execution role exists', () => {
      const content = readFile('iam.tf');
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
    });

    test('NO wildcards in any policy', () => {
      const content = readFile('iam.tf');
      const policyBlocks = content.match(/policy\s*=\s*jsonencode\({[\s\S]*?}\)/g) || [];

      policyBlocks.forEach((block) => {
        // Check that Resource fields don't use wildcard alone
        const resourceMatches = block.match(/"Resource"\s*[=:]\s*"[^"]*"/g) || [];
        resourceMatches.forEach((resource) => {
          // Allow wildcards at the end of ARNs (e.g., arn:aws:logs:...:log-group:name:*)
          // but not standalone wildcards
          if (resource.includes('"*"')) {
            fail('Found standalone wildcard (*) in IAM policy Resource');
          }
        });
      });
    });

    test('DynamoDB permissions on specific table ARN', () => {
      const content = readFile('iam.tf');
      expect(content).toMatch(/aws_dynamodb_table\.user_profiles\.arn/);
    });

    test('CloudWatch permissions on specific log group ARN', () => {
      const content = readFile('iam.tf');
      expect(content).toMatch(/arn:aws:logs.*log-group:\/aws\/lambda\/\$\{var\.environment_suffix\}-api-handler/);
    });

    test('proper trust relationships', () => {
      const content = readFile('iam.tf');
      expect(content).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(content).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });
  });

  describe('Monitoring Configuration', () => {
    test('SNS topic and subscription exist', () => {
      const content = readFile('monitoring.tf');
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"api_alarms"/);
      expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"api_alarms_email"/);
    });

    test('CloudWatch dashboard with multiple widgets', () => {
      const content = readFile('monitoring.tf');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"/);
      expect(content).toMatch(/widgets\s*=/);
      // Check for various widget types
      expect(content).toMatch(/API Gateway/);
      expect(content).toMatch(/Lambda/);
      expect(content).toMatch(/DynamoDB/);
    });

    test('multiple alarms are configured', () => {
      const content = readFile('monitoring.tf');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_5xx_errors"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_duration"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_errors"/);
    });

    test('X-Ray sampling rule exists', () => {
      const content = readFile('monitoring.tf');
      expect(content).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"main"/);
    });
  });

  describe('Outputs Configuration', () => {
    test('all required outputs are defined', () => {
      const content = readFile('outputs.tf');
      const requiredOutputs = [
        'api_gateway_invoke_url',
        'cloudfront_domain_name',
        'cognito_user_pool_id',
        'cognito_user_pool_client_id',
        'dynamodb_table_name',
        'lambda_function_name',
        'primary_region',
        'secondary_region',
      ];

      requiredOutputs.forEach((output) => {
        expect(content).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test('outputs have proper value references', () => {
      const content = readFile('outputs.tf');
      expect(content).toMatch(/value\s*=\s*aws_api_gateway_stage\.prod\.invoke_url/);
      expect(content).toMatch(/value\s*=\s*aws_cloudfront_distribution\.main\.domain_name/);
      expect(content).toMatch(/value\s*=\s*aws_cognito_user_pool\.main\.id/);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 versioning is enabled', () => {
      const content = readFile('main.tf');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('S3 encryption is configured', () => {
      const content = readFile('main.tf');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('S3 public access is blocked', () => {
      const content = readFile('main.tf');
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
      expect(content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('DynamoDB encryption is enabled', () => {
      const content = readFile('dynamodb.tf');
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test('CloudWatch log retention is set', () => {
      const lambdaContent = readFile('lambda.tf');
      const apiContent = readFile('api_gateway.tf');
      expect(lambdaContent).toMatch(/retention_in_days\s*=\s*var\.cloudwatch_retention_days/);
      expect(apiContent).toMatch(/retention_in_days\s*=\s*var\.cloudwatch_retention_days/);
    });
  });

  describe('Lambda Application Code', () => {
    test('lambda_function.py has CRUD operations', () => {
      const lambdaCode = fs.readFileSync(
        path.join(LIB_DIR, 'lambda', 'lambda_function.py'),
        'utf8'
      );
      expect(lambdaCode).toMatch(/def create_profile/);
      expect(lambdaCode).toMatch(/def get_profile/);
      expect(lambdaCode).toMatch(/def update_profile/);
      expect(lambdaCode).toMatch(/def delete_profile/);
      expect(lambdaCode).toMatch(/def list_profiles/);
    });

    test('lambda_function.py has X-Ray tracing comment', () => {
      const lambdaCode = fs.readFileSync(
        path.join(LIB_DIR, 'lambda', 'lambda_function.py'),
        'utf8'
      );
      // X-Ray is enabled at Lambda function level, not via SDK decorators
      expect(lambdaCode).toMatch(/X-Ray tracing/i);
    });

    test('lambda_function.py has proper error handling', () => {
      const lambdaCode = fs.readFileSync(
        path.join(LIB_DIR, 'lambda', 'lambda_function.py'),
        'utf8'
      );
      expect(lambdaCode).toMatch(/try:/);
      expect(lambdaCode).toMatch(/except/);
      expect(lambdaCode).toMatch(/return response\(4\d\d/); // 4xx errors
      expect(lambdaCode).toMatch(/return response\(5\d\d/); // 5xx errors
    });

    test('requirements.txt exists and is documented', () => {
      const requirements = fs.readFileSync(
        path.join(LIB_DIR, 'lambda', 'requirements.txt'),
        'utf8'
      );
      // boto3 is included by default in Lambda runtime
      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
    });
  });

  describe('Dependencies and Resource Relationships', () => {
    test('Lambda has proper depends_on', () => {
      const content = readFile('lambda.tf');
      expect(content).toMatch(/depends_on\s*=\s*\[/);
      expect(content).toMatch(/aws_iam_role_policy/);
      expect(content).toMatch(/aws_cloudwatch_log_group/);
    });

    test('API Gateway deployment has depends_on', () => {
      const content = readFile('api_gateway.tf');
      expect(content).toMatch(/depends_on\s*=\s*\[/);
      expect(content).toMatch(/aws_api_gateway_integration/);
    });

    test('CloudFront depends on API Gateway stage', () => {
      const content = readFile('cloudfront.tf');
      expect(content).toMatch(/depends_on\s*=\s*\[/);
      expect(content).toMatch(/aws_api_gateway_stage\.prod/);
    });
  });
});
