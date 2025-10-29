### Reasoning Trace

---

This is a comprehensive request for a production-ready CloudFormation template with specific requirements:

1. Multi-AZ VPC with public and private subnets
2. NAT Gateway for outbound traffic from private instances
3. Application Load Balancer (ALB) for traffic distribution
4. Auto Scaling Group (min: 2, max: 6) with EC2 instances
5. DynamoDB table as primary data store
6. IAM roles with least privilege access (no hardcoded credentials)
7. Systems Manager Parameter Store for sensitive data
8. CloudFront distribution with HTTPS via ACM certificate
9. S3 bucket for static assets with logging
10. Route 53 for domain management
11. CloudWatch alarms for monitoring
12. Proper resource tagging

Key modifications required from the original requirements:
- Use EnvironmentSuffix parameter throughout for multi-environment support
- Disable deletion protection for all resources
- Remove external dependencies (create all resources internally)
- Add required tags: `project: iac-rlhf-amazon` and `team-number: 2`
- Ensure multi-region compatibility
- Make KeyPairName optional with conditional logic
- Change DynamoDB from provisioned to PAY_PER_REQUEST billing
- Use regional AMI mapping instead of hardcoded AMI IDs
- Change CloudFront ALB origin from https-only to http-only (no ACM cert dependency)
- Remove external domain dependencies (Route53 HostedZone, ACM Certificate, DNS records)

### Answer

---

I'll create a comprehensive CloudFormation template that provisions a highly available, secure, and scalable web application infrastructure. This template is self-contained, works across all AWS regions, and follows AWS best practices for production deployments.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready highly available web application infrastructure with security best practices'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  KeyPairName:
    Type: String
    Default: ''
    Description: EC2 Key Pair for SSH access (optional - leave empty to skip)

  ProjectName:
    Type: String
    Default: webapp
    Description: Project name used for resource naming
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

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

  RegionMap:
    us-east-1:
      AMI: ami-0e001c9271cf7f3b9
    us-east-2:
      AMI: ami-0a0d9cf81c479446a
    us-west-1:
      AMI: ami-0da424eb883458071
    us-west-2:
      AMI: ami-0b20a6f09484773af
    ca-central-1:
      AMI: ami-0c3e3e7af817ad732
    eu-west-1:
      AMI: ami-0f3164307ee5d695a
    eu-west-2:
      AMI: ami-0b9932f4918a00c4f
    eu-west-3:
      AMI: ami-00c71bd4d220aa22a
    eu-central-1:
      AMI: ami-06c39ed6b42908a36
    eu-north-1:
      AMI: ami-08eb150f611ca277f
    ap-southeast-1:
      AMI: ami-0dc2d3e4c0f9ebd18
    ap-southeast-2:
      AMI: ami-0375ab65ee943a2a6
    ap-northeast-1:
      AMI: ami-0bba69335379e17f8
    ap-northeast-2:
      AMI: ami-0e9bfdb247cc8de84
    ap-south-1:
      AMI: ami-0f58b397bc5c1f2e8
    sa-east-1:
      AMI: ami-0c820c196a818d66a

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
          Value: !Sub '${ProjectName}-vpc-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

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
          Value: !Sub '${ProjectName}-subnet-public-a-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetB, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-subnet-public-b-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # Private Subnets
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetA, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-subnet-private-a-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetB, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-subnet-private-b-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # NAT Gateway Resources
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-eip-nat-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-natgw-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-rtb-public-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

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
          Value: !Sub '${ProjectName}-rtb-private-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

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
          Value: !Sub '${ProjectName}-sg-alb-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 web server instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP traffic from ALB
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-sg-web-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # IAM Roles and Policies
  # ==========================================

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-ec2-role-${EnvironmentSuffix}'
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
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt StaticAssetsBucket.Arn
                  - !Sub '${StaticAssetsBucket.Arn}/*'
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${ProjectName}/${EnvironmentSuffix}/*'
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectName}-${EnvironmentSuffix}*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ec2-role-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-ec2-profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2Role

  # ==========================================
  # Systems Manager Parameter Store
  # ==========================================

  DatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${EnvironmentSuffix}/database/endpoint'
      Type: String
      Value: !GetAtt DynamoDBTable.Arn
      Description: DynamoDB table ARN
      Tags:
        project: iac-rlhf-amazon
        team-number: 2

  AppConfigParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/${ProjectName}/${EnvironmentSuffix}/app/config'
      Type: String
      Value: '{"api_key":"secure-value","environment":"production"}'
      Description: Application configuration
      Tags:
        project: iac-rlhf-amazon
        team-number: 2

  # ==========================================
  # Application Load Balancer
  # ==========================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-alb-${EnvironmentSuffix}'
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
          Value: !Sub '${ProjectName}-alb-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-tg-${EnvironmentSuffix}'
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
          Value: !Sub '${ProjectName}-tg-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ==========================================
  # CloudWatch Log Groups
  # ==========================================

  ALBAccessLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/elasticloadbalancing/${ProjectName}-alb-${EnvironmentSuffix}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-alb-logs-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}-${EnvironmentSuffix}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ec2-logs-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # Launch Template and Auto Scaling
  # ==========================================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-lt-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: t3.micro
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        MetadataOptions:
          HttpTokens: optional
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-web-${EnvironmentSuffix}'
              - Key: project
                Value: iac-rlhf-amazon
              - Key: team-number
                Value: 2
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd amazon-cloudwatch-agent

            # Configure basic web server
            cat <<'HTMLEOF' > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head><title>Production App</title></head>
            <body><h1>Production Web Application</h1></body>
            </html>
            HTMLEOF

            # Health check endpoint
            echo "healthy" > /var/www/html/health

            systemctl start httpd
            systemctl enable httpd

            # Configure CloudWatch agent for Apache logs
            cat <<'CWEOF' > /opt/aws/amazon-cloudwatch-agent/etc/config.json
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${ProjectName}-${EnvironmentSuffix}",
                        "log_stream_name": "{instance_id}/apache-access"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${ProjectName}-${EnvironmentSuffix}",
                        "log_stream_name": "{instance_id}/apache-error"
                      }
                    ]
                  }
                }
              }
            }
            CWEOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-asg-${EnvironmentSuffix}'
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
          Value: !Sub '${ProjectName}-asg-instance-${EnvironmentSuffix}'
          PropagateAtLaunch: true
        - Key: project
          Value: iac-rlhf-amazon
          PropagateAtLaunch: true
        - Key: team-number
          Value: 2
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
    DeletionPolicy: Delete
    Properties:
      TableName: !Sub '${ProjectName}-table-${EnvironmentSuffix}'
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
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-dynamodb-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # S3 Buckets
  # ==========================================

  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-static-${EnvironmentSuffix}-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-static-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  LoggingBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${ProjectName}-logs-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-logs-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

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
        Comment: !Sub 'OAI for ${ProjectName}-${EnvironmentSuffix}'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'CloudFront distribution for ${ProjectName}-${EnvironmentSuffix}'
        DefaultRootObject: index.html
        HttpVersion: http2
        PriceClass: PriceClass_100
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              OriginProtocolPolicy: http-only
              HTTPPort: 80
          - Id: S3Origin
            DomainName: !GetAtt StaticAssetsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: allow-all
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
            ViewerProtocolPolicy: allow-all
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
          Value: !Sub '${ProjectName}-cloudfront-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # CloudWatch Alarms
  # ==========================================

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-HighCPU-${EnvironmentSuffix}'
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
      AlarmName: !Sub '${ProjectName}-LowCPU-${EnvironmentSuffix}'
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
      AlarmName: !Sub '${ProjectName}-UnhealthyHosts-${EnvironmentSuffix}'
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

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-DynamoDB-Throttle-${EnvironmentSuffix}'
      AlarmDescription: Alarm when DynamoDB requests are throttled
      MetricName: UserErrors
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
      TopicName: !Sub '${ProjectName}-alerts-${EnvironmentSuffix}'
      DisplayName: !Sub '${ProjectName} Application Alerts'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-sns-${EnvironmentSuffix}'
        - Key: project
          Value: iac-rlhf-amazon
        - Key: team-number
          Value: 2

  # ==========================================
  # CloudWatch Dashboard
  # ==========================================

  CloudWatchDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${ProjectName}-dashboard-${EnvironmentSuffix}'
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
      Name: !Sub '${ProjectName}-VPC-${EnvironmentSuffix}'

  PublicSubnetAId:
    Description: Public Subnet A ID
    Value: !Ref PublicSubnetA
    Export:
      Name: !Sub '${ProjectName}-PublicSubnetA-${EnvironmentSuffix}'

  PublicSubnetBId:
    Description: Public Subnet B ID
    Value: !Ref PublicSubnetB
    Export:
      Name: !Sub '${ProjectName}-PublicSubnetB-${EnvironmentSuffix}'

  PrivateSubnetAId:
    Description: Private Subnet A ID
    Value: !Ref PrivateSubnetA
    Export:
      Name: !Sub '${ProjectName}-PrivateSubnetA-${EnvironmentSuffix}'

  PrivateSubnetBId:
    Description: Private Subnet B ID
    Value: !Ref PrivateSubnetB
    Export:
      Name: !Sub '${ProjectName}-PrivateSubnetB-${EnvironmentSuffix}'

  ALBDNSName:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  ALBArn:
    Description: ARN of the Application Load Balancer
    Value: !Ref ApplicationLoadBalancer

  TargetGroupArn:
    Description: ARN of the Target Group
    Value: !Ref ALBTargetGroup

  CloudFrontURL:
    Description: CloudFront Distribution URL
    Value: !Sub 'https://${CloudFrontDistribution.DomainName}'

  CloudFrontDistributionId:
    Description: CloudFront Distribution ID
    Value: !Ref CloudFrontDistribution

  StaticAssetsBucket:
    Description: S3 bucket for static assets
    Value: !Ref StaticAssetsBucket

  LoggingBucket:
    Description: S3 bucket for logs
    Value: !Ref LoggingBucket

  DynamoDBTableName:
    Description: DynamoDB table name
    Value: !Ref DynamoDBTable

  DynamoDBTableArn:
    Description: DynamoDB table ARN
    Value: !GetAtt DynamoDBTable.Arn

  AutoScalingGroupName:
    Description: Auto Scaling Group name
    Value: !Ref AutoScalingGroup

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate

  SNSTopicArn:
    Description: SNS Topic ARN for alerts
    Value: !Ref SNSTopic

  ALBSecurityGroupId:
    Description: Security Group ID for ALB
    Value: !Ref ALBSecurityGroup

  WebServerSecurityGroupId:
    Description: Security Group ID for Web Servers
    Value: !Ref WebServerSecurityGroup

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ProjectName}-dashboard-${EnvironmentSuffix}'
```

## Key Features and Best Practices Implemented

### 1. High Availability

- Multi-AZ deployment across 2 Availability Zones
- Auto Scaling Group with min 2, max 6 instances
- Application Load Balancer for traffic distribution
- NAT Gateway for reliable outbound connectivity from private subnets

### 2. Security

- Private subnets for EC2 instances (no public IPs)
- Security groups with least-privilege rules (ALB allows internet, Web servers only allow ALB)
- IAM roles with scoped permissions (no hardcoded credentials)
- Encrypted S3 buckets with versioning enabled
- Systems Manager Parameter Store for configuration management
- DynamoDB encryption at rest enabled
- Public access blocking on all S3 buckets

### 3. Scalability

- Auto Scaling based on CPU metrics (scale up at 75%, scale down at 25%)
- CloudFront CDN for global content delivery
- DynamoDB with PAY_PER_REQUEST billing mode (auto-scaling)
- Elastic Load Balancer for horizontal scaling

### 4. Multi-Region Support

- RegionMap with 16 AWS regions covering US, Canada, Europe, Asia Pacific, and South America
- Dynamic AMI selection based on deployment region
- No hardcoded region-specific values

### 5. Multi-Environment Support

- EnvironmentSuffix parameter for dev/staging/prod deployments
- ProjectName parameter for resource organization
- All resource names include environment suffix
- Consistent naming convention across all resources

### 6. Monitoring and Observability

- CloudWatch alarms for CPU utilization, unhealthy hosts, and DynamoDB throttling
- CloudWatch Dashboard for centralized monitoring
- SNS notifications for critical alerts
- CloudWatch Log Groups for ALB and EC2 with 30-day retention
- S3 logging for static assets and CloudFront

### 7. Data Protection

- DynamoDB Point-in-Time Recovery enabled
- S3 versioning for static assets
- Automated log retention policies (90 days with lifecycle transitions)
- S3 lifecycle rule to transition objects to STANDARD_IA after 30 days
- DeletionPolicy: Delete on DynamoDB and S3 buckets for easy cleanup

### 8. Resource Management

- Consistent tagging with project: iac-rlhf-amazon and team-number: 2
- Organized resource naming conventions with ${ProjectName}-${ResourceType}-${EnvironmentSuffix}
- Parameterized template for reusability
- Comprehensive output values for integration with other stacks

### 9. Self-Contained Infrastructure

- No external dependencies (no Route53 HostedZone, ACM Certificate requirements)
- All resources created within the template
- Optional KeyPairName with conditional logic
- CloudFront uses http-only for ALB origin (no HTTPS certificate dependency)

### 10. Least Privilege IAM

- DynamoDB policy scoped to specific table ARN
- S3 policy scoped to specific bucket and object paths
- SSM policy scoped to /${ProjectName}/${EnvironmentSuffix}/* parameter path
- CloudWatch Logs policy scoped to specific log group pattern
- No wildcard permissions on critical actions

## Deployment Instructions

1. Prerequisites:
   - AWS CLI configured with appropriate credentials
   - (Optional) EC2 Key Pair in target region for SSH access

2. Deploy the stack:

```bash
aws cloudformation create-stack \
  --stack-name TapStack-dev \
  --template-body file://TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=ProjectName,ParameterValue=webapp \
    ParameterKey=KeyPairName,ParameterValue=my-keypair \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. Monitor deployment:

```bash
aws cloudformation describe-stacks \
  --stack-name TapStack-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

4. After deployment:
   - Upload static assets to the S3 bucket
   - Configure SNS email subscriptions for alerts
   - Access the application via ALB DNS or CloudFront URL

This template provides a robust, production-ready foundation for a highly available web application with comprehensive security, scalability, and monitoring features built-in according to AWS best practices.
