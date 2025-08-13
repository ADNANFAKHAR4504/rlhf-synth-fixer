import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Custom YAML schema to parse CloudFormation intrinsic functions
const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: data => ({ Ref: data }) }),
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
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: data => ({ 'Fn::FindInMap': data }),
  }),
]);

describe('Secure Baseline Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the final, corrected CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  // --- Test Suite: Parameters and Mappings ---
  describe('Parameters & Mappings', () => {
    it('should define an EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    it('should define a region-to-AMI mapping', () => {
      expect(template.Mappings.RegionAMIMap).toBeDefined();
      expect(template.Mappings.RegionAMIMap['us-east-1'].AMI).toBeDefined();
      expect(template.Mappings.RegionAMIMap['us-west-2'].AMI).toBeDefined();
    });
  });

  // --- Test Suite: Tagging Compliance ---
  describe('Tagging Strategy', () => {
    // Helper function to test for standard tags
    const expectStandardTags = (resource: any) => {
      expect(resource.Properties.Tags).toContainEqual({
        Key: 'Owner',
        Value: 'YourName',
      });
      expect(resource.Properties.Tags).toContainEqual({
        Key: 'Purpose',
        Value: 'Nova-App-Baseline',
      });
    };

    it('should apply standard tags to the KMS Key', () => {
      expectStandardTags(template.Resources.NovaKMSKey);
    });

    it('should apply standard tags to the S3 Bucket', () => {
      expectStandardTags(template.Resources.NovaDataBucket);
    });

    it('should apply standard tags to the IAM Role', () => {
      expectStandardTags(template.Resources.EC2AppRole);
    });

    it('should apply standard tags to the EC2 Instance', () => {
      expectStandardTags(template.Resources.NovaEC2Instance);
    });
  });

  // --- Test Suite: Security (IAM, KMS, Security Groups) ---
  describe('Security Configuration', () => {
    it('KMS Key should have a Retain deletion policy and a root-administrative policy', () => {
      const kmsKey = template.Resources.NovaKMSKey;
      expect(kmsKey.DeletionPolicy).toBe('Retain');

      const keyPolicy = kmsKey.Properties.KeyPolicy;
      const adminStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'AllowAdminsToManageKey'
      );
      expect(adminStatement.Effect).toBe('Allow');
      expect(adminStatement.Action).toBe('kms:*');
      expect(adminStatement.Principal.AWS['Fn::Sub']).toBe(
        'arn:aws:iam::${AWS::AccountId}:root'
      );
    });

    it('KMS Key Alias should be set correctly', () => {
      const alias = template.Resources.NovaKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBe('alias/nova-app-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'NovaKMSKey' });
    });

    it('EC2AppRole should NOT have a hardcoded name (Best Practice)', () => {
      const role = template.Resources.EC2AppRole;
      // Best practice is to let CloudFormation name the role to avoid conflicts.
      expect(role.Properties.RoleName).toBeUndefined();
    });

    it('EC2AppRole policy should grant least-privilege access to S3, CloudWatch, and KMS', () => {
      const rolePolicy = template.Resources.EC2AppRole.Properties.Policies[0];
      const statements = rolePolicy.PolicyDocument.Statement;

      const s3Statement = statements.find(
        (s: any) => s.Sid === 'S3ReadOnlyAccess'
      );
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toEqual(['s3:GetObject', 's3:ListBucket']);
      expect(s3Statement.Resource).toContainEqual({
        'Fn::GetAtt': ['NovaDataBucket', 'Arn'],
      });

      const logsStatement = statements.find(
        (s: any) => s.Sid === 'CloudWatchLogsAccess'
      );
      expect(logsStatement.Effect).toBe('Allow');
      expect(logsStatement.Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ]);

      const kmsStatement = statements.find((s: any) => s.Sid === 'KMSAccess');
      expect(kmsStatement.Effect).toBe('Allow');
      expect(kmsStatement.Action).toEqual([
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ]);
      expect(kmsStatement.Resource).toEqual({
        'Fn::GetAtt': ['NovaKMSKey', 'Arn'],
      });
    });

    it('NovaSecurityGroup should have no ingress rules and allow HTTPS egress', () => {
      const sg = template.Resources.NovaSecurityGroup;
      // This is the correct way to test for no ingress rules.
      expect(sg.Properties.SecurityGroupIngress).toBeUndefined();

      // It should, however, allow outbound traffic for updates and API calls.
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
      expect(sg.Properties.SecurityGroupEgress[0].FromPort).toBe(443);
    });
  });

  // --- Test Suite: Storage & Compute ---
  describe('Storage & Compute Infrastructure', () => {
    it('NovaDataBucket (S3) should be encrypted, versioned, and block public access', () => {
      const bucket = template.Resources.NovaDataBucket;

      // Test Encryption
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        encryption.ServerSideEncryptionByDefault.KMSMasterKeyID['Fn::GetAtt']
      ).toEqual(['NovaKMSKey', 'Arn']);

      // Test Public Access Block
      const pubBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pubBlock.BlockPublicAcls).toBe(true);
      expect(pubBlock.BlockPublicPolicy).toBe(true);
      expect(pubBlock.IgnorePublicAcls).toBe(true);
      expect(pubBlock.RestrictPublicBuckets).toBe(true);

      // Test Versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    it('NovaEC2Instance should use FindInMap for its AMI and be a t3.micro', () => {
      const instance = template.Resources.NovaEC2Instance;
      const imageIdMapping = instance.Properties.ImageId['Fn::FindInMap'];
      expect(imageIdMapping[0]).toBe('RegionAMIMap');
      expect(imageIdMapping[1]).toEqual({ Ref: 'AWS::Region' });
      expect(imageIdMapping[2]).toBe('AMI');

      expect(instance.Properties.InstanceType).toBe('t3.micro');
    });

    it('NovaEC2Instance root volume should be encrypted with the regional KMS key', () => {
      const instance = template.Resources.NovaEC2Instance;
      const ebs = instance.Properties.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toEqual({ Ref: 'NovaKMSKey' });
    });
  });

  // --- Test Suite: Compliance & Monitoring ---
  describe('Compliance & Monitoring', () => {
    it('should NOT include an obsolete custom resource or Lambda to start Config', () => {
      // These tests now correctly assert that the outdated resources are GONE.
      expect(template.Resources.ConfigRecorderStatus).toBeUndefined();
      expect(template.Resources.ConfigRecorderFunction).toBeUndefined();
    });

    it('should correctly configure the AWS Config recorder for regional resources', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      // This is critical for StackSet deployments to prevent conflicts.
      expect(
        recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes
      ).toBe(false);
    });

    it('should deploy the three required AWS managed Config Rules', () => {
      const s3Rule = template.Resources.S3EncryptionRule;
      expect(s3Rule).toBeDefined();
      expect(s3Rule.Properties.Source.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );

      const ebsRule = template.Resources.EbsEncryptionRule;
      expect(ebsRule).toBeDefined();
      expect(ebsRule.Properties.Source.SourceIdentifier).toBe(
        'ENCRYPTED_VOLUMES'
      );

      const iamRule = template.Resources.IamRolePolicyCheckRule;
      expect(iamRule).toBeDefined();
      expect(iamRule.Properties.Source.SourceIdentifier).toBe(
        'IAM_ROLE_MANAGED_POLICY_CHECK'
      );
    });
  });
});
