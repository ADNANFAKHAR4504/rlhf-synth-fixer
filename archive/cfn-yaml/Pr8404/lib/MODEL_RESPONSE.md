# Secure S3 CloudFormation Template for Data Science Team

Here's a production-ready CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure S3 bucket infrastructure for Data Science team with VPC endpoint and KMS encryption'

# ==============================================================================
# PARAMETERS
# ==============================================================================
Parameters:
  Environment:
    Type: String
    Description: 'Environment type for the deployment'
    AllowedValues:
      - dev
      - prod
    Default: dev
    ConstraintDescription: 'Must be either dev or prod'

# ==============================================================================
# CONDITIONS
# ==============================================================================
Conditions:
  # Only create access logging bucket in production
  IsProdEnvironment: !Equals [!Ref Environment, 'prod']

# ==============================================================================
# RESOURCES
# ==============================================================================
Resources:
  # ------------------------------------------------------------------------------
  # NETWORKING INFRASTRUCTURE
  # ------------------------------------------------------------------------------

  # Main VPC for secure S3 access
  DataScienceVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'datascience-vpc-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Private subnet for secure access
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DataScienceVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'datascience-private-subnet-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Public subnet for NAT Gateway (if needed for other services)
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DataScienceVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'datascience-public-subnet-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'datascience-igw-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref DataScienceVPC

  # Route table for private subnet
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DataScienceVPC
      Tags:
        - Key: Name
          Value: !Sub 'datascience-private-rt-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Route table for public subnet
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DataScienceVPC
      Tags:
        - Key: Name
          Value: !Sub 'datascience-public-rt-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Public route to Internet Gateway
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Associate private subnet with private route table
  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet

  # Associate public subnet with public route table
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # ------------------------------------------------------------------------------
  # VPC ENDPOINT FOR S3
  # ------------------------------------------------------------------------------

  # Gateway VPC Endpoint for S3 - enables private access to S3
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref DataScienceVPC
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
              - s3:DeleteObject
              - s3:ListBucket
            Resource:
              - !Sub '${DataScienceBucket}/*'
              - !Ref DataScienceBucket
            Condition:
              StringEquals:
                'aws:PrincipalArn': !Sub 'arn:aws:iam::${AWS::AccountId}:role/DataScientistRole'

  # ------------------------------------------------------------------------------
  # KMS KEY FOR ENCRYPTION
  # ------------------------------------------------------------------------------

  # Custom KMS key for S3 bucket encryption
  DataScienceKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for Data Science S3 bucket encryption - ${Environment}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root account full access (required)
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
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'datascience-kms-key-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # KMS Key Alias for easier reference
  DataScienceKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/datascience-s3-key-${Environment}'
      TargetKeyId: !Ref DataScienceKMSKey

  # ------------------------------------------------------------------------------
  # ACCESS LOGGING BUCKET (PROD ONLY)
  # ------------------------------------------------------------------------------

  # S3 bucket for access logging (only in production)
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Condition: IsProdEnvironment
    Properties:
      BucketName: !Sub 'secure-datascience-logs-${AWS::AccountId}-${Environment}'
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
          Value: !Sub 'datascience-access-logs-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ------------------------------------------------------------------------------
  # MAIN DATA SCIENCE S3 BUCKET
  # ------------------------------------------------------------------------------

  # Main S3 bucket for data science team
  DataScienceBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-datascience-${AWS::AccountId}-${Environment}'
      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # KMS encryption using custom key
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref DataScienceKMSKey
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
        - DestinationBucketName: !Ref AccessLogsBucket
          LogFilePrefix: 'access-logs/'
        - !Ref 'AWS::NoValue'
      # Lifecycle policy to manage costs
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: TransitionToGlacier
            Status: Enabled
            Transition:
              StorageClass: GLACIER
              TransitionInDays: 90
      # Notification configuration for monitoring
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: s3:ObjectCreated:*
            CloudWatchConfiguration:
              LogGroupName: !Sub '/aws/s3/datascience-${Environment}'
      Tags:
        - Key: Name
          Value: !Sub 'datascience-bucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Team
          Value: DataScience

  # ------------------------------------------------------------------------------
  # BUCKET POLICY
  # ------------------------------------------------------------------------------

  # S3 bucket policy to enforce security requirements
  DataScienceBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref DataScienceBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow DataScientistRole to access bucket objects
          - Sid: AllowDataScientistAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/DataScientistRole'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
              - s3:GetObjectVersion
              - s3:ListBucket
              - s3:GetBucketLocation
            Resource:
              - !Sub '${DataScienceBucket}/*'
              - !Ref DataScienceBucket
          # Deny all access not through VPC endpoint
          - Sid: DenyAccessNotThroughVPCEndpoint
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${DataScienceBucket}/*'
              - !Ref DataScienceBucket
            Condition:
              StringNotEquals:
                'aws:sourceVpce': !Ref S3VPCEndpoint
          # Deny unencrypted uploads
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${DataScienceBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          # Deny uploads without correct KMS key
          - Sid: DenyIncorrectKMSKey
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${DataScienceBucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt DataScienceKMSKey.Arn

# ==============================================================================
# OUTPUTS
# ==============================================================================
Outputs:
  BucketName:
    Description: 'Name of the created S3 bucket'
    Value: !Ref DataScienceBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  BucketArn:
    Description: 'ARN of the created S3 bucket'
    Value: !GetAtt DataScienceBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'

  KMSKeyId:
    Description: 'ID of the KMS key used for bucket encryption'
    Value: !Ref DataScienceKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: 'ARN of the KMS key used for bucket encryption'
    Value: !GetAtt DataScienceKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'

  VPCEndpointId:
    Description: 'ID of the S3 VPC Endpoint'
    Value: !Ref S3VPCEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-VPCEndpointId'

  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref DataScienceVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnetId:
    Description: 'ID of the private subnet'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetId'

  AccessLogsBucket:
    Condition: IsProdEnvironment
    Description: 'Name of the access logs bucket (prod only)'
    Value: !Ref AccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AccessLogsBucket'

  Environment:
    Description: 'Environment type'
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

## Key Features Explained

### **Security Features**

- **VPC Endpoint Enforcement**: All S3 access must go through the VPC endpoint
- **KMS Encryption**: Custom KMS key with restricted access to DataScientistRole only
- **Bucket Policy**: Multi-layered security preventing unauthorized access
- **Public Access Blocked**: Complete prevention of public access

### **Infrastructure Components**

- **VPC**: Dedicated network infrastructure with public/private subnets
- **Gateway VPC Endpoint**: Enables private S3 access without internet routing
- **Route Tables**: Proper routing for secure network traffic

### **Environment Flexibility**

- **Conditional Resources**: Access logging bucket only created in production
- **Dynamic Naming**: Resources named with account ID and environment
- **Lifecycle Policies**: Cost optimization through intelligent tiering

### **Monitoring & Compliance**

- **Access Logging**: Detailed access logs in production environment
- **Versioning**: Object versioning enabled for data protection
- **CloudWatch Integration**: Monitoring for object creation events

## Deployment Instructions

1. **Prerequisites**: Ensure the `DataScientistRole` exists in your AWS account
2. **Deploy Dev**: `aws cloudformation deploy --template-file template.yaml --stack-name datascience-dev --parameter-overrides Environment=dev`
3. **Deploy Prod**: `aws cloudformation deploy --template-file template.yaml --stack-name datascience-prod --parameter-overrides Environment=prod`

This template provides enterprise-grade security while maintaining flexibility for both development and production environments.
