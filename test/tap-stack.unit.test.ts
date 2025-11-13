import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Security Configuration as Code', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with parameterized CIDR block and DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('should create PublicSubnet1 with MapPublicIpOnLaunch enabled and dynamic AZ selection', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create PublicSubnet2 with MapPublicIpOnLaunch enabled and AZ2 selection', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create PrivateSubnet1 with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
    });

    test('should create PrivateSubnet2 with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
    });

    test('should create DatabaseSubnet1 with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.DatabaseSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'DatabaseSubnet1CIDR' });
    });

    test('should create DatabaseSubnet2 with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.DatabaseSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'DatabaseSubnet2CIDR' });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NatGateway1EIP with vpc domain and gateway dependency', () => {
      const eip = template.Resources.NatGateway1EIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should create NatGateway2EIP with vpc domain and gateway dependency', () => {
      const eip = template.Resources.NatGateway2EIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should create NatGateway1 in PublicSubnet1 with EIP allocation', () => {
      const natGateway = template.Resources.NatGateway1;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId']
      });
    });

    test('should create NatGateway2 in PublicSubnet2 with EIP allocation', () => {
      const natGateway = template.Resources.NatGateway2;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway2EIP', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create PublicRoute with 0.0.0.0/0 to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should create PrivateRoute1 with 0.0.0.0/0 to NatGateway1', () => {
      const route = template.Resources.PrivateRoute1;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    });

    test('should create PrivateRoute2 with 0.0.0.0/0 to NatGateway2', () => {
      const route = template.Resources.PrivateRoute2;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });
  });

  describe('Security Group Configuration', () => {
    test('should create LoadBalancerSecurityGroup allowing HTTP and HTTPS from internet', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('HTTP access from internet');

      const httpsRule = sg.Properties.SecurityGroupIngress[1];
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBe('HTTPS access from internet');
    });

    test('should create WebServerSecurityGroup allowing traffic from LoadBalancerSecurityGroup only', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3);

      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });
      expect(httpRule.Description).toBe('HTTP from ALB');

      const httpsRule = sg.Properties.SecurityGroupIngress[1];
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });
      expect(httpsRule.Description).toBe('HTTPS from ALB');

      const sshRule = sg.Properties.SecurityGroupIngress[2];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
      expect(sshRule.Description).toBe('SSH access from specific IP');
    });

    test('should create AppServerSecurityGroup allowing traffic from WebServerSecurityGroup only', () => {
      const sg = template.Resources.AppServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const appRule = sg.Properties.SecurityGroupIngress[0];
      expect(appRule.IpProtocol).toBe('tcp');
      expect(appRule.FromPort).toBe(8080);
      expect(appRule.ToPort).toBe(8080);
      expect(appRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(appRule.Description).toBe('App traffic from web servers');

      const sshRule = sg.Properties.SecurityGroupIngress[1];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
    });

    test('should create DatabaseSecurityGroup allowing MySQL from AppServerSecurityGroup only', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'AppServerSecurityGroup' });
      expect(mysqlRule.Description).toBe('MySQL from app servers');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with automatic rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS key with IAM root permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);

      const rootStatement = keyPolicy.Statement[0];
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test('should create KMS key with service permissions for S3, Logs, and CloudTrail', () => {
      const kmsKey = template.Resources.KMSKey;
      const serviceStatement = kmsKey.Properties.KeyPolicy.Statement[1];

      expect(serviceStatement.Sid).toBe('Allow services to use the key');
      expect(serviceStatement.Effect).toBe('Allow');
      expect(serviceStatement.Principal.Service).toHaveLength(3);
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('cloudtrail.amazonaws.com');
      expect(serviceStatement.Action).toContain('kms:Decrypt');
      expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create ApplicationS3Bucket with KMS encryption and bucket key enabled', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should create ApplicationS3Bucket with versioning enabled and logging configured', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({
        Ref: 'LoggingS3Bucket'
      });
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('webapp-bucket-logs/');
    });

    test('should create ApplicationS3Bucket with public access completely blocked', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create ApplicationS3BucketPolicy denying insecure transport', () => {
      const policy = template.Resources.ApplicationS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureTransport');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:*');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should create LoggingS3Bucket with AES256 encryption and Retain policy', () => {
      const bucket = template.Resources.LoggingS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create LoggingS3Bucket with 90-day lifecycle policy', () => {
      const bucket = template.Resources.LoggingS3Bucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldLogs');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(90);
    });

    test('should create CloudTrailBucket with AES256 encryption and Retain policy', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create CloudTrailBucket with 365-day lifecycle policy', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldTrailLogs');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(365);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail with log file validation and global service events enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(false);
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('should create CloudTrail with management events only', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];

      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create WebServerRole with SSM and CloudWatch managed policies', () => {
      const role = template.Resources.WebServerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should create WebServerRole with S3 read-write policy for ApplicationS3Bucket', () => {
      const role = template.Resources.WebServerRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3ReadWritePolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
    });

    test('should create WebServerRole with KMS encrypt/decrypt policy', () => {
      const role = template.Resources.WebServerRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSEncryptDecryptPolicy');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Encrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:GenerateDataKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });
  });

  describe('EC2 Launch Template Configuration', () => {
    test('should create Launch Template with dynamic AMI from SSM Parameter Store', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });

    test('should create Launch Template with conditional KeyPair using Fn::If', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const keyName = launchTemplate.Properties.LaunchTemplateData.KeyName;

      expect(keyName['Fn::If']).toBeDefined();
      expect(keyName['Fn::If'][0]).toBe('HasKeyPair');
      expect(keyName['Fn::If'][1]).toEqual({ Ref: 'KeyPairName' });
      expect(keyName['Fn::If'][2]).toEqual({ Ref: 'AWS::NoValue' });
    });

    test('should create Launch Template with IMDSv2 enforced', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const metadataOptions = launchTemplate.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadataOptions.HttpTokens).toBe('required');
      expect(metadataOptions.HttpPutResponseHopLimit).toBe(1);
    });

    test('should create Launch Template with encrypted EBS volume', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const blockDevice = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0];

      expect(blockDevice.DeviceName).toBe('/dev/xvda');
      expect(blockDevice.Ebs.VolumeSize).toBe(20);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('should create Launch Template with UserData installing SSM agent and jq', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const userData = launchTemplate.Properties.LaunchTemplateData.UserData;

      expect(userData['Fn::Base64']).toBeDefined();
      const userDataLines = userData['Fn::Base64']['Fn::Join'][1];
      expect(userDataLines).toContain('yum install -y amazon-ssm-agent');
      expect(userDataLines).toContain('systemctl enable amazon-ssm-agent');
      expect(userDataLines).toContain('systemctl start amazon-ssm-agent');
      expect(userDataLines).toContain('yum install -y jq');
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('should create Auto Scaling Group with MinSize 2, MaxSize 4, DesiredCapacity 2', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should create Auto Scaling Group with ELB health check and 300-second grace period', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should create Auto Scaling Group in both public subnets', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create Application Load Balancer as internet-facing in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should create Application Load Balancer with S3 access logs enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const logsEnabled = attributes.find((attr: any) => attr.Key === 'access_logs.s3.enabled');
      expect(logsEnabled.Value).toBe('true');

      const logsBucket = attributes.find((attr: any) => attr.Key === 'access_logs.s3.bucket');
      expect(logsBucket.Value).toEqual({ Ref: 'LoggingS3Bucket' });

      const logsPrefix = attributes.find((attr: any) => attr.Key === 'access_logs.s3.prefix');
      expect(logsPrefix.Value).toBe('alb-logs');
    });

    test('should create Target Group with 30-second health check interval', () => {
      const targetGroup = template.Resources.WebServerTargetGroup;
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(2);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(3);
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create API Gateway REST API with REGIONAL endpoint', () => {
      const api = template.Resources.APIGatewayRestAPI;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toHaveLength(1);
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
    });

    test('should create API Gateway Request Validator for body and parameters', () => {
      const validator = template.Resources.APIGatewayRequestValidator;
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
    });

    test('should create API Gateway Method with HTTP_PROXY integration to ALB', () => {
      const method = template.Resources.APIGatewayMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.Integration.Type).toBe('HTTP_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('GET');
    });

    test('should create API Gateway Stage with logging and metrics enabled', () => {
      const stage = template.Resources.APIGatewayStage;
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toBe('prod');

      const methodSettings = stage.Properties.MethodSettings[0];
      expect(methodSettings.LoggingLevel).toBe('INFO');
      expect(methodSettings.DataTraceEnabled).toBe(true);
      expect(methodSettings.MetricsEnabled).toBe(true);
    });

    test('should create API Gateway Log Group with 30-day retention', () => {
      const logGroup = template.Resources.APIGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('WAF Configuration', () => {
    test('should create WAF Web ACL with REGIONAL scope and default Allow action', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
      expect(waf.Properties.DefaultAction.Allow).toBeDefined();
    });

    test('should create WAF with RateLimitRule blocking 2000 requests per 5 minutes', () => {
      const waf = template.Resources.WAFWebACL;
      const rateLimitRule = waf.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');

      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Priority).toBe(1);
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimitRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
      expect(rateLimitRule.Action.Block).toBeDefined();
    });

    test('should create WAF with AWS Managed Rules Common Rule Set', () => {
      const waf = template.Resources.WAFWebACL;
      const commonRuleSet = waf.Properties.Rules.find(
        (r: any) => r.Name === 'AWSManagedRulesCommonRuleSet'
      );

      expect(commonRuleSet).toBeDefined();
      expect(commonRuleSet.Priority).toBe(2);
      expect(commonRuleSet.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(commonRuleSet.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
      expect(commonRuleSet.OverrideAction.None).toBeDefined();
    });

    test('should create WAF with SQL injection rule set', () => {
      const waf = template.Resources.WAFWebACL;
      const sqliRuleSet = waf.Properties.Rules.find(
        (r: any) => r.Name === 'AWSManagedRulesSQLiRuleSet'
      );

      expect(sqliRuleSet).toBeDefined();
      expect(sqliRuleSet.Priority).toBe(3);
      expect(sqliRuleSet.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(sqliRuleSet.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
    });
  });

  describe('AWS Config Configuration', () => {
    test('should create ConfigRecorder recording all supported resource types', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(false);
      expect(recorder.DependsOn).toBe('ConfigS3BucketPolicy');
    });

    test('should create ConfigDeliveryChannel with 24-hour snapshot frequency', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });

    test('should create S3BucketPublicReadProhibitedRule config rule', () => {
      const rule = template.Resources.S3BucketPublicReadProhibitedRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.Owner).toBe('AWS');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::S3::Bucket');
    });

    test('should create S3BucketServerSideEncryptionEnabledRule config rule', () => {
      const rule = template.Resources.S3BucketServerSideEncryptionEnabledRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::S3::Bucket');
    });

    test('should create EC2InstancesInVPCRule config rule', () => {
      const rule = template.Resources.EC2InstancesInVPCRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('INSTANCES_IN_VPC');
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::EC2::Instance');
    });

    test('should create RestrictedSSHRule config rule', () => {
      const rule = template.Resources.RestrictedSSHRule;
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('INCOMING_SSH_DISABLED');
      expect(rule.Properties.Scope.ComplianceResourceTypes).toContain('AWS::EC2::SecurityGroup');
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Log with ALL traffic type to CloudWatch Logs', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('should create VPC Flow Log Group with 30-day retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create VPC Flow Log Role with CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogGroups');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogStreams');
    });
  });
});
