import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      expect(template.Description).toBe(
        'Secure and compliant AWS infrastructure with S3 encryption, detailed monitoring, IAM roles, Multi-AZ RDS, and VPC Flow Logs'
      );
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const requiredParameters = [
        'EnvironmentSuffix',
        'VpcCidr',
        'PrivateSubnetACidr',
        'PrivateSubnetBCidr',
        'PublicSubnetACidr',
        'PublicSubnetBCidr',
        'EC2InstanceType',
        'RDSInstanceClass',
      ];

      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming');
    });
  });

  describe('Resources', () => {
    test('should have required resources', () => {
      const requiredResources = [
        'S3KMSKey',
        'S3KMSKeyAlias',
        'LoggingBucket',
        'ApplicationDataBucket',
        'VPC',
        'InternetGateway',
        'PublicSubnetA',
        'PublicSubnetB',
        'PrivateSubnetA',
        'PrivateSubnetB',
        'RDSSecret',
        'RDSInstance',
        'LambdaExecutionRole',
        'ProcessingLambda',
      ];

      requiredResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('S3KMSKey should have correct properties', () => {
      const kmsKey = template.Resources.S3KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description['Fn::Sub']).toBe(
        'KMS Key for S3 bucket encryption - ${EnvironmentSuffix}'
      );
    });

    test('LoggingBucket should have encryption enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('S3KMSKey');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock.Ref).toBe('VpcCidr');
    });

    test('RDSInstance should have correct properties', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.37');
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('LambdaExecutionRole should have correct permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'LambdaS3Policy'
      );
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'ApplicationDataBucketName',
        'LoggingBucketName',
        'S3KMSKeyId',
        'S3KMSKeyArn',
        'WebServerInstanceId',
        'LambdaFunctionArn',
        'RDSEndpoint',
        'RDSPort',
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('VPCId output should reference the VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value.Ref).toBe('VPC');
    });

    test('ApplicationDataBucketName output should reference the ApplicationDataBucket resource', () => {
      const output = template.Outputs.ApplicationDataBucketName;
      expect(output.Value.Ref).toBe('ApplicationDataBucket');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('RegionMap should have valid regions and AMIs', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['us-east-1'].AMI).toBe('ami-0e2c86481225d3c51');
      expect(regionMap['us-west-2'].AMI).toBe('ami-04c82466a6fab80eb');
      expect(regionMap['eu-west-1'].AMI).toBe('ami-07cb1aa266ef8b45d');
    });
  });

  describe('Resource Properties Validation', () => {
    test('PublicSubnetA should have MapPublicIpOnLaunch set to true', () => {
      const subnet = template.Resources.PublicSubnetA;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('PrivateSubnetA should not have MapPublicIpOnLaunch', () => {
      const subnet = template.Resources.PrivateSubnetA;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('RDSSecret should have correct properties', () => {
      const secret = template.Resources.RDSSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe(
        '{"username":"admin"}'
      );
    });
  });
});
