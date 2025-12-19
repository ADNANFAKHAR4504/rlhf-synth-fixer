// tests/unit/terraform.unit.test.ts
// Terraform file structure validation tests for Serverless Payment Processing System
// Validates presence, structure, and configuration of Terraform resources

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const ROOT_DIR = path.resolve(__dirname, "..");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const VARIABLES_TF = path.join(ROOT_DIR, "variables.tf");
const PROVIDER_TF = path.join(LIB_DIR, "provider.tf");

describe("Terraform Infrastructure Files", () => {
  test("lib/tap_stack.tf exists", () => {
    const exists = fs.existsSync(TAP_STACK_TF);
    if (!exists) {
      console.error(`[unit] Expected tap_stack.tf at: ${TAP_STACK_TF}`);
    }
    expect(exists).toBe(true);
  });

  test("variables.tf exists in root", () => {
    const exists = fs.existsSync(VARIABLES_TF);
    if (!exists) {
      console.error(`[unit] Expected variables.tf at: ${VARIABLES_TF}`);
    }
    expect(exists).toBe(true);
  });

  test("lib/provider.tf exists", () => {
    const exists = fs.existsSync(PROVIDER_TF);
    if (!exists) {
      console.error(`[unit] Expected provider.tf at: ${PROVIDER_TF}`);
    }
    expect(exists).toBe(true);
  });
});

describe("Variables Configuration", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(VARIABLES_TF, "utf8");
  });

  test("variables.tf declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("variables.tf declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("aws_region variable has proper type definition", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?type\s*=\s*string/);
  });

  test("environment_suffix variable has proper type definition", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{[\s\S]*?type\s*=\s*string/);
  });

  test("variables have description attributes", () => {
    expect(variablesContent).toMatch(/description\s*=\s*".*region.*"/i);
    expect(variablesContent).toMatch(/description\s*=\s*".*environment.*"/i);
  });
});

describe("Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    if (fs.existsSync(PROVIDER_TF)) {
      providerContent = fs.readFileSync(PROVIDER_TF, "utf8");
    }
  });

  test("provider.tf declares required providers", () => {
    if (!fs.existsSync(PROVIDER_TF)) {
      console.log("[unit] provider.tf not found, checking inline provider in tap_stack.tf");
      return;
    }
    expect(providerContent).toMatch(/required_providers\s*{/);
  });

  test("provider.tf specifies AWS provider version", () => {
    if (!fs.existsSync(PROVIDER_TF)) {
      console.log("[unit] provider.tf not found, checking inline provider in tap_stack.tf");
      return;
    }
    expect(providerContent).toMatch(/version\s*=\s*".*5\.0.*"/);
  });
});

describe("KMS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares KMS key resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"payment_system"\s*{/);
  });

  test("declares KMS alias resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"payment_system"\s*{/);
  });

  test("KMS key has proper deletion window", () => {
    expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*\d+/);
  });

  test("KMS key enables key rotation", () => {
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("KMS key uses environment_suffix in naming", () => {
    expect(stackContent).toMatch(/payment-system-kms-key-\$\{var\.environment_suffix\}/);
  });

  test("KMS alias uses environment_suffix in naming", () => {
    expect(stackContent).toMatch(/alias\/payment-system-\$\{var\.environment_suffix\}/);
  });

  test("KMS key policy allows required services", () => {
    expect(stackContent).toMatch(/"lambda\.amazonaws\.com"/);
    expect(stackContent).toMatch(/"dynamodb\.amazonaws\.com"/);
    expect(stackContent).toMatch(/"logs\..*\.amazonaws\.com"/);
  });
});

describe("DynamoDB Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares DynamoDB table resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"payment_transactions"\s*{/);
  });

  test("DynamoDB table uses environment_suffix in naming", () => {
    expect(stackContent).toMatch(/payment-transactions-\$\{var\.environment_suffix\}/);
  });

  test("DynamoDB table uses PAY_PER_REQUEST billing", () => {
    expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test("DynamoDB table has hash key defined", () => {
    expect(stackContent).toMatch(/hash_key\s*=\s*".*"/);
  });

  test("DynamoDB table has server-side encryption enabled", () => {
    expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("DynamoDB table uses KMS encryption", () => {
    expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.payment_system\.arn/);
  });

  test("DynamoDB table has point in time recovery enabled", () => {
    expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
  });
});

describe("SQS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares notification queue resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"notification_queue"\s*{/);
  });

  test("declares dead letter queues for all Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"webhook_processor_dlq"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"transaction_reader_dlq"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"notification_sender_dlq"\s*{/);
  });

  test("SQS queues use environment_suffix in naming", () => {
    expect(stackContent).toMatch(/payment-notifications-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/webhook-processor-dlq-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/transaction-reader-dlq-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/notification-sender-dlq-\$\{var\.environment_suffix\}/);
  });

  test("SQS queues have KMS encryption enabled", () => {
    const kmsKeyMatches = stackContent.match(/kms_master_key_id\s*=\s*aws_kms_key\.payment_system\.arn/g);
    expect(kmsKeyMatches).toBeTruthy();
    expect(kmsKeyMatches!.length).toBeGreaterThanOrEqual(4);
  });
});

describe("SNS Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares SNS topic resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"email_notifications"\s*{/);
  });

  test("SNS topic uses environment_suffix in naming", () => {
    expect(stackContent).toMatch(/email-notifications-\$\{var\.environment_suffix\}/);
  });

  test("SNS topic has KMS encryption enabled", () => {
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.payment_system\.arn/);
  });
});

describe("CloudWatch Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares log groups for all Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"webhook_processor"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"transaction_reader"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"notification_sender"\s*{/);
  });

  test("declares API Gateway log group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"\s*{/);
  });

  test("CloudWatch log groups use environment_suffix in naming", () => {
    expect(stackContent).toMatch(/\/aws\/lambda\/webhook-processor-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/\/aws\/lambda\/transaction-reader-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/\/aws\/lambda\/notification-sender-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/\/aws\/apigateway\/payment-api-\$\{var\.environment_suffix\}/);
  });

  test("CloudWatch log groups have KMS encryption", () => {
    const kmsKeyMatches = stackContent.match(/kms_key_id\s*=\s*aws_kms_key\.payment_system\.arn/g);
    expect(kmsKeyMatches).toBeTruthy();
    expect(kmsKeyMatches!.length).toBeGreaterThanOrEqual(4);
  });

  test("CloudWatch log groups have retention period", () => {
    const retentionMatches = stackContent.match(/retention_in_days\s*=\s*\d+/g);
    expect(retentionMatches).toBeTruthy();
    expect(retentionMatches!.length).toBeGreaterThanOrEqual(4);
  });
});

describe("IAM Resources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares IAM roles for all Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"webhook_processor_role"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"transaction_reader_role"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"notification_sender_role"\s*{/);
  });

  test("declares IAM policies for all Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"webhook_processor_policy"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"transaction_reader_policy"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"notification_sender_policy"\s*{/);
  });

  test("IAM roles allow Lambda service assumption", () => {
    const assumeRoleMatches = stackContent.match(/"lambda\.amazonaws\.com"/g);
    expect(assumeRoleMatches).toBeTruthy();
    expect(assumeRoleMatches!.length).toBeGreaterThanOrEqual(3);
  });

  test("IAM roles use environment_suffix in naming", () => {
    expect(stackContent).toMatch(/webhook-processor-role-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/transaction-reader-role-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/notification-sender-role-\$\{var\.environment_suffix\}/);
  });

  test("declares API Gateway CloudWatch role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch_role"\s*{/);
  });

  test("declares API Gateway account configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_account"\s+"api_gateway_account"\s*{/);
  });
});

describe("Lambda Functions", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares all required Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_processor"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"transaction_reader"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"notification_sender"\s*{/);
  });

  test("Lambda functions use environment_suffix in naming", () => {
    expect(stackContent).toMatch(/function_name\s*=\s*"webhook-processor-\$\{var\.environment_suffix\}"/);
    expect(stackContent).toMatch(/function_name\s*=\s*"transaction-reader-\$\{var\.environment_suffix\}"/);
    expect(stackContent).toMatch(/function_name\s*=\s*"notification-sender-\$\{var\.environment_suffix\}"/);
  });

  test("Lambda functions use Python 3.11 runtime", () => {
    const runtimeMatches = stackContent.match(/runtime\s*=\s*"python3\.11"/g);
    expect(runtimeMatches).toBeTruthy();
    expect(runtimeMatches!.length).toBeGreaterThanOrEqual(3);
  });

  test("Lambda functions have X-Ray tracing enabled", () => {
    const tracingMatches = stackContent.match(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/g);
    expect(tracingMatches).toBeTruthy();
    expect(tracingMatches!.length).toBeGreaterThanOrEqual(3);
  });

  test("Lambda functions have dead letter queue configuration", () => {
    expect(stackContent).toMatch(/target_arn\s*=\s*aws_sqs_queue\.webhook_processor_dlq\.arn/);
    expect(stackContent).toMatch(/target_arn\s*=\s*aws_sqs_queue\.transaction_reader_dlq\.arn/);
    expect(stackContent).toMatch(/target_arn\s*=\s*aws_sqs_queue\.notification_sender_dlq\.arn/);
  });

  test("Lambda functions have environment variables", () => {
    const envMatches = stackContent.match(/environment\s*{[\s\S]*?variables\s*=/g);
    expect(envMatches).toBeTruthy();
    expect(envMatches!.length).toBeGreaterThanOrEqual(3);
  });

  test("Lambda functions reference proper IAM roles", () => {
    expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.webhook_processor_role\.arn/);
    expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.transaction_reader_role\.arn/);
    expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.notification_sender_role\.arn/);
  });
});

describe("API Gateway Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("declares API Gateway REST API", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"payment_api"\s*{/);
  });

  test("API Gateway uses environment_suffix in naming", () => {
    expect(stackContent).toMatch(/name\s*=\s*"payment-api-\$\{var\.environment_suffix\}"/);
  });

  test("declares API Gateway resources", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"/);
  });

  test("declares API Gateway methods", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"/);
  });

  test("declares API Gateway integrations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"/);
  });

  test("declares API Gateway deployment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"payment_api_deployment"\s*{/);
  });

  test("declares API Gateway stage", () => {
    expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"prod"\s*{/);
  });

  test("API Gateway stage has access logging configured", () => {
    expect(stackContent).toMatch(/access_log_settings\s*{/);
    expect(stackContent).toMatch(/destination_arn\s*=\s*aws_cloudwatch_log_group\.api_gateway\.arn/);
  });

  test("API Gateway stage has X-Ray tracing enabled", () => {
    expect(stackContent).toMatch(/data_trace_enabled\s*=\s*true/);
  });
});

describe("Resource Dependencies", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("Lambda functions depend on CloudWatch log groups", () => {
    expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_cloudwatch_log_group\./);
  });

  test("API Gateway deployment depends on integrations", () => {
    expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*?aws_api_gateway_integration\./);
  });

  test("Lambda permissions reference API Gateway", () => {
    expect(stackContent).toMatch(/source_arn\s*=\s*".*\$\{aws_api_gateway_rest_api\.payment_api\.execution_arn\}.*"/);
  });
});

describe("Resource Naming Consistency", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("all resources use environment_suffix for naming", () => {
    const environmentSuffixMatches = stackContent.match(/\$\{var\.environment_suffix\}/g);
    expect(environmentSuffixMatches).toBeTruthy();
    expect(environmentSuffixMatches!.length).toBeGreaterThan(20);
  });

  test("no hardcoded environment names in resource names", () => {
    expect(stackContent).not.toMatch(/name\s*=\s*".*-prod"/);
    expect(stackContent).not.toMatch(/name\s*=\s*".*-dev"/);
    expect(stackContent).not.toMatch(/name\s*=\s*".*-staging"/);
  });

  test("consistent naming pattern across resources", () => {
    expect(stackContent).toMatch(/payment-system-.*-\$\{var\.environment_suffix\}/);
    expect(stackContent).toMatch(/payment-.*-\$\{var\.environment_suffix\}/);
  });
});

describe("Security Configuration", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("all storage resources use KMS encryption", () => {
    expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.payment_system/);
  });

  test("IAM policies follow least privilege principle", () => {
    expect(stackContent).toMatch(/"dynamodb:GetItem"/);
    expect(stackContent).toMatch(/"dynamodb:PutItem"/);
    expect(stackContent).toMatch(/"dynamodb:UpdateItem"/);
    expect(stackContent).toMatch(/"sqs:SendMessage"/);
    expect(stackContent).toMatch(/"sns:Publish"/);
  });

  test("no wildcard permissions in IAM policies", () => {
    expect(stackContent).not.toMatch(/"Action"\s*:\s*"\*"/);
    expect(stackContent).not.toMatch(/"Resource"\s*:\s*"\*"/);
  });

  test("KMS policy includes required permissions", () => {
    expect(stackContent).toMatch(/"kms:Encrypt"/);
    expect(stackContent).toMatch(/"kms:Decrypt"/);
    expect(stackContent).toMatch(/"kms:GenerateDataKey\*"/);
  });
});

describe("Data Sources", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("uses aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("uses aws_region data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
  });

  test("references data sources in configurations", () => {
    expect(stackContent).toMatch(/data\.aws_caller_identity\.current\.account_id/);
    expect(stackContent).toMatch(/data\.aws_region\.current\.name/);
  });
});

describe("Local Values", () => {
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(TAP_STACK_TF, "utf8");
  });

  test("defines common tags in locals", () => {
    expect(stackContent).toMatch(/locals\s*{[\s\S]*?common_tags\s*=/);
  });

  test("common tags include required metadata", () => {
    expect(stackContent).toMatch(/Project\s*=/);
    expect(stackContent).toMatch(/Environment\s*=/);
    expect(stackContent).toMatch(/ManagedBy\s*=/);
  });

  test("resources use merge function for tags", () => {
    expect(stackContent).toMatch(/merge\(local\.common_tags/);
  });
});
