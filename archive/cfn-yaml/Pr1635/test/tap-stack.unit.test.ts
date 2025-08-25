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
      expect(template.Description).toBe('TAP Stack - Task Assignment Platform CloudFormation Template');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix, Owner, and DBUsername parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have all main resources', () => {
      const expectedResources = [
        'TurnAroundPromptTable',
        'WebAppVPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSubnetGroup',
        'DatabaseSecurityGroup',
        'DBSecret',
        'DatabaseInstance',
        'ApplicationDataBucket'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('DynamoDB table should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({ 'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}' });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.WebAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('RDS instance should use dynamic secret reference for password', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
    });

    test('S3 bucket should have encryption and versioning enabled', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'ApplicationDataBucketName'
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('DatabaseEndpoint output should reference DatabaseInstance', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address']
      });
    });

    test('ApplicationDataBucketName output should reference ApplicationDataBucket', () => {
      const output = template.Outputs.ApplicationDataBucketName;
      expect(output.Value).toEqual({ Ref: 'ApplicationDataBucket' });
    });
  });

  });
