import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Secure Multi-Tier Web Application Infrastructure with Best Practices'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

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
  });

  describe('Metadata', () => {
    test('should have parameter groups', () => {
      const parameterGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toBeDefined();
      expect(Array.isArray(parameterGroups)).toBe(true);
    });

    test('should have Environment Configuration group', () => {
      const parameterGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const envGroup = parameterGroups.find(
        (g: any) => g.Label.default === 'Environment Configuration'
      );
      expect(envGroup).toBeDefined();
      expect(envGroup.Parameters).toContain('EnvironmentSuffix');
    });

    test('should have Network Configuration group', () => {
      const parameterGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const networkGroup = parameterGroups.find(
        (g: any) => g.Label.default === 'Network Configuration'
      );
      expect(networkGroup).toBeDefined();
      expect(networkGroup.Parameters).toContain('VPCCIDR');
      expect(networkGroup.Parameters).toContain('PublicSubnet1CIDR');
    });

    test('should have Security Configuration group', () => {
      const parameterGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const securityGroup = parameterGroups.find(
        (g: any) => g.Label.default === 'Security Configuration'
      );
      expect(securityGroup).toBeDefined();
      expect(securityGroup.Parameters).toContain('BastionAllowedIP');
      expect(securityGroup.Parameters).toContain('KeyPairName');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'VPCCIDR',
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR',
        'PrivateSubnet2CIDR',
        'BastionSubnetCIDR',
        'BastionAllowedIP',
        'KeyPairName',
        'DBMasterUsername',
        'DBInstanceClass',
        'InstanceType',
        'Environment',
        'EnvironmentSuffix',
        'Owner',
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.MaxLength).toBe(10);
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]*');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only lowercase letters, numbers, and hyphens'
      );
    });

    test('VPCCIDR parameter should have correct validation', () => {
      const vpcParam = template.Parameters.VPCCIDR;
      expect(vpcParam.Type).toBe('String');
      expect(vpcParam.Default).toBe('10.0.0.0/16');
      expect(vpcParam.AllowedPattern).toBe(
        '^(10|172|192)\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(16|17|18|19|20|21|22|23|24)$'
      );
    });

    test('Environment parameter should have allowed values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.AllowedValues).toContain('Development');
      expect(envParam.AllowedValues).toContain('Staging');
      expect(envParam.AllowedValues).toContain('Production');
      expect(envParam.Default).toBe('Production');
    });

    test('DBInstanceClass parameter should have allowed values', () => {
      const dbParam = template.Parameters.DBInstanceClass;
      expect(dbParam.AllowedValues).toContain('db.t3.micro');
      expect(dbParam.AllowedValues).toContain('db.t3.small');
      expect(dbParam.AllowedValues).toContain('db.t3.medium');
      expect(dbParam.Default).toBe('db.t3.micro');
    });

    test('KeyPairName parameter should be optional', () => {
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Default).toBe('');
      expect(keyPairParam.Type).toBe('String');
    });

    test('Owner parameter should have default value', () => {
      const ownerParam = template.Parameters.Owner;
      expect(ownerParam.Default).toBe('default-owner');
      expect(ownerParam.MinLength).toBe(1);
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('HasKeyPair condition should check if KeyPairName is not empty', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should reference VPCCIDR parameter', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDR' });
    });

    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThanOrEqual(3);

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const ownerTag = tags.find((t: any) => t.Key === 'Owner');

      expect(nameTag).toBeDefined();
      expect(envTag).toBeDefined();
      expect(ownerTag).toBeDefined();
    });
  });

  describe('Internet Gateway', () => {
    test('should create Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.AttachGateway.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.AttachGateway.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });
  });

  describe('Subnets', () => {
    test('should create all required subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.BastionSubnet).toBeDefined();
    });

    test('public subnets should map public IPs on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.BastionSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not map public IPs on launch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('all subnets should have proper tags', () => {
      const subnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'BastionSubnet',
      ];

      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.Tags).toBeDefined();
        expect(subnet.Properties.Tags.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('NAT Gateway', () => {
    test('should create NAT Gateway with EIP', () => {
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateway EIP should depend on AttachGateway', () => {
      expect(template.Resources.NATGatewayEIP.DependsOn).toBe('AttachGateway');
    });

    test('NAT Gateway should be in public subnet', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('Route Tables', () => {
    test('should create public and private route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('public route should route to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('private route should route to NAT Gateway', () => {
      const privateRoute = template.Resources.PrivateRoute;
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have correct subnet associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.BastionSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should create all required security groups', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
    });

    test('WebServer SG should allow HTTP and HTTPS from internet', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const httpRule = webSG.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      const httpsRule = webSG.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebServer SG should allow SSH from Bastion only', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const sshRule = webSG.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);

      expect(sshRule).toBeDefined();
      expect(sshRule.SourceSecurityGroupId).toEqual({ Ref: 'BastionSecurityGroup' });
    });

    test('Database SG should allow MySQL from WebServer only', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const mysqlRule = dbSG.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('Bastion SG should restrict SSH access', () => {
      const bastionSG = template.Resources.BastionSecurityGroup;
      const sshRule = bastionSG.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'BastionAllowedIP' });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('KMS key should allow EC2 and RDS services', () => {
      const kmsKey = template.Resources.KMSKey;
      const serviceStatement = kmsKey.Properties.KeyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow use of the key for encryption'
      );

      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
    });

    test('should create KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.KMSKeyAlias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Buckets', () => {
    test('should create FlowLogs and Application buckets', () => {
      expect(template.Resources.FlowLogBucket).toBeDefined();
      expect(template.Resources.ApplicationBucket).toBeDefined();
    });

    test('bucket names should use EnvironmentSuffix and be lowercase', () => {
      const flowLogsBucket = template.Resources.FlowLogBucket;
      const appBucket = template.Resources.ApplicationBucket;

      expect(flowLogsBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(appBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Verify lowercase format
      expect(flowLogsBucket.Properties.BucketName['Fn::Sub']).toBe(
        'tapstack-flowlogs-${EnvironmentSuffix}-${AWS::AccountId}'
      );
      expect(appBucket.Properties.BucketName['Fn::Sub']).toBe(
        'tapstack-app-data-${EnvironmentSuffix}-${AWS::AccountId}'
      );
    });

    test('buckets should have encryption enabled', () => {
      const flowLogsBucket = template.Resources.FlowLogBucket;
      const appBucket = template.Resources.ApplicationBucket;

      expect(flowLogsBucket.Properties.BucketEncryption).toBeDefined();
      expect(appBucket.Properties.BucketEncryption).toBeDefined();

      expect(
        flowLogsBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(
        appBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('buckets should have versioning enabled', () => {
      const flowLogsBucket = template.Resources.FlowLogBucket;
      const appBucket = template.Resources.ApplicationBucket;

      expect(flowLogsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(appBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('buckets should block all public access', () => {
      const flowLogsBucket = template.Resources.FlowLogBucket;
      const appBucket = template.Resources.ApplicationBucket;

      expect(flowLogsBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(flowLogsBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(
        true
      );
      expect(appBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(appBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });

    test('FlowLogs bucket should have lifecycle policy', () => {
      const flowLogsBucket = template.Resources.FlowLogBucket;
      expect(flowLogsBucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(flowLogsBucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role and profile', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });

    test('EC2 role should have AWS managed policies', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(ec2Role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('EC2 role should have S3 access policy with least privilege', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const s3Policy = ec2Role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('EC2 role should have SSM parameter access with proper scope', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const ssmPolicy = ec2Role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'ParameterStoreAccess'
      );

      expect(ssmPolicy).toBeDefined();
      expect(ssmPolicy.PolicyDocument.Statement[0].Resource['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
      expect(ssmPolicy.PolicyDocument.Statement[0].Action).toContain('ssm:GetParameter');
    });

    test('VPCFlowLog role should have proper trust relationship', () => {
      const flowLogRole = template.Resources.VPCFlowLogRole;
      expect(flowLogRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe(
        'vpc-flow-logs.amazonaws.com'
      );
    });
  });

  describe('RDS Database', () => {
    test('should create RDS database instance', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS should have deletion protection disabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should be in MultiAZ', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have backup retention', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should use Secrets Manager for password', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('DBPasswordSecret');
    });

    test('should create DB subnet group in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('RDS should have Performance Insights disabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.EnablePerformanceInsights).toBe(false);
    });
  });

  describe('EC2 Instances', () => {
    test('should create web server instances and bastion', () => {
      expect(template.Resources.WebServerInstance1).toBeDefined();
      expect(template.Resources.WebServerInstance2).toBeDefined();
      expect(template.Resources.BastionInstance).toBeDefined();
    });

    test('should create launch template for web servers', () => {
      expect(template.Resources.WebServerLaunchTemplate).toBeDefined();
      expect(template.Resources.WebServerLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should use SSM parameter for AMI', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toContain('resolve:ssm');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toContain(
        'ami-amazon-linux-latest'
      );
    });

    test('instances should have encrypted EBS volumes', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const bastionInstance = template.Resources.BastionInstance;

      expect(
        launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted
      ).toBe(true);
      expect(bastionInstance.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('instances should use KMS for EBS encryption', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const bastionInstance = template.Resources.BastionInstance;

      expect(
        launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.KmsKeyId
      ).toEqual({ Ref: 'KMSKey' });
      expect(bastionInstance.Properties.BlockDeviceMappings[0].Ebs.KmsKeyId).toEqual({
        Ref: 'KMSKey',
      });
    });

    test('instances should have IAM instance profile attached', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const bastionInstance = template.Resources.BastionInstance;

      expect(launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
      expect(bastionInstance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('KeyPair should be conditional', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const bastionInstance = template.Resources.BastionInstance;

      expect(launchTemplate.Properties.LaunchTemplateData.KeyName['Fn::If']).toBeDefined();
      expect(launchTemplate.Properties.LaunchTemplateData.KeyName['Fn::If'][0]).toBe(
        'HasKeyPair'
      );
      expect(bastionInstance.Properties.KeyName['Fn::If']).toBeDefined();
    });

    test('web servers should be deployed across multiple AZs', () => {
      const webServer1 = template.Resources.WebServerInstance1;
      const webServer2 = template.Resources.WebServerInstance2;

      expect(webServer1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(webServer2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CPU alarms for web servers', () => {
      expect(template.Resources.WebServer1CPUAlarm).toBeDefined();
      expect(template.Resources.WebServer2CPUAlarm).toBeDefined();
    });

    test('should create CPU and storage alarms for RDS', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseStorageAlarm).toBeDefined();
    });

    test('CPU alarms should have correct threshold', () => {
      const webServerAlarm = template.Resources.WebServer1CPUAlarm;
      expect(webServerAlarm.Properties.Threshold).toBe(80);
      expect(webServerAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('storage alarm should monitor free space', () => {
      const storageAlarm = template.Resources.DatabaseStorageAlarm;
      expect(storageAlarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(storageAlarm.Properties.Threshold).toBe(2147483648); // 2GB
      expect(storageAlarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC flow logs', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('flow logs should capture all traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('flow logs should use S3 destination', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.LogDestinationType).toBe('s3');
      expect(flowLog.Properties.LogDestination).toEqual({
        'Fn::GetAtt': ['FlowLogBucket', 'Arn'],
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create secret for DB password', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('secret should generate strong password', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBeDefined();
    });

    test('should create SSM parameter referencing secret', () => {
      expect(template.Resources.DBPasswordParameter).toBeDefined();
      expect(template.Resources.DBPasswordParameter.Type).toBe('AWS::SSM::Parameter');
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Name tag', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'NATGatewayEIP',
        'WebServerSecurityGroup',
        'KMSKey',
        'FlowLogBucket',
        'RDSDatabase',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();

        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      });
    });

    test('all taggable resources should have Environment and Owner tags', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'WebServerSecurityGroup',
        'RDSDatabase',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;

        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const ownerTag = tags.find((t: any) => t.Key === 'Owner');

        expect(envTag).toBeDefined();
        expect(ownerTag).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'WebServer1PublicIP',
        'WebServer2PublicIP',
        'BastionPublicIP',
        'DatabaseEndpoint',
        'ApplicationBucketName',
        'FlowLogBucketName',
        'DatabasePasswordLocation',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be exported', () => {
      const vpcIdOutput = template.Outputs.VPCId;
      expect(vpcIdOutput.Export).toBeDefined();
      expect(vpcIdOutput.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
    });

    test('SSHCommand output should be conditional', () => {
      const sshOutput = template.Outputs.SSHCommand;
      expect(sshOutput.Condition).toBe('HasKeyPair');
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      // Check for hardcoded passwords (not in GenerateStringKey or SecretString context)
      expect(templateString).not.toMatch(/[Pp]assword["']?\s*:\s*["'][^{$][^"']+["']/);
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSDatabase;
      // PubliclyAccessible defaults to false if not specified
      expect(rds.Properties.PubliclyAccessible).not.toBe(true);
    });

    test('security groups should not allow unrestricted access to SSH except bastion', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const sshRules = dbSG.Properties.SecurityGroupIngress?.filter(
        (r: any) => r.FromPort === 22
      );
      expect(sshRules || []).toHaveLength(0);
    });

    test('IAM roles should follow least privilege principle', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const s3Policy = ec2Role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');

      // Should not have wildcard resources
      expect(s3Policy.PolicyDocument.Statement[0].Resource).not.toContain('*');

      // Should be scoped to specific bucket
      expect(s3Policy.PolicyDocument.Statement[0].Resource[0]['Fn::GetAtt'][0]).toBe(
        'ApplicationBucket'
      );
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Counting all resources in the template
      expect(resourceCount).toBe(42); // Adjust based on actual count
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(14);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });

  describe('Naming Conventions', () => {
    test('resources using EnvironmentSuffix should not hardcode environment values', () => {
      const rds = template.Resources.RDSDatabase;
      const kmsAlias = template.Resources.KMSKeyAlias;
      const launchTemplate = template.Resources.WebServerLaunchTemplate;

      expect(rds.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(launchTemplate.Properties.LaunchTemplateName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('exported values should follow naming convention', () => {
      const vpcIdExport = template.Outputs.VPCId.Export.Name;
      expect(vpcIdExport['Fn::Sub']).toMatch(/^\$\{AWS::StackName\}-.+$/);
    });
  });
});
