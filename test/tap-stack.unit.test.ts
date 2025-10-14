import fs from 'fs';
import path from 'path';
import { yamlParse } from 'yaml-cfn';

describe('Healthcare SaaS Platform - HIPAA Compliant Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yamlParse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Healthcare SaaS Platform');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should have correct configuration', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('KMS Keys', () => {
    test('should create RDS KMS key', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('RDS KMS key should have correct deletion policy', () => {
      expect(template.Resources.RDSKMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.RDSKMSKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDS KMS key should have proper key policy', () => {
      const keyPolicy = template.Resources.RDSKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(3);
    });

    test('RDS KMS key should allow CloudWatch Logs access', () => {
      const keyPolicy = template.Resources.RDSKMSKey.Properties.KeyPolicy;
      const cwLogsStatement = keyPolicy.Statement.find((s: any) =>
        s.Sid === 'Allow CloudWatch Logs to use the key'
      );
      expect(cwLogsStatement).toBeDefined();
      expect(cwLogsStatement.Effect).toBe('Allow');
      expect(cwLogsStatement.Action).toContain('kms:Encrypt');
      expect(cwLogsStatement.Action).toContain('kms:Decrypt');
    });

    test('should create EFS KMS key', () => {
      expect(template.Resources.EFSKMSKey).toBeDefined();
      expect(template.Resources.EFSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('EFS KMS key should have correct deletion policy', () => {
      expect(template.Resources.EFSKMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.EFSKMSKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('should create KMS key aliases', () => {
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.EFSKMSKeyAlias).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should create three private subnets across different AZs', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3).toBeDefined();

      expect(template.Resources.PrivateSubnetAZ1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnetAZ2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnetAZ3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should create route table and associations', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should create RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should allow MySQL access from VPC', () => {
      const ingress = template.Resources.RDSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].CidrIp).toBe('10.0.0.0/16');
    });

    test('should create EFS security group', () => {
      expect(template.Resources.EFSSecurityGroup).toBeDefined();
      expect(template.Resources.EFSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EFS security group should allow NFS access from VPC', () => {
      const ingress = template.Resources.EFSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(2049);
      expect(ingress[0].ToPort).toBe(2049);
      expect(ingress[0].CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Secrets Manager', () => {
    test('should create database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should have correct configuration', () => {
      const props = template.Resources.DBSecret.Properties;
      expect(props.GenerateSecretString).toBeDefined();
      expect(props.GenerateSecretString.PasswordLength).toBe(32);
      expect(props.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test('should create secret rotation schedule', () => {
      expect(template.Resources.SecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationSchedule.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });

    test('secret rotation should be configured for 30 days', () => {
      const rotationRules = template.Resources.SecretRotationSchedule.Properties.RotationRules;
      expect(rotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('RDS Database', () => {
    test('should create DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should span all three subnets', () => {
      const subnetIds = template.Resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(3);
    });

    test('should create RDS cluster', () => {
      expect(template.Resources.DBCluster).toBeDefined();
      expect(template.Resources.DBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('RDS cluster should be encrypted', () => {
      const props = template.Resources.DBCluster.Properties;
      expect(props.StorageEncrypted).toBe(true);
      expect(props.KmsKeyId).toBeDefined();
    });

    test('RDS cluster should use Aurora MySQL', () => {
      const props = template.Resources.DBCluster.Properties;
      expect(props.Engine).toBe('aurora-mysql');
      expect(props.EngineMode).toBe('provisioned');
    });

    test('RDS cluster should have serverless v2 scaling configured', () => {
      const scaling = template.Resources.DBCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling).toBeDefined();
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(1);
    });

    test('RDS cluster should enable CloudWatch logs', () => {
      const logs = template.Resources.DBCluster.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('error');
      expect(logs).toContain('general');
      expect(logs).toContain('slowquery');
    });

    test('RDS cluster should have backup retention configured', () => {
      expect(template.Resources.DBCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should create RDS instance', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should be serverless', () => {
      expect(template.Resources.DBInstance.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('RDS instance should not be publicly accessible', () => {
      expect(template.Resources.DBInstance.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Lambda for Secret Rotation', () => {
    test('should create Lambda execution role', () => {
      expect(template.Resources.SecretRotationLambdaRole).toBeDefined();
      expect(template.Resources.SecretRotationLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have required managed policies', () => {
      const policies = template.Resources.SecretRotationLambdaRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda role should have Secrets Manager permissions', () => {
      const policies = template.Resources.SecretRotationLambdaRole.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('SecretRotationPolicy');
    });

    test('should create secret rotation Lambda function', () => {
      expect(template.Resources.SecretRotationLambda).toBeDefined();
      expect(template.Resources.SecretRotationLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have correct runtime and timeout', () => {
      const props = template.Resources.SecretRotationLambda.Properties;
      expect(props.Runtime).toBe('python3.11');
      expect(props.Timeout).toBe(300);
    });

    test('Lambda should be in VPC', () => {
      const vpcConfig = template.Resources.SecretRotationLambda.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(vpcConfig.SubnetIds).toHaveLength(2);
    });

    test('should create Lambda permission', () => {
      expect(template.Resources.SecretRotationLambdaPermission).toBeDefined();
      expect(template.Resources.SecretRotationLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('EFS File System', () => {
    test('should create EFS file system', () => {
      expect(template.Resources.AuditLogsFileSystem).toBeDefined();
      expect(template.Resources.AuditLogsFileSystem.Type).toBe('AWS::EFS::FileSystem');
    });

    test('EFS should be encrypted', () => {
      const props = template.Resources.AuditLogsFileSystem.Properties;
      expect(props.Encrypted).toBe(true);
      expect(props.KmsKeyId).toBeDefined();
    });

    test('EFS should have lifecycle policies', () => {
      const policies = template.Resources.AuditLogsFileSystem.Properties.LifecyclePolicies;
      expect(policies).toBeDefined();
      expect(policies).toHaveLength(2);
      expect(policies[0].TransitionToIA).toBe('AFTER_90_DAYS');
    });

    test('should create EFS mount targets in all three AZs', () => {
      expect(template.Resources.EFSMountTargetAZ1).toBeDefined();
      expect(template.Resources.EFSMountTargetAZ2).toBeDefined();
      expect(template.Resources.EFSMountTargetAZ3).toBeDefined();

      expect(template.Resources.EFSMountTargetAZ1.Type).toBe('AWS::EFS::MountTarget');
      expect(template.Resources.EFSMountTargetAZ2.Type).toBe('AWS::EFS::MountTarget');
      expect(template.Resources.EFSMountTargetAZ3.Type).toBe('AWS::EFS::MountTarget');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create CloudWatch log group for RDS', () => {
      expect(template.Resources.RDSLogGroup).toBeDefined();
      expect(template.Resources.RDSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention policy', () => {
      expect(template.Resources.RDSLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('log group should be encrypted with KMS', () => {
      expect(template.Resources.RDSLogGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix in names', () => {
      const resourcesWithNames = [
        'RDSKMSKeyAlias',
        'EFSKMSKeyAlias',
        'VPC',
        'InternetGateway',
        'PrivateSubnetAZ1',
        'PrivateSubnetAZ2',
        'PrivateSubnetAZ3',
        'PrivateRouteTable',
        'RDSSecurityGroup',
        'EFSSecurityGroup',
        'DBSubnetGroup',
        'DBSecret',
        'DBCluster',
        'DBInstance',
        'SecretRotationLambdaRole',
        'SecretRotationLambda',
        'AuditLogsFileSystem',
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource.Properties) {
          const propsStr = JSON.stringify(resource.Properties);
          expect(propsStr).toMatch(/EnvironmentSuffix/);
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnetAZ1Id',
        'PrivateSubnetAZ2Id',
        'PrivateSubnetAZ3Id',
        'RDSKMSKeyArn',
        'EFSKMSKeyArn',
        'DBClusterEndpoint',
        'DBClusterArn',
        'DBSecretArn',
        'EFSFileSystemId',
        'RDSSecurityGroupId',
        'EFSSecurityGroupId',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach((outputName) => {
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach((outputName) => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  describe('HIPAA Compliance Requirements', () => {
    test('should have KMS encryption for RDS', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.DBCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have KMS encryption for EFS', () => {
      expect(template.Resources.EFSKMSKey).toBeDefined();
      expect(template.Resources.AuditLogsFileSystem.Properties.Encrypted).toBe(true);
    });

    test('should have automated secret rotation', () => {
      expect(template.Resources.SecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationSchedule.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });

    test('should have multi-AZ deployment', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should have audit logging enabled', () => {
      expect(template.Resources.RDSLogGroup).toBeDefined();
      expect(template.Resources.DBCluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
    });
  });

  describe('Deletion Policies', () => {
    test('KMS keys should have Delete policy', () => {
      expect(template.Resources.RDSKMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.EFSKMSKey.DeletionPolicy).toBe('Delete');
    });

    test('database resources should have Delete policy', () => {
      expect(template.Resources.DBCluster.DeletionPolicy).toBe('Delete');
      expect(template.Resources.DBInstance.DeletionPolicy).toBe('Delete');
    });

    test('network resources should have Delete policy', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });
  });
});
