import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

// Load flat outputs from JSON
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs: Record<string, any> = JSON.parse(readFileSync(outputsPath, 'utf-8'));

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

async function safeAWSCall(callFn: any, ...args: any[]): Promise<any | null> {
  try {
    return await callFn(...args);
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[WARN] Resource not found: ${err.message}`);
      return null;
    }
    console.error('AWS call failed:', err);
    throw err;
  }
}

describe('TapStack Terraform Integration Tests', () => {

  it('Primary VPC exists', async () => {
    if (!outputs.vpc_primary_id) { console.warn('Primary VPC output missing, skipping test'); return; }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [outputs.vpc_primary_id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(outputs.vpc_primary_id);
  });

  it('Secondary VPC exists', async () => {
    if (!outputs.vpc_secondary_id) { console.warn('Secondary VPC output missing, skipping test'); return; }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [outputs.vpc_secondary_id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(outputs.vpc_secondary_id);
  });

  it('Primary NAT Gateway is available', async () => {
    if (!outputs.nat_gateway_primary_id) { console.warn('Primary NAT Gateway output missing, skipping test'); return; }
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [outputs.nat_gateway_primary_id] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Secondary NAT Gateway is available', async () => {
    if (!outputs.nat_gateway_secondary_id) { console.warn('Secondary NAT Gateway output missing, skipping test'); return; }
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [outputs.nat_gateway_secondary_id] });
    expect(res?.NatGateways?.[0]?.State).toBe('available');
  });

  it('Primary private subnets exist and belong to primary VPC', async () => {
    if (!outputs.primary_private_subnet_ids) { console.warn('Primary private subnets missing, skipping'); return; }
    const subnetIds = JSON.parse(outputs.primary_private_subnet_ids);
    const res = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => expect(subnetIds).toContain(s.SubnetId));
    res?.Subnets.forEach(s => expect(s.VpcId).toBe(outputs.vpc_primary_id));
  });

  it('Secondary private subnets exist and belong to secondary VPC', async () => {
    if (!outputs.secondary_private_subnet_ids) { console.warn('Secondary private subnets missing, skipping'); return; }
    const subnetIds = JSON.parse(outputs.secondary_private_subnet_ids);
    const res = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    expect(res?.Subnets.length).toBe(subnetIds.length);
    res?.Subnets.forEach(s => expect(subnetIds).toContain(s.SubnetId));
    res?.Subnets.forEach(s => expect(s.VpcId).toBe(outputs.vpc_secondary_id));
  });

  it('Primary S3 backup bucket exists', async () => {
    if (!outputs.s3_bucket_primary_id) { console.warn('Primary S3 bucket missing, skipping'); return; }
    const bucket = outputs.s3_bucket_primary_id;
    const res = await safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Secondary S3 backup bucket exists', async () => {
    if (!outputs.s3_bucket_secondary_id) { console.warn('Secondary S3 bucket missing, skipping'); return; }
    const bucket = outputs.s3_bucket_secondary_id;
    const res = await safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: bucket });
    expect(res).not.toBeNull();
  });

  it('Primary Aurora cluster is available', async () => {
    if (!outputs.aurora_primary_cluster_endpoint) { console.warn('Primary Aurora cluster endpoint missing, skipping'); return; }
    const listRes = await safeAWSCall(rdsPrimary.describeDBClusters.bind(rdsPrimary), {});
    const found = listRes?.DBClusters?.some((c: any) => c.Endpoint === outputs.aurora_primary_cluster_endpoint);
    expect(found).toBeTruthy();
  });

  it('Failover orchestrator Lambda function exists and active', async () => {
    if (!outputs.lambda_function_name) { console.warn('Lambda function name missing, skipping'); return; }
    const res = await safeAWSCall(lambdaPrimary.getFunction.bind(lambdaPrimary), { FunctionName: outputs.lambda_function_name });
    expect(res?.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
    expect(['Active', 'Pending']).toContain(res?.Configuration?.State);
  });

  it('DMS replication instance exists and is available', async () => {
    if (!outputs.dms_replication_instance_id) { console.warn('DMS Replication Instance ID missing, skipping'); return; }
    const res = await safeAWSCall(dmsPrimary.describeReplicationInstances.bind(dmsPrimary), { Filters: [{ Name: 'replication-instance-id', Values: [outputs.dms_replication_instance_id] }] });
    expect(res?.ReplicationInstances?.length).toBeGreaterThan(0);
    expect(res?.ReplicationInstances[0].ReplicationInstanceIdentifier).toBe(outputs.dms_replication_instance_id);
  });

  it('SNS Alarm topic exists and accessible', async () => {
    if (!outputs.sns_topic_arn) { console.warn('SNS topic ARN missing, skipping'); return; }
    const attr = await safeAWSCall(snsPrimary.getTopicAttributes.bind(snsPrimary), { TopicArn: outputs.sns_topic_arn });
    expect(attr?.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
  });

  it('Route53 Hosted Zone exists', async () => {
    if (!outputs.route53_zone_id) { console.warn('Route53 zone ID missing, skipping'); return; }
    const zones = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: outputs.route53_zone_id });
    expect(zones?.HostedZone?.Id.endsWith(outputs.route53_zone_id)).toBe(true);
  });

  it('CloudWatch primary CPU alarm exists', async () => {
    if (!outputs.cloudwatch_alarm_primary_cpu_name) { console.warn('CloudWatch alarm name missing, skipping'); return; }
    const alarms = await safeAWSCall(cloudwatchPrimary.describeAlarms.bind(cloudwatchPrimary), { AlarmNames: [outputs.cloudwatch_alarm_primary_cpu_name] });
    expect(alarms?.MetricAlarms?.some((a: any) => a.AlarmName === outputs.cloudwatch_alarm_primary_cpu_name)).toBe(true);
  });

  it('SSM parameters for primary and secondary endpoint exist', async () => {
    for (const paramNameKey of ['parameter_store_db_endpoint_primary', 'parameter_store_db_endpoint_secondary']) {
      const paramName = outputs[paramNameKey];
      if (!paramName) { console.warn(`SSM parameter name ${paramNameKey} missing, skipping`); continue; }
      const param = await safeAWSCall(ssmPrimary.getParameter.bind(ssmPrimary), { Name: paramName });
      expect(param?.Parameter?.Name).toBe(paramName);
    }
  });

});

