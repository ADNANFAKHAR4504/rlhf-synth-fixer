import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}. If your YAML is the source, run 'pipenv run cfn-flip lib/TapStack.yml >lib/TapStack.json' first.`);
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have the correct description', () => {
      expect(template.Description).toBe('Secure, production-ready AWS infrastructure for financial services application with comprehensive security controls');
    });

    test('should contain Parameters, Mappings, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters with defaults', () => {
      expect(template.Parameters.EnvironmentSuffix).toEqual(expect.objectContaining({ Type: 'String', Default: 'dev' }));
      expect(template.Parameters.TrustedIPRange).toEqual(expect.objectContaining({ Type: 'String', Default: '10.0.0.0/8' }));
      expect(template.Parameters.NotificationEmail).toEqual(expect.objectContaining({ Type: 'String', Default: 'demo@gmail.com' }));
      expect(template.Parameters.DBEngine).toEqual(expect.objectContaining({ Type: 'String', Default: 'mysql' }));
    });
  });

  describe('KMS Resources', () => {
    const kmsKey = 'KMSKey';
    test(`${kmsKey} should be defined with deletion policies`, () => {
      const resource = template.Resources[kmsKey];
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Key');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.UpdateReplacePolicy).toBe('Delete');
    });

    test(`${kmsKey} policy should grant admin permissions to root`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const rootStatement = policy.Statement.find((s: any) => s.Sid === 'Enable IAM policies');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS['Fn::Sub']).toBe('arn:aws:iam::${AWS::AccountId}:root');
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test(`${kmsKey} policy should allow required services to use the key`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const servicesStatement = policy.Statement.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(servicesStatement).toBeDefined();
      expect(servicesStatement.Effect).toBe('Allow');
      expect(servicesStatement.Principal.Service).toEqual(expect.arrayContaining([
        's3.amazonaws.com',
        'logs.amazonaws.com',
        'rds.amazonaws.com',
        'cloudtrail.amazonaws.com',
        'ec2.amazonaws.com',
        'autoscaling.amazonaws.com'
      ]));
      expect(servicesStatement.Action).toEqual(expect.arrayContaining([
        'kms:Decrypt',
        'kms:GenerateDataKey',
        'kms:CreateGrant'
      ]));
    });
  });

  describe('Networking and Security', () => {
    test('should create a VPC with public, private, and database subnets', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.NATGateway1).toBeDefined();
    });

    test('ALBSecurityGroup should allow HTTP/HTTPS from the internet', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(expect.arrayContaining([
        expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 80, ToPort: 80 }),
        expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 443, ToPort: 443 }),
      ]));
    });
     
    test('BastionSecurityGroup should only allow SSH from TrustedIPRange', () => {
        const sg = template.Resources.BastionSecurityGroup.Properties;
        expect(sg.SecurityGroupIngress).toEqual([
            expect.objectContaining({ CidrIp: { Ref: 'TrustedIPRange' }, FromPort: 22, ToPort: 22 }),
        ]);
    });

    test('ApplicationSecurityGroup should allow traffic from ALB and SSH from TrustedIPRange', () => {
      const sg = template.Resources.ApplicationSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(expect.arrayContaining([
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' }, FromPort: 80 }),
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' }, FromPort: 443 }),
        expect.objectContaining({ CidrIp: { Ref: 'TrustedIPRange' }, FromPort: 22, ToPort: 22 }),
      ]));
    });

    test('DatabaseSecurityGroup should only allow MySQL traffic from ApplicationSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual([
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'ApplicationSecurityGroup' }, FromPort: 3306, ToPort: 3306 }),
      ]);
    });
  });

  describe('S3 Buckets and RDS', () => {
    test('All S3 Buckets should have versioning and public access block', () => {
      const buckets = [
        'ApplicationDataBucket', 
        'LoggingBucket', 
        'BackupReplicaBucket', 
        'BackupBucket',
        'CloudTrailBucket',
        'ConfigBucket'
      ];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName].Properties;
        expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
        expect(bucket.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('Critical S3 Buckets should use KMS encryption', () => {
        const kmsBuckets = [
            'ApplicationDataBucket',
            'BackupReplicaBucket', 
            'BackupBucket',
            'CloudTrailBucket',
            'ConfigBucket'
        ];
        kmsBuckets.forEach(bucketName => {
            const bucket = template.Resources[bucketName].Properties;
            const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
            expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
            expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
        });
    });

    test('LoggingBucket should use AES256 encryption', () => {
        const bucket = template.Resources.LoggingBucket.Properties;
        const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('BackupBucket should have replication configured', () => {
        const bucket = template.Resources.BackupBucket.Properties;
        expect(bucket.ReplicationConfiguration).toBeDefined();
        expect(bucket.ReplicationConfiguration.Role).toEqual({ 'Fn::GetAtt': ['S3ReplicationRole', 'Arn'] });
        expect(bucket.ReplicationConfiguration.Rules[0].Destination.Bucket).toEqual({ 'Fn::GetAtt': ['BackupReplicaBucket', 'Arn'] });
        expect(bucket.ReplicationConfiguration.Rules[0].Status).toBe('Enabled');
    });

    test('RDS instance should be Multi-AZ, encrypted, with backups and deletion policies', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.DeletionProtection).toBe(false);
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Auto Scaling and EC2', () => {
    test('EC2LaunchTemplate should use AL2023 SSM parameter and encrypted EBS', () => {
      const lt = template.Resources.ApplicationLaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}');
      const ebs = lt.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
    });

    test('AutoScalingGroup should use private subnets and the launch template', () => {
      const asg = template.Resources.ApplicationAutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
      expect(asg.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'ApplicationLaunchTemplate' });
    });

    test('ApplicationRole policy should contain permissions for S3, KMS, and CloudWatch', () => {
      const policy = template.Resources.ApplicationRole.Properties.Policies.find((p: any) => p.PolicyName === 'ApplicationS3Access');
      const statements = policy.PolicyDocument.Statement;

      // S3 permissions
      const s3Statement = statements.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toEqual([ { 'Fn::Sub': '${ApplicationDataBucket.Arn}/*' } ]);

      // KMS permissions
      const kmsStatement = statements.find((s: any) => s.Action.includes('kms:Decrypt'));
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Resource).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
      
      // CloudWatch Logs (inline policy)
      const cwPolicy = template.Resources.ApplicationRole.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
      const cwStatement = cwPolicy.PolicyDocument.Statement[0];
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Action).toEqual(expect.arrayContaining(['logs:CreateLogStream', 'logs:PutLogEvents']));
      
      // CloudWatch Agent (managed policy)
      expect(template.Resources.ApplicationRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });
  });

  describe('Security and Monitoring', () => {
    test('CloudTrail should be multi-region, validating logs, and logging to S3/CWL', () => {
        const trail = template.Resources.CloudTrail.Properties;
        expect(trail.IsMultiRegionTrail).toBe(true);
        expect(trail.EnableLogFileValidation).toBe(true);
        expect(trail.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
        expect(trail.CloudWatchLogsLogGroupArn).toEqual({ 'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn'] });
    });

    test('GuardDuty Detector should be enabled', () => {
        const detector = template.Resources.GuardDutyDetector.Properties;
        expect(detector.Enable).toBe(true);
    });

    test('Metric Filters for critical security events should exist', () => {
        const rootFilter = template.Resources.RootAccountUsageMetricFilter.Properties;
        expect(rootFilter).toBeDefined();
        expect(rootFilter.FilterPattern).toContain('$.userIdentity.type = "Root"');
        
        const sgFilter = template.Resources.SecurityGroupChangesMetricFilter.Properties;
        expect(sgFilter).toBeDefined();
        expect(sgFilter.FilterPattern).toContain('eventName = "AuthorizeSecurityGroupIngress"');

        const s3PolicyFilter = template.Resources.S3BucketPolicyChangesMetricFilter.Properties;
        expect(s3PolicyFilter).toBeDefined();
        expect(s3PolicyFilter.FilterPattern).toContain('eventName = "PutBucketPolicy"');

        const unauthorizedFilter = template.Resources.UnauthorizedAPICallsMetricFilter.Properties;
        expect(unauthorizedFilter).toBeDefined();
        expect(unauthorizedFilter.FilterPattern).toContain('errorCode = "AccessDenied*"');
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ApplicationLoadBalancerDNS',
        'ApplicationDataBucketName',
        'DBEndpoint',
        'KMSKeyId',
        'CloudTrailName',
        'AlarmTopicArn'
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
  });
});

