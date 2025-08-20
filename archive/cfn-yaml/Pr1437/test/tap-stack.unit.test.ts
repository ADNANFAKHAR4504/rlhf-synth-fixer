import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const randomId = Math.random().toString(36).substring(2, 8);
const timestamp = Date.now().toString().substring(-6);
const testPrefix = `test${randomId}${timestamp}`;

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe('Secure AWS logging infrastructure with S3, Lambda, and RDS');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('S3 Resources', () => {
    test('should have SecureLogsBucket resource', () => {
      expect(template.Resources.SecureLogsBucket).toBeDefined();
      expect(template.Resources.SecureLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureLogsBucket should have correct naming with lowercase', () => {
      const bucket = template.Resources.SecureLogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack-secure-logs-${AWS::AccountId}'
      });
    });

    test('SecureLogsBucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('SecureLogsBucket should block public access', () => {
      const bucket = template.Resources.SecureLogsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('SecureLogsBucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureLogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have AccessLogsBucket resource', () => {
      expect(template.Resources.AccessLogsBucket).toBeDefined();
      expect(template.Resources.AccessLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AccessLogsBucket should have correct naming with lowercase', () => {
      const bucket = template.Resources.AccessLogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack-access-logs-${AWS::AccountId}'
      });
    });

    test('should have SecureLogsBucketPolicy with secure transport enforcement', () => {
      const policy = template.Resources.SecureLogsBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
      
      const statements = policy.Properties.PolicyDocument.Statement;
      statements.forEach((statement: any) => {
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
        expect(statement.Effect).toBe('Deny');
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have LogProcessorFunction resource', () => {
      expect(template.Resources.LogProcessorFunction).toBeDefined();
      expect(template.Resources.LogProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('LogProcessorFunction should have correct runtime and configuration', () => {
      const lambda = template.Resources.LogProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('LogProcessorFunction should have VPC configuration', () => {
      const lambda = template.Resources.LogProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('LogProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.LogProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.DB_ENDPOINT).toBeDefined();
      expect(envVars.DB_USERNAME).toBe('admin');
      expect(envVars.S3_BUCKET).toBeDefined();
    });

    test('should have LambdaExecutionRole with correct permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(2);
      
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3LogsAccess');
      expect(s3Policy).toBeDefined();
      
      const rdsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'RDSAccess');
      expect(rdsPolicy).toBeDefined();
    });

    test('should have LambdaInvokePermission with correct ARN reference', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::Sub': 'arn:aws:s3:::tapstack-secure-logs-${AWS::AccountId}'
      });
    });

    test('should have S3NotificationLambda for custom resource', () => {
      const lambda = template.Resources.S3NotificationLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('should have S3NotificationLambdaRole with S3 notification permissions', () => {
      const role = template.Resources.S3NotificationLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3NotificationAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::tapstack-secure-logs-${AWS::AccountId}'
      });
    });
  });

  describe('RDS Resources', () => {
    test('should have SecureRDSInstance resource', () => {
      expect(template.Resources.SecureRDSInstance).toBeDefined();
      expect(template.Resources.SecureRDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('SecureRDSInstance should have correct engine and encryption', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.39');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('SecureRDSInstance should have performance insights disabled', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Properties.EnablePerformanceInsights).toBe(false);
      expect(rds.Properties.MonitoringInterval).toBe(60);
    });

    test('SecureRDSInstance should have backup configuration', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.MultiAZ).toBe(false);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have DBSubnetGroup resource', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDSMonitoringRole for enhanced monitoring', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.SecureVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have security groups for RDS and Lambda', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have security group rules for database access', () => {
      expect(template.Resources.RDSIngressRule).toBeDefined();
      expect(template.Resources.LambdaEgressRule).toBeDefined();
      
      const ingressRule = template.Resources.RDSIngressRule;
      expect(ingressRule.Properties.FromPort).toBe(3306);
      expect(ingressRule.Properties.ToPort).toBe(3306);
    });

    test('should have S3 VPC endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have route table and associations', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have DBPasswordSecret for secure password management', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have RDS encryption key', () => {
      expect(template.Resources.RDSEncryptionKey).toBeDefined();
      expect(template.Resources.RDSEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.RDSEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.RDSEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.RDSEncryptionKeyAlias.Properties.AliasName).toBe('alias/secure-logging-rds-key');
    });
  });

  describe('Custom Resources', () => {
    test('should have S3BucketNotificationCustomResource', () => {
      const customResource = template.Resources.S3BucketNotificationCustomResource;
      expect(customResource.Type).toBe('Custom::S3BucketNotification');
      expect(customResource.DependsOn).toBe('LambdaInvokePermission');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'LambdaFunctionName',
        'RDSEndpoint',
        'VPCId',
        'KMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      const outputMapping = {
        'S3BucketName': 'SecureLogsBucket',
        'LambdaFunctionName': 'LogProcessorFunction',
        'RDSEndpoint': 'RDSEndpoint',
        'VPCId': 'VPC',
        'KMSKeyId': 'RDSKMSKey'
      };
      
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = (template.Outputs as any)[outputKey];
        const expectedExportName = (outputMapping as any)[outputKey] || outputKey;
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportName}`
        });
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have consistent tagging', () => {
      const taggedResources = [
        'SecureVPC', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnetGroup',
        'RDSEncryptionKey', 'RDSSecurityGroup', 'LambdaSecurityGroup',
        'SecureLogsBucket', 'AccessLogsBucket', 'LambdaExecutionRole',
        'LogProcessorFunction', 'SecureRDSInstance', 'RDSMonitoringRole',
        'PrivateRouteTable', 'DBPasswordSecret'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('SecurityConfig');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have 26 resources total', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(26);
    });

    test('should have 5 outputs total', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });

    test('all resource references should be valid', () => {
      const resourceNames = Object.keys(template.Resources);
      
      JSON.stringify(template).replace(/"Ref":\s*"([^"]+)"/g, (match, refName) => {
        if (!['AWS::StackName', 'AWS::AccountId', 'AWS::Region'].includes(refName)) {
          expect(resourceNames).toContain(refName);
        }
        return match;
      });
    });

    test('bucket naming should be consistent across all references', () => {
      const templateStr = JSON.stringify(template);
      
      // Check that all references use the lowercase naming pattern
      expect(templateStr).toContain('tapstack-secure-logs-${AWS::AccountId}');
      expect(templateStr).toContain('tapstack-access-logs-${AWS::AccountId}');
      
      // Ensure no uppercase stack name references remain in bucket names
      expect(templateStr).not.toContain('${AWS::StackName}-secure-logs');
      expect(templateStr).not.toContain('${AWS::StackName}-access-logs');
    });
  });
});