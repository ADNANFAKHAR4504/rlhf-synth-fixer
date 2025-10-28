import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'environment',
        'project_name',
        'sensor_count',
        'factory_count',
        'sensor_types'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test('defines all expected locals', () => {
      const expectedLocals = [
        'suffix',
        'common_tags',
        'name_prefix',
        'vpc_cidr',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'azs'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags contains all standard tag keys', () => {
      ['Environment', 'Project', 'ManagedBy', 'Stack', 'CreatedAt'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
      );
    });
  });
  // -------------------------
  // Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC, Internet Gateway, subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('NAT Gateway(s), EIP(s), depend on IGW', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Route tables and associations exist for subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    [
      'data_lake',
      'athena_results',
      'glue_scripts'
    ].forEach(bucket =>
      test(`S3 bucket "${bucket}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
      })
    );
    test(`S3 bucket versioning for data_lake`, () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"data_lake"/);
    });
    test(`S3 bucket encryption for data_lake`, () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data_lake"/);
    });
  });

  // -------------------------
  // Data Ingestion & Persistence
  // -------------------------
  describe('Database, Stream, Table Resources', () => {
    test('DynamoDB, Kinesis, Timestream exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"buffered_data"/);
      expect(tfContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_timestreamwrite_database"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_timestreamwrite_table"\s+"sensor_data"/);
    });
    test('DynamoDB GSI for sensor_type', () => {
      expect(tfContent).toMatch(/global_secondary_index\s*{[^}]*name\s*=\s*"sensor_type_index"/s);
    });
  });

  // -------------------------
  // Lambda Functions & IAM
  // -------------------------
  describe('Lambdas', () => {
    [
      { name: 'device_verification', runtime: 'nodejs20.x', handler: 'index.handler' },
      { name: 'data_replay', runtime: 'python3.11', handler: 'index.handler' }
    ].forEach(({ name, runtime, handler }) => {
      test(`Lambda "${name}" exists with correct properties`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${name}"`));
        expect(tfContent).toMatch(new RegExp(`runtime\\s*=\\s*"${runtime}"`));
        expect(tfContent).toMatch(new RegExp(`handler\\s*=\\s*"${handler}"`));
      });
      test(`IAM role for Lambda "${name}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role"\\s+"lambda_${name}"`));
      });
      test(`IAM policy for Lambda "${name}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role_policy"\\s+"lambda_${name}"`));
      });
      test(`VPC policy attachment for Lambda "${name}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role_policy_attachment"\\s+"lambda_${name}_vpc"`));
      });
    });
  });

  // -------------------------
  // Step Functions & Glue IAM
  // -------------------------
  describe('Step Functions and Glue IAM', () => {
    test('Step Functions IAM role/policy', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"step_functions"/);
    });
    test('Glue IAM role/policy/attachment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"glue"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"glue"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"glue_service"/);
    });
  });

  // -------------------------
  // SQS Queues
  // -------------------------
  describe('SQS Sensor Queues', () => {
    test('Sensor queue and DLQ', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sqs_queue"\s+"sensor_queues"/);
      expect(tfContent).toMatch(/resource\s+"aws_sqs_queue"\s+"sensor_dlq"/);
      expect(tfContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"sensor_queues"/);
    });
  });

  // -------------------------
  // Athena & Glue Catalog
  // -------------------------
  describe('Athena & Glue Resources', () => {
    test('Athena workgroup/database/query', () => {
      expect(tfContent).toMatch(/resource\s+"aws_athena_workgroup"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_athena_database"\s+"data_lake"/);
      expect(tfContent).toMatch(/resource\s+"aws_athena_named_query"\s+"gap_detection"/);
    });
    test('Glue catalog DB/table/job', () => {
      expect(tfContent).toMatch(/resource\s+"aws_glue_catalog_database"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_glue_catalog_table"\s+"sensor_data"/);
      expect(tfContent).toMatch(/resource\s+"aws_glue_job"\s+"backfill"/);
    });
  });

  // -------------------------
  // Monitoring & Alerting
  // -------------------------
  describe('CloudWatch & SNS', () => {
    [
      'aws_cloudwatch_metric_alarm',
      'aws_cloudwatch_dashboard',
      'aws_cloudwatch_event_rule',
      'aws_cloudwatch_event_target'
    ].forEach(resource =>
      test(`${resource} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${resource}"`));
      })
    );
    test('SNS topic/trigger exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"lambda_trigger"/);
    });
    test('Lambda permission for SNS', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"sns_invoke"/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs = [
      'vpc_id', 'vpc_cidr', 'public_subnet_ids', 'private_subnet_ids',
      'nat_gateway_ids', 'internet_gateway_id',
      's3_data_lake_bucket', 's3_athena_results_bucket', 's3_glue_scripts_bucket',
      'dynamodb_table_name', 'dynamodb_table_arn',
      'kinesis_stream_name', 'kinesis_stream_arn',
      'timestream_database_name', 'timestream_table_name',
      'lambda_device_verification_arn', 'lambda_device_verification_name',
      'lambda_data_replay_arn', 'lambda_data_replay_name',
      'step_functions_state_machine_arn', 'step_functions_state_machine_name',
      'sns_topic_arn', 'cloudwatch_alarm_connection_failures', 'cloudwatch_alarm_message_drop',
      'cloudwatch_dashboard_url', 'eventbridge_rule_name', 'sqs_queue_urls',
      'athena_workgroup_name', 'athena_database_name', 'glue_catalog_database_name', 'glue_job_name',
      'security_group_lambda_id', 'iam_role_lambda_device_verification_arn',
      'iam_role_lambda_data_replay_arn', 'iam_role_step_functions_arn', 'iam_role_glue_arn',
      'stack_suffix', 'environment', 'project_name', 'deployment_timestamp'
    ];
    expectedOutputs.forEach(output => {
      test(`output "${output}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

