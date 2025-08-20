// Unit tests for Terraform serverless infrastructure
import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  
  describe("File Structure", () => {
    const requiredFiles = [
      "terraform.tf",
      "provider.tf",
      "variables.tf",
      "locals.tf",
      "iam.tf",
      "secrets.tf",
      "lambda.tf",
      "lambda_sources.tf",
      "api_gateway.tf",
      "outputs.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("terraform.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "terraform.tf"), "utf8");
    });

    test("declares required Terraform version >= 1.4.0", () => {
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("declares AWS provider requirement", () => {
      expect(content).toMatch(/aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/);
    });

    test("declares S3 backend configuration", () => {
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test("declares required providers: archive, random, local", () => {
      expect(content).toMatch(/archive\s*=\s*{/);
      expect(content).toMatch(/random\s*=\s*{/);
      expect(content).toMatch(/local\s*=\s*{/);
    });
  });

  describe("variables.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
    });

    test("declares aws_region variable with default us-east-1", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("declares environment_suffix variable", () => {
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(content).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares environment variable with default dev", () => {
      expect(content).toMatch(/variable\s+"environment"\s*{/);
      expect(content).toMatch(/default\s*=\s*"dev"/);
    });
  });

  describe("locals.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "locals.tf"), "utf8");
    });

    test("defines resource_prefix with environment suffix", () => {
      expect(content).toMatch(/resource_prefix\s*=/);
      expect(content).toMatch(/local\.name_suffix/);
    });

    test("defines lambda_functions map with health, user, notification", () => {
      expect(content).toMatch(/lambda_functions\s*=\s*{/);
      expect(content).toMatch(/health\s*=\s*{/);
      expect(content).toMatch(/user\s*=\s*{/);
      expect(content).toMatch(/notification\s*=\s*{/);
    });

    test("lambda handlers use correct module names", () => {
      expect(content).toMatch(/handler\s*=\s*"health_service\.lambda_handler"/);
      expect(content).toMatch(/handler\s*=\s*"user_service\.lambda_handler"/);
      expect(content).toMatch(/handler\s*=\s*"notification_service\.lambda_handler"/);
    });

    test("defines common_tags with required tags", () => {
      expect(content).toMatch(/common_tags\s*=\s*{/);
      expect(content).toMatch(/Project\s*=/);
      expect(content).toMatch(/Environment\s*=/);
      expect(content).toMatch(/EnvironmentSuffix\s*=/);
    });
  });

  describe("iam.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
    });

    test("creates Lambda IAM role with proper naming", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(content).toMatch(/name\s*=\s*.*local\.resource_prefix/);
    });

    test("Lambda role allows Lambda service to assume it", () => {
      expect(content).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test("attaches basic Lambda execution policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"/);
      expect(content).toMatch(/AWSLambdaBasicExecutionRole/);
    });

    test("creates custom Lambda policy for Secrets Manager access", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_custom_policy"/);
      expect(content).toMatch(/secretsmanager:GetSecretValue/);
    });
  });

  describe("lambda.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
    });

    test("creates Lambda functions using for_each", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"microservice_functions"/);
      expect(content).toMatch(/for_each\s*=\s*local\.lambda_functions/);
    });

    test("Lambda functions use Python 3.8 runtime", () => {
      expect(content).toMatch(/runtime\s*=\s*"python3\.8"/);
    });

    test("Lambda functions use environment suffix in naming", () => {
      expect(content).toMatch(/function_name\s*=.*local\.resource_prefix/);
    });

    test("creates CloudWatch log groups for Lambda functions", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
      expect(content).toMatch(/retention_in_days\s*=\s*7/);
    });

    test("creates archive data sources for Lambda zips", () => {
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_zip"/);
    });
  });

  describe("api_gateway.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "api_gateway.tf"), "utf8");
    });

    test("creates API Gateway REST API", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"microservices_api"/);
    });

    test("API Gateway uses REGIONAL endpoint", () => {
      expect(content).toMatch(/types\s*=\s*\["REGIONAL"\]/);
    });

    test("creates health resource and GET method", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"health"/);
      expect(content).toMatch(/path_part\s*=\s*"health"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"health_get"/);
    });

    test("creates users resource with CRUD methods", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"users"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"users_get"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"users_post"/);
    });

    test("creates notifications resource with POST method", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"notifications"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"notifications_post"/);
    });

    test("creates Lambda integrations for all endpoints", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"health_integration"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"users_integration"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"notifications_integration"/);
      expect(content).toMatch(/type\s*=\s*"AWS_PROXY"/);
    });

    test("creates API Gateway deployment and stage", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"/);
    });

    test("grants Lambda permissions for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_lambda"/);
      expect(content).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  describe("secrets.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "secrets.tf"), "utf8");
    });

    test("creates Secrets Manager secret with environment suffix", () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"api_keys"/);
      expect(content).toMatch(/name\s*=.*local\.name_suffix/);
    });

    test("creates secret version with random passwords", () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"api_keys"/);
      expect(content).toMatch(/resource\s+"random_password"\s+"api_key"/);
      expect(content).toMatch(/resource\s+"random_password"\s+"notification_key"/);
    });

    test("random passwords have proper length and complexity", () => {
      expect(content).toMatch(/length\s*=\s*32/);
      expect(content).toMatch(/special\s*=\s*true/);
    });
  });

  describe("outputs.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
    });

    test("outputs API Gateway URL", () => {
      expect(content).toMatch(/output\s+"api_gateway_url"/);
      expect(content).toMatch(/value\s*=\s*aws_api_gateway_stage\.main\.invoke_url/);
    });

    test("outputs Lambda function names", () => {
      expect(content).toMatch(/output\s+"lambda_function_names"/);
    });

    test("outputs API endpoints", () => {
      expect(content).toMatch(/output\s+"api_endpoints"/);
      expect(content).toMatch(/health\s*=/);
      expect(content).toMatch(/users\s*=/);
      expect(content).toMatch(/notifications\s*=/);
    });

    test("outputs environment suffix", () => {
      expect(content).toMatch(/output\s+"environment_suffix"/);
    });

    test("outputs Secrets Manager ARN", () => {
      expect(content).toMatch(/output\s+"secrets_manager_secret_arn"/);
    });
  });

  describe("lambda_sources.tf", () => {
    let content: string;
    
    beforeAll(() => {
      content = fs.readFileSync(path.join(libPath, "lambda_sources.tf"), "utf8");
    });

    test("creates health service Lambda source", () => {
      expect(content).toMatch(/resource\s+"local_file"\s+"health_service"/);
      expect(content).toMatch(/def lambda_handler/);
    });

    test("creates user service Lambda source", () => {
      expect(content).toMatch(/resource\s+"local_file"\s+"user_service"/);
      expect(content).toMatch(/http_method\s*=\s*event\.get\('httpMethod'/);
    });

    test("creates notification service Lambda source", () => {
      expect(content).toMatch(/resource\s+"local_file"\s+"notification_service"/);
      expect(content).toMatch(/notification_type\s*=\s*body\.get\('type'/);
    });

    test("Lambda functions handle errors properly", () => {
      expect(content).toMatch(/except Exception as e:/);
      expect(content).toMatch(/'statusCode':\s*500/);
    });

    test("Lambda functions return proper HTTP responses", () => {
      expect(content).toMatch(/'statusCode':\s*200/);
      expect(content).toMatch(/'Content-Type':\s*'application\/json'/);
      expect(content).toMatch(/'Access-Control-Allow-Origin':\s*'\*'/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all IAM resources use environment suffix", () => {
      const iamContent = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
      const iamResourceMatches = iamContent.match(/name\s*=\s*"[^"]*"/g) || [];
      
      iamResourceMatches.forEach(match => {
        if (!match.includes("arn:aws:iam")) {
          expect(match).toMatch(/local\.resource_prefix/);
        }
      });
    });

    test("all Lambda functions use environment suffix", () => {
      const lambdaContent = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
      expect(lambdaContent).toMatch(/function_name\s*=.*local\.resource_prefix/);
    });

    test("API Gateway uses environment suffix", () => {
      const apiContent = fs.readFileSync(path.join(libPath, "api_gateway.tf"), "utf8");
      expect(apiContent).toMatch(/name\s*=.*local\.resource_prefix/);
    });
  });
});