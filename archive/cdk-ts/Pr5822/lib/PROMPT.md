I need to create a multi-region disaster recovery architecture using AWS CDK (TypeScript).
The system must keep a transaction processing workload online even if the primary region fails.
It should automatically fail over within minutes with zero data loss.

What the infrastructure should include
DynamoDB Global Tables
Deploy DynamoDB Global Tables for transaction data.
Primary region: us-east-1
Secondary region: us-west-2
Enable on-demand billing to handle traffic spikes.
Turn on point-in-time recovery with 35-day retention.
Lambda Functions
Deploy identical Lambda functions in both regions.
Each function processes transactions from its region’s SQS queue.
Set reserved concurrency to avoid throttling during failover.
Use environment variables to reference region-specific endpoints.
Include a dead-letter queue (DLQ) per region with 14-day retention and a max receive count of 3.
SQS Queues
One queue per region for inbound transactions.
Each queue connects to its local Lambda processor.
DLQs capture unprocessed messages.
S3 Buckets
Create S3 buckets for transaction logs and audit trails.
Enable cross-region replication (east→west).
Turn on SSE-S3 encryption and block all public access.
Add lifecycle rules to expire old logs if needed.
Route 53 Health Checks and Failover
Monitor the primary region’s API Gateway or Load Balancer endpoint using Route 53 health checks.
Each health check must evaluate at least 3 data points before declaring failure.
Use a failover routing policy that switches traffic to the secondary region when the primary check fails.
On failover, traffic should route to the west-region endpoint automatically.
CloudWatch Monitoring and Alerts

Create CloudWatch alarms for:
DynamoDB replication lag
Lambda errors
DLQ message count
Route 53 failover events

Each alarm should have a 2-minute evaluation period to prevent false positives.
Configure SNS notifications for failover and alarm events.

VPC and Networking
Create separate VPCs in each region with non-overlapping CIDR blocks.
Set up cross-region VPC peering to allow secure communication between Lambda, DynamoDB, and S3 replication endpoints.
All traffic must remain private — no public subnets.

Tagging

Every resource must include:
Environment
Region
DR-Role

Expected Output
A single-account CDK v2 (TypeScript) application that:
Deploys infrastructure to us-east-1 and us-west-2
Handles automatic Route 53 failover within 5 minutes
Maintains data consistency via DynamoDB Global Tables
Ensures all storage and logs are encrypted and private
Uses CloudWatch and SNS for visibility and alerting
Keeps DLQs for failed transactions and logs for audit
Uses consistent naming and tagging conventions across regions