a fully serverless, cross-region, fraud-detection system, defined entirely in Terraform (HCL).
The design needs to stay clean, production-grade, and easy to maintain. Everything should deploy automatically from a single Terraform configuration file (tap_stack.tf) without external packaging steps.

The Big Picture -

We’re setting up an event-driven architecture that can process millions of financial transactions daily, detect fraud in near-real-time, and stay resilient across AWS regions.
The primary deployment lives in us-east-1, with a disaster-recovery mirror in us-west-2 using EventBridge Global Endpoints for event replication.
All infrastructure resources — Lambdas, queues, DynamoDB, S3, EventBridge rules — should use AWS-managed KMS keys for encryption at rest. No customer-managed keys are required anywhere.

Networking Foundation-

Each region will have its own VPC, built from scratch, so traffic isolation and routing are clear and non-overlapping.

us-east-1 (Primary Region)
VPC CIDR: 10.0.0.0/16

Two public subnets (e.g., 10.0.1.0/24, 10.0.2.0/24)
Two private subnets (e.g., 10.0.3.0/24, 10.0.4.0/24)

One Internet Gateway (IGW) attached to the VPC
One NAT Gateway placed in a public subnet
Separate route tables for public and private networks

us-west-2 (Disaster-Recovery Region)
VPC CIDR: 10.1.0.0/16
Two public subnets (10.1.1.0/24, 10.1.2.0/24)
Two private subnets (10.1.3.0/24, 10.1.4.0/24)
Its own IGW and NAT Gateway
Mirrored routing and tagging scheme
These networks give Lambda and other resources private outbound access (via the NAT) while keeping inbound surfaces minimal.

Serverless Core — Lambda Functions (Inline)-

We’ll deploy three Lambda functions defined directly inside tap_stack.tf using the filename or source_code_hash from inline code blocks — no ZIP packaging, no ECR container images.

Ingestion Lambda-
Receives raw transaction events (likely from API Gateway or direct publish)
Publishes normalized events to EventBridge

Fraud Scoring Lambda-
Triggered by EventBridge rule filters
Runs fraud-scoring logic and stores results in DynamoDB

Alert Processor Lambda-
Reacts to flagged transactions
Writes summarized reports to S3 for compliance and archiving

All Lambdas:
Runtime: Python 3.11
Inline code defined via Terraform source_code_hash with filename using templatefile() or zip_file argument containing the function logic
Reserved concurrency limits for cost control
X-Ray tracing and CloudWatch Logs enabled
Environment variables encrypted with AWS-managed KMS key
IAM roles restricted by least-privilege inline policies
Each connected to its own FIFO SQS queue with 14-day retention and content-based deduplication

Event Routing — Amazon EventBridge-
EventBridge is the central event bus.
A custom event bus handles all transaction events.
Rules use content-based filtering:
e.g., amount > 10000 routes to Fraud Scoring Lambda
transaction_type = "international" routes to Alert Processor
EventBridge Global Endpoints replicate events cross-region between us-east-1 and us-west-2 for DR.

Data Layer — DynamoDB Global Tables-
Two DynamoDB tables:
fraud_scores
transaction_metadata

Both tables use:
On-demand billing
Composite primary key (transaction_id, timestamp)
Point-in-time recovery (PITR)
AWS-managed KMS encryption
Configured as Global Tables across both regions.

Storage and Queues-

S3 Bucket
Stores suspicious transaction reports and audit data.
Server-side encryption (SSE-S3)
Versioning enabled for bucket in both the regions
Lifecycle rule: archive to Glacier after 90 days
Cross-region replication to DR region

SQS Queues-
Each Lambda has an associated FIFO queue and DLQ with:
Content-based deduplication
14-day message retention
Server-side encryption using AWS-managed keys

Monitoring and Observability-
CloudWatch Alarms
Lambda errors and throttles
DynamoDB throttling
SQS message age
Alerts delivered through SNS or EventBridge rule
Tracing and Logs
AWS X-Ray enabled on all Lambdas
Log retention configured per function

Lambda Destinations
Success: publish to EventBridge for chaining workflows
Failure: push to DLQ (SQS)

IAM and Security-
All IAM policies follow least-privilege.
Each Lambda gets its own execution role with the minimum permissions required for SQS, DynamoDB, S3, and EventBridge operations.
All encryption uses AWS-managed KMS keys only — no custom key management overhead.

Resource naming convention:

{environment}-{service}-{resource_type}-{fixed_suffix}
Example: prod-fraud-lambda-alert-slmr

Terraform Notes-
Use for_each and dynamic blocks to manage multi-region and multi-resource creation
All resources, outputs, and locals defined within tap_stack.tf for single-file simplicity

Expected Outputs
for all the resources being created in the tap_stack.tf.


