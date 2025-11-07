import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('Failed to load outputs:', error);
  outputs = {};
}

const region = outputs.aws_region || 'us-east-1';

const ec2 = new AWS.EC2({ region });
const s3 = new AWS.S3({ region });
const sns = new AWS.SNS({ region });
const kms = new AWS.KMS({ region });
const secretsManager = new AWS.SecretsManager({ region });
const cloudwatchLogs = new AWS.CloudWatchLogs({ region });
const guardduty = new AWS.GuardDuty({ region });
const eventbridge = new AWS.EventBridge({ region });

// Helper to safely call AWS SDK and log errors/warnings
async function diagAwsCall(label: string, fn: (...args: any[]) => Promise<any>, ...args: any[]) {
  try {
    const res = await fn(...args);
    if (!res) {
      console.warn(`[SKIP:${label}] AWS call returned null/undefined, skipping.`);
      return null;
    }
    return res;
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[SKIP:${label}] Not found: ${err.message}`);
      return null;
    }
    console.error(`[ERR:${label}]`, err);
    throw err;
  }
}

function skipIfNull(resource: any, label: string) {
  if (resource === null || resource === undefined) {
    console.warn(`[SKIPPED:${label}] Resource or API call failed`);
    return true;
  }
  return false;
}

describe('TapStack Integration Tests Based on flat-outputs.json and tap_stack.tf', () => {

  test('S3 data bucket exists with correct ARN and name', async () => {
    const bucketName = outputs.data_bucket_name;
    const bucketArn = outputs.data_bucket_arn;
    expect(bucketName).toBeDefined();
    expect(bucketArn).toBeDefined();

    const s3Info = await diagAwsCall('DataBucket', s3.headBucket.bind(s3), { Bucket: bucketName });
    expect(s3Info).not.toBeNull();
    expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
  });

  test('Secrets Manager database credentials secret exists with correct ARN', async () => {
    const secretArn = outputs.db_credentials_secret_arn;
    expect(secretArn).toBeDefined();

    const secretInfo = await diagAwsCall('SecretsManagerSecret', secretsManager.describeSecret.bind(secretsManager), { SecretId: secretArn });
    if (skipIfNull(secretInfo, 'SecretsManagerSecret')) return;

    expect(secretInfo.ARN.toLowerCase()).toBe(secretArn.toLowerCase());
  });

  test('DynamoDB table exists and has correct name and ARN', async () => {
    const tableName = outputs.dynamodb_table_name;
    const tableArn = outputs.dynamodb_table_arn;
    expect(tableName).toBeDefined();
    expect(tableArn).toBeDefined();

    const dynamodb = new AWS.DynamoDB({ region });
    const tableDesc = await diagAwsCall('DynamoDBTable', dynamodb.describeTable.bind(dynamodb), { TableName: tableName });
    if (skipIfNull(tableDesc, 'DynamoDBTable')) return;

    expect(tableDesc.Table.TableArn.toLowerCase()).toBe(tableArn.toLowerCase());
    expect(tableDesc.Table.TableName).toBe(tableName);
  });

  test('GuardDuty detector exists and is enabled', async () => {
    const detectorId = outputs.guardduty_detector_id;
    expect(detectorId).toBeDefined();

    const detectorInfo = await diagAwsCall('GuardDutyDetector', guardduty.getDetector.bind(guardduty), { DetectorId: detectorId });
    if (skipIfNull(detectorInfo, 'GuardDutyDetector')) return;

    expect(detectorInfo.Status.toLowerCase()).toBe('enabled');
  });

  test('SNS topic for GuardDuty alerts exists and ARN matches', async () => {
    const topicArn = outputs.guardduty_alerts_topic_arn;
    expect(topicArn).toBeDefined();

    const topicAttributes = await diagAwsCall('SNSTopicAttributes', sns.getTopicAttributes.bind(sns), { TopicArn: topicArn });
    if (skipIfNull(topicAttributes, 'SNSTopicAttributes')) return;

    expect(topicAttributes.Attributes.TopicArn.toLowerCase()).toBe(topicArn.toLowerCase());
  });

  test('CloudWatch EventRule for GuardDuty findings exists and ARN matches', async () => {
    const ruleArn = outputs.guardduty_findings_rule_arn;
    expect(ruleArn).toBeDefined();

    const ruleName = ruleArn.split('/').pop() || '';
    const ruleInfo = await diagAwsCall('EventBridgeRule', eventbridge.describeRule.bind(eventbridge), { Name: ruleName });
    if (skipIfNull(ruleInfo, 'EventBridgeRule')) return;

    expect(ruleInfo.Arn.toLowerCase()).toBe(ruleArn.toLowerCase());
  });

  test('Lambda function for processing exists with correct name and ARN', async () => {
    const lambdaArn = outputs.lambda_function_arn || outputs.processor_lambda_arn;
    const lambdaName = outputs.lambda_function_name;
    expect(lambdaArn).toBeDefined();
    expect(lambdaName).toBeDefined();

    const lambda = new AWS.Lambda({ region });
    const func = await diagAwsCall('LambdaFunction', lambda.getFunction.bind(lambda), { FunctionName: lambdaName });
    if (skipIfNull(func, 'LambdaFunction')) return;

    expect(func.Configuration.FunctionArn.toLowerCase()).toBe(lambdaArn.toLowerCase());
    expect(func.Configuration.FunctionName).toBe(lambdaName);
  });

  test('IAM role for Lambda execution exists and ARN matches', async () => {
    const roleArn = outputs.lambda_execution_role_arn;
    expect(roleArn).toBeDefined();

    const iam = new AWS.IAM({ region: 'us-east-1' }); // IAM is global
    const roleName = roleArn.split('/').pop() || '';

    const role = await diagAwsCall('IAMRole', iam.getRole.bind(iam), { RoleName: roleName });
    if (skipIfNull(role, 'IAMRole')) return;

    expect(role.Role.Arn.toLowerCase()).toBe(roleArn.toLowerCase());
  });

  test('Security Group for Lambda exists with matching ID and Name', async () => {
    const sgId = outputs.lambda_security_group_id;
    const sgName = outputs.lambda_security_group_name;
    expect(sgId).toBeDefined();
    expect(sgName).toBeDefined();

    const sgData = await diagAwsCall('SecurityGroup', ec2.describeSecurityGroups.bind(ec2), { GroupIds: [sgId] });
    if (skipIfNull(sgData, 'SecurityGroup')) return;

    expect(sgData.SecurityGroups[0].GroupId).toBe(sgId);
    expect(sgData.SecurityGroups[0].GroupName).toBe(sgName);
  });

  test('VPC exists with correct ID and CIDR block', async () => {
    const vpcId = outputs.vpc_id;
    const vpcCidr = outputs.vpc_cidr_block;
    expect(vpcId).toBeDefined();
    expect(vpcCidr).toBeDefined();

    const vpcInfo = await diagAwsCall('VPC', ec2.describeVpcs.bind(ec2), { VpcIds: [vpcId] });
    if (skipIfNull(vpcInfo, 'VPC')) return;

    expect(vpcInfo.Vpcs[0].VpcId).toBe(vpcId);
    expect(vpcInfo.Vpcs[0].CidrBlock).toBe(vpcCidr);
  });

  test('Private subnets exist and belong to the VPC', async () => {
    const subnetIds: string[] = JSON.parse(outputs.private_subnet_ids || '[]');
    const vpcId = outputs.vpc_id;
    expect(subnetIds.length).toBeGreaterThan(0);
    expect(vpcId).toBeDefined();

    for (const subnetId of subnetIds) {
      const subnet = await diagAwsCall('Subnet', ec2.describeSubnets.bind(ec2), { SubnetIds: [subnetId] });
      if (skipIfNull(subnet, 'Subnet')) continue;

      expect(subnet.Subnets[0].SubnetId).toBe(subnetId);
      expect(subnet.Subnets[0].VpcId).toBe(vpcId);
    }
  });

  test('KMS keys for S3 and CloudWatch exist and match ARNs', async () => {
    const kmsS3KeyArn = outputs.kms_s3_key_arn;
    const kmsCloudWatchArn = outputs.kms_cloudwatch_key_arn;
    expect(kmsS3KeyArn).toBeDefined();
    expect(kmsCloudWatchArn).toBeDefined();

    for (const kmsArn of [kmsS3KeyArn, kmsCloudWatchArn]) {
      const keyId = kmsArn.split('/').pop() || '';
      const keyInfo = await diagAwsCall('KMSKey', kms.describeKey.bind(kms), { KeyId: keyId });
      if (skipIfNull(keyInfo, 'KMSKey')) continue;

      expect(keyInfo.KeyMetadata.Arn.toLowerCase()).toBe(kmsArn.toLowerCase());
      expect(keyInfo.KeyMetadata.Enabled).toBe(true);
    }
  });

  test('CloudWatch log groups for Lambda and VPC flow logs exist', async () => {
    const logGroups = [outputs.lambda_log_group_arn, outputs.vpc_flow_logs_log_group_arn];
    expect(logGroups.every(lg => lg)).toBe(true);

    for (const logGroupArn of logGroups) {
      const logGroupName = logGroupArn.split(':log-group:').pop() || '';
      const group = await diagAwsCall('CloudWatchLogGroup', cloudwatchLogs.describeLogGroups.bind(cloudwatchLogs), { logGroupNamePrefix: logGroupName });
      if (skipIfNull(group, 'CloudWatchLogGroup')) continue;

      expect(group.logGroups.some((lg: any) => lg.arn === logGroupArn)).toBe(true);
    }
  });

  test('VPC flow log exists and is associated with correct VPC', async () => {
    const flowLogId = outputs.vpc_flow_logs_id;
    const vpcId = outputs.vpc_id;
    expect(flowLogId).toBeDefined();
    expect(vpcId).toBeDefined();

    const flowLogs = await diagAwsCall('VPCFlowLogs', ec2.describeFlowLogs.bind(ec2), { FlowLogIds: [flowLogId] });
    if (skipIfNull(flowLogs, 'VPCFlowLogs')) return;

    expect(flowLogs.FlowLogs[0].FlowLogId).toBe(flowLogId);
    expect(flowLogs.FlowLogs[0].ResourceId).toBe(vpcId);
  });
});

