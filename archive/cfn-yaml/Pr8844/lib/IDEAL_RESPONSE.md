```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31
Description: "TAP Stack - Task Assignment Platform SAM Template - Enhanced Production-Ready Serverless Application"

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for resource naming
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters.'
  
  ProjectName:
    Type: String
    Default: 'tap'
    Description: 'Project name for resource naming and tagging'

Globals:
  Function:
    Timeout: 30
    MemorySize: 128
    Runtime: python3.13
    Tracing: Active
    Environment:
      Variables:
        LOG_LEVEL: INFO
        POWERTOOLS_SERVICE_NAME: !Sub "${ProjectName}-${EnvironmentSuffix}"
        POWERTOOLS_METRICS_NAMESPACE: !Sub "${ProjectName}/${EnvironmentSuffix}"
    Tags:
      Environment: !Ref EnvironmentSuffix
      Project: !Ref ProjectName
      ManagedBy: SAM

Resources:
  # Enhanced Lambda Execution Role with comprehensive permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-${EnvironmentSuffix}-lambda-role"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action:
              - sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
      Policies:
        - PolicyName: EnhancedCloudWatchLogsPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                  - s3:GetBucketVersioning
                Resource:
                  - !Sub "${LambdaAssetsBucket}/*"
                  - !Ref LambdaAssetsBucket
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: SAM

  # Enhanced S3 Bucket with comprehensive security and lifecycle management
  LambdaAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-lambda-assets-${EnvironmentSuffix}-${AWS::AccountId}"
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
          - Id: AbortIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt TapFunction.Arn
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: SAM

  # S3 Bucket Policy for enhanced security
  LambdaAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LambdaAssetsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub "${LambdaAssetsBucket}/*"
              - !Ref LambdaAssetsBucket
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: DenyUnencryptedUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub "${LambdaAssetsBucket}/*"
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'AES256'

  # Lambda permission for S3 bucket notifications
  LambdaInvokePermissionS3:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref TapFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub "${LambdaAssetsBucket}"

  # Enhanced SAM Lambda Function with comprehensive features
  TapFunction:
    Type: AWS::Serverless::Function
    DependsOn: LambdaInvokePermissionS3
    Properties:
      FunctionName: !Sub "${ProjectName}-function-${EnvironmentSuffix}"
      Runtime: python3.13
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      ReservedConcurrencyLimit: 10
      DeadLetterQueue:
        Type: SQS
        TargetArn: !GetAtt TapFunctionDLQ.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix
          BUCKET_NAME: !Ref LambdaAssetsBucket
          PROJECT_NAME: !Ref ProjectName
          LOG_LEVEL: INFO
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY
            ApiId: !Ref TapHttpApi
        RootEvent:
          Type: HttpApi
          Properties:
            Path: /
            Method: ANY
            ApiId: !Ref TapHttpApi
      InlineCode: |
        import json
        import os
        import logging
        import re
        import boto3
        from datetime import datetime
        from typing import Dict, Any, List, Optional

        # Configure structured logging
        logger = logging.getLogger()
        log_level = os.environ.get('LOG_LEVEL', 'INFO')
        logger.setLevel(getattr(logging, log_level))

        # Initialize AWS clients
        s3_client = boto3.client('s3')

        def validate_email(email: str) -> bool:
            """Enhanced email validation with comprehensive regex"""
            if not email or not isinstance(email, str):
                return False
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            return re.match(pattern, email.strip()) is not None

        def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> List[str]:
            """Validate that required fields are present and non-empty in the data"""
            missing_fields = []
            for field in required_fields:
                value = data.get(field)
                if value is None or (isinstance(value, str) and not value.strip()):
                    missing_fields.append(field)
            return missing_fields

        def sanitize_input(data: Any) -> Any:
            """Comprehensive input sanitization with XSS protection"""
            if isinstance(data, dict):
                return {k: sanitize_input(v) for k, v in data.items()}
            elif isinstance(data, list):
                return [sanitize_input(item) for item in data]
            elif isinstance(data, str):
                # Remove potential XSS vectors
                data = re.sub(r'<script[^>]*>.*?</script>', '', data, flags=re.IGNORECASE | re.DOTALL)
                data = re.sub(r'<[^>]*>', '', data)  # Remove HTML tags
                data = re.sub(r'javascript:', '', data, flags=re.IGNORECASE)
                data = re.sub(r'vbscript:', '', data, flags=re.IGNORECASE)
                return data.strip()
            return data

        def create_response(status_code: int, body: Dict[str, Any], additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
            """Create standardized HTTP response"""
            headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            }
            
            if additional_headers:
                headers.update(additional_headers)
            
            # Add request ID and timestamp to response body
            body.update({
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'request_id': os.environ.get('AWS_REQUEST_ID', 'unknown')
            })
            
            response = {
                'statusCode': status_code,
                'headers': headers,
                'body': json.dumps(body, separators=(',', ':'))
            }
            
            logger.info(f"Response created - Status: {status_code}, Body length: {len(response['body'])}")
            return response

        def handle_s3_operations(action: str, data: Dict[str, Any]) -> Dict[str, Any]:
            """Handle S3 bucket operations securely"""
            bucket_name = os.environ.get('BUCKET_NAME')
            
            try:
                if action == 'list':
                    response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
                    objects = [{'key': obj['Key'], 'size': obj['Size'], 'modified': obj['LastModified'].isoformat()} 
                              for obj in response.get('Contents', [])]
                    return {'objects': objects, 'bucket': bucket_name}
                
                elif action == 'upload' and 'filename' in data and 'content' in data:
                    key = f"uploads/{sanitize_input(data['filename'])}"
                    s3_client.put_object(
                        Bucket=bucket_name,
                        Key=key,
                        Body=data['content'],
                        ServerSideEncryption='AES256'
                    )
                    return {'message': 'File uploaded successfully', 'key': key}
                
                else:
                    return {'error': 'Invalid S3 operation or missing parameters'}
                    
            except Exception as e:
                logger.error(f"S3 operation failed: {str(e)}")
                return {'error': 'S3 operation failed', 'details': str(e)}

        def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
            """
            Enhanced AWS Lambda handler for TAP serverless application.
            Handles HTTP requests from HTTP API Gateway (v2) with comprehensive features.
            """
            
            # Log incoming event (sanitized)
            event_copy = {k: v for k, v in event.items() if k != 'body'}
            logger.info(f"Processing request - Method: {event.get('requestContext', {}).get('http', {}).get('method')}, Path: {event.get('requestContext', {}).get('http', {}).get('path')}")
            
            try:
                # Extract request details
                request_context = event.get('requestContext', {})
                http_info = request_context.get('http', {})
                http_method = http_info.get('method', 'UNKNOWN')
                path = http_info.get('path', '/')
                
                # Get environment variables
                environment = os.environ.get('ENVIRONMENT', 'dev')
                bucket_name = os.environ.get('BUCKET_NAME', 'unknown')
                project_name = os.environ.get('PROJECT_NAME', 'tap')

                # Route based on HTTP method and path
                if http_method == 'GET':
                    if path in ['/health', '/']:
                        response_body = {
                            'message': f'{project_name.upper()} Serverless Application is running!',
                            'status': 'healthy',
                            'environment': environment,
                            'bucket': bucket_name,
                            'path': path,
                            'method': http_method,
                            'version': '2.0.0',
                            'features': ['input_validation', 'xss_protection', 's3_integration', 'structured_logging']
                        }
                        return create_response(200, response_body)
                    
                    elif path.startswith('/api/'):
                        query_params = event.get('queryStringParameters') or {}
                        path_params = event.get('pathParameters') or {}
                        
                        # Handle specific API endpoints
                        if path == '/api/s3/list':
                            s3_result = handle_s3_operations('list', {})
                            if 'error' in s3_result:
                                return create_response(500, s3_result)
                            
                            response_body = {
                                'message': 'S3 objects retrieved successfully',
                                's3_data': s3_result,
                                'query_parameters': query_params,
                                'environment': environment
                            }
                            return create_response(200, response_body)
                        
                        else:
                            response_body = {
                                'message': f'GET API endpoint {path}',
                                'query_parameters': query_params,
                                'path_parameters': path_params,
                                'environment': environment,
                                'available_endpoints': ['/api/s3/list']
                            }
                            return create_response(200, response_body)
                    else:
                        response_body = {
                            'error': f'GET endpoint {path} not found',
                            'available_endpoints': {
                                'health_check': ['/health', '/'],
                                'api_endpoints': ['/api/s3/list']
                            },
                            'message': 'Please use one of the available endpoints'
                        }
                        return create_response(404, response_body)

                elif http_method == 'POST':
                    try:
                        request_body = json.loads(event.get('body', '{}'))
                        
                        if not request_body:
                            response_body = {
                                'error': 'POST request requires a request body',
                                'message': 'Please provide valid JSON data'
                            }
                            return create_response(400, response_body)
                        
                        # Sanitize input data
                        sanitized_data = sanitize_input(request_body)
                        
                        # Enhanced validation
                        if 'email' in sanitized_data and not validate_email(sanitized_data['email']):
                            response_body = {
                                'error': 'Invalid email format',
                                'message': 'Please provide a valid email address',
                                'example': 'user@example.com'
                            }
                            return create_response(400, response_body)
                        
                        # Handle S3 upload operations
                        if path == '/api/s3/upload':
                            missing_fields = validate_required_fields(sanitized_data, ['filename', 'content'])
                            if missing_fields:
                                response_body = {
                                    'error': f'Missing required fields: {", ".join(missing_fields)}',
                                    'required_fields': ['filename', 'content']
                                }
                                return create_response(400, response_body)
                            
                            s3_result = handle_s3_operations('upload', sanitized_data)
                            if 'error' in s3_result:
                                return create_response(500, s3_result)
                            
                            response_body = {
                                'message': 'POST request processed successfully',
                                'action': 'file_uploaded',
                                's3_result': s3_result,
                                'environment': environment
                            }
                            return create_response(201, response_body)
                        
                        else:
                            response_body = {
                                'message': 'POST request processed successfully',
                                'action': 'resource_created',
                                'received_data': {k: v for k, v in sanitized_data.items() if k != 'content'},  # Don't log file content
                                'environment': environment
                            }
                            return create_response(201, response_body)
                            
                    except json.JSONDecodeError as e:
                        response_body = {
                            'error': 'Invalid JSON in request body',
                            'message': 'POST request body must be valid JSON',
                            'details': str(e)
                        }
                        return create_response(400, response_body)

                elif http_method == 'PUT':
                    try:
                        request_body = json.loads(event.get('body', '{}'))
                        
                        if not request_body:
                            response_body = {
                                'error': 'PUT request requires a request body',
                                'message': 'Please provide data to update'
                            }
                            return create_response(400, response_body)
                        
                        sanitized_data = sanitize_input(request_body)
                        
                        # Validate required fields for update operations
                        missing_fields = validate_required_fields(sanitized_data, ['id'])
                        if missing_fields:
                            response_body = {
                                'error': f'Missing required fields: {", ".join(missing_fields)}',
                                'message': 'PUT requests must include an id field',
                                'required_fields': ['id']
                            }
                            return create_response(400, response_body)
                        
                        # Additional email validation if present
                        if 'email' in sanitized_data and not validate_email(sanitized_data['email']):
                            response_body = {
                                'error': 'Invalid email format',
                                'message': 'Please provide a valid email address'
                            }
                            return create_response(400, response_body)
                        
                        response_body = {
                            'message': 'PUT request processed successfully',
                            'action': 'resource_updated',
                            'resource_id': sanitized_data.get('id'),
                            'updated_fields': list(sanitized_data.keys()),
                            'environment': environment
                        }
                        return create_response(200, response_body)
                        
                    except json.JSONDecodeError as e:
                        response_body = {
                            'error': 'Invalid JSON in request body',
                            'message': 'PUT request body must be valid JSON',
                            'details': str(e)
                        }
                        return create_response(400, response_body)

                elif http_method == 'DELETE':
                    query_params = event.get('queryStringParameters') or {}
                    path_params = event.get('pathParameters') or {}
                    
                    # Extract resource identifier
                    resource_id = path_params.get('id') or query_params.get('id')
                    
                    if not resource_id:
                        response_body = {
                            'error': 'Missing resource identifier',
                            'message': 'DELETE requests require an id parameter',
                            'examples': [
                                f'{path}?id=123',
                                '/api/resource/123'
                            ]
                        }
                        return create_response(400, response_body)
                    
                    # Validate resource ID
                    if not str(resource_id).strip() or len(str(resource_id)) > 100:
                        response_body = {
                            'error': 'Invalid resource identifier',
                            'message': 'Resource ID must be non-empty and less than 100 characters'
                        }
                        return create_response(400, response_body)
                    
                    response_body = {
                        'message': 'DELETE request processed successfully',
                        'action': 'resource_deleted',
                        'resource_id': sanitize_input(resource_id),
                        'path': path,
                        'environment': environment
                    }
                    return create_response(200, response_body)

                elif http_method == 'OPTIONS':
                    response_body = {
                        'message': 'CORS preflight response',
                        'allowed_methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                        'allowed_headers': ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
                        'environment': environment
                    }
                    return create_response(200, response_body)

                else:
                    response_body = {
                        'error': f'HTTP method {http_method} is not supported',
                        'path': path,
                        'supported_methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                        'message': 'Please use one of the supported HTTP methods'
                    }
                    return create_response(405, response_body)

            except Exception as e:
                logger.error(f"Unhandled error in lambda_handler: {str(e)}", exc_info=True)
                response_body = {
                    'error': 'Internal server error',
                    'message': 'An unexpected error occurred',
                    'request_id': os.environ.get('AWS_REQUEST_ID', 'unknown')
                }
                return create_response(500, response_body)

  # Dead Letter Queue for failed Lambda invocations
  TapFunctionDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub "${ProjectName}-${EnvironmentSuffix}-dlq"
      MessageRetentionPeriod: 1209600  # 14 days
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: SAM

  # Enhanced HTTP API with comprehensive configuration
  TapHttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: !Ref EnvironmentSuffix
      Description: !Sub "TAP HTTP API for ${EnvironmentSuffix} environment"
      CorsConfiguration:
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowHeaders:
          - Content-Type
          - X-Amz-Date
          - Authorization
          - X-Api-Key
          - X-Amz-Security-Token
        AllowOrigins:
          - "*"
        MaxAge: 86400
      AccessLogSettings:
        DestinationArn: !GetAtt HttpApiLogGroup.Arn
        Format: >
          {
            "requestId": "$context.requestId",
            "requestTime": "$context.requestTime",
            "httpMethod": "$context.httpMethod",
            "path": "$context.path",
            "status": "$context.status",
            "responseLength": "$context.responseLength",
            "responseTime": "$context.responseTime",
            "userAgent": "$context.identity.userAgent",
            "sourceIp": "$context.identity.sourceIp"
          }
      DefaultRouteSettings:
        ThrottlingBurstLimit: 200
        ThrottlingRateLimit: 100
      Tags:
        Environment: !Ref EnvironmentSuffix
        Project: !Ref ProjectName
        ManagedBy: SAM

  # CloudWatch Log Group for HTTP API Access Logs
  HttpApiLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/apigateway/${ProjectName}-${EnvironmentSuffix}-httpapi"
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: SAM

  # CloudWatch Log Group for Lambda Function
  TapFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${TapFunction}"
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: !Ref ProjectName
        - Key: ManagedBy
          Value: SAM

  # CloudWatch Alarm for Lambda Errors
  TapFunctionErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-${EnvironmentSuffix}-lambda-errors"
      AlarmDescription: "Alarm for Lambda function errors"
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref TapFunction
      TreatMissingData: notBreaching

  # CloudWatch Alarm for Lambda Duration
  TapFunctionDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-${EnvironmentSuffix}-lambda-duration"
      AlarmDescription: "Alarm for Lambda function duration"
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000  # 25 seconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref TapFunction
      TreatMissingData: notBreaching

Outputs:
  HttpApiUrl:
    Description: "HTTP API endpoint URL"
    Value: !Sub "https://${TapHttpApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/"
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-ApiUrl"

  HttpApiId:
    Description: "HTTP API ID"
    Value: !Ref TapHttpApi
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-ApiId"

  LambdaFunctionArn:
    Description: "Lambda Function ARN"
    Value: !GetAtt TapFunction.Arn
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-LambdaArn"

  LambdaFunctionName:
    Description: "Lambda Function Name"
    Value: !Ref TapFunction
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-LambdaName"

  S3BucketName:
    Description: "S3 Bucket for Lambda assets"
    Value: !Ref LambdaAssetsBucket
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-S3Bucket"

  S3BucketArn:
    Description: "S3 Bucket ARN"
    Value: !GetAtt LambdaAssetsBucket.Arn
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-S3BucketArn"

  LambdaExecutionRoleArn:
    Description: "Lambda Execution Role ARN"
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-RoleArn"

  DeadLetterQueueUrl:
    Description: "Dead Letter Queue URL"
    Value: !Ref TapFunctionDLQ
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-DLQUrl"

  DeadLetterQueueArn:
    Description: "Dead Letter Queue ARN"
    Value: !GetAtt TapFunctionDLQ.Arn
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-DLQArn"

  Region:
    Description: "AWS Region where resources are deployed"
    Value: !Ref "AWS::Region"
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-Region"

  Environment:
    Description: "Environment suffix"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${ProjectName}-${EnvironmentSuffix}-Environment"
```