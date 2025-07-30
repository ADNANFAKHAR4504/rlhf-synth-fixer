import fs from 'fs';
import path from 'path';

describe('TAP Stack CloudFormation Template', () => {
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
      expect(template.Description).toContain('TAP Stack');
    });

    test('should have metadata with interface parameters', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('should only define one parameter', () => {
      expect(Object.keys(template.Parameters).length).toBe(1);
    });
  });

  describe('Resources', () => {
    test('should include EC2 instance and S3 bucket', () => {
      expect(template.Resources.DevEC2Instance).toBeDefined();
      expect(template.Resources.DevS3Bucket).toBeDefined();
    });

    test('DevEC2Instance should be t2.micro with correct AMI', () => {
      const ec2 = template.Resources.DevEC2Instance;
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.InstanceType).toBe('t2.micro');
    });

    test('DevS3Bucket should be versioned and have correct name', () => {
      const bucket = template.Resources.DevS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toBe('dev-bucket-tapstack-2291831');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('resources should include Environment tag referencing EnvironmentSuffix', () => {
      const resources = ['DevEC2Instance', 'DevS3Bucket'];
      resources.forEach(name => {
        const tags = template.Resources[name].Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });
  });

  describe('Outputs', () => {
    test('should define EC2InstanceId and S3BucketName outputs', () => {
      expect(template.Outputs.EC2InstanceId).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
    });

    test('EC2InstanceId output should reference DevEC2Instance', () => {
      const output = template.Outputs.EC2InstanceId;
      expect(output.Description).toContain('InstanceId');
      expect(output.Value).toEqual({ Ref: 'DevEC2Instance' });
    });

    test('S3BucketName output should reference DevS3Bucket', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toContain('S3 bucket');
      expect(output.Value).toEqual({ Ref: 'DevS3Bucket' });
    });

    test('should have exactly 2 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBe(2);
    });
  });

  describe('Template Validation', () => {
    test('should be a valid object', () => {
      expect(typeof template).toBe('object');
      expect(template).toBeDefined();
    });

    test('should define exactly 2 resources', () => {
      expect(Object.keys(template.Resources).length).toBe(2);
    });
  });
});