I need a CloudFormation template for a serverless API that writes data to DynamoDB. Here's what I'm building:

The main flow is: API Gateway receives POST requests at /data, triggers a Lambda function, and that Lambda writes to a DynamoDB table.

For the Lambda function, I want Python 3.9 runtime. It needs environment variables set for STAGE, REGION - which should be us-east-1 - and LOG_LEVEL. The Lambda should have its own CloudWatch log group for logging.

The IAM role for Lambda needs permissions to write to CloudWatch Logs and do Put Item operations on the DynamoDB table - nothing more than that.

The DynamoDB table should have a string primary key called "id", with 5 read and 5 write capacity units. I also need auto-scaling configured that targets 70% utilization, scaling between 5 and 20 units for both reads and writes.

For monitoring, I want a CloudWatch alarm that fires when the Lambda error rate exceeds 5% over 5 minutes.

The template should accept two parameters: Environment with options dev, stage, or prod using dev as default, and LogLevel with options INFO, WARN, or ERROR using INFO as default.

Everything should deploy to us-east-1.
