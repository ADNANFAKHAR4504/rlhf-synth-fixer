import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Single Stack Infrastructure', () => {
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
      expect(template.Description).toContain('multi-tier');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
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
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
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

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.Type).toBe('String');
      expect(template.Parameters.DBInstanceClass.AllowedValues).toBeDefined();
    });

    test('should have ECSTaskCPU parameter', () => {
      expect(template.Parameters.ECSTaskCPU).toBeDefined();
      expect(template.Parameters.ECSTaskCPU.Type).toBe('String');
      expect(template.Parameters.ECSTaskCPU.AllowedValues).toBeDefined();
    });

    test('should have ECSTaskMemory parameter', () => {
      expect(template.Parameters.ECSTaskMemory).toBeDefined();
      expect(template.Parameters.ECSTaskMemory.Type).toBe('String');
      expect(template.Parameters.ECSTaskMemory.AllowedValues).toBeDefined();
    });

    test('should have ECSDesiredCount parameter', () => {
      expect(template.Parameters.ECSDesiredCount).toBeDefined();
      expect(template.Parameters.ECSDesiredCount.Type).toBe('Number');
    });

    test('should have HostedZoneId parameter', () => {
      expect(template.Parameters.HostedZoneId).toBeDefined();
      expect(template.Parameters.HostedZoneId.Type).toBe('String');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('should have dev environment configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig).toBeDefined();
      expect(devConfig.DBAllocatedStorage).toBe('20');
      expect(devConfig.DBMultiAZ).toBe('false');
      expect(devConfig.LogRetentionDays).toBe('7');
    });

    test('should have staging environment configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig).toBeDefined();
      expect(stagingConfig.DBAllocatedStorage).toBe('50');
      expect(stagingConfig.DBMultiAZ).toBe('false');
      expect(stagingConfig.LogRetentionDays).toBe('30');
    });

    test('should have prod environment configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig).toBeDefined();
      expect(prodConfig.DBAllocatedStorage).toBe('100');
      expect(prodConfig.DBMultiAZ).toBe('true');
      expect(prodConfig.LogRetentionDays).toBe('90');
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have ApplicationLoadBalancer resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have ECSCluster resource', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have ECSService resource', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('should have DBInstance resource', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have DBMasterPasswordSecret resource', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have RDSEncryptionKey resource', () => {
      expect(template.Resources.RDSEncryptionKey).toBeDefined();
      expect(template.Resources.RDSEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have ECRRepository resource', () => {
      expect(template.Resources.ECRRepository).toBeDefined();
      expect(template.Resources.ECRRepository.Type).toBe('AWS::ECR::Repository');
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have correct tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('ManagedBy');
    });

    test('ApplicationLoadBalancer should have correct tags', () => {
      const tags = template.Resources.ApplicationLoadBalancer.Properties.Tags;
      expect(tags).toBeDefined();
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('ManagedBy');
    });
  });

  describe('Security Groups', () => {
    test('should have ALBSecurityGroup', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ECSSecurityGroup', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DBSecurityGroup', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have security group ingress rules', () => {
      expect(template.Resources.ECSFromALBIngress).toBeDefined();
      expect(template.Resources.ECSFromALBIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
    });

    test('should have security group egress rules', () => {
      expect(template.Resources.ECSToDBEgress).toBeDefined();
      expect(template.Resources.ECSToDBEgress.Type).toBe('AWS::EC2::SecurityGroupEgress');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('should have ApplicationURL output', () => {
      expect(template.Outputs.ApplicationURL).toBeDefined();
      expect(template.Outputs.ApplicationURL.Condition).toBe('HasMonitoring');
      expect(template.Outputs.ApplicationURL.Value['Fn::Sub']).toBeDefined();
    });

    test('should have ECSClusterName output', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.ECSClusterName.Value).toEqual({ Ref: 'ECSCluster' });
    });

    test('should have ECRRepositoryURI output', () => {
      expect(template.Outputs.ECRRepositoryURI).toBeDefined();
      expect(template.Outputs.ECRRepositoryURI.Value['Fn::Sub']).toBeDefined();
    });

    test('should have RDSEndpoint output', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Value).toEqual({
        'Fn::GetAtt': ['DBInstance', 'Endpoint.Address']
      });
    });

    test('should have DBName output', () => {
      expect(template.Outputs.DBName).toBeDefined();
      expect(template.Outputs.DBName.Value).toBe('appdb');
    });

    test('should have DBMasterPasswordSecretArn output', () => {
      expect(template.Outputs.DBMasterPasswordSecretArn).toBeDefined();
      expect(template.Outputs.DBMasterPasswordSecretArn.Value).toEqual({
        Ref: 'DBMasterPasswordSecret'
      });
    });
  });

  describe('Conditions', () => {
    test('should have HasMonitoring condition', () => {
      expect(template.Conditions.HasMonitoring).toBeDefined();
    });

    test('should have HasHostedZoneId condition', () => {
      expect(template.Conditions.HasHostedZoneId).toBeDefined();
    });

    test('should have HasDomainName condition', () => {
      expect(template.Conditions.HasDomainName).toBeDefined();
    });
  });

  describe('ECS Resources', () => {
    test('should have ECSTaskDefinition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('should have ECSTaskExecutionRole', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECSTaskRole', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('ECSService should reference ECSTaskDefinition', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.TaskDefinition).toEqual({ Ref: 'ECSTaskDefinition' });
    });
  });

  describe('RDS Resources', () => {
    test('should have DBSubnetGroup', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have DBParameterGroup', () => {
      expect(template.Resources.DBParameterGroup).toBeDefined();
      expect(template.Resources.DBParameterGroup.Type).toBe('AWS::RDS::DBParameterGroup');
    });

    test('DBInstance should use encryption', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.KmsKeyId).toEqual({ Ref: 'RDSEncryptionKey' });
    });

    test('DBInstance should use FindInMap for MultiAZ', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.MultiAZ).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentName' }, 'DBMultiAZ']
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch alarms', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.MemoryAlarmHigh).toBeDefined();
      expect(template.Resources.RDSCPUAlarm).toBeDefined();
      expect(template.Resources.RDSStorageAlarm).toBeDefined();
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.ApplicationDashboard).toBeDefined();
      expect(template.Resources.ApplicationDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Route53 Resources', () => {
    test('should have conditional DNS record', () => {
      expect(template.Resources.DNSRecord).toBeDefined();
      expect(template.Resources.DNSRecord.Condition).toBe('HasMonitoring');
      expect(template.Resources.DNSRecord.Type).toBe('AWS::Route53::RecordSet');
    });

    test('should have conditional health check', () => {
      expect(template.Resources.HealthCheck).toBeDefined();
      expect(template.Resources.HealthCheck.Condition).toBe('HasMonitoring');
      expect(template.Resources.HealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });
  });
});
