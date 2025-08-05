import { Template } from 'aws-cdk-lib/assertions';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

describe('Secure Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const yamlContent = readFileSync('lib/TapStack.yml', 'utf-8');
    template = parse(yamlContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });
  });

  describe('Parameters', () => {
    test('should have YourPublicIP parameter', () => {
      expect(template.Parameters).toHaveProperty('YourPublicIP');
    });

    test('YourPublicIP parameter should have correct properties', () => {
      const param = template.Parameters.YourPublicIP;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe(
        '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/\\d{1,2}$'
      );
      expect(param.Description).toBeDefined();
    });

    test('should have UniqueId parameter', () => {
      expect(template.Parameters).toHaveProperty('UniqueId');
    });

    test('UniqueId parameter should have correct properties', () => {
      const param = template.Parameters.UniqueId;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]{1,10}$');
      expect(param.Description).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources).toHaveProperty('SecureVPC');
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have InfrastructureKMSKey resource', () => {
      expect(template.Resources).toHaveProperty('InfrastructureKMSKey');
      expect(template.Resources.InfrastructureKMSKey.Type).toBe(
        'AWS::KMS::Key'
      );
    });

    test('should have EC2InstanceRole resource', () => {
      expect(template.Resources).toHaveProperty('EC2InstanceRole');
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have S3AccessLogsBucket resource', () => {
      expect(template.Resources).toHaveProperty('S3AccessLogsBucket');
      expect(template.Resources.S3AccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
    });

    test('should have WebsiteContentBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.WebsiteContentBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      });
    });

    test('should have ApplicationLogsBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.ApplicationLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      });
    });

    test('should have BackupDataBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.BackupDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      });
    });

    test('should have EC2SecurityGroup resource', () => {
      expect(template.Resources).toHaveProperty('EC2SecurityGroup');
      expect(template.Resources.EC2SecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have SecureEC2Instance resource with encrypted EBS', () => {
      const instance = template.Resources.SecureEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'EC2InstanceId',
        'EC2PublicIP',
        'WebsiteContentBucket',
        'ApplicationLogsBucket',
        'BackupDataBucket',
        'S3AccessLogsBucket',
        'KMSKeyId',
        'EC2InstanceRoleArn',
      ];
      expect(Object.keys(template.Outputs)).toEqual(
        expect.arrayContaining(expectedOutputs)
      );
    });

    test('VPCId output should be correct', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'SecureVPC' });
    });

    test('EC2InstanceId output should be correct', () => {
      expect(template.Outputs.EC2InstanceId.Value).toEqual({
        Ref: 'SecureEC2Instance',
      });
    });

    test('EC2PublicIP output should be correct', () => {
      expect(template.Outputs.EC2PublicIP.Value).toEqual({
        'Fn::GetAtt': ['SecureEC2Instance', 'PublicIp'],
      });
    });

    test('WebsiteContentBucket output should be correct', () => {
      expect(template.Outputs.WebsiteContentBucket.Value).toEqual({
        Ref: 'WebsiteContentBucket',
      });
    });

    test('ApplicationLogsBucket output should be correct', () => {
      expect(template.Outputs.ApplicationLogsBucket.Value).toEqual({
        Ref: 'ApplicationLogsBucket',
      });
    });

    test('BackupDataBucket output should be correct', () => {
      expect(template.Outputs.BackupDataBucket.Value).toEqual({
        Ref: 'BackupDataBucket',
      });
    });

    test('S3AccessLogsBucket output should be correct', () => {
      expect(template.Outputs.S3AccessLogsBucket.Value).toEqual({
        Ref: 'S3AccessLogsBucket',
      });
    });

    test('KMSKeyId output should be correct', () => {
      expect(template.Outputs.KMSKeyId.Value).toEqual({
        Ref: 'InfrastructureKMSKey',
      });
    });

    test('EC2InstanceRoleArn output should be correct', () => {
      expect(template.Outputs.EC2InstanceRoleArn.Value).toEqual({
        'Fn::GetAtt': ['EC2InstanceRole', 'Arn'],
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(() => Template.fromJSON(template)).not.toThrow();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.Resources).toBeDefined();
      expect(template.Resources).not.toBeNull();
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters).not.toBeNull();
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have the correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(20);
    });

    test('should have the correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have the correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should follow naming convention', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'TapStack${UniqueId}-secure-vpc' },
      });
    });

    test('S3 bucket names should follow naming convention with UniqueId', () => {
      const buckets = [
        'S3AccessLogsBucket',
        'ApplicationLogsBucket',
        'WebsiteContentBucket',
        'BackupDataBucket',
      ];
      buckets.forEach(bucket => {
        const resource = template.Resources[bucket];
        expect(resource.Properties.BucketName).toEqual({
          'Fn::Sub': `${bucket.toLowerCase().replace('bucket', '')}-secureapp\${UniqueId}`,
        });
      });
    });

    test('export names should follow naming convention', () => {
      Object.entries(template.Outputs).forEach(
        ([outputKey, output]: [string, any]) => {
          if (output.Export && output.Export.Name) {
            expect(output.Export.Name).toEqual({
              'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
            });
          }
        }
      );
    });
  });
});
