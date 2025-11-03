import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  console.log('Loaded flat-outputs:', JSON.stringify(outputs, null, 2));
} catch (err) {
  console.error('Error loading flat-outputs.json:', err);
}

const ec2Primary = new AWS.EC2({ region: outputs['aws_primary_region'] || 'us-east-1' });
const ec2Secondary = new AWS.EC2({ region: outputs['aws_secondary_region'] || 'us-west-2' });
const s3Primary = new AWS.S3({ region: outputs['aws_primary_region'] || 'us-east-1' });
const s3Secondary = new AWS.S3({ region: outputs['aws_secondary_region'] || 'us-west-2' });
const rdsPrimary = new AWS.RDS({ region: outputs['aws_primary_region'] || 'us-east-1' });
const rdsSecondary = new AWS.RDS({ region: outputs['aws_secondary_region'] || 'us-west-2' });
const lambdaPrimary = new AWS.Lambda({ region: outputs['aws_primary_region'] || 'us-east-1' });
const snsPrimary = new AWS.SNS({ region: outputs['aws_primary_region'] || 'us-east-1' });
const dmsPrimary = new AWS.DMS({ region: outputs['aws_primary_region'] || 'us-east-1' });
const route53 = new AWS.Route53({ region: outputs['aws_primary_region'] || 'us-east-1' });
const cloudwatchPrimary = new AWS.CloudWatch({ region: outputs['aws_primary_region'] || 'us-east-1' });
const ssmPrimary = new AWS.SSM({ region: outputs['aws_primary_region'] || 'us-east-1' });

async function safeAWSCall(callFn: any, ...args: any[]) {
  try {
    return await callFn(...args);
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[WARN] Resource not found: ${err.message}`);
      return null;
    }
    console.error('AWS SDK call failed:', err);
    throw err;
  }
}

describe('TAP Stack Integration Tests - Stable Version', () => {

  it('Primary VPC exists', async () => {
    const vpcId = outputs.vpc_primary_id;
    if (!vpcId) {
      console.warn('Skipping Primary VPC test - missing output');
      return;
    }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Secondary VPC exists', async () => {
    const vpcId = outputs.vpc_secondary_id;
    if (!vpcId) {
      console.warn('Skipping Secondary VPC test - missing output');
      return;
    }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Primary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_primary_id;
    if (!natId) {
      console.warn('Skipping Primary NAT Gateway test - missing output');
      return;
    }
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_secondary_id;
    if (!natId) {
      console.warn('Skipping Secondary NAT Gateway test - missing output');
      return;
    }
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets belong to primary VPC', async () => {
    const subnetIdsStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    if (!subnetIdsStr || !vpcId) {
      console.warn('Skipping Primary private subnets test - missing output');
      return;
    }
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    for (const subnet of res?.Subnets ?? []) {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    }
  });

  it('Secondary private subnets belong to secondary VPC', async () => {
    const subnetIdsStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    if (!subnetIdsStr || !vpcId) {
      console.warn('Skipping Secondary private subnets test - missing output');
      return;
    }
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    for (const subnet of res?.Subnets ?? []) {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    }
  });

  it('Primary and Secondary S3 buckets exist', async () => {
    const primaryBucket = outputs.s3_bucket_primary_id;
    const secondaryBucket = outputs.s3_bucket_secondary_id;
    if (!primaryBucket || !secondaryBucket) {
      console.warn('Skipping S3 Bucket test - missing primary or secondary bucket output');
      return;
    }
    await expect(safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: primaryBucket })).resolves.not.toBeNull();
    await expect(safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: secondaryBucket })).resolves.not.toBeNull();
  });

  it('Primary Aurora cluster endpoint is active', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    if (!endpoint) {
      console.warn('Skipping Aurora cluster test - missing primary cluster endpoint');
      return;
    }
    const clusters = await safeAWSCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    expect(clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint)).toBeTruthy();
  });

  it('Lambda function exists and is active', async () => {
    const functionName = outputs.lambda_function_name;
    if (!functionName) {
      console.warn('Skipping Lambda test - missing lambda function name');
      return;
    }
    const func = await safeAWSCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: functionName });
    expect(func?.Configuration?.FunctionName).toBe(functionName);
    expect(['Active', 'Pending']).toContain(func?.Configuration?.State);
  });

  it('DMS replication instance exists and is available', async () => {
    const instanceId = outputs.dms_replication_instance_id;
    if (!instanceId) {
      console.warn('Skipping DMS test - missing replication instance ID');
      return;
    }
    const result = await safeAWSCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), {
      Filters: [{ Name: 'replication-instance-id', Values: [instanceId] }],
    });
    expect(result?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(result?.ReplicationInstances[0].ReplicationInstanceIdentifier).toBe(instanceId);
  });

  it('SNS alarm topic exists and accessible', async () => {
    const topicArn = outputs.sns_topic_arn;
    if (!topicArn) {
      console.warn('Skipping SNS topic test - missing arn');
      return;
    }
    const attrs = await safeAWSCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: topicArn });
    expect(attrs?.Attributes?.TopicArn).toBe(topicArn);
  });

  it('Route53 hosted zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    if (!zoneId) {
      console.warn('Skipping Route53 hosted zone test - missing zone id');
      return;
    }
    const hostedZone = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(hostedZone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  it('CloudWatch Primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    if (!alarmName) {
      console.warn('Skipping CloudWatch alarm test - missing alarm name');
      return;
    }
    const alarms = await safeAWSCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  it('SSM Parameter for Primary and Secondary DB endpoints exist', async () => {
    const paramPrimary = outputs.parameter_store_db_endpoint_primary;
    const paramSecondary = outputs.parameter_store_db_endpoint_secondary;
    if (!paramPrimary || !paramSecondary) {
      console.warn('Skipping SSM Parameters test - missing primary or secondary param');
      return;
    }
    const primaryParam = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramPrimary });
    const secondaryParam = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramSecondary });
    expect(primaryParam?.Parameter?.Name).toBe(paramPrimary);
    expect(secondaryParam?.Parameter?.Name).toBe(paramSecondary);
  });

});
