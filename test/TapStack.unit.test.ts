import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('PostgreSQL to Aurora migration');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have VPC configuration parameters', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('String');
      expect(template.Parameters.PrivateSubnet1).toBeDefined();
      expect(template.Parameters.PrivateSubnet1.Type).toBe('String');
      expect(template.Parameters.PrivateSubnet2).toBeDefined();
      expect(template.Parameters.PrivateSubnet2.Type).toBe('String');
      expect(template.Parameters.PrivateSubnet3).toBeDefined();
      expect(template.Parameters.PrivateSubnet3.Type).toBe('String');
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.SourceDbHost).toBeDefined();
      expect(template.Parameters.SourceDbPort).toBeDefined();
      expect(template.Parameters.SourceDbPort.Default).toBe(5432);
      expect(template.Parameters.SourceDbName).toBeDefined();
      expect(template.Parameters.SourceDbPassword).toBeDefined();
      expect(template.Parameters.SourceDbPassword.NoEcho).toBe(true);
      expect(template.Parameters.TargetDbPassword).toBeDefined();
      expect(template.Parameters.TargetDbPassword.NoEcho).toBe(true);
    });

    test('should have DMS configuration parameters', () => {
      expect(template.Parameters.ReplicationInstanceClass).toBeDefined();
      expect(template.Parameters.ReplicationInstanceClass.Default).toBe(
        'dms.t3.medium'
      );
      expect(template.Parameters.DmsTaskTableMappings).toBeDefined();
      expect(template.Parameters.ReplicationLagThreshold).toBeDefined();
      expect(template.Parameters.ReplicationLagThreshold.Default).toBe(300);
    });
  });

  describe('Security Resources', () => {
    test('should have DMS security group', () => {
      const sgResource = template.Resources.DMSSecurityGroup;
      expect(sgResource).toBeDefined();
      expect(sgResource.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sgResource.Properties.GroupName).toBeDefined();
      expect(sgResource.Properties.GroupName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have Aurora security group', () => {
      const sgResource = template.Resources.AuroraDBSecurityGroup;
      expect(sgResource).toBeDefined();
      expect(sgResource.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sgResource.Properties.GroupName).toBeDefined();
      expect(sgResource.Properties.GroupName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('DMS security group should allow PostgreSQL traffic', () => {
      const sgResource = template.Resources.DMSSecurityGroup;
      const ingress = sgResource.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.length).toBeGreaterThan(0);
      const pgRule = ingress.find((rule: any) => rule.FromPort === 5432);
      expect(pgRule).toBeDefined();
      expect(pgRule.ToPort).toBe(5432);
      expect(pgRule.IpProtocol).toBe('tcp');
    });

    test('Aurora security group should reference DMS security group', () => {
      const sgResource = template.Resources.AuroraDBSecurityGroup;
      const ingress = sgResource.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.length).toBeGreaterThan(0);
      const pgRule = ingress[0];
      expect(pgRule.SourceSecurityGroupId).toBeDefined();
      expect(pgRule.SourceSecurityGroupId.Ref).toBe('DMSSecurityGroup');
    });
  });

  describe('SSM Parameters', () => {
    test('should have source database password in SSM', () => {
      const ssmResource = template.Resources.SourceDbPasswordParameter;
      expect(ssmResource).toBeDefined();
      expect(ssmResource.Type).toBe('AWS::SSM::Parameter');
      expect(ssmResource.Properties.Type).toBe('String');
      expect(ssmResource.Properties.Name['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have target database password in SSM', () => {
      const ssmResource = template.Resources.TargetDbPasswordParameter;
      expect(ssmResource).toBeDefined();
      expect(ssmResource.Type).toBe('AWS::SSM::Parameter');
      expect(ssmResource.Properties.Type).toBe('String');
      expect(ssmResource.Properties.Name['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Database Resources', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
      // SubnetIds is now a conditional (Fn::If), check that it has the expected structure
      if (subnetGroup.Properties.SubnetIds['Fn::If']) {
        const ifCondition = subnetGroup.Properties.SubnetIds['Fn::If'];
        expect(ifCondition).toBeDefined();
        expect(Array.isArray(ifCondition)).toBe(true);
        expect(ifCondition.length).toBe(3); // Condition, true array, false array
        // Check that both branches have 3 subnets
        expect(ifCondition[1].length).toBe(3); // True branch (created subnets)
        expect(ifCondition[2].length).toBe(3); // False branch (parameter subnets)
      } else {
        // Fallback: if it's still an array (backward compatibility)
        expect(Array.isArray(subnetGroup.Properties.SubnetIds)).toBe(true);
        expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
      }
    });

    test('should have Aurora cluster', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.DeletionPolicy).toBe('Snapshot');
      expect(cluster.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('Aurora cluster should enable IAM authentication', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EnableIAMDatabaseAuthentication).toBe(true);
    });

    test('Aurora cluster should enable CloudWatch logs export', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain(
        'postgresql'
      );
    });

    test('should have two Aurora instances', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
      expect(instance1.Type).toBe('AWS::RDS::DBInstance');
      expect(instance2.Type).toBe('AWS::RDS::DBInstance');
      expect(instance1.DeletionPolicy).toBe('Snapshot');
      expect(instance2.DeletionPolicy).toBe('Snapshot');
    });

    test('Aurora instances should reference cluster', () => {
      const instance1 = template.Resources.AuroraInstance1;
      expect(instance1.Properties.DBClusterIdentifier.Ref).toBe(
        'AuroraCluster'
      );
    });
  });

  describe('DMS Resources', () => {
    test('should have DMS replication subnet group', () => {
      const subnetGroup = template.Resources.DMSReplicationSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::DMS::ReplicationSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
      // SubnetIds is now a conditional (Fn::If), check that it has the expected structure
      if (subnetGroup.Properties.SubnetIds['Fn::If']) {
        const ifCondition = subnetGroup.Properties.SubnetIds['Fn::If'];
        expect(ifCondition).toBeDefined();
        expect(Array.isArray(ifCondition)).toBe(true);
        expect(ifCondition.length).toBe(3); // Condition, true array, false array
        // Check that both branches have 3 subnets
        expect(ifCondition[1].length).toBe(3); // True branch (created subnets)
        expect(ifCondition[2].length).toBe(3); // False branch (parameter subnets)
      } else {
        // Fallback: if it's still an array (backward compatibility)
        expect(Array.isArray(subnetGroup.Properties.SubnetIds)).toBe(true);
        expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
      }
      expect(
        subnetGroup.Properties.ReplicationSubnetGroupIdentifier['Fn::Sub']
      ).toContain('${EnvironmentSuffix}');
    });

    test('should have DMS replication instance', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::DMS::ReplicationInstance');
      expect(instance.Properties.MultiAZ).toBe(true);
      expect(instance.Properties.PubliclyAccessible).toBe(false);
      expect(instance.DeletionPolicy).toBe('Retain');
      expect(instance.UpdateReplacePolicy).toBe('Retain');
    });

    test('DMS replication instance should have appropriate storage', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance.Properties.AllocatedStorage).toBe(200);
    });

    test('should have DMS source endpoint', () => {
      const endpoint = template.Resources.DMSSourceEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('source');
      expect(endpoint.Properties.EngineName).toBe('postgres');
      expect(endpoint.Properties.SslMode).toBe('require');
      expect(endpoint.Properties.EndpointIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have DMS target endpoint', () => {
      const endpoint = template.Resources.DMSTargetEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::DMS::Endpoint');
      expect(endpoint.Properties.EndpointType).toBe('target');
      expect(endpoint.Properties.EngineName).toBe('aurora-postgresql');
      expect(endpoint.Properties.SslMode).toBe('require');
      expect(endpoint.Properties.EndpointIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('DMS target endpoint should reference Aurora cluster', () => {
      const endpoint = template.Resources.DMSTargetEndpoint;
      expect(endpoint.Properties.ServerName['Fn::GetAtt']).toBeDefined();
      expect(endpoint.Properties.ServerName['Fn::GetAtt'][0]).toBe(
        'AuroraCluster'
      );
    });

    test('should have DMS replication task', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::DMS::ReplicationTask');
      expect(task.Properties.MigrationType).toBe('full-load-and-cdc');
      expect(task.Properties.ReplicationTaskIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('DMS replication task should reference endpoints', () => {
      const task = template.Resources.DMSReplicationTask;
      expect(task.Properties.SourceEndpointArn.Ref).toBe('DMSSourceEndpoint');
      expect(task.Properties.TargetEndpointArn.Ref).toBe('DMSTargetEndpoint');
    });

    test('DMS replication task should have validation enabled', () => {
      const task = template.Resources.DMSReplicationTask;
      const settings = JSON.parse(task.Properties.ReplicationTaskSettings);
      expect(settings.ValidationSettings).toBeDefined();
      expect(settings.ValidationSettings.EnableValidation).toBe(true);
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNS topic for alerts', () => {
      const topic = template.Resources.ReplicationLagAlarmTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have CloudWatch alarm', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CDCLatencySource');
      expect(alarm.Properties.Namespace).toBe('AWS/DMS');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('CloudWatch alarm should reference SNS topic', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions[0].Ref).toBe(
        'ReplicationLagAlarmTopic'
      );
    });

    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Route 53 Resources', () => {
    test('should have private hosted zone', () => {
      const zone = template.Resources.Route53HostedZone;
      expect(zone).toBeDefined();
      expect(zone.Type).toBe('AWS::Route53::HostedZone');
      expect(zone.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('hosted zone should be private', () => {
      const zone = template.Resources.Route53HostedZone;
      expect(zone.Properties.VPCs).toBeDefined();
      expect(zone.Properties.VPCs.length).toBeGreaterThan(0);
    });

    test('should have weighted record for source', () => {
      const record = template.Resources.Route53WeightedRecord1;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Weight).toBe(100);
      expect(record.Properties.SetIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have weighted record for target', () => {
      const record = template.Resources.Route53WeightedRecord2;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Weight).toBe(0);
      expect(record.Properties.SetIdentifier['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('target record should reference Aurora cluster', () => {
      const record = template.Resources.Route53WeightedRecord2;
      expect(record.Properties.ResourceRecords[0]['Fn::GetAtt']).toBeDefined();
      expect(record.Properties.ResourceRecords[0]['Fn::GetAtt'][0]).toBe(
        'AuroraCluster'
      );
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all resource names should include EnvironmentSuffix', () => {
      const resources = template.Resources;
      const resourceKeys = Object.keys(resources);

      const resourcesRequiringNaming = resourceKeys.filter(key => {
        const resource = resources[key];
        const type = resource.Type;
        return [
          'AWS::EC2::SecurityGroup',
          'AWS::RDS::DBSubnetGroup',
          'AWS::RDS::DBCluster',
          'AWS::RDS::DBInstance',
          'AWS::DMS::ReplicationSubnetGroup',
          'AWS::DMS::ReplicationInstance',
          'AWS::DMS::Endpoint',
          'AWS::DMS::ReplicationTask',
          'AWS::SNS::Topic',
          'AWS::CloudWatch::Alarm',
          'AWS::CloudWatch::Dashboard',
          'AWS::Route53::HostedZone',
          'AWS::Route53::RecordSet',
        ].includes(type);
      });

      resourcesRequiringNaming.forEach(key => {
        const resource = resources[key];
        const hasEnvironmentSuffix = JSON.stringify(resource).includes(
          '${EnvironmentSuffix}'
        );
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe('Outputs', () => {
    test('should have DMS task ARN output', () => {
      expect(template.Outputs.DMSReplicationTaskArn).toBeDefined();
      expect(template.Outputs.DMSReplicationTaskArn.Export).toBeDefined();
    });

    test('should have Aurora cluster endpoint output', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.AuroraClusterEndpoint.Export).toBeDefined();
    });

    test('should have Route 53 hosted zone ID output', () => {
      expect(template.Outputs.Route53HostedZoneId).toBeDefined();
      expect(template.Outputs.Route53HostedZoneId.Export).toBeDefined();
    });

    test('all exports should include stack name', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        const output = outputs[key];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Dependencies', () => {
    test('DMSTargetEndpoint should depend on AuroraCluster', () => {
      const endpoint = template.Resources.DMSTargetEndpoint;
      // Dependency is enforced implicitly through GetAtt usage
      expect(endpoint.Properties.ServerName).toBeDefined();
      expect(endpoint.Properties.ServerName['Fn::GetAtt']).toBeDefined();
      expect(endpoint.Properties.ServerName['Fn::GetAtt'][0]).toBe('AuroraCluster');
    });

    test('DMSReplicationTask should depend on endpoints and instance', () => {
      const task = template.Resources.DMSReplicationTask;
      // Dependencies are enforced implicitly through Ref usage in ARN properties
      expect(task.Properties.ReplicationInstanceArn).toBeDefined();
      expect(task.Properties.ReplicationInstanceArn.Ref).toBe('DMSReplicationInstance');
      expect(task.Properties.SourceEndpointArn).toBeDefined();
      expect(task.Properties.SourceEndpointArn.Ref).toBe('DMSSourceEndpoint');
      expect(task.Properties.TargetEndpointArn).toBeDefined();
      expect(task.Properties.TargetEndpointArn.Ref).toBe('DMSTargetEndpoint');
    });
  });

  describe('Deletion Policies', () => {
    test('Aurora cluster should have Snapshot deletion policy', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Snapshot');
      expect(cluster.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('Aurora instances should have Snapshot deletion policy', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;
      expect(instance1.DeletionPolicy).toBe('Snapshot');
      expect(instance2.DeletionPolicy).toBe('Snapshot');
    });

    test('DMS replication instance should have Retain deletion policy', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance.DeletionPolicy).toBe('Retain');
      expect(instance.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('Security Best Practices', () => {
    test('passwords should have NoEcho enabled', () => {
      expect(template.Parameters.SourceDbPassword.NoEcho).toBe(true);
      expect(template.Parameters.TargetDbPassword.NoEcho).toBe(true);
    });

    test('passwords should be stored in SSM Parameter Store', () => {
      const sourceParam = template.Resources.SourceDbPasswordParameter;
      const targetParam = template.Resources.TargetDbPasswordParameter;
      expect(sourceParam.Properties.Type).toBe('String');
      expect(targetParam.Properties.Type).toBe('String');
    });

    test('DMS endpoints should require SSL', () => {
      const sourceEndpoint = template.Resources.DMSSourceEndpoint;
      const targetEndpoint = template.Resources.DMSTargetEndpoint;
      expect(sourceEndpoint.Properties.SslMode).toBe('require');
      expect(targetEndpoint.Properties.SslMode).toBe('require');
    });

    test('Aurora cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('DMS replication instance should not be publicly accessible', () => {
      const instance = template.Resources.DMSReplicationInstance;
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('Aurora instances should not be publicly accessible', () => {
      const instance1 = template.Resources.AuroraInstance1;
      const instance2 = template.Resources.AuroraInstance2;
      expect(instance1.Properties.PubliclyAccessible).toBe(false);
      expect(instance2.Properties.PubliclyAccessible).toBe(false);
    });
  });
});
