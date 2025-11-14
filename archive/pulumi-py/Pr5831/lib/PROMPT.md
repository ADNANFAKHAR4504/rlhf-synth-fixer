Hello, we would want you to Please create a reliable and scalable serverless infrastructure using Pulumi with Python for a microservice app that processes HTTP requests.

We would like the solution to do the following:

- Deploy a Lambda function that handles HTTP POST requests from an API Gateway endpoint `/process`.
- The Lambda should process the input, store results in an S3 bucket, and return a structured response.
- Allocate 512MB of memory and a 15-second timeout for the Lambda.
- Create an S3 bucket to store processed data with server-side encryption (SSE-S3) enabled and public access blocked.
- Define an IAM role granting the Lambda least-privilege write access to the S3 bucket.
- Set environment variables in the Lambda for the bucket name and processing configuration.
- Enable detailed logging for both the Lambda and API Gateway to support monitoring and troubleshooting.
- Deploy all resources in the `us-east-1` AWS region.
- Ensure the stack can be cleanly destroyed while retaining the S3 bucket for data preservation.

Expected output: a modular python project that, when deployed, provisions all resources as described.
Remember, the solution should also be prod-ready and follow best practices!
