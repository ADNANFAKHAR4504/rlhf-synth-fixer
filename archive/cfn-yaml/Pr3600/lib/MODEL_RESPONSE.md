### Reasoning Trace
---

Let me break down what's needed:

1. **CloudFormation Template (lib/TapStack.yml)**:
   - Network Layer: VPC, subnets, IGW, NAT Gateway, route tables
   - Compute: EC2 instance with Discourse
   - Database: RDS PostgreSQL
   - Caching: ElastiCache Redis
   - Storage: S3 buckets for uploads and backups
   - CDN: CloudFront distribution
   - DNS: Route 53
   - Security: ACM certificate, IAM roles, Security Groups, Secrets Manager
   - Monitoring: CloudWatch logs and alarms, SNS topic
   - Backup: AWS Backup vault and plan

2. **Unit Tests (tests/tap-stack.unit.test.ts)**:
   - Verify all resources are defined
   - Check resource properties
   - Validate configurations

3. **Integration Tests (tests/tap-stack.int.test.ts)**:
   - Test deployed resources
   - Verify connectivity
   - Check functionality

Let me start with the CloudFormation template, making sure all resources are properly connected using references.
### Answer 
---

I'll build a complete Discourse forum infrastructure for your hobby platform. Let me create the three required files with all necessary AWS resources properly connected.

## 1. CloudFormation Stack Implementation

```yaml
# lib/TapStack.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Hobby Forum Platform - Discourse Infrastructure for 3000 members'

Parameters:
  DomainName:
    Type: String
    Description: Domain name for the forum (e.g., forum.example.com)
    AllowedPattern: '^[a-z0-9][a-z0-9-\.]*[a-z0-9]$'
  
  AdminEmail:
    Type: String
    Description: Email address for admin notifications
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  
  SSHKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
  
  DatabaseMasterUsername:
    Type: String
    Default: discourse
    Description: Master username for RDS PostgreSQL
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  SMTPServer:
    Type: String
    Default: email-smtp.us-east-1.amazonaws.com
    Description: SMTP server for sending emails
  
  SMTPPort:
    Type: Number
    Default: 587
    Description: SMTP port for email sending
  
  SMTPUsername:
    Type: String
    Default: ''
    Description: SMTP username (leave empty for SES with IAM)
    
  SMTPPassword:
    Type: String
    Default: ''
    Description: SMTP password (leave empty for SES with IAM)
    NoEcho: true

Resources:
  # ==================== NETWORK LAYER ====================
  
  # VPC Configuration
  ForumVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.42.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Internet Gateway
  ForumInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ForumVPC
      InternetGatewayId: !Ref ForumInternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.42.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.42.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.42.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ForumVPC
      CidrBlock: 10.42.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-gateway'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-rt'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ForumInternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ForumVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-rt'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ==================== SECURITY LAYER ====================
  
  # Security Group for EC2
  DiscourseEC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Discourse EC2 instance
      VpcId: !Ref ForumVPC
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
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: Allow SSH access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-sg'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Security Group for RDS
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS PostgreSQL instance
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref DiscourseEC2SecurityGroup
          Description: Allow PostgreSQL access from EC2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-rds-sg'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Security Group for ElastiCache
  CacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ElastiCache Redis
      VpcId: !Ref ForumVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref DiscourseEC2SecurityGroup
          Description: Allow Redis access from EC2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-sg'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # ==================== IAM RESOURCES ====================
  
  # IAM Role for EC2
  DiscourseEC2Role:
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
      Policies:
        - PolicyName: DiscourseS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${UserUploadsBucket}/*'
                  - !Sub 'arn:aws:s3:::${UserUploadsBucket}'
                  - !Sub 'arn:aws:s3:::${BackupsBucket}/*'
                  - !Sub 'arn:aws:s3:::${BackupsBucket}'
        - PolicyName: DiscourseSecretsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabasePasswordSecret
        - PolicyName: DiscourseLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !GetAtt ApplicationLogGroup.Arn
        - PolicyName: DiscourseSESAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ses:SendEmail
                  - ses:SendRawEmail
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ec2-role'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  DiscourseEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref DiscourseEC2Role

  # ==================== SECRETS MANAGEMENT ====================
  
  DatabasePasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-password'
      Description: RDS PostgreSQL master password
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseMasterUsername}"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # ==================== DATABASE LAYER ====================
  
  # Database Subnet Group
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS PostgreSQL
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # RDS PostgreSQL Instance
  ForumDatabase:
    Type: AWS::RDS::DBInstance
    DependsOn: DatabasePasswordSecret
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      DBInstanceClass: db.t3.small
      Engine: postgres
      EngineVersion: '14.9'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DatabaseMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabasePasswordSecret}:SecretString:password}}'
      DBName: discourse
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-database'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation
        - Key: BackupRequired
          Value: 'true'

  # ==================== CACHING LAYER ====================
  
  # Cache Subnet Group
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for ElastiCache Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-subnet-group'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # ElastiCache Redis Cluster
  ForumRedisCache:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheClusterId: !Sub '${AWS::StackName}-redis'
      Engine: redis
      CacheNodeType: cache.t3.small
      NumCacheNodes: 1
      VpcSecurityGroupIds:
        - !Ref CacheSecurityGroup
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      PreferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      SnapshotRetentionLimit: 7
      SnapshotWindow: '03:00-04:00'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-redis'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # ==================== STORAGE LAYER ====================
  
  # S3 Bucket for User Uploads
  UserUploadsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-uploads-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 30
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-uploads'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # S3 Bucket Policy for CloudFront OAI
  UserUploadsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref UserUploadsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}'
            Action: 's3:GetObject'
            Resource: !Sub '${UserUploadsBucket.Arn}/*'
          - Sid: AllowEC2Access
            Effect: Allow
            Principal:
              AWS: !GetAtt DiscourseEC2Role.Arn
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !Sub '${UserUploadsBucket.Arn}/*'
              - !GetAtt UserUploadsBucket.Arn

  # S3 Bucket for Backups
  BackupsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-backups-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 30
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-backups'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # ==================== CDN LAYER ====================
  
  # CloudFront Origin Access Identity
  CloudFrontOriginAccessIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${AWS::StackName} S3 bucket'

  # CloudFront Distribution
  ForumCloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    DependsOn:
      - UserUploadsBucket
      - ForumSSLCertificate
    Properties:
      DistributionConfig:
        Comment: !Sub 'CDN for ${AWS::StackName} forum uploads'
        Enabled: true
        PriceClass: PriceClass_100
        HttpVersion: http2
        Aliases:
          - !Ref DomainName
        ViewerCertificate:
          AcmCertificateArn: !Ref ForumSSLCertificate
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt UserUploadsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 404
            ResponsePagePath: /404.html
            ErrorCachingMinTTL: 300
          - ErrorCode: 404
            ErrorCachingMinTTL: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cdn'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # ==================== DNS AND CERTIFICATE ====================
  
  # SSL Certificate
  ForumSSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub 'www.${DomainName}'
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          ValidationDomain: !Ref DomainName
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-certificate'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Route 53 Hosted Zone
  ForumHostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${AWS::StackName} forum'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-hosted-zone'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # Route 53 A Record
  ForumDNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref ForumHostedZone
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt ForumCloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2  # CloudFront Hosted Zone ID
        EvaluateTargetHealth: false

  # ==================== COMPUTE LAYER ====================
  
  # EC2 Instance for Discourse
  DiscourseEC2Instance:
    Type: AWS::EC2::Instance
    DependsOn:
      - ForumDatabase
      - ForumRedisCache
      - UserUploadsBucket
      - BackupsBucket
    Properties:
      ImageId: ami-0c94855ba95c574c8  # Amazon Linux 2023 AMI
      InstanceType: t3.small
      KeyName: !Ref SSHKeyName
      IamInstanceProfile: !Ref DiscourseEC2InstanceProfile
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref DiscourseEC2SecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 30
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          set -e
          
          # Log all output
          exec > >(tee -a /var/log/user-data.log)
          exec 2>&1
          
          # Update system
          yum update -y
          
          # Install dependencies
          yum install -y docker git python3 python3-pip jq aws-cli
          
          # Install CloudWatch agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
          
          # Start Docker
          systemctl start docker
          systemctl enable docker
          usermod -a -G docker ec2-user
          
          # Get database credentials from Secrets Manager
          DB_SECRET=$(aws secretsmanager get-secret-value --secret-id ${DatabasePasswordSecret} --region ${AWS::Region} --query SecretString --output text)
          DB_PASSWORD=$(echo $DB_SECRET | jq -r '.password')
          DB_USERNAME=$(echo $DB_SECRET | jq -r '.username')
          
          # Set environment variables for Discourse
          export DISCOURSE_DB_HOST="${ForumDatabase.Endpoint.Address}"
          export DISCOURSE_DB_PORT="5432"
          export DISCOURSE_DB_NAME="discourse"
          export DISCOURSE_DB_USERNAME="$DB_USERNAME"
          export DISCOURSE_DB_PASSWORD="$DB_PASSWORD"
          export DISCOURSE_REDIS_HOST="${ForumRedisCache.RedisEndpoint.Address}"
          export DISCOURSE_REDIS_PORT="${ForumRedisCache.RedisEndpoint.Port}"
          export DISCOURSE_REDIS_DB="0"
          export DISCOURSE_S3_BUCKET="${UserUploadsBucket}"
          export DISCOURSE_S3_REGION="${AWS::Region}"
          export DISCOURSE_S3_BACKUP_BUCKET="${BackupsBucket}"
          export DISCOURSE_CDN_URL="https://${DomainName}"
          export DISCOURSE_HOSTNAME="${DomainName}"
          export DISCOURSE_DEVELOPER_EMAILS="${AdminEmail}"
          export DISCOURSE_SMTP_ADDRESS="${SMTPServer}"
          export DISCOURSE_SMTP_PORT="${SMTPPort}"
          export DISCOURSE_SMTP_USER_NAME="${SMTPUsername}"
          export DISCOURSE_SMTP_PASSWORD="${SMTPPassword}"
          
          # Clone Discourse Docker
          cd /opt
          git clone https://github.com/discourse/discourse_docker.git
          cd discourse_docker
          
          # Create Discourse configuration
          cat > containers/app.yml <<EOF
          templates:
            - "templates/postgres.template.yml"
            - "templates/redis.template.yml"
            - "templates/web.template.yml"
            - "templates/web.ssl.template.yml"
            
          expose:
            - "80:80"
            - "443:443"
            
          params:
            db_default_text_search_config: "pg_catalog.english"
            db_shared_buffers: "256MB"
            version: stable
            
          env:
            LANG: en_US.UTF-8
            DISCOURSE_DEFAULT_LOCALE: en
            UNICORN_WORKERS: 2
            DISCOURSE_HOSTNAME: ${DomainName}
            DISCOURSE_DEVELOPER_EMAILS: ${AdminEmail}
            DISCOURSE_DB_HOST: $DISCOURSE_DB_HOST
            DISCOURSE_DB_PORT: $DISCOURSE_DB_PORT
            DISCOURSE_DB_NAME: $DISCOURSE_DB_NAME
            DISCOURSE_DB_USERNAME: $DISCOURSE_DB_USERNAME
            DISCOURSE_DB_PASSWORD: $DISCOURSE_DB_PASSWORD
            DISCOURSE_REDIS_HOST: $DISCOURSE_REDIS_HOST
            DISCOURSE_REDIS_PORT: $DISCOURSE_REDIS_PORT
            DISCOURSE_REDIS_DB: $DISCOURSE_REDIS_DB
            DISCOURSE_SMTP_ADDRESS: $DISCOURSE_SMTP_ADDRESS
            DISCOURSE_SMTP_PORT: $DISCOURSE_SMTP_PORT
            DISCOURSE_SMTP_USER_NAME: $DISCOURSE_SMTP_USER_NAME
            DISCOURSE_SMTP_PASSWORD: $DISCOURSE_SMTP_PASSWORD
            DISCOURSE_SMTP_ENABLE_START_TLS: true
            DISCOURSE_USE_S3: true
            DISCOURSE_S3_BUCKET: $DISCOURSE_S3_BUCKET
            DISCOURSE_S3_REGION: $DISCOURSE_S3_REGION
            DISCOURSE_S3_BACKUP_BUCKET: $DISCOURSE_S3_BACKUP_BUCKET
            DISCOURSE_S3_CDN_URL: $DISCOURSE_CDN_URL
            DISCOURSE_ENABLE_CORS: true
            
          volumes:
            - volume:
                host: /var/discourse/shared/standalone
                guest: /shared
            - volume:
                host: /var/discourse/shared/standalone/log/var-log
                guest: /var/log
                
          hooks:
            after_code:
              - exec:
                  cd: \$home
                  cmd:
                    - sudo -E -u discourse bundle exec rake s3:upload_assets
          EOF
          
          # Bootstrap Discourse
          ./launcher bootstrap app
          ./launcher start app
          
          # Configure CloudWatch Logs
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/discourse/shared/standalone/log/rails/production.log",
                      "log_group_name": "${ApplicationLogGroup}",
                      "log_stream_name": "discourse-rails-{instance_id}"
                    },
                    {
                      "file_path": "/var/discourse/shared/standalone/log/var-log/nginx/error.log",
                      "log_group_name": "${ApplicationLogGroup}",
                      "log_stream_name": "discourse-nginx-error-{instance_id}"
                    },
                    {
                      "file_path": "/var/log/user-data.log",
                      "log_group_name": "${ApplicationLogGroup}",
                      "log_stream_name": "user-data-{instance_id}"
                    }
                  ]
                }
              }
            },
            "metrics": {
              "namespace": "HobbyForum",
              "metrics_collected": {
                "mem": {
                  "measurement": [
                    {
                      "name": "mem_used_percent",
                      "rename": "MemoryUtilization"
                    }
                  ]
                },
                "disk": {
                  "measurement": [
                    {
                      "name": "used_percent",
                      "rename": "DiskUtilization",
                      "path": "/"
                    }
                  ]
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
          
          # Signal success
          /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource DiscourseEC2Instance --region ${AWS::Region}
          
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-discourse-instance'
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation
        - Key: BackupRequired
          Value: 'true'
    CreationPolicy:
      ResourceSignal:
        Count: 1
        Timeout: PT30M

  # ==================== MONITORING LAYER ====================
  
  # CloudWatch Log Group
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # SNS Topic for Alarms
  AlarmNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-alarms'
      DisplayName: Forum Alarm Notifications
      Subscription:
        - Endpoint: !Ref AdminEmail
          Protocol: email
      Tags:
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

  # CloudWatch Alarms
  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ec2-cpu-high'
      AlarmDescription: Alert when EC2 CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref DiscourseEC2Instance
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  EC2MemoryAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ec2-memory-high'
      AlarmDescription: Alert when EC2 memory exceeds 80%
      MetricName: MemoryUtilization
      Namespace: HobbyForum
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref DiscourseEC2Instance
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  EC2DiskAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ec2-disk-high'
      AlarmDescription: Alert when EC2 disk usage exceeds 80%
      MetricName: DiskUtilization
      Namespace: HobbyForum
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref DiscourseEC2Instance
        - Name: Path
          Value: '/'
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-rds-cpu-high'
      AlarmDescription: Alert when RDS CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ForumDatabase
      AlarmActions:
        - !Ref AlarmNotificationTopic
      TreatMissingData: notBreaching

  # ==================== BACKUP LAYER ====================
  
  # Backup Vault
  ForumBackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub '${AWS::StackName}-backup-vault'
      BackupVaultTags:
        Environment: dev
        Application: HobbyForum
        ManagedBy: CloudFormation

  # Backup Plan
  ForumBackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub '${AWS::StackName}-backup-plan'
        BackupPlanRule:
          - RuleName: DailyBackup
            TargetBackupVault: !Ref ForumBackupVault
            ScheduleExpression: 'cron(0 3 ? * * *)'
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 7
              MoveToColdStorageAfterDays: 3
            RecoveryPointTags:
              Environment: dev
              Application: HobbyForum
      BackupPlanTags:
        Environment: dev
        Application: HobbyForum
        ManagedBy: CloudFormation

  # Backup Selection
  ForumBackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref ForumBackupPlan
      BackupSelection:
        SelectionName: !Sub '${AWS::StackName}-backup-selection'
        IamRoleArn: !GetAtt BackupRole.Arn
        ListOfTags:
          - ConditionType: STRINGEQUALS
            ConditionKey: BackupRequired
            ConditionValue: 'true'

  # IAM Role for Backup
  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores
      Tags:
        - Key: Environment
          Value: dev
        - Key: Application
          Value: HobbyForum
        - Key: ManagedBy
          Value: CloudFormation

# ==================== OUTPUTS ====================

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref ForumVPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  EC2PublicIP:
    Description: Public IP of Discourse EC2 instance
    Value: !GetAtt DiscourseEC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-ec2-public-ip'

  RDSEndpoint:
    Description: RDS PostgreSQL endpoint
    Value: !GetAtt ForumDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-rds-endpoint'

  RedisEndpoint:
    Description: ElastiCache Redis endpoint
    Value: !GetAtt ForumRedisCache.RedisEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-redis-endpoint'

  UploadsBucket:
    Description: S3 bucket for user uploads
    Value: !Ref UserUploadsBucket
    Export:
      Name: !Sub '${AWS::StackName}-uploads-bucket'

  BackupsBucket:
    Description: S3 bucket for backups
    Value: !Ref BackupsBucket
    Export:
      Name: !Sub '${AWS::StackName}-backups-bucket'

  CloudFrontURL:
    Description: CloudFront distribution URL
    Value: !Sub 'https://${ForumCloudFrontDistribution.DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-cloudfront-url'

  NameServers:
    Description: Route 53 name servers for domain delegation
    Value: !Join [', ', !GetAtt ForumHostedZone.NameServers]
    Export:
      Name: !Sub '${AWS::StackName}-nameservers'
```

## 2. Unit Tests

```typescript
// tests/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  
  before(() => {
    // Load and parse the CloudFormation template
    const templateContent = fs.readFileSync('lib/TapStack.yml', 'utf8');
    template = yaml.load(templateContent) as any;
  });

  describe('Template Structure', () => {
    it('should have the correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).to.equal('2010-09-09');
    });

    it('should have a Description', () => {
      expect(template.Description).to.be.a('string');
      expect(template.Description).to.include('Hobby Forum');
    });

    it('should have required sections', () => {
      expect(template).to.have.property('Parameters');
      expect(template).to.have.property('Resources');
      expect(template).to.have.property('Outputs');
    });
  });

  describe('Parameters', () => {
    it('should define all required parameters', () => {
      const requiredParams = [
        'DomainName',
        'AdminEmail',
        'SSHKeyName',
        'DatabaseMasterUsername',
        'SMTPServer',
        'SMTPPort',
        'SMTPUsername',
        'SMTPPassword'
      ];
      
      requiredParams.forEach(param => {
        expect(template.Parameters).to.have.property(param);
      });
    });

    it('should have proper parameter types', () => {
      expect(template.Parameters.DomainName.Type).to.equal('String');
      expect(template.Parameters.AdminEmail.Type).to.equal('String');
      expect(template.Parameters.SSHKeyName.Type).to.equal('AWS::EC2::KeyPair::KeyName');
      expect(template.Parameters.SMTPPort.Type).to.equal('Number');
    });

    it('should have validation patterns for email and domain', () => {
      expect(template.Parameters.DomainName).to.have.property('AllowedPattern');
      expect(template.Parameters.AdminEmail).to.have.property('AllowedPattern');
    });
  });

  describe('Network Resources', () => {
    it('should define VPC with correct CIDR', () => {
      expect(template.Resources).to.have.property('ForumVPC');
      expect(template.Resources.ForumVPC.Type).to.equal('AWS::EC2::VPC');
      expect(template.Resources.ForumVPC.Properties.CidrBlock).to.equal('10.42.0.0/16');
    });

    it('should define Internet Gateway', () => {
      expect(template.Resources).to.have.property('ForumInternetGateway');
      expect(template.Resources.ForumInternetGateway.Type).to.equal('AWS::EC2::InternetGateway');
    });

    it('should define NAT Gateway', () => {
      expect(template.Resources).to.have.property('NATGateway');
      expect(template.Resources.NATGateway.Type).to.equal('AWS::EC2::NatGateway');
    });

    it('should define 2 public and 2 private subnets', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnet => {
        expect(template.Resources).to.have.property(subnet);
        expect(template.Resources[subnet].Type).to.equal('AWS::EC2::Subnet');
      });
    });

    it('should have route tables for public and private subnets', () => {
      expect(template.Resources).to.have.property('PublicRouteTable');
      expect(template.Resources).to.have.property('PrivateRouteTable');
    });
  });

  describe('Compute Resources', () => {
    it('should define EC2 instance with correct type', () => {
      expect(template.Resources).to.have.property('DiscourseEC2Instance');
      expect(template.Resources.DiscourseEC2Instance.Type).to.equal('AWS::EC2::Instance');
      expect(template.Resources.DiscourseEC2Instance.Properties.InstanceType).to.equal('t3.small');
    });

    it('should have IAM role for EC2', () => {
      expect(template.Resources).to.have.property('DiscourseEC2Role');
      expect(template.Resources.DiscourseEC2Role.Type).to.equal('AWS::IAM::Role');
    });

    it('should have instance profile', () => {
      expect(template.Resources).to.have.property('DiscourseEC2InstanceProfile');
      expect(template.Resources.DiscourseEC2InstanceProfile.Type).to.equal('AWS::IAM::InstanceProfile');
    });

    it('should have UserData script', () => {
      expect(template.Resources.DiscourseEC2Instance.Properties).to.have.property('UserData');
    });

    it('should have proper EBS configuration', () => {
      const blockDeviceMappings = template.Resources.DiscourseEC2Instance.Properties.BlockDeviceMappings;
      expect(blockDeviceMappings).to.be.an('array');
      expect(blockDeviceMappings[0].Ebs.VolumeSize).to.equal(30);
      expect(blockDeviceMappings[0].Ebs.Encrypted).to.equal(true);
    });
  });

  describe('Database Resources', () => {
    it('should define RDS instance with correct configuration', () => {
      expect(template.Resources).to.have.property('ForumDatabase');
      expect(template.Resources.ForumDatabase.Type).to.equal('AWS::RDS::DBInstance');
      expect(template.Resources.ForumDatabase.Properties.DBInstanceClass).to.equal('db.t3.small');
      expect(template.Resources.ForumDatabase.Properties.Engine).to.equal('postgres');
    });

    it('should have database subnet group', () => {
      expect(template.Resources).to.have.property('DatabaseSubnetGroup');
      expect(template.Resources.DatabaseSubnetGroup.Type).to.equal('AWS::RDS::DBSubnetGroup');
    });

    it('should have backup retention configured', () => {
      expect(template.Resources.ForumDatabase.Properties.BackupRetentionPeriod).to.equal(7);
    });

    it('should have storage encryption enabled', () => {
      expect(template.Resources.ForumDatabase.Properties.StorageEncrypted).to.equal(true);
    });
  });

  describe('Caching Resources', () => {
    it('should define ElastiCache Redis cluster', () => {
      expect(template.Resources).to.have.property('ForumRedisCache');
      expect(template.Resources.ForumRedisCache.Type).to.equal('AWS::ElastiCache::CacheCluster');
      expect(template.Resources.ForumRedisCache.Properties.Engine).to.equal('redis');
      expect(template.Resources.ForumRedisCache.Properties.CacheNodeType).to.equal('cache.t3.small');
    });

    it('should have cache subnet group', () => {
      expect(template.Resources).to.have.property('CacheSubnetGroup');
      expect(template.Resources.CacheSubnetGroup.Type).to.equal('AWS::ElastiCache::SubnetGroup');
    });

    it('should have snapshot retention configured', () => {
      expect(template.Resources.ForumRedisCache.Properties.SnapshotRetentionLimit).to.equal(7);
    });
  });

  describe('Storage Resources', () => {
    it('should define S3 buckets for uploads and backups', () => {
      expect(template.Resources).to.have.property('UserUploadsBucket');
      expect(template.Resources).to.have.property('BackupsBucket');
      expect(template.Resources.UserUploadsBucket.Type).to.equal('AWS::S3::Bucket');
      expect(template.Resources.BackupsBucket.Type).to.equal('AWS::S3::Bucket');
    });

    it('should have lifecycle policies configured', () => {
      const uploadsLifecycle = template.Resources.UserUploadsBucket.Properties.LifecycleConfiguration;
      expect(uploadsLifecycle.Rules[0].Transitions[0].StorageClass).to.equal('GLACIER');
      expect(uploadsLifecycle.Rules[0].Transitions[0].TransitionInDays).to.equal(30);
      expect(uploadsLifecycle.Rules[0].ExpirationInDays).to.equal(90);
    });

    it('should have server-side encryption enabled', () => {
      const uploadsBucket = template.Resources.UserUploadsBucket.Properties;
      expect(uploadsBucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).to.equal('AES256');
    });

    it('should have bucket policy for CloudFront OAI', () => {
      expect(template.Resources).to.have.property('UserUploadsBucketPolicy');
      expect(template.Resources.UserUploadsBucketPolicy.Type).to.equal('AWS::S3::BucketPolicy');
    });
  });

  describe('CDN Resources', () => {
    it('should define CloudFront distribution', () => {
      expect(template.Resources).to.have.property('ForumCloudFrontDistribution');
      expect(template.Resources.ForumCloudFrontDistribution.Type).to.equal('AWS::CloudFront::Distribution');
    });

    it('should have Origin Access Identity', () => {
      expect(template.Resources).to.have.property('CloudFrontOriginAccessIdentity');
      expect(template.Resources.CloudFrontOriginAccessIdentity.Type)
        .to.equal('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    it('should have proper cache behavior configuration', () => {
      const distribution = template.Resources.ForumCloudFrontDistribution.Properties.DistributionConfig;
      expect(distribution.DefaultCacheBehavior.ViewerProtocolPolicy).to.equal('redirect-to-https');
      expect(distribution.DefaultCacheBehavior.Compress).to.equal(true);
    });
  });

  describe('DNS and Certificate Resources', () => {
    it('should define ACM certificate', () => {
      expect(template.Resources).to.have.property('ForumSSLCertificate');
      expect(template.Resources.ForumSSLCertificate.Type).to.equal('AWS::CertificateManager::Certificate');
      expect(template.Resources.ForumSSLCertificate.Properties.ValidationMethod).to.equal('DNS');
    });

    it('should define Route 53 hosted zone', () => {
      expect(template.Resources).to.have.property('ForumHostedZone');
      expect(template.Resources.ForumHostedZone.Type).to.equal('AWS::Route53::HostedZone');
    });

    it('should define DNS A record', () => {
      expect(template.Resources).to.have.property('ForumDNSRecord');
      expect(template.Resources.ForumDNSRecord.Type).to.equal('AWS::Route53::RecordSet');
      expect(template.Resources.ForumDNSRecord.Properties.Type).to.equal('A');
    });
  });

  describe('Security Resources', () => {
    it('should define security groups for EC2, RDS, and ElastiCache', () => {
      const securityGroups = [
        'DiscourseEC2SecurityGroup',
        'DatabaseSecurityGroup',
        'CacheSecurityGroup'
      ];
      
      securityGroups.forEach(sg => {
        expect(template.Resources).to.have.property(sg);
        expect(template.Resources[sg].Type).to.equal('AWS::EC2::SecurityGroup');
      });
    });

    it('should have Secrets Manager secret for database password', () => {
      expect(template.Resources).to.have.property('DatabasePasswordSecret');
      expect(template.Resources.DatabasePasswordSecret.Type).to.equal('AWS::SecretsManager::Secret');
    });

    it('should have proper security group rules', () => {
      const ec2SG = template.Resources.DiscourseEC2SecurityGroup.Properties.SecurityGroupIngress;
      const httpRule = ec2SG.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ec2SG.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).to.exist;
      expect(httpsRule).to.exist;
      expect(httpRule.CidrIp).to.equal('0.0.0.0/0');
      expect(httpsRule.CidrIp).to.equal('0.0.0.0/0');
    });

    it('should restrict database access to EC2 only', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(dbSG.SourceSecurityGroupId.Ref).to.equal('DiscourseEC2SecurityGroup');
      expect(dbSG.FromPort).to.equal(5432);
    });
  });

  describe('Monitoring Resources', () => {
    it('should define CloudWatch log group', () => {
      expect(template.Resources).to.have.property('ApplicationLogGroup');
      expect(template.Resources.ApplicationLogGroup.Type).to.equal('AWS::Logs::LogGroup');
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).to.equal(30);
    });

    it('should define SNS topic for alarms', () => {
      expect(template.Resources).to.have.property('AlarmNotificationTopic');
      expect(template.Resources.AlarmNotificationTopic.Type).to.equal('AWS::SNS::Topic');
    });

    it('should define CloudWatch alarms', () => {
      const alarms = ['EC2CPUAlarm', 'EC2MemoryAlarm', 'EC2DiskAlarm', 'DatabaseCPUAlarm'];
      
      alarms.forEach(alarm => {
        expect(template.Resources).to.have.property(alarm);
        expect(template.Resources[alarm].Type).to.equal('AWS::CloudWatch::Alarm');
        expect(template.Resources[alarm].Properties.Threshold).to.equal(80);
      });
    });
  });

  describe('Backup Resources', () => {
    it('should define backup vault', () => {
      expect(template.Resources).to.have.property('ForumBackupVault');
      expect(template.Resources.ForumBackupVault.Type).to.equal('AWS::Backup::BackupVault');
    });

    it('should define backup plan with 7-day retention', () => {
      expect(template.Resources).to.have.property('ForumBackupPlan');
      expect(template.Resources.ForumBackupPlan.Type).to.equal('AWS::Backup::BackupPlan');
      
      const lifecycle = template.Resources.ForumBackupPlan.Properties
        .BackupPlan.BackupPlanRule[0].Lifecycle;
      expect(lifecycle.DeleteAfterDays).to.equal(7);
    });

    it('should have backup selection', () => {
      expect(template.Resources).to.have.property('ForumBackupSelection');
      expect(template.Resources.ForumBackupSelection.Type).to.equal('AWS::Backup::BackupSelection');
    });

    it('should have backup IAM role', () => {
      expect(template.Resources).to.have.property('BackupRole');
      expect(template.Resources.BackupRole.Type).to.equal('AWS::IAM::Role');
    });
  });

  describe('Resource Tags', () => {
    it('should have consistent tags across resources', () => {
      const resourcesToCheck = [
        'ForumVPC',
        'DiscourseEC2Instance',
        'ForumDatabase',
        'UserUploadsBucket'
      ];
      
      resourcesToCheck.forEach(resource => {
        const tags = template.Resources[resource].Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        const appTag = tags.find((tag: any) => tag.Key === 'Application');
        const managedByTag = tags.find((tag: any) => tag.Key === 'ManagedBy');
        
        expect(envTag?.Value).to.equal('dev');
        expect(appTag?.Value).to.equal('HobbyForum');
        expect(managedByTag?.Value).to.equal('CloudFormation');
      });
    });
  });

  describe('Outputs', () => {
    it('should define all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'EC2PublicIP',
        'RDSEndpoint',
        'RedisEndpoint',
        'UploadsBucket',
        'BackupsBucket',
        'CloudFrontURL',
        'NameServers'
      ];
      
      requiredOutputs.forEach(output => {
        expect(template.Outputs).to.have.property(output);
        expect(template.Outputs[output]).to.have.property