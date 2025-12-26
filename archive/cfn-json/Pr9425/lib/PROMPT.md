Generate a comprehensive CloudFormation template in JSON format. This template must define the complete AWS infrastructure for a large-scale profile migration system, adhering strictly to all components, data flows, and performance constraints listed below.

Project Architecture & Data Flow:

Please create the necessary AWS resources to build the following pipeline:

Data Ingestion: An EventBridge scheduled rule triggers a Lambda function every minute that simulates continuous data ingestion by writing profile data as JSON files to an S3 bucket. This Lambda acts as a data source simulator, replacing the need for database replication services.

Initial Storage: The ingestion Lambda writes the profile data as JSON files to an S3 bucket, partitioned by user_id ranges for efficient processing.

Transformation & Validation: The S3 bucket object creation events trigger a Lambda function. This Lambda is responsible for transforming the raw JSON profiles, performing data validation, and handling any errors.

Primary Data Store: The validated profiles from the Lambda function are written to a DynamoDB table using conditional checks to ensure data integrity.

Graph Data Processing: The DynamoDB table has DynamoDB Streams enabled. This stream invokes a Lambda function that reads the profile changes and processes graph data for building social connections.

Search Indexing: The transformation/validation Lambda feeds profile data into a Kinesis Data Firehose delivery stream, which indexes the profiles into an Amazon OpenSearch Service cluster for full-text search capabilities.

Scheduled Data Validation: An EventBridge Rule is configured to trigger every 15 minutes.

Validation Workflow: This EventBridge rule invokes a Step Functions state machine. The Step Function workflow executes Athena queries that compare data samples from the raw S3 dumps against the processed data in the DynamoDB table to ensure consistency.

Lag Detection: A Lambda function queries CloudWatch metrics for both ingestion Lambda and processing Lambda to detect processing lag.

Automatic Throttling: If the lag detection Lambda identifies lag exceeding a threshold, it triggers an SNS notification to invoke another Lambda function that adjusts the ingestion rate by modifying the EventBridge rule schedule.

Monitoring & Alerting: A central SNS Topic is created. All critical events, processing status updates, and lag alerts are published to this topic for monitoring dashboard consumption.

Critical Performance & Scalability Constraints - Must be Met:
The CloudFormation resources must be provisioned with sufficient configurations such as Provisioned IOPS, instance sizes, and Lambda memory with concurrency to meet these exact requirements:

Data Ingestion Lambda: Must write 890 million profiles - that's 3.4TB of data total - to S3 within a 72-hour window. Configure with sufficient memory and reserved concurrency.

S3 Bucket: Must support partitioning of incoming data by user_id ranges for efficient downstream processing.

Transform/Validate Lambda: Must scale to process 234,000 profiles per minute with appropriate memory allocation and reserved concurrency.

DynamoDB Table: Must be provisioned to handle 67,000 conditional writes per second. Enable DynamoDB Streams for downstream processing.

OpenSearch Cluster: Must be configured to index 234,000 profiles per minute from the Kinesis Firehose stream.

Validation EventBridge Rule: Must trigger precisely every 15 minutes to invoke the Step Functions validation workflow.

Ingestion EventBridge Rule: Must trigger every minute to maintain continuous data flow.

Athena Workgroup: Must allow comparison of 1 million sample profiles in under 5 minutes.

Processing Lag: The end-to-end lag from S3 ingestion to DynamoDB and OpenSearch must be kept under 10 minutes. CloudWatch Alarms must monitor this metric.

Throttling Response: Rate adjustments must be applied within 30 seconds of lag detection.