import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  const raw = readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(raw);
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (err) {
  console.error('Failed to load flat-outputs.json:', err);
  throw new Error('Failed to load outputs JSON');
}

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

async function safeAwsCall(fn: any, ...args: any[]) {
  try {
    return await fn(...args);
  } catch (e: any) {
    if (e.code === 'ResourceNotFoundException' || (e.message && e.message.includes('not found'))) {
      console.warn(`WARN: Resource not found - ${e.message}`);
      return null;
    }
    throw e;
  }
}

describe('TAP Stack Integration Tests with Outputs Guard and Diagnostics', () => {

  it('should load critical outputs', () => {
    const keys = [
      'vpc_primary_id', 'vpc_secondary_id', 'nat_gateway_primary_id',
      'nat_gateway_secondary_id', 'primary_private_subnet_ids', 'secondary_private_subnet_ids',
      'aurora_primary_cluster_endpoint', 'lambda_function_name', 'dms_replication_instance_id',
      'sns_topic_arn', 'route53_zone_id', 'cloudwatch_alarm_primary_cpu_name',
      'parameter_store_db_endpoint_primary', 'parameter_store_db_endpoint_secondary'
    ];
    keys.forEach(k => {
      expect(outputs[k]).toBeDefined();
    });
  });

  it('Primary VPC exists', async () => {
    const vpcId = outputs.vpc_primary_id;
    if (!vpcId) return console.warn('Skipping test: vpc_primary_id missing');
    const res = await safeAwsCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Secondary VPC exists', async () => {
    const vpcId = outputs.vpc_secondary_id;
    if (!vpcId) return console.warn('Skipping test: vpc_secondary_id missing');
    const res = await safeAwsCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  it('Primary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_primary_id;
    if (!natId) return console.warn('Skipping test: nat_gateway_primary_id missing');
    const res = await safeAwsCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_secondary_id;
    if (!natId) return console.warn('Skipping test: nat_gateway_secondary_id missing');
    const res = await safeAwsCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets belong to primary VPC', async () => {
    const subnetIdsStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    if (!subnetIdsStr || !vpcId) return console.warn('Skipping private subnet test - missing');
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAwsCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(res?.Subnets?.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Secondary private subnets belong to secondary VPC', async () => {
    const subnetIdsStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    if (!subnetIdsStr || !vpcId) return console.warn('Skipping private subnet test - missing');
    const subnetIds = JSON.parse(subnetIdsStr);
    const res = await safeAwsCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets?.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('S3 buckets are accessible', async () => {
    const primaryBucket = outputs.s3_bucket_primary_id;
    const secondaryBucket = outputs.s3_bucket_secondary_id;
    if (!primaryBucket || !secondaryBucket) {
      console.warn('Skipping S3 bucket test - missing IDs');
      return;
    }
    await expect(safeAwsCall(s3Primary.headBucket.bind(s3Primary), { Bucket: primaryBucket })).resolves.not.toBeNull();
    await expect(safeAwsCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: secondaryBucket })).resolves.not.toBeNull();
  });

  it('Aurora cluster primary endpoint exists', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    if (!endpoint) return console.warn('Skipping Aurora cluster test - missing');
    const clusters = await safeAwsCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    expect(clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint)).toBe(true);
  });

  it('Lambda failover function exists and is active', async () => {
    const fnName = outputs.lambda_function_name;
    if (!fnName) return console.warn('Skipping Lambda test - missing');
    const fn = await safeAwsCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: fnName });
    expect(fn?.Configuration?.FunctionName).toBe(fnName);
    expect(['Active', 'Pending']).toContain(fn?.Configuration?.State);
  });

  it('DMS replication instance exists', async () => {
    const instanceId = outputs.dms_replication_instance_id;
    if (!instanceId) return console.warn('Skipping DMS test - missing');
    const instances = await safeAwsCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), { Filters: [{ Name: 'replication-instance-id', Values: [instanceId] }] });
    expect(instances?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(instances?.ReplicationInstances?.[0]?.ReplicationInstanceIdentifier).toBe(instanceId);
  });

  it('SNS alarm topic exists', async () => {
    const arn = outputs.sns_topic_arn;
    if (!arn) return console.warn('Skipping SNS topic test - missing');
    const attr = await safeAwsCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: arn });
    expect(attr?.Attributes?.TopicArn).toBe(arn);
  });

  it('Route53 hosted zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    if (!zoneId) return console.warn('Skipping Route53 test - missing');
    const zone = await safeAwsCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  it('CloudWatch primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    if (!alarmName) return console.warn('Skipping CloudWatch alarm test - missing');
    const alarms = await safeAwsCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  it('SSM parameters for Primary and Secondary DB endpoints exist', async () => {
    const primaryParam = outputs.parameter_store_db_endpoint_primary;
    const secondaryParam = outputs.parameter_store_db_endpoint_secondary;
    if (!primaryParam || !secondaryParam) return console.warn('Skipping SSM parameter test - missing');
    const pRes = await safeAwsCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: primaryParam });
    const sRes = await safeAwsCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: secondaryParam });
    expect(pRes?.Parameter?.Name).toBe(primaryParam);
    expect(sRes?.Parameter?.Name).toBe(secondaryParam);
  });

});

