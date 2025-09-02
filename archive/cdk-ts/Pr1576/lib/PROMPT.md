# Prompt: Generate AWS CDK IaC in TypeScript for Secure Serverless Application

## Role
You are an AWS Certified Solutions Architect and senior cloud developer with 10+ years of experience in designing **secure, production-grade, serverless applications** using **AWS CDK** and **TypeScript**. You will act as an **Infrastructure-as-Code (IaC) generator** and produce a complete, deployable AWS CDK codebase that exactly implements the following requirements.

## Task
Generate a complete AWS CDK (TypeScript) project that provisions a secure, production-ready, **serverless web application** in the **us-west-2** region. Your solution must follow the **provided constraints** and **environment details** exactly as given without changing or omitting any details.

## Constraints
1. **Compute**: Use **AWS Lambda** for serverless compute.
2. **Region**: All resources must be created in **us-west-2**.
3. **IAM**: Implement IAM policies with **least privilege principle**.
4. **API Gateway**: Use API Gateway for HTTP endpoints.
5. **Storage**: Integrate with **Amazon S3** to store uploaded files.
6. **Logging**: Ensure all logs are shipped to **CloudWatch Logs**.
7. **Encryption**: Encrypt all data at rest using **AWS KMS**.
8. **Secrets Management**: Use **AWS Secrets Manager** to manage application secrets.
9. **Lambda Timeout**: All Lambda functions must have a timeout of **no more than 30 seconds**.
10. **API Gateway Request Validation**: Implement request validation in API Gateway.
11. **Database**: Leverage **Amazon DynamoDB** for NoSQL database with **on-demand capacity mode**.
12. **CORS**: Enable CORS for all API Gateway endpoints.

## Environment
The infrastructure will be deployed in the **AWS us-west-2** region. The application stack must integrate AWS services in a cohesive way, emphasizing **security, encryption, and operational efficiency**. Use **AWS CDK** with **TypeScript** as the IaC tool.

## Proposed Statement
Design and deploy a **serverless web application** using **AWS CDK (TypeScript)** that includes:
1. **AWS Lambda functions** for compute
2. **API Gateway** for HTTP endpoints
3. **Amazon S3** for file storage
4. **Amazon DynamoDB** as the NoSQL database
5. **IAM roles and policies** ensuring least privilege
6. **Encryption at rest** for all data
7. **AWS Secrets Manager** for secrets handling

## Expected Output
- A **fully functional AWS CDK (TypeScript)** codebase.
- Follows **AWS CDK best practices** (constructs, stacks, environment configuration).
- Includes **inline comments** explaining key resources and configurations.
- Directly deployable via:
  ```bash
  npm install
  cdk bootstrap
  cdk deploy
