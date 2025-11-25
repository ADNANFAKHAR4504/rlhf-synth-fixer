import { TemplateLoader } from '../lib/template-loader';

describe('TemplateLoader Unit Tests', () => {
  let loader: TemplateLoader;

  beforeAll(() => {
    loader = new TemplateLoader('TapStack.json');
  });

  describe('Template Loading', () => {
    test('should load template successfully', () => {
      const template = loader.loadTemplate();
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBeDefined();
    });

    test('should cache loaded template', () => {
      const template1 = loader.loadTemplate();
      const template2 = loader.loadTemplate();
      expect(template1).toBe(template2);
    });

    test('should throw error for invalid template path', () => {
      const invalidLoader = new TemplateLoader('nonexistent.json');
      expect(() => invalidLoader.loadTemplate()).toThrow();
    });
  });

  describe('Resource Type Operations', () => {
    test('should get all resource types', () => {
      const types = loader.getResourceTypes();
      expect(types).toBeDefined();
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('AWS::EC2::SecurityGroup');
      expect(types).toContain('AWS::RDS::DBCluster');
      expect(types).toContain('AWS::DMS::ReplicationInstance');
    });

    test('should get resources by type', () => {
      const securityGroups = loader.getResourcesByType(
        'AWS::EC2::SecurityGroup'
      );
      expect(Object.keys(securityGroups).length).toBeGreaterThan(0);
      expect(securityGroups.DMSSecurityGroup).toBeDefined();
      expect(securityGroups.AuroraDBSecurityGroup).toBeDefined();
    });

    test('should return empty object for non-existent type', () => {
      const resources = loader.getResourcesByType('AWS::NonExistent::Type');
      expect(Object.keys(resources).length).toBe(0);
    });

    test('should count resources by type', () => {
      const sgCount = loader.countResourcesByType('AWS::EC2::SecurityGroup');
      expect(sgCount).toBe(2);

      const clusterCount = loader.countResourcesByType('AWS::RDS::DBCluster');
      expect(clusterCount).toBe(1);

      const instanceCount = loader.countResourcesByType('AWS::RDS::DBInstance');
      expect(instanceCount).toBe(2);
    });
  });

  describe('Environment Suffix Validation', () => {
    test('should validate all resources have environment suffix', () => {
      const result = loader.validateEnvironmentSuffix();
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('should return validation result with correct structure', () => {
      const result = loader.validateEnvironmentSuffix();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('violations');
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });

  describe('Deletion Policy Validation', () => {
    test('should validate deletion policies', () => {
      const result = loader.validateDeletionPolicies();
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('should identify resources requiring snapshot policy', () => {
      const result = loader.validateDeletionPolicies();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('violations');
    });

    test('Aurora cluster should have correct deletion policy', () => {
      const clusters = loader.getResourcesByType('AWS::RDS::DBCluster');
      const clusterKeys = Object.keys(clusters);
      expect(clusterKeys.length).toBeGreaterThan(0);

      clusterKeys.forEach(key => {
        expect(clusters[key].DeletionPolicy).toBe('Snapshot');
        expect(clusters[key].UpdateReplacePolicy).toBe('Snapshot');
      });
    });

    test('RDS instances should have correct deletion policy', () => {
      const instances = loader.getResourcesByType('AWS::RDS::DBInstance');
      const instanceKeys = Object.keys(instances);
      expect(instanceKeys.length).toBeGreaterThan(0);

      instanceKeys.forEach(key => {
        expect(instances[key].DeletionPolicy).toBe('Snapshot');
        expect(instances[key].UpdateReplacePolicy).toBe('Snapshot');
      });
    });

    test('DMS replication instance should have correct deletion policy', () => {
      const instances = loader.getResourcesByType(
        'AWS::DMS::ReplicationInstance'
      );
      const instanceKeys = Object.keys(instances);
      expect(instanceKeys.length).toBeGreaterThan(0);

      instanceKeys.forEach(key => {
        expect(instances[key].DeletionPolicy).toBe('Snapshot');
        expect(instances[key].UpdateReplacePolicy).toBe('Snapshot');
      });
    });
  });

  describe('Security Validation', () => {
    test('should validate security best practices', () => {
      const result = loader.validateSecurity();
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('should check password parameters have NoEcho', () => {
      const parameters = loader.getParameters();
      expect(parameters.SourceDbPassword.NoEcho).toBe(true);
      expect(parameters.TargetDbPassword.NoEcho).toBe(true);
    });

    test('should verify Aurora encryption is enabled', () => {
      const clusters = loader.getResourcesByType('AWS::RDS::DBCluster');
      Object.values(clusters).forEach((cluster: any) => {
        expect(cluster.Properties.StorageEncrypted).toBe(true);
      });
    });

    test('should verify DMS endpoints require SSL', () => {
      const endpoints = loader.getResourcesByType('AWS::DMS::Endpoint');
      Object.values(endpoints).forEach((endpoint: any) => {
        expect(endpoint.Properties.SslMode).toBe('require');
      });
    });

    test('should verify instances are not publicly accessible', () => {
      const rdsInstances = loader.getResourcesByType('AWS::RDS::DBInstance');
      Object.values(rdsInstances).forEach((instance: any) => {
        expect(instance.Properties.PubliclyAccessible).toBe(false);
      });

      const dmsInstances = loader.getResourcesByType(
        'AWS::DMS::ReplicationInstance'
      );
      Object.values(dmsInstances).forEach((instance: any) => {
        expect(instance.Properties.PubliclyAccessible).toBe(false);
      });
    });
  });

  describe('Output Validation', () => {
    test('should validate all outputs have exports', () => {
      const result = loader.validateOutputs();
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('should get all outputs', () => {
      const outputs = loader.getOutputs();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      expect(outputs.DMSReplicationTaskArn).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.Route53HostedZoneId).toBeDefined();
    });

    test('all ARN and ID outputs should have export names with stack name', () => {
      const outputs = loader.getOutputs();
      const urlOutputs = ['CloudWatchDashboardUrl'];

      Object.entries(outputs).forEach(([key, output]: [string, any]) => {
        if (!urlOutputs.includes(key)) {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });

    test('URL outputs can be informational without exports', () => {
      const outputs = loader.getOutputs();
      expect(outputs.CloudWatchDashboardUrl).toBeDefined();
      expect(outputs.CloudWatchDashboardUrl.Value).toBeDefined();
    });
  });

  describe('Template Structure Validation', () => {
    test('should validate template structure', () => {
      const result = loader.validateStructure();
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should have CloudFormation version', () => {
      const template = loader.loadTemplate();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      const template = loader.loadTemplate();
      expect(template.Description).toBeDefined();
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have parameters section', () => {
      const template = loader.loadTemplate();
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      const template = loader.loadTemplate();
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      const template = loader.loadTemplate();
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameter Operations', () => {
    test('should get all parameters', () => {
      const parameters = loader.getParameters();
      expect(Object.keys(parameters).length).toBeGreaterThan(0);
      expect(parameters.EnvironmentSuffix).toBeDefined();
      expect(parameters.VpcId).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter with default', () => {
      const parameters = loader.getParameters();
      expect(parameters.EnvironmentSuffix.Type).toBe('String');
      expect(parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have all required network parameters', () => {
      const parameters = loader.getParameters();
      expect(parameters.VpcId).toBeDefined();
      expect(parameters.PrivateSubnet1).toBeDefined();
      expect(parameters.PrivateSubnet2).toBeDefined();
      expect(parameters.PrivateSubnet3).toBeDefined();
    });

    test('should have all required database parameters', () => {
      const parameters = loader.getParameters();
      expect(parameters.SourceDbHost).toBeDefined();
      expect(parameters.SourceDbPort).toBeDefined();
      expect(parameters.SourceDbName).toBeDefined();
      expect(parameters.SourceDbPassword).toBeDefined();
      expect(parameters.TargetDbPassword).toBeDefined();
    });
  });

  describe('Resource Counting', () => {
    test('should count security groups correctly', () => {
      expect(loader.countResourcesByType('AWS::EC2::SecurityGroup')).toBe(2);
    });

    test('should count DMS resources correctly', () => {
      expect(loader.countResourcesByType('AWS::DMS::ReplicationInstance')).toBe(
        1
      );
      expect(loader.countResourcesByType('AWS::DMS::Endpoint')).toBe(2);
      expect(loader.countResourcesByType('AWS::DMS::ReplicationTask')).toBe(1);
      expect(
        loader.countResourcesByType('AWS::DMS::ReplicationSubnetGroup')
      ).toBe(1);
    });

    test('should count database resources correctly', () => {
      expect(loader.countResourcesByType('AWS::RDS::DBCluster')).toBe(1);
      expect(loader.countResourcesByType('AWS::RDS::DBInstance')).toBe(2);
      expect(loader.countResourcesByType('AWS::RDS::DBSubnetGroup')).toBe(1);
    });

    test('should count monitoring resources correctly', () => {
      expect(loader.countResourcesByType('AWS::SNS::Topic')).toBe(1);
      expect(loader.countResourcesByType('AWS::CloudWatch::Alarm')).toBe(1);
      expect(loader.countResourcesByType('AWS::CloudWatch::Dashboard')).toBe(1);
    });

    test('should count Route 53 resources correctly', () => {
      expect(loader.countResourcesByType('AWS::Route53::HostedZone')).toBe(1);
      expect(loader.countResourcesByType('AWS::Route53::RecordSet')).toBe(2);
    });

    test('should count SSM parameters correctly', () => {
      expect(loader.countResourcesByType('AWS::SSM::Parameter')).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty resource type search', () => {
      const resources = loader.getResourcesByType('');
      expect(Object.keys(resources).length).toBe(0);
    });

    test('should handle resources with special characters in type', () => {
      const resources = loader.getResourcesByType('AWS::EC2::SecurityGroup');
      expect(resources).toBeDefined();
    });

    test('should return consistent results on multiple calls', () => {
      const count1 = loader.countResourcesByType('AWS::RDS::DBCluster');
      const count2 = loader.countResourcesByType('AWS::RDS::DBCluster');
      expect(count1).toBe(count2);
    });
  });

  describe('Comprehensive Validation', () => {
    test('should validate template is deployable', () => {
      const structure = loader.validateStructure();
      const suffix = loader.validateEnvironmentSuffix();
      const deletion = loader.validateDeletionPolicies();
      const security = loader.validateSecurity();
      const outputs = loader.validateOutputs();

      expect(structure.valid).toBe(true);
      expect(suffix.valid).toBe(true);
      expect(deletion.valid).toBe(true);
      expect(security.valid).toBe(true);
      expect(outputs.valid).toBe(true);
    });

    test('should have all required resource types', () => {
      const types = loader.getResourceTypes();
      const requiredTypes = [
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBCluster',
        'AWS::RDS::DBInstance',
        'AWS::DMS::ReplicationInstance',
        'AWS::DMS::Endpoint',
        'AWS::DMS::ReplicationTask',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
        'AWS::Route53::HostedZone',
      ];

      requiredTypes.forEach(type => {
        expect(types).toContain(type);
      });
    });

    test('should have reasonable resource counts', () => {
      const totalResources = loader.getResourceTypes().length;
      expect(totalResources).toBeGreaterThan(15);
      expect(totalResources).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    test('should handle template parsing errors gracefully', () => {
      const invalidLoader = new TemplateLoader('nonexistent.json');

      expect(() => {
        invalidLoader.getResourceTypes();
      }).toThrow();
    });

    test('should provide meaningful error messages', () => {
      const invalidLoader = new TemplateLoader('nonexistent.json');

      try {
        invalidLoader.validateStructure();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Additional Validation Coverage', () => {
    test('should validate DMS task settings are well-formed', () => {
      const tasks = loader.getResourcesByType('AWS::DMS::ReplicationTask');
      Object.values(tasks).forEach((task: any) => {
        expect(task.Properties.ReplicationTaskSettings).toBeDefined();
        const settings = JSON.parse(task.Properties.ReplicationTaskSettings);
        expect(settings.ValidationSettings).toBeDefined();
        expect(settings.Logging).toBeDefined();
      });
    });

    test('should have proper subnet group configurations', () => {
      const dbSubnetGroups = loader.getResourcesByType(
        'AWS::RDS::DBSubnetGroup'
      );
      const dmsSubnetGroups = loader.getResourcesByType(
        'AWS::DMS::ReplicationSubnetGroup'
      );

      Object.values(dbSubnetGroups).forEach((group: any) => {
        expect(group.Properties.SubnetIds).toBeDefined();
        expect(group.Properties.SubnetIds.length).toBe(3);
      });

      Object.values(dmsSubnetGroups).forEach((group: any) => {
        expect(group.Properties.SubnetIds).toBeDefined();
        expect(group.Properties.SubnetIds.length).toBe(3);
      });
    });

    test('should validate security group rules', () => {
      const securityGroups = loader.getResourcesByType(
        'AWS::EC2::SecurityGroup'
      );

      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.VpcId).toBeDefined();
      });
    });

    test('should validate CloudWatch resources are properly configured', () => {
      const alarms = loader.getResourcesByType('AWS::CloudWatch::Alarm');
      const dashboards = loader.getResourcesByType(
        'AWS::CloudWatch::Dashboard'
      );

      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.MetricName).toBeDefined();
        expect(alarm.Properties.Namespace).toBeDefined();
        expect(alarm.Properties.Statistic).toBeDefined();
        expect(alarm.Properties.ComparisonOperator).toBeDefined();
      });

      Object.values(dashboards).forEach((dashboard: any) => {
        expect(dashboard.Properties.DashboardName).toBeDefined();
        expect(dashboard.Properties.DashboardBody).toBeDefined();
      });
    });

    test('should validate Route 53 configuration', () => {
      const hostedZones = loader.getResourcesByType('AWS::Route53::HostedZone');
      const recordSets = loader.getResourcesByType('AWS::Route53::RecordSet');

      Object.values(hostedZones).forEach((zone: any) => {
        expect(zone.Properties.Name).toBeDefined();
        expect(zone.Properties.VPCs).toBeDefined();
        expect(zone.Properties.VPCs.length).toBeGreaterThan(0);
      });

      Object.values(recordSets).forEach((record: any) => {
        expect(record.Properties.Name).toBeDefined();
        expect(record.Properties.Type).toBeDefined();
        expect(record.Properties.SetIdentifier).toBeDefined();
        expect(record.Properties.Weight).toBeDefined();
      });
    });
  });
});
