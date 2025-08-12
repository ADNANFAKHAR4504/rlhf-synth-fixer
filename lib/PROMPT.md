Environment: Design a serverless infrastructure using Pulumi with Python that includes AWS Lambda and DynamoDB in the US East (N. Virginia) region.

Requirements:

1. Implement a cost-effective serverless architecture utilizing AWS Lambda and DynamoDB.
2. Ensure the Lambda function has a timeout of **5 seconds maximum**.
3. Use a DynamoDB table with a composite primary key: partition key `ItemId` (string) and sort key `CreatedAt` (string, ISO 8601 format).
4. Configure the infrastructure to **explicitly support up to 1000 requests per minute** by:
   - Setting API Gateway stage throttle limits (burst and rate) appropriate for 1000 RPM, **and**
   - Creating an Application Auto Scaling policy or Lambda concurrency configuration (provisioned or scalable target) so the system can handle the load without relying on undocumented account defaults.
5. Ensure logging and monitoring are enabled using AWS CloudWatch:
   - Create CloudWatch Log Group(s) that will match the actual Lambda function name.
   - Add CloudWatch Alarms for Duration, Errors, and Throttles and attach SNS notifications.
6. The Lambda function must be deployed with an environment variable `DYNAMODB_TABLE_NAME` set to the table name.
7. Tag **all** AWS resources with `{"Project": "IaC-Nova-Test", "Owner": "LLM-Eval"}`.
8. Follow security best practices:
   - Create an IAM role with least-privilege policies for the Lambda to access only the specific table and its indexes.
   - Do not attach overly-broad AWS-managed policies beyond what’s necessary.
9. Include API Gateway (HTTP REST) integration for **every** method used (`GET` for listing or single-item retrieval, `POST` for create, `PUT` for update, `DELETE` for delete), ensuring path parameters (`ItemId` and `CreatedAt`) are passed correctly to Lambda with proxy integration.

Deliverable: All Pulumi program code and the Lambda function code must be contained **within a single Python file** named `serverless_setup.py`. The program must be fully deployable as-is without requiring any other files.
