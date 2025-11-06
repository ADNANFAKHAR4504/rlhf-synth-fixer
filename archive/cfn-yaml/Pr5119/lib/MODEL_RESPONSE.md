### Reasoning Trace

---

This is a comprehensive request for a production-ready CloudFormation template. I need to create a well-structured YAML template that includes:

1. VPC with multi-AZ setup
2. Public and private subnets
3. NAT Gateway for outbound traffic from private instances
4. Application Load Balancer (ALB)
5. EC2 instances with Auto Scaling Group (min: 2, max: 6)
6. DynamoDB table with backup
7. IAM roles with least privilege
8. Systems Manager Parameter Store for secrets
9. CloudFront distribution with HTTPS (ACM certificate)
10. S3 bucket for static assets with logging
11. Route 53 for DNS
12. CloudWatch alarms for monitoring
13. Proper tagging (Environment: Production)

Let me create a comprehensive CloudFormation template that follows AWS best practices.

### Answer

---

I'll create a comprehensive CloudFormation template that provisions a highly available, secure, and scalable web application infrastructure. This template follows AWS best practices for production deployments.

## web_application_stack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready highly available web application infrastructure with security best practices'

Parameters:
  DomainName:
    Type: String
    Description: Domain name for the application (e.g., example.com)
    AllowedPattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
    ConstraintDescription: Must be a valid domain name

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
    ConstraintDescription: Must be the name of an existing EC2 KeyPair

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnetA:
      CIDR: '10.0.1.0/24'
    PublicSubnetB:
      CIDR: '10.0.2.0/24'
    PrivateSubnetA:
      CIDR: '10.0.10.0/24'
    PrivateSubnetB:
      CIDR: '10.0.11.0/24'

Resources:
  # ==========================================
  # VPC and Networking Resources
  # ==========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetA, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet-A'
        - Key: Environment
          Value: Production

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetB, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet-B'
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetA, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet-A'
        - Key: Environment
          Value: Production

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetB, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet-B'
        - Key: Environment
          Value: Production

  # NAT Gateway Resources
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP'
        - Key: Environment
          Value: Production

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable'
        - Key: Environment
          Value: Production

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTable

  # ==========================================
  # Security Groups
  # ==========================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP traffic
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'
        - Key: Environment
          Value: Production

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow traffic from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS traffic from ALB
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'
        - Key: Environment
          Value: Production

  # ==========================================
  # IAM Roles and Policies
  # ==========================================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:DeleteItem
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${StaticAssetsBucket.Arn}/*'
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${AWS::StackName}/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-Role'
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # ==========================================
  # Systems Manager Parameter Store
  # ==========================================

  DatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}/database/endpoint'
      Type: String
      Value: !GetAtt DynamoDBTable.Arn
      Description: DynamoDB table ARN
      Tags:
        Environment: Production

  AppConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${AWS::StackName}/app/config'
      Type: SecureString
      Value: '{"api_key":"secure-value","environment":"production"}'
      Description: Application configuration
      Tags:
        Environment: Production

  # ==========================================
  # Application Load Balancer
  # ==========================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'
        - Key: Environment
          Value: Production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TG'
        - Key: Environment
          Value: Production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificate
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ==========================================
  # Launch Template and Auto Scaling
  # ==========================================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t3.medium
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-WebServer'
              - Key: Environment
                Value: Production
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Configure basic web server
            cat <<EOF > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head><title>Production App</title></head>
            <body><h1>Production Web Application</h1></body>
            </html>
            EOF

            # Health check endpoint
            cat <<EOF > /var/www/html/health
            healthy
            EOF

            systemctl start httpd
            systemctl enable httpd

            # Install AWS CLI and configure region
            aws configure set region ${AWS::Region}

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # ==========================================
  # DynamoDB Table
  # ==========================================

  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-ApplicationData'
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DynamoDB'
        - Key: Environment
          Value: Production

  # ==========================================
  # S3 Buckets
  # ==========================================

  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-static-assets-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: static-assets/
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-StaticAssets'
        - Key: Environment
          Value: Production

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Logs'
        - Key: Environment
          Value: Production

  StaticAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticAssetsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontOAI
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'
            Action: s3:GetObject
            Resource: !Sub '${StaticAssetsBucket.Arn}/*'

  # ==========================================
  # CloudFront Distribution
  # ==========================================

  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${AWS::StackName}'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront distribution for ${AWS::StackName}'
        DefaultRootObject: index.html
        HttpVersion: http2
        PriceClass: PriceClass_100
        Aliases:
          - !Ref DomainName
          - !Sub 'www.${DomainName}'
        ViewerCertificate:
          AcmCertificateArn: !Ref ACMCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
          - Id: S3Origin
            DomainName: !GetAtt StaticAssetsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          ForwardedValues:
            QueryString: true
            Headers:
              - Host
              - Origin
              - Referer
            Cookies:
              Forward: all
        CacheBehaviors:
          - PathPattern: /static/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods:
              - GET
              - HEAD
            CachedMethods:
              - GET
              - HEAD
            Compress: true
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
        Logging:
          Bucket: !GetAtt LoggingBucket.DomainName
          Prefix: cloudfront/
          IncludeCookies: false
        Tags:
          - Key: Name
            Value: !Sub '${AWS::StackName}-CloudFront'
          - Key: Environment
            Value: Production

  # ==========================================
  # ACM Certificate
  # ==========================================

  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub 'www.${DomainName}'
        - !Sub '*.${DomainName}'
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref HostedZone
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Certificate'
        - Key: Environment
          Value: Production

  # ==========================================
  # Route 53
  # ==========================================

  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${AWS::StackName}'
      HostedZoneTags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-HostedZone'
        - Key: Environment
          Value: Production

  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        HostedZoneId: Z2FDTNDATAQYW2 # CloudFront Hosted Zone ID
        DNSName: !GetAtt CloudFrontDistribution.DomainName

  WWWDNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'www.${DomainName}'
      Type: A
      AliasTarget:
        HostedZoneId: Z2FDTNDATAQYW2 # CloudFront Hosted Zone ID
        DNSName: !GetAtt CloudFrontDistribution.DomainName

  # ==========================================
  # CloudWatch Alarms
  # ==========================================

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Alarm when CPU exceeds 75% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref SNSTopic

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-LowCPU'
      AlarmDescription: Alarm when CPU is below 25% for 10 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  UnHealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnhealthyHosts'
      AlarmDescription: Alarm when we have unhealthy hosts
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
      AlarmActions:
        - !Ref SNSTopic

  DynamoDBReadThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DynamoDB-ReadThrottle'
      AlarmDescription: Alarm when DynamoDB read capacity is throttled
      MetricName: ReadThrottleEvents
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref DynamoDBTable
      AlarmActions:
        - !Ref SNSTopic

  # ==========================================
  # SNS Topic for Notifications
  # ==========================================

  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Alerts'
      DisplayName: Production Application Alerts
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-SNS'
        - Key: Environment
          Value: Production

  SNSEmailSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SNSTopic
      Endpoint: admin@example.com # Replace with actual email

  # ==========================================
  # CloudWatch Dashboard
  # ==========================================

  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-Dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average", "label": "EC2 CPU"}],
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average", "label": "Response Time"}],
                  ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum", "label": "Request Count"}],
                  ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum", "label": "DynamoDB Read"}],
                  ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", {"stat": "Sum", "label": "DynamoDB Write"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Application Metrics"
              }
            }
          ]
        }

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ALBDNSName:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  CloudFrontURL:
    Description: CloudFront Distribution URL
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'

  StaticAssetsBucket:
    Description: S3 bucket for static assets
    Value: !Ref StaticAssetsBucket

  DynamoDBTableName:
    Description: DynamoDB table name
    Value: !Ref DynamoDBTable

  HostedZoneId:
    Description: Route53 Hosted Zone ID
    Value: !Ref HostedZone

  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref SNSTopic

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}-Dashboard'
```

## Key Features and Best Practices Implemented

### 1. **High Availability**

- Multi-AZ deployment across 2 Availability Zones
- Auto Scaling Group with min 2, max 6 instances
- Application Load Balancer for traffic distribution
- NAT Gateway for reliable outbound connectivity

### 2. **Security**

- Private subnets for EC2 instances
- Security groups with least-privilege rules
- IAM roles instead of hardcoded credentials
- Encrypted S3 buckets with versioning
- Systems Manager Parameter Store for secrets
- TLS 1.2+ enforcement on CloudFront
- DynamoDB encryption at rest

### 3. **Scalability**

- Auto Scaling based on CPU metrics
- CloudFront CDN for global content delivery
- DynamoDB with provisioned throughput
- Elastic Load Balancer for horizontal scaling

### 4. **Monitoring and Observability**

- CloudWatch alarms for CPU, unhealthy hosts, and DynamoDB throttling
- CloudWatch Dashboard for centralized monitoring
- SNS notifications for critical alerts
- Comprehensive logging to S3

### 5. **Data Protection**

- DynamoDB Point-in-Time Recovery enabled
- S3 versioning for static assets
- Automated log retention policies
- Backup strategies in place

### 6. **Resource Management**

- Consistent tagging with `Environment: Production`
- Organized resource naming conventions
- Parameterized template for reusability
- Clear output values for integration

## Deployment Instructions

1. **Prerequisites:**
   - AWS CLI configured with appropriate credentials
   - Existing EC2 Key Pair in us-east-1
   - Valid domain name for the application

2. **Deploy the stack:**

```bash
aws cloudformation create-stack \
  --stack-name production-web-app \
  --template-body file://web_application_stack.yaml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=yourdomain.com \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. **Monitor deployment:**

```bash
aws cloudformation describe-stacks \
  --stack-name production-web-app \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

4. **After deployment:**
   - Update SNS email subscription with actual email address
   - Upload static assets to the S3 bucket
   - Configure application code on EC2 instances
   - Update DNS nameservers if using external domain registrar

This template provides a robust foundation for a production web application with all the necessary security, scalability, and monitoring features built-in according to AWS best practices.
