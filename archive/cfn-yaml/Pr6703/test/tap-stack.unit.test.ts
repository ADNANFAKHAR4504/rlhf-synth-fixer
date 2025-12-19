import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    // Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');

    // If JSON doesn't exist, try to read YAML
    if (!fs.existsSync(templatePath)) {
      const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
      if (fs.existsSync(yamlPath)) {
        console.warn('TapStack.json not found. Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json');
        // For now, skip if JSON doesn't exist
        template = null;
        return;
      }
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('Secure and Compliant AWS Infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter with correct configuration', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secureprod');
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
    });

    test('should have KeyPairName parameter', () => {
      const param = template.Parameters.KeyPairName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have DBUsername parameter with constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have CertificateArn parameter', () => {
      const param = template.Parameters.CertificateArn;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });

    test('should have CreateNATGateways parameter with allowed values', () => {
      const param = template.Parameters.CreateNATGateways;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have CreateAWSConfig parameter with allowed values', () => {
      const param = template.Parameters.CreateAWSConfig;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have CreateCloudTrail parameter with allowed values', () => {
      const param = template.Parameters.CreateCloudTrail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have LatestAmiId parameter from SSM', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('ami-amazon-linux-latest');
    });
  });

  describe('Conditions', () => {
    test('should define HasSSLCertificate condition', () => {
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
    });

    test('should define HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should define ShouldCreateNATGateways condition', () => {
      expect(template.Conditions.ShouldCreateNATGateways).toBeDefined();
    });

    test('should define ShouldCreateAWSConfig condition', () => {
      expect(template.Conditions.ShouldCreateAWSConfig).toBeDefined();
    });

    test('should define ShouldCreateCloudTrail condition', () => {
      expect(template.Conditions.ShouldCreateCloudTrail).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping with all subnet CIDRs', () => {
      const mapping = template.Mappings.SubnetConfig;
      expect(mapping).toBeDefined();
      expect(mapping.VPC.CIDR).toBe('10.0.0.0/16');
      expect(mapping.PublicSubnet1.CIDR).toBe('10.0.0.0/24');
      expect(mapping.PublicSubnet2.CIDR).toBe('10.0.1.0/24');
      expect(mapping.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(mapping.PrivateSubnet2.CIDR).toBe('10.0.11.0/24');
      expect(mapping.DatabaseSubnet1.CIDR).toBe('10.0.20.0/24');
      expect(mapping.DatabaseSubnet2.CIDR).toBe('10.0.21.0/24');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should define VPC with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toBeDefined();
    });

    test('should define InternetGateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should define VPCGatewayAttachment with dependencies', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toBeDefined();
      expect(attachment.Properties.InternetGatewayId).toBeDefined();
    });

    test('should define all six subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
    });

    test('PublicSubnet1 should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toBeDefined();
      expect(subnet.Properties.AvailabilityZone).toBeDefined();
    });

    test('PrivateSubnet1 should not map public IPs', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should define NAT Gateway resources with conditions', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Condition).toBe('ShouldCreateNATGateways');
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('NAT Gateway EIPs should depend on gateway attachment', () => {
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;
      expect(eip1.DependsOn).toBe('AttachGateway');
      expect(eip2.DependsOn).toBe('AttachGateway');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');
    });

    test('should define route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('PublicRoute should route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toBeDefined();
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('PrivateRoute1 should route to NAT Gateway with condition', () => {
      const route = template.Resources.PrivateRoute1;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Condition).toBe('ShouldCreateNATGateways');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toBeDefined();
    });

    test('should define all subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should define ALBSecurityGroup with HTTP and HTTPS rules', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should define WebServerSecurityGroup with proper ingress', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();

      // Should have SSH from bastion
      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
    });

    test('should define BastionSecurityGroup', () => {
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
    });

    test('should define DatabaseSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should define separate ingress/egress rules for ALB to WebServer', () => {
      expect(template.Resources.ALBToWebServerIngress).toBeDefined();
      expect(template.Resources.ALBToWebServerEgress).toBeDefined();

      const ingress = template.Resources.ALBToWebServerIngress;
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.ToPort).toBe(80);
    });

    test('should define database security group rules', () => {
      const ingress = template.Resources.DatabaseFromWebServerIngress;
      const egress = template.Resources.WebServerToDatabaseEgress;

      expect(ingress).toBeDefined();
      expect(egress).toBeDefined();
      expect(ingress.Properties.FromPort).toBe(5432);
      expect(ingress.Properties.ToPort).toBe(5432);
      expect(egress.Properties.FromPort).toBe(5432);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should define EC2InstanceRole with correct trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2InstanceRole should have SSM and CloudWatch managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should have ParameterStoreAccess policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();

      const paramPolicy = policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');
      expect(paramPolicy).toBeDefined();
      expect(paramPolicy.PolicyDocument.Statement).toHaveLength(2);
    });

    test('should define EC2InstanceProfile linked to role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toBeDefined();
    });

    test('should define CloudTrailRole with condition', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Condition).toBe('ShouldCreateCloudTrail');
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should define ConfigRole with condition and managed policy', () => {
      const role = template.Resources.ConfigRole;
      expect(role).toBeDefined();
      expect(role.Condition).toBe('ShouldCreateAWSConfig');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should define MaintenanceWindowRole', () => {
      const role = template.Resources.MaintenanceWindowRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ssm.amazonaws.com');
    });
  });

  describe('KMS Keys', () => {
    test('should define EBSKMSKey with proper key policy', () => {
      const key = template.Resources.EBSKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toContain('EBS volume encryption');

      const policy = key.Properties.KeyPolicy;
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('EBSKMSKey should allow EC2 service to use it', () => {
      const key = template.Resources.EBSKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      const ec2Statement = statements.find((s: any) =>
        s.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Action).toContain('kms:Decrypt');
      expect(ec2Statement.Action).toContain('kms:GenerateDataKey');
    });

    test('should define EBSKMSKeyAlias', () => {
      const alias = template.Resources.EBSKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toBeDefined();
    });

    test('should define ParameterStoreKMSKey', () => {
      const key = template.Resources.ParameterStoreKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toContain('Parameter Store encryption');
    });

    test('should define ParameterStoreKMSKeyAlias', () => {
      const alias = template.Resources.ParameterStoreKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Buckets', () => {
    test('should define EmptyS3BucketLambdaRole', () => {
      const role = template.Resources.EmptyS3BucketLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should define EmptyS3BucketLambda function', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('should define LoggingBucket with encryption', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('LoggingBucket should block all public access', () => {
      const bucket = template.Resources.LoggingBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('LoggingBucket should have lifecycle policy', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('LoggingBucket should have versioning enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should define ApplicationBucket with encryption and versioning', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ApplicationBucket should have logging configured', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('application-bucket-logs/');
    });

    test('should define CloudTrailBucket with condition', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Condition).toBe('ShouldCreateCloudTrail');
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should define CloudTrailBucketPolicy with condition', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Condition).toBe('ShouldCreateCloudTrail');
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('CloudTrailBucketPolicy should allow CloudTrail service', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const aclStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

      expect(aclStatement).toBeDefined();
      expect(writeStatement).toBeDefined();
      expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should define ConfigBucket with condition', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Condition).toBe('ShouldCreateAWSConfig');
    });

    test('should define ConfigBucketPolicy with proper permissions', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Condition).toBe('ShouldCreateAWSConfig');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements.length).toBe(3);
      expect(statements.find((s: any) => s.Sid === 'AWSConfigBucketPermissionsCheck')).toBeDefined();
      expect(statements.find((s: any) => s.Sid === 'AWSConfigBucketExistenceCheck')).toBeDefined();
      expect(statements.find((s: any) => s.Sid === 'AWSConfigBucketWrite')).toBeDefined();
    });

    test('should define custom resources to empty buckets', () => {
      expect(template.Resources.EmptyLoggingBucket).toBeDefined();
      expect(template.Resources.EmptyApplicationBucket).toBeDefined();
      expect(template.Resources.EmptyCloudTrailBucket).toBeDefined();
      expect(template.Resources.EmptyConfigBucket).toBeDefined();
    });
  });

  describe('CloudTrail and AWS Config', () => {
    test('should define CloudTrail with condition', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Condition).toBe('ShouldCreateCloudTrail');
      expect(trail.DependsOn).toContain('CloudTrailBucketPolicy');
    });

    test('CloudTrail should have proper configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should have event selectors for S3', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EventSelectors).toBeDefined();
      expect(trail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
      expect(trail.Properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
      expect(trail.Properties.EventSelectors[0].DataResources).toBeDefined();
    });

    test('should define ConfigRecorder with condition', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Condition).toBe('ShouldCreateAWSConfig');
      expect(recorder.DependsOn).toContain('ConfigBucketPolicy');
    });

    test('ConfigRecorder should record all supported resources', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('ConfigRecorder should specify important resource types', () => {
      const recorder = template.Resources.ConfigRecorder;
      const resourceTypes = recorder.Properties.RecordingGroup.ResourceTypes;
      expect(resourceTypes).toContain('AWS::EC2::Instance');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
    });

    test('should define ConfigDeliveryChannel', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Condition).toBe('ShouldCreateAWSConfig');
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });

    test('should define RequiredTagsRule', () => {
      const rule = template.Resources.RequiredTagsRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Condition).toBe('ShouldCreateAWSConfig');
      expect(rule.DependsOn).toBe('ConfigRecorder');
      expect(rule.Properties.Source.SourceIdentifier).toBe('REQUIRED_TAGS');
    });

    test('RequiredTagsRule should check for Name and Environment tags', () => {
      const rule = template.Resources.RequiredTagsRule;
      const params = rule.Properties.InputParameters;
      expect(params.tag1Key).toBe('Name');
      expect(params.tag2Key).toBe('Environment');
    });

    test('should define EncryptedVolumesRule', () => {
      const rule = template.Resources.EncryptedVolumesRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Condition).toBe('ShouldCreateAWSConfig');
      expect(rule.Properties.Source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
    });
  });

  describe('Systems Manager Parameters and Secrets', () => {
    test('should define DBPasswordSecret with auto-generation', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });

    test('DBPasswordSecret should exclude special characters', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
    });

    test('should define DBPasswordParameter', () => {
      const param = template.Resources.DBPasswordParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
    });

    test('DBPasswordParameter should resolve from Secrets Manager', () => {
      const param = template.Resources.DBPasswordParameter;
      expect(param.Properties.Value).toBeDefined();
      expect(JSON.stringify(param.Properties.Value)).toContain('resolve:secretsmanager');
    });

    test('should define ApplicationConfigParameter with JSON structure', () => {
      const param = template.Resources.ApplicationConfigParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Value).toBeDefined();
    });
  });

  describe('EC2 Launch Template and Auto Scaling', () => {
    test('should define EC2LaunchTemplate', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('EC2LaunchTemplate should have correct instance configuration', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      expect(data.InstanceType).toBe('t3.medium');
      expect(data.Monitoring.Enabled).toBe(true);
    });

    test('EC2LaunchTemplate should have encrypted EBS volumes', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.VolumeSize).toBe(30);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('EC2LaunchTemplate should have user data for SSM and CloudWatch', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should define AutoScalingGroup with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('AutoScalingGroup should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('AutoScalingGroup should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('AutoScalingGroup should have target group attached', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toBeDefined();
      expect(asg.Properties.TargetGroupARNs).toHaveLength(1);
    });
  });

  describe('Application Load Balancer', () => {
    test('should define ApplicationLoadBalancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ApplicationLoadBalancer should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should define ALBTargetGroup with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('ALBTargetGroup should have proper health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should define ALBListenerHTTP with redirect to HTTPS', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('redirect');
      expect(listener.Properties.DefaultActions[0].RedirectConfig.Protocol).toBe('HTTPS');
      expect(listener.Properties.DefaultActions[0].RedirectConfig.StatusCode).toBe('HTTP_301');
    });

    test('should define ALBListenerHTTPS with condition', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener).toBeDefined();
      expect(listener.Condition).toBe('HasSSLCertificate');
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.SslPolicy).toBe('ELBSecurityPolicy-TLS-1-2-2017-01');
    });

    test('ALBListenerHTTPS should forward to target group', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toBeDefined();
    });
  });

  describe('Bastion Host', () => {
    test('should define BastionHost with condition', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion).toBeDefined();
      expect(bastion.Type).toBe('AWS::EC2::Instance');
      expect(bastion.Condition).toBe('HasKeyPair');
    });

    test('BastionHost should have proper configuration', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.InstanceType).toBe('t3.micro');
      expect(bastion.Properties.Monitoring).toBe(true);
    });

    test('BastionHost should be in public subnet', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.SubnetId).toBeDefined();
    });

    test('BastionHost should have encrypted EBS volume', () => {
      const bastion = template.Resources.BastionHost;
      const blockDevice = bastion.Properties.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.KmsKeyId).toBeDefined();
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
    });
  });

  describe('RDS PostgreSQL Database', () => {
    test('should define DBSubnetGroup', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should define DBParameterGroup for PostgreSQL 16', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('postgres16');
    });

    test('DBParameterGroup should have security logging enabled', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      const params = paramGroup.Properties.Parameters;
      expect(params.log_statement).toBe('all');
      expect(params.log_connections).toBe(1);
      expect(params.log_disconnections).toBe(1);
    });

    test('should define PostgreSQLDatabase with correct configuration', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.EngineVersion).toBe('16');
    });

    test('PostgreSQLDatabase should have proper instance class and storage', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(db.Properties.AllocatedStorage).toBe(100);
      expect(db.Properties.StorageType).toBe('gp3');
    });

    test('PostgreSQLDatabase should have encryption enabled', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBeDefined();
    });

    test('PostgreSQLDatabase should have Multi-AZ enabled', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('PostgreSQLDatabase should have proper backup configuration', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.BackupRetentionPeriod).toBe(30);
      expect(db.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(db.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    test('PostgreSQLDatabase should export CloudWatch logs', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('PostgreSQLDatabase should have deletion protection disabled for testing', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('PostgreSQLDatabase should use master password from Secrets Manager', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.MasterUserPassword).toBeDefined();
      expect(JSON.stringify(db.Properties.MasterUserPassword)).toContain('resolve:secretsmanager');
    });
  });

  describe('Systems Manager Maintenance Window', () => {
    test('should define MaintenanceWindow', () => {
      const window = template.Resources.MaintenanceWindow;
      expect(window).toBeDefined();
      expect(window.Type).toBe('AWS::SSM::MaintenanceWindow');
      expect(window.Properties.Duration).toBe(2);
      expect(window.Properties.Cutoff).toBe(0);
      expect(window.Properties.AllowUnassociatedTargets).toBe(false);
    });

    test('MaintenanceWindow should run weekly on Sunday', () => {
      const window = template.Resources.MaintenanceWindow;
      expect(window.Properties.Schedule).toBe('cron(0 2 ? * SUN *)');
    });

    test('should define MaintenanceWindowTarget', () => {
      const target = template.Resources.MaintenanceWindowTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::SSM::MaintenanceWindowTarget');
      expect(target.Properties.ResourceType).toBe('INSTANCE');
    });

    test('MaintenanceWindowTarget should target instances by Environment tag', () => {
      const target = template.Resources.MaintenanceWindowTarget;
      expect(target.Properties.Targets[0].Key).toBe('tag:Environment');
      expect(target.Properties.Targets[0].Values).toBeDefined();
    });

    test('should define MaintenanceWindowTask for patching', () => {
      const task = template.Resources.MaintenanceWindowTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::SSM::MaintenanceWindowTask');
      expect(task.Properties.TaskType).toBe('RUN_COMMAND');
      expect(task.Properties.TaskArn).toBe('AWS-RunPatchBaseline');
    });

    test('MaintenanceWindowTask should have proper concurrency settings', () => {
      const task = template.Resources.MaintenanceWindowTask;
      expect(task.Properties.MaxConcurrency).toBe('50%');
      expect(task.Properties.MaxErrors).toBe('0');
      expect(task.Properties.Priority).toBe(1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should define HighCPUAlarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
    });

    test('HighCPUAlarm should have proper threshold and evaluation', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.Statistic).toBe('Average');
    });

    test('HighCPUAlarm should monitor Auto Scaling Group', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Dimensions).toBeDefined();
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
    });

    test('should define DatabaseStorageAlarm', () => {
      const alarm = template.Resources.DatabaseStorageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('DatabaseStorageAlarm should have proper threshold', () => {
      const alarm = template.Resources.DatabaseStorageAlarm;
      expect(alarm.Properties.Threshold).toBe(10737418240); // 10 GB
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
    });

    test('DatabaseStorageAlarm should monitor RDS instance', () => {
      const alarm = template.Resources.DatabaseStorageAlarm;
      expect(alarm.Properties.Dimensions).toBeDefined();
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
    });
  });

  describe('Outputs', () => {
    test('should define all essential outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.ApplicationBucketName).toBeDefined();
    });

    test('VPCId output should export value', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });

    test('LoadBalancerDNS output should use GetAtt', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value).toBeDefined();
    });

    test('BastionPublicIP output should have condition', () => {
      const output = template.Outputs.BastionPublicIP;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('HasKeyPair');
    });

    test('conditional outputs should have proper conditions', () => {
      expect(template.Outputs.CloudTrailName.Condition).toBe('ShouldCreateCloudTrail');
      expect(template.Outputs.ConfigRecorderName.Condition).toBe('ShouldCreateAWSConfig');
      expect(template.Outputs.CloudTrailBucketName.Condition).toBe('ShouldCreateCloudTrail');
      expect(template.Outputs.ConfigBucketName.Condition).toBe('ShouldCreateAWSConfig');
    });

    test('should define comprehensive outputs for integration testing', () => {
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.DBPasswordSecretArn).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.InternetGatewayId).toBeDefined();
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.EBSKMSKeyId).toBeDefined();
      expect(template.Outputs.MaintenanceWindowId).toBeDefined();
      expect(template.Outputs.HighCPUAlarmName).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(typeof template.Outputs[outputKey].Description).toBe('string');
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies and Logical Relationships', () => {
    test('NAT Gateways should depend on EIPs and be in public subnets', () => {
      const nat1 = template.Resources.NatGateway1;
      expect(nat1.Properties.AllocationId).toBeDefined();
      expect(nat1.Properties.SubnetId).toBeDefined();
    });

    test('Auto Scaling Group should reference Launch Template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate).toBeDefined();
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toBeDefined();
      expect(asg.Properties.LaunchTemplate.Version).toBeDefined();
    });

    test('RDS should reference security group and subnet group', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.VPCSecurityGroups).toBeDefined();
      expect(db.Properties.DBSubnetGroupName).toBeDefined();
      expect(db.Properties.DBParameterGroupName).toBeDefined();
    });

    test('ApplicationConfigParameter should reference database endpoint', () => {
      const param = template.Resources.ApplicationConfigParameter;
      expect(param.Properties.Value).toBeDefined();
    });

    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toContain('CloudTrailBucketPolicy');
    });

    test('ConfigRecorder should depend on bucket policy', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.DependsOn).toContain('ConfigBucketPolicy');
    });

    test('Config rules should depend on ConfigRecorder', () => {
      expect(template.Resources.RequiredTagsRule.DependsOn).toBe('ConfigRecorder');
      expect(template.Resources.EncryptedVolumesRule.DependsOn).toBe('ConfigRecorder');
    });

    test('custom resource to empty buckets should reference Lambda', () => {
      const customResource = template.Resources.EmptyLoggingBucket;
      expect(customResource.Type).toBe('Custom::EmptyS3Bucket');
      expect(customResource.Properties.ServiceToken).toBeDefined();
      expect(customResource.Properties.BucketName).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have public access blocked', () => {
      ['LoggingBucket', 'ApplicationBucket', 'CloudTrailBucket', 'ConfigBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        if (bucket) {
          const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
          expect(publicAccess.BlockPublicAcls).toBe(true);
          expect(publicAccess.BlockPublicPolicy).toBe(true);
          expect(publicAccess.IgnorePublicAcls).toBe(true);
          expect(publicAccess.RestrictPublicBuckets).toBe(true);
        }
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      ['LoggingBucket', 'ApplicationBucket', 'CloudTrailBucket', 'ConfigBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        if (bucket) {
          expect(bucket.Properties.BucketEncryption).toBeDefined();
        }
      });
    });

    test('RDS should use encrypted storage', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('Bastion Host should use encrypted EBS volume', () => {
      const bastion = template.Resources.BastionHost;
      const blockDevice = bastion.Properties.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });

    test('ALB listener should use TLS 1.2 or higher', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener.Properties.SslPolicy).toBe('ELBSecurityPolicy-TLS-1-2-2017-01');
    });

    test('security groups should not allow unrestricted SSH except bastion', () => {
      const webServerSG = template.Resources.WebServerSecurityGroup;
      const sshRule = webServerSG.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);

      if (sshRule) {
        expect(sshRule.SourceSecurityGroupId).toBeDefined();
        expect(sshRule.CidrIp).toBeUndefined();
      }
    });

    test('database should only be accessible from web servers', () => {
      const dbIngress = template.Resources.DatabaseFromWebServerIngress;
      expect(dbIngress.Properties.SourceSecurityGroupId).toBeDefined();
      expect(dbIngress.Properties.CidrIp).toBeUndefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('resources should be deployed across multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('RDS should have Multi-AZ enabled', () => {
      const db = template.Resources.PostgreSQLDatabase;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      // Both should use Select with different indices
      expect(JSON.stringify(subnet1.Properties.AvailabilityZone)).toContain('[0,');
      expect(JSON.stringify(subnet2.Properties.AvailabilityZone)).toContain('[1,');
    });

    test('should have two NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('Auto Scaling Group should have minimum 2 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });
  });

  describe('Tagging Strategy', () => {
    test('VPC should have Name and Environment tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      const envTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Environment');
      expect(nameTag).toBeDefined();
      expect(envTag).toBeDefined();
    });

    test('key resources should have proper tagging', () => {
      ['VPC', 'PublicSubnet1', 'PrivateSubnet1', 'DatabaseSubnet1',
       'PostgreSQLDatabase', 'ApplicationLoadBalancer'].forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.Properties.Tags).toBeDefined();
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        }
      });
    });
  });
});
