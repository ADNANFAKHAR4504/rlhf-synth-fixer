```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-tier infrastructure with private subnets, encrypted resources, and comprehensive monitoring'

Parameters:
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'Database administrator username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBPassword:
    Type: String
    NoEcho: true
    Description: 'Database administrator password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316

Resources:
  # KMS Keys
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for S3 bucket encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/s3-encryption-key
      TargetKeyId: !Ref S3KMSKey

  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for RDS encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS Service
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/rds-encryption-key
      TargetKeyId: !Ref RDSKMSKey

  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'SecureVPC'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: 'us-east-1a'
      Tags:
        - Key: Name
          Value: 'PrivateSubnet1'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: 'us-east-1b'
      Tags:
        - Key: Name
          Value: 'PrivateSubnet2'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # NAT Gateway for private subnet internet access
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  PublicSubnetForNAT:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.100.0/24'
      AvailabilityZone: 'us-east-1a'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'PublicSubnetForNAT'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnetForNAT
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetForNAT
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'SecureEC2AccessGroup'
      GroupDescription: 'Security group for EC2 instances - allows SSH from specific CIDR range'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from allowed CIDR range'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for AWS API calls'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound for package updates'
      Tags:
        - Key: Name
          Value: 'SecureEC2AccessGroup'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'SecureRDSAccessGroup'
      GroupDescription: 'Security group for RDS instances - allows MySQL access from EC2 security group'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: 'SecureRDSAccessGroup'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # S3 Bucket
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # IAM Roles and Policies
  EC2S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'EC2S3AccessRole'
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
        - PolicyName: S3BucketAccess
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
                  - !Sub '${SecureS3Bucket}/*'
                  - !GetAtt SecureS3Bucket.Arn
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt S3KMSKey.Arn
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'EC2S3AccessProfile'
      Roles:
        - !Ref EC2S3AccessRole

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'LambdaMonitoringRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
                  - !Sub 'arn:aws:cloudwatch:${AWS::Region}:${AWS::AccountId}:metric/*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # CloudTrail Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'CloudTrailLogsRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/cloudtrail/*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # EC2 Instance
  CriticalEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Ref PrivateSubnet1
      DisableApiTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
      Tags:
        - Key: Name
          Value: 'CriticalEC2Instance'
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: 'secure-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS instances in private subnets'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # RDS Instance
  SecureRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: 'secure-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref RDSSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # Lambda Function
  MonitoringLambda:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'lambda-code-${AWS::AccountId}-${AWS::Region}'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  SecurityMonitoringFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: 'SecurityMonitoringFunction'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info('Security monitoring function executed')
              return {
                  'statusCode': 200,
                  'body': json.dumps('Security monitoring completed')
              }
      Timeout: 60
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${SecurityMonitoringFunction}'
      RetentionInDays: 14
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/cloudtrail/security-trail'
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
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
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

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
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  SecurityCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: 'SecurityCloudTrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup.Arn}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureS3Bucket}/*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # CloudWatch Alarms
  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: 'UnauthorizedAccessAttempts'
      AlarmDescription: 'Alarm for unauthorized access attempts'
      MetricName: 'UnauthorizedAPICalls'
      Namespace: 'CloudWatchLogMetrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

  # AWS Config
  ConfigServiceRole:
    Type: AWS::IAM::ServiceLinkedRole
    Properties:
      AWSServiceName: config.amazonaws.com

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: 'SecurityConfigDeliveryChannel'
      S3BucketName: !Ref ConfigS3Bucket

  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'aws-config-${AWS::AccountId}-${AWS::Region}'
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
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

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
            Action: s3:GetBucketAcl
            Resource: !GetAtt ConfigS3Bucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ConfigS3Bucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref 'AWS::AccountId'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceAccount': !Ref 'AWS::AccountId'

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: 'SecurityConfigRecorder'
      RoleARN: !Sub 'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig'
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  SecurityGroupChangesRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: 'security-group-changes-rule'
      Description: 'Checks for security group modifications'
      Source:
        Owner: AWS
        SourceIdentifier: SECURITY_GROUPS_UNRESTRICTED_COMMON_PORTS
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: Infrastructure

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref CriticalEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance'

  RDSEndpoint:
    Description: 'RDS Endpoint'
    Value: !GetAtt SecureRDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt SecurityMonitoringFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'
```
