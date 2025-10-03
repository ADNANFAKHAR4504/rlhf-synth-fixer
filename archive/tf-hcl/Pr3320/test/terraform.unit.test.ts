// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates infrastructure components, security, and AWS best practices

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Fitness API Stack - File Structure", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists and manages AWS provider", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
    const providerContent = fs.readFileSync(providerPath, "utf8");
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("tap_stack.tf does NOT declare provider (provider.tf owns it)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("Lambda code files exist", () => {
    const lambdaCodeDir = path.resolve(__dirname, "../lib/lambda_code");
    expect(fs.existsSync(path.join(lambdaCodeDir, "get_workouts.py"))).toBe(true);
    expect(fs.existsSync(path.join(lambdaCodeDir, "create_workout.py"))).toBe(true);
    expect(fs.existsSync(path.join(lambdaCodeDir, "update_workout.py"))).toBe(true);
    expect(fs.existsSync(path.join(lambdaCodeDir, "delete_workout.py"))).toBe(true);
  });
});

describe("Terraform Fitness API Stack - Required Infrastructure Components", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  describe("KMS Encryption", () => {
    test("declares KMS key for encryption at rest", () => {
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"fitness_app_key"/);
    });

    test("enables KMS key rotation", () => {
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("declares KMS alias", () => {
      expect(content).toMatch(/resource\s+"aws_kms_alias"\s+"fitness_app_key_alias"/);
    });
  });

  describe("SSM Parameter Store", () => {
    test("declares SSM parameters for environment variables", () => {
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_stage"/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"log_level"/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"api_key"/);
    });

    test("uses KMS encryption for SSM parameters", () => {
      expect(content).toMatch(/key_id\s*=\s*aws_kms_key\.fitness_app_key\.key_id/);
    });

    test("uses SecureString type for sensitive parameters", () => {
      expect(content).toMatch(/type\s*=\s*"SecureString"/);
    });
  });

  describe("DynamoDB Table", () => {
    test("declares DynamoDB table for workout logs", () => {
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"workout_logs"/);
    });

    test("uses PROVISIONED billing mode for auto-scaling", () => {
      expect(content).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
    });

    test("defines hash_key and range_key", () => {
      expect(content).toMatch(/hash_key\s*=\s*"UserId"/);
      expect(content).toMatch(/range_key\s*=\s*"WorkoutId"/);
    });

    test("declares global secondary index for WorkoutDate", () => {
      expect(content).toMatch(/global_secondary_index\s*{/);
      expect(content).toMatch(/name\s*=\s*"WorkoutDateIndex"/);
    });

    test("enables point-in-time recovery", () => {
      expect(content).toMatch(/point_in_time_recovery\s*{/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test("enables server-side encryption with KMS", () => {
      expect(content).toMatch(/server_side_encryption\s*{/);
      expect(content).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.fitness_app_key\.arn/);
    });
  });

  describe("DynamoDB Auto Scaling", () => {
    test("declares read capacity auto scaling target", () => {
      expect(content).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_table_read_target"/);
    });

    test("declares write capacity auto scaling target", () => {
      expect(content).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_table_write_target"/);
    });

    test("declares read capacity scaling policy", () => {
      expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_table_read_policy"/);
      expect(content).toMatch(/DynamoDBReadCapacityUtilization/);
    });

    test("declares write capacity scaling policy", () => {
      expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_table_write_policy"/);
      expect(content).toMatch(/DynamoDBWriteCapacityUtilization/);
    });

    test("declares GSI auto scaling targets and policies", () => {
      expect(content).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_gsi_read_target"/);
      expect(content).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_gsi_write_target"/);
      expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_gsi_read_policy"/);
      expect(content).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_gsi_write_policy"/);
    });
  });

  describe("Lambda Functions", () => {
    test("declares all four Lambda functions", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"get_workouts"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"create_workout"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"update_workout"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"delete_workout"/);
    });

    test("uses Python 3.10 runtime", () => {
      const matches = content.match(/runtime\s*=\s*"python3\.10"/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    test("enables X-Ray tracing for all Lambda functions", () => {
      const matches = content.match(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    test("sets environment variables for Lambda functions", () => {
      expect(content).toMatch(/PARAM_STORE_PATH/);
      expect(content).toMatch(/TABLE_NAME/);
      expect(content).toMatch(/LOG_LEVEL/);
    });

    test("declares CloudWatch log groups for Lambda functions", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"get_workouts_logs"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"create_workout_logs"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"update_workout_logs"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"delete_workout_logs"/);
    });
  });

  describe("IAM Roles and Policies - Least Privilege", () => {
    test("declares Lambda IAM role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    });

    test("declares separate IAM policies for DynamoDB, SSM, CloudWatch, and X-Ray", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_dynamodb_policy"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_ssm_policy"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_cloudwatch_policy"/);
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_xray_policy"/);
    });

    test("DynamoDB policy grants least privilege access", () => {
      const dynamodbPolicyMatch = content.match(/resource\s+"aws_iam_policy"\s+"lambda_dynamodb_policy"[\s\S]*?policy\s*=\s*jsonencode\(([\s\S]*?)\n\s*\)/);
      expect(dynamodbPolicyMatch).toBeTruthy();
      const policy = dynamodbPolicyMatch![1];
      expect(policy).toMatch(/dynamodb:GetItem/);
      expect(policy).toMatch(/dynamodb:PutItem/);
      expect(policy).toMatch(/dynamodb:UpdateItem/);
      expect(policy).toMatch(/dynamodb:DeleteItem/);
      expect(policy).toMatch(/dynamodb:Query/);
    });

    test("SSM policy includes KMS decrypt permissions", () => {
      const ssmPolicyMatch = content.match(/resource\s+"aws_iam_policy"\s+"lambda_ssm_policy"[\s\S]*?policy\s*=\s*jsonencode\(([\s\S]*?)\n\s*\)/);
      expect(ssmPolicyMatch).toBeTruthy();
      const policy = ssmPolicyMatch![1];
      expect(policy).toMatch(/ssm:GetParameter/);
      expect(policy).toMatch(/kms:Decrypt/);
    });

    test("attaches all policies to Lambda role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_dynamodb_attachment"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_ssm_attachment"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_cloudwatch_attachment"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_xray_attachment"/);
    });
  });

  describe("API Gateway - Edge-Optimized REST API", () => {
    test("declares API Gateway REST API", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"fitness_api"/);
    });

    test("configures edge-optimized endpoint", () => {
      expect(content).toMatch(/endpoint_configuration\s*{[\s\S]*?types\s*=\s*\["EDGE"\]/);
    });

    test("declares /workouts resource", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"workouts_resource"/);
      expect(content).toMatch(/path_part\s*=\s*"workouts"/);
    });

    test("declares /workouts/{workoutId} resource", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"\s+"workout_id_resource"/);
      expect(content).toMatch(/path_part\s*=\s*"{workoutId}"/);
    });

    test("declares HTTP methods: GET, POST, PUT, DELETE", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"get_workouts_method"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"post_workout_method"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"put_workout_method"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"\s+"delete_workout_method"/);
    });

    test("declares Lambda integrations for all methods", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"get_workouts_integration"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"post_workout_integration"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"put_workout_integration"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_integration"\s+"delete_workout_integration"/);
    });

    test("uses AWS_PROXY integration type", () => {
      const matches = content.match(/type\s*=\s*"AWS_PROXY"/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(4);
    });

    test("declares Lambda permissions for API Gateway invocation", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"get_workouts_permission"/);
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"create_workout_permission"/);
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"update_workout_permission"/);
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"delete_workout_permission"/);
    });

    test("declares API Gateway deployment with triggers", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"api_deployment"/);
      expect(content).toMatch(/triggers\s*=\s*{/);
    });

    test("declares API Gateway stage", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_stage"\s+"api_stage"/);
    });

    test("enables X-Ray tracing on API Gateway stage", () => {
      expect(content).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test("configures CloudWatch access logs for API Gateway", () => {
      expect(content).toMatch(/access_log_settings\s*{/);
      expect(content).toMatch(/destination_arn\s*=\s*aws_cloudwatch_log_group\.api_gateway_logs\.arn/);
    });

    test("declares CloudWatch log group for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"/);
    });

    test("declares API Gateway account with CloudWatch role", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_account"\s+"api_account"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"api_gateway_cloudwatch_role"/);
    });
  });

  describe("CloudWatch Monitoring and Alarms", () => {
    test("declares API Gateway error alarm", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_errors_alarm"/);
      expect(content).toMatch(/metric_name\s*=\s*"5XXError"/);
    });

    test("declares API Gateway latency alarm", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_latency_alarm"/);
      expect(content).toMatch(/metric_name\s*=\s*"Latency"/);
    });

    test("declares DynamoDB throttle alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_read_throttle_alarm"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_write_throttle_alarm"/);
      expect(content).toMatch(/metric_name\s*=\s*"ReadThrottleEvents"/);
      expect(content).toMatch(/metric_name\s*=\s*"WriteThrottleEvents"/);
    });

    test("declares Lambda error alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_get_workouts_errors"/);
    });

    test("declares CloudWatch dashboard", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"fitness_app_dashboard"/);
    });

    test("dashboard includes API Gateway metrics", () => {
      const dashboardMatch = content.match(/resource\s+"aws_cloudwatch_dashboard"\s+"fitness_app_dashboard"[\s\S]*?dashboard_body\s*=\s*jsonencode\(([\s\S]*?)\s*\}\)/);
      expect(dashboardMatch).toBeTruthy();
      const dashboard = dashboardMatch![1];
      expect(dashboard).toMatch(/AWS\/ApiGateway/);
      expect(dashboard).toMatch(/Count/);
      expect(dashboard).toMatch(/Latency/);
    });

    test("dashboard includes DynamoDB metrics", () => {
      const dashboardMatch = content.match(/resource\s+"aws_cloudwatch_dashboard"\s+"fitness_app_dashboard"[\s\S]*?dashboard_body\s*=\s*jsonencode\(([\s\S]*?)\s*\}\)/);
      expect(dashboardMatch).toBeTruthy();
      const dashboard = dashboardMatch![1];
      expect(dashboard).toMatch(/AWS\/DynamoDB/);
      expect(dashboard).toMatch(/ConsumedReadCapacityUnits/);
      expect(dashboard).toMatch(/ConsumedWriteCapacityUnits/);
    });

    test("dashboard includes Lambda metrics", () => {
      const dashboardMatch = content.match(/resource\s+"aws_cloudwatch_dashboard"\s+"fitness_app_dashboard"[\s\S]*?dashboard_body\s*=\s*jsonencode\(([\s\S]*?)\s*\}\)/);
      expect(dashboardMatch).toBeTruthy();
      const dashboard = dashboardMatch![1];
      expect(dashboard).toMatch(/AWS\/Lambda/);
      expect(dashboard).toMatch(/Invocations/);
    });
  });

  describe("Resource Tagging", () => {
    test("defines common_tags local with Environment, Owner, and Project", () => {
      expect(content).toMatch(/common_tags\s*=\s*{/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/Owner\s*=\s*var\.owner/);
      expect(content).toMatch(/Project\s*=\s*var\.project/);
    });

    test("applies tags to major resources", () => {
      const taggedResources = [
        'aws_kms_key',
        'aws_dynamodb_table',
        'aws_lambda_function',
        'aws_api_gateway_rest_api',
        'aws_cloudwatch_log_group',
        'aws_iam_role'
      ];

      taggedResources.forEach(resourceType => {
        const resourceMatches = content.match(new RegExp(`resource\\s+"${resourceType}"[\\s\\S]*?tags\\s*=`, 'g'));
        expect(resourceMatches).toBeTruthy();
      });
    });
  });

  describe("Data Sources", () => {
    test("declares data source for current AWS region", () => {
      expect(content).toMatch(/data\s+"aws_region"\s+"current"\s*{/);
    });

    test("declares data source for current AWS account", () => {
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });

    test("declares archive_file data sources for Lambda code", () => {
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_get_workouts"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_create_workout"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_update_workout"/);
      expect(content).toMatch(/data\s+"archive_file"\s+"lambda_delete_workout"/);
    });
  });

  describe("Outputs", () => {
    test("declares api_url output", () => {
      expect(content).toMatch(/output\s+"api_url"\s*{/);
    });

    test("declares DynamoDB table outputs", () => {
      expect(content).toMatch(/output\s+"dynamodb_table_name"\s*{/);
      expect(content).toMatch(/output\s+"dynamodb_table_arn"\s*{/);
    });

    test("declares Lambda function outputs", () => {
      expect(content).toMatch(/output\s+"lambda_functions"\s*{/);
    });

    test("declares CloudWatch dashboard URL output", () => {
      expect(content).toMatch(/output\s+"cloudwatch_dashboard_url"\s*{/);
    });

    test("declares KMS key outputs", () => {
      expect(content).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(content).toMatch(/output\s+"kms_key_arn"\s*{/);
    });
  });
});

describe("Terraform Fitness API Stack - Security Best Practices", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("all data encrypted at rest with KMS", () => {
    expect(content).toMatch(/kms_key_arn/);
    expect(content).toMatch(/server_side_encryption/);
  });

  test("KMS key rotation enabled", () => {
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("CloudWatch logging enabled for all Lambda functions", () => {
    const logGroupMatches = content.match(/resource\s+"aws_cloudwatch_log_group"/g);
    expect(logGroupMatches).toBeTruthy();
    expect(logGroupMatches!.length).toBeGreaterThanOrEqual(5); // 4 Lambda + 1 API Gateway
  });

  test("X-Ray tracing enabled for observability", () => {
    expect(content).toMatch(/tracing_config/);
    expect(content).toMatch(/xray_tracing_enabled\s*=\s*true/);
  });

  test("point-in-time recovery enabled for DynamoDB", () => {
    expect(content).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
  });
});
