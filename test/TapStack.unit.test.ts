/**
 * Unit tests for TapStack CloudFormation template
 */

const fs = require('fs');
const path = require('path');

describe('TapStack Template', () => {
  let template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
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
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.MinLength).toBe('1');
      expect(template.Parameters.DBMasterUsername.MaxLength).toBe('16');
    });

    test('should have DBMasterPassword parameter', () => {
      expect(template.Parameters.DBMasterPassword).toBeDefined();
      expect(template.Parameters.DBMasterPassword.Type).toBe('String');
      expect(template.Parameters.DBMasterPassword.NoEcho).toBe(true);
    });

    test('should have EnableMultiAZ parameter', () => {
      expect(template.Parameters.EnableMultiAZ).toBeDefined();
      expect(template.Parameters.EnableMultiAZ.Type).toBe('String');
      expect(template.Parameters.EnableMultiAZ.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have LambdaImageUri parameter', () => {
      expect(template.Parameters.LambdaImageUri).toBeDefined();
      expect(template.Parameters.LambdaImageUri.Type).toBe('String');
    });

    test('should have TemplatesBucketName parameter', () => {
      expect(template.Parameters.TemplatesBucketName).toBeDefined();
      expect(template.Parameters.TemplatesBucketName.Type).toBe('String');
    });
  });

  describe('Conditions', () => {
    test('should have IsProd condition', () => {
      expect(template.Conditions.IsProd).toBeDefined();
      expect(template.Conditions.IsProd['Fn::Equals']).toBeDefined();
    });

    test('IsProd condition should reference Environment parameter', () => {
      const condition = template.Conditions.IsProd['Fn::Equals'];
      expect(condition[0]).toEqual({ Ref: 'Environment' });
      expect(condition[1]).toBe('prod');
    });
  });

  describe('Nested Stacks', () => {
    test('should have NetworkStack resource', () => {
      expect(template.Resources.NetworkStack).toBeDefined();
      expect(template.Resources.NetworkStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('NetworkStack should reference TemplatesBucketName', () => {
      const templateURL = template.Resources.NetworkStack.Properties.TemplateURL;
      expect(templateURL['Fn::Sub']).toContain('${TemplatesBucketName}');
      expect(templateURL['Fn::Sub']).toContain('NetworkStack.json');
    });

    test('NetworkStack should pass EnvironmentSuffix parameter', () => {
      const params = template.Resources.NetworkStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have DatabaseStack resource', () => {
      expect(template.Resources.DatabaseStack).toBeDefined();
      expect(template.Resources.DatabaseStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('DatabaseStack should not have explicit DependsOn', () => {
      expect(template.Resources.DatabaseStack.DependsOn).toBeUndefined();
    });

    test('DatabaseStack should reference NetworkStack outputs', () => {
      const params = template.Resources.DatabaseStack.Properties.Parameters;
      expect(params.PrivateSubnet1Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet1Id']);
      expect(params.DatabaseSecurityGroupId['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.DatabaseSecurityGroupId']);
    });

    test('should have ComputeStack resource', () => {
      expect(template.Resources.ComputeStack).toBeDefined();
      expect(template.Resources.ComputeStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('ComputeStack should not have explicit DependsOn', () => {
      expect(template.Resources.ComputeStack.DependsOn).toBeUndefined();
    });

    test('ComputeStack should reference both NetworkStack and DatabaseStack outputs', () => {
      const params = template.Resources.ComputeStack.Properties.Parameters;
      expect(params.PrivateSubnet1Id['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.PrivateSubnet1Id']);
      expect(params.DBClusterEndpoint['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterEndpoint']);
    });

    test('should have MonitoringStack resource', () => {
      expect(template.Resources.MonitoringStack).toBeDefined();
      expect(template.Resources.MonitoringStack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('MonitoringStack should not have explicit DependsOn', () => {
      expect(template.Resources.MonitoringStack.DependsOn).toBeUndefined();
    });

    test('MonitoringStack should reference DatabaseStack and ComputeStack outputs', () => {
      const params = template.Resources.MonitoringStack.Properties.Parameters;
      expect(params.DBClusterId['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterId']);
      expect(params.ValidatorLambdaName['Fn::GetAtt']).toEqual(['ComputeStack', 'Outputs.ValidatorLambdaName']);
    });
  });

  describe('Root Level Resources', () => {
    test('should have SessionTable DynamoDB table', () => {
      expect(template.Resources.SessionTable).toBeDefined();
      expect(template.Resources.SessionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SessionTable should use EnvironmentSuffix in name', () => {
      const tableName = template.Resources.SessionTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have AuditLogsBucket S3 bucket', () => {
      expect(template.Resources.AuditLogsBucket).toBeDefined();
      expect(template.Resources.AuditLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AuditLogsBucket should have unique name with AccountId and Region', () => {
      const bucketName = template.Resources.AuditLogsBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(bucketName['Fn::Sub']).toContain('${AWS::Region}');
    });
  });

  describe('Outputs', () => {
    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('should have VpcId output', () => {
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.VpcId.Value['Fn::GetAtt']).toEqual(['NetworkStack', 'Outputs.VpcId']);
    });

    test('should have DBClusterEndpoint output', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
      expect(template.Outputs.DBClusterEndpoint.Value['Fn::GetAtt']).toEqual(['DatabaseStack', 'Outputs.DBClusterEndpoint']);
    });

    test('should have ValidatorLambdaArn output', () => {
      expect(template.Outputs.ValidatorLambdaArn).toBeDefined();
      expect(template.Outputs.ValidatorLambdaArn.Value['Fn::GetAtt']).toEqual(['ComputeStack', 'Outputs.ValidatorLambdaArn']);
    });

    test('should have SessionTableName output', () => {
      expect(template.Outputs.SessionTableName).toBeDefined();
      expect(template.Outputs.SessionTableName.Value).toEqual({ Ref: 'SessionTable' });
    });

    test('should have AuditLogsBucketName output', () => {
      expect(template.Outputs.AuditLogsBucketName).toBeDefined();
      expect(template.Outputs.AuditLogsBucketName.Value).toEqual({ Ref: 'AuditLogsBucket' });
    });

    test('should have AuditLogsBucketArn output', () => {
      expect(template.Outputs.AuditLogsBucketArn).toBeDefined();
      expect(template.Outputs.AuditLogsBucketArn.Value['Fn::GetAtt']).toEqual(['AuditLogsBucket', 'Arn']);
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(typeof template.Outputs[outputKey].Description).toBe('string');
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Tags', () => {
    test('all nested stacks should have tags', () => {
      const nestedStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      nestedStacks.forEach(stackName => {
        expect(template.Resources[stackName].Properties.Tags).toBeDefined();
        expect(Array.isArray(template.Resources[stackName].Properties.Tags)).toBe(true);
      });
    });

    test('nested stacks should have ManagedBy tag', () => {
      const nestedStacks = ['NetworkStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      nestedStacks.forEach(stackName => {
        const tags = template.Resources[stackName].Properties.Tags;
        const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
        expect(managedByTag).toBeDefined();
        expect(managedByTag.Value).toBe('CloudFormation');
      });
    });
  });

  describe('Timeout Configuration', () => {
    test('NetworkStack should have appropriate timeout', () => {
      expect(template.Resources.NetworkStack.Properties.TimeoutInMinutes).toBe(10);
    });

    test('DatabaseStack should have appropriate timeout', () => {
      expect(template.Resources.DatabaseStack.Properties.TimeoutInMinutes).toBe(30);
    });

    test('ComputeStack should have appropriate timeout', () => {
      expect(template.Resources.ComputeStack.Properties.TimeoutInMinutes).toBe(15);
    });

    test('MonitoringStack should have appropriate timeout', () => {
      expect(template.Resources.MonitoringStack.Properties.TimeoutInMinutes).toBe(5);
    });
  });
});
