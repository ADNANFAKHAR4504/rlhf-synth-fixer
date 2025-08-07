```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-region AWS infrastructure template with S3 encryption, least privilege IAM, RDS logging, and EC2 in private subnets'

Parameters:
  CompanyName:
    Type: String
    Default: 'MyCompany'
    Description: 'Company name for resource naming convention'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment for resource naming convention'

  ExistingVpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'ID of existing VPC where resources will be deployed'

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: 'List of private subnet IDs within the existing VPC'

  DBSubnetGroupName:
    Type: String
    Description: 'Name of existing DB subnet group for RDS instances'

  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for RDS instance'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS instance'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

  EC2InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium']
    Description: 'EC2 instance type for private instances'

Resources:
  # KMS Key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub '${CompanyName}-${Environment} S3 encryption key'
      KeyPolicy:
        Version: '2012-10-17'
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
          - Sid: Allow EC2 Role Access
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2Role.Arn
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-KMSKey'

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${CompanyName}-${Environment}-s3-key'
      TargetKeyId: !Ref S3EncryptionKey

  # S3 Bucket with server-side encryption
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${CompanyName}-${Environment}-secure-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
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
          Value: !Sub '${CompanyName}-${Environment}-S3Bucket'

  # IAM Role for EC2 instances with least privilege
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${CompanyName}-${Environment}*'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-IAMRole'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${CompanyName}-${Environment}-EC2InstanceProfile'
      Roles:
        - !Ref EC2Role

  # IAM Role for RDS Enhanced Monitoring
  RDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${CompanyName}-${Environment}-RDSEnhancedMonitoringRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-RDSMonitoringRole'

  # DB Parameter Group for MySQL with logging enabled
  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${CompanyName}-${Environment}-mysql-params'
      Family: mysql8.0
      Description: 'MySQL parameter group with logging enabled'
      Parameters:
        general_log: 1
        slow_query_log: 1
        log_queries_not_using_indexes: 1
        long_query_time: 2
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-DBParameterGroup'

  # RDS Instance with logging enabled
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${CompanyName}-${Environment}-rds-instance'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroupName
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBParameterGroupName: !Ref DBParameterGroup
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      BackupRetentionPeriod: 7
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-RDSInstance'

  # Security Group for RDS
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-${Environment}-RDS-SG'
      GroupDescription: 'Security group for RDS instance'
      VpcId: !Ref ExistingVpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-RDSSecurityGroup'

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${CompanyName}-${Environment}-EC2-SG'
      GroupDescription: 'Security group for EC2 instances in private subnets'
      VpcId: !Ref ExistingVpcId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: 'MySQL to RDS'
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-EC2SecurityGroup'

  # Launch Template for EC2 instances
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${CompanyName}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y awscli
            # Configure CloudWatch agent for logging
            yum install -y amazon-cloudwatch-agent
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${CompanyName}-${Environment}-EC2Instance'

  # EC2 Instance in private subnet
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Select [0, !Ref PrivateSubnetIds]
      Tags:
        - Key: Name
          Value: !Sub '${CompanyName}-${Environment}-EC2Instance'

Outputs:
  S3BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt SecureS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  S3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  KMSKeyArn:
    Description: 'ARN of the KMS key for S3 encryption'
    Value: !GetAtt S3EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  EC2RoleArn:
    Description: 'ARN of the EC2 IAM role'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2RoleArn'

  RDSInstanceEndpoint:
    Description: 'RDS instance endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  RDSInstanceArn:
    Description: 'ARN of the RDS instance'
    Value: !Sub 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}'
    Export:
      Name: !Sub '${AWS::StackName}-RDSInstanceArn'

  EC2InstanceId:
    Description: 'ID of the EC2 instance'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceId'

  RDSEnhancedMonitoringRoleArn:
    Description: 'ARN of the RDS Enhanced Monitoring role'
    Value: !GetAtt RDSEnhancedMonitoringRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-RDSMonitoringRoleArn'
```
