# AWS CDK (TypeScript) – Serverless API with Lambda

## **High-level architecture**

Help write an **AWS CDK program in TypeScript** that provisions a **serverless API backend** designed to handle approximately **3,000 daily user interactions**. The system must emphasize **cost efficiency, security, scalability**, and **observability** through native AWS services.

Use **Amazon API Gateway (REST API)** to expose endpoints for CRUD operations. Implement **AWS Lambda** functions (Node.js 18.x runtime) as API handlers. Persist data in **Amazon DynamoDB** tables with **auto-scaling** enabled for read and write capacity. Use **AWS Secrets Manager** to securely manage API keys and sensitive credentials.

Enable **Amazon CloudWatch** to monitor **API Gateway and Lambda performance metrics** (latency, invocation count, and error rate). Apply **IAM roles and policies** following **least-privilege** principles to control interactions between API Gateway, Lambda, DynamoDB, and Secrets Manager.

## **Functional requirements**

1. API Gateway REST API integrated with multiple Lambda functions implementing CRUD routes.
2. DynamoDB table configured with **auto-scaling** for throughput management.
3. **AWS Secrets Manager** for secure storage and retrieval of API keys or credentials by Lambdas.
4. **CloudWatch metrics and dashboards** for Lambda and API Gateway (invocations, latency, errors).
5. **IAM roles and policies** enforcing least-privilege access between all AWS components.
6. **Environment-based configuration** (e.g., dev/stage/prod) using CDK context or environment variables.
7. **Zero-downtime deployments** via CDK deployment strategies (e.g., versioned Lambdas).

## **Acceptance criteria**

- CDK stack synthesizes and deploys successfully without missing resources.
- API endpoints correctly handle all CRUD operations.
- DynamoDB auto-scaling validated under simulated load conditions.
- CloudWatch dashboards display real-time API and Lambda metrics.
- Secrets Manager integration tested and verified for secure key retrieval.
- IAM roles reviewed for least-privilege compliance.
- Cost and latency performance meet expected operational targets.
