import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  describe('Parameters Validation', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'Environment',
        'EnvironmentSuffix',
        'VpcCidr',
        'TrustedIPRange',
        'InstanceType',
        'DBInstanceClass',
        'DBMasterUsername',
        'DomainName',
        'MinInstances',
        'MaxInstances',
        'DesiredInstances',
        'LatestAmiId'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters).toHaveProperty(param);
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ha-webapp');
      expect(param.Description).toBeDefined();
    });

    test('Environment parameter should have correct allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toContain('production');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('development');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBeDefined();
    });

    test('VpcCidr parameter should have CIDR pattern validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('TrustedIPRange parameter should have CIDR pattern validation', () => {
      const param = template.Parameters.TrustedIPRange;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
      expect(param.AllowedValues).toContain('m5.large');
    });

    test('DBInstanceClass parameter should be defined', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.small');
    });

    test('DBMasterUsername parameter should have constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('MinInstances, MaxInstances, DesiredInstances should be numbers', () => {
      expect(template.Parameters.MinInstances.Type).toBe('Number');
      expect(template.Parameters.MaxInstances.Type).toBe('Number');
      expect(template.Parameters.DesiredInstances.Type).toBe('Number');
      expect(template.Parameters.MinInstances.MinValue).toBe(2);
      expect(template.Parameters.MaxInstances.MinValue).toBe(2);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should reference VpcCidr parameter', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(Array.isArray(vpc.Properties.Tags)).toBe(true);

      const tagKeys = vpc.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets in 2 AZs', () => {
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2).toBeDefined();
      expect(template.Resources.PublicSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnetAZ2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnetAZ1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnetAZ2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in 2 AZs', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnetAZ2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have DB subnets in 2 AZs', () => {
      expect(template.Resources.DBSubnetAZ1).toBeDefined();
      expect(template.Resources.DBSubnetAZ2).toBeDefined();
      expect(template.Resources.DBSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.DBSubnetAZ2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should have different CIDR blocks', () => {
      const cidrs = [
        template.Resources.PublicSubnetAZ1.Properties.CidrBlock,
        template.Resources.PublicSubnetAZ2.Properties.CidrBlock,
        template.Resources.PrivateSubnetAZ1.Properties.CidrBlock,
        template.Resources.PrivateSubnetAZ2.Properties.CidrBlock,
        template.Resources.DBSubnetAZ1.Properties.CidrBlock,
        template.Resources.DBSubnetAZ2.Properties.CidrBlock
      ];

      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(cidrs.length);
    });

    test('subnets should be in different availability zones', () => {
      const az1Subnets = [
        template.Resources.PublicSubnetAZ1,
        template.Resources.PrivateSubnetAZ1,
        template.Resources.DBSubnetAZ1
      ];

      const az2Subnets = [
        template.Resources.PublicSubnetAZ2,
        template.Resources.PrivateSubnetAZ2,
        template.Resources.DBSubnetAZ2
      ];

      az1Subnets.forEach(subnet => {
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
      });

      az2Subnets.forEach(subnet => {
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }]
        });
      });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateways in 2 AZs', () => {
      expect(template.Resources.NatGatewayAZ1).toBeDefined();
      expect(template.Resources.NatGatewayAZ2).toBeDefined();
      expect(template.Resources.NatGatewayAZ1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayAZ2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGatewayEIPAZ1).toBeDefined();
      expect(template.Resources.NatGatewayEIPAZ2).toBeDefined();
      expect(template.Resources.NatGatewayEIPAZ1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGatewayEIPAZ2.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway EIPs should depend on Gateway Attachment', () => {
      expect(template.Resources.NatGatewayEIPAZ1.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NatGatewayEIPAZ2.DependsOn).toBe('AttachGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NatGatewayAZ1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ1' });
      expect(template.Resources.NatGatewayAZ2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ2' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route tables in 2 AZs', () => {
      expect(template.Resources.PrivateRouteTableAZ1).toBeDefined();
      expect(template.Resources.PrivateRouteTableAZ2).toBeDefined();
    });

    test('public route should route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('private routes should route to NAT Gateways', () => {
      expect(template.Resources.PrivateRouteAZ1.Properties.NatGatewayId).toEqual({ Ref: 'NatGatewayAZ1' });
      expect(template.Resources.PrivateRouteAZ2.Properties.NatGatewayId).toEqual({ Ref: 'NatGatewayAZ2' });
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Group Resources', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS from trusted IPs', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toEqual({ Ref: 'TrustedIPRange' });
      expect(httpsRule.CidrIp).toEqual({ Ref: 'TrustedIPRange' });
    });

    test('should have WebServer security group', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServer security group should only allow traffic from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should have Database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Database security group should only allow MySQL from web servers', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have StaticContentBucket', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('StaticContentBucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
    });

    test('StaticContentBucket should block public access', () => {
      const bucket = template.Resources.StaticContentBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('StaticContentBucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have LogsBucket', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('LogsBucket should have lifecycle policy', () => {
      const bucket = template.Resources.LogsBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toHaveLength(1);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].ExpirationInDays).toBe(90);
    });

    test('should have LogsBucketPolicy for ALB access', () => {
      const policy = template.Resources.LogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS Key', () => {
      const key = template.Resources.KMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have proper key policy', () => {
      const key = template.Resources.KMSKey;
      const policy = key.Properties.KeyPolicy;

      expect(policy.Version).toBe('2012-10-17');
      expect(Array.isArray(policy.Statement)).toBe(true);
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS Key policy should allow root account', () => {
      const key = template.Resources.KMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('should have KMS Key Alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM Role', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 Role should have proper trust policy', () => {
      const role = template.Resources.EC2Role;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 Role should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 Role should have S3 access policy following least privilege', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();

      const statements = s3Policy.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThan(0);

      // Check for specific S3 permissions, not wildcard
      const s3Statement = statements.find((s: any) =>
        s.Action.includes('s3:GetObject') || s.Action.includes('s3:PutObject')
      );
      expect(s3Statement).toBeDefined();
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnetAZ1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnetAZ2' });
    });

    test('should have ALB Target Group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALB Target Group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBeDefined();
      expect(tg.Properties.HealthyThresholdCount).toBeDefined();
      expect(tg.Properties.UnhealthyThresholdCount).toBeDefined();
    });

    test('should have HTTP Listener', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use latest AMI parameter', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('Launch Template should have IAM Instance Profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('Launch Template should have UserData', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should use Min, Max, Desired parameters', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinInstances' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxInstances' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredInstances' });
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnetAZ1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnetAZ2' });
    });

    test('ASG should have ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBeDefined();
    });

    test('should have Scaling Policy', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('RDS Resources', () => {
    test('should have DB Master Password Secret', () => {
      const secret = template.Resources.DBMasterPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB Secret should be encrypted with KMS', () => {
      const secret = template.Resources.DBMasterPasswordSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('DB Secret should generate complex password', () => {
      const secret = template.Resources.DBMasterPasswordSecret;
      const config = secret.Properties.GenerateSecretString;

      expect(config.PasswordLength).toBe(32);
      expect(config.RequireEachIncludedType).toBe(true);
      expect(config.ExcludeCharacters).toBeDefined();
    });

    test('should have DB Subnet Group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB Subnet Group should include DB subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DBSubnetAZ1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DBSubnetAZ2' });
    });

    test('should have RDS Database Instance', () => {
      const db = template.Resources.Database;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Database should be Multi-AZ', () => {
      const db = template.Resources.Database;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('Database should have encryption enabled', () => {
      const db = template.Resources.Database;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('Database should have backup retention', () => {
      const db = template.Resources.Database;
      expect(db.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(db.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('Database should have CloudWatch logs enabled', () => {
      const db = template.Resources.Database;
      expect(db.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(Array.isArray(db.Properties.EnableCloudwatchLogsExports)).toBe(true);
      expect(db.Properties.EnableCloudwatchLogsExports.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Application Log Group', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log Group should have retention policy', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });

    test('Log Group should be encrypted', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('should have ALB Target Health Alarm', () => {
      const alarm = template.Resources.ALBTargetHealthAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have High CPU Alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBeGreaterThan(0);
    });

    test('should have Database CPU Alarm', () => {
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should have Database Storage Alarm', () => {
      const alarm = template.Resources.DatabaseStorageSpaceAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
    });
  });

  describe('Route53 Resources', () => {
    test('should have Hosted Zone', () => {
      const hz = template.Resources.HostedZone;
      expect(hz).toBeDefined();
      expect(hz.Type).toBe('AWS::Route53::HostedZone');
    });

    test('Hosted Zone should use DomainName parameter', () => {
      const hz = template.Resources.HostedZone;
      expect(hz.Properties.Name).toEqual({ Ref: 'DomainName' });
    });

    test('should have Route53 Health Check', () => {
      const hc = template.Resources.Route53HealthCheck;
      expect(hc).toBeDefined();
      expect(hc.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('Health Check should monitor ALB health endpoint', () => {
      const hc = template.Resources.Route53HealthCheck;
      expect(hc.Properties.HealthCheckConfig.ResourcePath).toBe('/health');
      expect(hc.Properties.HealthCheckConfig.Type).toBe('HTTP');
    });

    test('should have Route53 RecordSet', () => {
      const rs = template.Resources.Route53RecordSet;
      expect(rs).toBeDefined();
      expect(rs.Type).toBe('AWS::Route53::RecordSet');
    });

    test('RecordSet should point to ALB', () => {
      const rs = template.Resources.Route53RecordSet;
      expect(rs.Properties.Type).toBe('A');
      expect(rs.Properties.AliasTarget).toBeDefined();
      expect(rs.Properties.AliasTarget.EvaluateTargetHealth).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'LoadBalancerDNS',
        'StaticContentBucketName',
        'LogsBucketName',
        'DatabaseEndpoint',
        'WebServerSecurityGroupId'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
      expect(output.Export).toBeDefined();
    });

    test('StaticContentBucketName output should be correct', () => {
      const output = template.Outputs.StaticContentBucketName;
      expect(output.Value).toEqual({ Ref: 'StaticContentBucket' });
      expect(output.Export).toBeDefined();
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['Database', 'Endpoint.Address']
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Export).toBeDefined();
        expect(template.Outputs[key].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && (resource.Properties.Tags || resource.Properties.HostedZoneTags || resource.Properties.HealthCheckTags);
      });

      taggableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const tags = resource.Properties.Tags || resource.Properties.HostedZoneTags || resource.Properties.HealthCheckTags;

        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      });
    });

    test('all taggable resources should have Project tag', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && (resource.Properties.Tags || resource.Properties.HostedZoneTags || resource.Properties.HealthCheckTags);
      });

      taggableResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const tags = resource.Properties.Tags || resource.Properties.HostedZoneTags || resource.Properties.HealthCheckTags;

        const projectTag = tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      const buckets = [template.Resources.StaticContentBucket, template.Resources.LogsBucket];

      buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('RDS should have deletion protection disabled (for dev)', () => {
      const db = template.Resources.Database;
      expect(db.Properties.DeletionProtection).toBe(false);
      expect(db.DeletionPolicy).toBe('Delete');
    });

    test('security groups should have descriptions', () => {
      const securityGroups = [
        template.Resources.ALBSecurityGroup,
        template.Resources.WebServerSecurityGroup,
        template.Resources.DatabaseSecurityGroup
      ];

      securityGroups.forEach(sg => {
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.GroupDescription.length).toBeGreaterThan(0);
      });
    });

    test('database credentials should use Secrets Manager', () => {
      const db = template.Resources.Database;
      const password = db.Properties.MasterUserPassword;

      expect(password['Fn::Sub']).toBeDefined();
      expect(password['Fn::Sub']).toContain('secretsmanager');
    });
  });

  describe('High Availability', () => {
    test('resources should be distributed across multiple AZs', () => {
      // Check subnets are in 2 AZs
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2).toBeDefined();

      // Check NAT Gateways in 2 AZs
      expect(template.Resources.NatGatewayAZ1).toBeDefined();
      expect(template.Resources.NatGatewayAZ2).toBeDefined();

      // Check RDS Multi-AZ
      expect(template.Resources.Database.Properties.MultiAZ).toBe(true);
    });

    test('Auto Scaling should span multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);
    });

    test('Load Balancer should span multiple AZs', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets.length).toBeGreaterThanOrEqual(2);
    });
  });
});
