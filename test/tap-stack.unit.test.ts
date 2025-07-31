import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Web Application Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON using pipenv run cfn-flip-to-json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for secure web application', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure, scalable web application infrastructure with multi-region deployment, GDPR compliance, and comprehensive security controls.'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
          .length
      ).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters including new ones', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'ProjectName',
        'VpcCidr',
        'PublicSubnetCidr',
        'PrivateSubnetCidr',
        'BastionSshCidr',
        'WebServerAmiId',
        'InstanceType',
        'MinInstances',
        'MaxInstances',
        'WebAppPort',
        'DataRetentionDays',
        'AdminMfaRequired',
        'AdminUserEmail',
      ];

      const actualParams = Object.keys(template.Parameters);

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });

      expect(actualParams.length).toBe(expectedParams.length);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-web-app');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
    });

    test('DataRetentionDays parameter should have proper constraints', () => {
      const param = template.Parameters.DataRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(365);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(3650);
    });

    test('BastionSshCidr parameter should have restricted default', () => {
      const param = template.Parameters.BastionSshCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('203.0.113.0/24');
      expect(param.Description).toContain('MUST be restricted');
    });

    test('WebServerAmiId parameter should exist and be of type AWS::EC2::Image::Id', () => {
      const param = template.Parameters.WebServerAmiId;
      expect(param.Type).toBe('AWS::EC2::Image::Id');
      expect(param.Default).toBeDefined();
      expect(param.Description).toBeDefined();
    });

    test('InstanceType parameter should have correct default', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
    });

    test('MinInstances and MaxInstances parameters should have correct defaults', () => {
      const minParam = template.Parameters.MinInstances;
      const maxParam = template.Parameters.MaxInstances;
      expect(minParam.Type).toBe('Number');
      expect(minParam.Default).toBe(2);
      expect(maxParam.Type).toBe('Number');
      expect(maxParam.Default).toBe(4);
    });

    test('WebAppPort parameter should have correct default', () => {
      const param = template.Parameters.WebAppPort;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(8080);
    });

    test('AdminMfaRequired parameter should have correct properties', () => {
      const param = template.Parameters.AdminMfaRequired;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('AdminUserEmail parameter should exist and have AllowedPattern', () => {
      const emailParam = template.Parameters.AdminUserEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.AllowedPattern).toBeDefined();
    });
  });

  describe('Conditions', () => {
    test('EnforceMfa condition should be defined', () => {
      expect(template.Conditions.EnforceMfa).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.SecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKMSKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });

    test('KMS key should have Retain deletion policy', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      expect(kmsKey.DeletionPolicy).toBe('Retain');
    });

    test('KMS key policy should allow RDS and DynamoDB service principals', () => {
      const kmsKeyPolicy =
        template.Resources.SecurityKMSKey.Properties.KeyPolicy.Statement;
      const rdsStatement = kmsKeyPolicy.find(
        (s: any) => s.Sid === 'Allow RDS to use the key'
      );
      const dynamoStatement = kmsKeyPolicy.find(
        (s: any) => s.Sid === 'Allow DynamoDB to use the key'
      );

      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Principal.Service).toBe('dynamodb.amazonaws.com');
    });

    test('should have GuardDuty detector enabled', () => {
      expect(template.Resources.GuardDutyDetector).toBeDefined();
      expect(template.Resources.GuardDutyDetector.Type).toBe(
        'AWS::GuardDuty::Detector'
      );
      expect(template.Resources.GuardDutyDetector.Properties.Enable).toBe(true);
      expect(
        template.Resources.GuardDutyDetector.Properties.DataSources.S3Logs
          .Enable
      ).toBe(true);
      expect(
        template.Resources.GuardDutyDetector.Properties.DataSources.Kubernetes
          .AuditLogs.Enable
      ).toBe(true);
      expect(
        template.Resources.GuardDutyDetector.Properties.DataSources
          .MalwareProtection.ScanEc2InstanceWithFindings.EbsVolumes
      ).toBe(true);
    });

    test('should have CloudTrail with proper configuration', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');

      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.IsLogging).toBe(true);
      expect(cloudTrail.KMSKeyId).toBeDefined();
    });

    test('should have Web Application Firewall (WAF)', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');

      const webACL = template.Resources.WebACL.Properties;
      expect(webACL.Scope).toBe('REGIONAL');
      expect(webACL.DefaultAction.Allow).toBeDefined();
      expect(webACL.Rules).toBeDefined();
      expect(webACL.Rules.length).toBeGreaterThan(2);
      expect(
        webACL.Rules.some(
          (rule: any) => rule.Name === 'AWSManagedRulesCommonRuleSet'
        )
      ).toBe(true);
      expect(
        webACL.Rules.some(
          (rule: any) => rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
        )
      ).toBe(true);
      expect(
        webACL.Rules.some(
          (rule: any) => rule.Name === 'AWSManagedRulesSQLiRuleSet'
        )
      ).toBe(true);
      expect(
        webACL.Rules.some((rule: any) => rule.Name === 'RateLimitRule')
      ).toBe(true);
    });

    test('should have WAF WebACL associated with ALB', () => {
      expect(template.Resources.WebACLAssociation).toBeDefined();
      expect(template.Resources.WebACLAssociation.Type).toBe(
        'AWS::WAFv2::WebACLAssociation'
      );
      expect(
        template.Resources.WebACLAssociation.Properties.ResourceArn[
          'Fn::GetAtt'
        ][0]
      ).toBe('ApplicationLoadBalancer');
      expect(
        template.Resources.WebACLAssociation.Properties.WebACLArn[
          'Fn::GetAtt'
        ][0]
      ).toBe('WebACL');
    });
  });

  describe('Network Resources', () => {
    test('should have VPC with proper configuration', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');

      const vpc = template.Resources.SecureVPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have correct number and types of subnets', () => {
      const subnetTypes = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnetTypes.length).toBe(6);

      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();

      expect(
        template.Resources.PublicSubnet.Properties.AvailabilityZone[
          'Fn::Select'
        ][0]
      ).toBe(0);
      expect(
        template.Resources.PrivateSubnet.Properties.AvailabilityZone[
          'Fn::Select'
        ][0]
      ).toBe(0);
      expect(
        template.Resources.DatabaseSubnet1.Properties.AvailabilityZone[
          'Fn::Select'
        ][0]
      ).toBe(0);

      expect(
        template.Resources.PublicSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ][0]
      ).toBe(1);
      expect(
        template.Resources.PrivateSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ][0]
      ).toBe(1);
      expect(
        template.Resources.DatabaseSubnet2.Properties.AvailabilityZone[
          'Fn::Select'
        ][0]
      ).toBe(1);
    });

    test('should have Internet Gateway and NAT Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );

      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have security groups for different tiers including Bastion', () => {
      expect(template.Resources.WebApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup).toBeDefined();

      expect(template.Resources.WebApplicationSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.ALBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.BastionSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('BastionSecurityGroup should restrict SSH ingress', () => {
      const sg = template.Resources.BastionSecurityGroup.Properties;
      const sshIngress = sg.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshIngress).toBeDefined();
      expect(sshIngress.CidrIp).toBeDefined();
      expect(sshIngress.CidrIp['Ref']).toBe('BastionSshCidr');
      expect(sshIngress.CidrIp).not.toBe('0.0.0.0/0');
    });

    test('PublicNetworkACL should have granular inbound and outbound rules', () => {
      const publicInboundRules = [
        template.Resources.PublicNetworkACLEntryInboundHttp.Properties,
        template.Resources.PublicNetworkACLEntryInboundHttps.Properties,
        template.Resources.PublicNetworkACLEntryInboundSsh.Properties,
        template.Resources.PublicNetworkACLEntryInboundEphemeral.Properties,
      ];
      const publicOutboundRules = [
        template.Resources.PublicNetworkACLEntryOutboundAll.Properties,
        template.Resources.PublicNetworkACLEntryOutboundDenyAll.Properties,
      ];
      
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 100 && r.PortRange.From === 80)).toBe(true);
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 110 && r.PortRange.From === 443)).toBe(true);
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 120 && r.PortRange.From === 22 && r.CidrBlock['Ref'] === 'BastionSshCidr')).toBe(true);
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 130 && r.PortRange.From === 1024 && r.PortRange.To === 65535)).toBe(true);
      expect(publicOutboundRules.some((r: any) => r.RuleNumber === 2000 && r.RuleAction === 'deny' && r.Egress === true)).toBe(true);
      expect(publicOutboundRules.some((r: any) => r.RuleNumber === 100 && r.Protocol === -1)).toBe(true);
    });

    test('PrivateNetworkACL should have granular inbound and outbound rules', () => {
      const privateInboundRules = [
        template.Resources.PrivateNetworkACLEntryInboundApp.Properties,
        template.Resources.PrivateNetworkACLEntryInboundSsh.Properties,
        template.Resources.PrivateNetworkACLEntryInboundEphemeral.Properties,
      ];
      const privateOutboundRules = [
        template.Resources.PrivateNetworkACLEntryOutboundAll.Properties,
        template.Resources.PrivateNetworkACLEntryOutboundDenyAll.Properties,
      ];

      // Corrected test logic to correctly match the rule in the template
      expect(privateInboundRules.some((r: any) => r.RuleNumber === 100 && r.PortRange.From === template.Parameters.WebAppPort.Default && r.CidrBlock['Ref'] === 'VpcCidr')).toBe(true);
      expect(privateInboundRules.some((r: any) => r.RuleNumber === 110 && r.PortRange.From === 22 && r.CidrBlock['Ref'] === 'BastionSshCidr')).toBe(true);
      expect(privateInboundRules.some((r: any) => r.RuleNumber === 120 && r.PortRange.From === 1024)).toBe(true);
      expect(privateOutboundRules.some((r: any) => r.RuleNumber === 2000 && r.RuleAction === 'deny' && r.Egress === true)).toBe(true);
      expect(privateOutboundRules.some((r: any) => r.RuleNumber === 100 && r.Protocol === -1)).toBe(true);
    });

    test('DatabaseNetworkACL should have granular inbound and outbound rules', () => {
      const dbInboundRules = [
        template.Resources.DatabaseNetworkACLEntryInboundMysql.Properties,
        template.Resources.DatabaseNetworkACLEntryInboundSsh.Properties,
        template.Resources.DatabaseNetworkACLEntryInboundEphemeral.Properties,
      ];
      const dbOutboundRules = [
        template.Resources.DatabaseNetworkACLEntryOutboundAll.Properties,
        template.Resources.DatabaseNetworkACLEntryOutboundDenyAll.Properties,
      ];

      expect(dbInboundRules.some((r: any) => r.RuleNumber === 100 && r.PortRange.From === 3306)).toBe(true);
      expect(dbInboundRules.some((r: any) => r.RuleNumber === 110 && r.PortRange.From === 22)).toBe(true);
      expect(dbInboundRules.some((r: any) => r.RuleNumber === 120 && r.PortRange.From === 1024)).toBe(true);
      expect(dbOutboundRules.some((r: any) => r.RuleNumber === 2000 && r.RuleAction === 'deny' && r.Egress === true)).toBe(true);
      expect(dbOutboundRules.some((r: any) => r.RuleNumber === 100 && r.Protocol === -1)).toBe(true);
    });
  });

  describe('Data Storage Resources', () => {
    test('should have encrypted DynamoDB table with deletion protection', () => {
      expect(template.Resources.SecureDynamoTable).toBeDefined();
      expect(template.Resources.SecureDynamoTable.Type).toBe(
        'AWS::DynamoDB::Table'
      );

      const dynamoTable = template.Resources.SecureDynamoTable.Properties;
      expect(dynamoTable.SSESpecification.SSEEnabled).toBe(true);
      expect(dynamoTable.SSESpecification.SSEType).toBe('KMS');
      expect(dynamoTable.DeletionProtectionEnabled).toBe(true);
      expect(template.Resources.SecureDynamoTable.DeletionPolicy).toBe(
        'Retain'
      );
      expect(template.Resources.SecureDynamoTable.UpdateReplacePolicy).toBe(
        'Retain'
      );
    });

    test('should have encrypted RDS database with MultiAZ and deletion protection', () => {
      expect(template.Resources.SecureDatabase).toBeDefined();
      expect(template.Resources.SecureDatabase.Type).toBe(
        'AWS::RDS::DBInstance'
      );

      const database = template.Resources.SecureDatabase.Properties;
      expect(database.StorageEncrypted).toBe(true);
      expect(database.PubliclyAccessible).toBe(false);
      expect(database.DeletionProtection).toBe(true);
      expect(database.MultiAZ).toBe(true);
      expect(template.Resources.SecureDatabase.DeletionPolicy).toBe('Retain');
    });

    test('should have database password in Secrets Manager', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
      expect(template.Resources.DatabaseSecret.Properties.KmsKeyId['Ref']).toBe(
        'SecurityKMSKey'
      );
    });

    test('should NOT have sensitive database connection string in Parameter Store', () => {
      expect(template.Resources.DatabaseConnectionString).toBeUndefined();
    });

    test('should have CloudTrail S3 bucket with encryption', () => {
      expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
      expect(template.Resources.CloudTrailS3Bucket.Type).toBe(
        'AWS::S3::Bucket'
      );

      const bucket = template.Resources.CloudTrailS3Bucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(template.Resources.CloudTrailS3Bucket.DeletionPolicy).toBe(
        'Retain'
      );
    });

    test('should have dedicated ALB access logs S3 bucket with encryption and retention', () => {
      expect(template.Resources.ALBAccessLogsBucket).toBeDefined();
      expect(template.Resources.ALBAccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
      const bucket = template.Resources.ALBAccessLogsBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(
        bucket.LifecycleConfiguration.Rules[0].ExpirationInDays['Ref']
      ).toBe('DataRetentionDays');
      expect(template.Resources.ALBAccessLogsBucket.DeletionPolicy).toBe(
        'Retain'
      );
    });

    test('ALBAccessLogsBucketPolicy should have correct service principal', () => {
      expect(template.Resources.ALBAccessLogsBucketPolicy).toBeDefined();
      const policyStatement =
        template.Resources.ALBAccessLogsBucketPolicy.Properties.PolicyDocument
          .Statement;
      const putObjectStatement = policyStatement.find(
        (s: any) => s.Sid === 'AllowALBWrite'
      );
      expect(putObjectStatement.Principal.Service).toBe(
        'logging.s3.amazonaws.com'
      );
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for web application with least privilege', () => {
      expect(template.Resources.WebApplicationRole).toBeDefined();
      expect(template.Resources.WebApplicationRole.Type).toBe('AWS::IAM::Role');

      const role = template.Resources.WebApplicationRole.Properties;
      expect(role.Policies).toBeDefined();
      expect(role.Policies[0].PolicyName).toBe('SecureWebAppPolicy');
      const policyStatements = role.Policies[0].PolicyDocument.Statement;
      expect(
        policyStatements.some((s: any) =>
          s.Action.includes('logs:CreateLogGroup')
        )
      ).toBe(true);
      expect(
        policyStatements.some((s: any) => s.Action.includes('kms:Decrypt'))
      ).toBe(true);
      expect(
        policyStatements.some((s: any) => s.Action.includes('ssm:GetParameter'))
      ).toBe(true);
      expect(
        policyStatements.some((s: any) => s.Action.includes('s3:GetObject'))
      ).toBe(true);
      
      // Fixed the TypeError by handling both string and array formats for the Resource property
      expect(
        policyStatements.some((s: any) =>
          (Array.isArray(s.Resource)
            ? s.Resource.some((r: string) => r.includes('${ProjectName}-${EnvironmentSuffix}-static-content/*'))
            : typeof s.Resource === 'string' && s.Resource.includes('${ProjectName}-${EnvironmentSuffix}-static-content/*'))
        )
      ).toBe(true);
    });

    test('should have instance profile for web application', () => {
      expect(template.Resources.WebApplicationInstanceProfile).toBeDefined();
      expect(template.Resources.WebApplicationInstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('should have CloudTrail role with minimal permissions', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have AccountPasswordPolicy when MFA is enforced', () => {
      expect(template.Resources.AccountPasswordPolicy).toBeDefined();
      expect(template.Resources.AccountPasswordPolicy.Type).toBe(
        'AWS::IAM::AccountPasswordPolicy'
      );
      expect(template.Resources.AccountPasswordPolicy.Condition).toBe(
        'EnforceMfa'
      );
      const policy = template.Resources.AccountPasswordPolicy.Properties;
      expect(policy.MinimumPasswordLength).toBe(14);
      expect(policy.RequireNumbers).toBe(true);
      expect(policy.RequireSymbols).toBe(true);
      expect(policy.RequireUppercaseCharacters).toBe(true);
      expect(policy.RequireLowercaseCharacters).toBe(true);
      expect(policy.MaxPasswordAge).toBe(90);
      expect(policy.PasswordReusePrevention).toBe(5);
    });

    test('should have AdminUser and AdminUserGroup with MFA enforcement', () => {
      expect(template.Resources.AdminUser).toBeDefined();
      expect(template.Resources.AdminUser.Type).toBe('AWS::IAM::User');
      expect(template.Resources.AdminUser.Condition).toBe('EnforceMfa');

      expect(template.Resources.AdminUserGroup).toBeDefined();
      expect(template.Resources.AdminUserGroup.Type).toBe('AWS::IAM::Group');
      expect(template.Resources.AdminUserGroup.Condition).toBe('EnforceMfa');
    });

    test('AdminUserLoginProfile should be part of AdminUser and be conditionally applied', () => {
        expect(template.Resources.AdminUser.Properties.LoginProfile).toBeDefined();
        expect(template.Resources.AdminUser.Properties.LoginProfile.Password).toBeDefined();
        expect(template.Resources.AdminUser.Properties.LoginProfile.PasswordResetRequired).toBe(true);
        expect(template.Resources.AdminUser.Condition).toBe('EnforceMfa');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch log groups with encryption', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.SecurityLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();

      expect(template.Resources.CloudTrailLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
      expect(template.Resources.ApplicationLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
      expect(template.Resources.SecurityLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
      expect(template.Resources.VPCFlowLogsLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('log groups should have proper retention and encryption', () => {
      const logGroups = [
        template.Resources.CloudTrailLogGroup.Properties,
        template.Resources.ApplicationLogGroup.Properties,
        template.Resources.SecurityLogGroup.Properties,
        template.Resources.VPCFlowLogsLogGroup.Properties,
      ];
      logGroups.forEach(logGroup => {
        expect(logGroup.KmsKeyId).toBeDefined();
        expect(logGroup.RetentionInDays).toBeDefined();
      });
    });

    test('should have SNS Topic for security notifications', () => {
      expect(template.Resources.SecurityNotificationsTopic).toBeDefined();
      expect(template.Resources.SecurityNotificationsTopic.Type).toBe(
        'AWS::SNS::Topic'
      );
      expect(
        template.Resources.SecurityNotificationsTopic.Properties.KmsMasterKeyId[
          'Ref'
        ]
      ).toBe('SecurityKMSKey');
    });

    test('should have SNS Subscription for security notifications', () => {
      expect(
        template.Resources.SecurityNotificationsSubscription
      ).toBeDefined();
      expect(template.Resources.SecurityNotificationsSubscription.Type).toBe(
        'AWS::SNS::Subscription'
      );
      expect(
        template.Resources.SecurityNotificationsSubscription.Properties.Protocol
      ).toBe('email');
      expect(
        template.Resources.SecurityNotificationsSubscription.Properties
          .Endpoint['Ref']
      ).toBe('AdminUserEmail');
    });

    test('should have CloudWatch Alarm for unauthorized API calls', () => {
      expect(template.Resources.UnauthorizedApiCallAlarm).toBeDefined();
      expect(template.Resources.UnauthorizedApiCallAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
      const alarm = template.Resources.UnauthorizedApiCallAlarm.Properties;
      expect(alarm.MetricName).toBe('UnauthorizedApiCallCount');
      expect(alarm.Namespace).toBe('CloudTrailMetrics');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.AlarmActions).toContainEqual({
        Ref: 'SecurityNotificationsTopic',
      });
    });

    test('should have VPC Flow Logs configured', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(template.Resources.VPCFlowLog.Properties.ResourceId['Ref']).toBe(
        'SecureVPC'
      );
      expect(template.Resources.VPCFlowLog.Properties.LogGroupName['Ref']).toBe(
        'VPCFlowLogsLogGroup'
      );
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );

      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.Subnets).toBeDefined();
      expect(alb.Subnets.length).toBeGreaterThanOrEqual(2);
      expect(alb.LoadBalancerAttributes).toBeDefined();
      const accessLogsEnabled = alb.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'access_logs.s3.enabled'
      );
      const accessLogsBucket = alb.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'access_logs.s3.bucket'
      );
      expect(accessLogsEnabled).toBeDefined();
      expect(accessLogsEnabled.Value).toBe('true');
      expect(accessLogsBucket).toBeDefined();
      expect(accessLogsBucket.Value['Ref']).toBe('ALBAccessLogsBucket');
    });

    test('should have dedicated ALB access logs S3 bucket with policy', () => {
      expect(template.Resources.ALBAccessLogsBucket).toBeDefined();
      expect(template.Resources.ALBAccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
      const bucket = template.Resources.ALBAccessLogsBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(
        bucket.LifecycleConfiguration.Rules[0].ExpirationInDays['Ref']
      ).toBe('DataRetentionDays');
      expect(template.Resources.ALBAccessLogsBucket.DeletionPolicy).toBe(
        'Retain'
      );
    });

    test('should have ALB HTTP Listener', () => {
      expect(template.Resources.ALBListenerHttp).toBeDefined();
      expect(template.Resources.ALBListenerHttp.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
      const listener = template.Resources.ALBListenerHttp.Properties;
      expect(listener.LoadBalancerArn['Ref']).toBe('ApplicationLoadBalancer');
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.DefaultActions[0].Type).toBe('forward');
      expect(listener.DefaultActions[0].TargetGroupArn['Ref']).toBe(
        'WebServerTargetGroup'
      );
    });

    test('should have WebServerTargetGroup', () => {
      expect(template.Resources.WebServerTargetGroup).toBeDefined();
      expect(template.Resources.WebServerTargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
      const tg = template.Resources.WebServerTargetGroup.Properties;
      expect(tg.Port['Ref']).toBe('WebAppPort');
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.VpcId['Ref']).toBe('SecureVPC');
    });
  });

  describe('Secure Configuration Management', () => {
    test('should NOT have sensitive database connection string in Parameter Store', () => {
      expect(template.Resources.DatabaseConnectionString).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs for all major resources including new ones', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'WebApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'ApplicationLoadBalancerDNS',
        'WebACLArn',
        'DatabaseEndpoint',
        'SecureDynamoTableName',
        'SecureDynamoTableArn',
        'KMSKeyId',
        'CloudTrailArn',
        'GuardDutyDetectorId',
        'StackName',
        'EnvironmentSuffixOut',
        'BastionHostPublicIp',
        'SecurityNotificationsTopicArn',
        'AdminUserArn',
        'VPCFlowLogsLogGroupName',
        'PublicSubnet2Id',
        'PrivateSubnet2Id',
        'DatabaseSubnet1Id',
        'DatabaseSubnet2Id',
        'ALBSecurityGroupId',
        'PublicNetworkACLId',
        'PrivateNetworkACLId',
        'DatabaseNetworkACLId',
        'ApplicationLoadBalancerArn',
        'WebServerLaunchTemplateId',
        'WebServerTargetGroupArn',
        'WebServerAutoScalingGroupName',
        'WebServerCpuUtilizationAlarmName',
        'WebServerScaleUpPolicyArn',
        'WebServerCpuLowAlarmName',
        'WebServerScaleDownPolicyArn',
        'WebAppCertificateArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
      expect(Object.keys(template.Outputs).length).toBe(expectedOutputs.length);
    });

    test('all outputs should have proper descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have comprehensive resource count for secure infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(15);
    });
  });

  describe('Security Compliance', () => {
    test('critical resources should have Retain deletion policies', () => {
      const criticalResources = [
        'SecurityKMSKey',
        'CloudTrailS3Bucket',
        'ALBAccessLogsBucket',
        'SecureDynamoTable',
        'SecureDatabase',
      ];
      criticalResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Retain');
      });
    });

    test('RDS and DynamoDB should have deletion protection enabled', () => {
      expect(
        template.Resources.SecureDatabase.Properties.DeletionProtection
      ).toBe(true);
      expect(
        template.Resources.SecureDynamoTable.Properties
          .DeletionProtectionEnabled
      ).toBe(true);
    });

    test('RDS database should be MultiAZ', () => {
      expect(template.Resources.SecureDatabase.Properties.MultiAZ).toBe(true);
    });

    test('BastionSecurityGroup should restrict SSH ingress', () => {
      const sg = template.Resources.BastionSecurityGroup.Properties;
      const sshIngress = sg.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshIngress).toBeDefined();
      expect(sshIngress.CidrIp).toBeDefined();
      expect(sshIngress.CidrIp['Ref']).toBe('BastionSshCidr');
    });

    test('PublicNetworkACL should have granular inbound and outbound rules', () => {
      const publicInboundRules = [
        template.Resources.PublicNetworkACLEntryInboundHttp.Properties,
        template.Resources.PublicNetworkACLEntryInboundHttps.Properties,
        template.Resources.PublicNetworkACLEntryInboundSsh.Properties,
        template.Resources.PublicNetworkACLEntryInboundEphemeral.Properties,
      ];
      const publicOutboundRules = [
        template.Resources.PublicNetworkACLEntryOutboundAll.Properties,
        template.Resources.PublicNetworkACLEntryOutboundDenyAll.Properties,
      ];
      
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 100 && r.PortRange.From === 80)).toBe(true);
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 110 && r.PortRange.From === 443)).toBe(true);
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 120 && r.PortRange.From === 22 && r.CidrBlock['Ref'] === 'BastionSshCidr')).toBe(true);
      expect(publicInboundRules.some((r: any) => r.RuleNumber === 130 && r.PortRange.From === 1024 && r.PortRange.To === 65535)).toBe(true);
      expect(publicOutboundRules.some((r: any) => r.RuleNumber === 2000 && r.RuleAction === 'deny' && r.Egress === true)).toBe(true);
      expect(publicOutboundRules.some((r: any) => r.RuleNumber === 100 && r.Protocol === -1)).toBe(true);
    });

    test('PrivateNetworkACL should have granular inbound and outbound rules', () => {
      const privateInboundRules = [
        template.Resources.PrivateNetworkACLEntryInboundApp.Properties,
        template.Resources.PrivateNetworkACLEntryInboundSsh.Properties,
        template.Resources.PrivateNetworkACLEntryInboundEphemeral.Properties,
      ];
      const privateOutboundRules = [
        template.Resources.PrivateNetworkACLEntryOutboundAll.Properties,
        template.Resources.PrivateNetworkACLEntryOutboundDenyAll.Properties,
      ];

      expect(privateInboundRules.some((r: any) => r.RuleNumber === 100 && r.PortRange.From === template.Parameters.WebAppPort.Default && r.CidrBlock['Ref'] === 'VpcCidr')).toBe(true);
      expect(privateInboundRules.some((r: any) => r.RuleNumber === 110 && r.PortRange.From === 22 && r.CidrBlock['Ref'] === 'BastionSshCidr')).toBe(true);
      expect(privateInboundRules.some((r: any) => r.RuleNumber === 120 && r.PortRange.From === 1024)).toBe(true);
      expect(privateOutboundRules.some((r: any) => r.RuleNumber === 2000 && r.RuleAction === 'deny' && r.Egress === true)).toBe(true);
      expect(privateOutboundRules.some((r: any) => r.RuleNumber === 100 && r.Protocol === -1)).toBe(true);
    });

    test('DatabaseNetworkACL should have granular inbound and outbound rules', () => {
      const dbInboundRules = [
        template.Resources.DatabaseNetworkACLEntryInboundMysql.Properties,
        template.Resources.DatabaseNetworkACLEntryInboundSsh.Properties,
        template.Resources.DatabaseNetworkACLEntryInboundEphemeral.Properties,
      ];
      const dbOutboundRules = [
        template.Resources.DatabaseNetworkACLEntryOutboundAll.Properties,
        template.Resources.DatabaseNetworkACLEntryOutboundDenyAll.Properties,
      ];

      expect(dbInboundRules.some((r: any) => r.RuleNumber === 100 && r.PortRange.From === 3306)).toBe(true);
      expect(dbInboundRules.some((r: any) => r.RuleNumber === 110 && r.PortRange.From === 22)).toBe(true);
      expect(dbInboundRules.some((r: any) => r.RuleNumber === 120 && r.PortRange.From === 1024)).toBe(true);
      expect(dbOutboundRules.some((r: any) => r.RuleNumber === 2000 && r.RuleAction === 'deny' && r.Egress === true)).toBe(true);
      expect(dbOutboundRules.some((r: any) => r.RuleNumber === 100 && r.Protocol === -1)).toBe(true);
    });

    test('should follow naming convention with project and environment', () => {
      const vpcName = template.Resources.SecureVPC.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(vpcName.Value['Fn::Sub']).toContain('${ProjectName}');
      expect(vpcName.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('encryption should be enabled for data at rest', () => {
      const dynamoSSE =
        template.Resources.SecureDynamoTable.Properties.SSESpecification;
      expect(dynamoSSE.SSEEnabled).toBe(true);

      const rdsEncryption =
        template.Resources.SecureDatabase.Properties.StorageEncrypted;
      expect(rdsEncryption).toBe(true);

      const s3Encryption =
        template.Resources.CloudTrailS3Bucket.Properties.BucketEncryption;
      expect(s3Encryption).toBeDefined();

      const albLogsEncryption =
        template.Resources.ALBAccessLogsBucket.Properties.BucketEncryption;
      expect(albLogsEncryption).toBeDefined();
    });

    test('IAM AccountPasswordPolicy should enforce MFA and strong password', () => {
      const passwordPolicy = template.Resources.AccountPasswordPolicy;
      expect(passwordPolicy).toBeDefined();
      expect(passwordPolicy.Type).toBe('AWS::IAM::AccountPasswordPolicy');
      expect(passwordPolicy.Condition).toBe('EnforceMfa');
      const props = passwordPolicy.Properties;
      expect(props.MinimumPasswordLength).toBe(14);
      expect(props.RequireNumbers).toBe(true);
      expect(props.RequireSymbols).toBe(true);
      expect(props.RequireUppercaseCharacters).toBe(true);
      expect(props.RequireLowercaseCharacters).toBe(true);
      expect(props.MaxPasswordAge).toBe(90);
      expect(props.PasswordReusePrevention).toBe(5);
    });

    test('AdminUser IAM policy should require MFA for sensitive actions', () => {
      const adminUser = template.Resources.AdminUser;
      expect(adminUser).toBeDefined();
      const adminPolicyStatement =
        adminUser.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(adminPolicyStatement.Effect).toBe('Allow');
      expect(adminPolicyStatement.Action).toEqual(['*']);
      expect(adminPolicyStatement.Resource).toEqual(['*']);
      expect(
        adminPolicyStatement.Condition.Bool['aws:MultiFactorAuthPresent']
      ).toBe('true');
    });
  });
});