# Serverless REST API with Blue-Green Deployment

Need to build a serverless REST API using Pulumi and JavaScript. The API should handle basic CRUD operations through API Gateway, with Lambda functions doing the actual work. Everything needs to run in us-west-2 and support blue-green deployments for zero-downtime updates.

## What I Need

Set up a complete serverless API stack with these pieces:

**API Gateway** - This is the entry point. Create a REST API that accepts GET, POST, PUT, and DELETE requests. The gateway should forward incoming requests directly to the Lambda function backend and stream CloudWatch logs for debugging.

**Lambda Functions** - These handle the actual business logic. The functions need to be invoked by API Gateway using Lambda proxy integration so they can process the HTTP requests. Functions should write their logs to CloudWatch and have proper IAM permissions. Also need blue-green deployment capability using Lambda aliases with weighted traffic routing between versions.

**S3 Bucket** - Store the Lambda deployment packages here with server-side encryption enabled. Lambda will pull code from this bucket during deployment.

**IAM Role** - The Lambda execution role needs permissions to write CloudWatch logs and read from the S3 bucket where code is stored. Keep permissions minimal - just what's needed for Lambda to run and log.

**CloudWatch Logs** - Both API Gateway and Lambda functions should send their logs here. Create separate log groups for the API and each Lambda function so logs don't get mixed together.

## Service Connectivity

Here's how everything connects:
- Client sends HTTP request to API Gateway endpoint
- API Gateway invokes Lambda function using AWS Lambda proxy integration
- Lambda function executes with IAM role that grants CloudWatch Logs write access and S3 read access
- Lambda pulls its code from the encrypted S3 bucket on cold start
- Lambda writes execution logs to CloudWatch log group
- API Gateway streams its access logs to separate CloudWatch log group
- Lambda sends response back through API Gateway to client

For blue-green deployments, use Lambda versioning with aliases. Traffic gets split between the blue and green versions using weighted alias routing.

## Configuration Details

Use us-west-2 for all resources. Tag everything with Environment: Test so we can track costs properly.

The blue-green setup should let us deploy new Lambda versions without downtime. Route traffic between versions using percentage-based weights on the Lambda alias.

Make sure the S3 bucket has encryption turned on and the IAM role only has the minimum permissions needed - CloudWatch Logs write and S3 read for the code bucket.
