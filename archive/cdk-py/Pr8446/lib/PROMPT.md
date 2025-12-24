Need a Python CDK script to set up serverless S3 processing with multiple environments.

Here's what I need:

**Infrastructure Setup:**

- S3 bucket that triggers a Lambda function when objects are created
- Lambda function in Python that processes S3 events
- DynamoDB table to store object metadata
- Separate deployments for dev and prod environments

**Lambda Function Requirements:**

The Lambda needs to:
- Get triggered only on S3 ObjectCreated events
- Extract the object name from the S3 event
- Log the object name to CloudWatch
- Store metadata in DynamoDB with ObjectID as partition key - must be String type

**IAM and Security:**

Lambda IAM role should have these specific permissions:
- Write to its CloudWatch log group
- s3:GetObject and s3:GetObjectAcl on the bucket only
- dynamodb:PutItem on the table only

No wildcards - keep it tight for least privilege.

**Environment Handling:**

Use CDK stacks to manage dev vs prod configurations. Each environment gets its own S3 bucket, Lambda, and DynamoDB table. Tag everything with Environment=dev or Environment=prod so we can track resources.

**Outputs:**

Export the S3 bucket name and Lambda ARN for each environment so other stacks can reference them.

**Deliverables:**

- app.py with the CDK stack definition
- lambda_handler.py with the function logic

Make it modular and production-ready. We'll be deploying this to both environments so it needs to be solid.
