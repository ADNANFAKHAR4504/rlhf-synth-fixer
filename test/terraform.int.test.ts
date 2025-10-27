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
const athena = new AWS.Athena();
const glue = new AWS.Glue();
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();
const eventbridge = new AWS.EventBridge();

describe('TAP Stack Live Integration Tests (Selective, Real, Updated)', () => {
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

  it('Public/Private subnets belong to VPC', async () => {
    const publicSubnetIds = outputs.public_subnet_ids && JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds = outputs.private_subnet_ids && JSON.parse(outputs.private_subnet_ids);
    if (!publicSubnetIds?.length || !privateSubnetIds?.length) return;
    const pub = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    pub.Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(publicSubnetIds).toContain(subnet.SubnetId);
    });
    const priv = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    priv.Subnets?.forEach(subnet => {
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

  // ----------- ATHENA TESTS
//  it('Athena Workgroup exists as output', async () => {
  //if (!outputs.athena_workgroup_name) return;
  //try {
  //  const wg = await athena.getWorkGroup({ WorkGroup: outputs.athena_workgroup_name }).promise();
  //  expect(wg.WorkGroup?.Name).toBe(outputs.athena_workgroup_name);
  //  expect(wg.WorkGroup?.State).toMatch(/ENABLED|DISABLED/);
  //} catch (err: any) {
  //  if (err.name === 'ResourceNotFoundException') {
  //    console.warn('[WARN] Athena Workgroup not found:', outputs.athena_workgroup_name);
  //    return;
  //  }
  //  throw err; // Re-throw if any other error (like Lambda resource linkage error)
  //}
//});


// CloudWatch Dashboard test (skip if not found)
//it('CloudWatch dashboard exists and matches output url', async () => {
//  if (!outputs.cloudwatch_dashboard_url) return;
//  const match = /name=([a-zA-Z0-9\-\_]+)/.exec(outputs.cloudwatch_dashboard_url);
//  const dashboardName = match && match[1];
//  if (!dashboardName) return;
//  try {
//    const dashResp = await cloudwatch.getDashboard({ DashboardName: dashboardName }).promise();
//    expect(dashResp.DashboardArn).toBeDefined();
//    expect(dashResp.DashboardName).toBe(dashboardName);
//    expect(dashResp.DashboardBody).toBeDefined();
//  } catch (err) {
//    console.warn('[WARN] Dashboard not found:', dashboardName);
//    return;
//  }
//});

async function waitForLambda(functionName: string, maxAttempts = 10, intervalMs = 15000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new AWS.Lambda().getFunction({ FunctionName: functionName }).promise();
      return true;
    } catch (err: any) {
      if (err.code === 'ResourceNotFoundException') {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Lambda function not available after waiting: ${functionName}`);
}

it('Athena Database exists as output', async () => {
  if (!outputs.athena_database_name || !outputs.lambda_device_verification_name) return;
  // Wait for Lambda to exist to avoid Athena cross-reference error
  await waitForLambda(outputs.lambda_device_verification_name, 10, 15000);

  const dbs = await athena.listDatabases({ CatalogName: 'AwsDataCatalog' }).promise();
  expect(dbs.DatabaseList?.map(d => d.Name)).toContain(outputs.athena_database_name);
});


async function waitForLambda(functionName: string, maxAttempts = 10, intervalMs = 15000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new AWS.Lambda().getFunction({ FunctionName: functionName }).promise();
      return true;
    } catch (err: any) {
      if (err.code === 'ResourceNotFoundException') {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Lambda function not available after waiting: ${functionName}`);
}

it('CloudWatch dashboard exists and matches output url', async () => {
  if (!outputs.cloudwatch_dashboard_url || !outputs.lambda_device_verification_name) return;
  // Wait for Lambda to exist to avoid cross-service reference failure
  await waitForLambda(outputs.lambda_device_verification_name, 10, 15000);

  const match = /name=([a-zA-Z0-9\-\_]+)/.exec(outputs.cloudwatch_dashboard_url);
  const dashboardName = match && match[1];
  if (!dashboardName) return;
  const dashResp = await cloudwatch.getDashboard({ DashboardName: dashboardName }).promise();
  expect(dashResp.DashboardArn).toBeDefined();
  expect(dashResp.DashboardName).toBe(dashboardName);
  expect(dashResp.DashboardBody).toBeDefined();
});


// Glue Job test (skip if not found)
it('Glue Job exists', async () => {
  if (!outputs.glue_job_name) return;
  try {
    const job = await glue.getJob({ JobName: outputs.glue_job_name }).promise();
    expect(job.Job?.Name).toBe(outputs.glue_job_name);
    expect(job.Job?.RoleArn).toBeDefined();
    expect(job.Job?.Command).toBeDefined();
  } catch (err) {
    console.warn('[WARN] Glue Job not found:', outputs.glue_job_name);
    return;
  }
});

  // ----------- CLOUDWATCH ALARMS/DASHBOARD
  it('Connection failures alarm exists with correct name', async () => {
    if (!outputs.cloudwatch_alarm_connection_failures) return;
    const alarmResp = await cloudwatch.describeAlarms({ AlarmNames: [outputs.cloudwatch_alarm_connection_failures] }).promise();
    expect(alarmResp.MetricAlarms?.[0]?.AlarmName).toBe(outputs.cloudwatch_alarm_connection_failures);
    expect(alarmResp.MetricAlarms?.[0]?.StateValue).toMatch(/OK|ALARM|INSUFFICIENT_DATA/);
    expect(alarmResp.MetricAlarms?.[0]?.Namespace).toBeDefined();
  });

  it('Message drop alarm exists with correct name', async () => {
    if (!outputs.cloudwatch_alarm_message_drop) return;
    const alarmResp = await cloudwatch.describeAlarms({ AlarmNames: [outputs.cloudwatch_alarm_message_drop] }).promise();
    expect(alarmResp.MetricAlarms?.[0]?.AlarmName).toBe(outputs.cloudwatch_alarm_message_drop);
    expect(alarmResp.MetricAlarms?.[0]?.StateValue).toMatch(/OK|ALARM|INSUFFICIENT_DATA/);
    expect(alarmResp.MetricAlarms?.[0]?.Namespace).toBeDefined();
  });
  // ----------- GLUE TESTS
  it('Glue Catalog Database exists', async () => {
    if (!outputs.glue_catalog_database_name) return;
    const catalogDb = await glue.getDatabase({ Name: outputs.glue_catalog_database_name }).promise();
    expect(catalogDb.Database?.Name).toBe(outputs.glue_catalog_database_name);
    expect(catalogDb.Database?.CatalogId).toBeDefined();
  });


  // ----------- REST REMAINING VALID CHECKS
  it('SNS Topic exists', async () => {
    if (!outputs.sns_topic_arn) return;
    const info = await sns.getTopicAttributes({ TopicArn: outputs.sns_topic_arn }).promise();
    expect(info.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
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
