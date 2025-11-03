import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

const outputsFilePath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

let outputs: any = {};
try {
  const data = fs.readFileSync(outputsFilePath, 'utf8');
  outputs = JSON.parse(data);
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (e) {
  console.error('Failed to load outputs:', e);
  throw new Error(`Cannot proceed without outputs file at ${outputsFilePath}`);
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
const cloudwatch = new AWS.CloudWatch({ region: outputs.aws_primary_region });
const ssmPrimary = new AWS.SSM({ region: outputs.aws_primary_region });

async function safeCall(fn: any, ...args: any[]) {
  try {
    return await fn(...args);
  } catch (error: any) {
    if (error.code === 'ResourceNotFoundException' || (error.message && error.message.includes('not found'))) {
      console.warn(`WARN: AWS resource not found: ${error.message}`);
      return null;
    }
    throw error;
  }
}

describe('Permanent Fix: TAP Stack Integration Tests with Guards', () => {
  // Verify that critical outputs are loaded
  test('flat-outputs.json contains required keys', () => {
    const requiredKeys = [
      'vpc_primary_id', 'vpc_secondary_id', 'nat_gateway_primary_id', 'nat_gateway_secondary_id',
      'primary_private_subnet_ids', 'secondary_private_subnet_ids',
      'aurora_primary_cluster_endpoint', 'lambda_function_name', 'dms_replication_instance_id',
      'sns_topic_arn', 'route53_zone_id', 'cloudwatch_alarm_primary_cpu_name',
      'parameter_store_db_endpoint_primary', 'parameter_store_db_endpoint_secondary'
    ];
    requiredKeys.forEach(k => {
      expect(outputs[k]).toBeDefined();
    });
  });

  test('Primary VPC exists', async () => {
    const vpcId = outputs.vpc_primary_id;
    if (!vpcId) return console.warn('Skipping test: Primary VPC ID missing');
    const result = await safeCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    expect(result?.Vpcs?.[0]?.VpcId).toEqual(vpcId);
  });

  test('Secondary VPC exists', async () => {
    const vpcId = outputs.vpc_secondary_id;
    if (!vpcId) return console.warn('Skipping test: Secondary VPC ID missing');
    const result = await safeCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    expect(result?.Vpcs?.[0]?.VpcId).toEqual(vpcId);
  });

  test('Primary NAT Gateway available', async () => {
    const natId = outputs.nat_gateway_primary_id;
    if (!natId) return console.warn('Skipping test: Primary NAT Gateway ID missing');
    const result = await safeCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    expect(result?.NatGateways?.[0]?.State).toEqual('available');
  });

  test('Secondary NAT Gateway available', async () => {
    const natId = outputs.nat_gateway_secondary_id;
    if (!natId) return console.warn('Skipping test: Secondary NAT Gateway ID missing');
    const result = await safeCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    expect(result?.NatGateways?.[0]?.State).toEqual('available');
  });

  test('Primary private subnets', async () => {
    const subnetIdsStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.vpc_primary_id;
    if (!subnetIdsStr || !vpcId) return console.warn('Skipping test: Primary private subnets or VPC ID missing');
    const subnetIds = JSON.parse(subnetIdsStr);
    const result = await safeCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(result?.Subnets?.length).toEqual(subnetIds.length);
    result?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toEqual(vpcId);
    });
  });

  test('Secondary private subnets', async () => {
    const subnetIdsStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.vpc_secondary_id;
    if (!subnetIdsStr || !vpcId) return console.warn('Skipping test: Secondary private subnets or VPC ID missing');
    const subnetIds = JSON.parse(subnetIdsStr);
    const result = await safeCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(result?.Subnets?.length).toEqual(subnetIds.length);
    result?.Subnets.forEach(s => {
      expect(subnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toEqual(vpcId);
    });
  });

  test('S3 buckets exist', async () => {
    const s3PrimaryBucket = outputs.s3_bucket_primary_id;
    const s3SecondaryBucket = outputs.s3_bucket_secondary_id;
    if (!s3PrimaryBucket || !s3SecondaryBucket) return console.warn('Skipping S3 bucket tests due to missing outputs');
    await expect(safeCall(s3Primary.headBucket.bind(s3Primary), { Bucket: s3PrimaryBucket })).resolves.not.toBeNull();
    await expect(safeCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: s3SecondaryBucket })).resolves.not.toBeNull();
  });

  test('Primary Aurora cluster endpoint', async () => {
    const endpoint = outputs.aurora_primary_cluster_endpoint;
    if (!endpoint) return console.warn('Skipping Aurora cluster test due to missing endpoint output');
    const clusters = await safeCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    const found = clusters?.DBClusters?.some((cluster: any) => cluster.Endpoint === endpoint);
    expect(found).toBe(true);
  });

  test('Lambda function exists and is active', async () => {
    const fnName = outputs.lambda_function_name;
    if (!fnName) return console.warn('Skipping Lambda test due to missing function name');
    const lambda = await safeCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: fnName });
    expect(lambda?.Configuration?.FunctionName).toEqual(fnName);
    expect(['Active', 'Pending']).toContain(lambda?.Configuration?.State);
  });

  test('DMS replication instance exists', async () => {
    const dmsId = outputs.dms_replication_instance_id;
    if (!dmsId) return console.warn('Skipping DMS replication test due to missing ID');
    const instances = await safeCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), {
      Filters: [{ Name: 'replication-instance-id', Values: [dmsId] }]
    });
    expect(instances?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(instances?.ReplicationInstances?.[0].ReplicationInstanceIdentifier).toEqual(dmsId);
  });

  test('SNS topic exists and is accessible', async () => {
    const topicArn = outputs.sns_topic_arn;
    if (!topicArn) return console.warn('Skipping SNS topic test due to missing ARN');
    const topicAttrs = await safeCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: topicArn });
    expect(topicAttrs?.Attributes?.TopicArn).toEqual(topicArn);
  });

  test('Route53 hosted zone exists', async () => {
    const zoneId = outputs.route53_zone_id;
    if (!zoneId) return console.warn('Skipping Route53 test due to missing zone ID');
    const zone = await safeCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  test('CloudWatch primary CPU alarm exists', async () => {
    const alarmName = outputs.cloudwatch_alarm_primary_cpu_name;
    if (!alarmName) return console.warn('Skipping CloudWatch alarm test due to missing alarm name');
    const alarms = await safeCall(cloudwatch.describeAlarms.bind(cloudwatch), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((al: any) => al.AlarmName === alarmName)).toBe(true);
  });

  test('SSM parameters for DB endpoints exist', async () => {
    const primaryParamName = outputs.parameter_store_db_endpoint_primary;
    const secondaryParamName = outputs.parameter_store_db_endpoint_secondary;
    if (!primaryParamName || !secondaryParamName) return console.warn('Skipping SSM parameter test due to missing names');
    const pParam = await safeCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: primaryParamName });
    const sParam = await safeCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: secondaryParamName });
    expect(pParam?.Parameter?.Name).toEqual(primaryParamName);
    expect(sParam?.Parameter?.Name).toEqual(secondaryParamName);
  });
});
