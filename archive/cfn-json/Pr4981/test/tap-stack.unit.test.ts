import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Template Structure Validation ====================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  // ==================== Parameters Validation ====================
  describe('Parameters', () => {
    test('should have exactly 9 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(9);
    });

    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'InstanceType',
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'DBInstanceClass',
        'DBAllocatedStorage',
        'DepartmentTag',
        'DisableApiTermination'
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    describe('EnvironmentSuffix Parameter', () => {
      test('should have correct type and default', () => {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('prod');
      });

      test('should have lowercase alphanumeric pattern', () => {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
        expect(param.ConstraintDescription).toBeDefined();
      });

      test('should have description', () => {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.Description).toBeDefined();
      });
    });

    describe('InstanceType Parameter', () => {
      test('should have correct type and default', () => {
        const param = template.Parameters.InstanceType;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('t3.micro');
      });

      test('should have valid allowed values', () => {
        const param = template.Parameters.InstanceType;
        expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
      });

      test('should have description', () => {
        const param = template.Parameters.InstanceType;
        expect(param.Description).toBeDefined();
      });
    });

    describe('Auto Scaling Parameters', () => {
      test('MinSize should have correct properties', () => {
        const param = template.Parameters.MinSize;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(2);
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(10);
      });

      test('MaxSize should have correct properties', () => {
        const param = template.Parameters.MaxSize;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(6);
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(20);
      });

      test('DesiredCapacity should have correct properties', () => {
        const param = template.Parameters.DesiredCapacity;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(2);
        expect(param.MinValue).toBe(1);
        expect(param.MaxValue).toBe(10);
      });
    });

    describe('Database Parameters', () => {
      test('DBInstanceClass should have correct properties', () => {
        const param = template.Parameters.DBInstanceClass;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('db.t3.micro');
        expect(param.AllowedValues).toEqual(['db.t3.micro', 'db.t3.small', 'db.t3.medium']);
      });

      test('DBAllocatedStorage should have correct properties', () => {
        const param = template.Parameters.DBAllocatedStorage;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(20);
        expect(param.MinValue).toBe(20);
        expect(param.MaxValue).toBe(100);
      });
    });

    describe('Tagging and Protection Parameters', () => {
      test('DepartmentTag should have correct properties', () => {
        const param = template.Parameters.DepartmentTag;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('Engineering');
      });

      test('DisableApiTermination should have correct properties', () => {
        const param = template.Parameters.DisableApiTermination;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('false');
        expect(param.AllowedValues).toEqual(['true', 'false']);
      });
    });
  });

  // ==================== Resources Validation ====================
  describe('Resources', () => {
    test('should have exactly 46 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(46);
    });

    describe('Networking Resources', () => {
      test('should have VPC with correct properties', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });

      test('should have Internet Gateway', () => {
        const igw = template.Resources.InternetGateway;
        expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      });

      test('should have VPC Gateway Attachment', () => {
        const attachment = template.Resources.AttachGateway;
        expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      });

      test('should have 2 public subnets in different AZs', () => {
        const subnet1 = template.Resources.PublicSubnet1;
        const subnet2 = template.Resources.PublicSubnet2;

        expect(subnet1.Type).toBe('AWS::EC2::Subnet');
        expect(subnet2.Type).toBe('AWS::EC2::Subnet');

        expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');

        expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('should have 2 private subnets in different AZs', () => {
        const subnet1 = template.Resources.PrivateSubnet1;
        const subnet2 = template.Resources.PrivateSubnet2;

        expect(subnet1.Type).toBe('AWS::EC2::Subnet');
        expect(subnet2.Type).toBe('AWS::EC2::Subnet');

        expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
        expect(subnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      });

      test('should have NAT Gateway with EIP', () => {
        const eip = template.Resources.NATGatewayEIP;
        const nat = template.Resources.NATGateway;

        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.Properties.Domain).toBe('vpc');
        expect(eip.DependsOn).toBe('AttachGateway');

        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
        expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      });

      test('should have public route table with internet route', () => {
        const routeTable = template.Resources.PublicRouteTable;
        const route = template.Resources.PublicRoute;

        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
        expect(route.DependsOn).toBe('AttachGateway');
      });

      test('should have private route table with NAT route', () => {
        const routeTable = template.Resources.PrivateRouteTable;
        const route = template.Resources.PrivateRoute;

        expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      });

      test('should have route table associations for all subnets', () => {
        const associations = [
          'PublicSubnetRouteTableAssociation1',
          'PublicSubnetRouteTableAssociation2',
          'PrivateSubnetRouteTableAssociation1',
          'PrivateSubnetRouteTableAssociation2'
        ];

        associations.forEach(assoc => {
          expect(template.Resources[assoc]).toBeDefined();
          expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        });
      });
    });

    describe('Security Group Resources', () => {
      test('should have ALB security group with HTTP/HTTPS ingress', () => {
        const sg = template.Resources.ALBSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

        const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
        const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(httpRule.CidrIp).toBe('0.0.0.0/0');
        expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      });

      test('should have WebServer security group restricted to ALB', () => {
        const sg = template.Resources.WebServerSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

        const rule = sg.Properties.SecurityGroupIngress[0];
        expect(rule.FromPort).toBe(80);
        expect(rule.ToPort).toBe(80);
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });

      test('should have Database security group restricted to WebServer', () => {
        const sg = template.Resources.DBSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

        const rule = sg.Properties.SecurityGroupIngress[0];
        expect(rule.FromPort).toBe(3306);
        expect(rule.ToPort).toBe(3306);
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      });
    });

    describe('IAM Resources', () => {
      test('should have EC2 instance role with SSM policy', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      });

      test('should have EC2 instance role with S3 read-only policy', () => {
        const role = template.Resources.EC2InstanceRole;
        const s3Policy = role.Properties.Policies[0];

        expect(s3Policy.PolicyName).toBe('S3ReadOnlyAccess');
        expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
        expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      });

      test('should have EC2 instance profile', () => {
        const profile = template.Resources.EC2InstanceProfile;
        expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
        expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
      });

      test('should have Config recorder role', () => {
        const role = template.Resources.ConfigRecorderRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
      });
    });

    describe('Load Balancer Resources', () => {
      test('should have Application Load Balancer with proper dependencies', () => {
        const alb = template.Resources.ApplicationLoadBalancer;
        expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
        expect(alb.Properties.Type).toBe('application');
        expect(alb.Properties.Scheme).toBe('internet-facing');
        expect(alb.DependsOn).toEqual([
          'AttachGateway',
          'PublicRoute',
          'PublicSubnetRouteTableAssociation1',
          'PublicSubnetRouteTableAssociation2'
        ]);
      });

      test('should have ALB target group with health checks', () => {
        const tg = template.Resources.ALBTargetGroup;
        expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
        expect(tg.Properties.HealthCheckEnabled).toBe(true);
        expect(tg.Properties.HealthCheckPath).toBe('/');
        expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
        expect(tg.Properties.HealthyThresholdCount).toBe(2);
        expect(tg.Properties.UnhealthyThresholdCount).toBe(5);
      });

      test('should have ALB listener forwarding to target group', () => {
        const listener = template.Resources.ALBListener;
        expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
        expect(listener.Properties.Port).toBe(80);
        expect(listener.Properties.Protocol).toBe('HTTP');
        expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      });
    });

    describe('Auto Scaling Resources', () => {
      test('should have Launch Template with correct configuration', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
        expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
        expect(lt.Properties.LaunchTemplateData.DisableApiTermination).toEqual({ Ref: 'DisableApiTermination' });
      });

      test('should have Launch Template with SSM AMI parameter', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Properties.LaunchTemplateData.ImageId).toBe(
          '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        );
      });

      test('should have Launch Template with user data', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
        expect(lt.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();
      });

      test('should have Auto Scaling Group in private subnets', () => {
        const asg = template.Resources.AutoScalingGroup;
        expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
        expect(asg.Properties.VPCZoneIdentifier).toEqual([
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' }
        ]);
      });

      test('should have Auto Scaling Group with ELB health checks', () => {
        const asg = template.Resources.AutoScalingGroup;
        expect(asg.Properties.HealthCheckType).toBe('ELB');
        expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      });
    });

    describe('Database Resources', () => {
      test('should have KMS key for RDS encryption', () => {
        const key = template.Resources.DBKMSKey;
        expect(key.Type).toBe('AWS::KMS::Key');
        expect(key.Properties.Description).toBe('KMS key for RDS encryption');
      });

      test('should have KMS key alias', () => {
        const alias = template.Resources.DBKMSKeyAlias;
        expect(alias.Type).toBe('AWS::KMS::Alias');
        expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'DBKMSKey' });
      });

      test('should have Secrets Manager secret for database credentials', () => {
        const secret = template.Resources.DBSecret;
        expect(secret.Type).toBe('AWS::SecretsManager::Secret');
        expect(secret.Properties.GenerateSecretString).toBeDefined();
        expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      });

      test('should have DB subnet group in private subnets', () => {
        const subnetGroup = template.Resources.DBSubnetGroup;
        expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
        expect(subnetGroup.Properties.SubnetIds).toEqual([
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' }
        ]);
      });

      test('should have RDS instance with encryption enabled', () => {
        const db = template.Resources.DBInstance;
        expect(db.Type).toBe('AWS::RDS::DBInstance');
        expect(db.Properties.StorageEncrypted).toBe(true);
        expect(db.Properties.KmsKeyId).toEqual({ Ref: 'DBKMSKey' });
      });

      test('should have RDS instance with MySQL 8.0', () => {
        const db = template.Resources.DBInstance;
        expect(db.Properties.Engine).toBe('mysql');
        expect(db.Properties.EngineVersion).toBe('8.0.39');
      });

      test('should have RDS instance with backup configuration', () => {
        const db = template.Resources.DBInstance;
        expect(db.Properties.BackupRetentionPeriod).toBe(7);
        expect(db.Properties.PreferredBackupWindow).toBeDefined();
        expect(db.Properties.PreferredMaintenanceWindow).toBeDefined();
      });
    });

    describe('S3 Storage Resources', () => {
      test('should have main S3 bucket with encryption', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('should have S3 bucket with public access blocked', () => {
        const bucket = template.Resources.S3Bucket;
        const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessConfig.BlockPublicAcls).toBe(true);
        expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
        expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
        expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
      });

      test('should have S3 bucket with versioning enabled', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have S3 bucket with access logging', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'LoggingBucket' });
      });

      test('should have logging bucket with lifecycle rules', () => {
        const bucket = template.Resources.LoggingBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
      });

      test('should have CloudTrail bucket with lifecycle rules', () => {
        const bucket = template.Resources.CloudTrailBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(365);
      });

      test('should have Config bucket', () => {
        const bucket = template.Resources.ConfigBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have bucket policies for all service buckets', () => {
        expect(template.Resources.LoggingBucketPolicy).toBeDefined();
        expect(template.Resources.S3BucketPolicy).toBeDefined();
        expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
        expect(template.Resources.ConfigBucketPolicy).toBeDefined();
      });
    });

    describe('CloudFront Resources', () => {
      test('should have CloudFront Origin Access Identity', () => {
        const oai = template.Resources.CloudFrontOriginAccessIdentity;
        expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      });

      test('should have CloudFront distribution with HTTPS redirect', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Type).toBe('AWS::CloudFront::Distribution');
        expect(cf.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      });

      test('should have CloudFront distribution with access logging', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Properties.DistributionConfig.Logging).toBeDefined();
        expect(cf.Properties.DistributionConfig.Logging.Bucket).toEqual({ 'Fn::GetAtt': ['LoggingBucket', 'DomainName'] });
      });

      test('should have CloudFront distribution depending on logging bucket policy', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.DependsOn).toBe('LoggingBucketPolicy');
      });
    });

    describe('Monitoring and Compliance Resources', () => {
      test('should have CloudTrail with log file validation', () => {
        const trail = template.Resources.CloudTrail;
        expect(trail.Type).toBe('AWS::CloudTrail::Trail');
        expect(trail.Properties.IsLogging).toBe(true);
        expect(trail.Properties.EnableLogFileValidation).toBe(true);
      });

      test('should have CloudTrail monitoring S3 bucket events', () => {
        const trail = template.Resources.CloudTrail;
        const dataResources = trail.Properties.EventSelectors[0].DataResources;
        expect(dataResources).toBeDefined();
        expect(dataResources[0].Type).toBe('AWS::S3::Object');
      });

      test('should have CloudTrail depending on bucket policy', () => {
        const trail = template.Resources.CloudTrail;
        expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
      });

      test('should have AWS Config delivery channel', () => {
        const channel = template.Resources.ConfigDeliveryChannel;
        expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
        expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
      });

      test('should have AWS Config recorder', () => {
        const recorder = template.Resources.ConfigRecorder;
        expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
        expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
        expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
      });
    });
  });

  // ==================== Security Best Practices Validation ====================
  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const s3Buckets = ['S3Bucket', 'LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('all S3 buckets should block public access', () => {
      const s3Buckets = ['S3Bucket', 'LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessConfig.BlockPublicAcls).toBe(true);
        expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      });
    });

    test('RDS should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(dbSubnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('EC2 instances should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('RDS should have encryption at rest', () => {
      const db = template.Resources.DBInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBeDefined();
    });

    test('database credentials should be in Secrets Manager', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');

      const db = template.Resources.DBInstance;
      expect(db.Properties.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });

    test('EC2 instances should use IAM instance profile for permissions', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });

    test('CloudFront should use HTTPS', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('security groups should follow least privilege principle', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      expect(dbSg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });

      const webSg = template.Resources.WebServerSecurityGroup;
      expect(webSg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  // ==================== Tagging Validation ====================
  describe('Resource Tagging', () => {
    test('VPC should have Department tag', () => {
      const vpc = template.Resources.VPC;
      const deptTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Department');
      expect(deptTag).toBeDefined();
      expect(deptTag.Value).toEqual({ Ref: 'DepartmentTag' });
    });

    test('all subnets should have Department tag', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        const deptTag = subnet.Properties.Tags.find((t: any) => t.Key === 'Department');
        expect(deptTag).toBeDefined();
      });
    });

    test('all S3 buckets should have Department tag', () => {
      const buckets = ['S3Bucket', 'LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const deptTag = bucket.Properties.Tags.find((t: any) => t.Key === 'Department');
        expect(deptTag).toBeDefined();
      });
    });

    test('resources should use EnvironmentSuffix in naming', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  // ==================== Resource Dependencies Validation ====================
  describe('Resource Dependencies', () => {
    test('NAT Gateway EIP should depend on gateway attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('Public route should depend on gateway attachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('ALB should depend on network infrastructure', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toContain('AttachGateway');
      expect(alb.DependsOn).toContain('PublicRoute');
      expect(alb.DependsOn).toContain('PublicSubnetRouteTableAssociation1');
      expect(alb.DependsOn).toContain('PublicSubnetRouteTableAssociation2');
    });

    test('CloudFront should depend on logging bucket policy', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.DependsOn).toBe('LoggingBucketPolicy');
    });

    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });
  });

  // ==================== Outputs Validation ====================
  describe('Outputs', () => {
    test('should have exactly 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have all required outputs', () => {
      const expectedOutputs = ['VpcId', 'AlbDnsName', 'CloudFrontDistributionDomainName', 'CloudFrontDistributionId', 'S3BucketName', 'LoggingBucketName', 'RdsEndpoint', 'KmsKeyId'];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should export stack name', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC' });
    });

    test('AlbDnsName output should have correct value', () => {
      const output = template.Outputs.AlbDnsName;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('CloudFrontDistributionDomainName output should have correct value', () => {
      const output = template.Outputs.CloudFrontDistributionDomainName;
      expect(output.Description).toBe('CloudFront Distribution Domain Name');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] });
    });

    test('CloudFrontDistributionId output should have correct value', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output.Description).toBe('CloudFront Distribution ID');
      expect(output.Value).toEqual({ Ref: 'CloudFrontDistribution' });
    });

    test('S3BucketName output should have correct value', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 Bucket Name for Web Content');
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
    });

    test('LoggingBucketName output should have correct value', () => {
      const output = template.Outputs.LoggingBucketName;
      expect(output.Description).toBe('Logging Bucket Name');
      expect(output.Value).toEqual({ Ref: 'LoggingBucket' });
    });

    test('RdsEndpoint output should have correct value', () => {
      const output = template.Outputs.RdsEndpoint;
      expect(output.Description).toBe('RDS Instance Endpoint');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DBInstance', 'Endpoint.Address'] });
    });

    test('KmsKeyId output should have correct value', () => {
      const output = template.Outputs.KmsKeyId;
      expect(output.Description).toBe('KMS Key ID for RDS Encryption');
      expect(output.Value).toEqual({ Ref: 'DBKMSKey' });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });
});
