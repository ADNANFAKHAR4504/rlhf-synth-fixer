**Project Title:** TapStack — Serverless REST API Infrastructure (us-west-2)

**Functional scope (build everything new):**
Author a single CloudFormation template named `TapStack.yml` (YAML, not JSON) that provisions a **brand-new**, fully serverless RESTful backend in **us-west-2** using best practices. The template must create all resources (no references to pre-existing ones) and wire them end-to-end: API Gateway (REST) → Lambda (Python 3.8) → DynamoDB, with logging to S3 and CloudWatch, secrets in Secrets Manager, alarms, and secure IAM. All logical/physical resource names must include an `ENVIRONMENT_SUFFIX` to support multiple concurrent deployments without collisions.

**Deliverable:**
Return **only** a complete `TapStack.yml` file ready for deployment via `cdk synth`/`cdk deploy` (no external parameters passed at deploy time). Include Parameters (with safe defaults), Mappings (if needed), Conditions, Resources, and Outputs. Ensure every requirement below is implemented directly in this template.

**Environment and language:**

* Region: `us-west-2`
* Lambda runtime: **Python 3.8** (handler code defined inline in the template or via Zip asset created by the template; do not assume pre-existing artifacts)
* All IaC in **YAML** CloudFormation (not JSON).
* The file name is exactly `TapStack.yml`.

**Non-negotiable constraints & behaviors:**

1. **Fresh stack:** Create **all** modules new (API Gateway, Lambda, DynamoDB, S3, IAM, CloudWatch, Secrets Manager). No imports or lookups of existing resources.
2. **Naming & isolation:** Every resource name includes `${ENVIRONMENT_SUFFIX}`; example pattern: `${ProjectName}-${ENVIRONMENT_SUFFIX}-<resource>`.
3. **Parameters (no brittle enums):**

   * Provide `ProjectName` and `ENVIRONMENT_SUFFIX` Parameters with **sensible defaults**.
   * **Do not** use hard `AllowedValues`. Instead, enforce safety with a **regex** `AllowedPattern` (e.g., `^[a-z0-9-]{3,32}$` for names; allow hyphens).
4. **IAM & least privilege:**

   * A dedicated Lambda execution role with **only** the required permissions for DynamoDB CRUD, Secrets Manager `GetSecretValue`, CloudWatch Logs write, and S3 object put for logs.
   * Restrict API Gateway access to **known IP CIDR ranges** via an API key + usage plan **and** a Resource Policy that whitelists CIDRs.
5. **Networking & security allowances:**

   * Security Group associated with the API ingress path must allow **ICMP** and **TCP 80/443** (if a VPC attachment is required for the chosen design, attach SG appropriately; otherwise, create and document it as the enforcement point for private ingress patterns such as VPC links).
6. **API Gateway (REST):**

   * Integrate with the Lambda function (proxy or non-proxy is acceptable; ensure method/route defined).
   * **CORS** enabled for specified origins (parameterize `AllowedOrigins`).
   * **Caching** enabled at the stage level with reasonable TTL and cache encryption.
   * API key + usage plan and stage association.
   * Stage access logs to CloudWatch Logs.
   * **CloudWatch Alarms** for **4XX** and **5XX** rates with sensible thresholds and SNS notifications (create the SNS Topic in the template).
7. **Lambda:**

   * Runtime **python3.8**, memory, timeout, and reserved concurrency set with sane defaults and Parameters.
   * Environment variables for table name, secret name/ARN, log bucket, and environment suffix.
   * Logging to both **CloudWatch Logs** and **S3** (write objects to the S3 log bucket).
8. **DynamoDB:**

   * On-demand **or** provisioned with **Application Auto Scaling** for read/write capacity (implement autoscaling policies and alarms on throttling).
   * Point-in-time recovery enabled.
   * Server-side encryption enabled (AWS owned or KMS, choose best practice and document).
9. **S3 (logs):**

   * Dedicated log bucket with **block public access**, **bucket policy** to enforce TLS, **default encryption**, and **versioning enabled**.
   * Lifecycle policy to transition or expire log objects after a parameterized retention period.
10. **Secrets Manager:**

    * Secret to hold API keys or other sensitive config. Lambda reads at runtime (no plaintext in template).
11. **Monitoring & observability:**

    * CloudWatch Metrics/Alarms for API 4XX/5XX, Lambda errors/duration/throttles, and DynamoDB throttles.
    * SNS Topic for alarm notifications; expose the Topic ARN in Outputs.
12. **Tagging:**

    * Add a `Tags` section or explicit `Tags` on **every** resource: `ProjectName`, `Environment`, `Owner`, and `CostCenter` (parameterize these with defaults).
13. **Performance & scalability:**

    * Enable API caching; configure DynamoDB autoscaling; allow Lambda reserved concurrency parameter.
14. **Security posture:**

    * Enforce encryption at rest for S3 and DynamoDB.
    * API Gateway resource policy to restrict by IP CIDR.
    * TLS-only bucket policy.
    * No wildcard `*` permissions unless technically unavoidable; scope actions and resources minimally.
15. **CDK compatibility:**

    * The template must be valid CloudFormation YAML output that can be produced by CDK synth, but **return the final YAML** as `TapStack.yml`. Avoid features that require manual post-processing or external assets.

**Parameters (minimum set, with safe defaults):**

* `ProjectName` (default: `tapstack`) — regex-restricted, not enum-restricted.
* `ENVIRONMENT_SUFFIX` (default: `dev-us`) — regex-restricted, not enum-restricted.
* `AllowedOrigins` (default example: `https://example.com,https://admin.example.com`) — comma-separated list.
* `AlarmEmail` (default empty; if non-empty, subscribe to SNS Topic).
* `ApiCacheTtlSeconds` (default: `300`).
* `LogRetentionDays` (default: `30`).
* `LambdaMemoryMb` (default: `256`), `LambdaTimeoutSeconds` (default: `15`), `LambdaReservedConcurrency` (default: `5`).
* `AllowedIpCidrs` (default: `203.0.113.0/24,198.51.100.0/24`) — comma-separated CIDRs for API allowlist.
* `DdbReadMin`, `DdbReadMax`, `DdbWriteMin`, `DdbWriteMax` (defaults that enable autoscaling if provisioned mode is used).
* `CostCenter`, `Owner` (defaults for tagging).

**Outputs required:**

* REST API invoke URL and stage name.
* Lambda function name and log group name.
* DynamoDB table name and ARN.
* S3 log bucket name and ARN.
* Secrets Manager secret ARN.
* SNS Topic ARN for alarms.
* Effective `ENVIRONMENT_SUFFIX` and `ProjectName`.

**Style & formatting rules:**

* Produce a **single** valid YAML file named `TapStack.yml`.
* Use explicit logical IDs, clear descriptions, and in-template comments where helpful.
* Use `Fn::Sub` string interpolation for names to include `ENVIRONMENT_SUFFIX`.
* Avoid deprecated resource types; prefer current API Gateway/CloudWatch features.
* Do not rely on external parameters or manual steps; defaults must allow a non-interactive deploy.

**Testing & verification notes (inline in comments):**

* Include example `curl` against the invoke URL with an API key header.
* Note how CORS origins are set and how to update them.
* Note where to change Allowed CIDRs.
* Note that alarms publish to SNS Topic; if `AlarmEmail` provided, create subscription.

**Acceptance criteria:**

* `TapStack.yml` validates with cfn-lint and deploys in `us-west-2` creating **all** resources new.
* API Gateway returns a successful response from the Lambda handler.
* DynamoDB reads/writes succeed; autoscaling policies are present.
* S3 log bucket has encryption and versioning enabled; Lambda can write logs to it.
* Secrets are retrievable by Lambda at runtime; no plaintext secrets in template.
* Resource tags are present on all resources.
* No hardcoded AllowedValues lists for `ENVIRONMENT_SUFFIX`; **use regex** to enforce safe naming.