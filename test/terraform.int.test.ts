import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs: Record<string, any> = JSON.parse(readFileSync(outputsPath, 'utf-8'));

const regionPrimary = outputs.aws_primary_region || 'us-east-1';
const regionSecondary = outputs.aws_secondary_region || 'us-west-2';

// AWS SDK clients per region
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

async function safeAWSCall(callFn: any, ...args: any[]): Promise<any | null> {
  try {
    return await callFn(...args);
  } catch (error: any) {
    if (error.code === 'ResourceNotFoundException' || error.message?.includes('not found')) {
      console.warn(`[WARN] Resource not found: ${error.message}`);
      return null;
    }
    console.error(error);
    throw error;
  }
}

describe('Live Integration Tests for TAP Stack Resources', () => {
  
  it('Primary VPC exists', async () => {
    if (!outputs.vpc_primary_id) {
      console.warn('Skipping Primary VPC test: vpc_primary_id missing');
      return;
    }
    console.log('Checking primary VPC:', outputs.vpc_primary_id);
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [outputs.vpc_primary_id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(outputs.vpc_primary_id);
  });
  
  it('Secondary VPC exists', async () => {
    if (!outputs.vpc_secondary_id) {
      console.warn('Skipping Secondary VPC test: vpc_secondary_id missing');
      return;
    }
    console.log('Checking secondary VPC:', outputs.vpc_secondary_id);
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [outputs.vpc_secondary_id] });
    expect(res?.Vpcs?.[0]?.VpcId).toBe(outputs.vpc_secondary_id);
  });
  
  it('Primary Internet Gateway exists', async () => {
    if (!outputs.igw_primary_id) {
      console.warn('Skipping Primary IGW test: igw_primary_id missing');
      return;
    }
    console.log('Checking primary IGW:', outputs.igw_primary_id);
    const res = await safeAWSCall(ec2Primary.describeInternetGateways.bind(ec2Primary), { InternetGatewayIds: [outputs.igw_primary_id] });
    expect(res?.InternetGateways?.[0]?.InternetGatewayId).toBe(outputs.igw_primary_id);
  });
  
  it('Secondary Internet Gateway exists', async () => {
    if (!outputs.igw_secondary_id) {
      console.warn('Skipping Secondary IGW test: igw_secondary_id missing');
      return;
    }
    console.log('Checking secondary IGW:', outputs.igw_secondary_id);
    const res = await safeAWSCall(ec2Secondary.describeInternetGateways.bind(ec2Secondary), { InternetGatewayIds: [outputs.igw_secondary_id] });
    expect(res?.InternetGateways?.[0]?.InternetGatewayId).toBe(outputs.igw_secondary_id);
  });

  it('NAT Gateways exist and are available', async () => {
    for (const [natKey, client] of [['nat_gateway_primary_ids', ec2Primary], ['nat_gateway_secondary_ids', ec2Secondary]]) {
      if (!outputs[natKey]) {
        console.warn(`Skipping NAT gateways test: ${natKey} missing`);
        continue;
      }
      const ids = JSON.parse(outputs[natKey]);
      console.log(`Checking NAT Gateways: ${ids.join(', ')}`);
      const res = await safeAWSCall(client.describeNatGateways.bind(client), { NatGatewayIds: ids });
      for (const id of ids) {
        const nat = res?.NatGateways?.find((g: any) => g.NatGatewayId === id);
        expect(nat?.State).toBe('available');
      }
    }
  });
  
  it('Public and private subnets exist for primary and secondary', async () => {
    const subnetKeys = [
      'primary_public_subnet_ids',
      'primary_private_subnet_ids',
      'secondary_public_subnet_ids',
      'secondary_private_subnet_ids'
    ];
    for (const key of subnetKeys) {
      if (!outputs[key]) {
        console.warn(`Skipping subnets test: ${key} missing`);
        continue;
      }
      const ids = JSON.parse(outputs[key]);
      const client = key.startsWith('primary') ? ec2Primary : ec2Secondary;
      console.log(`Checking subnets for ${key}: ${ids.join(', ')}`);
      const res = await safeAWSCall(client.describeSubnets.bind(client), { SubnetIds: ids });
      expect(res?.Subnets?.length).toBe(ids.length);
      for (const subnet of res?.Subnets || []) {
        expect(ids).toContain(subnet.SubnetId);
      }
    }
  });

  it('S3 buckets exist and are accessible', async () => {
    for (const [key, client] of [['s3_bucket_primary_id', s3Primary], ['s3_bucket_secondary_id', s3Secondary]]) {
      if (!outputs[key]) {
        console.warn(`Skipping S3 bucket test: ${key} missing`);
        continue;
      }
      console.log(`Checking S3 bucket: ${outputs[key]}`);
      const res = await safeAWSCall(client.headBucket.bind(client), { Bucket: outputs[key] });
      expect(res).not.toBeNull();
    }
  });

  it('Lambda functions exist and are active', async () => {
    for (const [nameKey, arnKey, client] of [
      ['lambda_primary_name', 'lambda_primary_arn', lambdaPrimary],
      ['lambda_secondary_name', 'lambda_secondary_arn', lambdaSecondary]
    ]) {
      const name = outputs[nameKey];
      const arn = outputs[arnKey];
      if (!name) {
        console.warn(`Skipping Lambda test: ${nameKey} missing`);
        continue;
      }
      console.log(`Checking Lambda function: ${name}`);
      const res = await safeAWSCall(client.getFunction.bind(client), { FunctionName: name });
      expect(res?.Configuration?.FunctionName).toBe(name);
      if (arn) expect(res?.Configuration?.FunctionArn).toBe(arn);
      expect(['Active', 'Pending']).toContain(res?.Configuration?.State);
    }
  });

  it('Primary RDS instance exists and endpoint matches output', async () => {
    if (!outputs.rds_primary_id || !outputs.rds_primary_endpoint) {
      console.warn('Skipping RDS primary test: id or endpoint missing');
      return;
    }
    console.log(`Testing RDS primary: ${outputs.rds_primary_id}`);
    const res = await safeAWSCall(rdsPrimary.describeDBInstances.bind(rdsPrimary), { DBInstanceIdentifier: outputs.rds_primary_id });
    expect(res?.DBInstances?.[0]?.DBInstanceIdentifier).toBe(outputs.rds_primary_id);
    expect(res?.DBInstances?.[0]?.Endpoint?.Address).toContain(outputs.rds_primary_endpoint.split(':')[0]);
  });

  it('Primary RDS event subscription exists', async () => {
    if (!outputs.rds_event_subscription_primary_id) {
      console.warn('Skipping RDS event subscription test: output missing');
      return;
    }
    console.log(`Testing RDS event subscription: ${outputs.rds_event_subscription_primary_id}`);
    const res = await safeAWSCall(rdsPrimary.describeEventSubscriptions.bind(rdsPrimary), { SubscriptionName: outputs.rds_event_subscription_primary_id });
    expect(res?.EventSubscriptionsList?.[0]?.CustSubscriptionId).toBe(outputs.rds_event_subscription_primary_id);
  });

  it('Secrets Manager secrets for RDS credentials exist', async () => {
    for (const [arn, client] of [[outputs.secrets_manager_primary_arn, secretsManagerPrimary], [outputs.secrets_manager_secondary_arn, secretsManagerSecondary]]) {
      if (!arn) {
        console.warn('Skipping Secrets Manager test: secret ARN missing');
        continue;
      }
      console.log(`Checking Secrets Manager secret: ${arn}`);
      const secret = await safeAWSCall(client.describeSecret.bind(client), { SecretId: arn });
      expect(secret?.ARN).toBe(arn);
    }
  });

  it('Security groups exist and are attached', async () => {
    for (const [sgId, client] of [
      [outputs.sg_lambda_primary_id, ec2Primary],
      [outputs.sg_lambda_secondary_id, ec2Secondary],
      [outputs.sg_rds_primary_id, ec2Primary],
      [outputs.sg_rds_secondary_id, ec2Secondary]
    ]) {
      if (!sgId) {
        console.warn('Skipping Security Group test: group ID missing');
        continue;
      }
      console.log(`Checking Security Group: ${sgId}`);
      const res = await safeAWSCall(client.describeSecurityGroups.bind(client), { GroupIds: [sgId] });
      expect(res?.SecurityGroups?.[0]?.GroupId).toBe(sgId);
    }
  });

  it('SNS topics exist and are accessible', async () => {
    for (const [arn, client] of [[outputs.sns_topic_primary_arn, snsPrimary], [outputs.sns_topic_secondary_arn, snsSecondary]]) {
      if (!arn) {
        console.warn('Skipping SNS Topic test: ARN missing');
        continue;
      }
      console.log(`Checking SNS Topic: ${arn}`);
      const attr = await safeAWSCall(client.getTopicAttributes.bind(client), { TopicArn: arn });
      expect(attr?.Attributes?.TopicArn).toBe(arn);
    }
  });

  it('Route53 health check and DNS have valid values', () => {
    expect(typeof outputs.route53_health_check_primary_id).toBe('string');
    expect(typeof outputs.route53_zone_id).toBe('string');
    expect(typeof outputs.route53_failover_dns).toBe('string');
  });
});

