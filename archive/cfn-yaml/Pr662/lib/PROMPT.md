# Serverless Infrastructure Deployment with AWS CloudFormation

## Project Name:

**IaC - AWS Nova Model Breaking**

---

## Objective

Deploy a secure and scalable **serverless application** using AWS CloudFormation. The application will expose a RESTful API that supports user data storage and retrieval. All components — API Gateway, Lambda, and DynamoDB — must be provisioned in the `us-east-1` region with proper logging enabled for observability and auditing.

---

## Problem Statement

You are required to define and deploy a **YAML-based CloudFormation template** that sets up a complete serverless stack using:

- **API Gateway** to provide a RESTful interface,
- **AWS Lambda** to handle business logic,
- **Amazon DynamoDB** to persist user data.

The deployed infrastructure must be secure, auditable, and limited in usage via API Gateway’s throttling mechanisms. All services should use **CloudWatch** for logging and monitoring.

---

## Functional Requirements

1. **Region Restriction**
   - All AWS resources **must be deployed in `us-east-1`**.

2. **API Gateway**
   - Must expose a **RESTful API** with two methods:
     - `GET`: Retrieve user data.
     - `POST`: Store user data.
   - `POST` method must trigger the Lambda function.
   - **Usage Plan** must be defined to **limit requests to 1000 per month**.
   - **CloudWatch logging** must be enabled for all API Gateway stages/methods.

3. **Lambda Function**
   - Must be triggered by the `POST` method from API Gateway.
   - Handles logic to **store data in DynamoDB**.
   - Must have an **IAM execution role** with permissions to:
     - **Put items** into the DynamoDB table.
     - **Write logs** to CloudWatch Logs.
   - Logging must be enabled through **CloudWatch Logs**.

4. **DynamoDB**
   - Table name must be: `UserData`.
   - The table must include:
     - **Partition key** named `userId` (of type `String`).
   - Used by the Lambda function to **store and retrieve user-related data**.
   - Logging and monitoring must be enabled using **CloudWatch metrics**.

5. **IAM Roles**
   - Define a dedicated IAM role for the Lambda function.
   - Role must follow **least privilege principle**, allowing:
     - `PutItem` on DynamoDB table `UserData`.
     - Log creation and writing for CloudWatch Logs.

6. **CloudFormation Outputs**
   - The template must **output the API Gateway endpoint URL** after deployment.

---

## Deliverable

- A YAML-formatted CloudFormation template named:  
  `serverless-infrastructure.yaml`

- The template must:
  - Pass `aws cloudformation validate-template` and other linter checks (e.g., `cfn-lint`).
  - Correctly provision all specified resources in the `us-east-1` region.
  - Include usage limits and complete logging setup for **API Gateway**, **Lambda**, and **DynamoDB**.
  - Output the **public URL** of the deployed REST API.

---

## Constraints Summary

| Constraint  | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| Region      | All resources must be in `us-east-1`                                                 |
| API Gateway | Must support `GET` and `POST`; with usage plan (1000 req/month); logging enabled     |
| Lambda      | Must be triggered by `POST`; write to DynamoDB; have logging and least-privilege IAM |
| DynamoDB    | Table `UserData` with partition key `userId` (String); logging enabled               |
| IAM         | Must allow only required DynamoDB and logging actions                                |
| Output      | Must include API Gateway endpoint URL                                                |

---
