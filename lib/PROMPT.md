> **Act as an experienced AWS Solution Architect.**
>
> You are tasked with designing and implementing a secure, compliant cloud infrastructure across multiple AWS accounts and regions using **AWS CDK in Python**. Your focus is on applying **security best practices** and **compliance automation** via Infrastructure as Code.
>
> Specifically, you need to build a CDK project targeting the `us-west-2` region that implements the following security configurations:
>
>  1. All S3 buckets are **private by default** (block all public access) and use customer-managed KMS encryption.
> 2. A customer-managed KMS key is created and used for S3, CloudWatch Logs, RDS, Lambda, and SQS encryption.
> 3. IAM roles are created for services (e.g., VPC Flow Logs, AWS Config) with **inline policies** (not managed policies).
> 4. A VPC is created with **Flow Logs** enabled, logs are sent to a KMS-encrypted CloudWatch Log Group.
> 5. **Security groups** restrict SSH (port 22) to private network ranges (10.0.0.0/8); no unrestricted inbound access.
> 6. **RDS instance** is encrypted, not publicly accessible, and resides in private subnets.
> 7. **Lambda function** is created with a Dead Letter Queue (DLQ), VPC configuration, and KMS environment encryption.
> 8. **CloudTrail** is enabled and logs are sent to a centralized, encrypted S3 bucket with proper bucket and KMS policies.
> 9. **AWS Config** is enabled with a managed rule for S3 public access, and proper dependencies are set between the recorder, delivery channel, and rule.
> 10. All key resource ARNs/IDs are output for integration testing.
>
>
> ### Additional Instructions:
>
> * Use **modular CDK constructs** for each control to keep the code reusable and scalable.
> * The output should be a fully functional **AWS CDK Python app** using best practices.
> * The final solution should include **compliance validation**, either through AWS Config, assertions in CDK, or comments on how to test enforcement.
>
> Please generate the full CDK Python application structure in:  `stack.py` 

---