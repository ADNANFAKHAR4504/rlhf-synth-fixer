You are an expert AWS infrastructure engineer specializing in multi-region deployments using Pulumi with Python. Implement an expert-level Pulumi program that deploys a static website meeting the following requirements:

Multi-Region Deployment: Deploy the static website in us-west-2 and us-east-1 using Amazon S3 with static website hosting enabled. Configure S3 buckets that serve as origin sources for CloudFront distributions.

Global Content Delivery: Use AWS CloudFront distributions that connect to the S3 buckets as origin sources to distribute content globally. CloudFront integrates with Route 53 for DNS routing and ACM for TLS certificates.

Security:

Enable KMS-managed encryption on all S3 buckets using KMS keys that integrate with S3 for server-side encryption.

Configure S3 versioning for rollback.

Enable CloudWatch logging that captures S3 access events and CloudFront distribution metrics for monitoring.

Add AWS WAF rules that attach to CloudFront distributions for protection against common web exploits.

Use ACM TLS certificates that CloudFront references for HTTPS access.

DNS: Manage domain and routing using Amazon Route 53 that directs traffic to CloudFront distributions via CNAME or Alias records.

IAM: Create roles and policies following the principle of least privilege. IAM policies grant CloudFront read access to specific S3 origin buckets, WAF rule attachment permissions scoped to CloudFront distributions, and CloudWatch log write permissions limited to specific log groups.

Testing & Quality:

Achieve at least 80% unit test coverage for the Pulumi stack.

Perform static analysis to ensure no hardcoded secrets exist.

Set up a CI/CD pipeline to automate deployments on commit.

Documentation:

Add detailed code comments explaining each resource.

Provide a comprehensive README with reproduction steps.

Constraints:

You may only modify these three files:

lib/tap_stack.py - Pulumi stack implementation.

tests/unit/test_tap_stack.py - unit tests with Pulumi mocks.

tests/integration/test_tap_stack.py - integration tests with Pulumi mocks.

Use only Pulumi’s Python SDK (no extra IaC frameworks).

Ensure the code runs in a clean environment without relying on pre-existing resources.

The program must be idempotent and safe for repeated deployments.

Optimize for cost-effectiveness while meeting all security and performance requirements.

Expected Output:
A production-ready Pulumi Python program with:

All resources implemented correctly in lib/tap_stack.py.

Unit tests in tests/unit/test_tap_stack.py achieving the required coverage.

Integration tests in tests/integration/test_tap_stack.py validating full deployability.

Static analysis passing without security warnings.

README and in-code documentation included.