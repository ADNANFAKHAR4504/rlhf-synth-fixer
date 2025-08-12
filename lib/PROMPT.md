# Revised Prompt (Aligned to Current Implementation)

Environment: Design a serverless infrastructure using Pulumi with Python that deploys to **us-east-1 (N. Virginia)**.

## Requirements

1. **Single File Deployment**
   - All Pulumi resources and AWS Lambda code must be contained in a single Python file named `serverless_setup.py`.
   - No external files or zipped packages — embed Lambda code inline as a `StringAsset` or equivalent.

2. **Lambda Function**
   - Runtime: `python3.9`
   - Timeout: `5` seconds
   - Memory: `128 MB`
   - Environment variable: `DYNAMODB_TABLE_NAME` set to the DynamoDB table name.
   - Contains inline Python code implementing full CRUD (`GET`, `POST`, `PUT`, `DELETE`) against DynamoDB.
   - Deployed from the inline code string via `pulumi.AssetArchive`.

3. **DynamoDB Table**
   - Name format: `<project_name>-items`
   - Keys:
     - Partition key: `ItemId` (string)
     - Sort key: `CreatedAt` (string, ISO 8601)
   - Billing mode: `PAY_PER_REQUEST`

4. **API Gateway (REST v1)**
   - Create a REST API and resources:
     - `/items`
     - `/items/{ItemId}`
     - `/items/{ItemId}/{CreatedAt}`
   - Methods:
     - `GET`, `POST` on `/items`
     - `GET`, `PUT`, `DELETE` on `/items/{ItemId}/{CreatedAt}`
     - `OPTIONS` for all resources for CORS support
   - Integrate all methods with Lambda via `AWS_PROXY`.
   - Deploy to stage `prod`.

5. **Scalability**
   - API Gateway stage throttling:
     - `rate_limit = 17` (≈1000 RPM)
     - `burst_limit = 50`
   - Lambda `ProvisionedConcurrencyConfig` with `provisioned_concurrency_units = 20`.

6. **Logging & Monitoring**
   - CloudWatch Log Group: `/aws/lambda/<lambda_function_name>`, retention = 14 days.
   - CloudWatch Metric Alarms for:
     - Duration (threshold 4000 ms)
     - Errors (threshold ≥ 1)
     - Throttles (threshold ≥ 1)
   - SNS topic for alarm notifications.

7. **IAM & Security**
   - IAM role for Lambda with:
     - `AWSLambdaBasicExecutionRole` for logs.
     - Custom least-privilege policy for the DynamoDB table and its indexes.
   - Avoid overly broad permissions.

8. **Tagging**
   - Apply `{"Project": "IaC-Nova-Test", "Owner": "LLM-Eval"}` to all AWS resources.

9. **Pulumi Exports**
   - `api_gateway_url`
   - `dynamodb_table_name`
   - `lambda_function_name`
   - `sns_topic_arn`
   - `api_gateway_id`

10. **Deliverable**
    - A single Python file (`serverless_setup.py`) that meets all requirements and is deployable via:
      ```bash
      pulumi up
      ```
