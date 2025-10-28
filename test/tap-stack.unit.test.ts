import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ========== Template Structure Tests ==========

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('secure production environment');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // ========== Parameter Tests ==========

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'ProjectName',
        'OwnerEmail',
        'AdminIPAddress',
        'DBUsername',
        'KeyPairName',
        'LatestAmiId',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toContain('production');
      expect(envParam.AllowedValues).toContain('staging');
      expect(envParam.AllowedValues).toContain('development');
    });

    test('AdminIPAddress should have validation pattern', () => {
      const ipParam = template.Parameters.AdminIPAddress;
      expect(ipParam.AllowedPattern).toBeDefined();
      expect(ipParam.AllowedPattern).toContain('/32');
    });

    test('DBUsername should have NoEcho enabled', () => {
      const dbUserParam = template.Parameters.DBUsername;
      expect(dbUserParam.NoEcho).toBe(true);
      expect(dbUserParam.AllowedPattern).toBeDefined();
    });

    test('KeyPairName should be AWS::EC2::KeyPair::KeyName type', () => {
      const keyParam = template.Parameters.KeyPairName;
      expect(keyParam.Type).toBe('AWS::EC2::KeyPair::KeyName');
    });
  });

  // ========== KMS Encryption Tests ==========

  describe('KMS Key Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper policy for CloudWatch Logs', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      const logsStatement = statements.find((s: any) =>
        s.Sid === 'Allow use of the key for CloudWatch Logs'
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service).toContain('logs');
      expect(logsStatement.Action).toContain('kms:Encrypt');
      expect(logsStatement.Action).toContain('kms:Decrypt');
    });

    test('should create KMS alias', () => {
      const kmsAlias = template.Resources.KMSKeyAlias;
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain('alias/');
    });

    test('KMS key should have required tags', () => {
      const kmsKey = template.Resources.KMSKey;
      const tags = kmsKey.Properties.Tags;

      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Owner')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Project')).toBeDefined();
    });
  });

  // ========== Secrets Manager Tests ==========

  describe('Secrets Manager Configuration', () => {
    test('should create DB password secret', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB password should be encrypted with KMS', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId.Ref).toBe('KMSKey');
    });

    test('DB password should have strong generation policy', () => {
      const secret = template.Resources.DBPasswordSecret;
      const genString = secret.Properties.GenerateSecretString;

      expect(genString.PasswordLength).toBe(32);
      expect(genString.RequireEachIncludedType).toBe(true);
      expect(genString.ExcludeCharacters).toBeDefined();
    });
  });

  // ========== VPC and Networking Tests ==========

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock['Fn::FindInMap']).toEqual([
        'SubnetConfig',
        'VPC',
        'CIDR',
      ]);
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe(
        'InternetGateway'
      );
    });
  });

  describe('Subnet Configuration', () => {
    test('should create 6 subnets (2 public, 2 private, 2 database)', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSubnet1',
        'DatabaseSubnet2',
      ];

      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should auto-assign public IP', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should use correct CIDR blocks from mappings', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.CidrBlock['Fn::FindInMap']).toEqual([
        'SubnetConfig',
        'PublicSubnet1',
        'CIDR',
      ]);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create 2 NAT Gateways for high availability', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();

      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create Elastic IPs for NAT Gateways', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');
    });

    test('NAT Gateways should depend on IGW attachment', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(eip1.DependsOn).toBe('AttachGateway');
      expect(eip2.DependsOn).toBe('AttachGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;

      expect(nat1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(nat2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });
  });

  describe('Route Table Configuration', () => {
    test('should create route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('public route table should route to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
    });

    test('private route tables should route to NAT Gateways', () => {
      const privateRoute1 = template.Resources.PrivateRoute1;
      const privateRoute2 = template.Resources.PrivateRoute2;

      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId.Ref).toBe('NATGateway1');
      expect(privateRoute2.Properties.NatGatewayId.Ref).toBe('NATGateway2');
    });

    test('database subnets should use private route tables', () => {
      const dbSubnetAssoc1 = template.Resources.DatabaseSubnetRouteTableAssociation1;
      const dbSubnetAssoc2 = template.Resources.DatabaseSubnetRouteTableAssociation2;

      expect(dbSubnetAssoc1.Properties.RouteTableId.Ref).toBe(
        'PrivateRouteTable1'
      );
      expect(dbSubnetAssoc2.Properties.RouteTableId.Ref).toBe(
        'PrivateRouteTable2'
      );
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC flow logs bucket', () => {
      const bucket = template.Resources.VPCFlowLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('VPC flow logs bucket should be encrypted', () => {
      const bucket = template.Resources.VPCFlowLogsBucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe(
        'KMSKey'
      );
    });

    test('should create VPC flow log resource', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPC flow logs should have lifecycle policy', () => {
      const bucket = template.Resources.VPCFlowLogsBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycle.Status).toBe('Enabled');
      expect(lifecycle.ExpirationInDays).toBe(90);
    });
  });

  // ========== Security Group Tests ==========

  describe('Security Group Configuration', () => {
    test('should create all required security groups', () => {
      const securityGroups = [
        'BastionSecurityGroup',
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'LambdaSecurityGroup',
      ];

      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('Bastion SG should only allow SSH from admin IP', () => {
      const bastionSG = template.Resources.BastionSecurityGroup;
      const ingress = bastionSG.Properties.SecurityGroupIngress[0];

      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(22);
      expect(ingress.ToPort).toBe(22);
      expect(ingress.CidrIp.Ref).toBe('AdminIPAddress');
    });

    test('ALB SG should allow HTTP and HTTPS from anywhere', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 SG should only accept traffic from ALB and Bastion', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      const ingress = ec2SG.Properties.SecurityGroupIngress;

      const httpRule = ingress.find(
        (r: any) => r.FromPort === 80 && r.SourceSecurityGroupId
      );
      const sshRule = ingress.find(
        (r: any) => r.FromPort === 22 && r.SourceSecurityGroupId
      );

      expect(httpRule.SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
      expect(sshRule.SourceSecurityGroupId.Ref).toBe('BastionSecurityGroup');
    });

    test('RDS SG should only accept traffic from EC2 and Lambda', () => {
      const rdsSG = template.Resources.RDSSecurityGroup;
      const ingress = rdsSG.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('EC2SecurityGroup');
      expect(ingress[1].SourceSecurityGroupId.Ref).toBe('LambdaSecurityGroup');
    });
  });

  // ========== IAM Roles and Policies Tests ==========

  describe('IAM Configuration', () => {
    test('should create EC2 instance role', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have required managed policies', () => {
      const role = template.Resources.EC2Role;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMPatchAssociation'
      );
    });

    test('EC2 role should have S3 and KMS permissions', () => {
      const role = template.Resources.EC2Role;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      const kmsStatement = statements.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );

      expect(s3Statement).toBeDefined();
      expect(kmsStatement).toBeDefined();
    });

    test('should create Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have VPC execution policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('Lambda role should have KMS and SSM permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const kmsStatement = statements.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );
      const ssmStatement = statements.find((s: any) =>
        s.Action.includes('ssm:GetParameter')
      );

      expect(kmsStatement).toBeDefined();
      expect(ssmStatement).toBeDefined();
    });

    test('should create EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles[0].Ref).toBe('EC2Role');
    });
  });

  // ========== S3 Bucket Tests ==========

  describe('S3 Bucket Configuration', () => {
    test('should create all required S3 buckets', () => {
      const buckets = [
        'S3Bucket',
        'CloudTrailS3Bucket',
        'ConfigS3Bucket',
        'VPCFlowLogsBucket',
        'ALBAccessLogsBucket',
        'CloudFrontLogsBucket',
      ];

      buckets.forEach(bucket => {
        expect(template.Resources[bucket]).toBeDefined();
        expect(template.Resources[bucket].Type).toBe('AWS::S3::Bucket');
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      const buckets = [
        'S3Bucket',
        'CloudTrailS3Bucket',
        'ConfigS3Bucket',
        'VPCFlowLogsBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'aws:kms'
        );
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const buckets = [
        'S3Bucket',
        'CloudTrailS3Bucket',
        'ConfigS3Bucket',
        'VPCFlowLogsBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = [
        'S3Bucket',
        'CloudTrailS3Bucket',
        'ConfigS3Bucket',
        'VPCFlowLogsBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have lifecycle policies', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket;

      expect(
        s3Bucket.Properties.LifecycleConfiguration.Rules[0].Status
      ).toBe('Enabled');
      expect(
        cloudTrailBucket.Properties.LifecycleConfiguration.Rules[0].Status
      ).toBe('Enabled');
    });
  });

  // ========== RDS Database Tests ==========

  describe('RDS Configuration', () => {
    test('should create RDS DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should use database subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      const subnetIds = subnetGroup.Properties.SubnetIds;

      expect(subnetIds[0].Ref).toBe('DatabaseSubnet1');
      expect(subnetIds[1].Ref).toBe('DatabaseSubnet2');
    });

    test('should create RDS database instance', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should be Multi-AZ for high availability', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have storage encryption enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId.Ref).toBe('KMSKey');
    });

    test('RDS should have backup retention configured', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('RDS should have deletion policy set to Snapshot', () => {
      const rds = template.Resources.RDS Database;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('RDS should have IAM database authentication enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.EnableIAMDatabaseAuthentication).toBe(true);
    });

    test('RDS should enable CloudWatch logs export', () => {
      const rds = template.Resources.RDSDatabase;
      const logExports = rds.Properties.EnableCloudwatchLogsExports;

      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slowquery');
    });

    test('should create RDS parameter group with secure transport', () => {
      const paramGroup = template.Resources.RDSDBParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Parameters.require_secure_transport).toBe(
        '1'
      );
    });
  });

  // ========== Application Load Balancer Tests ==========

  describe('ALB Configuration', () => {
    test('should create Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should span multiple public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;

      expect(subnets[0].Ref).toBe('PublicSubnet1');
      expect(subnets[1].Ref).toBe('PublicSubnet2');
    });

    test('ALB should have access logs enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attrs = alb.Properties.LoadBalancerAttributes;

      const logsEnabled = attrs.find(
        (a: any) => a.Key === 'access_logs.s3.enabled'
      );
      expect(logsEnabled.Value).toBe('true');
    });

    test('should create ALB target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALB target group should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should create HTTP listener with redirect to HTTPS', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');

      const action = listener.Properties.DefaultActions[0];
      expect(action.Type).toBe('redirect');
      expect(action.RedirectConfig.Protocol).toBe('HTTPS');
      expect(action.RedirectConfig.StatusCode).toBe('HTTP_301');
    });

    test('should create HTTPS listener with TLS 1.2', () => {
      const listener = template.Resources.ALBListenerHTTPS;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.SslPolicy).toBe(
        'ELBSecurityPolicy-TLS-1-2-2017-01'
      );
    });

    test('should create ACM certificate', () => {
      const cert = template.Resources.Certificate;
      expect(cert).toBeDefined();
      expect(cert.Type).toBe('AWS::CertificateManager::Certificate');
      expect(cert.Properties.ValidationMethod).toBe('DNS');
    });
  });

  // ========== Auto Scaling Tests ==========

  describe('Auto Scaling Configuration', () => {
    test('should create Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use encrypted EBS volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;
      const rootVolume = blockDevices[0].Ebs;

      expect(rootVolume.Encrypted).toBe(true);
      expect(rootVolume.KmsKeyId.Ref).toBe('KMSKey');
      expect(rootVolume.VolumeType).toBe('gp3');
    });

    test('Launch Template should require IMDSv2', () => {
      const lt = template.Resources.LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(1);
    });

    test('Launch Template should have user data for CloudWatch agent', () => {
      const lt = template.Resources.LaunchTemplate;
      const userData = lt.Properties.LaunchTemplateData.UserData;

      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']).toContain('amazon-cloudwatch-agent');
    });

    test('should create Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should have minimum 3 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(3);
      expect(asg.Properties.MaxSize).toBe(9);
      expect(asg.Properties.DesiredCapacity).toBe(3);
    });

    test('ASG should span private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;

      expect(subnets[0].Ref).toBe('PrivateSubnet1');
      expect(subnets[1].Ref).toBe('PrivateSubnet2');
    });

    test('ASG should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should create scaling policies', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp).toBeDefined();
      expect(scaleDown).toBeDefined();
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  // ========== CloudWatch Alarms Tests ==========

  describe('CloudWatch Alarms Configuration', () => {
    test('should create high CPU alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create low CPU alarm', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Threshold).toBe(20);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should create unexpected scaling alarm', () => {
      const alarm = template.Resources.UnexpectedScalingAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('GroupDesiredCapacity');
      expect(alarm.Properties.Threshold).toBe(6);
    });

    test('high CPU alarm should trigger scale up and SNS', () => {
      const alarm = template.Resources.HighCPUAlarm;
      const actions = alarm.Properties.AlarmActions;

      expect(actions[0].Ref).toBe('ScaleUpPolicy');
      expect(actions[1].Ref).toBe('SNSTopic');
    });

    test('should create SNS topic with encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId.Ref).toBe('KMSKey');
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.SNSTopic;
      const subscription = topic.Properties.Subscription[0];

      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint.Ref).toBe('OwnerEmail');
    });
  });

  // ========== Lambda Function Tests ==========

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should be in VPC', () => {
      const lambda = template.Resources.LambdaFunction;
      const vpcConfig = lambda.Properties.VpcConfig;

      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SubnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(vpcConfig.SubnetIds[1].Ref).toBe('PrivateSubnet2');
      expect(vpcConfig.SecurityGroupIds[0].Ref).toBe('LambdaSecurityGroup');
    });

    test('Lambda should have encrypted environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.KmsKeyArn['Fn::GetAtt'][0]).toBe('KMSKey');
    });

    test('Lambda should have environment variables for DB access', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.DB_ENDPOINT_PARAM).toBeDefined();
      expect(envVars.DB_PASSWORD_PARAM).toBeDefined();
      expect(envVars.ENVIRONMENT).toBeDefined();
    });
  });

  // ========== CloudFront Tests ==========

  describe('CloudFront Configuration', () => {
    test('should create CloudFront distribution', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf).toBeDefined();
      expect(cf.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should have logging enabled', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const logging = cf.Properties.DistributionConfig.Logging;

      expect(logging).toBeDefined();
      expect(logging['Fn::GetAtt'][0]).toBe('CloudFrontLogsBucket');
    });

    test('CloudFront should redirect HTTP to HTTPS', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const defaultBehavior =
        cf.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront should have S3 and ALB origins', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const origins = cf.Properties.DistributionConfig.Origins;

      expect(origins).toHaveLength(2);
      expect(origins[0].Id).toBe('S3Origin');
      expect(origins[1].Id).toBe('ALBOrigin');
    });

    test('should create CloudFront Origin Access Identity', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      expect(oai).toBeDefined();
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('S3 bucket policy should allow CloudFront access', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Action).toBe('s3:GetObject');
    });
  });

  // ========== CloudTrail Tests ==========

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be multi-region', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should have log file validation', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should log S3 data events', () => {
      const trail = template.Resources.CloudTrail;
      const dataResource = trail.Properties.EventSelectors[0].DataResources[0];

      expect(dataResource.Type).toBe('AWS::S3::Object');
    });

    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailS3BucketPolicy');
    });
  });

  // ========== AWS Config Tests ==========

  describe('AWS Config Configuration', () => {
    test('should create Config recorder', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('Config should record all resource types', () => {
      const recorder = template.Resources.ConfigRecorder;
      const recordingGroup = recorder.Properties.RecordingGroup;

      expect(recordingGroup.AllSupported).toBe(true);
      expect(recordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should create Config delivery channel', () => {
      const channel = template.Resources.DeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should create Config rules for compliance', () => {
      const encryptedVolumesRule = template.Resources.ConfigRuleEncryptedVolumes;
      const sshRule = template.Resources.ConfigRuleSecurityGroupSSHRestricted;

      expect(encryptedVolumesRule).toBeDefined();
      expect(sshRule).toBeDefined();
      expect(encryptedVolumesRule.Type).toBe('AWS::Config::ConfigRule');
      expect(sshRule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('Config rules should depend on recorder and delivery channel', () => {
      const rule = template.Resources.ConfigRuleEncryptedVolumes;
      expect(rule.DependsOn).toContain('ConfigRecorder');
      expect(rule.DependsOn).toContain('DeliveryChannel');
    });

    test('should create Config role with proper permissions', () => {
      const role = template.Resources.ConfigRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/ConfigRole'
      );
    });
  });

  // ========== Bastion Host Tests ==========

  describe('Bastion Host Configuration', () => {
    test('should create bastion host', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion).toBeDefined();
      expect(bastion.Type).toBe('AWS::EC2::Instance');
    });

    test('bastion should be in public subnet', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('bastion should have encrypted EBS volume', () => {
      const bastion = template.Resources.BastionHost;
      const ebs = bastion.Properties.BlockDeviceMappings[0].Ebs;

      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId.Ref).toBe('KMSKey');
    });

    test('bastion should require IMDSv2', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.MetadataOptions.HttpTokens).toBe('required');
    });
  });

  // ========== SSM Parameter Store Tests ==========

  describe('SSM Parameter Store Configuration', () => {
    test('should create DB endpoint parameter', () => {
      const param = template.Resources.DBEndpointParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
    });

    test('DB endpoint parameter should reference RDS endpoint', () => {
      const param = template.Resources.DBEndpointParameter;
      expect(param.Properties.Value['Fn::GetAtt'][0]).toBe('RDSDatabase');
      expect(param.Properties.Value['Fn::GetAtt'][1]).toBe('Endpoint.Address');
    });
  });

  // ========== Backup Configuration Tests ==========

  describe('Backup Configuration', () => {
    test('should create backup vault', () => {
      const vault = template.Resources.BackupVault;
      expect(vault).toBeDefined();
      expect(vault.Type).toBe('AWS::Backup::BackupVault');
      expect(vault.Properties.EncryptionKeyArn['Fn::GetAtt'][0]).toBe('KMSKey');
    });

    test('should create backup plan with daily backups', () => {
      const plan = template.Resources.BackupPlan;
      expect(plan).toBeDefined();
      expect(plan.Type).toBe('AWS::Backup::BackupPlan');

      const rule = plan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.RuleName).toBe('DailyBackups');
      expect(rule.ScheduleExpression).toBe('cron(0 5 ? * * *)');
    });

    test('backup plan should have lifecycle policy', () => {
      const plan = template.Resources.BackupPlan;
      const lifecycle = plan.Properties.BackupPlan.BackupPlanRule[0].Lifecycle;

      expect(lifecycle.DeleteAfterDays).toBe(365);
      expect(lifecycle.MoveToColdStorageAfterDays).toBe(90);
    });

    test('should create backup selection', () => {
      const selection = template.Resources.BackupSelection;
      expect(selection).toBeDefined();
      expect(selection.Type).toBe('AWS::Backup::BackupSelection');
    });

    test('backup selection should include RDS and EBS volumes', () => {
      const selection = template.Resources.BackupSelection;
      const resources = selection.Properties.BackupSelection.Resources;

      expect(resources[0]['Fn::Sub']).toContain('arn:aws:rds');
      expect(resources[1]['Fn::Sub']).toContain('arn:aws:ec2');
    });
  });

  // ========== Patch Management Tests ==========

  describe('Patch Management Configuration', () => {
    test('should create patch baseline', () => {
      const baseline = template.Resources.PatchBaseline;
      expect(baseline).toBeDefined();
      expect(baseline.Type).toBe('AWS::SSM::PatchBaseline');
      expect(baseline.Properties.OperatingSystem).toBe('AMAZON_LINUX_2');
    });

    test('patch baseline should have security patches', () => {
      const baseline = template.Resources.PatchBaseline;
      const filters =
        baseline.Properties.ApprovalRules.PatchRules[0].PatchFilterGroup
          .PatchFilters;

      const classificationFilter = filters.find(
        (f: any) => f.Key === 'CLASSIFICATION'
      );
      expect(classificationFilter.Values).toContain('Security');
    });

    test('should create maintenance window', () => {
      const window = template.Resources.MaintenanceWindow;
      expect(window).toBeDefined();
      expect(window.Type).toBe('AWS::SSM::MaintenanceWindow');
      expect(window.Properties.Schedule).toBe('cron(0 2 ? * SUN *)');
    });

    test('should create maintenance window task', () => {
      const task = template.Resources.MaintenanceWindowTask;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::SSM::MaintenanceWindowTask');
      expect(task.Properties.TaskArn).toBe('AWS-RunPatchBaseline');
    });
  });

  // ========== Outputs Tests ==========

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'CloudFrontDomainName',
        'RDSEndpoint',
        'BastionHostPublicIP',
        'S3BucketName',
        'KMSKeyId',
        'CloudTrailName',
        'SNSTopicArn',
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
      });
    });
  });

  // ========== Resource Tagging Tests ==========

  describe('Resource Tagging Compliance', () => {
    test('all taggable resources should have required tags', () => {
      const requiredTags = ['Environment', 'Owner', 'Project'];
      const taggableResources = [
        'VPC',
        'KMSKey',
        'S3Bucket',
        'RDSDatabase',
        'ApplicationLoadBalancer',
        'LambdaFunction',
        'SNSTopic',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          requiredTags.forEach(tagKey => {
            const tag = tags.find((t: any) => t.Key === tagKey);
            expect(tag).toBeDefined();
          });
        }
      });
    });
  });

  // ========== Template Validation Tests ==========

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined references in Ref', () => {
      const checkRefs = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') return true;

        if (obj.Ref && typeof obj.Ref === 'string') {
          const ref = obj.Ref;
          if (!ref.startsWith('AWS::')) {
            expect(
              template.Resources[ref] || template.Parameters[ref]
            ).toBeDefined();
          }
        }

        for (const key in obj) {
          if (!checkRefs(obj[key])) return false;
        }
        return true;
      };

      expect(checkRefs(template.Resources)).toBe(true);
    });

    test('mappings should have correct structure', () => {
      const mappings = template.Mappings;
      expect(mappings.SubnetConfig).toBeDefined();
      expect(mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });
  });
});
