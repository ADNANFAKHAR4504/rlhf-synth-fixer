You are a senior AWS solutions architect. Produce a single CloudFormation **YAML** template for **eu-central-1** that deploys an automated **infrastructure analysis and compliance validation system** for a financial-services environment.

Goal
- Validate CloudFormation stack configurations against security policies.
- Run deep inspections of stack resources, generate detailed JSON audit reports, and send alerts on violations.
- Provide full traceability (who/what/when/why) for auditors.

Architecture (do not rely on managed compliance services; build it with these components)
1) **Lambda functions (Python 3.12)**:
   - One “analyzer” function that:
     - Enumerates stacks and resources, pulls templates (GetTemplate / GetTemplateSummary), and inspects live configuration (DescribeStacks, ListStackResources, etc.).
     - Validates: encryption at rest, public exposure risks, required tags, and cross-stack reference integrity (verify every ImportValue resolves to an existing Export in the same account/region; flag missing/mismatched exports).
     - Produces **per-stack JSON reports** with findings, timestamps, triggering event metadata (including request IDs), and a deterministic “evaluationId”.
     - Writes reports to an encrypted S3 bucket path by account/region/stackId/date.
     - Publishes violation summaries to SNS.
   - One “periodic-scan” function (Python 3.12) that runs on a schedule to ensure evaluations occur within 15 minutes of changes if any event was missed.

   Implementation constraints for all functions:
   - **Runtime:** python3.12
   - **Timeout:** up to 300 seconds
   - **Memory:** reasonable default (e.g., 512–1024 MB)
   - **Env encryption:** use a customer-managed KMS key for Lambda environment variables
   - **DLQ:** attach an encrypted SQS DLQ
   - **Logging:** send to dedicated CloudWatch Log Groups (see logging requirements)

2) **EventBridge rules**:
   - Event-driven triggers for stack lifecycle (create/update/change set executions).
   - A scheduled rule (e.g., every 5–10 minutes) that invokes the “periodic-scan” to meet the 15-minute evaluation requirement.
   - All targets invoke the analyzer or periodic-scan Lambda with structured input (include event source, account, region, and stack identifiers).

3) **S3 report storage**:
   - Buckets for “compliance-reports” and “analysis-results”.
   - **Versioning enabled**, **Block Public Access = true** (all four flags).
   - **SSE-KMS** with a **customer-managed CMK** created in this template; do not use S3 managed keys.
   - **Lifecycle policy:** transition report objects to **Glacier Flexible Retrieval** after **90 days** and retain versions; no public access.
   - Least-privilege bucket policies allowing only the analyzer functions to write and read required prefixes.

4) **CloudWatch Logs**:
   - Dedicated Log Groups for each function with **retention = 365 days**.
   - Log groups encrypted with the same customer-managed KMS key.

5) **KMS**:
   - Create a single CMK used by S3, CloudWatch Logs, SNS, SQS DLQs, and Lambda environment encryption.
   - Key policy grants only necessary principals and includes clear admin separation.
   - Alias provided (parameterizable).

6) **SNS notifications**:
   - A topic for **compliance violations**. Encrypt the topic with the CMK.
   - Add an **email subscription** (parameter).
   - The analyzer publishes a concise violation summary with a link (S3 URI) to the full JSON report.

7) **IAM (least privilege + explicit denies)**:
   - Separate execution roles for the analyzer and periodic-scan functions.
   - Grant only required read/list/describe actions for CloudFormation, Tagging API, and selected services inspected (e.g., S3 head/list for report buckets, KMS encrypt/decrypt for specific keys, SNS:Publish to the specific topic, SQS for its DLQ).
   - Add **explicit Deny** statements to prevent sensitive actions (examples: `kms:ScheduleKeyDeletion`, `kms:DisableKey`, `s3:PutBucketAcl` with public grants, wildcard `iam:PassRole`).
   - Use resource-level scoping and condition keys wherever possible.

8) **Compliance checks implemented by code** (run in the analyzer):
   - **Unencrypted resources**: flag storage, logs, queues, topics, and data stores that lack customer-managed encryption where applicable.
   - **Public access**: flag buckets, load balancers, and other endpoints with public exposure unless explicitly allowed by a parameterized allowlist.
   - **Missing tags**: require a parameterized set of mandatory tags (e.g., `Owner`, `CostCenter`, `Environment`); report any resource missing them.
   - **Cross-stack references**: parse each stack template, find all `Fn::ImportValue` usages, and confirm a matching Export exists and is healthy; include a dependency graph in the report.

9) **Traceability and reports**:
   - JSON schema includes: evaluationId, account, region, stackName, stackId, templateHash, resource findings with ARNs and reasons, rule names, severity, remediation hints, event time, and trigger type (event-driven vs scheduled).
   - Store a compact summary object and a full detailed object per evaluation.

10) **Parameters and outputs**:
   - Parameters: Email for SNS subscription, list of required tags, allowlist for permitted public endpoints (if any), report bucket names (optional), KMS key alias, schedule rate, and evaluation severity threshold for alerts.
   - Outputs: ARNs and names for buckets, topic, functions, KMS key/alias, EventBridge rules, and the S3 base URI for reports.

Security and compliance requirements (must implement)
- All at-rest data uses **SSE-KMS with a customer-managed key** (S3, Logs, SNS, SQS DLQ, Lambda env).
- **CloudWatch Logs retention = 365 days**.
- **S3 Block Public Access** enabled on all buckets.
- **S3 lifecycle** transitions reports to **Glacier after 90 days**.
- Lambda **runtime python3.12**, **timeout ≤ 300s**.
- Evaluations must occur within **15 minutes** of stack changes (event-driven + scheduled backstop).
- IAM roles adhere to least privilege and include **explicit Deny** guardrails for risky actions.
- No plaintext secrets in the template.

Template quality
- Single YAML template, clearly commented.
- Logical IDs and names are deterministic and environment-aware.
- Use Conditions/Parameters to keep it reusable.
- Include reasonable defaults and meaningful descriptions.

Deliverable
- A single CloudFormation YAML file implementing everything above. No placeholders for the core logic; include inline Lambda code (Python 3.12) sufficient to perform the described inspections and produce JSON reports.
