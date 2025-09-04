You are asked to design a serverless architecture using the AWS CDK in TypeScript. The goal is to build an API Gateway fronting a Lambda function and make sure the whole setup is production ready.

The API Gateway should be HTTP-based, using a Lambda proxy integration so that the function can handle typical REST-style JSON input and output. CORS must be enabled to allow GET requests from any origin, and the API should be deployed with a regional endpoint type.

The Lambda function itself should use either Node.js or Python as the runtime, with at least 512 MB of memory configured. It needs an environment variable called STAGE set to “production.” The code for the function should be deployed from a private S3 bucket, and the Lambda should run under an IAM role that follows least-privilege principles. If executions fail, they should be routed to a dead-letter queue backed by SQS.

Logging and monitoring are required for both the API Gateway and the Lambda function. CloudWatch Logs should be enabled, and alarms created for Lambda errors and throttling. A dedicated S3 bucket should be created for log storage and must have encryption turned on.

For tracing and security, enable AWS X-Ray on both the Lambda and the API Gateway. All resources including S3 buckets and SQS queues should use encryption, and IAM roles and policies should enforce least privilege.

Every resource should carry the tag Environment=Production, and resource names should follow a pattern of ProjectName-Resource-Date so that they are consistent and trackable.

The final result should be a CDK project in TypeScript, with the usual bin and lib directory structure, that can be synthesized and deployed cleanly with cdk synth and cdk deploy. The stack should work in any AWS region without modification while meeting all the requirements above.