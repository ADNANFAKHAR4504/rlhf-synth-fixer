import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}. Please run 'pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json' first.`);
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBe('Security and Compliance CloudFormation Template with Multi-Region Support');
    });

    test('should contain Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters with defaults', () => {
      expect(template.Parameters.EnvironmentSuffix).toEqual(expect.objectContaining({ Type: 'String', Default: 'dev' }));
      expect(template.Parameters.DBInstanceClass).toEqual(expect.objectContaining({ Type: 'String', Default: 'db.t3.micro' }));
      expect(template.Parameters.AllowedIPRange).toEqual(expect.objectContaining({ Type: 'String', Default: '0.0.0.0/0' }));
    });
  });

  describe('KMS Resources', () => {
    const kmsKey = 'MasterKMSKey';
    test(`${kmsKey} should be defined and enabled for rotation`, () => {
      const resource = template.Resources[kmsKey];
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Key');
      expect(resource.Properties.EnableKeyRotation).toBe(true);
    });

    test(`${kmsKey} policy should grant admin permissions to root`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const rootStatement = policy.Statement[0];
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS['Fn::Sub']).toBe('arn:aws:iam::${AWS::AccountId}:root');
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test(`${kmsKey} policy should allow required services to use the key`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const serviceStatement = policy.Statement[1];
      expect(serviceStatement.Sid).toBe('Allow AWS services to use the key');
      expect(serviceStatement.Effect).toBe('Allow');
      expect(serviceStatement.Principal.Service).toEqual(expect.arrayContaining([
        'logs.amazonaws.com',
        'rds.amazonaws.com',
        'dynamodb.amazonaws.com',
        's3.amazonaws.com',
        'ec2.amazonaws.com',
        'autoscaling.amazonaws.com',
      ]));
      expect(serviceStatement.Action).toEqual(expect.arrayContaining([
        'kms:CreateGrant',
        'kms:Decrypt',
        'kms:DescribeKey'
      ]));
    });

    test(`${kmsKey} policy should allow service-linked roles for ASG and EC2`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const slrStatement = policy.Statement[2];
      expect(slrStatement.Sid).toBe('Allow service-linked roles for AutoScaling and EC2');
      expect(slrStatement.Effect).toBe('Allow');
      expect(slrStatement.Principal.AWS).toBe('*');
      expect(slrStatement.Action).toEqual(expect.arrayContaining([
        'kms:CreateGrant',
        'kms:GenerateDataKeyWithoutPlaintext'
      ]));
      const principalArns = slrStatement.Condition.StringLike['aws:PrincipalArn'];
      const normalized = principalArns.map((v: any) => (typeof v === 'string' ? v : v['Fn::Sub']));
      expect(normalized).toEqual(expect.arrayContaining([
        'arn:aws:iam::*:role/aws-service-role/autoscaling.amazonaws.com/*',
        'arn:aws:iam::*:role/aws-service-role/ec2.amazonaws.com/*'
      ]));
    });
  });

  describe('Networking and Security', () => {
    test('should create a VPC with public and private subnets', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.NATGateway1).toBeDefined();
    });

    test('ALBSecurityGroup should allow HTTP/HTTPS from the specified IP range', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(expect.arrayContaining([
        expect.objectContaining({ CidrIp: { Ref: 'AllowedIPRange' }, FromPort: 80, ToPort: 80 }),
        expect.objectContaining({ CidrIp: { Ref: 'AllowedIPRange' }, FromPort: 443, ToPort: 443 }),
      ]));
    });

    test('WebServerSecurityGroup should only allow traffic from the ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(expect.arrayContaining([
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' }, FromPort: 80 }),
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' }, FromPort: 443 }),
      ]));
    });

    test('DbSecurityGroup should only allow MySQL traffic from the WebServerSecurityGroup', () => {
      const sg = template.Resources.DbSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual([
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' }, FromPort: 3306, ToPort: 3306 }),
      ]);
    });

    test('WAF WebACL should be associated with the ALB', () => {
      const webAclAssoc = template.Resources.WebACLAssociation;
      expect(webAclAssoc).toBeDefined();
      expect(webAclAssoc.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });
  });

  describe('Data Stores (S3, DynamoDB, RDS)', () => {
    test('S3 Buckets should have KMS encryption, versioning, and public access block', () => {
      const buckets = ['CentralizedLogsBucket', 'ApplicationDataBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName].Properties;
        expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'MasterKMSKey' });
        expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
        expect(bucket.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('ApplicationDataBucket should have a lifecycle policy', () => {
      const bucket = template.Resources.ApplicationDataBucket.Properties;
      expect(bucket.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
      const ruleIds = bucket.LifecycleConfiguration.Rules.map((r: any) => r.Id);
      expect(ruleIds).toContain('TransitionToIA');
      expect(ruleIds).toContain('TransitionToGlacier');
      expect(ruleIds).toContain('DeleteOldVersions');
    });

    test('DynamoDB table should have KMS encryption and no backups', () => {
      const table = template.Resources.ApplicationTable.Properties;
      expect(table.SSESpecification.SSEEnabled).toBe(true);
      expect(table.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'MasterKMSKey' });
      expect(table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(false);
    });

    test('RDS instance should be Multi-AZ, encrypted, and have no backups or deletion protection', () => {
      const db = template.Resources.DbInstance.Properties;
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.BackupRetentionPeriod).toBe(0);
      expect(db.DeletionProtection).toBe(false);
    });
  });

  describe('Auto Scaling and EC2', () => {
    test('EC2LaunchTemplate should use SSM parameter for AMI and encrypted EBS', () => {
      const lt = template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
      const ebs = lt.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('AutoScalingGroup should use private subnets and the launch template', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
      expect(asg.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'EC2LaunchTemplate' });
    });

    test('EC2Role policy should contain permissions for S3, KMS, SecretsManager, DynamoDB and CloudWatch', () => {
      const policy = template.Resources.EC2Role.Properties.Policies[0].PolicyDocument;
      const statements = policy.Statement.map((s: any) => ({
        Action: s.Action,
        Resource: s.Resource
      }));

      // S3 permissions
      expect(statements).toContainEqual(expect.objectContaining({
        Action: expect.arrayContaining(['s3:ListBucket', 's3:GetBucketLocation']),
        Resource: { 'Fn::GetAtt': ['ApplicationDataBucket', 'Arn'] }
      }));
      // KMS permissions
      expect(statements).toContainEqual(expect.objectContaining({
        Action: expect.arrayContaining(['kms:Decrypt', 'kms:GenerateDataKey']),
        Resource: { 'Fn::GetAtt': ['MasterKMSKey', 'Arn'] }
      }));
      // Secrets Manager permissions
      expect(statements).toContainEqual(expect.objectContaining({
        Action: ['secretsmanager:GetSecretValue'],
        Resource: { Ref: 'DbSecret' }
      }));
      // DynamoDB permissions
      expect(statements).toContainEqual(expect.objectContaining({
        Action: expect.arrayContaining(['dynamodb:PutItem', 'dynamodb:GetItem']),
        Resource: { 'Fn::GetAtt': ['ApplicationTable', 'Arn'] }
      }));
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'CentralizedLogsBucket',
        'KMSKeyId',
        'RDSDatabaseEndpoint',
        'DynamoDBTableName',
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
  });
});
