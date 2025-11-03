import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for easier testing
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
      expect(template.Description).toBe('Secure and Scalable AWS Infrastructure with Best Security Practices');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });
  });

  // ==========================================
  // Parameters Tests
  // ==========================================
  describe('Parameters', () => {
    test('should have EnvironmentName parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('SecureInfra');
    });

    test('should have BucketPrefix parameter with validation', () => {
      const param = template.Parameters.BucketPrefix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secureinfraiac');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(37);
    });

    test('should have VPC and subnet CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have database parameters with constraints', () => {
      const dbUsername = template.Parameters.DBUsername;
      expect(dbUsername).toBeDefined();
      expect(dbUsername.Default).toBe('dbadmin');
      expect(dbUsername.MinLength).toBe(1);
      expect(dbUsername.MaxLength).toBe(16);
      expect(dbUsername.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');

      const dbInstanceClass = template.Parameters.DBInstanceClass;
      expect(dbInstanceClass).toBeDefined();
      expect(dbInstanceClass.AllowedValues).toContain('db.t3.micro');
      expect(dbInstanceClass.AllowedValues).toContain('db.t3.small');
      expect(dbInstanceClass.AllowedValues).toContain('db.t3.medium');
    });

    test('should have Auto Scaling parameters', () => {
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.MaxSize).toBeDefined();
      expect(template.Parameters.MaxSize.Default).toBe(6);
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.DesiredCapacity.Default).toBe(3);
    });

    test('should have NAT Gateway configuration parameters', () => {
      const enableNAT = template.Parameters.EnableNATGateway;
      expect(enableNAT).toBeDefined();
      expect(enableNAT.Default).toBe('false');
      expect(enableNAT.AllowedValues).toEqual(['true', 'false']);

      const haNAT = template.Parameters.HighAvailabilityNAT;
      expect(haNAT).toBeDefined();
      expect(haNAT.Default).toBe('false');
      expect(haNAT.AllowedValues).toEqual(['true', 'false']);
    });
  });

  // ==========================================
  // Conditions Tests
  // ==========================================
  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have UseNATGateway condition', () => {
      expect(template.Conditions.UseNATGateway).toBeDefined();
    });

    test('should have UseHighAvailabilityNAT condition', () => {
      expect(template.Conditions.UseHighAvailabilityNAT).toBeDefined();
    });
  });

  // ==========================================
  // KMS Resources Tests
  // ==========================================
  describe('KMS Resources', () => {
    test('should have KMS Key with proper configuration', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');

      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);

      // Check root permissions
      expect(keyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(keyPolicy.Statement[0].Effect).toBe('Allow');

      // Check service permissions
      expect(keyPolicy.Statement[1].Sid).toBe('Allow services to use the key');
      expect(keyPolicy.Statement[1].Principal.Service).toContain('s3.amazonaws.com');
      expect(keyPolicy.Statement[1].Principal.Service).toContain('rds.amazonaws.com');
      expect(keyPolicy.Statement[1].Principal.Service).toContain('logs.amazonaws.com');
      expect(keyPolicy.Statement[1].Principal.Service).toContain('cloudtrail.amazonaws.com');
    });

    test('should have KMS Key Alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/${EnvironmentName}-key' });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ==========================================
  // VPC and Networking Tests
  // ==========================================
  describe('VPC and Networking Resources', () => {
    test('should have VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have two public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);

      const subnet2 = template.Resources.PublicSubnet2;
      expect(subnet2).toBeDefined();
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have two private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });

      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet2).toBeDefined();
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have NAT Gateway resources with conditional creation', () => {
      const eip1 = template.Resources.NatGateway1EIP;
      expect(eip1).toBeDefined();
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Condition).toBe('UseNATGateway');
      expect(eip1.DependsOn).toBe('InternetGatewayAttachment');

      const nat1 = template.Resources.NatGateway1;
      expect(nat1).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Condition).toBe('UseNATGateway');

      const eip2 = template.Resources.NatGateway2EIP;
      expect(eip2).toBeDefined();
      expect(eip2.Condition).toBe('UseHighAvailabilityNAT');

      const nat2 = template.Resources.NatGateway2;
      expect(nat2).toBeDefined();
      expect(nat2.Condition).toBe('UseHighAvailabilityNAT');
    });

    test('should have route tables with proper associations', () => {
      const publicRT = template.Resources.PublicRouteTable;
      expect(publicRT).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRT.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const privateRT1 = template.Resources.PrivateRouteTable1;
      expect(privateRT1).toBeDefined();

      const privateRT2 = template.Resources.PrivateRouteTable2;
      expect(privateRT2).toBeDefined();
    });

    test('should have default routes configured correctly', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');

      const privateRoute1 = template.Resources.DefaultPrivateRoute1;
      expect(privateRoute1).toBeDefined();
      expect(privateRoute1.Condition).toBe('UseNATGateway');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    });

    test('should have S3 VPC Endpoint', () => {
      const s3Endpoint = template.Resources.S3Endpoint;
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(s3Endpoint.Properties.ServiceName).toEqual({ 'Fn::Sub': 'com.amazonaws.${AWS::Region}.s3' });
      expect(s3Endpoint.Properties.RouteTableIds).toContainEqual({ Ref: 'PrivateRouteTable1' });
      expect(s3Endpoint.Properties.RouteTableIds).toContainEqual({ Ref: 'PrivateRouteTable2' });
    });
  });

  // ==========================================
  // IAM Resources Tests
  // ==========================================
  describe('IAM Resources', () => {
    test('should have EC2 Role with proper permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': '${EnvironmentName}-EC2-Role' });

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3Access');
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('should have Lambda Role with VPC execution permissions', () => {
      const role = template.Resources.LambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': '${EnvironmentName}-Lambda-Role' });

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');

      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('should have Cleanup Lambda Role with EC2 permissions', () => {
      const role = template.Resources.CleanupLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('CleanupPolicy');

      const statements = policies[0].PolicyDocument.Statement;
      expect(statements[0].Action).toContain('ec2:DescribeSnapshots');
      expect(statements[0].Action).toContain('ec2:DeleteSnapshot');
      expect(statements[0].Action).toContain('ec2:DescribeVolumes');
      expect(statements[0].Action).toContain('ec2:DeleteVolume');
    });
  });

  // ==========================================
  // Secrets Manager Tests
  // ==========================================
  describe('Secrets Manager Resources', () => {
    test('should have DB Password Secret with KMS encryption', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-DB-Password' });
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });

      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.GenerateStringKey).toBe('password');
      expect(genConfig.ExcludeCharacters).toBe('"@/\\');
    });

    test('should have Secret RDS Attachment', () => {
      const attachment = template.Resources.SecretRDSAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(attachment.Properties.SecretId).toEqual({ Ref: 'DBPasswordSecret' });
      expect(attachment.Properties.TargetId).toEqual({ Ref: 'RDSInstance' });
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBInstance');
    });
  });

  // ==========================================
  // Security Groups Tests
  // ==========================================
  describe('Security Groups', () => {
    test('should have ALB Security Group with HTTPS and HTTP ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 Security Group with ALB and SSH access', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const albRule = ingress.find((r: any) => r.SourceSecurityGroupId);
      expect(albRule).toBeDefined();
      expect(albRule.FromPort).toBe(80);
      expect(albRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });

      const sshRule = ingress.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
    });

    test('should have RDS Security Group with EC2 and Lambda access', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      ingress.forEach((rule: any) => {
        expect(rule.IpProtocol).toBe('tcp');
        expect(rule.FromPort).toBe(3306);
        expect(rule.ToPort).toBe(3306);
      });
    });

    test('should have Lambda Security Group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  // ==========================================
  // S3 Buckets Tests
  // ==========================================
  describe('S3 Buckets', () => {
    test('should have App Bucket with KMS encryption and versioning', () => {
      const bucket = template.Resources.AppBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });

      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have App Bucket with lifecycle policies', () => {
      const bucket = template.Resources.AppBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toHaveLength(2);

      const deleteOldVersions = rules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(deleteOldVersions).toBeDefined();
      expect(deleteOldVersions.NoncurrentVersionExpirationInDays).toBe(30);

      const transition = rules.find((r: any) => r.Id === 'TransitionToIA');
      expect(transition).toBeDefined();
      expect(transition.Transitions).toHaveLength(2);
    });

    test('should have Logging Bucket with proper configuration', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.Id).toBe('DeleteOldLogs');
      expect(lifecycle.ExpirationInDays).toBe(90);
    });

    test('should have Logging Bucket Policy with ELB and CloudTrail permissions', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);

      const elbRootAccount = statements.find((s: any) => s.Sid === 'AllowELBRootAccountAccess');
      expect(elbRootAccount).toBeDefined();

      const elbService = statements.find((s: any) => s.Sid === 'AllowELBLogDeliveryService');
      expect(elbService).toBeDefined();
      expect(elbService.Principal.Service).toBe('logdelivery.elasticloadbalancing.amazonaws.com');

      const cloudTrail = statements.find((s: any) => s.Sid === 'AllowCloudTrailLogging');
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });
  });

  // ==========================================
  // RDS Tests
  // ==========================================
  describe('RDS Resources', () => {
    test('should have DB Subnet Group with private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have RDS Instance with encryption and proper configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');

      const props = rds.Properties;
      expect(props.Engine).toBe('mysql');
      expect(props.EngineVersion).toBe('8.0.43');
      expect(props.StorageEncrypted).toBe(true);
      expect(props.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
      expect(props.StorageType).toBe('gp3');
      expect(props.BackupRetentionPeriod).toBe(7);
      expect(props.DeletionProtection).toBe(false);
      expect(props.VPCSecurityGroups).toContainEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('should have RDS Instance with CloudWatch Logs exports', () => {
      const rds = template.Resources.RDSInstance;
      const logs = rds.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('error');
      expect(logs).toContain('general');
      expect(logs).toContain('slowquery');
    });
  });

  // ==========================================
  // Load Balancer Tests
  // ==========================================
  describe('Application Load Balancer Resources', () => {
    test('should have ALB with proper configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.DependsOn).toBe('LoggingBucketPolicy');

      const props = alb.Properties;
      expect(props.Type).toBe('application');
      expect(props.Scheme).toBe('internet-facing');
      expect(props.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(props.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
      expect(props.SecurityGroups).toContainEqual({ Ref: 'ALBSecurityGroup' });

      const attrs = props.LoadBalancerAttributes;
      const logsEnabled = attrs.find((a: any) => a.Key === 'access_logs.s3.enabled');
      expect(logsEnabled.Value).toBe(true);

      const deletionProtection = attrs.find((a: any) => a.Key === 'deletion_protection.enabled');
      expect(deletionProtection.Value).toBe(true);
    });

    test('should have Target Group with health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');

      const props = tg.Properties;
      expect(props.Port).toBe(80);
      expect(props.Protocol).toBe('HTTP');
      expect(props.TargetType).toBe('instance');
      expect(props.HealthCheckEnabled).toBe(true);
      expect(props.HealthCheckPath).toBe('/health');
      expect(props.HealthCheckIntervalSeconds).toBe(30);
      expect(props.HealthyThresholdCount).toBe(2);
      expect(props.UnhealthyThresholdCount).toBe(3);
    });

    test('should have HTTP Listener with HTTPS redirect', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');

      const props = listener.Properties;
      expect(props.Port).toBe(80);
      expect(props.Protocol).toBe('HTTP');

      const action = props.DefaultActions[0];
      expect(action.Type).toBe('redirect');
      expect(action.RedirectConfig.Protocol).toBe('HTTPS');
      expect(action.RedirectConfig.Port).toBe(443);
      expect(action.RedirectConfig.StatusCode).toBe('HTTP_301');
    });
  });

  // ==========================================
  // Auto Scaling Tests
  // ==========================================
  describe('Auto Scaling Resources', () => {
    test('should have Launch Template with proper configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');

      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(data.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(data.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
      expect(data.SecurityGroupIds).toContainEqual({ Ref: 'EC2SecurityGroup' });
      expect(data.Monitoring.Enabled).toBe(true);

      const blockDevice = data.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.VolumeSize).toBe(8);
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('should have Launch Template with user data', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have Auto Scaling Group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');

      const props = asg.Properties;
      expect(props.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(props.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(props.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(props.MinSize).toEqual({ Ref: 'MinSize' });
      expect(props.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(props.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
      expect(props.HealthCheckType).toBe('ELB');
      expect(props.HealthCheckGracePeriod).toBe(300);
      expect(props.TargetGroupARNs).toContainEqual({ Ref: 'ALBTargetGroup' });
    });

    test('should have Scaling Policy with target tracking', () => {
      const policy = template.Resources.ScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');

      const config = policy.Properties.TargetTrackingConfiguration;
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
      expect(config.TargetValue).toBe(70.0);
    });
  });

  // ==========================================
  // Lambda Tests
  // ==========================================
  describe('Lambda Resources', () => {
    test('should have main Lambda Function in VPC', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      const props = lambda.Properties;
      expect(props.Runtime).toBe('python3.11');
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Role).toEqual({ 'Fn::GetAtt': ['LambdaRole', 'Arn'] });
      expect(props.ReservedConcurrentExecutions).toBe(10);

      const vpcConfig = props.VpcConfig;
      expect(vpcConfig.SecurityGroupIds).toContainEqual({ Ref: 'LambdaSecurityGroup' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });

      const env = props.Environment.Variables;
      expect(env.DB_SECRET_ARN).toEqual({ Ref: 'DBPasswordSecret' });
      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentName' });
    });

    test('should have Cleanup Lambda Function', () => {
      const lambda = template.Resources.CleanupLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      const props = lambda.Properties;
      expect(props.Runtime).toBe('python3.11');
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Timeout).toBe(60);
      expect(props.Code.ZipFile).toBeDefined();
    });

    test('should have Lambda Permission for EventBridge', () => {
      const permission = template.Resources.CleanupLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::GetAtt': ['CleanupSchedule', 'Arn'] });
    });
  });

  // ==========================================
  // CloudTrail Tests
  // ==========================================
  describe('CloudTrail Resources', () => {
    test('should have CloudTrail with proper configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toBe('LoggingBucketPolicy');

      const props = trail.Properties;
      expect(props.S3BucketName).toEqual({ Ref: 'LoggingBucket' });
      expect(props.IsMultiRegionTrail).toBe(true);
      expect(props.EnableLogFileValidation).toBe(true);
      expect(props.IncludeGlobalServiceEvents).toBe(true);
      expect(props.IsLogging).toBe(true);

      const eventSelectors = props.EventSelectors[0];
      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
      expect(eventSelectors.DataResources).toHaveLength(1);
    });
  });

  // ==========================================
  // CloudFront Tests
  // ==========================================
  describe('CloudFront Resources', () => {
    test('should have CloudFront Distribution with HTTPS redirect', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf).toBeDefined();
      expect(cf.Type).toBe('AWS::CloudFront::Distribution');

      const config = cf.Properties.DistributionConfig;
      expect(config.Enabled).toBe(true);
      expect(config.DefaultRootObject).toBe('index.html');
      expect(config.HttpVersion).toBe('http2');
      expect(config.PriceClass).toBe('PriceClass_100');

      const behavior = config.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(behavior.Compress).toBe(true);
      expect(behavior.AllowedMethods).toContain('GET');
      expect(behavior.AllowedMethods).toContain('HEAD');
      expect(behavior.AllowedMethods).toContain('OPTIONS');
    });

    test('should have CloudFront Origin Access Identity', () => {
      const oai = template.Resources.CloudFrontOAI;
      expect(oai).toBeDefined();
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(oai.Properties.CloudFrontOriginAccessIdentityConfig).toBeDefined();
    });
  });

  // ==========================================
  // GuardDuty Tests
  // ==========================================
  describe('GuardDuty Resources', () => {
    test('should have GuardDuty Detector enabled', () => {
      const detector = template.Resources.GuardDutyDetector;
      expect(detector).toBeDefined();
      expect(detector.Type).toBe('AWS::GuardDuty::Detector');
      expect(detector.Properties.Enable).toBe(true);
      expect(detector.Properties.FindingPublishingFrequency).toBe('FIFTEEN_MINUTES');
    });
  });

  // ==========================================
  // WAF Tests
  // ==========================================
  describe('WAF Resources', () => {
    test('should have WebACL with security rules', () => {
      const waf = template.Resources.WebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
      expect(waf.Properties.DefaultAction).toEqual({ Allow: {} });

      const rules = waf.Properties.Rules;
      expect(rules).toHaveLength(3);

      const rateLimit = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimit).toBeDefined();
      expect(rateLimit.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimit.Action).toEqual({ Block: {} });

      const sqli = rules.find((r: any) => r.Name === 'SQLiRule');
      expect(sqli).toBeDefined();
      expect(sqli.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');

      const common = rules.find((r: any) => r.Name === 'CommonRuleSet');
      expect(common).toBeDefined();
      expect(common.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
    });

    test('should have WebACL Association with ALB', () => {
      const association = template.Resources.WebACLAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(association.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(association.Properties.WebACLArn).toEqual({ 'Fn::GetAtt': ['WebACL', 'Arn'] });
    });
  });

  // ==========================================
  // CloudWatch Alarms Tests
  // ==========================================
  describe('CloudWatch Alarms', () => {
    test('should have High CPU Alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const props = alarm.Properties;
      expect(props.MetricName).toBe('CPUUtilization');
      expect(props.Namespace).toBe('AWS/EC2');
      expect(props.Statistic).toBe('Average');
      expect(props.Period).toBe(300);
      expect(props.EvaluationPeriods).toBe(2);
      expect(props.Threshold).toBe(80);
      expect(props.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have RDS Storage Alarm', () => {
      const alarm = template.Resources.RDSStorageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

      const props = alarm.Properties;
      expect(props.MetricName).toBe('FreeStorageSpace');
      expect(props.Namespace).toBe('AWS/RDS');
      expect(props.Threshold).toBe(1073741824); // 1GB in bytes
      expect(props.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  // ==========================================
  // EventBridge Tests
  // ==========================================
  describe('EventBridge Resources', () => {
    test('should have Cleanup Schedule', () => {
      const schedule = template.Resources.CleanupSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::Events::Rule');
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 day)');
      expect(schedule.Properties.State).toBe('ENABLED');
      expect(schedule.Properties.Targets).toHaveLength(1);
      expect(schedule.Properties.Targets[0].Arn).toEqual({ 'Fn::GetAtt': ['CleanupLambda', 'Arn'] });
    });
  });

  // ==========================================
  // Outputs Tests
  // ==========================================
  describe('Outputs', () => {
    test('should have all critical infrastructure outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBEndpoint',
        'CloudFrontURL',
        'AppBucketName',
        'RDSEndpoint',
        'LambdaFunctionArn',
        'KMSKeyId',
        'KMSKeyArn',
        'DBSecretArn',
        'LoggingBucketName',
        'AutoScalingGroupName',
        'LaunchTemplateId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have security group outputs', () => {
      const sgOutputs = [
        'EC2SecurityGroupId',
        'RDSSecurityGroupId',
        'ALBSecurityGroupId',
        'LambdaSecurityGroupId'
      ];

      sgOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should have subnet outputs', () => {
      const subnetOutputs = [
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PublicSubnet1Id',
        'PublicSubnet2Id'
      ];

      subnetOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have monitoring and security outputs', () => {
      const monitoringOutputs = [
        'HighCPUAlarmName',
        'RDSStorageAlarmName',
        'GuardDutyDetectorId',
        'WebACLArn',
        'CloudTrailArn'
      ];

      monitoringOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have IAM role outputs', () => {
      expect(template.Outputs.EC2RoleArn).toBeDefined();
      expect(template.Outputs.LambdaRoleArn).toBeDefined();
    });

    test('should export outputs with proper naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  // ==========================================
  // Resource Dependencies Tests
  // ==========================================
  describe('Resource Dependencies', () => {
    test('should have proper dependencies for NAT Gateway EIPs', () => {
      const eip1 = template.Resources.NatGateway1EIP;
      expect(eip1.DependsOn).toBe('InternetGatewayAttachment');

      if (template.Resources.NatGateway2EIP) {
        const eip2 = template.Resources.NatGateway2EIP;
        expect(eip2.DependsOn).toBe('InternetGatewayAttachment');
      }
    });

    test('should have proper dependencies for ALB', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toBe('LoggingBucketPolicy');
    });

    test('should have proper dependencies for CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('LoggingBucketPolicy');
    });

    test('should have proper dependencies for routes', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });
  });

  // ==========================================
  // Tagging Tests
  // ==========================================
  describe('Resource Tagging', () => {
    test('should have tags on VPC resources', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);

        const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      });
    });

    test('should have tags on S3 buckets', () => {
      const appBucket = template.Resources.AppBucket;
      expect(appBucket.Properties.Tags).toBeDefined();

      const loggingBucket = template.Resources.LoggingBucket;
      expect(loggingBucket.Properties.Tags).toBeDefined();
    });

    test('should have tags on Lambda functions', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Tags).toBeDefined();

      const cleanupLambda = template.Resources.CleanupLambda;
      expect(cleanupLambda.Properties.Tags).toBeDefined();
    });
  });

  // ==========================================
  // Security Best Practices Tests
  // ==========================================
  describe('Security Best Practices', () => {
    test('should enforce encryption at rest for all data stores', () => {
      // RDS encryption
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBeDefined();

      // S3 encryption
      const appBucket = template.Resources.AppBucket;
      expect(appBucket.Properties.BucketEncryption).toBeDefined();

      // Secrets Manager encryption
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('should have deletion protection and backup policies', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should block public access on S3 buckets', () => {
      const appBucket = template.Resources.AppBucket;
      const publicAccess = appBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should enable versioning on critical S3 buckets', () => {
      const appBucket = template.Resources.AppBucket;
      expect(appBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should use private subnets for compute and database resources', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });

      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should enable multi-region trail for CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should enforce HTTPS for CloudFront', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have WAF protection for ALB', () => {
      const association = template.Resources.WebACLAssociation;
      expect(association).toBeDefined();
      expect(association.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });
  });
});
