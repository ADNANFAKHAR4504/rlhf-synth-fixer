import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

let outputs: Record<string, any> = {};
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

try {
  const contents = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(contents);
  console.debug('Loaded outputs file:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('Failed to load outputs:', error);
  throw error;
}

const ec2Primary = new AWS.EC2({ region: outputs.aws_primary_region });
const ec2Secondary = new AWS.EC2({ region: outputs.aws_secondary_region });
const s3Primary = new AWS.S3({ region: outputs.aws_primary_region });
const s3Secondary = new AWS.S3({ region: outputs.aws_secondary_region });
const rdsPrimary = new AWS.RDS({ region: outputs.aws_primary_region });
const lambdaPrimary = new AWS.Lambda({ region: outputs.aws_primary_region });
const snsPrimary = new AWS.SNS({ region: outputs.aws_primary_region });
const dmsPrimary = new AWS.DMS({ region: outputs.aws_primary_region });
const route53 = new AWS.Route53({ region: outputs.aws_primary_region });
const cloudwatchPrimary = new AWS.CloudWatch({ region: outputs.aws_primary_region });
const ssmPrimary = new AWS.SSM({ region: outputs.aws_primary_region });

async function safeCall(fn: any, ...args: any[]) {
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

describe('Full TAP Stack Integration Tests', () => {
  test('Ensure flat outputs keys exist', () => {
    const keys = [
      'vpc_primary_id', 'vpc_secondary_id',
      'nat_gateway_primary_id', 'nat_gateway_secondary_id',
      'primary_private_subnet_ids', 'secondary_private_subnet_ids',
      'aurora_primary_cluster_endpoint', 'lambda_function_name',
      'dms_replication_instance_id', 'sns_topic_arn',
      'route53_zone_id', 'cloudwatch_alarm_primary_cpu_name',
      'parameter_store_db_endpoint_primary', 'parameter_store_db_endpoint_secondary'
    ];
    keys.forEach(k => expect(outputs[k]).toBeDefined());
  });

  test('Primary VPC exists', async () => {
    const id = outputs.vpc_primary_id;
    if (!id) return console.warn('Skipping Primary VPC test - output missing');
    const res = await safeCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [id] });
    expect(res?.Vpcs?.[0]?.VpcId).toEqual(id);
  });

  test('Secondary VPC exists', async () => {
    const id = outputs.vpc_secondary_id;
    if (!id) return console.warn('Skipping Secondary VPC test - output missing');
    const res = await safeCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [id] });
    expect(res?.Vpcs?.[0]?.VpcId).toEqual(id);
  });

  test('Primary NAT Gateway available', async () => {
    const id = outputs.nat_gateway_primary_id;
    if (!id) return console.warn('Skipping Primary NAT Gateway test - output missing');
    const res = await safeCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [id] });
    expect(res?.NatGateways?.[0]?.State).toEqual('available');
  });

  test('Secondary NAT Gateway available', async () => {
    const id = outputs.nat_gateway_secondary_id;
    if (!id) return console.warn('Skipping Secondary NAT Gateway test - output missing');
    const res = await safeCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [id] });
    expect(res?.NatGateways?.[0]?.State).toEqual('available');
  });

  test('Primary private subnets belong to primary VPC', async () => {
    const subnetStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    if (!subnetStr || !vpcId) return console.warn('Skipping Primary private subnets test - output missing');
    const subnetIds = JSON.parse(subnetStr);
    const res = await safeCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toEqual(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toEqual(vpcId);
    });
  });

  test('Secondary private subnets belong to secondary VPC', async () => {
    const subnetStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    if (!subnetStr || !vpcId) return console.warn('Skipping Secondary private subnets test - output missing');
    const subnetIds = JSON.parse(subnetStr);
    const res = await safeCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toEqual(subnetIds.length);
    res?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toEqual(vpcId);
    });
  });

  test('S3 buckets exist', async () => {
    const prim = outputs.s3_bucket_primary_id;
    const sec = outputs.s3_bucket_secondary_id;
    if (!prim || !sec) return console.warn('Skipping S3 buckets test');
    await expect(safeCall(s3Primary.headBucket.bind(s3Primary), { Bucket: prim })).resolves.not.toBeNull();
    await expect(safeCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: sec })).resolves.not.toBeNull();
  });

  test('Aurora primary cluster endpoint exists', async () => {
    const ep = outputs.aurora_primary_cluster_endpoint;
    if (!ep) return console.warn('Skipping Aurora cluster test');
    const clusters = await safeCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    expect(clusters?.DBClusters?.some(c => c.Endpoint === ep)).toBe(true);
  });

  test('Lambda function exists and active', async () => {
    const name = outputs.lambda_function_name;
    if (!name) return console.warn('Skipping Lambda test');
    const fn = await safeCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: name });
    expect(fn?.Configuration.FunctionName).toEqual(name);
    expect(['Active', 'Pending']).toContain(fn?.Configuration.State);
  });

  test('DMS replication instance exists', async () => {
    const id = outputs.dms_replication_instance_id;
    if (!id) return console.warn('Skipping DMS test');
    const inst = await safeCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), { Filters: [{ Name: 'replication-instance-id', Values: [id] }] });
    expect(inst?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(inst?.ReplicationInstances[0].ReplicationInstanceIdentifier).toEqual(id);
  });

  test('SNS alarm topic exists', async () => {
    const arn = outputs.sns_topic_arn;
    if (!arn) return console.warn('Skipping SNS topic test');
    const attr = await safeCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: arn });
    expect(attr?.Attributes?.TopicArn).toEqual(arn);
  });

  test('Route53 hosted zone exists', async () => {
    const id = outputs.route53_zone_id;
    if (!id) return console.warn('Skipping Route53 test');
    const zone = await safeCall(route53.getHostedZone.bind(route53), { Id: id });
    expect(zone?.HostedZone?.Id.endsWith(id)).toBe(true);
  });

  test('CloudWatch alarm exists', async () => {
    const name = outputs.cloudwatch_alarm_primary_cpu_name;
    if (!name) return console.warn('Skipping CloudWatch alarm test');
    const alarms = await safeCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [name] });
    expect(alarms?.MetricAlarms?.some(a => a.AlarmName === name)).toBe(true);
  });

  test('SSM parameters exist for primary and secondary DB endpoints', async () => {
    const primaryParam = outputs.parameter_store_db_endpoint_primary;
    const secondaryParam = outputs.parameter_store_db_endpoint_secondary;
    if (!primaryParam || !secondaryParam) return console.warn('Skipping SSM parameter test');
    const p = await safeCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: primaryParam });
    const s = await safeCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: secondaryParam });
    expect(p?.Parameter?.Name).toEqual(primaryParam);
    expect(s?.Parameter?.Name).toEqual(secondaryParam);
  });
});
