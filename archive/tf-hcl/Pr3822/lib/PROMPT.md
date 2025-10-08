# Centralized Logging Infrastructure for Manufacturing Company

I need to create a centralized logging infrastructure for a manufacturing company with 12 distributed applications. Each day, these applications generate approximately 15,000 log entries that need to be collected, processed, and stored for analysis.

## Requirements

Deploy the following infrastructure in the us-east-2 region:

1. Create CloudWatch Log Groups for 12 applications. Name them based on application identifiers (app-01 through app-12).

2. Set up Kinesis Data Firehose delivery streams to aggregate logs from CloudWatch Log Groups and deliver them to S3. Use the latest dynamic partitioning feature to organize logs by application and date.

3. Configure S3 bucket for long-term log storage with appropriate lifecycle policies. Logs should be partitioned by application name and date (year/month/day format).

4. Create Lambda function to transform log data before storage. The transformation should parse and format the log entries.

5. Set up CloudWatch Insights queries to analyze logs across all applications.

6. Configure KMS encryption for all data at rest in S3 and in-transit through Kinesis.

7. Create IAM roles and policies to enable cross-account access for external audit teams.

## Specific Constraints

- All logs must be compressed using GZIP compression before being stored in S3
- Partition logs in S3 by application name and date (format: application=app-XX/year=YYYY/month=MM/day=DD/)
- Retain raw logs in CloudWatch Log Groups for 90 days, then delete them
- Kinesis Firehose should buffer logs for 60 seconds or 1 MB before delivery
- Enable CloudWatch Logs automatic decompression in Firehose for processing

## Deliverables

Provide complete Terraform infrastructure code with:
- All resource definitions in separate logical files
- Proper IAM roles and policies for all services
- Variables for configuration flexibility
- Outputs showing important resource ARNs and names

Generate the infrastructure code as separate code blocks, one for each file that needs to be created.
