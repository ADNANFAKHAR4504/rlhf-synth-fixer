# PROMPT

I need a single CloudFormation template named TapStack.yml that builds a brand-new monitoring and observability stack for a distributed payments system. Treat this as production-ready and cost-aware from day one. Do not reference any pre-existing infrastructure. Everything this stack needs must be created by this template.

Core services must be CloudWatch and EventBridge. SNS is required for alerting. Lambda is allowed only if you use it as an automated remediation target invoked by EventBridge.

## What the stack must deliver

### Mandatory features to implement
Build all five items below.

- CloudWatch Log Groups with 90-day retention for application logs, VPC flow logs, and Lambda logs
- CloudWatch Metric Filters that parse JSON logs and publish custom metrics for transaction volume, success, errors, and latency
- A CloudWatch dashboard with line graphs for trends and number widgets for current volume
- CloudWatch alarms including a composite alarm and metric math for a health score
- SNS topics with email and SMS subscriptions per severity level

### One optional enhancement
Implement exactly one optional enhancement and make it conditional.

Choose Synthetics canary as the optional enhancement and only create it when SyntheticCanaryUrl is not empty.

## Deployment and cross-region visibility
- Primary deployment region is us-east-1
- The dashboard must show cross-region visibility for us-west-2 and eu-west-1 by using per-metric region settings in dashboard widgets where CloudWatch supports it
- If CloudWatch alarms do not support cross-region metric math in CloudFormation for a specific case, document that limitation in a short template comment and still provide cross-region visibility in the dashboard

## Compliance and operational requirements
- Metrics and logs retained for at least 90 days
- Critical alerts must fire within 60 seconds of threshold breach
- Use CloudWatch Logs Insights for investigation, not third-party tools
- Metric math must compute a composite health indicator that combines latency, error rate, and success rate with weights
- Dashboard should be set up for fast refresh during business hours using live data behavior where supported
  - If CloudWatch does not support true business-hours scheduling in dashboards, add a short comment stating the limitation and still enable the closest supported live behavior on widgets
- Cost control matters
  - Consolidate metric filters where reasonable
  - Avoid duplicate metrics
  - Use a namespace and dimensions that keep cardinality low
  - Do not create unbounded, high-cardinality dimensions

## Naming and tagging rules
- Every resource logical name and any visible Name or Description fields must end with the EnvironmentSuffix value as a suffix
  - Example style: Payments-Operations-EnvironmentSuffix
- Apply the same tags to every taggable resource
  - Environment set to EnvironmentSuffix
  - CostCenter set to Observability
  - Owner set to Platform
  - Compliance set to Financial
  - DataClassification set to Confidential

## Parameters to include in TapStack.yml
Declare all parameters below.

- EnvironmentSuffix as a String with AllowedPattern set to ^[a-z0-9-]{3,30}$
- PrimaryEmailCritical, PrimaryEmailWarning, PrimaryEmailInfo
- PrimarySmsCritical, PrimarySmsWarning, PrimarySmsInfo
- MetricNamespace as a String with default Payments/Observability

SSM parameter name inputs for thresholds
- SSMErrorRateCriticalParam, SSMErrorRateWarningParam
- SSMLatencyP95CriticalParam, SSMLatencyP95WarningParam
- SSMSuccessRateCriticalParam, SSMSuccessRateWarningParam

Optional feature toggles
- SyntheticCanaryUrl as a String default empty
- MetricStreamBucketName as a String default empty and do not build metric streams in this version

Important note about thresholds
- Do not hard-code numeric thresholds in alarms or other resources
- Create the SSM parameters in this stack and populate their initial values from CloudFormation input parameters you add for each threshold value
- Alarms must reference thresholds via SSM dynamic references, not inline numbers

## Logging
Create exactly three primary log groups with 90-day retention.
- /payments/app/EnvironmentSuffix
- /payments/vpcflow/EnvironmentSuffix
- /payments/functions/EnvironmentSuffix

Encryption
- Enable log group encryption using default service keys if a customer-managed key would add extra dependencies
- If you add a KMS key inside this template, keep it minimal and fully self-contained

## Custom metrics from JSON logs
Assume application logs are JSON and include fields:
- status with values SUCCESS or ERROR
- latency_ms as a number
- transaction_id
- source_ip
- component as a short bounded string like gateway or processor

Metric design
- Use MetricNamespace
- Use dimensions with low cardinality only
  - Service set to payments
  - Environment set to EnvironmentSuffix
  - Component only if it is bounded and not user-generated

Metrics required
- TransactionsCount as a sum
- TransactionsSuccess as a sum
- TransactionsErrors as a sum
- LatencyP95 derived using supported CloudWatch approaches
  - If you cannot compute true p95 directly from log metric filters, document the limitation and provide the best supported alternative, plus a dashboard visualization

## Dashboard
Create one operational dashboard named Payments-Operations-EnvironmentSuffix.

Include widgets
- Line graphs for latency p95, error count, success rate, and composite health score
- Number widgets for current transaction volume at 1-minute or 5-minute resolution
- Include us-east-1, us-west-2, and eu-west-1 metrics in the dashboard by setting each metric region in the widget definitions

## Alarms and composite health
Create alarms that route to the correct SNS severity topics.

Critical alarms
- ErrorRateCritical using the SSM error rate critical threshold
- LatencyP95Critical using the SSM latency p95 critical threshold
- Tune for fast detection
  - Period 60 seconds
  - EvaluationPeriods 1
  - DatapointsToAlarm 1
  - TreatMissingData set to not breaching when appropriate

Composite alarm
- Create a composite alarm named ServiceHealthCritical-EnvironmentSuffix
- Use metric math to compute a health score that combines
  - error rate
  - latency
  - success rate
- Trigger when health score is below an SSM-driven threshold
- Ensure the composite alarm depends on its member alarms

## Alerting with SNS
Create three SNS topics
- Alerts-Critical-EnvironmentSuffix
- Alerts-Warning-EnvironmentSuffix
- Alerts-Info-EnvironmentSuffix

Add subscriptions from parameters
- One email and one SMS subscription per topic
Wire alarms to topics by severity.

## EventBridge automated remediation
Create EventBridge rules for critical alarm state transitions.
- Match alarm state change into ALARM for the critical alarms or the composite alarm
- Target is an in-template Lambda function that performs a minimal safe remediation action
  - Keep logic simple and inline, such as writing a structured log entry and emitting a follow-up event
- Grant EventBridge permission to invoke the Lambda
- Use an input transformer so Lambda receives alarm name, reason, and environment suffix

## CloudWatch Logs Insights saved queries
Create CloudWatch Logs Query Definitions for the application log group.
- Top error messages last 15 minutes
- P95 latency by component last 1 hour
- Transaction failures by source ip last 1 hour

## IAM and least privilege
Create dedicated IAM roles and policies as needed for:
- VPC flow logs delivery to CloudWatch Logs
- EventBridge to invoke Lambda remediation
- Synthetics canary execution if enabled
- Logs query definitions management

Least privilege rules
- Scope actions to only what is required
- Scope resources to the ARNs created by this stack
- Avoid broad permissions and avoid account-wide resource access

## Template structure requirements
- Single YAML file only named TapStack.yml
- Include Parameters, Conditions, Resources, Outputs
- No YAML anchors or aliases
- Use intrinsic functions and Conditions to toggle the canary
- Template must pass cfn-lint

## Outputs to include
- SNS topic ARNs for Critical, Warning, Info
- Dashboard name and a useful console URL if feasible
- Log group names
- Alarm names and ARNs including composite
- EventBridge rule names
- Canary name if created
- The SSM parameter names used for thresholds
