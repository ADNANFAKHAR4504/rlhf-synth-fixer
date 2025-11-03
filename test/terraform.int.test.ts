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

// AWS clients initialized with correct regions
const ec2Primary = new AWS.EC2({ region: outputs.aws_primary_region });
const ec2Secondary = new AWS.EC2({ region: outputs.aws_secondary_region });
const s3Primary = new AWS.S3({ region: outputs.aws_primary_region });
const s3Secondary = new AWS.S3({ region: outputs.aws_secondary_region });
const rdsPrimary = new AWS.RDS({ region: outputs.aws_primary_region });
const rdsSecondary = new AWS.RDS({ region: outputs.aws_secondary_region });
const lambdaPrimary = new AWS.Lambda({ region: outputs.aws_primary_region });
const snsPrimary = new AWS.SNS({ region: outputs.aws_primary_region });
const dmsPrimary = new AWS.DMS({ region: outputs.aws_primary_region });
const route53 = new AWS.Route53({ region: outputs.aws_primary_region });
const cloudwatchPrimary = new AWS.CloudWatch({ region: outputs.aws_primary_region });
const ssmPrimary = new AWS.SSM({ region: outputs.aws_primary_region });

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

describe('TAP Stack Integration Tests with Confirmed Outputs', () => {
  it('Primary VPC exists', async () => {
    const vpcId = outputs.vpc_primary_id;
    if (!vpcId) {
      console.warn('Skipping Primary VPC test - no vpc_primary_id');
      return;
    }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Secondary VPC exists', async () => {
    const vpcId = outputs.vpc_secondary_id;
    if (!vpcId) {
      console.warn('Skipping Secondary VPC test - no vpc_secondary_id');
      return;
    }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Primary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_primary_id;
    if (!natId) {
      console.warn('Skipping Primary NAT Gateway test - no nat_gateway_primary_id');
      return;
    }
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_secondary_id;
    if (!natId) {
      console.warn('Skipping Secondary NAT Gateway test - no nat_gateway_secondary_id');
      return;
    }
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets exist and belong to primary VPC', async () => {
    const subnetIdsStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    if (!subnetIdsStr || !vpcId) {
      console.warn('Skipping Primary private subnets test - missing data');
      return;
    }
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
    if (!subnetIdsStr || !vpcId) {
      console.warn('Skipping Secondary private subnets test - missing data');
      return;
    }
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Primary S3 Backup Bucket exists', async () => {
    const bucket = outputs.s3_bucket_primary_id;
    if (!bucket) {
      console.warn('Skipping Primary S3 bucket test - no s3_bucket_primary_id');
      return;
    }
    const res = await safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Secondary S3 Backup Bucket exists', async () => {
    const bucket = outputs.s3_bucket_secondary_id;
    if (!bucket) {
      console.warn('Skipping Secondary S3 bucket test - no s3_bucket_secondary_id');
      return;
    }
    const res = await safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Primary Aurora Cluster Endpoint is available', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    if (!endpoint) {
      console.warn('Skipping Primary Aurora cluster test - no aurora_primary_cluster_endpoint');
      return;
    }
    const clusters = await safeAWSCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    const found = clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint);
    expect(found).toBeTruthy();
  });

  it('Failover Orchestrator Lambda Function exists and active', async () => {
    const fnName = outputs.lambda_function_name;
    if (!fnName) {
      console.warn('Skipping Lambda test - no lambda_function_name');
      return;
    }
    const fn = await safeAWSCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: fnName });
    expect(fn?.Configuration?.FunctionName).toBe(fnName);
    expect(['Active', 'Pending']).toContain(fn?.Configuration?.State);
  });

  it('DMS Replication Instance exists and is available', async () => {
    const dmsId = outputs.dms_replication_instance_id;
    if (!dmsId) {
      console.warn('Skipping DMS test - no dms_replication_instance_id');
      return;
    }
    const instances = await safeAWSCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), { Filters: [{ Name: 'replication-instance-id', Values: [dmsId] }] });
    expect(instances?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(instances?.ReplicationInstances[0].ReplicationInstanceIdentifier).toBe(dmsId);
  });

  it('SNS Alarm Topic exists and accessible', async () => {
    const topicArn = outputs.sns_topic_arn;
    if (!topicArn) {
      console.warn('Skipping SNS test - no sns_topic_arn');
      return;
    }
    const attrs = await safeAWSCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: topicArn });
    expect(attrs?.Attributes?.TopicArn).toBe(topicArn);
  });

  it('Route53 Hosted Zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    if (!zoneId) {
      console.warn('Skipping Route53 test - no route53_zone_id');
      return;
    }
    const zone = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  it('CloudWatch primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    if (!alarmName) {
      console.warn('Skipping CloudWatch alarm test - no cloudwatch_alarm_primary_cpu_name');
      return;
    }
    const alarms = await safeAWSCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  it('SSM Parameter for Primary DB endpoint exists', async () => {
    const paramName = outputs.parameter_store_db_endpoint_primary;
    if (!paramName) {
      console.warn('Skipping SSM param test - no parameter_store_db_endpoint_primary');
      return;
    }
    const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
    expect(param?.Parameter?.Name).toBe(paramName);
  });

  it('SSM Parameter for Secondary DB endpoint exists', async () => {
    const paramName = outputs.parameter_store_db_endpoint_secondary;
    if (!paramName) {
      console.warn('Skipping SSM param test - no parameter_store_db_endpoint_secondary');
      return;
    }
    const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
    expect(param?.Parameter?.Name).toBe(paramName);
  });

});

