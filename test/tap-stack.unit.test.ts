import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template generated from YAML
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
      expect(template.Description).toBe(
        'Secure AWS Infrastructure Template with Best Practices - us-east-1'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'prod']);
    });

    test('Owner parameter should have correct properties', () => {
      const param = template.Parameters.Owner;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('platform-team');
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-infrastructure');
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have dev and prod configurations', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.dev).toBeDefined();
      expect(config.prod).toBeDefined();
      expect(config.dev.VpcCidr).toBe('10.0.0.0/16');
      expect(config.prod.VpcCidr).toBe('10.1.0.0/16');
    });
  });

  describe('KMS Keys', () => {
    test('should have S3 KMS key', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
      expect(template.Resources.S3KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have RDS KMS key', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS keys should have proper key policies', () => {
      const s3Key = template.Resources.S3KMSKey.Properties.KeyPolicy;
      const rdsKey = template.Resources.RDSKMSKey.Properties.KeyPolicy;
      expect(s3Key.Statement).toBeDefined();
      expect(rdsKey.Statement).toBeDefined();
      expect(s3Key.Statement.length).toBeGreaterThan(0);
      expect(rdsKey.Statement.length).toBeGreaterThan(0);
    });

    test('KMS keys should have aliases', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have all required subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
    });

   test('subnets should be in different availability zones', () => {
      const publicAZ = template.Resources.PublicSubnet.Properties.AvailabilityZone;
      const privateAZ = template.Resources.PrivateSubnet.Properties.AvailabilityZone;

      expect(publicAZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateAZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    // NAT Gateway removed for LocalStack Community compatibility
    test.skip('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      // PrivateRouteTable removed due to NAT Gateway removal for LocalStack
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('WebServerSecurityGroup should have restrictive rules', () => {
      const sg = template.Resources.WebServerSecurityGroup.Properties;
      const ingress = sg.SecurityGroupIngress;
      
      // Should allow HTTP, HTTPS, and SSH from bastion
      expect(ingress).toHaveLength(3);
      expect(ingress.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 22 && rule.SourceSecurityGroupId)).toBe(true);
    });

    test('DatabaseSecurityGroup should only allow access from web servers', () => {
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      const ingress = sg.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('S3 Buckets', () => {
    test('should have logging bucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have application bucket', () => {
      expect(template.Resources.ApplicationBucket).toBeDefined();
      expect(template.Resources.ApplicationBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('both buckets should have encryption enabled', () => {
      const loggingBucket = template.Resources.LoggingBucket.Properties;
      const appBucket = template.Resources.ApplicationBucket.Properties;
      
      expect(loggingBucket.BucketEncryption).toBeDefined();
      expect(appBucket.BucketEncryption).toBeDefined();
      
      const loggingEncryption = loggingBucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      const appEncryption = appBucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(loggingEncryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(appEncryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('both buckets should have public access blocked', () => {
      const loggingBucket = template.Resources.LoggingBucket.Properties;
      const appBucket = template.Resources.ApplicationBucket.Properties;
      
      expect(loggingBucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(loggingBucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(loggingBucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(loggingBucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      
      expect(appBucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(appBucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(appBucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(appBucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('application bucket should have logging configured', () => {
      const appBucket = template.Resources.ApplicationBucket.Properties;
      expect(appBucket.LoggingConfiguration).toBeDefined();
      expect(appBucket.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'LoggingBucket' });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have RDS monitoring role', () => {
      expect(template.Resources.RDSMonitoringRole).toBeDefined();
      expect(template.Resources.RDSMonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have S3 access policy with least privilege', () => {
      expect(template.Resources.S3AccessPolicy).toBeDefined();
      const policy = template.Resources.S3AccessPolicy.Properties.PolicyDocument;
      
      // Check for encryption condition
      const statements = policy.Statement;
      expect(statements[0].Condition).toBeDefined();
      expect(statements[0].Condition.StringEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });

    test('should have MFA required policy', () => {
      expect(template.Resources.MFARequiredPolicy).toBeDefined();
      const policy = template.Resources.MFARequiredPolicy.Properties.PolicyDocument;
      
      // Should have deny statement for actions without MFA
      const denyStatement = policy.Statement.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe('false');
    });

    test('Lambda role should have secret rotation permissions', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      expect(lambdaRole.Policies).toBeDefined();
      
      const secretPolicy = lambdaRole.Policies.find((p: any) => p.PolicyName === 'SecretRotationPolicy');
      expect(secretPolicy).toBeDefined();
      
      const actions = secretPolicy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('secretsmanager:GetSecretValue');
      expect(actions).toContain('secretsmanager:PutSecretValue');
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have API credentials secret', () => {
      expect(template.Resources.APICredentialsSecret).toBeDefined();
      expect(template.Resources.APICredentialsSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('secrets should have automatic password generation', () => {
      const dbSecret = template.Resources.DatabaseSecret.Properties;
      const apiSecret = template.Resources.APICredentialsSecret.Properties;
      
      expect(dbSecret.GenerateSecretString).toBeDefined();
      expect(apiSecret.GenerateSecretString).toBeDefined();
      
      expect(dbSecret.GenerateSecretString.PasswordLength).toBe(32);
      expect(apiSecret.GenerateSecretString.PasswordLength).toBe(64);
    });

    test('should have secret rotation configured', () => {
      expect(template.Resources.APISecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationLambda).toBeDefined();
      expect(template.Resources.SecretRotationLambdaInvokePermission).toBeDefined();
      
      const schedule = template.Resources.APISecretRotationSchedule.Properties;
      expect(schedule.RotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('RDS Database', () => {
    test('should have database instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('database should have encryption disabled for LocalStack compatibility', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.StorageEncrypted).toBe(false);
      // KmsKeyId not used for LocalStack compatibility
    });

    test('database should use static credentials for LocalStack compatibility', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.MasterUsername).toBe('admin');
      expect(db.MasterUserPassword).toBe('TempPassword123!');
      // Using static credentials for LocalStack testing environment
    });

    test('database should have backups disabled for LocalStack compatibility', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.BackupRetentionPeriod).toBe(0);
      // Backups disabled for LocalStack testing environment
    });

    test('database should not be publicly accessible', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('database should have CloudWatch logs exports', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.EnableCloudwatchLogsExports).toContain('error');
      expect(db.EnableCloudwatchLogsExports).toContain('general');
    });

    test('database should have Delete deletion policy', () => {
      expect(template.Resources.DatabaseInstance.DeletionPolicy).toBe('Delete');
    });
  });

  describe('EC2 Instance', () => {
    test('should have web server instance', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      expect(template.Resources.WebServerInstance.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instance should have encrypted EBS volume', () => {
      const instance = template.Resources.WebServerInstance.Properties;
      const blockDevice = instance.BlockDeviceMappings[0].Ebs;
      
      expect(blockDevice.Encrypted).toBe(true);
      expect(blockDevice.VolumeType).toBe('gp3');
    });

    test('EC2 instance should be in private subnet', () => {
      const instance = template.Resources.WebServerInstance.Properties;
      expect(instance.SubnetId).toEqual({ Ref: 'PrivateSubnet' });
    });

    test('EC2 instance should have detailed monitoring enabled', () => {
      const instance = template.Resources.WebServerInstance.Properties;
      expect(instance.Monitoring).toBe(true);
    });

    test('EC2 instance should have IAM instance profile', () => {
      const instance = template.Resources.WebServerInstance.Properties;
      expect(instance.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });
  });

  describe('CloudWatch and Logging', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
    });

    test('log groups should have retention configured', () => {
      expect(template.Resources.S3LogGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.VPCFlowLogsGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have CloudTrail configured', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.CloudTrail.Properties;
      expect(trail.EnableLogFileValidation).toBe(true);
    });

    test('should have VPC Flow Logs configured', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      
      const flowLogs = template.Resources.VPCFlowLogs.Properties;
      expect(flowLogs.TrafficType).toBe('ALL');
      expect(flowLogs.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnetId',
        'PublicSubnetId',
        'ApplicationBucketName',
        'LoggingBucketName',
        'DatabaseEndpoint',
        'DatabasePort',
        'EC2InstanceId',
        'CloudTrailName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all resources should have tags', () => {
      const resourcesToCheck = [
        'VPC', 'PublicSubnet', 'PrivateSubnet', 'DatabaseSubnet',
        'S3KMSKey', 'RDSKMSKey', 'LoggingBucket', 'ApplicationBucket',
        'EC2InstanceRole', 'LambdaExecutionRole', 'DatabaseInstance',
        'WebServerInstance'
      ];

      resourcesToCheck.forEach(resourceName => {
        if (template.Resources[resourceName] && template.Resources[resourceName].Properties) {
          const tags = template.Resources[resourceName].Properties.Tags;
          expect(tags).toBeDefined();
          
          const hasEnvTag = tags.some((tag: any) => tag.Key === 'env');
          const hasOwnerTag = tags.some((tag: any) => tag.Key === 'owner');
          const hasProjectTag = tags.some((tag: any) => tag.Key === 'project');
          
          expect(hasEnvTag).toBe(true);
          expect(hasOwnerTag).toBe(true);
          expect(hasProjectTag).toBe(true);
        }
      });
    });

    test('all IAM roles should have condition for us-east-1 region', () => {
      const roles = ['EC2InstanceRole', 'LambdaExecutionRole'];
      
      roles.forEach(roleName => {
        const role = template.Resources[roleName].Properties;
        const statement = role.AssumeRolePolicyDocument.Statement[0];
        
        if (statement.Condition) {
          expect(statement.Condition.StringEquals['aws:RequestedRegion']).toBe('us-east-1');
        }
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const buckets = ['LoggingBucket', 'ApplicationBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName].Properties;
        expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
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

    test('all resource references should be valid', () => {
      // Check that all !Ref references point to existing resources or parameters
      const resourceNames = Object.keys(template.Resources);
      const parameterNames = Object.keys(template.Parameters);
      const validRefs = [...resourceNames, ...parameterNames, 'AWS::StackName', 'AWS::AccountId', 'AWS::Region'];
      
      // This is a simplified check - in production, you'd want to recursively check all references
      const jsonString = JSON.stringify(template);
      const refPattern = /"Ref":\s*"([^"]+)"/g;
      let match;
      
      while ((match = refPattern.exec(jsonString)) !== null) {
        const refName = match[1];
        if (!refName.includes('${') && !refName.includes('::')) {
          expect(validRefs).toContain(refName);
        }
      }
    });
  });
});