You are a senior AWS Cloud Architect and expert infrastructure engineer.

Your task is to generate a fully functional AWS CDK program using the **Python** that defines and deploys a secure, auditable cloud environment in the **us-east-1** AWS region.

### Infrastructure Requirements:

1. **S3 Bucket**
- Must have **versioning enabled**.
- Must be configured to **trigger a Lambda function** when a new object is created.
- Enable **server access logging** for audit purposes.
- Bucket name must follow the naming convention: `proj-<resource>-<env>`.

2. **DynamoDB Table**
- Must include both a **partition key** and a **sort key**.
- Must have **point-in-time recovery** and **encryption at rest** enabled.
- Enable **CloudWatch Contributor Insights** for access pattern logging.
- Table name must follow the same naming convention.

3. **Lambda Function**
- Written in Python 3.x.
- Triggered by **S3 object creation events**.
- Must include basic logging to **CloudWatch Logs**.
- Define an **IAM role** for the Lambda with **least privilege**: only access the S3 bucket and DynamoDB table.
- Use environment variables for the table name and bucket name.

4. **IAM Roles and Policies**
- All IAM policies must follow the **principle of least privilege**.
- Create a **role for Lambda** with the necessary permissions to:
- Read from the S3 bucket
- Write to the DynamoDB table
- Log to CloudWatch
- Use **inline IAM policies** where appropriate.

5. **Audit Logging**
- Enable **CloudTrail** (or ensure all AWS-native logging features are enabled for each resource).
- Ensure **logging is configured** for:
- Lambda (via CloudWatch Logs)
- S3 (via access logs or CloudTrail)
- DynamoDB (Contributor Insights + access logging if available)

### Project Requirements:

- The CDK app should use **constructs and stacks** cleanly separated by function.
- All resources should follow the naming convention: `proj-<resource>-<env>` (e.g., `proj-s3-prod`).
- Deployment should default to the AWS region `us-east-1`.
- All code should be clean, readable, and **well-commented**, demonstrating **best practices**.
- Ensure it can be deployed with a single command: `cdk deploy`.

### Output Format:

- Provide a complete CDK project in Python:
- `app.py`
- `stack.py` (or modular construct files)
- Sample `lambda/handler.py` for Lambda logic
- README.md with deployment instructions

Generate the **complete working code**, not just snippets. Include any supporting resources (e.g., sample lambda code) and ensure it adheres to **production-grade standards**.
