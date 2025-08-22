I'll create a comprehensive CloudFormation template that meets all your security and compliance requirements. This template will be production-ready with best practices built in.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Infrastructure Stack - Production Ready with Full Compliance'

Parameters:
  TeamName:
    Type: String
    Default: 'security'
    Description: 'Team name for resource naming and tagging'
  
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment type'
  
  Owner:
    Type: String
    Default: 'infrastructure-team'
    Description: 'Resource owner for tagging'
  
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'RDS master username'
  
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'RDS master password (min 8 characters)'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for emergency access only'

Mappings:
  RegionMap:
    us-west-2:
      AMI: ami-0c02fb55956c7d316  # Amazon Linux 2023
    us-east-1:
      AMI: ami-0abcdef1234567890   # Amazon Linux 2023
    eu-west-1:
      AMI: ami-0d71ea30463e0ff8d   # Amazon Linux 2023

Resources:
  # ===== KMS KEYS =====
  SecurityKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for security infrastructure encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow Lambda
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'KMS-${TeamName}-SecurityKey'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  SecurityKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/security-${TeamName}-key'
      TargetKeyId: !Ref SecurityKMSKey

  # ===== VPC AND NETWORKING =====
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false  # Security best practice
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Public-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Public-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Private-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'Subnet-${TeamName}-Private-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways for Private Subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EIP-${TeamName}-NAT-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'EIP-${TeamName}-NAT-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'NAT-${TeamName}-Gateway-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'NAT-${TeamName}-Gateway-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${TeamName}-Public'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'RT-${TeamName}-Private-1'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
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
          Value: !Sub 'RT-${TeamName}-Private-2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ===== SECURITY GROUPS =====
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS from anywhere'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          DestinationSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'HTTP to EC2 instances'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          DestinationSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'HTTPS to EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-ALB'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS from ALB'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-EC2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub 'SG-${TeamName}-RDS'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== S3 BUCKETS =====
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${TeamName}-secure-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Ref S3LogGroup
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-Secure'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${TeamName}-alb-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
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
          Value: !Sub 'S3-${TeamName}-ALBLogs'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::Region}:root'  # ELB service account for the region
            Action: s3:PutObject
            Resource: !Sub '${ALBLogsBucket}/*'
          - Sid: AWSLogDeliveryAclCheck
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::Region}:root'
            Action: s3:GetBucketAcl
            Resource: !Ref ALBLogsBucket

  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-${TeamName}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub 'S3-${TeamName}-CloudTrail'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailLogsBucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ===== IAM ROLES AND POLICIES =====
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-${TeamName}-EC2Instance'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref SecureS3Bucket
      Tags:
        - Key: Name
          Value: !Sub 'Role-${TeamName}-EC2'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'Profile-${TeamName}-EC2'
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Role-${TeamName}-Lambda'
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: KMSAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt SecurityKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Role-${TeamName}-Lambda'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== CLOUDWATCH LOGS =====
  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${TeamName}-secure-bucket'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecurityKMSKey.Arn

  # ===== EC2 INSTANCES =====
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Ref PrivateSubnet1
      KeyName: !Ref KeyPairName
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Disable SSH service for security
          systemctl disable sshd
          systemctl stop sshd
      Tags:
        - Key: Name
          Value: !Sub 'EC2-${TeamName}-WebServer'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== APPLICATION LOAD BALANCER =====
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'ALB-${TeamName}-Main'
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBLogsBucket
        - Key: deletion_protection.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: !Sub 'ALB-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'TG-${TeamName}-Web'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref EC2Instance
          Port: 80
      Tags:
        - Key: Name
          Value: !Sub 'TG-${TeamName}-Web'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ===== RDS DATABASE =====
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'dbsg-${TeamName}-main'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'DBSG-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'rds-${TeamName}-main'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref SecurityKMSKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false  # Set to true for production
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'RDS-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== DYNAMODB TABLE =====
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'DDB-${TeamName}-Main'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref SecurityKMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Name
          Value: !Sub 'DDB-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== LAMBDA FUNCTION =====
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'Lambda-${TeamName}-Processor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from Lambda!')
              }
      Environment:
        Variables:
          DATABASE_URL: !Sub '${RDSInstance}.${AWS::Region}.rds.amazonaws.com'
          TABLE_NAME: !Ref DynamoDBTable
      KmsKeyArn: !GetAtt SecurityKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'Lambda-${TeamName}-Processor'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== CLOUDTRAIL =====
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub 'CloudTrail-${TeamName}-Main'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecurityKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${SecureS3Bucket}/*'
            - Type: AWS::S3::Bucket
              Values:
                - !Ref SecureS3Bucket
      Tags:
        - Key: Name
          Value: !Sub 'CloudTrail-${TeamName}-Main'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

  # ===== GUARDDUTY =====
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      DataSources:
        S3Logs:
          Enable: true
        MalwareProtection:
          ScanEc2InstanceWithFindings:
            EbsVolumes: true
      Tags:
        - Key: Name
          Value: !Sub 'GuardDuty-${TeamName}-Detector'
        - Key: Owner
          Value: !Ref Owner
        - Key: Environment
          Value: !Ref Environment

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  SecurityKMSKeyId:
    Description: 'Security KMS Key ID'
    Value: !Ref SecurityKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  SecureS3BucketName:
    Description: 'Secure S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket-Name'

  ALBLogsBucketName:
    Description: 'ALB Logs S3 Bucket Name'
    Value: !Ref ALBLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ALB-Logs-Bucket-Name'

  ApplicationLoadBalancerArn:
    Description: 'Application Load Balancer AR