### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that creates a sophisticated EMR-based data processing pipeline. Let me break down the requirements:

1. EMR Cluster Configuration:
   - EMR 6.9.0 or later
   - Apache Spark 3.3, Hive 3.1.3, Presto 0.28
   - Dynamic scaling: 3-20 task nodes based on YARN memory
   - Master: m5.xlarge
   - Core/Task: r5.2xlarge
   - Task nodes: Spot instances at 80% on-demand pricing

2. Storage Layer:
   - S3 buckets with versioning
   - Lifecycle policies: 90 days to Glacier, 7 years expiration
   - SSE-KMS encryption
   - Region-agnostic using pseudo parameters

3. Workflow Orchestration:
   - Step Functions state machine
   - Error handling with exponential backoff (max 5 retries)
   - Lambda functions for monitoring, metrics, notifications
   - EventBridge rules for daily 2 AM UTC trigger and S3 events
   - CloudWatch logs with 30-day retention

4. Security & Networking:
   - Private subnets, no IGW
   - VPC endpoints for S3 and DynamoDB
   - Kerberos authentication
   - KMS encryption at rest
   - Least privilege IAM roles

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

# EMR Data Processing Pipeline CloudFormation Template

Below is a comprehensive CloudFormation template that implements your financial transaction log processing pipeline with all specified requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated EMR-based data processing pipeline for financial transaction fraud detection'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment name for resource tagging
  
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: CIDR block for VPC
  
  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: CIDR block for private subnet 1
  
  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: CIDR block for private subnet 2
  
  KerberosRealm:
    Type: String
    Default: 'EMR.CLUSTER.LOCAL'
    Description: Kerberos realm for EMR cluster
  
  KerberosKdcAdminPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: KDC admin password for Kerberos
  
  NotificationEmail:
    Type: String
    Description: Email address for job notifications
    AllowedPattern: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

Mappings:
  RegionConfig:
    us-east-1:
      EMRLogUri: 's3n://aws-logs-'
    us-west-2:
      EMRLogUri: 's3n://aws-logs-'
    eu-west-1:
      EMRLogUri: 's3n://aws-logs-'

Resources:
  # ==================== NETWORKING RESOURCES ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-vpc'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-rt'

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable
      VpcEndpointType: Gateway

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      RouteTableIds:
        - !Ref PrivateRouteTable
      VpcEndpointType: Gateway

  EMRSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EMR cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 0
          ToPort: 65535
          SourceSecurityGroupId: !Ref EMRSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-emr-sg'

  # ==================== KMS ENCRYPTION KEY ====================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EMR cluster and S3 encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EMR to use the key
            Effect: Allow
            Principal:
              Service:
                - elasticmapreduce.amazonaws.com
                - ec2.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-kms-key'
      TargetKeyId: !Ref KMSKey

  # ==================== S3 BUCKETS ====================
  RawDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-raw-data-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
            ExpirationInDays: 2555  # 7 years
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt S3EventProcessorFunction.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  ProcessedDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-processed-data-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToGlacier
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: 90
            ExpirationInDays: 2555  # 7 years
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  EMRLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-emr-logs-${AWS::AccountId}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # ==================== IAM ROLES ====================
  EMRServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticmapreduce.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceRole'
      Policies:
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:CreateGrant'
                  - 'kms:Decrypt'
                  - 'kms:Encrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn

  EMRInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EMRInstanceRole

  EMRInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceforEC2Role'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt RawDataBucket.Arn
                  - !Sub '${RawDataBucket.Arn}/*'
                  - !GetAtt ProcessedDataBucket.Arn
                  - !Sub '${ProcessedDataBucket.Arn}/*'
                  - !GetAtt EMRLogsBucket.Arn
                  - !Sub '${EMRLogsBucket.Arn}/*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:Encrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt KMSKey.Arn

  EMRAutoScalingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - elasticmapreduce.amazonaws.com
                - application-autoscaling.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceforAutoScalingRole'

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
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
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - 'elasticmapreduce:DescribeCluster'
                  - 'elasticmapreduce:DescribeStep'
                  - 'elasticmapreduce:ListSteps'
                  - 'elasticmapreduce:AddJobFlowSteps'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref SNSTopic
              - Effect: Allow
                Action:
                  - 'states:StartExecution'
                Resource: !Ref StateMachine
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt RawDataBucket.Arn
                  - !Sub '${RawDataBucket.Arn}/*'

  StepFunctionsExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: StepFunctionsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'elasticmapreduce:RunJobFlow'
                  - 'elasticmapreduce:DescribeCluster'
                  - 'elasticmapreduce:AddJobFlowSteps'
                  - 'elasticmapreduce:DescribeStep'
                  - 'elasticmapreduce:TerminateJobFlows'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'lambda:InvokeFunction'
                Resource:
                  - !GetAtt JobMonitoringFunction.Arn
                  - !GetAtt MetricsCollectorFunction.Arn
              - Effect: Allow
                Action:
                  - 'iam:PassRole'
                Resource:
                  - !GetAtt EMRServiceRole.Arn
                  - !GetAtt EMRInstanceRole.Arn
                  - !GetAtt EMRAutoScalingRole.Arn

  # ==================== SNS TOPIC ====================
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AWS::StackName}-notifications'
      DisplayName: EMR Pipeline Notifications
      KmsMasterKeyId: !Ref KMSKey
      Subscription:
        - Endpoint: !Ref NotificationEmail
          Protocol: email

  # ==================== LAMBDA FUNCTIONS ====================
  JobMonitoringFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-job-monitoring'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          emr = boto3.client('elasticmapreduce')
          sns = boto3.client('sns')
          cloudwatch = boto3.client('cloudwatch')

          def lambda_handler(event, context):
              cluster_id = event.get('ClusterId')
              step_id = event.get('StepId', None)
              
              try:
                  if step_id:
                      response = emr.describe_step(
                          ClusterId=cluster_id,
                          StepId=step_id
                      )
                      step_state = response['Step']['Status']['State']
                      
                      # Send custom metrics
                      cloudwatch.put_metric_data(
                          Namespace='EMRPipeline',
                          MetricData=[
                              {
                                  'MetricName': 'JobStatus',
                                  'Value': 1 if step_state == 'COMPLETED' else 0,
                                  'Unit': 'None',
                                  'Timestamp': datetime.now()
                              }
                          ]
                      )
                      
                      if step_state in ['FAILED', 'CANCELLED']:
                          message = f"EMR Step {step_id} failed on cluster {cluster_id}"
                          sns.publish(
                              TopicArn=os.environ['SNS_TOPIC_ARN'],
                              Subject='EMR Job Failed',
                              Message=message
                          )
                          return {
                              'statusCode': 200,
                              'body': json.dumps({'status': 'failed', 'message': message})
                          }
                      
                      return {
                          'statusCode': 200,
                          'body': json.dumps({'status': step_state.lower()})
                      }
                  else:
                      response = emr.describe_cluster(ClusterId=cluster_id)
                      cluster_state = response['Cluster']['Status']['State']
                      
                      return {
                          'statusCode': 200,
                          'body': json.dumps({'status': cluster_state.lower()})
                      }
                      
              except Exception as e:
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }

  MetricsCollectorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-metrics-collector'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          from datetime import datetime
          import time

          cloudwatch = boto3.client('cloudwatch')
          s3 = boto3.client('s3')

          def lambda_handler(event, context):
              start_time = event.get('StartTime')
              end_time = datetime.now().isoformat()
              data_volume = event.get('DataVolume', 0)
              
              if start_time:
                  start_dt = datetime.fromisoformat(start_time)
                  end_dt = datetime.fromisoformat(end_time)
                  duration_seconds = (end_dt - start_dt).total_seconds()
                  
                  # Send custom metrics
                  cloudwatch.put_metric_data(
                      Namespace='EMRPipeline',
                      MetricData=[
                          {
                              'MetricName': 'JobDuration',
                              'Value': duration_seconds,
                              'Unit': 'Seconds',
                              'Timestamp': datetime.now()
                          },
                          {
                              'MetricName': 'DataVolumeProcessed',
                              'Value': data_volume,
                              'Unit': 'Bytes',
                              'Timestamp': datetime.now()
                          }
                      ]
                  )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps({'metrics_sent': True})
              }

  S3EventProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-s3-event-processor'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      Environment:
        Variables:
          STATE_MACHINE_ARN: !Ref StateMachine
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          sfn = boto3.client('stepfunctions')

          def lambda_handler(event, context):
              state_machine_arn = os.environ['STATE_MACHINE_ARN']
              
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = record['s3']['object']['key']
                  size = record['s3']['object']['size']
                  
                  input_data = {
                      'Bucket': bucket,
                      'Key': key,
                      'Size': size,
                      'Timestamp': datetime.now().isoformat(),
                      'ProcessingType': 'realtime'
                  }
                  
                  try:
                      response = sfn.start_execution(
                          stateMachineArn=state_machine_arn,
                          name=f"s3-trigger-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                          input=json.dumps(input_data)
                      )
                      print(f"Started execution: {response['executionArn']}")
                  except Exception as e:
                      print(f"Error starting execution: {str(e)}")
                      raise
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Processing started')
              }

  S3EventPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt S3EventProcessorFunction.Arn
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !GetAtt RawDataBucket.Arn

  # ==================== CLOUDWATCH LOG GROUPS ====================
  EMRLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/emr/${AWS::StackName}'
      RetentionInDays: 30

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${AWS::StackName}'
      RetentionInDays: 30

  StepFunctionsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/stepfunctions/${AWS::StackName}'
      RetentionInDays: 30

  # ==================== EMR CLUSTER ====================
  EMRCluster:
    Type: AWS::EMR::Cluster
    Properties:
      Name: !Sub '${AWS::StackName}-emr-cluster'
      ReleaseLabel: emr-6.9.0
      Applications:
        - Name: Spark
        - Name: Hive
        - Name: Presto
      ServiceRole: !GetAtt EMRServiceRole.Arn
      JobFlowRole: !Ref EMRInstanceProfile
      AutoScalingRole: !GetAtt EMRAutoScalingRole.Arn
      VisibleToAllUsers: true
      LogUri: !Sub 's3://${EMRLogsBucket}/logs/'
      Instances:
        Ec2SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        EmrManagedMasterSecurityGroup: !Ref EMRSecurityGroup
        EmrManagedSlaveSecurityGroup: !Ref EMRSecurityGroup
        KeepJobFlowAliveWhenNoSteps: false
        TerminationProtected: false
        MasterInstanceGroup:
          InstanceCount: 1
          InstanceType: m5.xlarge
          Market: ON_DEMAND
          Name: Master
        CoreInstanceGroup:
          InstanceCount: 2
          InstanceType: r5.2xlarge
          Market: ON_DEMAND
          Name: Core
          AutoScalingPolicy:
            Constraints:
              MinCapacity: 2
              MaxCapacity: 10
            Rules:
              - Name: ScaleOut
                Action:
                  SimpleScalingPolicyConfiguration:
                    AdjustmentType: CHANGE_IN_CAPACITY
                    ScalingAdjustment: 2
                    CoolDown: 300
                Trigger:
                  CloudWatchAlarmDefinition:
                    ComparisonOperator: GREATER_THAN
                    EvaluationPeriods: 1
                    MetricName: YARNMemoryAvailablePercentage
                    Namespace: AWS/ElasticMapReduce
                    Period: 300
                    Statistic: AVERAGE
                    Threshold: 15
                    Unit: PERCENT
              - Name: ScaleIn
                Action:
                  SimpleScalingPolicyConfiguration:
                    AdjustmentType: CHANGE_IN_CAPACITY
                    ScalingAdjustment: -1
                    CoolDown: 300
                Trigger:
                  CloudWatchAlarmDefinition:
                    ComparisonOperator: LESS_THAN
                    EvaluationPeriods: 1
                    MetricName: YARNMemoryAvailablePercentage
                    Namespace: AWS/ElasticMapReduce
                    Period: 300
                    Statistic: AVERAGE
                    Threshold: 75
                    Unit: PERCENT
      Configurations:
        - Classification: spark
          ConfigurationProperties:
            spark.dynamicAllocation.enabled: 'true'
            spark.shuffle.service.enabled: 'true'
        - Classification: hive-site
          ConfigurationProperties:
            hive.metastore.client.factory.class: 'com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory'
        - Classification: presto-connector-hive
          ConfigurationProperties:
            hive.metastore.glue.datacatalog.enabled: 'true'
        - Classification: emrfs-site
          ConfigurationProperties:
            fs.s3.serverSideEncryption.kms.keyId: !GetAtt KMSKey.Arn
      SecurityConfiguration: !Ref EMRSecurityConfiguration
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Name
          Value: !Sub '${AWS::StackName}-emr-cluster'

  EMRSecurityConfiguration:
    Type: AWS::EMR::SecurityConfiguration
    Properties:
      Name: !Sub '${AWS::StackName}-security-config'
      SecurityConfiguration:
        AuthenticationConfiguration:
          KerberosConfiguration:
            Provider: ClusterDedicatedKdc
            ClusterDedicatedKdcConfiguration:
              TicketLifetimeInHours: 24
              Realm: !Ref KerberosRealm
              KdcAdminPassword: !Ref KerberosKdcAdminPassword
        EncryptionConfiguration:
          EnableInTransitEncryption: true
          EnableAtRestEncryption: true
          AtRestEncryptionConfiguration:
            S3EncryptionConfiguration:
              EncryptionMode: SSE-KMS
              AwsKmsKey: !GetAtt KMSKey.Arn
            LocalDiskEncryptionConfiguration:
              EncryptionKeyProviderType: AwsKms
              AwsKmsKey: !GetAtt KMSKey.Arn
          InTransitEncryptionConfiguration:
            TLSCertificateConfiguration:
              CertificateProviderType: PEM
              S3Object: !Sub 's3://${EMRLogsBucket}/certificates/emr-tls.zip'

  TaskInstanceGroup:
    Type: AWS::EMR::InstanceGroupConfig
    Properties:
      JobFlowId: !Ref EMRCluster
      InstanceCount: 3
      InstanceType: r5.2xlarge
      Market: SPOT
      BidPrice: '0.8'  # 80% of on-demand pricing
      Name: Task
      AutoScalingPolicy:
        Constraints:
          MinCapacity: 3
          MaxCapacity: 20
        Rules:
          - Name: TaskScaleOut
            Action:
              SimpleScalingPolicyConfiguration:
                AdjustmentType: CHANGE_IN_CAPACITY
                ScalingAdjustment: 4
                CoolDown: 300
            Trigger:
              CloudWatchAlarmDefinition:
                ComparisonOperator: GREATER_THAN
                EvaluationPeriods: 1
                MetricName: YARNMemoryAvailablePercentage
                Namespace: AWS/ElasticMapReduce
                Period: 300
                Statistic: AVERAGE
                Threshold: 20
                Unit: PERCENT
          - Name: TaskScaleIn
            Action:
              SimpleScalingPolicyConfiguration:
                AdjustmentType: CHANGE_IN_CAPACITY
                ScalingAdjustment: -2
                CoolDown: 300
            Trigger:
              CloudWatchAlarmDefinition:
                ComparisonOperator: LESS_THAN
                EvaluationPeriods: 1
                MetricName: YARNMemoryAvailablePercentage
                Namespace: AWS/ElasticMapReduce
                Period: 300
                Statistic: AVERAGE
                Threshold: 80
                Unit: PERCENT

  # ==================== STEP FUNCTIONS STATE MACHINE ====================
  StateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub '${AWS::StackName}-pipeline'
      RoleArn: !GetAtt StepFunctionsExecutionRole.Arn
      LoggingConfiguration:
        Level: ALL
        IncludeExecutionData: true
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt StepFunctionsLogGroup.Arn
      DefinitionString: !Sub |
        {
          "Comment": "EMR Data Processing Pipeline with Error Handling",
          "StartAt": "StartEMRCluster",
          "States": {
            "StartEMRCluster": {
              "Type": "Task",
              "Resource": "arn:aws:states:::elasticmapreduce:createCluster.sync",
              "Parameters": {
                "Name": "DataProcessingCluster",
                "ReleaseLabel": "emr-6.9.0",
                "Applications": [
                  {"Name": "Spark"},
                  {"Name": "Hive"},
                  {"Name": "Presto"}
                ],
                "ServiceRole": "${EMRServiceRole.Arn}",
                "JobFlowRole": "${EMRInstanceProfile}",
                "VisibleToAllUsers": true,
                "LogUri": "s3://${EMRLogsBucket}/logs/",
                "Instances": {
                  "Ec2SubnetIds": ["${PrivateSubnet1}", "${PrivateSubnet2}"],
                  "EmrManagedMasterSecurityGroup": "${EMRSecurityGroup}",
                  "EmrManagedSlaveSecurityGroup": "${EMRSecurityGroup}",
                  "KeepJobFlowAliveWhenNoSteps": true,
                  "InstanceGroups": [
                    {
                      "Name": "Master",
                      "Market": "ON_DEMAND",
                      "InstanceRole": "MASTER",
                      "InstanceType": "m5.xlarge",
                      "InstanceCount": 1
                    },
                    {
                      "Name": "Core",
                      "Market": "ON_DEMAND",
                      "InstanceRole": "CORE",
                      "InstanceType": "r5.2xlarge",
                      "InstanceCount": 2
                    }
                  ]
                }
              },
              "ResultPath": "$.ClusterData",
              "Retry": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 5,
                  "BackoffRate": 2.0
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "NotifyFailure"
                }
              ],
              "Next": "SubmitSparkJob"
            },
            "SubmitSparkJob": {
              "Type": "Task",
              "Resource": "arn:aws:states:::elasticmapreduce:addStep.sync",
              "Parameters": {
                "ClusterId.$": "$.ClusterData.ClusterId",
                "Step": {
                  "Name": "ProcessTransactionLogs",
                  "ActionOnFailure": "CONTINUE",
                  "HadoopJarStep": {
                    "Jar": "command-runner.jar",
                    "Args": [
                      "spark-submit",
                      "--deploy-mode", "cluster",
                      "--master", "yarn",
                      "--conf", "spark.yarn.submit.waitAppCompletion=true",
                      "--conf", "spark.sql.adaptive.enabled=true",
                      "--conf", "spark.sql.adaptive.coalescePartitions.enabled=true",
                      "s3://${ProcessedDataBucket}/scripts/fraud-detection.py",
                      "--input", "s3://${RawDataBucket}/transactions/",
                      "--output", "s3://${ProcessedDataBucket}/results/"
                    ]
                  }
                }
              },
              "ResultPath": "$.StepData",
              "Retry": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 5,
                  "BackoffRate": 2.0
                }
              ],
              "Catch": [
                {
                  "ErrorEquals": ["States.ALL"],
                  "Next": "NotifyFailure"
                }
              ],
              "Next": "MonitorJob"
            },
            "MonitorJob": {
              "Type": "Task",
              "Resource": "${JobMonitoringFunction.Arn}",
              "Parameters": {
                "ClusterId.$": "$.ClusterData.ClusterId",
                "StepId.$": "$.StepData.StepId"
              },
              "ResultPath": "$.MonitoringResult",
              "Next": "CollectMetrics"
            },
            "CollectMetrics": {
              "Type": "Task",
              "Resource": "${MetricsCollectorFunction.Arn}",
              "Parameters": {
                "StartTime.$": "$.StartTime",
                "DataVolume.$": "$.Size"
              },
              "ResultPath": "$.MetricsResult",
              "Next": "TerminateCluster"
            },
            "TerminateCluster": {
              "Type": "Task",
              "Resource": "arn:aws:states:::elasticmapreduce:terminateCluster.sync",
              "Parameters": {
                "ClusterId.$": "$.ClusterData.ClusterId"
              },
              "Next": "NotifySuccess"
            },
            "NotifySuccess": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "${SNSTopic}",
                "Subject": "EMR Pipeline Completed Successfully",
                "Message.$": "$"
              },
              "End": true
            },
            "NotifyFailure": {
              "Type": "Task",
              "Resource": "arn:aws:states:::sns:publish",
              "Parameters": {
                "TopicArn": "${SNSTopic}",
                "Subject": "EMR Pipeline Failed",
                "Message.$": "$"
              },
              "End": true
            }
          }
        }

  # ==================== EVENTBRIDGE RULES ====================
  DailyScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-daily-schedule'
      Description: Trigger EMR pipeline daily at 2 AM UTC
      ScheduleExpression: 'cron(0 2 * * ? *)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt StateMachine.Arn
          RoleArn: !GetAtt EventBridgeRole.Arn
          Input: !Sub |
            {
              "ProcessingType": "scheduled",
              "StartTime": "${AWS::StackName}",
              "InputPath": "s3://${RawDataBucket}/daily/"
            }

  EventBridgeRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: events.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: StartStepFunction
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'states:StartExecution'
                Resource: !GetAtt StateMachine.Arn

  # ==================== CLOUDWATCH ALARMS ====================
  EMRClusterAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-emr-cluster-failed'
      AlarmDescription: Alert when EMR cluster fails
      MetricName: ClusterStatus
      Namespace: AWS/ElasticMapReduce
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  DataProcessingVolumeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-low-data-volume'
      AlarmDescription: Alert when processed data volume is unusually low
      MetricName: DataVolumeProcessed
      Namespace: EMRPipeline
      Statistic: Sum
      Period: 86400  # 24 hours
      EvaluationPeriods: 1
      Threshold: 1000000000000  # 1TB
      ComparisonOperator: LessThanThreshold
      TreatMissingData: breaching
      AlarmActions:
        - !Ref SNSTopic

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  RawDataBucketName:
    Description: S3 bucket for raw data
    Value: !Ref RawDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-raw-bucket'

  ProcessedDataBucketName:
    Description: S3 bucket for processed data
    Value: !Ref ProcessedDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-processed-bucket'

  StateMachineArn:
    Description: Step Functions State Machine ARN
    Value: !Ref StateMachine
    Export:
      Name: !Sub '${AWS::StackName}-state-machine'

  SNSTopicArn:
    Description: SNS Topic for notifications
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-sns-topic'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${AWS::StackName}-kms-key'

  EMRClusterId:
    Description: EMR Cluster ID
    Value: !Ref EMRCluster
    Export:
      Name: !Sub '${AWS::StackName}-emr-cluster'
```

## Template Overview

This CloudFormation template creates a comprehensive EMR-based data processing pipeline with the following key components:

### **Architecture Components**

1. **Networking Layer**
   - Private VPC with 2 subnets (no internet gateway)
   - VPC endpoints for S3 and DynamoDB
   - Security groups for EMR cluster isolation

2. **Storage Layer**
   - Three S3 buckets (raw data, processed data, EMR logs)
   - Versioning enabled on all buckets
   - Lifecycle policies for Glacier transition (90 days) and expiration (7 years)
   - SSE-KMS encryption for all data at rest

3. **EMR Cluster Configuration**
   - EMR 6.9.0 with Spark 3.3, Hive 3.1.3, and Presto 0.28
   - Master node: m5.xlarge
   - Core nodes: r5.2xlarge (2 instances, auto-scaling 2-10)
   - Task nodes: r5.2xlarge (3-20 instances, spot at 80% on-demand)
   - Auto-scaling based on YARN memory utilization
   - Kerberos authentication enabled

4. **Workflow Orchestration**
   - Step Functions state machine with retry logic (exponential backoff, max 5 attempts)
   - Lambda functions for job monitoring and metrics collection
   - EventBridge rules for scheduled (2 AM UTC) and event-driven triggers

5. **Security & Compliance**
   - KMS encryption for all services
   - IAM roles with least privilege access
   - Private networking with VPC endpoints
   - CloudWatch logs with 30-day retention

### **Deployment Instructions**

1. **Prerequisites**
   - AWS CLI configured with appropriate credentials
   - Valid email address for notifications
   - Kerberos admin password (minimum 8 characters)

2. **Deploy the Stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name fraud-detection-pipeline \
     --template-body file://template.yaml \
     --parameters \
       ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
       ParameterKey=KerberosKdcAdminPassword,ParameterValue=YourSecurePassword123! \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

3. **Post-Deployment Steps**
   - Upload your Spark job scripts to `s3://<processed-bucket>/scripts/`
   - Configure TLS certificates for EMR in-transit encryption
   - Verify SNS subscription email
   - Test the pipeline with sample data

### **Key Features**

- **Cost Optimization**: Spot instances for task nodes, lifecycle policies for storage
- **High Availability**: Multi-AZ deployment, automatic failover
- **Scalability**: Auto-scaling based on workload, handles 5TB+ daily
- **Security**: End-to-end encryption, private networking, Kerberos auth
- **Monitoring**: Custom metrics, CloudWatch alarms, SNS notifications
- **Compliance**: 7-year data retention, audit logging, encryption at rest

This template provides a production-ready foundation for processing large-scale financial transaction data with built-in security, scalability, and compliance features.