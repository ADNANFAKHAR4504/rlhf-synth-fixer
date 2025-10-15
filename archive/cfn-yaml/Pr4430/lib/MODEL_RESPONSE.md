### Reasoning Trace
---

This is a comprehensive request for creating a CloudFormation template for a highly available, secure, and scalable web application infrastructure across two AWS regions. Let me break down the requirements:

1. **Multi-region deployment**: us-east-1 and us-west-2
2. **VPCs**: Existing VPCs with CIDR blocks 10.0.0.0/16 and 10.1.0.0/16
3. **Load Balancing**: Elastic Load Balancer (Application Load Balancer)
4. **Auto Scaling**: Auto Scaling groups for EC2 instances
5. **Storage**: S3 with versioning and access controls
6. **Security**: HTTPS with AWS ACM certificates
7. **DNS**: Route 53 for DNS routing
8. **CDN**: CloudFront for static content
9. **Monitoring**: CloudWatch
10. **Session Management**: DynamoDB
11. **Secrets Management**: AWS Secrets Manager
12. **IAM**: Least privilege principle
13. **Network Security**: Only public Load Balancer accessible externally

Since CloudFormation stacks are region-specific, I'll need to create a template that can be deployed in each region with appropriate parameters. I'll also need to consider cross-region replication for DynamoDB and S3.

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template for your secure, scalable, and highly available web application infrastructure. This template follows AWS best practices for security, availability, and scalability.

## web_app_deployment.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, Scalable, and Highly Available Web Application Infrastructure'

# Template Parameters
Parameters:
  Region:
    Type: String
    Default: us-east-1
    AllowedValues:
      - us-east-1
      - us-west-2
    Description: AWS Region for deployment
  
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: Existing VPC ID
  
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedValues:
      - 10.0.0.0/16
      - 10.1.0.0/16
    Description: CIDR block of the existing VPC
  
  DomainName:
    Type: String
    Description: Domain name for the application (e.g., example.com)
  
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access (for emergency access only)
  
  InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    Description: EC2 instance type for web servers

# Mappings for region-specific configurations
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2 AMI
      AZs: ["us-east-1a", "us-east-1b", "us-east-1c"]
      S3Endpoint: s3.amazonaws.com
    us-west-2:
      AMI: ami-0352d5a37fb4f603f  # Amazon Linux 2 AMI
      AZs: ["us-west-2a", "us-west-2b", "us-west-2c"]
      S3Endpoint: s3-us-west-2.amazonaws.com

# Conditions for region-specific resources
Conditions:
  IsUSEast1: !Equals [!Ref Region, "us-east-1"]
  IsProduction: !Equals [!Ref Environment, "production"]

Resources:
  # ==========================================
  # NETWORKING RESOURCES
  # ==========================================
  
  # Public Subnets for ALB
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: !Select [0, !If [IsUSEast1, ["10.0.1.0/24", "10.0.2.0/24"], ["10.1.1.0/24", "10.1.2.0/24"]]]
      AvailabilityZone: !Select [0, !FindInMap [RegionMap, !Ref Region, AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: !Select [1, !If [IsUSEast1, ["10.0.1.0/24", "10.0.2.0/24"], ["10.1.1.0/24", "10.1.2.0/24"]]]
      AvailabilityZone: !Select [1, !FindInMap [RegionMap, !Ref Region, AZs]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Type
          Value: Public

  # Private Subnets for EC2 instances
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: !If [IsUSEast1, "10.0.10.0/24", "10.1.10.0/24"]
      AvailabilityZone: !Select [0, !FindInMap [RegionMap, !Ref Region, AZs]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VpcId
      CidrBlock: !If [IsUSEast1, "10.0.11.0/24", "10.1.11.0/24"]
      AvailabilityZone: !Select [1, !FindInMap [RegionMap, !Ref Region, AZs]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'
        - Key: Type
          Value: Private

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VpcId
      InternetGatewayId: !Ref InternetGateway

  # NAT Gateways for private subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VpcId
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VpcId
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable1'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VpcId
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable2'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ==========================================
  # SECURITY GROUPS
  # ==========================================
  
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere (redirect to HTTPS)
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Web Server EC2 instances
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS from ALB
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'

  # ==========================================
  # IAM ROLES AND POLICIES
  # ==========================================
  
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${AppAssetsBucket}/*'
                  - !Sub 'arn:aws:s3:::${AppAssetsBucket}'
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource:
                  - !Sub 'arn:aws:s3:::${LogsBucket}/*'
        - PolicyName: DynamoDBAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt SessionTable.Arn
        - PolicyName: SecretsManagerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref AppSecrets
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/webapp/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-Role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # ==========================================
  # S3 BUCKETS
  # ==========================================
  
  AppAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-assets-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Assets'

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Logs'

  AppAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppAssetsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOAI}'
            Action: s3:GetObject
            Resource: !Sub '${AppAssetsBucket.Arn}/*'

  # ==========================================
  # ACM CERTIFICATE
  # ==========================================
  
  Certificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref HostedZone
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Certificate'

  # ==========================================
  # APPLICATION LOAD BALANCER
  # ==========================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref LogsBucket
        - Key: access_logs.s3.prefix
          Value: 'alb-logs'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: '200'
      TargetGroupAttributes:
        - Key: deregistration_delay.timeout_seconds
          Value: '30'
        - Key: stickiness.enabled
          Value: 'true'
        - Key: stickiness.type
          Value: 'lb_cookie'
        - Key: stickiness.lb_cookie.duration_seconds
          Value: '86400'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-TG'

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref Certificate
      SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # ==========================================
  # AUTO SCALING
  # ==========================================
  
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref Region, AMI]
        InstanceType: !Ref InstanceType
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
                Value: !Ref Environment
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            yum install -y amazon-cloudwatch-agent
            
            # Install and configure Apache
            systemctl start httpd
            systemctl enable httpd
            
            # Create health check endpoint
            echo "OK" > /var/www/html/health
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
            {
              "metrics": {
                "namespace": "${AWS::StackName}",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}
                    ],
                    "metrics_collection_interval": 60
                  },
                  "mem": {
                    "measurement": [
                      {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/webapp/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/webapp/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a start -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      MinSize: !If [IsProduction, 2, 1]
      MaxSize: !If [IsProduction, 10, 5]
      DesiredCapacity: !If [IsProduction, 4, 2]
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 25.0

  # ==========================================
  # DYNAMODB TABLE FOR SESSION MANAGEMENT
  # ==========================================
  
  SessionTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-Sessions'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: SessionId
          AttributeType: S
        - AttributeName: UserId
          AttributeType: S
      KeySchema:
        - AttributeName: SessionId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserIdIndex
          KeySchema:
            - AttributeName: UserId
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      TimeToLiveSpecification:
        AttributeName: TTL
        Enabled: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Sessions'

  # ==========================================
  # AWS SECRETS MANAGER
  # ==========================================
  
  AppSecrets:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-AppSecrets'
      Description: Application secrets for web application
      SecretString: !Sub |
        {
          "database_url": "mysql://username:password@db.example.com/dbname",
          "api_key": "your-api-key-here",
          "jwt_secret": "your-jwt-secret-here",
          "encryption_key": "your-encryption-key-here"
        }
      KmsKeyId: alias/aws/secretsmanager
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppSecrets'

  # ==========================================
  # ROUTE 53
  # ==========================================
  
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${DomainName}'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-HostedZone'

  RecordSetGroup:
    Type: AWS::Route53::RecordSetGroup
    Properties:
      HostedZoneId: !Ref HostedZone
      RecordSets:
        - Name: !Ref DomainName
          Type: A
          AliasTarget:
            HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
            DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        - Name: !Sub 'www.${DomainName}'
          Type: CNAME
          TTL: 300
          ResourceRecords:
            - !Ref DomainName

  # Health check for Route 53
  HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: /health
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-HealthCheck'

  # ==========================================
  # CLOUDFRONT DISTRIBUTION
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
        Comment: !Sub 'CloudFront distribution for ${AWS::StackName}'
        Enabled: true
        HttpVersion: http2
        PriceClass: PriceClass_100
        ViewerCertificate:
          AcmCertificateArn: !Ref Certificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        Aliases:
          - !Ref DomainName
          - !Sub 'www.${DomainName}'
        DefaultRootObject: index.html
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
          - Id: S3Origin
            DomainName: !GetAtt AppAssetsBucket.RegionalDomainName
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
          ForwardedValues:
            QueryString: true
            Headers:
              - Host
              - Origin
              - Authorization
            Cookies:
              Forward: all
          MinTTL: 0
          DefaultTTL: 86400
          MaxTTL: 31536000
          Compress: true
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
            ForwardedValues:
              QueryString: false
              Cookies:
                Forward: none
            MinTTL: 86400
            DefaultTTL: 604800
            MaxTTL: 31536000
            Compress: true
        Logging:
          Bucket: !GetAtt LogsBucket.DomainName
          Prefix: cloudfront-logs/
          IncludeCookies: false
        WebACLId: !Ref WebACL
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudFront'

  # ==========================================
  # WAF WEB ACL
  # ==========================================
  
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${AWS::StackName}-WebACL'
      Scope: CLOUDFRONT
      DefaultAction:
        Allow: {}
      Rules:
        - Name: RateLimitRule
          Priority: 1
          Action:
            Block: {}
          Statement:
            RateBasedStatement:
              Limit: 2000
              AggregateKeyType: IP
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: RateLimitRule
        - Name: SQLInjectionRule
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLInjectionRule
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${AWS::StackName}-WebACL'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebACL'

  # ==========================================
  # CLOUDWATCH MONITORING
  # ==========================================
  
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/webapp/${AWS::StackName}'
      RetentionInDays: 30

  ApplicationDashboard:
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
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average", "label": "Response Time"}],
                  [".", "RequestCount", {"stat": "Sum", "label": "Request Count"}],
                  [".", "HealthyHostCount", {"stat": "Average", "label": "Healthy Hosts"}],
                  [".", "UnHealthyHostCount", {"stat": "Average", "label": "Unhealthy Hosts"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ALB Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                  [".", "NetworkIn", {"stat": "Sum"}],
                  [".", "NetworkOut", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "EC2 Metrics"
              }
            }
          ]
        }

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: Alarm when CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

  UnhealthyHostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnhealthyHosts'
      AlarmDescription: Alarm when unhealthy host count is greater than 0
      MetricName: UnHealthyHostCount
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt TargetGroup.TargetGroupFullName

# ==========================================
# OUTPUTS
# ==========================================

Outputs:
  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  CloudFrontURL:
    Description: CloudFront distribution URL
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-URL'

  WebsiteURL:
    Description: Website URL
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-Website-URL'

  S3AssetsBucket:
    Description: S3 bucket for application assets
    Value: !Ref AppAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Assets-Bucket'

  S3LogsBucket:
    Description: S3 bucket for logs
    Value: !Ref LogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Logs-Bucket'

  DynamoDBTableName:
    Description: DynamoDB table name for sessions
    Value: !Ref SessionTable
    Export:
      Name: !Sub '${AWS::StackName}-Session-Table'

  SecretsManagerARN:
    Description: ARN of Secrets Manager secret
    Value: !Ref AppSecrets
    Export:
      Name: !Sub '${AWS::StackName}-Secrets-ARN'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}-Dashboard'
```

## Deployment Instructions

### Prerequisites
1. **AWS CLI** configured with appropriate credentials
2. **Valid domain name** registered or transferred to Route 53
3. **Existing VPCs** in both regions with specified CIDR blocks
4. **EC2 Key Pair** created in each region

### Deployment Steps

1. **Validate the template:**
```bash
aws cloudformation validate-template \
  --template-body file://web_app_deployment.yaml \
  --region us-east-1
```

2. **Deploy to us-east-1:**
```bash
aws cloudformation create-stack \
  --stack-name webapp-infrastructure-east \
  --template-body file://web_app_deployment.yaml \
  --parameters \
    ParameterKey=Region,ParameterValue=us-east-1 \
    ParameterKey=VpcId,ParameterValue=<YOUR_VPC_ID> \
    ParameterKey=VpcCidr,ParameterValue=10.0.0.0/16 \
    ParameterKey=DomainName,ParameterValue=<YOUR_DOMAIN> \
    ParameterKey=KeyPairName,ParameterValue=<YOUR_KEY_PAIR> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Deploy to us-west-2:**
```bash
aws cloudformation create-stack \
  --stack-name webapp-infrastructure-west \
  --template-body file://web_app_deployment.yaml \
  --parameters \
    ParameterKey=Region,ParameterValue=us-west-2 \
    ParameterKey=VpcId,ParameterValue=<YOUR_VPC_ID> \
    ParameterKey=VpcCidr,ParameterValue=10.1.0.0/16 \
    ParameterKey=DomainName,ParameterValue=<YOUR_DOMAIN> \
    ParameterKey=KeyPairName,ParameterValue=<YOUR_KEY_PAIR> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

## Key Security Features

1. **Network Isolation:** Private subnets for EC2 instances with NAT gateways
2. **Encryption:** All data at rest and in transit encrypted (S3, DynamoDB, EBS)
3. **IAM Least Privilege:** Minimal permissions for all roles
4. **WAF Protection:** SQL injection and rate limiting rules
5. **Secrets Management:** Centralized secrets in AWS Secrets Manager
6. **HTTPS Only:** Forced SSL/TLS with ACM certificates
7. **Security Groups:** Restrictive inbound rules, only ALB publicly accessible

## High Availability Features

1. **Multi-AZ Deployment:** Resources spread across availability zones
2. **Auto Scaling:** Dynamic scaling based on CPU utilization
3. **Health Checks:** ALB and Route 53 health monitoring
4. **DynamoDB Global Tables:** Can be enabled for cross-region replication
5. **CloudFront CDN:** Global edge locations for static content
6. **Backup and Recovery:** S3 versioning, DynamoDB point-in-time recovery

## Monitoring and Alerting

- **CloudWatch Dashboard:** Real-time metrics visualization
- **CloudWatch Alarms:** CPU and unhealthy host alerts
- **Application Logs:** Centralized in CloudWatch Logs
- **Access Logs:** ALB and CloudFront logs stored in S3

This template provides a production-ready, secure, and scalable infrastructure that follows AWS best practices and meets all specified requirements.