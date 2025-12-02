import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Processing Stack CloudFormation Template - Unit Tests', () => {
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
      expect(template.Description).toContain('payment processing');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
    });

    test('should have EnvironmentType parameter', () => {
      const param = template.Parameters.EnvironmentType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Default).toBe('dev');
    });

    test('should have InstanceType parameter', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 'm5.large']);
      expect(param.Default).toBe('t3.micro');
    });

    test('should have DBInstanceClass parameter', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['db.t3.small', 'db.t3.medium', 'db.r5.large']);
      expect(param.Default).toBe('db.t3.small');
    });

    test('should have DBMultiAZ parameter', () => {
      const param = template.Parameters.DBMultiAZ;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('false');
    });

    test('should have DBUsername parameter', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('postgres');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should use dynamic reference for RDS password (not DBPassword parameter)', () => {
      // Verify DBPassword parameter does not exist
      expect(template.Parameters.DBPassword).toBeUndefined();
      // Verify RDS instance uses dynamic reference for password
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      const password = rds.Properties.MasterUserPassword;
      expect(password).toBeDefined();
      // Should use Fn::Sub with dynamic reference to Secrets Manager
      expect(password['Fn::Sub']).toBeDefined();
      expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('should have CPUAlarmThreshold parameter', () => {
      const param = template.Parameters.CPUAlarmThreshold;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(80);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(100);
    });

    test('should have QueueDepthAlarmThreshold parameter', () => {
      const param = template.Parameters.QueueDepthAlarmThreshold;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.MinValue).toBe(1);
    });

    test('should have SQSVisibilityTimeout parameter', () => {
      const param = template.Parameters.SQSVisibilityTimeout;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(420);
      expect(param.MinValue).toBe(360);
      expect(param.MaxValue).toBe(43200);
    });

    test('should have PaymentAPIEndpoint parameter', () => {
      const param = template.Parameters.PaymentAPIEndpoint;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toContain('https://');
    });
  });

  describe('Mappings', () => {
    test('should use SSM Parameter Store for AMI (not RegionAMI mapping)', () => {
      // Verify RegionAMI mapping does not exist
      expect(template.Mappings.RegionAMI).toBeUndefined();
      // Verify LaunchTemplate uses SSM dynamic reference for AMI
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      const launchTemplateData = launchTemplate.Properties.LaunchTemplateData;
      expect(launchTemplateData).toBeDefined();
      const imageId = launchTemplateData.ImageId;
      expect(imageId).toBeDefined();
      // Should use SSM dynamic reference
      expect(typeof imageId).toBe('string');
      expect(imageId).toContain('resolve:ssm:/aws/service/ami-amazon-linux-latest');
    });

    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(template.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('dev environment config should have correct values', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig.MinSize).toBe('1');
      expect(devConfig.MaxSize).toBe('2');
      expect(devConfig.DesiredCapacity).toBe('1');
    });

    test('staging environment config should have correct values', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig.MinSize).toBe('2');
      expect(stagingConfig.MaxSize).toBe('4');
      expect(stagingConfig.DesiredCapacity).toBe('2');
    });

    test('prod environment config should have correct values', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.MinSize).toBe('2');
      expect(prodConfig.MaxSize).toBe('10');
      expect(prodConfig.DesiredCapacity).toBe('4');
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway', () => {
      const resource = template.Resources.AttachGateway;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(resource.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(resource.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PublicSubnet1', () => {
      const resource = template.Resources.PublicSubnet1;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::Subnet');
      expect(resource.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(resource.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet2', () => {
      const resource = template.Resources.PublicSubnet2;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::Subnet');
      expect(resource.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(resource.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1', () => {
      const resource = template.Resources.PrivateSubnet1;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::Subnet');
      expect(resource.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(resource.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have PrivateSubnet2', () => {
      const resource = template.Resources.PrivateSubnet2;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::Subnet');
      expect(resource.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(resource.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have EIP1 and EIP2', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIP1.DependsOn).toBe('AttachGateway');

      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP2.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP2.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIP2.DependsOn).toBe('AttachGateway');
    });

    test('should have NATGateway1 and NATGateway2', () => {
      const nat1 = template.Resources.NATGateway1;
      expect(nat1).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });

      const nat2 = template.Resources.NATGateway2;
      expect(nat2).toBeDefined();
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have PublicRouteTable with correct route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PrivateRouteTable1 with NAT route', () => {
      const routeTable = template.Resources.PrivateRouteTable1;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.PrivateRoute1;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
    });

    test('should have PrivateRouteTable2 with NAT route', () => {
      const routeTable = template.Resources.PrivateRouteTable2;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      const route = template.Resources.PrivateRoute2;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALBSecurityGroup with correct ingress rules', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2SecurityGroup with ALB source', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should have RDSSecurityGroup with EC2 and Lambda sources', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const ec2Rule = sg.Properties.SecurityGroupIngress.find((r: any) =>
        r.SourceSecurityGroupId.Ref === 'EC2SecurityGroup'
      );
      expect(ec2Rule).toBeDefined();
      expect(ec2Rule.FromPort).toBe(5432);

      const lambdaRule = sg.Properties.SecurityGroupIngress.find((r: any) =>
        r.SourceSecurityGroupId.Ref === 'LambdaSecurityGroup'
      );
      expect(lambdaRule).toBeDefined();
      expect(lambdaRule.FromPort).toBe(5432);
    });

    test('should have LambdaSecurityGroup', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have ApplicationLoadBalancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have ALBTargetGroup with health check', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALBListener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have EC2InstanceRole with correct policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.Policies).toHaveLength(2);
      expect(role.Properties.Policies[0].PolicyName).toBe('S3Access');
      expect(role.Properties.Policies[1].PolicyName).toBe('SQSAccess');
    });

    test('should have EC2InstanceProfile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });

    test('should have LaunchTemplate with correct configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds[0]).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have AutoScalingGroup with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.TargetGroupARNs[0]).toEqual({ Ref: 'ALBTargetGroup' });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Database Resources', () => {
    test('should have DBSubnetGroup', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(sg.Properties.SubnetIds).toHaveLength(2);
      expect(sg.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(sg.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have RDSInstance with correct configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.MultiAZ).toEqual({ Ref: 'DBMultiAZ' });
    });
  });

  describe('Storage Resources', () => {
    test('should have PaymentLogsBucket with correct configuration', () => {
      const bucket = template.Resources.PaymentLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
    });

    test('should have TransactionArchiveBucket with correct configuration', () => {
      const bucket = template.Resources.TransactionArchiveBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
    });

    test('PaymentLogsBucket should have lifecycle rules', () => {
      const bucket = template.Resources.PaymentLogsBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      const transitionRule = rules.find((r: any) => r.Id === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Status).toBe('Enabled');
      expect(transitionRule.Transitions).toHaveLength(2);

      const expirationRule = rules.find((r: any) => r.Id === 'ExpireOldVersions');
      expect(expirationRule).toBeDefined();
      expect(expirationRule.Status).toBe('Enabled');
      expect(expirationRule.NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('TransactionArchiveBucket should have lifecycle rules', () => {
      const bucket = template.Resources.TransactionArchiveBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      const transitionRule = rules.find((r: any) => r.Id === 'TransitionToGlacier');
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Status).toBe('Enabled');
      expect(transitionRule.Transitions).toHaveLength(2);

      const expirationRule = rules.find((r: any) => r.Id === 'ExpireOldVersions');
      expect(expirationRule).toBeDefined();
      expect(expirationRule.NoncurrentVersionExpirationInDays).toBe(365);
    });
  });

  describe('Lambda Resources', () => {
    test('should have LambdaExecutionRole with correct policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(role.Properties.Policies[0].PolicyName).toBe('LambdaPermissions');
    });

    test('should have PaymentValidationFunction with correct configuration', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(256);
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.Environment.Variables.LOGS_BUCKET).toEqual({ Ref: 'PaymentLogsBucket' });
      expect(lambda.Properties.Environment.Variables.API_ENDPOINT).toEqual({ Ref: 'PaymentAPIEndpoint' });
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'EnvironmentType' });
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.PaymentValidationFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('import json');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
      expect(lambda.Properties.Code.ZipFile).toContain('def lambda_handler(event, context)');
    });
  });

  describe('SQS Resources', () => {
    test('should have PaymentDLQ', () => {
      const dlq = template.Resources.PaymentDLQ;
      expect(dlq).toBeDefined();
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600);
    });

    test('should have PaymentQueue with DLQ configuration', () => {
      const queue = template.Resources.PaymentQueue;
      expect(queue).toBeDefined();
      expect(queue.Type).toBe('AWS::SQS::Queue');
      expect(queue.Properties.VisibilityTimeout).toEqual({ Ref: 'SQSVisibilityTimeout' });
      expect(queue.Properties.MessageRetentionPeriod).toBe(345600);
      expect(queue.Properties.ReceiveMessageWaitTimeSeconds).toBe(20);
      expect(queue.Properties.RedrivePolicy).toBeDefined();
      expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
      expect(queue.Properties.RedrivePolicy.deadLetterTargetArn).toEqual({ 'Fn::GetAtt': ['PaymentDLQ', 'Arn'] });
    });

    test('should have LambdaEventSourceMapping', () => {
      const mapping = template.Resources.LambdaEventSourceMapping;
      expect(mapping).toBeDefined();
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      expect(mapping.Properties.EventSourceArn).toEqual({ 'Fn::GetAtt': ['PaymentQueue', 'Arn'] });
      expect(mapping.Properties.FunctionName).toEqual({ Ref: 'PaymentValidationFunction' });
      expect(mapping.Properties.BatchSize).toBe(10);
      expect(mapping.Properties.MaximumBatchingWindowInSeconds).toBe(5);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have EC2CPUAlarm', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toEqual({ Ref: 'CPUAlarmThreshold' });
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
    });

    test('should have RDSCPUAlarm', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
    });

    test('should have RDSMemoryAlarm', () => {
      const alarm = template.Resources.RDSMemoryAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeableMemory');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(1000000000);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have SQSQueueDepthAlarm', () => {
      const alarm = template.Resources.SQSQueueDepthAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ApproximateNumberOfMessagesVisible');
      expect(alarm.Properties.Namespace).toBe('AWS/SQS');
      expect(alarm.Properties.Threshold).toEqual({ Ref: 'QueueDepthAlarmThreshold' });
      expect(alarm.Properties.Dimensions[0].Name).toBe('QueueName');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export).toBeDefined();
    });

    test('should have LoadBalancerDNS output', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should have RDSEndpoint output', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
    });

    test('should have PaymentLogsBucketName output', () => {
      const output = template.Outputs.PaymentLogsBucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PaymentLogsBucket' });
    });

    test('should have TransactionArchiveBucketName output', () => {
      const output = template.Outputs.TransactionArchiveBucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'TransactionArchiveBucket' });
    });

    test('should have PaymentQueueURL output', () => {
      const output = template.Outputs.PaymentQueueURL;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PaymentQueue' });
    });

    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['PaymentValidationFunction', 'Arn'] });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include EnvironmentSuffix', () => {
      const resourcesWithNames = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && (
          resource.Properties.Name ||
          resource.Properties.QueueName ||
          resource.Properties.BucketName ||
          resource.Properties.FunctionName ||
          resource.Properties.RoleName ||
          resource.Properties.DBInstanceIdentifier ||
          resource.Properties.GroupName ||
          resource.Properties.AlarmName ||
          resource.Properties.LaunchTemplateName ||
          resource.Properties.AutoScalingGroupName ||
          resource.Properties.DBSubnetGroupName ||
          resource.Properties.InstanceProfileName
        );
      });

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const nameProperty =
          resource.Properties.Name ||
          resource.Properties.QueueName ||
          resource.Properties.BucketName ||
          resource.Properties.FunctionName ||
          resource.Properties.RoleName ||
          resource.Properties.DBInstanceIdentifier ||
          resource.Properties.GroupName ||
          resource.Properties.AlarmName ||
          resource.Properties.LaunchTemplateName ||
          resource.Properties.AutoScalingGroupName ||
          resource.Properties.DBSubnetGroupName ||
          resource.Properties.InstanceProfileName;

        if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all tags should include EnvironmentSuffix', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag && nameTag.Value && typeof nameTag.Value === 'object' && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Deletion Policies', () => {
    test('RDS instance should have Delete deletion policy', () => {
      expect(template.Resources.RDSInstance.DeletionPolicy).toBe('Delete');
    });

    test('S3 buckets should have Delete deletion policy', () => {
      expect(template.Resources.PaymentLogsBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.TransactionArchiveBucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Template Validation', () => {
    test('should be valid JSON', () => {
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
});
