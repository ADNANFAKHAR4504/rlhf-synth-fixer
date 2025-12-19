I need to build a serverless infrastructure on AWS using CDK TypeScript. The main requirements are:

1. Set up AWS Lambda functions that process data from DynamoDB streams. I need at least 2-3 Lambda functions for different data processing tasks.

2. Create DynamoDB tables with streams enabled to trigger the Lambda functions.

3. Configure proper IAM roles with minimal permissions for each Lambda function.

4. Set up event source mappings between DynamoDB streams and Lambda functions.

5. Add CloudWatch monitoring and error handling for the serverless operations.

I want to use some of the latest AWS features. Can you include CloudWatch Application Signals for better observability and maybe use DynamoDB warm throughput for performance optimization?

Additionally, I need to integrate AWS Lambda Powertools for enhanced observability, structured logging, and distributed tracing with X-Ray. This should provide better insights into Lambda function performance and error tracking.

I also want to implement AWS Step Functions to orchestrate the data processing workflow. The state machine should coordinate the Lambda functions, handle errors gracefully with retry logic, and provide visual workflow monitoring. This will make the data processing pipeline more robust and maintainable.

The infrastructure should be deployed in us-east-1 region and follow the naming pattern dev-<resource>-synth.

Please provide the infrastructure code as separate TypeScript CDK files. I need one file per stack or construct to keep things organized.