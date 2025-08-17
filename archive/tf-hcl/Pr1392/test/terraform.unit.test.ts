import fs from "fs";
import path from "path";

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let handlerContent: string;

  beforeAll(() => {
    const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
    const providerPath = path.resolve(__dirname, "../lib/provider.tf");
    const handlerPath = path.resolve(__dirname, "../lib/handler.py");
    
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    handlerContent = fs.readFileSync(handlerPath, "utf8");
  });

  describe("Core Configuration", () => {
    test("all required files exist", () => {
      expect(fs.existsSync(path.resolve(__dirname, "../lib/tap_stack.tf"))).toBe(true);
      expect(fs.existsSync(path.resolve(__dirname, "../lib/provider.tf"))).toBe(true);
      expect(fs.existsSync(path.resolve(__dirname, "../lib/handler.py"))).toBe(true);
    });

    test("provider configuration is valid", () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.\d+\.\d+"/);
    });

    test("environment_suffix variable is properly declared", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"/);
      expect(stackContent).toMatch(/description.*suffix.*collision/i);
    });
  });

  describe("Resource Naming with ENVIRONMENT_SUFFIX", () => {
    test("name_prefix local uses environment_suffix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"serverless-api-\${var\.environment}-\${var\.environment_suffix}"/);
    });

    test("all AWS resources use name_prefix for consistency", () => {
      // Count occurrences of name_prefix usage
      const nameUsages = (stackContent.match(/\${local\.name_prefix}/g) || []).length;
      expect(nameUsages).toBeGreaterThanOrEqual(5); // Lambda, API GW, secrets, etc.
    });

    test("Lambda function uses consistent naming", () => {
      expect(stackContent).toMatch(/function_name\s*=\s*"\${local\.name_prefix}-fn"/);
    });

    test("Secrets Manager uses consistent naming", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.name_prefix}-config"/);
    });

    test("log groups use consistent naming pattern", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\${local\.name_prefix}-fn"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/apigw\/\${local\.name_prefix}/);
    });
  });

  describe("AWS Lambda Configuration", () => {
    test("Lambda function is properly configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"fn"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.12"/);
      expect(stackContent).toMatch(/handler\s*=\s*"handler\.lambda_handler"/);
    });

    test("Lambda has required environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{/);
      expect(stackContent).toMatch(/SECRET_ARN/);
      expect(stackContent).toMatch(/APP_ENV/);
    });

    test("Lambda uses proper IAM role", () => {
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_role\.arn/);
    });

    test("Lambda handler code is valid Python", () => {
      expect(handlerContent).toMatch(/def\s+lambda_handler\(event,\s*context\):/);
      expect(handlerContent).toMatch(/import.*json/);
      expect(handlerContent).toMatch(/import.*os/);
      expect(handlerContent).toMatch(/import.*boto3/);
    });
  });

  describe("API Gateway Configuration", () => {
    test("API Gateway REST API is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"api"/);
      expect(stackContent).toMatch(/name\s*=\s*local\.name_prefix/);
    });

    test("API Gateway uses IAM authentication", () => {
      expect(stackContent).toMatch(/authorization\s*=\s*"AWS_IAM"/);
    });

    test("API Gateway integration is configured correctly", () => {
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
    });

    test("Lambda permission allows API Gateway invocation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"apigw"/);
      expect(stackContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  describe("IAM Security Configuration", () => {
    test("Lambda execution role has correct assume role policy", () => {
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
      expect(stackContent).toMatch(/Action\s*=\s*"sts:AssumeRole"/);
    });

    test("Lambda has minimal required permissions for secrets", () => {
      expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
      expect(stackContent).toMatch(/Resource\s*=\s*aws_secretsmanager_secret\.config\.arn/);
    });

    test("API Gateway has CloudWatch logs role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"apigw_logs_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  describe("Secrets Manager Configuration", () => {
    test("secrets manager secret is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"config"/);
      expect(stackContent).toMatch(/recovery_window_in_days\s*=\s*7/);
    });

    test("secret version contains valid JSON structure", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"config"/);
      expect(stackContent).toMatch(/secret_string\s*=\s*jsonencode/);
    });
  });

  describe("CloudWatch Configuration", () => {
    test("Lambda log group is configured with retention", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("API Gateway access logs are configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"apigw_access"/);
    });

    test("optional KMS encryption is supported", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*var\.kms_key_arn\s*!=\s*""\s*\?\s*var\.kms_key_arn\s*:\s*null/);
    });
  });

  describe("Output Values", () => {
    test("all required outputs are defined", () => {
      expect(stackContent).toMatch(/output\s+"api_gateway_url"/);
      expect(stackContent).toMatch(/output\s+"lambda_function_name"/);
      expect(stackContent).toMatch(/output\s+"lambda_function_arn"/);
      expect(stackContent).toMatch(/output\s+"secret_arn"/);
      expect(stackContent).toMatch(/output\s+"name_prefix"/);
    });

    test("API Gateway URL includes invoke path", () => {
      expect(stackContent).toMatch(/value\s*=\s*"\${aws_api_gateway_stage\.stage\.invoke_url}\/invoke"/);
    });
  });

  describe("Resource Dependencies and Best Practices", () => {
    test("Lambda function depends on log group", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda\]/);
    });

    test("API Gateway deployment has proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_api_gateway_integration\.lambda\]/);
    });

    test("common tags are applied consistently", () => {
      expect(stackContent).toMatch(/common_tags\s*=/);
      expect(stackContent).toMatch(/Project\s*=\s*"serverless-api"/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test("data sources are used appropriately", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"zip"/);
    });
  });

  describe("Python Handler Implementation", () => {
    test("handler imports required dependencies", () => {
      expect(handlerContent).toMatch(/from\s+botocore\.exceptions\s+import\s+ClientError/);
      expect(handlerContent).toMatch(/secrets\s*=\s*boto3\.client\("secretsmanager"\)/);
    });

    test("handler retrieves secret ARN from environment", () => {
      expect(handlerContent).toMatch(/secret_arn\s*=\s*os\.environ\.get\("SECRET_ARN"\)/);
    });

    test("handler returns proper API Gateway response format", () => {
      expect(handlerContent).toMatch(/"statusCode":\s*200/);
      expect(handlerContent).toMatch(/"headers":\s*{"Content-Type":\s*"application\/json"}/);
      expect(handlerContent).toMatch(/"body":\s*json\.dumps/);
    });

    test("handler handles errors appropriately", () => {
      expect(handlerContent).toMatch(/except\s+ClientError\s+as\s+e:/);
      expect(handlerContent).toMatch(/"error":\s*str\(e\)/);
    });

    test("handler returns secret keys without exposing values", () => {
      expect(handlerContent).toMatch(/"secret_keys":\s*list\(secret_data\.keys\(\)\)/);
    });
  });
});