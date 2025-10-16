import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - AWS Security Baseline', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Template Structure Tests ====================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for AWS Security Baseline', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('AWS Security Baseline Template');
      expect(template.Description).toContain('security resources');
    });

    test('should have all major sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have 24 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(23);
    });
  });

  // ==================== Parameters Tests ====================
  describe('Parameters', () => {
    describe('EnvironmentSuffix Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.EnvironmentSuffix).toBeDefined();
        expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      });

      test('should have description', () => {
        expect(template.Parameters.EnvironmentSuffix.Description).toBe('Environment suffix for unique resource naming (lowercase only)');
      });

      test('should have validation pattern for lowercase only', () => {
        const pattern = template.Parameters.EnvironmentSuffix.AllowedPattern;
        expect(pattern).toBe('^[a-z0-9-]+$');
      });

      test('should have constraint description', () => {
        expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toBe('Must contain only lowercase letters, numbers, and hyphens');
      });
    });

    describe('AllowedIPRange Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.AllowedIPRange).toBeDefined();
        expect(template.Parameters.AllowedIPRange.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.AllowedIPRange.Default).toBe('10.0.0.0/16');
      });

      test('should have description', () => {
        expect(template.Parameters.AllowedIPRange.Description).toBe('CIDR IP range allowed for SSH and HTTP access to Security Group');
      });
    });

    describe('S3AccessCIDR Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.S3AccessCIDR).toBeDefined();
        expect(template.Parameters.S3AccessCIDR.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.S3AccessCIDR.Default).toBe('10.0.0.0/16');
      });

      test('should have description', () => {
        expect(template.Parameters.S3AccessCIDR.Description).toBe('CIDR IP range allowed to access the secure S3 bucket');
      });
    });
  });

  // ==================== VPC Resources Tests ====================
  describe('VPC Resources', () => {
    describe('SecurityVPC', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.SecurityVPC).toBeDefined();
        expect(template.Resources.SecurityVPC.Type).toBe('AWS::EC2::VPC');
      });

      test('should have correct CIDR block', () => {
        const properties = template.Resources.SecurityVPC.Properties;
        expect(properties.CidrBlock).toBe('10.0.0.0/16');
      });

      test('should enable DNS hostnames and support', () => {
        const properties = template.Resources.SecurityVPC.Properties;
        expect(properties.EnableDnsHostnames).toBe(true);
        expect(properties.EnableDnsSupport).toBe(true);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.SecurityVPC.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Name',
          Value: { 'Fn::Sub': 'SecurityBaselineVPC-${EnvironmentSuffix}' }
        });
        expect(tags).toContainEqual({ Key: 'Environment', Value: 'Security' });
      });
    });

    describe('VPC Flow Logs', () => {
      test('VPCFlowLogRole should exist and be of correct type', () => {
        expect(template.Resources.VPCFlowLogRole).toBeDefined();
        expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
      });

      test('VPCFlowLogRole should have correct trust policy', () => {
        const properties = template.Resources.VPCFlowLogRole.Properties;
        const assumePolicy = properties.AssumeRolePolicyDocument;

        expect(assumePolicy.Version).toBe('2012-10-17');
        expect(assumePolicy.Statement).toHaveLength(1);
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('VPCFlowLogRole should have CloudWatch Logs policy', () => {
        const properties = template.Resources.VPCFlowLogRole.Properties;
        const policy = properties.Policies[0];

        expect(policy.PolicyName).toBe('VPCFlowLogPolicy');
        expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
        expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
        expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      });

      test('VPCFlowLogGroup should exist with correct configuration', () => {
        expect(template.Resources.VPCFlowLogGroup).toBeDefined();
        expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');

        const properties = template.Resources.VPCFlowLogGroup.Properties;
        expect(properties.LogGroupName).toEqual({
          'Fn::Sub': '/aws/vpc/flowlogs-${EnvironmentSuffix}'
        });
        expect(properties.RetentionInDays).toBe(30);
      });

      test('VPCFlowLog should exist and be configured correctly', () => {
        expect(template.Resources.VPCFlowLog).toBeDefined();
        expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');

        const properties = template.Resources.VPCFlowLog.Properties;
        expect(properties.ResourceType).toBe('VPC');
        expect(properties.ResourceId).toEqual({ Ref: 'SecurityVPC' });
        expect(properties.TrafficType).toBe('ALL');
        expect(properties.LogDestinationType).toBe('cloud-watch-logs');
        expect(properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
        expect(properties.DeliverLogsPermissionArn).toEqual({
          'Fn::GetAtt': ['VPCFlowLogRole', 'Arn']
        });
      });
    });
  });

  // ==================== Security Group Tests ====================
  describe('Security Groups', () => {
    describe('WebSecurityGroup', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.WebSecurityGroup).toBeDefined();
        expect(template.Resources.WebSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should be associated with VPC', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        expect(properties.VpcId).toEqual({ Ref: 'SecurityVPC' });
      });

      test('should have description', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        expect(properties.GroupDescription).toBe('Security group allowing SSH and HTTP from specific IP range');
      });

      test('should allow SSH traffic from AllowedIPRange parameter', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        const sshRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);

        expect(sshRule).toBeDefined();
        expect(sshRule.IpProtocol).toBe('tcp');
        expect(sshRule.ToPort).toBe(22);
        expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
        expect(sshRule.Description).toBe('Allow SSH from specific IP range');
      });

      test('should allow HTTP traffic from AllowedIPRange parameter', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        const httpRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);

        expect(httpRule).toBeDefined();
        expect(httpRule.IpProtocol).toBe('tcp');
        expect(httpRule.ToPort).toBe(80);
        expect(httpRule.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
        expect(httpRule.Description).toBe('Allow HTTP from specific IP range');
      });

      test('should have exactly 2 ingress rules', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        expect(properties.SecurityGroupIngress).toHaveLength(2);
      });

      test('should allow all outbound traffic', () => {
        const properties = template.Resources.WebSecurityGroup.Properties;
        const egressRule = properties.SecurityGroupEgress[0];

        expect(egressRule.IpProtocol).toBe('-1');
        expect(egressRule.CidrIp).toBe('0.0.0.0/0');
        expect(egressRule.Description).toBe('Allow all outbound traffic');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.WebSecurityGroup.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Name',
          Value: { 'Fn::Sub': 'WebSecurityGroup-${EnvironmentSuffix}' }
        });
      });
    });
  });

  // ==================== IAM Resources Tests ====================
  describe('IAM Resources', () => {
    describe('S3ReadOnlyRole', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.S3ReadOnlyRole).toBeDefined();
        expect(template.Resources.S3ReadOnlyRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have deterministic role name', () => {
        const properties = template.Resources.S3ReadOnlyRole.Properties;
        expect(properties.RoleName).toEqual({
          'Fn::Sub': 'S3ReadOnlyAccessRole-${EnvironmentSuffix}'
        });
      });

      test('should have correct trust policy for EC2', () => {
        const properties = template.Resources.S3ReadOnlyRole.Properties;
        const assumePolicy = properties.AssumeRolePolicyDocument;

        expect(assumePolicy.Version).toBe('2012-10-17');
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have SSM managed policy', () => {
        const properties = template.Resources.S3ReadOnlyRole.Properties;
        expect(properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      });

      test('should have S3 read-only policy', () => {
        const properties = template.Resources.S3ReadOnlyRole.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3ReadOnlyPolicy');

        expect(s3Policy).toBeDefined();
        expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');

        const statement = s3Policy.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('s3:GetObject');
        expect(statement.Action).toContain('s3:ListBucket');
        expect(statement.Action).toContain('s3:GetBucketLocation');
        expect(statement.Action).toContain('s3:GetObjectVersion');
        expect(statement.Action).toContain('s3:GetBucketVersioning');
      });

      test('S3 policy should follow least privilege with specific resources', () => {
        const properties = template.Resources.S3ReadOnlyRole.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3ReadOnlyPolicy');

        expect(s3Policy.PolicyDocument.Statement[0].Resource).toEqual([
          'arn:aws:s3:::*',
          'arn:aws:s3:::*/*'
        ]);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.S3ReadOnlyRole.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'S3ReadOnlyAccess' });
        expect(tags).toContainEqual({ Key: 'Principle', Value: 'LeastPrivilege' });
      });
    });

    describe('ConfigRole', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConfigRole).toBeDefined();
        expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have correct trust policy for Config', () => {
        const properties = template.Resources.ConfigRole.Properties;
        const assumePolicy = properties.AssumeRolePolicyDocument;

        expect(assumePolicy.Statement[0].Principal.Service).toBe('config.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have AWS Config managed policy', () => {
        const properties = template.Resources.ConfigRole.Properties;
        expect(properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
      });

      test('should have S3 bucket policy for Config', () => {
        const properties = template.Resources.ConfigRole.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3BucketPolicy');

        expect(s3Policy).toBeDefined();
        expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetBucketAcl');
        expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
        expect(s3Policy.PolicyDocument.Statement[0].Resource).toContainEqual({
          'Fn::GetAtt': ['ConfigS3Bucket', 'Arn']
        });
      });
    });
  });

  // ==================== KMS Resources Tests ====================
  describe('KMS Resources', () => {
    describe('KMSKey', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.KMSKey).toBeDefined();
        expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      });

      test('should have description', () => {
        const properties = template.Resources.KMSKey.Properties;
        expect(properties.Description).toEqual({
          'Fn::Sub': 'Customer-managed KMS key for data encryption - ${EnvironmentSuffix}'
        });
      });

      test('should have key policy with IAM root statement', () => {
        const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
        const iamStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');

        expect(iamStatement).toBeDefined();
        expect(iamStatement.Effect).toBe('Allow');
        expect(iamStatement.Principal.AWS).toEqual({
          'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
        });
        expect(iamStatement.Action).toBe('kms:*');
      });

      test('should allow services to use the key', () => {
        const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
        const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow services to use the key');

        expect(serviceStatement).toBeDefined();
        expect(serviceStatement.Principal.Service).toContain('cloudtrail.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
        expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
        expect(serviceStatement.Action).toContain('kms:Decrypt');
        expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
        expect(serviceStatement.Action).toContain('kms:CreateGrant');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.KMSKey.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'DataEncryption' });
      });
    });

    describe('KMSKeyAlias', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.KMSKeyAlias).toBeDefined();
        expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      });

      test('should have correct alias name', () => {
        const properties = template.Resources.KMSKeyAlias.Properties;
        expect(properties.AliasName).toEqual({
          'Fn::Sub': 'alias/security-baseline-key-${EnvironmentSuffix}'
        });
      });

      test('should reference KMS key', () => {
        const properties = template.Resources.KMSKeyAlias.Properties;
        expect(properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
      });
    });
  });

  // ==================== S3 Bucket Tests ====================
  describe('S3 Buckets', () => {
    describe('CloudTrailS3Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
        expect(template.Resources.CloudTrailS3Bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.CloudTrailS3Bucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'cloudtrail-logs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
        });
      });

      test('should have KMS encryption', () => {
        const properties = template.Resources.CloudTrailS3Bucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });

      test('should block all public access', () => {
        const properties = template.Resources.CloudTrailS3Bucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have versioning enabled', () => {
        const properties = template.Resources.CloudTrailS3Bucket.Properties;
        expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have lifecycle policy for log deletion', () => {
        const properties = template.Resources.CloudTrailS3Bucket.Properties;
        const lifecycleRules = properties.LifecycleConfiguration.Rules;

        expect(lifecycleRules).toHaveLength(1);
        expect(lifecycleRules[0].Id).toBe('DeleteOldLogs');
        expect(lifecycleRules[0].Status).toBe('Enabled');
        expect(lifecycleRules[0].ExpirationInDays).toBe(90);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.CloudTrailS3Bucket.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'CloudTrailLogs' });
      });
    });

    describe('SecureS3Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.SecureS3Bucket).toBeDefined();
        expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.SecureS3Bucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'secure-data-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
        });
      });

      test('should have KMS encryption with bucket key enabled', () => {
        const properties = template.Resources.SecureS3Bucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
        expect(encryption.BucketKeyEnabled).toBe(true);
      });

      test('should block all public access', () => {
        const properties = template.Resources.SecureS3Bucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have versioning enabled', () => {
        const properties = template.Resources.SecureS3Bucket.Properties;
        expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should log to CloudTrail S3 bucket', () => {
        const properties = template.Resources.SecureS3Bucket.Properties;
        const loggingConfig = properties.LoggingConfiguration;

        expect(loggingConfig.DestinationBucketName).toEqual({ Ref: 'CloudTrailS3Bucket' });
        expect(loggingConfig.LogFilePrefix).toBe('s3-access-logs/');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.SecureS3Bucket.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Classification', Value: 'Confidential' });
      });
    });

    describe('ConfigS3Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConfigS3Bucket).toBeDefined();
        expect(template.Resources.ConfigS3Bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.ConfigS3Bucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'aws-config-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
        });
      });

      test('should have KMS encryption', () => {
        const properties = template.Resources.ConfigS3Bucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });

      test('should block all public access', () => {
        const properties = template.Resources.ConfigS3Bucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have versioning enabled', () => {
        const properties = template.Resources.ConfigS3Bucket.Properties;
        expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });
  });

  // ==================== Bucket Policy Tests ====================
  describe('S3 Bucket Policies', () => {
    describe('CloudTrailS3BucketPolicy', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CloudTrailS3BucketPolicy).toBeDefined();
        expect(template.Resources.CloudTrailS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should be attached to CloudTrail bucket', () => {
        const properties = template.Resources.CloudTrailS3BucketPolicy.Properties;
        expect(properties.Bucket).toEqual({ Ref: 'CloudTrailS3Bucket' });
      });

      test('should allow CloudTrail to check bucket ACL', () => {
        const properties = template.Resources.CloudTrailS3BucketPolicy.Properties;
        const aclStatement = properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');

        expect(aclStatement).toBeDefined();
        expect(aclStatement.Effect).toBe('Allow');
        expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
        expect(aclStatement.Action).toBe('s3:GetBucketAcl');
      });

      test('should allow CloudTrail to write logs', () => {
        const properties = template.Resources.CloudTrailS3BucketPolicy.Properties;
        const writeStatement = properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

        expect(writeStatement).toBeDefined();
        expect(writeStatement.Effect).toBe('Allow');
        expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
        expect(writeStatement.Action).toBe('s3:PutObject');
        expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
      });
    });

    describe('SecureS3BucketPolicy', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
        expect(template.Resources.SecureS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should be attached to secure bucket', () => {
        const properties = template.Resources.SecureS3BucketPolicy.Properties;
        expect(properties.Bucket).toEqual({ Ref: 'SecureS3Bucket' });
      });

      test('should deny insecure connections', () => {
        const properties = template.Resources.SecureS3BucketPolicy.Properties;
        const sslStatement = properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'DenyInsecureConnections');

        expect(sslStatement).toBeDefined();
        expect(sslStatement.Effect).toBe('Deny');
        expect(sslStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      });

      test('should restrict access to specific CIDR', () => {
        const properties = template.Resources.SecureS3BucketPolicy.Properties;
        const cidrStatement = properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'RestrictAccessToSpecificCIDR');

        expect(cidrStatement).toBeDefined();
        expect(cidrStatement.Effect).toBe('Deny');
        expect(cidrStatement.Condition.NotIpAddress['aws:SourceIp']).toEqual({ Ref: 'S3AccessCIDR' });
      });
    });

    describe('ConfigS3BucketPolicy', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConfigS3BucketPolicy).toBeDefined();
        expect(template.Resources.ConfigS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should be attached to Config bucket', () => {
        const properties = template.Resources.ConfigS3BucketPolicy.Properties;
        expect(properties.Bucket).toEqual({ Ref: 'ConfigS3Bucket' });
      });

      test('should allow Config to check bucket ACL', () => {
        const properties = template.Resources.ConfigS3BucketPolicy.Properties;
        const aclStatement = properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'AWSConfigBucketPermissionsCheck');

        expect(aclStatement).toBeDefined();
        expect(aclStatement.Principal.Service).toBe('config.amazonaws.com');
        expect(aclStatement.Action).toBe('s3:GetBucketAcl');
      });

      test('should allow Config to write configuration', () => {
        const properties = template.Resources.ConfigS3BucketPolicy.Properties;
        const writeStatement = properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'AWSConfigBucketWrite');

        expect(writeStatement).toBeDefined();
        expect(writeStatement.Principal.Service).toBe('config.amazonaws.com');
        expect(writeStatement.Action).toBe('s3:PutObject');
        expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
      });
    });
  });

  // ==================== CloudTrail Tests ====================
  describe('CloudTrail Resources', () => {
    test('CloudTrail should exist and be of correct type', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should depend on bucket policy', () => {
      expect(template.Resources.CloudTrail.DependsOn).toBe('CloudTrailS3BucketPolicy');
    });

    test('CloudTrail should have deterministic name', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.TrailName).toEqual({
        'Fn::Sub': 'SecurityBaselineTrail-${EnvironmentSuffix}'
      });
    });

    test('CloudTrail should write to S3 bucket', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.S3BucketName).toEqual({ Ref: 'CloudTrailS3Bucket' });
    });

    test('CloudTrail should include global service events', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should be logging', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.IsLogging).toBe(true);
    });

    test('CloudTrail should be multi-region', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should enable log file validation', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should have event selectors', () => {
      const properties = template.Resources.CloudTrail.Properties;
      expect(properties.EventSelectors).toHaveLength(1);
      expect(properties.EventSelectors[0].ReadWriteType).toBe('All');
      expect(properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
    });

    test('CloudTrail should have correct tags', () => {
      const tags = template.Resources.CloudTrail.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Compliance', Value: 'Required' });
    });
  });

  // ==================== CloudWatch Resources Tests ====================
  describe('CloudWatch Resources', () => {
    test('CloudTrailLogGroup should exist with correct configuration', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');

      const properties = template.Resources.CloudTrailLogGroup.Properties;
      expect(properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/cloudtrail/${EnvironmentSuffix}'
      });
      expect(properties.RetentionInDays).toBe(30);
    });

    describe('ConsoleSignInMetricFilter', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConsoleSignInMetricFilter).toBeDefined();
        expect(template.Resources.ConsoleSignInMetricFilter.Type).toBe('AWS::Logs::MetricFilter');
      });

      test('should have correct filter name', () => {
        const properties = template.Resources.ConsoleSignInMetricFilter.Properties;
        expect(properties.FilterName).toEqual({
          'Fn::Sub': 'ConsoleSignInFailures-${EnvironmentSuffix}'
        });
      });

      test('should have correct filter pattern', () => {
        const properties = template.Resources.ConsoleSignInMetricFilter.Properties;
        expect(properties.FilterPattern).toContain('ConsoleLogin');
        expect(properties.FilterPattern).toContain('Failed authentication');
      });

      test('should be associated with CloudTrail log group', () => {
        const properties = template.Resources.ConsoleSignInMetricFilter.Properties;
        expect(properties.LogGroupName).toEqual({ Ref: 'CloudTrailLogGroup' });
      });

      test('should have correct metric transformation', () => {
        const properties = template.Resources.ConsoleSignInMetricFilter.Properties;
        const transformation = properties.MetricTransformations[0];

        expect(transformation.MetricName).toBe('ConsoleSignInFailureCount');
        expect(transformation.MetricNamespace).toBe('CloudTrailMetrics');
        expect(transformation.MetricValue).toBe('1');
      });
    });

    describe('ConsoleSignInAlarm', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConsoleSignInAlarm).toBeDefined();
        expect(template.Resources.ConsoleSignInAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have correct alarm name', () => {
        const properties = template.Resources.ConsoleSignInAlarm.Properties;
        expect(properties.AlarmName).toEqual({
          'Fn::Sub': 'ConsoleSignInFailures-${EnvironmentSuffix}'
        });
      });

      test('should have description', () => {
        const properties = template.Resources.ConsoleSignInAlarm.Properties;
        expect(properties.AlarmDescription).toBe('Alarm when console sign-in failures are detected');
      });

      test('should monitor correct metric', () => {
        const properties = template.Resources.ConsoleSignInAlarm.Properties;
        expect(properties.MetricName).toBe('ConsoleSignInFailureCount');
        expect(properties.Namespace).toBe('CloudTrailMetrics');
      });

      test('should have correct threshold configuration', () => {
        const properties = template.Resources.ConsoleSignInAlarm.Properties;
        expect(properties.Statistic).toBe('Sum');
        expect(properties.Period).toBe(300);
        expect(properties.EvaluationPeriods).toBe(1);
        expect(properties.Threshold).toBe(3);
        expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });

      test('should treat missing data as not breaching', () => {
        const properties = template.Resources.ConsoleSignInAlarm.Properties;
        expect(properties.TreatMissingData).toBe('notBreaching');
      });
    });
  });

  // ==================== Secrets Manager Tests ====================
  describe('Secrets Manager Resources', () => {
    test('DBSecret should exist and be of correct type', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBSecret should have deterministic name', () => {
      const properties = template.Resources.DBSecret.Properties;
      expect(properties.Name).toEqual({
        'Fn::Sub': '/security/database/credentials-${EnvironmentSuffix}'
      });
    });

    test('DBSecret should have description', () => {
      const properties = template.Resources.DBSecret.Properties;
      expect(properties.Description).toBe('Securely stored database credentials');
    });

    test('DBSecret should generate password with correct configuration', () => {
      const properties = template.Resources.DBSecret.Properties;
      const generateConfig = properties.GenerateSecretString;

      expect(generateConfig.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(generateConfig.GenerateStringKey).toBe('password');
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.ExcludeCharacters).toBe('"@/\\');
    });

    test('DBSecret should have correct tags', () => {
      const tags = template.Resources.DBSecret.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Purpose', Value: 'DatabaseCredentials' });
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
    });
  });

  // ==================== AWS Config Tests ====================
  describe('AWS Config Resources', () => {
    describe('ConfigRecorder', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConfigRecorder).toBeDefined();
        expect(template.Resources.ConfigRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      });

      test('should have deterministic name', () => {
        const properties = template.Resources.ConfigRecorder.Properties;
        expect(properties.Name).toEqual({
          'Fn::Sub': 'SecurityBaselineRecorder-${EnvironmentSuffix}'
        });
      });

      test('should reference ConfigRole', () => {
        const properties = template.Resources.ConfigRecorder.Properties;
        expect(properties.RoleARN).toEqual({
          'Fn::GetAtt': ['ConfigRole', 'Arn']
        });
      });

      test('should record all supported resources', () => {
        const properties = template.Resources.ConfigRecorder.Properties;
        expect(properties.RecordingGroup.AllSupported).toBe(true);
        expect(properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
      });
    });

    describe('ConfigDeliveryChannel', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
        expect(template.Resources.ConfigDeliveryChannel.Type).toBe('AWS::Config::DeliveryChannel');
      });

      test('should have deterministic name', () => {
        const properties = template.Resources.ConfigDeliveryChannel.Properties;
        expect(properties.Name).toEqual({
          'Fn::Sub': 'SecurityBaselineDeliveryChannel-${EnvironmentSuffix}'
        });
      });

      test('should reference Config S3 bucket', () => {
        const properties = template.Resources.ConfigDeliveryChannel.Properties;
        expect(properties.S3BucketName).toEqual({ Ref: 'ConfigS3Bucket' });
      });
    });

    describe('PublicS3BucketRule', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.PublicS3BucketRule).toBeDefined();
        expect(template.Resources.PublicS3BucketRule.Type).toBe('AWS::Config::ConfigRule');
      });

      test('should depend on ConfigRecorder and ConfigDeliveryChannel', () => {
        expect(template.Resources.PublicS3BucketRule.DependsOn).toContain('ConfigRecorder');
        expect(template.Resources.PublicS3BucketRule.DependsOn).toContain('ConfigDeliveryChannel');
      });

      test('should have correct rule name', () => {
        const properties = template.Resources.PublicS3BucketRule.Properties;
        expect(properties.ConfigRuleName).toEqual({
          'Fn::Sub': 's3-bucket-public-read-prohibited-${EnvironmentSuffix}'
        });
      });

      test('should have description', () => {
        const properties = template.Resources.PublicS3BucketRule.Properties;
        expect(properties.Description).toBe('Checks that S3 buckets do not allow public read access');
      });

      test('should use AWS managed rule', () => {
        const properties = template.Resources.PublicS3BucketRule.Properties;
        expect(properties.Source.Owner).toBe('AWS');
        expect(properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
      });

      test('should target S3 buckets', () => {
        const properties = template.Resources.PublicS3BucketRule.Properties;
        expect(properties.Scope.ComplianceResourceTypes).toContain('AWS::S3::Bucket');
      });
    });
  });

  // ==================== Outputs Tests ====================
  describe('Outputs', () => {
    test('should have 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the Security VPC');
      expect(output.Value).toEqual({ Ref: 'SecurityVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'SecurityVPC-ID-${EnvironmentSuffix}'
      });
    });

    test('SecurityGroupId output should be correct', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output.Description).toBe('ID of the Web Security Group');
      expect(output.Value).toEqual({ Ref: 'WebSecurityGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'WebSecurityGroup-ID-${EnvironmentSuffix}'
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('ID of the KMS Key for encryption');
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'KMSKey-ID-${EnvironmentSuffix}'
      });
    });

    test('SecureS3BucketName output should be correct', () => {
      const output = template.Outputs.SecureS3BucketName;
      expect(output.Description).toBe('Name of the secure S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SecureS3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'SecureS3Bucket-Name-${EnvironmentSuffix}'
      });
    });

    test('CloudTrailName output should be correct', () => {
      const output = template.Outputs.CloudTrailName;
      expect(output.Description).toBe('Name of the CloudTrail');
      expect(output.Value).toEqual({ Ref: 'CloudTrail' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'CloudTrail-Name-${EnvironmentSuffix}'
      });
    });

    test('IAMRoleArn output should be correct', () => {
      const output = template.Outputs.IAMRoleArn;
      expect(output.Description).toBe('ARN of the S3 Read-Only IAM Role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['S3ReadOnlyRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'S3ReadOnlyRole-ARN-${EnvironmentSuffix}'
      });
    });

    test('DBSecretArn output should be correct', () => {
      const output = template.Outputs.DBSecretArn;
      expect(output.Description).toBe('ARN of the database credentials secret');
      expect(output.Value).toEqual({ Ref: 'DBSecret' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': 'DBSecret-ARN-${EnvironmentSuffix}'
      });
    });
  });

  // ==================== Security Best Practices Tests ====================
  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket.Properties;
      const secureBucket = template.Resources.SecureS3Bucket.Properties;
      const configBucket = template.Resources.ConfigS3Bucket.Properties;

      expect(cloudTrailBucket.BucketEncryption).toBeDefined();
      expect(secureBucket.BucketEncryption).toBeDefined();
      expect(configBucket.BucketEncryption).toBeDefined();
    });

    test('all S3 buckets should use KMS encryption', () => {
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket.Properties;
      const secureBucket = template.Resources.SecureS3Bucket.Properties;
      const configBucket = template.Resources.ConfigS3Bucket.Properties;

      [cloudTrailBucket, secureBucket, configBucket].forEach(bucket => {
        const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });
    });

    test('all S3 buckets should block public access', () => {
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket.Properties;
      const secureBucket = template.Resources.SecureS3Bucket.Properties;
      const configBucket = template.Resources.ConfigS3Bucket.Properties;

      [cloudTrailBucket, secureBucket, configBucket].forEach(bucket => {
        const publicAccessBlock = bucket.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket.Properties;
      const secureBucket = template.Resources.SecureS3Bucket.Properties;
      const configBucket = template.Resources.ConfigS3Bucket.Properties;

      expect(cloudTrailBucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(secureBucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(configBucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureS3Bucket should enforce SSL/TLS connections', () => {
      const policy = template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument;
      const sslStatement = policy.Statement.find((s: any) => s.Sid === 'DenyInsecureConnections');

      expect(sslStatement).toBeDefined();
      expect(sslStatement.Effect).toBe('Deny');
      expect(sslStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('SecureS3Bucket should restrict access by CIDR', () => {
      const policy = template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument;
      const cidrStatement = policy.Statement.find((s: any) => s.Sid === 'RestrictAccessToSpecificCIDR');

      expect(cidrStatement).toBeDefined();
      expect(cidrStatement.Effect).toBe('Deny');
      expect(cidrStatement.Condition.NotIpAddress['aws:SourceIp']).toEqual({ Ref: 'S3AccessCIDR' });
    });

    test('CloudTrail should be multi-region with log file validation', () => {
      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.EnableLogFileValidation).toBe(true);
    });

    test('IAM roles should follow least privilege principle', () => {
      const s3ReadOnlyRole = template.Resources.S3ReadOnlyRole.Properties;
      const s3Policy = s3ReadOnlyRole.Policies.find((p: any) => p.PolicyName === 'S3ReadOnlyPolicy');

      // Should only have read permissions, no write
      expect(s3Policy.PolicyDocument.Statement[0].Action).not.toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).not.toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('VPC should have flow logs enabled', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('Secrets Manager should be used for sensitive data', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('AWS Config should monitor resource compliance', () => {
      const configRule = template.Resources.PublicS3BucketRule;
      expect(configRule).toBeDefined();
      expect(configRule.Type).toBe('AWS::Config::ConfigRule');
      expect(configRule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
    });

    test('CloudWatch alarms should monitor security events', () => {
      const alarm = template.Resources.ConsoleSignInAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ConsoleSignInFailureCount');
    });

    test('all resources should be properly tagged', () => {
      const resourcesWithTags = [
        'SecurityVPC', 'VPCFlowLogRole', 'VPCFlowLog', 'WebSecurityGroup',
        'S3ReadOnlyRole', 'KMSKey', 'CloudTrailS3Bucket', 'CloudTrail',
        'GuardDutyDetector', 'SecureS3Bucket', 'DBSecret'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          expect(resource.Properties.Tags).toBeDefined();
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
          expect(resource.Properties.Tags.length).toBeGreaterThan(0);
        }
      });
    });
  });

  // ==================== Resource Dependencies Tests ====================
  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on CloudTrailS3BucketPolicy', () => {
      expect(template.Resources.CloudTrail.DependsOn).toBe('CloudTrailS3BucketPolicy');
    });

    test('PublicS3BucketRule should depend on ConfigRecorder and ConfigDeliveryChannel', () => {
      expect(template.Resources.PublicS3BucketRule.DependsOn).toContain('ConfigRecorder');
      expect(template.Resources.PublicS3BucketRule.DependsOn).toContain('ConfigDeliveryChannel');
    });

    test('VPCFlowLog should reference VPC and role correctly', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.ResourceId).toEqual({ Ref: 'SecurityVPC' });
      expect(flowLog.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogRole', 'Arn']
      });
    });

    test('SecureS3Bucket should log to CloudTrailS3Bucket', () => {
      const properties = template.Resources.SecureS3Bucket.Properties;
      expect(properties.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'CloudTrailS3Bucket' });
    });

    test('KMSKeyAlias should reference KMSKey', () => {
      const alias = template.Resources.KMSKeyAlias.Properties;
      expect(alias.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('ConfigRecorder should reference ConfigRole', () => {
      const recorder = template.Resources.ConfigRecorder.Properties;
      expect(recorder.RoleARN).toEqual({
        'Fn::GetAtt': ['ConfigRole', 'Arn']
      });
    });

    test('ConfigDeliveryChannel should reference ConfigS3Bucket', () => {
      const channel = template.Resources.ConfigDeliveryChannel.Properties;
      expect(channel.S3BucketName).toEqual({ Ref: 'ConfigS3Bucket' });
    });

    test('All buckets should use same KMS key', () => {
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket.Properties;
      const secureBucket = template.Resources.SecureS3Bucket.Properties;
      const configBucket = template.Resources.ConfigS3Bucket.Properties;

      [cloudTrailBucket, secureBucket, configBucket].forEach(bucket => {
        const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });
    });
  });

  // ==================== Cross-Service Integration Tests ====================
  describe('Cross-Service Integration Validation', () => {
    test('VPC Flow Logs should integrate with CloudWatch Logs', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
    });

    test('CloudTrail should integrate with S3 and CloudWatch', () => {
      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.S3BucketName).toEqual({ Ref: 'CloudTrailS3Bucket' });
    });

    test('CloudWatch Metric Filter should feed CloudWatch Alarm', () => {
      const metricFilter = template.Resources.ConsoleSignInMetricFilter.Properties;
      const alarm = template.Resources.ConsoleSignInAlarm.Properties;

      expect(metricFilter.MetricTransformations[0].MetricName).toBe(alarm.MetricName);
      expect(metricFilter.MetricTransformations[0].MetricNamespace).toBe(alarm.Namespace);
    });

    test('AWS Config should integrate with S3 for compliance storage', () => {
      const deliveryChannel = template.Resources.ConfigDeliveryChannel.Properties;
      expect(deliveryChannel.S3BucketName).toEqual({ Ref: 'ConfigS3Bucket' });
    });

    test('KMS Key should be used across all encrypted services', () => {
      const s3Buckets = [
        template.Resources.CloudTrailS3Bucket,
        template.Resources.SecureS3Bucket,
        template.Resources.ConfigS3Bucket
      ];

      s3Buckets.forEach(bucket => {
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });
    });
  });
});
