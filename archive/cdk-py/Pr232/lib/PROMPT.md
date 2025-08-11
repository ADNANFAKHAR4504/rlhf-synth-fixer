# Serverless HTTP Endpoint with AWS CDK

You are an expert in cloud infrastructure automation and CDK Python. I need your help to define and deploy a serverless HTTP endpoint using AWS.

## Requirements

### Infrastructure Setup
- Use CDK with your preferred language (TypeScript or Python preferred) to define the infrastructure.

### Region & Naming Convention
- Deploy all resources in the AWS region `us-west-2`.
- Prefix all resource names with `mycompany-` to comply with naming conventions.

### API Design
- Use AWS API Gateway to expose an HTTP endpoint.
- The endpoint should only support HTTP POST requests.
- Ensure the endpoint is integrated with AWS Lambda.

### Lambda Function
- The Lambda function must handle and process JSON payloads from incoming requests.
- Include minimal working logic to parse and log the received JSON data.

## Deliverables
Provide the full CDK code needed to define this stack, along with any necessary IAM roles or policies. Please add concise inline comments to explain each step.