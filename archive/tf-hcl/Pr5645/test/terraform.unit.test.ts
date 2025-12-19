

import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (from tap_stack.tf)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Variables
  describe('Variables', () => {
    const expectedVariables = [
      'primary_region',
      'secondary_region',
      'environment',
      'fraud_threshold_amount',
      'alert_email',
    ];

    expectedVariables.forEach(variable => {
      test(`should define variable "${variable}"`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variable}"`));
      });
    });
  });


  // Resources
  describe('Resources', () => {
    // List of resource type and names from tap_stack.tf
    const resources = [
      ['aws_vpc', 'primary'],
      ['aws_internet_gateway', 'primary'],
      ['aws_eip', 'nat_primary'],
      ['aws_subnet', 'public_primary_1'],
      ['aws_subnet', 'public_primary_2'],
      ['aws_subnet', 'private_primary_1'],
      ['aws_subnet', 'private_primary_2'],
      ['aws_nat_gateway', 'primary'],
      ['aws_route_table', 'public_primary'],
      ['aws_route_table', 'private_primary'],
      ['aws_route_table_association', 'public_primary_1'],
      ['aws_route_table_association', 'public_primary_2'],
      ['aws_route_table_association', 'private_primary_1'],
      ['aws_route_table_association', 'private_primary_2'],
      ['aws_security_group', 'lambda_primary'],
      ['aws_vpc', 'secondary'],
      ['aws_internet_gateway', 'secondary'],
      ['aws_eip', 'nat_secondary'],
      ['aws_subnet', 'public_secondary_1'],
      ['aws_subnet', 'public_secondary_2'],
      ['aws_subnet', 'private_secondary_1'],
      ['aws_subnet', 'private_secondary_2'],
      ['aws_nat_gateway', 'secondary'],
      ['aws_route_table', 'public_secondary'],
      ['aws_route_table', 'private_secondary'],
      ['aws_route_table_association', 'public_secondary_1'],
      ['aws_route_table_association', 'public_secondary_2'],
      ['aws_route_table_association', 'private_secondary_1'],
      ['aws_route_table_association', 'private_secondary_2'],
      ['aws_security_group', 'lambda_secondary'],
      ['aws_s3_bucket', 'primary'],
      ['aws_s3_bucket_versioning', 'primary'],
      ['aws_s3_bucket_server_side_encryption_configuration', 'primary'],
      ['aws_s3_bucket_lifecycle_configuration', 'primary'],
      ['aws_s3_bucket', 'secondary'],
      ['aws_s3_bucket_versioning', 'secondary'],
      ['aws_s3_bucket_server_side_encryption_configuration', 'secondary'],
      ['aws_s3_bucket_lifecycle_configuration', 'secondary'],
      ['aws_iam_role', 's3_replication'],
      ['aws_iam_role_policy', 's3_replication'],
      ['aws_s3_bucket_replication_configuration', 'primary'],
      ['aws_dynamodb_table', 'fraud_scores_primary'],
      ['aws_dynamodb_table', 'transaction_metadata_primary'],
      ['aws_sqs_queue', 'ingestion_primary'],
      ['aws_sqs_queue', 'ingestion_dlq_primary'],
      ['aws_sqs_queue', 'scoring_primary'],
      ['aws_sqs_queue', 'scoring_dlq_primary'],
      ['aws_sqs_queue', 'alert_primary'],
      ['aws_sqs_queue', 'alert_dlq_primary'],
      ['aws_sqs_queue', 'ingestion_secondary'],
      ['aws_sqs_queue', 'ingestion_dlq_secondary'],
      ['aws_sqs_queue', 'scoring_secondary'],
      ['aws_sqs_queue', 'scoring_dlq_secondary'],
      ['aws_sqs_queue', 'alert_secondary'],
      ['aws_sqs_queue', 'alert_dlq_secondary'],
      ['aws_cloudwatch_event_bus', 'primary'],
      ['aws_cloudwatch_event_rule', 'fraud_scoring_primary'],
      ['aws_cloudwatch_event_rule', 'international_primary'],
      ['aws_cloudwatch_event_bus', 'secondary'],
      ['aws_cloudwatch_event_rule', 'fraud_scoring_secondary'],
      ['aws_cloudwatch_event_rule', 'international_secondary'],
      ['aws_iam_role', 'ingestion_lambda'],
      ['aws_iam_role_policy', 'ingestion_lambda'],
      ['aws_iam_role', 'scoring_lambda'],
      ['aws_iam_role_policy', 'scoring_lambda'],
      ['aws_iam_role', 'alert_lambda'],
      ['aws_iam_role_policy', 'alert_lambda'],
      ['aws_lambda_function', 'ingestion_primary'],
      ['aws_lambda_function', 'scoring_primary'],
      ['aws_lambda_function', 'alert_primary'],
      ['aws_lambda_function', 'ingestion_secondary'],
      ['aws_lambda_function', 'scoring_secondary'],
      ['aws_lambda_function', 'alert_secondary'],
      ['aws_cloudwatch_event_target', 'scoring_primary'],
      ['aws_cloudwatch_event_target', 'alert_primary'],
      ['aws_cloudwatch_event_target', 'scoring_secondary'],
      ['aws_cloudwatch_event_target', 'alert_secondary'],
      ['aws_lambda_permission', 'allow_eventbridge_scoring_primary'],
      ['aws_lambda_permission', 'allow_eventbridge_alert_primary'],
      ['aws_lambda_permission', 'allow_eventbridge_scoring_secondary'],
      ['aws_lambda_permission', 'allow_eventbridge_alert_secondary'],
      ['aws_sns_topic', 'alerts_primary'],
      ['aws_sns_topic_subscription', 'alerts_email_primary'],
      ['aws_sns_topic', 'alerts_secondary'],
      ['aws_sns_topic_subscription', 'alerts_email_secondary'],
      ['aws_cloudwatch_metric_alarm', 'lambda_errors_ingestion_primary'],
      ['aws_cloudwatch_metric_alarm', 'lambda_throttles_ingestion_primary'],
      ['aws_cloudwatch_metric_alarm', 'dynamodb_throttles_primary'],
      ['aws_cloudwatch_metric_alarm', 'sqs_message_age_primary'],
      ['aws_cloudwatch_log_group', 'ingestion_primary'],
      ['aws_cloudwatch_log_group', 'scoring_primary'],
      ['aws_cloudwatch_log_group', 'alert_primary'],
      ['aws_cloudwatch_log_group', 'ingestion_secondary'],
      ['aws_cloudwatch_log_group', 'scoring_secondary'],
      ['aws_cloudwatch_log_group', 'alert_secondary'],
    ];

    resources.forEach(([type, name]) => {
      test(`should define resource "${type}" "${name}"`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
      });
    });
  });

  // Outputs
  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_primary_id',
      'vpc_secondary_id',
      'subnets_public_primary',
      'subnets_private_primary',
      'subnets_public_secondary',
      'subnets_private_secondary',
      'lambda_ingestion_primary_arn',
      'lambda_scoring_primary_arn',
      'lambda_alert_primary_arn',
      'lambda_ingestion_secondary_arn',
      'lambda_scoring_secondary_arn',
      'lambda_alert_secondary_arn',
      's3_bucket_primary_name',
      's3_bucket_secondary_name',
      'dynamodb_fraud_scores_name',
      'dynamodb_transaction_metadata_name',
      'eventbridge_bus_primary_arn',
      'eventbridge_bus_secondary_arn',
      'sqs_ingestion_primary_url',
      'sqs_scoring_primary_url',
      'sqs_alert_primary_url',
      'sqs_ingestion_secondary_url',
      'sqs_scoring_secondary_url',
      'sqs_alert_secondary_url',
      'sns_alerts_primary_arn',
      'sns_alerts_secondary_arn',
      'security_group_lambda_primary_id',
      'security_group_lambda_secondary_id',
      'nat_gateway_primary_id',
      'nat_gateway_secondary_id',
      'igw_primary_id',
      'igw_secondary_id',
      'log_group_ingestion_primary',
      'log_group_scoring_primary',
      'log_group_alert_primary',
      'log_group_ingestion_secondary',
      'log_group_scoring_secondary',
      'log_group_alert_secondary',
      'iam_role_ingestion_lambda_arn',
      'iam_role_scoring_lambda_arn',
      'iam_role_alert_lambda_arn',
      'alarm_lambda_errors_ingestion_primary',
      'alarm_lambda_throttles_ingestion_primary',
      'alarm_dynamodb_throttles_primary',
      'alarm_sqs_message_age_primary',
      'aws_primary_region',
      'aws_secondary_region',
    ];

    expectedOutputs.forEach(output => {
      test(`should define output "${output}"`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

