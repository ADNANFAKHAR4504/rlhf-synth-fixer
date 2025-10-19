# Serverless Infrastructure with AWS CloudFormation (JSON)

## High-level Architecture

Design a **serverless application** in **AWS CloudFormation (JSON)** for the **us-east-1** region.
The system must include:

- **API Gateway** exposing `/v1/resource` (GET, POST) integrated with a **Lambda** function.
- **Lambda** writes logs to **S3** (`project-logs-<environment>`) and **CloudWatch Logs**.
- **IAM Roles** granting least-privilege permissions.
- **CloudFormation Metadata** documenting deployment and verification.

---

## Functional Requirements

1. **Serverless setup** using **API Gateway** and **Lambda** only.
2. API resource `/v1/resource` supports GET and POST.
3. Lambda can write logs to an S3 bucket (`project-logs-<environment>`).
4. **IAM Roles**:
   - Lambda role: minimal S3 and CloudWatch permissions.
   - API Gateway role: CloudWatch access logging only.

5. **Logging**:
   - Enable CloudWatch logs for Lambda and API Gateway.
   - Lambda writes execution logs to S3.

6. **Tagging**: Every resource tagged with `environment` and `project`.
7. **Template Metadata** includes:
   - Validation (`aws cloudformation validate-template`)
   - Deployment (`aws cloudformation deploy`)
   - Verification (API call, CloudWatch, S3 check)
   - Cleanup instructions

8. **Outputs**: API endpoint URL, Lambda ARN, and S3 bucket name.

---

## Acceptance Criteria

- Template file: `serverless_setup.json` (valid JSON).
- Deploys successfully in **us-east-1** using AWS CLI.
- API `/v1/resource` handles GET and POST via Lambda.
- Lambda logs appear in **CloudWatch** and **S3**.
- API Gateway access logs visible in CloudWatch.
- IAM policies use **least privilege** (no wildcards).
- All resources properly tagged.
- Metadata includes clear deployment and cleanup steps.
