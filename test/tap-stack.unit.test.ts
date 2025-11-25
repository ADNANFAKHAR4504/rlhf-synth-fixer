import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Aurora Global Database');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
      expect(template.Parameters.environmentSuffix.Type).toBe('String');
      expect(template.Parameters.environmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have PrimaryRegion parameter', () => {
      expect(template.Parameters.PrimaryRegion).toBeDefined();
      expect(template.Parameters.PrimaryRegion.Type).toBe('String');
      expect(template.Parameters.PrimaryRegion.Default).toBe('us-east-1');
    });

    test('should have SecondaryRegion parameter', () => {
      expect(template.Parameters.SecondaryRegion).toBeDefined();
      expect(template.Parameters.SecondaryRegion.Type).toBe('String');
      expect(template.Parameters.SecondaryRegion.Default).toBe('us-east-2');
    });

    test('should have DatabaseName parameter', () => {
      expect(template.Parameters.DatabaseName).toBeDefined();
      expect(template.Parameters.DatabaseName.Type).toBe('String');
    });

    test('should have MasterUsername parameter', () => {
      expect(template.Parameters.MasterUsername).toBeDefined();
      expect(template.Parameters.MasterUsername.Type).toBe('String');
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.AllowedValues).toBeDefined();
    });
  });

  describe('Aurora Global Database Resources', () => {
    test('should have GlobalCluster resource', () => {
      expect(template.Resources.GlobalCluster).toBeDefined();
      expect(template.Resources.GlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    test('GlobalCluster should use aurora-mysql engine', () => {
      const props = template.Resources.GlobalCluster.Properties;
      expect(props.Engine).toBe('aurora-mysql');
      expect(props.StorageEncrypted).toBe(true);
    });

    test('GlobalCluster should use environmentSuffix in identifier', () => {
      const identifier = template.Resources.GlobalCluster.Properties.GlobalClusterIdentifier;
      expect(identifier['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('should have PrimaryDBCluster resource', () => {
      expect(template.Resources.PrimaryDBCluster).toBeDefined();
      expect(template.Resources.PrimaryDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('PrimaryDBCluster should depend on GlobalCluster', () => {
      expect(template.Resources.PrimaryDBCluster.DependsOn).toBe('GlobalCluster');
    });

    test('PrimaryDBCluster should reference GlobalCluster', () => {
      const props = template.Resources.PrimaryDBCluster.Properties;
      expect(props.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalCluster' });
    });

    test('PrimaryDBCluster should have master credentials from Secrets Manager', () => {
      const props = template.Resources.PrimaryDBCluster.Properties;
      expect(props.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(props.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });

    test('PrimaryDBCluster should NOT have DeletionProtection', () => {
      const props = template.Resources.PrimaryDBCluster.Properties;
      expect(props.DeletionProtection).toBeUndefined();
    });

    test('should have SecondaryDBCluster resource', () => {
      expect(template.Resources.SecondaryDBCluster).toBeDefined();
      expect(template.Resources.SecondaryDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('SecondaryDBCluster should depend on both GlobalCluster and PrimaryDBCluster', () => {
      const deps = template.Resources.SecondaryDBCluster.DependsOn;
      expect(deps).toContain('GlobalCluster');
      expect(deps).toContain('PrimaryDBCluster');
    });

    test('SecondaryDBCluster should reference GlobalCluster', () => {
      const props = template.Resources.SecondaryDBCluster.Properties;
      expect(props.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalCluster' });
    });

    test('SecondaryDBCluster should NOT have master credentials (read replica)', () => {
      const props = template.Resources.SecondaryDBCluster.Properties;
      expect(props.MasterUsername).toBeUndefined();
      expect(props.MasterUserPassword).toBeUndefined();
    });
  });

  describe('Database Instances', () => {
    test('should have PrimaryDBInstance1', () => {
      expect(template.Resources.PrimaryDBInstance1).toBeDefined();
      expect(template.Resources.PrimaryDBInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have PrimaryDBInstance2', () => {
      expect(template.Resources.PrimaryDBInstance2).toBeDefined();
      expect(template.Resources.PrimaryDBInstance2.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have SecondaryDBInstance1', () => {
      expect(template.Resources.SecondaryDBInstance1).toBeDefined();
      expect(template.Resources.SecondaryDBInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('instances should use environmentSuffix in identifiers', () => {
      const instance1Id = template.Resources.PrimaryDBInstance1.Properties.DBInstanceIdentifier;
      expect(instance1Id['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('instances should NOT be publicly accessible', () => {
      expect(template.Resources.PrimaryDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.SecondaryDBInstance1.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have PrimaryVPC', () => {
      expect(template.Resources.PrimaryVPC).toBeDefined();
      expect(template.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have SecondaryVPC', () => {
      expect(template.Resources.SecondaryVPC).toBeDefined();
      expect(template.Resources.SecondaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have 3 primary private subnets', () => {
      expect(template.Resources.PrimaryPrivateSubnet1).toBeDefined();
      expect(template.Resources.PrimaryPrivateSubnet2).toBeDefined();
      expect(template.Resources.PrimaryPrivateSubnet3).toBeDefined();
    });

    test('should have 3 secondary private subnets', () => {
      expect(template.Resources.SecondaryPrivateSubnet1).toBeDefined();
      expect(template.Resources.SecondaryPrivateSubnet2).toBeDefined();
      expect(template.Resources.SecondaryPrivateSubnet3).toBeDefined();
    });

    test('should have PrimaryDBSubnetGroup with actual subnet references', () => {
      const subnetGroup = template.Resources.PrimaryDBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

      const subnetIds = subnetGroup.Properties.SubnetIds;
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);
      expect(subnetIds[0]).toEqual({ Ref: 'PrimaryPrivateSubnet1' });
      expect(subnetIds[1]).toEqual({ Ref: 'PrimaryPrivateSubnet2' });
      expect(subnetIds[2]).toEqual({ Ref: 'PrimaryPrivateSubnet3' });
    });

    test('should have SecondaryDBSubnetGroup with actual subnet references', () => {
      const subnetGroup = template.Resources.SecondaryDBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

      const subnetIds = subnetGroup.Properties.SubnetIds;
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);
      expect(subnetIds[0]).toEqual({ Ref: 'SecondaryPrivateSubnet1' });
      expect(subnetIds[1]).toEqual({ Ref: 'SecondaryPrivateSubnet2' });
      expect(subnetIds[2]).toEqual({ Ref: 'SecondaryPrivateSubnet3' });
    });

    test('DB subnet groups should use environmentSuffix in names', () => {
      const primaryName = template.Resources.PrimaryDBSubnetGroup.Properties.DBSubnetGroupName;
      const secondaryName = template.Resources.SecondaryDBSubnetGroup.Properties.DBSubnetGroupName;

      expect(primaryName['Fn::Sub']).toContain('${environmentSuffix}');
      expect(secondaryName['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('should have security groups for both regions', () => {
      expect(template.Resources.PrimaryDBSecurityGroup).toBeDefined();
      expect(template.Resources.SecondaryDBSecurityGroup).toBeDefined();

      expect(template.Resources.PrimaryDBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.SecondaryDBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Secrets Manager', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should generate password', () => {
      const props = template.Resources.DatabaseSecret.Properties;
      expect(props.GenerateSecretString).toBeDefined();
      expect(props.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(props.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('DatabaseSecret should use environmentSuffix in name', () => {
      const name = template.Resources.DatabaseSecret.Properties.Name;
      expect(name['Fn::Sub']).toContain('${environmentSuffix}');
    });
  });

  describe('Monitoring and Health Checks', () => {
    test('should have ReplicationLagAlarm', () => {
      expect(template.Resources.ReplicationLagAlarm).toBeDefined();
      expect(template.Resources.ReplicationLagAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ReplicationLagAlarm should monitor AuroraGlobalDBReplicationLag', () => {
      const props = template.Resources.ReplicationLagAlarm.Properties;
      expect(props.MetricName).toBe('AuroraGlobalDBReplicationLag');
      expect(props.Namespace).toBe('AWS/RDS');
      expect(props.Threshold).toBe(1000); // 1 second in milliseconds
    });

    test('should have CPU alarms for both clusters', () => {
      expect(template.Resources.PrimaryClusterCPUAlarm).toBeDefined();
      expect(template.Resources.SecondaryClusterCPUAlarm).toBeDefined();
    });

    test('should have Route 53 health check', () => {
      expect(template.Resources.PrimaryClusterHealthCheck).toBeDefined();
      expect(template.Resources.PrimaryClusterHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });
  });

  describe('Outputs', () => {
    test('should output GlobalClusterIdentifier', () => {
      expect(template.Outputs.GlobalClusterIdentifier).toBeDefined();
      expect(template.Outputs.GlobalClusterIdentifier.Value).toEqual({ Ref: 'GlobalCluster' });
    });

    test('should output PrimaryClusterEndpoint', () => {
      expect(template.Outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(template.Outputs.PrimaryClusterEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should output SecondaryClusterEndpoint', () => {
      expect(template.Outputs.SecondaryClusterEndpoint).toBeDefined();
      expect(template.Outputs.SecondaryClusterEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should output DatabaseSecretArn', () => {
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn.Value).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('should output VPC IDs', () => {
      expect(template.Outputs.PrimaryVPCId).toBeDefined();
      expect(template.Outputs.SecondaryVPCId).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Deletion Policy and Protection', () => {
    test('should NOT have Retain deletion policy on any resource', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('RDS clusters should NOT have DeletionProtection enabled', () => {
      const primaryProps = template.Resources.PrimaryDBCluster.Properties;
      const secondaryProps = template.Resources.SecondaryDBCluster.Properties;

      expect(primaryProps.DeletionProtection).not.toBe(true);
      expect(secondaryProps.DeletionProtection).not.toBe(true);
    });
  });

  describe('environmentSuffix Usage', () => {
    test('all resource names should include environmentSuffix', () => {
      const resourcesWithNames = [
        'PrimaryVPC',
        'SecondaryVPC',
        'PrimaryDBSubnetGroup',
        'SecondaryDBSubnetGroup',
        'PrimaryDBSecurityGroup',
        'SecondaryDBSecurityGroup',
        'DatabaseSecret',
        'GlobalCluster',
        'PrimaryDBCluster',
        'SecondaryDBCluster',
        'PrimaryDBInstance1',
        'PrimaryDBInstance2',
        'SecondaryDBInstance1'
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const properties = resource.Properties;

        // Find name-like properties
        const nameProps = Object.keys(properties).filter(key =>
          key.includes('Name') || key.includes('Identifier')
        );

        nameProps.forEach(nameProp => {
          const nameValue = properties[nameProp];
          if (nameValue && typeof nameValue === 'object' && nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('${environmentSuffix}');
          }
        });
      });
    });
  });
});
