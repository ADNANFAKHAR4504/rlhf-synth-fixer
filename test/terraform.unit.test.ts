// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform Fintech API infrastructure

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");
const mainTfPath = path.join(libPath, "main.tf");
const variablesTfPath = path.join(libPath, "variables.tf");
const outputsTfPath = path.join(libPath, "outputs.tf");
const providerTfPath = path.join(libPath, "provider.tf");
const lambdaPath = path.join(libPath, "lambda");
const lambdaIndexPath = path.join(lambdaPath, "index.js");
const lambdaPackagePath = path.join(lambdaPath, "package.json");

describe("Terraform Infrastructure Files", () => {
  describe("File Structure", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesTfPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(outputsTfPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });

    test("lambda directory exists", () => {
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test("lambda/index.js exists", () => {
      expect(fs.existsSync(lambdaIndexPath)).toBe(true);
    });

    test("lambda/package.json exists", () => {
      expect(fs.existsSync(lambdaPackagePath)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerTfPath, "utf8");
    });

    test("terraform version constraint is defined", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=/);
    });

    test("AWS provider is configured", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("backend is configured", () => {
      expect(providerContent).toMatch(/backend\s+/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesTfPath, "utf8");
    });

    test("aws_region variable is defined", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("environment_suffix variable is defined", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("common_tags variable is defined", () => {
      expect(variablesContent).toMatch(/variable\s+"common_tags"\s*{/);
    });

    test("allowed_origins variable is defined", () => {
      expect(variablesContent).toMatch(/variable\s+"allowed_origins"\s*{/);
    });

    test("api_key variable is defined as sensitive", () => {
      const apiKeyMatch = variablesContent.match(/variable\s+"api_key"\s*{[^}]*}/s);
      expect(apiKeyMatch).toBeTruthy();
      expect(apiKeyMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("default aws_region is us-west-2", () => {
      const regionMatch = variablesContent.match(/variable\s+"aws_region"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
      expect(regionMatch).toBeTruthy();
      expect(regionMatch![1]).toBe("us-west-2");
    });
  });

  describe("Main Infrastructure", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(mainTfPath, "utf8");
    });

    describe("Resource Naming Convention", () => {
      test("DynamoDB table uses environment suffix", () => {
        expect(mainContent).toMatch(/name\s*=\s*"fintech-api-transactions-\$\{var\.environment_suffix\}"/);
      });

      test("Lambda function uses environment suffix", () => {
        expect(mainContent).toMatch(/function_name\s*=\s*"fintech-api-processor-\$\{var\.environment_suffix\}"/);
      });

      test("API Gateway uses environment suffix", () => {
        expect(mainContent).toMatch(/name\s*=\s*"fintech-api-\$\{var\.environment_suffix\}"/);
      });

      test("CloudWatch log groups use environment suffix", () => {
        expect(mainContent).toMatch(/\/aws\/lambda\/fintech-api-processor-\$\{var\.environment_suffix\}/);
      });

      test("SSM parameters use environment suffix", () => {
        expect(mainContent).toMatch(/\/fintech-api-\$\{var\.environment_suffix\}\//);
      });

      test("IAM roles use environment suffix", () => {
        expect(mainContent).toMatch(/name\s*=\s*"fintech-api-.*-\$\{var\.environment_suffix\}"/);
      });
    });

    describe("DynamoDB Configuration", () => {
      test("DynamoDB table is configured with PAY_PER_REQUEST billing", () => {
        expect(mainContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      });

      test("DynamoDB table has point-in-time recovery enabled", () => {
        expect(mainContent).toMatch(/point_in_time_recovery\s*{[^}]*enabled\s*=\s*true/s);
      });

      test("DynamoDB table has encryption enabled", () => {
        expect(mainContent).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
      });

      test("DynamoDB table has correct hash and range keys", () => {
        expect(mainContent).toMatch(/hash_key\s*=\s*"transaction_id"/);
        expect(mainContent).toMatch(/range_key\s*=\s*"timestamp"/);
      });

      test("DynamoDB table has global secondary index for customer_id", () => {
        expect(mainContent).toMatch(/global_secondary_index\s*{[^}]*hash_key\s*=\s*"customer_id"/s);
      });
    });

    describe("Lambda Configuration", () => {
      test("Lambda function uses Node.js 20 runtime", () => {
        expect(mainContent).toMatch(/runtime\s*=\s*"nodejs20\.x"/);
      });

      test("Lambda function has 512MB memory", () => {
        expect(mainContent).toMatch(/memory_size\s*=\s*512/);
      });

      test("Lambda function has 30 second timeout", () => {
        expect(mainContent).toMatch(/timeout\s*=\s*30/);
      });

      test("Lambda function has environment variables configured", () => {
        expect(mainContent).toMatch(/environment\s*{[^}]*variables\s*=/s);
        expect(mainContent).toMatch(/DYNAMODB_TABLE/);
        expect(mainContent).toMatch(/ENVIRONMENT_SUFFIX/);
        expect(mainContent).toMatch(/SSM_PARAMETER_PREFIX/);
      });
    });

    describe("API Gateway Configuration", () => {
      test("API Gateway is HTTP API type", () => {
        expect(mainContent).toMatch(/protocol_type\s*=\s*"HTTP"/);
      });

      test("API Gateway has CORS configuration", () => {
        expect(mainContent).toMatch(/cors_configuration\s*{/);
      });

      test("API Gateway has POST /transactions route", () => {
        expect(mainContent).toMatch(/route_key\s*=\s*"POST \/transactions"/);
      });

      test("API Gateway has GET /transactions/{id} route", () => {
        expect(mainContent).toMatch(/route_key\s*=\s*"GET \/transactions\/\{id\}"/);
      });

      test("API Gateway has Lambda integration", () => {
        expect(mainContent).toMatch(/integration_type\s*=\s*"AWS_PROXY"/);
      });
    });

    describe("CloudWatch Configuration", () => {
      test("CloudWatch log groups are configured", () => {
        expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      });

      test("CloudWatch alarm for error rate is configured", () => {
        expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"error_rate_alarm"/);
      });

      test("CloudWatch dashboard is configured", () => {
        expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
      });

      test("Error rate alarm threshold is 1%", () => {
        expect(mainContent).toMatch(/threshold\s*=\s*"1"/);
      });
    });

    describe("EventBridge Scheduler", () => {
      test("Daily report scheduler is configured", () => {
        expect(mainContent).toMatch(/resource\s+"aws_scheduler_schedule"\s+"daily_report"/);
      });

      test("Cleanup scheduler is configured", () => {
        expect(mainContent).toMatch(/resource\s+"aws_scheduler_schedule"\s+"cleanup_old_records"/);
      });

      test("Daily report runs at 2 AM", () => {
        expect(mainContent).toMatch(/cron\(0 2 \* \* \? \*\)/);
      });

      test("Cleanup runs at 3 AM", () => {
        expect(mainContent).toMatch(/cron\(0 3 \* \* \? \*\)/);
      });
    });

    describe("Security Configuration", () => {
      test("SSM parameters are configured for sensitive data", () => {
        expect(mainContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_key"/);
        expect(mainContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_connection"/);
      });

      test("SSM parameters use SecureString for sensitive values", () => {
        expect(mainContent).toMatch(/type\s*=\s*"SecureString"/);
      });

      test("IAM policies follow least privilege", () => {
        expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_dynamodb"/);
        expect(mainContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_ssm"/);
      });
    });

    describe("No Retention Policies", () => {
      test("No prevent_destroy lifecycle rules", () => {
        expect(mainContent).not.toMatch(/prevent_destroy\s*=\s*true/);
      });

      test("No deletion_protection enabled", () => {
        expect(mainContent).not.toMatch(/deletion_protection\s*=\s*true/);
      });
    });
  });

  describe("Outputs Configuration", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(outputsTfPath, "utf8");
    });

    test("API endpoint output is defined", () => {
      expect(outputsContent).toMatch(/output\s+"api_endpoint"/);
    });

    test("DynamoDB table name output is defined", () => {
      expect(outputsContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test("Lambda function name output is defined", () => {
      expect(outputsContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test("CloudWatch dashboard URL output is defined", () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_url"/);
    });
  });

  describe("Lambda Function Code", () => {
    let lambdaContent: string;
    let packageContent: string;

    beforeAll(() => {
      lambdaContent = fs.readFileSync(lambdaIndexPath, "utf8");
      packageContent = fs.readFileSync(lambdaPackagePath, "utf8");
    });

    test("Lambda uses AWS SDK", () => {
      expect(lambdaContent).toMatch(/require\(['"]aws-sdk['"]\)/);
    });

    test("Lambda uses AWS Lambda Powertools", () => {
      expect(lambdaContent).toMatch(/@aws-lambda-powertools/);
    });

    test("Lambda handler is exported", () => {
      expect(lambdaContent).toMatch(/exports\.handler/);
    });

    test("Lambda handles POST /transactions", () => {
      expect(lambdaContent).toMatch(/method === ['"]POST['"].*path === ['"]\/transactions['"]/s);
    });

    test("Lambda handles GET /transactions/{id}", () => {
      expect(lambdaContent).toMatch(/method === ['"]GET['"].*path\.startsWith\(['"]\/transactions\//s);
    });

    test("Lambda handles EventBridge scheduled events", () => {
      expect(lambdaContent).toMatch(/event\.action/);
      expect(lambdaContent).toMatch(/generate_daily_report/);
      expect(lambdaContent).toMatch(/cleanup_old_records/);
    });

    test("Lambda uses environment variables", () => {
      expect(lambdaContent).toMatch(/process\.env\.DYNAMODB_TABLE/);
      expect(lambdaContent).toMatch(/process\.env\.SSM_PARAMETER_PREFIX/);
    });

    test("Lambda package.json has required dependencies", () => {
      const pkg = JSON.parse(packageContent);
      expect(pkg.dependencies).toHaveProperty("aws-sdk");
      expect(pkg.dependencies).toHaveProperty("@aws-lambda-powertools/logger");
      expect(pkg.dependencies).toHaveProperty("@aws-lambda-powertools/metrics");
      expect(pkg.dependencies).toHaveProperty("@aws-lambda-powertools/tracer");
    });

    test("Lambda has X-Ray SDK dependency", () => {
      const pkg = JSON.parse(packageContent);
      expect(pkg.dependencies).toHaveProperty("aws-xray-sdk-core");
      expect(pkg.dependencies["aws-xray-sdk-core"]).toMatch(/^\^3\./);
    });

    test("Lambda uses X-Ray SDK for tracing", () => {
      expect(lambdaContent).toMatch(/const AWSXRay = require\(['"]aws-xray-sdk-core['"]\)/);
      expect(lambdaContent).toMatch(/AWSXRay\.captureAWS/);
    });

    test("Lambda creates X-Ray subsegments", () => {
      expect(lambdaContent).toMatch(/AWSXRay\.getSegment\(\)\.addNewSubsegment/);
      expect(lambdaContent).toMatch(/subsegment\.addAnnotation/);
      expect(lambdaContent).toMatch(/subsegment\.close\(\)/);
    });
  });

  describe("X-Ray Configuration", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(mainTfPath, "utf-8");
    });

    test("Lambda has X-Ray tracing enabled", () => {
      expect(mainContent).toMatch(/tracing_config\s*{\s*mode\s*=\s*"Active"/);
    });

    test("X-Ray sampling rule is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"fintech_api_sampling"/);
      expect(mainContent).toMatch(/fixed_rate\s*=\s*0\.1/);
    });

    test("X-Ray encryption is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_xray_encryption_config"\s+"fintech_api"/);
      expect(mainContent).toMatch(/type\s*=\s*"KMS"/);
    });

    test("X-Ray group is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_xray_group"\s+"fintech_api_group"/);
      expect(mainContent).toMatch(/filter_expression/);
    });

    test("Lambda has X-Ray daemon write access", () => {
      expect(mainContent).toMatch(/aws_iam_role_policy_attachment.*lambda_xray/);
      expect(mainContent).toMatch(/AWSXRayDaemonWriteAccess/);
    });

    test("X-Ray outputs are defined", () => {
      const outputsContent = fs.readFileSync(outputsTfPath, "utf-8");
      expect(outputsContent).toMatch(/output\s+"xray_group_arn"/);
      expect(outputsContent).toMatch(/output\s+"xray_service_map_url"/);
    });
  });

  describe("WAF Configuration", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(mainTfPath, "utf-8");
    });

    test("WAF Web ACL is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"fintech_api_waf"/);
      expect(mainContent).toMatch(/scope\s*=\s*"REGIONAL"/);
    });

    test("WAF rate limiting rule is configured", () => {
      expect(mainContent).toMatch(/rule\s*{\s*name\s*=\s*"RateLimitRule"/);
      expect(mainContent).toMatch(/limit\s*=\s*2000/);
      expect(mainContent).toMatch(/aggregate_key_type\s*=\s*"IP"/);
    });

    test("WAF has AWS Managed Rules - Common Rule Set", () => {
      expect(mainContent).toMatch(/name\s*=\s*"AWSManagedRulesCommonRuleSet"/);
      expect(mainContent).toMatch(/vendor_name\s*=\s*"AWS"/);
    });

    test("WAF has AWS Managed Rules - Known Bad Inputs", () => {
      expect(mainContent).toMatch(/name\s*=\s*"AWSManagedRulesKnownBadInputsRuleSet"/);
    });

    test("WAF has SQL Injection protection", () => {
      expect(mainContent).toMatch(/name\s*=\s*"AWSManagedRulesSQLiRuleSet"/);
    });

    test("WAF has Bot Control with Targeted protection level", () => {
      expect(mainContent).toMatch(/name\s*=\s*"AWSManagedRulesBotControlRuleSet"/);
      expect(mainContent).toMatch(/inspection_level\s*=\s*"TARGETED"/);
    });

    test("WAF has geo-blocking rule", () => {
      expect(mainContent).toMatch(/rule\s*{\s*name\s*=\s*"GeoBlockingRule"/);
      expect(mainContent).toMatch(/country_codes\s*=\s*\["CN",\s*"RU",\s*"KP",\s*"IR"\]/);
    });

    test("WAF has custom response bodies", () => {
      expect(mainContent).toMatch(/custom_response_body\s*{\s*key\s*=\s*"rate_limit_error"/);
      expect(mainContent).toMatch(/custom_response_body\s*{\s*key\s*=\s*"geo_block_error"/);
    });

    test("WAF logging is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_wafv2_web_acl_logging_configuration"\s+"fintech_api_waf_logging"/);
      expect(mainContent).toMatch(/redacted_fields/);
    });

    test("WAF is associated with API Gateway", () => {
      expect(mainContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"api_gateway_waf"/);
    });

    test("WAF CloudWatch log group is configured", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"waf_logs"/);
      expect(mainContent).toMatch(/name\s*=\s*"\/aws\/wafv2\/fintech-api-\$\{var\.environment_suffix\}"/);
    });

    test("WAF outputs are defined", () => {
      const outputsContent = fs.readFileSync(outputsTfPath, "utf-8");
      expect(outputsContent).toMatch(/output\s+"waf_web_acl_id"/);
      expect(outputsContent).toMatch(/output\s+"waf_web_acl_arn"/);
    });
  });
});
