## IDEAL RESPONSE

This document contains the ideal CloudFormation template response for the secure infrastructure requirements. The template implements all required components including IAM roles with minimal permissions, multi-region CloudTrail logging, VPC subnets in different availability zones, S3 bucket encryption with KMS, and EC2 instances with detailed monitoring. All resources follow the my-app-* naming convention and adhere to security best practices including least privilege access, encryption at rest, and compliance logging.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure infrastructure with IAM roles, CloudTrail, VPC subnets, S3 encryption, and EC2 monitoring for compliance"

Parameters:
  ExistingVPCId:
    Type: AWS::EC2::VPC::Id
    Description: "Existing VPC ID with CIDR 10.0.0.0/16"
    ConstraintDescription: "Must be a valid VPC ID"

  AvailabilityZones:
    Type: CommaDelimitedList
    Description: "Availability Zones for subnets"
    Default: "us-east-1a,us-east-1b"

  PublicKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: "EC2 Key Pair for SSH access"
    Default: ""

  AssumeRoleService:
    Type: String
    Description: "Service that will assume the IAM role"
    Default: "ec2.amazonaws.com"
    AllowedValues: ["ec2.amazonaws.com", "lambda.amazonaws.com"]

  CreateS3Bucket:
    Type: String
    Description: "Whether to create the my-app-bucket or use existing"
    Default: "true"
    AllowedValues: ["true", "false"]

Resources:
  # KMS Customer Master Key for S3 encryption
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: "KMS key for S3 bucket encryption"
      EnableKeyRotation: true
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: "Enable IAM User Permissions"
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
          - Sid: "Allow CloudFormation to use the key"
            Effect: Allow
            Principal:
              Service: cloudformation.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
            Resource: "*"
          - Sid: "Allow S3 to use the key for encryption"
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
            Resource: "*"
      Tags:
        - Key: Name
          Value: "my-app-s3-kms-key"
        - Key: Purpose
          Value: "S3 bucket encryption"

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: "alias/my-app/s3"
      TargetKeyId: !Ref S3KMSKey

  # S3 Bucket for application data
  AppS3Bucket:
    Type: AWS::S3::Bucket
    Condition: CreateS3BucketCondition
    Properties:
      BucketName: "my-app-bucket"
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
        - Key: Name
          Value: "my-app-bucket"
        - Key: Purpose
          Value: "Application data storage"

  # S3 Bucket Policy for application bucket
  AppS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: CreateS3BucketCondition
    Properties:
      Bucket: !Ref AppS3Bucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: "DenyNonSSLRequests"
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${AppS3Bucket}"
              - !Sub "${AppS3Bucket}/*"
            Condition:
              Bool:
                aws:SecureTransport: false

  # S3 Bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "my-app-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}"
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
        - Key: Name
          Value: "my-app-cloudtrail-logs"
        - Key: Purpose
          Value: "CloudTrail log storage"

  # S3 Bucket Policy for CloudTrail logs
  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: "AWSCloudTrailAclCheck"
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "${CloudTrailLogsBucket}"
          - Sid: "AWSCloudTrailWrite"
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: "DenyNonSSLRequests"
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${CloudTrailLogsBucket}"
              - !Sub "${CloudTrailLogsBucket}/*"
            Condition:
              Bool:
                aws:SecureTransport: false

  # CloudTrail for multi-region logging
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: "my-app-cloudtrail"
      S3BucketName: !Ref CloudTrailLogsBucket
      S3KeyPrefix: "AWSLogs"
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      IsLogging: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref S3KMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: "my-app-cloudtrail"
        - Key: Purpose
          Value: "Compliance logging"

  # IAM Role for S3 read access
  S3ReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: "my-app-Role-ReadS3"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: !Ref AssumeRoleService
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Name
          Value: "my-app-Role-ReadS3"
        - Key: Purpose
          Value: "S3 read-only access"

  # IAM Policy for S3 read-only access
  S3ReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: "my-app-S3ReadOnlyPolicy"
      Roles:
        - !Ref S3ReadOnlyRole
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: "S3ReadOnlyAccess"
            Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource:
              - "arn:aws:s3:::my-app-bucket"
              - "arn:aws:s3:::my-app-bucket/*"
            Condition:
              Bool:
                aws:SecureTransport: true

  # IAM Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: "my-app-EC2InstanceProfile"
      Roles:
        - !Ref S3ReadOnlyRole

  # Subnet 1
  SubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [0, !Ref AvailabilityZones]
      CidrBlock: "10.0.1.0/24"
      Tags:
        - Key: Name
          Value: "my-app-Subnet-A"
        - Key: Purpose
          Value: "Application subnet"

  # Subnet 2
  SubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [1, !Ref AvailabilityZones]
      CidrBlock: "10.0.2.0/24"
      Tags:
        - Key: Name
          Value: "my-app-Subnet-B"
        - Key: Purpose
          Value: "Application subnet"

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: "my-app-EC2SecurityGroup"
      GroupDescription: "Security group for EC2 instances"
      VpcId: !Ref ExistingVPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: "SSH access"
      Tags:
        - Key: Name
          Value: "my-app-EC2SecurityGroup"
        - Key: Purpose
          Value: "EC2 instance security"

  # Sample EC2 Instance with detailed monitoring
  SampleEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI in us-east-1
      InstanceType: t3.micro
      KeyName: !Ref PublicKeyName
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Ref SubnetA
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true # Enable detailed monitoring
      Tags:
        - Key: Name
          Value: "my-app-SampleEC2"
        - Key: Purpose
          Value: "Sample instance with monitoring"

Conditions:
  CreateS3BucketCondition: !Equals [!Ref CreateS3Bucket, "true"]

Outputs:
  S3KMSKeyArn:
    Description: "ARN of the KMS key used for S3 encryption"
    Value: !GetAtt S3KMSKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-S3KMSKeyArn"

  S3BucketName:
    Description: "Name of the S3 bucket"
    Value:
      !If [
        CreateS3BucketCondition,
        !Ref AppS3Bucket,
        "my-app-bucket (existing)",
      ]
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketName"

  CloudTrailName:
    Description: "Name of the CloudTrail"
    Value: !Ref CloudTrail
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailName"

  IAMRoleArn:
    Description: "ARN of the IAM role for S3 read access"
    Value: !GetAtt S3ReadOnlyRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-IAMRoleArn"

  SubnetAId:
    Description: "ID of Subnet A"
    Value: !Ref SubnetA
    Export:
      Name: !Sub "${AWS::StackName}-SubnetAId"

  SubnetBId:
    Description: "ID of Subnet B"
    Value: !Ref SubnetB
    Export:
      Name: !Sub "${AWS::StackName}-SubnetBId"

  SampleEC2InstanceId:
    Description: "ID of the sample EC2 instance"
    Value: !Ref SampleEC2Instance
    Export:
      Name: !Sub "${AWS::StackName}-SampleEC2InstanceId"

  DeploymentCommand:
    Description: "Command to deploy this stack"
    Value: !Sub "aws cloudformation deploy --template-file template.yaml --stack-name my-app-secure-infra --parameter-overrides ExistingVPCId=${ExistingVPCId} --capabilities CAPABILITY_NAMED_IAM"
```
