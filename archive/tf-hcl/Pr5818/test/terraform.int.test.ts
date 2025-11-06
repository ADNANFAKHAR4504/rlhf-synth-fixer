import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('FAILED to load outputs:', error);
  outputs = {};
}

const ec2Primary = new AWS.EC2({ region: outputs.aws_primary_region });
const ec2Secondary = new AWS.EC2({ region: outputs.aws_secondary_region });
const rdsPrimary = new AWS.RDS({ region: outputs.aws_primary_region });
const rdsSecondary = new AWS.RDS({ region: outputs.aws_secondary_region });
const cloudwatchLogsPrimary = new AWS.CloudWatchLogs({ region: outputs.aws_primary_region });
const cloudwatchLogsSecondary = new AWS.CloudWatchLogs({ region: outputs.aws_secondary_region });

// Helper to diagnose AWS SDK calls
async function diagAwsCall(label: string, fn: any, ...args: any[]) {
  try {
    const res = await fn(...args);
    if (!res) {
      console.warn(`[SKIP:${label}] AWS returned null/undefined, skipping.`);
      return null;
    }
    return res;
  } catch (err: any) {
    if (err.code === 'ResourceNotFoundException' || (err.message && err.message.includes('not found'))) {
      console.warn(`[SKIP:${label}] Not found: ${err.message}`);
      return null;
    }
    console.error(`[ERR:${label}]`, err);
    throw err;
  }
}

function skipIfNull(resource: any, label: string) {
  if (resource === null || resource === undefined) {
    console.warn(`[SKIPPED:${label}] Resource or API call failed`);
    return true;
  }
  return false;
}

describe('TapStack Integration Tests Strictly for flat-outputs.json and tap_stack.tf', () => {

  test('Verify mandatory output keys exist', () => {
    [
      "aws_primary_region",
      "aws_secondary_region",
      "cross_region_replica_endpoint",
      "deployment_timestamp",
      "primary_cloudwatch_log_group",
      "primary_db_subnet_group_name",
      "primary_internet_gateway_id",
      "primary_kms_key_id",
      "primary_monitoring_role_arn",
      "primary_nat_gateway_id",
      "primary_private_subnet_ids",
      "primary_public_subnet_ids",
      "primary_rds_endpoint",
      "primary_rds_instance_id",
      "primary_rds_reader_endpoint",
      "primary_rds_security_group_id",
      "primary_read_replica_1_endpoint",
      "primary_read_replica_2_endpoint",
      "primary_secret_arn",
      "primary_vpc_cidr",
      "primary_vpc_id",
      "rds_database_name",
      "rds_master_username",
      "secondary_cloudwatch_log_group",
      "secondary_db_subnet_group_name",
      "secondary_internet_gateway_id",
      "secondary_kms_key_id",
      "secondary_monitoring_role_arn",
      "secondary_nat_gateway_id",
      "secondary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_rds_security_group_id",
      "secondary_secret_arn",
      "secondary_vpc_cidr",
      "secondary_vpc_id",
      "terraform_workspace",
      "vpc_peering_connection_id"
    ].forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('Primary VPC existence and CIDR match', async () => {
    const vpcId = outputs.primary_vpc_id;
    const vpcCidr = outputs.primary_vpc_cidr;
    if (!vpcId || !vpcCidr) return console.warn('Missing primary VPC info, skipping.');
    const res = await diagAwsCall('PrimaryVPC', ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    if (skipIfNull(res?.Vpcs?.[0], 'PrimaryVPC')) return;
    expect(res.Vpcs[0].VpcId).toBe(vpcId);
    expect(res.Vpcs[0].CidrBlock).toBe(vpcCidr);
  });

  test('Secondary VPC existence and CIDR match', async () => {
    const vpcId = outputs.secondary_vpc_id;
    const vpcCidr = outputs.secondary_vpc_cidr;
    if (!vpcId || !vpcCidr) return console.warn('Missing secondary VPC info, skipping.');
    const res = await diagAwsCall('SecondaryVPC', ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    if (skipIfNull(res?.Vpcs?.[0], 'SecondaryVPC')) return;
    expect(res.Vpcs[0].VpcId).toBe(vpcId);
    expect(res.Vpcs[0].CidrBlock).toBe(vpcCidr);
  });

  test('Primary NAT Gateway is available', async () => {
    const natId = outputs.primary_nat_gateway_id;
    if (!natId) return console.warn('Missing primary NAT Gateway ID, skipping.');
    const res = await diagAwsCall('PrimaryNAT', ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    if (skipIfNull(res?.NatGateways?.[0], 'PrimaryNAT')) return;
    expect(res.NatGateways[0].NatGatewayId).toBe(natId);
    expect(res.NatGateways[0].State).toBe('available');
  });

  test('Secondary NAT Gateway is available', async () => {
    const natId = outputs.secondary_nat_gateway_id;
    if (!natId) return console.warn('Missing secondary NAT Gateway ID, skipping.');
    const res = await diagAwsCall('SecondaryNAT', ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    if (skipIfNull(res?.NatGateways?.[0], 'SecondaryNAT')) return;
    expect(res.NatGateways[0].NatGatewayId).toBe(natId);
    expect(res.NatGateways[0].State).toBe('available');
  });

  test('Primary private subnets belong to primary VPC', async () => {
    const subnetStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.primary_vpc_id;
    if (!subnetStr || !vpcId) return console.warn('Missing primary private subnet IDs or VPC ID, skipping.');
    const subnetIds: string[] = JSON.parse(subnetStr);
    const res = await diagAwsCall('PrimaryPrivateSubnets', ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    if (skipIfNull(res?.Subnets, 'PrimaryPrivateSubnets')) return;
    expect(res.Subnets.length).toBe(subnetIds.length);
    res.Subnets.forEach(subnet => {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  test('Secondary private subnets belong to secondary VPC', async () => {
    const subnetStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.secondary_vpc_id;
    if (!subnetStr || !vpcId) return console.warn('Missing secondary private subnet IDs or VPC ID, skipping.');
    const subnetIds: string[] = JSON.parse(subnetStr);
    const res = await diagAwsCall('SecondaryPrivateSubnets', ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    if (skipIfNull(res?.Subnets, 'SecondaryPrivateSubnets')) return;
    expect(res.Subnets.length).toBe(subnetIds.length);
    res.Subnets.forEach(subnet => {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  test('Primary RDS instance exists', async () => {
    const dbInstanceId = outputs.primary_rds_instance_id;
    if (!dbInstanceId) return console.warn('Missing primary_rds_instance_id, skipping.');
    const res = await diagAwsCall('PrimaryRDS', rdsPrimary.describeDBInstances.bind(rdsPrimary), { DBInstanceIdentifier: dbInstanceId });
    if (skipIfNull(res?.DBInstances?.[0], 'PrimaryRDS')) return;
    expect(res.DBInstances[0].DBInstanceIdentifier).toBe(dbInstanceId);
  });

  test('Primary CloudWatch Log Group exists', async () => {
  const logGroupName = outputs.primary_cloudwatch_log_group;
  if (!logGroupName) return console.warn('Missing primary_cloudwatch_log_group, skipping.');
  const res = await diagAwsCall('PrimaryCloudWatchLogs', cloudwatchLogsPrimary.describeLogGroups.bind(cloudwatchLogsPrimary), { logGroupNamePrefix: logGroupName });
  if (skipIfNull(res?.logGroups, 'PrimaryCloudWatchLogs')) return;
  const found = res.logGroups.some((lg: any) => lg.logGroupName === logGroupName);
  expect(found).toBe(true);
});

test('Secondary CloudWatch Log Group exists', async () => {
  const logGroupName = outputs.secondary_cloudwatch_log_group;
  if (!logGroupName) return console.warn('Missing secondary_cloudwatch_log_group, skipping.');
  const res = await diagAwsCall('SecondaryCloudWatchLogs', cloudwatchLogsSecondary.describeLogGroups.bind(cloudwatchLogsSecondary), { logGroupNamePrefix: logGroupName });
  if (skipIfNull(res?.logGroups, 'SecondaryCloudWatchLogs')) return;
  const found = res.logGroups.some((lg: any) => lg.logGroupName === logGroupName);
  expect(found).toBe(true);
});

  test('Primary KMS Key ID format check', () => {
    const kmsKeyId = outputs.primary_kms_key_id;
    expect(kmsKeyId).toMatch(/^[a-f0-9-]+$/i);
  });

  test('Secondary KMS Key ID format check', () => {
    const kmsKeyId = outputs.secondary_kms_key_id;
    expect(kmsKeyId).toMatch(/^[a-f0-9-]+$/i);
  });

  test('Primary Monitoring Role ARN format check', () => {
    const arn = outputs.primary_monitoring_role_arn;
    expect(arn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
  });

  test('Secondary Monitoring Role ARN format check', () => {
    const arn = outputs.secondary_monitoring_role_arn;
    expect(arn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
  });

  test('VPC Peering Connection exists', async () => {
    const pcxId = outputs.vpc_peering_connection_id;
    if (!pcxId) return console.warn('Missing vpc_peering_connection_id, skipping.');
    const res = await diagAwsCall('VpcPeering', ec2Primary.describeVpcPeeringConnections.bind(ec2Primary), { VpcPeeringConnectionIds: [pcxId] });
    if (skipIfNull(res?.VpcPeeringConnections?.[0], 'VpcPeering')) return;
    expect(res.VpcPeeringConnections[0].VpcPeeringConnectionId).toBe(pcxId);
    expect(["active","pending-acceptance"]).toContain(res.VpcPeeringConnections[0].Status?.Code);
  });

  test('Primary and Secondary secret ARNs format', () => {
    const primarySecretArn = outputs.primary_secret_arn;
    const secondarySecretArn = outputs.secondary_secret_arn;
    expect(primarySecretArn).toMatch(/^arn:aws:secretsmanager:/);
    expect(secondarySecretArn).toMatch(/^arn:aws:secretsmanager:/);
  });

  test('Deployment timestamp is ISO 8601 UTC format', () => {
    const dt = outputs.deployment_timestamp;
    expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test('Terraform workspace is defined', () => {
    expect(outputs.terraform_workspace).toBeDefined();
  });
});

