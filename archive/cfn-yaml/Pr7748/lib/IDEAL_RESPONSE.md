```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade comprehensive web application infrastructure with data processing pipeline'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - Environment
          - OwnerEmail
      - Label:
          default: "Network Configuration"
        Parameters:
          - VPCCidr
          - PublicSubnetCidr1
          - PublicSubnetCidr2
          - PrivateSubnetCidr1
          - PrivateSubnetCidr2
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBMasterUsername
          - DBInstanceClass
          - DBAllocatedStorage
      - Label:
          default: "Application Configuration"
        Parameters:
          - LambdaMemorySize
          - LambdaTimeout
          - ApiRateLimit
          - ApiBurstLimit

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - prod
    Description: Environment designation for tagging and configuration
  
  OwnerEmail:
    Type: String
    Default: team@example.com
    Description: Owner email for tagging and notifications
    AllowedPattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  
  VPCCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/[0-9]{1,2}$"
  
  PublicSubnetCidr1:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for public subnet 1
  
  PublicSubnetCidr2:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for public subnet 2
  
  PrivateSubnetCidr1:
    Type: String
    Default: 10.0.10.0/24
    Description: CIDR block for private subnet 1
  
  PrivateSubnetCidr2:
    Type: String
    Default: 10.0.20.0/24
    Description: CIDR block for private subnet 2
  
  DBMasterUsername:
    Type: String
    Default: dbadmin
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "[a-zA-Z][a-zA-Z0-9]*"
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters
  
  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    Description: Database instance class (cost-optimized default)
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
  
  DBAllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 100
    Description: Allocated storage for RDS in GB
  
  LambdaMemorySize:
    Type: Number
    Default: 128
    MinValue: 128
    MaxValue: 512
    Description: Memory allocation for Lambda function (MB)
  
  LambdaTimeout:
    Type: Number
    Default: 30
    MinValue: 3
    MaxValue: 60
    Description: Lambda function timeout in seconds
  
  ApiRateLimit:
    Type: Number
    Default: 100
    Description: API Gateway rate limit (requests per second)
  
  ApiBurstLimit:
    Type: Number
    Default: 200
    Description: API Gateway burst limit

Resources:
  # ==================== Secrets Manager for Database ====================
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-db-credentials'
      Description: RDS Master User Credentials
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-secret'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  SecretRDSInstanceAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DatabaseSecret
      TargetId: !Ref Database
      TargetType: AWS::RDS::DBInstance

  # ==================== VPC Configuration ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== NAT Gateways (High Availability) ====================
  # Elastic IPs for NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # NAT Gateways(Recommended for production)
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== Route Tables ====================
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-RT'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables (one for each AZ for high availability)
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-RT-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-RT-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ==================== Security Groups ====================
  APIGatewaySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-API-SG'
      GroupDescription: Security group for API Gateway VPC endpoint
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-API-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-Lambda-SG'
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Lambda-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-DB-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: Allow MySQL access from Lambda
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DB-SG'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== S3 Bucket with Lifecycle ====================
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: GLACIER
            NoncurrentVersionTransitions:
              - TransitionInDays: 60
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  # S3 Bucket Policy
  DataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref DataBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt DataBucket.Arn
              - !Sub '${DataBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ==================== Lambda for S3 Lifecycle Notifications ====================
  S3EventProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-S3EventProcessor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt S3EventProcessorRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          sns = boto3.client('sns')
          s3 = boto3.client('s3')
          
          def lambda_handler(event, context):
              """Process S3 events and check for lifecycle transitions"""
              try:
                  for record in event['Records']:
                      bucket = record['s3']['bucket']['name']
                      key = record['s3']['object']['key']
                      
                      # Get object metadata to check storage class
                      try:
                          response = s3.get_object_attributes(
                              Bucket=bucket,
                              Key=key,
                              ObjectAttributes=['StorageClass']
                          )
                          storage_class = response.get('StorageClass', 'STANDARD')
                          
                          # Check if object has transitioned to Glacier
                          if storage_class == 'GLACIER':
                              message = {
                                  'Event': 'Object Transitioned to Glacier',
                                  'Bucket': bucket,
                                  'Key': key,
                                  'StorageClass': storage_class,
                                  'Timestamp': datetime.utcnow().isoformat()
                              }
                              
                              sns.publish(
                                  TopicArn=os.environ['SNS_TOPIC_ARN'],
                                  Subject=f'S3 Object Lifecycle Transition - {key}',
                                  Message=json.dumps(message, indent=2)
                              )
                      except Exception as e:
                          print(f"Error processing object {key}: {str(e)}")
                          
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Events processed successfully')
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps(f'Error: {str(e)}')
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  S3EventProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-S3EventProcessorRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectAttributes
                Resource: !Sub '${DataBucket.Arn}/*'
        - PolicyName: SNSPublish
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  S3EventProcessorPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref S3EventProcessorFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !GetAtt DataBucket.Arn

  # CloudWatch Event Rule for Daily Glacier Transition Check
  GlacierTransitionCheckRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-glacier-check'
      Description: Daily check for objects transitioned to Glacier
      ScheduleExpression: 'rate(1 day)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt GlacierCheckFunction.Arn
          Id: GlacierCheckTarget

  GlacierCheckPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref GlacierCheckFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt GlacierTransitionCheckRule.Arn

  GlacierCheckFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-GlacierCheck'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt GlacierCheckRole.Arn
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          BUCKET_NAME: !Ref DataBucket
          SNS_TOPIC_ARN: !Ref SNSTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta
          
          s3 = boto3.client('s3')
          sns = boto3.client('sns')
          
          def lambda_handler(event, context):
              """Check for recently transitioned Glacier objects"""
              bucket = os.environ['BUCKET_NAME']
              sns_topic = os.environ['SNS_TOPIC_ARN']
              
              try:
                  paginator = s3.get_paginator('list_objects_v2')
                  glacier_objects = []
                  
                  for page in paginator.paginate(Bucket=bucket):
                      if 'Contents' in page:
                          for obj in page['Contents']:
                              # Get detailed object info
                              head = s3.get_object_attributes(
                                  Bucket=bucket,
                                  Key=obj['Key'],
                                  ObjectAttributes=['StorageClass']
                              )
                              storage_class = head.get('StorageClass', 'STANDARD')
                              
                              if storage_class == 'GLACIER':
                                  glacier_objects.append({
                                      'Key': obj['Key'],
                                      'Size': obj['Size'],
                                      'LastModified': obj['LastModified'].isoformat(),
                                      'StorageClass': storage_class
                                  })
                  
                  if glacier_objects:
                      message = {
                          'Event': 'Daily Glacier Transition Report',
                          'Bucket': bucket,
                          'TotalObjectsInGlacier': len(glacier_objects),
                          'Objects': glacier_objects[:10],  # Limit to first 10 for brevity
                          'Timestamp': datetime.utcnow().isoformat()
                      }
                      
                      sns.publish(
                          TopicArn=sns_topic,
                          Subject='Daily S3 Glacier Storage Report',
                          Message=json.dumps(message, indent=2, default=str)
                      )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps(f'Checked {len(glacier_objects)} Glacier objects')
                  }
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  sns.publish(
                      TopicArn=sns_topic,
                      Subject='Glacier Check Error',
                      Message=f'Error during Glacier check: {str(e)}'
                  )
                  return {
                      'statusCode': 500,
                      'body': json.dumps(f'Error: {str(e)}')
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  GlacierCheckRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-GlacierCheckRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:GetObject
                  - s3:GetObjectAttributes
                Resource:
                  - !GetAtt DataBucket.Arn
                  - !Sub '${DataBucket.Arn}/*'
        - PolicyName: SNSPublish
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== SNS Topic ====================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-Notifications'
      DisplayName: !Sub '${AWS::StackName} Infrastructure Notifications'
      Subscription:
        - Endpoint: !Ref OwnerEmail
          Protocol: email
      KmsMasterKeyId: alias/aws/sns
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== Main Data Processor Lambda Function ====================
  DataProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-DataProcessor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: !Ref LambdaTimeout
      MemorySize: !Ref LambdaMemorySize
      ReservedConcurrentExecutions: 10  # Cost optimization
      Environment:
        Variables:
          BUCKET_NAME: !Ref DataBucket
          SNS_TOPIC_ARN: !Ref SNSTopic
          DB_SECRET_ARN: !Ref DatabaseSecret
          DB_ENDPOINT: !GetAtt Database.Endpoint.Address
          ENVIRONMENT: !Ref Environment
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          from datetime import datetime
          import traceback
          
          # Initialize AWS clients
          s3 = boto3.client('s3')
          sns = boto3.client('sns')
          secrets_manager = boto3.client('secretsmanager')
          cloudwatch = boto3.client('cloudwatch')
          
          # Setup logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          
          def get_db_credentials():
              """Retrieve database credentials from Secrets Manager"""
              try:
                  secret_arn = os.environ['DB_SECRET_ARN']
                  response = secrets_manager.get_secret_value(SecretId=secret_arn)
                  return json.loads(response['SecretString'])
              except Exception as e:
                  logger.error(f"Failed to retrieve DB credentials: {str(e)}")
                  raise
          
          def validate_input(data):
              """Validate incoming data structure"""
              required_fields = ['userId', 'data']
              for field in required_fields:
                  if field not in data:
                      raise ValueError(f"Missing required field: {field}")
              return True
          
          def process_data(data):
              """Process the incoming data with business logic"""
              # Add timestamp
              data['processedAt'] = datetime.utcnow().isoformat()
              data['processorVersion'] = '1.0.0'
              data['environment'] = os.environ['ENVIRONMENT']
              
              # Add data quality score (mock calculation)
              if 'data' in data and isinstance(data['data'], dict):
                  data['qualityScore'] = min(100, len(data['data']) * 10)
              
              return data
          
          def store_in_s3(bucket, data, request_id):
              """Store processed data in S3 with proper organization"""
              try:
                  date_prefix = datetime.utcnow().strftime('%Y/%m/%d')
                  key = f"processed/{date_prefix}/{request_id}.json"
                  
                  s3.put_object(
                      Bucket=bucket,
                      Key=key,
                      Body=json.dumps(data, default=str),
                      ServerSideEncryption='AES256',
                      Metadata={
                          'processedAt': datetime.utcnow().isoformat(),
                          'environment': os.environ['ENVIRONMENT']
                      }
                  )
                  
                  logger.info(f"Successfully stored data in S3: {key}")
                  return key
                  
              except Exception as e:
                  logger.error(f"Failed to store in S3: {str(e)}")
                  raise
          
          def send_metric(metric_name, value, unit='Count'):
              """Send custom metrics to CloudWatch"""
              try:
                  cloudwatch.put_metric_data(
                      Namespace='CustomApp/DataProcessor',
                      MetricData=[
                          {
                              'MetricName': metric_name,
                              'Value': value,
                              'Unit': unit,
                              'Timestamp': datetime.utcnow()
                          }
                      ]
                  )
              except Exception as e:
                  logger.warning(f"Failed to send metric {metric_name}: {str(e)}")
          
          def lambda_handler(event, context):
              """Main Lambda handler with comprehensive error handling"""
              start_time = datetime.utcnow()
              
              try:
                  # Parse input
                  if 'body' in event:
                      data = json.loads(event.get('body', '{}'))
                  else:
                      data = event
                  
                  logger.info(f"Processing request: {context.aws_request_id}")
                  
                  # Validate input
                  validate_input(data)
                  
                  # Process data
                  processed_data = process_data(data)
                  
                  # Store in S3
                  bucket = os.environ['BUCKET_NAME']
                  s3_key = store_in_s3(bucket, processed_data, context.aws_request_id)
                  
                  # Send success metrics
                  send_metric('ProcessingSuccess', 1)
                  
                  # Calculate processing time
                  processing_time = (datetime.utcnow() - start_time).total_seconds()
                  send_metric('ProcessingTime', processing_time, 'Seconds')
                  
                  response = {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'X-Request-Id': context.aws_request_id
                      },
                      'body': json.dumps({
                          'message': 'Data processed successfully',
                          'requestId': context.aws_request_id,
                          's3Key': s3_key,
                          'processingTime': processing_time
                      })
                  }
                  
                  logger.info(f"Request completed successfully: {context.aws_request_id}")
                  return response
                  
              except ValueError as ve:
                  logger.error(f"Validation error: {str(ve)}")
                  send_metric('ValidationError', 1)
                  
                  return {
                      'statusCode': 400,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'error': str(ve)})
                  }
                  
              except Exception as e:
                  error_message = f"Processing failed: {str(e)}\n{traceback.format_exc()}"
                  logger.error(error_message)
                  
                  # Send failure metrics
                  send_metric('ProcessingError', 1)
                  
                  # Send error notification
                  try:
                      sns.publish(
                          TopicArn=os.environ['SNS_TOPIC_ARN'],
                          Subject='Data Processing Error Alert',
                          Message=json.dumps({
                              'error': str(e),
                              'requestId': context.aws_request_id,
                              'timestamp': datetime.utcnow().isoformat(),
                              'environment': os.environ['ENVIRONMENT']
                          }, indent=2)
                      )
                  except Exception as sns_error:
                      logger.error(f"Failed to send SNS notification: {str(sns_error)}")
                  
                  return {
                      'statusCode': 500,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({
                          'error': 'Internal server error',
                              'requestId': context.aws_request_id
                      })
                  }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-LambdaExecutionRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt DataBucket.Arn
                  - !Sub '${DataBucket.Arn}/*'
        - PolicyName: SNSPublish
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'CustomApp/DataProcessor'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda Permission for API Gateway
  LambdaApiGatewayPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DataProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApi}/*/*'

  # ==================== API Gateway ====================
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${AWS::StackName}-API'
      Description: API Gateway for data processing with comprehensive security
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: execute-api:Invoke
            Resource: '*'
            Condition:
              IpAddress:
                aws:SourceIp:
                  - 0.0.0.0/0  # Update with trusted IP ranges in production
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: process

  ApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: POST
      AuthorizationType: NONE  # Consider adding API Key or Cognito auth in production
      RequestValidatorId: !Ref ApiRequestValidator
      RequestModels:
        application/json: !Ref ApiRequestModel
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DataProcessorFunction.Arn}/invocations'
        IntegrationResponses:
          - StatusCode: 200
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
        - StatusCode: 500

  ApiRequestValidator:
    Type: AWS::ApiGateway::RequestValidator
    Properties:
      RestApiId: !Ref RestApi
      Name: RequestBodyValidator
      ValidateRequestBody: true
      ValidateRequestParameters: false

  ApiRequestModel:
    Type: AWS::ApiGateway::Model
    Properties:
      RestApiId: !Ref RestApi
      ContentType: application/json
      Name: DataProcessingRequest
      Schema:
        $schema: http://json-schema.org/draft-04/schema#
        type: object
        properties:
          userId:
            type: string
          data:
            type: object
        required:
          - userId
          - data

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiMethod
    Properties:
      RestApiId: !Ref RestApi
      StageName: !Ref Environment
      StageDescription:
        MetricsEnabled: true
        LoggingLevel: INFO
        DataTraceEnabled: true
        MethodSettings:
          - ResourcePath: '/*'
            HttpMethod: '*'
            MetricsEnabled: true
            LoggingLevel: INFO
            DataTraceEnabled: true
            ThrottlingRateLimit: !Ref ApiRateLimit
            ThrottlingBurstLimit: !Ref ApiBurstLimit

  ApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${RestApi}'
      RetentionInDays: 30

  # ==================== RDS Database ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DB-SubnetGroup'
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db-${Environment}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      AllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: alias/aws/rds
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true  # Always enabled for high availability
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      DeletionProtection: !If [IsProduction, true, false]
      EnablePerformanceInsights: !If [SupportsPerformanceInsights, true, false]
      PerformanceInsightsRetentionPeriod: !If [SupportsPerformanceInsights, 7, !Ref AWS::NoValue]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== CloudWatch Alarms ====================
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-Lambda-Errors'
      AlarmDescription: Alert when Lambda function errors occur
      MetricName: Errors
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataProcessorFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-Lambda-Throttles'
      AlarmDescription: Alert when Lambda function is throttled
      MetricName: Throttles
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataProcessorFunction
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DB-CPU-High'
      AlarmDescription: Alert when database CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic
      TreatMissingData: notBreaching

  DatabaseStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-DB-Storage-Low'
      AlarmDescription: Alert when database storage space is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  ApiGateway4xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-API-4xx-Errors'
      AlarmDescription: Alert on high 4xx error rate
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Dimensions:
        - Name: ApiName
          Value: !Sub '${AWS::StackName}-API'
        - Name: Stage
          Value: !Ref Environment
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  ApiGateway5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-API-5xx-Errors'
      AlarmDescription: Alert on 5xx errors
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Dimensions:
        - Name: ApiName
          Value: !Sub '${AWS::StackName}-API'
        - Name: Stage
          Value: !Ref Environment
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  # ==================== CloudTrail ====================
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
          - Id: TransitionOldLogs
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: iac-rlhf-amazon
          Value: 'true'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
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

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-Trail'
      S3BucketName: !Ref CloudTrailBucket
      IsLogging: true
      IsMultiRegionTrail: false
      IncludeGlobalServiceEvents: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${DataBucket.Arn}/'
            - Type: AWS::Lambda::Function
              Values:
                - !GetAtt DataProcessorFunction.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref OwnerEmail
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ==================== CloudWatch Dashboard ====================
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-Dashboard'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                  [".", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                  [".", "Duration", {"stat": "Average", "label": "Lambda Duration"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "API Requests"}],
                  [".", "4XXError", {"stat": "Sum", "label": "4XX Errors"}],
                  [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "API Gateway Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                  [".", "DatabaseConnections", {"stat": "Average"}],
                  [".", "FreeStorageSpace", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "RDS Metrics"
              }
            }
          ]
        }

Conditions:
  IsProduction: !Equals [!Ref Environment, prod]
  SupportsPerformanceInsights: !Not [!Equals [!Ref DBInstanceClass, db.t3.micro]]

Outputs:
  StackName:
    Description: CloudFormation Stack Name
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'
  
  Region:
    Description: AWS Region
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${AWS::StackName}-Region'
  
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
  
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'
  
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'
  
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'
  
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'
  
  NATGateway1Id:
    Description: NAT Gateway 1 ID
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway1-ID'
  
  NATGateway2Id:
    Description: NAT Gateway 2 ID
    Value: !Ref NATGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway2-ID'
  
  APIGatewayURL:
    Description: API Gateway endpoint URL for data processing
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/process'
    Export:
      Name: !Sub '${AWS::StackName}-API-URL'
  
  APIGatewayId:
    Description: API Gateway REST API ID
    Value: !Ref RestApi
    Export:
      Name: !Sub '${AWS::StackName}-API-ID'
  
  DataBucketName:
    Description: S3 Data Bucket Name
    Value: !Ref DataBucket
    Export:
      Name: !Sub '${AWS::StackName}-Data-Bucket'
  
  DataBucketArn:
    Description: S3 Data Bucket ARN
    Value: !GetAtt DataBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Data-Bucket-ARN'
  
  CloudTrailBucketName:
    Description: CloudTrail Bucket Name
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-Bucket'
  
  LambdaFunctionName:
    Description: Main Data Processor Lambda Function Name
    Value: !Ref DataProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Name'
  
  LambdaFunctionArn:
    Description: Main Data Processor Lambda Function ARN
    Value: !GetAtt DataProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'
  
  S3EventProcessorArn:
    Description: S3 Event Processor Lambda Function ARN
    Value: !GetAtt S3EventProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3Processor-ARN'
  
  GlacierCheckFunctionArn:
    Description: Glacier Check Lambda Function ARN
    Value: !GetAtt GlacierCheckFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-GlacierCheck-ARN'
  
  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
  
  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'
  
  DatabaseSecretArn:
    Description: Database Credentials Secret ARN
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub '${AWS::StackName}-DB-Secret-ARN'
  
  SNSTopicArn:
    Description: SNS Topic ARN for notifications
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'
  
  SNSTopicName:
    Description: SNS Topic Name
    Value: !GetAtt SNSTopic.TopicName
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic-Name'
  
  CloudTrailArn:
    Description: CloudTrail ARN
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'
  
  MonitoringDashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}-Dashboard'
    Export:
      Name: !Sub '${AWS::StackName}-Dashboard-URL'
  
  EstimatedMonthlyCost:
    Description: Estimated monthly AWS cost breakdown
    Value: |
      Total: ~$95-100/month
      - NAT Gateways (2x): ~$90 ($45 each)
      - RDS t3.micro Multi-AZ: ~$30
      - S3 Storage: ~$5-10
      - Lambda/API Gateway: <$5
      - CloudWatch/CloudTrail: ~$5-10
      - Data Transfer: ~$5
      Note: Actual costs may vary based on usage patterns
    Export:
      Name: !Sub '${AWS::StackName}-Cost-Estimate'
  
  DeploymentTimestamp:
    Description: Stack deployment timestamp
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-Deployment-Time'
```