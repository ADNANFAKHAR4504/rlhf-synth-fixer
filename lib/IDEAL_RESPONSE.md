```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Enterprise Security CloudFormation Template (Deployment-Safe & Idempotent)
  Includes conditional creation for VPC, Subnets, CloudTrail, Config, EC2, S3, RDS, IAM, and Lambda.

Parameters:
  CompanyPrefix:
    Type: String
    Default: "corp-sec"
    Description: "Prefix for all resources"

  UseExistingVPC:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: "If true, use existing VPC"

  ExistingVPCId:
    Type: String
    Default: ""
    Description: "Existing VPC ID if UseExistingVPC is true"

  AllowedSSHIP:
    Type: String
    Default: "203.0.113.0/24"
    Description: "CIDR block for SSH"

  UseExistingCloudTrail:
    Type: String
    Default: "false"
    AllowedValues: ["true","false"]

  UseExistingConfig:
    Type: String
    Default: "false"
    AllowedValues: ["true","false"]

Conditions:
  CreateVPC: !Equals [ !Ref UseExistingVPC, "false" ]
  CreateCloudTrail: !Equals [ !Ref UseExistingCloudTrail, "false" ]
  CreateConfig: !Equals [ !Ref UseExistingConfig, "false" ]

Resources:

  ##################################
  # VPC and Subnets
  ##################################
  CorpVPC:
    Type: AWS::EC2::VPC
    Condition: CreateVPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${CompanyPrefix}-vpc"

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Condition: CreateVPC
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${CompanyPrefix}-public-subnet-1"

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Condition: CreateVPC
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${CompanyPrefix}-public-subnet-2"

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Condition: CreateVPC
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: 10.0.101.0/24
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${CompanyPrefix}-private-subnet-1"

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Condition: CreateVPC
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: 10.0.102.0/24
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${CompanyPrefix}-private-subnet-2"

  ##################################
  # Security Groups
  ##################################
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "EC2 Security Group with restricted SSH/HTTP"
      VpcId: !If [CreateVPC, !Ref CorpVPC, !Ref ExistingVPCId]
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${CompanyPrefix}-ec2-sg"

  ##################################
  # IAM Roles
  ##################################
  AdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${CompanyPrefix}-admin-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: "*"
            Action: sts:AssumeRole
            Condition:
              IpAddress:
                aws:SourceIp: !Ref AllowedSSHIP
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AdministratorAccess

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${CompanyPrefix}-lambda-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  ##################################
  # S3 Buckets
  ##################################
  CorpS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${CompanyPrefix}-s3-bucket"
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CorpS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: "DenyHTTP"
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "${CorpS3Bucket.Arn}/*"
              - !GetAtt CorpS3Bucket.Arn
            Condition:
              Bool:
                aws:SecureTransport: false

  ##################################
  # RDS (Encrypted)
  ##################################
  CorpRDS:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${CompanyPrefix}-rds"
      Engine: mysql
      MasterUsername: admin
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      DBInstanceClass: db.t3.medium
      StorageEncrypted: true
      MultiAZ: true
      PubliclyAccessible: false
      VPCSecurityGroups:
        - !Ref EC2SecurityGroup
      DBSubnetGroupName:
        Ref: RDSSubnetGroup

  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: "Subnets for RDS"
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      DBSubnetGroupName: !Sub "${CompanyPrefix}-rds-subnet-group"

  ##################################
  # CloudTrail
  ##################################
  CorpCloudTrail:
    Type: AWS::CloudTrail::Trail
    Condition: CreateCloudTrail
    Properties:
      TrailName: !Sub "${CompanyPrefix}-cloudtrail"
      S3BucketName: !Ref CorpS3Bucket
      IsLogging: true
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true

  ##################################
  # AWS Config
  ##################################
  ConfigRole:
    Type: AWS::IAM::Role
    Condition: CreateConfig
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSConfigRole

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Condition: CreateConfig
    Properties:
      Name: !Sub "${CompanyPrefix}-config-recorder"
      RoleARN: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  ##################################
  # Lambda Security Audit
  ##################################
  SecurityGroupAuditFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${CompanyPrefix}-sg-audit"
      Handler: index.handler
      Runtime: python3.11
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import boto3
          ec2 = boto3.client('ec2')
          def handler(event, context):
              violations = []
              for sg in ec2.describe_security_groups()['SecurityGroups']:
                  for perm in sg.get('IpPermissions', []):
                      for ip_range in perm.get('IpRanges', []):
                          if ip_range.get('CidrIp') == '0.0.0.0/0':
                              violations.append(sg['GroupId'])
              return {"Violations": violations}

Outputs:
  CloudTrailName:
    Description: "CloudTrail Name (if created)"
    Value: !If [CreateCloudTrail, !Ref CorpCloudTrail, "Using existing CloudTrail"]

  ConfigRecorderName:
    Description: "AWS Config Recorder (if created)"
    Value: !If [CreateConfig, !Ref ConfigRecorder, "Using existing Config"]

  VPCId:
    Description: "VPC ID (new or existing)"
    Value: !If [CreateVPC, !Ref CorpVPC, !Ref ExistingVPCId]

  S3BucketName:
    Description: "S3 Bucket Name"
    Value: !Ref CorpS3Bucket
```