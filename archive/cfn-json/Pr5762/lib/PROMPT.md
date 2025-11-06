I need to create a complete CloudFormation template in json for a pretty complex data pipeline. I've outlined the main goals and the specific performance numbers we need to hit.

The most important thing is that the final CloudFormation template must meet all the requirements listed below exactly as I've written them.

Here's what the system needs to do:
We're building a CDR (Call Detail Record) migration system.
Ingestion: A Kinesis Data Stream will get records from our old systems.
Processing: This stream will trigger a Lambda function to validate and reformat the CDRs.
Storage & Archival: The Lambda will write the transformed data to two places at once:

An S3 bucket for long-term archival.
A Kinesis Data Firehose.
Data Warehouse: The Firehose will load the data into Redshift (using a COPY command).
Real-time Lookups: The initial Lambda (from step 2) should also write data to a DynamoDB table for fast, real-time lookups.
Data Catalog: A different Lambda function needs to run to start a Glue crawler, which will keep our Data Catalog updated.
Validation: An EventBridge rule should trigger Athena queries to check that the data is consistent and accurate.

Billing: Finally, a Step Function will manage our billing process by reading from Redshift and writing the billing results to an Aurora database.
Performance Requirements (These are critical):
Kinesis Stream: Needs to handle 30,000 CDRs per second.
Lambda (Transform): Must finish its work in under 500ms.
S3 Archival: Must be partitioned by date and hour (like .../YYYY/MM/DD/HH/).
Firehose to Redshift: Needs to batch and load data every 2 minutes.
DynamoDB: Must support 450,000 writes per minute.
Glue Crawler: Has to update the catalog within 5 minutes of being started.
Athena Validation: Must confirm 99.9% data accuracy.
Step Function (Billing): Needs to process 67 million records every day.

What I need in the CloudFormation Json:
All the Resources: Please create all the AWS resources needed for this, like:
AWS::Kinesis::Stream
AWS::Lambda::Function (for all the Lambda tasks)
AWS::Lambda::EventSourceMapping (to link Kinesis and Lambda)
AWS::S3::Bucket
AWS::KinesisFirehose::DeliveryStream (set up for Redshift)
AWS::Redshift::Cluster (or Serverless)
AWS::DynamoDB::Table
AWS::Glue::Crawler
AWS::Events::Rule
AWS::Athena::Workgroup
AWS::StepFunctions::StateMachine
AWS::RDS::DBCluster (for Aurora)
All the AWS::IAM::Role and AWS::IAM::Policy needed, making sure to use least-privilege permissions.
Built-in Performance: Please configure the resources to meet the performance numbers:
Kinesis Stream: Calculate the right ShardCount for 30,000 records/sec.
DynamoDB Table: Use PAY_PER_REQUEST (On-Demand) billing to handle the 450,000 writes/min.
Lambda Functions: Set a reasonable Timeout (e.g., 3-5 seconds) and MemorySize.
Firehose: Set BufferingHints to 120 seconds and configure the S3DestinationConfiguration Prefix for the YYYY/MM/DD/HH/ partitioning.
Step Functions: Define the state machine. An Express workflow or a Standard one with parallel Map states would probably be best for handling 67 million daily records.

Parameters: It would be great to have parameters for things that might change:
EnvironmentName
RedshiftMasterUsername
RedshiftMasterUserPassword (NoEcho, please)
AuroraMasterUsername
AuroraMasterUserPassword (NoEcho, please)

Outputs: Please output the key resource names and ARNs:
KinesisStreamARN
S3BucketName
DynamoDBTableName
RedshiftClusterId
AuroraClusterId
StepFunctionStateMachineARN

Finally, please just provide the complete json code in a single block. No extra explanations before or after the code are needed.