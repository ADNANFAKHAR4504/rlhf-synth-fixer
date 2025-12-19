import fs from "fs";
import path from "path";

const stackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerPath = path.resolve(__dirname, "../lib/provider.tf");
const lambdaPath = path.resolve(__dirname, "../lib/lambda_function.py");

describe("Terraform Media Pipeline Stack - Unit Tests", () => {
  let stackContent: string;
  let lambdaContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    lambdaContent = fs.readFileSync(lambdaPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("lambda_function.py exists", () => {
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test("tap_stack.tf does not declare provider block", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("variables.tf and outputs.tf are consolidated into tap_stack.tf", () => {
      expect(fs.existsSync(path.resolve(__dirname, "../lib/variables.tf"))).toBe(false);
      expect(fs.existsSync(path.resolve(__dirname, "../lib/outputs.tf"))).toBe(false);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable in tap_stack.tf", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"/);
    });

    test("declares environment_suffix variable in tap_stack.tf", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test("aws_region has default value", () => {
      expect(stackContent).toMatch(/default\s*=\s*"us-east-1"/);
    });
  });

  describe("S3 Buckets", () => {
    test("declares input S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"input_bucket"/);
    });

    test("declares output S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"output_bucket"/);
    });

    test("input bucket has public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"input_bucket_block"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("output bucket has public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"output_bucket_block"/);
    });

    test("input bucket has KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"input_bucket_encryption"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("output bucket has KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"output_bucket_encryption"/);
    });

    test("buckets have versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"input_bucket_versioning"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"output_bucket_versioning"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("buckets are deletable with force_destroy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"input_bucket"[\s\S]*?force_destroy\s*=\s*true/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"output_bucket"[\s\S]*?force_destroy\s*=\s*true/);
    });

    test("S3 bucket notification configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"bucket_notification"/);
      expect(stackContent).toMatch(/events\s*=\s*\["s3:ObjectCreated:\*"\]/);
    });
  });

  describe("KMS Encryption", () => {
    test("declares KMS key", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"media_encryption"/);
    });

    test("KMS key has key rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("KMS key has deletion window", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*\d+/);
    });

    test("declares KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"media_encryption"/);
    });
  });

  describe("DynamoDB Table", () => {
    test("declares DynamoDB table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"media_assets"/);
    });

    test("DynamoDB table has PAY_PER_REQUEST billing", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("DynamoDB table has AssetId hash key", () => {
      expect(stackContent).toMatch(/hash_key\s*=\s*"AssetId"/);
    });

    test("DynamoDB table has Status GSI", () => {
      expect(stackContent).toMatch(/global_secondary_index/);
      expect(stackContent).toMatch(/name\s*=\s*"StatusIndex"/);
    });

    test("DynamoDB table has KMS encryption", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
    });

    test("DynamoDB table has point-in-time recovery", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[^}]*enabled\s*=\s*true/s);
    });
  });

  describe("SQS Queues", () => {
    test("declares processing queue", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"processing_queue"/);
    });

    test("declares processing DLQ", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"processing_dlq"/);
    });

    test("declares status update queue", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"status_update_queue"/);
    });

    test("declares status update DLQ", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"status_update_dlq"/);
    });

    test("processing queue has redrive policy to DLQ", () => {
      expect(stackContent).toMatch(/redrive_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/deadLetterTargetArn/);
      expect(stackContent).toMatch(/maxReceiveCount/);
    });

    test("queues have KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.media_encryption\.id/);
    });

    test("SQS queue policies configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"processing_queue_policy"/);
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"status_queue_policy"/);
    });
  });

  describe("Lambda Function", () => {
    test("declares Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"media_processor"/);
    });

    test("Lambda has correct runtime", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test("Lambda has timeout configured", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*300/);
    });

    test("Lambda has memory size configured", () => {
      expect(stackContent).toMatch(/memory_size\s*=\s*1024/);
    });

    test("Lambda has environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{[^}]*variables/s);
      expect(stackContent).toMatch(/INPUT_BUCKET/);
      expect(stackContent).toMatch(/OUTPUT_BUCKET/);
      expect(stackContent).toMatch(/ASSETS_TABLE/);
      expect(stackContent).toMatch(/MEDIACONVERT_ROLE/);
    });

    test("Lambda has X-Ray tracing enabled", () => {
      expect(stackContent).toMatch(/tracing_config\s*{[^}]*mode\s*=\s*"Active"/s);
    });

    test("Lambda has reserved concurrent executions", () => {
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*100/);
    });

    test("Lambda event source mappings configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"processing_queue_mapping"/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"status_update_queue_mapping"/);
    });

    test("Lambda code handles S3 events", () => {
      expect(lambdaContent).toMatch(/def handler\(/);
      expect(lambdaContent).toMatch(/handle_s3_upload/);
    });

    test("Lambda code handles MediaConvert status updates", () => {
      expect(lambdaContent).toMatch(/handle_mediaconvert_status/);
      expect(lambdaContent).toMatch(/mediaconvert/);
    });

    test("Lambda code creates MediaConvert jobs", () => {
      expect(lambdaContent).toMatch(/create_job/);
      expect(lambdaContent).toMatch(/get_mediaconvert_endpoint/);
    });

    test("Lambda code updates DynamoDB", () => {
      expect(lambdaContent).toMatch(/dynamodb/);
      expect(lambdaContent).toMatch(/put_item|update_item/);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("declares Lambda IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"media_processor_role"/);
    });

    test("declares MediaConvert IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"mediaconvert_role"/);
    });

    test("Lambda has S3 access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_s3_access"/);
    });

    test("Lambda has MediaConvert access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_mediaconvert_access"/);
    });

    test("Lambda has DynamoDB access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_dynamodb_access"/);
    });

    test("Lambda has SQS access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_sqs_access"/);
    });

    test("Lambda has KMS access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_kms_access"/);
    });

    test("Lambda has CloudWatch Logs access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_logs_access"/);
    });

    test("Lambda has X-Ray access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_xray_access"/);
    });

    test("Lambda has PassRole policy for MediaConvert", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_iam_passrole"/);
      expect(stackContent).toMatch(/iam:PassRole/);
    });

    test("all Lambda policies attached to role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_s3_attachment"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_mediaconvert_attachment"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_dynamodb_attachment"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_sqs_attachment"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_kms_attachment"/);
    });

    test("MediaConvert role has S3 access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"mediaconvert_s3_access"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"mediaconvert_s3_attachment"/);
    });
  });

  describe("EventBridge", () => {
    test("declares EventBridge rule for MediaConvert", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"mediaconvert_status_change"/);
    });

    test("EventBridge rule captures MediaConvert events", () => {
      expect(stackContent).toMatch(/aws\.mediaconvert/);
      expect(stackContent).toMatch(/MediaConvert Job State Change/);
    });

    test("EventBridge target sends to SQS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"mediaconvert_status_target"/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("declares CloudWatch Log Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_log_group"/);
    });

    test("log group has retention configured", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*14/);
    });

    test("log group has KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.media_encryption\.arn/);
    });

    test("declares processing queue depth alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"processing_queue_depth"/);
    });

    test("declares processing DLQ alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"processing_dlq_not_empty"/);
    });

    test("declares Lambda errors alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
    });

    test("declares Lambda throttles alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"/);
    });

    test("declares CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"media_pipeline_dashboard"/);
    });

    test("dashboard monitors SQS metrics", () => {
      expect(stackContent).toMatch(/AWS\/SQS/);
      expect(stackContent).toMatch(/ApproximateNumberOfMessagesVisible/);
    });

    test("dashboard monitors Lambda metrics", () => {
      expect(stackContent).toMatch(/AWS\/Lambda/);
      expect(stackContent).toMatch(/Invocations/);
      expect(stackContent).toMatch(/Errors/);
      expect(stackContent).toMatch(/Duration/);
    });
  });

  describe("Outputs", () => {
    test("outputs input bucket name in tap_stack.tf", () => {
      expect(stackContent).toMatch(/output\s+"input_bucket_name"/);
    });

    test("outputs output bucket name in tap_stack.tf", () => {
      expect(stackContent).toMatch(/output\s+"output_bucket_name"/);
    });

    test("outputs DynamoDB table name in tap_stack.tf", () => {
      expect(stackContent).toMatch(/output\s+"dynamodb_table_name"/);
    });

    test("outputs Lambda function name in tap_stack.tf", () => {
      expect(stackContent).toMatch(/output\s+"lambda_function_name"/);
    });

    test("outputs queue URLs in tap_stack.tf", () => {
      expect(stackContent).toMatch(/output\s+"processing_queue_url"/);
      expect(stackContent).toMatch(/output\s+"status_update_queue_url"/);
    });

    test("outputs KMS key information in tap_stack.tf", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
    });
  });

  describe("Multi-AZ and Scalability", () => {
    test("uses data source for availability zones", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("Lambda has concurrent execution limit for scalability", () => {
      expect(stackContent).toMatch(/reserved_concurrent_executions/);
    });

    test("DynamoDB uses on-demand billing for auto-scaling", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("SQS has appropriate visibility timeout for Lambda processing", () => {
      expect(stackContent).toMatch(/visibility_timeout_seconds\s*=\s*900/);
    });
  });

  describe("Security and Encryption", () => {
    test("all resources use environment suffix for isolation", () => {
      const suffixCount = (stackContent.match(/var\.environment_suffix/g) || []).length;
      expect(suffixCount).toBeGreaterThan(5);
    });

    test("KMS encryption used for S3", () => {
      const s3KmsCount = (stackContent.match(/kms_master_key_id\s*=\s*aws_kms_key\.media_encryption\.arn/g) || []).length;
      expect(s3KmsCount).toBeGreaterThan(0);
    });

    test("KMS encryption used for SQS", () => {
      const sqsKmsCount = (stackContent.match(/kms_master_key_id\s*=\s*aws_kms_key\.media_encryption\.id/g) || []).length;
      expect(sqsKmsCount).toBeGreaterThan(0);
    });

    test("KMS encryption used for DynamoDB", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{[^}]*kms_key_arn\s*=\s*aws_kms_key\.media_encryption\.arn/s);
    });

    test("KMS encryption used for CloudWatch Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?kms_key_id/);
    });
  });

  describe("Resource Dependencies", () => {
    test("S3 notification depends on SQS policy", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[^\]]*aws_sqs_queue_policy\.processing_queue_policy/s);
    });

    test("Lambda depends on IAM policies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[^\]]*aws_iam_role_policy_attachment\.lambda_logs_attachment/s);
    });
  });
});
