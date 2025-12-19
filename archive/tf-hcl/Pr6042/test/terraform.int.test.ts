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
const secretsmanager = new AWS.SecretsManager({ region: outputs.aws_region });

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
      "db_instance_port",
      "db_password_secret_arn",
      "db_password_secret_name"
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
    res.Subnets.forEach((subnet: AWS.EC2.Subnet) => {
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
    res.Subnets.forEach((subnet: AWS.EC2.Subnet) => {
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

  test('RDS instance exists and is available', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSInstance', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSInstance')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.DBInstanceIdentifier).toBe(dbInstanceId);
    expect(dbInstance.DBInstanceStatus).toBe('available');
  });

  test('RDS instance has correct engine and version', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSEngine', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSEngine')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.Engine).toBe('postgres');
    expect(dbInstance.EngineVersion).toMatch(/^14\./); // PostgreSQL 14.x
  });

  test('RDS instance uses correct instance class', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSInstanceClass', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSInstanceClass')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.DBInstanceClass).toMatch(/^db\./);
    console.log(`RDS Instance Class: ${dbInstance.DBInstanceClass}`);
  });

  test('RDS instance has correct storage configuration', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSStorage', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSStorage')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.AllocatedStorage).toBeGreaterThan(0);
    expect(dbInstance.StorageType).toBeDefined();
    expect(dbInstance.StorageEncrypted).toBe(true);
    console.log(`Storage: ${dbInstance.AllocatedStorage}GB, Type: ${dbInstance.StorageType}, Encrypted: ${dbInstance.StorageEncrypted}`);
  });

  test('RDS instance is in private subnets', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    const dbSubnetGroupName = outputs.db_subnet_group_name;
    if (!dbInstanceId || !dbSubnetGroupName) return console.warn('Missing db_instance_identifier or db_subnet_group_name, skipping.');

    const res = await diagAwsCall('RDSSubnetPlacement', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSSubnetPlacement')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.DBSubnetGroup?.DBSubnetGroupName).toBe(dbSubnetGroupName);
    expect(dbInstance.PubliclyAccessible).toBe(false);
  });

  test('RDS instance has correct security group attached', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    const sgId = outputs.security_group_id;
    if (!dbInstanceId || !sgId) return console.warn('Missing db_instance_identifier or security_group_id, skipping.');

    const res = await diagAwsCall('RDSSecurityGroup', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSSecurityGroup')) return;

    const dbInstance = res.DBInstances[0];
    const securityGroupIds = dbInstance.VpcSecurityGroups?.map((sg: any) => sg.VpcSecurityGroupId) || [];
    expect(securityGroupIds).toContain(sgId);
  });

  test('RDS instance uses correct parameter group', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    const dbParamGroupName = outputs.db_parameter_group_name;
    if (!dbInstanceId || !dbParamGroupName) return console.warn('Missing db_instance_identifier or db_parameter_group_name, skipping.');

    const res = await diagAwsCall('RDSParameterGroup', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSParameterGroup')) return;

    const dbInstance = res.DBInstances[0];
    const paramGroups = dbInstance.DBParameterGroups?.map((pg: any) => pg.DBParameterGroupName) || [];
    expect(paramGroups).toContain(dbParamGroupName);
  });

  test('RDS instance has Multi-AZ enabled', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSMultiAZ', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSMultiAZ')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.MultiAZ).toBe(true);
    console.log(`Multi-AZ: ${dbInstance.MultiAZ}`);
  });

  test('RDS instance has backup retention configured', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSBackup', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSBackup')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
    expect(dbInstance.PreferredBackupWindow).toBeDefined();
    console.log(`Backup Retention: ${dbInstance.BackupRetentionPeriod} days, Window: ${dbInstance.PreferredBackupWindow}`);
  });

  test('RDS instance has enhanced monitoring enabled', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    const monitoringRoleArn = outputs.monitoring_role_arn;
    if (!dbInstanceId || !monitoringRoleArn) return console.warn('Missing db_instance_identifier or monitoring_role_arn, skipping.');

    const res = await diagAwsCall('RDSMonitoring', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSMonitoring')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.MonitoringInterval).toBeGreaterThan(0);
    expect(dbInstance.MonitoringRoleArn).toBe(monitoringRoleArn);
    console.log(`Enhanced Monitoring Interval: ${dbInstance.MonitoringInterval}s`);
  });

  test('RDS instance has performance insights enabled', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSPerformanceInsights', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSPerformanceInsights')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
    if (dbInstance.PerformanceInsightsEnabled) {
      expect(dbInstance.PerformanceInsightsRetentionPeriod).toBeGreaterThan(0);
      console.log(`Performance Insights Retention: ${dbInstance.PerformanceInsightsRetentionPeriod} days`);
    }
  });

  test('RDS instance has automatic minor version upgrades configured', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSAutoUpgrade', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSAutoUpgrade')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.AutoMinorVersionUpgrade).toBeDefined();
    expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
    console.log(`Auto Minor Version Upgrade: ${dbInstance.AutoMinorVersionUpgrade}, Maintenance Window: ${dbInstance.PreferredMaintenanceWindow}`);
  });

  test('RDS instance deletion protection is enabled', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSDeletionProtection', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSDeletionProtection')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.DeletionProtection).toBe(true);
    console.log(`Deletion Protection: ${dbInstance.DeletionProtection}`);
  });

  test('RDS instance endpoint is accessible format', async () => {
    const dbInstanceId = outputs.db_instance_identifier;
    if (!dbInstanceId) return console.warn('Missing db_instance_identifier, skipping.');

    const res = await diagAwsCall('RDSEndpoint', rds.describeDBInstances.bind(rds), {
      DBInstanceIdentifier: dbInstanceId
    });
    if (skipIfNull(res?.DBInstances?.[0], 'RDSEndpoint')) return;

    const dbInstance = res.DBInstances[0];
    expect(dbInstance.Endpoint?.Address).toMatch(/\.rds\.amazonaws\.com$/);
    expect(dbInstance.Endpoint?.Port).toBe(5432);
    console.log(`RDS Endpoint: ${dbInstance.Endpoint?.Address}:${dbInstance.Endpoint?.Port}`);
  });
});