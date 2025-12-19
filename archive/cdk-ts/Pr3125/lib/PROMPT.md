We need to build out the infrastructure for a new serverless application in us-west-1. Please use the AWS CDK with TypeScript for this.

The main flow is an API Gateway that triggers a Lambda function. This Lambda needs to run inside a VPC in a private subnet. In its code, it will read configuration from AWS Systems Manager Parameter Store, fetch secrets from AWS Secrets Manager to use as environment variables, write data to a DynamoDB table, and also interact with an S3 bucket.

For the API Gateway, make sure to enable CORS and turn on access logging to CloudWatch. The DynamoDB table should use 'id' as its partition key and be set to on-demand capacity mode. We also need to process table changes, so please set up a DynamoDB Stream to send item creation events to an SQS queue.

The application's S3 bucket must be encrypted using AES-256 and should have a lifecycle policy to move objects to the Standard-IA storage class after 30 days.

A key requirement is managing Lambda concurrency. Please configure Provisioned Concurrency for the function, and then create an Application Auto Scaling policy that adjusts this concurrency level based on a custom metric. Also, set up CloudWatch alarms to monitor the DynamoDB table's performance.

For security and auditing, the IAM roles need to be locked down with strict, least-privilege permissions. Also, enable CloudTrail to log data events for the DynamoDB table and management events for API Gateway.

Finally, please ensure all resources are tagged with 'environment' and 'project' keys.
