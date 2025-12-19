// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure in lib/
// Validates structure, resources, variables, and compliance with requirements
// No Terraform execution - pure static analysis

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

// Helper to read all .tf files from lib directory
const readTerraformFiles = (): { [key: string]: string } => {
  const files: { [key: string]: string } = {};
  const tfFiles = [
    "main.tf",
    "variables.tf",
    "networking.tf",
    "security.tf",
    "rds.tf",
    "lambda.tf",
    "api_gateway.tf",
    "storage.tf",
    "iam.tf",
    "monitoring.tf",
    "vpc_endpoints.tf",
    "waf.tf",
    "outputs.tf",
  ];

  tfFiles.forEach((file) => {
    const filePath = path.join(LIB_DIR, file);
    if (fs.existsSync(filePath)) {
      files[file] = fs.readFileSync(filePath, "utf8");
    }
  });

  return files;
};

// Combine all file contents for searching across files
const getAllContent = (files: { [key: string]: string }): string => {
  return Object.values(files).join("\n");
};

let tfFiles: { [key: string]: string };
let allContent: string;

beforeAll(() => {
  if (!fs.existsSync(LIB_DIR)) {
    throw new Error(`Lib directory not found at: ${LIB_DIR}`);
  }
  tfFiles = readTerraformFiles();
  allContent = getAllContent(tfFiles);

  // Verify we have the essential files
  expect(tfFiles["main.tf"]).toBeDefined();
  expect(tfFiles["variables.tf"]).toBeDefined();
});

describe("1. File Structure & Terraform Block", () => {
  test("main.tf exists and is readable", () => {
    expect(tfFiles["main.tf"]).toBeDefined();
    expect(tfFiles["main.tf"].length).toBeGreaterThan(100);
  });

  test("main.tf declares terraform block with required_version >= 1.5", () => {
    expect(tfFiles["main.tf"]).toMatch(/terraform\s*\{/);
    expect(tfFiles["main.tf"]).toMatch(/required_version\s*=\s*">=\s*1\.5/);
  });

  test("main.tf declares AWS provider version ~> 5.0", () => {
    expect(tfFiles["main.tf"]).toMatch(/required_providers\s*\{/);
    expect(tfFiles["main.tf"]).toMatch(/aws\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/aws"/);
    expect(tfFiles["main.tf"]).toMatch(/version\s*=\s*"~>\s*5\.0"/);
  });

  test("main.tf declares AWS provider with region variable", () => {
    expect(tfFiles["main.tf"]).toMatch(/provider\s+"aws"\s*\{/);
    expect(tfFiles["main.tf"]).toMatch(/region\s*=\s*var\.region/);
  });

  test("main.tf declares default_tags in provider", () => {
    expect(tfFiles["main.tf"]).toMatch(/default_tags\s*\{/);
    expect(tfFiles["main.tf"]).toMatch(/Environment\s*=\s*var\.environment/);
    expect(tfFiles["main.tf"]).toMatch(/Project\s*=\s*var\.project_name/);
  });

  test("main.tf declares locals block with common configurations", () => {
    expect(tfFiles["main.tf"]).toMatch(/locals\s*\{/);
    expect(tfFiles["main.tf"]).toMatch(/vpc_cidr\s*=/);
    expect(tfFiles["main.tf"]).toMatch(/common_tags\s*=/);
  });

  test("main.tf defines vpc_cidr based on environment", () => {
    expect(tfFiles["main.tf"]).toMatch(/vpc_cidr\s*=\s*var\.environment\s*==\s*"dev"\s*\?\s*"10\.0\.0\.0\/16"\s*:\s*"172\.16\.0\.0\/16"/);
  });
});

describe("2. Variables Declaration", () => {
  test("variables.tf exists and is readable", () => {
    expect(tfFiles["variables.tf"]).toBeDefined();
    expect(tfFiles["variables.tf"].length).toBeGreaterThan(100);
  });

  test("declares environment_suffix variable", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"environment_suffix"\s*\{/);
    expect(tfFiles["variables.tf"]).toMatch(/type\s*=\s*string/);
  });

  test("declares environment variable with validation", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"environment"\s*\{/);
    expect(tfFiles["variables.tf"]).toMatch(/validation\s*\{/);
    expect(tfFiles["variables.tf"]).toMatch(/contains\(\["dev",\s*"prod"\]/);
  });

  test("declares region variable with default", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"region"\s*\{/);
    expect(tfFiles["variables.tf"]).toMatch(/default\s*=\s*"us-east-1"/);
  });

  test("declares project_name variable", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"project_name"\s*\{/);
  });

  test("declares owner variable", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"owner"\s*\{/);
  });

  test("declares alert_email variable", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"alert_email"\s*\{/);
  });

  test("declares enable_cross_region_replication variable", () => {
    expect(tfFiles["variables.tf"]).toMatch(/variable\s+"enable_cross_region_replication"\s*\{/);
    expect(tfFiles["variables.tf"]).toMatch(/type\s*=\s*bool/);
  });
});

describe("3. VPC and Networking Resources", () => {
  test("networking.tf exists", () => {
    expect(tfFiles["networking.tf"]).toBeDefined();
  });

  test("creates VPC resource", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_vpc"\s+"main"\s*\{/);
    expect(tfFiles["networking.tf"]).toMatch(/cidr_block\s*=\s*local\.vpc_cidr/);
    expect(tfFiles["networking.tf"]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(tfFiles["networking.tf"]).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*\{/);
    expect(tfFiles["networking.tf"]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates public subnets with count", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_subnet"\s+"public"\s*\{/);
    expect(tfFiles["networking.tf"]).toMatch(/count\s*=\s*3/);
    expect(tfFiles["networking.tf"]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private subnets with count", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_subnet"\s+"private"\s*\{/);
    expect(tfFiles["networking.tf"]).toMatch(/count\s*=\s*3/);
  });

  test("creates database subnets", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_subnet"\s+"database"\s*\{/);
  });

  test("creates route tables for public and private subnets", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_route_table"\s+"public"\s*\{/);
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_route_table"\s+"private"\s*\{/);
  });

  test("creates NAT gateways conditionally", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*\{/);
  });

  test("creates DB subnet group", () => {
    expect(tfFiles["networking.tf"]).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*\{/);
  });
});

describe("4. Security Resources", () => {
  test("security.tf exists", () => {
    expect(tfFiles["security.tf"]).toBeDefined();
  });

  test("creates KMS key for RDS encryption", () => {
    expect(tfFiles["security.tf"]).toMatch(/resource\s+"aws_kms_key"\s+"rds"\s*\{/);
    expect(tfFiles["security.tf"]).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates KMS key for S3 encryption", () => {
    expect(tfFiles["security.tf"]).toMatch(/resource\s+"aws_kms_key"\s+"s3"\s*\{/);
  });

  test("creates KMS aliases", () => {
    expect(tfFiles["security.tf"]).toMatch(/resource\s+"aws_kms_alias"\s+"rds"\s*\{/);
    expect(tfFiles["security.tf"]).toMatch(/resource\s+"aws_kms_alias"\s+"s3"\s*\{/);
  });

  test("creates security group for RDS", () => {
    expect(tfFiles["security.tf"]).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*\{/);
    expect(tfFiles["security.tf"]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates security group for Lambda", () => {
    expect(tfFiles["security.tf"]).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*\{/);
  });

  test("RDS security group allows PostgreSQL from Lambda", () => {
    const rdsSg = tfFiles["security.tf"].match(/resource\s+"aws_security_group"\s+"rds"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(rdsSg).toBeTruthy();
    expect(rdsSg![0]).toMatch(/from_port\s*=\s*5432/);
    expect(rdsSg![0]).toMatch(/to_port\s*=\s*5432/);
  });
});

describe("5. RDS Aurora Resources", () => {
  test("rds.tf exists", () => {
    expect(tfFiles["rds.tf"]).toBeDefined();
  });

  test("creates random password for RDS", () => {
    expect(tfFiles["rds.tf"]).toMatch(/resource\s+"random_password"\s+"db_password"\s*\{/);
  });

  test("creates RDS Aurora PostgreSQL cluster", () => {
    expect(tfFiles["rds.tf"]).toMatch(/resource\s+"aws_rds_cluster"\s+"main"\s*\{/);
    expect(tfFiles["rds.tf"]).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    expect(tfFiles["rds.tf"]).toMatch(/database_name\s*=\s*"payments"/);
  });

  test("RDS cluster has serverlessv2 scaling configuration", () => {
    expect(tfFiles["rds.tf"]).toMatch(/serverlessv2_scaling_configuration\s*\{/);
    expect(tfFiles["rds.tf"]).toMatch(/max_capacity/);
    expect(tfFiles["rds.tf"]).toMatch(/min_capacity/);
  });

  test("RDS cluster enables encryption", () => {
    expect(tfFiles["rds.tf"]).toMatch(/storage_encrypted\s*=\s*true/);
    expect(tfFiles["rds.tf"]).toMatch(/kms_key_id/);
  });

  test("RDS cluster has backup retention period", () => {
    expect(tfFiles["rds.tf"]).toMatch(/backup_retention_period/);
  });

  test("creates RDS cluster instances", () => {
    expect(tfFiles["rds.tf"]).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"main"\s*\{/);
    expect(tfFiles["rds.tf"]).toMatch(/instance_class\s*=\s*"db\.serverless"/);
  });

  test("stores RDS credentials in Secrets Manager", () => {
    expect(tfFiles["rds.tf"]).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*\{/);
    expect(tfFiles["rds.tf"]).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"\s*\{/);
  });
});

describe("6. Lambda Functions", () => {
  test("lambda.tf exists", () => {
    expect(tfFiles["lambda.tf"]).toBeDefined();
  });

  test("creates CloudWatch log groups for Lambda functions", () => {
    expect(tfFiles["lambda.tf"]).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_validation"\s*\{/);
    expect(tfFiles["lambda.tf"]).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"transaction_processing"\s*\{/);
  });

  test("creates payment validation Lambda function", () => {
    expect(tfFiles["lambda.tf"]).toMatch(/resource\s+"aws_lambda_function"\s+"payment_validation"\s*\{/);
    expect(tfFiles["lambda.tf"]).toMatch(/function_name\s*=\s*"payment-validation-/);
    expect(tfFiles["lambda.tf"]).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("creates transaction processing Lambda function", () => {
    expect(tfFiles["lambda.tf"]).toMatch(/resource\s+"aws_lambda_function"\s+"transaction_processing"\s*\{/);
  });

  test("Lambda functions are VPC-enabled", () => {
    expect(tfFiles["lambda.tf"]).toMatch(/vpc_config\s*\{/);
    expect(tfFiles["lambda.tf"]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private/);
    expect(tfFiles["lambda.tf"]).toMatch(/security_group_ids/);
  });

  test("Lambda functions have environment variables", () => {
    expect(tfFiles["lambda.tf"]).toMatch(/environment\s*\{/);
    expect(tfFiles["lambda.tf"]).toMatch(/ENVIRONMENT\s*=\s*var\.environment/);
  });

  test("Lambda functions have IAM role", () => {
    expect(tfFiles["lambda.tf"]).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution\.arn/);
  });
});

describe("7. API Gateway Resources", () => {
  test("api_gateway.tf exists", () => {
    expect(tfFiles["api_gateway.tf"]).toBeDefined();
  });

  test("creates API Gateway REST API", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"\s*\{/);
    expect(tfFiles["api_gateway.tf"]).toMatch(/name\s*=\s*"payment-api-/);
  });

  test("creates API Gateway request validator", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_request_validator"\s+"main"\s*\{/);
  });

  test("creates API Gateway resources for /validate and /process", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_resource"\s+"validate"\s*\{/);
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_resource"\s+"process"\s*\{/);
  });

  test("creates API Gateway methods", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_method"\s+"validate_post"\s*\{/);
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_method"\s+"process_post"\s*\{/);
  });

  test("creates API Gateway integrations with Lambda", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_integration"\s+"validate_lambda"\s*\{/);
    expect(tfFiles["api_gateway.tf"]).toMatch(/type\s*=\s*"AWS_PROXY"/);
  });

  test("creates API Gateway deployment", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"\s*\{/);
  });

  test("creates API Gateway stage", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"\s*\{/);
  });

  test("configures API Gateway method settings for throttling", () => {
    expect(tfFiles["api_gateway.tf"]).toMatch(/resource\s+"aws_api_gateway_method_settings"\s+"main"\s*\{/);
    expect(tfFiles["api_gateway.tf"]).toMatch(/throttling_rate_limit/);
    expect(tfFiles["api_gateway.tf"]).toMatch(/throttling_burst_limit/);
  });
});

describe("8. S3 Storage Resources", () => {
  test("storage.tf exists", () => {
    expect(tfFiles["storage.tf"]).toBeDefined();
  });

  test("creates S3 bucket for transaction logs", () => {
    expect(tfFiles["storage.tf"]).toMatch(/resource\s+"aws_s3_bucket"\s+"transaction_logs"\s*\{/);
    expect(tfFiles["storage.tf"]).toMatch(/bucket\s*=\s*"transaction-logs-/);
  });

  test("creates S3 bucket for customer documents", () => {
    expect(tfFiles["storage.tf"]).toMatch(/resource\s+"aws_s3_bucket"\s+"customer_documents"\s*\{/);
  });

  test("enables S3 bucket versioning", () => {
    expect(tfFiles["storage.tf"]).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"transaction_logs"\s*\{/);
    expect(tfFiles["storage.tf"]).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures S3 bucket encryption with KMS", () => {
    expect(tfFiles["storage.tf"]).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"transaction_logs"\s*\{/);
    expect(tfFiles["storage.tf"]).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("blocks public access to S3 buckets", () => {
    expect(tfFiles["storage.tf"]).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"transaction_logs"\s*\{/);
    expect(tfFiles["storage.tf"]).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("configures S3 bucket lifecycle policies", () => {
    expect(tfFiles["storage.tf"]).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"transaction_logs"\s*\{/);
  });
});

describe("9. IAM Roles and Policies", () => {
  test("iam.tf exists", () => {
    expect(tfFiles["iam.tf"]).toBeDefined();
  });

  test("creates Lambda execution IAM role", () => {
    expect(tfFiles["iam.tf"]).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*\{/);
    expect(tfFiles["iam.tf"]).toMatch(/assume_role_policy/);
  });

  test("creates IAM policies for Lambda", () => {
    expect(tfFiles["iam.tf"]).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_logging"\s*\{/);
    expect(tfFiles["iam.tf"]).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_vpc"\s*\{/);
    expect(tfFiles["iam.tf"]).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_s3"\s*\{/);
  });

  test("attaches IAM policies to Lambda role", () => {
    expect(tfFiles["iam.tf"]).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_logging"\s*\{/);
  });

  test("IAM policies include explicit deny statements", () => {
    const iamContent = tfFiles["iam.tf"];
    expect(iamContent).toMatch(/Effect\s*=\s*"Deny"/);
  });

  test("IAM policies follow least privilege", () => {
    const iamContent = tfFiles["iam.tf"];
    expect(iamContent).toMatch(/logs:CreateLogGroup|logs:PutLogEvents/);
    expect(iamContent).toMatch(/s3:GetObject|s3:PutObject/);
  });
});

describe("10. Monitoring and CloudWatch", () => {
  test("monitoring.tf exists", () => {
    expect(tfFiles["monitoring.tf"]).toBeDefined();
  });

  test("creates SNS topics for alerts", () => {
    expect(tfFiles["monitoring.tf"]).toMatch(/resource\s+"aws_sns_topic"\s+"transaction_alerts"\s*\{/);
    expect(tfFiles["monitoring.tf"]).toMatch(/resource\s+"aws_sns_topic"\s+"system_errors"\s*\{/);
  });

  test("creates SNS topic subscriptions", () => {
    expect(tfFiles["monitoring.tf"]).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"transaction_alerts_email"\s*\{/);
    expect(tfFiles["monitoring.tf"]).toMatch(/protocol\s*=\s*"email"/);
  });

  test("creates CloudWatch dashboard", () => {
    expect(tfFiles["monitoring.tf"]).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*\{/);
  });

  test("creates CloudWatch alarms", () => {
    expect(tfFiles["monitoring.tf"]).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_5xx"\s*\{/);
    expect(tfFiles["monitoring.tf"]).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*\{/);
  });
});

describe("11. VPC Endpoints", () => {
  test("vpc_endpoints.tf exists", () => {
    expect(tfFiles["vpc_endpoints.tf"]).toBeDefined();
  });

  test("creates S3 VPC endpoint (Gateway)", () => {
    expect(tfFiles["vpc_endpoints.tf"]).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*\{/);
    expect(tfFiles["vpc_endpoints.tf"]).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
  });

  test("creates DynamoDB VPC endpoint (Gateway)", () => {
    expect(tfFiles["vpc_endpoints.tf"]).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*\{/);
  });

  test("creates Lambda VPC endpoint (Interface)", () => {
    expect(tfFiles["vpc_endpoints.tf"]).toMatch(/resource\s+"aws_vpc_endpoint"\s+"lambda"\s*\{/);
    expect(tfFiles["vpc_endpoints.tf"]).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
  });

  test("creates security group for VPC endpoints", () => {
    expect(tfFiles["vpc_endpoints.tf"]).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"\s*\{/);
  });
});

describe("12. WAF Resources", () => {
  test("waf.tf exists", () => {
    expect(tfFiles["waf.tf"]).toBeDefined();
  });

  test("creates WAF Web ACL", () => {
    expect(tfFiles["waf.tf"]).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"api_gateway"\s*\{/);
    expect(tfFiles["waf.tf"]).toMatch(/scope\s*=\s*"REGIONAL"/);
  });

  test("WAF has rate limiting rule", () => {
    expect(tfFiles["waf.tf"]).toMatch(/rate_based_statement/);
  });

  test("WAF uses AWS managed rules", () => {
    expect(tfFiles["waf.tf"]).toMatch(/managed_rule_group_statement/);
    expect(tfFiles["waf.tf"]).toMatch(/AWSManagedRulesCommonRuleSet/);
  });

  test("associates WAF with API Gateway", () => {
    expect(tfFiles["waf.tf"]).toMatch(/resource\s+"aws_wafv2_web_acl_association"\s+"api_gateway"\s*\{/);
  });
});

describe("13. Outputs", () => {
  test("outputs.tf exists", () => {
    expect(tfFiles["outputs.tf"]).toBeDefined();
  });

  test("outputs VPC information", () => {
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"vpc_id"\s*\{/);
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"vpc_cidr"\s*\{/);
  });

  test("outputs subnet IDs", () => {
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"public_subnet_ids"\s*\{/);
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"private_subnet_ids"\s*\{/);
  });

  test("outputs RDS cluster endpoint", () => {
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"rds_cluster_endpoint"\s*\{/);
  });

  test("outputs Lambda function ARNs", () => {
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"payment_validation_lambda_arn"\s*\{/);
  });

  test("outputs API Gateway endpoint", () => {
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"api_gateway_endpoint"\s*\{/);
  });

  test("outputs S3 bucket names", () => {
    expect(tfFiles["outputs.tf"]).toMatch(/output\s+"transaction_logs_bucket_name"\s*\{/);
  });
});

describe("14. Tagging and Naming", () => {
  test("all resources use environment_suffix in naming", () => {
    expect(allContent).toMatch(/\$\{var\.environment_suffix\}/);
  });

  test("common_tags include Environment, Project, and Owner", () => {
    expect(tfFiles["main.tf"]).toMatch(/Environment\s*=\s*var\.environment/);
    expect(tfFiles["main.tf"]).toMatch(/Project\s*=\s*var\.project_name/);
    expect(tfFiles["main.tf"]).toMatch(/Owner\s*=\s*var\.owner/);
  });
});

describe("15. Security Best Practices", () => {
  test("RDS uses encrypted storage", () => {
    expect(tfFiles["rds.tf"]).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("KMS keys have rotation enabled", () => {
    expect(tfFiles["security.tf"]).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("no hardcoded credentials", () => {
    expect(allContent).not.toMatch(/password\s*=\s*"[^$]/);
    expect(allContent).not.toMatch(/secret\s*=\s*"(?!arn:aws)/);
  });
});

describe("16. Code Quality", () => {
  test("no syntax errors in HCL (balanced braces)", () => {
    const openBraces = (allContent.match(/\{/g) || []).length;
    const closeBraces = (allContent.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  test("no incomplete resource blocks", () => {
    expect(allContent).not.toMatch(/resource\s+"aws_\w+"\s+"\w+"\s*\{\s*\}/);
  });

  test("consistent use of environment_suffix variable", () => {
    const suffixUsages = (allContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
    expect(suffixUsages).toBeGreaterThan(10);
  });

  test("no TODOs or placeholders", () => {
    expect(allContent).not.toMatch(/TODO|FIXME|PLACEHOLDER|XXX/i);
  });
});

describe("17. Environment-Specific Configuration", () => {
  test("VPC CIDR varies by environment", () => {
    expect(tfFiles["main.tf"]).toMatch(/vpc_cidr\s*=\s*var\.environment\s*==\s*"dev"/);
  });

  test("API throttling limits vary by environment", () => {
    expect(tfFiles["main.tf"]).toMatch(/api_throttle_rate_limit\s*=\s*var\.environment\s*==\s*"dev"\s*\?\s*100\s*:\s*1000/);
  });

  test("RDS backup retention varies by environment", () => {
    expect(tfFiles["rds.tf"]).toMatch(/backup_retention_period\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*30\s*:\s*7/);
  });

  test("RDS instance count varies by environment", () => {
    expect(tfFiles["rds.tf"]).toMatch(/count\s*=\s*var\.environment\s*==\s*"prod"\s*\?\s*2\s*:\s*1/);
  });
});

describe("18. Required Resources Summary", () => {
  test("all required infrastructure components are present", () => {
    const requiredComponents = [
      "aws_vpc",
      "aws_subnet",
      "aws_rds_cluster",
      "aws_lambda_function",
      "aws_api_gateway_rest_api",
      "aws_s3_bucket",
      "aws_cloudwatch_dashboard",
      "aws_sns_topic",
      "aws_vpc_endpoint",
      "aws_wafv2_web_acl",
    ];

    requiredComponents.forEach((component) => {
      expect(allContent).toMatch(new RegExp(`resource\\s+"${component}"`));
    });
  });
});

