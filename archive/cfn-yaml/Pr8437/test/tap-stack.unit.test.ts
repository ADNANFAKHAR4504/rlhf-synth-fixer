/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import * as fs from 'fs';
import * as path from 'path';

type CFNTemplate = {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Metadata?: Record<string, unknown>;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
};

describe('Secure Baseline CloudFormation Template', () => {
  let template: CFNTemplate;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent) as CFNTemplate;
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Minimal secure baseline for us-east-1 - excludes Config/CloudTrail per requirements'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((template.Metadata as any)['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = [
        'ResourcePrefix',
        'OwnerTag',
        'LogRetentionDays',
        'BucketNameSuffix',
        'Environment',
      ];
      expectedParams.forEach((param: string) => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.Environment;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('ResourcePrefix should default to Prod', () => {
      expect(template.Parameters.ResourcePrefix.Default).toBe('Prod');
    });

    test('OwnerTag should default to TechTeam', () => {
      expect(template.Parameters.OwnerTag.Default).toBe('TechTeam');
    });
  });

  describe('KMS Resources', () => {
    test('should have LogsKmsKey with correct properties', () => {
      const kmsKey = template.Resources.LogsKmsKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.Description).toBe('KMS key for CloudWatch Logs encryption');
    });

    test('should have S3KmsKey with correct properties', () => {
      const kmsKey = template.Resources.S3KmsKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.Description).toBe('KMS key for S3 bucket encryption');
    });

    test('KMS keys should have aliases with environment suffix', () => {
      expect(template.Resources.LogsKmsKeyAlias).toBeDefined();
      expect(template.Resources.S3KmsKeyAlias).toBeDefined();

      const logsAlias = template.Resources.LogsKmsKeyAlias;
      const s3Alias = template.Resources.S3KmsKeyAlias;

      expect(logsAlias.Properties.AliasName['Fn::Sub']).toBe(
        'alias/${ResourcePrefix}-logs-${Environment}'
      );
      expect(s3Alias.Properties.AliasName['Fn::Sub']).toBe(
        'alias/${ResourcePrefix}-s3-${Environment}'
      );
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have CentralLogGroup with KMS encryption', () => {
      const logGroup = template.Resources.CentralLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBe(
        '/${ResourcePrefix}/central-${Environment}'
      );
      expect(logGroup.Properties.KmsKeyId['Fn::GetAtt']).toEqual(['LogsKmsKey', 'Arn']);
      expect(logGroup.Properties.RetentionInDays.Ref).toBe('LogRetentionDays');
    });
  });

  describe('S3 Bucket', () => {
    test('should have SecureBucket with correct naming and encryption', () => {
      const bucket = template.Resources.SecureBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toBe(
        'prod-${BucketNameSuffix}-${Environment}-${AWS::AccountId}-${AWS::Region}'
      );

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should have SecureBucketPolicy with security enforcement', () => {
      const policy = template.Resources.SecureBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements: any[] = policy.Properties.PolicyDocument.Statement as any[];
      expect(statements.length).toBe(3);

      // Check for TLS enforcement
      const tlsStatement = statements.find((s: any) => s.Sid === 'DenyInsecureConnections');
      expect(tlsStatement).toBeDefined();
      expect(tlsStatement.Condition.Bool['aws:SecureTransport']).toBe(false);

      // Check for encryption enforcement
      const encryptionStatement = statements.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(encryptionStatement).toBeDefined();
      expect(
        encryptionStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']
      ).toBe('aws:kms');
    });

    test('should have public access blocked', () => {
      const bucket = template.Resources.SecureBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should have CentralLogsWriterRole with least privilege', () => {
      const role = template.Resources.CentralLogsWriterRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toBe(
        '${ResourcePrefix}-CentralLogsWriter-${Environment}'
      );

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CentralLogsWritePolicy');

      const statements: any[] = policy.PolicyDocument.Statement as any[];
      expect(statements.length).toBe(2);

      // Verify CreateLogStream and PutLogEvents permissions
      const writeStatement = statements.find((s: any) =>
        Array.isArray(s.Action) ? s.Action.includes('logs:CreateLogStream') : s.Action === 'logs:CreateLogStream'
      );
      expect(writeStatement).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(writeStatement.Action).toContain('logs:PutLogEvents');
      expect(writeStatement.Resource['Fn::Sub']).toBe('${CentralLogGroup.Arn}:*');
    });

    test('should have MFAEnforcementPolicy with correct restrictions', () => {
      const policy = template.Resources.MFAEnforcementPolicy;
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      expect(policy.Properties.ManagedPolicyName['Fn::Sub']).toBe(
        '${ResourcePrefix}-DenyWithoutMFA-${Environment}'
      );

      const statements: any[] = policy.Properties.PolicyDocument.Statement as any[];
      // Verify we have multiple statements for MFA management
      expect(statements.length).toBeGreaterThan(0);
      
      // Check for account info statement
      const accountInfoStmt = statements.find((s: any) => s.Sid === 'AllowViewAccountInfo');
      expect(accountInfoStmt).toBeDefined();
      expect(accountInfoStmt.Effect).toBe('Allow');
      
      // Check for MFA management statement
      const mfaManagementStmt = statements.find((s: any) => s.Sid === 'AllowManageOwnMFA');
      expect(mfaManagementStmt).toBeDefined();
      expect(mfaManagementStmt.Effect).toBe('Allow');
    });

    test('should have MFARequiredGroup', () => {
      const group = template.Resources.MFARequiredGroup;
      expect(group.Type).toBe('AWS::IAM::Group');
      expect(group.Properties.GroupName['Fn::Sub']).toBe(
        '${ResourcePrefix}-MFA-Required-${Environment}'
      );
      expect(group.Properties.ManagedPolicyArns).toContainEqual({ Ref: 'MFAEnforcementPolicy' });
    });
  });

  describe('Tagging', () => {
    test('all resources should have Owner tag', () => {
      const taggedResources = [
        'LogsKmsKey',
        'S3KmsKey',
        'CentralLogGroup',
        'SecureBucket',
        'CentralLogsWriterRole',
      ];

      taggedResources.forEach((resourceName: string) => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const ownerTag = (resource.Properties.Tags as any[]).find(
          (tag: any) => tag.Key === 'Owner'
        );
        expect(ownerTag).toBeDefined();
        expect(ownerTag.Value.Ref).toBe('OwnerTag');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'CentralLogGroupName',
        'CentralLogGroupArn',
        'SecureBucketName',
        'LogsKmsKeyArn',
        'S3KmsKeyArn',
        'MFARequiredGroupName',
        'CentralLogsWriterRoleArn',
      ];

      expectedOutputs.forEach((outputName: string) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach((outputKey: string) => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toBe(`\${AWS::StackName}-${outputKey}`);
      });
    });
  });

  describe('Security Compliance', () => {
    test('should not contain any prohibited services', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (resource: any) => resource.Type as string
      );
      const prohibitedTypes = [
        'AWS::Config::ConfigurationRecorder',
        'AWS::Config::DeliveryChannel',
        'AWS::CloudTrail::Trail',
      ];

      prohibitedTypes.forEach((type: string) => {
        expect(resourceTypes).not.toContain(type);
      });
    });

    test('should enforce encryption at rest for all storage', () => {
      // S3 bucket encryption
      const bucket = template.Resources.SecureBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      // CloudWatch Logs encryption
      const logGroup = template.Resources.CentralLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('should have proper resource naming with environment suffix', () => {
      const suffixedResources = [
        'CentralLogGroup',
        'SecureBucket',
        'CentralLogsWriterRole',
        'MFAEnforcementPolicy',
        'MFARequiredGroup',
      ];

      suffixedResources.forEach((resourceName: string) => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.LogGroupName ||
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.ManagedPolicyName ||
          resource.Properties.GroupName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${Environment}');
        }
      });
    });
  });
});
