import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Secure Financial App Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Custom schema to correctly parse CloudFormation intrinsic functions
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
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAZs': data }),
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: data => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Equals': data }),
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: data => ({ 'Fn::If': data }),
      }),
    ]);

    // This path should point to your latest, optimized template file
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  test('should have a valid CloudFormation format version and description', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Description).toContain(
      'Secure AWS infrastructure for FinancialApp with SSM Session Manager Access (No Keys)'
    );
  });

  describe('🛡️ Core Security Requirements', () => {
    test('S3 Bucket should enforce AES-256 encryption and block public access', () => {
      const s3Bucket = template.Resources.ApplicationDataBucket;
      const encryption =
        s3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
      expect(
        s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        s3Bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });

    test('RDS DBInstance should enforce KMS encryption and have deletion protection', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'FinancialAppKMSKey' });
      expect(rds.Properties.DeletionProtection).toEqual({
        'Fn::If': ['IsProduction', true, false],
      });
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('CriticalOperationsRole must enforce MFA to be assumed', () => {
      const role = template.Resources.CriticalOperationsRole;
      const assumeRolePolicy =
        role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRolePolicy.Effect).toBe('Allow');
      expect(
        assumeRolePolicy.Condition.Bool['aws:MultiFactorAuthPresent']
      ).toBe('true');
    });

    test('API Gateway Stage should have access logging enabled', () => {
      const stage = template.Resources.ApiGatewayStage;
      const accessLogSettings = stage.Properties.AccessLogSetting;
      expect(accessLogSettings).toBeDefined();
      expect(accessLogSettings.DestinationArn).toEqual({
        'Fn::GetAtt': ['ApiGatewayLogGroup', 'Arn'],
      });
    });

    test('Security Groups must enforce default-deny and least privilege', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const appSg = template.Resources.AppServerSecurityGroup;

      const dbIngress = dbSg.Properties.SecurityGroupIngress[0];
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.SourceSecurityGroupId).toEqual({
        Ref: 'AppServerSecurityGroup',
      });

      const appIngressFromAlb = appSg.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 8080
      );

      expect(appIngressFromAlb.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });
  });

  describe('💻 Compute and Patch Management', () => {
    test('SSM PatchBaseline should be defined correctly', () => {
      const baseline = template.Resources.PatchBaseline;
      expect(baseline.Type).toBe('AWS::SSM::PatchBaseline');
      expect(baseline.Properties.OperatingSystem).toBe('AMAZON_LINUX_2');
    });

    test('EC2 Instance Role should have the SSM Managed Instance Core policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });
});
