// Unit tests for Terraform HCL configuration files
// Tests configuration structure, resource definitions, and variable usage

import fs from 'fs';
import path from 'path';
import * as hcl from 'hcl2-parser';

const libPath = path.resolve(__dirname, '../lib');

describe('Terraform Currency Exchange API - Unit Tests', () => {
  describe('File Structure', () => {
    test('provider.tf exists', () => {
      const filePath = path.join(libPath, 'provider.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('variables.tf exists', () => {
      const filePath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('main.tf exists', () => {
      const filePath = path.join(libPath, 'main.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const filePath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('terraform.tfvars exists', () => {
      const filePath = path.join(libPath, 'terraform.tfvars');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'provider.tf');
      providerContent = fs.readFileSync(filePath, 'utf8');
    });

    test('declares Terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test('declares AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('declares random provider', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });

    test('declares archive provider', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });

    test('configures AWS provider with region variable', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('configures default tags', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*"production"/);
      expect(providerContent).toMatch(/Service\s*=\s*"currency-api"/);
      expect(providerContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe('Variable Definitions', () => {
    let variablesContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'variables.tf');
      variablesContent = fs.readFileSync(filePath, 'utf8');
    });

    test('declares aws_region variable with default', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('declares environmentSuffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environmentSuffix"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*string/);
    });

    test('declares lambda configuration variables', () => {
      expect(variablesContent).toMatch(/variable\s+"lambda_memory_size"/);
      expect(variablesContent).toMatch(/variable\s+"lambda_timeout"/);
      expect(variablesContent).toMatch(/default\s*=\s*1024/);
      expect(variablesContent).toMatch(/default\s*=\s*10/);
    });

    test('declares API Gateway throttle variables', () => {
      expect(variablesContent).toMatch(/variable\s+"api_throttle_rate_limit"/);
      expect(variablesContent).toMatch(/variable\s+"api_throttle_burst_limit"/);
    });

    test('declares API version and rate precision variables', () => {
      expect(variablesContent).toMatch(/variable\s+"api_version"/);
      expect(variablesContent).toMatch(/variable\s+"rate_precision"/);
    });

    test('declares CORS allowed origins variable', () => {
      expect(variablesContent).toMatch(/variable\s+"cors_allowed_origins"/);
    });

    test('declares log retention variable', () => {
      expect(variablesContent).toMatch(/variable\s+"log_retention_days"/);
    });

    test('declares tagging variables', () => {
      expect(variablesContent).toMatch(/variable\s+"repository"/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"/);
      expect(variablesContent).toMatch(/variable\s+"team"/);
    });
  });

  describe('Main Infrastructure Resources', () => {
    let mainContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(filePath, 'utf8');
    });

    test('defines local variable env_suffix', () => {
      expect(mainContent).toMatch(/locals\s*{/);
      expect(mainContent).toMatch(/env_suffix\s*=\s*coalesce/);
    });

    test('defines random_id resource for Lambda suffix', () => {
      expect(mainContent).toMatch(/resource\s+"random_id"\s+"lambda_suffix"/);
      expect(mainContent).toMatch(/byte_length\s*=\s*4/);
    });

    test('defines Lambda function code as local_file', () => {
      expect(mainContent).toMatch(/resource\s+"local_file"\s+"lambda_code"/);
      expect(mainContent).toMatch(/exports\.handler\s*=\s*async/);
      expect(mainContent).toMatch(/lambda_function_payload\/index\.js/);
    });

    test('defines archive_file data source for Lambda deployment', () => {
      expect(mainContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
      expect(mainContent).toMatch(/type\s*=\s*"zip"/);
      expect(mainContent).toMatch(/source_dir\s*=.*lambda_function_payload/);
    });

    test('defines Lambda CloudWatch log group with retention', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
      expect(mainContent).toMatch(/name\s*=.*\/aws\/lambda\/currency-converter/);
      expect(mainContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test('defines Lambda execution IAM role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
      expect(mainContent).toMatch(/name\s*=.*currency-converter-lambda-role/);
      expect(mainContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test('uses AWS managed policies for Lambda', () => {
      expect(mainContent).toMatch(/data\s+"aws_iam_policy"\s+"lambda_basic_execution"/);
      expect(mainContent).toMatch(/AWSLambdaBasicExecutionRole/);
      expect(mainContent).toMatch(/data\s+"aws_iam_policy"\s+"xray_write"/);
      expect(mainContent).toMatch(/AWSXRayDaemonWriteAccess/);
    });

    test('attaches managed policies to Lambda role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_logs"/);
      expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_xray"/);
    });

    test('defines Lambda function with correct configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"currency_converter"/);
      expect(mainContent).toMatch(/function_name\s*=.*currency-converter.*env_suffix/);
      expect(mainContent).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
      expect(mainContent).toMatch(/handler\s*=\s*"index\.handler"/);
      expect(mainContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
      expect(mainContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test('Lambda function has environment variables', () => {
      expect(mainContent).toMatch(/environment\s*{/);
      expect(mainContent).toMatch(/API_VERSION\s*=\s*var\.api_version/);
      expect(mainContent).toMatch(/RATE_PRECISION/);
    });

    test('Lambda function has X-Ray tracing enabled', () => {
      expect(mainContent).toMatch(/tracing_config\s*{/);
      expect(mainContent).toMatch(/mode\s*=\s*"Active"/);
    });

    test('Lambda function has proper dependencies', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[/);
      expect(mainContent).toMatch(/aws_cloudwatch_log_group\.lambda_logs/);
      expect(mainContent).toMatch(/aws_iam_role_policy_attachment\.lambda_logs/);
      expect(mainContent).toMatch(/aws_iam_role_policy_attachment\.lambda_xray/);
    });

    test('defines API Gateway REST API', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"currency_api"/);
      expect(mainContent).toMatch(/name\s*=.*currency-exchange-api.*env_suffix/);
      expect(mainContent).toMatch(/description\s*=\s*"Serverless currency exchange rate API"/);
    });

    test('API Gateway has EDGE endpoint configuration', () => {
      expect(mainContent).toMatch(/endpoint_configuration\s*{/);
      expect(mainContent).toMatch(/types\s*=\s*\["EDGE"\]/);
    });

    test('defines API Gateway /convert resource', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"convert"/);
      expect(mainContent).toMatch(/path_part\s*=\s*"convert"/);
      expect(mainContent).toMatch(/rest_api_id\s*=\s*aws_api_gateway_rest_api\.currency_api\.id/);
    });

    test('defines POST method with API key requirement', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"convert_post"/);
      expect(mainContent).toMatch(/http_method\s*=\s*"POST"/);
      expect(mainContent).toMatch(/api_key_required\s*=\s*true/);
    });

    test('defines OPTIONS method for CORS', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"convert_options"/);
      expect(mainContent).toMatch(/http_method\s*=\s*"OPTIONS"/);
    });

    test('defines Lambda proxy integration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda_integration"/);
      expect(mainContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(mainContent).toMatch(/integration_http_method\s*=\s*"POST"/);
      expect(mainContent).toMatch(/uri\s*=\s*aws_lambda_function\.currency_converter\.invoke_arn/);
    });

    test('defines CORS OPTIONS integration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"options_integration"/);
      expect(mainContent).toMatch(/type\s*=\s*"MOCK"/);
    });

    test('defines CORS response headers', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_integration_response"\s+"options_integration_response"/);
      expect(mainContent).toMatch(/Access-Control-Allow-Origin/);
      expect(mainContent).toMatch(/Access-Control-Allow-Methods/);
      expect(mainContent).toMatch(/Access-Control-Allow-Headers/);
    });

    test('defines Lambda permission for API Gateway', () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"/);
      expect(mainContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(mainContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });

    test('defines API Gateway deployment with triggers', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"api_deployment"/);
      expect(mainContent).toMatch(/triggers\s*=\s*{/);
      expect(mainContent).toMatch(/redeployment\s*=\s*sha1/);
    });

    test('defines API Gateway stage v1 with X-Ray tracing', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"v1"/);
      expect(mainContent).toMatch(/stage_name\s*=\s*"v1"/);
      expect(mainContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test('API Gateway stage has stage variables', () => {
      expect(mainContent).toMatch(/variables\s*=\s*{/);
      expect(mainContent).toMatch(/lambdaAlias\s*=\s*"production"/);
    });

    test('defines API Gateway CloudWatch log group', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"/);
      expect(mainContent).toMatch(/name\s*=.*\/aws\/apigateway\/currency-api/);
    });

    test('defines API Gateway CloudWatch IAM role', () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch"/);
      expect(mainContent).toMatch(/Service\s*=\s*"apigateway\.amazonaws\.com"/);
    });

    test('uses AWS managed policy for API Gateway logging', () => {
      expect(mainContent).toMatch(/data\s+"aws_iam_policy"\s+"api_gateway_push_logs"/);
      expect(mainContent).toMatch(/AmazonAPIGatewayPushToCloudWatchLogs/);
    });

    test('defines API Gateway account configuration', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_account"\s+"api_gateway_account"/);
      expect(mainContent).toMatch(/cloudwatch_role_arn\s*=\s*aws_iam_role\.api_gateway_cloudwatch\.arn/);
    });

    test('defines API Gateway method settings with throttling', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_method_settings"\s+"all"/);
      expect(mainContent).toMatch(/logging_level\s*=\s*"INFO"/);
      expect(mainContent).toMatch(/data_trace_enabled\s*=\s*true/);
      expect(mainContent).toMatch(/throttling_rate_limit\s*=\s*var\.api_throttle_rate_limit/);
      expect(mainContent).toMatch(/throttling_burst_limit\s*=\s*var\.api_throttle_burst_limit/);
    });

    test('defines API key', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_api_key"\s+"currency_api_key"/);
      expect(mainContent).toMatch(/name\s*=.*currency-api-key.*env_suffix/);
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });

    test('defines usage plan with quota and throttling', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_usage_plan"\s+"currency_usage_plan"/);
      expect(mainContent).toMatch(/quota_settings\s*{/);
      expect(mainContent).toMatch(/limit\s*=\s*300000/);
      expect(mainContent).toMatch(/period\s*=\s*"MONTH"/);
      expect(mainContent).toMatch(/throttle_settings\s*{/);
    });

    test('associates API key with usage plan', () => {
      expect(mainContent).toMatch(/resource\s+"aws_api_gateway_usage_plan_key"\s+"currency_usage_plan_key"/);
      expect(mainContent).toMatch(/key_type\s*=\s*"API_KEY"/);
    });
  });

  describe('Outputs', () => {
    let outputsContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'outputs.tf');
      outputsContent = fs.readFileSync(filePath, 'utf8');
    });

    test('defines api_invoke_url output', () => {
      expect(outputsContent).toMatch(/output\s+"api_invoke_url"\s*{/);
      expect(outputsContent).toMatch(/aws_api_gateway_stage\.v1\.invoke_url/);
    });

    test('defines api_key output as sensitive', () => {
      expect(outputsContent).toMatch(/output\s+"api_key"\s*{/);
      expect(outputsContent).toMatch(/sensitive\s*=\s*true/);
      expect(outputsContent).toMatch(/aws_api_gateway_api_key\.currency_api_key\.value/);
    });

    test('defines lambda_function_name output', () => {
      expect(outputsContent).toMatch(/output\s+"lambda_function_name"\s*{/);
      expect(outputsContent).toMatch(/aws_lambda_function\.currency_converter\.function_name/);
    });

    test('defines lambda_function_arn output', () => {
      expect(outputsContent).toMatch(/output\s+"lambda_function_arn"\s*{/);
      expect(outputsContent).toMatch(/aws_lambda_function\.currency_converter\.arn/);
    });

    test('defines api_gateway_id output', () => {
      expect(outputsContent).toMatch(/output\s+"api_gateway_id"\s*{/);
      expect(outputsContent).toMatch(/aws_api_gateway_rest_api\.currency_api\.id/);
    });

    test('defines cloudwatch_log_group_lambda output', () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_log_group_lambda"\s*{/);
      expect(outputsContent).toMatch(/aws_cloudwatch_log_group\.lambda_logs\.name/);
    });

    test('defines cloudwatch_log_group_api output', () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_log_group_api"\s*{/);
      expect(outputsContent).toMatch(/aws_cloudwatch_log_group\.api_gateway_logs\.name/);
    });
  });

  describe('environmentSuffix Usage', () => {
    let mainContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(filePath, 'utf8');
    });

    test('Lambda function name includes env_suffix', () => {
      expect(mainContent).toMatch(/function_name\s*=.*\$\{local\.env_suffix\}/);
    });

    test('IAM role names include env_suffix', () => {
      expect(mainContent).toMatch(/name\s*=.*lambda-role-\$\{local\.env_suffix\}/);
      expect(mainContent).toMatch(/name\s*=.*gateway-cloudwatch-\$\{local\.env_suffix\}/);
    });

    test('CloudWatch log group names include env_suffix', () => {
      expect(mainContent).toMatch(/name\s*=.*\$\{local\.env_suffix\}/);
    });

    test('API Gateway name includes env_suffix', () => {
      expect(mainContent).toMatch(/name\s*=.*currency-exchange-api-\$\{local\.env_suffix\}/);
    });

    test('API key name includes env_suffix', () => {
      expect(mainContent).toMatch(/name\s*=.*currency-api-key-\$\{local\.env_suffix\}/);
    });

    test('Usage plan name includes env_suffix', () => {
      expect(mainContent).toMatch(/name\s*=.*currency-api-usage-plan-\$\{local\.env_suffix\}/);
    });
  });

  describe('Lambda Function Code', () => {
    let mainContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(filePath, 'utf8');
    });

    test('Lambda code handles event properly', () => {
      expect(mainContent).toMatch(/exports\.handler\s*=\s*async\s*\(event\)/);
      expect(mainContent).toMatch(/JSON\.parse\(event\.body/);
    });

    test('Lambda code validates required parameters', () => {
      expect(mainContent).toMatch(/fromCurrency.*toCurrency.*amount/);
      expect(mainContent).toMatch(/Missing required parameters/);
    });

    test('Lambda code has exchange rates data', () => {
      expect(mainContent).toMatch(/exchangeRates\s*=\s*{/);
      expect(mainContent).toMatch(/'USD'/);
      expect(mainContent).toMatch(/'EUR'/);
      expect(mainContent).toMatch(/'GBP'/);
    });

    test('Lambda code performs currency conversion', () => {
      expect(mainContent).toMatch(/convertedAmount\s*=.*\.toFixed\(ratePrecision\)/);
    });

    test('Lambda code returns proper response structure', () => {
      expect(mainContent).toMatch(/statusCode:\s*200/);
      expect(mainContent).toMatch(/Content-Type.*application\/json/);
      expect(mainContent).toMatch(/Access-Control-Allow-Origin/);
    });

    test('Lambda code has error handling', () => {
      expect(mainContent).toMatch(/try\s*{/);
      expect(mainContent).toMatch(/catch\s*\(error\)/);
      expect(mainContent).toMatch(/statusCode:\s*500/);
      expect(mainContent).toMatch(/Internal server error/);
    });
  });

  describe('Resource Tags', () => {
    let mainContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(filePath, 'utf8');
    });

    test('resources have Name tags with env_suffix', () => {
      const nameTagMatches = mainContent.match(/tags\s*=\s*{\s*Name\s*=/g);
      expect(nameTagMatches).toBeTruthy();
      expect(nameTagMatches!.length).toBeGreaterThan(5);
    });
  });

  describe('Security Best Practices', () => {
    let mainContent: string;

    beforeAll(() => {
      const filePath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(filePath, 'utf8');
    });

    test('uses AWS managed policies instead of inline policies', () => {
      expect(mainContent).toMatch(/data\s+"aws_iam_policy"/);
      expect(mainContent).toMatch(/arn\s*=\s*"arn:aws:iam::aws:policy/);
    });

    test('Lambda function has proper IAM role', () => {
      expect(mainContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution\.arn/);
    });

    test('API method requires API key', () => {
      expect(mainContent).toMatch(/api_key_required\s*=\s*true/);
    });

    test('no hardcoded secrets or credentials', () => {
      expect(mainContent).not.toMatch(/password|secret|key\s*=\s*"[^$]/i);
    });
  });
});
