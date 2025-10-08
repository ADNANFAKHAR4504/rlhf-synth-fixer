I need you to build a complete serverless infrastructure on AWS using the CDK in Python (main.py - single stack). it should follow solid production practices around security, monitoring, and automation.

The architecture should revolve around a few AWS Lambda functions that handle backend processing. These Lambdas will be exposed through an API Gateway, which will act as the main HTTP interface. 

Use S3 for static file storage, but make sure the bucket is completely private — block all forms of public access. The Lambda functions should have permission to read and write to this bucket. DynamoDB will serve as transient storage, and it should have auto-scaling enabled for both read and write capacities. All DynamoDB data must be encrypted at rest using KMS.

For monitoring and observability, integrate AWS X-Ray for tracing API requests and CloudWatch for metrics and alarms. I want alarms that detect Lambda function errors and throttles. Also, set up API Gateway caching for GET requests with a TTL of around 10 minutes to improve performance.

Overall, the goal is to have a modern, production-grade, serverless system defined entirely in AWS CDK using Python — clean, secure, observable, and fully deployable in one go.
