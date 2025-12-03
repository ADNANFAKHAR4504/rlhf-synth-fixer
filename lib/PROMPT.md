You are an expert AWS Cloud Development Kit (CDK) engineer who outputs production-ready TypeScript CDK code (CloudFormation via CDK v2). Generate one TypeScript file named bigDataPipeline.ts that implements a full big-data processing pipeline exactly as described below. Do NOT change, remove, or reinterpret any of the provided data — keep every requirement, constraint, and environment detail intact.

Important naming rule: All resource names must use prefix "fin-" followed by the service name and purpose (example: "fin-s3-raw"). Where names must be unique, append a configurable string suffix. Place the default suffix at the top of the file as: const nameSuffix = "-dev01".

Problem to solve: Design and implement a scalable financial transaction data pipeline using AWS CDK and TypeScript that meets the following numbered requirements exactly:

Create three S3 buckets: raw data ingestion, processed data, and failed records.
Set up an AWS Glue database and Glue table schemas for transaction data with columns: transaction_id, customer_id, amount, timestamp, merchant_id, transaction_type, status.
Deploy Glue ETL jobs that transform CSV files into Parquet format with compression.
Configure Glue crawlers to automatically discover new data partitions daily.
Create Athena workgroups with 5 GB data scan limits per query.
Build CloudWatch dashboards showing Glue job success rates, processing times, and data volume metrics.
Implement EventBridge rules to trigger Glue ETL jobs when new files arrive in the raw S3 bucket.
Configure DLQ handling for records that fail validation rules (amount > 0, timestamp format).
Set up S3 data retention with Intelligent Tiering for cost optimization.
Create an SNS topic to alert teams if ETL processing exceeds the 2-hour SLA.
Expected output: A complete CDK application deploying all pipeline infrastructure, including IAM roles, Glue jobs, KMS encryption, monitoring, partitioning logic, ETL scheduling, and error handling. The CDK output must expose: Glue job names, S3 bucket names, Athena workgroup names, EventBridge rule ARNs, SNS topic ARN, and CloudWatch dashboard URLs.

Environment:

AWS region: us-east-1
Data lake stored in S3, ETL using AWS Glue, ad-hoc SQL via Athena
Requires CDK 2.x, TypeScript, Python 3.8+ for Glue job scripts
VPC endpoints for S3 and Glue required so traffic never leaves AWS backbone
Glue jobs run inside private subnets with restricted SGs
Data arrives as compressed CSV files requiring validation and transformation
Supports both batch and interactive analytics
Constraints & implementation details:

Use PySpark-based Glue ETL jobs that write Parquet with compression (Snappy preferred).
Implement data partitioning by date and transaction_type.
Glue crawlers run only during off-peak hours (2 AM – 5 AM UTC).
Include DLQ S3 bucket or SQS queue for failed record handling.
Athena workgroups must enforce query cost limits and store results in a dedicated results bucket.
S3 lifecycle policies must move old data to Glacier after 90 days.
Create separate IAM roles for Glue ETL jobs, crawlers, and Athena queries (least privilege).
CloudWatch dashboards show ETL duration, job failures, crawler status, and processed data volume.
SNS notifications must fire upon SLA breach (job > 2 hours) or job failure.
Use Glue DataBrew or custom validation logic for data quality checks.
Glue job scripts must be stored in an S3 bucket using a well-defined prefix.
All data at rest must use SSE-KMS; all data in transit must enforce TLS.
All resources requiring uniqueness must append nameSuffix.
No plaintext credentials in code; use IAM roles everywhere.
Deliverables:

Produce a single TypeScript file bigDataPipeline.ts containing a fully functional CDK v2 app and stack.
Include a configuration block at the top for: region, account, nameSuffix, S3 names, Glue job settings.
Include inline comments explaining decisions, configurations, and how to modify key parameters.
Outputs section of the stack must show: S3 buckets, Glue database/table name, Glue job name, Athena workgroup, CloudWatch dashboard, DLQ resource, SNS topic.
Add a brief post-deployment validation checklist as comments (how to run a test query, check Glue job logs, confirm lifecycle policies).
(Optional) Include a Jest test file sample to validate: S3 lifecycle exists, Glue job configured with correct script, Athena workgroup has scan limit.
Non-functional requirements:

Follow security best practices (SSE-KMS, blocked public access, VPC isolation).
Use idiomatic modular CDK TypeScript.
No assumptions or reinterpretation — implement exactly the items listed.
Final instruction: Produce only the CDK TypeScript code for bigDataPipeline.ts (plus optional test example).