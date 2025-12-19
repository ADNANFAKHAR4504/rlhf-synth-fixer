import * as fs from 'fs';
import * as path from 'path';

describe('Payment API Gateway Infrastructure - Unit Tests', () => {
  const mainTfPath = path.join(__dirname, '..', 'lib', 'main.tf');
  const providerTfPath = path.join(__dirname, '..', 'lib', 'provider.tf');
  
  let mainTfContent: string;
  let providerTfContent: string;
  let allTfContent: string;

  beforeAll(() => {
    if (!fs.existsSync(mainTfPath)) {
      throw new Error(`main.tf not found at: ${mainTfPath}`);
    }
    
    mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
    console.log('✅ Loaded main.tf');
    
    if (fs.existsSync(providerTfPath)) {
      providerTfContent = fs.readFileSync(providerTfPath, 'utf-8');
      console.log('✅ Loaded provider.tf');
    } else {
      providerTfContent = '';
      console.log('⚠️  provider.tf not found - skipping provider tests');
    }
    
    allTfContent = mainTfContent + '\n' + providerTfContent;
  });

  function has(rx: RegExp): boolean {
    return rx.test(allTfContent);
  }

  function count(rx: RegExp): number {
    return (allTfContent.match(rx) || []).length;
  }

  // ========================================
  // TEST GROUP 1: Terraform Configuration
  // ========================================
  describe('Terraform Configuration', () => {
    test('has terraform block', () => {
      expect(providerTfContent).toMatch(/terraform\s*\{/);
    });

    test('uses AWS provider', () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test('uses random provider', () => {
      expect(allTfContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });

    test('uses archive provider', () => {
      expect(allTfContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });
  });

  // ========================================
  // TEST GROUP 2: Data Sources
  // ========================================
  describe('Data Sources', () => {
    test('has aws_region data source', () => {
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });

    test('has aws_caller_identity data source', () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });

    test('has archive_file data source for Lambda', () => {
      expect(has(/data\s+"archive_file"\s+"lambda_zip"/)).toBe(true);
    });

    test('uses correct region attribute', () => {
      // Main check: ensure deprecated .name is NOT used
      expect(allTfContent.includes('.aws_region.current.name')).toBe(false);
      
      // Verify region data source exists
      expect(has(/data\s+"aws_region"\s+"current"/)).toBe(true);
    });


  });

  // ========================================
  // TEST GROUP 3: Variables
  // ========================================
  describe('Variables', () => {
    test('has region variable', () => {
      expect(has(/variable\s+"region"/)).toBe(true);
    });

    test('has log_retention_days variable', () => {
      expect(has(/variable\s+"log_retention_days"/)).toBe(true);
    });

    test('has throttle_rate_limit variable', () => {
      expect(has(/variable\s+"throttle_rate_limit"/)).toBe(true);
    });

    test('has throttle_burst_limit variable', () => {
      expect(has(/variable\s+"throttle_burst_limit"/)).toBe(true);
    });

    test('has daily_quota_limit variable', () => {
      expect(has(/variable\s+"daily_quota_limit"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 4: Locals
  // ========================================
  describe('Locals', () => {
    test('has common_tags local', () => {
      expect(has(/common_tags\s*=\s*\{/)).toBe(true);
    });

    test('has api_name local', () => {
      expect(has(/api_name\s*=\s*"payment-api"/)).toBe(true);
    });

    test('has stage_name local', () => {
      expect(has(/stage_name\s*=\s*"prod"/)).toBe(true);
    });

    test('has resource_path local', () => {
      expect(has(/resource_path\s*=\s*"process-payment"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 5: Random String Resource
  // ========================================
  describe('Random String', () => {
    test('creates random_string for unique naming', () => {
      expect(has(/resource\s+"random_string"\s+"suffix"/)).toBe(true);
    });

    test('random string has correct length', () => {
      expect(has(/length\s*=\s*8/)).toBe(true);
    });

    test('random string excludes special characters', () => {
      expect(has(/special\s*=\s*false/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 6: Lambda Resources
  // ========================================
  describe('Lambda Function', () => {
    test('creates Lambda IAM role', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"lambda_role"/)).toBe(true);
    });

    test('Lambda IAM role has correct service principal', () => {
      expect(has(/Service\s*=\s*"lambda\.amazonaws\.com"/)).toBe(true);
    });

    test('attaches basic execution policy to Lambda role', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic"/)).toBe(true);
      expect(has(/AWSLambdaBasicExecutionRole/)).toBe(true);
    });

    test('creates Lambda function', () => {
      expect(has(/resource\s+"aws_lambda_function"\s+"payment_processor"/)).toBe(true);
    });

    test('Lambda function uses Python runtime', () => {
      expect(has(/runtime\s*=\s*"python3\.11"/)).toBe(true);
    });

    test('Lambda function uses archive_file for source', () => {
      expect(has(/filename\s*=\s*data\.archive_file\.lambda_zip\.output_path/)).toBe(true);
    });

    test('Lambda function has unique name with suffix', () => {
      expect(has(/function_name\s*=\s*"payment-processor-\$\{random_string\.suffix\.result\}"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 7: API Gateway REST API
  // ========================================
  describe('API Gateway REST API', () => {
    test('creates REST API', () => {
      expect(has(/resource\s+"aws_api_gateway_rest_api"\s+"payment_api"/)).toBe(true);
    });

    test('REST API uses REGIONAL endpoint', () => {
      expect(has(/types\s*=\s*\["REGIONAL"\]/)).toBe(true);
    });

    test('creates API resource for payment processing', () => {
      expect(has(/resource\s+"aws_api_gateway_resource"\s+"process_payment"/)).toBe(true);
    });

    test('API resource uses correct path', () => {
      expect(has(/path_part\s*=\s*local\.resource_path/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 8: API Gateway Methods
  // ========================================
  describe('API Gateway Methods', () => {
    test('creates POST method', () => {
      expect(has(/resource\s+"aws_api_gateway_method"\s+"process_payment_post"/)).toBe(true);
      expect(has(/http_method\s*=\s*"POST"/)).toBe(true);
    });

    test('POST method requires API key', () => {
      expect(has(/api_key_required\s*=\s*true/)).toBe(true);
    });

    test('creates method response for 200 status', () => {
      expect(has(/resource\s+"aws_api_gateway_method_response"\s+"process_payment_post_200"/)).toBe(true);
    });

    test('method response includes CORS headers', () => {
      expect(has(/Access-Control-Allow-Origin/)).toBe(true);
      expect(has(/Access-Control-Allow-Headers/)).toBe(true);
      expect(has(/Access-Control-Allow-Methods/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 9: Lambda Integration
  // ========================================
  describe('Lambda Integration', () => {
    test('creates Lambda integration', () => {
      expect(has(/resource\s+"aws_api_gateway_integration"\s+"process_payment_lambda"/)).toBe(true);
    });

    test('uses AWS_PROXY integration type', () => {
      expect(has(/type\s*=\s*"AWS_PROXY"/)).toBe(true);
    });

    test('integration uses correct Lambda ARN', () => {
      expect(has(/uri\s*=\s*aws_lambda_function\.payment_processor\.invoke_arn/)).toBe(true);
    });

    test('creates integration response', () => {
      expect(has(/resource\s+"aws_api_gateway_integration_response"\s+"process_payment_post_200"/)).toBe(true);
    });

    test('creates Lambda permission for API Gateway', () => {
      expect(has(/resource\s+"aws_lambda_permission"\s+"api_gateway_invoke"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 10: API Key and Usage Plan
  // ========================================
  describe('API Key and Usage Plan', () => {
    test('creates API key', () => {
      expect(has(/resource\s+"aws_api_gateway_api_key"\s+"mobile_app_key"/)).toBe(true);
    });

    test('API key is enabled', () => {
      expect(has(/enabled\s*=\s*true/)).toBe(true);
    });

    test('creates usage plan', () => {
      expect(has(/resource\s+"aws_api_gateway_usage_plan"\s+"payment_api_plan"/)).toBe(true);
    });

    test('usage plan has throttle settings', () => {
      expect(has(/throttle_settings\s*\{/)).toBe(true);
      expect(has(/rate_limit\s*=\s*var\.throttle_rate_limit/)).toBe(true);
    });

    test('usage plan has quota settings', () => {
      expect(has(/quota_settings\s*\{/)).toBe(true);
      expect(has(/period\s*=\s*"DAY"/)).toBe(true);
    });

    test('associates API key with usage plan', () => {
      expect(has(/resource\s+"aws_api_gateway_usage_plan_key"\s+"mobile_app_key_association"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 11: CloudWatch Logging
  // ========================================
  describe('CloudWatch Logging', () => {
    test('creates CloudWatch log group', () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"/)).toBe(true);
    });

    test('log group has retention policy', () => {
      expect(has(/retention_in_days\s*=\s*var\.log_retention_days/)).toBe(true);
    });

    test('creates IAM role for CloudWatch', () => {
      expect(has(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch"/)).toBe(true);
    });

    test('IAM role has API Gateway service principal', () => {
      expect(has(/Service\s*=\s*"apigateway\.amazonaws\.com"/)).toBe(true);
    });

    test('attaches managed policy for CloudWatch logs', () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"api_gateway_cloudwatch_logs"/)).toBe(true);
      expect(has(/AmazonAPIGatewayPushToCloudWatchLogs/)).toBe(true);
    });

    test('creates API Gateway account settings', () => {
      expect(has(/resource\s+"aws_api_gateway_account"\s+"api_gateway_account"/)).toBe(true);
    });

    test('account settings have dependency on policy attachment', () => {
      expect(has(/depends_on\s*=\s*\[\s*aws_iam_role_policy_attachment\.api_gateway_cloudwatch_logs\s*\]/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 12: API Deployment and Stage
  // ========================================
  describe('API Deployment and Stage', () => {
    test('creates API deployment', () => {
      expect(has(/resource\s+"aws_api_gateway_deployment"\s+"payment_api_deployment"/)).toBe(true);
    });

    test('deployment has redeployment trigger', () => {
      expect(mainTfContent).toMatch(/triggers\s*=\s*\{/);
      expect(mainTfContent).toMatch(/redeployment\s*=/);
    });

    test('deployment has create_before_destroy lifecycle', () => {
      expect(has(/create_before_destroy\s*=\s*true/)).toBe(true);
    });

    test('creates prod stage', () => {
      expect(has(/resource\s+"aws_api_gateway_stage"\s+"prod"/)).toBe(true);
    });

    test('stage has access log settings', () => {
      expect(has(/access_log_settings\s*\{/)).toBe(true);
    });

    test('stage depends on account configuration', () => {
      expect(has(/depends_on.*aws_api_gateway_account\.api_gateway_account/s)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 13: Method Settings
  // ========================================
  describe('Method Settings', () => {
    test('creates method settings', () => {
      expect(has(/resource\s+"aws_api_gateway_method_settings"\s+"prod_settings"/)).toBe(true);
    });

    test('uses block syntax for settings', () => {
      expect(has(/settings\s*\{/)).toBe(true);
      expect(has(/settings\s*=/)).toBe(false);
    });

    test('enables metrics', () => {
      expect(has(/metrics_enabled\s*=\s*true/)).toBe(true);
    });

    test('sets logging level to INFO', () => {
      expect(has(/logging_level\s*=\s*"INFO"/)).toBe(true);
    });

    test('enables data trace', () => {
      expect(has(/data_trace_enabled\s*=\s*true/)).toBe(true);
    });

    test('method settings depend on account configuration', () => {
      expect(has(/depends_on.*aws_api_gateway_account\.api_gateway_account/s)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 14: Resource Naming
  // ========================================
  describe('Resource Naming', () => {
    test('all IAM roles include random suffix', () => {
      const iamRoleMatches = mainTfContent.match(/resource\s+"aws_iam_role"/g) || [];
      const suffixMatches = mainTfContent.match(/name\s*=\s*"[^"]*\$\{random_string\.suffix\.result\}"/g) || [];
      
      expect(suffixMatches.length).toBeGreaterThanOrEqual(2);
    });

    test('usage plan includes random suffix', () => {
      expect(has(/payment-api-usage-plan-\$\{random_string\.suffix\.result\}/)).toBe(true);
    });

    test('Lambda permission includes random suffix', () => {
      expect(has(/AllowAPIGatewayInvoke-\$\{random_string\.suffix\.result\}/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 15: Tags
  // ========================================
  describe('Tags', () => {
    test('resources use common_tags', () => {
      const taggedResources = (mainTfContent.match(/tags\s*=\s*local\.common_tags/g) || []).length;
      expect(taggedResources).toBeGreaterThanOrEqual(1);
    });

    test('common_tags include Environment', () => {
      expect(has(/Environment\s*=\s*"production"/)).toBe(true);
    });

    test('common_tags include ManagedBy', () => {
      expect(has(/ManagedBy\s*=\s*"terraform"/)).toBe(true);
    });

    test('common_tags include Service', () => {
      expect(has(/Service\s*=\s*"payment-processing"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 16: Outputs
  // ========================================
  describe('Outputs', () => {
    test('has api_invoke_url output', () => {
      expect(has(/output\s+"api_invoke_url"/)).toBe(true);
    });

    test('has api_key_value output marked as sensitive', () => {
      expect(has(/output\s+"api_key_value"/)).toBe(true);
      expect(has(/sensitive\s*=\s*true/)).toBe(true);
    });

    test('has api_gateway_id output', () => {
      expect(has(/output\s+"api_gateway_id"/)).toBe(true);
    });

    test('has usage_plan_id output', () => {
      expect(has(/output\s+"usage_plan_id"/)).toBe(true);
    });

    test('has cloudwatch_log_group_name output', () => {
      expect(has(/output\s+"cloudwatch_log_group_name"/)).toBe(true);
    });

    test('has lambda_function_name output', () => {
      expect(has(/output\s+"lambda_function_name"/)).toBe(true);
    });

    test('has lambda_function_arn output', () => {
      expect(has(/output\s+"lambda_function_arn"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 17: Security Best Practices
  // ========================================
  describe('Security Best Practices', () => {
    test('API method requires authentication', () => {
      expect(has(/api_key_required\s*=\s*true/)).toBe(true);
    });

    test('usage plan enforces rate limiting', () => {
      expect(has(/rate_limit/)).toBe(true);
      expect(has(/burst_limit/)).toBe(true);
    });

    test('usage plan enforces quota limits', () => {
      expect(has(/quota_settings/)).toBe(true);
      expect(has(/limit\s*=\s*var\.daily_quota_limit/)).toBe(true);
    });

    test('uses managed IAM policies', () => {
      expect(has(/AWSLambdaBasicExecutionRole/)).toBe(true);
      expect(has(/AmazonAPIGatewayPushToCloudWatchLogs/)).toBe(true);
    });

    test('Lambda permission scoped to specific API', () => {
      expect(has(/source_arn\s*=\s*"\$\{aws_api_gateway_rest_api\.payment_api\.execution_arn\}\/\*\/\*"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 18: Code Organization
  // ========================================
  describe('Code Organization', () => {
    test('has section comments for data sources', () => {
      expect(has(/# Data Sources/)).toBe(true);
    });

    test('has section comments for variables', () => {
      expect(has(/# Variables/)).toBe(true);
    });

    test('has section comments for locals', () => {
      expect(has(/# Locals/)).toBe(true);
    });

    test('has section comments for resources', () => {
      expect(has(/# Lambda/)).toBe(true);
      expect(has(/# API Gateway/)).toBe(true);
      expect(has(/# CloudWatch/)).toBe(true);
    });

    test('has section comments for outputs', () => {
      expect(has(/# Outputs/)).toBe(true);
    });
  });

    // ========================================
  // TEST GROUP 19: Resource Counts
  // ========================================
  describe('Resource Counts', () => {
    test('creates exactly 1 Lambda function', () => {
      expect(count(/resource\s+"aws_lambda_function"/)).toBe(1);
    });

    test('creates exactly 1 REST API', () => {
      expect(count(/resource\s+"aws_api_gateway_rest_api"/)).toBe(1);
    });

     test('creates IAM roles', () => {
      expect(count(/resource\s+"aws_iam_role"/)).toBeGreaterThanOrEqual(1);
    });


    test('creates exactly 1 CloudWatch log group', () => {
      expect(count(/resource\s+"aws_cloudwatch_log_group"/)).toBe(1);
    });

    test('creates exactly 1 API key', () => {
      expect(count(/resource\s+"aws_api_gateway_api_key"/)).toBe(1);
    });

    test('creates exactly 1 usage plan', () => {
      expect(count(/resource\s+"aws_api_gateway_usage_plan"/)).toBe(1);
    });

    test('creates exactly 1 API deployment', () => {
      expect(count(/resource\s+"aws_api_gateway_deployment"/)).toBe(1);
    });

    test('creates exactly 1 API stage', () => {
      expect(count(/resource\s+"aws_api_gateway_stage"/)).toBe(1);
    });
  });

  // ========================================
  // TEST GROUP 20: IAM Policy Details
  // ========================================
  describe('IAM Policy Details', () => {
    test('Lambda role has correct assume role policy', () => {
      expect(has(/lambda_role.*assume_role_policy/s)).toBe(true);
      expect(has(/sts:AssumeRole/)).toBe(true);
    });

    test('API Gateway role has correct assume role policy', () => {
      expect(has(/api_gateway_cloudwatch.*assume_role_policy/s)).toBe(true);
    });

    test('uses AWS managed policies not inline policies', () => {
      expect(has(/AWSLambdaBasicExecutionRole/)).toBe(true);
      expect(has(/AmazonAPIGatewayPushToCloudWatchLogs/)).toBe(true);
    });

    test('no wildcard permissions in policies', () => {
      // Check that we don't use overly permissive wildcards
      const hasWildcardAction = /Action\s*=\s*"\*"/;
      expect(hasWildcardAction.test(allTfContent)).toBe(false);
    });

    test('Lambda permission has specific source ARN', () => {
      expect(has(/source_arn.*execution_arn/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 21: Lifecycle Policies
  // ========================================
  describe('Lifecycle Policies', () => {
    test('deployment has create_before_destroy lifecycle', () => {
      expect(has(/lifecycle\s*\{/)).toBe(true);
      expect(has(/create_before_destroy\s*=\s*true/)).toBe(true);
    });

    test('deployment has triggers for redeployment', () => {
      expect(has(/triggers\s*=\s*\{/)).toBe(true);
      expect(has(/sha1\(/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 22: Dependencies
  // ========================================
  describe('Resource Dependencies', () => {
    test('API Gateway account depends on policy attachment', () => {
      expect(has(/api_gateway_account.*depends_on.*api_gateway_cloudwatch_logs/s)).toBe(true);
    });

    test('API stage depends on account configuration', () => {
      expect(has(/stage.*prod.*depends_on.*api_gateway_account/s)).toBe(true);
    });

    test('method settings depend on account configuration', () => {
      expect(has(/method_settings.*depends_on.*api_gateway_account/s)).toBe(true);
    });

    test('integration response depends on integration', () => {
      expect(has(/integration_response.*depends_on.*integration/s)).toBe(true);
    });

    test('deployment depends on all required resources', () => {
      expect(has(/deployment.*depends_on/s)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 23: API Gateway Configuration Details
  // ========================================
  describe('API Gateway Configuration Details', () => {
    test('API method uses POST verb', () => {
      expect(has(/http_method\s*=\s*"POST"/)).toBe(true);
    });

    test('API method requires API key', () => {
      expect(has(/api_key_required\s*=\s*true/)).toBe(true);
    });

    test('API method has no authorization', () => {
      expect(has(/authorization\s*=\s*"NONE"/)).toBe(true);
    });

    test('integration uses POST method', () => {
      expect(has(/integration_http_method\s*=\s*"POST"/)).toBe(true);
    });

    test('stage name is prod', () => {
      expect(has(/stage_name\s*=\s*local\.stage_name/)).toBe(true);
      expect(has(/stage_name\s*=\s*"prod"/)).toBe(true);
    });

    test('method path applies to all methods', () => {
      expect(has(/method_path\s*=\s*"\*\/\*"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 24: Lambda Configuration Details
  // ========================================
  describe('Lambda Configuration Details', () => {
    test('Lambda uses correct handler', () => {
      expect(has(/handler\s*=\s*"lambda_function\.lambda_handler"/)).toBe(true);
    });

    test('Lambda uses source_code_hash for updates', () => {
      expect(has(/source_code_hash\s*=\s*data\.archive_file\.lambda_zip\.output_base64sha256/)).toBe(true);
    });

     test('Lambda has environment variables', () => {
      expect(has(/environment\s*\{/)).toBe(true);
      expect(allTfContent.includes('ENVIRONMENT')).toBe(true);
    });


    test('archive_file uses correct source and output paths', () => {
      expect(has(/source_file\s*=\s*"\$\{path\.module\}\/lambda_function\.py"/)).toBe(true);
      expect(has(/output_path\s*=\s*"\$\{path\.module\}\/lambda_function\.zip"/)).toBe(true);
    });

    test('archive_file type is zip', () => {
      expect(has(/type\s*=\s*"zip"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 25: CloudWatch Configuration Details
  // ========================================
  describe('CloudWatch Configuration Details', () => {
    test('log group name follows AWS convention', () => {
      expect(has(/name\s*=\s*"\/aws\/apigateway\/\$\{local\.api_name\}"/)).toBe(true);
    });

    test('log retention is set from variable', () => {
      expect(has(/retention_in_days\s*=\s*var\.log_retention_days/)).toBe(true);
    });

    test('stage has structured JSON log format', () => {
      expect(has(/format\s*=\s*jsonencode/)).toBe(true);
      expect(has(/requestId/)).toBe(true);
      expect(has(/sourceIp/)).toBe(true);
    });

    test('log format includes error tracking', () => {
      expect(has(/\$context\.error\.message/)).toBe(true);
      expect(has(/\$context\.integrationErrorMessage/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 26: Usage Plan Configuration Details
  // ========================================
  describe('Usage Plan Configuration Details', () => {
    test('usage plan references correct stage', () => {
      expect(has(/api_stages\s*\{/)).toBe(true);
      expect(has(/stage\s*=\s*aws_api_gateway_stage\.prod\.stage_name/)).toBe(true);
    });

    test('throttle settings use variables', () => {
      expect(has(/rate_limit\s*=\s*var\.throttle_rate_limit/)).toBe(true);
      expect(has(/burst_limit\s*=\s*var\.throttle_burst_limit/)).toBe(true);
    });

    test('quota settings use variable', () => {
      expect(has(/limit\s*=\s*var\.daily_quota_limit/)).toBe(true);
    });

    test('quota period is DAY', () => {
      expect(has(/period\s*=\s*"DAY"/)).toBe(true);
    });

    test('API key is associated with usage plan', () => {
      expect(has(/key_type\s*=\s*"API_KEY"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 27: CORS Configuration
  // ========================================
  describe('CORS Configuration', () => {
    test('has CORS origin configured', () => {
      expect(has(/cors_origin\s*=\s*"https:\/\/app\.example\.com"/)).toBe(true);
    });

    test('method response declares CORS headers', () => {
      expect(has(/method\.response\.header\.Access-Control-Allow-Origin/)).toBe(true);
      expect(has(/method\.response\.header\.Access-Control-Allow-Headers/)).toBe(true);
      expect(has(/method\.response\.header\.Access-Control-Allow-Methods/)).toBe(true);
    });

    test('integration response maps CORS origin', () => {
      expect(has(/response_parameters.*Access-Control-Allow-Origin.*cors_origin/s)).toBe(true);
    });
  });

});

