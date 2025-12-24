# Advanced Observability for Payment Processing

TapStack.yml
Build everything new using CloudFormation YAML

---

## Intent

I need a single CloudFormation YAML template named **TapStack.yml** that deploys **advanced observability** for a high-volume payment processing system.

Everything must be created from scratch inside this template.
Do not reference any existing AWS resources.

The stack is deployed in **us-east-1** and must be deployable using AWS CLI v2.

The observability solution focuses on API Gateway, Lambda, DynamoDB, and SQS, using CloudWatch as the core platform.

---

## Overall goal

This stack should feel like something a real payments platform would run in production.

It must provide deep visibility, intelligent alerting, anomaly detection, synthetic monitoring, tracing, and optional automated remediation.

All names must include `-${EnvironmentSuffix}` so multiple environments can coexist safely.

---

## Core services in scope

The solution must be built primarily on:

* Amazon CloudWatch for logs, metrics, dashboards, alarms, contributor insights, anomaly detection, and synthetics
* AWS X-Ray for tracing
* Amazon EventBridge only if needed for automated remediation

---

## Mandatory capabilities

All of the following must be implemented.

### Logging

Create CloudWatch log groups for:

* API Gateway access and execution logs
* Lambda function logs
* Application logs

Each log group must:

* Use KMS encryption
* Have configurable retention
* Include the environment suffix in the name

---

### Metrics and log parsing

Create metric filters that extract business and operational signals from logs, including:

* Successful transactions
* Failed transactions with error codes
* Processing time values

These metrics must be published under the namespace:

Payments slash EnvironmentSuffix

---

### Synthetic monitoring

Create CloudWatch Synthetics canaries that probe critical payment API endpoints every few minutes.

The canaries must:

* Store artifacts in an encrypted S3 bucket
* Use least-privilege IAM
* Alarm on failures and high latency

---

### Anomaly detection

Create anomaly detection baselines for:

* Transaction volume
* Error rate

Use these detectors directly in CloudWatch alarms.

---

### Contributor insights

Enable Contributor Insights rules to identify:

* Top API consumers
* Endpoints with the highest error rates

---

### Distributed tracing

Enable AWS X-Ray tracing across the stack.

This includes:

* Lambda tracing set to Active
* API Gateway stage tracing enabled
* An X-Ray sampling rule scoped to the payment service

---

### Intelligent alarms

Create individual alarms for:

* High error rate
* High latency

Then create a composite alarm that triggers only when **both** conditions occur at the same time.

This composite alarm must reduce false positives and represent real customer impact.

---

## Optional capability

You may include one optional enhancement if it improves cohesion.

If included, implement automated remediation using:

* EventBridge rule triggered by the composite alarm
* A small remediation Lambda with least-privilege permissions

Examples include warming functions or sending enriched notifications.

---

## Security and encryption

All data at rest must be encrypted using a customer-managed KMS key.

The KMS key must be used for:

* CloudWatch Logs
* Synthetics artifacts
* Any stateful data that requires encryption

Key policies must allow only:

* Account administrators
* Explicit roles created in this stack

Avoid broad permissions.

---

## Cross-account observability

If enabled, this stack must share telemetry with a central monitoring account.

This is done using CloudWatch Observability Access Manager.

In this account:

* Create an OAM Link to a sink in the central account
* Do not attempt to manage the sink itself

Alarm notifications must also publish to a central SNS topic provided as a parameter.

Document required cross-account permissions in template metadata.

---

## Parameters

At minimum, define the following parameters.

* EnvironmentSuffix

  * String
  * Validated using a regex that allows lowercase letters, numbers, and hyphens
  * Length between 2 and 20 characters
  * No allowed values list

* CentralMonitoringAccountId

* ApiEndpointUrls

  * List of payment API endpoints to monitor

* AlarmEmail

  * Optional local subscription

* LogsRetentionDays

  * Default 30
  * Range 7 to 3650

* CanaryScheduleRateMinutes

  * Default 5
  * Range 1 to 15

* KmsKeyAdmins

  * List of IAM principals

* RemediationEnabled

  * Boolean

* OAMEnabled

  * Boolean

---

## Naming rules

Every resource name must include the environment suffix.

Examples include:

* payments-app-logs-environment
* payments-canary-environment
* payments-observability-environment

Dashboards, alarms, roles, topics, keys, and log groups must all follow this rule.

---

## Dashboards

Create a CloudWatch dashboard named:

payments-observability-environment

The dashboard must show:

* API latency percentiles
* Error rates
* Request volume
* Lambda invocations, errors, throttles, and cold starts
* DynamoDB throttling
* SQS queue depth
* Business KPIs such as transaction success rate
* Canary success and duration

Use metric math to calculate success rate from success and failure metrics.

Include widgets or links that point operators to X-Ray service maps and Logs Insights queries.

---

## Logs Insights queries

Define saved CloudWatch Logs Insights queries for common operations tasks, such as:

* Top error codes
* Slowest endpoints
* Cold start spikes

Each query definition must include the environment suffix.

---

## IAM requirements

Define IAM roles and policies for:

* Synthetics canaries
* Remediation Lambda if enabled
* CloudWatch alarm notifications

Trust policies must be scoped to exact AWS services.

Permissions must be least-privilege.

---

## Conditions and controls

Use conditions to:

* Enable or disable remediation
* Enable or disable OAM resources

Enforce numeric parameter ranges using allowed minimum and maximum values.

---

## Outputs

Expose outputs for:

* Dashboard name
* KMS key ARN
* Canary names
* Primary log group names
* Composite alarm name
* OAM link ARN if enabled
* Central alarm action ARN

---

## Final deliverable

Return a **single CloudFormation YAML file** named **TapStack.yml** that includes:

* Parameters
* Conditions
* Resources
* Outputs

The template must:

* Pass cfn-lint
* Avoid YAML aliases
* Use only YAML
* Include consistent tagging
* Follow least-privilege and encryption best practices
* Deploy cleanly in us-east-1

This should represent a real, production-grade observability stack for payments, not a theoretical example.
