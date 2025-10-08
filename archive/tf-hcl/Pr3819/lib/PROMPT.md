I need to build a customer feedback processing system that handles about 3,800 survey responses per day. The system should automatically analyze sentiment and make the data queryable for reporting.

Here are the specific requirements:

Create an API Gateway REST API that accepts customer feedback submissions via POST requests. The API should trigger a Lambda function written in Python 3.11 that processes each feedback entry.

The Lambda function needs to analyze the sentiment of the feedback text using AWS Comprehend, then store the original feedback along with the sentiment analysis results in DynamoDB. Make sure the DynamoDB table has point-in-time recovery enabled for data protection.

All processed feedback should also be exported to S3 in JSON format, organized by year/month/day partitions for efficient querying. For example: s3://bucket/feedback/year=2024/month=01/day=15/

Set up a Glue Crawler that runs daily at midnight UTC to automatically discover the schema of the S3 data and update the Glue Data Catalog. This will enable querying the feedback data using Athena.

Configure Athena to query the feedback data from S3 using the Glue Data Catalog. Create a workgroup for running queries and store query results in a separate S3 location.

Add CloudWatch monitoring with custom metrics for tracking the number of feedback submissions processed and any Lambda errors that occur during processing.

Make sure to create all necessary IAM roles and policies so the Lambda function can call Comprehend, write to DynamoDB and S3, and publish CloudWatch metrics. The Glue Crawler needs permissions to read S3 and update the Glue Data Catalog.

The infrastructure should be deployed in the us-west-1 region. Use appropriate resource naming and tagging for production use.

Please provide the complete Terraform configuration files needed to deploy this infrastructure.