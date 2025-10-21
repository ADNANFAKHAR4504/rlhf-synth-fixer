# Serverless Infrastructure with AWS CloudFormation (JSON)

Hey there! I need you to build a serverless application using AWS CloudFormation in JSON format. This should run in the us-east-1 region and handle basic API requests while logging everything properly.

## What I need

Create a CloudFormation template that sets up:

- An API Gateway with a `/v1/resource` endpoint that accepts both GET and POST requests
- A Lambda function that processes these requests and logs them to both S3 and CloudWatch
- Proper IAM roles that follow least privilege principles
- Documentation in the template about how to deploy and verify everything works

## The Details

The setup should be purely serverless - just API Gateway and Lambda, no other compute services.

The API endpoint `/v1/resource` needs to handle GET and POST methods, and the Lambda function should be able to write logs to an S3 bucket named `project-logs-<environment>`.

For the IAM roles:

- The Lambda role should only have the minimum permissions needed for S3 writes and CloudWatch logging
- The API Gateway role should only have CloudWatch access logging permissions

Make sure logging is set up properly:

- CloudWatch logs enabled for both Lambda function execution and API Gateway access logs
- Lambda writes its execution logs to the S3 bucket as well

Every resource should be tagged with `environment` and `project` tags.

Include metadata in the template that explains:

- How to validate the template with `aws cloudformation validate-template`
- How to deploy it using `aws cloudformation deploy`
- How to verify it works (API calls, checking logs in CloudWatch and S3)
- How to clean up everything when done

The outputs should include the API endpoint URL, Lambda function ARN, and S3 bucket name.

## What Success Looks Like

The template file should be named `serverless_setup.json` and be valid JSON. When deployed to us-east-1 using AWS CLI, it should:

- Successfully create all the resources
- Handle GET and POST requests to `/v1/resource` through the Lambda function
- Show logs in both CloudWatch (for both Lambda and API Gateway) and in the S3 bucket
- Use IAM policies that don't have wildcards and follow least privilege
- Have all resources properly tagged
- Include clear instructions for deployment, testing, and cleanup
