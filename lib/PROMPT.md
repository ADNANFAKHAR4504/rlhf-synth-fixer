# Redefined Prompt for AI Review

---

## ✅ Prompt:

> **Act as a Solution Architect.**
>
> Design and implement a **secure, scalable, and observable AWS infrastructure** for a web application using the **AWS CDK in Python**. The infrastructure must be deployed in the `us-west-2` region and follow security and operational best practices.
>
> The architecture should include:
>
> 1. **Amazon S3 buckets** for static content and logging:
>    - Server-side encryption enabled (SSE-KMS for main bucket, SSE-S3 for logs).
>    - Access logging enabled.
>    - Public access blocked.
>    - Lifecycle rules for log expiration and storage transitions.
>
> 2. **IAM roles and policies**:
>    - Least privilege principle.
>    - Separate roles for EC2 and Lambda.
>    - EC2 role with S3 access policy.
>
> 3. **Amazon CloudFront distribution**:
>    - Serves content from S3.
>    - Logging enabled to a dedicated S3 bucket.
>    - Security headers policy.
>    - Enforces HTTPS (TLS v1.2+).
>
> 4. **Auto Scaling Group (ASG) for EC2**:
>    - Launch template with Amazon Linux 2.
>    - Security groups for ALB and EC2.
>    - Scaling on CPU utilization.
>    - EBS volume encryption enabled.
>
> 5. **Application Load Balancer (ALB)**:
>    - Public-facing.
>    - Forwards HTTP traffic to EC2.
>
> 6. **Monitoring and alerting**:
>    - CloudWatch Alarms for EC2 CPU, ALB 5xx, CloudFront 4xx.
>    - CloudWatch Dashboard.
>    - SNS topic for alerts.
>
> 7. **Secrets management**:
>    - Secrets Manager for DB credentials and API keys.
>
> 8. **Outputs**:
>    - S3 bucket name, CloudFront domain, and ALB DNS are exported as stack outputs.
>
> ---
>
> ### 📄 Output:
>
> Provide a **Python-based AWS CDK application** (e.g., `tap_stack.py`), with:
>
> - All resources and configurations as described above.
> - Unit tests (using CDK assertions) that verify:
>     - Resource counts (S3 buckets, KMS key, ALB, ASG, CloudFront, etc.)
>     - Key resource properties (encryption, versioning, outputs, etc.)
> - Integration tests (using boto3) that validate:
>     - Deployed S3 bucket exists and is accessible.
>     - CloudFront distribution exists.
>     - ALB exists and is active.
> - No ACM certificate or WAF configuration is required.
> - No requirement for custom bucket names (CDK-generated names are acceptable).
>
> The code should be:
> - Deployable with `cdk deploy`
> - Written for AWS CDK v2 in Python
> - Aligned with the tested and implemented features in the provided files
>
> ---