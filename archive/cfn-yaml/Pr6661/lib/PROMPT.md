Functional scope (build everything new):

* Provision a **single CloudFormation template named `TapStack.yml`** that creates a brand-new, production-grade **monitoring and observability stack** for a distributed payment processing system. No resources may reference pre-existing infrastructure; every module must be created by the template.
* **CORE services (mandatory):** Amazon **CloudWatch** and Amazon **EventBridge**.
* **OPTIONAL service (0–1):** AWS **Lambda** (only for automated remediation targets invoked by EventBridge).
* Implement **3–5 mandatory requirements** from the list below; prefer the first five as “mandatory”, and you may add exactly one optional enhancement if needed:

  * **Mandatory (choose 3–5):**

    1. CloudWatch **Log Groups** with **90-day retention** for application logs, VPC Flow Logs, and Lambda logs.
    2. CloudWatch **Metric Filters** that produce **custom metrics** (JSON logs) for transaction success rate, processing latency, and error counts.
    3. CloudWatch **Dashboards** with **line graphs** for latency trends and **number widgets** for current transaction volume (enable live data/auto-refresh behavior where supported).
    4. CloudWatch **Alarms** including **composite alarms** using **metric math** for a service health score.
    5. **SNS Topics** with **email and SMS** subscriptions per severity (Critical, Warning, Info).
  * **Optional (pick 0–1):**
    • CloudWatch **Synthetics canaries** that ping payment API endpoints every 5 minutes **or** CloudWatch **Metric Streams** to S3 for long-term analysis **or** CloudWatch **Contributor Insights** rules for top error-producing IPs. Choose only one if needed.

Context & compliance requirements:

* Region of deployment: **`us-east-1`** (primary). Provide **cross-region visibility** from **`us-west-2`** and **`eu-west-1`** using CloudWatch dashboards and metric math where supported by CFN (e.g., per-metric `region` in dashboard widgets).
* **All metrics retained ≥ 90 days**.
* **Critical alerts within 60 seconds** of threshold breach.
* **Use CloudWatch Logs Insights**, not third-party tools.
* **Metric math** must compute a **composite health indicator** (e.g., weights for latency, error rate, and success rate).
* **Business-hours dashboard auto-refresh every 60s** (use `liveData`/equivalent properties on widgets where supported; document any API limitations).
* **Cost control**: consolidate metric filters, avoid duplicate metrics, and prefer namespace/dimension design that minimizes cardinality.
* **Thresholds** stored in **AWS Systems Manager Parameter Store**; never hard-code numeric limits in resources.

Naming & tagging conventions:

* Every logical **resource name** (and any Name/Description fields where applicable) must **include `${EnvironmentSuffix}`** exactly as a suffix (e.g., `Payments-ErrorRate-Alarm-${EnvironmentSuffix}`) to avoid collisions across environments.
* Apply a **consistent tag set** to all taggable resources:
  `Environment=${EnvironmentSuffix}`, `CostCenter=Observability`, `Owner=Platform`, `Compliance=Financial`, `DataClassification=Confidential`.

Parameters (declare all in `TapStack.yml`):

* `EnvironmentSuffix` (Type: String): **must use a safe regex pattern** (e.g., `^[a-z0-9-]{3,30}$`) to restrict values; **do not** use hard `AllowedValues`.
* `PrimaryEmailCritical`, `PrimaryEmailWarning`, `PrimaryEmailInfo` (Type: String).
* `PrimarySmsCritical`, `PrimarySmsWarning`, `PrimarySmsInfo` (Type: String).
* `MetricNamespace` (Type: String, Default: `Payments/Observability`).
* **SSM Parameter names** (Type: String) for thresholds, e.g.:

  * `SSMErrorRateCriticalParam`, `SSMErrorRateWarningParam`
  * `SSMLatencyP95CriticalParam`, `SSMLatencyP95WarningParam`
  * `SSMSuccessRateCriticalParam`, `SSMSuccessRateWarningParam`
* `SyntheticCanaryUrl` (Type: String, Default empty). If empty, skip canary creation (conditional).
* `MetricStreamBucketName` (Type: String, Default empty). If empty, skip metric stream creation (conditional).

Security & IAM (least privilege):

* Create dedicated IAM roles/policies for:

  * **Metric filters & streams** write permissions, if required.
  * **Logs Insights saved queries** management (read-only to logs; write to query definitions).
  * **EventBridge → Lambda** remediation invoke permissions (OPTIONAL service).
  * **VPC Flow Logs** delivery to CloudWatch Logs (log role with `logs:CreateLogStream`, `logs:PutLogEvents`, etc.).
* Deny wildcard `*` where possible; scope actions by resource ARN with `${EnvironmentSuffix}`.

Logging:

* Create **three** primary log groups with **90-day retention**:

  1. `/payments/app/${EnvironmentSuffix}`
  2. `/payments/vpcflow/${EnvironmentSuffix}`
  3. `/payments/functions/${EnvironmentSuffix}`
* Enable **subscription filter reuse avoidance** and **KMS encryption** on log groups if available without external dependencies (use a template-created KMS CMK only if included in scope; otherwise default account key).

Custom metrics (metric filters on JSON logs):

* Parse JSON fields for:

  * `status` (e.g., `SUCCESS`|`ERROR`),
  * `latency_ms` (numeric),
  * `transaction_id`, `source_ip`.
* Produce metrics in `${MetricNamespace}` with consistent dimensions: `Service="payments"`, `Environment=${EnvironmentSuffix}`, optionally `Component` (e.g., `gateway`, `processor`).
* Metrics required:

  * `Transactions/Count` (sum)
  * `Transactions/Success` (sum)
  * `Transactions/Errors` (sum)
  * `Latency/P95` (use distribution via logs or compute with math if only p95 is required from emitted values)

Dashboards:

* Single **operational dashboard** named `Payments-Operations-${EnvironmentSuffix}` with:

  * **Line graphs**: latency trend (p95), error count, success rate, composite health score.
  * **Number widgets**: current transaction volume (1-min or 5-min).
  * Where supported, set `liveData: true` and per-metric `region` for cross-region views (`us-east-1`, `us-west-2`, `eu-west-1`).

Alarms:

* **ErrorRateCritical** and **LatencyP95Critical** referencing SSM thresholds (resolve via `{{resolve:ssm:/path}}` or `{{resolve:ssm-secure:/path}}`).
* **Composite alarm** `ServiceHealthCritical-${EnvironmentSuffix}` using **metric math** (e.g., health = 100 − w1*normalized_error − w2*normalized_latency + w3*success_rate). Trigger when health < SSM-driven threshold.
* **Evaluation period** and **treat missing data** settings tuned for **≤60s detection** on critical alarms.

Alerting (SNS):

* Create **three topics**: `Alerts-Critical-${EnvironmentSuffix}`, `Alerts-Warning-${EnvironmentSuffix}`, `Alerts-Info-${EnvironmentSuffix}`.
* Add **email and SMS subscriptions** from parameters.
* Wire alarms to appropriate severity topics.

EventBridge (automated remediation):

* Rules for critical alarm state transitions.
* Targets: **Lambda functions** (OPTIONAL service) created by the template (e.g., `Remediate-RestartComponent-${EnvironmentSuffix}`) with minimal, inline example logic (no external dependencies).
* Grant EventBridge permission to invoke Lambda.
* Use input transformer to pass alarm name, reason, and environment.

Saved CloudWatch Logs Insights queries:

* Define named queries for `/payments/app/${EnvironmentSuffix}` to answer:

  * “Top error messages last 15 minutes”
  * “P95 latency by component last 1 hour”
  * “Transaction failures by source_ip last 1 hour”
* Store as **CloudWatch Logs Query Definitions** resources in CFN.

Optional enhancements (choose exactly one if needed):

* **Synthetics**: a simple canary that hits `${SyntheticCanaryUrl}` every 5 minutes; alarm on failed runs.
* **Metric Stream**: stream `${MetricNamespace}` metrics to S3 bucket `${MetricStreamBucketName}` in Firehose-compatible format (create all roles and destinations inside this template).
* **Contributor Insights**: rule on `/payments/app/${EnvironmentSuffix}` to identify **top error-producing `source_ip`**.

Cross-region aggregation:

* In dashboards and (where supported) metric math/alarm `Metrics` arrays, reference **metrics from `us-west-2` and `eu-west-1`** using their per-metric region settings. If an alarm scope does not support cross-region via CFN, document this inline in the template’s `Description` and provide a dashboard-level cross-region alternative.

Cost controls & best practices:

* Minimize metric filter duplication; prefer **single filter** emitting multiple dimensions/metrics where appropriate.
* Avoid high-cardinality, unbounded dimensions.
* No YAML anchors or aliases.
* Prefer **intrinsics** (`!Sub`, `!Ref`, `!GetAtt`, `!If`, `!Equals`, `!Not`, `!And`, `!Or`) and **Conditions** to toggle optional modules based on parameters.

Deliverable:

* A **single file**: **`TapStack.yml`** containing **Parameters**, **Mappings** (if any), **Conditions**, **Resources**, and **Outputs**.
* **YAML only** (no JSON sections).
* **All variables, defaults, logic, and outputs are self-contained**.
* **All resource names and visible labels include `${EnvironmentSuffix}`**.
* Template passes `cfn-lint` and uses a **safe regex pattern** for `EnvironmentSuffix` (no `AllowedValues` lists).

Outputs:

* SNS topic ARNs (Critical/Warning/Info).
* Dashboard name/URL.
* Log group names.
* Alarm names/ARNs (including composite).
* EventBridge rule names.
* (If optional enabled) Canary name or Metric Stream destination details.
* SSM parameter names referenced for thresholds (echoed as informational outputs).

Validation criteria:

* `cfn-lint` clean; no unsupported properties.
* Alarms reference thresholds via **SSM parameters** only.
* Composite alarm created and depends on its member alarms.
* Dashboards show cross-region metrics with per-metric `region` set.
* All log groups have **RetentionInDays = 90**.
* No YAML anchors; no hard-coded environment lists; **`EnvironmentSuffix` must match `^[a-z0-9-]{3,30}$`**.
* All names suffixed with `${EnvironmentSuffix}`.

Implementation style & file notes:

* Keep the template **concise, commented**, and production-ready.
* Use **KMS encryption** where toggles exist without external keys; otherwise document default keys used by the service.
* Prefer **composite alarms** and **metric math** for the service health score.
* Where CloudWatch features have CFN limitations (e.g., dashboard auto-refresh granularity), set the closest supported properties and annotate the limitation in a template comment.
