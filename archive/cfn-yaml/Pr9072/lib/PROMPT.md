I need to build a serverless data processing pipeline using CloudFormation YAML. Here's what I'm trying to set up:

I want an S3 bucket that triggers a Lambda function whenever someone uploads a file. The Lambda needs to process the uploaded file and store metadata into DynamoDB. I also need an API Gateway REST endpoint that connects to the same Lambda so users can query the processed data.

For the S3 bucket, make sure versioning is enabled and block all public access. When objects are created, they should automatically trigger the Lambda function to start processing.

The Lambda function should be the central piece - it needs to handle both S3 event notifications and API Gateway requests. Set it up with an execution role that gives it read access to S3 and full read/write access to the DynamoDB table. Pass the DynamoDB table name as an environment variable so the Lambda can connect to it. Make sure it has proper error handling and can serialize responses as JSON for the API Gateway.

For API Gateway, create a REST API with regional endpoints that forwards GET and POST requests to the Lambda. Also add OPTIONS method support for CORS so browsers can call it. The API should integrate directly with the Lambda function.

The DynamoDB table needs a composite key - use a partition key and a sort key, both as strings. Enable DynamoDB Streams so we can track changes later, and turn on point-in-time recovery for backups. Use on-demand billing instead of provisioned capacity.

Keep security tight with least-privilege IAM policies. The Lambda execution role should only have access to the specific S3 bucket and DynamoDB table it needs, nothing more.

Deploy everything to us-west-2 and tag all resources with Environment: Production. Use a single CloudFormation stack to manage the entire setup. If you run into issues with S3 event notifications creating circular dependencies, use a custom resource pattern to configure them after the bucket and Lambda are created.