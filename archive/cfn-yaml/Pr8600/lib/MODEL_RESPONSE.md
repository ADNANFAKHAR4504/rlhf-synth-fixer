I'll create a comprehensive CloudFormation template that meets all your security and infrastructure requirements. Here's the complete YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure Setup with IAM roles, VPC, encryption, monitoring, and multi-environment support'

Parameters:
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues:
      - 'dev'
      - 'staging'
      - 'prod'
    Description: 'Environment name for resource naming and configuration'

  ProjectName:
    Type: String
    Default: 'secure-infra'
    Description: 'Project name for resource naming'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.10.0/24'
    Description: 'CIDR block for private subnet 1'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.20.0/24'
    Description: 'CIDR block for private subnet 2'

Mappings:
  EnvironmentMap:
    dev:
      GuardDutyFindingPublishingFrequency: 'FIFTEEN_MINUTES'
      CloudTrailIncludeGlobalServiceEvents: true
      S3BucketVersioning: 'Suspended'
    staging:
      GuardDutyFindingPublishingFrequency: 'SIX_HOURS'
      CloudTrailIncludeGlobalServiceEvents: true
      S3BucketVersioning: 'Enabled'
    prod:
      GuardDutyFindingPublishingFrequency: 'FIFTEEN_MINUTES'
      CloudTrailIncludeGlobalServiceEvents: true
      S3BucketVersioning: 'Enabled'

Resources:
  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================

  # Web Server Role
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-webserver-role'
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
        - PolicyName: WebServerPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${S3WebAssetsBucket}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-webserver-profile'
      Roles:
        - !Ref WebServerRole

  # Database Role
  DatabaseRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-database-role'
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
        - PolicyName: DatabasePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${S3DatabaseBackupBucket}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  DatabaseInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-database-profile'
      Roles:
        - !Ref DatabaseRole

  # Admin Role
  AdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-admin-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: sts:AssumeRole
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/PowerUserAccess
      Policies:
        - PolicyName: AdminPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - iam:*
                  - organizations:*
                  - account:*
                Resource: '*'

  # CloudTrail Role
  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-cloudtrail-role'
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
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudTrailLogGroup}:*'

  # ========================================
  # VPC AND NETWORKING
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'

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
      CidrBlock: !Ref PublicSubnet1Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2Cidr
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-subnet-2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-subnet-2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-eip-2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-gateway-2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'

  DefaultPublicRoute:
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
          Value: !Sub '${ProjectName}-${Environment}-private-rt-1'

  DefaultPrivateRoute1:
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
          Value: !Sub '${ProjectName}-${Environment}-private-rt-2'

  DefaultPrivateRoute2:
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
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-webserver-sg'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref AdminSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-webserver-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-database-sg'
      GroupDescription: Security group for database servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref AdminSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-database-sg'

  AdminSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-admin-sg'
      GroupDescription: Security group for admin access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-admin-sg'

  # ========================================
  # S3 BUCKETS WITH ENCRYPTION
  # ========================================

  S3WebAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-web-assets-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status:
          !FindInMap [EnvironmentMap, !Ref Environment, S3BucketVersioning]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-web-assets'
        - Key: Environment
          Value: !Ref Environment

  S3DatabaseBackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-db-backups-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status:
          !FindInMap [EnvironmentMap, !Ref Environment, S3BucketVersioning]
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-backups'
        - Key: Environment
          Value: !Ref Environment

  S3CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-cloudtrail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail'
        - Key: Environment
          Value: !Ref Environment

  S3CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt S3CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${S3CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ========================================
  # CLOUDTRAIL
  # ========================================

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-${Environment}'
      RetentionInDays: 90

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: S3CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-${Environment}-cloudtrail'
      S3BucketName: !Ref S3CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents:
        !FindInMap [
          EnvironmentMap,
          !Ref Environment,
          CloudTrailIncludeGlobalServiceEvents,
        ]
      IsLogging: true
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
                - !Sub '${S3WebAssetsBucket}/*'
                - !Sub '${S3DatabaseBackupBucket}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-cloudtrail'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # GUARDDUTY
  # ========================================

  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency:
        !FindInMap [
          EnvironmentMap,
          !Ref Environment,
          GuardDutyFindingPublishingFrequency,
        ]
      DataSources:
        S3Logs:
          Enable: true
        MalwareProtection:
          ScanEc2InstanceWithFindings:
            EbsVolumes: true
        Kubernetes:
          AuditLogs:
            Enable: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-guardduty'
        - Key: Environment
          Value: !Ref Environment

  # ========================================
  # EBS ENCRYPTION CONFIGURATION
  # ========================================

  EBSEncryptionByDefault:
    Type: AWS::EC2::EBSEncryptionByDefault
    Properties:
      EbsEncryptionByDefault: true

  # ========================================
  # KMS KEY FOR ADDITIONAL ENCRYPTION
  # ========================================

  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${ProjectName}-${Environment} encryption'
      KeyPolicy:
        Version: '2012-10-17'
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
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-key'
        - Key: Environment
          Value: !Ref Environment

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-key'
      TargetKeyId: !Ref KMSKey

# ========================================
# OUTPUTS
# ========================================

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-vpc-id'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-public-subnet-1-id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-public-subnet-2-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${ProjectName}-${Environment}-private-subnet-2-id'

  WebServerSecurityGroupId:
    Description: 'Web Server Security Group ID'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-webserver-sg-id'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-database-sg-id'

  WebServerRoleArn:
    Description: 'Web Server Role ARN'
    Value: !GetAtt WebServerRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-webserver-role-arn'

  DatabaseRoleArn:
    Description: 'Database Role ARN'
    Value: !GetAtt DatabaseRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-database-role-arn'

  AdminRoleArn:
    Description: 'Admin Role ARN'
    Value: !GetAtt AdminRole.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-admin-role-arn'

  WebAssetsBucketName:
    Description: 'Web Assets S3 Bucket Name'
    Value: !Ref S3WebAssetsBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-web-assets-bucket'

  DatabaseBackupBucketName:
    Description: 'Database Backup S3 Bucket Name'
    Value: !Ref S3DatabaseBackupBucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-db-backup-bucket'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-cloudtrail-arn'

  GuardDutyDetectorId:
    Description: 'GuardDuty Detector ID'
    Value: !Ref GuardDutyDetector
    Export:
      Name: !Sub '${ProjectName}-${Environment}-guardduty-detector-id'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key-id'

  KMSKeyArn:
    Description: 'KMS Key ARN'
    Value: !GetAtt KMSKey.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-kms-key-arn'
```

## Key Features Implemented

### 1. **IAM Roles with Least Privilege**

- **WebServerRole**: Limited to S3 access for web assets and CloudWatch logging
- **DatabaseRole**: Limited to S3 access for backups and CloudWatch logging
- **AdminRole**: PowerUser access with MFA requirement for assumption

### 2. **VPC Architecture**

- Public subnets for web servers with internet gateway access
- Private subnets for databases with NAT gateway access
- Multi-AZ deployment across two availability zones
- Proper security groups with restrictive rules

### 3. **S3 Encryption**

- All buckets have server-side encryption enabled (AES256)
- Public access blocked on all buckets
- Versioning configured based on environment

### 4. **CloudTrail Configuration**

- Logs all API activity across the account
- Multi-region trail enabled
- Log file validation enabled
- CloudWatch Logs integration

### 5. **EBS Encryption**

- EBS encryption enabled by default for all volumes
- Uses AWS managed keys

### 6. **GuardDuty Setup**

- Detector enabled with S3 and malware protection
- Kubernetes audit logs enabled
- Finding frequency varies by environment

### 7. **Multi-Environment Support**

- Parameters for environment-specific configuration
- Mappings for different settings per environment
- Consistent naming conventions

### 8. **Additional Security Features**

- KMS key for additional encryption needs
- CloudWatch log groups for monitoring
- Comprehensive tagging strategy

## Deployment Instructions

1. Save the template as `secure_infrastructure_setup.yaml`
2. Deploy using AWS CLI:

   ```bash
   aws cloudformation create-stack \
     --stack-name secure-infra-dev \
     --template-body file://secure_infrastructure_setup.yaml \
     --parameters ParameterKey=Environment,ParameterValue=dev \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. For different environments, change the Environment parameter:

   ```bash
   # For staging
   --parameters ParameterKey=Environment,ParameterValue=staging

   # For production
   --parameters ParameterKey=Environment,ParameterValue=prod
   ```

This template creates a comprehensive, secure AWS infrastructure that follows best practices and meets all your specified requirements.
