---

You are an expert in Terraform HCL. Your task is to generate a **modular Terraform configuration** that builds a serverless webhook processing pipeline with multi-stage validation and dead letter queue handling.  
**All provided configuration data must remain unchanged.**  
**Where resource names require a suffix, ensure a String suffix is appended using the Terraform `random` provider for globally unique resource names.**

**Problem Statement:**  
Create a Terraform configuration to build a serverless webhook processing pipeline with multi-stage validation and dead letter queue handling. The configuration must:

1. Deploy three Lambda functions: **webhook receiver**, **payload validator**, and **transaction processor** with specific memory/timeout settings.
2. Configure an **API Gateway REST API** with request validation, API key authentication, and usage plans limiting to 1000 requests per minute.
3. Set up **DynamoDB tables** for transaction storage with on-demand billing and point-in-time recovery enabled.
4. Implement **S3 buckets** for storing raw webhook payloads and failed message archives with lifecycle policies.
5. Create **SQS queues** for message processing with a visibility timeout of 300 seconds and dead letter queue after 3 retries.
6. Configure **CloudWatch Log Groups** with 7-day retention for all Lambda functions.
7. Establish **IAM roles** with least privilege access for each Lambda function.
8. Set up **CloudWatch alarms** for Lambda errors exceeding 1% and DLQ messages exceeding 10.
9. Enable **X-Ray tracing** for all Lambda functions and API Gateway.
10. Tag all resources with `Environment`, `Project`, and `CostCenter` tags.

**Expected output:**  
A **modular Terraform configuration** with separate files for each service component, using data sources for existing resources and outputs for critical ARNs and endpoints that downstream systems will consume.

**Background:**  
A fintech startup needs a serverless event processing system to handle real-time payment notifications. The system must process webhook events from payment providers, validate them, store transaction records, and trigger downstream workflows while maintaining strict security and audit requirements.

**Environment:**  
- Serverless architecture deployed in ** ** using API Gateway for HTTP endpoints, Lambda functions for compute, DynamoDB for transaction storage, S3 for payload archival, and SQS for message queuing.
- Requires **Terraform 1.5+** with **AWS provider 5.x**.
- No VPC required as all services are fully managed.
- CloudWatch and X-Ray for monitoring and tracing.
- Estimated monthly cost under $100 for moderate traffic.

**Constraints:**  
- Lambda functions must use **Python 3.11 runtime** with architecture set to **arm64** for cost optimization.
- All S3 buckets must have **versioning enabled** and **block all public access**.
- DynamoDB tables must use **encryption at rest with AWS managed keys**.
- API Gateway must implement **request throttling and burst limits per API key**.
- Use **Terraform random provider** to generate unique suffixes for globally unique resource names.
- Lambda **environment variables containing sensitive data must reference Systems Manager Parameter Store**.
- **Ensure String suffix is appended to resource names where needed.**

**Instructions:**  
- Generate a modular Terraform configuration (HCL) strictly following all requirements, environment details, and constraints.
- Do not change or reinterpret any provided data or configuration details.
- Explicitly append a String suffix to resource names wherever required, using the Terraform `random` provider.
- Use **separate `.tf` files** for each major AWS service component (Lambda, API Gateway, DynamoDB, S3, SQS, IAM, CloudWatch/X-Ray).
- Use **data sources** for integration with existing resources as specified.
- Provide **outputs** for critical ARNs and endpoint URLs.
- All Terraform modules must be fully deployable and verifiable by AWS solution tests.

---

**Expected Output:**  
A set of modular Terraform `.tf` files defining the serverless webhook pipeline infrastructure as described above, with unique suffixes appended to resource names using the Terraform random provider and all constraints satisfied.

```