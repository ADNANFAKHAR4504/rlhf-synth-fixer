import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Configuration', () => {
    test('should create public subnet 1 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create private subnet 1 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create single NAT Gateway EIP', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create single NAT Gateway in public subnet 1', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId']
      });
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public route to internet gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should create private route table with NAT gateway route', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route to NAT gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });
  });

  describe('IAM Roles', () => {
    test('should create Admin role with AdministratorAccess policy', () => {
      const role = template.Resources.AdminRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AdministratorAccess');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });
    });

    test('should create Developer role with inline policy', () => {
      const role = template.Resources.DeveloperRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('DeveloperPolicy');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('ecs:*');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('s3:*');
    });

    test('should create ReadOnly role with ReadOnlyAccess policy', () => {
      const role = template.Resources.ReadOnlyRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
    });

    test('should create ECS task execution role', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');
    });

    test('should create ECS task role with S3 and Secrets Manager permissions', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[1].Action).toContain('secretsmanager:GetSecretValue');
    });
  });

  describe('KMS Keys', () => {
    test('should create separate KMS key for S3 encryption', () => {
      const key = template.Resources.S3KMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for S3 bucket encryption');
      expect(key.Properties.KeyPolicy.Statement[0].Effect).toBe('Allow');
    });

    test('should create alias for S3 KMS key', () => {
      const alias = template.Resources.S3KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'S3KMSKey' });
    });

    test('should create separate KMS key for RDS encryption', () => {
      const key = template.Resources.RDSKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for RDS encryption');
      expect(key.Properties.KeyPolicy.Statement[0].Effect).toBe('Allow');
    });

    test('should create alias for RDS KMS key', () => {
      const alias = template.Resources.RDSKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should configure S3 bucket with KMS encryption', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'S3KMSKey' });
    });

    test('should configure S3 bucket with public access block', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudFront Configuration', () => {
    test('should create CloudFront Origin Access Identity', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(oai.Properties.CloudFrontOriginAccessIdentityConfig.Comment).toBe('Origin Access Identity for WebApp S3 bucket');
    });

    test('should create S3 bucket policy for CloudFront OAI access', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'S3Bucket' });
      expect(policy.Properties.PolicyDocument.Statement[0].Action).toBe('s3:GetObject');
    });

    test('should create CloudFront distribution with S3 origin', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
      expect(distribution.Properties.DistributionConfig.Origins).toHaveLength(1);
      expect(distribution.Properties.DistributionConfig.Origins[0].Id).toBe('S3Origin');
    });

    test('should configure CloudFront default cache behavior', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(behavior.TargetOriginId).toBe('S3Origin');
      expect(behavior.Compress).toBe(true);
      expect(behavior.AllowedMethods).toContain('GET');
      expect(behavior.AllowedMethods).toContain('HEAD');
    });

    test('should configure CloudFront cache behaviors for static assets', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const behaviors = distribution.Properties.DistributionConfig.CacheBehaviors;
      expect(behaviors).toHaveLength(4);
      expect(behaviors[0].PathPattern).toBe('*.jpg');
      expect(behaviors[1].PathPattern).toBe('*.png');
      expect(behaviors[2].PathPattern).toBe('*.css');
      expect(behaviors[3].PathPattern).toBe('*.js');
    });
  });

  describe('RDS Configuration', () => {
    test('should create Secrets Manager secret for database credentials', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toEqual({
        'Fn::Sub': '{"username": "${DBUsername}"}'
      });
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
    });

    test('should create DB subnet group with private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should create RDS instance with MySQL 8.0.43 and Multi-AZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should configure RDS with Secrets Manager integration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
    });

    test('should configure RDS with KMS encryption', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });

    test('should configure RDS with gp3 storage and 7-day backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.AllocatedStorage).toBe('20');
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should configure RDS with enhanced monitoring', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MonitoringInterval).toBe(60);
      expect(rds.Properties.MonitoringRoleArn).toEqual({
        'Fn::GetAtt': ['RDSMonitoringRole', 'Arn']
      });
    });

    test('should configure RDS with CloudWatch logs exports', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should create RDS monitoring role', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP and HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[1].FromPort).toBe(443);
      expect(sg.Properties.SecurityGroupIngress[1].ToPort).toBe(443);
    });

    test('should create ECS security group with ingress from ALB', () => {
      const sg = template.Resources.ECSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toEqual({ Ref: 'ContainerPort' });
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should create database security group with MySQL ingress from ECS and Bastion', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ECSSecurityGroup' });
      expect(sg.Properties.SecurityGroupIngress[1].SourceSecurityGroupId).toEqual({ Ref: 'BastionSecurityGroup' });
    });

    test('should create Bastion security group with SSH ingress', () => {
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
      expect(sg.Properties.SecurityGroupIngress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('ECS Configuration', () => {
    test('should create ECS cluster with Fargate capacity providers', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('should enable Container Insights on ECS cluster', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings).toHaveLength(1);
      expect(cluster.Properties.ClusterSettings[0].Name).toBe('containerInsights');
      expect(cluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should create ECS task definition with Fargate compatibility', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.Cpu).toBe('256');
      expect(taskDef.Properties.Memory).toBe('512');
    });

    test('should configure ECS task definition with execution and task roles', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.ExecutionRoleArn).toEqual({
        'Fn::GetAtt': ['ECSTaskExecutionRole', 'Arn']
      });
      expect(taskDef.Properties.TaskRoleArn).toEqual({
        'Fn::GetAtt': ['ECSTaskRole', 'Arn']
      });
    });

    test('should configure ECS container with RDS endpoint environment variable', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Name).toBe('webapp-container');
      expect(container.Environment).toHaveLength(1);
      expect(container.Environment[0].Name).toBe('DB_HOST');
      expect(container.Environment[0].Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address']
      });
    });

    test('should configure ECS container with CloudWatch logs', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');
      expect(container.LogConfiguration.Options['awslogs-region']).toEqual({ Ref: 'AWS::Region' });
    });

    test('should create ECS service with Fargate launch type', () => {
      const service = template.Resources.ECSService;
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.LaunchType).toBe('FARGATE');
      expect(service.Properties.DesiredCount).toEqual({ Ref: 'MinTaskCount' });
    });

    test('should configure ECS service in private subnets', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toHaveLength(2);
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should configure ECS service with load balancer integration', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LoadBalancers).toHaveLength(1);
      expect(service.Properties.LoadBalancers[0].ContainerName).toBe('webapp-container');
      expect(service.Properties.LoadBalancers[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create ALB in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.Subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create ALB target group with health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.TargetType).toBe('ip');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should create ALB listener on port 80', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create scalable target for ECS service with min and max capacity', () => {
      const target = template.Resources.ServiceScalingTarget;
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.MinCapacity).toEqual({ Ref: 'MinTaskCount' });
      expect(target.Properties.MaxCapacity).toEqual({ Ref: 'MaxTaskCount' });
      expect(target.Properties.ScalableDimension).toBe('ecs:service:DesiredCount');
      expect(target.Properties.ServiceNamespace).toBe('ecs');
    });

    test('should create target tracking scaling policy for CPU utilization', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ECSServiceAverageCPUUtilization');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70);
    });
  });

  describe('Bastion Host Configuration', () => {
    test('should create Bastion host with SSM parameter for AMI', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Type).toBe('AWS::EC2::Instance');
      expect(bastion.Properties.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });

    test('should configure Bastion host with conditional key pair', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.KeyName).toEqual({
        'Fn::If': ['HasKeyPair', { Ref: 'KeyName' }, { Ref: 'AWS::NoValue' }]
      });
    });

    test('should place Bastion host in public subnet with monitoring enabled', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(bastion.Properties.Monitoring).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create SNS topic for alarm notifications', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });

    test('should create ECS CPU alarm with 80% threshold', () => {
      const alarm = template.Resources.ECSCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/ECS');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Period).toBe(300);
    });

    test('should create RDS CPU alarm with 80% threshold', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should configure alarms to publish to SNS topic', () => {
      const ecsAlarm = template.Resources.ECSCPUAlarm;
      const rdsAlarm = template.Resources.RDSCPUAlarm;
      expect(ecsAlarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
      expect(rdsAlarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
    });
  });
});
