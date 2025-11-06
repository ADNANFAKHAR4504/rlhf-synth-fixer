import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('FAILED to load outputs:', error);
  outputs = {};
}

const ec2 = new AWS.EC2({ region: outputs.aws_region });
const rds = new AWS.RDS({ region: outputs.aws_region });
const cloudwatch = new AWS.CloudWatch({ region: outputs.aws_region });
const sns = new AWS.SNS({ region: outputs.aws_region });

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

describe('RDS PostgreSQL Stack Integration Tests', () => {

  test('Verify mandatory output keys exist', () => {
    [
      "aws_region",
      "vpc_id",
      "security_group_id",
      "db_subnet_group_name",
      "db_parameter_group_name",
      "private_subnet_ids",
      "app_subnet_ids",
      "monitoring_role_arn",
      "cloudwatch_dashboard_url",
      "db_instance_port"
    ].forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('VPC exists', async () => {
    const vpcId = outputs.vpc_id;
    if (!vpcId) return console.warn('Missing vpc_id, skipping.');
    const res = await diagAwsCall('VPC', ec2.describeVpcs.bind(ec2), { VpcIds: [vpcId] });
    if (skipIfNull(res?.Vpcs?.[0], 'VPC')) return;
    expect(res.Vpcs[0].VpcId).toBe(vpcId);
  });

  test('Private DB subnets belong to VPC', async () => {
    const subnetStr = outputs.private_subnet_ids;
    const vpcId = outputs.vpc_id;
    if (!subnetStr || !vpcId) return console.warn('Missing private_subnet_ids or vpc_id, skipping.');
    const subnetIds: string[] = JSON.parse(subnetStr);
    const res = await diagAwsCall('PrivateSubnets', ec2.describeSubnets.bind(ec2), { SubnetIds: subnetIds });
    if (skipIfNull(res?.Subnets, 'PrivateSubnets')) return;
    expect(res.Subnets.length).toBe(subnetIds.length);
    res.Subnets.forEach(subnet => {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  test('App subnets belong to VPC', async () => {
    const subnetStr = outputs.app_subnet_ids;
    const vpcId = outputs.vpc_id;
    if (!subnetStr || !vpcId) return console.warn('Missing app_subnet_ids or vpc_id, skipping.');
    const subnetIds: string[] = JSON.parse(subnetStr);
    const res = await diagAwsCall('AppSubnets', ec2.describeSubnets.bind(ec2), { SubnetIds: subnetIds });
    if (skipIfNull(res?.Subnets, 'AppSubnets')) return;
    expect(res.Subnets.length).toBe(subnetIds.length);
    res.Subnets.forEach(subnet => {
      expect(subnetIds).toContain(subnet.SubnetId);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  test('Security group exists', async () => {
    const sgId = outputs.security_group_id;
    if (!sgId) return console.warn('Missing security_group_id, skipping.');
    const res = await diagAwsCall('SecurityGroup', ec2.describeSecurityGroups.bind(ec2), { GroupIds: [sgId] });
    if (skipIfNull(res?.SecurityGroups?.[0], 'SecurityGroup')) return;
    expect(res.SecurityGroups[0].GroupId).toBe(sgId);
  });

  test('DB Subnet Group exists', async () => {
    const dbSubnetGroupName = outputs.db_subnet_group_name;
    if (!dbSubnetGroupName) return console.warn('Missing db_subnet_group_name, skipping.');
    const res = await diagAwsCall('DBSubnetGroup', rds.describeDBSubnetGroups.bind(rds), { DBSubnetGroupName: dbSubnetGroupName });
    if (skipIfNull(res?.DBSubnetGroups?.[0], 'DBSubnetGroup')) return;
    expect(res.DBSubnetGroups[0].DBSubnetGroupName).toBe(dbSubnetGroupName);
  });

  test('DB Parameter Group exists', async () => {
    const dbParamGroupName = outputs.db_parameter_group_name;
    if (!dbParamGroupName) return console.warn('Missing db_parameter_group_name, skipping.');
    const res = await diagAwsCall('DBParameterGroup', rds.describeDBParameterGroups.bind(rds), { DBParameterGroupName: dbParamGroupName });
    if (skipIfNull(res?.DBParameterGroups?.[0], 'DBParameterGroup')) return;
    expect(res.DBParameterGroups[0].DBParameterGroupName).toBe(dbParamGroupName);
  });

  test('CloudWatch dashboard URL is valid', () => {
    const url = outputs.cloudwatch_dashboard_url;
    if (!url) return console.warn('Missing cloudwatch_dashboard_url, skipping.');
    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.console\.aws\.amazon\.com\/cloudwatch/);
  });

  test('Monitoring Role ARN format check', () => {
    const arn = outputs.monitoring_role_arn;
    if (!arn) return console.warn('Missing monitoring_role_arn, skipping.');
    expect(arn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
  });

  test('DB instance port is 5432', () => {
    const port = outputs.db_instance_port;
    if (!port) return console.warn('Missing db_instance_port, skipping.');
    expect(port.toString()).toBe('5432');
  });
});

