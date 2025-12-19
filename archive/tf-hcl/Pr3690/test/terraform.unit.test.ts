// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates IoT monitoring system components without executing Terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform IoT Monitoring Stack: tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Stack file not found at: ${stackPath}`);
    }
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  // ===== FILE EXISTENCE AND BASIC STRUCTURE =====
  describe("File Structure and Basic Requirements", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("references aws_region variable (should be defined in provider.tf)", () => {
      expect(stackContent).toMatch(/var\.aws_region/);
    });

    test("contains proper Terraform syntax structure", () => {
      // Check for basic Terraform blocks
      expect(stackContent).toMatch(/variable\s+"/);
      expect(stackContent).toMatch(/resource\s+"/);
      expect(stackContent).toMatch(/output\s+"/);
      expect(stackContent).toMatch(/locals\s*{/);
    });
  });

  // ===== VARIABLES VALIDATION =====
  describe("Variable Declarations", () => {
    test("declares all required variables with proper types and defaults", () => {
      const requiredVariables = [
        { name: "project_name", type: "string", defaultValue: "agri-iot-monitor" },
        { name: "environment", type: "string", defaultValue: "production" },
        { name: "owner", type: "string", defaultValue: "AgriTech Team" },
        { name: "cost_center", type: "string", defaultValue: "AGRI-IOT-001" },
        { name: "retention_days", type: "number", defaultValue: "30" },
        { name: "kinesis_shard_count", type: "number", defaultValue: "50" },
        { name: "dynamodb_read_capacity", type: "number", defaultValue: "500" },
        { name: "dynamodb_write_capacity", type: "number", defaultValue: "500" },
        { name: "alert_email", type: "string", defaultValue: "alerts@agriculture-company.com" },
        { name: "sensor_data_ttl_days", type: "number", defaultValue: "90" }
      ];

      requiredVariables.forEach(variable => {
        const variableRegex = new RegExp(
          `variable\\s+"${variable.name}"\\s*{[\\s\\S]*?type\\s*=\\s*${variable.type}[\\s\\S]*?default\\s*=\\s*[\\s\\S]*?}`,
          "m"
        );
        expect(stackContent).toMatch(variableRegex);
      });
    });

    test("variables have proper descriptions", () => {
      const variableDescriptions = [
        "Name of the project",
        "Deployment environment",
        "Team or individual owner",
        "Cost center for billing",
        "Number of days to retain logs",
        "Number of shards for the Kinesis Data Stream",
        "Read capacity units for DynamoDB",
        "Write capacity units for DynamoDB",
        "Email address to send alerts",
        "Time to live for sensor data"
      ];

      variableDescriptions.forEach(description => {
        expect(stackContent).toMatch(new RegExp(description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      });
    });
  });

  // ===== LOCALS AND TAGGING =====
  describe("Locals and Tagging Strategy", () => {
    test("defines common_tags local with required tags", () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*?common_tags\s*=\s*{/);

      const requiredTags = ["Environment", "Owner", "CostCenter", "Application", "ManagedBy"];
      requiredTags.forEach(tag => {
        expect(stackContent).toMatch(new RegExp(`${tag}\\s*=`));
      });
    });

    test("ManagedBy tag is set to terraform", () => {
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  // ===== DATA SOURCES =====
  describe("Data Sources", () => {
    test("defines required AWS data sources", () => {
      expect(stackContent).toMatch(/data\s+"aws_iot_endpoint"\s+"endpoint"/);
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("IoT endpoint uses correct endpoint type", () => {
      expect(stackContent).toMatch(/endpoint_type\s*=\s*"iot:Data-ATS"/);
    });
  });

  // ===== KMS ENCRYPTION =====
  describe("KMS Key and Encryption", () => {
    test("defines KMS key with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"iot_key"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("defines KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"iot_key_alias"/);
      expect(stackContent).toMatch(/alias\/\$\{var\.project_name\}-key/);
    });
  });

  // ===== IAM ROLES AND POLICIES =====
  describe("IAM Roles and Policies", () => {
    test("defines IoT role with proper assume role policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"iot_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"iot\.amazonaws\.com"/);
    });

    test("defines Lambda role with proper assume role policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test("defines QuickSight role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"quicksight_service_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"quicksight\.amazonaws\.com"/);
    });

    test("IAM policies follow least privilege principle", () => {
      // Check that policies are specific and not overly broad
      expect(stackContent).toMatch(/kinesis:PutRecord/);
      expect(stackContent).toMatch(/dynamodb:PutItem/);
      expect(stackContent).toMatch(/sns:Publish/);
      // Check that most resources are specific, not wildcard
      expect(stackContent).toMatch(/Resource\s*=\s*aws_kinesis_stream/);
      expect(stackContent).toMatch(/aws_dynamodb_table\.iot_data\.arn/);
    });

    test("attaches policies to roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
      expect(stackContent).toMatch(/aws_iam_role\.iot_role\.name/);
      expect(stackContent).toMatch(/aws_iam_role\.lambda_role\.name/);
    });
  });

  // ===== IOT CORE RESOURCES =====
  describe("IoT Core Resources", () => {
    test("defines IoT thing type", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iot_thing_type"\s+"sensor_type"/);
      expect(stackContent).toMatch(/description\s*=\s*"Agriculture IoT sensor"/);
    });

    test("defines IoT policy with proper permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iot_policy"\s+"sensor_policy"/);
      expect(stackContent).toMatch(/iot:Connect/);
      expect(stackContent).toMatch(/iot:Publish/);
      expect(stackContent).toMatch(/iot:Subscribe/);
      expect(stackContent).toMatch(/iot:Receive/);
    });

    test("defines IoT topic rule for sensor data", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iot_topic_rule"\s+"sensor_data_rule"/);
      expect(stackContent).toMatch(/SELECT \* FROM 'sensors\/data'/);
      expect(stackContent).toMatch(/kinesis\s*{/);
    });

    test("IoT topic rule has error action configured", () => {
      expect(stackContent).toMatch(/error_action\s*{/);
      expect(stackContent).toMatch(/cloudwatch_logs\s*{/);
    });
  });

  // ===== KINESIS DATA STREAM =====
  describe("Kinesis Data Stream", () => {
    test("defines Kinesis stream with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"iot_stream"/);
      expect(stackContent).toMatch(/shard_count\s*=\s*var\.kinesis_shard_count/);
      expect(stackContent).toMatch(/retention_period\s*=\s*24/);
    });

    test("Kinesis stream has KMS encryption enabled", () => {
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.iot_key\.arn/);
    });

    test("Kinesis stream is in PROVISIONED mode", () => {
      expect(stackContent).toMatch(/stream_mode\s*=\s*"PROVISIONED"/);
    });
  });

  // ===== DYNAMODB TABLE =====
  describe("DynamoDB Table", () => {
    test("defines DynamoDB table with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"iot_data"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
      expect(stackContent).toMatch(/hash_key\s*=\s*"device_id"/);
      expect(stackContent).toMatch(/range_key\s*=\s*"timestamp"/);
    });

    test("DynamoDB table has proper attributes defined", () => {
      const attributes = ["device_id", "timestamp", "sensor_type", "location_id"];
      attributes.forEach(attr => {
        expect(stackContent).toMatch(new RegExp(`name\\s*=\\s*"${attr}"`));
      });
    });

    test("DynamoDB table has Global Secondary Indexes", () => {
      expect(stackContent).toMatch(/global_secondary_index\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"SensorTypeIndex"/);
      expect(stackContent).toMatch(/name\s*=\s*"LocationIndex"/);
    });

    test("DynamoDB table has TTL enabled", () => {
      expect(stackContent).toMatch(/ttl\s*{/);
      expect(stackContent).toMatch(/attribute_name\s*=\s*"expires_at"/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB table has point-in-time recovery enabled", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB table has server-side encryption", () => {
      expect(stackContent).toMatch(/server_side_encryption\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.iot_key\.arn/);
    });
  });

  // ===== LAMBDA FUNCTIONS =====
  describe("Lambda Functions", () => {
    test("creates Lambda function code files using local_file", () => {
      expect(stackContent).toMatch(/resource\s+"local_file"\s+"data_processor_code"/);
      expect(stackContent).toMatch(/resource\s+"local_file"\s+"anomaly_detector_code"/);
    });

    test("creates ZIP files using archive_file data source", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"data_processor_zip"/);
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"anomaly_detector_zip"/);
    });

    test("defines data processor Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"data_processor"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
      expect(stackContent).toMatch(/handler\s*=\s*"data_processor\.handler"/);
    });

    test("defines anomaly detector Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"anomaly_detector"/);
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
      expect(stackContent).toMatch(/handler\s*=\s*"anomaly_detector\.handler"/);
    });

    test("Lambda functions have proper environment variables", () => {
      expect(stackContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.iot_data\.name/);
      expect(stackContent).toMatch(/SNS_TOPIC_ARN\s*=\s*aws_sns_topic\.iot_alerts\.arn/);
      expect(stackContent).toMatch(/TTL_DAYS\s*=\s*var\.sensor_data_ttl_days/);
    });

    test("Lambda event source mapping is configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"/);
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_kinesis_stream\.iot_stream\.arn/);
      expect(stackContent).toMatch(/starting_position\s*=\s*"LATEST"/);
    });

    test("Lambda functions have proper timeout and memory settings", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*60/);
      expect(stackContent).toMatch(/timeout\s*=\s*300/);
      expect(stackContent).toMatch(/memory_size\s*=\s*512/);
      expect(stackContent).toMatch(/memory_size\s*=\s*1024/);
    });
  });

  // ===== EVENTBRIDGE AND SCHEDULING =====
  describe("EventBridge and Scheduling", () => {
    test("defines EventBridge rule for anomaly detection", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"anomaly_detection_schedule"/);
      expect(stackContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
    });

    test("defines EventBridge target", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
      expect(stackContent).toMatch(/arn\s*=\s*aws_lambda_function\.anomaly_detector\.arn/);
    });

    test("defines Lambda permission for EventBridge", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
      expect(stackContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  // ===== SNS TOPIC AND ALERTS =====
  describe("SNS Topic and Alerts", () => {
    test("defines SNS topic with KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"iot_alerts"/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.iot_key\.id/);
    });

    test("defines SNS topic subscription", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
      expect(stackContent).toMatch(/endpoint\s*=\s*var\.alert_email/);
    });
  });

  // ===== CLOUDWATCH MONITORING =====
  describe("CloudWatch Monitoring", () => {
    test("defines CloudWatch log groups with KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.iot_key\.arn/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.retention_days/);
    });

    test("defines CloudWatch alarms for monitoring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_throttled_records"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttled_requests"/);
    });

    test("CloudWatch alarms have proper configuration", () => {
      expect(stackContent).toMatch(/comparison_operator\s*=\s*"GreaterThanThreshold"/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.iot_alerts\.arn\]/);
      expect(stackContent).toMatch(/treat_missing_data\s*=\s*"notBreaching"/);
    });

    test("defines CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"iot_dashboard"/);
      expect(stackContent).toMatch(/dashboard_body\s*=\s*jsonencode/);
    });
  });

  // ===== QUICKSIGHT RESOURCES =====
  describe("QuickSight Resources", () => {
    test("defines QuickSight service role for DynamoDB access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"quicksight_service_role"/);
      expect(stackContent).toMatch(/Service\s*=\s*"quicksight\.amazonaws\.com"/);
    });

    test("defines QuickSight DynamoDB access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"quicksight_dynamodb_access"/);
      expect(stackContent).toMatch(/dynamodb:DescribeTable/);
      expect(stackContent).toMatch(/dynamodb:Query/);
      expect(stackContent).toMatch(/dynamodb:Scan/);
    });

    test("attaches QuickSight policy to service role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"quicksight_dynamodb_attachment"/);
      expect(stackContent).toMatch(/aws_iam_role\.quicksight_service_role\.name/);
    });

    test("QuickSight policy includes KMS permissions", () => {
      expect(stackContent).toMatch(/kms:Decrypt/);
      expect(stackContent).toMatch(/kms:GenerateDataKey/);
    });

    test("includes note about manual QuickSight configuration", () => {
      expect(stackContent).toMatch(/manual.*configuration/i);
    });
  });

  // ===== OUTPUTS VALIDATION =====
  describe("Output Values", () => {
    test("defines all required outputs", () => {
      const requiredOutputs = [
        "iot_endpoint",
        "kinesis_stream_name",
        "kinesis_stream_arn",
        "dynamodb_table_name",
        "dynamodb_table_arn",
        "sns_topic_arn",
        "cloudwatch_dashboard_url",
        "quicksight_dashboard_url",
        "quicksight_service_role_arn",
        "lambda_function_arns",
        "lambda_function_names",
        "iam_role_arns",
        "kms_key_arn",
        "kms_key_id",
        "iot_thing_type",
        "iot_policy_name",
        "iot_topic_rule_name",
        "cloudwatch_log_groups"
      ];

      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("outputs have proper descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*".*endpoint.*"/);
      expect(stackContent).toMatch(/description\s*=\s*".*ARN.*"/);
      expect(stackContent).toMatch(/description\s*=\s*".*Dashboard.*"/);
    });

    test("outputs reference correct resources", () => {
      expect(stackContent).toMatch(/value\s*=\s*data\.aws_iot_endpoint\.endpoint\.endpoint_address/);
      expect(stackContent).toMatch(/value\s*=\s*aws_kinesis_stream\.iot_stream\.name/);
      expect(stackContent).toMatch(/value\s*=\s*aws_dynamodb_table\.iot_data\.arn/);
    });
  });

  // ===== SECURITY AND BEST PRACTICES =====
  describe("Security and Best Practices", () => {
    test("all resources use common_tags for consistent tagging", () => {
      const resourcesWithTags = stackContent.match(/tags\s*=\s*local\.common_tags/g);
      expect(resourcesWithTags).toBeTruthy();
      expect(resourcesWithTags!.length).toBeGreaterThan(10);
    });

    test("KMS encryption is used throughout the stack", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.iot_key/);
      expect(stackContent).toMatch(/kms_key_arn\s*=\s*aws_kms_key\.iot_key\.arn/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.iot_key/);
    });

    test("no hardcoded secrets or sensitive values", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(stackContent).not.toMatch(/key\s*=\s*"[A-Za-z0-9+\/=]{20,}"/);
    });

    test("uses variable references instead of hardcoded values", () => {
      expect(stackContent).toMatch(/var\./);
      expect(stackContent).toMatch(/\$\{var\./);
    });
  });

  // ===== AGRICULTURE IOT SPECIFIC REQUIREMENTS =====
  describe("Agriculture IoT Specific Requirements", () => {
    test("configured for 50,000 sensors scale", () => {
      expect(stackContent).toMatch(/50.*sensors/i);
      expect(stackContent).toMatch(/default\s*=\s*50.*shard/);
    });

    test("includes agriculture-specific sensor types", () => {
      expect(stackContent).toMatch(/temperature/);
      expect(stackContent).toMatch(/humidity/);
      expect(stackContent).toMatch(/soil_moisture/);
    });

    test("has proper anomaly detection thresholds for agriculture", () => {
      expect(stackContent).toMatch(/temperature.*>.*40/);
      expect(stackContent).toMatch(/humidity.*>.*95/);
      expect(stackContent).toMatch(/temperature.*<.*-10/);
    });

    test("includes location-based indexing for farm management", () => {
      expect(stackContent).toMatch(/location_id/);
      expect(stackContent).toMatch(/LocationIndex/);
    });
  });

  // ===== NO EXTERNAL FILE DEPENDENCIES =====
  describe("No External File Dependencies", () => {
    test("does not reference external ZIP files", () => {
      expect(stackContent).not.toMatch(/filename\s*=\s*"[^"]*\.zip"/);
      expect(stackContent).not.toMatch(/source_code_hash\s*=\s*filebase64sha256\s*\(\s*"[^"]*\.zip"/);
    });

    test("uses local_file and archive_file for Lambda code", () => {
      expect(stackContent).toMatch(/resource\s+"local_file"/);
      expect(stackContent).toMatch(/data\s+"archive_file"/);
    });

    test("Lambda code is embedded in the Terraform file", () => {
      expect(stackContent).toMatch(/content\s*=\s*<<EOF/);
      expect(stackContent).toMatch(/const AWS = require/);
      expect(stackContent).toMatch(/import json/);
    });
  });

  // ===== PERFORMANCE AND SCALABILITY =====
  describe("Performance and Scalability", () => {
    test("Kinesis is properly sized for high throughput", () => {
      expect(stackContent).toMatch(/shard_count\s*=\s*var\.kinesis_shard_count/);
      expect(stackContent).toMatch(/parallelization_factor\s*=\s*10/);
    });

    test("DynamoDB has appropriate capacity settings", () => {
      expect(stackContent).toMatch(/read_capacity\s*=\s*var\.dynamodb_read_capacity/);
      expect(stackContent).toMatch(/write_capacity\s*=\s*var\.dynamodb_write_capacity/);
    });

    test("Lambda functions have reasonable timeout and memory", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*(60|300)/);
      expect(stackContent).toMatch(/memory_size\s*=\s*(512|1024)/);
    });
  });
});