import fs from 'fs';
import path from 'path';

describe('tap_stack.tf: Full Coverage (Generated)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -- Variables --
  describe('Variables', () => {
    const expectedVariables = [
      'region', 'environment', 'projectname', 'sensorcount', 'factorycount', 'sensortypes'
    ];
    test('defines all required variables', () => {
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -- Locals --
  describe('Locals', () => {
    const expectedLocals = [
      'suffix', 'commontags', 'nameprefix', 'vpccidr', 'publicsubnetcidrs', 'privatesubnetcidrs', 'azs'
    ];
    test('defines all required locals', () => {
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`locals?\\s*{[^}]*${l}[^}]*}`, 's'))
      );
    });

    test('common_tags contains required standard keys', () => {
      ['Environment', 'Project', 'ManagedBy', 'Stack', 'CreatedAt'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=`))
      );
    });
  });

  // -- Networking --
  describe('Networking Resources', () => {
    test('VPC and subnets defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });
    test('IGW, EIP, NAT, route tables present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // -- S3 Buckets --
  describe('S3 Resources', () => {
    ['datalake', 'athenaresults', 'gluescripts'].forEach(bucket =>
      test(`S3 bucket "${bucket}" exists`, () => {
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`)
        );
      })
    );
    ['datalake'].forEach(bucket =>
      test(`S3 bucket versioning and SSE for "${bucket}"`, () => {
        expect(tfContent).toMatch(
          new RegExp(
            `resource\\s+"aws_s3_bucket_versioning"\\s+"${bucket}"`
          )
        );
        expect(tfContent).toMatch(
          new RegExp(
            `resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucket}"`
          )
        );
      })
    );
  });

  // -- DynamoDB, Kinesis, Timestream --
  describe('Data Ingestion & Persistence', () => {
    test('DynamoDB, Kinesis, Timestream resources exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"buffereddata"/);
      expect(tfContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_timestreamwrite_database"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_timestreamwrite_table"\s+"sensordata"/);
    });
    test('DynamoDB GSI for sensortype', () => {
      expect(tfContent).toMatch(/globalsecondaryindex[^}]*name\s*=\s*"sensortypeindex"/s);
    });
  });

  // -- Lambda Functions --
  describe('Lambdas', () => {
    [
      { name: 'deviceverification', handler: 'index.handler', runtime: 'nodejs20.x' },
      { name: 'datareplay', handler: 'index.handler', runtime: 'python3.11' }
    ].forEach(({ name, handler, runtime }) => {
      test(`Lambda function "${name}" exists with correct handler/runtime`, () => {
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_lambda_function"\\s+"${name}"`)
        );
        expect(tfContent).toMatch(
          new RegExp(`handler\\s*=\\s*"${handler}"`)
        );
        expect(tfContent).toMatch(
          new RegExp(`runtime\\s*=\\s*"${runtime}"`)
        );
      });
      test(`Lambda IAM role, policy, and VPC attachments for "${name}"`, () => {
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_iam_role"\\s+"lambda${name}"`)
        );
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_iam_role_policy"\\s+"lambda${name}"`)
        );
        expect(tfContent).toMatch(
          new RegExp(`resource\\s+"aws_iam_role_policy_attachment"\\s+"lambda${name}vpc"`)
        );
      });
    });
  });

  // -- Step Functions, Glue, IAM Roles --
  describe('Step Functions & Glue', () => {
    test('Step Functions state machine IAM role objects exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"stepfunctions"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"stepfunctions"/);
    });
    test('Glue job IAM role, policy, and attachment', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"glue"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"glue"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"glueservice"/);
    });
  });

  // -- SQS Resources --
  describe('Queues', () => {
    test('Sensor SQS queues and DLQs defined per sensor type', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sqs_queue"\s+"sensorqueues"/);
      expect(tfContent).toMatch(/resource\s+"aws_sqs_queue"\s+"sensordlq"/);
      expect(tfContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"sensorqueues"/);
    });
  });

  // -- Athena, Glue Catalog --
  describe('Athena & Glue Catalog', () => {
    test('Athena workgroup, database, named query exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_athena_workgroup"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_athena_database"\s+"datalake"/);
      expect(tfContent).toMatch(/resource\s+"aws_athena_named_query"\s+"gapdetection"/);
    });
    test('Glue catalog database/table and Glue job are present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_glue_catalog_database"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_glue_catalog_table"\s+"sensordata"/);
      expect(tfContent).toMatch(/resource\s+"aws_glue_job"\s+"backfill"/);
    });
  });

  // -- Monitoring and Alerting --
  describe('Monitoring & Alerting', () => {
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
    test('SNS topic and subscription are present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"/);
    });
  });

  // -- Outputs --
  describe('Outputs', () => {
    [
      'vpcid', 'vpccidr', 'publicsubnetids', 'privatesubnetids',
      'natgatewayids', 'internetgatewayid', 's3datalakebucket', 's3athenaresultsbucket',
      's3gluescriptsbucket', 'dynamodbtablename', 'dynamodbtablearn', 'kinesisstreamname',
      'kinesisstreamarn', 'timestreamdatabasename', 'timestreamtablename',
      'lambdadeviceverificationarn', 'lambdadeviceverificationname',
      'lambdadatareplayarn', 'lambdadatareplayname', 'stepfunctionsstatemachinearn',
      'stepfunctionsstatemachinename', 'snstopicarn', 'cloudwatchalarmconnectionfailures',
      'cloudwatchalarmmessagedrop', 'cloudwatchdashboardurl', 'eventbridgerulename',
      'sqsqueueurls', 'gluecatalogdatabasename', 'gluejobname', 'athenaworkgroupname',
      'athenadatabasename', 'securitygrouplambdaid', 'iamrolelambdadeviceverificationarn',
      'iamrolelambdadatareplayarn', 'iamrolestepfunctionsarn', 'iamrolegluearn',
      'stacksuffix', 'environment', 'projectname', 'deploymenttimestamp'
    ].forEach(output =>
      test(`output "${output}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      })
    );
  });
});
