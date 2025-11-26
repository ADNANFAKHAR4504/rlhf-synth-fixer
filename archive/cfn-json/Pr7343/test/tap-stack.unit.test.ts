import fs from 'fs';
import path from 'path';

type Template = Record<string, any>;

describe('TapStack CloudFormation template (unit)', () => {
  let template: Template;
  let resources: Record<string, any>;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const raw = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(raw);
    resources = template.Resources;
  });

  test('has a valid CloudFormation skeleton', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Description).toMatch(/Aurora Global Database/i);
    ['Parameters', 'Resources', 'Outputs'].forEach(section => {
      expect(template[section]).toBeDefined();
    });
  });

  test('exposes required parameters with safe defaults', () => {
    const params = template.Parameters;

    expect(params.EnvironmentSuffix.Default).toBe('dev');
    expect(params.DBUsername.Default).toBe('admin');
    expect(params.DBUsername.NoEcho).toBe(true);
    expect(params.DBPassword.NoEcho).toBe(true);
    expect(params.DBPassword.MinLength).toBeGreaterThanOrEqual(8);
    expect(params.VpcCidr.Default).toBe('10.0.0.0/16');
    expect(params.DomainName.Default).toContain('.');
  });

  test('includes core database and networking resources', () => {
    const types = Object.values(resources).map((res: any) => res.Type);
    [
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::KMS::Key',
      'AWS::KMS::Alias',
      'AWS::RDS::GlobalCluster',
      'AWS::RDS::DBCluster',
      'AWS::RDS::DBInstance',
      'AWS::EC2::SecurityGroup',
      'AWS::RDS::DBSubnetGroup',
      'AWS::SNS::Topic',
      'AWS::CloudWatch::Alarm',
      'AWS::Route53::HealthCheck',
    ].forEach(type => expect(types).toContain(type));
  });

  test('encrypts storage with a customer managed KMS key', () => {
    const globalCluster = resources.GlobalCluster.Properties;
    const primaryCluster = resources.PrimaryDBCluster.Properties;

    expect(globalCluster.StorageEncrypted).toBe(true);
    expect(globalCluster.DeletionProtection).toBe(false);
    expect(primaryCluster.StorageEncrypted).toBe(true);
    expect(primaryCluster.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    expect(primaryCluster.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalCluster' });
  });

  test('configures networking boundaries', () => {
    const subnetGroup = resources.DBSubnetGroup.Properties;
    const securityGroup = resources.DBSecurityGroup.Properties;
    const vpc = resources.VPC.Properties;

    expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    expect(subnetGroup.SubnetIds).toEqual(
      expect.arrayContaining([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
        { Ref: 'PrivateSubnet3' },
      ])
    );

    expect(securityGroup.SecurityGroupIngress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          FromPort: 3306,
          ToPort: 3306,
          CidrIp: '10.0.0.0/16',
        }),
      ])
    );
  });

  test('adds monitoring alarms with SNS actions', () => {
    const { CPUAlarmWriter, DatabaseConnectionsAlarm, ReplicationLagAlarm } = resources;

    expect(CPUAlarmWriter.Properties.Threshold).toBe(80);
    expect(DatabaseConnectionsAlarm.Properties.Threshold).toBe(100);
    expect(ReplicationLagAlarm.Properties.Threshold).toBe(1000);

    [CPUAlarmWriter, DatabaseConnectionsAlarm, ReplicationLagAlarm].forEach(alarm => {
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
    });
  });

  test('exports key identifiers and endpoints', () => {
    const outputs = template.Outputs;
    const expected = [
      'GlobalClusterIdentifier',
      'PrimaryClusterEndpoint',
      'PrimaryClusterReadEndpoint',
      'PrimaryClusterPort',
      'KMSKeyId',
      'KMSKeyArn',
      'SNSTopicArn',
      'DBSecurityGroupId',
      'VpcId',
      'CloudWatchDashboardName',
      'EnhancedMonitoringRoleArn',
      'PrimaryHealthCheckId',
      'SecondaryHealthCheckId',
    ];

    expected.forEach(output => expect(outputs[output]).toBeDefined());
    expect(outputs.PrimaryClusterEndpoint.Value).toEqual({
      'Fn::GetAtt': ['PrimaryDBCluster', 'Endpoint.Address'],
    });
    expect(outputs.PrimaryClusterReadEndpoint.Value).toEqual({
      'Fn::GetAtt': ['PrimaryDBCluster', 'ReadEndpoint.Address'],
    });
  });
});
