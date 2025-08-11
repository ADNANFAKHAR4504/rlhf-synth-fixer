I need help creating secure AWS infrastructure using CDK TypeScript. Can you provide infrastructure code for a multi-region setup with these requirements:

I need EC2 instances that have proper IAM roles for secure AWS service interactions. All resources should have logging enabled through CloudWatch Logs integration. 

For storage, I need S3 buckets with versioning turned on and AES-256 default encryption. I also need a DynamoDB table configured with point-in-time recovery enabled.

The infrastructure should be deployed to us-east-1 and us-west-2 regions only. Please make sure all resources are tagged with "Project: IaCChallenge" for tracking purposes.

I'd like to incorporate some newer AWS features - maybe CloudWatch generative AI observability for enhanced monitoring insights and DynamoDB Accelerator (DAX) with the latest SDK improvements for better performance.

Please provide the complete infrastructure code using CDK TypeScript with one code block per file. Make sure the solution follows AWS security best practices.