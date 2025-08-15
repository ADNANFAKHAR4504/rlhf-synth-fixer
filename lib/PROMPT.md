## Prompt

You are tasked with setting up a Continuous Integration and Continuous Deployment (CI/CD) pipeline entirely within AWS for a serverless application using Pulumi in Python.
The pipeline must handle both infrastructure provisioning and application deployments securely and scalably, without relying on any external GitHub repositories or services.

**Specific requirements:**

- Implement the pipeline using Pulumi Python SDK.
- Provision necessary AWS resources consistently: S3 buckets, Lambda functions, API Gateway, CodeBuild, CodePipeline, and CloudWatch.
- Implement zero downtime deployment strategies using native AWS deployment mechanisms (e.g., Lambda traffic shifting).
- Include rollback mechanisms natively supported by AWS CodePipeline to handle deployment failures.
- Set up comprehensive logging and monitoring with AWS CloudWatch.
- Follow AWS security best practices: isolated environments, IAM roles with strict permissions.
- Use AWS scaling features for scalability and cost optimization.
- Use only AWS native services (CodeCommit for source control, CodePipeline, CodeBuild, S3, Lambda, API Gateway, CloudWatch).
- The solution must be implemented in Python using the Pulumi SDK.

**ProjectName:** IaC - AWS Nova Model Breaking

**Constraints:**

- Make sure it falls in one single file.
- No external source control or pipeline services (e.g., GitHub) allowed.
- The pipeline must handle infrastructure provisioning and application deployment stages entirely within AWS services.
- Zero downtime deployments via AWS Lambda deployment strategies.
- Rollbacks supported by AWS CodePipeline native mechanisms.
- Strict IAM role and permission enforcement for security.
- Full stack implementation using Pulumi Python SDK and AWS native services only.
