import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Secure S3 bucket and IAM role for FinApp with encryption, access controls, and least-privilege permissions'
      );
    });
  });

  describe('Parameters', () => {
    test('should have no parameters', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Resources', () => {
    test('should have FinAppS3Bucket resource', () => {
      expect(template.Resources.FinAppS3Bucket).toBeDefined();
    });

    test('FinAppS3Bucket should be an S3 bucket', () => {
      const bucket = template.Resources.FinAppS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('FinAppS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.FinAppS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('FinAppS3Bucket should have public access blocked', () => {
      const bucket = template.Resources.FinAppS3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have FinAppS3AccessRole resource', () => {
      expect(template.Resources.FinAppS3AccessRole).toBeDefined();
    });

    test('FinAppS3AccessRole should be an IAM role', () => {
      const role = template.Resources.FinAppS3AccessRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('FinAppS3AccessRole should have EC2 trust policy', () => {
      const role = template.Resources.FinAppS3AccessRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should have FinAppS3AccessPolicy resource', () => {
      expect(template.Resources.FinAppS3AccessPolicy).toBeDefined();
    });

    test('FinAppS3AccessPolicy should be an IAM policy', () => {
      const policy = template.Resources.FinAppS3AccessPolicy;
      expect(policy.Type).toBe('AWS::IAM::Policy');
    });

    test('should have FinAppS3AccessInstanceProfile resource', () => {
      expect(template.Resources.FinAppS3AccessInstanceProfile).toBeDefined();
    });

    test('FinAppS3AccessInstanceProfile should be an IAM instance profile', () => {
      const profile = template.Resources.FinAppS3AccessInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3AccessRoleArn',
        'S3BucketArn',
        'InstanceProfileArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the secure S3 bucket for FinApp');
      expect(output.Value).toEqual({ Ref: 'FinAppS3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3BucketName',
      });
    });

    test('S3AccessRoleArn output should be correct', () => {
      const output = template.Outputs.S3AccessRoleArn;
      expect(output.Description).toBe('ARN of the IAM role for S3 access');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['FinAppS3AccessRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3AccessRoleArn',
      });
    });

    test('S3BucketArn output should be correct', () => {
      const output = template.Outputs.S3BucketArn;
      expect(output.Description).toBe('ARN of the secure S3 bucket');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['FinAppS3Bucket', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3BucketArn',
      });
    });

    test('InstanceProfileArn output should be correct', () => {
      const output = template.Outputs.InstanceProfileArn;
      expect(output.Description).toBe('ARN of the instance profile for EC2 attachment');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['FinAppS3AccessInstanceProfile', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-InstanceProfileArn',
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have exactly five resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(5);
    });

    test('should have no parameters section', () => {
      expect(template.Parameters).toBeUndefined();
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('bucket name should follow naming convention', () => {
      const bucket = template.Resources.FinAppS3Bucket;
      const bucketName = bucket.Properties.BucketName;

      expect(bucketName).toEqual({
        'Fn::Sub': 'finapp-secure-bucket-${AWS::AccountId}-${AWS::Region}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
