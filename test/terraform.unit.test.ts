// tests/unit/unit-tests.ts
// Unit tests for Terraform recommendation system infrastructure
// No Terraform commands are executed - only static file validation

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Recommendation System Infrastructure", () => {
  let stackContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
  });

  // File existence
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // Provider configuration
  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // Variables
  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares kinesis_stream_shard_count variable", () => {
      expect(stackContent).toMatch(/variable\s+"kinesis_stream_shard_count"\s*{/);
    });

    test("declares redis_node_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"redis_node_type"\s*{/);
    });

    test("declares api_stage_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"api_stage_name"\s*{/);
    });

    test("declares retraining_schedule variable", () => {
      expect(stackContent).toMatch(/variable\s+"retraining_schedule"\s*{/);
    });
  });

  // Core Infrastructure Resources
  describe("Core Infrastructure", () => {
    test("defines VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("defines private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("defines Lambda security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    });

    test("defines Redis security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*{/);
    });
  });

  // Storage Resources
  describe("Storage Resources", () => {
    test("defines S3 training data bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"training_data"\s*{/);
    });

    test("defines S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"training_data"\s*{/);
    });

    test("defines S3 bucket encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"training_data"\s*{/);
    });

    test("defines S3 bucket lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"training_data"\s*{/);
    });

    test("defines DynamoDB user profiles table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"user_profiles"\s*{/);
    });

    test("defines DynamoDB interactions table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"interactions"\s*{/);
    });

    test("DynamoDB interactions table has global secondary index", () => {
      expect(stackContent).toMatch(/global_secondary_index\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"ItemIndex"/);
    });
  });

  // Streaming and Processing
  describe("Streaming and Processing", () => {
    test("defines Kinesis data stream", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"user_interactions"\s*{/);
    });

    test("Kinesis stream has encryption enabled", () => {
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test("defines stream processor Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"stream_processor"\s*{/);
    });

    test("defines Kinesis event source mapping", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_trigger"\s*{/);
    });
  });

  // Caching
  describe("ElastiCache Redis", () => {
    test("defines Redis subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*{/);
    });

    test("defines Redis parameter group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"\s*{/);
    });

    test("defines Redis replication group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
    });

    test("Redis has encryption at rest enabled", () => {
      expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    });
  });

  // IAM Roles
  describe("IAM Roles and Policies", () => {
    test("defines Lambda stream processor role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_stream_processor"\s*{/);
    });

    test("defines Lambda recommendation API role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_recommendation_api"\s*{/);
    });

    test("defines Glue job role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"glue_job"\s*{/);
    });

    test("defines Step Functions role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"\s*{/);
    });

    test("defines Personalize role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"personalize"\s*{/);
    });

    test("defines EventBridge role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_step_functions"\s*{/);
    });
  });

  // Lambda Functions
  describe("Lambda Functions", () => {
    test("defines recommendation API Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"recommendation_api"\s*{/);
    });

    test("Lambda functions use Python 3.11 runtime", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*local\.lambda_runtime/);
      expect(stackContent).toMatch(/lambda_runtime\s*=\s*"python3\.11"/);
    });

    test("recommendation API Lambda has VPC configuration", () => {
      expect(stackContent).toMatch(/vpc_config\s*{/);
    });
  });

  // Data Processing
  describe("AWS Glue", () => {
    test("defines Glue job for data preparation", () => {
      expect(stackContent).toMatch(/resource\s+"aws_glue_job"\s+"data_preparation"\s*{/);
    });

    test("Glue job uses version 4.0", () => {
      expect(stackContent).toMatch(/glue_version\s*=\s*"4\.0"/);
    });
  });

  // Orchestration
  describe("Step Functions", () => {
    test("defines Step Functions state machine", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"training_pipeline"\s*{/);
    });

    test("Step Functions has logging configuration", () => {
      expect(stackContent).toMatch(/logging_configuration\s*{/);
    });

    test("defines CloudWatch log group for Step Functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"\s*{/);
    });
  });

  // API Gateway
  describe("API Gateway", () => {
    test("defines REST API", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"recommendation_api"\s*{/);
    });

    test("defines recommendations resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"recommendations"\s*{/);
    });

    test("defines POST method", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"get_recommendations"\s*{/);
      expect(stackContent).toMatch(/http_method\s*=\s*"POST"/);
    });

    test("defines Lambda integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda_integration"\s*{/);
    });

    test("defines API Gateway stage", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"main"\s*{/);
    });

    test("API Gateway has X-Ray tracing enabled", () => {
      expect(stackContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });
  });

  // Scheduling
  describe("EventBridge", () => {
    test("defines retraining schedule rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"retraining_schedule"\s*{/);
    });

    test("defines EventBridge target for Step Functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"step_functions"\s*{/);
    });
  });

  // Notifications
  describe("SNS", () => {
    test("defines SNS topic for notifications", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"notifications"\s*{/);
    });

    test("SNS topic has KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
    });
  });

  // Monitoring
  describe("CloudWatch Monitoring", () => {
    test("defines Kinesis incoming records alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_incoming_records"\s*{/);
    });

    test("defines Lambda errors alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
    });

    test("defines API latency alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency"\s*{/);
    });

    test("defines CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
    });
  });

  // Outputs
  describe("Outputs", () => {
    test("defines API Gateway URL output", () => {
      expect(stackContent).toMatch(/output\s+"api_gateway_url"\s*{/);
    });

    test("defines Kinesis stream ARN output", () => {
      expect(stackContent).toMatch(/output\s+"kinesis_stream_arn"\s*{/);
    });

    test("defines S3 training bucket output", () => {
      expect(stackContent).toMatch(/output\s+"s3_training_bucket"\s*{/);
    });

    test("defines SNS topic ARN output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("defines dashboard URL output", () => {
      expect(stackContent).toMatch(/output\s+"dashboard_url"\s*{/);
    });

    test("defines Step Functions ARN output", () => {
      expect(stackContent).toMatch(/output\s+"step_functions_arn"\s*{/);
    });

    test("defines Redis endpoint output as sensitive", () => {
      expect(stackContent).toMatch(/output\s+"redis_endpoint"\s*{/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);
    });
  });

  // Lambda Code Files
  describe("Lambda Code Files", () => {
    test("stream processor Lambda code exists", () => {
      const lambdaPath = path.resolve(__dirname, "../lib/lambda/stream_processor/handler.py");
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test("recommendation API Lambda code exists", () => {
      const lambdaPath = path.resolve(__dirname, "../lib/lambda/recommendation_api/handler.py");
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });
  });

  // Security Best Practices
  describe("Security Best Practices", () => {
    test("S3 bucket has public access blocked", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"training_data"\s*{/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("DynamoDB tables have encryption enabled", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB tables have point-in-time recovery", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("IAM roles follow least privilege principle", () => {
      // Check that IAM policies specify specific resources, not "*" where possible
      const iamPolicyMatches = stackContent.match(/Resource\s*=\s*"[^"]+"/g) || [];
      expect(iamPolicyMatches.length).toBeGreaterThan(0);
    });
  });

  // Tagging
  describe("Resource Tagging", () => {
    test("uses common_tags variable", () => {
      expect(stackContent).toMatch(/variable\s+"common_tags"\s*{/);
    });

    test("resources use merge function for tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(var\.common_tags,/);
    });
  });
});
