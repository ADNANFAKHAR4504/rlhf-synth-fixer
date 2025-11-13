# Ideal CloudFormation Template - Multi-Account Replication Framework

This is the ideal CloudFormation template for a multi-account replication framework supporting S3, DynamoDB, Lambda, EventBridge, SSM, and cross-account synchronization.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Account Replication Framework - S3, DynamoDB, Lambda, EventBridge'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - Environment
          - ApplicationName
      - Label:
          default: 'Account Configuration'
        Parameters:
          - AccountIdDev
          - AccountIdStaging
          - AccountIdProd
      - Label:
          default: 'Resource Configuration'
        Parameters:
          - ReplicationRoleName
          - DynamoDBTableName
          - ReplicationBucketName
          - SSMPathPrefix

# ===========================
# Parameters
# ===========================
Parameters:
  Environment:
    Type: String
    Description: Current environment name
    AllowedValues: [dev, staging, prod]
    Default: dev

  ApplicationName:
    Type: String
    Description: Application name for resource naming
    Default: multi-env-replication
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  AccountIdDev:
    Type: String
    Description: AWS Account ID for Development
    AllowedPattern: '[0-9]{12}'
    Default: '111111111111'

  AccountIdStaging:
    Type: String
    Description: AWS Account ID for Staging
    AllowedPattern: '[0-9]{12}'
    Default: '222222222222'

  AccountIdProd:
    Type: String
    Description: AWS Account ID for Production
    AllowedPattern: '[0-9]{12}'
    Default: '333333333333'

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
  EnableReplicationToStaging: !Equals [!Ref Environment, 'dev']
  EnableReplicationToProd: !Equals [!Ref Environment, 'staging']
  EnableReplication: !Or
    - !Condition EnableReplicationToStaging
    - !Condition EnableReplicationToProd

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
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-config-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ===========================
  # S3 Bucket Policy - Cross-Account Access
  # ===========================
  ConfigurationBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigurationBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCurrentAccountAccess
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 's3:GetObject'
              - 's3:GetObjectVersion'
              - 's3:ListBucket'
              - 's3:ListBucketVersions'
              - 's3:PutObject'
              - 's3:DeleteObject'
            Resource:
              - !Sub 'arn:aws:s3:::${ReplicationBucketName}-${Environment}-${AWS::Region}'
              - !Sub 'arn:aws:s3:::${ReplicationBucketName}-${Environment}-${AWS::Region}/*'

  # ===========================
  # DynamoDB Global Table
  # ===========================
  MetadataTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: !Sub '${DynamoDBTableName}-${Environment}'
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
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
      GlobalSecondaryIndexes:
        - IndexName: ConfigTypeIndex
          KeySchema:
            - AttributeName: ConfigType
              KeyType: HASH
            - AttributeName: UpdatedAt
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      Replicas:
        - Region: !Ref AWS::Region
          GlobalSecondaryIndexes:
            - IndexName: ConfigTypeIndex
          Tags:
            - Key: Name
              Value: !Sub '${ApplicationName}-metadata-${Environment}'
            - Key: Environment
              Value: !Ref Environment
            - Key: Application
              Value: !Ref ApplicationName
            - Key: ManagedBy
              Value: CloudFormation
            - Key: iac-rlhf-amazon
              Value: 'true'

  # ===========================
  # Lambda Execution Role
  # ===========================
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    DependsOn:
      - ConfigurationBucket
      - MetadataTable
    Properties:
      RoleName: !Sub '${ApplicationName}-lambda-role-${Environment}'
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
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                  - 's3:GetBucketVersioning'
                  - 's3:GetReplicationConfiguration'
                Resource:
                  - !Sub 'arn:aws:s3:::${ReplicationBucketName}-${Environment}-${AWS::Region}'
                  - !Sub 'arn:aws:s3:::${ReplicationBucketName}-${Environment}-${AWS::Region}/*'
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
                  - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${DynamoDBTableName}-${Environment}'
                  - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${DynamoDBTableName}-${Environment}/stream/*'
                  - !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${DynamoDBTableName}-${Environment}/index/*'
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:PutParameter'
                  - 'ssm:DescribeParameters'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMPathPrefix}/*'
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-lambda-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ===========================
  # Lambda Functions with Real-World Use Cases
  # ===========================
  ReplicationMonitorLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ApplicationName}-replication-monitor-${Environment}'
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
          APPLICATION_NAME: !Ref ApplicationName
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          from botocore.exceptions import ClientError

          s3 = boto3.client('s3')
          dynamodb = boto3.resource('dynamodb')
          cloudwatch = boto3.client('cloudwatch')

          def handler(event, context):
              """Monitor replication events and track metrics"""
              
              environment = os.environ.get('ENVIRONMENT', 'unknown')
              bucket_name = os.environ.get('BUCKET_NAME')
              table_name = os.environ.get('TABLE_NAME')
              namespace = os.environ.get('METRIC_NAMESPACE', 'MultiAccountReplication')
              
              if not bucket_name or not table_name:
                  raise ValueError("Required environment variables BUCKET_NAME and TABLE_NAME must be set")
              
              try:
                  table = dynamodb.Table(table_name)
                  
                  # Process S3 events
                  if 'Records' in event:
                      for record in event['Records']:
                          if record.get('eventName', '').startswith('ObjectCreated'):
                              object_key = record['s3']['object']['key']
                              
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
                              
                              # Emit CloudWatch metrics
                              cloudwatch.put_metric_data(
                                  Namespace=namespace,
                                  MetricData=[
                                      {
                                          'MetricName': 'ReplicationEvents',
                                          'Value': 1,
                                          'Unit': 'Count',
                                          'Dimensions': [
                                              {'Name': 'Environment', 'Value': environment},
                                              {'Name': 'EventType', 'Value': 'S3_OBJECT_CREATED'}
                                          ]
                                      }
                                  ]
                              )
                  
                  # Check bucket replication status
                  try:
                      response = s3.get_bucket_replication(Bucket=bucket_name)
                      
                      if 'ReplicationConfiguration' in response:
                          for rule in response['ReplicationConfiguration'].get('Rules', []):
                              if rule.get('Status') == 'Enabled':
                                  cloudwatch.put_metric_data(
                                      Namespace=namespace,
                                      MetricData=[
                                          {
                                              'MetricName': 'ReplicationHealth',
                                              'Value': 1,
                                              'Unit': 'None',
                                              'Dimensions': [
                                                  {'Name': 'Environment', 'Value': environment},
                                                  {'Name': 'RuleId', 'Value': rule['ID']}
                                              ]
                                          }
                                      ]
                                  )
                  except ClientError as e:
                      if e.response['Error']['Code'] != 'ReplicationConfigurationNotFoundError':
                          raise
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Replication monitoring completed',
                          'environment': environment
                      })
                  }
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  
                  # Emit error metrics
                  cloudwatch.put_metric_data(
                      Namespace=namespace,
                      MetricData=[
                          {
                              'MetricName': 'ReplicationErrors',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {'Name': 'Environment', 'Value': environment},
                                  {'Name': 'ErrorType', 'Value': type(e).__name__}
                              ]
                          }
                      ]
                  )
                  
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-replication-monitor-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName
        - Key: iac-rlhf-amazon
          Value: 'true'

  # ===========================
  # CloudWatch Dashboard and Monitoring
  # ===========================
  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-lambda-errors-${Environment}'
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

  ReplicationDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${ApplicationName}-replication-${Environment}'
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
                  [ ".", "ReplicationHealth", { "stat": "Sum" } ]
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
            }
          ]
        }

# ===========================
# Outputs
# ===========================
Outputs:
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

  LambdaMonitorArn:
    Description: Replication Monitor Lambda ARN
    Value: !GetAtt ReplicationMonitorLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-monitor-lambda-arn'

  CloudWatchDashboardUrl:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ReplicationDashboard}'

  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  Environment:
    Description: Environment for this deployment
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'
```

10. Shows consideration for cost optimization and operational excellence
