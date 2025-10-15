I need to design a serverless application using the AWS CDK in Python (main.py - single stack) that sets up a clean, production-ready infrastructure. The application should have an API Gateway, a Lambda function, and a DynamoDB table for storage — all fully defined and deployed through the CDK stack.

The Lambda function will handle incoming HTTP requests from the API Gateway and perform the required operations on the DynamoDB table. It should be written in Python but deployed and managed through the Python-based CDK app. 

Every Lambda invocation needs to log results to CloudWatch so I can monitor performance and debug issues easily. The DynamoDB table should use `UserId` as its primary key (a string type), and the data must be encrypted at rest using KMS. For system stability, limit the number of concurrent Lambda executions — I don’t want more than five running at a time.

The API Gateway should trigger the Lambda whenever an HTTP request comes in and handle responses gracefully, returning the right status codes based on success or failure. Please enable detailed monitoring for the API Gateway stage so that I can track performance metrics in depth.

IAM roles should follow least-privilege principles: API Gateway should only have permission to invoke the Lambda, and the Lambda should only have access to the DynamoDB table and to write logs to CloudWatch.

Also, I’d like to manage configuration values — such as environment names or table names — through AWS Systems Manager Parameter Store rather than hardcoding them. This will make it easier to handle environment-specific deployments later.

The CDK stack should fully provision everything, deploy cleanly, and align with Python best practices. Once deployed, I should be able to test the system end-to-end: API Gateway sends a request → Lambda executes and logs results → DynamoDB stores or retrieves data. The overall setup should follow AWS best practices for security, scalability, and maintainability.

