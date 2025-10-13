import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
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

    test('should have a description for secure infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure multi-region AWS infrastructure');
      expect(template.Description).toContain('comprehensive security controls');
    });

    test('should have all major sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have exactly 4 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have 34 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(34);
    });
  });

  // ==================== Parameters Tests ====================
  describe('Parameters', () => {
    describe('Environment Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.Environment).toBeDefined();
        expect(template.Parameters.Environment.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.Environment.Default).toBe('Production');
      });

      test('should have allowed values', () => {
        const allowedValues = template.Parameters.Environment.AllowedValues;
        expect(allowedValues).toEqual(['Development', 'Staging', 'Production']);
      });

      test('should have description', () => {
        expect(template.Parameters.Environment.Description).toBe('Environment name for tagging');
      });
    });

    describe('AlertEmail Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.AlertEmail).toBeDefined();
        expect(template.Parameters.AlertEmail.Type).toBe('String');
      });

      test('should have correct default email', () => {
        expect(template.Parameters.AlertEmail.Default).toBe('admin@example.com');
      });

      test('should have email validation pattern', () => {
        const pattern = template.Parameters.AlertEmail.AllowedPattern;
        expect(pattern).toBeDefined();
        expect(pattern).toContain('@');

        // Test pattern validates emails
        const emailRegex = new RegExp(pattern.replace(/\\\\/g, '\\'));
        expect(emailRegex.test('admin@example.com')).toBe(true);
        expect(emailRegex.test('test.user@domain.co.uk')).toBe(true);
        expect(emailRegex.test('invalid-email')).toBe(false);
      });

      test('should have description', () => {
        expect(template.Parameters.AlertEmail.Description).toBe('Email address for security alerts');
      });
    });

    describe('LatestAmiId Parameter', () => {
      test('should exist and have correct type for SSM parameter', () => {
        expect(template.Parameters.LatestAmiId).toBeDefined();
        expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      });

      test('should have correct default SSM path', () => {
        const defaultPath = template.Parameters.LatestAmiId.Default;
        expect(defaultPath).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64');
      });

      test('should have description', () => {
        expect(template.Parameters.LatestAmiId.Description).toBe('Latest Amazon Linux 2023 AMI ID');
      });
    });

    describe('EnvironmentSuffix Parameter', () => {
      test('should exist and have correct type', () => {
        expect(template.Parameters.EnvironmentSuffix).toBeDefined();
        expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      });

      test('should have correct default value', () => {
        expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      });

      test('should have description', () => {
        expect(template.Parameters.EnvironmentSuffix.Description).toBe('Environment name for tagging');
      });
    });
  });

  // ==================== Networking Resources Tests ====================
  describe('Networking Resources', () => {
    describe('VPC', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.DefaultVPC).toBeDefined();
        expect(template.Resources.DefaultVPC.Type).toBe('AWS::EC2::VPC');
      });

      test('should have correct CIDR block', () => {
        const properties = template.Resources.DefaultVPC.Properties;
        expect(properties.CidrBlock).toBe('10.0.0.0/16');
      });

      test('should enable DNS hostnames and support', () => {
        const properties = template.Resources.DefaultVPC.Properties;
        expect(properties.EnableDnsHostnames).toBe(true);
        expect(properties.EnableDnsSupport).toBe(true);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.DefaultVPC.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'DefaultVPC' });
        expect(tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'Environment' } });
        expect(tags).toContainEqual({ Key: 'ManagedBy', Value: 'CloudFormation' });
      });
    });

    describe('Subnets', () => {
      test('should have two subnets defined', () => {
        expect(template.Resources.DefaultSubnet1).toBeDefined();
        expect(template.Resources.DefaultSubnet2).toBeDefined();
      });

      test('DefaultSubnet1 should have correct configuration', () => {
        const subnet = template.Resources.DefaultSubnet1;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.0.0/20');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('DefaultSubnet1 should be in first AZ', () => {
        const subnet = template.Resources.DefaultSubnet1;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }]
        });
      });

      test('DefaultSubnet2 should have correct configuration', () => {
        const subnet = template.Resources.DefaultSubnet2;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.16.0/20');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('DefaultSubnet2 should be in second AZ', () => {
        const subnet = template.Resources.DefaultSubnet2;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }]
        });
      });

      test('subnets should have correct tags', () => {
        const subnet1Tags = template.Resources.DefaultSubnet1.Properties.Tags;
        const subnet2Tags = template.Resources.DefaultSubnet2.Properties.Tags;

        expect(subnet1Tags).toContainEqual({ Key: 'Name', Value: 'DefaultSubnet1' });
        expect(subnet2Tags).toContainEqual({ Key: 'Name', Value: 'DefaultSubnet2' });
      });

      test('subnet CIDR blocks should not overlap', () => {
        const cidr1 = template.Resources.DefaultSubnet1.Properties.CidrBlock;
        const cidr2 = template.Resources.DefaultSubnet2.Properties.CidrBlock;
        expect(cidr1).not.toBe(cidr2);
      });
    });

    describe('Internet Gateway', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.InternetGateway).toBeDefined();
        expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.InternetGateway.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'DefaultIGW' });
      });

      test('should be attached to VPC', () => {
        const attachment = template.Resources.AttachGateway;
        expect(attachment).toBeDefined();
        expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(attachment.Properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
        expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      });
    });

    describe('Route Table', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.RouteTable).toBeDefined();
        expect(template.Resources.RouteTable.Type).toBe('AWS::EC2::RouteTable');
      });

      test('should be associated with VPC', () => {
        const properties = template.Resources.RouteTable.Properties;
        expect(properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
      });

      test('should have default route to Internet Gateway', () => {
        const route = template.Resources.Route;
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({ Ref: 'RouteTable' });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      });

      test('route should depend on gateway attachment', () => {
        const route = template.Resources.Route;
        expect(route.DependsOn).toBe('AttachGateway');
      });

      test('should be associated with both subnets', () => {
        const assoc1 = template.Resources.SubnetRouteTableAssociation1;
        const assoc2 = template.Resources.SubnetRouteTableAssociation2;

        expect(assoc1).toBeDefined();
        expect(assoc2).toBeDefined();

        expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');

        expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'DefaultSubnet1' });
        expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'DefaultSubnet2' });

        expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'RouteTable' });
        expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'RouteTable' });
      });
    });
  });

  // ==================== Storage Resources Tests ====================
  describe('Storage Resources', () => {
    describe('S3 Logging Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.S3LoggingBucket).toBeDefined();
        expect(template.Resources.S3LoggingBucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have retention policies', () => {
        const bucket = template.Resources.S3LoggingBucket;
        expect(bucket.DeletionPolicy).toBe('Retain');
        expect(bucket.UpdateReplacePolicy).toBe('Retain');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.S3LoggingBucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'secure-logs-${AWS::AccountId}-${EnvironmentSuffix}'
        });
      });

      test('should have AES256 encryption', () => {
        const properties = template.Resources.S3LoggingBucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('should block all public access', () => {
        const properties = template.Resources.S3LoggingBucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have lifecycle policy for log deletion', () => {
        const properties = template.Resources.S3LoggingBucket.Properties;
        const lifecycleRules = properties.LifecycleConfiguration.Rules;

        expect(lifecycleRules).toHaveLength(1);
        expect(lifecycleRules[0].Id).toBe('DeleteOldLogs');
        expect(lifecycleRules[0].Status).toBe('Enabled');
        expect(lifecycleRules[0].ExpirationInDays).toBe(90);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.S3LoggingBucket.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'SecurityLogs' });
      });
    });

    describe('Application Data Bucket', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.ApplicationDataBucket).toBeDefined();
        expect(template.Resources.ApplicationDataBucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have deterministic bucket name', () => {
        const properties = template.Resources.ApplicationDataBucket.Properties;
        expect(properties.BucketName).toEqual({
          'Fn::Sub': 'secure-app-data-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
        });
      });

      test('should have KMS encryption', () => {
        const properties = template.Resources.ApplicationDataBucket.Properties;
        const encryption = properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });

      test('should block all public access', () => {
        const properties = template.Resources.ApplicationDataBucket.Properties;
        const publicAccessBlock = properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have versioning enabled', () => {
        const properties = template.Resources.ApplicationDataBucket.Properties;
        expect(properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should log to S3LoggingBucket', () => {
        const properties = template.Resources.ApplicationDataBucket.Properties;
        const loggingConfig = properties.LoggingConfiguration;

        expect(loggingConfig.DestinationBucketName).toEqual({ Ref: 'S3LoggingBucket' });
        expect(loggingConfig.LogFilePrefix).toBe('application-data/');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.ApplicationDataBucket.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'ApplicationData' });
      });
    });
  });

  // ==================== Security Resources Tests ====================
  describe('Security Resources', () => {
    describe('KMS Key', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.KMSKey).toBeDefined();
        expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      });

      test('should have description', () => {
        const properties = template.Resources.KMSKey.Properties;
        expect(properties.Description).toBe('KMS key for encrypting sensitive data');
      });

      test('should have key policy with IAM statement', () => {
        const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
        const statements = keyPolicy.Statement;

        const iamStatement = statements.find((s: any) => s.Sid === 'Enable IAM policies');
        expect(iamStatement).toBeDefined();
        expect(iamStatement.Effect).toBe('Allow');
        expect(iamStatement.Action).toBe('kms:*');
        expect(iamStatement.Principal.AWS).toEqual({
          'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
        });
      });

      test('should have key policy allowing service usage', () => {
        const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
        const statements = keyPolicy.Statement;

        const serviceStatement = statements.find((s: any) => s.Sid === 'Allow services to use the key');
        expect(serviceStatement).toBeDefined();
        expect(serviceStatement.Effect).toBe('Allow');
        expect(serviceStatement.Principal.Service).toEqual([
          'rds.amazonaws.com',
          's3.amazonaws.com',
          'logs.amazonaws.com'
        ]);
        expect(serviceStatement.Action).toContain('kms:Decrypt');
        expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.KMSKey.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'DataEncryption' });
      });
    });

    describe('KMS Key Alias', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.KMSKeyAlias).toBeDefined();
        expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      });

      test('should have correct alias name', () => {
        const properties = template.Resources.KMSKeyAlias.Properties;
        expect(properties.AliasName).toBe('alias/secure-infrastructure');
      });

      test('should reference KMS key', () => {
        const properties = template.Resources.KMSKeyAlias.Properties;
        expect(properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
      });
    });

    describe('Database Password Secret', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.DatabasePasswordSecret).toBeDefined();
        expect(template.Resources.DatabasePasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      });

      test('should have deterministic secret name', () => {
        const properties = template.Resources.DatabasePasswordSecret.Properties;
        expect(properties.Name).toEqual({
          'Fn::Sub': '/secure-app/database/password-${EnvironmentSuffix}'
        });
      });

      test('should have description', () => {
        const properties = template.Resources.DatabasePasswordSecret.Properties;
        expect(properties.Description).toBe('RDS database master password');
      });

      test('should generate password with correct configuration', () => {
        const properties = template.Resources.DatabasePasswordSecret.Properties;
        const generateConfig = properties.GenerateSecretString;

        expect(generateConfig.SecretStringTemplate).toBe('{"username": "admin"}');
        expect(generateConfig.GenerateStringKey).toBe('password');
        expect(generateConfig.PasswordLength).toBe(32);
        expect(generateConfig.ExcludeCharacters).toBe('\"@/\\');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.DatabasePasswordSecret.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'DatabaseCredentials' });
      });
    });

    describe('Security Groups', () => {
      describe('Application Security Group', () => {
        test('should exist and be of correct type', () => {
          expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
          expect(template.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        });

        test('should be associated with VPC', () => {
          const properties = template.Resources.ApplicationSecurityGroup.Properties;
          expect(properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
        });

        test('should have description', () => {
          const properties = template.Resources.ApplicationSecurityGroup.Properties;
          expect(properties.GroupDescription).toBe('Security group for application servers');
        });

        test('should allow HTTPS traffic', () => {
          const properties = template.Resources.ApplicationSecurityGroup.Properties;
          const httpsRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);

          expect(httpsRule).toBeDefined();
          expect(httpsRule.IpProtocol).toBe('tcp');
          expect(httpsRule.ToPort).toBe(443);
          expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
          expect(httpsRule.Description).toBe('Allow HTTPS traffic from anywhere');
        });

        test('should allow HTTP traffic', () => {
          const properties = template.Resources.ApplicationSecurityGroup.Properties;
          const httpRule = properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);

          expect(httpRule).toBeDefined();
          expect(httpRule.IpProtocol).toBe('tcp');
          expect(httpRule.ToPort).toBe(80);
          expect(httpRule.CidrIp).toBe('0.0.0.0/0');
          expect(httpRule.Description).toContain('HTTP');
        });

        test('should allow all outbound traffic', () => {
          const properties = template.Resources.ApplicationSecurityGroup.Properties;
          const egressRule = properties.SecurityGroupEgress[0];

          expect(egressRule.IpProtocol).toBe('-1');
          expect(egressRule.CidrIp).toBe('0.0.0.0/0');
          expect(egressRule.Description).toBe('Allow all outbound traffic');
        });

        test('all ingress rules should have descriptions', () => {
          const properties = template.Resources.ApplicationSecurityGroup.Properties;
          properties.SecurityGroupIngress.forEach((rule: any) => {
            expect(rule.Description).toBeDefined();
            expect(rule.Description.length).toBeGreaterThan(0);
          });
        });
      });

      describe('Database Security Group', () => {
        test('should exist and be of correct type', () => {
          expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
          expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        });

        test('should be associated with VPC', () => {
          const properties = template.Resources.DatabaseSecurityGroup.Properties;
          expect(properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
        });

        test('should have description', () => {
          const properties = template.Resources.DatabaseSecurityGroup.Properties;
          expect(properties.GroupDescription).toBe('Security group for RDS database instances');
        });

        test('should only allow MySQL traffic from application security group', () => {
          const properties = template.Resources.DatabaseSecurityGroup.Properties;
          const ingressRules = properties.SecurityGroupIngress;

          expect(ingressRules).toHaveLength(1);

          const mysqlRule = ingressRules[0];
          expect(mysqlRule.IpProtocol).toBe('tcp');
          expect(mysqlRule.FromPort).toBe(3306);
          expect(mysqlRule.ToPort).toBe(3306);
          expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationSecurityGroup' });
          expect(mysqlRule.Description).toContain('MySQL');
          expect(mysqlRule.Description).toContain('application servers only');
        });

        test('should not have any egress rules explicitly defined', () => {
          const properties = template.Resources.DatabaseSecurityGroup.Properties;
          expect(properties.SecurityGroupEgress).toBeUndefined();
        });

        test('all ingress rules should have descriptions', () => {
          const properties = template.Resources.DatabaseSecurityGroup.Properties;
          properties.SecurityGroupIngress.forEach((rule: any) => {
            expect(rule.Description).toBeDefined();
            expect(rule.Description.length).toBeGreaterThan(0);
          });
        });
      });

      describe('Bastion Security Group', () => {
        test('should exist and be of correct type', () => {
          expect(template.Resources.BastionSecurityGroup).toBeDefined();
          expect(template.Resources.BastionSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        });

        test('should be associated with VPC', () => {
          const properties = template.Resources.BastionSecurityGroup.Properties;
          expect(properties.VpcId).toEqual({ Ref: 'DefaultVPC' });
        });

        test('should have description mentioning SSM Session Manager', () => {
          const properties = template.Resources.BastionSecurityGroup.Properties;
          expect(properties.GroupDescription).toContain('SSM Session Manager');
        });

        test('should not have any ingress rules (no SSH)', () => {
          const properties = template.Resources.BastionSecurityGroup.Properties;
          expect(properties.SecurityGroupIngress).toBeUndefined();
        });

        test('should allow all outbound traffic', () => {
          const properties = template.Resources.BastionSecurityGroup.Properties;
          const egressRule = properties.SecurityGroupEgress[0];

          expect(egressRule.IpProtocol).toBe('-1');
          expect(egressRule.CidrIp).toBe('0.0.0.0/0');
          expect(egressRule.Description).toBe('Allow all outbound traffic');
        });
      });
    });
  });

  // ==================== IAM Resources Tests ====================
  describe('IAM Resources', () => {
    describe('EC2 Role', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2Role).toBeDefined();
        expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      });

      test('should have deterministic role name', () => {
        const properties = template.Resources.EC2Role.Properties;
        expect(properties.RoleName).toEqual({
          'Fn::Sub': 'SecureEC2Role-${EnvironmentSuffix}'
        });
      });

      test('should have correct trust policy for EC2', () => {
        const properties = template.Resources.EC2Role.Properties;
        const assumePolicy = properties.AssumeRolePolicyDocument;

        expect(assumePolicy.Version).toBe('2012-10-17');
        expect(assumePolicy.Statement).toHaveLength(1);

        const statement = assumePolicy.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
        expect(statement.Action).toBe('sts:AssumeRole');
      });

      test('should have CloudWatch Agent managed policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        expect(properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      });

      test('should have SSM managed policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        expect(properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      });

      test('should have S3 access policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        const s3Policy = properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

        expect(s3Policy).toBeDefined();

        const statements = s3Policy.PolicyDocument.Statement;
        expect(statements).toHaveLength(2);

        // Object access statement
        const objectStatement = statements.find((s: any) => s.Action.includes('s3:GetObject'));
        expect(objectStatement).toBeDefined();
        expect(objectStatement.Effect).toBe('Allow');
        expect(objectStatement.Action).toContain('s3:GetObject');
        expect(objectStatement.Action).toContain('s3:PutObject');
        expect(objectStatement.Resource).toEqual({
          'Fn::Sub': '${ApplicationDataBucket.Arn}/*'
        });

        // Bucket access statement
        const bucketStatement = statements.find((s: any) => s.Action === 's3:ListBucket');
        expect(bucketStatement).toBeDefined();
        expect(bucketStatement.Effect).toBe('Allow');
        expect(bucketStatement.Resource).toEqual({
          'Fn::GetAtt': ['ApplicationDataBucket', 'Arn']
        });
      });

      test('should have Secrets Manager access policy', () => {
        const properties = template.Resources.EC2Role.Properties;
        const secretsPolicy = properties.Policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');

        expect(secretsPolicy).toBeDefined();

        const statements = secretsPolicy.PolicyDocument.Statement;
        expect(statements).toHaveLength(1);

        const statement = statements[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('secretsmanager:GetSecretValue');
        expect(statement.Action).toContain('secretsmanager:DescribeSecret');
        expect(statement.Resource).toEqual({ Ref: 'DatabasePasswordSecret' });
      });

      test('should have correct tags', () => {
        const tags = template.Resources.EC2Role.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'Environment' } });
        expect(tags).toContainEqual({ Key: 'ManagedBy', Value: 'CloudFormation' });
      });
    });

    describe('EC2 Instance Profile', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.EC2InstanceProfile).toBeDefined();
        expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      });

      test('should reference EC2 role', () => {
        const properties = template.Resources.EC2InstanceProfile.Properties;
        expect(properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
      });
    });
  });

  // ==================== Compute Resources Tests ====================
  describe('Compute Resources', () => {
    describe('Hardened EC2 Instance', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.HardenedEC2Instance).toBeDefined();
        expect(template.Resources.HardenedEC2Instance.Type).toBe('AWS::EC2::Instance');
      });

      test('should use latest AMI parameter', () => {
        const properties = template.Resources.HardenedEC2Instance.Properties;
        expect(properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      });

      test('should be t3.micro instance type', () => {
        const properties = template.Resources.HardenedEC2Instance.Properties;
        expect(properties.InstanceType).toBe('t3.micro');
      });

      test('should use EC2 instance profile', () => {
        const properties = template.Resources.HardenedEC2Instance.Properties;
        expect(properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      });

      test('should be associated with application security group', () => {
        const properties = template.Resources.HardenedEC2Instance.Properties;
        expect(properties.SecurityGroupIds).toEqual([{ Ref: 'ApplicationSecurityGroup' }]);
      });

      test('should be in DefaultSubnet1', () => {
        const properties = template.Resources.HardenedEC2Instance.Properties;
        expect(properties.SubnetId).toEqual({ Ref: 'DefaultSubnet1' });
      });

      test('should have user data script', () => {
        const properties = template.Resources.HardenedEC2Instance.Properties;
        expect(properties.UserData).toBeDefined();
        expect(properties.UserData['Fn::Base64']).toBeDefined();
      });

      test('should have correct tags', () => {
        const tags = template.Resources.HardenedEC2Instance.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Name', Value: 'HardenedApplicationServer' });
        expect(tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'Environment' } });
      });
    });
  });

  // ==================== Database Resources Tests ====================
  describe('Database Resources', () => {
    describe('DB Subnet Group', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.DBSubnetGroup).toBeDefined();
        expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      });

      test('should have description', () => {
        const properties = template.Resources.DBSubnetGroup.Properties;
        expect(properties.DBSubnetGroupDescription).toBe('Subnet group for RDS instances');
      });

      test('should include both subnets', () => {
        const properties = template.Resources.DBSubnetGroup.Properties;
        expect(properties.SubnetIds).toEqual([
          { Ref: 'DefaultSubnet1' },
          { Ref: 'DefaultSubnet2' }
        ]);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.DBSubnetGroup.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Environment', Value: { Ref: 'Environment' } });
      });
    });

    describe('RDS Database Instance', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.RDSDatabase).toBeDefined();
        expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
      });

      test('should have deterministic identifier', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.DBInstanceIdentifier).toEqual({
          'Fn::Sub': 'secure-db-${EnvironmentSuffix}'
        });
      });

      test('should be db.t3.micro instance class', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.DBInstanceClass).toBe('db.t3.micro');
      });

      test('should use MySQL 8.0.39', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.Engine).toBe('mysql');
        expect(properties.EngineVersion).toBe('8.0.39');
      });

      test('should have 20GB gp3 storage', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.AllocatedStorage).toBe('20');
        expect(properties.StorageType).toBe('gp3');
      });

      test('should be encrypted with KMS', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.StorageEncrypted).toBe(true);
        expect(properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      });

      test('should have master username', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.MasterUsername).toBe('admin');
      });

      test('should resolve password from Secrets Manager', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        const passwordResolution = properties.MasterUserPassword;

        expect(passwordResolution).toBeDefined();
        expect(passwordResolution['Fn::Sub']).toContain('resolve:secretsmanager');
        expect(passwordResolution['Fn::Sub']).toContain('${DatabasePasswordSecret}');
      });

      test('should use database security group', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.VPCSecurityGroups).toEqual([{ Ref: 'DatabaseSecurityGroup' }]);
      });

      test('should use DB subnet group', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      });

      test('should not be publicly accessible', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.PubliclyAccessible).toBe(false);
      });

      test('should have 7-day backup retention', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.BackupRetentionPeriod).toBe(7);
      });

      test('should have backup window configured', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.PreferredBackupWindow).toBe('03:00-04:00');
      });

      test('should have maintenance window configured', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
      });

      test('should export logs to CloudWatch', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.EnableCloudwatchLogsExports).toEqual(['error', 'general', 'slowquery']);
      });

      test('should have deletion protection disabled (for testing)', () => {
        const properties = template.Resources.RDSDatabase.Properties;
        expect(properties.DeletionProtection).toBe(false);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.RDSDatabase.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'ApplicationDatabase' });
      });
    });
  });

  // ==================== Audit & Logging Resources Tests ====================
  describe('Audit & Logging Resources', () => {
    describe('CloudTrail Log Group', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CloudTrailLogGroup).toBeDefined();
        expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('should have auto-generated log group name', () => {
        const properties = template.Resources.CloudTrailLogGroup.Properties;
        expect(properties.LogGroupName).toBeUndefined();
      });

      test('should have 90-day retention', () => {
        const properties = template.Resources.CloudTrailLogGroup.Properties;
        expect(properties.RetentionInDays).toBe(90);
      });
    });

    describe('CloudTrail Role', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CloudTrailRole).toBeDefined();
        expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have correct trust policy', () => {
        const properties = template.Resources.CloudTrailRole.Properties;
        const assumePolicy = properties.AssumeRolePolicyDocument;

        expect(assumePolicy.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have policy to write to CloudWatch Logs', () => {
        const properties = template.Resources.CloudTrailRole.Properties;
        const policy = properties.Policies[0];

        expect(policy.PolicyName).toBe('CloudTrailLogPolicy');

        const statement = policy.PolicyDocument.Statement[0];
        expect(statement.Action).toContain('logs:CreateLogStream');
        expect(statement.Action).toContain('logs:PutLogEvents');
        expect(statement.Resource).toEqual({
          'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn']
        });
      });
    });

    describe('CloudTrail', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CloudTrail).toBeDefined();
        expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      });

      test('should depend on S3 bucket and policy', () => {
        const trail = template.Resources.CloudTrail;
        expect(trail.DependsOn).toContain('CloudTrailBucketPolicy');
      });

      test('should have deterministic trail name', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.TrailName).toEqual({
          'Fn::Sub': 'SecureTrail-${EnvironmentSuffix}'
        });
      });

      test('should write to CloudTrail logging bucket', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.S3BucketName).toEqual({ Ref: 'S3LoggingBucket' });
      });

      test('should include global service events', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.IncludeGlobalServiceEvents).toBe(true);
      });

      test('should be logging', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.IsLogging).toBe(true);
      });

      test('should be multi-region trail', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.IsMultiRegionTrail).toBe(true);
      });

      test('should enable log file validation', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.EnableLogFileValidation).toBe(true);
      });

      test('should send logs to CloudWatch', () => {
        const properties = template.Resources.CloudTrail.Properties;
        expect(properties.CloudWatchLogsLogGroupArn).toEqual({
          'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn']
        });
        expect(properties.CloudWatchLogsRoleArn).toEqual({
          'Fn::GetAtt': ['CloudTrailRole', 'Arn']
        });
      });

      test('should have event selectors for all events', () => {
        const properties = template.Resources.CloudTrail.Properties;
        const eventSelector = properties.EventSelectors[0];

        expect(eventSelector.ReadWriteType).toBe('All');
        expect(eventSelector.IncludeManagementEvents).toBe(true);
      });

      test('should have correct tags', () => {
        const tags = template.Resources.CloudTrail.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'AuditLogs' });
      });
    });

    describe('CloudTrail Bucket Policy', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
        expect(template.Resources.CloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should be attached to S3 logging bucket', () => {
        const properties = template.Resources.CloudTrailBucketPolicy.Properties;
        expect(properties.Bucket).toEqual({ Ref: 'S3LoggingBucket' });
      });

      test('should allow CloudTrail to check bucket ACL', () => {
        const properties = template.Resources.CloudTrailBucketPolicy.Properties;
        const statements = properties.PolicyDocument.Statement;

        const aclStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
        expect(aclStatement).toBeDefined();
        expect(aclStatement.Effect).toBe('Allow');
        expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
        expect(aclStatement.Action).toBe('s3:GetBucketAcl');
      });

      test('should allow CloudTrail to write logs', () => {
        const properties = template.Resources.CloudTrailBucketPolicy.Properties;
        const statements = properties.PolicyDocument.Statement;

        const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
        expect(writeStatement).toBeDefined();
        expect(writeStatement.Effect).toBe('Allow');
        expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
        expect(writeStatement.Action).toBe('s3:PutObject');
        expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
      });
    });
  });

  // ==================== Monitoring Resources Tests ====================
  describe('Monitoring Resources', () => {
    describe('SNS Topic', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.SNSTopic).toBeDefined();
        expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
      });

      test('should have auto-generated topic name', () => {
        const properties = template.Resources.SNSTopic.Properties;
        expect(properties.TopicName).toBeUndefined();
      });

      test('should have display name', () => {
        const properties = template.Resources.SNSTopic.Properties;
        expect(properties.DisplayName).toBe('Security Alert Notifications');
      });

      test('should have email subscription', () => {
        const properties = template.Resources.SNSTopic.Properties;
        const subscription = properties.Subscription[0];

        expect(subscription.Endpoint).toEqual({ Ref: 'AlertEmail' });
        expect(subscription.Protocol).toBe('email');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.SNSTopic.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'SecurityAlerts' });
      });
    });

    describe('Unauthorized API Calls Metric Filter', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.UnauthorizedAPICallsMetricFilter).toBeDefined();
        expect(template.Resources.UnauthorizedAPICallsMetricFilter.Type).toBe('AWS::Logs::MetricFilter');
      });

      test('should have correct filter name', () => {
        const properties = template.Resources.UnauthorizedAPICallsMetricFilter.Properties;
        expect(properties.FilterName).toBe('UnauthorizedAPICalls');
      });

      test('should have correct filter pattern', () => {
        const properties = template.Resources.UnauthorizedAPICallsMetricFilter.Properties;
        const pattern = properties.FilterPattern;

        expect(pattern).toContain('UnauthorizedOperation');
        expect(pattern).toContain('AccessDenied');
      });

      test('should be associated with CloudTrail log group', () => {
        const properties = template.Resources.UnauthorizedAPICallsMetricFilter.Properties;
        expect(properties.LogGroupName).toEqual({ Ref: 'CloudTrailLogGroup' });
      });

      test('should have correct metric transformation', () => {
        const properties = template.Resources.UnauthorizedAPICallsMetricFilter.Properties;
        const transformation = properties.MetricTransformations[0];

        expect(transformation.MetricName).toBe('UnauthorizedAPICalls');
        expect(transformation.MetricNamespace).toBe('CloudTrailMetrics');
        expect(transformation.MetricValue).toBe('1');
      });
    });

    describe('Unauthorized API Calls Alarm', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
        expect(template.Resources.UnauthorizedAPICallsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have correct alarm name', () => {
        const properties = template.Resources.UnauthorizedAPICallsAlarm.Properties;
        expect(properties.AlarmName).toBe('UnauthorizedAPICalls');
      });

      test('should monitor correct metric', () => {
        const properties = template.Resources.UnauthorizedAPICallsAlarm.Properties;
        expect(properties.MetricName).toBe('UnauthorizedAPICalls');
        expect(properties.Namespace).toBe('CloudTrailMetrics');
      });

      test('should have correct threshold configuration', () => {
        const properties = template.Resources.UnauthorizedAPICallsAlarm.Properties;
        expect(properties.Statistic).toBe('Sum');
        expect(properties.Period).toBe(300);
        expect(properties.EvaluationPeriods).toBe(1);
        expect(properties.Threshold).toBe(1);
        expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });

      test('should send notification to SNS topic', () => {
        const properties = template.Resources.UnauthorizedAPICallsAlarm.Properties;
        expect(properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
      });

      test('should treat missing data as not breaching', () => {
        const properties = template.Resources.UnauthorizedAPICallsAlarm.Properties;
        expect(properties.TreatMissingData).toBe('notBreaching');
      });
    });

    describe('Root Account Usage Metric Filter', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.RootAccountUsageMetricFilter).toBeDefined();
        expect(template.Resources.RootAccountUsageMetricFilter.Type).toBe('AWS::Logs::MetricFilter');
      });

      test('should have correct filter pattern', () => {
        const properties = template.Resources.RootAccountUsageMetricFilter.Properties;
        const pattern = properties.FilterPattern;

        expect(pattern).toContain('userIdentity.type = "Root"');
        expect(pattern).toContain('NOT EXISTS');
        expect(pattern).toContain('AwsServiceEvent');
      });

      test('should have correct metric transformation', () => {
        const properties = template.Resources.RootAccountUsageMetricFilter.Properties;
        const transformation = properties.MetricTransformations[0];

        expect(transformation.MetricName).toBe('RootAccountUsage');
        expect(transformation.MetricNamespace).toBe('CloudTrailMetrics');
        expect(transformation.MetricValue).toBe('1');
      });
    });

    describe('Root Account Usage Alarm', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
        expect(template.Resources.RootAccountUsageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have correct alarm name', () => {
        const properties = template.Resources.RootAccountUsageAlarm.Properties;
        expect(properties.AlarmName).toBe('RootAccountUsage');
      });

      test('should monitor correct metric', () => {
        const properties = template.Resources.RootAccountUsageAlarm.Properties;
        expect(properties.MetricName).toBe('RootAccountUsage');
        expect(properties.Namespace).toBe('CloudTrailMetrics');
      });

      test('should send notification to SNS topic', () => {
        const properties = template.Resources.RootAccountUsageAlarm.Properties;
        expect(properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
      });
    });
  });

  // ==================== WAF Resources Tests ====================
  describe('WAF Resources', () => {
    describe('Web ACL', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.WebACL).toBeDefined();
        expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
      });

      test('should have deterministic name', () => {
        const properties = template.Resources.WebACL.Properties;
        expect(properties.Name).toEqual({
          'Fn::Sub': 'SecureWebACL-${EnvironmentSuffix}'
        });
      });

      test('should be regional scope', () => {
        const properties = template.Resources.WebACL.Properties;
        expect(properties.Scope).toBe('REGIONAL');
      });

      test('should have default allow action', () => {
        const properties = template.Resources.WebACL.Properties;
        expect(properties.DefaultAction.Allow).toBeDefined();
      });

      test('should have exactly 4 rules', () => {
        const properties = template.Resources.WebACL.Properties;
        expect(properties.Rules).toHaveLength(4);
      });

      test('should have rate limit rule', () => {
        const properties = template.Resources.WebACL.Properties;
        const rateRule = properties.Rules.find((r: any) => r.Name === 'RateLimitRule');

        expect(rateRule).toBeDefined();
        expect(rateRule.Priority).toBe(1);
        expect(rateRule.Statement.RateBasedStatement).toBeDefined();
        expect(rateRule.Statement.RateBasedStatement.Limit).toBe(2000);
        expect(rateRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
        expect(rateRule.Action.Block).toBeDefined();
      });

      test('should have common rule set', () => {
        const properties = template.Resources.WebACL.Properties;
        const commonRule = properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');

        expect(commonRule).toBeDefined();
        expect(commonRule.Priority).toBe(2);
        expect(commonRule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
        expect(commonRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
        expect(commonRule.OverrideAction.None).toBeDefined();
      });

      test('should have known bad inputs rule set', () => {
        const properties = template.Resources.WebACL.Properties;
        const badInputsRule = properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet');

        expect(badInputsRule).toBeDefined();
        expect(badInputsRule.Priority).toBe(3);
        expect(badInputsRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesKnownBadInputsRuleSet');
      });

      test('should have SQLi rule set', () => {
        const properties = template.Resources.WebACL.Properties;
        const sqliRule = properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesSQLiRuleSet');

        expect(sqliRule).toBeDefined();
        expect(sqliRule.Priority).toBe(4);
        expect(sqliRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
      });

      test('all rules should have visibility config', () => {
        const properties = template.Resources.WebACL.Properties;
        properties.Rules.forEach((rule: any) => {
          expect(rule.VisibilityConfig).toBeDefined();
          expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
          expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
          expect(rule.VisibilityConfig.MetricName).toBeDefined();
        });
      });

      test('should have visibility config for WebACL', () => {
        const properties = template.Resources.WebACL.Properties;
        const visibilityConfig = properties.VisibilityConfig;

        expect(visibilityConfig.SampledRequestsEnabled).toBe(true);
        expect(visibilityConfig.CloudWatchMetricsEnabled).toBe(true);
        expect(visibilityConfig.MetricName).toBe('WebACLMetric');
      });

      test('should have correct tags', () => {
        const tags = template.Resources.WebACL.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'Purpose', Value: 'WebApplicationFirewall' });
      });
    });

    describe('WAF Log Group', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.WAFLogGroup).toBeDefined();
        expect(template.Resources.WAFLogGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('should have correct log group name with environment suffix', () => {
        const properties = template.Resources.WAFLogGroup.Properties;
        expect(properties.LogGroupName).toEqual({
          'Fn::Sub': 'aws-waf-logs-secure-infrastructure-${EnvironmentSuffix}'
        });
      });

      test('should have 30-day retention', () => {
        const properties = template.Resources.WAFLogGroup.Properties;
        expect(properties.RetentionInDays).toBe(30);
      });
    });

    describe('WAF Logging Configuration', () => {
      test('should exist and be of correct type', () => {
        expect(template.Resources.WAFLoggingConfiguration).toBeDefined();
        expect(template.Resources.WAFLoggingConfiguration.Type).toBe('AWS::WAFv2::LoggingConfiguration');
      });

      test('should be attached to WebACL', () => {
        const properties = template.Resources.WAFLoggingConfiguration.Properties;
        expect(properties.ResourceArn).toEqual({
          'Fn::GetAtt': ['WebACL', 'Arn']
        });
      });

      test('should log to CloudWatch', () => {
        const properties = template.Resources.WAFLoggingConfiguration.Properties;
        const logDestination = properties.LogDestinationConfigs[0];

        expect(logDestination).toEqual({
          'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:aws-waf-logs-secure-infrastructure-${EnvironmentSuffix}'
        });
      });
    });
  });

  // ==================== Outputs Tests ====================
  describe('Outputs', () => {
    test('should have 11 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the created VPC');
      expect(output.Value).toEqual({ Ref: 'DefaultVPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-VPCId' });
    });

    test('S3LoggingBucketName output should be correct', () => {
      const output = template.Outputs.S3LoggingBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for logging');
      expect(output.Value).toEqual({ Ref: 'S3LoggingBucket' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-LoggingBucket' });
    });

    test('ApplicationDataBucketName output should be correct', () => {
      const output = template.Outputs.ApplicationDataBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for application data');
      expect(output.Value).toEqual({ Ref: 'ApplicationDataBucket' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-ApplicationBucket' });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS database endpoint');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address'] });
    });

    test('DatabaseSecretArn output should be correct', () => {
      const output = template.Outputs.DatabaseSecretArn;
      expect(output.Description).toBe('ARN of the database password secret');
      expect(output.Value).toEqual({ Ref: 'DatabasePasswordSecret' });
    });

    test('EC2InstanceId output should be correct', () => {
      const output = template.Outputs.EC2InstanceId;
      expect(output.Description).toContain('SSM Session Manager');
      expect(output.Value).toEqual({ Ref: 'HardenedEC2Instance' });
    });

    test('EC2SessionManagerURL output should be correct', () => {
      const output = template.Outputs.EC2SessionManagerURL;
      expect(output.Description).toBe('URL to connect to EC2 via SSM Session Manager');
      expect(output.Value['Fn::Sub']).toContain('systems-manager/session-manager');
      expect(output.Value['Fn::Sub']).toContain('${HardenedEC2Instance}');
    });

    test('WebACLArn output should be correct', () => {
      const output = template.Outputs.WebACLArn;
      expect(output.Description).toBe('ARN of the WAF WebACL');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['WebACL', 'Arn'] });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('ARN of SNS topic for security alerts');
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('CloudTrailArn output should be correct', () => {
      const output = template.Outputs.CloudTrailArn;
      expect(output.Description).toBe('ARN of the CloudTrail');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['CloudTrail', 'Arn'] });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('ID of the KMS key for encryption');
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ==================== Security Best Practices Tests ====================
  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const loggingBucket = template.Resources.S3LoggingBucket.Properties;
      const appDataBucket = template.Resources.ApplicationDataBucket.Properties;

      expect(loggingBucket.BucketEncryption).toBeDefined();
      expect(appDataBucket.BucketEncryption).toBeDefined();
    });

    test('all S3 buckets should block public access', () => {
      const loggingBucket = template.Resources.S3LoggingBucket.Properties;
      const appDataBucket = template.Resources.ApplicationDataBucket.Properties;

      [loggingBucket, appDataBucket].forEach(bucket => {
        const publicAccessBlock = bucket.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS should have encryption enabled', () => {
      const rdsProperties = template.Resources.RDSDatabase.Properties;
      expect(rdsProperties.StorageEncrypted).toBe(true);
      expect(rdsProperties.KmsKeyId).toBeDefined();
    });

    test('RDS should not be publicly accessible', () => {
      const rdsProperties = template.Resources.RDSDatabase.Properties;
      expect(rdsProperties.PubliclyAccessible).toBe(false);
    });

    test('all security group rules should have descriptions', () => {
      const appSG = template.Resources.ApplicationSecurityGroup.Properties;
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      const bastionSG = template.Resources.BastionSecurityGroup.Properties;

      if (appSG.SecurityGroupIngress) {
        appSG.SecurityGroupIngress.forEach((rule: any) => {
          expect(rule.Description).toBeDefined();
        });
      }

      if (dbSG.SecurityGroupIngress) {
        dbSG.SecurityGroupIngress.forEach((rule: any) => {
          expect(rule.Description).toBeDefined();
        });
      }

      if (appSG.SecurityGroupEgress) {
        appSG.SecurityGroupEgress.forEach((rule: any) => {
          expect(rule.Description).toBeDefined();
        });
      }
    });

    test('database security group should only allow access from application security group', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      const ingressRules = dbSG.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'ApplicationSecurityGroup' });
    });

    test('EC2 role should follow least privilege principle', () => {
      const role = template.Resources.EC2Role.Properties;
      const policies = role.Policies;

      // S3 policy should only grant access to specific bucket
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const s3Statements = s3Policy.PolicyDocument.Statement;
      s3Statements.forEach((statement: any) => {
        expect(statement.Resource).toBeDefined();
        expect(statement.Resource).not.toBe('*');
      });

      // Secrets Manager policy should only grant access to specific secret
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      const secretsStatement = secretsPolicy.PolicyDocument.Statement[0];
      expect(secretsStatement.Resource).toEqual({ Ref: 'DatabasePasswordSecret' });
    });

    test('CloudTrail should be enabled and logging', () => {
      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.IsLogging).toBe(true);
    });

    test('CloudTrail should be multi-region', () => {
      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', () => {
      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.EnableLogFileValidation).toBe(true);
    });

    test('all resources should be properly tagged', () => {
      const resourcesWithTags = [
        'DefaultVPC', 'DefaultSubnet1', 'DefaultSubnet2', 'InternetGateway',
        'RouteTable', 'S3LoggingBucket', 'ApplicationDataBucket', 'KMSKey',
        'DatabasePasswordSecret', 'ApplicationSecurityGroup', 'DatabaseSecurityGroup',
        'BastionSecurityGroup', 'EC2Role', 'HardenedEC2Instance', 'DBSubnetGroup',
        'RDSDatabase', 'CloudTrail', 'SNSTopic', 'WebACL'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          expect(resource.Properties.Tags).toBeDefined();
        }
      });
    });

    test('EC2 instance should use SSM Session Manager instead of SSH', () => {
      const bastionSG = template.Resources.BastionSecurityGroup.Properties;
      const ec2Role = template.Resources.EC2Role.Properties;

      // No SSH ingress rule
      expect(bastionSG.SecurityGroupIngress).toBeUndefined();

      // Has SSM managed policy
      expect(ec2Role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('database password should be managed by Secrets Manager', () => {
      const secret = template.Resources.DatabasePasswordSecret;
      const rds = template.Resources.RDSDatabase.Properties;

      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(rds.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('KMS key should be used for encryption', () => {
      const kmsKey = template.Resources.KMSKey;
      const appDataBucket = template.Resources.ApplicationDataBucket.Properties;
      const rdsDatabase = template.Resources.RDSDatabase.Properties;

      expect(kmsKey).toBeDefined();
      expect(appDataBucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      expect(rdsDatabase.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('WAF should have rate limiting enabled', () => {
      const webACL = template.Resources.WebACL.Properties;
      const rateRule = webACL.Rules.find((r: any) => r.Name === 'RateLimitRule');

      expect(rateRule).toBeDefined();
      expect(rateRule.Statement.RateBasedStatement).toBeDefined();
      expect(rateRule.Action.Block).toBeDefined();
    });

    test('WAF should have AWS managed rule sets', () => {
      const webACL = template.Resources.WebACL.Properties;
      const managedRules = webACL.Rules.filter((r: any) =>
        r.Statement.ManagedRuleGroupStatement?.VendorName === 'AWS'
      );

      expect(managedRules.length).toBeGreaterThan(0);
    });

    test('RDS should have automated backups configured', () => {
      const rdsProperties = template.Resources.RDSDatabase.Properties;
      expect(rdsProperties.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(rdsProperties.PreferredBackupWindow).toBeDefined();
    });

    test('RDS should export logs to CloudWatch', () => {
      const rdsProperties = template.Resources.RDSDatabase.Properties;
      expect(rdsProperties.EnableCloudwatchLogsExports).toBeDefined();
      expect(rdsProperties.EnableCloudwatchLogsExports.length).toBeGreaterThan(0);
    });
  });
});
