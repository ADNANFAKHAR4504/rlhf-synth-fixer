import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
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
      expect(template.Description).toContain('Secure AWS Infrastructure');
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

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });
  });

  // ==========================================
  // Parameters Tests
  // ==========================================

  describe('Parameters', () => {
    test('should have EnvironmentType parameter', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.EnvironmentType.Type).toBe('String');
      expect(template.Parameters.EnvironmentType.Default).toBe('development');
      expect(template.Parameters.EnvironmentType.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
    });

    test('should have CorporateIPRange parameter', () => {
      expect(template.Parameters.CorporateIPRange).toBeDefined();
      expect(template.Parameters.CorporateIPRange.Type).toBe('String');
      expect(template.Parameters.CorporateIPRange.AllowedPattern).toBeDefined();
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });

    test('should have CreateCloudTrail parameter', () => {
      expect(template.Parameters.CreateCloudTrail).toBeDefined();
      expect(template.Parameters.CreateCloudTrail.Type).toBe('String');
      expect(template.Parameters.CreateCloudTrail.AllowedValues).toEqual([
        'true',
        'false',
      ]);
      expect(template.Parameters.CreateCloudTrail.Default).toBe('false');
    });
  });

  // ==========================================
  // Mappings Tests
  // ==========================================

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('should have development environment configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.development;
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.DBInstanceClass).toBe('db.t3.micro');
      expect(devConfig.MultiAZ).toBe(false);
    });

    test('should have staging environment configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig.InstanceType).toBe('t3.small');
      expect(stagingConfig.DBInstanceClass).toBe('db.t3.small');
      expect(stagingConfig.MultiAZ).toBe(false);
    });

    test('should have production environment configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.production;
      expect(prodConfig.InstanceType).toBe('t3.medium');
      expect(prodConfig.DBInstanceClass).toBe('db.t3.small');
      expect(prodConfig.MultiAZ).toBe(true);
    });
  });

  // ==========================================
  // VPC and Networking Resources Tests
  // ==========================================

  describe('VPC Resources', () => {
    test('VPC should be defined with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags).toBeDefined();
    });

    test('PublicSubnet1 should be defined with correct properties', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('PublicSubnet2 should be defined with correct properties', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('PrivateSubnet1 should be defined with correct properties', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('PrivateSubnet2 should be defined with correct properties', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.20.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('InternetGateway should be defined', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('AttachGateway should attach IGW to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('PublicRouteTable should be defined', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('PublicRoute should route to InternetGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.DependsOn).toBe('AttachGateway');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('subnet route table associations should be defined', () => {
      const assoc1 = template.Resources.SubnetRouteTableAssociation1;
      const assoc2 = template.Resources.SubnetRouteTableAssociation2;

      expect(assoc1).toBeDefined();
      expect(assoc1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });

      expect(assoc2).toBeDefined();
      expect(assoc2.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  // ==========================================
  // VPC Flow Logs Tests
  // ==========================================

  describe('VPC Flow Logs Resources', () => {
    test('VPCFlowLogRole should be defined with correct permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('VPCFlowLogGroup should be defined with retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('VPCFlowLog should be configured correctly', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  // ==========================================
  // Security Groups Tests
  // ==========================================

  describe('Security Groups', () => {
    test('ALBSecurityGroup should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.length).toBe(2);

      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );
      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );

      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebServerSecurityGroup should allow traffic from ALB', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(httpsRule).toBeDefined();
      expect(httpsRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });

    test('WebServerSecurityGroup should restrict SSH to corporate IP', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'CorporateIPRange' });
      expect(sshRule.Description).toContain('corporate network');
    });

    test('DatabaseSecurityGroup should only allow MySQL from WebServer', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress.length).toBe(1);

      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({
        Ref: 'WebServerSecurityGroup',
      });
    });
  });

  // ==========================================
  // IAM Resources Tests
  // ==========================================

  describe('IAM Resources', () => {
    test('EC2InstanceRole should have correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');
    });

    test('EC2InstanceRole should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('EC2InstanceRole should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toBeDefined();
    });

    test('EC2InstanceRole should have SSM access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const ssmPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'SSMAccessPolicy'
      );
      expect(ssmPolicy).toBeDefined();
    });

    test('EC2InstanceProfile should reference EC2InstanceRole', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });

    test('LambdaExecutionRole should have basic execution policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have least privilege custom policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const customPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'LeastPrivilegeLambdaPolicy'
      );
      expect(customPolicy).toBeDefined();

      const statements = customPolicy.PolicyDocument.Statement;
      const s3Statement = statements.find(
        (s: any) => s.Action && s.Action.includes('s3:GetObject')
      );
      const dynamoStatement = statements.find(
        (s: any) => s.Action && s.Action.includes('dynamodb:GetItem')
      );

      expect(s3Statement).toBeDefined();
      expect(dynamoStatement).toBeDefined();
    });

    test('DeveloperUser should have limited EC2 permissions', () => {
      const user = template.Resources.DeveloperUser;
      expect(user).toBeDefined();
      expect(user.Type).toBe('AWS::IAM::User');

      const policy = user.Properties.Policies[0];
      const ec2Statement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ec2:'))
      );

      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Condition).toBeDefined();
      expect(ec2Statement.Condition.StringEquals).toBeDefined();
    });
  });

  // ==========================================
  // S3 Buckets Tests
  // ==========================================

  describe('S3 Bucket Resources', () => {
    test('ApplicationBucket should have encryption enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('ApplicationBucket should block all public access', () => {
      const bucket = template.Resources.ApplicationBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ApplicationBucket should have versioning enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ApplicationBucket should have lifecycle policy', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();

      const deleteOldVersionsRule =
        bucket.Properties.LifecycleConfiguration.Rules.find(
          (r: any) => r.Id === 'DeleteOldVersions'
        );
      expect(deleteOldVersionsRule).toBeDefined();
      expect(deleteOldVersionsRule.NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('CloudTrailBucket should be conditional', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Condition).toBe('ShouldCreateCloudTrail');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('CloudTrailBucket should have encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('EmptyS3BucketLambda should be defined for cleanup', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('CloudTrailBucketPolicy should allow CloudTrail service', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Condition).toBe('ShouldCreateCloudTrail');
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheck = statements.find(
        (s: any) => s.Sid === 'AWSCloudTrailAclCheck'
      );
      const write = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

      expect(aclCheck).toBeDefined();
      expect(write).toBeDefined();
    });
  });

  // ==========================================
  // RDS Resources Tests
  // ==========================================

  describe('RDS Resources', () => {
    test('DBSubnetGroup should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('DBPasswordSecret should be defined in Secrets Manager', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(
        true
      );
    });

    test('RDSDatabase should have encryption enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('RDSDatabase should use MySQL 8.0.43', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
    });

    test('RDSDatabase should have backup retention', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('RDSDatabase should use environment-specific instance class', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.DBInstanceClass).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'DBInstanceClass'],
      });
    });

    test('RDSDatabase should have CloudWatch Logs exports', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('RDSDatabase should retrieve password from Secrets Manager', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain(
        'resolve:secretsmanager'
      );
    });
  });

  // ==========================================
  // CloudTrail Resources Tests
  // ==========================================

  describe('CloudTrail Resources', () => {
    test('CloudTrail should be conditional', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Condition).toBe('ShouldCreateCloudTrail');
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('CloudTrail should be multi-region', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should monitor S3 data events', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EventSelectors).toBeDefined();
      expect(trail.Properties.EventSelectors[0].DataResources).toBeDefined();

      const s3DataResource = trail.Properties.EventSelectors[0].DataResources.find(
        (r: any) => r.Type === 'AWS::S3::Object'
      );
      expect(s3DataResource).toBeDefined();
    });
  });

  // ==========================================
  // Load Balancer Resources Tests
  // ==========================================

  describe('Application Load Balancer Resources', () => {
    test('ApplicationLoadBalancer should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ApplicationLoadBalancer should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
    });

    test('ALBTargetGroup should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('ALBListenerHTTP should forward to target group', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  // ==========================================
  // EC2 and Auto Scaling Tests
  // ==========================================

  describe('EC2 and Auto Scaling Resources', () => {
    test('LaunchTemplate should use SSM parameter for AMI', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({
        Ref: 'LatestAmiId',
      });
    });

    test('LaunchTemplate should use environment-specific instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'EnvironmentType' }, 'InstanceType'],
      });
    });

    test('LaunchTemplate should have IAM instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'],
      });
    });

    test('LaunchTemplate should have CloudWatch agent user data', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('AutoScalingGroup should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('AutoScalingGroup should have correct capacity settings', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(3);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('AutoScalingGroup should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('AutoScalingGroup should be attached to target group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toContainEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  // ==========================================
  // Lambda and DynamoDB Tests
  // ==========================================

  describe('Lambda and DynamoDB Resources', () => {
    test('ApplicationTable should use on-demand billing', () => {
      const table = template.Resources.ApplicationTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ApplicationTable should have encryption enabled', () => {
      const table = template.Resources.ApplicationTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('ApplicationTable should have point-in-time recovery', () => {
      const table = template.Resources.ApplicationTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('ApplicationTable should have correct key schema', () => {
      const table = template.Resources.ApplicationTable;
      expect(table.Properties.KeySchema).toBeDefined();
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('ProcessingLambda should use Python 3.9', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });

    test('ProcessingLambda should have table name as environment variable', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toEqual({
        Ref: 'ApplicationTable',
      });
    });

    test('ProcessingLambda should have reserved concurrency', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(10);
    });
  });

  // ==========================================
  // CloudWatch Alarms and SNS Tests
  // ==========================================

  describe('CloudWatch Alarms and SNS Resources', () => {
    test('SecurityAlarmTopic should be defined', () => {
      const topic = template.Resources.SecurityAlarmTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('UnauthorizedAPICallsAlarm should be configured correctly', () => {
      const alarm = template.Resources.UnauthorizedAPICallsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnauthorizedAPICalls');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'SecurityAlarmTopic' });
    });

    test('RootAccountUsageAlarm should be configured correctly', () => {
      const alarm = template.Resources.RootAccountUsageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('RootAccountUsage');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('HighCPUAlarm should monitor Auto Scaling Group', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'AutoScalingGroup',
      });
    });

    test('DatabaseConnectionsAlarm should monitor RDS', () => {
      const alarm = template.Resources.DatabaseConnectionsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(40);
      expect(alarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'RDSDatabase',
      });
    });
  });

  // ==========================================
  // CloudWatch Logs and Metric Filters Tests
  // ==========================================

  describe('CloudWatch Logs and Metric Filters', () => {
    test('CloudTrailLogGroup should be conditional', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Condition).toBe('ShouldCreateCloudTrail');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('UnauthorizedAPICallsMetricFilter should be configured', () => {
      const filter = template.Resources.UnauthorizedAPICallsMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Condition).toBe('ShouldCreateCloudTrail');
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain('UnauthorizedOperation');
      expect(filter.Properties.MetricTransformations[0].MetricName).toBe(
        'UnauthorizedAPICalls'
      );
    });

    test('RootAccountUsageMetricFilter should be configured', () => {
      const filter = template.Resources.RootAccountUsageMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Condition).toBe('ShouldCreateCloudTrail');
      expect(filter.Properties.FilterPattern).toContain('Root');
      expect(filter.Properties.MetricTransformations[0].MetricName).toBe(
        'RootAccountUsage'
      );
    });
  });

  // ==========================================
  // Outputs Tests
  // ==========================================

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have LoadBalancerURL output', () => {
      expect(template.Outputs.LoadBalancerURL).toBeDefined();
      expect(template.Outputs.LoadBalancerURL.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({
        Ref: 'ApplicationBucket',
      });
    });

    test('should have DatabaseEndpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({
        'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address'],
      });
    });

    test('should have DatabasePasswordSecret output', () => {
      expect(template.Outputs.DatabasePasswordSecret).toBeDefined();
      expect(template.Outputs.DatabasePasswordSecret.Value).toEqual({
        Ref: 'DBPasswordSecret',
      });
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toEqual({
        Ref: 'SecurityAlarmTopic',
      });
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['ProcessingLambda', 'Arn'],
      });
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({
        Ref: 'ApplicationTable',
      });
    });

    test('should have AutoScalingGroupName output', () => {
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName.Value).toEqual({
        Ref: 'AutoScalingGroup',
      });
    });

    test('should have all subnet ID outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have security group ID outputs', () => {
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        const output = template.Outputs[outputKey];
        if (!output.Condition) {
          expect(output.Export).toBeDefined();
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  // ==========================================
  // Resource Dependencies and Relationships Tests
  // ==========================================

  describe('Resource Dependencies and Relationships', () => {
    test('RDSDatabase should depend on DBSubnetGroup', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('VPCFlowLog should depend on VPCFlowLogGroup and Role', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogRole', 'Arn'],
      });
    });

    test('AutoScalingGroup should depend on LaunchTemplate', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({
        Ref: 'LaunchTemplate',
      });
    });

    test('CloudTrail should depend on CloudTrailBucketPolicy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });
  });

  // ==========================================
  // Tagging Tests
  // ==========================================

  describe('Resource Tagging', () => {
    test('VPC should have Environment tag', () => {
      const vpc = template.Resources.VPC;
      const envTag = vpc.Properties.Tags.find(
        (t: any) => t.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentType' });
    });

    test('all subnet resources should have Environment tag', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(
        (subnetName) => {
          const subnet = template.Resources[subnetName];
          const envTag = subnet.Properties.Tags.find(
            (t: any) => t.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
        }
      );
    });

    test('S3 buckets should have Environment tag', () => {
      const appBucket = template.Resources.ApplicationBucket;
      const envTag = appBucket.Properties.Tags.find(
        (t: any) => t.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });
  });

  // ==========================================
  // Security Best Practices Tests
  // ==========================================

  describe('Security Best Practices', () => {
    test('all IAM roles should have tags', () => {
      [
        'VPCFlowLogRole',
        'EC2InstanceRole',
        'LambdaExecutionRole',
        'EmptyS3BucketLambdaRole',
      ].forEach((roleName) => {
        const role = template.Resources[roleName];
        expect(role.Properties.Tags).toBeDefined();
      });
    });

    test('RDS should not allow deletion protection by default', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('all security groups should be in VPC', () => {
      ['ALBSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup'].forEach(
        (sgName) => {
          const sg = template.Resources[sgName];
          expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
        }
      );
    });

    test('Lambda function should have execution role', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
    });
  });
});
