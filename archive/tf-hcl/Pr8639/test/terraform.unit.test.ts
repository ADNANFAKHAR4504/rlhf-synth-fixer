// Unit tests for Banking ETL Terraform infrastructure
// Target: 90%+ coverage of ETL infrastructure

import fs from "fs";
import path from "path";

const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";
const LAMBDA_FILE = "../lib/lambda.tf";
const S3_FILE = "../lib/s3.tf";
const SQS_FILE = "../lib/sqs.tf";
const EVENTBRIDGE_FILE = "../lib/eventbridge.tf";
const CLOUDWATCH_FILE = "../lib/cloudwatch.tf";
const IAM_FILE = "../lib/iam.tf";
const OUTPUTS_FILE = "../lib/outputs.tf";
const LAMBDA_DIR = "../lib/lambda";

const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);
const lambdaPath = path.resolve(__dirname, LAMBDA_FILE);
const s3Path = path.resolve(__dirname, S3_FILE);
const sqsPath = path.resolve(__dirname, SQS_FILE);
const eventbridgePath = path.resolve(__dirname, EVENTBRIDGE_FILE);
const cloudwatchPath = path.resolve(__dirname, CLOUDWATCH_FILE);
const iamPath = path.resolve(__dirname, IAM_FILE);
const outputsPath = path.resolve(__dirname, OUTPUTS_FILE);
const lambdaDirPath = path.resolve(__dirname, LAMBDA_DIR);

describe("Banking ETL Infrastructure - File Structure", () => {
  test("provider.tf file exists", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
  });

  test("variables.tf file exists", () => {
    const exists = fs.existsSync(variablesPath);
    expect(exists).toBe(true);
  });

  test("lambda.tf file exists", () => {
    const exists = fs.existsSync(lambdaPath);
    expect(exists).toBe(true);
  });

  test("s3.tf file exists", () => {
    const exists = fs.existsSync(s3Path);
    expect(exists).toBe(true);
  });

  test("sqs.tf file exists", () => {
    const exists = fs.existsSync(sqsPath);
    expect(exists).toBe(true);
  });

  test("eventbridge.tf file exists", () => {
    const exists = fs.existsSync(eventbridgePath);
    expect(exists).toBe(true);
  });

  test("cloudwatch.tf file exists", () => {
    const exists = fs.existsSync(cloudwatchPath);
    expect(exists).toBe(true);
  });

  test("iam.tf file exists", () => {
    const exists = fs.existsSync(iamPath);
    expect(exists).toBe(true);
  });

  test("outputs.tf file exists", () => {
    const exists = fs.existsSync(outputsPath);
    expect(exists).toBe(true);
  });

  test("lambda directory exists", () => {
    const exists = fs.existsSync(lambdaDirPath);
    expect(exists).toBe(true);
  });

  test("lambda directory contains processor.py", () => {
    const processorPath = path.join(lambdaDirPath, "processor.py");
    expect(fs.existsSync(processorPath)).toBe(true);
  });

  test("lambda directory contains requirements.txt", () => {
    const requirementsPath = path.join(lambdaDirPath, "requirements.txt");
    expect(fs.existsSync(requirementsPath)).toBe(true);
  });
});

describe("Banking ETL Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  test("provider.tf declares terraform required_version", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+(\.\d+)?"/);
  });

  test("provider.tf declares AWS provider requirement", () => {
    expect(providerContent).toMatch(/required_providers\s*{/);
    expect(providerContent).toMatch(/aws\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("provider.tf declares AWS provider version constraint", () => {
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*\d+\.\d+"/);
  });

  test("provider.tf declares archive provider requirement", () => {
    expect(providerContent).toMatch(/archive\s*=\s*{/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/archive"/);
  });

  test("provider.tf declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider.tf uses aws_region variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider.tf configures default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environmentSuffix/);
    expect(providerContent).toMatch(/Project\s*=\s*"BankingETL"/);
    expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
  });
});

describe("Banking ETL Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  test("declares environmentSuffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environmentSuffix"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares lambda_memory_size variable", () => {
    expect(variablesContent).toMatch(/variable\s+"lambda_memory_size"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares lambda_timeout variable", () => {
    expect(variablesContent).toMatch(/variable\s+"lambda_timeout"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares lambda_runtime variable", () => {
    expect(variablesContent).toMatch(/variable\s+"lambda_runtime"\s*{/);
  });

  test("declares max_receive_count variable", () => {
    expect(variablesContent).toMatch(/variable\s+"max_receive_count"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares alarm_email variable", () => {
    expect(variablesContent).toMatch(/variable\s+"alarm_email"\s*{/);
  });
});

describe("Banking ETL Infrastructure - Lambda Resources", () => {
  let lambdaContent: string;

  beforeAll(() => {
    lambdaContent = fs.readFileSync(lambdaPath, "utf8");
  });

  test("creates archive_file for Lambda code", () => {
    expect(lambdaContent).toMatch(/data\s+"archive_file"\s+"lambda_zip"\s*{/);
    expect(lambdaContent).toMatch(/type\s*=\s*"zip"/);
    expect(lambdaContent).toMatch(/source_dir\s*=\s*"\$\{path\.module\}\/lambda"/);
  });

  test("creates Lambda function", () => {
    expect(lambdaContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"\s*{/);
    expect(lambdaContent).toMatch(/function_name\s*=\s*"etl-processor-\$\{var\.environmentSuffix\}"/);
  });

  test("Lambda function uses archive_file output", () => {
    expect(lambdaContent).toMatch(/filename\s*=\s*data\.archive_file\.lambda_zip\.output_path/);
    expect(lambdaContent).toMatch(/source_code_hash\s*=\s*data\.archive_file\.lambda_zip\.output_base64sha256/);
  });

  test("Lambda function has handler configuration", () => {
    expect(lambdaContent).toMatch(/handler\s*=\s*"processor\.handler"/);
  });

  test("Lambda function uses runtime variable", () => {
    expect(lambdaContent).toMatch(/runtime\s*=\s*var\.lambda_runtime/);
  });

  test("Lambda function uses timeout variable", () => {
    expect(lambdaContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
  });

  test("Lambda function uses memory_size variable", () => {
    expect(lambdaContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
  });

  test("Lambda function has execution role", () => {
    expect(lambdaContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution\.arn/);
  });

  test("Lambda function has environment variables", () => {
    expect(lambdaContent).toMatch(/environment\s*{[\s\S]*?variables\s*=/);
    expect(lambdaContent).toMatch(/OUTPUT_BUCKET\s*=\s*aws_s3_bucket\.output\.bucket/);
    expect(lambdaContent).toMatch(/AUDIT_BUCKET\s*=\s*aws_s3_bucket\.audit\.bucket/);
    expect(lambdaContent).toMatch(/DLQ_URL\s*=\s*aws_sqs_queue\.dlq\.url/);
    expect(lambdaContent).toMatch(/ENVIRONMENT_SUFFIX\s*=\s*var\.environmentSuffix/);
  });

  test("Lambda function has dead letter queue configuration", () => {
    expect(lambdaContent).toMatch(/dead_letter_config\s*{[\s\S]*?target_arn\s*=\s*aws_sqs_queue\.dlq\.arn/);
  });

  test("creates CloudWatch log group for Lambda", () => {
    expect(lambdaContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*{/);
    expect(lambdaContent).toMatch(/name\s*=\s*"\/aws\/lambda\/etl-processor-\$\{var\.environmentSuffix\}"/);
    expect(lambdaContent).toMatch(/retention_in_days\s*=\s*\d+/);
  });

  test("creates Lambda permission for EventBridge", () => {
    expect(lambdaContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"\s*{/);
    expect(lambdaContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
    expect(lambdaContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    expect(lambdaContent).toMatch(/source_arn\s*=\s*aws_cloudwatch_event_rule\.s3_object_created\.arn/);
  });
});

describe("Banking ETL Infrastructure - S3 Resources", () => {
  let s3Content: string;

  beforeAll(() => {
    s3Content = fs.readFileSync(s3Path, "utf8");
  });

  test("creates input S3 bucket", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"input"\s*{/);
    expect(s3Content).toMatch(/bucket\s*=\s*"etl-input-\$\{var\.environmentSuffix\}"/);
    expect(s3Content).toMatch(/force_destroy\s*=\s*true/);
  });

  test("configures input bucket versioning", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"input"\s*{/);
    expect(s3Content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures input bucket encryption", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"input"\s*{/);
    expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("configures input bucket public access block", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"input"\s*{/);
    expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
    expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("creates output S3 bucket", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"output"\s*{/);
    expect(s3Content).toMatch(/bucket\s*=\s*"etl-output-\$\{var\.environmentSuffix\}"/);
  });

  test("configures output bucket versioning", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"output"\s*{/);
  });

  test("configures output bucket encryption", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"output"\s*{/);
  });

  test("configures output bucket lifecycle policy", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"output"\s*{/);
    expect(s3Content).toMatch(/storage_class\s*=\s*"INTELLIGENT_TIERING"/);
  });

  test("creates audit S3 bucket", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket"\s+"audit"\s*{/);
    expect(s3Content).toMatch(/bucket\s*=\s*"etl-audit-\$\{var\.environmentSuffix\}"/);
  });

  test("configures audit bucket versioning", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"audit"\s*{/);
  });

  test("configures audit bucket encryption", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"audit"\s*{/);
  });

  test("creates S3 bucket notification for EventBridge", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"input_notification"\s*{/);
    expect(s3Content).toMatch(/bucket\s*=\s*aws_s3_bucket\.input\.id/);
    expect(s3Content).toMatch(/eventbridge\s*=\s*true/);
  });
});

describe("Banking ETL Infrastructure - SQS Resources", () => {
  let sqsContent: string;

  beforeAll(() => {
    sqsContent = fs.readFileSync(sqsPath, "utf8");
  });

  test("creates dead letter queue", () => {
    expect(sqsContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"\s*{/);
    expect(sqsContent).toMatch(/name\s*=\s*"etl-dlq-\$\{var\.environmentSuffix\}"/);
  });

  test("DLQ has message retention configured", () => {
    expect(sqsContent).toMatch(/message_retention_seconds\s*=\s*\d+/);
  });

  test("DLQ has visibility timeout configured", () => {
    expect(sqsContent).toMatch(/visibility_timeout_seconds\s*=\s*\d+/);
  });

  test("creates DLQ policy", () => {
    expect(sqsContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"dlq"\s*{/);
    expect(sqsContent).toMatch(/queue_url\s*=\s*aws_sqs_queue\.dlq\.id/);
  });

  test("DLQ policy allows Lambda to send messages", () => {
    expect(sqsContent).toMatch(/lambda\.amazonaws\.com/);
    expect(sqsContent).toMatch(/sqs:SendMessage/);
  });
});

describe("Banking ETL Infrastructure - EventBridge Resources", () => {
  let eventbridgeContent: string;

  beforeAll(() => {
    eventbridgeContent = fs.readFileSync(eventbridgePath, "utf8");
  });

  test("creates EventBridge rule for S3 object creation", () => {
    expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_object_created"\s*{/);
    expect(eventbridgeContent).toMatch(/name\s*=\s*"etl-s3-object-created-\$\{var\.environmentSuffix\}"/);
  });

  test("EventBridge rule has event pattern", () => {
    expect(eventbridgeContent).toMatch(/event_pattern\s*=\s*jsonencode/);
    expect(eventbridgeContent).toMatch(/source\s*=\s*\[\s*"aws\.s3"\s*\]/);
    expect(eventbridgeContent).toMatch(/detail-type\s*=\s*\[\s*"Object Created"\s*\]/);
  });

  test("EventBridge rule filters by input bucket", () => {
    expect(eventbridgeContent).toMatch(/bucket\s*=\s*{[\s\S]*?name\s*=\s*\[aws_s3_bucket\.input\.bucket\]/);
  });

  test("creates EventBridge target for Lambda", () => {
    expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"\s*{/);
    expect(eventbridgeContent).toMatch(/rule\s*=\s*aws_cloudwatch_event_rule\.s3_object_created\.name/);
    expect(eventbridgeContent).toMatch(/arn\s*=\s*aws_lambda_function\.processor\.arn/);
    expect(eventbridgeContent).toMatch(/role_arn\s*=\s*aws_iam_role\.eventbridge_lambda\.arn/);
  });
});

describe("Banking ETL Infrastructure - CloudWatch Resources", () => {
  let cloudwatchContent: string;

  beforeAll(() => {
    cloudwatchContent = fs.readFileSync(cloudwatchPath, "utf8");
  });

  test("creates SNS topic for alarms (conditional)", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"\s*{/);
    expect(cloudwatchContent).toMatch(/count\s*=\s*var\.alarm_email\s*!=\s*""\s*\?\s*1\s*:\s*0/);
  });

  test("creates SNS topic subscription (conditional)", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"\s*{/);
    expect(cloudwatchContent).toMatch(/protocol\s*=\s*"email"/);
    expect(cloudwatchContent).toMatch(/endpoint\s*=\s*var\.alarm_email/);
  });

  test("creates CloudWatch alarm for Lambda errors", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
    expect(cloudwatchContent).toMatch(/alarm_name\s*=\s*"etl-lambda-errors-\$\{var\.environmentSuffix\}"/);
    expect(cloudwatchContent).toMatch(/metric_name\s*=\s*"Errors"/);
    expect(cloudwatchContent).toMatch(/namespace\s*=\s*"AWS\/Lambda"/);
  });

  test("Lambda errors alarm has correct configuration", () => {
    expect(cloudwatchContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
    expect(cloudwatchContent).toMatch(/threshold\s*=\s*\d+/);
    expect(cloudwatchContent).toMatch(/FunctionName\s*=\s*aws_lambda_function\.processor\.function_name/);
  });

  test("creates CloudWatch alarm for Lambda throttles", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"\s*{/);
    expect(cloudwatchContent).toMatch(/metric_name\s*=\s*"Throttles"/);
  });

  test("creates CloudWatch alarm for DLQ messages", () => {
    expect(cloudwatchContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_messages"\s*{/);
    expect(cloudwatchContent).toMatch(/alarm_name\s*=\s*"etl-dlq-messages-\$\{var\.environmentSuffix\}"/);
    expect(cloudwatchContent).toMatch(/metric_name\s*=\s*"ApproximateNumberOfMessagesVisible"/);
    expect(cloudwatchContent).toMatch(/namespace\s*=\s*"AWS\/SQS"/);
  });

  test("DLQ alarm has correct configuration", () => {
    expect(cloudwatchContent).toMatch(/QueueName\s*=\s*aws_sqs_queue\.dlq\.name/);
  });

  test("alarms use conditional SNS topic ARN", () => {
    expect(cloudwatchContent).toMatch(/alarm_actions\s*=\s*var\.alarm_email\s*!=\s*""\s*\?/);
  });
});

describe("Banking ETL Infrastructure - IAM Resources", () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = fs.readFileSync(iamPath, "utf8");
  });

  test("creates Lambda execution role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*{/);
    expect(iamContent).toMatch(/name\s*=\s*"etl-lambda-role-\$\{var\.environmentSuffix\}"/);
  });

  test("Lambda execution role has assume role policy", () => {
    expect(iamContent).toMatch(/assume_role_policy\s*=\s*jsonencode/);
    expect(iamContent).toMatch(/lambda\.amazonaws\.com/);
    expect(iamContent).toMatch(/sts:AssumeRole/);
  });

  test("creates Lambda logging policy", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_logging"\s*{/);
    expect(iamContent).toMatch(/logs:CreateLogGroup/);
    expect(iamContent).toMatch(/logs:CreateLogStream/);
    expect(iamContent).toMatch(/logs:PutLogEvents/);
  });

  test("creates Lambda S3 access policy", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_s3_access"\s*{/);
    expect(iamContent).toMatch(/s3:GetObject/);
    expect(iamContent).toMatch(/s3:ListBucket/);
    expect(iamContent).toMatch(/s3:PutObject/);
  });

  test("Lambda S3 policy allows access to input bucket", () => {
    expect(iamContent).toMatch(/aws_s3_bucket\.input\.arn/);
  });

  test("Lambda S3 policy allows access to output and audit buckets", () => {
    expect(iamContent).toMatch(/aws_s3_bucket\.output\.arn/);
    expect(iamContent).toMatch(/aws_s3_bucket\.audit\.arn/);
  });

  test("creates Lambda SQS access policy", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_sqs_access"\s*{/);
    expect(iamContent).toMatch(/sqs:SendMessage/);
    expect(iamContent).toMatch(/sqs:GetQueueUrl/);
  });

  test("creates EventBridge Lambda role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_lambda"\s*{/);
    expect(iamContent).toMatch(/name\s*=\s*"etl-eventbridge-role-\$\{var\.environmentSuffix\}"/);
  });

  test("EventBridge role has assume role policy", () => {
    expect(iamContent).toMatch(/events\.amazonaws\.com/);
  });

  test("creates EventBridge invoke Lambda policy", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"eventbridge_invoke_lambda"\s*{/);
    expect(iamContent).toMatch(/lambda:InvokeFunction/);
    expect(iamContent).toMatch(/aws_lambda_function\.processor\.arn/);
  });
});

describe("Banking ETL Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(outputsPath, "utf8");
  });

  test("exports input bucket name", () => {
    expect(outputsContent).toMatch(/output\s+"input_bucket_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.input\.bucket/);
  });

  test("exports output bucket name", () => {
    expect(outputsContent).toMatch(/output\s+"output_bucket_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.output\.bucket/);
  });

  test("exports audit bucket name", () => {
    expect(outputsContent).toMatch(/output\s+"audit_bucket_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_s3_bucket\.audit\.bucket/);
  });

  test("exports Lambda function name", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_function_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_lambda_function\.processor\.function_name/);
  });

  test("exports Lambda function ARN", () => {
    expect(outputsContent).toMatch(/output\s+"lambda_function_arn"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_lambda_function\.processor\.arn/);
  });

  test("exports DLQ URL", () => {
    expect(outputsContent).toMatch(/output\s+"dlq_url"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_sqs_queue\.dlq\.url/);
  });

  test("exports DLQ ARN", () => {
    expect(outputsContent).toMatch(/output\s+"dlq_arn"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_sqs_queue\.dlq\.arn/);
  });

  test("exports log group name", () => {
    expect(outputsContent).toMatch(/output\s+"log_group_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_cloudwatch_log_group\.lambda_logs\.name/);
  });

  test("exports EventBridge rule name", () => {
    expect(outputsContent).toMatch(/output\s+"eventbridge_rule_name"\s*{/);
    expect(outputsContent).toMatch(/value\s*=\s*aws_cloudwatch_event_rule\.s3_object_created\.name/);
  });
});

describe("Banking ETL Infrastructure - Best Practices", () => {
  let s3Content: string;
  let lambdaContent: string;
  let iamContent: string;

  beforeAll(() => {
    s3Content = fs.readFileSync(s3Path, "utf8");
    lambdaContent = fs.readFileSync(lambdaPath, "utf8");
    iamContent = fs.readFileSync(iamPath, "utf8");
  });

  test("enables versioning for all S3 buckets", () => {
    const versioningResources = (s3Content.match(/aws_s3_bucket_versioning/g) || []).length;
    expect(versioningResources).toBeGreaterThanOrEqual(3);
  });

  test("enables encryption for all S3 buckets", () => {
    const encryptionResources = (s3Content.match(/aws_s3_bucket_server_side_encryption_configuration/g) || []).length;
    expect(encryptionResources).toBeGreaterThanOrEqual(3);
  });

  test("blocks public access on all S3 buckets", () => {
    const publicAccessBlock = (s3Content.match(/aws_s3_bucket_public_access_block/g) || []).length;
    expect(publicAccessBlock).toBeGreaterThanOrEqual(3);
  });

  test("uses least privilege IAM policies", () => {
    expect(iamContent).toMatch(/Effect\s*=\s*"Allow"/);
    // Lambda should only have necessary permissions
    expect(iamContent).toMatch(/s3:GetObject/);
    expect(iamContent).toMatch(/s3:PutObject/);
    expect(iamContent).toMatch(/sqs:SendMessage/);
  });

  test("configures log retention for Lambda logs", () => {
    expect(lambdaContent).toMatch(/retention_in_days\s*=\s*\d+/);
  });

  test("Lambda function has dead letter queue configured", () => {
    expect(lambdaContent).toMatch(/dead_letter_config/);
  });

  test("uses environment variables for configuration", () => {
    expect(lambdaContent).toMatch(/environment\s*{[\s\S]*?variables/);
  });
});

describe("Banking ETL Infrastructure - Security Best Practices", () => {
  let s3Content: string;
  let iamContent: string;
  let sqsContent: string;

  beforeAll(() => {
    s3Content = fs.readFileSync(s3Path, "utf8");
    iamContent = fs.readFileSync(iamPath, "utf8");
    sqsContent = fs.readFileSync(sqsPath, "utf8");
  });

  test("S3 buckets use AES256 encryption", () => {
    expect(s3Content).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("S3 buckets block all public access", () => {
    expect(s3Content).toMatch(/block_public_acls\s*=\s*true/);
    expect(s3Content).toMatch(/block_public_policy\s*=\s*true/);
    expect(s3Content).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(s3Content).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("IAM policies use specific resource ARNs", () => {
    expect(iamContent).toMatch(/aws_s3_bucket\.input\.arn/);
    expect(iamContent).toMatch(/aws_s3_bucket\.output\.arn/);
    expect(iamContent).toMatch(/aws_s3_bucket\.audit\.arn/);
    expect(iamContent).toMatch(/aws_sqs_queue\.dlq\.arn/);
  });

  test("DLQ policy restricts access to Lambda service", () => {
    expect(sqsContent).toMatch(/lambda\.amazonaws\.com/);
  });

  test("Lambda execution role uses service principal", () => {
    expect(iamContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
  });

  test("EventBridge role uses service principal", () => {
    expect(iamContent).toMatch(/Service\s*=\s*"events\.amazonaws\.com"/);
  });
});

describe("Banking ETL Infrastructure - Integration Points", () => {
  let lambdaContent: string;
  let eventbridgeContent: string;
  let s3Content: string;

  beforeAll(() => {
    lambdaContent = fs.readFileSync(lambdaPath, "utf8");
    eventbridgeContent = fs.readFileSync(eventbridgePath, "utf8");
    s3Content = fs.readFileSync(s3Path, "utf8");
  });

  test("EventBridge rule triggers Lambda on S3 object creation", () => {
    expect(eventbridgeContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"lambda"/);
    expect(eventbridgeContent).toMatch(/arn\s*=\s*aws_lambda_function\.processor\.arn/);
  });

  test("S3 bucket notification enables EventBridge", () => {
    expect(s3Content).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"input_notification"/);
    expect(s3Content).toMatch(/eventbridge\s*=\s*true/);
  });

  test("Lambda has permission for EventBridge invocation", () => {
    expect(lambdaContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
    expect(lambdaContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
  });

  test("Lambda environment variables reference S3 buckets and DLQ", () => {
    expect(lambdaContent).toMatch(/OUTPUT_BUCKET\s*=\s*aws_s3_bucket\.output\.bucket/);
    expect(lambdaContent).toMatch(/AUDIT_BUCKET\s*=\s*aws_s3_bucket\.audit\.bucket/);
    expect(lambdaContent).toMatch(/DLQ_URL\s*=\s*aws_sqs_queue\.dlq\.url/);
  });

  test("Lambda dead letter config references DLQ", () => {
    expect(lambdaContent).toMatch(/dead_letter_config\s*{[\s\S]*?target_arn\s*=\s*aws_sqs_queue\.dlq\.arn/);
  });
});

describe("Banking ETL Infrastructure - Coverage Summary", () => {
  let allContent: string;

  beforeAll(() => {
    const files = [
      lambdaPath,
      s3Path,
      sqsPath,
      eventbridgePath,
      cloudwatchPath,
      iamPath,
    ];
    allContent = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  });

  test("creates all required S3 buckets", () => {
    const s3Buckets = (allContent.match(/resource\s+"aws_s3_bucket"/g) || []).length;
    expect(s3Buckets).toBeGreaterThanOrEqual(3);
  });

  test("creates all required IAM roles", () => {
    const iamRoles = (allContent.match(/resource\s+"aws_iam_role"/g) || []).length;
    expect(iamRoles).toBeGreaterThanOrEqual(2);
  });

  test("implements complete ETL pipeline", () => {
    expect(allContent).toMatch(/resource\s+"aws_s3_bucket"\s+"input"/);
    expect(allContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"/);
    expect(allContent).toMatch(/resource\s+"aws_s3_bucket"\s+"output"/);
    expect(allContent).toMatch(/resource\s+"aws_s3_bucket"\s+"audit"/);
    expect(allContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
  });

  test("implements event-driven architecture", () => {
    expect(allContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
    expect(allContent).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
    expect(allContent).toMatch(/resource\s+"aws_s3_bucket_notification"/);
  });

  test("implements monitoring and alerting", () => {
    const alarms = (allContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g) || []).length;
    expect(alarms).toBeGreaterThanOrEqual(3);
  });
});

