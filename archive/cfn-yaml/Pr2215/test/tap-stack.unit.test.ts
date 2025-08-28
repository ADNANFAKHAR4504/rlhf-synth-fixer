import fs from 'fs';
import path from 'path';

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
        'Secure AWS Environment Baseline Template - Production-ready security controls with least privilege principles'
      );
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'VpcId',
      'PrivateSubnetIds',
      'PublicSubnetId',
      'SecurityTeamEmail',
      'EnvironmentName',
      'StackPrefix',
    ];
    test('should have all required parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
    test('should have correct types and defaults', () => {
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
      expect(template.Parameters.PublicSubnetId.Type).toBe('AWS::EC2::Subnet::Id');
      expect(template.Parameters.SecurityTeamEmail.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.StackPrefix.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.AllowedValues).toEqual([
        'production', 'staging', 'development',
      ]);
    });
  });

  describe('Resources', () => {
    test('should have SecureLoggingBucket with encryption and versioning', () => {
      const resources = template.Resources;
      const bucket = resources.SecureLoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
    test('should have AccessLogsBucket with encryption', () => {
      const resources = template.Resources;
      const bucket = resources.AccessLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
    test('should have EC2SecurityRole with correct trust policy', () => {
      const resources = template.Resources;
      const role = resources.EC2SecurityRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });
    test('should have VPCFlowLogsGroup and VPCFlowLogs', () => {
      const resources = template.Resources;
      expect(resources.VPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(resources.VPCFlowLogs.Properties.LogGroupName).toBeDefined();
    });
    test('should have ConfigBucket and ConfigBucketPolicy', () => {
      const resources = template.Resources;
      expect(resources.ConfigBucket.Type).toBe('AWS::S3::Bucket');
      expect(resources.ConfigBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
    test('should have SecureRDSInstance with encryption and no public access', () => {
      const resources = template.Resources;
      const rds = resources.SecureRDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });
    test('should have SecureEC2Instance with encrypted EBS', () => {
      const resources = template.Resources;
      const ec2 = resources.SecureEC2Instance;
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      [
        'SecurityAlertsTopicArn',
        'EC2InstanceProfileArn',
        'DatabaseSubnetGroupName',
        'ApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'VPCFlowLogsGroupName',
        'S3AccessLogGroupName',
        'ConfigBucketName',
        'ConfigRoleArn',
      ].forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });
    test('ConfigBucketName output should reference ConfigBucket', () => {
      const outputs = template.Outputs;
      expect(outputs.ConfigBucketName.Value).toEqual({ Ref: 'ConfigBucket' });
    });
    test('ConfigRoleArn output should reference ConfigRole', () => {
      const outputs = template.Outputs;
      expect(outputs.ConfigRoleArn.Value).toEqual({ 'Fn::GetAtt': ['ConfigRole', 'Arn'] });
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
  });
});
