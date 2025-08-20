# Claude SonnetStyle Prompt: Multi-Region Serverless Deployment with Lambda & API Gateway

You are an expert AWS infrastructure engineer working with AWS CDK (Python preferred) or CloudFormation.

---

## Objective

Design and implement a secure, highly available AWS cloud environment that spans **multiple regions**, focusing on **serverless components** including:

- AWS Lambda
- Amazon API Gateway
- IAM roles and policies

---

## High Availability & Multi-Region Deployment

- **Deploy AWS Lambda functions across multiple AWS regions** to improve availability and fault tolerance.
- Ensure the design supports future scalability and regional failover if necessary.
- Avoid region-specific hardcoding. All deployments should be region-agnostic and configurable.

---

## API Gateway Configuration

- **Configure Amazon API Gateway** to **efficiently route client requests** to the appropriate Lambda functions based on region, latency, or availability.
- Implement a strategy that supports global or multi-regional APIs using best practices.
- Ensure endpoints are RESTful or HTTP-based and secured properly.

---

## Security & IAM

- **Define IAM roles and policies** that follow the **principle of least privilege**:
- Lambda functions should only have access to the specific services or actions they require.
- Reuse IAM roles where appropriate, while keeping permissions tightly scoped.

---

## Implementation Guidelines

- Use **AWS CDK (Python)** or **CloudFormation** as the infrastructure-as-code tool.
- Ensure the solution is **modular, reusable, and region-configurable**.
- Provide complete code that:
- Provisions API Gateway and multi-region Lambda deployments
- Includes all necessary IAM roles/policies
- Can be deployed easily with `cdk deploy` or equivalent

---

## Deliverables

- Full infrastructure code (CDK app or CFN template)
- Modular structure with clearly defined regions and deployment logic
- All components securely connected and following AWS best practices for:
- High availability
- Least privilege access
- Serverless design

