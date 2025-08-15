# Prompt: Terraform Serverless Setup (Lambda + API Gateway + Secrets Manager) in us-east-1

## Goal
Create a secure serverless setup in **AWS us-east-1** using Terraform (HCL) with:
- AWS Lambda (Python dummy handler) logging to CloudWatch.
- API Gateway HTTP endpoint with IAM authentication.
- AWS Secrets Manager for Lambda environment variables.

## Requirements
1. **Lambda Function**
   - Python runtime (dummy handler).
   - Logs events to CloudWatch.
   - Retrieves environment variables from Secrets Manager.

2. **API Gateway**
   - HTTP endpoint exposing Lambda.
   - IAM-based authentication.
   - Lambda proxy integration.

3. **Secrets Manager**
   - Store Lambda environment variables securely.
   - IAM policy granting Lambda `secretsmanager:GetSecretValue` only for its secret.

4. **Region**
   - All resources must be deployed in **us-east-1**.

## Expected Outcome
- Deploy Terraform code to create the stack.
- API Gateway endpoint triggers Lambda successfully.
- Lambda retrieves and logs secrets from Secrets Manager.
- Unauthorized requests are blocked by IAM authentication.

## Deliverables
- **Terraform files**: `providers.tf`, `lambda.tf`, `apigw.tf`, `secrets.tf`, `iam.tf`, `variables.tf`, `outputs.tf`
- **Python Lambda handler**: `handler.py`
- **README.md** with:
  - Deployment steps.
  - How to invoke the API with IAM auth.
  - How to view CloudWatch logs.
  - Cleanup instructions (`terraform destroy`).

## Testing
- Positive test: Authorized request returns 200 OK and logs secret value.
- Negative test: Unauthorized request returns 403/401.

---
