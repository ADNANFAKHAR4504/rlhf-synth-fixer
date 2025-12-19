# ideal_response.md

# Functional scope (build everything new)

Design and deliver a production-grade, multi-region disaster recovery solution for critical document storage using Amazon S3 (core) and AWS KMS (core), with optional CloudWatch + SNS monitoring. The solution must be fully defined in a single YAML template named TapStack.yml and create all resources from scratch—no pre-existing buckets, roles, topics, or keys are referenced. Both regions deploy the same template; replication is configured only in the primary.

## Objectives

* Create primary and replica S3 buckets with deterministic, collision-safe names that include the AWS account ID, region, and EnvironmentSuffix.
* Enable S3 Object Lock in Compliance mode with a default 7-year retention on both buckets.
* Turn on versioning on both buckets and configure CRR from primary to secondary for all objects and versions.
* Enforce VPC endpoint–only access via bucket policies using aws:SourceVpce and require TLS and SSE-KMS.
* Use customer-managed KMS keys in each region for default encryption and for the CRR destination.
* Add lifecycle policies to transition objects to Glacier at 90 days and expire after 10 years.
* Provide optional CloudWatch alarms and dashboard for replication latency and failures, and SNS email notifications.

## Non-goals

* Cross-region resources created in a single stack. Each stack is regional; the same template is deployed separately to primary and secondary regions.
* Use of hardcoded environment AllowedValues. Enforce a safe naming regex instead.

## Architecture & behavior

* Active–passive DR across two regions (primary: us-east-1, secondary: us-west-2 by default).
* Primary deployment configures CRR to the deterministic secondary bucket name and uses the secondary CMK alias for ReplicaKmsKeyID.
* Secondary deployment creates the same components but does not enable outbound replication.
* All names include EnvironmentSuffix to prevent collisions across environments.

## Parameters & validation

* EnvironmentSuffix (regex-validated, lowercase letters/digits/hyphens, length 2–20).
* PrimaryRegion and SecondaryRegion with sensible defaults.
* RetentionYears (default 7), GlacierTransitionDays (default 90), ExpirationDays (default 3650).
* VpcEndpointIds as a comma-delimited list (empty allowed).
* EnableMonitoring (true|false) and NotificationEmail (optional, required if monitoring enabled).

## Security & compliance

* Object Lock in Compliance mode with default retention applied at bucket creation.
* Default encryption: SSE-KMS with per-region CMKs; bucket key enabled.
* Bucket policies deny insecure transport, enforce VPCe usage, and require SSE-KMS for PutObject.
* Least-privilege IAM role for S3 replication with permissions to read from source, write to destination, and use KMS keys.

## Monitoring (optional)

* SNS Topic with optional email subscription.
* CloudWatch alarms for ReplicationLatency and OperationsFailedReplication (RTC).
* CloudWatch dashboard summarizing DR health.

## Naming & tags

* Bucket: fin-docs-${AccountId}-${Region}-${EnvironmentSuffix}
* KMS alias: alias/fin-docs-${EnvironmentSuffix}
* Replication role: s3-replication-${EnvironmentSuffix}-${Region}
* Consistent tagging including Environment = ${EnvironmentSuffix}

## Outputs

* Primary/Secondary bucket names and ARNs.
* Replication role ARN.
* KMS key ARN (primary) and secondary KMS alias ARN.
* SNS topic ARN and dashboard URL if monitoring enabled.
* Deployment region.

## Acceptance criteria

* Template passes linting and deploys cleanly in both regions with secondary deployed first.
* CRR replicates all objects and versions with KMS encryption and RTC metrics configured.
* Access restricted to specified VPC endpoints; public access blocked.
* Lifecycle transitions and expirations configured as required.
* All resources correctly include EnvironmentSuffix.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack — Multi-Region S3 DR (Active–Passive) with Object Lock (Compliance, default 7 years),
  cross-region replication, KMS CMKs per region, VPC endpoint–only access, lifecycle to Glacier (90d),
  expiry at 10y, optional CloudWatch alarms + SNS. Deterministic names include EnvironmentSuffix.

Metadata:
  cfn-lint:
    config:
      regions:
        - us-east-1
        - us-west-2

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix included in every resource name to avoid collisions (lowercase letters, digits, hyphens).
    AllowedPattern: '^[a-z0-9-]{2,20}$'
    ConstraintDescription: Must be 2–20 chars of lowercase letters, digits, or hyphens (e.g., prod-us, qa-01).
    Default: 'prod-us'

  PrimaryRegion:
    Type: String
    Description: Primary (active) region where replication originates.
    Default: 'us-east-1'

  SecondaryRegion:
    Type: String
    Description: Secondary (passive) region that receives replication.
    Default: 'us-west-2'

  GlacierTransitionDays:
    Type: Number
    Description: Days after which objects transition to Glacier Flexible Retrieval.
    Default: 90
    MinValue: 30
    MaxValue: 3650

  ExpirationDays:
    Type: Number
    Description: Days after which objects expire (must be >= Object Lock retention window).
    Default: 3650
    MinValue: 2555
    MaxValue: 36500

  RetentionYears:
    Type: Number
    Description: Default Object Lock retention in years (Compliance mode).
    Default: 7
    MinValue: 1
    MaxValue: 99

  VpcEndpointIds:
    Type: CommaDelimitedList
    Description: Comma-separated list of THIS region’s allowed S3 VPC Endpoint IDs (e.g., vpce-123,vpce-456). Leave empty for none.
    Default: ''

  EnableMonitoring:
    Type: String
    Description: Enable CloudWatch alarms, dashboard, and SNS notifications (true|false).
    AllowedPattern: '^(true|false)$'
    Default: 'true'

  NotificationEmail:
    Type: String
    Description: Email address for SNS subscription (required if EnableMonitoring=true).
    Default: ''

Conditions:
  IsPrimary: !Equals [ !Ref AWS::Region, !Ref PrimaryRegion ]
  MonitoringEnabled: !Equals [ !Ref EnableMonitoring, 'true' ]
  HasNotificationEmail: !Not [ !Equals [ !Ref NotificationEmail, '' ] ]
  MonitoringAndEmail: !And [ !Condition MonitoringEnabled, !Condition HasNotificationEmail ]
  MonitoringAndPrimary: !And [ !Condition MonitoringEnabled, !Condition IsPrimary ]

Resources:

  ###########################################################
  # KMS — Regional CMK and Alias
  ###########################################################
  DocsKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'TapStack DR CMK for S3 (${AWS::Region}, ${EnvironmentSuffix})'
      EnableKeyRotation: true
      PendingWindowInDays: 7
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRootAccountAdmin
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowS3ServiceUsage
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              StringEquals:
                aws:SourceAccount: !Sub '${AWS::AccountId}'

  DocsKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/fin-docs-${EnvironmentSuffix}'
      TargetKeyId: !Ref DocsKmsKey

  ###########################################################
  # IAM — S3 Replication Role (assumed by S3) — unique per region
  ###########################################################
  ReplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 's3-replication-${EnvironmentSuffix}-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowS3Assume
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                aws:SourceAccount: !Sub '${AWS::AccountId}'
      Path: /
      Policies:
        - PolicyName: !Sub 's3-replication-policy-${EnvironmentSuffix}-${AWS::Region}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Read from source bucket (primary region deployment)
              - Sid: SourceBucketRead
                Effect: Allow
                Action:
                  - s3:GetReplicationConfiguration
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${PrimaryRegion}-${EnvironmentSuffix}'
              - Sid: SourceObjectRead
                Effect: Allow
                Action:
                  - s3:GetObjectVersion
                  - s3:GetObjectVersionAcl
                  - s3:GetObjectVersionTagging
                  - s3:GetObjectVersionForReplication
                  - s3:GetObjectLegalHold
                  - s3:GetObjectVersionAttributes
                  - s3:GetObjectRetention
                Resource: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${PrimaryRegion}-${EnvironmentSuffix}/*'
              # Write to destination bucket (secondary region)
              - Sid: DestinationWrite
                Effect: Allow
                Action:
                  - s3:ReplicateObject
                  - s3:ReplicateDelete
                  - s3:ReplicateTags
                  - s3:ObjectOwnerOverrideToBucketOwner
                  - s3:PutObjectLegalHold
                  - s3:PutObjectRetention
                Resource: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${SecondaryRegion}-${EnvironmentSuffix}/*'
              # Use KMS keys (this region + secondary region alias)
              - Sid: UseKmsKeysForReplication
                Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource:
                  - !GetAtt DocsKmsKey.Arn
                  - !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/fin-docs-${EnvironmentSuffix}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ###########################################################
  # S3 — Bucket (acts as primary if in PrimaryRegion)
  ###########################################################
  DocsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub 'fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: !Ref RetentionYears
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt DocsKmsKey.Arn
            BucketKeyEnabled: true
      LifecycleConfiguration:
        Rules:
          - Id: !Sub 'transition-glacier-${EnvironmentSuffix}'
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: !Ref GlacierTransitionDays
            ExpirationInDays: !Ref ExpirationDays
            NoncurrentVersionTransitions:
              - StorageClass: GLACIER
                TransitionInDays: !Ref GlacierTransitionDays
            NoncurrentVersionExpiration:
              NoncurrentDays: !Ref ExpirationDays
      # Replication only when this is the primary region deployment
      ReplicationConfiguration: !If
        - IsPrimary
        - Role: !GetAtt ReplicationRole.Arn
          Rules:
            - Id: !Sub 'replicate-all-to-${SecondaryRegion}-${EnvironmentSuffix}'
              Status: Enabled
              Priority: 1
              Filter:
                Prefix: ""
              DeleteMarkerReplication:
                Status: Enabled
              SourceSelectionCriteria:
                SseKmsEncryptedObjects:
                  Status: Enabled
              Destination:
                Bucket: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${SecondaryRegion}-${EnvironmentSuffix}'
                Account: !Sub '${AWS::AccountId}'
                AccessControlTranslation:
                  Owner: Destination
                EncryptionConfiguration:
                  ReplicaKmsKeyID: !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/fin-docs-${EnvironmentSuffix}'
                Metrics:
                  Status: Enabled
                  EventThreshold:
                    Minutes: 15
                ReplicationTime:
                  Status: Enabled
                  Time:
                    Minutes: 15
        - !Ref AWS::NoValue
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DocsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref DocsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Enforce TLS
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
              - !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}/*'
            Condition:
              Bool:
                aws:SecureTransport: false
          # Require SSE-KMS for PutObject
          - Sid: EnforceKmsOnPut
            Effect: Deny
            Principal: '*'
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}/*'
            Condition:
              StringNotEquals:
                s3:x-amz-server-side-encryption: aws:kms
              StringNotLikeIfExists:
                s3:x-amz-server-side-encryption-aws-kms-key-id: !GetAtt DocsKmsKey.Arn
          # Deny access that is NOT from allowed VPC endpoints,
          # but do NOT deny if the caller is the replication role
          - Sid: DenyRequestsNotFromAllowedVpcEndpoints
            Effect: Deny
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
              - s3:ListBucket
              - s3:GetBucketLocation
              - s3:ListBucketMultipartUploads
              - s3:AbortMultipartUpload
            Resource:
              - !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'
              - !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}/*'
            Condition:
              StringNotEquals:
                aws:SourceVpce: !Ref VpcEndpointIds
              StringNotEqualsIfExists:
                aws:PrincipalArn: !GetAtt ReplicationRole.Arn

  ###########################################################
  # Monitoring (optional) — SNS + Alarms + Dashboard
  ###########################################################
  AlarmTopic:
    Type: AWS::SNS::Topic
    Condition: MonitoringEnabled
    Properties:
      TopicName: !Sub 's3-dr-alarms-${EnvironmentSuffix}-${AWS::Region}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AlarmTopicSubscription:
    Type: AWS::SNS::Subscription
    Condition: MonitoringAndEmail
    Properties:
      TopicArn: !Ref AlarmTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  ReplicationLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: MonitoringAndPrimary
    Properties:
      AlarmName: !Sub 's3-replication-latency-${EnvironmentSuffix}-${PrimaryRegion}'
      AlarmDescription: 'Alarm on S3 replication latency (requires Replication Time Control metrics).'
      Namespace: 'AWS/S3'
      MetricName: 'ReplicationLatency'
      Dimensions:
        - Name: BucketName
          Value: !Sub 'fin-docs-${AWS::AccountId}-${PrimaryRegion}-${EnvironmentSuffix}'
        - Name: StorageType
          Value: 'AllStorageTypes'
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      DatapointsToAlarm: 3
      Threshold: 900
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      ActionsEnabled: true
      AlarmActions:
        - !Ref AlarmTopic

  ReplicationFailedAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: MonitoringAndPrimary
    Properties:
      AlarmName: !Sub 's3-replication-failed-${EnvironmentSuffix}-${PrimaryRegion}'
      AlarmDescription: 'Alarm on S3 OperationsFailedReplication (requires RTC metrics).'
      Namespace: 'AWS/S3'
      MetricName: 'OperationsFailedReplication'
      Dimensions:
        - Name: BucketName
          Value: !Sub 'fin-docs-${AWS::AccountId}-${PrimaryRegion}-${EnvironmentSuffix}'
        - Name: StorageType
          Value: 'AllStorageTypes'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      ActionsEnabled: true
      AlarmActions:
        - !Ref AlarmTopic

  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Condition: MonitoringEnabled
    Properties:
      DashboardName: !Sub 's3-dr-${EnvironmentSuffix}-${AWS::Region}'
      DashboardBody: !Sub |
        {
          "widgets": [
            { "type": "text", "x": 0, "y": 0, "width": 24, "height": 2,
              "properties": { "markdown": "# TapStack S3 DR — ${EnvironmentSuffix} (${AWS::Region})" } },
            { "type": "metric", "x": 0, "y": 2, "width": 12, "height": 6,
              "properties": { "region": "${AWS::Region}", "title": "Replication Latency (RTC)",
                "metrics": [
                  [ "AWS/S3", "ReplicationLatency", "BucketName", "fin-docs-${AWS::AccountId}-${PrimaryRegion}-${EnvironmentSuffix}", "StorageType", "AllStorageTypes" ]
                ], "stat": "Average", "period": 300, "view": "timeSeries" } },
            { "type": "metric", "x": 12, "y": 2, "width": 12, "height": 6,
              "properties": { "region": "${AWS::Region}", "title": "Operations Failed (Replication)",
                "metrics": [
                  [ "AWS/S3", "OperationsFailedReplication", "BucketName", "fin-docs-${AWS::AccountId}-${PrimaryRegion}-${EnvironmentSuffix}", "StorageType", "AllStorageTypes", { "stat": "Sum" } ]
                ], "period": 300, "view": "timeSeries" } }
          ]
        }

Outputs:
  PrimaryBucketName:
    Description: Name of the bucket in this deployment region (primary if region == PrimaryRegion).
    Value: !Sub 'fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'

  PrimaryBucketArn:
    Description: ARN of the bucket in this deployment region.
    Value: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}'

  SecondaryBucketName:
    Description: Deterministic name of the secondary-region bucket.
    Value: !Sub 'fin-docs-${AWS::AccountId}-${SecondaryRegion}-${EnvironmentSuffix}'

  SecondaryBucketArn:
    Description: ARN of the secondary-region bucket (deterministic).
    Value: !Sub 'arn:aws:s3:::fin-docs-${AWS::AccountId}-${SecondaryRegion}-${EnvironmentSuffix}'

  ReplicationRoleArn:
    Description: ARN of the S3 replication role.
    Value: !GetAtt ReplicationRole.Arn

  PrimaryKmsKeyArn:
    Description: ARN of the regional CMK used for default bucket encryption.
    Value: !GetAtt DocsKmsKey.Arn

  SecondaryKmsAliasArn:
    Description: ARN of the CMK alias expected in the secondary region (used by CRR).
    Value: !Sub 'arn:aws:kms:${SecondaryRegion}:${AWS::AccountId}:alias/fin-docs-${EnvironmentSuffix}'

  SnsTopicArn:
    Condition: MonitoringEnabled
    Description: SNS topic ARN for monitoring alerts (if enabled).
    Value: !Ref AlarmTopic

  MonitoringDashboardUrl:
    Condition: MonitoringEnabled
    Description: CloudWatch Dashboard URL.
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=s3-dr-${EnvironmentSuffix}-${AWS::Region}'

  DeploymentRegion:
    Description: The AWS region where this stack is deployed.
    Value: !Ref AWS::Region
```