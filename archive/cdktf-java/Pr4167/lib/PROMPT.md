Build a real-time log analytics platform for a high-traffic e-commerce application using CDK for Terraform in Java.

Requirements:
The solution should ingest and process more than ten thousand log events per second with minimal latency.
The architecture should include Amazon ECS for containerized log processing, Amazon Kinesis Data Streams for real-time log ingestion, AWS Lambda for stream processing and analytics, and Amazon S3 for long-term log storage.
The entire deployment must span at least two Availability Zones to achieve high availability. 
Configure the Kinesis Data Stream with a data retention period of no more than twenty-four hours to optimize cost.
The implementation must accept configuration parameters for the VPC CIDR block, deployment environment (development, staging, or production), Docker container image for the log processor, the number of Kinesis shards, and the memory allocation for the Lambda functions.

Design:
Focus on a clean and modular code structure, placing reusable infrastructure logic within the constructs package and maintaining clear separation between core infrastructure definitions and configuration inputs.
Avoid hardcoded values and use modern Java records to manage configuration settings cleanly and type-safely.