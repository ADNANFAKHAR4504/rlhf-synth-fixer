I want to design a fully serverless e-commerce application using the AWS CDK in Python (main.py - single stack). The application will be deployed in the **us-west-1** region and should follow best practices for scalability, security, and performance.

At the heart of this setup, I’ll have an **API Gateway** that exposes several HTTP endpoints to handle product CRUD operations. Each of these requests should be processed by an **AWS Lambda** function written in Python. The Lambda functions will handle the logic for creating, reading, updating, and deleting products, while logging important events and errors to **CloudWatch Logs** for observability.

Product data will be stored in a **DynamoDB** table, which should have a clearly defined primary key for fast read and write operations.

All data, whether stored or transmitted, must be encrypted. IAM roles and policies should be crafted carefully to ensure the principle of least privilege is applied across all services. To make the system more robust, I’ll integrate **SNS (Simple Notification Service)** to send alerts whenever product inventory levels change — this will help notify relevant systems or users automatically.

For performance, I want to use **CloudFront** to cache responses that come through API Gateway so that repeated requests are served faster. API Gateway should also include request validation to prevent malformed data from reaching the Lambda, and CORS must be enabled to allow legitimate cross-origin requests.

Environment variables should be used inside the Lambda functions for managing configurations securely. Every resource in this stack should be tagged consistently — with at least Name, Environment, and Owner — to help with tracking and governance.

The end result should be a Python CDK stack that cleanly provisions all of these components — Lambda, API Gateway, DynamoDB, S3, SNS, and CloudFront — into a cohesive, secure, and production-grade serverless e-commerce platform.

