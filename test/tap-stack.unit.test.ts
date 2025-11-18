import fs from 'fs';
import path from 'path';
import { yamlParse } from 'yaml-cfn';
import { execSync } from 'child_process';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('AWS Config CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yamlParse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('AWS Config');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have ConfigKMSKey resource', () => {
      expect(template.Resources.ConfigKMSKey).toBeDefined();
    });

    test('ConfigKMSKey should be a KMS Key', () => {
      const key = template.Resources.ConfigKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('should have ConfigBucket resource', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
    });

    test('ConfigBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ConfigBucket should have correct deletion policy', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('ConfigBucket should have versioning enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucket should have encryption with KMS', () => {
      const bucket = template.Resources.ConfigBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have ConfigTopic resource', () => {
      expect(template.Resources.ConfigTopic).toBeDefined();
    });

    test('ConfigTopic should be an SNS Topic', () => {
      const topic = template.Resources.ConfigTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have ConfigRole resource', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
    });

    test('ConfigRole should be an IAM Role', () => {
      const role = template.Resources.ConfigRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have ConfigRecorder resource', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
    });

    test('ConfigRecorder should be a Config Recorder', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('should have ConfigDeliveryChannel resource', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
    });

    test('ConfigDeliveryChannel should be a Config Delivery Channel', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should have Config Rules', () => {
      expect(template.Resources.EncryptedVolumesRule).toBeDefined();
      expect(template.Resources.S3BucketPublicReadRule).toBeDefined();
      expect(template.Resources.RequiredTagsRule).toBeDefined();
    });

    test('Config Rules should be AWS::Config::ConfigRule type', () => {
      expect(template.Resources.EncryptedVolumesRule.Type).toBe('AWS::Config::ConfigRule');
      expect(template.Resources.S3BucketPublicReadRule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('should have EventBridge Rule for compliance monitoring', () => {
      expect(template.Resources.ConfigComplianceEventRule).toBeDefined();
      expect(template.Resources.ConfigComplianceEventRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have CloudWatch Log Group', () => {
      expect(template.Resources.ConfigLogGroup).toBeDefined();
      expect(template.Resources.ConfigLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ConfigBucketName',
        'ConfigBucketArn',
        'ConfigTopicArn',
        'ConfigRecorderName',
        'ConfigRoleArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ConfigBucketName output should be correct', () => {
      const output = template.Outputs.ConfigBucketName;
      expect(output.Description).toContain('Config S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ConfigBucket' });
    });

    test('ConfigBucketArn output should be correct', () => {
      const output = template.Outputs.ConfigBucketArn;
      expect(output.Description).toContain('ARN of the Config S3 bucket');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ConfigBucket', 'Arn'],
      });
    });

    test('ConfigTopicArn output should be correct', () => {
      const output = template.Outputs.ConfigTopicArn;
      expect(output.Description).toContain('Config SNS topic');
      expect(output.Value).toEqual({ Ref: 'ConfigTopic' });
    });

    test('ConfigRecorderName output should be correct', () => {
      const output = template.Outputs.ConfigRecorderName;
      expect(output.Description).toContain('Config recorder');
      expect(output.Value).toEqual({ Ref: 'ConfigRecorder' });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
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

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5);
    });

    test('should have EnvironmentSuffix parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(1);
    });

    test('should have at least 7 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('bucket name should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.ConfigBucket;
      const bucketName = bucket.Properties.BucketName;

      expect(bucketName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
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

    test('resource names should include environment suffix', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.Name).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('CloudFormation Syntax Validation', () => {
    test('should validate template with cfn-lint (if available)', () => {
      try {
        execSync('cfn-lint --version', { stdio: 'ignore' });
        const result = execSync(
          'cfn-lint lib/TapStack.yml',
          { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
        );
        // If no errors, cfn-lint returns empty output
        expect(result).toBeDefined();
      } catch (error: any) {
        // cfn-lint not installed or validation failed
        if (error.message.includes('cfn-lint: command not found')) {
          console.warn('cfn-lint not installed, skipping validation');
        } else {
          throw error;
        }
      }
    });
  });
});
