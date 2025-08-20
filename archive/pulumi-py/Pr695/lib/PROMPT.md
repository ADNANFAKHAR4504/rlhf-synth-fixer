## LLM Challenge Prompt: Nova Model Breaker

You are an experienced DevOps engineer working at Turing. 
Your task is to **design and deploy a serverless infrastructure in AWS using Pulumi (Python SDK)**. The system must be production-grade, but the complexity should be just enough to trip up hallucinating LLMsnot humans. Your solution must be written in a **single Tapstack file**.

---

### Project Name:
**IaC - AWS Nova Model Breaking**

---

### Requirements:

1. **Lambda Functions**:
- Create 2 AWS Lambda functions.
- Each must process data from a **DynamoDB stream** (INSERT and MODIFY only).
- Name them using the format `dev-<resource>-<team>`.

2. **DynamoDB Table**:
- One DynamoDB table with streams enabled (`NEW_AND_OLD_IMAGES`).
- Stream should trigger both Lambda functions (event source mapping).

3. **IAM Roles (Least Privilege)**:
- Each Lambda function must have its own IAM role.
- Ensure **only required actions** are allowed (e.g., `dynamodb:GetRecords`, `logs:PutLogEvents`, etc.).

4. **Monitoring & Error Handling**:
- All Lambda functions must:
- Send logs to CloudWatch Logs.
- Be configured with Dead Letter Queue (DLQ) using SQS queue (not SNS).
- Include a basic try/except in handler code.

---

### Constraints:
- **Region**: `us-west-2`
- Use only Pulumi's Python SDK (`pulumi_aws`)
- All code must be written in **a single `.py` file**
- Avoid using constructs like `awsx` or excessive abstraction helpers
- Do not use hardcoded ARNs use references

---

### Final Deliverable:
A single Python script (`__main__.py`) using Pulumi SDK that deploys the above infrastructure without errors.

```bash
pulumi up
```
