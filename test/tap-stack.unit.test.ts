import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('IaC - AWS Nova Model Breaking Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAtt': data.split('.') }),
      }),
    ]);

    // IMPORTANT: Update this path to point to your CloudFormation template file
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Parameters & Metadata', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain('IaC - AWS Nova Model Breaking');
    });

    test('should define all required parameters with correct types and defaults', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(3);

      expect(params.EnvironmentSuffix).toBeDefined();
      expect(params.EnvironmentSuffix.Type).toBe('String');
      expect(params.EnvironmentSuffix.Default).toBe('dev');

      expect(params.ConfigBucketName).toBeDefined();
      expect(params.ConfigBucketName.Type).toBe('String');

      expect(params.SampleS3BucketName).toBeDefined();
      expect(params.SampleS3BucketName.Type).toBe('String');
    });

    test('should have correctly configured metadata for the console', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata).toBeDefined();
      const paramGroup = metadata.ParameterGroups[0];
      expect(paramGroup.Label.default).toBe('Environment Configuration');
      expect(paramGroup.Parameters).toEqual([
        'EnvironmentSuffix',
        'ConfigBucketName',
        'SampleS3BucketName',
      ]);
    });
  });

  describe('IAM MFA Enforcement', () => {
    test('MfaEnforcedPolicy should deny all actions if MFA is not present', () => {
      const policy = template.Resources.MfaEnforcedPolicy;
      expect(policy).toBeDefined();

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Action).toBe('*');
      expect(statement.Resource).toBe('*');
      expect(
        statement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']
      ).toBe('false');
    });

    test('MfaEnforcedUsersGroup should be created and attached to the MFA policy', () => {
      const group = template.Resources.MfaEnforcedUsersGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::IAM::Group');
      expect(group.Properties.ManagedPolicyArns[0]).toEqual({
        Ref: 'MfaEnforcedPolicy',
      });
    });
  });

  describe('AWS Config Setup and S3 Security', () => {
    test('ConfigBucket should be private and have versioning enabled', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket).toBeDefined();
      const props = bucket.Properties;
      expect(props.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucketPolicy should grant necessary permissions to the Config service', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      expect(policy).toBeDefined();
      const statements = policy.Properties.PolicyDocument.Statement;

      const getAclStatement = statements.find(
        (s: any) => s.Action === 's3:GetBucketAcl'
      );
      expect(getAclStatement.Principal.Service).toContain(
        'config.amazonaws.com'
      );
      expect(getAclStatement.Effect).toBe('Allow');

      const putObjectStatement = statements.find(
        (s: any) => s.Action === 's3:PutObject'
      );
      expect(putObjectStatement.Principal.Service).toContain(
        'config.amazonaws.com'
      );
      expect(putObjectStatement.Effect).toBe('Allow');
    });

    test('ConfigurationRecorder should be set to record all resources', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder).toBeDefined();
      const recordingGroup = recorder.Properties.RecordingGroup;
      expect(recordingGroup.AllSupported).toBe(true);
      expect(recordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('S3 public access rules should be configured correctly', () => {
      const readRule = template.Resources.S3PublicReadProhibitedRule;
      expect(readRule).toBeDefined();
      expect(readRule.Properties.Source.Owner).toBe('AWS');
      expect(readRule.Properties.Source.SourceIdentifier).toBe(
        'S3_BUCKET_PUBLIC_READ_PROHIBITED'
      );

      const writeRule = template.Resources.S3PublicWriteProhibitedRule;
      expect(writeRule).toBeDefined();
      expect(writeRule.Properties.Source.Owner).toBe('AWS');
      expect(writeRule.Properties.Source.SourceIdentifier).toBe(
        'S3_BUCKET_PUBLIC_WRITE_PROHIBITED'
      );
    });
  });

  describe('Demonstration Resources', () => {
    test('SampleS3Bucket should be private', () => {
      const bucket = template.Resources.SampleS3Bucket;
      expect(bucket).toBeDefined();
      const props = bucket.Properties;
      expect(props.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs with exports', () => {
      const outputs = template.Outputs;
      const outputKeys = Object.keys(outputs);

      expect(outputKeys.length).toBe(6);
      expect(outputs.MfaEnforcedUsersGroupName).toBeDefined();
      expect(outputs.ConfigBucketNameOutput).toBeDefined();
      expect(outputs.SampleS3BucketNameOutput).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();

      outputKeys.forEach(key => {
        expect(outputs[key].Export).toBeDefined();
        expect(outputs[key].Export.Name['Fn::Sub']).toContain(
          '${AWS::StackName}'
        );
      });
    });
  });
});
