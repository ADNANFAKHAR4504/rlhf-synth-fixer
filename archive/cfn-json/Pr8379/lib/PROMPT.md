You are tasked with designing and deploying a serverless polling and voting system using AWS CloudFormation in us-east-1. The system must collect approximately 5,000 votes daily, support real-time results, and include demographic analysis dashboards for market research. The entire infrastructure should be secure, scalable, and fully managed as Infrastructure as Code.

Infrastructure Requirements
• Amazon API Gateway for secure vote submission with request validation and throttling to prevent vote flooding.
• AWS Lambda (Python 3.10) for vote processing with idempotency tokens to prevent duplicate submissions.
• Amazon DynamoDB for storing votes and results, using atomic counters for accurate and concurrent vote tallying.
• Amazon ElastiCache (Redis) for caching real-time vote counts and improving read performance.
• Amazon CloudWatch for collecting metrics, monitoring vote activity, and setting up alarms.
• Amazon S3 for exporting and archiving voting results.
• Amazon EventBridge for scheduling automated result generation and triggering downstream processes.
• Amazon QuickSight for demographic analysis and data visualization dashboards.
• AWS IAM roles and policies granting least-privilege access to all Lambda functions and services.

Implementation Requirements
• Enforce idempotency in Lambda to avoid duplicate votes.
• Use DynamoDB atomic counters for vote tally updates.
• Cache real-time vote results in ElastiCache for low-latency access.
• Configure API Gateway throttling to mitigate abuse.
• Use EventBridge scheduled rules for periodic result generation and S3 export.
• Visualize voting and demographic metrics in QuickSight dashboards.
• All parameters (region, table names, bucket names, resource ARNs, etc.) must be parameterized in CloudFormation — no hardcoded values.
