I need help creating serverless infrastructure in AWS using CDK TypeScript. I want to build a system that processes user data through an API and stores the results in S3.

Here are my requirements:

1. Create an S3 bucket called 'CorpUserDataBucket' with versioning enabled. I'd like to use the new S3 Express One Zone storage class if possible for better performance.

2. Set up a Lambda function that can process user data. Use Node.js 18.x runtime and include a simple function that logs the input data and stores it in the S3 bucket. The function should have proper IAM permissions to write to S3.

3. Create an API Gateway that triggers the Lambda function from HTTP requests. I need IP whitelisting configured so only specific IP ranges can access the API - let's say 203.0.113.0/24 and 198.51.100.0/24 for now.

4. All resources should follow our company naming convention with 'Corp' prefix. Use proper IAM roles instead of inline policies for better security management.

5. The infrastructure should be deployed to us-east-1 region.

Can you provide the complete CDK TypeScript infrastructure code? I need separate files for different components to keep things organized. Also, I heard about the new S3 RenameObject API - if that would be useful for this setup, please include it in the solution.

Please provide the infrastructure code in separate code blocks for each file that I can copy and implement directly.