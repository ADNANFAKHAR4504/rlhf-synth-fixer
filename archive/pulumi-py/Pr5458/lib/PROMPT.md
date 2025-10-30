Hey mate, could you Please develop a scalable, secure, and event-driven serverless infrastructure using Pulumi with Python for us?
It should meet the following detailed requirements:

- Utilize AWS Lambda functions to asynchronously process data triggered by uploads to an S3 bucket.
- Store processed results in a DynamoDB table with appropriate IAM roles granting minimal necessary permissions.
- Expose Lambda functionality through API Gateway endpoints, secured with API keys and custom domain names.
- Enable Lambda auto-scaling based on incoming request load and configure retry mechanisms for failed executions.
- Encrypt data at rest in S3 using AWS KMS-managed keys.
- Implement logging and monitoring via AWS CloudWatch, including enabling AWS X-Ray tracing for Lambda functions.
- Use environment variables to configure Lambda functions dynamically.
- Design the infrastructure for seamless cross-region and cross-account deployments without downtime.
- Orchestrate complex multi-step workflows using AWS Step Functions integrated with Lambda.
- Enforce compliance with AWS best security practices for serverless applications, including strict IAM role policies and API Gateway endpoint policies.
- Structure the Pulumi Python code to be modular, reusable, and well-documented for maintainability and scalability.
- The solution should use Pulumi Python definitions.
- Deploy all resources ensuring high availability and operational excellence.

Your solution should be focusing on automation, security, observability, and multi-region operational readiness.
