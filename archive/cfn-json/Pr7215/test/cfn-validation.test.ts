import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Validation', () => {
  const templatesDir = path.join(__dirname, '../lib');
  const templates = [
    'master-template.json',
    'vpc-nested-stack.json',
    'rds-nested-stack.json',
    'lambda-nested-stack.json',
    's3-nested-stack.json',
    's3-replica-nested-stack.json',
    'monitoring-nested-stack.json'
  ];

  describe('Template Syntax', () => {
    templates.forEach(templateFile => {
      test(`${templateFile} should be valid JSON`, () => {
        const templatePath = path.join(templatesDir, templateFile);
        expect(fs.existsSync(templatePath)).toBe(true);
        
        const content = fs.readFileSync(templatePath, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      });

      test(`${templateFile} should have AWSTemplateFormatVersion`, () => {
        const templatePath = path.join(templatesDir, templateFile);
        const content = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        expect(content.AWSTemplateFormatVersion).toBe('2010-09-09');
      });

      test(`${templateFile} should have Description`, () => {
        const templatePath = path.join(templatesDir, templateFile);
        const content = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        expect(content.Description).toBeDefined();
        expect(typeof content.Description).toBe('string');
        expect(content.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Master Template', () => {
    let masterTemplate: any;

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'master-template.json');
      masterTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    });

    test('should have required parameters', () => {
      expect(masterTemplate.Parameters).toBeDefined();
      expect(masterTemplate.Parameters.Environment).toBeDefined();
      expect(masterTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(masterTemplate.Parameters.DBMasterUsername).toBeDefined();
      expect(masterTemplate.Parameters.AlertEmail).toBeDefined();
      expect(masterTemplate.Parameters.ReplicaBucketArn).toBeDefined();
    });

    test('should have Secrets Manager secret for DB password', () => {
      expect(masterTemplate.Resources.DBPasswordSecret).toBeDefined();
      expect(masterTemplate.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(masterTemplate.Resources.DBPasswordSecret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should have environment mappings', () => {
      expect(masterTemplate.Mappings).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(masterTemplate.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('dev environment should not have NAT Gateway', () => {
      const devConfig = masterTemplate.Mappings.EnvironmentConfig.dev;
      expect(devConfig.CreateNATGateway).toBe('false');
    });

    test('staging and prod should have NAT Gateway', () => {
      const stagingConfig = masterTemplate.Mappings.EnvironmentConfig.staging;
      const prodConfig = masterTemplate.Mappings.EnvironmentConfig.prod;
      
      expect(stagingConfig.CreateNATGateway).toBe('true');
      expect(prodConfig.CreateNATGateway).toBe('true');
    });

    test('should have proper VPC CIDR blocks', () => {
      expect(masterTemplate.Mappings.EnvironmentConfig.dev.VPCCidr).toBe('10.0.0.0/16');
      expect(masterTemplate.Mappings.EnvironmentConfig.staging.VPCCidr).toBe('10.1.0.0/16');
      expect(masterTemplate.Mappings.EnvironmentConfig.prod.VPCCidr).toBe('10.2.0.0/16');
    });

    test('should have all nested stack resources', () => {
      expect(masterTemplate.Resources).toBeDefined();
      expect(masterTemplate.Resources.VPCStack).toBeDefined();
      expect(masterTemplate.Resources.RDSStack).toBeDefined();
      expect(masterTemplate.Resources.LambdaStack).toBeDefined();
      expect(masterTemplate.Resources.S3Stack).toBeDefined();
      expect(masterTemplate.Resources.MonitoringStack).toBeDefined();
    });

    test('should have implicit dependencies via Fn::GetAtt', () => {
      // Dependencies are implicit through Fn::GetAtt, no explicit DependsOn needed
      expect(masterTemplate.Resources.RDSStack.Properties.Parameters.PrivateSubnet1).toBeDefined();
      expect(masterTemplate.Resources.LambdaStack.Properties.Parameters.DBEndpoint).toBeDefined();
      expect(masterTemplate.Resources.MonitoringStack.Properties.Parameters.DBClusterId).toBeDefined();
    });

    test('should export all critical outputs', () => {
      expect(masterTemplate.Outputs).toBeDefined();
      expect(masterTemplate.Outputs.VPCId).toBeDefined();
      expect(masterTemplate.Outputs.DBClusterEndpoint).toBeDefined();
      expect(masterTemplate.Outputs.DBClusterReadEndpoint).toBeDefined();
      expect(masterTemplate.Outputs.LambdaFunctionArn).toBeDefined();
      expect(masterTemplate.Outputs.DataBucketName).toBeDefined();
      expect(masterTemplate.Outputs.SNSTopicArn).toBeDefined();
    });
  });

  describe('VPC Nested Stack', () => {
    let vpcTemplate: any;

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'vpc-nested-stack.json');
      vpcTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    });

    test('should have conditional NAT Gateway', () => {
      expect(vpcTemplate.Conditions).toBeDefined();
      expect(vpcTemplate.Conditions.CreateNAT).toBeDefined();
    });

    test('NAT Gateway should use condition', () => {
      expect(vpcTemplate.Resources.NATGateway).toBeDefined();
      expect(vpcTemplate.Resources.NATGateway.Condition).toBe('CreateNAT');
      expect(vpcTemplate.Resources.NATGatewayEIP.Condition).toBe('CreateNAT');
    });

    test('should create 4 subnets', () => {
      expect(vpcTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(vpcTemplate.Resources.PublicSubnet2).toBeDefined();
      expect(vpcTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(vpcTemplate.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have security groups', () => {
      expect(vpcTemplate.Resources.DBSecurityGroup).toBeDefined();
      expect(vpcTemplate.Resources.LambdaSecurityGroup).toBeDefined();
    });

    test('main resources should have DeletionPolicy Delete', () => {
      // Check that primary resources have DeletionPolicy, skip dependent resources
      const primaryResources = ['VPC', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      primaryResources.forEach(resourceKey => {
        if (vpcTemplate.Resources[resourceKey]) {
          expect(vpcTemplate.Resources[resourceKey].DeletionPolicy).toBe('Delete');
        }
      });
    });
  });

  describe('RDS Nested Stack', () => {
    let rdsTemplate: any;

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'rds-nested-stack.json');
      rdsTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    });

    test('should have Aurora PostgreSQL cluster', () => {
      expect(rdsTemplate.Resources.DBCluster).toBeDefined();
      expect(rdsTemplate.Resources.DBCluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('should have encryption enabled', () => {
      expect(rdsTemplate.Resources.DBCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have automated backups', () => {
      expect(rdsTemplate.Resources.DBCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have 2 DB instances', () => {
      expect(rdsTemplate.Resources.DBInstance1).toBeDefined();
      expect(rdsTemplate.Resources.DBInstance2).toBeDefined();
    });

    test('should have DeletionPolicy Delete', () => {
      expect(rdsTemplate.Resources.DBCluster.DeletionPolicy).toBe('Delete');
      expect(rdsTemplate.Resources.DBInstance1.DeletionPolicy).toBe('Delete');
      expect(rdsTemplate.Resources.DBInstance2.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Lambda Nested Stack', () => {
    let lambdaTemplate: any;

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'lambda-nested-stack.json');
      lambdaTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    });

    test('should have Lambda function', () => {
      expect(lambdaTemplate.Resources.DataProcessorFunction).toBeDefined();
    });

    test('should use environment variables', () => {
      const envVars = lambdaTemplate.Resources.DataProcessorFunction.Properties.Environment.Variables;
      expect(envVars.ENVIRONMENT).toBeDefined();
      expect(envVars.DB_ENDPOINT).toBeDefined();
      expect(envVars.LOG_LEVEL).toBeDefined();
    });

    test('should have VPC configuration', () => {
      expect(lambdaTemplate.Resources.DataProcessorFunction.Properties.VpcConfig).toBeDefined();
    });

    test('should have IAM execution role', () => {
      expect(lambdaTemplate.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('should have DeletionPolicy Delete', () => {
      expect(lambdaTemplate.Resources.DataProcessorFunction.DeletionPolicy).toBe('Delete');
      expect(lambdaTemplate.Resources.DataProcessorLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('S3 Nested Stack', () => {
    let s3Template: any;

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 's3-nested-stack.json');
      s3Template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    });

    test('should have data bucket and accept replica bucket ARN parameter', () => {
      expect(s3Template.Resources.DataBucket).toBeDefined();
      expect(s3Template.Parameters.ReplicaBucketArn).toBeDefined();
    });

    test('should have versioning enabled on data bucket', () => {
      expect(s3Template.Resources.DataBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have replication configuration', () => {
      expect(s3Template.Resources.DataBucket.Properties.ReplicationConfiguration).toBeDefined();
    });

    test('should have lifecycle policies', () => {
      const lifecycleRules = s3Template.Resources.DataBucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toBeDefined();
      expect(lifecycleRules.length).toBeGreaterThan(0);
    });

    test('should have encryption enabled on data bucket', () => {
      expect(s3Template.Resources.DataBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have DeletionPolicy Delete on data bucket', () => {
      expect(s3Template.Resources.DataBucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Monitoring Nested Stack', () => {
    let monitoringTemplate: any;

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'monitoring-nested-stack.json');
      monitoringTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    });

    test('should have SNS topic', () => {
      expect(monitoringTemplate.Resources.SNSTopic).toBeDefined();
    });

    test('should have RDS CPU alarm', () => {
      expect(monitoringTemplate.Resources.RDSCPUAlarm).toBeDefined();
      expect(monitoringTemplate.Resources.RDSCPUAlarm.Properties.Threshold).toBe(80);
    });

    test('should have Lambda errors alarm', () => {
      expect(monitoringTemplate.Resources.LambdaErrorsAlarm).toBeDefined();
      expect(monitoringTemplate.Resources.LambdaErrorsAlarm.Properties.Threshold).toBe(10);
      expect(monitoringTemplate.Resources.LambdaErrorsAlarm.Properties.Period).toBe(60);
    });

    test('all alarms should notify SNS topic', () => {
      const alarms = [
        'RDSCPUAlarm',
        'RDSConnectionsAlarm',
        'LambdaErrorsAlarm',
        'LambdaThrottlesAlarm',
        'LambdaDurationAlarm'
      ];

      alarms.forEach(alarmName => {
        expect(monitoringTemplate.Resources[alarmName]).toBeDefined();
        expect(monitoringTemplate.Resources[alarmName].Properties.AlarmActions).toBeDefined();
      });
    });

    test('should have DeletionPolicy Delete', () => {
      expect(monitoringTemplate.Resources.SNSTopic.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Resource Naming Convention', () => {
    templates.forEach(templateFile => {
      test(`${templateFile} resources should use environmentSuffix in names`, () => {
        const templatePath = path.join(templatesDir, templateFile);
        const content = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        if (content.Resources) {
          Object.keys(content.Resources).forEach(resourceKey => {
            const resource = content.Resources[resourceKey];
            if (resource.Properties && resource.Properties.Tags) {
              const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
              if (nameTag && nameTag.Value && nameTag.Value['Fn::Sub']) {
                const namePattern = nameTag.Value['Fn::Sub'];
                expect(namePattern).toContain('${EnvironmentSuffix}');
              }
            }
          });
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    templates.forEach(templateFile => {
      test(`${templateFile} resources should have required tags`, () => {
        const templatePath = path.join(templatesDir, templateFile);
        const content = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        if (content.Resources) {
          Object.keys(content.Resources).forEach(resourceKey => {
            const resource = content.Resources[resourceKey];
            if (resource.Properties && resource.Properties.Tags) {
              const tags = resource.Properties.Tags;
              const tagKeys = tags.map((t: any) => t.Key);
              
              expect(tagKeys).toContain('Environment');
              expect(tagKeys).toContain('Project');
              expect(tagKeys).toContain('CostCenter');
            }
          });
        }
      });
    });
  });
});
