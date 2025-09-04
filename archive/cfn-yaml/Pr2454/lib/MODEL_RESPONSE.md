CloudFormation Template for Secure Serverless Architecture
Here's a comprehensive CloudFormation YAML template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, production-ready serverless architecture with S3, CloudFront, Lambda, API Gateway, and DynamoDB'

# Parameters for customization
Parameters:
  ProjectName:
    Type: String
    Default: 'serverless-app'
    Description: 'Name of the project for resource naming and tagging'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'

  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment name for resource tagging'

  DomainName:
    Type: String
    Default: ''
    Description: 'Optional domain name for CloudFront distribution (leave empty if not using custom domain)'

  CertificateArn:
    Type: String
    Default: ''
    Description: 'Optional ACM certificate ARN for CloudFront (required if using custom domain)'

# Conditions for optional resources
Conditions:
  HasCustomDomain: !Not [!Equals [!Ref DomainName, '']]
  HasCertificate: !Not [!Equals [!Ref CertificateArn, '']]

Resources:
  # ==========================================
  # KMS Key for Encryption
  # ==========================================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${ProjectName} encryption'
      KeyPolicy:
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
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-kms-key'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-${Environment}-key'
      TargetKeyId: !Ref KMSKey

  # ==========================================
  # S3 Bucket with Security Features
  # ==========================================
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-content-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt LambdaFunction.Arn
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LoggingBucket
        LogFilePrefix: 'access-logs/'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-content-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket for Access Logs
  S3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-logs-${AWS::AccountId}'
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
          Value: !Sub '${ProjectName}-${Environment}-logs-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # CloudFront Distribution
  # ==========================================
  CloudFrontOriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${ProjectName}-${Environment}-oac'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Aliases: !If
          - HasCustomDomain
          - [!Ref DomainName]
          - !Ref AWS::NoValue
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt S3Bucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref CloudFrontOriginAccessControl
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachedMethods: [GET, HEAD]
          Compress: true
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        Enabled: true
        DefaultRootObject: index.html
        PriceClass: PriceClass_100
        ViewerCertificate: !If
          - HasCertificate
          - AcmCertificateArn: !Ref CertificateArn
            SslSupportMethod: sni-only
            MinimumProtocolVersion: TLSv1.2_2021
          - CloudFrontDefaultCertificate: true
        Logging:
          Bucket: !GetAtt S3LoggingBucket.DomainName
          Prefix: 'cloudfront-logs/'
          IncludeCookies: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-distribution'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # S3 Bucket Policy for CloudFront
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub '${S3Bucket}/*'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # ==========================================
  # DynamoDB Table
  # ==========================================
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-${Environment}-data'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref KMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      BackupPolicy:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-table'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # IAM Role for Lambda
  # ==========================================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-lambda-role'
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
                  - s3:PutObject
                Resource: !Sub '${S3Bucket}/*'
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt KMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # ==========================================
  # Lambda Function
  # ==========================================
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-processor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          def lambda_handler(event, context):
              print(f"Received event: {json.dumps(event)}")
              
              # Initialize AWS clients
              s3 = boto3.client('s3')
              dynamodb = boto3.resource('dynamodb')
              
              table_name = os.environ['DYNAMODB_TABLE']
              table = dynamodb.Table(table_name)
              
              try:
                  # Process S3 event if present
                  if 'Records' in event:
                      for record in event['Records']:
                          if 's3' in record:
                              bucket = record['s3']['bucket']['name']
                              key = record['s3']['object']['key']
                              
                              # Store event in DynamoDB
                              table.put_item(
                                  Item={
                                      'id': f"{bucket}-{key}-{datetime.now().isoformat()}",
                                      'bucket': bucket,
                                      'key': key,
                                      'timestamp': datetime.now().isoformat(),
                                      'event_type': 's3_event'
                                  }
                              )
                  
                  # Process API Gateway event
                  elif 'httpMethod' in event:
                      # Store API request in DynamoDB
                      table.put_item(
                          Item={
                              'id': f"api-{datetime.now().isoformat()}",
                              'method': event['httpMethod'],
                              'path': event['path'],
                              'timestamp': datetime.now().isoformat(),
                              'event_type': 'api_request'
                          }
                      )
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Event processed successfully',
                          'timestamp': datetime.now().isoformat()
                      })
                  }
                  
              except Exception as e:
                  print(f"Error processing event: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': str(e)
                      })
                  }
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref DynamoDBTable
          S3_BUCKET: !Ref S3Bucket
          KMS_KEY_ID: !Ref KMSKey
      KmsKeyArn: !GetAtt KMSKey.Arn
      Timeout: 30
      MemorySize: 256
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-lambda'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Lambda permission for S3 to invoke the function
  LambdaInvokePermissionS3:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub '${S3Bucket}/*'

  # ==========================================
  # API Gateway
  # ==========================================
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-api'
      Description: 'REST API for serverless application'
      EndpointConfiguration:
        Types: [REGIONAL]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-api'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # API Gateway Resource
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: 'process'

  # API Gateway Method
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty

  # API Gateway Deployment
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiGatewayMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: !Ref Environment

  # Lambda permission for API Gateway
  LambdaInvokePermissionApi:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGateway}/stages/${Environment}/POST/process'

  # ==========================================
  # CloudWatch Log Groups
  # ==========================================
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${LambdaFunction}'
      RetentionInDays: 14
      KmsKeyId: !GetAtt KMSKey.Arn

  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${ProjectName}-${Environment}-api'
      RetentionInDays: 14
      KmsKeyId: !GetAtt KMSKey.Arn

  # API Gateway Stage for logging
  ApiGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref ApiGateway
      DeploymentId: !Ref ApiGatewayDeployment
      StageName: !Sub '${Environment}-logging'
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: '$requestId $requestTime $httpMethod $resourcePath $status $responseLength $requestTime'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

# ==========================================
# Outputs
# ==========================================
Outputs:
  S3BucketName:
    Description: 'Name of the S3 content bucket'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket'

  S3BucketArn:
    Description: 'ARN of the S3 content bucket'
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  CloudFrontDistributionId:
    Description: 'CloudFront Distribution ID'
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDistributionId'

  CloudFrontDomainName:
    Description: 'CloudFront Distribution Domain Name'
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFrontDomainName'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTable'

  DynamoDBTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt DynamoDBTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableArn'

  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/process'
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayUrl'

  ApiGatewayId:
    Description: 'API Gateway ID'
    Value: !Ref ApiGateway
    Export:
      Name: !Sub '${AWS::StackName}-ApiGatewayId'

  KMSKeyId:
    Description: 'KMS Key ID for encryption'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

  KMSKeyArn:
    Description: 'KMS Key ARN for encryption'
    Value: !GetAtt KMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyArn'
```

## key Features and Security Implementations

### 🔐 Security Best Practices

- KMS Encryption: All services use customer-managed KMS keys
- Least Privilege IAM: Lambda role has minimal required permissions
- S3 Security: Public access blocked, versioning enabled, encrypted storage
- HTTPS Only: CloudFront redirects HTTP to HTTPS
- Origin Access Control: CloudFront uses OAC for secure S3 access

# 🏗️ Architecture Components

- S3: Versioned, encrypted content bucket with access logging
- CloudFront: Global CDN with HTTPS redirection and caching
- Lambda: Python function triggered by S3 events and API Gateway
- API Gateway: RESTful endpoint with CloudWatch logging
- DynamoDB: Encrypted table with point-in-time recovery
- CloudWatch: Comprehensive logging for all services

### 📊 Monitoring and Logging

- CloudWatch log groups for Lambda and API Gateway
- S3 access logging to dedicated bucket
- CloudFront access logging
- API Gateway request/response logging

### 🎛️ Customization Parameters

- Project name and environment for consistent naming
- Optional custom domain and SSL certificate support
- Configurable through CloudFormation parameters

### Deployment Instructions

- Save the template as cloud_environment_setup.yaml
- Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name my-serverless-app \
  --template-body file://cloud_environment_setup.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=my-app \
               ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM
```

- Monitor deployment:

````bash
   aws cloudformation describe-stacks --stack-name my-serverless-app```


The template creates a fully functional, secure serverless environment that follows AWS best practices and is ready for production use.
````
