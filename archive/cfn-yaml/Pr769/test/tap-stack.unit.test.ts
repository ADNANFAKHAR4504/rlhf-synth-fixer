import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Integration Tests', () => {
    test('TODO: Add integration tests for deployed infrastructure', async () => {
      // Placeholder for integration tests
      // These tests should verify the deployed infrastructure functionality
      // Including but not limited to:
      // - VPC connectivity
      // - Database connectivity
      // - Load balancer functionality
      // - Auto scaling behavior
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready web application infrastructure with ALB, Auto Scaling, RDS PostgreSQL, and comprehensive security'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'VpcCidr',
        'AllowedCidrBlock',
        'InstanceType',
        'DBInstanceClass',
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('VpcCidr parameter should have correct properties', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.Description).toBe('CIDR block for VPC');
    });

    test('InstanceType parameter should have allowed values', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.Type).toBe('String');
      expect(instanceTypeParam.Default).toBe('t3.medium');
      expect(instanceTypeParam.AllowedValues).toContain('t3.micro');
      expect(instanceTypeParam.AllowedValues).toContain('t3.small');
      expect(instanceTypeParam.AllowedValues).toContain('t3.medium');
      expect(instanceTypeParam.AllowedValues).toContain('t3.large');
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.ProdAppVPC).toBeDefined();
    });

    test('should have Internet Gateway resource', () => {
      expect(template.Resources.ProdAppInternetGateway).toBeDefined();
    });

    test('should have database resource', () => {
      expect(template.Resources.ProdAppDatabase).toBeDefined();
    });

    test('ProdAppVPC should be of correct type', () => {
      const vpc = template.Resources.ProdAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('ProdAppDatabase should have correct engine settings', () => {
      const db = template.Resources.ProdAppDatabase;
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.EngineVersion).toBe('15.13');
    });

    test('ProdAppDatabase should have correct deletion policies', () => {
      const db = template.Resources.ProdAppDatabase;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });

    test('ProdAppDatabase should have proper identifier with environment suffix', () => {
      const db = template.Resources.ProdAppDatabase;
      expect(db.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'prodapp-postgresql-db-${EnvironmentSuffix}',
      });
    });

    test('Auto Scaling Group should have proper settings', () => {
      const asg = template.Resources.ProdAppAutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'DatabaseEndpoint',
        'AutoScalingGroupName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'ProdAppVPC' });
      expect(output.Export).toBeDefined();
    });

    test('AutoScalingGroupName output should be correct', () => {
      const output = template.Outputs.AutoScalingGroupName;
      expect(output.Description).toBe('Auto Scaling Group Name');
      expect(output.Value).toEqual({ Ref: 'ProdAppAutoScalingGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ASG-Name-${EnvironmentSuffix}',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have multiple resources for a production-ready application', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have exactly five parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('database name should follow naming convention with environment suffix', () => {
      const db = template.Resources.ProdAppDatabase;
      const dbIdentifier = db.Properties.DBInstanceIdentifier;

      expect(dbIdentifier).toEqual({
        'Fn::Sub': 'prodapp-postgresql-db-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention with environment suffix', () => {
      expect(template.Outputs.AutoScalingGroupName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ASG-Name-${EnvironmentSuffix}',
      });

      expect(template.Outputs.DatabaseEndpoint.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DB-Endpoint-${EnvironmentSuffix}',
      });
    });
  });

  describe('Security Features', () => {
    test('database should have storage encryption enabled', () => {
      expect(
        template.Resources.ProdAppDatabase.Properties.StorageEncrypted
      ).toBe(true);
    });

    test('database should have enhanced monitoring enabled', () => {
      expect(
        template.Resources.ProdAppDatabase.Properties.EnablePerformanceInsights
      ).toBe(true);
      expect(
        template.Resources.ProdAppDatabase.Properties.MonitoringInterval
      ).toBe(60);
      expect(
        template.Resources.ProdAppDatabase.Properties.MonitoringRoleArn
      ).toBeDefined();
    });

    test('security group for database should be defined', () => {
      expect(template.Resources.ProdAppDatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.ProdAppDatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });
  });

  describe('High Availability Features', () => {
    test('database should have multi-AZ enabled', () => {
      expect(template.Resources.ProdAppDatabase.Properties.MultiAZ).toBe(true);
    });

    test('VPC should have multiple subnets across availability zones', () => {
      expect(template.Resources.ProdAppPublicSubnet1).toBeDefined();
      expect(template.Resources.ProdAppPublicSubnet2).toBeDefined();
      expect(template.Resources.ProdAppPrivateSubnet1).toBeDefined();
      expect(template.Resources.ProdAppPrivateSubnet2).toBeDefined();
    });

    test('auto scaling group should have proper scaling policies', () => {
      expect(template.Resources.ProdAppScaleUpPolicy).toBeDefined();
      expect(template.Resources.ProdAppScaleDownPolicy).toBeDefined();
      expect(template.Resources.ProdAppCPUAlarmHigh).toBeDefined();
      expect(template.Resources.ProdAppCPUAlarmLow).toBeDefined();
    });
  });
});
