# ideal_response.md

## Summary

A single, production-ready **CloudFormation YAML** file named **TapStack.yml** that **creates all monitoring components from scratch** for a payment processing system. The template is strictly YAML (no JSON blocks or anchors), deployable with AWS CLI v2, and every resource name suffixes `-${EnvironmentSuffix}`. It enforces a **safe regex pattern** on `EnvironmentSuffix` (no hardcoded `AllowedValues`). It follows least-privilege IAM, encryption-at-rest, and CloudWatch-first observability.

## Functional Scope (build everything new)

* CloudWatch Logs (API Gateway, Lambda, application) with **retention** and **KMS encryption**.
* Metric Filters for **TransactionSuccess**, **TransactionFailures**, **ProcessingTimeMs** to `Payments/${EnvironmentSuffix}`.
* Synthetics Canary probing critical endpoints **every 5 minutes**, with artifacts in an encrypted S3 bucket.
* CloudWatch **Anomaly Detectors** on transaction volume and error rate.
* **Contributor Insights** rules to surface top API consumers and error-prone endpoints.
* **X-Ray** sampling rule and tracing enabled for end-to-end visibility.
* Intelligent alerting: single-metric alarms and a **Composite Alarm** that triggers only when both high error rate and high latency occur.
* EventBridge rule to invoke an optional **remediation Lambda** on composite alarm state.
* A multi-panel **CloudWatch Dashboard** visualizing business KPIs, latency percentiles, Lambda signals, DynamoDB throttles, SQS depth, Synthetics health, and helpful Logs Insights queries.
* Cross-account visibility via **OAM Link** (to a provided sink) and alarm actions that can publish to a central SNS topic (provided ARN).

## Parameters & Constraints

* `EnvironmentSuffix` (regex pattern only: lowercase letters, digits, hyphen; length 2–20).
* `CentralMonitoringTopicArn`, `OamSinkArn`, `OAMEnabled`, `RemediationEnabled`, `AlarmEmail`.
* `ApiEndpointUrls` (comma-delimited default), `LogsRetentionDays`, `CanaryScheduleRateMinutes`.
* `KmsKeyAdminsCsv` (comma-separated IAM ARNs), with a condition to include the admins statement only when provided.

## Best-Practice Implementation Details

* **KMS CMK** with root admin; optional additional admins via CSV → split to array; service principals allowed for encrypt/decrypt/datakey; alias includes suffix.
* **Synthetics role trust** includes **both** `synthetics.amazonaws.com` and `lambda.amazonaws.com`.
* **X-Ray sampling rule** has `Version: 1`, conservative `Priority`, and reasonable sampling defaults for scale.
* **Contributor Insights** uses `CloudWatchLogRule` schema with `LogFormat: "JSON"` and **always includes `Filters`** (empty where not needed).
* **List<String> defaults** expressed as comma-delimited strings to keep lints clean.
* **No `${Param}`** outside intrinsics; avoid YAML anchors.
* Tags applied consistently (`Project`, `Environment`, etc.).

## Outputs

* Dashboard name, KMS key ARN, primary log group names (CSV), canary name, composite alarm name, echoed central SNS ARN, and OAM link identifier when enabled.

## Acceptance Checklist

* Passes `cfn-lint` with zero errors.
* Every name includes `-${EnvironmentSuffix}`.
* Dashboard renders metrics math: `SuccessRate = 100 * Success / (Success + Failures)`.
* Composite alarm requires **both** conditions to ALARM.
* Anomaly detectors target the custom metrics emitted by filters.
* OAM link created only when enabled and sink ARN provided; alarm actions publish locally and optionally to central topic.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: TapStack.yml — Advanced observability for payment processing (YAML-only, build-everything-new, linter-safe).

Metadata:
  Notes:
    - Pre-create the central SNS topic and OAM Sink in the central monitoring account; pass ARNs via parameters.
    - Central SNS topic policy must allow cloudwatch.amazonaws.com from this source account to Publish.
    - EnvironmentSuffix is validated via regex only (no AllowedValues). Examples: prod-us, production, qa.

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix appended to all resource names (lowercase/digits/hyphen, 2–20 chars).
    Default: prod-us
    MinLength: 2
    MaxLength: 20
    AllowedPattern: '^[a-z0-9-]{2,20}$'
    ConstraintDescription: Only lowercase letters, digits, and hyphen; length 2–20.
  CentralMonitoringTopicArn:
    Type: String
    Description: ARN of central monitoring SNS Topic (for cross-account alarm actions). Leave blank to skip.
    Default: ''
  OamSinkArn:
    Type: String
    Description: ARN of existing OAM Sink in the central monitoring account. Leave blank to skip OAM linking.
    Default: ''
  OAMEnabled:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'true'
    Description: If true and OamSinkArn provided, create an OAM Link for cross-account observability.
  RemediationEnabled:
    Type: String
    AllowedValues: ['true', 'false']
    Default: 'false'
    Description: If true, create EventBridge rule and remediation Lambda for auto-actions.
  AlarmEmail:
    Type: String
    Description: Optional local email subscription for alarm validation in this account.
    Default: ops@example.com
  ApiEndpointUrls:
    Type: List<String>
    Description: One or more HTTPS endpoints for Synthetics (comma-delimited string as default).
    Default: 'https://example.com/health'
  LogsRetentionDays:
    Type: Number
    Description: Retention for CloudWatch Log Groups (days).
    Default: 30
    MinValue: 7
    MaxValue: 3650
  CanaryScheduleRateMinutes:
    Type: Number
    Description: Canary interval in minutes (1–15).
    Default: 5
    MinValue: 1
    MaxValue: 15
  #KmsKeyAdmins:
  #  Type: List<String>
  #  Description: IAM principal ARNs with admin permissions on the KMS key (in addition to account root).
  #  Default: 'arn:aws:iam::111122223333:role/example-admin'
  KmsKeyAdminsCsv:
    Type: String
    Description: >-
      Comma-separated IAM principal ARNs to grant admin on the CMK (optional).
      Example ARNs:
        arn:aws:iam::111122223333:role/admin,
        arn:aws:iam::444455556666:user/secops
    Default: ''
#  CentralOamNote:
#    Type: String
#    Description: Optional note for operators (no functional use; keeps template stable for lints).
#    Default: ok

Conditions:
  HasCentralTopic: !Not [ !Equals [ !Ref CentralMonitoringTopicArn, '' ] ]
  CreateOAM: !And [ !Equals [ !Ref OAMEnabled, 'true' ], !Not [ !Equals [ !Ref OamSinkArn, '' ] ] ]
  EnableRemediation: !Equals [ !Ref RemediationEnabled, 'true' ]
  HasKmsAdmins: !Not [ !Equals [ !Ref KmsKeyAdminsCsv, '' ] ]


Resources:

  ##############################################
  # KMS Key for logs/synthetics (encryption)   #
  ##############################################
  ObservabilityKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS CMK for observability artifacts/logs - ${AWS::StackName}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          # 1) Full admin for account root (required best practice)
          - Sid: RootAdmin
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

          # 2) Optional additional admins (only created when KmsKeyAdminsCsv has values)
          - !If
            - HasKmsAdmins
            - Sid: KmsAdditionalAdmins
              Effect: Allow
              Principal:
                AWS: !Split [ ",", !Ref KmsKeyAdminsCsv ]
              Action:
                - kms:DescribeKey
                - kms:EnableKeyRotation
                - kms:DisableKey
                - kms:ScheduleKeyDeletion
                - kms:CancelKeyDeletion
                - kms:CreateAlias
                - kms:DeleteAlias
                - kms:UpdateAlias
                - kms:CreateGrant
                - kms:RevokeGrant
                - kms:ListGrants
                - kms:PutKeyPolicy
                - kms:TagResource
                - kms:UntagResource
                - kms:UpdateKeyDescription
              Resource: '*'
            - !Ref 'AWS::NoValue'

          # 3) Usage permissions for AWS services that will encrypt/decrypt
          - Sid: AllowServiceUse
            Effect: Allow
            Principal:
              Service:
                - logs.amazonaws.com
                - lambda.amazonaws.com
                - synthetics.amazonaws.com
                - s3.amazonaws.com
                - xray.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:Decrypt
              - kms:Encrypt
              - kms:DescribeKey
            Resource: '*'

  ObservabilityKmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/payments-observability-${EnvironmentSuffix}'
      TargetKeyId: !Ref ObservabilityKmsKey


  #############################
  # CloudWatch Log Groups     #
  #############################
  ApiGatewayAccessLogs:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/access/payments-${EnvironmentSuffix}'
      KmsKeyId: !GetAtt ObservabilityKmsKey.Arn
      RetentionInDays: !Ref LogsRetentionDays
  LambdaAppLogs:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/payments-app-${EnvironmentSuffix}'
      KmsKeyId: !GetAtt ObservabilityKmsKey.Arn
      RetentionInDays: !Ref LogsRetentionDays
  ApplicationLogs:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/payments/application-${EnvironmentSuffix}'
      KmsKeyId: !GetAtt ObservabilityKmsKey.Arn
      RetentionInDays: !Ref LogsRetentionDays

  ########################################
  # Metric Filters -> Custom KPIs        #
  ########################################
  MfTransactionSuccess:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref ApplicationLogs
      FilterPattern: '{ $.status = "SUCCESS" }'
      MetricTransformations:
        - MetricName: !Sub 'TransactionSuccess-${EnvironmentSuffix}'
          MetricNamespace: !Sub 'Payments/${EnvironmentSuffix}'
          MetricValue: '1'
          Unit: Count
  MfTransactionFailureCode:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref ApplicationLogs
      FilterPattern: '{ $.status = "FAILURE" && $.errorCode = * }'
      MetricTransformations:
        - MetricName: !Sub 'TransactionFailures-${EnvironmentSuffix}'
          MetricNamespace: !Sub 'Payments/${EnvironmentSuffix}'
          MetricValue: '1'
          Unit: Count
  MfProcessingTimeMs:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref ApplicationLogs
      FilterPattern: '{ $.durationMs = * }'
      MetricTransformations:
        - MetricName: !Sub 'ProcessingTimeMs-${EnvironmentSuffix}'
          MetricNamespace: !Sub 'Payments/${EnvironmentSuffix}'
          MetricValue: '$.durationMs'
          Unit: Milliseconds
          DefaultValue: 0

  ########################################
  # Contributor Insights (Top talkers)   #
  ########################################
  ApiAccessContributorInsights:
    Type: AWS::CloudWatch::InsightRule
    Properties:
      RuleName: !Sub 'api-top-consumers-${EnvironmentSuffix}'
      RuleState: ENABLED
      RuleBody: !Sub >
        {
          "Schema": { "Name": "CloudWatchLogRule", "Version": 1 },
          "LogFormat": "JSON",
          "LogGroupNames": ["${ApiGatewayAccessLogs}"],
          "Contribution": {
            "Keys": ["$.apiKeyId", "$.resourcePath"],
            "Filters": []
          },
          "AggregateOn": "Count"
        }

  ErrorProneEndpointsInsights:
    Type: AWS::CloudWatch::InsightRule
    Properties:
      RuleName: !Sub 'api-error-endpoints-${EnvironmentSuffix}'
      RuleState: ENABLED
      RuleBody: !Sub >
        {
          "Schema": { "Name": "CloudWatchLogRule", "Version": 1 },
          "LogFormat": "JSON",
          "LogGroupNames": ["${ApiGatewayAccessLogs}"],
          "Contribution": {
            "Keys": ["$.resourcePath", "$.status"],
            "Filters": [
              { "Match": "$.status", "In": ["500","502","503","504","429","400","401","403","404"] }
            ]
          },
          "AggregateOn": "Count"
        }



  ########################################
  # Anomaly Detection for KPIs           #
  ########################################
  AdTransactionVolume:
    Type: AWS::CloudWatch::AnomalyDetector
    Properties:
      MetricName: !Sub 'TransactionSuccess-${EnvironmentSuffix}'
      Namespace: !Sub 'Payments/${EnvironmentSuffix}'
      Stat: Sum
  AdErrorRate:
    Type: AWS::CloudWatch::AnomalyDetector
    Properties:
      MetricName: !Sub 'TransactionFailures-${EnvironmentSuffix}'
      Namespace: !Sub 'Payments/${EnvironmentSuffix}'
      Stat: Sum

  ########################################
  # Synthetics Canary (5-min default)    #
  ########################################
  CanaryArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'payments-canary-artifacts-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt ObservabilityKmsKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
  CanaryExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'payments-canary-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          # Allow BOTH Synthetics and Lambda to assume this role
          - Effect: Allow
            Principal:
              Service:
                - synthetics.amazonaws.com
                - lambda.amazonaws.com
            Action: sts:AssumeRole
      # You may keep this managed policy for convenience; inline policy below narrows access
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess
      Policies:
        - PolicyName: !Sub 'payments-canary-inline-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: LogsAccess
                Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/cwsyn/*'
              - Sid: ArtifactsS3
                Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt CanaryArtifactsBucket.Arn
                  - !Sub '${CanaryArtifactsBucket.Arn}/*'
              - Sid: UseKms
                Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt ObservabilityKmsKey.Arn
              - Sid: XRay
                Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: '*'

  PaymentsCanary:
    Type: AWS::Synthetics::Canary
    Properties:
      Name: !Sub 'payments-canary-${EnvironmentSuffix}'
      ArtifactS3Location: !Sub 's3://${CanaryArtifactsBucket}'
      ExecutionRoleArn: !GetAtt CanaryExecutionRole.Arn
      RuntimeVersion: syn-nodejs-puppeteer-6.2
      Schedule:
        Expression: !Sub 'rate(${CanaryScheduleRateMinutes} minutes)'
        DurationInSeconds: 0
      StartCanaryAfterCreation: true
      FailureRetentionPeriod: 31
      SuccessRetentionPeriod: 7
      RunConfig:
        ActiveTracing: true
        EnvironmentVariables:
          ENDPOINTS: !Join [',', !Ref ApiEndpointUrls]
      Code:
        Handler: index.handler
        Script: |
          const https = require('https');
          exports.handler = async () => {
            const endpoints = (process.env.ENDPOINTS || '').split(',').filter(Boolean);
            for (const u of endpoints) {
              const ok = await new Promise((resolve, reject) => {
                const req = https.get(u, (res) => {
                  res.on('data', () => {});
                  res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 400));
                });
                req.on('error', reject);
              });
              if (!ok) throw new Error('Endpoint failed: ' + u);
            }
            return { ok: true };
          };

  ########################################
  # X-Ray Sampling (enable tracing)      #
  ########################################
  XraySamplingRule:
    Type: AWS::XRay::SamplingRule
    Properties:
      SamplingRule:
        Version: 1                    # REQUIRED ≥ 1
        RuleName: !Sub 'payments-${EnvironmentSuffix}'
        Priority: 100                 # Leave room for more specific rules (<100) later
        ReservoirSize: 5              # Per-second reservoir (first N requests sampled each second)
        FixedRate: 0.05               # 5% thereafter; tune per traffic/SLA
        ServiceName: '*'              # Match all services; add specifics later if needed
        ServiceType: '*'
        Host: '*'
        HTTPMethod: '*'
        URLPath: '*'
        ResourceARN: '*'
        Attributes: {}


  ########################################
  # Local SNS for alarms                 #
  ########################################
  LocalAlarmsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'payments-alarms-${EnvironmentSuffix}'
      KmsMasterKeyId: !GetAtt ObservabilityKmsKey.Arn
  LocalAlarmsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      Endpoint: !Ref AlarmEmail
      TopicArn: !Ref LocalAlarmsTopic

  ########################################
  # Alarms (single + composite)          #
  ########################################
  AlarmHighFailures:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'high-failures-${EnvironmentSuffix}'
      AlarmDescription: High transaction failures detected
      Namespace: !Sub 'Payments/${EnvironmentSuffix}'
      MetricName: !Sub 'TransactionFailures-${EnvironmentSuffix}'
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 5
      DatapointsToAlarm: 3
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      ActionsEnabled: true
      AlarmActions:
        - !Ref LocalAlarmsTopic
        - !If [ HasCentralTopic, !Ref CentralMonitoringTopicArn, !Ref 'AWS::NoValue' ]
  AlarmHighLatency:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'high-latency-${EnvironmentSuffix}'
      AlarmDescription: High p95 processing latency
      Metrics:
        - Id: m1
          MetricStat:
            Metric:
              Namespace: !Sub 'Payments/${EnvironmentSuffix}'
              MetricName: !Sub 'ProcessingTimeMs-${EnvironmentSuffix}'
            Period: 60
            Stat: p95
      EvaluationPeriods: 5
      DatapointsToAlarm: 3
      Threshold: 1200
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      ActionsEnabled: true
      AlarmActions:
        - !Ref LocalAlarmsTopic
        - !If [ HasCentralTopic, !Ref CentralMonitoringTopicArn, !Ref 'AWS::NoValue' ]
  CompositeErrorAndLatency:
    Type: AWS::CloudWatch::CompositeAlarm
    Properties:
      AlarmName: !Sub 'composite-error-latency-${EnvironmentSuffix}'
      AlarmDescription: Triggers only when BOTH failure rate and latency are high
      AlarmRule: !Sub '(ALARM(${AlarmHighFailures})) AND (ALARM(${AlarmHighLatency}))'
      ActionsEnabled: true
      AlarmActions:
        - !Ref LocalAlarmsTopic
        - !If [ HasCentralTopic, !Ref CentralMonitoringTopicArn, !Ref 'AWS::NoValue' ]

  ########################################
  # Logs Insights Query Definitions      #
  ########################################
  QdTopErrorCodes:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: !Sub 'payments-top-error-codes-${EnvironmentSuffix}'
      QueryString: |
        fields @timestamp, errorCode, message
        | filter status="FAILURE" and ispresent(errorCode)
        | stats count(*) as errors by errorCode
        | sort errors desc
        | limit 50
      LogGroupNames:
        - !Ref ApplicationLogs
  QdSlowestEndpoints:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: !Sub 'payments-slowest-endpoints-${EnvironmentSuffix}'
      QueryString: |
        fields @timestamp, @message, path, durationMs
        | filter ispresent(durationMs)
        | stats pct(durationMs, 50) as p50, pct(durationMs, 90) as p90, pct(durationMs, 99) as p99 by path
        | sort p99 desc
        | limit 30
      LogGroupNames:
        - !Ref ApplicationLogs
  QdColdStarts:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: !Sub 'payments-cold-starts-${EnvironmentSuffix}'
      QueryString: |
        fields @timestamp, @message, coldStart
        | filter coldStart = true
        | stats count(*) as cold_starts by bin(5m)
      LogGroupNames:
        - !Ref LambdaAppLogs

  ########################################
  # (Optional) EventBridge Remediation   #
  ########################################
  RemediationRole:
    Type: AWS::IAM::Role
    Condition: EnableRemediation
    Properties:
      RoleName: !Sub 'payments-remediation-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub 'payments-remediation-inline-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - cloudwatch:DescribeAlarms
                  - cloudwatch:GetMetricData
                Resource: '*'
              - Effect: Allow
                Action: sns:Publish
                Resource:
                  - !Ref LocalAlarmsTopic
                  - !If [ HasCentralTopic, !Ref CentralMonitoringTopicArn, !Ref 'AWS::NoValue' ]
  RemediationFunction:
    Type: AWS::Lambda::Function
    Condition: EnableRemediation
    Properties:
      FunctionName: !Sub 'payments-remediation-${EnvironmentSuffix}'
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt RemediationRole.Arn
      TracingConfig:
        Mode: Active
      KmsKeyArn: !GetAtt ObservabilityKmsKey.Arn
      Timeout: 30
      Environment:
        Variables:
          LOCAL_TOPIC_ARN: !Ref LocalAlarmsTopic
          CENTRAL_TOPIC_ARN: !If [ HasCentralTopic, !Ref CentralMonitoringTopicArn, '' ]
      Code:
        ZipFile: |
          import os, json, boto3
          sns = boto3.client('sns')
          def handler(event, context):
              msg = "[AUTO-REMEDIATION] Composite alarm triggered.\nEvent: " + json.dumps(event)
              if os.environ.get('LOCAL_TOPIC_ARN'):
                  sns.publish(TopicArn=os.environ['LOCAL_TOPIC_ARN'], Message=msg, Subject="Auto-Remediation Notice")
              if os.environ.get('CENTRAL_TOPIC_ARN'):
                  sns.publish(TopicArn=os.environ['CENTRAL_TOPIC_ARN'], Message=msg, Subject="Auto-Remediation Notice")
              return {"ok": True}
  RemediationPermission:
    Type: AWS::Lambda::Permission
    Condition: EnableRemediation
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref RemediationFunction
      Principal: events.amazonaws.com
  RemediationRule:
    Type: AWS::Events::Rule
    Condition: EnableRemediation
    Properties:
      Name: !Sub 'payments-remediation-rule-${EnvironmentSuffix}'
      Description: Invoke remediation when composite alarm enters ALARM
      State: ENABLED
      EventPattern:
        source: ['aws.cloudwatch']
        detail-type: ['CloudWatch Alarm State Change']
        detail:
          alarmName:
            - !Ref CompositeErrorAndLatency
          state:
            value: ['ALARM']
      Targets:
        - Id: RemediationTarget
          Arn: !GetAtt RemediationFunction.Arn

  ########################################
  # OAM Link (Cross-account visibility)  #
  ########################################
  OamLink:
    Type: AWS::Oam::Link
    Condition: CreateOAM
    Properties:
      Label: !Sub 'payments-observability-link-${EnvironmentSuffix}'
      ResourceTypes:
        - AWS::CloudWatch::Metric
        - AWS::XRay::Trace
        - AWS::Logs::LogGroup
      SinkIdentifier: !Ref OamSinkArn

  ########################################
  # CloudWatch Dashboard (multi-panel)   #
  ########################################
  ObservabilityDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'payments-observability-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0, "y": 0, "width": 12, "height": 6,
              "properties": {
                "title": "Business KPIs — Success/Failures/SuccessRate",
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                  [ "Payments/${EnvironmentSuffix}", "TransactionSuccess-${EnvironmentSuffix}", { "id": "su", "stat": "Sum" } ],
                  [ ".", "TransactionFailures-${EnvironmentSuffix}", { "id": "fa", "stat": "Sum" } ],
                  [ { "expression": "100 * su/(su+fa)", "label": "SuccessRate %", "id": "sr", "region": "${AWS::Region}" } ]
                ],
                "region": "${AWS::Region}",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 0, "width": 12, "height": 6,
              "properties": {
                "title": "Processing Latency (p50/p90/p99)",
                "view": "timeSeries",
                "metrics": [
                  [ "Payments/${EnvironmentSuffix}", "ProcessingTimeMs-${EnvironmentSuffix}", { "stat": "p50", "label": "p50" } ],
                  [ ".", "ProcessingTimeMs-${EnvironmentSuffix}", { "stat": "p90", "label": "p90" } ],
                  [ ".", "ProcessingTimeMs-${EnvironmentSuffix}", { "stat": "p99", "label": "p99" } ]
                ],
                "region": "${AWS::Region}",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 0, "y": 6, "width": 12, "height": 6,
              "properties": {
                "title": "Lambda Invocations / Errors / Throttles",
                "view": "timeSeries",
                "metrics": [
                  [ "AWS/Lambda", "Invocations", "FunctionName", "payments-app-${EnvironmentSuffix}", { "stat": "Sum" } ],
                  [ ".", "Errors", "FunctionName", "payments-app-${EnvironmentSuffix}", { "stat": "Sum" } ],
                  [ ".", "Throttles", "FunctionName", "payments-app-${EnvironmentSuffix}", { "stat": "Sum" } ]
                ],
                "region": "${AWS::Region}",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 6, "width": 12, "height": 6,
              "properties": {
                "title": "DynamoDB Throttles",
                "view": "timeSeries",
                "metrics": [
                  [ "AWS/DynamoDB", "ReadThrottleEvents", "TableName", "payments-${EnvironmentSuffix}", { "stat": "Sum" } ],
                  [ ".", "WriteThrottleEvents", "TableName", "payments-${EnvironmentSuffix}", { "stat": "Sum" } ]
                ],
                "region": "${AWS::Region}",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 0, "y": 12, "width": 12, "height": 6,
              "properties": {
                "title": "SQS Queue Depth",
                "view": "timeSeries",
                "metrics": [
                  [ "AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "payments-${EnvironmentSuffix}", { "stat": "Average" } ]
                ],
                "region": "${AWS::Region}",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 12, "width": 12, "height": 6,
              "properties": {
                "title": "Synthetics — Success & Duration",
                "view": "timeSeries",
                "metrics": [
                  [ "CloudWatchSynthetics", "SuccessPercent", "CanaryName", "payments-canary-${EnvironmentSuffix}", { "stat": "Average" } ],
                  [ ".", "Duration", "CanaryName", "payments-canary-${EnvironmentSuffix}", { "stat": "p95", "label": "p95" } ]
                ],
                "region": "${AWS::Region}",
                "period": 300
              }
            }
          ]
        }

  ########################################
  # Demo Lambda (tracing/log emission)   #
  ########################################
  DemoAppRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'payments-app-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: !Sub 'payments-app-kms-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:Encrypt
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt ObservabilityKmsKey.Arn
  DemoAppFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'payments-app-${EnvironmentSuffix}'
      Runtime: nodejs20.x
      Handler: index.handler
      Role: !GetAtt DemoAppRole.Arn
      TracingConfig:
        Mode: Active
      Timeout: 10
      Environment:
        Variables:
          LOG_GROUP: !Ref LambdaAppLogs
      Code:
        ZipFile: |
          exports.handler = async () => {
            const ok = Math.random() > 0.05;
            const status = ok ? "SUCCESS" : "FAILURE";
            const durationMs = Math.floor(Math.random() * 1500);
            const errorCode = ok ? null : "PAYMENT_TIMEOUT";
            console.log(JSON.stringify({ status, errorCode, durationMs, path: "/charge" }));
            if (!ok) throw new Error(errorCode || "fail");
            return { statusCode: 200, body: JSON.stringify({ ok: true }) };
          };

Outputs:
  DashboardName:
    Description: CloudWatch Dashboard name
    Value: !Ref ObservabilityDashboard
  KmsKeyArn:
    Description: KMS Key ARN
    Value: !GetAtt ObservabilityKmsKey.Arn
  LogGroupNames:
    Description: Primary log groups (CSV)
    Value: !Join [ ',', [ !Ref ApplicationLogs, !Ref LambdaAppLogs, !Ref ApiGatewayAccessLogs ] ]
  CanaryName:
    Description: Synthetics canary name
    Value: !Ref PaymentsCanary
  CompositeAlarmName:
    Description: Composite alarm name
    Value: !Ref CompositeErrorAndLatency
  CentralAlarmActionArn:
    Description: Echoes configured central SNS ARN (if any)
    Value: !If [ HasCentralTopic, !Ref CentralMonitoringTopicArn, 'N/A' ]
  OAMLinkArn:
    Condition: CreateOAM
    Description: OAM Link sink identifier (as provided)
    Value: !Ref OamSinkArn
```