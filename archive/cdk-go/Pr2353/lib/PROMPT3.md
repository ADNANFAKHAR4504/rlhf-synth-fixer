Hey! I need your help building a serverless setup using AWS CDK with Golang. The idea is to create a highly available infrastructure that works across two AWS region: US-West-2. Here's what I'm thinking:

The application logic will be handled by AWS Lambda functions, and each function should stay within a memory limit of 256MB. These functions will be triggered by an API Gateway, which will handle all incoming HTTP requests. It's super important that the API Gateway is properly connected to the Lambda functions so everything runs smoothly.

Also, I want to make sure that all Lambda executions are logged in CloudWatch. This will help with monitoring and debugging. Since this is for a production environment, every resource we create should be tagged with `Environment: EnvironementSuffix`.

The setup should be clean, efficient, and follow best practices. Can you write the code for this in AWS CDK using Golang? It should be fully functional, deployable, and meet all the requirements. Let me know if you need anything else from me!