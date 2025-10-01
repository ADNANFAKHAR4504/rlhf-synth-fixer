ROLE: You are a senior Terraform engineer.

CONTEXT:
A logistics firm processes ~1,000 delivery notifications per day and needs a fully serverless, asynchronous pipeline with reliable queuing, efficient processing, DLQ handling, and basic monitoring, while keeping operational overhead low.

TOOLING:
Generate Terraform (HCL) for AWS. Assume the region is already configured in the provider.

HARD CONSTRAINTS (FOLLOW EXACTLY):

Do not include any README or examples.

Assume provider.tf already exists and is correct; do not modify or recreate it.

Create all resources in a single file named tap_stack.tf.

Provide a variables.tf file for inputs.

Add clear inline comments explaining key resources, design choices, and operational tuning.

REQUIREMENTS (BUILD EXACTLY THIS):

SQS Queues

A standard SQS queue for tasks (delivery notifications).

A DLQ (dead-letter queue) with a redrive policy; set maxReceiveCount (variable, default 5).

Set appropriate visibility timeout (variable, default ≥ 30s; coordinate with Lambda timeout).

SSE using SQS-managed KMS key (default) and enforce best-practice queue attributes (long polling receive_wait_time_seconds, message retention, etc.).

Lambda (Node.js 18)

A Lambda function (Node.js 18) that processes SQS messages and writes outcome/status to DynamoDB.

SQS event source mapping to the main queue with tunable batch_size and maximum_batching_window_in_seconds.

Function timeout sized to work with SQS visibility; recommend default 15–30s via variable.

CloudWatch Logs retention (variable, default 14 days).

Package code using archive_file from a local path or inline template (your choice) but keep the entire IaC in tap_stack.tf.

DynamoDB

A table for task status tracking with a partition key task_id (String).

On-demand (PAY_PER_REQUEST) billing mode.

Optional TTL attribute (variable, default off) for auto-expiring old status items.

IAM (least privilege)

Execution role + policies for Lambda to:

Read from SQS (including delete on success),

Put/update items in DynamoDB,

Write to CloudWatch Logs.

Allow Lambda to read queue attributes for adaptive behavior (optional).

Monitoring & Alarms (CloudWatch)

Alarms for:

ApproximateAgeOfOldestMessage (queue delay/backlog),

ApproximateNumberOfMessagesVisible (backlog size),

Lambda Errors and Throttles,

DLQ message count > 0 (immediate action signal).

Optional Dashboard is not required; keep to essential alarms.

Retry Strategy

Use SQS + Lambda defaults (multiple receives) with maxReceiveCount → DLQ.

Document via inline comments how visibility timeout + Lambda timeout + batch size interact.

Outputs

Queue URL/ARN, DLQ URL/ARN, Lambda ARN, Event Source Mapping UUID, DynamoDB table name/ARN, key alarm ARNs.

Tagging

Apply a tags map to all resources: at least Project, Environment, Owner, and CostCenter.

ASSUMPTIONS & DEFAULTS:

Use AWS-managed KMS for SQS SSE by default; allow variable to switch to a supplied KMS CMK if needed.

Reasonable defaults for: batch size (e.g., 10), max batching window (e.g., 2s), Lambda timeout (e.g., 20s), visibility timeout (e.g., 60s), message retention (e.g., 4 days), long polling (e.g., 20s).

DynamoDB TTL attribute name (e.g., expires_at) is a variable; disabled by default.

BEST PRACTICES (MANDATORY):

Least privilege IAM, explicit actions and resources.

Idempotence (no hard-coded dynamic IDs), use data sources where appropriate.

Operational safety: sensible defaults for timeouts, batching, and redrive; logs retention not infinite.

Scalability: event source mapping parameters tunable via variables; no hard-coded concurrency caps unless provided as variables.

Comments: explain visibility vs. timeout, DLQ tuning, and cost-impacting settings.

DELIVERABLES (OUTPUT EXACTLY THESE TWO FILES):

variables.tf – Inputs for: names/prefix, tags map, SQS settings (visibility timeout, retention, long polling, maxReceiveCount), Lambda settings (memory, timeout, batch size, max batching window, log retention), optional KMS key for SQS, DynamoDB TTL toggle/name, and optional provisioned concurrency (boolean, default false).

tap_stack.tf – All resources: SQS main queue + DLQ with redrive, IAM role/policies, Lambda function + event source mapping, DynamoDB table (on-demand, optional TTL), CloudWatch log group, CloudWatch alarms, and outputs.

OUTPUT FORMAT (IMPORTANT):
Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:

# variables.tf
...

# tap_stack.tf
...


VALIDATION CHECKS (AS COMMENTS + TERRAFORM WHERE APPLICABLE):

Confirm SQS main queue and DLQ are created with redrive correctly wired and SSE enabled.

Check Lambda timeout < SQS visibility timeout and event source mapping uses the configured batch parameters.

Ensure IAM policies are least privilege and scoped to the created resources.

Verify alarms target the correct metrics and ARNs are output.

Confirm DynamoDB is on-demand and not publicly accessible; TTL optional.

Please generate the complete Terraform implementation now, following the above structure and constraints, with clear inline comments inside the code.