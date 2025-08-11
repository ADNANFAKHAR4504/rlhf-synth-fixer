import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Secure Financial App Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Custom schema to correctly parse CloudFormation intrinsic functions like !Ref, !Sub, etc.
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
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Base64': data }),
      }),
    ]);

    // Path to the final, optimized CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  test('should have a valid CloudFormation format version and description', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Description).toContain(
      'Secure AWS infrastructure for FinancialApp'
    );
  });

  describe('🛡️ Core Security Requirements', () => {
    test('S3 Buckets should enforce AES-256 encryption and block public access', () => {
      const appBucket = template.Resources.ApplicationDataBucket;
      const logBucket = template.Resources.LoggingBucket;

      // Check Application Data Bucket
      const appEncryption =
        appBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(appEncryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
      expect(
        appBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);

      // Check Logging Bucket
      const logEncryption =
        logBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(logEncryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
      expect(
        logBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });

    test('RDS DBInstance should enforce KMS encryption and have deletion protection', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'FinancialAppKMSKey' });
      expect(rds.Properties.DeletionProtection).toBe(true);
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
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
    });

    test('Security Groups must enforce default-deny with specific ingress rules', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const appSg = template.Resources.AppServerSecurityGroup;

      // DB Security Group should only allow access from the App Server Security Group on the MySQL port
      const dbIngress = dbSg.Properties.SecurityGroupIngress[0];
      expect(dbIngress.IpProtocol).toBe('tcp');
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.SourceSecurityGroupId).toEqual({
        Ref: 'AppServerSecurityGroup',
      });

      // App Server Security Group should allow access from ALB and Bastion
      const appIngressFromAlb = appSg.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 8080
      );
      const appIngressFromBastion = appSg.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 22
      );
      expect(appIngressFromAlb.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
      expect(appIngressFromBastion.SourceSecurityGroupId).toEqual({
        Ref: 'BastionSecurityGroup',
      });
    });
  });

  describe('💻 Compute and Patch Management', () => {
    test('SSM PatchBaseline should be defined for AMAZON_LINUX_2', () => {
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

    test('Launch Template should declaratively tag instances for the Patch Group', () => {
      const lt = template.Resources.LaunchTemplate;
      const tagSpec = lt.Properties.LaunchTemplateData.TagSpecifications[0];
      const patchGroupTag = tagSpec.Tags.find(
        (t: any) => t.Key === 'PatchGroup'
      );
      expect(patchGroupTag).toBeDefined();
      expect(patchGroupTag.Value).toEqual({
        'Fn::Sub': '${AWS::StackName}-patch-group-${EnvironmentSuffix}',
      });
    });
  });
});
