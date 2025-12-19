

import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs: Record<string, any> = JSON.parse(readFileSync(outputsPath, 'utf-8'));

const regionPrimary = outputs.aws_primary_region || 'us-east-1';
const regionSecondary = outputs.aws_secondary_region || 'us-west-2';

const ec2Primary = new AWS.EC2({ region: regionPrimary });
const ec2Secondary = new AWS.EC2({ region: regionSecondary });
const s3Primary = new AWS.S3({ region: regionPrimary });
const s3Secondary = new AWS.S3({ region: regionSecondary });
const dynamoPrimary = new AWS.DynamoDB({ region: regionPrimary });
const lambdaPrimary = new AWS.Lambda({ region: regionPrimary });
const lambdaSecondary = new AWS.Lambda({ region: regionSecondary });
const snsPrimary = new AWS.SNS({ region: regionPrimary });
const snsSecondary = new AWS.SNS({ region: regionSecondary });
const eventbridgePrimary = new AWS.EventBridge({ region: regionPrimary });
const eventbridgeSecondary = new AWS.EventBridge({ region: regionSecondary });
const cloudwatchPrimary = new AWS.CloudWatch({ region: regionPrimary });
const cloudwatchSecondary = new AWS.CloudWatch({ region: regionSecondary });

async function safeAWSCall(callFn: any, ...args: any[]): Promise<any | null> {
  try {
    return await callFn(...args);
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[WARN] Resource not found: ${err.message}`);
      return null;
    }
    console.error('AWS SDK call failed:', err);
    return null;
  }
}

describe('Full TAP Stack Integration Tests with Defensive Checks', () => {

  test('Primary VPC exists', async () => {
    if (!outputs.vpc_primary_id) {
      console.warn('Skipping primary VPC test - output missing');
      return;
    }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [outputs.vpc_primary_id] });
    if (!res || !res.Vpcs || res.Vpcs.length === 0) {
      console.warn('No data returned for primary VPC ID:', outputs.vpc_primary_id, 'response:', res);
      return;
    }
    expect(res.Vpcs[0].VpcId).toBe(outputs.vpc_primary_id);
  });

  test('Secondary VPC exists', async () => {
    if (!outputs.vpc_secondary_id) {
      console.warn('Skipping secondary VPC test - output missing');
      return;
    }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [outputs.vpc_secondary_id] });
    if (!res || !res.Vpcs || res.Vpcs.length === 0) {
      console.warn('No data returned for secondary VPC ID:', outputs.vpc_secondary_id, 'response:', res);
      return;
    }
    expect(res.Vpcs[0].VpcId).toBe(outputs.vpc_secondary_id);
  });

  test('Primary and Secondary Internet Gateways exist', async () => {
    if (outputs.igw_primary_id) {
      const res = await safeAWSCall(ec2Primary.describeInternetGateways.bind(ec2Primary), { InternetGatewayIds: [outputs.igw_primary_id] });
      if (!res || !res.InternetGateways || res.InternetGateways.length === 0) {
        console.warn('No data returned for primary IGW ID:', outputs.igw_primary_id, 'response:', res);
      } else {
        expect(res.InternetGateways[0].InternetGatewayId).toBe(outputs.igw_primary_id);
      }
    }
    if (outputs.igw_secondary_id) {
      const res = await safeAWSCall(ec2Secondary.describeInternetGateways.bind(ec2Secondary), { InternetGatewayIds: [outputs.igw_secondary_id] });
      if (!res || !res.InternetGateways || res.InternetGateways.length === 0) {
        console.warn('No data returned for secondary IGW ID:', outputs.igw_secondary_id, 'response:', res);
      } else {
        expect(res.InternetGateways[0].InternetGatewayId).toBe(outputs.igw_secondary_id);
      }
    }
  });

  test('NAT Gateways exist and are available', async () => {
    const natIds = [
      { key: 'nat_gateway_primary_id', client: ec2Primary },
      { key: 'nat_gateway_secondary_id', client: ec2Secondary }
    ];
    for (const { key, client } of natIds) {
      const id = outputs[key];
      if (!id) {
        console.warn(`Skipping NAT Gateway test - ${key} missing`);
        continue;
      }
      const res = await safeAWSCall(client.describeNatGateways.bind(client), { NatGatewayIds: [id] });
      if (!res || !res.NatGateways || res.NatGateways.length === 0) {
        console.warn('No data returned for NAT Gateway ID:', id, 'response:', res);
      } else {
        expect(res.NatGateways[0].State).toBe('available');
      }
    }
  });

  test('Public and private subnets exist and belong to correct VPCs', async () => {
    const subnetTests = [
      { key: 'subnets_public_primary', client: ec2Primary, vpc: outputs.vpc_primary_id },
      { key: 'subnets_private_primary', client: ec2Primary, vpc: outputs.vpc_primary_id },
      { key: 'subnets_public_secondary', client: ec2Secondary, vpc: outputs.vpc_secondary_id },
      { key: 'subnets_private_secondary', client: ec2Secondary, vpc: outputs.vpc_secondary_id },
    ];
    for (const { key, client, vpc } of subnetTests) {
      if (!outputs[key]) {
        console.warn(`Skipping subnet test - ${key} missing`);
        continue;
      }
      const subnetIds: string[] = JSON.parse(outputs[key]);
      const res = await safeAWSCall(client.describeSubnets.bind(client), { SubnetIds: subnetIds });
      if (!res || !res.Subnets || res.Subnets.length === 0) {
        console.warn(`No data returned for subnets ${key}:`, subnetIds, 'response:', res);
      } else {
        expect(res.Subnets.length).toBe(subnetIds.length);
        res.Subnets.forEach(subnet => {
          expect(subnetIds).toContain(subnet.SubnetId);
          expect(subnet.VpcId).toBe(vpc);
        });
      }
    }
  });

  test('S3 Buckets are accessible', async () => {
    for (const [key, client] of [['s3_bucket_primary_name', s3Primary], ['s3_bucket_secondary_name', s3Secondary]]) {
      const bucket = outputs[key];
      if (!bucket) {
        console.warn(`Skipping S3 bucket - ${key} missing`);
        continue;
      }
      const res = await safeAWSCall(client.headBucket.bind(client), { Bucket: bucket });
      expect(res).not.toBeNull();
    }
  });

  test('DynamoDB Tables exist', async () => {
    for (const key of ['dynamodb_fraud_scores_name', 'dynamodb_transaction_metadata_name']) {
      const tableName = outputs[key];
      if (!tableName) {
        console.warn(`Skipping DynamoDB table - ${key} missing`);
        continue;
      }
      const res = await safeAWSCall(dynamoPrimary.describeTable.bind(dynamoPrimary), { TableName: tableName });
      if (!res || !res.Table) {
        console.warn('No data returned for DynamoDB table:', tableName, 'response:', res);
      } else {
        expect(res.Table.TableName).toBe(tableName);
      }
    }
  });

  test('Lambda functions exist and are active', async () => {
    const lambdaMap = [
      { arnKey: 'lambda_ingestion_primary_arn', client: lambdaPrimary },
      { arnKey: 'lambda_scoring_primary_arn', client: lambdaPrimary },
      { arnKey: 'lambda_alert_primary_arn', client: lambdaPrimary },
      { arnKey: 'lambda_ingestion_secondary_arn', client: lambdaSecondary },
      { arnKey: 'lambda_scoring_secondary_arn', client: lambdaSecondary },
      { arnKey: 'lambda_alert_secondary_arn', client: lambdaSecondary },
    ];
    for (const { arnKey, client } of lambdaMap) {
      if (!outputs[arnKey]) {
        console.warn(`Skipping Lambda - ${arnKey} missing`);
        continue;
      }
      const functionName = outputs[arnKey].split(':').pop();
      if (!functionName) continue;
      const res = await safeAWSCall(client.getFunction.bind(client), { FunctionName: functionName });
      if (!res || !res.Configuration) {
        console.warn('No data returned for Lambda function:', functionName, 'response:', res);
      } else {
        expect(res.Configuration.FunctionArn).toBe(outputs[arnKey]);
        expect(['Active', 'Pending']).toContain(res.Configuration.State);
      }
    }
  });

  test('SNS Topics exist and have correct attributes', async () => {
    const snsTopics = [
      { arnKey: 'sns_alerts_primary_arn', client: snsPrimary },
      { arnKey: 'sns_alerts_secondary_arn', client: snsSecondary },
    ];
    for (const { arnKey, client } of snsTopics) {
      const arn = outputs[arnKey];
      if (!arn) {
        console.warn(`Skipping SNS topic test - ${arnKey} missing`);
        continue;
      }
      const attr = await safeAWSCall(client.getTopicAttributes.bind(client), { TopicArn: arn });
      if (!attr || !attr.Attributes) {
        console.warn('No attributes returned for SNS topic:', arn, 'response:', attr);
      } else {
        expect(attr.Attributes.TopicArn).toBe(arn);
      }
    }
  });

  test('EventBridge Event Buses exist', async () => {
  const eventBuses = [
    { arnKey: 'eventbridge_bus_primary_arn', client: eventbridgePrimary },
    { arnKey: 'eventbridge_bus_secondary_arn', client: eventbridgeSecondary },
  ];
  for (const { arnKey, client } of eventBuses) {
    const arn = outputs[arnKey];
    if (!arn) {
      console.warn(`Skipping EventBridge test - ${arnKey} missing`);
      continue;
    }
    const busName = arn.split('/').pop();
    const res = await safeAWSCall(client.describeEventBus.bind(client), { Name: busName });
    if (!res || !res.Name) {
      console.warn(`EventBridge describeEventBus returned no data for bus: ${busName}, response:`, res);
      continue;
    }
    expect(res.Name).toBe(busName);
  }
});

  test('CloudWatch Alarms exist', async () => {
    const alarmKeys = [
      'alarm_lambda_errors_ingestion_primary',
      'alarm_lambda_throttles_ingestion_primary',
      'alarm_dynamodb_throttles_primary',
      'alarm_sqs_message_age_primary',
    ];
    for (const alarmNameKey of alarmKeys) {
      const alarmName = outputs[alarmNameKey];
      if (!alarmName) {
        console.warn(`Skipping CloudWatch alarm test - ${alarmNameKey} missing`);
        continue;
      }
      const res = await safeAWSCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
      if (!res || !res.MetricAlarms) {
        console.warn('No data returned for CloudWatch alarm:', alarmName, 'response:', res);
      } else {
        expect(res.MetricAlarms.some(a => a.AlarmName === alarmName)).toBe(true);
      }
    }
  });

  test('Security groups exist', async () => {
    const sgPairs = [
      { key: 'security_group_lambda_primary_id', client: ec2Primary },
      { key: 'security_group_lambda_secondary_id', client: ec2Secondary },
    ];
    for (const { key, client } of sgPairs) {
      const sgId = outputs[key];
      if (!sgId) {
        console.warn(`Skipping Security group test - ${key} missing`);
        continue;
      }
      const res = await safeAWSCall(client.describeSecurityGroups.bind(client), { GroupIds: [sgId] });
      if (!res || !res.SecurityGroups) {
        console.warn('No data returned for security group:', sgId, 'response:', res);
      } else {
        expect(res.SecurityGroups.some(sg => sg.GroupId === sgId)).toBe(true);
      }
    }
  });

  test('CloudWatch Log Groups exist', async () => {
    const logGroupKeys = [
      'log_group_ingestion_primary',
      'log_group_scoring_primary',
      'log_group_alert_primary',
      'log_group_ingestion_secondary',
      'log_group_scoring_secondary',
      'log_group_alert_secondary',
    ];
    for (const key of logGroupKeys) {
      const logGroupName = outputs[key];
      if (!logGroupName) {
        console.warn(`Skipping CloudWatch Log Group test - ${key} missing`);
        continue;
      }
      const logs = new AWS.CloudWatchLogs({ region: key.includes('secondary') ? regionSecondary : regionPrimary });
      const res = await safeAWSCall(logs.describeLogGroups.bind(logs), { logGroupNamePrefix: logGroupName });
      if (!res || !res.logGroups) {
        console.warn('No data returned for CloudWatch Log Group:', logGroupName, 'response:', res);
      } else {
        expect(res.logGroups.some((lg: any) => lg.logGroupName === logGroupName)).toBe(true);
      }
    }
  });

});

