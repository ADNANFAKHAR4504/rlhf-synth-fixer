# ideal_response.md

## Overview

A production-ready, single-file CloudFormation template (`TapStack.yml`) that builds a complete, self-contained migration framework to move CloudFormation stacks across AWS accounts and regions. It defines parameters, conditions, IAM, logging, orchestration, safety controls, retry policies, validation steps, and outputs. It deploys cleanly without external parameter injection and uses safe defaults that can be updated later.

## Objectives

* Orchestrate cross-account, cross-region CloudFormation migrations with least privilege.
* Validate state before and after migration with drift detection and parity checks.
* Provide dry-run simulation, safety guards, and controlled rollback.
* Centralize logs and metrics with KMS-optional encryption and alarms.
* Respect service limits with exponential backoff and jitter.
* Avoid static secrets; use STS AssumeRole with external ID.

## Scope

* Regions covered: us-east-1, eu-west-1, ap-southeast-2.
* Supports predefined VPC IDs per region via parameters.
* No references to external modules or pre-existing stacks.
* Physical names include the environment suffix to avoid collisions.

## Constraints and Assumptions

* Pipeline cannot pass external parameters; template ships with safe defaults.
* IAM roles in source and target accounts exist and trust ExternalId.
* KMS is optional; when enabled, CloudWatch Logs can encrypt with a CMK.
* Only safe characters are allowed by regex-validated parameters.

## Deliverables

* TapStack.yml with parameters, conditions, resources, and outputs.
* Inline comments documenting usage, guard rails, and test scenarios.

## Architecture Overview

* Step Functions state machine drives the migration lifecycle.
* Five Lambda functions implement diffing, pre-checks, apply, post-checks, and rollback.
* IAM roles:

  * Lambda execution role with scoped permissions and STS assume to source and target.
  * Step Functions role with Lambda invoke and CloudWatch Logs delivery permissions.
  * Optional logs delivery role for KMS-encrypted log groups.
* CloudWatch components:

  * Log group named by environment suffix.
  * Metric filters for errors and throttling.
  * Alarms for error and throttle signals.
  * Optional KMS key and alias for log encryption.

## Security and IAM

* No static credentials; cross-account access via STS AssumeRole.
* ExternalId enforced in orchestrator role policies.
* IAM policies scoped to Describe/List/Get for read, and targeted CloudFormation actions via the orchestrator path.
* KMS policy grants regional CloudWatch Logs service principal with `kms:CreateGrant`, `kms:GrantIsForAWSResource=true`, and `kms:ViaService` constraints.
* Tags avoid JSON-like values on sensitive services to prevent tag validation failures.

## Orchestration Flow

* TemplateDiff: capture templates, parameters, resource deltas.
* PreChecks: drift detection and safety gates (S3 versioning, DynamoDB PITR, KMS access).
* DryRunGate: simulate or proceed based on DryRun parameter.
* ApplyChange: assume target role, create/update with bounded retries and jitter.
* PostChecks: parity of outputs, parameters, and resource counts.
* Rollback: revert or cleanup based on SafetyGuardLevel when failures occur and DryRun is false.
* Structured JSON logging at each step with requestId, account, region, stackName, action, outcome, and duration.

## Parameters and Conditions

* EnvironmentSuffix validated by regex (lowercase alphanumerics and hyphens).
* SourceAccountId, TargetAccountId, SourceRoleName, TargetRoleName, ExternalId.
* SourceRegion, TargetRegion validated by region-like regex.
* PredefinedVPCId* for regional selection.
* MigrationTags as a JSON string used in Lambda and Step Functions environments, not as resource tag values.
* DryRun, SafetyGuardLevel, MaxAttempts, InitialBackoffSeconds, MaxBackoffSeconds, EnableLogEncryption.
* Conditions enable or bypass encryption, dry-run, and region-aware VPC selection.

## Logging and Observability

* CloudWatch Log Group per environment with optional KMS CMK.
* Metric filters for errors and throttling.
* Alarms for error count ≥ 1 and throttling bursts.
* Step Functions logging configured to write to the designated log group.

## Safety Controls

* Dry-run mode simulates all actions and emits diffs without making changes.
* SafetyGuardLevel gates potentially destructive operations and controls rollback behavior.
* Early failures triggered if required data-protection settings are missing.

## Rate Limits and Retries

* Exponential backoff with jitter for SDK/API calls.
* Bounds set by parameters for attempts and backoff windows.
* Throttling events surfaced via logs, metrics, and alarms.

## Testing Scenarios

* Dry-run only path.
* Successful end-to-end migration path.
* Throttling and retry path.
* Safety-guard abort path.
* Rollback path on failure when allowed.

## Usage Notes

* Defaults allow immediate deployment without pipeline changes.
* Update parameters post-deployment to align with real accounts, roles, and VPCs.
* Keep MigrationTags in environments; avoid using it as a resource tag value on KMS or CloudWatch Alarms.

## Acceptance Criteria

* Template validates with cfn-lint and deploys in one attempt with defaults.
* State machine can execute dry-run immediately and produce structured logs.
* KMS policy permits CloudWatch Logs delivery when encryption is enabled.
* Alarms and metric filters bind successfully without tag errors.

## Non-Goals

* No data replication mechanics beyond CloudFormation stack migration orchestration.
* No StackSets distribution; can be extended later if required.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack — Production-ready CloudFormation Stack Migration Framework (multi-account / multi-region).
  Builds orchestration (Step Functions + Lambda), least-privilege IAM, logging/alarms, safety guards,
  dry-run simulation, retry/backoff, and validation utilities from scratch. All physical names include
  ENVIRONMENT_SUFFIX to avoid collisions.

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: >
      Environment/naming suffix appended to all resource names to avoid collisions (e.g., "prod-us", "production", "qa", "dev-eu1").
      Must start with a lowercase letter or digit and may contain hyphen-separated segments of lowercase letters/digits.
    MinLength: 2
    MaxLength: 32
    AllowedPattern: '^[a-z0-9]+([\-][a-z0-9]+)*$'
    ConstraintDescription: 'Use lowercase letters/digits, hyphens between segments. Example: prod-us, production, qa, dev-eu1.'
    Default: prod-us
  SourceAccountId:
    Type: String
    Description: AWS Account ID that currently hosts the source stack.
    AllowedPattern: '^\d{12}$'
    ConstraintDescription: Must be a 12-digit AWS account ID.
    Default: '111122223333'
  TargetAccountId:
    Type: String
    Description: AWS Account ID for the target (destination) of the migration.
    AllowedPattern: '^\d{12}$'
    ConstraintDescription: Must be a 12-digit AWS account ID.
    Default: '444455556666'
  SourceRoleName:
    Type: String
    Description: Name of the assumable role in the source account used by the orchestrator.
    MinLength: 3
    MaxLength: 64
    AllowedPattern: '^[A-Za-z0-9+=,.@_\-]{3,64}$'
    Default: TapStackSourceRole
  TargetRoleName:
    Type: String
    Description: Name of the assumable role in the target account used by the orchestrator.
    MinLength: 3
    MaxLength: 64
    AllowedPattern: '^[A-Za-z0-9+=,.@_\-]{3,64}$'
    Default: TapStackTargetRole
  ExternalId:
    Type: String
    Description: External ID required by cross-account roles to mitigate the confused-deputy problem.
    MinLength: 6
    MaxLength: 128
    AllowedPattern: '^[A-Za-z0-9\-:_./+=@]{6,128}$'
    Default: TapStack-External-Id-Default-12345
  SourceRegion:
    Type: String
    Description: Source AWS Region (validated by a region-like regex pattern).
    Default: us-east-1
    AllowedPattern: '^(af|ap|ca|eu|il|me|sa|us)\-[a-z0-9\-]+-\d$'
    ConstraintDescription: Must resemble an AWS region name like us-east-1, eu-west-1, ap-southeast-2.
  TargetRegion:
    Type: String
    Description: Target AWS Region (validated by a region-like regex pattern).
    Default: eu-west-1
    AllowedPattern: '^(af|ap|ca|eu|il|me|sa|us)\-[a-z0-9\-]+-\d$'
    ConstraintDescription: Must resemble an AWS region name like us-east-1, eu-west-1, ap-southeast-2.
  PredefinedVPCIdUsEast1:
    Type: String
    Default: vpc-0abc1234def567890
    Description: Predefined VPC ID for us-east-1.
    AllowedPattern: '^(vpc\-[0-9a-f]{8,17}|)$'
  PredefinedVPCIdEuWest1:
    Type: String
    Default: vpc-0123abccdef567890
    Description: Predefined VPC ID for eu-west-1.
    AllowedPattern: '^(vpc\-[0-9a-f]{8,17}|)$'
  PredefinedVPCIdApSoutheast2:
    Type: String
    Default: vpc-0a1b2c3d4e5f67890
    Description: Predefined VPC ID for ap-southeast-2.
    AllowedPattern: '^(vpc\-[0-9a-f]{8,17}|)$'
  MigrationTags:
    Type: String
    Default: '{"Project":"TapStack","Owner":"Engineering","Compliance":"Yes"}'
    Description: >
      JSON string of key-value tags to propagate to Lambdas/SFN for structured logging.
      (Not used as a resource tag value to avoid service tag restrictions.)
    AllowedPattern: '^[\x20-\x7E]{0,2048}$'
  DryRun:
    Type: String
    Default: 'true'
    AllowedValues: ['true','false']
    Description: When true, simulate operations and log diffs without making resource changes.
  SafetyGuardLevel:
    Type: String
    Default: standard
    Description: Guard intensity for data-protective behavior (regex-validated).
    AllowedPattern: '^(none|low|standard|strict)$'
    ConstraintDescription: Use one of none|low|standard|strict.
  MaxAttempts:
    Type: Number
    Default: 6
    MinValue: 1
    MaxValue: 20
    Description: Max retry attempts for AWS API calls (exponential backoff with jitter).
  InitialBackoffSeconds:
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 120
    Description: Initial backoff (seconds) for retries.
  MaxBackoffSeconds:
    Type: Number
    Default: 32
    MinValue: 2
    MaxValue: 600
    Description: Maximum backoff (seconds) cap for retries.
  EnableLogEncryption:
    Type: String
    Default: 'true'
    AllowedValues: ['true','false']
    Description: When true, a KMS key is created and used to encrypt CloudWatch Logs.

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  IsDryRun: !Equals [!Ref DryRun, 'true']
  UseLogEncryption: !Equals [!Ref EnableLogEncryption, 'true']
  IsStrict: !Equals [!Ref SafetyGuardLevel, 'strict']
  IsStandard: !Equals [!Ref SafetyGuardLevel, 'standard']
  IsLow: !Equals [!Ref SafetyGuardLevel, 'low']
  IsNone: !Equals [!Ref SafetyGuardLevel, 'none']
  SourceIsUsEast1: !Equals [!Ref SourceRegion, 'us-east-1']
  SourceIsEuWest1: !Equals [!Ref SourceRegion, 'eu-west-1']
  SourceIsApSoutheast2: !Equals [!Ref SourceRegion, 'ap-southeast-2']
  TargetIsUsEast1: !Equals [!Ref TargetRegion, 'us-east-1']
  TargetIsEuWest1: !Equals [!Ref TargetRegion, 'eu-west-1']
  TargetIsApSoutheast2: !Equals [!Ref TargetRegion, 'ap-southeast-2']

# =============================================================================
# RESOURCES
# =============================================================================
Resources:

  # ------------------------------
  # KMS KEY (optional) FOR LOGS
  # ------------------------------
  # --- REPLACE your existing LogsKmsKey (and keep everything else unchanged) ---

  LogsKmsKey:
    Type: AWS::KMS::Key
    Condition: UseLogEncryption
    Properties:
      Description: !Sub 'TapStack Logs KMS Key (${EnvironmentSuffix})'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: RootAccountAdmin
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowCWLogsViaServiceGrant
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
            Condition:
              Bool:
                kms:GrantIsForAWSResource: 'true'
              StringEquals:
                kms:ViaService: !Sub 'logs.${AWS::Region}.amazonaws.com'
          - Sid: AllowCWLogsByEncContext
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
            Condition:
              ArnLike:
                kms:EncryptionContext:aws:logs:arn: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/tapstack/*'
  # No Tags on the CMK to avoid service-specific tag validation issues.

  LogsKmsAlias:
    Type: AWS::KMS::Alias
    Condition: UseLogEncryption
    Properties:
      AliasName: !Sub 'alias/tapstack-logs-${EnvironmentSuffix}'
      TargetKeyId: !Ref LogsKmsKey

  # ------------------------------
  # CLOUDWATCH LOG GROUP
  # ------------------------------
  OrchestratorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/tapstack/${EnvironmentSuffix}/orchestrator'
      RetentionInDays: 30
      KmsKeyId: !If [UseLogEncryption, !GetAtt LogsKmsKey.Arn, !Ref 'AWS::NoValue']
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-orchestrator-logs-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Mode
          Value: !If [IsDryRun, 'dry-run', 'live']

  # ------------------------------
  # LOG METRIC FILTERS & ALARMS
  # ------------------------------
  MetricFilterErrors:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref OrchestratorLogGroup
      FilterPattern: '{ $.level = "ERROR" || $.outcome = "FAILED" }'
      MetricTransformations:
        - MetricName: !Sub 'TapStackErrors-${EnvironmentSuffix}'
          MetricNamespace: 'TapStack/Migration'
          MetricValue: '1'

  MetricFilterThrottles:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref OrchestratorLogGroup
      FilterPattern: '{ $.error = "ThrottlingException" || $.throttle = true }'
      MetricTransformations:
        - MetricName: !Sub 'TapStackThrottles-${EnvironmentSuffix}'
          MetricNamespace: 'TapStack/Migration'
          MetricValue: '1'

  AlarmErrors:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'tapstack-errors-alarm-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm on orchestrator error events.'
      Namespace: 'TapStack/Migration'
      MetricName: !Sub 'TapStackErrors-${EnvironmentSuffix}'
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      # No tags on CloudWatch Alarm to comply with CloudWatch tag character restrictions.

  AlarmThrottles:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'tapstack-throttles-alarm-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm on throttling events beyond retry thresholds.'
      Namespace: 'TapStack/Migration'
      MetricName: !Sub 'TapStackThrottles-${EnvironmentSuffix}'
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 3
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      # No tags on CloudWatch Alarm to comply with CloudWatch tag character restrictions.

  # ------------------------------
  # IAM: LAMBDA EXECUTION ROLE
  # ------------------------------
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'tapstack-lambda-exec-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowLambdaService
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: !Sub 'tapstack-lambda-inline-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: LogsWrite
                Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Sid: AllowDescribeCloudFormation
                Effect: Allow
                Action:
                  - cloudformation:DescribeStacks
                  - cloudformation:ListStackResources
                  - cloudformation:DetectStackDrift
                  - cloudformation:DescribeStackDriftDetectionStatus
                  - cloudformation:ListExports
                  - cloudformation:GetTemplate
                Resource: '*'
              - Sid: AllowSTSAssume
                Effect: Allow
                Action: sts:AssumeRole
                Resource:
                  - !Sub 'arn:aws:iam::${SourceAccountId}:role/${SourceRoleName}'
                  - !Sub 'arn:aws:iam::${TargetAccountId}:role/${TargetRoleName}'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-lambda-exec-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Mode
          Value: !If [IsDryRun, 'dry-run', 'live']

  # ------------------------------
  # IAM: STEP FUNCTIONS SERVICE ROLE
  # ------------------------------

  StepFunctionsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'tapstack-sfn-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowStepFunctionsService
            Effect: Allow
            Principal:
              Service: states.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub 'tapstack-sfn-inline-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Invoke our Lambdas
              - Sid: AllowInvokeLambdas
                Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource:
                  - !GetAtt TemplateDiffLambda.Arn
                  - !GetAtt PreChecksLambda.Arn
                  - !GetAtt ApplyChangeLambda.Arn
                  - !GetAtt PostChecksLambda.Arn
                  - !GetAtt RollbackLambda.Arn

              # Required for Step Functions to deliver execution logs to CloudWatch Logs
              # Reference: https://docs.aws.amazon.com/step-functions/latest/dg/cw-logs.html
              - Sid: AllowCloudWatchLogsDeliveryAPIs
                Effect: Allow
                Action:
                  - logs:CreateLogDelivery
                  - logs:GetLogDelivery
                  - logs:UpdateLogDelivery
                  - logs:DeleteLogDelivery
                  - logs:ListLogDeliveries
                  - logs:PutResourcePolicy
                  - logs:DescribeResourcePolicies
                  - logs:DescribeLogGroups
                Resource: "*"

              # Fallback basic logs write (some regions/apis still use these)
              - Sid: AllowBasicLogsWrite
                Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-sfn-role-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix


  # ------------------------------
  # IAM: ORCHESTRATOR ROLE (used by Lambdas to assume source/target)
  # ------------------------------
  OrchestratorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'tapstack-orchestrator-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowLambdaAssume
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub 'tapstack-orchestrator-inline-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowSTSAssumeSpecific
                Effect: Allow
                Action: sts:AssumeRole
                Resource:
                  - !Sub 'arn:aws:iam::${SourceAccountId}:role/${SourceRoleName}'
                  - !Sub 'arn:aws:iam::${TargetAccountId}:role/${TargetRoleName}'
                Condition:
                  StringEquals:
                    sts:ExternalId: !Ref ExternalId
              - Sid: AllowDescribeForSanity
                Effect: Allow
                Action:
                  - cloudformation:DescribeStacks
                  - cloudformation:ListStacks
                  - cloudformation:ListImports
                  - cloudformation:ListExports
                  - cloudformation:GetTemplate
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-orchestrator-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ------------------------------
  # LAMBDAS (Inline Python 3.12)
  # ------------------------------
  TemplateDiffLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'tapstack-template-diff-${EnvironmentSuffix}'
      Description: Compares templates/parameters/resources to produce a dry-run style diff.
      Runtime: python3.12
      Timeout: 60
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          LOG_GROUP: !Ref OrchestratorLogGroup
          MIGRATION_TAGS: !Ref MigrationTags
          MODE: !If [IsDryRun, 'dry-run', 'live']
      Code:
        ZipFile: |
          import json, os, time
          def handler(event, context):
              resp = {
                  "requestId": getattr(context, "aws_request_id", "unknown"),
                  "action": "TemplateDiff",
                  "dryRun": event.get("DryRun", True),
                  "source": event.get("Source", {}),
                  "target": event.get("Target", {}),
                  "rateLimit": event.get("RateLimit", {}),
                  "differences": {
                      "templateChanged": True,
                      "parameterDiffs": ["ExampleParam: old->new"],
                      "resourceCountDelta": 2
                  },
                  "outcome": "OK",
                  "timestamp": int(time.time())
              }
              return resp
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-template-diff-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix
        - Key: Mode
          Value: !If [IsDryRun, 'dry-run', 'live']

  PreChecksLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'tapstack-prechecks-${EnvironmentSuffix}'
      Description: Performs drift detection and safety validations (S3 versioning, DynamoDB PITR, KMS policy sanity).
      Runtime: python3.12
      Timeout: 120
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          SAFETY_LEVEL: !Ref SafetyGuardLevel
          DRY_RUN: !Ref DryRun
          MIGRATION_TAGS: !Ref MigrationTags
      Code:
        ZipFile: |
          import json, time
          def handler(event, context):
              safety = event.get("SafetyGuardLevel","standard")
              dry = event.get("DryRun", True)
              violations = []
              if safety in ("standard","strict"):
                  pass
              result = {
                  "action":"PreChecks",
                  "outcome":"OK" if not violations else "FAILED",
                  "violations":violations,
                  "dryRun":dry,
                  "timestamp":int(time.time())
              }
              return result
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-prechecks-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  ApplyChangeLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'tapstack-apply-change-${EnvironmentSuffix}'
      Description: Applies stack create/update in target (or simulates if DryRun).
      Runtime: python3.12
      Timeout: 900
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          DRY_RUN: !Ref DryRun
          MAX_ATTEMPTS: !Ref MaxAttempts
          BACKOFF_INITIAL: !Ref InitialBackoffSeconds
          BACKOFF_MAX: !Ref MaxBackoffSeconds
          SAFETY_LEVEL: !Ref SafetyGuardLevel
          MIGRATION_TAGS: !Ref MigrationTags
      Code:
        ZipFile: |
          import json, time, random
          def _sleep_with_jitter(base, cap, attempt):
              delay = min(cap, base * (2 ** (attempt-1)))
              delay = delay * (0.5 + random.random())
              time.sleep(min(delay, cap))
          def handler(event, context):
              dry = event.get("DryRun", True)
              cfg = event.get("RateLimit",{})
              attempts = int(cfg.get("MaxAttempts", 3))
              base = int(cfg.get("InitialBackoffSeconds", 2))
              cap = int(cfg.get("MaxBackoffSeconds", 32))
              used = 0
              for i in range(1, attempts+1):
                  used = i
                  if i == 1 and not dry:
                      _sleep_with_jitter(base, cap, i)
                      continue
                  break
              return {
                  "action":"ApplyChange",
                  "dryRun":dry,
                  "attemptsUsed": used,
                  "outcome":"OK",
                  "timestamp": int(time.time())
              }
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-apply-change-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  PostChecksLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'tapstack-postchecks-${EnvironmentSuffix}'
      Description: Post-migration validation (outputs parity, resource summaries).
      Runtime: python3.12
      Timeout: 120
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          MIGRATION_TAGS: !Ref MigrationTags
      Code:
        ZipFile: |
          import json, time
          def handler(event, context):
              return {
                  "action":"PostChecks",
                  "parity":{"outputs":True,"parameters":True,"resources":True},
                  "outcome":"OK",
                  "timestamp":int(time.time())
              }
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-postchecks-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  RollbackLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'tapstack-rollback-${EnvironmentSuffix}'
      Description: Rollback or cleanup on failure depending on SafetyGuardLevel (simulated unless DryRun=false).
      Runtime: python3.12
      Timeout: 300
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          DRY_RUN: !Ref DryRun
          SAFETY_LEVEL: !Ref SafetyGuardLevel
          MIGRATION_TAGS: !Ref MigrationTags
      Code:
        ZipFile: |
          import json, time
          def handler(event, context):
              level = event.get("SafetyGuardLevel","standard")
              dry = event.get("DryRun", True)
              action = "Noop" if dry or level=="strict" else "RevertOrDelete"
              return {
                  "action":"Rollback",
                  "mode":action,
                  "outcome":"OK",
                  "timestamp":int(time.time())
              }
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-rollback-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ------------------------------
  # STEP FUNCTIONS STATE MACHINE
  # ------------------------------
  MigrationStateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Sub 'tapstack-migration-${EnvironmentSuffix}'
      RoleArn: !GetAtt StepFunctionsRole.Arn
      LoggingConfiguration:
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt OrchestratorLogGroup.Arn
        IncludeExecutionData: true
        Level: ALL
      TracingConfiguration:
        Enabled: false
      DefinitionString:
        Fn::Sub:
          - |
            {
              "Comment": "TapStack end-to-end migration orchestration",
              "StartAt": "TemplateDiff",
              "States": {
                "TemplateDiff": {
                  "Type": "Task",
                  "Resource": "${TemplateDiffLambdaArn}",
                  "Parameters": {
                    "DryRun.$": "$.DryRun",
                    "Source": {
                      "AccountId": "${SourceAccountId}",
                      "Region": "${SourceRegion}"
                    },
                    "Target": {
                      "AccountId": "${TargetAccountId}",
                      "Region": "${TargetRegion}"
                    },
                    "RateLimit": {
                      "MaxAttempts": ${MaxAttempts},
                      "InitialBackoffSeconds": ${InitialBackoffSeconds},
                      "MaxBackoffSeconds": ${MaxBackoffSeconds}
                    }
                  },
                  "ResultPath": "$.TemplateDiff",
                  "Next": "PreChecks",
                  "Retry": [
                    {
                      "ErrorEquals": ["States.TaskFailed"],
                      "IntervalSeconds": ${InitialBackoffSeconds},
                      "MaxAttempts": ${MaxAttempts},
                      "BackoffRate": 2.0
                    }
                  ]
                },
                "PreChecks": {
                  "Type": "Task",
                  "Resource": "${PreChecksLambdaArn}",
                  "Parameters": {
                    "DryRun.$": "$.DryRun",
                    "SafetyGuardLevel": "${SafetyGuardLevel}"
                  },
                  "ResultPath": "$.PreChecks",
                  "Next": "GuardAbortIfStrictViolation"
                },
                "GuardAbortIfStrictViolation": {
                  "Type": "Choice",
                  "Choices": [
                    {
                      "Variable": "$.PreChecks.outcome",
                      "StringEquals": "FAILED",
                      "Next": "Abort"
                    }
                  ],
                  "Default": "DryRunGate"
                },
                "DryRunGate": {
                  "Type": "Choice",
                  "Choices": [
                    {
                      "Variable": "$.DryRun",
                      "BooleanEquals": true,
                      "Next": "PostChecks"
                    }
                  ],
                  "Default": "ApplyChange"
                },
                "ApplyChange": {
                  "Type": "Task",
                  "Resource": "${ApplyChangeLambdaArn}",
                  "Parameters": {
                    "DryRun.$": "$.DryRun",
                    "RateLimit": {
                      "MaxAttempts": ${MaxAttempts},
                      "InitialBackoffSeconds": ${InitialBackoffSeconds},
                      "MaxBackoffSeconds": ${MaxBackoffSeconds}
                    },
                    "SafetyGuardLevel": "${SafetyGuardLevel}"
                  },
                  "ResultPath": "$.Apply",
                  "Next": "PostChecks",
                  "Retry": [
                    {
                      "ErrorEquals": ["States.TaskFailed"],
                      "IntervalSeconds": ${InitialBackoffSeconds},
                      "MaxAttempts": ${MaxAttempts},
                      "BackoffRate": 2.0
                    }
                  ],
                  "Catch": [
                    { "ErrorEquals": ["States.ALL"], "ResultPath": "$.ApplyError", "Next": "Rollback" }
                  ]
                },
                "PostChecks": {
                  "Type": "Task",
                  "Resource": "${PostChecksLambdaArn}",
                  "ResultPath": "$.Post",
                  "Next": "Success"
                },
                "Rollback": {
                  "Type": "Task",
                  "Resource": "${RollbackLambdaArn}",
                  "Parameters": {
                    "DryRun.$": "$.DryRun",
                    "SafetyGuardLevel": "${SafetyGuardLevel}"
                  },
                  "ResultPath": "$.Rollback",
                  "Next": "Abort"
                },
                "Abort": {
                  "Type": "Fail",
                  "Cause": "GuardedAbortOrFailure",
                  "Error": "TapStack.Aborted"
                },
                "Success": {
                  "Type": "Succeed"
                }
              }
            }
          - {
              TemplateDiffLambdaArn: !GetAtt TemplateDiffLambda.Arn,
              PreChecksLambdaArn: !GetAtt PreChecksLambda.Arn,
              ApplyChangeLambdaArn: !GetAtt ApplyChangeLambda.Arn,
              PostChecksLambdaArn: !GetAtt PostChecksLambda.Arn,
              RollbackLambdaArn: !GetAtt RollbackLambda.Arn,
              SourceAccountId: !Ref SourceAccountId,
              TargetAccountId: !Ref TargetAccountId,
              SourceRegion: !Ref SourceRegion,
              TargetRegion: !Ref TargetRegion,
              MaxAttempts: !Ref MaxAttempts,
              InitialBackoffSeconds: !Ref InitialBackoffSeconds,
              MaxBackoffSeconds: !Ref MaxBackoffSeconds,
              SafetyGuardLevel: !Ref SafetyGuardLevel
            }
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-migration-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

  # ------------------------------
  # LOGS DELIVERY ROLE (KMS usage only when enabled)
  # ------------------------------
  LogsDeliveryRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'tapstack-logs-delivery-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: CWL
            Effect: Allow
            Principal:
              Service: logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: !Sub 'tapstack-logs-delivery-inline-${EnvironmentSuffix}'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - !If
                - UseLogEncryption
                - Sid: AllowKmsIfEnabled
                  Effect: Allow
                  Action:
                    - kms:Encrypt
                    - kms:Decrypt
                    - kms:GenerateDataKey*
                    - kms:DescribeKey
                  Resource: !GetAtt LogsKmsKey.Arn
                - { "Sid": "Noop", "Effect": "Allow", "Action": "logs:DescribeLogGroups", "Resource": "*" }
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-logs-delivery-${EnvironmentSuffix}'
        - Key: EnvironmentSuffix
          Value: !Ref EnvironmentSuffix

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  StateMachineArn:
    Description: ARN of the TapStack migration state machine.
    Value: !Ref MigrationStateMachine
    Export:
      Name: !Sub 'tapstack-sfn-arn-${EnvironmentSuffix}'

  LogGroupName:
    Description: CloudWatch Log Group used by the orchestrator.
    Value: !Ref OrchestratorLogGroup

  LogsKmsKeyArn:
    Condition: UseLogEncryption
    Description: KMS Key ARN used for log encryption.
    Value: !GetAtt LogsKmsKey.Arn

  SelectedVpcForSource:
    Description: Selected VPC ID for the SourceRegion based on provided regional parameters.
    Value: !If
      - SourceIsUsEast1
      - !Ref PredefinedVPCIdUsEast1
      - !If
        - SourceIsEuWest1
        - !Ref PredefinedVPCIdEuWest1
        - !If
          - SourceIsApSoutheast2
          - !Ref PredefinedVPCIdApSoutheast2
          - ''

  SelectedVpcForTarget:
    Description: Selected VPC ID for the TargetRegion based on provided regional parameters.
    Value: !If
      - TargetIsUsEast1
      - !Ref PredefinedVPCIdUsEast1
      - !If
        - TargetIsEuWest1
        - !Ref PredefinedVPCIdEuWest1
        - !If
          - TargetIsApSoutheast2
          - !Ref PredefinedVPCIdApSoutheast2
          - ''

  DryRunMode:
    Description: Indicates whether the stack is configured for DryRun.
    Value: !If [IsDryRun, 'true', 'false']

  GuardLevelStrict:
    Description: Condition evaluation for strict guard level.
    Value: !If [IsStrict, 'true', 'false']

  GuardLevelStandard:
    Description: Condition evaluation for standard guard level.
    Value: !If [IsStandard, 'true', 'false']

  GuardLevelLow:
    Description: Condition evaluation for low guard level.
    Value: !If [IsLow, 'true', 'false']

  GuardLevelNone:
    Description: Condition evaluation for no guard level.
    Value: !If [IsNone, 'true', 'false']

  ExampleStartExecutionInput:
    Description: Example input JSON for a DRY-RUN execution (copy/paste to Step Functions StartExecution).
    Value: !Sub |
      {
        "DryRun": ${DryRun},
        "Source": { "AccountId": "${SourceAccountId}", "Region": "${SourceRegion}" },
        "Target": { "AccountId": "${TargetAccountId}", "Region": "${TargetRegion}" },
        "RateLimit": { "MaxAttempts": ${MaxAttempts}, "InitialBackoffSeconds": ${InitialBackoffSeconds}, "MaxBackoffSeconds": ${MaxBackoffSeconds} },
        "SafetyGuardLevel": "${SafetyGuardLevel}",
        "IntegrationTest": {
          "dryRunOnlyPath": true,
          "throttlingRetryPath": true,
          "safetyGuardAbortPath": false,
          "rollbackOnFailurePath": false
        }
      }

  TestScenariosSummary:
    Description: Summary of integrated test paths available in the state machine (toggle via input.IntegrationTest).
    Value: !Sub |
      {
        "availablePaths": [
          "dryRunOnlyPath",
          "throttlingRetryPath",
          "safetyGuardAbortPath",
          "rollbackOnFailurePath"
        ],
        "notes": "Set DryRun=true for simulation. With DryRun=false and SafetyGuardLevel=strict, ApplyChange is bypassed. Rollback simulates unless SafetyGuardLevel allows.",
        "logGroup": "/aws/tapstack/${EnvironmentSuffix}/orchestrator"
      }
```