# AWS Serverless Infrastructure with Pulumi

You are an expert AWS architect and Pulumi developer.

Create a **serverless infrastructure** using Pulumi with these requirements:

- Use **AWS Lambda** for serverless compute, written in Python.
- Deploy a Lambda function that processes HTTP requests via **API Gateway**.
- The Lambda must log every request to **CloudWatch Logs** and an **S3 bucket**.
- Enable **automatic scaling** on the Lambda to efficiently handle variable loads and maintain low response times.
- Use **API Gateway** to manage access to the Lambda function.
- Provide sufficient **CloudWatch metrics** for both API Gateway and Lambda for monitoring.
- Tag all AWS resources properly for **cost allocation and management**.

Deliver a complete Pulumi Python program implementing these points, ensuring deployment runs successfully without errors.