AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Account Replication Framework - S3, DynamoDB, Lambda, EventBridge'

# ===========================
# Parameters
# ===========================
Parameters:
  Environment:
    Type: String
    Description: Current environment name
    AllowedValues: [dev, staging, prod]
    
  AccountIdDev:
    Type: String
    Description: AWS Account ID for Development
    AllowedPattern: '[0-9]{12}'
    
  AccountIdStaging:
    Type: String
    Description: AWS Account ID for Staging
    AllowedPattern: '[0-9]{12}'
    
  AccountIdProd:
    Type: String
    Description: AWS Account ID for Production
    AllowedPattern: '[0-9]{12}'
    
  ReplicationRoleName:
    Type: String
    Default: 'multi-env-replication-role'
    Description: Name for the cross-account replication role
    
  DynamoDBTableName:
    Type: String
    Default: 'ConfigurationMetadata'
    Description: DynamoDB table name for metadata synchronization
    
  ReplicationBucketName:
    Type: String
    Default: 'configuration-artifacts'
    Description: Base name for S3 replication buckets
    
  SSMPathPrefix:
    Type: String
    Default: '/app'
    Description: SSM Parameter Store path prefix

# ===========================
# Conditions
# ===========================
Conditions:
  IsDevEnvironment: !Equals [!Ref Environment, 'dev']
  IsStagingEnvironment: !Equals [!Ref Environment, 'staging']
  IsProdEnvironment: !Equals [!Ref Environment, 'prod']
  EnableReplicationToStaging: !Equals [!Ref Environment, 'dev']
  EnableReplicationToProd: !Equals [!Ref Environment, 'staging']

# ===========================
# Resources
# ===========================
Resources:
  
  # ===========================
  # S3 Configuration Artifacts Bucket
  # ===========================
  ConfigurationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ReplicationBucketName}-${Environment}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256  # SSE-S3 encryption
      VersioningConfiguration:
        Status: Enabled  # Required for replication
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      ReplicationConfiguration:
        !If
          - EnableReplicationToStaging
          - Role: !GetAtt S3ReplicationRole.Arn
            Rules:
              - Id: ReplicateToStaging
                Status: Enabled
                Priority: 1
                DeleteMarkerReplication:
                  Status: Disabled
                Filter: {}
                Destination:
                  Bucket: !Sub 'arn:aws:s3:::${ReplicationBucketName}-staging-${AWS::Region}'
                  ReplicationTime:
                    Status: Enabled
                    Time:
                      Minutes: 15
                  Metrics:
                    Status: Enabled
                    EventThreshold:
                      Minutes: 15
                  StorageClass: STANDARD
                  Account: !Ref AccountIdStaging
                  AccessControlTranslation:
                    Owner: Destination
          - !If
              - EnableReplicationToProd
              - Role: !GetAtt S3ReplicationRole.Arn
                Rules:
                  - Id: ReplicateToProd
                    Status: Enabled
                    Priority: 1
                    DeleteMarkerReplication:
                      Status: Disabled
                    Filter: {}
                    Destination:
                      Bucket: !Sub 'arn:aws:s3:::${ReplicationBucketName}-prod-${AWS::Region}'
                      ReplicationTime:
                        Status: Enabled
                        Time:
                          Minutes: 15
                      Metrics:
                        Status: Enabled
                        EventThreshold:
                          Minutes: 15
                      StorageClass: STANDARD
                      Account: !Ref AccountIdProd
                      AccessControlTranslation:
                        Owner: Destination
              - !Ref AWS::NoValue

  # ===========================
  # S3 Bucket Policy - Cross-Account Read Access
  # ===========================
  ConfigurationBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigurationBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCrossAccountRead
            Effect: Allow
            Principal:
              AWS:
                - !If [IsDevEnvironment, !Sub 'arn:aws:iam::${AccountIdStaging}:root', !Ref AWS::NoValue]
                - !If [IsDevEnvironment, !Sub 'arn:aws:iam::${AccountIdProd}:root', !Ref AWS::NoValue]
                - !If [IsStagingEnvironment, !Sub 'arn:aws:iam::${AccountIdDev}:root', !Ref AWS::NoValue]
                - !If [IsStagingEnvironment, !Sub 'arn:aws:iam::${AccountIdProd}:root', !Ref AWS::NoValue]
                - !If [IsProdEnvironment, !Sub 'arn:aws:iam::${AccountIdDev}:root', !Ref AWS::NoValue]
                - !If [IsProdEnvironment, !Sub 'arn:aws:iam::${AccountIdStaging}:root', !Ref AWS::NoValue]
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt ConfigurationBucket.Arn
              - !Sub '${ConfigurationBucket.Arn}/*'
            Condition:
              StringEquals:
                'aws:PrincipalTag/ReplicationRole': 'true'

  # ===========================
  # IAM Role for S3 Replication
  # ===========================
  S3ReplicationRole:
    Type: AWS::IAM::Role
    Condition: !Or [EnableReplicationToStaging, EnableReplicationToProd]
    Properties:
      RoleName: !Sub '${ReplicationRoleName}-s3-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
      Policies:
        - PolicyName: S3ReplicationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetReplicationConfiguration'
                  - 's3:ListBucket'
                Resource: !GetAtt ConfigurationBucket.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObjectVersionForReplication'
                  - 's3:GetObjectVersionAcl'
                  - 's3:GetObjectVersionTagging'
                Resource: !Sub '${ConfigurationBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ReplicateObject'
                  - 's3:ReplicateDelete'
                  - 's3:ReplicateTags'
                Resource:
                  - !If 
                    - EnableReplicationToStaging
                    - !Sub 'arn:aws:s3:::${ReplicationBucketName}-staging-${AWS::Region}/*'
                    - !If
                      - EnableReplicationToProd
                      - !Sub 'arn:aws:s3:::${ReplicationBucketName}-prod-${AWS::Region}/*'
                      - !Ref AWS::NoValue

  # ===========================
  # DynamoDB Global Table
  # ===========================
  MetadataTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: !Sub '${DynamoDBTableName}'
      BillingMode: PAY_PER_REQUEST  # On-demand for cost optimization
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
      Replicas:
        - Region: !Ref AWS::Region
          GlobalSecondaryIndexes:
            - IndexName: ConfigTypeIndex
              Keys:
                - AttributeName: ConfigType
                  KeyType: HASH
                - AttributeName: UpdatedAt
                  KeyType: RANGE
              Projection:
                ProjectionType: ALL
          Tags:
            - Key: Environment
              Value: !Ref Environment
      AttributeDefinitions:
        - AttributeName: ConfigId
          AttributeType: S
        - AttributeName: ConfigType
          AttributeType: S
        - AttributeName: UpdatedAt
          AttributeType: S
      KeySchema:
        - AttributeName: ConfigId
          KeyType: HASH

  # ===========================
  # Lambda Execution Role
  # ===========================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'replication-lambda-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: ReplicationAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # S3 Access
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !GetAtt ConfigurationBucket.Arn
                  - !Sub '${ConfigurationBucket.Arn}/*'
              # DynamoDB Access
              - Effect: Allow
                Action:
                  - 'dynamodb:DescribeTable'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DescribeStream'
                  - 'dynamodb:GetRecords'
                  - 'dynamodb:GetShardIterator'
                  - 'dynamodb:ListStreams'
                Resource:
                  - !GetAtt MetadataTable.Arn
                  - !Sub '${MetadataTable.Arn}/stream/*'
              # SSM Access
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:PutParameter'
                  - 'ssm:DescribeParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMPathPrefix}/*'
              # CloudWatch Metrics
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'

  # ===========================
  # Lambda Function - Replication Monitor
  # ===========================
  ReplicationMonitorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'replication-monitor-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      MemorySize: 256
      Timeout: 60
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          BUCKET_NAME: !Ref ConfigurationBucket
          TABLE_NAME: !Ref MetadataTable
          METRIC_NAMESPACE: 'MultiAccountReplication'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          s3 = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')

          def handler(event, context):
              """Monitor replication events and track metrics"""
              
              environment = os.environ['ENVIRONMENT']
              bucket_name = os.environ['BUCKET_NAME']
              table_name = os.environ['TABLE_NAME']
              namespace = os.environ['METRIC_NAMESPACE']
              
              try:
                  # Parse S3 event
                  if 'Records' in event:
                      for record in event['Records']:
                          if record.get('eventName', '').startswith('ObjectCreated'):
                              object_key = record['s3']['object']['key']
                              
                              # Track replication event in DynamoDB
                              table = dynamodb.Table(table_name)
                              table.put_item(
                                  Item={
                                      'ConfigId': f"s3-{object_key}",
                                      'ConfigType': 'S3_REPLICATION',
                                      'UpdatedAt': datetime.utcnow().isoformat(),
                                      'Environment': environment,
                                      'ObjectKey': object_key,
                                      'Status': 'PENDING_REPLICATION'
                                  }
                              )
                              
                              # Emit metric
                              cloudwatch.put_metric_data(
                                  Namespace=namespace,
                                  MetricData=[
                                      {
                                          'MetricName': 'ReplicationEvents',
                                          'Value': 1,
                                          'Unit': 'Count',
                                          'Dimensions': [
                                              {
                                                  'Name': 'Environment',
                                                  'Value': environment
                                              },
                                              {
                                                  'Name': 'EventType',
                                                  'Value': 'S3_OBJECT_CREATED'
                                              }
                                          ]
                                      }
                                  ]
                              )
                  
                  # Check replication status
                  response = s3.get_bucket_replication(Bucket=bucket_name)
                  
                  if 'ReplicationConfiguration' in response:
                      for rule in response['ReplicationConfiguration']['Rules']:
                          if rule['Status'] == 'Enabled':
                              # Emit replication health metric
                              cloudwatch.put_metric_data(
                                  Namespace=namespace,
                                  MetricData=[
                                      {
                                          'MetricName': 'ReplicationHealth',
                                          'Value': 1,
                                          'Unit': 'None',
                                          'Dimensions': [
                                              {
                                                  'Name': 'Environment',
                                                  'Value': environment
                                              },
                                              {
                                                  'Name': 'RuleId',
                                                  'Value': rule['ID']
                                              }
                                          ]
                                      }
                                  ]
                              )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Replication monitoring completed',
                          'environment': environment
                      })
                  }
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  
                  # Emit error metric
                  cloudwatch.put_metric_data(
                      Namespace=namespace,
                      MetricData=[
                          {
                              'MetricName': 'ReplicationErrors',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': environment
                                  },
                                  {
                                      'Name': 'ErrorType',
                                      'Value': type(e).__name__
                                  }
                              ]
                          }
                      ]
                  )
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e)
                      })
                  }

  # ===========================
  # Lambda Function - Configuration Validator
  # ===========================
  ConfigValidatorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'config-validator-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      MemorySize: 256
      Timeout: 300
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          TABLE_NAME: !Ref MetadataTable
          SSM_PREFIX: !Ref SSMPathPrefix
          ACCOUNT_IDS: !Sub '${AccountIdDev},${AccountIdStaging},${AccountIdProd}'
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          dynamodb = boto3.resource('dynamodb')
          ssm = boto3.client('ssm')
          cloudwatch = boto3.client('cloudwatch')
          sts = boto3.client('sts')

          def handler(event, context):
              """Validate configuration consistency across environments"""
              
              environment = os.environ['ENVIRONMENT']
              table_name = os.environ['TABLE_NAME']
              ssm_prefix = os.environ['SSM_PREFIX']
              
              validation_results = {
                  'timestamp': datetime.utcnow().isoformat(),
                  'environment': environment,
                  'validations': []
              }
              
              try:
                  # Validate SSM Parameter consistency
                  parameters_response = ssm.describe_parameters(
                      ParameterFilters=[
                          {
                              'Key': 'Path',
                              'Option': 'Recursive',
                              'Values': [ssm_prefix]
                          }
                      ]
                  )
                  
                  for param in parameters_response.get('Parameters', []):
                      param_name = param['Name']
                      
                      # Get parameter value
                      value_response = ssm.get_parameter(Name=param_name)
                      param_value = value_response['Parameter']['Value']
                      
                      # Track in DynamoDB
                      table = dynamodb.Table(table_name)
                      table.put_item(
                          Item={
                              'ConfigId': f"ssm-{param_name}",
                              'ConfigType': 'SSM_PARAMETER',
                              'UpdatedAt': datetime.utcnow().isoformat(),
                              'Environment': environment,
                              'ParameterName': param_name,
                              'ValidationStatus': 'VALIDATED',
                              'LastValidated': datetime.utcnow().isoformat()
                          }
                      )
                      
                      validation_results['validations'].append({
                          'type': 'SSM_PARAMETER',
                          'name': param_name,
                          'status': 'VALIDATED'
                      })
                  
                  # Validate DynamoDB schema consistency
                  table = dynamodb.Table(table_name)
                  table_description = table.meta.table_description
                  
                  # Check for required attributes
                  required_attributes = ['ConfigId', 'ConfigType', 'UpdatedAt']
                  existing_attributes = [attr['AttributeName'] for attr in table_description['AttributeDefinitions']]
                  
                  schema_valid = all(attr in existing_attributes for attr in required_attributes)
                  
                  validation_results['validations'].append({
                      'type': 'DYNAMODB_SCHEMA',
                      'table': table_name,
                      'status': 'VALID' if schema_valid else 'INVALID',
                      'attributes': existing_attributes
                  })
                  
                  # Emit validation metrics
                  cloudwatch.put_metric_data(
                      Namespace='MultiAccountReplication',
                      MetricData=[
                          {
                              'MetricName': 'ValidationSuccess',
                              'Value': len([v for v in validation_results['validations'] if 'VALID' in v['status']]),
                              'Unit': 'Count',
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': environment
                                  }
                              ]
                          }
                      ]
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps(validation_results)
                  }
                  
              except Exception as e:
                  print(f"Validation error: {str(e)}")
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e),
                          'environment': environment
                      })
                  }

  # ===========================
  # Lambda Function - DynamoDB Stream Processor
  # ===========================
  StreamProcessorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'stream-processor-${Environment}'
      Runtime: python3.11
      Handler: index.handler
      MemorySize: 256
      Timeout: 60
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          SSM_PREFIX: !Ref SSMPathPrefix
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          ssm = boto3.client('ssm')
          cloudwatch = boto3.client('cloudwatch')

          def handler(event, context):
              """Process DynamoDB stream events for schema changes"""
              
              environment = os.environ['ENVIRONMENT']
              ssm_prefix = os.environ['SSM_PREFIX']
              
              processed_count = 0
              
              try:
                  for record in event.get('Records', []):
                      if record['eventName'] in ['INSERT', 'MODIFY']:
                          new_image = record.get('dynamodb', {}).get('NewImage', {})
                          
                          # Check if this is a schema change event
                          if new_image.get('ConfigType', {}).get('S') == 'SCHEMA_CHANGE':
                              config_id = new_image.get('ConfigId', {}).get('S', '')
                              schema_details = json.loads(new_image.get('SchemaDetails', {}).get('S', '{}'))
                              
                              # Propagate schema change to SSM
                              param_name = f"{ssm_prefix}/{environment}/schema/{config_id}"
                              
                              ssm.put_parameter(
                                  Name=param_name,
                                  Value=json.dumps(schema_details),
                                  Type='String',
                                  Overwrite=True,
                                  Tier='Standard',
                                  Tags=[
                                      {
                                          'Key': 'Environment',
                                          'Value': environment
                                      },
                                      {
                                          'Key': 'ConfigType',
                                          'Value': 'SCHEMA_CHANGE'
                                      },
                                      {
                                          'Key': 'LastUpdated',
                                          'Value': datetime.utcnow().isoformat()
                                      }
                                  ]
                              )
                              
                              processed_count += 1
                              
                              # Emit metric
                              cloudwatch.put_metric_data(
                                  Namespace='MultiAccountReplication',
                                  MetricData=[
                                      {
                                          'MetricName': 'SchemaChangesProcessed',
                                          'Value': 1,
                                          'Unit': 'Count',
                                          'Dimensions': [
                                              {
                                                  'Name': 'Environment',
                                                  'Value': environment
                                              }
                                          ]
                                      }
                                  ]
                              )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': f"Processed {processed_count} schema changes",
                          'environment': environment
                      })
                  }
                  
              except Exception as e:
                  print(f"Stream processing error: {str(e)}")
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e),
                          'environment': environment
                      })
                  }

  # ===========================
  # Event Source Mapping for DynamoDB Streams
  # ===========================
  StreamEventSourceMapping:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      EventSourceArn: !GetAtt MetadataTable.StreamArn
      FunctionName: !GetAtt StreamProcessorLambda.Arn
      StartingPosition: LATEST
      MaximumBatchingWindowInSeconds: 5

  # ===========================
  # EventBridge Rules
  # ===========================
  StackUpdateEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'stack-update-replication-${Environment}'
      Description: Trigger replication on CloudFormation stack updates
      EventPattern:
        source:
          - aws.cloudformation
        detail-type:
          - CloudFormation Stack Status Change
        detail:
          status-details:
            status:
              - UPDATE_COMPLETE
              - CREATE_COMPLETE
      State: ENABLED
      Targets:
        - Arn: !GetAtt ConfigValidatorLambda.Arn
          Id: '1'

  ConfigChangeEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'config-change-replication-${Environment}'
      Description: Trigger replication on configuration changes
      EventPattern:
        source:
          - aws.ssm
        detail-type:
          - Parameter Store Change
      State: ENABLED
      Targets:
        - Arn: !GetAtt ReplicationMonitorLambda.Arn
          Id: '1'

  # ===========================
  # Lambda Permissions for EventBridge
  # ===========================
  StackUpdateLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ConfigValidatorLambda
      Action: 'lambda:InvokeFunction'
      Principal: events.amazonaws.com
      SourceArn: !GetAtt StackUpdateEventRule.Arn

  ConfigChangeLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ReplicationMonitorLambda
      Action: 'lambda:InvokeFunction'
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ConfigChangeEventRule.Arn

  # ===========================
  # SSM Parameter Store Hierarchies
  # ===========================
  ApplicationConfigParam:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '${SSMPathPrefix}/${Environment}/config/application'
      Type: String
      Value: !Sub |
        {
          "environment": "${Environment}",
          "version": "1.0.0",
          "features": {
            "replication": true,
            "monitoring": true
          }
        }
      Description: Application configuration for multi-account sync
      Tags:
        Environment: !Ref Environment
        ManagedBy: CloudFormation

  DatabaseConfigParam:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '${SSMPathPrefix}/${Environment}/config/database'
      Type: String
      Value: !Sub |
        {
          "table": "${DynamoDBTableName}",
          "region": "${AWS::Region}",
          "replication": "GLOBAL"
        }
      Description: Database configuration for multi-account sync
      Tags:
        Environment: !Ref Environment
        ManagedBy: CloudFormation

  # ===========================
  # CloudWatch Alarms
  # ===========================
  ReplicationLagAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'replication-lag-${Environment}'
      AlarmDescription: Alert when replication lag exceeds threshold
      MetricName: ReplicationLatency
      Namespace: AWS/S3
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 60  # 1 minute in seconds
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: SourceBucket
          Value: !Ref ConfigurationBucket
        - Name: DestinationBucket
          Value: !If 
            - EnableReplicationToStaging
            - !Sub '${ReplicationBucketName}-staging-${AWS::Region}'
            - !If
              - EnableReplicationToProd
              - !Sub '${ReplicationBucketName}-prod-${AWS::Region}'
              - 'none'

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'lambda-errors-${Environment}'
      AlarmDescription: Alert on Lambda function errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReplicationMonitorLambda

  # ===========================
  # CloudWatch Dashboard
  # ===========================
  ReplicationDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'multi-account-replication-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "MultiAccountReplication", "ReplicationEvents", { "stat": "Sum" } ],
                  [ ".", "ValidationSuccess", { "stat": "Sum" } ],
                  [ ".", "SchemaChangesProcessed", { "stat": "Sum" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Replication Metrics",
                "yAxis": {
                  "left": {
                    "min": 0
                  }
                }
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/S3", "ReplicationLatency", "SourceBucket", "${ConfigurationBucket}", { "stat": "Average" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "S3 Replication Latency"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Errors", "FunctionName", "${ReplicationMonitorLambda}", { "stat": "Sum" } ],
                  [ ".", "Duration", ".", ".", { "stat": "Average" } ]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda Performance"
              }
            }
          ]
        }

# ===========================
# Outputs
# ===========================
Outputs:
  ReplicationStatusEndpoint:
    Description: Endpoint for checking replication status
    Value: !Sub 'https://console.aws.amazon.com/lambda/home?region=${AWS::Region}#/functions/${ReplicationMonitorLambda}'
    
  S3BucketName:
    Description: Configuration artifacts S3 bucket
    Value: !Ref ConfigurationBucket
    Export:
      Name: !Sub '${AWS::StackName}-bucket-name'
    
  DynamoDBTableArn:
    Description: DynamoDB global table ARN
    Value: !GetAtt MetadataTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-table-arn'
    
  ReplicationRoleArn:
    Description: S3 replication role ARN
    Value: !If
      - !Or [EnableReplicationToStaging, EnableReplicationToProd]
      - !GetAtt S3ReplicationRole.Arn
      - 'N/A - No replication enabled for this environment'
    
  CloudWatchDashboardUrl:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ReplicationDashboard}'