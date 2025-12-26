# AWS CloudFormation Secure Infrastructure - Ideal Response

## CloudFormation YAML Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Secure infrastructure with IAM roles, CloudTrail, VPC subnets, S3 encryption, and EC2 monitoring for compliance"

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    Default: "dev"
    MinLength: 2
    MaxLength: 10
    AllowedPattern: "^[a-zA-Z0-9-]+$"
    ConstraintDescription: "Must be 2-10 characters, alphanumeric and hyphens only"

  ExistingVPCId:
    Type: String
    Description: "Existing VPC ID with CIDR 10.0.0.0/16 (defaults to secure-infrastructure-dev-vpc if not provided)"
    Default: "vpc-0052878ec128b229f"
    AllowedPattern: "^vpc-[a-f0-9]+$"
    ConstraintDescription: "Must be a valid VPC ID starting with vpc-"

  AvailabilityZones:
    Type: CommaDelimitedList
    Description: "Availability Zones for subnets"
    Default: "us-east-1a,us-east-1b"

  PublicKeyName:
    Type: String
    Description: "EC2 Key Pair for SSH access (optional - leave empty if no SSH access needed)"
    Default: ""
    AllowedPattern: "^$|^[a-zA-Z0-9_-]+$"
    ConstraintDescription: "Must be empty or a valid key pair name"

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

  ExistingCloudTrailName:
    Type: String
    Description: "Name of existing CloudTrail to use (e.g., CloudTrail-pr797, prod-financial-trail)"
    Default: "CloudTrail-pr797"
    AllowedPattern: "^[a-zA-Z0-9_-]+$"
    ConstraintDescription: "Must be a valid CloudTrail name"

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
          Value: !Sub "my-app-s3-kms-key-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "S3 bucket encryption"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/my-app/s3-${EnvironmentSuffix}"
      TargetKeyId: !Ref S3KMSKey

  # S3 Bucket for application data
  AppS3Bucket:
    Type: AWS::S3::Bucket
    Condition: CreateS3BucketCondition
    Properties:
      BucketName: !Sub "my-app-bucket-${EnvironmentSuffix}"
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
          Value: !Sub "my-app-bucket-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "Application data storage"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
              - !GetAtt AppS3Bucket.Arn
              - !Sub "arn:aws:s3:::${AppS3Bucket}/*"
            Condition:
              Bool:
                aws:SecureTransport: false

  # S3 Bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "my-app-cloudtrail-logs-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}"
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
          Value: !Sub "my-app-cloudtrail-logs-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "CloudTrail log storage"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          - Sid: "AWSCloudTrailWrite"
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:aws:s3:::${CloudTrailLogsBucket}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: "DenyNonSSLRequests"
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt CloudTrailLogsBucket.Arn
              - !Sub "arn:aws:s3:::${CloudTrailLogsBucket}/*"
            Condition:
              Bool:
                aws:SecureTransport: false

  # IAM Role for S3 read access
  S3ReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
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
          Value: !Sub "my-app-Role-ReadS3-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "S3 read-only access"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IAM Policy for S3 read-only access
  S3ReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: "S3ReadOnlyPolicy"
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
              - !Sub "arn:aws:s3:::my-app-bucket-${EnvironmentSuffix}"
              - !Sub "arn:aws:s3:::my-app-bucket-${EnvironmentSuffix}/*"
            Condition:
              Bool:
                aws:SecureTransport: true

  # IAM Instance Profile for EC2
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref S3ReadOnlyRole

  # Subnet 1
  SubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [0, !Ref AvailabilityZones]
      CidrBlock: "10.0.30.0/24"
      Tags:
        - Key: Name
          Value: !Sub "my-app-Subnet-A-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "Application subnet"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Subnet 2
  SubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ExistingVPCId
      AvailabilityZone: !Select [1, !Ref AvailabilityZones]
      CidrBlock: "10.0.40.0/24"
      Tags:
        - Key: Name
          Value: !Sub "my-app-Subnet-B-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "Application subnet"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
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
          Value: !Sub "my-app-EC2SecurityGroup-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "EC2 instance security"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Sample EC2 Instance with detailed monitoring
  SampleEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI in us-east-1
      InstanceType: t3.micro
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Ref SubnetA
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true # Enable detailed monitoring
      KeyName: !If [HasKeyPair, !Ref PublicKeyName, !Ref "AWS::NoValue"]
      Tags:
        - Key: Name
          Value: !Sub "my-app-SampleEC2-${EnvironmentSuffix}"
        - Key: Purpose
          Value: "Sample instance with monitoring"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Conditions:
  CreateS3BucketCondition: !Equals [!Ref CreateS3Bucket, "true"]
  HasKeyPair: !Not [!Equals [!Ref PublicKeyName, ""]]

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
        !Sub "my-app-bucket-${EnvironmentSuffix} (existing)",
      ]
    Export:
      Name: !Sub "${AWS::StackName}-S3BucketName"

  CloudTrailName:
    Description: "Name of the existing CloudTrail being used"
    Value: !Ref ExistingCloudTrailName
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
    Value: !Sub "aws cloudformation deploy --template-file lib/TapStack.yml --stack-name my-app-secure-infra-${EnvironmentSuffix} --parameter-overrides EnvironmentSuffix=${EnvironmentSuffix} --capabilities CAPABILITY_NAMED_IAM"
```
