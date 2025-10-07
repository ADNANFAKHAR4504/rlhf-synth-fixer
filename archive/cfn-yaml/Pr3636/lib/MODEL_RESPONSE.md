### Reasoning Trace
---

The user wants a comprehensive CloudFormation template that creates a secure, highly available web application infrastructure. Let me break down the requirements:

1. ALB with AWS WAF
2. Use existing SSL certificate (passed as parameter)
3. S3 bucket for CloudTrail logs with SSE-S3 and blocked public access
4. CloudWatch Alarms for UnauthorizedAPICall and AWSBruteForceReport
5. IAM Roles with least privilege
6. VPC with 2 AZs, public/private subnets, IGW, NAT Gateway
7. Config Rule for SSH access (but no Config Recorder)
8. S3 logging enabled
9. Security Groups properly configured
10. Production-ready template

I'll create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

# AWS CloudFormation Template: Secure Web Application Infrastructure

Below is a production-grade CloudFormation YAML template that implements all the specified requirements for a secure, highly available web application infrastructure:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, highly available web application infrastructure with ALB, WAF, CloudTrail, and monitoring'

# ==========================================
# Parameters Section
# ==========================================
Parameters:
  ProjectName:
    Type: String
    Description: 'Project name used for resource naming'
    Default: 'SecureWebApp'
    MinLength: 1
    MaxLength: 50
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters and hyphens'

  Environment:
    Type: String
    Description: 'Environment name'
    Default: 'Production'
    AllowedValues:
      - Development
      - Staging
      - Production

  VPCCidr:
    Type: String
    Description: 'CIDR block for VPC'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  SSLCertificateArn:
    Type: String
    Description: 'ARN of existing SSL certificate for HTTPS listener'
    AllowedPattern: '^arn:aws:acm:.*:.*:certificate/.*$'
    ConstraintDescription: 'Must be a valid ACM certificate ARN'

  InstanceType:
    Type: String
    Description: 'EC2 instance type'
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

  AlertEmail:
    Type: String
    Description: 'Email address for CloudWatch alerts'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

# ==========================================
# Mappings Section
# ==========================================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.11.0/24'

# ==========================================
# Resources Section
# ==========================================
Resources:

  # ==========================================
  # VPC and Networking Resources
  # ==========================================
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC'

  # Internet Gateway
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-IGW'

  AttachGateway:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicSubnet-AZ1'

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicSubnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet-AZ1'

  PrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet-AZ2'

  # Elastic IPs for NAT Gateways
  EIPForNATGateway1:
    Type: 'AWS::EC2::EIP'
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-EIP-NAT-AZ1'

  EIPForNATGateway2:
    Type: 'AWS::EC2::EIP'
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-EIP-NAT-AZ2'

  # NAT Gateways
  NATGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt EIPForNATGateway1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-AZ1'

  NATGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt EIPForNATGateway2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicRouteTable'

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateRouteTable-AZ1'

  PrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateRouteTable-AZ2'

  PrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ==========================================
  # Security Groups
  # ==========================================
  
  # ALB Security Group - Only allows HTTPS (443)
  ALBSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Application Load Balancer - HTTPS only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from anywhere'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'Allow HTTP to EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ALB-SG'

  # EC2 Security Group - Only allows traffic from ALB
  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for EC2 instances - Only from ALB'
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-EC2-SG'

  EC2SecurityGroupIngressFromALB:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      GroupId: !Ref EC2SecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80
      SourceSecurityGroupId: !Ref ALBSecurityGroup
      Description: 'Allow HTTP from ALB only'

  # ==========================================
  # S3 Buckets for Logging
  # ==========================================
  
  # S3 Bucket for CloudTrail Logs
  CloudTrailLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: 'Enabled'
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldLogs'
            Status: 'Enabled'
            ExpirationInDays: 90
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'cloudtrail-bucket-logs/'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-CloudTrailLogs'

  # S3 Bucket Policy for CloudTrail
  CloudTrailLogsBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: 'Allow'
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          - Sid: 'AWSCloudTrailWrite'
            Effect: 'Allow'
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # S3 Bucket for Access Logs
  AccessLogsBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-access-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldAccessLogs'
            Status: 'Enabled'
            ExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-AccessLogs'

  # S3 Bucket Policy for ALB Access Logs
  AccessLogsBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref AccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'ALBAccessLogsPolicy'
            Effect: 'Allow'
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 's3:PutObject'
            Resource: !Sub '${AccessLogsBucket.Arn}/*'

  # ==========================================
  # IAM Roles and Policies
  # ==========================================

  # IAM Role for EC2 Instances
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'ec2.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: 'EC2MinimalAccess'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
              - Effect: 'Allow'
                Action:
                  - 's3:GetObject'
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-${Environment}-*/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-EC2Role'

  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Path: '/'
      Roles:
        - !Ref EC2InstanceRole

  # IAM Role for CloudTrail
  CloudTrailRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-CloudTrailRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: 'CloudTrailLogPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-CloudTrailRole'

  # ==========================================
  # Application Load Balancer
  # ==========================================
  ApplicationLoadBalancer:
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-ALB'
      Type: 'application'
      Scheme: 'internet-facing'
      IpAddressType: 'ipv4'
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      LoadBalancerAttributes:
        - Key: 'idle_timeout.timeout_seconds'
          Value: '60'
        - Key: 'deletion_protection.enabled'
          Value: 'false'
        - Key: 'access_logs.s3.enabled'
          Value: 'true'
        - Key: 'access_logs.s3.bucket'
          Value: !Ref AccessLogsBucket
        - Key: 'access_logs.s3.prefix'
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ALB'

  # Target Group
  TargetGroup:
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup'
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-TG'
      Port: 80
      Protocol: 'HTTP'
      VpcId: !Ref VPC
      TargetType: 'instance'
      HealthCheckEnabled: true
      HealthCheckProtocol: 'HTTP'
      HealthCheckPath: '/'
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-TG'

  # HTTPS Listener
  HTTPSListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: 'HTTPS'
      Certificates:
        - CertificateArn: !Ref SSLCertificateArn
      DefaultActions:
        - Type: 'forward'
          TargetGroupArn: !Ref TargetGroup

  # ==========================================
  # AWS WAF
  # ==========================================
  WAFWebACL:
    Type: 'AWS::WAFv2::WebACL'
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-WebACL'
      Scope: 'REGIONAL'
      DefaultAction:
        Allow: {}
      Rules:
        - Name: 'RateLimitRule'
          Priority: 1
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: 'IP'
          Action:
            Block: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'RateLimitRule'
        - Name: 'AWSManagedRulesCommonRuleSet'
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: 'AWS'
              Name: 'AWSManagedRulesCommonRuleSet'
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'CommonRuleSetMetric'
        - Name: 'AWSManagedRulesSQLiRuleSet'
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: 'AWS'
              Name: 'AWSManagedRulesSQLiRuleSet'
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: 'SQLiRuleSetMetric'
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}-${Environment}-WebACL'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-WebACL'

  # Associate WAF with ALB
  WAFAssociation:
    Type: 'AWS::WAFv2::WebACLAssociation'
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WAFWebACL.Arn

  # ==========================================
  # EC2 Launch Template
  # ==========================================
  EC2LaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${ProjectName} ${Environment}</h1>" > /var/www/html/index.html
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
        TagSpecifications:
          - ResourceType: 'instance'
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-${Environment}-Instance'

  # ==========================================
  # Auto Scaling Group
  # ==========================================
  AutoScalingGroup:
    Type: 'AWS::AutoScaling::AutoScalingGroup'
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-${Environment}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      MinSize: '2'
      MaxSize: '4'
      DesiredCapacity: '2'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: 'ELB'
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-ASG-Instance'
          PropagateAtLaunch: true

  # ==========================================
  # CloudTrail
  # ==========================================
  CloudTrailLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-${Environment}'
      RetentionInDays: 90

  CloudTrail:
    Type: 'AWS::CloudTrail::Trail'
    DependsOn:
      - CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-Trail'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: 'All'
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${CloudTrailLogsBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Trail'

  # ==========================================
  # CloudWatch Alarms and SNS Topic
  # ==========================================
  
  # SNS Topic for Alerts
  AlertTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      TopicName: !Sub '${ProjectName}-${Environment}-SecurityAlerts'
      DisplayName: 'Security Alerts'
      Subscription:
        - Endpoint: !Ref AlertEmail
          Protocol: 'email'

  # Metric Filter for Unauthorized API Calls
  UnauthorizedAPICallsMetricFilter:
    Type: 'AWS::Logs::MetricFilter'
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterName: 'UnauthorizedAPICalls'
      FilterPattern: '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }'
      MetricTransformations:
        - MetricName: 'UnauthorizedAPICalls'
          MetricNamespace: !Sub '${ProjectName}/Security'
          MetricValue: '1'
          DefaultValue: 0

  # Alarm for Unauthorized API Calls
  UnauthorizedAPICallsAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-UnauthorizedAPICalls'
      AlarmDescription: 'Alarm for unauthorized API calls'
      MetricName: 'UnauthorizedAPICalls'
      Namespace: !Sub '${ProjectName}/Security'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: 'GreaterThanThreshold'
      TreatMissingData: 'notBreaching'
      AlarmActions:
        - !Ref AlertTopic

  # Metric Filter for Brute Force Attempts
  BruteForceMetricFilter:
    Type: 'AWS::Logs::MetricFilter'
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterName: 'BruteForceAttempts'
      FilterPattern: '{ ($.eventName = ConsoleLogin) && ($.errorMessage = "Failed authentication") }'
      MetricTransformations:
        - MetricName: 'BruteForceAttempts'
          MetricNamespace: !Sub '${ProjectName}/Security'
          MetricValue: '1'
          DefaultValue: 0

  # Alarm for Brute Force Attempts
  AWSBruteForceReportAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-AWSBruteForceReport'
      AlarmDescription: 'Alarm for potential brute force attempts'
      MetricName: 'BruteForceAttempts'
      Namespace: !Sub '${ProjectName}/Security'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: 'GreaterThanThreshold'
      TreatMissingData: 'notBreaching'
      AlarmActions:
        - !Ref AlertTopic

  # ==========================================
  # AWS Config Rule (without Recorder)
  # ==========================================
  
  # Config Rule for Unrestricted SSH Access
  UnrestrictedSSHConfigRule:
    Type: 'AWS::Config::ConfigRule'
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-${Environment}-UnrestrictedSSH'
      Description: 'Checks for unrestricted SSH access (port 22) in Security Groups'
      Source:
        Owner: 'AWS'
        SourceIdentifier: 'INCOMING_SSH_DISABLED'
      Scope:
        ComplianceResourceTypes:
          - 'AWS::EC2::SecurityGroup'

# ==========================================
# Outputs Section
# ==========================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-ID'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${ProjectName}-${Environment}-ALB-DNS'

  ALBUrl:
    Description: 'Application Load Balancer HTTPS URL'
    Value: !Sub 'https://${ApplicationLoadBalancer.DNSName}'

  CloudTrailBucket:
    Description: 'CloudTrail S3 Bucket Name'
    Value: !Ref CloudTrailLogsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-CloudTrailBucket'

  AccessLogsBucket:
    Description: 'Access Logs S3 Bucket Name'
    Value: !Ref AccessLogsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-AccessLogsBucket'

  WAFWebACLArn:
    Description: 'WAF Web ACL ARN'
    Value: !GetAtt WAFWebACL.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-WAF-ACL-ARN'

  AlertTopicArn:
    Description: 'SNS Alert Topic ARN'
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${ProjectName}-${Environment}-AlertTopic-ARN'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PrivateSubnet2-ID'
```

## Template Overview

This production-grade CloudFormation template implements all specified requirements:

### Key Features Implemented:

1. **High Availability Architecture**:
   - VPC spanning 2 Availability Zones
   - Public and private subnets in each AZ
   - Redundant NAT Gateways for fault tolerance
   - Auto Scaling Group across multiple AZs

2. **Security Best Practices**:
   - ALB with AWS WAF protection against common attacks
   - HTTPS-only traffic on ALB (port 443)
   - EC2 instances in private subnets
   - Security Groups with least privilege access
   - S3 buckets with encryption and blocked public access
   - CloudTrail for audit logging

3. **Monitoring and Compliance**:
   - CloudWatch alarms for unauthorized API calls
   - Brute force detection metrics
   - Config Rule for SSH access monitoring
   - Comprehensive logging to S3

4. **IAM Roles with Least Privilege**:
   - Separate roles for EC2, CloudTrail services
   - Minimal permissions granted
   - Instance profile for EC2 metadata access

### Deployment Instructions:

1. **Prerequisites**:
   - Valid SSL certificate ARN in ACM
   - Email address for alerts
   - AWS CLI or Console access

2. **Deploy the stack**:
```bash
aws cloudformation create-stack \
  --stack-name secure-web-app \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=SSLCertificateArn,ParameterValue=arn:aws:acm:region:account:certificate/xxx \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Verify deployment**:
   - Check CloudFormation stack status
   - Confirm email subscription for SNS alerts
   - Test ALB URL (HTTPS)
   - Verify CloudTrail logging is active

### Security Considerations:

- Regular security group audits
- Enable AWS Shield for DDoS protection
- Implement AWS Secrets Manager for credentials
- Use AWS Systems Manager for patch management
- Enable VPC Flow Logs for network monitoring
- Regular backup strategies for data persistence

This template provides a solid foundation for a secure, scalable web application infrastructure while maintaining compliance with AWS best practices.