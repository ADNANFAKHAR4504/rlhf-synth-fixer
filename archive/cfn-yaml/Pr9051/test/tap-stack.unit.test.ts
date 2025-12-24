import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== TEMPLATE STRUCTURE ====================
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
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ==================== PARAMETERS ====================
  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'EnvironmentSuffix',
        'ProjectName',
        'CostCenter',
        'DBMasterUsername',
        'AlertEmail',
        'LatestAmiId'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct configuration', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct configuration', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('default');
      expect(param.AllowedPattern).toBe('[a-z0-9-]*');
      expect(param.ConstraintDescription).toContain('lowercase');
    });

    test('ProjectName parameter should have lowercase constraint', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tap');
      expect(param.AllowedPattern).toBe('[a-z0-9-]*');
    });

    test('DBMasterUsername parameter should have NoEcho and constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('AlertEmail parameter should have email pattern', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.AllowedPattern).toContain('@');
      expect(param.Default).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    });

    test('LatestAmiId parameter should use SSM parameter', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('/aws/service/ami-amazon-linux');
    });

    test('all parameters should have default values', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect(param.Default).toBeDefined();
      });
    });
  });

  // ==================== MAPPINGS ====================
  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have all environment types', () => {
      const config = template.Mappings.EnvironmentConfig;
      expect(config.dev).toBeDefined();
      expect(config.staging).toBeDefined();
      expect(config.prod).toBeDefined();
    });

    test('each environment should have required configuration keys', () => {
      const requiredKeys = [
        'VPCCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'DBSubnet1Cidr',
        'DBSubnet2Cidr',
        'DBInstanceClass',
        'DBBackupRetention',
        'DBAllocatedStorage',
        'ASGMinSize',
        'ASGMaxSize',
        'ASGDesiredCapacity',
        'InstanceType',
        'HealthCheckInterval',
        'S3LifecycleDays',
        'AlarmCPUThreshold',
        'AlarmMemoryThreshold'
      ];

      ['dev', 'staging', 'prod'].forEach(env => {
        const config = template.Mappings.EnvironmentConfig[env];
        requiredKeys.forEach(key => {
          expect(config[key]).toBeDefined();
        });
      });
    });

    test('VPC CIDR blocks should not overlap', () => {
      const devCidr = template.Mappings.EnvironmentConfig.dev.VPCCidr;
      const stagingCidr = template.Mappings.EnvironmentConfig.staging.VPCCidr;
      const prodCidr = template.Mappings.EnvironmentConfig.prod.VPCCidr;

      expect(devCidr).toBe('10.0.0.0/16');
      expect(stagingCidr).toBe('10.1.0.0/16');
      expect(prodCidr).toBe('10.2.0.0/16');
    });
  });

  // ==================== CONDITIONS ====================
  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction).toEqual({
        'Fn::Equals': [{ Ref: 'Environment' }, 'prod']
      });
    });
  });

  // ==================== RESOURCES - VPC & NETWORKING ====================
  describe('Resources - VPC and Networking', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.DeletionPolicy).toBe('Delete');
      expect(vpc.UpdateReplacePolicy).toBe('Delete');
    });

    test('VPC should enable DNS', () => {
      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway linking VPC to IGW', () => {
      const attach = template.Resources.AttachGateway;
      expect(attach).toBeDefined();
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attach.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should map public IPs', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have two database subnets', () => {
      expect(template.Resources.DBSubnet1).toBeDefined();
      expect(template.Resources.DBSubnet2).toBeDefined();
      expect(template.Resources.DBSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.DBSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have two NAT Gateways with EIPs', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();

      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateways should depend on AttachGateway', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2EIP.DependsOn).toBe('AttachGateway');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('public route should go to internet gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private routes should go to NAT gateways', () => {
      const route1 = template.Resources.PrivateRoute1;
      const route2 = template.Resources.PrivateRoute2;

      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should have S3 VPC endpoint', () => {
      const endpoint = template.Resources.S3Endpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.s3'
      });
    });
  });

  // ==================== RESOURCES - SECURITY GROUPS ====================
  describe('Resources - Security Groups', () => {
    test('should have ALBSecurityGroup', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('should have WebServerSecurityGroup', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('web server security group should only allow traffic from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });

    test('should have DatabaseSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group should only allow traffic from web servers', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(ingress[0].FromPort).toBe(5432);
    });

    test('all security groups should have egress rules', () => {
      const securityGroups = ['ALBSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup'];

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      });
    });
  });

  // ==================== RESOURCES - KMS ====================
  describe('Resources - KMS', () => {
    test('should have KMS key', () => {
      const key = template.Resources.KMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.DeletionPolicy).toBe('Delete');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.KMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper deletion window', () => {
      const key = template.Resources.KMSKey;
      expect(key.Properties.PendingWindowInDays).toBe(7);
    });

    test('KMS key policy should allow root account', () => {
      const key = template.Resources.KMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key policy should allow CloudWatch Logs', () => {
      const key = template.Resources.KMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('kms:Encrypt');
      expect(logsStatement.Action).toContain('kms:Decrypt');
      expect(logsStatement.Action).toContain('kms:GenerateDataKey*');
    });

    test('KMS key policy should allow all required services', () => {
      const key = template.Resources.KMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      const serviceStatements = statements.filter((s: any) =>
        s.Sid && (s.Sid.includes('S3') || s.Sid.includes('RDS') ||
                  s.Sid.includes('SNS') || s.Sid.includes('Secrets'))
      );

      expect(serviceStatements.length).toBeGreaterThan(0);
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ==================== RESOURCES - IAM ====================
  describe('Resources - IAM', () => {
    test('should have EC2 role', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Delete');
    });

    test('EC2 role should have correct assume role policy', () => {
      const role = template.Resources.EC2Role;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 role should have CloudWatch and SSM managed policies', () => {
      const role = template.Resources.EC2Role;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2 role should have S3 access policy with least privilege', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');

      expect(s3Policy).toBeDefined();

      const objectStatement = s3Policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'S3ObjectAccess');
      expect(objectStatement.Action).toContain('s3:GetObject');
      expect(objectStatement.Action).toContain('s3:PutObject');
      expect(objectStatement.Action).toContain('s3:DeleteObject');
      expect(objectStatement.Resource).toEqual({
        'Fn::Sub': '${S3Bucket.Arn}/*'
      });
    });

    test('EC2 role should have SSM access policy scoped to environment', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const ssmPolicy = policies.find((p: any) => p.PolicyName === 'SSMAccess');

      expect(ssmPolicy).toBeDefined();
      expect(ssmPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Environment}/${EnvironmentSuffix}/*'
      });
    });

    test('EC2 role should have Secrets Manager access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');

      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test('EC2 role should have KMS access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccess');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });
  });

  // ==================== RESOURCES - RDS ====================
  describe('Resources - RDS', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have DB parameter group', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('postgres17');
    });

    test('should have DB password secret', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
    });

    test('DB password secret should use KMS encryption', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('DB password secret should generate secure password', () => {
      const secret = template.Resources.DBPasswordSecret;
      const genString = secret.Properties.GenerateSecretString;

      expect(genString.PasswordLength).toBe(32);
      expect(genString.RequireEachIncludedType).toBe(true);
      expect(genString.ExcludeCharacters).toBeDefined();
    });

    test('should have DB instance', () => {
      const db = template.Resources.DBInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Delete');
    });

    test('DB instance should have correct engine configuration', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.EngineVersion).toBe('17.6');
    });

    test('DB instance should use Secrets Manager for password', () => {
      const db = template.Resources.DBInstance;
      const password = db.Properties.MasterUserPassword;

      expect(password).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      });
    });

    test('DB instance should have encryption enabled', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('DB instance should have deletion protection disabled', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('DB instance should delete automated backups', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.DeleteAutomatedBackups).toBe(true);
    });

    test('DB instance should not be publicly accessible', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });
  });

  // ==================== RESOURCES - S3 ====================
  describe('Resources - S3', () => {
    test('should have S3 bucket', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle rules', () => {
      const bucket = template.Resources.S3Bucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules.length).toBeGreaterThan(0);

      const deleteOldVersions = rules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(deleteOldVersions).toBeDefined();
      expect(deleteOldVersions.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket policy should deny insecure connections', () => {
      const policy = template.Resources.S3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureConnections');
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe(false);
    });

    test('S3 bucket policy should allow EC2 role access', () => {
      const policy = template.Resources.S3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const allowEC2 = statements.find((s: any) => s.Sid === 'AllowEC2RoleAccess');
      expect(allowEC2).toBeDefined();
      expect(allowEC2.Principal.AWS).toEqual({ 'Fn::GetAtt': ['EC2Role', 'Arn'] });
    });
  });

  // ==================== RESOURCES - EC2 & AUTO SCALING ====================
  describe('Resources - EC2 and Auto Scaling', () => {
    test('should have EC2 key pair', () => {
      const keyPair = template.Resources.EC2KeyPair;
      expect(keyPair).toBeDefined();
      expect(keyPair.Type).toBe('AWS::EC2::KeyPair');
      expect(keyPair.Properties.KeyType).toBe('rsa');
    });

    test('should have launch template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.DeletionPolicy).toBe('Delete');
    });

    test('launch template should reference AMI parameter', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('launch template should have IAM instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('launch template should have user data', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have auto scaling group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.DeletionPolicy).toBe('Delete');
    });

    test('auto scaling group should use launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('auto scaling group should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('auto scaling group should have ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should have scaling policy', () => {
      const policy = template.Resources.ScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  // ==================== RESOURCES - ALB ====================
  describe('Resources - Application Load Balancer', () => {
    test('should have ALB', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.DeletionPolicy).toBe('Delete');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have target group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('target group should have health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
    });
  });

  // ==================== RESOURCES - CLOUDWATCH ====================
  describe('Resources - CloudWatch', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.HTTPDAccessLogGroup).toBeDefined();
      expect(template.Resources.HTTPDErrorLogGroup).toBeDefined();
    });

    test('log groups should use KMS encryption', () => {
      const accessLog = template.Resources.HTTPDAccessLogGroup;
      const errorLog = template.Resources.HTTPDErrorLogGroup;

      expect(accessLog.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
      expect(errorLog.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('log groups should have retention period', () => {
      const accessLog = template.Resources.HTTPDAccessLogGroup;
      expect(accessLog.Properties.RetentionInDays).toBe(7);
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
      expect(template.Resources.UnhealthyTargetsAlarm).toBeDefined();
    });

    test('alarms should have SNS actions', () => {
      const cpuAlarm = template.Resources.HighCPUAlarm;
      expect(cpuAlarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
    });

    test('should have CloudWatch dashboard', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.DeletionPolicy).toBe('Delete');
    });

    test('dashboard should have valid JSON body', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();

      // The body is a Fn::Sub, so we can't parse it directly, but we can check it's defined
      expect(dashboard.Properties.DashboardBody['Fn::Sub']).toBeDefined();
    });
  });

  // ==================== RESOURCES - SNS ====================
  describe('Resources - SNS', () => {
    test('should have SNS topic', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Delete');
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });
  });

  // ==================== TAGS ====================
  describe('Tags', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['project', 'team-number'];
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::KeyPair',
        'AWS::RDS::DBInstance',
        'AWS::RDS::DBSubnetGroup',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::KMS::Key',
        'AWS::IAM::Role'
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (taggableResourceTypes.includes(resource.Type)) {
          const tags = resource.Properties.Tags || [];
          const tagKeys = tags.map((t: any) => t.Key);

          requiredTags.forEach(requiredTag => {
            expect(tagKeys).toContain(requiredTag);
          });

          // Verify tag values
          const projectTag = tags.find((t: any) => t.Key === 'project');
          const teamTag = tags.find((t: any) => t.Key === 'team-number');

          expect(projectTag.Value).toBe('iac-rlhf-amazon');
          expect(teamTag.Value).toBe(2);
        }
      });
    });

    test('no resources should have duplicate tag keys', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties?.Tags || [];

        const tagKeys = tags.map((t: any) => t.Key.toLowerCase());
        const uniqueKeys = new Set(tagKeys);

        expect(tagKeys.length).toBe(uniqueKeys.size);
      });
    });
  });

  // ==================== DELETION POLICIES ====================
  describe('Deletion Policies', () => {
    test('all resources should have DeletionPolicy set to Delete', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('all resources should have UpdateReplacePolicy set to Delete', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  // ==================== ENCRYPTION ====================
  describe('Encryption', () => {
    test('RDS should be encrypted', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBeDefined();
    });

    test('S3 should be encrypted', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('SNS should be encrypted', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('Secrets Manager should be encrypted', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('CloudWatch Logs should be encrypted', () => {
      const accessLog = template.Resources.HTTPDAccessLogGroup;
      const errorLog = template.Resources.HTTPDErrorLogGroup;

      expect(accessLog.Properties.KmsKeyId).toBeDefined();
      expect(errorLog.Properties.KmsKeyId).toBeDefined();
    });
  });

  // ==================== OUTPUTS ====================
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'DBEndpoint',
        'S3BucketName',
        'SNSTopicArn',
        'DashboardURL',
        'KMSKeyId',
        'EC2KeyPairName',
        'DBPasswordSecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Value).toBeDefined();
      });
    });

    test('outputs with exports should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDNSName output should reference ALB DNS', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('DBEndpoint output should reference database endpoint', () => {
      const output = template.Outputs.DBEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBInstance', 'Endpoint.Address'] });
    });
  });

  // ==================== NAMING CONVENTIONS ====================
  describe('Naming Conventions', () => {
    test('resource names should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'VPC', 'S3Bucket', 'DBInstance', 'ApplicationLoadBalancer',
        'LaunchTemplate', 'TargetGroup', 'SNSTopic', 'KMSKeyAlias'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties && (resource.Properties.Name ||
            resource.Properties.BucketName ||
            resource.Properties.DBInstanceIdentifier ||
            resource.Properties.TopicName ||
            resource.Properties.LaunchTemplateName ||
            resource.Properties.AliasName)) {

          const name = resource.Properties.Name ||
                       resource.Properties.BucketName ||
                       resource.Properties.DBInstanceIdentifier ||
                       resource.Properties.TopicName ||
                       resource.Properties.LaunchTemplateName ||
                       resource.Properties.AliasName;

          // Name should use Fn::Sub and include EnvironmentSuffix
          if (name['Fn::Sub']) {
            expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('export names should use consistent pattern when present', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toContain('${Environment}');
            expect(exportName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  // ==================== RESOURCE COUNT ====================
  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50);
    });

    test('should have all networking resources', () => {
      const networkingResources = [
        'VPC', 'InternetGateway', 'AttachGateway',
        'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2',
        'DBSubnet1', 'DBSubnet2',
        'NATGateway1', 'NATGateway2',
        'NATGateway1EIP', 'NATGateway2EIP',
        'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'
      ];

      networkingResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });
  });

  // ==================== MULTI-REGION COMPATIBILITY ====================
  describe('Multi-Region Compatibility', () => {
    test('should use AWS::Region pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('${AWS::Region}');
    });

    test('should not have hardcoded region values', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
    });

    test('AMI should be resolved via SSM parameter', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('S3 VPC endpoint should use region-specific service name', () => {
      const endpoint = template.Resources.S3Endpoint;
      expect(endpoint.Properties.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.s3'
      });
    });
  });
});
