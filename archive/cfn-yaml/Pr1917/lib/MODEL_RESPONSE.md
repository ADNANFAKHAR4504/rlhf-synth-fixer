# Security Configuration as Code - CloudFormation Implementation

This response provides a comprehensive CloudFormation template that implements foundational security services including GuardDuty, Security Hub, Config, CloudTrail, and Macie with proper integration and automation.

## CloudFormation Template: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security Configuration as Code - Comprehensive AWS Security Services Stack'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Security Configuration'
        Parameters:
          - NotificationEmail
          - EnableMacie
          - EnableEKSProtection

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  NotificationEmail:
    Type: String
    Description: 'Email address for security notifications'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ConstraintDescription: 'Must be a valid email address'

  EnableMacie:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: 'Enable Amazon Macie for sensitive data discovery'

  EnableEKSProtection:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']
    Description: 'Enable GuardDuty EKS protection features'

Conditions:
  ShouldCreateMacie: !Equals [!Ref EnableMacie, 'true']
  ShouldEnableEKS: !Equals [!Ref EnableEKSProtection, 'true']

Resources:
  # KMS Key for Security Services
  SecurityServicesKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for Security Services - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow Config to use the key
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'SecurityServices-KMS-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecurityServicesKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/security-services-${EnvironmentSuffix}'
      TargetKeyId: !Ref SecurityServicesKMSKey

  # S3 Bucket for CloudTrail Logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityServicesKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'CloudTrail-Logs-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudTrailLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailLogsBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': aws:kms
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt SecurityServicesKMSKey.Arn

  # S3 Bucket for Config
  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'aws-config-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityServicesKMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'Config-Bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref AWS::AccountId
          - Sid: AWSConfigBucketExistenceCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:ListBucket
            Resource: !GetAtt ConfigBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceAccount': !Ref AWS::AccountId
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ConfigBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-server-side-encryption': aws:kms
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt SecurityServicesKMSKey.Arn
                'AWS:SourceAccount': !Ref AWS::AccountId

  # SNS Topic for Security Notifications
  SecurityNotificationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'security-notifications-${EnvironmentSuffix}'
      DisplayName: !Sub 'Security Notifications - ${EnvironmentSuffix}'
      KmsMasterKeyId: !Ref SecurityServicesKMSKey
      Tags:
        - Key: Name
          Value: !Sub 'Security-Notifications-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecurityNotificationsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SecurityNotificationsTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  # IAM Role for Config
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ConfigServiceRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/ConfigRole
      Tags:
        - Key: Name
          Value: !Sub 'Config-Service-Role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # AWS CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailLogsBucketPolicy
    Properties:
      TrailName: !Sub 'security-cloudtrail-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailLogsBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !GetAtt SecurityServicesKMSKey.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: ['arn:aws:s3:::*/*']
            - Type: 'AWS::S3::Bucket'
              Values: ['arn:aws:s3:::*']
      Tags:
        - Key: Name
          Value: !Sub 'Security-CloudTrail-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # AWS Config Configuration Recorder
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub 'security-config-recorder-${EnvironmentSuffix}'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RecordingMode:
        RecordingFrequency: DAILY

  # AWS Config Delivery Channel
  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub 'security-config-delivery-${EnvironmentSuffix}'
      S3BucketName: !Ref ConfigBucket

  # Config Rules
  RootAccessKeyCheck:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 'root-access-key-check-${EnvironmentSuffix}'
      Description: 'Checks whether the root user access key is available'
      Source:
        Owner: AWS
        SourceIdentifier: ROOT_ACCESS_KEY_CHECK

  S3BucketPublicAccessProhibited:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: !Sub 's3-bucket-public-access-prohibited-${EnvironmentSuffix}'
      Description: 'Checks if S3 buckets are publicly accessible'
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_ACCESS_PROHIBITED

  # Amazon GuardDuty
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES
      DataSources:
        S3Logs:
          Enable: true
        MalwareProtection:
          ScanEc2InstanceWithFindings:
            EbsVolumes: true
        Kubernetes:
          AuditLogs:
            Enable: !If [ShouldEnableEKS, true, false]
      Features:
        - Name: EKS_AUDIT_LOGS
          Status: !If [ShouldEnableEKS, ENABLED, DISABLED]
        - Name: EBS_MALWARE_PROTECTION
          Status: ENABLED
        - Name: RDS_LOGIN_EVENTS
          Status: ENABLED
        - Name: EKS_RUNTIME_MONITORING
          Status: !If [ShouldEnableEKS, ENABLED, DISABLED]
        - Name: LAMBDA_NETWORK_LOGS
          Status: ENABLED
      Tags:
        - Key: Name
          Value: !Sub 'GuardDuty-Detector-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # AWS Security Hub
  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        Name: !Sub 'Security-Hub-${EnvironmentSuffix}'
        Environment: !Ref EnvironmentSuffix
      EnableDefaultStandards: true
      ControlFindingGenerator: SECURITY_CONTROL

  # Security Hub Standards Subscriptions
  SecurityHubCISStandard:
    Type: AWS::SecurityHub::StandardsSubscription
    Properties:
      StandardsArn: !Sub 'arn:aws:securityhub:${AWS::Region}::ruleset/cis-aws-foundations-benchmark/v/1.2.0'

  SecurityHubPCIStandard:
    Type: AWS::SecurityHub::StandardsSubscription
    Properties:
      StandardsArn: !Sub 'arn:aws:securityhub:${AWS::Region}::ruleset/pci-dss/v/3.2.1'

  # Amazon Macie (Conditional)
  MacieSession:
    Type: AWS::Macie::Session
    Condition: ShouldCreateMacie
    Properties:
      Status: ENABLED
      FindingPublishingFrequency: FIFTEEN_MINUTES

  # EventBridge Rules for Security Alerts
  GuardDutyEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'guardduty-high-severity-${EnvironmentSuffix}'
      Description: 'Captures high severity GuardDuty findings'
      EventPattern:
        source: ['aws.guardduty']
        detail-type: ['GuardDuty Finding']
        detail:
          severity: [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9, 9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10]
      State: ENABLED
      Targets:
        - Arn: !Ref SecurityNotificationsTopic
          Id: 'SecurityNotificationTarget'

  SecurityHubEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'securityhub-critical-findings-${EnvironmentSuffix}'
      Description: 'Captures critical Security Hub findings'
      EventPattern:
        source: ['aws.securityhub']
        detail-type: ['Security Hub Findings - Imported']
        detail:
          findings:
            Severity:
              Label: ['CRITICAL', 'HIGH']
      State: ENABLED
      Targets:
        - Arn: !Ref SecurityNotificationsTopic
          Id: 'SecurityHubNotificationTarget'

  # CloudWatch Alarms
  ConfigComplianceAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'config-noncompliant-resources-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm for non-compliant Config resources'
      MetricName: ComplianceByConfigRule
      Namespace: AWS/Config
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SecurityNotificationsTopic
      Tags:
        - Key: Name
          Value: !Sub 'Config-Compliance-Alarm-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Original DynamoDB Table (preserved from existing template)
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TurnAroundPromptTable${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref SecurityServicesKMSKey
      Tags:
        - Key: Name
          Value: !Sub 'TurnAroundPromptTable-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  # Original Outputs (preserved)
  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

  # Security Services Outputs
  KMSKeyId:
    Description: 'KMS Key ID for security services'
    Value: !Ref SecurityServicesKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-SecurityKMSKey'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  GuardDutyDetectorId:
    Description: 'GuardDuty Detector ID'
    Value: !Ref GuardDutyDetector
    Export:
      Name: !Sub '${AWS::StackName}-GuardDutyDetectorId'

  SecurityHubArn:
    Description: 'Security Hub ARN'
    Value: !Ref SecurityHub
    Export:
      Name: !Sub '${AWS::StackName}-SecurityHubArn'

  SecurityNotificationsTopicArn:
    Description: 'SNS Topic for security notifications'
    Value: !Ref SecurityNotificationsTopic
    Export:
      Name: !Sub '${AWS::StackName}-SecurityNotificationsTopic'

  MacieSessionArn:
    Description: 'Macie Session ARN'
    Value: !If [ShouldCreateMacie, !Ref MacieSession, 'Not Created']
    Export:
      Name: !Sub '${AWS::StackName}-MacieSessionArn'

  ConfigRecorderName:
    Description: 'Config Recorder Name'
    Value: !Ref ConfigRecorder
    Export:
      Name: !Sub '${AWS::StackName}-ConfigRecorderName'
```

This comprehensive CloudFormation template implements a complete security configuration as code solution with the following components:

1. **KMS Encryption**: Dedicated KMS key for encrypting all security service data
2. **Amazon GuardDuty**: Enabled with Extended Threat Detection features including EKS protection, malware scanning, and Lambda monitoring
3. **AWS Security Hub**: Configured with CSPM capabilities and multiple compliance standards (CIS, PCI-DSS)
4. **AWS Config**: Configuration recording with compliance rules for security best practices
5. **AWS CloudTrail**: Multi-region trail with encryption and comprehensive event logging
6. **Amazon Macie**: Optional sensitive data discovery and classification (controlled by parameter)
7. **Automated Alerting**: EventBridge rules and CloudWatch alarms for proactive security monitoring
8. **Secure Storage**: Encrypted S3 buckets for logs with proper access controls and lifecycle policies
9. **Integration**: All services configured to work together with Security Hub as the central hub
10. **Parameterization**: Flexible configuration options for different environments

The template follows AWS best practices for security service deployment and includes proper tagging, encryption, and access controls throughout.