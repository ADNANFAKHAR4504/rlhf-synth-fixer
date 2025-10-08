AWSTemplateFormatVersion: '2010-09-09'
Description: 'Scalable Travel Platform API with Caching, Monitoring, and Event-Driven Integration'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Deployment environment'
  
  CacheNodeType:
    Type: String
    Default: 'cache.t3.micro'
    Description: 'ElastiCache node instance type'
  
  ApiThrottlingRate:
    Type: Number
    Default: 10000
    Description: 'API Gateway throttling rate limit'
  
  ApiThrottlingBurst:
    Type: Number
    Default: 5000
    Description: 'API Gateway throttling burst limit'

Resources:
  # VPC Configuration for ElastiCache
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: 'Subnet group for ElastiCache cluster'
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-subnet-group'

  # Security Group for ElastiCache
  CacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for ElastiCache Redis cluster'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cache-sg'

  # ElastiCache Redis Cluster
  CacheCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: !Ref CacheNodeType
      Engine: 'redis'
      NumCacheNodes: 1
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      VpcSecurityGroupIds:
        - !Ref CacheSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-redis-cache'
        - Key: Environment
          Value: !Ref Environment

  # DynamoDB Table for Travel Data
  TravelDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-travel-data'
      AttributeDefinitions:
        - AttributeName: 'searchType'
          AttributeType: 'S'
        - AttributeName: 'searchId'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'N'
      KeySchema:
        - AttributeName: 'searchType'
          KeyType: 'HASH'
        - AttributeName: 'searchId'
          KeyType: 'RANGE'
      GlobalSecondaryIndexes:
        - IndexName: 'timestamp-index'
          KeySchema:
            - AttributeName: 'searchType'
              KeyType: 'HASH'
            - AttributeName: 'timestamp'
              KeyType: 'RANGE'
          Projection:
            ProjectionType: 'ALL'
      BillingMode: 'PAY_PER_REQUEST'
      StreamSpecification:
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-travel-data'
        - Key: Environment
          Value: !Ref Environment

  # Lambda Security Group
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-lambda-sg'

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        - 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      Policies:
        - PolicyName: 'TravelApiPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:BatchGetItem'
                Resource:
                  - !GetAtt TravelDataTable.Arn
                  - !Sub '${TravelDataTable.Arn}/index/*'
              - Effect: Allow
                Action:
                  - 'elasticache:DescribeCacheClusters'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'events:PutEvents'
                Resource: !GetAtt EventBus.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: '*'

  # Lambda Function for Search API
  SearchLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-search-api'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Code:
        ZipFile: |
          import json
          import os
          import boto3
          import redis
          import time
          import logging
          from decimal import Decimal
          from aws_xray_sdk.core import xray_recorder
          from aws_xray_sdk.core import patch_all

          patch_all()

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          # Initialize AWS clients
          dynamodb = boto3.resource('dynamodb')
          events = boto3.client('events')
          cloudwatch = boto3.client('cloudwatch')

          # Environment variables
          TABLE_NAME = os.environ['TABLE_NAME']
          CACHE_ENDPOINT = os.environ['CACHE_ENDPOINT']
          EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
          
          # Initialize Redis connection
          try:
              redis_client = redis.Redis(
                  host=CACHE_ENDPOINT,
                  port=6379,
                  db=0,
                  decode_responses=True,
                  socket_connect_timeout=5,
                  socket_timeout=5
              )
          except Exception as e:
              logger.error(f"Failed to connect to Redis: {str(e)}")
              redis_client = None

          def lambda_handler(event, context):
              request_id = context.request_id
              start_time = time.time()
              
              try:
                  # Parse request
                  http_method = event.get('httpMethod', 'GET')
                  path = event.get('path', '')
                  query_params = event.get('queryStringParameters', {}) or {}
                  
                  # Route based on path and method
                  if path == '/search' and http_method == 'GET':
                      response = handle_search(query_params, request_id)
                  else:
                      response = {
                          'statusCode': 404,
                          'body': json.dumps({'error': 'Not Found'})
                      }
                  
                  # Record metrics
                  duration = (time.time() - start_time) * 1000
                  record_metrics(path, response['statusCode'], duration)
                  
                  # Add CORS headers
                  response['headers'] = {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                      'X-Request-ID': request_id
                  }
                  
                  return response
                  
              except Exception as e:
                  logger.error(f"Unhandled error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'X-Request-ID': request_id
                      },
                      'body': json.dumps({'error': 'Internal Server Error'})
                  }

          @xray_recorder.capture('search_handler')
          def handle_search(params, request_id):
              search_type = params.get('type', 'flight')
              search_query = params.get('q', '')
              
              if not search_query:
                  return {
                      'statusCode': 400,
                      'body': json.dumps({'error': 'Query parameter "q" is required'})
                  }
              
              # Generate cache key
              cache_key = f"search:{search_type}:{search_query}"
              
              # Try cache first
              if redis_client:
                  try:
                      cached_result = redis_client.get(cache_key)
                      if cached_result:
                          logger.info(f"Cache hit for {cache_key}")
                          return {
                              'statusCode': 200,
                              'body': cached_result
                          }
                  except Exception as e:
                      logger.warning(f"Redis error: {str(e)}")
              
              # Cache miss - query DynamoDB
              table = dynamodb.Table(TABLE_NAME)
              timestamp = int(time.time())
              
              try:
                  response = table.get_item(
                      Key={
                          'searchType': search_type,
                          'searchId': search_query
                      }
                  )
                  
                  if 'Item' in response:
                      result = response['Item']
                  else:
                      # Simulate fetching from external API
                      result = fetch_from_external_api(search_type, search_query)
                      
                      # Store in DynamoDB
                      table.put_item(Item={
                          'searchType': search_type,
                          'searchId': search_query,
                          'timestamp': timestamp,
                          'data': result,
                          'ttl': timestamp + 3600  # 1 hour TTL
                      })
                      
                      # Publish event for external integration
                      publish_integration_event(search_type, search_query, request_id)
                  
                  # Cache the result
                  result_json = json.dumps(result, cls=DecimalEncoder)
                  if redis_client:
                      try:
                          redis_client.setex(cache_key, 300, result_json)  # 5 minutes cache
                      except Exception as e:
                          logger.warning(f"Failed to cache result: {str(e)}")
                  
                  return {
                      'statusCode': 200,
                      'body': result_json
                  }
                  
              except Exception as e:
                  logger.error(f"Database error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': 'Failed to process search'})
                  }

          def fetch_from_external_api(search_type, query):
              # Simulated external API response
              return {
                  'searchType': search_type,
                  'query': query,
                  'results': [
                      {
                          'id': f"{search_type}-1",
                          'name': f"Sample {search_type} result",
                          'price': 299.99,
                          'currency': 'USD'
                      }
                  ],
                  'timestamp': int(time.time())
              }

          def publish_integration_event(search_type, query, request_id):
              try:
                  events.put_events(
                      Entries=[
                          {
                              'Source': 'travel.platform.search',
                              'DetailType': 'Search Request',
                              'Detail': json.dumps({
                                  'searchType': search_type,
                                  'query': query,
                                  'requestId': request_id,
                                  'timestamp': int(time.time())
                              }),
                              'EventBusName': EVENT_BUS_NAME
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f"Failed to publish event: {str(e)}")

          def record_metrics(endpoint, status_code, duration):
              try:
                  cloudwatch.put_metric_data(
                      Namespace='TravelPlatform/API',
                      MetricData=[
                          {
                              'MetricName': 'RequestLatency',
                              'Dimensions': [
                                  {'Name': 'Endpoint', 'Value': endpoint},
                                  {'Name': 'StatusCode', 'Value': str(status_code)}
                              ],
                              'Value': duration,
                              'Unit': 'Milliseconds'
                          },
                          {
                              'MetricName': 'RequestCount',
                              'Dimensions': [
                                  {'Name': 'Endpoint', 'Value': endpoint},
                                  {'Name': 'StatusCode', 'Value': str(status_code)}
                              ],
                              'Value': 1,
                              'Unit': 'Count'
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f"Failed to record metrics: {str(e)}")

          class DecimalEncoder(json.JSONEncoder):
              def default(self, obj):
                  if isinstance(obj, Decimal):
                      return float(obj)
                  return super(DecimalEncoder, self).default(obj)
      Environment:
        Variables:
          TABLE_NAME: !Ref TravelDataTable
          CACHE_ENDPOINT: !GetAtt CacheCluster.RedisEndpoint.Address
          EVENT_BUS_NAME: !Ref EventBus
      MemorySize: 1024
      Timeout: 30
      TracingConfig:
        Mode: Active
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnetA
          - !Ref PrivateSubnetB
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-search-lambda'
        - Key: Environment
          Value: !Ref Environment

  # Lambda Log Group
  SearchLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${SearchLambdaFunction}'
      RetentionInDays: 14

  # API Gateway
  TravelApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${AWS::StackName}-travel-api'
      Description: 'Travel Platform REST API'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-api'
        - Key: Environment
          Value: !Ref Environment

  # API Gateway Resource
  SearchResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref TravelApi
      ParentId: !GetAtt TravelApi.RootResourceId
      PathPart: 'search'

  # API Gateway Method
  SearchMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref TravelApi
      ResourceId: !Ref SearchResource
      HttpMethod: GET
      AuthorizationType: API_KEY
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SearchLambdaFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
        - StatusCode: 400
        - StatusCode: 500

  # Lambda Permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SearchLambdaFunction
      Action: 'lambda:InvokeFunction'
      Principal: 'apigateway.amazonaws.com'
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${TravelApi}/*/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - SearchMethod
    Properties:
      RestApiId: !Ref TravelApi
      StageName: !Ref Environment
      StageDescription:
        TracingEnabled: true
        LoggingLevel: INFO
        MetricsEnabled: true
        ThrottlingRateLimit: !Ref ApiThrottlingRate
        ThrottlingBurstLimit: !Ref ApiThrottlingBurst

  # API Usage Plan
  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: ApiDeployment
    Properties:
      ApiStages:
        - ApiId: !Ref TravelApi
          Stage: !Ref Environment
      Description: 'Travel API Usage Plan'
      Throttle:
        RateLimit: !Ref ApiThrottlingRate
        BurstLimit: !Ref ApiThrottlingBurst
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-usage-plan'

  # API Key
  ApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: !Sub '${AWS::StackName}-api-key'
      Description: 'API Key for Travel Platform'
      Enabled: true
      StageKeys:
        - RestApiId: !Ref TravelApi
          StageName: !Ref Environment
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-api-key'

  # API Usage Plan Key
  ApiUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ApiUsagePlan

  # EventBridge Event Bus
  EventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: !Sub '${AWS::StackName}-travel-events'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-event-bus'
        - Key: Environment
          Value: !Ref Environment

  # EventBridge Rule for External Integration
  IntegrationRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-external-integration'
      Description: 'Route search events to external systems'
      EventBusName: !Ref EventBus
      EventPattern:
        source:
          - 'travel.platform.search'
        detail-type:
          - 'Search Request'
      State: ENABLED
      Targets:
        - Arn: !GetAtt IntegrationQueue.Arn
          Id: 'IntegrationTarget'

  # SQS Queue for External Integration
  IntegrationQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-integration-queue'
      VisibilityTimeout: 300
      MessageRetentionPeriod: 1209600  # 14 days
      ReceiveMessageWaitTimeSeconds: 20
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt IntegrationDLQ.Arn
        maxReceiveCount: 3
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-integration-queue'
        - Key: Environment
          Value: !Ref Environment

  # Dead Letter Queue
  IntegrationDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AWS::StackName}-integration-dlq'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: alias/aws/sqs

  # SQS Queue Policy
  IntegrationQueuePolicy:
    Type: AWS::SQS::QueuePolicy
    Properties:
      Queues:
        - !Ref IntegrationQueue
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action:
              - 'sqs:SendMessage'
            Resource: !GetAtt IntegrationQueue.Arn
            Condition:
              ArnEquals:
                aws:SourceArn: !GetAtt IntegrationRule.Arn

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-monitoring'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "Count", { "stat": "Sum" } ],
                  [ ".", "4XXError", { "stat": "Sum", "color": "#ff7f00" } ],
                  [ ".", "5XXError", { "stat": "Sum", "color": "#d62728" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "API Gateway Requests"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Duration", { "stat": "Average" } ],
                  [ ".", "Errors", { "stat": "Sum", "color": "#d62728" } ],
                  [ ".", "Throttles", { "stat": "Sum", "color": "#ff7f00" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda Performance"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/ElastiCache", "CacheHits", "CacheClusterId", "${CacheCluster}", { "stat": "Sum" } ],
                  [ ".", "CacheMisses", ".", ".", { "stat": "Sum", "color": "#ff7f00" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Cache Performance"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  [ "AWS/DynamoDB", "UserErrors", "TableName", "${TravelDataTable}", { "stat": "Sum", "color": "#ff7f00" } ],
                  [ ".", "SystemErrors", ".", ".", { "stat": "Sum", "color": "#d62728" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "DynamoDB Errors"
              }
            }
          ]
        }

  # CloudWatch Alarms
  ApiErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-api-errors'
      AlarmDescription: 'Alert when API error rate exceeds threshold'
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref TravelApi
      TreatMissingData: notBreaching

  LambdaThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-lambda-throttles'
      AlarmDescription: 'Alert when Lambda function is throttled'
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref SearchLambdaFunction
      TreatMissingData: notBreaching

  # X-Ray Service Map
  XRayServiceMap:
    Type: AWS::XRay::Group
    Properties:
      GroupName: !Sub '${AWS::StackName}-service-map'
      FilterExpression: !Sub 'service("${AWS::StackName}-search-api")'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-xray-group'
        - Key: Environment
          Value: !Ref Environment

  # VPC Resources (simplified for brevity)
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-a'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-b'

Outputs:
  ApiEndpoint:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${TravelApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'
  
  ApiKeyId:
    Description: 'API Key ID for authentication'
    Value: !Ref ApiKey
    Export:
      Name: !Sub '${AWS::StackName}-ApiKeyId'
  
  CacheEndpoint:
    Description: 'ElastiCache Redis endpoint'
    Value: !GetAtt CacheCluster.RedisEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-CacheEndpoint'
  
  DynamoTableName:
    Description: 'DynamoDB table name'
    Value: !Ref TravelDataTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'
  
  EventBusName:
    Description: 'EventBridge event bus name'
    Value: !Ref EventBus
    Export:
      Name: !Sub '${AWS::StackName}-EventBusName'
  
  DashboardURL:
    Description: 'CloudWatch Dashboard URL'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${MonitoringDashboard}'