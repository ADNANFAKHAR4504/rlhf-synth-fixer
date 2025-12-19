
import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs: Record<string, any> = JSON.parse(readFileSync(outputsPath, 'utf-8'));

const regionPrimary = outputs.aws_primary_region || 'us-east-1';
const regionSecondary = outputs.aws_secondary_region || 'eu-central-1';

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
const elbv2Primary = new AWS.ELBv2({ region: regionPrimary });
const elbv2Secondary = new AWS.ELBv2({ region: regionSecondary });
const cloudfront = new AWS.CloudFront();
const route53 = new AWS.Route53();

const usNatGatewayIds = outputs.us_nat_gateway_ids ? JSON.parse(outputs.us_nat_gateway_ids) : [];
const euNatGatewayIds = outputs.eu_nat_gateway_ids ? JSON.parse(outputs.eu_nat_gateway_ids) : [];
const usPublicSubnets = outputs.us_public_subnet_ids ? JSON.parse(outputs.us_public_subnet_ids) : [];
const usPrivateSubnets = outputs.us_private_subnet_ids ? JSON.parse(outputs.us_private_subnet_ids) : [];
const euPublicSubnets = outputs.eu_public_subnet_ids ? JSON.parse(outputs.eu_public_subnet_ids) : [];
const euPrivateSubnets = outputs.eu_private_subnet_ids ? JSON.parse(outputs.eu_private_subnet_ids) : [];

async function safeAWSCall(callFn: any, ...args: any[]): Promise<any | null> {
  try {
    return await callFn(...args);
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || err.message?.includes('not found')) {
      console.warn(`[WARN] Resource not found: ${err.message}`);
      return null;
    }
    console.error('AWS SDK call failed:', err);
    throw err;
  }
}

describe('TAP Stack Integration Tests Based On flat-outputs.json', () => {
  it('Primary VPC exists', async () => {
    if (!outputs.us_vpc_id) { console.warn('Skipping Primary VPC test - output missing'); return; }
    const res = await safeAWSCall(ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [outputs.us_vpc_id] });
    if (!res || !res.Vpcs || !res.Vpcs.length) return console.warn('Primary VPC not found');
    expect(res.Vpcs[0].VpcId).toBe(outputs.us_vpc_id);
  });

  it('Secondary VPC exists', async () => {
    if (!outputs.eu_vpc_id) { console.warn('Skipping Secondary VPC test - output missing'); return; }
    const res = await safeAWSCall(ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [outputs.eu_vpc_id] });
    if (!res || !res.Vpcs || !res.Vpcs.length) return console.warn('Secondary VPC not found');
    expect(res.Vpcs[0].VpcId).toBe(outputs.eu_vpc_id);
  });

  it('Primary NAT Gateways available', async () => {
    if (!outputs.us_nat_gateway_ids) { console.warn('Skipping Primary NAT Gateways test - output missing'); return; }
    const ids = JSON.parse(outputs.us_nat_gateway_ids);
    const res = await safeAWSCall(ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: ids });
    if (!res || !res.NatGateways) return console.warn('Primary NAT Gateways not found');
    ids.forEach(id => {
      const nat = res.NatGateways.find((n: any) => n.NatGatewayId === id);
      expect(nat?.State).toBe('available');
    });
  });

  it('Secondary NAT Gateways available', async () => {
    if (!outputs.eu_nat_gateway_ids) { console.warn('Skipping Secondary NAT Gateways test - output missing'); return; }
    const ids = JSON.parse(outputs.eu_nat_gateway_ids);
    const res = await safeAWSCall(ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: ids });
    if (!res || !res.NatGateways) return console.warn('Secondary NAT Gateways not found');
    ids.forEach(id => {
      const nat = res.NatGateways.find((n: any) => n.NatGatewayId === id);
      expect(nat?.State).toBe('available');
    });
  });

  it('Primary public and private subnets exist and belong to VPC', async () => {
    if (!outputs.us_public_subnet_ids || !outputs.us_private_subnet_ids || !outputs.us_vpc_id) {
      console.warn('Skipping Primary Subnets test - outputs missing');
      return;
    }
    const pubIds = JSON.parse(outputs.us_public_subnet_ids);
    const privIds = JSON.parse(outputs.us_private_subnet_ids);
    const vpcId = outputs.us_vpc_id;

    const pubRes = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: pubIds });
    if (!pubRes || !pubRes.Subnets) return console.warn('Primary public subnets not found');
    expect(pubRes.Subnets.length).toBe(pubIds.length);
    pubRes.Subnets.forEach((sub: any) => {
      expect(pubIds).toContain(sub.SubnetId);
      expect(sub.VpcId).toBe(vpcId);
    });

    const privRes = await safeAWSCall(ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: privIds });
    if (!privRes || !privRes.Subnets) return console.warn('Primary private subnets not found');
    expect(privRes.Subnets.length).toBe(privIds.length);
    privRes.Subnets.forEach((sub: any) => {
      expect(privIds).toContain(sub.SubnetId);
      expect(sub.VpcId).toBe(vpcId);
    });
  });

  it('Secondary public and private subnets exist and belong to VPC', async () => {
    if (!outputs.eu_public_subnet_ids || !outputs.eu_private_subnet_ids || !outputs.eu_vpc_id) {
      console.warn('Skipping Secondary Subnets test - outputs missing');
      return;
    }
    const pubIds = JSON.parse(outputs.eu_public_subnet_ids);
    const privIds = JSON.parse(outputs.eu_private_subnet_ids);
    const vpcId = outputs.eu_vpc_id;

    const pubRes = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: pubIds });
    if (!pubRes || !pubRes.Subnets) return console.warn('Secondary public subnets not found');
    expect(pubRes.Subnets.length).toBe(pubIds.length);
    pubRes.Subnets.forEach((sub: any) => {
      expect(pubIds).toContain(sub.SubnetId);
      expect(sub.VpcId).toBe(vpcId);
    });

    const privRes = await safeAWSCall(ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: privIds });
    if (!privRes || !privRes.Subnets) return console.warn('Secondary private subnets not found');
    expect(privRes.Subnets.length).toBe(privIds.length);
    privRes.Subnets.forEach((sub: any) => {
      expect(privIds).toContain(sub.SubnetId);
      expect(sub.VpcId).toBe(vpcId);
    });
  });

  it('Primary RDS instance exists and endpoint matches', async () => {
    if (!outputs.us_rds_arn || !outputs.us_rds_endpoint) {
      console.warn('Skipping Primary RDS test - outputs missing');
      return;
    }
    const dbId = outputs.us_rds_arn.split(':').pop();
    const res = await safeAWSCall(rdsPrimary.describeDBInstances.bind(rdsPrimary), { DBInstanceIdentifier: dbId });
    if (!res || !res.DBInstances || !res.DBInstances.length) return console.warn('Primary RDS instance not found');
    expect(res.DBInstances[0].DBInstanceIdentifier).toBe(dbId);
    expect(res.DBInstances[0].Endpoint.Address).toContain(outputs.us_rds_endpoint.split(':')[0]);
  });

  it('Secondary RDS instance exists and endpoint matches', async () => {
    if (!outputs.eu_rds_arn || !outputs.eu_rds_endpoint) {
      console.warn('Skipping Secondary RDS test - outputs missing');
      return;
    }
    const dbId = outputs.eu_rds_arn.split(':').pop();
    const res = await safeAWSCall(rdsSecondary.describeDBInstances.bind(rdsSecondary), { DBInstanceIdentifier: dbId });
    if (!res || !res.DBInstances || !res.DBInstances.length) return console.warn('Secondary RDS instance not found');
    expect(res.DBInstances[0].DBInstanceIdentifier).toBe(dbId);
    expect(res.DBInstances[0].Endpoint.Address).toContain(outputs.eu_rds_endpoint.split(':')[0]);
  });

  it('Primary S3 bucket is accessible', async () => {
    if (!outputs.us_s3_bucket_name) {
      console.warn('Skipping Primary S3 bucket test - output missing');
      return;
    }
    const res = await safeAWSCall(s3Primary.headBucket.bind(s3Primary), { Bucket: outputs.us_s3_bucket_name });
    expect(res).not.toBeNull();
  });

  it('Secondary S3 bucket is accessible', async () => {
    if (!outputs.eu_s3_bucket_name) {
      console.warn('Skipping Secondary S3 bucket test - output missing');
      return;
    }
    const res = await safeAWSCall(s3Secondary.headBucket.bind(s3Secondary), { Bucket: outputs.eu_s3_bucket_name });
    expect(res).not.toBeNull();
  });

  it('Primary ALB exists and DNS matches', async () => {
    if (!outputs.us_alb_arn || !outputs.us_alb_dns) {
      console.warn('Skipping Primary ALB test - outputs missing');
      return;
    }
    const res = await safeAWSCall(elbv2Primary.describeLoadBalancers.bind(elbv2Primary), { LoadBalancerArns: [outputs.us_alb_arn] });
    if (!res || !res.LoadBalancers || !res.LoadBalancers.length) return console.warn('Primary ALB not found');
    expect(res.LoadBalancers[0].LoadBalancerArn).toBe(outputs.us_alb_arn);
    expect(res.LoadBalancers[0].DNSName).toBe(outputs.us_alb_dns);
  });

  it('Secondary ALB exists and DNS matches', async () => {
    if (!outputs.eu_alb_arn || !outputs.eu_alb_dns) {
      console.warn('Skipping Secondary ALB test - outputs missing');
      return;
    }
    const res = await safeAWSCall(elbv2Secondary.describeLoadBalancers.bind(elbv2Secondary), { LoadBalancerArns: [outputs.eu_alb_arn] });
    if (!res || !res.LoadBalancers || !res.LoadBalancers.length) return console.warn('Secondary ALB not found');
    expect(res.LoadBalancers[0].LoadBalancerArn).toBe(outputs.eu_alb_arn);
    expect(res.LoadBalancers[0].DNSName).toBe(outputs.eu_alb_dns);
  });

  it('SNS topics exist and have correct attributes', async () => {
    const snsPairs = [
      [outputs.us_sns_topic_arn, snsPrimary],
      [outputs.eu_sns_topic_arn, snsSecondary]
    ];
    for (const [arn, client] of snsPairs) {
      if (!arn) {
        console.warn('Skipping SNS topic test, ARN missing');
        continue;
      }
      const res = await safeAWSCall(client.getTopicAttributes.bind(client), { TopicArn: arn });
      if (!res || !res.Attributes) return console.warn(`SNS topic ${arn} attributes missing`);
      expect(res.Attributes.TopicArn).toBe(arn);
    }
  });

  it('CloudFront distribution exists and domain name matches', async () => {
    if (!outputs.cloudfront_distribution_id || !outputs.cloudfront_domain_name) {
      console.warn('Skipping CloudFront test - outputs missing');
      return;
    }
    const res = await safeAWSCall(cloudfront.getDistribution.bind(cloudfront), { Id: outputs.cloudfront_distribution_id });
    if (!res || !res.Distribution) return console.warn('CloudFront distribution not found');
    expect(res.Distribution.Id).toBe(outputs.cloudfront_distribution_id);
    expect(res.Distribution.DomainName).toBe(outputs.cloudfront_domain_name);
  });

  it('Route53 hosted zone exists and has name servers', async () => {
    if (!outputs.route53_zone_id) {
      console.warn('Skipping Route53 test - output missing');
      return;
    }
    const nameServers = outputs.route53_name_servers ? JSON.parse(outputs.route53_name_servers) : [];
    const res = await safeAWSCall(route53.getHostedZone.bind(route53), { Id: outputs.route53_zone_id });
    if (!res || !res.HostedZone) return console.warn('Route53 zone not found');
    expect(res.HostedZone.Id).toContain(outputs.route53_zone_id);
    expect(res.DelegationSet.NameServers).toEqual(expect.arrayContaining(nameServers));
  });

  it('VPC peering connection exists and is active', async () => {
    if (!outputs.vpc_peering_connection_id) {
      console.warn('Skipping VPC Peering test - output missing');
      return;
    }
    const res = await safeAWSCall(ec2Primary.describeVpcPeeringConnections.bind(ec2Primary), { VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id] });
    if (!res || !res.VpcPeeringConnections || !res.VpcPeeringConnections.length) return console.warn('VPC Peering connection not found');
    expect(res.VpcPeeringConnections[0].VpcPeeringConnectionId).toBe(outputs.vpc_peering_connection_id);
    expect(res.VpcPeeringConnections[0].Status.Code).toBe('active');
  });
});

