## Model response to fix the lint and Deploy issues
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Robust S3 Cross-Region Replication System with monitoring, security, and cost optimization.
  This template creates the source bucket infrastructure in us-east-1.
  The destination bucket in us-west-2 needs to be created separately.

# Parameters for flexible deployment and tagging
Parameters:
  Environment:
    Type: String
    Default: staging
    AllowedValues: [staging, production]
    Description: Environment name for resource tagging
    
  CostCenter:
    Type: String
    Default: IT-Infrastructure
    Description: Cost center for resource tagging and billing
    
  ProjectName:
    Type: String
    Default: disaster-recovery-replication
    Description: Project name for resource naming and tagging
    
  DestinationBucketName:
    Type: String
    Default: ""
    Description: >
      Name of the destination bucket in us-west-2. 
      Leave empty to generate a default name.
    
  VpcId:
    Type: String
    Default: ""
    Description: >
      VPC ID for S3 Gateway Endpoint (optional). 
      Leave empty to skip VPC endpoint creation.
      
  RouteTableIds:
    Type: CommaDelimitedList
    Default: ""
    Description: >
      Comma-delimited list of route table IDs for S3 Gateway Endpoint (optional).
      Only used if VpcId is provided.

  NotificationEmail:
    Type: String
    Default: ""
    Description: Email address for replication notifications and alerts (optional)
    
Conditions:
  # Condition to create VPC Gateway Endpoint only if VPC ID is provided
  CreateVpcEndpoint: !And 
    - !Not [!Equals [!Ref VpcId, ""]]
    - !Not [!Equals [!Select [0, !Ref RouteTableIds], ""]]
  
  # Condition for email notifications
  CreateEmailSubscription: !Not [!Equals [!Ref NotificationEmail, ""]]
  
  # Condition for destination bucket name
  HasDestinationBucketName: !Not [!Equals [!Ref DestinationBucketName, ""]]

Resources:
  # =================================================================================
  # SOURCE S3 BUCKET (us-east-1) - Created first without replication config
  # =================================================================================
  
  SourceBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${ProjectName}-source-${Environment}-${AWS::AccountId}"
      # Enable versioning for change history and mistake recovery
      VersioningConfiguration:
        Status: Enabled
      # Server-side encryption with AWS KMS managed keys
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: alias/aws/s3
            BucketKeyEnabled: true
      # Block all public access for security
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      # Lifecycle policy for cost optimization
      LifecycleConfiguration:
        Rules:
          - Id: NonCurrentVersionTransition
            Status: Enabled
            # Move non-current versions to IA after 30 days
            NoncurrentVersionTransitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
            # Delete non-current versions after 1 year
            NoncurrentVersionExpirationInDays: 365
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Source bucket for cross-region replication

  # =================================================================================
  # IAM ROLE for S3 Replication with minimal required permissions
  # =================================================================================
  
  ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${ProjectName}-replication-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: sts:AssumeRole
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Project
          Value: !Ref ProjectName

  # =================================================================================
  # IAM POLICY for the replication role (separate to avoid circular dependency)
  # =================================================================================
  
  ReplicationRolePolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: S3ReplicationPolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Permissions to read from source bucket
          - Effect: Allow
            Action:
              - s3:GetObjectVersion
              - s3:GetObjectVersionAcl
              - s3:GetObjectVersionTagging
            Resource: !Sub "${SourceBucket}/*"
          - Effect: Allow
            Action:
              - s3:ListBucket
            Resource: !Ref SourceBucket
          # Permissions to write to destination bucket
          - Effect: Allow
            Action:
              - s3:ReplicateObject
              - s3:ReplicateDelete
              - s3:ReplicateTags
            Resource: !Sub 
              - "arn:aws:s3:::${DestBucket}/*"
              - DestBucket: !If 
                - HasDestinationBucketName
                - !Ref DestinationBucketName
                - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
          # Permissions for KMS encryption
          - Effect: Allow
            Action:
              - kms:Decrypt
            Resource: !Sub "arn:aws:kms:us-east-1:${AWS::AccountId}:key/*"
          - Effect: Allow
            Action:
              - kms:GenerateDataKey
            Resource: !Sub "arn:aws:kms:us-west-2:${AWS::AccountId}:key/*"
      Roles:
        - !Ref ReplicationRole

  # =================================================================================
  # REPLICATION CONFIGURATION (separate resource to avoid circular dependency)
  # =================================================================================
  
  ReplicationConfiguration:
    Type: AWS::S3::Bucket
    DependsOn: [ReplicationRole, ReplicationRolePolicy]
    Properties:
      BucketName: !Ref SourceBucket
      ReplicationConfiguration:
        Role: !GetAtt ReplicationRole.Arn
        Rules:
          - Id: DisasterRecoveryReplication
            Status: Enabled
            Priority: 1
            # Replicate all objects
            Filter:
              Prefix: ""
            Destination:
              Bucket: !Sub 
                - "arn:aws:s3:::${DestBucket}"
                - DestBucket: !If 
                  - HasDestinationBucketName
                  - !Ref DestinationBucketName
                  - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
              StorageClass: STANDARD
              # Enable Replication Time Control for 15-minute sync
              ReplicationTime:
                Status: Enabled
                Time:
                  Minutes: 15
              # Metrics for monitoring replication performance
              Metrics:
                Status: Enabled
                EventThreshold:
                  Minutes: 15
            # Delete marker replication
            DeleteMarkerReplication:
              Status: Enabled

  # =================================================================================
  # CLOUDWATCH LOG GROUP for replication activity logging
  # =================================================================================
  
  ReplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/s3/replication/${ProjectName}-${Environment}"
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Project
          Value: !Ref ProjectName

  # =================================================================================
  # SNS TOPIC for notifications and alerts
  # =================================================================================
  
  ReplicationNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${ProjectName}-replication-notifications-${Environment}"
      DisplayName: S3 Replication Notifications
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Project
          Value: !Ref ProjectName

  # Email subscription (only if email provided)
  EmailSubscription:
    Type: AWS::SNS::Subscription
    Condition: CreateEmailSubscription
    Properties:
      Protocol: email
      TopicArn: !Ref ReplicationNotificationTopic
      Endpoint: !Ref NotificationEmail

  # =================================================================================
  # CLOUDWATCH ALARMS for monitoring and alerting
  # =================================================================================
  
  # Alarm for replication latency exceeding 15 minutes
  ReplicationLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-replication-latency-${Environment}"
      AlarmDescription: Alert when S3 replication latency exceeds 15 minutes
      MetricName: ReplicationLatency
      Namespace: AWS/S3
      Statistic: Maximum
      Period: 300  # 5 minutes
      EvaluationPeriods: 3
      Threshold: 900  # 15 minutes in seconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: SourceBucket
          Value: !Ref SourceBucket
        - Name: DestinationBucket
          Value: !If 
            - HasDestinationBucketName
            - !Ref DestinationBucketName
            - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
      AlarmActions:
        - !Ref ReplicationNotificationTopic
      OKActions:
        - !Ref ReplicationNotificationTopic
      TreatMissingData: notBreaching

  # Alarm for access denied errors (security monitoring)
  SecurityAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-security-access-denied-${Environment}"
      AlarmDescription: Alert on spike in S3 access denied errors
      MetricName: 4xxErrors
      Namespace: AWS/S3
      Statistic: Sum
      Period: 300  # 5 minutes
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: BucketName
          Value: !Ref SourceBucket
      AlarmActions:
        - !Ref ReplicationNotificationTopic
      TreatMissingData: notBreaching

  # Custom metric for successful replications
  ReplicationSuccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${ProjectName}-replication-success-${Environment}"
      AlarmDescription: Monitor successful S3 replications
      MetricName: BytesReplicated
      Namespace: AWS/S3
      Statistic: Sum
      Period: 900  # 15 minutes
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: SourceBucket
          Value: !Ref SourceBucket
        - Name: DestinationBucket
          Value: !If 
            - HasDestinationBucketName
            - !Ref DestinationBucketName
            - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
      AlarmActions:
        - !Ref ReplicationNotificationTopic
      TreatMissingData: notBreaching

  # =================================================================================
  # DYNAMODB TABLE for replication metadata tracking
  # =================================================================================
  
  ReplicationMetadataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${ProjectName}-replication-metadata-${Environment}"
      BillingMode: PAY_PER_REQUEST  # Cost-effective for variable workloads
      AttributeDefinitions:
        - AttributeName: ObjectKey
          AttributeType: S
      KeySchema:
        - AttributeName: ObjectKey
          KeyType: HASH
      # Enable point-in-time recovery for data protection
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      # Server-side encryption
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Project
          Value: !Ref ProjectName
        - Key: Purpose
          Value: Track S3 replication job metadata

  # =================================================================================
  # VPC GATEWAY ENDPOINT for S3 (optional, for private data transfer)
  # =================================================================================
  
  S3VpcEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Condition: CreateVpcEndpoint
    Properties:
      VpcId: !Ref VpcId
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.s3"
      VpcEndpointType: Gateway
      RouteTableIds: !Ref RouteTableIds
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:ListBucket
            Resource:
              - !Sub "${SourceBucket}/*"
              - !Ref SourceBucket
              - !Sub 
                - "arn:aws:s3:::${DestBucket}/*"
                - DestBucket: !If 
                  - HasDestinationBucketName
                  - !Ref DestinationBucketName
                  - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
              - !Sub 
                - "arn:aws:s3:::${DestBucket}"
                - DestBucket: !If 
                  - HasDestinationBucketName
                  - !Ref DestinationBucketName
                  - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"

# =================================================================================
# OUTPUTS for reference and integration with other systems
# =================================================================================

Outputs:
  SourceBucketName:
    Description: Name of the source S3 bucket
    Value: !Ref SourceBucket
    Export:
      Name: !Sub "${AWS::StackName}-SourceBucket"

  SourceBucketArn:
    Description: ARN of the source S3 bucket
    Value: !GetAtt SourceBucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-SourceBucketArn"

  DestinationBucketName:
    Description: Name of the destination bucket to create in us-west-2
    Value: !If 
      - HasDestinationBucketName
      - !Ref DestinationBucketName
      - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
    Export:
      Name: !Sub "${AWS::StackName}-DestinationBucketName"

  ReplicationRoleArn:
    Description: ARN of the replication IAM role
    Value: !GetAtt ReplicationRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-ReplicationRoleArn"

  SNSTopicArn:
    Description: ARN of the SNS topic for notifications
    Value: !Ref ReplicationNotificationTopic
    Export:
      Name: !Sub "${AWS::StackName}-SNSTopic"

  DynamoDBTableName:
    Description: Name of the DynamoDB table for metadata
    Value: !Ref ReplicationMetadataTable
    Export:
      Name: !Sub "${AWS::StackName}-DynamoDBTable"

  SetupInstructions:
    Description: Next steps to complete the replication setup
    Value: !Sub 
      - |
        SETUP INSTRUCTIONS:
        
        1. Create destination bucket in us-west-2:
           Bucket Name: ${DestBucket}
           
        2. Apply this bucket policy to destination bucket:
        {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": "${RoleArn}"},
            "Action": ["s3:ReplicateObject", "s3:ReplicateDelete", "s3:ReplicateTags"],
            "Resource": "arn:aws:s3:::${DestBucket}/*"
          }]
        }
        
        3. Test by uploading files to: ${SourceBucket}
        
        4. Monitor via CloudWatch and SNS: ${SNSTopicArn}
      - DestBucket: !If 
          - HasDestinationBucketName
          - !Ref DestinationBucketName
          - !Sub "${ProjectName}-dest-${Environment}-${AWS::AccountId}"
        RoleArn: !GetAtt ReplicationRole.Arn
        SourceBucket: !Ref SourceBucket
        SNSTopicArn: !Ref ReplicationNotificationTopic
```