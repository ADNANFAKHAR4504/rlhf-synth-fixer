```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Secure Serverless Web Application with Lambda, API Gateway, and S3'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]
    Description: Environment name for resource naming
  
  BucketName:
    Type: String
    Default: !Sub '${AWS::StackName}-lambda-assets-${AWS::AccountId}'
    Description: S3 bucket name for Lambda assets

Globals:
  Function:
    Timeout: 30
    MemorySize: 128
    Runtime: python3.8
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        LOG_LEVEL: INFO

Resources:
  # S3 Bucket for Lambda Assets with Encryption
  LambdaAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
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
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt ProcessS3EventFunction.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: Lambda Assets Storage

  # Lambda Execution Role with Least Privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-lambda-execution-role'
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
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${LambdaAssetsBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt LambdaAssetsBucket.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'

  # Main Lambda Function for API Gateway
  MainApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-main-api-function'
      CodeUri: .
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Description: Main API function for handling HTTP requests
      Environment:
        Variables:
          BUCKET_NAME: !Ref LambdaAssetsBucket
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /{proxy+}
            Method: ANY
        RootApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ServerlessApi
            Path: /
            Method: ANY
      InlineCode: |
        import json
        import boto3
        import os
        import logging
        from datetime import datetime

        # Configure logging
        logger = logging.getLogger()
        logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

        # Initialize AWS clients
        s3_client = boto3.client('s3')

        def lambda_handler(event, context):
            """
            Main Lambda handler for API Gateway requests
            """
            try:
                # Log the incoming event
                logger.info(f"Received event: {json.dumps(event, default=str)}")
                
                # Extract request information
                http_method = event.get('httpMethod', 'GET')
                path = event.get('path', '/')
                query_params = event.get('queryStringParameters') or {}
                headers = event.get('headers', {})
                body = event.get('body')
                
                # Route based on path and method
                if path == '/' and http_method == 'GET':
                    return handle_root_request(event, context)
                elif path == '/health' and http_method == 'GET':
                    return handle_health_check(event, context)
                elif path == '/upload' and http_method == 'POST':
                    return handle_file_upload(event, context, body)
                elif path.startswith('/files') and http_method == 'GET':
                    return handle_file_list(event, context)
                else:
                    return create_response(404, {'error': 'Not Found', 'path': path, 'method': http_method})
                    
            except Exception as e:
                logger.error(f"Error processing request: {str(e)}")
                return create_response(500, {'error': 'Internal Server Error', 'message': str(e)})

        def handle_root_request(event, context):
            """Handle root path requests"""
            response_body = {
                'message': 'Welcome to the Secure Serverless Web Application!',
                'timestamp': datetime.utcnow().isoformat(),
                'version': '1.0.0',
                'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                'available_endpoints': [
                    'GET / - This welcome message',
                    'GET /health - Health check',
                    'POST /upload - Upload file to S3',
                    'GET /files - List files in S3 bucket'
                ]
            }
            return create_response(200, response_body)

        def handle_health_check(event, context):
            """Handle health check requests"""
            try:
                # Test S3 connectivity
                bucket_name = os.environ.get('BUCKET_NAME')
                s3_client.head_bucket(Bucket=bucket_name)
                
                response_body = {
                    'status': 'healthy',
                    'timestamp': datetime.utcnow().isoformat(),
                    'services': {
                        's3': 'connected',
                        'lambda': 'running'
                    }
                }
                return create_response(200, response_body)
            except Exception as e:
                logger.error(f"Health check failed: {str(e)}")
                return create_response(503, {'status': 'unhealthy', 'error': str(e)})

        def handle_file_upload(event, context, body):
            """Handle file upload to S3"""
            try:
                if not body:
                    return create_response(400, {'error': 'No file content provided'})
                
                # Parse the request body (assuming JSON with file content)
                try:
                    file_data = json.loads(body)
                    filename = file_data.get('filename', f'upload_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.txt')
                    content = file_data.get('content', '')
                except json.JSONDecodeError:
                    # Treat body as raw content
                    filename = f'upload_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.txt'
                    content = body
                
                bucket_name = os.environ.get('BUCKET_NAME')
                key = f'uploads/{filename}'
                
                # Upload to S3
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=key,
                    Body=content,
                    ContentType='text/plain',
                    ServerSideEncryption='AES256'
                )
                
                response_body = {
                    'message': 'File uploaded successfully',
                    'filename': filename,
                    'key': key,
                    'bucket': bucket_name,
                    'timestamp': datetime.utcnow().isoformat()
                }
                return create_response(201, response_body)
                
            except Exception as e:
                logger.error(f"File upload failed: {str(e)}")
                return create_response(500, {'error': 'Upload failed', 'message': str(e)})

        def handle_file_list(event, context):
            """Handle file listing from S3"""
            try:
                bucket_name = os.environ.get('BUCKET_NAME')
                
                response = s3_client.list_objects_v2(
                    Bucket=bucket_name,
                    Prefix='uploads/',
                    MaxKeys=100
                )
                
                files = []
                if 'Contents' in response:
                    for obj in response['Contents']:
                        files.append({
                            'key': obj['Key'],
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'].isoformat(),
                            'etag': obj['ETag'].strip('"')
                        })
                
                response_body = {
                    'files': files,
                    'count': len(files),
                    'bucket': bucket_name,
                    'timestamp': datetime.utcnow().isoformat()
                }
                return create_response(200, response_body)
                
            except Exception as e:
                logger.error(f"File listing failed: {str(e)}")
                return create_response(500, {'error': 'Listing failed', 'message': str(e)})

        def create_response(status_code, body, headers=None):
            """Create a properly formatted API Gateway response"""
            default_headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            }
            
            if headers:
                default_headers.update(headers)
            
            return {
                'statusCode': status_code,
                'headers': default_headers,
                'body': json.dumps(body, default=str, indent=2)
            }

  # S3 Event Processing Lambda Function
  ProcessS3EventFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-s3-event-processor'
      CodeUri: .
      Handler: s3_processor.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Description: Process S3 bucket events
      InlineCode: |
        import json
        import boto3
        import logging
        import os
        from datetime import datetime

        logger = logging.getLogger()
        logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

        def lambda_handler(event, context):
            """
            Process S3 bucket events
            """
            try:
                logger.info(f"Received S3 event: {json.dumps(event, default=str)}")
                
                for record in event.get('Records', []):
                    if record.get('eventSource') == 'aws:s3':
                        bucket_name = record['s3']['bucket']['name']
                        object_key = record['s3']['object']['key']
                        event_name = record['eventName']
                        
                        logger.info(f"Processing {event_name} for object {object_key} in bucket {bucket_name}")
                        
                        # Add your S3 event processing logic here
                        # For example: virus scanning, metadata extraction, notifications, etc.
                        
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'S3 events processed successfully',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                }
                
            except Exception as e:
                logger.error(f"Error processing S3 event: {str(e)}")
                raise

  # S3 Bucket Permission for Lambda
  S3BucketPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt ProcessS3EventFunction.Arn
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !GetAtt LambdaAssetsBucket.Arn

  # API Gateway with Security Configuration
  ServerlessApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${AWS::StackName}-serverless-api'
      StageName: !Ref Environment
      Description: Secure Serverless API Gateway
      EndpointConfiguration:
        Type: REGIONAL
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
          ThrottlingRateLimit: 100
          ThrottlingBurstLimit: 200
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: >
          {
            "requestId": "$context.requestId",
            "ip": "$context.identity.sourceIp",
            "caller": "$context.identity.caller",
            "user": "$context.identity.user",
            "requestTime": "$context.requestTime",
            "httpMethod": "$context.httpMethod",
            "resourcePath": "$context.resourcePath",
            "status": "$context.status",
            "protocol": "$context.protocol",
            "responseLength": "$context.responseLength"
          }
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
        MaxAge: "'600'"
      GatewayResponses:
        DEFAULT_4XX:
          ResponseParameters:
            Headers:
              Access-Control-Allow-Origin: "'*'"
              Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        DEFAULT_5XX:
          ResponseParameters:
            Headers:
              Access-Control-Allow-Origin: "'*'"
              Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"

  # CloudWatch Log Group for API Gateway
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${AWS::StackName}-serverless-api'
      RetentionInDays: 14

  # Usage Plan for API Rate Limiting
  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub '${AWS::StackName}-usage-plan'
      Description: Usage plan for serverless API
      ApiStages:
        - ApiId: !Ref ServerlessApi
          Stage: !Ref Environment
      Throttle:
        RateLimit: 100
        BurstLimit: 200
      Quota:
        Limit: 10000
        Period: DAY

  # API Key for Usage Plan
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub '${AWS::StackName}-api-key'
      Description: API Key for serverless application
      Enabled: true

  # Link API Key to Usage Plan
  ApiUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ApiUsagePlan

Outputs:
  ApiGatewayUrl:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-api-url'

  S3BucketName:
    Description: S3 bucket name for Lambda assets
    Value: !Ref LambdaAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-s3-bucket'

  LambdaFunctionArn:
    Description: Main Lambda function ARN
    Value: !GetAtt MainApiFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-arn'

  ApiKeyId:
    Description: API Gateway API Key ID
    Value: !Ref ApiKey
    Export:
      Name: !Sub '${AWS::StackName}-api-key-id'

  LambdaExecutionRoleArn:
    Description: Lambda execution role ARN
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-role-arn'
```