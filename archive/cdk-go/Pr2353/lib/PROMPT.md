Hey there! I need your help setting up a serverless architecture using AWS CDK with Golang. The goal is to create a highly available infrastructure that spans two AWS region: US-West-2. Here's the idea:

The application logic will run on AWS Lambda, and each function should stay within a memory limit of 256MB. These Lambda functions will be triggered by an API Gateway, which will handle all incoming HTTP requests. It's really important that the API Gateway is properly connected to the Lambda functions so everything works seamlessly.

I also want to make sure that all Lambda executions are logged in CloudWatch. This will help with monitoring and debugging. Since this is for a production environment, every resource we create should be tagged with `Environment: EnvironmentSuffix`.

The setup should be clean, efficient, and follow best practices. Can you write the code for this in AWS CDK using Golang (main.go - single stack) ? It should be fully functional, deployable, and meet all the requirements. Let me know if you need anything
