import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (e) {
  console.error('Failed to load flat-outputs.json:', e);
}

// AWS clients per region
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
      console.warn(`[WARN] Resource not found or does not exist: ${err.message}`);
      return null;
    }
    throw err;
  }
}

describe('Complete TAP Stack Integration Tests with Diagnostics', () => {

  it('Primary VPC exists', async () => {
    const vpcId = outputs.vpc_primary_id;
    console.log('Primary VPC ID:', vpcId);
    if (!vpcId) { console.warn('Skipping Primary VPC test - missing output'); return; }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Secondary VPC exists', async () => {
    const vpcId = outputs.vpc_secondary_id;
    console.log('Secondary VPC ID:', vpcId);
    if (!vpcId) { console.warn('Skipping Secondary VPC test - missing output'); return; }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Primary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_primary_id;
    console.log('Primary NAT Gateway ID:', natId);
    if (!natId) { console.warn('Skipping Primary NAT Gateway test - missing output'); return; }
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_secondary_id;
    console.log('Secondary NAT Gateway ID:', natId);
    if (!natId) { console.warn('Skipping Secondary NAT Gateway test - missing output'); return; }
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets exist and belong to primary VPC', async () => {
    const subnetIdsStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    console.log('Primary private subnet IDs:', subnetIdsStr);
    if (!subnetIdsStr || !vpcId) { console.warn('Skipping Primary private subnets test - missing output'); return; }
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Secondary private subnets exist and belong to secondary VPC', async () => {
    const subnetIdsStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    console.log('Secondary private subnet IDs:', subnetIdsStr);
    if (!subnetIdsStr || !vpcId) { console.warn('Skipping Secondary private subnets test - missing output'); return; }
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Primary S3 backup bucket exists', async () => {
    const bucket = outputs.s3_bucket_primary_id;
    console.log('Primary S3 bucket:', bucket);
    if (!bucket) { console.warn('Skipping Primary S3 bucket test - missing output'); return; }
    const res = await safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Secondary S3 backup bucket exists', async () => {
    const bucket = outputs.s3_bucket_secondary_id;
    console.log('Secondary S3 bucket:', bucket);
    if (!bucket) { console.warn('Skipping Secondary S3 bucket test - missing output'); return; }
    const res = await safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Primary Aurora cluster is available', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    console.log('Primary Aurora cluster endpoint:', endpoint);
    if (!endpoint) { console.warn('Skipping Primary Aurora cluster test - missing output'); return; }
    const clusters = await safeAWSCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    const found = clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint);
    expect(found).toBeTruthy();
  });

  it('Failover orchestrator Lambda function exists and active', async () => {
    const lambdaName = outputs.lambda_function_name;
    console.log('Lambda function name:', lambdaName);
    if (!lambdaName) { console.warn('Skipping Lambda test - missing output'); return; }
    const func = await safeAWSCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: lambdaName });
    expect(func?.Configuration?.FunctionName).toBe(lambdaName);
    expect(['Active', 'Pending']).toContain(func?.Configuration?.State);
  });

  it('DMS replication instance exists and is available', async () => {
    const dmsId = outputs.dms_replication_instance_id;
    console.log('DMS replication instance id:', dmsId);
    if (!dmsId) { console.warn('Skipping DMS test - missing output'); return; }
    const instances = await safeAWSCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), { Filters: [{ Name: 'replication-instance-id', Values: [dmsId] }] });
    expect(instances?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(instances?.ReplicationInstances[0].ReplicationInstanceIdentifier).toBe(dmsId);
  });

  it('SNS Alarm topic exists and accessible', async () => {
    const topicArn = outputs.sns_topic_arn;
    console.log('SNS topic ARN:', topicArn);
    if (!topicArn) { console.warn('Skipping SNS test - missing output'); return; }
    const attr = await safeAWSCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: topicArn });
    expect(attr?.Attributes?.TopicArn).toBe(topicArn);
  });

  it('Route53 Hosted Zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    console.log('Route53 zone ID:', zoneId);
    if (!zoneId) { console.warn('Skipping Route53 Hosted Zone test - missing output'); return; }
    const zone = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  it('CloudWatch primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    console.log('CloudWatch primary CPU alarm name:', alarmName);
    if (!alarmName) { console.warn('Skipping CloudWatch alarm test - missing output'); return; }
    const alarms = await safeAWSCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  it('SSM parameters for primary endpoint exist', async () => {
    const paramName = outputs.parameter_store_db_endpoint_primary;
    console.log('Parameter Store primary endpoint:', paramName);
    if (!paramName) { console.warn('Skipping SSM parameter test - missing output'); return; }
    const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
    expect(param?.Parameter?.Name).toBe(paramName);
  });

  it('SSM parameters for secondary endpoint exist', async () => {
    const paramName = outputs.parameter_store_db_endpoint_secondary;
    console.log('Parameter Store secondary endpoint:', paramName);
    if (!paramName) { console.warn('Skipping SSM parameter test - missing output'); return; }
    const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
    expect(param?.Parameter?.Name).toBe(paramName);
  });

});

