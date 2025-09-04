// Unit tests for Terraform HCL infrastructure
// Tests validate structure, configuration, and resource definitions without deploying

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const libDir = path.resolve(__dirname, "../lib");

// Helper to read file content
const readFile = (fileName: string): string => {
  const filePath = path.join(libDir, fileName);
  return fs.readFileSync(filePath, "utf8");
};

// Helper to check if file exists
const fileExists = (fileName: string): boolean => {
  const filePath = path.join(libDir, fileName);
  return fs.existsSync(filePath);
};

// Helper to run terraform validate
const runTerraformValidate = (): boolean => {
  try {
    // First, try to initialize terraform with backend reconfiguration
    // This handles the case where backend configuration has changed
    try {
      execSync("terraform init -backend=false", {
        cwd: libDir,
        stdio: "pipe"
      });
    } catch (initError) {
      // If init fails, still try to validate as it might work without backend
      // for basic syntax validation
    }
    
    execSync("terraform validate", {
      cwd: libDir,
      stdio: "pipe"
    });
    return true;
  } catch (error) {
    return false;
  }
};

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "outputs.tf",
      "dynamodb.tf",
      "lambda.tf",
      "api_gateway.tf",
      "s3.tf",
      "iam.tf",
      "cloudwatch.tf",
      "sns.tf",
      "kms.tf",
      "codebuild.tf",
      "data.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} should exist`, () => {
        expect(fileExists(file)).toBe(true);
      });
    });

    test("lambda_function.py.tpl template should exist", () => {
      expect(fileExists("lambda_function.py.tpl")).toBe(true);
    });

    test("buildspec.yml should exist", () => {
      expect(fileExists("buildspec.yml")).toBe(true);
    });

    test("deployspec.yml should exist", () => {
      expect(fileExists("deployspec.yml")).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = readFile("provider.tf");
    });

    test("should define terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*{[\s\S]*required_version\s*=\s*".*"/);
    });

    test("should require AWS provider", () => {
      expect(providerContent).toMatch(/required_providers\s*{[\s\S]*aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/);
    });

    test("should configure backend", () => {
      // Backend can be either S3 or local for testing
      expect(providerContent).toMatch(/backend\s+"(s3|local)"\s*{/);
    });

    test("should configure AWS provider with region", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=\s*var\.aws_region/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = readFile("variables.tf");
    });

    test("should define aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("should define project_name variable", () => {
      expect(variablesContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("should define environment variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("should define environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("should define github_repo variable", () => {
      expect(variablesContent).toMatch(/variable\s+"github_repo"\s*{/);
    });

    test("should define notification_email variable", () => {
      expect(variablesContent).toMatch(/variable\s+"notification_email"\s*{/);
    });
  });

  describe("DynamoDB Tables", () => {
    let dynamodbContent: string;

    beforeAll(() => {
      dynamodbContent = readFile("dynamodb.tf");
    });

    test("should define users table", () => {
      expect(dynamodbContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"users"\s*{/);
    });

    test("should define orders table", () => {
      expect(dynamodbContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"orders"\s*{/);
    });

    test("should define notifications table", () => {
      expect(dynamodbContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"notifications"\s*{/);
    });

    test("users table should have email global secondary index", () => {
      expect(dynamodbContent).toMatch(/global_secondary_index\s*{[\s\S]*name\s*=\s*"email-index"/);
    });

    test("orders table should have user_id global secondary index", () => {
      expect(dynamodbContent).toMatch(/global_secondary_index\s*{[\s\S]*name\s*=\s*"user-id-index"/);
    });

    test("all tables should have deletion_protection_enabled = false", () => {
      const deletionProtectionCount = (dynamodbContent.match(/deletion_protection_enabled\s*=\s*false/g) || []).length;
      expect(deletionProtectionCount).toBe(3);
    });

    test("all tables should use PAY_PER_REQUEST billing mode", () => {
      const billingModeCount = (dynamodbContent.match(/billing_mode\s*=\s*"PAY_PER_REQUEST"/g) || []).length;
      expect(billingModeCount).toBe(3);
    });

    test("all tables should have point in time recovery enabled", () => {
      const pitrCount = (dynamodbContent.match(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/g) || []).length;
      expect(pitrCount).toBe(3);
    });

    test("all tables should use environment_suffix in naming", () => {
      const suffixCount = (dynamodbContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThanOrEqual(6); // At least in name and tags for 3 tables
    });
  });

  describe("Lambda Functions", () => {
    let lambdaContent: string;

    beforeAll(() => {
      lambdaContent = readFile("lambda.tf");
    });

    test("should define Lambda functions for each service", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_lambda_function"\s+"services"\s*{/);
      expect(lambdaContent).toMatch(/for_each\s*=\s*toset\(\["user",\s*"order",\s*"notification"\]\)/);
    });

    test("should use Python 3.11 runtime", () => {
      expect(lambdaContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test("should configure Lambda with environment variables", () => {
      expect(lambdaContent).toMatch(/environment\s*{[\s\S]*variables\s*=\s*{/);
    });

    test("should enable X-Ray tracing", () => {
      expect(lambdaContent).toMatch(/tracing_config\s*{[\s\S]*mode\s*=\s*"Active"/);
    });

    test("should create archive files for Lambda deployment", () => {
      expect(lambdaContent).toMatch(/data\s+"archive_file"\s+"lambda_placeholder"\s*{/);
    });

    test("should grant API Gateway permission to invoke Lambda", () => {
      expect(lambdaContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"\s*{/);
    });

    test("Lambda functions should use environment_suffix in naming", () => {
      expect(lambdaContent).toMatch(/function_name\s*=\s*".*\$\{var\.environment_suffix\}.*"/);
    });
  });

  describe("API Gateway", () => {
    let apiGatewayContent: string;

    beforeAll(() => {
      apiGatewayContent = readFile("api_gateway.tf");
    });

    test("should define REST API", () => {
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"\s*{/);
    });

    test("should create resources for each service", () => {
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"services"\s*{/);
    });

    test("should create GET and POST methods for each service", () => {
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"services_get"\s*{/);
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"services_post"\s*{/);
    });

    test("should configure Lambda integrations", () => {
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"services_get"\s*{/);
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"services_post"\s*{/);
    });

    test("should create deployment and stage", () => {
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"\s*{/);
      expect(apiGatewayContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"\s*{/);
    });

    test("should enable X-Ray tracing on stage", () => {
      expect(apiGatewayContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test("API Gateway should use environment_suffix in naming", () => {
      expect(apiGatewayContent).toMatch(/name\s*=\s*".*\$\{var\.environment_suffix\}.*"/);
    });
  });

  describe("S3 Buckets", () => {
    let s3Content: string;

    beforeAll(() => {
      s3Content = readFile("s3.tf");
    });

    test("should define artifacts bucket", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"artifacts"\s*{/);
    });

    test("should define static assets bucket", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"static_assets"\s*{/);
    });

    test("should enable versioning on artifacts bucket", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"artifacts"\s*{/);
    });

    test("should configure server-side encryption", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"artifacts"\s*{/);
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"static_assets"\s*{/);
    });

    test("should block public access", () => {
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"artifacts"\s*{/);
      expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"static_assets"\s*{/);
    });

    test("should use random suffix for bucket naming", () => {
      expect(s3Content).toMatch(/resource\s+"random_id"\s+"bucket_suffix"\s*{/);
    });

    test("S3 buckets should use environment_suffix in naming", () => {
      const suffixCount = (s3Content.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThanOrEqual(4); // At least in bucket names and tags
    });
  });

  describe("IAM Roles and Policies", () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = readFile("iam.tf");
    });

    test("should define Lambda execution roles", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*{/);
    });

    test("should attach basic execution policy to Lambda roles", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"\s*{/);
    });

    test("should attach X-Ray policy to Lambda roles", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_xray_access"\s*{/);
    });

    test("should define DynamoDB policy for Lambda", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_dynamodb"\s*{/);
    });

    test("should define CodeBuild role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"codebuild"\s*{/);
    });

    test("should define CodePipeline role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline"\s*{/);
    });

    test("IAM roles should use environment_suffix in naming", () => {
      const suffixCount = (iamContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThanOrEqual(8); // Multiple IAM resources
    });
  });

  describe("CloudWatch", () => {
    let cloudwatchContent: string;

    beforeAll(() => {
      cloudwatchContent = readFile("cloudwatch.tf");
    });

    test("should create log groups for Lambda functions", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*{/);
    });

    test("should create log group for API Gateway", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"\s*{/);
    });

    test("should create log groups for CodeBuild", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_build"\s*{/);
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_deploy"\s*{/);
    });

    test("should create CloudWatch dashboard", () => {
      expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
    });

    test("should set retention period for log groups", () => {
      const retentionCount = (cloudwatchContent.match(/retention_in_days\s*=\s*14/g) || []).length;
      expect(retentionCount).toBeGreaterThanOrEqual(4);
    });

    test("CloudWatch resources should use environment_suffix", () => {
      const suffixCount = (cloudwatchContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThanOrEqual(8);
    });
  });

  describe("SNS", () => {
    let snsContent: string;

    beforeAll(() => {
      snsContent = readFile("sns.tf");
    });

    test("should define SNS topic for deployment notifications", () => {
      expect(snsContent).toMatch(/resource\s+"aws_sns_topic"\s+"deployment_notifications"\s*{/);
    });

    test("should configure email subscription", () => {
      expect(snsContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"\s*{/);
    });

    test("should define topic policy", () => {
      expect(snsContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"deployment_notifications"\s*{/);
    });

    test("SNS topic should use environment_suffix", () => {
      expect(snsContent).toMatch(/name\s*=\s*".*\$\{var\.environment_suffix\}.*"/);
    });
  });

  describe("KMS", () => {
    let kmsContent: string;

    beforeAll(() => {
      kmsContent = readFile("kms.tf");
    });

    test("should define KMS key for pipeline", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"pipeline_key"\s*{/);
    });

    test("should create KMS alias", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_alias"\s+"pipeline_key"\s*{/);
    });

    test("should enable key rotation", () => {
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS alias should use environment_suffix", () => {
      expect(kmsContent).toMatch(/name\s*=\s*"alias\/.*\$\{var\.environment_suffix\}.*"/);
    });
  });

  describe("CodeBuild", () => {
    let codebuildContent: string;

    beforeAll(() => {
      codebuildContent = readFile("codebuild.tf");
    });

    test("should define build and test project", () => {
      expect(codebuildContent).toMatch(/resource\s+"aws_codebuild_project"\s+"build_and_test"\s*{/);
    });

    test("should define deploy project", () => {
      expect(codebuildContent).toMatch(/resource\s+"aws_codebuild_project"\s+"deploy"\s*{/);
    });

    test("should configure environment variables", () => {
      const envVarCount = (codebuildContent.match(/environment_variable\s*{/g) || []).length;
      expect(envVarCount).toBeGreaterThanOrEqual(3);
    });

    test("CodeBuild projects should use environment_suffix", () => {
      const suffixCount = (codebuildContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Outputs", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = readFile("outputs.tf");
    });

    test("should output API Gateway URL", () => {
      expect(outputsContent).toMatch(/output\s+"api_gateway_url"\s*{/);
    });

    test("should output S3 bucket names", () => {
      expect(outputsContent).toMatch(/output\s+"artifacts_bucket"\s*{/);
      expect(outputsContent).toMatch(/output\s+"static_assets_bucket"\s*{/);
    });

    test("should output DynamoDB table names", () => {
      expect(outputsContent).toMatch(/output\s+"dynamodb_tables"\s*{/);
    });

    test("should output Lambda function names", () => {
      expect(outputsContent).toMatch(/output\s+"lambda_function_names"\s*{/);
    });

    test("should output SNS topic ARN", () => {
      expect(outputsContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("should output KMS key ID", () => {
      expect(outputsContent).toMatch(/output\s+"kms_key_id"\s*{/);
    });
  });

  describe("Terraform Validation", () => {
    test("terraform configuration should be valid", () => {
      const isValid = runTerraformValidate();
      expect(isValid).toBe(true);
    });

    test("terraform format should be correct", () => {
      try {
        const result = execSync("terraform fmt -check -recursive", {
          cwd: libDir,
          stdio: "pipe"
        });
        expect(result).toBeDefined();
      } catch (error) {
        // If format check fails, it returns non-zero exit code
        expect(error).toBeUndefined();
      }
    });
  });

  describe("Security Best Practices", () => {
    test("should not have hardcoded credentials", () => {
      const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));
      files.forEach(file => {
        const content = readFile(file);
        expect(content).not.toMatch(/aws_access_key_id\s*=/);
        expect(content).not.toMatch(/aws_secret_access_key\s*=/);
        expect(content).not.toMatch(/password\s*=\s*"/);
        expect(content).not.toMatch(/token\s*=\s*"[A-Za-z0-9]/);
      });
    });

    test("should use encryption for sensitive resources", () => {
      const s3Content = readFile("s3.tf");
      const dynamodbContent = readFile("dynamodb.tf");
      const snsContent = readFile("sns.tf");
      
      // S3 encryption
      expect(s3Content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      
      // DynamoDB encryption
      expect(dynamodbContent).toMatch(/server_side_encryption\s*{/);
      
      // SNS encryption
      expect(snsContent).toMatch(/kms_master_key_id\s*=/);
    });

    test("should block public access on S3 buckets", () => {
      const s3Content = readFile("s3.tf");
      expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
      expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });
});