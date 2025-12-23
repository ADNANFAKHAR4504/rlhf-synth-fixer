# PROMPT

I need to build a serverless API using CDK Python that stores data in DynamoDB. The Lambda function should run inside a VPC for security. Deploy to us-east-1.

## VPC and Network Setup

Create a VPC with two public subnets in different availability zones. The Lambda function needs to run inside the VPC so it can access internal resources securely. Make sure the subnets have routes to an Internet Gateway so Lambda can reach DynamoDB and other AWS services.

## DynamoDB Table

Set up a DynamoDB table with itemId as the partition key. Use on-demand billing so we only pay for what we use. The Lambda function will write items to this table when the API gets called.

## Lambda Function Configuration

Create a Lambda function running Python 3.9 that connects to DynamoDB. The function needs:
- To run inside the VPC with a security group that allows outbound traffic
- An IAM role with permissions to write to DynamoDB and create CloudWatch logs
- The table name passed in as an environment variable
- Network interface permissions since it runs in a VPC

## API Gateway Integration

Build a REST API with a GET endpoint at /item that triggers the Lambda function. Enable CORS for all origins so the API works from web browsers. The API Gateway should use Lambda proxy integration to pass the full request to the function.

## How the services connect

When a request hits API Gateway, it invokes the Lambda function through proxy integration. The Lambda runs inside the VPC but can reach DynamoDB through the AWS network. The function creates an item in DynamoDB and returns the result through API Gateway back to the caller.

## Monitoring

Add a CloudWatch alarm that fires when the Lambda function has errors. Set it to trigger after just one error so we catch issues quickly.

## Tagging

Tag everything with Environment=Production for resource tracking and cost allocation.
