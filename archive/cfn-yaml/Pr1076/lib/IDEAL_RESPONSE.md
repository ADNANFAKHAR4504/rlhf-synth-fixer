# IDEAL_RESPONSE - Secure Web Application Infrastructure

## Overview  
This document outlines the key improvements and fixes made to transform the initial MODEL_RESPONSE into the IDEAL_RESPONSE CloudFormation template for the secure web application infrastructure.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure Web Application Infrastructure - Production Ready CloudFormation Template"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentName
          - ProjectName
      - Label:
          default: "Network Configuration"
        Parameters:
          - PublicSubnetCidrs
          - PrivateSubnetCidrs
      - Label:
          default: "Application Configuration"
        Parameters:
          - InstanceType
          - MinSize
          - MaxSize
          - DesiredCapacity
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBInstanceClass
          - DBName
          - DBUsername
      - Label:
          default: "Security Configuration"
        Parameters:
          - KeyPairName

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Suffix for resource naming to support multiple deployments"
    Default: "dev-v2"
    AllowedPattern: "^[a-zA-Z0-9-]+$"
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"

  EnvironmentName:
    Type: String
    Default: "production"
    Description: "Environment name for resource tagging"
    AllowedValues: ["development", "staging", "production"]
    ConstraintDescription: "Must be one of the allowed values"

  ProjectName:
    Type: String
    Default: "securewebapp-v2"
    Description: "Project name for resource naming"
    AllowedPattern: "^[a-z0-9-]+$"
    ConstraintDescription: "Must contain only lowercase alphanumeric characters and hyphens"

  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: "10.0.20.0/24,10.0.21.0/24"
    Description: "CIDR blocks for public subnets (comma-separated)"

  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: "10.0.30.0/24,10.0.31.0/24"
    Description: "CIDR blocks for private subnets (comma-separated)"

  InstanceType:
    Type: String
    Default: "t3.micro"
    Description: "EC2 instance type for web servers"
    AllowedValues: ["t3.micro", "t3.small", "t3.medium", "t3.large"]

  MinSize:
    Type: Number
    Default: 2
    Description: "Minimum number of instances in Auto Scaling Group"
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Type: Number
    Default: 4
    Description: "Maximum number of instances in Auto Scaling Group"
    MinValue: 1
    MaxValue: 20

  DesiredCapacity:
    Type: Number
    Default: 2
    Description: "Desired number of instances in Auto Scaling Group"
    MinValue: 1
    MaxValue: 10

  DBInstanceClass:
    Type: String
    Default: "db.t3.micro"
    Description: "RDS instance class"
    AllowedValues: ["db.t3.micro", "db.t3.small", "db.t3.medium"]

  DBName:
    Type: String
    Default: "webappdb"
    Description: "Database name"
    AllowedPattern: "^[a-zA-Z][a-zA-Z0-9_]*$"
    ConstraintDescription: "Must start with a letter and contain only alphanumeric characters and underscores"

  DBUsername:
    Type: String
    Default: "admin"
    Description: "Database master username"
    AllowedPattern: "^[a-zA-Z][a-zA-Z0-9_]*$"
    ConstraintDescription: "Must start with a letter and contain only alphanumeric characters and underscores"

  KeyPairName:
    Type: String
    Default: ""
    Description: "Name of an existing EC2 KeyPair to enable SSH access (leave empty for no SSH access)"
    AllowedPattern: "^$|^[a-zA-Z0-9-]+$"
    ConstraintDescription: "Must be empty or a valid key pair name"

  ExistingCloudTrailName:
    Type: String
    Default: ""
    Description: "Name of existing CloudTrail to use (leave empty to create new CloudTrail)"
    AllowedPattern: "^$|^[a-zA-Z0-9_-]+$"
    ConstraintDescription: "Must be empty or a valid CloudTrail name"

  ExistingVPCId:
    Type: String
    Default: "vpc-05ddc543c44b25690"
    Description: "ID of existing VPC to use"
    AllowedPattern: "^vpc-[a-f0-9]+$"
    ConstraintDescription: "Must be a valid VPC ID"

  ExistingInternetGatewayId:
    Type: String
    Default: "igw-0fcffd108e58e6be9"
    Description: "ID of existing Internet Gateway to use"
    AllowedPattern: "^igw-[a-f0-9]+$"
    ConstraintDescription: "Must be a valid Internet Gateway ID"

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, ""]]
  CreateCloudTrail: !Equals [!Ref ExistingCloudTrailName, ""]

Resources:
  # KMS Key for encryption
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "KMS key for ${ProjectName} encryption"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: Allow CloudFormation to use the key
            Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
            Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-KMS-Key"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${ProjectName}-${EnvironmentSuffix}-key"
      TargetKeyId: !Ref KMSKey

  # VPC and Networking
  # Using existing VPC: !Ref ExistingVPCId
  # Using existing Internet Gateway: !Ref ExistingInternetGatewayId

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Public-Subnet-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Public-Subnet-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Private-Subnet-1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Private-Subnet-2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ExistingVPCId
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Public-RouteTable"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # Public route to existing Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ExistingInternetGatewayId

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

  # NAT Gateway for private subnets
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-NAT-EIP"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-NAT-Gateway"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ExistingVPCId
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Private-RouteTable"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  DefaultPrivateRoute:
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

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub "Security group for ${ProjectName} ALB"
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-ALB-SG"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub "Security group for ${ProjectName} web servers"
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-WebServer-SG"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub "Security group for ${ProjectName} database"
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Database-SG"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket for application data
  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-${EnvironmentSuffix}-${AWS::AccountId}-appdata-v2"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-App-Bucket"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket for CloudTrail logs
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Condition: CreateCloudTrail
    Properties:
      BucketName: !Sub "${ProjectName}-${EnvironmentSuffix}-${AWS::AccountId}-cloudtrail-v2"
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
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-CloudTrail-Bucket"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # Bucket Policy for CloudTrail
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: CreateCloudTrail
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": bucket-owner-full-control

  # CloudTrail for logging
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Condition: CreateCloudTrail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "${ProjectName}-${EnvironmentSuffix}-trail"
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: false
      IsLogging: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: "AWS::S3::Object"
              Values:
                - !Sub "${ApplicationBucket.Arn}/*"

  # IAM Roles
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
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
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub "${ApplicationBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ApplicationBucket.Arn
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-EC2-Role"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub "Subnet group for ${ProjectName} database"
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-DB-Subnet-Group"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # Database Secret
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-db-password"
      Description: !Sub "Database password for ${ProjectName}"
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: "password"
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-DB-Secret"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # RDS Parameter Group
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: !Sub "Parameter group for ${ProjectName} database"
      Family: mysql8.0
      Parameters:
        character_set_server: utf8mb4
        collation_server: utf8mb4_unicode_ci
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-DB-Parameter-Group"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${ProjectName}-${EnvironmentSuffix}-db"
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: "8.0.42"
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"
      DBName: !Ref DBName
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Database"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-alb"
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-ALB"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-tg"
      Port: 80
      Protocol: HTTP
      TargetType: instance
      VpcId: !Ref ExistingVPCId
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 2
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-Target-Group"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: !Ref ProjectName

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${ProjectName}-${EnvironmentSuffix}-lt"
      LaunchTemplateData:
        ImageId: ami-097e0672cc4cc5c0e # Amazon Linux 2 AMI in us-east-2
        InstanceType: !Ref InstanceType
        KeyName: !If
          - HasKeyPair
          - !Ref KeyPairName
          - !Ref "AWS::NoValue"
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd php php-mysqlnd
            systemctl start httpd
            systemctl enable httpd

            # Create health check endpoint
            cat > /var/www/html/health << 'EOF'
            <?php
            header('Content-Type: application/json');
            echo json_encode(['status' => 'healthy', 'timestamp' => date('c')]);
            ?>
            EOF

            # Create simple web application
            cat > /var/www/html/index.php << 'EOF'
            <?php
            echo "<h1>Welcome to ${ProjectName}</h1>";
            echo "<p>Environment: ${EnvironmentName}</p>";
            echo "<p>Instance ID: " . $_SERVER['HTTP_X_FORWARDED_FOR'] . "</p>";
            ?>
            EOF

            chown apache:apache /var/www/html/*
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${ProjectName}-${EnvironmentSuffix}-WebServer"
              - Key: Environment
                Value: Production
              - Key: Project
                Value: !Ref ProjectName

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${ProjectName}-${EnvironmentSuffix}-asg"
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub "${ProjectName}-${EnvironmentSuffix}-ASG"
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true

  # Auto Scaling Policies
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
        TargetValue: 30.0

  # CloudWatch Alarms
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-${EnvironmentSuffix}-high-cpu"
      AlarmDescription: "Scale up if CPU > 70% for 5 minutes"
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-${EnvironmentSuffix}-low-cpu"
      AlarmDescription: "Scale down if CPU < 30% for 5 minutes"
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref ExistingVPCId
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnets:
    Description: "Public Subnet IDs"
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnets"

  PrivateSubnets:
    Description: "Private Subnet IDs"
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnets"

  ApplicationLoadBalancerDNS:
    Description: "DNS name of the Application Load Balancer"
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ALBDNS"

  DatabaseEndpoint:
    Description: "Database endpoint"
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseEndpoint"

  DatabasePort:
    Description: "Database port"
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub "${AWS::StackName}-DatabasePort"

  S3BucketName:
    Description: "Application S3 bucket name"
    Value: !Ref ApplicationBucket
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketName"

  CloudTrailName:
    Description: "CloudTrail name"
    Value: !If
      - CreateCloudTrail
      - !Ref CloudTrail
      - !Ref ExistingCloudTrailName
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailName"

  KMSKeyId:
    Description: "KMS Key ID for encryption"
    Value: !Ref KMSKey
    Export:
      Name: !Sub "${AWS::StackName}-KMSKeyId"

  AutoScalingGroupName:
    Description: "Auto Scaling Group name"
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-AutoScalingGroupName"

  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"
```
