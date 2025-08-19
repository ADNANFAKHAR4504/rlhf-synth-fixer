# Expert-Level Pulumi CI/CD Pipeline Integration (Python) with Enhanced Security and Compliance

You are an expert DevOps engineer specializing in advanced CI/CD pipeline integrations using Pulumi and AWS.

Design a single Python-based Pulumi infrastructure-as-code configuration file that integrates seamlessly with an existing GitHub repository's GitHub Actions CI/CD pipeline. The pipeline must automatically trigger on every push to the main branch.

The Pulumi stack should deploy all resources into the AWS region **us-west-2** and adhere to the following enhanced constraints:

1. **AWS KMS Implementation**: Create AWS KMS keys with automatic key rotation enabled for encryption of Secrets Manager secrets and S3 bucket encryption. Use `aws.get_caller_identity()` to dynamically generate valid KMS policies. Set deletion window to 0 for development environments (Note: Set to 7 days for production).

2. **Zero Hardcoded Secrets**: Implement secure secret management using `pulumi_random.RandomPassword` for all sensitive data including database passwords, API keys, and access tokens. All secrets must be dynamically generated during deployment using Pulumi's random provider.

3. **Python 3.12 Runtime**: Use Python 3.12 runtime for all Lambda functions and ensure compatibility with the latest language standards.

4. **Policy as Code (PaC)**: Implement compliance policies using IAM policies and roles that enforce security standards. Create AWS Config-compatible IAM roles and policies for tagging compliance, S3 encryption enforcement, and Lambda function security. Note: Use simplified IAM-based compliance policies instead of complex AWS Config Rules to avoid cross-account permission issues.

5. **Budget Management**: Implement automated infrastructure validation with AWS Budgets, strictly enforcing a monthly budget cap of **$15** with 80% and 100% threshold notifications.

6. **Secrets Management**: Securely manage all sensitive credentials using AWS Secrets Manager with KMS encryption. Ensure all secrets are encrypted at rest using the custom KMS key.

7. **Automatic Rollback**: Implement intelligent rollback functionality using Lambda function versioning and CloudWatch alarms instead of CodeDeploy to avoid cross-account permission constraints. Create custom rollback Lambda functions that can revert to previous versions when CloudWatch alarms detect failures.

8. **Multi-Region Architecture**: Implement a multi-region deployment strategy with us-west-2 as primary and us-east-1 as secondary for high availability.

9. **Testing Strategy**: Create comprehensive unit tests with proper mocking and integration tests with dynamic resource naming based on environment variables. Avoid hardcoded resource names in tests.

10. **Documentation**: Provide comprehensive documentation within the same file that outlines setup instructions, follows Pulumi best practices for code organization and structure, and details pipeline integration.

**Implementation Notes:**

- Use `pulumi_random.RandomPassword` for all secret generation
- Implement KMS encryption for S3 buckets and Secrets Manager
- Create custom rollback mechanisms using Lambda versioning and CloudWatch
- Use environment-based dynamic resource naming
- Implement IAM-based compliance policies as an alternative to AWS Config Rules
- Ensure all resources have proper tagging for cost allocation

The final deliverable must be a **standalone, production-ready Python Pulumi file** suitable for immediate use within the existing GitHub repository for CI/CD automation, without requiring access to or modification of internal AWS accounts or external CI/CD pipeline configurations.

---

**Project Name:** IaC - AWS Nova Model Breaking  
**Difficulty:** Expert
