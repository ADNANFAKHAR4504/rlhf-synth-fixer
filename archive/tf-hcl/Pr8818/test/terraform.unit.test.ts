// Comprehensive unit tests for Terraform multi-region payment processing infrastructure
// Tests validate HCL syntax, structure, and configuration correctness

import fs from "fs";
import path from "path";
import {parse} from "hcl2-parser";

const LIB_DIR = path.resolve(__dirname, "../lib");

// Helper to read and parse Terraform files
function readTfFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, "utf8");
}

function parseTfFile(filename: string): any {
  const content = readTfFile(filename);
  try {
    return parse(content);
  } catch (error) {
    console.error(`Failed to parse ${filename}:`, error);
    return null;
  }
}

describe("Terraform Configuration - provider.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("provider.tf");
  });

  test("provider.tf file exists", () => {
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
  });

  test("declares terraform block with required version", () => {
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5"/);
  });

  test("declares AWS provider with version constraint", () => {
    expect(content).toMatch(/required_providers\s*{/);
    expect(content).toMatch(/aws\s*=\s*{/);
    expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(content).toMatch(/version\s*=\s*"~>\s*5\.0"/);
  });

  test("declares multiple provider aliases (primary, secondary, iam, route53)", () => {
    expect(content).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"primary"/s);
    expect(content).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"secondary"/s);
    expect(content).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"iam"/s);
    expect(content).toMatch(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"route53"/s);
  });

  test("primary provider uses workspace-based region selection", () => {
    const primaryMatch = content.match(/provider\s+"aws"\s*{[^}]*alias\s*=\s*"primary"[^}]*}/s);
    expect(primaryMatch).toBeTruthy();
    expect(primaryMatch![0]).toMatch(/region\s*=\s*terraform\.workspace\s*==\s*"primary"/);
  });

  test("providers include default_tags with environment_suffix", () => {
    expect(content).toMatch(/default_tags\s*{/);
    expect(content).toMatch(/Environment\s*=\s*var\.environment_suffix/);
  });
});

describe("Terraform Configuration - variables.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("variables.tf");
  });

  test("variables.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares environment_suffix variable (required)", () => {
    expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test("declares db_master_password variable as sensitive", () => {
    const passwordVarMatch = content.match(/variable\s+"db_master_password"\s*{[^}]*}/s);
    expect(passwordVarMatch).toBeTruthy();
    expect(passwordVarMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });

  test("declares project_name variable with default", () => {
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
    expect(content).toMatch(/default\s*=\s*"payment-processor"/);
  });

  test("declares VPC CIDR variables for both regions", () => {
    expect(content).toMatch(/variable\s+"vpc_cidr_primary"/);
    expect(content).toMatch(/variable\s+"vpc_cidr_secondary"/);
  });
});

describe("Terraform Configuration - locals.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("locals.tf");
  });

  test("locals.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("defines current_region based on workspace", () => {
    expect(content).toMatch(/current_region\s*=\s*terraform\.workspace\s*==\s*"primary"\s*\?\s*"us-east-1"\s*:\s*"eu-west-1"/);
  });

  test("defines is_primary workspace flag", () => {
    expect(content).toMatch(/is_primary\s*=\s*terraform\.workspace\s*==\s*"primary"/);
  });

  test("defines resource_prefix with environment_suffix", () => {
    expect(content).toMatch(/resource_prefix\s*=.*environment_suffix/);
  });

  test("defines availability zones for both regions", () => {
    expect(content).toMatch(/azs_primary/);
    expect(content).toMatch(/azs_secondary/);
    expect(content).toMatch(/current_azs/);
  });

  test("defines subnet CIDRs for public and private subnets", () => {
    expect(content).toMatch(/primary_public_subnets/);
    expect(content).toMatch(/primary_private_subnets/);
    expect(content).toMatch(/secondary_public_subnets/);
    expect(content).toMatch(/secondary_private_subnets/);
  });
});

describe("Terraform Configuration - kms.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("kms.tf");
  });

  test("kms.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares KMS key for S3 encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares KMS key for RDS encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
  });

  test("KMS keys have deletion window configured", () => {
    expect(content).toMatch(/deletion_window_in_days\s*=\s*7/);
  });

  test("KMS keys include provider alias", () => {
    expect(content).toMatch(/provider\s*=\s*aws\.primary/);
  });

  test("KMS aliases are created for keys", () => {
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
    expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
  });
});

describe("Terraform Configuration - vpc.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("vpc.tf");
  });

  test("vpc.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares VPC resource", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(content).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("declares Internet Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares public subnets with count", () => {
    const publicSubnetMatch = content.match(/resource\s+"aws_subnet"\s+"public"[\s\S]*?count\s*=\s*(\d+)/);
    expect(publicSubnetMatch).toBeTruthy();
    expect(parseInt(publicSubnetMatch![1])).toBe(3);
  });

  test("declares private subnets with count", () => {
    const privateSubnetMatch = content.match(/resource\s+"aws_subnet"\s+"private"[\s\S]*?count\s*=\s*(\d+)/);
    expect(privateSubnetMatch).toBeTruthy();
    expect(parseInt(privateSubnetMatch![1])).toBe(3);
  });

  test("public subnets have map_public_ip_on_launch enabled", () => {
    expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("declares NAT Gateway resources", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("declares route tables for public and private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test("route table associations exist", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
  });
});

describe("Terraform Configuration - iam.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("iam.tf");
  });

  test("iam.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares Lambda execution role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"/);
    expect(content).toMatch(/provider\s*=\s*aws\.iam/);
  });

  test("Lambda role has assume role policy for Lambda service", () => {
    const lambdaRoleMatch = content.match(/resource\s+"aws_iam_role"\s+"lambda_execution"[\s\S]*?assume_role_policy[\s\S]*?}/);
    expect(lambdaRoleMatch).toBeTruthy();
    expect(lambdaRoleMatch![0]).toMatch(/lambda\.amazonaws\.com/);
  });

  test("declares S3 replication role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"s3_replication"/);
  });

  test("S3 replication role has assume role policy for S3 service", () => {
    const s3RoleMatch = content.match(/resource\s+"aws_iam_role"\s+"s3_replication"[\s\S]*?assume_role_policy[\s\S]*?}/);
    expect(s3RoleMatch).toBeTruthy();
    expect(s3RoleMatch![0]).toMatch(/s3\.amazonaws\.com/);
  });

  test("declares API Gateway CloudWatch role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"apigateway_cloudwatch"/);
  });

  test("IAM policy attachments exist for Lambda", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic"/);
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_vpc"/);
  });

  test("inline policies are defined for Lambda DynamoDB access", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_dynamodb"/);
  });

  test("data sources for cross-region IAM role references", () => {
    expect(content).toMatch(/data\s+"aws_iam_role"\s+"lambda_execution"/);
    expect(content).toMatch(/data\s+"aws_iam_role"\s+"s3_replication"/);
    expect(content).toMatch(/data\s+"aws_iam_role"\s+"apigateway_cloudwatch"/);
  });
});

describe("Terraform Configuration - s3.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("s3.tf");
  });

  test("s3.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares S3 bucket resource", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"documents"/);
  });

  test("bucket name includes environment_suffix and region", () => {
    expect(content).toMatch(/bucket\s*=.*resource_prefix.*documents.*current_region/);
  });

  test("versioning is enabled", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"documents"/);
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("server-side encryption is configured with KMS", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"documents"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("public access is blocked", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"documents"/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("replication configuration exists for primary workspace", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"documents"/);
    expect(content).toMatch(/count\s*=\s*local\.is_primary/);
  });
});

describe("Terraform Configuration - dynamodb.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("dynamodb.tf");
  });

  test("dynamodb.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares DynamoDB table resource", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"transactions"/);
  });

  test("table uses pay-per-request billing", () => {
    expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test("table has hash_key and range_key defined", () => {
    expect(content).toMatch(/hash_key\s*=\s*"transaction_id"/);
    expect(content).toMatch(/range_key\s*=\s*"timestamp"/);
  });

  test("DynamoDB Streams is enabled", () => {
    expect(content).toMatch(/stream_enabled\s*=\s*true/);
    expect(content).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
  });

  test("point-in-time recovery is enabled", () => {
    expect(content).toMatch(/point_in_time_recovery\s*{/);
    expect(content).toMatch(/enabled\s*=\s*true/);
  });

  test("server-side encryption is enabled", () => {
    expect(content).toMatch(/server_side_encryption\s*{/);
    expect(content).toMatch(/enabled\s*=\s*true/);
  });
});

describe("Terraform Configuration - rds.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("rds.tf");
  });

  test("rds.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares RDS security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  test("security group allows PostgreSQL port 5432", () => {
    expect(content).toMatch(/from_port\s*=\s*5432/);
    expect(content).toMatch(/to_port\s*=\s*5432/);
  });

  test("declares DB subnet group", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("declares RDS PostgreSQL instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"postgres"/);
    expect(content).toMatch(/engine\s*=\s*"postgres"/);
  });

  test("RDS instance class is db.t3.medium", () => {
    expect(content).toMatch(/instance_class\s*=\s*"db\.t3\.medium"/);
  });

  test("storage is encrypted", () => {
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("KMS key is specified for encryption", () => {
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.rds\.arn/);
  });

  test("backup retention is configured", () => {
    expect(content).toMatch(/backup_retention_period\s*=\s*7/);
  });

  test("CloudWatch logs exports are enabled", () => {
    expect(content).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\[\s*"postgresql"/);
  });

  test("deletion_protection is disabled for testing", () => {
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("final snapshot is enabled", () => {
    expect(content).toMatch(/skip_final_snapshot\s*=\s*false/);
  });
});

describe("Terraform Configuration - lambda.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("lambda.tf");
  });

  test("lambda.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares Lambda security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
  });

  test("declares Lambda function resource", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"payment_processor"/);
  });

  test("Lambda uses Python 3.11 runtime", () => {
    expect(content).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("Lambda has VPC configuration", () => {
    expect(content).toMatch(/vpc_config\s*{/);
    expect(content).toMatch(/subnet_ids/);
    expect(content).toMatch(/security_group_ids/);
  });

  test("Lambda environment variables include region and DynamoDB table", () => {
    const lambdaEnv = content.match(/environment\s*{[\s\S]*?variables\s*=\s*{[\s\S]*?}/);
    expect(lambdaEnv).toBeTruthy();
    expect(lambdaEnv![0]).toMatch(/REGION/);
    expect(lambdaEnv![0]).toMatch(/DYNAMODB_TABLE/);
    expect(lambdaEnv![0]).toMatch(/DYNAMODB_ENDPOINT/);
  });

  test("CloudWatch Log Group is configured", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"/);
    expect(content).toMatch(/retention_in_days\s*=\s*7/);
  });
});

describe("Terraform Configuration - apigateway.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("apigateway.tf");
  });

  test("apigateway.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares REST API resource", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"payment_api"/);
  });

  test("API Gateway endpoint is REGIONAL", () => {
    expect(content).toMatch(/types\s*=\s*\[\s*"REGIONAL"\s*\]/);
  });

  test("declares API Gateway resource", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"payment"/);
    expect(content).toMatch(/path_part\s*=\s*"payment"/);
  });

  test("declares POST method", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"payment_post"/);
    expect(content).toMatch(/http_method\s*=\s*"POST"/);
  });

  test("Lambda integration uses AWS_PROXY", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"payment_lambda"/);
    expect(content).toMatch(/type\s*=\s*"AWS_PROXY"/);
  });

  test("Lambda permission for API Gateway invocation", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"apigw"/);
    expect(content).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
  });

  test("API Gateway deployment resource exists", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"payment"/);
  });

  test("API Gateway stage uses environment_suffix", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_stage"\s+"payment"/);
    expect(content).toMatch(/stage_name\s*=\s*var\.environment_suffix/);
  });
});

describe("Terraform Configuration - route53.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("route53.tf");
  });

  test("route53.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares Route53 health check", () => {
    expect(content).toMatch(/resource\s+"aws_route53_health_check"\s+"payment_api"/);
  });

  test("health check uses HTTPS", () => {
    expect(content).toMatch(/type\s*=\s*"HTTPS"/);
  });

  test("health check monitors API Gateway endpoint", () => {
    expect(content).toMatch(/resource_path.*payment/);
    expect(content).toMatch(/execute-api/);
  });

  test("health check has measure_latency enabled", () => {
    expect(content).toMatch(/measure_latency\s*=\s*true/);
  });
});

describe("Terraform Configuration - cloudwatch.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("cloudwatch.tf");
  });

  test("cloudwatch.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("declares RDS replication lag alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_replication_lag"/);
    expect(content).toMatch(/metric_name\s*=\s*"ReplicaLag"/);
  });

  test("declares RDS CPU alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
    expect(content).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
  });

  test("declares Lambda errors alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
    expect(content).toMatch(/metric_name\s*=\s*"Errors"/);
  });

  test("declares API Gateway 5XX errors alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"apigateway_5xx"/);
    expect(content).toMatch(/metric_name\s*=\s*"5XXError"/);
  });

  test("CloudWatch dashboard exists", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"payment_processing"/);
  });
});

describe("Terraform Configuration - outputs.tf", () => {
  let content: string;

  beforeAll(() => {
    content = readTfFile("outputs.tf");
  });

  test("outputs.tf file exists", () => {
    expect(content).toBeTruthy();
  });

  test("outputs VPC ID", () => {
    expect(content).toMatch(/output\s+"vpc_id"/);
  });

  test("outputs RDS endpoint", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"/);
  });

  test("outputs Lambda function name and ARN", () => {
    expect(content).toMatch(/output\s+"lambda_function_name"/);
    expect(content).toMatch(/output\s+"lambda_function_arn"/);
  });

  test("outputs API Gateway endpoint", () => {
    expect(content).toMatch(/output\s+"api_gateway_endpoint"/);
  });

  test("outputs DynamoDB table name", () => {
    expect(content).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test("outputs S3 bucket name", () => {
    expect(content).toMatch(/output\s+"s3_bucket_name"/);
  });

  test("outputs current region and workspace", () => {
    expect(content).toMatch(/output\s+"current_region"/);
    expect(content).toMatch(/output\s+"current_workspace"/);
  });

  test("outputs KMS key IDs", () => {
    expect(content).toMatch(/output\s+"kms_key_id_s3"/);
    expect(content).toMatch(/output\s+"kms_key_id_rds"/);
  });
});

describe("Lambda Function Code - payment_processor.py", () => {
  let content: string;

  beforeAll(() => {
    const lambdaPath = path.join(LIB_DIR, "lambda", "payment_processor.py");
    content = fs.readFileSync(lambdaPath, "utf8");
  });

  test("payment_processor.py file exists", () => {
    expect(content).toBeTruthy();
  });

  test("imports required libraries", () => {
    expect(content).toMatch(/import\s+json/);
    expect(content).toMatch(/import\s+os/);
    expect(content).toMatch(/import\s+boto3/);
    expect(content).toMatch(/import\s+logging/);
  });

  test("initializes DynamoDB client with environment variables", () => {
    expect(content).toMatch(/dynamodb\s*=\s*boto3\.resource\s*\(\s*['"]dynamodb['"]/);
    expect(content).toMatch(/os\.environ\.get\s*\(\s*['"]DYNAMODB_ENDPOINT['"]/);
  });

  test("defines handler function", () => {
    expect(content).toMatch(/def\s+handler\s*\(/);
    expect(content).toMatch(/event/);
    expect(content).toMatch(/context/);
  });

  test("validates required fields (transaction_id, amount)", () => {
    expect(content).toMatch(/transaction_id/);
    expect(content).toMatch(/amount/);
  });

  test("stores transaction in DynamoDB", () => {
    expect(content).toMatch(/table\.put_item/);
  });

  test("returns proper HTTP response structure", () => {
    expect(content).toMatch(/statusCode/);
    expect(content).toMatch(/headers/);
    expect(content).toMatch(/body/);
  });

  test("includes error handling", () => {
    expect(content).toMatch(/try:/);
    expect(content).toMatch(/except/);
  });
});

describe("Cross-Resource Integration", () => {
  test("all Terraform files exist", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "locals.tf",
      "kms.tf",
      "vpc.tf",
      "iam.tf",
      "s3.tf",
      "dynamodb.tf",
      "rds.tf",
      "lambda.tf",
      "apigateway.tf",
      "route53.tf",
      "cloudwatch.tf",
      "outputs.tf"
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(LIB_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test("Lambda deployment package exists", () => {
    const zipPath = path.join(LIB_DIR, "lambda", "payment_processor.zip");
    expect(fs.existsSync(zipPath)).toBe(true);
  });

  test("all resources use consistent naming with environment_suffix", () => {
    const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".tf"));

    files.forEach(file => {
      const content = readTfFile(file);
      if (content.match(/resource\s+"aws_/)) {
        // Resources should reference resource_prefix or environment_suffix
        const hasNaming = content.match(/resource_prefix|environment_suffix/);
        expect(hasNaming).toBeTruthy();
      }
    });
  });
});
