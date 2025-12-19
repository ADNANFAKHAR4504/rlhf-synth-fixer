```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security-focused CloudFormation template enforcing best practices across AWS services'

# Parameters for configurable values
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name for resource tagging and naming

  Owner:
    Type: String
    Description: Team or individual responsible for these resources
    Default: 'devops-team'
    MinLength: 1

  Project:
    Type: String
    Description: Project name for resource identification
    MinLength: 1
    Default: 'security-best-practice'

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([0-9]|[1-2][0-9]|3[0-2])$'

  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for private subnet 1

  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for private subnet 2

  KmsKeyAlias:
    Type: String
    Default: security-config-key
    Description: Alias for the KMS key used for encryption

# Resources section with security-focused configurations
Resources:
  # KMS Key for S3 encryption and other services (simplified policy to break circular dependency)
  SecurityKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Project} ${Environment} encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow root account full access for key management
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          # Allow S3 service to use the key for encryption
          - Sid: Allow S3 Service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
          # Allow Lambda service to use the key (using service principal instead of role ARN)
          - Sid: Allow Lambda Service
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'
          # Allow CloudWatch Logs service to use the key for encryption
          - Sid: Allow CloudWatch Logs Service
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Project}-${Environment}-secure-function'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-kms-key'

  # KMS Key Alias for easier reference
  SecurityKmsKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${KmsKeyAlias}-${Environment}'
      TargetKeyId: !Ref SecurityKmsKey

  # VPC for Lambda functions with security controls
  SecurityVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-vpc'

  # Private subnet 1 for Lambda functions
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecurityVpc
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false # Security: No public IPs
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-subnet-1'

  # Private subnet 2 for Lambda functions (multi-AZ for resilience)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecurityVpc
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false # Security: No public IPs
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-subnet-2'

  # Security group for Lambda functions with restrictive rules
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions with minimal access
      VpcId: !Ref SecurityVpc
      # No ingress rules - Lambda functions don't need inbound access
      SecurityGroupEgress:
        # Allow HTTPS outbound for AWS API calls
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS outbound for AWS services
        # Allow DNS resolution
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
          Description: DNS resolution
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-lambda-sg'

  # VPC Endpoint for S3 to allow Lambda to access S3 without internet
  S3VpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref SecurityVpc
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  # Route table for private subnets
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecurityVpc
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-private-rt'

  # Associate private subnet 1 with route table
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  # Associate private subnet 2 with route table
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # IAM role for Lambda execution with least privilege (moved before S3 bucket)
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic execution role for VPC Lambda
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        # Policy for KMS key usage
        - PolicyName: KmsAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecurityKmsKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # S3 bucket with enforced encryption and security policies
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Project}-${Environment}-secure-bucket-${AWS::AccountId}'
      # Enable versioning for data protection
      VersioningConfiguration:
        Status: Enabled
      # Server-side encryption configuration
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKmsKey
            BucketKeyEnabled: true # Cost optimization
      # Block all public access
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Lifecycle configuration for cost optimization
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project
        - Key: Name
          Value: !Sub '${Project}-${Environment}-secure-bucket'

  # S3 bucket policy enforcing encryption and access controls
  SecureS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Deny unencrypted uploads
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          # Deny uploads without the correct KMS key
          - Sid: DenyIncorrectEncryptionKey
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt SecurityKmsKey.Arn
          # Deny insecure transport
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${SecureS3Bucket}'
              - !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # Additional IAM policy for S3 access (attached after S3 bucket is created)
  LambdaS3AccessPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: S3AccessPolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
            Resource: !Sub '${SecureS3Bucket.Arn}/*'
          - Effect: Allow
            Action:
              - s3:ListBucket
            Resource: !GetAtt SecureS3Bucket.Arn
      Roles:
        - !Ref LambdaExecutionRole

  # Sample Lambda function deployed in VPC
  SecureLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Project}-${Environment}-secure-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3

          def lambda_handler(event, context):
              # Sample function that interacts with S3
              s3_client = boto3.client('s3')
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Secure Lambda function executed successfully',
                      'environment': 'VPC-enabled'
                  })
              }
      # VPC Configuration for security
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          BUCKET_NAME: !Ref SecureS3Bucket
          KMS_KEY_ID: !Ref SecurityKmsKey
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # CloudWatch Log Group for Lambda with encryption
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Project}-${Environment}-secure-function'
      RetentionInDays: 14
      KmsKeyId: !GetAtt SecurityKmsKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

# Outputs for reference by other stacks or applications
Outputs:
  VpcId:
    Description: ID of the created VPC
    Value: !Ref SecurityVpc
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  PrivateSubnet1Id:
    Description: ID of private subnet 1
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: ID of private subnet 2
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  SecurityGroupId:
    Description: ID of the Lambda security group
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-LambdaSecurityGroupId'

  KmsKeyId:
    Description: ID of the KMS key for encryption
    Value: !Ref SecurityKmsKey
    Export:
      Name: !Sub '${AWS::StackName}-KmsKeyId'

  KmsKeyArn:
    Description: ARN of the KMS key for encryption
    Value: !GetAtt SecurityKmsKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KmsKeyArn'

  S3BucketName:
    Description: Name of the secure S3 bucket
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  LambdaFunctionArn:
    Description: ARN of the secure Lambda function
    Value: !GetAtt SecureLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  LambdaExecutionRoleArn:
    Description: ARN of the Lambda execution role
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleArn'
```
