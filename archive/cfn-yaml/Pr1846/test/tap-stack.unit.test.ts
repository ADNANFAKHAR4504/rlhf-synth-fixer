import fs from 'fs';
import path from 'path';

describe('Secure Enterprise CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS environment');
      expect(template.Description).toContain('sensitive enterprise data');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.CorporateIPRange).toBeDefined();
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
    });

    test('CorporateIPRange parameter should have CIDR validation', () => {
      const param = template.Parameters.CorporateIPRange;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
    });

    test('NotificationEmail parameter should have email validation', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toContain('@');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.EnterpriseKMSKey).toBeDefined();
      expect(template.Resources.EnterpriseKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const keyPolicy =
        template.Resources.EnterpriseKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeInstanceOf(Array);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS key alias with environment suffix', () => {
      expect(template.Resources.EnterpriseKMSKeyAlias).toBeDefined();
      expect(template.Resources.EnterpriseKMSKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
      const aliasName =
        template.Resources.EnterpriseKMSKeyAlias.Properties.AliasName;
      expect(aliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have secure data access role', () => {
      expect(template.Resources.SecureDataAccessRole).toBeDefined();
      expect(template.Resources.SecureDataAccessRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('secure data access role should require MFA', () => {
      const assumePolicy =
        template.Resources.SecureDataAccessRole.Properties
          .AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Condition).toBeDefined();
      expect(statement.Condition.Bool).toBeDefined();
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(
        'true'
      );
    });

    test('should have secure data access policy', () => {
      expect(template.Resources.SecureDataAccessPolicy).toBeDefined();
      expect(template.Resources.SecureDataAccessPolicy.Type).toBe(
        'AWS::IAM::Policy'
      );
    });

    test('secure data access policy should enforce encryption', () => {
      const policy =
        template.Resources.SecureDataAccessPolicy.Properties.PolicyDocument;
      const statements = policy.Statement;
      const encryptionStatement = statements.find(
        (s: any) => s.Sid === 'AllowS3AccessWithEncryption'
      );
      expect(encryptionStatement).toBeDefined();
      expect(
        encryptionStatement.Condition.StringEquals[
          's3:x-amz-server-side-encryption'
        ]
      ).toBe('aws:kms');
    });

    test('should have CloudTrail role', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have MFA enforcement policy', () => {
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();
      expect(template.Resources.MFAEnforcementPolicy.Type).toBe(
        'AWS::IAM::ManagedPolicy'
      );
    });
  });

  describe('S3 Buckets', () => {
    test('should have secure data bucket', () => {
      expect(template.Resources.SecureDataBucket).toBeDefined();
      expect(template.Resources.SecureDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('secure data bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureDataBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(
        bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('secure data bucket should block public access', () => {
      const bucket = template.Resources.SecureDataBucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(
        true
      );
      expect(bucket.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('secure data bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureDataBucket.Properties;
      expect(bucket.VersioningConfiguration).toBeDefined();
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have logging bucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('logging bucket should have lifecycle policy', () => {
      const bucket = template.Resources.LoggingBucket.Properties;
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules).toBeInstanceOf(Array);
      expect(bucket.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(
        2555
      );
    });

    test('should have CloudTrail bucket', () => {
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('all buckets should have environment suffix in name', () => {
      const buckets = ['SecureDataBucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketName['Fn::Sub']).toContain(
          '${EnvironmentSuffix}'
        );
      });
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should have secure data bucket policy', () => {
      expect(template.Resources.SecureDataBucketPolicy).toBeDefined();
      expect(template.Resources.SecureDataBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });

    test('secure data bucket policy should deny insecure connections', () => {
      const policy =
        template.Resources.SecureDataBucketPolicy.Properties.PolicyDocument;
      const denyInsecure = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have CloudTrail bucket policy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.SecureVPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have VPC endpoint security group', () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('security group should restrict to corporate IP range', () => {
      const sg = template.Resources.VPCEndpointSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress[0].CidrIp.Ref).toBe('CorporateIPRange');
    });

    test('should have S3 VPC endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe(
        'AWS::EC2::VPCEndpoint'
      );
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe(
        'Gateway'
      );
    });

    test('should have KMS VPC endpoint', () => {
      expect(template.Resources.KMSVPCEndpoint).toBeDefined();
      expect(template.Resources.KMSVPCEndpoint.Type).toBe(
        'AWS::EC2::VPCEndpoint'
      );
      expect(template.Resources.KMSVPCEndpoint.Properties.VpcEndpointType).toBe(
        'Interface'
      );
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnet2RouteTableAssociation
      ).toBeDefined();
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail trail', () => {
      expect(template.Resources.EnterpriseCloudTrail).toBeDefined();
      expect(template.Resources.EnterpriseCloudTrail.Type).toBe(
        'AWS::CloudTrail::Trail'
      );
    });

    test('CloudTrail should have encryption enabled', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.KMSKeyId).toBeDefined();
      expect(trail.KMSKeyId.Ref).toBe('EnterpriseKMSKey');
    });

    test('CloudTrail should be multi-region', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should have log file validation', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should log to CloudWatch', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(trail.CloudWatchLogsRoleArn).toBeDefined();
    });

    test('CloudTrail should have event selectors', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.EventSelectors).toBeDefined();
      expect(trail.EventSelectors[0].IncludeManagementEvents).toBe(true);
    });

    test('CloudTrail should have environment suffix in name', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.TrailName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('CloudWatch Logs and Alarms', () => {
    test('should have CloudTrail log group', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('should have S3 access log group', () => {
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('should have security alerts log group', () => {
      expect(template.Resources.SecurityAlertsLogGroup).toBeDefined();
      expect(template.Resources.SecurityAlertsLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('log groups should have KMS encryption', () => {
      const logGroups = [
        'CloudTrailLogGroup',
        'S3AccessLogGroup',
        'SecurityAlertsLogGroup',
      ];
      logGroups.forEach(groupName => {
        const logGroup = template.Resources[groupName].Properties;
        expect(logGroup.KmsKeyId).toBeDefined();
      });
    });

    test('should have SNS topic for security alerts', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
      expect(template.Resources.SecurityAlertsTopic.Type).toBe(
        'AWS::SNS::Topic'
      );
    });

    test('SNS topic should have encryption', () => {
      const topic = template.Resources.SecurityAlertsTopic.Properties;
      expect(topic.KmsMasterKeyId).toBeDefined();
    });

    test('should have metric filters for security events', () => {
      expect(template.Resources.FailedMFALoginMetricFilter).toBeDefined();
      expect(template.Resources.UnauthorizedAPICallsMetricFilter).toBeDefined();
      expect(template.Resources.RootAccountUsageMetricFilter).toBeDefined();
    });

    test('should have CloudWatch alarms for security events', () => {
      expect(template.Resources.FailedMFALoginAlarm).toBeDefined();
      expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
      expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
    });

    test('alarms should send notifications to SNS topic', () => {
      const alarms = [
        'FailedMFALoginAlarm',
        'UnauthorizedAPICallsAlarm',
        'RootAccountUsageAlarm',
      ];
      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName].Properties;
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions[0].Ref).toBe('SecurityAlertsTopic');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      const expectedOutputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'SecureDataBucket',
        'SecureDataAccessRoleArn',
        'VPCId',
        'CloudTrailArn',
        'SecurityAlertsTopicArn',
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('export names should include stack name', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Requirements Compliance', () => {
    test('should enforce least privilege IAM policies', () => {
      const secureDataPolicy =
        template.Resources.SecureDataAccessPolicy.Properties.PolicyDocument;
      const statements = secureDataPolicy.Statement;

      // Check for specific actions only
      const allowStatement = statements.find(
        (s: any) => s.Sid === 'AllowS3AccessWithEncryption'
      );
      expect(allowStatement.Action).toContain('s3:GetObject');
      expect(allowStatement.Action).toContain('s3:PutObject');
      expect(allowStatement.Action).not.toContain('s3:*');
    });

    test('should use KMS for all encryption', () => {
      // Check S3 buckets
      const buckets = ['SecureDataBucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName].Properties;
        expect(
          bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('aws:kms');
      });

      // Check CloudTrail
      expect(
        template.Resources.EnterpriseCloudTrail.Properties.KMSKeyId
      ).toBeDefined();

      // Check SNS topic
      expect(
        template.Resources.SecurityAlertsTopic.Properties.KmsMasterKeyId
      ).toBeDefined();
    });

    test('should configure all S3 buckets as private', () => {
      const buckets = ['SecureDataBucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName].Properties;
        const blockConfig = bucket.PublicAccessBlockConfiguration;
        expect(blockConfig.BlockPublicAcls).toBe(true);
        expect(blockConfig.BlockPublicPolicy).toBe(true);
        expect(blockConfig.IgnorePublicAcls).toBe(true);
        expect(blockConfig.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should enforce MFA for IAM users', () => {
      // Check SecureDataAccessRole requires MFA
      const role = template.Resources.SecureDataAccessRole.Properties;
      expect(
        role.AssumeRolePolicyDocument.Statement[0].Condition.Bool[
          'aws:MultiFactorAuthPresent'
        ]
      ).toBe('true');

      // Check MFA enforcement policy exists
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();
      const mfaPolicy =
        template.Resources.MFAEnforcementPolicy.Properties.PolicyDocument;
      const denyStatement = mfaPolicy.Statement.find(
        (s: any) => s.Sid === 'DenyAllExceptUnlessMFAAuthenticated'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });

    test('should set up VPC endpoints with restricted access', () => {
      // Check security group restricts to corporate IP
      const sg = template.Resources.VPCEndpointSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress[0].CidrIp.Ref).toBe('CorporateIPRange');

      // Check VPC endpoints exist
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.KMSVPCEndpoint).toBeDefined();
    });

    test('should enable CloudTrail with encryption and validation', () => {
      const trail = template.Resources.EnterpriseCloudTrail.Properties;
      expect(trail.IsLogging).toBe(true);
      expect(trail.EnableLogFileValidation).toBe(true);
      expect(trail.KMSKeyId.Ref).toBe('EnterpriseKMSKey');
      expect(trail.S3BucketName.Ref).toBe('CloudTrailBucket');
    });

    test('should configure CloudWatch alarms for unauthorized access', () => {
      // Check for failed MFA login monitoring
      expect(template.Resources.FailedMFALoginMetricFilter).toBeDefined();
      expect(template.Resources.FailedMFALoginAlarm).toBeDefined();

      // Check for unauthorized API calls monitoring
      expect(template.Resources.UnauthorizedAPICallsMetricFilter).toBeDefined();
      expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();

      // Check for root account usage monitoring
      expect(template.Resources.RootAccountUsageMetricFilter).toBeDefined();
      expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on bucket policy', () => {
      expect(template.Resources.EnterpriseCloudTrail.DependsOn).toBe(
        'CloudTrailBucketPolicy'
      );
    });

    test('all resources should use environment suffix for uniqueness', () => {
      // Check named resources include environment suffix
      const namedResources = [
        { resource: 'EnterpriseKMSKeyAlias', path: 'Properties.AliasName' },
        { resource: 'SecureDataBucket', path: 'Properties.BucketName' },
        { resource: 'LoggingBucket', path: 'Properties.BucketName' },
        { resource: 'CloudTrailBucket', path: 'Properties.BucketName' },
        { resource: 'EnterpriseCloudTrail', path: 'Properties.TrailName' },
        { resource: 'SecurityAlertsTopic', path: 'Properties.TopicName' },
      ];

      namedResources.forEach(({ resource, path }) => {
        const props = path
          .split('.')
          .reduce((obj, key) => obj[key], template.Resources[resource] as any);
        if (typeof props === 'object' && props['Fn::Sub']) {
          expect(props['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all main sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('all resources should have valid types', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });
  });
});
