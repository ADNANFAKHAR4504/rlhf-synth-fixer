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

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.AllowedValues).toBeDefined();
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

  describe('Aurora Database Resources', () => {
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

    test('should have DBCluster resource', () => {
      expect(template.Resources.DBCluster).toBeDefined();
      expect(template.Resources.DBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('DBCluster does not explicitly depend on GlobalCluster (implicit dependency via Ref)', () => {
      expect(template.Resources.DBCluster.DependsOn).toBeUndefined();
    });

    test('DBCluster should reference GlobalCluster', () => {
      const props = template.Resources.DBCluster.Properties;
      expect(props.GlobalClusterIdentifier).toEqual({ Ref: 'GlobalCluster' });
    });

    test('DBCluster should have master credentials from Secrets Manager', () => {
      const props = template.Resources.DBCluster.Properties;
      expect(props.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(props.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });

    test('DBCluster should NOT have DeletionProtection', () => {
      const props = template.Resources.DBCluster.Properties;
      expect(props.DeletionProtection).toBeUndefined();
    });


  });

  describe('Database Instances', () => {
    test('should have DBInstance1', () => {
      expect(template.Resources.DBInstance1).toBeDefined();
      expect(template.Resources.DBInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have DBInstance2', () => {
      expect(template.Resources.DBInstance2).toBeDefined();
      expect(template.Resources.DBInstance2.Type).toBe('AWS::RDS::DBInstance');
    });

    test('instances should use environmentSuffix in identifiers', () => {
      const instance1Id = template.Resources.DBInstance1.Properties.DBInstanceIdentifier;
      expect(instance1Id['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('instances should NOT be publicly accessible', () => {
      expect(template.Resources.DBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.DBInstance2.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have DBSubnetGroup with actual subnet references', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

      const subnetIds = subnetGroup.Properties.SubnetIds;
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBe(3);
      expect(subnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
      expect(subnetIds[2]).toEqual({ Ref: 'PrivateSubnet3' });
    });

    test('DB subnet group should use environmentSuffix in name', () => {
      const name = template.Resources.DBSubnetGroup.Properties.DBSubnetGroupName;
      expect(name['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('should have security group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
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
    test('should have ClusterCPUAlarm', () => {
      expect(template.Resources.ClusterCPUAlarm).toBeDefined();
      expect(template.Resources.ClusterCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Route 53 health check', () => {
      expect(template.Resources.ClusterHealthCheck).toBeDefined();
      expect(template.Resources.ClusterHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });
  });

  describe('Outputs', () => {
    test('should output GlobalClusterIdentifier', () => {
      expect(template.Outputs.GlobalClusterIdentifier).toBeDefined();
      expect(template.Outputs.GlobalClusterIdentifier.Value).toEqual({ Ref: 'GlobalCluster' });
    });

    test('should output ClusterEndpoint', () => {
      expect(template.Outputs.ClusterEndpoint).toBeDefined();
      expect(template.Outputs.ClusterEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should output ClusterReadEndpoint', () => {
      expect(template.Outputs.ClusterReadEndpoint).toBeDefined();
      expect(template.Outputs.ClusterReadEndpoint.Value['Fn::GetAtt']).toBeDefined();
    });

    test('should output DatabaseSecretArn', () => {
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn.Value).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('should output VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
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

    test('RDS cluster should NOT have DeletionProtection enabled', () => {
      const props = template.Resources.DBCluster.Properties;
      expect(props.DeletionProtection).not.toBe(true);
    });
  });

  describe('environmentSuffix Usage', () => {
    test('all resource names should include environmentSuffix', () => {
      const resourcesWithNames = [
        'VPC',
        'DBSubnetGroup',
        'DBSecurityGroup',
        'DatabaseSecret',
        'GlobalCluster',
        'DBCluster',
        'DBInstance1',
        'DBInstance2'
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
