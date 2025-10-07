import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template for testing (avoids YAML CloudFormation function parsing issues)
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
      expect(template.Description).toContain('Scientific Computing Shared Storage Infrastructure');
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
    test('should have all required parameters', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PartnerAccountIds).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('suffix');
    });

    test('VPC CIDR parameter should have correct default', () => {
      const vpcParam = template.Parameters.VpcCIDR;
      expect(vpcParam.Type).toBe('String');
      expect(vpcParam.Default).toBe('10.0.0.0/16');
    });

    test('Subnet parameters should have correct defaults', () => {
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe('10.0.2.0/24');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap for us-east-2', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-2']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-2'].AZ1).toBe('us-east-2a');
      expect(template.Mappings.RegionMap['us-east-2'].AZ2).toBe('us-east-2b');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1.Properties;
      const subnet2 = template.Resources.PrivateSubnet2.Properties;
      expect(subnet1.AvailabilityZone['Fn::FindInMap']).toContain('AZ1');
      expect(subnet2.AvailabilityZone['Fn::FindInMap']).toContain('AZ2');
    });

    test('subnets should not map public IPs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('Security Group', () => {
    test('should have EFS security group', () => {
      expect(template.Resources.EFSSecurityGroup).toBeDefined();
      expect(template.Resources.EFSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should allow NFS access on port 2049', () => {
      const sg = template.Resources.EFSSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toBeDefined();
      expect(sg.SecurityGroupIngress).toHaveLength(1);

      const rule = sg.SecurityGroupIngress[0];
      expect(rule.IpProtocol).toBe('tcp');
      expect(rule.FromPort).toBe(2049);
      expect(rule.ToPort).toBe(2049);
      expect(rule.CidrIp).toEqual({ Ref: 'VpcCIDR' });
    });
  });

  describe('EFS Resources', () => {
    test('should have EFS file system', () => {
      expect(template.Resources.EFSFileSystem).toBeDefined();
      expect(template.Resources.EFSFileSystem.Type).toBe('AWS::EFS::FileSystem');
    });

    test('EFS should have correct configuration', () => {
      const efs = template.Resources.EFSFileSystem.Properties;
      expect(efs.Encrypted).toBe(true);
      expect(efs.PerformanceMode).toBe('maxIO');
      expect(efs.ThroughputMode).toBe('provisioned');
      expect(efs.ProvisionedThroughputInMibps).toBe(100);
      expect(efs.BackupPolicy.Status).toBe('ENABLED');
    });

    test('EFS should have lifecycle policies', () => {
      const policies = template.Resources.EFSFileSystem.Properties.LifecyclePolicies;
      expect(policies).toBeDefined();
      expect(policies).toContainEqual({ TransitionToIA: 'AFTER_30_DAYS' });
      expect(policies).toContainEqual({ TransitionToPrimaryStorageClass: 'AFTER_1_ACCESS' });
    });

    test('should have EFS mount targets for both subnets', () => {
      expect(template.Resources.EFSMountTarget1).toBeDefined();
      expect(template.Resources.EFSMountTarget2).toBeDefined();
      expect(template.Resources.EFSMountTarget1.Type).toBe('AWS::EFS::MountTarget');
      expect(template.Resources.EFSMountTarget2.Type).toBe('AWS::EFS::MountTarget');
    });

    test('mount targets should reference correct subnets', () => {
      expect(template.Resources.EFSMountTarget1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Resources.EFSMountTarget2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have EFS access point', () => {
      expect(template.Resources.EFSAccessPoint).toBeDefined();
      expect(template.Resources.EFSAccessPoint.Type).toBe('AWS::EFS::AccessPoint');

      const accessPoint = template.Resources.EFSAccessPoint.Properties;
      expect(accessPoint.RootDirectory.Path).toBe('/research-data');
      expect(accessPoint.PosixUser.Uid).toBe(1000);
      expect(accessPoint.PosixUser.Gid).toBe(1000);
    });

    test('EFS should have DeletionPolicy set to Delete', () => {
      expect(template.Resources.EFSFileSystem.DeletionPolicy).toBe('Delete');
    });
  });

  describe('S3 Archival Bucket', () => {
    test('should have S3 bucket for archival', () => {
      expect(template.Resources.ArchivalBucket).toBeDefined();
      expect(template.Resources.ArchivalBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have correct configuration', () => {
      const bucket = template.Resources.ArchivalBucket.Properties;
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle rule', () => {
      const rules = template.Resources.ArchivalBucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].ExpirationInDays).toBe(365);
      expect(rules[0].Status).toBe('Enabled');
    });

    test('S3 bucket should have DeletionPolicy set to Delete', () => {
      expect(template.Resources.ArchivalBucket.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket name should include environment suffix', () => {
      const bucketName = template.Resources.ArchivalBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Lambda Function', () => {
    test('should have cleanup Lambda function', () => {
      expect(template.Resources.CleanupLambdaFunction).toBeDefined();
      expect(template.Resources.CleanupLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct configuration', () => {
      const lambda = template.Resources.CleanupLambdaFunction.Properties;
      expect(lambda.Runtime).toBe('python3.9');
      expect(lambda.Handler).toBe('index.lambda_handler');
      expect(lambda.Timeout).toBe(900);
      expect(lambda.MemorySize).toBe(1024);
    });

    test('Lambda should have VPC configuration', () => {
      const vpcConfig = template.Resources.CleanupLambdaFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Lambda should have environment variables', () => {
      const envVars = template.Resources.CleanupLambdaFunction.Properties.Environment.Variables;
      expect(envVars.EFS_MOUNT_PATH).toBe('/mnt/efs');
      expect(envVars.DAYS_THRESHOLD).toBe('180');
      expect(envVars.S3_BUCKET).toEqual({ Ref: 'ArchivalBucket' });
    });

    test('Lambda should have FileSystemConfigs', () => {
      const fsConfig = template.Resources.CleanupLambdaFunction.Properties.FileSystemConfigs;
      expect(fsConfig).toBeDefined();
      expect(fsConfig[0].LocalMountPath).toBe('/mnt/efs');
    });

    test('Lambda function name should include environment suffix', () => {
      const functionName = template.Resources.CleanupLambdaFunction.Properties.FunctionName;
      expect(functionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Roles', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have correct policies', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(role.Policies).toHaveLength(1);
      expect(role.Policies[0].PolicyName).toBe('EFSAndS3Access');
    });

    test('should have Research Team role', () => {
      expect(template.Resources.ResearchTeamRole).toBeDefined();
      expect(template.Resources.ResearchTeamRole.Type).toBe('AWS::IAM::Role');
    });

    test('Research Team role should have EFS access policy', () => {
      const role = template.Resources.ResearchTeamRole.Properties;
      expect(role.Policies[0].PolicyName).toBe('EFSAccessPolicy');
    });

    test('should have Backup role', () => {
      expect(template.Resources.BackupRole).toBeDefined();
      expect(template.Resources.BackupRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have DataSync role', () => {
      expect(template.Resources.DataSyncRole).toBeDefined();
      expect(template.Resources.DataSyncRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('EventBridge', () => {
    test('should have EventBridge rule for daily cleanup', () => {
      expect(template.Resources.CleanupScheduleRule).toBeDefined();
      expect(template.Resources.CleanupScheduleRule.Type).toBe('AWS::Events::Rule');
    });

    test('EventBridge rule should have daily schedule', () => {
      const rule = template.Resources.CleanupScheduleRule.Properties;
      expect(rule.ScheduleExpression).toBe('cron(0 2 * * ? *)');
      expect(rule.State).toBe('ENABLED');
    });

    test('should have Lambda permission for EventBridge', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have EFS storage alarm', () => {
      expect(template.Resources.EFSStorageAlarm).toBeDefined();
      expect(template.Resources.EFSStorageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('alarm should monitor StorageBytes metric', () => {
      const alarm = template.Resources.EFSStorageAlarm.Properties;
      expect(alarm.MetricName).toBe('StorageBytes');
      expect(alarm.Namespace).toBe('AWS/EFS');
      expect(alarm.Threshold).toBe(1099511627776); // 1TB
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('AWS Backup', () => {
    test('should have Backup Vault', () => {
      expect(template.Resources.BackupVault).toBeDefined();
      expect(template.Resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('should have Backup Plan', () => {
      expect(template.Resources.BackupPlan).toBeDefined();
      expect(template.Resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');
    });

    test('backup plan should have daily schedule with 30-day retention', () => {
      const plan = template.Resources.BackupPlan.Properties.BackupPlan;
      const rule = plan.BackupPlanRule[0];
      expect(rule.RuleName).toBe('DailyBackup');
      expect(rule.ScheduleExpression).toBe('cron(0 5 * * ? *)');
      expect(rule.Lifecycle.DeleteAfterDays).toBe(30);
    });

    test('should have Backup Selection', () => {
      expect(template.Resources.BackupSelection).toBeDefined();
      expect(template.Resources.BackupSelection.Type).toBe('AWS::Backup::BackupSelection');
    });
  });

  describe('DataSync', () => {
    test('should have DataSync EFS location', () => {
      expect(template.Resources.DataSyncEFSLocation).toBeDefined();
      expect(template.Resources.DataSyncEFSLocation.Type).toBe('AWS::DataSync::LocationEFS');
    });

    test('should have DataSync S3 location', () => {
      expect(template.Resources.DataSyncS3Location).toBeDefined();
      expect(template.Resources.DataSyncS3Location.Type).toBe('AWS::DataSync::LocationS3');
    });

    test('DataSync S3 location should use STANDARD_IA storage class', () => {
      const location = template.Resources.DataSyncS3Location.Properties;
      expect(location.S3StorageClass).toBe('STANDARD_IA');
      expect(location.Subdirectory).toBe('/datasync-archive');
    });

    test('should have DataSync Task', () => {
      expect(template.Resources.DataSyncTask).toBeDefined();
      expect(template.Resources.DataSyncTask.Type).toBe('AWS::DataSync::Task');
    });

    test('DataSync task should have daily schedule', () => {
      const task = template.Resources.DataSyncTask.Properties;
      expect(task.Schedule.ScheduleExpression).toBe('cron(0 3 * * ? *)');
    });
  });

  describe('Resource Sharing', () => {
    test('should have ResourceShare for cross-account access', () => {
      expect(template.Resources.ResourceShare).toBeDefined();
      expect(template.Resources.ResourceShare.Type).toBe('AWS::RAM::ResourceShare');
    });

    test('ResourceShare should have condition', () => {
      expect(template.Resources.ResourceShare.Condition).toBe('HasPartnerAccounts');
    });

    test('should have HasPartnerAccounts condition', () => {
      expect(template.Conditions.HasPartnerAccounts).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const requiredOutputs = [
      'VPCId',
      'EFSFileSystemId',
      'EFSFileSystemArn',
      'EFSDnsName',
      'ArchivalBucketName',
      'ArchivalBucketArn',
      'CleanupLambdaArn',
      'ResearchTeamRoleArn',
      'BackupVaultArn',
      'DataSyncTaskArn'
    ];

    requiredOutputs.forEach(outputName => {
      test(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('should have conditional ResourceShareArn output', () => {
      expect(template.Outputs.ResourceShareArn).toBeDefined();
      expect(template.Outputs.ResourceShareArn.Condition).toBe('HasPartnerAccounts');
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        if (outputName !== 'ResourceShareArn') {
          expect(template.Outputs[outputName].Export).toBeDefined();
          expect(template.Outputs[outputName].Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Resource Naming', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const resourcesToCheck = [
        'CleanupLambdaFunction',
        'ResearchTeamRole',
        'EFSStorageAlarm',
        'BackupVault',
        'DataSyncTask',
        'ResourceShare'
      ];

      resourcesToCheck.forEach(resourceName => {
        if (template.Resources[resourceName]) {
          const resource = template.Resources[resourceName];
          if (resource.Properties.FunctionName ||
            resource.Properties.RoleName ||
            resource.Properties.AlarmName ||
            resource.Properties.BackupVaultName ||
            resource.Properties.Name) {
            const nameProperty = resource.Properties.FunctionName ||
              resource.Properties.RoleName ||
              resource.Properties.AlarmName ||
              resource.Properties.BackupVaultName ||
              resource.Properties.Name;
            if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
              expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
            }
          }
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('critical resources should have Delete policy for cleanup', () => {
      const resourcesToCheck = ['EFSFileSystem', 'ArchivalBucket'];

      resourcesToCheck.forEach(resourceName => {
        expect(template.Resources[resourceName].DeletionPolicy).toBe('Delete');
      });
    });
  });
});