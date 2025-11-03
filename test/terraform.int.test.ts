import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  console.log('Loaded terraform outputs:', JSON.stringify(outputs, null, 2));
} catch (err) {
  console.error('Error loading outputs JSON:', err);
  throw err;
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
      console.warn(`Resource not found: ${e.message}`);
      return null;
    }
    throw e;
  }
}

describe('TAP Stack Integration Tests Full Suite', () => {
  test('Flat outputs file loaded with correct keys', () => {
    const requiredKeys = [
      'vpc_primary_id', 'vpc_secondary_id',
      'nat_gateway_primary_id', 'nat_gateway_secondary_id',
      'primary_private_subnet_ids', 'secondary_private_subnet_ids',
      'aurora_primary_cluster_endpoint', 'lambda_function_name',
      'dms_replication_instance_id', 'sns_topic_arn',
      'route53_zone_id', 'cloudwatch_alarm_primary_cpu_name',
      'parameter_store_db_endpoint_primary', 'parameter_store_db_endpoint_secondary'
    ];
    requiredKeys.forEach(key => expect(outputs[key]).toBeDefined());
  });

  test('Primary VPC exists', async () => {
    const vpcId = outputs.vpc_primary_id;
    if (!vpcId) return console.warn('Skip Primary VPC test, output missing');
    const res = await safeAwsCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toEqual(vpcId);
  });

  test('Secondary VPC exists', async () => {
    const vpcId = outputs.vpc_secondary_id;
    if (!vpcId) return console.warn('Skip Secondary VPC test, output missing');
    const res = await safeAwsCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    expect(res?.Vpcs?.[0]?.VpcId).toEqual(vpcId);
  });

  test('Primary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_primary_id;
    if (!natId) return console.warn('Skip Primary NAT Gateway test, output missing');
    const res = await safeAwsCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toEqual('available');
  });

  test('Secondary NAT Gateway is available', async () => {
    const natId = outputs.nat_gateway_secondary_id;
    if (!natId) return console.warn('Skip Secondary NAT Gateway test, output missing');
    const res = await safeAwsCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    expect(res?.NatGateways?.[0]?.State).toEqual('available');
  });

  test('Primary private subnets exist and belong to primary VPC', async () => {
    const subnetsStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    if (!subnetsStr || !vpcId) return console.warn('Skip Primary private subnets test, output missing');
    const subnetIds = JSON.parse(subnetsStr);
    const res = await safeAwsCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(res?.Subnets?.length).toEqual(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toEqual(vpcId);
    });
  });

  test('Secondary private subnets exist and belong to secondary VPC', async () => {
    const subnetsStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    if (!subnetsStr || !vpcId) return console.warn('Skip Secondary private subnets test, output missing');
    const subnetIds = JSON.parse(subnetsStr);
    const res = await safeAwsCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets?.length).toEqual(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toEqual(vpcId);
    });
  });

  test('Primary and Secondary S3 buckets exist', async () => {
    const primaryBucket = outputs.s3_bucket_primary_id;
    const secondaryBucket = outputs.s3_bucket_secondary_id;
    if (!primaryBucket || !secondaryBucket) return console.warn('Skip S3 bucket tests, output missing');
    await expect(safeAwsCall(s3Primary.headBucket.bind(s3Primary), { Bucket: primaryBucket })).resolves.not.toBeNull();
    await expect(safeAwsCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: secondaryBucket })).resolves.not.toBeNull();
  });

  test('Aurora primary cluster endpoint is active', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    if (!endpoint) return console.warn('Skip Aurora cluster test, output missing');
    const clusters = await safeAwsCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    const found = clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint);
    expect(found).toBe(true);
  });

  test('Lambda failover function exists and is active', async () => {
    const fnName = outputs.lambda_function_name;
    if (!fnName) return console.warn('Skip Lambda function test, output missing');
    const fn = await safeAwsCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: fnName });
    expect(fn?.Configuration?.FunctionName).toEqual(fnName);
    expect(['Active', 'Pending']).toContain(fn?.Configuration?.State);
  });

  test('DMS replication instance exists and is available', async () => {
    const dmsId = outputs.dms_replication_instance_id;
    if (!dmsId) return console.warn('Skip DMS test, output missing');
    const res = await safeAwsCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), {
      Filters: [{ Name: 'replication-instance-id', Values: [dmsId] }],
    });
    expect(res?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(res?.ReplicationInstances?.[0]?.ReplicationInstanceIdentifier).toEqual(dmsId);
  });

  test('SNS alarm topic exists and accessible', async () => {
    const arn = outputs.sns_topic_arn;
    if (!arn) return console.warn('Skip SNS topic test, output missing');
    const attr = await safeAwsCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: arn });
    expect(attr?.Attributes?.TopicArn).toEqual(arn);
  });

  test('Route53 hosted zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    if (!zoneId) return console.warn('Skip Route53 hosted zone test, output missing');
    const zone = await safeAwsCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  test('CloudWatch primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    if (!alarmName) return console.warn('Skip CloudWatch alarm test, output missing');
    const alarms = await safeAwsCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  test('SSM parameters for primary and secondary DB endpoints exist', async () => {
    const primaryParam = outputs.parameter_store_db_endpoint_primary;
    const secondaryParam = outputs.parameter_store_db_endpoint_secondary;
    if (!primaryParam || !secondaryParam) return console.warn('Skip SSM parameter tests, outputs missing');
    const pRes = await safeAwsCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: primaryParam });
    const sRes = await safeAwsCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: secondaryParam });
    expect(pRes?.Parameter?.Name).toEqual(primaryParam);
    expect(sRes?.Parameter?.Name).toEqual(secondaryParam);
  });
});

