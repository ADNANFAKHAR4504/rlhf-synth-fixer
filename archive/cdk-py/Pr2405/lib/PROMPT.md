Hey, I need your help with setting up a serverless web app on AWS. The idea is to use AWS Lambda for the compute part, triggered by an API Gateway, and DynamoDB for storing data. I want to define everything using AWS CDK with Python, and it’s important that the solution is secure, reliable, and follows best practices.

Here’s what we’re aiming for: the Lambda functions should be triggered by an API Gateway, and the API Gateway needs a usage plan to manage traffic. This means throttling and quotas should be in place. For monitoring, we’ll use AWS CloudWatch to keep an eye on the Lambda functions, so we can troubleshoot and optimize performance.

Security is a big focus. Any persistent storage, like DynamoDB or S3, should have encryption at rest enabled. Permissions should be carefully managed using IAM roles, making sure each resource only gets the access it absolutely needs.

We also want the app to be highly available. It should be deployed in multiple regions (like us-west-2) to handle outages and stay resilient. And finally, we’ll need a detailed README that explains how everything works, how to deploy it, and any other important details.

Can you help build this using AWS CDK with Python (main.py - single stack)? Let’s make sure the code is clean, easy to follow, and aligns with best practices for serverless architecture.