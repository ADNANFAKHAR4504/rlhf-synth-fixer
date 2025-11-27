**Functional scope (build everything new):**
Create a single CloudFormation template named **`TapStack.yml`** that stands up **all** required resources from scratch (no references to pre-existing resources). The stack must be region-agnostic and deploy cleanly in **`us-east-1`** and **`eu-west-1`** when launched separately. The template implements a serverless baseline supporting Python automation via Boto3 for stack lifecycle, including secure Lambda execution, notifications, logging/monitoring, fault tolerance, and blue/green deployments.

**Deliverable:**
Produce a **well-commented, production-ready CloudFormation template in pure YAML** called **`TapStack.yml`** (not JSON). It must include **Parameters**, **Conditions** (if needed), **Mappings** (only if genuinely useful), **Resources**, and **Outputs**. All **resource logical IDs** and **actual names** must include **`${EnvironmentSuffix}`** to avoid collisions across environments.

---

### Technical requirements

1. **Parameters (explicit, safe, and deployable defaults):**

   * `ProjectName`: String; default like `tapstack`; safe regex (no hard AllowedValues).
   * `EnvironmentSuffix`: String; **do not** hardcode AllowedValues (e.g., `prod-us`, `production`, `qa`). **Enforce a safe regex** that supports examples like these without locking them down (e.g., `^[a-z0-9-]{2,32}$`).
   * `LambdaRuntime`: default `python3.11`.
   * `LambdaMemoryMb`: Number; default 256; Range 128–10240.
   * `LambdaTimeoutSec`: Number; default 30; Range 1–900.
   * `AlarmEmail`: String; optional (can be blank); if set, subscribe to SNS for alarms.
   * `TemplateArtifactsBucketName`: String; S3 bucket **to store versioned templates/artifacts** (created by this stack).
   * `VpcCidr`: String; optional; if you introduce VPC-enabled Lambdas, keep defaults sensible and self-contained.
   * Any other parameters needed for a **complete, independent** deployment (e.g., CW log retention days, dead-letter queue toggle, etc.).
   * **Do not** use `Ref` values inside `Default`. Defaults must be plain literals.

2. **Global naming rule:**

   * Every **resource name** (e.g., SNS topics, IAM roles, Lambda function names, log groups, CodeDeploy app/group, S3 buckets created by this template) must include `${EnvironmentSuffix}` (e.g., `tap-${EnvironmentSuffix}-lambda-role`, `sns-stack-events-${EnvironmentSuffix}`).

3. **Security & IAM (least privilege, inline clarity):**

   * Create **IAM roles** for Lambdas with the minimum policies required (logging to CloudWatch, reading environment variables/secrets if used, S3 read for artifacts if applicable).
   * Use managed policies **only if** they are narrowly scoped (e.g., `AWSLambdaBasicExecutionRole`); otherwise prefer inline least-privilege policy statements.
   * If KMS is used (optional), include a CMK with a sane key policy granting the Lambda role necessary permissions.

4. **Lambda functions (with environment variables):**

   * Provision at least one **primary Lambda function** (e.g., `AppHandlerLambda-${EnvironmentSuffix}`) plus a **“green” variant** for blue/green (or implement via versions/aliases—see Blue/Green section).
   * Configure **environment variables** (e.g., `PROJECT_NAME`, `ENVIRONMENT_SUFFIX`, `LOG_LEVEL`, etc.).
   * Create the **CloudWatch Log Group(s)** explicitly with a parameterized retention period.
   * Support dead-lettering via an optional SQS DLQ (parameter toggle).
   * Function code packaging can be represented as an S3 location **parameter** or a placeholder ZIP key placed in the artifacts bucket created by this template. Document it in comments.

5. **S3 for templates/artifacts (version control):**

   * Create an **S3 bucket** (name includes `${EnvironmentSuffix}`) with bucket policy best practices: Block Public Access, versioning enabled, default encryption, and minimum necessary IAM.
   * Expose bucket **Outputs** (name and ARN).

6. **SNS for notifications (stack and alarms):**

   * Create an **SNS topic** (e.g., `stack-events-${EnvironmentSuffix}`) for CloudFormation / operational notifications.
   * Conditional email subscription if `AlarmEmail` provided.
   * Expose SNS topic **Outputs**.

7. **CloudWatch logging & monitoring:**

   * Explicit **Log Groups** for each Lambda with retention (parameterized).
   * **CloudWatch Alarms** (e.g., `LambdaErrors`, `Throttles`, optional `Duration` p95) tied to the SNS topic.
   * Optional composite alarms are welcome if they simplify signal quality without over-complication.

8. **Blue/Green deployment strategy (Lambda):**

   * Implement **Lambda versions + aliases** (`blue`/`green` or `live` alias) with **traffic shifting** using **CodeDeploy** for Lambda:

     * Create a **CodeDeploy Application** and **Deployment Group** that targets the Lambda alias.
     * Configure **PreTraffic** and **PostTraffic** hooks (separate lightweight Lambda functions) or no-op placeholders with logging—still created by this template.
     * Use a **safe canary** or **linear** traffic shifting config (e.g., `Canary10Percent5Minutes`).
   * **All resources for CodeDeploy must also include `${EnvironmentSuffix}`**.

9. **Rollback & fault tolerance (in-template):**

   * Ensure CloudFormation **rollback on failure** by default.
   * CodeDeploy deployment group must be configured to **automatically roll back** on alarm breach or deployment failure (wire to the CloudWatch alarms created above).
   * Provide a **safe default alarm** that, if tripped during deployment, triggers rollback.

10. **Eventing & (optional) API surface:**

* Optional but acceptable: create an **EventBridge rule** or simple **API Gateway (HTTP API)** wired to the Lambda **only if** it remains minimal and self-contained. If added, ensure names include `${EnvironmentSuffix}`, logging is enabled, and any access logging is secured.

11. **Best-practice hygiene:**

* Block public access on any S3 buckets.
* Enable server-side encryption (SSE-S3 or SSE-KMS).
* Avoid wildcard `*` in IAM `Action` and `Resource` unless absolutely unavoidable and well-commented.
* No hardcoded ARNs for regional services—use `!Sub`, `!Ref`, `!GetAtt` appropriately.
* Keep the template **idempotent** and **lint-friendly** (e.g., passes `cfn-lint`).
* Do **not** use `AllowedValues` on `EnvironmentSuffix`; use a **safe regex** via `AllowedPattern` and a clear `ConstraintDescription` so values like `prod-us`, `production`, `qa` remain valid.

---

### Outputs (comprehensive and script-friendly)

Export (as stack outputs) the key identifiers your Python automation will consume:

* `ArtifactsBucketName`, `ArtifactsBucketArn`
* `StackEventsSnsTopicArn`
* `PrimaryLambdaName`, `PrimaryLambdaArn`
* `PrimaryLambdaAliasName`, `PrimaryLambdaAliasArn`
* `CodeDeployApplicationName`, `CodeDeployDeploymentGroupName`
* `AlarmArns` (list or individual outputs for critical alarms)
* Any optional surface (API endpoint URL, EventBridge rule name) if present

---

### Formatting & style constraints

* **YAML only** (no JSON).
* Clean logical ID names; readable comments explaining decisions.
* No conversational tone, no filler.
* Every **created** resource must be fully defined within this template—**no pointers to existing** resources.
* Ensure **all names** (where the service allows) include `${EnvironmentSuffix}`.
* Prefer intrinsic functions `!Sub`, `!Ref`, `!GetAtt` for portability and clarity.
* Keep parameter defaults deployable in a fresh account/project with minimal manual setup.

---

### Validation notes (authoring guidance)

* Include brief comments indicating where the Python `cloudformation_manager.py` would:

  * Upload/refer to Lambda ZIPs in the artifacts bucket,
  * Trigger CodeDeploy to shift alias traffic (blue → green),
  * Read outputs to wire SNS/alarms and monitor progress.
* Avoid using `Ref: AWS::Region` inside parameter defaults; use literals only in defaults.
* Template must be structurally valid and **synthesize without errors** under `cfn-lint`.

---

### Example naming guidance (non-binding, illustrative)

* `AppHandlerLambda-${EnvironmentSuffix}`
* `AppHandlerLogGroup-${EnvironmentSuffix}`
* `TapStackArtifacts-${EnvironmentSuffix}`
* `sns-stack-events-${EnvironmentSuffix}`
* `cdapp-lambda-${EnvironmentSuffix}`, `cdgroup-lambda-${EnvironmentSuffix}`
* `LambdaRole-${EnvironmentSuffix}`

---

### Acceptance criteria

* Single file **`TapStack.yml`** meeting all requirements above.
* Stands up **all** needed modules/resources with names including `${EnvironmentSuffix}`.
* Uses **AllowedPattern** (not AllowedValues) for `EnvironmentSuffix` and enforces a safe regex.
* Implements **Lambda blue/green** via versions, alias, and **CodeDeploy** with traffic shifting and rollback on failure.
* Provides **SNS notifications**, **CloudWatch Logs**, and **CloudWatch Alarms** wired to deployments.
* Exposes complete, automation-friendly **Outputs**.
* Conforms to least-privilege IAM and common AWS security best practices.