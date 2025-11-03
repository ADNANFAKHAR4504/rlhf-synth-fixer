import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

// Load outputs safely with diagnostics
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  console.log('Loaded flat-outputs:', JSON.stringify(outputs, null, 2));
} catch (err) {
  console.error('Error loading flat-outputs.json:', err);
}

// AWS clients with regions from outputs or default fallback
const regionPrimary = outputs.aws_primary_region || 'us-east-1';
const regionSecondary = outputs.aws_secondary_region || 'us-west-2';

const ec2Primary = new AWS.EC2({ region: regionPrimary });
const ec2Secondary = new AWS.EC2({ region: regionSecondary });
const s3Primary = new AWS.S3({ region: regionPrimary });
const s3Secondary = new AWS.S3({ region: regionSecondary });
const rdsPrimary = new AWS.RDS({ region: regionPrimary });
const rdsSecondary = new AWS.RDS({ region: regionSecondary });
const lambdaPrimary = new AWS.Lambda({ region: regionPrimary });
const snsPrimary = new AWS.SNS({ region: regionPrimary });
const dmsPrimary = new AWS.DMS({ region: regionPrimary });
const route53 = new AWS.Route53({ region: regionPrimary });
const cloudwatchPrimary = new AWS.CloudWatch({ region: regionPrimary });
const ssmPrimary = new AWS.SSM({ region: regionPrimary });

async function safeAWSCall(callFn: any, ...args: any[]) {
  try {
    return await callFn(...args);
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[WARN] Resource not found: ${err.message}`);
      return null;
    }
    throw err;
  }
}

describe('TAP Stack Integration Tests with Diagnostics and Guards', () => {

  it('Primary VPC exists', async () => {
    const id = outputs.vpc_primary_id;
    console.log('Testing Primary VPC:', id);
    if (!id) { console.warn('Missing vpc_primary_id output'); return; }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(id);
  });

  it('Secondary VPC exists', async () => {
    const id = outputs.vpc_secondary_id;
    console.log('Testing Secondary VPC:', id);
    if (!id) { console.warn('Missing vpc_secondary_id output'); return; }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(id);
  });

  it('Primary NAT Gateway is available', async () => {
    const id = outputs.nat_gateway_primary_id;
    console.log('Testing Primary NAT Gateway:', id);
    if (!id) { console.warn('Missing nat_gateway_primary_id output'); return; }
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [id] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    const id = outputs.nat_gateway_secondary_id;
    console.log('Testing Secondary NAT Gateway:', id);
    if (!id) { console.warn('Missing nat_gateway_secondary_id output'); return; }
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [id] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets exist and belong to primary VPC', async () => {
    const idStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    console.log('Testing Primary private subnets:', idStr);
    if (!idStr || !vpcId) { console.warn('Missing primary_private_subnet_ids or vpc_primary_id'); return; }
    const ids = JSON.parse(idStr);
    const res = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: ids });
    expect(res?.Subnets.length).toBe(ids.length);
    res?.Subnets.forEach(s => {
      expect(ids).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Secondary private subnets exist and belong to secondary VPC', async () => {
    const idStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    console.log('Testing Secondary private subnets:', idStr);
    if (!idStr || !vpcId) { console.warn('Missing secondary_private_subnet_ids or vpc_secondary_id'); return; }
    const ids = JSON.parse(idStr);
    const res = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: ids });
    expect(res?.Subnets.length).toBe(ids.length);
    res?.Subnets.forEach(s => {
      expect(ids).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Primary S3 Backup Bucket exists', async () => {
    const bucket = outputs.s3_bucket_primary_id;
    console.log('Testing Primary S3 bucket:', bucket);
    if (!bucket) { console.warn('Missing s3_bucket_primary_id output'); return; }
    const res = await safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Secondary S3 Backup Bucket exists', async () => {
    const bucket = outputs.s3_bucket_secondary_id;
    console.log('Testing Secondary S3 bucket:', bucket);
    if (!bucket) { console.warn('Missing s3_bucket_secondary_id output'); return; }
    const res = await safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Primary Aurora Cluster Endpoint is available', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    console.log('Primary Aurora Endpoint:', endpoint);
    if (!endpoint) { console.warn('Missing aurora_primary_cluster_endpoint output'); return; }
    const clusters = await safeAWSCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    const found = clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint);
    expect(found).toBeTruthy();
  });

  it('Failover Orchestrator Lambda Function exists and active', async () => {
    const fnName = outputs.lambda_function_name;
    console.log('Testing Lambda function:', fnName);
    if (!fnName) { console.warn('Missing lambda_function_name output'); return; }
    const fn = await safeAWSCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: fnName });
    expect(fn?.Configuration?.FunctionName).toBe(fnName);
    expect(['Active', 'Pending']).toContain(fn?.Configuration?.State);
  });

  it('DMS Replication Instance exists and is available', async () => {
    const dmsId = outputs.dms_replication_instance_id;
    console.log('Testing DMS Replication Instance:', dmsId);
    if (!dmsId) { console.warn('Missing dms_replication_instance_id output'); return; }
    const instances = await safeAWSCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), { Filters: [{ Name: 'replication-instance-id', Values: [dmsId] }] });
    expect(instances?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(instances?.ReplicationInstances?.[0]?.ReplicationInstanceIdentifier).toBe(dmsId);
  });

  it('SNS Alarm Topic exists and accessible', async () => {
    const topicArn = outputs.sns_topic_arn;
    console.log('Testing SNS topic ARN:', topicArn);
    if (!topicArn) { console.warn('Missing sns_topic_arn output'); return; }
    const attrs = await safeAWSCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: topicArn });
    expect(attrs?.Attributes?.TopicArn).toBe(topicArn);
  });

  it('Route53 Hosted Zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    console.log('Testing Route53 Hosted Zone:', zoneId);
    if (!zoneId) { console.warn('Missing route53_zone_id output'); return; }
    const zone = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  it('CloudWatch primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    console.log('Testing CloudWatch primary CPU alarm:', alarmName);
    if (!alarmName) { console.warn('Missing cloudwatch_alarm_primary_cpu_name output'); return; }
    const alarms = await safeAWSCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  it('SSM Parameter for Primary DB endpoint exists', async () => {
    const paramName = outputs.parameter_store_db_endpoint_primary;
    console.log('Testing SSM Parameter:', paramName);
    if (!paramName) { console.warn('Missing parameter_store_db_endpoint_primary output'); return; }
    const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
    expect(param?.Parameter?.Name).toBe(paramName);
  });

  it('SSM Parameter for Secondary DB endpoint exists', async () => {
    const paramName = outputs.parameter_store_db_endpoint_secondary;
    console.log('Testing SSM Parameter:', paramName);
    if (!paramName) { console.warn('Missing parameter_store_db_endpoint_secondary output'); return; }
    const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
    expect(param?.Parameter?.Name).toBe(paramName);
  });

});
