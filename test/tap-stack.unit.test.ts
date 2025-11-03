import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Multi-Environment Infrastructure', () => {
  let template: any;

  beforeAll(() => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('multi-environment');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter with allowed values', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(3);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    test('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
    });

    test('should have PrivateSubnetIds parameter', () => {
      expect(template.Parameters.PrivateSubnetIds).toBeDefined();
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
    });

    test('should have PublicSubnetIds parameter', () => {
      expect(template.Parameters.PublicSubnetIds).toBeDefined();
      expect(template.Parameters.PublicSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
    });

    test('should have ProjectName parameter with default', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('app-migration');
    });

    test('should have CostCenter parameter with default', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Type).toBe('String');
      expect(template.Parameters.CostCenter.Default).toBe('engineering');
    });

    test('should have HostedZoneId parameter', () => {
      expect(template.Parameters.HostedZoneId).toBeDefined();
      expect(template.Parameters.HostedZoneId.Type).toBe('String');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
    });

    test('should have NestedStacksBucketName parameter', () => {
      expect(template.Parameters.NestedStacksBucketName).toBeDefined();
      expect(template.Parameters.NestedStacksBucketName.Type).toBe('String');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('should have dev environment configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig).toBeDefined();
      expect(devConfig.ECSTaskCPU).toBe('512');
      expect(devConfig.ECSTaskMemory).toBe('1024');
      expect(devConfig.ECSDesiredCount).toBe('1');
      expect(devConfig.DBInstanceClass).toBe('db.t3.micro');
      expect(devConfig.DBAllocatedStorage).toBe('20');
      expect(devConfig.DBMultiAZ).toBe('false');
      expect(devConfig.LogRetentionDays).toBe('7');
      expect(devConfig.EnableTerminationProtection).toBe('false');
    });

    test('should have staging environment configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig).toBeDefined();
      expect(stagingConfig.ECSTaskCPU).toBe('1024');
      expect(stagingConfig.ECSTaskMemory).toBe('2048');
      expect(stagingConfig.ECSDesiredCount).toBe('2');
      expect(stagingConfig.DBInstanceClass).toBe('db.t3.small');
      expect(stagingConfig.DBAllocatedStorage).toBe('50');
      expect(stagingConfig.DBMultiAZ).toBe('false');
      expect(stagingConfig.LogRetentionDays).toBe('30');
    });

    test('should have prod environment configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig).toBeDefined();
      expect(prodConfig.ECSTaskCPU).toBe('2048');
      expect(prodConfig.ECSTaskMemory).toBe('4096');
      expect(prodConfig.ECSDesiredCount).toBe('3');
      expect(prodConfig.DBInstanceClass).toBe('db.r5.large');
      expect(prodConfig.DBAllocatedStorage).toBe('100');
      expect(prodConfig.DBMultiAZ).toBe('true');
      expect(prodConfig.LogRetentionDays).toBe('90');
      expect(prodConfig.EnableTerminationProtection).toBe('true');
    });
  });

  describe('Nested Stacks', () => {
    test('should have SecretsStack nested stack', () => {
      expect(template.Resources.SecretsStack).toBeDefined();
      expect(template.Resources.SecretsStack.Type).toBe('AWS::CloudFormation::Stack');
      expect(template.Resources.SecretsStack.Properties.TemplateURL).toBeDefined();
      expect(template.Resources.SecretsStack.Properties.TemplateURL['Fn::Sub']).toContain('secrets-stack.json');
    });

    test('SecretsStack should pass correct parameters', () => {
      const params = template.Resources.SecretsStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.EnvironmentName).toEqual({ Ref: 'EnvironmentName' });
      expect(params.ProjectName).toEqual({ Ref: 'ProjectName' });
    });

    test('should have NetworkingStack nested stack', () => {
      expect(template.Resources.NetworkingStack).toBeDefined();
      expect(template.Resources.NetworkingStack.Type).toBe('AWS::CloudFormation::Stack');
      expect(template.Resources.NetworkingStack.Properties.TemplateURL['Fn::Sub']).toContain('networking-stack.json');
    });

    test('NetworkingStack should pass correct parameters', () => {
      const params = template.Resources.NetworkingStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.EnvironmentName).toEqual({ Ref: 'EnvironmentName' });
      expect(params.VpcId).toEqual({ Ref: 'VpcId' });
      expect(params.PublicSubnetIds).toBeDefined();
      expect(params.ProjectName).toEqual({ Ref: 'ProjectName' });
      expect(params.CostCenter).toEqual({ Ref: 'CostCenter' });
    });

    test('should have DatabaseStack nested stack', () => {
      expect(template.Resources.DatabaseStack).toBeDefined();
      expect(template.Resources.DatabaseStack.Type).toBe('AWS::CloudFormation::Stack');
      expect(template.Resources.DatabaseStack.Properties.TemplateURL['Fn::Sub']).toContain('database-stack.json');
    });

    test('DatabaseStack should pass correct parameters', () => {
      const params = template.Resources.DatabaseStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.EnvironmentName).toEqual({ Ref: 'EnvironmentName' });
      expect(params.PrivateSubnetIds).toBeDefined();
      expect(params.DBSecurityGroupId).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.DBSecurityGroupId']
      });
      expect(params.DBInstanceClass).toBeDefined();
      expect(params.DBAllocatedStorage).toBeDefined();
      expect(params.DBMultiAZ).toBeDefined();
      expect(params.DBMasterPasswordSecretArn).toEqual({
        'Fn::GetAtt': ['SecretsStack', 'Outputs.DBMasterPasswordSecretArn']
      });
    });

    test('DatabaseStack should use EnvironmentConfig mappings', () => {
      const params = template.Resources.DatabaseStack.Properties.Parameters;
      expect(params.DBInstanceClass).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'DBInstanceClass']
      });
      expect(params.DBAllocatedStorage).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'DBAllocatedStorage']
      });
      expect(params.DBMultiAZ).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'DBMultiAZ']
      });
    });

    test('should have ComputeStack nested stack', () => {
      expect(template.Resources.ComputeStack).toBeDefined();
      expect(template.Resources.ComputeStack.Type).toBe('AWS::CloudFormation::Stack');
      expect(template.Resources.ComputeStack.Properties.TemplateURL['Fn::Sub']).toContain('compute-stack.json');
    });

    test('ComputeStack should pass correct parameters', () => {
      const params = template.Resources.ComputeStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.EnvironmentName).toEqual({ Ref: 'EnvironmentName' });
      expect(params.PrivateSubnetIds).toBeDefined();
      expect(params.ECSSecurityGroupId).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ECSSecurityGroupId']
      });
      expect(params.ALBTargetGroupArn).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBTargetGroupArn']
      });
      expect(params.DBEndpoint).toEqual({
        'Fn::GetAtt': ['DatabaseStack', 'Outputs.DBEndpoint']
      });
      expect(params.DBMasterPasswordSecretArn).toEqual({
        'Fn::GetAtt': ['SecretsStack', 'Outputs.DBMasterPasswordSecretArn']
      });
      expect(params.AppSecretsArn).toEqual({
        'Fn::GetAtt': ['SecretsStack', 'Outputs.AppSecretsArn']
      });
    });

    test('ComputeStack should use EnvironmentConfig mappings', () => {
      const params = template.Resources.ComputeStack.Properties.Parameters;
      expect(params.ECSTaskCPU).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'ECSTaskCPU']
      });
      expect(params.ECSTaskMemory).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'ECSTaskMemory']
      });
      expect(params.ECSDesiredCount).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'ECSDesiredCount']
      });
      expect(params.LogRetentionDays).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'LogRetentionDays']
      });
    });

    test('should have MonitoringStack nested stack', () => {
      expect(template.Resources.MonitoringStack).toBeDefined();
      expect(template.Resources.MonitoringStack.Type).toBe('AWS::CloudFormation::Stack');
      expect(template.Resources.MonitoringStack.Properties.TemplateURL['Fn::Sub']).toContain('monitoring-stack.json');
    });

    test('MonitoringStack should pass correct parameters', () => {
      const params = template.Resources.MonitoringStack.Properties.Parameters;
      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.EnvironmentName).toEqual({ Ref: 'EnvironmentName' });
      expect(params.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
      expect(params.DomainName).toEqual({ Ref: 'DomainName' });
      expect(params.ALBDNSName).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBDNSName']
      });
      expect(params.ALBHostedZoneId).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBHostedZoneId']
      });
      expect(params.ECSClusterName).toEqual({
        'Fn::GetAtt': ['ComputeStack', 'Outputs.ECSClusterName']
      });
      expect(params.ECSServiceName).toEqual({
        'Fn::GetAtt': ['ComputeStack', 'Outputs.ECSServiceName']
      });
    });
  });

  describe('Resource Tagging', () => {
    const expectedTags = [
      { Key: 'Environment', Value: { Ref: 'EnvironmentName' } },
      { Key: 'Project', Value: { Ref: 'ProjectName' } },
      { Key: 'CostCenter', Value: { Ref: 'CostCenter' } },
      { Key: 'ManagedBy', Value: 'CloudFormation' }
    ];

    test('SecretsStack should have correct tags', () => {
      const tags = template.Resources.SecretsStack.Properties.Tags;
      expect(tags).toEqual(expectedTags);
    });

    test('NetworkingStack should have correct tags', () => {
      const tags = template.Resources.NetworkingStack.Properties.Tags;
      expect(tags).toEqual(expectedTags);
    });

    test('DatabaseStack should have correct tags', () => {
      const tags = template.Resources.DatabaseStack.Properties.Tags;
      expect(tags).toEqual(expectedTags);
    });

    test('ComputeStack should have correct tags', () => {
      const tags = template.Resources.ComputeStack.Properties.Tags;
      expect(tags).toEqual(expectedTags);
    });

    test('MonitoringStack should have correct tags', () => {
      const tags = template.Resources.MonitoringStack.Properties.Tags;
      expect(tags).toEqual(expectedTags);
    });
  });

  describe('Stack Dependencies', () => {
    test('DatabaseStack should depend on NetworkingStack and SecretsStack via GetAtt', () => {
      const dbParams = template.Resources.DatabaseStack.Properties.Parameters;
      expect(dbParams.DBSecurityGroupId).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.DBSecurityGroupId']
      });
      expect(dbParams.DBMasterPasswordSecretArn).toEqual({
        'Fn::GetAtt': ['SecretsStack', 'Outputs.DBMasterPasswordSecretArn']
      });
    });

    test('ComputeStack should depend on NetworkingStack, DatabaseStack, and SecretsStack via GetAtt', () => {
      const computeParams = template.Resources.ComputeStack.Properties.Parameters;
      expect(computeParams.ECSSecurityGroupId).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ECSSecurityGroupId']
      });
      expect(computeParams.ALBTargetGroupArn).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBTargetGroupArn']
      });
      expect(computeParams.DBEndpoint).toEqual({
        'Fn::GetAtt': ['DatabaseStack', 'Outputs.DBEndpoint']
      });
      expect(computeParams.DBMasterPasswordSecretArn).toEqual({
        'Fn::GetAtt': ['SecretsStack', 'Outputs.DBMasterPasswordSecretArn']
      });
      expect(computeParams.AppSecretsArn).toEqual({
        'Fn::GetAtt': ['SecretsStack', 'Outputs.AppSecretsArn']
      });
    });

    test('MonitoringStack should depend on NetworkingStack and ComputeStack via GetAtt', () => {
      const monitoringParams = template.Resources.MonitoringStack.Properties.Parameters;
      expect(monitoringParams.ALBDNSName).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBDNSName']
      });
      expect(monitoringParams.ALBHostedZoneId).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBHostedZoneId']
      });
      expect(monitoringParams.ECSClusterName).toEqual({
        'Fn::GetAtt': ['ComputeStack', 'Outputs.ECSClusterName']
      });
      expect(monitoringParams.ECSServiceName).toEqual({
        'Fn::GetAtt': ['ComputeStack', 'Outputs.ECSServiceName']
      });
    });
  });

  describe('Outputs', () => {
    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('should have ApplicationURL output', () => {
      expect(template.Outputs.ApplicationURL).toBeDefined();
      const url = template.Outputs.ApplicationURL.Value;
      expect(url['Fn::Sub']).toBeDefined();
      expect(Array.isArray(url['Fn::Sub'])).toBe(true);
    });

    test('should have ALBDNSName output from NetworkingStack', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value).toEqual({
        'Fn::GetAtt': ['NetworkingStack', 'Outputs.ALBDNSName']
      });
    });

    test('should have ECSClusterName output from ComputeStack', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.ECSClusterName.Value).toEqual({
        'Fn::GetAtt': ['ComputeStack', 'Outputs.ECSClusterName']
      });
    });

    test('should have ECRRepositoryURI output from ComputeStack', () => {
      expect(template.Outputs.ECRRepositoryURI).toBeDefined();
      expect(template.Outputs.ECRRepositoryURI.Value).toEqual({
        'Fn::GetAtt': ['ComputeStack', 'Outputs.ECRRepositoryURI']
      });
    });

    test('should have DBEndpoint output from DatabaseStack', () => {
      expect(template.Outputs.DBEndpoint).toBeDefined();
      expect(template.Outputs.DBEndpoint.Value).toEqual({
        'Fn::GetAtt': ['DatabaseStack', 'Outputs.DBEndpoint']
      });
    });

    test('should have DBName output from DatabaseStack', () => {
      expect(template.Outputs.DBName).toBeDefined();
      expect(template.Outputs.DBName.Value).toEqual({
        'Fn::GetAtt': ['DatabaseStack', 'Outputs.DBName']
      });
    });
  });

  describe('Parameter Validation', () => {
    test('PublicSubnetIds should be converted to comma-delimited list for NetworkingStack', () => {
      const publicSubnetIds = template.Resources.NetworkingStack.Properties.Parameters.PublicSubnetIds;
      expect(publicSubnetIds['Fn::Join']).toBeDefined();
      expect(publicSubnetIds['Fn::Join'][0]).toBe(',');
      expect(publicSubnetIds['Fn::Join'][1]).toEqual({ Ref: 'PublicSubnetIds' });
    });

    test('PrivateSubnetIds should be converted to comma-delimited list for DatabaseStack', () => {
      const privateSubnetIds = template.Resources.DatabaseStack.Properties.Parameters.PrivateSubnetIds;
      expect(privateSubnetIds['Fn::Join']).toBeDefined();
      expect(privateSubnetIds['Fn::Join'][0]).toBe(',');
      expect(privateSubnetIds['Fn::Join'][1]).toEqual({ Ref: 'PrivateSubnetIds' });
    });

    test('PrivateSubnetIds should be converted to comma-delimited list for ComputeStack', () => {
      const privateSubnetIds = template.Resources.ComputeStack.Properties.Parameters.PrivateSubnetIds;
      expect(privateSubnetIds['Fn::Join']).toBeDefined();
      expect(privateSubnetIds['Fn::Join'][0]).toBe(',');
      expect(privateSubnetIds['Fn::Join'][1]).toEqual({ Ref: 'PrivateSubnetIds' });
    });
  });

  describe('Nested Stack Template URLs', () => {
    test('all nested stacks should use S3 bucket for template URLs', () => {
      const stacks = ['SecretsStack', 'NetworkingStack', 'DatabaseStack', 'ComputeStack', 'MonitoringStack'];
      stacks.forEach(stackName => {
        const templateURL = template.Resources[stackName].Properties.TemplateURL;
        expect(templateURL['Fn::Sub']).toContain('${NestedStacksBucketName}');
        expect(templateURL['Fn::Sub']).toContain('s3.amazonaws.com');
      });
    });

    test('template URLs should reference correct nested stack files', () => {
      expect(template.Resources.SecretsStack.Properties.TemplateURL['Fn::Sub']).toContain('secrets-stack.json');
      expect(template.Resources.NetworkingStack.Properties.TemplateURL['Fn::Sub']).toContain('networking-stack.json');
      expect(template.Resources.DatabaseStack.Properties.TemplateURL['Fn::Sub']).toContain('database-stack.json');
      expect(template.Resources.ComputeStack.Properties.TemplateURL['Fn::Sub']).toContain('compute-stack.json');
      expect(template.Resources.MonitoringStack.Properties.TemplateURL['Fn::Sub']).toContain('monitoring-stack.json');
    });
  });
});
