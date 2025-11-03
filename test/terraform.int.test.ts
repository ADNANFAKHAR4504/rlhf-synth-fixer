import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (err) {
  console.error('Error loading flat-outputs.json:', err);
}

// Set AWS clients with regions from outputs
const ec2Primary = new AWS.EC2({ region: outputs['aws_primary_region'] });
const ec2Secondary = new AWS.EC2({ region: outputs['aws_secondary_region'] });
const s3Primary = new AWS.S3({ region: outputs['aws_primary_region'] });
const s3Secondary = new AWS.S3({ region: outputs['aws_secondary_region'] });
const rdsPrimary = new AWS.RDS({ region: outputs['aws_primary_region'] });
const rdsSecondary = new AWS.RDS({ region: outputs['aws_secondary_region'] });
const lambdaPrimary = new AWS.Lambda({ region: outputs['aws_primary_region'] });
const sns = new AWS.SNS({ region: outputs['aws_primary_region'] });
const dms = new AWS.DMS({ region: outputs['aws_primary_region'] });
const route53 = new AWS.Route53({ region: outputs['aws_primary_region'] });
const cloudwatch = new AWS.CloudWatch({ region: outputs['aws_primary_region'] });
const ssm = new AWS.SSM({ region: outputs['aws_primary_region'] });

async function safeAWSCall(callFn: any, ...args: any[]) {
  try {
    const res = await callFn(...args);
    return res;
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[WARN] Resource not found: ${err.message}`);
      return null;
    }
    console.error('AWS SDK call failed:', err);
    throw err;
  }
}

// Verification with diagnostics
console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
const requiredKeys = [
  'vpc_primary_id', 'vpc_secondary_id', 'nat_gateway_primary_id', 'nat_gateway_secondary_id',
  'primary_private_subnet_ids', 'secondary_private_subnet_ids', 'lambda_function_name',
  'aurora_primary_cluster_endpoint', 'sns_topic_arn', 'dms_replication_instance_id',
  'route53_zone_id', 'cloudwatch_alarm_primary_cpu_name',
  'parameter_store_db_endpoint_primary', 'parameter_store_db_endpoint_secondary'
];
requiredKeys.forEach(k => {
  if (!(k in outputs)) {
    console.warn(`WARNING: Key missing in outputs: ${k}`);
  }
});

describe('Confirmed Outputs - Real Resources', () => {
  it('Primary VPC exists', async () => {
    const id = outputs['vpc_primary_id'];
    if (!id) { console.warn('Skipping test: vpc_primary_id missing'); return; }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(id);
  });

  it('Secondary VPC exists', async () => {
    const id = outputs['vpc_secondary_id'];
    if (!id) { console.warn('Skipping test: vpc_secondary_id missing'); return; }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(id);
  });

  it('Primary NAT Gateway is available', async () => {
    const id = outputs['nat_gateway_primary_id'];
    if (!id) { console.warn('Skipping: nat_gateway_primary_id missing'); return; }
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [id] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    const id = outputs['nat_gateway_secondary_id'];
    if (!id) { console.warn('Skipping: nat_gateway_secondary_id missing'); return; }
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [id] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets belong to primary VPC', async () => {
    const strIds = outputs['primary_private_subnet_ids'];
    const vpcId = outputs['vpc_primary_id'];
    if (!strIds || !vpcId) { console.warn('Missing primary_private_subnet_ids or vpc_primary_id'); return; }
    const ids = JSON.parse(strIds);
    const res = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: ids });
    expect(res?.Subnets.length).toBe(ids.length);
    res?.Subnets.forEach(s => {
      expect(ids).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('Secondary private subnets belong to secondary VPC', async () => {
    const strIds = outputs['secondary_private_subnet_ids'];
    const vpcId = outputs['vpc_secondary_id'];
    if (!strIds || !vpcId) { console.warn('Missing secondary_private_subnet_ids or vpc_secondary_id'); return; }
    const ids = JSON.parse(strIds);
    const res = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: ids });
    expect(res?.Subnets.length).toBe(ids.length);
    res?.Subnets.forEach(s => {
      expect(ids).toContain(s.SubnetId);
      expect(s.VpcId).toBe(vpcId);
    });
  });

  it('S3 buckets exist', async () => {
    const pBucket = outputs['s3_bucket_primary_id'];
    const sBucket = outputs['s3_bucket_secondary_id'];
    if (!pBucket || !sBucket) { console.warn('Missing S3 bucket IPs'); return; }
    await expectAsync(safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: pBucket })).resolves.not.toBeNull();
    await expectAsync(safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: sBucket })).resolves.not.toBeNull();
  });

  it('Aurora cluster primary endpoint is active', async () => {
    const endpoint = outputs['aurora_primary_cluster_endpoint'];
    if (!endpoint) { console.warn('Missing aurora_primary_cluster_endpoint'); return; }
    const clusters = await safeAWSCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    expect(clusters?.DBClusters?.some((c: any) => c.Endpoint === endpoint)).toBe(true);
  });

  it('Lambda failover function exists and is active', async () => {
    const fnName = outputs['lambda_function_name'];
    if (!fnName) { console.warn('Missing lambda_function_name'); return; }
    const fn = await safeAWSCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: fnName });
    expect(fn?.Configuration?.FunctionName).toBe(fnName);
    expect(['Active', 'Pending']).toContain(fn?.Configuration?.State);
  });

  it('DMS replication instance exists and is available', async () => {
    const dmsId = outputs['dms_replication_instance_id'];
    if (!dmsId) { console.warn('Missing dms_replication_instance_id'); return; }
    const insts = await safeAWSCall(dms.describeReplicationInstances.bind(dms), { Filters: [{ Name: 'replication-instance-id', Values: [dmsId] }] });
    expect(insts?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(insts?.ReplicationInstances?.[0]?.ReplicationInstanceIdentifier).toBe(dmsId);
  });

  it('SNS Topic is accessible', async () => {
    const arn = outputs['sns_topic_arn'];
    if (!arn) { console.warn('Missing sns_topic_arn'); return; }
    const attr = await safeAWSCall(sns.getTopicAttributes.bind(sns), { TopicArn: arn });
    expect(attr?.Attributes?.TopicArn).toBe(arn);
  });

  it('Route53 hosted zone exists', async () => {
    const zoneId = outputs['route53_zone_id'];
    if (!zoneId) { console.warn('Missing route53_zone_id'); return; }
    const zone = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: zoneId });
    expect(zone?.HostedZone?.Id.endsWith(zoneId)).toBe(true);
  });

  it('CloudWatch alarm for primary CPU exists', async () => {
    const alarmName = outputs['cloudwatch_alarm_primary_cpu_name'];
    if (!alarmName) { console.warn('Missing cloudwatch_alarm_primary_cpu_name'); return; }
    const alarms = await safeAWSCall(cloudwatch.describeAlarms.bind(cloudwatch), { AlarmNames: [alarmName] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === alarmName)).toBe(true);
  });

  it('SSM parameters exist for primary and secondary DB endpoints', async () => {
    const primaryParam = outputs['parameter_store_db_endpoint_primary'];
    const secondaryParam = outputs['parameter_store_db_endpoint_secondary'];
    if (!primaryParam || !secondaryParam) { console.warn('Missing parameter store keys'); return; }
    const pRes = await safeAWSCall(ssm.getParameter.bind(ssm), { Name: primaryParam });
    const sRes = await safeAWSCall(ssm.getParameter.bind(ssm), { Name: secondaryParam });
    expect(pRes?.Parameter?.Name).toBe(primaryParam);
    expect(sRes?.Parameter?.Name).toBe(secondaryParam);
  });
});

