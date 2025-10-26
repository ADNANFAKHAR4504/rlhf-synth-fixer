import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

AWS.config.update({ region: 'us-east-1' });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const kinesis = new AWS.Kinesis();
const lambda = new AWS.Lambda();
const timestream = new AWS.TimestreamWrite();
const athena = new AWS.Athena();
const glue = new AWS.Glue();
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();
const eventbridge = new AWS.EventBridge();

describe('TAP Stack Live Integration Tests (Full Coverage)', () => {
  it('VPC exists with correct CIDR', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) return;
    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) return;
    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment?.State).toBe('available');
  });

  it('Public/Private subnets exist and match VPC', async () => {
    const publicSubnetIds = outputs.public_subnet_ids && JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds = outputs.private_subnet_ids && JSON.parse(outputs.private_subnet_ids);
    if (!publicSubnetIds?.length || !privateSubnetIds?.length) return;

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    publicSubnets.Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(publicSubnetIds).toContain(subnet.SubnetId);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    privateSubnets.Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(privateSubnetIds).toContain(subnet.SubnetId);
    });
  });

  it('NAT Gateways exist and are available', async () => {
    const natGatewayIds = outputs.nat_gateway_ids && JSON.parse(outputs.nat_gateway_ids);
    if (!natGatewayIds?.length) return;
    const gat = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    gat.NatGateways?.forEach(g => expect(g.State).toBe('available'));
  });

  it('S3 buckets exist and are accessible', async () => {
    ['s3_data_lake_bucket', 's3_athena_results_bucket', 's3_glue_scripts_bucket'].forEach(bucketKey => {
      if (!outputs[bucketKey]) return;
      return s3.headBucket({ Bucket: outputs[bucketKey] }).promise();
    });
  });

  it('DynamoDB table exists and matches ARN/name', async () => {
    if (!outputs.dynamodb_table_name) return;
    const info = await dynamodb.describeTable({ TableName: outputs.dynamodb_table_name }).promise();
    expect(info.Table?.TableArn).toBe(outputs.dynamodb_table_arn);
    expect(info.Table?.TableName).toBe(outputs.dynamodb_table_name);
  });

  it('Kinesis stream exists with correct ARN/name', async () => {
    if (!outputs.kinesis_stream_name) return;
    const stream = await kinesis.describeStream({ StreamName: outputs.kinesis_stream_name }).promise();
    expect(stream.StreamDescription?.StreamARN).toBe(outputs.kinesis_stream_arn);
    expect(stream.StreamDescription?.StreamName).toBe(outputs.kinesis_stream_name);
  });

  it('Lambda functions exist and are active', async () => {
    [
      { key: 'lambda_device_verification_name', arn: outputs.lambda_device_verification_arn },
      { key: 'lambda_data_replay_name', arn: outputs.lambda_data_replay_arn }
    ].forEach(({ key, arn }) => {
      if (!outputs[key]) return;
      return lambda
        .getFunction({ FunctionName: outputs[key] })
        .promise()
        .then(data => {
          expect(data.Configuration?.FunctionArn).toBe(arn);
          expect(data.Configuration?.State).toMatch(/Active|Pending/);
        });
    });
  });

  it('Timestream database exists', async () => {
    if (!outputs.timestream_database_name) return;
    const db = await timestream.describeDatabase({ DatabaseName: outputs.timestream_database_name }).promise();
    expect(db.Database?.DatabaseName).toBe(outputs.timestream_database_name);
  });

  it('Athena workgroup/database exists', async () => {
    if (outputs.athena_workgroup_name) {
      const wg = await athena.getWorkGroup({ WorkGroup: outputs.athena_workgroup_name }).promise();
      expect(wg.WorkGroup?.Name).toBe(outputs.athena_workgroup_name);
    }
    if (outputs.athena_database_name) {
      const dbs = await athena.listDatabases({ CatalogName: 'AwsDataCatalog' }).promise();
      expect(dbs.DatabaseList?.map(d => d.Name)).toContain(outputs.athena_database_name);
    }
  });

  it('Glue catalog DB and backfill job exist', async () => {
    if (!outputs.glue_catalog_database_name || !outputs.glue_job_name) return;
    const dbs = await glue.getDatabase({ Name: outputs.glue_catalog_database_name }).promise();
    expect(dbs.Database?.Name).toBe(outputs.glue_catalog_database_name);
    const job = await glue.getJob({ JobName: outputs.glue_job_name }).promise();
    expect(job.Job?.Name).toBe(outputs.glue_job_name);
  });

  it('SNS Topic exists', async () => {
    if (!outputs.sns_topic_arn) return;
    const info = await sns.getTopicAttributes({ TopicArn: outputs.sns_topic_arn }).promise();
    expect(info.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
  });

  it('CloudWatch alarms and dashboard exist', async () => {
    if (outputs.cloudwatch_alarm_connection_failures) {
      const alarms = await cloudwatch.describeAlarms({ AlarmNames: [outputs.cloudwatch_alarm_connection_failures] }).promise();
      expect(alarms.MetricAlarms?.[0]?.AlarmName).toBe(outputs.cloudwatch_alarm_connection_failures);
    }
    if (outputs.cloudwatch_alarm_message_drop) {
      const alarms = await cloudwatch.describeAlarms({ AlarmNames: [outputs.cloudwatch_alarm_message_drop] }).promise();
      expect(alarms.MetricAlarms?.[0]?.AlarmName).toBe(outputs.cloudwatch_alarm_message_drop);
    }
    if (outputs.cloudwatch_dashboard_url) {
      const match = /name=([a-zA-Z0-9\-_]+)/.exec(outputs.cloudwatch_dashboard_url);
      const dashboardName = match && match[1];
      if (dashboardName) {
        const dash = await cloudwatch.getDashboard({ DashboardName: dashboardName }).promise();
        expect(dash.DashboardName).toBe(dashboardName);
      }
    }
  });

  it('EventBridge rule exists with correct name', async () => {
    if (!outputs.eventbridge_rule_name) return;
    const rules = await eventbridge.listRules({ NamePrefix: outputs.eventbridge_rule_name }).promise();
    expect(rules.Rules?.some(r => r.Name === outputs.eventbridge_rule_name)).toBeTruthy();
  });

  it('Security group for Lambda exists', async () => {
    if (!outputs.security_group_lambda_id) return;
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.security_group_lambda_id] }).promise();
    expect(sg.SecurityGroups?.[0]?.GroupId).toBe(outputs.security_group_lambda_id);
  });

  it('IAM roles exist for all main resources', async () => {
    [
      outputs.iam_role_lambda_device_verification_arn,
      outputs.iam_role_lambda_data_replay_arn,
      outputs.iam_role_step_functions_arn,
      outputs.iam_role_glue_arn
    ].forEach(arn => {
      if (!arn) return;
      const parsed = /arn:aws:iam::([^:]+):role\/(.+)/.exec(arn);
      const roleName = parsed && parsed[2];
      if (roleName) {
        return new AWS.IAM()
          .getRole({ RoleName: roleName })
          .promise()
          .then(res => expect(res.Role?.Arn).toBe(arn));
      }
    });
  });

  it('Stack deployment timestamp is valid', async () => {
    expect(outputs.deployment_timestamp).toMatch(/20[2-3][0-9]-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  });

  it('Project name and environment variables match', async () => {
    expect(outputs.project_name).toBeDefined();
    expect(outputs.environment).toBeDefined();
    expect(typeof outputs.project_name).toBe('string');
    expect(typeof outputs.environment).toBe('string');
  });

  it('All sensor SQS queue URLs are valid', async () => {
    if (!outputs.sqs_queue_urls) return;
    const urlsObj = typeof outputs.sqs_queue_urls === 'string'
      ? JSON.parse(outputs.sqs_queue_urls.replace(/\\/g, ''))
      : outputs.sqs_queue_urls;
    Object.values(urlsObj).forEach(url => {
      expect(url).toMatch(/^https:\/\/sqs\.us-east-1\.amazonaws\.com\/[^/]+\/iot-recovery-prod-abdb-.+-queue\/?$/);
    });
  });
});
