import fs from 'fs';
import path from 'path';

type Template = Record<string, any>;

describe('TapStack CloudFormation template (integration)', () => {
  let template: Template;
  let resources: Record<string, any>;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    resources = template.Resources;
  });

  test('builds a VPC and subnet topology for the database', () => {
    expect(resources.VPC.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    expect(resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

    ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach(name => {
      expect(resources[name].Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    ['PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation'].forEach(name => {
      expect(resources[name].Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    [
      'PrivateSubnet1RouteTableAssociation',
      'PrivateSubnet2RouteTableAssociation',
      'PrivateSubnet3RouteTableAssociation',
    ].forEach(name => {
      expect(resources[name].Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  test('primary cluster and instances stay in sync', () => {
    const cluster = resources.PrimaryDBCluster.Properties;
    const writer = resources.PrimaryDBInstanceWriter.Properties;
    const reader = resources.PrimaryDBInstanceReader.Properties;
    const globalCluster = resources.GlobalCluster.Properties;

    expect(cluster.EngineVersion).toBe(globalCluster.EngineVersion);
    expect(cluster.Engine).toBe(globalCluster.Engine);
    expect(cluster.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalCluster' });
    expect(cluster.DBClusterParameterGroupName).toEqual({ Ref: 'DBClusterParameterGroup' });
    expect(writer.DBClusterIdentifier).toEqual({ Ref: 'PrimaryDBCluster' });
    expect(reader.DBClusterIdentifier).toEqual({ Ref: 'PrimaryDBCluster' });
    expect(writer.Engine).toBe(cluster.Engine);
    expect(reader.Engine).toBe(cluster.Engine);
    expect(writer.DBParameterGroupName).toEqual({ Ref: 'DBParameterGroup' });
    expect(reader.DBParameterGroupName).toEqual({ Ref: 'DBParameterGroup' });
    expect(writer.MonitoringRoleArn).toEqual({ 'Fn::GetAtt': ['EnhancedMonitoringRole', 'Arn'] });
    expect(reader.MonitoringRoleArn).toEqual({ 'Fn::GetAtt': ['EnhancedMonitoringRole', 'Arn'] });
  });

  test('alarms watch the correct targets and publish to SNS', () => {
    const alarms = [
      resources.CPUAlarmWriter.Properties,
      resources.CPUAlarmReader.Properties,
      resources.DatabaseConnectionsAlarm.Properties,
      resources.FreeableMemoryAlarm.Properties,
      resources.ReplicationLagAlarm.Properties,
      resources.WriteIOPSAlarm.Properties,
      resources.DeadlocksAlarm.Properties,
    ];

    expect(alarms[0].Dimensions).toContainEqual({
      Name: 'DBInstanceIdentifier',
      Value: { Ref: 'PrimaryDBInstanceWriter' },
    });
    expect(alarms[1].Dimensions).toContainEqual({
      Name: 'DBInstanceIdentifier',
      Value: { Ref: 'PrimaryDBInstanceReader' },
    });
    expect(alarms[2].Dimensions).toContainEqual({
      Name: 'DBClusterIdentifier',
      Value: { Ref: 'PrimaryDBCluster' },
    });
    expect(alarms[3].Dimensions).toContainEqual({
      Name: 'DBInstanceIdentifier',
      Value: { Ref: 'PrimaryDBInstanceWriter' },
    });
    expect(alarms[4].Dimensions).toContainEqual({
      Name: 'DBClusterIdentifier',
      Value: { Ref: 'PrimaryDBCluster' },
    });

    alarms.forEach(alarm => {
      expect(alarm.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
    });
  });

  test('health checks are tagged per environment for failover automation', () => {
    const primary = resources.PrimaryHealthCheck.Properties;
    const secondary = resources.SecondaryHealthCheck.Properties;

    expect(primary.HealthCheckConfig.Type).toBe('CLOUDWATCH_METRIC');
    expect(primary.HealthCheckConfig.AlarmIdentifier.Name).toEqual({
      'Fn::Sub': 'trading-db-writer-cpu-high-${EnvironmentSuffix}',
    });
    expect(secondary.HealthCheckConfig.Type).toBe('CALCULATED');
    expect(secondary.HealthCheckConfig.HealthThreshold).toBe(1);

    [primary, secondary].forEach(healthCheck => {
      expect(JSON.stringify(healthCheck.HealthCheckTags)).toContain('${EnvironmentSuffix}');
    });
  });

  test('global identifiers flow through to outputs', () => {
    expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'VPC' });
    expect(template.Outputs.GlobalClusterIdentifier.Value).toEqual({ Ref: 'GlobalCluster' });
    expect(template.Outputs.PrimaryClusterEndpoint.Value).toEqual({
      'Fn::GetAtt': ['PrimaryDBCluster', 'Endpoint.Address'],
    });
    expect(template.Outputs.PrimaryClusterReadEndpoint.Value).toEqual({
      'Fn::GetAtt': ['PrimaryDBCluster', 'ReadEndpoint.Address'],
    });
    expect(template.Outputs.EnhancedMonitoringRoleArn.Value).toEqual({
      'Fn::GetAtt': ['EnhancedMonitoringRole', 'Arn'],
    });
  });
});
