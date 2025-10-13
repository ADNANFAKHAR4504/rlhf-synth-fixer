Generate infrastructure code for an IoT data pipeline on AWS using Pulumi Python in the us-west-1 region.

The platform needs to process 9,200 daily sensor readings from industrial equipment with real-time anomaly detection capabilities.

Requirements:

1. IoT Core setup for device connectivity with Thing registry and device policies
2. IoT Rules with SQL filtering to route messages based on sensor data patterns
3. Lambda function using Python 3.11 runtime for anomaly detection processing
4. DynamoDB table to store processed sensor data with device_id as partition key and timestamp as sort key
5. Kinesis Data Streams for raw sensor data ingestion with 24-hour retention
6. S3 bucket configured as data lake with intelligent tiering and partitioning by device_id and date (year/month/day structure)
7. CloudWatch dashboard displaying device metrics including message count, errors, and processing latency
8. SNS topic for anomaly alerts with email subscription endpoint
9. IAM roles and policies for IoT devices, Lambda execution, and service integrations

Technical specifications:

- IoT Rule SQL should filter messages where temperature > 100 or vibration > 50
- Lambda function should integrate with SageMaker endpoint for ML-based anomaly detection
- DynamoDB table should have on-demand billing mode for cost optimization
- Kinesis stream should have 2 shards for parallel processing
- S3 bucket should use server-side encryption with AWS managed keys
- CloudWatch alarms should trigger when error rate exceeds 1% or processing latency > 500ms
- Use AWS IoT Greengrass V2 for edge computing capabilities where applicable
- Implement AWS IoT Device Defender for security monitoring and auditing

Please provide the complete Pulumi Python infrastructure code with proper resource naming conventions and all necessary configurations. Each file should be in a separate code block with the filename clearly indicated.