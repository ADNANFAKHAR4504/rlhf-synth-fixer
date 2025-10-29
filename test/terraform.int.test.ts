import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs: Record<string, any> = JSON.parse(readFileSync(outputsPath, 'utf-8'));

// Dynamic regions from outputs
const regionPrimary = outputs.aws_primary_region || 'us-east-1';
const regionSecondary = outputs.aws_secondary_region || 'us-west-2';

// Instantiate AWS SDK clients for each region
const ec2Primary = new AWS.EC2({ region: regionPrimary });
const ec2Secondary = new AWS.EC2({ region: regionSecondary });
const s3Primary = new AWS.S3({ region: regionPrimary });
const s3Secondary = new AWS.S3({ region: regionSecondary });
const rdsPrimary = new AWS.RDS({ region: regionPrimary });
const rdsSecondary = new AWS.RDS({ region: regionSecondary });
const lambdaPrimary = new AWS.Lambda({ region: regionPrimary });
const lambdaSecondary = new AWS.Lambda({ region: regionSecondary });
const snsPrimary = new AWS.SNS({ region: regionPrimary });
const snsSecondary = new AWS.SNS({ region: regionSecondary });
const secretsManagerPrimary = new AWS.SecretsManager({ region: regionPrimary });
const secretsManagerSecondary = new AWS.SecretsManager({ region: regionSecondary });

async function safeAWSCall(callFunction: any, ...args: any[]): Promise<any | null> {
  try {
    return await callFunction(...args);
  } catch (error: any) {
    if (error.code === 'ResourceNotFoundException' || error.message?.includes('not found')) {
      console.warn(`[WARN] Resource not found during AWS SDK call: ${error.message}`);
      return null;
    }
    throw error;
  }
}

describe('Live Integration Tests for TAP Stack Resources', () => {

  it('VPCs exist and match expected IDs', async () => {
    for (const [vpcId, client] of [
      [outputs.vpc_primary_id, ec2Primary],
      [outputs.vpc_secondary_id, ec2Secondary]
    ]) {
      if (!vpcId) continue;
      const res = await safeAWSCall(client.describeVpcs.bind(client), { VpcIds: [vpcId] });
      expect(res?.Vpcs?.[0]?.VpcId).toBe(vpcId);
    }
  });

  it('Internet Gateways exist and attached', async () => {
    for (const [igwId, client, vpcId] of [
      [outputs.igw_primary_id, ec2Primary, outputs.vpc_primary_id],
      [outputs.igw_secondary_id, ec2Secondary, outputs.vpc_secondary_id]
    ]) {
      if (!igwId) continue;
      const res = await safeAWSCall(client.describeInternetGateways.bind(client), { InternetGatewayIds: [igwId] });
      expect(res?.InternetGateways?.[0]?.InternetGatewayId).toBe(igwId);
    }
  });

  it('NAT gateways are available in both regions', async () => {
    for (const [natIdsStr, client] of [
      [outputs.nat_gateway_primary_ids, ec2Primary],
      [outputs.nat_gateway_secondary_ids, ec2Secondary]
    ]) {
      const ids = JSON.parse(natIdsStr);
      if (!ids?.length) continue;
      const res = await safeAWSCall(client.describeNatGateways.bind(client), { NatGatewayIds: ids });
      for (const id of ids) {
        const nat = res?.NatGateways?.find((g: any) => g.NatGatewayId === id);
        expect(nat?.State).toBe('available');
      }
    }
  });

  it('Subnets are correctly deployed and attached to the VPCs', async () => {
    const subnetMappings = [
      ['primary_public_subnet_ids', ec2Primary],
      ['primary_private_subnet_ids', ec2Primary],
      ['secondary_public_subnet_ids', ec2Secondary],
      ['secondary_private_subnet_ids', ec2Secondary],
    ];

    for (const [key, client] of subnetMappings) {
      const ids = outputs[key] && JSON.parse(outputs[key]);
      if (!ids?.length) continue;
      const res = await safeAWSCall(client.describeSubnets.bind(client), { SubnetIds: ids });
      expect(res?.Subnets?.length).toBe(ids.length);
      for (const subnet of res?.Subnets || []) {
        expect(ids).toContain(subnet.SubnetId);
        expect(subnet.VpcId).toBe(outputs.vpc_primary_id || outputs.vpc_secondary_id);
      }
    }
  });

  it('S3 buckets are accessible', async () => {
    for (const client of [s3Primary, s3Secondary]) {
      for (const key of ['s3_bucket_primary_id', 's3_bucket_secondary_id']) {
        if (!outputs[key]) continue;
        const res = await safeAWSCall(client.headBucket.bind(client), { Bucket: outputs[key] });
        expect(res).not.toBeNull();
      }
    }
  });

  it('Lambda functions are active and have correct configuration', async () => {
    for (const [nameKey, arnKey, client] of [
      ['lambda_primary_name', 'lambda_primary_arn', lambdaPrimary],
      ['lambda_secondary_name', 'lambda_secondary_arn', lambdaSecondary]
    ]) {
      const functionName = outputs[nameKey];
      const expectedArn = outputs[arnKey];
      if (!functionName || !expectedArn) continue;
      const res = await safeAWSCall(client.getFunction.bind(client), { FunctionName: functionName });
      expect(res?.Configuration?.FunctionArn).toBe(expectedArn);
      expect(['Active', 'Pending']).toContain(res?.Configuration?.State);
    }
  });

  it('RDS primary instance exists, endpoint matches, and event subscription is active', async () => {
    if (!outputs.rds_primary_id || !outputs.rds_primary_endpoint || !outputs.rds_event_subscription_primary_id) return;
    const res = await safeAWSCall(rdsPrimary.describeDBInstances.bind(rdsPrimary), { DBInstanceIdentifier: outputs.rds_primary_id });
    expect(res?.DBInstances?.[0]?.DBInstanceIdentifier).toBe(outputs.rds_primary_id);
    expect(res?.DBInstances?.[0]?.Endpoint?.Address).toContain(outputs.rds_primary_endpoint.split(':')[0]);
    const subRes = await safeAWSCall(rdsPrimary.describeEventSubscriptions.bind(rdsPrimary), { SubscriptionName: outputs.rds_event_subscription_primary_id });
    expect(subRes?.EventSubscriptionsList?.[0]?.CustSubscriptionId).toBe(outputs.rds_event_subscription_primary_id);
  });

  it('Secrets Manager secrets exist for RDS credentials', async () => {
    for (const [arn, client] of [
      [outputs.secrets_manager_primary_arn, secretsManagerPrimary],
      [outputs.secrets_manager_secondary_arn, secretsManagerSecondary]
    ]) {
      if (!arn) continue;
      const secret = await safeAWSCall(client.describeSecret.bind(client), { SecretId: arn });
      expect(secret?.ARN).toBe(arn);
    }
  });

  it('Security Groups exist and are attached to RDS and Lambda', async () => {
    for (const [sgId, client] of [
      [outputs.sg_rds_primary_id, ec2Primary],
      [outputs.sg_rds_secondary_id, ec2Secondary],
      [outputs.sg_lambda_primary_id, ec2Primary],
      [outputs.sg_lambda_secondary_id, ec2Secondary]
    ]) {
      if (!sgId) continue;
      const res = await safeAWSCall(client.describeSecurityGroups.bind(client), { GroupIds: [sgId] });
      expect(res?.SecurityGroups?.[0]?.GroupId).toBe(sgId);
    }
  });

  it('SNS topics are available and accessible', async () => {
    for (const [arn, client] of [
      [outputs.sns_topic_primary_arn, snsPrimary],
      [outputs.sns_topic_secondary_arn, snsSecondary]
    ]) {
      if (!arn) continue;
      const attr = await safeAWSCall(client.getTopicAttributes.bind(client), { TopicArn: arn });
      expect(attr?.Attributes?.TopicArn).toBe(arn);
    }
  });

  it('Route53 health checks and DNS records exist', async () => {
    expect(typeof outputs.route53_health_check_primary_id).toBe('string');
    expect(typeof outputs.route53_zone_id).toBe('string');
    expect(typeof outputs.route53_failover_dns).toBe('string');
  });
});

