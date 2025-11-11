Functional scope (build everything new):

* Produce a single CloudFormation template file named `TapStack.yml` that provisions an automated compliance monitoring system centered on Amazon GuardDuty in **us-east-1**. No resources may reference pre-existing infrastructure; all required components must be created within this stack.
* Enable **GuardDuty** in the current account/region with both **S3Protection** and **EKSAuditLogs** features enabled.
* Create an **Amazon EventBridge rule** that captures only **HIGH** and **MEDIUM** severity GuardDuty findings.
* Deploy an **AWS Lambda** function (inline `ZipFile` code) that:

  * Receives GuardDuty findings from EventBridge.
  * Enriches each finding with resource tags (EC2, S3, EKS, IAM where applicable) and adds compliance metadata (e.g., control family, classification, environment).
  * Publishes an alert to an **SNS topic** and writes enriched finding records to an **S3 audit bucket**.
* Provision an **SNS topic** with an **email subscription** for the security team.
* Create an **S3 bucket** for compliance audit logs with bucket versioning, **AES256 server-side encryption**, and **block all public access**.
* Configure an **EventBridge archive** to retain all GuardDuty finding events for **90 days**.
* Create **least-privilege IAM roles and policies** for:

  * Lambda execution (permissions limited to: CloudWatch Logs write, read specific resource tags, publish to the created SNS topic ARN, put objects only into the created S3 audit bucket prefix/ARN, and decrypt if needed—though encryption is AES256).
  * GuardDuty service associations if required by features.
* Create a **CloudWatch Logs log group** for the Lambda function with **30-day retention**.
* Set **Lambda environment variables** for the SNS topic ARN and the S3 bucket name.
* Ensure **GuardDuty S3 protection** explicitly includes monitoring for the **new audit S3 bucket**.

Deliverable:

* A production-ready **CloudFormation YAML** file named **`TapStack.yml`** that includes:

  * **Parameters** section declaring all inputs with sensible defaults:

    * `ENVIRONMENT_SUFFIX` (e.g., `dev`, `staging`, `prod`) — required.
    * `SecurityAlertEmail` — required, used to subscribe to SNS.
    * Optional: `AuditBucketPrefix` (default `guardduty-audit`), `LambdaMemoryMB` (default `256`), `LambdaTimeoutSeconds` (default `30`), `EventArchiveRetentionDays` (default `90`), `LogRetentionDays` (default `30`).
  * **Mappings/Conditions** if needed for partition or future region portability, but keep scope single-region (**us-east-1**).
  * **Resources** that create every component listed in the Functional scope with best-practice configuration and strict least-privilege IAM policies using **explicit resource ARNs**, **not** `*`.
  * **Outputs** providing at minimum:

    * `GuardDutyDetectorId`
    * `GuardDutyS3ProtectionStatus`
    * `GuardDutyEKSAuditLogsStatus`
    * `FindingRuleArn`
    * `EventArchiveArn`
    * `AuditBucketName`
    * `SnsTopicArn`
    * `LambdaFunctionName`
    * `LambdaLogGroupName`

Constraints and best practices:

* **Naming**: Every resource **Name/FunctionName/LogGroup/SNS topic name/bucket name/role name** must include `-${ENVIRONMENT_SUFFIX}` to avoid collisions across multiple deployments.
* **Encryption & privacy**:

  * S3 bucket must use **AES256** server-side encryption (no KMS in this requirement) and **block all public access**; enable **bucket versioning**.
  * CloudWatch Logs retention set via a separate `AWS::Logs::LogGroup` resource (30 days).
* **GuardDuty**:

  * Create a **detector** with features `{ S3Protection: ENABLED, EKSAuditLogs: ENABLED }`.
  * Explicitly ensure the **audit S3 bucket** is within GuardDuty S3 protection scope.
* **EventBridge**:

  * Rule filters only **GuardDuty** findings with **severity >= 4** and **< 7** for MEDIUM plus **>= 7** for HIGH. Implement this via **two numeric ranges** or documented pattern logic strictly matching MEDIUM/HIGH.
  * Create an **Event Archive** with retention set to **90 days** (parameterized).
* **Lambda**:

  * Runtime: **Python 3.12**.
  * Code must be inline using the **`ZipFile`** property (no external artifacts).
  * Handler implementation must:

    * Parse GuardDuty event.
    * For each implicated resource, call relevant `ListTagsForResource`/`Describe*` APIs (e.g., EC2, EKS, S3) safely with timeouts and error handling.
    * Append an `enrichment` object including `resourceTags`, `complianceClassification`, `controlFamily`, and `environment` (from `ENVIRONMENT_SUFFIX`).
    * Write a newline-delimited JSON record to `s3://<AuditBucket>/findings/YYYY/MM/DD/...` with object key including event id and timestamp.
    * Publish a concise alert to the SNS topic with a summary and direct link to the GuardDuty console for the finding.
  * Environment variables required:

    * `ALERTS_TOPIC_ARN`
    * `AUDIT_BUCKET_NAME`
    * `ENVIRONMENT_SUFFIX`
* **IAM**:

  * Lambda execution role trust: `lambda.amazonaws.com`.
  * Policies must enumerate **explicit ARNs** for:

    * The created SNS topic (`sns:Publish`).
    * The created S3 bucket prefix (`s3:PutObject`, `s3:PutObjectAcl` if needed; no Get/List beyond required writes; allow `s3:ListBucket` limited by prefix for key placement).
    * `logs:CreateLogStream` and `logs:PutLogEvents` for the **specific** log group ARN.
    * Read-only `ec2:Describe*` and `resourcegroupstaggingapi:GetResources` or service-specific tag reads **scoped** when possible; if scoping by ARN is impractical for certain `Describe*`, keep to read-only and document rationale; do not grant write permissions.
  * Any service-linked roles created should be explicitly declared only if required by these features.
* **Event targets & permissions**:

  * EventBridge rule must target the Lambda function with an **`AWS::Lambda::Permission`** resource allowing `events.amazonaws.com` to invoke it from the rule ARN only.
* **Tags**:

  * Apply stack-level tags to all resources (`Environment`, `Owner`, `Classification`) and propagate into resource-level `Tags` blocks.
* **Validation**:

  * Template must pass `cfn-lint`.
  * No wildcard `*` principals or resource ARNs in IAM where avoidable; principals must be exact services or roles.
  * All references must resolve within the template (no missing `Ref`/`GetAtt`).
  * Outputs must use `Export` names that include `-${ENVIRONMENT_SUFFIX}`.

Parameters (required in the template):

* `ENVIRONMENT_SUFFIX`: String; AllowedValues: `dev`, `staging`, `prod` (add more if needed); used in all names.
* `SecurityAlertEmail`: String; validates as email for SNS subscription.
* `AuditBucketPrefix`: String; default `guardduty-audit`.
* `LambdaMemoryMB`: Number; default `256`.
* `LambdaTimeoutSeconds`: Number; default `30`.
* `EventArchiveRetentionDays`: Number; default `90`.
* `LogRetentionDays`: Number; default `30`.

Resource implementation details (must be reflected in `TapStack.yml`):

* `AWS::GuardDuty::Detector` with `Enable: true` and `Features` array enabling `S3DataSources: ENABLED` (S3Protection) and `EksAuditLogs: ENABLED`.
* `AWS::S3::Bucket` with:

  * Name: `${AuditBucketPrefix}-${ENVIRONMENT_SUFFIX}-${AWS::AccountId}`
  * `PublicAccessBlockConfiguration` fully blocking public access.
  * `VersioningConfiguration: Enabled`.
  * `BucketEncryption` set to **AES256**.
  * Bucket policy denying insecure transport and public ACLs/policies.
* `AWS::SNS::Topic` and `AWS::SNS::Subscription` (Protocol: `email`, Endpoint: `!Ref SecurityAlertEmail`), with topic name ending in `-${ENVIRONMENT_SUFFIX}`.
* `AWS::Events::Rule` for GuardDuty findings with an event pattern that:

  * `source: ["aws.guardduty"]`
  * `detail-type: ["GuardDuty Finding"]`
  * `detail.severity` numeric filter for HIGH (≥7) and MEDIUM (≥4 and <7) only.
* `AWS::Events::Archive` attached to the default event bus with `RetentionDays: !Ref EventArchiveRetentionDays` and a name including `-${ENVIRONMENT_SUFFIX}`.
* `AWS::Logs::LogGroup` created explicitly with name `/aws/lambda/guardduty-enricher-${ENVIRONMENT_SUFFIX}` and `RetentionInDays: !Ref LogRetentionDays`.
* `AWS::IAM::Role` for Lambda with:

  * Trust policy for `lambda.amazonaws.com`.
  * Inline policies scoping to the created **SNS topic ARN**, **S3 bucket ARN + prefix**, and **LogGroup ARN**.
  * Read-only tag/describe permissions minimally scoped; if service requires account-level describe (e.g., `ec2:DescribeInstances`), document justification in policy description and keep it read-only.
* `AWS::Lambda::Function`:

  * Runtime `python3.12`.
  * Memory/timeout from parameters.
  * Environment variables for SNS topic ARN, S3 bucket name, and environment suffix.
  * Inline `ZipFile` implementing enrichment and error handling with retries and idempotent S3 keying.
* `AWS::Lambda::Permission` allowing `events.amazonaws.com` to invoke function, `SourceArn` = rule ARN.
* Any `AWS::GuardDuty::*` resources necessary to ensure S3 protection covers the new audit bucket (e.g., ensure Detector’s S3 data source is enabled; if a specific association resource is required, include it).

Outputs (export names must include `-${ENVIRONMENT_SUFFIX}`):

* `GuardDutyDetectorId`
* `GuardDutyS3ProtectionStatus`
* `GuardDutyEKSAuditLogsStatus`
* `FindingRuleArn`
* `EventArchiveArn`
* `AuditBucketName`
* `SnsTopicArn`
* `LambdaFunctionName`
* `LambdaLogGroupName`

Formatting requirements:

* File name: **`TapStack.yml`**.
* Clean, readable YAML with logical grouping and comments for each section.
* No conversational prose in the file; only concise comments where helpful.
* All logical IDs and resource names include `ENVIRONMENT_SUFFIX`.

Acceptance criteria:

* Deploys cleanly in **us-east-1** with just `ENVIRONMENT_SUFFIX` and `SecurityAlertEmail` set by the user (others defaulted).
* GuardDuty shows **enabled** with **S3Protection** and **EKSAuditLogs** features.
* EventBridge rule triggers Lambda for MEDIUM/HIGH findings only.
* SNS delivers an email subscription confirmation and receives published alerts.
* S3 bucket enforces versioning, AES256 encryption, and blocked public access; receives enriched finding objects.
* EventBridge archive exists with **90-day** retention.
* IAM policies contain **no wildcards** for resources or principals where avoidable, and follow least privilege.
* CloudWatch log group uses **30-day** retention and receives Lambda logs.
