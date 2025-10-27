import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template (converted from YAML by cfn-flip during test setup)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==========================================
  // Template Structure Tests
  // ==========================================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure Multi-Region AWS Environment');
    });

    test('should have required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // ==========================================
  // Parameters Tests
  // ==========================================
  describe('Parameters', () => {
    test('should have Environment parameter with correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('should have LatestAmiId parameter for SSM', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });
  });

  // ==========================================
  // KMS Keys Tests
  // ==========================================
  describe('KMS Keys Configuration', () => {
    test('should have S3 KMS key with key rotation enabled', () => {
      const key = template.Resources.S3KMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.Description).toContain('S3 bucket encryption');
    });

    test('S3 KMS key should have proper policies', () => {
      const key = template.Resources.S3KMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      expect(statements).toBeDefined();
      expect(statements.length).toBeGreaterThan(0);

      // Check for root account access
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable Root Account');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');

      // Check for CloudTrail access
      const cloudTrailStatement = statements.find((s: any) => s.Sid === 'Enable CloudTrail');
      expect(cloudTrailStatement).toBeDefined();
    });

    test('should have RDS KMS key with key rotation enabled', () => {
      const key = template.Resources.RDSKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.Description).toContain('RDS encryption');
    });

    test('should have KMS key aliases', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      expect(template.Resources.S3KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.RDSKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  // ==========================================
  // VPC and Networking Tests
  // ==========================================
  describe('VPC Configuration', () => {
    test('should have VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets in multiple AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have private subnets in multiple AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have Internet Gateway attached to VPC', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.AttachGateway;

      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateway with EIP', () => {
      const eip = template.Resources.NATGatewayEIP;
      const nat = template.Resources.NATGateway;

      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');

      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have proper route tables', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT = template.Resources.PrivateRouteTable;

      expect(publicRT).toBeDefined();
      expect(privateRT).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have public route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have private route to NAT Gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route).toBeDefined();
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
    });
  });

  // ==========================================
  // Security Groups Tests
  // ==========================================
  describe('Security Groups Configuration', () => {
    test('should have Bastion security group with SSH access', () => {
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();

      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.IpProtocol).toBe('tcp');
    });

    test('should have Application security group', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('application servers');
    });

    test('should have ALB security group with HTTPS and HTTP', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();

      const ingress = sg.Properties.SecurityGroupIngress;
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      const httpRule = ingress.find((r: any) => r.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
    });

    test('should have Database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have cross-security group rules for least privilege', () => {
      expect(template.Resources.BastionToApplicationSSH).toBeDefined();
      expect(template.Resources.ApplicationFromBastionSSH).toBeDefined();
      expect(template.Resources.ApplicationFromALBHTTPS).toBeDefined();
      expect(template.Resources.ApplicationToDatabaseMySQL).toBeDefined();
      expect(template.Resources.DatabaseFromApplicationMySQL).toBeDefined();
    });

    test('database security group should only allow MySQL from application', () => {
      const rule = template.Resources.DatabaseFromApplicationMySQL;
      expect(rule.Properties.FromPort).toBe(3306);
      expect(rule.Properties.ToPort).toBe(3306);
      expect(rule.Properties.IpProtocol).toBe('tcp');
    });
  });

  // ==========================================
  // S3 Buckets Tests
  // ==========================================
  describe('S3 Buckets Configuration', () => {
    test('should have SecureDataBucket with encryption', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');

      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have versioning enabled on SecureDataBucket', () => {
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have public access block on all buckets', () => {
      const buckets = ['SecureDataBucket', 'LogBucket', 'CloudTrailBucket', 'ConfigBucket'];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should have lifecycle policies on SecureDataBucket', () => {
      const bucket = template.Resources.SecureDataBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;

      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules.length).toBeGreaterThan(0);

      const transitionRule = lifecycle.Rules.find((r: any) => r.Id === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
    });

    test('should have LogBucket with KMS encryption', () => {
      const bucket = template.Resources.LogBucket;
      expect(bucket).toBeDefined();

      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have CloudTrailBucket with proper configuration', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudTrailBucketPolicy with proper permissions', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThan(0);

      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeStatement).toBeDefined();
    });

    test('should have ConfigBucket and policy', () => {
      const bucket = template.Resources.ConfigBucket;
      const policy = template.Resources.ConfigBucketPolicy;

      expect(bucket).toBeDefined();
      expect(policy).toBeDefined();
    });

    test('should have EmptyS3BucketLambda for cleanup', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Timeout).toBe(900);
    });

    test('should have Custom resources to empty buckets on deletion', () => {
      expect(template.Resources.EmptySecureDataBucket).toBeDefined();
      expect(template.Resources.EmptyLogBucket).toBeDefined();
      expect(template.Resources.EmptyCloudTrailBucket).toBeDefined();
      expect(template.Resources.EmptyConfigBucket).toBeDefined();
    });
  });

  // ==========================================
  // CloudTrail and Config Tests
  // ==========================================
  describe('CloudTrail Configuration', () => {
    test('should have CloudTrail with proper settings', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should include global service events', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should have event selectors for S3', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EventSelectors).toBeDefined();
      expect(trail.Properties.EventSelectors.length).toBeGreaterThan(0);
    });

    test('CloudTrail should use KMS encryption', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.KMSKeyId).toBeDefined();
    });
  });

  describe('AWS Config Configuration', () => {
    test('should have Config recorder', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have Config delivery channel', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });

    test('should have Config rules for security', () => {
      const sshCheck = template.Resources.SecurityGroupSSHCheck;
      const rdpCheck = template.Resources.SecurityGroupRDPCheck;

      expect(sshCheck).toBeDefined();
      expect(rdpCheck).toBeDefined();
      expect(sshCheck.Type).toBe('AWS::Config::ConfigRule');
      expect(sshCheck.Properties.Source.SourceIdentifier).toBe('INCOMING_SSH_DISABLED');
    });

    test('should have Config role with proper permissions', () => {
      const role = template.Resources.ConfigRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });
  });

  // ==========================================
  // IAM Roles Tests
  // ==========================================
  describe('IAM Roles Configuration', () => {
    test('should have EC2 instance role with least privilege', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 role should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.Policies).toBeDefined();

      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement.length).toBeGreaterThan(0);
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have Admin role with MFA requirement', () => {
      const role = template.Resources.AdminRole;
      expect(role).toBeDefined();

      const condition = role.Properties.AssumeRolePolicyDocument.Statement[0].Condition;
      expect(condition.Bool['aws:MultiFactorAuthPresent']).toBe(true);
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AdministratorAccess');
      expect(role.Properties.MaxSessionDuration).toBe(3600);
    });

    test('should have ReadOnly role', () => {
      const role = template.Resources.ReadOnlyRole;
      expect(role).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
      expect(role.Properties.MaxSessionDuration).toBe(7200);
    });
  });

  // ==========================================
  // RDS Database Tests
  // ==========================================
  describe('RDS Database Configuration', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.DeletionPolicy).toBe('Delete');
    });

    test('should have RDS instance with encryption', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should have proper backup configuration', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.BackupRetentionPeriod).toBe(30);
      expect(db.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('RDS should have CloudWatch logs enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should have database secret in Secrets Manager', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have secret target attachment', () => {
      const attachment = template.Resources.DatabaseSecretAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBInstance');
    });
  });

  // ==========================================
  // Load Balancer and WAF Tests
  // ==========================================
  describe('Application Load Balancer Configuration', () => {
    test('should have ALB with proper configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
    });
  });

  describe('WAF Configuration', () => {
    test('should have Web ACL', () => {
      const waf = template.Resources.WebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('Web ACL should have rate limiting rule', () => {
      const waf = template.Resources.WebACL;
      const rules = waf.Properties.Rules;

      const rateLimitRule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('Web ACL should have AWS managed rule sets', () => {
      const waf = template.Resources.WebACL;
      const rules = waf.Properties.Rules;

      const commonRuleSet = rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      const sqliRuleSet = rules.find((r: any) => r.Name === 'AWSManagedRulesSQLiRuleSet');
      const badInputsRuleSet = rules.find((r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet');

      expect(commonRuleSet).toBeDefined();
      expect(sqliRuleSet).toBeDefined();
      expect(badInputsRuleSet).toBeDefined();
    });

    test('should have WAF association with ALB', () => {
      const association = template.Resources.WAFAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  // ==========================================
  // EC2 Launch Template Tests
  // ==========================================
  describe('EC2 Launch Template Configuration', () => {
    test('should have launch template', () => {
      const template_resource = template.Resources.EC2LaunchTemplate;
      expect(template_resource).toBeDefined();
      expect(template_resource.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should have encrypted EBS volumes', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];

      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('launch template should enforce IMDSv2', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpEndpoint).toBe('enabled');
      expect(metadata.HttpPutResponseHopLimit).toBe(1);
    });

    test('launch template should have user data for security hardening', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });
  });

  // ==========================================
  // Outputs Tests
  // ==========================================
  describe('Outputs', () => {
    test('should have all critical outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'SecureDataBucketName',
        'CloudTrailArn',
        'DatabaseEndpoint',
        'ALBDNSName',
        'LaunchTemplateId',
        'BastionSecurityGroupId',
        'ApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'EC2RoleArn',
        'S3KMSKeyId',
        'RDSKMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('subnet outputs should exist', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('all bucket outputs should exist', () => {
      expect(template.Outputs.SecureDataBucketName).toBeDefined();
      expect(template.Outputs.LogBucketName).toBeDefined();
      expect(template.Outputs.CloudTrailBucketName).toBeDefined();
      expect(template.Outputs.ConfigBucketName).toBeDefined();
    });

    test('all security group outputs should exist', () => {
      expect(template.Outputs.BastionSecurityGroupId).toBeDefined();
      expect(template.Outputs.ApplicationSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
    });

    test('all IAM role outputs should exist', () => {
      expect(template.Outputs.EC2RoleArn).toBeDefined();
      expect(template.Outputs.AdminRoleArn).toBeDefined();
      expect(template.Outputs.ReadOnlyRoleArn).toBeDefined();
    });
  });

  // ==========================================
  // Compliance and Security Tests
  // ==========================================
  describe('Security and Compliance', () => {
    test('all S3 buckets should have encryption', () => {
      const buckets = ['SecureDataBucket', 'LogBucket', 'CloudTrailBucket', 'ConfigBucket'];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('RDS database should use KMS encryption', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBeDefined();
    });

    test('all KMS keys should have rotation enabled', () => {
      const keys = ['S3KMSKey', 'RDSKMSKey'];

      keys.forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });

    test('security groups should follow least privilege principle', () => {
      // Bastion should only allow SSH
      const bastion = template.Resources.BastionSecurityGroup;
      expect(bastion.Properties.SecurityGroupIngress.length).toBe(1);
      expect(bastion.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
    });

    test('template should use resource tagging', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(vpc.Properties.Tags.length).toBeGreaterThan(0);
    });
  });
});

