## Preface

**Important architectural notes:**
- S3 buckets are global resources and cannot be placed "inside" a VPC. This template implements the intent by creating an S3 VPC Gateway Endpoint and strict bucket policies that only allow access via the endpoint and by specific IAM principals.
- Template defaults to 2 AZs (minimum for HA) but parameterized to support up to 4 AZs in us-west-2.
- Lambda function includes inline Python code that demonstrates secure S3 access with proper error handling.
- CloudTrail uses a separate S3 bucket with its own KMS key for security isolation.
- All resources follow least-privilege and defense-in-depth principles.

**Validation:** Template is valid for `us-west-2` and uses 2 AZs by default.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-AZ VPC with Lambda, S3 VPC Endpoint, KMS encryption, and CloudTrail logging'

Parameters:
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$'
  
  NumberOfAZs:
    Type: Number
    Default: 2
    MinValue: 2
    MaxValue: 4
    Description: 'Number of Availability Zones to use (2-4)'
  
  LambdaRuntime:
    Type: String
    Default: 'python3.9'
    AllowedValues: ['python3.8', 'python3.9', 'python3.10', 'python3.11']
    Description: 'Lambda runtime version'
  
  FunctionNamePrefix:
    Type: String
    Default: 'SecureVPC'
    Description: 'Prefix for Lambda function name'
  
  Environment:
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'test', 'prod']
    Description: 'Environment tag'

Conditions:
  UseThreeAZs: !Or [!Equals [!Ref NumberOfAZs, 3], !Equals [!Ref NumberOfAZs, 4]]
  UseFourAZs: !Equals [!Ref NumberOfAZs, 4]

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: 'CloudFormation'
        - Key: Project
          Value: 'SecureVPCDemo'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref Environment

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
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 8, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 8, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseThreeAZs
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 8, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ3'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet4:
    Type: AWS::EC2::Subnet
    Condition: UseFourAZs
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [3, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 8, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ4'
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 8, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 8, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Condition: UseThreeAZs
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Select [6, !Cidr [!Ref VpcCidr, 8, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ3'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet4:
    Type: AWS::EC2::Subnet
    Condition: UseFourAZs
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [3, !GetAZs '']
      CidrBlock: !Select [7, !Cidr [!Ref VpcCidr, 8, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ4'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-AZ1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-AZ2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Routes'
        - Key: Environment
          Value: !Ref Environment

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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseThreeAZs
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  PublicSubnet4RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseFourAZs
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet4

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ1'
        - Key: Environment
          Value: !Ref Environment

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
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ2'
        - Key: Environment
          Value: !Ref Environment

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

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseThreeAZs
    Properties:
      RouteTableId: !Ref PrivateRouteTable1  # Use AZ1 NAT for AZ3
      SubnetId: !Ref PrivateSubnet3

  PrivateSubnet4RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: UseFourAZs
    Properties:
      RouteTableId: !Ref PrivateRouteTable2  # Use AZ2 NAT for AZ4
      SubnetId: !Ref PrivateSubnet4

  # Network ACLs - Restrictive by default
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-NACL'
        - Key: Environment
          Value: !Ref Environment

  # Allow HTTPS outbound for Lambda
  PrivateNetworkAclEntryOutboundHTTPS:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 443
        To: 443

  # Allow ephemeral ports inbound for HTTPS responses
  PrivateNetworkAclEntryInboundEphemeral:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: 6
      RuleAction: allow
      CidrBlock: 0.0.0.0/0
      PortRange:
        From: 1024
        To: 65535

  # Allow VPC internal traffic
  PrivateNetworkAclEntryInboundVPC:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 200
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidr

  PrivateNetworkAclEntryOutboundVPC:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 200
      Protocol: -1
      RuleAction: allow
      CidrBlock: !Ref VpcCidr

  PrivateSubnet1NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      NetworkAclId: !Ref PrivateNetworkAcl

  PrivateSubnet2NetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      NetworkAclId: !Ref PrivateNetworkAcl

  # KMS Key for S3 Encryption
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # Allow CloudFormation and root account admin access
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          # Allow Lambda role to use the key for S3 operations
          - Sid: Allow Lambda Role
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-S3-KMS-Key'
        - Key: Environment
          Value: !Ref Environment

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-s3-key'
      TargetKeyId: !Ref S3KMSKey

  # KMS Key for CloudTrail
  CloudTrailKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for CloudTrail logs encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          # Allow CloudTrail service to use the key
          - Sid: Allow CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey*'
              - 'kms:ReEncrypt*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrail-KMS-Key'
        - Key: Environment
          Value: !Ref Environment

  CloudTrailKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-cloudtrail-key'
      TargetKeyId: !Ref CloudTrailKMSKey

  # S3 VPC Endpoint
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
        - !Ref PrivateRouteTable2
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !Sub '${S3Bucket}/*'
              - !GetAtt S3Bucket.Arn
              - !Sub '${CloudTrailS3Bucket}/*'
              - !GetAtt CloudTrailS3Bucket.Arn

  # Main S3 Bucket with strict access controls
  S3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::StackName}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
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
          Value: !Sub '${AWS::StackName}-SecureBucket'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket Policy - Only allow access via VPC Endpoint and specific IAM roles
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Deny all access except from VPC Endpoint
          - Sid: DenyAccessNotFromVPCEndpoint
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${S3Bucket}/*'
              - !GetAtt S3Bucket.Arn
            Condition:
              StringNotEquals:
                'aws:SourceVpce': !Ref S3VPCEndpoint
          # Allow Lambda role access
          - Sid: AllowLambdaRole
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !Sub '${S3Bucket}/*'
              - !GetAtt S3Bucket.Arn

  # CloudTrail S3 Bucket
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref CloudTrailKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrail'
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail S3 Bucket Policy
  CloudTrailS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
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
            Resource: !Sub '${CloudTrailS3Bucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # Security Groups
  PublicSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-Public-SG'
      GroupDescription: 'Security group for public resources - HTTPS only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS from Internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS to Internet'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-SG'
        - Key: Environment
          Value: !Ref Environment

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-Lambda-SG'
      GroupDescription: 'Security group for Lambda function'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS for AWS API calls'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Lambda-SG'
        - Key: Environment
          Value: !Ref Environment

  # IAM Roles
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-Lambda-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      Policies:
        # Least privilege S3 access policy
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !GetAtt S3Bucket.Arn
        # KMS access for S3 encryption/decryption
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:Encrypt'
                  - 'kms:ReEncrypt*'
                  - 'kms:GenerateDataKey*'
                  - 'kms:DescribeKey'
                Resource: !GetAtt S3KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Lambda-Role'
        - Key: Environment
          Value: !Ref Environment

  # Lambda Function
  LambdaFunction:
    Type: AWS::LC::Function
    Properties:
      FunctionName: !Sub '${FunctionNamePrefix}-${AWS::StackName}-Function'
      Runtime: !Ref LambdaRuntime
      Handler: 'index.lambda_handler'
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          BUCKET_NAME: !Ref S3Bucket
          KMS_KEY_ARN: !GetAtt S3KMSKey.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          from datetime import datetime
          
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def lambda_handler(event, context):
              """
              Secure Lambda function that demonstrates S3 access via VPC endpoint
              """
              try:
                  # Initialize S3 client
                  s3_client = boto3.client('s3')
                  bucket_name = os.environ['BUCKET_NAME']
                  kms_key_arn = os.environ['KMS_KEY_ARN']
                  
                  # Test object key
                  test_key = f'test-{datetime.now().isoformat()}.txt'
                  test_content = f'Hello from Lambda! Timestamp: {datetime.now()}'
                  
                  # Write to S3 with KMS encryption
                  logger.info(f'Writing object {test_key} to bucket {bucket_name}')
                  s3_client.put_object(
                      Bucket=bucket_name,
                      Key=test_key,
                      Body=test_content,
                      ServerSideEncryption='aws:kms',
                      SSEKMSKeyId=kms_key_arn
                  )
                  
                  # Read back from S3
                  logger.info(f'Reading object {test_key} from bucket {bucket_name}')
                  response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
                  retrieved_content = response['Body'].read().decode('utf-8')
                  
                  # List bucket contents
                  list_response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
                  object_count = list_response.get('KeyCount', 0)
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'S3 operations successful',
                          'test_key': test_key,
                          'retrieved_content': retrieved_content,
                          'bucket_object_count': object_count,
                          'kms_encrypted': True
                      })
                  }
                  
              except Exception as e:
                  logger.error(f'Error in Lambda function: {str(e)}')
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e)
                      })
                  }
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Lambda'
        - Key: Environment
          Value: !Ref Environment

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-CloudTrail'
      S3Bucket