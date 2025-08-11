import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Custom YAML schema to parse CloudFormation intrinsic functions
const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: data => ({ Ref: data }) }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: data => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: data => ({ 'Fn::GetAtt': data.split('.') }),
  }),
  new yaml.Type('!Resolve', {
    kind: 'scalar',
    construct: data => ({ 'Fn::Resolve': data }),
  }),
]);

describe('TAP Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load and parse the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  // --- Test Suite: Parameters and Metadata ---
  describe('Parameters and Metadata', () => {
    test('should have the correct CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should define all required parameters correctly', () => {
      const params = template.Parameters;
      expect(Object.keys(params)).toHaveLength(3);
      expect(params.EnvironmentSuffix).toBeDefined();
      expect(params.TrustedIPForSSH).toBeDefined();
      expect(params.LatestAmiId).toBeDefined();
      expect(params.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });

    test('should have metadata for parameter grouping in the console', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata).toBeDefined();
      expect(metadata.ParameterGroups.length).toBe(2);
    });
  });

  // --- Test Suite: Security (IAM, KMS, Security Groups) ---
  describe('Security Configuration', () => {
    test('KMS Key should be created with retaining policies for protection', () => {
      const key = template.Resources.NovaKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.DeletionPolicy).toBe('Retain');
      expect(key.UpdateReplacePolicy).toBe('Retain');
    });

    test('KMS Key Policy should grant management to root and usage to the EC2 role', () => {
      const keyPolicy = template.Resources.NovaKMSKey.Properties.KeyPolicy;
      const adminStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'AllowAdminsToManageKey'
      );

      expect(adminStatement.Principal.AWS['Fn::Sub']).toBe(
        'arn:aws:iam::${AWS::AccountId}:root'
      );
      // Ensure it's not a wildcard action
      expect(adminStatement.Action).not.toContain('kms:*');
      expect(adminStatement.Action).toContain('kms:ScheduleKeyDeletion');
    });

    test('EC2AppRole should have a least-privilege inline policy', () => {
      const role = template.Resources.EC2AppRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const statements = policy.Statement;

      const s3Statement = statements.find(
        (s: any) => s.Sid === 'S3AccessPermissions'
      );
      const logsStatement = statements.find(
        (s: any) => s.Sid === 'CloudWatchLogsPermissions'
      );
      const kmsStatement = statements.find(
        (s: any) => s.Sid === 'KMSUsagePermission'
      );

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource[0]['Fn::GetAtt']).toEqual([
        'NovaDataBucket',
        'Arn',
      ]);

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Resource['Fn::Sub']).toContain(
        '/aws/ec2/nova-app-${AWS::Region}:*'
      );

      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Resource['Fn::GetAtt']).toEqual([
        'NovaKMSKey',
        'Arn',
      ]);
    });

    test('NovaSecurityGroup should allow inbound SSH only from the trusted IP', () => {
      const sg = template.Resources.NovaSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(22);
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.CidrIp).toEqual({ Ref: 'TrustedIPForSSH' });
    });
  });

  // --- Test Suite: Storage & Database ---
  describe('Storage & Database', () => {
    test('TurnAroundPromptTable (DynamoDB) should be encrypted with the KMS key', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');

      const sseSpec = table.Properties.SSESpecification;
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.KMSMasterKeyId).toEqual({ Ref: 'NovaKMSKey' });
    });

    test('NovaDataBucket (S3) should be encrypted and block public access', () => {
      const bucket = template.Resources.NovaDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'NovaKMSKey',
      });

      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  // --- Test Suite: Compute ---
  describe('Compute Infrastructure', () => {
    test('NovaEC2Instance should use a dynamic AMI and have its EBS volume encrypted', () => {
      const instance = template.Resources.NovaEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');

      // Verifies dynamic AMI parameter is used
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });

      const ebs = instance.Properties.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toEqual({ Ref: 'NovaKMSKey' });
    });
  });

  // --- Test Suite: Compliance ---
  describe('Compliance (AWS Config)', () => {
    test('should create three AWS Config rules', () => {
      const resources = template.Resources;
      const s3Rule = resources.S3EncryptionRule;
      const ebsRule = resources.EbsEncryptionRule;
      const iamRule = resources.IamRolePolicyCheck;

      expect(s3Rule).toBeDefined();
      expect(s3Rule.Type).toBe('AWS::Config::ConfigRule');
      expect(s3Rule.Properties.Source.SourceIdentifier).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );

      expect(ebsRule).toBeDefined();
      expect(ebsRule.Properties.Source.SourceIdentifier).toBe(
        'ENCRYPTED_VOLUMES'
      );

      expect(iamRule).toBeDefined();
    });
  });
});
