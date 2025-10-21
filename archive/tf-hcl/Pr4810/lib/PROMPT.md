Create Terraform code for a centralized CloudTrail log analytics platform that processes and analyzes logs from 100 AWS accounts. The system needs efficient querying with Athena, automated processing, real-time alerting, and interactive QuickSight dashboards for security, compliance, and operational insights.

Here's what I need:

**CloudTrail Organization Setup**
Set up an organization trail (or individual trails per account if not using AWS Organizations) that collects logs from all 100 accounts. Enable both management events and data events. Make it multi-region to capture activities everywhere. Turn on log file validation for integrity checks.

Store all logs in a centralized S3 bucket in a dedicated logging account. Organize with prefixes: AWSLogs/{AccountId}/{Region}/{Year}/{Month}/{Day}/

**Storage Configuration**
Create the central S3 bucket with:

- Versioning enabled
- KMS encryption with customer-managed key
- Intelligent partitioning structure for Athena
- Lifecycle policies: move to Intelligent-Tiering after 30 days, Glacier after 90 days, delete after 7 years (all configurable)
- Object Lock in compliance mode for tamper-proof retention
- Optional cross-region replication to backup bucket

Create separate buckets for:

- Athena query results (with 30-day lifecycle deletion)
- Enriched/processed logs
- Compliance reports

**Glue Data Catalog**
Set up AWS Glue crawler that:

- Runs daily (configurable schedule via cron expression)
- Discovers CloudTrail log schema automatically
- Creates partitioned tables by account, region, and date
- Updates Glue Data Catalog with new partitions
- Uses custom classifiers for CloudTrail JSON if needed

Create Glue databases for:

- Raw CloudTrail logs (management events)
- Data events (if separate)
- Enriched logs

Configure crawler to handle nested JSON and array fields properly.

**Athena Setup**
Create an Athena workgroup with:

- Dedicated query result location in S3
- Data usage controls (bytes scanned per query limit - configurable)
- Query timeout settings
- Encryption for query results

Create named queries for common patterns:

- Failed console logins by account and user
- All IAM policy changes with before/after details
- Root account usage
- Resource deletions (EC2, RDS, S3 buckets, etc.)
- Cross-account assume role activities
- Security group modifications allowing public access
- KMS key usage and modifications
- API calls by service and count
- High-cost actions (launch large instances, create resources)
- Events from specific IP addresses or regions

Make these queries parameterized where useful (date ranges, account IDs, etc.).

**Log Processing Pipeline**
Build a Lambda function (Python 3.12) that processes new CloudTrail logs:

- Triggered by EventBridge rule when new logs arrive in S3
- Parse CloudTrail JSON events
- Enrich with metadata: add cost center tags, environment labels, risk scores
- Normalize user identities (IAM users, roles, federated users)
- Flag high-risk actions (iam:AttachUserPolicy, s3:PutBucketPolicy with public access, etc.)
- Convert to Parquet format for cost-efficient Athena queries
- Write enriched data to separate S3 prefix with same partitioning scheme

Handle different CloudTrail record structures (management vs data events).

Environment variables: SOURCE_BUCKET, TARGET_BUCKET, RISK_ACTIONS_LIST (JSON array), GLUE_DATABASE, GLUE_TABLE

**Security Analysis Engine**
Create a Lambda function that runs hourly (EventBridge scheduled rule):

- Query Athena for the last hour's events using boto3
- Detect security issues:
  - Unauthorized access attempts (errorCode = AccessDenied, UnauthorizedOperation)
  - Privilege escalation (IAM policy attachments, role assumption chains)
  - Compliance violations (creating unencrypted resources, disabling logging)
  - Sensitive API calls (iam:CreateAccessKey, iam:DeleteUser, kms:ScheduleKeyDeletion)
  - Console logins without MFA
- Calculate per-account security score based on findings
- Store results in DynamoDB table with columns: timestamp, account_id, finding_type, severity, details, score
- Publish summary metrics to CloudWatch custom metrics (namespace: Security/CloudTrail)
- Send critical findings to SNS immediately

DynamoDB table needs TTL on timestamp (configurable, default 90 days) and GSI on account_id and finding_type.

**Real-Time Event Alerting**
Set up EventBridge rules with pattern matching for critical events:

- Root account usage (userIdentity.type = "Root")
- Console login without MFA (eventName = "ConsoleLogin" AND additionalEventData.MFAUsed = "No")
- Failed authorization >5 times in 5 minutes (use EventBridge pipe with aggregation)
- IAM policy changes (eventName matching "_Policy_")
- S3 buckets made public (eventName = "PutBucketPolicy" with public access in request)
- Security group rules allowing 0.0.0.0/0 on sensitive ports

Create SNS topics for different severities:

- Critical (immediate response needed)
- High (review within 1 hour)
- Medium (daily review)

Build an alert enrichment Lambda that:

- Receives events from EventBridge
- Adds context (account name, owner, environment)
- Checks for duplicates in last 15 minutes
- Formats as readable message
- Publishes to appropriate SNS topic

**QuickSight Dashboards**
Create QuickSight datasets connected to Athena:

- Security dataset: failed logins, IAM changes, security findings from DynamoDB
- Compliance dataset: audit events by account, violation counts
- Operations dataset: API call volumes, service usage, error rates by service
- Cost dataset: resource creation/deletion events, instance launches

Build dashboards:

1. Security Dashboard showing:
   - Failed login attempts over time (line chart)
   - Top accounts by security findings (bar chart)
   - IAM changes timeline (table)
   - MFA usage rate (KPI)
   - High-risk API calls (heat map)

2. Compliance Dashboard showing:
   - Audit event coverage per account (percentage)
   - Violations by type (pie chart)
   - Compliance score trend (line chart)
   - Recent violations (table)

3. Operations Dashboard showing:
   - API call volume by service (stacked area chart)
   - Error rate by account (bar chart)
   - Most active users (table)
   - Regional activity distribution (map)

4. Cost Dashboard showing:
   - Resource creation events by type (bar chart)
   - Cost-impacting actions timeline (line chart)
   - Top spenders by account (table)

Configure scheduled refresh: hourly for security/operations, daily for compliance/cost.

Set up row-level security in QuickSight limiting users to their own account data.

**Cost Optimization**
Create a Lambda function that runs weekly to:

- Identify small CloudTrail log files in S3
- Combine them into larger Parquet files using PyArrow
- Update Glue catalog partitions
- Delete original small files after successful compaction

This reduces Athena query costs by minimizing file overhead.

Configure Athena workgroup with query result caching (24 hours) to avoid duplicate scans.

**Compliance Reporting**
Build a Lambda that runs on the first day of each month:

- Query Athena for previous month's summary statistics per account
- Generate compliance report including:
  - Total events logged per account
  - High-risk actions count
  - Compliance violations by type
  - Audit coverage verification (check if CloudTrail was active all days)
  - Top 10 most active users
- Create PDF report using ReportLab or HTML/WeasyPrint
- Upload to reporting S3 bucket
- Send via SES to compliance team email list (configurable)

**Monitoring and Health Checks**
Create CloudWatch alarms for:

- CloudTrail log delivery failures per account (metric filter on CloudTrail status)
- Glue crawler failures (crawler run status)
- High Athena costs (bytes scanned > threshold per day)
- Lambda processing delays (execution duration > timeout - 30 seconds)
- QuickSight dataset refresh failures

Build a CloudWatch dashboard showing:

- CloudTrail log delivery status (one widget per account group)
- Glue crawler success rate (line chart)
- Athena query statistics (count, bytes scanned, execution time)
- Lambda invocation metrics (invocations, errors, duration)
- QuickSight dataset refresh status
- DynamoDB table size and consumed capacity

**Access Control**
Create IAM roles:

- AnalystRole: Athena query execution, QuickSight dashboard viewer, S3 read on query results
- SecurityRole: Full access to logs, Athena, DynamoDB findings, Lambda invoke
- ServiceRole-Lambda: For all Lambda functions with specific permissions
- ServiceRole-Glue: For crawler with S3 read and Glue catalog write
- ServiceRole-QuickSight: For Athena query execution and S3 access
- CrossAccountRole: Deployed in each of the 100 accounts for accessing own logs

Configure S3 bucket policies allowing only these roles. Set KMS key policy for decryption access.

**What to deliver:**
Terraform files organized as:

- versions.tf and providers.tf
- variables.tf with inputs for:
  - List of 100 account IDs
  - Lifecycle transition days
  - Alert thresholds and SNS emails
  - Glue crawler schedule
  - Lambda schedules (hourly analysis, daily compaction, monthly reports)
  - Athena workgroup limits
  - QuickSight user lists and permissions
  - Enable/disable flags for optional features
- s3-buckets.tf (central logs, query results, enriched logs, reports)
- cloudtrail.tf (organization trail or per-account trails with data events)
- kms.tf (CMK for logs and encryption policy)
- glue.tf (crawler, databases, tables with partitioning schema)
- athena.tf (workgroup, named queries, result location)
- dynamodb.tf (security findings table with GSI and TTL)
- lambda-log-processor.tf (enrichment Lambda with EventBridge S3 trigger)
- lambda-security-analyzer.tf (hourly security analysis Lambda)
- lambda-alert-enricher.tf (event alert processor)
- lambda-compaction.tf (weekly log file compactor)
- lambda-reporting.tf (monthly compliance reporter)
- eventbridge.tf (rules for real-time alerts and Lambda schedules)
- sns.tf (topics for different severity levels with subscriptions)
- quicksight.tf (data sources, datasets, dashboards, permissions)
- iam-roles.tf (all IAM roles and policies)
- cloudwatch-alarms.tf (alarms for platform health)
- cloudwatch-dashboard.tf (platform monitoring dashboard)
- outputs.tf (bucket names, Athena workgroup, QuickSight dashboard URLs, Lambda ARNs)

Lambda code files:

- lambda/log_processor.py (parse, enrich, convert to Parquet)
- lambda/security_analyzer.py (query Athena, detect issues, score accounts)
- lambda/alert_enricher.py (add context, deduplicate, format)
- lambda/log_compactor.py (combine small files to Parquet)
- lambda/compliance_reporter.py (generate monthly PDF reports)

Also include:

- athena-queries/ folder with .sql files for all named queries
- quicksight-templates/ with dashboard definitions (JSON)
- README.md with:
  - Deployment sequence (CloudTrail → S3 → Glue → Athena → QuickSight)
  - How to add new accounts to the system
  - Query examples and optimization tips
  - Dashboard user guide
  - Cost estimation and optimization strategies
  - Troubleshooting common issues (Glue crawler failures, Athena query errors)
  - Security best practices
  - How to customize alerts and dashboards

**Key considerations:**

- Use Terraform for_each to handle 100 accounts dynamically
- Partition Glue tables by date for query efficiency
- Use Parquet format for 50-70% cost reduction on Athena queries
- Set reasonable Athena workgroup limits to prevent runaway queries
- Include proper error handling and retries in all Lambda functions
- Use Lambda layers for common dependencies (boto3, pandas, pyarrow)
- Set up DLQs for failed Lambda executions
- Enable X-Ray tracing on Lambdas for debugging
- Use Secrets Manager for SES credentials and QuickSight API keys
- Include comprehensive logging in CloudWatch Logs for all components
- Validate that Glue crawler handles nested JSON correctly
- Test QuickSight dashboards with sample data before full deployment

Make everything production-ready with proper error handling, monitoring, and documentation.
