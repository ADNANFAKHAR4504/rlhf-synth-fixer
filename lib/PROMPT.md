# Serverless Infrastructure with AWS CloudFormation (JSON)

Hey there! I need you to build a serverless application using AWS CloudFormation in JSON format. This should run in the us-east-1 region and handle basic API requests while logging everything properly.

## What I need

Create a CloudFormation template that sets up:

- An API Gateway REST API that connects to Lambda through proxy integration for handling requests at the v1/resource path
- A Lambda function that receives requests from API Gateway, processes them, and writes logs to both an S3 bucket and CloudWatch Logs
- IAM roles that grant the Lambda function write access to the S3 logs bucket and CloudWatch, plus allow API Gateway to invoke the Lambda function
- Documentation in the template about how to deploy and verify everything works

## The Details

The setup should be purely serverless - just API Gateway and Lambda, no other compute services.

The API Gateway needs a resource at path v1/resource that handles GET and POST methods. When requests hit this endpoint, API Gateway invokes the Lambda function which processes the request and sends execution logs to an S3 bucket named project-logs-dev.

For the IAM setup:

- The Lambda execution role needs permissions to write objects to the S3 bucket and create log streams in CloudWatch
- API Gateway needs permissions to invoke the Lambda function and write access logs to CloudWatch
- All policies should use specific resource ARNs, not wildcards

Make sure logging flows correctly:

- API Gateway access logs go to CloudWatch log group dedicated to the API
- Lambda execution logs go to CloudWatch under the Lambda function's log group
- Lambda also writes its logs to the S3 bucket so we have dual logging

Every resource should be tagged with environment and project tags.

Include metadata in the template that explains:

- How to validate the template with aws cloudformation validate-template
- How to deploy it using aws cloudformation deploy
- How to verify it works by making API calls and checking logs in CloudWatch and S3
- How to clean up everything when done

The outputs should include the API endpoint URL, Lambda function ARN, and S3 bucket name.

## What Success Looks Like

The template file should be named serverless_setup.json and be valid JSON. When deployed to us-east-1 using AWS CLI, it should:

- Successfully create all the resources with proper connectivity between API Gateway and Lambda
- Handle GET and POST requests to v1/resource, with API Gateway triggering the Lambda function
- Show logs in both CloudWatch for Lambda and API Gateway plus in the S3 bucket
- Use IAM policies that specify exact resource ARNs and follow least privilege
- Have all resources properly tagged
- Include clear instructions for deployment, testing, and cleanup
