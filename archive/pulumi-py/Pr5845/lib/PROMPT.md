Hey man! Can you build a modular Pulumi Python program that deploys a serverless application infrastructure across multiple AWS regions with these requirements?

- Atleast 2 regions of your own choice, such as `us-east-1` and `us-west-2`
- API Gateway triggers Lambda functions for REST API access, with CORS enabled on all endpoints and request validation.
- Lambda functions have a 15-second timeout and use the latest Python versions. They implement structured JSON logging, and have dead-letter queues with max 2 retries.
- DynamoDB tables use partition key `symbol` and sort key `timestamp`, with on-demand billing, autoscaling for read/write capacity, contributor insights enabled, point-in-time recovery enabled, and encrypted at rest using AWS KMS.
- S3 bucket has server-side encryption with AWS managed keys, event notifications that trigger Lambdas on file uploads, and lifecycle policies to delete processed files after 30 days.
- CloudWatch logs are set to a retention of 7 days for cost optimization, with alarms for Lambda errors exceeding 1% and DynamoDB throttling events.
- Enable AWS X-Ray tracing for all Lambda functions and the API Gateway.
- API Gateway includes throttling limits (1000 RPS and burst 2000) and returns standardized error responses with correlation IDs.
- All resources are tagged with the `ENVIRONMENT_SUFFIX`, `REGION` and Project Name = `ServApp`.
- For any resource that may have settings which may prevent destruction, make those settings optional and default to false
- Implement a CI/CD pipeline using AWS CodePipeline to automate deployment.

Make sure to provide sufficient outputs which should also include deployed API endpoints, Lambda ARNs, and DynamoDB table names after successful deployment.

Your code should be well written, following best practices as well as have a good and modular design.
