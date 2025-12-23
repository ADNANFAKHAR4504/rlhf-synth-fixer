import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the CloudFormation template
    // If YAML exists, it will be converted to JSON by the script
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('TAP Stack');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toContain('Environment suffix');
    });

    test('should have DBPasswordSecretArn parameter', () => {
      expect(template.Parameters.DBPasswordSecretArn).toBeDefined();
      expect(template.Parameters.DBPasswordSecretArn.Type).toBe('String');
      expect(template.Parameters.DBPasswordSecretArn.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('should have CreateDBPasswordSecret condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.CreateDBPasswordSecret).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have VPC resources', () => {
      expect(template.Resources.PrimaryVPC).toBeDefined();
      expect(template.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have subnets', () => {
      expect(template.Resources.PrimarySubnet1).toBeDefined();
      expect(template.Resources.PrimarySubnet2).toBeDefined();
      expect(template.Resources.PrimarySubnet3).toBeDefined();
    });

    test('should have Aurora Global Cluster', () => {
      expect(template.Resources.GlobalCluster).toBeDefined();
      expect(template.Resources.GlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    test('should have Aurora Primary Cluster', () => {
      expect(template.Resources.PrimaryDBCluster).toBeDefined();
      expect(template.Resources.PrimaryDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('should have Aurora Primary Instance', () => {
      expect(template.Resources.PrimaryDBInstance).toBeDefined();
      expect(template.Resources.PrimaryDBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have Security Group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have KMS Key for encryption', () => {
      expect(template.Resources.DBKMSKey).toBeDefined();
      expect(template.Resources.DBKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have Route53 Health Check', () => {
      expect(template.Resources.HealthCheck).toBeDefined();
      expect(template.Resources.HealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('should have CloudWatch Alarms', () => {
      expect(template.Resources.DBCPUAlarm).toBeDefined();
      expect(template.Resources.DBConnectionsAlarm).toBeDefined();
    });

    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have conditional DBPasswordSecret', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBPasswordSecret.Condition).toBe('CreateDBPasswordSecret');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('PrimaryVPC');
    });

    test('should have Aurora endpoints outputs', () => {
      expect(template.Outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(template.Outputs.PrimaryClusterReaderEndpoint).toBeDefined();
    });

    test('should have Global Cluster output', () => {
      expect(template.Outputs.GlobalClusterIdentifier).toBeDefined();
      expect(template.Outputs.GlobalClusterIdentifier.Value.Ref).toBe('GlobalCluster');
    });

    test('should have Health Check output', () => {
      expect(template.Outputs.HealthCheckId).toBeDefined();
      expect(template.Outputs.HealthCheckId.Value.Ref).toBe('HealthCheck');
    });

    test('should have exported names', () => {
      const outputs = Object.keys(template.Outputs);
      outputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have encryption enabled on Aurora cluster', () => {
      const globalCluster = template.Resources.GlobalCluster;
      expect(globalCluster.Properties.StorageEncrypted).toBe(true);

      const primaryCluster = template.Resources.PrimaryDBCluster;
      expect(primaryCluster.Properties.StorageEncrypted).toBe(true);
      expect(primaryCluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have proper security group configuration', () => {
      const dbSecurityGroup = template.Resources.DBSecurityGroup;
      expect(dbSecurityGroup.Properties.GroupDescription).toBeDefined();
      expect(dbSecurityGroup.Properties.SecurityGroupIngress).toBeDefined();
    });

    test('should use Secrets Manager for database password', () => {
      const primaryCluster = template.Resources.PrimaryDBCluster;
      const masterPassword = primaryCluster.Properties.MasterUserPassword;
      expect(masterPassword['Fn::If']).toBeDefined();
      // Check that password resolves from Secrets Manager
      expect(JSON.stringify(masterPassword)).toContain('resolve:secretsmanager');
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multiple availability zones', () => {
      const subnet1 = template.Resources.PrimarySubnet1;
      const subnet2 = template.Resources.PrimarySubnet2;
      const subnet3 = template.Resources.PrimarySubnet3;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet3).toBeDefined();

      // Check different AZ selection
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(subnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('should have global cluster configuration', () => {
      const globalCluster = template.Resources.GlobalCluster;
      expect(globalCluster.Properties.Engine).toBe('aurora-mysql');
      expect(globalCluster.Properties.EngineVersion).toContain('aurora');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have CPU utilization alarm', () => {
      const cpuAlarm = template.Resources.DBCPUAlarm;
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Threshold).toBe(80);
      expect(cpuAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have database connections alarm', () => {
      const connectionsAlarm = template.Resources.DBConnectionsAlarm;
      expect(connectionsAlarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(connectionsAlarm.Properties.Threshold).toBe(50);
    });

    test('should have health check monitoring CloudWatch metrics', () => {
      const healthCheck = template.Resources.HealthCheck;
      expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('CLOUDWATCH_METRIC');
      expect(healthCheck.Properties.HealthCheckConfig.AlarmIdentifier).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging strategy', () => {
      const resourcesToCheck = [
        'PrimaryVPC',
        'PrimarySubnet1',
        'DBSecurityGroup',
        'DBSubnetGroup',
        'PrimaryDBCluster',
        'PrimaryDBInstance'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Resources).not.toBeUndefined();
    });

    test('should have proper resource dependencies', () => {
      // Health check depends on alarm
      expect(template.Resources.HealthCheck.DependsOn).toBe('DBCPUAlarm');

      // Route depends on gateway attachment
      expect(template.Resources.PrimaryRoute.DependsOn).toBe('AttachPrimaryGateway');
    });
  });
});