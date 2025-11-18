import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');

    // Parse YAML - for actual parsing, cfn-flip or js-yaml would be used
    // For unit tests, we'll assume the template is available as JSON
    try {
      const jsonPath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(jsonPath)) {
        const templateContent = fs.readFileSync(jsonPath, 'utf8');
        template = JSON.parse(templateContent);
      } else {
        // Fallback: use yaml parser if json not available
        const yaml = require('js-yaml');
        template = yaml.load(yamlContent);
      }
    } catch (error) {
      throw new Error('Failed to load template. Run: pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json');
    }
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
      expect(template.Description).toContain('Production-ready multi-tier web application infrastructure');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });
  });

  // ==========================================
  // Parameters Tests
  // ==========================================

  describe('Parameters', () => {
    test('should have LatestAmiId parameter with SSM type', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should have KeyName parameter with optional configuration', () => {
      const param = template.Parameters.KeyName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have DBUsername parameter with constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
      expect(param.Default).toBe('dbadmin');
    });

    test('should have CreateNATGateways parameter with boolean values', () => {
      const param = template.Parameters.CreateNATGateways;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  // ==========================================
  // Conditions Tests
  // ==========================================

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have ShouldCreateNATGateways condition', () => {
      expect(template.Conditions.ShouldCreateNATGateways).toBeDefined();
    });
  });

  // ==========================================
  // KMS Resources Tests
  // ==========================================

  describe('KMS Resources', () => {
    test('should define KMSKey resource', () => {
      const resource = template.Resources.KMSKey;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey should have proper key policy', () => {
      const resource = template.Resources.KMSKey;
      const policy = resource.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(policy.Statement[1].Sid).toBe('Allow services to use the key');
    });

    test('KMSKey should allow required AWS services', () => {
      const resource = template.Resources.KMSKey;
      const serviceStatement = resource.Properties.KeyPolicy.Statement[1];
      expect(serviceStatement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('cloudwatch.amazonaws.com');
    });

    test('KMSKey should have Production environment tag', () => {
      const resource = template.Resources.KMSKey;
      const tags = resource.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
    });

    test('should define KMSKeyAlias resource', () => {
      const resource = template.Resources.KMSKeyAlias;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Alias');
      expect(resource.Properties.AliasName).toBe('alias/production-encryption-key');
    });

    test('KMSKeyAlias should reference KMSKey', () => {
      const resource = template.Resources.KMSKeyAlias;
      expect(resource.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ==========================================
  // Secrets Manager Tests
  // ==========================================

  describe('Secrets Manager Resources', () => {
    test('should define DBPasswordSecret resource', () => {
      const resource = template.Resources.DBPasswordSecret;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DBPasswordSecret should have correct name', () => {
      const resource = template.Resources.DBPasswordSecret;
      expect(resource.Properties.Name).toBe('production-db-password');
    });

    test('DBPasswordSecret should generate password with correct settings', () => {
      const resource = template.Resources.DBPasswordSecret;
      const genConfig = resource.Properties.GenerateSecretString;
      expect(genConfig.GenerateStringKey).toBe('password');
      expect(genConfig.PasswordLength).toBe(32);
      // YAML parser may escape the backslash, so we check for either format
      expect(genConfig.ExcludeCharacters).toMatch(/^"@\/['\\]$/);
      expect(genConfig.RequireEachIncludedType).toBe(true);
    });

    test('DBPasswordSecret should be encrypted with KMS', () => {
      const resource = template.Resources.DBPasswordSecret;
      expect(resource.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ==========================================
  // VPC and Networking Tests
  // ==========================================

  describe('VPC Resources', () => {
    test('should define VPC resource', () => {
      const resource = template.Resources.VPC;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const resource = template.Resources.VPC;
      expect(resource.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const resource = template.Resources.VPC;
      expect(resource.Properties.EnableDnsHostnames).toBe(true);
      expect(resource.Properties.EnableDnsSupport).toBe(true);
    });

    test('should define InternetGateway resource', () => {
      const resource = template.Resources.InternetGateway;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach InternetGateway to VPC', () => {
      const resource = template.Resources.AttachGateway;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(resource.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(resource.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should define two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('public subnets should auto-assign public IPs', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should define two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.20.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const pub1Az = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const pub2Az = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(pub1Az).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(pub2Az).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should define NAT Gateway EIPs with conditions', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;
      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(eip1.Condition).toBe('ShouldCreateNATGateways');
      expect(eip2.Condition).toBe('ShouldCreateNATGateways');
    });

    test('NAT Gateway EIPs should depend on gateway attachment', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      expect(eip1.DependsOn).toBe('AttachGateway');
    });

    test('should define NAT Gateways with conditions', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Condition).toBe('ShouldCreateNATGateways');
      expect(nat2.Condition).toBe('ShouldCreateNATGateways');
    });

    test('NAT Gateways should be in public subnets', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Route Table Resources', () => {
    test('should define public route table', () => {
      const resource = template.Resources.PublicRouteTable;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::RouteTable');
      expect(resource.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should define public route to internet gateway', () => {
      const resource = template.Resources.PublicRoute;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::Route');
      expect(resource.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(resource.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('public subnets should be associated with public route table', () => {
      const assoc1 = template.Resources.PublicSubnetRouteTableAssociation1;
      const assoc2 = template.Resources.PublicSubnetRouteTableAssociation2;
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should define private route tables for each AZ', () => {
      const rt1 = template.Resources.PrivateRouteTable1;
      const rt2 = template.Resources.PrivateRouteTable2;
      expect(rt1).toBeDefined();
      expect(rt2).toBeDefined();
      expect(rt1.Type).toBe('AWS::EC2::RouteTable');
      expect(rt2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('private routes should have conditions for NAT gateways', () => {
      const route1 = template.Resources.PrivateRoute1;
      const route2 = template.Resources.PrivateRoute2;
      expect(route1.Condition).toBe('ShouldCreateNATGateways');
      expect(route2.Condition).toBe('ShouldCreateNATGateways');
    });
  });

  // ==========================================
  // Security Group Tests
  // ==========================================

  describe('Security Group Resources', () => {
    test('should define ALBSecurityGroup', () => {
      const resource = template.Resources.ALBSecurityGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALBSecurityGroup should allow HTTP and HTTPS from internet', () => {
      const resource = template.Resources.ALBSecurityGroup;
      const ingress = resource.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should define WebServerSecurityGroup', () => {
      const resource = template.Resources.WebServerSecurityGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServerSecurityGroup should allow HTTP from ALB only', () => {
      const resource = template.Resources.WebServerSecurityGroup;
      const ingress = resource.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80);

      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('WebServerSecurityGroup should allow SSH from VPC', () => {
      const resource = template.Resources.WebServerSecurityGroup;
      const ingress = resource.Properties.SecurityGroupIngress;
      const sshRule = ingress.find((r: any) => r.FromPort === 22);

      expect(sshRule).toBeDefined();
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('should define DatabaseSecurityGroup', () => {
      const resource = template.Resources.DatabaseSecurityGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DatabaseSecurityGroup should allow MySQL from web servers only', () => {
      const resource = template.Resources.DatabaseSecurityGroup;
      const ingress = resource.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  // ==========================================
  // IAM Resources Tests
  // ==========================================

  describe('IAM Resources', () => {
    test('should define EC2InstanceRole', () => {
      const resource = template.Resources.EC2InstanceRole;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have EC2 assume role policy', () => {
      const resource = template.Resources.EC2InstanceRole;
      const policy = resource.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2InstanceRole should have CloudWatch managed policy', () => {
      const resource = template.Resources.EC2InstanceRole;
      expect(resource.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('EC2InstanceRole should have S3 access policy', () => {
      const resource = template.Resources.EC2InstanceRole;
      const policies = resource.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(3);
    });

    test('EC2InstanceRole S3 policy should allow object operations', () => {
      const resource = template.Resources.EC2InstanceRole;
      const s3Policy = resource.Properties.Policies[0];
      const objStatement = s3Policy.PolicyDocument.Statement[0];

      expect(objStatement.Action).toContain('s3:GetObject');
      expect(objStatement.Action).toContain('s3:PutObject');
    });

    test('EC2InstanceRole should have KMS permissions', () => {
      const resource = template.Resources.EC2InstanceRole;
      const s3Policy = resource.Properties.Policies[0];
      const kmsStatement = s3Policy.PolicyDocument.Statement[2];

      expect(kmsStatement.Action).toContain('kms:Decrypt');
      expect(kmsStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('should define EC2InstanceProfile', () => {
      const resource = template.Resources.EC2InstanceProfile;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::InstanceProfile');
      expect(resource.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  // ==========================================
  // S3 Bucket Tests
  // ==========================================

  describe('S3 Bucket Resources', () => {
    test('should define LogsBucket', () => {
      const resource = template.Resources.LogsBucket;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::S3::Bucket');
    });

    test('LogsBucket should have dynamic name with account and region', () => {
      const resource = template.Resources.LogsBucket;
      expect(resource.Properties.BucketName).toEqual({
        'Fn::Sub': 'production-logs-${AWS::AccountId}-${AWS::Region}'
      });
    });

    test('LogsBucket should have KMS encryption', () => {
      const resource = template.Resources.LogsBucket;
      const encryption = resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
    });

    test('LogsBucket should have lifecycle policy for Glacier', () => {
      const resource = template.Resources.LogsBucket;
      const rules = resource.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(rules[0].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('LogsBucket should block all public access', () => {
      const resource = template.Resources.LogsBucket;
      const config = resource.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('LogsBucket should have versioning enabled', () => {
      const resource = template.Resources.LogsBucket;
      expect(resource.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should define ContentBucket', () => {
      const resource = template.Resources.ContentBucket;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::S3::Bucket');
    });

    test('ContentBucket should have KMS encryption', () => {
      const resource = template.Resources.ContentBucket;
      const encryption = resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should define ContentBucketPolicy', () => {
      const resource = template.Resources.ContentBucketPolicy;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('ContentBucketPolicy should allow CloudFront OAI access', () => {
      const resource = template.Resources.ContentBucketPolicy;
      const statement = resource.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:GetObject');
    });
  });

  // ==========================================
  // CloudFront Tests
  // ==========================================

  describe('CloudFront Resources', () => {
    test('should define CloudFrontOAI', () => {
      const resource = template.Resources.CloudFrontOAI;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should define CloudFrontDistribution', () => {
      const resource = template.Resources.CloudFrontDistribution;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFrontDistribution should be enabled', () => {
      const resource = template.Resources.CloudFrontDistribution;
      expect(resource.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFrontDistribution should have S3 origin', () => {
      const resource = template.Resources.CloudFrontDistribution;
      const origins = resource.Properties.DistributionConfig.Origins;
      expect(origins).toHaveLength(1);
      expect(origins[0].Id).toBe('S3Origin');
    });

    test('CloudFrontDistribution should redirect HTTP to HTTPS', () => {
      const resource = template.Resources.CloudFrontDistribution;
      const behavior = resource.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFrontDistribution should have compression enabled', () => {
      const resource = template.Resources.CloudFrontDistribution;
      const behavior = resource.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.Compress).toBe(true);
    });

    test('CloudFrontDistribution should have proper TTL settings', () => {
      const resource = template.Resources.CloudFrontDistribution;
      const behavior = resource.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.DefaultTTL).toBe(86400); // 24 hours
      expect(behavior.MinTTL).toBe(0);
      expect(behavior.MaxTTL).toBe(31536000);
    });
  });

  // ==========================================
  // RDS Database Tests
  // ==========================================

  describe('RDS Resources', () => {
    test('should define DBSubnetGroup', () => {
      const resource = template.Resources.DBSubnetGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DBSubnetGroup should use private subnets', () => {
      const resource = template.Resources.DBSubnetGroup;
      expect(resource.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(resource.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should define RDSDatabase', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDSDatabase should have Snapshot deletion policy', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.DeletionPolicy).toBe('Snapshot');
      expect(resource.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('RDSDatabase should use MySQL 8.0', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.Engine).toBe('mysql');
      expect(resource.Properties.EngineVersion).toBe('8.0.39');
    });

    test('RDSDatabase should use t3.micro instance', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('RDSDatabase should have storage encryption enabled', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.StorageEncrypted).toBe(true);
      expect(resource.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDSDatabase should be Multi-AZ', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.MultiAZ).toBe(true);
    });

    test('RDSDatabase should have 7-day backup retention', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDSDatabase should use Secrets Manager for password', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      });
    });

    test('RDSDatabase should use database security group', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'DatabaseSecurityGroup' });
    });
  });

  // ==========================================
  // Load Balancer Tests
  // ==========================================

  describe('Application Load Balancer Resources', () => {
    test('should define ApplicationLoadBalancer', () => {
      const resource = template.Resources.ApplicationLoadBalancer;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const resource = template.Resources.ApplicationLoadBalancer;
      expect(resource.Properties.Scheme).toBe('internet-facing');
      expect(resource.Properties.Type).toBe('application');
    });

    test('ALB should be in public subnets', () => {
      const resource = template.Resources.ApplicationLoadBalancer;
      expect(resource.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(resource.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should define ALBTargetGroup', () => {
      const resource = template.Resources.ALBTargetGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALBTargetGroup should have health check configured', () => {
      const resource = template.Resources.ALBTargetGroup;
      expect(resource.Properties.HealthCheckPath).toBe('/health');
      expect(resource.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(resource.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(resource.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(resource.Properties.HealthyThresholdCount).toBe(2);
      expect(resource.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('ALBTargetGroup should target instances', () => {
      const resource = template.Resources.ALBTargetGroup;
      expect(resource.Properties.TargetType).toBe('instance');
      expect(resource.Properties.Port).toBe(80);
      expect(resource.Properties.Protocol).toBe('HTTP');
    });

    test('should define ALBListener', () => {
      const resource = template.Resources.ALBListener;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALBListener should forward to target group', () => {
      const resource = template.Resources.ALBListener;
      expect(resource.Properties.Port).toBe(80);
      expect(resource.Properties.Protocol).toBe('HTTP');
      expect(resource.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  // ==========================================
  // Auto Scaling Tests
  // ==========================================

  describe('Auto Scaling Resources', () => {
    test('should define LaunchTemplate', () => {
      const resource = template.Resources.LaunchTemplate;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should use t3.micro instances', () => {
      const resource = template.Resources.LaunchTemplate;
      expect(resource.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('LaunchTemplate should use latest AMI parameter', () => {
      const resource = template.Resources.LaunchTemplate;
      expect(resource.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('LaunchTemplate should conditionally include KeyName', () => {
      const resource = template.Resources.LaunchTemplate;
      expect(resource.Properties.LaunchTemplateData.KeyName).toEqual({
        'Fn::If': ['HasKeyPair', { Ref: 'KeyName' }, { Ref: 'AWS::NoValue' }]
      });
    });

    test('LaunchTemplate should have instance profile', () => {
      const resource = template.Resources.LaunchTemplate;
      expect(resource.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });

    test('LaunchTemplate should have EBS volume configuration', () => {
      const resource = template.Resources.LaunchTemplate;
      const blockDevices = resource.Properties.LaunchTemplateData.BlockDeviceMappings;
      expect(blockDevices).toHaveLength(1);
      expect(blockDevices[0].Ebs.VolumeSize).toBe(20);
      expect(blockDevices[0].Ebs.VolumeType).toBe('gp3');
      expect(blockDevices[0].Ebs.DeleteOnTermination).toBe(true);
    });

    test('LaunchTemplate should have UserData script', () => {
      const resource = template.Resources.LaunchTemplate;
      expect(resource.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should define AutoScalingGroup', () => {
      const resource = template.Resources.AutoScalingGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('AutoScalingGroup should have correct capacity settings', () => {
      const resource = template.Resources.AutoScalingGroup;
      expect(resource.Properties.MinSize).toBe(2);
      expect(resource.Properties.MaxSize).toBe(6);
      expect(resource.Properties.DesiredCapacity).toBe(2);
    });

    test('AutoScalingGroup should use ELB health checks', () => {
      const resource = template.Resources.AutoScalingGroup;
      expect(resource.Properties.HealthCheckType).toBe('ELB');
      expect(resource.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('AutoScalingGroup should be in private subnets', () => {
      const resource = template.Resources.AutoScalingGroup;
      expect(resource.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(resource.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('AutoScalingGroup should register with target group', () => {
      const resource = template.Resources.AutoScalingGroup;
      expect(resource.Properties.TargetGroupARNs).toContainEqual({ Ref: 'ALBTargetGroup' });
    });

    test('should define ScaleUpPolicy', () => {
      const resource = template.Resources.ScaleUpPolicy;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(resource.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(resource.Properties.ScalingAdjustment).toBe(1);
      expect(resource.Properties.Cooldown).toBe(300);
    });

    test('should define ScaleDownPolicy', () => {
      const resource = template.Resources.ScaleDownPolicy;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(resource.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  // ==========================================
  // CloudWatch Alarms Tests
  // ==========================================

  describe('CloudWatch Alarm Resources', () => {
    test('should define HighCPUAlarm', () => {
      const resource = template.Resources.HighCPUAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('HighCPUAlarm should monitor CPU utilization', () => {
      const resource = template.Resources.HighCPUAlarm;
      expect(resource.Properties.MetricName).toBe('CPUUtilization');
      expect(resource.Properties.Namespace).toBe('AWS/EC2');
      expect(resource.Properties.Statistic).toBe('Average');
      expect(resource.Properties.Threshold).toBe(80);
      expect(resource.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('HighCPUAlarm should trigger scale up policy', () => {
      const resource = template.Resources.HighCPUAlarm;
      expect(resource.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleUpPolicy' });
    });

    test('should define LowCPUAlarm', () => {
      const resource = template.Resources.LowCPUAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resource.Properties.Threshold).toBe(20);
      expect(resource.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('LowCPUAlarm should trigger scale down policy', () => {
      const resource = template.Resources.LowCPUAlarm;
      expect(resource.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleDownPolicy' });
    });

    test('should define HighMemoryAlarm', () => {
      const resource = template.Resources.HighMemoryAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resource.Properties.MetricName).toBe('MEM_USED');
      expect(resource.Properties.Namespace).toBe('Production/EC2');
    });

    test('should define UnHealthyHostAlarm', () => {
      const resource = template.Resources.UnHealthyHostAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resource.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(resource.Properties.Namespace).toBe('AWS/ApplicationELB');
    });

    test('UnHealthyHostAlarm should have correct dimensions', () => {
      const resource = template.Resources.UnHealthyHostAlarm;
      const dimensions = resource.Properties.Dimensions;
      expect(dimensions).toHaveLength(2);
      expect(dimensions.some((d: any) => d.Name === 'TargetGroup')).toBe(true);
      expect(dimensions.some((d: any) => d.Name === 'LoadBalancer')).toBe(true);
    });
  });

  // ==========================================
  // Outputs Tests
  // ==========================================

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toBe('Production-VPC-ID');
    });

    test('should have LoadBalancerDNS output', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output).toBeDefined();
      expect(output.Export.Name).toBe('Production-ALB-DNS');
    });

    test('should have CloudFrontURL output', () => {
      const output = template.Outputs.CloudFrontURL;
      expect(output).toBeDefined();
      expect(output.Export.Name).toBe('Production-CloudFront-URL');
    });

    test('should have S3 bucket outputs', () => {
      expect(template.Outputs.LogsBucket).toBeDefined();
      expect(template.Outputs.ContentBucket).toBeDefined();
    });

    test('should have DatabaseEndpoint output', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output).toBeDefined();
      expect(output.Export.Name).toBe('Production-DB-Endpoint');
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  // ==========================================
  // Resource Count and Validation Tests
  // ==========================================

  describe('Resource Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(40);
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources with Environment tag should have Production value', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties?.Tags) {
          const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
          if (envTag) {
            expect(envTag.Value).toBe('Production');
          }
        }
      });
    });

    test('conditional resources should have Condition property', () => {
      const conditionalResources = [
        'NATGateway1EIP',
        'NATGateway2EIP',
        'NATGateway1',
        'NATGateway2',
        'PrivateRoute1',
        'PrivateRoute2'
      ];

      conditionalResources.forEach(resourceKey => {
        expect(template.Resources[resourceKey].Condition).toBeDefined();
      });
    });
  });

  // ==========================================
  // Resource Dependencies Tests
  // ==========================================

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIPs should depend on Gateway attachment', () => {
      if (template.Resources.NATGateway1EIP) {
        expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      }
    });

    test('PublicRoute should depend on Gateway attachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('RDSDatabase should reference DBSubnetGroup', () => {
      const resource = template.Resources.RDSDatabase;
      expect(resource.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('AutoScalingGroup should reference LaunchTemplate', () => {
      const resource = template.Resources.AutoScalingGroup;
      expect(resource.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('ContentBucketPolicy should reference ContentBucket', () => {
      const resource = template.Resources.ContentBucketPolicy;
      expect(resource.Properties.Bucket).toEqual({ Ref: 'ContentBucket' });
    });
  });
});
