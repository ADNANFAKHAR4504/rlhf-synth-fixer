import fs from 'fs';
import path from 'path';

describe('Secure Data Processing Pipeline CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Secure Data Processing Pipeline for Financial Services with comprehensive encryption, VPC isolation, and compliance controls'
      );
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have SecretRotationDays parameter', () => {
      const param = template.Parameters.SecretRotationDays;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(365);
    });

    test('should have LogRetentionDays parameter', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(90);
      expect(param.AllowedValues).toBeDefined();
    });

    test('should have VpcCidr parameter', () => {
      const param = template.Parameters.VpcCidr;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have exactly four parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });
  });

  describe('KMS Key Resources', () => {
    test('should have KMSKey resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey should have key rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMSKey should have proper key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
    });

    test('should have KMSKeyAlias resource', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should not have public IPs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have PrivateRouteTable', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have route table associations for all private subnets', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have DynamoDB VPC Endpoint', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('should have Secrets Manager VPC Endpoint', () => {
      expect(template.Resources.SecretsManagerVPCEndpoint).toBeDefined();
      expect(template.Resources.SecretsManagerVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.SecretsManagerVPCEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(template.Resources.SecretsManagerVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('should have VPCEndpointSecurityGroup', () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have LambdaSecurityGroup', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security groups should have explicit egress rules', () => {
      expect(template.Resources.VPCEndpointSecurityGroup.Properties.SecurityGroupEgress).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Properties.SecurityGroupEgress).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('should have DataBucket resource', () => {
      expect(template.Resources.DataBucket).toBeDefined();
      expect(template.Resources.DataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('DataBucket should have KMS encryption', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('DataBucket should have versioning enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('DataBucket should block public access', () => {
      const bucket = template.Resources.DataBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('DataBucket should have lifecycle rules', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TransactionTable resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TransactionTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionTable should have KMS encryption', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('TransactionTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TransactionTable should have correct key schema', () => {
      const table = template.Resources.TransactionTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('transactionId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('Secrets Manager', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should use KMS encryption', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('DatabaseSecret should generate secure password', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have SecretRotationSchedule', () => {
      expect(template.Resources.SecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationSchedule.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });
  });

  describe('Lambda Functions', () => {
    test('should have DataProcessorFunction', () => {
      expect(template.Resources.DataProcessorFunction).toBeDefined();
      expect(template.Resources.DataProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('DataProcessorFunction should use Python 3.11', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('DataProcessorFunction should be in VPC', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('DataProcessorFunction should have KMS key for environment encryption', () => {
      const lambda = template.Resources.DataProcessorFunction;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
    });

    test('should have SecretRotationFunction', () => {
      expect(template.Resources.SecretRotationFunction).toBeDefined();
      expect(template.Resources.SecretRotationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('API Gateway', () => {
    test('should have RestApi resource', () => {
      expect(template.Resources.RestApi).toBeDefined();
      expect(template.Resources.RestApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('RestApi should use API key authentication', () => {
      const api = template.Resources.RestApi;
      expect(api.Properties.ApiKeySourceType).toBe('HEADER');
    });

    test('should have TransactionsResource', () => {
      expect(template.Resources.TransactionsResource).toBeDefined();
      expect(template.Resources.TransactionsResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have RequestValidator', () => {
      expect(template.Resources.RequestValidator).toBeDefined();
      expect(template.Resources.RequestValidator.Properties.ValidateRequestBody).toBe(true);
      expect(template.Resources.RequestValidator.Properties.ValidateRequestParameters).toBe(true);
    });

    test('should have ApiKey and UsagePlan', () => {
      expect(template.Resources.ApiKey).toBeDefined();
      expect(template.Resources.UsagePlan).toBeDefined();
      expect(template.Resources.UsagePlanKey).toBeDefined();
    });

    test('UsagePlan should have throttling configured', () => {
      const usagePlan = template.Resources.UsagePlan;
      expect(usagePlan.Properties.Throttle).toBeDefined();
      expect(usagePlan.Properties.Quota).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have DataProcessorLogGroup', () => {
      expect(template.Resources.DataProcessorLogGroup).toBeDefined();
      expect(template.Resources.DataProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have KMS encryption', () => {
      expect(template.Resources.DataProcessorLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.SecretRotationLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ApiErrorAlarm).toBeDefined();
      expect(template.Resources.ApiErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'VPCId',
        'DataBucketName',
        'TransactionTableName',
        'DataProcessorFunctionArn',
        'ApiEndpoint',
        'ApiKeyId',
        'DatabaseSecretArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exactly nine outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all major resources should have Environment tag', () => {
      const resourcesWithTags = [
        'KMSKey', 'VPC', 'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3',
        'DataBucket', 'TransactionTable', 'DatabaseSecret', 'LambdaExecutionRole',
        'DataProcessorFunction', 'RestApi'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('all major resources should have Project tag', () => {
      const resourcesWithTags = [
        'KMSKey', 'VPC', 'DataBucket', 'TransactionTable'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((t: any) => t.Key === 'Project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('SecureDataPipeline');
        }
      });
    });

    test('all major resources should have ComplianceLevel tag', () => {
      const resourcesWithTags = [
        'KMSKey', 'VPC', 'DataBucket', 'TransactionTable'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const complianceTag = resource.Properties.Tags.find((t: any) => t.Key === 'ComplianceLevel');
          expect(complianceTag).toBeDefined();
          expect(complianceTag.Value).toBe('High');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public access', () => {
      // Check S3 bucket has public access blocked
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);

      // Check subnets don't assign public IPs
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('all sensitive data should be encrypted with KMS', () => {
      // S3 bucket encryption
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // DynamoDB encryption
      const table = template.Resources.TransactionTable;
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');

      // Secrets Manager encryption
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('Lambda functions should be in VPC', () => {
      expect(template.Resources.DataProcessorFunction.Properties.VpcConfig).toBeDefined();
      expect(template.Resources.SecretRotationFunction.Properties.VpcConfig).toBeDefined();
    });
  });
});
