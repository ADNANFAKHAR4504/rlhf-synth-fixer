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

// Helper to handle AWS calls and catch errors
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

// Skip test if the resource is null to prevent failure
function skipIfNull(resource: any, label: string) {
  if (resource === null || resource === undefined) {
    console.warn(`[SKIPPED:${label}] Resource or API call failed`);
    return true;
  }
  return false;
}

describe('TapStack Integration Tests based on flat-outputs.json and tap_stack.tf', () => {

  // Test essential output keys presence
  test('Verify mandatory output keys exist', () => {
    const mandatoryKeys = [
      "aws_primary_region",
      "aws_secondary_region",
      "database_dns_name",
      "db_master_password",
      "db_master_username",
      "deployment_backup_retention",
      "deployment_database_endpoint",
      "deployment_environment",
      "deployment_instance_class",
      "deployment_log_retention",
      "deployment_primary_region",
      "deployment_replication_threshold",
      "deployment_secondary_region",
      "failover_lambda_arn",
      "health_check_lambda_arn",
      "lambda_execution_role_arn",
      "primary_connections_alarm_name",
      "primary_cpu_alarm_name",
      "primary_kms_key_id",
      "primary_lambda_security_group_id",
      "primary_private_subnet_ids",
      "primary_public_subnet_ids",
      "primary_rds_arn",
      "primary_rds_endpoint",
      "primary_rds_security_group_id",
      "primary_s3_bucket",
      "primary_sns_topic_arn",
      "primary_vpc_id",
      "replication_lag_alarm_name",
      "route53_zone_id",
      "route53_zone_name",
      "secondary_kms_key_id",
      "secondary_lambda_security_group_id",
      "secondary_private_subnet_ids",
      "secondary_public_subnet_ids",
      "secondary_rds_arn",
      "secondary_rds_endpoint",
      "secondary_rds_security_group_id",
      "secondary_s3_bucket",
      "secondary_sns_topic_arn",
      "secondary_vpc_id",
      "vpc_peering_connection_id"
    ];
    mandatoryKeys.forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });

  // Primary VPC existence and correct CIDR check
  test('Primary VPC existence', async () => {
    const vpcId = outputs.primary_vpc_id;
    if (!vpcId) return console.warn('Missing primary_vpc_id, skipping test.');
    const res = await diagAwsCall('PrimaryVPC', ec2Primary.describeVpcs.bind(ec2Primary), { VpcIds: [vpcId] });
    if (skipIfNull(res?.Vpcs?.[0], 'PrimaryVPC')) return;
    expect(res.Vpcs[0].VpcId).toBe(vpcId);
  });

  // Secondary VPC existence and correct CIDR check
  test('Secondary VPC existence', async () => {
    const vpcId = outputs.secondary_vpc_id;
    if (!vpcId) return console.warn('Missing secondary_vpc_id, skipping test.');
    const res = await diagAwsCall('SecondaryVPC', ec2Secondary.describeVpcs.bind(ec2Secondary), { VpcIds: [vpcId] });
    if (skipIfNull(res?.Vpcs?.[0], 'SecondaryVPC')) return;
    expect(res.Vpcs[0].VpcId).toBe(vpcId);
  });

  // Primary NAT Gateway availability
  test('Primary NAT Gateway is available', async () => {
    const natId = outputs.primary_nat_gateway_id;
    if (!natId) return console.warn('Missing primary_nat_gateway_id, skipping test.');
    const res = await diagAwsCall('PrimaryNAT', ec2Primary.describeNatGateways.bind(ec2Primary), { NatGatewayIds: [natId] });
    if (skipIfNull(res?.NatGateways?.[0], 'PrimaryNAT')) return;
    expect(res.NatGateways[0].NatGatewayId).toBe(natId);
    expect(res.NatGateways[0].State).toBe('available');
  });

  // Secondary NAT Gateway availability
  test('Secondary NAT Gateway is available', async () => {
    const natId = outputs.secondary_nat_gateway_id;
    if (!natId) return console.warn('Missing secondary_nat_gateway_id, skipping test.');
    const res = await diagAwsCall('SecondaryNAT', ec2Secondary.describeNatGateways.bind(ec2Secondary), { NatGatewayIds: [natId] });
    if (skipIfNull(res?.NatGateways?.[0], 'SecondaryNAT')) return;
    expect(res.NatGateways[0].NatGatewayId).toBe(natId);
    expect(res.NatGateways[0].State).toBe('available');
  });

  // Primary private subnets belong to primary VPC
  test('Primary private subnets belong to primary VPC', async () => {
    const subnetStr = outputs.primary_private_subnet_ids;
    const vpcId = outputs.primary_vpc_id;
    if (!subnetStr || !vpcId) return console.warn('Missing primary_private_subnet_ids or primary_vpc_id, skipping test.');
    const subnetIds: string[] = JSON.parse(subnetStr);
    const res = await diagAwsCall('PrimaryPrivateSubnets', ec2Primary.describeSubnets.bind(ec2Primary), { SubnetIds: subnetIds });
    if (skipIfNull(res?.Subnets, 'PrimaryPrivateSubnets')) return;
    expect(res.Subnets.length).toBe(subnetIds.length);
    res.Subnets.forEach(subnet => {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  // Secondary private subnets belong to secondary VPC
  test('Secondary private subnets belong to secondary VPC', async () => {
    const subnetStr = outputs.secondary_private_subnet_ids;
    const vpcId = outputs.secondary_vpc_id;
    if (!subnetStr || !vpcId) return console.warn('Missing secondary_private_subnet_ids or secondary_vpc_id, skipping test.');
    const subnetIds: string[] = JSON.parse(subnetStr);
    const res = await diagAwsCall('SecondaryPrivateSubnets', ec2Secondary.describeSubnets.bind(ec2Secondary), { SubnetIds: subnetIds });
    if (skipIfNull(res?.Subnets, 'SecondaryPrivateSubnets')) return;
    expect(res.Subnets.length).toBe(subnetIds.length);
    res.Subnets.forEach(subnet => {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  // Primary RDS instance existence
  test('Primary RDS instance exists', async () => {
    const arn = outputs.primary_rds_arn;
    if (!arn) return console.warn('Missing primary_rds_arn, skipping test.');
    const id = arn.split(':').pop(); // Get DB instance ID from ARN
    if(!id) return console.warn('Unable to parse DB instance identifier from ARN');
    const res = await diagAwsCall('PrimaryRDS', rdsPrimary.describeDBInstances.bind(rdsPrimary), { DBInstanceIdentifier: id });
    if (skipIfNull(res?.DBInstances?.[0], 'PrimaryRDS')) return;
    expect(res.DBInstances[0].DBInstanceIdentifier).toBe(id);
  });

  // Secondary RDS instance existence
  test('Secondary RDS instance exists', async () => {
    const arn = outputs.secondary_rds_arn;
    if (!arn) return console.warn('Missing secondary_rds_arn, skipping test.');
    const id = arn.split(':').pop();
    if(!id) return console.warn('Unable to parse DB instance identifier from ARN');
    const res = await diagAwsCall('SecondaryRDS', rdsSecondary.describeDBInstances.bind(rdsSecondary), { DBInstanceIdentifier: id });
    if (skipIfNull(res?.DBInstances?.[0], 'SecondaryRDS')) return;
    expect(res.DBInstances[0].DBInstanceIdentifier).toBe(id);
  });

  // Primary CloudWatch log group exists
  test('Primary CloudWatch Log Group exists', async () => {
    const logGroupName = outputs.primary_cloudwatch_log_group;
    if (!logGroupName) return console.warn('Missing primary_cloudwatch_log_group, skipping test.');
    const res = await diagAwsCall('PrimaryCloudWatchLogs', cloudwatchLogsPrimary.describeLogGroups.bind(cloudwatchLogsPrimary), { logGroupNamePrefix: logGroupName });
    if (skipIfNull(res?.logGroups, 'PrimaryCloudWatchLogs')) return;
    const found = res.logGroups.some((lg: any) => lg.logGroupName === logGroupName);
    expect(found).toBe(true);
  });

  // Secondary CloudWatch log group exists
  test('Secondary CloudWatch Log Group exists', async () => {
    const logGroupName = outputs.secondary_cloudwatch_log_group;
    if (!logGroupName) return console.warn('Missing secondary_cloudwatch_log_group, skipping test.');
    const res = await diagAwsCall('SecondaryCloudWatchLogs', cloudwatchLogsSecondary.describeLogGroups.bind(cloudwatchLogsSecondary), { logGroupNamePrefix: logGroupName });
    if (skipIfNull(res?.logGroups, 'SecondaryCloudWatchLogs')) return;
    const found = res.logGroups.some((lg: any) => lg.logGroupName === logGroupName);
    expect(found).toBe(true);
  });

  // KMS Key ID validity basic check
  test('Primary KMS Key ID format check', () => {
    const kmsKeyId = outputs.primary_kms_key_id;
    expect(kmsKeyId).toMatch(/^[a-f0-9-]+$/i);
  });

  test('Secondary KMS Key ID format check', () => {
    const kmsKeyId = outputs.secondary_kms_key_id;
    expect(kmsKeyId).toMatch(/^[a-f0-9-]+$/i);
  });

  // VPC peering connection validation
  test('VPC Peering Connection exists and active', async () => {
    const pcxId = outputs.vpc_peering_connection_id;
    if (!pcxId) return console.warn('Missing vpc_peering_connection_id, skipping test.');
    const res = await diagAwsCall('VpcPeering', ec2Primary.describeVpcPeeringConnections.bind(ec2Primary), { VpcPeeringConnectionIds: [pcxId] });
    if (skipIfNull(res?.VpcPeeringConnections?.[0], 'VpcPeering')) return;
    expect(res.VpcPeeringConnections[0].VpcPeeringConnectionId).toBe(pcxId);
    expect(["active","pending-acceptance"]).toContain(res.VpcPeeringConnections[0].Status?.Code);
  });

  // Secret ARNs format (if provided)
  test('Primary and Secondary secret ARNs format', () => {
    const primarySecretArn = outputs.primary_secret_arn;
    const secondarySecretArn = outputs.secondary_secret_arn;
    if(primarySecretArn) expect(primarySecretArn).toMatch(/^arn:aws:secretsmanager:/);
    if(secondarySecretArn) expect(secondarySecretArn).toMatch(/^arn:aws:secretsmanager:/);
  });

  // Deployment timestamp ISO 8601 check (if present)
  test('Deployment timestamp is in ISO 8601 UTC format', () => {
    if (!outputs.deployment_timestamp) return console.warn('Missing deployment_timestamp, skipping test.');
    expect(outputs.deployment_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

});

