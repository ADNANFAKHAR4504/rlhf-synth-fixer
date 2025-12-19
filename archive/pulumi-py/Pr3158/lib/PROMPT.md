Please create a modular, reusable Infrastructure as Code solution using Pulumi with Python that deploys a secure serverless application in a specified AWS region, incorporating the following requirements:

- Set up AWS Lambda as the core serverless compute with a maximum timeout of 3 minutes and provisioned concurrency of 5.
- Configure API Gateway to trigger the Lambda function, enforce HTTPS-only traffic, and use a custom domain name.
- Ensure Lambda has access to an S3 bucket for saving logs; the S3 bucket name should be provided as a parameter to allow dynamic configuration.
- Create minimal-privilege IAM roles that grant Lambda permissions only to interact with S3, CloudWatch (for logging and alarms), API Gateway, and AWS Parameter Store for sensitive configuration management.
- Enable Lambda logging within CloudWatch, including setting up alarms for errors and throttling.
- Include Lambda environment variables for configuration, with secure values managed in AWS Parameter Store.
- Restrict the deployment strictly to the specified AWS region.
- Implement AWS X-Ray tracing on the Lambda function for monitoring and diagnostics.
- Include a dead-letter queue (DLQ) configuration for the Lambda function to handle failed executions gracefully.
- Design the Pulumi Python templates to be cleanly modular and support stack updates without downtime.
- Ensure the entire solution passes AWS CloudFormation template validation tools, with included tests validating resource creation and permission configurations as per least privilege principles.

Remember to keep it modular.
