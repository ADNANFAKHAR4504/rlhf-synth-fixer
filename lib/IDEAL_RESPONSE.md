AWSTemplateFormatVersion: '2010-09-09'
Description: >
  ServerlessApp - Production-grade, secure, highly available serverless application.
  Features S3-triggered Lambda with Secrets Manager integration, multi-AZ VPC deployment,
  least-privilege IAM policies, comprehensive monitoring, and enterprise security controls.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Application Configuration"
        Parameters:
          - ProjectName
          - Environment
      - Label:
          default: "Lambda Configuration"
        Parameters:
          - LambdaRuntime
          - LambdaTimeout
          - LambdaMemorySize
      - Label:
          default: "Security Configuration"
        Parameters:
          - RetentionInDays
    ParameterLabels:
      ProjectName:
        default: "Project Name"
      Environment:
        default: "Deployment Environment"
      LambdaRuntime:
        default: "Lambda Runtime Version"
      LambdaTimeout:
        default: "Lambda Timeout (seconds)"
      LambdaMemorySize:
        default: "Lambda Memory Size (MB)"
      RetentionInDays:
        default: "Log Retention Period (days)"

Parameters:
  ProjectName:
    Type: String
    Default: 'ServerlessApp'
    Description: 'Name prefix for all resources'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must start with a letter and contain only alphanumeric characters'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues:
      - dev
      - staging
      - prod
    Description: 'Environment for the deployment'

  LambdaRuntime:
    Type: String
    Default: 'python3.12'
    AllowedValues:
      - python3.9
      - python3.10
      - python3.11
      - python3.12
      - nodejs18.x
      - nodejs20.x
    Description: 'Runtime for the Lambda function'

  LambdaTimeout:
    Type: Number
    Default: 60
    MinValue: 3
    MaxValue: 900
    Description: 'Timeout for Lambda function in seconds'

  LambdaMemorySize:
    Type: Number
    Default: 256
    MinValue: 128
    MaxValue: 10240
    Description: 'Memory size for Lambda function in MB'

  RetentionInDays:
    Type: Number
    Default: 14
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    Description: 'CloudWatch log retention period in days'

Mappings:
  RegionMap:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b
    us-west-2:
      AZ1: us-west-2a
      AZ2: us-west-2b
    eu-west-1:
      AZ1: eu-west-1a
      AZ2: eu-west-1b

Conditions:
  IsProd: !Equals [!Ref Environment, 'prod']
  IsNotProd: !Not [!Equals [!Ref Environment, 'prod']]

Resources:
  # S3 Bucket - Secure file storage with encryption and versioning
  ServerlessAppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-bucket-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
          - Id: TransitionToIA
            Status: Enabled
            Transition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionTransition:
              StorageClass: STANDARD_IA
              TransitionInDays: 30
            NoncurrentVersionExpiration:
              NoncurrentDays: 365
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt ServerlessAppLambda.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: 'input/'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # S3 Bucket Policy - Enforce encryption and secure access
  ServerlessAppBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ServerlessAppBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ServerlessAppBucket}/*'
              - !Ref ServerlessAppBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowLambdaReadAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt ServerlessAppLambdaExecutionRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
            Resource: !Sub '${ServerlessAppBucket}/*'

  # VPC - Multi-AZ network infrastructure for high availability
  ServerlessAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  ServerlessAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-igw'

  ServerlessAppVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ServerlessAppVPC
      InternetGatewayId: !Ref ServerlessAppInternetGateway

  # Private Subnets for Lambda (Multi-AZ)
  ServerlessAppPrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ServerlessAppVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-az1'

  ServerlessAppPrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ServerlessAppVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-subnet-az2'

  # Public Subnets for NAT Gateways
  ServerlessAppPublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ServerlessAppVPC
      CidrBlock: 10.0.101.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-az1'

  ServerlessAppPublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ServerlessAppVPC
      CidrBlock: 10.0.102.0/24
      AvailabilityZone: !FindInMap [RegionMap, !Ref 'AWS::Region', AZ2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-subnet-az2'

  # NAT Gateways for Lambda internet access
  ServerlessAppNATGatewayAZ1EIP:
    Type: AWS::EC2::EIP
    DependsOn: ServerlessAppVPCGatewayAttachment
    Properties:
      Domain: vpc

  ServerlessAppNATGatewayAZ2EIP:
    Type: AWS::EC2::EIP
    DependsOn: ServerlessAppVPCGatewayAttachment
    Properties:
      Domain: vpc

  ServerlessAppNATGatewayAZ1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ServerlessAppNATGatewayAZ1EIP.AllocationId
      SubnetId: !Ref ServerlessAppPublicSubnetAZ1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway-az1'

  ServerlessAppNATGatewayAZ2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ServerlessAppNATGatewayAZ2EIP.AllocationId
      SubnetId: !Ref ServerlessAppPublicSubnetAZ2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-nat-gateway-az2'

  # Route Tables
  ServerlessAppPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ServerlessAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-public-rt'

  ServerlessAppPrivateRouteTableAZ1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ServerlessAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-az1'

  ServerlessAppPrivateRouteTableAZ2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ServerlessAppVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-private-rt-az2'

  # Routes
  ServerlessAppPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ServerlessAppVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref ServerlessAppPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref ServerlessAppInternetGateway

  ServerlessAppPrivateRouteAZ1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ServerlessAppPrivateRouteTableAZ1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ServerlessAppNATGatewayAZ1

  ServerlessAppPrivateRouteAZ2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ServerlessAppPrivateRouteTableAZ2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref ServerlessAppNATGatewayAZ2

  # Route Table Associations
  ServerlessAppPublicSubnetAZ1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ServerlessAppPublicSubnetAZ1
      RouteTableId: !Ref ServerlessAppPublicRouteTable

  ServerlessAppPublicSubnetAZ2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ServerlessAppPublicSubnetAZ2
      RouteTableId: !Ref ServerlessAppPublicRouteTable

  ServerlessAppPrivateSubnetAZ1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ServerlessAppPrivateSubnetAZ1
      RouteTableId: !Ref ServerlessAppPrivateRouteTableAZ1

  ServerlessAppPrivateSubnetAZ2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ServerlessAppPrivateSubnetAZ2
      RouteTableId: !Ref ServerlessAppPrivateRouteTableAZ2

  # Security Group for Lambda
  ServerlessAppLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ServerlessApp Lambda function
      VpcId: !Ref ServerlessAppVPC
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic for AWS service access'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-sg'
        - Key: Environment
          Value: !Ref Environment

  # Secrets Manager Secret - Secure credential storage
  ServerlessAppSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-secret-${Environment}'
      Description: 'Sensitive configuration data for ServerlessApp Lambda function'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      KmsKeyId: alias/aws/secretsmanager
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-secret'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # IAM Role for Lambda Execution - Least privilege access
  ServerlessAppLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-execution-role-${Environment}'
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
        - PolicyName: !Sub '${ProjectName}-lambda-policy-${Environment}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: S3ReadAccess
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource: !Sub '${ServerlessAppBucket}/input/*'
              - Sid: SecretsManagerReadAccess
                Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                Resource: !Ref ServerlessAppSecret
              - Sid: CloudWatchLogsAccess
                Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-lambda-${Environment}*'
              - Sid: XRayTracing
                Effect: Allow
                Action:
                  - 'xray:PutTraceSegments'
                  - 'xray:PutTelemetryRecords'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-execution-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # CloudWatch Log Group for Lambda
  ServerlessAppLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProjectName}-lambda-${Environment}'
      RetentionInDays: !Ref RetentionInDays
      KmsKeyId: !GetAtt ServerlessAppCloudWatchKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-logs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # KMS Key for CloudWatch Logs encryption
  ServerlessAppCloudWatchKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} CloudWatch logs encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudWatch Logs
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnEquals:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${ProjectName}-lambda-${Environment}'

  ServerlessAppCloudWatchKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-cloudwatch-${Environment}'
      TargetKeyId: !Ref ServerlessAppCloudWatchKMSKey

  # Lambda Function - Core processing logic
  ServerlessAppLambda:
    Type: AWS::Lambda::Function
    DependsOn: ServerlessAppLambdaLogGroup
    Properties:
      FunctionName: !Sub '${ProjectName}-lambda-${Environment}'
      Runtime: !Ref LambdaRuntime
      Handler: 'index.lambda_handler'
      Role: !GetAtt ServerlessAppLambdaExecutionRole.Arn
      Timeout: !Ref LambdaTimeout
      MemorySize: !Ref LambdaMemorySize
      ReservedConcurrencyLimit: !If [IsProd, 50, 10]
      DeadLetterQueue:
        TargetArn: !GetAtt ServerlessAppDLQ.Arn
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          SECRET_NAME: !Ref ServerlessAppSecret
          ENVIRONMENT: !Ref Environment
          LOG_LEVEL: !If [IsProd, 'INFO', 'DEBUG']
          POWERTOOLS_SERVICE_NAME: !Ref ProjectName
          POWERTOOLS_METRICS_NAMESPACE: !Sub '${ProjectName}/${Environment}'
      VpcConfig:
        SecurityGroupIds:
          - !Ref ServerlessAppLambdaSecurityGroup
        SubnetIds:
          - !Ref ServerlessAppPrivateSubnetAZ1
          - !Ref ServerlessAppPrivateSubnetAZ2
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from urllib.parse import unquote_plus
          from typing import Dict, Any
          
          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
          
          # Initialize AWS clients
          s3_client = boto3.client('s3')
          secrets_client = boto3.client('secretsmanager')
          
          def get_secret(secret_name: str) -> Dict[str, Any]:
              """Retrieve secret from AWS Secrets Manager."""
              try:
                  response = secrets_client.get_secret_value(SecretId=secret_name)
                  return json.loads(response['SecretString'])
              except Exception as e:
                  logger.error(f"Failed to retrieve secret {secret_name}: {str(e)}")
                  raise
          
          def process_s3_object(bucket: str, key: str, secrets: Dict[str, Any]) -> Dict[str, Any]:
              """Process S3 object with secure secret access."""
              try:
                  # Get object from S3
                  response = s3_client.get_object(Bucket=bucket, Key=key)
                  content = response['Body'].read()
                  
                  # Process content (example: file size and type analysis)
                  file_info = {
                      'size': len(content),
                      'content_type': response.get('ContentType', 'unknown'),
                      'last_modified': response.get('LastModified', '').isoformat() if response.get('LastModified') else None
                  }
                  
                  logger.info(f"Processed file {key}: {file_info}")
                  return file_info
                  
              except Exception as e:
                  logger.error(f"Failed to process S3 object {key}: {str(e)}")
                  raise
          
          def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
              """
              Lambda function triggered by S3 object creation events.
              Retrieves secrets from Secrets Manager and processes uploaded files.
              """
              try:
                  logger.info(f"Received event: {json.dumps(event, default=str)}")
                  
                  # Get secret from Secrets Manager
                  secret_name = os.environ['SECRET_NAME']
                  secrets = get_secret(secret_name)
                  logger.info("Successfully retrieved secrets from Secrets Manager")
                  
                  processed_files = []
                  
                  # Process S3 events
                  for record in event.get('Records', []):
                      if record.get('eventSource') == 'aws:s3':
                          bucket_name = record['s3']['bucket']['name']
                          object_key = unquote_plus(record['s3']['object']['key'])
                          
                          logger.info(f"Processing file: {object_key} from bucket: {bucket_name}")
                          
                          file_info = process_s3_object(bucket_name, object_key, secrets)
                          processed_files.append({
                              'bucket': bucket_name,
                              'key': object_key,
                              'info': file_info
                          })
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Successfully processed S3 events',
                          'processed_files': len(processed_files),
                          'files': processed_files
                      }, default=str)
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing S3 event: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': str(e)
                      })
                  }
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: CloudFormation

  # Dead Letter Queue for Lambda failures
  ServerlessAppDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${ProjectName}-dlq-${Environment}'
      KmsMasterKeyId: alias/aws/sqs
      MessageRetentionPeriod: 1209600  # 14 days
      VisibilityTimeoutSeconds: 60
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-dlq'
        - Key: Environment
          Value: !Ref Environment

  # Lambda Permission for S3 to invoke the function
  ServerlessAppLambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ServerlessAppLambda
      Action: 'lambda:InvokeFunction'
      Principal: 's3.amazonaws.com'
      SourceArn: !Sub '${ServerlessAppBucket}/*'
      SourceAccount: !Ref 'AWS::AccountId'

  # CloudWatch Alarms for comprehensive monitoring
  ServerlessAppLambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-lambda-error-count-${Environment}'
      AlarmDescription: 'Monitor Lambda error count - triggers on any errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessAppLambda
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref ServerlessAppSNSTopic
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-error-alarm'
        - Key: Environment
          Value: !Ref Environment

  ServerlessAppLambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-lambda-duration-${Environment}'
      AlarmDescription: 'Monitor Lambda execution duration'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref LambdaTimeout
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessAppLambda
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-lambda-duration-alarm'

  ServerlessAppLambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-lambda-throttle-${Environment}'
      AlarmDescription: 'Monitor Lambda throttling'
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ServerlessAppLambda
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref ServerlessAppSNSTopic

  # SNS Topic for alarm notifications
  ServerlessAppSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-alerts-${Environment}'
      DisplayName: !Sub '${ProjectName} Alerts'
      KmsMasterKeyId: alias/aws/sns

  # Lambda function version and alias for blue/green deployments
  ServerlessAppLambdaVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref ServerlessAppLambda
      Description: !Sub 'Version deployed on ${AWS::StackName}'

  ServerlessAppLambdaAlias:
    Type: AWS::Lambda::Alias
    Properties:
      AliasName: !Ref Environment
      FunctionName: !Ref ServerlessAppLambda
      FunctionVersion: !GetAtt ServerlessAppLambdaVersion.Version

Outputs:
  ServerlessAppBucketName:
    Description: 'Name of the S3 bucket for file uploads'
    Value: !Ref ServerlessAppBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  ServerlessAppLambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref ServerlessAppLambda
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  ServerlessAppLambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt ServerlessAppLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  ServerlessAppSecretArn:
    Description: 'ARN of the Secrets Manager secret'
    Value: !Ref ServerlessAppSecret
    Export:
      Name: !Sub '${AWS::StackName}-SecretArn'

  ServerlessAppVPCId:
    Description: 'VPC ID for the serverless application'
    Value: !Ref ServerlessAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  ServerlessAppPrivateSubnets:
    Description: 'Private subnet IDs for Lambda deployment'
    Value: !Join
      - ','
      - - !Ref ServerlessAppPrivateSubnetAZ1
        - !Ref ServerlessAppPrivateSubnetAZ2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  ServerlessAppSecurityGroupId:
    Description: 'Security Group ID for Lambda function'
    Value: !Ref ServerlessAppLambdaSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  ServerlessAppSNSTopicArn:
    Description: 'SNS Topic ARN for alerts'
    Value: !Ref ServerlessAppSNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopicArn'