# Objective

Produce a single CloudFormation template named **TapStack.yml** that deploys a complete, brand-new, serverless webhook processing system for high-volume cryptocurrency exchange events. The stack must be self-contained, synthesizable, and deployable without referencing any pre-existing resources.

# Functional scope (build everything new):

1. **Amazon API Gateway (REST):**

   * One REST API with a deployed Stage (parameterized stage name).
   * **Request validation**: require headers `X-Exchange-Signature` and `X-Webhook-ID`; define a request validator and minimal request models.
   * **Throttling**: configure **1000 requests/second** (rate limit) at Stage/Method level.
   * **Authorization**: set **AuthorizationType: AWS_IAM** on methods (for internal Lambda invocations).
   * **Header pass-through**: ensure Lambda receives `X-Exchange-Signature` and `X-Webhook-ID` (method request parameters + integration mapping or Lambda proxy semantics).

2. **AWS Lambda (three functions):**

   * **webhook-receiver** (Node.js 18), **signature-validator** (Python 3.11), **data-processor** (Python 3.11).
   * All with **512 MB memory**, **30-second timeout**, **Active X-Ray tracing**, and **reserved concurrency**:

     * receiver: 100
     * validator: 50
     * processor: 50
   * **Dead Letter Queue (SQS)** configured for failures on all three functions.
   * **Environment variables**: pull API keys from **SSM Parameter Store** using dynamic references (`{{resolve:ssm...}}`), not plaintext.
   * **CloudWatch Log Groups**: one per function with **7-day retention**.
   * **VPC**: all functions run in the same VPC’s **private subnets**.

3. **Amazon DynamoDB:**

   * One table with **on-demand billing (PAY_PER_REQUEST)**.
   * **Partition key**: `transactionId` (String); **Sort key**: `timestamp` (Number or String—choose and stay consistent).
   * **Point-in-time recovery (PITR)** enabled.

4. **Amazon S3 (raw payload archive):**

   * New bucket for raw webhook payloads (no external buckets).
   * **SSE-S3 encryption** (`AES256`), **Block Public Access** = true.
   * **Lifecycle policy**: transition objects to **Glacier** after **30 days**.
   * (Optional but preferred) Access logging to a stack-created logs bucket; if included, keep it private and SSE-S3.

5. **Networking (VPC) & Endpoints:**

   * Create a **new VPC** with at least **2 private subnets across 2 AZs** and one dedicated **Lambda security group**.
   * Provide egress for private Lambdas either via:

     * **VPC interface endpoints** for SSM, Logs, X-Ray, and DynamoDB/S3 gateways (preferred to reduce NAT costs), **or**
     * NAT Gateways across AZs (if you choose NAT, document why).
   * Ensure Lambdas can reach SSM, CloudWatch Logs, X-Ray, DynamoDB, and S3 without public internet exposure.

6. **IAM (least privilege):**

   * Separate **execution roles** per Lambda with the minimum permissions:

     * Read SSM parameters used by that function only.
     * Write to function-specific CloudWatch Logs.
     * Put traces to X-Ray.
     * Send to the DLQ (SQS).
     * Receiver: permission to write raw payloads to S3 and invoke validator.
     * Validator: permission to read relevant SSM secret(s), and invoke processor.
     * Processor: permission to write to DynamoDB table.
   * API Gateway role/policy statements only if required for integrations you choose.

# Non-functional & compliance constraints:

* **Single file**: Output only one YAML file, **TapStack.yml**, with **TemplateVersion** and clean sectioning.
* **Brand-new resources** only; do **not** reference existing VPCs, subnets, roles, or buckets.
* **All Lambda functions in private subnets** and **X-Ray tracing enabled**.
* **SSE-S3** for buckets; **PITR** for DynamoDB.
* **Throttling 1000 RPS** at API Gateway (stage/method settings).
* **Request validation** for custom headers.
* **AWS_IAM** authorization on API methods.
* **Timeout 30s / Memory 512 MB** on all Lambdas.
* **Reserved concurrency** set exactly as specified.
* **DLQ via SQS** for all Lambdas.
* **Headers `X-Exchange-Signature` and `X-Webhook-ID`** must arrive in Lambda event payloads.

# Inputs / Parameters (define in the template):

* `EnvironmentName` (e.g., `prod`, `staging`, `dev`) and a separate `ENVIRONMENT_SUFFIX` used in **all resource names**.
* `ApiStageName` (default `v1` or `prod`).
* `WebhookApiKeyParamPath` (SSM path for an exchange API key).
* `ValidatorSecretParamPath` (SSM path for signature secret).
* `ProcessorApiKeyParamPath` (SSM path or similar for downstream services).
* Optional: VPC CIDR and subnet CIDRs (provide sensible defaults).
* Optional: Flags to choose VPC endpoints vs. NAT (default to VPC endpoints).

# Naming convention:

* **Every** resource name must include the **`ENVIRONMENT_SUFFIX`** (e.g., `webhook-raw-${ENVIRONMENT_SUFFIX}`, `WebhookTable-${ENVIRONMENT_SUFFIX}`, `ReceiverFn-${ENVIRONMENT_SUFFIX}`).
* Keep names DNS-safe where required.

# Authoring expectations (best practices):

* Prefer **Lambda proxy integration** for API Gateway so headers are natively available; still declare `method.request.header.*` to enforce presence and use integration request mapping if needed to make intent explicit.
* Create **CloudWatch Log Groups** as explicit resources with **RetentionInDays: 7**; grant each Lambda permissions to create/log streams.
* Use **dynamic SSM references** in **Environment** values (not in Parameters’ Default).
* Use **Outputs** to expose:

  * The API invoke URL: `https://<restApiId>.execute-api.<region>.amazonaws.com/<stage>`
  * The DynamoDB table name.
* Add explicit **DependsOn** where creation order matters (e.g., Deployment depends on Methods).
* Include **minimal inline Lambda handler code** via `Code.ZipFile` (Node.js and Python) to keep the stack self-contained and deployable. Handlers should parse headers, forward to next Lambda (via AWS SDK), and handle errors by letting DLQ capture failed events.
* Add **UsagePlan/ApiKey** only if necessary for throttling; prefer **Stage/Method settings** to enforce 1000 RPS without API keys since **AWS_IAM** is the auth mechanism.

# Deliverable:

Provide a **single** CloudFormation file named **TapStack.yml** with:

* `AWSTemplateFormatVersion`, `Description`, `Parameters`, `Mappings` (if any), `Conditions` (if used), `Resources`, and `Outputs`.
* Fully defined **VPC**, **subnets**, **route tables** (and either **VPC endpoints** or **NAT** as chosen), **security groups**, **API Gateway** (REST API, Resources, Methods, Validator, Models, Deployment, Stage with throttling and logs), **S3 bucket** (raw payloads, SSE-S3, lifecycle to Glacier at 30 days), **DynamoDB table** (on-demand, PITR, keys), **SQS DLQ**, **CloudWatch Log Groups** (7-day retention), **three Lambda functions** (runtimes, X-Ray, env vars with SSM dynamic refs, VPC config, reserved concurrency, DLQ), and **IAM roles/policies** with least privilege per function.
* **No placeholders** that require external resources; everything must be created by this template.
* **Outputs**:

  1. `ApiInvokeUrl` (complete invoke URL including stage),
  2. `WebhookTableName` (DynamoDB table name).

# Acceptance criteria:

* All resource logical IDs and **physical names** include `ENVIRONMENT_SUFFIX`.
* Stack deploys without referencing existing resources.
* API methods require `X-Exchange-Signature` and `X-Webhook-ID` and use **AWS_IAM** authorization.
* Stage/method throttling set to **1000 requests/second** with appropriate burst.
* Lambdas have **512 MB**, **30 s timeout**, **ReservedConcurrency** as specified, **X-Ray Active**, **DLQ** configured, and run in **private subnets**.
* S3 bucket uses **SSE-S3** and transitions to **Glacier at 30 days**.
* DynamoDB **PITR enabled**; keys as specified; **PAY_PER_REQUEST** billing.
* Outputs return the correct API invoke URL and table name.

# Formatting notes:

* Produce **only** the YAML contents of **TapStack.yml** (no commentary before/after).
* Use clear comments within YAML to explain non-obvious choices (brief).
* Keep logical sections tidy and grouped; avoid extraneous blank lines.
* Do not include conversational text or filler—**just the template**.
