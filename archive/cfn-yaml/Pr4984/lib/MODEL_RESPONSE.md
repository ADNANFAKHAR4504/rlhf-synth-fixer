```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production Infrastructure - Highly Available and Secure Environment'

# ====================
# PARAMETERS
# ====================
Parameters:
  VPCCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC
  
  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for Public Subnet 1
  
  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for Public Subnet 2
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: CIDR block for Private Subnet 1
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.11.0/24'
    Description: CIDR block for Private Subnet 2
  
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: EC2 instance type
  
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: RDS instance class
  
  DBName:
    Type: String
    Default: 'productiondb'
    Description: Database name
  
  DBUsername:
    Type: String
    Default: 'admin'
    Description: Database master username
  
  DomainName:
    Type: String
    Description: Domain name for Route 53
    Default: 'example.com'

# ====================
# MAPPINGS
# ====================
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2 AMI

# ====================
# RESOURCES
# ====================
Resources:
  
  # ====================
  # KMS KEY
  # ====================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting data at rest
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - rds.amazonaws.com
                - ec2.amazonaws.com
                - cloudtrail.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/production-key
      TargetKeyId: !Ref KMSKey

  # ====================
  # VPC AND NETWORKING
  # ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: ProductionVPC
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProductionIGW
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet1
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet2
        - Key: Environment
          Value: Production

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet1
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet2
        - Key: Environment
          Value: Production

  # NAT Gateways for private subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Environment
          Value: Production

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Environment
          Value: Production

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Environment
          Value: Production

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PublicRouteTable
        - Key: Environment
          Value: Production

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
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PrivateRouteTable1
        - Key: Environment
          Value: Production

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
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: PrivateRouteTable2
        - Key: Environment
          Value: Production

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

  # ====================
  # SECURITY GROUPS
  # ====================
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
          Value: ALBSecurityGroup
        - Key: Environment
          Value: Production

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP traffic from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS traffic from ALB
      Tags:
        - Key: Name
          Value: EC2SecurityGroup
        - Key: Environment
          Value: Production

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Allow MySQL traffic from EC2
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: Allow MySQL traffic from Lambda
      Tags:
        - Key: Name
          Value: RDSSecurityGroup
        - Key: Environment
          Value: Production

  ElastiCacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ElastiCache
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Allow Redis traffic from EC2
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: Allow Redis traffic from Lambda
      Tags:
        - Key: Name
          Value: ElastiCacheSecurityGroup
        - Key: Environment
          Value: Production

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: LambdaSecurityGroup
        - Key: Environment
          Value: Production

  # ====================
  # SECRETS MANAGER
  # ====================
  DBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: RDS Master Password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: "password"
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # IAM ROLES AND POLICIES
  # ====================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: EC2Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
              - Effect: Allow
                Action:
                  - 'elasticache:Describe*'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: 'arn:aws:logs:*:*:*'
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DBPasswordSecret
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref SNSTopic
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # S3 BUCKET
  # ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'production-static-assets-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:GetObject'
            Resource: !Sub '${S3Bucket.Arn}/*'
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # ====================
  # APPLICATION LOAD BALANCER
  # ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ProductionALB
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Environment
          Value: Production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ProductionTargetGroup
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Environment
          Value: Production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ====================
  # AUTO SCALING GROUP
  # ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: ProductionLaunchTemplate
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              KmsKeyId: !Ref KMSKey
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Production Server - ${AWS::Region}</h1>" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Environment
                Value: Production

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: ProductionASG
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Environment
          Value: Production
          PropagateAtLaunch: true

  # ====================
  # RDS DATABASE
  # ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: Production

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: production-database
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      MultiAZ: false
      Tags:
        - Key: Environment
          Value: Production

  RDSReadReplica:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: production-database-read-replica
      SourceDBInstanceIdentifier: !Ref RDSDatabase
      DBInstanceClass: !Ref DBInstanceClass
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # ELASTICACHE
  # ====================
  ElastiCacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for ElastiCache
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: Production

  ElastiCacheCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
      CacheSubnetGroupName: !Ref ElastiCacheSubnetGroup
      VpcSecurityGroupIds:
        - !Ref ElastiCacheSecurityGroup
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # LAMBDA FUNCTION
  # ====================
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: ProductionScheduledTask
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def lambda_handler(event, context):
              sns = boto3.client('sns')
              
              # Perform periodic task
              message = "Scheduled task executed successfully"
              
              # Send notification
              try:
                  sns.publish(
                      TopicArn=os.environ['SNS_TOPIC_ARN'],
                      Message=message,
                      Subject='Production Scheduled Task Notification'
                  )
              except Exception as e:
                  print(f"Error: {e}")
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Task completed')
              }
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: Production

  LambdaScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Description: Trigger Lambda function on schedule
      ScheduleExpression: rate(1 hour)
      State: ENABLED
      Targets:
        - Arn: !GetAtt LambdaFunction.Arn
          Id: LambdaTarget

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt LambdaScheduleRule.Arn

  # ====================
  # CLOUDFRONT DISTRIBUTION
  # ====================
  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: ProductionOAC
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: Production CloudFront Distribution
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref OriginAccessControl
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: http-only
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
          Compress: true
          ForwardedValues:
            QueryString: true
            Cookies:
              Forward: all
        CacheBehaviors:
          - PathPattern: /static/*
            TargetOriginId: S3Origin
            ViewerProtocolPolicy: https-only
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
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        WebACLId: !GetAtt WAFWebACL.Arn
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # WAF WEB ACL
  # ====================
  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: ProductionWebACL
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
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSet
        - Name: AWSManagedRulesKnownBadInputsRuleSet
          Priority: 3
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: KnownBadInputs
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: ProductionWebACL
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # ROUTE 53
  # ====================
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      Tags:
        - Key: Environment
          Value: Production

  HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: /
      FullyQualifiedDomainName: !GetAtt CloudFrontDistribution.DomainName
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      Tags:
        - Key: Environment
          Value: Production

  PrimaryRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: Primary
      Failover: PRIMARY
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2  # CloudFront Hosted Zone ID
        EvaluateTargetHealth: true
      HealthCheckId: !Ref HealthCheck

  SecondaryRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: Secondary
      Failover: SECONDARY
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # ====================
  # CLOUDTRAIL
  # ====================
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'production-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: ProductionTrail
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${S3Bucket.Arn}/'
      KMSKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: Production

  # ====================
  # AWS CONFIG
  # ====================
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: ProductionConfigRecorder
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: ProductionDeliveryChannel
      S3BucketName: !Ref ConfigS3Bucket
      SnsTopicARN: !Ref SNSTopic

  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'production-config-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production

  ConfigS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigS3Bucket
      PolicyDocument:
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt ConfigS3Bucket.Arn
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:ListBucket'
            Resource: !GetAtt ConfigS3Bucket.Arn
          - Sid: AWSConfigBucketWrite
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Policies:
        - PolicyName: ConfigBucketAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigS3Bucket.Arn
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${ConfigS3Bucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: Production

  # Config Rules
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: required-tags
      Description: Checks whether resources have required tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::EC2::Volume
          - AWS::RDS::DBInstance
      InputParameters:
        tag1Key: Environment

  S3VersioningRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: s3-bucket-versioning-enabled
      Description: Checks whether versioning is enabled for S3 buckets
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_VERSIONING_ENABLED

  RDSBackupRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: rds-backup-enabled
      Description: Checks whether RDS DB instances have backup enabled
      Source:
        Owner: AWS
        SourceIdentifier: DB_INSTANCE_BACKUP_ENABLED

  # ====================
  # SNS TOPIC
  # ====================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: ProductionNotifications
      DisplayName: Production Environment Notifications
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: Production

  SNSTopicPolicy:
    Type: AWS::SNS::TopicPolicy
    Properties:
      Topics:
        - !Ref SNSTopic
      PolicyDocument:
        Statement:
          - Sid: AllowServices
            Effect: Allow
            Principal:
              Service:
                - cloudwatch.amazonaws.com
                - config.amazonaws.com
                - events.amazonaws.com
            Action:
              - 'sns:Publish'
            Resource: !Ref SNSTopic

# ====================
# OUTPUTS
# ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  CloudFrontURL:
    Description: CloudFront Distribution URL
    Value: !GetAtt CloudFrontDistribution.DomainName

  ALBDNSName:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address

  ElastiCacheEndpoint:
    Description: ElastiCache Endpoint
    Value: !GetAtt ElastiCacheCluster.RedisEndpoint.Address

  SNSTopicArn:
    Description: SNS Topic ARN
    Value: !Ref SNSTopic

  HostedZoneId:
    Description: Route 53 Hosted Zone ID
    Value: !Ref HostedZone
  ```