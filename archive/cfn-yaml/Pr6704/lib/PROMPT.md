Advanced Observability for Payment Processing — **TapStack.yml** (YAML, build-everything-new)

# Intent

Produce a **single CloudFormation YAML file** named **TapStack.yml** that deploys an advanced observability solution for a high-volume payment processing system. **Do not** reference or depend on pre-existing resources; **create everything new** inside this template. The output must be valid YAML (not JSON), free of YAML aliases/anchors, and deployable with AWS CLI v2.

# Functional scope (build everything new):

* Stand up complete observability for a production payment platform running in **us-east-1**, spanning API Gateway, Lambda, DynamoDB, and SQS.
* Implement **CloudWatch-centric** monitoring with Logs, Metrics, Synthetics, Dashboards, Contributor Insights, Anomaly Detection, X-Ray tracing, intelligent alarms, and **EventBridge**-driven **automated remediation**.
* Include **cross-account visibility** for a central monitoring account using **CloudWatch Observability Access Manager (OAM)** and alarm notifications to a central SNS topic.
* All resource names **must include `-${EnvironmentSuffix}`** (ENVIRONMENT_SUFFIX) to avoid collisions across environments.
* Deploy **2–3 core services (mandatory focus)**:

  * **Amazon CloudWatch (Logs, Metrics/Math, Dashboard, Alarms, CompositeAlarms, Contributor Insights, Anomaly Detectors, Synthetics)**
  * **AWS X-Ray**
  * *(Optional add-on if needed)* **Amazon EventBridge** for automated remediation triggers
* Implement **5–7 mandatory capabilities** (from list below). You may add up to **1 optional** enhancement only if it improves cohesion (e.g., OAM cross-account linking or a minimal remediation Lambda).

# Mandatory capabilities (implement all of these):

1. **CloudWatch Log Groups** for API Gateway, Lambda, and application logs — each with **KMS encryption** and **retention**.
2. **Metric Filters** on Lambda/application logs extracting: transaction success rate, failure codes, processing times (p50/p90/p99). Emit **custom metrics** in `Payments/${EnvironmentSuffix}`.
3. **CloudWatch Synthetics Canaries** probing critical API endpoints **every 5 minutes**, with alarms on failure/latency.
4. **CloudWatch Anomaly Detection** baselines for **transaction volume** and **error rate**.
5. **Contributor Insights (InsightRules)** to identify top API consumers and error-prone endpoints.
6. **AWS X-Ray tracing** across services, enabled in API Gateway Stage and Lambda (`Active`).
7. **Composite Alarms** that fire **only** when **high error rate** and **high latency** occur together (reduce false positives).

# Optional enhancement (choose ≤1 if helpful):

* **Automated remediation** via **EventBridge Rule** → remediation **Lambda** (with least-privilege IAM) for targeted actions (e.g., toggling canary frequency, warming functions, notifying ops with enriched context).

# Non-functional / best practices:

* **YAML only; no JSON**.
* **No YAML anchors/aliases** (avoid `&` and `*`).
* **Least-privilege IAM** for canaries, dashboards, logs, alarms, remediation Lambda, and X-Ray.
* **KMS CMK** for encrypting Logs, Synthetics artifacts, and any state that requires encryption-at-rest.
* **Tags**: apply a consistent tag set (`Project=Payments`, `Owner=Ops`, `Environment=${EnvironmentSuffix}`, `CostCenter`, `Compliance=CIS/SOC2`) to **all** taggable resources.
* Use **Metrics Math** for composite KPIs (success rate, error budget burn).
* Prefer **namespace**: `Payments/${EnvironmentSuffix}` for custom metrics.
* **No hardcoded environment lists**.

  * **Do not** set `AllowedValues` for `EnvironmentSuffix`.
  * **Do** enforce a **safe regex `Pattern`** such as: `^[a-z0-9-]{2,20}$` (lowercase letters, digits, hyphen; 2–20 chars).
  * Provide guidance/examples in the **Description** only (e.g., “prod-us, production, qa”).

# Parameters (define at minimum):

* `EnvironmentSuffix` (String, **Pattern** enforced as above; **no AllowedValues**).
* `CentralMonitoringAccountId` (String) — account to receive shared telemetry and alarm notifications.
* `ApiEndpointUrls` (List<String>) — one or more critical endpoints for Synthetics canaries.
* `AlarmEmail` (String) — optional email for local SNS subscription (same-account testing).
* `LogsRetentionDays` (Number, default 30; allowed range 7–3650).
* `CanaryScheduleRateMinutes` (Number, default 5; allowed range 1–15).
* `KmsKeyAdmins` (List<String>) — IAM principals allowed admin on the CMK.
* `RemediationEnabled` (Boolean, default `false`).
* `OAMEnabled` (Boolean, default `true`) — controls cross-account linking resources.

# Naming & constraints:

* Every resource name must include `-${EnvironmentSuffix}` (e.g., `payments-app-logs-${EnvironmentSuffix}`, `payments-canary-${EnvironmentSuffix}`).
* CloudWatch metric namespaces: `Payments/${EnvironmentSuffix}`.
* Dashboard name: `payments-observability-${EnvironmentSuffix}`.
* SNS topics, roles, canaries, and KMS key aliases include `-${EnvironmentSuffix}`.

# Resources to implement (create all new):

**Security & Keys**

* `AWS::KMS::Key` + `AWS::KMS::Alias` for logs/canaries encryption (`alias/payments-observability-${EnvironmentSuffix}`).
* Key policy permitting CW Logs, Synthetics, Lambda, and principals in `KmsKeyAdmins`.

**CloudWatch Logs**

* `AWS::Logs::LogGroup` for:

  * API Gateway execution/access logs (Stage log groups you manage here; if needed, expose Stage log group name output).
  * Lambda functions (generic log group pattern to demonstrate retention & encryption).
  * Application log group.
* Each with `RetentionInDays`, `KmsKeyId`, and `LogGroupName` that includes `-${EnvironmentSuffix}`.

**Metric Filters & Custom Metrics**

* `AWS::Logs::MetricFilter` rules to parse:

  * Success (e.g., `status=SUCCESS`, count → `TransactionSuccess`)
  * Failures by code (extract `errorCode`, emit 1 per occurrence → `TransactionFailures`)
  * Processing times (extract `durationMs`, feed to distribution metrics → `ProcessingTimeMs`)
* Emit to `Namespace: Payments/${EnvironmentSuffix}` with meaningful `MetricName`s.

**Contributor Insights**

* `AWS::CloudWatch::InsightRule` on API Gateway access logs (or app logs) to surface:

  * Top API keys/consumers
  * Endpoints with highest 5xx/4xx ratios

**Anomaly Detection**

* `AWS::CloudWatch::AnomalyDetector` for:

  * `TransactionVolume` (sum/minute)
  * `ErrorRate` (% or per-minute)
* Use these detectors in alarms with **band math**.

**Synthetics Canaries**

* `AWS::Synthetics::Canary` (Node.js runtime), 5-min schedule, artifact S3 bucket with SSE-KMS using the above CMK, execution role with minimum permissions.
* One canary per endpoint in `ApiEndpointUrls` or a single multi-URL canary with step functions in the handler.
* Alarms on canary `Failed` and `Duration` p95.

**X-Ray**

* `AWS::XRay::SamplingRule` enabling 100% sampling for `payments-${EnvironmentSuffix}` service (adjustable).
* Ensure templates enable:

  * Lambda `TracingConfig: Active` (include a sample Lambda to demonstrate)
  * API Gateway Stage `TracingEnabled: true` (if a sample RestApi is included for wiring)

**Alarms (Single & Composite)**

* Single-metric alarms:

  * High 5xx (API)
  * High `TransactionFailures`
  * High p95/p99 latency from `ProcessingTimeMs` or API Latency
* **CompositeAlarm**: triggers only when **HighErrorRate** **AND** **HighLatency** are both in ALARM.
* Alarm actions:

  * Local SNS topic (`payments-alarms-${EnvironmentSuffix}`)
  * **Cross-account** publish to an **SNS topic in `CentralMonitoringAccountId`** (provide parameter for topic ARN or construct via standardized name; set permissive topic policy in central topic docstring, but in this stack add an **S SM string parameter** for the **central topic ARN** and wire alarms to it).

**EventBridge for remediation (optional)**

* `AWS::Events::Rule` watching for composite-alarm `ALARM` state → invoke a **minimal remediation Lambda** (e.g., warms specific functions or posts enriched diagnostics).
* `AWS::Lambda::Function`, `AWS::Lambda::Permission`, and least-privilege `AWS::IAM::Role` + `AWS::IAM::Policy`.

**Dashboard**

* `AWS::CloudWatch::Dashboard` **multi-panel** named `payments-observability-${EnvironmentSuffix}` showing:

  * API latency (p50/p90/p99), error rates (4xx/5xx), request count
  * Lambda invocations, errors, throttles, **cold starts** (via `InitDuration` metric if available or custom metric)
  * DynamoDB throttling (`WriteThrottleEvents`, `ReadThrottleEvents`)
  * SQS queue depth (`ApproximateNumberOfMessagesVisible`)
  * Business metrics: success rate, failures by code, processing times
  * Synthetics canary success/duration
  * Links or value widgets for **X-Ray Service Map** and **Logs Insights** queries (describe query strings in `DashboardBody`).
* Use **Metrics Math** to compute **TransactionSuccessRate = Success / (Success + Failures)**.

**Cross-account observability (OAM)**

* If `OAMEnabled`:

  * **`AWS::Oam::Link`** in this source account that links metrics/logs/traces to a **pre-existing Sink** in the central monitoring account (the sink is managed in central account; here create the Link and IAM permissions to allow sharing; include `SinkIdentifier` parameter to accept the sink ARN).
  * For alarms: wire `AlarmActions` to central SNS ARN (parameter) and ensure SNS topic policy in the **central** account allows `cloudwatch.amazonaws.com` from this account (document as note in template `Metadata`; do **not** attempt to manage central topic from here).

# IAM (least privilege):

* Roles/policies for:

  * Synthetics canary execution (CloudWatch, S3 write, X-Ray put trace, logs).
  * Remediation Lambda (only the specific actions it needs).
  * Permissions for CloudWatch to publish to SNS.
* Trust policies must be scoped to the exact service principals.

# CloudWatch Logs Insights (queries):

* Provide **`AWS::Logs::QueryDefinition`** examples for common ops queries (top error codes, slowest endpoints, cold start spikes). Name them with `-${EnvironmentSuffix}`.

# Parameters-to-Outputs contract:

Expose Outputs for:

* `DashboardName`
* `OAMLinkArn` (if enabled)
* `CanaryNames`
* `KmsKeyArn`
* `LogGroupNames` (primary ones)
* `CompositeAlarmName`
* `CentralAlarmActionArn` (echo the parameter to confirm wiring)

# Template shape & validation rules:

* **Single file** named **TapStack.yml**.
* Valid **CloudFormation YAML**; no anchors/aliases, no JSON.
* Use **`!Sub`** and **`!Ref`** safely; avoid circular refs.
* All logical IDs and Names include `-${EnvironmentSuffix}`.
* Include **`Metadata`** notes for operators: how to pre-create central SNS topic & OAM Sink in the central account, and required cross-account policies.
* Add **`Conditions`** to toggle optional remediation and OAM link creation.
* Ensure `LogsRetentionDays`, `CanaryScheduleRateMinutes` ranges are enforced via `AllowedMinValue/AllowedMaxValue`.
* Ensure **X-Ray** sampling rule name and canary names include suffix.

# Deliverable:

Return the **complete** **TapStack.yml** as a **single YAML file** with:

* **Parameters**, **Mappings** (if any), **Conditions**, **Resources**, and **Outputs**.
* Fully wired metrics, filters, detectors, dashboards, alarms (including composite), canaries, X-Ray, optional remediation, and OAM link.
* All names and ARNs composed with `-${EnvironmentSuffix}`.
* Clear, commented sections and consistent tagging.
* Production-ready, least-privilege IAM, encryption at rest, and minimal defaults that work in **us-east-1**.

# Acceptance checks (must pass):

* `cfn-lint` shows **no errors** (including no YAML alias usage).
* Parameter `EnvironmentSuffix` validated via **`Pattern: ^[a-z0-9-]{2,20}$`** and **no `AllowedValues`**.
* Dashboard renders widgets for API, Lambda, DynamoDB, SQS, Synthetics, and business KPIs with Metrics Math.
* Composite alarm requires **both** high error rate **and** high latency.
* Metric filters emit to `Payments/${EnvironmentSuffix}` and anomaly detectors reference those metrics.
* If `OAMEnabled=true`, an **OAM Link** is created to the provided sink; alarm actions publish to the provided central SNS ARN.
* All resource names include `-${EnvironmentSuffix}`.
