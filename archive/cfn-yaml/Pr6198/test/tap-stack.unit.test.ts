import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Template Structure ====================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure and Highly Available Web Application with AWS Best Practices'
      );
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

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
    });
  });

  // ==================== Parameters ====================
  describe('Parameters', () => {
    test('should have ProjectName parameter with correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tapstack');
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
    });

    test('should have KeyPairName parameter with correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have LatestAmiId parameter with SSM parameter type', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should have AdminEmail parameter with email validation', () => {
      const param = template.Parameters.AdminEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin@example.com');
      expect(param.AllowedPattern).toContain('@');
    });

    test('should have CreateNATGateways parameter with boolean values', () => {
      const param = template.Parameters.CreateNATGateways;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('false');
    });

    test('should have CreateAWSConfig parameter with boolean values', () => {
      const param = template.Parameters.CreateAWSConfig;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('false');
    });
  });

  // ==================== Conditions ====================
  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have ShouldCreateNATGateways condition', () => {
      expect(template.Conditions.ShouldCreateNATGateways).toBeDefined();
    });

    test('should have ShouldCreateAWSConfig condition', () => {
      expect(template.Conditions.ShouldCreateAWSConfig).toBeDefined();
    });
  });

  // ==================== Mappings ====================
  describe('Mappings', () => {
    test('should have SubnetConfig mapping with VPC CIDR', () => {
      const mapping = template.Mappings.SubnetConfig;
      expect(mapping).toBeDefined();
      expect(mapping.VPC.CIDR).toBe('10.0.0.0/16');
    });

    test('should have public subnet mappings', () => {
      const mapping = template.Mappings.SubnetConfig;
      expect(mapping.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(mapping.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
    });

    test('should have private subnet mappings', () => {
      const mapping = template.Mappings.SubnetConfig;
      expect(mapping.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(mapping.PrivateSubnet2.CIDR).toBe('10.0.11.0/24');
    });
  });

  // ==================== VPC and Networking Resources ====================
  describe('VPC Resources', () => {
    test('should have VPC resource with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toBeDefined();
      expect(vpc.Properties.Tags.find((t: any) => t.Key === 'Environment').Value).toBe('Production');
    });

    test('should have Internet Gateway resource', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Properties.Tags).toBeDefined();
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toBeDefined();
      expect(attachment.Properties.InternetGatewayId).toBeDefined();
    });

    test('should have two public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway resources with conditions', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;

      expect(nat1).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Condition).toBe('ShouldCreateNATGateways');

      expect(nat2).toBeDefined();
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Condition).toBe('ShouldCreateNATGateways');
    });

    test('should have EIP resources for NAT Gateways', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(eip1).toBeDefined();
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip1.DependsOn).toBe('AttachGateway');

      expect(eip2).toBeDefined();
      expect(eip2.Type).toBe('AWS::EC2::EIP');
    });

    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicRoute;

      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should have private route tables', () => {
      const rt1 = template.Resources.PrivateRouteTable1;
      const rt2 = template.Resources.PrivateRouteTable2;

      expect(rt1).toBeDefined();
      expect(rt1.Type).toBe('AWS::EC2::RouteTable');

      expect(rt2).toBeDefined();
      expect(rt2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
    });

    test('should have S3 VPC Endpoint', () => {
      const endpoint = template.Resources.S3VPCEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.RouteTableIds).toBeDefined();
      expect(endpoint.Properties.RouteTableIds.length).toBe(3);
      expect(endpoint.Properties.PolicyDocument).toBeDefined();
    });
  });

  // ==================== Security Groups ====================
  describe('Security Groups', () => {
    test('should have ALB Security Group with HTTP and HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for Application Load Balancer');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServer Security Group with ALB source', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });
    });

    test('should have Lambda Security Group with HTTPS egress', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupEgress[0].FromPort).toBe(443);
      expect(sg.Properties.SecurityGroupEgress[0].ToPort).toBe(443);
    });
  });

  // ==================== IAM Roles ====================
  describe('IAM Roles', () => {
    test('should have EC2 Instance Role with correct trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 Role with S3 and DynamoDB policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.Policies).toHaveLength(2);

      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccessPolicy');

      expect(s3Policy).toBeDefined();
      expect(dynamoPolicy).toBeDefined();
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toHaveLength(1);
    });

    test('should have Lambda Execution Role with VPC access', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('should have CloudTrail Role', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should have Config Role with condition', () => {
      const role = template.Resources.ConfigRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('ShouldCreateAWSConfig');
    });
  });

  // ==================== S3 Buckets ====================
  describe('S3 Buckets', () => {
    test('should have Application S3 Bucket with encryption and versioning', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have Application Bucket with public access blocked', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have Application Bucket with lifecycle configuration', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('should have Application Bucket with logging', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('app-bucket-logs/');
    });

    test('should have CloudTrail S3 Bucket', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have CloudTrail Bucket Policy with correct permissions', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);

      const aclCheck = policy.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      const write = policy.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

      expect(aclCheck).toBeDefined();
      expect(write).toBeDefined();
    });

    test('should have Config S3 Bucket', () => {
      const bucket = template.Resources.ConfigS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have Config Bucket Policy', () => {
      const policy = template.Resources.ConfigS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(3);
    });

    test('should have Logging S3 Bucket', () => {
      const bucket = template.Resources.LoggingS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.OwnershipControls).toBeDefined();
    });

    test('should have Logging Bucket Policy', () => {
      const policy = template.Resources.LoggingS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  // ==================== DynamoDB ====================
  describe('DynamoDB Table', () => {
    test('should have DynamoDB table with correct configuration', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct key schema', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Properties.KeySchema).toHaveLength(2);

      const hashKey = table.Properties.KeySchema.find((k: any) => k.KeyType === 'HASH');
      const rangeKey = table.Properties.KeySchema.find((k: any) => k.KeyType === 'RANGE');

      expect(hashKey.AttributeName).toBe('id');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('should have attribute definitions', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(2);

      const idAttr = table.Properties.AttributeDefinitions.find((a: any) => a.AttributeName === 'id');
      const timestampAttr = table.Properties.AttributeDefinitions.find((a: any) => a.AttributeName === 'timestamp');

      expect(idAttr.AttributeType).toBe('S');
      expect(timestampAttr.AttributeType).toBe('N');
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have encryption enabled', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have streams enabled', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  // ==================== Lambda Function ====================
  describe('Lambda Function', () => {
    test('should have Lambda function with correct configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('should have VPC configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('should have environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
    });

    test('should have inline code', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('import json');
      expect(lambda.Properties.Code.ZipFile).toContain('import boto3');
    });
  });

  // ==================== Load Balancer ====================
  describe('Application Load Balancer', () => {
    test('should have ALB with correct configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.SecurityGroups).toHaveLength(1);
    });

    test('should have Target Group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('should have health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  // ==================== Auto Scaling ====================
  describe('Auto Scaling Group', () => {
    test('should have Launch Template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have Launch Template with IAM Instance Profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });

    test('should have Launch Template with conditional KeyName', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.KeyName).toBeDefined();
    });

    test('should have Auto Scaling Group with correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have ASG with health check configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should have ASG in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('should have Scaling Policy', () => {
      const policy = template.Resources.ScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70);
    });
  });

  // ==================== WAF ====================
  describe('AWS WAF', () => {
    test('should have Web ACL with correct configuration', () => {
      const webacl = template.Resources.WebACL;
      expect(webacl).toBeDefined();
      expect(webacl.Type).toBe('AWS::WAFv2::WebACL');
      expect(webacl.Properties.Scope).toBe('REGIONAL');
      expect(webacl.Properties.DefaultAction.Allow).toBeDefined();
    });

    test('should have rate limit rule', () => {
      const webacl = template.Resources.WebACL;
      const rateLimitRule = webacl.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Priority).toBe(1);
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('should have AWS managed rule sets', () => {
      const webacl = template.Resources.WebACL;
      const commonRuleSet = webacl.Properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      const badInputsRuleSet = webacl.Properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet');
      const ipReputationList = webacl.Properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesAmazonIpReputationList');

      expect(commonRuleSet).toBeDefined();
      expect(badInputsRuleSet).toBeDefined();
      expect(ipReputationList).toBeDefined();
    });

    test('should have WebACL Association', () => {
      const association = template.Resources.WebACLAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  // ==================== CloudWatch & Monitoring ====================
  describe('CloudWatch Logs and Alarms', () => {
    test('should have CloudTrail Log Group', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('should have High CPU Alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have Unhealthy Host Alarm', () => {
      const alarm = template.Resources.UnhealthyHostAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Threshold).toBe(0);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  // ==================== CloudTrail ====================
  describe('CloudTrail', () => {
    test('should have CloudTrail with correct configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have event selectors for S3 and DynamoDB', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EventSelectors).toHaveLength(1);
      expect(trail.Properties.EventSelectors[0].DataResources).toHaveLength(2);
    });

    test('should have CloudWatch Logs integration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(trail.Properties.CloudWatchLogsRoleArn).toBeDefined();
    });
  });

  // ==================== AWS Config ====================
  describe('AWS Config', () => {
    test('should have Config Recorder with condition', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Condition).toBe('ShouldCreateAWSConfig');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have Config Delivery Channel', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Condition).toBe('ShouldCreateAWSConfig');
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });

    test('should have Required Tags Config Rule', () => {
      const rule = template.Resources.RequiredTagsRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Condition).toBe('ShouldCreateAWSConfig');
      expect(rule.Properties.Source.SourceIdentifier).toBe('REQUIRED_TAGS');
      expect(rule.DependsOn).toBe('ConfigRecorder');
    });

    test('should have S3 Bucket Encryption Config Rule', () => {
      const rule = template.Resources.S3BucketEncryptionRule;
      expect(rule).toBeDefined();
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });

    test('should have MFA Enabled Config Rule', () => {
      const rule = template.Resources.MFAEnabledRule;
      expect(rule).toBeDefined();
      expect(rule.Properties.Source.SourceIdentifier).toBe('MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS');
    });
  });

  // ==================== SNS ====================
  describe('SNS Topic', () => {
    test('should have SNS Topic with email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should have SNS Topic Policy', () => {
      const policy = template.Resources.SNSTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(1);
    });
  });

  // ==================== Outputs ====================
  describe('Outputs', () => {
    test('should have LoadBalancerURL output', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output).toBeDefined();
      expect(output.Description).toContain('URL');
      expect(output.Export).toBeDefined();
    });

    test('should have ApplicationS3BucketName output', () => {
      const output = template.Outputs.ApplicationS3BucketName;
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have DynamoDBTableName output', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have all security group outputs', () => {
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.LambdaSecurityGroupId).toBeDefined();
    });

    test('should have all subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have all S3 bucket outputs', () => {
      expect(template.Outputs.ApplicationS3BucketName).toBeDefined();
      expect(template.Outputs.CloudTrailS3BucketName).toBeDefined();
      expect(template.Outputs.LoggingS3BucketName).toBeDefined();
    });
  });

  // ==================== Resource Dependencies ====================
  describe('Resource Dependencies', () => {
    test('should have correct dependencies for NAT Gateway EIPs', () => {
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;
      expect(eip1.DependsOn).toBe('AttachGateway');
      expect(eip2.DependsOn).toBe('AttachGateway');
    });

    test('should have correct dependencies for public route', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should have correct dependencies for CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toContain('CloudTrailS3BucketPolicy');
    });

    test('should have correct dependencies for Config Rules', () => {
      const rule1 = template.Resources.RequiredTagsRule;
      const rule2 = template.Resources.S3BucketEncryptionRule;
      const rule3 = template.Resources.MFAEnabledRule;

      expect(rule1.DependsOn).toBe('ConfigRecorder');
      expect(rule2.DependsOn).toBe('ConfigRecorder');
      expect(rule3.DependsOn).toBe('ConfigRecorder');
    });
  });

  // ==================== Tags ====================
  describe('Resource Tags', () => {
    test('should have Production environment tag on VPC', () => {
      const vpc = template.Resources.VPC;
      const envTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('should have tags on all major resources', () => {
      const resourcesToCheck = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'ALBSecurityGroup',
        'ApplicationS3Bucket',
        'ApplicationDynamoDBTable',
        'LambdaFunction',
        'ApplicationLoadBalancer',
        'SNSTopic',
        'WebACL'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
      });
    });
  });

  // ==================== Security Best Practices ====================
  describe('Security Best Practices', () => {
    test('should have encryption on all S3 buckets', () => {
      const buckets = [
        'ApplicationS3Bucket',
        'CloudTrailS3Bucket',
        'ConfigS3Bucket',
        'LoggingS3Bucket'
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('should have public access blocked on all S3 buckets', () => {
      const buckets = [
        'ApplicationS3Bucket',
        'CloudTrailS3Bucket',
        'ConfigS3Bucket',
        'LoggingS3Bucket'
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

    test('should have encryption enabled on DynamoDB table', () => {
      const table = template.Resources.ApplicationDynamoDBTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have SNS topic encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('should have log file validation enabled on CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });
});
