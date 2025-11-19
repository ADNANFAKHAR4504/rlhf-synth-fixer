# ideal_response.md

## Context

A financial services company requires a production-grade monitoring and observability stack for a distributed payment processing system. The solution must be deployable as a brand-new CloudFormation stack, fully self-contained, and aligned with compliance, reliability, and cost-control practices. Names must be consistently suffixed with an environment identifier and the template must avoid brittle hardcoded environment lists by enforcing a safe naming regex instead.

## Functional scope (build everything new)

* Logging with centralized CloudWatch Log Groups retaining data for at least 90 days for applications, VPC flow logs, and Lambda functions.
* Derivation of custom CloudWatch metrics via metric filters for transaction count, success count, error count, and latency values parsed from JSON logs.
* Dashboards that auto-refresh and surface real-time signals, including single-value widgets for volume and time-series charts for latency and error trends. Cross-region visibility is included through multi-region metric panels.
* Alarms with metric math for a composite service health score, alongside individual alarms for error rate, success rate, and p95 latency. Composite alarms aggregate critical conditions. Alarm evaluation should detect breaches within one minute.
* Multi-channel alerting via SNS topics for Critical, Warning, and Info severities, with email and SMS subscriptions.
* Automated remediation using EventBridge rules that trigger a Lambda function whenever specific alarm states transition to ALARM.
* CloudWatch Logs Insights saved queries for common investigations, including top errors, p95 latency by component, and failures by IP.
* Thresholds stored in Systems Manager Parameter Store for auditable configuration, while the alarms themselves use in-template parameters to avoid undeclared external dependencies.
* Namespacing and tagging that reflect environment, ownership, data classification, and compliance context.
* Strict environment suffix validation through a regex pattern instead of hardcoded allowed values.

## Non-goals

* No reliance on pre-existing resources. The stack must create all supporting monitoring components itself.
* No third-party log analysis tooling; CloudWatch Logs Insights must be used.
* No hardcoded region lists that would restrict deployment; examples may reference specific regions in dashboard widgets but should not make the template region-inflexible.

## Constraints and compliance

* Metrics and logs retained for at least 90 days.
* Critical alerts evaluate and notify within 60 seconds under normal CloudWatch behavior.
* Cross-region aggregation for dashboard views is implemented with multi-region widgets.
* Cost controls applied through minimal, targeted metric filters and single-period alarms to limit evaluation overhead.

## Deliverable

* A single CloudFormation YAML file that:

  * Declares all parameters with sensible defaults and descriptions.
  * Uses a safe naming regex for the environment suffix.
  * Creates Log Groups, Metric Filters, SNS Topics and Subscriptions, CloudWatch Alarms, a Composite Alarm, an Events rule, a remediation Lambda role and function, Dashboards, and Logs Insights saved queries.
  * Stores threshold values in SSM Parameter Store for compliance traceability.
  * Exposes clear outputs for primary resource identifiers.
  * Passes static validation and deploys cleanly without requiring pre-seeded SSM parameters.

## Best-practice highlights

* Predictable, consistent naming with environment suffix applied to all names.
* Minimal and readable metric math expressions using basic functions to avoid unsupported constructs.
* Treat missing data as breaching where appropriate to avoid silent failures.
* Single-line composite alarm rule with no leading or trailing whitespace.
* Lambda execution role limited to basic execution plus narrow example actions for remediation.
* Dashboard uses live data with 60-second periods; titles and axis labels are explicit.
* Tags include environment, owner, compliance, cost center, and data classification.

## Acceptance criteria

* Successful stack creation without manual pre-work.
* Alarms reach ALARM when logs reflect failure conditions and clear automatically upon recovery.
* SNS subscriptions receive notifications for each severity path after subscription confirmation.
* EventBridge invokes the remediation Lambda on alarm transitions to ALARM; function logs contain diagnostic context.
* Logs Insights saved queries are available and scoped to the app Log Group.
* Outputs include core identifiers for quick navigation and integrations.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack.yml — Monitoring & Observability stack for distributed payments.
  CORE: CloudWatch, EventBridge. OPTIONAL: Contributor Insights.
  Builds all-new resources; no external dependencies. Names are suffixed with EnvironmentSuffix.
  EnvironmentSuffix is validated via a safe regex (no hard-coded allowed values).
  All log groups retain 90 days. Critical alarms target ≤60s detection.

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Lowercase environment suffix (e.g., prod-us); used in all resource names.
    AllowedPattern: '^[a-z0-9-]{3,30}$'
    ConstraintDescription: Must be 3–30 chars of lowercase letters, digits, and hyphens.
  MetricNamespace:
    Type: String
    Default: Payments/Observability
    Description: Custom CloudWatch metric namespace for derived metrics.
  PrimaryEmailCritical:
    Type: String
    Default: noreply-critical@example.com
    Description: Email for CRITICAL alerts (must be confirmed in SNS).
  PrimaryEmailWarning:
    Type: String
    Default: noreply-warning@example.com
    Description: Email for WARNING alerts (must be confirmed in SNS).
  PrimaryEmailInfo:
    Type: String
    Default: noreply-info@example.com
    Description: Email for INFO alerts (must be confirmed in SNS).
  PrimarySmsCritical:
    Type: String
    Default: "+15555550100"
    Description: E.164 phone for CRITICAL alerts (e.g., +15551234567).
  PrimarySmsWarning:
    Type: String
    Default: "+15555550101"
    Description: E.164 phone for WARNING alerts.
  PrimarySmsInfo:
    Type: String
    Default: "+15555550102"
    Description: E.164 phone for INFO alerts.

  # Local numeric thresholds (used directly by alarms). These values are also written into SSM by this stack.
  ThresholdErrorRateCritical:
    Type: Number
    Default: 5
    Description: Error rate (%) critical threshold.
  ThresholdErrorRateWarning:
    Type: Number
    Default: 2
    Description: Error rate (%) warning threshold.
  ThresholdLatencyP95Critical:
    Type: Number
    Default: 1500
    Description: p95 latency (ms) critical threshold.
  ThresholdLatencyP95Warning:
    Type: Number
    Default: 800
    Description: p95 latency (ms) warning threshold.
  ThresholdSuccessRateCritical:
    Type: Number
    Default: 95
    Description: Success rate (%) critical threshold (alarm when <=).
  ThresholdSuccessRateWarning:
    Type: Number
    Default: 98
    Description: Success rate (%) warning threshold (alarm when <=).

Resources:
  #######################################################
  # SSM PARAMETERS (store thresholds for compliance/auditing)
  #######################################################
  SsmErrorRateCritical:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/payments/${EnvironmentSuffix}/thresholds/errorRate/critical"
      Type: String
      Value: !Ref ThresholdErrorRateCritical
      Description: !Sub "Critical error-rate (%) threshold for ${EnvironmentSuffix}"
      Tags:
        Environment: !Ref EnvironmentSuffix
        Owner: Platform
        Severity: Critical

  SsmErrorRateWarning:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/payments/${EnvironmentSuffix}/thresholds/errorRate/warning"
      Type: String
      Value: !Ref ThresholdErrorRateWarning
      Description: !Sub "Warning error-rate (%) threshold for ${EnvironmentSuffix}"
      Tags:
        Environment: !Ref EnvironmentSuffix
        Owner: Platform
        Severity: Warning

  SsmLatencyP95Critical:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/payments/${EnvironmentSuffix}/thresholds/latencyP95/critical"
      Type: String
      Value: !Ref ThresholdLatencyP95Critical
      Description: !Sub "Critical p95 latency (ms) threshold for ${EnvironmentSuffix}"
      Tags:
        Environment: !Ref EnvironmentSuffix
        Owner: Platform
        Severity: Critical

  SsmLatencyP95Warning:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/payments/${EnvironmentSuffix}/thresholds/latencyP95/warning"
      Type: String
      Value: !Ref ThresholdLatencyP95Warning
      Description: !Sub "Warning p95 latency (ms) threshold for ${EnvironmentSuffix}"
      Tags:
        Environment: !Ref EnvironmentSuffix
        Owner: Platform
        Severity: Warning

  SsmSuccessRateCritical:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/payments/${EnvironmentSuffix}/thresholds/successRate/critical"
      Type: String
      Value: !Ref ThresholdSuccessRateCritical
      Description: !Sub "Critical success-rate (%) threshold for ${EnvironmentSuffix}"
      Tags:
        Environment: !Ref EnvironmentSuffix
        Owner: Platform
        Severity: Critical

  SsmSuccessRateWarning:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/payments/${EnvironmentSuffix}/thresholds/successRate/warning"
      Type: String
      Value: !Ref ThresholdSuccessRateWarning
      Description: !Sub "Warning success-rate (%) threshold for ${EnvironmentSuffix}"
      Tags:
        Environment: !Ref EnvironmentSuffix
        Owner: Platform
        Severity: Warning

  #######################################################
  # LOG GROUPS (90-day retention)
  #######################################################
  AppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/payments/app/${EnvironmentSuffix}"
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: Observability
        - Key: Owner
          Value: Platform
        - Key: Compliance
          Value: Financial
        - Key: DataClassification
          Value: Confidential

  VpcFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/payments/vpcflow/${EnvironmentSuffix}"
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: Observability
        - Key: Owner
          Value: Platform
        - Key: Compliance
          Value: Financial
        - Key: DataClassification
          Value: Confidential

  FunctionsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/payments/functions/${EnvironmentSuffix}"
      RetentionInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: CostCenter
          Value: Observability
        - Key: Owner
          Value: Platform
        - Key: Compliance
          Value: Financial
        - Key: DataClassification
          Value: Confidential

  #######################################################
  # METRIC FILTERS (derive custom metrics from JSON logs)
  #######################################################
  MfTxCount:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref AppLogGroup
      FilterPattern: '{ $.transaction_id = * }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: !Ref MetricNamespace
          MetricName: !Sub "TransactionsCount-${EnvironmentSuffix}"
          DefaultValue: 0

  MfTxSuccess:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref AppLogGroup
      FilterPattern: '{ $.status = "SUCCESS" }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: !Ref MetricNamespace
          MetricName: !Sub "TransactionsSuccess-${EnvironmentSuffix}"
          DefaultValue: 0

  MfTxErrors:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref AppLogGroup
      FilterPattern: '{ $.status = "ERROR" }'
      MetricTransformations:
        - MetricValue: "1"
          MetricNamespace: !Ref MetricNamespace
          MetricName: !Sub "TransactionsErrors-${EnvironmentSuffix}"
          DefaultValue: 0

  MfLatencyMs:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref AppLogGroup
      FilterPattern: '{ $.latency_ms = * }'
      MetricTransformations:
        - MetricValue: "$.latency_ms"
          MetricNamespace: !Ref MetricNamespace
          MetricName: !Sub "LatencyMs-${EnvironmentSuffix}"
          Unit: Milliseconds
          DefaultValue: 0

  #######################################################
  # SNS TOPICS & SUBSCRIPTIONS (Critical/Warning/Info)
  #######################################################
  TopicCritical:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "Alerts-Critical-${EnvironmentSuffix}"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Severity
          Value: Critical
        - Key: Owner
          Value: Platform

  TopicWarning:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "Alerts-Warning-${EnvironmentSuffix}"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Severity
          Value: Warning
        - Key: Owner
          Value: Platform

  TopicInfo:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "Alerts-Info-${EnvironmentSuffix}"
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Severity
          Value: Info
        - Key: Owner
          Value: Platform

  SubCriticalEmail:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref TopicCritical
      Protocol: email
      Endpoint: !Ref PrimaryEmailCritical

  SubCriticalSms:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref TopicCritical
      Protocol: sms
      Endpoint: !Ref PrimarySmsCritical

  SubWarningEmail:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref TopicWarning
      Protocol: email
      Endpoint: !Ref PrimaryEmailWarning

  SubWarningSms:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref TopicWarning
      Protocol: sms
      Endpoint: !Ref PrimarySmsWarning

  SubInfoEmail:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref TopicInfo
      Protocol: email
      Endpoint: !Ref PrimaryEmailInfo

  SubInfoSms:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref TopicInfo
      Protocol: sms
      Endpoint: !Ref PrimarySmsInfo

  #######################################################
  # CLOUDWATCH ALARMS (≤60s detection) & METRIC MATH
  #######################################################
  AlarmErrorRateCritical:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "ErrorRateCritical-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Error rate (%) critical for ${EnvironmentSuffix}"
      ComparisonOperator: GreaterThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: !Ref ThresholdErrorRateCritical
      Metrics:
        - Id: errors
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsErrors-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: total
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsCount-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: erate
          Expression: "IF(total>0,(errors/total)*100,0)"
          Label: "ErrorRatePercent"
          ReturnData: true
      AlarmActions:
        - !Ref TopicCritical
      OKActions:
        - !Ref TopicInfo

  AlarmErrorRateWarning:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "ErrorRateWarning-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Error rate (%) warning for ${EnvironmentSuffix}"
      ComparisonOperator: GreaterThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: !Ref ThresholdErrorRateWarning
      Metrics:
        - Id: errors
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsErrors-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: total
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsCount-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: erate
          Expression: "IF(total>0,(errors/total)*100,0)"
          Label: "ErrorRatePercent"
          ReturnData: true
      AlarmActions:
        - !Ref TopicWarning
      OKActions:
        - !Ref TopicInfo

  AlarmLatencyP95Critical:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "LatencyP95Critical-${EnvironmentSuffix}"
      AlarmDescription: !Sub "p95 latency (ms) critical for ${EnvironmentSuffix}"
      ComparisonOperator: GreaterThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: !Ref ThresholdLatencyP95Critical
      Metrics:
        - Id: latency
          ReturnData: true
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "LatencyMs-${EnvironmentSuffix}"
            Period: 60
            Stat: p95
      AlarmActions:
        - !Ref TopicCritical
      OKActions:
        - !Ref TopicInfo

  AlarmLatencyP95Warning:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "LatencyP95Warning-${EnvironmentSuffix}"
      AlarmDescription: !Sub "p95 latency (ms) warning for ${EnvironmentSuffix}"
      ComparisonOperator: GreaterThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: !Ref ThresholdLatencyP95Warning
      Metrics:
        - Id: latency
          ReturnData: true
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "LatencyMs-${EnvironmentSuffix}"
            Period: 60
            Stat: p95
      AlarmActions:
        - !Ref TopicWarning
      OKActions:
        - !Ref TopicInfo

  AlarmSuccessRateCritical:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "SuccessRateCritical-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Success rate (%) critical for ${EnvironmentSuffix}"
      ComparisonOperator: LessThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: !Ref ThresholdSuccessRateCritical
      Metrics:
        - Id: success
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsSuccess-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: total
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsCount-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: srate
          Expression: "IF(total>0,(success/total)*100,100)"
          Label: "SuccessRatePercent"
          ReturnData: true
      AlarmActions:
        - !Ref TopicCritical
      OKActions:
        - !Ref TopicInfo

  AlarmSuccessRateWarning:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "SuccessRateWarning-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Success rate (%) warning for ${EnvironmentSuffix}"
      ComparisonOperator: LessThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: !Ref ThresholdSuccessRateWarning
      Metrics:
        - Id: success
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsSuccess-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: total
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsCount-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: srate
          Expression: "IF(total>0,(success/total)*100,100)"
          Label: "SuccessRatePercent"
          ReturnData: true
      AlarmActions:
        - !Ref TopicWarning
      OKActions:
        - !Ref TopicInfo

  #######################################################
  # SERVICE HEALTH SCORE (metric math alarm) — EXACTLY ONE ReturnData: true
  #######################################################
  AlarmServiceHealthCritical:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "ServiceHealthCritical-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Composite service health score alarm for ${EnvironmentSuffix} (lower is worse)."
      ComparisonOperator: LessThanOrEqualToThreshold
      EvaluationPeriods: 1
      DatapointsToAlarm: 1
      TreatMissingData: breaching
      Threshold: 70
      Metrics:
        - Id: errors
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsErrors-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: total
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsCount-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: erate
          Expression: "IF(total>0,(errors/total)*100,0)"
          ReturnData: false
        - Id: success
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "TransactionsSuccess-${EnvironmentSuffix}"
            Period: 60
            Stat: Sum
        - Id: srate
          Expression: "IF(total>0,(success/total)*100,100)"
          ReturnData: false
        - Id: p95
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: !Ref MetricNamespace
              MetricName: !Sub "LatencyMs-${EnvironmentSuffix}"
            Period: 60
            Stat: p95
        - Id: p95n
          Expression: "100 - (100 * (1 / (1 + (p95 / 1000))))"
          Label: "NormalizedLatencyPenalty(0..100)"
          ReturnData: false
        - Id: health
          Expression: "100 - (0.5*erate + 0.3*p95n + 0.2*(100 - srate))"
          Label: "ServiceHealthScore(0..100)"
          ReturnData: true
      AlarmActions:
        - !Ref TopicCritical
      OKActions:
        - !Ref TopicInfo

  #######################################################
  # COMPOSITE ALARM (combines member alarm states) — single-line AlarmRule
  #######################################################
  CompositeCritical:
    Type: AWS::CloudWatch::CompositeAlarm
    Properties:
      AlarmName: !Sub "CompositeCritical-${EnvironmentSuffix}"
      AlarmDescription: !Sub "Composite: any critical condition for ${EnvironmentSuffix}"
      AlarmRule: !Sub "ALARM(\"${AlarmErrorRateCritical.Arn}\") OR ALARM(\"${AlarmLatencyP95Critical.Arn}\") OR ALARM(\"${AlarmSuccessRateCritical.Arn}\") OR ALARM(\"${AlarmServiceHealthCritical.Arn}\")"
      AlarmActions:
        - !Ref TopicCritical
      OKActions:
        - !Ref TopicInfo

  #######################################################
  # EVENTBRIDGE RULES → LAMBDA (automated remediation)
  #######################################################
  RemediatorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "RemediatorRole-${EnvironmentSuffix}"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Path: /
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: !Sub "RemediatorPolicy-${EnvironmentSuffix}"
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: ExampleActions
                Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:RebootInstances
                  - ssm:SendCommand
                Resource: "*"

  RemediatorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "Remediate-Alarm-${EnvironmentSuffix}"
      Runtime: python3.12
      Handler: index.handler
      Role: !GetAtt RemediatorRole.Arn
      Timeout: 30
      Code:
        ZipFile: |
          import json, time
          def handler(event, context):
              detail = event.get("detail", {})
              alarm_name = detail.get("alarmName", "unknown")
              reason = detail.get("state", {}).get("reason", "")
              print(f"[Remediator] Alarm: {alarm_name} :: {reason}")
              return {"ok": True, "alarm": alarm_name, "ts": int(time.time())}

  AlarmEventsRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "AlarmEventsToLambda-${EnvironmentSuffix}"
      Description: !Sub "On CloudWatch Alarm state change, invoke remediation lambda (${EnvironmentSuffix})."
      EventPattern:
        source:
          - aws.cloudwatch
        detail-type:
          - CloudWatch Alarm State Change
        detail:
          state:
            value:
              - ALARM
          alarmName:
            - !Sub "ErrorRateCritical-${EnvironmentSuffix}"
            - !Sub "LatencyP95Critical-${EnvironmentSuffix}"
            - !Sub "SuccessRateCritical-${EnvironmentSuffix}"
            - !Sub "ServiceHealthCritical-${EnvironmentSuffix}"
            - !Sub "CompositeCritical-${EnvironmentSuffix}"
      Targets:
        - Id: Remediator
          Arn: !GetAtt RemediatorFunction.Arn
          InputTransformer:
            InputPathsMap:
              alarm: $.detail.alarmName
              reason: $.detail.state.reason
            InputTemplate: !Sub |
              {
                "environment": "${EnvironmentSuffix}",
                "detail": {
                  "alarmName": <alarm>,
                  "reason": <reason>
                }
              }

  RemediatorPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref RemediatorFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt AlarmEventsRule.Arn

  #######################################################
  # CLOUDWATCH LOGS INSIGHTS — SAVED QUERIES
  #######################################################
  QueryTopErrors:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: !Sub "TopErrorsLast15m-${EnvironmentSuffix}"
      QueryString: |
        fields @timestamp, @message, status, source_ip
        | filter status = "ERROR"
        | stats count() as errors by @message
        | sort errors desc
        | limit 20
      LogGroupNames:
        - !Ref AppLogGroup

  QueryP95ByComponent:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: !Sub "P95LatencyByComponent1h-${EnvironmentSuffix}"
      QueryString: |
        fields @timestamp, component, latency_ms
        | filter ispresent(latency_ms)
        | stats pct(latency_ms,95) as p95 by component
        | sort p95 desc
      LogGroupNames:
        - !Ref AppLogGroup

  QueryFailuresByIP:
    Type: AWS::Logs::QueryDefinition
    Properties:
      Name: !Sub "FailuresByIP1h-${EnvironmentSuffix}"
      QueryString: |
        fields @timestamp, source_ip, status
        | filter status = "ERROR"
        | stats count() as errors by source_ip
        | sort errors desc
        | limit 20
      LogGroupNames:
        - !Ref AppLogGroup

  #######################################################
  # DASHBOARD (liveData, cross-region examples)
  #######################################################
  OperationsDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub "Payments-Operations-${EnvironmentSuffix}"
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0, "y": 0, "width": 12, "height": 6,
              "properties": {
                "title": "Latency p95 (ms) — multi-region",
                "liveData": true,
                "region": "us-east-1",
                "view": "timeSeries",
                "stat": "p95",
                "period": 60,
                "metrics": [
                  [ "${MetricNamespace}", "LatencyMs-${EnvironmentSuffix}", { "stat": "p95", "label": "us-east-1", "region": "us-east-1" } ],
                  [ ".", "LatencyMs-${EnvironmentSuffix}", { "stat": "p95", "label": "us-west-2", "region": "us-west-2" } ],
                  [ ".", "LatencyMs-${EnvironmentSuffix}", { "stat": "p95", "label": "eu-west-1", "region": "eu-west-1" } ]
                ],
                "yAxis": { "left": { "label": "ms" } }
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 0, "width": 12, "height": 6,
              "properties": {
                "title": "Current Transaction Volume (1m)",
                "liveData": true,
                "region": "us-east-1",
                "view": "singleValue",
                "stat": "Sum",
                "period": 60,
                "metrics": [
                  [ "${MetricNamespace}", "TransactionsCount-${EnvironmentSuffix}", { "stat": "Sum" } ]
                ]
              }
            },
            {
              "type": "metric",
              "x": 0, "y": 6, "width": 12, "height": 6,
              "properties": {
                "title": "Error Count (1m)",
                "liveData": true,
                "region": "us-east-1",
                "view": "timeSeries",
                "stat": "Sum",
                "period": 60,
                "metrics": [
                  [ "${MetricNamespace}", "TransactionsErrors-${EnvironmentSuffix}", { "stat": "Sum" } ]
                ]
              }
            },
            {
              "type": "metric",
              "x": 12, "y": 6, "width": 12, "height": 6,
              "properties": {
                "title": "Success Rate (%)",
                "liveData": true,
                "region": "us-east-1",
                "view": "timeSeries",
                "stat": "Average",
                "period": 60,
                "metrics": [
                  [ { "expression": "IF(m1>0,(m2/m1)*100,100)", "label": "SuccessRate%", "id": "e1", "region": "us-east-1" } ],
                  [ "${MetricNamespace}", "TransactionsCount-${EnvironmentSuffix}", { "id": "m1", "stat": "Sum", "visible": false } ],
                  [ "${MetricNamespace}", "TransactionsSuccess-${EnvironmentSuffix}", { "id": "m2", "stat": "Sum", "visible": false } ]
                ],
                "yAxis": { "left": { "label": "%" } }
              }
            },
            {
              "type": "metric",
              "x": 0, "y": 12, "width": 24, "height": 6,
              "properties": {
                "title": "Service Health Score (0..100)",
                "liveData": true,
                "region": "us-east-1",
                "view": "timeSeries",
                "period": 60,
                "metrics": [
                  [ { "expression": "100 - (0.5*IF(m1>0,(m3/m1)*100,0) + 0.3*(100 - (100*(1/(1+(p95/1000))))) + 0.2*(100 - IF(m1>0,(m2/m1)*100,100)))", "label": "Health", "id": "health" } ],
                  [ "${MetricNamespace}", "TransactionsCount-${EnvironmentSuffix}", { "id": "m1", "stat": "Sum", "visible": false } ],
                  [ "${MetricNamespace}", "TransactionsSuccess-${EnvironmentSuffix}", { "id": "m2", "stat": "Sum", "visible": false } ],
                  [ "${MetricNamespace}", "TransactionsErrors-${EnvironmentSuffix}", { "id": "m3", "stat": "Sum", "visible": false } ],
                  [ "${MetricNamespace}", "LatencyMs-${EnvironmentSuffix}", { "id": "p95", "stat": "p95", "visible": false } ]
                ],
                "yAxis": { "left": { "label": "score" } }
              }
            }
          ]
        }

Outputs:
  EnvironmentSuffix:
    Description: Environment suffix used in names.
    Value: !Ref EnvironmentSuffix
  AppLogGroupName:
    Description: Application log group.
    Value: !Ref AppLogGroup
  VpcFlowLogGroupName:
    Description: VPC flow log group.
    Value: !Ref VpcFlowLogGroup
  FunctionsLogGroupName:
    Description: Functions log group.
    Value: !Ref FunctionsLogGroup
  TopicCriticalArn:
    Description: SNS topic ARN for critical alerts.
    Value: !Ref TopicCritical
  TopicWarningArn:
    Description: SNS topic ARN for warning alerts.
    Value: !Ref TopicWarning
  TopicInfoArn:
    Description: SNS topic ARN for info alerts.
    Value: !Ref TopicInfo
  AlarmNames:
    Description: Key alarm names.
    Value: !Join
      - ","
      - - !Ref AlarmErrorRateCritical
        - !Ref AlarmLatencyP95Critical
        - !Ref AlarmSuccessRateCritical
        - !Ref AlarmServiceHealthCritical
        - !Ref CompositeCritical
  DashboardName:
    Description: CloudWatch dashboard name.
    Value: !Ref OperationsDashboard
  DashboardUrl:
    Description: Console URL to the dashboard.
    Value: !Sub "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${OperationsDashboard}"
  QueryDefinitions:
    Description: Saved Logs Insights queries.
    Value: !Join
      - ","
      - - !Ref QueryTopErrors
        - !Ref QueryP95ByComponent
        - !Ref QueryFailuresByIP
```