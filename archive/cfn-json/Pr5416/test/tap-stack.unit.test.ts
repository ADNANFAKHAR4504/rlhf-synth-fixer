import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('RDS PostgreSQL Migration CloudFormation Template', () => {
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
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentType',
        'EnvironmentSuffix',
        'SubnetId1',
        'SubnetId2',
        'VpcId',
        'MasterUsername',
        'MigrationDate'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBeDefined();
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(20);
      expect(param.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('EnvironmentType parameter should have correct allowed values', () => {
      const param = template.Parameters.EnvironmentType;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Default).toBe('dev');
    });

    test('SubnetId parameters should be of correct type', () => {
      expect(template.Parameters.SubnetId1.Type).toBe('AWS::EC2::Subnet::Id');
      expect(template.Parameters.SubnetId2.Type).toBe('AWS::EC2::Subnet::Id');
    });

    test('VpcId parameter should be of correct type', () => {
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
    });

    test('MasterUsername parameter should have constraints', () => {
      const param = template.Parameters.MasterUsername;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('should have configurations for all environments', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.dev).toBeDefined();
      expect(config.staging).toBeDefined();
      expect(config.prod).toBeDefined();
    });

    test('dev environment should have correct configuration', () => {
      const dev = template.Mappings.EnvironmentConfig.dev;
      expect(dev.InstanceClass).toBe('db.t3.micro');
      expect(dev.MultiAZ).toBe('false');
      expect(dev.BackupRetention).toBe(7);
    });

    test('staging environment should have correct configuration', () => {
      const staging = template.Mappings.EnvironmentConfig.staging;
      expect(staging.InstanceClass).toBe('db.t3.small');
      expect(staging.MultiAZ).toBe('true');
      expect(staging.BackupRetention).toBe(7);
    });

    test('prod environment should have correct configuration', () => {
      const prod = template.Mappings.EnvironmentConfig.prod;
      expect(prod.InstanceClass).toBe('db.m5.large');
      expect(prod.MultiAZ).toBe('true');
      expect(prod.BackupRetention).toBe(30);
    });

    test('all environments should have AllocatedStorage defined', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.dev.AllocatedStorage).toBeGreaterThan(0);
      expect(config.staging.AllocatedStorage).toBeGreaterThan(0);
      expect(config.prod.AllocatedStorage).toBeGreaterThan(0);
    });
  });

  describe('Resources', () => {
    test('should have exactly 4 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(4);
    });

    test('should have all required resources', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBMasterPassword).toBeDefined();
      expect(template.Resources.PostgreSQLInstance).toBeDefined();
    });

    describe('DBSecurityGroup', () => {
      test('should be of correct type', () => {
        expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should have correct ingress rules', () => {
        const sg = template.Resources.DBSecurityGroup;
        const ingress = sg.Properties.SecurityGroupIngress;
        expect(ingress).toHaveLength(1);
        expect(ingress[0].FromPort).toBe(5432);
        expect(ingress[0].ToPort).toBe(5432);
        expect(ingress[0].IpProtocol).toBe('tcp');
      });

      test('should reference VpcId parameter', () => {
        const sg = template.Resources.DBSecurityGroup;
        expect(sg.Properties.VpcId).toEqual({ Ref: 'VpcId' });
      });

      test('should have correct tags including EnvironmentSuffix in Name', () => {
        const sg = template.Resources.DBSecurityGroup;
        const tags = sg.Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toEqual({ 'Fn::Sub': 'rds-sg-${EnvironmentSuffix}' });
      });

      test('should have all required tags', () => {
        const sg = template.Resources.DBSecurityGroup;
        const tags = sg.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('MigrationDate');
        expect(tagKeys).toContain('Project');
      });
    });

    describe('DBSubnetGroup', () => {
      test('should be of correct type', () => {
        expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      });

      test('should have correct subnet group name with EnvironmentSuffix', () => {
        const subnetGroup = template.Resources.DBSubnetGroup;
        expect(subnetGroup.Properties.DBSubnetGroupName).toEqual({
          'Fn::Sub': 'rds-subnet-group-${EnvironmentType}-${EnvironmentSuffix}'
        });
      });

      test('should reference both subnet parameters', () => {
        const subnetGroup = template.Resources.DBSubnetGroup;
        const subnetIds = subnetGroup.Properties.SubnetIds;
        expect(subnetIds).toHaveLength(2);
        expect(subnetIds).toContainEqual({ Ref: 'SubnetId1' });
        expect(subnetIds).toContainEqual({ Ref: 'SubnetId2' });
      });

      test('should have all required tags', () => {
        const subnetGroup = template.Resources.DBSubnetGroup;
        const tags = subnetGroup.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('MigrationDate');
        expect(tagKeys).toContain('Project');
      });
    });

    describe('DBMasterPassword', () => {
      test('should be of correct type', () => {
        expect(template.Resources.DBMasterPassword.Type).toBe('AWS::SecretsManager::Secret');
      });

      test('should have correct secret name with EnvironmentSuffix', () => {
        const secret = template.Resources.DBMasterPassword;
        expect(secret.Properties.Name).toEqual({
          'Fn::Sub': '/rds/${EnvironmentType}/master-password-${EnvironmentSuffix}'
        });
      });

      test('should have GenerateSecretString configuration', () => {
        const secret = template.Resources.DBMasterPassword;
        const genConfig = secret.Properties.GenerateSecretString;
        expect(genConfig).toBeDefined();
        expect(genConfig.GenerateStringKey).toBe('password');
        expect(genConfig.PasswordLength).toBeGreaterThanOrEqual(16);
        expect(genConfig.RequireEachIncludedType).toBe(true);
      });

      test('should include username in SecretStringTemplate', () => {
        const secret = template.Resources.DBMasterPassword;
        const template_str = secret.Properties.GenerateSecretString.SecretStringTemplate;
        expect(template_str).toBeDefined();
        expect(template_str['Fn::Sub']).toContain('username');
      });

      test('should have all required tags', () => {
        const secret = template.Resources.DBMasterPassword;
        const tags = secret.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('MigrationDate');
        expect(tagKeys).toContain('Project');
      });
    });

    describe('PostgreSQLInstance', () => {
      test('should be of correct type', () => {
        expect(template.Resources.PostgreSQLInstance.Type).toBe('AWS::RDS::DBInstance');
      });

      test('should have correct DB instance identifier with EnvironmentSuffix', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.DBInstanceIdentifier).toEqual({
          'Fn::Sub': 'migrated-rds-${EnvironmentType}-${EnvironmentSuffix}'
        });
      });

      test('should have correct database name', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.DBName).toBe('migrated_app_db');
      });

      test('should have correct engine and version', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.Engine).toBe('postgres');
        expect(instance.Properties.EngineVersion).toBeDefined();
        expect(typeof instance.Properties.EngineVersion).toBe('string');
      });

      test('should use environment-specific instance class', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.DBInstanceClass).toEqual({
          'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'InstanceClass']
        });
      });

      test('should use environment-specific storage', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.AllocatedStorage).toEqual({
          'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'AllocatedStorage']
        });
      });

      test('should have encryption enabled', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.StorageEncrypted).toBe(true);
      });

      test('should use environment-specific MultiAZ setting', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.MultiAZ).toEqual({
          'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'MultiAZ']
        });
      });

      test('should reference master username parameter', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.MasterUsername).toEqual({ Ref: 'MasterUsername' });
      });

      test('should retrieve password from Secrets Manager', () => {
        const instance = template.Resources.PostgreSQLInstance;
        const password = instance.Properties.MasterUserPassword;
        expect(password).toBeDefined();
        expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
        expect(password['Fn::Sub']).toContain('DBMasterPassword');
      });

      test('should reference DB subnet group', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      });

      test('should reference security group', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DBSecurityGroup' });
      });

      test('should use environment-specific backup retention', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.BackupRetentionPeriod).toEqual({
          'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'BackupRetention']
        });
      });

      test('should have DeletionProtection disabled for destroyability', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.DeletionProtection).toBe(false);
      });

      test('should have DeleteAutomatedBackups enabled', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.DeleteAutomatedBackups).toBe(true);
      });

      test('should not be publicly accessible', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.PubliclyAccessible).toBe(false);
      });

      test('should have CloudWatch logs exports', () => {
        const instance = template.Resources.PostgreSQLInstance;
        expect(instance.Properties.EnableCloudwatchLogsExports).toBeDefined();
        expect(instance.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
      });

      test('should have all required tags', () => {
        const instance = template.Resources.PostgreSQLInstance;
        const tags = instance.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('MigrationDate');
        expect(tagKeys).toContain('Project');
      });

      test('Project tag should be DatabaseMigration', () => {
        const instance = template.Resources.PostgreSQLInstance;
        const tags = instance.Properties.Tags;
        const projectTag = tags.find((t: any) => t.Key === 'Project');
        expect(projectTag.Value).toBe('DatabaseMigration');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'RDSEndpoint',
        'RDSPort',
        'DBInstanceIdentifier',
        'DBSecretArn',
        'DBName',
        'SecurityGroupId'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('RDSEndpoint output should be correctly configured', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PostgreSQLInstance', 'Endpoint.Address']
      });
      expect(output.Export).toBeDefined();
    });

    test('RDSPort output should be correctly configured', () => {
      const output = template.Outputs.RDSPort;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PostgreSQLInstance', 'Endpoint.Port']
      });
      expect(output.Export).toBeDefined();
    });

    test('DBSecretArn output should reference the secret', () => {
      const output = template.Outputs.DBSecretArn;
      expect(output.Value).toEqual({ Ref: 'DBMasterPassword' });
      expect(output.Export).toBeDefined();
    });

    test('DBName output should return correct database name', () => {
      const output = template.Outputs.DBName;
      expect(output.Value).toBe('migrated_app_db');
    });

    test('SecurityGroupId output should reference the security group', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output.Value).toEqual({ Ref: 'DBSecurityGroup' });
      expect(output.Export).toBeDefined();
    });

    test('all exported outputs should use stack name in export name', () => {
      const exportedOutputs = ['RDSEndpoint', 'RDSPort', 'DBSecretArn', 'SecurityGroupId'];
      exportedOutputs.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include EnvironmentSuffix', () => {
      const resources = template.Resources;

      const sgName = resources.DBSecurityGroup.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(JSON.stringify(sgName.Value)).toContain('EnvironmentSuffix');

      const subnetGroupName = resources.DBSubnetGroup.Properties.DBSubnetGroupName;
      expect(JSON.stringify(subnetGroupName)).toContain('EnvironmentSuffix');

      const secretName = resources.DBMasterPassword.Properties.Name;
      expect(JSON.stringify(secretName)).toContain('EnvironmentSuffix');

      const instanceId = resources.PostgreSQLInstance.Properties.DBInstanceIdentifier;
      expect(JSON.stringify(instanceId)).toContain('EnvironmentSuffix');
    });
  });

  describe('Security Best Practices', () => {
    test('RDS instance should have encryption enabled', () => {
      const instance = template.Resources.PostgreSQLInstance;
      expect(instance.Properties.StorageEncrypted).toBe(true);
    });

    test('password should be stored in Secrets Manager', () => {
      expect(template.Resources.DBMasterPassword).toBeDefined();
      expect(template.Resources.DBMasterPassword.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('RDS instance should not be publicly accessible', () => {
      const instance = template.Resources.PostgreSQLInstance;
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('security group should only allow PostgreSQL port', () => {
      const sg = template.Resources.DBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].ToPort).toBe(5432);
    });
  });

  describe('Destroyability Requirements', () => {
    test('RDS instance should have DeletionProtection disabled', () => {
      const instance = template.Resources.PostgreSQLInstance;
      expect(instance.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should delete automated backups', () => {
      const instance = template.Resources.PostgreSQLInstance;
      expect(instance.Properties.DeleteAutomatedBackups).toBe(true);
    });

    test('no resources should have Retain deletion policy', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Multi-Environment Support', () => {
    test('template should support dev, staging, and prod environments', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config).toHaveProperty('dev');
      expect(config).toHaveProperty('staging');
      expect(config).toHaveProperty('prod');
    });

    test('prod should have higher backup retention than dev', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.prod.BackupRetention).toBeGreaterThan(config.dev.BackupRetention);
    });

    test('prod and staging should have MultiAZ enabled', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.prod.MultiAZ).toBe('true');
      expect(config.staging.MultiAZ).toBe('true');
    });

    test('dev should have MultiAZ disabled', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.dev.MultiAZ).toBe('false');
    });
  });
});
