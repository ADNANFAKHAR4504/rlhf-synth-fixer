# Secure S3 CloudFormation Template

Here's a production-ready CloudFormation template that creates a secure S3 bucket with all the requirements you specified:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 bucket for data science team with VPC endpoint and KMS encryption'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  Environment:
    Type: String
    Description: 'Environment for the deployment'
    AllowedValues:
      - dev
      - prod
    Default: dev

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  # Only create access logging resources in production
  IsProdEnvironment: !Equals [!Ref Environment, prod]

# =============================================================================
# RESOURCES
# =============================================================================
Resources:

  # ---------------------------------------------------------------------------
  # NETWORKING INFRASTRUCTURE
  # ---------------------------------------------------------------------------

  # VPC for secure networking
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'secure-vpc-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Private subnet for VPC endpoint
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway for NAT Gateway connectivity (if needed for updates)
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref SecureVPC

  # Public subnet for NAT Gateway
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateway for outbound internet access from private subnet
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'nat-eip-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Route table for public subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Route to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate public subnet with public route table
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # Route table for private subnet
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Route to NAT Gateway for outbound internet access
  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Associate private subnet with private route table
  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet

  # ---------------------------------------------------------------------------
  # KMS ENCRYPTION KEY
  # ---------------------------------------------------------------------------

  # Custom KMS key for S3 bucket encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for secure S3 bucket encryption - ${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root account full access for management
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

          # Allow DataScientistRole to use the key
          - Sid: Allow DataScientist Role
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/DataScientistRole'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'

          # Allow S3 service to use the key
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 's3-encryption-key-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # KMS key alias for easier reference
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/s3-secure-data-${Environment}'
      TargetKeyId: !Ref S3EncryptionKey

  # ---------------------------------------------------------------------------
  # S3 VPC ENDPOINT
  # ---------------------------------------------------------------------------

  # VPC Endpoint for S3 (Gateway type)
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecureVPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
            Resource:
              - !Sub '${SecureS3Bucket}/*'
              - !GetAtt SecureS3Bucket.Arn

  # ---------------------------------------------------------------------------
  # ACCESS LOGGING BUCKET (PROD ONLY)
  # ---------------------------------------------------------------------------

  # S3 bucket for access logging (only in production)
  AccessLogBucket:
    Type: AWS::S3::Bucket
    Condition: IsProdEnvironment
    Properties:
      BucketName: !Sub 'access-logs-${AWS::AccountId}-${Environment}'
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
          Value: !Sub 'access-logs-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # MAIN SECURE S3 BUCKET
  # ---------------------------------------------------------------------------

  # Main secure S3 bucket for data science team
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-data-${AWS::AccountId}-${Environment}'

      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled

      # KMS encryption using custom key
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true

      # Block all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

      # Enable access logging only in production
      LoggingConfiguration: !If
        - IsProdEnvironment
        - DestinationBucketName: !Ref AccessLogBucket
          LogFilePrefix: 'access-logs/'
        - !Ref AWS::NoValue

      # Lifecycle configuration
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER

      # Enable notifications (can be extended for monitoring)
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Sub '/aws/s3/${AWS::StackName}'

      Tags:
        - Key: Name
          Value: !Sub 'secure-data-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Team
          Value: DataScience

  # ---------------------------------------------------------------------------
  # S3 BUCKET POLICY
  # ---------------------------------------------------------------------------

  # Bucket policy for secure access control
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow DataScientistRole to get and put objects
          - Sid: AllowDataScientistAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/DataScientistRole'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub '${SecureS3Bucket}/*'

          # Explicitly deny delete operations for everyone
          - Sid: DenyDeleteOperations
            Effect: Deny
            Principal: '*'
            Action:
              - s3:DeleteObject
              - s3:DeleteObjectVersion
              - s3:DeleteBucket
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub '${SecureS3Bucket}/*'

          # Force access through VPC endpoint only
          - Sid: DenyAccessOutsideVPC
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt SecureS3Bucket.Arn
              - !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                'aws:SourceVpce': !Ref S3VPCEndpoint
            # Exception for AWS services and root account for management
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'

          # Deny unencrypted uploads
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub '${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3EncryptionKey.Arn

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  BucketArn:
    Description: 'ARN of the secure S3 bucket'
    Value: !GetAtt SecureS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'

  KMSKeyId:
    Description: 'KMS Key ID for bucket encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyAlias:
    Description: 'KMS Key Alias for bucket encryption'
    Value: !Ref S3EncryptionKeyAlias
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyAlias'

  VPCEndpointId:
    Description: 'VPC Endpoint ID for S3 access'
    Value: !Ref S3VPCEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-VPCEndpointId'

  VPCId:
    Description: 'VPC ID for the secure network'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetId'

  AccessLogBucket:
    Condition: IsProdEnvironment
    Description: 'Access log bucket name (prod only)'
    Value: !Ref AccessLogBucket
    Export:
      Name: !Sub '${AWS::StackName}-AccessLogBucket'

  Environment:
    Description: 'Deployment environment'
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

## Key Features Explained

### 🔐 **Security Implementation**

1. **KMS Encryption**: Custom KMS key with restricted access only to `DataScientistRole`
2. **VPC Endpoint**: Forces all S3 access through private network (gateway type)
3. **Bucket Policy**: Comprehensive policy that:
   - Allows only DataScientistRole to get/put objects
   - Blocks delete operations for everyone
   - Forces VPC endpoint usage
   - Denies unencrypted uploads

### 🏗️ **Infrastructure Components**

1. **VPC Setup**: Complete networking stack with public/private subnets
2. **NAT Gateway**: Enables outbound internet access for updates while keeping resources private
3. **Route Tables**: Properly configured routing for both public and private subnets

### 📊 **Environment-Specific Features**

- **Dev Environment**: Basic secure setup without access logging
- **Prod Environment**: Includes access logging bucket with 90-day retention

### 🚀 **Deployment Instructions**

```bash
# Deploy to dev environment
aws cloudformation deploy \
  --template-file secure-s3-template.yaml \
  --stack-name secure-s3-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_IAM

# Deploy to prod environment
aws cloudformation deploy \
  --template-file secure-s3-template.yaml \
  --stack-name secure-s3-prod \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_IAM
```

### ⚠️ **Prerequisites**

Make sure the `DataScientistRole` IAM role exists in your account before deploying this template. If it doesn't exist, you'll need to create it first or modify the template to create the role as well.

This template provides enterprise-grade security while maintaining usability for your data science team!
