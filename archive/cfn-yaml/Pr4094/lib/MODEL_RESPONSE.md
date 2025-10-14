AWSTemplateFormatVersion: '2010-09-09'
Description: 'IoT Analytics and Dashboard System for Smart City Traffic Monitoring'

Parameters:
  EnvironmentName:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]
    Description: Environment name for resource naming
  
  KinesisShardCount:
    Type: Number
    Default: 10
    MinValue: 1
    MaxValue: 100
    Description: Number of shards for Kinesis Data Stream
  
  DynamoDBReadCapacity:
    Type: Number
    Default: 100
    MinValue: 5
    Description: Read capacity units for DynamoDB table
  
  DynamoDBWriteCapacity:
    Type: Number
    Default: 1000
    MinValue: 5
    Description: Write capacity units for DynamoDB table
  
  AlertThresholdCongestionIndex:
    Type: Number
    Default: 80
    MinValue: 0
    MaxValue: 100
    Description: Congestion index threshold for triggering alerts (0-100)
  
  NotificationEmail:
    Type: String
    Default: traffic-alerts@smartcity.com
    Description: Email address for congestion alerts

Resources:
  # ========== IoT Core Resources ==========
  IoTPolicy:
    Type: AWS::IoT::Policy
    Properties:
      PolicyName: !Sub '${AWS::StackName}-TrafficSensorPolicy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - iot:Connect
              - iot:Publish
            Resource:
              - !Sub 'arn:aws:iot:${AWS::Region}:${AWS::AccountId}:client/${!iot:Certificate.Subject.CommonName}'
              - !Sub 'arn:aws:iot:${AWS::Region}:${AWS::AccountId}:topic/traffic/sensors/*'
  
  IoTTopicRule:
    Type: AWS::IoT::TopicRule
    Properties:
      RuleName: !Sub '${AWS::StackName}_TrafficDataRule'
      TopicRulePayload:
        RuleDisabled: false
        Sql: "SELECT * FROM 'traffic/sensors/+'"
        Actions:
          - Kinesis:
              StreamName: !Ref KinesisDataStream
              PartitionKey: '${topic(3)}'
              RoleArn: !GetAtt IoTRuleRole.Arn
        ErrorAction:
          CloudwatchLogs:
            LogGroupName: !Ref IoTErrorLogGroup
            RoleArn: !GetAtt IoTRuleRole.Arn

  IoTRuleRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-IoTRuleRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: iot.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: KinesisWritePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kinesis:PutRecord
                  - kinesis:PutRecords
                Resource: !GetAtt KinesisDataStream.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt IoTErrorLogGroup.Arn

  # ========== Kinesis Data Stream ==========
  KinesisDataStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub '${AWS::StackName}-TrafficDataStream'
      ShardCount: !Ref KinesisShardCount
      RetentionPeriodHours: 24
      StreamEncryption:
        EncryptionType: KMS
        KeyId: alias/aws/kinesis
      StreamModeDetails:
        StreamMode: PROVISIONED
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # ========== Lambda Function ==========
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
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole
      Policies:
        - PolicyName: DynamoDBAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:BatchWriteItem
                Resource:
                  - !GetAtt TrafficAnalyticsTable.Arn
                  - !Sub '${TrafficAnalyticsTable.Arn}/index/*'
        - PolicyName: EventBridgePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - events:PutEvents
                Resource: !GetAtt CongestionEventBus.Arn
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  ProcessingLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-TrafficDataProcessor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 512
      ReservedConcurrentExecutions: 100
      Environment:
        Variables:
          DYNAMODB_TABLE_NAME: !Ref TrafficAnalyticsTable
          ALERT_THRESHOLD: !Ref AlertThresholdCongestionIndex
          EVENT_BUS_NAME: !Ref CongestionEventBus
          ENVIRONMENT: !Ref EnvironmentName
      Code:
        ZipFile: |
          import json
          import base64
          import boto3
          import os
          from datetime import datetime
          from decimal import Decimal
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          dynamodb = boto3.resource('dynamodb')
          events = boto3.client('events')
          
          table_name = os.environ['DYNAMODB_TABLE_NAME']
          alert_threshold = int(os.environ['ALERT_THRESHOLD'])
          event_bus_name = os.environ['EVENT_BUS_NAME']
          
          def lambda_handler(event, context):
              table = dynamodb.Table(table_name)
              batch_items = []
              alerts = []
              
              for record in event['Records']:
                  try:
                      # Decode Kinesis data
                      payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
                      data = json.loads(payload)
                      
                      # Extract sensor data
                      sensor_id = data.get('sensor_id')
                      zone_id = data.get('zone_id')
                      timestamp = data.get('timestamp', datetime.utcnow().isoformat())
                      vehicle_count = int(data.get('vehicle_count', 0))
                      avg_speed = float(data.get('avg_speed', 0))
                      congestion_index = float(data.get('congestion_index', 0))
                      
                      # Process and enrich data
                      processed_item = {
                          'sensor_id': sensor_id,
                          'zone_id': zone_id,
                          'timestamp': timestamp,
                          'vehicle_count': vehicle_count,
                          'avg_speed': Decimal(str(avg_speed)),
                          'congestion_index': Decimal(str(congestion_index)),
                          'processed_at': datetime.utcnow().isoformat(),
                          'ttl': int((datetime.utcnow().timestamp())) + 86400 * 7  # 7 days TTL
                      }
                      
                      batch_items.append({
                          'PutRequest': {
                              'Item': processed_item
                          }
                      })
                      
                      # Check for congestion alerts
                      if congestion_index > alert_threshold:
                          alerts.append({
                              'Source': 'traffic.analytics',
                              'DetailType': 'CongestionAlert',
                              'Detail': json.dumps({
                                  'sensor_id': sensor_id,
                                  'zone_id': zone_id,
                                  'congestion_index': float(congestion_index),
                                  'vehicle_count': vehicle_count,
                                  'avg_speed': avg_speed,
                                  'timestamp': timestamp
                              }),
                              'EventBusName': event_bus_name
                          })
                      
                  except Exception as e:
                      logger.error(f"Error processing record: {e}")
                      continue
              
              # Batch write to DynamoDB
              if batch_items:
                  try:
                      response = dynamodb.batch_write_item(
                          RequestItems={
                              table_name: batch_items[:25]  # DynamoDB batch limit
                          }
                      )
                      logger.info(f"Wrote {len(batch_items)} items to DynamoDB")
                  except Exception as e:
                      logger.error(f"Error writing to DynamoDB: {e}")
              
              # Send alerts to EventBridge
              if alerts:
                  try:
                      response = events.put_events(Entries=alerts[:10])  # EventBridge batch limit
                      logger.info(f"Sent {len(alerts)} congestion alerts")
                  except Exception as e:
                      logger.error(f"Error sending alerts: {e}")
              
              return {
                  'statusCode': 200,
                  'batchItemsProcessed': len(batch_items),
                  'alertsSent': len(alerts)
              }

  KinesisEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt KinesisDataStream.Arn
      FunctionName: !Ref ProcessingLambdaFunction
      StartingPosition: LATEST
      BatchSize: 100
      MaximumBatchingWindowInSeconds: 5
      ParallelizationFactor: 10
      MaximumRecordAgeInSeconds: 3600

  # ========== DynamoDB Table ==========
  TrafficAnalyticsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-TrafficAnalytics'
      AttributeDefinitions:
        - AttributeName: sensor_id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
        - AttributeName: zone_id
          AttributeType: S
      KeySchema:
        - AttributeName: sensor_id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DynamoDBReadCapacity
        WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      GlobalSecondaryIndexes:
        - IndexName: zone-timestamp-index
          KeySchema:
            - AttributeName: zone_id
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref DynamoDBReadCapacity
            WriteCapacityUnits: !Ref DynamoDBWriteCapacity
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

  # ========== EventBridge ==========
  CongestionEventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: !Sub '${AWS::StackName}-CongestionAlerts'

  CongestionAlertRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-CongestionAlertRule'
      EventBusName: !Ref CongestionEventBus
      EventPattern:
        source:
          - traffic.analytics
        detail-type:
          - CongestionAlert
      State: ENABLED
      Targets:
        - Arn: !Ref AlertTopic
          Id: "1"

  # ========== SNS for Alerts ==========
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-CongestionAlerts'
      DisplayName: Traffic Congestion Alerts
      KmsMasterKeyId: alias/aws/sns

  AlertEmailSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref AlertTopic
      Endpoint: !Ref NotificationEmail

  # ========== CloudWatch Monitoring ==========
  IoTErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/iot/${AWS::StackName}/errors'
      RetentionInDays: 7

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProcessingLambdaFunction}'
      RetentionInDays: 7

  ProcessingErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ProcessingErrors'
      AlarmDescription: 'Alert when Lambda processing errors exceed threshold'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ProcessingLambdaFunction
      AlarmActions:
        - !Ref AlertTopic

  KinesisIncomingRecordsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-NoIncomingData'
      AlarmDescription: 'Alert when no data is received for 5 minutes'
      MetricName: IncomingRecords
      Namespace: AWS/Kinesis
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref KinesisDataStream
      AlarmActions:
        - !Ref AlertTopic

  # ========== QuickSight Resources ==========
  QuickSightDataSourceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-QuickSightDataSourceRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: quicksight.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: DynamoDBReadPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:DescribeTable
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:GetItem
                Resource:
                  - !GetAtt TrafficAnalyticsTable.Arn
                  - !Sub '${TrafficAnalyticsTable.Arn}/index/*'

  # ========== Dashboard Metrics ==========
  DashboardMetricsFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-DashboardMetrics'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      Environment:
        Variables:
          TABLE_NAME: !Ref TrafficAnalyticsTable
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta
          from decimal import Decimal
          
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')
          
          def decimal_default(obj):
              if isinstance(obj, Decimal):
                  return float(obj)
              raise TypeError
          
          def lambda_handler(event, context):
              table_name = os.environ['TABLE_NAME']
              table = dynamodb.Table(table_name)
              
              # Calculate metrics for the last hour
              end_time = datetime.utcnow()
              start_time = end_time - timedelta(hours=1)
              
              # Query data by zone
              zones = ['zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5']
              metrics = []
              
              for zone in zones:
                  response = table.query(
                      IndexName='zone-timestamp-index',
                      KeyConditionExpression='zone_id = :zone AND #ts BETWEEN :start AND :end',
                      ExpressionAttributeNames={'#ts': 'timestamp'},
                      ExpressionAttributeValues={
                          ':zone': zone,
                          ':start': start_time.isoformat(),
                          ':end': end_time.isoformat()
                      }
                  )
                  
                  items = response.get('Items', [])
                  if items:
                      avg_congestion = sum(float(item['congestion_index']) for item in items) / len(items)
                      total_vehicles = sum(int(item['vehicle_count']) for item in items)
                      
                      # Send custom metrics to CloudWatch
                      cloudwatch.put_metric_data(
                          Namespace='TrafficAnalytics',
                          MetricData=[
                              {
                                  'MetricName': 'AverageCongestionIndex',
                                  'Value': avg_congestion,
                                  'Unit': 'None',
                                  'Dimensions': [{'Name': 'Zone', 'Value': zone}]
                              },
                              {
                                  'MetricName': 'TotalVehicleCount',
                                  'Value': total_vehicles,
                                  'Unit': 'Count',
                                  'Dimensions': [{'Name': 'Zone', 'Value': zone}]
                              }
                          ]
                      )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({'message': 'Metrics published successfully'})
              }

  MetricsScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-MetricsSchedule'
      ScheduleExpression: 'rate(5 minutes)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt DashboardMetricsFunction.Arn
          Id: "1"

  MetricsSchedulePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref DashboardMetricsFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt MetricsScheduleRule.Arn

Outputs:
  IoTEndpoint:
    Description: AWS IoT Core endpoint for device connections
    Value: !Sub 'https://${AWS::AccountId}.iot.${AWS::Region}.amazonaws.com'
  
  KinesisStreamArn:
    Description: ARN of the Kinesis Data Stream
    Value: !GetAtt KinesisDataStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KinesisStreamArn'
  
  DynamoDBTableName:
    Description: Name of the DynamoDB table storing analytics data
    Value: !Ref TrafficAnalyticsTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'
  
  QuickSightDataSourceRoleArn:
    Description: IAM role ARN for QuickSight data source
    Value: !GetAtt QuickSightDataSourceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-QuickSightDataSourceRoleArn'
  
  AlertTopicArn:
    Description: SNS topic ARN for congestion alerts
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopicArn'
  
  DashboardMetricsNamespace:
    Description: CloudWatch namespace for custom traffic metrics
    Value: TrafficAnalytics