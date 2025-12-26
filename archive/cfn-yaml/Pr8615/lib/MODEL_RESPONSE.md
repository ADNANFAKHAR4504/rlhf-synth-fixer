# Secure AWS Infrastructure CloudFormation Template

Here's a comprehensive CloudFormation YAML template that meets all your security requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with VPC, EC2, RDS, S3, CloudWatch, and CloudTrail'

Parameters:
  AllowedSSHCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access to EC2 instances'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
  
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

Resources:
  # KMS Key for encryption
  SecureKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for encrypting sensitive data'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow S3 service to use the key
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  SecureKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secure-infrastructure-key
      TargetKeyId: !Ref SecureKMSKey

  # VPC Configuration
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: SecureVPC

  # Internet Gateway
  SecureInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecureIGW

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref SecureInternetGateway

  # Public Subnet
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: 'us-west-2a'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: PublicSubnet

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: 'us-west-2a'
      Tags:
        - Key: Name
          Value: PrivateSubnet1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: 'us-west-2b'
      Tags:
        - Key: Name
          Value: PrivateSubnet2

  # Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: PublicRouteTable

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref SecureInternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances with restricted SSH access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from allowed CIDR'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: EC2SecurityGroup

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances'
      Tags:
        - Key: Name
          Value: RDSSecurityGroup

  # IAM Roles
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
      Policies:
        - PolicyName: EC2S3AccessPolicy
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
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecureKMSKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # CloudTrail Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
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
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'

  # S3 Buckets
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-app-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureKMSKey
            BucketKeyEnabled: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'access-logs/'
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

  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureKMSKey
            BucketKeyEnabled: true
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: 'cloudtrail-access-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'access-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # S3 Bucket Policies
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
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
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: DBSubnetGroup

  # RDS Instance
  SecureRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: secure-database
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref SecureKMSKey
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: SecureRDSInstance

  # EC2 Instance
  SecureEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c2d3e23b7b644f0b  # Amazon Linux 2023 in us-west-2
      InstanceType: t3.micro
      KeyName: !Ref EC2KeyPair
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
      Tags:
        - Key: Name
          Value: SecureEC2Instance

  # EC2 Key Pair
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub 'secure-keypair-${AWS::StackName}'
      KeyType: rsa

  # CloudWatch Log Groups
  EC2LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/ec2/secure-instance'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecureKMSKey.Arn

  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/rds/instance/secure-database/error'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecureKMSKey.Arn

  S3LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/s3/secure-bucket'
      RetentionInDays: 30
      KmsKeyId: !GetAtt SecureKMSKey.Arn

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/cloudtrail/secure-trail'
      RetentionInDays: 90
      KmsKeyId: !GetAtt SecureKMSKey.Arn

  # CloudTrail
  SecureCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: SecureInfrastructureTrail
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecureKMSKey
      CloudWatchLogsLogGroupArn: !Sub '${CloudTrailLogGroup}:*'
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${SecureS3Bucket}/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - !Ref SecureS3Bucket

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  EC2InstanceId:
    Description: 'EC2 Instance ID'
    Value: !Ref SecureEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-ID'

  RDSEndpoint:
    Description: 'RDS Endpoint'
    Value: !GetAtt SecureRDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref SecureKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt SecureCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
```

## Key Security Features Implemented

### **IAM Roles & Least Privilege**
- **EC2 Role**: Limited to specific S3 bucket access, CloudWatch logging, and KMS operations
- **CloudTrail Role**: Only CloudWatch Logs permissions
- All roles follow the principle of least privilege

### **Encryption with AWS KMS**
- Custom KMS key created for all encryption needs
- **S3 buckets**: Encrypted at rest with KMS key
- **RDS database**: Encrypted at rest with KMS key
- **CloudWatch Logs**: Encrypted with KMS key

### **Network Security**
- **EC2 Security Group**: SSH restricted to specified CIDR block only
- **RDS Security Group**: Database access only from EC2 security group
- Private subnets for RDS with no internet access

### **Comprehensive Logging & Auditing**
- **S3 Access Logging**: Enabled for all buckets
- **CloudTrail**: Captures all API activity with encryption
- **CloudWatch Logs**: Separate log groups for each service
- **RDS Logging**: Error, general, and slow query logs enabled

### **Additional Security Measures**
- S3 public access blocked on all buckets
- S3 versioning enabled
- RDS deletion protection enabled
- Multi-AZ disabled for cost optimization (can be enabled for production)
- Backup retention configured for RDS

## Deployment Instructions

1. **Prerequisites**: Ensure you have appropriate AWS CLI credentials and permissions
2. **Parameters**: Update the `AllowedSSHCIDR` parameter to your specific IP range
3. **Database Password**: Provide a secure password for the RDS instance
4. **Deploy**: Use AWS CLI or Console to deploy this template

```bash
aws cloudformation create-stack \
  --stack-name secure-infrastructure \
  --template-body file://template.yaml \
  --parameters ParameterKey=AllowedSSHCIDR,ParameterValue="YOUR_IP/32" \
               ParameterKey=DBPassword,ParameterValue="YourSecurePassword123" \
  --capabilities CAPABILITY_IAM \
  --region us-west-2
```

This template creates a production-ready, secure AWS infrastructure that meets all your specified requirements and security constraints.