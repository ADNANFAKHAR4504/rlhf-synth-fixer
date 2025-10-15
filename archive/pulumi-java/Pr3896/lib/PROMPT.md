I need to deploy a time-series data platform for our financial analytics firm that processes 12,300 daily market data feeds. We need low-latency storage and querying capabilities.

Requirements:
- Deploy in us-west-2 region
- Use Timestream for time-series data storage with memory store retention of 24 hours
- Lambda functions for data ingestion from market feeds
- S3 bucket for data lake with partitioning by symbol and date
- Kinesis Data Streams for real-time feeds with enhanced fan-out enabled
- Glue for schema management and data catalog
- Athena for historical queries on S3 data
- CloudWatch for monitoring ingestion metrics
- IAM roles and policies for data access control
- QuickSight for data visualization

Please use Pulumi with Java to implement this infrastructure. Make sure to configure Kinesis with tagging support for cost allocation and ABAC. Also ensure Lambda functions have proper IAM permissions to write to Timestream and read from Kinesis.

The S3 bucket should have lifecycle policies to transition older data to cheaper storage classes. Include proper error handling and monitoring for the entire pipeline.