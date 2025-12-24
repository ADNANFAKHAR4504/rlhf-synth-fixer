Need to set up a multi-layer security infrastructure in AWS using CDK Python for the us-west-2 region. This is for a compliance audit and everything needs to be locked down tight.

Here's what needs to be connected:

**Storage and Encryption Layer:**
- S3 buckets need to be completely private with a custom KMS key for encryption
- The same KMS key should encrypt CloudWatch Logs, RDS data, Lambda environment variables, and SQS messages
- All the encryption needs to work together so the key policy allows each service to use it

**Network Security:**
- VPC with Flow Logs that stream to CloudWatch Logs
- The log group receiving flow logs must use the KMS key for encryption
- Security groups that block SSH from the internet - only allow from private ranges like 10.0.0.0/8
- RDS instance sitting in private subnets, not publicly accessible, encrypted with the KMS key

**Compute and Processing:**
- Lambda function configured to run inside the VPC
- Lambda needs a Dead Letter Queue for failed invocations - SQS queue encrypted with KMS
- Lambda environment variables also encrypted with the same KMS key
- The Lambda needs proper IAM permissions to write to the DLQ

**Audit and Compliance:**
- CloudTrail sending all management events to an encrypted S3 bucket
- The CloudTrail bucket needs a bucket policy allowing CloudTrail to write logs
- AWS Config enabled with the S3 public access check rule
- Config needs a recorder that writes findings to an S3 bucket, and a delivery channel connecting the recorder to the bucket
- Make sure the Config recorder starts only after the delivery channel is created

**IAM Setup:**
- Create service roles with inline policies for VPC Flow Logs and AWS Config
- Don't use managed policies - write the specific permissions needed
- Each role should have least privilege for its service

**Testing Outputs:**
- Export all the critical ARNs and IDs like the KMS key, VPC ID, Lambda ARN, S3 bucket names
- These outputs are needed for integration tests to verify everything's configured correctly

Build this as a modular CDK Python app in stack.py. Each security control should be its own construct or clearly separated so it's easy to update individual pieces later.
