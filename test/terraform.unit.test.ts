// test/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Static analysis and structure validation - no Terraform commands executed

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Stack: tap_stack.tf - File Structure", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("file is not empty", () => {
    expect(content.length).toBeGreaterThan(0);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("has proper file header comment", () => {
    expect(content).toMatch(/tap_stack\.tf.*Telemedicine/);
  });
});

describe("Terraform Configuration Block", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares terraform block", () => {
    expect(content).toMatch(/terraform\s*{/);
  });

  test("specifies required_version", () => {
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
  });

  test("declares required_providers block", () => {
    expect(content).toMatch(/required_providers\s*{/);
  });

  test("declares aws provider with correct version", () => {
    expect(content).toMatch(/aws\s*=\s*{[^}]*source\s*=\s*"hashicorp\/aws"[^}]*version\s*=\s*"~>\s*5\.0"/s);
  });

  test("declares archive provider", () => {
    expect(content).toMatch(/archive\s*=\s*{[^}]*source\s*=\s*"hashicorp\/archive"/s);
  });

  test("declares random provider", () => {
    expect(content).toMatch(/random\s*=\s*{[^}]*source\s*=\s*"hashicorp\/random"/s);
  });
});

describe("Variable Declarations", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares env variable with validation", () => {
    expect(content).toMatch(/variable\s+"env"\s*{[^}]*validation\s*{/s);
    expect(content).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\],\s*var\.env\)/);
  });

  test("declares project_name variable", () => {
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares owner variable", () => {
    expect(content).toMatch(/variable\s+"owner"\s*{/);
  });

  test("declares cost_center variable", () => {
    expect(content).toMatch(/variable\s+"cost_center"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(content).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(content).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
  });

  test("declares user_pool_id variable", () => {
    expect(content).toMatch(/variable\s+"user_pool_id"\s*{/);
  });

  test("declares api_name variable", () => {
    expect(content).toMatch(/variable\s+"api_name"\s*{/);
  });

  test("declares stage_name variable", () => {
    expect(content).toMatch(/variable\s+"stage_name"\s*{/);
  });

  test("declares appointments_table variable", () => {
    expect(content).toMatch(/variable\s+"appointments_table"\s*{/);
  });

  test("declares sessions_table variable", () => {
    expect(content).toMatch(/variable\s+"sessions_table"\s*{/);
  });

  test("declares prescriptions_table variable", () => {
    expect(content).toMatch(/variable\s+"prescriptions_table"\s*{/);
  });

  test("declares policies_table variable", () => {
    expect(content).toMatch(/variable\s+"policies_table"\s*{/);
  });

  test("declares profiles_table variable", () => {
    expect(content).toMatch(/variable\s+"profiles_table"\s*{/);
  });

  test("declares compliance_table variable", () => {
    expect(content).toMatch(/variable\s+"compliance_table"\s*{/);
  });

  test("declares documents_table variable", () => {
    expect(content).toMatch(/variable\s+"documents_table"\s*{/);
  });

  test("declares billing_mode variable", () => {
    expect(content).toMatch(/variable\s+"billing_mode"\s*{/);
  });

  test("declares request_handler_memory variable", () => {
    expect(content).toMatch(/variable\s+"request_handler_memory"\s*{/);
  });

  test("declares runtime variable", () => {
    expect(content).toMatch(/variable\s+"runtime"\s*{/);
  });

  test("declares node_type variable for Redis", () => {
    expect(content).toMatch(/variable\s+"node_type"\s*{/);
  });

  test("declares cluster_id variable for Aurora", () => {
    expect(content).toMatch(/variable\s+"cluster_identifier"\s*{/);
  });

  test("declares master_username variable", () => {
    expect(content).toMatch(/variable\s+"master_username"\s*{/);
  });

  test("declares scheduled_topic variable", () => {
    expect(content).toMatch(/variable\s+"scheduled_topic"\s*{/);
  });

  test("declares patient_notifications_queue variable", () => {
    expect(content).toMatch(/variable\s+"patient_notifications_queue"\s*{/);
  });

  test("declares audit_logs_bucket variable", () => {
    expect(content).toMatch(/variable\s+"audit_logs_bucket"\s*{/);
  });

  test("declares documents_bucket variable", () => {
    expect(content).toMatch(/variable\s+"documents_bucket"\s*{/);
  });

  test("declares prescription_workflow_name variable", () => {
    expect(content).toMatch(/variable\s+"prescription_workflow_name"\s*{/);
  });

  test("declares phi_encryption_key_alias variable", () => {
    expect(content).toMatch(/variable\s+"phi_encryption_key_alias"\s*{/);
  });
});

describe("Locals Block", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares locals block", () => {
    expect(content).toMatch(/locals\s*{/);
  });

  test("defines prefix local for resource naming", () => {
    expect(content).toMatch(/prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.env\}-\$\{var\.pr_number\}"/);
  });

  test("defines tags local with common tags", () => {
    expect(content).toMatch(/tags\s*=\s*merge\(\s*var\.common_tags/);
    expect(content).toMatch(/Environment\s*=\s*var\.env/);
    expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    expect(content).toMatch(/Compliance\s*=\s*"HIPAA"/);
  });

  test("defines env_config local for environment-specific configs", () => {
    expect(content).toMatch(/env_config\s*=\s*{/);
    expect(content).toMatch(/dev\s*=\s*{/);
    expect(content).toMatch(/staging\s*=\s*{/);
    expect(content).toMatch(/prod\s*=\s*{/);
  });

  test("defines lambda_env_vars local", () => {
    expect(content).toMatch(/lambda_env_vars\s*=\s*{/);
    expect(content).toMatch(/KMS_KEY_ID\s*=\s*aws_kms_key\.phi_encryption\.id/);
  });
});

describe("Data Sources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_availability_zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });

  test("declares aws_cognito_user_pools data source", () => {
    expect(content).toMatch(/data\s+"aws_cognito_user_pools"\s+"existing"\s*{/);
  });

  test("declares aws_caller_identity data source", () => {
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("declares archive_file data source for lambda", () => {
    expect(content).toMatch(/data\s+"archive_file"\s+"lambda_code"\s*{/);
  });
});

describe("VPC and Networking Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_vpc resource", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("declares aws_internet_gateway resource", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("declares aws_subnet public subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
  });

  test("declares aws_subnet private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
  });

  test("declares aws_nat_gateway resource", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
  });

  test("declares aws_eip resource for NAT", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
  });

  test("declares aws_route_table for public", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
  });

  test("declares aws_route_table for private", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });

  test("declares security groups", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda_vpc"\s*{/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*{/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
  });

  test("declares VPC endpoints", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sns"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"secretsmanager"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"states"\s*{/);
  });
});

describe("KMS Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_kms_key for PHI encryption", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"phi_encryption"\s*{/);
  });

  test("declares aws_kms_key for CloudWatch Logs", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch_logs"\s*{/);
  });
});

describe("Secrets Manager Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares random_password for Aurora", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"aurora_master"\s*{/);
  });

  test("declares aws_secretsmanager_secret for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_master"\s*{/);
  });

  test("declares random_password for Redis", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"redis_auth"\s*{/);
  });

  test("declares aws_secretsmanager_secret for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"\s*{/);
  });
});

describe("S3 Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_s3_bucket for audit_logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"audit_logs"\s*{/);
  });

  test("declares aws_s3_bucket for documents", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"documents"\s*{/);
  });

  test("declares S3 bucket encryption configuration", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit_logs"\s*{/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"documents"\s*{/);
  });

  test("declares S3 bucket versioning", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"audit_logs"\s*{/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"documents"\s*{/);
  });

  test("declares S3 bucket lifecycle configuration for audit_logs", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"audit_logs"\s*{/);
  });

  test("declares S3 bucket public access block", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"audit_logs"\s*{/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"documents"\s*{/);
  });
});

describe("DynamoDB Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_dynamodb_table for appointments", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"appointments"\s*{/);
  });

  test("declares aws_dynamodb_table for sessions", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"sessions"\s*{/);
  });

  test("declares aws_dynamodb_table for prescriptions", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"prescriptions"\s*{/);
  });

  test("declares aws_dynamodb_table for policies", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"policies"\s*{/);
  });

  test("declares aws_dynamodb_table for profiles", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"profiles"\s*{/);
  });

  test("declares aws_dynamodb_table for compliance", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"compliance"\s*{/);
  });

  test("declares aws_dynamodb_table for documents", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"documents"\s*{/);
  });

  test("appointments table has stream enabled", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"appointments"[\s\S]*?stream_enabled\s*=\s*true/s);
  });

  test("tables have encryption enabled", () => {
    expect(content).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
  });
});

describe("Redis Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_elasticache_subnet_group for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*{/);
  });

  test("declares aws_elasticache_replication_group for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
  });

  test("Redis has encryption enabled", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"[\s\S]*?at_rest_encryption_enabled\s*=\s*true/s);
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"[\s\S]*?transit_encryption_enabled\s*=\s*var\.transit_encryption_enabled/s);
  });
});

describe("Aurora Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_db_subnet_group for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*{/);
  });

  test("declares aws_rds_cluster for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
  });

  test("declares aws_rds_cluster_instance for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*{/);
  });

  test("Aurora cluster uses aurora-postgresql engine", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?engine\s*=\s*"aurora-postgresql"/s);
  });

  test("Aurora cluster has storage encryption enabled", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?storage_encrypted\s*=\s*true/s);
  });
});

describe("SNS Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_sns_topic for appointment_scheduled", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"appointment_scheduled"\s*{/);
  });

  test("declares aws_sns_topic for session_events", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"session_events"\s*{/);
  });

  test("declares aws_sns_topic for prescription_approved", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"prescription_approved"\s*{/);
  });

  test("SNS topic uses KMS encryption", () => {
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.phi_encryption\.id/);
  });
});

describe("SQS Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_sqs_queue for patient_notifications", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"patient_notifications"\s*{/);
  });

  test("declares aws_sqs_queue for billing", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"billing"\s*{/);
  });

  test("declares aws_sqs_queue for pharmacy_fulfillment (FIFO)", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"pharmacy_fulfillment"\s*{/);
    expect(content).toMatch(/fifo_queue\s*=\s*true/);
  });

  test("declares SNS to SQS subscriptions", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"patient_notifications"\s*{/);
  });
});

describe("Lambda Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_lambda_function for request_handler", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"request_handler"\s*{/);
  });

  test("declares aws_lambda_function for scheduler", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"scheduler"\s*{/);
  });

  test("declares aws_lambda_function for prescription_handler", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"prescription_handler"\s*{/);
  });

  test("declares aws_lambda_function for approval_checker", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"approval_checker"\s*{/);
  });

  test("declares Lambda event source mappings", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"appointments_stream"\s*{/);
  });

  test("declares CloudWatch log groups for Lambda functions", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*{/);
  });
});

describe("API Gateway Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_api_gateway_rest_api", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"main"\s*{/);
  });

  test("declares aws_api_gateway_authorizer", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_authorizer"\s+"cognito"\s*{/);
  });

  test("declares aws_api_gateway_deployment", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"main"\s*{/);
  });

  test("declares aws_api_gateway_stage", () => {
    expect(content).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"\s*{/);
  });
});

describe("Step Functions Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_sfn_state_machine for prescription_approval", () => {
    expect(content).toMatch(/resource\s+"aws_sfn_state_machine"\s+"prescription_approval"\s*{/);
  });

  test("declares CloudWatch log group for Step Functions", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions_logs"\s*{/);
  });
});

describe("EventBridge Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_cloudwatch_event_rule for compliance_check", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"compliance_check"\s*{/);
  });

  test("declares aws_cloudwatch_event_rule for appointment_reminders", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"appointment_reminders"\s*{/);
  });
});

describe("CloudWatch Alarms", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares alarm for API auth failures", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_auth_failures"\s*{/);
  });

  test("declares alarm for Lambda scheduler errors", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_scheduler_errors"\s*{/);
  });

  test("declares alarm for DynamoDB throttled writes", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttled_writes"\s*{/);
  });
});

describe("Output Declarations", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares api_gateway_url output", () => {
    expect(content).toMatch(/output\s+"api_gateway_url"\s*{/);
  });

  test("declares dynamodb_tables output", () => {
    expect(content).toMatch(/output\s+"dynamodb_tables"\s*{/);
  });

  test("declares sns_topic_arns output", () => {
    expect(content).toMatch(/output\s+"sns_topic_arns"\s*{/);
  });

  test("declares sqs_queue_urls output", () => {
    expect(content).toMatch(/output\s+"sqs_queue_urls"\s*{/);
  });

  test("declares aurora_endpoints output", () => {
    expect(content).toMatch(/output\s+"aurora_endpoints"\s*{/);
  });

  test("declares redis_endpoint output", () => {
    expect(content).toMatch(/output\s+"redis_endpoint"\s*{/);
  });

  test("declares step_functions_arn output", () => {
    expect(content).toMatch(/output\s+"step_functions_arn"\s*{/);
  });

  test("declares lambda_function_arns output", () => {
    expect(content).toMatch(/output\s+"lambda_function_arns"\s*{/);
  });

  test("declares s3_bucket_names output", () => {
    expect(content).toMatch(/output\s+"s3_bucket_names"\s*{/);
  });

  test("declares kms_key_arn output", () => {
    expect(content).toMatch(/output\s+"kms_key_arn"\s*{/);
  });
});

describe("Security and Best Practices", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("all S3 buckets have encryption configuration", () => {
    const bucketResources = content.match(/resource\s+"aws_s3_bucket"\s+"\w+"\s*{/g) || [];
    const encryptionResources = content.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || [];
    // Should have encryption for each bucket
    expect(encryptionResources.length).toBeGreaterThanOrEqual(bucketResources.length);
  });

  test("DynamoDB tables have encryption enabled", () => {
    expect(content).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
  });

  test("Aurora cluster is not publicly accessible", () => {
    expect(content).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.aurora\.name/);
  });

  test("Redis is in private subnets", () => {
    expect(content).toMatch(/subnet_group_name\s*=\s*aws_elasticache_subnet_group\.redis\.name/);
  });

  test("Lambda functions in VPC use private subnets", () => {
    expect(content).toMatch(/vpc_config\s*{[^}]*subnet_ids\s*=\s*aws_subnet\.private/);
  });

  test("secrets are stored in Secrets Manager", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_master"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"/);
  });
});
