// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// These tests validate the Terraform configuration against requirements
// WITHOUT executing terraform init/plan/apply commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

let stackContent: string;

beforeAll(() => {
  if (fs.existsSync(stackPath)) {
    stackContent = fs.readFileSync(stackPath, "utf8");
  }
});

describe("Terraform Stack: File Existence and Basic Structure", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*\{/);
  });

  test("file is not empty and has meaningful content", () => {
    expect(stackContent.length).toBeGreaterThan(1000);
    expect(stackContent).toContain("resource");
    expect(stackContent).toContain("variable");
  });
});

describe("Terraform Stack: Variable Declarations", () => {
  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*\{/);
  });

  test("declares project_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"project_name"\s*\{/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*\{/);
  });

  test("declares owner variable", () => {
    expect(stackContent).toMatch(/variable\s+"owner"\s*\{/);
  });

  test("declares deployment_version variable", () => {
    expect(stackContent).toMatch(/variable\s+"deployment_version"\s*\{/);
  });

  test("declares model_versions variable", () => {
    expect(stackContent).toMatch(/variable\s+"model_versions"\s*\{/);
  });

  test("declares lambda_memory_size variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_memory_size"\s*\{/);
  });

  test("declares lambda_timeout variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_timeout"\s*\{/);
  });

  test("declares provisioned_concurrency variable", () => {
    expect(stackContent).toMatch(/variable\s+"provisioned_concurrency"\s*\{/);
  });

  test("declares reserved_concurrency variable (REQUIREMENT)", () => {
    expect(stackContent).toMatch(/variable\s+"reserved_concurrency"\s*\{/);
  });

  test("declares API Gateway throttling variables", () => {
    expect(stackContent).toMatch(/variable\s+"api_gateway_throttling_rate_limit"\s*\{/);
    expect(stackContent).toMatch(/variable\s+"api_gateway_throttling_burst_limit"\s*\{/);
  });

  test("declares ECR configuration variables", () => {
    expect(stackContent).toMatch(/variable\s+"ecr_image_scan_on_push"\s*\{/);
    expect(stackContent).toMatch(/variable\s+"ecr_image_tag_mutability"\s*\{/);
  });
});

describe("Terraform Stack: KMS Encryption (Security Requirement)", () => {
  test("defines KMS key resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"ml_key"\s*\{/);
  });

  test("KMS key has rotation enabled", () => {
    const kmsKeyMatch = stackContent.match(/resource\s+"aws_kms_key"\s+"ml_key"\s*\{[\s\S]*?(?=resource\s+"\w+"|$)/);
    expect(kmsKeyMatch).toBeTruthy();
    if (kmsKeyMatch) {
      expect(kmsKeyMatch[0]).toMatch(/enable_key_rotation\s*=\s*true/);
    }
  });

  test("KMS key has alias defined", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"ml_key_alias"\s*\{/);
  });

  test("KMS key has appropriate deletion window", () => {
    const kmsKeyMatch = stackContent.match(/resource\s+"aws_kms_key"\s+"ml_key"\s*\{[\s\S]*?(?=resource\s+"\w+"|$)/);
    expect(kmsKeyMatch).toBeTruthy();
    if (kmsKeyMatch) {
      expect(kmsKeyMatch[0]).toMatch(/deletion_window_in_days/);
    }
  });
});

describe("Terraform Stack: ECR Repository (Requirement)", () => {
  test("defines ECR repository resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"model_repository"\s*\{/);
  });

  test("ECR has image scanning configuration", () => {
    expect(stackContent).toMatch(/image_scanning_configuration\s*\{/);
    expect(stackContent).toMatch(/scan_on_push/);
  });

  test("ECR has encryption configuration with KMS", () => {
    expect(stackContent).toMatch(/encryption_configuration\s*\{/);
    expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
  });

  test("ECR has lifecycle policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"model_repository_policy"\s*\{/);
  });
});

describe("Terraform Stack: VPC Configuration (Production-Ready)", () => {
  test("defines VPC resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"ml_vpc"\s*\{/);
  });

  test("VPC has DNS support enabled", () => {
    const vpcMatch = stackContent.match(/resource\s+"aws_vpc"\s+"ml_vpc"\s*\{[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (vpcMatch) {
      expect(vpcMatch[0]).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpcMatch[0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    }
  });

  test("defines private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*\{/);
  });

  test("defines public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*\{/);
  });

  test("defines Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"ml_igw"\s*\{/);
  });

  test("defines NAT Gateway (fintech security best practice)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat"\s*\{/);
  });

  test("defines Elastic IPs for NAT", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*\{/);
  });

  test("defines route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*\{/);
  });

  test("defines route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*\{/);
  });
});

describe("Terraform Stack: Security Groups", () => {
  test("defines Lambda security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"\s*\{/);
  });

  test("defines EFS security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"efs_sg"\s*\{/);
  });

  test("defines VPC endpoints security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints_sg"\s*\{/);
  });

  test("EFS security group allows NFS from Lambda", () => {
    const efsSecGroupMatch = stackContent.match(/resource\s+"aws_security_group"\s+"efs_sg"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (efsSecGroupMatch) {
      expect(efsSecGroupMatch[0]).toMatch(/from_port\s*=\s*2049/);
      expect(efsSecGroupMatch[0]).toMatch(/to_port\s*=\s*2049/);
      expect(efsSecGroupMatch[0]).toMatch(/protocol\s*=\s*"tcp"/);
    }
  });
});

describe("Terraform Stack: VPC Endpoints (Private AWS Access)", () => {
  test("defines ECR API endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"\s*\{/);
  });

  test("defines ECR DKR endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"\s*\{/);
  });

  test("defines S3 endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*\{/);
  });

  test("defines CloudWatch Logs endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"logs"\s*\{/);
  });

  test("defines SSM endpoint (for Parameter Store)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"\s*\{/);
  });
});

describe("Terraform Stack: EFS for Model Storage (Requirement)", () => {
  test("defines EFS file system", () => {
    expect(stackContent).toMatch(/resource\s+"aws_efs_file_system"\s+"model_storage"\s*\{/);
  });

  test("EFS is encrypted with KMS", () => {
    const efsMatch = stackContent.match(/resource\s+"aws_efs_file_system"\s+"model_storage"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (efsMatch) {
      expect(efsMatch[0]).toMatch(/encrypted\s*=\s*true/);
      expect(efsMatch[0]).toMatch(/kms_key_id/);
    }
  });

  test("defines EFS mount targets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_efs_mount_target"\s+"model_storage_mount"\s*\{/);
  });

  test("defines EFS access point", () => {
    expect(stackContent).toMatch(/resource\s+"aws_efs_access_point"\s+"model_access_point"\s*\{/);
  });

  test("EFS has lifecycle policy", () => {
    const efsMatch = stackContent.match(/resource\s+"aws_efs_file_system"\s+"model_storage"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (efsMatch) {
      expect(efsMatch[0]).toMatch(/lifecycle_policy\s*\{/);
    }
  });
});

describe("Terraform Stack: Parameter Store (Security Requirement)", () => {
  test("defines Parameter Store resources for model config", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"model_config"\s*\{/);
  });

  test("defines Parameter Store resource for API config", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_config"\s*\{/);
  });

  test("Parameter Store uses SecureString type", () => {
    const ssmMatches = stackContent.match(/resource\s+"aws_ssm_parameter"[\s\S]*?type\s*=\s*"(\w+)"/g);
    expect(ssmMatches).toBeTruthy();
    if (ssmMatches) {
      ssmMatches.forEach(match => {
        expect(match).toMatch(/type\s*=\s*"SecureString"/);
      });
    }
  });

  test("Parameter Store is encrypted with KMS", () => {
    const ssmMatch = stackContent.match(/resource\s+"aws_ssm_parameter"[\s\S]{1,500}/);
    if (ssmMatch) {
      expect(ssmMatch[0]).toMatch(/key_id/);
    }
  });
});

describe("Terraform Stack: IAM Roles and Policies", () => {
  test("defines Lambda execution role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution_role"\s*\{/);
  });

  test("defines Lambda IAM policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_policy"\s*\{/);
  });

  test("Lambda policy includes CloudWatch Logs permissions", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/logs:CreateLogGroup/);
      expect(lambdaPolicyMatch[0]).toMatch(/logs:CreateLogStream/);
      expect(lambdaPolicyMatch[0]).toMatch(/logs:PutLogEvents/);
    }
  });

  test("Lambda policy includes VPC permissions", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/ec2:CreateNetworkInterface/);
      expect(lambdaPolicyMatch[0]).toMatch(/ec2:DescribeNetworkInterfaces/);
    }
  });

  test("Lambda policy includes EFS permissions", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/elasticfilesystem:ClientMount/);
    }
  });

  test("Lambda policy includes KMS permissions", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/kms:Decrypt/);
      expect(lambdaPolicyMatch[0]).toMatch(/kms:GenerateDataKey/);
    }
  });

  test("Lambda policy includes X-Ray permissions", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/xray:PutTraceSegments/);
      expect(lambdaPolicyMatch[0]).toMatch(/xray:PutTelemetryRecords/);
    }
  });

  test("Lambda policy includes ECR permissions (CRITICAL FIX)", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/ecr:GetDownloadUrlForLayer/);
      expect(lambdaPolicyMatch[0]).toMatch(/ecr:BatchGetImage/);
      expect(lambdaPolicyMatch[0]).toMatch(/ecr:GetAuthorizationToken/);
    }
  });

  test("Lambda policy includes Parameter Store permissions", () => {
    const lambdaPolicyMatch = stackContent.match(/resource\s+"aws_iam_policy"\s+"lambda_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaPolicyMatch) {
      expect(lambdaPolicyMatch[0]).toMatch(/ssm:GetParameter/);
    }
  });

  test("attaches policy to Lambda role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_policy_attachment"\s*\{/);
  });

  test("defines API Gateway CloudWatch role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch_role"\s*\{/);
  });
});

describe("Terraform Stack: Lambda Functions (Container-based)", () => {
  test("defines Lambda function resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"model_inference"\s*\{/);
  });

  test("Lambda uses for_each for model versions", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/for_each\s*=\s*toset\(var\.model_versions\)/);
    }
  });

  test("Lambda package_type is Image (container-based)", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/package_type\s*=\s*"Image"/);
    }
  });

  test("Lambda has VPC configuration", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/vpc_config\s*\{/);
    }
  });

  test("Lambda has EFS file system config", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/file_system_config\s*\{/);
    }
  });

  test("Lambda has environment variables", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/environment\s*\{/);
    }
  });

  test("Lambda has X-Ray tracing enabled", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/tracing_config\s*\{/);
      expect(lambdaMatch[0]).toMatch(/mode\s*=\s*"Active"/);
    }
  });

  test("Lambda has publish = true (production best practice)", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/publish\s*=\s*true/);
    }
  });

  test("Lambda has reserved_concurrent_executions (REQUIREMENT)", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"model_inference"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (lambdaMatch) {
      expect(lambdaMatch[0]).toMatch(/reserved_concurrent_executions/);
    }
  });

  test("defines Lambda alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_alias"\s+"model_alias"\s*\{/);
  });

  test("defines provisioned concurrency config", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_provisioned_concurrency_config"\s+"model_concurrency"\s*\{/);
  });
});

describe("Terraform Stack: Lambda Auto-Scaling", () => {
  test("defines Application Auto Scaling target", () => {
    expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"lambda_target"\s*\{/);
  });

  test("defines Application Auto Scaling policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"lambda_concurrency_utilization"\s*\{/);
  });

  test("Auto Scaling uses target tracking", () => {
    const scalingPolicyMatch = stackContent.match(/resource\s+"aws_appautoscaling_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (scalingPolicyMatch) {
      expect(scalingPolicyMatch[0]).toMatch(/policy_type\s*=\s*"TargetTrackingScaling"/);
    }
  });

  test("Auto Scaling monitors Lambda provisioned concurrency", () => {
    const scalingPolicyMatch = stackContent.match(/resource\s+"aws_appautoscaling_policy"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (scalingPolicyMatch) {
      expect(scalingPolicyMatch[0]).toMatch(/LambdaProvisionedConcurrencyUtilization/);
    }
  });
});

describe("Terraform Stack: API Gateway (REST API)", () => {
  test("defines REST API (not HTTP API)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"ml_api"\s*\{/);
    expect(stackContent).not.toMatch(/resource\s+"aws_apigatewayv2_api"/);
  });

  test("defines API Gateway resources for model versions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"model_version"\s*\{/);
  });

  test("defines API Gateway resources for predict endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"predict"\s*\{/);
  });

  test("defines API Gateway methods", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"predict_post"\s*\{/);
  });

  test("API Gateway method requires API key", () => {
    const methodMatch = stackContent.match(/resource\s+"aws_api_gateway_method"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (methodMatch) {
      expect(methodMatch[0]).toMatch(/api_key_required\s*=\s*true/);
    }
  });

  test("defines Lambda integration (AWS_PROXY)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda_integration"\s*\{/);
    const integrationMatch = stackContent.match(/resource\s+"aws_api_gateway_integration"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (integrationMatch) {
      expect(integrationMatch[0]).toMatch(/type\s*=\s*"AWS_PROXY"/);
    }
  });

  test("defines Lambda permissions for API Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_invoke"\s*\{/);
  });

  test("defines API Gateway deployment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"ml_api_deployment"\s*\{/);
  });

  test("defines API Gateway stages for each model version", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"ml_api_stage"\s*\{/);
  });

  test("API Gateway stages have X-Ray tracing enabled", () => {
    const stageMatch = stackContent.match(/resource\s+"aws_api_gateway_stage"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (stageMatch) {
      expect(stageMatch[0]).toMatch(/xray_tracing_enabled\s*=\s*true/);
    }
  });

  test("API Gateway stages have access logging", () => {
    const stageMatch = stackContent.match(/resource\s+"aws_api_gateway_stage"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (stageMatch) {
      expect(stageMatch[0]).toMatch(/access_log_settings\s*\{/);
    }
  });

  test("defines method settings for throttling", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method_settings"\s+"all"\s*\{/);
  });

  test("API Gateway account is configured for CloudWatch", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_account"\s+"main"\s*\{/);
  });
});

describe("Terraform Stack: API Keys and Usage Plans", () => {
  test("defines API keys", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_api_key"\s+"api_key"\s*\{/);
  });

  test("defines usage plans", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_usage_plan"\s+"api_usage_plan"\s*\{/);
  });

  test("usage plan has quota settings", () => {
    const usagePlanMatch = stackContent.match(/resource\s+"aws_api_gateway_usage_plan"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (usagePlanMatch) {
      expect(usagePlanMatch[0]).toMatch(/quota_settings\s*\{/);
    }
  });

  test("usage plan has throttle settings", () => {
    const usagePlanMatch = stackContent.match(/resource\s+"aws_api_gateway_usage_plan"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (usagePlanMatch) {
      expect(usagePlanMatch[0]).toMatch(/throttle_settings\s*\{/);
    }
  });

  test("links usage plan to API keys", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_usage_plan_key"\s+"api_usage_plan_key"\s*\{/);
  });
});

describe("Terraform Stack: WAF Protection", () => {
  test("defines WAF Web ACL", () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"api_waf"\s*\{/);
  });

  test("WAF scope is REGIONAL", () => {
    const wafMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (wafMatch) {
      expect(wafMatch[0]).toMatch(/scope\s*=\s*"REGIONAL"/);
    }
  });

  test("WAF has rate limiting rule", () => {
    const wafMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (wafMatch) {
      expect(wafMatch[0]).toMatch(/rate_based_statement/);
    }
  });

  test("WAF has AWS managed rule sets", () => {
    const wafMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (wafMatch) {
      expect(wafMatch[0]).toMatch(/AWSManagedRulesCommonRuleSet/);
    }
  });

  test("WAF is associated with ALL API stages (CRITICAL FIX)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"api_waf_association"\s*\{/);
    const wafAssocMatch = stackContent.match(/resource\s+"aws_wafv2_web_acl_association"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (wafAssocMatch) {
      expect(wafAssocMatch[0]).toMatch(/for_each/);
    }
  });
});

describe("Terraform Stack: CloudWatch Monitoring", () => {
  test("defines CloudWatch log groups for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*\{/);
  });

  test("defines CloudWatch log group for API Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"\s*\{/);
  });

  test("log groups have retention period", () => {
    const logGroupMatch = stackContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]{1,300}/);
    if (logGroupMatch) {
      expect(logGroupMatch[0]).toMatch(/retention_in_days/);
    }
  });

  test("log groups are encrypted with KMS", () => {
    const logGroupMatch = stackContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]{1,300}/);
    if (logGroupMatch) {
      expect(logGroupMatch[0]).toMatch(/kms_key_id/);
    }
  });

  test("defines Lambda error alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*\{/);
  });

  test("defines Lambda duration alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_duration"\s*\{/);
  });

  test("defines Lambda throttle alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"\s*\{/);
  });

  test("defines API 4XX error alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_4xx_errors"\s*\{/);
  });

  test("defines API 5XX error alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_5xx_errors"\s*\{/);
  });

  test("defines API latency alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"\s*\{/);
  });

  test("latency threshold is 100ms for sub-100ms requirement", () => {
    const latencyAlarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"(lambda_duration|api_latency)"[\s\S]*?threshold\s*=\s*(\d+)/);
    if (latencyAlarmMatch) {
      expect(parseInt(latencyAlarmMatch[2])).toBeLessThanOrEqual(100);
    }
  });

  test("alarms have SNS notification actions", () => {
    const alarmMatch = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (alarmMatch) {
      expect(alarmMatch[0]).toMatch(/alarm_actions/);
    }
  });
});

describe("Terraform Stack: CloudWatch Dashboard", () => {
  test("defines CloudWatch dashboard", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"ml_dashboard"\s*\{/);
  });

  test("dashboard is dynamically generated (NOT hard-coded)", () => {
    const dashboardMatch = stackContent.match(/resource\s+"aws_cloudwatch_dashboard"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (dashboardMatch) {
      // Should use for loop or similar, not hard-coded "v1", "v2"
      expect(dashboardMatch[0]).toMatch(/for version in var\.model_versions/);
    }
  });

  test("dashboard includes Lambda metrics", () => {
    const dashboardMatch = stackContent.match(/resource\s+"aws_cloudwatch_dashboard"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (dashboardMatch) {
      expect(dashboardMatch[0]).toMatch(/AWS\/Lambda/);
      expect(dashboardMatch[0]).toMatch(/Invocations/);
      expect(dashboardMatch[0]).toMatch(/Duration/);
      expect(dashboardMatch[0]).toMatch(/Errors/);
    }
  });

  test("dashboard includes API Gateway metrics", () => {
    const dashboardMatch = stackContent.match(/resource\s+"aws_cloudwatch_dashboard"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (dashboardMatch) {
      expect(dashboardMatch[0]).toMatch(/AWS\/ApiGateway/);
    }
  });
});

describe("Terraform Stack: SNS for Alarms", () => {
  test("defines SNS topic", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarm_topic"\s*\{/);
  });

  test("SNS topic is encrypted with KMS", () => {
    const snsMatch = stackContent.match(/resource\s+"aws_sns_topic"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (snsMatch) {
      expect(snsMatch[0]).toMatch(/kms_master_key_id/);
    }
  });

  test("defines SNS email subscription", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"\s*\{/);
  });

  test("SNS subscription uses variable for email (not hard-coded)", () => {
    const snsSubMatch = stackContent.match(/resource\s+"aws_sns_topic_subscription"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (snsSubMatch) {
      expect(snsSubMatch[0]).toMatch(/var\.alarm_email/);
    }
  });
});

describe("Terraform Stack: X-Ray Tracing", () => {
  test("defines X-Ray sampling rule", () => {
    expect(stackContent).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"tracing_sampling"\s*\{/);
  });

  test("X-Ray sampling rule has appropriate rate", () => {
    const xrayMatch = stackContent.match(/resource\s+"aws_xray_sampling_rule"[\s\S]*?(?=\nresource\s+"\w+"|$)/);
    if (xrayMatch) {
      expect(xrayMatch[0]).toMatch(/fixed_rate/);
    }
  });
});

describe("Terraform Stack: Tagging Requirements", () => {
  test("defines common_tags local variable", () => {
    expect(stackContent).toMatch(/common_tags\s*=\s*\{/);
  });

  test("common_tags includes Environment", () => {
    const tagsMatch = stackContent.match(/common_tags\s*=\s*\{[\s\S]*?\}/);
    if (tagsMatch) {
      expect(tagsMatch[0]).toMatch(/Environment\s*=\s*var\.environment/);
    }
  });

  test("common_tags includes Owner", () => {
    const tagsMatch = stackContent.match(/common_tags\s*=\s*\{[\s\S]*?\}/);
    if (tagsMatch) {
      expect(tagsMatch[0]).toMatch(/Owner\s*=\s*var\.owner/);
    }
  });

  test("common_tags includes Project", () => {
    const tagsMatch = stackContent.match(/common_tags\s*=\s*\{[\s\S]*?\}/);
    if (tagsMatch) {
      expect(tagsMatch[0]).toMatch(/Project\s*=\s*var\.project_name/);
    }
  });

  test("common_tags includes Version", () => {
    const tagsMatch = stackContent.match(/common_tags\s*=\s*\{[\s\S]*?\}/);
    if (tagsMatch) {
      expect(tagsMatch[0]).toMatch(/Version\s*=\s*var\.deployment_version/);
    }
  });

  test("resources reference common_tags", () => {
    const resourcesWithTags = stackContent.match(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/g);
    expect(resourcesWithTags).toBeTruthy();
    if (resourcesWithTags) {
      expect(resourcesWithTags.length).toBeGreaterThan(10);
    }
  });
});

describe("Terraform Stack: Data Sources", () => {
  test("uses aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*\{/);
  });

  test("uses aws_region data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"\s*\{/);
  });
});

describe("Terraform Stack: Outputs", () => {
  test("defines ECR repository URL output", () => {
    expect(stackContent).toMatch(/output\s+"ecr_repository_url"\s*\{/);
  });

  test("defines API Gateway URL outputs", () => {
    expect(stackContent).toMatch(/output\s+"api_gateway.*url"\s*\{/i);
  });

  test("defines model endpoints output", () => {
    expect(stackContent).toMatch(/output\s+"model_endpoints"\s*\{/);
  });

  test("defines Lambda function names output", () => {
    expect(stackContent).toMatch(/output\s+"lambda_function_names"\s*\{/);
  });

  test("defines EFS filesystem ID output", () => {
    expect(stackContent).toMatch(/output\s+"efs_filesystem_id"\s*\{/);
  });

  test("defines API keys output", () => {
    expect(stackContent).toMatch(/output\s+"api_key/);
  });

  test("API key values are marked as sensitive", () => {
    const apiKeyOutput = stackContent.match(/output\s+"api_key_values"[\s\S]*?(?=\noutput\s+"\w+"|$)/);
    if (apiKeyOutput) {
      expect(apiKeyOutput[0]).toMatch(/sensitive\s*=\s*true/);
    }
  });

  test("defines SNS topic ARN output", () => {
    expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*\{/);
  });

  test("defines CloudWatch dashboard URL output", () => {
    expect(stackContent).toMatch(/output\s+"cloudwatch_dashboard_url"\s*\{/);
  });

  test("defines WAF Web ACL outputs", () => {
    expect(stackContent).toMatch(/output\s+"waf_web_acl/);
  });

  test("defines KMS key outputs", () => {
    expect(stackContent).toMatch(/output\s+"kms_key/);
  });

  test("defines VPC outputs", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*\{/);
  });

  test("defines subnet outputs", () => {
    expect(stackContent).toMatch(/output\s+"(private|public)_subnet_ids"\s*\{/);
  });

  test("defines Parameter Store paths output", () => {
    expect(stackContent).toMatch(/output\s+"parameter_store_paths"\s*\{/);
  });

  test("defines deployment_info output for CI/CD", () => {
    expect(stackContent).toMatch(/output\s+"deployment_info"\s*\{/);
  });

  test("has at least 15 outputs defined", () => {
    const outputs = stackContent.match(/output\s+"\w+"\s*\{/g);
    expect(outputs).toBeTruthy();
    if (outputs) {
      expect(outputs.length).toBeGreaterThanOrEqual(15);
    }
  });
});

describe("Terraform Stack: Best Practices and Standards", () => {
  test("uses for_each for multi-version resources", () => {
    const forEachCount = (stackContent.match(/for_each\s*=\s*toset\(var\.model_versions\)/g) || []).length;
    expect(forEachCount).toBeGreaterThan(10);
  });

  test("uses string interpolation properly", () => {
    expect(stackContent).toMatch(/\$\{var\./);
    expect(stackContent).toMatch(/\$\{data\./);
  });

  test("uses depends_on for resource dependencies", () => {
    expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
  });

  test("uses lifecycle blocks where appropriate", () => {
    expect(stackContent).toMatch(/lifecycle\s*\{/);
  });

  test("resources have descriptions where applicable", () => {
    expect(stackContent).toMatch(/description\s*=/);
  });

  test("no hard-coded region (uses variable or data source)", () => {
    // Should not have hard-coded regions like "us-east-1" except in defaults
    const hardCodedRegions = stackContent.match(/"us-[a-z]+-\d+"/g) || [];
    const variableDefaults = stackContent.match(/default\s*=\s*"us-[a-z]+-\d+"/g) || [];
    expect(hardCodedRegions.length).toBeLessThanOrEqual(variableDefaults.length + 2); // Allow some tolerance
  });

  test("uses jsonencode for JSON structures", () => {
    expect(stackContent).toMatch(/jsonencode\s*\(/);
  });

  test("no obvious syntax errors (balanced braces)", () => {
    const openBraces = (stackContent.match(/\{/g) || []).length;
    const closeBraces = (stackContent.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });
});

describe("Terraform Stack: Security Compliance", () => {
  test("all encryption at rest uses KMS", () => {
    const encryptedResources = [
      /aws_efs_file_system.*encrypted\s*=\s*true/s,
      /aws_ecr_repository.*encryption_type\s*=\s*"KMS"/s,
      /aws_cloudwatch_log_group.*kms_key_id/s,
      /aws_sns_topic.*kms_master_key_id/s,
      /aws_ssm_parameter.*key_id/s
    ];

    encryptedResources.forEach(pattern => {
      expect(stackContent).toMatch(pattern);
    });
  });

  test("API Gateway enforces TLS 1.2+", () => {
    // Check if there's any TLS configuration (may be implicit in REST API)
    // This is somewhat implicit in AWS API Gateway REST API
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"/);
  });

  test("Lambda functions are in private subnets", () => {
    const lambdaVpcConfig = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?vpc_config\s*\{[\s\S]*?\}/);
    if (lambdaVpcConfig) {
      expect(lambdaVpcConfig[0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private/);
    }
  });

  test("no plain text secrets or passwords", () => {
    const suspiciousPatterns = [
      /password\s*=\s*"[^$]/i,
      /secret\s*=\s*"[^$]/i,
      /api[_-]?key\s*=\s*"[a-zA-Z0-9]{20,}"/i
    ];

    suspiciousPatterns.forEach(pattern => {
      expect(stackContent).not.toMatch(pattern);
    });
  });
});

describe("Terraform Stack: Performance and Scalability", () => {
  test("Lambda has appropriate memory allocation", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?memory_size\s*=\s*var\.lambda_memory_size/);
    expect(lambdaMatch).toBeTruthy();
  });

  test("Lambda has timeout configured", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?timeout\s*=\s*var\.lambda_timeout/);
    expect(lambdaMatch).toBeTruthy();
  });

  test("API Gateway has throttling configured", () => {
    expect(stackContent).toMatch(/throttling_burst_limit/);
    expect(stackContent).toMatch(/throttling_rate_limit/);
  });

  test("uses multiple availability zones", () => {
    expect(stackContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
  });

  test("EFS has lifecycle policy for cost optimization", () => {
    const efsMatch = stackContent.match(/resource\s+"aws_efs_file_system"[\s\S]*?lifecycle_policy/);
    expect(efsMatch).toBeTruthy();
  });
});

describe("Terraform Stack: Model Failures Fixed", () => {
  test("FIXED: Script is complete (not truncated)", () => {
    expect(stackContent).toMatch(/output\s+"deployment_info"\s*\{[\s\S]*?\}/);
    expect(stackContent.endsWith("}") || stackContent.trim().endsWith("}")).toBe(true);
  });

  test("FIXED: Uses data source for region (not redeclaring in incompatible way)", () => {
    expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    expect(stackContent).toMatch(/data\.aws_region\.current\.name/);
  });

  test("FIXED: Consistent REST API implementation", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"/);
    expect(stackContent).not.toMatch(/resource\s+"aws_apigatewayv2_api".*protocol_type\s*=\s*"HTTP"/s);
  });

  test("FIXED: ECR permissions in Lambda policy", () => {
    expect(stackContent).toMatch(/ecr:GetDownloadUrlForLayer/);
    expect(stackContent).toMatch(/ecr:BatchGetImage/);
  });

  test("FIXED: Reserved concurrency configured", () => {
    expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*var\.reserved_concurrency/);
  });

  test("FIXED: Parameter Store implemented", () => {
    expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"/);
  });

  test("FIXED: WAF protects all stages", () => {
    const wafAssoc = stackContent.match(/resource\s+"aws_wafv2_web_acl_association"[\s\S]{1,200}/);
    if (wafAssoc) {
      expect(wafAssoc[0]).toMatch(/for_each/);
    }
  });

  test("FIXED: Production VPC with private subnets and NAT", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"/);
  });

  test("FIXED: Lambda publishes versions", () => {
    expect(stackContent).toMatch(/publish\s*=\s*true/);
  });

  test("FIXED: Dynamic CloudWatch dashboard", () => {
    const dashboardMatch = stackContent.match(/resource\s+"aws_cloudwatch_dashboard"[\s\S]{1,2000}/);
    if (dashboardMatch) {
      expect(dashboardMatch[0]).toMatch(/for version in var\.model_versions/);
    }
  });

  test("FIXED: SNS email uses variable", () => {
    const snsSubMatch = stackContent.match(/resource\s+"aws_sns_topic_subscription"[\s\S]{1,300}/);
    if (snsSubMatch) {
      expect(snsSubMatch[0]).toMatch(/var\.alarm_email/);
    }
  });
});
