// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests Terraform configuration structure, resources, and security practices

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const HANDLER_REL = "../lib/handler.py";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const handlerPath = path.resolve(__dirname, HANDLER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let handlerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    handlerContent = fs.readFileSync(handlerPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("handler.py exists", () => {
      expect(fs.existsSync(handlerPath)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf specifies minimum Terraform version", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.[0-9]+\.[0-9]+"/);
    });

    test("provider.tf specifies AWS provider version constraint", () => {
      expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable with default", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares lambda configuration variables", () => {
      expect(stackContent).toMatch(/variable\s+"lambda_memory_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"lambda_timeout"\s*{/);
    });

    test("has reasonable default values for lambda config", () => {
      expect(stackContent).toMatch(/default\s*=\s*256/);
      expect(stackContent).toMatch(/default\s*=\s*20/);
    });
  });

  describe("Data Sources", () => {
    test("uses AWS caller identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses AWS partition data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });

    test("uses AWS region data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("uses archive_file data source for Lambda zip", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"zip"/);
      expect(stackContent).toMatch(/source_file\s*=\s*"\${path\.module}\/handler\.py"/);
    });
  });

  describe("Local Values", () => {
    test("defines consistent name_prefix local", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"serverless-api-\${var\.environment}-\${var\.environment_suffix}"/);
    });

    test("defines common_tags local with required tags", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*merge/);
      expect(stackContent).toMatch(/Project\s*=\s*"serverless-api"/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe("Secrets Manager Resources", () => {
    test("creates Secrets Manager secret", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"config"/);
    });

    test("sets recovery window for secret", () => {
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test("creates secret version with valid JSON", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"config"/);
      expect(stackContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });

    test("secret references use consistent naming", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.name_prefix}-config"/);
    });
  });

  describe("IAM Resources - Lambda Role", () => {
    test("creates Lambda execution role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    });

    test("Lambda role has correct assume role policy", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
      expect(stackContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test("attaches basic Lambda execution policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic"/);
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/AWSLambdaBasicExecutionRole/);
    });

    test("creates least-privilege secrets policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_secrets_read"/);
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/Resource\s*=\s*aws_secretsmanager_secret\.config\.arn/);
    });
  });

  describe("IAM Resources - API Gateway Role", () => {
    test("creates API Gateway CloudWatch logs role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"apigw_logs_role"/);
    });

    test("API Gateway role has correct assume role policy", () => {
      expect(stackContent).toMatch(/Service\s*=\s*"apigateway\.amazonaws\.com"/);
    });

    test("attaches CloudWatch logs policy to API Gateway role", () => {
      expect(stackContent).toMatch(/AmazonAPIGatewayPushToCloudWatchLogs/);
    });

    test("configures API Gateway account with CloudWatch role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_account"\s+"account"/);
      expect(stackContent).toMatch(/cloudwatch_role_arn\s*=\s*aws_iam_role\.apigw_logs_role\.arn/);
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("creates Lambda log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\${local\.name_prefix}-fn"/);
    });

    test("creates API Gateway access log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"apigw_access"/);
      expect(stackContent).toMatch(/"\/aws\/apigw\/\${local\.name_prefix}-\${var\.environment}"/);
    });

    test("sets log retention policy", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("supports optional KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*var\.kms_key_arn\s*!=\s*""\s*\?\s*var\.kms_key_arn\s*:\s*null/);
    });
  });

  describe("Lambda Function", () => {
    test("creates Lambda function resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"fn"/);
    });

    test("uses consistent function naming", () => {
      expect(stackContent).toMatch(/function_name\s*=\s*"\${local\.name_prefix}-fn"/);
    });

    test("configures Python runtime", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.12"/);
    });

    test("sets handler correctly", () => {
      expect(stackContent).toMatch(/handler\s*=\s*"handler\.lambda_handler"/);
    });

    test("uses IAM role reference", () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_role\.arn/);
    });

    test("configures environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{/);
      expect(stackContent).toMatch(/SECRET_ARN\s*=\s*aws_secretsmanager_secret\.config\.arn/);
      expect(stackContent).toMatch(/APP_ENV\s*=\s*var\.environment/);
    });

    test("depends on log group", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda\]/);
    });
  });

  describe("API Gateway Resources", () => {
    test("creates REST API", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"api"/);
      expect(stackContent).toMatch(/endpoint_configuration\s*{\s*types\s*=\s*\["REGIONAL"\]/);
    });

    test("creates invoke resource path", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"invoke"/);
      expect(stackContent).toMatch(/path_part\s*=\s*"invoke"/);
    });

    test("creates ANY method with IAM authorization", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"any"/);
      expect(stackContent).toMatch(/http_method\s*=\s*"ANY"/);
      expect(stackContent).toMatch(/authorization\s*=\s*"AWS_IAM"/);
    });

    test("configures Lambda proxy integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
    });

    test("creates deployment with proper dependencies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"deploy"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_api_gateway_integration\.lambda\]/);
    });

    test("creates stage with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"stage"/);
      expect(stackContent).toMatch(/access_log_settings\s*{/);
    });
  });

  describe("Lambda Permissions", () => {
    test("grants API Gateway permission to invoke Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"apigw"/);
      expect(stackContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(stackContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
      expect(stackContent).toMatch(/source_arn\s*=\s*"\${aws_api_gateway_rest_api\.api\.execution_arn}\/\*\/\*"/);
    });
  });

  describe("Output Values", () => {
    test("outputs API Gateway URL", () => {
      expect(stackContent).toMatch(/output\s+"api_gateway_url"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*"\${aws_api_gateway_stage\.stage\.invoke_url}\/invoke"/);
    });

    test("outputs Lambda function details", () => {
      expect(stackContent).toMatch(/output\s+"lambda_function_name"/);
      expect(stackContent).toMatch(/output\s+"lambda_function_arn"/);
    });

    test("outputs secret ARN (without values)", () => {
      expect(stackContent).toMatch(/output\s+"secret_arn"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_secretsmanager_secret\.config\.arn/);
    });

    test("outputs log group names", () => {
      expect(stackContent).toMatch(/output\s+"log_group_lambda"/);
    });

    test("outputs computed name prefix", () => {
      expect(stackContent).toMatch(/output\s+"name_prefix"/);
      expect(stackContent).toMatch(/value\s*=\s*local\.name_prefix/);
    });
  });

  describe("Python Lambda Handler", () => {
    test("imports required modules", () => {
      expect(handlerContent).toMatch(/import\s+(json|.*json.*)/);
      expect(handlerContent).toMatch(/(import.*os|os.*import)/);
      expect(handlerContent).toMatch(/(import.*boto3|boto3.*import)/);
      expect(handlerContent).toMatch(/from\s+botocore\.exceptions\s+import\s+ClientError/);
    });

    test("initializes secrets manager client", () => {
      expect(handlerContent).toMatch(/secrets\s*=\s*boto3\.client\("secretsmanager"\)/);
    });

    test("defines lambda_handler function", () => {
      expect(handlerContent).toMatch(/def\s+lambda_handler\(event,\s*context\):/);
    });

    test("retrieves secret ARN from environment", () => {
      expect(handlerContent).toMatch(/secret_arn\s*=\s*os\.environ\.get\("SECRET_ARN"\)/);
    });

    test("handles ClientError exceptions", () => {
      expect(handlerContent).toMatch(/except\s+ClientError\s+as\s+e:/);
    });

    test("returns properly formatted API Gateway response", () => {
      expect(handlerContent).toMatch(/"statusCode":\s*200/);
      expect(handlerContent).toMatch(/"body":\s*json\.dumps/);
      expect(handlerContent).toMatch(/"headers":\s*{"Content-Type":\s*"application\/json"}/);
    });

    test("returns secret keys without exposing values", () => {
      expect(handlerContent).toMatch(/"secret_keys":\s*list\(secret_data\.keys\(\)\)/);
    });
  });

  describe("Security Best Practices", () => {
    test("uses least privilege IAM policies", () => {
      const secretsPolicyMatch = stackContent.match(/Resource\s*=\s*aws_secretsmanager_secret\.config\.arn/);
      expect(secretsPolicyMatch).toBeTruthy();
    });

    test("enables IAM authentication on API Gateway", () => {
      expect(stackContent).toMatch(/authorization\s*=\s*"AWS_IAM"/);
    });

    test("applies consistent tagging for resource management", () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
    });

    test("supports optional KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_arn\s*!=\s*""\s*\?\s*var\.kms_key_arn\s*:\s*null/);
    });

    test("uses recovery window for secret deletion", () => {
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });
  });

  describe("Naming Consistency", () => {
    test("all resources use name_prefix local for consistency", () => {
      const prefixUsages = (stackContent.match(/\${local\.name_prefix}/g) || []).length;
      expect(prefixUsages).toBeGreaterThanOrEqual(5);
    });

    test("environment_suffix is properly integrated", () => {
      expect(stackContent).toMatch(/\${var\.environment_suffix}/);
    });
  });
});