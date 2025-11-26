Problem Context

Build a serverless, production-ready payment webhook processing system in a single Terraform file (main.tf) using HCL for Terraform 1.5+.

Deployment target: AWS us-east-1, AWS provider ~> 5.x.

System ingests POST webhooks from multiple payment providers via API Gateway, performs validation, handles idempotency and orchestration, persists short-term state in DynamoDB, reliably queues work in SQS, and runs complex flows using Step Functions. Must support multi-tenant isolation (separate execution contexts per payment provider) and handle bursty traffic at scale.

Core Implementation Requirements

Use API Gateway (REST API) for webhook ingestion with Lambda proxy integration for POST endpoints. Implement request throttling at 10,000 requests per second (set method/stage throttling_rate_limit and burst limit appropriately) and enable API Gateway access logs.

Create 3 Lambda functions (container images stored in private ECR):

webhook_validator — validate signatures & multi-tenant routing

payment_processor — core payment logic

notification_dispatcher — send notifications

Lambdas must use ARM/Graviton2 (architecture = "arm64"), 512 MB memory, 30s timeout, and reserved_concurrent_executions set via variables. Each Lambda must have a private ECR image reference.

DynamoDB table(s) for idempotency and state:

Partition key: webhook_id (string)

TTL attribute: processed_timestamp

Billing mode: PAY_PER_REQUEST (on-demand)

Point-in-time recovery (PITR) enabled

SQS queues for reliable processing:

Processing queues with visibility_timeout matching Lambda execution time (30s) and message_retention_seconds = 4 days.

Dead Letter Queues (DLQs) for failed messages with exactly 14 days retention.

Step Functions state machine for orchestrating validation → fraud detection → processing → notification:

Include retry behavior with exponential backoff and jitter (use Step Functions Retry with BackoffRate and IntervalSeconds and document how jitter is implemented).

Output the state machine ARN.

EventBridge rules to route processed payment events to different targets by payment_type and amount thresholds.

S3 bucket for archival:

Intelligent tiering enabled

Lifecycle policy: move to archiving class after 30 days

Event notification to trigger an archival Lambda for payments older than 30 days

CloudWatch Log Groups:

Create a log group per Lambda and API Gateway access logs with 7-day retention

VPC endpoints for private communication (at least for ECR/DynamoDB/SQS as needed for private ECR pulls).

Multi-tenant isolation:

Provide variables/structuring so each payment provider can have separate prefixes, IAM roles/permissions, and logical isolation within the same account.

Outputs must include:

API endpoint URL

SQS queue URLs (processing queues and DLQs)

Step Functions state machine ARN

No deletion protection or prevent_destroy anywhere — ensure lifecycle blocks do NOT set prevent_destroy and avoid any resource deletion protections.

Constraints 

Terraform 1.5+; use HCL, not JSON.

AWS provider ~> 5.x.

Lambdas must use ARM (arm64) container images in private ECR.

DynamoDB: on-demand billing (PAY_PER_REQUEST) + PITR = true.

API Gateway: throttling_rate_limit = 10000 req/s (and a reasonable burst limit).

All Lambda functions must have reserved concurrent executions (use variable-driven values).

SQS: message_retention_seconds = 4 days (345600 seconds) for main queues; DLQs retention = 14 days (1209600 seconds).

Lambda visibility timeout / SQS visibility timeout must match Lambda timeout (30s).

CloudWatch log retention for Lambda and API Gateway must be 7 days.

Step Functions must implement retries using exponential backoff + jitter.

S3: enable Intelligent-Tiering and lifecycle rules to archive after 30 days.

No resource should be created with deletion protection or prevent_destroy lifecycle.

All Lambdas must reference images from private ECR repos (create repos in Terraform).

Keep resource names parameterized (use variables) for environment and provider prefixes.

Ensure IAM roles/policies follow least privilege principle (include comments showing intent).

Expected Output 

One single Terraform file named main.tf that:

Is fully functional HCL and follows Terraform v1.5 syntax.

Is logically organized and well-commented with labeled sections (providers, variables, locals, iam, ecr, lambdas, api gateway, dynamodb, sqs, step-functions, eventbridge, s3, logs, outputs).

Includes variable blocks for environment-specific settings (region, env name, provider list, concurrency settings, thresholds, S3 lifecycle days, queue retention seconds, etc).

Creates all required resources described above and wires them together (lambda ==> api gateway, lambda ==> sqs, step functions ==> lambdas, eventbridge rules, s3 notifications to archival lambda).

Includes the Step Functions JSON or Amazon States Language definition inline using aws_sfn_state_machine resource or aws_sfn_state_machine definition with proper retry configuration (exponential backoff + jitter).

Creates CloudWatch log groups with retention_in_days = 7 and links them.

Sets API Gateway throttling to 10,000 rps at the stage/method level.

Exposes outputs: api_endpoint_url, processing_queue_urls (map), dlq_urls (map), state_machine_arn.

All ECR repos are private and used by the Lambda resources (referenced as image_uri variables or data lookups).

Uses variables and for_each/dynamic blocks to support multiple payment providers (multi-tenant) while still being one file.

Avoids any prevent_destroy or deletion protection. (If a resource type supports deletion protection, explicitly set it to false.)

Includes short inline comments where non-obvious tradeoffs are made (e.g., Step Functions jitter approach).

Important: Return only the content of the main.tf file (the full HCL for that single file).

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.