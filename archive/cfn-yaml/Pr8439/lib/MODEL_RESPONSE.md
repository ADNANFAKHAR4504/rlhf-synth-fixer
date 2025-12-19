# Complete Serverless Application Infrastructure

Below is a comprehensive AWS CloudFormation template that creates a fully self-contained serverless application infrastructure. This template handles everything from DNS management to monitoring, making it completely portable across environments.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete serverless file processing application with event-driven architecture and public API'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Environment suffix to distinguish deployments (e.g., dev, stg, prod)'
    AllowedPattern: '^[a-z0-9]+$'
    ConstraintDescription: 'Must contain only lowercase letters and numbers'

  RootDomainName:
    Type: String
    Description: 'Root domain name for the application (e.g., example.com)'
    Default: ''

  CreateCustomDomain:
    Type: String
    Description: 'Create custom domain and certificate (requires RootDomainName)'
    Default: 'false'
    AllowedValues: ['true', 'false']

Conditions:
  HasDomain: !Not [!Equals [!Ref RootDomainName, '']]
  CreateDomain: !And
    - !Condition HasDomain
    - !Equals [!Ref CreateCustomDomain, 'true']

Resources:
  # ============================================================================
  # DNS AND CERTIFICATE MANAGEMENT
  # ============================================================================

  # Route 53 Hosted Zone - Only created if domain is provided
  HostedZone:
    Type: AWS::Route53::HostedZone
    Condition: CreateDomain
    Properties:
      Name: !Ref RootDomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${RootDomainName} - ${EnvironmentSuffix} environment'
      HostedZoneTags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-HostedZone'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ACM Certificate for API Gateway custom domain
  Certificate:
    Type: AWS::CertificateManager::Certificate
    Condition: CreateDomain
    Properties:
      DomainName: !Sub 'api-${EnvironmentSuffix}.${RootDomainName}'
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Sub 'api-${EnvironmentSuffix}.${RootDomainName}'
          HostedZoneId: !Ref HostedZone
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-Certificate'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================================
  # S3 BUCKET FOR FILE STORAGE
  # ============================================================================

  FileProcessingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'serverless-files-${EnvironmentSuffix}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt FileProcessorFunction.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-Bucket'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================================
  # LAMBDA FUNCTION AND IAM ROLE
  # ============================================================================

  # IAM Role for Lambda with least privilege permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ServerlessApp-${EnvironmentSuffix}-LambdaRole'
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
        - PolicyName: S3ReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${FileProcessingBucket}/*'
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-LambdaRole'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Function for file processing
  FileProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'ServerlessApp-${EnvironmentSuffix}-FileProcessor'
      Runtime: python3.8
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      ReservedConcurrentExecutions: 10
      Environment:
        Variables:
          BUCKET_NAME: !Ref FileProcessingBucket
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from urllib.parse import unquote_plus

          def lambda_handler(event, context):
              print(f"Received event: {json.dumps(event)}")
              
              # Handle API Gateway requests
              if 'httpMethod' in event:
                  return handle_api_request(event, context)
              
              # Handle S3 events
              elif 'Records' in event:
                  return handle_s3_event(event, context)
              
              else:
                  return {
                      'statusCode': 400,
                      'body': json.dumps({'error': 'Unsupported event type'})
                  }

          def handle_api_request(event, context):
              try:
                  method = event['httpMethod']
                  path = event['path']
                  
                  response_body = {
                      'message': f'File processor API - {method} {path}',
                      'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                      'bucket': os.environ.get('BUCKET_NAME', 'unknown'),
                      'timestamp': context.aws_request_id
                  }
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*',
                          'Access-Control-Allow-Headers': 'Content-Type',
                          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                      },
                      'body': json.dumps(response_body)
                  }
              except Exception as e:
                  print(f"API Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': 'Internal server error'})
                  }

          def handle_s3_event(event, context):
              try:
                  s3_client = boto3.client('s3')
                  processed_files = []
                  
                  for record in event['Records']:
                      bucket = record['s3']['bucket']['name']
                      key = unquote_plus(record['s3']['object']['key'])
                      
                      print(f"Processing file: {key} from bucket: {bucket}")
                      
                      # Get object metadata
                      response = s3_client.head_object(Bucket=bucket, Key=key)
                      file_size = response['ContentLength']
                      
                      processed_files.append({
                          'bucket': bucket,
                          'key': key,
                          'size': file_size,
                          'event': record['eventName']
                      })
                  
                  print(f"Successfully processed {len(processed_files)} files")
                  return {
                      'statusCode': 200,
                      'processedFiles': processed_files
                  }
              except Exception as e:
                  print(f"S3 Processing Error: {str(e)}")
                  raise e
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-Function'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================================
  # API GATEWAY WITH CUSTOM DOMAIN
  # ============================================================================

  # REST API Gateway
  FileProcessorApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'ServerlessApp-${EnvironmentSuffix}-API'
      Description: 'File processor REST API'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-API'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # API Gateway Resource
  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref FileProcessorApi
      ParentId: !GetAtt FileProcessorApi.RootResourceId
      PathPart: 'process'

  # API Gateway Method (GET)
  ApiMethodGet:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FileProcessorApi
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${FileProcessorFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseHeaders:
            Access-Control-Allow-Origin: "'*'"
            Access-Control-Allow-Headers: "'Content-Type'"
            Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"

  # API Gateway Method (POST)
  ApiMethodPost:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FileProcessorApi
      ResourceId: !Ref ApiResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${FileProcessorFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseHeaders:
            Access-Control-Allow-Origin: "'*'"
            Access-Control-Allow-Headers: "'Content-Type'"
            Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"

  # CORS OPTIONS Method
  ApiMethodOptions:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref FileProcessorApi
      ResourceId: !Ref ApiResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        RequestTemplates:
          application/json: '{"statusCode": 200}'
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"
            ResponseTemplates:
              application/json: ''
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - ApiMethodGet
      - ApiMethodPost
      - ApiMethodOptions
    Properties:
      RestApiId: !Ref FileProcessorApi
      StageName: !Ref EnvironmentSuffix
      StageDescription: !Sub 'Deployment for ${EnvironmentSuffix} environment'

  # Custom Domain Name (only if domain is provided)
  ApiDomainName:
    Type: AWS::ApiGateway::DomainName
    Condition: CreateDomain
    Properties:
      DomainName: !Sub 'api-${EnvironmentSuffix}.${RootDomainName}'
      CertificateArn: !Ref Certificate
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-Domain'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Base Path Mapping
  ApiBasePathMapping:
    Type: AWS::ApiGateway::BasePathMapping
    Condition: CreateDomain
    Properties:
      DomainName: !Ref ApiDomainName
      RestApiId: !Ref FileProcessorApi
      Stage: !Ref EnvironmentSuffix

  # Route 53 A Record for API Gateway custom domain
  ApiDnsRecord:
    Type: AWS::Route53::RecordSet
    Condition: CreateDomain
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'api-${EnvironmentSuffix}.${RootDomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt ApiDomainName.RegionalDomainName
        HostedZoneId: !GetAtt ApiDomainName.RegionalHostedZoneId

  # ============================================================================
  # EVENT TRIGGERS AND PERMISSIONS
  # ============================================================================

  # Lambda permission for S3 to invoke the function
  S3InvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref FileProcessorFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !Sub '${FileProcessingBucket}/*'

  # Lambda permission for API Gateway to invoke the function
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref FileProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${FileProcessorApi}/*/GET/process'

  ApiGatewayInvokePermissionPost:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref FileProcessorFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${FileProcessorApi}/*/POST/process'

  # ============================================================================
  # MONITORING AND ALERTING
  # ============================================================================

  # SNS Topic for alerts
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'ServerlessApp-${EnvironmentSuffix}-Alerts'
      DisplayName: !Sub 'Serverless App Alerts - ${EnvironmentSuffix}'
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-AlertTopic'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # CloudWatch Alarm for Lambda error rate
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ServerlessApp-${EnvironmentSuffix}-LambdaErrors'
      AlarmDescription: 'Alarm when Lambda error rate exceeds 5%'
      MetricName: ErrorRate
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref FileProcessorFunction
      AlarmActions:
        - !Ref AlertTopic
      Tags:
        - Key: Name
          Value: !Sub 'ServerlessApp-${EnvironmentSuffix}-ErrorAlarm'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

# ============================================================================
# OUTPUTS
# ============================================================================

Outputs:
  BucketName:
    Description: 'Name of the S3 bucket for file uploads'
    Value: !Ref FileProcessingBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'

  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref FileProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunction'

  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${FileProcessorApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/process'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  CustomDomainUrl:
    Condition: CreateDomain
    Description: 'Custom domain URL for the API'
    Value: !Sub 'https://api-${EnvironmentSuffix}.${RootDomainName}/process'
    Export:
      Name: !Sub '${AWS::StackName}-CustomDomainUrl'

  HostedZoneId:
    Condition: CreateDomain
    Description: 'Route 53 Hosted Zone ID'
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZoneId'

  HostedZoneNameServers:
    Condition: CreateDomain
    Description: 'Name servers for the hosted zone (configure these with your domain registrar)'
    Value: !Join [', ', !GetAtt HostedZone.NameServers]

  SNSTopicArn:
    Description: 'SNS Topic ARN for alerts'
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic'

  Environment:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

## Key Features and Architecture

### **Infrastructure Components**

1. **DNS Management**: Creates a Route 53 hosted zone and manages DNS records
2. **SSL/TLS**: Provisions ACM certificates with automatic DNS validation
3. **Storage**: S3 bucket with versioning and event notifications
4. **Compute**: Lambda function with cost controls and proper IAM permissions
5. **API**: REST API Gateway with CORS support and optional custom domain
6. **Monitoring**: CloudWatch alarms and SNS notifications

### **Deployment Instructions**

```bash
# Deploy with custom domain
aws cloudformation create-stack \
  --stack-name serverless-app-prod \
  --template-body file://template.yaml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
               ParameterKey=RootDomainName,ParameterValue=example.com \
               ParameterKey=CreateCustomDomain,ParameterValue=true \
  --capabilities CAPABILITY_NAMED_IAM

# Deploy without custom domain
aws cloudformation create-stack \
  --stack-name serverless-app-dev \
  --template-body file://template.yaml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

### **Usage Examples**

**API Testing:**

```bash
# Test the API endpoint
curl https://api-prod.example.com/process

# Upload file to S3 (triggers Lambda automatically)
aws s3 cp myfile.txt s3://serverless-files-prod-123456789012/
```

### **Important Notes**

1. **Certificate Validation**: Stack deployment may pause during ACM certificate DNS validation. This is normal and can take 5-30 minutes.

2. **Domain Configuration**: After deployment, configure your domain registrar to use the Route 53 name servers shown in the outputs.

3. **Cost Control**: Lambda concurrency is limited to 10 to prevent runaway costs.

4. **Security**: All resources follow least-privilege principles and include proper tagging.

This template creates a production-ready, event-driven serverless application that automatically processes files uploaded to S3 while also providing a public REST API for direct interaction.
