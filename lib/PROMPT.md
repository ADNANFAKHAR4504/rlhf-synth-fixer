Generate a comprehensive CloudFormation template in JSON format. This template must define the complete AWS infrastructure for a large-scale profile migration system, adhering strictly to all components, data flows, and performance constraints listed below.

Project Architecture & Data Flow:

Please create the necessary AWS resources to build the following pipeline:

Data Replication: A DMS (Database Migration Service) replication task that continuously replicates data from a source Cassandra database.

Initial Storage: The DMS task must write the replicated data as JSON files to an S3 bucket.

Transformation & Validation: The S3 bucket (specifically, object creation events) must trigger a Lambda function. This Lambda is responsible for transforming the raw JSON profiles, performing data validation, and handling any errors.

Primary Data Store: The validated profiles from the Lambda function must be written to a DynamoDB table using conditional checks to ensure data integrity.

Graph Database Population: The DynamoDB table must have DynamoDB Streams enabled. This stream will invoke a second Lambda function that reads the profile changes, constructs graph data, and writes to an Amazon Neptune database using the Gremlin API to build a social graph.

Search Indexing: Simultaneously, the transformation/validation Lambda (or the DynamoDB stream, please choose the most efficient path) must feed profile data into a Kinesis Data Firehose delivery stream, which in turn indexes the profiles into an Amazon OpenSearch Service cluster for full-text search capabilities.

Scheduled Data Validation: An EventBridge Rule must be configured to trigger every 15 minutes.

Validation Workflow: This EventBridge rule will invoke a Step Functions state machine. The Step Function's workflow must execute Athena queries that compare data samples from the raw S3 dumps (from DMS) against the processed data in the DynamoDB table to ensure consistency.

Lag Detection: A third Lambda function must be created. This function's role is to query CloudWatch metrics (specifically DMS and Lambda metrics) to detect migration lag.

Automatic Throttling: If the lag detection Lambda identifies lag exceeding a threshold (see constraints), it must trigger an action (e.g., via SNS or directly) to invoke a fourth Lambda function that makes automatic throttling adjustments to the DMS replication task.

Monitoring & Alerting: A central SNS Topic must be created. All critical events, migration status updates, and lag alerts should be published to this topic, which will be consumed by a monitoring dashboard.

Critical Performance & Scalability Constraints (Must be Met):
The CloudFormation resources must be provisioned with configurations (e.g., Provisioned IOPS, instance sizes, Lambda memory/concurrency) sufficient to meet these exact, non-negotiable requirementDMS: Must be capable of replicating 890 million profiles (totaling 3.4TB of data) within a 72-hour window.
S3 Bucket: Must be configured to support partitioning of incoming data by user_id ranges (this is a write-logic concern for DMS/Lambda, but the bucket setup should be standard).
Transform/Validate Lambda: Must scale to process 234,000 profiles per minute.
DynamoDB Table: Must be provisioned to handle 67,000 conditional writes per second. Enable DynamoDB Streams.
Neptune Cluster: Must be provisioned with instance types and configurations capable of building and querying a graph with 890 million nodes and 12 billion edges.
OpenSearch Cluster: Must be configured to index 234,000 profiles per minute from the Kinesis Firehose stream.
EventBridge Rule: Must trigger precisely every 15 minutes.
Athena Queries: The setup (Workgroup, etc.) must allow for the comparison of 1 million sample profiles in under 5 minutes.
Migration Lag: The end-to-end lag (Cassandra to DynamoDB/OpenSearch) must be kept under 10 minutes. This will inform the CloudWatch Alarm thresholds.

Throttling Lambda: Throttling adjustments must be applied within 30 seconds of detection.