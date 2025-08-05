# Serverless Application Deployment Challenge (AWS SAM + CloudFormation)

## Objective

Design and deploy a **secure, serverless web application** using AWS infrastructure-as-code practices. You'll leverage **AWS CloudFormation (via AWS SAM)** to define and provision resources including **Lambda**, **API Gateway**, and **S3**.

## Requirements

Your CloudFormation template (YAML) must meet the following criteria:

### 1. Lambda Function Setup
- Runtime must be set to `python3.8`.
- The function will be triggered by API Gateway upon receiving HTTP requests.
- The Lambda should have an **IAM execution role** with permissions to write logs to **CloudWatch Logs**.

### 2. API Gateway Integration
- Define an **HTTP-based API Gateway** that invokes the Lambda function.
- Configure supported HTTP methods (e.g., `GET`, `POST`, etc.).

### 3. S3 Bucket Configuration
- Create an **S3 bucket** to store Lambda function assets (code package).
- Ensure the bucket has **encryption at rest** enabled (SSE-S3 or SSE-KMS).

### 4. Security & Permissions
- Ensure **least privilege** is enforced in the Lambda execution role.
- Apply best practices for securing API Gateway endpoints (e.g., resource policies or usage plans can be considered if applicable).

### 5. Use AWS SAM for Deployment
- Use the **AWS Serverless Application Model (SAM)** to:
  - Define resources in a SAM-compatible template (`template.yaml`)
  - Validate the template using `sam validate`
  - Deploy using `sam deploy` with region specified

## Expected Outcome

- A valid and deployable **CloudFormation YAML template** using AWS SAM.
- All components (Lambda, API Gateway, S3, IAM Role) are correctly defined and linked.
- Template passes `sam validate` checks without error.
- The serverless stack is deployable in a specified AWS region following security best practices.
- A single YAML template should be generated as an output for this prompt and all the python related lambda code should be inside that YAML with respective attributes