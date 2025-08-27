Hey there! I need your help designing a serverless infrastructure using AWS CDK with Golang. The goal is to create a highly available setup that spans two AWS region: US-West-2. Here's what I have in mind:

First, the application logic should be handled by AWS Lambda functions. Each function needs to stay within a memory limit of 256MB. These Lambda functions will be triggered by an API Gateway, which will manage incoming HTTP requests. It's important that the API Gateway is properly linked to the Lambda functions so everything works seamlessly.

I also want to make sure that all Lambda executions are logged in CloudWatch. This will help with monitoring and debugging. And since this is for a production environment, every resource we create should be tagged with `Environment: EnvironmentSuffix`.

The setup should be clean, efficient, and adhere to best practices. Can you write the code for this in AWS CDK using Golang? The solution should be fully functional, deployable, and meet all the requirements. Let me know if you need any additional details!