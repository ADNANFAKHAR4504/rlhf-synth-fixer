### Reasoning Trace
---

Alright, I'll create a comprehensive CloudFormation template that meets all these requirements. Let's break this down into logical sections:

1. Parameters - To make the template reusable across regions
2. Mappings - For region-specific settings like AMIs, CIDRs, etc.
3. Resources - The actual AWS resources
4. Outputs - Important resource identifiers

Let's start building the template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-region deployable CloudFormation template with comprehensive AWS services'

Parameters:
  # Environment parameters
  Environment:
    Description: The deployment environment
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - prod
  
  # VPC parameters
  VpcCidr:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16
  
  # Cross-region replication parameters
  CrossRegionReplicationBuckets:
    Description: Comma-separated list of ARNs of S3 buckets in other regions for cross-region replication
    Type: CommaDelimitedList
    Default: ""
  
  # RDS parameters
  DBInstanceClass:
    Description: RDS instance class
    Type: String
    Default: db.t3.small
  
  DBName:
    Description: Database name
    Type: String
    Default: mydb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DBBackupRetentionPeriod:
    Description: The number of days for which automated backups are retained
    Type: Number
    Default: 7
    MinValue: 7
  
  # Domain parameters
  DomainName:
    Description: The domain name for the application
    Type: String
    Default: example.com
  
  # WAF parameters
  WAFScope:
    Description: The scope of the WAF (REGIONAL or CLOUDFRONT)
    Type: String
    Default: REGIONAL
    AllowedValues:
      - REGIONAL
      - CLOUDFRONT

Mappings:
  RegionMap:
    us-east-1:
      PublicSubnet1CIDR: 10.0.1.0/24
      PublicSubnet2CIDR: 10.0.2.0/24
      PrivateSubnet1CIDR: 10.0.3.0/24
      PrivateSubnet2CIDR: 10.0.4.0/24
    us-east-2:
      PublicSubnet1CIDR: 10.1.1.0/24
      PublicSubnet2CIDR: 10.1.2.0/24
      PrivateSubnet1CIDR: 10.1.3.0/24
      PrivateSubnet2CIDR: 10.1.4.0/24
    us-west-1:
      PublicSubnet1CIDR: 10.2.1.0/24
      PublicSubnet2CIDR: 10.2.2.0/24
      PrivateSubnet1CIDR: 10.2.3.0/24
      PrivateSubnet2CIDR: 10.2.4.0/24
    us-west-2:
      PublicSubnet1CIDR: 10.3.1.0/24
      PublicSubnet2CIDR: 10.3.2.0/24
      PrivateSubnet1CIDR: 10.3.3.0/24
      PrivateSubnet2CIDR: 10.3.4.0/24
    eu-west-1:
      PublicSubnet1CIDR: 10.4.1.0/24
      PublicSubnet2CIDR: 10.4.2.0/24
      PrivateSubnet1CIDR: 10.4.3.0/24
      PrivateSubnet2CIDR: 10.4.4.0/24
    eu-central-1:
      PublicSubnet1CIDR: 10.5.1.0/24
      PublicSubnet2CIDR: 10.5.2.0/24
      PrivateSubnet1CIDR: 10.5.3.0/24
      PrivateSubnet2CIDR: 10.5.4.0/24
    ap-northeast-1:
      PublicSubnet1CIDR: 10.6.1.0/24
      PublicSubnet2CIDR: 10.6.2.0/24
      PrivateSubnet1CIDR: 10.6.3.0/24
      PrivateSubnet2CIDR: 10.6.4.0/24
    ap-southeast-1:
      PublicSubnet1CIDR: 10.7.1.0/24
      PublicSubnet2CIDR: 10.7.2.0/24
      PrivateSubnet1CIDR: 10.7.3.0/24
      PrivateSubnet2CIDR: 10.7.4.0/24

Resources:
```

Now, let's implement all the required resources:

1. S3 Bucket with Versioning and Encryption
2. IAM Replication Role
3. VPC with Subnets, NAT Gateways, and Route Tables
4. EC2 Auto Scaling Group
5. Security Groups
6. RDS Instance with AWS Secrets Manager
7. AWS Lambda Functions
8. AWS Config Rules
9. AWS WAF
10. Route 53 with Health Checks
11. ACM Certificates
12. CloudTrail and CloudWatch Logs
13. IAM Roles and Policies

Let's start with each section:

```yaml
Resources:
  # S3 Bucket with versioning and encryption
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${AWS::Region}-${Environment}-data-bucket'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3BucketKMSKey.Arn
      ReplicationConfiguration:
        Role: !GetAtt S3ReplicationRole.Arn
        Rules:
          - Status: Enabled
            Destination:
              Bucket: !Select [0, !Ref CrossRegionReplicationBuckets]
              EncryptionConfiguration:
                ReplicaKmsKeyID: 'arn:aws:kms:*:*:alias/aws/s3'

  # KMS Key for S3 Bucket Encryption
  S3BucketKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'

  # IAM Replication Role
  S3ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
      Policies:
        - PolicyName: S3ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}'
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                  - 's3:GetObjectVersionTagging'
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                  - 's3:ReplicateTags'
                Resource: !Join ['', ['arn:aws:s3:::', !Select [0, !Ref CrossRegionReplicationBuckets], '/*']]
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt S3BucketKMSKey.Arn
                Condition:
                  StringEquals:
                    'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
              - Effect: Allow
                Action:
                  - 'kms:Encrypt'
                Resource: 'arn:aws:kms:*:*:alias/aws/s3'
                Condition:
                  StringLike:
                    'kms:ViaService': 's3.*.amazonaws.com'

  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnet1CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnet2CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PrivateSubnet1CIDR]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PrivateSubnet2CIDR]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-routes'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-routes-1'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-routes-2'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP to anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS to anywhere
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref DbSecurityGroup
          Description: Allow MySQL to DB security group
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-app-sg'

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppSecurityGroup
          Description: Allow MySQL from app security group
      SecurityGroupEgress:
        - IpProtocol: -1
          FromPort: -1
          ToPort: -1
          CidrIp: 127.0.0.1/32
          Description: Deny all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-sg'

  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  EC2InstanceRole:
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
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: EC2MinimalAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DbSecret
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-launch-template'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/canonical/ubuntu/server/20.04/stable/current/amd64/hvm/ebs-gp2/ami-id}}'
        InstanceType: t3.micro
        SecurityGroupIds:
          - !Ref AppSecurityGroup
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        MonitoringEnabled: true
        UserData:
          Fn::Base64: |
            #!/bin/bash -xe
            apt-get update
            apt-get install -y nginx
            systemctl enable nginx
            systemctl start nginx

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-asg'
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-app-instance'
          PropagateAtLaunch: true

  # CPU Scale-Out Policy
  ScaleOutPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # Load Balancer
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-alb'
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref AppSecurityGroup
      Type: application
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ALB
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ACMCertificate

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Port: 80
      Protocol: HTTP
      TargetType: instance
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-tg'

  # RDS Database
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS DB instances
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'

  DbParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Parameter group for RDS MySQL instances
      Family: mysql8.0
      Parameters:
        max_connections: '100'
        character_set_server: 'utf8mb4'
        collation_server: 'utf8mb4_general_ci'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-parameter-group'

  DbSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}-db-credentials'
      Description: RDS database credentials
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-secret'

  DbInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-db'
      DBName: !Ref DBName
      Engine: mysql
      EngineVersion: 8.0.25
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      MaxAllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'mon:04:00-mon:05:00'
      MultiAZ: true
      PubliclyAccessible: false
      DBSubnetGroupName: !Ref DbSubnetGroup
      VPCSecurityGroups:
        - !Ref DbSecurityGroup
      DBParameterGroupName: !Ref DbParameterGroup
      MasterUsername: !Join ['', ['{{resolve:secretsmanager:', !Ref DbSecret, ':SecretString:username}}' ]]
      MasterUserPassword: !Join ['', ['{{resolve:secretsmanager:', !Ref DbSecret, ':SecretString:password}}' ]]
      EnableIAMDatabaseAuthentication: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSMonitoringRole.Arn
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-instance'

  RDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'

  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DbSecret
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  SecretRotationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-secret-rotation-lambda'
      Runtime: python3.8
      Handler: index.lambda_handler
      Role: !GetAtt SecretRotationLambdaRole.Arn
      Timeout: 30
      Environment:
        Variables:
          SECRET_ID: !Ref DbSecret
          DB_INSTANCE: !Ref DbInstance
      Code:
        ZipFile: |
          import boto3
          import os
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              logger.info(f"Received event: {event}")
              # Note: This is a placeholder for a real rotation function
              # Actual implementation would handle secret rotation logic
              return {
                  'statusCode': 200,
                  'body': 'Secret rotation processed'
              }

  SecretRotationLambdaRole:
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
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: SecretRotationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                  - 'secretsmanager:PutSecretValue'
                  - 'secretsmanager:UpdateSecretVersionStage'
                Resource: !Ref DbSecret
              - Effect: Allow
                Action:
                  - 'rds:ModifyDBInstance'
                Resource: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${DbInstance}'

  # Lambda Function for Web Application
  WebAppLambdaRole:
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
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        - PolicyName: WebAppLambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref DbSecret
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${S3Bucket.Arn}/*'

  WebAppLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-webapp-lambda'
      Runtime: python3.8
      Handler: index.lambda_handler
      Role: !GetAtt WebAppLambdaRole.Arn
      Timeout: 30
      MemorySize: 128
      VpcConfig:
        SecurityGroupIds:
          - !Ref AppSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          DB_SECRET_ARN: !Ref DbSecret
          S3_BUCKET: !Ref S3Bucket
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              logger.info(f"Received event: {event}")
              return {
                  'statusCode': 200,
                  'headers': {'Content-Type': 'application/json'},
                  'body': json.dumps({'message': 'Hello from Lambda!'})
              }

  WebAppLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref WebAppLambda
      Principal: apigateway.amazonaws.com

  # API Gateway
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${Environment}-api'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-api'

  ApiGatewayRootMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      AuthorizationType: NONE
      HttpMethod: GET
      Integration:
        IntegrationHttpMethod: POST
        Type: AWS_PROXY
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${WebAppLambda.Arn}/invocations'
      ResourceId: !GetAtt ApiGateway.RootResourceId
      RestApiId: !Ref ApiGateway

  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiGatewayRootMethod
    Properties:
      RestApiId: !Ref ApiGateway

  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      DeploymentId: !Ref ApiGatewayDeployment
      RestApiId: !Ref ApiGateway
      StageName: !Ref Environment
      MethodSettings:
        - ResourcePath: /*
          HttpMethod: '*'
          MetricsEnabled: true
          LoggingLevel: INFO
          DataTraceEnabled: true

  # Route 53
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${Environment} environment'

  WebsiteRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'app.${DomainName}.'
      Type: A
      AliasTarget:
        DNSName: !GetAtt ALB.DNSName
        HostedZoneId: !GetAtt ALB.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  ApiRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'api.${DomainName}.'
      Type: A
      AliasTarget:
        DNSName: !Sub '${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com'
        HostedZoneId: 'Z2FDTNDATAQYW2'  # This is AWS's standard hosted zone ID for CloudFront
        EvaluateTargetHealth: true

  HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Port: 443
        Type: HTTPS
        ResourcePath: /health
        FullyQualifiedDomainName: !Sub 'app.${DomainName}'
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Name
          Value: !Sub '${Environment}-health-check'

  # ACM Certificate
  ACMCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '*.${DomainName}'
      SubjectAlternativeNames:
        - !Ref DomainName
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-acm-certificate'

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      IsLogging: true
      S3BucketName: !Ref CloudTrailS3Bucket
      TrailName: !Sub '${Environment}-cloudtrail'
      EnableLogFileValidation: true
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-cloudtrail'

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${AWS::Region}-${Environment}-cloudtrail-logs'
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

  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
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
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${Environment}'
      RetentionInDays: 90

  CloudTrailLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !GetAtt CloudTrailLogGroup.Arn

  # CloudWatch Logs
  AppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${Environment}-app'
      RetentionInDays: 90

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-webapp-lambda'
      RetentionInDays: 90

  # AWS Config
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${Environment}-config-recorder'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RoleARN: !GetAtt ConfigRecorderRole.Arn

  ConfigRecorderRole:
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
        - 'arn:aws:iam::aws:policy/service-role/AWSConfigRole'

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: Six_Hours
      S3BucketName: !Ref ConfigS3Bucket
      S3KeyPrefix: config
      
  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${AWS::Region}-${Environment}-config-logs'
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

  ConfigS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
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
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${ConfigS3Bucket.Arn}/config/AWSLogs/${AWS::AccountId}/Config/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # AWS Config Rule for tagging compliance
  RequiredTagsConfigRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub '${Environment}-required-tags'
      Description: Checks if resources have the required tags
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::S3::Bucket
          - AWS::RDS::DBInstance
          - AWS::AutoScaling::AutoScalingGroup
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters:
        tag1Key: Environment
        tag2Key: Name
        tag3Key: Owner

  # AWS WAF
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${Environment}-web-acl'
      Scope: !Ref WAFScope
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${Environment}WebACLMetric'
        SampledRequestsEnabled: true
      Rules:
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 0
          OverrideAction:
            None: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: !Sub '${Environment}AWSManagedRulesCommonRuleSetMetric'
            SampledRequestsEnabled: true
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
        - Name: RateLimitRule
          Priority: 1
          Action:
            Block: {}
          VisibilityConfig:
            CloudWatchMetricsEnabled: true
            MetricName: !Sub '${Environment}RateLimitRuleMetric'
            SampledRequestsEnabled: true
          Statement:
            RateBasedStatement:
              Limit: 100
              AggregateKeyType: IP

  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Sub 'arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:loadbalancer/app/${ALB.LoadBalancerName}/${ALB.LoadBalancerFullName}'
      WebACLArn: !GetAtt WebACL.Arn

Outputs:
```

Now, let's add all the output values:

```yaml
Outputs:
  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  S3BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  S3ReplicationRoleArn:
    Description: ARN of the IAM role used for S3 replication
    Value: !GetAtt S3ReplicationRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3ReplicationRoleArn'

  S3BucketKMSKeyArn:
    Description: ARN of the KMS key used for S3 bucket encryption
    Value: !GetAtt S3BucketKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketKMSKeyArn'

  VpcId:
    Description: ID of the VPC
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PublicSubnet1Id:
    Description: ID of the public subnet in the first availability zone
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: ID of the public subnet in the second availability zone
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: ID of the private subnet in the first availability zone
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: ID of the private subnet in the second availability zone
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  AppSecurityGroupId:
    Description: ID of the security group for the application servers
    Value: !Ref AppSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-AppSecurityGroupId'

  DbSecurityGroupId:
    Description: ID of the security group for the database servers
    Value: !Ref DbSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-DbSecurityGroupId'

  AutoScalingGroupName:
    Description: Name of the auto scaling group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-AutoScalingGroupName'

  LaunchTemplateId:
    Description: ID of the launch template
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-LaunchTemplateId'

  EC2InstanceRoleArn:
    Description: ARN of the IAM role for EC2 instances
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceRoleArn'

  LoadBalancerDnsName:
    Description: DNS name of the load balancer
    Value: !GetAtt ALB.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDnsName'

  LoadBalancerArn:
    Description: ARN of the load balancer
    Value: !Ref ALB
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerArn'

  DbInstanceEndpoint:
    Description: Connection endpoint for the RDS instance
    Value: !GetAtt DbInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DbInstanceEndpoint'

  DbSecretArn:
    Description: ARN of the secret storing database credentials
    Value: !Ref DbSecret
    Export:
      Name: !Sub '${AWS::StackName}-DbSecretArn'

  WebAppLambdaArn:
    Description: ARN of the Lambda function for web application
    Value: !GetAtt WebAppLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebAppLambdaArn'

  ApiGatewayUrl:
    Description: URL of the API Gateway endpoint
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  HostedZoneId:
    Description: ID of the Route 53 hosted zone
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZoneId'

  WebsiteUrl:
    Description: URL of the website
    Value: !Sub 'https://app.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-WebsiteUrl'

  ApiUrl:
    Description: URL of the API
    Value: !Sub 'https://api.${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  ACMCertificateArn:
    Description: ARN of the ACM certificate
    Value: !Ref ACMCertificate
    Export:
      Name: !Sub '${AWS::StackName}-ACMCertificateArn'

  CloudTrailName:
    Description: Name of the CloudTrail trail
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailName'

  CloudTrailS3BucketName:
    Description: Name of the S3 bucket for CloudTrail logs
    Value: !Ref CloudTrailS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailS3BucketName'

  WebACLArn:
    Description: ARN of the WAF web ACL
    Value: !GetAtt WebACL.Arn
    Export:
      Name: !Sub '${AWS::StackName}-WebACLArn'

  ConfigRuleName:
    Description: Name of the AWS Config rule for required tags
    Value: !Ref RequiredTagsConfigRule
    Export:
      Name: !Sub '${AWS::StackName}-ConfigRuleName'
```

Let me bring all the pieces together into a complete CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-region deployable CloudFormation template with comprehensive AWS services'

Parameters:
  # Environment parameters
  Environment:
    Description: The deployment environment
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - test
      - prod
  
  # VPC parameters
  VpcCidr:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16
  
  # Cross-region replication parameters
  CrossRegionReplicationBuckets:
    Description: Comma-separated list of ARNs of S3 buckets in other regions for cross-region replication
    Type: CommaDelimitedList
    Default: ""
  
  # RDS parameters
  DBInstanceClass:
    Description: RDS instance class
    Type: String
    Default: db.t3.small
  
  DBName:
    Description: Database name
    Type: String
    Default: mydb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  DBBackupRetentionPeriod:
    Description: The number of days for which automated backups are retained
    Type: Number
    Default: 7
    MinValue: 7
  
  # Domain parameters
  DomainName:
    Description: The domain name for the application
    Type: String
    Default: example.com
  
  # WAF parameters
  WAFScope:
    Description: The scope of the WAF (REGIONAL or CLOUDFRONT)
    Type: String
    Default: REGIONAL
    AllowedValues:
      - REGIONAL
      - CLOUDFRONT

Mappings:
  RegionMap:
    us-east-1:
      PublicSubnet1CIDR: 10.0.1.0/24
      PublicSubnet2CIDR: 10.0.2.0/24
      PrivateSubnet1CIDR: 10.0.3.0/24
      PrivateSubnet2CIDR: 10.0.4.0/24
    us-east-2:
      PublicSubnet1CIDR: 10.1.1.0/24
      PublicSubnet2CIDR: 10.1.2.0/24
      PrivateSubnet1CIDR: 10.1.3.0/24
      PrivateSubnet2CIDR: 10.1.4.0/24
    us-west-1:
      PublicSubnet1CIDR: 10.2.1.0/24
      PublicSubnet2CIDR: 10.2.2.0/24
      PrivateSubnet1CIDR: 10.2.3.0/24
      PrivateSubnet2CIDR: 10.2.4.0/24
    us-west-2:
      PublicSubnet1CIDR: 10.3.1.0/24
      PublicSubnet2CIDR: 10.3.2.0/24
      PrivateSubnet1CIDR: 10.3.3.0/24
      PrivateSubnet2CIDR: 10.3.4.0/24
    eu-west-1:
      PublicSubnet1CIDR: 10.4.1.0/24
      PublicSubnet2CIDR: 10.4.2.0/24
      PrivateSubnet1CIDR: 10.4.3.0/24
      PrivateSubnet2CIDR: 10.4.4.0/24
    eu-central-1:
      PublicSubnet1CIDR: 10.5.1.0/24
      PublicSubnet2CIDR: 10.5.2.0/24
      PrivateSubnet1CIDR: 10.5.3.0/24
      PrivateSubnet2CIDR: 10.5.4.0/24
    ap-northeast-1:
      PublicSubnet1CIDR: 10.6.1.0/24
      PublicSubnet2CIDR: 10.6.2.0/24
      PrivateSubnet1CIDR: 10.6.3.0/24
      PrivateSubnet2CIDR: 10.6.4.0/24
    ap-southeast-1:
      PublicSubnet1CIDR: 10.7.1.0/24
      PublicSubnet2CIDR: 10.7.2.0/24
      PrivateSubnet1CIDR: 10.7.3.0/24
      PrivateSubnet2CIDR: 10.7.4.0/24

Resources:
  # S3 Bucket with versioning and encryption
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${AWS::Region}-${Environment}-data-bucket'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3BucketKMSKey.Arn
      ReplicationConfiguration:
        Role: !GetAtt S3ReplicationRole.Arn
        Rules:
          - Status: Enabled
            Destination:
              Bucket: !Select [0, !Ref CrossRegionReplicationBuckets]
              EncryptionConfiguration:
                ReplicaKmsKeyID: 'arn:aws:kms:*:*:alias/aws/s3'

  # KMS Key for S3 Bucket Encryption
  S3BucketKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'

  # IAM Replication Role
  S3ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
      Policies:
        - PolicyName: S3ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}'
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                  - 's3:GetObjectVersionTagging'
                Resource: !Sub 'arn:aws:s3:::${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                  - 's3:ReplicateTags'
                Resource: !Join ['', ['arn:aws:s3:::', !Select [0, !Ref CrossRegionReplicationBuckets], '/*']]
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                Resource: !GetAtt S3BucketKMSKey.Arn
                Condition:
                  StringEquals:
                    'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
              - Effect: Allow
                Action:
                  - 'kms:Encrypt'
                Resource: 'arn:aws:kms:*:*:alias/aws/s3'
                Condition:
                  StringLike:
                    'kms:ViaService': 's3.*.amazonaws.com'

  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnet1CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PublicSubnet2CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [RegionMap, !Ref 'AWS::Region', PrivateSubnet1CIDR]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    
### Answer 
---

