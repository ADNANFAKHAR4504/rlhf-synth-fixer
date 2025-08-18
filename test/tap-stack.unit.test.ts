/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the Production-ready AWS infrastructure CloudFormation template
 * Tests all requirements from PROMPT.md for multi-AZ deployment with security controls
 */

import fs from 'fs';
import path from 'path';

/* Get environment from CI pipeline or default to dev */
const environment = process.env.ENVIRONMENT || 'dev';

describe('TapStack CloudFormation Template - Production AWS Infrastructure', () => {
  let template: any;

  /* Load the template once for all tests */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}. Please run: pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json`);
    }
    
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* Basic Template Structure Tests */
  describe('Template Structure', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('has correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has appropriate description', () => {
      expect(template.Description).toBe('Production-ready AWS infrastructure for scalable web application with multi-AZ redundancy');
    });

    test('has all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });
  });

  /* Parameters Validation */
  describe('Parameters', () => {
    test('Environment parameter is properly configured', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toBe('Environment name for tagging and resource naming');
    });

    test('Department parameter exists for tagging', () => {
      const param = template.Parameters.Department;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Engineering');
      expect(param.Description).toBe('Department name for tagging');
    });

    test('VPC CIDR parameters are configured', () => {
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe('10.0.3.0/24');
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe('10.0.4.0/24');
    });

    test('KeyPairName parameter for SSH access', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('EC2 Key Pair for SSH access (leave empty to disable SSH)');
    });

    test('InstanceType parameter with t3.micro default', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.Description).toContain('cost optimization');
    });

    test('Auto Scaling parameters meet requirements', () => {
      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.MaxSize.Default).toBe(6);
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
      expect(template.Parameters.DesiredCapacity.MinValue).toBe(2);
    });

    test('SSHAllowedIP parameter for security', () => {
      const param = template.Parameters.SSHAllowedIP;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Description).toContain('office IP for production');
    });

    test('AlarmEmail parameter for CloudWatch notifications', () => {
      const param = template.Parameters.AlarmEmail;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('CloudWatch alarm notifications');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('AmiId parameter uses SSM for latest AMI', () => {
      const param = template.Parameters.AmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(param.Description).toContain('automatically gets latest Amazon Linux 2');
    });
  });

  /* VPC and Networking Tests */
  describe('VPC & Networking - Multi-AZ Setup', () => {
    test('VPC resource with proper configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Internet Gateway exists and is attached', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('Public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('Private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
      
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('NAT Gateways for high availability (one per AZ)', () => {
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;

      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');

      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(nat1.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId'] });
      expect(nat2.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatGateway2EIP', 'AllocationId'] });
    });

    test('Route tables properly configured', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      const privateRoute1 = template.Resources.DefaultPrivateRoute1;
      const privateRoute2 = template.Resources.DefaultPrivateRoute2;

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      
      expect(privateRoute2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });
  });

  /* Security Groups Tests */
  describe('Security Groups - Principle of Least Privilege', () => {
    test('Application security group restricts access', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      const sshRule = ingress.find((r: any) => r.FromPort === 22);
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedIP' });
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });
      expect(httpsRule.SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });
    });

    test('LoadBalancer security group allows internet traffic', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  /* IAM Roles and Policies Tests */
  describe('IAM Roles & Policies', () => {
    test('EC2 instance role with S3 access', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      
      const s3Actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:PutObject');
      expect(s3Actions).toContain('s3:ListBucket');
    });

    test('EC2 instance role with DynamoDB access', () => {
      const role = template.Resources.EC2InstanceRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccessPolicy');
      expect(dynamoPolicy).toBeDefined();
      
      const dynamoActions = dynamoPolicy.PolicyDocument.Statement[0].Action;
      expect(dynamoActions).toContain('dynamodb:GetItem');
      expect(dynamoActions).toContain('dynamodb:PutItem');
      expect(dynamoActions).toContain('dynamodb:Query');
    });

    test('CloudWatch permissions included', () => {
      const role = template.Resources.EC2InstanceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('Instance profile configured', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  /* S3 Bucket Tests */
  describe('S3 Bucket - Storage with Encryption', () => {
    test('S3 bucket with KMS encryption', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'S3BucketKMSKey' });
    });

    test('S3 bucket versioning enabled', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket public access blocked', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket globally unique naming', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack-assets-${AWS::AccountId}-${Environment}'
      });
    });

    test('S3 bucket lifecycle configuration', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      
      expect(lifecycle.Status).toBe('Enabled');
      expect(lifecycle.NoncurrentVersionExpirationInDays).toBe(30);
    });
  });

  /* KMS Encryption Tests */
  describe('KMS Encryption Infrastructure', () => {
    test('KMS key for S3 encryption', () => {
      const key = template.Resources.S3BucketKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for S3 bucket encryption');
    });

    test('KMS key policy allows root permissions', () => {
      const key = template.Resources.S3BucketKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      
      const rootStatement = statements.find((s: any) => 
        s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement.Principal.AWS).toEqual({ 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' });
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key alias configured', () => {
      const alias = template.Resources.S3BucketKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${AWS::StackName}-s3-key'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'S3BucketKMSKey' });
    });
  });

  /* DynamoDB Tests */
  describe('DynamoDB - Application State Management', () => {
    test('DynamoDB table configured', () => {
      const table = template.Resources.ApplicationStateTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table has proper key schema', () => {
      const table = template.Resources.ApplicationStateTable;
      const keySchema = table.Properties.KeySchema;
      
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('DynamoDB point-in-time recovery enabled', () => {
      const table = template.Resources.ApplicationStateTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB server-side encryption enabled', () => {
      const table = template.Resources.ApplicationStateTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('DynamoDB table naming convention', () => {
      const table = template.Resources.ApplicationStateTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': '${AWS::StackName}-AppState-${Environment}'
      });
    });
  });

  /* Load Balancer Tests */
  describe('Application Load Balancer', () => {
    test('ALB configured as internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB spans multiple AZs', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('Target group with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('ALB listener configured', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  /* Auto Scaling Tests */
  describe('Auto Scaling Group - EC2 Instances', () => {
    test('Launch template configured', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId).toEqual({ Ref: 'AmiId' });
      expect(data.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(data.KeyName).toEqual({
        'Fn::If': [
          'HasKeyPair',
          { Ref: 'KeyPairName' },
          { Ref: 'AWS::NoValue' }
        ]
      });
      expect(data.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    });

    test('Auto Scaling Group with correct capacity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
    });

    test('ASG spans multiple AZs via subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('ASG health check configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('Scaling policies configured', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;
      
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  /* CloudWatch Monitoring Tests */
  describe('CloudWatch Monitoring & Alarms', () => {
    test('CPU utilization alarm above 80%', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Low CPU alarm for scale down', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(20);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('SNS topic and subscription for alarm notifications', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({ 'Fn::Sub': '${AWS::StackName}-AlarmTopic' });
      
      const subscription = template.Resources.SNSSubscription;
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint).toEqual({ Ref: 'AlarmEmail' });
      expect(subscription.Properties.TopicArn).toEqual({ Ref: 'SNSTopic' });
    });

    test('Alarms trigger scaling policies', () => {
      const highCPU = template.Resources.HighCPUAlarm;
      expect(highCPU.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleUpPolicy' });
      expect(highCPU.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
      
      const lowCPU = template.Resources.LowCPUAlarm;
      expect(lowCPU.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleDownPolicy' });
    });
  });

  /* CloudTrail Audit Logging Tests */
  describe('CloudTrail - Audit Logging', () => {
    test('CloudTrail S3 bucket configured', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('CloudTrail bucket policy allows CloudTrail access', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheck = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      const write = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      
      expect(aclCheck.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(write.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('CloudTrail enabled with proper configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail event selectors configured', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelector = trail.Properties.EventSelectors[0];
      expect(eventSelector.ReadWriteType).toBe('All');
      expect(eventSelector.IncludeManagementEvents).toBe(true);
    });
  });

  /* Resource Tagging Tests */
  describe('Resource Tagging - Environment & Department', () => {
    test('VPC resources have required tags', () => {
      const resourcesWithTags = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1', 'NatGateway2'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const deptTag = tags.find((t: any) => t.Key === 'Department');
          
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'Environment' });
          expect(deptTag).toBeDefined();
          expect(deptTag.Value).toEqual({ Ref: 'Department' });
        }
      });
    });

    test('Security groups have required tags', () => {
      const sgs = ['ApplicationSecurityGroup', 'LoadBalancerSecurityGroup'];
      
      sgs.forEach(sgName => {
        const sg = template.Resources[sgName];
        const tags = sg.Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const deptTag = tags.find((t: any) => t.Key === 'Department');
        
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
        expect(deptTag.Value).toEqual({ Ref: 'Department' });
      });
    });

    test('Storage resources have required tags', () => {
      const resources = ['ApplicationS3Bucket', 'ApplicationStateTable'];
      
      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const deptTag = tags.find((t: any) => t.Key === 'Department');
        
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
        expect(deptTag.Value).toEqual({ Ref: 'Department' });
      });
    });
  });

  /* Outputs Tests */
  describe('Stack Outputs', () => {
    test('VPC outputs configured', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID'
      });
    });

    test('Load Balancer outputs configured', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('S3 bucket output configured', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'ApplicationS3Bucket' });
    });

    test('DynamoDB table output configured', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({ Ref: 'ApplicationStateTable' });
    });

    test('CloudTrail output configured', () => {
      expect(template.Outputs.CloudTrailName).toBeDefined();
      expect(template.Outputs.CloudTrailName.Value).toEqual({ Ref: 'CloudTrail' });
    });

    test('All outputs have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  /* Security Best Practices Tests */
  describe('Security Best Practices Validation', () => {
    test('No hardcoded credentials or secrets', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/password/i);
      expect(templateString).not.toMatch(/secret/i);
      expect(templateString).not.toMatch(/api[_-]?key/i);
    });

    test('EC2 instances in private subnets only', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('All storage encrypted', () => {
      const s3 = template.Resources.ApplicationS3Bucket;
      const dynamodb = template.Resources.ApplicationStateTable;
      const cloudtrailBucket = template.Resources.CloudTrailS3Bucket;
      
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(dynamodb.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(cloudtrailBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('Public access blocked on all S3 buckets', () => {
      const buckets = ['ApplicationS3Bucket', 'CloudTrailS3Bucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  /* Requirements Compliance Tests */
  describe('PROMPT.md Requirements Compliance', () => {
    test('Uses SSM parameter for latest AMI (region-agnostic)', () => {
      const amiParam = template.Parameters.AmiId;
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('Multi-AZ redundancy implemented', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;
      
      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
    });

    test('Minimum 2 EC2 instances requirement', () => {
      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
      expect(template.Parameters.DesiredCapacity.MinValue).toBe(2);
    });

    test('t3.micro instance type as default', () => {
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
    });

    test('S3 bucket meets all requirements', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('CloudWatch CPU monitoring at 80% threshold', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('CloudTrail enabled for audit logging', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('DynamoDB with backup enabled', () => {
      const table = template.Resources.ApplicationStateTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('Environment and Department tags on all resources', () => {
      const criticalResources = [
        'VPC', 'ApplicationS3Bucket', 'ApplicationStateTable',
        'ApplicationLoadBalancer', 'CloudTrail'
      ];
      
      criticalResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasEnvTag = tags.some((t: any) => t.Key === 'Environment');
          const hasDeptTag = tags.some((t: any) => t.Key === 'Department');
          expect(hasEnvTag).toBe(true);
          expect(hasDeptTag).toBe(true);
        }
      });
    });
  });
});