# Infrastructure Requirements for Metrics Aggregation System

Create infrastructure code using Pulumi Python for a metrics aggregation system in AWS region us-east-2.

## System Overview

Build a monitoring service that aggregates 12,400 daily metrics from distributed applications with alerting capabilities. The system needs to ingest metrics via REST API, process them, store time-series data, and send alerts when thresholds are breached.

## Required AWS Services

Implement the following AWS services:

1. **API Gateway** - REST API for metric ingestion endpoint
2. **Lambda** - Python 3.10 function for metric processing with reserved concurrency set to 100
3. **Timestream** - Time-series database with 1-hour memory store retention for metric storage
4. **DynamoDB** - Table for storing alert configurations and thresholds
5. **SNS** - Topic with filter policies for routing threshold alerts
6. **S3** - Bucket for exporting aggregated metrics
7. **CloudWatch** - System metrics and alarms for monitoring the infrastructure
8. **IAM** - Roles and policies for service access

## Architecture Details

The system flow should work as follows:
- API Gateway receives metric data and triggers Lambda
- Lambda processes metrics and writes to Timestream
- Lambda checks alert configurations in DynamoDB
- If thresholds are exceeded, Lambda publishes to SNS
- SNS routes alerts based on filter policies
- CloudWatch monitors system health
- S3 stores exported metrics for archival

## Specific Configuration Requirements

- Lambda function must use Python 3.10 runtime
- Lambda reserved concurrency must be set to 100
- Timestream memory store retention must be 1 hour
- SNS must include filter policies for alert routing
- All resources must be deployed in us-east-2 region
- Use AWS EventBridge Scheduler for automated metric exports to S3
- Implement AWS X-Ray tracing for distributed tracing across services

## Implementation Notes

Include proper error handling, logging, and monitoring. Export important resource ARNs and endpoints. Use descriptive resource names with environment suffixes.

Provide the infrastructure code in Python using Pulumi SDK. Include all necessary imports, resource definitions, IAM policies, and exports. The code should be production-ready and follow best practices for security and scalability.