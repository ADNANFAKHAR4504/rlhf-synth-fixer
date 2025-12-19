# Manufacturing IoT Data Processing Pipeline - Implementation

## CloudFormation Template

### File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Manufacturing IoT Data Processing Pipeline with Real-Time Analytics'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # S3 Bucket for Raw Sensor Data Archive
  RawDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      BucketName: !Sub 'iot-raw-data-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: IoT-Raw-Data-Archive

  # DynamoDB Table for Processed Sensor Data
  SensorDataTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'SensorData-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: deviceId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: deviceId
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      SSESpecification:
        SSEEnabled: true
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: IoT-Processed-Data

  # Kinesis Data Stream
  SensorDataStream:
    Type: AWS::Kinesis::Stream
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      Name: !Sub 'sensor-data-stream-${EnvironmentSuffix}'
      ShardCount: 1
      RetentionPeriodHours: 24
      StreamModeDetails:
        StreamMode: PROVISIONED
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: IoT-Data-Ingestion

  # IAM Role for Lambda Function
  DataProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'IoTDataProcessorRole-${EnvironmentSuffix}'
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
        - PolicyName: KinesisReadPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kinesis:GetRecords
                  - kinesis:GetShardIterator
                  - kinesis:DescribeStream
                  - kinesis:ListShards
                  - kinesis:ListStreams
                Resource: !GetAtt SensorDataStream.Arn
        - PolicyName: DynamoDBWritePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:BatchWriteItem
                Resource: !GetAtt SensorDataTable.Arn
        - PolicyName: S3WritePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${RawDataBucket.Arn}/*'
        - PolicyName: CloudWatchMetricsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Lambda Function for Data Processing
  DataProcessorFunction:
    Type: AWS::Lambda::Function
    DeletionPolicy: Delete
    Properties:
      FunctionName: !Sub 'iot-data-processor-${EnvironmentSuffix}'
      Runtime: nodejs20.x
      Handler: index.handler
      Role: !GetAtt DataProcessorRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref SensorDataTable
          S3_BUCKET: !Ref RawDataBucket
          ENVIRONMENT: !Ref EnvironmentSuffix
          TEMP_THRESHOLD_HIGH: '80'
          TEMP_THRESHOLD_LOW: '10'
          PRESSURE_THRESHOLD_HIGH: '150'
          PRESSURE_THRESHOLD_LOW: '30'
          VIBRATION_THRESHOLD: '5.0'
      Code:
        ZipFile: |
          const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
          const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
          const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

          const dynamoClient = new DynamoDBClient({});
          const s3Client = new S3Client({});
          const cloudwatchClient = new CloudWatchClient({});

          exports.handler = async (event) => {
            console.log('Processing Kinesis records:', JSON.stringify(event, null, 2));

            const processedCount = { value: 0 };
            const anomalyCount = { value: 0 };
            const errors = [];

            try {
              for (const record of event.Records) {
                try {
                  const payload = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString('utf-8'));
                  console.log('Processing payload:', payload);

                  await archiveRawData(payload);
                  const anomalyDetected = await processAndStore(payload);

                  processedCount.value++;
                  if (anomalyDetected) {
                    anomalyCount.value++;
                  }
                } catch (err) {
                  console.error('Error processing record:', err);
                  errors.push({ record: record.kinesis.sequenceNumber, error: err.message });
                }
              }

              await publishMetrics(processedCount.value, anomalyCount.value);

              console.log(`Processed ${processedCount.value} records, detected ${anomalyCount.value} anomalies`);

              return {
                statusCode: 200,
                body: JSON.stringify({
                  processed: processedCount.value,
                  anomalies: anomalyCount.value,
                  errors: errors.length
                })
              };
            } catch (err) {
              console.error('Fatal error:', err);
              throw err;
            }
          };

          async function archiveRawData(data) {
            const timestamp = Date.now();
            const key = `raw/${data.deviceId || 'unknown'}/${timestamp}.json`;

            const command = new PutObjectCommand({
              Bucket: process.env.S3_BUCKET,
              Key: key,
              Body: JSON.stringify(data),
              ContentType: 'application/json'
            });

            await s3Client.send(command);
            console.log(`Archived raw data to S3: ${key}`);
          }

          async function processAndStore(data) {
            const timestamp = data.timestamp || Date.now();
            const deviceId = data.deviceId || 'unknown';
            const sensorType = data.sensorType || 'unknown';
            const value = parseFloat(data.value || 0);

            const anomalyDetected = detectAnomaly(sensorType, value);
            const status = anomalyDetected ? 'ANOMALY' : 'NORMAL';

            const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);

            const command = new PutItemCommand({
              TableName: process.env.DYNAMODB_TABLE,
              Item: {
                deviceId: { S: deviceId },
                timestamp: { N: timestamp.toString() },
                sensorType: { S: sensorType },
                value: { N: value.toString() },
                status: { S: status },
                anomalyDetected: { BOOL: anomalyDetected },
                ttl: { N: ttl.toString() }
              }
            });

            await dynamoClient.send(command);
            console.log(`Stored processed data for device ${deviceId}: ${status}`);

            return anomalyDetected;
          }

          function detectAnomaly(sensorType, value) {
            switch (sensorType.toLowerCase()) {
              case 'temperature':
                return value > parseFloat(process.env.TEMP_THRESHOLD_HIGH) ||
                       value < parseFloat(process.env.TEMP_THRESHOLD_LOW);
              case 'pressure':
                return value > parseFloat(process.env.PRESSURE_THRESHOLD_HIGH) ||
                       value < parseFloat(process.env.PRESSURE_THRESHOLD_LOW);
              case 'vibration':
                return value > parseFloat(process.env.VIBRATION_THRESHOLD);
              default:
                return false;
            }
          }

          async function publishMetrics(processedCount, anomalyCount) {
            const command = new PutMetricDataCommand({
              Namespace: 'IoT/Manufacturing',
              MetricData: [
                {
                  MetricName: 'SensorReadingsProcessed',
                  Value: processedCount,
                  Unit: 'Count',
                  Timestamp: new Date(),
                  Dimensions: [
                    {
                      Name: 'Environment',
                      Value: process.env.ENVIRONMENT
                    }
                  ]
                },
                {
                  MetricName: 'AnomaliesDetected',
                  Value: anomalyCount,
                  Unit: 'Count',
                  Timestamp: new Date(),
                  Dimensions: [
                    {
                      Name: 'Environment',
                      Value: process.env.ENVIRONMENT
                    }
                  ]
                }
              ]
            });

            await cloudwatchClient.send(command);
            console.log('Published CloudWatch metrics');
          }
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: IoT-Data-Processing

  # CloudWatch Log Group for Lambda
  DataProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      LogGroupName: !Sub '/aws/lambda/iot-data-processor-${EnvironmentSuffix}'
      RetentionInDays: 7

  # Event Source Mapping - Kinesis to Lambda
  KinesisEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt SensorDataStream.Arn
      FunctionName: !GetAtt DataProcessorFunction.Arn
      StartingPosition: LATEST
      BatchSize: 100
      MaximumBatchingWindowInSeconds: 5
      MaximumRetryAttempts: 3
      ParallelizationFactor: 1
      Enabled: true

  # IAM Role for IoT Rule
  IoTRuleRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'IoTRuleRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: iot.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: KinesisWritePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kinesis:PutRecord
                  - kinesis:PutRecords
                Resource: !GetAtt SensorDataStream.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # IoT Topic Rule
  SensorDataRule:
    Type: AWS::IoT::TopicRule
    Properties:
      RuleName: !Sub 'SensorDataRule_${EnvironmentSuffix}'
      TopicRulePayload:
        Description: Route sensor data from IoT devices to Kinesis stream
        Sql: SELECT *, timestamp() as timestamp FROM 'sensor/+/data'
        RuleDisabled: false
        Actions:
          - Kinesis:
              StreamName: !Ref SensorDataStream
              PartitionKey: ${deviceId}
              RoleArn: !GetAtt IoTRuleRole.Arn

  # IoT Policy
  SensorDevicePolicy:
    Type: AWS::IoT::Policy
    Properties:
      PolicyName: !Sub 'SensorDevicePolicy-${EnvironmentSuffix}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - iot:Connect
            Resource:
              - !Sub 'arn:aws:iot:${AWS::Region}:${AWS::AccountId}:client/${!iot:Connection.Thing.ThingName}'
          - Effect: Allow
            Action:
              - iot:Publish
            Resource:
              - !Sub 'arn:aws:iot:${AWS::Region}:${AWS::AccountId}:topic/sensor/*/data'
          - Effect: Allow
            Action:
              - iot:Subscribe
            Resource:
              - !Sub 'arn:aws:iot:${AWS::Region}:${AWS::AccountId}:topicfilter/sensor/*/commands'
          - Effect: Allow
            Action:
              - iot:Receive
            Resource:
              - !Sub 'arn:aws:iot:${AWS::Region}:${AWS::AccountId}:topic/sensor/*/commands'

  # IoT Thing
  ManufacturingDevice:
    Type: AWS::IoT::Thing
    Properties:
      ThingName: !Sub 'manufacturing-device-${EnvironmentSuffix}'
      AttributePayload:
        Attributes:
          deviceType: sensor
          location: manufacturing-floor
          environment: !Ref EnvironmentSuffix

  # CloudWatch Alarm - Lambda Errors
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'IoT-Lambda-Errors-${EnvironmentSuffix}'
      AlarmDescription: Alert when Lambda function has high error rate
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref DataProcessorFunction
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Anomaly Detection
  AnomalyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'IoT-High-Anomalies-${EnvironmentSuffix}'
      AlarmDescription: Alert when anomaly detection rate is high
      MetricName: AnomaliesDetected
      Namespace: IoT/Manufacturing
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref EnvironmentSuffix
      TreatMissingData: notBreaching

  # CloudWatch Alarm - Kinesis Iterator Age
  KinesisIteratorAgeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'IoT-Kinesis-Iterator-Age-${EnvironmentSuffix}'
      AlarmDescription: Alert when Kinesis iterator age is high indicating processing lag
      MetricName: IteratorAge
      Namespace: AWS/Kinesis
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 60000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: StreamName
          Value: !Ref SensorDataStream
      TreatMissingData: notBreaching

Outputs:
  SensorDataTableName:
    Description: DynamoDB table name for sensor data
    Value: !Ref SensorDataTable
    Export:
      Name: !Sub '${AWS::StackName}-SensorDataTable'

  RawDataBucketName:
    Description: S3 bucket name for raw sensor data
    Value: !Ref RawDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-RawDataBucket'

  KinesisStreamName:
    Description: Kinesis stream name for sensor data
    Value: !Ref SensorDataStream
    Export:
      Name: !Sub '${AWS::StackName}-KinesisStream'

  DataProcessorFunctionName:
    Description: Lambda function name for data processing
    Value: !Ref DataProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-DataProcessorFunction'

  DataProcessorFunctionArn:
    Description: Lambda function ARN for data processing
    Value: !GetAtt DataProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DataProcessorFunctionArn'

  IoTEndpoint:
    Description: IoT endpoint for device connections
    Value: !Sub '${AWS::AccountId}.iot.${AWS::Region}.amazonaws.com'
    Export:
      Name: !Sub '${AWS::StackName}-IoTEndpoint'

  IoTThingName:
    Description: IoT Thing name for manufacturing device
    Value: !Ref ManufacturingDevice
    Export:
      Name: !Sub '${AWS::StackName}-IoTThingName'

  IoTTopicPattern:
    Description: MQTT topic pattern for publishing sensor data
    Value: sensor/{deviceId}/data
    Export:
      Name: !Sub '${AWS::StackName}-IoTTopicPattern'

  EnvironmentSuffix:
    Description: Environment suffix used for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Architecture Summary

This CloudFormation template implements a complete IoT data processing pipeline with:

1. **AWS IoT Core**: Device connectivity with MQTT protocol support
2. **Amazon Kinesis Data Stream**: Real-time data buffering and ingestion
3. **AWS Lambda**: Serverless data processing with anomaly detection
4. **Amazon DynamoDB**: Fast access to processed sensor data
5. **Amazon S3**: Long-term raw data archive with lifecycle policies
6. **Amazon CloudWatch**: Comprehensive monitoring with logs, metrics, and alarms